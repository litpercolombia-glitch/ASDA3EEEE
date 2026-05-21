# PLAN MAESTRO v2 — LITPER DESK Completo

> Branch: `claude/order-management-desktop-app-aajeM`
> Fecha: 2026-05-20
> Trigger: feedback del usuario tras probar v0.1.0 en su PC.
> Reemplaza/consolida: PLAN_LITPER_DESK.md, DECISIONES_LITPER_DESK.md, PLAN_AVANZADO_LITPER_DESK.md.

---

## 0. Resumen ejecutivo

Lo que existe hoy (v0.1.0): Halo Electron mínimo con 7 contadores, timer y team picker local. **Es un chasis, no el producto.**

Lo que falta para que LITPER DESK sea **demasiado útil para cualquier empresa de e-commerce**: 30+ items, todos mapeados abajo a 15 superpoderes MCP que ya tenemos conectados.

Este plan los consolida en **6 sprints de 1 semana** + un primer entregable que se hace AHORA (Sprint 0).

---

## 1. Gap analysis — lo que falta

### A. Feedback directo del usuario (probando v0.1.0)
1. **4 tamaños de ventana** (Micro / Mini / Halo / Comando) — y los contadores deben sumarse en todos.
2. **Categoría "Novedades"** falta como 8º contador.
3. **Botón "Reiniciar día"** (resetea rondaNumero + KPIs + persiste cierre del día anterior).
4. **Descarga del Excel** del día / mes (xlsx export con todas las rondas).
5. **Botón "Conexiones"** (configurar Supabase, WhatsApp, Meta Ads, Shopify, etc.).
6. **Semáforo de ciudades funcional** con datos reales (hoy es un dot estático amarillo).
7. **Métricas importantes debajo de "Guardar ronda"** (tasa, CPA, racha, mejor hora).
8. **"Finalizar día" genera informe completo** (PDF + Excel + envío a Slack/Drive/WhatsApp).
9. **Logo .ico real** (LP+corona en gold, hoy es default Electron).

### B. Faltantes del plan previo (Fases 2-8 que aún no se ejecutaron)
10. Conexión Supabase real (ambas orgs: Semáforo + ASDA).
11. Cliente Supabase dual con SSO.
12. Botón Semáforo siempre visible con webview embebido.
13. Buscador global `Ctrl+K` federado.
14. Screenshots + anotación + formas + opacidad.
15. MCP Server Litper Hub embebido en Electron.
16. Conector WhatsApp Cloud (1-click chat con cliente).
17. Code signing + auto-update (cert EV pendiente).

### C. Las 12 ideas avanzadas (PLAN_AVANZADO §4)
18. Coach IA — Claude sugiere acción cada 15min.
19. Shadowing — supervisor ve ronda en vivo.
20. Macro recorder — graba secuencia WhatsApp y replay.
21. Voice command local — Whisper local, cero nube.
22. Heatmap operador × hora.
23. Pomodoro inteligente + Spotify.
24. PDF diario auto a Drive.
25. Widget Windows 11 lock-screen.
26. OCR → WhatsApp deeplink.
27. Calendar de turnos integrado.
28. Inbox unificado (Gmail + Slack + WhatsApp).
29. Sala de guerra en monitor 2.

### D. Diseño "más tecnológico y llamativo" (feedback usuario)
30. Glassmorphism + animated gradients + particle effects + sound design.
31. Animaciones premium (Framer Motion + spring physics).
32. Aurora background reactivo al estado del semáforo.
33. Data viz en tiempo real (sparklines, gauges, heatmaps).

---

## 2. Backend que YA existe (no hay que construir de nuevo)

Inspección de `/home/user/ASDA3EEEE/backend/`:

