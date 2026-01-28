/**
 * Security Types
 *
 * Tipos para el sistema de seguridad de LITPER PRO.
 * Incluye autenticación, tokens, rate limiting y encriptación.
 */

// ============================================
// AUTENTICACIÓN Y TOKENS
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  avatar?: string;
  isActive: boolean;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'operator' | 'viewer' | 'api_client';

export type Permission =
  | 'dashboard:view'
  | 'dashboard:edit'
  | 'orders:view'
  | 'orders:create'
  | 'orders:edit'
  | 'orders:delete'
  | 'shipments:view'
  | 'shipments:create'
  | 'shipments:edit'
  | 'shipments:cancel'
  | 'inventory:view'
  | 'inventory:edit'
  | 'inventory:adjust'
  | 'reports:view'
  | 'reports:export'
  | 'settings:view'
  | 'settings:edit'
  | 'users:view'
  | 'users:create'
  | 'users:edit'
  | 'users:delete'
  | 'api:access'
  | 'admin:full';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: Date;
  refreshTokenExpiry: Date;
  tokenType: 'Bearer';
}

export interface AccessTokenPayload {
  sub: string;           // User ID
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  type: 'access';
  iat: number;           // Issued at
  exp: number;           // Expiry
  jti: string;           // JWT ID (unique identifier)
}

export interface RefreshTokenPayload {
  sub: string;           // User ID
  type: 'refresh';
  family: string;        // Token family for rotation detection
  generation: number;    // Generation number for rotation
  iat: number;
  exp: number;
  jti: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface TokenValidationResult {
  valid: boolean;
  payload?: AccessTokenPayload | RefreshTokenPayload;
  error?: TokenError;
}

export type TokenError =
  | 'expired'
  | 'invalid'
  | 'malformed'
  | 'blacklisted'
  | 'revoked'
  | 'rotation_detected';

// ============================================
// SESIONES Y DISPOSITIVOS
// ============================================

export interface Session {
  id: string;
  userId: string;
  refreshTokenJti: string;
  tokenFamily: string;
  deviceInfo: DeviceInfo;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  lastActivity: Date;
  createdAt: Date;
  expiresAt: Date;
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  os: string;
  browser: string;
  deviceId?: string;
}

// ============================================
// BLACKLIST DE TOKENS
// ============================================

export interface BlacklistedToken {
  jti: string;
  userId: string;
  type: 'access' | 'refresh';
  reason: BlacklistReason;
  blacklistedAt: Date;
  expiresAt: Date;
}

export type BlacklistReason =
  | 'logout'
  | 'password_change'
  | 'security_breach'
  | 'admin_revoke'
  | 'rotation_reuse'
  | 'session_expired';

// ============================================
// LOGIN Y AUTENTICACIÓN
// ============================================

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  deviceInfo?: DeviceInfo;
}

export interface LoginResponse {
  success: boolean;
  tokens?: AuthTokens;
  user?: User;
  requiresTwoFactor?: boolean;
  error?: LoginError;
}

export type LoginError =
  | 'invalid_credentials'
  | 'account_locked'
  | 'account_disabled'
  | 'email_not_verified'
  | 'too_many_attempts'
  | 'two_factor_required';

