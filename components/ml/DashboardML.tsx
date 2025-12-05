/**
 * DashboardML.tsx
 * Dashboard empresarial profesional con métricas, gráficos, KPIs y alertas.
 * Sistema de análisis logístico nivel Amazon con ML integrado.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  CheckCircle,
  AlertTriangle,
  Bell,
  Truck,
  MapPin,
  Brain,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  Award,
  AlertCircle,
  Clock,
  DollarSign,
  Target,
  Zap,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Wifi,
  WifiOff,
  Shield,
  Users,
  Timer,
  Sparkles,
} from 'lucide-react';
import {
  mlApi,
  type DashboardData,
  type TransportadoraRendimiento,
  type Alerta,
  formatNumber,
  formatCurrency,
  getSeverityColor,
} from '@/lib/api-config';

// Colores para calificaciones de transportadoras
const CALIFICACION_COLORS = {
  EXCELENTE: 'bg-green-100 text-green-700 border-green-200',
  BUENO: 'bg-blue-100 text-blue-700 border-blue-200',
  REGULAR: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  MALO: 'bg-red-100 text-red-700 border-red-200',
};

// Colores para la barra de progreso según tasa de retraso
function getProgressColor(tasa: number): string {
  if (tasa < 5) return 'bg-green-500';
  if (tasa < 10) return 'bg-blue-500';
  if (tasa < 15) return 'bg-yellow-500';
  if (tasa < 25) return 'bg-orange-500';
  return 'bg-red-500';
}

// Mini gráfico de línea
function MiniChart({ data, color = 'blue' }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  const colorClasses: Record<string, string> = {
    blue: 'stroke-blue-500',
    green: 'stroke-green-500',
    orange: 'stroke-orange-500',
    purple: 'stroke-purple-500',
  };

  return (
    <svg viewBox="0 0 100 100" className="w-full h-12" preserveAspectRatio="none">
      <polyline
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={colorClasses[color] || colorClasses.blue}
        points={points}
      />
    </svg>
  );
}

/**
 * Componente principal del Dashboard ML
 */
