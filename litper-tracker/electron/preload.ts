import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Store
  getStore: (key: string) => ipcRenderer.invoke('get-store', key),
  setStore: (key: string, value: any) => ipcRenderer.invoke('set-store', key, value),

  // Window controls
  minimize: () => ipcRenderer.invoke('minimize'),
  close: () => ipcRenderer.invoke('close'),
  toggleAlwaysOnTop: () => ipcRenderer.invoke('toggle-always-on-top'),
  setOpacity: (opacity: number) => ipcRenderer.invoke('set-opacity', opacity),
  setSize: (width: number, height: number) => ipcRenderer.invoke('set-size', width, height),

  // Export
  exportCSV: (content: string, filename: string) => ipcRenderer.invoke('export-csv', content, filename),

  // Notifications
  sendNotification: (title: string, body: string) => ipcRenderer.invoke('send-notification', title, body),

  // IPC listeners for tray menu actions
  onSetMode: (callback: (mode: string) => void) => {
    ipcRenderer.on('set-mode', (_, mode) => callback(mode));
  },
  onShowDailySummary: (callback: () => void) => {
    ipcRenderer.on('show-daily-summary', () => callback());
  },
  onShowGoals: (callback: () => void) => {
    ipcRenderer.on('show-goals', () => callback());
  },
  onShowHistory: (callback: () => void) => {
    ipcRenderer.on('show-history', () => callback());
  },
  onExportData: (callback: () => void) => {
    ipcRenderer.on('export-data', () => callback());
  },
  onDoBackup: (callback: () => void) => {
    ipcRenderer.on('do-backup', () => callback());
  },
});

// Types for TypeScript
declare global {
  interface Window {
    electronAPI: {
      getStore: (key: string) => Promise<any>;
      setStore: (key: string, value: any) => Promise<void>;
      minimize: () => Promise<void>;
      close: () => Promise<void>;
      toggleAlwaysOnTop: () => Promise<boolean>;
      setOpacity: (opacity: number) => Promise<void>;
      setSize: (width: number, height: number) => Promise<void>;
      exportCSV: (content: string, filename: string) => Promise<{ success: boolean; path?: string; error?: string }>;
      sendNotification: (title: string, body: string) => Promise<void>;
      onSetMode: (callback: (mode: string) => void) => void;
      onShowDailySummary: (callback: () => void) => void;
      onShowGoals: (callback: () => void) => void;
      onShowHistory: (callback: () => void) => void;
      onExportData: (callback: () => void) => void;
      onDoBackup: (callback: () => void) => void;
    };
  }
}
