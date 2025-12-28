// stores/cargaStore.ts
// Store Zustand para gestión de cargas

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Carga,
  GuiaCarga,
  CargaHistorial,
  FiltrosCarga,
  CargaDia,
  CargaProgress,
  CargaError,
  BatchConfig,
  SyncStatus,
  DEFAULT_BATCH_CONFIG,
} from '../types/carga.types';
import { cargaService } from '../services/cargaService';

interface CargaState {
  // Estado actual
  cargaActual: Carga | null;
  cargaActualId: string | null;
  isLoading: boolean;
  error: string | null;
  ultimoGuardado: Date | null;

  // Historial
  historial: CargaHistorial | null;
  filtrosActivos: FiltrosCarga;

  // Vista
  vistaActual: 'carga' | 'historial' | 'busqueda';
  guiaSeleccionadaId: string | null;

  // === NUEVO: Progress & Batch ===
  progress: CargaProgress;
  batchConfig: BatchConfig;
  syncStatus: SyncStatus;

  // Acciones - Carga
  crearNuevaCarga: (usuarioId: string, usuarioNombre: string) => Carga;
  cargarCarga: (cargaId: string) => void;
  cerrarCargaActual: () => void;
  iniciarNuevoDia: (usuarioId: string, usuarioNombre: string) => Carga;

  // Acciones - Guías
  agregarGuias: (guias: GuiaCarga[]) => void;
  actualizarGuia: (guiaId: string, updates: Partial<GuiaCarga>) => void;
  eliminarGuia: (guiaId: string) => void;
  importarDesdeShipments: (shipments: unknown[]) => void;

  // === NUEVO: Batch Processing ===
  agregarGuiasEnLotes: (guias: GuiaCarga[], onProgress?: (progress: CargaProgress) => void) => Promise<void>;
  reintentarGuiasFallidas: () => Promise<void>;
  pausarProcesamiento: () => void;
  reanudarProcesamiento: () => void;
  resetProgress: () => void;

  // === NUEVO: Backend Sync ===
  sincronizarConBackend: () => Promise<boolean>;
  setSyncStatus: (status: Partial<SyncStatus>) => void;

  // Acciones - Historial
  cargarHistorial: (filtros?: FiltrosCarga) => void;
  setFiltros: (filtros: Partial<FiltrosCarga>) => void;
  limpiarFiltros: () => void;

  // Acciones - Vista
  setVista: (vista: 'carga' | 'historial' | 'busqueda') => void;
  setGuiaSeleccionada: (guiaId: string | null) => void;

  // Utilidades
  guardarCambios: () => void;
  refrescar: () => void;
  limpiarError: () => void;
  setBatchConfig: (config: Partial<BatchConfig>) => void;
}

// Helper: Crear progress inicial
const createInitialProgress = (): CargaProgress => ({
  total: 0,
  procesados: 0,
  exitosos: 0,
  fallidos: 0,
  porcentaje: 0,
  batchActual: 0,
  totalBatches: 0,
  errores: [],
  estado: 'idle',
});

// Helper: Crear sync status inicial
const createInitialSyncStatus = (): SyncStatus => ({
  ultimaSync: null,
  pendienteSync: false,
  errorSync: null,
  cargasPendientes: [],
});

