# LITPER DESK — Brand Kit

> Derivado del logo oficial "LITPER OFICIAL — Calidad en cada detalle".
> Aplica a la app de escritorio LITPER DESK y a todas las plantillas
> generadas (WhatsApp, PDF de reportes, splash screen, app icon).

---

## 1. Paleta de color

### Primarios

| Token | Hex | Uso |
|-------|-----|-----|
| `litper-navy-950` | `#0A0E27` | Fondo principal del Halo (transparente sobre escritorio) |
| `litper-navy-900` | `#0D1430` | Fondo de Comando (workbench expandido) |
| `litper-navy-800` | `#141B3D` | Tarjetas, paneles, elevación 1 |
| `litper-navy-700` | `#1F2A5C` | Hover de tarjetas |

### Acento gold (corona del logo)

| Token | Hex | Uso |
|-------|-----|-----|
| `litper-gold-400` | `#F4C842` | Highlight, focus ring, números grandes (timer) |
| `litper-gold-500` | `#D4AF37` | Botones primarios, bordes activos, link |
| `litper-gold-600` | `#B8941E` | Hover de gold-500, tipografía secundaria sobre gold |

### Acento red (gemas + tagline del logo)

| Token | Hex | Uso |
|-------|-----|-----|
| `litper-red-500` | `#C0392B` | Semáforo rojo, alertas críticas, badge "ronda en peligro" |
| `litper-red-600` | `#A02622` | Hover red-500 |

### Texto

| Token | Hex | Uso |
|-------|-----|-----|
| `litper-cream` | `#F5F2E8` | Texto principal sobre fondos navy |
| `litper-cream-muted` | `#A8A48F` | Texto secundario, hints |
| `litper-text-disabled` | `#5C5642` | Disabled |

### Estados de semáforo (alineados con reglas de negocio)

| Token | Hex | Regla |
|-------|-----|-------|
| `semaforo-verde` | `#10B981` | Tasa entrega ≥ 80.5% |
| `semaforo-amarillo` | `#F59E0B` | Tasa entrega ≥ 70% |
| `semaforo-rojo` | `#C0392B` | Tasa entrega < 70% |

### Colores asignados al equipo (cada operador)

| Operador | Hex | Iniciales |
|----------|-----|-----------|
| Jefer | `#38BDF8` (cielo) | JF |
| Catalina | `#EC4899` (magenta) | CT |
| Jimmy | `#06B6D4` (cian) | JM |
| Felipe | `#10B981` (esmeralda) | FL |
| Angie | `#A855F7` (púrpura) | AN |
| Karen | `#F87171` (coral) | KR |
| Erika | `#F59E0B` (ámbar) | ER |

> Cuando se agreguen operadores nuevos, se les asigna automáticamente
> uno de la paleta extendida (16 colores) sin repetir.

---

## 2. Tipografía

| Rol | Fuente | Peso |
|-----|--------|------|
| Títulos / brand | `Cinzel` (serif romana, como el logo) | 600 / 700 |
| UI / cuerpo | `Inter` | 400 / 500 / 600 |
| Mono (timer, números) | `JetBrains Mono` | 500 / 700 |

Cinzel se carga solo en pantallas con tamaño ≥ Comando (no en Halo
mini para no inflar bundle).

---

## 3. Iconografía

- App icon: el logo "LP" + corona en oro sobre cuadrado navy (rounded 22%
  para macOS-style aunque no shippeemos a Mac).
- Tamaños: 16, 32, 48, 64, 128, 256, 512px (Windows .ico contiene
  16/32/48/256, Linux .png 512).
- Tray icon: simplificación del logo a 16×16 monocromo dorado
  (`#D4AF37`), versión clara para tray oscuro y oscura para tray claro.

---

## 4. Espaciado y radius

- Radius base: `12px` (paneles), `8px` (botones), `999px` (chips).
- Sombra de elevación 1: `0 4px 16px -4px rgba(10, 14, 39, 0.6)`.
- Sombra de elevación 2 (panel flotante): `0 16px 40px -8px rgba(10, 14, 39, 0.8), 0 0 0 1px rgba(212, 175, 55, 0.15)` (ese borde
  dorado sutil es la firma visual de LITPER DESK).

---

## 5. Voz / tagline

- Tagline oficial: *"Calidad en cada detalle"*.
- En la ventana About y splash. NO en cada pantalla.
- En reportes PDF: como pie de página en gold-500.

---

## 6. Reglas

- ✅ Gold solo para énfasis (CTA, número del timer, focus ring).
- ❌ NUNCA gold para fondos completos (cansa la vista del operador).
- ✅ Red solo para alertas reales (semáforo rojo, error de guardado).
- ❌ NUNCA red para botones secundarios.
- ✅ Cream para texto sobre navy.
- ❌ NUNCA texto cream sobre gold-400 (contraste insuficiente, usar navy).
- ✅ El borde dorado sutil (`rgba(212,175,55,0.15)`) es la firma del Halo.

---

## 7. Tokens en código

Todos estos valores viven en
[`electron/renderer/src/theme/tokens.ts`](electron/renderer/src/theme/tokens.ts)
y en `electron/renderer/tailwind.config.js`. Cualquier cambio aquí
debe sincronizarse en ambos lugares (test futuro: snapshot de tokens).
