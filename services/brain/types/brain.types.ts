// services/brain/types/brain.types.ts
// Tipos centrales del Cerebro de Litper Pro

// ==================== FUENTES DE DATOS ====================

export type DataSource = 'TRACKING' | 'DROPI' | 'MANUAL' | 'SYSTEM';

export interface SourcedData<T> {
  value: T;
  source: DataSource;
  timestamp: Date;
  confidence: number; // 0-100
}

// ==================== EVENTOS ====================

export type BrainEventType =
  | 'shipment.created'
  | 'shipment.updated'
  | 'shipment.delivered'
  | 'shipment.delayed'
  | 'shipment.issue'
  | 'shipment.matched'
  | 'alert.created'
  | 'alert.resolved'
  | 'pattern.detected'
  | 'decision.made'
  | 'action.executed'
  | 'learning.updated'
  | 'context.changed';

export interface BrainEvent {
  id: string;
  type: BrainEventType;
  payload: Record<string, unknown>;
  timestamp: Date;
  source: DataSource;
  metadata?: Record<string, unknown>;
}

export type EventHandler = (event: BrainEvent) => void | Promise<void>;

// ==================== MEMORIA ====================

export type MemoryType = 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM' | 'SEMANTIC';

export interface MemoryEntry {
  id: string;
  type: MemoryType;
  category: string;
  data: unknown;
  createdAt: Date;
  expiresAt?: Date;
  accessCount: number;
  lastAccessed: Date;
  importance: number; // 0-100
}

export interface MemoryQuery {
  type?: MemoryType;
  category?: string;
  minImportance?: number;
  limit?: number;
}

// ==================== CONTEXTO ====================

export interface UserContext {
  userId?: string;
  userName?: string;
  role?: string;
  preferences?: Record<string, unknown>;
}

export interface SessionContext {
  sessionId: string;
  startedAt: Date;
  lastActivity: Date;
  activeTab?: string;
  selectedShipments?: string[];
}

export interface OperationalContext {
  totalShipments: number;
  pendingAlerts: number;
  criticalIssues: number;
  todayDeliveries: number;
  performanceScore: number;
}

export interface BrainContext {
  user: UserContext;
  session: SessionContext;
  operational: OperationalContext;
  customData: Record<string, unknown>;
}

// ==================== ENVÍOS UNIFICADOS ====================

export type ShipmentStatus =
  | 'pending'
  | 'picked_up'
  | 'in_transit'
  | 'in_distribution'
  | 'out_for_delivery'
  | 'delivered'
  | 'in_office'
  | 'issue'
  | 'returned'
  | 'cancelled';

export interface ShipmentEvent {
  id: string;
  timestamp: Date;
  status: ShipmentStatus;
  description: string;
  location?: string;
  source: DataSource;
  rawData?: unknown;
}

export interface UnifiedShipment {
  // Identificadores
  id: string;
  trackingNumber: string;
  orderNumber?: string;
  invoiceNumber?: string;

  // Estado (prioridad: TRACKING)
  currentStatus: SourcedData<ShipmentStatus>;
  lastUpdate: Date;

  // Ubicación (prioridad: TRACKING)
  currentLocation?: SourcedData<string>;
  origin: SourcedData<string>;
  destination: SourcedData<string>;

  // Cliente (prioridad: DROPI)
  customer: {
    name: SourcedData<string>;
    phone?: SourcedData<string>;
    email?: SourcedData<string>;
    address: SourcedData<string>;
  };

  // Producto (prioridad: DROPI)
  product?: {
    name: SourcedData<string>;
    quantity: SourcedData<number>;
    value: SourcedData<number>;
  };

  // Logística (prioridad: TRACKING)
  carrier: SourcedData<string>;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  daysInTransit: number;

  // Problemas
  hasIssue: boolean;
  issueType?: string;
  issueDescription?: string;
  isDelayed: boolean;

  // Timeline completo
  events: ShipmentEvent[];

  // Metadatos
  sources: DataSource[];
  matchConfidence: number; // Qué tan seguro está de que los datos coinciden
  createdAt: Date;
  updatedAt: Date;
}

// ==================== PATRONES ====================

export interface DetectedPattern {
  id: string;
  type: string;
  name: string;
  description: string;
  confidence: number;
  occurrences: number;
  lastSeen: Date;
  data: Record<string, unknown>;
  actionable: boolean;
  suggestedAction?: string;
}

// ==================== DECISIONES ====================

export type DecisionType =
  | 'send_notification'
  | 'send_whatsapp'
  | 'escalate_alert'
  | 'update_status'
  | 'create_task'
  | 'predict_delay'
  | 'suggest_action';

export interface Decision {
  id: string;
  type: DecisionType;
  reason: string;
  confidence: number;
  action: {
    type: string;
    params: Record<string, unknown>;
  };
  createdAt: Date;
  executedAt?: Date;
  result?: 'success' | 'failure' | 'pending';
}

// ==================== REGLAS DE AUTOMATIZACIÓN ====================

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: {
    event: BrainEventType;
    conditions: Record<string, unknown>;
  };
  action: {
    type: DecisionType;
    params: Record<string, unknown>;
  };
  priority: number;
  executionCount: number;
  lastExecuted?: Date;
}

// ==================== INSIGHTS ====================

export interface Insight {
  id: string;
  type: 'info' | 'warning' | 'success' | 'critical';
  category: string;
  title: string;
  description: string;
  data?: Record<string, unknown>;
  actionable: boolean;
  suggestedAction?: string;
  createdAt: Date;
  expiresAt?: Date;
  dismissed: boolean;
}

// ==================== ESTADO DEL CEREBRO ====================

export interface BrainState {
  isInitialized: boolean;
  isProcessing: boolean;
  lastSync: Date;
  memoryUsage: number;
  eventQueueSize: number;
  activeRules: number;
  pendingDecisions: number;
  health: 'healthy' | 'degraded' | 'critical';
}

// ==================== CONFIGURACIÓN ====================

export interface BrainConfig {
  // Memoria
  shortTermTTL: number; // minutos
  mediumTermTTL: number; // horas
  maxMemoryEntries: number;

  // Eventos
  eventBufferSize: number;
  eventProcessingInterval: number; // ms

  // Decisiones
  autoExecuteDecisions: boolean;
  decisionConfidenceThreshold: number; // 0-100

  // Fuentes
  sourcePriority: Record<string, DataSource[]>;

  // Debug
  debugMode: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}
