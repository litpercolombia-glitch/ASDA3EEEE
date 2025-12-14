// ============================================
// LITPER - METRICS DASHBOARD
// Dashboard de Métricas e KPIs de Inteligencia Logística
// ============================================

import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Package,
  Truck,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Award,
  RefreshCw,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { CarrierName } from '../../types';
import {
  LinkedGuide,
  IntelligenceKPIs,
  CarrierMetrics,
  CityMetrics,
  DailyMetrics,
} from '../../types/intelligenceModule';

interface MetricsDashboardProps {
  guides: Map<string, LinkedGuide>;
  onViewDetails?: (type: 'alerts' | 'carriers' | 'cities' | 'risk') => void;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  trendLabel?: string;
  icon: React.ElementType;
  color: string;
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  icon: Icon,
  color,
  onClick,
}) => {
  const getTrendColor = (t: number) => {
    if (t > 0) return 'text-green-600';
    if (t < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const getTrendIcon = (t: number) => {
    if (t > 0) return ArrowUpRight;
    if (t < 0) return ArrowDownRight;
    return Minus;
  };

  const TrendIcon = trend !== undefined ? getTrendIcon(trend) : null;

  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {onClick && (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </div>
      <div className="space-y-1">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        {(subtitle || trend !== undefined) && (
          <div className="flex items-center gap-2">
            {trend !== undefined && TrendIcon && (
              <span className={`flex items-center gap-0.5 text-xs font-medium ${getTrendColor(trend)}`}>
                <TrendIcon className="w-3 h-3" />
                {Math.abs(trend)}%
              </span>
            )}
            {trendLabel && (
              <span className="text-xs text-gray-400">{trendLabel}</span>
            )}
            {subtitle && !trend && (
              <span className="text-xs text-gray-500">{subtitle}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const RiskGauge: React.FC<{ score: number }> = ({ score }) => {
  const getColor = () => {
    if (score >= 80) return '#ef4444';
    if (score >= 60) return '#f97316';
    if (score >= 40) return '#eab308';
    return '#22c55e';
  };

  const getLabel = () => {
    if (score >= 80) return 'CRÍTICO';
    if (score >= 60) return 'ALTO';
    if (score >= 40) return 'MEDIO';
    return 'BAJO';
  };

  return (
    <div className="relative w-24 h-24">
      <svg className="w-24 h-24 transform -rotate-90">
        <circle
          cx="48"
          cy="48"
          r="40"
          stroke="#e5e7eb"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx="48"
          cy="48"
          r="40"
          stroke={getColor()}
          strokeWidth="8"
          fill="none"
          strokeDasharray={`${(score / 100) * 251.2} 251.2`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-800">{score}</span>
        <span className="text-[10px] font-medium" style={{ color: getColor() }}>
          {getLabel()}
        </span>
      </div>
    </div>
  );
};

const MiniBarChart: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="text-xs text-gray-500 w-20 truncate">{item.label}</span>
          <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(item.value / maxValue) * 100}%`,
                backgroundColor: item.color,
              }}
            />
          </div>
          <span className="text-xs font-medium text-gray-700 w-12 text-right">
            {item.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({
  guides,
  onViewDetails,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('week');

  // Calculate all metrics
  const metrics = useMemo(() => {
    const all = Array.from(guides.values());

    // Basic counts
    const total = all.length;
    const delivered = all.filter(g => g.estadoActual === 'Entregado').length;
    const inTransit = all.filter(g =>
      g.estadoActual === 'En Reparto' || g.estadoActual === 'Pendiente'
    ).length;
    const withNovelties = all.filter(g =>
      g.novedadesRegistradas.some(n => n.estado === 'PENDIENTE' || n.estado === 'EN_GESTION')
    ).length;
    const atRisk = all.filter(g => g.scoreRiesgo >= 70).length;
    const criticalAlerts = all.filter(g => g.scoreRiesgo >= 80).length;

    // Success rate
    const successRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

    // Average risk score
    const avgRiskScore = total > 0
      ? Math.round(all.reduce((sum, g) => sum + g.scoreRiesgo, 0) / total)
      : 0;

    // Average transit time
    const avgTransitDays = total > 0
      ? Math.round(
          all.reduce((sum, g) => {
            const match = g.tiempoTotalTransito.match(/(\d+)d/);
            return sum + (match ? parseInt(match[1]) : 0);
          }, 0) / total
        )
      : 0;

    // By carrier
    const byCarrier = all.reduce((acc, g) => {
      const carrier = g.transportadora;
      if (!acc[carrier]) {
        acc[carrier] = { total: 0, delivered: 0, issues: 0 };
      }
      acc[carrier].total++;
      if (g.estadoActual === 'Entregado') acc[carrier].delivered++;
      if (g.novedadesRegistradas.some(n => n.estado !== 'RESUELTA')) acc[carrier].issues++;
      return acc;
    }, {} as Record<string, { total: number; delivered: number; issues: number }>);

    // By city
    const byCity = all.reduce((acc, g) => {
      const city = g.ciudadDestino || 'Desconocida';
      if (!acc[city]) {
        acc[city] = { total: 0, delivered: 0, issues: 0 };
      }
      acc[city].total++;
      if (g.estadoActual === 'Entregado') acc[city].delivered++;
      if (g.scoreRiesgo >= 70) acc[city].issues++;
      return acc;
    }, {} as Record<string, { total: number; delivered: number; issues: number }>);

    // Top problematic cities
    const problematicCities = Object.entries(byCity)
      .map(([city, data]) => ({
        city,
        issueRate: data.total > 0 ? (data.issues / data.total) * 100 : 0,
        total: data.total,
      }))
      .filter(c => c.total >= 3)
      .sort((a, b) => b.issueRate - a.issueRate)
      .slice(0, 5);

    // Return metrics for return
    const failedAttempts = all.filter(g => g.intentosEntrega >= 2).length;
    const inPuntoDropo = all.filter(g => {
      const status = g.historial[0]?.carrierStatus?.toLowerCase() || '';
      return status.includes('punto') || status.includes('oficina');
    }).length;

    // Estimated loss (average $40,000 per return)
    const estimatedLoss = atRisk * 40000;

    // Carrier performance data
    const carrierData = Object.entries(byCarrier).map(([name, data]) => ({
      label: name,
      value: data.total,
      color: name.includes('Coordinadora') ? '#f97316' :
             name.includes('Inter') ? '#3b82f6' :
             name.includes('Envía') ? '#22c55e' :
             name.includes('TCC') ? '#8b5cf6' : '#6b7280',
    }));

    // Status distribution
    const statusData = [
      { label: 'Entregado', value: delivered, color: '#22c55e' },
      { label: 'En Tránsito', value: inTransit, color: '#3b82f6' },
      { label: 'Con Novedad', value: withNovelties, color: '#f97316' },
      { label: 'En Riesgo', value: atRisk, color: '#ef4444' },
    ];

    return {
      total,
      delivered,
      inTransit,
      withNovelties,
      atRisk,
      criticalAlerts,
      successRate,
      avgRiskScore,
      avgTransitDays,
      failedAttempts,
      inPuntoDropo,
      estimatedLoss,
      carrierData,
      statusData,
      problematicCities,
      byCarrier,
    };
  }, [guides]);

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-orange-500" />
          Dashboard de Métricas
        </h2>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {(['today', 'week', 'month'] as const).map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                selectedPeriod === period
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {period === 'today' ? 'Hoy' : period === 'week' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Guías"
          value={metrics.total.toLocaleString()}
          subtitle="activas"
          icon={Package}
          color="bg-blue-500"
        />
        <MetricCard
          title="Tasa de Entrega"
          value={`${metrics.successRate}%`}
          trend={5}
          trendLabel="vs semana anterior"
          icon={CheckCircle}
          color="bg-green-500"
        />
        <MetricCard
          title="En Riesgo"
          value={metrics.atRisk}
          subtitle={`${metrics.criticalAlerts} críticas`}
          icon={AlertTriangle}
          color="bg-red-500"
          onClick={() => onViewDetails?.('risk')}
        />
        <MetricCard
          title="Tiempo Promedio"
          value={`${metrics.avgTransitDays}d`}
          trend={-8}
          trendLabel="mejora"
          icon={Clock}
          color="bg-purple-500"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white rounded-lg border border-gray-100 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Truck className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-gray-500">En Tránsito</span>
          </div>
          <p className="text-xl font-bold text-gray-800">{metrics.inTransit}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-gray-500">Con Novedad</span>
          </div>
          <p className="text-xl font-bold text-gray-800">{metrics.withNovelties}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-3">
          <div className="flex items-center gap-2 mb-1">
            <RefreshCw className="w-4 h-4 text-orange-500" />
            <span className="text-xs text-gray-500">2+ Intentos</span>
          </div>
          <p className="text-xl font-bold text-gray-800">{metrics.failedAttempts}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-3">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-red-500" />
            <span className="text-xs text-gray-500">En Oficina</span>
          </div>
          <p className="text-xl font-bold text-gray-800">{metrics.inPuntoDropo}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-3">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-red-500" />
            <span className="text-xs text-gray-500">Pérdida Est.</span>
          </div>
          <p className="text-xl font-bold text-gray-800">
            ${(metrics.estimatedLoss / 1000).toFixed(0)}K
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Risk Score Gauge */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-orange-500" />
            Score de Riesgo Promedio
          </h3>
          <div className="flex items-center justify-center">
            <RiskGauge score={metrics.avgRiskScore} />
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2 text-center">
            <div>
              <div className="w-full h-1.5 bg-green-500 rounded-full mb-1" />
              <span className="text-[10px] text-gray-500">0-39</span>
            </div>
            <div>
              <div className="w-full h-1.5 bg-yellow-500 rounded-full mb-1" />
              <span className="text-[10px] text-gray-500">40-59</span>
            </div>
            <div>
              <div className="w-full h-1.5 bg-orange-500 rounded-full mb-1" />
              <span className="text-[10px] text-gray-500">60-79</span>
            </div>
            <div>
              <div className="w-full h-1.5 bg-red-500 rounded-full mb-1" />
              <span className="text-[10px] text-gray-500">80-100</span>
            </div>
          </div>
        </div>

        {/* By Carrier */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <Truck className="w-4 h-4 text-blue-500" />
            Por Transportadora
          </h3>
          <MiniBarChart data={metrics.carrierData} />
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-purple-500" />
            Distribución de Estados
          </h3>
          <MiniBarChart data={metrics.statusData} />
        </div>
      </div>

      {/* Problematic Cities & Alerts */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Top Problematic Cities */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-500" />
            Ciudades con Mayor Riesgo
          </h3>
          {metrics.problematicCities.length > 0 ? (
            <div className="space-y-2">
              {metrics.problematicCities.map((city, index) => (
                <div
                  key={city.city}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      index === 0 ? 'bg-red-100 text-red-700' :
                      index === 1 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="text-sm text-gray-700">{city.city}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-medium ${
                      city.issueRate >= 50 ? 'text-red-600' :
                      city.issueRate >= 30 ? 'text-orange-600' :
                      'text-amber-600'
                    }`}>
                      {city.issueRate.toFixed(0)}% riesgo
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      ({city.total} guías)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Sin datos suficientes</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Acciones Rápidas
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onViewDetails?.('alerts')}
              className="flex items-center gap-2 p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-700">Ver Alertas</p>
                <p className="text-xs text-gray-500">{metrics.criticalAlerts} críticas</p>
              </div>
            </button>
            <button
              onClick={() => onViewDetails?.('carriers')}
              className="flex items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <Truck className="w-5 h-5 text-blue-500" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-700">Transportadoras</p>
                <p className="text-xs text-gray-500">Performance</p>
              </div>
            </button>
            <button
              onClick={() => onViewDetails?.('cities')}
              className="flex items-center gap-2 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <MapPin className="w-5 h-5 text-purple-500" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-700">Por Ciudad</p>
                <p className="text-xs text-gray-500">Análisis geográfico</p>
              </div>
            </button>
            <button
              onClick={() => onViewDetails?.('risk')}
              className="flex items-center gap-2 p-3 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
            >
              <Activity className="w-5 h-5 text-amber-500" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-700">En Riesgo</p>
                <p className="text-xs text-gray-500">{metrics.atRisk} guías</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-between text-xs text-gray-400 px-2">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Última actualización: {new Date().toLocaleString('es-CO')}
        </span>
        <span>
          Meta entregas: 85% | Actual: {metrics.successRate}%
        </span>
      </div>
    </div>
  );
};

export default MetricsDashboard;
