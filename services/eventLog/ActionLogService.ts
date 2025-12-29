/**
 * ActionLogService - PR #2
 *
 * Track all actions taken on shipments.
 * Prepared for future automation (WhatsApp, tickets, etc.)
 *
 * IMPORTANT: This PR does NOT execute actions yet.
 * It only prepares the logging infrastructure.
 */

import {
  ActionLog,
  ActionType,
  ActionStatus,
} from '../../types/eventLog.types';
import { CanonicalStatus } from '../../types/canonical.types';

// =====================================================
// ACTION LOG SERVICE
// =====================================================

class ActionLogServiceImpl {
  // In-memory storage (replace with actual DB in production)
  private actions: Map<string, ActionLog> = new Map();
  private idempotencyKeys: Set<string> = new Set();

  /**
   * Generate unique action ID
   */
  private generateId(): string {
    return `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Build idempotency key for an action
   * Format: action:{type}:{guia}:{trigger}:{date}
   */
  buildIdempotencyKey(
    actionType: ActionType,
    guia: string,
    trigger: string,
    date?: Date
  ): string {
    const dateStr = (date || new Date()).toISOString().split('T')[0]; // YYYY-MM-DD
    return `action:${actionType}:${guia}:${trigger}:${dateStr}`;
  }

  /**
   * Check if an action with this idempotency key already exists
   */
  hasAction(idempotencyKey: string): boolean {
    return this.idempotencyKeys.has(idempotencyKey);
  }

  /**
   * Plan an action (create with PLANNED status)
   * Does NOT execute the action - just records it
   */
  planAction(params: {
    actionType: ActionType;
    guia: string;
    actor?: 'system' | 'user' | 'protocol_engine';
    reason?: string;
    city?: string;
    carrier?: string;
    trigger?: 'webhook' | 'excel_import' | 'manual' | 'scheduled' | 'protocol';
    eventLogId?: string;
    canonicalStatus?: CanonicalStatus;
    metadata?: Record<string, unknown>;
  }): ActionLog | null {
    const {
      actionType,
      guia,
      actor = 'system',
      reason,
      city,
      carrier,
      trigger = 'manual',
      eventLogId,
      canonicalStatus,
      metadata = {},
    } = params;

    // Build idempotency key
    const idempotencyKey = this.buildIdempotencyKey(actionType, guia, trigger);

    // Check for duplicates
    if (this.idempotencyKeys.has(idempotencyKey)) {
      // Log as skipped duplicate
      const skipped: ActionLog = {
        id: this.generateId(),
        actionType,
        guia,
        idempotencyKey,
        status: 'SKIPPED_DUPLICATE',
        actor,
        createdAt: new Date(),
        metadata: {
          reason,
          city,
          carrier,
          trigger,
          eventLogId,
          canonicalStatus,
          ...metadata,
          originalKey: idempotencyKey,
        },
      };
      this.actions.set(skipped.id, skipped);
      return skipped;
    }

    // Create new planned action
    const action: ActionLog = {
      id: this.generateId(),
      actionType,
      guia,
      idempotencyKey,
      status: 'PLANNED',
      actor,
      createdAt: new Date(),
      metadata: {
        reason,
        city,
        carrier,
        trigger,
        eventLogId,
        canonicalStatus,
        ...metadata,
      },
    };

    // Store
    this.actions.set(action.id, action);
    this.idempotencyKeys.add(idempotencyKey);

    return action;
  }

  /**
   * Mark an action as executed successfully
   */
  markSuccess(actionId: string, result?: Record<string, unknown>): ActionLog | null {
    const action = this.actions.get(actionId);
    if (!action) return null;

    action.status = 'SUCCESS';
    action.executedAt = new Date();
    if (result) {
      action.metadata = { ...action.metadata, result };
    }

    return action;
  }

  /**
   * Mark an action as failed
   */
  markFailed(actionId: string, error: string): ActionLog | null {
    const action = this.actions.get(actionId);
    if (!action) return null;

    action.status = 'FAILED';
    action.executedAt = new Date();
    action.errorDetails = error;
    action.retryCount = (action.retryCount || 0) + 1;

    return action;
  }

  /**
   * Get action by ID
   */
  getAction(id: string): ActionLog | null {
    return this.actions.get(id) || null;
  }

  /**
   * Get all actions for a guide
   */
  getActionsForGuide(guia: string): ActionLog[] {
    return Array.from(this.actions.values())
      .filter(a => a.guia === guia)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  /**
   * Get planned actions (ready for execution)
   */
  getPlannedActions(): ActionLog[] {
    return Array.from(this.actions.values())
      .filter(a => a.status === 'PLANNED')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  /**
   * Get all actions
   */
  getAllActions(): ActionLog[] {
    return Array.from(this.actions.values());
  }

  /**
   * Get statistics
   */
  getStats(): {
    total: number;
    byStatus: Record<ActionStatus, number>;
    byType: Record<ActionType, number>;
    duplicatesSkipped: number;
  } {
    const actions = Array.from(this.actions.values());

    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    let duplicatesSkipped = 0;

    for (const action of actions) {
      byStatus[action.status] = (byStatus[action.status] || 0) + 1;
      byType[action.actionType] = (byType[action.actionType] || 0) + 1;
      if (action.status === 'SKIPPED_DUPLICATE') duplicatesSkipped++;
    }

    return {
      total: actions.length,
      byStatus: byStatus as Record<ActionStatus, number>,
      byType: byType as Record<ActionType, number>,
      duplicatesSkipped,
    };
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.actions.clear();
    this.idempotencyKeys.clear();
  }
}

// Singleton export
export const ActionLogService = new ActionLogServiceImpl();
export default ActionLogService;
