// types/integrations.ts
// Tipos para el sistema de integraciones multi-IA

// ==================== PROVEEDORES DE IA ====================

export type AIProviderType = 'chatea' | 'claude' | 'openai' | 'gemini' | 'llama';

export interface AIProviderConfig {
  id: AIProviderType;
  name: string;
  description: string;
  apiKey: string;
  baseUrl?: string;
  model?: string;
  enabled: boolean;
  isConnected: boolean;
  lastCheck?: Date;
  icon: string;
  color: string;
}

export interface AIProviderStatus {
  id: AIProviderType;
  connected: boolean;
  latency?: number;
  error?: string;
  lastCheck: Date;
}

// ==================== CONEXIONES DE DATOS ====================

export type DataConnectionType = 'chatea' | 'dropi' | 'carriers' | 'supabase' | 'tracker';

export interface DataConnectionConfig {
  id: DataConnectionType;
  name: string;
  description: string;
  apiKey?: string;
  baseUrl?: string;
  database?: string;
  enabled: boolean;
  isConnected: boolean;
  syncInterval: number; // minutos
  lastSync?: Date;
  dataPercentage?: number; // % de datos que maneja
  icon: string;
  color: string;
}

// ==================== ASIGNACIÓN DE IA POR FUNCIÓN ====================

export type AIFunction =
  | 'chat_principal'
  | 'analisis_datos'
  | 'generacion_texto'
  | 'traducciones'
  | 'skills_execution'
  | 'predicciones'
  | 'deteccion_patrones';

export interface AIFunctionAssignment {
  function: AIFunction;
  label: string;
  description: string;
  assignedProvider: AIProviderType;
  fallbackProvider?: AIProviderType;
}

// ==================== CONFIGURACIÓN GLOBAL ====================

export interface IntegrationsConfig {
  aiProviders: AIProviderConfig[];
  dataConnections: DataConnectionConfig[];
  functionAssignments: AIFunctionAssignment[];
  defaultProvider: AIProviderType;
}

// ==================== MENSAJES Y RESPUESTAS ====================

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  provider?: AIProviderType;
  metadata?: Record<string, unknown>;
}

export interface AIResponse {
  content: string;
  provider: AIProviderType;
  model?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latency: number;
  timestamp: Date;
}

// ==================== CHATEA ESPECÍFICO ====================

export interface ChateaConfig {
  apiKey: string;
  baseUrl: string;
  webhookUrl?: string;
  businessId?: string;
}

export interface ChateaCustomer {
  id: string;
  phone: string;
  name: string;
  email?: string;
  address?: string;
  city?: string;
  lifetimeValue: number;
  ordersCount: number;
  lastOrder?: Date;
  lastChat?: Date;
  tags?: string[];
}

export interface ChateaOrder {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  products: ChateaProduct[];
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  shippingAddress: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChateaProduct {
  id: string;
  name: string;
  quantity: number;
  price: number;
  sku?: string;
  image?: string;
}

export interface ChateaChat {
  id: string;
  customerId: string;
  customerPhone: string;
  customerName: string;
  messages: ChateaChatMessage[];
  status: 'active' | 'waiting' | 'resolved' | 'archived';
  assignedTo?: string;
  tags?: string[];
  createdAt: Date;
  lastMessage: Date;
}

export interface ChateaChatMessage {
  id: string;
  direction: 'incoming' | 'outgoing';
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'template';
  content: string;
  mediaUrl?: string;
  timestamp: Date;
  status?: 'sent' | 'delivered' | 'read' | 'failed';
}

export interface ChateaCampaign {
  id: string;
  name: string;
  description?: string;
  template: string;
  segment: ChateaSegment;
  scheduledAt?: Date;
  sentAt?: Date;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'cancelled';
  stats?: {
    sent: number;
    delivered: number;
    read: number;
    clicked: number;
    replied: number;
  };
}

export interface ChateaSegment {
  id: string;
  name: string;
  conditions: Record<string, unknown>[];
  customerCount: number;
}

export interface ChateaTemplate {
  id: string;
  name: string;
  category: 'transactional' | 'marketing' | 'utility';
  content: string;
  variables: string[];
  status: 'approved' | 'pending' | 'rejected';
}

export interface ChateaAnalytics {
  date: string;
  sales: {
    total: number;
    count: number;
    average: number;
  };
  chats: {
    total: number;
    resolved: number;
    avgResponseTime: number;
  };
  orders: {
    created: number;
    confirmed: number;
    cancelled: number;
  };
  conversion: {
    rate: number;
    chatToOrder: number;
  };
}

// ==================== VISTA UNIFICADA 360 ====================

export interface Customer360 {
  // Identificación
  id: string;
  chateaId?: string;
  phone: string;
  name: string;
  email?: string;

