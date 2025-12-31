import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TipoProceso, ViewLayout, TIEMPOS_PRESET } from '../config/processConfig';

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

export interface ContadoresGuias {
  realizado: number;
  cancelados: number;
  agendados: number;
  dificiles: number;
  pedidoPendiente: number;
  revisado: number;
}

export interface ContadoresNovedad {
  novedadesIniciales: number;
  novedadesSolucionadas: number;
  novedadesRevisadas: number;
  novedadesFinalePendientes: number;
  devolucionLitper: number;
  devolucion3Intentos: number;
  devolucionErrorTransportadora: number;
  devolucionProveedor: number;
}

export interface Bloque {
  id: string;
  usuarioId: string;
  tipoProceso: TipoProceso;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  tiempoTotal: number;
  contadoresGuias?: ContadoresGuias;
  contadoresNovedad?: ContadoresNovedad;
  totalOperaciones: number;
  promedioMinuto: number;
  porcentajeExito?: number;
}

export interface ConfigTimer {
  duracionMinutos: number;
  alertaAmarilla: number;
  alertaNaranja: number;
  alertaRoja: number;
  sonidoFinal: boolean;
}

export type TimerState = 'idle' | 'running' | 'paused' | 'finished';
export type TimerColor = 'green' | 'yellow' | 'orange' | 'red';
export type ViewMode = 'timer' | 'stats' | 'bloques' | 'admin';

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

// ==================== FUNCIONES HELPER ====================

const crearContadoresGuiasVacios = (): ContadoresGuias => ({
  realizado: 0,
  cancelados: 0,
  agendados: 0,
  dificiles: 0,
  pedidoPendiente: 0,
  revisado: 0,
});

const crearContadoresNovedadVacios = (): ContadoresNovedad => ({
  novedadesIniciales: 0,
  novedadesSolucionadas: 0,
  novedadesRevisadas: 0,
  novedadesFinalePendientes: 0,
  devolucionLitper: 0,
  devolucion3Intentos: 0,
  devolucionErrorTransportadora: 0,
  devolucionProveedor: 0,
});

export const calcularTotDevoluciones = (c: ContadoresNovedad): number =>
  c.devolucionLitper +
  c.devolucion3Intentos +
  c.devolucionErrorTransportadora +
  c.devolucionProveedor;

const calcularTotalGuias = (c: ContadoresGuias): number =>
  c.realizado + c.cancelados + c.agendados + c.dificiles + c.pedidoPendiente + c.revisado;

const calcularTotalNovedad = (c: ContadoresNovedad): number =>
  c.novedadesIniciales +
  c.novedadesSolucionadas +
  c.novedadesRevisadas +
  c.novedadesFinalePendientes +
  calcularTotDevoluciones(c);

const calcularPorcentajeExito = (c: ContadoresGuias): number => {
  const total = c.realizado + c.cancelados;
  return total > 0 ? Math.round((c.realizado / total) * 1000) / 10 : 0;
};

