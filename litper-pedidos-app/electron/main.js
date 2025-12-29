const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage } = require('electron');
const path = require('path');

let mainWindow;
let tray;
let isQuitting = false;

// Configuración de la ventana
const WINDOW_CONFIG = {
  width: 420,
  height: 600,
  minWidth: 180,  // Permite modo compacto
  minHeight: 160, // Permite modo compacto
  maxWidth: 500,
  maxHeight: 700,
};

function createWindow() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    ...WINDOW_CONFIG,

    // SIEMPRE ENCIMA DE TODO
    alwaysOnTop: true,

    // SIN BORDES - ESTILO FLOTANTE
    frame: false,
    transparent: true,

    // POSICIÓN INICIAL (esquina inferior derecha)
    x: screenWidth - WINDOW_CONFIG.width - 20,
    y: screenHeight - WINDOW_CONFIG.height - 20,

    // OPCIONES DE VENTANA
    skipTaskbar: false,
    resizable: true,
    movable: true,
    minimizable: true,
    maximizable: false,
    closable: true,
    focusable: true,
    hasShadow: true,

    // CONFIGURACIÓN WEB
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true,
    },

    // ESTILO
    backgroundColor: '#00000000',
    titleBarStyle: 'hidden',
    vibrancy: 'dark',
  });

  // Cargar la app
  const isDev = process.env.NODE_ENV !== 'production' || !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Eventos de ventana
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Manejar redimensionamiento
  mainWindow.on('resize', () => {
    const [width, height] = mainWindow.getSize();
    mainWindow.webContents.send('window-resize', { width, height });
  });
}

function createTray() {
  // Crear icono para la bandeja
  const iconPath = path.join(__dirname, '../assets/icon.png');

  // Icono por defecto si no existe
  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
    if (trayIcon.isEmpty()) {
      trayIcon = nativeImage.createEmpty();
    }
  } catch (e) {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon.resize({ width: 16, height: 16 }));
  tray.setToolTip('LITPER PEDIDOS');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '📦 LITPER PEDIDOS',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: 'Mostrar ventana',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      },
    },
    {
      label: 'Ocultar ventana',
      click: () => mainWindow.hide(),
    },
    { type: 'separator' },
    {
      label: 'Siempre encima',
      type: 'checkbox',
      checked: true,
      click: (menuItem) => {
        mainWindow.setAlwaysOnTop(menuItem.checked);
        mainWindow.webContents.send('always-on-top-changed', menuItem.checked);
      },
    },
    {
      label: 'Opacidad',
      submenu: [
        { label: '100%', click: () => mainWindow.setOpacity(1.0) },
        { label: '90%', click: () => mainWindow.setOpacity(0.9) },
        { label: '80%', click: () => mainWindow.setOpacity(0.8) },
        { label: '70%', click: () => mainWindow.setOpacity(0.7) },
      ],
    },
    { type: 'separator' },
    {
      label: 'Reiniciar posición',
      click: () => {
        const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
        mainWindow.setPosition(screenWidth - WINDOW_CONFIG.width - 20, screenHeight - WINDOW_CONFIG.height - 20);
      },
    },
    { type: 'separator' },
    {
      label: 'Salir',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  // Click en el icono muestra/oculta
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// IPC Handlers
ipcMain.handle('window-minimize', () => {
  mainWindow.minimize();
});

ipcMain.handle('window-close', () => {
  mainWindow.hide();
});

ipcMain.handle('window-toggle-always-on-top', () => {
  const isOnTop = mainWindow.isAlwaysOnTop();
  mainWindow.setAlwaysOnTop(!isOnTop);
  return !isOnTop;
});

ipcMain.handle('get-always-on-top', () => {
  return mainWindow.isAlwaysOnTop();
});

ipcMain.handle('window-set-size', (event, width, height) => {
  if (mainWindow) {
    mainWindow.setSize(width, height, true);
    // Centrar la ventana después de redimensionar
    const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
    const [winWidth, winHeight] = mainWindow.getSize();
    const x = screenWidth - winWidth - 20;
    const y = screenHeight - winHeight - 20;
    mainWindow.setPosition(x, y);
  }
});

// Inicialización
app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      mainWindow.show();
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

// Prevenir múltiples instancias
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
