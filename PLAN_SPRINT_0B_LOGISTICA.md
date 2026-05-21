# PLAN SPRINT 0B + SPRINT 1 — LITPER DESK Logística

> Branch: `claude/order-management-desktop-app-aajeM`
> Trigger: feedback del usuario sobre v0.2.0 + Supabase MCP recién verificado.
> Versión objetivo: LITPER DESK v0.3.0 (Sprint 0B) → v1.0.0 (Sprint 1 con backend real).

---

## 0. ⚠️ Hallazgo crítico de seguridad (atender ANTES de Sprint 1)

El Supabase `gtsivwbnhcawvmsfujby` ("LITPER PRO APP") tiene **7 tablas con RLS deshabilitado** según el advisor automático de Supabase. **Cualquiera con la anon key puede leer y modificar TODAS las filas de estas tablas**:

```
public.club_litper
public.club_beneficios_usados
public.pagos_digitales
public.competitor_landings
public.ab_tests
public.brain_memory  (24 filas con datos activos)
public.litper_machines (8 filas con datos activos)
```

`brain_memory` y `litper_machines` son las más sensibles porque tienen datos del cerebro autónomo en producción.

**Acción requerida ANTES de Sprint 1**: revisar estas tablas, definir políticas RLS (no solo activar sin política — eso bloquea todo acceso), y aplicar. Yo NO voy a hacer auto-fix porque romperia el acceso. Lo discutimos en sesión aparte.

---

## 1. Estado actual del Supabase (lo que YA existe)

Inspeccioné el proyecto activo. Hay **80+ tablas** ya creadas. Las relevantes para LITPER DESK:

### Operación / pedidos
- `public.orders_pipeline` — pipeline de pedidos (vacía hoy)
- `public.cargas` — cargas (vacía)
- `public.guias` — guías
- `public.dropi_imports` — import desde Dropi
- `public.conciliacion_cod` — conciliación COD
- `public.voice_calls` — registro de llamadas
- `public.agent_runs` — corridas de agente IA

### Logística semáforo
- `public.city_stats`, `public.city_scores`, `public.carrier_stats`
- `public.uploads` — uploads de Excel
- `public.ai_analyses` — análisis IA persistidos

### Equipo / gamificación (esto SÍ lo podemos reusar)
- `public.profiles`, `public.auth_profiles`
- `public.organizations` (multi-tenant ya listo)
- `public.tenants` (1 fila)
- `public.mc_members`, `public.mc_missions`, `public.mc_completions`, `public.mc_kpi_weeks`, `public.mc_user_state`, `public.mc_checkins`, `public.mc_highfives`, `public.mc_notes`, `public.mc_audit_log`, `public.mc_settings`
- `public.missions`, `public.mission_completions`, `public.kpi_entries`, `public.checkins`, `public.high_fives`, `public.notes`, `public.quest_claims`

> **🎯 Hallazgo**: el sistema `mc_*` ("Mission Control") y `kpi_entries` parece ser un módulo de gamificación que YA EXISTE. Antes de crear tablas nuevas para rondas, necesito leer su estructura y ver si podemos reutilizarlo. Posiblemente lo único nuevo que tenemos que crear son:
> - `desk_rondas` — la entidad central de una ronda de pedidos
> - `desk_novedades_detalle` — sub-tipos de novedad

### CEO autónomo (en producción)
- `public.ceo_actions_log` (47 filas activas)
- `public.ceo_tasks` (15 filas)
- `public.ceo_daily_metrics` (14 filas)
- `public.ceo_reports` (15 filas)

### Brain
- `public.brain_memory` (24 filas, ⚠️ RLS off)
- `public.litper_machines` (8 filas, ⚠️ RLS off)

---

## 2. Cambios pedidos en el feedback de hoy

### A. Todas las exportaciones en Excel
- Excel del día actual (ya existe)
- **NUEVO**: Excel por operador específico (filtrable)
- **NUEVO**: Excel de novedades del día con sub-tipos
- **NUEVO**: Excel comparativo semanal (lun-dom con tasas)
- **NUEVO**: Excel finalizar día (resumen + detalle + novedades en hojas separadas)

