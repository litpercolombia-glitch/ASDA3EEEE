// components/Dashboard/ExecutiveKPIs.tsx
// Dashboard Ejecutivo con KPIs nivel Amazon
import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  Truck,
  MapPin,
  BarChart3,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from 'lucide-react';
import { Shipment, ShipmentStatus, CarrierName } from '../../types';

// ============================================
// INTERFACES
// ============================================

interface ExecutiveKPIsProps {
  shipments: Shipment[];
  previousPeriodStats?: {
    deliveryRate: number;
    returnRate: number;
    avgDeliveryDays: number;
  };
  onMetricClick?: (metricId: string, data?: any) => void;
}

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: 'green' | 'red' | 'amber' | 'blue' | 'purple' | 'cyan';
  size?: 'large' | 'small';
  onClick?: () => void;
}

// ============================================
// COMPONENTE GAUGE VISUAL
// ============================================

const GaugeChart: React.FC<{
  value: number;
  target: number;
  label: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ value, target, label, color, size = 'md' }) => {
  const percentage = Math.min((value / target) * 100, 100);
  const isAboveTarget = value <= target;
  const radius = size === 'lg' ? 60 : size === 'md' ? 45 : 35;
  const strokeWidth = size === 'lg' ? 10 : size === 'md' ? 8 : 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference * 0.75;

  return (
    <div className="relative flex flex-col items-center">
      <svg
        width={radius * 2 + strokeWidth * 2}
        height={radius * 1.5 + strokeWidth * 2}
        className="transform -rotate-90"
      >
        {/* Background arc */}
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          className="text-slate-700"
        />
        {/* Value arc */}
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          fill="none"
          stroke={isAboveTarget ? '#22c55e' : color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {/* Center value */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-bold ${size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-2xl' : 'text-xl'} ${isAboveTarget ? 'text-green-400' : 'text-amber-400'}`}>
          {value.toFixed(1)}%
        </span>
        <span className="text-xs text-slate-400">Meta: {target}%</span>
      </div>
      <span className="mt-1 text-xs font-medium text-slate-300">{label}</span>
    </div>
  );
};

// ============================================
// COMPONENTE KPI CARD
// ============================================

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color,
  size = 'small',
  onClick,
}) => {
  const colorClasses = {
    green: 'from-emerald-500/20 to-green-500/10 border-emerald-500/30 text-emerald-400',
    red: 'from-red-500/20 to-rose-500/10 border-red-500/30 text-red-400',
    amber: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400',
    blue: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-400',
    purple: 'from-purple-500/20 to-violet-500/10 border-purple-500/30 text-purple-400',
    cyan: 'from-cyan-500/20 to-teal-500/10 border-cyan-500/30 text-cyan-400',
  };

  const iconBgClasses = {
    green: 'bg-emerald-500/20',
    red: 'bg-red-500/20',
    amber: 'bg-amber-500/20',
    blue: 'bg-blue-500/20',
    purple: 'bg-purple-500/20',
    cyan: 'bg-cyan-500/20',
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-xl p-4
        bg-gradient-to-br ${colorClasses[color].split(' ').slice(0, 2).join(' ')}
        border ${colorClasses[color].split(' ')[2]}
        transition-all duration-300 hover:scale-[1.02] hover:shadow-lg
        ${onClick ? 'cursor-pointer' : ''}
        ${size === 'large' ? 'col-span-2' : ''}
      `}
    >
      {/* Icon */}
      <div className={`inline-flex p-2 rounded-lg ${iconBgClasses[color]} mb-3`}>
        {icon}
      </div>

      {/* Title */}
      <p className="text-xs font-medium text-slate-400 mb-1">{title}</p>

      {/* Value */}
      <div className="flex items-end gap-2">
        <span className={`text-2xl font-bold ${colorClasses[color].split(' ')[3]}`}>
          {value}
        </span>
        {trend && (
          <span className={`flex items-center text-xs font-medium ${trend.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend.value}%
          </span>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-[10px] text-slate-500 mt-1">{subtitle}</p>
      )}
    </div>
  );
};

// ============================================
// MINI BAR CHART
// ============================================

