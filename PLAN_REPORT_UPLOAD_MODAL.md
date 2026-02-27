# PLAN MAESTRO: Sistema de Subida de Reportes - Nivel Enterprise Global

## Contexto del Proyecto
**App:** LITPER PRO - Plataforma Global de Logistica Inteligente
**Stack:** React 19 + TypeScript + Vite 6 + Tailwind CSS (CDN) + Zustand 5 + Lucide React
**Tema actual:** Dark mode con navy premium + naranja accent (Amazon-inspired)
**Font:** Inter, system-ui, sans-serif
**Charts:** Recharts 3.5

---

## PARTE 1: INVESTIGACION UI/UX - 17 PLATAFORMAS ANALIZADAS

---

### TIER 1 - GIGANTES DE LOGISTICA

---

#### 1. Amazon DSP Portal (Driver Scorecard)

| Aspecto | Detalle |
|---------|---------|
| **Background** | Blanco/gris claro `#F5F5F5` base, chrome oscuro `#232F3E` en header |
| **Paleta** | Naranja `#FF9900` (primario), Navy `#232F3E` (nav), `#131A22` (footer oscuro) |
| **Tiers** | Fantastic+ `#1A8C1A`, Fantastic `#4CAF50`, Great `#8BC34A`, Fair `#FFC107`, Poor `#D32F2F` |
| **Cards** | `border-radius: 4px`, `border: 1px solid #D5D9D9`, `box-shadow: 0 1px 2px rgba(0,0,0,0.08)` |
| **Tipografia** | "Amazon Ember" / Arial fallback. Body 13px, headers 16px, metricas grandes 24px |
| **Spacing** | Denso - optimizado para datos operacionales |
| **Data Viz** | Scorecard con gradiente verde-a-rojo por tiers. Sparklines semanales |
| **Nav** | Top nav oscuro + sidebar izquierdo + tabs internos |
| **Premium feel** | El sistema de tiers con colores crea urgencia (verde = bonos, rojo = penalidades) |

---

#### 2. UPS ORION

| Aspecto | Detalle |
|---------|---------|
| **Background** | Interfaz DIAD (dispositivo handheld) montado en dashboard del vehiculo |
| **Paleta** | UPS Brown `#644117`, Dark Brown `#351C15`, Gold `#FFB500` |
| **Cards** | Interfaz simplificada para conductores - mapa + instrucciones turn-by-turn |
| **Tipografia** | Grande y legible - optimizada para pantalla pequena en vehiculo |
| **Data Viz** | Mapa con rutas optimizadas, 200,000+ opciones de ruta por conductor |
| **Nav** | Pantalla de mapa + lista de paradas ordenadas |
| **Premium feel** | "Dynamic ORION" - rutas se actualizan en tiempo real durante el dia |

---

#### 3. FedEx Admin Console / Ship Manager

| Aspecto | Detalle |
|---------|---------|
| **Background** | Blanco `#FFFFFF` primario, secciones en `#F2F2F2`, gradiente purple en header |
| **Paleta primaria** | Purple `#4D148C`, Orange `#FF6200` |
| **Paleta divisional** | Ground Green `#00B140`, Freight Red `#CC0000`, Office Blue `#0033A0` |
| **Cards** | `border-radius: 4px`, `border: 1px solid #DDDDDD`, `box-shadow: 0 2px 4px rgba(0,0,0,0.1)` |
| **Tipografia** | "FedEx Sans" / Helvetica Neue fallback. Body 14px, h3 18px, h2 24px, h1 32px |
| **Spacing** | Estandar enterprise - ni denso ni espacioso |
| **Data Viz** | Timeline/step indicators para tracking. Status con colores divisionales |
| **Nav** | Top nav purple + sidebar colapsable + wizard step-by-step para envios |
| **Premium feel** | Contraste purple-orange es instantaneamente reconocible. Division colors = contexto inmediato |

---

#### 4. DHL ActiveTracing / Express Portal

| Aspecto | Detalle |
|---------|---------|
| **Background** | Blanco `#FFFFFF` preferido, gradiente amarillo en headers branded |
| **Paleta** | Yellow (Postyellow) `#FFCC00`, Red `#D40511`, White `#FFFFFF`, Black `#000000` |
| **Cards** | `border-radius: 4px-8px`, `border: 1px solid #E0E0E0`, red borders para estados activos |
| **Tipografia** | "Delivery" (fuente bespoke DHL). Body 14px, subheadings 16px, headings 24px |
| **Design System** | DHL UI Library (DUIL) - sistema completo con primitives + semantic tokens |
| **Data Viz** | Timeline de envio con milestones rojo/amarillo. Map integration |
| **Nav** | Header amarillo DHL + sidebar con filtros + tabs por estados |
| **Premium feel** | Amarillo + rojo = una de las paletas mas reconocibles en logistica mundial |

---

#### 5. Uber Freight Dashboard

