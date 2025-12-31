# Plan de Mejoras - LITPER PEDIDOS v2.0

## Resumen Ejecutivo

Rediseño completo de la app para hacerla más funcional con:
- **2 Procesos**: Generación de Guías y Novedad
- 3 modos de vista (Widget, Barra Lateral, Compacto)
- Sistema de bloques con estadísticas
- **TODOS los contadores siempre visibles** (+/-)
- Exportación a Excel
- Animaciones fluidas

---

## 1. LOS 2 PROCESOS

### 1.1 Proceso: GENERACIÓN DE GUÍAS (6 campos)
| Campo | Icono | Color |
|-------|-------|-------|
| Realizado | ✓ | Verde #10B981 |
| Cancelados | ✗ | Rojo #EF4444 |
| Agendados | 📅 | Azul #3B82F6 |
| Difíciles | ⚠️ | Naranja #F97316 |
| Pedido Pendiente | ⏳ | Amarillo #F59E0B |
| Revisado | 👁️ | Morado #8B5CF6 |

### 1.2 Proceso: NOVEDAD (9 campos)
| Campo | Icono | Color |
|-------|-------|-------|
| Novedades iniciales | 📋 | Azul #3B82F6 |
| Novedades solucionadas | ✅ | Verde #10B981 |
| Novedades revisadas | 👁️ | Morado #8B5CF6 |
| Novedades finales pendientes | ⏳ | Amarillo #F59E0B |
| Devolución x LITPER | 🔄 | Naranja #F97316 |
| Devolución 3 intentos | 🔁 | Rojo #EF4444 |
| Devolución error transportadora | 🚚 | Gris #6B7280 |
| Devolución x proveedor | 📦 | Cyan #06B6D4 |
| TOT Devoluciones | 📊 | Rosa #EC4899 |

### 1.3 Selector de Proceso
```
┌─────────────────────────────────────┐
│  [📦 Generación Guías] [📋 Novedad] │
└─────────────────────────────────────┘
```
- Tabs para cambiar entre procesos
- Cada proceso guarda sus propios datos
- El bloque guarda qué proceso se usó

---

## 2. ESTRUCTURAS DE DATOS

### 2.1 Tipos de Proceso
```typescript
type TipoProceso = 'guias' | 'novedad';

// Campos para Generación de Guías
interface ContadoresGuias {
  realizado: number;
  cancelados: number;
  agendados: number;
  dificiles: number;
  pedidoPendiente: number;
  revisado: number;
}

// Campos para Novedad
interface ContadoresNovedad {
  novedadesIniciales: number;
  novedadesSolucionadas: number;
  novedadesRevisadas: number;
  novedadesFinalePendientes: number;
  devolucionLitper: number;
  devolucion3Intentos: number;
  devolucionErrorTransportadora: number;
  devolucionProveedor: number;
  totDevoluciones: number;
}
```

### 2.2 Bloque (actualizado)
```typescript
interface Bloque {
  id: string;
  usuarioId: string;
  tipoProceso: TipoProceso;           // 'guias' | 'novedad'
  fecha: string;
  horaInicio: string;
  horaFin: string;
  tiempoTotal: number;

  // Contadores según el proceso
  contadoresGuias?: ContadoresGuias;
  contadoresNovedad?: ContadoresNovedad;

  // Estadísticas
  totalOperaciones: number;
  promedioMinuto: number;
}
```

### 2.3 Día
```typescript
interface Dia {
  id: string;
  fecha: string;
  bloques: string[];
  totalesGuias: ContadoresGuias;
  totalesNovedad: ContadoresNovedad;
  horaInicio: string;
  horaFin: string;
}
```

---

## 3. LAS 3 VISTAS (TODOS LOS CONTADORES VISIBLES)