### B. Más estadísticas debajo de "Guardar ronda"
Basadas en **1 pedido ≈ 3 min**:
- **Realizados totales** del día
- **Iniciales totales** del día
- **Rondas guardadas** del día
- **Pendientes acumulados**
- **Score** = (realizado_total / esperado_según_tiempo) × 100
  - esperado_según_tiempo = minutos_jornada_acumulada / 3
- **Velocidad real** (pedidos/min)
- **Estimación al cierre**: si sigue al ritmo actual → X pedidos al final
- **Mejor hora del día**
- **Racha** (días seguidos cumpliendo meta)

### C. Sección Novedades expandida
Hoy es 1 contador único. Se convierte en un grupo con sub-tipos seleccionables:
- 📵 Cliente no contesta
- 🚪 Cliente ausente
- 📍 Dirección errada
- 📅 Devolver al día siguiente
- ❌ Rechazo
- 🏠 Cambio de dirección
- ⏰ Cambio de fecha
- 🚫 Cliente cancela
- 📦 Reentrega
- ❓ Otro (con texto libre)

Cada novedad guarda su sub-tipo. El Excel agrupa.

### D. Vistas funcionales DE VERDAD (5 modos)
**Selector**, **Sidebar**, **Taskbar**, **Ventana**, **Comando**.

Detalle abajo en §4.

### E. Estilo más llamativo + animaciones
- Pantalla Selector con animación de entrada cinematográfica
- Avatares grandes con halo glow del color del operador
- Transiciones de modo con Framer Motion spring
- Confetti al cumplir meta del día
- Pulso del semáforo más vibrante

---

## 3. Referentes investigados (USA + Brasil)

### USA — Contact center performance management
| Producto | Lo que tomamos |
|----------|---------------|
| **Genesys** (líder enterprise) | Gamification + performance tracking + agent assist + workforce planning |
| **NICE CXone** | Governance + quality management + speech analytics |
| **Five9** | AI agent assist + live call summaries + real-time coaching |
| **AmplifAI** | Role-based dashboards (cada nivel ve sus KPIs) |
| **Locus.sh** | Delivery performance live + first-attempt success |

**KPIs estándar USA 2026** que vamos a soportar:
- FCR (First Call Resolution) — equivalente nuestro: **Tasa de cierre en primer intento**
- ASA (Average Speed of Answer) → no aplica directo, sustituimos por **tiempo medio entre llamadas**
- AHT (Average Handle Time) — para nosotros **AHT por pedido = 3 min objetivo**
- Adherence to schedule → **adherencia al horario de turno**
- Real-time agent activity dashboard → **Comando view**

### Brasil — Call center cobrança + dispatch
| Producto | Lo que tomamos |
|----------|---------------|
| **Zendesk Brasil** (líder) | Dashboard de atendimento, agentes en tempo real |
| **NativeIP** | Indicadores call center, TMA en cobrança |
| **ActivOx** | 7 pasos de produtividade |
| **VoIPstudio** | Medir produtividade do call center |
| **AgiDesk** | Plataforma de gerenciamento de atendimentos |
| **Nuvemshop / Melhor Envio** | Panel logístico unificado + tracking integrado |

**KPIs estándar Brasil 2026**:
- TMA (Tempo Médio de Atendimento) — equivalente al AHT
- Painel em tempo real com agentes ativos
- SLA manager filtrado por categoría
- Productividad por agente o equipo

### Decisión arquitectónica
LITPER DESK combina lo mejor de ambos mundos:
- **Genesys gamification**: el Score por min + racha + meta del día (usar `mc_*` existente).
- **Five9 Agent Assist**: el Coach IA del panel Comando.
- **NativeIP painel em tempo real**: vista Comando con todos los operadores activos.
- **Zendesk dashboards**: vistas role-based (admin ve todo, operator ve lo suyo).

---

## 4. Las 5 vistas redefinidas

