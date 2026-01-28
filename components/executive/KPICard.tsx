/**
 * KPI Card Component
 *
 * Tarjeta individual para mostrar un KPI con su valor,
 * tendencia, comparación y estado vs objetivo.
 */

import React from 'react';
import { KPIValue, KPICardConfig, TrendDirection, TargetStatus } from '../../types/executiveDashboard.types';

interface KPICardProps {
  config: KPICardConfig;
  value: KPIValue;
  sparklineData?: number[];
  onClick?: () => void;
  className?: string;
}

// ============================================
// UTILIDADES DE FORMATO
// ============================================

const formatValue = (value: number, format: KPIValue['format'], unit: KPIValue['unit']): string => {
  switch (format) {
    case 'currency':
      if (value >= 1000000) {
        return `$${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        return `$${(value / 1000).toFixed(0)}K`;
      }
      return `$${value.toLocaleString('es-CO')}`;

    case 'percent':
      return `${(value * 100).toFixed(1)}%`;

    case 'decimal':
      return value.toFixed(1);

    case 'duration':
      if (unit === 'days') {
        return `${value.toFixed(1)} días`;
      } else if (unit === 'hours') {
        return `${value.toFixed(1)}h`;
      }
      return value.toString();

    case 'integer':
    default:
      return value.toLocaleString('es-CO');
  }
};

const formatChange = (changePercent: number): string => {
  const sign = changePercent >= 0 ? '+' : '';
  return `${sign}${changePercent.toFixed(1)}%`;
};

// ============================================
// COLORES Y ESTILOS
// ============================================

const colorClasses: Record<KPICardConfig['color'], { bg: string; border: string; text: string; accent: string }> = {
  blue: { bg: 'bg-blue-900/30', border: 'border-blue-700/50', text: 'text-blue-100', accent: 'text-blue-400' },
  green: { bg: 'bg-emerald-900/30', border: 'border-emerald-700/50', text: 'text-emerald-100', accent: 'text-emerald-400' },
  yellow: { bg: 'bg-amber-900/30', border: 'border-amber-700/50', text: 'text-amber-100', accent: 'text-amber-400' },
  red: { bg: 'bg-red-900/30', border: 'border-red-700/50', text: 'text-red-100', accent: 'text-red-400' },
  purple: { bg: 'bg-purple-900/30', border: 'border-purple-700/50', text: 'text-purple-100', accent: 'text-purple-400' },
  indigo: { bg: 'bg-indigo-900/30', border: 'border-indigo-700/50', text: 'text-indigo-100', accent: 'text-indigo-400' },
  pink: { bg: 'bg-pink-900/30', border: 'border-pink-700/50', text: 'text-pink-100', accent: 'text-pink-400' },
  cyan: { bg: 'bg-cyan-900/30', border: 'border-cyan-700/50', text: 'text-cyan-100', accent: 'text-cyan-400' },
  orange: { bg: 'bg-orange-900/30', border: 'border-orange-700/50', text: 'text-orange-100', accent: 'text-orange-400' },
  teal: { bg: 'bg-teal-900/30', border: 'border-teal-700/50', text: 'text-teal-100', accent: 'text-teal-400' },
};

const trendColors: Record<TrendDirection, { positive: string; negative: string }> = {
  up: { positive: 'text-emerald-400', negative: 'text-red-400' },
  down: { positive: 'text-red-400', negative: 'text-emerald-400' },
  stable: { positive: 'text-gray-400', negative: 'text-gray-400' },
};

const targetStatusColors: Record<TargetStatus, string> = {
  above: 'bg-emerald-500',
  on_track: 'bg-blue-500',
  below: 'bg-amber-500',
  critical: 'bg-red-500',
};

const targetStatusLabels: Record<TargetStatus, string> = {
  above: 'Por encima',
  on_track: 'En camino',
  below: 'Por debajo',
  critical: 'Crítico',
};

// ============================================
// COMPONENTES INTERNOS
// ============================================

interface TrendBadgeProps {
  trend: TrendDirection;
  changePercent: number;
  invertTrend?: boolean;
}

const TrendBadge: React.FC<TrendBadgeProps> = ({ trend, changePercent, invertTrend = false }) => {
  const isPositive = invertTrend
    ? (trend === 'down' || (trend === 'up' && changePercent < 0))
    : (trend === 'up' || (trend === 'down' && changePercent > 0));

  const colorClass = isPositive ? 'text-emerald-400' : trend === 'stable' ? 'text-gray-400' : 'text-red-400';

  const icon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';

  return (
    <span className={`inline-flex items-center text-sm font-medium ${colorClass}`}>
      <span className="mr-1">{icon}</span>
      {formatChange(changePercent)}
    </span>
  );
};

interface MiniSparklineProps {
  data: number[];
  color: string;
  height?: number;
}

const MiniSparkline: React.FC<MiniSparklineProps> = ({ data, color, height = 24 }) => {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const width = 60;
  const padding = 2;
  const pointWidth = (width - padding * 2) / (data.length - 1);

  const points = data.map((value, index) => ({
    x: padding + index * pointWidth,
    y: height - padding - ((value - min) / range) * (height - padding * 2),
  }));

  const pathD = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Punto final */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="3"
        fill={color}
      />
    </svg>
  );
};

interface TargetProgressProps {
  current: number;
  target: number;
  status: TargetStatus;
}

const TargetProgress: React.FC<TargetProgressProps> = ({ current, target, status }) => {
  const percentage = Math.min(100, (current / target) * 100);

  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>Meta: {target.toLocaleString()}</span>
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${targetStatusColors[status]} text-white`}>
          {targetStatusLabels[status]}
        </span>
      </div>
      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${targetStatusColors[status]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const KPICard: React.FC<KPICardProps> = ({
  config,
  value,
  sparklineData,
  onClick,
  className = '',
}) => {
  const colors = colorClasses[config.color];

  const sizeClasses = {
    small: 'p-3',
    medium: 'p-4',
    large: 'p-5',
  };

  return (
    <div
      className={`
        ${colors.bg} ${colors.border}
        border rounded-xl
        ${sizeClasses[config.size]}
        ${onClick ? 'cursor-pointer hover:scale-[1.02] hover:shadow-lg' : ''}
        transition-all duration-200
        ${className}
      `}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{config.icon}</span>
          <span className={`text-sm font-medium ${colors.text} opacity-80`}>
            {config.title}
          </span>
        </div>
        {config.showSparkline && sparklineData && sparklineData.length > 0 && (
          <MiniSparkline
            data={sparklineData}
            color={colors.accent.replace('text-', '#').replace('-400', '')}
          />
        )}
      </div>

      {/* Value */}
      <div className="flex items-end justify-between">
        <div>
          <p className={`text-2xl font-bold ${colors.text}`}>
            {formatValue(value.current, value.format, value.unit)}
          </p>
          {config.showTrend && (
            <div className="mt-1">
              <TrendBadge
                trend={value.trend}
                changePercent={value.changePercent}
                invertTrend={config.invertTrend}
              />
              <span className="text-xs text-gray-500 ml-2">
                vs {formatValue(value.previous, value.format, value.unit)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Target Progress */}
      {config.showTarget && value.target !== undefined && value.targetStatus && (
        <TargetProgress
          current={value.current}
          target={value.target}
          status={value.targetStatus}
        />
      )}

      {/* Description */}
      {config.description && (
        <p className="text-xs text-gray-500 mt-2">{config.description}</p>
      )}
    </div>
  );
};

// ============================================
// VARIANTES ESPECIALIZADAS
// ============================================

interface CompactKPICardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: TrendDirection;
  icon?: string;
  color?: KPICardConfig['color'];
}

export const CompactKPICard: React.FC<CompactKPICardProps> = ({
  title,
  value,
  change,
  trend = 'stable',
  icon = '📊',
  color = 'blue',
}) => {
  const colors = colorClasses[color];

  return (
    <div className={`${colors.bg} ${colors.border} border rounded-lg p-3 flex items-center gap-3`}>
      <span className="text-lg">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 truncate">{title}</p>
        <p className={`text-lg font-bold ${colors.text}`}>{value}</p>
      </div>
      {change !== undefined && (
        <TrendBadge trend={trend} changePercent={change} />
      )}
    </div>
  );
};

interface LargeKPICardProps {
  title: string;
  value: KPIValue;
  icon: string;
  color: KPICardConfig['color'];
  description?: string;
  children?: React.ReactNode;
}

export const LargeKPICard: React.FC<LargeKPICardProps> = ({
  title,
  value,
  icon,
  color,
  description,
  children,
}) => {
  const colors = colorClasses[color];

  return (
    <div className={`${colors.bg} ${colors.border} border rounded-xl p-6`}>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{icon}</span>
        <div>
          <h3 className={`text-lg font-semibold ${colors.text}`}>{title}</h3>
          {description && <p className="text-sm text-gray-400">{description}</p>}
        </div>
      </div>

      <div className="flex items-end justify-between mb-4">
        <p className={`text-4xl font-bold ${colors.text}`}>
          {formatValue(value.current, value.format, value.unit)}
        </p>
        <TrendBadge trend={value.trend} changePercent={value.changePercent} />
      </div>

      {value.target !== undefined && value.targetStatus && (
        <TargetProgress
          current={value.current}
          target={value.target}
          status={value.targetStatus}
        />
      )}

      {children && <div className="mt-4">{children}</div>}
    </div>
  );
};

export default KPICard;