### Vista 1: WIDGET - Generación de Guías
```
┌───────────────────────────────┐
│ LITPER PEDIDOS         ─ □ × │
├───────────────────────────────┤
│ [📦 Guías] [📋 Novedad]       │
├───────────────────────────────┤
│     [Usuario ▼]    05:32     │
├───────────────────────────────┤
│ ┌───────────────────────────┐ │
│ │ ✓ Realizado      45 [+][-]│ │
│ ├───────────────────────────┤ │
│ │ ✗ Cancelados      3 [+][-]│ │
│ ├───────────────────────────┤ │
│ │ 📅 Agendados      7 [+][-]│ │
│ ├───────────────────────────┤ │
│ │ ⚠️ Difíciles      2 [+][-]│ │
│ ├───────────────────────────┤ │
│ │ ⏳ Pendiente      4 [+][-]│ │
│ ├───────────────────────────┤ │
│ │ 👁️ Revisado       8 [+][-]│ │
│ └───────────────────────────┘ │
│                               │
│     [🔄 REINICIAR BLOQUE]     │
├───────────────────────────────┤
│  Stats │ Bloques │ ⚙️        │
└───────────────────────────────┘
```

### Vista 1: WIDGET - Novedad
```
┌───────────────────────────────┐
│ LITPER PEDIDOS         ─ □ × │
├───────────────────────────────┤
│ [📦 Guías] [📋 Novedad]       │
├───────────────────────────────┤
│     [Usuario ▼]    05:32     │
├───────────────────────────────┤
│ ┌───────────────────────────┐ │
│ │ 📋 Nov. Iniciales  12[+][-]│ │
│ ├───────────────────────────┤ │
│ │ ✅ Nov. Solucion.   8[+][-]│ │
│ ├───────────────────────────┤ │
│ │ 👁️ Nov. Revisadas  5[+][-]│ │
│ ├───────────────────────────┤ │
│ │ ⏳ Nov. Pendientes 3[+][-]│ │
│ ├───────────────────────────┤ │
│ │ 🔄 Dev. LITPER     2[+][-]│ │
│ ├───────────────────────────┤ │
│ │ 🔁 Dev. 3 Intentos 1[+][-]│ │
│ ├───────────────────────────┤ │
│ │ 🚚 Dev. Transport. 0[+][-]│ │
│ ├───────────────────────────┤ │
│ │ 📦 Dev. Proveedor  1[+][-]│ │
│ ├───────────────────────────┤ │
│ │ 📊 TOT Devolución  4[+][-]│ │
│ └───────────────────────────┘ │
│                               │
│     [🔄 REINICIAR BLOQUE]     │
├───────────────────────────────┤
│  Stats │ Bloques │ ⚙️        │
└───────────────────────────────┘
```

### Vista 2: BARRA LATERAL - Guías
```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ LITPER [📦 Guías][📋 Nov]  👤Juan  05:32                              ─ □ ×    │
├──────────────────────────────────────────────────────────────────────────────────┤
│ ✓45[+][-] │ ✗3[+][-] │ 📅7[+][-] │ ⚠️2[+][-] │ ⏳4[+][-] │ 👁️8[+][-] │ [🔄]   │
├──────────────────────────────────────────────────────────────────────────────────┤
│ Bloque #3 │ Total día: 127 realizados                                           │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Vista 2: BARRA LATERAL - Novedad
```
┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ LITPER [📦][📋 Novedad]  👤Juan  05:32                                                  ─ □ ×    │
├────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 📋12[+][-] │ ✅8[+][-] │ 👁️5[+][-] │ ⏳3[+][-] │ 🔄2[+][-] │ 🔁1[+][-] │ 🚚0[+][-] │ 📦1[+][-] │ 📊4 │ [🔄] │
├────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Bloque #3 │ Total devoluciones: 4                                                                  │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Vista 3: COMPACTO - Guías
```
┌─────────────────────────────────────────────────┐
│ 📦 05:32  ✓45 ✗3 📅7 ⚠️2 ⏳4 👁️8              │
│ [+✓][-✓] [+✗][-✗] [+📅][-📅] [+⚠️][-⚠️] ... [🔄]│
└─────────────────────────────────────────────────┘
```

