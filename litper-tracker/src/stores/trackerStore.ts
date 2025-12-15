import { create } from 'zustand';

// Tipos
export interface RondaData {
  id: string;
  numero: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  tiempoUsado: number;
  pedidosIniciales: number;
  realizado: number;
  cancelado: number;
  agendado: number;
  dificiles: number;
  pendientes: number;
  revisado: number;
}

export interface TrackerState {
  // Usuario
  nombreUsuario: string;
  metaDiaria: number;

  // Timer
  tiempoTotal: number; // segundos totales
  tiempoRestante: number; // segundos restantes
  estadoTimer: 'idle' | 'running' | 'paused' | 'finished';

  // Ronda actual
  rondaNumero: number;
  horaInicio: string;
  valores: {
    pedidosIniciales: number;
    realizado: number;
    cancelado: number;
    agendado: number;
    dificiles: number;
    pendientes: number;
    revisado: number;
  };

  // Historial del dia
  rondasHoy: RondaData[];
  totalHoy: number;

  // UI
  modo: 'normal' | 'mini' | 'super-mini';
  alwaysOnTop: boolean;
  opacity: number;

  // Acciones Timer
  setTiempoTotal: (minutos: number) => void;
  iniciarTimer: () => void;
  pausarTimer: () => void;
  resetTimer: () => void;
  tick: () => void;

  // Acciones Valores
  incrementar: (campo: keyof TrackerState['valores'], cantidad?: number) => void;
  decrementar: (campo: keyof TrackerState['valores'], cantidad?: number) => void;
  setValor: (campo: keyof TrackerState['valores'], valor: number) => void;
  resetValores: () => void;

  // Acciones Ronda
  guardarRonda: () => void;

  // Acciones UI
  setModo: (modo: 'normal' | 'mini' | 'super-mini') => void;
  toggleAlwaysOnTop: () => void;
  setOpacity: (opacity: number) => void;

  // Acciones Usuario
  setUsuario: (nombre: string, meta: number) => void;

  // Persistencia
  cargarDatos: () => Promise<void>;
  guardarDatos: () => Promise<void>;
}

const generarId = () => Math.random().toString(36).substring(2, 9);
const hoy = () => new Date().toISOString().split('T')[0];
const horaActual = () => new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

const valoresIniciales = {
  pedidosIniciales: 0,
  realizado: 0,
  cancelado: 0,
  agendado: 0,
  dificiles: 0,
  pendientes: 0,
  revisado: 0,
};

export const useTrackerStore = create<TrackerState>((set, get) => ({
  // Estado inicial
  nombreUsuario: 'Usuario',
  metaDiaria: 50,

  tiempoTotal: 25 * 60,
  tiempoRestante: 25 * 60,
  estadoTimer: 'idle',

  rondaNumero: 1,
  horaInicio: '',
  valores: { ...valoresIniciales },

  rondasHoy: [],
  totalHoy: 0,

  modo: 'normal',
  alwaysOnTop: true,
  opacity: 1,

  // Timer
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
      // Sonido
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

  // Valores
  incrementar: (campo, cantidad = 1) => {
    set((state) => ({
      valores: {
        ...state.valores,
        [campo]: Math.max(0, state.valores[campo] + cantidad),
      },
    }));
    get().guardarDatos();
  },

  decrementar: (campo, cantidad = 1) => {
    set((state) => ({
      valores: {
        ...state.valores,
        [campo]: Math.max(0, state.valores[campo] - cantidad),
      },
    }));
    get().guardarDatos();
  },

  setValor: (campo, valor) => {
    set((state) => ({
      valores: {
        ...state.valores,
        [campo]: Math.max(0, valor),
      },
    }));
    get().guardarDatos();
  },

  resetValores: () => set({ valores: { ...valoresIniciales } }),

  // Ronda
  guardarRonda: () => {
    const state = get();
    const nuevaRonda: RondaData = {
      id: generarId(),
      numero: state.rondaNumero,
      fecha: hoy(),
      horaInicio: state.horaInicio || horaActual(),
      horaFin: horaActual(),
      tiempoUsado: Math.floor((state.tiempoTotal - state.tiempoRestante) / 60),
      ...state.valores,
    };

    const nuevasRondas = [...state.rondasHoy, nuevaRonda];
    const nuevoTotal = nuevasRondas.reduce((acc, r) => acc + r.realizado, 0);

    set({
      rondasHoy: nuevasRondas,
      totalHoy: nuevoTotal,
      rondaNumero: state.rondaNumero + 1,
      valores: { ...valoresIniciales },
      tiempoRestante: state.tiempoTotal,
      estadoTimer: 'idle',
      horaInicio: '',
    });

    get().guardarDatos();
  },

  // UI
  setModo: (modo) => {
    set({ modo });
    // Ajustar tamaño de ventana
    if (window.electronAPI) {
      switch (modo) {
        case 'super-mini':
          window.electronAPI.setSize(160, 50);
          break;
        case 'mini':
          window.electronAPI.setSize(280, 120);
          break;
        case 'normal':
          window.electronAPI.setSize(320, 480);
          break;
      }
    }
  },

  toggleAlwaysOnTop: async () => {
    if (window.electronAPI) {
      const newValue = await window.electronAPI.toggleAlwaysOnTop();
      set({ alwaysOnTop: newValue });
    }
  },

  setOpacity: (opacity) => {
    set({ opacity });
    if (window.electronAPI) {
      window.electronAPI.setOpacity(opacity);
    }
  },

  // Usuario
  setUsuario: (nombre, meta) => {
    set({ nombreUsuario: nombre, metaDiaria: meta });
    get().guardarDatos();
  },

  // Persistencia
  cargarDatos: async () => {
    if (!window.electronAPI) return;

    try {
      const fechaGuardada = await window.electronAPI.getStore('fecha');
      const fechaHoy = hoy();

      // Si es un nuevo dia, resetear rondas
      if (fechaGuardada !== fechaHoy) {
        set({ rondasHoy: [], totalHoy: 0, rondaNumero: 1 });
        await window.electronAPI.setStore('fecha', fechaHoy);
      } else {
        const rondas = await window.electronAPI.getStore('rondasHoy');
        if (rondas) {
          const total = rondas.reduce((acc: number, r: RondaData) => acc + r.realizado, 0);
          set({
            rondasHoy: rondas,
            totalHoy: total,
            rondaNumero: rondas.length + 1,
          });
        }
      }

      const nombre = await window.electronAPI.getStore('nombreUsuario');
      const meta = await window.electronAPI.getStore('metaDiaria');
      const tiempoTotal = await window.electronAPI.getStore('tiempoTotal');

      if (nombre) set({ nombreUsuario: nombre });
      if (meta) set({ metaDiaria: meta });
      if (tiempoTotal) set({ tiempoTotal, tiempoRestante: tiempoTotal });
    } catch (e) {
      console.error('Error cargando datos:', e);
    }
  },

  guardarDatos: async () => {
    if (!window.electronAPI) return;

    const state = get();
    try {
      await window.electronAPI.setStore('fecha', hoy());
      await window.electronAPI.setStore('rondasHoy', state.rondasHoy);
      await window.electronAPI.setStore('nombreUsuario', state.nombreUsuario);
      await window.electronAPI.setStore('metaDiaria', state.metaDiaria);
      await window.electronAPI.setStore('tiempoTotal', state.tiempoTotal);
    } catch (e) {
      console.error('Error guardando datos:', e);
    }
  },
}));
