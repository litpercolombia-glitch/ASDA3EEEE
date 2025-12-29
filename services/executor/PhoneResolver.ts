/**
 * PhoneResolver - JIT Phone Resolution for Serverless
 *
 * CRITICAL: This resolves phones just-in-time from the source database.
 * - Does NOT store phones in memory (serverless-safe)
 * - Fetches from Supabase/source at execution time
 * - NEVER logs the actual phone number
 *
 * Flow:
 * 1. ActionExecutor needs phone for a guia
 * 2. PhoneResolver.resolve(guia) → fetches from DB
 * 3. Phone is used for Chatea API call
 * 4. Phone goes out of scope (never stored)
 */

// =====================================================
// TYPES
// =====================================================

export interface PhoneSource {
  name: string;
  resolve: (guia: string) => Promise<string | null>;
}

export interface PhoneResolveResult {
  phone: string | null;
  source: string;
  cached: boolean;
}

// =====================================================
// PHONE RESOLVER
// =====================================================

class PhoneResolverImpl {
  private sources: PhoneSource[] = [];

  /**
   * Register a phone source
   * Sources are tried in order until one returns a phone
   */
  registerSource(source: PhoneSource): void {
    this.sources.push(source);
  }

  /**
   * Clear all sources (for testing)
   */
  clearSources(): void {
    this.sources = [];
  }

  /**
   * Resolve phone for a guia
   * Tries each source in order until one returns a phone
   *
   * @param guia - The tracking number
   * @returns Phone number (NEVER log this value)
   */
  async resolve(guia: string): Promise<PhoneResolveResult> {
    for (const source of this.sources) {
      try {
        const phone = await source.resolve(guia);
        if (phone) {
          // Normalize phone
          const normalized = this.normalizePhone(phone);
          return {
            phone: normalized,
            source: source.name,
            cached: false, // JIT resolution, never cached
          };
        }
      } catch (error) {
        // Log error without exposing potential PII
        console.error(`[PhoneResolver] Source ${source.name} failed for guia ${guia}`);
      }
    }

    return {
      phone: null,
      source: 'none',
      cached: false,
    };
  }

  /**
   * Normalize phone number
   */
  private normalizePhone(phone: string): string {
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
   * Check if any sources are registered
   */
  hasSources(): boolean {
    return this.sources.length > 0;
  }
}

// =====================================================
// SUPABASE SOURCE
// =====================================================

/**
 * Create a Supabase-based phone source
 * Fetches phone from the guias table
 */
export function createSupabasePhoneSource(): PhoneSource {
  return {
    name: 'supabase_guias',
    async resolve(guia: string): Promise<string | null> {
      try {
        // Dynamic import to avoid issues in environments without Supabase
        const { guiasService } = await import('../supabaseService');

        // Find guia by tracking number
        const guias = await guiasService.getAll(1000);
        const found = guias.find(g => g.numero_guia === guia);

        if (found && found.telefono) {
          // Return phone (caller must NOT log this)
          return found.telefono;
        }

        return null;
      } catch (error) {
        console.error('[PhoneResolver] Supabase lookup failed');
        return null;
      }
    },
  };
}

/**
 * Create an in-memory phone source for testing
 * Maps guia -> phone
 */
export function createMockPhoneSource(phones: Record<string, string>): PhoneSource {
  return {
    name: 'mock',
    async resolve(guia: string): Promise<string | null> {
      return phones[guia] || null;
    },
  };
}

// =====================================================
// PHONE LOOKUP FACTORY
// =====================================================

/**
 * Create phone lookup function for ActionExecutor
 * Uses PhoneResolver for JIT resolution
 */
export function createJITPhoneLookup(): (guia: string) => Promise<string | null> {
  // Register default source (Supabase)
  if (!PhoneResolver.hasSources()) {
    PhoneResolver.registerSource(createSupabasePhoneSource());
  }

  return async (guia: string): Promise<string | null> => {
    const result = await PhoneResolver.resolve(guia);
    return result.phone;
  };
}

// Singleton export
export const PhoneResolver = new PhoneResolverImpl();

export default PhoneResolver;
