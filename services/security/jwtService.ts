/**
 * JWT Authentication Service
 *
 * Sistema de autenticación con access tokens (15 min) y refresh tokens (7 días).
 * Incluye rotación automática, blacklist de tokens revocados y detección de reuso.
 */

import {
  AuthTokens,
  AccessTokenPayload,
  RefreshTokenPayload,
  TokenValidationResult,
  TokenPair,
  TokenError,
  BlacklistedToken,
  BlacklistReason,
  User,
  UserRole,
  Permission,
  Session,
  DeviceInfo,
  LoginCredentials,
  LoginResponse,
  SecurityConfig,
} from '../../types/security.types';

// ============================================
// CONFIGURACIÓN POR DEFECTO
// ============================================

const DEFAULT_CONFIG: SecurityConfig['jwt'] = {
  accessTokenSecret: import.meta.env.VITE_JWT_ACCESS_SECRET || 'litper-access-secret-change-in-production',
  refreshTokenSecret: import.meta.env.VITE_JWT_REFRESH_SECRET || 'litper-refresh-secret-change-in-production',
  accessTokenExpiry: 900,        // 15 minutos
  refreshTokenExpiry: 604800,    // 7 días
  issuer: 'litper-pro',
  audience: 'litper-pro-app',
};

// ============================================
// UTILIDADES DE ENCODING/DECODING
// ============================================

