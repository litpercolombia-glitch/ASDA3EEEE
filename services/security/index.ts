/**
 * Security Services Index
 *
 * Exporta todos los servicios de seguridad de LITPER PRO.
 * Incluye: JWT, Encriptación, Rate Limiting, y utilidades.
 */

// ============================================
// JWT SERVICE
// ============================================

export { jwtService, JWTService } from './jwtService';
export type {
  TokenValidationResult,
  DeviceInfo,
  SessionInfo,
} from './jwtService';

// ============================================
// ENCRYPTION SERVICE
// ============================================

export { encryptionService, EncryptionService } from './encryptionService';

// ============================================
// RATE LIMIT SERVICE
// ============================================

export { rateLimiter, RateLimiter } from './rateLimitService';

// ============================================
// RE-EXPORT TYPES
// ============================================

export type {
  // Auth & User
  User,
  UserRole,
  Permission,
  AuthTokens,
  AccessTokenPayload,
  RefreshTokenPayload,
  LoginCredentials,
  LoginResponse,
  DeviceFingerprint,

  // Blacklist
  BlacklistedToken,
  BlacklistReason,
  TokenBlacklist,

  // Rate Limiting
  RateLimitConfig,
  RateLimitResult,
  RateLimitRule,
  RateLimitType,
  RateLimitStore,

  // Encryption
  EncryptedData,
  SecureStorageConfig,
  StoredCredential,

  // Audit
  SecurityAuditLog,
  SecurityAction,
  SecurityEventType,
} from '../../types/security.types';

// ============================================
// SECURITY MIDDLEWARE HELPER
// ============================================

import { rateLimiter } from './rateLimitService';
import { jwtService } from './jwtService';
import type { User, AccessTokenPayload } from '../../types/security.types';

/**
 * Middleware helper para proteger endpoints
 */
export interface SecurityContext {
  user: User | null;
  tokenPayload: AccessTokenPayload | null;
  isAuthenticated: boolean;
  rateLimitHeaders: Record<string, string>;
}

export interface ProtectedRequestOptions {
  requireAuth?: boolean;
  requiredPermissions?: string[];
  requiredRole?: string;
  rateLimitEndpoint?: string;
}

/**
 * Procesa una request protegida y devuelve el contexto de seguridad
 */
export async function processSecurityContext(
  request: {
    headers: { authorization?: string; 'x-forwarded-for'?: string };
    ip?: string;
  },
  options: ProtectedRequestOptions = {}
): Promise<{
  allowed: boolean;
  context: SecurityContext;
  error?: string;
  statusCode?: number;
}> {
  const { requireAuth = true, requiredPermissions = [], requiredRole } = options;

  // Extract IP
  const ip = request.headers['x-forwarded-for'] || request.ip || '127.0.0.1';

  // Check rate limit first
  const rateCheck = await rateLimiter.checkRequest(
    ip,
    undefined,
    options.rateLimitEndpoint
  );

  if (!rateCheck.allowed) {
    return {
      allowed: false,
      context: {
        user: null,
        tokenPayload: null,
        isAuthenticated: false,
        rateLimitHeaders: rateCheck.headers,
      },
      error: 'Too many requests',
      statusCode: 429,
    };
  }

  // Extract token
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (requireAuth) {
      return {
        allowed: false,
        context: {
          user: null,
          tokenPayload: null,
          isAuthenticated: false,
          rateLimitHeaders: rateCheck.headers,
        },
        error: 'Authorization required',
        statusCode: 401,
      };
    }

    return {
      allowed: true,
      context: {
        user: null,
        tokenPayload: null,
        isAuthenticated: false,
        rateLimitHeaders: rateCheck.headers,
      },
    };
  }

  const token = authHeader.substring(7);

  // Validate token
  const validation = await jwtService.validateAccessToken(token);

  if (!validation.valid || !validation.payload) {
    return {
      allowed: false,
      context: {
        user: null,
        tokenPayload: null,
        isAuthenticated: false,
        rateLimitHeaders: rateCheck.headers,
      },
      error: validation.error || 'Invalid token',
      statusCode: 401,
    };
  }

  const payload = validation.payload as AccessTokenPayload;

  // Check required role
  if (requiredRole) {
    const roleHierarchy: Record<string, number> = {
      super_admin: 100,
      admin: 80,
      manager: 60,
      operator: 40,
      viewer: 20,
      api_client: 10,
    };

    const userRoleLevel = roleHierarchy[payload.role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

    if (userRoleLevel < requiredRoleLevel) {
      return {
        allowed: false,
        context: {
          user: null,
          tokenPayload: payload,
          isAuthenticated: true,
          rateLimitHeaders: rateCheck.headers,
        },
        error: 'Insufficient role',
        statusCode: 403,
      };
    }
  }

  // Check required permissions
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(
      (perm) =>
        payload.permissions.includes(perm as any) ||
        payload.permissions.includes('admin:full')
    );

    if (!hasAllPermissions) {
      return {
        allowed: false,
        context: {
          user: null,
          tokenPayload: payload,
          isAuthenticated: true,
          rateLimitHeaders: rateCheck.headers,
        },
        error: 'Insufficient permissions',
        statusCode: 403,
      };
    }
  }

  // Check rate limit with user ID now
  const userRateCheck = await rateLimiter.checkRequest(
    ip,
    payload.sub,
    options.rateLimitEndpoint
  );

  // Build user object from token
  const user: User = {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    permissions: payload.permissions,
    isActive: true,
    emailVerified: true,
    twoFactorEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return {
    allowed: userRateCheck.allowed,
    context: {
      user,
      tokenPayload: payload,
      isAuthenticated: true,
      rateLimitHeaders: userRateCheck.headers,
    },
    error: userRateCheck.allowed ? undefined : 'Too many requests',
    statusCode: userRateCheck.allowed ? undefined : 429,
  };
}

