/**
 * EventLogService - PR #2
 *
 * Core service for event ingestion, deduplication, and state management.
 * Implements idempotency guard and temporal ordering.
 */

import {
  EventLog,
  EventSource,
  EventProcessingStatus,
  DropiRawData,
  EventLogProcessResult,
  GuideState,
  BatchProcessResult,
} from '../../types/eventLog.types';
import { StatusNormalizer, detectCarrier } from '../StatusNormalizer';
import { CanonicalStatus, ExceptionReason } from '../../types/canonical.types';

// =====================================================
// HASH UTILITIES
// =====================================================

/**
 * Generate SHA256 hash (browser-compatible)
 * Falls back to simple hash if crypto not available
 */
async function sha256(message: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback for Node.js or environments without crypto.subtle
  // Simple deterministic hash for testing
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    const char = message.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

/**
 * Normalize phone number for consistent hashing
 * Removes spaces, dashes, and ensures consistent format
 */
function normalizePhone(phone: string): string {
  if (!phone) return '';

  // Remove all non-digit characters except + at start
  let normalized = phone.replace(/[^\d+]/g, '');

  // If starts with +, keep it; otherwise add Colombian code
  if (!normalized.startsWith('+')) {
    // Remove leading 0 if present
    if (normalized.startsWith('0')) {
      normalized = normalized.substring(1);
    }
    // Add Colombian country code if not present
    if (!normalized.startsWith('57')) {
      normalized = '57' + normalized;
    }
    normalized = '+' + normalized;
  }

  return normalized;
}

/**
 * Generate phone hash (privacy-preserving)
 */
async function generatePhoneHash(phone: string): Promise<string> {
  const normalized = normalizePhone(phone);
  if (!normalized) return 'no_phone';
  return sha256(normalized);
}

/**
 * Build payload for hashing (excludes PII)
 * Used for deduplication
 */
function buildHashPayload(data: DropiRawData): string {
  const payload = {
    guia: data.numero_de_guia,
    estatus: data.estatus,
    novedad: data.novedad || '',
    ciudad: data.ciudad_de_destino,
    transportadora: data.transportadora,
    ultimo_movimiento: data.ultimo_movimiento || '',
    fecha_de_ultimo_movimiento: data.fecha_de_ultimo_movimiento || '',
    fecha_de_generacion_de_guia: data.fecha_de_generacion_de_guia || '',
  };

  // Deterministic JSON stringification
  return JSON.stringify(payload, Object.keys(payload).sort());
}

/**
 * Generate payload hash for deduplication
 */
async function generatePayloadHash(data: DropiRawData): Promise<string> {
  const payload = buildHashPayload(data);
  return sha256(payload);
}

/**
 * Build idempotency/event key
 * Format: event:{source}:{guia}:{payloadHash}
 */
function buildEventKey(source: EventSource, guia: string, payloadHash: string): string {
  return `event:${source}:${guia}:${payloadHash}`;
}

// =====================================================
// DATE PARSING
// =====================================================

/**
 * Parse date from various Dropi formats
 */
function parseDropiDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;

  const str = dateStr.trim();

  // Try ISO format first
  const isoDate = new Date(str);
  if (!isNaN(isoDate.getTime())) return isoDate;

  // Try DD/MM/YYYY or DD-MM-YYYY format
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (dmyMatch) {
    const [, day, month, year, hours, minutes] = dmyMatch;
    return new Date(
      parseInt(year, 10),
      parseInt(month, 10) - 1,
      parseInt(day, 10),
      parseInt(hours || '0', 10),
      parseInt(minutes || '0', 10)
    );
  }

  // Try YYYY-MM-DD format
  const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (ymdMatch) {
    const [, year, month, day, hours, minutes] = ymdMatch;
    return new Date(
      parseInt(year, 10),
      parseInt(month, 10) - 1,
      parseInt(day, 10),
      parseInt(hours || '0', 10),
      parseInt(minutes || '0', 10)
    );
  }

  return null;
}

// =====================================================
// EVENTLOG SERVICE
// =====================================================

class EventLogServiceImpl {
  // In-memory storage (replace with actual DB in production)
  private events: Map<string, EventLog> = new Map();
  private eventKeys: Set<string> = new Set();
  private guideStates: Map<string, GuideState> = new Map();

