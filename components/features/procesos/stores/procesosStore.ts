/**
 * STORE DE PROCESOS 2.0
 * Estado global para el módulo de procesos
 * Con soporte para modo offline, themes y sonidos
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  Usuario,
  RondaGuias,
  RegistroNovedades,
  NotaFlotante,
  PerfilGamificacion,
  Logro,
  AlertaIA,
  ConfigCronometro,
  EstadoCronometro,
  LOGROS_DISPONIBLES,
  NIVELES,
  COLORES_DISPONIBLES,
} from '../types';

// ============================================
// TIPOS PARA SYNC QUEUE Y CONFIGURACIÓN
// ============================================

interface SyncQueueItem {
  id: string;
  tipo: 'usuario' | 'ronda_guias' | 'ronda_novedades' | 'delete_usuario';
  datos: any;
  timestamp: number;
  intentos: number;
}

type ThemeType = 'dark' | 'light' | 'blue' | 'green' | 'purple';

interface SonidoConfig {
  habilitado: boolean;
  volumen: number;
  sonidoFin: string;
  sonidoAlerta: string;
  sonidoLogro: string;
}

interface ThemeConfig {
  tema: ThemeType;
  colorPrimario: string;
  colorSecundario: string;
  fondoPersonalizado: string | null;
}

const TEMAS_DISPONIBLES: Record<ThemeType, { bg: string; text: string; primary: string; secondary: string }> = {
  dark: { bg: '#0f172a', text: '#f1f5f9', primary: '#3b82f6', secondary: '#1e293b' },
  light: { bg: '#f8fafc', text: '#0f172a', primary: '#2563eb', secondary: '#e2e8f0' },
  blue: { bg: '#0c1929', text: '#e0f2fe', primary: '#0ea5e9', secondary: '#0f3460' },
  green: { bg: '#052e16', text: '#dcfce7', primary: '#22c55e', secondary: '#14532d' },
  purple: { bg: '#1e1b4b', text: '#ede9fe', primary: '#8b5cf6', secondary: '#312e81' },
};

const SONIDOS_DISPONIBLES = [
  { id: 'bell', nombre: 'Campana', archivo: '/sounds/bell.mp3' },
  { id: 'chime', nombre: 'Tintineo', archivo: '/sounds/chime.mp3' },
  { id: 'success', nombre: 'Éxito', archivo: '/sounds/success.mp3' },
  { id: 'notification', nombre: 'Notificación', archivo: '/sounds/notification.mp3' },
  { id: 'pop', nombre: 'Pop', archivo: '/sounds/pop.mp3' },
];

// ============================================
// API SYNC - Sincronización con el backend
// ============================================

const API_URL = 'http://localhost:8000/api/tracker';

const syncUsuarioToAPI = async (usuario: Usuario & { id: string }) => {
  try {
    await fetch(`${API_URL}/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: usuario.id,
        nombre: usuario.nombre,
        avatar: usuario.avatar,
        color: usuario.color,
        meta_diaria: usuario.metaDiaria || 50,
        activo: usuario.activo !== false,
      }),
    });
    console.log('✅ Usuario sincronizado con backend:', usuario.nombre);
  } catch (error) {
    console.warn('⚠️ No se pudo sincronizar usuario con backend:', error);
  }
};

const deleteUsuarioFromAPI = async (id: string) => {
  try {
    await fetch(`${API_URL}/usuarios/${id}`, { method: 'DELETE' });
  } catch (error) {
    console.warn('⚠️ No se pudo eliminar usuario del backend:', error);
  }
};

// Sincronizar TODOS los usuarios existentes al backend
const syncAllUsersToAPI = async (usuarios: Usuario[]) => {
  console.log('🔄 Sincronizando todos los usuarios al backend...');
  for (const usuario of usuarios) {
    await syncUsuarioToAPI(usuario as Usuario & { id: string });
  }
  console.log('✅ Sincronización completa:', usuarios.length, 'usuarios');
};

// Cargar usuarios DESDE el backend
const fetchUsersFromAPI = async (): Promise<Usuario[]> => {
  try {
    const response = await fetch(`${API_URL}/usuarios`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Usuarios cargados desde backend:', data.length);
      return data.map((u: any) => ({
        id: u.id,
        nombre: u.nombre,
        avatar: u.avatar || '😊',
        color: u.color || 'purple',
        sonido: 'bell',
        metaDiaria: u.meta_diaria || 50,
        rol: 'usuario' as const,
        activo: u.activo !== false,
        createdAt: new Date(),
      }));
    }
  } catch (error) {
    console.warn('⚠️ No se pudieron cargar usuarios desde backend:', error);
  }
  return [];
};

// ============================================
// TIPOS DEL STORE
// ============================================

interface ProcesosState {
  // Usuarios
  usuarios: Usuario[];
  usuarioActual: Usuario | null;

  // Cronómetro
  configCronometro: ConfigCronometro;
  estadoCronometro: EstadoCronometro;
  tiempoRestante: number; // en segundos

  // Datos
  rondas: RondaGuias[];
  novedades: RegistroNovedades[];

  // Notas flotantes
  notas: NotaFlotante[];

  // Gamificación
  perfiles: PerfilGamificacion[];

  // Alertas IA
  alertas: AlertaIA[];

  // UI
  vistaAdmin: boolean;
  mostrarNotas: boolean;

  // Offline & Sync
  isOnline: boolean;
  syncQueue: SyncQueueItem[];
  lastSyncTime: number | null;
  syncError: string | null;

  // Theme & Sonidos
  themeConfig: ThemeConfig;
  sonidoConfig: SonidoConfig;

  // === ACCIONES USUARIOS ===
  agregarUsuario: (usuario: Omit<Usuario, 'id' | 'createdAt'>) => void;
  eliminarUsuario: (id: string) => void;
  actualizarUsuario: (id: string, datos: Partial<Usuario>) => void;
  seleccionarUsuario: (id: string) => void;
  sincronizarConBackend: () => Promise<void>;
  cargarUsuariosDesdeBackend: () => Promise<void>;

  // === ACCIONES CRONÓMETRO ===
  iniciarCronometro: () => void;
  pausarCronometro: () => void;
  resetearCronometro: () => void;
  tick: () => void;
  configurarCronometro: (config: Partial<ConfigCronometro>) => void;

  // === ACCIONES RONDAS ===
  agregarRonda: (ronda: Omit<RondaGuias, 'id'>) => void;
  actualizarRonda: (id: string, datos: Partial<RondaGuias>) => void;

  // === ACCIONES NOVEDADES ===
  agregarNovedad: (novedad: Omit<RegistroNovedades, 'id'>) => void;

  // === ACCIONES NOTAS ===
  agregarNota: (nota: Omit<NotaFlotante, 'id' | 'createdAt' | 'updatedAt'>) => void;
  actualizarNota: (id: string, datos: Partial<NotaFlotante>) => void;
  eliminarNota: (id: string) => void;

  // === ACCIONES GAMIFICACIÓN ===
  agregarXP: (usuarioId: string, cantidad: number, razon: string) => void;
  desbloquearLogro: (usuarioId: string, logroId: string) => void;
  verificarLogros: (usuarioId: string) => void;

  // === ACCIONES ALERTAS ===
  agregarAlerta: (alerta: Omit<AlertaIA, 'id' | 'timestamp' | 'leida'>) => void;
  marcarAlertaLeida: (id: string) => void;
  limpiarAlertas: () => void;

  // === ACCIONES UI ===
  toggleVistaAdmin: () => void;
  toggleNotas: () => void;

  // === ACCIONES OFFLINE & SYNC ===
  setOnlineStatus: (online: boolean) => void;
  addToSyncQueue: (item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'intentos'>) => void;
  processSyncQueue: () => Promise<void>;
  clearSyncQueue: () => void;

  // === ACCIONES THEME ===
  setTheme: (tema: ThemeType) => void;
  setThemeConfig: (config: Partial<ThemeConfig>) => void;
  getThemeColors: () => typeof TEMAS_DISPONIBLES['dark'];

  // === ACCIONES SONIDOS ===
  setSonidoConfig: (config: Partial<SonidoConfig>) => void;
  reproducirSonido: (tipo: 'fin' | 'alerta' | 'logro') => void;

  // === GETTERS ===
  getUsuarioById: (id: string) => Usuario | undefined;
  getRondasUsuario: (usuarioId: string) => RondaGuias[];
  getPerfilGamificacion: (usuarioId: string) => PerfilGamificacion | undefined;
  getNivelActual: (xp: number) => typeof NIVELES[number];
  getNotasUsuario: (usuarioId: string) => NotaFlotante[];
}

// ============================================
// HELPERS
// ============================================

const generarId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

const calcularNivel = (xp: number) => {
  for (let i = NIVELES.length - 1; i >= 0; i--) {
    if (xp >= NIVELES[i].xpRequerido) {
      return NIVELES[i];
    }
  }
  return NIVELES[0];
};

// ============================================
// STORE
// ============================================

export const useProcesosStore = create<ProcesosState>()(
  persist(
    (set, get) => ({
      // === ESTADO INICIAL ===
      usuarios: [],
      usuarioActual: null,

      configCronometro: {
        duracionMinutos: 25,
        alertaAmarilla: 50,
        alertaNaranja: 25,
        alertaRoja: 10,
        sonidoFinal: true,
        vibracion: true,
      },
      estadoCronometro: 'idle',
      tiempoRestante: 25 * 60,

      rondas: [],
      novedades: [],
      notas: [],
      perfiles: [],
      alertas: [],

      vistaAdmin: false,
      mostrarNotas: true,

      // Offline & Sync
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      syncQueue: [],
      lastSyncTime: null,
      syncError: null,

      // Theme
      themeConfig: {
        tema: 'dark',
        colorPrimario: '#3b82f6',
        colorSecundario: '#1e293b',
        fondoPersonalizado: null,
      },

      // Sonidos
      sonidoConfig: {
        habilitado: true,
        volumen: 0.7,
        sonidoFin: 'bell',
        sonidoAlerta: 'notification',
        sonidoLogro: 'success',
      },

      // === ACCIONES USUARIOS ===
      agregarUsuario: (usuario) => {
        const nuevoUsuario: Usuario = {
          ...usuario,
          id: generarId(),
          createdAt: new Date(),
        };

        const nuevoPerfil: PerfilGamificacion = {
          usuarioId: nuevoUsuario.id,
          xp: 0,
          nivel: 1,
          rachaActual: 0,
          mejorRacha: 0,
          guiasTotales: 0,
          logroIds: [],
          avatarDesbloqueados: ['😊'],
          coloresDesbloqueados: [COLORES_DISPONIBLES[0].id],
          sonidosDesbloqueados: ['bell'],
        };

        set((state) => ({
          usuarios: [...state.usuarios, nuevoUsuario],
          perfiles: [...state.perfiles, nuevoPerfil],
        }));

        // Sincronizar con el backend (para el Tracker desktop)
        syncUsuarioToAPI(nuevoUsuario as Usuario & { id: string });
      },

      eliminarUsuario: (id) => {
        set((state) => ({
          usuarios: state.usuarios.filter((u) => u.id !== id),
          perfiles: state.perfiles.filter((p) => p.usuarioId !== id),
          rondas: state.rondas.filter((r) => r.usuarioId !== id),
          novedades: state.novedades.filter((n) => n.usuarioId !== id),
          notas: state.notas.filter((n) => n.usuarioId !== id),
          usuarioActual: state.usuarioActual?.id === id ? null : state.usuarioActual,
        }));

        // Sincronizar eliminación con el backend
        deleteUsuarioFromAPI(id);
      },

      actualizarUsuario: (id, datos) => {
        set((state) => ({
          usuarios: state.usuarios.map((u) =>
            u.id === id ? { ...u, ...datos } : u
          ),
          usuarioActual:
            state.usuarioActual?.id === id
              ? { ...state.usuarioActual, ...datos }
              : state.usuarioActual,
        }));
      },

      seleccionarUsuario: (id) => {
        const usuario = get().usuarios.find((u) => u.id === id);
        set({ usuarioActual: usuario || null });
      },

      sincronizarConBackend: async () => {
        const usuarios = get().usuarios;
        await syncAllUsersToAPI(usuarios);
      },

      cargarUsuariosDesdeBackend: async () => {
        const usuariosBackend = await fetchUsersFromAPI();
        if (usuariosBackend.length > 0) {
          // Merge: agregar usuarios del backend que no existan localmente
          const usuariosLocales = get().usuarios;
          const idsLocales = new Set(usuariosLocales.map(u => u.id));

          const nuevosUsuarios = usuariosBackend.filter(u => !idsLocales.has(u.id));

          if (nuevosUsuarios.length > 0) {
            // Crear perfiles de gamificación para los nuevos usuarios
            const nuevosPerfiles = nuevosUsuarios.map(u => ({
              usuarioId: u.id,
              xp: 0,
              nivel: 1,
              rachaActual: 0,
              mejorRacha: 0,
              guiasTotales: 0,
              logroIds: [] as string[],
              avatarDesbloqueados: ['😊'],
              coloresDesbloqueados: [COLORES_DISPONIBLES[0].id],
              sonidosDesbloqueados: ['bell'],
            }));

            set((state) => ({
              usuarios: [...state.usuarios, ...nuevosUsuarios],
              perfiles: [...state.perfiles, ...nuevosPerfiles],
            }));
            console.log('✅ Usuarios agregados desde backend:', nuevosUsuarios.length);
          }
        }
      },

      // === ACCIONES CRONÓMETRO ===
      iniciarCronometro: () => {
        set({ estadoCronometro: 'running' });
      },

      pausarCronometro: () => {
        set({ estadoCronometro: 'paused' });
      },

      resetearCronometro: () => {
        const { configCronometro } = get();
        set({
          estadoCronometro: 'idle',
          tiempoRestante: configCronometro.duracionMinutos * 60,
        });
      },

      tick: () => {
        const { tiempoRestante, estadoCronometro } = get();
        if (estadoCronometro !== 'running') return;

        if (tiempoRestante <= 1) {
          set({ tiempoRestante: 0, estadoCronometro: 'finished' });
          // Aquí se podría agregar sonido/vibración
        } else {
          set({ tiempoRestante: tiempoRestante - 1 });
        }
      },

      configurarCronometro: (config) => {
        set((state) => {
          const nuevaConfig = { ...state.configCronometro, ...config };
          return {
            configCronometro: nuevaConfig,
            tiempoRestante: state.estadoCronometro === 'idle'
              ? nuevaConfig.duracionMinutos * 60
              : state.tiempoRestante,
          };
        });
      },

      // === ACCIONES RONDAS ===
      agregarRonda: (ronda) => {
        const nuevaRonda: RondaGuias = {
          ...ronda,
          id: generarId(),
        };

        set((state) => ({
          rondas: [...state.rondas, nuevaRonda],
        }));

        // Agregar XP
        const totalGuias = ronda.realizado;
        const bonusSinCancel = ronda.cancelado === 0 ? 5 : 0;
        get().agregarXP(ronda.usuarioId, totalGuias * 10 + bonusSinCancel, 'Ronda completada');
        get().verificarLogros(ronda.usuarioId);
      },

      actualizarRonda: (id, datos) => {
        set((state) => ({
          rondas: state.rondas.map((r) =>
            r.id === id ? { ...r, ...datos } : r
          ),
        }));
      },

      // === ACCIONES NOVEDADES ===
      agregarNovedad: (novedad) => {
        const nuevaNovedad: RegistroNovedades = {
          ...novedad,
          id: generarId(),
        };

        set((state) => ({
          novedades: [...state.novedades, nuevaNovedad],
        }));

        // Agregar XP por novedades solucionadas
        get().agregarXP(novedad.usuarioId, novedad.solucionadas * 5, 'Novedades solucionadas');
      },

      // === ACCIONES NOTAS ===
      agregarNota: (nota) => {
        const nuevaNota: NotaFlotante = {
          ...nota,
          id: generarId(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          notas: [...state.notas, nuevaNota],
        }));
      },

      actualizarNota: (id, datos) => {
        set((state) => ({
          notas: state.notas.map((n) =>
            n.id === id ? { ...n, ...datos, updatedAt: new Date() } : n
          ),
        }));
      },

      eliminarNota: (id) => {
        set((state) => ({
          notas: state.notas.filter((n) => n.id !== id),
        }));
      },

      // === ACCIONES GAMIFICACIÓN ===
      agregarXP: (usuarioId, cantidad, razon) => {
        set((state) => {
          const perfiles = state.perfiles.map((p) => {
            if (p.usuarioId !== usuarioId) return p;

            const nuevoXP = p.xp + cantidad;
            const nivelAnterior = calcularNivel(p.xp);
            const nivelNuevo = calcularNivel(nuevoXP);

            // Si subió de nivel, agregar alerta
            if (nivelNuevo.nivel > nivelAnterior.nivel) {
              get().agregarAlerta({
                tipo: 'success',
                mensaje: `¡Subiste al nivel ${nivelNuevo.nivel} - ${nivelNuevo.nombre}! 🎉`,
                usuarioId,
              });
            }

            return {
              ...p,
              xp: nuevoXP,
              nivel: nivelNuevo.nivel,
            };
          });

          return { perfiles };
        });
      },

      desbloquearLogro: (usuarioId, logroId) => {
        set((state) => ({
          perfiles: state.perfiles.map((p) => {
            if (p.usuarioId !== usuarioId || p.logroIds.includes(logroId)) return p;

            const logro = LOGROS_DISPONIBLES.find((l) => l.id === logroId);
            if (logro) {
              get().agregarAlerta({
                tipo: 'success',
                mensaje: `¡Logro desbloqueado: ${logro.nombre} ${logro.icono}!`,
                usuarioId,
              });
              get().agregarXP(usuarioId, logro.xpRecompensa, `Logro: ${logro.nombre}`);
            }

            return {
              ...p,
              logroIds: [...p.logroIds, logroId],
            };
          }),
        }));
      },

      verificarLogros: (usuarioId) => {
        const perfil = get().perfiles.find((p) => p.usuarioId === usuarioId);
        const rondas = get().getRondasUsuario(usuarioId);

        if (!perfil) return;

        const guiasHoy = rondas
          .filter((r) => r.fecha === new Date().toISOString().split('T')[0])
          .reduce((acc, r) => acc + r.realizado, 0);

        // Verificar logros de guías
        if (guiasHoy >= 50 && !perfil.logroIds.includes('guias50')) {
          get().desbloquearLogro(usuarioId, 'guias50');
        }
        if (guiasHoy >= 100 && !perfil.logroIds.includes('guias100')) {
          get().desbloquearLogro(usuarioId, 'guias100');
        }
        if (perfil.guiasTotales >= 1000 && !perfil.logroIds.includes('guias1000')) {
          get().desbloquearLogro(usuarioId, 'guias1000');
        }

        // Verificar logros de racha
        if (perfil.rachaActual >= 5 && !perfil.logroIds.includes('racha5')) {
          get().desbloquearLogro(usuarioId, 'racha5');
        }
        if (perfil.rachaActual >= 10 && !perfil.logroIds.includes('racha10')) {
          get().desbloquearLogro(usuarioId, 'racha10');
        }
        if (perfil.rachaActual >= 30 && !perfil.logroIds.includes('racha30')) {
          get().desbloquearLogro(usuarioId, 'racha30');
        }
      },

      // === ACCIONES ALERTAS ===
      agregarAlerta: (alerta) => {
        const nuevaAlerta: AlertaIA = {
          ...alerta,
          id: generarId(),
          timestamp: new Date(),
          leida: false,
        };

        set((state) => ({
          alertas: [nuevaAlerta, ...state.alertas].slice(0, 50), // Max 50 alertas
        }));
      },

      marcarAlertaLeida: (id) => {
        set((state) => ({
          alertas: state.alertas.map((a) =>
            a.id === id ? { ...a, leida: true } : a
          ),
        }));
      },

      limpiarAlertas: () => {
        set({ alertas: [] });
      },

      // === ACCIONES UI ===
      toggleVistaAdmin: () => {
        set((state) => ({ vistaAdmin: !state.vistaAdmin }));
      },

      toggleNotas: () => {
        set((state) => ({ mostrarNotas: !state.mostrarNotas }));
      },

      // === ACCIONES OFFLINE & SYNC ===
      setOnlineStatus: (online) => {
        set({ isOnline: online });
        if (online) {
          // Cuando vuelve a estar online, procesar la cola de sync
          get().processSyncQueue();
        }
      },

      addToSyncQueue: (item) => {
        const newItem: SyncQueueItem = {
          ...item,
          id: generarId(),
          timestamp: Date.now(),
          intentos: 0,
        };
        set((state) => ({
          syncQueue: [...state.syncQueue, newItem],
        }));
      },

      processSyncQueue: async () => {
        const { syncQueue, isOnline } = get();
        if (!isOnline || syncQueue.length === 0) return;

        const itemsToProcess = [...syncQueue];
        const processedIds: string[] = [];

        for (const item of itemsToProcess) {
          try {
            let success = false;

            switch (item.tipo) {
              case 'usuario':
                await syncUsuarioToAPI(item.datos);
                success = true;
                break;
              case 'ronda_guias':
                await fetch(`${API_URL}/rondas/guias`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(item.datos),
                });
                success = true;
                break;
              case 'ronda_novedades':
                await fetch(`${API_URL}/rondas/novedades`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(item.datos),
                });
                success = true;
                break;
              case 'delete_usuario':
                await deleteUsuarioFromAPI(item.datos.id);
                success = true;
                break;
            }

            if (success) {
              processedIds.push(item.id);
            }
          } catch (error) {
            console.warn('Error procesando item de sync:', error);
            // Incrementar intentos
            set((state) => ({
              syncQueue: state.syncQueue.map((q) =>
                q.id === item.id ? { ...q, intentos: q.intentos + 1 } : q
              ),
            }));
          }
        }

        // Eliminar items procesados exitosamente
        if (processedIds.length > 0) {
          set((state) => ({
            syncQueue: state.syncQueue.filter((q) => !processedIds.includes(q.id)),
            lastSyncTime: Date.now(),
            syncError: null,
          }));
          console.log(`✅ Sincronizados ${processedIds.length} items desde la cola`);
        }
      },

      clearSyncQueue: () => {
        set({ syncQueue: [], syncError: null });
      },

      // === ACCIONES THEME ===
      setTheme: (tema) => {
        const colores = TEMAS_DISPONIBLES[tema];
        set((state) => ({
          themeConfig: {
            ...state.themeConfig,
            tema,
            colorPrimario: colores.primary,
            colorSecundario: colores.secondary,
          },
        }));
      },

      setThemeConfig: (config) => {
        set((state) => ({
          themeConfig: { ...state.themeConfig, ...config },
        }));
      },

      getThemeColors: () => {
        const tema = get().themeConfig.tema;
        return TEMAS_DISPONIBLES[tema];
      },

      // === ACCIONES SONIDOS ===
      setSonidoConfig: (config) => {
        set((state) => ({
          sonidoConfig: { ...state.sonidoConfig, ...config },
        }));
      },

      reproducirSonido: (tipo) => {
        const { sonidoConfig } = get();
        if (!sonidoConfig.habilitado) return;

        let sonidoId: string;
        switch (tipo) {
          case 'fin':
            sonidoId = sonidoConfig.sonidoFin;
            break;
          case 'alerta':
            sonidoId = sonidoConfig.sonidoAlerta;
            break;
          case 'logro':
            sonidoId = sonidoConfig.sonidoLogro;
            break;
        }

        const sonido = SONIDOS_DISPONIBLES.find((s) => s.id === sonidoId);
        if (sonido && typeof Audio !== 'undefined') {
          try {
            const audio = new Audio(sonido.archivo);
            audio.volume = sonidoConfig.volumen;
            audio.play().catch((e) => console.warn('No se pudo reproducir sonido:', e));
          } catch (e) {
            console.warn('Error al reproducir sonido:', e);
          }
        }
      },

      // === GETTERS ===
      getUsuarioById: (id) => {
        return get().usuarios.find((u) => u.id === id);
      },

      getRondasUsuario: (usuarioId) => {
        return get().rondas.filter((r) => r.usuarioId === usuarioId);
      },

      getPerfilGamificacion: (usuarioId) => {
        return get().perfiles.find((p) => p.usuarioId === usuarioId);
      },

      getNivelActual: (xp) => {
        return calcularNivel(xp);
      },

      getNotasUsuario: (usuarioId) => {
        return get().notas.filter((n) => n.usuarioId === usuarioId);
      },
    }),
    {
      name: 'litper-procesos-store',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        // 1. Sincronizar usuarios locales al backend
        if (state && state.usuarios.length > 0) {
          console.log('🔄 Auto-sincronizando usuarios locales con el backend...');
          syncAllUsersToAPI(state.usuarios);
        }

        // 2. Cargar usuarios desde el backend (después de un pequeño delay para asegurar el store esté listo)
        setTimeout(async () => {
          console.log('🔄 Cargando usuarios desde el backend...');
          const usuariosBackend = await fetchUsersFromAPI();
          if (usuariosBackend.length > 0) {
            const store = useProcesosStore.getState();
            const idsLocales = new Set(store.usuarios.map(u => u.id));
            const nuevosUsuarios = usuariosBackend.filter(u => !idsLocales.has(u.id));

            if (nuevosUsuarios.length > 0) {
              const nuevosPerfiles = nuevosUsuarios.map(u => ({
                usuarioId: u.id,
                xp: 0,
                nivel: 1,
                rachaActual: 0,
                mejorRacha: 0,
                guiasTotales: 0,
                logroIds: [] as string[],
                avatarDesbloqueados: ['😊'],
                coloresDesbloqueados: [COLORES_DISPONIBLES[0].id],
                sonidosDesbloqueados: ['bell'],
              }));

              useProcesosStore.setState({
                usuarios: [...store.usuarios, ...nuevosUsuarios],
                perfiles: [...store.perfiles, ...nuevosPerfiles],
              });
              console.log('✅ Usuarios del backend agregados:', nuevosUsuarios.map(u => u.nombre).join(', '));
            }
          }

          // Procesar cola de sync pendiente
          useProcesosStore.getState().processSyncQueue();
        }, 500);

        // 3. Configurar listeners de online/offline
        if (typeof window !== 'undefined') {
          window.addEventListener('online', () => {
            console.log('🌐 Conexión restaurada');
            useProcesosStore.getState().setOnlineStatus(true);
          });

          window.addEventListener('offline', () => {
            console.log('📴 Sin conexión - Modo offline activado');
            useProcesosStore.getState().setOnlineStatus(false);
          });
        }
      },
    }
  )
);

// Exportar constantes para uso en componentes
export { TEMAS_DISPONIBLES, SONIDOS_DISPONIBLES };
export type { ThemeType, ThemeConfig, SonidoConfig, SyncQueueItem };

export default useProcesosStore;
