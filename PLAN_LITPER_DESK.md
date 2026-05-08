# PLAN: LITPER DESK — Centro Operativo de Escritorio

> Branch: `claude/order-management-desktop-app-aajeM`
> Fecha: 2026-05-08
> Estado: propuesta de plan, pendiente de aprobación

---

## 1. Contexto actual (lo que ya existe)

### Repo `asda3eeee` (Litper Pro Seguimiento)
Stack: React 19 + TS + Vite + Zustand + Supabase + Anthropic SDK + Gemini + recharts + xlsx + lucide-react + html-to-image + jspdf.

**Tres prototipos de desktop fragmentados, ninguno integrado:**
- `/electron/` — el más reciente. `main.js` ya tiene `alwaysOnTop`, `frame:false`, `transparent:true`, system tray con menú contextual, atajos globales (`Ctrl+Shift+L/S/R`), single-instance lock e IPC para controles de ventana.
- `/litper-pedidos-app/` — sub-app independiente con su propio `package.json`, Electron 28, Tailwind, timer regresivo, contadores de ronda, gestión de usuarios, modo Admin con engranaje, `electron-builder` configurado para `.exe`/`.dmg`/`.AppImage`.
- `/litper-tracker/` — tercera variante (Vite + React + Tailwind), aparentemente abandonada.

**Documentos de planificación previos (NO ejecutados):**
- `PLAN_APP_FLOTANTE.md` — plan general con código de Electron + tray.
- `PLAN_APP_FLOTANTE_PROCESOS.md` — UX detallada para registrar rondas con +/- (ya está bien diseñado, hay que ejecutarlo).
- Otros 20+ docs (`PLAN_PROCESOS_*`, `PLAN_ENTERPRISE_*`, `PLAN_CEREBRO_*`...) que documentan otros frentes.

**Backend / infra:** docker-compose, dbt, infrastructure/, services/, hooks/, stores/, i18n/, nginx/.

### Repo `litper-pro-semaforo-ia`
Sitio estático en `/public/` (HTML/CSS/JS puro, 6 páginas pesadas, 150-485KB) + serverless `/api/` (ai.js, chat.js, create-checkout.js, stripe-webhook.js).

- **URL prod:** https://litper-semaforo.vercel.app
- **Backend:** Supabase (`gtsivwbnhcawvmsfujby.supabase.co`) + Vercel.
- **Tablas:** organizations, profiles (vista `auth_profiles`), uploads, city_stats, carrier_stats, ai_analyses, chat_sessions.
- **Auth:** Supabase email/password + Google OAuth.
- **Pagos:** Stripe checkout con webhook (planes Starter/Pro/Enterprise).
- **Reglas críticas de negocio:** Semáforo verde ≥ 80.5%, amarillo ≥ 70%, rojo < 70%. CPA logístico = 15K COP / tasa_entrega. Meta 85%.
- **Carriers:** Coordinadora, Interrapidísimo, TCC, Envía (CO); Chilexpress, Starken (CL).

---

## 2. Problema a resolver

1. Tres prototipos de desktop sin terminar y sin coordinarse.
2. Semáforo y ASDA3EEEE viven en silos: el equipo abre dos navegadores y pierde contexto entre rondas.
3. Sin botón de semáforo siempre visible, no hay alertas reactivas durante el trabajo.
4. Sin buscador federado: encontrar un pedido / ciudad / operador toma demasiados clicks.
5. La queja específica del usuario: las ventanas flotantes "no se adaptan a la forma" — el layout queda feo cuando se redimensiona porque hoy se usan breakpoints de viewport en lugar de container queries.
6. No existe captura de pantalla con anotación dinámica (formas, opacidad, blur) integrada en el flujo.
7. No hay capa de gestión de equipo (asignación, KPI, ranking) consolidada.
8. No hay capa de orquestación entre apps que un agente IA pueda manejar (MCP).

---

## 3. Concepto: "LITPER DESK"

App de escritorio Electron única que reemplaza los 3 prototipos. Tres modos de operación:

| Modo | Descripción | Tamaño |
|------|-------------|--------|
| **Halo** | Mini ventana siempre encima, translúcida, con timer + botón Semáforo + buscador | ~320×120px |
| **Comando** | Workbench expandido con pedidos, semáforo embebido, equipo, screenshots | ~1100×720px |
| **Tray** | Solo icono en bandeja, atajos globales activos, ventana oculta | invisible |

