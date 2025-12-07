# Data Warehouse y Analytics - Litper

## Visión General

El Data Warehouse de Litper centraliza datos para análisis, reportes y machine learning usando dbt para transformaciones.

## Arquitectura de Datos

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FUENTES DE DATOS                             │
│                                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │PostgreSQL│  │ MongoDB  │  │  Dropi   │  │Transporta│            │
│  │  (OLTP)  │  │  (Logs)  │  │   API    │  │  doras   │            │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘            │
│       │             │             │             │                    │
└───────┼─────────────┼─────────────┼─────────────┼────────────────────┘
        │             │             │             │
        └─────────────┴──────┬──────┴─────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          DATA LAKE                                   │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                          S3                                      ││
│  │  raw/ │ staging/ │ processed/ │ analytics/                      ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       DATA WAREHOUSE                                 │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    BigQuery / Snowflake                          ││
│  │                                                                   ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                       ││
│  │  │  STAGING │  │INTERMEDIATE│ │  MARTS   │                       ││
│  │  │  (raw)   │──▶│ (clean)  │──▶│ (ready) │                       ││
│  │  └──────────┘  └──────────┘  └──────────┘                       ││
│  │                                                                   ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         CONSUMO                                      │
│                                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ Metabase │  │ Looker   │  │   ML     │  │   API    │            │
│  │   (BI)   │  │  Studio  │  │ Models   │  │ Analytics│            │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
└─────────────────────────────────────────────────────────────────────┘
```

## Estructura dbt

```
dbt/
├── dbt_project.yml
├── profiles.yml
├── models/
│   ├── staging/
│   │   ├── stg_orders.sql
│   │   ├── stg_guides.sql
│   │   ├── stg_incidents.sql
│   │   └── stg_customers.sql
│   ├── intermediate/
│   │   ├── int_order_guide_joined.sql
│   │   └── int_customer_metrics.sql
│   └── marts/
│       ├── mart_sales.sql
│       ├── mart_logistics.sql
│       ├── mart_customers.sql
│       └── mart_agents.sql
├── macros/
│   └── common.sql
└── tests/
    └── schema.yml
```

## Modelos de Staging

### stg_orders

```sql
-- models/staging/stg_orders.sql
{{ config(materialized='incremental', unique_key='order_id') }}

select
    id as order_id,
    external_id,
    customer_id,
    country,
    source,
    status,
    total_amount,
    currency,

    -- Tiempos
    created_at,
    updated_at,
    delivered_at,

    -- Métricas derivadas
    case
        when delivered_at is not null
        then extract(epoch from delivered_at - created_at) / 3600
    end as hours_to_delivery,

    case
        when status = 'delivered' then 'completed'
        when status in ('cancelled', 'returned') then 'failed'
        else 'in_progress'
    end as order_stage

from {{ source('litper', 'raw_orders') }}

{% if is_incremental() %}
where updated_at > (select max(updated_at) from {{ this }})
{% endif %}
```

### stg_guides

```sql
-- models/staging/stg_guides.sql
{{ config(materialized='incremental', unique_key='guide_id') }}

select
    id as guide_id,
    tracking_number,
    order_id,
    carrier,
    country,
    status,

    -- Tiempos
    created_at,
    picked_up_at,
    in_transit_at,
    delivered_at,
    returned_at,

    -- Intentos
    delivery_attempts,

    -- Métricas derivadas
    case
        when delivered_at is not null
        then date_diff('day', created_at, delivered_at)
    end as days_in_transit,

    delivery_attempts = 1 and delivered_at is not null as first_attempt_success

from {{ source('litper', 'raw_guides') }}

{% if is_incremental() %}
where updated_at > (select max(updated_at) from {{ this }})
{% endif %}
```

## Modelos de Marts

### mart_sales

```sql
-- models/marts/mart_sales.sql
{{ config(materialized='table', partition_by={"field": "date", "data_type": "date"}) }}

with orders as (
    select * from {{ ref('stg_orders') }}
),

daily_metrics as (
    select
        date(created_at) as date,
        country,
        source,

        -- Volumen
        count(*) as total_orders,
        count(case when order_stage = 'completed' then 1 end) as completed_orders,
        count(case when order_stage = 'failed' then 1 end) as failed_orders,

        -- Revenue
        sum(total_amount) as total_revenue,
        avg(total_amount) as avg_order_value,

        -- Tiempos
        avg(hours_to_delivery) as avg_hours_to_delivery

    from orders
    group by 1, 2, 3
)

select
    *,
    completed_orders::float / nullif(total_orders, 0) as completion_rate,

    -- Comparación WoW
    lag(total_orders, 7) over (
        partition by country, source order by date
    ) as orders_last_week,

    (total_orders - lag(total_orders, 7) over (
        partition by country, source order by date
    ))::float / nullif(lag(total_orders, 7) over (
        partition by country, source order by date
    ), 0) as orders_wow_growth

