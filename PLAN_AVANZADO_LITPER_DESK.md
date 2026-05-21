# Plan avanzado — LITPER DESK

> Branch: `claude/order-management-desktop-app-aajeM`
> Fecha: 2026-05-08
> Complementa `PLAN_LITPER_DESK.md` y `DECISIONES_LITPER_DESK.md`.
> Esto es un PLAN. NO se ejecuta hasta aprobación explícita.

---

## Índice

1. [Herramientas MCP disponibles que llevan el producto a otro nivel](#1-herramientas-mcp-de-otro-nivel)
2. [Revisión de seguridad (35 controles)](#2-revisión-de-seguridad)
3. [Revisión de funcionalidad (edge cases + huecos)](#3-revisión-de-funcionalidad)
4. [Ideas nuevas (12 propuestas)](#4-ideas-nuevas)
5. [Plan de ejecución consolidado](#5-plan-de-ejecución-consolidado)

---

## 1. Herramientas MCP de otro nivel

Inventario de los servidores MCP disponibles en este entorno y cómo cada uno **multiplica** el valor de LITPER DESK. Ninguna requiere infra extra: ya están conectadas.

### A) Diseño visual premium

| MCP | Cómo lo usamos en LITPER DESK |
|-----|-------------------------------|
| **Canva** (`generate-design`, `list-brand-kits`, `export-design`, `perform-editing-operations`) | Brand kit oficial de Litper (logo, paleta, tipografía) generado una sola vez y reutilizado en: app icon `.ico`/`.icns`/`.png`, splash screen, ventana About, plantillas WhatsApp para "cancelado/reagendado", reportes PDF de fin de jornada, social posts del semáforo. |
| **Gamma** (`generate`, `generate_from_template`, `get_themes`) | Onboarding interactivo de 3 pasos como pages embebidas en webview, training deck para nuevos operadores, public roadmap, pitch deck para la fase SaaS. |
| **Higgsfield/Krea** (`generate_image`, `generate_video`, `models_explore`, `show_characters`) | Splash video animado de la app, intro de 5s, demo video para Drive, micro-animaciones del Halo (loop de 1s del semáforo cambiando de color), avatares cinemáticos del equipo. |
| **HF z-image-turbo** (`gr1_z_image_turbo_generate`) | Generación rápida de iconos y assets sueltos cuando Canva sea overkill. |

**Resultado**: identidad visual consistente sin contratar diseñador, listo para v1.

### B) Datos reales, no mock

| MCP | Cómo lo usamos |
|-----|---------------|
| **Supabase** (`list_tables`, `execute_sql`, `apply_migration`, `generate_typescript_types`, `get_advisors`, `get_logs`) | Inspeccionar schema actual del semáforo, generar tipos TS automáticos para `supabaseSemaforo`, crear migraciones de `seguimiento.*` y `desk.*` en la org de ASDA, auditar performance, revisar advisors de seguridad, leer logs en producción durante Fase 1-3. |
| **Meta Ads** (`get_campaigns`, `get_insights`, `get_ad_accounts`, `get_pixels`, `bulk_get_insights`) | Tab "Marketing" embebida en LITPER DESK que muestra **costo por compra real del día por ciudad** junto al semáforo. Cierra el loop "spend Meta → tasa entrega → CPA logístico". |
| **Supermetrics** (`data_query`, `data_source_discovery`) | 150+ fuentes de datos. Al pasar a SaaS, los clientes nuevos que no tengan acceso directo Meta/GA pueden conectar via Supermetrics. |
| **Motion (Meta-only creative analytics)** (`get_creative_insights`, `get_demographic_breakdown`, `get_workspace_brand`) | Cruzar performance creativa de anuncios con semáforo: ¿qué creativos generan pedidos en ciudades verdes vs rojas? Insight crítico que hoy no tienen. |
| **Shopify** (×2 servidores: `SHOPIFY_*` y el privado con `graphql_query`) | Aunque el usuario priorizó solo WhatsApp, dejamos un placeholder para Fase 7+: cuando suban a Shopify (hoy es WhatsApp + Meta Ads), conectores listos. |

**Resultado**: el dashboard no es un mock — desde la primera demo, datos reales del negocio.

### C) Infraestructura sin DevOps

| MCP | Cómo lo usamos |
|-----|---------------|
| **Cloudflare** (`r2_bucket_create`, `kv_namespace_create`, `workers_get_worker`, `d1_database_create`) | Distribución del .exe/.deb/.AppImage por R2 con URL firmada (mejor que Drive público). Cache de `/api/semaforo-status` en KV. Edge function en Workers para federar las dos orgs Supabase sin exponer ambas keys al cliente. |
| **Vercel** (`deploy_to_vercel`, `get_deployment_build_logs`, `get_runtime_logs`) | Auto-deploy del semáforo en cada push, lectura de logs durante incidentes desde el propio LITPER DESK. |

**Resultado**: distribución y caching enterprise-grade sin contratar SRE. Si más adelante quieres reemplazar Drive/WhatsApp por R2 + URL firmada, queda 1 día de trabajo.

### D) Productividad + automatización del equipo

| MCP | Cómo lo usamos |
|-----|---------------|
| **Slack** (`slack_send_message`, `slack_create_canvas`, `slack_send_message_draft`, `slack_search_channels`) | Notificaciones automáticas: ciudad cae a rojo → ping en `#ops`. Canvas semanal con KPIs del equipo. Mensajes-borrador para que supervisor revise antes de enviar. |
| **Calendar** (`create_event`, `list_events`, `suggest_time`) | Botón "agendar callback" en LITPER DESK crea evento de calendario con cliente. Vista de turnos del equipo. |
| **Gmail** (`search_threads`, `create_draft`, `get_thread`) | Buscador global federado también busca en Gmail (correos con números de guía). Drafts automáticos de "te llamamos mañana". |
| **Notion** (`notion-create-database`, `notion-create-pages`, `notion-search`, `notion-fetch`) | Roadmap interno + base de conocimiento ("playbook de cancelados", "scripts WhatsApp", "checklist apertura nueva ciudad"). Buscable desde Ctrl+K. |
| **Google Drive** (`create_file`, `download_file_content`, `search_files`) | Distribución del binario LITPER DESK (canal elegido). Reportes diarios PDF auto-subidos a `Drive/litper/reportes/2026-05-08.pdf`. |

**Resultado**: el desktop ya no es una app aislada, es el **centro nervioso** que orquesta calendar + slack + drive + email para el equipo de rondas.

### E) Anthropic / inteligencia

| MCP / SDK | Cómo lo usamos |
|-----------|---------------|
| **Anthropic SDK** (ya en `package.json` de asda3eeee) | "Coach" que cada hora analiza ronda_eventos + city_stats y sugiere "llama primero a Cali, su tasa cae 3% por hora". Prompt cacheado para abaratar. |
| **MCP Hub propio (Litper)** | Convertir LITPER DESK en cliente MCP de su propio servidor. Claude Code / Claude Desktop pueden consumir las dos apps Litper como una sola superficie. |
| **Hugging Face** (`hf_doc_search`, `hub_repo_search`, `paper_search`, `space_search`) | Búsqueda de SOTA models para mejorar OCR (LayoutLMv3), transcripción (Whisper distilled), document understanding del Excel del semáforo (Donut). Embebidos vía `transformers.js` en el renderer (todo local, cero datos a la nube). |

**Resultado**: la app aprende del equipo y guía. No es un dashboard pasivo.

### F) Mensajería y comercio (para Fase 7 y futuro SaaS)

| MCP | Estado |
|-----|--------|
| **Postiz** (`integrationSchedulePostTool`, `generateImageTool`, `generateVideoTool`) | Programar contenido del semáforo en redes sociales del equipo. Bonus si el SaaS quiere ofrecer "marketing del COD" como módulo. |
| **Spotify** (novedad) | Modo "focus" del operador con playlist sugerida durante rondas largas. Anecdótico pero diferenciador. |

---

## 2. Revisión de seguridad

### 2.1 Almacenamiento de secretos en Electron

| # | Riesgo | Control |
|---|--------|---------|
| 1 | Tokens Supabase en `localStorage` del renderer | Mover a **OS keychain** vía `keytar` (Windows Credential Manager / Keychain macOS / libsecret Linux). NUNCA en `localStorage`. |
| 2 | Token de WhatsApp Cloud filtrado | Solo en main process, expuesto al renderer vía IPC con scope mínimo. Refresh manejado en main. |
| 3 | `.env` commiteado por accidente | `.gitignore` ya tiene `.env*` excepto `.env.example`. Pre-commit hook con `git-secrets` o `gitleaks`. |
| 4 | `electron-store` plaintext | Usar `encryptionKey` derivada de keytar; `safeStorage.encryptString()` (Electron API) como segundo cinturón. |
| 5 | SQLite local con datos PII | `better-sqlite3` + `SQLCipher` con clave en keychain. Sin clave → DB inaccesible. |

### 2.2 Surface IPC y renderer

| # | Riesgo | Control |
|---|--------|---------|
| 6 | `nodeIntegration: true` permite ejecutar Node desde el renderer | **Forzar** `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`. Ya está parcialmente en `electron/main.js`, faltaba `sandbox`. |
| 7 | `preload.js` expone API sin validación | Validar TODO el payload IPC con `zod` antes de procesar. Whitelist explícita de canales. Rechazar canales no listados. |
| 8 | Renderer puede pedir cualquier ruta | CSP estricto en `index.html`: `default-src 'self'; connect-src 'self' https://*.supabase.co https://litper-semaforo.vercel.app; img-src 'self' data: blob:` |
| 9 | `webSecurity: false` para hacks rápidos | **Prohibido**. Si algo no carga por CORS, se arregla en el servidor, no apagando webSecurity. |
| 10 | Apertura de URLs externas con `shell.openExternal` sobre URL no validada | Whitelist de dominios (`litper.com`, `supabase.co`, `web.whatsapp.com`, `meta.com`). Cualquier otra URL → confirm dialog. |

### 2.3 WebView del semáforo embebido

| # | Riesgo | Control |
|---|--------|---------|
| 11 | Inyección de token via `executeJavaScript` puede ser interceptada por XSS del semáforo | Verificar que el dashboard estático no tenga XSS antes de inyectar. Usar `partition: 'persist:semaforo'` para aislar cookies. |
| 12 | El webview navega a sitio malicioso (link en chat IA) | `will-navigate` listener: si el host destino no es litper-semaforo.vercel.app o supabase.co → preventDefault y abrir en navegador externo con confirm. |
| 13 | Webview ejecuta tracker de terceros que ve el token | `setUserAgent` neutro, bloquear `googletagmanager.com`/`facebook.net` con `webRequest.onBeforeRequest` cuando esté en modo embedded. |

### 2.4 Multi-tenant y RLS

| # | Riesgo | Control |
|---|--------|---------|
| 14 | RLS mal escrita permite leer filas de otra org | Cada policy se escribe como `org_id = (auth.jwt()->>'org_id')::uuid` con tests automatizados (`pgTAP` o supatest). |
| 15 | `service_role` key expuesta al cliente | NUNCA en frontend ni renderer. Solo en Edge Functions de Cloudflare/Vercel/Supabase. Auditar `git grep service_role`. |
| 16 | JWT sin claim `org_id` | Hook `on_auth_user_created` que escribe `app_metadata.org_id`. Verificar que el JWT lo lleve. |
| 17 | Realtime con RLS deshabilitado | Habilitar `enable_row_level_security` en el publication usado por Realtime; sin esto, los suscriptores ven todo. |
| 18 | Cuando se crea ronda, el creador no se setea | Default `created_by = auth.uid()` en SQL, no confiar en payload del cliente. |

### 2.5 Captura de pantalla y privacidad

| # | Riesgo | Control |
|---|--------|---------|
| 19 | Screenshots auto-suben a la nube sin querer | **Default OFF**: nunca auto-upload. Botón "compartir" explícito por captura. |
| 20 | Screenshot accidental contiene datos PII de cliente | Antes de exportar, opción de blur automático sobre regiones detectadas como nombres/teléfonos (regex). |
| 21 | macOS pide permiso de captura | Ya descartamos macOS, pero documentado: `entitlements.mac.plist` con `com.apple.security.device.screen-capture`. |
| 22 | Windows DRM bloquea captura de Netflix/Disney+ | Aceptable, no es uso esperado. Mostrar mensaje cuando devuelve frame negro. |
| 23 | OCR de screenshot envía la imagen a un servicio externo | **Tesseract.js corre 100% local**. Cero datos a la nube. |

### 2.6 MCP Server "Litper Hub" privado

| # | Riesgo | Control |
|---|--------|---------|
| 24 | Cliente MCP malicioso ejecuta tool destructivo | Cada tool con `permissions` enum (`read`, `write`, `admin`). Por defecto solo `read`. `write` requiere flag explícito. `admin` requiere reauth. |
| 25 | MCP server expuesto en TCP público | Solo stdio transport (proceso hijo). NO HTTP/WS abierto. |
| 26 | Token Supabase del MCP es de service_role | Token scoped por usuario (anon + JWT del usuario actual). El MCP NUNCA usa service_role. |
| 27 | Logs del MCP filtran tokens en consola | Logger custom que redacta `Bearer .*`, `eyJ.*`, etc. con regex. |

### 2.7 Build y distribución

| # | Riesgo | Control |
|---|--------|---------|
| 28 | Windows Defender flagueia .exe sin firma | Code signing con cert EV (~$300/año) o standard (~$80/año). Sin firma, los operadores deben hacer "Más información → Ejecutar de todas formas". Aceptable para canal interno. |
| 29 | .exe modificado durante distribución por Drive/WhatsApp | Publicar `SHA256` del binario en mensaje de WhatsApp. Operador puede verificar (`certutil -hashfile`). |
| 30 | Auto-update aceptado pero descartamos esa fase | Hard-coded en código: la app revisa semanalmente un endpoint público (`/api/desk-version`) y avisa "hay v1.2 disponible, descárgala manualmente". Sin auto-install. |

### 2.8 Otros

| # | Riesgo | Control |
|---|--------|---------|
| 31 | Crash report contiene datos PII | Sentry con `beforeSend` hook que redacta `email`, `phone`, `address`. |
| 32 | Logs locales crecen indefinidamente | `electron-log` con rotación: max 10MB / 5 archivos. |
| 33 | Un operador deja la sesión abierta y otro usa la máquina | Auto-lock tras 15 min de inactividad → requiere PIN/biometría OS para desbloquear. |
| 34 | Clipboard guarda token después de paste | Limpiar clipboard tras 30s para textos detectados como token (`eyJ` prefix). |
| 35 | Telemetría opcional activada por defecto | **Default OFF**. Onboarding pregunta opt-in. PostHog con `disable_session_recording` y `mask_all_text`. |

---

## 3. Revisión de funcionalidad

### 3.1 Edge cases del flujo principal

| Escenario | Comportamiento esperado | Implementación |
|-----------|------------------------|----------------|
| Operador pierde conexión a mitad de ronda | Sigue contando, guarda local, sincroniza al reconectar | Cola de mutaciones con `redux-offline` o store custom. CRDT no necesario (operaciones idempotentes). |
| Dos operadores editan la misma ronda (admin reasigna) | Last-write-wins con timestamp del servidor + warning | `updated_at` server-side; si llega evento Realtime con timestamp posterior al local, hacer merge automático y notificar. |
| Timer corre y operador está AFK 10 min | Detectar idle (`powerMonitor.getSystemIdleTime`) y pausar timer; al volver, mostrar "estuviste 10 min ausente, ¿restamos?" | API ya disponible en Electron. |
| Reloj del sistema mal seteado | Timer cuenta mal | Usar diff con `Date.now()` server (Supabase `select now()` cada 60s) para corregir drift. |
| Cambio de zona horaria (Bogotá vs Santiago) | KPIs por día se calculan correcto | Almacenar siempre UTC; renderizar con tz del operador (`Intl.DateTimeFormat`). |
| Monitor externo se desconecta mid-sesión | Halo flotante reaparece en monitor primario | Listener `screen.on('display-removed')` reposiciona ventanas huérfanas. |
| DPI cambia (mover a monitor 4K) | Layout no se rompe | `BrowserWindow` con `useContentSize: true` + container queries CSS. |
| Suspende laptop, reabre 4 horas después | Sesión Supabase expirada → silencioso re-login con refresh_token | Listener `powerMonitor.on('resume')` → forzar `getSession()` + reconectar Realtime. |
| Realtime channel se cae 30s | Reintentar con backoff exponencial (1s, 2s, 4s, 8s, max 60s) | Wrapper sobre `supabase.channel` que maneja reconexión. |
| Token Supabase expirado mid-acción | Pausar UI, hacer refresh silencioso, retry | Interceptor en cliente; si falla → logout y modal "tu sesión expiró". |
| Operador minimiza la app | Tray icon con badge "ronda activa" | Ya implementable con `tray.setImage` + número. |
| Operador mata el proceso desde Task Manager | Próxima apertura recupera ronda en curso | Persistir cada cambio a SQLite local; al iniciar, ofrecer "tenías una ronda activa, ¿continuar?". |

### 3.2 Huecos en el plan original

1. **Sin export de datos** — el equipo querrá descargar histórico a Excel. Agregar botón en Comando: "exportar mes" → genera `.xlsx` con `xlsx` (ya en deps).
2. **Sin auditoría de cambios** — supervisor no sabe quién modificó una ronda. Tabla `audit_log` con trigger Postgres.
3. **Sin gestión de festivos** — meta diaria del equipo no se ajusta en festivos colombianos. Tabla `holidays` y ajuste automático.
4. **Sin manejo de turnos** — no se sabe si un operador está "trabajando" o "almorzando". Estados: `online | break | offline | shadowing`.
5. **Sin onboarding del operador nuevo** — primer login debería ser un tour de 90s. Resuelto con Gamma + checklist gamificado.
6. **Sin modo entrenamiento** — operador junior necesita practicar sin afectar KPIs. Toggle "modo demo" que no escribe a Supabase.
7. **Sin alertas push de OS** — solo notificaciones in-app. Agregar `Notification` API nativa para "ciudad en rojo" cuando la app está minimizada.
8. **Sin accesibilidad** — `aria-label`, navegación con Tab, focus rings, soporte para Narrator/VoiceOver. Crítico para certificación WCAG si va a SaaS.
9. **Sin internacionalización real** — la carpeta `i18n/` existe pero está semivacía. ES/EN/PT-BR como mínimo cuando sea SaaS.
10. **Sin offline-first explícito** — el plan dice "offline-first" pero no detalla cola. Solución: Outbox pattern con SQLite local + worker que sincroniza.

### 3.3 Verificación de las funcionalidades pedidas explícitamente

| Pedido del usuario | Cobertura | Falta |
|--------------------|-----------|-------|
| Gestión equipo de rondas | ✅ Fase 2 | — |
| Conexión semáforo + ASDA3EEEE | ✅ Capas 1-4 | Validar en producción que las dos orgs se autentican con mismo email/password |
| MCP integration | ✅ Fase 6 | Documentar registro en Claude Desktop |
| Botón semáforo siempre disponible | ✅ Fase 3 | Definir tamaño/posición del pin (32×32px en esquina del Halo) |
| Buscador | ✅ Fase 4 | Definir índice inicial (qué entidades) |
| Gestión de equipo | ✅ Fase 2 | Explicitar roles y permisos |
| Screenshots | ✅ Fase 5 | OK |
| Diferentes formas / opacidad / dinámico | ✅ Fase 5 | OK |
| 100% dinámico, layout que se adapta | ✅ Container Queries | Documentar breakpoints relativos |
| Análisis funcionalidades para empresas e-commerce | ✅ §6 referentes | OK |
| Referentes USA y Brasil | ✅ §6 plan original | OK |

**Veredicto**: el plan original cubre 100% de lo pedido. Los huecos son refinamientos y edge cases.

---

## 4. Ideas nuevas

12 propuestas que NO estaban en el plan original. Cada una agrega valor desproporcionado al esfuerzo.

### Idea 1 — "Coach IA" en tiempo real
Cada 15 min, la app llama a Claude (vía Anthropic SDK ya presente) con `city_stats` + `ronda_eventos` actuales y devuelve **una sola sugerencia accionable**: "Llama primero a Cartagena, su tasa cayó 4% en la última hora". Ventana flotante de 3s que aparece y se va sola.
- Costo: ~$0.0003 por sugerencia con prompt caching.
- Tools usados: Anthropic SDK (ya en repo).

### Idea 2 — Modo "Shadowing" (supervisor ve sin interrumpir)
Catalina puede activar "ver ronda de Jimmy" y obtiene una vista en vivo (NO screenshare — solo el state del Halo de Jimmy). Se entera si Jimmy está atrancado sin tener que llamarlo.
- Implementación: Supabase Realtime sobre `ronda_eventos` con filtro `user_id = $1`.

### Idea 3 — Macro recorder de WhatsApp
Operador hace 1 vez una secuencia: abrir WhatsApp Web → pegar plantilla "cancelado" → enviar. La app graba la secuencia y la convierte en botón "Cancelar (1-click)". Atajos personalizables por operador.
- Tools usados: `robotjs` o `nut-tree` (Node libs). Permiso del usuario explícito.

### Idea 4 — Voice command local
"Litper, registra realizado" → Whisper local (tesseract pero para audio) transcribe → ejecuta `+1 Realizado`. Cero datos a la nube. Útil cuando las manos están tipeando en otra app.
- Modelo: `whisper-tiny.es` (39MB).
- Tool MCP: `hf_doc_search` para encontrar el modelo correcto.

### Idea 5 — Heatmap operador × hora
Vista que muestra qué operadores rinden mejor a qué horas del día. Insight para que Catalina ajuste turnos.
- Componente: heatmap con `recharts` (ya en deps).

### Idea 6 — Pomodoro inteligente
La app detecta cuándo el operador necesita un break (caída de tasa de 10% en 30 min) y sugiere "5 min de pausa". Bonus: integración Spotify para sugerir playlist relajante.
- Tools: `Spotify MCP` (ya disponible).

### Idea 7 — Reporte diario PDF auto-generado
Al terminar el día, el desktop genera un PDF (`jspdf` ya en deps) con KPIs del operador y lo sube a Drive (`Google Drive MCP`). Mañana siguiente Catalina lo encuentra clasificado por fecha.
- Tools: `jspdf` + Google Drive MCP `create_file`.

### Idea 8 — Lock-screen widget de Windows 11
Live tile en el lock screen que muestra "tasa de entrega del día: 78%". Sin abrir la máquina, el operador ve el estado.
- Implementación: Windows 11 Widget Board API.

### Idea 9 — Modo "Reseña con cliente"
Si en la captura de pantalla detecta texto con dirección/teléfono, ofrece automáticamente "abrir en WhatsApp Web". OCR local + regex.
- Tools: `tesseract.js` + `wa.me/` deeplink.

### Idea 10 — Calendario de turnos integrado
La pestaña "Equipo" tiene un calendario con turnos y permite arrastrar para reasignar. Integra con Google Calendar.
- Tools: `Calendar MCP` (`create_event`, `update_event`).

### Idea 11 — Inbox unificado del equipo
Pestaña que muestra correos urgentes + mensajes Slack + WhatsApp pendientes en una sola vista, ordenados por urgencia (la urgencia la define una regla simple: "si menciona ciudad roja → top").
- Tools: `Gmail MCP` + `Slack MCP` + WhatsApp Cloud (Fase 7).

### Idea 12 — "Sala de guerra" en monitor 2
Si el operador tiene 2 monitores, el segundo puede mostrar el dashboard del semáforo a pantalla completa con `kiosk: true`. Modo presentación pasivo.
- API: `BrowserWindow({ kiosk: true })` en `screen.getAllDisplays()[1]`.

---

## 5. Plan de ejecución consolidado

### 5.1 Fases revisadas (con MCPs y nuevas ideas)

| Fase | Duración | Entregables | MCPs usados | Ideas nuevas incluidas |
|------|----------|-------------|-------------|------------------------|
| **0 — Consolidación + brand kit** | 3-5 días | Repo limpio, brand kit Canva, app icon, splash | Canva, Higgsfield | — |
| **1 — Halo + Tray + Atajos seguros** | 1 sem | .exe Win + .deb Linux, sandbox + CSP estricto, IPC validado con zod | — | Idea 12 (kiosk monitor 2) |
| **2 — Equipo + Rondas + RLS multi-tenant** | 1 sem | Supabase migraciones, roles, audit_log, holidays, modo demo | Supabase MCP | Ideas 5, 6 (heatmap + pomodoro) |
| **3 — Botón Semáforo + WebView SSO + Realtime** | 1 sem | Cliente Supabase dual, alertas push, modo shadowing | Supabase MCP | Ideas 2 (shadowing) |
| **4 — Buscador Ctrl+K federado** | 4 días | Index local + Gmail/Slack/Notion search | Gmail, Slack, Notion | Idea 11 (inbox unificado) |
| **5 — Screenshots + anotación + OCR + voice** | 1.5 sem | Konva canvas, Tesseract local, Whisper local | HF MCP | Ideas 4, 9 (voice + WhatsApp deeplink) |
| **6 — MCP Hub privado** | 1 sem | mcp-server con tools read-only por default, scoping | Anthropic SDK | Idea 1 (coach IA) |
| **7 — WhatsApp Cloud + Macro recorder** | 4 días | Tokens en keychain, macro recorder | WhatsApp Cloud | Idea 3 (macro), 7 (PDF a Drive), 10 (calendar) |
| **8 — Distribución Win+Linux + checksum** | 3 días | NSIS firmado, checksums en WhatsApp, R2 fallback | Cloudflare MCP | Idea 8 (Windows 11 widget) |

**Total estimado**: ~7-8 semanas (sin cambios respecto a `DECISIONES_LITPER_DESK.md`).

### 5.2 Orden recomendado de ejecución

```
Día 1-2:  Setup brand kit Canva → app icon, splash, ventana About.
Día 3-5:  Auditoría 3 prototipos, archivar tracker, fusionar pedidos-app + electron.
Sem 1:    Halo + sandbox + CSP + IPC zod.
Sem 2:    Migraciones Supabase ASDA + RLS + roles + audit_log.
Sem 3:    Cliente dual Supabase + WebView semáforo SSO + Realtime + shadowing.
Sem 4:    Ctrl+K federado + heatmap.
Sem 5-6:  Screenshots Konva + OCR Tesseract + Voice Whisper local.
Sem 7:    MCP Hub privado + Coach IA + WhatsApp Cloud + macro recorder.
Sem 8:    Polish + checksums + reporte PDF a Drive + lock-screen widget.
```

### 5.3 Mínimo viable demo (por si quieres ver algo en 1 semana)

Si en lugar de ir por las 8 fases prefieres una demo rápida:

- **Día 1**: brand kit + app icon (Canva).
- **Día 2-3**: Halo flotante + tray + Ctrl+Shift+L (recuperar `electron/main.js`).
- **Día 4**: Botón semáforo (consume `/api/semaforo-status` que aún no existe — mock primero).
- **Día 5**: Timer + 3 contadores (+/-) escribiendo a SQLite local (sin Supabase aún).
- **Día 6**: Empaquetar .exe Windows con NSIS, generar checksum.
- **Día 7**: Probar con 1 operador real y ajustar.

**Demo entregable en 7 días.** Cero conexión Supabase real, cero MCP, cero WhatsApp. Solo el "feel" de la app.

### 5.4 Decisiones que aún quedan abiertas (no urgentes)

1. ¿El brand kit de Canva lo hago yo proponiendo paleta o usas la que ya tienes en `BRAND_IDENTITY.md` del semáforo?
2. ¿Quieres Sentry para crash reports o lo saltamos para evitar terceros?
3. ¿El audit_log se queda 30 / 90 / 365 días?
4. ¿Voice command local (Idea 4) entra en MVP o lo dejamos para v1.1?
5. ¿La idea del "Coach IA" usa Claude (Anthropic SDK ya conectado) o Gemini (también conectado)?

---

> **Próximo paso**: dar luz verde a la Fase 0 + responder las 5 decisiones abiertas (sección 5.4) cuando estés listo. Mientras tanto, este documento queda como referencia única del scope total.
