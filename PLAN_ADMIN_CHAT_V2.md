# PLAN UNIFICADO: Admin Panel con Chat IA

## Vision General

Transformar el Admin Panel actual (3 versiones duplicadas, 1,590+ lineas) en un **sistema chat-first** inspirado en Claude.ai donde:
- El chat es la interfaz principal de interaccion
- Las skills ejecutan acciones especificas
- Los artifacts muestran resultados visuales
- Todo es modular, mantenible y extensible

---

## FASE 1: Fundamentos (Semana 1-2)

### 1.1 Estructura de Archivos

```
components/
  AdminV2/
    index.tsx                    # Export principal
    AdminPanelV2.tsx            # Componente contenedor

    chat/
      ChatInterface.tsx          # Interfaz de chat principal
      MessageList.tsx           # Lista de mensajes
      MessageInput.tsx          # Input con sugerencias
      MessageBubble.tsx         # Burbuja de mensaje
      SuggestedActions.tsx      # Acciones sugeridas

    artifacts/
      ArtifactViewer.tsx        # Visor de artifacts
      ArtifactTypes.tsx         # Tipos de artifacts
      TableArtifact.tsx         # Tabla de datos
      ChartArtifact.tsx         # Graficos
      FormArtifact.tsx          # Formularios interactivos
      PDFArtifact.tsx           # Documentos PDF

    skills/
      SkillsRegistry.ts         # Registro central de skills
      SkillExecutor.ts          # Ejecutor de skills
      types.ts                  # Tipos de skills

      logistics/                # 12 skills logisticas
        TrackShipment.skill.ts
        BulkStatusUpdate.skill.ts
        GenerateReport.skill.ts
        AnalyzeCarrier.skill.ts
        PredictDelivery.skill.ts
        CreateTicket.skill.ts
        ManageReturns.skill.ts
        OptimizeRoute.skill.ts
        AlertConfig.skill.ts
        ExportData.skill.ts
        ImportGuides.skill.ts
        CarrierComparison.skill.ts

      finance/                  # 10 skills financieras
        FinancialReport.skill.ts
        InvoiceAnalysis.skill.ts
        ProfitCalculation.skill.ts
        ExpenseTracking.skill.ts
        CarrierCosts.skill.ts
        RefundManagement.skill.ts
        BudgetPlanning.skill.ts
        CashFlow.skill.ts
        TaxCalculation.skill.ts
        FinancialForecast.skill.ts

      analytics/                # 8 skills de analitica
        DashboardMetrics.skill.ts
        TrendAnalysis.skill.ts
        PerformanceReport.skill.ts
        CustomerInsights.skill.ts
        SeasonalPatterns.skill.ts
        AnomalyDetection.skill.ts
        BenchmarkAnalysis.skill.ts
        CustomReport.skill.ts

      automation/               # 6 skills de automatizacion
        ScheduleTask.skill.ts
        TriggerWorkflow.skill.ts
        BatchProcess.skill.ts
        AutoNotify.skill.ts
        DataSync.skill.ts
        CleanupTask.skill.ts

      communication/            # 4 skills de comunicacion
        SendWhatsApp.skill.ts
        EmailTemplate.skill.ts
        SMSNotification.skill.ts
        BulkMessage.skill.ts

    sidebar/
      SkillsSidebar.tsx         # Barra lateral de skills
      SkillCard.tsx             # Tarjeta de skill
      SkillStore.tsx            # Tienda de skills

    projects/
      ProjectManager.tsx        # Gestor de proyectos
      ProjectContext.tsx        # Contexto del proyecto
      MemoryStore.ts           # Almacenamiento de memoria

    hooks/
      useChat.ts               # Hook del chat
      useSkills.ts             # Hook de skills
      useArtifacts.ts          # Hook de artifacts
      useProjects.ts           # Hook de proyectos

    utils/
      aiProviders.ts           # Proveedores IA (Claude, Gemini)
      messageParser.ts         # Parser de mensajes
      skillMatcher.ts          # Matcher de skills por intent
```

### 1.2 Tipos Base

```typescript
// types.ts

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  icon: LucideIcon;

  // Configuracion
  requiredParams: SkillParam[];
  optionalParams?: SkillParam[];

  // Permisos
  roles: ('admin' | 'operator' | 'viewer')[];

  // Ejecucion
  execute: (params: Record<string, any>, context: SkillContext) => Promise<SkillResult>;

  // UI
  form?: React.FC<SkillFormProps>;
  artifact?: ArtifactType;

  // Metadata
  keywords: string[];
  examples: string[];
  version: string;
}

export type SkillCategory =
  | 'logistics'
  | 'finance'
  | 'analytics'
  | 'automation'
  | 'communication';

export interface SkillResult {
  success: boolean;
  message: string;
  data?: any;
  artifact?: {
    type: ArtifactType;
    content: any;
  };
  suggestedActions?: SuggestedAction[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  skillUsed?: string;
  artifact?: Artifact;
  status: 'pending' | 'complete' | 'error';
}

export interface Artifact {
  id: string;
  type: ArtifactType;
  title: string;
  content: any;
  createdAt: Date;
  messageId: string;
}

export type ArtifactType =
  | 'table'
  | 'chart'
  | 'form'
  | 'pdf'
  | 'code'
  | 'image'
  | 'markdown';
```

