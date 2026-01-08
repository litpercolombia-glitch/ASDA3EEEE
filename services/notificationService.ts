// services/notificationService.ts
// Sistema de notificaciones inteligentes basado en datos de guías

import { Shipment, ShipmentStatus } from '../types';

// ============================================
// TIPOS
// ============================================

export type NotificationPriority = 'critical' | 'high' | 'medium' | 'info';
export type NotificationType =
  | 'no_movement'      // Sin movimiento 48h+
  | 'in_office_long'   // En oficina > 5 días
  | 'delayed'          // Atrasada 5+ días
  | 'failed_attempts'  // Intentos fallidos
  | 'issue'            // Novedad/problema
  | 'critical_city'    // Ciudad problemática
  | 'sla_warning'      // Próxima a vencer SLA
  | 'daily_summary'    // Resumen diario
  | 'delivery_goal'    // Meta de entregas
  | 'carrier_slow';    // Transportadora lenta

export interface SmartNotification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  detail?: string;
  count?: number;
  guides?: string[];
  timestamp: Date;
  read: boolean;
  actionLabel?: string;
  actionType?: 'view_guides' | 'view_city' | 'view_carrier' | 'dismiss';
}

export interface NotificationStats {
  critical: number;
  high: number;
  medium: number;
  info: number;
  total: number;
}

// ============================================
// CONFIGURACIÓN
// ============================================

const CONFIG = {
  NO_MOVEMENT_HOURS: 48,
  IN_OFFICE_MAX_DAYS: 5,
  DELAYED_DAYS: 5,
  FAILED_ATTEMPTS_THRESHOLD: 2,
  CITY_DELAY_RATE_THRESHOLD: 30, // %
  SLA_WARNING_DAYS: 1, // Días antes de vencer
  DELIVERY_GOAL_PERCENTAGE: 85, // Meta de entrega
};

// ============================================
// FUNCIONES DE ANÁLISIS
// ============================================

function calculateHoursSinceLastUpdate(shipment: Shipment): number {
  const lastUpdate = shipment.detailedInfo?.lastStatusDate || shipment.lastUpdate;
  if (!lastUpdate) return 999;

  const lastUpdateDate = new Date(lastUpdate);
  const now = new Date();
  const diffMs = now.getTime() - lastUpdateDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60));
}

function getDaysInTransit(shipment: Shipment): number {
  return shipment.detailedInfo?.daysInTransit || 0;
}

// ============================================
// GENERADORES DE NOTIFICACIONES
// ============================================

function generateNoMovementNotifications(shipments: Shipment[]): SmartNotification[] {
  const stuckShipments = shipments.filter(s => {
    if (s.status === 'delivered') return false;
    const hours = calculateHoursSinceLastUpdate(s);
    return hours >= CONFIG.NO_MOVEMENT_HOURS;
  });

  if (stuckShipments.length === 0) return [];

  return [{
    id: `no_movement_${Date.now()}`,
    type: 'no_movement',
    priority: 'critical',
    title: '⚠️ Guías sin movimiento',
    message: `${stuckShipments.length} guías sin actualización en 48+ horas`,
    detail: 'Requieren seguimiento urgente con la transportadora',
    count: stuckShipments.length,
    guides: stuckShipments.slice(0, 10).map(s => s.trackingNumber),
    timestamp: new Date(),
    read: false,
    actionLabel: 'Ver guías',
    actionType: 'view_guides',
  }];
}

function generateInOfficeLongNotifications(shipments: Shipment[]): SmartNotification[] {
  const inOfficeLong = shipments.filter(s => {
    if (s.status !== 'in_office') return false;
    const days = getDaysInTransit(s);
    return days >= CONFIG.IN_OFFICE_MAX_DAYS;
  });

  if (inOfficeLong.length === 0) return [];

  return [{
    id: `in_office_long_${Date.now()}`,
    type: 'in_office_long',
    priority: 'critical',
    title: '🏢 En oficina > 5 días',
    message: `${inOfficeLong.length} guías esperando recogida demasiado tiempo`,
    detail: 'El cliente no ha recogido su paquete. Contactar para evitar devolución.',
    count: inOfficeLong.length,
    guides: inOfficeLong.slice(0, 10).map(s => s.trackingNumber),
    timestamp: new Date(),
    read: false,
    actionLabel: 'Gestionar',
    actionType: 'view_guides',
  }];
}

