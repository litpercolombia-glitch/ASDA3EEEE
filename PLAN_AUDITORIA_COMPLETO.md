# 🔍 PLAN DE AUDITORÍA COMPLETO - LITPER PRO
## Metodología + Preparación + Ejecución + GitHub Issues

**Fecha:** 29 de Diciembre 2024
**Objetivo:** Operación sin errores, trazabilidad total, automatización real con IA

---

# PARTE 1: PREPARACIÓN (5 Cosas que Debes Tener)

## ✅ 1.1 Repo Clonado
```
Branch actual: claude/mark-guides-reviewed-Vf5ri
Ubicación: /home/user/ASDA3EEEE
Estado: ✅ Listo
```

## ✅ 1.2 Archivo .env.example
**Ubicación:** `/.env.example`
```bash
# Variables de entorno identificadas:
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_CHATEA_API_KEY=tu_api_key_aqui
VITE_CHATEA_WEBHOOK_URL=https://chateapro.app/api/iwh/tu_webhook_id
VITE_ANTHROPIC_API_KEY=sk-ant-api03-...
VITE_GEMINI_API_KEY=AIzaSy...
VITE_OPENAI_API_KEY=sk-proj-...
```

**⚠️ PROBLEMA DETECTADO:** API keys en frontend (VITE_*) son visibles al usuario

## ✅ 1.3 Archivos de Ejemplo en /audit_samples/
| Archivo | Propósito | Estado |
|---------|-----------|--------|
| `chatea_webhook.json` | Ejemplo de webhook entrante de WhatsApp | ✅ Creado |
| `dropi_order.json` | Ejemplo de orden nueva de Dropi | ✅ Creado |
| `dropi_tracking.json` | Ejemplo de actualización de tracking | ✅ Creado |

## ✅ 1.4 Archivo tracking_error_example.txt
**Ubicación:** `/audit_samples/tracking_error_example.txt`
**Contenido:** 8 errores típicos documentados con:
- Stack trace
- Causa raíz
- Frecuencia estimada
- Prioridad

## ✅ 1.5 Flujo Real de Seguimiento
**Ubicación:** `/audit_samples/seguimiento_guias_flujo.md`
**Contenido:** Flujo paso a paso de cómo opera el equipo hoy

---

# PARTE 2: RESULTADOS FASE 0 - SCAN

## 2.1 Estructura del Repo

### Componentes Principales
```
/home/user/ASDA3EEEE/
├── App.tsx                    # Entry point (1,105 líneas)
├── components/                # 616+ componentes React
│   ├── tabs/                  # Tabs principales
│   │   ├── SeguimientoTab.tsx # ⚠️ 2,227 líneas
│   │   ├── OperacionesUnificadoTab.tsx
│   │   └── ...
│   ├── Admin/                 # 20+ paneles admin
│   ├── chat/                  # Componentes de chat
│   └── features/              # Features específicas
├── services/                  # 72 servicios TypeScript
│   ├── skillsService.ts       # 9 skills activos
│   ├── chateaService.ts       # ⚠️ API key expuesta
│   ├── webhookService.ts      # ⚠️ Sin HMAC
│   ├── authService.ts         # ⚠️ Passwords hardcodeadas
│   └── ...
├── backend/                   # FastAPI Python
│   ├── main.py                # Entry point
│   ├── routes/                # 14 routers
│   ├── integrations/          # Chatea, Dropi
│   ├── brain/                 # Sistema autónomo
│   └── workers/               # Task queue
├── stores/                    # 9 Zustand stores
├── types/                     # TypeScript types
└── audit_samples/             # Samples para auditoría
```

### Conteo de Archivos
| Tipo | Cantidad |
|------|----------|
| Componentes React (.tsx) | 616+ |
| Servicios TypeScript (.ts) | 102 |
| Rutas Backend (.py) | 14 |
| Stores Zustand | 9 |
| Skills | 9 (activos) + 15 (propuestos) |

## 2.2 Dependencias Principales

