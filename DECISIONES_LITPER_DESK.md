# Decisiones de arranque — LITPER DESK

> Branch: `claude/order-management-desktop-app-aajeM`
> Fecha: 2026-05-08
> Cierra las 7 preguntas abiertas de `PLAN_LITPER_DESK.md` §11.

---

## 1. Decisiones tomadas

| # | Pregunta | Respuesta |
|---|----------|-----------|
| 1 | Punto de partida | **Consolidar prototipos existentes** (`/electron/` como base + UI de `/litper-pedidos-app/`, archivar `/litper-tracker/`) |
| 2 | Supabase | **Son orgs distintas** — federar via Edge Functions, no migrar |
| 3 | Conectores Fase 7 | **WhatsApp Business Cloud** (único priorizado por ahora) |
| 4 | Modelo de producto | **Interno ahora, SaaS después** — multi-tenant ready desde día 1 (RLS `org_id`), sin Stripe/landing |
| 5 | Mac signing | **No** — solo Windows + Linux |
| 6 | MCP Server | **Privado** del equipo Litper |
| 7 | Distribución | **Canal interno** (Drive / WhatsApp), sin auto-update automático |

---

## 2. Implicaciones clave

### Lo que SE SIMPLIFICA respecto al plan original
- ❌ Sin Apple Developer ID → fuera notarización macOS, fuera build Mac (Fase 8 más liviana).
- ❌ Sin auto-updater (electron-updater) → fuera bucket S3/R2, fuera landing de descargas.
- ❌ Sin Stripe / pricing / onboarding multi-step → semáforo ya tiene su propio Stripe, LITPER DESK no compite.
- ❌ Sin tools MCP públicos → sin docs públicas ni publicación a npm; solo binario interno.
- ❌ Conectores Fase 7 reducido a 1 (WhatsApp). Shopify/Bling/Nuvemshop/Meta Ads → backlog post-MVP.

### Lo que SE COMPLICA
- ⚠️ Dos orgs Supabase distintas → no se puede hacer JOIN nativo entre `seguimiento.*` y `semaforo.*`. Solución: cliente Supabase dual + agregación en el cliente (o Edge Function que llama a las dos).
- ⚠️ Multi-tenant ready desde día 1 → todas las tablas nuevas con `org_id NOT NULL`, todas las queries con RLS, todas las suscripciones Realtime filtradas. Más disciplina ahora pero ahorra una migración dolorosa después.

### Lo que SE MANTIENE
- ✅ Halo + Comando + Tray (3 modos de ventana).
- ✅ Botón Semáforo siempre visible con WebContentsView embebido + SSO.
- ✅ Buscador global Ctrl+K federado.
- ✅ Screenshots con anotación dinámica + container queries.
- ✅ MCP Server "Litper Hub" (privado, embebido en Electron).
- ✅ Gestión de equipo de rondas con timer + contadores.

---

## 3. Arquitectura ajustada para Supabase dual

```
┌──────────────────────────────────────────────────────┐
│              LITPER DESK (Electron)                  │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │     packages/supabase-dual-client              │ │
│  │  ┌─────────────────┐  ┌─────────────────┐    │ │
│  │  │ supabaseAsda    │  │ supabaseSemaforo│    │ │
│  │  │ (org A)         │  │ (org B)         │    │ │
│  │  └─────────────────┘  └─────────────────┘    │ │
│  │                                                │ │
│  │  unifiedAuth() → login una vez, dos sesiones  │ │
│  │  unifiedQuery() → fan-out + merge en cliente  │ │
│  └────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
        │                              │
        ▼                              ▼
┌─────────────────────┐    ┌────────────────────────┐
│  Supabase ASDA      │    │  Supabase Semáforo     │
│  (org A)            │    │  (gtsivwbnhcawvmsfujby)│
│                     │    │                        │
│  seguimiento.*      │    │  organizations         │
│  desk.*             │    │  city_stats            │
│  team.*             │    │  carrier_stats         │
│  rondas.*           │    │  uploads               │
│                     │    │  ai_analyses           │
└─────────────────────┘    └────────────────────────┘
```

**Login unificado**: el usuario hace login una vez en LITPER DESK; el cliente dual hace dos llamadas `signInWithPassword` en paralelo (mismo email/pass) y mantiene dos sesiones. Si una falla, se loguea solo en la otra y muestra warning.

**Vista global**: en lugar de view SQL, una función TypeScript en `packages/supabase-dual-client/src/aggregations.ts` hace fan-out:

```typescript
async function getDashboardGlobal(date: string) {
  const [rondas, semaforo] = await Promise.all([
    supabaseAsda.from('rondas_dia').select('*').eq('fecha', date),
    supabaseSemaforo.from('city_stats').select('semaforo,count').eq('fecha', date)
  ]);
  return mergeKpis(rondas.data, semaforo.data);
}
```

**Realtime**: dos canales separados, eventos consolidados en un solo Zustand store del renderer.

---

## 4. Stack final ajustado

