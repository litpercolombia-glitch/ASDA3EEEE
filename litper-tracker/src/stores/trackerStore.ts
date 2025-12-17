import { create } from 'zustand';

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
}

export type TipoProceso = 'guias' | 'novedades';

export interface RondaBase {
  id: string;
  usuarioId: string;
  usuarioNombre: string;
  numero: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  tiempoUsado: number;
  tipo: TipoProceso;
}

export interface RondaGuias extends RondaBase {
  tipo: 'guias';
  pedidosIniciales: number;
  realizado: number;
  cancelado: number;
  agendado: number;
  dificiles: number;
  pendientes: number;
  revisado: number;
}

export interface RondaNovedades extends RondaBase {
  tipo: 'novedades';
  revisadas: number;
  solucionadas: number;
  devolucion: number;
  cliente: number;
  transportadora: number;
  litper: number;
}

export type Ronda = RondaGuias | RondaNovedades;

export interface TrackerState {
  // Pantalla actual
  pantalla: 'seleccion-usuario' | 'seleccion-proceso' | 'trabajo';

  // Usuario
  usuarios: Usuario[];
  usuarioActual: Usuario | null;

  // Proceso
  procesoActual: TipoProceso | null;

  // Timer
  tiempoTotal: number;
  tiempoRestante: number;
  estadoTimer: 'idle' | 'running' | 'paused' | 'finished';

  // Ronda actual
  rondaNumero: number;
  horaInicio: string;

  // Valores GUÍAS
  valoresGuias: {
    pedidosIniciales: number;
    realizado: number;
    cancelado: number;
    agendado: number;
    dificiles: number;
    pendientes: number;
    revisado: number;
  };

  // Valores NOVEDADES
  valoresNovedades: {
    revisadas: number;
    solucionadas: number;
    devolucion: number;
    cliente: number;
    transportadora: number;
    litper: number;
  };

  // Historial
  rondasHoy: Ronda[];
  totalHoyGuias: number;
  totalHoyNovedades: number;

  // UI
  modo: 'normal' | 'mini' | 'super-mini';
  alwaysOnTop: boolean;

  // === NAVEGACIÓN ===
  seleccionarUsuario: (usuario: Usuario) => void;
  seleccionarProceso: (proceso: TipoProceso) => void;
  volverASeleccion: () => void;
  cerrarSesion: () => void;

  // === TIMER ===
  setTiempoTotal: (minutos: number) => void;
  iniciarTimer: () => void;
  pausarTimer: () => void;
  resetTimer: () => void;
  tick: () => void;

  // === VALORES GUÍAS ===
  incrementarGuias: (campo: keyof TrackerState['valoresGuias'], cantidad?: number) => void;
  decrementarGuias: (campo: keyof TrackerState['valoresGuias'], cantidad?: number) => void;
  setValorGuias: (campo: keyof TrackerState['valoresGuias'], valor: number) => void;

  // === VALORES NOVEDADES ===
  incrementarNovedades: (campo: keyof TrackerState['valoresNovedades'], cantidad?: number) => void;
  decrementarNovedades: (campo: keyof TrackerState['valoresNovedades'], cantidad?: number) => void;
  setValorNovedades: (campo: keyof TrackerState['valoresNovedades'], valor: number) => void;

  // === RONDA ===
  guardarRonda: () => void;

  // === UI ===
  setModo: (modo: 'normal' | 'mini' | 'super-mini') => void;
  toggleAlwaysOnTop: () => void;

  // === PERSISTENCIA ===
  cargarDatos: () => Promise<void>;
  guardarDatos: () => Promise<void>;
  sincronizarUsuarios: () => void;
}

// ============================================
// HELPERS
// ============================================

const generarId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
const hoy = () => new Date().toISOString().split('T')[0];
const horaActual = () => new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

const valoresGuiasIniciales = {
  pedidosIniciales: 0,
  realizado: 0,
  cancelado: 0,
  agendado: 0,
  dificiles: 0,
  pendientes: 0,
  revisado: 0,
};

const valoresNovedadesIniciales = {
  revisadas: 0,
  solucionadas: 0,
  devolucion: 0,
  cliente: 0,
  transportadora: 0,
  litper: 0,
};

// Key para sincronización con Procesos 2.0
const SYNC_KEY = 'litper-tracker-sync';

// ============================================
// STORE
// ============================================

