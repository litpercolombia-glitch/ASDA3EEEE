import React from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { useTrackerStore } from '../stores/trackerStore';

const Timer: React.FC = () => {
  const {
    tiempoTotal,
    tiempoRestante,
    estadoTimer,
    setTiempoTotal,
    iniciarTimer,
    pausarTimer,
    resetTimer,
  } = useTrackerStore();

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const percentage = (tiempoRestante / tiempoTotal) * 100;

  const getColor = () => {
    if (percentage > 50) return 'text-emerald-400';
    if (percentage > 25) return 'text-amber-400';
    if (percentage > 10) return 'text-orange-400';
    return 'text-red-400';
  };

  const tiempoOptions = [15, 20, 25, 30, 40];

  return (
    <div className="bg-dark-700 rounded-lg p-3">
      {/* Display */}
      <div className="text-center mb-3">
        <p
          className={`text-4xl font-mono font-bold ${getColor()} ${
            estadoTimer === 'finished' ? 'animate-pulse-red' : ''
          }`}
        >
          {formatTime(tiempoRestante)}
        </p>
      </div>

      {/* Time selection */}
      {estadoTimer === 'idle' && (
        <div className="flex justify-center gap-1 mb-3">
          {tiempoOptions.map((min) => (
            <button
              key={min}
              onClick={() => setTiempoTotal(min)}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                tiempoTotal === min * 60
                  ? 'bg-amber-500 text-white'
                  : 'bg-dark-600 text-slate-400 hover:bg-dark-500'
              }`}
            >
              {min}m
            </button>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-center gap-2">
        {estadoTimer === 'idle' && (
          <button
            onClick={iniciarTimer}
            className="flex items-center gap-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm"
          >
            <Play className="w-4 h-4" />
            Iniciar
          </button>
        )}

        {estadoTimer === 'running' && (
          <button
            onClick={pausarTimer}
            className="flex items-center gap-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm"
          >
            <Pause className="w-4 h-4" />
            Pausar
          </button>
        )}

        {estadoTimer === 'paused' && (
          <>
            <button
              onClick={iniciarTimer}
              className="flex items-center gap-1 px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm"
            >
              <Play className="w-4 h-4" />
            </button>
            <button
              onClick={resetTimer}
              className="flex items-center gap-1 px-3 py-2 bg-dark-600 text-white rounded-lg hover:bg-dark-500 transition-colors text-sm"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </>
        )}

        {estadoTimer === 'finished' && (
          <button
            onClick={resetTimer}
            className="flex items-center gap-1 px-4 py-2 bg-dark-600 text-white rounded-lg hover:bg-dark-500 transition-colors text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        )}
      </div>
    </div>
  );
};

export default Timer;
