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
}

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
        const { cargaActual, cargaActualId } = get();
        if (!cargaActual || !cargaActualId) return;

        try {
          cargaService.actualizarCarga(cargaActualId, {
            guias: cargaActual.guias,
          });

          set({ ultimoGuardado: new Date() });
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
    }),
    {
      name: 'litper-carga-store',
      partialize: (state) => ({
        cargaActualId: state.cargaActualId,
        filtrosActivos: state.filtrosActivos,
        vistaActual: state.vistaActual,
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
