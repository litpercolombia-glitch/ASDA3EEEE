/**
 * ActionExecutor - PR #4
 *
 * Executes PLANNED actions from ActionLog.
 * Pipeline: PLANNED → RUNNING → SUCCESS/FAILED
 *
 * Features:
 * - Idempotency guard (no duplicate sends)
 * - Rate limiting (global, per-phone, per-day)
 * - Retry logic (5xx only)
 * - Privacy (no phone in logs)
 * - Pilot mode (city/carrier filters)
 */

import {
  ExecutionResult,
  BatchExecutionResult,
  ExecutionStatus,
  FailureReason,
  ExecutionQueueItem,
  PhoneLookup,
  buildExecutionKey,
} from '../../types/executor.types';
import { ProtocolTrigger } from '../../types/protocol.types';
import { ActionLogService, ActionLog } from '../eventLog/ActionLogService';
import { ChateaService } from './ChateaService';
import { RateLimiter } from './RateLimiter';
import { TemplateService } from './Templates';

// =====================================================
// ACTION EXECUTOR
// =====================================================

class ActionExecutorImpl {
  /** Phone lookup function (injected) */
  private phoneLookup: PhoneLookup | null = null;

  /** Retry queue */
  private retryQueue: Map<string, { item: ExecutionQueueItem; phone: string; attempts: number }> = new Map();

  /**
   * Set phone lookup function
   * This is how we get phones at runtime without storing them
   */
  setPhoneLookup(lookup: PhoneLookup): void {
    this.phoneLookup = lookup;
  }

  /**
   * Execute all PLANNED actions
   */
  async executePlanned(options?: {
    limit?: number;
    dryRun?: boolean;
  }): Promise<BatchExecutionResult> {
    const startedAt = new Date();
    const results: ExecutionResult[] = [];

    let success = 0;
    let failed = 0;
    let skippedDuplicate = 0;
    let skippedRateLimit = 0;
    let skippedDisabled = 0;
    let wouldSend = 0;

    // Get PLANNED actions
    const planned = ActionLogService.getPlannedActions();
    const limit = options?.limit || planned.length;
    const toProcess = planned.slice(0, limit);

    for (const action of toProcess) {
      const result = await this.executeAction(action, options?.dryRun);
      results.push(result);

      // Count by status
      switch (result.status) {
        case 'SUCCESS':
          success++;
          break;
        case 'FAILED':
          failed++;
          break;
        case 'SKIPPED_DUPLICATE':
          skippedDuplicate++;
          break;
        case 'SKIPPED_RATE_LIMIT':
          skippedRateLimit++;
          break;
        case 'SKIPPED_DISABLED':
          skippedDisabled++;
          break;
        case 'WOULD_SEND':
          wouldSend++;
          break;
      }

      // Check if we hit rate limit
      const stats = RateLimiter.getStats();
      if (stats.remainingToday === 0 || stats.remainingThisMinute === 0) {
        break;
      }
    }

    const completedAt = new Date();

    return {
      startedAt,
      completedAt,
      durationMs: completedAt.getTime() - startedAt.getTime(),
      total: toProcess.length,
      success,
      failed,
      skippedDuplicate,
      skippedRateLimit,
      skippedDisabled,
      wouldSend,
      results,
      rateLimitHit: RateLimiter.getStats().remainingToday === 0,
      remainingDailyLimit: RateLimiter.getStats().remainingToday,
    };
  }

