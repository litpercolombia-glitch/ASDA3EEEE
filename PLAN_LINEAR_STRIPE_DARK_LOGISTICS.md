# PLAN V2: "Linear meets Stripe on Dark Logistics"
# Upgrade del Design System + Integracion Stripe de LITPER PRO

---

## INVESTIGACION AMPLIADA: 35+ EMPRESAS TOP GLOBALES

### Nuevas empresas investigadas (ademas de las 17 originales):

| Empresa | Design System | Hallazgo Clave para LITPER |
|---------|---------------|---------------------------|
| **Salesforce** | SLDS 2.0 (2025) | Tokens semanticos `--slds-g-color-*`, dark mode via Cosmos theme. 9 accent colors nuevos |
| **SAP** | Fiori 3.0 | Horizon theme claro por defecto, Quartz dark. border-radius `8px`, data-dense tables |
| **Shopify** | Polaris (Web Components 2025) | Tokens `--p-color-*` con paletas de 10 shades. Semantic naming: `text-subdued`, no `gray-500` |
| **Ant Design** | Ant Design 5 (Alibaba) | Dark bg: `#141414`, primary dark: `#177ddc`. Algoritmo genera palette de 10 colores desde 1 seed |
| **Stripe** | Custom (Sohne font) | Shadow system 5-niveles con tinte `rgba(50,50,93,...)`. bg `#F6F9FC` calido |
| **Square** | Block Design | Monochrome + 1 accent. Metric cards con sparklines inline |
| **Wise** | Wise Design System | Ultra-clean, green `#9FE870`, gray navigation, micro-animations |
| **Nubank** | Nu Design System | Purple `#820AD1` primario, dark mode elegante, font Nu Sans |
| **Retool** | Component Library | Data-dense grids, internal tool patterns, collapsible inspector panels |
| **Monday.com** | Vibe Design System | Color-per-board branding, workspace switching, high-contrast badges |
| **Tableau** | Visual Analytics | Chart-first dashboards, filter chips, cross-highlighting interactions |
| **Snowflake** | Snowsight | Query editor + results + charts en split-pane layout |

### Patrones de design systems enterprise mas usados (2025):

| Patron | Usado por | Descripcion |
|--------|-----------|-------------|
| Semantic Color Tokens | Salesforce, Shopify, Stripe, Ant | Nombrar por funcion (`text-subdued`) no por valor (`gray-500`) |
| 3-Level Surface Elevation | Linear, Grafana, Datadog | Canvas -> Surface -> Elevated (luminosidad incremental) |
| Tinted Shadows | Stripe, Vercel | Sombras con rgba del brand color, no negro puro |
| Command Palette (Cmd+K) | Linear, Vercel, Notion, Raycast | Acceso rapido a todo via teclado |
| Bento Grid | Apple, Linear, Notion, 67% SaaS | Grid modular asimetrico para dashboards |
| Feature Gating UI | Slack, Spotify, Linear, Notion | Lock icon + upgrade prompt sutil sin molestar |

---

## DIAGNOSTICO DEL ESTADO ACTUAL

### Lo que YA tiene LITPER PRO (Command Center Sci-Fi):
- Sidebar `cc-sidebar`, neon cyan `#00f5ff` + amber `#ffb800`
- Glassmorphism `.cc-glass` con `backdrop-filter: blur(20px) saturate(180%)`
- Background `#0a0e17` con grid overlay + floating orbs
- Cards `bg-gray-800/50 border-gray-700` (generico Tailwind)
- Modals `bg-gray-900 border-gray-700` con gradientes indigo-purple
- Inputs `bg-gray-800 border-gray-600 focus:ring-indigo-500`
- Buttons `bg-gradient-to-r from-indigo-600 to-purple-600`

### Problema: Inconsistencia visual + Sin monetizacion
1. Componentes ReportUpload usan lenguaje visual distinto al Command Center
2. No hay integracion de pagos (Stripe)
3. No hay pricing page ni sistema de planes
4. No hay feature gating para conversion freemium -> paid

---

## OBJETIVO V2: Design System Unificado + Stripe Revenue Engine

Fusionar lo MEJOR de cada referencia:
- **Linear**: Glassmorphism sutil, borders rgba white, LCH surfaces
- **Stripe**: 5-level shadow system con tinte blue, Appearance API dark theme
- **Shopify Polaris**: Semantic tokens por funcion
- **Ant Design**: Algoritmo de generacion de paletas desde seed color
- **Grafana**: Elevacion por capas para NOC/dashboards
- **Bento Grid**: Layout modular para KPIs

**NUEVO**: Integracion completa de Stripe para monetizacion

---

## FASE 1: Design Tokens Centralizados (index.html)

### Archivo: `index.html` - seccion `:root`

**AGREGAR estos tokens (NO borrar los existentes):**

