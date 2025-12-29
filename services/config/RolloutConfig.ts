/**
 * RolloutConfig - Centralized Rollout Configuration (P1-5)
 *
 * Single source of truth for:
 * - Executor on/off
 * - Pilot city/carrier restrictions
 * - Rate limits
 * - Feature flags
 *
 * All values from environment variables with sensible defaults.
 * NO PII stored here.
 */

// =====================================================
// TYPES
// =====================================================

export interface RolloutPhase {
  name: string;
  description: string;
  requirements: string[];
  enabled: boolean;
}

export interface RolloutConfigValues {
  // Core executor settings
  executorEnabled: boolean;
  dryRunMode: boolean;

  // Pilot restrictions
  pilotCity: string | null;
  pilotCarrier: string | null;
  pilotGuias: string[]; // Specific guias for testing

  // Rate limits
  dailySendLimit: number;
  rateLimitPerMinute: number;
  rateLimitPerPhonePerDay: number;
  cooldownBetweenMessagesMs: number;

  // Feature flags
  features: {
    whatsappNotifications: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    autoRetry: boolean;
    webhookCallbacks: boolean;
  };

  // Monitoring
  alertThresholds: {
    failureRatePercent: number;
    maxFailuresBeforePause: number;
    minSuccessRatePercent: number;
  };

  // Circuit breaker
  circuitBreaker: {
    enabled: boolean;
    failureThreshold: number;
    resetTimeoutMs: number;
  };
}

// =====================================================
// CONFIG IMPLEMENTATION
// =====================================================

class RolloutConfigImpl {
  private cache: RolloutConfigValues | null = null;
  private lastLoadedAt: Date | null = null;
  private readonly CACHE_TTL_MS = 60 * 1000; // 1 minute cache

  /**
   * Get current configuration
   * Cached for 1 minute to avoid repeated env lookups
   */
  get(): RolloutConfigValues {
    const now = Date.now();

    if (
      this.cache &&
      this.lastLoadedAt &&
      now - this.lastLoadedAt.getTime() < this.CACHE_TTL_MS
    ) {
      return this.cache;
    }

    this.cache = this.loadFromEnv();
    this.lastLoadedAt = new Date();
    return this.cache;
  }

  /**
   * Force reload configuration
   */
  reload(): RolloutConfigValues {
    this.cache = null;
    this.lastLoadedAt = null;
    return this.get();
  }

  /**
   * Load configuration from environment variables
   */
  private loadFromEnv(): RolloutConfigValues {
    const env = typeof process !== 'undefined' ? process.env : {};

    return {
      // Core executor settings
      executorEnabled: env.EXECUTOR_ENABLED === 'true',
      dryRunMode: env.DRY_RUN_MODE === 'true' || env.EXECUTOR_ENABLED !== 'true',

      // Pilot restrictions
      pilotCity: env.PILOT_CITY || null,
      pilotCarrier: env.PILOT_CARRIER || null,
      pilotGuias: env.PILOT_GUIAS ? env.PILOT_GUIAS.split(',').map(s => s.trim()) : [],

      // Rate limits
      dailySendLimit: this.parseIntWithDefault(env.DAILY_SEND_LIMIT, 100),
      rateLimitPerMinute: this.parseIntWithDefault(env.RATE_LIMIT_PER_MINUTE, 20),
      rateLimitPerPhonePerDay: this.parseIntWithDefault(env.RATE_LIMIT_PER_PHONE_DAY, 2),
      cooldownBetweenMessagesMs: this.parseIntWithDefault(env.COOLDOWN_BETWEEN_MESSAGES_MS, 3000),

      // Feature flags
      features: {
        whatsappNotifications: env.FEATURE_WHATSAPP !== 'false', // Default true
        emailNotifications: env.FEATURE_EMAIL === 'true', // Default false
        smsNotifications: env.FEATURE_SMS === 'true', // Default false
        autoRetry: env.FEATURE_AUTO_RETRY !== 'false', // Default true
        webhookCallbacks: env.FEATURE_WEBHOOKS !== 'false', // Default true
      },

      // Monitoring
      alertThresholds: {
        failureRatePercent: this.parseIntWithDefault(env.ALERT_FAILURE_RATE, 10),
        maxFailuresBeforePause: this.parseIntWithDefault(env.ALERT_MAX_FAILURES, 5),
        minSuccessRatePercent: this.parseIntWithDefault(env.ALERT_MIN_SUCCESS_RATE, 80),
      },

      // Circuit breaker
      circuitBreaker: {
        enabled: env.CIRCUIT_BREAKER_ENABLED !== 'false', // Default true
        failureThreshold: this.parseIntWithDefault(env.CIRCUIT_BREAKER_THRESHOLD, 5),
        resetTimeoutMs: this.parseIntWithDefault(env.CIRCUIT_BREAKER_RESET_MS, 60000),
      },
    };
  }