### Vista 3: COMPACTO - Novedad
```
┌───────────────────────────────────────────────────────────┐
│ 📋 05:32  📋12 ✅8 👁️5 ⏳3 🔄2 🔁1 🚚0 📦1 📊4          │
│ [+📋][-] [+✅][-] [+👁️][-] [+⏳][-] ... [🔄]             │
└───────────────────────────────────────────────────────────┘
```

---

## 4. SISTEMA DE BLOQUES

### 4.1 Flujo de trabajo
```
[Selecciona proceso: Guías o Novedad]
        ↓
[Inicia o continúa bloque]
        ↓
[Suma/resta contadores según proceso]
        ↓
[Presiona REINICIAR]
        ↓
[Se guarda BLOQUE con todos los contadores]
        ↓
[Contadores se reinician a 0]
        ↓
[Nuevo bloque comienza]
```

### 4.2 Al crear bloque se guarda:
- Tipo de proceso usado
- Todos los contadores del proceso
- Tiempo total
- Total de operaciones
- Promedio por minuto

### 4.3 Botón "Nuevo Día"
- Archiva todos los bloques
- Reinicia contadores de ambos procesos
- Guarda resumen del día

---

## 5. EXPORTACIÓN A EXCEL

### 5.1 Excel para Generación de Guías
**Hoja: Resumen Día**
| Fecha | Bloques | Realizado | Cancelados | Agendados | Difíciles | Pendiente | Revisado |
|-------|---------|-----------|------------|-----------|-----------|-----------|----------|
| 2025-12-31 | 5 | 127 | 8 | 15 | 6 | 12 | 45 |

**Hoja: Detalle Bloques**
| Bloque | Hora | Realizado | Cancelados | Agendados | Difíciles | Pendiente | Revisado | Prom/min |
|--------|------|-----------|------------|-----------|-----------|-----------|----------|----------|
| 1 | 08:00-08:25 | 32 | 2 | 3 | 1 | 2 | 8 | 1.28 |

### 5.2 Excel para Novedad
**Hoja: Resumen Día**
| Fecha | Bloques | Iniciales | Solucionadas | Revisadas | Pendientes | Dev.LITPER | Dev.3Int | Dev.Transp | Dev.Prov | TOT Dev |
|-------|---------|-----------|--------------|-----------|------------|------------|----------|------------|----------|---------|
| 2025-12-31 | 3 | 45 | 38 | 42 | 7 | 5 | 3 | 2 | 4 | 14 |

**Hoja: Detalle Bloques**
| Bloque | Hora | Iniciales | Solucionadas | Revisadas | Pendientes | DevLITPER | Dev3Int | DevTransp | DevProv | TOTDev |
|--------|------|-----------|--------------|-----------|------------|-----------|---------|-----------|---------|--------|
| 1 | 08:00 | 15 | 12 | 14 | 3 | 2 | 1 | 0 | 1 | 4 |

### 5.3 Opciones de descarga
- Exportar bloque individual
- Exportar día (Guías, Novedad, o ambos)
- Exportar historial completo

---

## 6. ANIMACIONES

### 6.1 Animaciones de contadores
```css
/* Incremento - rebote verde */
@keyframes bump-up {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); color: #10B981; }
  100% { transform: scale(1); }
}

/* Decremento - rebote rojo */
@keyframes bump-down {
  0% { transform: scale(1); }
  50% { transform: scale(0.8); color: #EF4444; }
  100% { transform: scale(1); }
}

/* Glow en hover */
@keyframes glow {
  0%, 100% { box-shadow: 0 0 5px currentColor; }
  50% { box-shadow: 0 0 20px currentColor; }
}
```

### 6.2 Animaciones de UI
- Slide-in al crear bloque
- Fade entre procesos
- Transición suave entre vistas
- Pulse en timer activo
- Confetti al cumplir meta

---

## 7. ARQUITECTURA DE ARCHIVOS