> Reglas de oro:
> 1. **Cero feature loss** al cambiar de modo. Todas las opciones siempre accesibles via atajo o menú compacto.
> 2. **Letra base 11px** (operator) / 10px (taskbar) / 9px (micro).
> 3. **Sin límites de redimensionamiento** — el usuario manda. min: 120×60, max: tamaño de pantalla.
> 4. **Container queries** — cada widget se reorganiza por su contenedor padre.

### 4.0. Modo SELECTOR (pantalla inicial al abrir la app)

Al primer arranque del día o tras "Cambiar usuario":
```
┌─ LITPER DESK ─────────────────────────────────┐
│  🌅 Buenos días                                │
│  ¿Quién está trabajando hoy?                   │
│                                                │
│   [JF]      [CT]      [JM]      [FL]           │
│   Jefer    Catalina   Jimmy    Felipe          │
│   admin     admin     super.   operador        │
│                                                │
│   [AN]      [KR]      [ER]      [+]            │
│   Angie    Karen     Erika    Agregar          │
│                                                │
│  ──────────────────────────────────────────    │
│  ¿Qué vas a hacer hoy?                         │
│  [ 📞 Rondas de pedidos ]  [ 🆕 Novedades ]    │
│                                                │
│  Stats globales del día:                       │
│  · 12 rondas guardadas                         │
│  · Tasa actual: 78.4%                          │
│  · Mejor: Catalina con 23 OK                   │
└────────────────────────────────────────────────┘
```

- Avatares grandes 64×64 con glow del color del operador (animación de hover lift + scale).
- 2 botones cinematográficos: "Rondas" / "Novedades" — define el flujo del día.
- Header dinámico ("Buenos días", "Buenas tardes", etc.).
- Stats globales del día visibles si ya hay datos.
- Animación de entrada: fade-in escalonado de avatares (0.05s entre cada uno).
- **Recordar selección**: al cerrar y reabrir, salta directo al modo activo del último uso.

### 4.1. Modo SIDEBAR (lateral vertical, snap a borde izq/der)

Ancho ~200-300px (redimensionable sin límite), alto = pantalla completa.
```
┌──────────────────┐
│ LP  LITPER       │  ← logo + marca compacto
│ 🟡 — □ ✕         │  ← semáforo + controles
├──────────────────┤
│  JF Jefer ▼      │  ← operador activo
├──────────────────┤
│      30:00       │  ← timer
│  ▶ Iniciar  ↻ 🔍 │
├──────────────────┤
│  📞 0  ─ 0 +     │  ← 8 contadores apilados verticalmente
│  ✅ 4  ─ 4 +     │     letra 11px, alto 28px cada uno
│  ❌ 0  ─ 0 +     │
│  📅 0  ─ 0 +     │
│  ⚠ 0  ─ 0 +     │
│  ⏳ 0  ─ 0 +     │
│  👁 0  ─ 0 +     │
│  🆕 2  ─ 2 +     │
├──────────────────┤
│ TASA  CPA  RACHA │  ← KPIs en 3 mini-cards
│ 80%   $18k  1d   │
├──────────────────┤
│ SCORE: 73        │  ← NUEVO: score sobre 100
│ ▓▓▓▓▓▓▓░░░       │
├──────────────────┤
│ 💾 Guardar ronda │
│ ↻ Reiniciar día  │
│ ⬇ Excel ▾        │  ← dropdown: dia, op, novedades, semana
│ 🔌 Conexiones    │
│ 📄 Finalizar día │
├──────────────────┤
│ Sparkline ▁▂▃▅▆▇ │  ← realizados últimas 12 rondas
└──────────────────┘
```

Snap a borde izq o der. Ideal para tener siempre visible mientras se trabaja en otra app.

### 4.2. Modo TASKBAR (barra horizontal slim)

