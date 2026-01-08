/**
 * LITPER - Sync Service
 * Servicio de sincronización automática entre frontend y backend.
 * Maneja conexión/desconexión, conflictos y reintentos.
 */

import { storageApi, healthApi } from './unifiedApiService';
import { storage } from './storageService';

// ==================== TIPOS ====================

export type SyncStatusType =
  | 'idle'
  | 'syncing'
  | 'synced'
  | 'error'
  | 'offline'
  | 'reconnecting';

export interface SyncStatus {
  status: SyncStatusType;
  lastSync: Date | null;
  nextSync: Date | null;
  changesApplied: number;
  changesPending: number;
  error: string | null;
  isOnline: boolean;
}

export interface SyncConfig {
  /** Intervalo de sincronización en ms (default: 60000 = 1 minuto) */
  interval: number;
  /** Número de intentos de reintento (default: 3) */
  retryAttempts: number;
  /** Delay entre reintentos en ms (default: 5000) */
  retryDelay: number;
  /** Estrategia de conflicto (default: 'server-wins') */
  onConflict: 'server-wins' | 'client-wins' | 'merge';
  /** Auto-start al crear (default: true) */
  autoStart: boolean;
}

export interface SyncResult {
  success: boolean;
  pushed: number;
  pulled: number;
  errors: string[];
}

interface LocalChange {
  key: string;
  data: unknown;
  timestamp: number;
}

interface ServerChange {
  key: string;
  data: unknown;
  timestamp: number;
}

// ==================== CONFIGURACIÓN ====================

const DEFAULT_CONFIG: SyncConfig = {
  interval: 60000,       // 1 minuto
  retryAttempts: 3,
  retryDelay: 5000,      // 5 segundos
  onConflict: 'server-wins',
  autoStart: true,
};

// ==================== SYNC SERVICE ====================

class SyncService {
  private config: SyncConfig;
  private status: SyncStatus;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private isSyncing = false;
  private listeners: Set<(status: SyncStatus) => void> = new Set();
  private retryCount = 0;

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.status = this.createInitialStatus();

    this.setupEventListeners();

