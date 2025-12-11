// services/sessionComparisonService.ts
// Sistema de Sesiones Mejorado con Comparación entre Días
// Detecta cambios, guías estancadas, nuevas y resueltas

import { Shipment, ShipmentStatus } from '../types';

// ============================================
// INTERFACES
// ============================================

export interface LogisticsSession {
  id: string;
  name: string;
  date: Date;
  timestamp: string;
  guides: SessionGuide[];
  stats: SessionStats;
}

export interface SessionGuide {
  id: string;
  phone?: string;
  carrier: string;
  status: string;
  rawStatus: string;
  destination: string;
  daysInTransit: number;
  hasNovelty: boolean;
  lastUpdate: Date;
  events: SessionEvent[];
}

export interface SessionEvent {
  date: Date;
  location: string;
  description: string;
}

export interface SessionStats {
  total: number;
  delivered: number;
  inTransit: number;
  withNovelty: number;
  inOffice: number;
  returned: number;
  deliveryRate: number;
  returnRate: number;
  avgDays: number;
}

export interface SessionComparison {
  previousSession: LogisticsSession;
  currentSession: LogisticsSession;
  summary: ComparisonSummary;
  details: ComparisonDetails;
}

export interface ComparisonSummary {
  newGuides: number;
  resolvedGuides: number;
  stuckGuides: number;
  statusChanges: number;
  improvedRate: number;
  worsenedRate: number;
}

export interface ComparisonDetails {
  newGuides: SessionGuide[];
  resolvedGuides: ResolvedGuide[];
  stuckGuides: StuckGuide[];
  statusChanges: StatusChange[];
  disappearedGuides: SessionGuide[];
}

export interface ResolvedGuide {
  guide: SessionGuide;
  previousStatus: string;
  resolution: 'DELIVERED' | 'RETURNED' | 'OTHER';
  daysToResolve: number;
}

