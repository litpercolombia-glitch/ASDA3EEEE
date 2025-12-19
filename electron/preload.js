/**
 * 🎮 LITPER PROCESOS - Electron Preload
 * Bridge seguro entre main y renderer
 */
const { contextBridge, ipcRenderer } = require('electron');

// Exponer API segura al renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Controles de ventana
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  pin: (pinned) => ipcRenderer.send('window-pin', pinned),

  // Obtener estado
  getWindowState: () => ipcRenderer.invoke('get-window-state'),

  // Escuchar shortcuts globales
  onShortcut: (callback) => {
    ipcRenderer.on('shortcut', (_, action) => callback(action));
  },

  // Platform info
  platform: process.platform,
  isElectron: true,
});

// Indicador de que estamos en Electron
window.isElectron = true;
