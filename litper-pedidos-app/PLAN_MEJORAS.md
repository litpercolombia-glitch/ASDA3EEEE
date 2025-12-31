# Plan de Mejoras - LITPER PEDIDOS v2.0

## Resumen Ejecutivo

Rediseño completo de la app con enfoque en **UTILIDAD** y **EXPORTACIÓN**:
- **2 Procesos**: Generación de Guías (6 campos) y Novedad (9 campos)
- **3 Vistas**: Widget, Sidebar (predeterminada), Compacto
- **Timer** con cuenta regresiva para saber tiempo restante
- **TOT Devoluciones AUTOMÁTICO** (suma de los 4 tipos)
- **Botón Exportar SIEMPRE VISIBLE**
- **Atajos de teclado** para velocidad
- **Auto-guardado** cada 30 segundos
- **Excel con columnas calculadas** y nombre con fecha

---

## 1. LOS 2 PROCESOS

### 1.1 Proceso: GENERACIÓN DE GUÍAS (6 campos)
| Campo | Icono | Color | Atajo |
|-------|-------|-------|-------|
| Realizado | ✓ | Verde #10B981 | 1 |
| Cancelados | ✗ | Rojo #EF4444 | 2 |
| Agendados | 📅 | Azul #3B82F6 | 3 |
| Difíciles | ⚠️ | Naranja #F97316 | 4 |
| Pedido Pendiente | ⏳ | Amarillo #F59E0B | 5 |
| Revisado | 👁️ | Morado #8B5CF6 | 6 |

### 1.2 Proceso: NOVEDAD (9 campos, agrupados)

**Grupo: NOVEDADES**
| Campo | Icono | Color | Atajo |
|-------|-------|-------|-------|
| Novedades iniciales | 📋 | Azul #3B82F6 | 1 |
| Novedades solucionadas | ✅ | Verde #10B981 | 2 |
| Novedades revisadas | 👁️ | Morado #8B5CF6 | 3 |
| Novedades finales pendientes | ⏳ | Amarillo #F59E0B | 4 |

**Grupo: DEVOLUCIONES**
| Campo | Icono | Color | Atajo |
|-------|-------|-------|-------|
| Devolución x LITPER | 🔄 | Naranja #F97316 | 5 |
| Devolución 3 intentos | 🔁 | Rojo #EF4444 | 6 |
| Devolución error transportadora | 🚚 | Gris #6B7280 | 7 |
| Devolución x proveedor | 📦 | Cyan #06B6D4 | 8 |
| **TOT Devoluciones** | 📊 | Rosa #EC4899 | **AUTO** |

> ⚠️ **TOT Devoluciones se calcula AUTOMÁTICAMENTE** sumando los 4 tipos de devolución

---

## 2. ESTRUCTURAS DE DATOS

### 2.1 Tipos
```typescript
type TipoProceso = 'guias' | 'novedad';
type ViewLayout = 'widget' | 'sidebar' | 'compact';

interface ContadoresGuias {
  realizado: number;
  cancelados: number;
  agendados: number;
  dificiles: number;
  pedidoPendiente: number;
  revisado: number;
}

interface ContadoresNovedad {
  novedadesIniciales: number;
  novedadesSolucionadas: number;
  novedadesRevisadas: number;
  novedadesFinalePendientes: number;
  devolucionLitper: number;
  devolucion3Intentos: number;
  devolucionErrorTransportadora: number;
  devolucionProveedor: number;
  // totDevoluciones se CALCULA, no se guarda
}

// Función para calcular TOT
const calcularTotDevoluciones = (c: ContadoresNovedad): number =>
  c.devolucionLitper +
  c.devolucion3Intentos +
  c.devolucionErrorTransportadora +
  c.devolucionProveedor;
```

### 2.2 Bloque
```typescript
interface Bloque {
  id: string;
  usuarioId: string;
  tipoProceso: TipoProceso;
  fecha: string;                    // YYYY-MM-DD
  horaInicio: string;               // HH:MM
  horaFin: string;                  // HH:MM
  tiempoTotal: number;              // segundos

  // Contadores según proceso
  contadoresGuias?: ContadoresGuias;
  contadoresNovedad?: ContadoresNovedad;

  // Estadísticas calculadas
  totalOperaciones: number;
  promedioMinuto: number;
  porcentajeExito?: number;         // Para Guías: realizados/(realizados+cancelados)
}
```