  /**
   * Generate unique event ID
   */
  private generateId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Process a single Dropi data row into an EventLog
   */
  async processDropiData(
    data: DropiRawData,
    source: EventSource
  ): Promise<EventLogProcessResult> {
    const now = new Date();

    // Generate hashes
    const [payloadHash, phoneHash] = await Promise.all([
      generatePayloadHash(data),
      generatePhoneHash(data.telefono),
    ]);

    // Build idempotency key
    const idempotencyKey = buildEventKey(source, data.numero_de_guia, payloadHash);

    // Check for duplicates
    if (this.eventKeys.has(idempotencyKey)) {
      return {
        eventLog: null,
        isDuplicate: true,
        isOutOfOrder: false,
        idempotencyKey,
      };
    }

    // Normalize status using StatusNormalizer
    const carrierCode = detectCarrier(data.transportadora);
    const normalized = StatusNormalizer.normalize(data.estatus, carrierCode, {
      source: source === 'dropi_webhook' ? 'webhook' : 'excel',
    });

    // Parse dates
    const occurredAt = parseDropiDate(data.fecha_de_ultimo_movimiento)
      || parseDropiDate(data.fecha)
      || now;

    const guideCreatedAt = parseDropiDate(data.fecha_de_generacion_de_guia);

    // Check for out-of-order event
    const guideState = this.guideStates.get(data.numero_de_guia);
    const isOutOfOrder = guideState
      ? occurredAt < guideState.lastEventAt
      : false;

    // Create EventLog entry
    const eventLog: EventLog = {
      id: this.generateId(),
      guia: data.numero_de_guia,
      source,
      canonicalStatus: normalized.status,
      exceptionReason: normalized.reason !== ExceptionReason.NONE ? normalized.reason : undefined,
      rawStatus: data.estatus,
      novelty: data.novedad || null,
      city: data.ciudad_de_destino,
      carrier: data.transportadora,
      lastMovementText: data.ultimo_movimiento || '',
      occurredAt,
      guideCreatedAt,
      receivedAt: now,
      payloadHash,
      phoneHash,
      isOutOfOrder,
      processingStatus: isOutOfOrder ? 'OUT_OF_ORDER' : 'PROCESSED',
    };

    // Store event
    this.events.set(eventLog.id, eventLog);
    this.eventKeys.add(idempotencyKey);

    // Update guide state (only if not out of order)
    if (!isOutOfOrder) {
      this.updateGuideState(eventLog);
    }

    return {
      eventLog,
      isDuplicate: false,
      isOutOfOrder,
      idempotencyKey,
    };
  }

  /**
   * Update the consolidated state of a guide
   */
  private updateGuideState(event: EventLog): void {
    const existing = this.guideStates.get(event.guia);

    if (!existing) {
      // First event for this guide
      this.guideStates.set(event.guia, {
        guia: event.guia,
        currentStatus: event.canonicalStatus,
        currentReason: event.exceptionReason,
        lastEventAt: event.occurredAt,
        lastEventId: event.id,
        eventCount: 1,
        duplicateCount: 0,
        outOfOrderCount: 0,
        firstSeenAt: event.receivedAt,
        updatedAt: event.receivedAt,
      });
    } else {
      // Update existing state only if this event is newer
      if (event.occurredAt >= existing.lastEventAt) {
        existing.currentStatus = event.canonicalStatus;
        existing.currentReason = event.exceptionReason;
        existing.lastEventAt = event.occurredAt;
        existing.lastEventId = event.id;
      }
      existing.eventCount++;
      if (event.isOutOfOrder) {
        existing.outOfOrderCount++;
      }
      existing.updatedAt = event.receivedAt;
    }
  }

  /**
   * Mark an event as duplicate (increment counter)
   */
  incrementDuplicateCount(guia: string): void {
    const state = this.guideStates.get(guia);
    if (state) {
      state.duplicateCount++;
    }
  }

  /**
   * Get all events for a guide (for auditing)
   */
  getEventsForGuide(guia: string): EventLog[] {
    return Array.from(this.events.values())
      .filter(e => e.guia === guia)
      .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
  }

  /**
   * Get guide state
   */
  getGuideState(guia: string): GuideState | null {
    return this.guideStates.get(guia) || null;
  }

  /**
   * Get all guide states
   */
  getAllGuideStates(): GuideState[] {
    return Array.from(this.guideStates.values());
  }

  /**
   * Check if an event key already exists (idempotency check)
   */
  hasEventKey(key: string): boolean {
    return this.eventKeys.has(key);
  }

  /**
   * Get event by ID
   */
  getEvent(id: string): EventLog | null {
    return this.events.get(id) || null;
  }

  /**
   * Get all events
   */
  getAllEvents(): EventLog[] {
    return Array.from(this.events.values());
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalEvents: number;
    totalGuides: number;
    byStatus: Record<CanonicalStatus, number>;
    bySource: Record<EventSource, number>;
    duplicatesBlocked: number;
    outOfOrderEvents: number;
  } {
    const events = Array.from(this.events.values());
    const guides = Array.from(this.guideStates.values());

    const byStatus: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    let duplicatesBlocked = 0;
    let outOfOrderEvents = 0;

    for (const event of events) {
      byStatus[event.canonicalStatus] = (byStatus[event.canonicalStatus] || 0) + 1;
      bySource[event.source] = (bySource[event.source] || 0) + 1;
      if (event.isOutOfOrder) outOfOrderEvents++;
    }

    for (const guide of guides) {
      duplicatesBlocked += guide.duplicateCount;
    }

    return {
      totalEvents: events.length,
      totalGuides: guides.length,
      byStatus: byStatus as Record<CanonicalStatus, number>,
      bySource: bySource as Record<EventSource, number>,
      duplicatesBlocked,
      outOfOrderEvents,
    };
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.events.clear();
    this.eventKeys.clear();
    this.guideStates.clear();
  }
}

// Singleton export
export const EventLogService = new EventLogServiceImpl();

// Export utilities for testing
export {
  sha256,
  normalizePhone,
  generatePhoneHash,
  buildHashPayload,
  generatePayloadHash,
  buildEventKey,
  parseDropiDate,
};

export default EventLogService;