```css
:root {
  /* === LITPER DESIGN SYSTEM V2: Linear meets Stripe === */

  /* Surface Elevation System (Grafana-inspired layers) */
  --ls-canvas:          #0a0e17;
  --ls-surface-1:       #111827;
  --ls-surface-2:       #1a1f2e;
  --ls-surface-3:       #252b3b;
  --ls-surface-overlay: rgba(0, 0, 0, 0.6);

  /* Border Tokens (Linear-style rgba white) */
  --ls-border-subtle:   rgba(255, 255, 255, 0.06);
  --ls-border-default:  rgba(255, 255, 255, 0.10);
  --ls-border-emphasis: rgba(255, 255, 255, 0.16);
  --ls-border-active:   rgba(0, 245, 255, 0.3);

  /* Text Tokens (Shopify Polaris semantic naming) */
  --ls-text-primary:    #f1f5f9;
  --ls-text-secondary:  #94a3b8;
  --ls-text-tertiary:   #64748b;
  --ls-text-accent:     #00f5ff;

  /* Stripe-Quality Shadow System (5 levels, blue-tinted) */
  --ls-shadow-1: 0 1px 3px rgba(14, 165, 233, 0.04), 0 1px 2px rgba(0, 0, 0, 0.08);
  --ls-shadow-2: 0 3px 6px rgba(14, 165, 233, 0.06), 0 2px 4px rgba(0, 0, 0, 0.10);
  --ls-shadow-3: 0 6px 12px rgba(14, 165, 233, 0.08), 0 3px 6px rgba(0, 0, 0, 0.12);
  --ls-shadow-4: 0 10px 24px rgba(14, 165, 233, 0.10), 0 6px 12px rgba(0, 0, 0, 0.14);
  --ls-shadow-5: 0 20px 40px rgba(14, 165, 233, 0.12), 0 8px 16px rgba(0, 0, 0, 0.18);
  --ls-shadow-modal: 0 25px 50px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05);

  /* Stripe Payment UI Tokens */
  --ls-stripe-bg:       #0a0e17;
  --ls-stripe-surface:  #111827;
  --ls-stripe-text:     #f1f5f9;
  --ls-stripe-primary:  #00f5ff;
  --ls-stripe-danger:   #f87171;
  --ls-stripe-radius:   10px;
}
```

---

## FASE 2: CSS Classes Nuevas (index.html)

### Bloque completo de clases `.ls-*`:

