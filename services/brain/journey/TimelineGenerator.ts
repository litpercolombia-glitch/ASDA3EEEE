// services/brain/journey/TimelineGenerator.ts
// Genera datos de timeline para visualización

import { ShipmentEvent, ShipmentStatus, DataSource } from '../types/brain.types';
import { LocationHistory } from './LocationTracker';

export interface TimelineStep {
  id: string;
  order: number;
  title: string;
  description: string;
  timestamp: Date;
  formattedDate: string;
  formattedTime: string;
  relativeTime: string;
  status: ShipmentStatus;
  isCompleted: boolean;
  isCurrent: boolean;
  isUpcoming: boolean;
  hasIssue: boolean;
  location?: string;
  source: DataSource;
  sourceIcon: string;
  statusIcon: string;
  statusColor: string;
  duration?: string; // Tiempo desde el paso anterior
}

export interface TimelineData {
  steps: TimelineStep[];
  totalSteps: number;
  completedSteps: number;
  currentStep: TimelineStep | null;
  progress: number;
  estimatedCompletion?: string;
  summary: {
    startDate: string;
    currentStatus: string;
    daysInTransit: number;
    totalLocations: number;
  };
}

// Configuración de iconos y colores por estado
const STATUS_CONFIG: Record<ShipmentStatus, { icon: string; color: string; label: string }> = {
  pending: { icon: '⏳', color: '#9CA3AF', label: 'Pendiente' },
  picked_up: { icon: '📦', color: '#3B82F6', label: 'Recogido' },
  in_transit: { icon: '🚚', color: '#F59E0B', label: 'En Tránsito' },
  in_distribution: { icon: '🏭', color: '#8B5CF6', label: 'En Distribución' },
  out_for_delivery: { icon: '🛵', color: '#10B981', label: 'En Reparto' },
  delivered: { icon: '✅', color: '#22C55E', label: 'Entregado' },
  in_office: { icon: '🏢', color: '#6366F1', label: 'En Oficina' },
  issue: { icon: '⚠️', color: '#EF4444', label: 'Con Novedad' },
  returned: { icon: '↩️', color: '#DC2626', label: 'Devuelto' },
  cancelled: { icon: '❌', color: '#6B7280', label: 'Cancelado' },
};

const SOURCE_ICONS: Record<DataSource, string> = {
  TRACKING: '📡',
  DROPI: '🛒',
  MANUAL: '✍️',
  SYSTEM: '🤖',
};

class TimelineGeneratorService {
  /**
   * Generar timeline completo para visualización
   */
  generateTimeline(
    events: ShipmentEvent[],
    locationHistory: LocationHistory
  ): TimelineData {
    const steps = events.map((event, index) =>
      this.createTimelineStep(event, index, events)
    );

    // Calcular paso actual
    const currentStep = steps.find(s => s.isCurrent) || steps[steps.length - 1] || null;
    const completedSteps = steps.filter(s => s.isCompleted).length;

    // Calcular días en tránsito
    const startDate = events[0]?.timestamp || new Date();
    const daysInTransit = this.calculateDaysInTransit(startDate);

    return {
      steps,
      totalSteps: steps.length,
      completedSteps,
      currentStep,
      progress: locationHistory.estimatedProgress,
      summary: {
        startDate: this.formatDate(startDate),
        currentStatus: currentStep
          ? STATUS_CONFIG[currentStep.status].label
          : 'Desconocido',
        daysInTransit,
        totalLocations: locationHistory.totalStops,
      },
    };
  }

  /**
   * Crear un paso del timeline
   */
  private createTimelineStep(
    event: ShipmentEvent,
    index: number,
    allEvents: ShipmentEvent[]
  ): TimelineStep {
    const isLast = index === allEvents.length - 1;
    const config = STATUS_CONFIG[event.status] || STATUS_CONFIG.in_transit;

    // Determinar si está completado, es actual o está pendiente
    const terminalStatuses: ShipmentStatus[] = ['delivered', 'returned', 'cancelled'];
    const currentStatus = allEvents[allEvents.length - 1]?.status;
    const isTerminal = terminalStatuses.includes(currentStatus);

    const isCompleted = isTerminal ? true : !isLast;
    const isCurrent = isLast && !isTerminal;
    const isUpcoming = false; // En el timeline solo mostramos eventos pasados

    // Calcular duración desde paso anterior
    let duration: string | undefined;
    if (index > 0) {
      const prevEvent = allEvents[index - 1];
      duration = this.calculateDuration(prevEvent.timestamp, event.timestamp);
    }

    return {
      id: event.id,
      order: index + 1,
      title: config.label,
      description: event.description,
      timestamp: event.timestamp,
      formattedDate: this.formatDate(event.timestamp),
      formattedTime: this.formatTime(event.timestamp),
      relativeTime: this.getRelativeTime(event.timestamp),
      status: event.status,
      isCompleted,
      isCurrent,
      isUpcoming,
      hasIssue: event.status === 'issue' || event.status === 'returned',
      location: event.location,
      source: event.source,
      sourceIcon: SOURCE_ICONS[event.source],
      statusIcon: config.icon,
      statusColor: config.color,
      duration,
    };
  }

  /**
   * Generar timeline simplificado (solo hitos principales)
   */
  generateSimplifiedTimeline(events: ShipmentEvent[]): TimelineStep[] {
    // Filtrar solo cambios de estado significativos
    const milestones: ShipmentStatus[] = [
      'pending',
      'picked_up',
      'in_transit',
      'in_distribution',
      'out_for_delivery',
      'delivered',
      'issue',
      'returned',
    ];

    const seen = new Set<ShipmentStatus>();
    const simplified = events.filter(event => {
      if (!milestones.includes(event.status)) return false;
      if (seen.has(event.status)) return false;
      seen.add(event.status);
      return true;
    });

    return simplified.map((event, index) =>
      this.createTimelineStep(event, index, simplified)
    );
  }

  /**
   * Generar datos para visualización en tarjeta
   */
  generateCardData(events: ShipmentEvent[]): {
    icon: string;
    color: string;
    label: string;
    lastUpdate: string;
    progress: number;
  } {
    const lastEvent = events[events.length - 1];
    if (!lastEvent) {
      return {
        icon: '❓',
        color: '#9CA3AF',
        label: 'Sin información',
        lastUpdate: 'N/A',
        progress: 0,
      };
    }

    const config = STATUS_CONFIG[lastEvent.status] || STATUS_CONFIG.in_transit;
    const progressMap: Record<ShipmentStatus, number> = {
      pending: 10,
      picked_up: 20,
      in_transit: 45,
      in_distribution: 65,
      out_for_delivery: 85,
      in_office: 90,
      delivered: 100,
      issue: 50,
      returned: 100,
      cancelled: 100,
    };

    return {
      icon: config.icon,
      color: config.color,
      label: config.label,
      lastUpdate: this.getRelativeTime(lastEvent.timestamp),
      progress: progressMap[lastEvent.status] || 30,
    };
  }

  // ==================== HELPERS ====================

  private formatDate(date: Date): string {
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Justo ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    return this.formatDate(date);
  }

  private calculateDuration(from: Date, to: Date): string {
    const diffMs = to.getTime() - from.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m`;
    if (diffDays < 2) return `${diffDays} día ${diffHours % 24}h`;
    return `${diffDays} días`;
  }

  private calculateDaysInTransit(startDate: Date): number {
    const now = new Date();
    const diffMs = now.getTime() - startDate.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }
}

// Singleton
export const timelineGenerator = new TimelineGeneratorService();
export default timelineGenerator;
