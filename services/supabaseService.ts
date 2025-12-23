// ============================================
// LITPER PRO - SUPABASE SERVICE
// Conexión a base de datos en la nube
// ============================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================
// CONFIGURACIÓN
// ============================================

// Estas variables deben estar en tu .env
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// ============================================
// TIPOS DE BASE DE DATOS
// ============================================

export interface DBGuia {
  id: string;
  numero_guia: string;
  transportadora: string;
  ciudad_destino: string;
  departamento: string;
  estado: string;
  estado_detalle?: string;
  nombre_cliente: string;
  telefono?: string;
  direccion?: string;
  valor_declarado: number;
  valor_flete: number;
  ganancia: number;
  dias_transito: number;
  tiene_novedad: boolean;
  tipo_novedad?: string;
  descripcion_novedad?: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  fecha_entrega?: string;
  carga_id?: string;
  usuario_id?: string;
  fuente: 'DROPI' | 'MANUAL' | 'EXCEL' | 'API';
  metadata?: Record<string, unknown>;
}

export interface DBCarga {
  id: string;
  nombre: string;
  numero_carga: number;
  fecha: string;
  usuario_id: string;
  usuario_nombre: string;
  estado: 'activa' | 'cerrada' | 'archivada';
  total_guias: number;
  entregadas: number;
  en_transito: number;
  con_novedad: number;
  devueltas: number;
  porcentaje_entrega: number;
  valor_total: number;
  ganancia_total: number;
  created_at: string;
  updated_at: string;
  closed_at?: string;
}

export interface DBFinanza {
  id: string;
  tipo: 'ingreso' | 'gasto';
  categoria: string;
  subcategoria?: string;
  descripcion: string;
  monto: number;
  fecha: string;
  mes: string; // formato: 2024-01
  comprobante_url?: string;
  usuario_id: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface DBCiudadStats {
  id: string;
  ciudad: string;
  departamento: string;
  total_guias: number;
  entregadas: number;
  devueltas: number;
  en_transito: number;
  tasa_entrega: number;
  tasa_devolucion: number;
  tiempo_promedio: number;
  status: 'verde' | 'amarillo' | 'naranja' | 'rojo';
  transportadora_principal: string;
  pausado: boolean;
  ultima_actualizacion: string;
}

export interface DBTransportadoraStats {
  id: string;
  nombre: string;
  total_guias: number;
  entregadas: number;
  devueltas: number;
  tasa_entrega: number;
  tiempo_promedio: number;
  costo_promedio: number;
  ultima_actualizacion: string;
}

export interface DBAlerta {
  id: string;
  tipo: 'critica' | 'advertencia' | 'info' | 'exito';
  titulo: string;
  mensaje: string;
  fuente: string;
  leida: boolean;
  accion_url?: string;
  usuario_id?: string;
  created_at: string;
}

export interface DBActividad {
  id: string;
  tipo: 'carga' | 'entrega' | 'novedad' | 'finanza' | 'usuario' | 'sistema';
  titulo: string;
  descripcion: string;
  usuario_id?: string;
  usuario_nombre?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// ============================================
// CLIENTE SUPABASE
// ============================================

let supabase: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (!supabase) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn('Supabase no configurado. Usando localStorage como fallback.');
      throw new Error('SUPABASE_NOT_CONFIGURED');
    }
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabase;
};

export const isSupabaseConfigured = (): boolean => {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
};

// ============================================
// SERVICIOS DE GUÍAS
// ============================================

