// services/brain/unification/DataUnifier.ts
// Une datos de Tracking + Dropi en un solo objeto unificado

import {
  UnifiedShipment,
  SourcedData,
  ShipmentStatus,
  ShipmentEvent,
  DataSource,
} from '../types/brain.types';
import { shipmentMatcher, TrackingData, DropiData, MatchResult } from './ShipmentMatcher';
import { resolveBestValue, getSourceConfidence } from './SourcePriority';
import { eventBus } from '../core/EventBus';
import { centralBrain } from '../core/CentralBrain';

// Mapeo de estados de transportadoras a estados unificados
const STATUS_MAP: Record<string, ShipmentStatus> = {
  // Estados comunes de tracking
  'RECOGIDO': 'picked_up',
  'EN TRANSITO': 'in_transit',
  'EN TRÁNSITO': 'in_transit',
  'IN_TRANSIT': 'in_transit',
  'EN CAMINO': 'in_transit',
  'EN REPARTO': 'out_for_delivery',
  'EN DISTRIBUCIÓN': 'in_distribution',
  'ENTREGADO': 'delivered',
  'DELIVERED': 'delivered',
  'EN OFICINA': 'in_office',
  'DISPONIBLE EN OFICINA': 'in_office',
  'NOVEDAD': 'issue',
  'CON NOVEDAD': 'issue',
  'ISSUE': 'issue',
  'DEVUELTO': 'returned',
  'RETURNED': 'returned',
  'CANCELADO': 'cancelled',
  'CANCELLED': 'cancelled',
  'PENDIENTE': 'pending',
  'PENDING': 'pending',
};