export function DashboardML() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'transportadoras' | 'alertas'>('overview');

  // Cargar datos del dashboard
  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [dashboardData, alertasData] = await Promise.all([
        mlApi.getDashboard(),
        mlApi.listarAlertas(true),
      ]);
      setData(dashboardData);
      setAlertas(alertasData);
      setLastUpdate(new Date());
      setIsOnline(mlApi.isOnline());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar datos al montar y configurar auto-refresh
  useEffect(() => {
    cargarDatos();

    // Auto-refresh cada 60 segundos
    const interval = setInterval(cargarDatos, 60000);
    return () => clearInterval(interval);
  }, [cargarDatos]);

  // Estado de loading
  if (loading && !data) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6">
        <LoadingSkeleton />
      </div>
    );
  }

  // Estado de error sin datos
  if (error && !data) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Error cargando dashboard
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={cargarDatos}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { estadisticas_generales, rendimiento_transportadoras, top_ciudades, modelos_activos, tendencias, kpis_avanzados } = data;

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              Dashboard ML
            </h1>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
              ${isOnline
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'}`}
            >
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? 'En línea' : 'Modo Offline'}
            </span>
          </div>
          <p className="text-gray-500 mt-1">
            Sistema de análisis predictivo de logística empresarial
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdate && (
            <span className="text-sm text-gray-500">
              Actualizado: {lastUpdate.toLocaleTimeString('es-CO')}
            </span>
          )}
          <button
            onClick={cargarDatos}
            disabled={loading}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2
              transition-all duration-200 ${
                loading
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Tabs de navegación */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {[
          { id: 'overview', label: 'Resumen', icon: BarChart3 },
          { id: 'transportadoras', label: 'Transportadoras', icon: Truck },
          { id: 'alertas', label: `Alertas (${alertas.length})`, icon: Bell },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all
              ${activeTab === tab.id
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Resumen */}
      {activeTab === 'overview' && (
        <>
          {/* KPIs principales */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <KPICard
              title="Total Guías"
              value={formatNumber(estadisticas_generales.total_guias)}
              icon={Package}
              color="blue"
              trend={2.5}
            />
            <KPICard
              title="Entregadas"
              value={formatNumber(estadisticas_generales.guias_entregadas)}
              icon={CheckCircle}
              color="green"
              subtitle={`${estadisticas_generales.tasa_entrega.toFixed(1)}%`}
              trend={1.2}
            />
            <KPICard
              title="En Retraso"
              value={formatNumber(estadisticas_generales.guias_en_retraso)}
              icon={AlertTriangle}
              color="orange"
              subtitle={`${estadisticas_generales.tasa_retraso.toFixed(1)}%`}
              trend={-0.8}
              trendInverse
            />
            <KPICard
              title="Con Novedad"
              value={formatNumber(estadisticas_generales.guias_con_novedad)}
              icon={Bell}
              color="purple"
            />
            <KPICard
              title="Tiempo Prom."
              value={`${estadisticas_generales.promedio_dias_entrega} días`}
              icon={Timer}
              color="indigo"
            />
            <KPICard
              title="Costo Total"
              value={formatCurrency(estadisticas_generales.costo_total_fletes)}
              icon={DollarSign}
              color="emerald"
              subtitle={`Ahorro: ${formatCurrency(estadisticas_generales.ahorro_optimizacion)}`}
            />
          </div>

          {/* KPIs Avanzados */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5" />
              <h2 className="font-semibold">KPIs Avanzados de Logística</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold">{kpis_avanzados.otif_score}%</div>
                <div className="text-indigo-200 text-sm">OTIF Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{kpis_avanzados.nps_logistico}</div>
                <div className="text-indigo-200 text-sm">NPS Logístico</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{formatCurrency(kpis_avanzados.costo_por_entrega)}</div>
                <div className="text-indigo-200 text-sm">Costo/Entrega</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{kpis_avanzados.eficiencia_ruta}%</div>
                <div className="text-indigo-200 text-sm">Eficiencia Ruta</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{kpis_avanzados.tasa_primera_entrega}%</div>
                <div className="text-indigo-200 text-sm">1ra Entrega</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{kpis_avanzados.tiempo_ciclo_promedio}h</div>
                <div className="text-indigo-200 text-sm">Ciclo Promedio</div>
              </div>
            </div>
          </div>

          {/* Gráficos y análisis */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tendencias */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Tendencias de los últimos 30 días
              </h2>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Entregas</span>
                    <span className="text-sm text-green-600 font-semibold">
                      +{((tendencias.entregas[tendencias.entregas.length - 1] / tendencias.entregas[0] - 1) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <MiniChart data={tendencias.entregas} color="green" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Retrasos</span>
                    <span className="text-sm text-orange-600 font-semibold">
                      {tendencias.retrasos[tendencias.retrasos.length - 1]} hoy
                    </span>
                  </div>
                  <MiniChart data={tendencias.retrasos} color="orange" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Satisfacción</span>
                    <span className="text-sm text-purple-600 font-semibold">
                      {tendencias.satisfaccion[tendencias.satisfaccion.length - 1].toFixed(1)}%
                    </span>
                  </div>
                  <MiniChart data={tendencias.satisfaccion} color="purple" />
                </div>
              </div>
            </div>

            {/* Top ciudades */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-600" />
                Top 5 Ciudades
              </h2>
              <div className="space-y-3">
                {top_ciudades.map((ciudad, idx) => (
                  <CiudadRow key={idx} ciudad={ciudad} ranking={idx + 1} />
                ))}
              </div>
            </div>
          </div>

          {/* Modelos ML y Estado del Sistema */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Estado de modelos ML */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-600" />
                Sistema ML Activo
              </h2>
              <div className="space-y-3">
                {modelos_activos.map((modelo, idx) => (
                  <ModeloCard key={idx} modelo={modelo} />
                ))}
              </div>
            </div>

            {/* Resumen rápido */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-600" />
                Estado del Sistema
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <StatBox
                  label="Alertas Pendientes"
                  value={data.alertas_pendientes}
                  color="orange"
                />
                <StatBox
                  label="Modelos Activos"
                  value={modelos_activos.length}
                  color="green"
                />
                <StatBox
                  label="Transportadoras"
                  value={rendimiento_transportadoras.length}
                  color="blue"
                />
                <StatBox
                  label="Ciudades Activas"
                  value={top_ciudades.length}
                  color="purple"
                />
              </div>

              {/* Predicciones en tiempo real */}
              {data.predicciones_tiempo_real && data.predicciones_tiempo_real.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Predicciones Recientes</h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {data.predicciones_tiempo_real.slice(0, 5).map((pred, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="font-mono text-gray-600">{pred.numero_guia}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                          ${pred.nivel_riesgo === 'BAJO' ? 'bg-green-100 text-green-700' :
                            pred.nivel_riesgo === 'MEDIO' ? 'bg-yellow-100 text-yellow-700' :
                            pred.nivel_riesgo === 'ALTO' ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'}`}
                        >
                          {pred.nivel_riesgo}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Tab: Transportadoras */}
      {activeTab === 'transportadoras' && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            Rendimiento Detallado por Transportadora
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Transportadora</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Total Guías</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Entregas</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Retrasos</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Tasa Retraso</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Tiempo Prom.</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Costo Prom.</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Score</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Tendencia</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Calificación</th>
                </tr>
              </thead>
              <tbody>
                {rendimiento_transportadoras.map((t, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-900">{t.nombre}</td>
                    <td className="py-3 px-4 text-center">{formatNumber(t.total_guias)}</td>
                    <td className="py-3 px-4 text-center text-green-600">{formatNumber(t.entregas_exitosas)}</td>
                    <td className="py-3 px-4 text-center text-orange-600">{formatNumber(t.retrasos)}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getProgressColor(t.tasa_retraso)}`}
                            style={{ width: `${Math.min(t.tasa_retraso * 3, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{t.tasa_retraso.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">{t.tiempo_promedio_dias} días</td>
                    <td className="py-3 px-4 text-center">{formatCurrency(t.costo_promedio)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-semibold ${t.score_confiabilidad >= 90 ? 'text-green-600' : t.score_confiabilidad >= 80 ? 'text-blue-600' : 'text-orange-600'}`}>
                        {t.score_confiabilidad}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 text-sm font-medium
                        ${t.tendencia_mensual > 0 ? 'text-green-600' : t.tendencia_mensual < 0 ? 'text-red-600' : 'text-gray-600'}`}
                      >
                        {t.tendencia_mensual > 0 ? <ArrowUpRight className="w-4 h-4" /> : t.tendencia_mensual < 0 ? <ArrowDownRight className="w-4 h-4" /> : null}
                        {t.tendencia_mensual > 0 ? '+' : ''}{t.tendencia_mensual}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${CALIFICACION_COLORS[t.calificacion]}`}>
                        {t.calificacion}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Alertas */}
      {activeTab === 'alertas' && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-600" />
            Alertas del Sistema
          </h2>
          {alertas.length > 0 ? (
            <div className="space-y-4">
              {alertas.map((alerta) => (
                <AlertaCard key={alerta.id} alerta={alerta} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">Sin alertas activas</h3>
              <p className="text-gray-500">El sistema está funcionando correctamente</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Tarjeta de KPI principal
 */
interface KPICardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'indigo' | 'emerald';
  subtitle?: string;
  trend?: number;
  trendInverse?: boolean;
}

function KPICard({ title, value, icon: Icon, color, subtitle, trend, trendInverse }: KPICardProps) {
  const colorClasses = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
    green: { bg: 'bg-green-100', text: 'text-green-600' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
  };

  const isPositiveTrend = trendInverse ? (trend && trend < 0) : (trend && trend > 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg ${colorClasses[color].bg}`}>
          <Icon className={`w-5 h-5 ${colorClasses[color].text}`} />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-medium flex items-center gap-0.5
            ${isPositiveTrend ? 'text-green-600' : 'text-red-600'}`}
          >
            {isPositiveTrend ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500">{title}</div>
        {subtitle && (
          <div className="text-xs text-gray-400 mt-1">{subtitle}</div>
        )}
      </div>
    </div>
  );
}

/**
 * Fila de ciudad
 */
function CiudadRow({ ciudad, ranking }: { ciudad: { ciudad: string; departamento?: string; total_guias: number; porcentaje_del_total: number; tasa_exito: number; tiempo_promedio: number }; ranking: number }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
        <span className="text-sm font-bold text-purple-600">{ranking}</span>
      </div>
      <div className="flex-1">
        <div className="font-medium text-gray-900">{ciudad.ciudad}</div>
        <div className="text-xs text-gray-500">
          {formatNumber(ciudad.total_guias)} guías · {ciudad.tasa_exito.toFixed(1)}% éxito
        </div>
      </div>
      <div className="text-right">
        <div className="font-semibold text-gray-700">{ciudad.porcentaje_del_total.toFixed(1)}%</div>
        <div className="text-xs text-gray-400">{ciudad.tiempo_promedio} días</div>
      </div>
    </div>
  );
}

/**
 * Tarjeta de modelo ML
 */
function ModeloCard({ modelo }: { modelo: { nombre: string; version: string; accuracy: number; fecha_entrenamiento: string; estado: string; predicciones_hoy: number; precision: number; recall: number } }) {
  return (
    <div className="bg-white rounded-lg p-4 border border-indigo-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-600" />
          <span className="font-medium text-gray-900">{modelo.nombre}</span>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium
          ${modelo.estado === 'ACTIVO' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
        >
          {modelo.estado}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-lg font-bold text-indigo-600">{(modelo.accuracy * 100).toFixed(1)}%</div>
          <div className="text-xs text-gray-500">Accuracy</div>
        </div>
        <div>
          <div className="text-lg font-bold text-blue-600">{(modelo.precision * 100).toFixed(1)}%</div>
          <div className="text-xs text-gray-500">Precision</div>
        </div>
        <div>
          <div className="text-lg font-bold text-purple-600">{formatNumber(modelo.predicciones_hoy)}</div>
          <div className="text-xs text-gray-500">Hoy</div>
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-400 text-center">
        v{modelo.version} · Entrenado: {new Date(modelo.fecha_entrenamiento).toLocaleDateString('es-CO')}
      </div>
    </div>
  );
}

/**
 * Caja de estadística
 */
function StatBox({ label, value, color }: { label: string; value: number; color: 'orange' | 'green' | 'blue' | 'purple' }) {
  const colorClasses = {
    orange: 'text-orange-600',
    green: 'text-green-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 text-center">
      <div className={`text-3xl font-bold ${colorClasses[color]}`}>{value}</div>
      <div className="text-sm text-gray-600 mt-1">{label}</div>
    </div>
  );
}

/**
 * Tarjeta de alerta
 */
function AlertaCard({ alerta }: { alerta: Alerta }) {
  const severityIcon = {
    INFO: AlertCircle,
    WARNING: AlertTriangle,
    ERROR: AlertCircle,
    CRITICAL: Zap,
  };
  const Icon = severityIcon[alerta.severidad] || AlertCircle;

  return (
    <div className={`rounded-lg p-4 border ${getSeverityColor(alerta.severidad)}`}>
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{alerta.titulo}</h3>
            <span className="text-xs opacity-75">
              {new Date(alerta.fecha).toLocaleString('es-CO')}
            </span>
          </div>
          <p className="text-sm mt-1 opacity-90">{alerta.descripcion}</p>
          {alerta.accion_sugerida && (
            <div className="mt-2 pt-2 border-t border-current/20">
              <span className="text-xs font-medium">Acción sugerida:</span>
              <p className="text-sm">{alerta.accion_sugerida}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton de loading
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-48" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-xl h-28" />
        ))}
      </div>
      <div className="bg-gray-200 rounded-xl h-24" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-200 rounded-xl h-80" />
        <div className="bg-gray-200 rounded-xl h-80" />
      </div>
    </div>
  );
}

export default DashboardML;
