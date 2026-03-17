// services/authService.ts
// Authentication service - connects to backend JWT auth
// SECURITY: No hardcoded credentials. All auth goes through backend API.

// =====================================
// TIPOS
// =====================================

export interface User {
  id: string;
  email: string;
  nombre: string;
  rol: 'admin' | 'operador' | 'viewer';
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
  activo: boolean;
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
  odigo: string;
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
  metadata?: Record<string, any>;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

// =====================================
// CONSTANTES
// =====================================

const CURRENT_USER_KEY = 'litper_current_user';
const SESSION_LOGS_KEY = 'litper_session_logs';
const ACTIVITY_LOGS_KEY = 'litper_activity_logs';
const AUTH_TOKEN_KEY = 'litper_auth_token';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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

const getBrowserInfo = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Otro';
};

// =====================================
// FUNCIONES DE ALMACENAMIENTO (session/activity logs only)
// =====================================

const getSessionLogs = (): SessionLog[] => {
  const saved = localStorage.getItem(SESSION_LOGS_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return [];
    }
  }
  return [];
};

const saveSessionLog = (log: SessionLog): void => {
  const logs = getSessionLogs();
  logs.unshift(log);
  // Mantener solo los últimos 500 registros
  const limited = logs.slice(0, 500);
  localStorage.setItem(SESSION_LOGS_KEY, JSON.stringify(limited));
};

const getActivityLogs = (): ActivityLog[] => {
  const saved = localStorage.getItem(ACTIVITY_LOGS_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return [];
    }
  }
  return [];
};

const saveActivityLog = (log: ActivityLog): void => {
  const logs = getActivityLogs();
  logs.unshift(log);
  // Mantener solo los últimos 1000 registros
  const limited = logs.slice(0, 1000);
  localStorage.setItem(ACTIVITY_LOGS_KEY, JSON.stringify(limited));
};

// =====================================
// FUNCIONES DE AUTENTICACIÓN
// =====================================

/**
 * Iniciar sesión
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const { email, password } = credentials;

  // Validar campos
  if (!email || !password) {
    return { success: false, message: 'Email y contraseña son requeridos' };
  }

  try {
    // Try backend API first
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        message: data.message || 'Credenciales incorrectas',
      };
    }

    const user: User = data.user;
    const token: string = data.token;

    // Cache token and user in localStorage
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

    // Registrar sesión
    saveSessionLog({
      id: generateId(),
      odigo: user.id,
      action: 'login',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      device: getDeviceInfo(),
    });

    // Registrar actividad
    logActivity(user.id, user.email, 'Inicio de sesión', 'Usuario inició sesión exitosamente', 'auth');

    return {
      success: true,
      user,
      token,
      message: 'Inicio de sesión exitoso',
    };
  } catch (error) {
    // Backend unreachable - check if we have a cached session (offline/dev mode)
    // NOTE: This does NOT authenticate - it only restores an existing session
    const cachedUser = getCurrentUser();
    const cachedToken = localStorage.getItem(AUTH_TOKEN_KEY);

    if (cachedUser && cachedToken) {
      return {
        success: true,
        user: cachedUser,
        token: cachedToken,
        message: 'Sesión restaurada (modo offline)',
      };
    }

    return {
      success: false,
      message: 'No se puede conectar al servidor. Intente de nuevo más tarde.',
    };
  }
};

/**
 * Registrar nuevo usuario
 */
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const { email, password, nombre, rol = 'operador' } = data;

  // Validar campos
  if (!email || !password || !nombre) {
    return { success: false, message: 'Todos los campos son requeridos' };
  }

  if (password.length < 6) {
    return { success: false, message: 'La contraseña debe tener al menos 6 caracteres' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, message: 'Email inválido' };
  }

  try {
    // Try backend API first
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, nombre, rol }),
    });

    const responseData = await response.json();

    if (!response.ok || !responseData.success) {
      return {
        success: false,
        message: responseData.message || 'Error al registrar usuario',
      };
    }

    const user: User = responseData.user;
    const token: string = responseData.token;

    // Cache token and user in localStorage
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

    // Registrar sesión
    saveSessionLog({
      id: generateId(),
      odigo: user.id,
      action: 'register',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      device: getDeviceInfo(),
    });

    // Registrar actividad
    logActivity(user.id, user.email, 'Registro', 'Nuevo usuario registrado', 'auth');

    return {
      success: true,
      user,
      token,
      message: 'Registro exitoso',
    };
  } catch (error) {
    return {
      success: false,
      message: 'No se puede conectar al servidor. Intente de nuevo más tarde.',
    };
  }
};

