/**
 * LITPER - Storage Service
 * Servicio centralizado de almacenamiento que:
 * - Distingue entre datos críticos (→ Backend) y datos de UI (→ localStorage)
 * - Sincroniza automáticamente con el backend
 * - Maneja offline/online gracefully
 */

import { storageApi } from './unifiedApiService';

// ==================== TIPOS ====================

export type StorageType = 'critical' | 'ui' | 'cache';

export interface StorageConfig {
  type: StorageType;
  syncWithBackend: boolean;
  ttl?: number; // Time to live en segundos
  version?: number; // Para migraciones
}

export interface StorageItem<T = unknown> {
  data: T;
  timestamp: number;
  version?: number;
  synced?: boolean;
}

export type StorageEventType = 'set' | 'get' | 'delete' | 'sync' | 'error';

export interface StorageEvent {
  type: StorageEventType;
  key: string;
  success: boolean;
  synced?: boolean;
  error?: string;
}

// ==================== CONFIGURACIÓN ====================

/**
 * Configuración de cada key de storage.
 * Define qué datos son críticos (van al backend) vs UI (localStorage).
 */
const STORAGE_CONFIG: Record<string, StorageConfig> = {
  // ==================== DATOS CRÍTICOS (Sync con Backend) ====================
  'litper_cargas': { type: 'critical', syncWithBackend: true, version: 1 },
  'litper_guias': { type: 'critical', syncWithBackend: true, version: 1 },
  'litper_finanzas': { type: 'critical', syncWithBackend: true, version: 1 },
  'litper_usuarios': { type: 'critical', syncWithBackend: true, version: 1 },
  'litper_tracking': { type: 'critical', syncWithBackend: true, version: 1 },
  'litper_historial': { type: 'critical', syncWithBackend: true, version: 1 },

  // ==================== DATOS DE UI (Solo localStorage) ====================
  'litper_theme': { type: 'ui', syncWithBackend: false },
  'litper_filters': { type: 'ui', syncWithBackend: false },
  'litper_columns': { type: 'ui', syncWithBackend: false },
  'litper_sidebar': { type: 'ui', syncWithBackend: false },
  'litper_preferences': { type: 'ui', syncWithBackend: false },
  'litper_vista_actual': { type: 'ui', syncWithBackend: false },
  'litper_tabs_state': { type: 'ui', syncWithBackend: false },
  'litper_carga_actual': { type: 'ui', syncWithBackend: false },

  // ==================== CACHE TEMPORAL ====================
  'litper_cache_ciudades': { type: 'cache', syncWithBackend: false, ttl: 86400 }, // 24 horas
  'litper_cache_transportadoras': { type: 'cache', syncWithBackend: false, ttl: 86400 },
  'litper_cache_stats': { type: 'cache', syncWithBackend: false, ttl: 300 }, // 5 minutos
};

// Patrones con wildcard
const PATTERN_CONFIGS: Array<{ pattern: RegExp; config: StorageConfig }> = [
  { pattern: /^litper_cache_/, config: { type: 'cache', syncWithBackend: false, ttl: 3600 } },
  { pattern: /^litper_temp_/, config: { type: 'cache', syncWithBackend: false, ttl: 300 } },
  { pattern: /^litper_ui_/, config: { type: 'ui', syncWithBackend: false } },
];

// ==================== STORAGE SERVICE ====================

class StorageService {
  private pendingSync: Map<string, unknown> = new Map();
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<(event: StorageEvent) => void> = new Set();
  private isOnline: boolean = navigator.onLine;

  constructor() {
    this.setupEventListeners();
    this.startSyncInterval();
    this.loadPendingSync();
  }

  // ==================== PUBLIC API ====================

  /**
   * Guardar un valor en storage
   */
  async set<T>(key: string, value: T): Promise<void> {
    const config = this.getConfig(key);
    const timestamp = Date.now();

    const item: StorageItem<T> = {
      data: value,
      timestamp,
      version: config.version,
      synced: false,
    };

    // Siempre guardar en localStorage para acceso rápido
    this.setLocal(key, item);

    // Si es crítico, sincronizar con backend
    if (config.syncWithBackend) {
      await this.syncToBackend(key, value);
    } else {
      item.synced = true;
      this.setLocal(key, item);
    }

    this.notifyListeners({
      type: 'set',
      key,
      success: true,
      synced: item.synced,
    });
  }