Ancho ~1100-1700px (redimensionable), alto ~64-80px. Flota arriba/abajo de la pantalla como una segunda taskbar.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ LP | JF Jefer | ⏱ 30:00 ▶ | 📞0 ✅4 ❌0 📅0 ⚠0 ⏳0 👁0 🆕2 | T 80% C$18k R1d | S 73 | 💾 ↻ ⬇ 🔌 📄 | 🟡 ─ ✕ │
└──────────────────────────────────────────────────────────────────────────────┘
```

Layout horizontal estricto, todos los elementos accesibles. Letra 10px. Ideal para usuarios con monitor ultra-wide o que prefieren no perder vertical space.

### 4.3. Modo VENTANA (la actual, mejorada)

380×620 default pero **sin límites** de redimensionamiento. Cuando el usuario la achica < 280px ancho, los contadores cambian a 1 columna automáticamente (container queries). Cuando la agranda > 500px, los contadores se distribuyen en 4 columnas con KPIs ampliados.

Esto resuelve "el recuadro se pueda alargar y achicar sin límite con control total".

### 4.4. Modo COMANDO (workbench expandido)

Default 1280×800 pero también sin límites. Es la vista de supervisor con:
- Sidebar de navegación (Rondas, Equipo, Semáforo, Marketing, Inbox, Knowledge, Reportes, Conexiones, Ajustes)
- Centro con la ronda actual + dashboard tipo Genesys
- Panel derecho con Coach IA + Top 5 ciudades + rondas en vivo de TODO el equipo (estilo painel em tempo real Brasil)

---

## 5. Nuevas estadísticas (math y fórmulas)

### Constantes
```typescript
const AHT_OBJETIVO_MIN = 3;          // 1 pedido cada 3 min
const META_TASA = 0.805;             // 80.5%
const CPA_DIVIDEND_COP = 15_000;     // CPA = 15k / tasa
const JORNADA_DEFAULT_HORAS = 8;
```

### Fórmulas
```typescript
// Score basado en velocidad real vs objetivo
const minutosTrabajados = (rondasHoy + activa).sum(r => r.durationSecEfectivo) / 60;
const esperados = minutosTrabajados / AHT_OBJETIVO_MIN;
const realizadosTotal = sum(rondasHoy.realizado) + countersActuales.realizado;
const score = Math.min(100, (realizadosTotal / Math.max(esperados, 1)) * 100);

// Velocidad real
const velocidadPedidosPorMin = realizadosTotal / Math.max(minutosTrabajados, 1);

// Estimación al cierre
const minutosRestantes = (JORNADA_DEFAULT_HORAS * 60) - minutosTrabajados;
const estimacionFinal = realizadosTotal + (minutosRestantes * velocidadPedidosPorMin);

// Pendientes acumulados (suma de rondas + actuales)
const pendientesTotal = sum(rondasHoy.pendientes) + countersActuales.pendientes;
```

### UI debajo de Guardar ronda
```
┌─────────────────────────────────────────────────┐
│ 💾 Guardar ronda            18 ✅ / 25 📞       │
├─────────────────────────────────────────────────┤
│ STATS DEL DIA                                   │
│ ╭─────────╮ ╭─────────╮ ╭─────────╮ ╭────────╮ │
│ │ TASA    │ │ CPA     │ │ SCORE   │ │ RACHA  │ │
│ │ 78.4%   │ │ $19.1k  │ │ 73/100  │ │ 1 día  │ │
│ ╰─────────╯ ╰─────────╯ ╰─────────╯ ╰────────╯ │
│ Realizados:  47  · Rondas:  12  · Pendientes: 8 │
│ Velocidad:  0.38 ped/min                        │
│ Estimación cierre:  72 pedidos (faltan 3h)      │
│ Mejor hora: 10:00–11:00 con 9 ✅                │
└─────────────────────────────────────────────────┘
```

---

## 6. Sección Novedades expandida

Cuando el contador 🆕 se incrementa, no solo suma — abre un mini-popup pidiendo el sub-tipo:

```
┌──────────────────────────┐
│ Nueva novedad           ✕│
├──────────────────────────┤
│ ⚪ 📵 Cliente no contesta│
│ ⚪ 🚪 Cliente ausente    │
│ ⚪ 📍 Dirección errada   │
│ ⚪ 📅 Reentregar mañana  │
│ ⚪ ❌ Rechazo            │
│ ⚪ 🏠 Cambio dirección   │
│ ⚪ ⏰ Cambio fecha       │
│ ⚪ 🚫 Cliente cancela    │
│ ⚪ 📦 Reentrega          │
│ ⚪ ❓ Otro:______        │
├──────────────────────────┤
│ Pedido # (opcional): ____│
│ Nota:    ________________│
│                          │
│        [ Guardar ]       │
└──────────────────────────┘
```

Click rápido (1-tap): el operador puede seleccionar el sub-tipo y guardar. Tiempo objetivo: <5s por novedad.

El historial de novedades del día se ve en una **pestaña dedicada "Novedades"** dentro del modo Comando (y accesible desde un atajo en sidebar/taskbar).

---

## 7. Migración Supabase (cuando aprueben)

**Estrategia: reusar lo que exista, agregar solo lo nuevo.**

Investigar primero: leer estructura de `mc_*` y `kpi_entries` para ver si nos sirve para rondas. **Si no**, crear estas 3 tablas nuevas en `public` schema (no schema separado para minimizar fricción):

```sql
-- Rondas (entidad central)
CREATE TABLE public.desk_rondas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  operador_id TEXT NOT NULL,
  numero INT NOT NULL,
  fecha DATE NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  duracion_seg INT NOT NULL,
  iniciales INT NOT NULL DEFAULT 0,
  realizado INT NOT NULL DEFAULT 0,
  cancelado INT NOT NULL DEFAULT 0,
  agendado INT NOT NULL DEFAULT 0,
  dificiles INT NOT NULL DEFAULT 0,
  pendientes INT NOT NULL DEFAULT 0,
  revisado INT NOT NULL DEFAULT 0,
  novedades INT NOT NULL DEFAULT 0,
  score NUMERIC(5,2),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX desk_rondas_fecha_idx ON public.desk_rondas(fecha, org_id);
