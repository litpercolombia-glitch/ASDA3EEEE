# PLAN DE MEJORA: ADMIN CON CHAT + SKILLS
## Como Claude Code pero para tu E-commerce

**Fecha:** 2026-01-21
**Objetivo:** Transformar el panel admin fragmentado en un sistema unificado con chat inteligente y skills

---

## 1. DIAGNÓSTICO ACTUAL

### Problemas Identificados

| Problema | Impacto | Severidad |
|----------|---------|-----------|
| **19 centros fragmentados** | UI confusa, difícil navegar | 🔴 Alto |
| **3 versiones de AdminPanel** | Código duplicado, inconsistente | 🔴 Alto |
| **Sin chat unificado** | No hay forma natural de interactuar | 🔴 Alto |
| **Contraseña hardcodeada** | Riesgo de seguridad | 🔴 Crítico |
| **Diseño inconsistente** | UX pobre, curva de aprendizaje alta | 🟡 Medio |
| **Sin persistencia** | Datos se pierden al reiniciar | 🟡 Medio |

### Lo que Tienes (Funcional)

```
✅ 19 centros especializados (código existe)
✅ Análisis financiero con IA
✅ Sistema de alertas
✅ Conexiones MCP
✅ Motor de reglas
✅ API REST completa
✅ Multi-proveedor IA (Claude, GPT, Gemini)
```

### Lo que Falta

```
❌ Interfaz unificada tipo chat
❌ Sistema de skills/comandos
❌ Navegación intuitiva
❌ Diseño moderno consistente
❌ Acciones ejecutables desde chat
```

---

## 2. VISIÓN: ADMIN COMO CLAUDE CODE

### Concepto

```
┌─────────────────────────────────────────────────────────────┐
│  LITPER ADMIN PRO - Chat + Skills                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🤖 Asistente: ¿En qué puedo ayudarte hoy?           │   │
│  │                                                      │   │
│  │ 👤 Tú: /reporte financiero de esta semana           │   │
│  │                                                      │   │
│  │ 🤖 Generando reporte financiero...                   │   │
│  │    ┌──────────────────────────────────────┐         │   │
│  │    │ 📊 REPORTE FINANCIERO               │         │   │
│  │    │ Período: 15-21 Enero 2026           │         │   │
│  │    │ ─────────────────────────           │         │   │
│  │    │ Facturado: $45,230,000              │         │   │
│  │    │ Ganancia:  $12,450,000 (27.5%)      │         │   │
│  │    │ Entregas:  847/920 (92.1%)          │         │   │
│  │    │                                      │         │   │
│  │    │ ⚠️ Alerta: TCC bajo 85% entregas    │         │   │
│  │    │ 💡 Acción: [Cambiar transportadora] │         │   │
│  │    └──────────────────────────────────────┘         │   │
│  │                                                      │   │
│  │ 👤 Tú: muéstrame las guías con problemas            │   │
│  │                                                      │   │
│  │ 🤖 Encontré 73 guías con novedades:                 │   │
│  │    [Ver lista] [Exportar Excel] [Enviar alertas]    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 💬 Escribe un mensaje o usa /comando...              │   │
│  │ [📎] [🎤] [Enviar]                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Skills: /reporte /guias /finanzas /alertas /config más... │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. ARQUITECTURA PROPUESTA

### 3.1 Estructura de Componentes

```
components/
└── AdminChat/
    ├── AdminChat.tsx              # Componente principal
    ├── ChatWindow.tsx             # Ventana de chat
    ├── MessageBubble.tsx          # Mensajes individuales
    ├── SkillsBar.tsx              # Barra de skills rápidos
    ├── ActionCard.tsx             # Tarjetas de acción interactivas
    ├── ResultsPanel.tsx           # Panel de resultados expandibles
    │
    ├── skills/                    # Skills disponibles
    │   ├── index.ts               # Registro de skills
    │   ├── ReporteSkill.ts        # /reporte
    │   ├── GuiasSkill.ts          # /guias
    │   ├── FinanzasSkill.ts       # /finanzas
    │   ├── AlertasSkill.ts        # /alertas
    │   ├── PedidosSkill.ts        # /pedidos
    │   ├── ClientesSkill.ts       # /clientes
    │   ├── ConfigSkill.ts         # /config
    │   ├── ExportarSkill.ts       # /exportar
    │   ├── EnviarSkill.ts         # /enviar
    │   └── AyudaSkill.ts          # /ayuda
    │
    ├── renderers/                 # Renderizadores de resultados
    │   ├── TableRenderer.tsx      # Tablas de datos
    │   ├── ChartRenderer.tsx      # Gráficos
    │   ├── CardRenderer.tsx       # Tarjetas de resumen
    │   ├── AlertRenderer.tsx      # Alertas y advertencias
    │   └── ActionRenderer.tsx     # Botones de acción
    │
    └── hooks/
        ├── useChat.ts             # Lógica del chat
        ├── useSkills.ts           # Ejecución de skills
        └── useVoice.ts            # Entrada por voz
