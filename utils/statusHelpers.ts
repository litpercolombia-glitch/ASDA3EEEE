import { Shipment, ShipmentStatus, ShipmentEvent } from '../types';
import { StatusNormalizer, detectCarrier } from '../services/StatusNormalizer';
import {
  CanonicalStatus,
  CanonicalStatusLabels,
  CanonicalStatusColors,
  ExceptionReason,
  ExceptionReasonLabels,
} from '../types/canonical.types';

// ============================================
// MIGRADO: Usa StatusNormalizer como fuente única de verdad
// ============================================

// Normalized status types - mapped from CanonicalStatus for backward compatibility
export type NormalizedStatus =
  | 'ENTREGADO'
  | 'EN_REPARTO'
  | 'EN_TRANSITO'
  | 'EN_OFICINA'
  | 'NOVEDAD'
  | 'PENDIENTE'
  | 'DESCONOCIDO';

// Mapping from CanonicalStatus to NormalizedStatus (backward compat)
const CANONICAL_TO_NORMALIZED: Record<CanonicalStatus, NormalizedStatus> = {
  [CanonicalStatus.CREATED]: 'PENDIENTE',
  [CanonicalStatus.PROCESSING]: 'PENDIENTE',
  [CanonicalStatus.SHIPPED]: 'EN_TRANSITO',
  [CanonicalStatus.IN_TRANSIT]: 'EN_TRANSITO',
  [CanonicalStatus.OUT_FOR_DELIVERY]: 'EN_REPARTO',
  [CanonicalStatus.IN_OFFICE]: 'EN_OFICINA',
  [CanonicalStatus.DELIVERED]: 'ENTREGADO',
  [CanonicalStatus.ISSUE]: 'NOVEDAD',
  [CanonicalStatus.RETURNED]: 'NOVEDAD',
  [CanonicalStatus.CANCELLED]: 'NOVEDAD',
};

/**
 * Parses a date string in multiple formats to a Date object
 * Supports: ISO, DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, "YYYY-MM-DD HH:mm"
 * CRITICAL: This function is used to determine event ordering
 */
export const parseDate = (dateStr: string | Date | undefined): Date => {
  if (!dateStr) return new Date(0);

  // If already a Date object
  if (dateStr instanceof Date) {
    return isNaN(dateStr.getTime()) ? new Date(0) : dateStr;
  }

  const str = String(dateStr).trim();

  // Try ISO format first (most common from APIs)
  const isoDate = new Date(str);
  if (!isNaN(isoDate.getTime())) return isoDate;

  // Try DD/MM/YYYY or DD-MM-YYYY format (common in Colombia)
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(.*)$/);
  if (dmyMatch) {
    const [, day, month, year, timePart] = dmyMatch;
    let hours = 0,
      minutes = 0;

    // Check if there's a time component
    const timeMatch = timePart.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      hours = parseInt(timeMatch[1], 10);
      minutes = parseInt(timeMatch[2], 10);
    }

    return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), hours, minutes);
  }

  // Try YYYY-MM-DD format
  const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})(.*)$/);
  if (ymdMatch) {
    const [, year, month, day, timePart] = ymdMatch;
    let hours = 0,
      minutes = 0;

    const timeMatch = timePart.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      hours = parseInt(timeMatch[1], 10);
      minutes = parseInt(timeMatch[2], 10);
    }

    return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), hours, minutes);
  }

  // Fallback to epoch (beginning of time)
  return new Date(0);
};

// Status configuration for UI
export const STATUS_CONFIG: Record<
  NormalizedStatus,
  {
    label: string;
    icon: string;
    color: string;
    bgColor: string;
    borderColor: string;
    semaforoColor: string;
    priority: number;
  }
> = {
  ENTREGADO: {
    label: 'Entregado',
    icon: '✅',
    color: 'green',
    bgColor: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    borderColor: 'border-green-500',
    semaforoColor: '🟢',
    priority: 5,
  },
  EN_REPARTO: {
    label: 'En Reparto',
    icon: '🚚',
    color: 'blue',
    bgColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    borderColor: 'border-blue-500',
    semaforoColor: '🟡',
    priority: 3,
  },
  EN_TRANSITO: {
    label: 'En Tránsito',
    icon: '📦',
    color: 'indigo',
    bgColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    borderColor: 'border-indigo-500',
    semaforoColor: '🟡',
    priority: 3,
  },
  EN_OFICINA: {
    label: 'En Oficina',
    icon: '📍',
    color: 'orange',
    bgColor: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    borderColor: 'border-orange-500',
    semaforoColor: '🟠',
    priority: 2,
  },
  NOVEDAD: {
    label: 'Novedad',
    icon: '⚠️',
    color: 'red',
    bgColor: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    borderColor: 'border-red-500',
    semaforoColor: '🔴',
    priority: 1,
  },
  PENDIENTE: {
    label: 'Pendiente',
    icon: '⏳',
    color: 'gray',
    bgColor: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    borderColor: 'border-gray-500',
    semaforoColor: '⚪',
    priority: 4,
  },
  DESCONOCIDO: {
    label: 'Desconocido',
    icon: '❓',
    color: 'slate',
    bgColor: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400',
    borderColor: 'border-slate-500',
    semaforoColor: '⚪',
    priority: 6,
  },
};