| Capa | Tecnología | Cambio vs plan original |
|------|------------|------------------------|
| Shell | Electron 33 | igual |
| UI | React 19 + TS + Vite | igual |
| Estado | Zustand | igual |
| Realtime | Supabase Realtime (×2 canales) | dual channel |
| Estilos | Tailwind + Container Queries | igual |
| Animación | Framer Motion | igual |
| Captura | desktopCapturer + Konva.js | igual |
| OCR | tesseract.js | igual |
| Búsqueda | MiniSearch + Supabase FTS | dual-source |
| Command Palette | cmdk-react | igual |
| MCP | @modelcontextprotocol/sdk | privado, embebido |
| Persistencia local | electron-store + better-sqlite3 | igual |
| ~~Auto-update~~ | ~~electron-updater~~ | **eliminado** (canal interno) |
| Build | electron-builder | sin Mac, sin notarización |
| Distribución | Drive + WhatsApp | sin landing, sin S3 |
| ~~Stripe~~ | — | **eliminado** (Fase SaaS futura) |

---

## 5. Plan revisado por fases (ajustado)

| Fase | Duración | Cambio vs plan original |
|------|----------|------------------------|
| 0 — Consolidación | 3-5 días | Recomendación reforzada: usar `/electron/` + `/litper-pedidos-app/`, archivar `/litper-tracker/` |
| 1 — Halo + Tray + Atajos | 1 sem | igual |
| 2 — Equipo + Rondas | 1 sem | igual, RLS multi-tenant desde el inicio |
| 3 — Botón Semáforo | 1 sem | + cliente Supabase dual |
| 4 — Buscador Ctrl+K | 3 días | + fan-out a 2 orgs Supabase |
| 5 — Screenshots + anotación | 1.5 sem | igual |
| 6 — MCP Hub privado | 1 sem | sin docs públicas, sin npm publish |
| 7 — Conector WhatsApp Cloud | 3-4 días | **simplificado** (solo 1 conector) |
| 8 — Distribución Win+Linux | 2-3 días | sin Mac, sin notarización, sin auto-update; instaladores manuales en Drive |

**Total estimado revisado**: ~7-8 semanas (vs 10 semanas del plan original).

---

## 6. Tareas concretas para arrancar la Fase 0 (próximos pasos)

### Auditoría de los 3 prototipos
- [ ] Comparar `electron/main.js` (raíz) vs `litper-pedidos-app/electron/main.js` y elegir el más completo como punto único.
- [ ] Listar componentes únicos en `litper-pedidos-app/src/components/` que se importarán al desktop unificado.
- [ ] Revisar `litper-tracker/src/` para confirmar que no hay nada salvable; archivar.

### Consolidación
- [ ] Mover el desktop unificado a `apps/desktop/` o mantenerlo en `/electron/` + `/litper-pedidos-app/` fusionados (decisión de implementación, no de plan).
- [ ] Setup pnpm workspaces si vamos por monorepo, o package.json unificado si vamos por consolidación in-place.
- [ ] Borrar `/litper-tracker/` con commit explícito (`chore: archive litper-tracker prototype, superseded by LITPER DESK`).

### Cliente Supabase dual
- [ ] Crear `packages/supabase-dual-client` (o `lib/supabase-dual.ts` si no monorepo).
- [ ] Confirmar las URLs y anon keys de ambas orgs (`.env.example` ya tiene la del semáforo: `gtsivwbnhcawvmsfujby`).
- [ ] Login unificado con manejo de fallback si una org falla.

### Multi-tenant ready
- [ ] Migración SQL: agregar `org_id NOT NULL` + `created_by` a todas las tablas nuevas en la org de ASDA.
- [ ] Definir policies RLS estándar: `org_id = auth.jwt() ->> 'org_id'`.
- [ ] Documentar en CLAUDE.md del repo asda3eeee la regla "toda tabla nueva debe tener org_id".

### Renderer base
- [ ] Bootstrap React 19 + Vite + Tailwind + Zustand en el desktop unificado.
- [ ] Implementar 3 modos (Halo / Comando / Tray) con state machine simple.
- [ ] Container queries en CSS para que cada widget se reorganice por su contenedor.

---

## 7. Antes de codear: confirmaciones operativas pendientes

Antes de la Fase 0, necesito 3 datos concretos que aún no tenemos:

1. **Credenciales de la otra org Supabase** (la de ASDA3EEEE) — URL + anon key. Puedes ponerlas en un comentario del PR o en `.env.backend` (que ya está en el repo pero no leí su contenido por seguridad).
2. **Lista del equipo con roles**: cuál es admin, supervisor, operador. Usar para seedear `team.users`.
3. **Token de WhatsApp Business Cloud API** (System User Access Token + Phone Number ID). Solo se necesita en Fase 7, pero conviene solicitarlo ya en Meta Business Manager — el aprovisionamiento puede tardar días.

---

> **Próximo paso**: confirmar los 3 datos operativos arriba y arrancar Fase 0 (auditoría + consolidación de prototipos). Tiempo estimado de Fase 0: 3-5 días.