  /**
   * Execute a single action
   */
  async executeAction(action: ActionLog, dryRun?: boolean): Promise<ExecutionResult> {
    const startedAt = new Date();
    const guia = action.guia;
    const trigger = action.metadata.trigger as ProtocolTrigger;

    // 1. Check if executor is enabled
    if (!ChateaService.isEnabled() && !dryRun) {
      return this.buildResult(action.id, guia, 'WOULD_SEND', startedAt, {
        skipReason: 'Executor disabled',
      });
    }

    // 2. Check pilot filters
    const city = action.metadata.city || '';
    const carrier = action.metadata.carrier || '';
    if (!ChateaService.matchesPilotFilter(city, carrier)) {
      return this.buildResult(action.id, guia, 'SKIPPED_DISABLED', startedAt, {
        skipReason: 'Not in pilot filter',
      });
    }

    // 3. Check idempotency (already sent today?)
    if (RateLimiter.wasExecutedToday(guia, trigger)) {
      return this.buildResult(action.id, guia, 'SKIPPED_DUPLICATE', startedAt, {
        skipReason: 'Already sent today',
      });
    }

    // 4. Get phone (runtime only)
    if (!this.phoneLookup) {
      return this.buildResult(action.id, guia, 'FAILED', startedAt, {
        failureReason: 'INVALID_PHONE',
        errorMessage: 'Phone lookup not configured',
      });
    }

    const phone = await this.phoneLookup(guia);
    if (!phone) {
      return this.buildResult(action.id, guia, 'FAILED', startedAt, {
        failureReason: 'INVALID_PHONE',
        errorMessage: 'Phone not found for guide',
      });
    }

    // 5. Get phoneHash for rate limiting (from ActionLog or generate)
    // Note: We don't log the actual phone
    const phoneHash = action.metadata.phoneHash || this.hashPhone(phone);

    // 6. Check rate limits
    const rateLimitCheck = RateLimiter.check(phoneHash, guia, trigger);
    if (!rateLimitCheck.allowed) {
      ActionLogService.markSkipped(action.id, `Rate limited: ${rateLimitCheck.reason}`);
      return this.buildResult(action.id, guia, 'SKIPPED_RATE_LIMIT', startedAt, {
        skipReason: `Rate limit: ${rateLimitCheck.reason}`,
      });
    }

    // 7. Mark as RUNNING
    ActionLogService.markRunning(action.id);

    // 8. Prepare template
    const templateName = TemplateService.getTemplateName(trigger);
    const templateInput = TemplateService.buildTemplateInput({
      guia,
      canonicalStatus: action.metadata.canonicalStatus as string,
      city,
      carrier,
      lastMovementText: action.metadata.lastMovementText as string,
    });
    const variables = TemplateService.renderVariables(trigger, templateInput);

    // 9. Execute (or dry run)
    if (dryRun) {
      RateLimiter.record(phoneHash, guia, trigger);
      RateLimiter.markExecuted(guia, trigger);
      return this.buildResult(action.id, guia, 'WOULD_SEND', startedAt, {
        skipReason: 'Dry run mode',
      });
    }

    // 10. Send via Chatea
    const response = await ChateaService.sendMessage(phone, templateName, variables);

    if (response.success) {
      // Record in rate limiter
      RateLimiter.record(phoneHash, guia, trigger);

      // Mark success in ActionLog
      ActionLogService.markSuccess(action.id, {
        providerMessageId: response.messageId,
        template: templateName,
      });

      return this.buildResult(action.id, guia, 'SUCCESS', startedAt, {
        providerMessageId: response.messageId,
      });
    }

    // Handle failure
    const failureReason = this.classifyError(response.errorCode);

    // Check if retryable
    if (ChateaService.isRetryableError(response.errorCode)) {
      const queueKey = buildExecutionKey('SEND_WHATSAPP', guia, trigger);
      const existing = this.retryQueue.get(queueKey);
      const attempts = existing ? existing.attempts + 1 : 1;

      if (attempts < ChateaService.getMaxRetries()) {
        // Queue for retry
        this.retryQueue.set(queueKey, {
          item: this.buildQueueItem(action, templateInput, phoneHash, city, carrier),
          phone,
          attempts,
        });

        // Schedule retry
        const delay = ChateaService.getRetryDelay(attempts);
        setTimeout(() => this.processRetry(queueKey), delay);

        return this.buildResult(action.id, guia, 'RUNNING', startedAt, {
          failureReason,
          errorMessage: `Queued for retry (attempt ${attempts})`,
          retryCount: attempts,
        });
      }

      // Max retries exceeded
      failureReason === 'MAX_RETRIES_EXCEEDED';
    }

    // Mark as failed
    ActionLogService.markFailed(action.id, response.error || 'Unknown error');

    return this.buildResult(action.id, guia, 'FAILED', startedAt, {
      failureReason,
      errorMessage: response.error,
    });
  }

