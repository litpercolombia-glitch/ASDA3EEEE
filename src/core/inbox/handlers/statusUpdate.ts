// /src/core/inbox/handlers/statusUpdate.ts
// Handler para actualizaciones de estado de órdenes - CON SUPABASE

import type { InboxEvent, DispatchResult, StatusHistoryEntry } from '../types';
import { calculateRiskScore, detectRiskFactors } from './riskEngine';
import { supabase } from '../../../lib/supabase';
import type { AlertInsert } from '../../../lib/database.types';

// Estados críticos que requieren acción inmediata
const CRITICAL_STATUSES = [
  'DEVOLUCION',
  'RECHAZADO',
  'SINIESTRO',
  'PERDIDO',
  'CANCELADO',
  'NOVEDAD',
];

// Estados positivos (para métricas)
const SUCCESS_STATUSES = ['ENTREGADO', 'DELIVERED', 'COMPLETADO'];

/**
 * Maneja actualizaciones de estado de órdenes existentes
 */
export async function handleStatusUpdate(event: InboxEvent): Promise<DispatchResult> {
  const { data, source, occurredAt } = event;

  console.log(`[StatusUpdate] Processing status change for order ${data.orderId}`, {
    newStatus: data.status,
    guide: data.shippingGuide,
  });

  try {
    // 1. Buscar orden existente
    const { data: existingOrder, error: findError } = await supabase
      .from('orders')
      .select('id, status')
      .eq('external_id', String(data.orderId))
      .single();

    if (findError && findError.code !== 'PGRST116') {
      console.warn(`[StatusUpdate] Error finding order:`, findError);
    }

    const previousStatus = existingOrder?.status ?? 'unknown';

    // 2. Recalcular riesgo con el nuevo estado
    const riskScore = calculateRiskScore(event);
    const riskFactors = detectRiskFactors(event);

    // 3. Actualizar orden en Supabase
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: data.status,
        risk_score: riskScore,
        updated_at: new Date().toISOString(),
      })
      .eq('external_id', String(data.orderId));

    if (updateError) {
      console.warn(`[StatusUpdate] Error updating order:`, updateError);
    }

    // 4. Actualizar shipment si hay guía
    if (data.shippingGuide) {
      const shipmentStatus = mapStatusToShipment(data.status);
      const isDelivered = SUCCESS_STATUSES.includes(data.status.toUpperCase());

      const { error: shipmentError } = await supabase
        .from('shipments')
        .update({
          status: shipmentStatus,
          status_detail: data.status,
          risk_score: riskScore,
          delivered_at: isDelivered ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('guide_number', data.shippingGuide);

      if (shipmentError) {
        console.warn(`[StatusUpdate] Error updating shipment:`, shipmentError);
      }
    }

    // 5. Disparar acciones según el estado
    const isCritical = CRITICAL_STATUSES.includes(data.status.toUpperCase());
    const isSuccess = SUCCESS_STATUSES.includes(data.status.toUpperCase());

    if (isCritical && existingOrder) {
      await createCriticalAlert(existingOrder.id, data.status, data.shippingGuide);
    }

    // 6. Log del evento
    await supabase.from('events').insert({
      source,
      event_type: 'order.status_update',
      idempotency_key: event.idempotencyKey,
      payload: event.raw as any,
      processed: true,
    });

    console.log(`[StatusUpdate] Successfully updated order ${data.orderId}`, {
      status: data.status,
      isCritical,
      isSuccess,
      riskScore,
    });

    return {
      success: true,
      action: 'order.status_updated',
      orderId: String(data.orderId),
      metadata: {
        previousStatus,
        newStatus: data.status,
        isCritical,
        isSuccess,
        riskScore,
      },
    };
  } catch (error) {
    console.error(`[StatusUpdate] Failed to update order ${data.orderId}`, error);

    return {
      success: false,
      action: 'order.status_update_failed',
      orderId: String(data.orderId),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Crea alerta para estados críticos
 */
async function createCriticalAlert(
  orderId: string,
  status: string,
  guideNumber: string | null
): Promise<void> {
  // Buscar shipment si hay guía
  let shipmentId: string | null = null;
  if (guideNumber) {
    const { data: shipment } = await supabase
      .from('shipments')
      .select('id')
      .eq('guide_number', guideNumber)
      .single();
    shipmentId = shipment?.id ?? null;
  }

  const alertType = getAlertType(status);
  const priority = getPriorityForStatus(status);

  const alertData: AlertInsert = {
    order_id: orderId,
    shipment_id: shipmentId,
    type: alertType,
    priority,
    message: `Estado crítico: ${status}. ${guideNumber ? `Guía: ${guideNumber}` : 'Sin guía asignada'}`,
    resolved: false,
  };

  const { error } = await supabase.from('alerts').insert(alertData);

  if (error) {
    console.warn(`[Alert] Failed to create critical alert:`, error);
  } else {
    console.log(`[Alert] Created ${alertType} alert for order ${orderId}`);
  }
}

/**
 * Determina tipo de alerta basado en estado
 */
function getAlertType(status: string): string {
  const upper = status.toUpperCase();
  if (upper === 'SINIESTRO' || upper === 'PERDIDO') return 'lost';
  if (upper === 'DEVOLUCION' || upper === 'RECHAZADO') return 'failed_delivery';
  if (upper === 'NOVEDAD') return 'issue';
  if (upper === 'CANCELADO') return 'cancelled';
  return 'issue';
}

/**
 * Determina prioridad basada en estado
 */
function getPriorityForStatus(status: string): string {
  const upper = status.toUpperCase();
  if (upper === 'SINIESTRO' || upper === 'PERDIDO') return 'critical';
  if (upper === 'DEVOLUCION' || upper === 'RECHAZADO') return 'high';
  if (upper === 'NOVEDAD') return 'medium';
  return 'medium';
}

/**
 * Mapea estado de orden a estado de shipment
 */
function mapStatusToShipment(status: string | undefined): string {
  if (!status) return 'created';

  const statusMap: Record<string, string> = {
    'ENVIADO': 'in_transit',
    'EN_TRANSITO': 'in_transit',
    'EN_RUTA': 'in_transit',
    'EN_CAMINO': 'in_transit',
    'ENTREGADO': 'delivered',
    'DELIVERED': 'delivered',
    'COMPLETADO': 'delivered',
    'DEVOLUCION': 'returned',
    'RECHAZADO': 'returned',
    'NOVEDAD': 'issue',
    'SINIESTRO': 'lost',
    'PERDIDO': 'lost',
    'PENDIENTE': 'created',
    'EN_OFICINA': 'in_office',
  };

  return statusMap[status.toUpperCase()] || 'in_transit';
}
