/**
 * LITPER DESK — Electron Main Process
 *
 * Hardenizado segun PLAN_AVANZADO_LITPER_DESK.md §2 (35 controles de seguridad).
 * Consolida main.js previo de /electron/ + opcionalidades de /litper-pedidos-app/electron/.
 */
const {
  app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain,
  screen, nativeImage, shell, session,
} = require('electron');
const path = require('path');
const { z } = require('zod');

// ===== CONFIG =====
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
// El renderer del desktop vive en electron/renderer y se sirve en :5174
// (separado del web app principal en :5173 — ver BRAND_KIT y plan).
const RENDERER_DEV_URL = process.env.LITPER_RENDERER_URL || 'http://localhost:5174';
const RENDERER_PROD_PATH = path.join(__dirname, 'renderer', 'dist', 'index.html');

const WINDOW_CONFIG = {
  width: 380,
  height: 560,
  minWidth: 320,
  minHeight: 420,
  maxWidth: 600,
  maxHeight: 800,
};

// Hosts a los que el webview embebido del semaforo puede navegar.
// Hardening control #11, #12.
const WEBVIEW_ALLOWED_HOSTS = new Set([
  'litper-semaforo.vercel.app',
  'gtsivwbnhcawvmsfujby.supabase.co',
  'localhost',
  '127.0.0.1',
]);

// Hosts permitidos para shell.openExternal (hardening control #10).
const EXTERNAL_ALLOWED_HOSTS = new Set([
  'litper.com',
  'www.litper.com',
  'litper-semaforo.vercel.app',
  'web.whatsapp.com',
  'wa.me',
  'business.facebook.com',
  'github.com',
]);

let mainWindow = null;
let tray = null;
let isQuitting = false;
const displayPositions = new Map();

// ===== CSP estricto en respuestas (hardening control #8) =====
function setupCSP() {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://*.supabase.co",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' http://localhost:5174 ws://localhost:5174 " +
      "https://*.supabase.co wss://*.supabase.co " +
      "https://litper-semaforo.vercel.app https://api.anthropic.com " +
      "https://generativelanguage.googleapis.com",
    "frame-src https://litper-semaforo.vercel.app",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp],
      },
    });
  });
}

// ===== Permission handler (deny-by-default; hardening control varios) =====
function setupPermissionHandler() {
  const allowed = new Set([
    'media', 'notifications', 'clipboard-read', 'clipboard-sanitized-write',
  ]);
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(allowed.has(permission));
  });
}

// ===== Crear ventana =====
function createWindow() {
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    ...WINDOW_CONFIG,
    x: sw - WINDOW_CONFIG.width - 20,
    y: sh - WINDOW_CONFIG.height - 20,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    skipTaskbar: false,
    resizable: true,
    movable: true,
    minimizable: true,
    maximizable: false,
    closable: true,
    hasShadow: true,
    backgroundColor: '#00000000',
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,        // hardening #6
      nodeIntegration: false,         // hardening #6
      sandbox: true,                  // hardening #6 (era el que faltaba)
      webSecurity: true,              // hardening #9
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      partition: 'persist:litper-desk', // hardening #11 aislamiento
      devTools: isDev,
    },
  });

  // Bloquear navegacion fuera de la whitelist (hardening control #12).
  mainWindow.webContents.on('will-navigate', (event, url) => {
    try {
      const target = new URL(url);
      const isLocalhost = isDev &&
        (target.hostname === 'localhost' || target.hostname === '127.0.0.1');
      if (!isLocalhost && !WEBVIEW_ALLOWED_HOSTS.has(target.hostname)) {
        event.preventDefault();
        console.warn('[security] blocked navigation to', url);
      }
    } catch {
      event.preventDefault();
    }
  });

  // Nunca abrir ventanas pop-up; redirigir a navegador externo si esta whitelisted.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const target = new URL(url);
      const ok = EXTERNAL_ALLOWED_HOSTS.has(target.hostname) ||
                 target.hostname.endsWith('.litper.com');
      if (ok) shell.openExternal(url);
      else console.warn('[security] blocked window.open to', url);
    } catch {
      // url invalido, ignorar
    }
    return { action: 'deny' };
  });

  if (isDev) {
    mainWindow.loadURL(RENDERER_DEV_URL);
    if (process.env.LITPER_DEVTOOLS === '1') {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  } else {
    mainWindow.loadFile(RENDERER_PROD_PATH);
  }

  // Cerrar = ocultar (la app vive en tray).
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Persistir posicion por monitor (multi-monitor recordado).
  mainWindow.on('moved', () => {
    if (!mainWindow) return;
    const display = screen.getDisplayMatching(mainWindow.getBounds());
    displayPositions.set(display.id, mainWindow.getPosition());
  });

  // Si el monitor donde estaba la ventana desaparece, mover a primario.
  screen.on('display-removed', (_event, display) => {
    if (!mainWindow) return;
    const winDisplay = screen.getDisplayMatching(mainWindow.getBounds());
    if (winDisplay.id === display.id) {
      const primary = screen.getPrimaryDisplay();
      mainWindow.setPosition(primary.workArea.x + 20, primary.workArea.y + 20);
    }
  });

  // Notificar al renderer cambios de tamano (alimenta container queries en CSS).
  mainWindow.on('resize', () => {
    if (!mainWindow) return;
    const [w, h] = mainWindow.getSize();
    mainWindow.webContents.send('window:resize', { width: w, height: h });
  });
}

