// components/ChatFirst/ContextPanel.tsx
// Panel de Contexto en Vivo - KPIs siempre visibles
import React, { useMemo } from 'react';
import {
  Package,
  AlertTriangle,
  CheckCircle,
  Truck,
  Clock,
  TrendingUp,
  TrendingDown,
  MapPin,
  Activity,
} from 'lucide-react';
import { Shipment, ShipmentStatus } from '../../types';

interface ContextPanelProps {
  shipments: Shipment[];
  criticalCities?: string[];
  onCityClick?: (city: string) => void;
}

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  onClick?: () => void;
  pulse?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon: Icon,
  color,
  trend,
  trendValue,
  onClick,
  pulse,
}) => (
  <button
    onClick={onClick}
    className={`
      relative flex items-center gap-3 px-4 py-3 rounded-xl
      bg-white/5 hover:bg-white/10 backdrop-blur-sm
      border border-white/10 hover:border-white/20
      transition-all duration-200 group
      ${onClick ? 'cursor-pointer' : 'cursor-default'}
    `}
  >
    {pulse && (
      <span className="absolute top-1 right-1 flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
      </span>
    )}
    <div className={`p-2 rounded-lg ${color}`}>
      <Icon className="w-4 h-4 text-white" />
    </div>
    <div className="text-left">
      <p className="text-xs text-slate-400 group-hover:text-slate-300">{label}</p>
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-white">{value}</span>
        {trend && trendValue && (
          <span className={`flex items-center text-xs ${
            trend === 'up' ? 'text-emerald-400' :
            trend === 'down' ? 'text-red-400' :
            'text-slate-400'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> :
             trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
            {trendValue}
          </span>
        )}
      </div>
    </div>
  </button>
);

export const ContextPanel: React.FC<ContextPanelProps> = ({
  shipments,
  criticalCities = [],
  onCityClick,
}) => {
  const stats = useMemo(() => {
    const total = shipments.length;
    const delivered = shipments.filter(s => s.status === ShipmentStatus.DELIVERED).length;
    const inTransit = shipments.filter(s => s.status === ShipmentStatus.IN_TRANSIT).length;
    const pending = shipments.filter(s => s.status === ShipmentStatus.PENDING).length;
    const issues = shipments.filter(s =>
      s.status === ShipmentStatus.EXCEPTION ||
      s.status === ShipmentStatus.RETURNED ||
      s.status === ShipmentStatus.ISSUE
    ).length;

    // Calcular envios en riesgo (mas de 3 dias sin movimiento o con novedad)
    const atRisk = shipments.filter(s => {
      if (s.status === ShipmentStatus.DELIVERED) return false;
      const days = s.detailedInfo?.daysInTransit || 0;
      return days >= 3 || s.status === ShipmentStatus.ISSUE || s.status === ShipmentStatus.EXCEPTION;
    }).length;

    const deliveryRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

    return { total, delivered, inTransit, pending, issues, atRisk, deliveryRate };
  }, [shipments]);

  const hasAlerts = stats.atRisk > 0 || criticalCities.length > 0;

  return (
    <div className="bg-gradient-to-r from-navy-900/95 via-navy-800/95 to-navy-900/95 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-accent-400" />
          <h2 className="text-sm font-bold text-white">Contexto en Vivo</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/20 rounded-full">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">En tiempo real</span>
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
        <MetricCard
          label="Total Activos"
          value={stats.total}
          icon={Package}
          color="bg-slate-600"
        />
        <MetricCard
          label="Entregados"
          value={stats.delivered}
          icon={CheckCircle}
          color="bg-emerald-600"
          trend="up"
          trendValue={`${stats.deliveryRate}%`}
        />
        <MetricCard
          label="En Transito"
          value={stats.inTransit}
          icon={Truck}
          color="bg-blue-600"
        />
        <MetricCard
          label="Pendientes"
          value={stats.pending}
          icon={Clock}
          color="bg-amber-600"
        />
        <MetricCard
          label="En Riesgo"
          value={stats.atRisk}
          icon={AlertTriangle}
          color="bg-red-600"
          pulse={stats.atRisk > 0}
        />
        <MetricCard
          label="Incidencias"
          value={stats.issues}
          icon={AlertTriangle}
          color="bg-orange-600"
          pulse={stats.issues > 0}
        />
      </div>

      {/* Critical Cities Alert */}
      {criticalCities.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-300 font-medium">
              {criticalCities.length} ciudad{criticalCities.length > 1 ? 'es' : ''} con alerta critica
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {criticalCities.slice(0, 5).map((city) => (
                <button
                  key={city}
                  onClick={() => onCityClick?.(city)}
                  className="flex items-center gap-1 px-2 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-xs text-red-300 transition-colors"
                >
                  <MapPin className="w-3 h-3" />
                  {city}
                </button>
              ))}
              {criticalCities.length > 5 && (
                <span className="px-2 py-1 text-xs text-red-400">
                  +{criticalCities.length - 5} mas
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Status Message */}
      {!hasAlerts && stats.total > 0 && (
        <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <p className="text-sm text-emerald-300">
            Todo bajo control. {stats.deliveryRate}% de entregas completadas.
          </p>
        </div>
      )}

      {stats.total === 0 && (
        <div className="flex items-center gap-3 p-3 bg-slate-500/10 border border-slate-500/30 rounded-xl">
          <Package className="w-5 h-5 text-slate-400" />
          <p className="text-sm text-slate-400">
            No hay envios cargados. Usa el chat para importar datos.
          </p>
        </div>
      )}
    </div>
  );
};

export default ContextPanel;
