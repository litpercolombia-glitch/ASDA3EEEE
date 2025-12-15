import React from 'react';
import { Plus, Maximize2, X } from 'lucide-react';
import { useTrackerStore } from '../stores/trackerStore';

const MiniMode: React.FC = () => {
  const {
    tiempoRestante,
    tiempoTotal,
    valores,
    incrementar,
    setModo,
    totalHoy,
    guardarRonda,
  } = useTrackerStore();

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const percentage = (tiempoRestante / tiempoTotal) * 100;

  const getTimerColor = () => {
    if (percentage > 50) return 'text-emerald-400';
    if (percentage > 25) return 'text-amber-400';
    if (percentage > 10) return 'text-orange-400';
    return 'text-red-400';
  };

  const handleClose = () => {
    window.electronAPI?.close();
  };

  // Prevenir menu contextual para +5
  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    const amount = e.button === 2 ? 5 : 1;
    incrementar('realizado', amount);
  };

  return (
    <div className="h-full bg-dark-800 rounded-xl overflow-hidden border border-dark-600">
      {/* Title bar mini */}
      <div className="drag-region bg-dark-900 px-2 py-1 flex items-center justify-between">
        <span className="text-amber-400 font-bold text-xs">LITPER</span>
        <div className="flex items-center gap-1 no-drag">
          <button
            onClick={() => setModo('normal')}
            className="p-1 hover:bg-dark-700 rounded text-slate-400 hover:text-white"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-2 space-y-2">
        {/* Timer + Realizado */}
        <div className="flex items-center justify-between">
          <span className={`text-xl font-mono font-bold ${getTimerColor()}`}>
            {formatTime(tiempoRestante)}
          </span>
          <div className="flex items-center gap-1">
            <span className="text-emerald-400 font-bold">
              ✅ {valores.realizado}
            </span>
          </div>
        </div>

        {/* Botones rapidos */}
        <div className="flex gap-1">
          <button
            onClick={handleIncrement}
            onContextMenu={handleIncrement}
            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-sm flex items-center justify-center gap-1 active:scale-95 transition-all"
            title="Click: +1 | Click derecho: +5"
          >
            <Plus className="w-4 h-4" />
            1
          </button>
          <button
            onClick={() => incrementar('realizado', 5)}
            className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded font-bold text-sm flex items-center justify-center gap-1 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            5
          </button>
          <button
            onClick={guardarRonda}
            className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded font-bold text-sm active:scale-95 transition-all"
            title="Guardar ronda"
          >
            💾
          </button>
        </div>

        {/* Total del dia */}
        <div className="text-center text-xs text-slate-400">
          Hoy: {totalHoy} realizados
        </div>
      </div>
    </div>
  );
};

export default MiniMode;
