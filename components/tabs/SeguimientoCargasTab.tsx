import React, { useState, useCallback } from 'react';
import {
  Package,
  Upload,
  RefreshCw,
  Save,
  AlertCircle,
  CheckCircle,
  FolderOpen,
  HelpCircle,
  FileSpreadsheet,
  Loader2,
  CloudOff,
  Cloud,
} from 'lucide-react';
import { Shipment } from '../../types';
import { CargasTrackingView } from '../CargasTrackingView';
import { useCargasTracking } from '../../hooks/useCargasTracking';
import { HelpTooltip } from '../HelpSystem/HelpTooltip';
import { CargaProgressBar } from '../carga/CargaProgressBar';
import { CargaSheetsManager } from '../CargaSheetsManager';
import { useCargaStore } from '../../stores/cargaStore';
import { GuiaCarga } from '../../types/carga.types';

interface SeguimientoCargasTabProps {
  shipments: Shipment[];
  onRestoreShipments?: (shipments: Shipment[]) => void;
}

/**
 * Tab de Seguimiento por Cargas
 * Organiza todas las guías por fecha/hora de carga
 * Permite eliminar cargas completas o guías individuales
 * Muestra últimos 2 estados en vista comprimida y timeline completo en expandida
 *
 * INTEGRADO CON:
 * - CargaProgressBar: Barra de progreso profesional
 * - CargaSheetsManager: Gestor de hojas/tabs
 * - useCargaStore: Procesamiento en lotes con persistencia
 */
