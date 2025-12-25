// /api/data/metrics.ts
// Endpoint para obtener métricas del dashboard

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Obtener totales de órdenes por estado
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('status, risk_score, payment_method, total_amount');

    if (ordersError) throw ordersError;

    // 2. Obtener totales de shipments por estado
    const { data: shipments, error: shipmentsError } = await supabase
      .from('shipments')
      .select('status, carrier, risk_score, city');

    if (shipmentsError) throw shipmentsError;

    // 3. Obtener alertas activas
    const { data: alerts, error: alertsError } = await supabase
      .from('alerts')
      .select('type, priority, resolved')
      .eq('resolved', false);

    if (alertsError) throw alertsError;

    // Calcular métricas
    const totalOrders = orders?.length || 0;
    const totalShipments = shipments?.length || 0;

    // Por estado de orden
    const ordersByStatus: Record<string, number> = {};
    orders?.forEach(o => {
      ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
    });

    // Por estado de shipment
    const shipmentsByStatus: Record<string, number> = {};
    shipments?.forEach(s => {
      shipmentsByStatus[s.status] = (shipmentsByStatus[s.status] || 0) + 1;
    });

    // Por transportadora
    const shipmentsByCarrier: Record<string, number> = {};
    shipments?.forEach(s => {
      shipmentsByCarrier[s.carrier] = (shipmentsByCarrier[s.carrier] || 0) + 1;
    });

    // Tasas de entrega
    const delivered = shipmentsByStatus['delivered'] || 0;
    const returned = shipmentsByStatus['returned'] || 0;
    const issues = shipmentsByStatus['issue'] || 0;

    const deliveryRate = totalShipments > 0
      ? Math.round((delivered / totalShipments) * 100)
      : 0;

    const returnRate = totalShipments > 0
      ? Math.round((returned / totalShipments) * 100)
      : 0;

    // Alto riesgo
    const highRiskOrders = orders?.filter(o => o.risk_score >= 60).length || 0;
    const highRiskShipments = shipments?.filter(s => s.risk_score >= 60).length || 0;

    // GMV
    const totalGMV = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
    const codOrders = orders?.filter(o => o.payment_method === 'cod').length || 0;

    // Alertas por tipo
    const alertsByType: Record<string, number> = {};
    const alertsByPriority: Record<string, number> = {};
    alerts?.forEach(a => {
      alertsByType[a.type] = (alertsByType[a.type] || 0) + 1;
      alertsByPriority[a.priority] = (alertsByPriority[a.priority] || 0) + 1;
    });

    // Top ciudades con problemas
    const citiesWithIssues: Record<string, number> = {};
    shipments?.filter(s => s.status === 'issue' || s.status === 'returned')
      .forEach(s => {
        if (s.city) {
          citiesWithIssues[s.city] = (citiesWithIssues[s.city] || 0) + 1;
        }
      });

    const topProblemCities = Object.entries(citiesWithIssues)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([city, count]) => ({ city, count }));

    return res.status(200).json({
      ok: true,
      timestamp: new Date().toISOString(),
      metrics: {
        // Totales
        totalOrders,
        totalShipments,
        activeAlerts: alerts?.length || 0,

        // Tasas
        deliveryRate,
        returnRate,
        issueRate: totalShipments > 0 ? Math.round((issues / totalShipments) * 100) : 0,

        // Riesgo
        highRiskOrders,
        highRiskShipments,

        // Financiero
        totalGMV,
        codOrders,
        codPercentage: totalOrders > 0 ? Math.round((codOrders / totalOrders) * 100) : 0,

        // Desglose
        ordersByStatus,
        shipmentsByStatus,
        shipmentsByCarrier,
        alertsByType,
        alertsByPriority,
        topProblemCities,
      },
    });
  } catch (error) {
    console.error('[Metrics] Error:', error);
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