```

### 3.2 Flujo de Datos

```
Usuario Input
     │
     ▼
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│ Chat Input  │───▶│ Skill Parser │───▶│ Skill       │
└─────────────┘    └──────────────┘    │ Executor    │
                          │            └─────────────┘
                          │                   │
                   Si no es skill             │
                          │                   │
                          ▼                   ▼
                   ┌──────────────┐    ┌─────────────┐
                   │ Claude AI    │    │ Backend API │
                   │ (NLP libre)  │    │ (Datos)     │
                   └──────────────┘    └─────────────┘
                          │                   │
                          └─────────┬─────────┘
                                    │
                                    ▼
                          ┌─────────────────┐
                          │ Response        │
                          │ Renderer        │
                          └─────────────────┘
                                    │
                                    ▼
                          ┌─────────────────┐
                          │ Chat Window     │
                          │ (UI)            │
                          └─────────────────┘
```

---

## 4. SKILLS DISPONIBLES

### 4.1 Catálogo de Skills

| Skill | Comando | Descripción | Ejemplo |
|-------|---------|-------------|---------|
| **Reportes** | `/reporte` | Genera reportes financieros | `/reporte semanal` |
| **Guías** | `/guias` | Busca y gestiona guías | `/guias con novedad` |
| **Finanzas** | `/finanzas` | Análisis financiero | `/finanzas mes actual` |
| **Alertas** | `/alertas` | Ver/crear alertas | `/alertas críticas` |
| **Pedidos** | `/pedidos` | Gestión de pedidos | `/pedidos pendientes` |
| **Clientes** | `/clientes` | CRM y clientes | `/clientes top 10` |
| **Transportadoras** | `/transportadora` | Info de carriers | `/transportadora TCC` |
| **Exportar** | `/exportar` | Exportar datos | `/exportar excel` |
| **Enviar** | `/enviar` | Enviar mensajes | `/enviar whatsapp` |
| **Config** | `/config` | Configuración | `/config api keys` |
| **Dashboard** | `/dashboard` | Ver métricas | `/dashboard` |
| **Ayuda** | `/ayuda` | Lista de comandos | `/ayuda` |

### 4.2 Definición de un Skill

```typescript
// skills/ReporteSkill.ts

import { Skill, SkillContext, SkillResult } from '../types';

export const ReporteSkill: Skill = {
  name: 'reporte',
  aliases: ['report', 'informe'],
  description: 'Genera reportes financieros y operativos',

  // Parámetros que acepta
  parameters: [
    {
      name: 'periodo',
      type: 'string',
      options: ['hoy', 'ayer', 'semana', 'mes', 'custom'],
      default: 'semana'
    },
    {
      name: 'tipo',
      type: 'string',
      options: ['financiero', 'operativo', 'completo'],
      default: 'completo'
    }
  ],

  // Ejemplos de uso
  examples: [
    '/reporte',
    '/reporte semanal',
    '/reporte financiero mes',
    '/reporte del 1 al 15 de enero'
  ],

  // Ejecutor
  async execute(ctx: SkillContext): Promise<SkillResult> {
    const { params, api, user } = ctx;

    // 1. Obtener datos
    const datos = await api.get('/dashboard/resumen', {
      periodo: params.periodo
    });

    // 2. Generar análisis con IA si es necesario
    let analisisIA = null;
    if (params.tipo === 'completo') {
      analisisIA = await api.post('/api/brain/think', {
        pregunta: `Analiza estos datos financieros y dame insights: ${JSON.stringify(datos)}`
      });
    }

    // 3. Retornar resultado estructurado
    return {
      type: 'report',
      title: `Reporte ${params.tipo} - ${params.periodo}`,
      data: datos,
      analysis: analisisIA,
      actions: [
        { label: 'Exportar PDF', action: 'export_pdf' },
        { label: 'Exportar Excel', action: 'export_excel' },
        { label: 'Enviar por email', action: 'send_email' }
      ]
    };
  }
};
```

### 4.3 Todos los Skills Detallados

```typescript
// skills/index.ts - Registro completo de skills

