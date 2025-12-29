# EventLog Module - PR #2

## Cómo Auditar una Guía

Este módulo permite auditar el historial completo de eventos de cualquier guía.

### 1. Obtener todos los eventos de una guía

```typescript
import { EventLogService } from './services/eventLog';

// Obtener timeline completo de eventos (ordenado por fecha)
const events = EventLogService.getEventsForGuide('GUIA123456');

for (const event of events) {
  console.log(`
    Fecha: ${event.occurredAt}
    Estado: ${event.canonicalStatus} (raw: ${event.rawStatus})
    Fuente: ${event.source}
    Ciudad: ${event.city}
    Transportadora: ${event.carrier}
    Fuera de orden: ${event.isOutOfOrder ? 'SÍ' : 'NO'}
    Novedad: ${event.novelty || 'N/A'}
  `);
}
```

### 2. Obtener el estado actual consolidado

```typescript
const state = EventLogService.getGuideState('GUIA123456');

if (state) {
  console.log(`
    Estado actual: ${state.currentStatus}
    Razón (si aplica): ${state.currentReason || 'N/A'}
    Total eventos: ${state.eventCount}
    Duplicados bloqueados: ${state.duplicateCount}
    Eventos fuera de orden: ${state.outOfOrderCount}
    Primera vez visto: ${state.firstSeenAt}
    Última actualización: ${state.updatedAt}
  `);
}
```

### 3. Verificar duplicados

El sistema automáticamente detecta y bloquea duplicados usando `payloadHash`:

```typescript
import { generatePayloadHash, buildEventKey } from './services/eventLog';

// Ver si un evento específico ya existe
const payloadHash = await generatePayloadHash(dropiData);
const eventKey = buildEventKey('excel_dropi', dropiData.numero_de_guia, payloadHash);
const exists = EventLogService.hasEventKey(eventKey);
```

### 4. Revisar eventos fuera de orden

Los eventos fuera de orden se marcan pero **NO degradan** el estado actual:

```typescript
const events = EventLogService.getEventsForGuide('GUIA123456');
const outOfOrder = events.filter(e => e.isOutOfOrder);

console.log(`Eventos fuera de orden: ${outOfOrder.length}`);
for (const event of outOfOrder) {
  console.log(`  - ${event.occurredAt}: ${event.rawStatus}`);
}
```

### 5. Estadísticas globales

```typescript
const stats = EventLogService.getStats();

console.log(`
  Total eventos: ${stats.totalEvents}
  Total guías: ${stats.totalGuides}
  Duplicados bloqueados: ${stats.duplicatesBlocked}
  Eventos fuera de orden: ${stats.outOfOrderEvents}

  Por estado:
  ${Object.entries(stats.byStatus).map(([s, c]) => `  - ${s}: ${c}`).join('\n')}
`);
```

## Arquitectura

```
EventLog (Eventos)
    │
    ├── id: string              # Identificador único
    ├── guia: string            # Número de guía
    ├── source: EventSource     # 'dropi_webhook' | 'excel_dropi' | 'manual'
    ├── canonicalStatus         # Estado normalizado (StatusNormalizer)
    ├── rawStatus               # Estado original sin procesar
    ├── payloadHash             # Hash para deduplicación
    ├── phoneHash               # Hash del teléfono (privacidad)
    ├── isOutOfOrder            # ¿Llegó fuera de orden temporal?
    └── occurredAt              # Cuándo ocurrió el evento

GuideState (Estado consolidado)
    │
    ├── guia: string
    ├── currentStatus           # Estado ACTUAL (más reciente)
    ├── lastEventAt             # Fecha del último evento válido
    ├── eventCount              # Total de eventos procesados
    ├── duplicateCount          # Duplicados bloqueados
    └── outOfOrderCount         # Eventos fuera de orden

ActionLog (Acciones planificadas)
    │
    ├── id: string
    ├── actionType              # 'SEND_WHATSAPP' | 'CREATE_TICKET' | etc.
    ├── guia: string
    ├── idempotencyKey          # Clave para evitar duplicados
    ├── status                  # 'PLANNED' | 'SUCCESS' | 'FAILED'
    └── metadata                # Contexto adicional
```

## Flujo de Datos

```
Excel Dropi → ExcelDropiParser → EventLogService → GuideState
     │                                   │
     │                                   ├── Dedupe por payloadHash
     │                                   ├── StatusNormalizer
     │                                   └── Out-of-order detection
     │
     └── ActionLogService (preparado para automatización)
```

## Tests

```bash
npm test tests/eventLog.test.ts
```

Cobertura:
- ✅ Hash utilities (sha256, normalizePhone, generatePhoneHash)
- ✅ Parseo Excel con columnas exactas
- ✅ StatusNormalizer aplicado a estatus
- ✅ payloadHash estable
- ✅ Dedupe por payloadHash
- ✅ Eventos fuera de orden no degradan estado
- ✅ phoneHash generado (no se guarda teléfono)
- ✅ ActionLog con idempotency