| Aspecto | Detalle |
|---------|---------|
| **Background** | White `#FFFFFF` (light), Black `#000000` (dark). Minimalista con whitespace generoso |
| **Paleta** | Black `#000000`, Safety Blue `#276EF1`, Green `#3AA76D`, Yellow `#FFC043`, Red `#D44333` |
| **Grays** | 100:`#F6F6F6`, 200:`#EEEEEE`, 400:`#B0B0B0`, 700:`#545454` |
| **Cards** | `border-radius: 8px`, `box-shadow: 0 2px 8px rgba(0,0,0,0.08)`. Sin borders, solo shadow + spacing |
| **Tipografia** | "Uber Move" (diseñada por Jeremy Mickel). Escala musical ratio mayor segundo (8:9) |
| **Pesos** | Light 300, Regular 400, Medium 500, Bold 700 |
| **Spacing** | Espacioso - whitespace ES el diseno |
| **Data Viz** | Emissions Dashboard, load-matching feeds, map visualization. Metric cards con numeros grandes |
| **Nav** | Top nav + sidebar. Modular ListView components. Tabs por estados de carga |
| **Premium feel** | Font a medida + ratio musical + minimalismo extremo = sofisticacion tech-forward |

---

### TIER 2 - LOGISTICA TECH MODERNA

---

#### 6. Flexport (Latitude Design System)

| Aspecto | Detalle |
|---------|---------|
| **Background** | White content area, navy oscuro `~#0C2340` en sidebar/top nav |
| **Paleta** | Blue `#0047FF` (primario), Navy `#0C2340` (sidebar), Light Gray `#F7F8FA` (page bg) |
| **Semantic** | Success `#10B981`, Warning `#F59E0B`, Error `#EF4444` |
| **Cards** | `border-radius: 8px`, `border: 1px solid #E5E7EB`, `box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)` |
| **Tipografia** | System font stack. Icons 12px inline, 18px standalone |
| **Spacing** | Denso - data density es una feature, no un problema |
| **Data Viz** | Tablas densas, globo/mapa, supply chain timeline, KPI metric cards |
| **Nav** | Navy sidebar + navy top nav = "professional cockpit" cohesivo |
| **Design System** | "Latitude" - publico en Figma Community |
| **Premium feel** | "El atalaya de tu supply chain" - metafora de sala de control. Navy frame + white content = cockpit |

---

#### 7. project44 (Supply Chain Visibility)

| Aspecto | Detalle |
|---------|---------|
| **Background** | Dashboard centralizado con KPIs multi-nivel |
| **Plataforma** | "Movement" - API-first, cloud-native SaaS en AWS |
| **AI Assistant** | "MO" - chat conversacional para queries en lenguaje natural |
| **Data Viz** | Color-coded alerts, carrier scorecards, KPIs con drill-down |
| **Nav** | Dashboard dual-layer: ejecutivos ven KPIs, operadores ven detalles |
| **Premium feel** | 1.2B envios anuales procesados. IA conversacional para supply chain data |

---

#### 8. Onfleet (Last-Mile Delivery)

| Aspecto | Detalle |
|---------|---------|
| **Background** | MAPA es el background - full-screen con sidebar flotante overlay |
| **Paleta** | Blue `~#1A73E8`, trafico: Green `#4CAF50`, Yellow `#FFC107`, Orange `#FF9800`, Red `#F44336` |
| **Cards** | `border-radius: 8px`, `box-shadow: 0 2px 10px rgba(0,0,0,0.15)` (mas fuerte por overlay en mapa) |
| **Tipografia** | System font stack. Body 14px, headings 18-24px |
| **Nav** | Mapa + Sidebar = layout de 2 paneles, single-screen. Sin top nav |
| **Data Viz** | Pins para tareas, circulos con pulse animation para conductores. GeoJSON overlays |
| **Premium feel** | Experiencia tipo control de trafico aereo. Pulse animation = sensacion "live" |

---

#### 9. Bringg (Delivery Orchestration)

| Aspecto | Detalle |
|---------|---------|
| **Background** | White/light gray. Vista mapa para dispatch |
| **Paleta** | Navy `~#1B3A6B`, Teal `~#00B8D4`, Success `#48BB78`, Warning `#ED8936`, Error `#E53E3E` |
| **Cards** | `border-radius: 6-8px`, `border: 1px solid #E2E8F0`, `box-shadow: 0 1px 3px rgba(0,0,0,0.08)` |
| **Nav** | Left sidebar + mapa/dispatch split view. Drag-and-drop para tareas |
| **Premium feel** | Orquestacion de workflows complejos visualizada. GPS + ETA dinamico = "mission control" |

---

#### 10. Rappi (Partners Portal - Colombia)

