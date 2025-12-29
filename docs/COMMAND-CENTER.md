# Command Center - PR #7

## Overview

Single Pane of Glass for the operations team. Aggregates all critical data in one endpoint without needing 20 tabs or manual searches.

## Authentication

### Two Separate Secrets

| Secret | Purpose | Endpoints |
|--------|---------|-----------|
| `CRON_SECRET` | Vercel CRON jobs | `/api/cron/*` |
| `ADMIN_SECRET` | Admin panel access | `/api/admin/*` |

**Important**: If `ADMIN_SECRET` is not set, falls back to `CRON_SECRET` for backwards compatibility. In production, **always set both**.

```bash
# .env
CRON_SECRET=your-cron-secret-here
ADMIN_SECRET=your-admin-secret-here  # Different from CRON_SECRET!
```

### Using Admin Endpoints

```bash
# All admin endpoints require Authorization header
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  https://your-app.vercel.app/api/admin/command-center
```

## Command Center Endpoint

### GET /api/admin/command-center

Returns all operational data in one request.

**Query Parameters:**
- `ciudad` - Filter by city
- `transportadora` - Filter by carrier
- `limit` - Max items per section (default 20, max 50)

**Response Sections:**

#### A) Urgent Queue (HIGH risk)

```json
{
  "urgentQueue": {
    "count": 5,
    "items": [
      {
        "guia": "GUIA123",
        "score": 85,
        "reasons": ["72h_no_movement", "status_at_office", "novedad_present"],
        "estatus": "IN_OFFICE",
        "ciudad_de_destino": "Bogota",
        "transportadora": "Servientrega",
        "hoursSinceLastMovement": 75
      }
    ]
  }
}
```

#### B) Tickets

```json
{
  "tickets": {
    "openCount": 12,
    "inProgressCount": 3,
    "items": [
      {
        "ticketId": "tkt_abc123",
        "guia": "GUIA456",
        "trigger": "FAILED_4XX",
        "priority": "alta",
        "status": "OPEN",
        "createdAt": "2024-12-29T10:00:00.000Z"
      }
    ]
  }
}
```

#### C) Actions Feed

```json
{
  "actionsFeed": {
    "planned": 50,
    "running": 2,
    "recentFailed": 3,
    "recentSuccess": 145,
    "items": [
      {
        "id": "act_123",
        "guia": "GUIA789",
        "actionType": "SEND_WHATSAPP",
        "status": "SUCCESS",
        "trigger": "protocol",
        "ciudad": "Medellin",
        "transportadora": "Coordinadora",
        "createdAt": "2024-12-29T11:30:00.000Z"
      }
    ]
  }
}
```

#### D) Executor Health

```json
{
  "executorHealth": {
    "lastRunAt": "2024-12-29T11:40:00.000Z",
    "lastRunStatus": "SUCCESS",
    "last24h": {
      "runs": 144,
      "sent": 1250,
      "success": 1200,
      "failed4xx": 30,
      "failed5xx": 20,
      "skippedDuplicate": 150,
      "skippedRateLimit": 50,
      "successRate": 96.0
    },
    "dailyComparison": {
      "todaySent": 850,
      "yesterdaySent": 920,
      "delta": -70
    }
  }
}
```

## Admin Actions

### Pause/Resume Executor

```bash
# Pause immediately
curl -X POST \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"action": "pause", "reason": "High failure rate"}' \
  https://your-app.vercel.app/api/admin/rollout-control

# Resume
curl -X POST \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"action": "resume"}' \
  https://your-app.vercel.app/api/admin/rollout-control
```

### Adjust Rate Limits

```bash
curl -X POST \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "adjustLimits",
    "limits": {
      "dailySendLimit": 200,
      "rateLimitPerMinute": 10
    },
    "reason": "Reducing load during incident"
  }' \
  https://your-app.vercel.app/api/admin/rollout-control
```

### Update Risk Flags (Dynamic)

