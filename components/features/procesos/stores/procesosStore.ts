/**
 * STORE DE PROCESOS 2.0
 * Estado global para el módulo de procesos
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
        }, 500);
      },
    }
  )
);

export default useProcesosStore;