Transiciones animadas entre modos con Framer Motion. Snap-to-corner, ghost mode (click-through cuando inactivo), opacidad global ajustable, multi-monitor con posición recordada por display, tema claro/oscuro/auto.

---

## 4. Arquitectura de conexión entre las dos apps

### Capa 1 — Datos: Supabase compartido
Ambas apps ya usan Supabase. La estrategia más barata y robusta es centralizar:

```
litper-prod  (org única en Supabase)
├── schema seguimiento.*   ← pedidos, rondas, usuarios, KPIs operativos (ASDA3EEEE)
├── schema semaforo.*      ← city_stats, carrier_stats, uploads, ai_analyses (ya existe)
└── schema desk.*          ← sesiones, snapshots, anotaciones, preferencias (nuevo, lo crea LITPER DESK)
```

- RLS por `organization_id` y por `user_role`.
- Vista unificada `v_dashboard_global` que une CPA logístico del día + rondas activas + alertas semáforo + ranking del equipo.
- Realtime: la desktop se suscribe a `city_stats` (cambios de color del semáforo) y a `ronda_eventos` (KPIs del equipo).

### Capa 2 — Webview embebido del Semáforo
Electron `WebContentsView` (sucesor moderno de `BrowserView`) cargando `https://litper-semaforo.vercel.app/dashboard`.

- **SSO automático**: la desktop inyecta el token de sesión Supabase vía `webContents.executeJavaScript('localStorage.setItem("sb-...-auth-token", ...)')` antes del `loadURL`.
- **Lazy mount**: el webview solo se monta cuando el usuario abre el panel Semáforo en modo Comando, no al iniciar la app.
- **Comunicación bidireccional**: postMessage entre webview y renderer principal para sincronizar selección de ciudad, filtros, etc.

### Capa 3 — MCP Server "Litper Hub"
Crear `packages/mcp-server` (paquete nuevo del monorepo) que exponga tools sobre AMBOS sistemas como uno solo:

```typescript
// Tools del MCP Hub
litper.semaforo.get_city_status({ city })
litper.semaforo.list_red_cities()
litper.semaforo.run_ai_analysis({ upload_id, model })
litper.semaforo.get_carrier_cpa({ carrier, date_range })

litper.pedidos.start_round({ user_id, duration })
litper.pedidos.save_round({ user_id, counters, notes })
litper.pedidos.list_team_kpis({ date_range })
litper.pedidos.assign_round({ user_id, ronda_id })

litper.search.global({ query, filters })
litper.screenshot.capture({ region, target })
litper.screenshot.annotate({ image, shapes, opacity })
```

- Implementación con `@modelcontextprotocol/sdk`.
- Embebido en Electron como proceso hijo (Node) con stdio transport.
- Permite que **Claude Desktop / Cursor / cualquier cliente MCP** controle la suite Litper completa.
- En el futuro, el propio LITPER DESK invoca a Claude API con estas tools para automatizaciones por voz/IA.

### Capa 4 — Bus de eventos (Supabase Realtime)
- Suscripción a `city_stats`: cuando una ciudad cae a rojo, el Halo flotante parpadea automáticamente.
- Suscripción a `ronda_eventos`: ranking del equipo se actualiza en vivo sin refrescar.
- Suscripción a `presence`: ver quién del equipo está online y en qué ronda.

---

## 5. Funcionalidades

### A) Gestión de equipo de rondas (núcleo)
- Lista de operadores (Catalina/Jimmy/Evan/Angie/Felipe/Karen/Jeferson) con avatar y color.
- Asignación de turnos / rondas en curso.
- Timer regresivo con alertas de color (verde→amarillo→naranja→rojo→parpadeante).
- Contadores rápidos: Iniciales, Realizado, Cancelado, Agendado, Difíciles, Pendientes, Revisado.
- +/- con click izq, +5/-5 con click der, scroll-wheel sobre el número, atajos `R/C/A/D/P/V`.
- Click sobre el número → editar valor directo.
- Guardado en Supabase + persistencia local (offline-first con `electron-store` + `better-sqlite3`).
- Ranking del día, racha actual, meta diaria con barra de progreso.
- Modo Admin con engranaje (ya existe el patrón en `litper-pedidos-app`) para crear/editar/eliminar usuarios y reglas.
- Roles: admin, supervisor, operador. RLS en Supabase.

