// /src/core/inbox/handlers/orderCancelled.ts
// Handler para órdenes canceladas

import type { InboxEvent, DispatchResult } from '../types';

/**
 * Maneja eventos de cancelación de órdenes
 */
export async function handleOrderCancelled(event: InboxEvent): Promise<DispatchResult> {
  const { data, source, occurredAt } = event;

  console.log(`[OrderCancelled] Processing cancellation for order ${data.orderId}`, {
    status: data.status,
    city: data.city,
  });

  try {
    // 1. Actualizar estado en BD
    await updateOrderAsCancelled(data.orderId, source, {
      cancelledAt: occurredAt,
      reason: extractCancellationReason(event),
    });

    // 2. Liberar inventario si aplica
    if (data.items.length > 0) {
      await releaseInventory(data.items);
    }

    // 3. Notificar sistemas downstream
    await notifyCancellation(data.orderId, event);

    // 4. Actualizar métricas
    await updateCancellationMetrics(event);

    return {
      success: true,
      action: 'order.cancelled',
      orderId: data.orderId,
      metadata: {
        reason: extractCancellationReason(event),
        itemsReleased: data.items.length,
      },
    };
  } catch (error) {
    console.error(`[OrderCancelled] Failed to process cancellation ${data.orderId}`, error);

    return {
      success: false,
      action: 'order.cancellation_failed',
      orderId: data.orderId,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Actualiza la orden como cancelada
 */
async function updateOrderAsCancelled(
  externalId: string,
  source: string,
  details: { cancelledAt: string; reason: string | null }
): Promise<void> {
  // TODO: Implementar con Supabase
  console.log(`[DB] Would mark order ${externalId} as cancelled:`, details);
}

/**
 * Extrae la razón de cancelación del payload
 */
function extractCancellationReason(event: InboxEvent): string | null {
  const raw = event.raw as Record<string, unknown>;
  return (
    (raw?.cancellation_reason as string) ??
    (raw?.reason as string) ??
    (raw?.notes as string) ??
    null
  );
}

/**
 * Libera el inventario reservado
 */
async function releaseInventory(items: InboxEvent['data']['items']): Promise<void> {
  // TODO: Implementar liberación de inventario
  console.log(`[Inventory] Would release ${items.length} items`);
}

/**
 * Notifica la cancelación a sistemas externos
 */
async function notifyCancellation(orderId: string, event: InboxEvent): Promise<void> {
  // TODO: Notificar a:
  // - Sistema de inventario
  // - Dashboard en tiempo real
  // - Cliente (si aplica)
  console.log(`[Notify] Order ${orderId} cancelled`);
}

/**
 * Actualiza métricas de cancelación
 */
async function updateCancellationMetrics(event: InboxEvent): Promise<void> {
  // TODO: Actualizar métricas por:
  // - Ciudad
  // - Vendedor
  // - Producto
  // - Día/hora
  console.log(`[Metrics] Would update cancellation metrics for city: ${event.data.city}`);
}
