import React, { useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useAppStore, TIEMPOS_PRESET, TimerColor } from '../stores/appStore';

interface TimerProps {
  compact?: boolean;
}

const Timer: React.FC<TimerProps> = ({ compact = false }) => {
  const {
    configTimer,
    timerState,
    tiempoRestante,
    numeroBloqueHoy,
    iniciarTimer,
    pausarTimer,
    finalizarBloque,
    tick,
    setConfigTimer,
    getTimerColor,
    resetearTimer,
  } = useAppStore();

  // Tick cada segundo
  useEffect(() => {
    if (timerState !== 'running') return;

    const interval = setInterval(() => {
      tick();
    }, 1000);

    return () => clearInterval(interval);
  }, [timerState, tick]);

  // Formatear tiempo MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const timerColor = getTimerColor();
  const totalSeconds = configTimer.duracionMinutos * 60;
  const progress = (tiempoRestante / totalSeconds) * 100;

  const colorMap: Record<TimerColor, string> = {
    green: '#10B981',
    yellow: '#F59E0B',
    orange: '#F97316',
    red: '#EF4444',
  };

  const handleReiniciar = () => {
    finalizarBloque();
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span
          className={`font-mono font-bold tabular-nums ${
            timerState === 'running' && timerColor === 'red' ? 'animate-pulse' : ''
          }`}
          style={{ color: colorMap[timerColor] }}
        >
          {formatTime(tiempoRestante)}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-3">
      {/* Número de bloque */}
      <div className="mb-2">
        <span className="px-2 py-1 bg-primary-500/20 text-primary-400 rounded-full text-xs font-medium">
          Bloque #{numeroBloqueHoy}
        </span>
      </div>

      {/* Timer circular */}
      <div className="relative mb-4">
        <svg className="w-32 h-32 transform -rotate-90">
          {/* Fondo */}
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="#374151"
            strokeWidth="6"
            fill="none"
          />
          {/* Progreso */}
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke={colorMap[timerColor]}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            className="transition-all duration-500"
            style={{
              strokeDasharray: `${2 * Math.PI * 56}`,
              strokeDashoffset: `${2 * Math.PI * 56 * (1 - progress / 100)}`,
            }}
          />
        </svg>

        {/* Tiempo en el centro */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`text-3xl font-mono font-bold tabular-nums transition-colors ${
              timerState === 'running' && timerColor === 'red' ? 'animate-pulse' : ''
            }`}
            style={{ color: colorMap[timerColor] }}
          >
            {formatTime(tiempoRestante)}
          </span>
          <span className="text-[10px] text-dark-400 uppercase tracking-wider">
            {timerState === 'idle' && 'Listo'}
            {timerState === 'running' && 'En progreso'}
            {timerState === 'paused' && 'Pausado'}
            {timerState === 'finished' && 'Terminado!'}
          </span>
        </div>
      </div>

      {/* Controles principales */}
      <div className="flex items-center gap-2 mb-3">
        {timerState === 'running' ? (
          <button
            onClick={pausarTimer}
            className="p-3 rounded-full bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-all"
          >
            <Pause className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={iniciarTimer}
            className="p-3 rounded-full bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all shadow-lg shadow-green-500/20"
          >
            <Play className="w-5 h-5" />
          </button>
        )}

        <button
          onClick={handleReiniciar}
          className="p-3 rounded-full bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 transition-all"
          title="Guardar bloque y reiniciar"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          onClick={() => setConfigTimer({ sonidoFinal: !configTimer.sonidoFinal })}
          className={`p-2 rounded-full transition-all ${
            configTimer.sonidoFinal
              ? 'bg-primary-500/20 text-primary-400'
              : 'bg-dark-700 text-dark-500'
          }`}
        >
          {configTimer.sonidoFinal ? (
            <Volume2 className="w-4 h-4" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Presets de tiempo */}
      <div className="flex flex-wrap justify-center gap-1">
        {TIEMPOS_PRESET.map((mins) => (
          <button
            key={mins}
            onClick={() => setConfigTimer({ duracionMinutos: mins })}
            disabled={timerState === 'running'}
            className={`px-2 py-1 rounded text-xs font-medium transition-all no-drag ${
              configTimer.duracionMinutos === mins
                ? 'bg-primary-500 text-white'
                : 'bg-dark-700 text-dark-400 hover:text-white disabled:opacity-40'
            }`}
          >
            {mins}m
          </button>
        ))}
      </div>
    </div>
  );
};

export default Timer;
