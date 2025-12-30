# Plan de Mejoras - AdminPanelV2

## Estado Actual
- ✅ 9 skills implementadas
- ✅ ChatInterface funcional
- ✅ SkillsRegistry con detección de intents
- ✅ Artifacts tipo tabla
- ⏳ 31 skills pendientes

---

## FASE INMEDIATA (Esta Semana)

### 1. Integración con APIs Reales
**Prioridad: ALTA**

Actualmente las skills usan datos simulados. Conectar con:

```typescript
// Ejemplo: TrackShipment real
import { trackingAgentService } from '@/services/trackingAgentService';

async execute(params) {
  const result = await trackingAgentService.rastrearGuia(
    params.guideNumber,
    params.carrier,
    Pais.COLOMBIA
  );
  // ...
}
```

**Archivos a modificar:**
- `skills/logistics/TrackShipment.skill.ts` → `trackingAgentService`
- `skills/finance/FinancialReport.skill.ts` → `financeServiceEnterprise`
- `skills/logistics/AnalyzeCarrier.skill.ts` → `logisticsService`

### 2. Autenticación JWT
**Prioridad: ALTA**

Reemplazar password hardcoded:

```typescript
// Nuevo: authService.ts
export const authService = {
  login: async (password: string) => {
    const response = await fetch('/api/admin/auth', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    const { token } = await response.json();
    localStorage.setItem('admin_token', token);
    return token;
  },

  verifyToken: async (token: string) => {
    // Verificar con backend
  }
};
```

### 3. ChartArtifact
**Prioridad: MEDIA**

Para mostrar gráficos en respuestas:

```typescript
// artifacts/ChartArtifact.tsx
interface ChartArtifactProps {
  type: 'bar' | 'line' | 'pie';
  data: ChartData;
}

// Usar recharts o chart.js
```

---

## FASE CORTO PLAZO (2 Semanas)

### 4. Skills de Finanzas Completas (9 restantes)

| Skill | Función |
|-------|---------|
| InvoiceAnalysis | Análisis de facturas |
| ProfitCalculation | Cálculo de ganancias por pedido |
| ExpenseTracking | Seguimiento de gastos |
| CarrierCosts | Costos por transportadora |
| RefundManagement | Gestión de reembolsos |
| BudgetPlanning | Planificación de presupuesto |
| CashFlow | Flujo de caja |
| TaxCalculation | Cálculo de impuestos |
| FinancialForecast | Pronóstico financiero |

### 5. Skills de Analytics Completas (7 restantes)

| Skill | Función |
|-------|---------|
| TrendAnalysis | Análisis de tendencias |
| PerformanceReport | Reporte de desempeño |
| CustomerInsights | Insights de clientes |
| SeasonalPatterns | Patrones estacionales |
| AnomalyDetection | Detección de anomalías |
| BenchmarkAnalysis | Análisis comparativo |
| CustomReport | Reportes personalizados |

### 6. Skills de Logística Restantes (7 más)

| Skill | Función |
|-------|---------|
| PredictDelivery | Predecir fecha de entrega |
| ManageReturns | Gestionar devoluciones |
| OptimizeRoute | Optimizar rutas |
| AlertConfig | Configurar alertas |
| ExportData | Exportar a Excel/CSV |
| ImportGuides | Importar guías masivamente |
| CarrierComparison | Comparar costos transportadoras |

---

## FASE MEDIANO PLAZO (1 Mes)

### 7. Sistema de Proyectos
**Memoria persistente por proyecto**

```typescript
interface Project {
  id: string;
  name: string;
  conversations: Conversation[];
  savedFilters: Filter[];
  scheduledReports: ScheduledTask[];
}
```

Beneficios:
- Guardar contexto entre sesiones
- Filtros predefinidos por cliente
- Reportes automáticos por proyecto

### 8. Integración IA Real

```typescript
// utils/aiProviders.ts

// Claude via API
const claudeProvider = {
  async detectIntent(message: string, skills: Skill[]) {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      messages: [{
        role: 'user',
        content: `Dado este mensaje del usuario: "${message}"
                  Y estas skills disponibles: ${skills.map(s => s.name).join(', ')}
                  ¿Cuál skill debe ejecutarse? Responde solo el ID.`
      }]
    });
    return response.content[0].text;
  }
};
```