export const SeguimientoCargasTab: React.FC<SeguimientoCargasTabProps> = ({
  shipments,
  onRestoreShipments,
}) => {
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [viendoTodas, setViendoTodas] = useState(true);

  // Hook antiguo para compatibilidad con CargasTrackingView
  const {
    hojas,
    hojaActiva,
    isLoading: isLoadingHojas,
    isSaving,
    isSyncing,
    error,
    guardarNuevaCarga,
    eliminarCarga,
    eliminarGuia,
    restaurarCarga,
    sincronizar,
    clearError,
  } = useCargasTracking();

  // Store nuevo con batch processing
  const {
    cargaActualId,
    progress,
    syncStatus,
    agregarGuiasEnLotes,
    sincronizarConBackend,
    cargarCarga,
    crearNuevaCarga,
    resetProgress,
  } = useCargaStore();

  // Convertir shipments a GuiaCarga para procesamiento en lotes
  const convertirAGuiaCarga = useCallback((shipment: Shipment): GuiaCarga => {
    const detailedInfo = shipment.detailedInfo;
    return {
      id: shipment.id || `guia_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      numeroGuia: shipment.id || '',
      estado: shipment.status || 'Desconocido',
      transportadora: shipment.carrier || 'No especificada',
      ciudadDestino: detailedInfo?.destination || '',
      telefono: shipment.phone,
      nombreCliente: undefined,
      direccion: undefined,
      diasTransito: detailedInfo?.daysInTransit || 0,
      tieneNovedad: shipment.status === 'Novedad' || detailedInfo?.hasErrors || false,
      tipoNovedad: detailedInfo?.hasErrors ? 'Error' : undefined,
      descripcionNovedad: detailedInfo?.errorDetails?.join(', '),
      valorDeclarado: detailedInfo?.declaredValue,
      ultimoMovimiento: detailedInfo?.rawStatus,
      fuente: 'EXCEL',
      revisada: false,
    };
  }, []);

  /**
   * Guardar carga actual como nueva hoja CON procesamiento en lotes
   */
  const handleGuardarCargaEnLotes = useCallback(async () => {
    if (shipments.length === 0) {
      setSaveError('No hay guías cargadas para guardar');
      return;
    }

    clearError();
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Crear carga si no existe
      if (!cargaActualId) {
        crearNuevaCarga('usuario_actual', 'Usuario');
      }

      // Convertir y procesar en lotes
      const guias = shipments.map(convertirAGuiaCarga);
      await agregarGuiasEnLotes(guias);

      // También guardar con el hook antiguo para compatibilidad
      const nuevaHoja = await guardarNuevaCarga(shipments);

      if (nuevaHoja) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      setSaveError(`Error al guardar: ${err}`);
    }
  }, [shipments, cargaActualId, convertirAGuiaCarga, agregarGuiasEnLotes, guardarNuevaCarga, crearNuevaCarga, clearError]);

  /**
   * Guardar sin lotes (método rápido para pocas guías)
   */
  const handleGuardarRapido = useCallback(async () => {
    if (shipments.length === 0) {
      setSaveError('No hay guías cargadas para guardar');
      return;
    }

    clearError();
    setSaveError(null);
    setSaveSuccess(false);

    const nuevaHoja = await guardarNuevaCarga(shipments);

    if (nuevaHoja) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setSaveError('Error al guardar la carga');
    }
  }, [shipments, guardarNuevaCarga, clearError]);

  /**
   * Determinar qué método usar según cantidad
   */
  const handleGuardarCarga = useCallback(async () => {
    // Usar lotes solo si hay más de 20 guías
    if (shipments.length > 20) {
      await handleGuardarCargaEnLotes();
    } else {
      await handleGuardarRapido();
    }
  }, [shipments.length, handleGuardarCargaEnLotes, handleGuardarRapido]);

  /**
   * Eliminar una carga completa
   */
  const handleEliminarCarga = useCallback(
    async (hojaId: string) => {
      await eliminarCarga(hojaId);
    },
    [eliminarCarga]
  );

  /**
   * Eliminar una guía individual
   */
  const handleEliminarGuia = useCallback(
    async (hojaId: string, guiaId: string) => {
      await eliminarGuia(hojaId, guiaId);
    },
    [eliminarGuia]
  );

  /**
   * Restaurar una carga
   */
  const handleRestaurarCarga = useCallback(
    async (hojaId: string) => {
      const hoja = hojas.find((h) => h.id === hojaId);
      if (hoja && onRestoreShipments) {
        onRestoreShipments(hoja.guias);
        await restaurarCarga(hojaId);
      }
    },
    [hojas, onRestoreShipments, restaurarCarga]
  );

  /**
   * Sincronizar con servidor (ambos sistemas)
   */
  const handleSincronizar = useCallback(async () => {
    await sincronizar();
    await sincronizarConBackend();
  }, [sincronizar, sincronizarConBackend]);

  /**
   * Cambiar a una hoja específica
   */
  const handleCargaChange = useCallback((cargaId: string) => {
    cargarCarga(cargaId);
    setViendoTodas(false);
  }, [cargarCarga]);

  /**
   * Ver todas las hojas
   */
  const handleVerTodas = useCallback(() => {
    setViendoTodas(true);
  }, []);

  // Calcular estadísticas totales
  const totalGuias = hojas.reduce((sum, h) => sum + h.cantidadGuias, 0);
  const totalCargas = hojas.length;

  // Determinar si hay procesamiento activo
  const procesandoActivo = progress.estado === 'procesando' || progress.estado === 'pausado';

  return (
    <div className="space-y-6">
      {/* Barra de progreso (visible durante procesamiento) */}
      {(procesandoActivo || (progress.estado !== 'idle' && progress.total > 0)) && (
        <CargaProgressBar
          showDetails={true}
          className="shadow-lg"
        />
      )}

      {/* Header con controles */}
      <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Título y descripción */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                Seguimiento por Cargas
                <HelpTooltip
                  title="Sistema de Cargas"
                  content="Organiza tus guías por fecha/hora de carga. Cada archivo Excel crea una 'hoja' independiente."
                  tips={[
                    'Las hojas se ordenan por fecha (más reciente arriba)',
                    'Puedes eliminar cargas completas o guías individuales',
                    'Ver los últimos 2 estados de cada guía sin expandir',
                    'Expandir para ver el historial completo de movimientos',
                    'Procesamiento en lotes para cargas grandes (25 guías/lote)',
                  ]}
                  position="bottom"
                >
                  <HelpCircle className="w-4 h-4 text-slate-400 hover:text-indigo-500 cursor-help" />
                </HelpTooltip>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-2">
                {totalCargas} cargas • {totalGuias.toLocaleString()} guías totales
                {/* Indicador de sync */}
                {syncStatus.ultimaSync && (
                  <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <Cloud className="w-3 h-3" />
                    Sincronizado
                  </span>
                )}
                {syncStatus.errorSync && (
                  <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                    <CloudOff className="w-3 h-3" />
                    Solo local
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Controles */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Mensaje de éxito/error */}
            {saveSuccess && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm animate-in fade-in duration-300">
                <CheckCircle className="w-4 h-4" />
                Carga guardada
              </div>
            )}
            {(saveError || error) && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4" />
                {saveError || error}
              </div>
            )}

            {/* Botón Guardar Nueva Carga */}
            {shipments.length > 0 && !procesandoActivo && (
              <button
                onClick={handleGuardarCarga}
                disabled={isSaving}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  isSaving
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-lg hover:shadow-xl'
                }`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar Carga Actual
                    <span className="px-1.5 py-0.5 bg-white/20 rounded text-xs">
                      {shipments.length}
                    </span>
                  </>
                )}
              </button>
            )}

            {/* Botón Sincronizar */}
            <button
              onClick={handleSincronizar}
              disabled={isSyncing}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isSyncing
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
              }`}
              title="Sincronizar con servidor"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
            </button>
          </div>
        </div>

        {/* Info de carga actual */}
        {shipments.length > 0 && !procesandoActivo && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm">
              <Upload className="w-4 h-4" />
              <span>
                <strong>{shipments.length} guías</strong> cargadas en memoria. Haz clic en "Guardar
                Carga Actual" para crear una nueva hoja de seguimiento.
                {shipments.length > 20 && (
                  <span className="ml-1 text-xs opacity-75">
                    (Se procesarán en lotes de 25)
                  </span>
                )}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Gestor de Hojas (tabs) */}
      {hojas.length > 0 && (
        <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-4">
          <CargaSheetsManager
            cargaActualId={cargaActualId}
            onCargaChange={handleCargaChange}
            onVerTodas={handleVerTodas}
            viendoTodas={viendoTodas}
          />
        </div>
      )}

      {/* Vista de Cargas */}
      {isLoadingHojas && hojas.length === 0 ? (
        <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-12 text-center">
          <Loader2 className="w-10 h-10 text-indigo-500 mx-auto mb-4 animate-spin" />
          <p className="text-slate-500 dark:text-slate-400">Cargando hojas de seguimiento...</p>
        </div>
      ) : (
        <CargasTrackingView
          hojas={viendoTodas ? hojas : hojas.filter(h => h.id === cargaActualId)}
          onDeleteHoja={handleEliminarCarga}
          onDeleteGuia={handleEliminarGuia}
          onRestoreHoja={
            onRestoreShipments
              ? (hoja) => {
                  onRestoreShipments(hoja.guias);
                }
              : undefined
          }
        />
      )}

      {/* Mensaje cuando no hay cargas ni guías */}
      {hojas.length === 0 && shipments.length === 0 && !isLoadingHojas && (
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileSpreadsheet className="w-10 h-10 text-indigo-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
            Sin cargas registradas
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
            Carga un archivo Excel con tus guías de seguimiento. Cada carga se guardará como una
            "hoja" independiente organizada por fecha y hora.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-navy-800 rounded-lg">
              <Package className="w-4 h-4 text-emerald-500" />
              <span>Organización automática por fecha</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-navy-800 rounded-lg">
              <FileSpreadsheet className="w-4 h-4 text-blue-500" />
              <span>Historial de movimientos completo</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-navy-800 rounded-lg">
              <RefreshCw className="w-4 h-4 text-purple-500" />
              <span>Sincronización automática</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeguimientoCargasTab;
