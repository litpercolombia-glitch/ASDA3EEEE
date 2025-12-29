/**
 * RateLimiter - Anti-spam protection
 *
 * Enforces rate limits to prevent spam and comply with WhatsApp policies.
 * Tracks:
 * - Global messages per minute
 * - Messages per phoneHash per day
 * - Total daily limit
 */

import {
  RateLimitConfig,
  RateLimitState,
  RateLimitCheck,
  buildPhoneRateLimitKey,
  buildExecutionKey,
  DEFAULT_EXECUTOR_CONFIG,
} from '../../types/executor.types';
import { ActionType } from '../../types/eventLog.types';
import { ProtocolTrigger } from '../../types/protocol.types';

// =====================================================
// RATE LIMITER
// =====================================================

class RateLimiterImpl {
  private config: RateLimitConfig;
  private state: RateLimitState;

  /** Track executed guia+trigger combinations */
  private executedKeys: Set<string> = new Set();

  constructor() {
    this.config = DEFAULT_EXECUTOR_CONFIG.rateLimits;
    this.state = this.initState();
  }

  /**
   * Initialize rate limit state
   */
  private initState(): RateLimitState {
    const now = new Date();
    return {
      currentMinuteCount: 0,
      currentMinuteStart: now,
      phoneHashToday: new Map(),
      totalToday: 0,
      todayDate: now.toISOString().split('T')[0],
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): RateLimitConfig {
    return { ...this.config };
  }

  /**
   * Reset daily counters if day changed
   */
  private checkDayRollover(): void {
    const today = new Date().toISOString().split('T')[0];
    if (today !== this.state.todayDate) {
      this.state.phoneHashToday.clear();
      this.state.totalToday = 0;
      this.state.todayDate = today;
      this.executedKeys.clear();
    }
  }

  /**
   * Reset minute window if minute changed
   */
  private checkMinuteRollover(): void {
    const now = new Date();
    const elapsed = now.getTime() - this.state.currentMinuteStart.getTime();

    if (elapsed >= 60000) { // 1 minute
      this.state.currentMinuteCount = 0;
      this.state.currentMinuteStart = now;
    }
  }

  /**
   * Check if sending is allowed
   */
  check(
    phoneHash: string,
    guia: string,
    trigger: ProtocolTrigger,
    actionType: ActionType = 'SEND_WHATSAPP'
  ): RateLimitCheck {
    this.checkDayRollover();
    this.checkMinuteRollover();

    // 1. Check daily limit
    if (this.state.totalToday >= this.config.dailySendLimit) {
      return {
        allowed: false,
        reason: 'DAILY_LIMIT',
        waitMs: this.msUntilMidnight(),
      };
    }

    // 2. Check per-minute global limit
    if (this.state.currentMinuteCount >= this.config.globalPerMinute) {
      return {
        allowed: false,
        reason: 'GLOBAL_LIMIT',
        waitMs: this.msUntilNextMinute(),
      };
    }

    // 3. Check per-phone limit
    const phoneCount = this.state.phoneHashToday.get(phoneHash) || 0;
    if (phoneCount >= this.config.perPhonePerDay) {
      return {
        allowed: false,
        reason: 'PHONE_LIMIT',
        waitMs: this.msUntilMidnight(),
      };
    }

    // 4. Check per-guia-trigger limit (always 1/day)
    const execKey = buildExecutionKey(actionType, guia, trigger);
    if (this.executedKeys.has(execKey)) {
      return {
        allowed: false,
        reason: 'GUIA_TRIGGER_LIMIT',
        waitMs: this.msUntilMidnight(),
      };
    }

    // All checks passed
    return { allowed: true };
  }

  /**
   * Record that a message was sent
   */
  record(
    phoneHash: string,
    guia: string,
    trigger: ProtocolTrigger,
    actionType: ActionType = 'SEND_WHATSAPP'
  ): void {
    this.checkDayRollover();
    this.checkMinuteRollover();

    // Increment counters
    this.state.currentMinuteCount++;
    this.state.totalToday++;

    // Increment phone counter
    const phoneCount = this.state.phoneHashToday.get(phoneHash) || 0;
    this.state.phoneHashToday.set(phoneHash, phoneCount + 1);

    // Record execution key
    const execKey = buildExecutionKey(actionType, guia, trigger);
    this.executedKeys.add(execKey);
  }

  /**
   * Check if a specific guia+trigger was already executed today
   */
  wasExecutedToday(
    guia: string,
    trigger: ProtocolTrigger,
    actionType: ActionType = 'SEND_WHATSAPP'
  ): boolean {
    this.checkDayRollover();
    const execKey = buildExecutionKey(actionType, guia, trigger);
    return this.executedKeys.has(execKey);
  }

  /**
   * Mark a guia+trigger as executed (for external sync)
   */
  markExecuted(
    guia: string,
    trigger: ProtocolTrigger,
    actionType: ActionType = 'SEND_WHATSAPP'
  ): void {
    this.checkDayRollover();
    const execKey = buildExecutionKey(actionType, guia, trigger);
    this.executedKeys.add(execKey);
  }

  /**
   * Get current stats
   */
  getStats(): {
    totalToday: number;
    remainingToday: number;
    currentMinuteCount: number;
    remainingThisMinute: number;
    uniquePhonesContactedToday: number;
  } {
    this.checkDayRollover();
    this.checkMinuteRollover();

    return {
      totalToday: this.state.totalToday,
      remainingToday: Math.max(0, this.config.dailySendLimit - this.state.totalToday),
      currentMinuteCount: this.state.currentMinuteCount,
      remainingThisMinute: Math.max(0, this.config.globalPerMinute - this.state.currentMinuteCount),
      uniquePhonesContactedToday: this.state.phoneHashToday.size,
    };
  }

  /**
   * Milliseconds until midnight
   */
  private msUntilMidnight(): number {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return midnight.getTime() - now.getTime();
  }

  /**
   * Milliseconds until next minute
   */
  private msUntilNextMinute(): number {
    const now = new Date();
    const elapsed = now.getTime() - this.state.currentMinuteStart.getTime();
    return Math.max(0, 60000 - elapsed);
  }

  /**
   * Clear all state (for testing)
   */
  clear(): void {
    this.state = this.initState();
    this.executedKeys.clear();
  }

  /**
   * Sync executed keys from ActionLog (for recovery)
   */
  syncFromActionLog(executedKeys: string[]): void {
    for (const key of executedKeys) {
      this.executedKeys.add(key);
    }
  }
}

// Singleton export
export const RateLimiter = new RateLimiterImpl();

export default RateLimiter;