### 2.3 AutoGuardado
```typescript
interface BloqueEnProgreso {
  iniciadoEn: string;               // timestamp
  ultimoGuardado: string;           // timestamp
  procesoActivo: TipoProceso;
  contadoresGuias: ContadoresGuias;
  contadoresNovedad: ContadoresNovedad;
  tiempoTranscurrido: number;
}
```

---

## 3. LAS 3 VISTAS

### Vista SIDEBAR (PREDETERMINADA) - Guías
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ LITPER  [📦 Guías][📋 Nov]   👤 Juan   ⏱️ 15:32                          [📥] ─ □ ×  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ ✓ 45 [+][-]  ✗ 3 [+][-]  📅 7 [+][-]  ⚠️ 2 [+][-]  ⏳ 4 [+][-]  👁️ 8 [+][-]   [🔄]  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Bloque #3 │ Hoy: 127 realizados │ Auto-guardado ✓                                     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Vista SIDEBAR - Novedad
```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ LITPER  [📦][📋 Novedad]   👤 Juan   ⏱️ 15:32                                            [📥] ─ □ ×    │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ NOVEDADES: 📋 12 [+][-]  ✅ 8 [+][-]  👁️ 5 [+][-]  ⏳ 3 [+][-]  │  DEV: 🔄 2  🔁 1  🚚 0  📦 1  📊 4   │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Bloque #3 │ TOT Devoluciones: 4 (auto) │ Auto-guardado ✓                                    [🔄]        │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Vista WIDGET - Guías
```
┌───────────────────────────────┐
│ LITPER PEDIDOS    [📥] ─ □ × │
├───────────────────────────────┤
│ [📦 Guías] [📋 Novedad]       │
├───────────────────────────────┤
│  👤 Juan ▼      ⏱️ 15:32     │
├───────────────────────────────┤
│ ┌───────────────────────────┐ │
│ │ ✓ Realizado      45 [+][-]│ │
│ │ ✗ Cancelados      3 [+][-]│ │
│ │ 📅 Agendados      7 [+][-]│ │
│ │ ⚠️ Difíciles      2 [+][-]│ │
│ │ ⏳ Pendiente      4 [+][-]│ │
│ │ 👁️ Revisado       8 [+][-]│ │
│ └───────────────────────────┘ │
│                               │
│ Bloque #3 │ Auto-guardado ✓  │
│                               │
│     [🔄 REINICIAR BLOQUE]     │
├───────────────────────────────┤
│  Stats │ Bloques │ ⚙️        │
└───────────────────────────────┘
```

### Vista WIDGET - Novedad (Agrupado)
```
┌───────────────────────────────┐
│ LITPER PEDIDOS    [📥] ─ □ × │
├───────────────────────────────┤
│ [📦 Guías] [📋 Novedad]       │
├───────────────────────────────┤
│  👤 Juan ▼      ⏱️ 15:32     │
├───────────────────────────────┤
│ ┌─ NOVEDADES ───────────────┐ │
│ │ 📋 Iniciales     12 [+][-]│ │
│ │ ✅ Solucionadas   8 [+][-]│ │
│ │ 👁️ Revisadas     5 [+][-]│ │
│ │ ⏳ Pendientes    3 [+][-]│ │
│ └───────────────────────────┘ │
│ ┌─ DEVOLUCIONES ────────────┐ │
│ │ 🔄 x LITPER      2 [+][-]│ │
│ │ 🔁 3 intentos    1 [+][-]│ │
│ │ 🚚 Transportad.  0 [+][-]│ │
│ │ 📦 x Proveedor   1 [+][-]│ │
│ ├───────────────────────────┤ │
│ │ 📊 TOTAL         4 (auto)│ │
│ └───────────────────────────┘ │
│                               │
│     [🔄 REINICIAR BLOQUE]     │
├───────────────────────────────┤
│  Stats │ Bloques │ ⚙️        │
└───────────────────────────────┘
```

### Vista COMPACTO - Guías
```
┌───────────────────────────────────────────────────────────┐
│ 📦 ⏱️15:32  ✓45 ✗3 📅7 ⚠️2 ⏳4 👁️8   [🔄] [📥]        │
└───────────────────────────────────────────────────────────┘
```

### Vista COMPACTO - Novedad
```
┌─────────────────────────────────────────────────────────────────────┐
│ 📋 ⏱️15:32  📋12 ✅8 👁️5 ⏳3 │ 🔄2 🔁1 🚚0 📦1 =4   [🔄] [📥]    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. ATAJOS DE TECLADO

