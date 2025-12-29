# PLAN ESTRUCTURADO LITPER PRO v6.0
## Arquitectura Completa + Interfaces + Funciones + Conexiones

**Fecha:** 29 de Diciembre 2024
**Versión:** 6.0 (Chat-First Architecture)

---

# ÍNDICE

1. [Arquitectura General](#1-arquitectura-general)
2. [Mapa de Servicios](#2-mapa-de-servicios)
3. [Interfaces TypeScript](#3-interfaces-typescript)
4. [Funciones por Módulo](#4-funciones-por-módulo)
5. [Conexiones e Integraciones](#5-conexiones-e-integraciones)
6. [Sistema de Skills](#6-sistema-de-skills)
7. [Flujos de Datos](#7-flujos-de-datos)
8. [Plan de Implementación](#8-plan-de-implementación)
9. [Checklist de Verificación](#9-checklist-de-verificación)

---

# 1. ARQUITECTURA GENERAL

## 1.1 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              LITPER PRO v6.0                                 │
│                         ARQUITECTURA CHAT-FIRST                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                                FRONTEND                                      │
│                        React 19 + TypeScript 5.8                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                      CAPA DE PRESENTACIÓN                               │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                         │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │ │
│  │  │   CHAT      │ │ SEGUIMIENTO │ │ OPERACIONES │ │    ADMIN    │       │ │
│  │  │  COMMAND    │ │    TAB      │ │    TAB      │ │   PANEL     │       │ │
│  │  │  CENTER     │ │             │ │             │ │             │       │ │
│  │  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘       │ │
│  │         │               │               │               │              │ │
│  │  ┌──────▼───────────────▼───────────────▼───────────────▼──────┐       │ │
│  │  │                    SKILLS ENGINE                             │       │ │
│  │  │  📦 Guías │ 🗺️ Ciudades │ ⚠️ Novedades │ 💰 Finanzas │ etc │       │ │
│  │  └──────────────────────────┬───────────────────────────────────┘       │ │
│  │                             │                                           │ │
│  └─────────────────────────────┼───────────────────────────────────────────┘ │
│                                │                                              │
│  ┌─────────────────────────────▼───────────────────────────────────────────┐ │
│  │                      CAPA DE ESTADO (ZUSTAND)                           │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │  shipmentStore │ authStore │ uiStore │ analyticsStore │ cargaStore     │ │
│  └─────────────────────────────┬───────────────────────────────────────────┘ │
│                                │                                              │
│  ┌─────────────────────────────▼───────────────────────────────────────────┐ │
│  │                      CAPA DE SERVICIOS                                  │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │  skillsService │ chateaService │ webhookService │ supabaseService      │ │
│  │  authService │ logisticsService │ financeService │ trackingService     │ │
│  └─────────────────────────────┬───────────────────────────────────────────┘ │
│                                │                                              │
└────────────────────────────────┼──────────────────────────────────────────────┘
                                 │ HTTPS / WebSocket
┌────────────────────────────────▼──────────────────────────────────────────────┐
│                                BACKEND                                         │
│                          FastAPI (Python 3.11+)                                │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │                         API GATEWAY                                       │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │  /api/chat        │ /api/guias      │ /api/webhooks   │ /api/tracking   │ │
│  │  /api/brain       │ /api/whatsapp   │ /api/knowledge  │ /api/admin      │ │
│  └──────────────────────────────┬───────────────────────────────────────────┘ │
│                                 │                                              │
│  ┌──────────────────────────────▼───────────────────────────────────────────┐ │
│  │                       CAPA DE NEGOCIO                                     │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                           │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │ │
│  │  │   BRAIN     │  │  KNOWLEDGE  │  │   ML        │  │ INTEGRATION │      │ │
│  │  │  AUTÓNOMO   │  │   SYSTEM    │  │  MODELS     │  │   GATEWAY   │      │ │
│  │  │             │  │             │  │             │  │             │      │ │
│  │  │ Claude AI   │  │ RAG + Docs  │  │ Predicción  │  │ Chatea      │      │ │
│  │  │ Decisiones  │  │ YouTube     │  │ Anomalías   │  │ Dropi       │      │ │
│  │  │ Proactivas  │  │ Web Scrape  │  │ Clustering  │  │ Carriers    │      │ │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘      │ │
│  │         │                │                │                │             │ │
│  └─────────┼────────────────┼────────────────┼────────────────┼─────────────┘ │
│            │                │                │                │               │
│  ┌─────────▼────────────────▼────────────────▼────────────────▼─────────────┐ │
│  │                        TASK QUEUE (Redis)                                 │ │
│  │  Priority: critical │ high │ normal │ low │ + Dead Letter Queue          │ │
│  └──────────────────────────────┬────────────────────────────────────────────┘ │
│                                 │                                              │
└─────────────────────────────────┼──────────────────────────────────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
┌─────────▼─────────┐   ┌────────▼────────┐   ┌─────────▼─────────┐
│    PostgreSQL     │   │      Redis      │   │     Supabase      │
│   (Datos Core)    │   │  (Cache/Queue)  │   │  (Auth/Storage)   │
├───────────────────┤   ├─────────────────┤   ├───────────────────┤
│ • guias           │   │ • Sessions      │   │ • Users           │
│ • ciudades        │   │ • Cache API     │   │ • Auth tokens     │
│ • transportadoras │   │ • Task Queue    │   │ • Files           │
│ • alertas         │   │ • Rate limits   │   │ • Real-time       │
│ • metricas        │   │ • Pub/Sub       │   │ • RLS policies    │
└───────────────────┘   └─────────────────┘   └───────────────────┘
```

## 1.2 Stack Tecnológico Completo

### Frontend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 19.2.0 | UI Framework |
| TypeScript | 5.8.2 | Tipado estático |
| Vite | 6.2.0 | Build tool |
| Zustand | 5.0.9 | State management |
| TailwindCSS | 3.3.6 | Estilos |
| Lucide React | 0.513.0 | Iconos |
| Recharts | 3.5.1 | Gráficos |
| xlsx | 0.18.5 | Procesamiento Excel |
| jsPDF | 2.5.1 | Generación PDF |

### Backend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| FastAPI | latest | Framework API |
| SQLAlchemy | 2.0.27 | ORM (async) |
| PostgreSQL | 15 | Base de datos |
| Redis | 7 | Cache + Queue |
| Loguru | latest | Logging |
| Pydantic | 2.x | Validación |
| scikit-learn | latest | ML Models |

### Integraciones
| Servicio | Propósito | Estado |
|----------|-----------|--------|
| Chatea Pro | WhatsApp Business | ✅ Activo |
| Dropi | E-commerce/Pedidos | ✅ Via Chatea |
| N8N | Orquestación | ✅ Webhooks |
| Claude AI | Brain Autónomo | ✅ Activo |
| Gemini | Respaldo AI | ✅ Activo |
| Supabase | Auth + Storage | ✅ Activo |

---

# 2. MAPA DE SERVICIOS

## 2.1 Servicios Frontend (72 archivos)

### Servicios Core
```
services/
├── authService.ts          # Autenticación (⚠️ REQUIERE FIX)
├── supabaseService.ts      # Cliente Supabase
├── skillsService.ts        # Motor de Skills (9 activos)
├── chateaService.ts        # WhatsApp via Chatea (⚠️ API KEY EXPUESTA)
├── webhookService.ts       # Handlers webhooks (⚠️ SIN HMAC)
└── logisticsService.ts     # Lógica de envíos
```

### Servicios de IA
```
services/
├── claudeService.ts        # Cliente Claude
├── claudeBrainService.ts   # Cerebro autónomo
├── geminiService.ts        # Cliente Gemini
├── unifiedAIService.ts     # Abstracción multi-AI
├── aiScoringService.ts     # Scoring con IA
└── secureAIService.ts      # Proxy seguro IA
```

### Servicios de Logística
```
services/
├── trackingAgentService.ts    # Agente de tracking
├── statusParserService.ts     # Parser de estados
├── cargaService.ts            # Gestión de cargas
├── ordersService.ts           # Gestión pedidos
├── ordersAgentService.ts      # Agente de pedidos
├── novedadesAgentService.ts   # Agente novedades
└── agentCityService.ts        # Agente ciudades
```

### Servicios de Análisis
```
services/
├── analyticsService.ts        # Analytics general
├── predictiveService.ts       # Predicciones
├── predictiveAlertService.ts  # Alertas predictivas
├── recommendationEngine.ts    # Motor recomendaciones
├── procesosAnalysisService.ts # Análisis procesos
└── mlService.ts               # Machine Learning
```

### Servicios de Comunicación
```
services/
├── whatsappIntegrationService.ts  # WhatsApp
├── notificationsService.ts        # Notificaciones
├── pushNotificationService.ts     # Push
├── alertasService.ts              # Sistema alertas
└── supportService.ts              # Soporte
```

### Servicios de Configuración
```
services/
├── viewPreferencesService.ts  # Preferencias vista
├── excelConfigService.ts      # Config Excel
├── presetsService.ts          # Presets usuario
├── tabsService.ts             # Gestión tabs
└── globalStorageService.ts    # Storage global
```

## 2.2 Rutas Backend (14 archivos)

```
backend/routes/
├── brain_routes.py            # /api/brain/*
├── chatea_pro_routes.py       # /api/chatea-pro/*
├── tracking_routes.py         # /api/tracking/*
├── tracking_ordenes_routes.py # /api/tracking-ordenes/*
├── webhook_routes.py          # /api/webhooks/*
├── whatsapp_routes.py         # /api/whatsapp/*
├── websocket_routes.py        # /ws/*
├── tracker_routes.py          # /api/tracker/*
├── rescue_routes.py           # /api/rescue/*
├── push_routes.py             # /api/push/*
├── carga_routes.py            # /api/carga/*
└── ai_proxy_routes.py         # /api/ai/* (Proxy seguro)
```

## 2.3 Stores Zustand (9 stores)

```typescript
// stores/index.ts
export { useShipmentStore } from './shipmentStore';   // Guías y envíos
export { useAuthStore } from './authStore';           // Autenticación
export { useUIStore } from './uiStore';               // Estado UI
export { useAnalyticsStore } from './analyticsStore'; // Métricas
export { useCargaStore } from './cargaStore';         // Cargas
export { useDashboardStore } from './dashboardStore'; // Dashboard
export { useProAssistantStore } from './proAssistantStore'; // Asistente
```

---

# 3. INTERFACES TYPESCRIPT

## 3.1 Interfaces de Guías

```typescript
// types/guia.ts

export interface Guia {
  id: string;
  numero_guia: string;
  transportadora: string;
  estado: EstadoGuia;
  ciudad_destino: string;
  ciudad_origen?: string;
  destinatario: string;
  telefono?: string;
  direccion?: string;
  valor_declarado?: number;
  peso?: number;
  fecha_creacion: string;
  fecha_actualizacion: string;
  dias_transito: number;
  novedad?: Novedad;
  historial: HistorialEstado[];
  metadata?: Record<string, unknown>;
}

export type EstadoGuia =
  | 'Pendiente'
  | 'En Tránsito'
  | 'En Reparto'
  | 'Entregado'
  | 'Devuelto'
  | 'Con Novedad'
  | 'Cancelado';

export interface Novedad {
  tipo: TipoNovedad;
  descripcion: string;
  fecha: string;
  resuelta: boolean;
  resolucion?: string;
}

export type TipoNovedad =
  | 'DIRECCION_INCORRECTA'
  | 'TELEFONO_INCORRECTO'
  | 'DESTINATARIO_AUSENTE'
  | 'RECHAZADO'
  | 'DANADO'
  | 'ZONA_DIFICIL'
  | 'OTRO';

export interface HistorialEstado {
  estado: EstadoGuia;
  fecha: string;
  detalle?: string;
  ubicacion?: string;
}
```

## 3.2 Interfaces de Skills

```typescript
// types/skills.ts

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: SkillCategory;
  keywords: string[];
  requiredPermission?: Permission;
  riskLevel: RiskLevel;
  execute: (params: SkillParams) => Promise<SkillResult>;
}

export type SkillCategory =
  | 'logistica'
  | 'finanzas'
  | 'comunicacion'
  | 'analisis'
  | 'automatizacion'
  | 'web'
  | 'admin';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface SkillParams {
  action?: string;
  filtro?: string;
  guia?: string;
  ciudad?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  [key: string]: unknown;
}

export interface SkillResult {
  success: boolean;
  message: string;
  data?: unknown;
  artifacts?: SkillArtifact[];
  actions?: SkillAction[];
  suggestions?: string[];
}

export interface SkillArtifact {
  type: 'table' | 'chart' | 'card' | 'list' | 'map' | 'timeline';
  title: string;
  data: unknown;
  config?: ArtifactConfig;
}

export interface SkillAction {
  id: string;
  label: string;
  icon: string;
  action: string;
  params?: Record<string, unknown>;
  confirmRequired: boolean;
  riskLevel: RiskLevel;
}
```

## 3.3 Interfaces de Webhooks

```typescript
// types/webhook.ts

export interface WebhookPayload {
  event: WebhookEvent;
  data: Record<string, unknown>;
  timestamp: string;
  source: WebhookSource;
  signature?: string;
}

export type WebhookEvent =
  | 'order_created'
  | 'order_updated'
  | 'status_changed'
  | 'delivery_confirmed'
  | 'issue_reported'
  | 'delay_detected'
  | 'customer_message';

export type WebhookSource = 'dropi' | 'chatea' | 'coordinadora' | 'servientrega' | 'interrapidisimo' | 'tcc' | 'envia';

export interface TransportadoraWebhook {
  guia: string;
  estado: string;
  fecha: string;
  detalle?: string;
  transportadora: string;
  ciudad?: string;
  novedad?: {
    tipo: string;
    descripcion: string;
  };
}

export interface DropiWebhook {
  order_id: string;
  tracking_number: string;
  status: string;
  carrier: string;
  customer: {
    name: string;
    phone: string;
    address: string;
    city: string;
  };
  product: {
    name: string;
    quantity: number;
    price: number;
  };
}
```

## 3.4 Interfaces de Usuario y Auth

```typescript
// types/auth.ts

export interface User {
  id: string;
  email: string;
  nombre: string;
  rol: UserRole;
  permisos: Permission[];
  empresa?: string;
  avatar?: string;
  preferences: UserPreferences;
  created_at: string;
  last_login?: string;
}

export type UserRole = 'admin' | 'supervisor' | 'operador' | 'viewer';

export type Permission =
  | 'guias:read'
  | 'guias:write'
  | 'guias:delete'
  | 'novedades:resolve'
  | 'whatsapp:send'
  | 'reports:generate'
  | 'settings:edit'
  | 'users:manage'
  | 'brain:autonomous';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  safeMode: SafeMode;
  defaultTab: string;
  notifications: NotificationPrefs;
}

export type SafeMode = 'suggest' | 'confirm' | 'critical' | 'autonomous';
```

## 3.5 Interfaces de Integraciones

```typescript
// types/integrations.ts

export interface IntegrationConfig {
  id: string;
  name: string;
  type: IntegrationType;
  enabled: boolean;
  config: Record<string, string>;
  healthCheck: HealthStatus;
  lastSync?: string;
}

export type IntegrationType = 'chatea' | 'dropi' | 'carrier' | 'ai' | 'storage';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  lastCheck: string;
  latency?: number;
  errorRate?: number;
  message?: string;
}

export interface ChateaConfig {
  apiKey: string;        // ⚠️ Mover a backend
  webhookUrl: string;
  baseUrl: string;
  timeout: number;
}

export interface CarrierConfig {
  name: string;
  apiUrl?: string;
  webhookEndpoint: string;
  credentials?: {
    username: string;
    password: string;  // ⚠️ Encriptar
    token?: string;
  };
  statusMapping: Record<string, EstadoGuia>;
}
```

---

# 4. FUNCIONES POR MÓDULO

## 4.1 Módulo de Guías

```typescript
// services/guiasService.ts

export const guiasService = {
  // CRUD
  async getAll(filters?: GuiaFilters): Promise<Guia[]>,
  async getById(id: string): Promise<Guia | null>,
  async create(guia: CreateGuiaDTO): Promise<Guia>,
  async update(id: string, data: UpdateGuiaDTO): Promise<Guia>,
  async delete(id: string): Promise<boolean>,

  // Búsqueda
  async search(query: string): Promise<Guia[]>,
  async getByNumero(numero: string): Promise<Guia | null>,
  async getByTransportadora(carrier: string): Promise<Guia[]>,
  async getByEstado(estado: EstadoGuia): Promise<Guia[]>,
  async getByDateRange(start: Date, end: Date): Promise<Guia[]>,

  // Análisis
  async getStats(): Promise<GuiaStats>,
  async getStatsByCity(): Promise<CityStats[]>,
  async getStatsByCarrier(): Promise<CarrierStats[]>,
  async getNovedadesPendientes(): Promise<Guia[]>,
  async getRetrasadas(diasUmbral: number): Promise<Guia[]>,

  // Acciones
  async marcarRevisada(id: string): Promise<Guia>,
  async resolverNovedad(id: string, resolucion: string): Promise<Guia>,
  async actualizarEstado(id: string, estado: EstadoGuia): Promise<Guia>,
  async asignarTransportadora(id: string, carrier: string): Promise<Guia>,

  // Bulk
  async importFromExcel(file: File): Promise<ImportResult>,
  async exportToExcel(filters?: GuiaFilters): Promise<Blob>,
  async bulkUpdate(ids: string[], data: Partial<Guia>): Promise<number>,
};
```

## 4.2 Módulo de Skills

```typescript
// services/skillsService.ts

export const skillsService = {
  // Registro de Skills
  skills: Map<string, SkillDefinition>,

  // Core
  async detectSkill(message: string): Promise<SkillMatch | null>,
  async executeSkill(skillId: string, params: SkillParams): Promise<SkillResult>,
  async getSuggestions(context: ChatContext): Promise<string[]>,

  // Gestión
  registerSkill(skill: SkillDefinition): void,
  getSkillById(id: string): SkillDefinition | undefined,
  getSkillsByCategory(category: SkillCategory): SkillDefinition[],
  getAllSkills(): SkillDefinition[],

  // Seguridad
  async executeWithSafeMode(
    skillId: string,
    params: SkillParams,
    safeMode: SafeMode
  ): Promise<SkillResult>,
  checkPermission(skill: SkillDefinition, user: User): boolean,
};

// Skills Implementados (9 actuales)
const SKILLS_REGISTRY = {
  guias: guiasSkill,
  ciudades: ciudadesSkill,
  novedades: novedadesSkill,
  finanzas: finanzasSkill,
  whatsapp: whatsappSkill,
  alertas: alertasSkill,
  reportes: reportesSkill,
  web: webSkill,
  clima: climaSkill,
};
```

## 4.3 Módulo de Webhooks

```typescript
// services/webhookService.ts

export const webhookService = {
  // Handlers
  async handleTransportadora(payload: TransportadoraWebhook): Promise<WebhookResult>,
  async handleDropi(payload: DropiWebhook): Promise<WebhookResult>,
  async handleChatea(payload: ChateaWebhook): Promise<WebhookResult>,

  // Verificación (⚠️ IMPLEMENTAR)
  verifySignature(payload: string, signature: string, secret: string): boolean,
  verifyHMAC(payload: string, signature: string, secret: string): boolean,

  // Procesamiento
  mapEstado(estado: string, source: WebhookSource): EstadoGuia,
  normalizePayload(payload: unknown, source: WebhookSource): NormalizedPayload,

  // Cola
  async queueWebhook(payload: WebhookPayload): Promise<string>,
  async processQueue(): Promise<void>,
  async retryFailed(): Promise<number>,

  // Logs
  async logWebhook(payload: WebhookPayload, result: WebhookResult): Promise<void>,
  async getWebhookHistory(filters?: WebhookFilters): Promise<WebhookLog[]>,
};
```

## 4.4 Módulo de Comunicación

```typescript
// services/chateaService.ts

export const chateaService = {
  // Mensajes
  async sendMessage(to: string, message: string): Promise<MessageResult>,
  async sendTemplate(to: string, template: string, params: string[]): Promise<MessageResult>,
  async sendMedia(to: string, mediaUrl: string, caption?: string): Promise<MessageResult>,

  // Alertas
  async sendAlert(alert: AlertaWhatsApp): Promise<MessageResult>,
  async sendBulkAlert(alert: AlertaWhatsApp): Promise<BulkResult>,

  // Templates
  getTemplate(type: AlertType): (titulo: string, mensaje: string, datos?: Record<string, unknown>) => string,

  // Estado
  async checkHealth(): Promise<HealthStatus>,
  async getMessageStatus(messageId: string): Promise<MessageStatus>,
};

// services/notificationsService.ts

export const notificationsService = {
  // Push
  async sendPush(userId: string, notification: PushNotification): Promise<void>,
  async sendBulkPush(userIds: string[], notification: PushNotification): Promise<void>,

  // In-App
  async create(notification: InAppNotification): Promise<Notification>,
  async markAsRead(id: string): Promise<void>,
  async getUnread(userId: string): Promise<Notification[]>,

  // Preferencias
  async getPreferences(userId: string): Promise<NotificationPrefs>,
  async updatePreferences(userId: string, prefs: Partial<NotificationPrefs>): Promise<void>,
};
```

## 4.5 Módulo de Análisis

```typescript
// services/analyticsService.ts

export const analyticsService = {
  // Métricas en tiempo real
  async getRealTimeStats(): Promise<RealTimeStats>,
  async getKPIs(period: Period): Promise<KPISet>,

  // Históricos
  async getTrends(metric: string, period: Period): Promise<TrendData>,
  async comparePerioods(period1: Period, period2: Period): Promise<Comparison>,

  // Predicciones
  async predictDeliveryTime(guia: Guia): Promise<Prediction>,
  async predictMonthlyKPIs(): Promise<MonthlyPrediction>,
  async detectAnomalies(period: Period): Promise<Anomaly[]>,

  // Reportes
  async generateReport(type: ReportType, filters: ReportFilters): Promise<Report>,
  async scheduleReport(config: ScheduledReport): Promise<void>,
  async getReportHistory(): Promise<Report[]>,
};

// services/predictiveService.ts

export const predictiveService = {
  // Modelos
  async trainModel(modelType: ModelType, data: TrainingData): Promise<Model>,
  async predict(model: Model, input: unknown): Promise<Prediction>,

  // Específicos
  async predictCityPerformance(ciudad: string): Promise<CityPrediction>,
  async predictCarrierPerformance(carrier: string): Promise<CarrierPrediction>,
  async predictChurn(cliente: string): Promise<ChurnPrediction>,

  // Alertas
  async getProactiveAlerts(): Promise<ProactiveAlert[]>,
  async configureAlertThresholds(thresholds: AlertThresholds): Promise<void>,
};
```

---

# 5. CONEXIONES E INTEGRACIONES

## 5.1 Diagrama de Conexiones

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CONEXIONES EXTERNAS                               │
└─────────────────────────────────────────────────────────────────────────┘

                              LITPER PRO
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│  CHATEA PRO   │       │     DROPI     │       │ TRANSPORTADORAS│
│               │       │               │       │               │
│ WhatsApp API  │◄─────►│  E-commerce   │       │ Coordinadora  │
│ Webhooks      │       │  Pedidos      │       │ Servientrega  │
│ N8N Orch.     │       │  Inventario   │       │ Inter         │
│               │       │               │       │ TCC           │
│ Estado: ✅    │       │ Estado: ✅    │       │ Envía         │
│ Método: API   │       │ Via: Chatea   │       │               │
└───────────────┘       └───────────────┘       │ Estado: ✅    │
                                                │ Método: Webhook│
                                                └───────────────┘
        │                         │                         │
        └─────────────────────────┼─────────────────────────┘
                                  │
                                  ▼
                        ┌───────────────┐
                        │   LITPER      │
                        │   BACKEND     │
                        │               │
                        │ FastAPI       │
                        │ PostgreSQL    │
                        │ Redis         │
                        └───────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│   CLAUDE AI   │       │  GEMINI AI    │       │   SUPABASE    │
│               │       │               │       │               │
│ Brain Autónomo│       │ Respaldo      │       │ Auth          │
│ Skills        │       │ Análisis      │       │ Storage       │
│ Análisis      │       │               │       │ Real-time     │
│               │       │               │       │               │
│ Estado: ✅    │       │ Estado: ✅    │       │ Estado: ✅    │
│ Método: API   │       │ Método: API   │       │ Método: SDK   │
└───────────────┘       └───────────────┘       └───────────────┘
```

## 5.2 Tabla de Integraciones

| Integración | Endpoint | Método | Auth | Estado | Notas |
|-------------|----------|--------|------|--------|-------|
| **Chatea Pro** | `chateapro.app/api` | REST | API Key | ✅ | ⚠️ Key en frontend |
| **Dropi** | Via Chatea/N8N | Webhook | - | ✅ | Sin acceso directo |
| **Coordinadora** | Webhook entrante | POST | HMAC | ⚠️ | Sin verificación |
| **Servientrega** | Webhook entrante | POST | HMAC | ⚠️ | Sin verificación |
| **Inter** | Webhook entrante | POST | HMAC | ⚠️ | Sin verificación |
| **Claude** | `api.anthropic.com` | REST | API Key | ✅ | Via backend |
| **Gemini** | `generativelanguage.googleapis.com` | REST | API Key | ✅ | Via backend |
| **Supabase** | `supabase.co` | SDK | Anon Key | ✅ | Auth + Storage |
| **N8N** | Webhook bidireccional | POST | - | ✅ | Orquestación |

## 5.3 Flujo de Webhooks

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          FLUJO DE WEBHOOKS                                │
└──────────────────────────────────────────────────────────────────────────┘

ENTRADA (Webhook Recibido)
│
├── 1. RECEPCIÓN
│   │
│   ├── POST /api/webhooks/dropi
│   ├── POST /api/webhooks/transportadora
│   └── POST /api/chatea-pro/webhook
│
├── 2. VALIDACIÓN (⚠️ MEJORAR)
│   │
│   ├── Verificar firma HMAC ────────► [NO IMPLEMENTADO]
│   ├── Validar payload schema
│   └── Check rate limit
│
├── 3. NORMALIZACIÓN
│   │
│   ├── Mapear estados ──────────────► ESTADO_MAP
│   ├── Extraer datos relevantes
│   └── Enriquecer con contexto
│
├── 4. PROCESAMIENTO
│   │
│   ├── Actualizar guía en DB
│   ├── Disparar alertas si aplica
│   ├── Notificar via WebSocket
│   └── Enviar a Brain si crítico
│
├── 5. RESPUESTA
│   │
│   ├── 200 OK + acknowledgment
│   └── Log del evento
│
└── 6. POST-PROCESO (Async)
    │
    ├── Análisis con IA
    ├── Actualizar métricas
    └── Enviar notificaciones
```

## 5.4 Configuración de Conexiones

```typescript
// config/integrations.ts

export const INTEGRATIONS_CONFIG = {
  chatea: {
    baseUrl: 'https://chateapro.app/api',
    webhookUrl: process.env.CHATEA_WEBHOOK_URL,
    timeout: 30000,
    retries: 3,
    // ⚠️ API Key debe moverse al backend
  },

  carriers: {
    coordinadora: {
      name: 'Coordinadora',
      webhookEndpoint: '/api/webhooks/coordinadora',
      statusMapping: {
        'ADMITIDO': 'En Tránsito',
        'EN DISTRIBUCION': 'En Reparto',
        'ENTREGADO': 'Entregado',
        'DEVUELTO': 'Devuelto',
        'NOVEDAD': 'Con Novedad',
      },
    },
    servientrega: {
      name: 'Servientrega',
      webhookEndpoint: '/api/webhooks/servientrega',
      statusMapping: {
        'RECIBIDO': 'Pendiente',
        'EN CAMINO': 'En Tránsito',
        'EN CIUDAD DESTINO': 'En Reparto',
        'ENTREGA EXITOSA': 'Entregado',
        'NO ENTREGADO': 'Con Novedad',
      },
    },
    // ... más transportadoras
  },

  ai: {
    claude: {
      model: 'claude-3-sonnet-20240229',
      maxTokens: 4096,
      temperature: 0.7,
    },
    gemini: {
      model: 'gemini-pro',
      maxTokens: 4096,
    },
  },

  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
  },
};
```

---

# 6. SISTEMA DE SKILLS

## 6.1 Skills Actuales (9)

| # | ID | Nombre | Categoría | Keywords | Estado |
|---|-----|--------|-----------|----------|--------|
| 1 | `guias` | Guías | Logística | guia, envio, tracking, rastreo | ✅ |
| 2 | `ciudades` | Ciudades | Logística | ciudad, semaforo, zona | ✅ |
| 3 | `novedades` | Novedades | Logística | novedad, problema, issue | ✅ |
| 4 | `finanzas` | Finanzas | Finanzas | dinero, cobro, pago, costo | ✅ |
| 5 | `whatsapp` | WhatsApp | Comunicación | whatsapp, mensaje, enviar | ✅ |
| 6 | `alertas` | Alertas | Comunicación | alerta, notificacion, aviso | ✅ |
| 7 | `reportes` | Reportes | Análisis | reporte, informe, resumen | ✅ |
| 8 | `web` | Web Search | Web | buscar, google, internet | ✅ |
| 9 | `clima` | Clima | Web | clima, tiempo, lluvia | ✅ |

## 6.2 Skills Nuevos Propuestos (15)

| # | ID | Nombre | Categoría | Función Principal | Prioridad |
|---|-----|--------|-----------|-------------------|-----------|
| 1 | `conciliar` | Conciliar | Logística | Sync Dropi ↔ Transportadora | P1 |
| 2 | `recotizar` | Recotizar | Logística | Reintentar cotización fallida | P2 |
| 3 | `anomalias` | Anomalías | Análisis | Detectar patrones inusuales | P2 |
| 4 | `priorizar` | Priorizar | Automatización | Ordenar por urgencia | P1 |
| 5 | `mensaje_cliente` | Mensaje | Comunicación | Generar mensaje personalizado | P1 |
| 6 | `clasificar_novedad` | Clasificar | Automatización | Categorizar novedad | P1 |
| 7 | `transportadora_optima` | Optimizar | Logística | Recomendar mejor carrier | P2 |
| 8 | `proyeccion` | Proyección | Análisis | Proyectar KPIs del mes | P2 |
| 9 | `comparar` | Comparar | Análisis | Comparar períodos | P2 |
| 10 | `cliente_vip` | VIP | CRM | Gestión clientes VIP | P3 |
| 11 | `devolucion` | Devolución | Logística | Flujo de devolución | P2 |
| 12 | `reasignar` | Reasignar | Logística | Cambiar transportadora | P2 |
| 13 | `escalar` | Escalar | Comunicación | Escalar a supervisor | P1 |
| 14 | `tendencias` | Tendencias | Análisis | Analizar tendencias | P2 |
| 15 | `automatizar` | Automatizar | Automatización | Crear reglas automáticas | P3 |

## 6.3 Implementación de Skill (Ejemplo)

```typescript
// services/skills/conciliarSkill.ts

import { SkillDefinition, SkillResult } from '@/types/skills';
import { guiasService } from '@/services/supabaseService';
import { dropiService } from '@/services/integrations/dropiService';

export const conciliarSkill: SkillDefinition = {
  id: 'conciliar',
  name: 'Conciliar Estados',
  description: 'Comparar y sincronizar estados entre Dropi y transportadoras',
  icon: '🔄',
  category: 'logistica',
  keywords: ['conciliar', 'sincronizar', 'comparar', 'dropi', 'estado', 'diferencia'],
  requiredPermission: 'guias:write',
  riskLevel: 'medium',

  async execute(params): Promise<SkillResult> {
    try {
      const fechaInicio = params.fecha_inicio as string || getDefaultStartDate();
      const fechaFin = params.fecha_fin as string || new Date().toISOString();

      // 1. Obtener guías locales
      const guiasLocales = await guiasService.getByDateRange(
        new Date(fechaInicio),
        new Date(fechaFin)
      );

      // 2. Obtener estados de Dropi
      const estadosDropi = await dropiService.getOrderStatuses(
        guiasLocales.map(g => g.numero_guia)
      );

      // 3. Comparar y encontrar discrepancias
      const discrepancias = findDiscrepancies(guiasLocales, estadosDropi);

      if (discrepancias.length === 0) {
        return {
          success: true,
          message: '✅ Todo sincronizado! No hay discrepancias.',
          data: { checked: guiasLocales.length },
        };
      }

      // 4. Retornar con acciones
      return {
        success: true,
        message: `🔄 Encontré ${discrepancias.length} discrepancias entre Dropi y el sistema:`,
        data: { discrepancias },
        artifacts: [
          {
            type: 'table',
            title: 'Discrepancias Detectadas',
            data: discrepancias.map(d => ({
              'Guía': d.guia,
              'Estado Local': d.estadoLocal,
              'Estado Dropi': d.estadoDropi,
              'Días': d.diasDiferencia,
              'Recomendación': d.recomendacion,
            })),
          },
        ],
        actions: [
          {
            id: 'sync_all',
            label: '🔄 Sincronizar Todo',
            icon: 'RefreshCw',
            action: 'sync_dropi_all',
            confirmRequired: true,
            riskLevel: 'high',
          },
          {
            id: 'sync_selected',
            label: '✅ Sincronizar Seleccionadas',
            icon: 'Check',
            action: 'sync_dropi_selected',
            confirmRequired: true,
            riskLevel: 'medium',
          },
          {
            id: 'export',
            label: '📊 Exportar Reporte',
            icon: 'Download',
            action: 'export_discrepancies',
            confirmRequired: false,
            riskLevel: 'low',
          },
        ],
        suggestions: [
          '¿Quieres ver el historial de estas guías?',
          '¿Configurar sincronización automática?',
          '¿Notificar al equipo sobre estas discrepancias?',
        ],
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Error al conciliar: ${error.message}`,
      };
    }
  },
};

function findDiscrepancies(local: Guia[], dropi: DropiStatus[]): Discrepancy[] {
  const discrepancias: Discrepancy[] = [];

  for (const guia of local) {
    const dropiStatus = dropi.find(d => d.tracking === guia.numero_guia);

    if (!dropiStatus) continue;

    const estadoDropiNormalizado = mapDropiStatus(dropiStatus.status);

    if (guia.estado !== estadoDropiNormalizado) {
      discrepancias.push({
        guia: guia.numero_guia,
        estadoLocal: guia.estado,
        estadoDropi: estadoDropiNormalizado,
        diasDiferencia: calcularDias(guia.fecha_actualizacion, dropiStatus.updated_at),
        recomendacion: getRecomendacion(guia.estado, estadoDropiNormalizado),
      });
    }
  }

  return discrepancias;
}
```

---

# 7. FLUJOS DE DATOS

## 7.1 Flujo: Carga de Guías

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      FLUJO: CARGA DE GUÍAS                               │
└─────────────────────────────────────────────────────────────────────────┘

USUARIO                    FRONTEND                      BACKEND
   │                          │                             │
   │  1. Sube archivo Excel   │                             │
   ├─────────────────────────►│                             │
   │                          │                             │
   │                          │  2. parseExcelFile()        │
   │                          ├────────────────┐            │
   │                          │                │            │
   │                          │◄───────────────┘            │
   │                          │                             │
   │                          │  3. detectCarrier()         │
   │                          │     para cada guía          │
   │                          ├────────────────┐            │
   │                          │                │            │
   │                          │◄───────────────┘            │
   │                          │                             │
   │                          │  4. POST /api/guias/bulk    │
   │                          ├────────────────────────────►│
   │                          │                             │
   │                          │                             │  5. Validar
   │                          │                             │  6. Guardar en DB
   │                          │                             │  7. Crear alertas
   │                          │                             │
   │                          │  8. Response: { created, updated, errors }
   │                          │◄────────────────────────────┤
   │                          │                             │
   │                          │  9. setShipments()          │
   │                          │     (Zustand store)         │
   │                          │                             │
   │  10. UI actualizada      │                             │
   │◄─────────────────────────┤                             │
   │                          │                             │
   │                          │  11. saveToLocalStorage()   │
   │                          │      (backup offline)       │
   │                          │                             │
```

## 7.2 Flujo: Webhook Entrante

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      FLUJO: WEBHOOK ENTRANTE                             │
└─────────────────────────────────────────────────────────────────────────┘

TRANSPORTADORA              BACKEND                       FRONTEND
      │                        │                             │
      │  1. POST /webhook      │                             │
      │     { guia, estado }   │                             │
      ├───────────────────────►│                             │
      │                        │                             │
      │                        │  2. verifySignature() ⚠️   │
      │                        │     (IMPLEMENTAR)          │
      │                        │                             │
      │                        │  3. mapEstado()            │
      │                        │     Normalizar estado      │
      │                        │                             │
      │                        │  4. UPDATE guia in DB      │
      │                        │                             │
      │                        │  5. Evaluar alertas        │
      │                        │     - ¿Novedad crítica?    │
      │                        │     - ¿Retraso detectado?  │
      │                        │                             │
      │                        │  6. Si crítico → Brain     │
      │                        │     analyze_with_brain()   │
      │                        │                             │
      │  7. 200 OK             │                             │
      │◄───────────────────────┤                             │
      │                        │                             │
      │                        │  8. WebSocket broadcast    │
      │                        ├────────────────────────────►│
      │                        │                             │
      │                        │                             │  9. updateGuia()
      │                        │                             │     en store
      │                        │                             │
      │                        │                             │  10. Toast/Alert
      │                        │                             │      si novedad
      │                        │                             │
```

## 7.3 Flujo: Chat con Skills

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      FLUJO: CHAT CON SKILLS                              │
└─────────────────────────────────────────────────────────────────────────┘

USUARIO                    CHAT CENTER                   SKILLS ENGINE
   │                          │                             │
   │  "Muéstrame las          │                             │
   │   novedades de hoy"      │                             │
   ├─────────────────────────►│                             │
   │                          │                             │
   │                          │  1. detectSkill(message)    │
   │                          ├────────────────────────────►│
   │                          │                             │
   │                          │                             │  2. Match keywords
   │                          │                             │     "novedades" → skill
   │                          │                             │
   │                          │  3. { skill: 'novedades' }  │
   │                          │◄────────────────────────────┤
   │                          │                             │
   │                          │  4. extractParams(message)  │
   │                          │     { filtro: 'hoy' }       │
   │                          │                             │
   │                          │  5. executeSkill('novedades', params)
   │                          ├────────────────────────────►│
   │                          │                             │
   │                          │                             │  6. Query DB
   │                          │                             │  7. Format result
   │                          │                             │  8. Generate actions
   │                          │                             │
   │                          │  9. SkillResult             │
   │                          │     { message, artifacts,   │
   │                          │       actions, suggestions }│
   │                          │◄────────────────────────────┤
   │                          │                             │
   │  10. Render:             │                             │
   │      - Mensaje           │                             │
   │      - Tabla novedades   │                             │
   │      - Botones acción    │                             │
   │      - Sugerencias       │                             │
   │◄─────────────────────────┤                             │
   │                          │                             │
   │  11. Click "Resolver"    │                             │
   │      (acción)            │                             │
   ├─────────────────────────►│                             │
   │                          │                             │
   │                          │  12. checkSafeMode()        │
   │                          │      Si CONFIRM → Modal     │
   │                          │                             │
```

---

# 8. PLAN DE IMPLEMENTACIÓN

## 8.1 Fase 0: Seguridad (Semana 1)

### Día 1-2: CORS + API Keys
```bash
# Tareas:
□ Configurar CORS con dominios específicos en main.py
□ Crear endpoint proxy /api/messaging/whatsapp
□ Mover CHATEA_API_KEY al backend (.env)
□ Actualizar chateaService.ts para usar proxy
□ Test de integración
```

### Día 3-4: Autenticación
```bash
# Tareas:
□ Instalar bcryptjs en frontend
□ Crear migration para usuarios en Supabase
□ Migrar usuarios hardcodeados a Supabase Auth
□ Actualizar authService.ts
□ Actualizar AuthWrapper.tsx
□ Test de login/logout
```

### Día 5: Webhooks
```bash
# Tareas:
□ Implementar verifyHMAC() real
□ Configurar secrets por transportadora
□ Agregar logging de webhooks fallidos
□ Test con webhook de prueba
```

## 8.2 Fase 1: Productividad (Semanas 2-4)

### Semana 2: Refactorización
```bash
# Tareas:
□ Dividir SeguimientoTab.tsx en 5 componentes
□ Crear SeguimientoHeader.tsx
□ Crear GuiaTablePro.tsx
□ Crear GuiaFilters.tsx
□ Crear GuiaReviewPanel.tsx
□ Crear SeguimientoSheets.tsx
□ Tests de componentes
```

### Semana 3: Integration Gateway
```bash
# Tareas:
□ Crear IntegrationGateway.ts
□ Implementar CircuitBreaker
□ Implementar RetryPolicy
□ Crear adapters: ChateaAdapter, CarrierAdapter
□ Unificar manejo de errores
□ Agregar métricas
```

### Semana 4: Reconciliación + Paginación
```bash
# Tareas:
□ Crear ReconciliationService
□ Implementar job de reconciliación (cron)
□ UI para ver discrepancias
□ Implementar paginación server-side
□ Crear hook usePaginatedGuias
□ Virtualización de tablas
```

## 8.3 Fase 2: IA (Semanas 5-12)

### Semanas 5-6: Skills Core
```bash
# Skills a implementar:
□ conciliar - Sincronización Dropi
□ priorizar - Ordenar por urgencia
□ mensaje_cliente - Generar mensajes
□ clasificar_novedad - Categorizar
□ escalar - Escalamiento
```

### Semanas 7-8: Skills Análisis
```bash
# Skills a implementar:
□ anomalias - Detección ML
□ proyeccion - Proyectar KPIs
□ comparar - Comparar períodos
□ tendencias - Analizar tendencias
```

### Semanas 9-10: Skills Logística
```bash
# Skills a implementar:
□ recotizar - Reintentar cotización
□ transportadora_optima - Recomendar
□ devolucion - Flujo devolución
□ reasignar - Cambiar carrier
```

### Semanas 11-12: Modo Seguro + UI
```bash
# Tareas:
□ Implementar SafeMode
□ Crear ConfirmationModal
□ Agregar risk levels a acciones
□ Rediseñar home como Chat-First
□ Crear SkillSelector visual
□ Tests E2E
```

---

# 9. CHECKLIST DE VERIFICACIÓN

## 9.1 Conexiones a Verificar

### Frontend → Backend
| Conexión | Endpoint | Test | Estado |
|----------|----------|------|--------|
| Health check | GET /health | `curl localhost:8000/health` | ⬜ |
| Guías | GET /api/guias | `curl localhost:8000/api/guias` | ⬜ |
| Chat | POST /api/chat | Test con mensaje | ⬜ |
| WebSocket | WS /ws | Test conexión | ⬜ |

### Backend → Base de Datos
| Conexión | Test | Estado |
|----------|------|--------|
| PostgreSQL | `SELECT 1` | ⬜ |
| Redis | `PING` | ⬜ |
| Supabase | Auth test | ⬜ |

### Backend → Servicios Externos
| Conexión | Test | Estado |
|----------|------|--------|
| Chatea API | Health check | ⬜ |
| Claude API | Simple prompt | ⬜ |
| Gemini API | Simple prompt | ⬜ |

### Webhooks Entrantes
| Fuente | Endpoint | Test | Estado |
|--------|----------|------|--------|
| Coordinadora | POST /api/webhooks/coordinadora | Payload test | ⬜ |
| Servientrega | POST /api/webhooks/servientrega | Payload test | ⬜ |
| Dropi/Chatea | POST /api/chatea-pro/webhook | Payload test | ⬜ |

## 9.2 Funcionalidades a Verificar

### Core
| Funcionalidad | Test | Estado |
|---------------|------|--------|
| Login/Logout | Manual | ⬜ |
| Carga Excel | Subir archivo test | ⬜ |
| Detección transportadora | 10 guías test | ⬜ |
| Filtros guías | Todos los filtros | ⬜ |
| Exportar Excel | Descargar | ⬜ |
| Exportar PDF | Descargar | ⬜ |

### Skills
| Skill | Test | Estado |
|-------|------|--------|
| guias | "Resumen de guías" | ⬜ |
| ciudades | "Semáforo de ciudades" | ⬜ |
| novedades | "Novedades de hoy" | ⬜ |
| finanzas | "Resumen financiero" | ⬜ |
| whatsapp | "Envía mensaje test" | ⬜ |
| alertas | "Ver alertas" | ⬜ |
| reportes | "Genera reporte" | ⬜ |
| web | "Busca en Google X" | ⬜ |
| clima | "Clima en Bogotá" | ⬜ |

### Integraciones
| Integración | Test | Estado |
|-------------|------|--------|
| Chatea envío | Mensaje test | ⬜ |
| Webhook recepción | Payload simulado | ⬜ |
| Brain autónomo | Análisis test | ⬜ |
| WebSocket | Broadcast test | ⬜ |

## 9.3 Scripts de Verificación

```bash
# scripts/verify-connections.sh

#!/bin/bash

echo "🔍 Verificando conexiones LITPER PRO..."

# 1. Backend health
echo "1. Backend health..."
curl -s http://localhost:8000/health | jq .

# 2. PostgreSQL
echo "2. PostgreSQL..."
docker exec litper-db psql -U postgres -c "SELECT 1"

# 3. Redis
echo "3. Redis..."
docker exec litper-redis redis-cli PING

# 4. Frontend
echo "4. Frontend..."
curl -s http://localhost:5173 | head -1

# 5. WebSocket
echo "5. WebSocket..."
wscat -c ws://localhost:8000/ws --execute "ping"

echo "✅ Verificación completa"
```

```bash
# scripts/verify-skills.sh

#!/bin/bash

echo "🤖 Verificando Skills..."

SKILLS=("guias" "ciudades" "novedades" "finanzas" "alertas" "reportes")

for skill in "${SKILLS[@]}"; do
  echo "Testing skill: $skill"
  curl -s -X POST http://localhost:8000/api/chat \
    -H "Content-Type: application/json" \
    -d "{\"message\": \"test $skill\"}" | jq .success
done

echo "✅ Skills verificados"
```

---

# 10. RESUMEN EJECUTIVO

## Qué tienes ahora:
- ✅ 72 servicios frontend
- ✅ 14 rutas backend
- ✅ 9 skills funcionando
- ✅ Integraciones Chatea/Dropi activas
- ✅ Brain autónomo con Claude
- ⚠️ 5 vulnerabilidades de seguridad
- ⚠️ Código gigante sin refactorizar

## Qué vas a tener:
- ✅ Sistema 100% seguro
- ✅ 24 skills de logística
- ✅ Integration Gateway robusto
- ✅ Reconciliación automática
- ✅ Chat-First como interfaz principal
- ✅ Modo seguro para IA
- ✅ Performance optimizada

## Tiempo estimado:
- **Fase 0 (Seguridad):** 1 semana
- **Fase 1 (Productividad):** 3 semanas
- **Fase 2 (IA):** 8 semanas
- **TOTAL:** ~3 meses

---

*Plan creado por Claude (Opus 4.5) - 29 de Diciembre 2024*
