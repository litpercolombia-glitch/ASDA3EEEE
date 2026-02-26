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
  totalNovedades: number;
  revisadas: number;
  solucionadas: number;
  errorPorSolucion: number;
  proveedor: number;
  cliente: number;
  transportadora: number;
  litper: number;
}

export type Ronda = RondaGuias | RondaNovedades;

export type ModoVentana = 'normal' | 'compacto' | 'mini' | 'micro';

export interface TrackerState {
  // Pantalla actual
  pantalla: 'seleccion-usuario' | 'seleccion-proceso' | 'trabajo' | 'configuracion';

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
    totalNovedades: number;
    revisadas: number;
    solucionadas: number;
    errorPorSolucion: number;
    proveedor: number;
    cliente: number;
    transportadora: number;
    litper: number;
  };

  // Historial
  rondasHoy: Ronda[];
  totalHoyGuias: number;
  totalHoyNovedades: number;

  // UI
  modo: ModoVentana;
  alwaysOnTop: boolean;

  // Configuración
  apiUrl: string;
  mostrarConfig: boolean;

  // Sidebar
  sidebarCollapsed: boolean;

  // Stopwatch (cronómetro ascendente para novedades)
  tiempoTranscurrido: number;
  estadoStopwatch: 'idle' | 'running' | 'paused';

  // Toast
  toastMessage: string;
  toastVisible: boolean;

  // Modal confirmación
  modalVisible: boolean;
  modalCallback: (() => void) | null;

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
  guardarRonda: () => Promise<void>;

  // === UI ===
  setModo: (modo: ModoVentana) => void;
  toggleAlwaysOnTop: () => void;
  toggleConfig: () => void;

  // === CONFIGURACIÓN ===
  setApiUrl: (url: string) => Promise<void>;
  cargarConfig: () => Promise<void>;

  // === PERSISTENCIA ===
  cargarDatos: () => Promise<void>;
  guardarDatos: () => Promise<void>;
  sincronizarUsuarios: () => Promise<void>;

  // === EXPORTAR ===
  exportarExcel: () => Promise<void>;

  // === SIDEBAR ===
  toggleSidebar: () => void;

  // === STOPWATCH (Cronómetro ascendente) ===
  iniciarStopwatch: () => void;
  pausarStopwatch: () => void;
  resetStopwatch: () => void;
  tickStopwatch: () => void;

  // === TIMER AJUSTE ===
  ajustarTiempo: (minutos: number) => void;

  // === REINICIO DIARIO ===
  reiniciarDia: () => Promise<void>;

  // === TOAST ===
  showToast: (message: string) => void;
  hideToast: () => void;

  // === MODAL ===
  showModal: (callback: () => void) => void;
  hideModal: () => void;
  confirmModal: () => void;
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
  totalNovedades: 0,
  revisadas: 0,
  solucionadas: 0,
  errorPorSolucion: 0,
  proveedor: 0,
  cliente: 0,
  transportadora: 0,
  litper: 0,
};

// Key para sincronización con Procesos 2.0 (app web)
const SYNC_KEY = 'litper-tracker-sync';
const PROCESOS_KEY = 'litper-procesos-store'; // Debe coincidir con el store de la app web

// URL del API Backend - PRODUCCIÓN (se puede cambiar desde configuración)
const DEFAULT_API_URL = 'https://litper-tracker-api.onrender.com/api/tracker';
let currentApiUrl = DEFAULT_API_URL;

// Tamaños de ventana disponibles
const WINDOW_SIZES: Record<ModoVentana, { width: number; height: number }> = {
  normal: { width: 360, height: 580 },
  compacto: { width: 320, height: 420 },
  mini: { width: 280, height: 200 },
  micro: { width: 180, height: 80 },
};

