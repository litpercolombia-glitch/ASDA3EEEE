import React from 'react';
import { Download, RotateCcw, Play, Pause } from 'lucide-react';
import { useAppStore, calcularTotDevoluciones } from '../../stores/appStore';
import { PROCESO_GUIAS, PROCESO_NOVEDAD } from '../../config/processConfig';
import ViewSwitcher from '../ViewSwitcher';

const CompactLayout: React.FC = () => {
  const {
    procesoActivo,
    setProcesoActivo,
    contadoresGuias,
    contadoresNovedad,
    incrementarContador,
    decrementarContador,
    finalizarBloque,
    setMostrarModalExportar,
    timerState,
    tiempoRestante,
    iniciarTimer,
    pausarTimer,
    getTimerColor,
    numeroBloqueHoy,
  } = useAppStore();

  const proceso = procesoActivo === 'guias' ? PROCESO_GUIAS : PROCESO_NOVEDAD;
  const contadores = procesoActivo === 'guias' ? contadoresGuias : contadoresNovedad;

  const getValor = (campoId: string): number => {
    if (campoId === 'totDevoluciones' && procesoActivo === 'novedad') {
      return calcularTotDevoluciones(contadoresNovedad);
    }
    return (contadores as any)[campoId] || 0;
  };

  // Timer
  const minutes = Math.floor(tiempoRestante / 60);
  const seconds = tiempoRestante % 60;
  const timerColor = getTimerColor();
  const colorClass = {
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    orange: 'text-orange-400',
    red: 'text-red-400 animate-pulse',
  }[timerColor];

  return (
    <div className="h-screen flex items-center bg-dark-900 px-3 drag-region">
      <div className="flex items-center gap-2 w-full no-drag">
        {/* Logo y proceso */}
        <span className="text-sm font-bold text-primary-400">📦</span>

        {/* Selector proceso compacto */}
        <div className="flex items-center bg-dark-700 rounded p-0.5">
          <button
            onClick={() => setProcesoActivo('guias')}
            className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-all ${
              procesoActivo === 'guias'
                ? 'bg-primary-500 text-white'
                : 'text-dark-400'
            }`}
          >
            G
          </button>
          <button
            onClick={() => setProcesoActivo('novedad')}
            className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-all ${
              procesoActivo === 'novedad'
                ? 'bg-blue-500 text-white'
                : 'text-dark-400'
            }`}
          >
            N
          </button>
        </div>

        {/* Timer mini */}
        <div className="flex items-center gap-1 bg-dark-700/50 rounded px-1.5 py-0.5">
          <button
            onClick={timerState === 'running' ? pausarTimer : iniciarTimer}
            className="text-dark-400 hover:text-white"
          >
            {timerState === 'running' ? (
              <Pause className="w-3 h-3" />
            ) : (
              <Play className="w-3 h-3" />
            )}
          </button>
          <span className={`font-mono text-xs font-bold ${colorClass}`}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>

        {/* Contadores mini */}
        <div className="flex items-center gap-1 flex-1 overflow-x-auto">
          {proceso.campos.slice(0, 6).map((campo) => (
            <div
              key={campo.id}
              className="flex items-center gap-0.5 bg-dark-700/50 rounded px-1.5 py-0.5 group"
              style={{ borderLeft: `2px solid ${campo.color}` }}
            >
              <button
                onClick={() => decrementarContador(campo.id)}
                className="text-dark-500 hover:text-red-400 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={campo.esCalculado}
              >
                -
              </button>
              <span className="text-[10px] text-dark-400">{campo.icono}</span>
              <span className="text-xs font-bold text-white min-w-[16px] text-center">
                {getValor(campo.id)}
              </span>
              <button
                onClick={() => incrementarContador(campo.id)}
                className="text-dark-500 hover:text-green-400 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={campo.esCalculado}
              >
                +
              </button>
            </div>
          ))}
        </div>

        {/* Bloque # */}
        <span className="text-[10px] text-dark-500">#{numeroBloqueHoy}</span>

        {/* Acciones */}
        <button
          onClick={() => finalizarBloque()}
          className="p-1 bg-primary-600 hover:bg-primary-500 text-white rounded transition-all"
          title="Reiniciar (R)"
        >
          <RotateCcw className="w-3 h-3" />
        </button>

        <button
          onClick={() => setMostrarModalExportar(true)}
          className="p-1 bg-green-600/20 text-green-400 hover:bg-green-600/30 rounded transition-all"
          title="Exportar (E)"
        >
          <Download className="w-3 h-3" />
        </button>

        {/* View switcher mini */}
        <ViewSwitcher compact />
      </div>
    </div>
  );
};

export default CompactLayout;
