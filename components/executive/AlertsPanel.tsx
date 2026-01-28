/**
 * Alerts Panel
 *
 * Panel de alertas ejecutivas para el Dashboard.
 * Muestra alertas críticas, warnings y notificaciones importantes.
 */

import React, { useState } from 'react';
import {
  AlertsSummary,
  ExecutiveAlert,
  AlertSeverity,
  AlertCategory,
} from '../../types/executiveDashboard.types';

// ============================================
// CONFIGURACIÓN DE ESTILOS
// ============================================

const severityConfig: Record<
  AlertSeverity,
  { bg: string; border: string; icon: string; text: string; label: string }
> = {
  emergency: {
    bg: 'bg-red-900/30',
    border: 'border-red-500/50',
    icon: '🚨',
    text: 'text-red-400',
    label: 'Emergencia',
  },
  critical: {
    bg: 'bg-red-900/20',
    border: 'border-red-500/30',
    icon: '⚠️',
    text: 'text-red-400',
    label: 'Crítico',
  },
  warning: {
    bg: 'bg-amber-900/20',
    border: 'border-amber-500/30',
    icon: '⚡',
    text: 'text-amber-400',
    label: 'Advertencia',
  },
  info: {
    bg: 'bg-blue-900/20',
    border: 'border-blue-500/30',
    icon: 'ℹ️',
    text: 'text-blue-400',
    label: 'Info',
  },
};

const categoryConfig: Record<AlertCategory, { icon: string; label: string }> = {
  operations: { icon: '📦', label: 'Operaciones' },
  financial: { icon: '💰', label: 'Finanzas' },
  customer: { icon: '👥', label: 'Cliente' },
  inventory: { icon: '📊', label: 'Inventario' },
  carrier: { icon: '🚚', label: 'Carrier' },
  system: { icon: '⚙️', label: 'Sistema' },
};

// ============================================
// COMPONENTES INTERNOS
// ============================================

