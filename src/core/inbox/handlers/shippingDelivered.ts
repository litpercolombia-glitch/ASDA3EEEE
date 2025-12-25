// /src/core/inbox/handlers/shippingDelivered.ts
// Handler para entregas exitosas

import type { InboxEvent, DispatchResult } from '../types';

/**
 * Maneja eventos de entrega exitosa
 */
export async function handleShippingDelivered(event: InboxEvent): Promise<DispatchResult> {
  const { data, source, occurredAt } = event;

  console.log(`[ShippingDelivered] Order ${data.orderId} delivered`, {
    guide: data.shippingGuide,
    carrier: data.shippingCompany,
    city: data.city,
  });

  try {
    // 1. Actualizar estado de orden
    await markOrderAsDelivered(data.orderId, source, occurredAt);

    // 2. Actualizar métricas de transportadora
    if (data.shippingCompany) {
      await updateCarrierMetrics(data.shippingCompany, {
        city: data.city,
        deliveryTime: calculateDeliveryTime(event),
        success: true,
      });
    }

    // 3. Actualizar métricas de ciudad
    if (data.city) {
      await updateCityMetrics(data.city, {
        delivered: true,
        carrier: data.shippingCompany,
      });
    }

    // 4. Calcular y guardar tiempo de entrega
    const deliveryTime = calculateDeliveryTime(event);

    // 5. Notificar (opcional: mensaje de agradecimiento al cliente)
    await notifyDeliverySuccess(data.orderId, event);

    return {
      success: true,
      action: 'shipping.delivered',
      orderId: data.orderId,
      metadata: {
        deliveryTimeHours: deliveryTime,
        carrier: data.shippingCompany,
        city: data.city,
      },
    };
  } catch (error) {
    console.error(`[ShippingDelivered] Failed to process delivery ${data.orderId}`, error);

    return {
      success: false,
      action: 'shipping.delivery_processing_failed',
      orderId: data.orderId,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Marca la orden como entregada
 */
async function markOrderAsDelivered(
  externalId: string,
  source: string,
  deliveredAt: string
): Promise<void> {
  // TODO: Implementar con Supabase
  console.log(`[DB] Would mark order ${externalId} as delivered at ${deliveredAt}`);
}

/**
 * Actualiza métricas de transportadora
 */
async function updateCarrierMetrics(
  carrier: string,
  metrics: {
    city: string | null;
    deliveryTime: number | null;
    success: boolean;
  }
): Promise<void> {
  // TODO: Implementar actualización de métricas
  // - Tasa de éxito por transportadora
  // - Tiempo promedio de entrega
  // - Performance por ciudad
  console.log(`[Metrics] Would update carrier ${carrier}:`, metrics);
}

/**
 * Actualiza métricas de ciudad
 */
async function updateCityMetrics(
  city: string,
  metrics: {
    delivered: boolean;
    carrier: string | null;
  }
): Promise<void> {
  // TODO: Implementar métricas por ciudad
  console.log(`[Metrics] Would update city ${city}:`, metrics);
}

/**
 * Calcula el tiempo de entrega en horas
 */
function calculateDeliveryTime(event: InboxEvent): number | null {
  const raw = event.raw as Record<string, unknown>;
  const createdAt = raw?.created_at ?? raw?.order_created_at;

  if (!createdAt) return null;

  try {
    const created = new Date(String(createdAt));
    const delivered = new Date(event.occurredAt);
    const diffMs = delivered.getTime() - created.getTime();
    return Math.round(diffMs / (1000 * 60 * 60)); // Horas
  } catch {
    return null;
  }
}

/**
 * Notifica entrega exitosa
 */
async function notifyDeliverySuccess(orderId: string, event: InboxEvent): Promise<void> {
  // TODO: Implementar notificación opcional
  // - Mensaje de agradecimiento por WhatsApp
  // - Solicitud de reseña
  // - Update a dashboard
  console.log(`[Notify] Order ${orderId} delivered successfully`);
}
