// services/authService.ts
// Sistema de Autenticación y Registro de Actividad

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

const USERS_KEY = 'litper_users';
const CURRENT_USER_KEY = 'litper_current_user';
const SESSION_LOGS_KEY = 'litper_session_logs';
const ACTIVITY_LOGS_KEY = 'litper_activity_logs';
const AUTH_TOKEN_KEY = 'litper_auth_token';

// Usuarios productivos de Litper
const LITPER_USERS: Array<{ user: User; password: string }> = [
  // Chat & Atención
  {
    user: {
      id: 'litper_karen_001',
      email: 'karenlitper@gmail.com',
      nombre: 'Karen',
      rol: 'operador',
      createdAt: '2024-12-01T00:00:00.000Z',
      activo: true,
    },
    password: 'LP.CAROLINA_2024?Jm',
  },
  {
    user: {
      id: 'litper_dayana_002',
      email: 'litperdayana@gmail.com',
      nombre: 'Dayana',
      rol: 'operador',
      createdAt: '2024-12-01T00:00:00.000Z',
      activo: true,
    },
    password: 'tELLEZ_LITper2025Angie?',
  },
  {
    user: {
      id: 'litper_david_003',
      email: 'litperdavid@gmail.com',
      nombre: 'David',
      rol: 'operador',
      createdAt: '2024-12-01T00:00:00.000Z',
      activo: true,
    },
    password: '2025NORMAN_?litper',
  },
  // Tracking & Envíos
  {
    user: {
      id: 'litper_felipe_004',
      email: 'felipelitper@gmail.com',
      nombre: 'Felipe',
      rol: 'operador',
      createdAt: '2024-12-01T00:00:00.000Z',
      activo: true,
    },
    password: '2025?LITper.FELIPE',
  },
  {
    user: {
      id: 'litper_jimmy_005',
      email: 'jimmylitper@gmail.com',
      nombre: 'Jimmy',
      rol: 'operador',
      createdAt: '2024-12-01T00:00:00.000Z',
      activo: true,
    },
    password: '20.25_JIMMY.LITper?',
  },
  {
    user: {
      id: 'litper_jhonnatan_006',
      email: 'jhonnatanlitper@gmail.com',
      nombre: 'Jhonnatan',
      rol: 'operador',
      createdAt: '2024-12-01T00:00:00.000Z',
      activo: true,
    },
    password: '2025_EVAN10?LITper.?',
  },
  // Administración
  {
    user: {
      id: 'litper_daniel_007',
      email: 'daniellitper@gmail.com',
      nombre: 'Daniel',
      rol: 'admin',
      createdAt: '2024-12-01T00:00:00.000Z',
      activo: true,
    },
    password: 'ALEJANDRA_?2025Litper',
  },
  {
    user: {
      id: 'litper_maletas_008',
      email: 'maletaslitper@gmail.com',
      nombre: 'Maletas',
      rol: 'admin',
      createdAt: '2024-12-01T00:00:00.000Z',
      activo: true,
    },
    password: '2025_KAREN.litper10?',
  },
  {
    user: {
      id: 'litper_colombia_009',
      email: 'litpercolombia@gmail.com',
      nombre: 'Litper Colombia',
      rol: 'admin',
      createdAt: '2024-12-01T00:00:00.000Z',
      activo: true,
    },
    password: '?2024LP.JEferMoreno?',
  },
];

// =====================================
// FUNCIONES DE UTILIDAD
// =====================================

