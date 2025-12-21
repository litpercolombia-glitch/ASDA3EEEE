# PLAN MAESTRO: CEREBRO AUTÓNOMO LITPER PRO
## Sistema de Aprendizaje Autónomo Nivel Amazon

---

## DIAGNÓSTICO ACTUAL

### Lo que YA tienes (52,163 líneas de código):

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA ACTUAL                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │    BRAIN     │    │   SKILLS     │    │ INTEGRATIONS │      │
│  │  ─────────   │    │  ─────────   │    │  ─────────   │      │
│  │ CentralBrain │    │ 6 Skills     │    │ Chatea       │      │
│  │ EventBus     │    │ WhatsApp     │    │ Claude       │      │
│  │ MemoryMgr    │    │ Triggers     │    │ OpenAI       │      │
│  │ ContextMgr   │    │ Actions      │    │ Gemini       │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         ↓                   ↓                   ↓               │
│         │                   │                   │               │
│         └───────────────────┴───────────────────┘               │
│                             │                                   │
│                      ❌ NO CONECTADOS                           │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  KNOWLEDGE   │    │  DECISIONS   │    │  AUTOMATION  │      │
│  │  ─────────   │    │  ─────────   │    │  ─────────   │      │
│  │ LearningEng  │    │ DecisionEng  │    │ RulesManager │      │
│  │ PatternDet   │    │ ActionExec   │    │ AlertManager │      │
│  │ KnowledgeHub │    │ Predictions  │    │ InsightsMgr  │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         ↓                   ↓                   ↓               │
│         │                   │                   │               │
│         └───────────────────┴───────────────────┘               │
│                             │                                   │
│                      ❌ NO CONECTADOS                           │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │    STORES    │    │     TABS     │    │   SERVICES   │      │
│  │  ─────────   │    │  ─────────   │    │  ─────────   │      │
│  │ shipmentSt   │    │ 23 tabs      │    │ 40+ services │      │
│  │ authStore    │    │ Dashboard    │    │ logísticos   │      │
│  │ uiStore      │    │ Procesos     │    │ financieros  │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### PROBLEMA PRINCIPAL:
**Tienes TODOS los componentes pero NO están conectados entre sí.**

Es como tener un cerebro con todas las neuronas pero sin sinapsis.

---

## VISIÓN: SISTEMA NERVIOSO CENTRAL

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     LITPER NEURAL NETWORK                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                         ┌─────────────────┐                             │
│                         │   ORCHESTRATOR  │ ← NUEVO                     │
│                         │  (El Director)  │                             │
│                         └────────┬────────┘                             │
│                                  │                                      │
│              ┌───────────────────┼───────────────────┐                  │
│              │                   │                   │                  │
│              ▼                   ▼                   ▼                  │
│   ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐       │
│   │  PERCEPTION      │ │   COGNITION      │ │    ACTION        │       │
│   │  (Percepción)    │ │   (Pensamiento)  │ │    (Acción)      │       │
│   │                  │ │                  │ │                  │       │
│   │ • EventBus       │ │ • CentralBrain   │ │ • SkillsEngine   │       │
│   │ • DataUnifier    │ │ • LearningEngine │ │ • ActionExecutor │       │
│   │ • Integrations   │ │ • DecisionEngine │ │ • Notifications  │       │
│   └──────────────────┘ └──────────────────┘ └──────────────────┘       │
│              │                   │                   │                  │
│              │                   │                   │                  │
│              └───────────────────┴───────────────────┘                  │
│                                  │                                      │
│                         ┌────────┴────────┐                             │
│                         │    FEEDBACK     │                             │
│                         │   (Aprendizaje) │                             │
│                         └─────────────────┘                             │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                      UNIFIED STATE                              │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │    │
│  │  │Shipments│ │ Orders  │ │ Users   │ │ Finance │ │ Metrics │  │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## PLAN DE IMPLEMENTACIÓN: 7 FASES

---

## FASE 1: ORCHESTRATOR (El Director)
**Prioridad: CRÍTICA | Esfuerzo: Alto**

### Qué es:
Un servicio central que coordina TODOS los demás sistemas.

### Crear: `services/orchestrator/Orchestrator.ts`