| Aspecto | Detalle |
|---------|---------|
| **Background** | White `#FFFFFF` con acentos naranja-rojo. Mobile-first |
| **Paleta** | Red-Orange `#FF4940` (primario), Coral `#FA8C76`, Dark Red `#DC3727` |
| **Cards** | `border-radius: 12-16px` (estetica mobile-app), `box-shadow: 0 2px 8px rgba(0,0,0,0.1)` |
| **Tipografia** | Mobile-optimized: caption 12px, body 14px, heading 18px, title 24px |
| **Nav** | Bottom tab bar (estandar super-app). Partners Portal web: sidebar nav |
| **Data Viz** | Order management tables, revenue charts, delivery heatmaps |
| **Premium feel** | Rojo-naranja crea energia y urgencia. Unicornio colombiano de $5.2B |

---

### TIER 3 - MEJORES DASHBOARDS SaaS (EXCELENCIA EN DISENO)

---

#### 11. Linear.app

| Aspecto | Detalle |
|---------|---------|
| **Background** | Dark mode default: `#0F0F10` a `#1B1C22`. Generado con LCH color space |
| **Surfaces** | Card BG: `#171719` a `#1E1F25` |
| **Paleta texto** | Primary `#F7F8F8`, Secondary `#95A2B3` |
| **Paleta gradient** | `#08AEEA` -> `#2AF598` -> `#B5FFFC` -> `#FF5ACD` |
| **Cards** | `border-radius: 8px`, `border: 1px solid rgba(255,255,255,0.06-0.10)` |
| **Glass effect** | `backdrop-filter: blur(12px) saturate(150%)` en elementos elevados |
| **Shadow dark** | `box-shadow: 0 0 0 1px rgba(255,255,255,0.05), 0 2px 4px rgba(0,0,0,0.3)` |
| **Tipografia** | "Inter Display" headings, "Inter" body |
| **CSS Labels** | `12px, weight:600, letter-spacing:11px, uppercase, color:#95A2B3` |
| **CSS Hero** | `62px, weight:800, line-height:72px, color:#F7F8F8` |
| **CSS Body** | `20px, weight:400, line-height:31px, color:#95A2B3` |
| **Spacing** | 8px base grid |
| **Nav** | Left sidebar glassmorphism + top breadcrumbs + Command palette (Cmd+K) |
| **Data Viz** | Issue status dots, cycle progress bars, gradiente lineal |
| **Theming** | Solo 3 variables (base, accent, contrast) generan 98 tokens de tema |
| **Premium feel** | LCH color space = armonia matematica. Glassmorphism sutil. 70+ temas community |

---

#### 12. Vercel Dashboard (Geist Design System)

| Aspecto | Detalle |
|---------|---------|
| **Background** | Stark black `#000000` (dark), pure white `#FFFFFF` (light). CERO gradientes/patrones |
| **Paleta** | Blue `#0070F3` (link/success), Error `#EE0000`, Warning `#F5A623` |
| **Paleta accent** | Cyan `#50E3C2`, Violet `#7928CA`, Purple `#F81CE5`, Alert `#FF0080` |
| **Gray scale** | `#FAFAFA`, `#EAEAEA`, `#999`, `#888`, `#666`, `#444`, `#333`, `#111` (8+ pasos) |
| **Cards** | `border-radius: 8px`, `border: 1px solid #EAEAEA` (light) / `#333` (dark) |
| **Shadow** | `box-shadow: 0 2px 4px rgba(0,0,0,0.1)` - minimo, solo cuando necesario |
| **Filosofia** | Cards definidas por BORDERS, no shadows. Flat design |
| **Tipografia** | "Geist Sans" + "Geist Mono" (code). Thin(100) a Black(900) |
| **Font base** | 14px (0.875rem), body 400, heading 600, bold 700 |
| **Nav** | Top nav horizontal (sin sidebar), tabs, breadcrumbs, team/project dropdown |
| **Data Viz** | Status dots, analytics charts minimales, logs en Geist Mono |
| **Premium feel** | Minimalismo absoluto. Blanco/negro + 1 color accent = reconocimiento instantaneo |

---

#### 13. Stripe Dashboard

