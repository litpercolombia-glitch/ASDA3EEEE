// components/carga/CargaProgressBar.tsx
// Barra de progreso profesional para carga de guías

import React, { useEffect, useState } from 'react';
import { CargaProgress } from '../../types/carga.types';
import { useCargaStore } from '../../stores/cargaStore';

interface CargaProgressBarProps {
  progress?: CargaProgress;
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
}

export const CargaProgressBar: React.FC<CargaProgressBarProps> = ({
  progress: externalProgress,
  showDetails = true,
  compact = false,
  className = '',
}) => {
  const storeProgress = useCargaStore((state) => state.progress);
  const pausarProcesamiento = useCargaStore((state) => state.pausarProcesamiento);
  const reanudarProcesamiento = useCargaStore((state) => state.reanudarProcesamiento);
  const reintentarGuiasFallidas = useCargaStore((state) => state.reintentarGuiasFallidas);
  const resetProgress = useCargaStore((state) => state.resetProgress);

  const progress = externalProgress || storeProgress;
  const [showErrors, setShowErrors] = useState(false);

  // No mostrar si está idle y no hay datos
  if (progress.estado === 'idle' && progress.total === 0) {
    return null;
  }

  const getStatusConfig = () => {
    switch (progress.estado) {
      case 'procesando':
        return {
          color: 'from-blue-500 to-indigo-600',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          textColor: 'text-blue-700 dark:text-blue-300',
          icon: '⚡',
          label: 'Procesando',
          pulse: true,
        };
      case 'completado':
        return {
          color: 'from-emerald-500 to-green-600',
          bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
          borderColor: 'border-emerald-200 dark:border-emerald-800',
          textColor: 'text-emerald-700 dark:text-emerald-300',
          icon: '✓',
          label: 'Completado',
          pulse: false,
        };
      case 'error':
        return {
          color: 'from-red-500 to-rose-600',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          textColor: 'text-red-700 dark:text-red-300',
          icon: '⚠',
          label: `${progress.fallidos} errores`,
          pulse: false,
        };
      case 'pausado':
        return {
          color: 'from-amber-500 to-yellow-600',
          bgColor: 'bg-amber-50 dark:bg-amber-900/20',
          borderColor: 'border-amber-200 dark:border-amber-800',
          textColor: 'text-amber-700 dark:text-amber-300',
          icon: '⏸',
          label: 'Pausado',
          pulse: false,
        };
      default:
        return {
          color: 'from-slate-400 to-slate-500',
          bgColor: 'bg-slate-50 dark:bg-slate-900/20',
          borderColor: 'border-slate-200 dark:border-slate-700',
          textColor: 'text-slate-600 dark:text-slate-400',
          icon: '○',
          label: 'Esperando',
          pulse: false,
        };
    }
  };

  const config = getStatusConfig();

  // Versión compacta para headers
  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgColor} ${config.borderColor} border ${className}`}>
        <span className={`text-sm ${config.pulse ? 'animate-pulse' : ''}`}>{config.icon}</span>
        <span className={`text-sm font-bold ${config.textColor}`}>
          {progress.procesados}/{progress.total}
        </span>
        <div className="w-20 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${config.color} transition-all duration-300 ease-out ${config.pulse ? 'animate-pulse' : ''}`}
            style={{ width: `${progress.porcentaje}%` }}
          />
        </div>
        <span className={`text-xs font-medium ${config.textColor}`}>{progress.porcentaje}%</span>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border ${config.borderColor} ${config.bgColor} overflow-hidden ${className}`}>
      {/* Header principal */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          {/* Status y contador */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center shadow-lg ${config.pulse ? 'animate-pulse' : ''}`}>
              <span className="text-white text-lg">{config.icon}</span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-800 dark:text-white">
                  {progress.procesados}
                </span>
                <span className="text-xl text-slate-400 dark:text-slate-500">/</span>
                <span className="text-xl font-semibold text-slate-600 dark:text-slate-400">
                  {progress.total}
                </span>
              </div>
              <p className={`text-sm font-medium ${config.textColor}`}>{config.label}</p>
            </div>
          </div>

          {/* Porcentaje grande */}
          <div className="text-right">
            <span className={`text-4xl font-black bg-gradient-to-r ${config.color} bg-clip-text text-transparent`}>
              {progress.porcentaje}%
            </span>
            {progress.guiaActual && progress.estado === 'procesando' && (
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-32">
                {progress.guiaActual}
              </p>
            )}
          </div>
        </div>

        {/* Barra de progreso principal */}
        <div className="relative h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
          <div
            className={`absolute inset-y-0 left-0 bg-gradient-to-r ${config.color} transition-all duration-500 ease-out rounded-full`}
            style={{ width: `${progress.porcentaje}%` }}
          >
            {/* Efecto de brillo animado */}
            {progress.estado === 'procesando' && (
              <div className="absolute inset-0 overflow-hidden rounded-full">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </div>
            )}
          </div>

          {/* Texto dentro de la barra */}
          {progress.porcentaje > 15 && (
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow">
              {progress.porcentaje}%
            </span>
          )}
        </div>

        {/* Controles */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            {progress.estado === 'procesando' && (
              <button
                onClick={pausarProcesamiento}
                className="px-3 py-1.5 text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors flex items-center gap-1"
              >
                <span>⏸</span> Pausar
              </button>
            )}
            {progress.estado === 'pausado' && (
              <button
                onClick={reanudarProcesamiento}
                className="px-3 py-1.5 text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1"
              >
                <span>▶</span> Reanudar
              </button>
            )}
            {progress.errores.length > 0 && (
              <button
                onClick={() => setShowErrors(!showErrors)}
                className="px-3 py-1.5 text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-1"
              >
                <span>⚠</span> {progress.errores.filter(e => !e.resuelta).length} errores
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {progress.estado === 'error' && progress.errores.some(e => !e.resuelta) && (
              <button
                onClick={reintentarGuiasFallidas}
                className="px-3 py-1.5 text-xs font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors flex items-center gap-1"
              >
                <span>🔄</span> Reintentar
              </button>
            )}
            {(progress.estado === 'completado' || progress.estado === 'error') && (
              <button
                onClick={resetProgress}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cerrar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Detalles expandibles */}
      {showDetails && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
          <div className="grid grid-cols-4 gap-2">
            <StatBox
              label="Lote"
              value={`${progress.batchActual}/${progress.totalBatches}`}
              color="slate"
            />
            <StatBox
              label="Exitosas"
              value={progress.exitosos.toString()}
              color="emerald"
            />
            <StatBox
              label="Fallidas"
              value={progress.fallidos.toString()}
              color="red"
            />
            <StatBox
              label="Pendientes"
              value={(progress.total - progress.procesados).toString()}
              color="blue"
            />
          </div>
        </div>
      )}

      {/* Lista de errores */}
      {showErrors && progress.errores.length > 0 && (
        <div className="px-4 pb-4 border-t border-slate-200/50 dark:border-slate-700/50">
          <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-1">
            <span>⚠</span> Errores ({progress.errores.filter(e => !e.resuelta).length} pendientes)
          </h4>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {progress.errores.map((error, index) => (
              <div
                key={`${error.guiaId}-${index}`}
                className={`text-xs p-2 rounded-lg flex items-center justify-between ${
                  error.resuelta
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{error.resuelta ? '✓' : '✗'}</span>
                  <span className="font-mono font-medium">{error.numeroGuia}</span>
                  <span className="text-slate-500 truncate max-w-48">{error.mensaje}</span>
                </div>
                {error.reintentos > 0 && (
                  <span className="text-slate-400 text-[10px]">
                    {error.reintentos}x
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estilos para la animación de brillo */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
};

// Componente auxiliar para las estadísticas
const StatBox: React.FC<{
  label: string;
  value: string;
  color: 'slate' | 'emerald' | 'red' | 'blue' | 'amber';
}> = ({ label, value, color }) => {
  const colors = {
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  };

  return (
    <div className={`rounded-lg p-2 text-center ${colors[color]}`}>
      <div className="text-[10px] font-medium opacity-75">{label}</div>
      <div className="text-sm font-bold">{value}</div>
    </div>
  );
};

// Versión flotante fija en la esquina
export const CargaProgressFloating: React.FC = () => {
  const progress = useCargaStore((state) => state.progress);

  if (progress.estado === 'idle' && progress.total === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 shadow-2xl rounded-xl">
      <CargaProgressBar showDetails={false} />
    </div>
  );
};

export default CargaProgressBar;