### Frontend (package.json)
```json
{
  "dependencies": {
    "react": "^19.2.0",
    "typescript": "~5.8.2",
    "@anthropic-ai/sdk": "^0.71.0",
    "@supabase/supabase-js": "^2.45.0",
    "@google/genai": "^1.30.0",
    "zustand": "^5.0.9",
    "xlsx": "^0.18.5",
    "recharts": "^3.5.1"
  }
}
```

### Backend (Python)
```
FastAPI
SQLAlchemy 2.0.27 (async)
PostgreSQL 15
Redis 7
Loguru
Pydantic 2.x
scikit-learn
```

## 2.3 Rutas/Endpoints Identificados

### Backend Routes (14)
| Ruta | Archivo | Propósito |
|------|---------|-----------|
| `/api/brain/*` | brain_routes.py | Cerebro autónomo |
| `/api/chatea-pro/*` | chatea_pro_routes.py | Integración Chatea |
| `/api/tracking/*` | tracking_routes.py | Tracking general |
| `/api/tracking-ordenes/*` | tracking_ordenes_routes.py | Órdenes tracking |
| `/api/webhooks/*` | webhook_routes.py | Webhooks entrantes |
| `/api/whatsapp/*` | whatsapp_routes.py | WhatsApp |
| `/ws/*` | websocket_routes.py | WebSocket |
| `/api/tracker/*` | tracker_routes.py | Sincronización |
| `/api/rescue/*` | rescue_routes.py | Rescate guías |
| `/api/push/*` | push_routes.py | Push notifications |
| `/api/carga/*` | carga_routes.py | Cargas |
| `/api/ai/*` | ai_proxy_routes.py | Proxy AI seguro |
| `/api/knowledge/*` | knowledge_routes.py | Sistema conocimiento |
| `/api/admin/*` | admin_routes.py | Administración |

## 2.4 Variables de Entorno Usadas

### Frontend (VITE_*)
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_CHATEA_API_KEY        ⚠️ CRÍTICO: Expuesta en frontend
VITE_CHATEA_WEBHOOK_URL
VITE_ANTHROPIC_API_KEY     ⚠️ CRÍTICO: Expuesta en frontend
VITE_GEMINI_API_KEY        ⚠️ CRÍTICO: Expuesta en frontend
VITE_OPENAI_API_KEY        ⚠️ CRÍTICO: Expuesta en frontend
```

### Backend (process.env)
```
DATABASE_URL
REDIS_URL
CHATEA_PRO_API_KEY
CHATEA_PRO_WEBHOOK_URL
ANTHROPIC_API_KEY
WEBHOOK_SECRET             ⚠️ Sin usar correctamente
```

## 2.5 Integraciones Identificadas

### Archivos con integraciones (188 archivos)
```
Chatea:        services/chateaService.ts, backend/integrations/chatea_pro.py
Dropi:         Via webhooks Chatea/N8N
Transportadoras: services/webhookService.ts, backend/services/webhook_service.py
Supabase:      services/supabaseService.ts
Claude AI:     services/claudeService.ts, services/claudeBrainService.ts
Gemini AI:     services/geminiService.ts (no usado directamente)
```

---

# PARTE 3: INVENTARIO Y MAPA DEL SISTEMA

## 3.1 Arquitectura Actual

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           LITPER PRO v5.0                                │
└─────────────────────────────────────────────────────────────────────────┘

     USUARIOS
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React 19)                              │
├─────────────────────────────────────────────────────────────────────────┤
│  Tabs: Seguimiento │ Operaciones │ Inteligencia │ Admin │ Chat         │
│                                                                          │
│  Services: 72 archivos                                                   │
│  ├── authService.ts      ⚠️ 9 passwords hardcodeadas                   │
│  ├── chateaService.ts    ⚠️ API key expuesta                           │
│  ├── webhookService.ts   ⚠️ Sin verificación HMAC                      │
│  └── skillsService.ts    ✅ 9 skills funcionando                        │
│                                                                          │
│  Stores: Zustand (9)                                                     │
│  shipmentStore │ authStore │ uiStore │ analyticsStore │ ...            │
└─────────────────────────────────────────────────────────────────────────┘
         │
         ▼ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (FastAPI)                                │
├─────────────────────────────────────────────────────────────────────────┤
│  Routes: 14 routers                                                      │
│  ├── chatea_pro_routes.py  ✅ Webhook receiver                          │
│  ├── webhook_routes.py     ⚠️ Sin deduplicación                        │
│  ├── brain_routes.py       ✅ Cerebro autónomo                          │
│  └── ai_proxy_routes.py    ✅ Proxy seguro (nuevo)                      │
│                                                                          │
│  CORS: allow_origins=["*"]  ⚠️ CRÍTICO                                  │
└─────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           BASES DE DATOS                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  PostgreSQL 15     │     Redis 7      │     Supabase                    │
│  (Datos core)      │   (Cache/Queue)  │   (Auth/Storage)                │
└─────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        INTEGRACIONES EXTERNAS                            │
├─────────────────────────────────────────────────────────────────────────┤
│  Chatea Pro   │   Dropi (via N8N)   │   Transportadoras   │   AI APIs  │
│  ⚠️ Key exp.  │   ⚠️ Sin reconcil. │   ⚠️ Sin HMAC       │   ✅ OK     │
└─────────────────────────────────────────────────────────────────────────┘
```