export const guiasService = {
  async getAll(limit = 100, offset = 0): Promise<DBGuia[]> {
    const { data, error } = await getSupabase()
      .from('guias')
      .select('*')
      .order('fecha_creacion', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  },

  async getByFecha(fechaInicio: string, fechaFin: string): Promise<DBGuia[]> {
    const { data, error } = await getSupabase()
      .from('guias')
      .select('*')
      .gte('fecha_creacion', fechaInicio)
      .lte('fecha_creacion', fechaFin)
      .order('fecha_creacion', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getHoy(): Promise<DBGuia[]> {
    const hoy = new Date().toISOString().split('T')[0];
    const { data, error } = await getSupabase()
      .from('guias')
      .select('*')
      .gte('fecha_creacion', hoy)
      .order('fecha_creacion', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getByCarga(cargaId: string): Promise<DBGuia[]> {
    const { data, error } = await getSupabase()
      .from('guias')
      .select('*')
      .eq('carga_id', cargaId)
      .order('fecha_creacion', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getByEstado(estado: string): Promise<DBGuia[]> {
    const { data, error } = await getSupabase()
      .from('guias')
      .select('*')
      .eq('estado', estado)
      .order('fecha_creacion', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(guia: Omit<DBGuia, 'id'>): Promise<DBGuia> {
    const { data, error } = await getSupabase()
      .from('guias')
      .insert(guia)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createMany(guias: Omit<DBGuia, 'id'>[]): Promise<DBGuia[]> {
    const { data, error } = await getSupabase()
      .from('guias')
      .insert(guias)
      .select();

    if (error) throw error;
    return data || [];
  },

  async update(id: string, updates: Partial<DBGuia>): Promise<DBGuia> {
    const { data, error } = await getSupabase()
      .from('guias')
      .update({ ...updates, fecha_actualizacion: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await getSupabase()
      .from('guias')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getStats(): Promise<{
    total: number;
    entregadas: number;
    enTransito: number;
    conNovedad: number;
    devueltas: number;
    tasaEntrega: number;
  }> {
    const { data, error } = await getSupabase()
      .from('guias')
      .select('estado');

    if (error) throw error;

    const guias = data || [];
    const total = guias.length;
    const entregadas = guias.filter(g => g.estado?.toLowerCase().includes('entregad')).length;
    const enTransito = guias.filter(g => g.estado?.toLowerCase().includes('transito') || g.estado?.toLowerCase().includes('ruta')).length;
    const conNovedad = guias.filter(g => g.estado?.toLowerCase().includes('novedad')).length;
    const devueltas = guias.filter(g => g.estado?.toLowerCase().includes('devolu') || g.estado?.toLowerCase().includes('retorno')).length;

    return {
      total,
      entregadas,
      enTransito,
      conNovedad,
      devueltas,
      tasaEntrega: total > 0 ? Math.round((entregadas / total) * 100) : 0,
    };
  },
};

// ============================================
// SERVICIOS DE CARGAS
// ============================================

export const cargasService = {
  async getAll(): Promise<DBCarga[]> {
    const { data, error } = await getSupabase()
      .from('cargas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getActivas(): Promise<DBCarga[]> {
    const { data, error } = await getSupabase()
      .from('cargas')
      .select('*')
      .eq('estado', 'activa')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<DBCarga | null> {
    const { data, error } = await getSupabase()
      .from('cargas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  },

  async create(carga: Omit<DBCarga, 'id' | 'created_at' | 'updated_at'>): Promise<DBCarga> {
    const { data, error } = await getSupabase()
      .from('cargas')
      .insert({
        ...carga,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<DBCarga>): Promise<DBCarga> {
    const { data, error } = await getSupabase()
      .from('cargas')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async cerrar(id: string): Promise<DBCarga> {
    return this.update(id, {
      estado: 'cerrada',
      closed_at: new Date().toISOString(),
    });
  },
};

// ============================================
// SERVICIOS DE FINANZAS
// ============================================

export const finanzasService = {
  async getByMes(mes: string): Promise<DBFinanza[]> {
    const { data, error } = await getSupabase()
      .from('finanzas')
      .select('*')
      .eq('mes', mes)
      .order('fecha', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getResumenMes(mes: string): Promise<{
    ingresos: number;
    gastos: number;
    utilidad: number;
    margen: number;
  }> {
    const registros = await this.getByMes(mes);

    const ingresos = registros
      .filter(r => r.tipo === 'ingreso')
      .reduce((sum, r) => sum + r.monto, 0);

    const gastos = registros
      .filter(r => r.tipo === 'gasto')
      .reduce((sum, r) => sum + r.monto, 0);

    const utilidad = ingresos - gastos;
    const margen = ingresos > 0 ? (utilidad / ingresos) * 100 : 0;

    return { ingresos, gastos, utilidad, margen };
  },

  async create(finanza: Omit<DBFinanza, 'id' | 'created_at'>): Promise<DBFinanza> {
    const { data, error } = await getSupabase()
      .from('finanzas')
      .insert({
        ...finanza,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// ============================================
// SERVICIOS DE ESTADÍSTICAS POR CIUDAD
// ============================================

export const ciudadesService = {
  async getAll(): Promise<DBCiudadStats[]> {
    const { data, error } = await getSupabase()
      .from('ciudades_stats')
      .select('*')
      .order('total_guias', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getByStatus(status: string): Promise<DBCiudadStats[]> {
    const { data, error } = await getSupabase()
      .from('ciudades_stats')
      .select('*')
      .eq('status', status);

    if (error) throw error;
    return data || [];
  },

  async getCriticas(): Promise<DBCiudadStats[]> {
    const { data, error } = await getSupabase()
      .from('ciudades_stats')
      .select('*')
      .in('status', ['rojo', 'naranja'])
      .order('tasa_entrega', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async pausar(ciudadId: string): Promise<void> {
    const { error } = await getSupabase()
      .from('ciudades_stats')
      .update({ pausado: true, ultima_actualizacion: new Date().toISOString() })
      .eq('id', ciudadId);

    if (error) throw error;
  },

  async reanudar(ciudadId: string): Promise<void> {
    const { error } = await getSupabase()
      .from('ciudades_stats')
      .update({ pausado: false, ultima_actualizacion: new Date().toISOString() })
      .eq('id', ciudadId);

    if (error) throw error;
  },

  async actualizarStats(ciudadId: string, stats: Partial<DBCiudadStats>): Promise<void> {
    const { error } = await getSupabase()
      .from('ciudades_stats')
      .update({ ...stats, ultima_actualizacion: new Date().toISOString() })
      .eq('id', ciudadId);

    if (error) throw error;
  },
};

// ============================================
// SERVICIOS DE ALERTAS
// ============================================

export const alertasService = {
  async getNoLeidas(): Promise<DBAlerta[]> {
    const { data, error } = await getSupabase()
      .from('alertas')
      .select('*')
      .eq('leida', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getRecientes(limit = 20): Promise<DBAlerta[]> {
    const { data, error } = await getSupabase()
      .from('alertas')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async crear(alerta: Omit<DBAlerta, 'id' | 'created_at'>): Promise<DBAlerta> {
    const { data, error } = await getSupabase()
      .from('alertas')
      .insert({
        ...alerta,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Alias para compatibilidad con otros servicios
  async create(alerta: Omit<DBAlerta, 'id' | 'created_at'>): Promise<DBAlerta> {
    return this.crear(alerta);
  },

  async marcarLeida(id: string): Promise<void> {
    const { error } = await getSupabase()
      .from('alertas')
      .update({ leida: true })
      .eq('id', id);

    if (error) throw error;
  },

  async marcarTodasLeidas(): Promise<void> {
    const { error } = await getSupabase()
      .from('alertas')
      .update({ leida: true })
      .eq('leida', false);

    if (error) throw error;
  },
};

// ============================================
// SERVICIOS DE ACTIVIDAD
// ============================================

export const actividadService = {
  async getReciente(limit = 50): Promise<DBActividad[]> {
    const { data, error } = await getSupabase()
      .from('actividad')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async registrar(actividad: Omit<DBActividad, 'id' | 'created_at'>): Promise<DBActividad> {
    const { data, error } = await getSupabase()
      .from('actividad')
      .insert({
        ...actividad,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Alias para compatibilidad con otros servicios
  async create(actividad: Omit<DBActividad, 'id' | 'created_at'>): Promise<DBActividad> {
    return this.registrar(actividad);
  },
};

// ============================================
// DASHBOARD DATA SERVICE
// ============================================

export const dashboardService = {
  // Alias para compatibilidad
  async getStats() {
    return this.getDashboardData();
  },

  async getDashboardData(): Promise<{
    guiasHoy: number;
    entregadasHoy: number;
    enTransitoHoy: number;
    novedadesHoy: number;
    tasaEntrega: number;
    ventasHoy: number;
    gananciaHoy: number;
    cargasActivas: number;
    alertasNoLeidas: number;
  }> {
    try {
      const [guiasStats, cargasActivas, alertas] = await Promise.all([
        guiasService.getStats(),
        cargasService.getActivas(),
        alertasService.getNoLeidas(),
      ]);

      // Calcular ventas del día
      const guiasHoy = await guiasService.getHoy();
      const ventasHoy = guiasHoy.reduce((sum, g) => sum + (g.valor_declarado || 0), 0);
      const gananciaHoy = guiasHoy.reduce((sum, g) => sum + (g.ganancia || 0), 0);

      return {
        guiasHoy: guiasStats.total,
        entregadasHoy: guiasStats.entregadas,
        enTransitoHoy: guiasStats.enTransito,
        novedadesHoy: guiasStats.conNovedad,
        tasaEntrega: guiasStats.tasaEntrega,
        ventasHoy,
        gananciaHoy,
        cargasActivas: cargasActivas.length,
        alertasNoLeidas: alertas.length,
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      // Retornar datos vacíos en caso de error
      return {
        guiasHoy: 0,
        entregadasHoy: 0,
        enTransitoHoy: 0,
        novedadesHoy: 0,
        tasaEntrega: 0,
        ventasHoy: 0,
        gananciaHoy: 0,
        cargasActivas: 0,
        alertasNoLeidas: 0,
      };
    }
  },
};

// ============================================
// EXPORT DEFAULT
// ============================================

export default {
  getSupabase,
  isSupabaseConfigured,
  guias: guiasService,
  cargas: cargasService,
  finanzas: finanzasService,
  ciudades: ciudadesService,
  alertas: alertasService,
  actividad: actividadService,
  dashboard: dashboardService,
};
