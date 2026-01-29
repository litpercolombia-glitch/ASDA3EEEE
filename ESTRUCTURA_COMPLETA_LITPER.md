# LITPER PRO - Documentación Completa del Sistema

> **Sistema de Gestión Logística con Inteligencia Artificial**
> Versión: 2.0 | Última actualización: Enero 2026

---

## Índice

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Estructura de Carpetas](#2-estructura-de-carpetas)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Arquitectura del Sistema](#4-arquitectura-del-sistema)
5. [Funcionalidades por Módulo](#5-funcionalidades-por-módulo)
6. [Componentes React (165+)](#6-componentes-react)
7. [Servicios TypeScript (75+)](#7-servicios-typescript)
8. [Sistema Brain (Cerebro IA)](#8-sistema-brain)
9. [Stores de Estado (Zustand)](#9-stores-de-estado)
10. [Hooks Personalizados](#10-hooks-personalizados)
11. [API Backend (FastAPI)](#11-api-backend)
12. [Base de Datos](#12-base-de-datos)
13. [Integraciones Externas](#13-integraciones-externas)
14. [Sistema de Autenticación](#14-sistema-de-autenticación)
15. [Roles y Permisos](#15-roles-y-permisos)
16. [Infraestructura](#16-infraestructura)
17. [Apps Desktop (Electron)](#17-apps-desktop)
18. [Estado de Funcionalidades](#18-estado-de-funcionalidades)

---

## 1. Resumen Ejecutivo

**LITPER PRO** es un sistema empresarial de gestión logística impulsado por Inteligencia Artificial. Permite:

- Tracking multi-transportadora en tiempo real
- Automatización de tareas con IA (Claude, Gemini, OpenAI)
- Dashboard ejecutivo con KPIs y predicciones
- Sistema de rescate inteligente de envíos problemáticos
- Integración con WhatsApp Business
- Apps desktop para operadores de campo
- Machine Learning para predicción de entregas

### Estadísticas del Proyecto

| Métrica | Cantidad |
|---------|----------|
| Componentes React | 165+ |
| Servicios TypeScript | 75+ |
| Hooks Personalizados | 15 |
| Archivos de Tipos | 22 |
| Stores Zustand | 12 |
| Endpoints API | 50+ |
| Integraciones Externas | 12+ |
| Centros de Admin | 19 |

---

## 2. Estructura de Carpetas

```
/home/user/ASDA3EEEE/
│
├── 📁 api/                      # API Serverless (Vercel Functions)
│   └── ai-proxy.ts              # Proxy para llamadas de IA
│
├── 📁 backend/                  # Backend Python/FastAPI
│   ├── main.py                  # Punto de entrada
│   ├── routes/                  # 15+ routers API
│   ├── brain/                   # Cerebro IA autónomo
│   ├── auth/                    # Sistema de autenticación
│   ├── models/                  # Modelos SQLAlchemy
│   ├── integrations/            # Integraciones externas
│   ├── ml_models/               # Modelos de Machine Learning
│   └── workers/                 # Tareas asíncronas
│
├── 📁 components/               # 165+ Componentes React
│   ├── Admin/                   # 19 centros de administración
│   ├── Dashboard/               # KPIs, gráficos, analytics
│   ├── brain/                   # Brain Dashboard, Journey, Timeline
│   ├── chat/                    # UnifiedChat, ChateaAI, LitperAI
│   ├── CommandCenter/           # Centro de comando
│   ├── RescueSystem/            # Sistema de rescate
│   ├── ml/                      # Machine Learning UI
│   ├── auth/                    # Login, registro
│   ├── tabs/                    # Pestañas principales
│   └── ui/                      # Componentes base
│
├── 📁 services/                 # 75+ Servicios TypeScript
│   ├── brain/                   # Cerebro central autónomo
│   ├── integrations/            # Gestión de integraciones
│   ├── executor/                # Ejecución de acciones
│   ├── auth/                    # Autenticación admin
│   └── [otros servicios]
│
├── 📁 stores/                   # Zustand State Management
│   ├── authStore.ts
│   ├── shipmentStore.ts
│   ├── uiStore.ts
│   └── [otros stores]
│
├── 📁 hooks/                    # 15 Custom Hooks
├── 📁 types/                    # 22 Archivos de tipos TypeScript
├── 📁 utils/                    # 14 Utilidades
├── 📁 config/                   # Configuración (constants.ts)
│
├── 📁 infrastructure/           # DevOps
│   ├── kubernetes/
│   ├── prometheus/
│   └── alertmanager/
│
├── 📁 dbt/                      # Data Transformation Pipeline
├── 📁 tests/                    # Test Suites (Vitest + Pytest)
│
├── 📁 litper-pedidos-app/       # App Electron - Pedidos
├── 📁 litper-tracker/           # App Electron - Tracker
├── 📁 electron/                 # Wrapper Electron base
│
├── 📁 public/                   # Archivos estáticos
├── 📁 .github/workflows/        # CI/CD Pipelines
│
├── package.json                 # Dependencias npm
├── vite.config.ts               # Configuración Vite
├── tailwind.config.js           # Configuración Tailwind
├── docker-compose.yml           # Stack containerizado
└── tsconfig.json                # Configuración TypeScript
```

---

## 3. Stack Tecnológico

### Frontend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 19.2.0 | Framework UI |
| TypeScript | 5.8 | Tipado estático |
| Vite | 6.2 | Bundler/Dev Server |
| Zustand | 5.0.9 | Estado global |
| Tailwind CSS | 3.x | Estilos |
| Lucide React | - | Iconografía |
| Recharts | 3.5 | Gráficos |
| xlsx | - | Procesamiento Excel |
| jsPDF | - | Generación PDF |
| date-fns | - | Manejo de fechas |

### Backend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| FastAPI | 0.109.2 | Framework API |
| Python | 3.11 | Lenguaje backend |
| PostgreSQL | 15 | Base de datos |
| Redis | 7 | Cache + Queue |
| SQLAlchemy | 2.0.27 | ORM |
| Pydantic | 2.6 | Validación |
| scikit-learn | - | Machine Learning |
| XGBoost | - | ML Avanzado |
| APScheduler | - | Tareas programadas |
| Loguru | - | Logging |

### Integraciones IA

| Servicio | SDK | Modelos |
|----------|-----|---------|
| Anthropic | 0.71 | claude-sonnet-4, claude-3-5-haiku |
| Google GenAI | 1.30 | gemini-1.5-flash, gemini-1.5-pro |
| OpenAI | - | gpt-4o-mini |
| Chatea Pro | Custom | WhatsApp + IA |

### Infraestructura

| Tecnología | Propósito |
|------------|-----------|
| Docker | Containerización |
| Nginx | Reverse Proxy |
| Kubernetes | Orquestación |
| Prometheus | Observabilidad |
| AlertManager | Alertas |
| GitHub Actions | CI/CD |
| Vercel | Hosting Frontend |
| dbt | Data Pipeline |

---

## 4. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                          LITPER PRO                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐   │
│  │   FRONTEND      │   │    BACKEND      │   │   SERVICIOS     │   │
│  │   React/Vite    │◄─►│    FastAPI      │◄─►│   EXTERNOS      │   │
│  │                 │   │                 │   │                 │   │
│  │ • Dashboard     │   │ • REST API      │   │ • Claude AI     │   │
│  │ • Admin Panel   │   │ • WebSockets    │   │ • Gemini AI     │   │
│  │ • Chat IA       │   │ • Brain Engine  │   │ • WhatsApp      │   │
│  │ • Tracking      │   │ • ML Models     │   │ • Transportadoras│  │
│  └────────┬────────┘   └────────┬────────┘   └─────────────────┘   │
│           │                     │                                    │
│           ▼                     ▼                                    │
│  ┌─────────────────────────────────────────┐                        │
│  │              ZUSTAND STORES              │                        │
│  │  authStore │ shipmentStore │ uiStore    │                        │
│  └─────────────────────────────────────────┘                        │
│                          │                                           │
│           ┌──────────────┼──────────────┐                           │
│           ▼              ▼              ▼                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │ PostgreSQL  │  │    Redis    │  │  LocalStore │                  │
│  │ (DB Main)   │  │  (Cache)    │  │ (Frontend)  │                  │
│  └─────────────┘  └─────────────┘  └─────────────┘                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Flujo de Datos

```
Usuario → Frontend → API Backend → Brain Engine → IA Externa
                                        ↓
                            Decisión/Respuesta
                                        ↓
                        ← Frontend ← WebSocket ←
```

---

## 5. Funcionalidades por Módulo

### 5.1 Dashboard Ejecutivo

| Funcionalidad | Descripción | Estado |
|---------------|-------------|--------|
| KPIs en tiempo real | Métricas de envíos, entregas, problemas | ✅ Activo |
| Gráficos interactivos | Recharts con filtros dinámicos | ✅ Activo |
| Semáforo de estados | Visualización rápida de alertas | ✅ Activo |
| Predicciones IA | Forecast de entregas con ML | ✅ Activo |
| Exportación PDF | Reportes descargables | ✅ Activo |

### 5.2 Tracking Multi-Transportadora

| Transportadora | API | Estado |
|----------------|-----|--------|
| Coordinadora | REST | ✅ Integrado |
| Servientrega | REST | ✅ Integrado |
| TCC | REST | ✅ Integrado |
| Envía | REST | ✅ Integrado |
| Inter Rapidísimo | REST | ✅ Integrado |
| Veloces | Scraping | ⚠️ Parcial |

### 5.3 Sistema Brain (Cerebro IA)

| Capacidad | Descripción | Estado |
|-----------|-------------|--------|
| Toma de decisiones | Análisis automático de situaciones | ✅ Activo |
| Aprendizaje | Mejora continua con feedback | ✅ Activo |
| Detección de patrones | Identificación de anomalías | ✅ Activo |
| Predicciones | Forecast de problemas | ✅ Activo |
| Automatización | Reglas y acciones automáticas | ✅ Activo |

### 5.4 Chat Unificado IA

| Proveedor | Modelo | Uso |
|-----------|--------|-----|
| Claude | claude-sonnet-4 | Análisis complejo |
| Claude | claude-3-5-haiku | Respuestas rápidas |
| Gemini | gemini-1.5-flash | Visión/imágenes |
| Chatea Pro | Custom | WhatsApp Business |

### 5.5 Sistema de Rescate

| Funcionalidad | Descripción |
|---------------|-------------|
| Cola prioritaria | Guías problemáticas ordenadas |
| Clasificación automática | IA clasifica tipo de problema |
| Acciones sugeridas | Brain sugiere soluciones |
| Seguimiento | Timeline de acciones tomadas |

### 5.6 Carga Masiva

| Formato | Soporte |
|---------|---------|
| Excel (.xlsx) | ✅ Completo |
| CSV | ✅ Completo |
| Google Sheets | ✅ Integrado |
| Copy/Paste | ✅ Activo |

### 5.7 Administración (19 Centros)

| Centro | Funcionalidad |
|--------|---------------|
| AIConfigCenter | Configuración de IAs |
| AnalyticsCenter | Analytics avanzados |
| APICenter | Gestión de APIs |
| CRMCenter | CRM integrado |
| FinanceCenter | Finanzas |
| LearningCenter | Sistema de aprendizaje |
| NotificationsCenter | Notificaciones |
| OrdersCenter | Gestión de órdenes |
| ReportsCenter | Reportes |
| RulesCenter | Reglas de automatización |
| SecurityCenter | Seguridad |
| SupportCenter | Soporte |
| MarketingCenter | Marketing |
| IntegrationsCenter | Integraciones |
| UsersCenter | Gestión de usuarios |
| SettingsCenter | Configuración general |
| AuditCenter | Auditoría |
| BackupCenter | Respaldos |
| PerformanceCenter | Rendimiento |

---

## 6. Componentes React

### Estructura de Componentes (165+)

```
components/
├── Admin/                     # 19 centros de administración
│   ├── AIConfigCenter.tsx
│   ├── AnalyticsCenter.tsx
│   ├── APICenter.tsx
│   ├── CRMCenter.tsx
│   ├── FinanceCenter.tsx
│   ├── LearningCenter.tsx
│   ├── NotificationsCenter.tsx
│   ├── OrdersCenter.tsx
│   ├── ReportsCenter.tsx
│   ├── RulesCenter.tsx
│   ├── SecurityCenter.tsx
│   ├── SupportCenter.tsx
│   ├── MarketingCenter.tsx
│   ├── IntegrationsCenter.tsx
│   ├── UsersCenter.tsx
│   ├── SettingsCenter.tsx
│   ├── AuditCenter.tsx
│   ├── BackupCenter.tsx
│   └── PerformanceCenter.tsx
│
├── Dashboard/
│   ├── QuickDashboard.tsx      # Dashboard ejecutivo
│   ├── KPICards.tsx            # Tarjetas de métricas
│   ├── ChartsPanel.tsx         # Panel de gráficos
│   ├── TrafficLights.tsx       # Semáforo de estados
│   └── AdvancedAnalytics.tsx   # Analytics avanzados
│
├── brain/
│   ├── AIBrainDashboard.tsx    # Dashboard del cerebro
│   ├── BrainJourneyMap.tsx     # Mapa de journey
│   ├── BrainTimeline.tsx       # Timeline de decisiones
│   └── BrainInsights.tsx       # Insights automáticos
│
├── chat/
│   ├── UnifiedChat.tsx         # Chat multi-IA
│   ├── ChateaAIChat.tsx        # Chat Chatea
│   ├── LitperAIChat.tsx        # Chat Litper
│   ├── OperationsChat.tsx      # Chat operaciones
│   └── AdminChat.tsx           # Chat administrador
│
├── CommandCenter/
│   ├── CommandCenter.tsx       # Centro de comando v1
│   └── CommandCenterPro.tsx    # Centro de comando v2
│
├── RescueSystem/
│   ├── RescueQueueUI.tsx       # Cola de rescate
│   ├── RescueCard.tsx          # Tarjeta de guía
│   └── RescueActions.tsx       # Acciones de rescate
│
├── ml/
│   ├── MLDashboard.tsx         # Dashboard ML
│   ├── MLPredictor.tsx         # Predictor
│   └── MLChat.tsx              # Chat ML
│
├── tabs/
│   ├── SeguimientoTab.tsx      # Tab de seguimiento
│   ├── CargaTab.tsx            # Tab de carga
│   ├── ReportesTab.tsx         # Tab de reportes
│   ├── ConfiguracionTab.tsx    # Tab de config
│   └── NovedadesTab.tsx        # Tab de novedades
│
├── auth/
│   ├── LoginPage.tsx           # Página de login
│   ├── RegisterPage.tsx        # Página de registro
│   └── AuthGuard.tsx           # Guard de autenticación
│
├── ui/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   ├── Toast.tsx
│   ├── GlobalToastContainer.tsx
│   ├── SectionErrorBoundary.tsx
│   ├── Tabs.tsx
│   ├── Card.tsx
│   ├── Badge.tsx
│   ├── Spinner.tsx
│   └── [30+ más]
│
└── [otras carpetas]
```

### Componentes Principales

| Componente | Ubicación | Descripción |
|------------|-----------|-------------|
| `App.tsx` | /src | Componente raíz |
| `AdminPanelUltimate.tsx` | /components/Admin | Panel admin principal |
| `QuickDashboard.tsx` | /components/Dashboard | Dashboard ejecutivo |
| `UnifiedChat.tsx` | /components/chat | Chat multi-IA |
| `AIBrainDashboard.tsx` | /components/brain | Cerebro IA |
| `CommandCenterPro.tsx` | /components/CommandCenter | Centro de comando |
| `LoginPage.tsx` | /components/auth | Login con animaciones |
| `GuideTable.tsx` | /components | Tabla de guías |
| `CargaManager.tsx` | /components/carga | Gestor de cargas |

---

## 7. Servicios TypeScript

### Servicios de IA y Brain

| Servicio | Archivo | Funcionalidad |
|----------|---------|---------------|
| Claude Brain | `claudeBrainService.ts` | Integración Claude principal |
| Claude Service | `claudeService.ts` | Claude básico |
| Gemini Service | `geminiService.ts` | Google Gemini |
| AI Config | `aiConfigService.ts` | Configuración de IAs |
| Secure AI | `secureAIService.ts` | Proxy seguro para IA |
| Unified AI | `unifiedAIService.ts` | Unificador de IAs |

### Sistema Brain Completo

```
services/brain/
├── core/
│   ├── CentralBrain.ts       # Orquestador principal
│   ├── EventBus.ts           # Bus de eventos
│   ├── MemoryManager.ts      # Gestión de memoria
│   └── ContextManager.ts     # Contexto de sesiones
│
├── knowledge/
│   ├── KnowledgeHub.ts       # Centro de conocimiento
│   ├── PatternDetector.ts    # Detección de patrones
│   └── LearningEngine.ts     # Motor de aprendizaje
│
├── decisions/
│   ├── DecisionEngine.ts     # Toma de decisiones
│   ├── ActionExecutor.ts     # Ejecución de acciones
│   └── PredictionService.ts  # Predicciones
│
├── journey/
│   ├── JourneyBuilder.ts     # Constructor de viajes
│   ├── EventCollector.ts     # Colector de eventos
│   └── TimelineGenerator.ts  # Generador de timelines
│
├── automation/
│   ├── RulesManager.ts       # Gestión de reglas
│   ├── AlertManager.ts       # Sistema de alertas
│   └── InsightsManager.ts    # Insights automáticos
│
└── unification/
    ├── DataUnifier.ts        # Unificación de datos
    └── ShipmentMatcher.ts    # Matching de envíos
```

### Servicios de Logística

| Servicio | Funcionalidad |
|----------|---------------|
| `logisticsService.ts` | Gestión de envíos |
| `inteligenciaLogisticaService.ts` | Inteligencia logística |
| `demandService.ts` | Predicción de demanda |
| `statusParserService.ts` | Parser de estados |
| `agentCityService.ts` | Agente por ciudad |
| `trackingAgentService.ts` | Agente de tracking |

### Servicios de Datos

| Servicio | Funcionalidad |
|----------|---------------|
| `globalStorageService.ts` | Storage global |
| `googleSheetsService.ts` | Google Sheets |
| `excelConfigService.ts` | Configuración Excel |
| `fileProcessorService.ts` | Procesamiento archivos |
| `dataSourceService.ts` | Fuentes de datos |

### Servicios de Negocio

| Servicio | Funcionalidad |
|----------|---------------|
| `financeService.ts` | Finanzas |
| `marketingService.ts` | Marketing |
| `crmService.ts` | CRM |
| `ordersService.ts` | Órdenes |
| `supportService.ts` | Soporte |

### Servicios de Comunicación

| Servicio | Funcionalidad |
|----------|---------------|
| `notificationsService.ts` | Notificaciones |
| `pushNotificationService.ts` | Push notifications |
| `whatsappIntegrationService.ts` | WhatsApp |
| `chateaService.ts` | Chatea Pro |
| `webhookService.ts` | Webhooks |

---

## 8. Sistema Brain (Cerebro IA)

### Arquitectura del Brain

```
┌─────────────────────────────────────────────────────────────┐
│                    CENTRAL BRAIN                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│   │  KNOWLEDGE  │    │  DECISIONS  │    │ AUTOMATION  │    │
│   │    HUB      │◄──►│   ENGINE    │◄──►│   RULES     │    │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    │
│          │                  │                   │           │
│          ▼                  ▼                   ▼           │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│   │  PATTERN    │    │   ACTION    │    │   ALERT     │    │
│   │  DETECTOR   │    │  EXECUTOR   │    │  MANAGER    │    │
│   └─────────────┘    └─────────────┘    └─────────────┘    │
│                                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                    EVENT BUS                         │   │
│   │  (Comunicación entre módulos vía eventos)           │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                              │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│   │   MEMORY    │    │   CONTEXT   │    │  LEARNING   │    │
│   │  MANAGER    │    │  MANAGER    │    │   ENGINE    │    │
│   └─────────────┘    └─────────────┘    └─────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Capacidades del Brain

| Capacidad | Descripción | Implementación |
|-----------|-------------|----------------|
| **Análisis contextual** | Entiende el contexto de cada situación | ContextManager.ts |
| **Detección de patrones** | Identifica patrones anómalos | PatternDetector.ts |
| **Toma de decisiones** | Decide acciones basado en reglas + IA | DecisionEngine.ts |
| **Aprendizaje continuo** | Mejora con cada interacción | LearningEngine.ts |
| **Predicciones** | Anticipa problemas | PredictionService.ts |
| **Automatización** | Ejecuta acciones automáticas | ActionExecutor.ts |
| **Memoria** | Recuerda decisiones pasadas | MemoryManager.ts |
| **Insights** | Genera insights automáticos | InsightsManager.ts |

### Tipos de Decisiones

```typescript
type DecisionType =
  | 'ESCALATE'        // Escalar a humano
  | 'AUTO_RESOLVE'    // Resolver automáticamente
  | 'NOTIFY'          // Notificar
  | 'WAIT'            // Esperar más información
  | 'CONTACT_CARRIER' // Contactar transportadora
  | 'CONTACT_CLIENT'  // Contactar cliente
  | 'RESCHEDULE'      // Reprogramar
  | 'CANCEL'          // Cancelar
  | 'INVESTIGATE';    // Investigar más
```

---

## 9. Stores de Estado

### Zustand Stores

| Store | Archivo | Propósito |
|-------|---------|-----------|
| Auth | `authStore.ts` | Autenticación y usuario actual |
| Shipments | `shipmentStore.ts` | Estado de envíos y guías |
| UI | `uiStore.ts` | UI, tema, navegación, notificaciones |
| Analytics | `analyticsStore.ts` | Métricas, KPIs, predicciones |
| Dashboard | `dashboardStore.ts` | Estado del dashboard |
| Carga | `cargaStore.ts` | Estado de cargas |
| Layout | `layoutStore.ts` | Layout de la aplicación |
| Marketing | `marketingStore.ts` | Estado de marketing |
| Rutas | `rutasStore.ts` | Rutas de envío |
| ProAssistant | `proAssistantStore.ts` | Asistente Pro |
| Toast | `toastStore.ts` | Notificaciones toast |

### Ejemplo de Store

```typescript
// stores/authStore.ts
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    const result = await authService.login(credentials);
    if (result.success) {
      set({ user: result.user, isAuthenticated: true });
    } else {
      set({ error: result.message });
    }
    set({ isLoading: false });
  },

  logout: () => {
    authService.logout();
    set({ user: null, isAuthenticated: false });
  },

  clearError: () => set({ error: null }),
}));
```

### Hook Combinado

```typescript
// hooks/useAppState.ts
export const useAppState = () => {
  const auth = useAuthStore();
  const shipments = useShipmentStore();
  const ui = useUIStore();
  const analytics = useAnalyticsStore();

  return { auth, shipments, ui, analytics };
};
```

---

## 10. Hooks Personalizados

| Hook | Archivo | Funcionalidad |
|------|---------|---------------|
| `useShipments` | `useShipments.ts` | CRUD de envíos |
| `useDebounce` | `useDebounce.ts` | Debouncing de valores |
| `useToast` | `useToast.ts` | Mostrar notificaciones |
| `useTheme` | `useTheme.ts` | Gestión de tema |
| `useLocalStorage` | `useLocalStorage.ts` | Persistencia local |
| `usePagination` | `usePagination.ts` | Paginación |
| `useDashboardData` | `useDashboardData.ts` | Datos del dashboard |
| `useFilteredShipments` | `useFilteredShipments.ts` | Filtrado de envíos |
| `useAppState` | `useAppState.ts` | Estado global |
| `useBrainChat` | `useBrainChat.ts` | Chat con Brain |
| `useExcelParser` | `useExcelParser.ts` | Parseo de Excel |
| `useInteligenciaLogistica` | `useInteligenciaLogistica.ts` | Inteligencia logística |
| `useCargaBrainIntegration` | `useCargaBrainIntegration.ts` | Integración carga-brain |
| `useCargasTracking` | `useCargasTracking.ts` | Tracking de cargas |

---

## 11. API Backend

### Endpoints Principales

#### Autenticación (`/auth`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/login` | Iniciar sesión |
| POST | `/auth/logout` | Cerrar sesión |
| GET | `/auth/me` | Usuario actual |
| POST | `/auth/verify` | Verificar token |
| GET | `/auth/users` | Listar usuarios (admin) |

#### Tracking (`/tracking`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/tracking/{guia}` | Obtener estado de guía |
| POST | `/tracking/batch` | Tracking múltiple |
| GET | `/tracking/carrier/{carrier}/{guia}` | Tracking por transportadora |
| GET | `/tracking/history/{guia}` | Historial de guía |

#### Brain (`/brain`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/brain/analyze` | Analizar situación |
| POST | `/brain/decide` | Tomar decisión |
| GET | `/brain/insights` | Obtener insights |
| POST | `/brain/learn` | Registrar aprendizaje |
| GET | `/brain/predictions` | Obtener predicciones |

#### Rescue (`/rescue`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/rescue/queue` | Cola de rescate |
| POST | `/rescue/process` | Procesar guía |
| PUT | `/rescue/{id}/status` | Actualizar estado |
| GET | `/rescue/stats` | Estadísticas |

#### Carga (`/carga`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/carga/upload` | Subir archivo |
| GET | `/carga/status/{id}` | Estado de carga |
| GET | `/carga/history` | Historial de cargas |

#### WhatsApp (`/whatsapp`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/whatsapp/send` | Enviar mensaje |
| POST | `/whatsapp/webhook` | Recibir webhook |
| GET | `/whatsapp/templates` | Plantillas |

#### AI Proxy (`/ai`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/ai/claude` | Proxy a Claude |
| POST | `/ai/gemini` | Proxy a Gemini |
| POST | `/ai/chat` | Chat unificado |

#### WebSocket (`/ws`)

| Endpoint | Descripción |
|----------|-------------|
| `/ws/tracking` | Updates de tracking en tiempo real |
| `/ws/brain` | Eventos del brain |
| `/ws/notifications` | Notificaciones push |

---

## 12. Base de Datos

### Esquema PostgreSQL

#### Tabla: `users`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID | ID único |
| email | VARCHAR(255) | Email único |
| password_hash | VARCHAR(255) | Hash de contraseña |
| salt | VARCHAR(255) | Salt para hash |
| nombre | VARCHAR(100) | Nombre |
| rol | ENUM | admin, operador, viewer |
| activo | BOOLEAN | Estado activo |
| created_at | TIMESTAMP | Fecha creación |
| last_login | TIMESTAMP | Último login |

#### Tabla: `shipments`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID | ID único |
| guia | VARCHAR(50) | Número de guía |
| carrier | VARCHAR(50) | Transportadora |
| status | VARCHAR(50) | Estado actual |
| origin_city | VARCHAR(100) | Ciudad origen |
| dest_city | VARCHAR(100) | Ciudad destino |
| client_name | VARCHAR(255) | Nombre cliente |
| client_phone | VARCHAR(20) | Teléfono |
| created_at | TIMESTAMP | Fecha creación |
| updated_at | TIMESTAMP | Última actualización |
| metadata | JSONB | Datos adicionales |

#### Tabla: `tracking_events`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID | ID único |
| shipment_id | UUID | FK a shipments |
| status | VARCHAR(50) | Estado |
| description | TEXT | Descripción |
| location | VARCHAR(255) | Ubicación |
| timestamp | TIMESTAMP | Fecha del evento |
| raw_data | JSONB | Datos crudos |

#### Tabla: `brain_decisions`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID | ID único |
| shipment_id | UUID | FK a shipments |
| decision_type | VARCHAR(50) | Tipo de decisión |
| confidence | FLOAT | Confianza (0-1) |
| reasoning | TEXT | Razonamiento |
| action_taken | TEXT | Acción tomada |
| outcome | VARCHAR(50) | Resultado |
| created_at | TIMESTAMP | Fecha |

#### Tabla: `activity_logs`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID | ID único |
| user_id | UUID | FK a users |
| action | VARCHAR(100) | Acción realizada |
| module | VARCHAR(50) | Módulo |
| details | TEXT | Detalles |
| metadata | JSONB | Metadatos |
| created_at | TIMESTAMP | Fecha |

### Redis Cache

| Key Pattern | TTL | Descripción |
|-------------|-----|-------------|
| `tracking:{guia}` | 5 min | Cache de tracking |
| `user:{id}` | 30 min | Sesión de usuario |
| `brain:insights` | 1 hora | Insights cacheados |
| `analytics:kpis` | 15 min | KPIs del dashboard |
| `queue:rescue` | - | Cola de rescate |

---

## 13. Integraciones Externas

### Proveedores de IA

| Proveedor | API | Modelos | Uso |
|-----------|-----|---------|-----|
| **Anthropic** | REST | claude-sonnet-4, claude-3-5-haiku | Análisis, decisiones, chat |
| **Google** | REST | gemini-1.5-flash, gemini-1.5-pro | Visión, imágenes, chat |
| **OpenAI** | REST | gpt-4o-mini | Chat alternativo |
| **Chatea Pro** | REST | Custom | WhatsApp + IA |

### Transportadoras

| Transportadora | Método | Endpoint | Campos |
|----------------|--------|----------|--------|
| **Coordinadora** | REST | `api.coordinadora.com` | guia, estado, ciudad |
| **Servientrega** | REST | `www.servientrega.com` | guia, tracking |
| **TCC** | REST | `www.tcc.com.co` | guia, estado |
| **Envía** | REST | `www.envia.co` | guia, historial |
| **Inter Rapidísimo** | REST | `interrapidisimo.com` | guia, estado |

### Comunicación

| Servicio | API | Uso |
|----------|-----|-----|
| **Meta WhatsApp** | Cloud API | Mensajes oficiales |
| **Twilio** | REST | WhatsApp alternativo |
| **Eleven Labs** | REST | Síntesis de voz |
| **SendGrid** | REST | Emails (futuro) |

### Datos

| Servicio | API | Uso |
|----------|-----|-----|
| **Google Sheets** | REST | Importación/exportación |
| **Supabase** | REST + Realtime | Storage, auth, DB |

---

## 14. Sistema de Autenticación

### Flujo de Login

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Usuario   │     │   Frontend  │     │   Backend   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │  1. Email/Pass    │                   │
       │──────────────────►│                   │
       │                   │  2. POST /login   │
       │                   │──────────────────►│
       │                   │                   │
       │                   │  3. Verificar     │
       │                   │     PBKDF2 Hash   │
       │                   │                   │
       │                   │  4. JWT Token     │
       │                   │◄──────────────────│
       │  5. Guardar token │                   │
       │◄──────────────────│                   │
       │                   │                   │
       │  6. Dashboard     │                   │
       │◄──────────────────│                   │
```

### Seguridad Implementada

| Medida | Implementación |
|--------|----------------|
| Hash de contraseñas | PBKDF2 con 100,000 iteraciones |
| Tokens | JWT con expiración 24h |
| Protección bruta fuerza | 5 intentos, bloqueo 15 min |
| Sesiones | Redis con TTL |
| CORS | Configurado por dominio |

### Usuarios del Sistema

| Email | Rol | Permisos |
|-------|-----|----------|
| litpercolombia@gmail.com | admin | Todos |
| daniellitper@gmail.com | admin | Todos |
| maletaslitper@gmail.com | admin | Todos |
| karenlitper@gmail.com | operador | Operaciones |
| litperdayana@gmail.com | operador | Operaciones |
| litperdavid@gmail.com | operador | Operaciones |
| felipelitper@gmail.com | operador | Operaciones |
| jimmylitper@gmail.com | operador | Operaciones |
| jhonnatanlitper@gmail.com | operador | Operaciones |

---

## 15. Roles y Permisos

### Matriz de Permisos

| Funcionalidad | Admin | Operador | Viewer |
|---------------|:-----:|:--------:|:------:|
| Ver Dashboard | ✅ | ✅ | ✅ |
| Tracking | ✅ | ✅ | ✅ |
| Cargar guías | ✅ | ✅ | ❌ |
| Chat IA | ✅ | ✅ | ❌ |
| Sistema Rescate | ✅ | ✅ | ❌ |
| Exportar reportes | ✅ | ✅ | ❌ |
| Panel Admin | ✅ | ❌ | ❌ |
| Gestión usuarios | ✅ | ❌ | ❌ |
| Configuración IA | ✅ | ❌ | ❌ |
| Ver logs | ✅ | ❌ | ❌ |
| Configurar reglas | ✅ | ❌ | ❌ |

### Implementación en Código

```typescript
// Verificación de rol en componentes
const { user } = useAuthStore();

if (user?.rol !== 'admin') {
  return <AccessDenied />;
}

// Verificación en API
@router.get("/admin/users")
async def list_users(user: dict = Depends(get_current_user_dep)):
    if user["rol"] != "admin":
        raise HTTPException(403, "No autorizado")
    return await get_all_users()
```

---

## 16. Infraestructura

### Docker Compose Stack

```yaml
services:
  postgres:
    image: postgres:15
    ports: 5432:5432
    volumes: postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports: 6379:6379

  backend:
    build: ./backend
    ports: 8000:8000
    depends_on: [postgres, redis]

  frontend:
    build: .
    ports: 3000:3000

  nginx:
    image: nginx:alpine
    ports: [80:80, 443:443]
    depends_on: [backend, frontend]
```

### Kubernetes (Producción)

```
infrastructure/kubernetes/
├── deployments/
│   ├── backend.yaml
│   ├── frontend.yaml
│   └── redis.yaml
├── services/
│   ├── backend-svc.yaml
│   └── frontend-svc.yaml
├── configmaps/
│   └── app-config.yaml
├── secrets/
│   └── app-secrets.yaml
└── ingress/
    └── main-ingress.yaml
```

### Monitoreo

| Herramienta | Puerto | Propósito |
|-------------|--------|-----------|
| Prometheus | 9090 | Métricas |
| AlertManager | 9093 | Alertas |
| Grafana | 3001 | Dashboards |

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm test

  build:
    needs: test
    steps:
      - run: npm run build
      - run: docker build -t litper-pro .

  deploy:
    needs: build
    steps:
      - run: vercel deploy --prod
```

---

## 17. Apps Desktop

### Litper Pedidos App (Electron)

```
litper-pedidos-app/
├── src/
│   ├── main/           # Proceso principal Electron
│   └── renderer/       # UI React
├── electron/
│   └── main.ts
├── package.json
└── electron-builder.json
```

**Características:**
- Ventana flotante siempre visible
- Notificaciones de escritorio
- Acceso rápido a pedidos
- Sincronización con sistema principal

### Litper Tracker (Electron + Vite)

```
litper-tracker/
├── src/
│   ├── main/
│   └── renderer/
├── electron/
└── vite.config.ts
```

**Características:**
- Tracking en tiempo real
- Alertas de problemas
- Vista compacta para monitoreo

---

## 18. Estado de Funcionalidades

### Leyenda

- ✅ Completado y funcionando
- ⚠️ En desarrollo / Parcial
- ❌ Pendiente
- 🔄 En mantenimiento

### Estado Actual

| Módulo | Funcionalidad | Estado | Notas |
|--------|---------------|--------|-------|
| **Auth** | Login/Logout | ✅ | Con animaciones premium |
| **Auth** | Registro | ✅ | |
| **Auth** | Recuperar contraseña | ⚠️ | UI lista, falta backend |
| **Dashboard** | KPIs | ✅ | |
| **Dashboard** | Gráficos | ✅ | Recharts |
| **Dashboard** | Predicciones | ✅ | ML integrado |
| **Tracking** | Coordinadora | ✅ | |
| **Tracking** | Servientrega | ✅ | |
| **Tracking** | TCC | ✅ | |
| **Tracking** | Envía | ✅ | |
| **Tracking** | Inter | ✅ | |
| **Tracking** | Veloces | ⚠️ | Scraping inestable |
| **Brain** | Análisis | ✅ | Claude + reglas |
| **Brain** | Decisiones | ✅ | |
| **Brain** | Aprendizaje | ✅ | |
| **Brain** | Predicciones | ✅ | |
| **Chat** | Claude | ✅ | |
| **Chat** | Gemini | ✅ | |
| **Chat** | Chatea Pro | ✅ | |
| **Carga** | Excel | ✅ | xlsx |
| **Carga** | Google Sheets | ✅ | |
| **Carga** | Copy/Paste | ✅ | |
| **Rescate** | Cola | ✅ | |
| **Rescate** | Acciones | ✅ | |
| **WhatsApp** | Envío mensajes | ✅ | Chatea Pro |
| **WhatsApp** | Plantillas | ⚠️ | |
| **WhatsApp** | Webhook | ✅ | |
| **Admin** | Usuarios | ✅ | |
| **Admin** | Configuración | ✅ | |
| **Admin** | Reportes | ✅ | |
| **Admin** | Logs | ✅ | |
| **Desktop** | Pedidos App | ⚠️ | Beta |
| **Desktop** | Tracker App | ⚠️ | Beta |
| **PWA** | Instalable | ✅ | |
| **PWA** | Offline | ⚠️ | Parcial |

---

## Apéndices

### A. Variables de Entorno

```env
# Frontend (.env)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_API_URL=http://localhost:8000
VITE_BACKEND_URL=http://localhost:8000

# Backend (.env)
DATABASE_URL=postgresql://user:pass@localhost:5432/litper
REDIS_URL=redis://localhost:6379
JWT_SECRET=super-secret-key
ANTHROPIC_API_KEY=sk-ant-xxx
GEMINI_API_KEY=xxx
CHATEA_API_KEY=xxx
```

### B. Comandos Útiles

```bash
# Desarrollo
npm run dev              # Frontend dev server
cd backend && uvicorn main:app --reload  # Backend

# Build
npm run build           # Build frontend
docker-compose up -d    # Levantar stack

# Testing
npm test                # Tests frontend
pytest                  # Tests backend

# Linting
npm run lint            # ESLint
ruff check .            # Python linting
```

### C. Contactos del Equipo

- **Admin Principal:** litpercolombia@gmail.com
- **Desarrollo:** daniellitper@gmail.com
- **Operaciones:** karenlitper@gmail.com

---

> **Documento generado automáticamente**
> Última actualización: Enero 2026
> Versión: 2.0
