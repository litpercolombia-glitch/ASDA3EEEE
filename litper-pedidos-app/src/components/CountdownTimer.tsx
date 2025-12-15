import React, { useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useAppStore, TIEMPOS_PRESET, TimerColor } from '../stores/appStore';

const CountdownTimer: React.FC = () => {
  const {
    configTimer,
    timerState,
    tiempoRestante,
    rondaActual,
    iniciarTimer,
    pausarTimer,
    resetearTimer,
    tick,
    setConfigTimer,
    getTimerColor,
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

  // Obtener color actual
  const timerColor = getTimerColor();

  // Calcular progreso (0-100)
  const totalSeconds = configTimer.duracionMinutos * 60;
  const progress = (tiempoRestante / totalSeconds) * 100;

  // Clases de color
  const colorClasses: Record<TimerColor, { text: string; bg: string; ring: string; shadow: string }> = {
    green: {
      text: 'text-accent-green',
      bg: 'bg-accent-green',
      ring: 'ring-accent-green',
      shadow: 'shadow-glow-green',
    },
    yellow: {
      text: 'text-accent-yellow',
      bg: 'bg-accent-yellow',
      ring: 'ring-accent-yellow',
      shadow: 'shadow-[0_0_20px_rgba(245,158,11,0.4)]',
    },
    orange: {
      text: 'text-primary-500',
      bg: 'bg-primary-500',
      ring: 'ring-primary-500',
      shadow: 'shadow-glow',
    },
    red: {
      text: 'text-accent-red',
      bg: 'bg-accent-red',
      ring: 'ring-accent-red',
      shadow: 'shadow-glow-red',
    },
  };

  const colors = colorClasses[timerColor];

  return (
    <div className="flex flex-col items-center py-4">
      {/* Número de ronda */}
      <div className="mb-2">
        <span className="badge badge-primary">Ronda #{rondaActual}</span>
      </div>

      {/* Timer circular */}
      <div className="relative mb-6">
        {/* SVG circular */}
        <svg className="w-44 h-44 transform -rotate-90">
          {/* Fondo */}
          <circle
            cx="88"
            cy="88"
            r="78"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-dark-700"
          />
          {/* Progreso */}
          <circle
            cx="88"
            cy="88"
            r="78"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            className={`${colors.text} transition-all duration-1000`}
            style={{
              strokeDasharray: `${2 * Math.PI * 78}`,
              strokeDashoffset: `${2 * Math.PI * 78 * (1 - progress / 100)}`,
            }}
          />
        </svg>

        {/* Tiempo en el centro */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`text-5xl font-mono font-bold ${colors.text} tabular-nums ${
              timerState === 'running' && timerColor === 'red' ? 'animate-countdown' : ''
            }`}
          >
            {formatTime(tiempoRestante)}
          </span>
          <span className="text-xs text-dark-400 mt-1 uppercase tracking-wider">
            {timerState === 'idle' && 'Listo'}
            {timerState === 'running' && 'En progreso'}
            {timerState === 'paused' && 'Pausado'}
            {timerState === 'finished' && 'Terminado'}
          </span>
        </div>

        {/* Ring animado cuando está corriendo */}
        {timerState === 'running' && (
          <div
            className={`absolute inset-2 rounded-full ring-2 ${colors.ring} animate-pulse-ring opacity-30`}
          />
        )}
      </div>

      {/* Controles principales */}
      <div className="flex items-center gap-3 mb-4">
        {timerState === 'running' ? (
          <button
            onClick={pausarTimer}
            className={`p-4 rounded-full ${colors.bg}/20 ${colors.text} hover:${colors.bg}/30 transition-all ${colors.shadow}`}
          >
            <Pause className="w-7 h-7" />
          </button>
        ) : (
          <button
            onClick={iniciarTimer}
            className="p-4 rounded-full bg-accent-green/20 text-accent-green hover:bg-accent-green/30 transition-all shadow-glow-green"
          >
            <Play className="w-7 h-7" />
          </button>
        )}

        <button
          onClick={resetearTimer}
          className="p-3 rounded-full bg-dark-700 text-dark-300 hover:bg-dark-600 hover:text-white transition-all"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          onClick={() => setConfigTimer({ sonidoFinal: !configTimer.sonidoFinal })}
          className={`p-3 rounded-full transition-all ${
            configTimer.sonidoFinal
              ? 'bg-primary-500/20 text-primary-400'
              : 'bg-dark-700 text-dark-500'
          }`}
        >
          {configTimer.sonidoFinal ? (
            <Volume2 className="w-5 h-5" />
          ) : (
            <VolumeX className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Presets de tiempo */}
      <div className="flex flex-wrap justify-center gap-2 mb-3">
        {TIEMPOS_PRESET.map((mins) => (
          <button
            key={mins}
            onClick={() => setConfigTimer({ duracionMinutos: mins })}
            disabled={timerState === 'running'}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all no-drag ${
              configTimer.duracionMinutos === mins
                ? 'bg-primary-500 text-white'
                : 'bg-dark-700 text-dark-300 hover:bg-dark-600 disabled:opacity-40'
            }`}
          >
            {mins}m
          </button>
        ))}
      </div>

      {/* Indicadores de alerta */}
      <div className="flex items-center gap-4 text-xs text-dark-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-accent-yellow" />
          {configTimer.alertaAmarilla}%
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-primary-500" />
          {configTimer.alertaNaranja}%
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-accent-red" />
          {configTimer.alertaRoja}%
        </span>
      </div>
    </div>
  );
};

export default CountdownTimer;