// Helper: Delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useCargaStore = create<CargaState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      cargaActual: null,
      cargaActualId: null,
      isLoading: false,
      error: null,
      ultimoGuardado: null,
      historial: null,
      filtrosActivos: {},
      vistaActual: 'carga',
      guiaSeleccionadaId: null,

      // === NUEVO: Estado inicial para batch y sync ===
      progress: createInitialProgress(),
      batchConfig: DEFAULT_BATCH_CONFIG,
      syncStatus: createInitialSyncStatus(),

      // ==================== CARGA ====================

      crearNuevaCarga: (usuarioId: string, usuarioNombre: string) => {
        set({ isLoading: true, error: null });

        try {
          const carga = cargaService.crearCarga(usuarioId, usuarioNombre);

          set({
            cargaActual: carga,
            cargaActualId: carga.id,
            isLoading: false,
            ultimoGuardado: new Date(),
          });

          return carga;
        } catch (error) {
          set({
            error: `Error al crear carga: ${error}`,
            isLoading: false,
          });
          throw error;
        }
      },

      cargarCarga: (cargaId: string) => {
        set({ isLoading: true, error: null });

        try {
          const carga = cargaService.getCarga(cargaId);

          if (!carga) {
            set({ error: 'Carga no encontrada', isLoading: false });
            return;
          }

          cargaService.setCargaActual(cargaId);

          set({
            cargaActual: carga,
            cargaActualId: cargaId,
            isLoading: false,
            vistaActual: 'carga',
          });
        } catch (error) {
          set({
            error: `Error al cargar: ${error}`,
            isLoading: false,
          });
        }
      },

      cerrarCargaActual: () => {
        const { cargaActualId } = get();
        if (!cargaActualId) return;

        try {
          cargaService.cerrarCarga(cargaActualId);
          const cargaActualizada = cargaService.getCarga(cargaActualId);

          set({
            cargaActual: cargaActualizada,
            ultimoGuardado: new Date(),
          });
        } catch (error) {
          set({ error: `Error al cerrar carga: ${error}` });
        }
      },

      iniciarNuevoDia: (usuarioId: string, usuarioNombre: string) => {
        // Cerrar carga actual si existe
        const { cargaActualId } = get();
        if (cargaActualId) {
          cargaService.cerrarCarga(cargaActualId);
        }

        // Crear nueva carga
        return get().crearNuevaCarga(usuarioId, usuarioNombre);
      },

      // ==================== GUÍAS ====================

      agregarGuias: (guias: GuiaCarga[]) => {
        const { cargaActualId } = get();
        if (!cargaActualId) {
          set({ error: 'No hay carga activa' });
          return;
        }

        try {
          const cargaActualizada = cargaService.agregarGuias(cargaActualId, guias);

          if (cargaActualizada) {
            set({
              cargaActual: cargaActualizada,
              ultimoGuardado: new Date(),
            });
          }
        } catch (error) {
          set({ error: `Error al agregar guías: ${error}` });
        }
      },

      actualizarGuia: (guiaId: string, updates: Partial<GuiaCarga>) => {
        const { cargaActualId } = get();
        if (!cargaActualId) return;

        try {
          const cargaActualizada = cargaService.actualizarGuia(
            cargaActualId,
            guiaId,
            updates
          );

          if (cargaActualizada) {
            set({
              cargaActual: cargaActualizada,
              ultimoGuardado: new Date(),
            });
          }
        } catch (error) {
          set({ error: `Error al actualizar guía: ${error}` });
        }
      },

      eliminarGuia: (guiaId: string) => {
        const { cargaActualId } = get();
        if (!cargaActualId) return;

        try {
          const cargaActualizada = cargaService.eliminarGuia(cargaActualId, guiaId);

          if (cargaActualizada) {
            set({
              cargaActual: cargaActualizada,
              ultimoGuardado: new Date(),
            });
          }
        } catch (error) {
          set({ error: `Error al eliminar guía: ${error}` });
        }
      },

      importarDesdeShipments: (shipments: unknown[]) => {
        // Convertir shipments del formato actual al formato GuiaCarga
        const guias: GuiaCarga[] = (shipments as Array<Record<string, unknown>>).map((s, index) => ({
          id: (s.id as string) || `guia_${Date.now()}_${index}`,
          numeroGuia: (s.guia as string) || (s.trackingNumber as string) || '',
          estado: (s.estado as string) || (s.status as string) || 'Desconocido',
          transportadora: (s.transportadora as string) || (s.carrier as string) || 'No especificada',
          ciudadDestino: (s.ciudadDestino as string) || (s.destination as string) || '',
          telefono: (s.telefono as string) || (s.phone as string),
          nombreCliente: s.nombreCliente as string,
          direccion: s.direccion as string,
          diasTransito: (s.dias as number) || (s.daysInTransit as number) || 0,
          tieneNovedad: (s.tieneNovedad as boolean) || (s.hasIssue as boolean) || false,
          tipoNovedad: s.tipoNovedad as string,
          descripcionNovedad: s.descripcionNovedad as string,
          valorDeclarado: s.valorDeclarado as number,
          ultimoMovimiento: s.ultimoMovimiento as string,
          fuente: (s.source as GuiaCarga['fuente']) || 'MANUAL',
          datosExtra: s as Record<string, unknown>,
        }));

        get().agregarGuias(guias);
      },

      // ==================== HISTORIAL ====================

      cargarHistorial: (filtros?: FiltrosCarga) => {
        set({ isLoading: true });

        try {
          const filtrosAUsar = filtros || get().filtrosActivos;
          const historial = cargaService.getHistorial(filtrosAUsar);

          set({
            historial,
            filtrosActivos: filtrosAUsar,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: `Error al cargar historial: ${error}`,
            isLoading: false,
          });
        }
      },

      setFiltros: (filtros: Partial<FiltrosCarga>) => {
        const nuevosFiltros = { ...get().filtrosActivos, ...filtros };
        set({ filtrosActivos: nuevosFiltros });
        get().cargarHistorial(nuevosFiltros);
      },

      limpiarFiltros: () => {
        set({ filtrosActivos: {} });
        get().cargarHistorial({});
      },

      // ==================== VISTA ====================

      setVista: (vista: 'carga' | 'historial' | 'busqueda') => {
        set({ vistaActual: vista });

        if (vista === 'historial') {
          get().cargarHistorial();
        }
      },

      setGuiaSeleccionada: (guiaId: string | null) => {
        set({ guiaSeleccionadaId: guiaId });
      },

      // ==================== UTILIDADES ====================

      guardarCambios: () => {
        const { cargaActual, cargaActualId, batchConfig } = get();
        if (!cargaActual || !cargaActualId) return;

        try {
          cargaService.actualizarCarga(cargaActualId, {
            guias: cargaActual.guias,
          });

          set({
            ultimoGuardado: new Date(),
            syncStatus: {
              ...get().syncStatus,
              pendienteSync: batchConfig.autoSyncBackend,
            }
          });

          // Auto-sync si está habilitado
          if (batchConfig.autoSyncBackend) {
            get().sincronizarConBackend();
          }
        } catch (error) {
          set({ error: `Error al guardar: ${error}` });
        }
      },

      refrescar: () => {
        const { cargaActualId, vistaActual } = get();

        if (cargaActualId) {
          const carga = cargaService.getCarga(cargaActualId);
          set({ cargaActual: carga });
        }

        if (vistaActual === 'historial') {
          get().cargarHistorial();
        }
      },

      limpiarError: () => set({ error: null }),

      setBatchConfig: (config: Partial<BatchConfig>) => {
        set({ batchConfig: { ...get().batchConfig, ...config } });
      },

      // ==================== BATCH PROCESSING (NUEVO) ====================

      agregarGuiasEnLotes: async (guias: GuiaCarga[], onProgress?: (progress: CargaProgress) => void) => {
        const { cargaActualId, batchConfig } = get();
        if (!cargaActualId) {
          set({ error: 'No hay carga activa' });
          return;
        }

        const { tamanoLote, delayEntreGuias, delayEntreLotes, reintentosMax } = batchConfig;

        // Dividir en lotes
        const lotes: GuiaCarga[][] = [];
        for (let i = 0; i < guias.length; i += tamanoLote) {
          lotes.push(guias.slice(i, i + tamanoLote));
        }

        // Inicializar progreso
        const progressInicial: CargaProgress = {
          total: guias.length,
          procesados: 0,
          exitosos: 0,
          fallidos: 0,
          porcentaje: 0,
          batchActual: 0,
          totalBatches: lotes.length,
          errores: [],
          estado: 'procesando',
          tiempoInicio: new Date(),
        };
        set({ progress: progressInicial });
        onProgress?.(progressInicial);

        const errores: CargaError[] = [];
        let procesados = 0;
        let exitosos = 0;
        let fallidos = 0;

        // Procesar cada lote
        for (let batchIndex = 0; batchIndex < lotes.length; batchIndex++) {
          const lote = lotes[batchIndex];

          // Verificar si está pausado
          if (get().progress.estado === 'pausado') {
            set({ progress: { ...get().progress, estado: 'pausado' } });
            return;
          }

          // Actualizar batch actual
          set({ progress: { ...get().progress, batchActual: batchIndex + 1 } });

          // Procesar cada guía del lote
          for (const guia of lote) {
            // Verificar pausado
            if (get().progress.estado === 'pausado') return;

            try {
              // Intentar agregar guía
              const cargaActualizada = cargaService.agregarGuias(cargaActualId, [guia]);

              if (cargaActualizada) {
                exitosos++;
                set({ cargaActual: cargaActualizada });
              } else {
                throw new Error('No se pudo agregar la guía');
              }
            } catch (error) {
              fallidos++;
              errores.push({
                guiaId: guia.id,
                numeroGuia: guia.numeroGuia,
                mensaje: String(error),
                timestamp: new Date(),
                reintentos: 0,
                resuelta: false,
              });
            }

            procesados++;
            const porcentaje = Math.round((procesados / guias.length) * 100);

            // Actualizar progreso
            const nuevoProgress: CargaProgress = {
              total: guias.length,
              procesados,
              exitosos,
              fallidos,
              porcentaje,
              batchActual: batchIndex + 1,
              totalBatches: lotes.length,
              guiaActual: guia.numeroGuia,
              errores,
              estado: 'procesando',
              tiempoInicio: progressInicial.tiempoInicio,
            };
            set({ progress: nuevoProgress });
            onProgress?.(nuevoProgress);

            // Delay entre guías
            if (delayEntreGuias > 0) {
              await delay(delayEntreGuias);
            }
          }

          // Delay entre lotes
          if (batchIndex < lotes.length - 1 && delayEntreLotes > 0) {
            await delay(delayEntreLotes);
          }
        }

        // Finalizar
        const progressFinal: CargaProgress = {
          total: guias.length,
          procesados,
          exitosos,
          fallidos,
          porcentaje: 100,
          batchActual: lotes.length,
          totalBatches: lotes.length,
          errores,
          estado: fallidos > 0 ? 'error' : 'completado',
          tiempoInicio: progressInicial.tiempoInicio,
        };
        set({
          progress: progressFinal,
          ultimoGuardado: new Date(),
        });
        onProgress?.(progressFinal);

        // Guardar cambios y sync
        get().guardarCambios();
      },

      reintentarGuiasFallidas: async () => {
        const { progress, cargaActualId, batchConfig } = get();
        if (!cargaActualId || progress.errores.length === 0) return;

        const guiasFallidas = progress.errores
          .filter(e => !e.resuelta && e.reintentos < batchConfig.reintentosMax)
          .map(e => ({
            id: e.guiaId,
            numeroGuia: e.numeroGuia,
          } as GuiaCarga));

        if (guiasFallidas.length === 0) return;

        // Incrementar reintentos
        const nuevosErrores = progress.errores.map(e => ({
          ...e,
          reintentos: e.reintentos + 1,
        }));
        set({ progress: { ...progress, errores: nuevosErrores, estado: 'procesando' } });

        // Reintentar
        for (const guia of guiasFallidas) {
          try {
            const cargaActualizada = cargaService.agregarGuias(cargaActualId, [guia]);
            if (cargaActualizada) {
              // Marcar como resuelta
              const erroresActualizados = get().progress.errores.map(e =>
                e.guiaId === guia.id ? { ...e, resuelta: true } : e
              );
              set({
                cargaActual: cargaActualizada,
                progress: {
                  ...get().progress,
                  errores: erroresActualizados,
                  exitosos: get().progress.exitosos + 1,
                  fallidos: get().progress.fallidos - 1,
                },
              });
            }
          } catch {
            // Mantener error
          }
          await delay(batchConfig.delayEntreGuias);
        }

        set({ progress: { ...get().progress, estado: 'completado' } });
      },

      pausarProcesamiento: () => {
        set({ progress: { ...get().progress, estado: 'pausado' } });
      },

      reanudarProcesamiento: () => {
        set({ progress: { ...get().progress, estado: 'procesando' } });
      },

      resetProgress: () => {
        set({ progress: createInitialProgress() });
      },

      // ==================== BACKEND SYNC (NUEVO) ====================

      sincronizarConBackend: async () => {
        const { cargaActual, cargaActualId, syncStatus } = get();
        if (!cargaActual || !cargaActualId) return false;

        set({
          syncStatus: {
            ...syncStatus,
            pendienteSync: true,
            errorSync: null,
          }
        });

        try {
          // Intentar sincronizar con backend
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://litper-tracker-api.onrender.com';

          const response = await fetch(`${backendUrl}/api/cargas/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fecha: cargaActual.fecha,
              numero_carga: cargaActual.numeroCarga,
              nombre: cargaActual.nombre,
              usuario_id: cargaActual.usuarioId,
              usuario_nombre: cargaActual.usuarioNombre,
              total_guias: cargaActual.totalGuias,
              estado: cargaActual.estado,
            }),
          });

          if (response.ok) {
            const backendData = await response.json();

            // Ahora agregar las guías
            if (cargaActual.guias.length > 0) {
              await fetch(`${backendUrl}/api/cargas/${backendData.id}/guias`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ guias: cargaActual.guias }),
              });
            }

            set({
              syncStatus: {
                ultimaSync: new Date(),
                pendienteSync: false,
                errorSync: null,
                cargasPendientes: syncStatus.cargasPendientes.filter(id => id !== cargaActualId),
              },
            });
            return true;
          } else {
            throw new Error(`Error del servidor: ${response.status}`);
          }
        } catch (error) {
          console.warn('Sync con backend falló, guardando solo en localStorage:', error);
          set({
            syncStatus: {
              ...syncStatus,
              pendienteSync: false,
              errorSync: String(error),
              cargasPendientes: [...new Set([...syncStatus.cargasPendientes, cargaActualId])],
            },
          });
          return false;
        }
      },

      setSyncStatus: (status: Partial<SyncStatus>) => {
        set({ syncStatus: { ...get().syncStatus, ...status } });
      },
    }),
    {
      name: 'litper-carga-store',
      // ACTUALIZADO: Persistir carga completa incluyendo guías
      partialize: (state) => ({
        cargaActualId: state.cargaActualId,
        cargaActual: state.cargaActual, // NUEVO: Persistir guías
        filtrosActivos: state.filtrosActivos,
        vistaActual: state.vistaActual,
        batchConfig: state.batchConfig, // NUEVO: Persistir config
        syncStatus: state.syncStatus, // NUEVO: Persistir sync status
      }),
    }
  )
);

// Hook para inicializar al cargar la app
export function useInitCargaStore(usuarioId: string, usuarioNombre: string) {
  const { cargaActualId, cargarCarga, crearNuevaCarga } = useCargaStore();

  // Cargar carga guardada o crear nueva
  if (cargaActualId) {
    const cargaExistente = cargaService.getCarga(cargaActualId);
    if (cargaExistente) {
      cargarCarga(cargaActualId);
      return;
    }
  }

  // No hay carga, obtener o crear del día
  const carga = cargaService.getOCrearCargaHoy(usuarioId, usuarioNombre);
  cargarCarga(carga.id);
}

export default useCargaStore;
