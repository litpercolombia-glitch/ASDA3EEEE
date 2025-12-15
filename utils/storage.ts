/**
 * STORAGE SERVICE CENTRALIZADO
 *
 * Este archivo maneja TODO el acceso a localStorage/sessionStorage.
 * NUNCA accedas directamente a localStorage en componentes.
 * Siempre usa: import { storage } from '@/utils/storage'
 */

import { STORAGE_KEYS } from '../constants';

// ============================================
// TIPOS
// ============================================

type StorageKey = keyof typeof STORAGE_KEYS;

interface StorageOptions {
  /** Usar sessionStorage en lugar de localStorage */
  session?: boolean;
  /** Tiempo de expiracion en milisegundos */
  ttl?: number;
}

interface StoredItem<T> {
  value: T;
  timestamp: number;
  expiry?: number;
}

// ============================================
// CLASE STORAGE SERVICE
// ============================================

class StorageService {
  private getStorage(session: boolean = false): Storage {
    return session ? sessionStorage : localStorage;
  }

  /**
   * Obtiene un valor del storage
   * @param key - Clave del storage (debe ser una de STORAGE_KEYS)
   * @param options - Opciones de storage
   * @returns El valor almacenado o null si no existe o expiro
   */
  get<T>(key: StorageKey, options: StorageOptions = {}): T | null {
    try {
      const storage = this.getStorage(options.session);
      const storageKey = STORAGE_KEYS[key];
      const item = storage.getItem(storageKey);

      if (!item) return null;

      const parsed: StoredItem<T> = JSON.parse(item);

      // Verificar expiracion
      if (parsed.expiry && Date.now() > parsed.expiry) {
        this.remove(key, options);
        return null;
      }

      return parsed.value;
    } catch (error) {
      console.error(`Error reading from storage [${key}]:`, error);
      return null;
    }
  }