```bash
# Add risky cities
curl -X PUT \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "addCities": ["Cali", "Barranquilla"],
    "reason": "High failure rate in these cities"
  }' \
  https://your-app.vercel.app/api/admin/risk-flags

# Remove a carrier from risky list
curl -X PUT \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "removeCarriers": ["OldCarrier"],
    "reason": "Performance improved"
  }' \
  https://your-app.vercel.app/api/admin/risk-flags

# Get current flags
curl -H "Authorization: Bearer $ADMIN_SECRET" \
  https://your-app.vercel.app/api/admin/risk-flags
```

### Update Ticket Status

```bash
# Mark ticket as IN_PROGRESS
curl -X PATCH \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"status": "IN_PROGRESS"}' \
  https://your-app.vercel.app/api/admin/tickets/tkt_abc123

# Resolve with notes (NO PII!)
curl -X PATCH \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "RESOLVED",
    "resolutionNotes": "Updated phone in database"
  }' \
  https://your-app.vercel.app/api/admin/tickets/tkt_abc123
```

## What You CANNOT Do

For safety, these actions are **NOT allowed**:

- ❌ Send WhatsApp directly from UI
- ❌ Access clear phone numbers (only phoneHash)
- ❌ Modify shipment data
- ❌ Delete logs/tickets

## Operational Workflow

### Daily Routine

1. **Open Command Center**
   ```bash
   curl -H "Authorization: Bearer $ADMIN_SECRET" \
     https://your-app.vercel.app/api/admin/command-center
   ```

2. **Check Executor Health**
   - Is `lastRunStatus` = SUCCESS?
   - Is `successRate` > 90%?
   - Is `delta` positive (more sent than yesterday)?

3. **Review Urgent Queue**
   - HIGH risk items need attention
   - Check `reasons` to understand why

4. **Work Tickets**
   - Start with `priority: alta`
   - Mark IN_PROGRESS when working
   - Add resolution notes when done

### Incident Response

1. **High Failure Rate Detected**
   ```bash
   # Pause executor
   curl -X POST -H "Authorization: Bearer $ADMIN_SECRET" \
     -d '{"action": "pause", "reason": "High failure rate"}' \
     https://your-app.vercel.app/api/admin/rollout-control
   ```

2. **Investigate**
   - Check `/api/admin/executor-status` for error breakdown
   - Review failed4xx vs failed5xx

3. **Fix & Resume**
   ```bash
   curl -X POST -H "Authorization: Bearer $ADMIN_SECRET" \
     -d '{"action": "resume", "reason": "Issue resolved"}' \
     https://your-app.vercel.app/api/admin/rollout-control
   ```

### Adding Risky Location

When a city/carrier shows consistent issues:

```bash
curl -X PUT -H "Authorization: Bearer $ADMIN_SECRET" \
  -d '{"addCities": ["ProblemCity"], "reason": "50% failure rate"}' \
  https://your-app.vercel.app/api/admin/risk-flags
```

This will:
- Add +5 to risk score for shipments to that city
- Prioritize them in urgent queue
- No code deploy needed!

## All Admin Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/command-center` | GET | Single pane of glass |
| `/api/admin/rollout-config` | GET | Current config & phase |
| `/api/admin/rollout-control` | GET/POST | Pause/resume/adjust |
| `/api/admin/risk-queue` | GET | Risk-sorted queue |
| `/api/admin/risk-flags` | GET/PUT | Dynamic risk flags |
| `/api/admin/executor-status` | GET | 24h metrics |
| `/api/admin/tickets` | GET | List tickets |
| `/api/admin/tickets/:id` | GET/PATCH | Single ticket |

## Performance

- Command Center caches for 30 seconds
- Pagination supported via `limit` and `offset`
- Scoring computed on-demand (not stored)

## Audit Trail

All admin actions are logged:

```json
{
  "type": "ADMIN_AUDIT",
  "timestamp": "2024-12-29T12:00:00.000Z",
  "action": "EXECUTOR_PAUSED",
  "ip": "xxx.xxx.xxx.xxx",
  "details": { "reason": "High failure rate" }
}
```

View in Vercel logs or your logging service.