```
backend/
├── api/v2/                              ← API v2 lista
├── brain/                               ← motor IA con knowledge_system y ml_models
├── routes/
│   ├── auth_routes.py                   ← auth completa
│   ├── tracking_ordenes_routes.py       ← tracking de pedidos
│   ├── tracking_routes.py               ← tracking general
│   ├── tracker_routes.py                ← tracker (rondas?)
│   ├── whatsapp_routes.py               ← endpoints WhatsApp
│   ├── chatea_pro_routes.py             ← BSP ChateaPro (CO)
│   ├── webhook_routes.py                ← webhooks externos
│   ├── websocket_routes.py              ← Realtime WebSocket
│   ├── push_routes.py                   ← push notifications
│   ├── brain_routes.py                  ← brain IA
│   ├── rescue_routes.py                 ← rescate de pedidos
│   ├── ai_proxy_routes.py               ← proxy IA
│   └── carga_routes.py                  ← carga de archivos
├── integrations/
│   ├── chatea_pro.py                    ← integración ChateaPro
│   └── webhook_handler.py
├── excel_processor.py                   ← procesador Excel listo
├── reentrenamiento.py                   ← retraining ML
├── database_tracker.py                  ← tracker DB
└── workers/                             ← background jobs
```

**Implicación**: LITPER DESK no tiene que construir backend nuevo. Solo:
1. Apuntar al backend que ya corre en `localhost:8000` (dev) o producción.
2. Crear `packages/api-client/` que envuelve las rutas existentes con typed methods.
3. Las nuevas features (Coach IA, Shadowing, etc.) suman endpoints, no nuevos sistemas.

---

## 3. Inventario completo de superpoderes (15 MCPs activos)

| # | Superpoder | Lo que nos da | Features que habilita |
|---|------------|---------------|------------------------|
| 1 | **Canva** (`generate-design`, `export-design`, `list-brand-kits`) | Brand kit completo, generación de diseños, exports PNG/PDF | Logo .ico real, splash screen, plantillas WhatsApp, PDF de reportes diarios, social cards del semáforo |
| 2 | **Higgsfield/Krea** (`generate_image`, `generate_video`, `virality_predictor`) | Imágenes premium, videos animados, predictor de virality | Splash video animado, hero animation del Halo, micro-interacciones, ads para Meta |
| 3 | **Gamma** (`generate`, `generate_from_template`, `read_gamma`) | Presentaciones, docs, webpages | Onboarding interactivo de 90s, pitch deck SaaS, training para nuevos operadores |
| 4 | **Hugging Face** (z-image-turbo, `paper_search`, `space_search`, `hub_repo_search`) | Generación rápida, modelos SOTA buscables | Iconos, modelos para Whisper local, LayoutLM OCR, Donut para Excel |
| 5 | **Supabase MCP** (`apply_migration`, `execute_sql`, `list_tables`, `get_cost`) | Migraciones, queries, costos | Tablas team.users, rondas.events, audit_log, holidays; verificación de cost antes de cada cambio |
| 6 | **Vercel** (`deploy_to_vercel`, `get_deployment`, `list_projects`, `get_runtime_logs`) | Deploy + logs en tiempo real | Preview deploys del Halo, logs del semáforo dentro del Comando |
| 7 | **Cloudflare** (`r2_bucket_create`, `kv_namespace_create`, `workers_list`, `d1_databases_list`) | R2 (storage), KV (cache), Workers (edge functions), D1 (SQLite) | R2 para reportes diarios, KV para cache del semáforo, Workers para federar las 2 orgs Supabase sin exponer keys, D1 como respaldo offline |
| 8 | **Meta Ads** (`get_campaigns`, `get_insights`, `bulk_get_insights`, `get_pixels`, `create_custom_audience`) | Toda la Marketing API | Tab "Marketing" en Comando: spend de hoy, ROAS por ciudad, alertas si una creative cae |
| 9 | **Motion** (`get_creative_insights`, `get_demographic_breakdown`) | Creative analytics Meta-only | Cruzar performance creativa con semáforo: qué creative vende en ciudades verdes vs rojas |
| 10 | **Supermetrics** (`data_query`, `data_source_discovery`, `field_discovery`) | 150+ fuentes de marketing/analytics | Fallback si clientes nuevos (SaaS) no conectan Meta directo; añade TikTok Ads, Google Ads cuando entren |
| 11 | **Shopify (×2)** (`SHOPIFY_LIST_ORDERS`, `SHOPIFY_CREATE_ORDER`, `graphql_query/mutation`) | Admin API completa | Si Litper migra a Shopify o cuando clientes SaaS sean Shopify-first |
| 12 | **Slack** (`slack_send_message_draft`, `slack_create_canvas`, `slack_read_channel`) | Mensajería + canvas + lectura | Alertas a #ops cuando ciudad cae a rojo; canvas semanal de KPIs; lectura de threads en Inbox unificado |
| 13 | **Calendar** (`create_event`, `list_events`, `suggest_time`) | Google Calendar full | Botón "agendar callback" desde un pedido; vista de turnos del equipo en Comando |
| 14 | **Gmail** (`search_threads`, `get_thread`, `create_draft`) | Búsqueda + drafts | Buscar números de guía en correos; draft automático "te llamamos mañana"; Inbox unificado |
| 15 | **Google Drive** (`create_file`, `search_files`, `download_file_content`) | Upload + búsqueda + download | Distribución del .exe (alternativa al GitHub raw); reportes PDF diarios auto-subidos |
| 16 | **Notion** (`notion-create-database`, `notion-create-pages`, `notion-search`) | Workspace de docs | Knowledge base ("playbook cancelados", "scripts WhatsApp") buscable desde Ctrl+K |
| 17 | **Postiz** (`integrationSchedulePostTool`, `generateImageTool`) | Social scheduling | Post automático en redes cuando el semáforo cambia (marketing) |
| 18 | **Spotify** (`search`, `create_playlist`) | Música | Modo Pomodoro inteligente con playlist sugerida |

