import React, { useState, useEffect } from 'react';
import { Minus, X, Pin, PinOff, Settings, Minimize2, Maximize2 } from 'lucide-react';
import { useAppStore } from '../stores/appStore';

declare global {
  interface Window {
    electronAPI?: {
      minimizeWindow: () => Promise<void>;
      closeWindow: () => Promise<void>;
      toggleAlwaysOnTop: () => Promise<boolean>;
      getAlwaysOnTop: () => Promise<boolean>;
      setWindowSize: (width: number, height: number) => Promise<void>;
      isElectron: boolean;
    };
  }
}

const TitleBar: React.FC = () => {
  const { modoAdmin, toggleModoAdmin, isCompact, toggleCompact } = useAppStore();
  const [alwaysOnTop, setAlwaysOnTop] = useState(true);
  const isElectron = window.electronAPI?.isElectron;

  useEffect(() => {
    if (isElectron) {
      window.electronAPI?.getAlwaysOnTop().then(setAlwaysOnTop);
    }
  }, [isElectron]);

  // Ajustar tamaño de ventana según modo compacto
  useEffect(() => {
    if (isElectron && window.electronAPI?.setWindowSize) {
      if (isCompact) {
        window.electronAPI.setWindowSize(200, 180);
      } else {
        window.electronAPI.setWindowSize(420, 600);
      }
    }
  }, [isCompact, isElectron]);

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

  const handleToggleCompact = () => {
    toggleCompact();
  };

  // Modo compacto - TitleBar minimalista
  if (isCompact) {
    return (
      <div className="drag-region flex items-center justify-between px-2 py-1 bg-dark-900/80 border-b border-dark-700/50">
        {/* Logo pequeño */}
        <div className="w-5 h-5 rounded gradient-primary flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">LP</span>
        </div>

        {/* Controles mínimos */}
        <div className="flex items-center gap-0.5 no-drag">
          {/* Expandir */}
          <button
            onClick={handleToggleCompact}
            className="p-1 rounded text-dark-400 hover:text-white hover:bg-dark-700 transition-all"
            title="Expandir"
          >
            <Maximize2 className="w-3 h-3" />
          </button>

          {/* Minimize */}
          <button
            onClick={handleMinimize}
            className="p-1 rounded text-dark-400 hover:text-white hover:bg-dark-700 transition-all"
            title="Minimizar"
          >
            <Minus className="w-3 h-3" />
          </button>

          {/* Close */}
          <button
            onClick={handleClose}
            className="p-1 rounded text-dark-400 hover:text-white hover:bg-accent-red transition-all"
            title="Cerrar"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  // Modo normal - TitleBar completo
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
        {/* Modo compacto toggle */}
        <button
          onClick={handleToggleCompact}
          className="p-1.5 rounded-md text-dark-400 hover:text-white hover:bg-dark-700 transition-all"
          title="Modo compacto"
        >
          <Minimize2 className="w-3.5 h-3.5" />
        </button>

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
