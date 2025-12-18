// services/brain/journey/JourneyBuilder.ts
// Constructor principal del Journey (Historia visual del envío)

import { UnifiedShipment, ShipmentEvent } from '../types/brain.types';
import { TrackingData, DropiData } from '../unification/ShipmentMatcher';
import { eventCollector, CollectedEvents } from './EventCollector';
import { locationTracker, LocationHistory } from './LocationTracker';
import { timelineGenerator, TimelineData, TimelineStep } from './TimelineGenerator';
import { eventBus } from '../core/EventBus';
import { centralBrain } from '../core/CentralBrain';

export interface ShipmentJourney {
  shipmentId: string;
  trackingNumber: string;
  orderNumber?: string;

  // Timeline visual
  timeline: TimelineData;
  simplifiedTimeline: TimelineStep[];

  // Ubicaciones
  locations: LocationHistory;

  // Datos recolectados
  collectedEvents: CollectedEvents;

  // Estado actual
  currentState: {
    status: string;
    statusLabel: string;
    statusIcon: string;
    statusColor: string;
    location: string | null;
    lastUpdate: Date;
    daysInTransit: number;
    progress: number;
  };

  // Alertas del journey
  alerts: Array<{
    type: 'warning' | 'error' | 'info';
    message: string;
    timestamp: Date;
  }>;

  // Predicciones
  predictions: {
    estimatedDelivery?: Date;
    deliveryProbability?: number;
    riskOfDelay?: number;
  };

  // Metadata
  generatedAt: Date;
  sources: string[];
}

class JourneyBuilderService {
  /**
   * Construir journey completo desde un envío unificado
   */
  buildFromUnifiedShipment(shipment: UnifiedShipment): ShipmentJourney {
    // Recolectar eventos
    const collectedEvents: CollectedEvents = {
      events: shipment.events,
      firstEvent: shipment.events[0] || null,
      lastEvent: shipment.events[shipment.events.length - 1] || null,
      totalEvents: shipment.events.length,
      sourceBreakdown: this.calculateSourceBreakdown(shipment.events),
    };

    // Extraer ubicaciones
    const locations = locationTracker.extractFromEvents(shipment.events);

    // Generar timeline
    const timeline = timelineGenerator.generateTimeline(shipment.events, locations);
    const simplifiedTimeline = timelineGenerator.generateSimplifiedTimeline(shipment.events);

    // Estado actual
    const cardData = timelineGenerator.generateCardData(shipment.events);
    const currentState = {
      status: shipment.currentStatus.value,
      statusLabel: cardData.label,
      statusIcon: cardData.icon,
      statusColor: cardData.color,
      location: shipment.currentLocation?.value || null,
      lastUpdate: shipment.lastUpdate,
      daysInTransit: shipment.daysInTransit,
      progress: cardData.progress,
    };

    // Detectar alertas
    const alerts = this.detectAlerts(shipment, locations);

    // Predicciones básicas
    const predictions = this.generatePredictions(shipment, locations);

    const journey: ShipmentJourney = {
      shipmentId: shipment.id,
      trackingNumber: shipment.trackingNumber,
      orderNumber: shipment.orderNumber,
      timeline,
      simplifiedTimeline,
      locations,
      collectedEvents,
      currentState,
      alerts,
      predictions,
      generatedAt: new Date(),
      sources: shipment.sources,
    };

    // Emitir evento
    eventBus.emit('journey.built', {
      shipmentId: shipment.id,
      trackingNumber: shipment.trackingNumber,
      eventsCount: collectedEvents.totalEvents,
      locationsCount: locations.totalStops,
    });

    return journey;
  }

