# Calibration Loop + Outcome Tracking

## Overview

The calibration system measures the real impact of automated actions and provides data-driven recommendations for optimizing protocol thresholds and risk flags.

**Key principle**: Decisions are based on measured outcomes, not opinions or gut feelings.

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                      CALIBRATION LOOP                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. ACTION EXECUTED                                             │
│     └─> SEND_WHATSAPP SUCCESS                                  │
│                                                                 │
│  2. OUTCOME TRACKED                                             │
│     └─> OutcomeService.createOutcome()                         │
│         Records: guia, trigger, sentAt, city, carrier          │
│                                                                 │
│  3. MOVEMENT CHECKED (24h, 48h windows)                        │
│     └─> Did shipment move after contact?                       │
│         - movedWithin24h: boolean                               │
│         - movedWithin48h: boolean                               │
│         - ticketCreatedAfter: boolean (failure proxy)          │
│                                                                 │
│  4. REPORT GENERATED                                            │
│     └─> CalibrationReportService.generateReport(days)          │
│         Aggregates: by trigger, city, carrier                   │
│         Identifies: worst performers                            │
│                                                                 │
│  5. RECOMMENDATIONS                                             │
│     └─> Data-driven suggestions:                                │
│         - INCREASE_THRESHOLD if moved rate too low             │
│         - ADD_RISKY_CITY/CARRIER for consistent failures       │
│         - CREATE_TICKET_FASTER if tickets high after actions   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Key Metrics

### Outcome Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| `movedWithin24hRate` | % of shipments that moved within 24h after WhatsApp | > 40% |
| `movedWithin48hRate` | % of shipments that moved within 48h after WhatsApp | > 60% |
| `ticketCreatedRate` | % of actions that resulted in a ticket (failure proxy) | < 20% |
| `successRate` | % of WhatsApp sends that succeeded (API level) | > 95% |

### Thresholds for Recommendations

```typescript
DEFAULT_CALIBRATION_THRESHOLDS = {
  minSampleSize: 10,                    // Min sends to generate recommendation
  lowOutcomeRateThreshold: 30,          // Below this % = trigger needs adjustment
  highOutcomeRateThreshold: 60,         // Above this % = trigger is working well
  highTicketRateThreshold: 40,          // Above this % = something is wrong
  consistentDaysForHighConfidence: 5,   // Days needed for high confidence
}
```

## API Endpoints

### GET /api/admin/calibration-report

Get calibration report with outcome metrics and recommendations.

**Query Parameters:**
- `days`: Number of days to analyze (default: 7, max: 30)

**Response:**
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "requestedDays": 7,

  "summary": {
    "periodStart": "2024-01-08T00:00:00Z",
    "periodEnd": "2024-01-15T23:59:59Z",
    "totalSent": 150,
    "successRate": 96.5,
    "movedWithin24hRate": 45.2,
    "movedWithin48hRate": 62.1,
    "ticketCreatedRate": 18.3
  },

  "recommendations": [
    {
      "type": "ADD_RISKY_CITY",
      "confidence": "high",
      "target": { "city": "BUCARAMANGA" },
      "reason": "City has 22% moved within 48h, below 30% threshold",
      "evidence": {
        "sampleSize": 25,
        "currentRate": "22%",
        "threshold": "30%"
      }
    }
  ],

  "dailyReports": [...],
  "byTrigger": {...},
  "calibration": {
    "lastCalibrationAt": "2024-01-14T15:00:00Z",
    "changesLast24h": 1,
    "cooldownActive": false
  }
}
```

## Workflow: How to Calibrate Without Breaking Operations

### 1. Review Daily (Read-Only)

```bash
# Get 7-day report
curl -X GET "https://your-api/api/admin/calibration-report?days=7" \
  -H "Authorization: Bearer $ADMIN_SECRET"
```

Look for:
- Overall `movedWithin48hRate` trend (going up or down?)
- Worst performing cities and carriers
- High-confidence recommendations

### 2. Understand Before Acting

Before applying any recommendation:

1. **Check sample size**: Is there enough data? (min 10-20 sends)
2. **Check confidence**: Prefer "high" confidence recommendations
3. **Check trend**: Is this a consistent pattern or a one-time spike?
4. **Consider context**: Holidays, carrier issues, weather?

### 3. Apply Changes Gradually

**DO:**
- Apply 1-2 changes at a time
- Wait 24-48h between changes
- Monitor impact after each change

**DON'T:**
- Apply all recommendations at once
- Ignore cooldown warnings
- Make changes without reviewing data

### 4. Verify Impact

After applying a change, wait for the next report cycle to verify:

```bash
# Get report focusing on changed area
curl -X GET "https://your-api/api/admin/calibration-report?days=3" \
  -H "Authorization: Bearer $ADMIN_SECRET"
