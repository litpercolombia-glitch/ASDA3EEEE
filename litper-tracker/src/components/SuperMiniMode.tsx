import React from 'react';
import { useTrackerStore } from '../stores/trackerStore';

const SuperMiniMode: React.FC = () => {
  const { tiempoRestante, tiempoTranscurrido, setModo, procesoActual } = useTrackerStore();

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const tiempo = procesoActual === 'novedades' ? tiempoTranscurrido : tiempoRestante;

  const getProcesoLetra = () => {
    if (procesoActual === 'guias') return 'G';
    if (procesoActual === 'novedades') return 'N';
    return '-';
  };

  const getProcesoColor = () => {
    if (procesoActual === 'guias') return 'bg-emerald-600';
    if (procesoActual === 'novedades') return 'bg-orange-600';
    return 'bg-slate-600';
  };

  const getTimerColor = () => {
    if (procesoActual === 'novedades') return 'text-orange-400';
    return 'text-emerald-400';
  };

  return (
    <div
      className="w-full h-full bg-dark-900 flex items-center justify-center gap-2 px-2 drag-region cursor-move"
      onDoubleClick={() => setModo('normal')}
      title="Doble click para expandir"
    >
      {/* Letra del proceso */}
      <div className={`w-8 h-8 ${getProcesoColor()} rounded flex items-center justify-center text-white text-sm font-bold`}>
        {getProcesoLetra()}
      </div>

      {/* Timer */}
      <span className={`text-xl font-mono font-bold ${getTimerColor()}`}>
        {formatTime(tiempo)}
      </span>
    </div>
  );
};

export default SuperMiniMode;