  /**
   * Construir journey desde datos raw de tracking + dropi
   */
  buildFromRawData(
    trackingData: TrackingData,
    dropiData?: DropiData | null
  ): ShipmentJourney {
    // Recolectar eventos de ambas fuentes
    const trackingEvents = eventCollector.collectFromTracking(trackingData);
    const dropiEvents = dropiData ? eventCollector.collectFromDropi(dropiData) : [];

    // Merge y normalizar
    const collectedEvents = eventCollector.mergeAndNormalize(trackingEvents, dropiEvents);

    // Extraer ubicaciones
    const locations = locationTracker.extractFromEvents(collectedEvents.events);

    // Generar timeline
    const timeline = timelineGenerator.generateTimeline(collectedEvents.events, locations);
    const simplifiedTimeline = timelineGenerator.generateSimplifiedTimeline(collectedEvents.events);

    // Estado actual
    const cardData = timelineGenerator.generateCardData(collectedEvents.events);
    const lastEvent = collectedEvents.lastEvent;

    const currentState = {
      status: lastEvent?.status || 'pending',
      statusLabel: cardData.label,
      statusIcon: cardData.icon,
      statusColor: cardData.color,
      location: lastEvent?.location || null,
      lastUpdate: lastEvent?.timestamp || new Date(),
      daysInTransit: this.calculateDaysInTransit(collectedEvents.firstEvent?.timestamp),
      progress: cardData.progress,
    };

    // Detectar alertas
    const alerts = this.detectAlertsFromEvents(collectedEvents.events, locations);

    // Predicciones
    const predictions = this.generatePredictionsFromEvents(collectedEvents.events);

    return {
      shipmentId: `journey_${trackingData.trackingNumber}`,
      trackingNumber: trackingData.trackingNumber,
      orderNumber: dropiData?.orderNumber,
      timeline,
      simplifiedTimeline,
      locations,
      collectedEvents,
      currentState,
      alerts,
      predictions,
      generatedAt: new Date(),
      sources: dropiData ? ['TRACKING', 'DROPI'] : ['TRACKING'],
    };
  }