| Aspecto | Detalle |
|---------|---------|
| **Background** | Light: `#F6F9FC` (Black Squeeze - mas calido que gris puro). Dark nav: `#0A2540` (Downriver) |
| **Paleta** | Blurple `#635BFF`, Action Blue `#0570DE`, Text `#30313D`, Danger `#DF1B41` |
| **Cards** | `border-radius: 8px` (cards), `4px` (inputs) |
| **SHADOW SYSTEM (5 niveles - el estandar de oro):** | |
| Level 1 | `0 0.125em 0.313em rgba(50,50,93,0.09), 0 0.063em 0.125em rgba(0,0,0,0.07)` |
| Level 2 | `0 0.25em 0.375em rgba(50,50,93,0.09), 0 0.063em 0.188em rgba(0,0,0,0.08)` |
| Level 3 | `0 0.063em 0.313em 0 rgba(0,0,0,0.07), 0 0.438em 1.063em 0 rgba(0,0,0,0.1)` |
| Level 4 | `0 0.938em 2.188em rgba(50,50,93,0.1), 0 0.313em 0.938em rgba(0,0,0,0.07)` |
| Level 5 | `0 0.938em 2.188em rgba(50,50,93,0.15), 0 0.313em 0.938em rgba(0,0,0,0.1)` |
| **Shadow tint** | `rgba(50,50,93,...)` = sombra con tinte azul-purpura (no negro puro) |
| **Tipografia** | "Sohne" primario, "Ideal Sans" dashboard. `font-weight: 500` como DEFAULT (inusual - bold sutil) |
| **Font base** | 14px |
| **Nav** | Left sidebar con icon+text + horizontal tabs + global search |
| **Data Viz** | Revenue charts con colores accesibles (CIELAB perceptual). Sparklines, data tables |
| **Premium feel** | 5-level shadow = profundidad fisica inigualada. rgba blue-tinted shadows. `#F6F9FC` bg = sensacion papel premium |

---

#### 14. Notion

| Aspecto | Detalle |
|---------|---------|
| **Background** | White `#FFFFFF` (light), `#191919` (dark). Canvas limpio como papel digital |
| **Paleta** | Neutrals dominan. Accents: Red, Orange, Yellow, Green, Blue, Purple, Pink, Brown, Gray |
| **Cards** | `border-radius: 6px`, borders sutiles, hover effects como highlight |
| **Tipografia** | Tres opciones: Default (system), Serif (Georgia), Mono. Body 16px |
| **Spacing** | Muy espacioso - whitespace generoso tipo pagina impresa |
| **Nav** | Left sidebar colapsable + toggle. Breadcrumbs para navegacion. Drag-and-drop todo |
| **Premium feel** | Se siente como un documento vivo, no una app. Simplicidad radical |

---

#### 15. Figma

| Aspecto | Detalle |
|---------|---------|
| **Background** | Canvas dark `#1E1E1E`, light `#F5F5F5`. Chrome siempre oscuro en menus |
| **Paleta** | Blue `#0C8CE9`, Purple `#9747FF`, Green `#0FA958`, Red `#F24822`, Orange `#FFA629` |
| **Panels** | `border-radius: 8-12px`, `box-shadow: 0 4px 12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)` |
| **Glass** | Paneles semi-transparentes con backdrop blur |
| **Tipografia** | "Inter" throughout. Property labels 11px, headers 12px weight:600, context menu 13px |
| **Nav** | UI3: Bottom floating toolbar + right Properties Panel + left Layers Panel |
| **Premium feel** | Floating panels = "tool dentro de tool". Bottom toolbar = manos cerca del trabajo |

---

#### 16. Datadog (DRUIDS Design System)

| Aspecto | Detalle |
|---------|---------|
| **Background** | Dark: `~#1A1A2E`, panels `~#252535`. Light: white |
| **Paleta** | Brand Purple `#774AA4`, Logo `#632CA6`, Accent `#8000FF` |
| **Cards** | `border-radius: 4px`, `border: 1px solid rgba(255,255,255,0.1)`, shadow minimo |
| **Tipografia** | System font. Data 12-14px, widget titles 14-16px w:600, metricas grandes 32-48px w:700 |
| **Nav** | Left sidebar colapsable + breadcrumbs + grid dashboard drag-and-drop |
| **Data Viz** | 6-color Classic palette optimizada. Consistent palette (color fijo por tag value) |
| **Accesibilidad** | Modos de color accesible: vision de color, baja acuidad visual, sensibilidad al contraste |
| **Premium feel** | 600+ componentes React en DRUIDS. Grid customizable = tu propio "command center" |

---

#### 17. Grafana

| Aspecto | Detalle |
|---------|---------|
| **Background** | Canvas `#0B0C0E` (gray05 - extremadamente oscuro). Panel `#141619` (gray10). Secondary `#202226` (gray15) |
| **Paleta** | Brand gradient: `linear-gradient(90deg, #FF8833 0%, #F53E4C 100%)` |
| **Semantic** | Blue `#3D71D9`, Success `#73BF69`, Warning `#FADE2A`, Error `#F2495C` |
| **Text** | Primary `#D8D9DA`, Secondary `#8E8E8E` |
| **Borders** | Weak `#2C3235`, Medium `#3D3D3D` |
| **Cards** | `border-radius: 4px`, `border: 1px solid` (weak token), `box-shadow: none` - paneles transparentes |
| **Tipografia** | "Inter" / Helvetica / Arial. Panel title 14px w:500, stat panels hasta 60px+ |
| **Nav** | Left sidebar icons + top bar (titulo, time range, refresh). Kiosk mode para TVs |
| **Data Viz** | Metricas/logs/traces. Time series principal. Threshold colors: green>yellow>red |
| **Premium feel** | `#0B0C0E` = el mas oscuro (NOC-optimizado). Panel transparency = canvas unificado. Dashboard-as-code |