---

## FASE 2: Skills Registry (Semana 2-3)

### 2.1 SkillsRegistry.ts

```typescript
class SkillsRegistryImpl {
  private skills: Map<string, Skill> = new Map();

  register(skill: Skill): void {
    this.skills.set(skill.id, skill);
  }

  get(id: string): Skill | undefined {
    return this.skills.get(id);
  }

  getByCategory(category: SkillCategory): Skill[] {
    return Array.from(this.skills.values())
      .filter(s => s.category === category);
  }

  search(query: string): Skill[] {
    const lower = query.toLowerCase();
    return Array.from(this.skills.values())
      .filter(s =>
        s.name.toLowerCase().includes(lower) ||
        s.keywords.some(k => k.includes(lower)) ||
        s.description.toLowerCase().includes(lower)
      );
  }

  matchIntent(userMessage: string): Skill | null {
    // Usar IA para detectar intent y mapear a skill
    // Fallback: buscar por keywords
  }
}

export const SkillsRegistry = new SkillsRegistryImpl();
```

### 2.2 Ejemplo de Skill: TrackShipment

```typescript
// logistics/TrackShipment.skill.ts

export const TrackShipmentSkill: Skill = {
  id: 'track-shipment',
  name: 'Rastrear Envio',
  description: 'Consulta el estado actual de una guia',
  category: 'logistics',
  icon: Package,

  requiredParams: [
    { name: 'guideNumber', type: 'string', label: 'Numero de Guia' }
  ],

  roles: ['admin', 'operator', 'viewer'],

  keywords: ['rastrear', 'tracking', 'guia', 'envio', 'estado', 'donde esta'],

  examples: [
    'Rastrear guia 123456',
    'Donde esta el pedido 789?',
    'Estado de la guia ABC123'
  ],

  async execute(params, context) {
    const { guideNumber } = params;

    // Buscar en transportadoras
    const result = await TrackingService.track(guideNumber);

    if (!result) {
      return {
        success: false,
        message: `No se encontro la guia ${guideNumber}`,
        suggestedActions: [
          { label: 'Buscar en otra transportadora', skillId: 'search-all-carriers' },
          { label: 'Crear ticket', skillId: 'create-ticket' }
        ]
      };
    }

    return {
      success: true,
      message: `Guia ${guideNumber} encontrada`,
      data: result,
      artifact: {
        type: 'table',
        content: {
          title: `Tracking: ${guideNumber}`,
          columns: ['Campo', 'Valor'],
          rows: [
            ['Estado', result.status],
            ['Ubicacion', result.location],
            ['Ultima actualizacion', result.lastUpdate],
            ['Transportadora', result.carrier],
            ['Destino', result.destination]
          ]
        }
      },
      suggestedActions: [
        { label: 'Ver historial completo', skillId: 'shipment-history', params: { guideNumber } },
        { label: 'Crear ticket si hay problema', skillId: 'create-ticket', params: { guideNumber } },
        { label: 'Enviar WhatsApp al cliente', skillId: 'send-whatsapp', params: { guideNumber } }
      ]
    };
  }
};

// Registrar skill
SkillsRegistry.register(TrackShipmentSkill);
```

---

## FASE 3: Chat Interface (Semana 3-4)

### 3.1 Layout Principal

```
+--------------------------------------------------+
|  LITPER PRO - Admin Chat                    [?]  |
+--------------------------------------------------+
|          |                          |            |
|  Skills  |      Chat Area           | Artifact   |
|  Sidebar |                          | Viewer     |
|          |  [Messages]              |            |
|  [Cat]   |                          | [Table]    |
|  - Skill |  User: Rastrear 123      | [Chart]    |
|  - Skill |                          | [Form]     |
|          |  Assistant: Encontrado   |            |
|  [Cat]   |  [Artifact Preview]      |            |
|  - Skill |                          |            |
|          |  [Suggested Actions]     |            |
|          |                          |            |
|          |  +--------------------+  |            |
|          |  | Escribe mensaje... |  |            |
|          |  +--------------------+  |            |
+--------------------------------------------------+
```

