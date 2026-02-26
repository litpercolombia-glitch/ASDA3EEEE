import React from 'react';
import { useTrackerStore } from '../stores/trackerStore';

const BarMode: React.FC = () => {
  const {
    procesoActual,
    tiempoRestante,
    tiempoTranscurrido,
    estadoTimer,
    estadoStopwatch,
    valoresGuias,
    valoresNovedades,
    incrementarGuias,
    incrementarNovedades,
    iniciarTimer,
    pausarTimer,
    iniciarStopwatch,
    pausarStopwatch,
    setModo,
    guardarRonda,
  } = useTrackerStore();

  const handleClose = () => {
    window.electronAPI?.close();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const esGuias = procesoActual === 'guias';
  const esNovedades = procesoActual === 'novedades';

  const tiempo = esGuias ? tiempoRestante : tiempoTranscurrido;
  const isRunning = esGuias ? estadoTimer === 'running' : estadoStopwatch === 'running';

  const toggleTiempo = () => {
    if (esGuias) {
      estadoTimer === 'running' ? pausarTimer() : iniciarTimer();
    } else if (esNovedades) {
      estadoStopwatch === 'running' ? pausarStopwatch() : iniciarStopwatch();
    }
  };

  const handleIncrement = () => {
    if (esGuias) incrementarGuias('realizado');
    else if (esNovedades) incrementarNovedades('solucionadas');
  };

  const valorPrincipal = esGuias ? valoresGuias.realizado : valoresNovedades.solucionadas;

  const getTimerColor = () => {
    if (esGuias) {
      if (estadoTimer === 'finished') return 'text-red-400';
      return 'text-emerald-400';
    }
    return 'text-orange-400';
  };

  return (
    <div className="h-full w-full bg-dark-900 flex flex-col items-center py-2 gap-1 drag-region overflow-hidden">
      {/* P = Proceso */}
      <button
        onClick={() => setModo('normal')}
        className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg no-drag ${
          esGuias ? 'bg-emerald-600' : esNovedades ? 'bg-orange-600' : 'bg-slate-600'
        }`}
        title="[E] Expandir"
      >
        {esGuias ? 'G' : esNovedades ? 'N' : '?'}
      </button>

      {/* T = Timer */}
      <button
        onClick={toggleTiempo}
        className={`w-full px-1 py-1 text-center font-mono text-xs font-bold no-drag ${getTimerColor()} ${isRunning ? 'animate-pulse' : ''}`}
        title="[T] Timer"
      >
        {formatTime(tiempo)}
      </button>

      {/* Separador */}
      <div className="w-8 h-px bg-dark-600" />

      {/* + = Agregar */}
      <button
        onClick={handleIncrement}
        className="w-10 h-10 bg-emerald-600 hover:bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-xl no-drag active:scale-95"
        title="[+] Agregar"
      >
        +
      </button>

      {/* Valor */}
      <div className="text-white font-bold text-lg">
        {valorPrincipal}
      </div>

      {/* Separador */}
      <div className="w-8 h-px bg-dark-600" />

      {/* S = Save */}
      <button
        onClick={guardarRonda}
        className="w-10 h-10 bg-amber-600 hover:bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold no-drag active:scale-95"
        title="[S] Guardar"
      >
        S
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* E = Expandir */}
      <button
        onClick={() => setModo('normal')}
        className="w-10 h-8 bg-dark-700 hover:bg-dark-600 rounded flex items-center justify-center text-slate-400 hover:text-white text-xs font-bold no-drag"
        title="[E] Expandir"
      >
        E
      </button>

      {/* X = Cerrar */}
      <button
        onClick={handleClose}
        className="w-10 h-8 bg-red-600/20 hover:bg-red-600/40 rounded flex items-center justify-center text-red-400 font-bold no-drag"
        title="[X] Cerrar"
      >
        X
      </button>
    </div>
  );
};

export default BarMode;
