/**
 * DashboardML.tsx
 * Dashboard completo con métricas y estadísticas del sistema ML de logística.
 * Muestra KPIs, rendimiento de transportadoras, ciudades top y estado de modelos.
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
  Database,
  Info,
} from 'lucide-react';
import { getDashboardWithFallback, type DashboardData, type TransportadoraRendimiento, formatNumber } from '@/lib/api-config';

// Colores para calificaciones de transportadoras
const CALIFICACION_COLORS = {
  EXCELENTE: 'bg-green-100 text-green-700 border-green-200',
  BUENO: 'bg-blue-100 text-blue-700 border-blue-200',
  REGULAR: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  MALO: 'bg-red-100 text-red-700 border-red-200',
};

// Colores para la barra de progreso según tasa de retraso
function getProgressColor(tasa: number): string {
  if (tasa < 10) return 'bg-green-500';
  if (tasa < 20) return 'bg-yellow-500';
  if (tasa < 30) return 'bg-orange-500';
  return 'bg-red-500';
}

/**
 * Componente principal del Dashboard ML
 */
export function DashboardML() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Cargar datos del dashboard (con fallback a modo demo)
  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: dashboardData, isDemo } = await getDashboardWithFallback();
      setData(dashboardData);
      setIsDemoMode(isDemo);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar datos al montar
  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Estado de loading
  if (loading && !data) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6">
        <LoadingSkeleton />
      </div>
    );
  }

  // Estado de error - mostrar datos demo si hay error
  if (error && !data) {
    // Intentar cargar datos de nuevo automáticamente (el fallback debería funcionar)
    cargarDatos();
    return (
      <div className="w-full max-w-7xl mx-auto p-6">
        <LoadingSkeleton />
      </div>
    );
  }

  if (!data) return null;

  const { estadisticas_generales, rendimiento_transportadoras, top_ciudades, modelos_activos, alertas_pendientes } = data;

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Banner modo demo */}
      {isDemoMode && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                Modo Demostración Activo
                <span className="px-2 py-0.5 bg-blue-200 text-blue-800 text-xs rounded-full">
                  DEMO
                </span>
              </h3>
              <p className="text-blue-700 text-sm mt-1">
                Los datos mostrados son de ejemplo. El dashboard está funcionando con datos simulados
                porque el backend no está disponible. Todas las funcionalidades de visualización están activas.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-blue-600">
              <Info className="w-4 h-4" />
              <span>Datos simulados</span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Dashboard ML
            {isDemoMode && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                Demo
              </span>
            )}
          </h1>
          <p className="text-gray-500">
            Sistema de análisis y predicción de logística
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

      {/* Métricas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Guías"
          value={formatNumber(estadisticas_generales.total_guias)}
          icon={Package}
          color="blue"
          subtitle="Registradas en el sistema"
        />
        <MetricCard
          title="Entregadas"
          value={formatNumber(estadisticas_generales.guias_entregadas)}
          icon={CheckCircle}
          color="green"
          subtitle={`${estadisticas_generales.tasa_entrega.toFixed(1)}% de éxito`}
          trend={estadisticas_generales.tasa_entrega > 80 ? 'up' : 'down'}
        />
        <MetricCard
          title="En Retraso"
          value={formatNumber(estadisticas_generales.guias_en_retraso)}
          icon={AlertTriangle}
          color="orange"
          subtitle={`${estadisticas_generales.tasa_retraso.toFixed(1)}% del total`}
          trend={estadisticas_generales.tasa_retraso < 15 ? 'up' : 'down'}
        />
        <MetricCard
          title="Con Novedad"
          value={formatNumber(estadisticas_generales.guias_con_novedad)}
          icon={Bell}
          color="purple"
          subtitle="Requieren atención"
        />
      </div>

      {/* Sección de transportadoras y ciudades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rendimiento de transportadoras */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            Rendimiento por Transportadora
          </h2>
          <div className="space-y-4">
            {rendimiento_transportadoras.length > 0 ? (
              rendimiento_transportadoras.map((transportadora, idx) => (
                <TransportadoraRow key={idx} transportadora={transportadora} />
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">
                No hay datos de transportadoras disponibles
              </p>
            )}
          </div>
        </div>

        {/* Top ciudades */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-purple-600" />
            Top 5 Ciudades Destino
          </h2>
          <div className="space-y-3">
            {top_ciudades.length > 0 ? (
              top_ciudades.map((ciudad, idx) => (
                <CiudadRow key={idx} ciudad={ciudad} ranking={idx + 1} />
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">
                No hay datos de ciudades disponibles
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Sección de modelos ML y alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estado de modelos ML */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-600" />
            Sistema ML Activo
          </h2>
          {modelos_activos.length > 0 ? (
            <div className="space-y-3">
              {modelos_activos.map((modelo, idx) => (
                <ModeloCard key={idx} modelo={modelo} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-indigo-300 mx-auto mb-3" />
              <p className="text-indigo-700 font-medium">
                No hay modelos entrenados
              </p>
              <p className="text-indigo-600 text-sm">
                Carga datos y entrena los modelos
              </p>
            </div>
          )}
        </div>

        {/* Alertas pendientes */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-orange-600" />
            Estado del Sistema
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-orange-600">
                {alertas_pendientes}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Alertas Pendientes
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-600">
                {modelos_activos.length}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Modelos Activos
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">
                {rendimiento_transportadoras.length}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Transportadoras
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-purple-600">
                {top_ciudades.length}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Ciudades Activas
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Tarjeta de métrica principal
 */
interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'orange' | 'purple';
  subtitle?: string;
  trend?: 'up' | 'down';
}

function MetricCard({ title, value, icon: Icon, color, subtitle, trend }: MetricCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600',
  };

  const iconBgClasses = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    orange: 'bg-orange-100',
    purple: 'bg-purple-100',
  };

  const iconColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    purple: 'text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl ${iconBgClasses[color]}`}>
          <Icon className={`w-6 h-6 ${iconColorClasses[color]}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium
            ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend === 'up' ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
          </div>
        )}
      </div>
      <div className="mt-4">
        <div className="text-3xl font-bold text-gray-900">{value}</div>
        <div className="text-sm font-medium text-gray-500 mt-1">{title}</div>
        {subtitle && (
          <div className="text-xs text-gray-400 mt-1">{subtitle}</div>
        )}
      </div>
    </div>
  );
}

/**
 * Fila de transportadora
 */
function TransportadoraRow({ transportadora }: { transportadora: TransportadoraRendimiento }) {
  const calificacionClass = CALIFICACION_COLORS[transportadora.calificacion] || CALIFICACION_COLORS.REGULAR;

  return (
    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">
            {transportadora.nombre}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${calificacionClass}`}>
            {transportadora.calificacion}
          </span>
        </div>
        <div className="text-sm text-gray-500 mt-1">
          {formatNumber(transportadora.total_guias)} guías ·
          {formatNumber(transportadora.retrasos)} retrasos ·
          {transportadora.tiempo_promedio_dias} días prom.
        </div>
        {/* Barra de progreso */}
        <div className="mt-2">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor(transportadora.tasa_retraso)}`}
              style={{ width: `${Math.min(transportadora.tasa_retraso, 100)}%` }}
            />
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-lg font-bold text-gray-900">
          {transportadora.tasa_retraso.toFixed(1)}%
        </div>
        <div className="text-xs text-gray-500">tasa retraso</div>
      </div>
    </div>
  );
}

/**
 * Fila de ciudad
 */
function CiudadRow({ ciudad, ranking }: { ciudad: { ciudad: string; total_guias: number; porcentaje_del_total: number }; ranking: number }) {
  return (
    <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
        <span className="text-sm font-bold text-purple-600">{ranking}</span>
      </div>
      <div className="flex-1">
        <div className="font-medium text-gray-900 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-purple-500" />
          {ciudad.ciudad}
        </div>
        <div className="text-sm text-gray-500">
          {formatNumber(ciudad.total_guias)} guías
        </div>
      </div>
      <div className="text-right">
        <div className="text-lg font-semibold text-gray-700">
          {ciudad.porcentaje_del_total.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}

/**
 * Tarjeta de modelo ML
 */
function ModeloCard({ modelo }: { modelo: { nombre: string; version: string; accuracy: number; fecha_entrenamiento: string; estado: string } }) {
  return (
    <div className="bg-white rounded-lg p-4 border border-indigo-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-600" />
          <span className="font-medium text-gray-900">{modelo.nombre}</span>
        </div>
        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
          {modelo.estado}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="text-gray-500">v{modelo.version}</span>
        <span className="font-semibold text-indigo-600">
          {(modelo.accuracy * 100).toFixed(1)}% accuracy
        </span>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-xl h-32" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-200 rounded-xl h-80" />
        <div className="bg-gray-200 rounded-xl h-80" />
      </div>
    </div>
  );
}

export default DashboardML;
