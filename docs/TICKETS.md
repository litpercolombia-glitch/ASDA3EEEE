# Ticket System - PR #5

## Overview

The ticket system creates tickets **ONLY** for real failures and critical situations. It does not require human intervention for normal operations.

**Key principle**: If the system can't automatically fix something, create a ticket.

## When Tickets Are Created

### Automatic Triggers

| Trigger | Condition | Priority |
|---------|-----------|----------|
| `FAILED_4XX` | WhatsApp send failed with 4xx (invalid phone, etc.) | alta |
| `FAILED_5XX_RETRIES` | WhatsApp failed 5xx after 2+ retries | media/alta |
| `NO_MOVEMENT_AFTER_CONTACT` | No movement 48h after successful WhatsApp | media |
| `AT_OFFICE_STILL` | Still at office 48h after successful contact | alta |

### When Tickets Are NOT Created

- Successful message sends
- First/second 5xx retry (will retry automatically)
- Duplicates (if OPEN ticket exists for same guia+trigger)
- Rate limit skips (expected behavior)

## Ticket Lifecycle

```
OPEN → IN_PROGRESS → RESOLVED → CLOSED
```

- **OPEN**: New ticket, needs attention
- **IN_PROGRESS**: Someone is working on it
- **RESOLVED**: Issue fixed, awaiting confirmation
- **CLOSED**: Done, no further action needed

## Data Model

### Ticket Fields

```typescript
{
  ticketId: string;      // "tkt_abc123"
  guia: string;          // numero_de_guia
  trigger: TicketTrigger;
  priority: 'alta' | 'media';
  status: TicketStatus;

  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  closedAt?: Date;

  // NO PII - only these fields
  metadata: {
    ciudad_de_destino?: string;
    transportadora?: string;
    estatus?: string;
    novedad?: string;
    ultimo_movimiento?: string;
    fecha_de_ultimo_movimiento?: string;
    failureCode?: number;
    failureReason?: string;
    retryCount?: number;
    phoneHash?: string;  // NEVER clear phone
  };

  actionRefs: string[];  // Related ActionLog IDs
  eventRefs: string[];   // Related EventLog IDs
  timeline: TimelineEntry[];
  resolutionNotes?: string;
}
```

### Allowed Fields (NO PII)

These are the ONLY logistics fields that can be stored:

- `fecha`
- `telefono` (hash only, as `phoneHash`)
- `numero_de_guia`
- `estatus`
- `ciudad_de_destino`
- `transportadora`
- `novedad`
- `fecha_de_ultimo_movimiento`
- `ultimo_movimiento`
- `fecha_de_generacion_de_guia`

**NEVER store clear phone numbers. Only `phoneHash`.**

## Idempotency

Only **ONE OPEN ticket** can exist per `guia + trigger` combination.

If a second failure occurs for the same guia+trigger:
1. No new ticket is created
2. Timeline entry is added to existing ticket
3. New actionRefs/eventRefs are merged

This prevents ticket spam during outages.

## API Endpoints

### List Tickets

```bash
GET /api/admin/tickets?status=OPEN&limit=50

# Headers
Authorization: Bearer $CRON_SECRET
```

**Query Parameters:**
- `status`: OPEN | IN_PROGRESS | RESOLVED | CLOSED
- `trigger`: FAILED_4XX | FAILED_5XX_RETRIES | NO_MOVEMENT_AFTER_CONTACT | AT_OFFICE_STILL
- `priority`: alta | media
- `limit`: number (default 50, max 100)
- `offset`: number (default 0)

**Response:**
```json
{
  "timestamp": "2024-12-29T12:00:00.000Z",
  "stats": {
    "total": 15,
    "openCount": 5,
    "byStatus": { "OPEN": 5, "IN_PROGRESS": 2, "RESOLVED": 3, "CLOSED": 5 },
    "byTrigger": { "FAILED_4XX": 8, "FAILED_5XX_RETRIES": 4, ... },
    "byPriority": { "alta": 6, "media": 9 }
  },
  "count": 5,
  "tickets": [...]
}
```

