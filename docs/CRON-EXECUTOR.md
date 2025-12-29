# CRON Executor - Guía de Operación

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        VERCEL CRON                              │
│                   (cada 10 minutos)                             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│            /api/cron/run-executor                               │
│                                                                 │
│  1. Validar Authorization: Bearer ${CRON_SECRET}                │
│  2. Si EXECUTOR_ENABLED=false → dry run (WOULD_SEND)           │
│  3. Obtener ActionLog (PLANNED)                                 │
│  4. Para cada action:                                           │
│     - Verificar pilot filters                                   │
│     - Verificar rate limits                                     │
│     - Lookup phone desde PIIVault                               │
│     - Enviar vía Chatea (o marcar WOULD_SEND)                  │
│  5. Registrar en ExecutorRunLog                                 │
│  6. Limpiar PIIVault                                           │
│  7. Devolver resumen JSON                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Configuración en Vercel

### 1. Environment Variables (Project Settings)

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `CRON_SECRET` | `<random-string-32+chars>` | **REQUERIDO** - Secreto para autenticar CRON |
| `EXECUTOR_ENABLED` | `false` | Master switch (true = envía real) |
| `PILOT_CITY` | `Bogotá` | Solo esta ciudad (opcional) |
| `PILOT_CARRIER` | `Coordinadora` | Solo esta transportadora (opcional) |
| `DAILY_SEND_LIMIT` | `100` | Máximo mensajes/día |
| `RATE_LIMIT_PER_MINUTE` | `20` | Máximo mensajes/minuto |
| `RATE_LIMIT_PER_PHONE_DAY` | `2` | Máximo por teléfono/día |
| `CHATEA_API_URL` | `https://api.chatea.io/v1` | URL de Chatea |
| `CHATEA_API_KEY` | `sk_live_xxx` | API key de Chatea |

### 2. Generar CRON_SECRET