```css
/* ============================================
   LITPER V2: LINEAR MEETS STRIPE ON DARK
   ============================================ */

/* --- Card System (3 niveles) --- */
.ls-card {
  background: var(--ls-surface-1);
  border: 1px solid var(--ls-border-subtle);
  border-radius: 12px;
  box-shadow: var(--ls-shadow-1);
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
.ls-card:hover {
  border-color: var(--ls-border-default);
  box-shadow: var(--ls-shadow-2);
  transform: translateY(-1px);
}

.ls-card-elevated {
  background: var(--ls-surface-2);
  border: 1px solid var(--ls-border-default);
  border-radius: 12px;
  box-shadow: var(--ls-shadow-2);
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
.ls-card-elevated:hover {
  border-color: var(--ls-border-emphasis);
  box-shadow: var(--ls-shadow-3);
  transform: translateY(-1px);
}

.ls-card-glass {
  background: rgba(17, 24, 39, 0.75);
  backdrop-filter: blur(12px) saturate(150%);
  -webkit-backdrop-filter: blur(12px) saturate(150%);
  border: 1px solid var(--ls-border-subtle);
  border-radius: 12px;
  box-shadow: var(--ls-shadow-2);
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
.ls-card-glass:hover {
  border-color: var(--ls-border-default);
  box-shadow: var(--ls-shadow-3);
}

/* --- KPI Metric Card (Bento-ready) --- */
.ls-metric-card {
  background: linear-gradient(135deg, var(--ls-surface-1) 0%, var(--ls-surface-2) 100%);
  border: 1px solid var(--ls-border-subtle);
  border-radius: 12px;
  box-shadow: var(--ls-shadow-1);
  padding: 1.25rem;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
.ls-metric-card:hover {
  border-color: var(--ls-border-default);
  box-shadow: var(--ls-shadow-2);
  transform: translateY(-2px);
}

/* --- Modal System --- */
.ls-modal-overlay {
  background: var(--ls-surface-overlay);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
.ls-modal {
  background: linear-gradient(135deg, rgba(17,24,39,0.95) 0%, rgba(10,14,23,0.98) 100%);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--ls-border-default);
  border-radius: 16px;
  box-shadow: var(--ls-shadow-modal);
  animation: ls-modal-enter 250ms var(--easing-smooth);
}
@keyframes ls-modal-enter {
  0% { opacity: 0; transform: scale(0.96) translateY(8px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

/* --- Input System --- */
.ls-input {
  background: var(--ls-surface-1);
  border: 1px solid var(--ls-border-default);
  border-radius: 10px;
  color: var(--ls-text-primary);
  padding: 0.625rem 1rem;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}
.ls-input::placeholder { color: var(--ls-text-tertiary); }
.ls-input:focus {
  outline: none;
  border-color: rgba(0, 245, 255, 0.4);
  box-shadow: 0 0 0 3px rgba(0, 245, 255, 0.1), var(--ls-shadow-1);
}

/* --- Button System --- */
.ls-btn-primary {
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  color: white;
  font-weight: 500;
  border-radius: 10px;
  padding: 0.625rem 1.25rem;
  border: none;
  box-shadow: var(--ls-shadow-2), 0 0 20px rgba(14, 165, 233, 0.15);
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
.ls-btn-primary:hover {
  box-shadow: var(--ls-shadow-3), 0 0 30px rgba(14, 165, 233, 0.25);
  transform: translateY(-1px);
}
.ls-btn-primary:active { transform: translateY(0) scale(0.98); }

.ls-btn-secondary {
  background: var(--ls-surface-2);
  color: var(--ls-text-secondary);
  border: 1px solid var(--ls-border-default);
  border-radius: 10px;
  padding: 0.625rem 1.25rem;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}
.ls-btn-secondary:hover {
  color: var(--ls-text-primary);
  border-color: var(--ls-border-emphasis);
  background: var(--ls-surface-3);
}

/* --- Status Badges (semantic) --- */
.ls-badge {
  display: inline-flex; align-items: center; gap: 0.375rem;
  padding: 0.25rem 0.625rem; font-size: 0.75rem; font-weight: 500;
  border-radius: 9999px; border: 1px solid transparent;
}
.ls-badge-blue   { background: rgba(96,165,250,0.15);  color: #60a5fa; border-color: rgba(96,165,250,0.25); }
.ls-badge-green  { background: rgba(74,222,128,0.15);  color: #4ade80; border-color: rgba(74,222,128,0.25); }
.ls-badge-amber  { background: rgba(251,191,36,0.15);  color: #fbbf24; border-color: rgba(251,191,36,0.25); }
.ls-badge-red    { background: rgba(248,113,113,0.15); color: #f87171; border-color: rgba(248,113,113,0.25); }
.ls-badge-purple { background: rgba(168,85,247,0.15);  color: #a855f7; border-color: rgba(168,85,247,0.25); }
.ls-badge-cyan   { background: rgba(0,245,255,0.12);   color: #00f5ff; border-color: rgba(0,245,255,0.20); }

/* --- Bento Grid --- */
.ls-bento { display: grid; gap: 1rem; grid-template-columns: repeat(4, 1fr); }
.ls-bento-2x2 { grid-column: span 2; grid-row: span 2; }
.ls-bento-2x1 { grid-column: span 2; }
.ls-bento-1x2 { grid-row: span 2; }
@media (max-width: 1024px) {
  .ls-bento { grid-template-columns: repeat(2, 1fr); }
  .ls-bento-2x2 { grid-column: span 2; grid-row: span 1; }
}
@media (max-width: 640px) {
  .ls-bento { grid-template-columns: 1fr; }
  .ls-bento-2x2, .ls-bento-2x1 { grid-column: span 1; }
  .ls-bento-1x2 { grid-row: span 1; }
}

/* --- Pricing Card (inspirado en Linear/Vercel pricing pages) --- */
.ls-pricing-card {
  background: var(--ls-surface-1);
  border: 1px solid var(--ls-border-subtle);
  border-radius: 16px;
  box-shadow: var(--ls-shadow-2);
  padding: 2rem;
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}
.ls-pricing-card:hover {
  border-color: var(--ls-border-emphasis);
  box-shadow: var(--ls-shadow-4);
  transform: translateY(-4px);
}
.ls-pricing-card.recommended {
  border-color: rgba(0, 245, 255, 0.4);
  box-shadow: var(--ls-shadow-3), 0 0 40px rgba(0, 245, 255, 0.08);
}
.ls-pricing-card.recommended::before {
  content: 'Mas Popular';
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.25rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #0a0e17;
  background: linear-gradient(135deg, #00f5ff, #0ea5e9);
  border-radius: 9999px;
}

/* --- Feature Gate (Lock overlay) --- */
.ls-feature-gate {
  position: relative;
  overflow: hidden;
}
.ls-feature-gate::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(10, 14, 23, 0.7);
  backdrop-filter: blur(4px);
  border-radius: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 200ms;
  pointer-events: none;
}
.ls-feature-gate.locked::after {
  opacity: 1;
  pointer-events: auto;
}

/* --- Dropzone, Progress, Table Row, Divider --- */
.ls-dropzone {
  border: 2px dashed var(--ls-border-default);
  border-radius: 12px; padding: 2rem; text-align: center;
  cursor: pointer; transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
.ls-dropzone:hover { border-color: rgba(0,245,255,0.3); background: rgba(0,245,255,0.03); }
.ls-dropzone.dragging { border-color: rgba(0,245,255,0.5); background: rgba(0,245,255,0.06); transform: scale(1.01); }
.ls-dropzone.has-file { border-color: rgba(74,222,128,0.4); border-style: solid; background: rgba(74,222,128,0.04); }

.ls-progress-track { background: var(--ls-surface-2); border-radius: 9999px; height: 8px; overflow: hidden; }
.ls-progress-fill { height: 100%; border-radius: 9999px; transition: width 500ms cubic-bezier(0.4, 0, 0.2, 1); }

.ls-table-row { background: transparent; border-bottom: 1px solid var(--ls-border-subtle); transition: background 150ms; }
.ls-table-row:hover { background: rgba(255, 255, 255, 0.02); }

.ls-divider { height: 1px; background: var(--ls-border-subtle); }
```

