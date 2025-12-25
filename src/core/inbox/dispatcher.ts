// /src/core/inbox/dispatcher.ts
// Dispatcher central: decide qué hacer con cada evento

import type { InboxEvent, DispatchResult } from './types';
import { handleOrderUpsert } from './handlers/orderUpsert';
import { handleStatusUpdate } from './handlers/statusUpdate';
import { handleOrderCancelled } from './handlers/orderCancelled';
import { handleShippingDelivered } from './handlers/shippingDelivered';
import { handleShippingFailed } from './handlers/shippingFailed';

/**
 * Dispatch central de eventos
 * Rutea cada evento al handler apropiado según su tipo
 */
export async function dispatchInboxEvent(event: InboxEvent): Promise<DispatchResult> {
  console.log(`[Dispatcher] Processing event: ${event.eventType} from ${event.source}`, {
    orderId: event.data.orderId,
    status: event.data.status,
    idempotencyKey: event.idempotencyKey,
  });

  try {
    switch (event.eventType) {
      case 'order.upsert':
        return await handleOrderUpsert(event);

      case 'order.status_update':
        return await handleStatusUpdate(event);

      case 'order.cancelled':
        return await handleOrderCancelled(event);

      case 'shipping.delivered':
        return await handleShippingDelivered(event);

      case 'shipping.failed':
        return await handleShippingFailed(event);

      case 'shipping.created':
        // Por ahora, tratar como status update
        return await handleStatusUpdate(event);

      case 'customer.message':
        // TODO: Implementar handler de mensajes
        return {
          success: true,
          action: 'message.queued',
          metadata: { note: 'Customer message queued for review' },
        };

      case 'alert.risk':
        // TODO: Implementar sistema de alertas
        return {
          success: true,
          action: 'alert.created',
          metadata: { note: 'Risk alert logged' },
        };

      case 'unknown':
      default:
        // Loggear a "dead letter" para análisis posterior
        console.warn(`[Dispatcher] Unknown event type`, {
          eventType: event.eventType,
          source: event.source,
          rawKeys: Object.keys(event.raw as object),
        });

        return {
          success: false,
          action: 'dead_letter',
          error: `Unknown event type: ${event.eventType}`,
          metadata: {
            logged: true,
            needsReview: true,
          },
        };
    }
  } catch (error) {
    console.error(`[Dispatcher] Error processing event`, {
      eventType: event.eventType,
      orderId: event.data.orderId,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      success: false,
      action: 'error',
      orderId: event.data.orderId,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Procesa múltiples eventos en batch
 * Útil para importaciones masivas o catch-up
 */
export async function dispatchBatch(
  events: InboxEvent[]
): Promise<{ results: DispatchResult[]; summary: BatchSummary }> {
  const results: DispatchResult[] = [];
  const summary: BatchSummary = {
    total: events.length,
    successful: 0,
    failed: 0,
    byAction: {},
  };

  for (const event of events) {
    const result = await dispatchInboxEvent(event);
    results.push(result);

    if (result.success) {
      summary.successful++;
    } else {
      summary.failed++;
    }

    summary.byAction[result.action] = (summary.byAction[result.action] || 0) + 1;
  }

  return { results, summary };
}

interface BatchSummary {
  total: number;
  successful: number;
  failed: number;
  byAction: Record<string, number>;
}
