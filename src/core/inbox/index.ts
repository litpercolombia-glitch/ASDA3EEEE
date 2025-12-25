// /src/core/inbox/index.ts
// Exportaciones del módulo inbox

export type {
  EventSource,
  EventType,
  CustomerInfo,
  OrderItem,
  EventData,
  InboxEvent,
  DispatchResult,
  OrderUpsert,
  StatusHistoryEntry,
  WebhookConfig,
} from './types';

export { normalizeChateaEvent, normalizeShopifyEvent } from './normalize';
export { dedupeSeenOrMark, hasBeenSeen, removeDedupe, getDedupeStats, clearDedupeStore } from './dedupeStore';
export { dispatchInboxEvent, dispatchBatch } from './dispatcher';
export * from './handlers';
