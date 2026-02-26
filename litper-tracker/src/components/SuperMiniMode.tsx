import React from 'react';
import { useTrackerStore } from '../stores/trackerStore';
import { Maximize2 } from 'lucide-react';

const SuperMiniMode: React.FC = () => {
  const { tiempoRestante, tiempoTotal, setModo, procesoActual, tiempoTranscurrido } = useTrackerStore();

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Usar tiempo correcto según el proceso
  const tiempo = procesoActual === 'novedades' ? tiempoTranscurrido : tiempoRestante;
  const percentage = procesoActual === 'novedades'
    ? Math.min((tiempoTranscurrido / 3600) * 100, 100)
    : (tiempoRestante / tiempoTotal) * 100;

  const getTimerColor = () => {
    if (procesoActual === 'novedades') return 'text-orange-400';
    if (percentage > 50) return 'text-emerald-400';
    if (percentage > 25) return 'text-amber-400';
    if (percentage > 10) return 'text-orange-400';
    return 'text-red-400';
  };

  // Letra del proceso
  const getProcesoLetra = () => {
    if (procesoActual === 'guias') return 'G';
    if (procesoActual === 'novedades') return 'N';
    return '•';
  };

  const getProcesoColor = () => {
    if (procesoActual === 'guias') return 'bg-emerald-500';
    if (procesoActual === 'novedades') return 'bg-orange-500';
    return 'bg-slate-500';
  };

  return (
    <div
      className="w-full h-full bg-dark-900 flex items-center justify-between px-2 gap-2 drag-region cursor-move"
      onDoubleClick={() => setModo('normal')}
      title="Doble click para expandir"
    >
      {/* Indicador de proceso */}
      <div className={`w-5 h-5 ${getProcesoColor()} rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
        {getProcesoLetra()}
      </div>

      {/* Timer centrado */}
      <span className={`text-xl font-mono font-bold ${getTimerColor()} flex-1 text-center`}>
        {formatTime(tiempo)}
      </span>

      {/* Botón expandir */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setModo('normal');
        }}
        className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-white no-drag flex-shrink-0 transition-colors"
        title="Expandir"
      >
        <Maximize2 size={12} />
      </button>
    </div>
  );
};

export default SuperMiniMode;