## 3.2 SOURCE OF TRUTH por Dato

| Dato | Fuente Principal | Respaldo | Conflicto → Prioridad |
|------|------------------|----------|----------------------|
| Estado del envío | Transportadora | Dropi | Transportadora > Dropi |
| Datos del cliente | Dropi | BD Local | Dropi manda |
| Historial de estados | BD Local | - | BD es source |
| Notas de gestión | BD Local | - | BD es source |
| Valor del pedido | Dropi | - | Dropi manda |
| Dirección entrega | Dropi | Actualización manual | Dropi + corrección |

---

# PARTE 4: FLUJOS CRÍTICOS

## 4.1 Flujo: Webhook → Guía Actualizada

```
TRANSPORTADORA                    BACKEND                         FRONTEND
      │                              │                                │
      │  POST /webhook               │                                │
      │  { guia, estado }            │                                │
      ├─────────────────────────────►│                                │
      │                              │                                │
      │                              │  1. verifySignature()          │
      │                              │     ⚠️ FAKE: solo length > 0   │
      │                              │                                │
      │                              │  2. checkDuplicate()           │
      │                              │     ⚠️ NO IMPLEMENTADO         │
      │                              │                                │
      │                              │  3. mapEstado()                │
      │                              │     ✅ Mapeo funciona           │
      │                              │                                │
      │                              │  4. UPDATE guia                │
      │                              │     ⚠️ Sin idempotency_key     │
      │                              │                                │
      │  200 OK                      │                                │
      │◄─────────────────────────────┤                                │
      │                              │                                │
      │                              │  5. WebSocket broadcast        │
      │                              ├───────────────────────────────►│
      │                              │                                │
```

**Problemas detectados:**
1. Sin verificación HMAC real
2. Sin deduplicación (event_id)
3. Sin idempotency_key
4. Sin retry con backoff
5. Sin dead letter queue

## 4.2 Flujo: Chat → Skill → Acción

```
USUARIO                     CHAT CENTER                    SKILL ENGINE
   │                             │                              │
   │  "Muéstrame novedades"      │                              │
   ├────────────────────────────►│                              │
   │                             │                              │
   │                             │  detectSkill(message)        │
   │                             ├─────────────────────────────►│
   │                             │                              │
   │                             │  { skill: 'novedades' }      │
   │                             │◄─────────────────────────────┤
   │                             │                              │
   │                             │  executeSkill(params)        │
   │                             ├─────────────────────────────►│
   │                             │                              │
   │                             │                              │ Query DB
   │                             │                              │ Format
   │                             │                              │ Actions
   │                             │                              │
   │                             │  SkillResult                 │
   │                             │◄─────────────────────────────┤
   │                             │                              │
   │  Tabla + Botones + Tips     │                              │
   │◄────────────────────────────┤                              │
```

---

# PARTE 5: TABLA DE INTEGRACIONES