```
src/
├── components/
│   ├── ProcessSelector.tsx    ← NUEVO: Selector Guías/Novedad
│   ├── QuickCounters.tsx      ← NUEVO: Contadores dinámicos
│   ├── CounterButton.tsx      ← NUEVO: Botón +/- individual
│   ├── BlockCard.tsx          ← NUEVO: Tarjeta de bloque
│   ├── BlocksPanel.tsx        ← NUEVO: Lista de bloques
│   ├── ExportMenu.tsx         ← NUEVO: Menú de exportación
│   ├── ViewSwitcher.tsx       ← NUEVO: Cambio de vista
│   ├── NewDayButton.tsx       ← NUEVO: Botón nuevo día
│   ├── layouts/
│   │   ├── WidgetLayout.tsx   ← NUEVO: Vista widget
│   │   ├── SidebarLayout.tsx  ← NUEVO: Vista barra lateral
│   │   └── CompactLayout.tsx  ← NUEVO: Vista compacta
│   └── ... (existentes)
├── stores/
│   └── appStore.ts            ← MODIFICAR: 2 procesos, bloques
├── config/
│   └── processConfig.ts       ← NUEVO: Config de campos por proceso
├── utils/
│   └── excelExport.ts         ← NUEVO: Generador Excel
├── hooks/
│   └── useCounterAnimation.ts ← NUEVO: Hook animaciones
└── styles/
    └── animations.css         ← NUEVO: CSS animaciones
```

---

## 8. CONFIGURACIÓN DE PROCESOS

```typescript
// config/processConfig.ts

export const PROCESO_GUIAS = {
  id: 'guias',
  nombre: 'Generación de Guías',
  icono: '📦',
  campos: [
    { id: 'realizado', label: 'Realizado', icono: '✓', color: '#10B981' },
    { id: 'cancelados', label: 'Cancelados', icono: '✗', color: '#EF4444' },
    { id: 'agendados', label: 'Agendados', icono: '📅', color: '#3B82F6' },
    { id: 'dificiles', label: 'Difíciles', icono: '⚠️', color: '#F97316' },
    { id: 'pedidoPendiente', label: 'Pedido Pendiente', icono: '⏳', color: '#F59E0B' },
    { id: 'revisado', label: 'Revisado', icono: '👁️', color: '#8B5CF6' },
  ],
};

export const PROCESO_NOVEDAD = {
  id: 'novedad',
  nombre: 'Novedad',
  icono: '📋',
  campos: [
    { id: 'novedadesIniciales', label: 'Novedades iniciales', icono: '📋', color: '#3B82F6' },
    { id: 'novedadesSolucionadas', label: 'Novedades solucionadas', icono: '✅', color: '#10B981' },
    { id: 'novedadesRevisadas', label: 'Novedades revisadas', icono: '👁️', color: '#8B5CF6' },
    { id: 'novedadesFinalePendientes', label: 'Novedades finales pendientes', icono: '⏳', color: '#F59E0B' },
    { id: 'devolucionLitper', label: 'Devolución x LITPER', icono: '🔄', color: '#F97316' },
    { id: 'devolucion3Intentos', label: 'Devolución 3 intentos', icono: '🔁', color: '#EF4444' },
    { id: 'devolucionErrorTransportadora', label: 'Devolución error transportadora', icono: '🚚', color: '#6B7280' },
    { id: 'devolucionProveedor', label: 'Devolución x proveedor', icono: '📦', color: '#06B6D4' },
    { id: 'totDevoluciones', label: 'TOT Devoluciones', icono: '📊', color: '#EC4899' },
  ],
};
```

---

## 9. STORE ACTUALIZADO

