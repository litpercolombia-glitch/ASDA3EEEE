/**
 * Activity Feed Component
 *
 * Feed de actividad en tiempo real para el Dashboard Ejecutivo.
 * Muestra eventos recientes del sistema con auto-actualización.
 */

import React, { useState, useEffect, useRef } from 'react';
import { ActivityFeed as ActivityFeedType, RealTimeEvent, EventType, EventSeverity } from '../../types/executiveDashboard.types';

// ============================================
// CONFIGURACIÓN DE EVENTOS
// ============================================

const eventConfig: Record<EventType, { icon: string; label: string; color: string }> = {
  order_created: { icon: '🛒', label: 'Nueva orden', color: 'text-blue-400' },
  order_shipped: { icon: '📦', label: 'Orden despachada', color: 'text-indigo-400' },
  delivery_completed: { icon: '✅', label: 'Entrega completada', color: 'text-emerald-400' },
  delivery_failed: { icon: '❌', label: 'Entrega fallida', color: 'text-red-400' },
  return_initiated: { icon: '↩️', label: 'Devolución iniciada', color: 'text-amber-400' },
  alert_triggered: { icon: '⚠️', label: 'Alerta activada', color: 'text-amber-400' },
  milestone_reached: { icon: '🎉', label: 'Meta alcanzada', color: 'text-purple-400' },
  anomaly_detected: { icon: '🔍', label: 'Anomalía detectada', color: 'text-orange-400' },
  sla_breach: { icon: '⏰', label: 'SLA incumplido', color: 'text-red-400' },
  inventory_low: { icon: '📉', label: 'Stock bajo', color: 'text-amber-400' },
  payment_received: { icon: '💰', label: 'Pago recibido', color: 'text-emerald-400' },
  customer_feedback: { icon: '⭐', label: 'Reseña recibida', color: 'text-yellow-400' },
};

const severityStyles: Record<EventSeverity, { bg: string; border: string }> = {
  info: { bg: 'bg-slate-800/50', border: 'border-slate-700/50' },
  success: { bg: 'bg-emerald-900/20', border: 'border-emerald-500/30' },
  warning: { bg: 'bg-amber-900/20', border: 'border-amber-500/30' },
  error: { bg: 'bg-red-900/20', border: 'border-red-500/30' },
};

// ============================================
// UTILIDADES
// ============================================