### B) Botón Semáforo siempre disponible
- Pin flotante en el Halo: un círculo del color del peor estado actual del semáforo.
- Hover/click → panel translúcido con top 5 ciudades en rojo, CPA del día y delta vs ayer.
- Doble click → abre Comando con webview semáforo embebido.
- Realtime: cambia color sin recargar; parpadea si una ciudad nueva entró en rojo.
- Botón "📸 capturar" rápido → screenshot del panel listo para pegar en WhatsApp.

### C) Buscador global federado (Ctrl+K)
- Command Palette estilo Linear/Raycast con `cmdk-react`.
- Indexa: ciudades, carriers, operadores, rondas pasadas, análisis IA, archivos subidos, pedidos.
- Cliente: `MiniSearch` para typeahead instantáneo offline.
- Servidor: fallback a Supabase full-text search (FTS) para datasets pesados.
- Filtros: `@persona`, `#ciudad`, `>fecha`, `:rojo`, `:pedido`.
- Resultados agrupados por tipo, con preview inline.

### D) Screenshots con anotación dinámica
Stack: `desktopCapturer` (Electron) + `Konva.js` (canvas perf > Fabric) + `html2canvas` para captura DOM.

- **Captura**: pantalla completa, ventana específica, área seleccionada, ventana del semáforo embebido, scroll-capture (toda la página).
- **Formas dinámicas**: flecha, rectángulo, círculo, elipse, polígono libre, lupa zoom, blur/pixelado, resaltador, numerador automático (1,2,3...).
- **Texto**: con auto-tamaño, fuentes seguras, sombra, fondo opaco/transparente.
- **Opacidad**: slider por capa (0-100%) y opacidad global del documento.
- **Color picker**: estilo Snagit con paleta + dropper desde la imagen.
- **Grosor de línea**, sombra, gradiente, esquinas redondeadas.
- **Layout adaptativo del toolbar** (resuelve la queja del usuario "queda feo"):
  - `ResizeObserver` mide el contenedor (NO el viewport).
  - El toolbar reflows: horizontal (top) → vertical (right) → circular (radial menu) según aspect ratio del canvas.
  - CSS Container Queries (`@container`) para que cada componente decida su layout según su contenedor padre, no según el viewport.
- **Export**: PNG, JPG, PDF, clipboard, Slack, WhatsApp, Email.
- **Paste-as-floating-window** (estilo Snipaste): la captura queda flotando como ventana propia hasta que la cierras con Esc.
- **OCR**: `tesseract.js` para extraer texto de la imagen al portapapeles.

### E) Ventana 100% dinámica que SÍ se adapta a la forma
- Halo → Comando → Tray con transiciones animadas (Framer Motion).
- Snap a esquinas (cuadrantes), borde lateral (dock), área libre.
- Opacidad global ajustable con slider en la barra de título custom.
- **Ghost mode**: si no hay interacción por 30s, la ventana deja pasar clicks al fondo (`setIgnoreMouseEvents(true, { forward: true })`).
- Multi-monitor con `screen.getAllDisplays()`: posición recordada por display ID.
- Tema claro/oscuro/auto (sigue al sistema).
- **Layout que SÍ se adapta**: CSS Grid + container queries + ResizeObserver. Cada widget conoce sus breakpoints relativos a su contenedor, no al viewport. Esto soluciona el "queda feo cuando cambia la forma".

### F) Conectores e-commerce (Fase 7)
- **Shopify** (vía MCP `shopify` ya disponible en este entorno) — pedidos, productos, inventario, cumplimiento.
- **Bling ERP** (Brasil) — webhook de pedidos en tiempo real.
- **Nuvemshop / Tiendanube** — listado de pedidos LATAM (líder con 120K+ tiendas).
- **WhatsApp Business Cloud API** — abrir chat con cliente desde un pedido con un click.
- **Meta Ads** (vía Supermetrics MCP ya disponible) — costo por compra del día, breakdown por ciudad.
- **Coordinadora / Interrapidísimo / TCC / Envía** — tracking de guías (scraping con Playwright si no hay API oficial).
- **Google Sheets** — export/import rápido para reportes ad-hoc.
- **Slack / Discord** — notificaciones automáticas al equipo cuando una ciudad cae a rojo.