export interface TwoFactorVerification {
  userId: string;
  code: string;
  method: 'totp' | 'sms' | 'email';
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordReset {
  token: string;
  newPassword: string;
}

// ============================================
// RATE LIMITING
// ============================================

export interface RateLimitConfig {
  windowMs: number;       // Time window in milliseconds
  maxRequests: number;    // Max requests per window
  keyPrefix: string;      // Redis key prefix
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  handler?: (req: any, res: any) => void;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;    // Seconds until reset
  limit: number;
}

export interface RateLimitInfo {
  key: string;
  count: number;
  windowStart: number;
  windowEnd: number;
}

export type RateLimitType =
  | 'global'              // Global rate limit
  | 'per_user'            // Per authenticated user
  | 'per_ip'              // Per IP address
  | 'per_endpoint'        // Per API endpoint
  | 'login_attempts'      // Login attempts
  | 'api_key';            // Per API key

export interface RateLimitRule {
  type: RateLimitType;
  endpoint?: string | RegExp;
  config: RateLimitConfig;
}

// ============================================
// ENCRIPTACIÓN Y ALMACENAMIENTO SEGURO
// ============================================

export interface EncryptedData {
  iv: string;             // Initialization vector (base64)
  data: string;           // Encrypted data (base64)
  tag: string;            // Auth tag for GCM (base64)
  algorithm: string;      // Encryption algorithm used
  version: number;        // Schema version for future migrations
}

export interface SecureStorageConfig {
  encryptionKey?: string;
  keyDerivation: 'pbkdf2' | 'scrypt';
  iterations: number;
  saltLength: number;
}

export interface StoredCredential {
  key: string;
  value: EncryptedData;
  metadata: {
    createdAt: number;
    updatedAt: number;
    expiresAt?: number;
  };
}

// ============================================
// AUDITORÍA DE SEGURIDAD
// ============================================

export interface SecurityAuditLog {
  id: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  action: SecurityAction;
  resource: string;
  resourceId?: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  failureReason?: string;
  metadata?: Record<string, any>;
  riskScore?: number;
}

export type SecurityAction =
  | 'login_attempt'
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'token_refresh'
  | 'token_revoke'
  | 'password_change'
  | 'password_reset_request'
  | 'password_reset'
  | 'two_factor_enable'
  | 'two_factor_disable'
  | 'two_factor_verify'
  | 'session_create'
  | 'session_terminate'
  | 'permission_change'
  | 'api_key_create'
  | 'api_key_revoke'
  | 'rate_limit_exceeded'
  | 'suspicious_activity';

// ============================================
// CONFIGURACIÓN DE SEGURIDAD
// ============================================

export interface SecurityConfig {
  jwt: {
    accessTokenSecret: string;
    refreshTokenSecret: string;
    accessTokenExpiry: number;     // seconds (default: 900 = 15 min)
    refreshTokenExpiry: number;    // seconds (default: 604800 = 7 days)
    issuer: string;
    audience: string;
  };
  password: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    maxAttempts: number;
    lockoutDuration: number;       // seconds
  };
  session: {
    maxConcurrentSessions: number;
    sessionTimeout: number;        // seconds
    extendOnActivity: boolean;
  };
  rateLimit: {
    enabled: boolean;
    rules: RateLimitRule[];
  };
  twoFactor: {
    enabled: boolean;
    methods: ('totp' | 'sms' | 'email')[];
    codeLength: number;
    codeExpiry: number;            // seconds
  };
}

// ============================================
// API KEYS
// ============================================

export interface ApiKey {
  id: string;
  name: string;
  keyHash: string;         // Hashed key (never store plain)
  keyPrefix: string;       // First 8 chars for identification
  userId: string;
  permissions: Permission[];
  rateLimit: RateLimitConfig;
  ipWhitelist?: string[];
  isActive: boolean;
  lastUsed?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

export interface ApiKeyCreateResult {
  apiKey: string;          // Plain key (shown only once)
  keyId: string;
  keyPrefix: string;
}

// ============================================
// RESPUESTAS DE AUTH API
// ============================================

export interface AuthApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta?: {
    timestamp: Date;
    requestId: string;
  };
}

export interface RefreshTokenResponse extends AuthApiResponse<AuthTokens> {
  rotated: boolean;
}

export interface LogoutResponse extends AuthApiResponse<void> {
  sessionsTerminated: number;
}

// ============================================
// ESTADO DE AUTH EN FRONTEND
// ============================================

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastActivity: Date | null;
}

export interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  logout: (allDevices?: boolean) => Promise<void>;
  refreshTokens: () => Promise<boolean>;
  verifyTwoFactor: (verification: TwoFactorVerification) => Promise<LoginResponse>;
  updateUser: (user: Partial<User>) => void;
  clearError: () => void;
  checkAuth: () => Promise<boolean>;
}
