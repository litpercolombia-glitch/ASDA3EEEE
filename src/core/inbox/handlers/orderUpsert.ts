// /src/core/inbox/handlers/orderUpsert.ts
// Handler para crear o actualizar órdenes - CON SUPABASE

import type { InboxEvent, DispatchResult, OrderUpsert } from '../types';
import { calculateRiskScore, detectRiskFactors } from './riskEngine';
import { supabase } from '../../../lib/supabase';
import type { OrderInsert, ShipmentInsert, AlertInsert } from '../../../lib/database.types';

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

    // 2. Preparar datos para Supabase
    const orderData: OrderInsert = {
      external_id: String(data.orderId),
      source,
      status: data.status || 'pending',
      customer_name: data.customer.name
        ? `${data.customer.name} ${data.customer.surname || ''}`.trim()
        : null,
      customer_phone: data.customer.phone || null,
      customer_email: data.customer.email || null,
      shipping_address: data.customer.address || null,
      shipping_city: data.city || null,
      shipping_department: data.state || null,
      total_amount: data.total || null,
      payment_method: data.rateType?.toLowerCase().includes('contraentrega') ? 'cod' : 'prepaid',
      risk_score: riskScore,
    };

    // 3. Upsert orden en Supabase
    const { data: upsertedOrder, error: orderError } = await supabase
      .from('orders')
      .upsert(orderData, { onConflict: 'external_id' })
      .select()
      .single();

    if (orderError) {
      console.error(`[OrderUpsert] Supabase error:`, orderError);
      throw orderError;
    }

    console.log(`[OrderUpsert] Order saved:`, upsertedOrder?.id);

    // 4. Si hay guía, crear/actualizar shipment
    if (data.shippingGuide && upsertedOrder) {
      const shipmentData: ShipmentInsert = {
        order_id: upsertedOrder.id,
        guide_number: data.shippingGuide,
        carrier: normalizeCarrier(data.shippingCompany),
        status: mapStatusToShipment(data.status),
        city: data.city || null,
        department: data.state || null,
        risk_score: riskScore,
      };

      const { error: shipmentError } = await supabase
        .from('shipments')
        .upsert(shipmentData, { onConflict: 'guide_number' });

      if (shipmentError) {
        console.warn(`[OrderUpsert] Shipment error:`, shipmentError);
      }
    }

    // 5. Disparar alerta si alto riesgo
    if (riskScore >= 60 && upsertedOrder) {
      await createRiskAlert(upsertedOrder.id, riskScore, riskFactors);
    }

    // 6. Guardar evento en log
    await logEvent(event);

    console.log(`[OrderUpsert] Successfully processed order ${data.orderId}`, {
      riskScore,
      riskFactors: riskFactors.length,
    });

    return {
      success: true,
      action: 'order.upserted',
      orderId: String(data.orderId),
      metadata: {
        riskScore,
        riskFactors,
        dbId: upsertedOrder?.id,
      },
    };
  } catch (error) {
    console.error(`[OrderUpsert] Failed to process order ${data.orderId}`, error);

    return {
      success: false,
      action: 'order.upsert_failed',
      orderId: String(data.orderId),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Crea alerta de riesgo en Supabase
 */
async function createRiskAlert(
  orderId: string,
  riskScore: number,
  riskFactors: string[]
): Promise<void> {
  const priority = riskScore >= 80 ? 'critical' : riskScore >= 60 ? 'high' : 'medium';

  const alertData: AlertInsert = {
    order_id: orderId,
    type: 'high_risk',
    priority,
    message: `Orden con riesgo ${riskScore}/100. Factores: ${riskFactors.join(', ')}`,
    resolved: false,
  };

  const { error } = await supabase.from('alerts').insert(alertData);

  if (error) {
    console.warn(`[Alert] Failed to create alert:`, error);
  } else {
    console.log(`[Alert] Created risk alert for order ${orderId}`);
  }
}

/**
 * Guarda evento en tabla de log
 */
async function logEvent(event: InboxEvent): Promise<void> {
  const { error } = await supabase.from('events').insert({
    source: event.source,
    event_type: event.eventType,
    idempotency_key: event.idempotencyKey,
    payload: event.raw as any,
    processed: true,
  });

  if (error) {
    console.warn(`[Event] Failed to log event:`, error);
  }
}

/**
 * Normaliza nombre de transportadora
 */
function normalizeCarrier(carrier: string | null | undefined): string {
  if (!carrier) return 'unknown';

  const carrierMap: Record<string, string> = {
    'SERVIENTREGA': 'servientrega',
    'ENVIA': 'envia',
    'COORDINADORA': 'coordinadora',
    'TCC': 'tcc',
    'INTERRAPIDISIMO': 'inter',
    'INTER': 'inter',
    '472': '472',
  };

  const upper = carrier.toUpperCase();
  for (const [key, value] of Object.entries(carrierMap)) {
    if (upper.includes(key)) return value;
  }

  return carrier.toLowerCase();
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
    'ENTREGADO': 'delivered',
    'DEVOLUCION': 'returned',
    'RECHAZADO': 'returned',
    'NOVEDAD': 'issue',
    'PENDIENTE': 'created',
  };

  return statusMap[status.toUpperCase()] || 'created';
}