  // Ubicación
  address?: string;
  city?: string;
  department?: string;

  // Métricas
  lifetimeValue: number;
  ordersCount: number;
  shipmentsCount: number;
  issuesCount: number;

  // Historial
  orders: ChateaOrder[];
  shipments: ShipmentReference[];
  chats: ChateaChat[];
  alerts: AlertReference[];

  // Engagement
  lastOrder?: Date;
  lastShipment?: Date;
  lastChat?: Date;
  lastInteraction?: Date;

  // Segmentación
  segment?: 'vip' | 'regular' | 'new' | 'inactive' | 'at_risk';
  tags?: string[];

  // Calculados
  avgOrderValue: number;
  avgDeliveryTime: number;
  satisfactionScore?: number;
}

export interface ShipmentReference {
  id: string;
  trackingNumber: string;
  carrier: string;
  status: string;
  createdAt: Date;
  deliveredAt?: Date;
}

export interface AlertReference {
  id: string;
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  resolved: boolean;
  createdAt: Date;
}

// ==================== DEFAULTS ====================

export const DEFAULT_AI_PROVIDERS: AIProviderConfig[] = [
  {
    id: 'chatea',
    name: 'Chatea AI',
    description: 'IA principal para operaciones y WhatsApp',
    apiKey: '',
    baseUrl: 'https://api.chatea.io/v1',
    enabled: false,
    isConnected: false,
    icon: '💬',
    color: 'emerald',
  },
  {
    id: 'claude',
    name: 'Claude (Anthropic)',
    description: 'Análisis profundo y razonamiento',
    apiKey: '',
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-3-sonnet-20240229',
    enabled: false,
    isConnected: false,
    icon: '🟣',
    color: 'purple',
  },
  {
    id: 'openai',
    name: 'ChatGPT (OpenAI)',
    description: 'Generación de texto y creatividad',
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4-turbo-preview',
    enabled: false,
    isConnected: false,
    icon: '🟢',
    color: 'green',
  },
  {
    id: 'gemini',
    name: 'Gemini (Google)',
    description: 'Multimodal y traducciones',
    apiKey: '',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-1.5-flash',
    enabled: false,
    isConnected: false,
    icon: '🔵',
    color: 'blue',
  },
];

export const DEFAULT_DATA_CONNECTIONS: DataConnectionConfig[] = [
  {
    id: 'chatea',
    name: 'Chatea Pro',
    description: 'Chats, ventas, clientes y pedidos',
    enabled: false,
    isConnected: false,
    syncInterval: 1,
    dataPercentage: 98,
    icon: '💬',
    color: 'emerald',
  },
  {
    id: 'dropi',
    name: 'Dropi',
    description: 'Pedidos y productos dropshipping',
    enabled: false,
    isConnected: false,
    syncInterval: 5,
    icon: '📦',
    color: 'orange',
  },
  {
    id: 'carriers',
    name: 'Transportadoras',
    description: 'Tracking y estados de envío',
    enabled: true,
    isConnected: true,
    syncInterval: 1,
    icon: '🚚',
    color: 'blue',
  },
  {
    id: 'tracker',
    name: 'Litper Tracker Desktop',
    description: 'Sincronización con app de escritorio',
    baseUrl: 'https://litper-tracker-api.onrender.com/api/tracker',
    enabled: false,
    isConnected: false,
    syncInterval: 1,
    icon: '🖥️',
    color: 'purple',
  },
];

export const DEFAULT_FUNCTION_ASSIGNMENTS: AIFunctionAssignment[] = [
  {
    function: 'chat_principal',
    label: 'Chat Principal',
    description: 'Conversaciones y comandos del usuario',
    assignedProvider: 'chatea',
  },
  {
    function: 'analisis_datos',
    label: 'Análisis de Datos',
    description: 'Patrones, tendencias y reportes',
    assignedProvider: 'claude',
  },
  {
    function: 'generacion_texto',
    label: 'Generación de Texto',
    description: 'Mensajes, descripciones y contenido',
    assignedProvider: 'openai',
  },
  {
    function: 'skills_execution',
    label: 'Ejecución de Skills',
    description: 'Automatizaciones y acciones',
    assignedProvider: 'chatea',
  },
  {
    function: 'predicciones',
    label: 'Predicciones',
    description: 'Ventas, demanda y retrasos',
    assignedProvider: 'claude',
  },
];