from daily_metrics
```

### mart_logistics

```sql
-- models/marts/mart_logistics.sql
{{ config(materialized='table', partition_by={"field": "date", "data_type": "date"}) }}

with carrier_performance as (
    select
        date(created_at) as date,
        country,
        carrier,

        count(*) as total_guides,
        count(case when guide_stage = 'delivered' then 1 end) as delivered,
        count(case when guide_stage = 'returned' then 1 end) as returned,

        avg(days_in_transit) as avg_days_to_delivery,
        count(case when first_attempt_success then 1 end) as first_attempt_deliveries

    from {{ ref('stg_guides') }}
    group by 1, 2, 3
),

incident_metrics as (
    select
        date(created_at) as date,
        country,
        carrier,
        count(*) as total_incidents,
        count(case when resolved_at is not null then 1 end) as resolved_incidents
    from {{ source('litper', 'raw_incidents') }}
    group by 1, 2, 3
)

select
    coalesce(c.date, i.date) as date,
    coalesce(c.country, i.country) as country,
    coalesce(c.carrier, i.carrier) as carrier,

    -- Métricas de carrier
    c.total_guides,
    c.delivered,
    c.returned,
    c.avg_days_to_delivery,
    c.first_attempt_deliveries,

    -- Tasas
    c.delivered::float / nullif(c.total_guides, 0) as delivery_rate,
    c.first_attempt_deliveries::float / nullif(c.delivered, 0) as first_attempt_rate,

    -- Novedades
    coalesce(i.total_incidents, 0) as total_incidents,
    i.total_incidents::float / nullif(c.total_guides, 0) as incident_rate,

    -- Carrier Score (0-100)
    (
        coalesce(c.delivered::float / nullif(c.total_guides, 0), 0) * 40 +
        coalesce(c.first_attempt_deliveries::float / nullif(c.delivered, 0), 0) * 30 +
        (1 - coalesce(i.total_incidents::float / nullif(c.total_guides, 0), 0)) * 20 +
        (1 - least(coalesce(c.avg_days_to_delivery, 0) / 5, 1)) * 10
    ) * 100 as carrier_score

from carrier_performance c
full outer join incident_metrics i
    on c.date = i.date
    and c.country = i.country
    and c.carrier = i.carrier
```

## Dashboards

### Dashboard de Ventas

| Métrica | Descripción |
|---------|-------------|
| Total Pedidos | Pedidos del período |
| Revenue | Ingresos totales |
| AOV | Valor promedio de pedido |
| Completion Rate | % pedidos completados |
| WoW Growth | Crecimiento semana a semana |

### Dashboard de Logística

| Métrica | Descripción |
|---------|-------------|
| Delivery Rate | % entregas exitosas |
| Avg Days to Deliver | Tiempo promedio entrega |
| First Attempt Rate | % entregas primer intento |
| Incident Rate | % novedades |
| Carrier Score | Puntuación transportadora |

### Dashboard de Agentes IA

| Métrica | Descripción |
|---------|-------------|
| Tasks Processed | Tareas procesadas |
| Success Rate | % éxito |
| Avg Response Time | Tiempo promedio respuesta |
| Token Usage | Consumo de tokens |
| Cost per Task | Costo por tarea |

## Ejecución dbt

### Comandos

```bash
# Ejecutar todos los modelos
dbt run

# Ejecutar solo staging
dbt run --select staging

# Ejecutar marts específico
dbt run --select mart_sales

# Tests
dbt test

# Documentación
dbt docs generate
dbt docs serve
```

### Programación

| Modelo | Frecuencia |
|--------|------------|
| Staging | Cada hora |
| Marts | Diario 4AM |
| Snapshots | Diario 3AM |

## Calidad de Datos

### Tests

```yaml
# models/schema.yml
version: 2

models:
  - name: stg_orders
    columns:
      - name: order_id
        tests:
          - unique
          - not_null
      - name: country
        tests:
          - accepted_values:
              values: ['CO', 'MX', 'PE', 'EC']
      - name: total_amount
        tests:
          - not_null
          - dbt_utils.expression_is_true:
              expression: ">= 0"
```

### Freshness

```yaml
sources:
  - name: litper
    freshness:
      warn_after: {count: 12, period: hour}
      error_after: {count: 24, period: hour}
    tables:
      - name: raw_orders
      - name: raw_guides
```

## Archivos de Implementación

- `dbt/dbt_project.yml`: Configuración del proyecto
- `dbt/models/staging/`: Modelos de staging
- `dbt/models/marts/`: Marts de análisis