```typescript
// PSEUDO-CÓDIGO DEL ORQUESTADOR
interface OrchestratorConfig {
  autoLearn: boolean;          // Aprender automáticamente
  autoExecute: boolean;        // Ejecutar decisiones automáticamente
  feedbackLoop: boolean;       // Ciclo de retroalimentación
  realTimeSync: boolean;       // Sincronización en tiempo real
}

class Orchestrator {
  // Conecta todos los sistemas
  private brain: CentralBrain;
  private skills: SkillsEngine;
  private learning: LearningEngine;
  private decisions: DecisionEngine;
  private integrations: IntegrationManager;
  private alerts: AlertManager;

  // Ciclo principal - se ejecuta cada X segundos
  async tick() {
    // 1. PERCIBIR: Recoger datos de todas las fuentes
    const perception = await this.perceive();

    // 2. PROCESAR: Analizar y encontrar patrones
    const analysis = await this.process(perception);

    // 3. DECIDIR: Tomar decisiones basadas en análisis
    const decisions = await this.decide(analysis);

    // 4. ACTUAR: Ejecutar acciones (skills, alertas, etc)
    const results = await this.act(decisions);

    // 5. APRENDER: Registrar resultados para mejorar
    await this.learn(results);
  }

  // Ejemplo: Un envío lleva 5 días sin movimiento
  // 1. PERCIBE: EventBus detecta evento 'shipment.stalled'
  // 2. PROCESA: LearningEngine predice 70% probabilidad de problema
  // 3. DECIDE: DecisionEngine sugiere contactar cliente
  // 4. ACTÚA: SkillsEngine ejecuta 'recordatorio_automatico'
  // 5. APRENDE: Si el cliente recoge → guardar como caso exitoso
}
```

### Archivos a crear:
```
services/orchestrator/
├── Orchestrator.ts           # Clase principal
├── PerceptionLayer.ts        # Capa de percepción
├── CognitionLayer.ts         # Capa de cognición
├── ActionLayer.ts            # Capa de acción
├── FeedbackLoop.ts           # Ciclo de retroalimentación
└── index.ts                  # Exportaciones
```

---

## FASE 2: UNIFIED EVENT SYSTEM
**Prioridad: ALTA | Esfuerzo: Medio**

### Problema actual:
El EventBus existe pero solo el Brain lo usa. Los otros sistemas no emiten ni escuchan eventos.

### Solución:
Hacer que TODOS los sistemas emitan y escuchen eventos.

### Eventos que deben existir:

```typescript
// EVENTOS DE DATOS
'data.shipment.created'      // Nuevo envío
'data.shipment.updated'      // Envío actualizado
'data.shipment.delivered'    // Envío entregado
'data.shipment.issue'        // Problema con envío
'data.order.created'         // Nuevo pedido
'data.order.confirmed'       // Pedido confirmado
'data.user.action'           // Usuario hizo algo

// EVENTOS DE IA
'ai.prediction.made'         // IA hizo predicción
'ai.pattern.detected'        // Patrón detectado
'ai.insight.generated'       // Insight generado
'ai.chat.message'            // Mensaje de chat

// EVENTOS DE SKILLS
'skill.triggered'            // Skill activado
'skill.executed'             // Skill ejecutado
'skill.completed'            // Skill completado
'skill.failed'               // Skill falló

// EVENTOS DE USUARIO
'user.login'                 // Usuario entró
'user.tab.changed'           // Cambió de pestaña
'user.search'                // Usuario buscó algo
'user.export'                // Usuario exportó datos

// EVENTOS DE APRENDIZAJE
'learning.data.collected'    // Datos recolectados
'learning.model.trained'     // Modelo entrenado
'learning.feedback.received' // Feedback recibido
```

### Modificar estos archivos:
- `services/skills/SkillsEngine.ts` → Emitir eventos al ejecutar
- `services/integrations/IntegrationManager.ts` → Emitir al recibir datos
- `stores/*.ts` → Emitir al cambiar estado
- `components/tabs/*.tsx` → Emitir al interactuar

---

## FASE 3: LEARNING PIPELINE (Aprendizaje Continuo)
**Prioridad: ALTA | Esfuerzo: Alto**

### Problema actual:
LearningEngine existe pero:
- Solo se entrena manualmente
- No recibe feedback de resultados
- No mejora automáticamente

### Solución: Pipeline de Aprendizaje Automático

