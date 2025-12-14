// ============================================
// SELECTOR DE FUENTE DE DATOS + LÍNEA DE TIEMPO
// Permite elegir de dónde obtener la información
// ============================================

import React, { useState } from 'react';
import {
  Database,
  GitBranch,
  Clock,
  AlertTriangle,
  CheckCircle,
  Package,
  Truck,
  MapPin,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Eye,
  Layers,
  Activity,
  Calendar,
  Info,
  X,
  Zap,
} from 'lucide-react';
import {
  useDataSourceStore,
  DataSourceType,
  UnifiedTrackingRecord,
  TimelineEvent,
} from '../../services/dataSourceService';

// ============================================
// COMPONENTE: Selector de Fuente
// ============================================
export const DataSourceSelector: React.FC<{
  onSourceChange?: (source: DataSourceType) => void;
  compact?: boolean;
}> = ({ onSourceChange, compact = false }) => {
  const { config, setActiveSource, stats } = useDataSourceStore();
  const [isOpen, setIsOpen] = useState(false);

  const sources = [
    {
      id: 'seguimiento' as DataSourceType,
      icon: Package,
      label: 'Seguimiento Real',
      description: 'Datos actualizados en tiempo real',
      color: 'emerald',
      lastSync: stats.lastSyncSeguimiento,
    },
    {
      id: 'dropi' as DataSourceType,
      icon: Truck,
      label: 'Reporte Dropi',
      description: 'Datos del reporte de Dropi (puede estar retrasado)',
      color: 'blue',
      lastSync: stats.lastSyncDropi,
    },
    {
      id: 'combinado' as DataSourceType,
      icon: Layers,
      label: 'Combinado',
      description: 'Muestra ambas fuentes + diferencias',
      color: 'purple',
      badge: stats.withDiscrepancies > 0 ? `${stats.withDiscrepancies} diferencias` : undefined,
    },
    {
      id: 'timeline' as DataSourceType,
      icon: GitBranch,
      label: 'Línea de Tiempo',
      description: 'Historial completo de cada guía',
      color: 'amber',
    },
  ];

  const activeSourceInfo = sources.find((s) => s.id === config.activeSource);

  const handleSelect = (source: DataSourceType) => {
    setActiveSource(source);
    onSourceChange?.(source);
    setIsOpen(false);
  };

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl hover:border-slate-300 dark:hover:border-navy-600 transition-all"
        >
          {activeSourceInfo && <activeSourceInfo.icon className="w-4 h-4 text-slate-500" />}
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {activeSourceInfo?.label}
          </span>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl shadow-xl z-50 overflow-hidden">
              {sources.map((source) => (
                <button
                  key={source.id}
                  onClick={() => handleSelect(source.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors ${
                    config.activeSource === source.id ? 'bg-slate-50 dark:bg-navy-700' : ''
                  }`}
                >
                  <source.icon className={`w-5 h-5 text-${source.color}-500`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700 dark:text-white">{source.label}</p>
                    <p className="text-xs text-slate-400">{source.description}</p>
                  </div>
                  {config.activeSource === source.id && (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-500" />
          Fuente de Datos
        </h3>
        {stats.withDiscrepancies > 0 && (
          <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-bold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {stats.withDiscrepancies} diferencias detectadas
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {sources.map((source) => (
          <button
            key={source.id}
            onClick={() => handleSelect(source.id)}
            className={`relative p-4 rounded-xl border-2 text-left transition-all ${
              config.activeSource === source.id
                ? `border-${source.color}-500 bg-${source.color}-50 dark:bg-${source.color}-900/20`
                : 'border-slate-200 dark:border-navy-700 hover:border-slate-300 dark:hover:border-navy-600'
            }`}
          >
            {config.activeSource === source.id && (
              <div className={`absolute top-2 right-2 w-2 h-2 rounded-full bg-${source.color}-500 animate-pulse`} />
            )}

            <source.icon className={`w-6 h-6 mb-2 ${
              config.activeSource === source.id ? `text-${source.color}-500` : 'text-slate-400'
            }`} />

            <p className={`font-bold text-sm ${
              config.activeSource === source.id ? 'text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-300'
            }`}>
              {source.label}
            </p>

            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              {source.description}
            </p>

            {source.lastSync && (
              <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(source.lastSync).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}

            {source.badge && (
              <span className="mt-2 inline-block px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded text-[10px] font-bold">
                {source.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Estadísticas rápidas */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-navy-700 grid grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.totalRecords}</p>
          <p className="text-xs text-slate-400">Total Registros</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-emerald-600">{stats.totalRecords - stats.onlyInDropi}</p>
          <p className="text-xs text-slate-400">En Seguimiento</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.totalRecords - stats.onlyInSeguimiento}</p>
          <p className="text-xs text-slate-400">En Dropi</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-amber-600">{stats.withDiscrepancies}</p>
          <p className="text-xs text-slate-400">Diferencias</p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE: Línea de Tiempo de una Guía
// ============================================
export const GuiaTimeline: React.FC<{
  guia: string;
  onClose?: () => void;
}> = ({ guia, onClose }) => {
  const { getRecordByGuia, getTimelineForGuia } = useDataSourceStore();
  const record = getRecordByGuia(guia);
  const timeline = getTimelineForGuia(guia);

  if (!record) {
    return (
      <div className="p-8 text-center">
        <Package className="w-12 h-12 mx-auto text-slate-300 mb-4" />
        <p className="text-slate-500">No se encontró información para la guía {guia}</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const normalized = status.toUpperCase();
    if (normalized.includes('ENTREG') || normalized.includes('DELIVER')) return 'emerald';
    if (normalized.includes('TRANSIT') || normalized.includes('RUTA') || normalized.includes('CAMINO')) return 'blue';
    if (normalized.includes('DEVOL') || normalized.includes('RETURN')) return 'red';
    if (normalized.includes('NOVED') || normalized.includes('EXCEP')) return 'amber';
    return 'slate';
  };

  return (
    <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-indigo-100 text-sm">Línea de Tiempo</p>
            <h3 className="text-2xl font-bold">Guía: {guia}</h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Info del cliente */}
        {(record.cliente || record.ciudad) && (
          <div className="mt-4 flex flex-wrap gap-3">
            {record.cliente && (
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                {record.cliente}
              </span>
            )}
            {record.ciudad && (
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {record.ciudad}
              </span>
            )}
            {record.carrier && (
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm flex items-center gap-1">
                <Truck className="w-3 h-3" />
                {record.carrier}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Alerta de discrepancia */}
      {record.hasDiscrepancy && (
        <div className="mx-6 mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-700 dark:text-amber-400">Diferencia Detectada</p>
              <p className="text-sm text-amber-600 dark:text-amber-300">{record.discrepancyDetails}</p>
            </div>
          </div>
        </div>
      )}

      {/* Comparación de estados actuales */}
      <div className="p-6 grid grid-cols-2 gap-4">
        <div className={`p-4 rounded-xl border-2 ${
          record.seguimientoStatus ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20' : 'border-slate-200 bg-slate-50 dark:border-navy-700 dark:bg-navy-800'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold text-slate-500 uppercase">Seguimiento Real</span>
          </div>
          {record.seguimientoStatus ? (
            <>
              <p className={`text-lg font-bold text-${getStatusColor(record.seguimientoStatus)}-600`}>
                {record.seguimientoStatus}
              </p>
              {record.seguimientoDate && (
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(record.seguimientoDate).toLocaleString('es-CO')}
                </p>
              )}
            </>
          ) : (
            <p className="text-slate-400 text-sm">Sin datos</p>
          )}
        </div>

        <div className={`p-4 rounded-xl border-2 ${
          record.dropiStatus ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20' : 'border-slate-200 bg-slate-50 dark:border-navy-700 dark:bg-navy-800'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Truck className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-bold text-slate-500 uppercase">Reporte Dropi</span>
          </div>
          {record.dropiStatus ? (
            <>
              <p className={`text-lg font-bold text-${getStatusColor(record.dropiStatus)}-600`}>
                {record.dropiStatus}
              </p>
              {record.dropiDate && (
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(record.dropiDate).toLocaleString('es-CO')}
                </p>
              )}
            </>
          ) : (
            <p className="text-slate-400 text-sm">Sin datos</p>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="px-6 pb-6">
        <h4 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Historial de Eventos
        </h4>

        <div className="relative">
          {/* Línea vertical */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-navy-700" />

          <div className="space-y-4">
            {timeline.length === 0 ? (
              <p className="text-slate-400 text-sm ml-10">No hay eventos registrados</p>
            ) : (
              timeline.map((event, idx) => (
                <div key={event.id} className="relative flex items-start gap-4">
                  {/* Punto en la línea */}
                  <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                    event.source === 'seguimiento'
                      ? 'bg-emerald-100 dark:bg-emerald-900/30'
                      : 'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    {event.source === 'seguimiento' ? (
                      <Package className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Truck className="w-4 h-4 text-blue-500" />
                    )}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        event.source === 'seguimiento'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {event.source === 'seguimiento' ? 'Seguimiento' : 'Dropi'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(event.timestamp).toLocaleString('es-CO')}
                      </span>
                    </div>

                    <p className={`mt-1 font-bold text-${getStatusColor(event.status)}-600`}>
                      {event.status}
                    </p>

                    {event.details && (
                      <p className="text-sm text-slate-500 mt-1">{event.details}</p>
                    )}

                    {event.location && (
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE: Panel de Discrepancias
// ============================================
export const DiscrepanciesPanel: React.FC<{
  onSelectGuia?: (guia: string) => void;
}> = ({ onSelectGuia }) => {
  const { getDiscrepancies } = useDataSourceStore();
  const discrepancies = getDiscrepancies();

  if (discrepancies.length === 0) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-6 text-center">
        <CheckCircle className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
        <h3 className="font-bold text-emerald-700 dark:text-emerald-400">Sin Discrepancias</h3>
        <p className="text-sm text-emerald-600 dark:text-emerald-300">
          Todas las fuentes de datos están sincronizadas
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 overflow-hidden">
      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
        <h3 className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {discrepancies.length} Discrepancias Detectadas
        </h3>
        <p className="text-sm text-amber-600 dark:text-amber-300 mt-1">
          Estas guías tienen información diferente entre Seguimiento Real y Dropi
        </p>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-navy-700 max-h-96 overflow-y-auto">
        {discrepancies.map((record) => (
          <button
            key={record.guia}
            onClick={() => onSelectGuia?.(record.guia)}
            className="w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-navy-800 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800 dark:text-white">{record.guia}</p>
                <p className="text-xs text-slate-500">{record.cliente || 'Sin cliente'}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            <div className="mt-2 flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                record.discrepancyType === 'status_mismatch'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : record.discrepancyType === 'date_delay'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>
                {record.discrepancyType === 'status_mismatch' ? 'Estados diferentes' :
                 record.discrepancyType === 'date_delay' ? 'Retraso en actualización' :
                 'Falta en una fuente'}
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-2">{record.discrepancyDetails}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DataSourceSelector;