```bash
# Opción 1: OpenSSL
openssl rand -hex 32

# Opción 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**⚠️ NUNCA commitear el secreto. Solo en Vercel Project Settings.**

### 3. CRON Schedule (vercel.json)

```json
{
  "crons": [
    {
      "path": "/api/cron/run-executor",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

**Nota:** Vercel CRON requiere plan Pro. El header `Authorization` es enviado automáticamente por Vercel.

---

## Endpoints

### POST /api/cron/run-executor

Ejecuta el batch de acciones pendientes.

**Headers requeridos:**
```
Authorization: Bearer ${CRON_SECRET}
```

**Response (200):**
```json
{
  "runId": "run_m4k2j1_abc123",
  "startedAt": "2024-01-15T10:30:00.000Z",
  "finishedAt": "2024-01-15T10:30:02.150Z",
  "durationMs": 2150,
  "planned": 25,
  "wouldSend": 20,
  "sent": 18,
  "success": 18,
  "failed4xx": 1,
  "failed5xx": 0,
  "skippedDuplicate": 2,
  "skippedRateLimit": 3,
  "skippedDisabled": 1,
  "status": "PARTIAL",
  "config": {
    "executorEnabled": true,
    "pilotCity": "Bogotá",
    "dailySendLimit": 100
  }
}
```

**Response (401):**
```json
{
  "error": "Unauthorized"
}
```

### GET /api/admin/executor-status

Ver estado actual y runs recientes.

**Headers requeridos:**
```
Authorization: Bearer ${CRON_SECRET}
```

**Response (200):**
```json
{
  "timestamp": "2024-01-15T10:35:00.000Z",
  "config": {
    "executorEnabled": true,
    "pilotCity": "Bogotá"
  },
  "status": {
    "executorReady": true,
    "lastRunAt": "2024-01-15T10:30:02.150Z",
    "lastRunStatus": "PARTIAL"
  },
  "stats": {
    "runs": {
      "totalRuns": 15,
      "last24hRuns": 12,
      "totalSent": 180,
      "avgDurationMs": 1850
    },
    "rateLimiter": {
      "totalToday": 50,
      "remainingToday": 50
    }
  },
  "recentRuns": [...]
}
```

---

## Rollout Paso a Paso

### Fase 1: Validación (Día 1-2)

```bash
# 1. Configurar variables (EXECUTOR_ENABLED=false)
EXECUTOR_ENABLED=false
PILOT_CITY=Bogotá
DAILY_SEND_LIMIT=50

# 2. Desplegar a Preview
vercel --env-file .env.preview

# 3. Ejecutar manualmente
curl -X POST https://your-preview.vercel.app/api/cron/run-executor \
  -H "Authorization: Bearer $CRON_SECRET"

# 4. Verificar respuesta - debe mostrar wouldSend > 0, sent = 0
```

### Fase 2: Piloto (Día 3-5)

```bash
# 1. Habilitar para UNA ciudad
EXECUTOR_ENABLED=true
PILOT_CITY=Bogotá
DAILY_SEND_LIMIT=50

# 2. Monitorear cada hora
curl https://your-app.vercel.app/api/admin/executor-status \
  -H "Authorization: Bearer $CRON_SECRET"

# 3. Revisar métricas
# - success rate > 95%
# - failed4xx < 5%
# - No quejas de clientes
```

### Fase 3: Escalado (Día 6+)

| Día | DAILY_SEND_LIMIT | PILOT_CITY |
|-----|------------------|------------|
| 6   | 100              | Bogotá     |
| 7   | 250              | Bogotá + Medellín |
| 8   | 500              | Todas      |
| 10+ | 1000+            | Todas      |

---

## Seguridad

### PII (Teléfonos)

```
✅ EventLog: solo phoneHash
✅ ActionLog: solo phoneHash
✅ ExecutorRunLog: sanitizado
✅ API responses: sin teléfonos
✅ Logs de error: [PHONE_REDACTED]

❌ Nunca loguear teléfono en claro
❌ Nunca persistir teléfono en DB
❌ Nunca incluir en respuestas API
```

### PIIVault

El teléfono solo existe en memoria durante la ejecución:

```
1. Excel/Webhook → PIIVault.store(phone) → phoneHash
2. Executor → PIIVault.lookup(phoneHash) → phone
3. Chatea.send(phone) → éxito/error
4. PIIVault.clear() → phone eliminado
```

**TTL:** 30 minutos (configurable)

---

## Troubleshooting

### Error: "Unauthorized" (401)

```bash
# Verificar que CRON_SECRET está configurado
vercel env ls | grep CRON_SECRET

# Verificar header
curl -v -X POST .../api/cron/run-executor \
  -H "Authorization: Bearer $CRON_SECRET"
```

### Error: "Phone not found"

El teléfono no está en PIIVault. Causas:
1. El teléfono expiró (TTL 30min)
2. El teléfono nunca fue almacenado

Solución: Asegurar que el flujo de ingesta llama a `PIIVault.store()`.

### Error: Muchos SKIPPED_RATE_LIMIT

```bash
# Ver estado actual
curl .../api/admin/executor-status

# Si totalToday >= dailySendLimit → esperar hasta mañana
# Si perPhoneDay >= 2 → el teléfono ya recibió 2 mensajes hoy
```

### Error: No se envían mensajes (EXECUTOR_ENABLED=true)

1. ¿Hay acciones PLANNED?
2. ¿Pasan los filtros de piloto?
3. ¿Rate limits no alcanzados?
4. ¿Chatea API configurada?

```bash
# Verificar config
curl .../api/admin/executor-status

# Verificar que hay PLANNED
# stats.actions.planned > 0
```

---

## Métricas Clave

| Métrica | Target | Alerta si |
|---------|--------|-----------|
| Success Rate | > 95% | < 90% |
| failed4xx | < 5% | > 10% |
| Duración | < 5s | > 30s |
| Duplicates | < 2% | > 5% |

---

## Tests

```bash
npm test tests/cron-security.test.ts
```

Cobertura:
- ✅ 401 sin Authorization header
- ✅ 401 con secreto inválido
- ✅ 200 con secreto válido
- ✅ PII redactado en logs
- ✅ PIIVault store/lookup/clear
- ✅ ExecutorRunLog sanitización
