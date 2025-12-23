# LITPER COMMAND CENTER - Plan Maestro
## Sistema de Control Total tipo ChatGPT para Logística

---

## 1. VISIÓN GENERAL

### Concepto
Transformar el Admin Panel en un **Centro de Comando Conversacional** donde un asistente IA (Claude) tiene acceso completo a:
- Todos los datos del negocio
- Internet para búsquedas en tiempo real
- Skills especializados (finanzas, logística, análisis)
- Control total de operaciones
- Generación de reportes y gráficos

### Inspiración
- **ChatGPT**: Interfaz conversacional + plugins
- **Claude**: Análisis profundo + artifacts
- **Notion AI**: Integración con datos existentes
- **Copilot**: Acciones rápidas contextuales

---

## 2. ARQUITECTURA DEL SISTEMA

```
┌─────────────────────────────────────────────────────────────────┐
│                    LITPER COMMAND CENTER                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────────────────────────────────┐  │
│  │   SIDEBAR   │  │              MAIN AREA                   │  │
│  │             │  │  ┌─────────────────────────────────────┐ │  │
│  │ • Dashboard │  │  │         CHAT INTERFACE              │ │  │
│  │ • Guías     │  │  │  ┌─────────────────────────────┐   │ │  │
│  │ • Cargas    │  │  │  │    Mensajes + Artifacts     │   │ │  │
│  │ • Finanzas  │  │  │  │    (gráficos, tablas,       │   │ │  │
│  │ • Semáforo  │  │  │  │     reportes inline)        │   │ │  │
│  │ • Reportes  │  │  │  └─────────────────────────────┘   │ │  │
│  │ • Config    │  │  │  ┌─────────────────────────────┐   │ │  │
│  │             │  │  │  │    INPUT + QUICK ACTIONS    │   │ │  │
│  │  ─────────  │  │  │  │  [📊] [📁] [🔍] [📤] [⚙️]  │   │ │  │
│  │  TABS:      │  │  │  └─────────────────────────────┘   │ │  │
│  │ • Stats     │  │  └─────────────────────────────────────┘ │  │
│  │ • Historial │  │                                           │  │
│  │ • Guardados │  │  ┌─────────────────────────────────────┐ │  │
│  │             │  │  │         PANEL CONTEXTUAL            │ │  │
│  └─────────────┘  │  │   (Skills activos, archivos,        │ │  │
│                   │  │    datos en tiempo real)             │ │  │
│                   │  └─────────────────────────────────────┘ │  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. COMPONENTES PRINCIPALES

### 3.1 Chat Interface (Core)

```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;

  // Artifacts (contenido expandible)
  artifacts?: {
    type: 'chart' | 'table' | 'report' | 'map' | 'form' | 'code';
    title: string;
    data: any;
    actions?: ActionButton[];
  }[];

  // Archivos adjuntos
  attachments?: {
    name: string;
    type: string;
    url: string;
    preview?: string;
  }[];

  // Acciones sugeridas
  suggestions?: string[];

  // Metadata
  skillUsed?: string;
  tokensUsed?: number;
  processingTime?: number;
}
```

### 3.2 Skills System (Capacidades IA)

```typescript
interface Skill {
  id: string;
  name: string;
  icon: string;
  description: string;
  triggers: string[];  // Palabras clave que activan el skill

  // Función que ejecuta el skill
  execute: (context: SkillContext) => Promise<SkillResult>;

  // Permisos requeridos
  permissions: ('read' | 'write' | 'delete' | 'admin')[];
}

