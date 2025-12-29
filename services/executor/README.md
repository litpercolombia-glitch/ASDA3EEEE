# ActionExecutor - PR #4

## Ejecución de WhatsApp vía Chatea

Este módulo ejecuta las acciones creadas por ProtocolEngine (PR #3).

```
ActionLog (PLANNED) → ActionExecutor → Chatea API → ActionLog (SUCCESS/FAILED)
```

---

## Configuración (Environment Variables)

```bash
# Master switch - DEBE ser true para enviar mensajes reales
EXECUTOR_ENABLED=false  # Default: false (seguro)

# Filtros de piloto (opcional)
PILOT_CITY=Bogotá       # Solo enviar a esta ciudad
PILOT_CARRIER=Coordinadora  # Solo enviar con esta transportadora

# Rate limits
RATE_LIMIT_PER_MINUTE=20    # Mensajes por minuto (global)
RATE_LIMIT_PER_PHONE_DAY=2  # Max mensajes por teléfono por día
DAILY_SEND_LIMIT=100        # Límite diario total (seguridad)

# Retries
MAX_RETRIES=3  # Solo para errores 5xx

# Chatea API
CHATEA_API_URL=https://api.chatea.io/v1
CHATEA_API_KEY=sk_live_xxxxx
```

---

## Cómo Habilitar el Piloto

### Paso 1: Validar con Dry Run

```typescript
import { DryRunSimulator } from './services/protocol';

// Ver qué se enviaría
const report = DryRunSimulator.runSimulation();
console.log(DryRunSimulator.formatReport(report));
```

### Paso 2: Configurar Piloto (una ciudad)

```bash
EXECUTOR_ENABLED=true
PILOT_CITY=Bogotá
DAILY_SEND_LIMIT=50  # Empezar bajo
```

### Paso 3: Ejecutar

```typescript
import { ActionExecutor } from './services/executor';

// Ejecutar acciones PLANNED
const result = await ActionExecutor.executePlanned();

console.log(`
  Enviados: ${result.success}
  Fallidos: ${result.failed}
  Rate limited: ${result.skippedRateLimit}
  Restante hoy: ${result.remainingDailyLimit}
`);
```

### Paso 4: Escalar Gradualmente

| Día | DAILY_SEND_LIMIT | Observar |
|-----|------------------|----------|
| 1   | 50               | Errores, quejas |
| 2   | 100              | Tasa de éxito |
| 3   | 250              | Duplicados |
| 4+  | 500+             | Escalar si OK |

---

## Pipeline de Ejecución

```
1. Query ActionLog (status=PLANNED)
   ↓
2. Por cada action:
   ├── ¿Executor enabled? → NO → WOULD_SEND
   ├── ¿Pasa filtro piloto? → NO → SKIPPED_DISABLED
   ├── ¿Ya ejecutado hoy? → SÍ → SKIPPED_DUPLICATE
   ├── ¿Teléfono disponible? → NO → FAILED (INVALID_PHONE)
   ├── ¿Rate limit OK? → NO → SKIPPED_RATE_LIMIT
   ↓
3. Marcar RUNNING
   ↓
4. Enviar vía Chatea
   ├── OK → SUCCESS + providerMessageId
   ├── 4xx → FAILED (no retry)
   └── 5xx → Retry (backoff 1m, 5m, 15m)
```

---

## Límites Anti-Spam

| Tipo | Límite | Qué pasa si excede |
|------|--------|---------------------|
| Global/minuto | 20 | Espera al siguiente minuto |
| Por teléfono/día | 2 | SKIPPED_RATE_LIMIT |
| Por guía+trigger/día | 1 | SKIPPED_DUPLICATE |
| Total/día | 100 | Detiene ejecución |

---

## Auditoría de una Guía

```typescript
import { EventLogService } from './services/eventLog';
import { ActionLogService } from './services/eventLog';

const guia = 'GUIA123456';

// 1. Ver todos los eventos
const events = EventLogService.getEventsForGuide(guia);
console.log('Eventos:', events);

// 2. Ver todas las acciones
const actions = ActionLogService.getActionsForGuide(guia);
console.log('Acciones:', actions);

// 3. Ver acción con providerMessageId
for (const action of actions) {
  if (action.status === 'SUCCESS') {
    console.log(`
      Enviado: ${action.executedAt}
      Provider ID: ${action.metadata.result?.providerMessageId}
      Template: ${action.metadata.result?.template}
    `);
  }
}
```

---

## Templates Disponibles

### no_movement_48h

```
🚚 Actualización de tu envío

Tu pedido con guía *{{numero_de_guia}}* no ha tenido movimiento
en las últimas 48 horas.

📦 Transportadora: {{transportadora}}
📍 Último estado: {{ultimo_movimiento}}
📅 Última actualización: {{fecha_de_ultimo_movimiento}}

Estamos haciendo seguimiento para que tu pedido llegue pronto.
```

### at_office_3d

```
📬 Tu pedido te está esperando

Tu pedido con guía *{{numero_de_guia}}* está disponible para
recogida en la oficina de {{transportadora}} en {{ciudad_de_destino}}.

⚠️ Lleva más de 3 días esperándote.

Por favor, recógelo lo antes posible para evitar devolución.
```

---

## Privacidad

**⚠️ IMPORTANTE: El teléfono NUNCA se guarda en logs**

- `EventLog.phoneHash` → SHA256 del teléfono normalizado
- `ActionLog` → Solo contiene `phoneHash` en metadata
- `ExecutionResult` → No contiene teléfono
- Errores → Se sanitizan para remover patrones de teléfono

```typescript
// El teléfono solo existe en runtime durante el envío
const phone = await phoneLookup(guia);  // Se obtiene
await ChateaService.sendMessage(phone, ...);  // Se usa
// phone sale de scope, nunca se guarda
```

---

## Monitoreo

### Estadísticas en tiempo real

```typescript
const stats = ActionExecutor.getStats();

console.log(`
  Rate Limiter:
    Enviados hoy: ${stats.rateLimiter.totalToday}
    Restante hoy: ${stats.rateLimiter.remainingToday}
    Este minuto: ${stats.rateLimiter.currentMinuteCount}
    Teléfonos únicos: ${stats.rateLimiter.uniquePhonesContactedToday}

  Cola de retry: ${stats.retryQueueSize}
`);
```

### Estadísticas de ActionLog

```typescript
const actionStats = ActionLogService.getStats();

console.log(`
  Total acciones: ${actionStats.total}
  PLANNED: ${actionStats.byStatus.PLANNED || 0}
  SUCCESS: ${actionStats.byStatus.SUCCESS || 0}
  FAILED: ${actionStats.byStatus.FAILED || 0}
  SKIPPED_RATE_LIMIT: ${actionStats.byStatus.SKIPPED_RATE_LIMIT || 0}
`);
```

---

## Troubleshooting

### Error: "Phone lookup not configured"

```typescript
// Debes configurar cómo obtener teléfonos
ActionExecutor.setPhoneLookup(async (guia) => {
  const data = await getGuiaFromDatabase(guia);
  return data?.telefono || null;
});
```

### Error: "Rate limit: DAILY_LIMIT"

El límite diario se alcanzó. Espera hasta mañana o incrementa `DAILY_SEND_LIMIT`.

### Error: "Not in pilot filter"

La guía pertenece a una ciudad/transportadora fuera del piloto. Actualiza `PILOT_CITY` o `PILOT_CARRIER`.

### Muchos FAILED

Revisa:
1. ¿`CHATEA_API_URL` y `CHATEA_API_KEY` están configurados?
2. ¿Los templates existen en Chatea?
3. ¿El formato del teléfono es correcto?

---

## Tests

```bash
npm test tests/executor.test.ts
```

Cobertura:
- ✅ PLANNED → SUCCESS flow
- ✅ Idempotency (no duplicados mismo día)
- ✅ Rate limit por phoneHash
- ✅ 4xx no reintenta
- ✅ 5xx reintenta con backoff
- ✅ Teléfono nunca en logs