---

## FASE 3: Componentes React - Migracion de Clases

### 3.1 ReportUploadModal.tsx (mapeo linea por linea)

| Elemento | ANTES | DESPUES |
|----------|-------|---------|
| Overlay (176) | `bg-black/60 backdrop-blur-sm` | `ls-modal-overlay` |
| Modal (178) | `bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl` | `ls-modal` |
| Header (182) | `border-b border-gray-700 bg-gradient-to-r from-indigo-600/20 to-purple-600/20` | `border-b border-[rgba(255,255,255,0.06)] bg-[rgba(0,245,255,0.04)]` |
| Icon box (184) | `bg-indigo-500/30` | `bg-[rgba(0,245,255,0.12)]` |
| Icon (185) | `text-indigo-400` | `text-cyan-400` |
| Title (188) | `font-bold` | `font-semibold` |
| Close btn (192) | `hover:bg-gray-700` | `hover:bg-white/[0.06]` |
| Drop zone (223) | `border-indigo-500 bg-indigo-500/10` / `border-gray-600` | `.ls-dropzone` / `.dragging` / `.has-file` |
| Inputs (282) | `bg-gray-800 border-gray-600 focus:ring-indigo-500` | `ls-input w-full` |
| Category btns | `border-indigo-500 bg-indigo-500/20` | Activo: `border-[rgba(0,245,255,0.4)] bg-[rgba(0,245,255,0.08)]` |
| Footer (371) | `border-t border-gray-700 bg-gray-800/50` | `border-t border-[rgba(255,255,255,0.06)] bg-[rgba(17,24,39,0.5)]` |
| Cancel btn | `border-gray-600 hover:bg-gray-700` | `ls-btn-secondary` |
| Submit btn | `from-indigo-600 to-purple-600` | `ls-btn-primary` |

### 3.2 AdminReportsView.tsx

| Elemento | ANTES | DESPUES |
|----------|-------|---------|
| Stat cards wrapper | `grid grid-cols-2 lg:grid-cols-4 gap-4` | `ls-bento` |
| Stat cards | `bg-gray-800/50 rounded-xl border border-gray-700` | `ls-metric-card` |
| Compliance bar container | `bg-gray-800/50 rounded-xl border border-gray-700` | `ls-card p-4` |
| Progress track | `bg-gray-700 rounded-full h-3` | `ls-progress-track` |
| Tab bar border | `border-b border-gray-700` | `border-b border-[rgba(255,255,255,0.06)]` |
| Tab active | `bg-indigo-600 text-white` | `bg-[rgba(0,245,255,0.12)] text-cyan-400` |
| Tab inactive | `text-gray-400 hover:bg-gray-700` | `text-[#94a3b8] hover:bg-white/[0.04]` |
| Search input | `bg-gray-800 border-gray-700 focus:ring-indigo-500` | `ls-input` |
| Report cards | `bg-gray-800/50 rounded-xl border border-gray-700` | `ls-card p-4` |
| Status badges | `STATUS_CONFIG[].bgColor` | `ls-badge ls-badge-{color}` |
| Review modal | `bg-gray-900 border border-gray-700` | `ls-modal` |
| Review inner | `bg-gray-800 rounded-xl` | `ls-card-elevated` |
| Reject btn | `bg-red-600` | `bg-[rgba(248,113,113,0.15)] text-red-400 border-[rgba(248,113,113,0.3)]` |
| Approve btn | `bg-green-600` | `from-emerald-500 to-green-600 shadow-[0_0_20px_rgba(74,222,128,0.15)]` |

### 3.3 MyReportsPanel.tsx

