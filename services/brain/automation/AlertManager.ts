// services/brain/automation/AlertManager.ts
// Gestiona alertas del sistema

import { BrainEventType, DataSource } from '../types/brain.types';
import { eventBus } from '../core/EventBus';
import { memoryManager } from '../core/MemoryManager';

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string;
  category: string;
  shipmentId?: string;
  trackingNumber?: string;
  data?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  acknowledgedBy?: string;
  resolvedBy?: string;
  autoResolvable: boolean;
  expiresAt?: Date;
}

export interface AlertFilter {
  severity?: AlertSeverity[];
  status?: AlertStatus[];
  category?: string;
  shipmentId?: string;
  fromDate?: Date;
  toDate?: Date;
}

class AlertManagerService {
  private alerts: Map<string, Alert> = new Map();
  private alertHistory: Alert[] = [];

  constructor() {
    this.setupEventListeners();
    this.startExpirationCheck();
  }

  /**
   * Configurar listeners de eventos
   */
  private setupEventListeners(): void {
    // Crear alertas desde eventos del cerebro
    eventBus.on('shipment.delayed', (event) => {
      this.createAlert({
        severity: 'warning',
        title: 'Envío Retrasado',
        message: `El envío ${event.payload.trackingNumber} lleva ${event.payload.daysInTransit} días en tránsito`,
        category: 'delay',
        shipmentId: event.payload.shipmentId as string,
        trackingNumber: event.payload.trackingNumber as string,
        data: event.payload,
        autoResolvable: true,
      });
    });

    eventBus.on('shipment.issue', (event) => {
      this.createAlert({
        severity: 'error',
        title: 'Novedad en Envío',
        message: `El envío ${event.payload.trackingNumber} tiene una novedad`,
        category: 'issue',
        shipmentId: event.payload.shipmentId as string,
        trackingNumber: event.payload.trackingNumber as string,
        data: event.payload,
        autoResolvable: false,
      });
    });

    // Auto-resolver alertas cuando se entrega
    eventBus.on('shipment.delivered', (event) => {
      const shipmentId = event.payload.shipmentId as string;
      this.resolveAlertsForShipment(shipmentId, 'Envío entregado exitosamente');
    });
  }

  /**
   * Iniciar verificación periódica de alertas expiradas
   */
  private startExpirationCheck(): void {
    setInterval(() => {
      const now = new Date();
      for (const [id, alert] of this.alerts) {
        if (alert.expiresAt && alert.expiresAt < now && alert.status === 'active') {
          this.dismissAlert(id);
        }
      }
    }, 60000); // Cada minuto
  }

  /**
   * Crear nueva alerta
   */
  createAlert(params: {
    severity: AlertSeverity;
    title: string;
    message: string;
    category: string;
    shipmentId?: string;
    trackingNumber?: string;
    data?: Record<string, unknown>;
    autoResolvable?: boolean;
    expiresInHours?: number;
  }): Alert {
    // Verificar si ya existe alerta similar activa
    const existingAlert = this.findSimilarAlert(params);
    if (existingAlert) {
      // Actualizar alerta existente
      existingAlert.updatedAt = new Date();
      existingAlert.message = params.message;
      return existingAlert;
    }

    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      severity: params.severity,
      status: 'active',
      title: params.title,
      message: params.message,
      category: params.category,
      shipmentId: params.shipmentId,
      trackingNumber: params.trackingNumber,
      data: params.data,
      createdAt: new Date(),
      updatedAt: new Date(),
      autoResolvable: params.autoResolvable ?? false,
      expiresAt: params.expiresInHours
        ? new Date(Date.now() + params.expiresInHours * 60 * 60 * 1000)
        : undefined,
    };

    this.alerts.set(alert.id, alert);

    // Guardar en memoria
    memoryManager.remember(`alert_${alert.id}`, alert, {
      type: 'SHORT_TERM',
      importance: this.getSeverityImportance(params.severity),
    });

    // Emitir evento
    eventBus.emit('alert.created', {
      alertId: alert.id,
      severity: alert.severity,
      category: alert.category,
      shipmentId: alert.shipmentId,
    });

