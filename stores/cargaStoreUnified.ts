/**
 * LITPER - Carga Store Unificado
 * Store de Zustand que usa la nueva arquitectura de persistencia.
 * Reemplaza gradualmente al cargaStore original.
 */

import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { cargasApi, guiasApi, type Carga, type GuiaCreate } from '../services/unifiedApiService';
import { storage } from '../services/storageService';
import { syncService } from '../services/syncService';

// ==================== TIPOS ====================

export interface CargaStats {
  totalGuias: number;
  entregadas: number;
  enTransito: number;
  conNovedad: number;
  devueltas: number;
  porcentajeEntrega: number;
  valorTotal: number;
  gananciaTotal: number;
}

export interface CargaState {
  // Estado
  cargaActual: Carga | null;
  cargas: Carga[];
  isLoading: boolean;
  error: string | null;
  ultimoGuardado: Date | null;

  // Sincronización
  isSyncing: boolean;
  syncError: string | null;
  lastSyncTime: Date | null;

  // UI State (solo estos se persisten en localStorage)
  vistaActual: 'carga' | 'historial' | 'busqueda';
  filtrosActivos: Record<string, unknown>;

  // Acciones - Cargas
  crearCarga: (usuarioId: string, usuarioNombre: string) => Promise<Carga>;
  cargarCarga: (cargaId: string) => Promise<void>;
  cerrarCarga: (cargaId: string) => Promise<void>;
  obtenerCargas: () => Promise<void>;
  obtenerCargasActivas: () => Promise<Carga[]>;

  // Acciones - Guías
  agregarGuias: (guias: GuiaCreate[]) => Promise<void>;
  actualizarGuia: (guiaId: number, updates: Partial<GuiaCreate>) => Promise<void>;

  // Acciones - Sync
  sincronizar: () => Promise<void>;
  forzarSync: () => Promise<void>;

  // Acciones - UI
  setVista: (vista: 'carga' | 'historial' | 'busqueda') => void;
  setFiltros: (filtros: Record<string, unknown>) => void;
  limpiarFiltros: () => void;
  limpiarError: () => void;
}

// ==================== HELPERS ====================

const calcularStats = (carga: Carga): CargaStats => {
  return {
    totalGuias: carga.total_guias,
    entregadas: carga.entregadas,
    enTransito: carga.en_transito,
    conNovedad: carga.con_novedad,
    devueltas: carga.devueltas,
    porcentajeEntrega: carga.porcentaje_entrega,
    valorTotal: carga.valor_total,
    gananciaTotal: carga.ganancia_total,
  };
};

// ==================== STORE ====================