  /**
   * Obtener un valor de storage
   */
  async get<T>(key: string): Promise<T | null> {
    const config = this.getConfig(key);

    // Si es crítico y estamos online, intentar obtener del backend primero
    if (config.syncWithBackend && this.isOnline) {
      try {
        const backendData = await storageApi.getItem<T>(key);
        if (backendData !== null) {
          const item: StorageItem<T> = {
            data: backendData,
            timestamp: Date.now(),
            version: config.version,
            synced: true,
          };
          this.setLocal(key, item);

          this.notifyListeners({
            type: 'get',
            key,
            success: true,
            synced: true,
          });

          return backendData;
        }
      } catch (error) {
        console.warn(`Backend unavailable for ${key}, using localStorage`);
      }
    }

    // Fallback a localStorage
    const localItem = this.getLocal<T>(key);

    if (!localItem) {
      return null;
    }

    // Verificar TTL para cache
    if (config.ttl) {
      const age = (Date.now() - localItem.timestamp) / 1000;
      if (age > config.ttl) {
        this.remove(key);
        return null;
      }
    }

    this.notifyListeners({
      type: 'get',
      key,
      success: true,
      synced: localItem.synced,
    });

    return localItem.data;
  }

  /**
   * Eliminar un valor de storage
   */
  async remove(key: string): Promise<void> {
    localStorage.removeItem(key);
    this.pendingSync.delete(key);

    this.notifyListeners({
      type: 'delete',
      key,
      success: true,
    });
  }

