/**
 * Executor Module - PR #4
 *
 * Executes PLANNED actions from ActionLog.
 * Sends WhatsApp messages via Chatea API.
 */

export { ActionExecutor } from './ActionExecutor';
export { ChateaService, MockChateaService } from './ChateaService';
export { RateLimiter } from './RateLimiter';
export { TemplateService, TEMPLATE_NO_MOVEMENT_48H, TEMPLATE_AT_OFFICE_3D } from './Templates';
export { ExecutorRunLog } from './ExecutorRunLog';
export { PIIVault, createPhoneLookup, hashPhone, normalizePhone } from './PIIVault';

// Re-export types
export type {
  ExecutionResult,
  BatchExecutionResult,
  ExecutionStatus,
  FailureReason,
  ExecutionQueueItem,
  PhoneLookup,
  RateLimitConfig,
  RateLimitCheck,
  ExecutorConfig,
  ChateaSendRequest,
  ChateaResponse,
  WhatsAppTemplate,
  TemplateInput,
} from '../../types/executor.types';

export type {
  ExecutorRunSummary,
  ExecutorRunLogEntry,
} from './ExecutorRunLog';

export {
  buildExecutionKey,
  buildPhoneRateLimitKey,
  DEFAULT_EXECUTOR_CONFIG,
} from '../../types/executor.types';
