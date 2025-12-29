/**
 * PIIVault - Secure phone storage for executor
 *
 * CRITICAL: This vault stores phones in memory ONLY during execution.
 * - Phones are indexed by phoneHash (SHA256)
 * - NEVER logged, NEVER persisted to disk
 * - Cleared after each execution batch
 * - Only accessible server-side
 *
 * Usage:
 * 1. During Excel/webhook ingestion, call vault.store(phone)
 * 2. During execution, call vault.lookup(phoneHash)
 * 3. After batch, call vault.clear()
 */

// =====================================================
// TYPES
// =====================================================

interface VaultEntry {
  phoneHash: string;
  phone: string; // Encrypted or plain (runtime only)
  storedAt: Date;
  expiresAt: Date;
}

// =====================================================
// HASHING (same as EventLogService)
// =====================================================

/**
 * Normalize phone for hashing
 */
function normalizePhone(phone: string): string {
  if (!phone) return '';

  let normalized = phone.replace(/[^\d+]/g, '');

  if (!normalized.startsWith('+')) {
    if (normalized.startsWith('0')) {
      normalized = normalized.substring(1);
    }
    if (!normalized.startsWith('57')) {
      normalized = '57' + normalized;
    }
    normalized = '+' + normalized;
  }

  return normalized;
}

/**
 * Generate phone hash (deterministic)
 */
async function hashPhone(phone: string): Promise<string> {
  const normalized = normalizePhone(phone);
  if (!normalized) return 'no_phone';

  // Use Web Crypto API if available (browser/modern Node)
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(normalized);
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback: simple hash for Node.js without crypto.subtle
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

// =====================================================
// PII VAULT
// =====================================================

class PIIVaultImpl {
  private entries: Map<string, VaultEntry> = new Map();
  private ttlMs: number = 30 * 60 * 1000; // 30 minutes default TTL

  /**
   * Store a phone and return its hash
   * Phone is stored temporarily for execution lookup
   */
  async store(phone: string): Promise<string> {
    if (!phone) return 'no_phone';

    const normalized = normalizePhone(phone);
    const phoneHash = await hashPhone(phone);

    const entry: VaultEntry = {
      phoneHash,
      phone: normalized,
      storedAt: new Date(),
      expiresAt: new Date(Date.now() + this.ttlMs),
    };

    this.entries.set(phoneHash, entry);

    // Auto-cleanup expired entries
    this.cleanupExpired();

    return phoneHash;
  }

  /**
   * Store multiple phones (batch)
   */
  async storeBatch(phones: string[]): Promise<Map<string, string>> {
    const results = new Map<string, string>();

    for (const phone of phones) {
      const hash = await this.store(phone);
      results.set(phone, hash);
    }

    return results;
  }

  /**
   * Lookup phone by hash
   * Returns phone ONLY if not expired
   * NEVER log the returned value
   */
  lookup(phoneHash: string): string | null {
    const entry = this.entries.get(phoneHash);

    if (!entry) {
      return null;
    }

    // Check expiration
    if (new Date() > entry.expiresAt) {
      this.entries.delete(phoneHash);
      return null;
    }

    return entry.phone;
  }

  /**
   * Check if a phone hash exists
   */
  has(phoneHash: string): boolean {
    return this.entries.has(phoneHash) && this.lookup(phoneHash) !== null;
  }

  /**
   * Get count of stored entries
   */
  size(): number {
    this.cleanupExpired();
    return this.entries.size;
  }

  /**
   * Clear all entries
   * MUST be called after each execution batch
   */
  clear(): void {
    this.entries.clear();
  }

  /**
   * Remove expired entries
   */
  private cleanupExpired(): void {
    const now = new Date();
    for (const [hash, entry] of this.entries) {
      if (now > entry.expiresAt) {
        this.entries.delete(hash);
      }
    }
  }

  /**
   * Set TTL for entries
   */
  setTTL(ms: number): void {
    this.ttlMs = ms;
  }

  /**
   * Get stats (no PII exposed)
   */
  getStats(): {
    entryCount: number;
    oldestEntryAge: number | null;
    ttlMs: number;
  } {
    this.cleanupExpired();

    let oldestAge: number | null = null;
    const now = Date.now();

    for (const entry of this.entries.values()) {
      const age = now - entry.storedAt.getTime();
      if (oldestAge === null || age > oldestAge) {
        oldestAge = age;
      }
    }

    return {
      entryCount: this.entries.size,
      oldestEntryAge: oldestAge,
      ttlMs: this.ttlMs,
    };
  }
}

// =====================================================
// PHONE LOOKUP FUNCTION FOR EXECUTOR
// =====================================================

/**
 * Create phone lookup function for ActionExecutor
 * Uses PIIVault for secure phone retrieval
 */
export function createPhoneLookup(): (guia: string) => Promise<string | null> {
  // This lookup function uses the vault
  // The guia-to-phoneHash mapping comes from EventLog
  return async (guia: string): Promise<string | null> => {
    // Import here to avoid circular dependency
    const { EventLogService } = await import('../eventLog/EventLogService');

    // Get guide state to find phoneHash
    const state = EventLogService.getGuideState(guia);
    if (!state) {
      return null;
    }

    // Get last event to find phoneHash
    const lastEvent = EventLogService.getEvent(state.lastEventId);
    if (!lastEvent || !lastEvent.phoneHash) {
      return null;
    }

    // Lookup phone from vault
    return PIIVault.lookup(lastEvent.phoneHash);
  };
}

// Singleton export
export const PIIVault = new PIIVaultImpl();

// Export utilities
export { hashPhone, normalizePhone };

export default PIIVault;