(Anthropic SDK + Gemini ya están en deps del proyecto, no son MCPs.)

---

## 4. Nuevo diseño — 4 tamaños + 8 contadores + métricas inline

### 4.1 Los 4 modos de ventana

```
┌── MICRO (220×88) ──────┐
│ ⏱ 24:35 ✅ 18 [+] ▼  │   ← solo timer + counter principal + quick action
└─────────────────────────┘   atajos para todo lo demas

┌── MINI (340×320) ─────────┐
│ JF Jefer       🟢 ─ □ X   │
│   ⏱  24:35  ▶ Pausa       │
│   ✅ 18  ❌  3  📅 2  🆕 1 │   ← 4 contadores principales en grid 2×2
│   [💾 Guardar]  18/25      │
└────────────────────────────┘

┌── HALO (380×620) ─────────────┐
│ LITPER DESK 🟢 ─ □ X          │
│ JF Jefer (admin)               │
│ Ronda #3 — 24:35 ▶ Pausa       │
│ 📞 25  ✅ 18  ❌ 3  📅 2       │
│ ⚠️ 1   ⏳ 1   👁 0  🆕 1        │   ← 8 contadores (incluye Novedades)
│ ──────────────────────────     │
│ Tasa 72% · CPA $20.8k · 🔥 5 │   ← METRICAS INLINE (nuevo)
│ [💾 Guardar ronda]             │
│ [↻ Reiniciar dia] [⬇ Excel]   │   ← NUEVO
│ [🔌 Conexiones] [📊 Comando]  │   ← NUEVO
└────────────────────────────────┘

┌── COMANDO (1280×800) ──────────────────────────────────┐
│ LITPER DESK · Workbench · Ronda #3 · Jefer · 24:35   │
├─────────────────┬──────────────────┬──────────────────┤
│ Sidebar         │ Webview Semaforo │ Coach IA panel   │
│ ▸ Rondas hoy    │ (live)           │ "Llama a Cali"   │
│ ▸ Equipo (7)    │                  │ Sugerencia 14:32 │
│ ▸ Semaforo      │ Cali  🔴 62.3%   │                  │
│ ▸ Marketing     │ Bogota 🟢 81%    │ Heatmap dia      │
│ ▸ Inbox         │ Medellin 🟡 76%  │                  │
│ ▸ Knowledge     │                  │ Sparklines       │
│ ▸ Reportes      │ (drill-down)     │ Iniciales: ▁▂▃▅▆ │
│ ▸ Conexiones    │                  │ Realizado: ▂▄▆█▇ │
│ ▸ Ajustes       │                  │                  │
└─────────────────┴──────────────────┴──────────────────┘
```

**Reglas**:
- Las 4 ventanas son la MISMA app, cambia el modo con `Ctrl+Shift+1/2/3/4` o desde tray.
- Los contadores se incrementan en cualquier modo: en Micro se cicla con scroll wheel + número selector.
- El estado vive en Zustand, el modo solo cambia el render.
- Container queries en CSS hacen que cada widget reorganice automáticamente.