const MiniBarChart: React.FC<{
  data: { label: string; value: number; color: string }[];
  maxValue?: number;
}> = ({ data, maxValue }) => {
  const max = maxValue || Math.max(...data.map(d => d.value));

  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 w-20 truncate">{item.label}</span>
          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${item.color}`}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-slate-300 w-8 text-right">{item.value}</span>
        </div>
      ))}
    </div>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const ExecutiveKPIs: React.FC<ExecutiveKPIsProps> = ({
  shipments,
  previousPeriodStats,
  onMetricClick,
}) => {
  // Calcular métricas
  const metrics = useMemo(() => {
    const total = shipments.length;
    if (total === 0) {
      return {
        total: 0,
        delivered: 0,
        inTransit: 0,
        withIssue: 0,
        inOffice: 0,
        pending: 0,
        deliveryRate: 0,
        returnRate: 0,
        avgDays: 0,
        byCarrier: {},
        byCity: {},
        criticalCount: 0,
        rescuable: 0,
      };
    }

    const delivered = shipments.filter(s => s.status === ShipmentStatus.DELIVERED).length;
    const inTransit = shipments.filter(s => s.status === ShipmentStatus.IN_TRANSIT).length;
    const withIssue = shipments.filter(s => s.status === ShipmentStatus.ISSUE).length;
    const inOffice = shipments.filter(s => s.status === ShipmentStatus.IN_OFFICE).length;
    const pending = shipments.filter(s => s.status === ShipmentStatus.PENDING).length;

    // Días promedio de entrega
    const deliveredWithDays = shipments.filter(
      s => s.status === ShipmentStatus.DELIVERED && s.detailedInfo?.daysInTransit
    );
    const avgDays = deliveredWithDays.length > 0
      ? deliveredWithDays.reduce((sum, s) => sum + (s.detailedInfo?.daysInTransit || 0), 0) / deliveredWithDays.length
      : 0;

    // Guías críticas (sin movimiento +5 días o en oficina +3 días)
    const criticalCount = shipments.filter(s => {
      const days = s.detailedInfo?.daysInTransit || 0;
      return (days >= 5 && s.status !== ShipmentStatus.DELIVERED) ||
             (s.status === ShipmentStatus.IN_OFFICE && days >= 3);
    }).length;

    // Guías rescatables
    const rescuable = shipments.filter(s =>
      s.status === ShipmentStatus.ISSUE ||
      s.status === ShipmentStatus.IN_OFFICE
    ).length;

    // Por transportadora
    const byCarrier: Record<string, { total: number; delivered: number }> = {};
    shipments.forEach(s => {
      const carrier = s.carrier || CarrierName.UNKNOWN;
      if (!byCarrier[carrier]) byCarrier[carrier] = { total: 0, delivered: 0 };
      byCarrier[carrier].total++;
      if (s.status === ShipmentStatus.DELIVERED) byCarrier[carrier].delivered++;
    });

    // Por ciudad (top 5 con problemas)
    const byCity: Record<string, number> = {};
    shipments.filter(s => s.status === ShipmentStatus.ISSUE || s.status === ShipmentStatus.IN_OFFICE)
      .forEach(s => {
        const city = s.detailedInfo?.destination || 'Desconocida';
        byCity[city] = (byCity[city] || 0) + 1;
      });

    return {
      total,
      delivered,
      inTransit,
      withIssue,
      inOffice,
      pending,
      deliveryRate: (delivered / total) * 100,
      returnRate: ((withIssue + inOffice) / total) * 100,
      avgDays,
      byCarrier,
      byCity,
      criticalCount,
      rescuable,
    };
  }, [shipments]);

  // Datos para gráfico de transportadoras
  const carrierChartData = useMemo(() => {
    return Object.entries(metrics.byCarrier)
      .map(([carrier, data]) => ({
        label: carrier,
        value: data.total,
        deliveryRate: data.total > 0 ? (data.delivered / data.total) * 100 : 0,
        color: data.total > 0 && (data.delivered / data.total) >= 0.85
          ? 'bg-emerald-500'
          : data.total > 0 && (data.delivered / data.total) >= 0.7
          ? 'bg-amber-500'
          : 'bg-red-500',
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [metrics.byCarrier]);

  // Datos para gráfico de ciudades problemáticas
  const cityChartData = useMemo(() => {
    return Object.entries(metrics.byCity)
      .map(([city, count]) => ({
        label: city,
        value: count,
        color: count > 10 ? 'bg-red-500' : count > 5 ? 'bg-amber-500' : 'bg-blue-500',
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [metrics.byCity]);

  // Trends
  const deliveryTrend = previousPeriodStats
    ? { value: Math.abs(metrics.deliveryRate - previousPeriodStats.deliveryRate), isPositive: metrics.deliveryRate >= previousPeriodStats.deliveryRate }
    : undefined;

  const returnTrend = previousPeriodStats
    ? { value: Math.abs(metrics.returnRate - previousPeriodStats.returnRate), isPositive: metrics.returnRate <= previousPeriodStats.returnRate }
    : undefined;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            Dashboard Ejecutivo
          </h2>
          <p className="text-xs text-slate-400">
            {metrics.total} guías cargadas | Última actualización: {new Date().toLocaleTimeString('es-CO')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            metrics.returnRate <= 8 ? 'bg-emerald-500/20 text-emerald-400' :
            metrics.returnRate <= 12 ? 'bg-amber-500/20 text-amber-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {metrics.returnRate <= 8 ? 'EN META' : metrics.returnRate <= 12 ? 'ALERTA' : 'CRÍTICO'}
          </span>
        </div>
      </div>

      {/* Gauges principales */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
        <div className="flex flex-col items-center">
          <GaugeChart
            value={metrics.deliveryRate}
            target={85}
            label="Tasa de Entrega"
            color="#f59e0b"
            size="md"
          />
        </div>
        <div className="flex flex-col items-center">
          <GaugeChart
            value={metrics.returnRate}
            target={8}
            label="Tasa de Devolución"
            color="#ef4444"
            size="md"
          />
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 gap-3">
        <KPICard
          title="Guías Activas"
          value={metrics.total}
          subtitle="Total cargadas"
          icon={<Package className="w-4 h-4 text-blue-400" />}
          color="blue"
          onClick={() => onMetricClick?.('total')}
        />
        <KPICard
          title="Entregadas"
          value={metrics.delivered}
          subtitle={`${metrics.deliveryRate.toFixed(1)}% del total`}
          icon={<CheckCircle className="w-4 h-4 text-emerald-400" />}
          color="green"
          trend={deliveryTrend}
          onClick={() => onMetricClick?.('delivered')}
        />
        <KPICard
          title="En Riesgo"
          value={metrics.criticalCount}
          subtitle="Requieren acción urgente"
          icon={<AlertTriangle className="w-4 h-4 text-red-400" />}
          color="red"
          onClick={() => onMetricClick?.('critical')}
        />
        <KPICard
          title="Rescatables"
          value={metrics.rescuable}
          subtitle={`Potencial: -${((metrics.rescuable * 0.75) / metrics.total * 100).toFixed(1)}% devolución`}
          icon={<Zap className="w-4 h-4 text-amber-400" />}
          color="amber"
          onClick={() => onMetricClick?.('rescuable')}
        />
        <KPICard
          title="En Oficina"
          value={metrics.inOffice}
          subtitle="Reclamo pendiente"
          icon={<MapPin className="w-4 h-4 text-purple-400" />}
          color="purple"
          onClick={() => onMetricClick?.('inOffice')}
        />
        <KPICard
          title="Promedio Entrega"
          value={`${metrics.avgDays.toFixed(1)}d`}
          subtitle="Días promedio"
          icon={<Clock className="w-4 h-4 text-cyan-400" />}
          color="cyan"
          onClick={() => onMetricClick?.('avgDays')}
        />
      </div>

      {/* Gráficos de barras */}
      {carrierChartData.length > 0 && (
        <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-2 mb-3">
            <Truck className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-white">Por Transportadora</span>
          </div>
          <MiniBarChart data={carrierChartData} />
        </div>
      )}

      {cityChartData.length > 0 && (
        <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-white">Ciudades con Problemas</span>
          </div>
          <MiniBarChart data={cityChartData} />
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onMetricClick?.('export')}
          className="flex-1 py-2 px-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-300 transition-colors flex items-center justify-center gap-2"
        >
          <BarChart3 className="w-4 h-4" />
          Exportar PDF
        </button>
        <button
          onClick={() => onMetricClick?.('refresh')}
          className="flex-1 py-2 px-3 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg text-xs font-medium text-amber-400 transition-colors flex items-center justify-center gap-2"
        >
          <Target className="w-4 h-4" />
          Ver Críticos
        </button>
      </div>
    </div>
  );
};

export default ExecutiveKPIs;
