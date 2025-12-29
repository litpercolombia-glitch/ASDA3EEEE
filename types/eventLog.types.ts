/**
 * EventLog Types - PR #2
 *
 * Source of truth for logistics event tracking.
 * Supports: Dropi webhooks, Excel Dropi reports, manual entries.
 *
 * IMPORTANT: Based on REAL Dropi data fields:
 * - fecha, telefono, numero_de_guia, estatus, ciudad_de_destino,
 * - transportadora, novedad, fecha_de_ultimo_movimiento,
 * - ultimo_movimiento, fecha_de_generacion_de_guia
 *
 * Privacy: telefono is NEVER stored in clear text - only phoneHash
 */

import { CanonicalStatus, ExceptionReason, DataSource } from './canonical.types';

// =====================================================
// EVENT SOURCE TYPES
// =====================================================

/**
 * Source of the event data
 */
export type EventSource = 'dropi_webhook' | 'excel_dropi' | 'manual';

/**
 * Status of event processing
 */
export type EventProcessingStatus = 'NEW' | 'PROCESSED' | 'DUPLICATE' | 'OUT_OF_ORDER' | 'ERROR';

// =====================================================
// EVENTLOG - INGESTA DE EVENTOS
// =====================================================

/**
 * EventLog - Single source of truth for shipment events
 *
 * Fields mapped from Dropi data:
 * - guia ← numero_de_guia
 * - canonicalStatus ← StatusNormalizer(estatus)
 * - rawStatus ← estatus (original string)
 * - novelty ← novedad
 * - city ← ciudad_de_destino
 * - carrier ← transportadora
 * - lastMovementText ← ultimo_movimiento
 * - occurredAt ← fecha_de_ultimo_movimiento (fallback: fecha)
 * - guideCreatedAt ← fecha_de_generacion_de_guia
 */
export interface EventLog {
  /** Unique event ID */
  id: string;

  /** Tracking number (numero_de_guia) */
  guia: string;

  /** Source of this event */
  source: EventSource;

  /** Canonical status from StatusNormalizer */
  canonicalStatus: CanonicalStatus;

  /** Exception reason if status is ISSUE */
  exceptionReason?: ExceptionReason;

  /** Original status string (estatus) */
  rawStatus: string;

  /** Novelty/issue description (novedad) - can be null */
  novelty: string | null;

  /** Destination city (ciudad_de_destino) */
  city: string;

  /** Carrier name (transportadora) */
  carrier: string;

  /** Last movement description (ultimo_movimiento) */
  lastMovementText: string;

  /** When the event occurred (fecha_de_ultimo_movimiento, fallback: fecha) */
  occurredAt: Date;

  /** When the guide was created (fecha_de_generacion_de_guia) */
  guideCreatedAt: Date | null;

  /** When this event was received/ingested into the system */
  receivedAt: Date;

  /** SHA256 hash of sanitized payload for deduplication */
  payloadHash: string;

  /** SHA256 hash of normalized phone (privacy: never store phone in clear) */
  phoneHash: string;

  /** True if this event's occurredAt is before the last known event */
  isOutOfOrder: boolean;

  /** Processing status */
  processingStatus: EventProcessingStatus;

  /** Error message if processingStatus is ERROR */
  errorMessage?: string;
}

/**
 * Input data from Dropi Excel/Webhook
 * These are the EXACT column names from Dropi exports
 */
export interface DropiRawData {
  /** Fecha general del registro */
  fecha: string;

  /** Teléfono del destinatario (will be hashed, never stored) */
  telefono: string;

  /** Número de guía */
  numero_de_guia: string;

  /** Estado reportado */
  estatus: string;

  /** Ciudad destino */
  ciudad_de_destino: string;

  /** Transportadora */
  transportadora: string;

  /** Novedad/problema (puede ser vacío) */
  novedad?: string;

  /** Fecha del último movimiento */
  fecha_de_ultimo_movimiento?: string;

  /** Descripción del último movimiento */
  ultimo_movimiento?: string;

  /** Fecha de generación de la guía */
  fecha_de_generacion_de_guia?: string;
}

/**
 * Result of processing a Dropi row
 */
