# Plan: App de Escritorio con Ventana Flotante

## Objetivo
Crear una aplicación descargable que funcione como ventana flotante "siempre encima" (always on top) en Windows/Mac/Linux.

---

## Tecnología Recomendada: Electron

### ¿Por qué Electron?
- Usa React (tu código actual sirve)
- Soporte nativo para "always on top"
- Funciona en Windows, Mac y Linux
- Genera instaladores (.exe, .dmg, .deb)
- Empresas grandes lo usan: Discord, Slack, VS Code

---

## Estructura del Proyecto

```
litper-floating-app/
├── package.json
├── electron/
│   ├── main.js              # Proceso principal (ventana)
│   ├── preload.js           # Puente seguro
│   └── tray.js              # Icono en bandeja del sistema
├── src/
│   ├── App.tsx              # Tu app React
│   ├── components/
│   │   ├── FloatingTimer.tsx
│   │   ├── FloatingNotes.tsx
│   │   └── QuickActions.tsx
│   └── stores/
│       └── appStore.ts
├── assets/
│   └── icon.png             # Icono de la app
└── build/                   # Aquí salen los instaladores
```

---

## Fases de Implementación

### FASE 1: Configuración Base
**Archivos a crear:**

1. `package.json` - Dependencias de Electron
2. `electron/main.js` - Ventana principal con always-on-top
3. `electron/preload.js` - Comunicación segura

**Funcionalidades:**
- Ventana sin bordes (frameless)
- Siempre encima de otras ventanas
- Redimensionable y arrastrable
- Minimizar a bandeja del sistema

---

### FASE 2: Interfaz Flotante
**Componentes:**

1. **MiniTimer** - Cronómetro compacto
   - Muestra tiempo restante
   - Colores de alerta
   - Botones play/pause/reset
   - Click para expandir

2. **MiniNotes** - Notas rápidas
   - Lista de notas compacta
   - Agregar nota rápida
   - Expandir para ver todas

3. **QuickStats** - Estadísticas del día
   - Guías realizadas
   - Progreso hacia meta
   - Racha actual

---

### FASE 3: Bandeja del Sistema (System Tray)
**Funcionalidades:**

- Icono en la bandeja (junto al reloj)
- Click derecho: menú contextual
  - Mostrar/Ocultar ventana
  - Iniciar/Pausar timer
  - Nueva nota rápida
  - Salir

---

### FASE 4: Sincronización
**Opciones:**

1. **Local** - Guardar en archivo JSON local
2. **Con la web** - Sincronizar con tu app React existente vía localStorage compartido o API

---

### FASE 5: Empaquetado
**Generar instaladores:**

- Windows: `.exe` (installer) y `.msi`
- Mac: `.dmg`
- Linux: `.AppImage`, `.deb`

---

## Código Clave

### Ventana Always-On-Top (electron/main.js)
```javascript
const { app, BrowserWindow, Tray, Menu } = require('electron');

let mainWindow;
let tray;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 300,
    height: 400,

    // SIEMPRE ENCIMA
    alwaysOnTop: true,

    // SIN BORDES (estilo flotante)
    frame: false,
    transparent: true,

    // POSICIÓN (esquina inferior derecha)
    x: screen.width - 320,
    y: screen.height - 450,

    // OPCIONES ADICIONALES
    skipTaskbar: true,        // No mostrar en barra de tareas
    resizable: true,
    movable: true,

    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    }
  });

  mainWindow.loadURL('http://localhost:5173'); // O el build
}

// Icono en bandeja del sistema
function createTray() {
  tray = new Tray('assets/icon.png');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Mostrar', click: () => mainWindow.show() },
    { label: 'Ocultar', click: () => mainWindow.hide() },
    { type: 'separator' },
    { label: 'Siempre encima', type: 'checkbox', checked: true,
      click: (item) => mainWindow.setAlwaysOnTop(item.checked) },
    { type: 'separator' },
    { label: 'Salir', click: () => app.quit() }
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('click', () => mainWindow.show());
}

app.whenReady().then(() => {
  createWindow();
  createTray();
});
```

### Ventana Arrastrable (CSS)
```css
/* Toda la ventana es arrastrable */
.app-container {
  -webkit-app-region: drag;
}

/* Excepto botones y controles */
button, input, .no-drag {
  -webkit-app-region: no-drag;
}
```

### Componente MiniTimer (React)
```tsx
const MiniTimer = () => {
  const { tiempoRestante, estadoCronometro } = useProcesosStore();
  const [expanded, setExpanded] = useState(false);

  const formatTime = (s: number) =>
    `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  if (!expanded) {
    return (
      <div className="mini-timer" onClick={() => setExpanded(true)}>
        <span className="time">{formatTime(tiempoRestante)}</span>
        <div className="controls">
          <button>▶️</button>
        </div>
      </div>
    );
  }

  return <CountdownTimer onCollapse={() => setExpanded(false)} />;
};
```

---

## Comandos para Desarrollo

```bash
# Instalar dependencias
npm install electron electron-builder --save-dev

# Desarrollo (ventana + React)
npm run electron:dev

# Construir instaladores
npm run electron:build
```

---

## Configuración electron-builder (package.json)
```json
{
  "build": {
    "appId": "com.litper.floating",
    "productName": "Litper Flotante",
    "directories": {
      "output": "build"
    },
    "win": {
      "target": ["nsis", "portable"],
      "icon": "assets/icon.ico"
    },
    "mac": {
      "target": ["dmg"],
      "icon": "assets/icon.icns"
    },
    "linux": {
      "target": ["AppImage", "deb"]
    }
  }
}
```

---

## Tiempo Estimado por Fase

| Fase | Descripción | Complejidad |
|------|-------------|-------------|
| 1 | Configuración Electron | Media |
| 2 | Interfaz compacta | Media |
| 3 | Bandeja del sistema | Baja |
| 4 | Sincronización | Media-Alta |
| 5 | Empaquetado | Baja |

---

## Resultado Final

Una app que:
1. Se instala con doble click (.exe)
2. Aparece como ventana flotante siempre visible
3. Tiene icono en la bandeja del sistema
4. Muestra timer, notas y estadísticas
5. Sincroniza con tu app web principal

---

## Alternativa Más Simple: AutoHotkey (Solo Windows)

Si solo necesitas Windows y algo rápido:

```ahk
; Hacer ventana siempre encima con Win+T
#t::
WinSet, AlwaysOnTop, Toggle, A
return
```

Pero esto solo funciona con ventanas existentes, no crea una app nueva.

---

## ¿Quieres que lo implemente?

Dime "hazlo" y creo toda la estructura de Electron integrada con tu código de Procesos 2.0.