  /**
   * Verificar si existe una key
   */
  has(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  /**
   * Obtener todas las keys que coinciden con un patrón
   */
  getKeys(pattern?: RegExp): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        if (!pattern || pattern.test(key)) {
          keys.push(key);
        }
      }
    }
    return keys;
  }

  /**
   * Limpiar todo el storage (excepto datos críticos no sincronizados)
   */
  async clear(force: boolean = false): Promise<void> {
    if (!force && this.pendingSync.size > 0) {
      console.warn('Hay datos pendientes de sincronizar. Usa force=true para limpiar.');
      return;
    }

    const keysToRemove = this.getKeys(/^litper_/);
    for (const key of keysToRemove) {
      const config = this.getConfig(key);
      // No eliminar datos críticos no sincronizados
      if (!force && config.syncWithBackend) {
        const item = this.getLocal(key);
        if (item && !item.synced) {
          continue;
        }
      }
      localStorage.removeItem(key);
    }

    if (force) {
      this.pendingSync.clear();
      this.savePendingSync();
    }
  }

  /**
   * Forzar sincronización de todos los datos pendientes
   */
  async syncAll(): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const [key, value] of this.pendingSync) {
      try {
        await storageApi.syncItem(key, value);
        this.pendingSync.delete(key);

        // Marcar como sincronizado en localStorage
        const item = this.getLocal(key);
        if (item) {
          item.synced = true;
          this.setLocal(key, item);
        }

        success++;
      } catch (error) {
        console.error(`Error syncing ${key}:`, error);
        failed++;
      }
    }

    this.savePendingSync();

    return { success, failed };
  }

  /**
   * Obtener estado de sincronización
   */
  getSyncStatus(): {
    pendingCount: number;
    pendingKeys: string[];
    isOnline: boolean;
  } {
    return {
      pendingCount: this.pendingSync.size,
      pendingKeys: Array.from(this.pendingSync.keys()),
      isOnline: this.isOnline,
    };
  }

  /**
   * Suscribirse a eventos de storage
   */
  onEvent(callback: (event: StorageEvent) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Obtener configuración de una key
   */
  getConfig(key: string): StorageConfig {
    // Buscar config exacta
    if (STORAGE_CONFIG[key]) {
      return STORAGE_CONFIG[key];
    }

    // Buscar patrones con regex
    for (const { pattern, config } of PATTERN_CONFIGS) {
      if (pattern.test(key)) {
        return config;
      }
    }

    // Default: UI storage
    return { type: 'ui', syncWithBackend: false };
  }

  /**
   * Verificar si una key es crítica
   */
  isCritical(key: string): boolean {
    return this.getConfig(key).type === 'critical';
  }

  // ==================== PRIVATE METHODS ====================

  private setLocal<T>(key: string, item: StorageItem<T>): void {
    try {
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      // Storage full, intentar limpiar cache
      this.clearCache();
      try {
        localStorage.setItem(key, JSON.stringify(item));
      } catch {
        console.error('Storage full, cannot save:', key);
        this.notifyListeners({
          type: 'error',
          key,
          success: false,
          error: 'Storage full',
        });
      }
    }
  }

  private getLocal<T>(key: string): StorageItem<T> | null {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as StorageItem<T>;
    } catch {
      // Datos legacy (no en formato StorageItem)
      return {
        data: JSON.parse(raw) as T,
        timestamp: Date.now(),
        synced: false,
      };
    }
  }

  private async syncToBackend(key: string, value: unknown): Promise<void> {
    if (!this.isOnline) {
      this.pendingSync.set(key, value);
      this.savePendingSync();
      return;
    }

    try {
      await storageApi.syncItem(key, value);

      // Marcar como sincronizado
      const item = this.getLocal(key);
      if (item) {
        item.synced = true;
        this.setLocal(key, item);
      }

      this.pendingSync.delete(key);
      this.savePendingSync();

      this.notifyListeners({
        type: 'sync',
        key,
        success: true,
        synced: true,
      });
    } catch (error) {
      console.error(`Error syncing ${key}:`, error);
      this.pendingSync.set(key, value);
      this.savePendingSync();

      this.notifyListeners({
        type: 'sync',
        key,
        success: false,
        synced: false,
        error: String(error),
      });
    }
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('Online - Syncing pending data...');
      this.syncAll();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('Offline - Data will be synced when connection is restored');
    });

    // Escuchar cambios de otras pestañas
    window.addEventListener('storage', (event) => {
      if (event.key && event.key.startsWith('litper_')) {
        this.notifyListeners({
          type: 'set',
          key: event.key,
          success: true,
        });
      }
    });
  }

  private startSyncInterval(): void {
    // Sincronizar datos pendientes cada 30 segundos
    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.pendingSync.size > 0) {
        this.syncAll();
      }
    }, 30000);
  }

  private savePendingSync(): void {
    const pending = Object.fromEntries(this.pendingSync);
    localStorage.setItem('litper_pending_sync', JSON.stringify(pending));
  }

  private loadPendingSync(): void {
    const raw = localStorage.getItem('litper_pending_sync');
    if (raw) {
      try {
        const pending = JSON.parse(raw) as Record<string, unknown>;
        this.pendingSync = new Map(Object.entries(pending));
      } catch {
        this.pendingSync = new Map();
      }
    }
  }

  private clearCache(): void {
    const cacheKeys = this.getKeys(/^litper_cache_/);
    for (const key of cacheKeys) {
      localStorage.removeItem(key);
    }
  }

  private notifyListeners(event: StorageEvent): void {
    this.listeners.forEach((cb) => cb(event));
  }

  /**
   * Destruir el servicio (cleanup)
   */
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    this.listeners.clear();
  }
}

// ==================== SINGLETON EXPORT ====================

export const storage = new StorageService();

// ==================== HELPERS ====================

/**
 * Hook helper para React
 */
export const useStorage = <T>(key: string, defaultValue: T) => {
  return {
    get: async () => (await storage.get<T>(key)) ?? defaultValue,
    set: (value: T) => storage.set(key, value),
    remove: () => storage.remove(key),
    isCritical: storage.isCritical(key),
  };
};

/**
 * Migrar datos legacy de localStorage directo a formato nuevo
 */
export const migrateFromLegacy = async (legacyKey: string, newKey: string): Promise<void> => {
  const legacyData = localStorage.getItem(legacyKey);
  if (legacyData) {
    try {
      const data = JSON.parse(legacyData);
      await storage.set(newKey, data);
      localStorage.removeItem(legacyKey);
      console.log(`Migrated ${legacyKey} → ${newKey}`);
    } catch (error) {
      console.error(`Error migrating ${legacyKey}:`, error);
    }
  }
};

export default storage;