export const SKILLS = {

  // ═══════════════════════════════════════════
  // 📊 REPORTES Y ANÁLISIS
  // ═══════════════════════════════════════════

  reporte: {
    name: 'reporte',
    icon: '📊',
    description: 'Genera reportes financieros y operativos',
    subcommands: {
      'financiero': 'Reporte de ingresos, gastos, márgenes',
      'operativo': 'Reporte de entregas, novedades, tiempos',
      'transportadoras': 'Rendimiento por transportadora',
      'ciudades': 'Análisis por ciudad de destino',
      'completo': 'Reporte ejecutivo completo'
    },
    examples: [
      '/reporte',
      '/reporte financiero',
      '/reporte semana pasada',
      '/reporte enero 2026'
    ]
  },

  dashboard: {
    name: 'dashboard',
    icon: '📈',
    description: 'Muestra el dashboard con métricas clave',
    examples: ['/dashboard', '/dashboard kpis']
  },

  // ═══════════════════════════════════════════
  // 📦 GUÍAS Y ENVÍOS
  // ═══════════════════════════════════════════

  guias: {
    name: 'guias',
    icon: '📦',
    description: 'Busca y gestiona guías de envío',
    subcommands: {
      'buscar <número>': 'Buscar guía específica',
      'novedad': 'Guías con novedades',
      'retraso': 'Guías retrasadas',
      'hoy': 'Guías de hoy',
      'pendientes': 'Guías sin entregar'
    },
    examples: [
      '/guias buscar COO20260001',
      '/guias con novedad',
      '/guias retrasadas bogota',
      '/guias pendientes TCC'
    ]
  },

  tracking: {
    name: 'tracking',
    icon: '🔍',
    description: 'Rastrea una guía en tiempo real',
    examples: [
      '/tracking COO20260121001',
      '/tracking SER123456'
    ]
  },

  // ═══════════════════════════════════════════
  // 💰 FINANZAS
  // ═══════════════════════════════════════════

  finanzas: {
    name: 'finanzas',
    icon: '💰',
    description: 'Análisis financiero detallado',
    subcommands: {
      'resumen': 'Resumen P&L',
      'ingresos': 'Detalle de ingresos',
      'gastos': 'Detalle de gastos',
      'margen': 'Análisis de márgenes',
      'proyeccion': 'Proyección de ingresos'
    },
    examples: [
      '/finanzas',
      '/finanzas margen por transportadora',
      '/finanzas gastos mes'
    ]
  },

  // ═══════════════════════════════════════════
  // ⚠️ ALERTAS Y NOTIFICACIONES
  // ═══════════════════════════════════════════

  alertas: {
    name: 'alertas',
    icon: '⚠️',
    description: 'Gestiona alertas del sistema',
    subcommands: {
      'ver': 'Ver alertas activas',
      'criticas': 'Solo alertas críticas',
      'crear': 'Crear nueva alerta',
      'resolver <id>': 'Marcar alerta como resuelta'
    },
    examples: [
      '/alertas',
      '/alertas criticas',
      '/alertas resolver 123'
    ]
  },

  // ═══════════════════════════════════════════
  // 👥 CLIENTES Y CRM
  // ═══════════════════════════════════════════

  clientes: {
    name: 'clientes',
    icon: '👥',
    description: 'Gestión de clientes',
    subcommands: {
      'buscar <nombre>': 'Buscar cliente',
      'top': 'Mejores clientes',
      'inactivos': 'Clientes sin compras recientes',
      'nuevo': 'Registrar nuevo cliente'
    },
    examples: [
      '/clientes top 10',
      '/clientes buscar juan',
      '/clientes inactivos 30 dias'
    ]
  },

  // ═══════════════════════════════════════════
  // 🚚 TRANSPORTADORAS
  // ═══════════════════════════════════════════

  transportadora: {
    name: 'transportadora',
    icon: '🚚',
    description: 'Info y rendimiento de transportadoras',
    subcommands: {
      '<nombre>': 'Ver detalle de transportadora',
      'comparar': 'Comparar todas',
      'mejor': 'Mejor rendimiento',
      'peor': 'Peor rendimiento'
    },
    examples: [
      '/transportadora Coordinadora',
      '/transportadora comparar',
      '/transportadora mejor ciudad Bogota'
    ]
  },

  // ═══════════════════════════════════════════
  // 📤 EXPORTAR Y ENVIAR
  // ═══════════════════════════════════════════

  exportar: {
    name: 'exportar',
    icon: '📤',
    description: 'Exporta datos a diferentes formatos',
    subcommands: {
      'excel': 'Exportar a Excel',
      'pdf': 'Exportar a PDF',
      'csv': 'Exportar a CSV'
    },
    examples: [
      '/exportar excel guias hoy',
      '/exportar pdf reporte semanal'
    ]
  },

  enviar: {
    name: 'enviar',
    icon: '📨',
    description: 'Envía mensajes y notificaciones',
    subcommands: {
      'whatsapp <numero>': 'Enviar por WhatsApp',
      'email <correo>': 'Enviar por email',
      'masivo': 'Envío masivo'
    },
    examples: [
      '/enviar whatsapp 3001234567 "Tu pedido está en camino"',
      '/enviar email cliente@mail.com reporte'
    ]
  },

  // ═══════════════════════════════════════════
  // 🤖 IA Y ML
  // ═══════════════════════════════════════════

  predecir: {
    name: 'predecir',
    icon: '🔮',
    description: 'Predicciones con ML',
    subcommands: {
      'retraso <guia>': 'Predecir si habrá retraso',
      'demanda': 'Predecir demanda',
      'entregas': 'Predecir entregas del día'
    },
    examples: [
      '/predecir retraso COO123456',
      '/predecir demanda proxima semana'
    ]
  },

  entrenar: {
    name: 'entrenar',
    icon: '🧠',
    description: 'Entrena modelos ML',
    examples: [
      '/entrenar modelos',
      '/entrenar con datos nuevos'
    ]
  },

  // ═══════════════════════════════════════════
  // ⚙️ CONFIGURACIÓN
  // ═══════════════════════════════════════════

  config: {
    name: 'config',
    icon: '⚙️',
    description: 'Configuración del sistema',
    subcommands: {
      'ver': 'Ver configuración actual',
      'apis': 'Configurar API keys',
      'notificaciones': 'Configurar notificaciones',
      'metas': 'Configurar metas'
    },
    examples: [
      '/config',
      '/config apis',
      '/config metas margen 25%'
    ]
  },

  // ═══════════════════════════════════════════
  // ❓ AYUDA
  // ═══════════════════════════════════════════

  ayuda: {
    name: 'ayuda',
    icon: '❓',
    description: 'Muestra ayuda y comandos disponibles',
    examples: [
      '/ayuda',
      '/ayuda reporte',
      '/ayuda guias'
    ]
  }
};
```

---

## 5. DISEÑO DE INTERFAZ

### 5.1 Layout Principal

```
┌─────────────────────────────────────────────────────────────────────┐
│  LITPER PRO                                    [🔔] [⚙️] [👤 Admin] │
├───────────────┬─────────────────────────────────────────────────────┤
│               │                                                     │
│  NAVEGACIÓN   │              ÁREA DE CHAT                           │
│  RÁPIDA       │                                                     │
│               │  ┌─────────────────────────────────────────────┐   │
│  📊 Dashboard │  │                                             │   │
│  📦 Guías     │  │     [Historial de conversación]             │   │
│  💰 Finanzas  │  │                                             │   │
│  ⚠️ Alertas   │  │     Mensajes con resultados interactivos    │   │
│  👥 Clientes  │  │     Tarjetas, tablas, gráficos              │   │
│  🚚 Carriers  │  │     Botones de acción                       │   │
│  📤 Exportar  │  │                                             │   │
│  ⚙️ Config    │  │                                             │   │
│               │  └─────────────────────────────────────────────┘   │
│  ─────────    │                                                     │
│  RECIENTES    │  ┌─────────────────────────────────────────────┐   │
│               │  │ Skills: /reporte /guias /finanzas /alertas  │   │
│  • Reporte    │  └─────────────────────────────────────────────┘   │
│  • Guías hoy  │                                                     │
│  • Alerta TCC │  ┌─────────────────────────────────────────────┐   │
│               │  │ [📎] Escribe o usa /comando...    [🎤] [➤]  │   │
│               │  └─────────────────────────────────────────────┘   │
└───────────────┴─────────────────────────────────────────────────────┘
```

### 5.2 Componentes de Chat

#### Mensaje del Usuario
```
┌─────────────────────────────────────────────────────────────┐
│                                          👤 Tú  10:30 AM   │
│                         /reporte financiero semana actual   │
└─────────────────────────────────────────────────────────────┘
```

#### Mensaje del Asistente (con datos)
```
┌─────────────────────────────────────────────────────────────┐
│ 🤖 Asistente  10:30 AM                                      │
│                                                             │
│ 📊 REPORTE FINANCIERO - Semana 15-21 Enero 2026             │
│ ─────────────────────────────────────────────               │
│                                                             │
│ ┌─────────────┬─────────────┬─────────────┬───────────┐    │
│ │ Facturado   │ Ganancia    │ Margen      │ Entregas  │    │
│ │ $45.2M      │ $12.4M      │ 27.5%       │ 92.1%     │    │
│ │ ↑ 12%       │ ↑ 8%        │ ↓ 2%        │ ↑ 3%      │    │
│ └─────────────┴─────────────┴─────────────┴───────────┘    │
│                                                             │
│ ⚠️ Alertas:                                                 │
│ • TCC con tasa de entrega bajo 85%                         │
│ • Devoluciones aumentaron 15% vs semana anterior           │
│                                                             │
│ 💡 Recomendación:                                           │
│ Considera reducir envíos por TCC a ciudades pequeñas.      │
│                                                             │
│ [📥 Exportar PDF] [📊 Ver detalle] [📧 Enviar por email]   │
└─────────────────────────────────────────────────────────────┘
```

#### Mensaje con Tabla
```
┌─────────────────────────────────────────────────────────────┐
│ 🤖 Asistente  10:32 AM                                      │
│                                                             │
│ 📦 73 guías con novedades encontradas:                      │
│                                                             │
│ ┌──────────────┬──────────────┬───────────┬────────────┐   │
│ │ Guía         │ Ciudad       │ Novedad   │ Días       │   │
│ ├──────────────┼──────────────┼───────────┼────────────┤   │
│ │ COO2026001   │ Bogotá       │ Ausente   │ 2          │   │
│ │ SER2026045   │ Medellín     │ Dirección │ 3          │   │
│ │ TCC2026089   │ Cali         │ Rechazado │ 1          │   │
│ │ ...          │ ...          │ ...       │ ...        │   │
│ └──────────────┴──────────────┴───────────┴────────────┘   │
│                                                             │
│ Mostrando 10 de 73  [Ver más] [Filtrar]                    │
│                                                             │
│ [📥 Exportar] [📨 Enviar alertas] [🔄 Actualizar estados]  │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Paleta de Colores

