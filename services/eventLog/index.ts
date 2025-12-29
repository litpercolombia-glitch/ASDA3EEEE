/**
 * EventLog Module - PR #2
 *
 * Provides:
 * - EventLogService: Event ingestion and deduplication
 * - ExcelDropiParser: Parse Dropi Excel reports
 * - ActionLogService: Track actions for automation
 */

export { EventLogService } from './EventLogService';
export {
  sha256,
  normalizePhone,
  generatePhoneHash,
  buildHashPayload,
  generatePayloadHash,
  buildEventKey,
  parseDropiDate,
} from './EventLogService';

export {
  parseExcelData,
  processExcelDropi,
  validateExcelStructure,
  COLUMN_MAPPINGS,
  REQUIRED_COLUMNS,
} from './ExcelDropiParser';

export { ActionLogService } from './ActionLogService';

// Re-export types
export type {
  EventLog,
  EventSource,
  EventProcessingStatus,
  DropiRawData,
  EventLogProcessResult,
  ActionLog,
  ActionType,
  ActionStatus,
  GuideState,
  BatchProcessResult,
} from '../../types/eventLog.types';
