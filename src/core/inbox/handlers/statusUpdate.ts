// /src/core/inbox/handlers/statusUpdate.ts
// Handler para actualizaciones de estado de órdenes

import type { InboxEvent, DispatchResult, StatusHistoryEntry } from '../types';
import { calculateRiskScore, detectRiskFactors } from './riskEngine';

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
    const existingOrder = await findOrderByExternalId(data.orderId, source);

    if (!existingOrder) {
      // Si no existe, crear una nueva (puede ser un webhook que llegó antes)
      console.warn(
        `[StatusUpdate] Order ${data.orderId} not found, creating placeholder`
      );
      // Podríamos llamar a handleOrderUpsert aquí, pero por ahora solo log
    }

    // 2. Crear entrada de historial
    const historyEntry: StatusHistoryEntry = {
      status: data.status,
      timestamp: occurredAt,
      source,
    };

    // 3. Recalcular riesgo con el nuevo estado
    const riskScore = calculateRiskScore(event);
    const riskFactors = detectRiskFactors(event);

    // 4. Actualizar en base de datos
    await updateOrderStatus(data.orderId, source, {
      status: data.status,
      shippingGuide: data.shippingGuide,
      shippingCompany: data.shippingCompany,
      historyEntry,
      riskScore,
      riskFactors,
    });

    // 5. Disparar acciones según el estado
    const isCritical = CRITICAL_STATUSES.includes(data.status.toUpperCase());
    const isSuccess = SUCCESS_STATUSES.includes(data.status.toUpperCase());

    if (isCritical) {
      await handleCriticalStatus(data.orderId, data.status, event);
    }

    if (isSuccess) {
      await handleSuccessfulDelivery(data.orderId, event);
    }

    // 6. Notificar cambio de estado
    await notifyStatusChange(data.orderId, data.status, event);

    console.log(`[StatusUpdate] Successfully updated order ${data.orderId}`, {
      status: data.status,
      isCritical,
      isSuccess,
      riskScore,
    });

    return {
      success: true,
      action: 'order.status_updated',
      orderId: data.orderId,
      metadata: {
        previousStatus: existingOrder?.status ?? 'unknown',
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
      orderId: data.orderId,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Busca una orden por su ID externo
 * TODO: Implementar con Supabase
 */
async function findOrderByExternalId(
  externalId: string,
  source: string
): Promise<{ id: string; status: string } | null> {
  // TODO: Implementar búsqueda real
  // const { data, error } = await supabase
  //   .from('orders')
  //   .select('id, status')
  //   .eq('external_id', externalId)
  //   .eq('source', source)
  //   .single();
  //
  // return data;

  console.log(`[DB] Would search for order: ${source}:${externalId}`);
  return null; // Por ahora, siempre null
}

/**
 * Actualiza el estado de una orden
 * TODO: Implementar con Supabase
 */
async function updateOrderStatus(
  externalId: string,
  source: string,
  updates: {
    status: string;
    shippingGuide: string | null;
    shippingCompany: string | null;
    historyEntry: StatusHistoryEntry;
    riskScore: number;
    riskFactors: string[];
  }
): Promise<void> {
  // TODO: Implementar actualización real
  // const { error } = await supabase
  //   .from('orders')
  //   .update({
  //     status: updates.status,
  //     shipping_guide: updates.shippingGuide,
  //     shipping_company: updates.shippingCompany,
  //     risk_score: updates.riskScore,
  //     risk_factors: updates.riskFactors,
  //     updated_at: new Date().toISOString(),
  //   })
  //   .eq('external_id', externalId)
  //   .eq('source', source);
  //
  // // Insertar en historial
  // await supabase.from('order_status_history').insert({
  //   order_external_id: externalId,
  //   ...updates.historyEntry,
  // });

  console.log(`[DB] Would update order ${externalId}:`, updates);
}

/**
 * Maneja estados críticos que requieren acción
 */
async function handleCriticalStatus(
  orderId: string,
  status: string,
  event: InboxEvent
): Promise<void> {
  console.warn(`[Critical] Order ${orderId} has critical status: ${status}`);

  // TODO: Implementar acciones críticas
  // 1. Crear alerta en sistema
  // 2. Notificar al equipo (Slack, email, push)
  // 3. Pausar transportadora si hay patrón
  // 4. Crear tarea de llamada al cliente

  // Ejemplo de lógica de escalación:
  if (status === 'DEVOLUCION' || status === 'RECHAZADO') {
    // Crear tarea de llamada
    console.log(`[Action] Would create call task for order ${orderId}`);
  }

  if (status === 'SINIESTRO' || status === 'PERDIDO') {
    // Escalar inmediatamente
    console.log(`[Action] Would escalate order ${orderId} to manager`);
  }
}

/**
 * Maneja entregas exitosas
 */
async function handleSuccessfulDelivery(
  orderId: string,
  event: InboxEvent
): Promise<void> {
  console.log(`[Success] Order ${orderId} delivered successfully`);

  // TODO: Implementar acciones de éxito
  // 1. Actualizar métricas de transportadora
  // 2. Actualizar métricas de ciudad
  // 3. Enviar notificación al cliente (opcional)
  // 4. Actualizar scoring del vendedor
}

/**
 * Notifica cambio de estado
 */
async function notifyStatusChange(
  orderId: string,
  status: string,
  event: InboxEvent
): Promise<void> {
  // TODO: Implementar notificaciones
  // - WebSocket para dashboard en tiempo real
  // - Push notification si configurado
  // - Mensaje WhatsApp al cliente si aplica

  console.log(`[Notify] Status changed for ${orderId}: ${status}`);
}
