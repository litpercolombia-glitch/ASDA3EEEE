// /src/core/inbox/normalize.ts
// Normaliza payloads de diferentes fuentes a InboxEvent

import type { InboxEvent, EventType, OrderItem } from './types';

/**
 * Normaliza un payload de Chatea/Dropi a InboxEvent
 * Maneja el formato real de los webhooks de Dropi/Chatea
 */
export function normalizeChateaEvent(payload: Record<string, unknown>): InboxEvent {
  // Determinar tipo de evento basado en el payload
  const eventType = detectEventType(payload);

  // Extraer ID de orden (varios formatos posibles)
  const orderId = String(
    payload?.id ??
    payload?.order_id ??
    payload?.external_id ??
    'unknown'
  );

  // Extraer estado
  const status = String(payload?.status ?? 'UNKNOWN');

  // Construir clave de idempotencia única y estable
  const idempotencyKey = buildIdempotencyKey(payload, eventType, orderId, status);

  return {
    source: 'chatea',
    eventType,
    occurredAt: String(payload?.created_at ?? payload?.updated_at ?? new Date().toISOString()),
    idempotencyKey,
    raw: payload,
    data: {
      orderId,
      status,
      shippingGuide: nullableString(payload?.shipping_guide ?? payload?.guide_number),
      shippingCompany: nullableString(payload?.shipping_company ?? payload?.carrier),
      city: nullableString(payload?.city),
      state: nullableString(payload?.state ?? payload?.department),
      country: nullableString(payload?.country) ?? 'CO', // Default Colombia
      total: nullableNumber(payload?.total_order ?? payload?.total),
      rateType: nullableString(payload?.rate_type),
      customer: {
        name: nullableString(payload?.name ?? payload?.customer_name),
        surname: nullableString(payload?.surname ?? payload?.customer_surname),
        phone: nullableString(payload?.phone ?? payload?.customer_phone),
        email: nullableString(payload?.email ?? payload?.customer_email),
        address: nullableString(payload?.dir ?? payload?.address ?? payload?.customer_address),
      },
      items: normalizeOrderItems(payload?.orderdetails ?? payload?.items ?? payload?.products),
    },
  };
}

/**
 * Normaliza un payload de Shopify a InboxEvent
 */
export function normalizeShopifyEvent(payload: Record<string, unknown>): InboxEvent {
  const eventType = detectShopifyEventType(payload);
  const orderId = String(payload?.id ?? payload?.order_id ?? 'unknown');
  const financialStatus = String(payload?.financial_status ?? 'unknown');
  const fulfillmentStatus = String(payload?.fulfillment_status ?? 'unfulfilled');

  const status = mapShopifyStatus(financialStatus, fulfillmentStatus);

  // Extraer información del cliente
  const customer = payload?.customer as Record<string, unknown> | undefined;
  const shippingAddress = payload?.shipping_address as Record<string, unknown> | undefined;

  return {
    source: 'shopify',
    eventType,
    occurredAt: String(payload?.created_at ?? new Date().toISOString()),
    idempotencyKey: `shopify:${eventType}:${orderId}:${payload?.updated_at ?? Date.now()}`,
    raw: payload,
    data: {
      orderId,
      status,
      shippingGuide: null, // Shopify no envía guía en el webhook de orden
      shippingCompany: null,
      city: nullableString(shippingAddress?.city),
      state: nullableString(shippingAddress?.province),
      country: nullableString(shippingAddress?.country_code),
      total: nullableNumber(payload?.total_price),
      rateType: null,
      customer: {
        name: nullableString(customer?.first_name ?? shippingAddress?.first_name),
        surname: nullableString(customer?.last_name ?? shippingAddress?.last_name),
        phone: nullableString(shippingAddress?.phone ?? customer?.phone),
        email: nullableString(customer?.email ?? payload?.email),
        address: nullableString(shippingAddress?.address1),
      },
      items: normalizeShopifyItems(payload?.line_items),
    },
  };
}

/**
 * Detecta el tipo de evento basado en el payload de Chatea/Dropi
 */
