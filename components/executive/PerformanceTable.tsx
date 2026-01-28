/**
 * Performance Tables
 *
 * Tablas de rendimiento por carrier y ciudad para el Dashboard Ejecutivo.
 */

import React, { useState } from 'react';
import { CarrierPerformance, CityPerformance, TrendDirection } from '../../types/executiveDashboard.types';

// ============================================
// UTILIDADES
// ============================================

const TrendIndicator: React.FC<{ trend: TrendDirection; className?: string }> = ({
  trend,
  className = '',
}) => {
  const icons = { up: '↑', down: '↓', stable: '→' };
  const colors = {
    up: 'text-emerald-400',
    down: 'text-red-400',
    stable: 'text-gray-400',
  };

  return (
    <span className={`${colors[trend]} ${className}`}>{icons[trend]}</span>
  );
};

const PerformanceBadge: React.FC<{ value: number; threshold?: number; invertColor?: boolean }> = ({
  value,
  threshold = 90,
  invertColor = false,
}) => {
  const isGood = invertColor ? value < threshold : value >= threshold;
  const isMedium = invertColor ? value < threshold * 1.1 : value >= threshold * 0.9;

  const colorClass = isGood
    ? 'bg-emerald-500/20 text-emerald-400'
    : isMedium
    ? 'bg-amber-500/20 text-amber-400'
    : 'bg-red-500/20 text-red-400';

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {value.toFixed(1)}%
    </span>
  );
};

