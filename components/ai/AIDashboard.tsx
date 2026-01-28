/**
 * AI Dashboard Component
 *
 * Dashboard principal para visualizar predicciones y análisis de IA.
 */

import React, { useState, useEffect } from 'react';
import {
  AIDashboard as AIDashboardData,
  DemandForecast,
  AnomalyDetection,
  SupplyChainRisk,
  CustomerBehaviorAnalysis,
} from '../../types/predictiveAI.types';
import {
  aiDashboardService,
  demandForecastingService,
  anomalyDetectionService,
  supplyChainRiskService,
} from '../../services/predictiveAIService';

interface AIMetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  icon: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

const AIMetricCard: React.FC<AIMetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  color,
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    stable: '→',
  };

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span className={`text-sm font-medium ${
            trend === 'up' ? 'text-green-600' :
            trend === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {trendIcons[trend]} {trendValue}
          </span>
        )}
      </div>
      <div className="mt-2">
        <p className="text-sm font-medium opacity-80">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
        {subtitle && <p className="text-xs opacity-60 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};

interface AccuracyGaugeProps {
  label: string;
  value: number;
  target?: number;
}

const AccuracyGauge: React.FC<AccuracyGaugeProps> = ({ label, value, target = 0.9 }) => {
  const percentage = Math.round(value * 100);
  const isGood = value >= target;

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className={`text-sm font-bold ${isGood ? 'text-green-600' : 'text-yellow-600'}`}>
            {percentage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              isGood ? 'bg-green-500' : 'bg-yellow-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

interface AlertCardProps {
  alert: AnomalyDetection | SupplyChainRisk;
  type: 'anomaly' | 'risk';
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, type }) => {
  const isAnomaly = type === 'anomaly';
  const severity = isAnomaly
    ? (alert as AnomalyDetection).severity
    : (alert as SupplyChainRisk).impact;

  const severityColors = {
    info: 'bg-blue-100 border-blue-300 text-blue-800',
    low: 'bg-green-100 border-green-300 text-green-800',
    warning: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    medium: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    high: 'bg-orange-100 border-orange-300 text-orange-800',
    critical: 'bg-red-100 border-red-300 text-red-800',
  };

  return (
    <div className={`p-4 rounded-lg border ${severityColors[severity]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {severity === 'critical' ? '🚨' :
               severity === 'high' ? '⚠️' :
               severity === 'warning' || severity === 'medium' ? '⚡' : 'ℹ️'}
            </span>
            <h4 className="font-semibold">
              {isAnomaly
                ? `Anomalía en ${(alert as AnomalyDetection).metric}`
                : (alert as SupplyChainRisk).title
              }
            </h4>
          </div>
          <p className="text-sm mt-1 opacity-80">
            {isAnomaly
              ? `${(alert as AnomalyDetection).entityName}: Desviación del ${
                  Math.abs((alert as AnomalyDetection).deviationPercent).toFixed(1)
                }%`
              : (alert as SupplyChainRisk).description
            }
          </p>
        </div>
        <span className="text-xs opacity-60">
          {new Date(alert.detectedAt).toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
      {isAnomaly && (alert as AnomalyDetection).recommendations.length > 0 && (
        <div className="mt-2 pt-2 border-t border-current border-opacity-20">
          <p className="text-xs font-medium">Recomendación:</p>
          <p className="text-xs opacity-80">
            {(alert as AnomalyDetection).recommendations[0]}
          </p>
        </div>
      )}
    </div>
  );
};

interface ForecastChartProps {
  forecast: DemandForecast | null;
}

const ForecastChart: React.FC<ForecastChartProps> = ({ forecast }) => {
  if (!forecast) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-500">
        No hay datos de pronóstico disponibles
      </div>
    );
  }

  const maxValue = Math.max(...forecast.predictions.map(p => p.upperBound));
  const predictions = forecast.predictions.slice(0, 14); // 2 semanas

  return (
    <div className="h-48">
      <div className="flex items-end justify-between h-40 gap-1">
        {predictions.map((prediction, index) => {
          const height = (prediction.predictedDemand / maxValue) * 100;
          const isWeekend = prediction.date.getDay() === 0 || prediction.date.getDay() === 6;

          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className={`w-full rounded-t transition-all duration-300 ${
                  isWeekend ? 'bg-blue-300' : 'bg-blue-500'
                }`}
                style={{ height: `${height}%` }}
                title={`${prediction.date.toLocaleDateString()}: ${Math.round(prediction.predictedDemand)} unidades`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>{predictions[0]?.date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}</span>
        <span>Próximos 14 días</span>
        <span>{predictions[predictions.length - 1]?.date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}</span>
      </div>
    </div>
  );
};

interface RecommendationListProps {
  recommendations: DemandForecast['recommendations'];
}

const RecommendationList: React.FC<RecommendationListProps> = ({ recommendations }) => {
  const priorityColors = {
    low: 'text-gray-600 bg-gray-100',
    medium: 'text-yellow-700 bg-yellow-100',
    high: 'text-orange-700 bg-orange-100',
    critical: 'text-red-700 bg-red-100',
  };

  const typeIcons = {
    restock: '📦',
    reduce_stock: '📉',
    promotion: '🏷️',
    price_adjustment: '💰',
    alert: '🔔',
  };

  return (
    <div className="space-y-3">
      {recommendations.map((rec, index) => (
        <div key={index} className="p-3 bg-white rounded-lg border shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-xl">{typeIcons[rec.type]}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-gray-900">{rec.message}</h4>
                <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[rec.priority]}`}>
                  {rec.priority === 'critical' ? 'Crítico' :
                   rec.priority === 'high' ? 'Alto' :
                   rec.priority === 'medium' ? 'Medio' : 'Bajo'}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{rec.suggestedAction}</p>
              {rec.expectedImpact && (
                <div className="mt-2 text-xs text-green-600 font-medium">
                  Impacto esperado: +{rec.expectedImpact.improvement}% en {rec.expectedImpact.metric}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      {recommendations.length === 0 && (
        <p className="text-center text-gray-500 py-4">
          No hay recomendaciones pendientes
        </p>
      )}
    </div>
  );
};

export const AIAnalyticsDashboard: React.FC = () => {
  const [dashboard, setDashboard] = useState<AIDashboardData | null>(null);
  const [demandForecast, setDemandForecast] = useState<DemandForecast | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([]);
  const [risks, setRisks] = useState<SupplyChainRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'forecasts' | 'anomalies' | 'risks'>('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Cargar dashboard principal
      const dashboardData = aiDashboardService.generateDashboard();
      setDashboard(dashboardData);

      // Generar forecast de ejemplo
      const sampleSales = Array.from({ length: 90 }, (_, i) => ({
        date: new Date(Date.now() - (90 - i) * 24 * 60 * 60 * 1000),
        quantity: Math.round(50 + Math.random() * 30 + Math.sin(i / 7 * Math.PI) * 10),
      }));
      const forecast = await demandForecastingService.generateForecast(
        'PROD-001',
        sampleSales,
        30
      );
      setDemandForecast(forecast);

      // Detectar anomalías de ejemplo
      const sampleMetrics = Array.from({ length: 30 }, (_, i) => ({
        timestamp: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000),
        value: i === 25 ? 250 : Math.round(100 + Math.random() * 20), // Anomalía en día 25
      }));
      const detectedAnomalies = anomalyDetectionService.detectAnomalies(
        'product',
        'PROD-001',
        'Producto Ejemplo',
        'ventas_diarias',
        sampleMetrics,
        'demand'
      );
      setAnomalies(detectedAnomalies);

      // Evaluar riesgos de ejemplo
      const detectedRisks = supplyChainRiskService.assessRisks(
        [
          { productId: 'PROD-001', stock: 15, avgDailySales: 5 },
          { productId: 'PROD-002', stock: 500, avgDailySales: 2 },
        ],
        [{ supplierId: 'SUP-001', leadTime: 7, reliability: 0.75 }],
        [{ carrierId: 'CARRIER-001', onTimeRate: 0.85, capacity: 100 }]
      );
      setRisks(detectedRisks);
    } catch (error) {
      console.error('Error loading AI dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando análisis de IA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span>🤖</span> Centro de Inteligencia Artificial
        </h1>
        <p className="text-gray-600 mt-1">
          Predicciones, análisis y recomendaciones impulsadas por IA
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b">
        <nav className="flex gap-4">
          {[
            { id: 'overview', label: 'Resumen', icon: '📊' },
            { id: 'forecasts', label: 'Pronósticos', icon: '📈' },
            { id: 'anomalies', label: 'Anomalías', icon: '🔍' },
            { id: 'risks', label: 'Riesgos', icon: '⚠️' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && dashboard && (
        <div className="space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <AIMetricCard
              title="Pronósticos Activos"
              value={dashboard.activePredictions.demandForecasts}
              subtitle="Productos monitoreados"
              icon="📈"
              color="blue"
            />
            <AIMetricCard
              title="Predicciones de Entrega"
              value={dashboard.activePredictions.deliveryPredictions}
              subtitle="Envíos en seguimiento"
              trend="up"
              trendValue="+12%"
              icon="🚚"
              color="green"
            />
            <AIMetricCard
              title="Alertas de Riesgo"
              value={dashboard.activePredictions.riskAlerts}
              subtitle="Requieren atención"
              trend={dashboard.activePredictions.riskAlerts > 5 ? 'up' : 'stable'}
              icon="⚠️"
              color={dashboard.activePredictions.riskAlerts > 5 ? 'red' : 'yellow'}
            />
            <AIMetricCard
              title="Anomalías Detectadas"
              value={dashboard.activePredictions.anomalies}
              subtitle="Últimas 24 horas"
              icon="🔍"
              color="purple"
            />
          </div>

          {/* Model Accuracy */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Precisión de Modelos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AccuracyGauge
                label="Pronóstico de Demanda"
                value={dashboard.modelAccuracy.demandForecast}
                target={0.85}
              />
              <AccuracyGauge
                label="Predicción de Entrega"
                value={dashboard.modelAccuracy.deliveryPrediction}
                target={0.9}
              />
              <AccuracyGauge
                label="Predicción de Churn"
                value={dashboard.modelAccuracy.customerChurn}
                target={0.75}
              />
              <AccuracyGauge
                label="Optimización de Precios"
                value={dashboard.modelAccuracy.priceOptimization}
                target={0.7}
              />
            </div>
          </div>

          {/* Value Generated */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-6 text-white">
            <h3 className="text-lg font-semibold mb-4">Valor Generado por IA</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-purple-200 text-sm">Ahorro en Costos</p>
                <p className="text-2xl font-bold">
                  ${(dashboard.valueGenerated.costSavings / 1000000).toFixed(1)}M
                </p>
              </div>
              <div>
                <p className="text-purple-200 text-sm">Incremento en Ventas</p>
                <p className="text-2xl font-bold">
                  ${(dashboard.valueGenerated.revenueIncrease / 1000000).toFixed(1)}M
                </p>
              </div>
              <div>
                <p className="text-purple-200 text-sm">Stockouts Prevenidos</p>
                <p className="text-2xl font-bold">{dashboard.valueGenerated.stockoutsPrevented}</p>
              </div>
              <div>
                <p className="text-purple-200 text-sm">Mejora en Entregas</p>
                <p className="text-2xl font-bold">+{dashboard.valueGenerated.deliveryAccuracyImprovement}%</p>
              </div>
            </div>
          </div>

          {/* Recent Alerts */}
          {(anomalies.length > 0 || risks.length > 0) && (
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Alertas Recientes
              </h3>
              <div className="space-y-3">
                {anomalies.slice(0, 2).map((anomaly) => (
                  <AlertCard key={anomaly.id} alert={anomaly} type="anomaly" />
                ))}
                {risks.slice(0, 2).map((risk) => (
                  <AlertCard key={risk.id} alert={risk} type="risk" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Forecasts Tab */}
      {activeTab === 'forecasts' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Pronóstico de Demanda - 14 días
              </h3>
              {demandForecast && (
                <span className={`text-sm px-3 py-1 rounded-full ${
                  demandForecast.confidence >= 0.8
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  Confianza: {Math.round(demandForecast.confidence * 100)}%
                </span>
              )}
            </div>
            <ForecastChart forecast={demandForecast} />
          </div>

          {demandForecast && demandForecast.factors.length > 0 && (
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Factores Identificados
              </h3>
              <div className="space-y-3">
                {demandForecast.factors.map((factor, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full ${
                      factor.impact > 0 ? 'bg-green-500' : factor.impact < 0 ? 'bg-red-500' : 'bg-gray-400'
                    }`} />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{factor.name}</p>
                      <p className="text-sm text-gray-600">{factor.description}</p>
                    </div>
                    <span className={`text-sm font-medium ${
                      factor.impact > 0 ? 'text-green-600' : factor.impact < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {factor.impact > 0 ? '+' : ''}{(factor.impact * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recomendaciones Basadas en Pronóstico
            </h3>
            <RecommendationList recommendations={demandForecast?.recommendations || []} />
          </div>
        </div>
      )}

      {/* Anomalies Tab */}
      {activeTab === 'anomalies' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Anomalías Detectadas
            </h3>
            {anomalies.length > 0 ? (
              <div className="space-y-3">
                {anomalies.map((anomaly) => (
                  <AlertCard key={anomaly.id} alert={anomaly} type="anomaly" />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <span className="text-4xl">✓</span>
                <p className="mt-2">No se han detectado anomalías significativas</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Risks Tab */}
      {activeTab === 'risks' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Riesgos de Cadena de Suministro
            </h3>
            {risks.length > 0 ? (
              <div className="space-y-3">
                {risks.map((risk) => (
                  <AlertCard key={risk.id} alert={risk} type="risk" />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <span className="text-4xl">✓</span>
                <p className="mt-2">No se han identificado riesgos significativos</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAnalyticsDashboard;