```
┌─────────────────────────────────────────────────────────────────┐
│                    LEARNING PIPELINE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐     │
│  │ COLLECT │ →  │ PROCESS │ →  │  TRAIN  │ →  │ DEPLOY  │     │
│  │  Datos  │    │ Limpiar │    │ Modelo  │    │  Usar   │     │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘     │
│       ↑                                              │          │
│       │                                              │          │
│       └──────────────── FEEDBACK ←───────────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Crear: `services/learning/LearningPipeline.ts`

```typescript
class LearningPipeline {
  // Recolectar datos de entrenamiento automáticamente
  collectTrainingData() {
    // Cada vez que un envío se completa:
    // - Guardar: tiempo real vs predicho
    // - Guardar: transportadora + destino + resultado
    // - Guardar: acciones tomadas y su efectividad
  }

  // Entrenar cuando hay suficientes datos nuevos
  autoTrain() {
    // Si hay +50 nuevos casos desde último entrenamiento:
    // - Re-entrenar modelo de tiempo de entrega
    // - Re-entrenar modelo de probabilidad de éxito
    // - Re-entrenar modelo de detección de problemas
  }

  // Registrar feedback de cada acción
  recordFeedback(action: string, result: 'success' | 'failure') {
    // Si enviamos WhatsApp y cliente recogió → éxito
    // Si enviamos WhatsApp y no recogió → fracaso
    // Usar para mejorar cuándo y cómo contactar
  }
}
```

### Modelos a mejorar:
1. **Predicción de entrega**: ¿Cuándo llegará?
2. **Probabilidad de éxito**: ¿Se entregará?
3. **Detección de riesgo**: ¿Tendrá problemas?
4. **Mejor acción**: ¿Qué hacer en cada situación?
5. **Mejor momento**: ¿Cuándo contactar al cliente?

---

## FASE 4: AUTONOMOUS SKILLS (Skills Inteligentes)
**Prioridad: ALTA | Esfuerzo: Medio**

### Problema actual:
Los 6 skills existen pero:
- Solo se ejecutan manualmente
- No se activan por eventos
- No usan la IA para decidir cuándo ejecutar

### Solución: Skills que se activan solos

```typescript
// services/skills/AutonomousSkillRunner.ts

class AutonomousSkillRunner {
  // Escuchar eventos y activar skills automáticamente
  setupTriggers() {
    // Cuando un envío lleva +3 días sin movimiento
    eventBus.on('shipment.stalled', async (event) => {
      // Preguntar al cerebro si debemos actuar
      const shouldAct = await brain.shouldTakeAction({
        situation: 'shipment_stalled',
        data: event.payload,
      });

      if (shouldAct.recommended) {
        await skillsEngine.executeSkill('recordatorios_automaticos', {
          targets: [event.payload.shipment],
        });
      }
    });

    // Cuando un pedido es confirmado
    eventBus.on('order.confirmed', async (event) => {
      // Verificar si debemos crear guía automáticamente
      const config = await brain.getBusinessRules();

      if (config.autoCreateShipment) {
        await skillsEngine.executeSkill('sincronizar_guia', {
          order: event.payload,
        });
      }
    });
  }
}
```

### Skills autónomos a implementar:

| Skill | Trigger Automático | Condición |
|-------|-------------------|-----------|
| Confirmación Pedidos | `order.created` | Pedido nuevo sin confirmar |
| Reclamo Oficina | `shipment.in_office` | +48h en oficina |
| Recordatorios | `shipment.stalled` | +3 días sin movimiento |
| Sincronizar Guía | `order.confirmed` | Pedido confirmado sin guía |
| Carrito Abandonado | `cart.abandoned` | +24h sin completar |
| Postventa | `shipment.delivered` | 7 días después de entrega |

---

## FASE 5: UNIFIED DATA LAYER
**Prioridad: MEDIA | Esfuerzo: Alto**

### Problema actual:
- Datos en localStorage dispersos
- Cada componente guarda sus propios datos
- No hay una "fuente de verdad" única

### Solución: Capa de datos unificada

```typescript
// services/data/UnifiedDataLayer.ts

class UnifiedDataLayer {
  private stores = {
    shipments: new ShipmentStore(),
    orders: new OrderStore(),
    users: new UserStore(),
    finance: new FinanceStore(),
    metrics: new MetricsStore(),
  };

