-- models/marts/mart_logistics.sql
-- Mart de logística y entregas
-- =============================

{{
    config(
        materialized='table',
        partition_by={
            "field": "date",
            "data_type": "date"
        }
    )
}}

with guides as (
    select * from {{ ref('stg_guides') }}
),

incidents as (
    select * from {{ source('litper', 'raw_incidents') }}
),

carrier_performance as (
    select
        date(created_at) as date,
        country,
        carrier,

        -- Volumen
        count(*) as total_guides,

        -- Entregas
        count(case when guide_stage = 'delivered' then 1 end) as delivered,
        count(case when guide_stage = 'returned' then 1 end) as returned,
        count(case when guide_stage = 'in_transit' then 1 end) as in_transit,

        -- Tiempos
        avg(days_in_transit) as avg_days_to_delivery,
        percentile_cont(0.5) within group (order by days_in_transit) as median_days_to_delivery,
        percentile_cont(0.95) within group (order by days_in_transit) as p95_days_to_delivery,

        -- Primera entrega exitosa
        count(case when first_attempt_success then 1 end) as first_attempt_deliveries,

        -- Intentos promedio
        avg(delivery_attempts) as avg_delivery_attempts

    from guides
    group by 1, 2, 3
),

incident_metrics as (
    select
        date(created_at) as date,
        country,
        carrier,

        -- Por tipo
        count(*) as total_incidents,
        count(case when incident_type = 'not_home' then 1 end) as incidents_not_home,
        count(case when incident_type = 'wrong_address' then 1 end) as incidents_wrong_address,
        count(case when incident_type = 'refused' then 1 end) as incidents_refused,
        count(case when incident_type = 'damaged' then 1 end) as incidents_damaged,
        count(case when incident_type = 'lost' then 1 end) as incidents_lost,
        count(case when incident_type = 'other' then 1 end) as incidents_other,

        -- Resolución
        count(case when resolved_at is not null then 1 end) as resolved_incidents,
        avg(extract(epoch from resolved_at - created_at) / 3600) as avg_resolution_hours,

        -- Por severidad
        count(case when priority = 'critical' then 1 end) as critical_incidents,
        count(case when priority = 'high' then 1 end) as high_incidents,
        count(case when priority = 'medium' then 1 end) as medium_incidents,
        count(case when priority = 'low' then 1 end) as low_incidents

    from incidents
    group by 1, 2, 3
)

select
    coalesce(c.date, i.date) as date,
    coalesce(c.country, i.country) as country,
    coalesce(c.carrier, i.carrier) as carrier,

    -- Carrier metrics
    coalesce(c.total_guides, 0) as total_guides,
    coalesce(c.delivered, 0) as delivered,
    coalesce(c.returned, 0) as returned,
    coalesce(c.in_transit, 0) as in_transit,
    c.avg_days_to_delivery,
    c.median_days_to_delivery,
    c.p95_days_to_delivery,
    coalesce(c.first_attempt_deliveries, 0) as first_attempt_deliveries,
    c.avg_delivery_attempts,

    -- Tasas de entrega
    c.delivered::float / nullif(c.total_guides, 0) as delivery_rate,
    c.first_attempt_deliveries::float / nullif(c.delivered, 0) as first_attempt_success_rate,

    -- Incident metrics
    coalesce(i.total_incidents, 0) as total_incidents,
    coalesce(i.incidents_not_home, 0) as incidents_not_home,
    coalesce(i.incidents_wrong_address, 0) as incidents_wrong_address,
    coalesce(i.incidents_refused, 0) as incidents_refused,
    coalesce(i.incidents_damaged, 0) as incidents_damaged,
    coalesce(i.incidents_lost, 0) as incidents_lost,
    coalesce(i.resolved_incidents, 0) as resolved_incidents,
    i.avg_resolution_hours,

    -- Tasas de novedades
    i.total_incidents::float / nullif(c.total_guides, 0) as incident_rate,
    i.resolved_incidents::float / nullif(i.total_incidents, 0) as resolution_rate,

    -- Score de transportadora (0-100)
    (
        coalesce(c.delivered::float / nullif(c.total_guides, 0), 0) * 40 +
        coalesce(c.first_attempt_deliveries::float / nullif(c.delivered, 0), 0) * 30 +
        (1 - coalesce(i.total_incidents::float / nullif(c.total_guides, 0), 0)) * 20 +
        (1 - least(coalesce(c.avg_days_to_delivery, 0) / 5, 1)) * 10
    ) * 100 as carrier_score,

    -- Metadata
    current_timestamp as _loaded_at

from carrier_performance c
full outer join incident_metrics i
    on c.date = i.date
    and c.country = i.country
    and c.carrier = i.carrier
