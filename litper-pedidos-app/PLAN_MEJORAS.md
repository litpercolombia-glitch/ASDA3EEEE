# Plan de Mejoras - LITPER PEDIDOS v2.0

## Resumen Ejecutivo

Rediseño completo de la app para hacerla más funcional con:
- 3 modos de vista (Widget, Barra Lateral, Compacto)
- Sistema de bloques con estadísticas
- Contadores siempre visibles (+/-)
- Exportación a Excel
- Animaciones fluidas

---

## 1. NUEVAS ESTRUCTURAS DE DATOS

### 1.1 Bloque (nuevo concepto)
```typescript
interface Bloque {
  id: string;
  usuarioId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  tiempoTotal: number;          // segundos

  // Contadores finales
  pedidosRealizados: number;
  pedidosCancelados: number;
  pedidosAgendados: number;

  // Estadísticas calculadas
  promedioMinuto: number;       // pedidos por minuto
  eficiencia: number;           // % realizados vs total
}
```

### 1.2 Día (para el nuevo día)
```typescript
interface Dia {
  id: string;
  fecha: string;
  bloques: string[];            // IDs de bloques
  totales: {
    realizados: number;
    cancelados: number;
    agendados: number;
  };
  horaInicio: string;
  horaFin: string;
}
```

### 1.3 Modo Vista
```typescript
type ViewLayout = 'widget' | 'sidebar' | 'compact';
```

---

## 2. LAS 3 VISTAS

### Vista 1: WIDGET (actual mejorado)
```
┌─────────────────────────┐
│  LITPER PEDIDOS    ─ □ ×│
├─────────────────────────┤
│    [Usuario ▼]          │
├─────────────────────────┤
│      ┌──────────┐       │
│      │  05:32   │       │
│      │ ●●●●○○○○ │       │
│      └──────────┘       │
│                         │
│  ┌───────────────────┐  │
│  │ ✓ Realizados  [+][-] │  │ ← SIEMPRE VISIBLE
│  │     45              │  │
│  ├───────────────────┤  │
│  │ ✗ Cancelados  [+][-] │  │
│  │     3               │  │
│  ├───────────────────┤  │
│  │ 📅 Agendados  [+][-] │  │
│  │     7               │  │
│  └───────────────────┘  │
│                         │
│  [🔄 REINICIAR BLOQUE]  │
│                         │
│  Timer | Stats | Bloques│
└─────────────────────────┘
```

### Vista 2: BARRA LATERAL (nueva)
```
┌────────────────────────────────────────┐
│ LITPER ─ □ ×                           │
├────────────────────────────────────────┤
│ 👤 Juan    05:32    ✓45  ✗3  📅7      │
│                                        │
│ [+] Realizados [-]  [+] Cancel [-]     │
│ [+] Agendados  [-]  [🔄 REINICIAR]     │
│                                        │
│ Bloque #3 | Día: 127 pedidos          │
└────────────────────────────────────────┘
```
- Orientación horizontal
- Todo visible en una línea
- Ideal para anclar arriba/abajo de pantalla

### Vista 3: COMPACTO (mini)
```
┌──────────────────┐
│ 05:32  ✓45 ✗3 📅7│
│ [+R] [+C] [+A] 🔄│
└──────────────────┘
```
- Súper minimalista
- Solo contadores y timer
- Botones de incremento rápido

---

## 3. SISTEMA DE BLOQUES

### 3.1 Flujo de trabajo
```
[Usuario inicia día]
        ↓
[Inicia Timer] → Contadores en 0
        ↓
[Usuario suma/resta pedidos durante el bloque]
        ↓
[Presiona REINICIAR]
        ↓
[Se crea BLOQUE con estadísticas]
        ↓
[Timer y contadores se reinician]
        ↓
[Nuevo bloque comienza]
```

### 3.2 Al crear bloque se calcula:
- Tiempo total usado
- Total de cada tipo de pedido
- Promedio de pedidos por minuto
- Eficiencia (realizados / total * 100)
- Hora de inicio y fin

### 3.3 Botón "Nuevo Día"
- Archiva todos los bloques del día actual
- Reinicia contador de bloques a 1
- Limpia estadísticas del día
- Guarda resumen del día anterior

---

## 4. CONTADORES SIEMPRE VISIBLES

### 4.1 Componente QuickCounters
```tsx
<QuickCounters>
  ┌─────────────────────────────┐
  │ ✓ Realizados          45   │
  │ [−]              [+]       │
  ├─────────────────────────────┤
  │ ✗ Cancelados           3   │
  │ [−]              [+]       │
  ├─────────────────────────────┤
  │ 📅 Agendados           7   │
  │ [−]              [+]       │
  └─────────────────────────────┘
</QuickCounters>
```

