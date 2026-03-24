// services/timerIntegrationService.ts
// Integración entre litper-pedidos-app (timer) y el módulo de Análisis de Rondas

import { RondaCSV } from '../types/analisis-rondas';

// Tipos del timer app (litper-pedidos-store)
interface TimerUsuario {
  id: string;
  nombre: string;
  metaDiaria: number;
  activo: boolean;
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
    rondas: TimerRonda[];
    usuarioActual: TimerUsuario | null;
  };
}

const TIMER_STORAGE_KEY = 'litper-pedidos-store';

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

/**
 * Importar rondas del timer y convertirlas al formato RondaCSV
 * que el módulo de Análisis de Rondas ya sabe procesar.
 */
export function importarRondasComoCSV(fecha?: string): RondaCSV[] {
  const data = loadTimerData();
  if (!data?.state?.rondas || !data.state?.usuarios) return [];

  const usuarios = data.state.usuarios;
  let rondas = data.state.rondas;

  // Filtrar por fecha si se especifica
  if (fecha) {
    rondas = rondas.filter(r => r.fecha === fecha);
  }

  return rondas.map(r => {
    const usuario = usuarios.find(u => u.id === r.usuarioId);
    const duracionMinutos = r.tiempoUsado / 60;

    return {
      usuario: (usuario?.nombre || 'DESCONOCIDO').toUpperCase(),
      fecha: r.fecha,
      horaInicio: r.horaInicio || '00:00',
      horaFin: r.horaFin || '00:00',
      rondaNumero: r.numero,
      guiasIniciales: r.pedidosRealizados + r.pedidosCancelados + r.pedidosAgendados,
      guiasRealizadas: r.pedidosRealizados,
      canceladas: r.pedidosCancelados,
      agendadas: r.pedidosAgendados,
      pendientes: r.pedidosAgendados,
      tiempoRegistro: Math.round(duracionMinutos * 100) / 100,
      novedades: 0,
    };
  });
}

export function getFechasDisponibles(): string[] {
  const data = loadTimerData();
  if (!data?.state?.rondas) return [];
  return [...new Set(data.state.rondas.map(r => r.fecha))].sort().reverse();
}
