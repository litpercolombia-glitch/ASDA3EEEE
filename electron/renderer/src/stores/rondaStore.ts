/**
 * rondaStore — estado de la ronda actual + histórico del día.
 *
 * Mantiene timer regresivo, 8 contadores (incluida Novedades), y un
 * histórico de rondas guardadas con su timestamp para sparklines y
 * cálculo de tasa/CPA/racha.
 *
 * En Fase 2 sincroniza con Supabase (`rondas.events`) via Realtime.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CounterKey =
  | 'iniciales'
  | 'realizado'
  | 'cancelado'
  | 'agendado'
  | 'dificiles'
  | 'pendientes'
  | 'revisado'
  | 'novedades';

export interface Counters {
  iniciales: number;
  realizado: number;
  cancelado: number;
  agendado: number;
  dificiles: number;
  pendientes: number;
  revisado: number;
  novedades: number;
}

export type TimerState = 'idle' | 'running' | 'paused' | 'finished';

export interface RondaSnapshot {
  id: string;
  numero: number;
  userId: string;
  fecha: string;
  startedAt: string;
  endedAt: string;
  counters: Counters;
  notas?: string;
}

export interface DiaCerrado {
  fecha: string;
  cerradoEn: string;
  totalRondas: number;
  totalIniciales: number;
  totalRealizado: number;
  tasaFinal: number;
  cumplioMeta: boolean;
}

interface RondaState {
  rondaNumero: number;
  durationSec: number;
  remainingSec: number;
  state: TimerState;
  counters: Counters;
  lastTickAt: number | null;
  startedAt: string | null;

  fechaActual: string;
  rondasHoy: RondaSnapshot[];
  diasCerrados: DiaCerrado[];

  startTimer: (durationSec?: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  tick: () => void;

  bumpCounter: (key: CounterKey, delta: number) => void;
  setCounter: (key: CounterKey, value: number) => void;
  resetCounters: () => void;

  saveRonda: (userId: string) => RondaSnapshot;
  reiniciarDia: () => void;
  finalizarDia: () => DiaCerrado;
}

const ZERO_COUNTERS: Counters = {
  iniciales: 0,
  realizado: 0,
  cancelado: 0,
  agendado: 0,
  dificiles: 0,
  pendientes: 0,
  revisado: 0,
  novedades: 0,
};

const DEFAULT_DURATION_SEC = 30 * 60;
const META_TASA = 0.805;
const CPA_DIVIDEND_COP = 15000;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useRondaStore = create<RondaState>()(
  persist(
    (set, get) => ({
      rondaNumero: 1,
      durationSec: DEFAULT_DURATION_SEC,
      remainingSec: DEFAULT_DURATION_SEC,
      state: 'idle',
      counters: { ...ZERO_COUNTERS },
      lastTickAt: null,
      startedAt: null,

      fechaActual: todayISO(),
      rondasHoy: [],
      diasCerrados: [],

      startTimer: (durationSec) => {
        const dur = durationSec ?? get().durationSec;
        set({
          durationSec: dur,
          remainingSec: dur,
          state: 'running',
          lastTickAt: Date.now(),
          startedAt: get().startedAt ?? new Date().toISOString(),
        });
      },

      pauseTimer: () => {
        if (get().state !== 'running') return;
        set({ state: 'paused', lastTickAt: null });
      },

      resumeTimer: () => {
        if (get().state !== 'paused') return;
        set({ state: 'running', lastTickAt: Date.now() });
      },

      resetTimer: () => {
        set((s) => ({
          remainingSec: s.durationSec,
          state: 'idle',
          lastTickAt: null,
          startedAt: null,
        }));
      },

      tick: () => {
        const s = get();
        if (s.state !== 'running' || s.lastTickAt == null) return;
        const now = Date.now();
        const elapsedSec = Math.floor((now - s.lastTickAt) / 1000);
        if (elapsedSec < 1) return;
        const remaining = Math.max(0, s.remainingSec - elapsedSec);
        set({
          remainingSec: remaining,
          lastTickAt: now,
          state: remaining === 0 ? 'finished' : 'running',
        });
      },

      bumpCounter: (key, delta) => {
        set((s) => ({
          counters: { ...s.counters, [key]: Math.max(0, s.counters[key] + delta) },
        }));
      },

      setCounter: (key, value) => {
        set((s) => ({
          counters: { ...s.counters, [key]: Math.max(0, Math.floor(value)) },
        }));
      },

      resetCounters: () => set({ counters: { ...ZERO_COUNTERS } }),

      saveRonda: (userId) => {
        const s = get();
        const snap: RondaSnapshot = {
          id: genId(),
          numero: s.rondaNumero,
          userId,
          fecha: s.fechaActual,
          startedAt: s.startedAt ?? new Date().toISOString(),
          endedAt: new Date().toISOString(),
          counters: { ...s.counters },
        };
        set({
          rondaNumero: s.rondaNumero + 1,
          counters: { ...ZERO_COUNTERS },
          remainingSec: s.durationSec,
          state: 'idle',
          lastTickAt: null,
          startedAt: null,
          rondasHoy: [...s.rondasHoy, snap],
        });
        return snap;
      },

      reiniciarDia: () => {
        set({
          rondaNumero: 1,
          counters: { ...ZERO_COUNTERS },
          remainingSec: DEFAULT_DURATION_SEC,
          state: 'idle',
          lastTickAt: null,
          startedAt: null,
          fechaActual: todayISO(),
          rondasHoy: [],
        });
      },

      finalizarDia: () => {
        const s = get();
        const totales = sumarRondas(s.rondasHoy);
        const tasa = totales.iniciales > 0 ? totales.realizado / totales.iniciales : 0;
        const dia: DiaCerrado = {
          fecha: s.fechaActual,
          cerradoEn: new Date().toISOString(),
          totalRondas: s.rondasHoy.length,
          totalIniciales: totales.iniciales,
          totalRealizado: totales.realizado,
          tasaFinal: tasa,
          cumplioMeta: tasa >= META_TASA,
        };
        set({
          diasCerrados: [...s.diasCerrados, dia],
          rondaNumero: 1,
          counters: { ...ZERO_COUNTERS },
          remainingSec: DEFAULT_DURATION_SEC,
          state: 'idle',
          lastTickAt: null,
          startedAt: null,
          fechaActual: todayISO(),
          rondasHoy: [],
        });
        return dia;
      },
    }),
    { name: 'litper-desk:ronda', version: 2 },
  ),
);

export function sumarRondas(rondas: RondaSnapshot[]): Counters {
  const total = { ...ZERO_COUNTERS };
  for (const r of rondas) {
    for (const k of Object.keys(ZERO_COUNTERS) as CounterKey[]) {
      total[k] += r.counters[k];
    }
  }
  return total;
}

export interface KPIsDia {
  totalIniciales: number;
  totalRealizado: number;
  tasa: number;
  cpaCOP: number;
  cumpleMeta: boolean;
  rachaActual: number;
  bestHour: string | null;
}

export function computeKPIs(
  rondasHoy: RondaSnapshot[],
  countersActuales: Counters,
  diasCerrados: DiaCerrado[],
): KPIsDia {
  const acumulado = sumarRondas(rondasHoy);
  const total: Counters = {
    iniciales: acumulado.iniciales + countersActuales.iniciales,
    realizado: acumulado.realizado + countersActuales.realizado,
    cancelado: acumulado.cancelado + countersActuales.cancelado,
    agendado: acumulado.agendado + countersActuales.agendado,
    dificiles: acumulado.dificiles + countersActuales.dificiles,
    pendientes: acumulado.pendientes + countersActuales.pendientes,
    revisado: acumulado.revisado + countersActuales.revisado,
    novedades: acumulado.novedades + countersActuales.novedades,
  };

  const tasa = total.iniciales > 0 ? total.realizado / total.iniciales : 0;
  const cpa = tasa > 0 ? CPA_DIVIDEND_COP / tasa : Infinity;
  const cumpleMeta = tasa >= META_TASA;

  let racha = 0;
  for (let i = diasCerrados.length - 1; i >= 0; i--) {
    if (diasCerrados[i].cumplioMeta) racha++;
    else break;
  }
  if (cumpleMeta && total.iniciales > 0) racha += 1;

  const porHora: Record<number, number> = {};
  for (const r of rondasHoy) {
    const h = new Date(r.endedAt).getHours();
    porHora[h] = (porHora[h] || 0) + r.counters.realizado;
  }
  let bestHour: string | null = null;
  let bestVal = 0;
  for (const [h, v] of Object.entries(porHora)) {
    if (v > bestVal) {
      bestVal = v;
      bestHour = `${h.padStart(2, '0')}:00`;
    }
  }

  return {
    totalIniciales: total.iniciales,
    totalRealizado: total.realizado,
    tasa,
    cpaCOP: cpa,
    cumpleMeta,
    rachaActual: racha,
    bestHour,
  };
}

export function semaforoColor(tasa: number): 'verde' | 'amarillo' | 'rojo' {
  if (tasa >= 0.805) return 'verde';
  if (tasa >= 0.7) return 'amarillo';
  return 'rojo';
}

export function timerColor(remainingSec: number, durationSec: number): {
  text: string;
  bg: string;
  pulse: boolean;
} {
  const pct = durationSec === 0 ? 0 : remainingSec / durationSec;
  if (pct > 0.5) return { text: 'text-semaforo-verde', bg: 'bg-semaforo-verde/10', pulse: false };
  if (pct > 0.25) return { text: 'text-semaforo-amarillo', bg: 'bg-semaforo-amarillo/10', pulse: false };
  if (pct > 0.1) return { text: 'text-orange-400', bg: 'bg-orange-500/10', pulse: false };
  return { text: 'text-semaforo-rojo', bg: 'bg-semaforo-rojo/10', pulse: true };
}

export function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function formatCOP(n: number): string {
  if (!isFinite(n)) return '–';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${Math.round(n)}`;
}
