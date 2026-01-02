const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage, globalShortcut } = require('electron');
const path = require('path');

let mainWindow;
let tray;
let isQuitting = false;
let currentLayout = 'widget'; // 'widget' | 'sidebar' | 'compact'

// Configuración de ventanas por layout
const LAYOUTS = {
  widget: {
    width: 380,
    height: 700,
    minWidth: 320,
    minHeight: 500,
    maxWidth: 450,
    maxHeight: 800,
  },
  sidebar: {
    width: 900,
    height: 140,
    minWidth: 700,
    minHeight: 100,
    maxWidth: 1200,
    maxHeight: 160,
  },
  compact: {
    width: 500,
    height: 80,
    minWidth: 400,
    minHeight: 60,
    maxWidth: 700,
    maxHeight: 100,
  },
};

function createWindow() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  const config = LAYOUTS[currentLayout];

  mainWindow = new BrowserWindow({
    ...config,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    x: currentLayout === 'sidebar'
      ? Math.floor((screenWidth - config.width) / 2)
      : screenWidth - config.width - 20,
    y: currentLayout === 'sidebar'
      ? 10
      : screenHeight - config.height - 20,
    skipTaskbar: false,
    resizable: true,
    movable: true,
    minimizable: true,
    maximizable: false,
    closable: true,
    focusable: true,
    hasShadow: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true,
    },
    backgroundColor: '#00000000',
    titleBarStyle: 'hidden',
    vibrancy: 'dark',
  });

  const isDev = process.env.NODE_ENV !== 'production' || !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('resize', () => {
    const [width, height] = mainWindow.getSize();
    mainWindow.webContents.send('window-resize', { width, height });
  });
}

function createTray() {
  const iconPath = path.join(__dirname, '../assets/icon.png');
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
  tray.setToolTip('LITPER PEDIDOS v2.0');

  updateTrayMenu();

  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function updateTrayMenu() {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '📦 LITPER PEDIDOS v2.0',
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
      label: 'Vista',
      submenu: [
        {
          label: '📊 Sidebar (horizontal)',
          type: 'radio',
          checked: currentLayout === 'sidebar',
          click: () => changeLayout('sidebar'),
        },
        {
          label: '📦 Widget (vertical)',
          type: 'radio',
          checked: currentLayout === 'widget',
          click: () => changeLayout('widget'),
        },
        {
          label: '📏 Compacto (mini)',
          type: 'radio',
          checked: currentLayout === 'compact',
          click: () => changeLayout('compact'),
        },
      ],
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
      click: () => resetPosition(),
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
}

function changeLayout(layout) {
  if (currentLayout === layout) return;

  currentLayout = layout;
  const config = LAYOUTS[layout];
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow.setMinimumSize(config.minWidth, config.minHeight);
  mainWindow.setMaximumSize(config.maxWidth, config.maxHeight);
  mainWindow.setSize(config.width, config.height);

  // Posicionar según layout
  if (layout === 'sidebar') {
    mainWindow.setPosition(Math.floor((screenWidth - config.width) / 2), 10);
  } else if (layout === 'compact') {
    mainWindow.setPosition(Math.floor((screenWidth - config.width) / 2), screenHeight - config.height - 10);
  } else {
    mainWindow.setPosition(screenWidth - config.width - 20, screenHeight - config.height - 20);
  }

  mainWindow.webContents.send('layout-changed', layout);
  updateTrayMenu();
}

function resetPosition() {
  const config = LAYOUTS[currentLayout];
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

  if (currentLayout === 'sidebar') {
    mainWindow.setPosition(Math.floor((screenWidth - config.width) / 2), 10);
  } else if (currentLayout === 'compact') {
    mainWindow.setPosition(Math.floor((screenWidth - config.width) / 2), screenHeight - config.height - 10);
  } else {
    mainWindow.setPosition(screenWidth - config.width - 20, screenHeight - config.height - 20);
  }
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

ipcMain.handle('change-layout', (event, layout) => {
  changeLayout(layout);
});

ipcMain.handle('get-current-layout', () => {
  return currentLayout;
});

// Registrar atajos globales
function registerShortcuts() {
  // F1-F3 para cambiar vista
  globalShortcut.register('F1', () => {
    changeLayout('widget');
    mainWindow.webContents.send('layout-changed', 'widget');
  });

  globalShortcut.register('F2', () => {
    changeLayout('sidebar');
    mainWindow.webContents.send('layout-changed', 'sidebar');
  });

  globalShortcut.register('F3', () => {
    changeLayout('compact');
    mainWindow.webContents.send('layout-changed', 'compact');
  });

  // Ctrl+Shift+L para mostrar/ocultar
  globalShortcut.register('CommandOrControl+Shift+L', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// Inicialización
app.whenReady().then(() => {
  createWindow();
  createTray();
  registerShortcuts();

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

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
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
