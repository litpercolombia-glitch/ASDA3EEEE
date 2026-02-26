import React, { useState, useEffect } from 'react';
import { useTrackerStore, NIVELES } from '../stores/trackerStore';
import { Plus, Minus, X, Maximize2, Save } from 'lucide-react';

const BarMode: React.FC = () => {
  const {
    procesoActual,
    usuarioActual,
    tiempoRestante,
    tiempoTotal,
    estadoTimer,
    tiempoTranscurrido,
    estadoStopwatch,
    valoresGuias,
    valoresNovedades,
    incrementarGuias,
    decrementarGuias,
    incrementarNovedades,
    decrementarNovedades,
    iniciarTimer,
    pausarTimer,
    iniciarStopwatch,
    pausarStopwatch,
    setModo,
    guardarRonda,
    userStats,
  } = useTrackerStore();

  const [xpAnimation, setXpAnimation] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const handleClose = () => {
    window.electronAPI?.close();
  };

  // Formatear tiempo
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Determinar si estamos en Guías o Novedades
  const esGuias = procesoActual === 'guias';
  const esNovedades = procesoActual === 'novedades';

  // Color del proceso
  const getProcesoColor = () => {
    if (esGuias) return 'from-emerald-600 to-emerald-500';
    if (esNovedades) return 'from-orange-600 to-orange-500';
    return 'from-slate-600 to-slate-500';
  };

  // Letra del proceso
  const getProcesoLetra = () => {
    if (esGuias) return 'G';
    if (esNovedades) return 'N';
    return '?';
  };

  // Valor principal a mostrar
  const getValorPrincipal = () => {
    if (esGuias) return valoresGuias.realizado;
    if (esNovedades) return valoresNovedades.solucionadas;
    return 0;
  };

  // Tiempo a mostrar
  const getTiempo = () => {
    if (esGuias) return formatTime(tiempoRestante);
    if (esNovedades) return formatTime(tiempoTranscurrido);
    return '00:00';
  };

  // Color del timer según estado
  const getTimerColor = () => {
    if (esGuias) {
      const percentage = (tiempoRestante / tiempoTotal) * 100;
      if (estadoTimer === 'finished') return 'text-red-400 animate-pulse';
      if (percentage > 50) return 'text-emerald-400';
      if (percentage > 25) return 'text-amber-400';
      return 'text-orange-400';
    }
    if (esNovedades) {
      if (estadoStopwatch === 'running') return 'text-orange-400';
      return 'text-slate-400';
    }
    return 'text-slate-400';
  };

  // Toggle timer/stopwatch
  const toggleTiempo = () => {
    if (esGuias) {
      if (estadoTimer === 'running') {
        pausarTimer();
      } else {
        iniciarTimer();
      }
    } else if (esNovedades) {
      if (estadoStopwatch === 'running') {
        pausarStopwatch();
      } else {
        iniciarStopwatch();
      }
    }
  };

  // Incrementar valor principal
  const handleIncrement = () => {
    if (esGuias) incrementarGuias('realizado');
    else if (esNovedades) incrementarNovedades('solucionadas');
  };

  // Decrementar valor principal
  const handleDecrement = () => {
    if (esGuias) decrementarGuias('realizado');
    else if (esNovedades) decrementarNovedades('solucionadas');
  };

  // Guardar con animación
  const handleSave = async () => {
    setSaving(true);
    const xpAntes = userStats.xp;
    await guardarRonda();
    const xpDespues = useTrackerStore.getState().userStats.xp;
    const xpGanado = xpDespues - xpAntes;
    if (xpGanado > 0) {
      setXpAnimation(xpGanado);
      setTimeout(() => setXpAnimation(null), 1500);
    }
    setTimeout(() => setSaving(false), 500);
  };

  // Estado activo del timer
  const isRunning = esGuias ? estadoTimer === 'running' : estadoStopwatch === 'running';

  // Nivel actual
  const nivelActual = NIVELES.find(n => n.id === userStats.nivel) || NIVELES[0];

  return (
    <div className="h-full w-full bg-gradient-to-r from-dark-900 via-dark-800 to-dark-900 flex items-center gap-1.5 px-2 border border-dark-600 rounded-lg drag-region relative overflow-hidden">
      {/* Efecto de brillo de fondo */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse opacity-30" />

      {/* Indicador de proceso con gradiente */}
      <div
        className={`w-7 h-7 bg-gradient-to-br ${getProcesoColor()} rounded-md flex items-center justify-center text-white font-bold text-sm no-drag cursor-pointer shadow-lg transition-transform hover:scale-110`}
        onClick={() => setModo('normal')}
        title="Expandir a modo normal"
      >
        {getProcesoLetra()}
      </div>

      {/* Usuario */}
      {usuarioActual && (
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-sm shadow-md"
          style={{ backgroundColor: usuarioActual.color + '40', boxShadow: `0 0 8px ${usuarioActual.color}40` }}
          title={usuarioActual.nombre}
        >
          {usuarioActual.avatar}
        </div>
      )}

      {/* Timer/Stopwatch */}
      <button
        onClick={toggleTiempo}
        className={`font-mono text-sm font-bold ${getTimerColor()} no-drag px-1.5 py-0.5 hover:bg-dark-700/50 rounded transition-all ${isRunning ? 'animate-pulse' : 'opacity-80'}`}
        title={isRunning ? 'Pausar' : 'Iniciar'}
      >
        {getTiempo()}
      </button>

      {/* Separador con gradiente */}
      <div className="w-px h-5 bg-gradient-to-b from-transparent via-dark-500 to-transparent" />

      {/* Contador principal con botones */}
      <div className="flex items-center gap-1 no-drag">
        <button
          onClick={handleDecrement}
          className="w-6 h-6 flex items-center justify-center bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-md transition-all hover:scale-110 active:scale-95"
        >
          <Minus size={12} />
        </button>

        <span className="text-white font-bold text-base min-w-[28px] text-center">
          {getValorPrincipal()}
        </span>

        <button
          onClick={handleIncrement}
          className="w-6 h-6 flex items-center justify-center bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 rounded-md transition-all hover:scale-110 active:scale-95"
        >
          <Plus size={12} />
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Nivel mini */}
      <div className="flex items-center gap-1 text-[10px]">
        <span>{nivelActual.icon}</span>
        <span className="text-purple-400">{userStats.xp}xp</span>
      </div>

      {/* XP Animation */}
      {xpAnimation && (
        <div className="absolute left-1/2 -translate-x-1/2 text-amber-400 font-bold text-sm animate-xp-float">
          +{xpAnimation} XP
        </div>
      )}

      {/* Guardar con animación */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`flex items-center gap-1 px-2 py-1 rounded-md no-drag transition-all ${
          saving
            ? 'bg-emerald-500 text-white scale-95'
            : 'bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 hover:scale-105'
        }`}
        title="Guardar ronda"
      >
        <Save size={10} />
        <span className="text-[10px] font-bold">{saving ? '✓' : 'SAVE'}</span>
      </button>

      {/* Expandir */}
      <button
        onClick={() => setModo('normal')}
        className="p-1 hover:bg-dark-700 rounded text-slate-400 hover:text-white no-drag transition-all hover:scale-110"
        title="Expandir"
      >
        <Maximize2 size={12} />
      </button>

      {/* Cerrar */}
      <button
        onClick={handleClose}
        className="p-1 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400 no-drag transition-all"
        title="Cerrar"
      >
        <X size={12} />
      </button>
    </div>
  );
};

export default BarMode;