| Integración | Eventos | Riesgos | Observabilidad | Recomendación |
|-------------|---------|---------|----------------|---------------|
| **Chatea Pro** | message_received, status_update | API key en frontend, sin retry | Logs básicos | Mover key a backend, circuit breaker |
| **Dropi** | order_created, order_updated, tracking | Desincronización, sin reconciliación | Sin métricas | Acceso API directo + reconciliación 15min |
| **Coordinadora** | status_changed | Sin HMAC, duplicados | Log por guía | HMAC + deduplicación |
| **Servientrega** | status_changed | Campos null, formatos variables | Básico | Validación robusta |
| **TCC** | status_changed | Webhook intermitente | Mínimo | Fallback a polling |
| **N8N** | Orquestador | Single point of failure | Dashboard N8N | Fallback local |
| **Claude AI** | Brain analysis | Rate limits | Logs | Gemini fallback |
| **Supabase** | Auth, storage | - | Dashboard | ✅ OK |

---

# PARTE 6: TOP 10 RIESGOS DE SEGURIDAD

| # | Riesgo | Severidad | Archivo | Línea | Fix |
|---|--------|-----------|---------|-------|-----|
| 1 | 9 passwords hardcodeadas | 🔴 CRÍTICO | authService.ts | 71-174 | Migrar a Supabase Auth |
| 2 | Hashing con Base64 | 🔴 CRÍTICO | authService.ts | 189 | bcrypt.hash() |
| 3 | API key Chatea en frontend | 🔴 CRÍTICO | chateaService.ts | 10 | Backend proxy |
| 4 | API key Claude en frontend | 🔴 CRÍTICO | claudeService.ts | 8 | Backend proxy |
| 5 | CORS permite "*" | 🔴 ALTO | main.py | 254 | Lista blanca |
| 6 | Webhook sin HMAC | 🔴 ALTO | webhookService.ts | 316 | crypto.createHmac() |
| 7 | Tokens en localStorage | 🟠 MEDIO | authService.ts | 45 | httpOnly cookies |
| 8 | Sin rate limiting | 🟠 MEDIO | main.py | - | slowapi |
| 9 | Logs sin sanitizar PII | 🟠 MEDIO | varios | - | Redactar PII |
| 10 | Sin audit trail | 🟡 BAJO | - | - | Tabla auditoría |

---

# PARTE 7: GITHUB ISSUES LISTOS (60 Issues)

## P0 - SEGURIDAD (10 issues) - Esta Semana

### Issue #1
```markdown
## 🔴 [SECURITY] Migrar autenticación a Supabase Auth
**Prioridad:** P0 - CRÍTICO
**Estimación:** 3 días
**Labels:** security, backend, breaking-change

### Descripción
Actualmente hay 9 usuarios con contraseñas hardcodeadas en `authService.ts` líneas 71-174.

### Archivos a modificar
- `services/authService.ts`
- `components/auth/AuthWrapper.tsx`
- `components/auth/LoginPage.tsx`

### Criterios de aceptación
- [ ] 0 passwords en código fuente
- [ ] Usuarios migrados a Supabase Auth
- [ ] Login/logout funciona correctamente
- [ ] Tests de autenticación pasan
```

### Issue #2
```markdown
## 🔴 [SECURITY] Implementar bcrypt para hashing
**Prioridad:** P0 - CRÍTICO
**Estimación:** 1 día
**Labels:** security

### Descripción
El hashing actual usa `btoa()` (Base64) que es reversible.

**Código actual (inseguro):**
```typescript
// authService.ts:189
const hashPassword = (password: string): string => {
  return btoa(password + '_litper_salt_2024');
};
```

### Criterios de aceptación
- [ ] bcryptjs instalado
- [ ] hashPassword usa bcrypt.hash(pw, 12)
- [ ] verifyPassword usa bcrypt.compare()
- [ ] Passwords existentes re-hasheados
```

### Issue #3
```markdown
## 🔴 [SECURITY] Mover API keys al backend (proxy)
**Prioridad:** P0 - CRÍTICO
**Estimación:** 2 días
**Labels:** security, backend, frontend

### Descripción
Las siguientes API keys están expuestas en el frontend:
- Chatea: `chateaService.ts:10`
- Claude: `claudeService.ts:8`
- Gemini: usado via `import.meta.env`

### Solución
Crear endpoint proxy `/api/ai/chat` que use las keys internamente.

### Criterios de aceptación
- [ ] Endpoint `/api/ai/chat` creado
- [ ] Endpoint `/api/messaging/whatsapp` creado
- [ ] 0 API keys en bundle frontend
- [ ] DevTools no muestra keys
```

