// components/ChatFirst/SkillViews/PrediccionesSkillView.tsx
// Vista simplificada de Predicciones - ML y analisis predictivo
import React, { useMemo, useState } from 'react';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Zap,
  Clock,
  Package,
  Truck,
  ChevronRight,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import { Shipment, ShipmentStatus, CarrierName } from '../../../types';

interface PrediccionesSkillViewProps {
  shipments: Shipment[];
  onShipmentClick?: (shipment: Shipment) => void;
  onChatQuery?: (query: string) => void;
}

interface Prediction {
  shipment: Shipment;
  deliveryProbability: number;
  estimatedDays: number;
  riskLevel: 'ALTO' | 'MEDIO' | 'BAJO';
  reason: string;
}

interface CarrierRecommendation {
  carrier: CarrierName;
  score: number;
  avgDays: number;
  successRate: number;
  reason: string;
}

// Funcion de prediccion simplificada
const calculatePrediction = (shipment: Shipment): Prediction => {
  const days = shipment.detailedInfo?.daysInTransit || 0;
  const hasIssue = shipment.status === ShipmentStatus.ISSUE ||
                   shipment.status === ShipmentStatus.EXCEPTION;

  // Calcular probabilidad base
  let probability = 85;

  // Penalizaciones
  if (hasIssue) probability -= 30;
  if (days > 7) probability -= 25;
  else if (days > 5) probability -= 15;
  else if (days > 3) probability -= 5;

  // Ajuste por transportadora (simulado)
  const carrierBonus: Record<string, number> = {
    'INTERRAPIDISIMO': 5,
    'ENVIA': 3,
    'COORDINADORA': 0,
    'TCC': -2,
    'VELOCES': -5,
  };
  const carrier = shipment.carrier?.toUpperCase() || '';
  probability += carrierBonus[carrier] || 0;

  probability = Math.max(0, Math.min(100, probability));

  // Dias estimados
  const estimatedDays = hasIssue ? days + 3 : Math.max(1, 5 - days);

  // Nivel de riesgo
  let riskLevel: Prediction['riskLevel'] = 'BAJO';
  if (probability < 50) riskLevel = 'ALTO';
  else if (probability < 70) riskLevel = 'MEDIO';

  // Razon
  let reason = 'Entrega probable en tiempo normal';
  if (hasIssue) reason = 'Novedad activa - riesgo de retraso';
  else if (days > 5) reason = 'Tiempo extendido - seguimiento recomendado';
  else if (probability > 85) reason = 'Buen historial de la ruta';

  return { shipment, deliveryProbability: probability, estimatedDays, riskLevel, reason };
};

