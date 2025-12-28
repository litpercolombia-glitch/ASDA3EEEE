// components/carga/CargaProgressBar.tsx
// Componente de barra de progreso para carga de guías

import React from 'react';
import { CargaProgress } from '../../types/carga.types';
import { useCargaStore } from '../../stores/cargaStore';

interface CargaProgressBarProps {
  progress?: CargaProgress;
  showDetails?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onRetry?: () => void;
  onReset?: () => void;
}

export const CargaProgressBar: React.FC<CargaProgressBarProps> = ({
  progress: externalProgress,
  showDetails = true,
  onPause,
  onResume,
  onRetry,
  onReset,
}) => {
  const storeProgress = useCargaStore((state) => state.progress);
  const pausarProcesamiento = useCargaStore((state) => state.pausarProcesamiento);
  const reanudarProcesamiento = useCargaStore((state) => state.reanudarProcesamiento);
  const reintentarGuiasFallidas = useCargaStore((state) => state.reintentarGuiasFallidas);
  const resetProgress = useCargaStore((state) => state.resetProgress);

  const progress = externalProgress || storeProgress;

  // No mostrar si está idle y no hay datos
  if (progress.estado === 'idle' && progress.total === 0) {
    return null;
  }

  const getStatusColor = () => {
    switch (progress.estado) {
      case 'procesando':
        return 'bg-blue-500';
      case 'completado':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'pausado':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (progress.estado) {
      case 'procesando':
        return 'Procesando...';
      case 'completado':
        return 'Completado';
      case 'error':
        return `Completado con ${progress.fallidos} errores`;
      case 'pausado':
        return 'Pausado';
      default:
        return 'Esperando';
    }
  };

  const handlePause = () => {
    onPause ? onPause() : pausarProcesamiento();
  };

  const handleResume = () => {
    onResume ? onResume() : reanudarProcesamiento();
  };

  const handleRetry = () => {
    onRetry ? onRetry() : reintentarGuiasFallidas();
  };

  const handleReset = () => {
    onReset ? onReset() : resetProgress();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
      {/* Header con contador X/Y */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()} text-white`}>
            {getStatusText()}
          </span>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {progress.procesados}/{progress.total}
          </span>
          <span className="text-lg text-gray-500 dark:text-gray-400">
            {progress.porcentaje}%
          </span>
        </div>

        {/* Controles */}
        <div className="flex gap-2">
          {progress.estado === 'procesando' && (
            <button
              onClick={handlePause}
              className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 transition-colors"
            >
              Pausar
            </button>
          )}
          {progress.estado === 'pausado' && (
            <button
              onClick={handleResume}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
            >
              Reanudar
            </button>
          )}
          {progress.estado === 'error' && progress.errores.length > 0 && (
            <button
              onClick={handleRetry}
              className="px-3 py-1 text-sm bg-orange-100 text-orange-800 rounded-md hover:bg-orange-200 transition-colors"
            >
              Reintentar ({progress.errores.filter(e => !e.resuelta).length})
            </button>
          )}
          {(progress.estado === 'completado' || progress.estado === 'error') && (
            <button
              onClick={handleReset}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-3 overflow-hidden">
        <div
          className={`h-4 rounded-full transition-all duration-300 ${getStatusColor()}`}
          style={{ width: `${progress.porcentaje}%` }}
        >
          {progress.porcentaje > 10 && (
            <span className="flex items-center justify-center text-xs text-white font-medium h-full">
              {progress.porcentaje}%
            </span>
          )}
        </div>
      </div>

      {/* Detalles */}
      {showDetails && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-2 text-center">
            <div className="text-gray-500 dark:text-gray-400 text-xs">Lote</div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {progress.batchActual}/{progress.totalBatches}
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-md p-2 text-center">
            <div className="text-green-600 dark:text-green-400 text-xs">Exitosas</div>
            <div className="font-semibold text-green-700 dark:text-green-300">
              {progress.exitosos}
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-md p-2 text-center">
            <div className="text-red-600 dark:text-red-400 text-xs">Fallidas</div>
            <div className="font-semibold text-red-700 dark:text-red-300">
              {progress.fallidos}
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-2 text-center">
            <div className="text-blue-600 dark:text-blue-400 text-xs">Procesando</div>
            <div className="font-semibold text-blue-700 dark:text-blue-300 truncate">
              {progress.guiaActual || '-'}
            </div>
          </div>
        </div>
      )}

      {/* Lista de errores (si hay) */}
      {progress.errores.length > 0 && showDetails && (
        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-3">
          <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
            Errores ({progress.errores.filter(e => !e.resuelta).length} pendientes)
          </h4>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {progress.errores.slice(0, 10).map((error, index) => (
              <div
                key={`${error.guiaId}-${index}`}
                className={`text-xs p-2 rounded ${
                  error.resuelta
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 line-through'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                }`}
              >
                <span className="font-mono">{error.numeroGuia}</span>: {error.mensaje}
                {error.reintentos > 0 && (
                  <span className="ml-2 text-gray-500">
                    (Reintentos: {error.reintentos})
                  </span>
                )}
              </div>
            ))}
            {progress.errores.length > 10 && (
              <div className="text-xs text-gray-500 text-center">
                ... y {progress.errores.length - 10} más
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Versión compacta para header/status bar
export const CargaProgressCompact: React.FC<{ className?: string }> = ({ className = '' }) => {
  const progress = useCargaStore((state) => state.progress);

  if (progress.estado === 'idle' && progress.total === 0) {
    return null;
  }

  const getStatusIcon = () => {
    switch (progress.estado) {
      case 'procesando':
        return (
          <svg className="animate-spin h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        );
      case 'completado':
        return (
          <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'pausado':
        return (
          <svg className="h-4 w-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full ${className}`}>
      {getStatusIcon()}
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {progress.procesados}/{progress.total}
      </span>
      <span className="text-sm text-gray-500 dark:text-gray-400">
        {progress.porcentaje}%
      </span>
      {/* Mini barra de progreso */}
      <div className="w-16 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            progress.estado === 'completado' ? 'bg-green-500' :
            progress.estado === 'error' ? 'bg-red-500' :
            progress.estado === 'pausado' ? 'bg-yellow-500' : 'bg-blue-500'
          }`}
          style={{ width: `${progress.porcentaje}%` }}
        />
      </div>
    </div>
  );
};

export default CargaProgressBar;
