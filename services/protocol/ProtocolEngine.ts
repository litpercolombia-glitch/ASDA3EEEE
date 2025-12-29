/**
 * ProtocolEngine - PR #3
 *
 * Decision engine that evaluates guides against business protocols.
 * DECIDES what to do, does NOT execute.
 *
 * Input: GuideState + EventLog
 * Output: ActionPlan (registered in ActionLog as PLANNED)
 */

import {
  Protocol,
  ProtocolTrigger,
  ProtocolInput,
  ProtocolEvaluationResult,
  ActionPlan,
  BatchProtocolResult,
  buildActionPlanKey,
} from '../../types/protocol.types';
import { CanonicalStatus } from '../../types/canonical.types';
import { EventLogService } from '../eventLog/EventLogService';
import { ActionLogService } from '../eventLog/ActionLogService';
import { GuideState, EventLog } from '../../types/eventLog.types';

// Import protocols
import { NoMovement48HProtocol } from './protocols/NoMovement48H';
import { AtOffice3DProtocol } from './protocols/AtOffice3D';

// =====================================================
// PROTOCOL REGISTRY
// =====================================================

/**
 * All active protocols
 * Order matters: first match wins (or all can apply depending on config)
 */
const ACTIVE_PROTOCOLS: Protocol[] = [
  NoMovement48HProtocol,
  AtOffice3DProtocol,
];

// =====================================================
// TERMINAL STATUSES
// =====================================================

/**
 * Statuses that should NOT trigger any protocol
 * Guide is in final state
 */
const TERMINAL_STATUSES: Set<CanonicalStatus> = new Set([
  CanonicalStatus.DELIVERED,
  CanonicalStatus.RETURNED,
  CanonicalStatus.CANCELLED,
]);

// =====================================================
// PROTOCOL ENGINE
// =====================================================

class ProtocolEngineImpl {
  /**
   * Track which action plans have been created today
   * Key: action:{guia}:{trigger}:{date}
   */
  private actionPlanKeys: Set<string> = new Set();

  /**
   * Evaluate a single guide against all protocols
   */
  evaluateGuide(guia: string, now: Date = new Date()): ProtocolEvaluationResult {
    const result: ProtocolEvaluationResult = {
      guia,
      evaluated: false,
      skipped: false,
      matchedProtocols: [],
      actionPlans: [],
      evaluatedAt: now,
    };

    // Get guide state
    const guideState = EventLogService.getGuideState(guia);
    if (!guideState) {
      result.skipped = true;
      result.skipReason = 'NO_STATE';
      return result;
    }

    // Skip terminal statuses
    if (TERMINAL_STATUSES.has(guideState.currentStatus)) {
      result.skipped = true;
      result.skipReason = 'DELIVERED';
      return result;
    }

    // Get last event
    const lastEvent = EventLogService.getEvent(guideState.lastEventId);
    if (!lastEvent) {
      result.skipped = true;
      result.skipReason = 'NO_EVENT';
      return result;
    }

    // Skip if last event was out of order
    if (lastEvent.isOutOfOrder) {
      result.skipped = true;
      result.skipReason = 'OUT_OF_ORDER';
      return result;
    }

    // Build protocol input
    const input = this.buildProtocolInput(guideState, lastEvent);

    // Mark as evaluated
    result.evaluated = true;

    // Evaluate each protocol
    for (const protocol of ACTIVE_PROTOCOLS) {
      if (protocol.evaluate(input, now)) {
        result.matchedProtocols.push(protocol.id);

        // Build action plan
        const actionPlan = this.buildActionPlan(protocol, input, guideState, lastEvent, now);

        // Check idempotency
        const planKey = buildActionPlanKey(guia, protocol.id, now);
        if (this.actionPlanKeys.has(planKey)) {
          // Already created today, skip
          continue;
        }

        // Register action plan in ActionLog
        const registered = this.registerActionPlan(actionPlan, planKey);
        if (registered) {
          result.actionPlans.push(actionPlan);
          this.actionPlanKeys.add(planKey);
        }
      }
    }

    return result;
  }

  /**
   * Build protocol input from guide state and event
   */
  private buildProtocolInput(state: GuideState, event: EventLog): ProtocolInput {
    return {
      guia: state.guia,
      canonicalStatus: state.currentStatus,
      exceptionReason: state.currentReason,
      novedad: event.novelty,
      ciudad_de_destino: event.city,
      transportadora: event.carrier,
      fecha_de_ultimo_movimiento: state.lastEventAt,
      ultimo_movimiento: event.lastMovementText,
      fecha_de_generacion_de_guia: event.guideCreatedAt,
      lastEventId: event.id,
    };
  }

  /**
   * Build action plan from protocol evaluation
   */
  private buildActionPlan(
    protocol: Protocol,
    input: ProtocolInput,
    state: GuideState,
    event: EventLog,
    now: Date
  ): ActionPlan {
    return {
      guia: input.guia,
      trigger: protocol.id,
      actions: protocol.generateActions(input),
      evaluatedAt: now,
      guideState: {
        currentStatus: state.currentStatus,
        currentReason: state.currentReason,
        lastEventAt: state.lastEventAt,
        city: event.city,
        carrier: event.carrier,
      },
    };
  }

  /**
   * Register action plan in ActionLog
   */
  private registerActionPlan(plan: ActionPlan, idempotencyKey: string): boolean {
    // Register each action in the plan
    for (const action of plan.actions) {
      const result = ActionLogService.planAction({
        actionType: action.type,
        guia: plan.guia,
        reason: action.reason,
        city: plan.guideState.city,
        carrier: plan.guideState.carrier,
        trigger: plan.trigger,
        canonicalStatus: plan.guideState.currentStatus,
        eventLogId: undefined, // Would link to event
      });

      // If any action was skipped as duplicate, return false
      if (result?.status === 'SKIPPED_DUPLICATE') {
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluate all guides
   */
  evaluateAllGuides(now: Date = new Date()): BatchProtocolResult {
    const startTime = Date.now();
    const guides = EventLogService.getAllGuideStates();

    const result: BatchProtocolResult = {
      totalGuides: guides.length,
      evaluated: 0,
      skipped: 0,
      actionPlansCreated: 0,
      duplicatesSkipped: 0,
      byTrigger: {} as Record<ProtocolTrigger, number>,
      durationMs: 0,
    };

    for (const guide of guides) {
      const evalResult = this.evaluateGuide(guide.guia, now);

      if (evalResult.evaluated) {
        result.evaluated++;
      } else {
        result.skipped++;
      }

      for (const plan of evalResult.actionPlans) {
        result.actionPlansCreated++;
        result.byTrigger[plan.trigger] = (result.byTrigger[plan.trigger] || 0) + 1;
      }
    }

    result.durationMs = Date.now() - startTime;
    return result;
  }

  /**
   * Check if an action plan exists for today
   */
  hasActionPlanToday(guia: string, trigger: ProtocolTrigger, now: Date = new Date()): boolean {
    const key = buildActionPlanKey(guia, trigger, now);
    return this.actionPlanKeys.has(key);
  }

  /**
   * Get all registered protocols
   */
  getActiveProtocols(): Protocol[] {
    return [...ACTIVE_PROTOCOLS];
  }

  /**
   * Clear action plan keys (for testing)
   */
  clearActionPlanKeys(): void {
    this.actionPlanKeys.clear();
  }

  /**
   * Full clear (for testing)
   */
  clear(): void {
    this.actionPlanKeys.clear();
  }
}

// Singleton export
export const ProtocolEngine = new ProtocolEngineImpl();

export default ProtocolEngine;