  /**
   * Guarda un valor en el storage
   * @param key - Clave del storage (debe ser una de STORAGE_KEYS)
   * @param value - Valor a guardar
   * @param options - Opciones de storage
   */
  set<T>(key: StorageKey, value: T, options: StorageOptions = {}): void {
    try {
      const storage = this.getStorage(options.session);
      const storageKey = STORAGE_KEYS[key];

      const item: StoredItem<T> = {
        value,
        timestamp: Date.now(),
        expiry: options.ttl ? Date.now() + options.ttl : undefined,
      };

      storage.setItem(storageKey, JSON.stringify(item));
    } catch (error) {
      console.error(`Error writing to storage [${key}]:`, error);

      // Si el storage esta lleno, intentar limpiar items expirados
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.clearExpired();
        // Reintentar una vez
        try {
          const storage = this.getStorage(options.session);
          const storageKey = STORAGE_KEYS[key];
          const item: StoredItem<T> = {
            value,
            timestamp: Date.now(),
            expiry: options.ttl ? Date.now() + options.ttl : undefined,
          };
          storage.setItem(storageKey, JSON.stringify(item));
        } catch {
          console.error('Storage is full and could not be cleared');
        }
      }
    }
  }

  /**
   * Elimina un valor del storage
   * @param key - Clave del storage
   * @param options - Opciones de storage
   */
  remove(key: StorageKey, options: StorageOptions = {}): void {
    try {
      const storage = this.getStorage(options.session);
      const storageKey = STORAGE_KEYS[key];
      storage.removeItem(storageKey);
    } catch (error) {
      console.error(`Error removing from storage [${key}]:`, error);
    }
  }

  /**
   * Verifica si existe una clave en el storage
   * @param key - Clave del storage
   * @param options - Opciones de storage
   * @returns true si existe y no ha expirado
   */
  has(key: StorageKey, options: StorageOptions = {}): boolean {
    return this.get(key, options) !== null;
  }

  /**
   * Obtiene el timestamp de cuando se guardo un item
   * @param key - Clave del storage
   * @param options - Opciones de storage
   * @returns Timestamp o null
   */
  getTimestamp(key: StorageKey, options: StorageOptions = {}): number | null {
    try {
      const storage = this.getStorage(options.session);
      const storageKey = STORAGE_KEYS[key];
      const item = storage.getItem(storageKey);

      if (!item) return null;

      const parsed: StoredItem<unknown> = JSON.parse(item);
      return parsed.timestamp;
    } catch {
      return null;
    }
  }

  /**
   * Verifica si un item ha expirado o es muy viejo
   * @param key - Clave del storage
   * @param maxAge - Edad maxima en milisegundos
   * @param options - Opciones de storage
   * @returns true si el item es muy viejo o no existe
   */
  isStale(key: StorageKey, maxAge: number, options: StorageOptions = {}): boolean {
    const timestamp = this.getTimestamp(key, options);
    if (!timestamp) return true;
    return Date.now() - timestamp > maxAge;
  }

  /**
   * Limpia todos los items de LITPER del storage
   * @param options - Opciones de storage
   */
  clear(options: StorageOptions = {}): void {
    try {
      const storage = this.getStorage(options.session);
      Object.values(STORAGE_KEYS).forEach((storageKey) => {
        storage.removeItem(storageKey);
      });
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  /**
   * Limpia items expirados del storage
   */
  clearExpired(): void {
    try {
      const now = Date.now();

      [localStorage, sessionStorage].forEach((storage) => {
        Object.values(STORAGE_KEYS).forEach((storageKey) => {
          try {
            const item = storage.getItem(storageKey);
            if (item) {
              const parsed: StoredItem<unknown> = JSON.parse(item);
              if (parsed.expiry && now > parsed.expiry) {
                storage.removeItem(storageKey);
              }
            }
          } catch {
            // Item corrupto, eliminarlo
            storage.removeItem(storageKey);
          }
        });
      });
    } catch (error) {
      console.error('Error clearing expired items:', error);
    }
  }

  /**
   * Obtiene el tamaño total usado por LITPER en el storage
   * @returns Tamaño en bytes
   */
  getUsedSpace(): number {
    let total = 0;
    try {
      Object.values(STORAGE_KEYS).forEach((storageKey) => {
        const item = localStorage.getItem(storageKey);
        if (item) {
          total += item.length * 2; // UTF-16
        }
      });
    } catch {
      // Ignorar errores
    }
    return total;
  }

  /**
   * Exporta todos los datos del storage (para backup)
   * @returns Objeto con todos los datos
   */
  exportAll(): Record<string, unknown> {
    const data: Record<string, unknown> = {};

    Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
      try {
        const item = localStorage.getItem(storageKey);
        if (item) {
          const parsed: StoredItem<unknown> = JSON.parse(item);
          data[key] = parsed.value;
        }
      } catch {
        // Ignorar items corruptos
      }
    });

    return data;
  }

  /**
   * Importa datos al storage (para restaurar backup)
   * @param data - Datos a importar
   */
  importAll(data: Record<string, unknown>): void {
    Object.entries(data).forEach(([key, value]) => {
      if (key in STORAGE_KEYS) {
        this.set(key as StorageKey, value);
      }
    });
  }
}

// ============================================
// INSTANCIA SINGLETON
// ============================================

export const storage = new StorageService();

// ============================================
// HOOKS HELPERS
// ============================================

/**
 * Helper para usar storage con un valor por defecto
 * Similar a useState pero persistido
 */
export function getStorageWithDefault<T>(
  key: StorageKey,
  defaultValue: T,
  options: StorageOptions = {}
): T {
  const stored = storage.get<T>(key, options);
  if (stored === null) {
    storage.set(key, defaultValue, options);
    return defaultValue;
  }
  return stored;
}

// ============================================
// UTILIDADES DE MIGRACION
// ============================================

/**
 * Migra datos de claves antiguas a nuevas
 * Usar cuando se renombran claves de storage
 */
export function migrateStorageKey(
  oldKey: string,
  newKey: StorageKey
): void {
  try {
    const oldValue = localStorage.getItem(oldKey);
    if (oldValue && !storage.has(newKey)) {
      localStorage.setItem(STORAGE_KEYS[newKey], oldValue);
      localStorage.removeItem(oldKey);
    }
  } catch {
    // Ignorar errores de migracion
  }
}

// ============================================
// INICIALIZACION
// ============================================

// Limpiar items expirados al cargar
if (typeof window !== 'undefined') {
  storage.clearExpired();
}

export default storage;