  // Todos los datos pasan por aquí
  async save(entity: string, data: unknown) {
    // 1. Validar datos
    // 2. Guardar en store correspondiente
    // 3. Emitir evento
    // 4. Sincronizar con backend si está conectado
    // 5. Actualizar métricas
  }

  // Obtener datos de cualquier fuente
  async get(entity: string, query: Query) {
    // 1. Buscar en cache local
    // 2. Si no está, buscar en backend
    // 3. Actualizar cache
    // 4. Retornar datos
  }

  // Sincronización bidireccional
  async sync() {
    // 1. Obtener cambios locales
    // 2. Enviar a backend
    // 3. Obtener cambios remotos
    // 4. Resolver conflictos
    // 5. Actualizar local
  }
}
```

### Estructura de datos unificada:

```
UnifiedDataLayer
├── shipments/         # Envíos y guías
│   ├── active        # Envíos activos
│   ├── completed     # Envíos completados
│   └── issues        # Envíos con problemas
├── orders/           # Pedidos
│   ├── pending       # Pendientes
│   ├── processing    # En proceso
│   └── completed     # Completados
├── users/            # Usuarios del sistema
│   ├── profiles      # Perfiles
│   ├── permissions   # Permisos
│   └── activity      # Actividad
├── finance/          # Datos financieros
│   ├── revenue       # Ingresos
│   ├── costs         # Costos
│   └── metrics       # Métricas
└── brain/            # Datos del cerebro
    ├── memory        # Memoria
    ├── patterns      # Patrones detectados
    └── decisions     # Decisiones tomadas
```

---

## FASE 6: REAL-TIME DASHBOARD
**Prioridad: MEDIA | Esfuerzo: Medio**

### Problema actual:
El dashboard muestra datos estáticos que no se actualizan en tiempo real.

### Solución: Dashboard reactivo

```typescript
// hooks/useRealtimeDashboard.ts

function useRealtimeDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>();

  useEffect(() => {
    // Suscribirse a cambios en tiempo real
    const unsubscribe = orchestrator.subscribe('metrics', (newMetrics) => {
      setMetrics(newMetrics);
    });

    return unsubscribe;
  }, []);

  // Métricas que se actualizan automáticamente:
  // - Envíos en tiempo real
  // - Alertas activas
  // - Predicciones del día
  // - Estado del cerebro
  // - Skills ejecutados
  // - Efectividad de acciones
}
```

### Widgets del Dashboard:

```
┌────────────────────────────────────────────────────────────┐
│                    DASHBOARD EN VIVO                       │
├──────────────┬──────────────┬──────────────┬──────────────┤
│   ENVÍOS     │   CEREBRO    │    SKILLS    │   FINANZAS   │
│   ─────      │   ─────      │    ─────     │   ─────      │
│ 📦 234 act   │ 🧠 Sano      │ ⚡ 12 hoy    │ 💰 $45,230   │
│ ✅ 89% éxito │ 📊 3 pattern │ ✅ 95% éxito │ 📈 +12%      │
│ ⚠️ 5 alertas │ 💡 2 insight │ 🔄 2 activos │ 📉 $2,100    │
└──────────────┴──────────────┴──────────────┴──────────────┘
│                                                            │
│  [LÍNEA DE TIEMPO DE EVENTOS EN VIVO]                     │
│  10:30 → Skill 'recordatorio' ejecutado en 3 envíos       │
│  10:25 → Patrón detectado: Retrasos en zona norte         │
│  10:20 → 5 envíos entregados                              │
│  10:15 → Alerta: Envío #123 sin movimiento                │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## FASE 7: ADMIN CONTROL CENTER
**Prioridad: BAJA | Esfuerzo: Medio**

### Centro de control para administradores:

```typescript
// components/admin/BrainControlCenter.tsx

interface BrainControlCenter {
  // Estado del sistema
  systemHealth: 'healthy' | 'degraded' | 'critical';

  // Controles
  toggleAutoLearn: boolean;    // Activar/desactivar aprendizaje
  toggleAutoExecute: boolean;  // Activar/desactivar ejecución auto
  confidenceThreshold: number; // Umbral de confianza para actuar

  // Monitoreo
  decisionsToday: number;
  actionsExecuted: number;
  learningProgress: number;

  // Logs
  recentDecisions: Decision[];
  recentActions: Action[];
  recentLearnings: Learning[];
}
```

