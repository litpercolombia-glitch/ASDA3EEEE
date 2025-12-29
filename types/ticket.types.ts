/**
 * Ticket Types - PR #5
 *
 * Tickets are created ONLY for:
 * - Real execution failures
 * - Shipments stuck after automated actions
 *
 * NO PII stored - only phoneHash, never phone in clear.
 */

// =====================================================
// ENUMS
// =====================================================

/**
 * What triggered the ticket creation
 */
export type TicketTrigger =
  | 'FAILED_4XX'              // WhatsApp send failed with 4xx (invalid phone, etc.)
  | 'FAILED_5XX_RETRIES'      // WhatsApp failed 5xx after multiple retries
  | 'NO_MOVEMENT_AFTER_CONTACT' // No movement 48h after successful WhatsApp
  | 'AT_OFFICE_STILL';        // Still at office 48h after contact

/**
 * Ticket priority
 */
export type TicketPriority = 'alta' | 'media';

/**
 * Ticket lifecycle status
 */
export type TicketStatus =
  | 'OPEN'        // New, needs attention
  | 'IN_PROGRESS' // Being worked on
  | 'RESOLVED'    // Issue fixed, awaiting confirmation
  | 'CLOSED';     // Done

// =====================================================
// MAIN TYPES
// =====================================================

/**
 * Ticket metadata - NO PII
 * Only allowed fields from logistics data
 */
export interface TicketMetadata {
  // Shipment context (no PII)
  ciudad_de_destino?: string;
  transportadora?: string;
  estatus?: string;
  novedad?: string;
  ultimo_movimiento?: string;

  // Dates
  fecha_de_ultimo_movimiento?: string;
  fecha_de_generacion_de_guia?: string;

  // Failure details (no PII)
  failureCode?: number;
  failureReason?: string;
  retryCount?: number;

  // Phone hash for dedup (never clear phone)
  phoneHash?: string;
}

/**
 * Timeline entry for audit trail
 */
export interface TicketTimelineEntry {
  timestamp: Date;
  action: string;
  actor: 'system' | 'user' | 'protocol_engine';
  details?: Record<string, unknown>; // NO PII
}

/**
 * Main Ticket type
 */
export interface Ticket {
  ticketId: string;
  guia: string; // numero_de_guia

  // Why was this ticket created
  trigger: TicketTrigger;
  priority: TicketPriority;
  status: TicketStatus;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  closedAt?: Date;

  // Context (NO PII)
  metadata: TicketMetadata;

  // References to related logs
  actionRefs: string[]; // ActionLog IDs
  eventRefs: string[];  // EventLog IDs

  // Audit trail
  timeline: TicketTimelineEntry[];

  // Resolution
  resolutionNotes?: string; // NO PII in notes
}

// =====================================================
// CREATION PARAMS
// =====================================================

/**
 * Parameters for creating a ticket
 */
export interface CreateTicketParams {
  guia: string;
  trigger: TicketTrigger;
  priority: TicketPriority;
  metadata: TicketMetadata;
  actionRefs?: string[];
  eventRefs?: string[];
  initialNote?: string;
}

/**
 * Parameters for updating a ticket
 */
export interface UpdateTicketParams {
  status?: TicketStatus;
  priority?: TicketPriority;
  resolutionNotes?: string;
  addTimelineEntry?: {
    action: string;
    actor: TicketTimelineEntry['actor'];
    details?: Record<string, unknown>;
  };
}

// =====================================================
// QUERY TYPES
// =====================================================

export interface TicketQuery {
  status?: TicketStatus | TicketStatus[];
  trigger?: TicketTrigger | TicketTrigger[];
  priority?: TicketPriority;
  guia?: string;
  limit?: number;
  offset?: number;
}

export interface TicketStats {
  total: number;
  byStatus: Record<TicketStatus, number>;
  byTrigger: Record<TicketTrigger, number>;
  byPriority: Record<TicketPriority, number>;
  openCount: number;
  avgResolutionTimeMs?: number;
}
