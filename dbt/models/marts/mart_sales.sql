-- models/marts/mart_sales.sql
-- Mart de ventas con métricas de negocio
-- =======================================

{{
    config(
        materialized='table',
        partition_by={
            "field": "date",
            "data_type": "date"
        }
    )
}}

with orders as (
    select * from {{ ref('stg_orders') }}
    where status not in ('cancelled', 'fraudulent')
),

daily_sales as (
    select
        date(created_at) as date,
        country,
        source,

        -- Métricas de volumen
        count(*) as total_orders,
        count(distinct customer_id) as unique_customers,
        sum(products_count) as total_items,

        -- Métricas de valor
        sum(total_amount) as gross_revenue,
        avg(total_amount) as avg_order_value,
        percentile_cont(0.5) within group (order by total_amount) as median_order_value,
        min(total_amount) as min_order_value,
        max(total_amount) as max_order_value,

        -- Métricas de conversión por fuente
        sum(case when source = 'whatsapp' then total_amount else 0 end) as revenue_whatsapp,
        sum(case when source = 'shopify' then total_amount else 0 end) as revenue_shopify,
        sum(case when source = 'web' then total_amount else 0 end) as revenue_web,
        sum(case when source = 'api' then total_amount else 0 end) as revenue_api,

        -- Conteo por fuente
        count(case when source = 'whatsapp' then 1 end) as orders_whatsapp,
        count(case when source = 'shopify' then 1 end) as orders_shopify,
        count(case when source = 'web' then 1 end) as orders_web,
        count(case when source = 'api' then 1 end) as orders_api,

        -- Métricas de entrega
        count(case when delivered_at is not null then 1 end) as delivered_orders,
        avg(hours_to_delivery) as avg_hours_to_delivery,

        -- Tasa de cancelación
        count(case when is_cancelled then 1 end) as cancelled_orders

    from orders
    group by 1, 2, 3
),

with_comparisons as (
    select
        *,

        -- Tasa de entrega
        delivered_orders::float / nullif(total_orders, 0) as delivery_rate,

        -- Tasa de cancelación
        cancelled_orders::float / nullif(total_orders, 0) as cancellation_rate,

        -- Comparación con día anterior
        lag(total_orders) over (partition by country, source order by date) as prev_day_orders,
        lag(gross_revenue) over (partition by country, source order by date) as prev_day_revenue,

        -- Comparación con semana anterior
        lag(total_orders, 7) over (partition by country, source order by date) as prev_week_orders,
        lag(gross_revenue, 7) over (partition by country, source order by date) as prev_week_revenue

    from daily_sales
)

select
    *,

    -- Cambio vs día anterior
    total_orders - coalesce(prev_day_orders, 0) as orders_change_dod,
    gross_revenue - coalesce(prev_day_revenue, 0) as revenue_change_dod,

    -- % crecimiento WoW (semana a semana)
    case
        when prev_week_orders > 0 then
            (total_orders - prev_week_orders)::float / prev_week_orders
        else null
    end as orders_growth_wow,

    case
        when prev_week_revenue > 0 then
            (gross_revenue - prev_week_revenue)::float / prev_week_revenue
        else null
    end as revenue_growth_wow,

    -- Ticket promedio
    gross_revenue::float / nullif(total_orders, 0) as average_ticket,

    -- Metadata
    current_timestamp as _loaded_at

from with_comparisons