```css
:root {
  /* Fondo */
  --bg-primary: #0F172A;      /* Fondo principal */
  --bg-secondary: #1E293B;    /* Tarjetas */
  --bg-tertiary: #334155;     /* Hover */

  /* Texto */
  --text-primary: #F8FAFC;    /* Texto principal */
  --text-secondary: #94A3B8;  /* Texto secundario */
  --text-muted: #64748B;      /* Texto deshabilitado */

  /* Acentos */
  --accent-primary: #F97316;  /* Naranja Litper */
  --accent-secondary: #6366F1; /* Indigo */
  --accent-tertiary: #8B5CF6; /* Violeta */

  /* Estados */
  --success: #10B981;         /* Verde */
  --warning: #F59E0B;         /* Amarillo */
  --error: #EF4444;           /* Rojo */
  --info: #3B82F6;            /* Azul */

  /* Chat */
  --chat-user: #1E3A5F;       /* Burbuja usuario */
  --chat-assistant: #1E293B;  /* Burbuja asistente */
  --chat-input: #0F172A;      /* Input */
}
```

---

## 6. IMPLEMENTACIÓN POR FASES

### FASE 1: FUNDACIÓN (Semana 1-2)

#### Tareas:
1. **Crear componente AdminChat.tsx base**
   - Layout principal
   - Input de chat
   - Área de mensajes