// ============================================
// SECURITY UTILITIES
// ============================================

/**
 * Genera un ID de sesión seguro
 */
export function generateSecureId(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

/**
 * Sanitiza input para prevenir XSS
 */
export function sanitizeInput(input: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return input.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * Valida formato de email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida fortaleza de contraseña
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  score: number;
  issues: string[];
} {
  const issues: string[] = [];
  let score = 0;

  if (password.length < 8) {
    issues.push('Mínimo 8 caracteres');
  } else {
    score += 1;
    if (password.length >= 12) score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    issues.push('Al menos una mayúscula');
  } else {
    score += 1;
  }

  if (!/[a-z]/.test(password)) {
    issues.push('Al menos una minúscula');
  } else {
    score += 1;
  }

  if (!/[0-9]/.test(password)) {
    issues.push('Al menos un número');
  } else {
    score += 1;
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    issues.push('Al menos un carácter especial');
  } else {
    score += 1;
  }

  // Check for common patterns
  const commonPatterns = ['123456', 'password', 'qwerty', 'abc123'];
  if (commonPatterns.some((p) => password.toLowerCase().includes(p))) {
    issues.push('No usar patrones comunes');
    score = Math.max(0, score - 2);
  }

  return {
    valid: issues.length === 0,
    score: Math.min(5, score),
    issues,
  };
}

/**
 * Hash simple para fingerprinting (no criptográfico)
 */
export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Detecta información del dispositivo del cliente
 */
export function detectDeviceInfo(): {
  type: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  browser: string;
  os: string;
  screenResolution: string;
} {
  if (typeof window === 'undefined') {
    return {
      type: 'unknown',
      browser: 'unknown',
      os: 'unknown',
      screenResolution: 'unknown',
    };
  }

  const ua = navigator.userAgent;

  // Detect device type
  let type: 'mobile' | 'tablet' | 'desktop' | 'unknown' = 'desktop';
  if (/Mobi|Android/i.test(ua)) {
    type = /Tablet|iPad/i.test(ua) ? 'tablet' : 'mobile';
  }

  // Detect browser
  let browser = 'unknown';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

  // Detect OS
  let os = 'unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  // Screen resolution
  const screenResolution = `${window.screen.width}x${window.screen.height}`;

  return { type, browser, os, screenResolution };
}

// ============================================
// CSRF PROTECTION
// ============================================

const csrfTokens = new Map<string, { token: string; expires: number }>();

/**
 * Genera un token CSRF
 */
export function generateCSRFToken(sessionId: string): string {
  const token = generateSecureId(32);
  const expires = Date.now() + 3600000; // 1 hora

  csrfTokens.set(sessionId, { token, expires });

  // Cleanup expired tokens
  const now = Date.now();
  for (const [key, value] of csrfTokens.entries()) {
    if (value.expires < now) {
      csrfTokens.delete(key);
    }
  }

  return token;
}

/**
 * Valida un token CSRF
 */
export function validateCSRFToken(sessionId: string, token: string): boolean {
  const stored = csrfTokens.get(sessionId);

  if (!stored) return false;
  if (stored.expires < Date.now()) {
    csrfTokens.delete(sessionId);
    return false;
  }

  return stored.token === token;
}

// ============================================
// SECURITY HEADERS HELPER
// ============================================

/**
 * Devuelve headers de seguridad recomendados
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };
}

export default {
  jwtService,
  encryptionService,
  rateLimiter,
  processSecurityContext,
  generateSecureId,
  sanitizeInput,
  isValidEmail,
  validatePasswordStrength,
  detectDeviceInfo,
  generateCSRFToken,
  validateCSRFToken,
  getSecurityHeaders,
};
