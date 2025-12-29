/**
 * Canonical Status System
 * Single source of truth for shipment status normalization
 *
 * This replaces the 6 different status mapping systems found in:
 * - services/webhookService.ts
 * - services/statusParserService.ts
 * - services/brain/unification/DataUnifier.ts
 * - services/dataSourceService.ts
 * - constants/index.ts
 * - types.ts (ShipmentStatus enum)
 */

/**
 * Canonical shipment status - the definitive state of a shipment
 * Maps all carrier-specific statuses to these 10 canonical values
 */
export enum CanonicalStatus {
  /** Guía creada, aún no recogida */
  CREATED = 'CREATED',

  /** En proceso de preparación/recogida */
  PROCESSING = 'PROCESSING',

  /** Despachado desde origen */
  SHIPPED = 'SHIPPED',

  /** En tránsito entre ciudades/centros */
  IN_TRANSIT = 'IN_TRANSIT',

  /** En ruta de entrega al destinatario */
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',

  /** Disponible en oficina/punto para recogida */
  IN_OFFICE = 'IN_OFFICE',

  /** Entregado exitosamente */
  DELIVERED = 'DELIVERED',

  /** Tiene una novedad/problema (ver ExceptionReason) */
  ISSUE = 'ISSUE',

  /** Devuelto al remitente */
  RETURNED = 'RETURNED',

  /** Cancelado */
  CANCELLED = 'CANCELLED',
}

/**
 * Exception reasons - why a shipment has an ISSUE status
 * Separated from CanonicalStatus for clarity and granularity
 */
export enum ExceptionReason {
  /** Sin novedad específica */
  NONE = 'NONE',

  /** Dirección incorrecta o no encontrada */
  BAD_ADDRESS = 'BAD_ADDRESS',

  /** Destinatario no encontrado/ausente */
  RECIPIENT_UNAVAILABLE = 'RECIPIENT_UNAVAILABLE',

  /** Destinatario rechazó el paquete */
  REJECTED = 'REJECTED',

  /** Paquete dañado */
  DAMAGED = 'DAMAGED',

  /** Paquete perdido */
  LOST = 'LOST',

  /** Documentación incompleta */
  DOCUMENTATION = 'DOCUMENTATION',

  /** Pago pendiente (contraentrega) */
  PAYMENT_PENDING = 'PAYMENT_PENDING',

  /** Problemas de seguridad en la zona */
  SECURITY = 'SECURITY',

  /** Desastre natural o clima extremo */
  WEATHER = 'WEATHER',

  /** Intento de entrega fallido */
  DELIVERY_ATTEMPT_FAILED = 'DELIVERY_ATTEMPT_FAILED',

  /** Teléfono incorrecto o no contesta */
  BAD_PHONE = 'BAD_PHONE',

  /** Reprogramado por el cliente */
  RESCHEDULED = 'RESCHEDULED',

  /** Problema con el pago COD */
  COD_ISSUE = 'COD_ISSUE',

  /** Zona de difícil acceso */
  REMOTE_AREA = 'REMOTE_AREA',

  /** Otro motivo no especificado */
  OTHER = 'OTHER',
}

/**
 * Source of the shipment data
 */
export type DataSource = 'dropi' | 'carrier' | 'excel' | 'manual' | 'webhook' | 'system';

/**
 * Normalized status result from the StatusNormalizer
 * Contains all information needed for consistent status handling
 *
 * PR#1 Spec: normalizeShipment(input) returns:
 * - canonicalStatus
 * - exceptionReason?
 * - rawStatus (texto original)
 * - source (dropi / carrier / excel / manual)
 * - lastEventAt (timestamp evento)
 */
export interface NormalizedStatus {
  /** The canonical status */
  status: CanonicalStatus;

  /** The exception reason (only relevant when status is ISSUE) */
  reason: ExceptionReason;

  /** The original raw status from the carrier */
  rawStatus: string;

  /** Source of this data */
  source: DataSource;

  /** Timestamp when this status event occurred */
  lastEventAt: Date;
}

/**
 * @deprecated Use NormalizedStatus instead
 * Legacy alias for backward compatibility
 */
export interface NormalizedStatusLegacy {
  status: CanonicalStatus;
  reason: ExceptionReason;
  rawStatus: string;
  timestamp: Date;
}

/**
 * Carrier identification
 */
export type CarrierCode = 'COORDINADORA' | 'INTERRAPIDISIMO' | 'ENVIA' | 'TCC' | 'SERVIENTREGA' | 'UNKNOWN';

/**
 * Status mapping entry for a carrier
 */
export interface StatusMapping {
  pattern: RegExp | string;
  status: CanonicalStatus;
  reason?: ExceptionReason;
}

/**
 * Human-readable labels for canonical statuses (Spanish)
 */
export const CanonicalStatusLabels: Record<CanonicalStatus, string> = {
  [CanonicalStatus.CREATED]: 'Creado',
  [CanonicalStatus.PROCESSING]: 'En proceso',
  [CanonicalStatus.SHIPPED]: 'Despachado',
  [CanonicalStatus.IN_TRANSIT]: 'En tránsito',
  [CanonicalStatus.OUT_FOR_DELIVERY]: 'En reparto',
  [CanonicalStatus.IN_OFFICE]: 'En oficina',
  [CanonicalStatus.DELIVERED]: 'Entregado',
  [CanonicalStatus.ISSUE]: 'Con novedad',
  [CanonicalStatus.RETURNED]: 'Devuelto',
  [CanonicalStatus.CANCELLED]: 'Cancelado',
};

/**
 * Human-readable labels for exception reasons (Spanish)
 */
export const ExceptionReasonLabels: Record<ExceptionReason, string> = {
  [ExceptionReason.NONE]: 'Sin novedad',
  [ExceptionReason.BAD_ADDRESS]: 'Dirección incorrecta',
  [ExceptionReason.RECIPIENT_UNAVAILABLE]: 'Destinatario ausente',
  [ExceptionReason.REJECTED]: 'Rechazado',
  [ExceptionReason.DAMAGED]: 'Dañado',
  [ExceptionReason.LOST]: 'Perdido',
  [ExceptionReason.DOCUMENTATION]: 'Documentación incompleta',
  [ExceptionReason.PAYMENT_PENDING]: 'Pago pendiente',
  [ExceptionReason.SECURITY]: 'Problema de seguridad',
  [ExceptionReason.WEATHER]: 'Clima/Desastre',
  [ExceptionReason.DELIVERY_ATTEMPT_FAILED]: 'Intento fallido',
  [ExceptionReason.BAD_PHONE]: 'Teléfono incorrecto',
  [ExceptionReason.RESCHEDULED]: 'Reprogramado',
  [ExceptionReason.COD_ISSUE]: 'Problema COD',
  [ExceptionReason.REMOTE_AREA]: 'Zona difícil acceso',
  [ExceptionReason.OTHER]: 'Otro',
};

/**
 * Status colors for UI rendering
 */
export const CanonicalStatusColors: Record<CanonicalStatus, { bg: string; text: string; border: string }> = {
  [CanonicalStatus.CREATED]: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  [CanonicalStatus.PROCESSING]: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  [CanonicalStatus.SHIPPED]: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300' },
  [CanonicalStatus.IN_TRANSIT]: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  [CanonicalStatus.OUT_FOR_DELIVERY]: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  [CanonicalStatus.IN_OFFICE]: { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-300' },
  [CanonicalStatus.DELIVERED]: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  [CanonicalStatus.ISSUE]: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  [CanonicalStatus.RETURNED]: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  [CanonicalStatus.CANCELLED]: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
};
