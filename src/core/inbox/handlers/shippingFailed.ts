// /src/core/inbox/handlers/shippingFailed.ts
// Handler para fallos de entrega (devoluciones, rechazos, siniestros)

import type { InboxEvent, DispatchResult } from '../types';

// Tipos de fallo y su severidad
const FAILURE_SEVERITY: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
  NOVEDAD: 'low',
  RETENIDO: 'medium',
  RECHAZADO: 'high',
  DEVOLUCION: 'high',
  SINIESTRO: 'critical',
  PERDIDO: 'critical',
};

/**
 * Maneja eventos de fallo en entrega
 */
export async function handleShippingFailed(event: InboxEvent): Promise<DispatchResult> {
  const { data, source, occurredAt } = event;

  const severity = FAILURE_SEVERITY[data.status.toUpperCase()] ?? 'medium';

  console.warn(`[ShippingFailed] Order ${data.orderId} failed with status: ${data.status}`, {
    severity,
    guide: data.shippingGuide,
    carrier: data.shippingCompany,
    city: data.city,
  });

  try {
    // 1. Actualizar estado de orden
    await markOrderAsFailed(data.orderId, source, {
      status: data.status,
      failedAt: occurredAt,
      severity,
    });

    // 2. Actualizar métricas negativas de transportadora
    if (data.shippingCompany) {
      await updateCarrierFailureMetrics(data.shippingCompany, {
        city: data.city,
        failureType: data.status,
        severity,
      });
    }

    // 3. Detectar patrones problemáticos
    const patterns = await detectFailurePatterns(event);

    // 4. Crear acciones según severidad
    const actions = await createFailureActions(event, severity, patterns);

    // 5. Alertar si es crítico
    if (severity === 'critical' || severity === 'high') {
      await triggerFailureAlert(data.orderId, data.status, event);
    }

    // 6. Crear tarea de gestión
    await createRecoveryTask(data.orderId, event, severity);

    return {
      success: true,
      action: 'shipping.failed',
      orderId: data.orderId,
      metadata: {
        failureType: data.status,
        severity,
        patterns,
        actionsCreated: actions.length,
      },
    };
  } catch (error) {
    console.error(`[ShippingFailed] Failed to process failure ${data.orderId}`, error);

    return {
      success: false,
      action: 'shipping.failure_processing_failed',
      orderId: data.orderId,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Marca la orden como fallida
 */
async function markOrderAsFailed(
  externalId: string,
  source: string,
  details: { status: string; failedAt: string; severity: string }
): Promise<void> {
  // TODO: Implementar con Supabase
  console.log(`[DB] Would mark order ${externalId} as failed:`, details);
}

/**
 * Actualiza métricas de fallo de transportadora
 */
async function updateCarrierFailureMetrics(
  carrier: string,
  metrics: {
    city: string | null;
    failureType: string;
    severity: string;
  }
): Promise<void> {
  // TODO: Implementar métricas de fallo
  // - Incrementar contador de fallos
  // - Actualizar tasa de fallo por ciudad
  // - Detectar si supera umbral para pausar
  console.log(`[Metrics] Would update carrier ${carrier} failure:`, metrics);
}

/**
 * Detecta patrones problemáticos
 */
async function detectFailurePatterns(event: InboxEvent): Promise<string[]> {
  const patterns: string[] = [];
  const { data } = event;

  // TODO: Implementar detección real con datos históricos

  // Ejemplo de patrones a detectar:
  // - Múltiples fallos en misma ciudad
  // - Múltiples fallos con misma transportadora
  // - Patrón de rechazos en zona específica
  // - Cliente con historial de rechazos

  if (data.city) {
    // Simular detección
    patterns.push(`city:${data.city}:check_history`);
  }

  if (data.shippingCompany) {
    patterns.push(`carrier:${data.shippingCompany}:check_performance`);
  }

  return patterns;
}

/**
 * Crea acciones basadas en el fallo
 */
async function createFailureActions(
  event: InboxEvent,
  severity: string,
  patterns: string[]
): Promise<string[]> {
  const actions: string[] = [];
  const { data } = event;

  // Acciones según severidad
  if (severity === 'critical') {
    actions.push('escalate_to_manager');
    actions.push('pause_carrier_evaluation');
  }

  if (severity === 'high') {
    actions.push('create_call_task');
    actions.push('notify_team');
  }

  if (data.status === 'RECHAZADO' || data.status === 'DEVOLUCION') {
    actions.push('schedule_customer_contact');
  }

  // TODO: Crear las acciones reales en el sistema
  console.log(`[Actions] Would create actions:`, actions);

  return actions;
}

/**
 * Dispara alerta de fallo
 */
async function triggerFailureAlert(
  orderId: string,
  status: string,
  event: InboxEvent
): Promise<void> {
  // TODO: Implementar sistema de alertas
  // - Push notification
  // - Slack/Discord
  // - Email si es crítico
  console.warn(`[Alert] SHIPPING FAILURE: ${orderId} - ${status}`, {
    city: event.data.city,
    carrier: event.data.shippingCompany,
    guide: event.data.shippingGuide,
  });
}

/**
 * Crea tarea de recuperación/gestión
 */
async function createRecoveryTask(
  orderId: string,
  event: InboxEvent,
  severity: string
): Promise<void> {
  // TODO: Crear tarea en sistema de gestión
  // - Asignar a agente según carga
  // - Priorizar por severidad
  // - Incluir datos relevantes

  const priority =
    severity === 'critical' ? 1 :
    severity === 'high' ? 2 :
    severity === 'medium' ? 3 : 4;

  console.log(`[Task] Would create recovery task for ${orderId}`, {
    priority,
    severity,
    action: event.data.status === 'DEVOLUCION' ? 'process_return' : 'contact_customer',
  });
}