### Globales
| Atajo | Acción |
|-------|--------|
| `R` | Reiniciar bloque |
| `E` | Exportar día |
| `G` | Cambiar a Guías |
| `N` | Cambiar a Novedad |
| `1-2-3` | Cambiar vista (Widget/Sidebar/Compact) |

### Contadores (según proceso activo)
| Tecla | Guías | Novedad |
|-------|-------|---------|
| `1` / `Shift+1` | +1/-1 Realizado | +1/-1 Nov. Iniciales |
| `2` / `Shift+2` | +1/-1 Cancelados | +1/-1 Nov. Solucionadas |
| `3` / `Shift+3` | +1/-1 Agendados | +1/-1 Nov. Revisadas |
| `4` / `Shift+4` | +1/-1 Difíciles | +1/-1 Nov. Pendientes |
| `5` / `Shift+5` | +1/-1 Pendiente | +1/-1 Dev. LITPER |
| `6` / `Shift+6` | +1/-1 Revisado | +1/-1 Dev. 3 intentos |
| `7` / `Shift+7` | - | +1/-1 Dev. Transportadora |
| `8` / `Shift+8` | - | +1/-1 Dev. Proveedor |

---

## 5. AUTO-GUARDADO

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTO-GUARDADO                            │
│                                                             │
│    Cada 30 segundos se guarda automáticamente:              │
│    - Contadores actuales del bloque                         │
│    - Tiempo transcurrido                                    │
│    - Proceso activo                                         │
│                                                             │
│    Si la app se cierra sin "Reiniciar":                     │
│    → Al abrir, pregunta si continuar o descartar            │
│                                                             │
│    Indicador visual: "Auto-guardado ✓" o "Guardando..."    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. EXPORTACIÓN A EXCEL

### 6.1 Botón SIEMPRE VISIBLE
El botón [📥] está siempre visible en la barra superior, sin importar la vista.

### 6.2 Menú de Exportación
```
┌─────────────────────────────────┐
│  📥 Exportar a Excel            │
├─────────────────────────────────┤
│  ○ Bloque actual                │
│  ● Todo el día - Guías          │
│  ○ Todo el día - Novedad        │
│  ○ Todo el día - Ambos          │
│  ○ Historial completo           │
├─────────────────────────────────┤
│  [Descargar]                    │
└─────────────────────────────────┘
```

### 6.3 Nombre del Archivo
```
LITPER_Guias_2025-12-31.xlsx
LITPER_Novedad_2025-12-31.xlsx
LITPER_Completo_2025-12-31.xlsx
```

### 6.4 Contenido del Excel - Guías

**Hoja 1: Resumen**
| Fecha | Bloques | Realizado | Cancelados | Agendados | Difíciles | Pendiente | Revisado | % Éxito |
|-------|---------|-----------|------------|-----------|-----------|-----------|----------|---------|
| 2025-12-31 | 5 | 127 | 8 | 15 | 6 | 12 | 45 | 94.1% |

**Hoja 2: Detalle Bloques**
| # | Inicio | Fin | Duración | Realizado | Cancelados | Agendados | Difíciles | Pendiente | Revisado | Prom/min | % Éxito |
|---|--------|-----|----------|-----------|------------|-----------|-----------|-----------|----------|----------|---------|
| 1 | 08:00 | 08:25 | 25min | 32 | 2 | 3 | 1 | 2 | 8 | 1.92 | 94.1% |
| 2 | 08:30 | 08:55 | 25min | 28 | 1 | 4 | 2 | 3 | 9 | 1.88 | 96.6% |

**Columnas Calculadas:**
- `% Éxito` = Realizado / (Realizado + Cancelados) × 100
- `Prom/min` = Total operaciones / minutos

### 6.5 Contenido del Excel - Novedad