/**
 * Normalizes a raw status string to a NormalizedStatus
 * MIGRADO: Usa StatusNormalizer como fuente única de verdad
 *
 * @param rawStatus - The raw status string
 * @param carrier - Optional carrier for more accurate normalization
 */
export const normalizeStatus = (rawStatus: string, carrier?: string): NormalizedStatus => {
  const carrierCode = carrier ? detectCarrier(carrier) : 'UNKNOWN';
  const canonical = StatusNormalizer.normalize(rawStatus, carrierCode);

  return CANONICAL_TO_NORMALIZED[canonical.status] || 'DESCONOCIDO';
};

/**
 * Get full canonical status information
 * Use this when you need the complete normalized data including reason
 */
export const getCanonicalStatusInfo = (rawStatus: string, carrier?: string) => {
  const carrierCode = carrier ? detectCarrier(carrier) : 'UNKNOWN';
  return StatusNormalizer.normalize(rawStatus, carrierCode);
};

/**
 * Get the human-readable label for a status
 * Use this in UI instead of hardcoded strings
 */
export const getStatusLabel = (rawStatus: string, carrier?: string): string => {
  const carrierCode = carrier ? detectCarrier(carrier) : 'UNKNOWN';
  const canonical = StatusNormalizer.normalize(rawStatus, carrierCode);
  return CanonicalStatusLabels[canonical.status];
};

/**
 * Get the exception reason label if status is ISSUE
 */
export const getExceptionReasonLabel = (rawStatus: string, carrier?: string): string | null => {
  const carrierCode = carrier ? detectCarrier(carrier) : 'UNKNOWN';
  const canonical = StatusNormalizer.normalize(rawStatus, carrierCode);

  if (canonical.status === CanonicalStatus.ISSUE && canonical.reason !== ExceptionReason.NONE) {
    return ExceptionReasonLabels[canonical.reason];
  }

  return null;
};

/**
 * Gets the actual status of a shipment based on the most recent event
 * CRITICAL RULE: The status is ALWAYS the LAST event with the MOST RECENT date
 *
 * This function sorts events by date (descending) and returns the normalized
 * status from the most recent event's description.
 */
export const getActualStatus = (guia: Shipment): NormalizedStatus => {
  // 1. Get all events from the shipment
  const eventos = guia.detailedInfo?.events || [];

  if (eventos.length === 0) {
    // Fall back to the shipment's stored status
    return normalizeStatus(guia.status);
  }

  // 2. Sort by date DESCENDING (most recent FIRST)
  // Using parseDate to handle multiple date formats correctly
  const eventosOrdenados = [...eventos].sort((a, b) => {
    const fechaA = parseDate(a.date);
    const fechaB = parseDate(b.date);
    return fechaB.getTime() - fechaA.getTime();
  });

  // 3. The FIRST event after sorting (most recent) is the ACTUAL status
  const ultimoEvento = eventosOrdenados[0];

  // 4. Get status from event description first
  const rawStatus = ultimoEvento.estado || ultimoEvento.status || ultimoEvento.description || '';
  const statusFromEvent = normalizeStatus(rawStatus);

  // If we got a meaningful status from the event, use it
  if (statusFromEvent !== 'DESCONOCIDO') {
    return statusFromEvent;
  }

  // Try the event's description field specifically
  if (ultimoEvento.description) {
    const statusFromDescription = normalizeStatus(ultimoEvento.description);
    if (statusFromDescription !== 'DESCONOCIDO') {
      return statusFromDescription;
    }
  }

  // Otherwise, fall back to the rawStatus or stored status
  if (guia.detailedInfo?.rawStatus) {
    return normalizeStatus(guia.detailedInfo.rawStatus);
  }

  return normalizeStatus(guia.status);
};

/**
 * Converts NormalizedStatus to ShipmentStatus enum
 */
export const normalizedToShipmentStatus = (normalized: NormalizedStatus): ShipmentStatus => {
  switch (normalized) {
    case 'ENTREGADO':
      return ShipmentStatus.DELIVERED;
    case 'EN_REPARTO':
      return ShipmentStatus.IN_TRANSIT;
    case 'EN_TRANSITO':
      return ShipmentStatus.IN_TRANSIT;
    case 'EN_OFICINA':
      return ShipmentStatus.IN_OFFICE;
    case 'NOVEDAD':
      return ShipmentStatus.ISSUE;
    case 'PENDIENTE':
      return ShipmentStatus.PENDING;
    default:
      return ShipmentStatus.PENDING;
  }
};

/**
 * Gets the semaphore color category for a shipment
 */
export type SemaforoColor = 'green' | 'yellow' | 'orange' | 'red';