function detectEventType(payload: Record<string, unknown>): EventType {
  const type = payload?.type ?? payload?.event_type;
  const status = String(payload?.status ?? '').toUpperCase();

  // Por tipo explícito
  if (type === 'FINAL_ORDER' || type === 'order.created') {
    return 'order.upsert';
  }
  if (type === 'status.update' || type === 'STATUS_UPDATE') {
    return 'order.status_update';
  }
  if (type === 'CANCELLED' || status === 'CANCELADO') {
    return 'order.cancelled';
  }

  // Por estado inferido
  if (status === 'ENTREGADO' || status === 'DELIVERED') {
    return 'shipping.delivered';
  }
  if (status === 'DEVOLUCION' || status === 'RETURNED' || status === 'RECHAZADO') {
    return 'shipping.failed';
  }
  if (payload?.shipping_guide && !payload?.type) {
    return 'order.status_update';
  }

  // Si tiene suficiente info de orden, es un upsert
  if (payload?.id && (payload?.total_order || payload?.orderdetails)) {
    return 'order.upsert';
  }

  // Si tiene status pero no es orden completa
  if (status && status !== 'UNKNOWN') {
    return 'order.status_update';
  }

  return 'unknown';
}

/**
 * Detecta el tipo de evento de Shopify
 */
function detectShopifyEventType(payload: Record<string, unknown>): EventType {
  const topic = payload?.topic ?? payload?.webhook_topic;

  if (topic === 'orders/create') return 'order.upsert';
  if (topic === 'orders/updated') return 'order.status_update';
  if (topic === 'orders/cancelled') return 'order.cancelled';
  if (topic === 'fulfillments/create') return 'shipping.created';
  if (topic === 'fulfillments/update') return 'order.status_update';

  return 'order.upsert'; // Default para webhooks de orden
}

/**
 * Mapea estados de Shopify a nuestro formato
 */
function mapShopifyStatus(financial: string, fulfillment: string): string {
  if (fulfillment === 'fulfilled') return 'ENTREGADO';
  if (fulfillment === 'partial') return 'EN_TRANSITO';
  if (financial === 'paid') return 'CONFIRMADO';
  if (financial === 'pending') return 'PENDIENTE';
  if (financial === 'refunded') return 'DEVOLUCION';
  return 'PENDIENTE';
}

/**
 * Construye clave de idempotencia única
 */
function buildIdempotencyKey(
  payload: Record<string, unknown>,
  eventType: EventType,
  orderId: string,
  status: string
): string {
  // Si viene un event_id único, usarlo
  if (payload?.event_id) {
    return `chatea:${payload.event_id}`;
  }

  // Construir clave basada en datos estables
  const guide = payload?.shipping_guide ?? 'no_guide';
  const timestamp = payload?.updated_at ?? payload?.created_at ?? '';

  return `chatea:${eventType}:${orderId}:${status}:${guide}:${timestamp}`;
}

/**
 * Normaliza items de orden (formato Dropi/Chatea)
 */
function normalizeOrderItems(items: unknown): OrderItem[] {
  if (!Array.isArray(items)) return [];

  return items.map((item: Record<string, unknown>) => ({
    productId: nullableString(item?.product_id),
    variationId: nullableString(item?.variation_id),
    quantity: nullableNumber(item?.quantity),
    sku: nullableString(item?.product?.sku ?? item?.sku),
    name: nullableString(item?.product?.name ?? item?.name ?? item?.title),
  }));
}

/**
 * Normaliza items de Shopify
 */
function normalizeShopifyItems(lineItems: unknown): OrderItem[] {
  if (!Array.isArray(lineItems)) return [];

  return lineItems.map((item: Record<string, unknown>) => ({
    productId: nullableString(item?.product_id),
    variationId: nullableString(item?.variant_id),
    quantity: nullableNumber(item?.quantity),
    sku: nullableString(item?.sku),
    name: nullableString(item?.title ?? item?.name),
  }));
}

/**
 * Helper: convierte a string o null
 */
function nullableString(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  return String(value);
}

/**
 * Helper: convierte a number o null
 */
function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}
