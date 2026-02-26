import { app, BrowserWindow, ipcMain, globalShortcut, Tray, Menu, nativeImage, Notification, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import Store from 'electron-store';

const store = new Store();
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

// Obtener posicion guardada o centrar
const getWindowPosition = () => {
  const saved = store.get('windowPosition') as { x: number; y: number } | undefined;
  if (saved) return saved;
  return undefined; // Electron centrara automaticamente
};

const getWindowSize = () => {
  const saved = store.get('windowSize') as { width: number; height: number } | undefined;
  return saved || { width: 320, height: 480 };
};

const createWindow = () => {
  const pos = getWindowPosition();
  const size = getWindowSize();

  mainWindow = new BrowserWindow({
    width: size.width,
    height: size.height,
    x: pos?.x,
    y: pos?.y,
    minWidth: 280,
    minHeight: 200,
    maxWidth: 400,
    maxHeight: 700,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    resizable: true,
    skipTaskbar: false,
    hasShadow: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Detectar modo desarrollo de forma robusta
  const isDev = !app.isPackaged || process.env.VITE_DEV_SERVER_URL;
  const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

  // Cargar app
  if (isDev) {
    console.log('🚀 Modo desarrollo - Cargando:', devServerUrl);
    mainWindow.loadURL(devServerUrl);

    // Manejar errores de carga y reintentar
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.log('⚠️ Error cargando app:', errorDescription, '- Reintentando en 2s...');
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.loadURL(devServerUrl);
        }
      }, 2000);
    });
  } else {
    console.log('📦 Modo producción - Cargando archivo local');
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Log cuando la app carga correctamente
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ App cargada correctamente');
  });

  // Guardar posicion al mover
  mainWindow.on('moved', () => {
    if (mainWindow) {
      const [x, y] = mainWindow.getPosition();
      store.set('windowPosition', { x, y });
    }
  });

  // Guardar tamaño al redimensionar
  mainWindow.on('resized', () => {
    if (mainWindow) {
      const [width, height] = mainWindow.getSize();
      store.set('windowSize', { width, height });
    }
  });

  // Minimizar a tray en vez de cerrar
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow?.hide();
    }
  });
};

const createTray = () => {
  // Icono simple para tray
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAABF0lEQVR4nO2WMQ6CQBBF/1qvoLEwsLTQK+gJjLfQC+gN9AZ6BK+gB1BLCwM2Ghsqa8KYLMousMvuJvyXvGRhJjPzWViAjo6OBgPAFcADwBvACwD6hwNgDmAKYAZgAmAMYARgCGAAoA+gB6ALoAOgDaAFoAmgAaAOoAagCqACoAygBKAIoAAgD4DZ1z+ADQJ/AF7gCJ7gGJ7hBVwLEMEVPMArBPVwYhrgBTwMOQJxQQR3SAAREoAE5BAFwgkIAsILRIH4VYCCQGSBPyGygNOy0DLgLFdoGWhYEFEGnJeF0j9BC0SB+KGACBDxMQg/Q5RAOIEoCE8gHEQiCN8B/osgEP5EFAhvIhjETyBCiSQQ/gQ='
  );

  tray = new Tray(icon);
  tray.setToolTip('LITPER Tracker');

  const updateTrayMenu = () => {
    const isOnTop = mainWindow?.isAlwaysOnTop() ?? true;

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Mostrar LITPER',
        click: () => {
          mainWindow?.show();
          mainWindow?.focus();
        },
      },
      { type: 'separator' },
      {
        label: 'Modo',
        submenu: [
          { label: 'Normal', click: () => mainWindow?.webContents.send('set-mode', 'normal') },
          { label: 'Compacto', click: () => mainWindow?.webContents.send('set-mode', 'compacto') },
          { label: 'Mini', click: () => mainWindow?.webContents.send('set-mode', 'mini') },
          { label: 'Micro', click: () => mainWindow?.webContents.send('set-mode', 'micro') },
          { label: 'Barra', click: () => mainWindow?.webContents.send('set-mode', 'barra') },
        ],
      },
      {
        label: 'Siempre encima',
        type: 'checkbox',
        checked: isOnTop,
        click: (menuItem) => {
          mainWindow?.setAlwaysOnTop(menuItem.checked);
        },
      },
      { type: 'separator' },
      {
        label: 'Acciones rápidas',
        submenu: [
          {
            label: 'Ver Resumen del Día',
            click: () => {
              mainWindow?.show();
              mainWindow?.webContents.send('show-daily-summary');
            },
          },
          {
            label: 'Ver Metas',
            click: () => {
              mainWindow?.show();
              mainWindow?.webContents.send('show-goals');
            },
          },
          {
            label: 'Ver Historial',
            click: () => {
              mainWindow?.show();
              mainWindow?.webContents.send('show-history');
            },
          },
        ],
      },
      { type: 'separator' },
      {
        label: 'Exportar Datos',
        click: () => {
          mainWindow?.webContents.send('export-data');
        },
      },
      {
        label: 'Hacer Backup',
        click: () => {
          mainWindow?.webContents.send('do-backup');
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

    tray?.setContextMenu(contextMenu);
  };

  updateTrayMenu();

  tray.on('click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
      mainWindow?.focus();
    }
  });
};

const registerShortcuts = () => {
  // Toggle visibilidad
  globalShortcut.register('CommandOrControl+Shift+P', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
      mainWindow?.focus();
    }
  });
};

// IPC Handlers
ipcMain.handle('get-store', (_, key) => store.get(key));
ipcMain.handle('set-store', (_, key, value) => store.set(key, value));
ipcMain.handle('minimize', () => mainWindow?.minimize());
ipcMain.handle('close', () => mainWindow?.hide());
ipcMain.handle('toggle-always-on-top', () => {
  if (mainWindow) {
    const current = mainWindow.isAlwaysOnTop();
    mainWindow.setAlwaysOnTop(!current);
    return !current;
  }
  return true;
});
ipcMain.handle('set-opacity', (_, opacity: number) => {
  mainWindow?.setOpacity(opacity);
});
ipcMain.handle('set-size', (_, width: number, height: number) => {
  mainWindow?.setSize(width, height, true);
});

// Export CSV
ipcMain.handle('export-csv', async (_, content: string, filename: string) => {
  const downloadsPath = app.getPath('downloads');
  const filePath = path.join(downloadsPath, filename);

  try {
    fs.writeFileSync(filePath, content, 'utf-8');

    // Mostrar notificacion
    if (Notification.isSupported()) {
      new Notification({
        title: 'LITPER Tracker',
        body: `Archivo exportado: ${filename}`,
      }).show();
    }

    return { success: true, path: filePath };
  } catch (error) {
    console.error('Error exportando CSV:', error);
    return { success: false, error: String(error) };
  }
});

// Send notification
ipcMain.handle('send-notification', (_, title: string, body: string) => {
  if (Notification.isSupported()) {
    new Notification({
      title,
      body,
      silent: false,
    }).show();
  }
});

app.whenReady().then(() => {
  createWindow();
  createTray();
  registerShortcuts();

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