// ===== Tray =====
function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');
  let trayIcon = nativeImage.createFromPath(iconPath);
  if (trayIcon.isEmpty()) trayIcon = createDefaultIcon();

  tray = new Tray(trayIcon);
  tray.setToolTip('LITPER DESK');

  const ctx = Menu.buildFromTemplate([
    { label: 'LITPER DESK', enabled: false },
    { type: 'separator' },
    { label: 'Mostrar', click: () => { mainWindow?.show(); mainWindow?.focus(); } },
    { label: 'Ocultar', click: () => mainWindow?.hide() },
    { type: 'separator' },
    {
      label: 'Siempre encima',
      type: 'checkbox',
      checked: true,
      click: (m) => mainWindow?.setAlwaysOnTop(m.checked),
    },
    {
      label: 'Opacidad',
      submenu: [100, 90, 80, 70, 60, 50].map((n) => ({
        label: `${n}%`,
        click: () => mainWindow?.setOpacity(n / 100),
      })),
    },
    { type: 'separator' },
    {
      label: 'Iniciar / pausar ronda (Ctrl+Shift+S)',
      click: () => mainWindow?.webContents.send('shortcut', 'toggle-timer'),
    },
    {
      label: 'Guardar ronda (Ctrl+Shift+R)',
      click: () => mainWindow?.webContents.send('shortcut', 'save-round'),
    },
    {
      label: 'Buscador (Ctrl+K)',
      click: () => mainWindow?.webContents.send('shortcut', 'open-search'),
    },
    {
      label: 'Semaforo (F1)',
      click: () => mainWindow?.webContents.send('shortcut', 'open-semaforo'),
    },
    { type: 'separator' },
    {
      label: 'Reiniciar posicion',
      click: () => {
        if (!mainWindow) return;
        const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
        mainWindow.setPosition(
          sw - WINDOW_CONFIG.width - 20,
          sh - WINDOW_CONFIG.height - 20,
        );
      },
    },
    { type: 'separator' },
    { label: 'Salir', click: () => { isQuitting = true; app.quit(); } },
  ]);

  tray.setContextMenu(ctx);
  tray.on('click', () => {
    if (mainWindow?.isVisible()) mainWindow.hide();
    else { mainWindow?.show(); mainWindow?.focus(); }
  });
}

function createDefaultIcon() {
  const size = 16;
  const buf = Buffer.alloc(size * size * 4);
  // Color gold del brand kit (#D4AF37) para el tray icon por defecto.
  for (let i = 0; i < size * size; i++) {
    buf[i * 4] = 212;
    buf[i * 4 + 1] = 175;
    buf[i * 4 + 2] = 55;
    buf[i * 4 + 3] = 255;
  }
  return nativeImage.createFromBuffer(buf, { width: size, height: size });
}