**Hoja 1: Resumen**
| Fecha | Bloques | Iniciales | Solucion. | Revisadas | Pendientes | Dev.LITPER | Dev.3Int | Dev.Transp | Dev.Prov | TOT Dev | % Solucionado |
|-------|---------|-----------|-----------|-----------|------------|------------|----------|------------|----------|---------|---------------|
| 2025-12-31 | 3 | 45 | 38 | 42 | 7 | 5 | 3 | 2 | 4 | 14 | 84.4% |

**Hoja 2: Detalle Bloques**
| # | Inicio | Fin | Iniciales | Solucion. | Revisadas | Pendientes | Dev.LITPER | Dev.3Int | Dev.Transp | Dev.Prov | TOT Dev |
|---|--------|-----|-----------|-----------|-----------|------------|------------|----------|------------|----------|---------|
| 1 | 08:00 | 08:25 | 15 | 12 | 14 | 3 | 2 | 1 | 0 | 1 | 4 |

**Columnas Calculadas:**
- `TOT Dev` = Dev.LITPER + Dev.3Int + Dev.Transp + Dev.Prov
- `% Solucionado` = Solucionadas / Iniciales × 100

### 6.6 Confirmación Visual
```
┌──────────────────────────────────┐
│  ✅ Excel descargado!            │
│                                  │
│  📄 LITPER_Guias_2025-12-31.xlsx │
│  📊 4 bloques, 127 registros     │
│                                  │
│  [OK]                            │
└──────────────────────────────────┘
```

---

## 7. TIMER CON CUENTA REGRESIVA

### 7.1 Funcionamiento
```
┌─────────────────────────────────────┐
│           TIMER                     │
│                                     │
│    Presets: [15] [20] [25] [30] min │
│                                     │
│         ⏱️ 15:32                    │
│         ████████░░░░ 62%            │
│                                     │
│    Colores según tiempo restante:   │
│    > 50%  → Verde                   │
│    25-50% → Amarillo                │
│    10-25% → Naranja                 │
│    < 10%  → Rojo (parpadeando)      │
│                                     │
│    Al llegar a 0:                   │
│    → Sonido de alerta               │
│    → Prompt para reiniciar bloque   │
│                                     │
└─────────────────────────────────────┘
```

### 7.2 Controles
- [▶️] Iniciar/Continuar
- [⏸️] Pausar
- [🔄] Reiniciar bloque (guarda datos + reinicia timer)

---

## 8. ARQUITECTURA DE ARCHIVOS

```
litper-pedidos-app/
├── src/
│   ├── components/
│   │   ├── ProcessSelector.tsx      ← Tabs Guías/Novedad
│   │   ├── QuickCounters.tsx        ← Contadores dinámicos
│   │   ├── CounterButton.tsx        ← Botón +/- con animación
│   │   ├── CounterGroup.tsx         ← Grupo de contadores (para Novedad)
│   │   ├── Timer.tsx                ← Timer cuenta regresiva
│   │   ├── BlockCard.tsx            ← Tarjeta de bloque
│   │   ├── BlocksPanel.tsx          ← Lista de bloques
│   │   ├── ExportButton.tsx         ← Botón exportar siempre visible
│   │   ├── ExportModal.tsx          ← Modal de opciones exportación
│   │   ├── AutoSaveIndicator.tsx    ← Indicador de auto-guardado
│   │   ├── ViewSwitcher.tsx         ← Cambio de vista
│   │   ├── NewDayButton.tsx         ← Botón nuevo día
│   │   ├── layouts/
│   │   │   ├── WidgetLayout.tsx
│   │   │   ├── SidebarLayout.tsx    ← PREDETERMINADO
│   │   │   └── CompactLayout.tsx
│   │   └── ... (existentes)
│   ├── stores/
│   │   └── appStore.ts              ← Store actualizado
│   ├── config/
│   │   ├── processConfig.ts         ← Configuración de procesos
│   │   └── keyboardShortcuts.ts     ← Mapeo de atajos
│   ├── utils/
│   │   ├── excelExport.ts           ← Generador Excel
│   │   ├── calculations.ts          ← Cálculos (TOT, %, etc)
│   │   └── autoSave.ts              ← Lógica de auto-guardado
│   ├── hooks/
│   │   ├── useKeyboardShortcuts.ts  ← Hook para atajos
│   │   ├── useAutoSave.ts           ← Hook para auto-guardado
│   │   └── useCounterAnimation.ts   ← Hook para animaciones
│   └── styles/
│       └── animations.css           ← Animaciones CSS
├── electron/
│   └── main.js                      ← Actualizar para resize dinámico
└── package.json                     ← Agregar xlsx, file-saver
```

