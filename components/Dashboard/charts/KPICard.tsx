// components/dashboard/charts/KPICard.tsx
// Tarjeta de KPI con indicador visual
import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: number | null | undefined;
  icon: LucideIcon;
  unit?: string;
  target?: number;
  previousValue?: number;
  format?: 'number' | 'percentage' | 'currency' | 'decimal';
  colorScheme?: 'default' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  icon: Icon,
  unit,
  target,
  previousValue,
  format = 'number',
  colorScheme = 'default',
  size = 'md',
}) => {
  const displayValue = value ?? 0;

  // Formatear valor
  const formatValue = (val: number): string => {
    switch (format) {
      case 'percentage':
        return `${val}%`;
      case 'currency':
        return `$${val.toLocaleString('es-CO')}`;
      case 'decimal':
        return val.toFixed(1);
      default:
        return val.toLocaleString('es-CO');
    }
  };

  // Calcular tendencia
  const getTrend = () => {
    if (previousValue === undefined) return null;
    const diff = displayValue - previousValue;
    if (diff > 0) return { icon: TrendingUp, color: 'text-emerald-500', value: `+${formatValue(diff)}` };
    if (diff < 0) return { icon: TrendingDown, color: 'text-red-500', value: formatValue(diff) };
    return { icon: Minus, color: 'text-slate-400', value: '0' };
  };

  // Calcular progreso hacia objetivo
  const getProgress = () => {
    if (!target) return null;
    return Math.min(100, Math.round((displayValue / target) * 100));
  };

  const trend = getTrend();
  const progress = getProgress();

  // Colores según esquema
  const colorClasses = {
    default: {
      icon: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
      progress: 'bg-slate-500',
    },
    success: {
      icon: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
      progress: 'bg-emerald-500',
    },
    warning: {
      icon: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
      progress: 'bg-amber-500',
    },
    danger: {
      icon: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
      progress: 'bg-red-500',
    },
  };

  // Determinar color según valor y objetivo
  const getAutoColorScheme = () => {
    if (colorScheme !== 'default') return colorScheme;
    if (!target) return 'default';
    const ratio = displayValue / target;
    if (ratio >= 0.9) return 'success';
    if (ratio >= 0.7) return 'warning';
    return 'danger';
  };

  const activeColorScheme = getAutoColorScheme();
  const colors = colorClasses[activeColorScheme];

  // Tamaños
  const sizeClasses = {
    sm: { container: 'p-3', value: 'text-xl', icon: 'p-1.5 w-8 h-8', iconSize: 'w-4 h-4' },
    md: { container: 'p-4', value: 'text-2xl', icon: 'p-2 w-10 h-10', iconSize: 'w-5 h-5' },
    lg: { container: 'p-5', value: 'text-3xl', icon: 'p-2.5 w-12 h-12', iconSize: 'w-6 h-6' },
  };

  const sizes = sizeClasses[size];

  return (
    <div className={`bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 ${sizes.container} hover:shadow-lg transition-shadow`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`rounded-lg ${colors.icon} ${sizes.icon} flex items-center justify-center`}>
          <Icon className={sizes.iconSize} />
        </div>

        {trend && (
          <div className={`flex items-center gap-1 text-xs ${trend.color}`}>
            <trend.icon className="w-3 h-3" />
            <span>{trend.value}</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className={`font-bold text-slate-800 dark:text-white ${sizes.value}`}>
          {formatValue(displayValue)}
          {unit && <span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>}
        </p>

        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      </div>

      {/* Barra de progreso hacia objetivo */}
      {progress !== null && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400">Objetivo: {formatValue(target!)}</span>
            <span className={progress >= 100 ? 'text-emerald-500' : 'text-slate-400'}>
              {progress}%
            </span>
          </div>
          <div className="h-1.5 bg-slate-100 dark:bg-navy-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${colors.progress}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default KPICard;