CREATE INDEX desk_rondas_op_idx ON public.desk_rondas(operador_id, fecha);

ALTER TABLE public.desk_rondas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "desk_rondas org isolation"
  ON public.desk_rondas
  FOR ALL
  USING (org_id = (current_setting('request.jwt.claims', true)::json->>'org_id')::UUID);

-- Novedades con sub-tipo
CREATE TYPE desk_novedad_tipo AS ENUM (
  'no_contesta', 'cliente_ausente', 'direccion_errada',
  'reentregar', 'rechazo', 'cambio_direccion',
  'cambio_fecha', 'cancela', 'reentrega', 'otro'
);

CREATE TABLE public.desk_novedades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  ronda_id UUID REFERENCES public.desk_rondas(id) ON DELETE CASCADE,
  operador_id TEXT NOT NULL,
  fecha DATE NOT NULL,
  tipo desk_novedad_tipo NOT NULL,
  pedido_ref TEXT,
  nota TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX desk_novedades_fecha_idx ON public.desk_novedades(fecha, org_id);

ALTER TABLE public.desk_novedades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "desk_novedades org isolation"
  ON public.desk_novedades FOR ALL
  USING (org_id = (current_setting('request.jwt.claims', true)::json->>'org_id')::UUID);

-- Días cerrados
CREATE TABLE public.desk_dias_cerrados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  fecha DATE NOT NULL UNIQUE,
  cerrado_en TIMESTAMPTZ DEFAULT NOW(),
  cerrado_por TEXT,
  total_rondas INT,
  total_iniciales INT,
  total_realizado INT,
  total_novedades INT,
  tasa_final NUMERIC(5,4),
  score_final NUMERIC(5,2),
  cumplio_meta BOOLEAN
);

ALTER TABLE public.desk_dias_cerrados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "desk_dias org isolation"
  ON public.desk_dias_cerrados FOR ALL
  USING (org_id = (current_setting('request.jwt.claims', true)::json->>'org_id')::UUID);