```

Expected:
- `movedWithin48hRate` should improve or stay stable
- `ticketCreatedRate` should decrease
- No unexpected side effects

## Recommendation Types

| Type | Description | Auto-Apply? |
|------|-------------|-------------|
| `INCREASE_THRESHOLD` | Wait longer before triggering (48h → 72h) | No |
| `DECREASE_THRESHOLD` | Trigger earlier | No |
| `ADD_RISKY_CITY` | Add city to risk flags (higher priority) | Manual |
| `REMOVE_RISKY_CITY` | Remove city from risk flags | Manual |
| `ADD_RISKY_CARRIER` | Add carrier to risk flags | Manual |
| `REMOVE_RISKY_CARRIER` | Remove carrier from risk flags | Manual |
| `CREATE_TICKET_FASTER` | Reduce time before ticket creation | No |
| `DISABLE_TRIGGER` | Stop trigger for specific city/carrier | No |

## Safety Features

1. **Max changes per run**: Only 3 changes per 24h period
2. **Cooldown period**: 24h between auto-calibration runs
3. **Confidence filtering**: High-confidence recommendations only by default
4. **Dry-run mode**: Test changes before applying
5. **Audit trail**: All changes logged with timestamp and reason

## Common Scenarios

### Scenario 1: City consistently underperforming

**Observation:**
```
worstCities: [
  { city: "CUCUTA", movedWithin48hRate: 18, totalSent: 42 }
]
```

**Recommendation:** `ADD_RISKY_CITY` for CUCUTA

**Action:**
```bash
curl -X PUT "https://your-api/api/admin/risk-flags" \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"addCities": ["CUCUTA"], "reason": "Low outcome rate 18%"}'
```

**Effect:** Shipments to CUCUTA get higher risk score, earlier escalation.

### Scenario 2: Trigger not effective

**Observation:**
```
byTrigger: {
  "NO_MOVEMENT_48H": {
    "movedWithin48hRate": 25,
    "ticketCreatedRate": 45
  }
}
```

**Interpretation:**
- Only 25% move after contact (low)
- 45% end up with tickets (high)
- The 48h trigger might be too aggressive

**Recommendation:** `INCREASE_THRESHOLD` to 72h

**Action:** Update protocol configuration (code change required)

### Scenario 3: Carrier issue

**Observation:**
```
worstCarriers: [
  { carrier: "ENVIA", movedWithin48hRate: 12, totalSent: 35 }
]
```

**Action:**
1. Add to risky carriers
2. Investigate carrier-specific issues
3. Consider disabling trigger for this carrier temporarily

## Integration with Other Systems

### TicketRules Integration

When a ticket is created for `NO_MOVEMENT_AFTER_CONTACT`, the outcome is marked:

```typescript
// In TicketRules when creating ticket
OutcomeService.markTicketCreated(guia, actionId);
```

This allows tracking which actions led to tickets (failure proxy).

### RiskFlags Integration

Recommendations like `ADD_RISKY_CITY` can be applied via the risk-flags endpoint:

```typescript
// CalibrationRules.applyRecommendation() calls
RiskFlags.addRiskyCity(city);
```

### ActionExecutor Integration

After successful SEND_WHATSAPP, create outcome:

```typescript
// In ActionExecutor after success
OutcomeService.createOutcome({
  actionId: result.actionId,
  guia: action.guia,
  trigger: action.trigger,
  sentAt: new Date(),
  statusAtSend: action.canonicalStatus,
  city: action.city,
  carrier: action.carrier,
  prevMovementAt: guideState.lastEventAt,
});
```

## Monitoring

Key metrics to watch in production:

1. **Outcomes pending**: How many outcomes haven't reached 48h yet
2. **Finalization rate**: How many outcomes are being finalized per run
3. **Recommendation accuracy**: Did applied recommendations improve metrics?

```bash
# Check outcome stats
curl -X GET "https://your-api/api/admin/calibration-report" \
  -H "Authorization: Bearer $ADMIN_SECRET" | jq '.outcomeStats'
```

## FAQ

### Q: How often should I check the calibration report?
**A:** Daily review recommended, apply changes weekly or less frequently.

### Q: What if movedWithin48hRate is 0%?
**A:** Check if outcomes are being created correctly. Verify EventLogService has movement events.

### Q: Can I disable the calibration system?
**A:** The system is read-only by default. Just don't call the endpoint.

### Q: What's the minimum data needed for reliable recommendations?
**A:** At least 10 outcomes per trigger/city/carrier, preferably 50+.

### Q: How do I know if a change helped?
**A:** Compare movedWithin48hRate before and after. Allow 3-5 days for data.
