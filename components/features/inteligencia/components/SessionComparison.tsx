/**
 * SESSION COMPARISON
 *
 * Componente para comparar sesiones de carga.
 */

import React from 'react';
import { GitCompare, TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import { SessionComparison as ComparisonData, SessionData } from '../types';
import { formatNumber, formatPercentage, formatDate } from '../../../../utils/formatters';

interface SessionComparisonProps {
  comparison: ComparisonData | null;
  availableSessions: SessionData[];
  isLoading?: boolean;
  onSelectSessions?: (current: string, previous: string) => void;
}

const SessionComparison: React.FC<SessionComparisonProps> = ({
  comparison,
  availableSessions,
  isLoading = false,
  onSelectSessions,
}) => {
  const getTrendIcon = (value: number, invert: boolean = false) => {
    const isPositive = invert ? value < 0 : value > 0;
    if (Math.abs(value) < 0.5) return <Minus className="w-4 h-4 text-slate-400" />;
    return isPositive ? (
      <TrendingUp className="w-4 h-4 text-emerald-400" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-400" />
    );
  };

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-700 rounded w-48 mb-4" />
          <div className="grid grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!comparison) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <GitCompare className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Comparar Sesiones</h3>
        </div>

        <div className="text-center py-8 text-slate-400">
          <GitCompare className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Selecciona dos sesiones para comparar</p>
          <p className="text-sm mt-2">{availableSessions.length} sesiones disponibles</p>
        </div>

        {availableSessions.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
            {availableSessions.map((session) => (
              <button
                key={session.id}
                className="p-2 text-left bg-slate-900/50 rounded-lg hover:bg-slate-900 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span className="text-sm text-white">
                    {formatDate(session.date, 'short')}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {formatNumber(session.totalGuides)} guias
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <GitCompare className="w-5 h-5 text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">Comparacion de Sesiones</h3>
      </div>

      {/* Sessions */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Current Session */}
        <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-400">Actual</span>
          </div>
          <div className="text-lg font-bold text-white">
            {formatDate(comparison.current.date, 'short')}
          </div>
          <div className="mt-2 space-y-1 text-sm text-slate-400">
            <div>Total: {formatNumber(comparison.current.totalGuides)}</div>
            <div>Entregadas: {formatNumber(comparison.current.deliveredGuides)}</div>
          </div>
        </div>

        {/* Previous Session */}
        <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-400">Anterior</span>
          </div>
          <div className="text-lg font-bold text-white">
            {formatDate(comparison.previous.date, 'short')}
          </div>
          <div className="mt-2 space-y-1 text-sm text-slate-400">
            <div>Total: {formatNumber(comparison.previous.totalGuides)}</div>
            <div>Entregadas: {formatNumber(comparison.previous.deliveredGuides)}</div>
          </div>
        </div>
      </div>

      {/* Changes */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-slate-300">Cambios</h4>

        {/* Delivery Rate */}
        <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
          <span className="text-sm text-slate-300">Tasa de Entrega</span>
          <div className="flex items-center gap-2">
            {getTrendIcon(comparison.changes.deliveryRate)}
            <span className={comparison.changes.deliveryRate >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {comparison.changes.deliveryRate >= 0 ? '+' : ''}{formatPercentage(comparison.changes.deliveryRate)}
            </span>
          </div>
        </div>

        {/* Avg Time */}
        <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
          <span className="text-sm text-slate-300">Tiempo Promedio</span>
          <div className="flex items-center gap-2">
            {getTrendIcon(comparison.changes.avgTime, true)}
            <span className={comparison.changes.avgTime <= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {comparison.changes.avgTime >= 0 ? '+' : ''}{comparison.changes.avgTime.toFixed(1)}h
            </span>
          </div>
        </div>

        {/* Issues */}
        <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
          <span className="text-sm text-slate-300">Novedades</span>
          <div className="flex items-center gap-2">
            {getTrendIcon(comparison.changes.issues, true)}
            <span className={comparison.changes.issues <= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {comparison.changes.issues >= 0 ? '+' : ''}{comparison.changes.issues}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionComparison;