```

**Yo NO voy a aplicar esto sin tu OK explícito** — tocar prod requiere aprobación clara.

---

## 8. Plan de ejecución

### Sprint 0B (en curso, 2-3 días) — sin Supabase
1. Pantalla Selector (avatares + Rondas vs Novedades + animaciones)
2. 5 modos de ventana (Sidebar, Taskbar, Ventana, Comando, Micro) + redimensionamiento ilimitado
3. Sub-tipos de Novedades + mini-popup
4. Más KPIs (Score, Velocidad, Estimación cierre, Mejor hora)
5. Excel multi-reporte (4 tipos)
6. Animaciones premium (transitions de modo + confetti meta + glow avatares)
7. Logo .ico (cuando descargues el PNG)
8. v0.3.0 distribuible

### Sprint 1 (1 semana) — con Supabase MCP + tu approval
1. Verificar estructura `mc_*` y `kpi_entries` — decidir reusar o crear nuevo
2. Aplicar las migraciones de §7 con `mcp__supabase__apply_migration`
3. Cliente Supabase en renderer (auth + Realtime)
4. Sincronizar rondas locales → cloud
5. Ranking del día en tiempo real entre operadores
6. Shadowing: supervisor ve ronda activa de operador
7. Webview embebido del semáforo con SSO
8. Endpoint `GET /api/semaforo-status` en repo semáforo
9. **Atender el RLS crítico de §0** (con plan de políticas, no auto-fix)

### Sprint 2-6 — sin cambio respecto a PLAN_MAESTRO_V2

---

## 9. Decisiones que necesito YA

| # | Pregunta | Bloquea |
|---|----------|---------|
| 1 | ¿Apruebas que aplique migraciones `desk_rondas`, `desk_novedades`, `desk_dias_cerrados` en `gtsivwbnhcawvmsfujby`? | Sprint 1 |
| 2 | ¿Prefieres que primero investigue si `mc_*` ya hace algo de esto y solo lo extendamos? | Sprint 1 |
| 3 | ¿El usuario por defecto al abrir LITPER DESK es siempre Jefer o saltamos al Selector? | Sprint 0B detalle |
| 4 | ¿El advisor crítico de RLS lo abordamos antes o después de la migración de rondas? | Seguridad |
| 5 | ¿La jornada laboral default es 8h o configurable por operador? | Cálculo de Score |
| 6 | ¿El AHT objetivo es 3 min fijo o configurable por tipo de pedido (rondas vs novedades)? | Cálculo de Score |

---

## 10. Sources investigados

- AmplifAI — [Call Center Productivity Guide 2026](https://www.amplifai.com/blog/call-center-productivity)
- JustCall — [30 Essential Call Center Metrics 2026](https://justcall.io/blog/call-center-metrics.html)
- Salesforce — [11 Top Call Center Metrics & KPIs](https://www.salesforce.com/service/contact-center/what-is-a-call-center/metrics/)
- Zoom — [38 must-know call center metrics 2026](https://www.zoom.com/en/blog/call-center-metrics/)
- Locus.sh — [Delivery Performance KPIs 2026](https://locus.sh/blogs/delivery-performance-kpi/)
- Gartner — [Five9 vs Genesys 2026](https://www.gartner.com/reviews/market/contact-center-as-a-service/compare/five9-vs-genesys)
- CXToday — [Genesys vs NICE vs Five9](https://www.cxtoday.com/contact-center/genesys-vs-nice-vs-five9/)
- AmplifAI — [10 Best Call Center Performance Management Software 2026](https://www.amplifai.com/blog/call-center-performance-management-software)
- Zendesk Brasil — [Principais indicadores de call center](https://www.zendesk.com.br/blog/principais-indicadores-call-center/)
- NativeIP — [Dashboard de atendimento](https://nativeip.com.br/dashboard-de-atendimento-indicadores-call-center/)
- ActivOx — [Produtividade no call center](https://activox.com.br/produtividade-no-call-center-7-passos-para-melhorar-o-atendimento/)
- VoIPstudio — [Como medir a produtividade do call-center](https://voipstudio.com/pt/blog/como-medir-a-produtividade-do-call-center/)
- E-Commerce Brasil — [Logística](https://www.ecommercebrasil.com.br/logistica)
- Nuvemshop — [Logística para e-commerce 2026](https://www.nuvemshop.com.br/blog/logistica-para-ecommerce/)
- Melhor Envio — [ME Envia 2026](https://melhorenvio.com.br/blog/sobre-nos/me-envia-2026/)