### 4.2 Los 8 contadores (incluida Novedades)

| Key | Label | Emoji | Color |
|-----|-------|-------|-------|
| `iniciales` | Iniciales | 📞 | gold |
| `realizado` | Realizado | ✅ | verde |
| `cancelado` | Cancelado | ❌ | rojo |
| `agendado` | Agendado | 📅 | amarillo |
| `dificiles` | Difíciles | ⚠️ | amarillo |
| `pendientes` | Pendientes | ⏳ | gold |
| `revisado` | Revisado | 👁 | gold |
| **`novedades`** | **Novedades** | **🆕** | **azul** |   ← nuevo, faltaba

### 4.3 Métricas inline (debajo de "Guardar ronda")

3 mini-cards horizontales:
- **Tasa del día** — `realizado / iniciales`. Color por semáforo (verde ≥ 80.5%, amarillo ≥ 70%, rojo < 70%).
- **CPA logístico** — `$15.000 COP / tasa`. Comparativa vs ayer con flecha ↑ o ↓.
- **Racha** — días consecutivos cumpliendo meta 85%. Fuego 🔥 si es ≥ 3.

### 4.4 Diseño "más tecnológico y llamativo"

- **Aurora background**: gradiente animado navy → gold sutil, intensidad reactiva al estado del semáforo (más vibrante si rojo).
- **Glassmorphism**: `backdrop-filter: blur(24px)` + transparencia + borde gold sutil (la firma del Halo).
- **Particle effects**: 50 partículas doradas flotantes cuando el timer entra en rojo (<10% restante).
- **Spring animations** (Framer Motion): bounce sutil cuando un contador se incrementa, ripple desde el botón clickeado.
- **Data viz**: sparklines en el footer mostrando las últimas 12 rondas; gauge animado para tasa del día.
- **Sound design** (opcional, toggle): chime sutil al guardar ronda (`new Audio()` con muestras pre-encoded en base64).
- **Logo .ico real** (Canva generará): LP+corona gold sobre navy redondeado 22%.

---

## 5. Feature → Superpoder mapping

| Feature pedida | Superpoder principal | Backend asociado |
|----------------|----------------------|-------------------|
| Logo .ico real | **Canva** `generate-design` + export PNG → convert .ico | — |
| Splash screen | **Higgsfield/Krea** `generate_video` 3s + Electron loadFile | — |
| 4 tamaños de ventana | Code (Electron `BrowserWindow` + Zustand) | — |
| Categoría Novedades | Code (extender rondaStore) | `tracker_routes.py` |
| Reiniciar día | Code + endpoint | `tracker_routes.py` (POST /day/reset) |
| Descarga Excel | Code (`xlsx` ya en deps) + endpoint | `excel_processor.py` ya existe |
| Botón Conexiones | Code (panel de Settings) | — |
| **Semáforo de ciudades funcional** | **Supabase Realtime** sobre `city_stats` + Cloudflare KV cache | `/api/semaforo-status` (a crear en semáforo repo) |
| Métricas inline | Code (computed selectors de Zustand) | `tracking_routes.py` |
| Finalizar día → informe | Canva (PDF template) + Drive upload + Slack + WhatsApp | `excel_processor.py` + `whatsapp_routes.py` |
| Supabase real | **Supabase MCP** `apply_migration` + `execute_sql` | Backend ya tiene Supabase client |
| Conexión Semáforo + ASDA | Cliente dual + Cloudflare Worker federador | Ambos backends |
| Buscador Ctrl+K | MiniSearch + Notion search + Gmail search + Drive search | — |
| Screenshots con anotación | `desktopCapturer` + Konva.js | — |
| MCP Server propio | `@modelcontextprotocol/sdk` | Backend Python expone tools |
| WhatsApp Cloud | **Backend ya tiene `whatsapp_routes.py` + `chatea_pro.py`** | Listo |
| Coach IA (15min) | Anthropic SDK + caching | `brain_routes.py` |
| Shadowing | **Supabase Realtime** sobre `ronda_eventos` | `websocket_routes.py` |
| Macro recorder | nut.js (key/mouse automation) | — |
| Voice command local | **HF** `whisper-tiny.es` model | — |
| Heatmap operador × hora | Recharts + Supabase view | `tracking_routes.py` |
| Pomodoro + Spotify | **Spotify MCP** `search` + `create_playlist` | — |
| PDF diario auto a Drive | **Drive MCP** `create_file` + jsPDF | `excel_processor.py` |
| Widget Windows 11 lock-screen | Windows 11 Widget Board API | — |
| OCR → WhatsApp deeplink | tesseract.js + `wa.me/` | — |
| Calendar de turnos | **Calendar MCP** | — |
| Inbox unificado | **Gmail + Slack + WhatsApp** MCPs | `whatsapp_routes.py` |
| Sala de guerra monitor 2 | Electron `screen.getAllDisplays()[1]` kiosk | — |
| Marketing tab | **Meta Ads MCP** + **Motion** + **Supermetrics** | — |
| Auto-deploy Vercel | **Vercel MCP** | — |
| Distribución | **Cloudflare R2** signed URLs | — |
| Brand templates WhatsApp | **Canva** brand templates | `whatsapp_routes.py` |
| Onboarding 90s | **Gamma** generate | — |

