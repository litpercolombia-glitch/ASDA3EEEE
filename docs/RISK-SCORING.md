# Risk Scoring System - PR #6

## Overview

Simple risk scoring (0-100) to prioritize shipments. Uses ONLY these logistics fields:

- `estatus` (canonical)
- `ciudad_de_destino`
- `transportadora`
- `novedad`
- `fecha_de_ultimo_movimiento`

## Score Breakdown (0-100)

### A) Time Without Movement (max 50 pts)

| Condition | Points | Reason Code |
|-----------|--------|-------------|
| >= 120h (5 días) | +50 | `120h_no_movement` |
| >= 72h (3 días) | +35 | `72h_no_movement` |
| >= 48h (2 días) | +25 | `48h_no_movement` |
| >= 24h (1 día) | +10 | `24h_no_movement` |
| No date provided | +25 | `48h_no_movement` |

### B) Canonical Status (max 25 pts)

| Status | Points | Reason Code |
|--------|--------|-------------|
| DELIVERED / CANCELLED | 0 (terminal) | `status_delivered` |
| ISSUE | +25 | `status_exception` |
| RETURNED | +25 | `status_return` |
| IN_OFFICE | +20 | `status_at_office` |
| IN_TRANSIT / OUT_FOR_DELIVERY | +10 | `status_in_transit` |
| Others (CREATED, PROCESSING, SHIPPED) | +5 | - |

### C) Novedad (max 15 pts)

| Condition | Points | Reason Code |
|-----------|--------|-------------|
| Novedad present (non-empty) | +15 | `novedad_present` |
| Novedad empty/undefined | +0 | - |

### D) Location/Carrier Risk (max 10 pts)

| Condition | Points | Reason Code |
|-----------|--------|-------------|
| City in `riskyCities` | +5 | `risky_city` |
| Carrier in `riskyCarriers` | +5 | `risky_carrier` |

## Risk Levels

| Score Range | Level |
|-------------|-------|
| >= 70 | **HIGH** |
| 40-69 | **MEDIUM** |
| < 40 | **LOW** |

## Terminal Status

Shipments with `DELIVERED` or `CANCELLED` status are marked as **terminal**:
- Score = 0
- RiskLevel = LOW
- isTerminal = true
- No further action needed

## Configuration

### Risk Flags

Configure via environment variables:

```bash
RISKY_CITIES=Cali,Medellin,Barranquilla
RISKY_CARRIERS=CarrierX,CarrierY
```

Or at runtime:

```typescript
import { RiskFlags } from '../services/scoring';

RiskFlags.addRiskyCity('Cali');
RiskFlags.addRiskyCarrier('ProblematicCarrier');
```

### Thresholds

Default thresholds can be customized:

```typescript
import { RiskScoringService } from '../services/scoring';

RiskScoringService.setThresholds({
  highRiskMin: 70,   // >= 70 = HIGH
  mediumRiskMin: 40, // >= 40 = MEDIUM
});
```

## Usage

### Score a Single Guide

```typescript
import { RiskScoringService } from '../services/scoring';
import { CanonicalStatus } from '../types/canonical.types';

const result = RiskScoringService.scoreGuide({
  numero_de_guia: 'GUIA123',
  estatus: CanonicalStatus.IN_OFFICE,
  ciudad_de_destino: 'Bogota',
  transportadora: 'Servientrega',
  novedad: 'Direccion incorrecta',
  fecha_de_ultimo_movimiento: new Date('2024-12-27'),
});

console.log(result);
// {
//   guia: 'GUIA123',
//   riskLevel: 'HIGH',
//   score: 75,
//   reasons: ['72h_no_movement', 'status_at_office', 'novedad_present'],
//   isTerminal: false,
//   computedAt: Date,
//   breakdown: { timeScore: 35, statusScore: 20, novedadScore: 15, locationScore: 5 }
// }
```

### Batch Scoring

