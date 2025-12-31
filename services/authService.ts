// services/authService.ts
// Sistema de Autenticación SEGURO
// ===============================
//
// IMPORTANTE: Este servicio usa el backend para autenticación.
// - NO almacena passwords en el cliente
// - NO hace hash de passwords en el cliente
// - Solo almacena JWT tokens (corta duración)
// - Refresh tokens rotados automáticamente

// =====================================
// TIPOS
// =====================================

export interface User {
  id: string;
  email: string;
  nombre: string;
  rol: 'admin' | 'operador' | 'viewer';
  avatar?: string;
  activo: boolean;
  must_change_password?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  nombre: string;
  rol?: 'admin' | 'operador' | 'viewer';
}

export interface SessionLog {
  id: string;
  userId: string;
  action: 'login' | 'logout' | 'register' | 'password_reset';
  timestamp: string;
  ip?: string;
  userAgent?: string;
  device?: string;
  location?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  module: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

// =====================================
// CONSTANTES
// =====================================

const AUTH_TOKEN_KEY = 'litper_auth_token';
const REFRESH_TOKEN_KEY = 'litper_refresh_token';
const CURRENT_USER_KEY = 'litper_current_user';
const TOKEN_EXPIRY_KEY = 'litper_token_expiry';

// URL del backend API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// =====================================
// FUNCIONES DE UTILIDAD
// =====================================

const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const getDeviceInfo = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Mobile')) return 'Móvil';
  if (ua.includes('Tablet')) return 'Tablet';
  return 'Desktop';
};

// Obtener headers con token
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// =====================================
// MANEJO DE TOKENS
// =====================================

const saveTokens = (response: TokenResponse): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, response.access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(response.user));

  // Guardar tiempo de expiración
  const expiryTime = Date.now() + response.expires_in * 1000;
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
};

const clearTokens = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(CURRENT_USER_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
};

const isTokenExpired = (): boolean => {
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiry) return true;

  // Refrescar 1 minuto antes de que expire
  return Date.now() > parseInt(expiry) - 60000;
};

// =====================================
// LOGS LOCALES (para actividad en frontend)
// =====================================

const SESSION_LOGS_KEY = 'litper_session_logs';
const ACTIVITY_LOGS_KEY = 'litper_activity_logs';

const getSessionLogs = (): SessionLog[] => {
  const saved = localStorage.getItem(SESSION_LOGS_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }
  return [];
};

const saveSessionLog = (log: SessionLog): void => {
  const logs = getSessionLogs();
  logs.unshift(log);
  const limited = logs.slice(0, 100);
  localStorage.setItem(SESSION_LOGS_KEY, JSON.stringify(limited));
};

const getActivityLogs = (): ActivityLog[] => {
  const saved = localStorage.getItem(ACTIVITY_LOGS_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }
  return [];
};

const saveActivityLog = (log: ActivityLog): void => {
  const logs = getActivityLogs();
  logs.unshift(log);
  const limited = logs.slice(0, 200);
  localStorage.setItem(ACTIVITY_LOGS_KEY, JSON.stringify(limited));
};

// =====================================
// FUNCIONES DE AUTENTICACIÓN
// =====================================

/**
 * Iniciar sesión
 * Envía credenciales al backend, recibe JWT tokens
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const { email, password } = credentials;

  if (!email || !password) {
    return { success: false, message: 'Email y contraseña son requeridos' };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Error de conexión' }));
      return {
        success: false,
        message: error.detail || 'Credenciales inválidas',
      };
    }

    const data: TokenResponse = await response.json();

    // Guardar tokens
    saveTokens(data);

    // Registrar sesión local
    saveSessionLog({
      id: generateId(),
      userId: data.user.id,
      action: 'login',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      device: getDeviceInfo(),
    });

    return {
      success: true,
      user: data.user,
      token: data.access_token,
      message: 'Inicio de sesión exitoso',
    };
  } catch (error) {
    console.error('Error en login:', error);
    return {
      success: false,
      message: 'Error de conexión con el servidor',
    };
  }
};

/**
 * Registrar nuevo usuario
 */
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const { email, password, nombre, rol = 'operador' } = data;

  if (!email || !password || !nombre) {
    return { success: false, message: 'Todos los campos son requeridos' };
  }

  if (password.length < 8) {
    return { success: false, message: 'La contraseña debe tener al menos 8 caracteres' };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, nombre, rol }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Error de registro' }));
      return {
        success: false,
        message: error.detail || 'Error al registrar usuario',
      };
    }

    const tokenResponse: TokenResponse = await response.json();

    // Guardar tokens
    saveTokens(tokenResponse);

    // Registrar sesión
    saveSessionLog({
      id: generateId(),
      userId: tokenResponse.user.id,
      action: 'register',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      device: getDeviceInfo(),
    });

    return {
      success: true,
      user: tokenResponse.user,
      token: tokenResponse.access_token,
      message: 'Registro exitoso',
    };
  } catch (error) {
    console.error('Error en registro:', error);
    return {
      success: false,
      message: 'Error de conexión con el servidor',
    };
  }
};

/**
 * Refrescar tokens
 */
