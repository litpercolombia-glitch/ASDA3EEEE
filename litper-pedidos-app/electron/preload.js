const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs seguras al renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Control de ventana
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
  toggleAlwaysOnTop: () => ipcRenderer.invoke('window-toggle-always-on-top'),
  getAlwaysOnTop: () => ipcRenderer.invoke('get-always-on-top'),
  setWindowSize: (width, height) => ipcRenderer.invoke('window-set-size', width, height),

  // Eventos
  onWindowResize: (callback) => {
    ipcRenderer.on('window-resize', (event, size) => callback(size));
  },
  onAlwaysOnTopChanged: (callback) => {
    ipcRenderer.on('always-on-top-changed', (event, isOnTop) => callback(isOnTop));
  },

  // Información
  isElectron: true,
  platform: process.platform,
});

// Notificar que preload está listo
window.addEventListener('DOMContentLoaded', () => {
  console.log('LITPER PEDIDOS - Preload ready');
});