const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const generateToken = (): string => {
  return `token_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
};

// Simular hash de password (en producción usar bcrypt)
const hashPassword = (password: string): string => {
  return btoa(password + '_litper_salt_2024');
};

const verifyPassword = (password: string, hash: string): boolean => {
  return hashPassword(password) === hash;
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
// FUNCIONES DE ALMACENAMIENTO
// =====================================

const getUsers = (): Map<string, { user: User; passwordHash: string }> => {
  const saved = localStorage.getItem(USERS_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return new Map(Object.entries(parsed));
    } catch (e) {
      console.error('Error parsing users:', e);
    }
  }

  // Crear usuarios productivos de Litper
  const productionUsers = new Map<string, { user: User; passwordHash: string }>();
  for (const userData of LITPER_USERS) {
    productionUsers.set(userData.user.email.toLowerCase(), {
      user: userData.user,
      passwordHash: hashPassword(userData.password),
    });
  }
  saveUsers(productionUsers);
  return productionUsers;
};

const saveUsers = (users: Map<string, { user: User; passwordHash: string }>): void => {
  const obj = Object.fromEntries(users);
  localStorage.setItem(USERS_KEY, JSON.stringify(obj));
};

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

  const users = getUsers();
  const userData = users.get(email.toLowerCase());

  if (!userData) {
    return { success: false, message: 'Usuario no encontrado' };
  }

  if (!verifyPassword(password, userData.passwordHash)) {
    return { success: false, message: 'Contraseña incorrecta' };
  }

  if (!userData.user.activo) {
    return { success: false, message: 'Usuario desactivado. Contacte al administrador.' };
  }

  // Actualizar último login
  userData.user.lastLogin = new Date().toISOString();
  users.set(email.toLowerCase(), userData);
  saveUsers(users);

  // Generar token
  const token = generateToken();
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData.user));

  // Registrar sesión
  saveSessionLog({
    id: generateId(),
    odigo: userData.user.id,
    action: 'login',
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    device: getDeviceInfo(),
  });

  // Registrar actividad
  logActivity(userData.user.id, userData.user.email, 'Inicio de sesión', 'Usuario inició sesión exitosamente', 'auth');

  return {
    success: true,
    user: userData.user,
    token,
    message: 'Inicio de sesión exitoso',
  };
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

  const users = getUsers();

  if (users.has(email.toLowerCase())) {
    return { success: false, message: 'El email ya está registrado' };
  }

  // Crear nuevo usuario
  const newUser: User = {
    id: generateId(),
    email: email.toLowerCase(),
    nombre,
    rol,
    createdAt: new Date().toISOString(),
    activo: true,
  };

  users.set(email.toLowerCase(), {
    user: newUser,
    passwordHash: hashPassword(password),
  });
  saveUsers(users);

  // Registrar sesión
  saveSessionLog({
    id: generateId(),
    odigo: newUser.id,
    action: 'register',
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    device: getDeviceInfo(),
  });

  // Auto-login después de registro
  const token = generateToken();
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));

  // Registrar actividad
  logActivity(newUser.id, newUser.email, 'Registro', 'Nuevo usuario registrado', 'auth');

  return {
    success: true,
    user: newUser,
    token,
    message: 'Registro exitoso',
  };
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
export const updateProfile = (updates: Partial<User>): AuthResponse => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return { success: false, message: 'No hay sesión activa' };
  }

  const users = getUsers();
  const userData = users.get(currentUser.email);

  if (!userData) {
    return { success: false, message: 'Usuario no encontrado' };
  }

  // Actualizar datos
  const updatedUser = { ...userData.user, ...updates };
  users.set(currentUser.email, { ...userData, user: updatedUser });
  saveUsers(users);

  // Actualizar sesión actual
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));

  // Registrar actividad
  logActivity(updatedUser.id, updatedUser.email, 'Actualización de perfil', 'Usuario actualizó su perfil', 'auth');

  return {
    success: true,
    user: updatedUser,
    message: 'Perfil actualizado',
  };
};

/**
 * Cambiar contraseña
 */
export const changePassword = (currentPassword: string, newPassword: string): AuthResponse => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return { success: false, message: 'No hay sesión activa' };
  }

  if (newPassword.length < 6) {
    return { success: false, message: 'La nueva contraseña debe tener al menos 6 caracteres' };
  }

  const users = getUsers();
  const userData = users.get(currentUser.email);

  if (!userData) {
    return { success: false, message: 'Usuario no encontrado' };
  }

  if (!verifyPassword(currentPassword, userData.passwordHash)) {
    return { success: false, message: 'Contraseña actual incorrecta' };
  }

  // Actualizar contraseña
  users.set(currentUser.email, {
    ...userData,
    passwordHash: hashPassword(newPassword),
  });
  saveUsers(users);

  // Registrar actividad
  logActivity(currentUser.id, currentUser.email, 'Cambio de contraseña', 'Usuario cambió su contraseña', 'auth');

  return {
    success: true,
    message: 'Contraseña actualizada',
  };
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
export const getAllUsers = (): User[] => {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.rol !== 'admin') {
    return [];
  }

  const users = getUsers();
  return Array.from(users.values()).map(u => u.user);
};

/**
 * Activar/desactivar usuario (solo admin)
 */
export const toggleUserStatus = (email: string): AuthResponse => {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.rol !== 'admin') {
    return { success: false, message: 'No tienes permisos para esta acción' };
  }

  const users = getUsers();
  const userData = users.get(email.toLowerCase());

  if (!userData) {
    return { success: false, message: 'Usuario no encontrado' };
  }

  userData.user.activo = !userData.user.activo;
  users.set(email.toLowerCase(), userData);
  saveUsers(users);

  logActivity(
    currentUser.id,
    currentUser.email,
    userData.user.activo ? 'Activar usuario' : 'Desactivar usuario',
    `Usuario ${email} ${userData.user.activo ? 'activado' : 'desactivado'}`,
    'admin'
  );

  return {
    success: true,
    message: `Usuario ${userData.user.activo ? 'activado' : 'desactivado'}`,
  };
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