export const refreshTokens = async (): Promise<boolean> => {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

  if (!refreshToken) {
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      // Refresh token inválido o expirado
      clearTokens();
      return false;
    }

    const data: TokenResponse = await response.json();
    saveTokens(data);
    return true;
  } catch (error) {
    console.error('Error refrescando tokens:', error);
    return false;
  }
};

/**
 * Cerrar sesión
 */
export const logout = async (): Promise<void> => {
  const user = getCurrentUser();

  try {
    // Notificar al backend
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  } catch {
    // Continuar con logout local aunque falle el backend
  }

  if (user) {
    saveSessionLog({
      id: generateId(),
      userId: user.id,
      action: 'logout',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      device: getDeviceInfo(),
    });
  }

  clearTokens();
};

/**
 * Obtener usuario actual
 */
export const getCurrentUser = (): User | null => {
  const saved = localStorage.getItem(CURRENT_USER_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
  return null;
};

/**
 * Verificar si está autenticado
 */
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const user = getCurrentUser();

  if (!token || !user) {
    return false;
  }

  // Si el token está por expirar, intentar refrescar
  if (isTokenExpired()) {
    // Hacer refresh en background
    refreshTokens().then((success) => {
      if (!success) {
        clearTokens();
      }
    });
  }

  return true;
};

/**
 * Obtener token
 */
export const getToken = (): string | null => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

/**
 * Cambiar contraseña
 */
export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<AuthResponse> => {
  if (newPassword.length < 8) {
    return { success: false, message: 'La nueva contraseña debe tener al menos 8 caracteres' };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Error' }));
      return {
        success: false,
        message: error.detail || 'Error al cambiar contraseña',
      };
    }

    // Limpiar tokens para forzar re-login
    clearTokens();

    return {
      success: true,
      message: 'Contraseña actualizada. Por favor inicie sesión nuevamente.',
    };
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    return {
      success: false,
      message: 'Error de conexión con el servidor',
    };
  }
};

/**
 * Actualizar perfil de usuario
 */
export const updateProfile = async (updates: Partial<User>): Promise<AuthResponse> => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return { success: false, message: 'No hay sesión activa' };
  }

  try {
    // Por ahora actualizamos solo localmente
    // TODO: Agregar endpoint backend para actualizar perfil
    const updatedUser = { ...currentUser, ...updates };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));

    logCurrentUserActivity('Actualización de perfil', 'Usuario actualizó su perfil', 'auth');

    return {
      success: true,
      user: updatedUser,
      message: 'Perfil actualizado',
    };
  } catch {
    return {
      success: false,
      message: 'Error actualizando perfil',
    };
  }
};

// =====================================
// FUNCIONES DE ACTIVIDAD
// =====================================

/**
 * Registrar actividad
 */
export const logActivity = (
  userId: string,
  userEmail: string,
  action: string,
  details: string,
  module: string,
  metadata?: Record<string, unknown>
): void => {
  const log: ActivityLog = {
    id: generateId(),
    userId,
    userEmail,
    action,
    details,
    module,
    timestamp: new Date().toISOString(),
    metadata,
  };
  saveActivityLog(log);
};

/**
 * Registrar actividad del usuario actual
 */
export const logCurrentUserActivity = (
  action: string,
  details: string,
  module: string,
  metadata?: Record<string, unknown>
): void => {
  const user = getCurrentUser();
  if (user) {
    logActivity(user.id, user.email, action, details, module, metadata);
  }
};

/**
 * Obtener historial de sesiones de un usuario
 */
export const getUserSessionLogs = (userId?: string): SessionLog[] => {
  const logs = getSessionLogs();
  if (userId) {
    return logs.filter((l) => l.userId === userId);
  }
  return logs;
};

/**
 * Obtener historial de actividad
 */
export const getUserActivityLogs = (userId?: string): ActivityLog[] => {
  const logs = getActivityLogs();
  if (userId) {
    return logs.filter((l) => l.userId === userId);
  }
  return logs;
};

/**
 * Obtener todos los usuarios (solo admin, desde backend)
 */
export const getAllUsers = async (): Promise<User[]> => {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.rol !== 'admin') {
    return [];
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/users`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      return [];
    }

    return await response.json();
  } catch {
    return [];
  }
};

/**
 * Activar/desactivar usuario (solo admin)
 */
export const toggleUserStatus = async (email: string): Promise<AuthResponse> => {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.rol !== 'admin') {
    return { success: false, message: 'No tienes permisos para esta acción' };
  }

  try {
    // Primero obtener el user_id del email
    const users = await getAllUsers();
    const targetUser = users.find((u) => u.email === email);

    if (!targetUser) {
      return { success: false, message: 'Usuario no encontrado' };
    }

    const response = await fetch(
      `${API_BASE_URL}/api/auth/users/${targetUser.id}/toggle-active`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Error' }));
      return { success: false, message: error.detail || 'Error' };
    }

    const result = await response.json();
    return {
      success: true,
      message: result.message,
    };
  } catch {
    return { success: false, message: 'Error de conexión' };
  }
};

export default {
  login,
  register,
  logout,
  getCurrentUser,
  isAuthenticated,
  getToken,
  updateProfile,
  changePassword,
  logActivity,
  logCurrentUserActivity,
  getUserSessionLogs,
  getUserActivityLogs,
  getAllUsers,
  toggleUserStatus,
  refreshTokens,
};
