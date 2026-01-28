/**
 * Executive Dashboard Charts
 *
 * Componentes de gráficos para el Dashboard Ejecutivo.
 * Incluye líneas de tendencia, embudo de operaciones y donut de estados.
 */

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import {
  RevenueTrendData,
  DeliveryTrendData,
  OperationsFunnel,
  StatusDistribution,
} from '../../types/executiveDashboard.types';

// ============================================
// COLORES Y ESTILOS COMUNES
// ============================================

const COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  muted: '#64748b',
  gradient: {
    blue: ['#3b82f6', '#1d4ed8'],
    green: ['#10b981', '#059669'],
    purple: ['#8b5cf6', '#7c3aed'],
  },
};

const STATUS_COLORS: Record<string, string> = {
  delivered: '#10b981',
  in_transit: '#3b82f6',
  processing: '#8b5cf6',
  pending: '#64748b',
  shipped: '#06b6d4',
  failed: '#ef4444',
  returned: '#f59e0b',
  cancelled: '#6b7280',
  out_for_delivery: '#14b8a6',
};

// ============================================
// TOOLTIP PERSONALIZADO
// ============================================

interface CustomTooltipProps extends TooltipProps<number, string> {
  formatter?: (value: number, name: string) => string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, formatter }) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-lg">
      <p className="text-gray-400 text-sm mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-white text-sm font-medium">
            {formatter
              ? formatter(entry.value as number, entry.name as string)
              : entry.value?.toLocaleString()}
          </span>
          <span className="text-gray-500 text-xs">{entry.name}</span>
        </div>
      ))}
    </div>
  );
};

// ============================================
// REVENUE TREND CHART
// ============================================

interface RevenueTrendChartProps {
  data: RevenueTrendData;
  height?: number;
  showComparison?: boolean;
}

