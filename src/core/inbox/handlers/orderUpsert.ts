// /src/core/inbox/handlers/orderUpsert.ts
// Handler para crear o actualizar órdenes

import type { InboxEvent, DispatchResult, OrderUpsert } from '../types';
import { calculateRiskScore, detectRiskFactors } from './riskEngine';

/**
 * Maneja eventos de creación/actualización de órdenes
 * Este es el handler principal para el flujo de órdenes
 */
export async function handleOrderUpsert(event: InboxEvent): Promise<DispatchResult> {
  const { data, source, occurredAt } = event;

  console.log(`[OrderUpsert] Processing order ${data.orderId}`, {
    status: data.status,
    city: data.city,
    hasGuide: !!data.shippingGuide,
  });

  try {
    // 1. Calcular riesgo
    const riskScore = calculateRiskScore(event);
    const riskFactors = detectRiskFactors(event);

    // 2. Construir objeto de orden para upsert
    const orderData: OrderUpsert = {
      id: `order_${source}_${data.orderId}`,
      externalId: data.orderId,
      source,
      status: data.status,
      statusHistory: [
        {
          status: data.status,
          timestamp: occurredAt,
          source,
        },
      ],
      shippingGuide: data.shippingGuide,
      shippingCompany: data.shippingCompany,
      city: data.city,
      state: data.state,
      country: data.country,
      total: data.total,
      rateType: data.rateType,
      customerName: data.customer.name
        ? `${data.customer.name} ${data.customer.surname || ''}`.trim()
        : null,
      customerPhone: data.customer.phone,
      customerEmail: data.customer.email,
      customerAddress: data.customer.address,
      items: data.items,
      riskScore,
      riskFactors,
      createdAt: occurredAt,
      updatedAt: new Date().toISOString(),
    };

    // 3. Persistir en base de datos
    // TODO: Reemplazar con llamada real a Supabase/PostgreSQL
    await upsertOrderToDatabase(orderData);

    // 4. Disparar acciones según riesgo
    if (riskScore >= 80) {
      await triggerHighRiskAlert(orderData);
    }

    // 5. Notificar cambios (opcional)
    if (data.shippingGuide) {
      await notifyGuideCreated(orderData);
    }

    console.log(`[OrderUpsert] Successfully processed order ${data.orderId}`, {
      riskScore,
      riskFactors: riskFactors.length,
    });

    return {
      success: true,
      action: 'order.upserted',
      orderId: data.orderId,
      metadata: {
        riskScore,
        riskFactors,
        isNew: true, // TODO: detectar si es nuevo o update
      },
    };
  } catch (error) {
    console.error(`[OrderUpsert] Failed to process order ${data.orderId}`, error);

    return {
      success: false,
      action: 'order.upsert_failed',
      orderId: data.orderId,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Persiste la orden en la base de datos
 * TODO: Implementar con Supabase
 */
async function upsertOrderToDatabase(order: OrderUpsert): Promise<void> {
  // TODO: Implementar persistencia real
  // Ejemplo con Supabase:
  // const { data, error } = await supabase
  //   .from('orders')
  //   .upsert(order, { onConflict: 'external_id,source' })
  //   .select();
  //
  // if (error) throw error;

  // Por ahora, solo log
  console.log(`[DB] Would upsert order:`, {
    id: order.id,
    externalId: order.externalId,
    status: order.status,
    riskScore: order.riskScore,
  });

  // Simular latencia de DB
  await new Promise((resolve) => setTimeout(resolve, 10));
}

/**
 * Dispara alerta de alto riesgo
 */
async function triggerHighRiskAlert(order: OrderUpsert): Promise<void> {
  // TODO: Implementar sistema de alertas
  // - Enviar notificación push
  // - Crear registro en tabla de alertas
  // - Notificar canal de Slack/Discord

  console.warn(`[Alert] HIGH RISK ORDER: ${order.externalId}`, {
    riskScore: order.riskScore,
    riskFactors: order.riskFactors,
    city: order.city,
    total: order.total,
  });
}

/**
 * Notifica que se creó una guía
 */
async function notifyGuideCreated(order: OrderUpsert): Promise<void> {
  // TODO: Implementar notificaciones
  // - Enviar a sistema de tracking
  // - Actualizar dashboard en tiempo real

  console.log(`[Notify] Guide created for order ${order.externalId}:`, {
    guide: order.shippingGuide,
    carrier: order.shippingCompany,
  });
}
