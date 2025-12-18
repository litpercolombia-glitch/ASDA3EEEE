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
    };
  }
}