class DataUnifierService {
  /**
   * Crear un envío unificado desde un MatchResult
   */
  createUnifiedShipment(match: MatchResult): UnifiedShipment {
    const { trackingData, dropiData, matchConfidence } = match;

    // Determinar fuentes disponibles
    const sources: DataSource[] = ['TRACKING'];
    if (dropiData) sources.push('DROPI');

    // Crear el shipment unificado
    const unified: UnifiedShipment = {
      id: this.generateId(),
      trackingNumber: trackingData.trackingNumber,
      orderNumber: dropiData?.orderNumber,
      invoiceNumber: dropiData?.invoiceNumber,

      // Estado - prioridad TRACKING
      currentStatus: this.createSourcedData(
        this.normalizeStatus(trackingData.status),
        'TRACKING',
        trackingData.lastUpdate
      ),
      lastUpdate: trackingData.lastUpdate,

      // Ubicación - prioridad TRACKING
      currentLocation: trackingData.location
        ? this.createSourcedData(trackingData.location, 'TRACKING')
        : undefined,
      origin: this.resolveOrigin(trackingData, dropiData),
      destination: this.resolveDestination(trackingData, dropiData),

      // Cliente - prioridad DROPI
      customer: this.resolveCustomer(trackingData, dropiData),

      // Producto - solo de DROPI
      product: dropiData ? {
        name: this.createSourcedData(dropiData.product.name, 'DROPI'),
        quantity: this.createSourcedData(dropiData.product.quantity, 'DROPI'),
        value: this.createSourcedData(dropiData.product.value, 'DROPI'),
      } : undefined,

      // Logística
      carrier: this.createSourcedData(
        trackingData.carrier,
        'TRACKING',
        trackingData.lastUpdate
      ),
      estimatedDelivery: undefined,
      actualDelivery: trackingData.status === 'ENTREGADO' ? trackingData.lastUpdate : undefined,
      daysInTransit: this.calculateDaysInTransit(trackingData, dropiData),

      // Problemas
      hasIssue: this.hasIssue(trackingData.status),
      issueType: undefined,
      issueDescription: undefined,
      isDelayed: this.isDelayed(trackingData, dropiData),

      // Timeline
      events: this.buildEvents(trackingData, dropiData),

      // Metadatos
      sources,
      matchConfidence,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Registrar en el cerebro central
    centralBrain.registerShipment(unified);

    // Emitir evento
    eventBus.emit('shipment.matched', {
      shipmentId: unified.id,
      trackingNumber: unified.trackingNumber,
      orderNumber: unified.orderNumber,
      matchConfidence,
    });

    return unified;
  }

  /**
   * Unificar datos de tracking directo (sin Dropi)
   */
  unifyFromTracking(trackingData: TrackingData): UnifiedShipment {
    const match: MatchResult = {
      trackingData,
      dropiData: null,
      matchConfidence: 100,
      matchMethod: 'none',
      matchDetails: 'Solo datos de tracking',
    };

    return this.createUnifiedShipment(match);
  }

  /**
   * Unificar datos de Dropi directo (sin tracking todavía)
   */
  unifyFromDropi(dropiData: DropiData): UnifiedShipment {
    const unified: UnifiedShipment = {
      id: this.generateId(),
      trackingNumber: dropiData.trackingNumber || `PENDING_${dropiData.orderNumber}`,
      orderNumber: dropiData.orderNumber,
      invoiceNumber: dropiData.invoiceNumber,

      currentStatus: this.createSourcedData(
        dropiData.status ? this.normalizeStatus(dropiData.status) : 'pending',
        'DROPI'
      ),
      lastUpdate: dropiData.createdAt,

      origin: this.createSourcedData('Colombia', 'DROPI'),
      destination: this.createSourcedData(
        `${dropiData.customer.city}, ${dropiData.customer.department || ''}`,
        'DROPI'
      ),

      customer: {
        name: this.createSourcedData(dropiData.customer.name, 'DROPI'),
        phone: dropiData.customer.phone
          ? this.createSourcedData(dropiData.customer.phone, 'DROPI')
          : undefined,
        email: dropiData.customer.email
          ? this.createSourcedData(dropiData.customer.email, 'DROPI')
          : undefined,
        address: this.createSourcedData(dropiData.customer.address, 'DROPI'),
      },

      product: {
        name: this.createSourcedData(dropiData.product.name, 'DROPI'),
        quantity: this.createSourcedData(dropiData.product.quantity, 'DROPI'),
        value: this.createSourcedData(dropiData.product.value, 'DROPI'),
      },

      carrier: dropiData.carrier
        ? this.createSourcedData(dropiData.carrier, 'DROPI')
        : this.createSourcedData('Pendiente', 'SYSTEM'),
      daysInTransit: 0,

      hasIssue: false,
      isDelayed: false,

      events: [{
        id: `evt_${Date.now()}`,
        timestamp: dropiData.createdAt,
        status: 'pending',
        description: 'Pedido creado en Dropi',
        source: 'DROPI',
      }],

      sources: ['DROPI'],
      matchConfidence: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    centralBrain.registerShipment(unified);
    return unified;
  }

  /**
   * Unificar listas completas de tracking y dropi
   */
  unifyBulk(
    trackingList: TrackingData[],
    dropiList: DropiData[]
  ): {
    unified: UnifiedShipment[];
    stats: {
      total: number;
      matched: number;
      trackingOnly: number;
      dropiOnly: number;
    };
  } {
    const { matched, unmatchedTracking, unmatchedDropi } = shipmentMatcher.matchBulk(
      trackingList,
      dropiList
    );

    const unified: UnifiedShipment[] = [];

    // Procesar matches
    matched.forEach(match => {
      unified.push(this.createUnifiedShipment(match));
    });

    // Procesar tracking sin match
    unmatchedTracking.forEach(tracking => {
      unified.push(this.unifyFromTracking(tracking));
    });

    // Procesar dropi sin match
    unmatchedDropi.forEach(dropi => {
      unified.push(this.unifyFromDropi(dropi));
    });

    return {
      unified,
      stats: {
        total: unified.length,
        matched: matched.length,
        trackingOnly: unmatchedTracking.length,
        dropiOnly: unmatchedDropi.length,
      },
    };
  }

  /**
   * Actualizar un shipment existente con nuevos datos de tracking
   */
  updateFromTracking(
    shipmentId: string,
    trackingData: TrackingData
  ): UnifiedShipment | null {
    const existing = centralBrain.getShipment(shipmentId);
    if (!existing) return null;

    const updates: Partial<UnifiedShipment> = {
      currentStatus: this.createSourcedData(
        this.normalizeStatus(trackingData.status),
        'TRACKING',
        trackingData.lastUpdate
      ),
      lastUpdate: trackingData.lastUpdate,
      currentLocation: trackingData.location
        ? this.createSourcedData(trackingData.location, 'TRACKING')
        : existing.currentLocation,
      hasIssue: this.hasIssue(trackingData.status),
      updatedAt: new Date(),
    };

    // Agregar evento al timeline
    if (trackingData.events && trackingData.events.length > 0) {
      const newEvents = trackingData.events.map(evt => ({
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        timestamp: evt.date,
        status: this.normalizeStatus(trackingData.status),
        description: evt.description,
        location: evt.location,
        source: 'TRACKING' as DataSource,
      }));

      updates.events = [...(existing.events || []), ...newEvents];
    }

    // Verificar si se entregó
    if (trackingData.status === 'ENTREGADO' || trackingData.status === 'DELIVERED') {
      updates.actualDelivery = trackingData.lastUpdate;

      eventBus.emit('shipment.delivered', {
        shipmentId,
        trackingNumber: existing.trackingNumber,
        deliveredAt: trackingData.lastUpdate,
      });
    }

    centralBrain.updateShipment(shipmentId, updates);
    return centralBrain.getShipment(shipmentId) || null;
  }

  // ==================== HELPERS ====================

  private createSourcedData<T>(
    value: T,
    source: DataSource,
    timestamp?: Date
  ): SourcedData<T> {
    return {
      value,
      source,
      timestamp: timestamp || new Date(),
      confidence: getSourceConfidence(source),
    };
  }

  private normalizeStatus(status: string): ShipmentStatus {
    const normalized = status.toUpperCase().trim();
    return STATUS_MAP[normalized] || 'in_transit';
  }

  private resolveOrigin(
    tracking: TrackingData,
    dropi: DropiData | null
  ): SourcedData<string> {
    if (tracking.origin) {
      return this.createSourcedData(tracking.origin, 'TRACKING');
    }
    return this.createSourcedData('Colombia', 'SYSTEM');
  }

  private resolveDestination(
    tracking: TrackingData,
    dropi: DropiData | null
  ): SourcedData<string> {
    if (dropi) {
      const dest = `${dropi.customer.city}${dropi.customer.department ? ', ' + dropi.customer.department : ''}`;
      return this.createSourcedData(dest, 'DROPI');
    }
    if (tracking.destination) {
      return this.createSourcedData(tracking.destination, 'TRACKING');
    }
    return this.createSourcedData('Desconocido', 'SYSTEM');
  }

  private resolveCustomer(
    tracking: TrackingData,
    dropi: DropiData | null
  ): UnifiedShipment['customer'] {
    if (dropi) {
      return {
        name: this.createSourcedData(dropi.customer.name, 'DROPI'),
        phone: dropi.customer.phone
          ? this.createSourcedData(dropi.customer.phone, 'DROPI')
          : undefined,
        email: dropi.customer.email
          ? this.createSourcedData(dropi.customer.email, 'DROPI')
          : undefined,
        address: this.createSourcedData(dropi.customer.address, 'DROPI'),
      };
    }

    return {
      name: this.createSourcedData('Desconocido', 'SYSTEM'),
      address: this.createSourcedData(tracking.destination || 'Desconocido', 'TRACKING'),
    };
  }

  private buildEvents(
    tracking: TrackingData,
    dropi: DropiData | null
  ): ShipmentEvent[] {
    const events: ShipmentEvent[] = [];

    // Evento de creación si hay Dropi
    if (dropi) {
      events.push({
        id: `evt_dropi_${Date.now()}`,
        timestamp: dropi.createdAt,
        status: 'pending',
        description: 'Pedido creado',
        source: 'DROPI',
      });
    }

    // Eventos de tracking
    if (tracking.events) {
      tracking.events.forEach((evt, index) => {
        events.push({
          id: `evt_track_${index}_${Date.now()}`,
          timestamp: evt.date,
          status: this.normalizeStatus(tracking.status),
          description: evt.description,
          location: evt.location,
          source: 'TRACKING',
        });
      });
    }

    // Evento actual si no hay eventos previos
    if (events.length === 0 || !tracking.events?.length) {
      events.push({
        id: `evt_current_${Date.now()}`,
        timestamp: tracking.lastUpdate,
        status: this.normalizeStatus(tracking.status),
        description: tracking.status,
        location: tracking.location,
        source: 'TRACKING',
      });
    }

    // Ordenar por fecha
    return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private calculateDaysInTransit(
    tracking: TrackingData,
    dropi: DropiData | null
  ): number {
    const startDate = dropi?.createdAt || tracking.lastUpdate;
    const endDate = tracking.status === 'ENTREGADO' ? tracking.lastUpdate : new Date();
    const diffMs = endDate.getTime() - startDate.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  private hasIssue(status: string): boolean {
    const normalized = status.toUpperCase();
    return normalized.includes('NOVEDAD') ||
      normalized.includes('ISSUE') ||
      normalized.includes('PROBLEMA') ||
      normalized.includes('DEVUELTO') ||
      normalized.includes('RETURNED');
  }

  private isDelayed(tracking: TrackingData, dropi: DropiData | null): boolean {
    const daysInTransit = this.calculateDaysInTransit(tracking, dropi);
    return daysInTransit > 5 && tracking.status !== 'ENTREGADO';
  }

  private generateId(): string {
    return `unified_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton
export const dataUnifier = new DataUnifierService();
export default dataUnifier;
