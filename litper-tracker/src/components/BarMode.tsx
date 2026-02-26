import React from 'react';
import { useTrackerStore } from '../stores/trackerStore';
import { Plus, Minus, X, Maximize2 } from 'lucide-react';

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
  } = useTrackerStore();

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
    if (esGuias) return 'bg-emerald-500';
    if (esNovedades) return 'bg-orange-500';
    return 'bg-slate-500';
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

  // Estado activo del timer
  const isRunning = esGuias ? estadoTimer === 'running' : estadoStopwatch === 'running';

  return (
    <div className="h-full w-full bg-dark-800 flex items-center gap-1 px-1 border border-dark-600 rounded-lg drag-region">
      {/* Indicador de proceso */}
      <div
        className={`w-6 h-6 ${getProcesoColor()} rounded flex items-center justify-center text-white font-bold text-xs no-drag cursor-pointer`}
        onClick={() => setModo('normal')}
        title="Expandir a modo normal"
      >
        {getProcesoLetra()}
      </div>

      {/* Usuario inicial */}
      {usuarioActual && (
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
          style={{ backgroundColor: usuarioActual.color + '40' }}
          title={usuarioActual.nombre}
        >
          {usuarioActual.avatar}
        </div>
      )}

      {/* Timer/Stopwatch - clickeable para pausar/iniciar */}
      <button
        onClick={toggleTiempo}
        className={`font-mono text-sm font-bold ${getTimerColor()} no-drag px-1 hover:bg-dark-700 rounded transition-colors ${isRunning ? '' : 'opacity-70'}`}
        title={isRunning ? 'Pausar' : 'Iniciar'}
      >
        {getTiempo()}
      </button>

      {/* Separador */}
      <div className="w-px h-4 bg-dark-600" />

      {/* Contador principal con botones */}
      <div className="flex items-center gap-0.5 no-drag">
        <button
          onClick={handleDecrement}
          className="w-5 h-5 flex items-center justify-center bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded transition-colors"
        >
          <Minus size={10} />
        </button>

        <span className="text-white font-bold text-sm min-w-[24px] text-center">
          {getValorPrincipal()}
        </span>

        <button
          onClick={handleIncrement}
          className="w-5 h-5 flex items-center justify-center bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 rounded transition-colors"
        >
          <Plus size={10} />
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Guardar rápido */}
      <button
        onClick={guardarRonda}
        className="px-1.5 py-0.5 bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 text-[10px] font-bold rounded no-drag transition-colors"
        title="Guardar ronda"
      >
        SAVE
      </button>

      {/* Expandir */}
      <button
        onClick={() => setModo('normal')}
        className="p-0.5 hover:bg-dark-700 rounded text-slate-400 hover:text-white no-drag transition-colors"
        title="Expandir"
      >
        <Maximize2 size={10} />
      </button>

      {/* Cerrar */}
      <button
        onClick={handleClose}
        className="p-0.5 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400 no-drag transition-colors"
        title="Cerrar"
      >
        <X size={10} />
      </button>
    </div>
  );
};

export default BarMode;
