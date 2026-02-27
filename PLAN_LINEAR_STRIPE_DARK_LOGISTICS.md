# PLAN: "Linear meets Stripe on Dark Logistics"
# Upgrade del Design System de LITPER PRO

---

## DIAGNOSTICO DEL ESTADO ACTUAL

### Lo que YA tiene LITPER PRO (Command Center Sci-Fi):
- Sidebar con `cc-sidebar`, neon cyan `#00f5ff` + amber `#ffb800`
- Glassmorphism: `.cc-glass` con `backdrop-filter: blur(20px) saturate(180%)`
- Background: `#0a0e17` (--cc-dark-bg) con grid overlay + floating orbs
- Cards: `bg-gray-800/50 border-gray-700` (generico Tailwind)
- Modals: `bg-gray-900 border-gray-700` con gradientes indigo-purple
- Inputs: `bg-gray-800 border-gray-600 focus:ring-indigo-500`
- Buttons: `bg-gradient-to-r from-indigo-600 to-purple-600`
- Animaciones extensas: shimmer, glow, float, scan-line, data-stream

### Problema: Inconsistencia visual
Los componentes ReportUpload (`ReportUploadModal.tsx`, `AdminReportsView.tsx`, `MyReportsPanel.tsx`)
usan un lenguaje visual DISTINTO al Command Center:
- `bg-gray-800/50` en vez de `cc-glass`
- `border-gray-700` generico en vez de borders luminosos
- `from-indigo-600 to-purple-600` para botones (no match con cyan/amber brand)
- Sin backdrop-blur ni elevacion por capas
- Sin Stripe-quality shadows

---

## OBJETIVO: Unificar todo bajo "Linear meets Stripe on Dark Logistics"