const PerformanceBar: React.FC<{ value: number; max?: number; color?: string }> = ({
  value,
  max = 100,
  color = '#3b82f6',
}) => {
  const percentage = Math.min(100, (value / max) * 100);

  return (
    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${percentage}%`, backgroundColor: color }}
      />
    </div>
  );
};

// ============================================
// CARRIER PERFORMANCE TABLE
// ============================================

interface CarrierPerformanceTableProps {
  carriers: CarrierPerformance[];
  onCarrierClick?: (carrierId: string) => void;
}

export const CarrierPerformanceTable: React.FC<CarrierPerformanceTableProps> = ({
  carriers,
  onCarrierClick,
}) => {
  const [sortBy, setSortBy] = useState<'deliveryRate' | 'totalShipments' | 'avgDeliveryDays'>('deliveryRate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const sortedCarriers = [...carriers].sort((a, b) => {
    const aValue = a.metrics[sortBy];
    const bValue = b.metrics[sortBy];
    return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
  });

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const SortHeader: React.FC<{ column: typeof sortBy; label: string }> = ({ column, label }) => (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortBy === column && (
          <span className="text-blue-400">{sortOrder === 'desc' ? '↓' : '↑'}</span>
        )}
      </div>
    </th>
  );

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/50">
        <h3 className="text-lg font-semibold text-white">Rendimiento por Carrier</h3>
        <p className="text-sm text-gray-400">Últimos 30 días</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-900/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Carrier
              </th>
              <SortHeader column="totalShipments" label="Envíos" />
              <SortHeader column="deliveryRate" label="Tasa Entrega" />
              <SortHeader column="avgDeliveryDays" label="Tiempo Prom." />
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                A Tiempo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Tendencia
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Problemas
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {sortedCarriers.map((carrier, index) => (
              <tr
                key={carrier.carrierId}
                className={`hover:bg-slate-700/30 transition-colors ${
                  onCarrierClick ? 'cursor-pointer' : ''
                }`}
                onClick={() => onCarrierClick?.(carrier.carrierId)}
              >
                {/* Ranking */}
                <td className="px-4 py-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : index === 1
                        ? 'bg-gray-400/20 text-gray-300'
                        : index === 2
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-slate-700 text-gray-400'
                    }`}
                  >
                    {index + 1}
                  </span>
                </td>

                {/* Carrier Info */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center text-lg">
                      🚚
                    </div>
                    <div>
                      <p className="text-white font-medium">{carrier.carrierName}</p>
                      <p className="text-xs text-gray-500">{carrier.carrierId}</p>
                    </div>
                  </div>
                </td>

                {/* Total Shipments */}
                <td className="px-4 py-3">
                  <div>
                    <p className="text-white font-medium">
                      {carrier.metrics.totalShipments.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {carrier.metrics.delivered.toLocaleString()} entregados
                    </p>
                  </div>
                </td>

                {/* Delivery Rate */}
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <PerformanceBadge value={carrier.metrics.deliveryRate * 100} threshold={90} />
                    <PerformanceBar
                      value={carrier.metrics.deliveryRate * 100}
                      color={
                        carrier.metrics.deliveryRate >= 0.9
                          ? '#10b981'
                          : carrier.metrics.deliveryRate >= 0.85
                          ? '#f59e0b'
                          : '#ef4444'
                      }
                    />
                  </div>
                </td>

                {/* Avg Delivery Days */}
                <td className="px-4 py-3">
                  <span className="text-white">{carrier.metrics.avgDeliveryDays.toFixed(1)} días</span>
                </td>

                {/* On Time Rate */}
                <td className="px-4 py-3">
                  <PerformanceBadge value={carrier.metrics.onTimeRate * 100} threshold={85} />
                </td>

                {/* Trend */}
                <td className="px-4 py-3">
                  <TrendIndicator trend={carrier.trend} className="text-lg" />
                </td>

                {/* Issues */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {carrier.issues.slice(0, 2).map((issue) => (
                      <span
                        key={issue.type}
                        className="px-2 py-0.5 bg-slate-700 rounded text-xs text-gray-300"
                        title={issue.type}
                      >
                        {issue.type === 'delay' && '⏱️'}
                        {issue.type === 'damage' && '📦'}
                        {issue.type === 'lost' && '❓'}
                        {issue.type === 'return' && '↩️'}
                        {issue.count}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================
// CITY PERFORMANCE TABLE
// ============================================

interface CityPerformanceTableProps {
  cities: CityPerformance[];
  onCityClick?: (cityCode: string) => void;
}

export const CityPerformanceTable: React.FC<CityPerformanceTableProps> = ({
  cities,
  onCityClick,
}) => {
  const [sortBy, setSortBy] = useState<'totalShipments' | 'deliveryRate' | 'revenue'>('totalShipments');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const sortedCities = [...cities].sort((a, b) => {
    const aValue = a.metrics[sortBy];
    const bValue = b.metrics[sortBy];
    return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
  });

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const performanceLevelColors: Record<string, string> = {
    excellent: 'bg-emerald-500/20 text-emerald-400',
    good: 'bg-blue-500/20 text-blue-400',
    average: 'bg-amber-500/20 text-amber-400',
    poor: 'bg-orange-500/20 text-orange-400',
    critical: 'bg-red-500/20 text-red-400',
  };

  const performanceLevelLabels: Record<string, string> = {
    excellent: 'Excelente',
    good: 'Bueno',
    average: 'Regular',
    poor: 'Bajo',
    critical: 'Crítico',
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/50">
        <h3 className="text-lg font-semibold text-white">Rendimiento por Ciudad</h3>
        <p className="text-sm text-gray-400">Top ciudades por volumen</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-900/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Ciudad
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
                onClick={() => handleSort('totalShipments')}
              >
                Envíos {sortBy === 'totalShipments' && (sortOrder === 'desc' ? '↓' : '↑')}
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
                onClick={() => handleSort('deliveryRate')}
              >
                Entrega {sortBy === 'deliveryRate' && (sortOrder === 'desc' ? '↓' : '↑')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Tiempo
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
                onClick={() => handleSort('revenue')}
              >
                Ingresos {sortBy === 'revenue' && (sortOrder === 'desc' ? '↓' : '↑')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {sortedCities.map((city) => (
              <tr
                key={city.cityCode}
                className={`hover:bg-slate-700/30 transition-colors ${
                  onCityClick ? 'cursor-pointer' : ''
                }`}
                onClick={() => onCityClick?.(city.cityCode)}
              >
                {/* City Info */}
                <td className="px-4 py-3">
                  <div>
                    <p className="text-white font-medium">{city.cityName}</p>
                    <p className="text-xs text-gray-500">{city.departmentName}</p>
                  </div>
                </td>

                {/* Shipments */}
                <td className="px-4 py-3">
                  <div>
                    <p className="text-white">{city.metrics.totalShipments.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">
                      {city.metrics.orders.toLocaleString()} órdenes
                    </p>
                  </div>
                </td>

                {/* Delivery Rate */}
                <td className="px-4 py-3">
                  <PerformanceBadge value={city.metrics.deliveryRate * 100} threshold={90} />
                </td>

                {/* Avg Time */}
                <td className="px-4 py-3">
                  <span className="text-white">{city.metrics.avgDeliveryDays.toFixed(1)} días</span>
                </td>

                {/* Revenue */}
                <td className="px-4 py-3">
                  <span className="text-white font-medium">
                    {formatCurrency(city.metrics.revenue)}
                  </span>
                </td>

                {/* Performance Level */}
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      performanceLevelColors[city.performanceLevel]
                    }`}
                  >
                    {performanceLevelLabels[city.performanceLevel]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================
// COMPACT CARRIER LIST
// ============================================

interface CompactCarrierListProps {
  carriers: CarrierPerformance[];
  limit?: number;
}

export const CompactCarrierList: React.FC<CompactCarrierListProps> = ({
  carriers,
  limit = 5,
}) => {
  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
      <h3 className="text-lg font-semibold text-white mb-3">Top Carriers</h3>
      <div className="space-y-3">
        {carriers.slice(0, limit).map((carrier, index) => (
          <div key={carrier.carrierId} className="flex items-center gap-3">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                index === 0
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : index === 1
                  ? 'bg-gray-400/20 text-gray-300'
                  : index === 2
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'bg-slate-700 text-gray-400'
              }`}
            >
              {index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{carrier.carrierName}</p>
              <p className="text-xs text-gray-500">
                {carrier.metrics.totalShipments.toLocaleString()} envíos
              </p>
            </div>
            <div className="text-right">
              <PerformanceBadge value={carrier.metrics.deliveryRate * 100} threshold={90} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default { CarrierPerformanceTable, CityPerformanceTable, CompactCarrierList };
