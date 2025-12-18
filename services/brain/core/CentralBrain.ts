// services/brain/core/CentralBrain.ts
// EL CEREBRO CENTRAL - El coordinador principal de Litper Pro

import { BrainState, BrainConfig, BrainEvent, UnifiedShipment } from '../types/brain.types';
import { eventBus } from './EventBus';
import { memoryManager } from './MemoryManager';
import { contextManager } from './ContextManager';

// Configuración por defecto
const DEFAULT_CONFIG: BrainConfig = {
  shortTermTTL: 30,
  mediumTermTTL: 1440,
  maxMemoryEntries: 10000,
  eventBufferSize: 1000,
  eventProcessingInterval: 100,
  autoExecuteDecisions: false,
  decisionConfidenceThreshold: 70,
  sourcePriority: {
    status: ['TRACKING', 'DROPI', 'MANUAL'],
    location: ['TRACKING', 'DROPI'],
    customer: ['DROPI', 'TRACKING', 'MANUAL'],
    product: ['DROPI', 'MANUAL'],
    carrier: ['TRACKING', 'DROPI'],
  },
  debugMode: false,
  logLevel: 'info',
};

class CentralBrainService {
  private state: BrainState;
  private config: BrainConfig;
  private shipments: Map<string, UnifiedShipment> = new Map();
  private modules: Map<string, unknown> = new Map();

  constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.state = {
      isInitialized: false,
      isProcessing: false,
      lastSync: new Date(),
      memoryUsage: 0,
      eventQueueSize: 0,
      activeRules: 0,
      pendingDecisions: 0,
      health: 'healthy',
    };

