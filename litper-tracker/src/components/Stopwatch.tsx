import React from 'react';
import { Play, Pause, RotateCcw, Clock } from 'lucide-react';
import { useTrackerStore } from '../stores/trackerStore';

const Stopwatch: React.FC = () => {
  const {
    tiempoTranscurrido,
    estadoStopwatch,
    iniciarStopwatch,
    pausarStopwatch,
    resetStopwatch,
  } = useTrackerStore();

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-dark-700 rounded-lg p-3">
      {/* Label */}
      <div className="flex items-center justify-center gap-1 mb-2">
        <Clock className="w-3 h-3 text-cyan-400" />
        <span className="text-xs text-cyan-400 font-medium">Tiempo transcurrido</span>
      </div>

      {/* Display */}
      <div className="text-center mb-3">
        <p className={`text-4xl font-mono font-bold text-cyan-400 ${
          estadoStopwatch === 'running' ? 'animate-pulse' : ''
        }`}>
          {formatTime(tiempoTranscurrido)}
        </p>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-2">
        {estadoStopwatch === 'idle' && (
          <button
            onClick={iniciarStopwatch}
            className="flex items-center gap-1 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors text-sm"
          >
            <Play className="w-4 h-4" />
            Iniciar
          </button>
        )}

        {estadoStopwatch === 'running' && (
          <button
            onClick={pausarStopwatch}
            className="flex items-center gap-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm"
          >
            <Pause className="w-4 h-4" />
            Pausar
          </button>
        )}

        {estadoStopwatch === 'paused' && (
          <>
            <button
              onClick={iniciarStopwatch}
              className="flex items-center gap-1 px-3 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors text-sm"
            >
              <Play className="w-4 h-4" />
            </button>
            <button
              onClick={resetStopwatch}
              className="flex items-center gap-1 px-3 py-2 bg-dark-600 text-white rounded-lg hover:bg-dark-500 transition-colors text-sm"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Reset siempre visible cuando hay tiempo */}
        {estadoStopwatch === 'running' && tiempoTranscurrido > 0 && (
          <button
            onClick={resetStopwatch}
            className="flex items-center gap-1 px-3 py-2 bg-dark-600 text-white rounded-lg hover:bg-dark-500 transition-colors text-sm"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Stopwatch;