// Helper para hacer peticiones al API
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(`${currentApiUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn('API no disponible, usando almacenamiento local:', error);
    return null;
  }
};

// Función para reproducir sonido de éxito
const playSuccessSound = () => {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    // Sonido de éxito (tono ascendente)
    osc.frequency.setValueAtTime(523, ctx.currentTime); // Do
    osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1); // Mi
    osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2); // Sol

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {
    console.log('No se pudo reproducir sonido');
  }
};

// Función para reproducir sonido de alarma (timer terminado)
const playAlarmSound = () => {
  try {
    const ctx = new AudioContext();
    // Tres beeps
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.3);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.3 + 0.2);
      osc.start(ctx.currentTime + i * 0.3);
      osc.stop(ctx.currentTime + i * 0.3 + 0.2);
    }
  } catch (e) {
    console.log('No se pudo reproducir alarma');
  }
};

// ============================================
// STORE
// ============================================

// 9 USUARIOS LITPER - DEFINIDOS GLOBALMENTE PARA CARGA INMEDIATA
const USUARIOS_LITPER: Usuario[] = [
  { id: 'cat1', nombre: 'CATALINA', avatar: '👑', color: '#8B5CF6', metaDiaria: 60, activo: true },
  { id: 'ang1', nombre: 'ANGIE', avatar: '🌟', color: '#EC4899', metaDiaria: 60, activo: true },
  { id: 'eva1', nombre: 'EVAN', avatar: '🚀', color: '#10B981', metaDiaria: 60, activo: true },
  { id: 'jim1', nombre: 'JIMMY', avatar: '⚡', color: '#3B82F6', metaDiaria: 60, activo: true },
  { id: 'fel1', nombre: 'FELIPE', avatar: '🎯', color: '#14B8A6', metaDiaria: 60, activo: true },
  { id: 'kar1', nombre: 'KAREN', avatar: '✨', color: '#F43F5E', metaDiaria: 60, activo: true },
  { id: 'jul1', nombre: 'JULIAN', avatar: '🎮', color: '#06B6D4', metaDiaria: 60, activo: true },
  { id: 'mai1', nombre: 'MAIRA', avatar: '🦋', color: '#D946EF', metaDiaria: 60, activo: true },
  { id: 'eri1', nombre: 'ERIKA', avatar: '🌸', color: '#F472B6', metaDiaria: 60, activo: true },
];

export const useTrackerStore = create<TrackerState>((set, get) => ({
  // Estado inicial - USUARIOS LITPER CARGADOS INMEDIATAMENTE
  pantalla: 'seleccion-usuario',
  usuarios: USUARIOS_LITPER,  // ← CARGA INMEDIATA de los 9 usuarios
  usuarioActual: null,
  procesoActual: null,

  tiempoTotal: 30 * 60,
  tiempoRestante: 30 * 60,
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

  // Configuración
  apiUrl: DEFAULT_API_URL,
  mostrarConfig: false,

  // Sidebar
  sidebarCollapsed: false,

  // Stopwatch
  tiempoTranscurrido: 0,
  estadoStopwatch: 'idle',

  // Toast
  toastMessage: '',
  toastVisible: false,

  // Modal
  modalVisible: false,
  modalCallback: null,

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
      playAlarmSound(); // Sonido de alarma cuando termina el timer
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
  guardarRonda: async () => {
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

      // Enviar a API
      try {
        await apiRequest('/rondas/guias', {
          method: 'POST',
          body: JSON.stringify({
            usuario_id: nuevaRonda.usuarioId,
            usuario_nombre: nuevaRonda.usuarioNombre,
            numero: nuevaRonda.numero,
            fecha: nuevaRonda.fecha,
            hora_inicio: nuevaRonda.horaInicio,
            hora_fin: nuevaRonda.horaFin,
            tiempo_usado: nuevaRonda.tiempoUsado,
            tipo: 'guias',
            pedidos_iniciales: state.valoresGuias.pedidosIniciales,
            realizado: state.valoresGuias.realizado,
            cancelado: state.valoresGuias.cancelado,
            agendado: state.valoresGuias.agendado,
            dificiles: state.valoresGuias.dificiles,
            pendientes: state.valoresGuias.pendientes,
            revisado: state.valoresGuias.revisado,
          }),
        });
        console.log('✅ Ronda guías guardada en API');
      } catch (e) {
        console.warn('No se pudo guardar en API, guardando localmente');
      }
    } else {
      nuevaRonda = {
        ...baseRonda,
        tipo: 'novedades',
        ...state.valoresNovedades,
      } as RondaNovedades;

      // Enviar a API
      try {
        await apiRequest('/rondas/novedades', {
          method: 'POST',
          body: JSON.stringify({
            usuario_id: nuevaRonda.usuarioId,
            usuario_nombre: nuevaRonda.usuarioNombre,
            numero: nuevaRonda.numero,
            fecha: nuevaRonda.fecha,
            hora_inicio: nuevaRonda.horaInicio,
            hora_fin: nuevaRonda.horaFin,
            tiempo_usado: nuevaRonda.tiempoUsado,
            tipo: 'novedades',
            total_novedades: state.valoresNovedades.totalNovedades,
            revisadas: state.valoresNovedades.revisadas,
            solucionadas: state.valoresNovedades.solucionadas,
            error_por_solucion: state.valoresNovedades.errorPorSolucion,
            proveedor: state.valoresNovedades.proveedor,
            cliente: state.valoresNovedades.cliente,
            transportadora: state.valoresNovedades.transportadora,
            litper: state.valoresNovedades.litper,
          }),
        });
        console.log('✅ Ronda novedades guardada en API');
      } catch (e) {
        console.warn('No se pudo guardar en API, guardando localmente');
      }
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

    // Sonido de éxito al guardar ronda
    playSuccessSound();

    get().guardarDatos();
  },

  // === UI ===
  setModo: (modo) => {
    set({ modo });
    if (window.electronAPI) {
      const size = WINDOW_SIZES[modo];
      window.electronAPI.setSize(size.width, size.height);
    }
    // Guardar preferencia
    if (window.electronAPI) {
      window.electronAPI.setStore('modo', modo);
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

  toggleConfig: () => {
    set((state) => ({ mostrarConfig: !state.mostrarConfig }));
  },

  // === CONFIGURACIÓN ===
  setApiUrl: async (url) => {
    const cleanUrl = url.trim();
    if (cleanUrl) {
      currentApiUrl = cleanUrl;
      set({ apiUrl: cleanUrl });
      // Guardar permanentemente en electron-store
      if (window.electronAPI) {
        await window.electronAPI.setStore('apiUrl', cleanUrl);
        console.log('✅ API URL guardada:', cleanUrl);
      }
    }
  },

  cargarConfig: async () => {
    if (window.electronAPI) {
      try {
        // Cargar API URL guardada
        const savedApiUrl = await window.electronAPI.getStore('apiUrl');
        if (savedApiUrl) {
          currentApiUrl = savedApiUrl;
          set({ apiUrl: savedApiUrl });
          console.log('📡 API URL cargada:', savedApiUrl);
        }
        // SIEMPRE iniciar en modo normal para evitar problemas
        // El usuario puede cambiar a otro modo después
        set({ modo: 'normal' });
        const size = WINDOW_SIZES['normal'];
        window.electronAPI.setSize(size.width, size.height);
        await window.electronAPI.setStore('modo', 'normal');
        console.log('✅ Modo ventana: normal');
      } catch (e) {
        console.error('Error cargando configuración:', e);
      }
    }
  },

  // === PERSISTENCIA ===
  sincronizarUsuarios: async () => {
    // Usa USUARIOS_LITPER definido globalmente al inicio del archivo
    try {
      // Intentar cargar desde API para obtener datos actualizados
      const apiUsuarios = await apiRequest('/usuarios');
      if (apiUsuarios && Array.isArray(apiUsuarios) && apiUsuarios.length > 0) {
        const usuariosAPI = apiUsuarios.map((u: any) => ({
          id: u.id,
          nombre: u.nombre,
          avatar: u.avatar || '😊',
          color: u.color || '#8B5CF6',
          metaDiaria: u.meta_diaria || 60,
          activo: u.activo !== false,
        }));
        console.log('✅ Usuarios sincronizados desde API:', usuariosAPI.length);
        set({ usuarios: usuariosAPI });
      } else {
        // Si no hay API, usar los 9 usuarios de LITPER
        console.log('📋 Usando usuarios LITPER por defecto');
        set({ usuarios: USUARIOS_LITPER });
      }

      // Guardar en electron-store
      if (window.electronAPI) {
        await window.electronAPI.setStore('usuarios', USUARIOS_LITPER);
      }
    } catch (e) {
      console.error('Error sincronizando usuarios, usando LITPER por defecto:', e);
      set({ usuarios: USUARIOS_LITPER });
    }
  },

  cargarDatos: async () => {
    // Cargar configuración guardada (API URL, modo ventana)
    await get().cargarConfig();

    // Sincronizar usuarios
    await get().sincronizarUsuarios();

    const fechaHoy = hoy();
    let rondasCargadas: Ronda[] = [];

    // 1. PRIMERO: Intentar cargar desde API
    try {
      const apiRondas = await apiRequest(`/rondas?fecha=${fechaHoy}`);
      if (apiRondas && Array.isArray(apiRondas) && apiRondas.length > 0) {
        rondasCargadas = apiRondas.map((r: any): Ronda => {
          const base = {
            id: r.id,
            usuarioId: r.usuario_id,
            usuarioNombre: r.usuario_nombre,
            numero: r.numero,
            fecha: r.fecha,
            horaInicio: r.hora_inicio,
            horaFin: r.hora_fin,
            tiempoUsado: r.tiempo_usado,
          };

          if (r.tipo === 'guias') {
            return {
              ...base,
              tipo: 'guias' as const,
              pedidosIniciales: r.pedidos_iniciales || 0,
              realizado: r.realizado || 0,
              cancelado: r.cancelado || 0,
              agendado: r.agendado || 0,
              dificiles: r.dificiles || 0,
              pendientes: r.pendientes || 0,
              revisado: r.revisado || 0,
            };
          } else {
            return {
              ...base,
              tipo: 'novedades' as const,
              totalNovedades: r.total_novedades || 0,
              revisadas: r.revisadas || 0,
              solucionadas: r.solucionadas || 0,
              errorPorSolucion: r.error_por_solucion || r.devolucion || 0,
              proveedor: r.proveedor || 0,
              cliente: r.cliente || 0,
              transportadora: r.transportadora || 0,
              litper: r.litper || 0,
            };
          }
        });
        console.log('✅ Rondas cargadas desde API:', rondasCargadas.length);
      }
    } catch (e) {
      console.warn('No se pudieron cargar rondas desde API');
    }

    // 2. Si no hay rondas de API, intentar desde almacenamiento local
    if (rondasCargadas.length === 0) {
      if (window.electronAPI) {
        try {
          const fechaGuardada = await window.electronAPI.getStore('fecha');

          if (fechaGuardada !== fechaHoy) {
            set({ rondasHoy: [], totalHoyGuias: 0, totalHoyNovedades: 0, rondaNumero: 1 });
            await window.electronAPI.setStore('fecha', fechaHoy);
          } else {
            const rondas = await window.electronAPI.getStore('rondasHoy');
            if (rondas && Array.isArray(rondas)) {
              rondasCargadas = rondas;
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
              rondasCargadas = data.rondasHoy;
            }
          }
        } catch (e) {}
      }
    }

    // Calcular totales
    const totalGuias = rondasCargadas
      .filter((r): r is RondaGuias => r.tipo === 'guias')
      .reduce((acc, r) => acc + (r.realizado || 0), 0);
    const totalNovedades = rondasCargadas
      .filter((r): r is RondaNovedades => r.tipo === 'novedades')
      .reduce((acc, r) => acc + (r.solucionadas || 0), 0);

    set({
      rondasHoy: rondasCargadas,
      totalHoyGuias: totalGuias,
      totalHoyNovedades: totalNovedades,
    });
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

  // === EXPORTAR EXCEL ===
  exportarExcel: async () => {
    const state = get();
    const fechaHoy = hoy();

    // Crear datos CSV
    const headersGuias = [
      'Fecha', 'Usuario', 'Ronda', 'Hora Inicio', 'Hora Fin', 'Tiempo (min)',
      'Iniciales', 'Realizadas', 'Canceladas', 'Agendadas', 'Dificiles', 'Pendientes', 'Revisadas'
    ];

    const headersNovedades = [
      'Fecha', 'Usuario', 'Ronda', 'Hora Inicio', 'Hora Fin', 'Tiempo (min)',
      'Total Novedades', 'Revisadas', 'Solucionadas', 'Error por Solucion', 'Proveedor', 'Cliente', 'Transportadora', 'LITPER'
    ];

    // Filtrar rondas por tipo
    const rondasGuias = state.rondasHoy.filter((r): r is RondaGuias => r.tipo === 'guias');
    const rondasNovedades = state.rondasHoy.filter((r): r is RondaNovedades => r.tipo === 'novedades');

    // Crear contenido CSV para guías
    let csvGuias = headersGuias.join(',') + '\n';
    rondasGuias.forEach(r => {
      csvGuias += [
        r.fecha,
        r.usuarioNombre,
        r.numero,
        r.horaInicio,
        r.horaFin,
        r.tiempoUsado,
        r.pedidosIniciales,
        r.realizado,
        r.cancelado,
        r.agendado,
        r.dificiles,
        r.pendientes,
        r.revisado,
      ].join(',') + '\n';
    });

    // Crear contenido CSV para novedades
    let csvNovedades = headersNovedades.join(',') + '\n';
    rondasNovedades.forEach(r => {
      csvNovedades += [
        r.fecha,
        r.usuarioNombre,
        r.numero,
        r.horaInicio,
        r.horaFin,
        r.tiempoUsado,
        r.totalNovedades || 0,
        r.revisadas,
        r.solucionadas,
        r.errorPorSolucion || 0,
        r.proveedor || 0,
        r.cliente,
        r.transportadora,
        r.litper,
      ].join(',') + '\n';
    });

    // Combinar todo en un solo CSV con secciones
    const csvCompleto = `LITPER TRACKER - REPORTE ${fechaHoy}
Usuario: ${state.usuarioActual?.nombre || 'Todos'}

=== GUIAS ===
${csvGuias}
=== NOVEDADES ===
${csvNovedades}
=== RESUMEN ===
Total Guías Realizadas: ${state.totalHoyGuias}
Total Novedades Solucionadas: ${state.totalHoyNovedades}
Total Rondas: ${state.rondasHoy.length}
`;

    // Si estamos en Electron, usar el API para guardar archivo
    if (window.electronAPI && window.electronAPI.exportCSV) {
      try {
        await window.electronAPI.exportCSV(csvCompleto, `LITPER_Rondas_${fechaHoy}.csv`);
        playSuccessSound();
        console.log('✅ Excel exportado exitosamente');
      } catch (e) {
        console.error('Error exportando:', e);
      }
    } else {
      // Fallback para navegador
      const blob = new Blob([csvCompleto], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LITPER_Rondas_${fechaHoy}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      playSuccessSound();
    }
  },

  // === SIDEBAR ===
  toggleSidebar: () => {
    set((state) => {
      const newValue = !state.sidebarCollapsed;
      // Guardar preferencia
      if (window.electronAPI) {
        window.electronAPI.setStore('sidebarCollapsed', newValue);
      }
      return { sidebarCollapsed: newValue };
    });
  },

  // === STOPWATCH (Cronómetro ascendente para novedades) ===
  iniciarStopwatch: () => {
    const state = get();
    set({
      estadoStopwatch: 'running',
      horaInicio: state.horaInicio || horaActual(),
    });
  },

  pausarStopwatch: () => set({ estadoStopwatch: 'paused' }),

  resetStopwatch: () => {
    set({
      estadoStopwatch: 'idle',
      tiempoTranscurrido: 0,
      horaInicio: '',
    });
  },

  tickStopwatch: () => {
    const { estadoStopwatch } = get();
    if (estadoStopwatch !== 'running') return;
    set((state) => ({ tiempoTranscurrido: state.tiempoTranscurrido + 1 }));
  },

  // === TIMER AJUSTE ===
  ajustarTiempo: (minutos) => {
    set((state) => {
      const nuevoTiempo = Math.max(5 * 60, state.tiempoTotal + (minutos * 60));
      return {
        tiempoTotal: nuevoTiempo,
        tiempoRestante: state.estadoTimer === 'idle' ? nuevoTiempo : state.tiempoRestante,
      };
    });
  },

  // === REINICIO DIARIO ===
  reiniciarDia: async () => {
    const state = get();

    // 1. Exportar Excel automáticamente
    await state.exportarExcel();

    // 2. Limpiar todos los datos del día
    set({
      rondasHoy: [],
      totalHoyGuias: 0,
      totalHoyNovedades: 0,
      rondaNumero: 1,
      valoresGuias: { ...valoresGuiasIniciales },
      valoresNovedades: { ...valoresNovedadesIniciales },
      tiempoRestante: get().tiempoTotal,
      estadoTimer: 'idle',
      tiempoTranscurrido: 0,
      estadoStopwatch: 'idle',
      horaInicio: '',
    });

    // 3. Guardar fecha nueva
    const fechaHoy = hoy();
    if (window.electronAPI) {
      await window.electronAPI.setStore('fecha', fechaHoy);
      await window.electronAPI.setStore('rondasHoy', []);
    }

    // También limpiar localStorage
    try {
      localStorage.setItem('litper-tracker-data', JSON.stringify({
        fecha: fechaHoy,
        rondasHoy: [],
        totalHoyGuias: 0,
        totalHoyNovedades: 0,
      }));
    } catch (e) {}

    // 4. Mostrar toast de confirmación
    get().showToast('Día reiniciado correctamente');
  },

  // === TOAST ===
  showToast: (message) => {
    set({ toastMessage: message, toastVisible: true });
    // Auto-hide después de 3 segundos
    setTimeout(() => {
      set({ toastVisible: false });
    }, 3000);
  },

  hideToast: () => set({ toastVisible: false }),

  // === MODAL ===
  showModal: (callback) => {
    set({ modalVisible: true, modalCallback: callback });
  },

  hideModal: () => {
    set({ modalVisible: false, modalCallback: null });
  },

  confirmModal: () => {
    const { modalCallback } = get();
    if (modalCallback) {
      modalCallback();
    }
    set({ modalVisible: false, modalCallback: null });
  },
}));
