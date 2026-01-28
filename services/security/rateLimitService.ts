/**
 * Rate Limiting Service
 *
 * Sistema de rate limiting por IP, usuario y endpoint.
 * Soporta almacenamiento en memoria y Redis.
 * Incluye headers estándar de rate limit en respuestas.
 */

import {
  RateLimitConfig,
  RateLimitResult,
  RateLimitInfo,
  RateLimitType,
  RateLimitRule,
} from '../../types/security.types';

// ============================================
// CONFIGURACIÓN POR DEFECTO
// ============================================

const DEFAULT_RULES: RateLimitRule[] = [
  // Global: 1000 requests per minute
  {
    type: 'global',
    config: {
      windowMs: 60000,
      maxRequests: 1000,
      keyPrefix: 'rl:global',
    },
  },
  // Per IP: 100 requests per minute
  {
    type: 'per_ip',
    config: {
      windowMs: 60000,
      maxRequests: 100,
      keyPrefix: 'rl:ip',
    },
  },
  // Per User: 200 requests per minute
  {
    type: 'per_user',
    config: {
      windowMs: 60000,
      maxRequests: 200,
      keyPrefix: 'rl:user',
    },
  },
  // Login attempts: 5 per 15 minutes (very restrictive)
  {
    type: 'login_attempts',
    endpoint: /\/auth\/login/,
    config: {
      windowMs: 900000, // 15 minutes
      maxRequests: 5,
      keyPrefix: 'rl:login',
    },
  },
  // Password reset: 3 per hour
  {
    type: 'per_endpoint',
    endpoint: /\/auth\/password-reset/,
    config: {
      windowMs: 3600000, // 1 hour
      maxRequests: 3,
      keyPrefix: 'rl:password-reset',
    },
  },
  // API Key creation: 10 per day
  {
    type: 'per_endpoint',
    endpoint: /\/api-keys/,
    config: {
      windowMs: 86400000, // 24 hours
      maxRequests: 10,
      keyPrefix: 'rl:api-keys',
    },
  },
  // Export/Report generation: 20 per hour
  {
    type: 'per_endpoint',
    endpoint: /\/reports|\/export/,
    config: {
      windowMs: 3600000,
      maxRequests: 20,
      keyPrefix: 'rl:reports',
    },
  },
];

// ============================================
// IN-MEMORY STORE
// ============================================

interface MemoryStoreEntry {
  count: number;
  windowStart: number;
}

class MemoryStore {
  private store: Map<string, MemoryStoreEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  async increment(key: string, windowMs: number): Promise<RateLimitInfo> {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now - entry.windowStart >= windowMs) {
      // Start new window
      const newEntry: MemoryStoreEntry = {
        count: 1,
        windowStart: now,
      };
      this.store.set(key, newEntry);

      return {
        key,
        count: 1,
        windowStart: now,
        windowEnd: now + windowMs,
      };
    }

    // Increment existing window
    entry.count++;
    this.store.set(key, entry);

    return {
      key,
      count: entry.count,
      windowStart: entry.windowStart,
      windowEnd: entry.windowStart + windowMs,
    };
  }

  async get(key: string): Promise<RateLimitInfo | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    return {
      key,
      count: entry.count,
      windowStart: entry.windowStart,
      windowEnd: entry.windowStart + 60000, // Assume 1 minute window if unknown
    };
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  async resetPattern(pattern: string): Promise<number> {
    let count = 0;
    const regex = new RegExp(pattern);

    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
        count++;
      }
    }

    return count;
  }

  private cleanup(): void {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour max retention

    for (const [key, entry] of this.store.entries()) {
      if (now - entry.windowStart > maxAge) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.store.size,
      keys: Array.from(this.store.keys()),
    };
  }
}

// ============================================
// REDIS STORE (Optional - requires redis connection)
// ============================================

interface RedisClient {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<void>;
  ttl(key: string): Promise<number>;
  del(key: string): Promise<void>;
  keys(pattern: string): Promise<string[]>;
}

class RedisStore {
  private client: RedisClient;

  constructor(client: RedisClient) {
    this.client = client;
  }

  async increment(key: string, windowMs: number): Promise<RateLimitInfo> {
    const count = await this.client.incr(key);
    const windowSeconds = Math.ceil(windowMs / 1000);

    if (count === 1) {
      await this.client.expire(key, windowSeconds);
    }

    const ttl = await this.client.ttl(key);
    const now = Date.now();

    return {
      key,
      count,
      windowStart: now - (windowMs - ttl * 1000),
      windowEnd: now + ttl * 1000,
    };
  }

  async get(key: string): Promise<RateLimitInfo | null> {
    // Redis doesn't store this directly, would need additional logic
    return null;
  }

  async reset(key: string): Promise<void> {
    await this.client.del(key);
  }