    if (this.config.autoStart) {
      this.start();
    }
  }

  // ==================== PUBLIC API ====================

  /**
   * Iniciar sincronización automática
   */
  start(): void {
    if (this.syncInterval) {
      return; // Ya está corriendo
    }

    console.log('Sync service started');

    // Sync inicial
    this.sync();

    // Sync periódico
    this.syncInterval = setInterval(() => {
      this.sync();
    }, this.config.interval);

    this.updateStatus({
      status: 'idle',
      nextSync: new Date(Date.now() + this.config.interval),
    });
  }

  /**
   * Detener sincronización automática
   */
  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    this.updateStatus({
      status: 'idle',
      nextSync: null,
    });

    console.log('Sync service stopped');
  }

  /**
   * Forzar sincronización inmediata
   */
  async sync(): Promise<SyncResult> {
    // Evitar sincronizaciones concurrentes
    if (this.isSyncing) {
      return { success: false, pushed: 0, pulled: 0, errors: ['Sync already in progress'] };
    }

    // Verificar conexión
    if (!navigator.onLine) {
      this.updateStatus({ status: 'offline', isOnline: false });
      return { success: false, pushed: 0, pulled: 0, errors: ['Offline'] };
    }

    this.isSyncing = true;
    this.updateStatus({ status: 'syncing' });

    const result: SyncResult = {
      success: true,
      pushed: 0,
      pulled: 0,
      errors: [],
    };

    try {
      // 1. Verificar que el backend está disponible
      const isAvailable = await healthApi.isAvailable();
      if (!isAvailable) {
        throw new Error('Backend not available');
      }

      // 2. Push: Enviar cambios locales al servidor
      const pushResult = await this.pushLocalChanges();
      result.pushed = pushResult.count;
      if (pushResult.errors.length > 0) {
        result.errors.push(...pushResult.errors);
      }

      // 3. Pull: Obtener cambios del servidor
      const pullResult = await this.pullServerChanges();
      result.pulled = pullResult.count;
      if (pullResult.errors.length > 0) {
        result.errors.push(...pullResult.errors);
      }

      // 4. Actualizar estado
      this.retryCount = 0;
      this.updateStatus({
        status: 'synced',
        lastSync: new Date(),
        nextSync: new Date(Date.now() + this.config.interval),
        changesApplied: result.pulled,
        changesPending: 0,
        error: null,
      });

      result.success = result.errors.length === 0;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.success = false;
      result.errors.push(errorMessage);

      this.updateStatus({
        status: 'error',
        error: errorMessage,
      });

      // Intentar reintentar
      if (this.retryCount < this.config.retryAttempts) {
        this.retryCount++;
        console.log(`Sync failed, retry ${this.retryCount}/${this.config.retryAttempts}`);
        setTimeout(() => this.sync(), this.config.retryDelay);
      }
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  /**
   * Obtener estado actual
   */
  getStatus(): SyncStatus {
    return { ...this.status };
  }

  /**
   * Suscribirse a cambios de estado
   */
  onStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.listeners.add(callback);
    // Enviar estado actual inmediatamente
    callback(this.status);
    return () => this.listeners.delete(callback);
  }

  /**
   * Verificar si hay cambios pendientes
   */
  hasPendingChanges(): boolean {
    return storage.getSyncStatus().pendingCount > 0;
  }

  /**
   * Obtener número de cambios pendientes
   */
  getPendingCount(): number {
    return storage.getSyncStatus().pendingCount;
  }

  // ==================== PRIVATE METHODS ====================

  private createInitialStatus(): SyncStatus {
    return {
      status: 'idle',
      lastSync: this.getLastSyncTime(),
      nextSync: null,
      changesApplied: 0,
      changesPending: 0,
      error: null,
      isOnline: navigator.onLine,
    };
  }

  private async pushLocalChanges(): Promise<{ count: number; errors: string[] }> {
    const errors: string[] = [];
    const syncStatus = storage.getSyncStatus();

    if (syncStatus.pendingCount === 0) {
      return { count: 0, errors };
    }

    console.log(`Pushing ${syncStatus.pendingCount} local changes...`);

    const result = await storage.syncAll();

    if (result.failed > 0) {
      errors.push(`Failed to sync ${result.failed} items`);
    }

    return { count: result.success, errors };
  }

  private async pullServerChanges(): Promise<{ count: number; errors: string[] }> {
    const errors: string[] = [];
    const lastSync = this.getLastSyncTime()?.toISOString();

    try {
      const changes = await storageApi.getChangesSince(lastSync);

      if (changes.length === 0) {
        return { count: 0, errors };
      }

      console.log(`Pulling ${changes.length} server changes...`);

      for (const change of changes) {
        try {
          await this.applyServerChange(change);
        } catch (error) {
          errors.push(`Error applying change for ${change.key}: ${error}`);
        }
      }

      return { count: changes.length, errors };
    } catch (error) {
      errors.push(`Error fetching server changes: ${error}`);
      return { count: 0, errors };
    }
  }

  private async applyServerChange(change: ServerChange): Promise<void> {
    const localItem = await storage.get(change.key);

    if (localItem && this.config.onConflict === 'client-wins') {
      // El cliente gana, no aplicar cambio del servidor
      return;
    }

    if (localItem && this.config.onConflict === 'merge') {
      // Merge: combinar datos (estrategia simple)
      const merged = this.mergeData(localItem, change.data);
      await storage.set(change.key, merged);
      return;
    }

    // server-wins (default): aplicar cambio del servidor
    await storage.set(change.key, change.data);
  }

  private mergeData(local: unknown, server: unknown): unknown {
    // Estrategia de merge simple: server gana para primitivos, merge para objetos
    if (typeof local === 'object' && typeof server === 'object' && local && server) {
      return { ...local as object, ...server as object };
    }
    return server;
  }

  private getLastSyncTime(): Date | null {
    const raw = localStorage.getItem('litper_last_sync');
    if (raw) {
      return new Date(raw);
    }
    return null;
  }

  private saveLastSyncTime(time: Date): void {
    localStorage.setItem('litper_last_sync', time.toISOString());
  }

  private setupEventListeners(): void {
    // Manejar cambios de conexión
    window.addEventListener('online', () => {
      console.log('Connection restored - syncing...');
      this.updateStatus({
        status: 'reconnecting',
        isOnline: true,
      });
      this.retryCount = 0;
      this.sync();
    });

    window.addEventListener('offline', () => {
      console.log('Connection lost - working offline');
      this.updateStatus({
        status: 'offline',
        isOnline: false,
      });
    });

    // Sincronizar antes de cerrar la página
    window.addEventListener('beforeunload', () => {
      if (this.hasPendingChanges()) {
        // Intentar sync rápido (no esperar respuesta)
        storage.syncAll();
      }
    });

    // Escuchar cambios en storage para actualizar pending count
    storage.onEvent((event) => {
      if (event.type === 'set' && !event.synced) {
        this.updateStatus({
          changesPending: this.getPendingCount(),
        });
      }
    });
  }

  private updateStatus(updates: Partial<SyncStatus>): void {
    this.status = { ...this.status, ...updates };

    // Guardar último sync
    if (updates.lastSync) {
      this.saveLastSyncTime(updates.lastSync);
    }

    // Notificar listeners
    this.listeners.forEach((cb) => cb(this.status));
  }

  /**
   * Destruir el servicio (cleanup)
   */
  destroy(): void {
    this.stop();
    this.listeners.clear();
  }
}

// ==================== SINGLETON EXPORT ====================

export const syncService = new SyncService();

// ==================== HELPERS ====================

/**
 * Formatear tiempo desde último sync
 */
export const formatSyncTime = (date: Date | null): string => {
  if (!date) return 'Nunca';

  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) return 'Hace un momento';
  if (minutes < 60) return `Hace ${minutes} min`;
  if (hours < 24) return `Hace ${hours} h`;

  return date.toLocaleDateString();
};

/**
 * Obtener icono de estado
 */
export const getSyncStatusIcon = (status: SyncStatusType): string => {
  switch (status) {
    case 'syncing':
    case 'reconnecting':
      return 'sync';
    case 'synced':
      return 'check_circle';
    case 'offline':
      return 'cloud_off';
    case 'error':
      return 'error';
    default:
      return 'sync';
  }
};

/**
 * Obtener color de estado
 */
export const getSyncStatusColor = (status: SyncStatusType): string => {
  switch (status) {
    case 'syncing':
    case 'reconnecting':
      return 'blue';
    case 'synced':
      return 'green';
    case 'offline':
      return 'gray';
    case 'error':
      return 'red';
    default:
      return 'gray';
  }
};

export default syncService;