```typescript
interface AppState {
  // Proceso activo
  procesoActivo: TipoProceso;  // 'guias' | 'novedad'

  // Contadores actuales (del bloque en curso)
  contadoresGuias: ContadoresGuias;
  contadoresNovedad: ContadoresNovedad;

  // Bloques guardados
  bloques: Bloque[];
  numeroBloqueHoy: number;

  // Días
  dias: Dia[];
  diaActual: string;

  // Layout
  viewLayout: ViewLayout;  // 'widget' | 'sidebar' | 'compact'

  // Timer
  timerActivo: boolean;
  tiempoTranscurrido: number;

  // Acciones
  setProcesoActivo: (proceso: TipoProceso) => void;
  incrementarContador: (campo: string, cantidad?: number) => void;
  decrementarContador: (campo: string, cantidad?: number) => void;
  finalizarBloque: () => Bloque;
  iniciarNuevoDia: () => void;
  setViewLayout: (layout: ViewLayout) => void;
}
```

---

## 10. PLAN DE IMPLEMENTACIÓN

### Fase 1: Core (Tipos y Store)
1. [ ] Crear tipos para ambos procesos
2. [ ] Crear config/processConfig.ts
3. [ ] Actualizar appStore.ts con 2 procesos
4. [ ] Implementar lógica de bloques
5. [ ] Implementar lógica de nuevo día

### Fase 2: Componentes Contadores
6. [ ] Crear CounterButton.tsx (botón +/- animado)
7. [ ] Crear QuickCounters.tsx (renderiza campos dinámicos)
8. [ ] Crear ProcessSelector.tsx (tabs Guías/Novedad)

### Fase 3: Componentes Bloques
9. [ ] Crear BlockCard.tsx
10. [ ] Crear BlocksPanel.tsx
11. [ ] Crear NewDayButton.tsx

### Fase 4: Layouts
12. [ ] Crear WidgetLayout.tsx
13. [ ] Crear SidebarLayout.tsx
14. [ ] Crear CompactLayout.tsx
15. [ ] Crear ViewSwitcher.tsx

### Fase 5: Exportación Excel
16. [ ] Instalar xlsx y file-saver
17. [ ] Crear excelExport.ts
18. [ ] Crear ExportMenu.tsx

### Fase 6: Animaciones
19. [ ] Crear animations.css
20. [ ] Implementar animaciones en contadores
21. [ ] Transiciones entre vistas

### Fase 7: Electron
22. [ ] Actualizar main.js para resize dinámico
23. [ ] Shortcuts de teclado
24. [ ] Menú de tray actualizado

---

## 11. RESUMEN VISUAL

```
┌─────────────────────────────────────────────────────────────────┐
│                    LITPER PEDIDOS v2.0                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   2 PROCESOS                 3 VISTAS                           │
│   ┌─────────────────┐        ┌───────────────┐                  │
│   │ 📦 Guías (6)    │        │ Widget        │                  │
│   │ 📋 Novedad (9)  │        │ Sidebar       │                  │
│   └─────────────────┘        │ Compacto      │                  │
│                              └───────────────┘                  │
│                                                                 │
│   GUÍAS                      NOVEDAD                            │
│   ├─ Realizado               ├─ Novedades iniciales             │
│   ├─ Cancelados              ├─ Novedades solucionadas          │
│   ├─ Agendados               ├─ Novedades revisadas             │
│   ├─ Difíciles               ├─ Novedades finales pend.         │
│   ├─ Pedido Pendiente        ├─ Devolución x LITPER             │
│   └─ Revisado                ├─ Devolución 3 intentos           │
│                              ├─ Devolución error transp.        │
│                              ├─ Devolución x proveedor          │
│                              └─ TOT Devoluciones                │
│                                                                 │
│   BLOQUES          EXCEL           NUEVO DÍA                    │
│   ┌────────┐       ┌────────┐      ┌────────┐                   │
│   │ Auto   │       │ .xlsx  │      │ Reset  │                   │
│   │ Stats  │       │ x proc │      │ Todo   │                   │
│   └────────┘       └────────┘      └────────┘                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

*Plan actualizado: 2025-12-31*
*Versión objetivo: LITPER PEDIDOS v2.0*
