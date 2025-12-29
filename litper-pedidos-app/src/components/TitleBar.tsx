import React, { useState, useEffect } from 'react';
import { Minus, X, Pin, PinOff, Settings, Maximize2, LayoutGrid, PanelRightClose } from 'lucide-react';
import { useAppStore, DisplayMode } from '../stores/appStore';

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

// Configuración de tamaños por modo
const WINDOW_SIZES: Record<DisplayMode, { width: number; height: number }> = {
  normal: { width: 420, height: 600 },
  compact: { width: 280, height: 420 },
  sidebar: { width: 100, height: 500 },
};

const TitleBar: React.FC = () => {
  const { modoAdmin, toggleModoAdmin, displayMode, cycleDisplayMode } = useAppStore();
  const [alwaysOnTop, setAlwaysOnTop] = useState(true);
  const isElectron = window.electronAPI?.isElectron;

  useEffect(() => {
    if (isElectron) {
      window.electronAPI?.getAlwaysOnTop().then(setAlwaysOnTop);
    }
  }, [isElectron]);

  // Ajustar tamaño de ventana según modo
  useEffect(() => {
    if (isElectron && window.electronAPI?.setWindowSize) {
      const size = WINDOW_SIZES[displayMode];
      window.electronAPI.setWindowSize(size.width, size.height);
    }
  }, [displayMode, isElectron]);

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

  const handleCycleMode = () => {
    cycleDisplayMode();
  };

  // Obtener el icono y tooltip según el modo actual
  const getModeIcon = () => {
    switch (displayMode) {
      case 'compact':
        return { Icon: LayoutGrid, title: 'Modo compacto - Click para cambiar' };
      case 'sidebar':
        return { Icon: PanelRightClose, title: 'Modo barra lateral - Click para cambiar' };
      default:
        return { Icon: Maximize2, title: 'Modo normal - Click para cambiar' };
    }
  };

  const { Icon: ModeIcon, title: modeTitle } = getModeIcon();

  // Modo sidebar - TitleBar ultra minimalista
  if (displayMode === 'sidebar') {
    return (
      <div className="drag-region flex flex-col items-center gap-1 px-1 py-2 bg-dark-900/80 border-b border-dark-700/50">
        {/* Logo pequeño */}
        <div className="w-6 h-6 rounded gradient-primary flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">LP</span>
        </div>

        {/* Controles verticales */}
        <div className="flex flex-col items-center gap-0.5 no-drag">
          {/* Cambiar modo */}
          <button
            onClick={handleCycleMode}
            className="p-1 rounded text-primary-400 hover:text-white hover:bg-dark-700 transition-all"
            title={modeTitle}
          >
            <ModeIcon className="w-3.5 h-3.5" />
          </button>

          {/* Close */}
          <button
            onClick={handleClose}
            className="p-1 rounded text-dark-400 hover:text-white hover:bg-accent-red transition-all"
            title="Cerrar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Modo compacto - TitleBar minimalista
  if (displayMode === 'compact') {
    return (
      <div className="drag-region flex items-center justify-between px-2 py-1 bg-dark-900/80 border-b border-dark-700/50">
        {/* Logo pequeño */}
        <div className="w-5 h-5 rounded gradient-primary flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">LP</span>
        </div>

        {/* Controles mínimos */}
        <div className="flex items-center gap-0.5 no-drag">
          {/* Cambiar modo */}
          <button
            onClick={handleCycleMode}
            className="p-1 rounded text-primary-400 hover:text-white hover:bg-dark-700 transition-all"
            title={modeTitle}
          >
            <ModeIcon className="w-3 h-3" />
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
        {/* Ciclar modo de vista */}
        <button
          onClick={handleCycleMode}
          className="p-1.5 rounded-md text-primary-400 hover:text-white hover:bg-dark-700 transition-all"
          title={modeTitle}
        >
          <ModeIcon className="w-3.5 h-3.5" />
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