### 9. MCP (Model Context Protocol)

Conectar Claude directamente a los datos:

```typescript
// mcp/tools/tracking.ts
export const trackingTool = {
  name: 'track_shipment',
  description: 'Rastrea una guía de envío',
  inputSchema: {
    type: 'object',
    properties: {
      guideNumber: { type: 'string' }
    }
  },
  execute: async (input) => {
    return await trackingAgentService.rastrearGuia(input.guideNumber);
  }
};
```

---

## FASE LARGO PLAZO (2-3 Meses)

### 10. Skills Store UI

```
+------------------------------------------+
|  🏪 Skills Store                    [x]  |
+------------------------------------------+
| [Buscar skills...]                       |
|                                          |
| 📦 Logística (12)        ✅ Instaladas   |
| ├─ TrackShipment         [Activa]        |
| ├─ GenerateReport        [Activa]        |
| └─ PredictDelivery       [Instalar]      |
|                                          |
| 💰 Finanzas (10)                         |
| ├─ FinancialReport       [Activa]        |
| └─ CashFlow              [Instalar]      |
+------------------------------------------+
```

### 11. Automatizaciones Avanzadas

```typescript
// N8N Integration
interface Workflow {
  trigger: 'shipment_delayed' | 'return_created' | 'goal_reached';
  conditions: Condition[];
  actions: Action[];
}

// Ejemplo: Si envío retrasado > 3 días → WhatsApp + Ticket
```

### 12. Dashboard Visual

Además del chat, un dashboard con:
- Widgets arrastrables
- Gráficos en tiempo real
- Alertas visuales
- Mapa de envíos

---

## MEJORAS DE UX

### 13. Sugerencias Inteligentes

El chat sugiere acciones basado en:
- Hora del día (9am → "Quieres ver el reporte de ayer?")
- Patrones de uso (si siempre rastreas guías → mostrar input directo)
- Anomalías detectadas ("Hay 15 envíos con retraso, quieres verlos?")

### 14. Comandos Rápidos

```
/track 123456          → Rastrear guía
/report today          → Reporte de hoy
/compare carriers      → Comparar transportadoras
/schedule daily 9am    → Programar tarea
```

### 15. Shortcuts de Teclado

- `Ctrl+K` → Abrir búsqueda de skills
- `Ctrl+Enter` → Ejecutar última skill de nuevo
- `Esc` → Cerrar artifact
- `↑` → Mensaje anterior

---

## SEGURIDAD

### 16. Audit Log Completo

```typescript
// Cada acción se registra
{
  timestamp: Date,
  userId: string,
  skillId: string,
  params: Record<string, any>,
  result: 'success' | 'error',
  duration: number,
  ipAddress: string
}
```

### 17. Roles y Permisos

| Rol | Skills Disponibles |
|-----|-------------------|
| Admin | Todas |
| Operator | Logística + Comunicación |
| Viewer | Solo lectura (reportes) |

### 18. Rate Limiting

Evitar abuso:
- Máx 100 requests/minuto por usuario
- Máx 10 WhatsApp/hora
- Alertas si se supera

---

## PRIORIDADES RECOMENDADAS

### Sprint 1 (Esta semana)
1. ⭐ Conectar TrackShipment con API real
2. ⭐ Implementar JWT auth
3. Agregar 3 skills más de finanzas

### Sprint 2 (Próxima semana)
1. ChartArtifact para gráficos
2. 5 skills más de analytics
3. ExportData skill (Excel)

### Sprint 3 (Semana 3)
1. Sistema de proyectos básico
2. Comandos rápidos (/track, /report)
3. 5 skills más de logística

### Sprint 4 (Semana 4)
1. Integración Claude para intents
2. Sugerencias inteligentes
3. Completar 40 skills

---

## MÉTRICAS DE ÉXITO

- [ ] 40 skills funcionando
- [ ] < 2s tiempo de respuesta
- [ ] 80%+ intents detectados correctamente
- [ ] 0 passwords hardcoded
- [ ] 100% acciones auditadas
- [ ] Reducir código de 1,590 a ~800 líneas por componente