### Funcionalidades del centro de control:

1. **Modo Piloto Automático**: El sistema toma decisiones solo
2. **Modo Semi-automático**: Sugiere pero pide confirmación
3. **Modo Manual**: Solo sugiere, humano decide
4. **Ajuste de umbrales**: Qué tan seguro debe estar para actuar
5. **Visualización de decisiones**: Ver qué está pensando el cerebro
6. **Override manual**: Cancelar decisiones del sistema
7. **Training manual**: Forzar re-entrenamiento de modelos

---

## CRONOGRAMA DE IMPLEMENTACIÓN

```
SEMANA 1-2: FASE 1 - Orchestrator
├── Día 1-3: Crear estructura base del Orchestrator
├── Día 4-5: Implementar ciclo principal (tick)
├── Día 6-7: Conectar con Brain existente
└── Día 8-10: Testing y ajustes

SEMANA 3: FASE 2 - Unified Events
├── Día 1-2: Extender EventBus
├── Día 3-4: Conectar Skills con EventBus
├── Día 5-6: Conectar Integrations con EventBus
└── Día 7: Testing

SEMANA 4-5: FASE 3 - Learning Pipeline
├── Día 1-3: Crear colector de datos de entrenamiento
├── Día 4-6: Implementar auto-training
├── Día 7-9: Sistema de feedback
└── Día 10: Testing

SEMANA 6: FASE 4 - Autonomous Skills
├── Día 1-2: Crear AutonomousSkillRunner
├── Día 3-4: Configurar triggers automáticos
├── Día 5-6: Conectar con DecisionEngine
└── Día 7: Testing

SEMANA 7-8: FASE 5 - Unified Data Layer
├── Día 1-4: Crear UnifiedDataLayer
├── Día 5-7: Migrar stores existentes
├── Día 8-10: Sincronización
└── Día 11-14: Testing

SEMANA 9: FASE 6 - Real-time Dashboard
├── Día 1-3: Hooks reactivos
├── Día 4-5: Widgets en vivo
└── Día 6-7: Testing

SEMANA 10: FASE 7 - Admin Control Center
├── Día 1-4: Interfaz de control
├── Día 5-6: Monitoreo
└── Día 7: Testing final
```

---

## MÉTRICAS DE ÉXITO

### El sistema será "nivel Amazon" cuando:

| Métrica | Actual | Objetivo |
|---------|--------|----------|
| Decisiones autónomas/día | 0 | 50+ |
| Skills ejecutados automáticamente/día | 0 | 20+ |
| Precisión de predicciones | 65% | 85%+ |
| Tiempo de respuesta a problemas | Manual | <5 min |
| Mejora del modelo por semana | 0% | 2-5% |
| Integración entre sistemas | 10% | 95%+ |

---

## RESUMEN EJECUTIVO

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   ANTES:  Componentes aislados → Usuario hace todo manualmente   │
│                                                                  │
│   DESPUÉS: Sistema nervioso conectado → Cerebro autónomo         │
│                                                                  │
│   ┌─────────┐                                                    │
│   │ Usuario │ ← Solo supervisa y ajusta                          │
│   └────┬────┘                                                    │
│        │                                                         │
│        ▼                                                         │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    ORCHESTRATOR                          │   │
│   │   Percibe → Procesa → Decide → Actúa → Aprende          │   │
│   └─────────────────────────────────────────────────────────┘   │
│        │                                                         │
│        ├──────────────────┬──────────────────┐                  │
│        ▼                  ▼                  ▼                  │
│   ┌─────────┐        ┌─────────┐        ┌─────────┐            │
│   │  Brain  │ ←───→  │ Skills  │ ←───→  │   AI    │            │
│   └─────────┘        └─────────┘        └─────────┘            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## PRÓXIMO PASO INMEDIATO

**Comenzar con FASE 1: Orchestrator**

1. Crear carpeta `services/orchestrator/`
2. Implementar `Orchestrator.ts` con ciclo básico
3. Conectar con `CentralBrain` existente
4. Hacer primera prueba de ciclo perceive→process→decide→act→learn

¿Quieres que empiece a implementar la Fase 1?
