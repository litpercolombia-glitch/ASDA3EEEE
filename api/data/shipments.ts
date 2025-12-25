// /api/data/shipments.ts
// Endpoint para obtener shipments para el dashboard y chat

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

    // Query params
    const {
      status,
      carrier,
      limit = '50',
      offset = '0',
      guide,
      high_risk,
    } = req.query;

    // Build query
    let query = supabase
      .from('shipments')
      .select(`
        id,
        guide_number,
        carrier,
        status,
        status_detail,
        city,
        department,
        risk_score,
        tracking_url,
        estimated_delivery,
        delivered_at,
        created_at,
        updated_at,
        order_id,
        orders (
          id,
          external_id,
          customer_name,
          customer_phone,
          total_amount,
          payment_method
        )
      `)
      .order('updated_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    // Filters
    if (status && typeof status === 'string') {
      query = query.eq('status', status);
    }

    if (carrier && typeof carrier === 'string') {
      query = query.eq('carrier', carrier);
    }

    if (guide && typeof guide === 'string') {
      query = query.ilike('guide_number', `%${guide}%`);
    }

    if (high_risk === 'true') {
      query = query.gte('risk_score', 60);
    }

    const { data: shipments, error, count } = await query;

    if (error) throw error;

    // Transform para el frontend
    const transformed = shipments?.map(s => ({
      id: s.id,
      guide: s.guide_number,
      carrier: s.carrier,
      status: s.status,
      statusDetail: s.status_detail,
      city: s.city,
      department: s.department,
      risk: s.risk_score,
      trackingUrl: s.tracking_url,
      estimatedDelivery: s.estimated_delivery,
      deliveredAt: s.delivered_at,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
      order: s.orders ? {
        id: (s.orders as any).id,
        externalId: (s.orders as any).external_id,
        customerName: (s.orders as any).customer_name,
        customerPhone: (s.orders as any).customer_phone,
        total: (s.orders as any).total_amount,
        paymentMethod: (s.orders as any).payment_method,
      } : null,
    }));

    return res.status(200).json({
      ok: true,
      shipments: transformed,
      total: count,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    console.error('[Shipments] Error:', error);
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
