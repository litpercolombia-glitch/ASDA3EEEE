import React from 'react';
import { Minus, X, Pin, Minimize2, Maximize2, Settings } from 'lucide-react';
import { useTrackerStore, ModoVentana } from '../stores/trackerStore';

const MODOS_CICLO: ModoVentana[] = ['normal', 'compacto', 'mini', 'micro'];

const TitleBar: React.FC = () => {
  const { modo, setModo, alwaysOnTop, toggleAlwaysOnTop, toggleConfig } = useTrackerStore();

  const handleMinimize = () => {
    window.electronAPI?.minimize();
  };

  const handleClose = () => {
    window.electronAPI?.close();
  };

  const cycleMode = () => {
    const idx = MODOS_CICLO.indexOf(modo);
    const nextIdx = (idx + 1) % MODOS_CICLO.length;
    setModo(MODOS_CICLO[nextIdx]);
  };

  return (
    <div className="drag-region bg-dark-900 px-3 py-2 flex items-center justify-between border-b border-dark-600">
      <div className="flex items-center gap-2">
        <span className="text-amber-400 font-bold text-sm">LITPER</span>
        <span className="text-slate-500 text-xs">Tracker</span>
      </div>

      <div className="flex items-center gap-1 no-drag">
        {/* Configuración */}
        <button
          onClick={toggleConfig}
          className="p-1.5 hover:bg-dark-700 rounded transition-colors text-slate-400 hover:text-purple-400"
          title="Configuración"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        {/* Toggle modo */}
        <button
          onClick={cycleMode}
          className="p-1.5 hover:bg-dark-700 rounded transition-colors text-slate-400 hover:text-white"
          title={`Tamaño: ${modo}`}
        >
          {modo === 'normal' || modo === 'compacto' ? (
            <Minimize2 className="w-3.5 h-3.5" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Always on top */}
        <button
          onClick={toggleAlwaysOnTop}
          className={`p-1.5 rounded transition-colors ${
            alwaysOnTop
              ? 'bg-amber-500/20 text-amber-400'
              : 'hover:bg-dark-700 text-slate-400 hover:text-white'
          }`}
          title={alwaysOnTop ? 'Siempre encima: ON' : 'Siempre encima: OFF'}
        >
          <Pin className="w-3.5 h-3.5" />
        </button>

        {/* Minimize */}
        <button
          onClick={handleMinimize}
          className="p-1.5 hover:bg-dark-700 rounded transition-colors text-slate-400 hover:text-white"
          title="Minimizar"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        {/* Close */}
        <button
          onClick={handleClose}
          className="p-1.5 hover:bg-red-500/20 rounded transition-colors text-slate-400 hover:text-red-400"
          title="Cerrar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