export const useTrackerStore = create<TrackerState>((set, get) => ({
  // Estado inicial
  pantalla: 'seleccion-usuario',
  usuarios: [],
  usuarioActual: null,
  procesoActual: null,

  tiempoTotal: 25 * 60,
  tiempoRestante: 25 * 60,
  estadoTimer: 'idle',

  rondaNumero: 1,
  horaInicio: '',

  valoresGuias: { ...valoresGuiasIniciales },
  valoresNovedades: { ...valoresNovedadesIniciales },

  rondasHoy: [],
  totalHoyGuias: 0,
  totalHoyNovedades: 0,

  modo: 'normal',
  alwaysOnTop: true,

  // === NAVEGACIÓN ===
  seleccionarUsuario: (usuario) => {
    set({
      usuarioActual: usuario,
      pantalla: 'seleccion-proceso',
    });
  },

  seleccionarProceso: (proceso) => {
    const state = get();
    const rondasProceso = state.rondasHoy.filter(
      r => r.tipo === proceso && r.usuarioId === state.usuarioActual?.id
    );
    set({
      procesoActual: proceso,
      pantalla: 'trabajo',
      rondaNumero: rondasProceso.length + 1,
    });
  },

  volverASeleccion: () => {
    set({
      pantalla: 'seleccion-proceso',
      procesoActual: null,
      estadoTimer: 'idle',
      tiempoRestante: get().tiempoTotal,
      valoresGuias: { ...valoresGuiasIniciales },
      valoresNovedades: { ...valoresNovedadesIniciales },
      horaInicio: '',
    });
  },

  cerrarSesion: () => {
    set({
      pantalla: 'seleccion-usuario',
      usuarioActual: null,
      procesoActual: null,
      estadoTimer: 'idle',
      tiempoRestante: get().tiempoTotal,
      valoresGuias: { ...valoresGuiasIniciales },
      valoresNovedades: { ...valoresNovedadesIniciales },
      horaInicio: '',
    });
  },

  // === TIMER ===
  setTiempoTotal: (minutos) => {
    set({
      tiempoTotal: minutos * 60,
      tiempoRestante: minutos * 60,
    });
  },

  iniciarTimer: () => {
    const state = get();
    set({
      estadoTimer: 'running',
      horaInicio: state.horaInicio || horaActual(),
    });
  },

  pausarTimer: () => set({ estadoTimer: 'paused' }),

  resetTimer: () => {
    set((state) => ({
      estadoTimer: 'idle',
      tiempoRestante: state.tiempoTotal,
      horaInicio: '',
    }));
  },

  tick: () => {
    const { tiempoRestante, estadoTimer } = get();
    if (estadoTimer !== 'running') return;

    if (tiempoRestante <= 1) {
      set({ tiempoRestante: 0, estadoTimer: 'finished' });
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
        osc.start();
        osc.stop(ctx.currentTime + 0.8);
      } catch (e) {}
    } else {
      set({ tiempoRestante: tiempoRestante - 1 });
    }
  },

  // === VALORES GUÍAS ===
  incrementarGuias: (campo, cantidad = 1) => {
    set((state) => ({
      valoresGuias: {
        ...state.valoresGuias,
        [campo]: Math.max(0, state.valoresGuias[campo] + cantidad),
      },
    }));
  },

  decrementarGuias: (campo, cantidad = 1) => {
    set((state) => ({
      valoresGuias: {
        ...state.valoresGuias,
        [campo]: Math.max(0, state.valoresGuias[campo] - cantidad),
      },
    }));
  },

  setValorGuias: (campo, valor) => {
    set((state) => ({
      valoresGuias: {
        ...state.valoresGuias,
        [campo]: Math.max(0, valor),
      },
    }));
  },

  // === VALORES NOVEDADES ===
  incrementarNovedades: (campo, cantidad = 1) => {
    set((state) => ({
      valoresNovedades: {
        ...state.valoresNovedades,
        [campo]: Math.max(0, state.valoresNovedades[campo] + cantidad),
      },
    }));
  },

  decrementarNovedades: (campo, cantidad = 1) => {
    set((state) => ({
      valoresNovedades: {
        ...state.valoresNovedades,
        [campo]: Math.max(0, state.valoresNovedades[campo] - cantidad),
      },
    }));
  },

  setValorNovedades: (campo, valor) => {
    set((state) => ({
      valoresNovedades: {
        ...state.valoresNovedades,
        [campo]: Math.max(0, valor),
      },
    }));
  },

  // === GUARDAR RONDA ===
  guardarRonda: () => {
    const state = get();
    if (!state.usuarioActual || !state.procesoActual) return;

    const baseRonda: RondaBase = {
      id: generarId(),
      usuarioId: state.usuarioActual.id,
      usuarioNombre: state.usuarioActual.nombre,
      numero: state.rondaNumero,
      fecha: hoy(),
      horaInicio: state.horaInicio || horaActual(),
      horaFin: horaActual(),
      tiempoUsado: Math.floor((state.tiempoTotal - state.tiempoRestante) / 60),
      tipo: state.procesoActual,
    };

    let nuevaRonda: Ronda;

    if (state.procesoActual === 'guias') {
      nuevaRonda = {
        ...baseRonda,
        tipo: 'guias',
        ...state.valoresGuias,
      } as RondaGuias;
    } else {
      nuevaRonda = {
        ...baseRonda,
        tipo: 'novedades',
        ...state.valoresNovedades,
      } as RondaNovedades;
    }

    const nuevasRondas = [...state.rondasHoy, nuevaRonda];
    const totalGuias = nuevasRondas
      .filter((r): r is RondaGuias => r.tipo === 'guias')
      .reduce((acc, r) => acc + r.realizado, 0);
    const totalNovedades = nuevasRondas
      .filter((r): r is RondaNovedades => r.tipo === 'novedades')
      .reduce((acc, r) => acc + r.solucionadas, 0);

    set({
      rondasHoy: nuevasRondas,
      totalHoyGuias: totalGuias,
      totalHoyNovedades: totalNovedades,
      rondaNumero: state.rondaNumero + 1,
      valoresGuias: { ...valoresGuiasIniciales },
      valoresNovedades: { ...valoresNovedadesIniciales },
      tiempoRestante: state.tiempoTotal,
      estadoTimer: 'idle',
      horaInicio: '',
    });

    get().guardarDatos();
  },

  // === UI ===
  setModo: (modo) => {
    set({ modo });
    if (window.electronAPI) {
      switch (modo) {
        case 'super-mini':
          window.electronAPI.setSize(180, 60);
          break;
        case 'mini':
          window.electronAPI.setSize(320, 180);
          break;
        case 'normal':
          window.electronAPI.setSize(360, 580);
          break;
      }
    }
  },

  toggleAlwaysOnTop: async () => {
    if (window.electronAPI) {
      const newValue = await window.electronAPI.toggleAlwaysOnTop();
      set({ alwaysOnTop: newValue });
    } else {
      set((state) => ({ alwaysOnTop: !state.alwaysOnTop }));
    }
  },

  // === PERSISTENCIA ===
  sincronizarUsuarios: () => {
    try {
      // Leer usuarios de Procesos 2.0
      const procesosData = localStorage.getItem('litper-procesos-v2');
      if (procesosData) {
        const parsed = JSON.parse(procesosData);
        if (parsed.state?.usuarios) {
          const usuariosActivos = parsed.state.usuarios.filter((u: Usuario) => u.activo);
          set({ usuarios: usuariosActivos });
        }
      }
    } catch (e) {
      console.error('Error sincronizando usuarios:', e);
    }
  },

  cargarDatos: async () => {
    // Sincronizar usuarios
    get().sincronizarUsuarios();

    const fechaHoy = hoy();

    if (window.electronAPI) {
      try {
        const fechaGuardada = await window.electronAPI.getStore('fecha');

        if (fechaGuardada !== fechaHoy) {
          set({ rondasHoy: [], totalHoyGuias: 0, totalHoyNovedades: 0, rondaNumero: 1 });
          await window.electronAPI.setStore('fecha', fechaHoy);
        } else {
          const rondas = await window.electronAPI.getStore('rondasHoy');
          if (rondas && Array.isArray(rondas)) {
            const totalGuias = rondas
              .filter((r: Ronda) => r.tipo === 'guias')
              .reduce((acc: number, r: RondaGuias) => acc + (r.realizado || 0), 0);
            const totalNovedades = rondas
              .filter((r: Ronda) => r.tipo === 'novedades')
              .reduce((acc: number, r: RondaNovedades) => acc + (r.solucionadas || 0), 0);
            set({
              rondasHoy: rondas,
              totalHoyGuias: totalGuias,
              totalHoyNovedades: totalNovedades,
            });
          }
        }

        const tiempoTotal = await window.electronAPI.getStore('tiempoTotal');
        if (tiempoTotal) set({ tiempoTotal, tiempoRestante: tiempoTotal });
      } catch (e) {
        console.error('Error cargando datos:', e);
      }
    } else {
      // Modo navegador (desarrollo)
      try {
        const saved = localStorage.getItem('litper-tracker-data');
        if (saved) {
          const data = JSON.parse(saved);
          if (data.fecha === fechaHoy && data.rondasHoy) {
            const totalGuias = data.rondasHoy
              .filter((r: Ronda) => r.tipo === 'guias')
              .reduce((acc: number, r: RondaGuias) => acc + (r.realizado || 0), 0);
            const totalNovedades = data.rondasHoy
              .filter((r: Ronda) => r.tipo === 'novedades')
              .reduce((acc: number, r: RondaNovedades) => acc + (r.solucionadas || 0), 0);
            set({
              rondasHoy: data.rondasHoy,
              totalHoyGuias: totalGuias,
              totalHoyNovedades: totalNovedades,
            });
          }
        }
      } catch (e) {}
    }
  },

  guardarDatos: async () => {
    const state = get();
    const fechaHoy = hoy();

    const dataToSave = {
      fecha: fechaHoy,
      rondasHoy: state.rondasHoy,
      totalHoyGuias: state.totalHoyGuias,
      totalHoyNovedades: state.totalHoyNovedades,
    };

    // Guardar en Electron store
    if (window.electronAPI) {
      try {
        await window.electronAPI.setStore('fecha', fechaHoy);
        await window.electronAPI.setStore('rondasHoy', state.rondasHoy);
        await window.electronAPI.setStore('tiempoTotal', state.tiempoTotal);
      } catch (e) {
        console.error('Error guardando datos:', e);
      }
    }

    // Guardar también en localStorage para sync con Procesos 2.0
    try {
      localStorage.setItem('litper-tracker-data', JSON.stringify(dataToSave));
      localStorage.setItem(SYNC_KEY, JSON.stringify({
        rondasHoy: state.rondasHoy,
        fecha: fechaHoy,
        ultimaSync: new Date().toISOString(),
      }));
    } catch (e) {}
  },
}));