| Elemento | ANTES | DESPUES |
|----------|-------|---------|
| Upload btn | `from-indigo-600 to-purple-600` | `ls-btn-primary` |
| Active pill | `bg-indigo-600 text-white` | `bg-[rgba(0,245,255,0.12)] text-cyan-400` |
| Report cards | `bg-gray-800/50 border-gray-700` | `ls-card p-4` |
| File icon bg | `bg-gray-700/50` | `bg-white/[0.04] border border-[rgba(255,255,255,0.06)]` |
| Tags | `bg-gray-700` | `bg-white/[0.06] border border-[rgba(255,255,255,0.06)]` |
| View btn | `bg-gray-700 hover:bg-gray-600` | `ls-btn-secondary` |
| Detail modal | `bg-gray-900 border-gray-700` | `ls-modal` |
| Detail card | `bg-gray-800` | `ls-card-elevated` |

---

## FASE 4: INTEGRACION STRIPE (NUEVO)

### 4.1 Arquitectura de Pagos para LITPER PRO

```
┌──────────────────────────────────────────────────────────────┐
│                    LITPER PRO                                │
│                                                              │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────────┐ │
│  │ Pricing Page│   │ Checkout     │   │ Subscription     │ │
│  │ (3 tiers)   │──>│ (Stripe      │──>│ Management       │ │
│  │             │   │  Elements)   │   │ (Customer Portal)│ │
│  └─────────────┘   └──────────────┘   └──────────────────┘ │
│         │                  │                    │            │
│         │          ┌───────┴────────┐           │            │
│         │          │  Stripe API    │           │            │
│         │          │  (Server-side) │           │            │
│         │          └───────┬────────┘           │            │
│         │                  │                    │            │
│  ┌──────┴──────────────────┴────────────────────┴─────────┐ │
│  │              Feature Gating System                      │ │
│  │  Free: 50 envios/mes, reportes basicos                  │ │
│  │  Pro:  500 envios/mes, reportes + IA + analytics        │ │
│  │  Enterprise: Ilimitado, Connect, API, white-label       │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Packages NPM a Instalar

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

**Versiones (2025):**
- `@stripe/stripe-js` - SDK core del lado del cliente
- `@stripe/react-stripe-js` - React hooks + Elements components

### 4.3 Planes de Precio para LITPER PRO

| | **Starter** (Gratis) | **Pro** | **Enterprise** |
|---|---|---|---|
| **Precio** | $0/mes | $29/mes ($290/ano) | $99/mes ($990/ano) |
| **Envios/mes** | 50 | 500 | Ilimitado |
| **Reportes** | Basicos | Avanzados + IA | Custom + API |
| **Usuarios** | 1 | 5 | Ilimitado |
| **Tracking** | Manual | Auto + Push | Real-time + Webhooks |
| **Soporte** | Community | Email 24h | Dedicado + SLA |
| **Stripe Product ID** | `prod_free` | `prod_pro` | `prod_enterprise` |

### 4.4 Componentes Nuevos a Crear

#### `components/Billing/PricingPage.tsx`
Pricing page con 3 cards (Starter/Pro/Enterprise):

```
┌──────────────────────────────────────────────────┐
│            Elige tu plan LITPER PRO               │
│                                                    │
│  [Mensual] ──●── [Anual - Ahorra 17%]            │
│                                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ STARTER  │  │   PRO    │  │ENTERPRISE│       │
│  │  Gratis  │  │ $29/mes  │  │ $99/mes  │       │
│  │          │  │[Mas Pop.]│  │          │       │
│  │ 50 envios│  │500 envios│  │Ilimitado │       │
│  │ 1 user   │  │ 5 users  │  │Ilimitado │       │
│  │ Basico   │  │ IA + Ana.│  │ API+White│       │
│  │          │  │          │  │          │       │
│  │[Empezar] │  │[Upgrade] │  │[Contacto]│       │
│  └──────────┘  └──────────┘  └──────────┘       │
│                                                    │
│  "Usado por 200+ empresas de logistica en LATAM"  │
└──────────────────────────────────────────────────┘
```

**Clases a usar:**
- Contenedor: `ls-bento` con 3 columnas
- Cards: `ls-pricing-card` + `.recommended` para Pro
- Toggle: `ls-btn-secondary` con active state
- CTA: `ls-btn-primary` para Pro, `ls-btn-secondary` para otros
- Social proof: `ls-badge-cyan` con numero de empresas

#### `components/Billing/CheckoutModal.tsx`
Modal con Stripe PaymentElement integrado:

```tsx
// Appearance API para match con LITPER dark theme
const litperAppearance: Appearance = {
  theme: 'night',
  variables: {
    colorPrimary: '#00f5ff',        // Neon cyan brand
    colorBackground: '#111827',      // ls-surface-1
    colorText: '#f1f5f9',           // ls-text-primary
    colorDanger: '#f87171',         // Error red
    fontFamily: 'Inter, system-ui, sans-serif',
    spacingUnit: '4px',
    borderRadius: '10px',           // Match ls-input
    colorTextPlaceholder: '#64748b', // ls-text-tertiary
  },
  rules: {
    '.Tab': {
      border: '1px solid rgba(255, 255, 255, 0.10)',
      backgroundColor: '#111827',
      boxShadow: 'none',
    },
    '.Tab--selected': {
      borderColor: 'rgba(0, 245, 255, 0.4)',
      backgroundColor: 'rgba(0, 245, 255, 0.08)',
      color: '#00f5ff',
    },
    '.Tab:hover': {
      borderColor: 'rgba(255, 255, 255, 0.16)',
      backgroundColor: '#1a1f2e',
    },
    '.Input': {
      backgroundColor: '#111827',
      border: '1px solid rgba(255, 255, 255, 0.10)',
      boxShadow: 'none',
    },
    '.Input:focus': {
      borderColor: 'rgba(0, 245, 255, 0.4)',
      boxShadow: '0 0 0 3px rgba(0, 245, 255, 0.1)',
    },
    '.Label': {
      color: '#94a3b8',
      fontWeight: '500',
    },
  },
};
```

**Estructura del componente:**
```tsx
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function CheckoutModal({ plan, isOpen, onClose }) {
  // 1. Crear PaymentIntent via API
  // 2. Renderizar dentro de <Elements> con litperAppearance
  // 3. Manejar submit con stripe.confirmPayment()
  // 4. Mostrar success/error con ls-badge
}
```

#### `components/Billing/SubscriptionManager.tsx`
Panel de gestion de suscripcion (visible en sidebar bajo "Config"):

```
┌──────────────────────────────────────────┐
│  Tu Plan: PRO                [Cambiar]   │
│                                          │
│  ┌──────────────────────────────────────┐│
│  │ Uso este mes                        ││
│  │ ████████████░░░░░░  234/500 envios  ││
│  │ ████████░░░░░░░░░░  3/5 usuarios    ││
│  └──────────────────────────────────────┘│
│                                          │
│  Proxima factura: 15 Mar 2026 - $29 USD │
│  Metodo: •••• 4242                       │
│                                          │
│  [Historial de Facturas]                │
│  [Gestionar Metodo de Pago]             │
│  [Cancelar Suscripcion]                 │
└──────────────────────────────────────────┘
```

#### `components/Billing/FeatureGate.tsx`
Componente wrapper para feature gating:

```tsx
interface FeatureGateProps {
  feature: string;           // 'ai_reports' | 'analytics' | 'api_access'
  requiredPlan: 'pro' | 'enterprise';
  children: React.ReactNode;
}

