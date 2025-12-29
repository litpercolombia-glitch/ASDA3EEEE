import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ==================== TIPOS ====================

export interface Usuario {
  id: string;
  nombre: string;
  avatar: string;
  color: string;
  metaDiaria: number;
  rol: 'usuario' | 'admin';
  activo: boolean;
  createdAt: string;
}

export interface Ronda {
  id: string;
  usuarioId: string;
  numero: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  tiempoUsado: number;
  pedidosRealizados: number;
  pedidosCancelados: number;
  pedidosAgendados: number;
}

export interface ConfigTimer {
  duracionMinutos: number;
  alertaAmarilla: number; // % restante
  alertaNaranja: number;
  alertaRoja: number;
  sonidoFinal: boolean;
}

export type TimerColor = 'green' | 'yellow' | 'orange' | 'red';
export type TimerState = 'idle' | 'running' | 'paused' | 'finished';
export type ViewMode = 'timer' | 'stats' | 'admin';

// ==================== CONSTANTES ====================

export const COLORES_USUARIO = [
  { id: 'orange', name: 'Naranja', hex: '#F97316' },
  { id: 'blue', name: 'Azul', hex: '#3B82F6' },
  { id: 'green', name: 'Verde', hex: '#10B981' },
  { id: 'purple', name: 'Morado', hex: '#8B5CF6' },
  { id: 'pink', name: 'Rosa', hex: '#EC4899' },
  { id: 'cyan', name: 'Cyan', hex: '#06B6D4' },
  { id: 'yellow', name: 'Amarillo', hex: '#F59E0B' },
  { id: 'red', name: 'Rojo', hex: '#EF4444' },
];

export const AVATARES = ['😊', '😎', '🚀', '⭐', '🔥', '💪', '🎯', '📦', '🏆', '💎', '🦊', '🐱', '🐶', '🦁', '🐼'];

export const TIEMPOS_PRESET = [15, 20, 25, 30, 45, 60];

// ==================== STORE ====================

interface AppState {
  // Usuarios
  usuarios: Usuario[];
  usuarioActual: Usuario | null;
  modoAdmin: boolean;

  // Timer
  configTimer: ConfigTimer;
  timerState: TimerState;
  tiempoRestante: number;
  rondaActual: number;

  // Rondas
  rondas: Ronda[];

  // UI
  viewMode: ViewMode;
  isCompact: boolean;

  // Acciones - Usuarios
  agregarUsuario: (data: Omit<Usuario, 'id' | 'createdAt' | 'activo'>) => void;
  actualizarUsuario: (id: string, data: Partial<Usuario>) => void;
  eliminarUsuario: (id: string) => void;
  seleccionarUsuario: (id: string | null) => void;
  toggleModoAdmin: () => void;

  // Acciones - Timer
  setConfigTimer: (config: Partial<ConfigTimer>) => void;
  iniciarTimer: () => void;
  pausarTimer: () => void;
  resetearTimer: () => void;
  tick: () => void;
  getTimerColor: () => TimerColor;

  // Acciones - Rondas
  registrarRonda: (data: Omit<Ronda, 'id'>) => void;
  getRondasUsuario: (usuarioId: string) => Ronda[];
  getRondasHoy: (usuarioId: string) => Ronda[];
  getTotalHoy: (usuarioId: string) => number;
  reiniciarRondas: () => void;

  // Acciones - UI
  setViewMode: (mode: ViewMode) => void;
  toggleCompact: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      usuarios: [],
      usuarioActual: null,
      modoAdmin: false,

      configTimer: {
        duracionMinutos: 25,
        alertaAmarilla: 50,
        alertaNaranja: 25,
        alertaRoja: 10,
        sonidoFinal: true,
      },
      timerState: 'idle',
      tiempoRestante: 25 * 60,
      rondaActual: 1,

      rondas: [],

      viewMode: 'timer',
      isCompact: false,

      // ========== USUARIOS ==========

