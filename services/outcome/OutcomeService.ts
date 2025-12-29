/**
 * OutcomeService - PR #8
 *
 * Tracks real outcomes of SEND_WHATSAPP actions.
 * Measures if shipments moved after contact.
 *
 * Key responsibilities:
 * 1. Create OutcomeLog for each successful SEND_WHATSAPP
 * 2. Compute movedWithin24h/48h based on new events
 * 3. Track ticket creation as failure proxy
 *
 * NO PII stored - only logistics metrics.
 */

import {
  OutcomeLog,
  OutcomeComputeInput,
  MovementCheckResult,
} from '../../types/outcome.types';
import { CanonicalStatus } from '../../types/canonical.types';
import { ProtocolTrigger } from '../../types/protocol.types';
import { ActionLog } from '../../types/eventLog.types';
import { EventLogService } from '../eventLog/EventLogService';

// =====================================================
// CONSTANTS
// =====================================================

/** Window for checking 24h outcome */
const HOURS_24 = 24 * 60 * 60 * 1000;

/** Window for checking 48h outcome */
const HOURS_48 = 48 * 60 * 60 * 1000;

// =====================================================
// OUTCOME SERVICE
// =====================================================

class OutcomeServiceImpl {
  // In-memory storage (replace with DB in production)
  private outcomes: Map<string, OutcomeLog> = new Map();
  private outcomesByAction: Map<string, string> = new Map(); // actionId -> outcomeId
  private outcomesByGuia: Map<string, string[]> = new Map(); // guia -> outcomeId[]