  async resetPattern(pattern: string): Promise<number> {
    const keys = await this.client.keys(pattern);
    for (const key of keys) {
      await this.client.del(key);
    }
    return keys.length;
  }
}

// ============================================
// RATE LIMITER CLASS
// ============================================

export class RateLimiter {
  private store: MemoryStore | RedisStore;
  private rules: RateLimitRule[];
  private enabled: boolean = true;

  constructor(rules?: RateLimitRule[], redisClient?: RedisClient) {
    this.rules = rules || DEFAULT_RULES;
    this.store = redisClient ? new RedisStore(redisClient) : new MemoryStore();
  }

  // ============================================
  // CORE RATE LIMITING
  // ============================================

  /**
   * Verifica si una petición está permitida
   */
  async checkLimit(
    type: RateLimitType,
    identifier: string,
    endpoint?: string
  ): Promise<RateLimitResult> {
    if (!this.enabled) {
      return {
        allowed: true,
        remaining: Infinity,
        resetTime: new Date(),
        limit: Infinity,
      };
    }

    // Find applicable rule
    const rule = this.findRule(type, endpoint);
    if (!rule) {
      return {
        allowed: true,
        remaining: Infinity,
        resetTime: new Date(),
        limit: Infinity,
      };
    }

    const key = this.buildKey(rule.config.keyPrefix, identifier, endpoint);
    const info = await this.store.increment(key, rule.config.windowMs);

    const allowed = info.count <= rule.config.maxRequests;
    const remaining = Math.max(0, rule.config.maxRequests - info.count);
    const resetTime = new Date(info.windowEnd);
    const retryAfter = allowed ? undefined : Math.ceil((info.windowEnd - Date.now()) / 1000);

    return {
      allowed,
      remaining,
      resetTime,
      retryAfter,
      limit: rule.config.maxRequests,
    };
  }

  /**
   * Verifica múltiples límites a la vez
   */
  async checkMultipleLimits(checks: {
    type: RateLimitType;
    identifier: string;
    endpoint?: string;
  }[]): Promise<{
    allowed: boolean;
    results: Map<RateLimitType, RateLimitResult>;
    blockingRule?: RateLimitType;
  }> {
    const results = new Map<RateLimitType, RateLimitResult>();
    let allowed = true;
    let blockingRule: RateLimitType | undefined;

    for (const check of checks) {
      const result = await this.checkLimit(check.type, check.identifier, check.endpoint);
      results.set(check.type, result);

      if (!result.allowed && allowed) {
        allowed = false;
        blockingRule = check.type;
      }
    }

    return { allowed, results, blockingRule };
  }

  // ============================================
  // CONVENIENCE METHODS
  // ============================================

  /**
   * Verifica límite por IP
   */
  async checkIpLimit(ip: string, endpoint?: string): Promise<RateLimitResult> {
    return this.checkLimit('per_ip', ip, endpoint);
  }

  /**
   * Verifica límite por usuario
   */
  async checkUserLimit(userId: string, endpoint?: string): Promise<RateLimitResult> {
    return this.checkLimit('per_user', userId, endpoint);
  }

  /**
   * Verifica límite de login
   */
  async checkLoginLimit(ip: string): Promise<RateLimitResult> {
    return this.checkLimit('login_attempts', ip, '/auth/login');
  }

  /**
   * Verifica límite por API key
   */
  async checkApiKeyLimit(apiKeyId: string, endpoint?: string): Promise<RateLimitResult> {
    return this.checkLimit('api_key', apiKeyId, endpoint);
  }

  /**
   * Verifica todos los límites aplicables para una petición
   */
  async checkRequest(
    ip: string,
    userId?: string,
    endpoint?: string,
    apiKeyId?: string
  ): Promise<{
    allowed: boolean;
    mostRestrictive: RateLimitResult;
    headers: Record<string, string>;
  }> {
    const checks: { type: RateLimitType; identifier: string; endpoint?: string }[] = [
      { type: 'global', identifier: 'global', endpoint },
      { type: 'per_ip', identifier: ip, endpoint },
    ];

    if (userId) {
      checks.push({ type: 'per_user', identifier: userId, endpoint });
    }

    if (apiKeyId) {
      checks.push({ type: 'api_key', identifier: apiKeyId, endpoint });
    }

    // Check endpoint-specific rules
    if (endpoint) {
      if (/\/auth\/login/.test(endpoint)) {
        checks.push({ type: 'login_attempts', identifier: ip, endpoint });
      }
    }

    const { allowed, results, blockingRule } = await this.checkMultipleLimits(checks);

    // Find most restrictive result
    let mostRestrictive: RateLimitResult = {
      allowed: true,
      remaining: Infinity,
      resetTime: new Date(),
      limit: Infinity,
    };

    for (const result of results.values()) {
      if (result.remaining < mostRestrictive.remaining) {
        mostRestrictive = result;
      }
    }

    // Generate headers
    const headers = this.generateHeaders(mostRestrictive, blockingRule);

    return { allowed, mostRestrictive, headers };
  }