      agregarUsuario: (data) => {
        const nuevoUsuario: Usuario = {
          ...data,
          id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          activo: true,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          usuarios: [...state.usuarios, nuevoUsuario],
        }));
      },

      actualizarUsuario: (id, data) => {
        set((state) => ({
          usuarios: state.usuarios.map((u) =>
            u.id === id ? { ...u, ...data } : u
          ),
          usuarioActual:
            state.usuarioActual?.id === id
              ? { ...state.usuarioActual, ...data }
              : state.usuarioActual,
        }));
      },

      eliminarUsuario: (id) => {
        set((state) => ({
          usuarios: state.usuarios.filter((u) => u.id !== id),
          usuarioActual: state.usuarioActual?.id === id ? null : state.usuarioActual,
        }));
      },

      seleccionarUsuario: (id) => {
        const { usuarios } = get();
        const usuario = id ? usuarios.find((u) => u.id === id) : null;
        set({ usuarioActual: usuario || null });
      },

      toggleModoAdmin: () => {
        set((state) => ({ modoAdmin: !state.modoAdmin }));
      },

      // ========== TIMER ==========

      setConfigTimer: (config) => {
        set((state) => {
          const newConfig = { ...state.configTimer, ...config };
          return {
            configTimer: newConfig,
            tiempoRestante:
              config.duracionMinutos !== undefined
                ? config.duracionMinutos * 60
                : state.tiempoRestante,
          };
        });
      },

      iniciarTimer: () => {
        set({ timerState: 'running' });
      },

      pausarTimer: () => {
        set({ timerState: 'paused' });
      },

      resetearTimer: () => {
        const { configTimer } = get();
        set({
          timerState: 'idle',
          tiempoRestante: configTimer.duracionMinutos * 60,
        });
      },

      tick: () => {
        const { tiempoRestante, timerState, configTimer } = get();

        if (timerState !== 'running') return;

        if (tiempoRestante <= 1) {
          // Timer terminado
          set({ tiempoRestante: 0, timerState: 'finished' });

          // Reproducir sonido
          if (configTimer.sonidoFinal) {
            try {
              const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
              const oscillator = audioContext.createOscillator();
              const gainNode = audioContext.createGain();

              oscillator.connect(gainNode);
              gainNode.connect(audioContext.destination);

              oscillator.frequency.value = 800;
              oscillator.type = 'sine';
              gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
              gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);

              oscillator.start(audioContext.currentTime);
              oscillator.stop(audioContext.currentTime + 0.8);
            } catch (e) {
              console.log('Audio not supported');
            }
          }

          return;
        }

        set({ tiempoRestante: tiempoRestante - 1 });
      },

      getTimerColor: () => {
        const { tiempoRestante, configTimer } = get();
        const totalSeconds = configTimer.duracionMinutos * 60;
        const percentRemaining = (tiempoRestante / totalSeconds) * 100;

        if (percentRemaining <= configTimer.alertaRoja) return 'red';
        if (percentRemaining <= configTimer.alertaNaranja) return 'orange';
        if (percentRemaining <= configTimer.alertaAmarilla) return 'yellow';
        return 'green';
      },

      // ========== RONDAS ==========

      registrarRonda: (data) => {
        const nuevaRonda: Ronda = {
          ...data,
          id: `round_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };

        set((state) => ({
          rondas: [...state.rondas, nuevaRonda],
          rondaActual: state.rondaActual + 1,
        }));
      },

      getRondasUsuario: (usuarioId) => {
        return get().rondas.filter((r) => r.usuarioId === usuarioId);
      },

      getRondasHoy: (usuarioId) => {
        const hoy = new Date().toISOString().split('T')[0];
        return get().rondas.filter((r) => r.usuarioId === usuarioId && r.fecha === hoy);
      },

      getTotalHoy: (usuarioId) => {
        const rondasHoy = get().getRondasHoy(usuarioId);
        return rondasHoy.reduce((acc, r) => acc + r.pedidosRealizados, 0);
      },

      reiniciarRondas: () => {
        const { configTimer } = get();
        set({
          rondaActual: 1,
          timerState: 'idle',
          tiempoRestante: configTimer.duracionMinutos * 60,
        });
      },

      // ========== UI ==========

      setViewMode: (mode) => {
        set({ viewMode: mode });
      },

      toggleCompact: () => {
        set((state) => ({ isCompact: !state.isCompact }));
      },
    }),
    {
      name: 'litper-pedidos-store',
      partialize: (state) => ({
        usuarios: state.usuarios,
        usuarioActual: state.usuarioActual,
        configTimer: state.configTimer,
        rondas: state.rondas,
        rondaActual: state.rondaActual,
        isCompact: state.isCompact,
      }),
    }
  )
);