export interface StuckGuide {
  guide: SessionGuide;
  daysStuck: number;
  previousStatus: string;
  currentStatus: string;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export interface StatusChange {
  guide: SessionGuide;
  previousStatus: string;
  currentStatus: string;
  isPositive: boolean;
  daysSinceChange: number;
}

// ============================================
// CONSTANTES
// ============================================

const STORAGE_KEY = 'litper_logistics_sessions_v2';
const MAX_SESSIONS = 30; // Mantener últimas 30 sesiones

// Estados considerados como "resueltos"
const RESOLVED_STATUSES = ['entregado', 'delivered', 'devuelto', 'returned'];

// Estados positivos (progreso)
const POSITIVE_STATUSES = ['reparto', 'entrega', 'distribución', 'camino', 'tránsito'];

// Estados negativos (problemas)
const NEGATIVE_STATUSES = ['novedad', 'rechaz', 'devuelto', 'oficina', 'reclamo', 'problema'];

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

const generateId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const normalizeStatus = (status: string): string => {
  return status.toLowerCase().trim();
};

const isResolved = (status: string): boolean => {
  const normalized = normalizeStatus(status);
  return RESOLVED_STATUSES.some(s => normalized.includes(s));
};

const isPositiveChange = (fromStatus: string, toStatus: string): boolean => {
  const from = normalizeStatus(fromStatus);
  const to = normalizeStatus(toStatus);

  // De cualquier estado a entregado es positivo
  if (to.includes('entregado') || to.includes('delivered')) return true;

  // De novedad/problema a reparto es positivo
  if (NEGATIVE_STATUSES.some(s => from.includes(s)) &&
      POSITIVE_STATUSES.some(s => to.includes(s))) return true;

  // De oficina a reparto es positivo
  if (from.includes('oficina') && to.includes('reparto')) return true;

  return false;
};

const calculateRiskLevel = (daysStuck: number, status: string): StuckGuide['riskLevel'] => {
  const normalized = normalizeStatus(status);

  // Si está en oficina, es más crítico
  if (normalized.includes('oficina') || normalized.includes('reclamo')) {
    if (daysStuck >= 3) return 'CRITICAL';
    if (daysStuck >= 2) return 'HIGH';
    return 'MEDIUM';
  }

  // Para otros estados
  if (daysStuck >= 5) return 'CRITICAL';
  if (daysStuck >= 3) return 'HIGH';
  return 'MEDIUM';
};

// ============================================
// FUNCIONES DE CONVERSIÓN
// ============================================

export const shipmentToSessionGuide = (shipment: Shipment): SessionGuide => {
  return {
    id: shipment.id,
    phone: shipment.phone,
    carrier: shipment.carrier,
    status: shipment.status,
    rawStatus: shipment.detailedInfo?.rawStatus || shipment.status,
    destination: shipment.detailedInfo?.destination || 'Desconocido',
    daysInTransit: shipment.detailedInfo?.daysInTransit || 0,
    hasNovelty: shipment.status === ShipmentStatus.ISSUE,
    lastUpdate: new Date(),
    events: shipment.detailedInfo?.events?.map(e => ({
      date: new Date(e.date || Date.now()),
      location: e.location || '',
      description: e.description || '',
    })) || [],
  };
};

export const createSessionFromShipments = (
  shipments: Shipment[],
  name?: string
): LogisticsSession => {
  const guides = shipments.map(shipmentToSessionGuide);
  const now = new Date();

  // Calcular estadísticas
  const total = guides.length;
  const delivered = guides.filter(g => isResolved(g.status) && g.status.toLowerCase().includes('entreg')).length;
  const returned = guides.filter(g => isResolved(g.status) && g.status.toLowerCase().includes('devuel')).length;
  const inTransit = guides.filter(g => g.status.toLowerCase().includes('reparto') || g.status.toLowerCase().includes('tránsito')).length;
  const withNovelty = guides.filter(g => g.hasNovelty).length;
  const inOffice = guides.filter(g => g.status.toLowerCase().includes('oficina') || g.status.toLowerCase().includes('reclamo')).length;

  const deliveryRate = total > 0 ? (delivered / total) * 100 : 0;
  const returnRate = total > 0 ? (returned / total) * 100 : 0;
  const avgDays = guides.length > 0
    ? guides.reduce((sum, g) => sum + g.daysInTransit, 0) / guides.length
    : 0;

  return {
    id: generateId(),
    name: name || `Sesión ${now.toLocaleDateString('es-CO')} ${now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`,
    date: now,
    timestamp: now.toISOString(),
    guides,
    stats: {
      total,
      delivered,
      inTransit,
      withNovelty,
      inOffice,
      returned,
      deliveryRate,
      returnRate,
      avgDays,
    },
  };
};

// ============================================
// FUNCIONES DE COMPARACIÓN
// ============================================

export const compareSessiones = (
  previousSession: LogisticsSession,
  currentSession: LogisticsSession
): SessionComparison => {
  const prevGuideMap = new Map(previousSession.guides.map(g => [g.id, g]));
  const currGuideMap = new Map(currentSession.guides.map(g => [g.id, g]));

  const newGuides: SessionGuide[] = [];
  const resolvedGuides: ResolvedGuide[] = [];
  const stuckGuides: StuckGuide[] = [];
  const statusChanges: StatusChange[] = [];
  const disappearedGuides: SessionGuide[] = [];

  // Encontrar guías nuevas y cambios de estado
  for (const [id, currGuide] of currGuideMap) {
    const prevGuide = prevGuideMap.get(id);

    if (!prevGuide) {
      // Guía nueva
      newGuides.push(currGuide);
    } else {
      const prevStatus = normalizeStatus(prevGuide.rawStatus);
      const currStatus = normalizeStatus(currGuide.rawStatus);

      // Verificar si el estado cambió
      if (prevStatus !== currStatus) {
        const isPositive = isPositiveChange(prevGuide.rawStatus, currGuide.rawStatus);

        // Si se resolvió
        if (isResolved(currGuide.rawStatus) && !isResolved(prevGuide.rawStatus)) {
          const resolution = currStatus.includes('entreg') ? 'DELIVERED'
            : currStatus.includes('devuel') ? 'RETURNED'
            : 'OTHER';

          resolvedGuides.push({
            guide: currGuide,
            previousStatus: prevGuide.rawStatus,
            resolution,
            daysToResolve: currGuide.daysInTransit,
          });
        }

        statusChanges.push({
          guide: currGuide,
          previousStatus: prevGuide.rawStatus,
          currentStatus: currGuide.rawStatus,
          isPositive,
          daysSinceChange: Math.max(0, currGuide.daysInTransit - prevGuide.daysInTransit),
        });
      } else {
        // Mismo estado - verificar si está estancada
        if (!isResolved(currGuide.rawStatus)) {
          const daysStuck = currGuide.daysInTransit;
          if (daysStuck >= 2) {
            stuckGuides.push({
              guide: currGuide,
              daysStuck,
              previousStatus: prevGuide.rawStatus,
              currentStatus: currGuide.rawStatus,
              riskLevel: calculateRiskLevel(daysStuck, currGuide.rawStatus),
            });
          }
        }
      }
    }
  }

  // Encontrar guías que desaparecieron
  for (const [id, prevGuide] of prevGuideMap) {
    if (!currGuideMap.has(id)) {
      disappearedGuides.push(prevGuide);
    }
  }

  // Calcular resumen
  const summary: ComparisonSummary = {
    newGuides: newGuides.length,
    resolvedGuides: resolvedGuides.length,
    stuckGuides: stuckGuides.length,
    statusChanges: statusChanges.length,
    improvedRate: currentSession.stats.deliveryRate - previousSession.stats.deliveryRate,
    worsenedRate: currentSession.stats.returnRate - previousSession.stats.returnRate,
  };

  return {
    previousSession,
    currentSession,
    summary,
    details: {
      newGuides,
      resolvedGuides,
      stuckGuides,
      statusChanges,
      disappearedGuides,
    },
  };
};

// ============================================
// FUNCIONES DE ALMACENAMIENTO
// ============================================

export const saveSession = (session: LogisticsSession): void => {
  const sessions = loadAllSessions();

  // Añadir nueva sesión al principio
  sessions.unshift(session);

  // Mantener solo las últimas MAX_SESSIONS
  const trimmedSessions = sessions.slice(0, MAX_SESSIONS);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedSessions));
};