  /**
   * Generate unique outcome ID
   */
  private generateId(): string {
    return `out_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create an OutcomeLog for a successful SEND_WHATSAPP action
   * Called when ActionExecutor marks an action as SUCCESS
   */
  createOutcome(input: OutcomeComputeInput): OutcomeLog {
    const id = this.generateId();
    const now = new Date();

    // Check for existing outcome for this action (idempotency)
    const existingId = this.outcomesByAction.get(input.actionId);
    if (existingId) {
      const existing = this.outcomes.get(existingId);
      if (existing) return existing;
    }

    const outcome: OutcomeLog = {
      id,
      actionId: input.actionId,
      guia: input.guia,
      trigger: input.trigger,
      sentAt: input.sentAt,
      statusAtSend: input.statusAtSend,
      city: input.city,
      carrier: input.carrier,
      prevMovementAt: input.prevMovementAt,
      newMovementAt: undefined,
      movedWithin24h: false,
      movedWithin48h: false,
      hoursToMovement: undefined,
      finalStatus: undefined,
      ticketCreatedAfter: false,
      computedAt: now,
      isFinal: false,
    };

    // Store
    this.outcomes.set(id, outcome);
    this.outcomesByAction.set(input.actionId, id);

    // Index by guia
    const guiaOutcomes = this.outcomesByGuia.get(input.guia) || [];
    guiaOutcomes.push(id);
    this.outcomesByGuia.set(input.guia, guiaOutcomes);

    return outcome;
  }

  /**
   * Check and update outcomes based on new events
   * Should be called periodically (e.g., every CRON run)
   */
  updateOutcomes(now: Date = new Date()): {
    updated: number;
    finalized: number;
  } {
    let updated = 0;
    let finalized = 0;

    for (const outcome of this.outcomes.values()) {
      if (outcome.isFinal) continue;

      const timeSinceSend = now.getTime() - outcome.sentAt.getTime();
      const wasUpdated = this.checkAndUpdateOutcome(outcome, now);

      if (wasUpdated) updated++;

      // Mark as final after 48h window
      if (timeSinceSend >= HOURS_48 && !outcome.isFinal) {
        outcome.isFinal = true;
        outcome.computedAt = now;
        finalized++;
      }
    }

    return { updated, finalized };
  }

  /**
   * Check for movement and update outcome
   */
  private checkAndUpdateOutcome(outcome: OutcomeLog, now: Date): boolean {
    const checkResult = this.checkForMovement(outcome.guia, outcome.sentAt, outcome.prevMovementAt);

    if (!checkResult.hasMoved) return false;

    const timeSinceSend = now.getTime() - outcome.sentAt.getTime();
    const sendTime = outcome.sentAt.getTime();

    // Update movement data
    if (checkResult.newMovementAt && !outcome.newMovementAt) {
      outcome.newMovementAt = checkResult.newMovementAt;
      const movementTime = checkResult.newMovementAt.getTime();
      const hoursToMove = (movementTime - sendTime) / (1000 * 60 * 60);
      outcome.hoursToMovement = Math.round(hoursToMove * 10) / 10; // 1 decimal

      // Check 24h window
      if (movementTime - sendTime <= HOURS_24) {
        outcome.movedWithin24h = true;
      }

      // Check 48h window
      if (movementTime - sendTime <= HOURS_48) {
        outcome.movedWithin48h = true;
      }

      outcome.computedAt = now;
      return true;
    }

    // Update final status if 48h passed
    if (timeSinceSend >= HOURS_48) {
      outcome.finalStatus = checkResult.currentStatus;
    }

    return false;
  }

  /**
   * Check if a guide has moved since the message was sent
   */
  private checkForMovement(
    guia: string,
    sentAt: Date,
    prevMovementAt: Date
  ): MovementCheckResult {
    // Get guide state from EventLogService
    const guideState = EventLogService.getGuideState(guia);

    if (!guideState) {
      return {
        hasMoved: false,
        currentStatus: CanonicalStatus.UNKNOWN,
      };
    }

    // Check if there's a new movement after sentAt
    const events = EventLogService.getEventsForGuide(guia);
    const newEvents = events.filter(e =>
      e.occurredAt > prevMovementAt && e.occurredAt > sentAt
    );

    if (newEvents.length > 0) {
      const firstNewEvent = newEvents[0];
      return {
        hasMoved: true,
        newMovementAt: firstNewEvent.occurredAt,
        hoursToMovement: (firstNewEvent.occurredAt.getTime() - sentAt.getTime()) / (1000 * 60 * 60),
        currentStatus: guideState.currentStatus,
      };
    }

    return {
      hasMoved: false,
      currentStatus: guideState.currentStatus,
    };
  }

  /**
   * Mark that a ticket was created after this action
   * Called by TicketRules when creating NO_MOVEMENT_AFTER_CONTACT ticket
   */
  markTicketCreated(guia: string, actionId?: string): void {
    // Find outcome by actionId or most recent for guia
    let outcome: OutcomeLog | undefined;

    if (actionId) {
      const outcomeId = this.outcomesByAction.get(actionId);
      if (outcomeId) {
        outcome = this.outcomes.get(outcomeId);
      }
    }

    if (!outcome) {
      // Find most recent non-final outcome for this guia
      const guiaOutcomeIds = this.outcomesByGuia.get(guia) || [];
      for (const id of guiaOutcomeIds.reverse()) {
        const o = this.outcomes.get(id);
        if (o && !o.isFinal) {
          outcome = o;
          break;
        }
      }
    }

    if (outcome) {
      outcome.ticketCreatedAfter = true;
      outcome.computedAt = new Date();
    }
  }

  /**
   * Get outcome by ID
   */
  getOutcome(id: string): OutcomeLog | null {
    return this.outcomes.get(id) || null;
  }

  /**
   * Get outcome by action ID
   */
  getOutcomeByAction(actionId: string): OutcomeLog | null {
    const outcomeId = this.outcomesByAction.get(actionId);
    if (!outcomeId) return null;
    return this.outcomes.get(outcomeId) || null;
  }

  /**
   * Get all outcomes for a guide
   */
  getOutcomesForGuide(guia: string): OutcomeLog[] {
    const ids = this.outcomesByGuia.get(guia) || [];
    return ids.map(id => this.outcomes.get(id)).filter(Boolean) as OutcomeLog[];
  }

  /**
   * Get outcomes within a date range
   */
  getOutcomesInRange(start: Date, end: Date): OutcomeLog[] {
    return Array.from(this.outcomes.values()).filter(
      o => o.sentAt >= start && o.sentAt <= end
    );
  }

  /**
   * Get all final outcomes (48h window passed)
   */
  getFinalOutcomes(): OutcomeLog[] {
    return Array.from(this.outcomes.values()).filter(o => o.isFinal);
  }

  /**
   * Get outcomes by trigger
   */
  getOutcomesByTrigger(trigger: ProtocolTrigger): OutcomeLog[] {
    return Array.from(this.outcomes.values()).filter(o => o.trigger === trigger);
  }

  /**
   * Get all outcomes
   */
  getAllOutcomes(): OutcomeLog[] {
    return Array.from(this.outcomes.values());
  }

  /**
   * Get quick statistics
   */
  getStats(): {
    total: number;
    final: number;
    pending: number;
    movedWithin24h: number;
    movedWithin48h: number;
    ticketCreatedAfter: number;
    byTrigger: Record<string, number>;
  } {
    const outcomes = Array.from(this.outcomes.values());
    const finalOutcomes = outcomes.filter(o => o.isFinal);

    const byTrigger: Record<string, number> = {};
    for (const o of outcomes) {
      byTrigger[o.trigger] = (byTrigger[o.trigger] || 0) + 1;
    }

    return {
      total: outcomes.length,
      final: finalOutcomes.length,
      pending: outcomes.length - finalOutcomes.length,
      movedWithin24h: finalOutcomes.filter(o => o.movedWithin24h).length,
      movedWithin48h: finalOutcomes.filter(o => o.movedWithin48h).length,
      ticketCreatedAfter: finalOutcomes.filter(o => o.ticketCreatedAfter).length,
      byTrigger,
    };
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.outcomes.clear();
    this.outcomesByAction.clear();
    this.outcomesByGuia.clear();
  }
}

// Singleton export
export const OutcomeService = new OutcomeServiceImpl();

export default OutcomeService;
