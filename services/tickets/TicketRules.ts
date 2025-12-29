/**
 * TicketRules - PR #5
 *
 * Automatic ticket creation rules.
 * Creates tickets ONLY when:
 * - Real execution failure
 * - Shipment stuck after automated actions
 *
 * NO PII in tickets - only phoneHash.
 */

import { TicketService } from './TicketService';
import { ActionLogService } from '../eventLog/ActionLogService';
import { EventLogService } from '../eventLog/EventLogService';
import {
  Ticket,
  TicketTrigger,
  TicketPriority,
  TicketMetadata,
  CreateTicketParams,
} from '../../types/ticket.types';
import { ActionLog, ActionStatus } from '../../types/eventLog.types';

// =====================================================
// TYPES
// =====================================================

interface FailureContext {
  actionLog: ActionLog;
  httpCode?: number;
  errorMessage?: string;
  retryCount?: number;
}

interface StuckContext {
  guia: string;
  trigger: TicketTrigger;
  lastSuccessfulContactAt?: Date;
  lastMovementAt?: Date;
  metadata: TicketMetadata;
  eventRefs: string[];
  actionRefs: string[];
}

// =====================================================
// TICKET RULES IMPLEMENTATION
// =====================================================

class TicketRulesImpl {
  private readonly HOURS_48 = 48 * 60 * 60 * 1000;