### G) Capacidades enterprise extra
- OCR del screenshot (tesseract.js) para copiar texto desde imagen.
- Voice notes con transcripción Whisper local (privacidad).
- Auto-update con `electron-updater` (canal stable + beta).
- Telemetría anonimizada opcional (PostHog).
- E2E encryption de notas locales (`electron-store` con `encryptionKey`).
- Logs estructurados a Sentry.
- i18n ES/EN/PT-BR (extender carpeta `i18n/` existente).
- Atajos globales personalizables por usuario.

---

## 6. Referentes (qué copiar y de dónde)

### Estados Unidos
| Producto | Qué copiar |
|----------|-----------|
| **Onfleet** | Vista de despacho en vivo, mapa de rondas, real-time tracking |
| **Shopify Flow / Shop App** | UX de pedido con un solo gesto |
| **Brightpearl** | Automação post-venta y order routing (Forrester Wave Q1 2025 leader) |
| **Fluent Commerce** | Distributed Order Management |
| **Zoho Inventory / NetSuite / Cin7** | Multi-canal y panel unificado |
| **Snagit** | Shape tool con efectos (sombra, opacidad, gradiente) |
| **Snipaste** | Paste-as-floating-window, opacidad ajustable |
| **Zight** | Captura rápida + anotación + share inmediato |
| **Notion (modo mini)** | Ventana flotante minimalista |
| **Slack huddles overlay** | Botón flotante siempre encima durante llamada |
| **Linear / Raycast** | Command Palette (Ctrl+K) |
| **Loom** | Captura con voz + screencast |

### Brasil
| Producto | Qué copiar |
|----------|-----------|
| **Bling ERP** | Dashboards inteligentes, automação de pedidos, integração marketplaces |
| **Tray** | Integração nativa com TODOS marketplaces sem custo extra |
| **Nuvemshop** | UX para SMBs (líder LATAM, 120K+ tiendas) |
| **Olist** | Gestão multicanal centralizada |
| **Tiny ERP** | Operação fiscal + estoque + pedidos |
| **Total IP / Movidesk** | Atendimento omnichannel desktop |

**Lo más jugoso a copiar:**
- De Bling: dashboards con drill-down + automação por regra.
- De Snipaste: paste-as-floating-window.
- De Onfleet: live map de operadores haciendo rondas.
- De Notion: modo "ventana flotante mini" del editor.
- De Snagit: shape tool con efectos.
- De Linear/Raycast: command palette y atajos.

---

## 7. Stack final recomendado

| Capa | Tecnología | Por qué |
|------|------------|---------|
| Shell | Electron 33 | Ya elegida, soporta `WebContentsView` |
| UI | React 19 + TypeScript + Vite | Consistente con repos actuales |
| Estado | Zustand + Supabase Realtime | Ya en uso |
| Estilos | Tailwind + CSS Container Queries | Resuelve "no se adapta a la forma" |
| Animación | Framer Motion | Transiciones de modos |
| Captura | desktopCapturer + Konva.js | Mejor canvas perf que Fabric |
| OCR | tesseract.js | Local, sin API externa |
| Búsqueda | MiniSearch (cliente) + Supabase FTS | Híbrido offline-first |
| Command Palette | cmdk-react | Estándar de la industria |
| MCP | @modelcontextprotocol/sdk | Estándar Anthropic |
| Persistencia local | electron-store + better-sqlite3 | offline-first con SQL local |
| Auto-update | electron-updater | Estándar de facto |
| Build | electron-builder | Ya en uso en `litper-pedidos-app` |
| Monorepo | pnpm workspaces | Ligero, rápido |

---

## 8. Plan por fases

### Fase 0 — Consolidación (semana 0-1)
- Auditar `/electron/`, `/litper-pedidos-app/`, `/litper-tracker/` y elegir base.
- **Recomendación**: usar `/electron/` (más reciente, ya tiene tray + shortcuts) y migrar UI de `/litper-pedidos-app/` (tiene timer + users). Archivar `/litper-tracker/`.
- Crear monorepo con pnpm workspaces:
  ```
  litper-suite/
  ├── apps/
  │   ├── desktop/        ← LITPER DESK (Electron + React)
  │   ├── web/            ← código actual de asda3eeee
  │   └── semaforo/       ← referencia, repo separado
  ├── packages/
  │   ├── mcp-server/     ← Litper Hub MCP
  │   ├── shared-types/   ← tipos compartidos
  │   ├── shared-ui/      ← componentes Tailwind
  │   └── supabase-client/← cliente Supabase con SSO
  └── pnpm-workspace.yaml
  ```