    this.initialize();
  }

  /**
   * Inicializar el cerebro
   */
  private async initialize(): Promise<void> {
    console.log('🧠 [Brain] Inicializando Cerebro Central...');

    // Suscribirse a eventos globales
    this.setupEventListeners();

    // Cargar estado guardado
    this.loadPersistedState();

    this.state.isInitialized = true;
    console.log('🧠 [Brain] Cerebro Central inicializado correctamente');

    eventBus.emit('learning.updated', {
      action: 'brain_initialized',
      timestamp: new Date(),
    });
  }

  /**
   * Configurar listeners de eventos
   */
  private setupEventListeners(): void {
    // Escuchar todos los eventos para logging
    eventBus.on('*', (event: BrainEvent) => {
      if (this.config.debugMode) {
        console.log(`🧠 [Brain] Evento: ${event.type}`, event.payload);
      }
    });

    // Eventos de shipments
    eventBus.on('shipment.updated', (event) => {
      this.handleShipmentUpdate(event);
    });

    eventBus.on('shipment.delivered', (event) => {
      this.handleShipmentDelivered(event);
    });

    eventBus.on('shipment.issue', (event) => {
      this.handleShipmentIssue(event);
    });
  }

  /**
   * Cargar estado persistido
   */
  private loadPersistedState(): void {
    const savedShipments = memoryManager.recallByCategory('unified_shipments');
    savedShipments.forEach(entry => {
      const shipment = entry.data as UnifiedShipment;
      if (shipment && shipment.id) {
        this.shipments.set(shipment.id, shipment);
      }
    });

    console.log(`🧠 [Brain] Cargados ${this.shipments.size} envíos unificados`);
  }

  // ==================== GESTIÓN DE SHIPMENTS ====================

  /**
   * Registrar un shipment unificado
   */
  registerShipment(shipment: UnifiedShipment): void {
    this.shipments.set(shipment.id, shipment);

    // Guardar en memoria
    memoryManager.remember('unified_shipments', shipment, {
      type: 'MEDIUM_TERM',
      importance: 60,
      id: `shipment_${shipment.id}`,
    });

    // Emitir evento
    eventBus.emit('shipment.created', {
      shipmentId: shipment.id,
      trackingNumber: shipment.trackingNumber,
      status: shipment.currentStatus.value,
    }, shipment.currentStatus.source);

    // Actualizar contexto operacional
    this.updateOperationalContext();
  }

  /**
   * Obtener shipment por ID
   */
  getShipment(id: string): UnifiedShipment | undefined {
    return this.shipments.get(id);
  }

  /**
   * Obtener shipment por número de tracking
   */
  getShipmentByTracking(trackingNumber: string): UnifiedShipment | undefined {
    return Array.from(this.shipments.values()).find(
      s => s.trackingNumber === trackingNumber
    );
  }

  /**
   * Obtener todos los shipments
   */
  getAllShipments(): UnifiedShipment[] {
    return Array.from(this.shipments.values());
  }

  /**
   * Obtener shipments filtrados
   */
  getShipments(filter?: {
    status?: string;
    carrier?: string;
    hasIssue?: boolean;
    isDelayed?: boolean;
  }): UnifiedShipment[] {
    let shipments = Array.from(this.shipments.values());

    if (filter?.status) {
      shipments = shipments.filter(s => s.currentStatus.value === filter.status);
    }
    if (filter?.carrier) {
      shipments = shipments.filter(s => s.carrier.value === filter.carrier);
    }
    if (filter?.hasIssue !== undefined) {
      shipments = shipments.filter(s => s.hasIssue === filter.hasIssue);
    }
    if (filter?.isDelayed !== undefined) {
      shipments = shipments.filter(s => s.isDelayed === filter.isDelayed);
    }

    return shipments;
  }

  /**
   * Actualizar shipment
   */
  updateShipment(id: string, updates: Partial<UnifiedShipment>): boolean {
    const shipment = this.shipments.get(id);
    if (!shipment) return false;

    const updatedShipment = {
      ...shipment,
      ...updates,
      updatedAt: new Date(),
    };

    this.shipments.set(id, updatedShipment);

    // Actualizar en memoria
    memoryManager.remember('unified_shipments', updatedShipment, {
      type: 'MEDIUM_TERM',
      importance: 60,
      id: `shipment_${id}`,
    });

    eventBus.emit('shipment.updated', {
      shipmentId: id,
      updates,
    });

    return true;
  }

  // ==================== HANDLERS DE EVENTOS ====================

  private handleShipmentUpdate(event: BrainEvent): void {
    const { shipmentId } = event.payload as { shipmentId: string };

    // Recordar en memoria de corto plazo
    memoryManager.remember('recent_updates', {
      shipmentId,
      timestamp: event.timestamp,
    }, { type: 'SHORT_TERM' });

    this.updateOperationalContext();
  }

  private handleShipmentDelivered(event: BrainEvent): void {
    const { shipmentId, trackingNumber } = event.payload as {
      shipmentId: string;
      trackingNumber: string;
    };

    // Recordar entrega exitosa (para aprendizaje)
    memoryManager.remember('successful_deliveries', {
      shipmentId,
      trackingNumber,
      deliveredAt: event.timestamp,
    }, {
      type: 'LONG_TERM',
      importance: 70,
    });

    // Actualizar métricas
    this.updateOperationalContext();
  }

  private handleShipmentIssue(event: BrainEvent): void {
    const { shipmentId, issueType, description } = event.payload as {
      shipmentId: string;
      issueType: string;
      description: string;
    };

    // Recordar problema (para aprendizaje y patrones)
    memoryManager.remember('issues', {
      shipmentId,
      issueType,
      description,
      timestamp: event.timestamp,
    }, {
      type: 'LONG_TERM',
      importance: 80,
    });

    // Emitir alerta
    eventBus.emit('alert.created', {
      type: 'shipment_issue',
      severity: 'warning',
      shipmentId,
      issueType,
      description,
    });
  }

  // ==================== CONTEXTO ====================

  private updateOperationalContext(): void {
    const shipments = this.getAllShipments();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    contextManager.updateOperational({
      totalShipments: shipments.length,
      pendingAlerts: shipments.filter(s => s.hasIssue || s.isDelayed).length,
      criticalIssues: shipments.filter(s => s.currentStatus.value === 'issue').length,
      todayDeliveries: shipments.filter(s => {
        if (!s.actualDelivery) return false;
        const deliveryDate = new Date(s.actualDelivery);
        deliveryDate.setHours(0, 0, 0, 0);
        return deliveryDate.getTime() === today.getTime();
      }).length,
      performanceScore: this.calculatePerformanceScore(shipments),
    });
  }

  private calculatePerformanceScore(shipments: UnifiedShipment[]): number {
    if (shipments.length === 0) return 0;

    const delivered = shipments.filter(s => s.currentStatus.value === 'delivered').length;
    const issues = shipments.filter(s => s.hasIssue).length;
    const delayed = shipments.filter(s => s.isDelayed).length;

    const deliveryRate = (delivered / shipments.length) * 100;
    const issueRate = (issues / shipments.length) * 100;
    const delayRate = (delayed / shipments.length) * 100;

    const score = deliveryRate - (issueRate * 0.5) - (delayRate * 0.3);
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  // ==================== MÓDULOS ====================

  /**
   * Registrar un módulo del cerebro
   */
  registerModule(name: string, module: unknown): void {
    this.modules.set(name, module);
    console.log(`🧠 [Brain] Módulo registrado: ${name}`);
  }

  /**
   * Obtener un módulo
   */
  getModule<T>(name: string): T | undefined {
    return this.modules.get(name) as T | undefined;
  }

  // ==================== CONFIGURACIÓN ====================

  /**
   * Actualizar configuración
   */
  configure(config: Partial<BrainConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Obtener configuración
   */
  getConfig(): BrainConfig {
    return { ...this.config };
  }

  // ==================== ESTADO ====================

  /**
   * Obtener estado del cerebro
   */
  getState(): BrainState {
    const eventStats = eventBus.getStats();
    const memoryStats = memoryManager.getStats();

    return {
      ...this.state,
      eventQueueSize: eventStats.queueSize,
      memoryUsage: memoryStats.total,
    };
  }

  /**
   * Verificar salud del sistema
   */
  checkHealth(): 'healthy' | 'degraded' | 'critical' {
    const memoryStats = memoryManager.getStats();

    if (memoryStats.total > this.config.maxMemoryEntries * 0.9) {
      return 'critical';
    }
    if (memoryStats.total > this.config.maxMemoryEntries * 0.7) {
      return 'degraded';
    }
    return 'healthy';
  }

  // ==================== UTILIDADES ====================

  /**
   * Obtener resumen del estado actual
   */
  getSummary(): {
    shipments: number;
    delivered: number;
    issues: number;
    delayed: number;
    memoryEntries: number;
    health: string;
  } {
    const shipments = this.getAllShipments();
    const memoryStats = memoryManager.getStats();

    return {
      shipments: shipments.length,
      delivered: shipments.filter(s => s.currentStatus.value === 'delivered').length,
      issues: shipments.filter(s => s.hasIssue).length,
      delayed: shipments.filter(s => s.isDelayed).length,
      memoryEntries: memoryStats.total,
      health: this.checkHealth(),
    };
  }

  /**
   * Limpiar y reiniciar
   */
  reset(): void {
    this.shipments.clear();
    memoryManager.clear();
    contextManager.reset();
    eventBus.clearHistory();

    this.state = {
      isInitialized: true,
      isProcessing: false,
      lastSync: new Date(),
      memoryUsage: 0,
      eventQueueSize: 0,
      activeRules: 0,
      pendingDecisions: 0,
      health: 'healthy',
    };

    console.log('🧠 [Brain] Cerebro reiniciado');
  }

  /**
   * Log con prefijo del cerebro
   */
  log(message: string, data?: unknown): void {
    if (this.config.debugMode || this.config.logLevel === 'debug') {
      console.log(`🧠 [Brain] ${message}`, data || '');
    }
  }
}

// Singleton
export const centralBrain = new CentralBrainService();
export default centralBrain;
