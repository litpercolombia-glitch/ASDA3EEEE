/**
 * Memory Limiter para el Brain
 *
 * Controla y limita el uso de memoria del sistema Brain
 * para evitar memory leaks y crashes por uso excesivo.
 */

interface MemoryConfig {
  maxMemoryMB: number;
  maxItems: number;
  maxAgeMinutes: number;
  cleanupIntervalMs: number;
}

interface MemoryItem<T> {
  data: T;
  timestamp: number;
  size: number;
  accessCount: number;
  lastAccess: number;
}

interface MemoryStats {
  totalItems: number;
  totalSizeMB: number;
  oldestItemAge: number;
  newestItemAge: number;
  avgAccessCount: number;
}

export class MemoryLimiter<T = unknown> {
  private store: Map<string, MemoryItem<T>> = new Map();
  private config: MemoryConfig;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private totalSize = 0;

  constructor(config: Partial<MemoryConfig> = {}) {
    this.config = {
      maxMemoryMB: config.maxMemoryMB ?? 50, // 50MB por defecto
      maxItems: config.maxItems ?? 10000,
      maxAgeMinutes: config.maxAgeMinutes ?? 60, // 1 hora
      cleanupIntervalMs: config.cleanupIntervalMs ?? 60000, // 1 minuto
    };

    this.startCleanupInterval();
  }

  /**
   * Almacena un item con control de memoria
   */
  set(key: string, data: T): boolean {
    const size = this.estimateSize(data);
    const sizeMB = size / (1024 * 1024);

    // Verificar si excede límites
    if (this.store.size >= this.config.maxItems) {
      this.evictOldest();
    }

    if (this.totalSize + size > this.config.maxMemoryMB * 1024 * 1024) {
      this.evictBySize(size);
    }

    // Si el item individual es muy grande, no almacenar
    if (sizeMB > this.config.maxMemoryMB * 0.1) {
      console.warn(`[MemoryLimiter] Item demasiado grande: ${sizeMB.toFixed(2)}MB`);
      return false;
    }

    const now = Date.now();
    const existing = this.store.get(key);

    if (existing) {
      this.totalSize -= existing.size;
    }

    this.store.set(key, {
      data,
      timestamp: now,
      size,
      accessCount: existing ? existing.accessCount : 0,
      lastAccess: now,
    });

    this.totalSize += size;
    return true;
  }

  /**
   * Obtiene un item
   */
  get(key: string): T | undefined {
    const item = this.store.get(key);
    if (!item) return undefined;

    // Verificar edad
    const ageMinutes = (Date.now() - item.timestamp) / 60000;
    if (ageMinutes > this.config.maxAgeMinutes) {
      this.delete(key);
      return undefined;
    }

    // Actualizar estadísticas de acceso
    item.accessCount++;
    item.lastAccess = Date.now();

    return item.data;
  }

  /**
   * Elimina un item
   */
  delete(key: string): boolean {
    const item = this.store.get(key);
    if (item) {
      this.totalSize -= item.size;
      return this.store.delete(key);
    }
    return false;
  }

  /**
   * Verifica si existe un item
   */
  has(key: string): boolean {
    const item = this.store.get(key);
    if (!item) return false;

    const ageMinutes = (Date.now() - item.timestamp) / 60000;
    if (ageMinutes > this.config.maxAgeMinutes) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Limpia todos los items
   */
  clear(): void {
    this.store.clear();
    this.totalSize = 0;
  }

  /**
   * Obtiene estadísticas de memoria
   */
  getStats(): MemoryStats {
    const now = Date.now();
    let oldestAge = 0;
    let newestAge = Infinity;
    let totalAccessCount = 0;

    this.store.forEach((item) => {
      const age = now - item.timestamp;
      if (age > oldestAge) oldestAge = age;
      if (age < newestAge) newestAge = age;
      totalAccessCount += item.accessCount;
    });

    return {
      totalItems: this.store.size,
      totalSizeMB: this.totalSize / (1024 * 1024),
      oldestItemAge: oldestAge / 60000, // minutos
      newestItemAge: newestAge === Infinity ? 0 : newestAge / 60000,
      avgAccessCount: this.store.size > 0 ? totalAccessCount / this.store.size : 0,
    };
  }

  /**
   * Estima el tamaño de un objeto en bytes
   */
  private estimateSize(obj: unknown): number {
    const str = JSON.stringify(obj);
    // Aproximación: cada caracter = 2 bytes en JS
    return str ? str.length * 2 : 0;
  }

  /**
   * Elimina los items más antiguos
   */
  private evictOldest(count = 1): void {
    const entries = Array.from(this.store.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    for (let i = 0; i < Math.min(count, entries.length); i++) {
      this.delete(entries[i][0]);
    }
  }

  /**
   * Elimina items hasta liberar suficiente espacio
   */
  private evictBySize(requiredSize: number): void {
    const targetSize = this.config.maxMemoryMB * 1024 * 1024 - requiredSize;

    // Ordenar por último acceso (LRU)
    const entries = Array.from(this.store.entries())
      .sort((a, b) => a[1].lastAccess - b[1].lastAccess);

    for (const [key] of entries) {
      if (this.totalSize <= targetSize) break;
      this.delete(key);
    }
  }

  /**
   * Limpia items expirados
   */
  private cleanup(): void {
    const now = Date.now();
    const maxAge = this.config.maxAgeMinutes * 60000;

    this.store.forEach((item, key) => {
      if (now - item.timestamp > maxAge) {
        this.delete(key);
      }
    });

    // Log stats periódicamente
    const stats = this.getStats();
    if (stats.totalItems > 0) {
      console.log(
        `[MemoryLimiter] Items: ${stats.totalItems}, Size: ${stats.totalSizeMB.toFixed(2)}MB`
      );
    }
  }

  /**
   * Inicia el intervalo de limpieza
   */
  private startCleanupInterval(): void {
    if (this.cleanupInterval) return;

    this.cleanupInterval = setInterval(
      () => this.cleanup(),
      this.config.cleanupIntervalMs
    );
  }

  /**
   * Detiene el intervalo de limpieza
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Destructor
   */
  destroy(): void {
    this.stopCleanup();
    this.clear();
  }
}

// Instancias predefinidas para diferentes usos
export const brainMemory = new MemoryLimiter({
  maxMemoryMB: 30,
  maxItems: 5000,
  maxAgeMinutes: 30,
});

export const cacheMemory = new MemoryLimiter({
  maxMemoryMB: 20,
  maxItems: 2000,
  maxAgeMinutes: 15,
});

export const sessionMemory = new MemoryLimiter({
  maxMemoryMB: 10,
  maxItems: 500,
  maxAgeMinutes: 60,
});

export default MemoryLimiter;
