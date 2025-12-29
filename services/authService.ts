// services/authService.ts
// Sistema de Autenticación SEGURO con Cookies httpOnly
// =====================================================
//
// IMPORTANTE: Los tokens se manejan exclusivamente en cookies httpOnly.
// - El frontend NUNCA tiene acceso directo a los tokens
// - Las cookies se envían automáticamente con `credentials: 'include'`
// - El backend controla la expiración y revocación

// =====================================
// TIPOS
// =====================================

export interface User {
  id: string;
  email: string;
  nombre: string;
  rol: 'admin' | 'operador' | 'viewer';
  avatar?: string;
  activo?: boolean;
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
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  message?: string;
}

export interface AuthStatus {
  authenticated: boolean;
  user?: User;
}

// =====================================
// CONFIGURACIÓN
// =====================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Cache del usuario actual (solo datos, no tokens)
let _currentUser: User | null = null;
let _authChecked = false;

// =====================================
// HELPERS
// =====================================

/**
 * Realiza fetch con cookies incluidas automáticamente
 */
async function authFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    credentials: 'include', // IMPORTANTE: Envía cookies httpOnly
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // Si el token expiró, intentar refrescar
  if (response.status === 401 && !endpoint.includes('/refresh') && !endpoint.includes('/login')) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      // Reintentar la petición original
      return fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
    }
  }

  return response;
}

// =====================================
// FUNCIONES DE AUTENTICACIÓN
// =====================================

/**
 * Verifica el estado de autenticación
 * Llama al backend que lee las cookies httpOnly
 */
export async function checkAuthStatus(): Promise<AuthStatus> {
  try {
    const response = await authFetch('/api/auth/status');

    if (!response.ok) {
      _currentUser = null;
      _authChecked = true;
      return { authenticated: false };
    }

    const data = await response.json();

    if (data.authenticated && data.user) {
      _currentUser = data.user;
    } else {
      _currentUser = null;
    }

    _authChecked = true;
    return data;
  } catch (error) {
    console.error('Error verificando autenticación:', error);
    _currentUser = null;
    _authChecked = true;
    return { authenticated: false };
  }
}

/**
 * Iniciar sesión
 * El backend establece cookies httpOnly en la respuesta
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const { email, password } = credentials;

  if (!email || !password) {
    return { success: false, message: 'Email y contraseña son requeridos' };
  }

  try {
    const response = await authFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.detail || 'Credenciales inválidas',
      };
    }

    // El backend estableció las cookies, guardamos solo el usuario
    _currentUser = data.user;
    _authChecked = true;

    return {
      success: true,
      user: data.user,
      message: 'Inicio de sesión exitoso',
    };
  } catch (error) {
    console.error('Error en login:', error);
    return {
      success: false,
      message: 'Error de conexión con el servidor',
    };
  }
}

/**
 * Registrar nuevo usuario
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  const { email, password, nombre } = data;

  if (!email || !password || !nombre) {
    return { success: false, message: 'Todos los campos son requeridos' };
  }

  if (password.length < 8) {
    return { success: false, message: 'La contraseña debe tener al menos 8 caracteres' };
  }

  try {
    const response = await authFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, nombre }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: responseData.detail || 'Error al registrar',
      };
    }

    _currentUser = responseData.user;
    _authChecked = true;

    return {
      success: true,
      user: responseData.user,
      message: 'Registro exitoso',
    };
  } catch (error) {
    console.error('Error en registro:', error);
    return {
      success: false,
      message: 'Error de conexión con el servidor',
    };
  }
}

/**
 * Refrescar tokens
 * El backend lee el refresh token de las cookies y establece nuevas cookies
 */
export async function refreshTokens(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      _currentUser = null;
      return false;
    }

    const data = await response.json();
    _currentUser = data.user;
    return true;
  } catch (error) {
    console.error('Error refrescando tokens:', error);
    _currentUser = null;
    return false;
  }
}

/**
 * Cerrar sesión
 * El backend revoca el refresh token y limpia las cookies
 */
export async function logout(): Promise<void> {
  try {
    await authFetch('/api/auth/logout', {
      method: 'POST',
    });
  } catch (error) {
    console.error('Error en logout:', error);
  } finally {
    _currentUser = null;
    _authChecked = false;

    // Limpiar cualquier dato legacy de localStorage
    localStorage.removeItem('litper_auth_token');
    localStorage.removeItem('litper_refresh_token');
    localStorage.removeItem('litper_current_user');
    localStorage.removeItem('litper_token_expiry');
  }
}

/**
 * Obtener usuario actual (desde cache o verificar con backend)
 */
export function getCurrentUser(): User | null {
  return _currentUser;
}

/**
 * Obtener usuario actual (async, verifica con backend si no hay cache)
 */
export async function getCurrentUserAsync(): Promise<User | null> {
  if (!_authChecked) {
    await checkAuthStatus();
  }
  return _currentUser;
}

/**
 * Verificar si está autenticado
 */
