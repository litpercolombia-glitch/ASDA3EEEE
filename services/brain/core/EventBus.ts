// services/brain/core/EventBus.ts
// Sistema de eventos centralizado - Los servicios se comunican aquí

import { BrainEvent, BrainEventType, EventHandler, DataSource } from '../types/brain.types';

type EventCallback = (event: BrainEvent) => void | Promise<void>;

class EventBusService {
  private listeners: Map<BrainEventType | '*', Set<EventCallback>> = new Map();
  private eventHistory: BrainEvent[] = [];
  private maxHistorySize = 1000;
  private isProcessing = false;
  private eventQueue: BrainEvent[] = [];

  constructor() {
    this.listeners = new Map();
    this.eventHistory = [];
    this.eventQueue = [];
  }

  /**
   * Suscribirse a un tipo de evento
   */
  on(eventType: BrainEventType | '*', callback: EventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    // Retorna función para desuscribirse
    return () => this.off(eventType, callback);
  }

  /**
   * Desuscribirse de un evento
   */
  off(eventType: BrainEventType | '*', callback: EventCallback): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Suscribirse a un evento una sola vez
   */
  once(eventType: BrainEventType, callback: EventCallback): void {
    const wrapper: EventCallback = (event) => {
      this.off(eventType, wrapper);
      callback(event);
    };
    this.on(eventType, wrapper);
  }

  /**
   * Emitir un evento
   */
  emit(
    type: BrainEventType,
    payload: Record<string, unknown>,
    source: DataSource = 'SYSTEM',
    metadata?: Record<string, unknown>
  ): BrainEvent {
    const event: BrainEvent = {
      id: this.generateEventId(),
      type,
      payload,
      timestamp: new Date(),
      source,
      metadata,
    };

    // Agregar a la cola
    this.eventQueue.push(event);

    // Procesar cola
    this.processQueue();

    // Guardar en historial
    this.addToHistory(event);

    return event;
  }

  /**
   * Procesar cola de eventos
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!;
      await this.notifyListeners(event);
    }

    this.isProcessing = false;
  }

  /**
   * Notificar a todos los listeners
   */
  private async notifyListeners(event: BrainEvent): Promise<void> {
    const specificListeners = this.listeners.get(event.type) || new Set();
    const wildcardListeners = this.listeners.get('*') || new Set();

    const allListeners = [...specificListeners, ...wildcardListeners];

    for (const listener of allListeners) {
      try {
        await listener(event);
      } catch (error) {
        console.error(`[EventBus] Error en listener para ${event.type}:`, error);
      }
    }
  }

  /**
   * Agregar evento al historial
   */
  private addToHistory(event: BrainEvent): void {
    this.eventHistory.unshift(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Obtener historial de eventos
   */
  getHistory(options?: {
    type?: BrainEventType;
    source?: DataSource;
    limit?: number;
    since?: Date;
  }): BrainEvent[] {
    let events = [...this.eventHistory];

    if (options?.type) {
      events = events.filter(e => e.type === options.type);
    }
    if (options?.source) {
      events = events.filter(e => e.source === options.source);
    }
    if (options?.since) {
      events = events.filter(e => e.timestamp >= options.since!);
    }
    if (options?.limit) {
      events = events.slice(0, options.limit);
    }

    return events;
  }

  /**
   * Obtener último evento de un tipo
   */
  getLastEvent(type: BrainEventType): BrainEvent | undefined {
    return this.eventHistory.find(e => e.type === type);
  }

  /**
   * Limpiar historial
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Obtener estadísticas
   */
  getStats(): {
    totalListeners: number;
    historySize: number;
    queueSize: number;
    eventTypes: string[];
  } {
    let totalListeners = 0;
    const eventTypes: string[] = [];

    this.listeners.forEach((callbacks, type) => {
      totalListeners += callbacks.size;
      if (type !== '*') eventTypes.push(type);
    });

    return {
      totalListeners,
      historySize: this.eventHistory.length,
      queueSize: this.eventQueue.length,
      eventTypes,
    };
  }

  /**
   * Generar ID único para evento
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Esperar a que ocurra un evento
   */
  waitFor(eventType: BrainEventType, timeout = 30000): Promise<BrainEvent> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.off(eventType, handler);
        reject(new Error(`Timeout esperando evento: ${eventType}`));
      }, timeout);

      const handler: EventCallback = (event) => {
        clearTimeout(timer);
        resolve(event);
      };

      this.once(eventType, handler);
    });
  }

  /**
   * Emitir múltiples eventos
   */
  emitBatch(events: Array<{
    type: BrainEventType;
    payload: Record<string, unknown>;
    source?: DataSource;
  }>): BrainEvent[] {
    return events.map(e => this.emit(e.type, e.payload, e.source));
  }
}

// Singleton
export const eventBus = new EventBusService();
export default eventBus;
