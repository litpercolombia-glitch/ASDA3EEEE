/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    getStore: (key: string) => Promise<any>;
    setStore: (key: string, value: any) => Promise<void>;
    minimize: () => Promise<void>;
    close: () => Promise<void>;
    toggleAlwaysOnTop: () => Promise<boolean>;
    setOpacity: (opacity: number) => Promise<void>;
    setSize: (width: number, height: number) => Promise<void>;
    exportCSV?: (content: string, filename: string) => Promise<void>;
  };
}
