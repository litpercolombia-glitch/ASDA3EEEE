// services/brain/core/MemoryManager.ts
// Sistema de memoria del Cerebro - Recuerda TODO

import { MemoryEntry, MemoryType, MemoryQuery } from '../types/brain.types';
import { eventBus } from './EventBus';

const STORAGE_KEY = 'litper_brain_memory';

// TTL por defecto en minutos
const DEFAULT_TTL = {
  SHORT_TERM: 30,       // 30 minutos
  MEDIUM_TERM: 1440,    // 24 horas
  LONG_TERM: 43200,     // 30 días
  SEMANTIC: 525600,     // 1 año
};

class MemoryManagerService {
  private memory: Map<string, MemoryEntry> = new Map();
  private initialized = false;

  constructor() {
    this.loadFromStorage();
    this.startCleanupInterval();
  }

  /**
   * Inicializar memoria desde localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as MemoryEntry[];
        data.forEach(entry => {
          // Convertir strings a Date
          entry.createdAt = new Date(entry.createdAt);
          entry.lastAccessed = new Date(entry.lastAccessed);
          if (entry.expiresAt) entry.expiresAt = new Date(entry.expiresAt);

          // Solo cargar si no ha expirado
          if (!this.isExpired(entry)) {
            this.memory.set(entry.id, entry);
          }
        });
      }
      this.initialized = true;
      console.log(`[Memory] Cargados ${this.memory.size} recuerdos`);
    } catch (error) {
      console.error('[Memory] Error cargando memoria:', error);
      this.memory = new Map();
    }
  }

  /**
   * Guardar memoria en localStorage
   */
  private saveToStorage(): void {
    try {
      const data = Array.from(this.memory.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('[Memory] Error guardando memoria:', error);
    }
  }

  /**
   * Verificar si una entrada ha expirado
   */
  private isExpired(entry: MemoryEntry): boolean {
    if (!entry.expiresAt) return false;
    return new Date() > entry.expiresAt;
  }

  /**
   * Recordar algo (guardar en memoria)
   */
  remember(
    category: string,
    data: unknown,
    options?: {
      type?: MemoryType;
      importance?: number;
      ttlMinutes?: number;
      id?: string;
    }
  ): MemoryEntry {
    const type = options?.type || 'SHORT_TERM';
    const ttl = options?.ttlMinutes || DEFAULT_TTL[type];

    const entry: MemoryEntry = {
      id: options?.id || this.generateId(),
      type,
      category,
      data,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + ttl * 60 * 1000),
      accessCount: 0,
      lastAccessed: new Date(),
      importance: options?.importance || 50,
    };

    this.memory.set(entry.id, entry);
    this.saveToStorage();

    eventBus.emit('learning.updated', {
      action: 'remember',
      category,
      type,
    });

    return entry;
  }

  /**
   * Recordar permanentemente (sin expiración)
   */
  rememberForever(
    category: string,
    data: unknown,
    importance = 80
  ): MemoryEntry {
    const entry: MemoryEntry = {
      id: this.generateId(),
      type: 'LONG_TERM',
      category,
      data,
      createdAt: new Date(),
      expiresAt: undefined, // Sin expiración
      accessCount: 0,
      lastAccessed: new Date(),
      importance,
    };

    this.memory.set(entry.id, entry);
    this.saveToStorage();

    return entry;
  }

  /**
   * Recordar (obtener de memoria)
   */
  recall(id: string): MemoryEntry | undefined {
    const entry = this.memory.get(id);
    if (entry && !this.isExpired(entry)) {
      entry.accessCount++;
      entry.lastAccessed = new Date();
      return entry;
    }
    return undefined;
  }