### Issue #4
```markdown
## 🔴 [SECURITY] Configurar CORS específico
**Prioridad:** P0 - ALTO
**Estimación:** 2 horas
**Labels:** security, backend

### Archivo
`backend/main.py:254`

### Cambio
```python
# De
allow_origins=["*"]

# A
ALLOWED_ORIGINS = [
    "https://litper-pro.vercel.app",
    "https://app.litper.co",
    "http://localhost:5173",  # Solo en dev
]
```

### Criterios de aceptación
- [ ] Solo dominios autorizados pueden acceder
- [ ] Desarrollo local sigue funcionando
- [ ] Prueba desde dominio no autorizado falla
```

### Issue #5
```markdown
## 🔴 [SECURITY] Implementar HMAC para webhooks
**Prioridad:** P0 - ALTO
**Estimación:** 1 día
**Labels:** security, integrations

### Descripción
La verificación actual es fake:
```typescript
// webhookService.ts:316
return signature.length > 0 && secret.length > 0; // No verifica nada!
```

### Solución
```typescript
import crypto from 'crypto';

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(`sha256=${expected}`));
}
```

### Criterios de aceptación
- [ ] HMAC SHA256 implementado
- [ ] Secrets configurados por transportadora
- [ ] Webhooks sin firma válida rechazados con 401
```

### Issue #6-10: Más issues de seguridad
```markdown
#6: Tokens httpOnly cookies (2 días)
#7: Rate limiting con slowapi (1 día)
#8: Sanitizar PII en logs (1 día)
#9: Audit trail para acciones críticas (2 días)
#10: Rotación de secrets (1 día)
```

---

## P1 - INTEGRIDAD DE DATOS (10 issues) - Semanas 2-3

### Issue #11
```markdown
## 🟠 [DATA] Implementar idempotency_key en webhooks
**Prioridad:** P1
**Estimación:** 2 días
**Labels:** data-integrity, backend

### Descripción
Los webhooks pueden procesarse múltiples veces sin deduplicación.

### Solución
1. Agregar columna `event_id` con UNIQUE constraint
2. Verificar existencia antes de procesar
3. Retornar 200 OK si ya existe

### Criterios de aceptación
- [ ] Columna event_id en tabla webhooks
- [ ] UNIQUE constraint activo
- [ ] Webhook duplicado retorna 200 sin reprocesar
```

### Issue #12
```markdown
## 🟠 [DATA] Sistema de reconciliación Dropi-Transportadoras
**Prioridad:** P1
**Estimación:** 1 semana
**Labels:** data-integrity, integrations

### Descripción
Estados pueden desincronizarse entre Dropi y transportadoras.

### Solución
- Cron job cada 15 minutos
- Comparar estados
- Detectar discrepancias
- Auto-resolver casos simples
- Alertar casos complejos

### Criterios de aceptación
- [ ] Job ejecuta cada 15 min
- [ ] Reporte de discrepancias disponible
- [ ] < 5% de discrepancias después de 1 semana
```

### Issue #13-20: Más issues de integridad
```markdown
#13: Retry con backoff exponencial (2 días)
#14: Dead letter queue para webhooks fallidos (2 días)
#15: Normalización de estados de transportadoras (3 días)
#16: Validación de payload webhook (1 día)
#17: Timeout configurable por integración (1 día)
#18: Circuit breaker para Chatea (2 días)
#19: Fallback a polling cuando webhook falla (2 días)
#20: Logs estructurados con correlation_id (2 días)
```

---

## P1 - REFACTORIZACIÓN (10 issues) - Semanas 3-4