export const getSemaforoColor = (guia: Shipment): SemaforoColor => {
  const status = getActualStatus(guia);

  switch (status) {
    case 'ENTREGADO':
      return 'green';
    case 'EN_REPARTO':
    case 'EN_TRANSITO':
    case 'PENDIENTE':
      return 'yellow';
    case 'EN_OFICINA':
      return 'orange';
    case 'NOVEDAD':
      return 'red';
    default:
      return 'yellow';
  }
};

/**
 * Groups shipments by their semaphore color
 */
export const groupBySemaforo = (shipments: Shipment[]): Record<SemaforoColor, Shipment[]> => {
  return shipments.reduce(
    (acc, shipment) => {
      const color = getSemaforoColor(shipment);
      if (!acc[color]) acc[color] = [];
      acc[color].push(shipment);
      return acc;
    },
    { green: [], yellow: [], orange: [], red: [] } as Record<SemaforoColor, Shipment[]>
  );
};

/**
 * Calculates hours since the last event update
 * Uses parseDate for robust date handling
 */
export const getHoursSinceUpdate = (guia: Shipment): number => {
  const eventos = guia.detailedInfo?.events || [];
  if (eventos.length === 0) return 0;

  // Sort by date descending to get the most recent event
  const eventosOrdenados = [...eventos].sort((a, b) => {
    const fechaA = parseDate(a.date);
    const fechaB = parseDate(b.date);
    return fechaB.getTime() - fechaA.getTime();
  });

  const lastDate = parseDate(eventosOrdenados[0].date);
  const now = new Date();

  // If date is at epoch (invalid), return 0
  if (lastDate.getTime() === 0) return 0;

  return Math.abs(now.getTime() - lastDate.getTime()) / 36e5;
};

/**
 * Calculates days in current status
 */
export const getDaysInCurrentStatus = (guia: Shipment): number => {
  const hours = getHoursSinceUpdate(guia);
  return Math.floor(hours / 24);
};

// ============================================
// STATUS CHECKING UTILITIES
// Funciones para verificar estados de forma flexible
// Compatibles con múltiples formatos (enum, string, etc.)
// ============================================

/**
 * Verifica si un shipment está entregado
 * Compatible con múltiples formatos de status
 */
export const isDelivered = (shipment: Shipment): boolean => {
  const status = String(shipment.status || '').toLowerCase().trim();
  return (
    status === 'entregado' ||
    status === 'delivered' ||
    status === ShipmentStatus.DELIVERED.toLowerCase() ||
    shipment.status === ShipmentStatus.DELIVERED ||
    getActualStatus(shipment) === 'ENTREGADO'
  );
};

/**
 * Verifica si un shipment está en tránsito/reparto
 */
export const isInTransit = (shipment: Shipment): boolean => {
  const status = String(shipment.status || '').toLowerCase().trim();
  return (
    status === 'en reparto' ||
    status === 'en transito' ||
    status === 'en tránsito' ||
    status === 'in_transit' ||
    status === 'in transit' ||
    shipment.status === ShipmentStatus.IN_TRANSIT ||
    getActualStatus(shipment) === 'EN_TRANSITO' ||
    getActualStatus(shipment) === 'EN_REPARTO'
  );
};

/**
 * Verifica si un shipment tiene novedad/issue
 */
export const isIssue = (shipment: Shipment): boolean => {
  const status = String(shipment.status || '').toLowerCase().trim();
  return (
    status === 'novedad' ||
    status === 'issue' ||
    status === 'con novedad' ||
    shipment.status === ShipmentStatus.ISSUE ||
    getActualStatus(shipment) === 'NOVEDAD'
  );
};

/**
 * Verifica si un shipment está en oficina
 */
export const isInOffice = (shipment: Shipment): boolean => {
  const status = String(shipment.status || '').toLowerCase().trim();
  return (
    status === 'en oficina' ||
    status === 'in_office' ||
    status === 'in office' ||
    shipment.status === ShipmentStatus.IN_OFFICE ||
    getActualStatus(shipment) === 'EN_OFICINA'
  );
};

/**
 * Verifica si un shipment está pendiente
 */
export const isPending = (shipment: Shipment): boolean => {
  const status = String(shipment.status || '').toLowerCase().trim();
  return (
    status === 'pendiente' ||
    status === 'pending' ||
    shipment.status === ShipmentStatus.PENDING ||
    getActualStatus(shipment) === 'PENDIENTE'
  );
};

/**
 * Calcula métricas de un array de shipments de forma flexible
 * Utiliza las funciones de verificación tolerantes
 */
export const calculateShipmentMetrics = (shipments: Shipment[]) => {
  const total = shipments.length;
  const delivered = shipments.filter(isDelivered).length;
  const inTransit = shipments.filter(isInTransit).length;
  const issues = shipments.filter(isIssue).length;
  const inOffice = shipments.filter(isInOffice).length;
  const pending = shipments.filter(isPending).length;

  return {
    total,
    delivered,
    inTransit,
    issues,
    inOffice,
    pending,
    deliveryRate: total > 0 ? Math.round((delivered / total) * 100 * 10) / 10 : 0,
    issueRate: total > 0 ? Math.round((issues / total) * 100 * 10) / 10 : 0,
  };
};