---

## 6. Plan de ejecución por sprints

### Sprint 0 — Lo que hago AHORA mismo (sin esperar credenciales)
**Entregable**: v0.2.0 con todos los items que NO requieren Supabase real.
- ✅ Agregar contador "Novedades" (8º)
- ✅ Botón "Reiniciar día" (resetea local)
- ✅ Botón "Descargar Excel" (xlsx export de rondas locales)
- ✅ Botón "Conexiones" (modal vacío con campos pre-cargados desde .env.example)
- ✅ Métricas inline (Tasa, CPA, Racha) calculadas de local
- ✅ Botón "Finalizar día" → genera PDF local con jsPDF
- ✅ 4 tamaños de ventana (Micro / Mini / Halo / Comando)
- ✅ Mode switcher en tray + atajos Ctrl+Shift+1/2/3/4
- ✅ Generar logo .ico real con Canva
- ✅ Aurora background + glassmorphism + particle effects
- ✅ Spring animations (Framer Motion)
- ✅ Sparklines en footer

**Estimación**: 1 día. Lo arranco al terminar este plan.

### Sprint 1 — Datos reales (Supabase dual)
Requiere de ti: URL + anon key de la org Supabase de ASDA3EEEE.
- Cliente Supabase dual (asda + semáforo) con SSO.
- Migraciones SQL: `team.users`, `rondas.events`, `rondas.dias_cerrados`, `audit_log`, `holidays`.
- RLS multi-tenant por `org_id`.
- Sincronización en vivo (Realtime) del estado del Halo entre operadores.
- Ranking del día, racha, meta diaria.
- Endpoint `GET /api/semaforo-status` en repo semáforo (cache KV 60s).
- Webview embebido del semáforo con SSO inyectado.

**Estimación**: 1 semana.

### Sprint 2 — Buscador + Screenshots + Conectores light
- `Ctrl+K` Command Palette federado (MiniSearch local + Gmail + Slack + Notion).
- Captura de pantalla con desktopCapturer + Konva.js (8 formas, opacidad por capa, OCR Tesseract local).
- Paste-as-floating-window estilo Snipaste.
- Conector WhatsApp Cloud — botón "abrir chat" desde cualquier pedido (`backend/whatsapp_routes.py` lo expone).
- Drive auto-upload de PDFs diarios.
- Slack alertas cuando ciudad cae a rojo.

**Estimación**: 1.5 semanas.

### Sprint 3 — Coach IA + Shadowing + Marketing tab
- Coach IA cada 15min con Anthropic SDK (prompt cacheado).
- Shadowing real-time (supervisor ve ronda activa de operador).
- Tab "Marketing" en Comando con Meta Ads MCP (spend, ROAS por ciudad).
- Cruce Motion (creative insights) × semáforo.
- Heatmap operador × hora con recharts.
- Calendar de turnos integrado.

**Estimación**: 1.5 semanas.

### Sprint 4 — MCP Server Litper Hub + Voice + Macro
- Paquete `packages/mcp-server` exponiendo tools sobre las 2 orgs.
- Voice command local con whisper-tiny (39MB) descargado del HF Hub.
- Macro recorder (nut.js) — grabar secuencia WhatsApp y replay con un botón.
- Pomodoro inteligente (detecta caída de tasa) + Spotify MCP.
- Widget Windows 11 lock-screen.