### Issue #21
```markdown
## 🟠 [REFACTOR] Dividir SeguimientoTab en componentes
**Prioridad:** P1
**Estimación:** 5 días
**Labels:** refactor, frontend

### Descripción
`SeguimientoTab.tsx` tiene 2,227 líneas (max recomendado: 300).

### Componentes a crear
1. `SeguimientoHeader.tsx` (~200 líneas)
2. `GuiaTable.tsx` (~400 líneas)
3. `GuiaFilters.tsx` (~150 líneas)
4. `GuiaReviewPanel.tsx` (~200 líneas)
5. `SeguimientoSheets.tsx` (~150 líneas)
6. `SeguimientoActions.tsx` (~100 líneas)

### Criterios de aceptación
- [ ] Cada componente < 400 líneas
- [ ] SeguimientoTab < 300 líneas
- [ ] Tests de componentes
- [ ] Funcionalidad idéntica
```

### Issue #22-30: Más issues de refactorización
```markdown
#22: Integration Gateway pattern (1 semana)
#23: Error handling global (3 días)
#24: Paginación server-side (4 días)
#25: Virtualización de tablas (2 días)
#26: Lazy loading de tabs (2 días)
#27: Code splitting por ruta (2 días)
#28: Optimizar queries N+1 (3 días)
#29: Cache Redis para stats (2 días)
#30: React.memo para listas (1 día)
```

---

## P2 - SKILLS IA (15 issues) - Semanas 5-8

### Issue #31
```markdown
## 🟢 [FEATURE] Skill: Conciliar Estados
**Prioridad:** P2
**Estimación:** 3 días
**Labels:** feature, ai, skills

### Descripción
Skill para sincronizar estados entre Dropi y transportadoras.

### Input Schema
```typescript
{
  fecha_inicio?: string;
  fecha_fin?: string;
  transportadora?: string;
}
```

### Output Schema
```typescript
{
  discrepancias: Discrepancy[];
  acciones: ['sync_all', 'sync_one', 'export'];
}
```

### Criterios de aceptación
- [ ] Skill detecta por keywords: conciliar, sincronizar, comparar
- [ ] Muestra tabla de discrepancias
- [ ] Botón "Sincronizar" funciona
- [ ] Log de acciones
```

### Issue #32-45: Skills adicionales
```markdown
#32: Skill recotizar (3 días)
#33: Skill anomalías ML (5 días)
#34: Skill priorizar (2 días)
#35: Skill mensaje_cliente (2 días)
#36: Skill clasificar_novedad (3 días)
#37: Skill transportadora_optima (3 días)
#38: Skill proyección (3 días)
#39: Skill comparar_periodos (2 días)
#40: Skill cliente_vip (2 días)
#41: Skill devolución (3 días)
#42: Skill reasignar (2 días)
#43: Skill escalar (2 días)
#44: Skill tendencias (3 días)
#45: Skill automatizar_regla (5 días)
```

---

## P2 - UX/UI (10 issues) - Semanas 7-10

### Issue #46
```markdown
## 🟢 [UX] Modo seguro para IA (SafeMode)
**Prioridad:** P2
**Estimación:** 1 semana
**Labels:** ux, ai

### Descripción
4 niveles de autonomía para la IA:
1. SUGGEST_ONLY: Solo sugiere
2. CONFIRM_ALWAYS: Confirma todo
3. CONFIRM_CRITICAL: Solo críticos
4. AUTONOMOUS: Ejecuta solo

### Criterios de aceptación
- [ ] Selector de modo en configuración
- [ ] Modal de confirmación para acciones
- [ ] Acciones de alto riesgo siempre confirman
- [ ] Log de todas las acciones
```

### Issue #47-55: Más issues de UX
```markdown
#47: Chat-First como home (5 días)
#48: Toast notifications (2 días)
#49: Error boundaries (2 días)
#50: Estados vacíos con CTA (2 días)
#51: Skeleton loaders (2 días)
#52: Modo offline banner (1 día)
#53: Undo para acciones (3 días)
#54: Búsqueda global Cmd+K (3 días)
#55: Sidebar colapsable (2 días)
```

---

## P3 - OBSERVABILIDAD (5 issues) - Semanas 10-12

### Issue #56-60
```markdown
#56: Métricas Prometheus (3 días)
#57: Dashboards Grafana (3 días)
#58: Alertas críticas PagerDuty (2 días)
#59: Tracing distribuido (5 días)
#60: Health checks endpoints (1 día)
```

---

# PARTE 8: ROADMAP VISUAL

