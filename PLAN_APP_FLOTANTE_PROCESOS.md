# Plan: App Flotante de Procesos - "LITPER Tracker"

## Concepto
App de escritorio flotante (siempre visible) para registro rápido de trabajo.
Como una calculadora o notas adhesivas que siempre está encima de todo.

---

## Características Principales

### 1. Ventana Flotante
- **Siempre encima** de todas las aplicaciones
- **Arrastrable** a cualquier posición de la pantalla
- **Minimizable** a un pequeño icono/botón
- **Redimensionable** (compacto o expandido)
- **Transparencia ajustable** para no estorbar
- **Posición recordada** al cerrar y abrir

### 2. Interfaz Ultra-Eficiente
```
┌─────────────────────────────────────┐
│ ⏱️ 24:35  [▶️] [⏸️] [🔄]    [_][X] │
├─────────────────────────────────────┤
│  Ronda #3                           │
├─────────────────────────────────────┤
│  Iniciales    [-] 25 [+]            │
│  ✅ Realizado [-] 18 [+]            │
│  ❌ Cancelado [-]  3 [+]            │
│  📅 Agendado  [-]  2 [+]            │
│  ⚠️ Difíciles [-]  1 [+]            │
│  ⏳ Pendientes[-]  1 [+]            │
│  👁️ Revisado  [-]  0 [+]            │
├─────────────────────────────────────┤
│  [    💾 GUARDAR RONDA    ]         │
└─────────────────────────────────────┘
```

### 3. Controles Rápidos
| Acción | Método |
|--------|--------|
| Sumar +1 | Click en [+] |
| Sumar +5 | Click derecho en [+] |
| Restar -1 | Click en [-] |
| Restar -5 | Click derecho en [-] |
| Valor directo | Click en número → escribir |
| Atajos teclado | R=Realizado, C=Cancelado, etc. |

### 4. Modos de Vista

#### Modo Compacto (Mini)
```
┌──────────────────┐
│ ⏱️ 24:35  ✅ 18 │
│ [+1] [+5] [💾]  │
└──────────────────┘
```
- Solo muestra timer y "Realizado"
- Botones rápidos para sumar
- Expandir con doble click

#### Modo Normal
- Todos los campos visibles
- Controles +/- para cada uno

#### Modo Expandido
- Incluye notas
- Historial del día
- Gráfico de progreso

### 5. Funciones Adicionales

#### Atajos de Teclado Globales
- `Ctrl+Shift+P` → Mostrar/ocultar app
- `Ctrl+Shift+S` → Guardar ronda rápido
- `Ctrl+Shift+R` → Resetear timer
- `1-7` → Incrementar campo (cuando está enfocado)

#### Notificaciones
- Alerta cuando timer termina (sonido + popup)
- Recordatorio si no hay actividad en X minutos
- Celebración al cumplir meta diaria

#### Sincronización
- Guarda datos localmente
- Sincroniza con la app web principal
- Funciona offline

---

## Arquitectura Técnica

### Stack
```
├── Electron (app de escritorio)
├── React + TypeScript (UI)
├── Zustand (estado)
├── Tailwind CSS (estilos)
└── electron-store (persistencia local)
```

### Estructura de Archivos
```
litper-tracker/
├── electron/
│   ├── main.ts           # Proceso principal
│   ├── preload.ts        # Bridge seguro
│   └── tray.ts           # Icono en bandeja del sistema
├── src/
│   ├── App.tsx           # Componente principal
│   ├── components/
│   │   ├── FloatingTimer.tsx
│   │   ├── QuickCounter.tsx
│   │   ├── MiniMode.tsx
│   │   └── ExpandedMode.tsx
│   ├── stores/
│   │   └── trackerStore.ts
│   └── styles/
│       └── globals.css
├── package.json
└── electron-builder.json
```

### Características Electron
```typescript
// Ventana flotante siempre encima
const win = new BrowserWindow({
  width: 320,
  height: 400,
  alwaysOnTop: true,        // Siempre visible
  frame: false,              // Sin barra de título
  transparent: true,         // Fondo transparente
  resizable: true,
  skipTaskbar: false,        // Mostrar en taskbar
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    preload: path.join(__dirname, 'preload.js')
  }
});

// Posición recordada
win.on('moved', () => {
  store.set('windowPosition', win.getPosition());
});
```

---

## Flujo de Usuario

### 1. Inicio de Jornada
1. Abrir app (doble click o atajo)
2. Seleccionar usuario (si hay varios)
3. App se posiciona donde la dejaste

### 2. Durante el Trabajo
1. Iniciar timer (click o atajo)
2. Mientras trabajas, hacer click en [+] para sumar
3. Timer visible siempre encima
4. Cuando termina → popup para confirmar datos
5. Guardar → siguiente ronda automática

### 3. Registro Rápido (Sin Timer)
1. Click en cualquier [+] suma inmediatamente
2. Guardar cuando quieras
3. Ideal para trabajo continuo sin pausas

---

## Diseño de Interfaz

