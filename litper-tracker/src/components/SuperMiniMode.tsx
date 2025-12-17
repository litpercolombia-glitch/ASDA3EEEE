import React from 'react';
import { useTrackerStore } from '../stores/trackerStore';

const SuperMiniMode: React.FC = () => {
  const { tiempoRestante, tiempoTotal, setModo } = useTrackerStore();

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

  return (
    <div
      className="h-full bg-dark-800 rounded-xl overflow-hidden border border-dark-600 drag-region cursor-move flex items-center justify-center"
      onDoubleClick={() => setModo('normal')}
      title="Doble click para expandir"
    >
      <span className={`text-2xl font-mono font-bold ${getTimerColor()}`}>
        {formatTime(tiempoRestante)}
      </span>
    </div>
  );
};

export default SuperMiniMode;
