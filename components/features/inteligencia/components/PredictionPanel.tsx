/**
 * PREDICTION PANEL
 *
 * Panel que muestra predicciones de entrega basadas en ML.
 * Extraido de InteligenciaLogisticaTab.tsx para mejor organizacion.
 */

import React from 'react';
import { Brain, TrendingUp, AlertTriangle, Clock } from 'lucide-react';
import { DeliveryPrediction, PredictionSummary } from '../types';
import { formatPercentage } from '../../../../utils/formatters';

interface PredictionPanelProps {
  predictions: DeliveryPrediction[];
  summary: PredictionSummary;
  isLoading?: boolean;
  onViewDetails?: (prediction: DeliveryPrediction) => void;
}

const PredictionPanel: React.FC<PredictionPanelProps> = ({
  predictions,
  summary,
  isLoading = false,
  onViewDetails,
}) => {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'emerald';
      case 'medium':
        return 'amber';
      case 'high':
        return 'red';
      default:
        return 'slate';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-700 rounded w-40 mb-4" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-500/20 rounded-lg">
          <Brain className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Predicciones ML</h3>
          <p className="text-sm text-slate-400">
            Confianza promedio: {formatPercentage(summary.avgConfidence)}
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-emerald-500/10 rounded-lg">
          <div className="text-2xl font-bold text-emerald-400">
            {summary.onTimeDeliveries}
          </div>
          <div className="text-xs text-slate-400">A tiempo</div>
        </div>
        <div className="text-center p-3 bg-amber-500/10 rounded-lg">
          <div className="text-2xl font-bold text-amber-400">
            {summary.atRiskDeliveries}
          </div>
          <div className="text-xs text-slate-400">En riesgo</div>
        </div>
        <div className="text-center p-3 bg-red-500/10 rounded-lg">
          <div className="text-2xl font-bold text-red-400">
            {summary.lateDeliveries}
          </div>
          <div className="text-xs text-slate-400">Tarde</div>
        </div>
      </div>

      {/* Predictions List */}
      <div className="space-y-3">
        {predictions.slice(0, 5).map((pred) => {
          const color = getRiskColor(pred.riskLevel);
          return (
            <div
              key={pred.shipmentId}
              className={`
                p-3 rounded-lg border cursor-pointer
                bg-${color}-500/5 border-${color}-500/20
                hover:border-${color}-500/40 transition-colors
              `}
              onClick={() => onViewDetails?.(pred)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-white">
                    {pred.shipmentId.slice(0, 12)}...
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full bg-${color}-500/20 text-${color}-400`}>
                    {pred.riskLevel}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Clock className="w-3 h-3" />
                  {new Date(pred.estimatedDate).toLocaleDateString()}
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                <TrendingUp className="w-3 h-3" />
                Confianza: {formatPercentage(pred.confidence)}
              </div>
            </div>
          );
        })}
      </div>

      {predictions.length > 5 && (
        <button className="mt-4 w-full py-2 text-sm text-purple-400 hover:text-purple-300">
          Ver todas las predicciones ({predictions.length})
        </button>
      )}
    </div>
  );
};

export default PredictionPanel;