function generateDelayedNotifications(shipments: Shipment[]): SmartNotification[] {
  const delayed = shipments.filter(s => {
    if (s.status === 'delivered') return false;
    const days = getDaysInTransit(s);
    return days >= CONFIG.DELAYED_DAYS;
  });

  if (delayed.length === 0) return [];

  return [{
    id: `delayed_${Date.now()}`,
    type: 'delayed',
    priority: 'high',
    title: '🕐 Guías atrasadas',
    message: `${delayed.length} guías sin entregar en 5+ días`,
    detail: 'Revisar estado con transportadora y notificar al cliente',
    count: delayed.length,
    guides: delayed.slice(0, 10).map(s => s.trackingNumber),
    timestamp: new Date(),
    read: false,
    actionLabel: 'Ver detalles',
    actionType: 'view_guides',
  }];
}

function generateIssueNotifications(shipments: Shipment[]): SmartNotification[] {
  const withIssues = shipments.filter(s => s.status === 'issue');

  if (withIssues.length === 0) return [];

  return [{
    id: `issues_${Date.now()}`,
    type: 'issue',
    priority: 'medium',
    title: '📋 Novedades pendientes',
    message: `${withIssues.length} guías con problemas reportados`,
    detail: 'Dirección incorrecta, destinatario ausente, etc.',
    count: withIssues.length,
    guides: withIssues.slice(0, 10).map(s => s.trackingNumber),
    timestamp: new Date(),
    read: false,
    actionLabel: 'Resolver',
    actionType: 'view_guides',
  }];
}

function generateCriticalCityNotifications(shipments: Shipment[]): SmartNotification[] {
  // Agrupar por ciudad y calcular tasa de problemas
  const cityStats: Record<string, { total: number; issues: number; delayed: number }> = {};

  shipments.forEach(s => {
    const city = s.detailedInfo?.destination?.city || 'Desconocida';
    if (!cityStats[city]) {
      cityStats[city] = { total: 0, issues: 0, delayed: 0 };
    }
    cityStats[city].total++;
    if (s.status === 'issue') cityStats[city].issues++;
    if (getDaysInTransit(s) >= CONFIG.DELAYED_DAYS && s.status !== 'delivered') {
      cityStats[city].delayed++;
    }
  });

  const criticalCities = Object.entries(cityStats)
    .filter(([_, stats]) => {
      const problemRate = ((stats.issues + stats.delayed) / stats.total) * 100;
      return problemRate >= CONFIG.CITY_DELAY_RATE_THRESHOLD && stats.total >= 3;
    })
    .sort((a, b) => (b[1].issues + b[1].delayed) - (a[1].issues + a[1].delayed))
    .slice(0, 3);

  if (criticalCities.length === 0) return [];

  const cityNames = criticalCities.map(([city, stats]) =>
    `${city} (${stats.issues + stats.delayed}/${stats.total})`
  ).join(', ');

  return [{
    id: `critical_city_${Date.now()}`,
    type: 'critical_city',
    priority: 'medium',
    title: '📍 Ciudades problemáticas',
    message: `${criticalCities.length} zonas con alto % de retrasos`,
    detail: cityNames,
    count: criticalCities.length,
    timestamp: new Date(),
    read: false,
    actionLabel: 'Ver análisis',
    actionType: 'view_city',
  }];
}

function generateDeliveryGoalNotification(shipments: Shipment[]): SmartNotification[] {
  if (shipments.length === 0) return [];

  const delivered = shipments.filter(s => s.status === 'delivered').length;
  const rate = Math.round((delivered / shipments.length) * 100);
  const isOnTrack = rate >= CONFIG.DELIVERY_GOAL_PERCENTAGE;

  return [{
    id: `delivery_goal_${Date.now()}`,
    type: 'delivery_goal',
    priority: 'info',
    title: isOnTrack ? '✅ Meta de entregas' : '📊 Progreso de entregas',
    message: `${rate}% de guías entregadas (${delivered}/${shipments.length})`,
    detail: isOnTrack
      ? '¡Excelente! Superando la meta del 85%'
      : `Faltan ${CONFIG.DELIVERY_GOAL_PERCENTAGE - rate}% para alcanzar la meta`,
    timestamp: new Date(),
    read: false,
  }];
}