---

## 9. DEPENDENCIAS NUEVAS

```json
{
  "dependencies": {
    "xlsx": "^0.18.5",
    "file-saver": "^2.0.5",
    "framer-motion": "^11.0.0"
  }
}
```

---

## 10. PLAN DE IMPLEMENTACIÓN

### Fase 1: Core (Store y Tipos)
- [ ] 1.1 Crear tipos para procesos
- [ ] 1.2 Crear config/processConfig.ts
- [ ] 1.3 Actualizar appStore.ts
- [ ] 1.4 Implementar cálculo automático TOT Devoluciones
- [ ] 1.5 Implementar lógica de bloques

### Fase 2: Auto-guardado
- [ ] 2.1 Crear utils/autoSave.ts
- [ ] 2.2 Crear hooks/useAutoSave.ts
- [ ] 2.3 Crear AutoSaveIndicator.tsx

### Fase 3: Componentes Contadores
- [ ] 3.1 Crear CounterButton.tsx con animaciones
- [ ] 3.2 Crear CounterGroup.tsx
- [ ] 3.3 Crear QuickCounters.tsx
- [ ] 3.4 Crear ProcessSelector.tsx

### Fase 4: Timer
- [ ] 4.1 Actualizar Timer.tsx con cuenta regresiva
- [ ] 4.2 Colores según tiempo restante
- [ ] 4.3 Sonido al terminar

### Fase 5: Layouts
- [ ] 5.1 Crear SidebarLayout.tsx (predeterminado)
- [ ] 5.2 Crear WidgetLayout.tsx
- [ ] 5.3 Crear CompactLayout.tsx
- [ ] 5.4 Crear ViewSwitcher.tsx

### Fase 6: Exportación Excel
- [ ] 6.1 Instalar xlsx y file-saver
- [ ] 6.2 Crear utils/excelExport.ts
- [ ] 6.3 Crear ExportButton.tsx (siempre visible)
- [ ] 6.4 Crear ExportModal.tsx
- [ ] 6.5 Implementar columnas calculadas

### Fase 7: Atajos de Teclado
- [ ] 7.1 Crear config/keyboardShortcuts.ts
- [ ] 7.2 Crear hooks/useKeyboardShortcuts.ts
- [ ] 7.3 Integrar atajos en toda la app

### Fase 8: Electron
- [ ] 8.1 Actualizar main.js para resize dinámico
- [ ] 8.2 Registrar shortcuts globales
- [ ] 8.3 Actualizar menú de tray

### Fase 9: Polish
- [ ] 9.1 Animaciones CSS
- [ ] 9.2 Confirmación visual de exportación
- [ ] 9.3 Testing y ajustes

---

## 11. RESUMEN VISUAL FINAL

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        LITPER PEDIDOS v2.0                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   2 PROCESOS              3 VISTAS              TIMER                   │
│   ┌──────────────┐        ┌─────────────┐       ┌─────────────┐        │
│   │ 📦 Guías (6) │        │ Sidebar ★   │       │ Cuenta      │        │
│   │ 📋 Novedad(9)│        │ Widget      │       │ regresiva   │        │
│   │              │        │ Compacto    │       │ con colores │        │
│   │ TOT = AUTO   │        └─────────────┘       └─────────────┘        │
│   └──────────────┘                                                      │
│                                                                         │
│   EXPORTAR               AUTO-GUARDADO          ATAJOS                  │
│   ┌──────────────┐       ┌─────────────┐       ┌─────────────┐         │
│   │ [📥] Siempre │       │ Cada 30 seg │       │ 1-8 = +1    │         │
│   │ visible      │       │ No pierde   │       │ Shift = -1  │         │
│   │              │       │ datos       │       │ R = Reset   │         │
│   │ LITPER_fecha │       │ ✓ indicador │       │ E = Export  │         │
│   │ .xlsx        │       └─────────────┘       └─────────────┘         │
│   │              │                                                      │
│   │ % calculados │                                                      │
│   └──────────────┘                                                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

*Plan actualizado: 2025-12-31*
*Versión objetivo: LITPER PEDIDOS v2.0*
*Enfoque: UTILIDAD + EXPORTACIÓN*