// ===== Atajos globales =====
function registerShortcuts() {
  globalShortcut.register('CommandOrControl+Shift+L', () => {
    if (!mainWindow) return;
    if (mainWindow.isVisible()) mainWindow.hide();
    else { mainWindow.show(); mainWindow.focus(); }
  });
  globalShortcut.register('CommandOrControl+Shift+S', () => {
    mainWindow?.webContents.send('shortcut', 'toggle-timer');
  });
  globalShortcut.register('CommandOrControl+Shift+R', () => {
    mainWindow?.webContents.send('shortcut', 'save-round');
  });
  globalShortcut.register('CommandOrControl+K', () => {
    mainWindow?.show(); mainWindow?.focus();
    mainWindow?.webContents.send('shortcut', 'open-search');
  });
  globalShortcut.register('CommandOrControl+Shift+P', () => {
    mainWindow?.webContents.send('shortcut', 'screenshot');
  });
  globalShortcut.register('F1', () => {
    mainWindow?.webContents.send('shortcut', 'open-semaforo');
  });
}

// ===== IPC con validacion zod (hardening control #7) =====
const SetOpacitySchema = z.object({ opacity: z.number().min(0.3).max(1) });
const SetAlwaysOnTopSchema = z.object({ pinned: z.boolean() });
const OpenExternalSchema = z.object({ url: z.string().url() });

function safeHandle(channel, schema, handler) {
  ipcMain.handle(channel, async (_event, payload) => {
    try {
      const data = schema ? schema.parse(payload) : payload;
      return await handler(data);
    } catch (err) {
      console.error(`[ipc:${channel}] validation error`, err.message);
      return { error: 'invalid_payload' };
    }
  });
}

function setupIPC() {
  safeHandle('window:minimize', null, () => mainWindow?.minimize());
  safeHandle('window:hide', null, () => mainWindow?.hide());

  safeHandle('window:set-opacity', SetOpacitySchema, ({ opacity }) => {
    mainWindow?.setOpacity(opacity);
    return { ok: true };
  });

  safeHandle('window:set-always-on-top', SetAlwaysOnTopSchema, ({ pinned }) => {
    mainWindow?.setAlwaysOnTop(pinned);
    return { ok: true, pinned };
  });

  safeHandle('window:get-state', null, () => ({
    isMaximized: mainWindow?.isMaximized() ?? false,
    isAlwaysOnTop: mainWindow?.isAlwaysOnTop() ?? false,
    opacity: mainWindow?.getOpacity() ?? 1,
    bounds: mainWindow?.getBounds(),
  }));

  safeHandle('shell:open-external', OpenExternalSchema, ({ url }) => {
    try {
      const target = new URL(url);
      const ok = EXTERNAL_ALLOWED_HOSTS.has(target.hostname) ||
                 target.hostname.endsWith('.litper.com') ||
                 target.hostname.endsWith('.supabase.co');
      if (!ok) {
        console.warn('[security] shell:open-external blocked', url);
        return { error: 'host_not_allowed' };
      }
      shell.openExternal(url);
      return { ok: true };
    } catch {
      return { error: 'invalid_url' };
    }
  });

  safeHandle('app:get-platform', null, () => ({
    platform: process.platform,
    isElectron: true,
    version: app.getVersion(),
  }));
}

// ===== Lifecycle =====
app.whenReady().then(() => {
  setupCSP();
  setupPermissionHandler();
  setupIPC();
  createWindow();
  createTray();
  registerShortcuts();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => { isQuitting = true; });
app.on('will-quit', () => { globalShortcut.unregisterAll(); });

// Single instance.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });
}

// Hardening #6: prevenir override de webPreferences en webviews creados por contenido remoto.
app.on('web-contents-created', (_event, contents) => {
  contents.on('will-attach-webview', (_evt, webPreferences) => {
    delete webPreferences.preload;
    webPreferences.nodeIntegration = false;
    webPreferences.contextIsolation = true;
    webPreferences.sandbox = true;
  });
});