---

## PARTE 2: TENDENCIAS DE DISENO 2025-2026

---

### 1. Bento Grid Layouts

**Que es:** Grid modular asimetrico (como caja bento japonesa). Bloques de diferentes tamanos trabajando juntos.

**Estadisticas:** 67% de los top 100 productos SaaS en ProductHunt usan bento grid (2026). Usuarios completan tareas 23% mas rapido.

**Implementacion CSS:**
```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem; /* 16px - estandar */
}
.bento-item-large {
  grid-column: span 2;
  grid-row: span 2;
}
.bento-item-wide {
  grid-column: span 2;
}
@media (max-width: 768px) {
  .bento-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

**Tailwind CSS:**
```html
<div class="grid grid-cols-4 gap-4">
  <div class="col-span-2 row-span-2"><!-- KPI grande --></div>
  <div class="col-span-1"><!-- Metrica --></div>
  <div class="col-span-1"><!-- Metrica --></div>
  <div class="col-span-2"><!-- Chart ancho --></div>
</div>
```

**Reglas clave:**
- Tamano = jerarquia (2x2 commands 2.6x mas atencion que 1x1)
- Gap uniforme: 12-24px entre todas las cards
- Maximo 12-15 cards visibles simultaneamente
- Responsive: Desktop 3-4 col, Tablet 2 col, Mobile 1 col
- CSS Subgrid es el gold standard 2026 para alineacion interna
- Container Queries para responsive bento

---

### 2. Glassmorphism (GANADOR 2025-2026)

**Status:** 64% de apps SaaS premium lo usan. Apple "Liquid Glass" (iOS 26, macOS Tahoe) lo llevo a nivel de sistema.

**CSS implementacion:**
```css
.glass-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px) saturate(150%);
  -webkit-backdrop-filter: blur(12px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

/* Dark mode variant */
.glass-card-dark {
  background: rgba(17, 25, 40, 0.75);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* Fallback */
@supports not (backdrop-filter: blur(10px)) {
  .glass-card {
    background: rgba(15, 23, 42, 0.95);
  }
}
```

**Tailwind equivalent:**
```html
<div class="bg-white/[0.08] backdrop-blur-xl backdrop-saturate-150
            border border-white/10 rounded-xl
            shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
</div>
```

**Best practices:**
- Opacidad: 10-40% segun brillo del fondo
- Blur: 10-20px para look frost. 6-8px en mobile
- Limitar a 3-5 elementos glass por viewport (GPU-intensive)
- NUNCA animar `backdrop-filter` directamente
- Soporte: ~95% global en 2025

**Neobrutalism:** Mas nicho - bordes gruesos 2-4px, sombras offset solidas, colores saturados. Para apps con personalidad, NO enterprise.

**Neumorphism:** Declinando - problemas de accesibilidad (bajo contraste). Evitar para dashboards de datos.

---

### 3. Animated Gradients y Mesh Backgrounds

**CSS con @property (2025 game-changer):**
```css
@property --gradient-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

.animated-gradient {
  --gradient-angle: 0deg;
  background: linear-gradient(
    var(--gradient-angle),
    #0a1628, #131e3a, #1e3a5f, #0c4a6e
  );
  animation: rotate-gradient 8s linear infinite;
}

@keyframes rotate-gradient {
  to { --gradient-angle: 360deg; }
}
```

**Mesh gradient para dark dashboards:**
```css
.mesh-bg {
  background-color: #0a1628;
  background-image:
    radial-gradient(at 20% 80%, rgba(14, 165, 233, 0.15) 0px, transparent 50%),
    radial-gradient(at 80% 20%, rgba(139, 92, 246, 0.1) 0px, transparent 50%),
    radial-gradient(at 50% 50%, rgba(249, 115, 22, 0.05) 0px, transparent 50%);
}
```

**Performance:** Animar gradientes CSS puede consumir mucha RAM/CPU. Para animaciones complejas, WebGL (GPU) es mas eficiente.

**Tools:** csshero.org/mesher/ (mesh gradients), gradient-animator.com, cssgradient.io

---

### 4. Micro-interactions y Transitions

**Timing functions premium:**
```css
/* Ease-out para entradas (objetos llegando) */
.slide-in { transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); }

/* Spring bounce para feedback */
.bounce-click { transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }

/* Smooth deceleration */
.smooth { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
```

**Patterns recomendados para dashboards:**
- Hover cards: `scale(1.02)` + shadow increase + 200ms
- Modal appear: `opacity 0->1` + `translateY(20px->0)` + 300ms
- Sidebar collapse: `width` transition 300ms ease
- Data loading: Skeleton shimmer animation
- Status change: Color fade 200ms

---

### 5. Dark Mode Best Practices 2025-2026

**Arquitectura de tokens semanticos:**
```
Primitives:     gray-100, gray-200, ..., gray-900
Semantic:       color.surface.primary -> gray-900 (dark) / gray-100 (light)
Component:      card.background -> color.surface.primary
```

**Sistema de superficies por capas (NO un solo background):**
```
Base (canvas):    #0a1628  -- Fondo principal
Surface 1:       #131e3a  -- Cards, paneles
Surface 2:       #1e293b  -- Elementos elevados
Surface 3:       #334155  -- Popovers, menus
Overlay:         rgba(0,0,0,0.5)  -- Modals backdrop
```

**Colores semanticos para dark mode:**
- Desaturar colores por defecto (muted alternatives)
- Success: `#4ade80` (no verde brillante puro)
- Warning: `#fbbf24` (no amarillo fosforescente)
- Error: `#f87171` (no rojo puro intenso)
- Info: `#60a5fa` (no azul electrico)

**Contraste WCAG:**
- Texto normal: minimo 4.5:1 contra fondo
- Texto grande: minimo 3:1 contra fondo
- UI components: minimo 3:1 contra adyacentes
- NO usar `#000000` puro como fondo (muy duro). Usar color de marca con 1-10% luminosidad

**Tendencia 2026:** Dark mode evoluciona a "mood mode" - paletas personalizables con nivel de contraste y colores accent configurables por usuario.

---

### 6. Data-Dense Dashboard Patterns

**Principios:**
- Jerarquia de informacion: KPIs grandes arriba, detalles abajo
- Bento grid para mezclar tipos de contenido (charts, metricas, listas) sin caos visual
- Group widgets para categorizar paneles (como Datadog)
- Progressive disclosure: resumen -> click -> detalle

**Densidad por tipo de usuario:**
- Ejecutivos: KPIs grandes, pocos numeros, mucho whitespace
- Operadores: Tablas densas, muchos datos, filtros avanzados
- Ingenieros: Terminal-like, logs, metricas tecnicas

---

### 7. Modern Sidebar Patterns

**Standard 2025-2026:**
- Expandido: `w-64` (256px) con icon + label
- Colapsado: `w-16` (64px) con solo icon
- Transition: `300ms ease`
- Hover-to-expand cuando colapsado
- Secciones separadas: Main / Secondary / Bottom (fixed)
- Badge de notificaciones en items
- Active state con accent color (left border o background highlight)
- Keyboard shortcut para toggle (Cmd+/)

**Estructura recomendada:**
```
[Logo/Brand] ................. [Collapse toggle]
─────────────
[Home icon]  Dashboard
[Box icon]   Operations
[Brain icon] Intelligence
[Chart icon] Analytics
─────────────
[Target icon] Marketing
[Webhook]     Integrations
─────────────
[Chat icon]  AI Assistant  ←── fixed bottom
[Gear icon]  Settings
[User icon]  Profile
```

---

### 8. Card Design Trends 2025-2026

**Stripe-inspired (Premium Standard):**
```css
.card-premium {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  box-shadow:
    0 0.125em 0.313em rgba(50, 50, 93, 0.09),
    0 0.063em 0.125em rgba(0, 0, 0, 0.07);
  transition: all 0.2s ease;
}
.card-premium:hover {
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow:
    0 0.25em 0.375em rgba(50, 50, 93, 0.09),
    0 0.063em 0.188em rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}
```

**Linear-inspired (Glassmorphism Dark):**
```css
.card-glass-dark {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(12px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.05);
}
```

**border-radius por contexto:**
- Enterprise/datos: `4-6px` (Grafana, Datadog, FedEx)
- SaaS moderno: `8-12px` (Stripe, Vercel, Linear, Uber)
- Mobile/consumer: `12-16px` (Rappi, mobile views)

---

### 9. Tipografia Trends 2025-2026

**Fonts premium para dashboards:**
| Font | Usado por | Tipo |
|------|-----------|------|
| Inter / Inter Display | Linear, Figma, Grafana | Open source, versatil |
| Geist Sans / Mono | Vercel | Open source, Swiss-inspired |
| Sohne | Stripe | Premium |
| Uber Move | Uber | Propietaria |
| SF Pro Display | Apple ecosystem | System |

**Scale recomendada para dashboard:**
```
--text-xs: 0.75rem;    /* 12px - labels, captions */
--text-sm: 0.875rem;   /* 14px - body, data tables */
--text-base: 1rem;     /* 16px - body comfortable */
--text-lg: 1.125rem;   /* 18px - section headers */
--text-xl: 1.25rem;    /* 20px - page titles */
--text-2xl: 1.5rem;    /* 24px - KPI values */
--text-3xl: 1.875rem;  /* 30px - hero metrics */
--text-4xl: 2.25rem;   /* 36px - large stats */
```

---

## PARTE 3: PLAN DE IMPLEMENTACION PARA LITPER PRO

---

### Recomendacion de Diseno Final (Hibrido de lo mejor)

Basado en la investigacion de las 17 plataformas y las tendencias 2025-2026, aqui esta la recomendacion para el modal y sistema de reportes de LITPER PRO:

#### Approach: "Linear meets Stripe on Dark Logistics"

**Paleta refinada para LITPER PRO:**
```
// Backgrounds (Grafana-level dark + elevation system)
--bg-canvas:        #0a1628;   // Base (ya existente navy-950)
--bg-surface-1:     #131e3a;   // Cards, panels (navy-900)
--bg-surface-2:     #1e293b;   // Elevated elements (slate-850)
--bg-surface-3:     #334155;   // Popovers, dropdowns

// Accents (mantener brand existente)
--accent-primary:   #0ea5e9;   // Corporate blue-500
--accent-orange:    #f97316;   // Amazon orange
--accent-gold:      #f59e0b;   // Premium gold

// Semantic
--color-success:    #4ade80;   // Success green
--color-warning:    #fbbf24;   // Warning amber
--color-error:      #f87171;   // Error red (desaturado)
--color-info:       #60a5fa;   // Info blue

// Text
--text-primary:     #f1f5f9;   // Near-white
--text-secondary:   #94a3b8;   // Muted slate
--text-tertiary:    #64748b;   // Placeholder

// Borders (Linear-style)
--border-subtle:    rgba(255, 255, 255, 0.06);
--border-default:   rgba(255, 255, 255, 0.10);
--border-emphasis:  rgba(255, 255, 255, 0.16);
```

**Cards premium para LITPER PRO:**
```css
/* Base card - Stripe shadow quality + Linear glassmorphism */
.litper-card {
  background: rgba(19, 30, 58, 0.8);              /* navy-900 con opacidad */
  backdrop-filter: blur(12px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  box-shadow:
    0 0.125em 0.313em rgba(14, 165, 233, 0.06),  /* tinte blue corporate */
    0 0.063em 0.125em rgba(0, 0, 0, 0.12);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.litper-card:hover {
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow:
    0 0.25em 0.5em rgba(14, 165, 233, 0.08),
    0 0.125em 0.25em rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}
```

**Modal premium (el ReportUploadModal):**
```css
/* Overlay */
.modal-overlay {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
}

/* Modal container */
.modal-content {
  background: linear-gradient(135deg, rgba(19,30,58,0.95), rgba(10,22,40,0.98));
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  box-shadow:
    0 25px 50px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  max-width: 640px;
  width: 95vw;
}
```

---

### Componentes a Crear/Modificar

#### Paso 1: Store + Service (Base)
- `stores/reportUploadStore.ts` (ya existe - verificar/mejorar)
- `services/reportUploadService.ts` (ya existe - verificar/mejorar)

#### Paso 2: ReportUploadModal (Component Principal)
- `components/ReportUpload/ReportUploadModal.tsx`
- Drag & drop, form, preview, validacion
- Animaciones: fade-in overlay + slide-up modal (300ms cubic-bezier)
- Glassmorphism dark card style
- Progress bar con gradient accent

#### Paso 3: MyReportsPanel (Vista Usuario)
- `components/ReportUpload/MyReportsPanel.tsx`
- Bento grid layout para reports cards
- Status badges con colores semanticos
- Filtros con chips interactivos

#### Paso 4: AdminReportsView (Vista Admin)
- `components/ReportUpload/AdminReportsView.tsx`
- Dashboard metricas (bento grid: KPI grandes + tabla detallada)
- Bulk actions (aprobar multiples, exportar)
- Data tables con Stripe-style alternating rows

#### Paso 5: Integracion
- Boton en sidebar + top bar
- Conexion con auth existente (roles admin/operador/viewer)

---

### Tailwind Classes Pattern (Copy-Paste Ready)

**Card base dark:**
```
bg-[rgba(19,30,58,0.8)] backdrop-blur-xl backdrop-saturate-150
border border-white/[0.06] rounded-xl
shadow-[0_2px_5px_rgba(14,165,233,0.06),0_1px_2px_rgba(0,0,0,0.12)]
hover:border-white/[0.12] hover:shadow-[0_4px_8px_rgba(14,165,233,0.08),0_2px_4px_rgba(0,0,0,0.15)]
hover:-translate-y-px transition-all duration-200
```

**Modal overlay:**
```
fixed inset-0 z-50 bg-black/60 backdrop-blur-sm
flex items-center justify-center p-4
```

**Modal content:**
```
bg-gradient-to-br from-[rgba(19,30,58,0.95)] to-[rgba(10,22,40,0.98)]
backdrop-blur-[20px] backdrop-saturate-[180%]
border border-white/[0.08] rounded-2xl
shadow-[0_25px_50px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)]
max-w-[640px] w-[95vw] animate-slide-up
```

**Status badges:**
```
/* Submitted */  bg-blue-500/20 text-blue-400 border border-blue-500/30
/* Approved */   bg-emerald-500/20 text-emerald-400 border border-emerald-500/30
/* Rejected */   bg-red-500/20 text-red-400 border border-red-500/30
/* Pending */    bg-amber-500/20 text-amber-400 border border-amber-500/30
/* Draft */      bg-slate-500/20 text-slate-400 border border-slate-500/30
```

**Bento grid para dashboard:**
```
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4
/* Item grande: */ col-span-2 row-span-2
/* Item ancho: */  col-span-2
/* Item normal: */ col-span-1
```

---

## FUENTES DE LA INVESTIGACION

### Tier 1 - Logistics
- [Amazon DSP Scorecard Guide](https://metromaxbpmservices.com/what-amazon-isnt-telling-you-about-the-dsp-performance-scorecard-a-complete-guide/)
- [UPS ORION Overview](https://www.upperinc.com/blog/ups-route-planning-software/)
- [FedEx Brand Colors](https://usbrandcolors.com/fedex-colors/)
- [DHL Brand Portal Colors](https://www.dpdhl-brands.com/dhl/en/guides/design-basics/colors-materials/colors.html)
- [DHL UI Library](https://docs.uilibrary.dhl/foundations/Colors)
- [Uber Freight 2025 Platform](https://www.uberfreight.com/en-US/blog/deliver-2025-unveiling-new-platform-features)

### Tier 2 - Modern Logistics Tech
- [Flexport Latitude Design System (Figma)](https://www.figma.com/community/file/887518258758541203/intro-to-latitude-flexports-design-system)
- [Flexport Dashboard 2.0](https://medium.com/flexport-ux/the-flexport-dashboard-2-0-2524f8e92245)
- [project44 Platform](https://www.project44.com/platform/visibility/)
- [Onfleet Dashboard Overview](https://support.onfleet.com/hc/en-us/articles/204100299-Dashboard-overview)
- [Bringg Platform](https://help.bringg.com/delivery-hub/docs/about-the-bringg-platform)
- [Rappi Partners Portal](https://merchants.rappi.com/es-co/que-ofrecemos/plataforma-partners)

### Tier 3 - Best SaaS Dashboards
- [Linear UI Redesign](https://linear.app/now/how-we-redesigned-the-linear-ui)
- [Linear Style Themes](https://linear.style/)
- [Linear Design (Medium)](https://medium.com/design-bootcamp/the-rise-of-linear-style-design-origins-trends-and-techniques-4fd96aab7646)
- [Vercel Geist Design System](https://vercel.com/geist/introduction)
- [Vercel Geist Colors](https://vercel.com/geist/colors)
- [Vercel Geist Font](https://vercel.com/font)
- [Stripe Elements Appearance API](https://docs.stripe.com/elements/appearance-api)
- [Stripe Accessible Color Systems](https://stripe.com/blog/accessible-color-systems)
- [Stripe Color System](https://www.colorsandfonts.com/color-systems/stripe-color-system/)
- [Figma UI3 Design](https://www.figma.com/blog/our-approach-to-designing-ui3/)
- [Datadog DRUIDS Design System](https://www.datadoghq.com/blog/engineering/druids-the-design-system-that-powers-datadog/)
- [Datadog Widget Colors](https://docs.datadoghq.com/dashboards/guide/widget_colors/)
- [Grafana Themes Source Code](https://github.com/grafana/grafana/blob/main/packages/grafana-data/src/themes/createColors.ts)
- [Grafana Dashboard Best Practices](https://www.groundcover.com/learn/observability/grafana-dashboards)

### Design Trends 2025-2026
- [Bento Grid Design Guide 2026](https://landdding.com/blog/blog-bento-grid-design-guide)
- [Bento Grid Dashboard Design](https://www.orbix.studio/blogs/bento-grid-dashboard-design-aesthetics)
- [Bento Grids Collection](https://bentogrids.com)
- [Glassmorphism Implementation Guide 2025](https://playground.halfaccessible.com/blog/glassmorphism-design-trend-implementation-guide)
- [Glass UI Generator](https://ui.glass/generator/)
- [Dark Mode UX 2025](https://www.influencers-time.com/dark-mode-ux-in-2025-design-tips-for-comfort-and-control/)
- [Dark Mode Best Practices 2026](https://www.tech-rz.com/blog/dark-mode-design-best-practices-in-2026/)
- [Color Tokens Enterprise Design Systems](https://www.aufaitux.com/blog/color-tokens-enterprise-design-systems-best-practices/)
- [DoorDash Dark Mode System](https://careersatdoordash.com/blog/launching-dark-mode-while-building-a-scalable-design-system/)
- [Figma Variables Best Practice 2025-2026](https://www.designsystemscollective.com/design-system-mastery-with-figma-variables-the-2025-2026-best-practice-playbook-da0500ca0e66)