export interface EventLogProcessResult {
  /** The created EventLog (or null if duplicate/error) */
  eventLog: EventLog | null;

  /** Whether this was a duplicate */
  isDuplicate: boolean;

  /** Whether this event is out of order */
  isOutOfOrder: boolean;

  /** Idempotency key used */
  idempotencyKey: string;

  /** Any error message */
  error?: string;
}

// =====================================================
// ACTIONLOG - PREPARED FOR AUTOMATION
// =====================================================

/**
 * Action types that can be performed
 */
export type ActionType = 'SEND_WHATSAPP' | 'CREATE_TICKET' | 'ADD_NOTE' | 'RESCHEDULE' | 'ESCALATE';

/**
 * Action execution status
 */
export type ActionStatus =
  | 'PLANNED'           // Waiting to be executed
  | 'RUNNING'           // Currently executing
  | 'SUCCESS'           // Successfully completed
  | 'FAILED'            // Permanently failed
  | 'SKIPPED_DUPLICATE' // Skipped due to idempotency
  | 'SKIPPED_RATE_LIMIT'// Skipped due to rate limiting
  | 'PENDING';          // Legacy/waiting

/**
 * ActionLog - Track all actions taken on shipments
 * Prepared for future automation (WhatsApp, tickets, etc.)
 */
export interface ActionLog {
  /** Unique action ID */
  id: string;

  /** Type of action */
  actionType: ActionType;

  /** Related tracking number */
  guia: string;

  /** Idempotency key to prevent duplicate actions */
  idempotencyKey: string;

  /** Current status of the action */
  status: ActionStatus;

  /** Who/what triggered this action */
  actor: 'system' | 'user' | 'protocol_engine';

  /** When this action was created/planned */
  createdAt: Date;

  /** When this action was executed (if applicable) */
  executedAt?: Date;

  /** Additional context about the action */
  metadata: {
    /** Why this action was triggered */
    reason?: string;

    /** City related to the action */
    city?: string;

    /** Carrier related to the action */
    carrier?: string;

    /** What triggered this action */
    trigger?: 'webhook' | 'excel_import' | 'manual' | 'scheduled' | 'protocol';

    /** Reference to the EventLog that triggered this */
    eventLogId?: string;

    /** Canonical status at the time of action */
    canonicalStatus?: CanonicalStatus;

    /** Any additional data */
    [key: string]: unknown;
  };

  /** Error details if status is FAILED */
  errorDetails?: string;

  /** Number of retry attempts */
  retryCount?: number;
}

// =====================================================
// GUIDE STATE - Current state of a guide
// =====================================================

/**
 * Current consolidated state of a guide
 * Derived from EventLog entries
 */
export interface GuideState {
  /** Tracking number */
  guia: string;

  /** Current canonical status (from most recent valid event) */
  currentStatus: CanonicalStatus;

  /** Current exception reason if applicable */
  currentReason?: ExceptionReason;

  /** Timestamp of the last valid event */
  lastEventAt: Date;

  /** ID of the last event */
  lastEventId: string;

  /** Total number of events for this guide */
  eventCount: number;

  /** Number of duplicate events received */
  duplicateCount: number;

  /** Number of out-of-order events received */
  outOfOrderCount: number;

  /** When the guide was first seen */
  firstSeenAt: Date;

  /** When the guide state was last updated */
  updatedAt: Date;
}

// =====================================================
// BATCH PROCESSING
// =====================================================

/**
 * Result of processing a batch of events (e.g., Excel import)
 */
export interface BatchProcessResult {
  /** Total rows processed */
  totalRows: number;

  /** Successfully processed events */
  successCount: number;

  /** Duplicate events (skipped) */
  duplicateCount: number;

  /** Out-of-order events */
  outOfOrderCount: number;

  /** Errors encountered */
  errorCount: number;

  /** List of errors with row numbers */
  errors: Array<{
    row: number;
    guia: string;
    message: string;
  }>;

  /** Processing duration in milliseconds */
  durationMs: number;

  /** Source identifier */
  source: EventSource;

  /** Timestamp of processing */
  processedAt: Date;
}