function FeatureGate({ feature, requiredPlan, children }: FeatureGateProps) {
  const { currentPlan } = useSubscriptionStore();
  const hasAccess = planHierarchy[currentPlan] >= planHierarchy[requiredPlan];

  if (hasAccess) return <>{children}</>;

  return (
    <div className="ls-feature-gate locked relative">
      <div className="opacity-30 pointer-events-none">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center
                      bg-[rgba(10,14,23,0.85)] backdrop-blur-sm rounded-xl z-10">
        <Lock className="w-8 h-8 text-[#94a3b8] mb-3" />
        <p className="text-[#f1f5f9] font-semibold text-sm">
          Disponible en plan {requiredPlan === 'pro' ? 'Pro' : 'Enterprise'}
        </p>
        <button className="ls-btn-primary mt-3 text-sm px-4 py-2">
          Upgrade a {requiredPlan}
        </button>
      </div>
    </div>
  );
}
```

#### `stores/subscriptionStore.ts`
Estado global de suscripcion con Zustand:

```typescript
interface SubscriptionState {
  currentPlan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  usage: {
    shipments: { used: number; limit: number };
    users: { used: number; limit: number };
    reports: { used: number; limit: number };
  };
  billingCycle: 'monthly' | 'annual';
  nextBillingDate: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}
```

### 4.5 Server-side API Endpoints (Supabase Edge Functions o API routes)

```
POST /api/stripe/create-checkout-session
  -> Crea Stripe Checkout Session para nuevo plan
  -> Retorna { sessionId, url }

POST /api/stripe/create-customer-portal-session
  -> Crea sesion del Customer Portal de Stripe
  -> Para gestionar pagos, facturas, cancelar

POST /api/stripe/webhook
  -> Recibe eventos de Stripe (payment_succeeded, subscription_updated, etc.)
  -> Actualiza subscriptionStore

GET  /api/stripe/subscription-status
  -> Retorna estado actual de suscripcion del usuario
