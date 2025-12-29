# ProtocolEngine - PR #3

## Cómo se Decide una Acción

El ProtocolEngine **decide qué hacer**, pero **NO ejecuta**.

```
EventLog → GuideState → ProtocolEngine → ActionPlan → ActionLog
                              ↓
                         (no ejecuta)
```

### Flujo de Decisión

```
1. Obtener GuideState
   ↓
2. ¿Es estado terminal? (DELIVERED, RETURNED, CANCELLED)
   → SÍ: SKIP
   ↓ NO
3. ¿Último evento fue out-of-order?
   → SÍ: SKIP
   ↓ NO
4. Evaluar cada protocolo activo
   ↓
5. Si match → Crear ActionPlan
   ↓
6. ¿Ya existe ActionPlan hoy? (idempotencia)
   → SÍ: SKIP
   ↓ NO
7. Registrar en ActionLog como PLANNED
```

---

## Protocolos Activos

### Protocolo A: NO_MOVEMENT_48H

**Condición:**
- `fecha_de_ultimo_movimiento` > 48 horas
- `estatus` ≠ DELIVERED
- `novedad` vacía o no resuelta

**Decisión:**
```typescript
{
  type: 'SEND_WHATSAPP',
  reason: 'sin_movimiento',
  priority: 'media'
}
```

### Protocolo B: AT_OFFICE_3D

**Condición:**
- `estatus` == AT_OFFICE
- `fecha_de_ultimo_movimiento` > 72 horas

**Decisión:**
```typescript
{
  type: 'SEND_WHATSAPP',
  reason: 'en_oficina_prolongado',
  priority: 'alta'
}
```

---

## Uso

### Evaluar una guía

```typescript
import { ProtocolEngine } from './services/protocol';

const result = ProtocolEngine.evaluateGuide('GUIA123456');

console.log(`Evaluada: ${result.evaluated}`);
console.log(`Protocolos matcheados: ${result.matchedProtocols}`);
console.log(`ActionPlans creados: ${result.actionPlans.length}`);
```

### Evaluar todas las guías

```typescript
const result = ProtocolEngine.evaluateAllGuides();

console.log(`
  Total guías: ${result.totalGuides}
  Evaluadas: ${result.evaluated}
  Saltadas: ${result.skipped}
  ActionPlans creados: ${result.actionPlansCreated}
  Duración: ${result.durationMs}ms
`);
```

### Verificar idempotencia

```typescript
// ¿Ya se creó ActionPlan hoy para esta guía y trigger?
const exists = ProtocolEngine.hasActionPlanToday('GUIA123', 'NO_MOVEMENT_48H');
```

---

## Idempotencia

Cada ActionPlan tiene una clave única:

```
action:{guia}:{trigger}:{fecha}
```

Ejemplo:
```
action:GUIA123456:NO_MOVEMENT_48H:2024-01-15
```

**Regla:** Solo UN ActionPlan por guía + trigger + día.

---

## ActionPlan Output

```typescript
interface ActionPlan {
  guia: string;                    // Número de guía
  trigger: ProtocolTrigger;        // 'NO_MOVEMENT_48H' | 'AT_OFFICE_3D'
  actions: PlannedAction[];        // Lista de acciones
  evaluatedAt: Date;               // Cuándo se evaluó
  guideState: {                    // Estado al momento de evaluar
    currentStatus: CanonicalStatus;
    lastEventAt: Date;
    city: string;
    carrier: string;
  };
}

interface PlannedAction {
  type: ActionType;                // 'SEND_WHATSAPP' | 'CREATE_TICKET'
  reason: string;                  // 'sin_movimiento' | 'en_oficina_prolongado'
  priority: ActionPriority;        // 'baja' | 'media' | 'alta' | 'critica'
  metadata?: {
    city?: string;
    carrier?: string;
    daysSinceMovement?: number;
  };
}
```

---

## Agregar Nuevo Protocolo

1. Crear archivo en `services/protocol/protocols/`
2. Implementar interfaz `Protocol`
3. Agregar a `ACTIVE_PROTOCOLS` en `ProtocolEngine.ts`
4. Agregar tests

```typescript
// services/protocol/protocols/NewProtocol.ts
import { Protocol } from '../../../types/protocol.types';

export const NewProtocol: Protocol = {
  id: 'NEW_PROTOCOL',
  name: 'Mi Nuevo Protocolo',
  description: 'Descripción...',

  evaluate(input, now) {
    // Retornar true si condiciones se cumplen
    return false;
  },

  generateActions(input) {
    return [
      {
        type: 'SEND_WHATSAPP',
        reason: 'mi_razon',
        priority: 'media',
      },
    ];
  },
};
```

---

## Tests

```bash
npm test tests/protocol.test.ts
```

Cobertura:
- ✅ Dispara protocolo correcto con datos reales
- ✅ NO dispara si guía ya está DELIVERED
- ✅ NO dispara si evento es out-of-order
- ✅ NO duplica ActionPlan el mismo día
- ✅ Permite ActionPlan en día diferente
- ✅ Integración con ActionLog