  /**
   * Buscar en memoria
   */
  search(query: MemoryQuery): MemoryEntry[] {
    let results = Array.from(this.memory.values()).filter(
      entry => !this.isExpired(entry)
    );

    if (query.type) {
      results = results.filter(e => e.type === query.type);
    }

    if (query.category) {
      results = results.filter(e =>
        e.category.toLowerCase().includes(query.category!.toLowerCase())
      );
    }

    if (query.minImportance !== undefined) {
      results = results.filter(e => e.importance >= query.minImportance!);
    }

    // Ordenar por importancia y acceso reciente
    results.sort((a, b) => {
      const scoreA = a.importance + (a.accessCount * 2);
      const scoreB = b.importance + (b.accessCount * 2);
      return scoreB - scoreA;
    });

    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  /**
   * Buscar por categoría
   */
  recallByCategory(category: string): MemoryEntry[] {
    return this.search({ category });
  }

  /**
   * Obtener recuerdos recientes
   */
  getRecent(limit = 10): MemoryEntry[] {
    return Array.from(this.memory.values())
      .filter(e => !this.isExpired(e))
      .sort((a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime())
      .slice(0, limit);
  }

  /**
   * Obtener recuerdos importantes
   */
  getImportant(minImportance = 70): MemoryEntry[] {
    return this.search({ minImportance });
  }

  /**
   * Olvidar (eliminar de memoria)
   */
  forget(id: string): boolean {
    const deleted = this.memory.delete(id);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  /**
   * Olvidar por categoría
   */
  forgetCategory(category: string): number {
    let count = 0;
    this.memory.forEach((entry, id) => {
      if (entry.category === category) {
        this.memory.delete(id);
        count++;
      }
    });
    if (count > 0) {
      this.saveToStorage();
    }
    return count;
  }

  /**
   * Actualizar importancia de un recuerdo
   */
  updateImportance(id: string, importance: number): boolean {
    const entry = this.memory.get(id);
    if (entry) {
      entry.importance = Math.max(0, Math.min(100, importance));
      this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * Consolidar memoria (mover de corto a largo plazo)
   */
  consolidate(id: string): boolean {
    const entry = this.memory.get(id);
    if (entry && entry.type === 'SHORT_TERM') {
      entry.type = 'LONG_TERM';
      entry.expiresAt = undefined;
      entry.importance = Math.min(100, entry.importance + 20);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * Limpiar memorias expiradas
   */
  cleanup(): number {
    let cleaned = 0;
    this.memory.forEach((entry, id) => {
      if (this.isExpired(entry)) {
        this.memory.delete(id);
        cleaned++;
      }
    });
    if (cleaned > 0) {
      this.saveToStorage();
      console.log(`[Memory] Limpiados ${cleaned} recuerdos expirados`);
    }
    return cleaned;
  }

  /**
   * Iniciar limpieza periódica
   */
  private startCleanupInterval(): void {
    // Limpiar cada 5 minutos
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Obtener estadísticas de memoria
   */
  getStats(): {
    total: number;
    byType: Record<MemoryType, number>;
    byCategory: Record<string, number>;
    oldestMemory: Date | null;
    newestMemory: Date | null;
  } {
    const byType: Record<MemoryType, number> = {
      SHORT_TERM: 0,
      MEDIUM_TERM: 0,
      LONG_TERM: 0,
      SEMANTIC: 0,
    };

    const byCategory: Record<string, number> = {};
    let oldest: Date | null = null;
    let newest: Date | null = null;

    this.memory.forEach(entry => {
      if (this.isExpired(entry)) return;

      byType[entry.type]++;
      byCategory[entry.category] = (byCategory[entry.category] || 0) + 1;

      if (!oldest || entry.createdAt < oldest) oldest = entry.createdAt;
      if (!newest || entry.createdAt > newest) newest = entry.createdAt;
    });

    return {
      total: this.memory.size,
      byType,
      byCategory,
      oldestMemory: oldest,
      newestMemory: newest,
    };
  }

  /**
   * Exportar toda la memoria
   */
  export(): MemoryEntry[] {
    return Array.from(this.memory.values()).filter(e => !this.isExpired(e));
  }

  /**
   * Importar memoria
   */
  import(entries: MemoryEntry[]): number {
    let imported = 0;
    entries.forEach(entry => {
      entry.createdAt = new Date(entry.createdAt);
      entry.lastAccessed = new Date(entry.lastAccessed);
      if (entry.expiresAt) entry.expiresAt = new Date(entry.expiresAt);

      if (!this.isExpired(entry)) {
        this.memory.set(entry.id, entry);
        imported++;
      }
    });
    this.saveToStorage();
    return imported;
  }

  /**
   * Limpiar toda la memoria
   */
  clear(): void {
    this.memory.clear();
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Generar ID único
   */
  private generateId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton
export const memoryManager = new MemoryManagerService();
export default memoryManager;