  /**
   * Actualizar journey existente con nuevos eventos
   */
  updateJourney(
    existingJourney: ShipmentJourney,
    newEvents: ShipmentEvent[]
  ): ShipmentJourney {
    // Combinar eventos existentes con nuevos
    const allEvents = [...existingJourney.collectedEvents.events, ...newEvents];

    // Eliminar duplicados por ID
    const uniqueEvents = Array.from(
      new Map(allEvents.map(e => [e.id, e])).values()
    ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Reconstruir
    const collectedEvents: CollectedEvents = {
      events: uniqueEvents,
      firstEvent: uniqueEvents[0] || null,
      lastEvent: uniqueEvents[uniqueEvents.length - 1] || null,
      totalEvents: uniqueEvents.length,
      sourceBreakdown: this.calculateSourceBreakdown(uniqueEvents),
    };

    const locations = locationTracker.extractFromEvents(uniqueEvents);
    const timeline = timelineGenerator.generateTimeline(uniqueEvents, locations);
    const simplifiedTimeline = timelineGenerator.generateSimplifiedTimeline(uniqueEvents);

    const cardData = timelineGenerator.generateCardData(uniqueEvents);
    const lastEvent = collectedEvents.lastEvent;

    return {
      ...existingJourney,
      collectedEvents,
      locations,
      timeline,
      simplifiedTimeline,
      currentState: {
        status: lastEvent?.status || existingJourney.currentState.status,
        statusLabel: cardData.label,
        statusIcon: cardData.icon,
        statusColor: cardData.color,
        location: lastEvent?.location || existingJourney.currentState.location,
        lastUpdate: lastEvent?.timestamp || existingJourney.currentState.lastUpdate,
        daysInTransit: this.calculateDaysInTransit(collectedEvents.firstEvent?.timestamp),
        progress: cardData.progress,
      },
      alerts: this.detectAlertsFromEvents(uniqueEvents, locations),
      predictions: this.generatePredictionsFromEvents(uniqueEvents),
      generatedAt: new Date(),
    };
  }

  /**
   * Obtener journey de un envío registrado en el cerebro
   */
  getJourneyForShipment(shipmentId: string): ShipmentJourney | null {
    const shipment = centralBrain.getShipment(shipmentId);
    if (!shipment) return null;
    return this.buildFromUnifiedShipment(shipment);
  }

  // ==================== HELPERS ====================

  private calculateSourceBreakdown(
    events: ShipmentEvent[]
  ): CollectedEvents['sourceBreakdown'] {
    const breakdown: CollectedEvents['sourceBreakdown'] = {
      TRACKING: 0,
      DROPI: 0,
      MANUAL: 0,
      SYSTEM: 0,
    };
    events.forEach(e => {
      breakdown[e.source]++;
    });
    return breakdown;
  }

  private detectAlerts(
    shipment: UnifiedShipment,
    locations: LocationHistory
  ): ShipmentJourney['alerts'] {
    const alerts: ShipmentJourney['alerts'] = [];

    // Alerta si tiene novedad
    if (shipment.hasIssue) {
      alerts.push({
        type: 'error',
        message: shipment.issueDescription || 'El envío tiene una novedad',
        timestamp: new Date(),
      });
    }

    // Alerta si está retrasado
    if (shipment.isDelayed) {
      alerts.push({
        type: 'warning',
        message: `Envío retrasado - ${shipment.daysInTransit} días en tránsito`,
        timestamp: new Date(),
      });
    }

    // Alerta si no hay actualizaciones recientes
    const hoursSinceUpdate =
      (new Date().getTime() - shipment.lastUpdate.getTime()) / (1000 * 60 * 60);
    if (hoursSinceUpdate > 48 && shipment.currentStatus.value !== 'delivered') {
      alerts.push({
        type: 'warning',
        message: 'Sin actualizaciones en más de 48 horas',
        timestamp: new Date(),
      });
    }

    return alerts;
  }

  private detectAlertsFromEvents(
    events: ShipmentEvent[],
    locations: LocationHistory
  ): ShipmentJourney['alerts'] {
    const alerts: ShipmentJourney['alerts'] = [];
    const lastEvent = events[events.length - 1];

    if (!lastEvent) return alerts;

    // Alerta si el último estado es problemático
    if (lastEvent.status === 'issue' || lastEvent.status === 'returned') {
      alerts.push({
        type: 'error',
        message: lastEvent.description || 'Problema detectado en el envío',
        timestamp: lastEvent.timestamp,
      });
    }

    // Alerta si lleva muchos días
    const firstEvent = events[0];
    if (firstEvent) {
      const daysInTransit = Math.ceil(
        (new Date().getTime() - firstEvent.timestamp.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysInTransit > 5 && lastEvent.status !== 'delivered') {
        alerts.push({
          type: 'warning',
          message: `${daysInTransit} días en tránsito - posible retraso`,
          timestamp: new Date(),
        });
      }
    }

    return alerts;
  }

  private generatePredictions(
    shipment: UnifiedShipment,
    locations: LocationHistory
  ): ShipmentJourney['predictions'] {
    // Predicción simple basada en días promedio
    const avgDeliveryDays = 4;
    const daysRemaining = Math.max(0, avgDeliveryDays - shipment.daysInTransit);

    return {
      estimatedDelivery: shipment.currentStatus.value !== 'delivered'
        ? new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000)
        : undefined,
      deliveryProbability: shipment.hasIssue ? 60 : 85,
      riskOfDelay: shipment.isDelayed ? 70 : shipment.daysInTransit > 3 ? 40 : 15,
    };
  }

  private generatePredictionsFromEvents(
    events: ShipmentEvent[]
  ): ShipmentJourney['predictions'] {
    const lastEvent = events[events.length - 1];

    if (!lastEvent || lastEvent.status === 'delivered') {
      return {};
    }

    // Basado en el estado actual
    const statusToDeliveryDays: Record<string, number> = {
      pending: 5,
      picked_up: 4,
      in_transit: 3,
      in_distribution: 2,
      out_for_delivery: 1,
    };

    const daysToDelivery = statusToDeliveryDays[lastEvent.status] || 3;

    return {
      estimatedDelivery: new Date(Date.now() + daysToDelivery * 24 * 60 * 60 * 1000),
      deliveryProbability: lastEvent.status === 'issue' ? 50 : 80,
      riskOfDelay: lastEvent.status === 'issue' ? 60 : 20,
    };
  }

  private calculateDaysInTransit(startDate?: Date): number {
    if (!startDate) return 0;
    const diffMs = new Date().getTime() - startDate.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }
}

// Singleton
export const journeyBuilder = new JourneyBuilderService();
export default journeyBuilder;
