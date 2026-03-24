// services/pedidosIntegrationService.ts
// Servicio de integración entre la app de pedidos (timer) y el sistema de reportes

import {
  RondaReportData,
  PedidosResumen,
  META_MINUTOS_POR_PEDIDO,
  calcularResumenPedidos,
  crearRondaData,
} from './reportUploadService';

// ============================================
// TIPOS DEL TIMER APP (litper-pedidos-store)
// ============================================

interface TimerUsuario {
  id: string;
  nombre: string;
  avatar: string;
  color: string;
  metaDiaria: number;
  rol: 'usuario' | 'admin';
  activo: boolean;
  createdAt: string;
}

interface TimerRonda {
  id: string;
  usuarioId: string;
  numero: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  tiempoUsado: number; // seconds
  pedidosRealizados: number;
  pedidosCancelados: number;
  pedidosAgendados: number;
}

interface TimerStoreData {
  state: {
    usuarios: TimerUsuario[];
    usuarioActual: TimerUsuario | null;
    configTimer: {
      duracionMinutos: number;
      alertaAmarilla: number;
      alertaNaranja: number;
      alertaRoja: number;
      sonidoFinal: boolean;
    };
    rondas: TimerRonda[];
    rondaActual: number;
  };
  version?: number;
}

const TIMER_STORAGE_KEY = 'litper-pedidos-store';

// ============================================
// FUNCIONES DE LECTURA
// ============================================

function loadTimerData(): TimerStoreData | null {
  try {
    const raw = localStorage.getItem(TIMER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TimerStoreData;
  } catch {
    return null;
  }
}

export function timerDataDisponible(): boolean {
  const data = loadTimerData();
  return data !== null && data.state?.rondas?.length > 0;
}

export function getTimerUsuarios(): TimerUsuario[] {
  const data = loadTimerData();
  return data?.state?.usuarios?.filter(u => u.activo) || [];
}

export function getTimerUsuarioActual(): TimerUsuario | null {
  const data = loadTimerData();
  return data?.state?.usuarioActual || null;
}

// ============================================
// IMPORTAR RONDAS
// ============================================

export function importarRondasDelDia(
  usuarioId?: string,
  fecha?: string
): { rondas: RondaReportData[]; usuario: TimerUsuario | null; metaDiaria: number } | null {
  const data = loadTimerData();
  if (!data?.state?.rondas) return null;

  const targetFecha = fecha || new Date().toISOString().split('T')[0];
  const targetUserId = usuarioId || data.state.usuarioActual?.id;

  if (!targetUserId) return null;

  const usuario = data.state.usuarios?.find(u => u.id === targetUserId) || null;
  const rondasTimer = data.state.rondas.filter(
    r => r.usuarioId === targetUserId && r.fecha === targetFecha
  );

  if (rondasTimer.length === 0) return null;

  const rondas: RondaReportData[] = rondasTimer.map(r => {
    const duracionMinutos = r.tiempoUsado / 60; // tiempoUsado is in seconds
    return crearRondaData(
      r.numero,
      Math.round(duracionMinutos * 100) / 100,
      r.pedidosRealizados,
      r.pedidosCancelados,
      r.pedidosAgendados,
      r.horaInicio,
      r.horaFin
    );
  });

  return {
    rondas,
    usuario,
    metaDiaria: usuario?.metaDiaria || 0,
  };
}

export function importarRondasPorRango(
  usuarioId: string,
  fechaInicio: string,
  fechaFin: string
): { rondas: TimerRonda[]; fechas: string[] } | null {
  const data = loadTimerData();
  if (!data?.state?.rondas) return null;

  const rondas = data.state.rondas.filter(r => {
    return r.usuarioId === usuarioId &&
      r.fecha >= fechaInicio &&
      r.fecha <= fechaFin;
  });

  const fechas = [...new Set(rondas.map(r => r.fecha))].sort();

  return { rondas, fechas };
}

// ============================================
// FECHAS DISPONIBLES
// ============================================

export function getFechasConDatos(usuarioId?: string): string[] {
  const data = loadTimerData();
  if (!data?.state?.rondas) return [];

  let rondas = data.state.rondas;
  if (usuarioId) {
    rondas = rondas.filter(r => r.usuarioId === usuarioId);
  }

  return [...new Set(rondas.map(r => r.fecha))].sort().reverse();
}

// ============================================
// RESUMEN RÁPIDO DEL TIMER
// ============================================

export function getResumenTimerHoy(usuarioId?: string): {
  usuario: string;
  totalPedidos: number;
  totalRondas: number;
  tiempoPromedio: number;
  metaDiaria: number;
  cumplimientoMeta: number;
} | null {
  const result = importarRondasDelDia(usuarioId);
  if (!result || result.rondas.length === 0) return null;

  const resumen = calcularResumenPedidos(result.rondas, result.metaDiaria);

  return {
    usuario: result.usuario?.nombre || 'Sin nombre',
    totalPedidos: resumen.totalPedidos,
    totalRondas: resumen.totalRondas,
    tiempoPromedio: resumen.tiempoPromedioPorPedido,
    metaDiaria: result.metaDiaria,
    cumplimientoMeta: resumen.cumplimientoMetaDiaria,
  };
}