### 4.2 Interacciones
- Click en [+]: Incrementa +1 con animación
- Click en [-]: Decrementa -1 (mínimo 0)
- Long press [+]: Incrementa +5
- Long press [-]: Decrementa -5
- Animación de número al cambiar (rebote)

---

## 5. EXPORTACIÓN A EXCEL

### 5.1 Opciones de exportación
1. **Exportar bloque individual** - Un bloque específico
2. **Exportar todos los bloques del día** - Día completo
3. **Exportar historial completo** - Todos los días

### 5.2 Formato del Excel

**Hoja 1: Resumen**
| Fecha | Bloques | Realizados | Cancelados | Agendados | Eficiencia |
|-------|---------|------------|------------|-----------|------------|
| 2025-12-31 | 5 | 127 | 8 | 15 | 84.7% |

**Hoja 2: Detalle por Bloque**
| Bloque | Hora Inicio | Hora Fin | Duración | Realizados | Cancelados | Agendados | Prom/min |
|--------|-------------|----------|----------|------------|------------|-----------|----------|
| 1 | 08:00 | 08:25 | 25min | 32 | 2 | 3 | 1.28 |
| 2 | 08:30 | 08:55 | 25min | 28 | 1 | 4 | 1.12 |

### 5.3 Implementación
- Usar librería `xlsx` para generar Excel
- Botón de descarga en panel de Stats
- Menú dropdown con opciones de exportación

---

## 6. ANIMACIONES

### 6.1 Animaciones de contadores
```css
/* Incremento */
@keyframes bump-up {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); color: #10B981; }
  100% { transform: scale(1); }
}

/* Decremento */
@keyframes bump-down {
  0% { transform: scale(1); }
  50% { transform: scale(0.8); color: #EF4444; }
  100% { transform: scale(1); }
}
```

### 6.2 Animaciones de bloques
- Slide-in al crear nuevo bloque
- Fade-out al archivar día
- Confetti al cumplir meta diaria

### 6.3 Animaciones de transición
- Morph entre vistas (widget ↔ sidebar ↔ compact)
- Timer pulsante cuando está activo
- Glow en botones al hover

---

## 7. ARQUITECTURA DE ARCHIVOS

### 7.1 Nuevos archivos a crear
```
src/
├── components/
│   ├── QuickCounters.tsx      ← NUEVO: Contadores +/-
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
│   └── appStore.ts            ← MODIFICAR: Agregar bloques
├── utils/
│   └── excelExport.ts         ← NUEVO: Generador de Excel
├── hooks/
│   └── useCounterAnimation.ts ← NUEVO: Hook para animaciones
└── styles/
    └── animations.css         ← NUEVO: Animaciones CSS
```

### 7.2 Dependencias nuevas
```json
{
  "dependencies": {
    "xlsx": "^0.18.5",           // Exportación Excel
    "file-saver": "^2.0.5",      // Descarga de archivos
    "framer-motion": "^11.0.0"   // Animaciones avanzadas
  }
}
```

---

## 8. MODIFICACIONES AL STORE

### 8.1 Nuevo estado
```typescript
interface AppState {
  // ... existente ...

  // NUEVO: Bloques
  bloques: Bloque[];
  bloqueActual: {
    iniciadoEn: string | null;
    realizados: number;
    cancelados: number;
    agendados: number;
  };
  numeroBloqueHoy: number;

  // NUEVO: Días
  dias: Dia[];
  diaActual: string;  // fecha YYYY-MM-DD

  // NUEVO: Layout
  viewLayout: ViewLayout;

  // NUEVO: Acciones
  incrementarContador: (tipo: 'realizados' | 'cancelados' | 'agendados', cantidad?: number) => void;
  decrementarContador: (tipo: 'realizados' | 'cancelados' | 'agendados', cantidad?: number) => void;
  finalizarBloque: () => Bloque;
  iniciarNuevoDia: () => void;
  exportarBloque: (bloqueId: string) => void;
  exportarDia: (fecha: string) => void;
  exportarTodo: () => void;
  setViewLayout: (layout: ViewLayout) => void;
}
```

---

## 9. FLUJO DE LA INTERFAZ