// Skills disponibles:
const SKILLS = [
  {
    id: 'guias-manager',
    name: 'Gestión de Guías',
    triggers: ['guía', 'envío', 'tracking', 'estado'],
    capabilities: [
      'Buscar guías por número, cliente, ciudad',
      'Actualizar estados masivamente',
      'Generar reportes de guías',
      'Detectar guías problemáticas'
    ]
  },
  {
    id: 'finance-analyst',
    name: 'Analista Financiero',
    triggers: ['finanzas', 'dinero', 'gastos', 'ingresos', 'margen'],
    capabilities: [
      'Procesar archivos Excel de finanzas',
      'Calcular márgenes y rentabilidad',
      'Proyectar flujo de caja',
      'Detectar anomalías en gastos'
    ]
  },
  {
    id: 'city-monitor',
    name: 'Monitor de Ciudades',
    triggers: ['ciudad', 'semáforo', 'tasa', 'pausar'],
    capabilities: [
      'Analizar rendimiento por ciudad',
      'Recomendar pausar/reanudar ciudades',
      'Predecir problemas futuros',
      'Comparar transportadoras por zona'
    ]
  },
  {
    id: 'report-generator',
    name: 'Generador de Reportes',
    triggers: ['reporte', 'informe', 'exportar', 'PDF'],
    capabilities: [
      'Generar reportes personalizados',
      'Exportar a PDF, Excel, CSV',
      'Programar reportes automáticos',
      'Crear dashboards guardables'
    ]
  },
  {
    id: 'web-researcher',
    name: 'Investigador Web',
    triggers: ['buscar', 'internet', 'precio', 'competencia'],
    capabilities: [
      'Buscar información en internet',
      'Comparar precios de transportadoras',
      'Investigar nuevas rutas',
      'Monitorear noticias del sector'
    ]
  },
  {
    id: 'automation-engine',
    name: 'Motor de Automatización',
    triggers: ['automatizar', 'regla', 'cuando', 'si entonces'],
    capabilities: [
      'Crear reglas de automatización',
      'Configurar alertas condicionales',
      'Programar tareas recurrentes',
      'Integrar con WhatsApp/Email'
    ]
  }
];
```

### 3.3 Quick Actions Bar

```typescript
const QUICK_ACTIONS = [
  {
    id: 'upload-file',
    icon: '📁',
    label: 'Subir archivo',
    accepts: ['.xlsx', '.csv', '.pdf', '.png', '.jpg'],
    action: 'upload'
  },
  {
    id: 'new-report',
    icon: '📊',
    label: 'Nuevo reporte',
    submenu: ['Diario', 'Semanal', 'Mensual', 'Personalizado']
  },
  {
    id: 'search-web',
    icon: '🔍',
    label: 'Buscar en internet',
    action: 'web-search'
  },
  {
    id: 'export',
    icon: '📤',
    label: 'Exportar',
    submenu: ['PDF', 'Excel', 'CSV', 'Imagen']
  },
  {
    id: 'voice-input',
    icon: '🎤',
    label: 'Entrada de voz',
    action: 'voice'
  },
  {
    id: 'templates',
    icon: '📋',
    label: 'Plantillas',
    submenu: ['Conciliación', 'Cierre mes', 'Análisis ciudad']
  }
];
```

### 3.4 Tabs System (Pestañas Guardables)

```typescript
interface SavedTab {
  id: string;
  name: string;
  type: 'dashboard' | 'report' | 'analysis' | 'custom';
  icon: string;

  // Configuración del contenido
  config: {
    widgets: Widget[];
    filters: Filter[];
    dateRange: DateRange;
    refreshInterval?: number;
  };

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isShared: boolean;
  isPinned: boolean;
}

// Widgets disponibles para tabs
const WIDGET_TYPES = [
  'kpi-card',           // Tarjeta con métrica
  'line-chart',         // Gráfico de líneas
  'bar-chart',          // Gráfico de barras
  'pie-chart',          // Gráfico circular
  'table',              // Tabla de datos
  'map',                // Mapa de Colombia
  'semaforo',           // Semáforo de ciudades
  'activity-feed',      // Feed de actividad
  'alerts-panel',       // Panel de alertas
  'quick-stats',        // Estadísticas rápidas
];
```

---

## 4. FUNCIONALIDADES DETALLADAS

### 4.1 Procesamiento de Archivos

| Tipo de Archivo | Procesamiento | Acciones |
|-----------------|---------------|----------|
| **Excel (.xlsx)** | Detectar columnas, validar datos | Importar guías, cargar finanzas, actualizar precios |
| **CSV** | Parsear automáticamente | Importación masiva, exportación |
| **PDF** | OCR + extracción de datos | Leer facturas, extraer tracking |
| **Imágenes** | OCR para guías físicas | Leer números de guía de fotos |
| **ZIP** | Descomprimir y procesar | Cargas masivas |

### 4.2 Integraciones

```yaml
Transportadoras:
  - Coordinadora: API tracking, webhooks
  - Servientrega: API estados, cotizador
  - Interrapidísimo: Scraping estados
  - TCC: API completa
  - Envía: Webhooks

