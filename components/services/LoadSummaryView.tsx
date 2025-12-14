import React, { useState } from 'react';
import {
  CheckCircle,
  Package,
  AlertTriangle,
  Phone,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
  Brain,
  Layers,
  BarChart3,
  Clock,
  MapPin,
  Truck,
} from 'lucide-react';
import {
  Shipment,
  ErrorTrackingEntry,
  ShipmentStatus,
  ShipmentRiskLevel,
  CarrierName,
} from '../../types';
import ErrorTrackingTable from './ErrorTrackingTable';
import DynamicClassificationButtons from './DynamicClassificationButtons';
import AIDelayPatternAnalysis from './AIDelayPatternAnalysis';

interface LoadSummaryViewProps {
  shipments: Shipment[];
  errors: ErrorTrackingEntry[];
  batchId: string;
  batchDate: string;
  onGuideClick?: (shipment: Shipment) => void;
  onRetryError?: (error: ErrorTrackingEntry) => void;
  onMarkErrorResolved?: (errorId: string, note?: string) => void;
  onViewHistory?: () => void;
}

const LoadSummaryView: React.FC<LoadSummaryViewProps> = ({
  shipments,
  errors,
  batchId,
  batchDate,
  onGuideClick,
  onRetryError,
  onMarkErrorResolved,
  onViewHistory,
}) => {
  const [activeSection, setActiveSection] = useState<
    'summary' | 'classification' | 'errors' | 'ai'
  >('summary');
  const [expandedStats, setExpandedStats] = useState(true);

  // Calculate statistics
  const stats = {
    total: shipments.length,
    delivered: shipments.filter((s) => s.status === ShipmentStatus.DELIVERED).length,
    inTransit: shipments.filter((s) => s.status === ShipmentStatus.IN_TRANSIT).length,
    pending: shipments.filter((s) => s.status === ShipmentStatus.PENDING).length,
    inOffice: shipments.filter((s) => s.status === ShipmentStatus.IN_OFFICE).length,
    issues: shipments.filter((s) => s.status === ShipmentStatus.ISSUE).length,
    urgent: shipments.filter((s) => s.riskAnalysis?.level === ShipmentRiskLevel.URGENT).length,
    attention: shipments.filter((s) => s.riskAnalysis?.level === ShipmentRiskLevel.ATTENTION)
      .length,
    withPhone: shipments.filter((s) => s.phone).length,
    errorsCount: errors.filter((e) => !e.resolved).length,
  };

  const successRate =
    stats.total > 0 ? Math.round(((stats.total - stats.errorsCount) / stats.total) * 100) : 100;

  // Group by carrier
  const byCarrier = Object.values(CarrierName).reduce(
    (acc, carrier) => {
      const count = shipments.filter((s) => s.carrier === carrier).length;
      if (count > 0) acc[carrier] = count;
      return acc;
    },
    {} as Record<string, number>
  );

  // Top destinations
  const byDestination: Record<string, number> = {};
  shipments.forEach((s) => {
    const dest = s.detailedInfo?.destination || 'Desconocido';
    byDestination[dest] = (byDestination[dest] || 0) + 1;
  });
  const topDestinations = Object.entries(byDestination)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 rounded-2xl">
              <CheckCircle className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Resumen de Carga Completada</h2>
              <p className="text-emerald-100 mt-1">{formatDate(batchDate)}</p>
              <p className="text-emerald-200 text-sm">ID: {batchId.substring(0, 20)}...</p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-5xl font-bold">{stats.total}</div>
            <div className="text-emerald-100">guías procesadas</div>
            <div
              className={`mt-2 px-3 py-1 rounded-full text-sm font-bold ${
                successRate >= 90
                  ? 'bg-white/20'
                  : successRate >= 70
                    ? 'bg-yellow-400/30'
                    : 'bg-red-400/30'
              }`}
            >
              {successRate}% éxito
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold">{stats.delivered}</div>
            <div className="text-emerald-100 text-sm">Entregadas</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold">{stats.inTransit}</div>
            <div className="text-emerald-100 text-sm">En tránsito</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold">{stats.inOffice}</div>
            <div className="text-emerald-100 text-sm">En oficina</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-yellow-300">{stats.issues}</div>
            <div className="text-emerald-100 text-sm">Novedades</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-red-300">{stats.errorsCount}</div>
            <div className="text-emerald-100 text-sm">Errores</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-xl">
        <button
          onClick={() => setActiveSection('summary')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
            activeSection === 'summary'
              ? 'bg-white dark:bg-gray-700 shadow-md text-emerald-600'
              : 'text-gray-500 hover:bg-white/50 dark:hover:bg-gray-700/50'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          Resumen
        </button>
        <button
          onClick={() => setActiveSection('classification')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
            activeSection === 'classification'
              ? 'bg-white dark:bg-gray-700 shadow-md text-indigo-600'
              : 'text-gray-500 hover:bg-white/50 dark:hover:bg-gray-700/50'
          }`}
        >
          <Layers className="w-5 h-5" />
          Clasificación
          <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-full text-xs">
            {stats.total}
          </span>
        </button>
        <button
          onClick={() => setActiveSection('errors')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
            activeSection === 'errors'
              ? 'bg-white dark:bg-gray-700 shadow-md text-red-600'
              : 'text-gray-500 hover:bg-white/50 dark:hover:bg-gray-700/50'
          }`}
        >
          <AlertTriangle className="w-5 h-5" />
          Errores
          {stats.errorsCount > 0 && (
            <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full text-xs font-bold">
              {stats.errorsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSection('ai')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
            activeSection === 'ai'
              ? 'bg-white dark:bg-gray-700 shadow-md text-purple-600'
              : 'text-gray-500 hover:bg-white/50 dark:hover:bg-gray-700/50'
          }`}
        >
          <Brain className="w-5 h-5" />
          Análisis IA
        </button>
      </div>

      {/* Content Sections */}
      {activeSection === 'summary' && (
        <div className="space-y-6">
          {/* Risk Summary */}
          {(stats.urgent > 0 || stats.attention > 0) && (
            <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl p-5 border border-red-200 dark:border-red-800">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Guías que Requieren Atención
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-red-500">
                  <div className="text-3xl font-bold text-red-600">{stats.urgent}</div>
                  <div className="text-sm text-gray-500">Urgentes</div>
                  <p className="text-xs text-gray-400 mt-1">Acción inmediata requerida</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-orange-500">
                  <div className="text-3xl font-bold text-orange-600">{stats.attention}</div>
                  <div className="text-sm text-gray-500">Atención</div>
                  <p className="text-xs text-gray-400 mt-1">Revisar próximas horas</p>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => setExpandedStats(!expandedStats)}
              className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <span className="font-bold text-gray-900 dark:text-white">
                  Estadísticas Detalladas
                </span>
              </div>
              {expandedStats ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>

            {expandedStats && (
              <div className="p-5 pt-0 space-y-6">
                {/* By Carrier */}
                <div>
                  <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Por Transportadora
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(byCarrier).map(([carrier, count]) => (
                      <div key={carrier} className="flex items-center gap-3">
                        <span className="text-sm text-gray-700 dark:text-gray-300 w-32 truncate">
                          {carrier}
                        </span>
                        <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full flex items-center justify-end pr-2"
                            style={{ width: `${(count / stats.total) * 100}%` }}
                          >
                            <span className="text-xs font-bold text-white">{count}</span>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-gray-500 w-12 text-right">
                          {Math.round((count / stats.total) * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Destinations */}
                {topDestinations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Top 5 Destinos
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {topDestinations.map(([city, count], index) => (
                        <div
                          key={city}
                          className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center"
                        >
                          <div className="text-xs text-gray-500 mb-1">#{index + 1}</div>
                          <div className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                            {city}
                          </div>
                          <div className="text-lg font-bold text-blue-600">{count}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Phone Coverage */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Cobertura de Teléfonos
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-green-600">{stats.withPhone}</span>
                      <span className="text-gray-500">
                        / {stats.total} (
                        {stats.total > 0 ? Math.round((stats.withPhone / stats.total) * 100) : 0}
                        %)
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{
                        width: `${stats.total > 0 ? (stats.withPhone / stats.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* View History Button */}
          {onViewHistory && (
            <button
              onClick={onViewHistory}
              className="w-full flex items-center justify-center gap-2 p-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors text-gray-700 dark:text-gray-300 font-medium"
            >
              <Layers className="w-5 h-5" />
              Ver Historial Completo de Cargas
            </button>
          )}
        </div>
      )}

      {activeSection === 'classification' && (
        <DynamicClassificationButtons
          shipments={shipments}
          onGuideClick={onGuideClick}
          title="Guías Cargadas - Clasificación Dinámica"
          showAllButton={true}
        />
      )}

      {activeSection === 'errors' && (
        <>
          {stats.errorsCount > 0 ? (
            <ErrorTrackingTable
              errors={errors}
              onRetryGuide={onRetryError}
              onMarkResolved={onMarkErrorResolved}
              title="Guías con Errores en esta Carga"
              showBatchInfo={false}
            />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sin Errores</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Todas las guías se procesaron correctamente en esta carga
              </p>
            </div>
          )}
        </>
      )}

      {activeSection === 'ai' && (
        <AIDelayPatternAnalysis
          shipments={shipments}
          onGuideClick={(guideNumber) => {
            const shipment = shipments.find((s) => s.id === guideNumber);
            if (shipment) onGuideClick?.(shipment);
          }}
        />
      )}
    </div>
  );
};

export default LoadSummaryView;