- Branch única `claude/order-management-desktop-app-aajeM` (ya creada).

### Fase 1 — Halo flotante + Tray + Atajos (semana 1-2)
Recuperar `electron/main.js` existente y agregar:
- `WebContentsView` para semáforo embebido (lazy).
- Snap-to-corner (esquinas, dock lateral, libre).
- Opacidad global ajustable.
- Ghost mode con timeout de 30s.
- Multi-monitor con `screen.getAllDisplays()`.

Renderer:
- Tres modos (Halo/Comando/Tray) con Framer Motion.
- Atajos globales: `Ctrl+Shift+L` (toggle), `Ctrl+K` (search), `Ctrl+Shift+P` (screenshot), `F1` (semáforo).
- Container queries en CSS para que el Halo se reorganice al cambiar tamaño.

### Fase 2 — Gestión de equipo + Rondas (semana 2-3)
- Migrar UI de `litper-pedidos-app` (timer, contadores, usuarios) a `apps/desktop`.
- Implementar Zustand store sincronizado con Supabase Realtime.
- Ranking del día + racha + meta diaria con barra de progreso.
- Modo Admin con permisos por rol.
- Pruebas con datos reales del equipo (Catalina, Jimmy, Evan, etc).

### Fase 3 — Botón Semáforo siempre disponible (semana 3-4)
- Pin flotante con color reactivo (Realtime en `city_stats`).
- Panel translúcido con top 5 ciudades rojas + CPA del día.
- Webview embebido con SSO inyectado.
- Acceso a análisis IA del semáforo desde Comando.
- Captura rápida del panel para compartir en WhatsApp.

### Fase 4 — Buscador global federado (semana 4)
- `Ctrl+K` abre Command Palette (cmdk-react).
- Index local con MiniSearch + fallback Supabase FTS.
- Resultados agrupados por tipo (pedido, ciudad, operador, análisis).
- Filtros con sintaxis (`@`, `#`, `>`, `:`).

### Fase 5 — Screenshots + anotación con formas dinámicas (semana 5-6)
- Pipeline `desktopCapturer` → Konva canvas → export.
- Toolbar adaptativo (ResizeObserver) que se reorganiza por aspect ratio.
- Opacidad por capa, colores, formas dinámicas, blur, OCR.
- Paste-as-floating-window estilo Snipaste.
- Compartir directo a WhatsApp/Slack/Email.

### Fase 6 — MCP Server Litper Hub (semana 6-7)
- Paquete `packages/mcp-server` con `@modelcontextprotocol/sdk`.
- Tools sobre ambas apps (semáforo + pedidos).
- Embebido en Electron como proceso hijo.
- Documentación para registrarlo en Claude Desktop / Cursor.
- Token-scoped por usuario (RLS en Supabase).

### Fase 7 — Conectores e-commerce (semana 7-9)
- Shopify (MCP ya disponible).
- Bling (REST oficial + webhook).
- Nuvemshop (REST oficial).
- WhatsApp Cloud API (chat 1-click desde pedido).
- Meta Ads (Supermetrics MCP ya disponible).
- Coordinadora/Interrapidísimo (scraping con Playwright).
- Google Sheets export/import.
- Slack/Discord notifications.

### Fase 8 — Polish + Distribución (semana 9-10)
- Auto-updater con canal stable/beta.
- Instaladores firmados:
  - Windows: NSIS `.exe` con firma de código.
  - macOS: `.dmg` notarizado (Apple Developer ID, ~$99/año).
  - Linux: `.AppImage` + `.deb`.
- Onboarding de 3 pasos al primer login.
- Telemetría opcional + crash reporting (Sentry).
- i18n ES/EN/PT-BR.
- Documentación + video demo.

---

## 9. Riesgos y mitigación