  /**
   * Hash a phone number for safe storage
   * Uses simple hash - in production use crypto
   */
  private hashPhone(phone: string): string {
    let hash = 0;
    for (let i = 0; i < phone.length; i++) {
      const char = phone.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `ph_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Rule A: Create ticket for 4xx failure
   * Trigger: ActionLog FAILED with 4xx in SEND_WHATSAPP
   * Priority: alta (immediate attention needed)
   */
  onFailed4xx(context: FailureContext): Ticket | null {
    const { actionLog, httpCode, errorMessage } = context;

    // Only for SEND_WHATSAPP actions
    if (actionLog.actionType !== 'SEND_WHATSAPP') {
      return null;
    }

    // Only for 4xx errors
    if (!httpCode || httpCode < 400 || httpCode >= 500) {
      return null;
    }

    // Extract metadata from action (NO PII)
    const metadata: TicketMetadata = {
      ciudad_de_destino: actionLog.metadata?.city as string,
      transportadora: actionLog.metadata?.carrier as string,
      estatus: actionLog.metadata?.canonicalStatus as string,
      failureCode: httpCode,
      failureReason: this.sanitizeErrorMessage(errorMessage || 'Unknown 4xx error'),
      retryCount: actionLog.retryCount || 0,
    };

    // Hash phone if present
    if (actionLog.metadata?.phoneHash) {
      metadata.phoneHash = actionLog.metadata.phoneHash as string;
    }

    const params: CreateTicketParams = {
      guia: actionLog.guia,
      trigger: 'FAILED_4XX',
      priority: 'alta',
      metadata,
      actionRefs: [actionLog.id],
      eventRefs: actionLog.metadata?.eventLogId
        ? [actionLog.metadata.eventLogId as string]
        : [],
      initialNote: `WhatsApp send failed with HTTP ${httpCode}`,
    };

    return TicketService.createTicket(params);
  }

  /**
   * Rule B: Create ticket for 5xx after retries
   * Trigger: ActionLog FAILED 5xx >= 2 attempts
   * Priority: media/alta depending on retry count
   */
  onFailed5xxRetries(context: FailureContext): Ticket | null {
    const { actionLog, httpCode, errorMessage, retryCount = 0 } = context;

    // Only for SEND_WHATSAPP actions
    if (actionLog.actionType !== 'SEND_WHATSAPP') {
      return null;
    }

    // Only for 5xx errors
    if (!httpCode || httpCode < 500) {
      return null;
    }

    // Only after 2+ retries
    const totalRetries = retryCount || actionLog.retryCount || 0;
    if (totalRetries < 2) {
      return null; // Will retry, no ticket yet
    }

    // Priority based on retry count
    const priority: TicketPriority = totalRetries >= 3 ? 'alta' : 'media';

    const metadata: TicketMetadata = {
      ciudad_de_destino: actionLog.metadata?.city as string,
      transportadora: actionLog.metadata?.carrier as string,
      estatus: actionLog.metadata?.canonicalStatus as string,
      failureCode: httpCode,
      failureReason: this.sanitizeErrorMessage(errorMessage || 'Server error'),
      retryCount: totalRetries,
    };

    if (actionLog.metadata?.phoneHash) {
      metadata.phoneHash = actionLog.metadata.phoneHash as string;
    }

    const params: CreateTicketParams = {
      guia: actionLog.guia,
      trigger: 'FAILED_5XX_RETRIES',
      priority,
      metadata,
      actionRefs: [actionLog.id],
      eventRefs: actionLog.metadata?.eventLogId
        ? [actionLog.metadata.eventLogId as string]
        : [],
      initialNote: `WhatsApp send failed with HTTP ${httpCode} after ${totalRetries} retries`,
    };

    return TicketService.createTicket(params);
  }

  /**
   * Rule C: Create ticket for AT_OFFICE_3D still stuck
   * Trigger: 48h since first SUCCESS contact and no new movement
   * Priority: alta
   */
  onAtOfficeStillStuck(context: StuckContext): Ticket | null {
    const {
      guia,
      lastSuccessfulContactAt,
      lastMovementAt,
      metadata,
      eventRefs,
      actionRefs,
    } = context;

    // Must have had successful contact
    if (!lastSuccessfulContactAt) {
      return null;
    }

    const now = Date.now();
    const timeSinceContact = now - lastSuccessfulContactAt.getTime();

    // Check if 48h have passed since contact
    if (timeSinceContact < this.HOURS_48) {
      return null; // Not yet 48h
    }

    // Check if there was movement after contact
    if (lastMovementAt && lastMovementAt.getTime() > lastSuccessfulContactAt.getTime()) {
      return null; // There was movement, no ticket needed
    }

    const params: CreateTicketParams = {
      guia,
      trigger: 'AT_OFFICE_STILL',
      priority: 'alta',
      metadata,
      actionRefs,
      eventRefs,
      initialNote: `Shipment still at office 48h+ after successful WhatsApp contact`,
    };

    return TicketService.createTicket(params);
  }

  /**
   * Rule D: Create ticket for NO_MOVEMENT_48H
   * Trigger: 48h since SUCCESS contact and no new movement
   * Priority: media
   */
  onNoMovementAfterContact(context: StuckContext): Ticket | null {
    const {
      guia,
      lastSuccessfulContactAt,
      lastMovementAt,
      metadata,
      eventRefs,
      actionRefs,
    } = context;

    // Must have had successful contact
    if (!lastSuccessfulContactAt) {
      return null;
    }

    const now = Date.now();
    const timeSinceContact = now - lastSuccessfulContactAt.getTime();

    // Check if 48h have passed since contact
    if (timeSinceContact < this.HOURS_48) {
      return null; // Not yet 48h
    }

    // Check if there was movement after contact
    if (lastMovementAt && lastMovementAt.getTime() > lastSuccessfulContactAt.getTime()) {
      return null; // There was movement, no ticket needed
    }

    const params: CreateTicketParams = {
      guia,
      trigger: 'NO_MOVEMENT_AFTER_CONTACT',
      priority: 'media',
      metadata,
      actionRefs,
      eventRefs,
      initialNote: `No movement detected 48h+ after successful WhatsApp contact`,
    };

    return TicketService.createTicket(params);
  }

  /**
   * Process a failed action and create ticket if needed
   * Call this when an action fails
   */
  processFailedAction(
    actionLog: ActionLog,
    httpCode?: number,
    errorMessage?: string
  ): Ticket | null {
    const context: FailureContext = {
      actionLog,
      httpCode,
      errorMessage,
      retryCount: actionLog.retryCount,
    };

    // Try 4xx rule first
    if (httpCode && httpCode >= 400 && httpCode < 500) {
      return this.onFailed4xx(context);
    }

    // Try 5xx rule
    if (httpCode && httpCode >= 500) {
      return this.onFailed5xxRetries(context);
    }

    return null;
  }

  /**
   * Check for stuck shipments and create tickets
   * Call this periodically (e.g., in CRON)
   */
  async checkStuckShipments(
    getSuccessfulContacts: () => Promise<Array<{
      guia: string;
      contactedAt: Date;
      actionId: string;
      trigger: 'AT_OFFICE_3D' | 'NO_MOVEMENT_48H';
    }>>,
    getLatestMovement: (guia: string) => Promise<{
      movementAt: Date | null;
      eventId: string | null;
      metadata: TicketMetadata;
    }>
  ): Promise<Ticket[]> {
    const createdTickets: Ticket[] = [];
    const contacts = await getSuccessfulContacts();

    for (const contact of contacts) {
      const movement = await getLatestMovement(contact.guia);

      const context: StuckContext = {
        guia: contact.guia,
        trigger: contact.trigger === 'AT_OFFICE_3D' ? 'AT_OFFICE_STILL' : 'NO_MOVEMENT_AFTER_CONTACT',
        lastSuccessfulContactAt: contact.contactedAt,
        lastMovementAt: movement.movementAt || undefined,
        metadata: movement.metadata,
        eventRefs: movement.eventId ? [movement.eventId] : [],
        actionRefs: [contact.actionId],
      };

      let ticket: Ticket | null = null;

      if (contact.trigger === 'AT_OFFICE_3D') {
        ticket = this.onAtOfficeStillStuck(context);
      } else {
        ticket = this.onNoMovementAfterContact(context);
      }

      if (ticket) {
        createdTickets.push(ticket);
      }
    }

    return createdTickets;
  }

  /**
   * Sanitize error message to remove any potential PII
   */
  private sanitizeErrorMessage(message: string): string {
    return message
      .replace(/\+?\d{10,15}/g, '[PHONE_REDACTED]')
      .replace(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g, '[PHONE_REDACTED]')
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]')
      .substring(0, 500); // Limit length
  }

  // =====================================================
  // SCORING INTEGRATION (PR #6)
  // =====================================================

  /**
   * Upgrade ticket priority based on risk score
   * Call this after creating a ticket to potentially upgrade to 'alta'
   *
   * Uses RiskScoringService - does NOT recalculate scoring logic
   */
  async upgradePriorityIfHighRisk(
    ticket: Ticket,
    guideState: {
      numero_de_guia: string;
      estatus: any;
      ciudad_de_destino?: string;
      transportadora?: string;
      novedad?: string;
      fecha_de_ultimo_movimiento?: Date | string;
    }
  ): Promise<Ticket> {
    // Dynamic import to avoid circular dependency
    const { RiskScoringService } = await import('../scoring/RiskScoringService');

    const riskResult = RiskScoringService.scoreGuide(guideState);

    // If HIGH risk and current priority is media, upgrade to alta
    if (riskResult.riskLevel === 'HIGH' && ticket.priority === 'media') {
      TicketService.updateTicket(ticket.ticketId, {
        priority: 'alta',
        addTimelineEntry: {
          action: 'PRIORITY_UPGRADED',
          actor: 'system',
          details: {
            reason: 'high_risk_score',
            riskScore: riskResult.score,
            riskReasons: riskResult.reasons,
          },
        },
      });
      ticket.priority = 'alta';
    }

    return ticket;
  }

  /**
   * Get open tickets sorted by risk
   * Uses RiskScoringService for ordering - does NOT recalculate
   */
  async getTicketsSortedByRisk(
    tickets: Ticket[],
    getGuideState: (guia: string) => Promise<{
      numero_de_guia: string;
      estatus: any;
      ciudad_de_destino?: string;
      transportadora?: string;
      novedad?: string;
      fecha_de_ultimo_movimiento?: Date | string;
    } | null>
  ): Promise<Array<Ticket & { riskScore?: number; riskLevel?: string }>> {
    const { RiskScoringService } = await import('../scoring/RiskScoringService');

    const ticketsWithRisk: Array<Ticket & { riskScore?: number; riskLevel?: string }> = [];

    for (const ticket of tickets) {
      const guideState = await getGuideState(ticket.guia);

      if (guideState) {
        const riskResult = RiskScoringService.scoreGuide(guideState);
        ticketsWithRisk.push({
          ...ticket,
          riskScore: riskResult.score,
          riskLevel: riskResult.riskLevel,
        });
      } else {
        ticketsWithRisk.push(ticket);
      }
    }

    // Sort by risk: HIGH first, then MEDIUM, then LOW
    // Within same level, sort by score descending
    return ticketsWithRisk.sort((a, b) => {
      const levelOrder: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      const aLevel = a.riskLevel || 'LOW';
      const bLevel = b.riskLevel || 'LOW';

      const levelDiff = (levelOrder[aLevel] || 2) - (levelOrder[bLevel] || 2);
      if (levelDiff !== 0) return levelDiff;

      return (b.riskScore || 0) - (a.riskScore || 0);
    });
  }
}

// =====================================================
// SINGLETON EXPORT
// =====================================================

export const TicketRules = new TicketRulesImpl();
export default TicketRules;