### 9.1 Panel principal (cualquier vista)
```
┌─────────────────────────────────────────┐
│                                         │
│         [CONTADORES SIEMPRE]            │
│    ✓ Realizados: 45  [+] [-]           │
│    ✗ Cancelados:  3  [+] [-]           │
│    📅 Agendados:  7  [+] [-]           │
│                                         │
│         [TIMER OPCIONAL]                │
│           05:32                         │
│                                         │
│    [🔄 REINICIAR = GUARDAR BLOQUE]     │
│                                         │
├─────────────────────────────────────────┤
│  Timer │ Stats │ Bloques │ ⚙️          │
└─────────────────────────────────────────┘
```

### 9.2 Panel de Bloques (nueva pestaña)
```
┌─────────────────────────────────────────┐
│ 📦 Bloques del día         [📥 Excel]  │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Bloque #3          08:45 - 09:10   │ │
│ │ ✓ 32  ✗ 2  📅 4   │ 1.28/min      │ │
│ │                    [📥]            │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ Bloque #2          08:15 - 08:40   │ │
│ │ ✓ 28  ✗ 1  📅 3   │ 1.12/min      │ │
│ │                    [📥]            │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ Bloque #1          08:00 - 08:15   │ │
│ │ ✓ 15  ✗ 0  📅 2   │ 1.00/min      │ │
│ │                    [📥]            │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│  [🌅 INICIAR NUEVO DÍA]                │
└─────────────────────────────────────────┘
```

---

## 10. PLAN DE IMPLEMENTACIÓN

### Fase 1: Infraestructura (Core)
1. [ ] Agregar nuevos tipos al store (Bloque, Dia, ViewLayout)
2. [ ] Implementar acciones de contadores (+/-)
3. [ ] Implementar lógica de bloques (crear, finalizar)
4. [ ] Implementar lógica de nuevo día

### Fase 2: Componentes Base
5. [ ] Crear QuickCounters.tsx con animaciones
6. [ ] Crear BlockCard.tsx
7. [ ] Crear BlocksPanel.tsx
8. [ ] Crear NewDayButton.tsx

### Fase 3: Layouts
9. [ ] Crear WidgetLayout.tsx (mejora del actual)
10. [ ] Crear SidebarLayout.tsx
11. [ ] Crear CompactLayout.tsx
12. [ ] Crear ViewSwitcher.tsx

### Fase 4: Exportación
13. [ ] Instalar dependencias (xlsx, file-saver)
14. [ ] Crear excelExport.ts
15. [ ] Crear ExportMenu.tsx
16. [ ] Integrar botones de descarga

### Fase 5: Animaciones y Polish
17. [ ] Agregar animaciones CSS
18. [ ] Implementar framer-motion en contadores
19. [ ] Animación de confetti al cumplir meta
20. [ ] Transiciones entre vistas

### Fase 6: Electron
21. [ ] Modificar main.js para soportar resize dinámico
22. [ ] Agregar shortcuts para cambio de vista
23. [ ] Actualizar menú de tray

---

## 11. RESUMEN VISUAL FINAL

```
┌─────────────────────────────────────────────────────────────┐
│                    LITPER PEDIDOS v2.0                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   3 VISTAS           CONTADORES         BLOQUES            │
│   ┌────────┐         ┌─────────┐        ┌─────────┐        │
│   │ Widget │         │ +/- 24/7│        │ Auto    │        │
│   │ Sidebar│         │ Siempre │        │ Stats   │        │
│   │ Compact│         │ Visibles│        │ + Excel │        │
│   └────────┘         └─────────┘        └─────────┘        │
│                                                             │
│   NUEVO DÍA          ANIMACIONES        EXPORTAR           │
│   ┌─────────┐        ┌─────────┐        ┌─────────┐        │
│   │ Reset   │        │ Fluidas │        │ .xlsx   │        │
│   │ Todo    │        │ Feedback│        │ Bloques │        │
│   │ 0 rondas│        │ Visual  │        │ o Todo  │        │
│   └─────────┘        └─────────┘        └─────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 12. PREGUNTAS PARA CONFIRMAR

1. **Timer opcional**: ¿El timer sigue siendo necesario o los contadores son suficientes?
2. **Duración de bloques**: ¿Tiempo fijo (25min) o hasta que el usuario presione reiniciar?
3. **Usuarios múltiples**: ¿Cada usuario tiene sus propios bloques independientes?
4. **Historial**: ¿Cuántos días de historial guardar? (7, 30, ilimitado)
5. **Formato Excel**: ¿Alguna columna adicional que necesites?

---

*Plan creado: 2025-12-31*
*Versión objetivo: LITPER PEDIDOS v2.0*