| Riesgo | Mitigación |
|--------|-----------|
| 3 prototipos fragmentados → confusión del equipo | Fase 0 archiva `/litper-tracker/`, fusiona los otros dos |
| Semáforo es HTML estático sin SSO real | Inyectar token Supabase vía `executeJavaScript` en webview |
| Webview pesado al iniciar | Lazy-load: solo cargar cuando se abre Comando |
| Ventana flotante "queda feo" al cambiar tamaño | Container queries + ResizeObserver, NO breakpoints de viewport |
| Auto-update + firma de código en Mac | Apple Developer ID + notarización |
| Screenshots en macOS requieren permiso | Solicitar `screen-capture` permission en `entitlements.mac.plist` |
| MCP server expone datos sensibles | RLS en Supabase + token scoped por usuario |
| Conectores con APIs sin contrato (Coordinadora) | Scraping con Playwright + caché agresivo + circuit breaker |

---

## 10. Entregables por fase

| Fase | Entregable |
|------|-----------|
| 0 | Monorepo limpio, plan en repo, branch lista |
| 1 | `.exe`/`.dmg` con Halo + Tray + atajos funcionales |
| 2 | Rondas y equipo guardando en Supabase |
| 3 | Botón Semáforo reactivo + webview embebido |
| 4 | Ctrl+K con buscador federado |
| 5 | Screenshot + anotación + paste-floating |
| 6 | MCP server publicable a Claude Desktop |
| 7 | Conectores Shopify/Bling/Nuvemshop/WhatsApp |
| 8 | App firmada, auto-update, multi-idioma |

---

## 11. Decisiones que necesito del usuario (antes de ejecutar)

1. **Punto de partida**: ¿archivar `/litper-tracker/` y consolidar en `/electron/` + `/litper-pedidos-app/`, o arrancar limpio en `apps/desktop/` dentro de un monorepo nuevo?
2. **Supabase**: ¿la cuenta del semáforo (`gtsivwbnhcawvmsfujby`) y la de ASDA3EEEE son la misma org o distintas? Si son distintas, hay que migrar.
3. **Mac signing**: ¿tienes Apple Developer ID para notarizar la build de macOS, o por ahora solo Windows + Linux?
4. **Conectores prioritarios** (Fase 7): ¿qué orden quieres? (Shopify, Bling, Nuvemshop, WhatsApp, Meta Ads, Coordinadora...).
5. **MCP server**: ¿público (open-source) o privado del equipo Litper?
6. **Distribución**: ¿descarga directa desde litper.com, GitHub Releases, o canal privado para empleados?
7. **Plan comercial**: ¿esto se queda interno o se vuelve un producto (LITPER DESK como SaaS)?

---

## 12. Tabla resumen del flujo de datos

```
┌─────────────────────────────────────────────────────────────────┐
│                       LITPER DESK (Electron)                    │
│                                                                 │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌─────────────────┐  │
│  │  Halo   │  │ Comando  │  │  Tray   │  │ MCP Server (hijo)│  │
│  └────┬────┘  └────┬─────┘  └────┬────┘  └────────┬────────┘  │
│       │            │             │                │            │
│       └────────────┴─────────────┴────────────────┘            │
│                          │                                      │
│                          ▼                                      │
│             ┌───────────────────────────┐                      │
│             │  Supabase Client (SSO)    │                      │
│             └─────────────┬─────────────┘                      │
└──────────────────────────┼──────────────────────────────────────┘
                           │
       ┌───────────────────┼───────────────────┐
       ▼                   ▼                   ▼
┌──────────────┐    ┌─────────────┐    ┌─────────────────────────┐
│  Supabase    │    │  WebView    │    │  Conectores externos    │
│  Realtime    │    │  Semaforo   │    │  Shopify / Bling /      │
│  + RLS       │    │  (lazy)     │    │  Nuvemshop / WhatsApp   │
│              │    │             │    │  Meta Ads / Carriers    │
│ seguimiento.*│    │ litper-     │    │                         │
│ semaforo.*   │    │ semaforo.   │    │                         │
│ desk.*       │    │ vercel.app  │    │                         │
└──────────────┘    └─────────────┘    └─────────────────────────┘
```

---

> **Próximo paso sugerido**: responder las 7 preguntas de la sección 11. Con esas decisiones queda el plan firme y arranco la Fase 0.
