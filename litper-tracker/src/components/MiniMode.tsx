import React from 'react';
import { useTrackerStore } from '../stores/trackerStore';

const MiniMode: React.FC = () => {
  const {
    tiempoRestante,
    tiempoTranscurrido,
    procesoActual,
    valoresGuias,
    valoresNovedades,
    incrementarGuias,
    incrementarNovedades,
    setModo,
    totalHoyGuias,
    totalHoyNovedades,
    guardarRonda,
    usuarioActual,
  } = useTrackerStore();

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const esGuias = procesoActual === 'guias';
  const tiempo = esGuias ? tiempoRestante : tiempoTranscurrido;

  const handleClose = () => {
    window.electronAPI?.close();
  };

  const handleIncrement = () => {
    if (esGuias) {
      incrementarGuias('realizado');
    } else {
      incrementarNovedades('solucionadas');
    }
  };

  const handleIncrement5 = () => {
    if (esGuias) {
      incrementarGuias('realizado', 5);
    } else {
      incrementarNovedades('solucionadas', 5);
    }
  };

  const valorActual = esGuias ? valoresGuias.realizado : valoresNovedades.solucionadas;
  const totalHoy = esGuias ? totalHoyGuias : totalHoyNovedades;

  return (
    <div className="h-full w-full bg-dark-800 flex flex-col overflow-hidden">
      {/* Title bar mini */}
      <div className="drag-region bg-dark-900 px-2 py-1 flex items-center justify-between border-b border-dark-700">
        <div className="flex items-center gap-1">
          <span className="text-amber-400 font-bold text-xs">LITPER</span>
          <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${esGuias ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'}`}>
            {esGuias ? 'G' : 'N'}
          </span>
        </div>
        <div className="flex items-center gap-1 no-drag">
          <button
            onClick={() => setModo('normal')}
            className="px-1.5 py-0.5 text-[10px] hover:bg-dark-700 rounded text-slate-400 hover:text-white"
          >
            E
          </button>
          <button
            onClick={handleClose}
            className="px-1.5 py-0.5 text-[10px] hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400"
          >
            X
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-2 flex flex-col gap-2">
        {/* Timer + Valor */}
        <div className="flex items-center justify-between">
          <span className={`text-xl font-mono font-bold ${esGuias ? 'text-emerald-400' : 'text-orange-400'}`}>
            {formatTime(tiempo)}
          </span>
          <span className={`text-lg font-bold ${esGuias ? 'text-emerald-400' : 'text-orange-400'}`}>
            {esGuias ? '✅' : '🔧'} {valorActual}
          </span>
        </div>

        {/* Botones */}
        <div className="flex gap-1">
          <button
            onClick={handleIncrement}
            className={`flex-1 py-2 ${esGuias ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-orange-600 hover:bg-orange-500'} text-white rounded font-bold text-sm active:scale-95`}
          >
            +1
          </button>
          <button
            onClick={handleIncrement5}
            className={`flex-1 py-2 ${esGuias ? 'bg-emerald-700 hover:bg-emerald-600' : 'bg-orange-700 hover:bg-orange-600'} text-white rounded font-bold text-sm active:scale-95`}
          >
            +5
          </button>
          <button
            onClick={guardarRonda}
            className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded font-bold text-sm active:scale-95"
          >
            S
          </button>
        </div>

        {/* Total */}
        <div className="text-center text-xs text-slate-400">
          {usuarioActual?.nombre}: {totalHoy} hoy
        </div>
      </div>
    </div>
  );
};

export default MiniMode;
