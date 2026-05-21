/**
 * uiStore — modos de ventana (Micro / Mini / Halo / Comando) +
 * preferencias visuales (opacidad, conexiones modal abierto).
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WindowMode = 'micro' | 'mini' | 'halo' | 'comando';

export interface ModeSize {
  width: number;
  height: number;
}

export const MODE_SIZES: Record<WindowMode, ModeSize> = {
  micro: { width: 220, height: 88 },
  mini: { width: 340, height: 320 },
  halo: { width: 380, height: 620 },
  comando: { width: 1280, height: 800 },
};

interface UIState {
  mode: WindowMode;
  conexionesOpen: boolean;
  opacityPct: number; // 50-100

  setMode: (mode: WindowMode) => void;
  cycleMode: () => void;
  openConexiones: () => void;
  closeConexiones: () => void;
  setOpacity: (pct: number) => void;
}

const MODE_ORDER: WindowMode[] = ['micro', 'mini', 'halo', 'comando'];

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      mode: 'halo',
      conexionesOpen: false,
      opacityPct: 100,

      setMode: (mode) => {
        set({ mode });
        const size = MODE_SIZES[mode];
        window.litperDesk?.invoke('window:set-size', size).catch(() => {});
      },

      cycleMode: () => {
        const i = MODE_ORDER.indexOf(get().mode);
        const next = MODE_ORDER[(i + 1) % MODE_ORDER.length];
        get().setMode(next);
      },

      openConexiones: () => set({ conexionesOpen: true }),
      closeConexiones: () => set({ conexionesOpen: false }),

      setOpacity: (pct) => {
        const clamped = Math.max(50, Math.min(100, Math.round(pct)));
        set({ opacityPct: clamped });
        window.litperDesk?.invoke('window:set-opacity', { opacity: clamped / 100 }).catch(() => {});
      },
    }),
    { name: 'litper-desk:ui', version: 1 },
  ),
);
