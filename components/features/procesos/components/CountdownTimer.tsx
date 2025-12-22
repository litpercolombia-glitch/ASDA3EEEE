/**
 * COUNTDOWN TIMER COMPONENT
 * Cronómetro regresivo con colores de alerta
 */

import React, { useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Settings, Volume2, VolumeX } from 'lucide-react';
import { useProcesosStore } from '../stores/procesosStore';
import { ColorCronometro } from '../types';

interface CountdownTimerProps {
  onFinish?: () => void;
  className?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ onFinish, className = '' }) => {
  const {
    configCronometro,
    estadoCronometro,
    tiempoRestante,
    iniciarCronometro,
    pausarCronometro,
    resetearCronometro,
    tick,
    configurarCronometro,
  } = useProcesosStore();

  // Tick interval
  useEffect(() => {
    if (estadoCronometro !== 'running') return;

    const interval = setInterval(() => {
      tick();
    }, 1000);

    return () => clearInterval(interval);
  }, [estadoCronometro, tick]);

  // Handle finish
  useEffect(() => {
    if (estadoCronometro === 'finished') {
      onFinish?.();

      // Play sound if enabled
      if (configCronometro.sonidoFinal) {
        playFinishSound();
      }

      // Vibrate if enabled and supported
      if (configCronometro.vibracion && navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }
    }
  }, [estadoCronometro, configCronometro, onFinish]);

  const playFinishSound = useCallback(() => {
    // Create a simple beep sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.log('Audio not supported');
    }
  }, []);

  // Calculate color based on time remaining
  const getTimerColor = (): ColorCronometro => {
    const totalSeconds = configCronometro.duracionMinutos * 60;
    const percentRemaining = (tiempoRestante / totalSeconds) * 100;

    if (percentRemaining <= configCronometro.alertaRoja) return 'red';
    if (percentRemaining <= configCronometro.alertaNaranja) return 'orange';
    if (percentRemaining <= configCronometro.alertaAmarilla) return 'yellow';
    return 'green';
  };

  const colorClasses: Record<ColorCronometro, { bg: string; text: string; ring: string; glow: string }> = {
    green: {
      bg: 'bg-emerald-500/20',
      text: 'text-emerald-400',
      ring: 'ring-emerald-500',
      glow: 'shadow-emerald-500/50',
    },
    yellow: {
      bg: 'bg-yellow-500/20',
      text: 'text-yellow-400',
      ring: 'ring-yellow-500',
      glow: 'shadow-yellow-500/50',
    },
    orange: {
      bg: 'bg-orange-500/20',
      text: 'text-orange-400',
      ring: 'ring-orange-500',
      glow: 'shadow-orange-500/50',
    },
    red: {
      bg: 'bg-red-500/20',
      text: 'text-red-400',
      ring: 'ring-red-500',
      glow: 'shadow-red-500/50',
    },
  };

  const color = getTimerColor();
  const colors = colorClasses[color];

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress
  const progress = (tiempoRestante / (configCronometro.duracionMinutos * 60)) * 100;

  // Quick time presets
  const timePresets = [15, 20, 25, 30, 45];

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Timer Circle */}
      <div className="relative mb-6">
        {/* Background circle */}
        <svg className="w-48 h-48 transform -rotate-90">
          <circle
            cx="96"
            cy="96"
            r="88"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-slate-700"
          />
          {/* Progress circle */}
          <circle
            cx="96"
            cy="96"
            r="88"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            className={`${colors.text} transition-all duration-1000`}
            style={{
              strokeDasharray: `${2 * Math.PI * 88}`,
              strokeDashoffset: `${2 * Math.PI * 88 * (1 - progress / 100)}`,
            }}
          />
        </svg>

        {/* Time display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-5xl font-bold ${colors.text} tabular-nums`}>
            {formatTime(tiempoRestante)}
          </span>
          <span className="text-sm text-slate-400 mt-1">
            {estadoCronometro === 'running' && 'En progreso'}
            {estadoCronometro === 'paused' && 'Pausado'}
            {estadoCronometro === 'finished' && 'Finalizado'}
            {estadoCronometro === 'idle' && 'Listo'}
          </span>
        </div>

        {/* Animated ring when running */}
        {estadoCronometro === 'running' && (
          <div className={`absolute inset-0 rounded-full ring-4 ${colors.ring} animate-pulse opacity-30`} />
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 mb-4">
        {estadoCronometro === 'running' ? (
          <button
            onClick={pausarCronometro}
            className={`p-4 rounded-full ${colors.bg} ${colors.text} hover:opacity-80 transition-all shadow-lg ${colors.glow}`}
          >
            <Pause className="w-8 h-8" />
          </button>
        ) : (
          <button
            onClick={iniciarCronometro}
            className={`p-4 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all shadow-lg shadow-emerald-500/30`}
          >
            <Play className="w-8 h-8" />
          </button>
        )}

        <button
          onClick={resetearCronometro}
          className="p-3 rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
        >
          <RotateCcw className="w-6 h-6" />
        </button>

        <button
          onClick={() => configurarCronometro({ sonidoFinal: !configCronometro.sonidoFinal })}
          className={`p-3 rounded-full transition-colors ${
            configCronometro.sonidoFinal
              ? 'bg-amber-500/20 text-amber-400'
              : 'bg-slate-700 text-slate-500'
          }`}
        >
          {configCronometro.sonidoFinal ? (
            <Volume2 className="w-6 h-6" />
          ) : (
            <VolumeX className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Time Presets */}
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {timePresets.map((minutes) => (
          <button
            key={minutes}
            onClick={() => configurarCronometro({ duracionMinutos: minutes })}
            disabled={estadoCronometro === 'running'}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
              configCronometro.duracionMinutos === minutes
                ? 'bg-amber-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50'
            }`}
          >
            {minutes} min
          </button>
        ))}
      </div>

      {/* Alert Thresholds Info */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-500" />
          {configCronometro.alertaAmarilla}%
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          {configCronometro.alertaNaranja}%
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          {configCronometro.alertaRoja}%
        </span>
      </div>
    </div>
  );
};

export default CountdownTimer;
