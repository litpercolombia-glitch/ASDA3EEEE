// services/brain/journey/EventCollector.ts
// Recolecta y normaliza eventos de todas las fuentes

import { ShipmentEvent, DataSource, ShipmentStatus } from '../types/brain.types';
import { TrackingData, DropiData } from '../unification/ShipmentMatcher';

export interface RawEvent {
  timestamp: Date;
  description: string;
  status?: string;
  location?: string;
  source: DataSource;
  rawData?: unknown;
}

export interface CollectedEvents {
  events: ShipmentEvent[];
  firstEvent: ShipmentEvent | null;
  lastEvent: ShipmentEvent | null;
  totalEvents: number;
  sourceBreakdown: Record<DataSource, number>;
}

// Mapeo de descripciones a estados
const DESCRIPTION_TO_STATUS: Array<{ pattern: RegExp; status: ShipmentStatus }> = [
  { pattern: /recogido|recolectado|pickup|collected/i, status: 'picked_up' },
  { pattern: /en tr[aá]nsito|in transit|despachado|enviado/i, status: 'in_transit' },
  { pattern: /en reparto|out for delivery|en camino a/i, status: 'out_for_delivery' },
  { pattern: /distribu/i, status: 'in_distribution' },
  { pattern: /entregado|delivered|completado/i, status: 'delivered' },
  { pattern: /oficina|sucursal|punto de recogida/i, status: 'in_office' },
  { pattern: /novedad|problema|issue|fallido|no entregado/i, status: 'issue' },
  { pattern: /devuelto|returned|retorno/i, status: 'returned' },
  { pattern: /cancelado|cancelled/i, status: 'cancelled' },
  { pattern: /creado|pedido|orden|created/i, status: 'pending' },
];

class EventCollectorService {
  /**
   * Recolectar eventos de datos de tracking
   */
  collectFromTracking(trackingData: TrackingData): RawEvent[] {
    const events: RawEvent[] = [];

    // Eventos del historial de tracking
    if (trackingData.events && trackingData.events.length > 0) {
      trackingData.events.forEach(evt => {
        events.push({
          timestamp: evt.date,
          description: evt.description,
          location: evt.location,
          source: 'TRACKING',
          rawData: evt,
        });
      });
    }

    // Si no hay eventos pero hay estado actual, crear evento
    if (events.length === 0) {
      events.push({
        timestamp: trackingData.lastUpdate,
        description: trackingData.status,
        status: trackingData.status,
        location: trackingData.location,
        source: 'TRACKING',
      });
    }

    return events;
  }

  /**
   * Recolectar eventos de datos de Dropi
   */
  collectFromDropi(dropiData: DropiData): RawEvent[] {
    const events: RawEvent[] = [];

    // Evento de creación del pedido
    events.push({
      timestamp: dropiData.createdAt,
      description: `Pedido creado - ${dropiData.product.name}`,
      status: 'pending',
      source: 'DROPI',
      rawData: {
        orderNumber: dropiData.orderNumber,
        product: dropiData.product,
        customer: dropiData.customer.name,
      },
    });

    // Si hay número de guía asignado
    if (dropiData.trackingNumber) {
      events.push({
        timestamp: new Date(dropiData.createdAt.getTime() + 1000), // 1 segundo después
        description: `Guía asignada: ${dropiData.trackingNumber}`,
        source: 'DROPI',
      });
    }

    // Si hay estado de Dropi
    if (dropiData.status) {
      events.push({
        timestamp: new Date(), // Ahora (no tenemos timestamp exacto de Dropi)
        description: dropiData.status,
        status: dropiData.status,
        source: 'DROPI',
      });
    }

    return events;
  }

