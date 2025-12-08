-- models/staging/stg_guides.sql
-- Modelo de staging para guías
-- =============================

{{
    config(
        materialized='incremental',
        unique_key='guide_id',
        partition_by={
            "field": "created_at",
            "data_type": "timestamp",
            "granularity": "day"
        }
    )
}}

with source as (
    select * from {{ source('litper', 'raw_guides') }}
    {% if is_incremental() %}
    where updated_at > (select max(updated_at) from {{ this }})
    {% endif %}
),

renamed as (
    select
        -- Identificadores
        id as guide_id,
        guide_number,
        order_id,
        carrier,

        -- Datos de envío
        recipient_name,
        recipient_phone,
        recipient_address,
        recipient_city,
        recipient_state,
        country,

        -- Dimensiones
        weight_kg,
        volume_cm3,
        declared_value,

        -- Estado
        status,
        last_tracking_status,
        last_tracking_location,
        last_tracking_timestamp,

        -- Tiempos
        created_at,
        shipped_at,
        in_transit_at,
        out_for_delivery_at,
        delivered_at,
        returned_at,
        updated_at,

        -- Intentos de entrega
        delivery_attempts,
        first_attempt_at,
        case when delivery_attempts = 1 and delivered_at is not null then true else false end as first_attempt_success,

        -- Métricas derivadas
        case
            when delivered_at is not null and shipped_at is not null then
                extract(epoch from delivered_at - shipped_at) / 86400
            else null
        end as days_in_transit,

        case
            when returned_at is not null then 'returned'
            when delivered_at is not null then 'delivered'
            when out_for_delivery_at is not null then 'out_for_delivery'
            when in_transit_at is not null then 'in_transit'
            when shipped_at is not null then 'shipped'
            else 'created'
        end as guide_stage,

        -- Flags
        case when status = 'delivered' then true else false end as is_delivered,
        case when status = 'returned' then true else false end as is_returned,
        case when status in ('incident', 'problem') then true else false end as has_incident

    from source
    where guide_number is not null
)

select * from renamed