```

### 4.6 Colombia - Metodos de Pago Locales

**IMPORTANTE:** Stripe NO soporta nativamente PSE ni Nequi (los metodos mas populares en Colombia).

**Estrategia dual recomendada:**

```
┌────────────────────────────────────────────┐
│  Checkout LITPER PRO                        │
│                                              │
│  ┌─ Tarjeta (Stripe) ───────────────────┐  │
│  │  Visa, Mastercard, Amex               │  │
│  │  [Stripe PaymentElement]              │  │
│  └───────────────────────────────────────┘  │
│                                              │
│  ┌─ Metodos Locales (Wompi/PayU) ──────┐  │
│  │  PSE (transferencia bancaria)        │  │
│  │  Nequi                               │  │
│  │  Daviplata                           │  │
│  │  Efectivo (Efecty, Baloto)           │  │
│  └───────────────────────────────────────┘  │
│                                              │
│  Monedas: COP (Colombia) | USD (global)    │
└────────────────────────────────────────────┘
```

**Opcion A (MVP):** Solo Stripe - tarjetas internacionales + COP support
**Opcion B (Recomendada):** Stripe (internacional) + Wompi (Colombia local)
**Opcion C (Enterprise):** Stripe Connect para marketplace (pagar a operadores/drivers)

### 4.7 Stripe Connect (Futuro - Para Operadores)

```
LITPER PRO (Platform)
    │
    ├── Cobra al cliente final (Stripe Checkout)
    │
    ├── Retiene comision (application_fee_amount)
    │
    └── Paga al operador/driver (Stripe Connect payout)
         └── Connected Account (Express type)
             └── Onboarding via Stripe hosted page
