/**
 * 🎮 LITPER PROCESOS - Electron Main Process
 * App de escritorio que puede estar siempre visible
 */
const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, nativeImage } = require('electron');
const path = require('path');

// ===== CONFIGURACIÓN =====
const isDev = process.env.NODE_ENV === 'development';
const VITE_DEV_URL = 'http://localhost:5173';

let mainWindow = null;
let tray = null;
let isQuitting = false;

// ===== CREAR VENTANA PRINCIPAL =====
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    minWidth: 300,
    minHeight: 400,
    frame: false, // Sin barra de título nativa
    transparent: true,
    alwaysOnTop: true, // Siempre visible
    skipTaskbar: false,
    resizable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Cargar la app
  if (isDev) {
    mainWindow.loadURL(VITE_DEV_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Minimizar a tray en lugar de cerrar
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ===== CREAR TRAY (Icono en bandeja) =====
function createTray() {
  // Crear icono (usa un placeholder, reemplazar con tu logo)
  const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');

  // Crear icono simple si no existe
  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
  } catch {
    // Crear un icono básico de 16x16
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon.isEmpty() ? createDefaultIcon() : trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '🎮 Abrir LITPER',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    {
      label: '📌 Siempre visible',
      type: 'checkbox',
      checked: true,
      click: (menuItem) => {
        mainWindow?.setAlwaysOnTop(menuItem.checked);
      },
    },
    { type: 'separator' },
    {
      label: '⏱️ Iniciar Ronda',
      click: () => {
        mainWindow?.webContents.send('shortcut', 'start-timer');
      },
    },
    {
      label: '⏸️ Pausar',
      click: () => {
        mainWindow?.webContents.send('shortcut', 'pause-timer');
      },
    },
    {
      label: '💾 Guardar Ronda',
      click: () => {
        mainWindow?.webContents.send('shortcut', 'save-round');
      },
    },
    { type: 'separator' },
    {
      label: '❌ Salir',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip('LITPER Procesos');
  tray.setContextMenu(contextMenu);

  // Click en tray muestra/oculta ventana
  tray.on('click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
      mainWindow?.focus();
    }
  });
}

// Crear icono por defecto
function createDefaultIcon() {
  // Crear un icono simple 16x16 en memoria
  const size = 16;
  const canvas = Buffer.alloc(size * size * 4);

  // Llenar con color cyan
  for (let i = 0; i < size * size; i++) {
    canvas[i * 4] = 6;      // R
    canvas[i * 4 + 1] = 182; // G
    canvas[i * 4 + 2] = 212; // B
    canvas[i * 4 + 3] = 255; // A
  }

  return nativeImage.createFromBuffer(canvas, { width: size, height: size });
}

// ===== REGISTRAR ATAJOS GLOBALES =====
function registerShortcuts() {
  // Ctrl+Shift+L = Mostrar/Ocultar
  globalShortcut.register('CommandOrControl+Shift+L', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
      mainWindow?.focus();
    }
  });

  // Ctrl+Shift+S = Iniciar/Pausar timer
  globalShortcut.register('CommandOrControl+Shift+S', () => {
    mainWindow?.webContents.send('shortcut', 'toggle-timer');
  });

  // Ctrl+Shift+R = Guardar ronda
  globalShortcut.register('CommandOrControl+Shift+R', () => {
    mainWindow?.webContents.send('shortcut', 'save-round');
  });
}

// ===== IPC HANDLERS =====
function setupIPC() {
  // Controles de ventana
  ipcMain.on('window-minimize', () => mainWindow?.minimize());
  ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on('window-close', () => mainWindow?.hide());
  ipcMain.on('window-pin', (_, pinned) => mainWindow?.setAlwaysOnTop(pinned));

  // Obtener estado
  ipcMain.handle('get-window-state', () => ({
    isMaximized: mainWindow?.isMaximized(),
    isAlwaysOnTop: mainWindow?.isAlwaysOnTop(),
  }));
}

// ===== APP LIFECYCLE =====
app.whenReady().then(() => {
  createWindow();
  createTray();
  registerShortcuts();
  setupIPC();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// Single instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}
