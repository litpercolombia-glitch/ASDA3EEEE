// services/simpleUserService.ts
// Sistema simple de usuarios con localStorage

export interface SimpleUser {
  id: string;
  nombre: string;
  color: string;
  createdAt: string;
  ultimoAcceso: string;
}

const STORAGE_KEY = 'litper_usuarios';
const CURRENT_USER_KEY = 'litper_usuario_actual';

// Colores predefinidos para usuarios
const COLORES_USUARIO = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

// Generar ID único
const generarId = (): string => {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Obtener color aleatorio
const obtenerColorAleatorio = (): string => {
  return COLORES_USUARIO[Math.floor(Math.random() * COLORES_USUARIO.length)];
};

// =====================================
// FUNCIONES PRINCIPALES
// =====================================

/**
 * Obtener todos los usuarios
 */
export const obtenerUsuarios = (): SimpleUser[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

/**
 * Crear nuevo usuario
 */
export const crearUsuario = (nombre: string): SimpleUser => {
  const usuarios = obtenerUsuarios();

  const nuevoUsuario: SimpleUser = {
    id: generarId(),
    nombre: nombre.trim(),
    color: obtenerColorAleatorio(),
    createdAt: new Date().toISOString(),
    ultimoAcceso: new Date().toISOString(),
  };

  usuarios.push(nuevoUsuario);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usuarios));

  // Establecer como usuario actual
  setUsuarioActual(nuevoUsuario.id);

  return nuevoUsuario;
};

/**
 * Eliminar usuario
 */
export const eliminarUsuario = (userId: string): boolean => {
  const usuarios = obtenerUsuarios();
  const filtrados = usuarios.filter(u => u.id !== userId);

  if (filtrados.length === usuarios.length) {
    return false; // No se encontró el usuario
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtrados));

  // Si era el usuario actual, limpiar
  const actual = getUsuarioActualId();
  if (actual === userId) {
    localStorage.removeItem(CURRENT_USER_KEY);
  }

  return true;
};

/**
 * Obtener usuario por ID
 */
export const obtenerUsuario = (userId: string): SimpleUser | null => {
  const usuarios = obtenerUsuarios();
  return usuarios.find(u => u.id === userId) || null;
};

/**
 * Actualizar último acceso
 */
export const actualizarUltimoAcceso = (userId: string): void => {
  const usuarios = obtenerUsuarios();
  const index = usuarios.findIndex(u => u.id === userId);

  if (index !== -1) {
    usuarios[index].ultimoAcceso = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usuarios));
  }
};

/**
 * Establecer usuario actual
 */
export const setUsuarioActual = (userId: string): void => {
  localStorage.setItem(CURRENT_USER_KEY, userId);
  actualizarUltimoAcceso(userId);
};

/**
 * Obtener ID del usuario actual
 */
export const getUsuarioActualId = (): string | null => {
  return localStorage.getItem(CURRENT_USER_KEY);
};

/**
 * Obtener usuario actual completo
 */
export const getUsuarioActual = (): SimpleUser | null => {
  const userId = getUsuarioActualId();
  if (!userId) return null;
  return obtenerUsuario(userId);
};

/**
 * Obtener o crear usuario por defecto
 */
export const getOCrearUsuarioDefault = (): SimpleUser => {
  const actual = getUsuarioActual();
  if (actual) return actual;

  const usuarios = obtenerUsuarios();
  if (usuarios.length > 0) {
    setUsuarioActual(usuarios[0].id);
    return usuarios[0];
  }

  // Crear usuario por defecto
  return crearUsuario('Usuario Principal');
};

/**
 * Renombrar usuario
 */
export const renombrarUsuario = (userId: string, nuevoNombre: string): boolean => {
  const usuarios = obtenerUsuarios();
  const index = usuarios.findIndex(u => u.id === userId);

  if (index === -1) return false;

  usuarios[index].nombre = nuevoNombre.trim();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usuarios));
  return true;
};

// =====================================
// EXPORTAR COMO OBJETO TAMBIÉN
// =====================================
export const simpleUserService = {
  obtenerUsuarios,
  crearUsuario,
  eliminarUsuario,
  obtenerUsuario,
  setUsuarioActual,
  getUsuarioActualId,
  getUsuarioActual,
  getOCrearUsuarioDefault,
  renombrarUsuario,
  actualizarUltimoAcceso,
};

export default simpleUserService;