2. **Implementar parser de skills**
   - Detectar `/comando`
   - Extraer parámetros
   - Validar sintaxis

3. **Crear 3 skills básicos**
   - `/ayuda` - Lista de comandos
   - `/dashboard` - Métricas principales
   - `/guias` - Búsqueda básica

4. **Conectar con backend existente**
   - Usar APIs ya creadas
   - Mantener compatibilidad

#### Entregables:
```
components/AdminChat/
├── AdminChat.tsx           ✅
├── ChatInput.tsx           ✅
├── ChatMessages.tsx        ✅
├── skills/
│   ├── index.ts            ✅
│   ├── AyudaSkill.ts       ✅
│   ├── DashboardSkill.ts   ✅
│   └── GuiasSkill.ts       ✅
└── hooks/
    └── useChat.ts          ✅
```

### FASE 2: SKILLS CORE (Semana 3-4)

#### Tareas:
1. **Implementar skills de reportes**
   - `/reporte` con variantes
   - Renderizado de gráficos
   - Exportación

2. **Implementar skills de finanzas**
   - `/finanzas` resumen
   - Análisis con IA

3. **Implementar skills de alertas**
   - `/alertas` ver y crear
   - Notificaciones push

4. **Crear renderizadores**
   - Tablas interactivas
   - Gráficos Chart.js
   - Tarjetas de métricas