```typescript
const guides = [
  { numero_de_guia: 'G1', estatus: CanonicalStatus.DELIVERED },
  { numero_de_guia: 'G2', estatus: CanonicalStatus.IN_OFFICE },
];

const results = RiskScoringService.scoreGuides(guides);
const sorted = RiskScoringService.sortByRisk(results);
// Returns: HIGH first, then MEDIUM, then LOW, terminals last
```

### Filter by Level

```typescript
const highRiskOnly = RiskScoringService.filterByLevel(results, 'HIGH');
```

## API Endpoint

### GET /api/admin/risk-queue

Returns prioritized queue sorted by risk.

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://your-app.vercel.app/api/admin/risk-queue?level=HIGH&limit=50"
```

**Query Parameters:**
- `level`: HIGH | MEDIUM | LOW (optional filter)
- `limit`: number (default 50, max 200)
- `includeTerminal`: boolean (default false)

**Response:**
```json
{
  "timestamp": "2024-12-29T12:00:00.000Z",
  "config": {
    "thresholds": { "highRiskMin": 70, "mediumRiskMin": 40 },
    "riskFlags": { "riskyCities": [], "riskyCarriers": [] }
  },
  "stats": {
    "total": 150,
    "byLevel": { "HIGH": 15, "MEDIUM": 85, "LOW": 50 },
    "avgScore": 42,
    "terminalCount": 30
  },
  "count": 50,
  "guides": [
    {
      "guia": "GUIA123",
      "riskLevel": "HIGH",
      "score": 85,
      "reasons": ["120h_no_movement", "status_exception", "novedad_present"],
      "ciudad_de_destino": "Cali",
      "transportadora": "Servientrega",
      "estatus": "ISSUE",
      "fecha_de_ultimo_movimiento": "2024-12-24T10:00:00.000Z",
      "hoursSinceLastMovement": 120
    }
  ]
}
```

## Integration with Tickets (PR #5)

TicketRules can use scoring to:
1. **Upgrade priority**: If risk = HIGH, upgrade ticket to `alta`
2. **Sort backlog**: Show HIGH risk tickets first

```typescript
import { TicketRules, TicketService } from '../services/tickets';

// After creating ticket, check if should upgrade
const ticket = TicketRules.processFailedAction(actionLog, 400, 'Error');
if (ticket) {
  await TicketRules.upgradePriorityIfHighRisk(ticket, guideState);
}

// Get tickets sorted by risk
const openTickets = TicketService.getOpenTickets();
const sortedTickets = await TicketRules.getTicketsSortedByRisk(
  openTickets,
  async (guia) => getGuideState(guia) // Your data source
);
```

## Example Scenarios

### Scenario 1: Critical (HIGH)
- Status: IN_OFFICE (+20)
- Time: 5 days (+50)
- Novedad: "Cerrado" (+15)
- **Total: 85 → HIGH**

### Scenario 2: Attention Needed (MEDIUM)
- Status: IN_TRANSIT (+10)
- Time: 48h (+25)
- Novedad: present (+15)
- **Total: 50 → MEDIUM**

### Scenario 3: Normal (LOW)
- Status: IN_TRANSIT (+10)
- Time: 12h (+0)
- Novedad: empty (+0)
- **Total: 10 → LOW**

### Scenario 4: Terminal
- Status: DELIVERED (+0)
- **Total: 0 → LOW (terminal)**

## Best Practices

1. **Score on demand** - Don't store scores, compute when needed
2. **Check terminal first** - Skip terminal shipments in queues
3. **Use reasons for debugging** - They explain why score is high
4. **Prioritize HIGH in operations** - Address HIGH risk first
5. **Monitor stats** - Track avgScore and byLevel distribution

## Testing

```bash
npm test -- tests/scoring.test.ts
```

Key test scenarios:
- ✓ 48h sin movimiento sube score
- ✓ AT_OFFICE + 72h -> HIGH (with novedad)
- ✓ DELIVERED -> terminal (LOW)
- ✓ novedad presente suma 15
- ✓ risky city/carrier suma 5/5
- ✓ reasons[] siempre coherente con el score