### Get Single Ticket

```bash
GET /api/admin/tickets/:ticketId

# Headers
Authorization: Bearer $CRON_SECRET
```

### Update Ticket

```bash
PATCH /api/admin/tickets/:ticketId
Content-Type: application/json
Authorization: Bearer $CRON_SECRET

{
  "status": "IN_PROGRESS",
  "resolutionNotes": "Investigating phone number issue"
}
```

**Allowed updates:**
- `status`: New status (must follow valid transitions)
- `priority`: "alta" | "media"
- `resolutionNotes`: Free text (NO PII!)

**Status Transitions:**
- OPEN → IN_PROGRESS ✓
- IN_PROGRESS → RESOLVED ✓
- RESOLVED → CLOSED ✓
- RESOLVED → IN_PROGRESS ✓ (reopen)
- CLOSED → anything ✗ (cannot reopen)

## Integration with Executor

When the ActionExecutor encounters a failure:

```typescript
import { TicketRules } from '../services/tickets';

// In executor failure handler:
if (result.status === 'FAILED') {
  const ticket = TicketRules.processFailedAction(
    actionLog,
    result.httpCode,
    result.errorMessage
  );

  if (ticket) {
    console.log(`Ticket created: ${ticket.ticketId}`);
  }
}
```

## Checking for Stuck Shipments

Run periodically (e.g., every hour):

```typescript
import { TicketRules } from '../services/tickets';

const tickets = await TicketRules.checkStuckShipments(
  async () => {
    // Return successful contacts from last 7 days
    return ActionLogService.getSuccessfulWhatsappContacts(7);
  },
  async (guia) => {
    // Return latest movement for guia
    return EventLogService.getLatestMovement(guia);
  }
);

console.log(`Created ${tickets.length} tickets for stuck shipments`);
```

## Timeline / Audit Trail

Every ticket has a timeline showing what was attempted:

```json
{
  "timeline": [
    {
      "timestamp": "2024-12-29T10:00:00.000Z",
      "action": "TICKET_CREATED",
      "actor": "system",
      "details": { "trigger": "FAILED_4XX", "priority": "alta" }
    },
    {
      "timestamp": "2024-12-29T10:05:00.000Z",
      "action": "DUPLICATE_TRIGGER_RECEIVED",
      "actor": "system",
      "details": { "newActionRefs": ["act_456"] }
    },
    {
      "timestamp": "2024-12-29T11:00:00.000Z",
      "action": "ADMIN_UPDATE",
      "actor": "user",
      "details": { "updates": ["status"] }
    }
  ]
}
```

## PII Protection

The ticket system **NEVER stores PII**:

1. Phone numbers are hashed before storage (`phoneHash`)
2. Error messages are sanitized to remove phone patterns
3. Resolution notes are validated for phone patterns (rejected if found)
4. All metadata fields are sanitized on creation

## Testing

```bash
npm test -- tests/tickets.test.ts
```

Key test scenarios:
- ✓ Ticket created for FAILED_4xx
- ✓ Ticket created for 5xx after retries
- ✓ No duplicate if OPEN exists
- ✓ Ticket for "still stuck after contact"
- ✓ PII sanitization
- ✓ Full lifecycle (OPEN → CLOSED)

## Metrics

Track ticket metrics via the admin endpoint:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://your-app.vercel.app/api/admin/tickets | jq '.stats'
```

Key metrics:
- `openCount`: Current open tickets
- `byTrigger`: Which failure types are most common
- `avgResolutionTimeMs`: How fast tickets are resolved

## Next Steps (PR #6)

After tickets are working, add scoring:
- Low/Medium/High priority based on:
  - Hours/days without movement
  - Canonical status
  - Novedad presence
  - City/carrier patterns

This enables queue prioritization and resource allocation.
