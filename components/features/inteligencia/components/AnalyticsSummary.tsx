/**
 * ANALYTICS SUMMARY
 *
 * Componente que muestra el resumen de metricas de inteligencia logistica.
 * Extraido de InteligenciaLogisticaTab.tsx para mejor organizacion.
 *
 * ANTES: Este codigo estaba en InteligenciaLogisticaTab.tsx lineas ~300-500
 * AHORA: Componente independiente y reutilizable
 */

import React from 'react';
import {
  Package,
  CheckCircle,
  Truck,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
} from 'lucide-react';
import { IntelligenceMetrics } from '../types';
import { formatNumber, formatPercentage } from '../../../../utils/formatters';

interface AnalyticsSummaryProps {
  metrics: IntelligenceMetrics;
  isLoading?: boolean;
  showTrends?: boolean;
  previousMetrics?: IntelligenceMetrics;
}

const AnalyticsSummary: React.FC<AnalyticsSummaryProps> = ({
  metrics,
  isLoading = false,
  showTrends = true,
  previousMetrics,
}) => {
  // Calcular tendencias si hay metricas anteriores
  const getTrend = (current: number, previous?: number) => {
    if (!previous) return null;
    const diff = current - previous;
    if (Math.abs(diff) < 0.5) return 'stable';
    return diff > 0 ? 'up' : 'down';
  };

  const stats = [
    {
      label: 'Total Envios',
      value: metrics.totalShipments,
      icon: Package,
      color: 'blue',
      trend: getTrend(metrics.totalShipments, previousMetrics?.totalShipments),
    },
    {
      label: 'Entregados',
      value: metrics.deliveredCount,
      icon: CheckCircle,
      color: 'emerald',
      trend: getTrend(metrics.deliveredCount, previousMetrics?.deliveredCount),
    },
    {
      label: 'En Transito',
      value: metrics.inTransitCount,
      icon: Truck,
      color: 'amber',
      trend: getTrend(metrics.inTransitCount, previousMetrics?.inTransitCount),
    },
    {
      label: 'Con Novedad',
      value: metrics.issueCount,
      icon: AlertTriangle,
      color: 'red',
      trend: getTrend(metrics.issueCount, previousMetrics?.issueCount),
      invertTrend: true, // Para issues, bajar es bueno
    },
    {
      label: 'Tasa de Entrega',
      value: formatPercentage(metrics.deliveryRate),
      icon: TrendingUp,
      color: 'purple',
      trend: getTrend(metrics.deliveryRate, previousMetrics?.deliveryRate),
    },
    {
      label: 'Tiempo Promedio',
      value: `${metrics.avgDeliveryTime}h`,
      icon: Clock,
      color: 'slate',
      trend: getTrend(metrics.avgDeliveryTime, previousMetrics?.avgDeliveryTime),
      invertTrend: true, // Para tiempo, bajar es bueno
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-slate-800/50 rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-slate-700 rounded w-20 mb-2" />
            <div className="h-8 bg-slate-700 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const isPositive = stat.invertTrend
          ? stat.trend === 'down'
          : stat.trend === 'up';

        return (
          <div
            key={stat.label}
            className={`
              bg-slate-800/50 rounded-xl p-4 border border-slate-700/50
              hover:border-${stat.color}-500/50 transition-colors
            `}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">{stat.label}</span>
              <Icon className={`w-4 h-4 text-${stat.color}-500`} />
            </div>

            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-white">
                {typeof stat.value === 'number' ? formatNumber(stat.value) : stat.value}
              </span>

              {showTrends && stat.trend && stat.trend !== 'stable' && (
                <div
                  className={`flex items-center text-xs ${
                    isPositive ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {stat.trend === 'up' ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AnalyticsSummary;
