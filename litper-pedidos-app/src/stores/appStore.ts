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

// Contadores en tiempo real
export interface Contadores {
  realizados: number;
  cancelados: number;
  agendados: number;
  dificiles: number;
  pendientes: number;
  revisados: number;
}

export interface Ronda {
  id: string;
  usuarioId: string;
  numero: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  tiempoUsado: number;
  realizados: number;
  cancelados: number;
  agendados: number;
  dificiles: number;
  pendientes: number;
  revisados: number;
}

export interface ConfigTimer {
  duracionMinutos: number;
  alertaAmarilla: number;
  alertaNaranja: number;
  alertaRoja: number;
  sonidoFinal: boolean;
}

export type TimerColor = 'green' | 'yellow' | 'orange' | 'red';
export type TimerState = 'idle' | 'running' | 'paused' | 'finished';
export type ViewMode = 'timer' | 'stats' | 'admin';
export type DisplayMode = 'normal' | 'compact' | 'sidebar';

// Definición de los campos de contadores
export const CAMPOS_CONTADOR = [
  { key: 'realizados', label: 'Realizados', inicial: 'R', color: '#10B981', bgColor: 'bg-emerald-500' },
  { key: 'cancelados', label: 'Cancelados', inicial: 'C', color: '#EF4444', bgColor: 'bg-red-500' },
  { key: 'agendados', label: 'Agendados', inicial: 'A', color: '#3B82F6', bgColor: 'bg-blue-500' },
  { key: 'dificiles', label: 'Difíciles', inicial: 'D', color: '#F97316', bgColor: 'bg-orange-500' },
  { key: 'pendientes', label: 'Pendientes', inicial: 'P', color: '#F59E0B', bgColor: 'bg-amber-500' },
  { key: 'revisados', label: 'Revisados', inicial: 'V', color: '#8B5CF6', bgColor: 'bg-purple-500' },
] as const;

export type CampoContador = typeof CAMPOS_CONTADOR[number]['key'];

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
  horaInicioRonda: string | null;

  // Contadores en tiempo real
  contadores: Contadores;

  // Rondas guardadas
  rondas: Ronda[];

  // UI
  viewMode: ViewMode;
  displayMode: DisplayMode;

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

  // Acciones - Contadores
  incrementar: (campo: CampoContador) => void;
  decrementar: (campo: CampoContador) => void;
  setContador: (campo: CampoContador, valor: number) => void;
  resetContadores: () => void;
  getTotalContadores: () => number;

  // Acciones - Rondas
  guardarRonda: () => void;
  getRondasUsuario: (usuarioId: string) => Ronda[];
  getRondasHoy: (usuarioId: string) => Ronda[];
  getTotalHoy: (usuarioId: string) => number;
  reiniciarRondas: () => void;

  // Acciones - UI
  setViewMode: (mode: ViewMode) => void;
  setDisplayMode: (mode: DisplayMode) => void;
  cycleDisplayMode: () => void;
}

const contadoresIniciales: Contadores = {
  realizados: 0,
  cancelados: 0,
  agendados: 0,
  dificiles: 0,
  pendientes: 0,
  revisados: 0,
};

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
      horaInicioRonda: null,

      contadores: { ...contadoresIniciales },

      rondas: [],

      viewMode: 'timer',
      displayMode: 'normal',

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
        const now = new Date();
        const hora = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        set({ timerState: 'running', horaInicioRonda: hora });
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
          set({ tiempoRestante: 0, timerState: 'finished' });

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

      // ========== CONTADORES ==========

      incrementar: (campo) => {
        set((state) => ({
          contadores: {
            ...state.contadores,
            [campo]: state.contadores[campo] + 1,
          },
        }));
      },

      decrementar: (campo) => {
        set((state) => ({
          contadores: {
            ...state.contadores,
            [campo]: Math.max(0, state.contadores[campo] - 1),
          },
        }));
      },

      setContador: (campo, valor) => {
        set((state) => ({
          contadores: {
            ...state.contadores,
            [campo]: Math.max(0, valor),
          },
        }));
      },

      resetContadores: () => {
        set({ contadores: { ...contadoresIniciales } });
      },

      getTotalContadores: () => {
        const { contadores } = get();
        return Object.values(contadores).reduce((acc, val) => acc + val, 0);
      },

      // ========== RONDAS ==========

      guardarRonda: () => {
        const { usuarioActual, rondaActual, contadores, horaInicioRonda, configTimer } = get();

        if (!usuarioActual) return;

        const now = new Date();
        const horaFin = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        const nuevaRonda: Ronda = {
          id: `round_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          usuarioId: usuarioActual.id,
          numero: rondaActual,
          fecha: now.toISOString().split('T')[0],
          horaInicio: horaInicioRonda || horaFin,
          horaFin,
          tiempoUsado: configTimer.duracionMinutos * 60,
          ...contadores,
        };

        set((state) => ({
          rondas: [...state.rondas, nuevaRonda],
          rondaActual: state.rondaActual + 1,
          contadores: { ...contadoresIniciales },
          timerState: 'idle',
          tiempoRestante: configTimer.duracionMinutos * 60,
          horaInicioRonda: null,
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
        return rondasHoy.reduce((acc, r) => acc + r.realizados, 0);
      },

      reiniciarRondas: () => {
        const { configTimer } = get();
        set({
          rondaActual: 1,
          timerState: 'idle',
          tiempoRestante: configTimer.duracionMinutos * 60,
          contadores: { ...contadoresIniciales },
          horaInicioRonda: null,
        });
      },

      // ========== UI ==========

      setViewMode: (mode) => {
        set({ viewMode: mode });
      },

      setDisplayMode: (mode) => {
        set({ displayMode: mode });
      },

      cycleDisplayMode: () => {
        set((state) => {
          const modes: DisplayMode[] = ['normal', 'compact', 'sidebar'];
          const currentIndex = modes.indexOf(state.displayMode);
          const nextIndex = (currentIndex + 1) % modes.length;
          return { displayMode: modes[nextIndex] };
        });
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
        displayMode: state.displayMode,
        contadores: state.contadores,
      }),
    }
  )
);
