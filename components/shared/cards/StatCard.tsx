/**
 * STAT CARD COMPONENT
 *
 * Tarjeta para mostrar estadisticas con icono, valor y tendencia.
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import { formatNumber, formatPercentage } from '../../../utils/formatters';

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  color?: 'blue' | 'emerald' | 'amber' | 'red' | 'purple' | 'slate';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  trend,
  trendValue,
  color = 'blue',
  size = 'md',
  className = '',
  onClick,
}) => {
  const colorClasses = {
    blue: 'text-blue-400 bg-blue-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    red: 'text-red-400 bg-red-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
    slate: 'text-slate-400 bg-slate-500/10',
  };

  const sizeClasses = {
    sm: { card: 'p-3', icon: 'w-4 h-4', value: 'text-xl', label: 'text-xs' },
    md: { card: 'p-4', icon: 'w-5 h-5', value: 'text-2xl', label: 'text-sm' },
    lg: { card: 'p-6', icon: 'w-6 h-6', value: 'text-3xl', label: 'text-base' },
  };

  const sizes = sizeClasses[size];

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-emerald-400" />;
      case 'down':
        return <TrendingDown className="w-3 h-3 text-red-400" />;
      default:
        return <Minus className="w-3 h-3 text-slate-400" />;
    }
  };

  const formatValue = (val: number | string) => {
    if (typeof val === 'number') return formatNumber(val);
    return val;
  };

  return (
    <div
      className={`
        bg-slate-800/50 rounded-xl border border-slate-700/50
        ${sizes.card}
        ${onClick ? 'cursor-pointer hover:border-slate-500 transition-colors' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-slate-400 ${sizes.label}`}>{label}</span>
        {Icon && (
          <div className={`p-1.5 rounded-lg ${colorClasses[color]}`}>
            <Icon className={sizes.icon} />
          </div>
        )}
      </div>

      <div className="flex items-end justify-between">
        <span className={`font-bold text-white ${sizes.value}`}>
          {formatValue(value)}
        </span>

        {trend && (
          <div className="flex items-center gap-1">
            {getTrendIcon()}
            {trendValue !== undefined && (
              <span
                className={`text-xs ${
                  trend === 'up'
                    ? 'text-emerald-400'
                    : trend === 'down'
                    ? 'text-red-400'
                    : 'text-slate-400'
                }`}
              >
                {formatPercentage(Math.abs(trendValue))}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