#### Entregables:
```
skills/
├── ReporteSkill.ts         ✅
├── FinanzasSkill.ts        ✅
├── AlertasSkill.ts         ✅
└── ExportarSkill.ts        ✅

renderers/
├── TableRenderer.tsx       ✅
├── ChartRenderer.tsx       ✅
├── CardRenderer.tsx        ✅
└── AlertRenderer.tsx       ✅
```

### FASE 3: SKILLS AVANZADOS (Semana 5-6)

#### Tareas:
1. **Skills de acción**
   - `/enviar` WhatsApp/Email
   - `/predecir` ML
   - `/entrenar` modelos

2. **Skills de configuración**
   - `/config` sistema
   - Gestión de APIs

3. **Integración con centros existentes**
   - Migrar funcionalidad de los 19 centros
   - Acceso híbrido (chat + UI tradicional)

4. **Mejoras UX**
   - Autocompletado de comandos
   - Historial de comandos
   - Sugerencias contextuales

### FASE 4: PULIDO (Semana 7-8)

#### Tareas:
1. **Optimización**
   - Performance
   - Caché de resultados
   - Lazy loading

2. **Accesibilidad**
   - Keyboard navigation
   - Screen readers
   - Responsive design

3. **Testing**
   - Unit tests
   - E2E tests
   - User testing

4. **Documentación**
   - Guía de usuario
   - Documentación de skills
   - API docs

---

## 7. CÓDIGO DE EJEMPLO

### 7.1 AdminChat.tsx Principal

```tsx
// components/AdminChat/AdminChat.tsx

import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, Sparkles } from 'lucide-react';
import { ChatMessages } from './ChatMessages';
import { SkillsBar } from './SkillsBar';
import { useChat } from './hooks/useChat';
import { SKILLS } from './skills';

export const AdminChat: React.FC = () => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { messages, sendMessage, isProcessing } = useChat();

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    await sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSkillClick = (skillName: string) => {
    setInput(`/${skillName} `);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-orange-500" />
          <h1 className="text-xl font-bold text-white">Litper Admin</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">
            {Object.keys(SKILLS).length} skills disponibles
          </span>
        </div>
      </header>

      {/* Chat Messages */}
      <ChatMessages messages={messages} isProcessing={isProcessing} />

      {/* Skills Bar */}
      <SkillsBar onSkillClick={handleSkillClick} />

      {/* Input */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-2 bg-slate-800 rounded-xl p-2">
          <button className="p-2 hover:bg-slate-700 rounded-lg transition">
            <Paperclip className="w-5 h-5 text-slate-400" />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje o usa /comando..."
            className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none"
          />

          <button className="p-2 hover:bg-slate-700 rounded-lg transition">
            <Mic className="w-5 h-5 text-slate-400" />
          </button>

          <button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            className="p-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 rounded-lg transition"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};
```

### 7.2 Hook useChat

