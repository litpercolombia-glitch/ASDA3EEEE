/**
 * ActionExecutor Types - PR #4
 *
 * Types for WhatsApp execution via Chatea API.
 * Executes PLANNED actions, does NOT decide them.
 */

import { ActionType, ActionStatus } from './eventLog.types';
import { ProtocolTrigger } from './protocol.types';
import { CanonicalStatus } from './canonical.types';

// =====================================================
// EXECUTION STATUS
// =====================================================

/**
 * Extended execution status
 */
export type ExecutionStatus =
  | 'PLANNED'
  | 'RUNNING'
  | 'SUCCESS'
  | 'FAILED'
  | 'SKIPPED_DUPLICATE'
  | 'SKIPPED_RATE_LIMIT'
  | 'SKIPPED_DISABLED'
  | 'WOULD_SEND';  // When EXECUTOR_ENABLED=false

/**
 * Failure reason for FAILED status
 */
export type FailureReason =
  | 'API_ERROR_4XX'
  | 'API_ERROR_5XX'
  | 'TIMEOUT'
  | 'RATE_LIMITED_BY_PROVIDER'
  | 'INVALID_PHONE'
  | 'TEMPLATE_ERROR'
  | 'MAX_RETRIES_EXCEEDED'
  | 'UNKNOWN';

// =====================================================
// CHATEA API
// =====================================================

/**
 * Chatea API request payload
 */
export interface ChateaSendRequest {
  phone: string;              // Phone number with country code
  template: string;           // Template name
  variables: Record<string, string>;  // Template variables
}

/**
 * Chatea API response
 */
export interface ChateaResponse {
  success: boolean;
  messageId?: string;         // Provider message ID
  error?: string;
  errorCode?: number;         // HTTP status code
}

// =====================================================
// EXECUTION RESULT
// =====================================================

/**
 * Result of executing a single action
 */
export interface ExecutionResult {
  actionId: string;
  guia: string;
  status: ExecutionStatus;

  // Success fields
  providerMessageId?: string;
  sentAt?: Date;

  // Failure fields
  failureReason?: FailureReason;
  errorMessage?: string;
  retryCount?: number;

  // Skip fields
  skipReason?: string;

  // Timing
  startedAt: Date;
  completedAt: Date;
  durationMs: number;
}

/**
 * Result of batch execution
 */
export interface BatchExecutionResult {
  startedAt: Date;
  completedAt: Date;
  durationMs: number;

  // Counts
  total: number;
  success: number;
  failed: number;
  skippedDuplicate: number;
  skippedRateLimit: number;
  skippedDisabled: number;
  wouldSend: number;

  // Details
  results: ExecutionResult[];

  // Rate limit status
  rateLimitHit: boolean;
  remainingDailyLimit: number;
}

// =====================================================
// RATE LIMITING
// =====================================================

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Global messages per minute */
  globalPerMinute: number;

  /** Max messages per phoneHash per day */
  perPhonePerDay: number;

  /** Max messages per guia per trigger per day (always 1) */
  perGuiaPerTriggerPerDay: 1;

  /** Daily send limit (safety cap) */
  dailySendLimit: number;
}

/**
 * Rate limit state (in-memory tracking)
 */
export interface RateLimitState {
  /** Messages sent in current minute window */
  currentMinuteCount: number;
  currentMinuteStart: Date;

  /** Messages sent today by phoneHash */
  phoneHashToday: Map<string, number>;

  /** Total messages sent today */
  totalToday: number;
  todayDate: string; // YYYY-MM-DD
}

/**
 * Rate limit check result
 */
export interface RateLimitCheck {
  allowed: boolean;
  reason?: 'GLOBAL_LIMIT' | 'PHONE_LIMIT' | 'DAILY_LIMIT' | 'GUIA_TRIGGER_LIMIT';
  waitMs?: number;  // How long to wait before retry
}

// =====================================================
// TEMPLATES
// =====================================================

/**
 * WhatsApp template definition
 */
export interface WhatsAppTemplate {
  id: string;
  name: string;
  trigger: ProtocolTrigger;

  /**
   * Variables that will be filled from action metadata.
   * Only logistics fields allowed.
   */
  variables: string[];

  /** Template body (for documentation, actual template in Chatea) */
  body: string;
}

/**
 * Template render input
 */
export interface TemplateInput {
  numero_de_guia: string;
  estatus: string;
  ciudad_de_destino: string;
  transportadora: string;
  fecha_de_ultimo_movimiento: string;
  ultimo_movimiento: string;
}

// =====================================================
// CONFIGURATION
// =====================================================

/**
 * Executor configuration from environment
 */
export interface ExecutorConfig {
  /** Master switch - if false, marks as WOULD_SEND */
  enabled: boolean;

  /** Pilot filters (if set, only execute for matching) */
  pilotCity?: string;
  pilotCarrier?: string;

  /** Rate limits */
  rateLimits: RateLimitConfig;

  /** Retry config */
  maxRetries: number;
  retryDelaysMs: number[];  // e.g., [60000, 300000, 900000] = 1m, 5m, 15m

  /** Chatea API config */
  chateaApiUrl: string;
  chateaApiKey: string;
}

/**
 * Default configuration
 */
export const DEFAULT_EXECUTOR_CONFIG: ExecutorConfig = {
  enabled: false,  // SAFE DEFAULT
  pilotCity: undefined,
  pilotCarrier: undefined,
  rateLimits: {
    globalPerMinute: 20,
    perPhonePerDay: 2,
    perGuiaPerTriggerPerDay: 1,
    dailySendLimit: 100,
  },
  maxRetries: 3,
  retryDelaysMs: [60000, 300000, 900000], // 1m, 5m, 15m
  chateaApiUrl: '',
  chateaApiKey: '',
};

// =====================================================
// ACTION QUEUE ITEM
// =====================================================

/**
 * Item queued for execution
 * Contains only what's needed, no PII in logs
 */
export interface ExecutionQueueItem {
  actionId: string;
  actionType: ActionType;
  guia: string;
  trigger: ProtocolTrigger;

  // For template rendering (no PII)
  templateInput: TemplateInput;

  // For rate limiting (hashed)
  phoneHash: string;

  // For pilot filtering
  city: string;
  carrier: string;

  // The actual phone (runtime only, NEVER logged)
  // This is passed separately and cleared after use
}

/**
 * Phone lookup function type
 * Retrieves phone for a guia at execution time
 * Phone is NEVER stored in executor logs
 */
export type PhoneLookup = (guia: string) => Promise<string | null>;

// =====================================================
// IDEMPOTENCY
// =====================================================

/**
 * Build execution idempotency key
 * Format: exec:{actionType}:{guia}:{trigger}:{YYYY-MM-DD}
 */
export function buildExecutionKey(
  actionType: ActionType,
  guia: string,
  trigger: ProtocolTrigger,
  date: Date = new Date()
): string {
  const day = date.toISOString().split('T')[0];
  return `exec:${actionType}:${guia}:${trigger}:${day}`;
}

/**
 * Build phone rate limit key
 * Format: phone:{phoneHash}:{YYYY-MM-DD}
 */
export function buildPhoneRateLimitKey(
  phoneHash: string,
  date: Date = new Date()
): string {
  const day = date.toISOString().split('T')[0];
  return `phone:${phoneHash}:${day}`;
}
