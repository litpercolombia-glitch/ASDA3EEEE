// services/securityService.ts
// Sistema de Seguridad Enterprise - JWT, 2FA, RBAC
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// TYPES
// ============================================
export interface JWTPayload {
  sub: string; // User ID
  email: string;
  role: UserRole;
  permissions: Permission[];
  iat: number; // Issued at
  exp: number; // Expiration
  jti: string; // JWT ID
}

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'operator' | 'viewer' | 'guest';

export type Permission =
  | 'shipments:read'
  | 'shipments:write'
  | 'shipments:delete'
  | 'reports:read'
  | 'reports:generate'
  | 'reports:export'
  | 'users:read'
  | 'users:write'
  | 'users:delete'
  | 'settings:read'
  | 'settings:write'
  | 'analytics:read'
  | 'analytics:advanced'
  | 'admin:access'
  | 'admin:full';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface TwoFactorAuth {
  enabled: boolean;
  method: '2fa_app' | 'sms' | 'email';
  verified: boolean;
  secret?: string;
  backupCodes?: string[];
}

export interface SecuritySession {
  id: string;
  userId: string;
  deviceInfo: {
    browser: string;
    os: string;
    ip: string;
    location?: string;
  };
  createdAt: Date;
  lastActivity: Date;
  isCurrentSession: boolean;
}

// ============================================
// ROLE PERMISSIONS MATRIX
// ============================================
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    'shipments:read', 'shipments:write', 'shipments:delete',
    'reports:read', 'reports:generate', 'reports:export',
    'users:read', 'users:write', 'users:delete',
    'settings:read', 'settings:write',
    'analytics:read', 'analytics:advanced',
    'admin:access', 'admin:full',
  ],
  admin: [
    'shipments:read', 'shipments:write', 'shipments:delete',
    'reports:read', 'reports:generate', 'reports:export',
    'users:read', 'users:write',
    'settings:read', 'settings:write',
    'analytics:read', 'analytics:advanced',
    'admin:access',
  ],
  manager: [
    'shipments:read', 'shipments:write',
    'reports:read', 'reports:generate', 'reports:export',
    'users:read',
    'settings:read',
    'analytics:read', 'analytics:advanced',
  ],
  operator: [
    'shipments:read', 'shipments:write',
    'reports:read', 'reports:generate',
    'analytics:read',
  ],
  viewer: [
    'shipments:read',
    'reports:read',
    'analytics:read',
  ],
  guest: [
    'shipments:read',
  ],
};

// ============================================
// JWT UTILITIES (Simulated - Frontend only)
// ============================================
const generateJTI = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const base64UrlEncode = (str: string): string => {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

const base64UrlDecode = (str: string): string => {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  return atob(base64);
};

export const generateAccessToken = (
  userId: string,
  email: string,
  role: UserRole,
  expiresInMinutes: number = 15
): string => {
  const now = Math.floor(Date.now() / 1000);
  const payload: JWTPayload = {
    sub: userId,
    email,
    role,
    permissions: ROLE_PERMISSIONS[role],
    iat: now,
    exp: now + expiresInMinutes * 60,
    jti: generateJTI(),
  };

  // Simulated JWT structure: header.payload.signature
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = base64UrlEncode(`simulated-signature-${payload.jti}`);

  return `${header}.${encodedPayload}.${signature}`;
};

export const generateRefreshToken = (userId: string, expiresInDays: number = 7): string => {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: userId,
    type: 'refresh',
    iat: now,
    exp: now + expiresInDays * 24 * 60 * 60,
    jti: generateJTI(),
  };

  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = base64UrlEncode(`simulated-refresh-signature-${payload.jti}`);

  return `${header}.${encodedPayload}.${signature}`;
};

export const decodeToken = (token: string): JWTPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(base64UrlDecode(parts[1]));
    return payload as JWTPayload;
  } catch {
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  const payload = decodeToken(token);
  if (!payload) return true;

  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
};

export const getTokenTimeRemaining = (token: string): number => {
  const payload = decodeToken(token);
  if (!payload) return 0;

  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, (payload.exp - now) * 1000);
};

// ============================================
// 2FA UTILITIES
// ============================================
export const generate2FASecret = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < 16; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
};

export const generateBackupCodes = (count: number = 8): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substr(2, 8).toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
};

export const verify2FACode = (inputCode: string, secret: string): boolean => {
  // Simulated TOTP verification
  // In production, use a proper TOTP library
  const validCodes = ['123456', '000000', inputCode]; // For demo purposes
  return validCodes.includes(inputCode);
};

export const generateQRCodeURL = (secret: string, email: string): string => {
  const issuer = 'LITPER%20PRO';
  return `otpauth://totp/${issuer}:${encodeURIComponent(email)}?secret=${secret}&issuer=${issuer}`;
};

// ============================================
// RBAC UTILITIES
// ============================================
export const hasPermission = (
  userPermissions: Permission[],
  requiredPermission: Permission
): boolean => {
  return userPermissions.includes(requiredPermission);
};

export const hasAnyPermission = (
  userPermissions: Permission[],
  requiredPermissions: Permission[]
): boolean => {
  return requiredPermissions.some((p) => userPermissions.includes(p));
};

export const hasAllPermissions = (
  userPermissions: Permission[],
  requiredPermissions: Permission[]
): boolean => {
  return requiredPermissions.every((p) => userPermissions.includes(p));
};

export const canAccessRoute = (role: UserRole, route: string): boolean => {
  const routePermissions: Record<string, Permission[]> = {
    '/admin': ['admin:access'],
    '/users': ['users:read'],
    '/settings': ['settings:read'],
    '/reports': ['reports:read'],
    '/analytics': ['analytics:read'],
  };

  const required = routePermissions[route];
  if (!required) return true;

  return hasAnyPermission(ROLE_PERMISSIONS[role], required);
};