### 3.2 ChatInterface.tsx (Estructura)

```typescript
export const ChatInterface: React.FC = () => {
  const { messages, sendMessage, isLoading } = useChat();
  const { currentArtifact, setArtifact } = useArtifacts();
  const { executeSkill } = useSkills();

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Sidebar de Skills */}
      <SkillsSidebar />

      {/* Area de Chat */}
      <div className="flex-1 flex flex-col">
        <MessageList messages={messages} />
        <SuggestedActions />
        <MessageInput onSend={sendMessage} disabled={isLoading} />
      </div>

      {/* Visor de Artifacts */}
      {currentArtifact && (
        <ArtifactViewer artifact={currentArtifact} />
      )}
    </div>
  );
};
```

---

## FASE 4: Integracion IA (Semana 4-5)

### 4.1 Proveedores IA

```typescript
// utils/aiProviders.ts

interface AIProvider {
  id: string;
  name: string;
  chat: (messages: Message[], context: any) => Promise<string>;
  detectIntent: (message: string, skills: Skill[]) => Promise<Skill | null>;
}

// Claude via MCP
export const ClaudeProvider: AIProvider = {
  id: 'claude',
  name: 'Claude (Anthropic)',
  async chat(messages, context) {
    // Usar MCP o API directa
  },
  async detectIntent(message, skills) {
    // Prompt para detectar skill
  }
};

// Gemini
export const GeminiProvider: AIProvider = {
  id: 'gemini',
  name: 'Gemini (Google)',
  async chat(messages, context) {
    // Usar @google/genai
  },
  async detectIntent(message, skills) {
    // Similar a Claude
  }
};
```

### 4.2 Flujo de Procesamiento

```
Usuario escribe mensaje
        |
        v
+------------------+
| Detectar Intent  | <-- IA analiza mensaje
+------------------+
        |
        v
+------------------+
| Seleccionar Skill| <-- SkillsRegistry.matchIntent()
+------------------+
        |
        v
+------------------+
| Extraer Params   | <-- Parser extrae parametros
+------------------+
        |
        v
+------------------+
| Ejecutar Skill   | <-- skill.execute(params)
+------------------+
        |
        v
+------------------+
| Generar Respuesta| <-- Formatear resultado + artifact
+------------------+
        |
        v
+------------------+
| Mostrar Artifact | <-- ArtifactViewer renderiza
+------------------+
```

---

## FASE 5: Skills Store (Semana 5-6)

### 5.1 UI de Skills Store

- Vista de cuadricula con cards de skills
- Filtros por categoria
- Busqueda por nombre/keyword
- Toggle para activar/desactivar skills
- Preview de skill antes de activar

### 5.2 Persistencia

```typescript
// Skills habilitadas por usuario
interface UserSkillConfig {
  userId: string;
  enabledSkills: string[];
  favorites: string[];
  customParams: Record<string, any>;
}
```

---

## FASE 6: Artifacts Avanzados (Semana 6-7)

### 6.1 Tipos de Artifacts

| Tipo | Descripcion | Componente |
|------|-------------|------------|
| table | Tabla de datos con sort/filter | TableArtifact |
| chart | Graficos (bar, line, pie) | ChartArtifact |
| form | Formulario interactivo | FormArtifact |
| pdf | Documento PDF | PDFArtifact |
| code | Codigo con syntax highlight | CodeArtifact |
| markdown | Texto formateado | MarkdownArtifact |

### 6.2 Interactividad

- Artifacts editables (formularios)
- Export a diferentes formatos
- Compartir artifact como link
- Historial de artifacts

---

## FASE 7: Projects & Memory (Semana 7-8)

### 7.1 Proyectos

```typescript
interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: Date;

  // Contexto persistente
  context: {
    filters: Record<string, any>;
    selectedCarriers: string[];
    dateRange: DateRange;
  };

  // Historial
  conversations: Conversation[];
  artifacts: Artifact[];

  // Automatizaciones
  scheduledTasks: ScheduledTask[];
}
```

### 7.2 Memoria Contextual

- El chat recuerda contexto del proyecto
- Referencias a conversaciones anteriores
- "Como lo hicimos la semana pasada..."

---

## FASE 8: Automatizaciones (Semana 8-9)

### 8.1 Scheduled Tasks

```typescript
// "Ejecutar reporte financiero todos los lunes a las 9am"

interface ScheduledTask {
  id: string;
  skillId: string;
  params: Record<string, any>;
  schedule: CronExpression;
  enabled: boolean;
  lastRun?: Date;
  nextRun: Date;
}
```

### 8.2 Triggers

- Por evento (nuevo envio, cambio de estado)
- Por tiempo (diario, semanal)
- Por condicion (si X entonces Y)