```tsx
// components/AdminChat/hooks/useChat.ts

import { useState, useCallback } from 'react';
import { executeSkill, parseSkillCommand } from '../skills';
import { Message, SkillResult } from '../types';

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '¡Hola! Soy tu asistente de Litper Pro. Puedo ayudarte con reportes, guías, finanzas y más. Usa /ayuda para ver los comandos disponibles.',
      timestamp: new Date()
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    // Agregar mensaje del usuario
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      let response: SkillResult;

      // Verificar si es un comando de skill
      const skillCommand = parseSkillCommand(content);

      if (skillCommand) {
        // Ejecutar skill
        response = await executeSkill(skillCommand.name, skillCommand.params);
      } else {
        // Enviar a Claude para respuesta natural
        const aiResponse = await fetch('/api/brain/think', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pregunta: content })
        });
        const data = await aiResponse.json();
        response = {
          type: 'text',
          content: data.respuesta || data.pensamiento
        };
      }

      // Agregar respuesta del asistente
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        data: response.data,
        actions: response.actions,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      // Mensaje de error
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Lo siento, hubo un error procesando tu solicitud. Intenta de nuevo.',
        error: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return { messages, sendMessage, isProcessing };
}
```

### 7.3 Skills Bar

```tsx
// components/AdminChat/SkillsBar.tsx

import React from 'react';
import { SKILLS } from './skills';

interface SkillsBarProps {
  onSkillClick: (skillName: string) => void;
}

export const SkillsBar: React.FC<SkillsBarProps> = ({ onSkillClick }) => {
  const quickSkills = ['reporte', 'guias', 'finanzas', 'alertas', 'dashboard', 'ayuda'];

  return (
    <div className="px-4 py-2 border-t border-slate-700 overflow-x-auto">
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 mr-2">Skills:</span>
        {quickSkills.map(skillName => {
          const skill = SKILLS[skillName];
          return (
            <button
              key={skillName}
              onClick={() => onSkillClick(skillName)}
              className="flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-full text-sm text-slate-300 transition whitespace-nowrap"
            >
              <span>{skill.icon}</span>
              <span>/{skillName}</span>
            </button>
          );
        })}
        <button className="px-3 py-1 text-slate-500 hover:text-slate-300 text-sm">
          más...
        </button>
      </div>
    </div>
  );
};
```

---

## 8. MIGRACIÓN DE FUNCIONALIDADES

### Mapeo de Centros a Skills

| Centro Actual | Skill Nuevo | Migración |
|---------------|-------------|-----------|
| FinanceCenter | `/finanzas` | Integrar P&L |
| OrdersCenter | `/pedidos` | Mantener lógica |
| CRMCenter | `/clientes` | Simplificar |
| ReportsCenter | `/reporte` | Unificar |
| NotificationsCenter | `/alertas` | Combinar |
| MarketingCenter | `/marketing` | Nuevo skill |
| SecurityCenter | `/seguridad` | Restringir |
| AIConfigCenter | `/config ia` | Subcomando |
| MCPCenter | `/config mcp` | Subcomando |
| LearningCenter | `/entrenar` | Skill ML |
| CommandCenter | `/dashboard` | Principal |
| SemaforoInteligente | `/semaforo` | Skill nuevo |

---

## 9. MÉTRICAS DE ÉXITO

### KPIs a Medir

| Métrica | Actual | Meta |
|---------|--------|------|
| Tiempo para generar reporte | 5-10 clicks | 1 comando |
| Navegación entre secciones | Múltiples tabs | Conversacional |
| Curva de aprendizaje | Alta (19 centros) | Baja (/ayuda) |
| Acciones por tarea | 5-10 | 1-3 |
| Satisfacción usuario | ? | 4.5/5 |

---

## 10. PRÓXIMOS PASOS

### Inmediato (Esta semana)
1. ✅ Aprobar este plan
2. Crear estructura de carpetas
3. Implementar AdminChat.tsx base
4. Implementar `/ayuda` y `/dashboard`

### Corto plazo (2 semanas)
1. Skills de reportes y finanzas
2. Renderizadores de datos
3. Integración con backend

### Mediano plazo (1 mes)
1. Todos los skills implementados
2. Migración de centros
3. Testing y documentación

---

## RESUMEN EJECUTIVO

**Problema:** Admin fragmentado en 19 centros con UX pobre.

**Solución:** Chat unificado con skills tipo Claude Code.

**Beneficios:**
- Interacción natural con el sistema
- Una sola interfaz para todo
- Curva de aprendizaje mínima
- Acciones ejecutables inmediatamente
- Extensible con nuevos skills

**Inversión:** 6-8 semanas de desarrollo

**ROI Esperado:**
- 70% menos tiempo en tareas administrativas
- 90% reducción en curva de aprendizaje
- Diferenciador competitivo único

---

*Plan creado: 21 Enero 2026*
*Autor: Claude Opus 4.5*
