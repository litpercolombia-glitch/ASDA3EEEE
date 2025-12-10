-- models/staging/stg_orders.sql
-- Modelo de staging para pedidos
-- ================================

{{
    config(
        materialized='incremental',
        unique_key='order_id',
        partition_by={
            "field": "created_at",
            "data_type": "timestamp",
            "granularity": "day"
        }
    )
}}

with source as (
    select * from {{ source('litper', 'raw_orders') }}
    {% if is_incremental() %}
    where updated_at > (select max(updated_at) from {{ this }})
    {% endif %}
),

renamed as (
    select
        -- Identificadores
        id as order_id,
        customer_id,
        dropi_order_id,
        shopify_order_id,

        -- Datos del cliente
        customer_name,
        customer_phone,
        customer_email,

        -- Dirección
        shipping_address,
        shipping_city,
        shipping_state,
        country,

        -- Productos
        products,
        jsonb_array_length(products) as products_count,

        -- Valores
        subtotal,
        shipping_cost,
        discount,
        total_amount,
        currency,

        -- Fuente
        source,  -- whatsapp, shopify, web, api
        source_order_id,

        -- Estado
        status,

        -- Tiempos
        created_at,
        confirmed_at,
        shipped_at,
        delivered_at,
        cancelled_at,
        updated_at,

        -- Métricas derivadas
        case
            when delivered_at is not null then
                extract(epoch from delivered_at - created_at) / 3600
            else null
        end as hours_to_delivery,

        case
            when cancelled_at is not null then 'cancelled'
            when delivered_at is not null then 'delivered'
            when shipped_at is not null then 'shipped'
            when confirmed_at is not null then 'confirmed'
            else 'pending'
        end as order_stage,

        -- Flags
        case when cancelled_at is not null then true else false end as is_cancelled,
        case when delivered_at is not null then true else false end as is_delivered,
        case when status = 'fraud' then true else false end as is_fraudulent

    from source
    where status not in ('test', 'deleted')
)

select * from renamed