```

---

## FASE 5: Mesh Background + Tipografia

### Background refinado:
```css
.cc-content-bg {
  background-color: var(--ls-canvas);
  background-image:
    radial-gradient(at 15% 10%, rgba(0, 245, 255, 0.03) 0px, transparent 50%),
    radial-gradient(at 85% 90%, rgba(255, 184, 0, 0.02) 0px, transparent 50%),
    radial-gradient(at 50% 50%, rgba(14, 165, 233, 0.015) 0px, transparent 50%);
}
```

### Tipografia estandarizada:
```
Labels:        text-xs font-medium text-[#94a3b8] uppercase tracking-wider
Body:          text-sm font-normal text-[#f1f5f9]
Section title: text-lg font-semibold text-[#f1f5f9]
Page title:    text-2xl font-bold text-[#f1f5f9]
KPI numbers:   text-3xl font-bold text-white
Hero metrics:  text-4xl font-extrabold text-white
Price display: text-5xl font-extrabold text-white (en pricing page)
```

---

## FASE 6: Shadow Config en Tailwind

```javascript
boxShadow: {
  // ...mantener existentes...
  'ls-1': '0 1px 3px rgba(14,165,233,0.04), 0 1px 2px rgba(0,0,0,0.08)',
  'ls-2': '0 3px 6px rgba(14,165,233,0.06), 0 2px 4px rgba(0,0,0,0.10)',
  'ls-3': '0 6px 12px rgba(14,165,233,0.08), 0 3px 6px rgba(0,0,0,0.12)',
  'ls-4': '0 10px 24px rgba(14,165,233,0.10), 0 6px 12px rgba(0,0,0,0.14)',
  'ls-5': '0 20px 40px rgba(14,165,233,0.12), 0 8px 16px rgba(0,0,0,0.18)',
  'ls-modal': '0 25px 50px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
  'ls-glow-cyan': '0 0 20px rgba(0,245,255,0.15)',
  'ls-glow-amber': '0 0 20px rgba(255,184,0,0.15)',
}
```

---

## ORDEN DE IMPLEMENTACION COMPLETO

### Sprint 1: Design System (1 dia)
| # | Que | Archivo | Impacto |
|---|-----|---------|---------|
| 1 | Tokens CSS `:root` | `index.html` | Base de todo |
| 2 | Classes `.ls-*` | `index.html` | Componentes reutilizables |
| 3 | Shadows en Tailwind config | `index.html` | Utility classes |
| 4 | Migrar ReportUploadModal | `ReportUploadModal.tsx` | Modal principal |
| 5 | Migrar AdminReportsView | `AdminReportsView.tsx` | Dashboard admin |
| 6 | Migrar MyReportsPanel | `MyReportsPanel.tsx` | Panel usuario |
| 7 | Actualizar STATUS_CONFIG | `reportUploadService.ts` | Badges unificados |
| 8 | Mesh background | `index.html` | Fondo refinado |

### Sprint 2: Stripe Core (1 dia)
| # | Que | Archivo | Impacto |
|---|-----|---------|---------|
| 9 | `npm install` Stripe packages | `package.json` | Dependencias |
| 10 | Crear `subscriptionStore.ts` | `stores/` | Estado de billing |
| 11 | Crear `stripeService.ts` | `services/` | Logica de pagos |
| 12 | Crear `PricingPage.tsx` | `components/Billing/` | Pagina de planes |
| 13 | Crear `CheckoutModal.tsx` | `components/Billing/` | Checkout con Elements |
| 14 | Stripe Appearance API dark theme | Dentro de CheckoutModal | Match visual |

### Sprint 3: Feature Gating + Subscription (1 dia)
| # | Que | Archivo | Impacto |
|---|-----|---------|---------|
| 15 | Crear `FeatureGate.tsx` | `components/Billing/` | Lock/upgrade prompts |
| 16 | Crear `SubscriptionManager.tsx` | `components/Billing/` | Panel de billing |
| 17 | Integrar en sidebar | `Sidebar.tsx` | Item "Plan" / "Billing" |
| 18 | Integrar gates en features IA | Varios componentes | Conversion freemium |
| 19 | Crear API endpoints | `api/stripe/` | Server-side |
| 20 | Webhook handler | `api/stripe/webhook` | Eventos de pago |

---

## ARCHIVOS NUEVOS A CREAR

```
components/
  Billing/
    PricingPage.tsx          # Pagina con 3 pricing cards
    CheckoutModal.tsx        # Modal con Stripe PaymentElement
    SubscriptionManager.tsx  # Panel de gestion de suscripcion
    FeatureGate.tsx          # Wrapper para feature gating
    UsageMeter.tsx           # Barra de uso (envios/users)
    BillingHistory.tsx       # Tabla de facturas
    index.ts                 # Exports

stores/
  subscriptionStore.ts       # Estado de suscripcion (Zustand)

services/
  stripeService.ts           # Inicializacion Stripe + helpers

api/
  stripe/
    create-checkout.ts       # POST - crear checkout session
    customer-portal.ts       # POST - portal de Stripe
    webhook.ts               # POST - recibir eventos
    status.ts                # GET  - estado de suscripcion
```

## QUE NO TOCAR

- `components/layout/Sidebar.tsx` - Command Center sidebar ya es premium
- `components/layout/AppLayout.tsx` - TopBar y layout ya funcionan
- Animaciones existentes (`cc-scan-line`, `cc-data-flow`, `cc-orb-float`)
- Variables `--cc-*` existentes
- Stores de negocio (`reportUploadStore.ts`, `layoutStore.ts`, `authStore.ts`)

---

## FUENTES DE LA INVESTIGACION V2

### Design Systems Enterprise
- [Salesforce SLDS 2.0](https://developer.salesforce.com/docs/platform/lwc/guide/create-components-css-design-tokens.html)
- [Shopify Polaris Tokens](https://polaris-react.shopify.com/tokens/color)
- [Ant Design Colors](https://ant.design/docs/spec/colors/) + [Dark Mode](https://ant.design/docs/spec/dark/)
- [Ant Design Colors Package](https://github.com/ant-design/ant-design-colors)

### Stripe Integration
- [Stripe Connect](https://docs.stripe.com/connect)
- [Stripe Elements Appearance API](https://docs.stripe.com/elements/appearance-api)
- [Stripe Dark Mode](https://docs.stripe.com/connect/embedded-appearance-support-dark-mode)
- [React Stripe.js](https://docs.stripe.com/sdks/stripejs-react)
- [Stripe Billing Subscriptions](https://docs.stripe.com/billing/subscriptions/build-subscriptions)
- [Stripe Pricing Table Embed](https://docs.stripe.com/payments/checkout/pricing-table)
- [Stripe Supported Currencies](https://docs.stripe.com/currencies)

### Colombia Payments
- [Payment Gateways Colombia 2025](https://www.rebill.com/en/blog/payment-gateways-colombia)
- [Wompi Payment Methods](https://docs.wompi.co/en/docs/colombia/metodos-de-pago/)
- [Colombia Payments Guide](https://conduitpay.com/guides/ultimate-guide-to-payments-in-colombia)

### Pricing & Conversion
- [SaaS Pricing Page Best Practices 2026](https://influenceflow.io/resources/saas-pricing-page-best-practices-complete-guide-for-2026/)
- [High-Converting Pricing Pages](https://lollypop.design/blog/2025/may/saas-pricing-page-design/)
- [Feature Gating Patterns](https://dev.to/aniefon_umanah_ac5f21311c/feature-gating-how-we-built-a-freemium-saas-without-duplicating-components-1lo6)
- [Freemium Upgrade Prompts](https://www.appcues.com/blog/best-freemium-upgrade-prompts)
- [Pricing Page Conversion](https://userpilot.com/blog/pricing-page-best-practices/)

### Design References (Originales)
- [Linear UI Redesign](https://linear.app/now/how-we-redesigned-the-linear-ui)
- [Vercel Geist Design System](https://vercel.com/geist/introduction)
- [Stripe Accessible Color Systems](https://stripe.com/blog/accessible-color-systems)
- [Grafana Themes Source](https://github.com/grafana/grafana/blob/main/contribute/style-guides/themes.md)
- [Bento Grid Guide 2026](https://landdding.com/blog/blog-bento-grid-design-guide)
- [Dark Mode Best Practices 2026](https://www.tech-rz.com/blog/dark-mode-design-best-practices-in-2026/)