    return alert;
  }

  /**
   * Buscar alerta similar existente
   */
  private findSimilarAlert(params: {
    category: string;
    shipmentId?: string;
    trackingNumber?: string;
  }): Alert | null {
    for (const alert of this.alerts.values()) {
      if (
        alert.status === 'active' &&
        alert.category === params.category &&
        ((params.shipmentId && alert.shipmentId === params.shipmentId) ||
          (params.trackingNumber && alert.trackingNumber === params.trackingNumber))
      ) {
        return alert;
      }
    }
    return null;
  }

  /**
   * Obtener importancia basada en severidad
   */
  private getSeverityImportance(severity: AlertSeverity): number {
    const map: Record<AlertSeverity, number> = {
      info: 40,
      warning: 60,
      error: 80,
      critical: 95,
    };
    return map[severity];
  }

  /**
   * Reconocer alerta
   */
  acknowledgeAlert(alertId: string, acknowledgedBy?: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.status !== 'active') return false;

    alert.status = 'acknowledged';
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = acknowledgedBy;
    alert.updatedAt = new Date();

    return true;
  }

  /**
   * Resolver alerta
   */
  resolveAlert(alertId: string, resolvedBy?: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    alert.resolvedBy = resolvedBy;
    alert.updatedAt = new Date();

    // Mover a historial
    this.alertHistory.push({ ...alert });
    this.alerts.delete(alertId);

    eventBus.emit('alert.resolved', {
      alertId: alert.id,
      category: alert.category,
      shipmentId: alert.shipmentId,
    });

    return true;
  }

  /**
   * Descartar alerta
   */
  dismissAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.status = 'dismissed';
    alert.updatedAt = new Date();

    // Mover a historial
    this.alertHistory.push({ ...alert });
    this.alerts.delete(alertId);

    return true;
  }

  /**
   * Resolver todas las alertas de un envío
   */
  resolveAlertsForShipment(shipmentId: string, reason?: string): number {
    let resolved = 0;

    for (const [id, alert] of this.alerts) {
      if (alert.shipmentId === shipmentId && alert.autoResolvable) {
        if (this.resolveAlert(id, reason || 'Auto-resolved')) {
          resolved++;
        }
      }
    }

    return resolved;
  }

  /**
   * Obtener alertas con filtros
   */
  getAlerts(filter?: AlertFilter): Alert[] {
    let alerts = Array.from(this.alerts.values());

    if (filter) {
      if (filter.severity?.length) {
        alerts = alerts.filter(a => filter.severity!.includes(a.severity));
      }
      if (filter.status?.length) {
        alerts = alerts.filter(a => filter.status!.includes(a.status));
      }
      if (filter.category) {
        alerts = alerts.filter(a => a.category === filter.category);
      }
      if (filter.shipmentId) {
        alerts = alerts.filter(a => a.shipmentId === filter.shipmentId);
      }
      if (filter.fromDate) {
        alerts = alerts.filter(a => a.createdAt >= filter.fromDate!);
      }
      if (filter.toDate) {
        alerts = alerts.filter(a => a.createdAt <= filter.toDate!);
      }
    }

    // Ordenar por severidad y fecha
    const severityOrder: Record<AlertSeverity, number> = {
      critical: 0,
      error: 1,
      warning: 2,
      info: 3,
    };

    return alerts.sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  /**
   * Obtener alerta por ID
   */
  getAlert(alertId: string): Alert | undefined {
    return this.alerts.get(alertId);
  }

  /**
   * Obtener alertas activas
   */
  getActiveAlerts(): Alert[] {
    return this.getAlerts({ status: ['active'] });
  }

  /**
   * Obtener alertas críticas
   */
  getCriticalAlerts(): Alert[] {
    return this.getAlerts({ severity: ['critical', 'error'], status: ['active'] });
  }

  /**
   * Obtener historial de alertas
   */
  getAlertHistory(limit: number = 100): Alert[] {
    return this.alertHistory.slice(-limit);
  }

  /**
   * Obtener conteo por severidad
   */
  getCountBySeverity(): Record<AlertSeverity, number> {
    const counts: Record<AlertSeverity, number> = {
      info: 0,
      warning: 0,
      error: 0,
      critical: 0,
    };

    for (const alert of this.alerts.values()) {
      if (alert.status === 'active') {
        counts[alert.severity]++;
      }
    }

    return counts;
  }

  /**
   * Obtener estadísticas
   */
  getStats(): {
    totalActive: number;
    totalAcknowledged: number;
    bySeverity: Record<AlertSeverity, number>;
    byCategory: Record<string, number>;
    resolvedToday: number;
  } {
    const active = this.getAlerts({ status: ['active'] });
    const acknowledged = this.getAlerts({ status: ['acknowledged'] });

    const bySeverity = this.getCountBySeverity();

    const byCategory: Record<string, number> = {};
    active.forEach(a => {
      byCategory[a.category] = (byCategory[a.category] || 0) + 1;
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const resolvedToday = this.alertHistory.filter(
      a => a.resolvedAt && a.resolvedAt >= today
    ).length;

    return {
      totalActive: active.length,
      totalAcknowledged: acknowledged.length,
      bySeverity,
      byCategory,
      resolvedToday,
    };
  }
}

// Singleton
export const alertManager = new AlertManagerService();
export default alertManager;
