// components/ml/MLDashboard.tsx
// Machine Learning Dashboard - Visualización de predicciones y modelos
import React, { useState, useEffect } from 'react';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Route,
  Clock,
  Target,
  Activity,
  Zap,
  BarChart3,
  RefreshCw,
  CheckCircle,
  XCircle,
  Info,
} from 'lucide-react';
import {
  useML,
  useMLStore,
  predictDemand,
  generateDemandForecast,
  detectAnomalies,
  optimizeRoute,
  type PredictionResult,
  type AnomalyResult,
  type DemandForecast,
  type RouteOptimization,
} from '../../services/mlService';

// ============================================
// MODEL STATUS CARD
// ============================================
const ModelStatusCard: React.FC<{
  name: string;
  version: string;
  accuracy: number;
  status: string;
  lastTrained: Date;
}> = ({ name, version, accuracy, status, lastTrained }) => {
  const statusColors = {
    ready: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    training: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    not_loaded: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  };

  return (
    <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-500" />
          <span className="font-medium text-slate-800 dark:text-white text-sm">{name}</span>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors]}`}
        >
          {status === 'ready' ? 'Listo' : status === 'training' ? 'Entrenando' : status}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500 dark:text-slate-400">Versión</span>
          <span className="text-slate-700 dark:text-slate-300">{version}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500 dark:text-slate-400">Precisión</span>
          <span className="text-slate-700 dark:text-slate-300">{(accuracy * 100).toFixed(1)}%</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-navy-700 rounded-full h-1.5">
          <div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full transition-all"
            style={{ width: `${accuracy * 100}%` }}
          />
        </div>
        <div className="text-xs text-slate-400 dark:text-slate-500">
          Último entrenamiento: {lastTrained.toLocaleDateString('es-CO')}
        </div>
      </div>
    </div>
  );
};

// ============================================
// PREDICTION CHART
// ============================================
const PredictionChart: React.FC<{ forecasts: DemandForecast[] }> = ({ forecasts }) => {
  if (forecasts.length === 0) return null;

  const maxValue = Math.max(...forecasts.map((f) => f.predicted)) * 1.2;

  return (
    <div className="bg-white dark:bg-navy-800 rounded-xl p-6 border border-slate-200 dark:border-navy-700">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-blue-500" />
        Pronóstico de Demanda (7 días)
      </h3>

      <div className="h-48 flex items-end gap-2">
        {forecasts.map((forecast, index) => {
          const height = (forecast.predicted / maxValue) * 100;
          const date = new Date(forecast.date);
          const dayName = date.toLocaleDateString('es-CO', { weekday: 'short' });

          return (
            <div key={forecast.date} className="flex-1 flex flex-col items-center gap-1">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {forecast.predicted}
              </div>
              <div
                className="w-full bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t-lg transition-all hover:from-blue-600 hover:to-cyan-500 relative group"
                style={{ height: `${height}%`, minHeight: '20px' }}
              >
                {/* Confidence indicator */}
                <div
                  className="absolute inset-x-0 bottom-0 bg-blue-600/30 rounded-t-lg"
                  style={{ height: `${(1 - forecast.confidence) * 100}%` }}
                />

                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  Confianza: {(forecast.confidence * 100).toFixed(0)}%
                  <br />
                  Tendencia: {forecast.trend === 'up' ? '↑' : forecast.trend === 'down' ? '↓' : '→'}
                </div>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{dayName}</div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gradient-to-t from-blue-500 to-cyan-400 rounded" />
          Predicción
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-600/30 rounded" />
          Margen de error
        </span>
      </div>
    </div>
  );
};

// ============================================
// ANOMALY ALERTS
// ============================================
const AnomalyAlerts: React.FC<{ anomalies: AnomalyResult[] }> = ({ anomalies }) => {
  const severityColors = {
    low: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20',
    medium: 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20',
    high: 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20',
    critical: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20',
  };

  const severityIcons = {
    low: <Info className="w-4 h-4 text-blue-500" />,
    medium: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
    high: <AlertTriangle className="w-4 h-4 text-orange-500" />,
    critical: <XCircle className="w-4 h-4 text-red-500" />,
  };

  if (anomalies.length === 0) {
    return (
      <div className="bg-white dark:bg-navy-800 rounded-xl p-6 border border-slate-200 dark:border-navy-700">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Detección de Anomalías
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-slate-400">
          <CheckCircle className="w-12 h-12 text-green-500 mb-2" />
          <p>No se detectaron anomalías</p>
          <p className="text-sm">El sistema está funcionando normalmente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-navy-800 rounded-xl p-6 border border-slate-200 dark:border-navy-700">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-amber-500" />
        Detección de Anomalías
        <span className="ml-auto text-sm font-normal text-slate-500">
          {anomalies.length} detectadas
        </span>
      </h3>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {anomalies.slice(-5).map((anomaly, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border ${severityColors[anomaly.severity]}`}
          >
            <div className="flex items-start gap-2">
              {severityIcons[anomaly.severity]}
              <div className="flex-1">
                <div className="font-medium text-sm text-slate-800 dark:text-white">
                  {anomaly.description}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {anomaly.recommendation}
                </div>
              </div>
              <span className="text-xs font-medium text-slate-500 uppercase">
                {anomaly.type.replace('_', ' ')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// ROUTE OPTIMIZATION CARD
// ============================================
const RouteOptimizationCard: React.FC<{ optimization: RouteOptimization | null }> = ({
  optimization,
}) => {
  if (!optimization) {
    return (
      <div className="bg-white dark:bg-navy-800 rounded-xl p-6 border border-slate-200 dark:border-navy-700">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <Route className="w-5 h-5 text-green-500" />
          Optimización de Rutas
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-center py-8">
          Ejecuta una optimización para ver resultados
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-navy-800 rounded-xl p-6 border border-slate-200 dark:border-navy-700">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
        <Route className="w-5 h-5 text-green-500" />
        Optimización de Rutas
        <span className="ml-auto bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full text-sm font-medium">
          Score: {optimization.score}%
        </span>
      </h3>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-slate-50 dark:bg-navy-700/50 rounded-lg">
          <div className="text-2xl font-bold text-green-500">{optimization.savings.distance} km</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Distancia ahorrada</div>
        </div>
        <div className="text-center p-3 bg-slate-50 dark:bg-navy-700/50 rounded-lg">
          <div className="text-2xl font-bold text-blue-500">{optimization.savings.time} min</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Tiempo ahorrado</div>
        </div>
        <div className="text-center p-3 bg-slate-50 dark:bg-navy-700/50 rounded-lg">
          <div className="text-2xl font-bold text-purple-500">
            ${(optimization.savings.cost / 1000).toFixed(0)}k
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Costo ahorrado</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
            Ruta Original
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
            {optimization.originalRoute.map((stop, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-navy-700 text-xs flex items-center justify-center">
                  {i + 1}
                </span>
                {stop}
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium text-green-500 mb-2">Ruta Optimizada</div>
          <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
            {optimization.optimizedRoute.map((stop, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className="w-4 h-4 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs flex items-center justify-center">
                  {i + 1}
                </span>
                {stop}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN ML DASHBOARD
// ============================================
export const MLDashboard: React.FC = () => {
  const { models, isLoading, anomalies, forecasts } = useMLStore();
  const [routeOptimization, setRouteOptimization] = useState<RouteOptimization | null>(null);
  const [lastPrediction, setLastPrediction] = useState<PredictionResult | null>(null);

  // Run initial predictions on mount
  useEffect(() => {
    runDemandPrediction();
    runAnomalyCheck();
  }, []);

  const runDemandPrediction = async () => {
    // Generate historical data
    const historical = Array(30)
      .fill(0)
      .map(() => Math.floor(Math.random() * 500) + 200);

    // Get forecast
    const forecast = await generateDemandForecast(
      historical.map((v, i) => ({
        date: new Date(Date.now() - (30 - i) * 86400000).toISOString(),
        value: v,
      })),
      7
    );

    // Get single prediction
    const today = new Date();
    const prediction = await predictDemand(
      historical.slice(-7),
      today.getDay(),
      today.getMonth(),
      false,
      7
    );
    setLastPrediction(prediction);
  };

  const runAnomalyCheck = async () => {
    // Simulate anomaly detection
    await detectAnomalies(
      45, // delivery time
      30, // expected
      150, // volume
      120, // avg volume
      250000, // cost
      200000 // avg cost
    );
  };

  const runRouteOptimization = async () => {
    const locations = [
      { id: '1', name: 'Bodega Central', lat: 4.6097, lng: -74.0817, priority: 1 },
      { id: '2', name: 'Chapinero', lat: 4.6486, lng: -74.0628, priority: 3 },
      { id: '3', name: 'Usaquén', lat: 4.6952, lng: -74.0304, priority: 2 },
      { id: '4', name: 'Suba', lat: 4.7410, lng: -74.0833, priority: 1 },
      { id: '5', name: 'Kennedy', lat: 4.6306, lng: -74.1599, priority: 4 },
      { id: '6', name: 'Fontibón', lat: 4.6739, lng: -74.1469, priority: 2 },
    ];

    const result = await optimizeRoute(locations);
    setRouteOptimization(result);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            Centro de Machine Learning
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Predicciones inteligentes y optimización en tiempo real
          </p>
        </div>

        <button
          onClick={() => {
            runDemandPrediction();
            runAnomalyCheck();
          }}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar Predicciones
        </button>
      </div>

      {/* Model Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(models).map(([key, model]) => (
          <ModelStatusCard
            key={key}
            name={model.name}
            version={model.version}
            accuracy={model.accuracy}
            status={model.status}
            lastTrained={model.lastTrained}
          />
        ))}
      </div>

      {/* Prediction Result */}
      {lastPrediction && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium opacity-90">Predicción de Demanda - Hoy</h3>
              <div className="text-4xl font-bold mt-2">
                {lastPrediction.value.toLocaleString()} envíos
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm opacity-80">
                <span>Confianza: {(lastPrediction.confidence * 100).toFixed(0)}%</span>
                <span>Rango: {lastPrediction.lowerBound} - {lastPrediction.upperBound}</span>
              </div>
            </div>
            <div className="space-y-1">
              {lastPrediction.factors.map((factor, i) => (
                <div key={i} className="text-sm bg-white/20 rounded-full px-3 py-1">
                  {factor}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Forecast Chart */}
        <PredictionChart forecasts={forecasts} />

        {/* Anomaly Alerts */}
        <AnomalyAlerts anomalies={anomalies} />

        {/* Route Optimization */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
              Optimización de Rutas con IA
            </h3>
            <button
              onClick={runRouteOptimization}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              Optimizar Ruta Demo
            </button>
          </div>
          <RouteOptimizationCard optimization={routeOptimization} />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white">94.2%</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Precisión Global</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white">12.5k</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Predicciones/día</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white">45ms</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Latencia Promedio</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <BarChart3 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white">$2.3M</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Ahorro Mensual</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MLDashboard;