```
SEMANA 1 ─────────────────────────────────────────────────────────
│ P0 SEGURIDAD                                                    │
│ ├── #1 Supabase Auth (3d)                                      │
│ ├── #2 bcrypt (1d)                                             │
│ ├── #3 API keys proxy (2d)                                     │
│ └── #4 CORS (2h)                                               │
│                                                                 │
│ Resultado: App segura, 0 vulnerabilidades críticas             │
─────────────────────────────────────────────────────────────────

SEMANAS 2-3 ──────────────────────────────────────────────────────
│ P1 INTEGRIDAD DE DATOS                                         │
│ ├── #5 HMAC webhooks                                           │
│ ├── #11 Idempotency keys                                       │
│ ├── #12 Reconciliación                                         │
│ └── #13 Retry con backoff                                      │
│                                                                 │
│ Resultado: 0 datos duplicados, 0 inconsistencias               │
─────────────────────────────────────────────────────────────────

SEMANAS 3-4 ──────────────────────────────────────────────────────
│ P1 REFACTORIZACIÓN                                             │
│ ├── #21 Dividir SeguimientoTab                                 │
│ ├── #22 Integration Gateway                                    │
│ └── #24 Paginación server-side                                 │
│                                                                 │
│ Resultado: Código mantenible, app rápida                       │
─────────────────────────────────────────────────────────────────

SEMANAS 5-8 ──────────────────────────────────────────────────────
│ P2 SKILLS IA                                                   │
│ ├── 6 skills core (conciliar, priorizar, mensaje, etc)        │
│ ├── 4 skills análisis (anomalías, proyección, etc)            │
│ └── 5 skills logística (recotizar, reasignar, etc)            │
│                                                                 │
│ Resultado: 24 skills, automatización real                      │
─────────────────────────────────────────────────────────────────

SEMANAS 9-12 ─────────────────────────────────────────────────────
│ P2 UX + P3 OBSERVABILIDAD                                      │
│ ├── SafeMode                                                   │
│ ├── Chat-First UI                                              │
│ ├── Métricas + Dashboards                                      │
│ └── Alertas                                                    │
│                                                                 │
│ Resultado: UX top global, visibilidad total                    │
─────────────────────────────────────────────────────────────────
```

---

# PARTE 9: MÉTRICAS DE ÉXITO

## Performance
| Métrica | Actual | Target | Método |
|---------|--------|--------|--------|
| p95 latency API | ~500ms | < 200ms | Redis cache |
| p95 latency UI | ~2s | < 1s | Virtualización |
| Error rate | ~5% | < 0.5% | Error handling |
| Webhook success | ~90% | > 99% | Retry + HMAC |

## Operaciones
| Métrica | Actual | Target | Método |
|---------|--------|--------|--------|
| Tiempo por novedad | 2-4h | < 30min | Skills IA |
| Discrepancias | ~10% | < 2% | Reconciliación |
| WhatsApp manual | 100% | < 10% | Automatización |
| Guías revisadas/día | ~200 | 1000+ | Paginación |

## Calidad
| Métrica | Actual | Target | Método |
|---------|--------|--------|--------|
| Test coverage | ~5% | > 60% | Tests |
| Security score | 3/10 | 9/10 | Fixes P0 |
| Skills activos | 9 | 24 | Implementación |

---

# PARTE 10: CHECKLIST FINAL

## Pre-Producción
```
□ CORS específico configurado
□ API keys movidas al backend
□ bcrypt implementado
□ HMAC en webhooks
□ Idempotency keys activas
□ Reconciliación funcionando
□ Tests de integración pasando
```

## Validación
```
□ Pen test básico pasado
□ Load test 1000 guías/día pasado
□ Webhook duplicado rechazado
□ Login/logout funciona
□ Skills responden < 2s
□ Errores muestran toast
□ Offline mode visible
```

## Documentación
```
□ README actualizado
□ .env.example completo
□ API docs en /docs
□ Runbook de incidentes
□ Guía de contribución
```

---

*Plan creado por Claude (Opus 4.5) - 29 de Diciembre 2024*
*Total: 60 GitHub Issues | 12 semanas | Resultado: Top Global*