---

## FASE 9: Seguridad (Semana 9)

### 9.1 Autenticacion

- Reemplazar password hardcoded con JWT
- Roles: admin, operator, viewer
- Permisos por skill

### 9.2 Audit Log

```typescript
interface AuditEntry {
  timestamp: Date;
  userId: string;
  skillId: string;
  params: Record<string, any>;
  result: 'success' | 'error';
  ipAddress: string;
}
```

---

## FASE 10: Integraciones Externas (Semana 10)

### 10.1 MCP (Model Context Protocol)

- Conectar Claude directamente a datos
- Skills como herramientas MCP

### 10.2 N8N

- Webhooks para automatizaciones
- Conectar con otros sistemas

### 10.3 APIs Externas

- WhatsApp Business API
- Email (SendGrid)
- SMS
- Transportadoras (Coordinadora, Interrapidisimo, etc.)

---

## Lista de 40 Skills por Categoria

### Logistics (12)
1. TrackShipment - Rastrear envio
2. BulkStatusUpdate - Actualizar estados masivo
3. GenerateReport - Generar reporte
4. AnalyzeCarrier - Analizar transportadora
5. PredictDelivery - Predecir entrega
6. CreateTicket - Crear ticket
7. ManageReturns - Gestionar devoluciones
8. OptimizeRoute - Optimizar ruta
9. AlertConfig - Configurar alertas
10. ExportData - Exportar datos
11. ImportGuides - Importar guias
12. CarrierComparison - Comparar transportadoras

### Finance (10)
1. FinancialReport - Reporte financiero
2. InvoiceAnalysis - Analisis de facturas
3. ProfitCalculation - Calculo de ganancias
4. ExpenseTracking - Seguimiento de gastos
5. CarrierCosts - Costos por transportadora
6. RefundManagement - Gestion de reembolsos
7. BudgetPlanning - Planificacion presupuesto
8. CashFlow - Flujo de caja
9. TaxCalculation - Calculo impuestos
10. FinancialForecast - Pronostico financiero

### Analytics (8)
1. DashboardMetrics - Metricas del dashboard
2. TrendAnalysis - Analisis de tendencias
3. PerformanceReport - Reporte de desempeno
4. CustomerInsights - Insights de clientes
5. SeasonalPatterns - Patrones estacionales
6. AnomalyDetection - Deteccion de anomalias
7. BenchmarkAnalysis - Analisis comparativo
8. CustomReport - Reporte personalizado

### Automation (6)
1. ScheduleTask - Programar tarea
2. TriggerWorkflow - Disparar workflow
3. BatchProcess - Proceso por lotes
4. AutoNotify - Notificacion automatica
5. DataSync - Sincronizar datos
6. CleanupTask - Tarea de limpieza

### Communication (4)
1. SendWhatsApp - Enviar WhatsApp
2. EmailTemplate - Plantilla de email
3. SMSNotification - Notificacion SMS
4. BulkMessage - Mensaje masivo

---

## Orden de Implementacion

### Sprint 1 (Semana 1-2)
- [ ] Crear estructura de archivos base
- [ ] Implementar tipos TypeScript
- [ ] Crear SkillsRegistry
- [ ] Crear ChatInterface basico
- [ ] Implementar 3 skills de prueba

### Sprint 2 (Semana 3-4)
- [ ] Completar MessageList y MessageInput
- [ ] Implementar ArtifactViewer basico
- [ ] Agregar TableArtifact y ChartArtifact
- [ ] Implementar 5 skills de logistics

### Sprint 3 (Semana 5-6)
- [ ] Crear SkillsSidebar
- [ ] Implementar SkillStore
- [ ] Agregar busqueda de skills
- [ ] Implementar 5 skills de finance

### Sprint 4 (Semana 7-8)
- [ ] Sistema de Projects
- [ ] Memoria contextual
- [ ] Implementar remaining skills
- [ ] Integracion con IA (Claude/Gemini)

### Sprint 5 (Semana 9-10)
- [ ] Seguridad y autenticacion
- [ ] Audit logs
- [ ] Integraciones externas
- [ ] Testing y documentacion

---

## Metricas de Exito

- [ ] Reducir lineas de codigo de 1,590 a ~800 por componente
- [ ] 40 skills funcionando
- [ ] Tiempo de respuesta < 2s para cualquier skill
- [ ] 0 passwords hardcoded
- [ ] 100% de acciones auditadas
- [ ] Chat entiende 80%+ de intents correctamente

---

## Notas Tecnicas

- Usar Zustand para estado global
- Lazy loading de skills
- Service workers para cache
- WebSockets para updates en tiempo real
- IndexedDB para persistencia local
