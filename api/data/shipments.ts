// /api/data/shipments.ts
// Endpoint para obtener guías para el dashboard y chat
// Usa tabla real: guias

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
      estado,
      transportadora,
      ciudad,
      limit = '50',
      offset = '0',
      guia,
      con_novedad,
      carga_id,
    } = req.query;

    // Build query
    let query = supabase
      .from('guias')
      .select('*')
      .order('fecha_actualizacion', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    // Filters
    if (estado && typeof estado === 'string') {
      query = query.eq('estado', estado);
    }

    if (transportadora && typeof transportadora === 'string') {
      query = query.eq('transportadora', transportadora);
    }

    if (ciudad && typeof ciudad === 'string') {
      query = query.ilike('ciudad_destino', `%${ciudad}%`);
    }

    if (guia && typeof guia === 'string') {
      query = query.ilike('numero_guia', `%${guia}%`);
    }

    if (con_novedad === 'true') {
      query = query.eq('tiene_novedad', true);
    }

    if (carga_id && typeof carga_id === 'string') {
      query = query.eq('carga_id', carga_id);
    }

    const { data: guias, error, count } = await query;

    if (error) throw error;

    // Transform para el frontend (mantener compatibilidad)
    const transformed = guias?.map(g => ({
      id: g.id,
      guide: g.numero_guia,
      carrier: g.transportadora,
      status: g.estado,
      statusDetail: g.estado_detalle,
      city: g.ciudad_destino,
      department: g.departamento,
      customerName: g.nombre_cliente,
      customerPhone: g.telefono,
      address: g.direccion,
      value: g.valor_declarado,
      freight: g.valor_flete,
      profit: g.ganancia,
      daysInTransit: g.dias_transito,
      hasIssue: g.tiene_novedad,
      issueType: g.tipo_novedad,
      issueDescription: g.descripcion_novedad,
      createdAt: g.fecha_creacion,
      updatedAt: g.fecha_actualizacion,
      deliveredAt: g.fecha_entrega,
      cargaId: g.carga_id,
      source: g.fuente,
    }));

    return res.status(200).json({
      ok: true,
      guias: transformed,
      total: count,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    console.error('[Guias] Error:', error);
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