function generateDailySummary(shipments: Shipment[]): SmartNotification[] {
  if (shipments.length === 0) return [];

  const delivered = shipments.filter(s => s.status === 'delivered').length;
  const inTransit = shipments.filter(s => s.status === 'in_transit').length;
  const inOffice = shipments.filter(s => s.status === 'in_office').length;
  const issues = shipments.filter(s => s.status === 'issue').length;

  return [{
    id: `daily_summary_${Date.now()}`,
    type: 'daily_summary',
    priority: 'info',
    title: '📈 Resumen del día',
    message: `${shipments.length} guías: ${delivered} entregadas, ${inTransit} en tránsito`,
    detail: `En oficina: ${inOffice} | Con novedad: ${issues}`,
    timestamp: new Date(),
    read: false,
  }];
}

function generateCarrierSlowNotifications(shipments: Shipment[]): SmartNotification[] {
  // Agrupar por carrier y calcular rendimiento
  const carrierStats: Record<string, { total: number; delivered: number; avgDays: number }> = {};

  shipments.forEach(s => {
    const carrier = s.carrier || 'Desconocido';
    if (!carrierStats[carrier]) {
      carrierStats[carrier] = { total: 0, delivered: 0, avgDays: 0 };
    }
    carrierStats[carrier].total++;
    if (s.status === 'delivered') carrierStats[carrier].delivered++;
    carrierStats[carrier].avgDays += getDaysInTransit(s);
  });

  // Calcular promedio y encontrar carriers lentos
  const slowCarriers = Object.entries(carrierStats)
    .map(([carrier, stats]) => ({
      carrier,
      deliveryRate: (stats.delivered / stats.total) * 100,
      avgDays: stats.avgDays / stats.total,
      total: stats.total,
    }))
    .filter(c => c.deliveryRate < 60 && c.total >= 5)
    .sort((a, b) => a.deliveryRate - b.deliveryRate)
    .slice(0, 2);

  if (slowCarriers.length === 0) return [];

  const carrierInfo = slowCarriers.map(c =>
    `${c.carrier}: ${Math.round(c.deliveryRate)}% entregado`
  ).join(', ');

  return [{
    id: `carrier_slow_${Date.now()}`,
    type: 'carrier_slow',
    priority: 'medium',
    title: '🚚 Transportadora con bajo rendimiento',
    message: `${slowCarriers.length} carriers con menos del 60% de entregas`,
    detail: carrierInfo,
    count: slowCarriers.length,
    timestamp: new Date(),
    read: false,
    actionLabel: 'Ver análisis',
    actionType: 'view_carrier',
  }];
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

export function generateSmartNotifications(shipments: Shipment[]): SmartNotification[] {
  const notifications: SmartNotification[] = [];

  // Generar todas las notificaciones
  notifications.push(...generateNoMovementNotifications(shipments));
  notifications.push(...generateInOfficeLongNotifications(shipments));
  notifications.push(...generateDelayedNotifications(shipments));
  notifications.push(...generateIssueNotifications(shipments));
  notifications.push(...generateCriticalCityNotifications(shipments));
  notifications.push(...generateCarrierSlowNotifications(shipments));
  notifications.push(...generateDeliveryGoalNotification(shipments));
  notifications.push(...generateDailySummary(shipments));

  // Ordenar por prioridad
  const priorityOrder: Record<NotificationPriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    info: 3,
  };

  return notifications.sort((a, b) =>
    priorityOrder[a.priority] - priorityOrder[b.priority]
  );
}

export function getNotificationStats(notifications: SmartNotification[]): NotificationStats {
  return {
    critical: notifications.filter(n => n.priority === 'critical').length,
    high: notifications.filter(n => n.priority === 'high').length,
    medium: notifications.filter(n => n.priority === 'medium').length,
    info: notifications.filter(n => n.priority === 'info').length,
    total: notifications.length,
  };
}

export function getUnreadCount(notifications: SmartNotification[]): number {
  return notifications.filter(n => !n.read).length;
}

// Iconos por tipo de notificación
export const notificationIcons: Record<NotificationType, string> = {
  no_movement: '⚠️',
  in_office_long: '🏢',
  delayed: '🕐',
  failed_attempts: '❌',
  issue: '📋',
  critical_city: '📍',
  sla_warning: '⏰',
  daily_summary: '📈',
  delivery_goal: '🎯',
  carrier_slow: '🚚',
};

// Colores por prioridad
export const priorityColors: Record<NotificationPriority, { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  high: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  medium: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  info: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
};
