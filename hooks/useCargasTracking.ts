import { useState, useEffect, useCallback } from 'react';
import { Shipment } from '../types';
import {
  HojaCarga,
  obtenerTodasLasHojas,
  guardarNuevaHoja,
  eliminarHoja,
  eliminarGuiaDeHoja,
  restaurarHoja,
  sincronizarHojas,
} from '../services/globalStorageService';

interface UseCargasTrackingResult {
  // State
  hojas: HojaCarga[];
  hojaActiva: string | null;
  isLoading: boolean;
  isSaving: boolean;
  isSyncing: boolean;
  error: string | null;

  // Actions
  cargarHojas: () => Promise<void>;
  guardarNuevaCarga: (guias: Shipment[], nombre?: string) => Promise<HojaCarga | null>;
  eliminarCarga: (hojaId: string) => Promise<boolean>;
  eliminarGuia: (hojaId: string, guiaId: string) => Promise<void>;
  restaurarCarga: (hojaId: string) => Promise<HojaCarga | null>;
  sincronizar: () => Promise<boolean>;
  setHojaActiva: (hojaId: string | null) => void;
  clearError: () => void;
}

/**
 * Hook para gestionar el sistema de cargas/hojas de seguimiento
 * Proporciona funcionalidad CRUD completa con persistencia global
 */
export function useCargasTracking(): UseCargasTrackingResult {
  const [hojas, setHojas] = useState<HojaCarga[]>([]);
  const [hojaActiva, setHojaActiva] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar hojas al montar
  useEffect(() => {
    cargarHojas();
  }, []);

  /**
   * Cargar todas las hojas del almacenamiento global
   */
  const cargarHojas = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const todasLasHojas = await obtenerTodasLasHojas();
      // Ordenar por fecha descendente
      const hojasOrdenadas = todasLasHojas.sort(
        (a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
      );
      setHojas(hojasOrdenadas);

      // Si hay hojas y ninguna está activa, activar la primera
      if (hojasOrdenadas.length > 0 && !hojaActiva) {
        const activa = hojasOrdenadas.find((h) => h.activo);
        if (activa) {
          setHojaActiva(activa.id);
        }
      }
    } catch (err) {
      console.error('Error cargando hojas:', err);
      setError('Error al cargar las hojas de seguimiento');
    } finally {
      setIsLoading(false);
    }
  }, [hojaActiva]);

  /**
   * Guardar una nueva carga de guías como hoja
   */
  const guardarNuevaCarga = useCallback(
    async (guias: Shipment[], nombre?: string): Promise<HojaCarga | null> => {
      if (guias.length === 0) {
        setError('No hay guías para guardar');
        return null;
      }

      setIsSaving(true);
      setError(null);
      try {
        const nuevaHoja = await guardarNuevaHoja(guias, nombre);

        // Actualizar estado local
        setHojas((prev) => {
          const nuevas = [nuevaHoja, ...prev];
          // Mantener máximo 50 hojas
          return nuevas.slice(0, 50);
        });

        setHojaActiva(nuevaHoja.id);

        return nuevaHoja;
      } catch (err) {
        console.error('Error guardando nueva carga:', err);
        setError('Error al guardar la carga');
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  /**
   * Eliminar una carga completa
   */
  const eliminarCarga = useCallback(
    async (hojaId: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        await eliminarHoja(hojaId);

        // Actualizar estado local
        setHojas((prev) => prev.filter((h) => h.id !== hojaId));

        // Si era la hoja activa, desactivar
        if (hojaActiva === hojaId) {
          setHojaActiva(null);
        }

        return true;
      } catch (err) {
        console.error('Error eliminando carga:', err);
        setError('Error al eliminar la carga');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [hojaActiva]
  );

  /**
   * Eliminar una guía individual de una hoja
   */
  const eliminarGuia = useCallback(
    async (hojaId: string, guiaId: string): Promise<void> => {
      setError(null);
      try {
        const hojaActualizada = await eliminarGuiaDeHoja(hojaId, guiaId);

        if (hojaActualizada === null) {
          // La hoja fue eliminada porque no quedaban guías
          setHojas((prev) => prev.filter((h) => h.id !== hojaId));
          if (hojaActiva === hojaId) {
            setHojaActiva(null);
          }
        } else {
          // Actualizar la hoja en el estado
          setHojas((prev) => prev.map((h) => (h.id === hojaId ? hojaActualizada : h)));
        }
      } catch (err) {
        console.error('Error eliminando guía:', err);
        setError('Error al eliminar la guía');
      }
    },
    [hojaActiva]
  );

  /**
   * Restaurar una hoja (hacerla activa)
   */
  const restaurarCarga = useCallback(async (hojaId: string): Promise<HojaCarga | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const hoja = await restaurarHoja(hojaId);

      if (hoja) {
        // Actualizar estado local - marcar como activa
        setHojas((prev) =>
          prev.map((h) => ({
            ...h,
            activo: h.id === hojaId,
          }))
        );
        setHojaActiva(hojaId);
      }

      return hoja;
    } catch (err) {
      console.error('Error restaurando carga:', err);
      setError('Error al restaurar la carga');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Sincronizar hojas con el servidor
   */
  const sincronizar = useCallback(async (): Promise<boolean> => {
    setIsSyncing(true);
    setError(null);
    try {
      const resultado = await sincronizarHojas();

      if (resultado.sincronizado) {
        await cargarHojas();
      }

      return resultado.sincronizado;
    } catch (err) {
      console.error('Error sincronizando:', err);
      setError('Error al sincronizar');
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [cargarHojas]);

  /**
   * Limpiar error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    hojas,
    hojaActiva,
    isLoading,
    isSaving,
    isSyncing,
    error,

    // Actions
    cargarHojas,
    guardarNuevaCarga,
    eliminarCarga,
    eliminarGuia,
    restaurarCarga,
    sincronizar,
    setHojaActiva,
    clearError,
  };
}

export default useCargasTracking;