  /**
   * Process retry from queue
   */
  private async processRetry(queueKey: string): Promise<void> {
    const entry = this.retryQueue.get(queueKey);
    if (!entry) return;

    const { item, phone, attempts } = entry;
    const trigger = item.trigger;
    const templateName = TemplateService.getTemplateName(trigger);
    const variables = TemplateService.renderVariables(trigger, item.templateInput);

    const response = await ChateaService.sendMessage(phone, templateName, variables);

    if (response.success) {
      RateLimiter.record(item.phoneHash, item.guia, trigger);
      ActionLogService.markSuccess(item.actionId, {
        providerMessageId: response.messageId,
        template: templateName,
        retryAttempts: attempts,
      });
      this.retryQueue.delete(queueKey);
      return;
    }

    // Check if more retries allowed
    if (ChateaService.isRetryableError(response.errorCode) && attempts < ChateaService.getMaxRetries()) {
      this.retryQueue.set(queueKey, { ...entry, attempts: attempts + 1 });
      const delay = ChateaService.getRetryDelay(attempts + 1);
      setTimeout(() => this.processRetry(queueKey), delay);
      return;
    }

    // Final failure
    ActionLogService.markFailed(item.actionId, response.error || 'Max retries exceeded');
    this.retryQueue.delete(queueKey);
  }

  /**
   * Build queue item from action
   */
  private buildQueueItem(
    action: ActionLog,
    templateInput: ReturnType<typeof TemplateService.buildTemplateInput>,
    phoneHash: string,
    city: string,
    carrier: string
  ): ExecutionQueueItem {
    return {
      actionId: action.id,
      actionType: action.actionType,
      guia: action.guia,
      trigger: action.metadata.trigger as ProtocolTrigger,
      templateInput,
      phoneHash,
      city,
      carrier,
    };
  }

  /**
   * Build execution result
   */
  private buildResult(
    actionId: string,
    guia: string,
    status: ExecutionStatus,
    startedAt: Date,
    details: Partial<ExecutionResult>
  ): ExecutionResult {
    const completedAt = new Date();
    return {
      actionId,
      guia,
      status,
      startedAt,
      completedAt,
      durationMs: completedAt.getTime() - startedAt.getTime(),
      ...details,
    };
  }

  /**
   * Classify error code to failure reason
   */
  private classifyError(errorCode?: number): FailureReason {
    if (!errorCode) return 'UNKNOWN';
    if (errorCode === 429) return 'RATE_LIMITED_BY_PROVIDER';
    if (errorCode >= 400 && errorCode < 500) return 'API_ERROR_4XX';
    if (errorCode >= 500 && errorCode < 600) return 'API_ERROR_5XX';
    return 'UNKNOWN';
  }

  /**
   * Simple phone hash for rate limiting
   * (Production should use same hash as EventLogService)
   */
  private hashPhone(phone: string): string {
    let hash = 0;
    for (let i = 0; i < phone.length; i++) {
      const char = phone.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(16, '0');
  }

  /**
   * Get current stats
   */
  getStats(): {
    rateLimiter: ReturnType<typeof RateLimiter.getStats>;
    retryQueueSize: number;
  } {
    return {
      rateLimiter: RateLimiter.getStats(),
      retryQueueSize: this.retryQueue.size,
    };
  }

  /**
   * Clear state (for testing)
   */
  clear(): void {
    this.retryQueue.clear();
    RateLimiter.clear();
  }
}

// Singleton export
export const ActionExecutor = new ActionExecutorImpl();

export default ActionExecutor;
