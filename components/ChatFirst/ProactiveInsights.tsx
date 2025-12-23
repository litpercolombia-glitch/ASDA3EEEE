// components/ChatFirst/ProactiveInsights.tsx
// Componente de Insights Proactivos - Muestra alertas y sugerencias en tiempo real
import React, { useMemo, useState, useEffect } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Lightbulb,
  TrendingUp,
  Trophy,
  ChevronRight,
  X,
  Bell,
  Sparkles,
} from 'lucide-react';
import { Shipment } from '../../types';
import {
  contextIntelligenceService,
  ContextInsight,
  ProactiveSuggestion,
} from '../../services/contextIntelligenceService';

interface ProactiveInsightsProps {
  shipments: Shipment[];
  onInsightAction?: (query: string) => void;
  onDismiss?: (insightId: string) => void;
  maxVisible?: number;
}

const InsightIcon: React.FC<{ type: ContextInsight['type']; severity: ContextInsight['severity'] }> = ({
  type,
  severity,
}) => {
  const iconClass = 'w-4 h-4';

  if (type === 'alert') {
    return severity === 'critical' ? (
      <AlertTriangle className={`${iconClass} text-red-400`} />
    ) : (
      <AlertCircle className={`${iconClass} text-amber-400`} />
    );
  }

  if (type === 'recommendation') {
    return <Lightbulb className={`${iconClass} text-blue-400`} />;
  }

  if (type === 'trend') {
    return <TrendingUp className={`${iconClass} text-purple-400`} />;
  }

  if (type === 'achievement') {
    return <Trophy className={`${iconClass} text-emerald-400`} />;
  }

  return <Bell className={`${iconClass} text-slate-400`} />;
};

const getSeverityStyles = (severity: ContextInsight['severity']) => {
  switch (severity) {
    case 'critical':
      return 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20';
    case 'warning':
      return 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20';
    case 'success':
      return 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20';
    default:
      return 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20';
  }
};

export const ProactiveInsights: React.FC<ProactiveInsightsProps> = ({
  shipments,
  onInsightAction,
  onDismiss,
  maxVisible = 3,
}) => {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(false);

  // Generar briefing y sugerencias
  const briefing = useMemo(
    () => contextIntelligenceService.generateDailyBriefing(shipments),
    [shipments]
  );

  const suggestions = useMemo(
    () => contextIntelligenceService.generateProactiveSuggestions(shipments),
    [shipments]
  );

  // Combinar todas las insights
  const allInsights = useMemo(() => {
    return [
      ...briefing.criticalAlerts,
      ...briefing.recommendations,
      ...briefing.trends,
    ].filter(insight => !dismissedIds.has(insight.id));
  }, [briefing, dismissedIds]);

  const visibleInsights = isExpanded ? allInsights : allInsights.slice(0, maxVisible);
  const hasMore = allInsights.length > maxVisible;

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
    onDismiss?.(id);
  };

  if (allInsights.length === 0 && suggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Critical Alerts Banner */}
      {briefing.criticalAlerts.some(a => a.severity === 'critical') && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl animate-pulse-slow">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-sm font-medium text-red-300">
              Atencion requerida: {briefing.criticalAlerts.filter(a => a.severity === 'critical').length} alerta(s) critica(s)
            </span>
          </div>
        </div>
      )}

      {/* Insights List */}
      <div className="space-y-2">
        {visibleInsights.map((insight) => (
          <div
            key={insight.id}
            className={`p-3 rounded-xl border transition-all ${getSeverityStyles(insight.severity)}`}
          >
            <div className="flex items-start gap-3">
              <InsightIcon type={insight.type} severity={insight.severity} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{insight.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{insight.description}</p>
                {insight.action && (
                  <button
                    onClick={() => onInsightAction?.(insight.action!.query)}
                    className="mt-2 flex items-center gap-1 text-xs text-accent-400 hover:text-accent-300"
                  >
                    {insight.action.label}
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
              <button
                onClick={() => handleDismiss(insight.id)}
                className="p-1 text-slate-500 hover:text-slate-300 hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Show More/Less */}
      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-2 text-center text-xs text-slate-400 hover:text-white transition-colors"
        >
          {isExpanded ? 'Ver menos' : `Ver ${allInsights.length - maxVisible} mas`}
        </button>
      )}

      {/* Quick Suggestions */}
      {suggestions.length > 0 && (
        <div className="pt-2 border-t border-white/10">
          <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Sugerencias
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.slice(0, 3).map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => onInsightAction?.(suggestion.query)}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-slate-300 hover:text-white transition-colors"
              >
                {suggestion.suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// COMPONENTE DE ALERTA EN TIEMPO REAL
// ============================================

interface RealTimeAlertProps {
  insight: ContextInsight;
  onAction?: (query: string) => void;
  onDismiss?: () => void;
  autoHide?: number; // milliseconds
}

export const RealTimeAlert: React.FC<RealTimeAlertProps> = ({
  insight,
  onAction,
  onDismiss,
  autoHide = 10000,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoHide > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, autoHide);
      return () => clearTimeout(timer);
    }
  }, [autoHide, onDismiss]);

  if (!isVisible) return null;

  return (
    <div
      className={`
        fixed bottom-24 right-4 z-50 max-w-sm
        animate-slide-up
        ${getSeverityStyles(insight.severity)}
        p-4 rounded-xl border shadow-2xl backdrop-blur-xl
      `}
    >
      <div className="flex items-start gap-3">
        <InsightIcon type={insight.type} severity={insight.severity} />
        <div className="flex-1">
          <p className="font-medium text-white text-sm">{insight.title}</p>
          <p className="text-xs text-slate-400 mt-1">{insight.description}</p>
          {insight.action && (
            <button
              onClick={() => {
                onAction?.(insight.action!.query);
                setIsVisible(false);
                onDismiss?.();
              }}
              className="mt-2 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs text-white transition-colors"
            >
              {insight.action.label}
            </button>
          )}
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            onDismiss?.();
          }}
          className="p-1 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ProactiveInsights;