export const loadAllSessions = (): LogisticsSession[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    const sessions = JSON.parse(data);
    return sessions.map((s: any) => ({
      ...s,
      date: new Date(s.date),
      guides: s.guides.map((g: any) => ({
        ...g,
        lastUpdate: new Date(g.lastUpdate),
        events: g.events?.map((e: any) => ({
          ...e,
          date: new Date(e.date),
        })) || [],
      })),
    }));
  } catch (error) {
    console.error('Error loading sessions:', error);
    return [];
  }
};

export const loadSession = (sessionId: string): LogisticsSession | null => {
  const sessions = loadAllSessions();
  return sessions.find(s => s.id === sessionId) || null;
};

export const deleteSession = (sessionId: string): void => {
  const sessions = loadAllSessions();
  const filtered = sessions.filter(s => s.id !== sessionId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const getSessionsByDate = (): Record<string, LogisticsSession[]> => {
  const sessions = loadAllSessions();
  const grouped: Record<string, LogisticsSession[]> = {};

  sessions.forEach(session => {
    const dateKey = new Date(session.date).toLocaleDateString('es-CO');
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(session);
  });

  return grouped;
};

export const getLatestSession = (): LogisticsSession | null => {
  const sessions = loadAllSessions();
  return sessions[0] || null;
};

export const compareTodayWithYesterday = (): SessionComparison | null => {
  const sessions = loadAllSessions();
  if (sessions.length < 2) return null;

  const today = new Date().toLocaleDateString('es-CO');
  const todaySession = sessions.find(s => new Date(s.date).toLocaleDateString('es-CO') === today);

  if (!todaySession) return null;

  // Buscar la sesión más reciente de ayer o anterior
  const previousSession = sessions.find(s => {
    const sessionDate = new Date(s.date).toLocaleDateString('es-CO');
    return sessionDate !== today;
  });

  if (!previousSession) return null;

  return compareSessiones(previousSession, todaySession);
};

// ============================================
// FUNCIONES DE ANÁLISIS
// ============================================

export const getSessionInsights = (session: LogisticsSession): string[] => {
  const insights: string[] = [];
  const { stats, guides } = session;

  // Insight sobre tasa de entrega
  if (stats.deliveryRate >= 85) {
    insights.push(`Excelente tasa de entrega: ${stats.deliveryRate.toFixed(1)}%`);
  } else if (stats.deliveryRate < 70) {
    insights.push(`Tasa de entrega baja: ${stats.deliveryRate.toFixed(1)}% - Requiere atención`);
  }

  // Insight sobre devoluciones
  if (stats.returnRate > 10) {
    insights.push(`Alta tasa de devolución: ${stats.returnRate.toFixed(1)}% - Analizar causas`);
  }

  // Insight sobre guías en oficina
  if (stats.inOffice > 5) {
    insights.push(`${stats.inOffice} guías en oficina pendientes de retiro`);
  }

  // Insight sobre novedades
  if (stats.withNovelty > stats.total * 0.15) {
    insights.push(`${stats.withNovelty} guías con novedad (${((stats.withNovelty / stats.total) * 100).toFixed(1)}%)`);
  }

  // Insight sobre guías estancadas
  const stuckCount = guides.filter(g => g.daysInTransit >= 5 && !isResolved(g.rawStatus)).length;
  if (stuckCount > 0) {
    insights.push(`${stuckCount} guías sin movimiento por 5+ días - Acción urgente`);
  }

  // Insight sobre tiempo promedio
  if (stats.avgDays > 5) {
    insights.push(`Tiempo promedio alto: ${stats.avgDays.toFixed(1)} días`);
  }

  return insights;
};

export const getComparisonInsights = (comparison: SessionComparison): string[] => {
  const insights: string[] = [];
  const { summary, details } = comparison;

  // Insight sobre mejora/deterioro
  if (summary.improvedRate > 2) {
    insights.push(`Mejora del ${summary.improvedRate.toFixed(1)}% en tasa de entrega`);
  } else if (summary.improvedRate < -2) {
    insights.push(`Deterioro del ${Math.abs(summary.improvedRate).toFixed(1)}% en tasa de entrega`);
  }

  // Insight sobre guías resueltas
  const deliveredCount = details.resolvedGuides.filter(r => r.resolution === 'DELIVERED').length;
  if (deliveredCount > 0) {
    insights.push(`${deliveredCount} guías entregadas desde la última sesión`);
  }

  // Insight sobre guías estancadas críticas
  const criticalStuck = details.stuckGuides.filter(s => s.riskLevel === 'CRITICAL').length;
  if (criticalStuck > 0) {
    insights.push(`ALERTA: ${criticalStuck} guías críticas sin movimiento`);
  }

  // Insight sobre nuevas guías
  if (summary.newGuides > 0) {
    insights.push(`${summary.newGuides} guías nuevas cargadas`);
  }

  // Insight sobre guías que desaparecieron
  if (details.disappearedGuides.length > 0) {
    insights.push(`${details.disappearedGuides.length} guías ya no aparecen en los datos`);
  }

  return insights;
};

// ============================================
// EXPORT DEFAULT
// ============================================

export default {
  createSessionFromShipments,
  compareSessiones,
  saveSession,
  loadAllSessions,
  loadSession,
  deleteSession,
  getSessionsByDate,
  getLatestSession,
  compareTodayWithYesterday,
  getSessionInsights,
  getComparisonInsights,
};