const getHoraActual = (): string => {
  return new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const getFechaActual = (): string => {
  return new Date().toISOString().split('T')[0];
};

// ==================== STORE ====================

interface AppState {
  // Usuarios
  usuarios: Usuario[];
  usuarioActual: Usuario | null;
  modoAdmin: boolean;

  // Proceso
  procesoActivo: TipoProceso;

  // Contadores actuales (bloque en curso)
  contadoresGuias: ContadoresGuias;
  contadoresNovedad: ContadoresNovedad;
  bloqueIniciadoEn: string | null;

  // Timer
  configTimer: ConfigTimer;
  timerState: TimerState;
  tiempoRestante: number;

  // Bloques
  bloques: Bloque[];
  numeroBloqueHoy: number;

  // UI
  viewMode: ViewMode;
  viewLayout: ViewLayout;

  // Auto-guardado
  ultimoAutoGuardado: string | null;
  autoGuardadoActivo: boolean;

  // Modal de exportación
  mostrarModalExportar: boolean;

  // Acciones - Usuarios
  agregarUsuario: (data: Omit<Usuario, 'id' | 'createdAt' | 'activo'>) => void;
  actualizarUsuario: (id: string, data: Partial<Usuario>) => void;
  eliminarUsuario: (id: string) => void;
  seleccionarUsuario: (id: string | null) => void;
  toggleModoAdmin: () => void;

  // Acciones - Proceso
  setProcesoActivo: (proceso: TipoProceso) => void;

  // Acciones - Contadores
  incrementarContador: (campo: string, cantidad?: number) => void;
  decrementarContador: (campo: string, cantidad?: number) => void;
  resetearContadores: () => void;

  // Acciones - Timer
  setConfigTimer: (config: Partial<ConfigTimer>) => void;
  iniciarTimer: () => void;
  pausarTimer: () => void;
  resetearTimer: () => void;
  tick: () => void;
  getTimerColor: () => TimerColor;

  // Acciones - Bloques
  finalizarBloque: () => Bloque | null;
  iniciarNuevoDia: () => void;
  getBloquesHoy: () => Bloque[];
  getBloquesPorProceso: (proceso: TipoProceso) => Bloque[];

  // Acciones - UI
  setViewMode: (mode: ViewMode) => void;
  setViewLayout: (layout: ViewLayout) => void;
  setMostrarModalExportar: (mostrar: boolean) => void;

  // Acciones - Auto-guardado
  guardarProgreso: () => void;
  restaurarProgreso: () => boolean;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      usuarios: [],
      usuarioActual: null,
      modoAdmin: false,

      procesoActivo: 'guias',

      contadoresGuias: crearContadoresGuiasVacios(),
      contadoresNovedad: crearContadoresNovedadVacios(),
      bloqueIniciadoEn: null,

      configTimer: {
        duracionMinutos: 25,
        alertaAmarilla: 50,
        alertaNaranja: 25,
        alertaRoja: 10,
        sonidoFinal: true,
      },
      timerState: 'idle',
      tiempoRestante: 25 * 60,

      bloques: [],
      numeroBloqueHoy: 1,

      viewMode: 'timer',
      viewLayout: 'sidebar',

      ultimoAutoGuardado: null,
      autoGuardadoActivo: true,

      mostrarModalExportar: false,

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

      // ========== PROCESO ==========

      setProcesoActivo: (proceso) => {
        set({ procesoActivo: proceso });
      },

      // ========== CONTADORES ==========

      incrementarContador: (campo, cantidad = 1) => {
        const { procesoActivo, bloqueIniciadoEn } = get();

        // Iniciar bloque si no está iniciado
        if (!bloqueIniciadoEn) {
          set({ bloqueIniciadoEn: new Date().toISOString() });
        }

        if (procesoActivo === 'guias') {
          set((state) => ({
            contadoresGuias: {
              ...state.contadoresGuias,
              [campo]: Math.max(0, (state.contadoresGuias as any)[campo] + cantidad),
            },
          }));
        } else {
          // No permitir incrementar TOT Devoluciones (es calculado)
          if (campo === 'totDevoluciones') return;

          set((state) => ({
            contadoresNovedad: {
              ...state.contadoresNovedad,
              [campo]: Math.max(0, (state.contadoresNovedad as any)[campo] + cantidad),
            },
          }));
        }
      },

      decrementarContador: (campo, cantidad = 1) => {
        const { procesoActivo } = get();

        if (procesoActivo === 'guias') {
          set((state) => ({
            contadoresGuias: {
              ...state.contadoresGuias,
              [campo]: Math.max(0, (state.contadoresGuias as any)[campo] - cantidad),
            },
          }));
        } else {
          // No permitir decrementar TOT Devoluciones (es calculado)
          if (campo === 'totDevoluciones') return;

          set((state) => ({
            contadoresNovedad: {
              ...state.contadoresNovedad,
              [campo]: Math.max(0, (state.contadoresNovedad as any)[campo] - cantidad),
            },
          }));
        }
      },

      resetearContadores: () => {
        set({
          contadoresGuias: crearContadoresGuiasVacios(),
          contadoresNovedad: crearContadoresNovedadVacios(),
          bloqueIniciadoEn: null,
        });
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
        const { bloqueIniciadoEn } = get();
        if (!bloqueIniciadoEn) {
          set({ bloqueIniciadoEn: new Date().toISOString() });
        }
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

      // ========== BLOQUES ==========

      finalizarBloque: () => {
        const {
          usuarioActual,
          procesoActivo,
          contadoresGuias,
          contadoresNovedad,
          bloqueIniciadoEn,
          configTimer,
          tiempoRestante,
          numeroBloqueHoy,
        } = get();

        if (!usuarioActual || !bloqueIniciadoEn) return null;

        const ahora = new Date();
        const inicio = new Date(bloqueIniciadoEn);
        const tiempoTotal = Math.floor((ahora.getTime() - inicio.getTime()) / 1000);

        let totalOperaciones = 0;
        let porcentajeExito: number | undefined;

        if (procesoActivo === 'guias') {
          totalOperaciones = calcularTotalGuias(contadoresGuias);
          porcentajeExito = calcularPorcentajeExito(contadoresGuias);
        } else {
          totalOperaciones = calcularTotalNovedad(contadoresNovedad);
        }

        const minutos = tiempoTotal / 60;
        const promedioMinuto = minutos > 0 ? Math.round((totalOperaciones / minutos) * 100) / 100 : 0;

        const nuevoBloque: Bloque = {
          id: `bloque_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          usuarioId: usuarioActual.id,
          tipoProceso: procesoActivo,
          fecha: getFechaActual(),
          horaInicio: inicio.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false }),
          horaFin: getHoraActual(),
          tiempoTotal,
          contadoresGuias: procesoActivo === 'guias' ? { ...contadoresGuias } : undefined,
          contadoresNovedad: procesoActivo === 'novedad' ? { ...contadoresNovedad } : undefined,
          totalOperaciones,
          promedioMinuto,
          porcentajeExito,
        };

        set((state) => ({
          bloques: [...state.bloques, nuevoBloque],
          numeroBloqueHoy: state.numeroBloqueHoy + 1,
          contadoresGuias: crearContadoresGuiasVacios(),
          contadoresNovedad: crearContadoresNovedadVacios(),
          bloqueIniciadoEn: null,
          timerState: 'idle',
          tiempoRestante: configTimer.duracionMinutos * 60,
        }));

        return nuevoBloque;
      },

      iniciarNuevoDia: () => {
        const { configTimer } = get();
        set({
          numeroBloqueHoy: 1,
          contadoresGuias: crearContadoresGuiasVacios(),
          contadoresNovedad: crearContadoresNovedadVacios(),
          bloqueIniciadoEn: null,
          timerState: 'idle',
          tiempoRestante: configTimer.duracionMinutos * 60,
        });
      },

      getBloquesHoy: () => {
        const { bloques } = get();
        const hoy = getFechaActual();
        return bloques.filter((b) => b.fecha === hoy);
      },

      getBloquesPorProceso: (proceso) => {
        const { bloques } = get();
        const hoy = getFechaActual();
        return bloques.filter((b) => b.fecha === hoy && b.tipoProceso === proceso);
      },

      // ========== UI ==========

      setViewMode: (mode) => {
        set({ viewMode: mode });
      },

      setViewLayout: (layout) => {
        set({ viewLayout: layout });
      },

      setMostrarModalExportar: (mostrar) => {
        set({ mostrarModalExportar: mostrar });
      },

      // ========== AUTO-GUARDADO ==========

      guardarProgreso: () => {
        set({ ultimoAutoGuardado: new Date().toISOString() });
      },

      restaurarProgreso: () => {
        const { bloqueIniciadoEn, contadoresGuias, contadoresNovedad } = get();

        // Si hay un bloque en progreso
        if (bloqueIniciadoEn) {
          const totalGuias = calcularTotalGuias(contadoresGuias);
          const totalNovedad = calcularTotalNovedad(contadoresNovedad);
          return totalGuias > 0 || totalNovedad > 0;
        }

        return false;
      },
    }),
    {
      name: 'litper-pedidos-store-v2',
      partialize: (state) => ({
        usuarios: state.usuarios,
        usuarioActual: state.usuarioActual,
        procesoActivo: state.procesoActivo,
        contadoresGuias: state.contadoresGuias,
        contadoresNovedad: state.contadoresNovedad,
        bloqueIniciadoEn: state.bloqueIniciadoEn,
        configTimer: state.configTimer,
        bloques: state.bloques,
        numeroBloqueHoy: state.numeroBloqueHoy,
        viewLayout: state.viewLayout,
        ultimoAutoGuardado: state.ultimoAutoGuardado,
      }),
    }
  )
);

// Exportar para uso en otros componentes
export { TIEMPOS_PRESET };