### Paleta de Colores
```css
--bg-dark: #1e1e2e;      /* Fondo principal */
--bg-card: #2a2a3e;      /* Tarjetas */
--accent: #f59e0b;       /* Ámbar - acciones */
--success: #10b981;      /* Verde - realizado */
--danger: #ef4444;       /* Rojo - cancelado */
--info: #3b82f6;         /* Azul - agendado */
--warning: #f97316;      /* Naranja - difíciles */
--muted: #64748b;        /* Gris - secundario */
```

### Componente QuickCounter
```tsx
// Click izquierdo: +1 / -1
// Click derecho: +5 / -5
// Scroll: +1 / -1
// Click en número: editar directo

<QuickCounter
  label="Realizado"
  icon="✅"
  value={18}
  color="success"
  onChange={(val) => updateField('realizado', val)}
/>
```

### Estados del Timer
| Estado | Color | Acción |
|--------|-------|--------|
| Idle | Gris | Mostrar "00:00" |
| Running >50% | Verde | Countdown normal |
| Running 25-50% | Amarillo | Alerta media |
| Running 10-25% | Naranja | Urgencia |
| Running <10% | Rojo parpadeante | Casi termina |
| Finished | Rojo + sonido | Popup guardar |

---

## Instaladores

### Windows
- `.exe` instalador
- Portable `.exe` (sin instalar)
- Auto-inicio opcional

### macOS
- `.dmg` para instalar
- App en `/Applications`

### Linux
- `.AppImage` portable
- `.deb` para Debian/Ubuntu

---

## Fases de Desarrollo

### Fase 1: MVP (Básico funcional)
- [ ] Ventana flotante básica
- [ ] Contadores con +/-
- [ ] Timer simple
- [ ] Guardar ronda
- [ ] Persistencia local

### Fase 2: Mejoras UX
- [ ] Modo mini/compacto
- [ ] Atajos de teclado globales
- [ ] Posición recordada
- [ ] Sonidos y notificaciones
- [ ] Transparencia ajustable

### Fase 3: Integración
- [ ] Sincronización con app web
- [ ] Selección de usuario
- [ ] Historial del día
- [ ] Estadísticas básicas

### Fase 4: Polish
- [ ] Instaladores para cada OS
- [ ] Auto-actualización
- [ ] Icono en bandeja del sistema
- [ ] Temas (claro/oscuro)

---

## Mockups Detallados

### Vista Normal
```
╔═══════════════════════════════════════╗
║  ●  ●  ●     LITPER Tracker     _ □ X ║
╠═══════════════════════════════════════╣
║                                       ║
║         ⏱️  24 : 35                   ║
║                                       ║
║    [  ▶️ INICIAR  ]  [  🔄 RESET  ]   ║
║                                       ║
╠═══════════════════════════════════════╣
║  📋 Ronda #3 de hoy                   ║
╠═══════════════════════════════════════╣
║                                       ║
║  Iniciales     [ - ]   25   [ + ]     ║
║                                       ║
║  ✅ Realizado  [ - ]   18   [ + ]     ║
║                                       ║
║  ❌ Cancelado  [ - ]    3   [ + ]     ║
║                                       ║
║  📅 Agendado   [ - ]    2   [ + ]     ║
║                                       ║
║  ⚠️ Difíciles  [ - ]    1   [ + ]     ║
║                                       ║
║  ⏳ Pendientes [ - ]    1   [ + ]     ║
║                                       ║
║  👁️ Revisado   [ - ]    0   [ + ]     ║
║                                       ║
╠═══════════════════════════════════════╣
║                                       ║
║      [  💾  GUARDAR RONDA  ]          ║
║                                       ║
╠═══════════════════════════════════════╣
║  Hoy: ✅ 45/50 (90%)    █████████░    ║
╚═══════════════════════════════════════╝
```

### Vista Mini (Minimizado)
```
╔════════════════════════════╗
║ ⏱️ 24:35  ✅ 18   [+] [📋]║
╚════════════════════════════╝
```
- Click en [+] → suma 1 a Realizado
- Click en [📋] → expande a vista normal
- Arrastrable por cualquier parte

### Vista Súper Mini (Solo Timer)
```
╔════════════╗
║  ⏱️ 24:35  ║
╚════════════╝
```

---

## Resumen Ejecutivo

**LITPER Tracker** es una app flotante de escritorio para:
1. **Registrar trabajo rápidamente** con clicks
2. **Timer siempre visible** encima de todo
3. **Interfaz mínima** pero completa
4. **Funciona offline** y sincroniza después
5. **Atajos de teclado** para máxima velocidad

### Diferencia vs App Web
| App Web | LITPER Tracker |
|---------|----------------|
| Abrir navegador | Siempre visible |
| Buscar pestaña | Un click |
| Formulario largo | Botones +/- |
| Cambiar ventana | Encima de todo |

---

## ¿Empezamos?

Dime **"HAZLO"** para comenzar con la Fase 1 (MVP básico funcional).