  /**
   * Parse integer with default value
   */
  private parseIntWithDefault(value: string | undefined, defaultValue: number): number {
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Check if a guia is in pilot scope
   */
  isInPilotScope(guia: string, city?: string, carrier?: string): boolean {
    const config = this.get();

    // If pilot guias specified, check if this guia is in the list
    if (config.pilotGuias.length > 0) {
      if (!config.pilotGuias.includes(guia)) {
        return false;
      }
    }

    // Check pilot city
    if (config.pilotCity && city && city !== config.pilotCity) {
      return false;
    }

    // Check pilot carrier
    if (config.pilotCarrier && carrier && carrier !== config.pilotCarrier) {
      return false;
    }

    return true;
  }

  /**
   * Check if executor can send messages
   */
  canSend(): { allowed: boolean; reason: string } {
    const config = this.get();

    if (!config.executorEnabled) {
      return { allowed: false, reason: 'EXECUTOR_DISABLED' };
    }

    if (config.dryRunMode) {
      return { allowed: false, reason: 'DRY_RUN_MODE' };
    }

    if (!config.features.whatsappNotifications) {
      return { allowed: false, reason: 'WHATSAPP_DISABLED' };
    }

    return { allowed: true, reason: 'OK' };
  }

  /**
   * Get rollout phases for documentation
   */
  getRolloutPhases(): RolloutPhase[] {
    const config = this.get();

    return [
      {
        name: 'Phase 0: Off',
        description: 'Executor disabled, only planning and dry-run',
        requirements: ['EXECUTOR_ENABLED=false'],
        enabled: !config.executorEnabled,
      },
      {
        name: 'Phase 1: Pilot City',
        description: 'Send only to one city (e.g., Bogota)',
        requirements: [
          'EXECUTOR_ENABLED=true',
          'PILOT_CITY=<city>',
          'DAILY_SEND_LIMIT=50',
        ],
        enabled: config.executorEnabled && config.pilotCity !== null,
      },
      {
        name: 'Phase 2: Pilot Carrier',
        description: 'Send only to one carrier in pilot city',
        requirements: [
          'EXECUTOR_ENABLED=true',
          'PILOT_CITY=<city>',
          'PILOT_CARRIER=<carrier>',
        ],
        enabled:
          config.executorEnabled &&
          config.pilotCity !== null &&
          config.pilotCarrier !== null,
      },
      {
        name: 'Phase 3: Expanded',
        description: 'Multiple cities, increased limits',
        requirements: [
          'EXECUTOR_ENABLED=true',
          'PILOT_CITY removed',
          'DAILY_SEND_LIMIT=500',
        ],
        enabled:
          config.executorEnabled &&
          config.pilotCity === null &&
          config.dailySendLimit >= 500,
      },
      {
        name: 'Phase 4: Full Production',
        description: 'All cities, all carriers, full limits',
        requirements: [
          'EXECUTOR_ENABLED=true',
          'No restrictions',
          'DAILY_SEND_LIMIT=5000+',
        ],
        enabled:
          config.executorEnabled &&
          config.pilotCity === null &&
          config.pilotCarrier === null &&
          config.dailySendLimit >= 5000,
      },
    ];
  }

  /**
   * Get current phase name
   */
  getCurrentPhase(): string {
    const phases = this.getRolloutPhases();
    const currentPhase = phases.find(p => p.enabled);
    return currentPhase?.name || 'Unknown';
  }

  /**
   * Export config for API (safe to expose)
   */
  toApiResponse(): {
    phase: string;
    config: Omit<RolloutConfigValues, 'pilotGuias'>;
    phases: RolloutPhase[];
  } {
    const config = this.get();
    const { pilotGuias, ...safeConfig } = config;

    return {
      phase: this.getCurrentPhase(),
      config: safeConfig,
      phases: this.getRolloutPhases(),
    };
  }

  /**
   * Validate configuration
   */
  validate(): { valid: boolean; errors: string[] } {
    const config = this.get();
    const errors: string[] = [];

    // Check for conflicting settings
    if (config.executorEnabled && config.dailySendLimit === 0) {
      errors.push('EXECUTOR_ENABLED but DAILY_SEND_LIMIT is 0');
    }

    if (config.rateLimitPerMinute > config.dailySendLimit) {
      errors.push('RATE_LIMIT_PER_MINUTE exceeds DAILY_SEND_LIMIT');
    }

    if (
      config.circuitBreaker.enabled &&
      config.circuitBreaker.failureThreshold < 1
    ) {
      errors.push('CIRCUIT_BREAKER_THRESHOLD must be at least 1');
    }

    // Warn about production settings
    if (config.executorEnabled && !config.circuitBreaker.enabled) {
      errors.push('WARNING: Circuit breaker disabled in production');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// =====================================================
// SINGLETON EXPORT
// =====================================================

export const RolloutConfig = new RolloutConfigImpl();
export default RolloutConfig;