export function isAuthenticated(): boolean {
  return _currentUser !== null;
}

/**
 * Verificar si está autenticado (async)
 */
export async function isAuthenticatedAsync(): Promise<boolean> {
  if (!_authChecked) {
    const status = await checkAuthStatus();
    return status.authenticated;
  }
  return _currentUser !== null;
}

/**
 * Cambiar contraseña
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<AuthResponse> {
  if (newPassword.length < 8) {
    return { success: false, message: 'La nueva contraseña debe tener al menos 8 caracteres' };
  }

  try {
    const response = await authFetch('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.detail || 'Error al cambiar contraseña',
      };
    }

    // Limpiar estado local (el backend revocó todas las sesiones)
    _currentUser = null;
    _authChecked = false;

    return {
      success: true,
      message: data.message || 'Contraseña actualizada',
    };
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    return {
      success: false,
      message: 'Error de conexión con el servidor',
    };
  }
}

/**
 * Obtener información del usuario actual desde el backend
 */
export async function getMe(): Promise<User | null> {
  try {
    const response = await authFetch('/api/auth/me');

    if (!response.ok) {
      return null;
    }

    const user = await response.json();
    _currentUser = user;
    return user;
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    return null;
  }
}

/**
 * Obtener todos los usuarios (solo admin)
 */
export async function getAllUsers(): Promise<User[]> {
  try {
    const response = await authFetch('/api/auth/users');

    if (!response.ok) {
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    return [];
  }
}

/**
 * Activar/desactivar usuario (solo admin)
 */
export async function toggleUserStatus(userId: string): Promise<AuthResponse> {
  try {
    const response = await authFetch(`/api/auth/users/${userId}/toggle-active`, {
      method: 'POST',
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.detail || 'Error' };
    }

    return {
      success: true,
      message: data.message,
    };
  } catch (error) {
    console.error('Error toggling user status:', error);
    return { success: false, message: 'Error de conexión' };
  }
}

/**
 * Crear usuario (solo admin)
 */
export async function adminCreateUser(userData: {
  email: string;
  password: string;
  nombre: string;
  rol?: string;
}): Promise<AuthResponse> {
  try {
    const response = await authFetch('/api/auth/admin/create-user', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.detail || 'Error' };
    }

    return {
      success: true,
      user: data,
      message: 'Usuario creado exitosamente',
    };
  } catch (error) {
    console.error('Error creando usuario:', error);
    return { success: false, message: 'Error de conexión' };
  }
}

// =====================================
// LOGS DE ACTIVIDAD (LOCAL)
// =====================================
// Mantenemos logs de actividad locales para el frontend

interface ActivityLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  module: string;
  timestamp: string;
}

const ACTIVITY_LOGS_KEY = 'litper_activity_logs';

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getActivityLogs(): ActivityLog[] {
  const saved = localStorage.getItem(ACTIVITY_LOGS_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }
  return [];
}

function saveActivityLog(log: ActivityLog): void {
  const logs = getActivityLogs();
  logs.unshift(log);
  const limited = logs.slice(0, 200);
  localStorage.setItem(ACTIVITY_LOGS_KEY, JSON.stringify(limited));
}

export function logActivity(
  userId: string,
  userEmail: string,
  action: string,
  details: string,
  module: string
): void {
  saveActivityLog({
    id: generateId(),
    userId,
    userEmail,
    action,
    details,
    module,
    timestamp: new Date().toISOString(),
  });
}

export function logCurrentUserActivity(
  action: string,
  details: string,
  module: string
): void {
  const user = getCurrentUser();
  if (user) {
    logActivity(user.id, user.email, action, details, module);
  }
}

export function getUserActivityLogs(userId?: string): ActivityLog[] {
  const logs = getActivityLogs();
  if (userId) {
    return logs.filter((l) => l.userId === userId);
  }
  return logs;
}

// =====================================
// INICIALIZACIÓN
// =====================================

/**
 * Inicializar autenticación al cargar la app
 * Verifica si hay una sesión activa via cookies
 */
export async function initAuth(): Promise<User | null> {
  // Limpiar tokens legacy de localStorage si existen
  if (localStorage.getItem('litper_auth_token')) {
    localStorage.removeItem('litper_auth_token');
    localStorage.removeItem('litper_refresh_token');
    localStorage.removeItem('litper_current_user');
    localStorage.removeItem('litper_token_expiry');
    console.info('🔄 Migrado de localStorage a cookies httpOnly');
  }

  const status = await checkAuthStatus();
  return status.user || null;
}

// =====================================
// EXPORTS
// =====================================

export default {
  login,
  register,
  logout,
  getCurrentUser,
  getCurrentUserAsync,
  isAuthenticated,
  isAuthenticatedAsync,
  changePassword,
  getMe,
  getAllUsers,
  toggleUserStatus,
  adminCreateUser,
  checkAuthStatus,
  refreshTokens,
  initAuth,
  logActivity,
  logCurrentUserActivity,
  getUserActivityLogs,
};