interface AlertCardProps {
  alert: ExecutiveAlert;
  onAcknowledge?: (id: string) => void;
  onDismiss?: (id: string) => void;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onAcknowledge,
  onDismiss,
  expanded = false,
  onToggleExpand,
}) => {
  const severity = severityConfig[alert.severity];
  const category = categoryConfig[alert.category];

  const timeAgo = getTimeAgo(alert.timestamp);

  return (
    <div
      className={`${severity.bg} ${severity.border} border rounded-lg p-4 transition-all duration-200`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="text-xl flex-shrink-0">{severity.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={`font-semibold ${severity.text}`}>{alert.title}</h4>
              <span className="px-2 py-0.5 bg-slate-700/50 rounded text-xs text-gray-400">
                {category.icon} {category.label}
              </span>
            </div>
            <p className="text-sm text-gray-300 mt-1">{alert.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-gray-500">{timeAgo}</span>
          {alert.status === 'new' && (
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
        </div>
      </div>

      {/* Metrics */}
      {alert.metric && alert.currentValue !== undefined && (
        <div className="mt-3 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Actual:</span>
            <span className={`font-medium ${severity.text}`}>
              {formatMetricValue(alert.currentValue, alert.metric)}
            </span>
          </div>
          {alert.threshold !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Umbral:</span>
              <span className="font-medium text-gray-300">
                {formatMetricValue(alert.threshold, alert.metric)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Affected Entities */}
      {alert.affectedEntities && alert.affectedEntities.length > 0 && (
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500">Afectados:</span>
          {alert.affectedEntities.slice(0, 3).map((entity, index) => (
            <span
              key={index}
              className="px-2 py-0.5 bg-slate-700/50 rounded text-xs text-gray-300"
            >
              {entity.name}
            </span>
          ))}
          {alert.affectedEntities.length > 3 && (
            <span className="text-xs text-gray-500">
              +{alert.affectedEntities.length - 3} más
            </span>
          )}
        </div>
      )}

      {/* Expanded Content */}
      {expanded && alert.suggestedAction && (
        <div className="mt-3 p-3 bg-slate-800/50 rounded-lg">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
            Acción Sugerida
          </p>
          <p className="text-sm text-gray-200">{alert.suggestedAction}</p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 flex items-center justify-between">
        <button
          onClick={onToggleExpand}
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          {expanded ? 'Ver menos' : 'Ver más'}
        </button>

        {alert.status === 'new' && (
          <div className="flex items-center gap-2">
            {onAcknowledge && (
              <button
                onClick={() => onAcknowledge(alert.id)}
                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg transition-colors"
              >
                Reconocer
              </button>
            )}
            {onDismiss && (
              <button
                onClick={() => onDismiss(alert.id)}
                className="px-3 py-1 text-gray-400 hover:text-white text-xs transition-colors"
              >
                Descartar
              </button>
            )}
          </div>
        )}

        {alert.status === 'acknowledged' && (
          <span className="text-xs text-gray-500">✓ Reconocido</span>
        )}
      </div>
    </div>
  );
};

// ============================================
// PANEL PRINCIPAL
// ============================================

interface AlertsPanelProps {
  alertsSummary: AlertsSummary;
  onAcknowledge?: (alertId: string) => void;
  onDismiss?: (alertId: string) => void;
  maxVisible?: number;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alertsSummary,
  onAcknowledge,
  onDismiss,
  maxVisible = 5,
}) => {
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<AlertSeverity | 'all'>('all');
  const [showAll, setShowAll] = useState(false);

  const filteredAlerts = alertsSummary.alerts.filter(
    (alert) => filterSeverity === 'all' || alert.severity === filterSeverity
  );

  const visibleAlerts = showAll ? filteredAlerts : filteredAlerts.slice(0, maxVisible);

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white">Alertas</h3>
            {alertsSummary.pendingActionCount > 0 && (
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-medium rounded-full">
                {alertsSummary.pendingActionCount} pendientes
              </span>
            )}
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterSeverity('all')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                filterSeverity === 'all'
                  ? 'bg-slate-700 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Todas ({alertsSummary.total})
            </button>
            {alertsSummary.bySeverity.critical > 0 && (
              <button
                onClick={() => setFilterSeverity('critical')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  filterSeverity === 'critical'
                    ? 'bg-red-500/20 text-red-400'
                    : 'text-gray-400 hover:text-red-400'
                }`}
              >
                ⚠️ {alertsSummary.bySeverity.critical}
              </button>
            )}
            {alertsSummary.bySeverity.warning > 0 && (
              <button
                onClick={() => setFilterSeverity('warning')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  filterSeverity === 'warning'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'text-gray-400 hover:text-amber-400'
                }`}
              >
                ⚡ {alertsSummary.bySeverity.warning}
              </button>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
          <span>
            Por categoría:{' '}
            {Object.entries(alertsSummary.byCategory)
              .filter(([, count]) => count > 0)
              .map(([cat, count]) => `${categoryConfig[cat as AlertCategory]?.icon} ${count}`)
              .join(' · ')}
          </span>
        </div>
      </div>

      {/* Alerts List */}
      <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
        {visibleAlerts.length > 0 ? (
          <>
            {visibleAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onAcknowledge={onAcknowledge}
                onDismiss={onDismiss}
                expanded={expandedAlertId === alert.id}
                onToggleExpand={() =>
                  setExpandedAlertId(expandedAlertId === alert.id ? null : alert.id)
                }
              />
            ))}

            {filteredAlerts.length > maxVisible && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                {showAll
                  ? 'Mostrar menos'
                  : `Ver ${filteredAlerts.length - maxVisible} alertas más`}
              </button>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <span className="text-4xl">✅</span>
            <p className="text-gray-400 mt-2">No hay alertas activas</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// COMPACT ALERTS WIDGET
// ============================================

interface CompactAlertsWidgetProps {
  alertsSummary: AlertsSummary;
  onViewAll?: () => void;
}

export const CompactAlertsWidget: React.FC<CompactAlertsWidgetProps> = ({
  alertsSummary,
  onViewAll,
}) => {
  const criticalAlerts = alertsSummary.alerts.filter(
    (a) => a.severity === 'critical' || a.severity === 'emergency'
  );

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">Alertas</h3>
        <div className="flex items-center gap-2">
          {alertsSummary.bySeverity.critical > 0 && (
            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-medium rounded-full">
              {alertsSummary.bySeverity.critical} críticas
            </span>
          )}
          {alertsSummary.bySeverity.warning > 0 && (
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full">
              {alertsSummary.bySeverity.warning} warnings
            </span>
          )}
        </div>
      </div>

      {criticalAlerts.length > 0 ? (
        <div className="space-y-2">
          {criticalAlerts.slice(0, 3).map((alert) => (
            <div
              key={alert.id}
              className={`flex items-center gap-3 p-2 rounded-lg ${
                severityConfig[alert.severity].bg
              }`}
            >
              <span className="text-lg">{severityConfig[alert.severity].icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${severityConfig[alert.severity].text}`}>
                  {alert.title}
                </p>
                <p className="text-xs text-gray-500 truncate">{alert.description}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <span className="text-2xl">✅</span>
          <p className="text-sm text-gray-400 mt-1">Sin alertas críticas</p>
        </div>
      )}

      {onViewAll && alertsSummary.total > 0 && (
        <button
          onClick={onViewAll}
          className="w-full mt-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          Ver todas las alertas ({alertsSummary.total})
        </button>
      )}
    </div>
  );
};

// ============================================
// ALERT BANNER (Top of page)
// ============================================

interface AlertBannerProps {
  alert: ExecutiveAlert;
  onDismiss?: () => void;
  onAction?: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ alert, onDismiss, onAction }) => {
  const severity = severityConfig[alert.severity];

  return (
    <div
      className={`${severity.bg} ${severity.border} border-l-4 rounded-r-lg p-4 flex items-center gap-4`}
    >
      <span className="text-2xl">{severity.icon}</span>
      <div className="flex-1">
        <h4 className={`font-semibold ${severity.text}`}>{alert.title}</h4>
        <p className="text-sm text-gray-300">{alert.description}</p>
      </div>
      <div className="flex items-center gap-2">
        {onAction && alert.suggestedAction && (
          <button
            onClick={onAction}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
          >
            Acción
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================
// UTILIDADES
// ============================================

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
}

function formatMetricValue(value: number, metric: string): string {
  if (metric.includes('rate') || metric.includes('percentage')) {
    return `${(value * 100).toFixed(1)}%`;
  }
  if (metric.includes('time') || metric.includes('days')) {
    return `${value.toFixed(1)} días`;
  }
  return value.toLocaleString();
}

export default AlertsPanel;