Plataformas:
  - Dropi: Sync automático de órdenes
  - Shopify: Importar pedidos
  - WooCommerce: Webhook de ventas

Comunicación:
  - WhatsApp (Chatea): Alertas, resúmenes
  - Email (SendGrid): Reportes programados
  - Telegram: Bot de consultas

Pagos:
  - Wompi: Conciliación automática
  - Bancolombia: Extractos
```

### 4.3 Comandos de Chat (Ejemplos)

```markdown
# Consultas básicas
"¿Cuántas guías llevo hoy?"
"Dame el resumen de la semana"
"¿Cómo va Bogotá?"

# Análisis
"Analiza las devoluciones del mes"
"¿Cuál transportadora es mejor para Antioquia?"
"Compara mi rendimiento con el mes pasado"

# Acciones
"Pausa envíos a Quibdó"
"Genera un reporte PDF del mes"
"Envía el resumen por WhatsApp"

# Con archivos
[Subir Excel] "Importa estas guías"
[Subir PDF] "Extrae los datos de esta factura"
[Subir imagen] "¿Cuál es el número de guía?"

# Automatizaciones
"Avísame cuando Cali baje del 70%"
"Envía resumen diario a las 6pm"
"Si una guía tiene más de 5 días, márcala como crítica"

# Búsqueda web
"Busca el precio de envío a Leticia con Servientrega"
"¿Qué transportadoras llegan a Mitú?"
```

---

## 5. DISEÑO DE INTERFAZ

### 5.1 Layout Principal

```
┌──────────────────────────────────────────────────────────────────────┐
│ LITPER COMMAND CENTER                    [🔔 3] [👤 Admin] [⚙️]    │
├────────────┬─────────────────────────────────────────────────────────┤
│            │  ┌─────────────────────────────────────────────────┐   │
│  SIDEBAR   │  │ [Dashboard] [Stats] [Guardado 1] [+]            │   │
│            │  ├─────────────────────────────────────────────────┤   │
│ ┌────────┐ │  │                                                 │   │
│ │ 💬     │ │  │  🤖 ¡Hola! Soy tu asistente de logística.      │   │
│ │ Chat   │ │  │     ¿En qué puedo ayudarte hoy?                │   │
│ └────────┘ │  │                                                 │   │
│ ┌────────┐ │  │  ┌─────────────────────────────────────────┐   │   │
│ │ 📊     │ │  │  │ 📊 RESUMEN RÁPIDO                       │   │   │
│ │ Stats  │ │  │  │ • 187 guías hoy (+12%)                  │   │   │
│ └────────┘ │  │  │ • 76% tasa de entrega                   │   │   │
│ ┌────────┐ │  │  │ • $4.2M en ventas                       │   │   │
│ │ 📁     │ │  │  │ [Ver más] [Exportar]                    │   │   │
│ │ Files  │ │  │  └─────────────────────────────────────────┘   │   │
│ └────────┘ │  │                                                 │   │
│ ┌────────┐ │  │  👤 ¿Cómo van las ciudades con problemas?      │   │
│ │ 🚦     │ │  │                                                 │   │
│ │Semáforo│ │  │  🤖 Analizando ciudades...                     │   │
│ └────────┘ │  │                                                 │   │
│ ┌────────┐ │  │  ┌─────────────────────────────────────────┐   │   │
│ │ ⚙️     │ │  │  │ 🚨 CIUDADES CRÍTICAS                    │   │   │
│ │ Config │ │  │  │ ┌─────┬────────┬───────┬────────────┐  │   │   │
│ └────────┘ │  │  │ │Ciudad│ Tasa   │ Guías │ Acción     │  │   │   │
│            │  │  │ ├─────┼────────┼───────┼────────────┤  │   │   │
│ ──────────│  │  │ │Quibdó│ 45%    │ 11    │ [Pausar]   │  │   │   │
│            │  │  │ │Btura │ 52%    │ 8     │ [Pausar]   │  │   │   │
│ SKILLS:    │  │  │ └─────┴────────┴───────┴────────────┘  │   │   │
│ [📦] [💰]  │  │  │ [Pausar todas] [Ver detalles]          │   │   │
│ [🗺️] [📈]  │  │  └─────────────────────────────────────────┘   │   │
│            │  │                                                 │   │
├────────────┼──┴─────────────────────────────────────────────────┤   │
│            │  ┌─────────────────────────────────────────────────┐   │
│            │  │ [📁] [📊] [🔍] [📤] [🎤]  │ Escribe algo...    │   │
│            │  │                           │              [➤]    │   │
│            │  └─────────────────────────────────────────────────┘   │
└────────────┴─────────────────────────────────────────────────────────┘
```

### 5.2 Tema Visual

```css
/* Paleta de colores */
:root {
  /* Fondo principal */
  --bg-primary: #0f172a;      /* Navy muy oscuro */
  --bg-secondary: #1e293b;    /* Navy oscuro */
  --bg-tertiary: #334155;     /* Navy medio */

  /* Acentos */
  --accent-primary: #8b5cf6;  /* Violeta */
  --accent-secondary: #06b6d4; /* Cyan */
  --accent-success: #10b981;  /* Verde */
  --accent-warning: #f59e0b;  /* Naranja */
  --accent-danger: #ef4444;   /* Rojo */

  /* Texto */
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;

  /* Gradientes */
  --gradient-primary: linear-gradient(135deg, #8b5cf6, #06b6d4);
  --gradient-success: linear-gradient(135deg, #10b981, #06b6d4);
}
```

---

## 6. STACK TECNOLÓGICO

### Frontend
```json
{
  "framework": "React 18 + TypeScript",
  "styling": "Tailwind CSS + Framer Motion",
  "state": "Zustand (global) + React Query (server)",
  "charts": "Recharts + D3.js",
  "tables": "TanStack Table",
  "forms": "React Hook Form + Zod",
  "icons": "Lucide React",
  "dates": "date-fns",
  "pdf": "react-pdf + jsPDF",
  "excel": "SheetJS (xlsx)"
}
```

### Backend / Servicios
```json
{
  "database": "Supabase (PostgreSQL)",
  "auth": "Supabase Auth",
  "storage": "Supabase Storage",
  "realtime": "Supabase Realtime",
  "ai": "Claude API (Anthropic)",
  "search": "Brave Search API / Tavily",
  "whatsapp": "Chatea API",
  "email": "Resend / SendGrid"
}
```

---

## 7. REQUISITOS PARA IMPLEMENTAR

### 7.1 APIs Necesarias

| API | Propósito | Costo Estimado |
|-----|-----------|----------------|
| **Claude API** | IA conversacional | ~$20-50/mes |
| **Brave Search** | Búsquedas web | ~$5/mes (5000 queries) |
| **Supabase** | DB + Auth + Storage | Free tier / $25/mes |
| **Chatea** | WhatsApp | Ya tienes |
| **Resend** | Emails | Free tier (100/día) |

### 7.2 Configuración Supabase Adicional

```sql
-- Tablas adicionales necesarias

-- Conversaciones del chat
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL,
  title VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Mensajes
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  artifacts JSONB DEFAULT '[]',
  attachments JSONB DEFAULT '[]',
  skill_used VARCHAR(100),
  tokens_used INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabs/Dashboards guardados
CREATE TABLE saved_tabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  config JSONB NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_shared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Archivos subidos
CREATE TABLE uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  size INTEGER NOT NULL,
  url TEXT NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Automatizaciones/Reglas
CREATE TABLE automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  trigger_type VARCHAR(50) NOT NULL,
  trigger_config JSONB NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  action_config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_run TIMESTAMP,
  run_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 8. FASES DE IMPLEMENTACIÓN

### FASE 1: Core Chat (1-2 semanas)
- [ ] Estructura base del Command Center
- [ ] Chat interface con mensajes
- [ ] Conexión básica con Claude API
- [ ] Sistema de artifacts simple
- [ ] Quick actions básicas

### FASE 2: Skills & Data (2-3 semanas)
- [ ] Sistema de skills modular
- [ ] Skill: Gestión de Guías
- [ ] Skill: Analista Financiero
- [ ] Skill: Monitor de Ciudades
- [ ] Conexión completa con Supabase

### FASE 3: Archivos & Exportación (1-2 semanas)
- [ ] Upload de archivos
- [ ] Procesamiento de Excel/CSV
- [ ] OCR para imágenes
- [ ] Generación de PDFs
- [ ] Exportación de datos

### FASE 4: Tabs & Dashboards (1-2 semanas)
- [ ] Sistema de tabs guardables
- [ ] Widgets arrastrables
- [ ] Dashboards personalizados
- [ ] Compartir tabs entre usuarios

### FASE 5: Web & Automatización (2 semanas)
- [ ] Integración búsqueda web
- [ ] Motor de automatizaciones
- [ ] Alertas condicionales
- [ ] Reportes programados

### FASE 6: Polish & Scale (1 semana)
- [ ] Optimización de rendimiento
- [ ] Manejo de errores robusto
- [ ] Onboarding para nuevos usuarios
- [ ] Documentación

---

## 9. EJEMPLO DE INTERACCIÓN

```
👤 Usuario: Sube archivo "ventas_diciembre.xlsx"

🤖 Asistente: He recibido el archivo "ventas_diciembre.xlsx".

📊 ANÁLISIS DEL ARCHIVO
┌────────────────────────────────┐
│ Filas: 1,247                   │
│ Columnas detectadas:           │
│ • Fecha                        │
│ • Cliente                      │
│ • Producto                     │
│ • Valor                        │
│ • Ciudad                       │
│ • Estado                       │
└────────────────────────────────┘

¿Qué deseas hacer con estos datos?
[Importar como guías] [Analizar ventas] [Ver preview]

👤 Usuario: Analiza las ventas por ciudad

🤖 Asistente: Analizando ventas por ciudad...

📊 VENTAS POR CIUDAD - DICIEMBRE 2024
┌─────────────┬──────────┬────────┬─────────┐
│ Ciudad      │ Ventas   │ Guías  │ Ticket  │
├─────────────┼──────────┼────────┼─────────┤
│ Bogotá      │ $45.2M   │ 423    │ $106K   │
│ Medellín    │ $32.1M   │ 298    │ $108K   │
│ Cali        │ $21.8M   │ 187    │ $117K   │
│ Barranquilla│ $15.4M   │ 142    │ $108K   │
│ Otras       │ $28.9M   │ 197    │ $147K   │
└─────────────┴──────────┴────────┴─────────┘

📈 [Ver gráfico] [Exportar] [Guardar análisis]

💡 Insight: Bogotá representa el 31% de las ventas
   pero Cali tiene el ticket promedio más alto.

👤 Usuario: Guarda este análisis en una pestaña

🤖 Asistente: ✅ Análisis guardado como pestaña "Ventas Dic 2024"

Puedes acceder desde la barra de pestañas o
preguntarme "abre ventas diciembre" cuando quieras.
```

---

## 10. MÉTRICAS DE ÉXITO

| Métrica | Objetivo | Cómo medir |
|---------|----------|------------|
| Tiempo de respuesta | < 3 segundos | Logging |
| Precisión de datos | > 99% | Validación cruzada |
| Satisfacción usuario | > 4.5/5 | Feedback en chat |
| Adopción de skills | > 80% usuarios | Analytics |
| Reportes generados | +50% vs actual | Contador |
| Automatizaciones activas | > 5 por usuario | DB query |

---

## 11. PRESUPUESTO ESTIMADO

| Concepto | Mensual | Anual |
|----------|---------|-------|
| Claude API | $50 | $600 |
| Supabase Pro | $25 | $300 |
| Brave Search | $5 | $60 |
| Dominio + SSL | $2 | $24 |
| **TOTAL** | **$82** | **$984** |

---

## 12. PRÓXIMOS PASOS

1. **Aprobar este plan** - Revisar y ajustar según necesidades
2. **Obtener API Key de Claude** - Crear cuenta en console.anthropic.com
3. **Configurar búsqueda web** - Brave Search o Tavily
4. **Comenzar Fase 1** - Core Chat Interface

---

¿Aprobamos este plan y comenzamos la implementación?
