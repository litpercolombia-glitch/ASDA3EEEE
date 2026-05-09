/**
 * rondaStore — estado de la ronda actual del operador.
 *
 * Mantiene timer regresivo, contadores y permite guardar la ronda.
 * Estado local persistido en localStorage; en Fase 2 sincroniza con
 * Supabase (`rondas.events`) via Realtime.
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
  | 'revisado';

export interface Counters {
  iniciales: number;
  realizado: number;
  cancelado: number;
  agendado: number;
  dificiles: number;
  pendientes: number;
  revisado: number;
}

export type TimerState = 'idle' | 'running' | 'paused' | 'finished';

interface RondaState {
  rondaNumero: number;
  durationSec: number;
  remainingSec: number;
  state: TimerState;
  counters: Counters;
  lastTickAt: number | null;

  startTimer: (durationSec?: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  tick: () => void;

  bumpCounter: (key: CounterKey, delta: number) => void;
  setCounter: (key: CounterKey, value: number) => void;
  resetCounters: () => void;

  saveRonda: () => void;
}

const ZERO_COUNTERS: Counters = {
  iniciales: 0,
  realizado: 0,
  cancelado: 0,
  agendado: 0,
  dificiles: 0,
  pendientes: 0,
  revisado: 0,
};

const DEFAULT_DURATION_SEC = 30 * 60; // 30 min

export const useRondaStore = create<RondaState>()(
  persist(
    (set, get) => ({
      rondaNumero: 1,
      durationSec: DEFAULT_DURATION_SEC,
      remainingSec: DEFAULT_DURATION_SEC,
      state: 'idle',
      counters: { ...ZERO_COUNTERS },
      lastTickAt: null,

      startTimer: (durationSec) => {
        const dur = durationSec ?? get().durationSec;
        set({
          durationSec: dur,
          remainingSec: dur,
          state: 'running',
          lastTickAt: Date.now(),
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
          counters: {
            ...s.counters,
            [key]: Math.max(0, s.counters[key] + delta),
          },
        }));
      },

      setCounter: (key, value) => {
        set((s) => ({
          counters: { ...s.counters, [key]: Math.max(0, Math.floor(value)) },
        }));
      },

      resetCounters: () => set({ counters: { ...ZERO_COUNTERS } }),

      saveRonda: () => {
        // En Fase 2: aqui se hace upsert a Supabase rondas.events.
        // Por ahora solo avanzamos el numero de ronda y reseteamos.
        set((s) => ({
          rondaNumero: s.rondaNumero + 1,
          counters: { ...ZERO_COUNTERS },
          remainingSec: s.durationSec,
          state: 'idle',
          lastTickAt: null,
        }));
      },
    }),
    {
      name: 'litper-desk:ronda',
      version: 1,
    },
  ),
);

/** Color del timer según el porcentaje restante. */
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
