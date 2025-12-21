/**
 * STORE DE PROCESOS 2.0 - VERSIÓN FINAL
 * Con autenticación admin y reportes completos
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================
// CONSTANTES
// ============================================

export const ADMIN_PASSWORD = 'LITPER TU PAPA';

export const COLORES_USUARIO = [
  { id: 'orange', name: 'Naranja', hex: '#F97316' },
  { id: 'blue', name: 'Azul', hex: '#3B82F6' },
  { id: 'green', name: 'Verde', hex: '#10B981' },
  { id: 'purple', name: 'Morado', hex: '#8B5CF6' },
  { id: 'pink', name: 'Rosa', hex: '#EC4899' },
  { id: 'cyan', name: 'Cyan', hex: '#06B6D4' },
  { id: 'yellow', name: 'Amarillo', hex: '#EAB308' },
  { id: 'red', name: 'Rojo', hex: '#EF4444' },
];

export const AVATARES = ['😊', '😎', '🚀', '⭐', '🔥', '💪', '🎯', '📦', '🏆', '💎', '🦊', '🐱', '🐶', '🦁', '🐼', '👨', '👩', '🧑', '👨‍💼', '👩‍💼'];

// ============================================
// TIPOS
// ============================================

export interface Usuario {
  id: string;
  nombre: string;
  avatar: string;
  color: string;
  metaDiaria: number;
  activo: boolean;
  createdAt: string;
}

export interface RondaCompleta {
  id: string;
  usuarioId: string;
  numero: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  tiempoUsado: number; // minutos

  // Campos principales
  pedidosIniciales: number;
  realizado: number;
  cancelado: number;
  agendado: number;
  dificiles: number;
  pendientes: number;
  revisado: number;

  // Extras
  notas: string;
}

export interface NotaFlotante {
  id: string;
  usuarioId: string;
  contenido: string;
  color: 'yellow' | 'green' | 'blue' | 'pink' | 'orange';
  posicion: { x: number; y: number };
  createdAt: string;
}

export interface ConfigCronometro {
  duracionMinutos: number;
  alertaAmarilla: number;
  alertaNaranja: number;
  alertaRoja: number;
  sonidoFinal: boolean;
}

export type EstadoCronometro = 'idle' | 'running' | 'paused' | 'finished';

// ============================================
// TIPOS DEL STORE
// ============================================

interface ProcesosState {
  // Usuarios
  usuarios: Usuario[];
  usuarioActual: Usuario | null;

  // Admin
  adminAutenticado: boolean;

  // Cronómetro
  configCronometro: ConfigCronometro;
  estadoCronometro: EstadoCronometro;
  tiempoRestante: number;
  rondaActualNumero: number;

  // Datos
  rondas: RondaCompleta[];
  notas: NotaFlotante[];

  // UI
  pantallaActual: 'seleccion' | 'trabajo' | 'admin';
  mostrarNotas: boolean;

  // === ACCIONES AUTH ===
  loginAdmin: (password: string) => boolean;
  logoutAdmin: () => void;

  // === ACCIONES USUARIOS ===
  agregarUsuario: (usuario: Omit<Usuario, 'id' | 'createdAt' | 'activo'>) => void;
  editarUsuario: (id: string, datos: Partial<Usuario>) => void;
  eliminarUsuario: (id: string) => void;
  seleccionarUsuario: (id: string | null) => void;
  cerrarSesionUsuario: () => void;

  // === ACCIONES CRONÓMETRO ===
  iniciarCronometro: () => void;
  pausarCronometro: () => void;
  resetearCronometro: () => void;
  tick: () => void;
  setTiempo: (minutos: number) => void;

  // === ACCIONES RONDAS ===
  guardarRonda: (ronda: Omit<RondaCompleta, 'id' | 'numero' | 'fecha' | 'horaFin'>) => void;

  // === ACCIONES NOTAS ===
  agregarNota: (nota: Omit<NotaFlotante, 'id' | 'createdAt'>) => void;
  editarNota: (id: string, contenido: string) => void;
  eliminarNota: (id: string) => void;

  // === ACCIONES UI ===
  setPantalla: (pantalla: 'seleccion' | 'trabajo' | 'admin') => void;
  toggleNotas: () => void;

  // === GETTERS ===
  getRondasUsuario: (usuarioId: string) => RondaCompleta[];
  getRondasHoy: (usuarioId: string) => RondaCompleta[];
  getTotalHoy: (usuarioId: string) => number;
  getProgresoMeta: (usuarioId: string) => number;

  // === REPORTES (Admin) ===
  getReporteDiario: (fecha: string) => ReporteDiario;
  getReporteSemanal: () => ReporteSemanal;
  getReporteMensual: () => ReporteMensual;
  getEstadisticasUsuario: (usuarioId: string) => EstadisticasUsuario;

  // === SYNC CON TRACKER ===
  getTrackerData: () => TrackerSyncData | null;
  getRondasTrackerHoy: () => RondaTracker[];
}

// Tipos de reportes
export interface ReporteDiario {
  fecha: string;
  totalUsuarios: number;
  usuariosActivos: number;
  totalRondas: number;
  totalRealizado: number;
  totalCancelado: number;
  totalAgendado: number;
  totalDificiles: number;
  totalPendientes: number;
  totalRevisado: number;
  porUsuario: {
    usuario: Usuario;
    rondas: number;
    realizado: number;
    cancelado: number;
    agendado: number;
    dificiles: number;
    pendientes: number;
    revisado: number;
    progresoMeta: number;
  }[];
}

export interface ReporteSemanal {
  fechaInicio: string;
  fechaFin: string;
  diasTrabajados: number;
  totalRondas: number;
  totalRealizado: number;
  totalCancelado: number;
  promedioDiario: number;
  mejorDia: { fecha: string; total: number };
  peorDia: { fecha: string; total: number };
  porUsuario: {
    usuario: Usuario;
    totalRealizado: number;
    promedioDiario: number;
    diasTrabajados: number;
  }[];
}

export interface ReporteMensual {
  mes: string;
  año: number;
  totalRondas: number;
  totalRealizado: number;
  totalCancelado: number;
  tasaCancelacion: number;
  mejorUsuario: { usuario: Usuario; total: number } | null;
  mejorDiaSemana: string;
}

export interface EstadisticasUsuario {
  usuario: Usuario;
  totalRondas: number;
  totalRealizado: number;
  totalCancelado: number;
  totalAgendado: number;
  promedioGuiasPorRonda: number;
  tiempoPromedioRonda: number;
  tasaCancelacion: number;
  diasTrabajados: number;
  mejorDia: { fecha: string; total: number } | null;
}

// ============================================
// TIPOS SYNC CON TRACKER
// ============================================

export type TipoProcesoTracker = 'guias' | 'novedades';

export interface RondaTrackerGuias {
  id: string;
  usuarioId: string;
  usuarioNombre: string;
  numero: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  tiempoUsado: number;
  tipo: 'guias';
  pedidosIniciales: number;
  realizado: number;
  cancelado: number;
  agendado: number;
  dificiles: number;
  pendientes: number;
  revisado: number;
}

export interface RondaTrackerNovedades {
  id: string;
  usuarioId: string;
  usuarioNombre: string;
  numero: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  tiempoUsado: number;
  tipo: 'novedades';
  revisadas: number;
  solucionadas: number;
  devolucion: number;
  cliente: number;
  transportadora: number;
  litper: number;
}

export type RondaTracker = RondaTrackerGuias | RondaTrackerNovedades;

export interface TrackerSyncData {
  rondasHoy: RondaTracker[];
  fecha: string;
  ultimaSync: string;
}

// ============================================
// HELPERS
// ============================================

const generarId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
const hoy = () => new Date().toISOString().split('T')[0];
const horaActual = () => new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
const TRACKER_SYNC_KEY = 'litper-tracker-sync';

// ============================================
// STORE
// ============================================

export const useProcesosStore = create<ProcesosState>()(
  persist(
    (set, get) => ({
      // === ESTADO INICIAL ===
      usuarios: [],
      usuarioActual: null,
      adminAutenticado: false,

      configCronometro: {
        duracionMinutos: 25,
        alertaAmarilla: 50,
        alertaNaranja: 25,
        alertaRoja: 10,
        sonidoFinal: true,
      },
      estadoCronometro: 'idle',
      tiempoRestante: 25 * 60,
      rondaActualNumero: 1,

      rondas: [],
      notas: [],

      pantallaActual: 'seleccion',
      mostrarNotas: false,

      // === AUTH ===
      loginAdmin: (password) => {
        if (password === ADMIN_PASSWORD) {
          set({ adminAutenticado: true, pantallaActual: 'admin' });
          return true;
        }
        return false;
      },

      logoutAdmin: () => {
        set({ adminAutenticado: false, pantallaActual: 'seleccion' });
      },

      // === USUARIOS ===
      agregarUsuario: (usuario) => {
        const nuevo: Usuario = {
          ...usuario,
          id: generarId(),
          activo: true,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ usuarios: [...state.usuarios, nuevo] }));
      },

      editarUsuario: (id, datos) => {
        set((state) => ({
          usuarios: state.usuarios.map((u) => u.id === id ? { ...u, ...datos } : u),
          usuarioActual: state.usuarioActual?.id === id
            ? { ...state.usuarioActual, ...datos }
            : state.usuarioActual,
        }));
      },

      eliminarUsuario: (id) => {
        set((state) => ({
          usuarios: state.usuarios.filter((u) => u.id !== id),
          rondas: state.rondas.filter((r) => r.usuarioId !== id),
          notas: state.notas.filter((n) => n.usuarioId !== id),
          usuarioActual: state.usuarioActual?.id === id ? null : state.usuarioActual,
        }));
      },

      seleccionarUsuario: (id) => {
        if (!id) {
          set({ usuarioActual: null, pantallaActual: 'seleccion' });
          return;
        }
        const usuario = get().usuarios.find((u) => u.id === id);
        if (usuario) {
          // Calcular número de ronda del día
          const rondasHoy = get().getRondasHoy(id);
          set({
            usuarioActual: usuario,
            pantallaActual: 'trabajo',
            rondaActualNumero: rondasHoy.length + 1,
          });
        }
      },

      cerrarSesionUsuario: () => {
        set({
          usuarioActual: null,
          pantallaActual: 'seleccion',
          estadoCronometro: 'idle',
          tiempoRestante: get().configCronometro.duracionMinutos * 60,
        });
      },

      // === CRONÓMETRO ===
      iniciarCronometro: () => set({ estadoCronometro: 'running' }),
      pausarCronometro: () => set({ estadoCronometro: 'paused' }),

      resetearCronometro: () => {
        set((state) => ({
          estadoCronometro: 'idle',
          tiempoRestante: state.configCronometro.duracionMinutos * 60,
        }));
      },

      tick: () => {
        const { tiempoRestante, estadoCronometro, configCronometro } = get();
        if (estadoCronometro !== 'running') return;

        if (tiempoRestante <= 1) {
          set({ tiempoRestante: 0, estadoCronometro: 'finished' });
          // Sonido
          if (configCronometro.sonidoFinal) {
            try {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.frequency.value = 800;
              gain.gain.setValueAtTime(0.3, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
              osc.start();
              osc.stop(ctx.currentTime + 0.5);
            } catch (e) {}
          }
        } else {
          set({ tiempoRestante: tiempoRestante - 1 });
        }
      },

      setTiempo: (minutos) => {
        set((state) => ({
          configCronometro: { ...state.configCronometro, duracionMinutos: minutos },
          tiempoRestante: state.estadoCronometro === 'idle' ? minutos * 60 : state.tiempoRestante,
        }));
      },

      // === RONDAS ===
      guardarRonda: (ronda) => {
        const { usuarioActual, rondaActualNumero } = get();
        if (!usuarioActual) return;

        const nuevaRonda: RondaCompleta = {
          ...ronda,
          id: generarId(),
          numero: rondaActualNumero,
          fecha: hoy(),
          horaFin: horaActual(),
        };

        set((state) => ({
          rondas: [...state.rondas, nuevaRonda],
          rondaActualNumero: state.rondaActualNumero + 1,
          estadoCronometro: 'idle',
          tiempoRestante: state.configCronometro.duracionMinutos * 60,
        }));
      },

      // === NOTAS ===
      agregarNota: (nota) => {
        const nueva: NotaFlotante = {
          ...nota,
          id: generarId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ notas: [...state.notas, nueva] }));
      },

      editarNota: (id, contenido) => {
        set((state) => ({
          notas: state.notas.map((n) => n.id === id ? { ...n, contenido } : n),
        }));
      },

      eliminarNota: (id) => {
        set((state) => ({ notas: state.notas.filter((n) => n.id !== id) }));
      },

      // === UI ===
      setPantalla: (pantalla) => set({ pantallaActual: pantalla }),
      toggleNotas: () => set((state) => ({ mostrarNotas: !state.mostrarNotas })),

      // === GETTERS ===
      getRondasUsuario: (usuarioId) => {
        return get().rondas.filter((r) => r.usuarioId === usuarioId);
      },

      getRondasHoy: (usuarioId) => {
        const fecha = hoy();
        return get().rondas.filter((r) => r.usuarioId === usuarioId && r.fecha === fecha);
      },

      getTotalHoy: (usuarioId) => {
        return get().getRondasHoy(usuarioId).reduce((acc, r) => acc + r.realizado, 0);
      },

      getProgresoMeta: (usuarioId) => {
        const usuario = get().usuarios.find((u) => u.id === usuarioId);
        if (!usuario || usuario.metaDiaria === 0) return 0;
        const total = get().getTotalHoy(usuarioId);
        return Math.round((total / usuario.metaDiaria) * 100);
      },

      // === REPORTES ===
      getReporteDiario: (fecha) => {
        const { usuarios, rondas } = get();
        const rondasDia = rondas.filter((r) => r.fecha === fecha);

        const porUsuario = usuarios.map((usuario) => {
          const rondasUsuario = rondasDia.filter((r) => r.usuarioId === usuario.id);
          const realizado = rondasUsuario.reduce((acc, r) => acc + r.realizado, 0);
          return {
            usuario,
            rondas: rondasUsuario.length,
            realizado,
            cancelado: rondasUsuario.reduce((acc, r) => acc + r.cancelado, 0),
            agendado: rondasUsuario.reduce((acc, r) => acc + r.agendado, 0),
            dificiles: rondasUsuario.reduce((acc, r) => acc + r.dificiles, 0),
            pendientes: rondasUsuario.reduce((acc, r) => acc + r.pendientes, 0),
            revisado: rondasUsuario.reduce((acc, r) => acc + r.revisado, 0),
            progresoMeta: usuario.metaDiaria > 0 ? Math.round((realizado / usuario.metaDiaria) * 100) : 0,
          };
        }).filter((u) => u.rondas > 0);

        return {
          fecha,
          totalUsuarios: usuarios.length,
          usuariosActivos: porUsuario.length,
          totalRondas: rondasDia.length,
          totalRealizado: rondasDia.reduce((acc, r) => acc + r.realizado, 0),
          totalCancelado: rondasDia.reduce((acc, r) => acc + r.cancelado, 0),
          totalAgendado: rondasDia.reduce((acc, r) => acc + r.agendado, 0),
          totalDificiles: rondasDia.reduce((acc, r) => acc + r.dificiles, 0),
          totalPendientes: rondasDia.reduce((acc, r) => acc + r.pendientes, 0),
          totalRevisado: rondasDia.reduce((acc, r) => acc + r.revisado, 0),
          porUsuario,
        };
      },

      getReporteSemanal: () => {
        const { usuarios, rondas } = get();
        const hoyDate = new Date();
        const inicioSemana = new Date(hoyDate);
        inicioSemana.setDate(hoyDate.getDate() - 7);

        const rondasSemana = rondas.filter((r) => {
          const fecha = new Date(r.fecha);
          return fecha >= inicioSemana && fecha <= hoyDate;
        });

        // Agrupar por día
        const porDia: Record<string, number> = {};
        rondasSemana.forEach((r) => {
          porDia[r.fecha] = (porDia[r.fecha] || 0) + r.realizado;
        });

        const dias = Object.entries(porDia);
        const mejorDia = dias.length > 0
          ? dias.reduce((max, [fecha, total]) => total > max.total ? { fecha, total } : max, { fecha: '', total: 0 })
          : { fecha: '', total: 0 };
        const peorDia = dias.length > 0
          ? dias.reduce((min, [fecha, total]) => total < min.total ? { fecha, total } : min, { fecha: '', total: Infinity })
          : { fecha: '', total: 0 };

        const totalRealizado = rondasSemana.reduce((acc, r) => acc + r.realizado, 0);

        return {
          fechaInicio: inicioSemana.toISOString().split('T')[0],
          fechaFin: hoy(),
          diasTrabajados: dias.length,
          totalRondas: rondasSemana.length,
          totalRealizado,
          totalCancelado: rondasSemana.reduce((acc, r) => acc + r.cancelado, 0),
          promedioDiario: dias.length > 0 ? Math.round(totalRealizado / dias.length) : 0,
          mejorDia,
          peorDia: peorDia.total === Infinity ? { fecha: '', total: 0 } : peorDia,
          porUsuario: usuarios.map((usuario) => {
            const rondasUsuario = rondasSemana.filter((r) => r.usuarioId === usuario.id);
            const totalUsuario = rondasUsuario.reduce((acc, r) => acc + r.realizado, 0);
            const diasUsuario = new Set(rondasUsuario.map((r) => r.fecha)).size;
            return {
              usuario,
              totalRealizado: totalUsuario,
              promedioDiario: diasUsuario > 0 ? Math.round(totalUsuario / diasUsuario) : 0,
              diasTrabajados: diasUsuario,
            };
          }).filter((u) => u.totalRealizado > 0),
        };
      },

      getReporteMensual: () => {
        const { usuarios, rondas } = get();
        const hoyDate = new Date();
        const inicioMes = new Date(hoyDate.getFullYear(), hoyDate.getMonth(), 1);

        const rondasMes = rondas.filter((r) => new Date(r.fecha) >= inicioMes);

        const totalRealizado = rondasMes.reduce((acc, r) => acc + r.realizado, 0);
        const totalCancelado = rondasMes.reduce((acc, r) => acc + r.cancelado, 0);

        // Mejor usuario
        const porUsuario = usuarios.map((u) => ({
          usuario: u,
          total: rondasMes.filter((r) => r.usuarioId === u.id).reduce((acc, r) => acc + r.realizado, 0),
        }));
        const mejorUsuario = porUsuario.length > 0
          ? porUsuario.reduce((max, u) => u.total > max.total ? u : max, { usuario: usuarios[0], total: 0 })
          : null;

        // Mejor día de la semana
        const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const porDiaSemana: Record<string, number> = {};
        rondasMes.forEach((r) => {
          const dia = diasSemana[new Date(r.fecha).getDay()];
          porDiaSemana[dia] = (porDiaSemana[dia] || 0) + r.realizado;
        });
        const mejorDiaSemana = Object.entries(porDiaSemana).length > 0
          ? Object.entries(porDiaSemana).reduce((max, [dia, total]) => total > max[1] ? [dia, total] : max, ['', 0])[0]
          : 'N/A';

        return {
          mes: hoyDate.toLocaleString('es', { month: 'long' }),
          año: hoyDate.getFullYear(),
          totalRondas: rondasMes.length,
          totalRealizado,
          totalCancelado,
          tasaCancelacion: totalRealizado > 0 ? Math.round((totalCancelado / (totalRealizado + totalCancelado)) * 100) : 0,
          mejorUsuario: mejorUsuario && mejorUsuario.total > 0 ? mejorUsuario : null,
          mejorDiaSemana,
        };
      },

      getEstadisticasUsuario: (usuarioId) => {
        const { usuarios, rondas } = get();
        const usuario = usuarios.find((u) => u.id === usuarioId);
        if (!usuario) {
          return {
            usuario: { id: '', nombre: 'Desconocido', avatar: '❓', color: 'gray', metaDiaria: 0, activo: false, createdAt: '' },
            totalRondas: 0,
            totalRealizado: 0,
            totalCancelado: 0,
            totalAgendado: 0,
            promedioGuiasPorRonda: 0,
            tiempoPromedioRonda: 0,
            tasaCancelacion: 0,
            diasTrabajados: 0,
            mejorDia: null,
          };
        }

        const rondasUsuario = rondas.filter((r) => r.usuarioId === usuarioId);
        const totalRealizado = rondasUsuario.reduce((acc, r) => acc + r.realizado, 0);
        const totalCancelado = rondasUsuario.reduce((acc, r) => acc + r.cancelado, 0);

        // Mejor día
        const porDia: Record<string, number> = {};
        rondasUsuario.forEach((r) => {
          porDia[r.fecha] = (porDia[r.fecha] || 0) + r.realizado;
        });
        const dias = Object.entries(porDia);
        const mejorDia = dias.length > 0
          ? dias.reduce((max, [fecha, total]) => total > max.total ? { fecha, total } : max, { fecha: '', total: 0 })
          : null;

        return {
          usuario,
          totalRondas: rondasUsuario.length,
          totalRealizado,
          totalCancelado,
          totalAgendado: rondasUsuario.reduce((acc, r) => acc + r.agendado, 0),
          promedioGuiasPorRonda: rondasUsuario.length > 0 ? Math.round(totalRealizado / rondasUsuario.length) : 0,
          tiempoPromedioRonda: rondasUsuario.length > 0 ? Math.round(rondasUsuario.reduce((acc, r) => acc + r.tiempoUsado, 0) / rondasUsuario.length) : 0,
          tasaCancelacion: totalRealizado > 0 ? Math.round((totalCancelado / (totalRealizado + totalCancelado)) * 100) : 0,
          diasTrabajados: dias.length,
          mejorDia: mejorDia && mejorDia.total > 0 ? mejorDia : null,
        };
      },

      // === SYNC CON TRACKER ===
      getTrackerData: () => {
        try {
          const data = localStorage.getItem(TRACKER_SYNC_KEY);
          if (data) {
            return JSON.parse(data) as TrackerSyncData;
          }
        } catch (e) {
          console.error('Error leyendo datos del Tracker:', e);
        }
        return null;
      },

      getRondasTrackerHoy: () => {
        const trackerData = get().getTrackerData();
        if (!trackerData || trackerData.fecha !== hoy()) {
          return [];
        }
        return trackerData.rondasHoy;
      },
    }),
    {
      name: 'litper-procesos-v2',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