// ============================================
// SECURITY STORE
// ============================================
interface SecurityState {
  accessToken: string | null;
  refreshToken: string | null;
  tokenPayload: JWTPayload | null;
  twoFactorAuth: TwoFactorAuth | null;
  sessions: SecuritySession[];
  rateLimitRemaining: number;

  // Actions
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearTokens: () => void;
  refreshAccessToken: () => Promise<boolean>;
  enable2FA: (method: TwoFactorAuth['method']) => TwoFactorAuth;
  disable2FA: () => void;
  verify2FA: (code: string) => boolean;
  addSession: (session: SecuritySession) => void;
  revokeSession: (sessionId: string) => void;
  checkPermission: (permission: Permission) => boolean;
  checkRole: (minRole: UserRole) => boolean;
}

const ROLE_HIERARCHY: UserRole[] = ['guest', 'viewer', 'operator', 'manager', 'admin', 'super_admin'];

export const useSecurityStore = create<SecurityState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      tokenPayload: null,
      twoFactorAuth: null,
      sessions: [],
      rateLimitRemaining: 100,

      setTokens: (accessToken, refreshToken) => {
        const payload = decodeToken(accessToken);
        set({
          accessToken,
          refreshToken,
          tokenPayload: payload,
        });
      },

      clearTokens: () => {
        set({
          accessToken: null,
          refreshToken: null,
          tokenPayload: null,
        });
      },

      refreshAccessToken: async () => {
        const { refreshToken, tokenPayload } = get();
        if (!refreshToken || !tokenPayload) return false;

        // Check if refresh token is valid
        if (isTokenExpired(refreshToken)) {
          get().clearTokens();
          return false;
        }

        // Generate new access token
        const newAccessToken = generateAccessToken(
          tokenPayload.sub,
          tokenPayload.email,
          tokenPayload.role
        );

        set({
          accessToken: newAccessToken,
          tokenPayload: decodeToken(newAccessToken),
        });

        return true;
      },

      enable2FA: (method) => {
        const secret = generate2FASecret();
        const backupCodes = generateBackupCodes();

        const twoFactorAuth: TwoFactorAuth = {
          enabled: true,
          method,
          verified: false,
          secret,
          backupCodes,
        };

        set({ twoFactorAuth });
        return twoFactorAuth;
      },

      disable2FA: () => {
        set({ twoFactorAuth: null });
      },

      verify2FA: (code) => {
        const { twoFactorAuth } = get();
        if (!twoFactorAuth?.secret) return false;

        // Check backup codes
        if (twoFactorAuth.backupCodes?.includes(code)) {
          set({
            twoFactorAuth: {
              ...twoFactorAuth,
              verified: true,
              backupCodes: twoFactorAuth.backupCodes.filter((c) => c !== code),
            },
          });
          return true;
        }

        // Verify TOTP code
        const isValid = verify2FACode(code, twoFactorAuth.secret);
        if (isValid) {
          set({
            twoFactorAuth: {
              ...twoFactorAuth,
              verified: true,
            },
          });
        }
        return isValid;
      },

      addSession: (session) => {
        set((state) => ({
          sessions: [session, ...state.sessions].slice(0, 10),
        }));
      },

      revokeSession: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
        }));
      },

      checkPermission: (permission) => {
        const { tokenPayload } = get();
        if (!tokenPayload) return false;
        return hasPermission(tokenPayload.permissions, permission);
      },

      checkRole: (minRole) => {
        const { tokenPayload } = get();
        if (!tokenPayload) return false;

        const userRoleIndex = ROLE_HIERARCHY.indexOf(tokenPayload.role);
        const minRoleIndex = ROLE_HIERARCHY.indexOf(minRole);

        return userRoleIndex >= minRoleIndex;
      },
    }),
    {
      name: 'litper-security',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        twoFactorAuth: state.twoFactorAuth ? {
          enabled: state.twoFactorAuth.enabled,
          method: state.twoFactorAuth.method,
          verified: false, // Don't persist verified state
        } : null,
      }),
    }
  )
);

// ============================================
// SECURITY HOOKS
// ============================================
export const usePermission = (permission: Permission): boolean => {
  const checkPermission = useSecurityStore((state) => state.checkPermission);
  return checkPermission(permission);
};

export const useRole = (minRole: UserRole): boolean => {
  const checkRole = useSecurityStore((state) => state.checkRole);
  return checkRole(minRole);
};

// ============================================
// RATE LIMITING
// ============================================
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimits = new Map<string, RateLimitEntry>();

export const checkRateLimit = (
  key: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetIn: number } => {
  const now = Date.now();
  const entry = rateLimits.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetIn: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, resetIn: entry.resetAt - now };
};

// ============================================
// ENCRYPTION UTILITIES (Simulated)
// ============================================
export const encryptData = (data: string, key: string = 'default-key'): string => {
  // Simulated AES-256 encryption
  // In production, use Web Crypto API or a proper encryption library
  const encoded = btoa(data);
  return `encrypted:${encoded}`;
};

export const decryptData = (encryptedData: string, key: string = 'default-key'): string | null => {
  try {
    if (!encryptedData.startsWith('encrypted:')) return null;
    const encoded = encryptedData.replace('encrypted:', '');
    return atob(encoded);
  } catch {
    return null;
  }
};

// ============================================
// EXPORTS
// ============================================
export default {
  generateAccessToken,
  generateRefreshToken,
  decodeToken,
  isTokenExpired,
  getTokenTimeRemaining,
  generate2FASecret,
  generateBackupCodes,
  verify2FACode,
  generateQRCodeURL,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessRoute,
  checkRateLimit,
  encryptData,
  decryptData,
  ROLE_PERMISSIONS,
};
