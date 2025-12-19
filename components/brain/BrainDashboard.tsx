// components/brain/BrainDashboard.tsx
// Dashboard del Cerebro Central

import React, { useEffect, useState } from 'react';
import {
  getBrainStatus,
  analyzeNow,
  alertManager,
  insightsManager,
  knowledgeHub,
  Alert,
  Insight,
  DetectedPattern,
} from '../../services/brain';

interface BrainDashboardProps {
  onAlertClick?: (alert: Alert) => void;
  onInsightClick?: (insight: Insight) => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const BrainDashboard: React.FC<BrainDashboardProps> = ({
  onAlertClick,
  onInsightClick,
  autoRefresh = true,
  refreshInterval = 30000,
}) => {
  const [status, setStatus] = useState(getBrainStatus());
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [patterns, setPatterns] = useState<DetectedPattern[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const refresh = () => {
    setStatus(getBrainStatus());
    setAlerts(alertManager.getActiveAlerts().slice(0, 5));
    setInsights(insightsManager.getActiveInsights().slice(0, 5));
    setPatterns(knowledgeHub.getPatterns().slice(0, 3));
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      analyzeNow();
      refresh();
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    refresh();

    if (autoRefresh) {
      const interval = setInterval(refresh, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  return (
    <div className="brain-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-title">
          <span className="brain-icon">🧠</span>
          <h2>Cerebro Central</h2>
          <span
            className={`status-badge ${
              status.isInitialized ? 'active' : 'inactive'
            }`}
          >
            {status.isInitialized ? 'Activo' : 'Inactivo'}
          </span>
        </div>
        <button
          className="analyze-btn"
          onClick={handleAnalyze}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? '⏳ Analizando...' : '🔍 Analizar Ahora'}
        </button>
      </div>

      {/* Métricas principales */}
      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-icon">📦</span>
          <div className="metric-content">
            <span className="metric-value">{status.totalShipments}</span>
            <span className="metric-label">Envíos</span>
          </div>
        </div>
        <div className="metric-card warning">
          <span className="metric-icon">🔔</span>
          <div className="metric-content">
            <span className="metric-value">{status.activeAlerts}</span>
            <span className="metric-label">Alertas</span>
          </div>
        </div>
        <div className="metric-card">
          <span className="metric-icon">🎯</span>
          <div className="metric-content">
            <span className="metric-value">{status.patterns}</span>
            <span className="metric-label">Patrones</span>
          </div>
        </div>
        <div className="metric-card">
          <span className="metric-icon">💡</span>
          <div className="metric-content">
            <span className="metric-value">{status.insights}</span>
            <span className="metric-label">Insights</span>
          </div>
        </div>
      </div>

      {/* Alertas activas */}
      {alerts.length > 0 && (
        <div className="section alerts-section">
          <h3>🔔 Alertas Activas</h3>
          <div className="alerts-list">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`alert-item severity-${alert.severity}`}
                onClick={() => onAlertClick?.(alert)}
              >
                <span className="alert-icon">
                  {alert.severity === 'critical' && '🚨'}
                  {alert.severity === 'error' && '❌'}
                  {alert.severity === 'warning' && '⚠️'}
                  {alert.severity === 'info' && 'ℹ️'}
                </span>
                <div className="alert-content">
                  <span className="alert-title">{alert.title}</span>
                  <span className="alert-message">{alert.message}</span>
                </div>
                <span className="alert-time">
                  {getRelativeTime(alert.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div className="section insights-section">
          <h3>💡 Insights</h3>
          <div className="insights-list">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className={`insight-item type-${insight.type}`}
                onClick={() => onInsightClick?.(insight)}
              >
                <span className="insight-icon">
                  {insight.type === 'success' && '✅'}
                  {insight.type === 'warning' && '⚠️'}
                  {insight.type === 'critical' && '🚨'}
                  {insight.type === 'info' && '💡'}
                </span>
                <div className="insight-content">
                  <span className="insight-title">{insight.title}</span>
                  <span className="insight-description">
                    {insight.description}
                  </span>
                  {insight.suggestedAction && (
                    <span className="insight-action">
                      👉 {insight.suggestedAction}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patrones detectados */}
      {patterns.length > 0 && (
        <div className="section patterns-section">
          <h3>🎯 Patrones Detectados</h3>
          <div className="patterns-list">
            {patterns.map((pattern) => (
              <div key={pattern.id} className="pattern-item">
                <div className="pattern-header">
                  <span className="pattern-name">{pattern.name}</span>
                  <span className="pattern-confidence">
                    {pattern.confidence}% confianza
                  </span>
                </div>
                <p className="pattern-description">{pattern.description}</p>
                {pattern.suggestedAction && (
                  <span className="pattern-action">
                    💡 {pattern.suggestedAction}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer con última actualización */}
      <div className="dashboard-footer">
        <span>
          Última análisis:{' '}
          {status.lastAnalysis
            ? getRelativeTime(status.lastAnalysis)
            : 'Nunca'}
        </span>
        <span>Memoria: {status.memoryUsage} entradas</span>
      </div>

      <style>{`
        .brain-dashboard {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .brain-icon {
          font-size: 1.5rem;
        }

        .header-title h2 {
          margin: 0;
          font-size: 1.25rem;
          color: #1e293b;
        }

        .status-badge {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 9999px;
        }

        .status-badge.active {
          background: #dcfce7;
          color: #166534;
        }

        .status-badge.inactive {
          background: #fee2e2;
          color: #991b1b;
        }

        .analyze-btn {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .analyze-btn:hover:not(:disabled) {
          background: #2563eb;
        }

        .analyze-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .metric-card {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 12px;
          transition: transform 0.2s ease;
        }

        .metric-card:hover {
          transform: translateY(-2px);
        }

        .metric-card.warning {
          background: #fef3c7;
        }

        .metric-icon {
          font-size: 1.5rem;
        }

        .metric-content {
          display: flex;
          flex-direction: column;
        }

        .metric-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
        }

        .metric-label {
          font-size: 0.75rem;
          color: #64748b;
        }

        .section {
          margin-bottom: 1.5rem;
        }

        .section h3 {
          font-size: 1rem;
          color: #1e293b;
          margin-bottom: 0.75rem;
        }

        .alerts-list,
        .insights-list,
        .patterns-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .alert-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.75rem;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .alert-item:hover {
          background: #f1f5f9;
        }

        .alert-item.severity-critical {
          background: #fef2f2;
          border-left: 3px solid #ef4444;
        }

        .alert-item.severity-error {
          background: #fef2f2;
          border-left: 3px solid #dc2626;
        }

        .alert-item.severity-warning {
          background: #fffbeb;
          border-left: 3px solid #f59e0b;
        }

        .alert-item.severity-info {
          background: #eff6ff;
          border-left: 3px solid #3b82f6;
        }

        .alert-icon {
          font-size: 1.25rem;
        }

        .alert-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .alert-title {
          font-weight: 600;
          color: #1e293b;
          font-size: 0.875rem;
        }

        .alert-message {
          color: #64748b;
          font-size: 0.75rem;
        }

        .alert-time {
          font-size: 0.625rem;
          color: #94a3b8;
        }

        .insight-item {
          display: flex;
          gap: 0.75rem;
          padding: 0.75rem;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .insight-item:hover {
          background: #f8fafc;
        }

        .insight-item.type-success {
          border-left: 3px solid #22c55e;
        }

        .insight-item.type-warning {
          border-left: 3px solid #f59e0b;
        }

        .insight-item.type-critical {
          border-left: 3px solid #ef4444;
        }

        .insight-item.type-info {
          border-left: 3px solid #3b82f6;
        }

        .insight-icon {
          font-size: 1.25rem;
        }

        .insight-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .insight-title {
          font-weight: 600;
          color: #1e293b;
          font-size: 0.875rem;
        }

        .insight-description {
          color: #64748b;
          font-size: 0.75rem;
        }

        .insight-action {
          color: #3b82f6;
          font-size: 0.75rem;
          font-style: italic;
        }

        .pattern-item {
          padding: 0.75rem;
          background: #f8fafc;
          border-radius: 8px;
        }

        .pattern-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.25rem;
        }

        .pattern-name {
          font-weight: 600;
          color: #1e293b;
          font-size: 0.875rem;
        }

        .pattern-confidence {
          font-size: 0.625rem;
          color: #22c55e;
          background: #dcfce7;
          padding: 0.125rem 0.375rem;
          border-radius: 9999px;
        }

        .pattern-description {
          color: #64748b;
          font-size: 0.75rem;
          margin: 0 0 0.5rem 0;
        }

        .pattern-action {
          color: #3b82f6;
          font-size: 0.75rem;
        }

        .dashboard-footer {
          display: flex;
          justify-content: space-between;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
          font-size: 0.75rem;
          color: #94a3b8;
        }

        @media (max-width: 768px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

// Helper function
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Justo ahora';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays === 1) return 'Ayer';
  return `Hace ${diffDays} días`;
}

export default BrainDashboard;