export const useCargaStoreUnified = create<CargaState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Estado inicial
        cargaActual: null,
        cargas: [],
        isLoading: false,
        error: null,
        ultimoGuardado: null,
        isSyncing: false,
        syncError: null,
        lastSyncTime: null,
        vistaActual: 'carga',
        filtrosActivos: {},

        // ==================== CARGAS ====================

        crearCarga: async (usuarioId: string, usuarioNombre: string) => {
          set({ isLoading: true, error: null });

          try {
            const fechaHoy = new Date().toLocaleDateString('es-CO', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            });

            const carga = await cargasApi.create({
              nombre: `${fechaHoy} - Nueva Carga`,
              usuario_id: usuarioId,
              usuario_nombre: usuarioNombre,
              guias: [],
            });

            set({
              cargaActual: carga,
              cargas: [carga, ...get().cargas],
              isLoading: false,
              ultimoGuardado: new Date(),
            });

            // Guardar referencia en storage local
            await storage.set('litper_carga_actual', carga.id);

            return carga;
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Error al crear carga';
            set({ error: errorMsg, isLoading: false });
            throw error;
          }
        },

        cargarCarga: async (cargaId: string) => {
          set({ isLoading: true, error: null });

          try {
            const carga = await cargasApi.getById(cargaId);

            set({
              cargaActual: carga,
              isLoading: false,
              vistaActual: 'carga',
            });

            await storage.set('litper_carga_actual', cargaId);
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Carga no encontrada';
            set({ error: errorMsg, isLoading: false });
          }
        },

        cerrarCarga: async (cargaId: string) => {
          try {
            const carga = await cargasApi.cerrar(cargaId);

            set((state) => ({
              cargaActual: state.cargaActual?.id === cargaId ? carga : state.cargaActual,
              cargas: state.cargas.map((c) => (c.id === cargaId ? carga : c)),
              ultimoGuardado: new Date(),
            }));
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Error al cerrar carga';
            set({ error: errorMsg });
          }
        },

        obtenerCargas: async () => {
          set({ isLoading: true });

          try {
            const cargas = await cargasApi.getAll();
            set({ cargas, isLoading: false });
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Error al obtener cargas';
            set({ error: errorMsg, isLoading: false });
          }
        },

        obtenerCargasActivas: async () => {
          try {
            const cargas = await cargasApi.getActivas();
            return cargas;
          } catch (error) {
            console.error('Error obteniendo cargas activas:', error);
            return [];
          }
        },

        // ==================== GUÍAS ====================

        agregarGuias: async (guias: GuiaCreate[]) => {
          const { cargaActual } = get();
          if (!cargaActual) {
            set({ error: 'No hay carga activa' });
            return;
          }

          set({ isLoading: true });

          try {
            // Crear guías en el backend
            const guiasCreadas = await guiasApi.createBatch(guias);

            // Actualizar la carga con las nuevas guías
            const cargaActualizada = await cargasApi.update(cargaActual.id, {
              total_guias: cargaActual.total_guias + guiasCreadas.length,
              en_transito: cargaActual.en_transito + guiasCreadas.length,
              valor_total: cargaActual.valor_total + guias.reduce((sum, g) => sum + (g.valor_facturado || 0), 0),
              ganancia_total: cargaActual.ganancia_total + guias.reduce((sum, g) => sum + (g.ganancia || 0), 0),
            });

            set({
              cargaActual: cargaActualizada,
              isLoading: false,
              ultimoGuardado: new Date(),
            });
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Error al agregar guías';
            set({ error: errorMsg, isLoading: false });
          }
        },

        actualizarGuia: async (guiaId: number, updates: Partial<GuiaCreate>) => {
          try {
            await guiasApi.update(guiaId, updates);
            set({ ultimoGuardado: new Date() });
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Error al actualizar guía';
            set({ error: errorMsg });
          }
        },

        // ==================== SYNC ====================

        sincronizar: async () => {
          if (get().isSyncing) return;

          set({ isSyncing: true, syncError: null });

          try {
            const result = await syncService.sync();

            if (result.success) {
              // Recargar datos después de sync
              await get().obtenerCargas();

              set({
                isSyncing: false,
                lastSyncTime: new Date(),
              });
            } else {
              set({
                isSyncing: false,
                syncError: result.errors.join(', '),
              });
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Error de sincronización';
            set({ isSyncing: false, syncError: errorMsg });
          }
        },

        forzarSync: async () => {
          await get().sincronizar();
        },

        // ==================== UI ====================

        setVista: (vista) => {
          set({ vistaActual: vista });
        },

        setFiltros: (filtros) => {
          set((state) => ({
            filtrosActivos: { ...state.filtrosActivos, ...filtros },
          }));
        },

        limpiarFiltros: () => {
          set({ filtrosActivos: {} });
        },

        limpiarError: () => {
          set({ error: null, syncError: null });
        },
      }),
      {
        name: 'litper-carga-unified',
        // Solo persistir estado de UI, no datos
        partialize: (state) => ({
          vistaActual: state.vistaActual,
          filtrosActivos: state.filtrosActivos,
        }),
      }
    )
  )
);

// ==================== INICIALIZACIÓN ====================

// Cargar carga actual al iniciar
const initializeStore = async () => {
  const cargaActualId = await storage.get<string>('litper_carga_actual');
  if (cargaActualId) {
    useCargaStoreUnified.getState().cargarCarga(cargaActualId);
  }

  // Iniciar sincronización automática
  syncService.start();
};

// Solo inicializar en el cliente
if (typeof window !== 'undefined') {
  initializeStore();
}

// ==================== SELECTORES ====================

export const selectCargaActual = (state: CargaState) => state.cargaActual;
export const selectCargas = (state: CargaState) => state.cargas;
export const selectIsLoading = (state: CargaState) => state.isLoading;
export const selectError = (state: CargaState) => state.error;
export const selectIsSyncing = (state: CargaState) => state.isSyncing;
export const selectStats = (state: CargaState) =>
  state.cargaActual ? calcularStats(state.cargaActual) : null;

export default useCargaStoreUnified;