**Estimación**: 1.5 semanas.

### Sprint 5 — Inbox unificado + Sala de guerra + Polish
- Inbox unificado (Gmail + Slack + WhatsApp con urgencia por mención a ciudad).
- Sala de guerra: kiosk semáforo en monitor 2.
- OCR → WhatsApp deeplink desde screenshot.
- Onboarding 90s con Gamma embebido.
- Test, hardening final, documentación.

**Estimación**: 1 semana.

### Sprint 6 — Distribución + Auto-update + Cert
- Cloudflare R2 + Workers para signed URLs de download.
- Auto-updater apuntando a R2.
- Cert EV de code signing (decisión pendiente: ~$300/año).
- Onboarding al primer login del operador.
- Telemetría opcional (PostHog) + Sentry.

**Estimación**: 1 semana.

**Total**: ~7 semanas para producto completo de clase enterprise.

---

## 7. Decisiones que necesito YA para no bloquear

| # | Pregunta | Por qué urge |
|---|----------|--------------|
| 1 | URL + anon key de la org Supabase de ASDA3EEEE | Bloquea Sprint 1 entero |
| 2 | ¿Backend ASDA en `localhost:8000` o tienes URL pública de prod? | Bloquea conexión a `whatsapp_routes.py`, `tracking_routes.py`, etc. |
| 3 | ¿Tienes acceso al Meta Business Manager? Necesito Phone Number ID + System User Access Token para WhatsApp Cloud (puede tardar días en Meta) | Bloquea WhatsApp 1-click chat |
| 4 | ¿Drive folder donde quieres los PDFs diarios? (te creo uno: `litper-desk/reportes/`) | Sprint 2 |
| 5 | ¿Channel de Slack para alertas? (`#ops`, `#litper-alerts`?) | Sprint 2 |

---

## 8. Costo estimado mensual de superpoderes (al final)

| Item | Costo aprox/mes (USD) | Notas |
|------|----------------------|-------|
| Supabase | 0 → $25 | Plan free hasta 500MB, luego Pro |
| Cloudflare R2 + KV + Workers | 0 → $5 | Free tier muy generoso |
| Vercel | 0 (ya activo) | Hobby plan |
| Anthropic API (Coach IA + Brain) | $20-50 | Con prompt caching agresivo |
| Gemini API | $0-10 | Plan free generoso |
| Meta Ads / Motion / Supermetrics | 0 (cuentas existentes) | Solo costos de las plataformas mismas |
| Canva | 0 (asumiendo cuenta existente) | — |
| Gamma | 0 (asumiendo cuenta existente) | — |
| Cert EV code signing | $25 ($300/año) | Opcional, mejora SmartScreen |
| Apple Developer (descartado) | 0 | No vamos a Mac |
| **Total** | **~$50-115/mes** | Para producto completo |

---

## 9. Primer entregable concreto (mañana)

Voy a ejecutar **Sprint 0 completo** y entregarte una nueva build v0.2.0 con:

1. **Logo .ico real** generado con Canva basado en tu LP+corona dorada.
2. **8º contador "Novedades"** en azul.
3. **4 tamaños de ventana** (Micro / Mini / Halo / Comando) con switcher en tray + atajos.
4. **Botón "Reiniciar día"** con confirm dialog.
5. **Botón "Descargar Excel"** que genera `.xlsx` de todas las rondas del día.
6. **Botón "Conexiones"** que abre modal con campos para Supabase URL/key, WhatsApp token, Meta Ads token, etc.
7. **Métricas inline** Tasa / CPA / Racha calculadas de local.
8. **Botón "Finalizar día"** → genera PDF con jsPDF + abre Save dialog.
9. **Aurora background animado** + glassmorphism + particle effects al rojo.
10. **Spring animations** en contadores y botones.
11. **Sparklines** en el footer de las últimas 12 rondas.
12. Nueva build .exe / .AppImage / .deb subida igual que la v0.1.0.

Después de aprobar v0.2.0, arranco Sprint 1 (Supabase real) — para esto necesito las credenciales que pedí arriba.

---

> Este plan es la fuente única de verdad de aquí en adelante. Los planes anteriores quedan archivados en historia. Vamos.