function formatTimestamp(date: Date): string {
  const now = new Date();
  const eventDate = new Date(date);
  const diffMs = now.getTime() - eventDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `hace ${diffMins}m`;
  if (diffHours < 24) return `hace ${diffHours}h`;

  return eventDate.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================
// COMPONENTES INTERNOS
// ============================================

interface EventItemProps {
  event: RealTimeEvent;
  isNew?: boolean;
  onClick?: () => void;
}

const EventItem: React.FC<EventItemProps> = ({ event, isNew = false, onClick }) => {
  const config = eventConfig[event.type] || {
    icon: '📌',
    label: 'Evento',
    color: 'text-gray-400',
  };
  const severity = severityStyles[event.severity];

  return (
    <div
      className={`
        ${severity.bg} ${severity.border}
        border rounded-lg p-3
        ${onClick ? 'cursor-pointer hover:bg-slate-700/30' : ''}
        ${isNew ? 'animate-pulse-once' : ''}
        transition-all duration-200
      `}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-lg">
          {event.icon || config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${config.color}`}>{event.title}</span>
            {isNew && (
              <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] rounded">
                NUEVO
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-0.5">{event.description}</p>

          {/* Metadata Tags */}
          {event.metadata && Object.keys(event.metadata).length > 0 && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {event.metadata.orderId && (
                <span className="px-2 py-0.5 bg-slate-700/50 rounded text-xs text-gray-300">
                  #{event.metadata.orderId}
                </span>
              )}
              {event.metadata.city && (
                <span className="px-2 py-0.5 bg-slate-700/50 rounded text-xs text-gray-300">
                  📍 {event.metadata.city}
                </span>
              )}
              {event.metadata.carrier && (
                <span className="px-2 py-0.5 bg-slate-700/50 rounded text-xs text-gray-300">
                  🚚 {event.metadata.carrier}
                </span>
              )}
              {event.metadata.amount && (
                <span className="px-2 py-0.5 bg-emerald-500/20 rounded text-xs text-emerald-400">
                  ${event.metadata.amount.toLocaleString()}
                </span>
              )}
              {event.metadata.rating && (
                <span className="px-2 py-0.5 bg-yellow-500/20 rounded text-xs text-yellow-400">
                  {'⭐'.repeat(event.metadata.rating)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-xs text-gray-500 flex-shrink-0">
          {formatTimestamp(event.timestamp)}
        </span>
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

interface ActivityFeedProps {
  feed: ActivityFeedType;
  maxItems?: number;
  onEventClick?: (event: RealTimeEvent) => void;
  onLoadMore?: () => void;
  autoScroll?: boolean;
  newEventIds?: Set<string>;
}

export const ActivityFeedComponent: React.FC<ActivityFeedProps> = ({
  feed,
  maxItems = 10,
  onEventClick,
  onLoadMore,
  autoScroll = true,
  newEventIds = new Set(),
}) => {
  const [filter, setFilter] = useState<EventType | 'all'>('all');
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredEvents = feed.events.filter(
    (event) => filter === 'all' || event.type === filter
  );

  const visibleEvents = filteredEvents.slice(0, maxItems);

  // Auto-scroll cuando hay nuevos eventos
  useEffect(() => {
    if (autoScroll && !isPaused && containerRef.current && newEventIds.size > 0) {
      containerRef.current.scrollTop = 0;
    }
  }, [newEventIds, autoScroll, isPaused]);

  // Filtros rápidos
  const quickFilters: { type: EventType | 'all'; label: string; icon: string }[] = [
    { type: 'all', label: 'Todos', icon: '📋' },
    { type: 'delivery_completed', label: 'Entregas', icon: '✅' },
    { type: 'order_created', label: 'Órdenes', icon: '🛒' },
    { type: 'alert_triggered', label: 'Alertas', icon: '⚠️' },
  ];

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">Actividad</h3>
            <span className="px-2 py-0.5 bg-slate-700 rounded text-xs text-gray-400">
              {feed.stats.totalToday} hoy
            </span>
          </div>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`p-1.5 rounded transition-colors ${
              isPaused
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-slate-700 text-gray-400 hover:text-white'
            }`}
            title={isPaused ? 'Reanudar auto-scroll' : 'Pausar auto-scroll'}
          >
            {isPaused ? '▶️' : '⏸️'}
          </button>
        </div>

        {/* Quick Filters */}
        <div className="flex items-center gap-1">
          {quickFilters.map((qf) => (
            <button
              key={qf.type}
              onClick={() => setFilter(qf.type)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                filter === qf.type
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {qf.icon} {qf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {visibleEvents.length > 0 ? (
          visibleEvents.map((event) => (
            <EventItem
              key={event.id}
              event={event}
              isNew={newEventIds.has(event.id)}
              onClick={onEventClick ? () => onEventClick(event) : undefined}
            />
          ))
        ) : (
          <div className="text-center py-8">
            <span className="text-4xl">📭</span>
            <p className="text-gray-400 mt-2">No hay actividad reciente</p>
          </div>
        )}

        {/* Load More */}
        {feed.hasMore && onLoadMore && (
          <button
            onClick={onLoadMore}
            className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cargar más eventos
          </button>
        )}
      </div>

      {/* Footer Stats */}
      <div className="px-4 py-2 border-t border-slate-700/50 bg-slate-900/30">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {feed.events.length} eventos mostrados
          </span>
          <div className="flex items-center gap-3">
            <span className="text-emerald-400">
              ✅ {feed.stats.byType.delivery_completed || 0}
            </span>
            <span className="text-blue-400">
              🛒 {feed.stats.byType.order_created || 0}
            </span>
            <span className="text-red-400">
              ❌ {feed.stats.byType.delivery_failed || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// COMPACT ACTIVITY WIDGET
// ============================================

interface CompactActivityWidgetProps {
  feed: ActivityFeedType;
  maxItems?: number;
  onViewAll?: () => void;
}

export const CompactActivityWidget: React.FC<CompactActivityWidgetProps> = ({
  feed,
  maxItems = 5,
  onViewAll,
}) => {
  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">Actividad Reciente</h3>
        <span className="text-xs text-gray-500">{feed.stats.totalToday} hoy</span>
      </div>

      <div className="space-y-2">
        {feed.events.slice(0, maxItems).map((event) => {
          const config = eventConfig[event.type];
          return (
            <div key={event.id} className="flex items-center gap-3 py-1">
              <span className="text-lg">{event.icon || config?.icon || '📌'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{event.title}</p>
                <p className="text-xs text-gray-500 truncate">{event.description}</p>
              </div>
              <span className="text-xs text-gray-500 flex-shrink-0">
                {formatTimestamp(event.timestamp)}
              </span>
            </div>
          );
        })}
      </div>

      {onViewAll && (
        <button
          onClick={onViewAll}
          className="w-full mt-3 py-2 text-sm text-gray-400 hover:text-white transition-colors border-t border-slate-700/50"
        >
          Ver toda la actividad
        </button>
      )}
    </div>
  );
};

// ============================================
// LIVE TICKER
// ============================================

interface LiveTickerProps {
  events: RealTimeEvent[];
  speed?: number;
}

export const LiveTicker: React.FC<LiveTickerProps> = ({ events, speed = 30 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (events.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % events.length);
    }, speed * 100);

    return () => clearInterval(interval);
  }, [events.length, speed]);

  if (events.length === 0) return null;

  const currentEvent = events[currentIndex];
  const config = eventConfig[currentEvent.type];

  return (
    <div className="bg-slate-800/80 backdrop-blur border-b border-slate-700/50 px-4 py-2">
      <div className="flex items-center gap-3 animate-fade-in">
        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
        <span className="text-lg">{currentEvent.icon || config?.icon}</span>
        <span className="text-sm text-white">{currentEvent.title}</span>
        <span className="text-sm text-gray-400">—</span>
        <span className="text-sm text-gray-400">{currentEvent.description}</span>
        <span className="text-xs text-gray-500 ml-auto">
          {formatTimestamp(currentEvent.timestamp)}
        </span>
      </div>
    </div>
  );
};

// ============================================
// CSS ANIMATIONS (para incluir en globals.css)
// ============================================

/*
@keyframes pulse-once {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.animate-pulse-once {
  animation: pulse-once 0.5s ease-in-out;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
*/

export default ActivityFeedComponent;
