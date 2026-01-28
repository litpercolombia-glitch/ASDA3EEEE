/**
 * Secure Auth Store
 *
 * Zustand store mejorado para autenticación segura con JWT.
 * Integra: refresh tokens, almacenamiento encriptado, rate limiting.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  User,
  AuthTokens,
  LoginCredentials,
  LoginResponse,
  Permission,
  UserRole,
} from '../types/security.types';
import { jwtService } from '../services/security/jwtService';
import { encryptionService } from '../services/security/encryptionService';
import { rateLimiter } from '../services/security/rateLimitService';

// ============================================
// CONSTANTES
// ============================================

const TOKEN_REFRESH_THRESHOLD = 60; // segundos antes de expirar para renovar
const STORAGE_KEY_TOKENS = 'auth_tokens';
const STORAGE_KEY_USER = 'auth_user';

// ============================================
// TIPOS
// ============================================

interface SecureAuthState {
  // Estado
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  lastActivity: Date | null;

  // Refresh timer
  _refreshTimer: ReturnType<typeof setTimeout> | null;

  // Acciones principales
  initialize: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  logout: (allDevices?: boolean) => Promise<void>;
  refreshTokens: () => Promise<boolean>;

  // Gestión de estado
  updateUser: (updates: Partial<User>) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  checkAuth: () => Promise<boolean>;

  // Permisos
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  hasRole: (role: UserRole) => boolean;

  // Sesiones
  getActiveSessions: () => { id: string; device: string; lastActivity: Date }[];
  terminateSession: (sessionId: string) => Promise<boolean>;

  // Internal
  _scheduleRefresh: () => void;
  _clearRefresh: () => void;
}

// ============================================
// MOCK API - Reemplazar con API real
// ============================================

const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'admin@litper.co': {
    password: 'Admin123!',
    user: {
      id: 'usr_001',
      email: 'admin@litper.co',
      name: 'Admin LITPER',
      role: 'admin',
      permissions: [
        'admin:full',
        'dashboard:view',
        'dashboard:edit',
        'orders:view',
        'orders:create',
        'orders:edit',
        'orders:delete',
        'shipments:view',
        'shipments:create',
        'shipments:edit',
        'inventory:view',
        'inventory:edit',
        'reports:view',
        'reports:export',
        'settings:view',
        'settings:edit',
        'users:view',
        'users:create',
        'users:edit',
      ],
      isActive: true,
      emailVerified: true,
      twoFactorEnabled: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
    },
  },
  'operador@litper.co': {
    password: 'Operador123!',
    user: {
      id: 'usr_002',
      email: 'operador@litper.co',
      name: 'Operador LITPER',
      role: 'operator',
      permissions: [
        'dashboard:view',
        'orders:view',
        'orders:create',
        'shipments:view',
        'shipments:create',
        'inventory:view',
      ],
      isActive: true,
      emailVerified: true,
      twoFactorEnabled: false,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date(),
    },
  },
  'viewer@litper.co': {
    password: 'Viewer123!',
    user: {
      id: 'usr_003',
      email: 'viewer@litper.co',
      name: 'Viewer LITPER',
      role: 'viewer',
      permissions: ['dashboard:view', 'orders:view', 'shipments:view', 'reports:view'],
      isActive: true,
      emailVerified: true,
      twoFactorEnabled: false,
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date(),
    },
  },
};

async function apiLogin(
  email: string,
  password: string,
  ip: string = '127.0.0.1'
): Promise<{ success: boolean; user?: User; error?: string }> {
  // Verificar rate limit
  const rateCheck = await rateLimiter.checkLoginLimit(ip);
  if (!rateCheck.allowed) {
    return {
      success: false,
      error: `Demasiados intentos. Intenta de nuevo en ${rateCheck.retryAfter} segundos.`,
    };
  }

  // Simular delay de red
  await new Promise((r) => setTimeout(r, 300));

  const entry = MOCK_USERS[email.toLowerCase()];

  if (!entry || entry.password !== password) {
    return { success: false, error: 'Credenciales inválidas' };
  }

  if (!entry.user.isActive) {
    return { success: false, error: 'Cuenta desactivada' };
  }

  return { success: true, user: entry.user };
}

async function apiGetUser(userId: string): Promise<User | null> {
  for (const entry of Object.values(MOCK_USERS)) {
    if (entry.user.id === userId) {
      return entry.user;
    }
  }
  return null;
}

// ============================================
// STORE
// ============================================

export const useSecureAuthStore = create<SecureAuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      error: null,
      lastActivity: null,
      _refreshTimer: null,

      // ============================================
      // INICIALIZACIÓN
      // ============================================

      initialize: async () => {
        if (get().isInitialized) return;

        set({ isLoading: true });

        try {
          // Inicializar servicio de encriptación
          await encryptionService.initialize();

          // Migrar datos existentes si es necesario
          await encryptionService.migrateAuthTokens();

          // Intentar restaurar sesión
          const storedTokens = await encryptionService.getSecure<AuthTokens>(STORAGE_KEY_TOKENS);

          if (storedTokens) {
            // Validar access token
            const validation = await jwtService.validateAccessToken(storedTokens.accessToken);

            if (validation.valid && validation.payload) {
              const userId = (validation.payload as any).sub;
              const user = await apiGetUser(userId);

              if (user) {
                set({
                  user,
                  tokens: storedTokens,
                  isAuthenticated: true,
                  lastActivity: new Date(),
                });

                get()._scheduleRefresh();
              }
            } else {
              // Token expirado, intentar refresh
              const refreshed = await get().refreshTokens();
              if (!refreshed) {
                // Limpiar sesión inválida
                encryptionService.removeSecure(STORAGE_KEY_TOKENS);
                encryptionService.removeSecure(STORAGE_KEY_USER);
              }
            }
          }
        } catch (error) {
          console.error('Error inicializando auth:', error);
        } finally {
          set({ isLoading: false, isInitialized: true });
        }
      },

      // ============================================
      // LOGIN
      // ============================================

      login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
        set({ isLoading: true, error: null });

        try {
          const result = await apiLogin(credentials.email, credentials.password);

          if (!result.success || !result.user) {
            set({ isLoading: false, error: result.error || 'Error de autenticación' });
            return { success: false, error: 'invalid_credentials' };
          }

          // Generar tokens JWT
          const tokens = await jwtService.generateTokenPair(result.user, credentials.deviceInfo);

          // Almacenar de forma segura
          await encryptionService.setSecure(STORAGE_KEY_TOKENS, tokens);
          await encryptionService.setSecure(STORAGE_KEY_USER, result.user);

          set({
            user: result.user,
            tokens,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            lastActivity: new Date(),
          });

          // Programar refresh automático
          get()._scheduleRefresh();

          return { success: true, tokens, user: result.user };
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Error de conexión';
          set({ isLoading: false, error: msg });
          return { success: false, error: 'invalid_credentials' };
        }
      },

      // ============================================
      // LOGOUT
      // ============================================

      logout: async (allDevices: boolean = false) => {
        const { user, tokens, _clearRefresh } = get();

        try {
          if (tokens && user) {
            if (allDevices) {
              await jwtService.revokeAllUserTokens(user.id, 'logout');
            } else {
              const payload = jwtService.decodeToken(tokens.refreshToken);
              if (payload && (payload as any).family) {
                await jwtService.revokeTokenFamily((payload as any).family, 'logout');
              }
            }
          }
        } catch (error) {
          console.error('Error en logout:', error);
        }

        // Limpiar almacenamiento seguro
        encryptionService.removeSecure(STORAGE_KEY_TOKENS);
        encryptionService.removeSecure(STORAGE_KEY_USER);

        // Cancelar timer de refresh
        _clearRefresh();

        // Limpiar estado
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          error: null,
          lastActivity: null,
        });
      },

      // ============================================
      // REFRESH TOKENS
      // ============================================

      refreshTokens: async (): Promise<boolean> => {
        const { tokens, user } = get();

        if (!tokens || !user) return false;

        try {
          const newTokens = await jwtService.refreshTokens(tokens.refreshToken, user);

          if (!newTokens) {
            await get().logout();
            return false;
          }

          await encryptionService.setSecure(STORAGE_KEY_TOKENS, newTokens);

          set({
            tokens: newTokens,
            lastActivity: new Date(),
          });

          get()._scheduleRefresh();

          return true;
        } catch (error) {
          console.error('Error renovando tokens:', error);
          await get().logout();
          return false;
        }
      },

      // ============================================
      // TIMER DE REFRESH
      // ============================================

      _scheduleRefresh: () => {
        get()._clearRefresh();

        const { tokens } = get();
        if (!tokens) return;

        const expiresAt = new Date(tokens.accessTokenExpiry).getTime();
        const now = Date.now();
        const refreshIn = Math.max(0, expiresAt - now - TOKEN_REFRESH_THRESHOLD * 1000);

        const timer = setTimeout(() => {
          get().refreshTokens();
        }, refreshIn);

        set({ _refreshTimer: timer });
      },

      _clearRefresh: () => {
        const { _refreshTimer } = get();
        if (_refreshTimer) {
          clearTimeout(_refreshTimer);
          set({ _refreshTimer: null });
        }
      },

      // ============================================
      // GESTIÓN DE ESTADO
      // ============================================

      updateUser: (updates: Partial<User>) => {
        const { user } = get();
        if (!user) return;

        const updatedUser = { ...user, ...updates, updatedAt: new Date() };
        set({ user: updatedUser });
        encryptionService.setSecure(STORAGE_KEY_USER, updatedUser);
      },

      setError: (error: string | null) => set({ error }),

      clearError: () => set({ error: null }),

      checkAuth: async (): Promise<boolean> => {
        const { tokens, refreshTokens } = get();

        if (!tokens) return false;

        const validation = await jwtService.validateAccessToken(tokens.accessToken);

        if (!validation.valid) {
          return await refreshTokens();
        }

        if (jwtService.isTokenExpiringSoon(tokens.accessToken, TOKEN_REFRESH_THRESHOLD)) {
          return await refreshTokens();
        }

        return true;
      },

      // ============================================
      // PERMISOS
      // ============================================

      hasPermission: (permission: Permission): boolean => {
        const { user } = get();
        if (!user) return false;

        if (user.role === 'super_admin' || user.permissions.includes('admin:full')) {
          return true;
        }

        return user.permissions.includes(permission);
      },

      hasAnyPermission: (permissions: Permission[]): boolean => {
        return permissions.some((p) => get().hasPermission(p));
      },

      hasAllPermissions: (permissions: Permission[]): boolean => {
        return permissions.every((p) => get().hasPermission(p));
      },

      hasRole: (role: UserRole): boolean => {
        const { user } = get();
        if (!user) return false;

        const roleHierarchy: Record<UserRole, number> = {
          super_admin: 100,
          admin: 80,
          manager: 60,
          operator: 40,
          viewer: 20,
          api_client: 10,
        };

        return roleHierarchy[user.role] >= roleHierarchy[role];
      },

      // ============================================
      // SESIONES
      // ============================================

      getActiveSessions: () => {
        const { user } = get();
        if (!user) return [];

        const sessions = jwtService.getActiveSessions(user.id);
        return sessions.map((s) => ({
          id: s.id,
          device: `${s.deviceInfo.type} - ${s.deviceInfo.browser} (${s.deviceInfo.os})`,
          lastActivity: s.lastActivity,
        }));
      },

      terminateSession: async (sessionId: string): Promise<boolean> => {
        return jwtService.terminateSession(sessionId);
      },
    }),
    {
      name: 'secure-auth-store',
      partialize: () => ({}), // No persistir - usar almacenamiento seguro
    }
  )
);

// ============================================
// SELECTORES
// ============================================

export const selectUser = (state: SecureAuthState) => state.user;
export const selectIsAuthenticated = (state: SecureAuthState) => state.isAuthenticated;
export const selectIsLoading = (state: SecureAuthState) => state.isLoading;
export const selectError = (state: SecureAuthState) => state.error;
export const selectUserRole = (state: SecureAuthState) => state.user?.role;
export const selectPermissions = (state: SecureAuthState) => state.user?.permissions || [];

// ============================================
// HOOKS
// ============================================

export function useAuth() {
  const store = useSecureAuthStore();
  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: store.error,
    login: store.login,
    logout: store.logout,
    clearError: store.clearError,
  };
}

export function usePermissions() {
  const store = useSecureAuthStore();
  return {
    hasPermission: store.hasPermission,
    hasAnyPermission: store.hasAnyPermission,
    hasAllPermissions: store.hasAllPermissions,
    hasRole: store.hasRole,
    permissions: store.user?.permissions || [],
    role: store.user?.role,
  };
}

export default useSecureAuthStore;