Fusionar lo MEJOR de cada referencia:
- **Linear**: Glassmorphism sutil, LCH-inspired surfaces, borders rgba white
- **Stripe**: 5-level shadow system con tinte corporate blue, profundidad fisica
- **Command Center actual**: Mantener los neon cyan/amber como accent, mantener las animaciones
- **Grafana**: Elevacion por capas (#0a0e17 -> #111827 -> #1a1f2e)
- **Bento Grid**: Layout de dashboards

---

## FASE 1: Design Tokens Centralizados (index.html)

### Archivo: `index.html` - seccion `:root`

**AGREGAR estos nuevos tokens (NO borrar los existentes):**

```css
:root {
  /* === LITPER DESIGN SYSTEM V2: Linear meets Stripe === */

  /* Surface Elevation System (Grafana-inspired layers) */
  --ls-canvas:          #0a0e17;     /* Base - ya existente como --cc-dark-bg */
  --ls-surface-1:       #111827;     /* Cards nivel 1 - ya existente como --cc-dark-surface */
  --ls-surface-2:       #1a1f2e;     /* Elevated - ya existente como --cc-dark-elevated */
  --ls-surface-3:       #252b3b;     /* Popovers, dropdowns */
  --ls-surface-overlay: rgba(0, 0, 0, 0.6); /* Modal backdrop */

  /* Border Tokens (Linear-style with rgba white) */
  --ls-border-subtle:   rgba(255, 255, 255, 0.06);
  --ls-border-default:  rgba(255, 255, 255, 0.10);
  --ls-border-emphasis: rgba(255, 255, 255, 0.16);
  --ls-border-active:   rgba(0, 245, 255, 0.3); /* Mantiene brand cyan */

  /* Text Tokens */
  --ls-text-primary:    #f1f5f9;     /* Near-white */
  --ls-text-secondary:  #94a3b8;     /* Muted slate */
  --ls-text-tertiary:   #64748b;     /* Placeholder/disabled */
  --ls-text-accent:     #00f5ff;     /* Mantiene neon cyan */

  /* Stripe-Quality Shadow System (5 levels with blue tint) */
  --ls-shadow-1: 0 1px 3px rgba(14, 165, 233, 0.04), 0 1px 2px rgba(0, 0, 0, 0.08);
  --ls-shadow-2: 0 3px 6px rgba(14, 165, 233, 0.06), 0 2px 4px rgba(0, 0, 0, 0.10);
  --ls-shadow-3: 0 6px 12px rgba(14, 165, 233, 0.08), 0 3px 6px rgba(0, 0, 0, 0.12);
  --ls-shadow-4: 0 10px 24px rgba(14, 165, 233, 0.10), 0 6px 12px rgba(0, 0, 0, 0.14);
  --ls-shadow-5: 0 20px 40px rgba(14, 165, 233, 0.12), 0 8px 16px rgba(0, 0, 0, 0.18);
  /* ^ Shadow tint usa corporate blue rgba(14,165,233,...) en vez de negro puro */
  /* Esto es el secreto de Stripe - sombras con tinte de color de marca */

  /* Modal Shadow (elevated) */
  --ls-shadow-modal: 0 25px 50px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05);
}
```

**Razon:** Tokens centralizados permiten cambiar todo el sistema desde un solo lugar. Naming `--ls-*` (Linear-Stripe) para no colisionar con `--cc-*` existentes.

---

## FASE 2: CSS Classes Nuevas (index.html)

### Archivo: `index.html` - seccion `<style>`

**AGREGAR este bloque despues de los estilos Command Center existentes:**

```css
/* ============================================
   LITPER V2: LINEAR MEETS STRIPE ON DARK
   ============================================ */

/* --- Card System (3 niveles de elevacion) --- */
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
  background: linear-gradient(135deg,
    rgba(17, 24, 39, 0.95) 0%,
    rgba(10, 14, 23, 0.98) 100%
  );
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
.ls-input::placeholder {
  color: var(--ls-text-tertiary);
}
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
.ls-btn-primary:active {
  transform: translateY(0) scale(0.98);
}

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

/* --- Status Badges (Stripe-inspired semantic) --- */
.ls-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 9999px;
  border: 1px solid transparent;
}
.ls-badge-blue     { background: rgba(96,165,250,0.15); color: #60a5fa; border-color: rgba(96,165,250,0.25); }
.ls-badge-green    { background: rgba(74,222,128,0.15); color: #4ade80; border-color: rgba(74,222,128,0.25); }
.ls-badge-amber    { background: rgba(251,191,36,0.15); color: #fbbf24; border-color: rgba(251,191,36,0.25); }
.ls-badge-red      { background: rgba(248,113,113,0.15); color: #f87171; border-color: rgba(248,113,113,0.25); }
.ls-badge-purple   { background: rgba(168,85,247,0.15); color: #a855f7; border-color: rgba(168,85,247,0.25); }
.ls-badge-cyan     { background: rgba(0,245,255,0.12); color: #00f5ff; border-color: rgba(0,245,255,0.20); }

/* --- Bento Grid --- */
.ls-bento {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(4, 1fr);
}
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

/* --- Dividers --- */
.ls-divider {
  height: 1px;
  background: var(--ls-border-subtle);
}

/* --- Compliance Progress Bar --- */
.ls-progress-track {
  background: var(--ls-surface-2);
  border-radius: 9999px;
  height: 8px;
  overflow: hidden;
}
.ls-progress-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 500ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* --- Drag & Drop Zone --- */
.ls-dropzone {
  border: 2px dashed var(--ls-border-default);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
.ls-dropzone:hover {
  border-color: rgba(0, 245, 255, 0.3);
  background: rgba(0, 245, 255, 0.03);
}
.ls-dropzone.dragging {
  border-color: rgba(0, 245, 255, 0.5);
  background: rgba(0, 245, 255, 0.06);
  transform: scale(1.01);
  box-shadow: 0 0 20px rgba(0, 245, 255, 0.1);
}
.ls-dropzone.has-file {
  border-color: rgba(74, 222, 128, 0.4);
  border-style: solid;
  background: rgba(74, 222, 128, 0.04);
}

/* --- Table Row --- */
.ls-table-row {
  background: transparent;
  border-bottom: 1px solid var(--ls-border-subtle);
  transition: background 150ms;
}
.ls-table-row:hover {
  background: rgba(255, 255, 255, 0.02);
}
```

---

## FASE 3: Componentes React - Cambios Especificos

---

### 3.1 ReportUploadModal.tsx

**Cambiar CADA linea de clase. Aqui el mapeo exacto:**

| Linea | ANTES (actual) | DESPUES (nuevo) |
|-------|----------------|-----------------|
| 176 | `bg-black/60 backdrop-blur-sm` | `ls-modal-overlay` |
| 178 | `bg-gray-900 rounded-2xl ... border border-gray-700 shadow-2xl` | `ls-modal` |
| 182 | `border-b border-gray-700 bg-gradient-to-r from-indigo-600/20 to-purple-600/20` | `border-b border-[rgba(255,255,255,0.06)] bg-[rgba(0,245,255,0.04)]` |
| 184 | `bg-indigo-500/30 rounded-xl` | `bg-[rgba(0,245,255,0.12)] rounded-xl` |
| 185 | `text-indigo-400` | `text-cyan-400` |
| 188 | `text-lg font-bold text-white` | `text-lg font-semibold text-[#f1f5f9]` |
| 189 | `text-sm text-gray-400` | `text-sm text-[#94a3b8]` |
| 192 | `hover:bg-gray-700 rounded-lg` | `hover:bg-white/[0.06] rounded-lg` |
| 211 | `bg-red-500/20 border border-red-500/50 rounded-xl text-red-300` | `ls-badge-red px-3 py-2 rounded-xl text-sm` con border-red |
| 223-228 | zona drop con `border-indigo-500`, `bg-indigo-500/10`, `border-gray-600` | usar `.ls-dropzone`, `.ls-dropzone.dragging`, `.ls-dropzone.has-file` |
| 282 | inputs con `bg-gray-800 border-gray-600 ... focus:ring-indigo-500` | `ls-input w-full` |
| 297-301 | botones de categoria con `border-indigo-500 bg-indigo-500/20` | activo: `border-[rgba(0,245,255,0.4)] bg-[rgba(0,245,255,0.08)] text-white`, inactivo: `border-[rgba(255,255,255,0.06)] bg-[rgba(17,24,39,0.5)] text-[#94a3b8] hover:border-[rgba(255,255,255,0.12)]` |
| 371 | `border-t border-gray-700 bg-gray-800/50` | `border-t border-[rgba(255,255,255,0.06)] bg-[rgba(17,24,39,0.5)]` |
| 373 | boton cancelar `border-gray-600 text-gray-300 hover:bg-gray-700` | `ls-btn-secondary` |
| 381 | boton submit `bg-gradient-to-r from-indigo-600 to-purple-600 ... shadow-indigo-500/25` | `ls-btn-primary disabled:opacity-50 disabled:cursor-not-allowed` |

---

### 3.2 AdminReportsView.tsx

**Stat Cards (lineas 143-157):**
```
ANTES:  bg-gray-800/50 rounded-xl border border-gray-700 p-4
DESPUES: ls-metric-card
```

**Icon badges en stat cards (linea 151):**
```
ANTES:  bg-gradient-to-br ${card.color} rounded-xl opacity-80
DESPUES: mantener igual (ya se ve bien con gradientes)
```

**Compliance Bar (lineas 160-175):**
```
ANTES:  bg-gray-800/50 rounded-xl border border-gray-700
DESPUES: ls-card p-4

ANTES:  bg-gray-700 rounded-full h-3
DESPUES: ls-progress-track

ANTES:  h-3 rounded-full ...
DESPUES: ls-progress-fill (mantener clases de color gradient)
```

**Tabs (lineas 186-204):**
```
ANTES:  border-b border-gray-700
DESPUES: border-b border-[rgba(255,255,255,0.06)]

ANTES tab activo:  bg-indigo-600 text-white
DESPUES: bg-[rgba(0,245,255,0.12)] text-cyan-400 border border-[rgba(0,245,255,0.3)]

ANTES tab inactivo: text-gray-400 hover:text-white hover:bg-gray-700
DESPUES: text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-white/[0.04]
```

**Search input (linea 295):**
```
ANTES:  bg-gray-800 border border-gray-700 rounded-xl ... focus:ring-indigo-500
DESPUES: ls-input w-full pl-10 pr-4
```

**Report cards en lista (linea 323):**
```
ANTES:  bg-gray-800/50 rounded-xl border border-gray-700 p-4 hover:border-gray-600
DESPUES: ls-card p-4
```

**Status badges:** Reemplazar cada `STATUS_CONFIG[report.status].bgColor` con las nuevas clases:
```
submitted    -> ls-badge ls-badge-blue
under_review -> ls-badge ls-badge-amber
approved     -> ls-badge ls-badge-green
rejected     -> ls-badge ls-badge-red
draft        -> ls-badge ls-badge-purple
```

**Action buttons (lineas 358-373):**
```
ANTES Revisar:  bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30
DESPUES: bg-[rgba(251,191,36,0.12)] text-amber-400 rounded-lg hover:bg-[rgba(251,191,36,0.2)] border border-[rgba(251,191,36,0.2)]

ANTES Evaluar:  bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30
DESPUES: bg-[rgba(0,245,255,0.08)] text-cyan-400 rounded-lg hover:bg-[rgba(0,245,255,0.14)] border border-[rgba(0,245,255,0.15)]
```

**Review modal (linea 395):**
```
ANTES:  bg-gray-900 rounded-2xl ... border border-gray-700
DESPUES: ls-modal max-h-[85vh]
```

**Review modal inner card (linea 404):**
```
ANTES:  bg-gray-800 rounded-xl
DESPUES: ls-card-elevated p-4
```

**Approve/Reject buttons (lineas 456-467):**
```
ANTES Reject:  bg-red-600 text-white rounded-xl hover:bg-red-700
DESPUES: bg-[rgba(248,113,113,0.15)] text-red-400 border border-[rgba(248,113,113,0.3)] rounded-xl hover:bg-[rgba(248,113,113,0.25)]

ANTES Approve: bg-green-600 text-white rounded-xl hover:bg-green-700
DESPUES: ls-btn-primary (con gradient green en vez de blue)
  -> bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl shadow-[var(--ls-shadow-2),0_0_20px_rgba(74,222,128,0.15)]
```

**Stat cards layout (bento):**
```
ANTES:  grid grid-cols-2 lg:grid-cols-4 gap-4
DESPUES: ls-bento  (se renderea como 4 columnas auto)
```

---

### 3.3 MyReportsPanel.tsx

**Upload button (linea 118):**
```
ANTES:  bg-gradient-to-r from-indigo-600 to-purple-600 ... shadow-indigo-500/25
DESPUES: ls-btn-primary flex items-center gap-2
```

**Status pills (lineas 126-153):**
```
ANTES activo:  bg-indigo-600 text-white
DESPUES: bg-[rgba(0,245,255,0.12)] text-cyan-400

ANTES badge count: bg-indigo-500 / bg-gray-600
DESPUES: bg-[rgba(0,245,255,0.2)] / bg-white/[0.06]
```

**Report cards (linea 209):**
```
ANTES:  bg-gray-800/50 rounded-xl border border-gray-700 hover:border-gray-600
DESPUES: ls-card p-4
```

**File icon container (linea 213):**
```
ANTES:  bg-gray-700/50 rounded-lg
DESPUES: bg-white/[0.04] rounded-lg border border-[rgba(255,255,255,0.06)]
```

**Tags (linea 244):**
```
ANTES:  bg-gray-700 text-gray-300 rounded-full
DESPUES: bg-white/[0.06] text-[#94a3b8] rounded-full border border-[rgba(255,255,255,0.06)]
```

**Admin comment boxes (linea 251-258):**
```
Mantener la logica red/green pero ajustar opacidades:
ANTES rejected:  bg-red-500/10 border border-red-500/30 text-red-300
DESPUES: bg-[rgba(248,113,113,0.08)] border border-[rgba(248,113,113,0.2)] text-red-400

ANTES approved:  bg-green-500/10 border border-green-500/30 text-green-300
DESPUES: bg-[rgba(74,222,128,0.08)] border border-[rgba(74,222,128,0.2)] text-green-400
```

**Ver button (linea 262):**
```
ANTES:  bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600
DESPUES: ls-btn-secondary text-sm px-3 py-1.5
```

**Detail modal (linea 277):**
```
ANTES:  bg-gray-900 rounded-2xl ... border border-gray-700
DESPUES: ls-modal
```

**Detail inner card (linea 295):**
```
ANTES:  bg-gray-800 rounded-xl
DESPUES: ls-card-elevated
```

---

## FASE 4: Mesh Background para Content Area

### Archivo: index.html (o AppLayout.tsx inline style)

**Actualizar `.cc-content-bg` para agregar mesh sutil:**

```css
.cc-content-bg {
  /* Mantener todo lo existente Y agregar mesh gradients mas refinados */
  background-color: var(--ls-canvas);
  background-image:
    /* Cyan glow top-left (sutil) */
    radial-gradient(at 15% 10%, rgba(0, 245, 255, 0.03) 0px, transparent 50%),
    /* Amber glow bottom-right (sutil) */
    radial-gradient(at 85% 90%, rgba(255, 184, 0, 0.02) 0px, transparent 50%),
    /* Blue corporate glow center (muy sutil) */
    radial-gradient(at 50% 50%, rgba(14, 165, 233, 0.015) 0px, transparent 50%);
}
```

**Razon:** Mesh gradient es mas sutil y profesional que los orbs animados (que se mantienen pero se puede bajar opacidad).

---

## FASE 5: Tipografia Refinada

### Ya se usa Inter (correcto). Ajustar pesos y escala:

**En los componentes, estandarizar:**
```
Labels/Captions:   text-xs (12px) font-medium text-[#94a3b8] uppercase tracking-wider
Body data:         text-sm (14px) font-normal text-[#f1f5f9]
Section headers:   text-lg (18px) font-semibold text-[#f1f5f9]
Page titles:       text-2xl (24px) font-bold text-[#f1f5f9]
KPI big numbers:   text-3xl (30px) font-bold text-white
Hero metrics:      text-4xl (36px) font-extrabold text-white
```

**Nota:** Cambiar `font-bold` en headers a `font-semibold` (600 vs 700) = mas moderno, como Linear.

---

## FASE 6: Shadow Tint en Tailwind Config

### Archivo: `index.html` - tailwind.config

**Agregar shadows al config existente:**

```javascript
boxShadow: {
  'premium': '...',  // mantener
  'card': '...',     // mantener
  'card-hover': '...', // mantener
  // NUEVOS
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

## ORDEN DE IMPLEMENTACION

| Paso | Que | Archivo(s) | Duracion |
|------|-----|-----------|----------|
| 1 | Agregar tokens CSS `:root` | `index.html` | 5 min |
| 2 | Agregar classes `.ls-*` | `index.html` | 10 min |
| 3 | Agregar shadows a tailwind.config | `index.html` | 3 min |
| 4 | Migrar `ReportUploadModal.tsx` | `components/ReportUpload/ReportUploadModal.tsx` | 15 min |
| 5 | Migrar `AdminReportsView.tsx` | `components/ReportUpload/AdminReportsView.tsx` | 15 min |
| 6 | Migrar `MyReportsPanel.tsx` | `components/ReportUpload/MyReportsPanel.tsx` | 12 min |
| 7 | Actualizar `STATUS_CONFIG` en service | `services/reportUploadService.ts` | 5 min |
| 8 | Mesh background refinado | `index.html` | 3 min |
| 9 | Testing visual completo | Browser | 10 min |

**Total estimado: ~78 minutos de edicion de codigo**

---

## QUE NO TOCAR (mantener intacto)

- `components/layout/Sidebar.tsx` - El Command Center sidebar ya es premium
- `components/layout/AppLayout.tsx` - TopBar y layout general ya funcionan
- Animaciones existentes (`cc-scan-line`, `cc-data-flow`, `cc-orb-float`)
- Variables `--cc-*` existentes
- Floating orbs en content area (mantener, son nice)
- Stores (`reportUploadStore.ts`, `layoutStore.ts`) - solo UI, no logica

---

## RESULTADO VISUAL ESPERADO

```
┌──────────────────────────────────────────────────────────┐
│  SIDEBAR (Command Center)  │  CONTENT AREA               │
│  ┌────────────────────┐    │  ┌──────────────────────────┐│
│  │ [cyan glow bar]    │    │  │  ls-metric-card          ││
│  │  Dashboard         │    │  │  KPI: 127 reportes       ││
│  │  Operaciones       │    │  │  shadow-ls-2             ││
│  │  Inteligencia      │    │  └──────────────────────────┘│
│  │  ─────────────     │    │  ┌────────┐ ┌────────┐      │
│  │  Reportes    [NEW] │    │  │ Este   │ │ Pend.  │      │
│  │  ─────────────     │    │  │ Mes: 34│ │ Rev: 8 │      │
│  │  Chat IA           │    │  └────────┘ └────────┘      │
│  │  Config            │    │                              │
│  └────────────────────┘    │  ┌──────────────────────────┐│
│                            │  │ ls-card (report item)    ││
│  [hex pattern bg]          │  │ ░░ Reporte Semanal       ││
│  [neon border gradient]    │  │    [ls-badge-green] Apro ││
│                            │  │    shadow-ls-1 -> hover:2││
│                            │  └──────────────────────────┘│
│                            │                              │
│                            │  [mesh gradient bg subtle]   │
└──────────────────────────────────────────────────────────┘
```

**Lo que cambia visualmente:**
1. Cards pasan de `bg-gray-800/50` plano a glassmorphism sutil con blue-tinted shadows
2. Borders pasan de `border-gray-700` opaco a `rgba(255,255,255,0.06-0.16)` sutil
3. Botones de indigo-purple a corporate blue gradient con glow
4. Inputs con focus cyan glow en vez de indigo ring
5. Badges con borders y opacidades refinadas
6. Modal con backdrop blur + gradient bg + shadow-modal
7. Hover states mas sutiles (-1px vs -4px), mas professional

**Lo que se MANTIENE:**
- Sidebar Command Center completo (ya premium)
- Neon cyan + amber como brand colors
- Dark navy background ecosystem
- Todas las animaciones existentes
- Layout y responsividad existente