  /**
   * Combinar y normalizar eventos de múltiples fuentes
   */
  mergeAndNormalize(
    trackingEvents: RawEvent[],
    dropiEvents: RawEvent[]
  ): CollectedEvents {
    const allEvents = [...trackingEvents, ...dropiEvents];

    // Convertir a ShipmentEvent normalizado
    const normalized = allEvents.map((evt, index) => this.normalizeEvent(evt, index));

    // Eliminar duplicados (eventos muy cercanos en tiempo con misma descripción)
    const deduplicated = this.deduplicateEvents(normalized);

    // Ordenar por timestamp
    const sorted = deduplicated.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    // Calcular breakdown por fuente
    const sourceBreakdown: Record<DataSource, number> = {
      TRACKING: 0,
      DROPI: 0,
      MANUAL: 0,
      SYSTEM: 0,
    };
    sorted.forEach(evt => {
      sourceBreakdown[evt.source]++;
    });

    return {
      events: sorted,
      firstEvent: sorted[0] || null,
      lastEvent: sorted[sorted.length - 1] || null,
      totalEvents: sorted.length,
      sourceBreakdown,
    };
  }

  /**
   * Normalizar un evento raw a ShipmentEvent
   */
  private normalizeEvent(raw: RawEvent, index: number): ShipmentEvent {
    return {
      id: `evt_${raw.source.toLowerCase()}_${index}_${Date.now()}`,
      timestamp: raw.timestamp,
      status: this.inferStatus(raw),
      description: this.cleanDescription(raw.description),
      location: raw.location,
      source: raw.source,
      rawData: raw.rawData,
    };
  }

  /**
   * Inferir estado del envío basado en descripción
   */
  private inferStatus(event: RawEvent): ShipmentStatus {
    // Si ya tiene estado, normalizarlo
    if (event.status) {
      const normalized = event.status.toUpperCase().trim();
      const statusMap: Record<string, ShipmentStatus> = {
        ENTREGADO: 'delivered',
        DELIVERED: 'delivered',
        PENDIENTE: 'pending',
        PENDING: 'pending',
        'EN TRANSITO': 'in_transit',
        'EN TRÁNSITO': 'in_transit',
        IN_TRANSIT: 'in_transit',
        NOVEDAD: 'issue',
        DEVUELTO: 'returned',
      };
      if (statusMap[normalized]) return statusMap[normalized];
    }

    // Inferir de la descripción
    for (const mapping of DESCRIPTION_TO_STATUS) {
      if (mapping.pattern.test(event.description)) {
        return mapping.status;
      }
    }

    return 'in_transit'; // Default
  }

  /**
   * Limpiar y formatear descripción
   */
  private cleanDescription(description: string): string {
    return description
      .trim()
      .replace(/\s+/g, ' ') // Múltiples espacios a uno
      .replace(/^[-_•]\s*/, '') // Quitar bullets al inicio
      .slice(0, 200); // Máximo 200 caracteres
  }

  /**
   * Eliminar eventos duplicados
   */
  private deduplicateEvents(events: ShipmentEvent[]): ShipmentEvent[] {
    const seen = new Map<string, ShipmentEvent>();

    events.forEach(evt => {
      // Crear key basado en timestamp (redondeado a minuto) + descripción similar
      const timeKey = Math.floor(evt.timestamp.getTime() / 60000); // Minuto
      const descKey = evt.description.toLowerCase().slice(0, 30);
      const key = `${timeKey}_${descKey}`;

      // Si ya existe, mantener el de fuente más confiable
      const existing = seen.get(key);
      if (!existing) {
        seen.set(key, evt);
      } else {
        // TRACKING tiene prioridad
        if (evt.source === 'TRACKING' && existing.source !== 'TRACKING') {
          seen.set(key, evt);
        }
      }
    });

    return Array.from(seen.values());
  }

  /**
   * Agregar evento manual
   */
  createManualEvent(
    description: string,
    status?: ShipmentStatus,
    location?: string
  ): ShipmentEvent {
    return {
      id: `evt_manual_${Date.now()}`,
      timestamp: new Date(),
      status: status || 'in_transit',
      description,
      location,
      source: 'MANUAL',
    };
  }

  /**
   * Crear evento de sistema
   */
  createSystemEvent(
    description: string,
    status: ShipmentStatus
  ): ShipmentEvent {
    return {
      id: `evt_system_${Date.now()}`,
      timestamp: new Date(),
      status,
      description,
      source: 'SYSTEM',
    };
  }
}

// Singleton
export const eventCollector = new EventCollectorService();
export default eventCollector;