  // ============================================
  // HEADER GENERATION
  // ============================================

  /**
   * Genera headers estándar de rate limit
   */
  generateHeaders(
    result: RateLimitResult,
    blockingRule?: RateLimitType
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(result.resetTime.getTime() / 1000).toString(),
    };

    if (!result.allowed && result.retryAfter) {
      headers['Retry-After'] = result.retryAfter.toString();
      if (blockingRule) {
        headers['X-RateLimit-Type'] = blockingRule;
      }
    }

    return headers;
  }

  // ============================================
  // MANAGEMENT METHODS
  // ============================================

  /**
   * Resetea el límite para un identificador
   */
  async resetLimit(type: RateLimitType, identifier: string, endpoint?: string): Promise<void> {
    const rule = this.findRule(type, endpoint);
    if (!rule) return;

    const key = this.buildKey(rule.config.keyPrefix, identifier, endpoint);
    await this.store.reset(key);
  }

  /**
   * Resetea todos los límites de un usuario
   */
  async resetUserLimits(userId: string): Promise<number> {
    return this.store.resetPattern(`rl:user:${userId}`);
  }

  /**
   * Resetea todos los límites de una IP
   */
  async resetIpLimits(ip: string): Promise<number> {
    return this.store.resetPattern(`rl:ip:${ip.replace(/\./g, '_')}`);
  }

  /**
   * Habilita/deshabilita rate limiting
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Verifica si está habilitado
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Añade una regla personalizada
   */
  addRule(rule: RateLimitRule): void {
    this.rules.push(rule);
  }

  /**
   * Remueve una regla
   */
  removeRule(type: RateLimitType, endpoint?: string | RegExp): void {
    this.rules = this.rules.filter(
      (r) => !(r.type === type && r.endpoint === endpoint)
    );
  }

  /**
   * Obtiene las reglas actuales
   */
  getRules(): RateLimitRule[] {
    return [...this.rules];
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private findRule(type: RateLimitType, endpoint?: string): RateLimitRule | undefined {
    // First, try to find endpoint-specific rule
    if (endpoint) {
      for (const rule of this.rules) {
        if (rule.endpoint) {
          const pattern = rule.endpoint instanceof RegExp
            ? rule.endpoint
            : new RegExp(rule.endpoint);
          if (pattern.test(endpoint)) {
            return rule;
          }
        }
      }
    }

    // Fall back to type-based rule
    return this.rules.find((r) => r.type === type && !r.endpoint);
  }

  private buildKey(prefix: string, identifier: string, endpoint?: string): string {
    const sanitizedIdentifier = identifier.replace(/[^a-zA-Z0-9_-]/g, '_');
    const parts = [prefix, sanitizedIdentifier];

    if (endpoint) {
      const sanitizedEndpoint = endpoint.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
      parts.push(sanitizedEndpoint);
    }

    return parts.join(':');
  }

  /**
   * Obtiene estadísticas del rate limiter
   */
  getStats(): {
    enabled: boolean;
    rulesCount: number;
    storeStats: { size: number; keys: string[] };
  } {
    const storeStats = this.store instanceof MemoryStore
      ? this.store.getStats()
      : { size: 0, keys: [] };

    return {
      enabled: this.enabled,
      rulesCount: this.rules.length,
      storeStats,
    };
  }

  /**
   * Destruye el rate limiter y limpia recursos
   */
  destroy(): void {
    if (this.store instanceof MemoryStore) {
      this.store.destroy();
    }
  }
}

// ============================================
// MIDDLEWARE HELPER
// ============================================

export interface RateLimitMiddlewareContext {
  ip: string;
  userId?: string;
  endpoint: string;
  apiKeyId?: string;
}

/**
 * Crea una función de middleware para rate limiting
 */
export function createRateLimitMiddleware(limiter: RateLimiter) {
  return async (context: RateLimitMiddlewareContext): Promise<{
    allowed: boolean;
    headers: Record<string, string>;
    error?: { status: number; message: string };
  }> => {
    const { allowed, mostRestrictive, headers } = await limiter.checkRequest(
      context.ip,
      context.userId,
      context.endpoint,
      context.apiKeyId
    );

    if (!allowed) {
      return {
        allowed: false,
        headers,
        error: {
          status: 429,
          message: `Rate limit exceeded. Retry after ${mostRestrictive.retryAfter} seconds.`,
        },
      };
    }

    return { allowed: true, headers };
  };
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const rateLimiter = new RateLimiter();

export default rateLimiter;