function base64UrlEncode(data: string): string {
  return btoa(data)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(data: string): string {
  const padded = data + '==='.slice(0, (4 - (data.length % 4)) % 4);
  return atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
}

function generateJti(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

function generateTokenFamily(): string {
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================
// HMAC SIGNING (Browser-compatible)
// ============================================

async function hmacSign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
}

async function hmacVerify(data: string, signature: string, secret: string): Promise<boolean> {
  const expectedSignature = await hmacSign(data, secret);
  return expectedSignature === signature;
}

// ============================================
// JWT SERVICE CLASS
// ============================================

export class JWTService {
  private config: SecurityConfig['jwt'];
  private blacklist: Map<string, BlacklistedToken> = new Map();
  private sessions: Map<string, Session> = new Map();
  private tokenFamilies: Map<string, { userId: string; generation: number; lastJti: string }> = new Map();

  constructor(config?: Partial<SecurityConfig['jwt']>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startCleanupInterval();
  }

  // ============================================
  // TOKEN GENERATION
  // ============================================

  /**
   * Genera un par de tokens (access + refresh)
   */
  async generateTokenPair(user: User, deviceInfo?: DeviceInfo): Promise<AuthTokens> {
    const now = Math.floor(Date.now() / 1000);
    const accessJti = generateJti();
    const refreshJti = generateJti();
    const tokenFamily = generateTokenFamily();

    // Access Token Payload
    const accessPayload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
      type: 'access',
      iat: now,
      exp: now + this.config.accessTokenExpiry,
      jti: accessJti,
    };

    // Refresh Token Payload
    const refreshPayload: RefreshTokenPayload = {
      sub: user.id,
      type: 'refresh',
      family: tokenFamily,
      generation: 1,
      iat: now,
      exp: now + this.config.refreshTokenExpiry,
      jti: refreshJti,
    };

    // Sign tokens
    const accessToken = await this.signToken(accessPayload, this.config.accessTokenSecret);
    const refreshToken = await this.signToken(refreshPayload, this.config.refreshTokenSecret);

    // Store token family for rotation tracking
    this.tokenFamilies.set(tokenFamily, {
      userId: user.id,
      generation: 1,
      lastJti: refreshJti,
    });

    // Create session
    const session: Session = {
      id: generateJti(),
      userId: user.id,
      refreshTokenJti: refreshJti,
      tokenFamily,
      deviceInfo: deviceInfo || { type: 'unknown', os: 'unknown', browser: 'unknown' },
      ipAddress: '0.0.0.0', // Should be set by backend
      userAgent: navigator.userAgent,
      isActive: true,
      lastActivity: new Date(),
      createdAt: new Date(),
      expiresAt: new Date((now + this.config.refreshTokenExpiry) * 1000),
    };
    this.sessions.set(session.id, session);

    return {
      accessToken,
      refreshToken,
      accessTokenExpiry: new Date((now + this.config.accessTokenExpiry) * 1000),
      refreshTokenExpiry: new Date((now + this.config.refreshTokenExpiry) * 1000),
      tokenType: 'Bearer',
    };
  }

  /**
   * Firma un payload JWT
   */
  private async signToken(payload: object, secret: string): Promise<string> {
    const header = { alg: 'HS256', typ: 'JWT' };
    const headerEncoded = base64UrlEncode(JSON.stringify(header));
    const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
    const data = `${headerEncoded}.${payloadEncoded}`;
    const signature = await hmacSign(data, secret);
    return `${data}.${signature}`;
  }

  // ============================================
  // TOKEN VALIDATION
  // ============================================

  /**
   * Valida un access token
   */
  async validateAccessToken(token: string): Promise<TokenValidationResult> {
    return this.validateToken(token, this.config.accessTokenSecret, 'access');
  }

  /**
   * Valida un refresh token
   */
  async validateRefreshToken(token: string): Promise<TokenValidationResult> {
    return this.validateToken(token, this.config.refreshTokenSecret, 'refresh');
  }

  /**
   * Valida un token genérico
   */
  private async validateToken(
    token: string,
    secret: string,
    expectedType: 'access' | 'refresh'
  ): Promise<TokenValidationResult> {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { valid: false, error: 'malformed' };
      }

      const [headerEncoded, payloadEncoded, signature] = parts;
      const data = `${headerEncoded}.${payloadEncoded}`;

      // Verify signature
      const isValid = await hmacVerify(data, signature, secret);
      if (!isValid) {
        return { valid: false, error: 'invalid' };
      }

      // Decode payload
      const payload = JSON.parse(base64UrlDecode(payloadEncoded));

      // Check type
      if (payload.type !== expectedType) {
        return { valid: false, error: 'invalid' };
      }

      // Check expiry
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        return { valid: false, error: 'expired' };
      }

      // Check blacklist
      if (this.isBlacklisted(payload.jti)) {
        return { valid: false, error: 'blacklisted' };
      }

      // For refresh tokens, check for rotation reuse attack
      if (expectedType === 'refresh') {
        const family = this.tokenFamilies.get(payload.family);
        if (family) {
          // If this token's generation is less than current, it's a reuse attack
          if (payload.generation < family.generation) {
            // Revoke entire family
            await this.revokeTokenFamily(payload.family, 'rotation_reuse');
            return { valid: false, error: 'rotation_detected' };
          }
        }
      }

      return { valid: true, payload };
    } catch (error) {
      console.error('Token validation error:', error);
      return { valid: false, error: 'malformed' };
    }
  }

  // ============================================
  // TOKEN REFRESH
  // ============================================

  /**
   * Renueva tokens usando refresh token (con rotación)
   */
  async refreshTokens(refreshToken: string, user: User): Promise<AuthTokens | null> {
    const validation = await this.validateRefreshToken(refreshToken);

    if (!validation.valid || !validation.payload) {
      return null;
    }

    const payload = validation.payload as RefreshTokenPayload;
    const family = this.tokenFamilies.get(payload.family);

    if (!family) {
      return null;
    }

    // Invalidate old refresh token
    this.blacklistToken(payload.jti, user.id, 'refresh', 'logout');

    // Generate new token pair with incremented generation
    const now = Math.floor(Date.now() / 1000);
    const newAccessJti = generateJti();
    const newRefreshJti = generateJti();
    const newGeneration = payload.generation + 1;

    // New Access Token
    const accessPayload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
      type: 'access',
      iat: now,
      exp: now + this.config.accessTokenExpiry,
      jti: newAccessJti,
    };

    // New Refresh Token (rotated)
    const refreshPayload: RefreshTokenPayload = {
      sub: user.id,
      type: 'refresh',
      family: payload.family, // Keep same family
      generation: newGeneration,
      iat: now,
      exp: now + this.config.refreshTokenExpiry,
      jti: newRefreshJti,
    };

    const newAccessToken = await this.signToken(accessPayload, this.config.accessTokenSecret);
    const newRefreshToken = await this.signToken(refreshPayload, this.config.refreshTokenSecret);

    // Update family tracking
    this.tokenFamilies.set(payload.family, {
      userId: user.id,
      generation: newGeneration,
      lastJti: newRefreshJti,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      accessTokenExpiry: new Date((now + this.config.accessTokenExpiry) * 1000),
      refreshTokenExpiry: new Date((now + this.config.refreshTokenExpiry) * 1000),
      tokenType: 'Bearer',
    };
  }

  // ============================================
  // BLACKLIST MANAGEMENT
  // ============================================

  /**
   * Añade un token a la blacklist
   */
  blacklistToken(
    jti: string,
    userId: string,
    type: 'access' | 'refresh',
    reason: BlacklistReason
  ): void {
    const blacklistedToken: BlacklistedToken = {
      jti,
      userId,
      type,
      reason,
      blacklistedAt: new Date(),
      // Keep in blacklist until original expiry (+ buffer)
      expiresAt: new Date(Date.now() + (type === 'refresh'
        ? this.config.refreshTokenExpiry
        : this.config.accessTokenExpiry) * 1000 + 3600000), // +1 hour buffer
    };
    this.blacklist.set(jti, blacklistedToken);
  }

  /**
   * Verifica si un token está en la blacklist
   */
  isBlacklisted(jti: string): boolean {
    const entry = this.blacklist.get(jti);
    if (!entry) return false;

    // Auto-cleanup expired entries
    if (entry.expiresAt < new Date()) {
      this.blacklist.delete(jti);
      return false;
    }

    return true;
  }

  /**
   * Revoca toda una familia de tokens (para logout o breach)
   */
  async revokeTokenFamily(family: string, reason: BlacklistReason): Promise<void> {
    const familyData = this.tokenFamilies.get(family);
    if (familyData) {
      this.blacklistToken(familyData.lastJti, familyData.userId, 'refresh', reason);
      this.tokenFamilies.delete(family);
    }

    // Also terminate associated sessions
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.tokenFamily === family) {
        session.isActive = false;
        this.sessions.set(sessionId, session);
      }
    }
  }

  /**
   * Revoca todos los tokens de un usuario
   */
  async revokeAllUserTokens(userId: string, reason: BlacklistReason): Promise<number> {
    let count = 0;

    // Revoke all token families for this user
    for (const [family, data] of this.tokenFamilies.entries()) {
      if (data.userId === userId) {
        await this.revokeTokenFamily(family, reason);
        count++;
      }
    }

    // Terminate all sessions
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId && session.isActive) {
        session.isActive = false;
        this.sessions.set(sessionId, session);
      }
    }

    return count;
  }

  // ============================================
  // SESSION MANAGEMENT
  // ============================================

  /**
   * Obtiene sesiones activas de un usuario
   */
  getActiveSessions(userId: string): Session[] {
    const sessions: Session[] = [];
    for (const session of this.sessions.values()) {
      if (session.userId === userId && session.isActive) {
        sessions.push(session);
      }
    }
    return sessions;
  }

  /**
   * Termina una sesión específica
   */
  terminateSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.revokeTokenFamily(session.tokenFamily, 'logout');
      return true;
    }
    return false;
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Extrae el payload de un token sin validar (para debugging)
   */
  decodeToken(token: string): object | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      return JSON.parse(base64UrlDecode(parts[1]));
    } catch {
      return null;
    }
  }

  /**
   * Verifica si un token está próximo a expirar
   */
  isTokenExpiringSoon(token: string, thresholdSeconds: number = 60): boolean {
    const payload = this.decodeToken(token);
    if (!payload || typeof (payload as any).exp !== 'number') return true;

    const now = Math.floor(Date.now() / 1000);
    return (payload as any).exp - now < thresholdSeconds;
  }

  /**
   * Limpieza periódica de blacklist y sesiones expiradas
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      const now = new Date();

      // Cleanup expired blacklist entries
      for (const [jti, entry] of this.blacklist.entries()) {
        if (entry.expiresAt < now) {
          this.blacklist.delete(jti);
        }
      }

      // Cleanup expired sessions
      for (const [sessionId, session] of this.sessions.entries()) {
        if (session.expiresAt < now) {
          this.sessions.delete(sessionId);
        }
      }

      // Cleanup stale token families (no activity for > refresh expiry)
      // This is handled implicitly when tokens expire
    }, 60000); // Run every minute
  }

  /**
   * Obtiene estadísticas del servicio
   */
  getStats(): {
    blacklistSize: number;
    activeSessions: number;
    tokenFamilies: number;
  } {
    let activeSessions = 0;
    for (const session of this.sessions.values()) {
      if (session.isActive) activeSessions++;
    }

    return {
      blacklistSize: this.blacklist.size,
      activeSessions,
      tokenFamilies: this.tokenFamilies.size,
    };
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const jwtService = new JWTService();

export default jwtService;