/**
 * Cerrar sesión
 */
export const logout = (): void => {
  const user = getCurrentUser();

  if (user) {
    // Registrar sesión
    saveSessionLog({
      id: generateId(),
      odigo: user.id,
      action: 'logout',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      device: getDeviceInfo(),
    });

    // Registrar actividad
    logActivity(user.id, user.email, 'Cierre de sesión', 'Usuario cerró sesión', 'auth');
  }

  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(CURRENT_USER_KEY);
};

/**
 * Obtener usuario actual
 */
export const getCurrentUser = (): User | null => {
  const saved = localStorage.getItem(CURRENT_USER_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
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
  return !!token && !!user;
};

/**
 * Obtener token
 */
export const getToken = (): string | null => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
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
    const token = getToken();
    const response = await fetch(`${API_URL}/api/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        message: data.message || 'Error al actualizar perfil',
      };
    }

    const updatedUser = data.user || { ...currentUser, ...updates };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));

    logActivity(updatedUser.id, updatedUser.email, 'Actualización de perfil', 'Usuario actualizó su perfil', 'auth');

    return {
      success: true,
      user: updatedUser,
      message: 'Perfil actualizado',
    };
  } catch (error) {
    // Fallback: update locally if backend is unreachable
    const updatedUser = { ...currentUser, ...updates };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));

    logActivity(updatedUser.id, updatedUser.email, 'Actualización de perfil', 'Usuario actualizó su perfil (offline)', 'auth');

    return {
      success: true,
      user: updatedUser,
      message: 'Perfil actualizado (modo offline)',
    };
  }
};

/**
 * Cambiar contraseña
 */
export const changePassword = async (currentPassword: string, newPassword: string): Promise<AuthResponse> => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return { success: false, message: 'No hay sesión activa' };
  }

  if (newPassword.length < 6) {
    return { success: false, message: 'La nueva contraseña debe tener al menos 6 caracteres' };
  }

  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        message: data.message || 'Error al cambiar contraseña',
      };
    }

    logActivity(currentUser.id, currentUser.email, 'Cambio de contraseña', 'Usuario cambió su contraseña', 'auth');

    return {
      success: true,
      message: 'Contraseña actualizada',
    };
  } catch (error) {
    return {
      success: false,
      message: 'No se puede conectar al servidor. Intente de nuevo más tarde.',
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
  metadata?: Record<string, any>
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
  metadata?: Record<string, any>
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
    return logs.filter(l => l.odigo === userId);
  }
  return logs;
};

/**
 * Obtener historial de actividad
 */
export const getUserActivityLogs = (userId?: string): ActivityLog[] => {
  const logs = getActivityLogs();
  if (userId) {
    return logs.filter(l => l.userId === userId);
  }
  return logs;
};

/**
 * Obtener todos los usuarios (solo admin)
 */
export const getAllUsers = async (): Promise<User[]> => {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.rol !== 'admin') {
    return [];
  }

  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/api/auth/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (response.ok && data.users) {
      return data.users;
    }
    return [];
  } catch (error) {
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
    const token = getToken();
    const response = await fetch(`${API_URL}/api/auth/users/toggle-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        message: data.message || 'Error al cambiar estado del usuario',
      };
    }

    logActivity(
      currentUser.id,
      currentUser.email,
      data.activo ? 'Activar usuario' : 'Desactivar usuario',
      `Usuario ${email} ${data.activo ? 'activado' : 'desactivado'}`,
      'admin'
    );

    return {
      success: true,
      message: `Usuario ${data.activo ? 'activado' : 'desactivado'}`,
    };
  } catch (error) {
    return {
      success: false,
      message: 'No se puede conectar al servidor. Intente de nuevo más tarde.',
    };
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
};