export const PrediccionesSkillView: React.FC<PrediccionesSkillViewProps> = ({
  shipments,
  onShipmentClick,
  onChatQuery,
}) => {
  const [viewMode, setViewMode] = useState<'predictions' | 'recommendations'>('predictions');

  // Calcular predicciones para todos los envios activos
  const predictions = useMemo((): Prediction[] => {
    return shipments
      .filter(s => s.status !== ShipmentStatus.DELIVERED)
      .map(calculatePrediction)
      .sort((a, b) => a.deliveryProbability - b.deliveryProbability);
  }, [shipments]);

  // Estadisticas de prediccion
  const predictionStats = useMemo(() => {
    const highRisk = predictions.filter(p => p.riskLevel === 'ALTO').length;
    const mediumRisk = predictions.filter(p => p.riskLevel === 'MEDIO').length;
    const lowRisk = predictions.filter(p => p.riskLevel === 'BAJO').length;
    const avgProbability = predictions.length > 0
      ? Math.round(predictions.reduce((sum, p) => sum + p.deliveryProbability, 0) / predictions.length)
      : 0;
    return { highRisk, mediumRisk, lowRisk, avgProbability, total: predictions.length };
  }, [predictions]);

  // Recomendaciones de transportadora por ciudad (simplificado)
  const carrierRecommendations = useMemo((): CarrierRecommendation[] => {
    // En produccion esto vendria del ML service
    return [
      { carrier: CarrierName.INTERRAPIDISIMO, score: 92, avgDays: 2.3, successRate: 94, reason: 'Mejor tasa de exito en Bogota' },
      { carrier: CarrierName.ENVIA, score: 88, avgDays: 2.8, successRate: 91, reason: 'Buena cobertura nacional' },
      { carrier: CarrierName.COORDINADORA, score: 85, avgDays: 3.1, successRate: 88, reason: 'Precio competitivo' },
      { carrier: CarrierName.TCC, score: 78, avgDays: 3.5, successRate: 82, reason: 'Mejor para carga pesada' },
    ];
  }, []);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'ALTO': return 'text-red-400 bg-red-500/20';
      case 'MEDIO': return 'text-amber-400 bg-amber-500/20';
      default: return 'text-emerald-400 bg-emerald-500/20';
    }
  };

  return (
    <div className="space-y-4">
      {/* Prediction Summary */}
      <div className="p-4 bg-gradient-to-r from-purple-900/40 to-violet-900/40 rounded-xl border border-purple-500/30">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5 text-purple-400" />
          <span className="font-medium text-white">Prediccion IA</span>
          <span className="text-xs text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full">
            {predictionStats.total} envios analizados
          </span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-400">{predictionStats.highRisk}</p>
            <p className="text-xs text-slate-400">Alto Riesgo</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-400">{predictionStats.mediumRisk}</p>
            <p className="text-xs text-slate-400">Riesgo Medio</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">{predictionStats.lowRisk}</p>
            <p className="text-xs text-slate-400">Bajo Riesgo</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-400">{predictionStats.avgProbability}%</p>
            <p className="text-xs text-slate-400">Prob. Promedio</p>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
        <button
          onClick={() => setViewMode('predictions')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'predictions'
              ? 'bg-accent-500 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Target className="w-4 h-4 inline mr-2" />
          Predicciones
        </button>
        <button
          onClick={() => setViewMode('recommendations')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'recommendations'
              ? 'bg-accent-500 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 inline mr-2" />
          Recomendaciones
        </button>
      </div>

      {/* Predictions List */}
      {viewMode === 'predictions' && (
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
          {predictions.slice(0, 15).map((pred) => (
            <button
              key={pred.shipment.id}
              onClick={() => onShipmentClick?.(pred.shipment)}
              className="w-full p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getRiskColor(pred.riskLevel)}`}>
                    {pred.riskLevel === 'ALTO' ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : pred.riskLevel === 'MEDIO' ? (
                      <Clock className="w-4 h-4" />
                    ) : (
                      <Target className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-mono text-sm text-white">
                      {pred.shipment.trackingNumber || pred.shipment.id}
                    </p>
                    <p className="text-xs text-slate-400">{pred.reason}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    pred.deliveryProbability >= 70 ? 'text-emerald-400' :
                    pred.deliveryProbability >= 50 ? 'text-amber-400' :
                    'text-red-400'
                  }`}>
                    {pred.deliveryProbability}%
                  </p>
                  <p className="text-xs text-slate-500">~{pred.estimatedDays}d</p>
                </div>
              </div>
            </button>
          ))}

          {predictions.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay envios activos para predecir</p>
            </div>
          )}
        </div>
      )}

      {/* Carrier Recommendations */}
      {viewMode === 'recommendations' && (
        <div className="space-y-2">
          {carrierRecommendations.map((rec) => (
            <div
              key={rec.carrier}
              className="p-3 bg-white/5 border border-white/10 rounded-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="font-medium text-white">{rec.carrier}</p>
                    <p className="text-xs text-slate-400">{rec.reason}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <div className="text-center">
                      <p className="text-lg font-bold text-accent-400">{rec.score}</p>
                      <p className="text-[10px] text-slate-500">Score</p>
                    </div>
                    <div className="text-center border-l border-white/10 pl-2">
                      <p className="text-sm font-medium text-emerald-400">{rec.successRate}%</p>
                      <p className="text-[10px] text-slate-500">Exito</p>
                    </div>
                    <div className="text-center border-l border-white/10 pl-2">
                      <p className="text-sm font-medium text-blue-400">{rec.avgDays}d</p>
                      <p className="text-[10px] text-slate-500">Tiempo</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
        <button
          onClick={() => onChatQuery?.('Cuales envios tienen mayor riesgo de falla?')}
          className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-xs text-red-300"
        >
          Ver alto riesgo
        </button>
        <button
          onClick={() => onChatQuery?.('Predice como estara manana')}
          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-slate-300"
        >
          Prediccion manana
        </button>
        <button
          onClick={() => onChatQuery?.('Que transportadora me recomiendas para Bogota?')}
          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-slate-300"
        >
          Recomendar carrier
        </button>
      </div>
    </div>
  );
};

export default PrediccionesSkillView;
