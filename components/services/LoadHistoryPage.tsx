import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Package,
  CheckCircle,
  AlertTriangle,
  Clock,
  ChevronRight,
  ChevronLeft,
  Layers,
  TrendingUp,
  TrendingDown,
  Eye,
  Download,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import {
  Shipment,
  LoadBatch,
  ShipmentStatus,
  ShipmentRiskLevel,
  CarrierName,
  ErrorTrackingEntry,
} from '../../types';
import ErrorTrackingTable from './ErrorTrackingTable';
import DynamicClassificationButtons from './DynamicClassificationButtons';

interface LoadHistoryPageProps {
  shipments: Shipment[];
  errors: ErrorTrackingEntry[];
  onDeleteBatch?: (batchId: string) => void;
  onGuideClick?: (shipment: Shipment) => void;
  onRetryError?: (error: ErrorTrackingEntry) => void;
  onMarkErrorResolved?: (errorId: string, note?: string) => void;
}

const LoadHistoryPage: React.FC<LoadHistoryPageProps> = ({
  shipments,
  errors,
  onDeleteBatch,
  onGuideClick,
  onRetryError,
  onMarkErrorResolved,
}) => {
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const BATCHES_PER_PAGE = 5;

  // Group shipments by batchId
  const batches = useMemo<LoadBatch[]>(() => {
    const batchMap = new Map<string, Shipment[]>();

    shipments.forEach((shipment) => {
      const batchId = shipment.batchId || shipment.dateKey || 'default';
      if (!batchMap.has(batchId)) {
        batchMap.set(batchId, []);
      }
      batchMap.get(batchId)!.push(shipment);
    });

    // Group errors by batchId
    const errorMap = new Map<string, ErrorTrackingEntry[]>();
    errors.forEach((error) => {
      if (!errorMap.has(error.batchId)) {
        errorMap.set(error.batchId, []);
      }
      errorMap.get(error.batchId)!.push(error);
    });

    return Array.from(batchMap.entries())
      .map(([batchId, batchShipments]) => {
        const batchErrors = errorMap.get(batchId) || [];
        const firstShipment = batchShipments[0];

        // Calculate stats
        const byStatus = Object.values(ShipmentStatus).reduce(
          (acc, status) => {
            acc[status] = batchShipments.filter((s) => s.status === status).length;
            return acc;
          },
          {} as Record<ShipmentStatus, number>
        );

        const byCarrier = Object.values(CarrierName).reduce(
          (acc, carrier) => {
            acc[carrier] = batchShipments.filter((s) => s.carrier === carrier).length;
            return acc;
          },
          {} as Record<CarrierName, number>
        );

        const byRisk = Object.values(ShipmentRiskLevel).reduce(
          (acc, risk) => {
            acc[risk] = batchShipments.filter((s) => s.riskAnalysis?.level === risk).length;
            return acc;
          },
          {} as Record<ShipmentRiskLevel, number>
        );

        return {
          id: batchId,
          date: firstShipment?.batchDate || firstShipment?.dateKey || new Date().toISOString(),
          timestamp: firstShipment?.dateKey || new Date().toISOString(),
          totalGuides: batchShipments.length,
          successfulGuides: batchShipments.length,
          failedGuides: batchErrors.filter((e) => !e.resolved).length,
          shipments: batchShipments,
          errors: batchErrors,
          stats: { byStatus, byCarrier, byRisk },
        };
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [shipments, errors]);

  const totalPages = Math.ceil(batches.length / BATCHES_PER_PAGE);
  const paginatedBatches = batches.slice(
    currentPage * BATCHES_PER_PAGE,
    (currentPage + 1) * BATCHES_PER_PAGE
  );

  const selectedBatch = selectedBatchId
    ? batches.find((b) => b.id === selectedBatchId)
    : null;

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-CO', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getSuccessRate = (batch: LoadBatch) => {
    const total = batch.totalGuides + batch.failedGuides;
    if (total === 0) return 100;
    return Math.round((batch.successfulGuides / total) * 100);
  };

  const getBatchSummary = (batch: LoadBatch) => {
    const delivered = batch.stats.byStatus[ShipmentStatus.DELIVERED] || 0;
    const inTransit = batch.stats.byStatus[ShipmentStatus.IN_TRANSIT] || 0;
    const issues = batch.stats.byStatus[ShipmentStatus.ISSUE] || 0;
    const urgent = batch.stats.byRisk[ShipmentRiskLevel.URGENT] || 0;

    return { delivered, inTransit, issues, urgent };
  };

  // View: "ALL" batches combined
  if (selectedBatchId === 'ALL') {
    return (
      <div className="space-y-6">
        {/* Back button */}
        <button
          onClick={() => setSelectedBatchId(null)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-medium">Volver al historial</span>
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Layers className="w-8 h-8" />
            <h2 className="text-2xl font-bold">Todas las Cargas</h2>
          </div>
          <p className="text-purple-100">
            {shipments.length} guías totales de {batches.length} cargas
          </p>
        </div>

        {/* Classification */}
        <DynamicClassificationButtons
          shipments={shipments}
          onGuideClick={onGuideClick}
          title="Clasificación de Todas las Guías"
          showAllButton={true}
        />

        {/* All Errors */}
        {errors.length > 0 && (
          <ErrorTrackingTable
            errors={errors}
            onRetryGuide={onRetryError}
            onMarkResolved={onMarkErrorResolved}
            title="Todos los Errores de Carga"
            showBatchInfo={true}
          />
        )}
      </div>
    );
  }

  // View: Single batch detail
  if (selectedBatch) {
    const summary = getBatchSummary(selectedBatch);

    return (
      <div className="space-y-6">
        {/* Back button */}
        <button
          onClick={() => setSelectedBatchId(null)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-medium">Volver al historial</span>
        </button>

        {/* Batch Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-6 h-6" />
                <h2 className="text-xl font-bold">Carga del {formatDate(selectedBatch.date)}</h2>
              </div>
              <p className="text-blue-100">ID: {selectedBatch.id}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{selectedBatch.totalGuides}</p>
              <p className="text-blue-100">guías cargadas</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{summary.delivered}</p>
              <p className="text-xs text-blue-100">Entregadas</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{summary.inTransit}</p>
              <p className="text-xs text-blue-100">En tránsito</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{summary.issues}</p>
              <p className="text-xs text-blue-100">Con novedad</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-red-300">{summary.urgent}</p>
              <p className="text-xs text-blue-100">Urgentes</p>
            </div>
          </div>
        </div>

        {/* Classification for this batch */}
        <DynamicClassificationButtons
          shipments={selectedBatch.shipments}
          onGuideClick={onGuideClick}
          title={`Clasificación - Carga ${formatDate(selectedBatch.date)}`}
          showAllButton={true}
        />

        {/* Errors for this batch */}
        {selectedBatch.errors.length > 0 && (
          <ErrorTrackingTable
            errors={selectedBatch.errors}
            onRetryGuide={onRetryError}
            onMarkResolved={onMarkErrorResolved}
            title={`Errores de Carga - ${formatDate(selectedBatch.date)}`}
            showBatchInfo={false}
          />
        )}
      </div>
    );
  }

  // View: Batch list (main view)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-xl">
              <Layers className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Historial de Cargas</h2>
              <p className="text-slate-300">
                {batches.length} carga{batches.length !== 1 ? 's' : ''} • {shipments.length} guías
                totales
              </p>
            </div>
          </div>

          {/* View All Button */}
          <button
            onClick={() => setSelectedBatchId('ALL')}
            className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
          >
            <Eye className="w-5 h-5" />
            <span className="font-semibold">VER TODAS</span>
          </button>
        </div>
      </div>

      {/* Batch Cards */}
      <div className="space-y-4">
        {paginatedBatches.map((batch) => {
          const summary = getBatchSummary(batch);
          const successRate = getSuccessRate(batch);
          const hasErrors = batch.errors.filter((e) => !e.resolved).length > 0;

          return (
            <div
              key={batch.id}
              onClick={() => setSelectedBatchId(batch.id)}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Date Icon */}
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                    <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatDate(batch.date)}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      ID: {batch.id.substring(0, 20)}...
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Stats Pills */}
                  <div className="hidden md:flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                      <Package className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {batch.totalGuides}
                      </span>
                    </div>

                    {summary.delivered > 0 && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">
                          {summary.delivered}
                        </span>
                      </div>
                    )}

                    {summary.urgent > 0 && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 rounded-full">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-red-700 dark:text-red-400">
                          {summary.urgent}
                        </span>
                      </div>
                    )}

                    {hasErrors && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-700 dark:text-orange-400">
                          {batch.errors.filter((e) => !e.resolved).length} errores
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Success Rate */}
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      {successRate >= 90 ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : successRate >= 70 ? (
                        <Clock className="w-4 h-4 text-yellow-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                      <span
                        className={`text-lg font-bold ${
                          successRate >= 90
                            ? 'text-green-600'
                            : successRate >= 70
                              ? 'text-yellow-600'
                              : 'text-red-600'
                        }`}
                      >
                        {successRate}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">éxito</p>
                  </div>

                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
              </div>

              {/* Mobile Stats */}
              <div className="flex md:hidden items-center gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                  <Package className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {batch.totalGuides} guías
                  </span>
                </div>

                {summary.delivered > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                      {summary.delivered}
                    </span>
                  </div>
                )}

                {hasErrors && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-700 dark:text-orange-400">
                      Errores
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`w-8 h-8 rounded-lg font-medium transition-colors ${
                  currentPage === i
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage === totalPages - 1}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Empty State */}
      {batches.length === 0 && (
        <div className="text-center py-12">
          <Layers className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No hay cargas registradas
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Las cargas aparecerán aquí después de subir guías al sistema
          </p>
        </div>
      )}
    </div>
  );
};

export default LoadHistoryPage;