export const RevenueTrendChart: React.FC<RevenueTrendChartProps> = ({
  data,
  height = 300,
  showComparison = true,
}) => {
  const chartData = useMemo(() => {
    return data.data.map((point) => ({
      ...point,
      label: point.label,
      revenue: point.value,
      previousRevenue: point.previousValue,
    }));
  }, [data]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Tendencia de Ingresos</h3>
          <p className="text-sm text-gray-400">{data.period}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">
            {formatCurrency(data.totals.revenue)}
          </p>
          <p className="text-sm text-gray-400">
            {data.totals.orders.toLocaleString()} órdenes
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
              <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="previousGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.muted} stopOpacity={0.2} />
              <stop offset="95%" stopColor={COLORS.muted} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={{ stroke: '#334155' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatCurrency}
          />
          <Tooltip
            content={
              <CustomTooltip
                formatter={(value, name) =>
                  name === 'Ingresos' || name === 'Período Anterior'
                    ? formatCurrency(value)
                    : value.toLocaleString()
                }
              />
            }
          />
          {showComparison && (
            <Area
              type="monotone"
              dataKey="previousRevenue"
              name="Período Anterior"
              stroke={COLORS.muted}
              strokeWidth={2}
              strokeDasharray="5 5"
              fill="url(#previousGradient)"
            />
          )}
          <Area
            type="monotone"
            dataKey="revenue"
            name="Ingresos"
            stroke={COLORS.primary}
            strokeWidth={3}
            fill="url(#revenueGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// ============================================
// DELIVERY TREND CHART
// ============================================

interface DeliveryTrendChartProps {
  data: DeliveryTrendData;
  height?: number;
}

export const DeliveryTrendChart: React.FC<DeliveryTrendChartProps> = ({
  data,
  height = 250,
}) => {
  const chartData = useMemo(() => {
    return data.data.map((point) => ({
      ...point,
      label: point.label,
      deliveryRate: Math.round(point.deliveryRate * 100),
    }));
  }, [data]);

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
      <h3 className="text-lg font-semibold text-white mb-4">Entregas por Día</h3>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={{ stroke: '#334155' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: 10 }}
            formatter={(value) => <span className="text-gray-400 text-sm">{value}</span>}
          />
          <Bar dataKey="delivered" name="Entregados" fill={COLORS.success} radius={[4, 4, 0, 0]} />
          <Bar dataKey="inTransit" name="En Tránsito" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
          <Bar dataKey="failed" name="Fallidos" fill={COLORS.danger} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// ============================================
// OPERATIONS FUNNEL
// ============================================

interface OperationsFunnelProps {
  data: OperationsFunnel;
  height?: number;
}

export const OperationsFunnelChart: React.FC<OperationsFunnelProps> = ({
  data,
  height = 280,
}) => {
  const maxCount = Math.max(...data.stages.map((s) => s.count));

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Embudo de Operaciones</h3>
        <div className="text-right">
          <p className="text-sm text-gray-400">Conversión Total</p>
          <p className="text-xl font-bold text-emerald-400">
            {data.overallConversion.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="space-y-3" style={{ minHeight: height }}>
        {data.stages.map((stage, index) => {
          const widthPercent = (stage.count / maxCount) * 100;
          const isLast = index === data.stages.length - 1;

          return (
            <div key={stage.id} className="relative">
              {/* Stage Bar */}
              <div className="flex items-center gap-3">
                <div className="w-32 text-sm text-gray-300">{stage.name}</div>
                <div className="flex-1 h-8 bg-slate-700/30 rounded-lg overflow-hidden">
                  <div
                    className="h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-3"
                    style={{
                      width: `${widthPercent}%`,
                      backgroundColor: stage.color,
                    }}
                  >
                    <span className="text-white text-sm font-medium">
                      {stage.count.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="w-16 text-right">
                  <span className="text-sm font-medium text-white">
                    {stage.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Conversion Arrow */}
              {!isLast && (
                <div className="flex items-center gap-3 py-1 pl-32">
                  <div className="flex-1 flex items-center">
                    <div className="w-px h-4 bg-slate-600 ml-4" />
                    <span className="text-xs text-gray-500 ml-2">
                      {data.stages[index + 1].conversionFromPrevious.toFixed(1)}% conversión
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// STATUS DISTRIBUTION DONUT
// ============================================

interface StatusDonutChartProps {
  data: StatusDistribution;
  height?: number;
}

export const StatusDonutChart: React.FC<StatusDonutChartProps> = ({
  data,
  height = 280,
}) => {
  const chartData = useMemo(() => {
    return data.statuses.map((status) => ({
      name: statusLabels[status.status] || status.status,
      value: status.count,
      percentage: status.percentage,
      color: STATUS_COLORS[status.status] || '#64748b',
      icon: status.icon,
    }));
  }, [data]);

  const statusLabels: Record<string, string> = {
    delivered: 'Entregados',
    in_transit: 'En Tránsito',
    processing: 'Procesando',
    pending: 'Pendientes',
    shipped: 'Despachados',
    failed: 'Fallidos',
    returned: 'Devueltos',
    cancelled: 'Cancelados',
    out_for_delivery: 'En Reparto',
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
      <h3 className="text-lg font-semibold text-white mb-4">Distribución de Estados</h3>

      <div className="flex items-center gap-6">
        {/* Donut Chart */}
        <div className="relative" style={{ width: height * 0.7, height: height * 0.7 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="90%"
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 shadow-lg">
                      <p className="text-white font-medium">{data.name}</p>
                      <p className="text-gray-400 text-sm">
                        {data.value.toLocaleString()} ({data.percentage.toFixed(1)}%)
                      </p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-white">
              {data.total.toLocaleString()}
            </span>
            <span className="text-sm text-gray-400">Total</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-300">{item.name}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-white">
                  {item.value.toLocaleString()}
                </span>
                <span className="text-xs text-gray-500 ml-1">
                  ({item.percentage.toFixed(1)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================
// MINI SPARKLINE CHART
// ============================================

interface SparklineChartProps {
  data: number[];
  color?: string;
  height?: number;
  showDots?: boolean;
}

export const SparklineChart: React.FC<SparklineChartProps> = ({
  data,
  color = COLORS.primary,
  height = 40,
  showDots = false,
}) => {
  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={showDots ? { r: 2, fill: color } : false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

// ============================================
// COMPARISON BAR CHART
// ============================================

interface ComparisonBarChartProps {
  data: { name: string; current: number; previous: number }[];
  height?: number;
}

export const ComparisonBarChart: React.FC<ComparisonBarChartProps> = ({
  data,
  height = 200,
}) => {
  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
      <h3 className="text-lg font-semibold text-white mb-4">Comparación de Períodos</h3>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 60, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
          <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: 10 }}
            formatter={(value) => <span className="text-gray-400 text-sm">{value}</span>}
          />
          <Bar dataKey="previous" name="Anterior" fill={COLORS.muted} radius={[0, 4, 4, 0]} />
          <Bar dataKey="current" name="Actual" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default {
  RevenueTrendChart,
  DeliveryTrendChart,
  OperationsFunnelChart,
  StatusDonutChart,
  SparklineChart,
  ComparisonBarChart,
};
