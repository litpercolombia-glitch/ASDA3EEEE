/**
 * TicketService - PR #5
 *
 * Creates tickets ONLY for:
 * - Real execution failures (4xx, 5xx after retries)
 * - Shipments stuck after automated actions
 *
 * Key features:
 * - Idempotency: 1 OPEN ticket per guia+trigger
 * - NO PII: only phoneHash, never clear phone
 * - Timeline: audit trail of what was attempted
 */

import {
  Ticket,
  TicketTrigger,
  TicketPriority,
  TicketStatus,
  TicketMetadata,
  TicketTimelineEntry,
  CreateTicketParams,
  UpdateTicketParams,
  TicketQuery,
  TicketStats,
} from '../../types/ticket.types';

// =====================================================
// TICKET SERVICE IMPLEMENTATION
// =====================================================

class TicketServiceImpl {
  // In-memory storage (replace with DB in production)
  private tickets: Map<string, Ticket> = new Map();

  // Index for fast lookup by guia+trigger
  private openTicketIndex: Map<string, string> = new Map(); // "guia:trigger" -> ticketId

  /**
   * Generate unique ticket ID
   */
  private generateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 6);
    return `tkt_${timestamp}_${random}`;
  }

  /**
   * Build idempotency key for open ticket lookup
   */
  private buildIdempotencyKey(guia: string, trigger: TicketTrigger): string {
    return `${guia}:${trigger}`;
  }

  /**
   * Sanitize metadata to ensure NO PII
   */
  private sanitizeMetadata(metadata: TicketMetadata): TicketMetadata {
    const sanitized: TicketMetadata = {};

    // Only copy allowed fields
    const allowedFields: (keyof TicketMetadata)[] = [
      'ciudad_de_destino',
      'transportadora',
      'estatus',
      'novedad',
      'ultimo_movimiento',
      'fecha_de_ultimo_movimiento',
      'fecha_de_generacion_de_guia',
      'failureCode',
      'failureReason',
      'retryCount',
      'phoneHash',
    ];

    for (const field of allowedFields) {
      if (metadata[field] !== undefined) {
        // Ensure no phone numbers in string fields
        const value = metadata[field];
        if (typeof value === 'string') {
          // Redact any phone patterns
          sanitized[field] = value
            .replace(/\+?\d{10,15}/g, '[REDACTED]')
            .replace(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g, '[REDACTED]');
        } else {
          sanitized[field] = value as any;
        }
      }
    }

    return sanitized;
  }

  /**
   * Sanitize resolution notes
   */
  private sanitizeNotes(notes: string): string {
    return notes
      .replace(/\+?\d{10,15}/g, '[REDACTED]')
      .replace(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g, '[REDACTED]');
  }

  /**
   * Check if an OPEN ticket exists for this guia+trigger
   */
  hasOpenTicket(guia: string, trigger: TicketTrigger): boolean {
    const key = this.buildIdempotencyKey(guia, trigger);
    const ticketId = this.openTicketIndex.get(key);

    if (!ticketId) return false;

    const ticket = this.tickets.get(ticketId);
    return ticket?.status === 'OPEN';
  }

  /**
   * Get existing OPEN ticket for guia+trigger
   */
  getOpenTicket(guia: string, trigger: TicketTrigger): Ticket | null {
    const key = this.buildIdempotencyKey(guia, trigger);
    const ticketId = this.openTicketIndex.get(key);

    if (!ticketId) return null;

    const ticket = this.tickets.get(ticketId);
    return ticket?.status === 'OPEN' ? ticket : null;
  }

  /**
   * Create a new ticket (or add to existing if OPEN)
   * Returns the ticket (new or existing)
   */
  createTicket(params: CreateTicketParams): Ticket {
    const { guia, trigger, priority, metadata, actionRefs = [], eventRefs = [], initialNote } = params;

    // Check for existing OPEN ticket (idempotency)
    const existingTicket = this.getOpenTicket(guia, trigger);

    if (existingTicket) {
      // Add timeline entry instead of creating duplicate
      this.addTimelineEntry(existingTicket.ticketId, {
        action: 'DUPLICATE_TRIGGER_RECEIVED',
        actor: 'system',
        details: {
          newActionRefs: actionRefs,
          newEventRefs: eventRefs,
          note: initialNote,
        },
      });

      // Add new refs
      existingTicket.actionRefs = [...new Set([...existingTicket.actionRefs, ...actionRefs])];
      existingTicket.eventRefs = [...new Set([...existingTicket.eventRefs, ...eventRefs])];
      existingTicket.updatedAt = new Date();

      return existingTicket;
    }

    // Create new ticket
    const now = new Date();
    const ticketId = this.generateId();

    const ticket: Ticket = {
      ticketId,
      guia,
      trigger,
      priority,
      status: 'OPEN',
      createdAt: now,
      updatedAt: now,
      metadata: this.sanitizeMetadata(metadata),
      actionRefs,
      eventRefs,
      timeline: [
        {
          timestamp: now,
          action: 'TICKET_CREATED',
          actor: 'system',
          details: {
            trigger,
            priority,
            note: initialNote,
          },
        },
      ],
    };

    // Store
    this.tickets.set(ticketId, ticket);
    this.openTicketIndex.set(this.buildIdempotencyKey(guia, trigger), ticketId);

    return ticket;
  }

  /**
   * Add timeline entry to a ticket
   */
  addTimelineEntry(
    ticketId: string,
    entry: Omit<TicketTimelineEntry, 'timestamp'>
  ): boolean {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) return false;

    ticket.timeline.push({
      ...entry,
      timestamp: new Date(),
    });
    ticket.updatedAt = new Date();

    return true;
  }

  /**
   * Update ticket status/priority/notes
   */
  updateTicket(ticketId: string, params: UpdateTicketParams): Ticket | null {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) return null;

    const now = new Date();
    const changes: string[] = [];

    // Update status
    if (params.status && params.status !== ticket.status) {
      const oldStatus = ticket.status;
      ticket.status = params.status;
      changes.push(`status: ${oldStatus} -> ${params.status}`);

      // Track resolution/close times
      if (params.status === 'RESOLVED') {
        ticket.resolvedAt = now;
      } else if (params.status === 'CLOSED') {
        ticket.closedAt = now;

        // Remove from open index
        const key = this.buildIdempotencyKey(ticket.guia, ticket.trigger);
        this.openTicketIndex.delete(key);
      }
    }

    // Update priority
    if (params.priority && params.priority !== ticket.priority) {
      changes.push(`priority: ${ticket.priority} -> ${params.priority}`);
      ticket.priority = params.priority;
    }

    // Update resolution notes
    if (params.resolutionNotes) {
      ticket.resolutionNotes = this.sanitizeNotes(params.resolutionNotes);
      changes.push('resolution notes updated');
    }

    // Add timeline entry for changes
    if (changes.length > 0) {
      ticket.timeline.push({
        timestamp: now,
        action: 'TICKET_UPDATED',
        actor: params.addTimelineEntry?.actor || 'user',
        details: { changes },
      });
    }

    // Add custom timeline entry if provided
    if (params.addTimelineEntry) {
      ticket.timeline.push({
        timestamp: now,
        ...params.addTimelineEntry,
      });
    }

    ticket.updatedAt = now;
    return ticket;
  }

  /**
   * Get ticket by ID
   */
  getTicket(ticketId: string): Ticket | null {
    return this.tickets.get(ticketId) || null;
  }

  /**
   * Get tickets for a guia
   */
  getTicketsForGuia(guia: string): Ticket[] {
    return Array.from(this.tickets.values())
      .filter(t => t.guia === guia)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Query tickets with filters
   */
  queryTickets(query: TicketQuery): Ticket[] {
    let results = Array.from(this.tickets.values());

    // Filter by status
    if (query.status) {
      const statuses = Array.isArray(query.status) ? query.status : [query.status];
      results = results.filter(t => statuses.includes(t.status));
    }

    // Filter by trigger
    if (query.trigger) {
      const triggers = Array.isArray(query.trigger) ? query.trigger : [query.trigger];
      results = results.filter(t => triggers.includes(t.trigger));
    }

    // Filter by priority
    if (query.priority) {
      results = results.filter(t => t.priority === query.priority);
    }

    // Filter by guia
    if (query.guia) {
      results = results.filter(t => t.guia === query.guia);
    }

    // Sort by priority (alta first), then by createdAt (newest first)
    results.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority === 'alta' ? -1 : 1;
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    // Pagination
    const offset = query.offset || 0;
    const limit = query.limit || 50;
    return results.slice(offset, offset + limit);
  }

  /**
   * Get all open tickets (for admin dashboard)
   */
  getOpenTickets(limit = 50): Ticket[] {
    return this.queryTickets({ status: 'OPEN', limit });
  }

  /**
   * Get statistics
   */
  getStats(): TicketStats {
    const tickets = Array.from(this.tickets.values());

    const byStatus: Record<TicketStatus, number> = {
      OPEN: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      CLOSED: 0,
    };

    const byTrigger: Record<TicketTrigger, number> = {
      FAILED_4XX: 0,
      FAILED_5XX_RETRIES: 0,
      NO_MOVEMENT_AFTER_CONTACT: 0,
      AT_OFFICE_STILL: 0,
    };

    const byPriority: Record<TicketPriority, number> = {
      alta: 0,
      media: 0,
    };

    let totalResolutionTime = 0;
    let resolvedCount = 0;

    for (const ticket of tickets) {
      byStatus[ticket.status]++;
      byTrigger[ticket.trigger]++;
      byPriority[ticket.priority]++;

      // Calculate avg resolution time
      if (ticket.resolvedAt) {
        totalResolutionTime += ticket.resolvedAt.getTime() - ticket.createdAt.getTime();
        resolvedCount++;
      }
    }

    return {
      total: tickets.length,
      byStatus,
      byTrigger,
      byPriority,
      openCount: byStatus.OPEN,
      avgResolutionTimeMs: resolvedCount > 0
        ? Math.round(totalResolutionTime / resolvedCount)
        : undefined,
    };
  }

  /**
   * Format ticket for API response (safe, no PII)
   */
  formatForApi(ticket: Ticket): Record<string, unknown> {
    return {
      ticketId: ticket.ticketId,
      guia: ticket.guia,
      trigger: ticket.trigger,
      priority: ticket.priority,
      status: ticket.status,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      resolvedAt: ticket.resolvedAt?.toISOString(),
      closedAt: ticket.closedAt?.toISOString(),
      metadata: ticket.metadata,
      actionRefs: ticket.actionRefs,
      eventRefs: ticket.eventRefs,
      timeline: ticket.timeline.map(t => ({
        ...t,
        timestamp: t.timestamp.toISOString(),
      })),
      resolutionNotes: ticket.resolutionNotes,
    };
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.tickets.clear();
    this.openTicketIndex.clear();
  }
}

// =====================================================
// SINGLETON EXPORT
// =====================================================

export const TicketService = new TicketServiceImpl();
export default TicketService;
