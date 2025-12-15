import React, { useState, useEffect } from 'react';
import { Minus, X, Pin, PinOff, Settings } from 'lucide-react';
import { useAppStore } from '../stores/appStore';

declare global {
  interface Window {
    electronAPI?: {
      minimizeWindow: () => Promise<void>;
      closeWindow: () => Promise<void>;
      toggleAlwaysOnTop: () => Promise<boolean>;
      getAlwaysOnTop: () => Promise<boolean>;
      isElectron: boolean;
    };
  }
}

const TitleBar: React.FC = () => {
  const { modoAdmin, toggleModoAdmin } = useAppStore();
  const [alwaysOnTop, setAlwaysOnTop] = useState(true);
  const isElectron = window.electronAPI?.isElectron;

  useEffect(() => {
    if (isElectron) {
      window.electronAPI?.getAlwaysOnTop().then(setAlwaysOnTop);
    }
  }, [isElectron]);

  const handleMinimize = () => {
    if (isElectron) {
      window.electronAPI?.minimizeWindow();
    }
  };

  const handleClose = () => {
    if (isElectron) {
      window.electronAPI?.closeWindow();
    }
  };

  const handleTogglePin = async () => {
    if (isElectron) {
      const newState = await window.electronAPI?.toggleAlwaysOnTop();
      setAlwaysOnTop(newState ?? false);
    }
  };

  return (
    <div className="drag-region flex items-center justify-between px-3 py-2 bg-dark-900/80 border-b border-dark-700/50">
      {/* Logo y título */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md gradient-primary flex items-center justify-center">
          <span className="text-white text-xs font-bold">LP</span>
        </div>
        <h1 className="text-sm font-bold text-white">LITPER PEDIDOS</h1>
      </div>

      {/* Controles */}
      <div className="flex items-center gap-1 no-drag">
        {/* Admin toggle */}
        <button
          onClick={toggleModoAdmin}
          className={`p-1.5 rounded-md transition-all ${
            modoAdmin
              ? 'bg-primary-500 text-white'
              : 'text-dark-400 hover:text-white hover:bg-dark-700'
          }`}
          title={modoAdmin ? 'Modo Admin activo' : 'Activar modo Admin'}
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        {/* Pin toggle */}
        {isElectron && (
          <button
            onClick={handleTogglePin}
            className={`p-1.5 rounded-md transition-all ${
              alwaysOnTop
                ? 'bg-accent-blue/20 text-accent-blue'
                : 'text-dark-400 hover:text-white hover:bg-dark-700'
            }`}
            title={alwaysOnTop ? 'Siempre encima' : 'Normal'}
          >
            {alwaysOnTop ? (
              <Pin className="w-3.5 h-3.5" />
            ) : (
              <PinOff className="w-3.5 h-3.5" />
            )}
          </button>
        )}

        {/* Minimize */}
        <button
          onClick={handleMinimize}
          className="p-1.5 rounded-md text-dark-400 hover:text-white hover:bg-dark-700 transition-all"
          title="Minimizar"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        {/* Close */}
        <button
          onClick={handleClose}
          className="p-1.5 rounded-md text-dark-400 hover:text-white hover:bg-accent-red transition-all"
          title="Cerrar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
