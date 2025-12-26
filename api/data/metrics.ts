// /api/data/metrics.ts
// Endpoint para obtener métricas del dashboard
// Usa esquema real: guias, cargas, alertas, ciudades_stats

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

    // 1. Obtener guías
    const { data: guias, error: guiasError } = await supabase
      .from('guias')
      .select('estado, transportadora, ciudad_destino, valor_declarado, ganancia, tiene_novedad, dias_transito');

    if (guiasError) throw guiasError;

    // 2. Obtener cargas activas
    const { data: cargas, error: cargasError } = await supabase
      .from('cargas')
      .select('*')
      .eq('estado', 'activa');

    if (cargasError) throw cargasError;

    // 3. Obtener alertas no leídas
    const { data: alertas, error: alertasError } = await supabase
      .from('alertas')
      .select('tipo, titulo')
      .eq('leida', false);

    if (alertasError) throw alertasError;

    // 4. Obtener ciudades stats
    const { data: ciudades, error: ciudadesError } = await supabase
      .from('ciudades_stats')
      .select('*');

    if (ciudadesError) throw ciudadesError;

    // Calcular métricas de guías
    const totalGuias = guias?.length || 0;

    const guiasByEstado: Record<string, number> = {};
    const guiasByTransportadora: Record<string, number> = {};
    const guiasByCiudad: Record<string, number> = {};
    let totalValor = 0;
    let totalGanancia = 0;
    let conNovedad = 0;
    let totalDiasTransito = 0;

    guias?.forEach(g => {
      guiasByEstado[g.estado] = (guiasByEstado[g.estado] || 0) + 1;
      guiasByTransportadora[g.transportadora] = (guiasByTransportadora[g.transportadora] || 0) + 1;
      guiasByCiudad[g.ciudad_destino] = (guiasByCiudad[g.ciudad_destino] || 0) + 1;
      totalValor += g.valor_declarado || 0;
      totalGanancia += g.ganancia || 0;
      if (g.tiene_novedad) conNovedad++;
      totalDiasTransito += g.dias_transito || 0;
    });

    // Tasas
    const entregadas = guiasByEstado['Entregado'] || guiasByEstado['ENTREGADO'] || 0;
    const devueltas = (guiasByEstado['Devolucion'] || 0) + (guiasByEstado['DEVOLUCION'] || 0) + (guiasByEstado['Rechazado'] || 0);
    const enTransito = guiasByEstado['En transito'] || guiasByEstado['EN_TRANSITO'] || guiasByEstado['Pendiente'] || 0;

    const tasaEntrega = totalGuias > 0 ? Math.round((entregadas / totalGuias) * 100) : 0;
    const tasaDevolucion = totalGuias > 0 ? Math.round((devueltas / totalGuias) * 100) : 0;
    const tiempoPromedio = totalGuias > 0 ? Math.round(totalDiasTransito / totalGuias) : 0;

    // Top ciudades con problemas
    const ciudadesProblematicas = ciudades
      ?.filter(c => c.status === 'rojo' || c.status === 'amarillo')
      .sort((a, b) => b.tasa_devolucion - a.tasa_devolucion)
      .slice(0, 5)
      .map(c => ({
        ciudad: c.ciudad,
        tasaEntrega: c.tasa_entrega,
        tasaDevolucion: c.tasa_devolucion,
        status: c.status,
      })) || [];

    // Alertas por tipo
    const alertasByTipo: Record<string, number> = {};
    alertas?.forEach(a => {
      alertasByTipo[a.tipo] = (alertasByTipo[a.tipo] || 0) + 1;
    });

    // Resumen de cargas
    const cargasResumen = cargas?.map(c => ({
      nombre: c.nombre,
      totalGuias: c.total_guias,
      entregadas: c.entregadas,
      porcentajeEntrega: c.porcentaje_entrega,
      valorTotal: c.valor_total,
    })) || [];

    return res.status(200).json({
      ok: true,
      timestamp: new Date().toISOString(),
      metrics: {
        // Totales
        totalGuias,
        cargasActivas: cargas?.length || 0,
        alertasSinLeer: alertas?.length || 0,

        // Tasas
        tasaEntrega,
        tasaDevolucion,
        tiempoPromedio,

        // Conteos
        entregadas,
        devueltas,
        enTransito,
        conNovedad,

        // Financiero
        totalValor,
        totalGanancia,

        // Desglose
        guiasByEstado,
        guiasByTransportadora,
        alertasByTipo,
        ciudadesProblematicas,
        cargasResumen,
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
