import React, { useState, useEffect } from 'react';
import { Country } from '../../types/country';
import {
  DemandForecast,
  DemandPrediction,
  DemandAlert,
  CityDemandPrediction,
} from '../../types/demand';
import {
  generateDemandForecast,
  getSavedForecast,
  dismissAlert,
  getWeeklyForecast,
  getNextPeakDays,
} from '../../services/demandService';
import { formatCurrency } from '../../services/countryService';
import { recordMLUsage } from '../../services/gamificationService';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  Bell,
  MapPin,
  BarChart3,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Target,
  Zap,
  Package,
  DollarSign,
  Clock,
  Info,
  X,
  Check,
  Activity,
} from 'lucide-react';

interface DemandTabProps {
  country: Country;
}

const DemandTab: React.FC<DemandTabProps> = ({ country }) => {
  const [forecast, setForecast] = useState<DemandForecast | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7' | '30' | '90'>('30');
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  useEffect(() => {
    loadForecast();
  }, [country]);

  const loadForecast = async () => {
    setIsLoading(true);
    try {
      let data = getSavedForecast(country);
      if (!data) {
        data = generateDemandForecast(country);
        recordMLUsage(true);
      }
      setForecast(data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    const data = generateDemandForecast(country);
    setForecast(data);
    recordMLUsage(true);
  };

  const handleDismissAlert = (alertId: string) => {
    dismissAlert(country, alertId);
    loadForecast();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Analizando patrones de demanda...</p>
        </div>
      </div>
    );
  }

  if (!forecast) return null;

  const weeklyPredictions = forecast.dailyPredictions.slice(0, 7);
  const monthlyPredictions = forecast.dailyPredictions.slice(0, 30);
  const displayPredictions =
    selectedPeriod === '7'
      ? weeklyPredictions
      : selectedPeriod === '30'
        ? monthlyPredictions
        : forecast.dailyPredictions;

  const activeAlerts = forecast.alerts.filter((a) => !a.dismissed);
  const maxVolume = Math.max(...displayPredictions.map((p) => p.predictedVolume));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,white,transparent_70%)]" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Activity className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Predicción de Demanda</h2>
                <p className="text-white/80 text-sm">
                  Powered by ML • Actualizado {new Date(forecast.generatedAt).toLocaleString()}
                </p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden md:inline">Actualizar</span>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                <Package className="w-4 h-4" />
                <span>Vol. Total ({selectedPeriod}d)</span>
              </div>
              <div className="text-2xl font-bold">
                {displayPredictions.reduce((s, p) => s + p.predictedVolume, 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                <TrendingUp className="w-4 h-4" />
                <span>Promedio Diario</span>
              </div>
              <div className="text-2xl font-bold">{forecast.averageDailyVolume}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                <Zap className="w-4 h-4" />
                <span>Día Pico</span>
              </div>
              <div className="text-2xl font-bold">{forecast.peakDay.volume}</div>
              <div className="text-xs text-white/60">
                {new Date(forecast.peakDay.date).toLocaleDateString('es', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                <DollarSign className="w-4 h-4" />
                <span>Presupuesto Est.</span>
              </div>
              <div className="text-2xl font-bold">
                {formatCurrency(country, forecast.estimatedBudget.total)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {activeAlerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-white">
            <Bell className="w-5 h-5 text-orange-500" />
            Alertas de Demanda ({activeAlerts.length})
          </h3>
          <div className="space-y-2">
            {activeAlerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className={`bg-white dark:bg-navy-900 rounded-xl border-l-4 overflow-hidden transition-all ${
                  alert.severity === 'critical'
                    ? 'border-l-red-500'
                    : alert.severity === 'warning'
                      ? 'border-l-orange-500'
                      : 'border-l-blue-500'
                }`}
              >
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          alert.severity === 'critical'
                            ? 'bg-red-100 dark:bg-red-900/30'
                            : alert.severity === 'warning'
                              ? 'bg-orange-100 dark:bg-orange-900/30'
                              : 'bg-blue-100 dark:bg-blue-900/30'
                        }`}
                      >
                        <AlertTriangle
                          className={`w-5 h-5 ${
                            alert.severity === 'critical'
                              ? 'text-red-500'
                              : alert.severity === 'warning'
                                ? 'text-orange-500'
                                : 'text-blue-500'
                          }`}
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-white">{alert.title}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {alert.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(alert.date).toLocaleDateString()}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded ${
                              alert.predictedImpact > 0
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                          >
                            {alert.predictedImpact > 0 ? '+' : ''}
                            {alert.predictedImpact}% impacto
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismissAlert(alert.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <ChevronDown
                        className={`w-5 h-5 text-slate-400 transition-transform ${
                          expandedAlert === alert.id ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {expandedAlert === alert.id && (
                  <div className="px-4 pb-4 pt-0 border-t border-slate-100 dark:border-navy-800 mt-2">
                    <h5 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-2 mt-3">
                      Recomendaciones:
                    </h5>
                    <ul className="space-y-2">
                      {alert.recommendations.map((rec, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400"
                        >
                          <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Period Selector & Chart */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-slate-800 dark:text-white">Pronóstico de Volumen</h3>
          <div className="flex bg-slate-100 dark:bg-navy-800 rounded-lg p-1">
            {(['7', '30', '90'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedPeriod === period
                    ? 'bg-white dark:bg-navy-700 text-purple-600 dark:text-purple-400 shadow'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {period}d
              </button>
            ))}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="h-64 flex items-end gap-1 overflow-x-auto pb-2">
          {displayPredictions.map((pred, i) => {
            const height = (pred.predictedVolume / maxVolume) * 100;
            const isWeekend =
              new Date(pred.date).getDay() === 0 || new Date(pred.date).getDay() === 6;

            return (
              <div key={pred.date} className="flex-1 min-w-[20px] max-w-[40px] group relative">
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  <div className="font-bold">{pred.dayOfWeek}</div>
                  <div>{new Date(pred.date).toLocaleDateString()}</div>
                  <div className="text-purple-300">{pred.predictedVolume} envíos</div>
                  <div className="text-slate-400">Conf: {pred.confidenceLevel}%</div>
                </div>

                {/* Bar */}
                <div
                  className={`rounded-t transition-all cursor-pointer ${
                    pred.isPeak
                      ? 'bg-gradient-to-t from-red-500 to-orange-400'
                      : pred.isHighDemand
                        ? 'bg-gradient-to-t from-purple-500 to-violet-400'
                        : isWeekend
                          ? 'bg-slate-300 dark:bg-slate-600'
                          : 'bg-gradient-to-t from-blue-500 to-cyan-400'
                  } group-hover:opacity-80`}
                  style={{ height: `${Math.max(height, 5)}%` }}
                />

                {/* Label */}
                <div className="text-[10px] text-slate-400 text-center mt-1 truncate">
                  {displayPredictions.length <= 14
                    ? pred.dayOfWeek.substring(0, 3)
                    : i % 7 === 0
                      ? new Date(pred.date).getDate()
                      : ''}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gradient-to-r from-red-500 to-orange-400" />
            <span className="text-slate-500">Pico (+50%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gradient-to-r from-purple-500 to-violet-400" />
            <span className="text-slate-500">Alta demanda (+30%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gradient-to-r from-blue-500 to-cyan-400" />
            <span className="text-slate-500">Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-slate-300" />
            <span className="text-slate-500">Fin de semana</span>
          </div>
        </div>
      </div>

      {/* City Breakdown & Budget */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* City Breakdown */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-800 p-6">
          <h3 className="flex items-center gap-2 font-bold text-slate-800 dark:text-white mb-4">
            <MapPin className="w-5 h-5 text-purple-500" />
            Distribución por Ciudad
          </h3>
          <div className="space-y-3">
            {forecast.cityBreakdown.slice(0, 8).map((city) => (
              <div key={city.city} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {city.city}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">{city.predictedVolume}</span>
                      {city.trend !== 'stable' && (
                        <span
                          className={`flex items-center text-xs ${
                            city.trend === 'up' ? 'text-emerald-500' : 'text-red-500'
                          }`}
                        >
                          {city.trend === 'up' ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {Math.abs(city.trendPercentage)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-navy-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-violet-400 rounded-full transition-all"
                      style={{ width: `${city.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Budget Breakdown */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-800 p-6">
          <h3 className="flex items-center gap-2 font-bold text-slate-800 dark:text-white mb-4">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            Presupuesto Estimado
          </h3>

          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 mb-4">
            <div className="text-sm text-emerald-700 dark:text-emerald-400 mb-1">
              Total estimado ({selectedPeriod} días)
            </div>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(country, forecast.estimatedBudget.total)}
            </div>
            <div className="text-sm text-slate-500 mt-1">
              ~{formatCurrency(country, forecast.estimatedBudget.perDay)}/día
            </div>
          </div>

          <div className="space-y-3">
            {forecast.estimatedBudget.breakdown.map((item) => (
              <div key={item.carrierId} className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {item.carrierName}
                </span>
                <div className="text-right">
                  <span className="text-sm font-medium text-slate-800 dark:text-white">
                    {formatCurrency(country, item.amount)}
                  </span>
                  <span className="text-xs text-slate-400 ml-2">({item.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Seasonal Patterns */}
      {forecast.seasonalPatterns.length > 0 && (
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-800 p-6">
          <h3 className="flex items-center gap-2 font-bold text-slate-800 dark:text-white mb-4">
            <Calendar className="w-5 h-5 text-orange-500" />
            Eventos y Patrones Estacionales
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {forecast.seasonalPatterns.map((pattern, i) => (
              <div
                key={i}
                className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-xl p-4 border border-orange-100 dark:border-orange-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-800 dark:text-white">{pattern.name}</h4>
                  <span className="text-xs bg-orange-200 dark:bg-orange-800 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full">
                    +{pattern.averageIncrease}%
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  {new Date(pattern.startDate).toLocaleDateString()} -{' '}
                  {new Date(pattern.endDate).toLocaleDateString()}
                </p>
                <div className="flex flex-wrap gap-1">
                  {pattern.affectedCities.slice(0, 3).map((city) => (
                    <span
                      key={city}
                      className="text-[10px] bg-white dark:bg-navy-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400"
                    >
                      {city}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 flex items-start gap-4 border border-purple-100 dark:border-purple-800">
        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
          <Info className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h4 className="font-bold text-purple-800 dark:text-purple-300 mb-1">
            ¿Cómo funcionan las predicciones?
          </h4>
          <p className="text-sm text-purple-700 dark:text-purple-400">
            Nuestro modelo ML analiza tu historial de envíos (últimos 12 meses), detecta patrones
            estacionales, considera eventos especiales y días festivos para generar predicciones con
            niveles de confianza. Las predicciones mejoran con más datos históricos.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DemandTab;
