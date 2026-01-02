import React, { useState } from 'react';
import { Download, RotateCcw, Sunrise, Play, Pause, RotateCw, Package, X, Settings } from 'lucide-react';
import { useAppStore, calcularTotDevoluciones } from '../../stores/appStore';
import { PROCESO_GUIAS, PROCESO_NOVEDAD } from '../../config/processConfig';
import BlocksModal from '../BlocksModal';

const WidgetLayout: React.FC = () => {
  const {
    procesoActivo,
    setProcesoActivo,
    contadoresGuias,
    contadoresNovedad,
    incrementarContador,
    decrementarContador,
    finalizarBloque,
    setMostrarModalExportar,
    numeroBloqueHoy,
    timerState,
    tiempoRestante,
    iniciarTimer,
    pausarTimer,
    resetearTimer,
    getTimerColor,
    iniciarNuevoDia,
    getBloquesHoy,
  } = useAppStore();

  const [showBloques, setShowBloques] = useState(false);
  const [confirmNuevoDia, setConfirmNuevoDia] = useState(false);

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

  // Totales
  const totalHoy = procesoActivo === 'guias'
    ? contadoresGuias.realizado
    : contadoresNovedad.novedadesSolucionadas;

  const bloquesHoy = getBloquesHoy();

  const handleNuevoDia = () => {
    if (confirmNuevoDia) {
      iniciarNuevoDia();
      setConfirmNuevoDia(false);
    } else {
      setConfirmNuevoDia(true);
      setTimeout(() => setConfirmNuevoDia(false), 3000);
    }
  };

  const handleIncrement = (id: string) => {
    incrementarContador(id);
  };

  const handleDecrement = (id: string) => {
    decrementarContador(id);
  };

  return (
    <div className="h-screen flex flex-col bg-dark-900 select-none">
      {/* Header compacto */}
      <div className="flex items-center justify-between px-3 py-2 bg-dark-800 border-b border-dark-700 drag-region">
        <div className="flex items-center gap-2 no-drag">
          <span className="text-sm font-bold text-primary-400">📦 LITPER</span>

          {/* Selector de proceso */}
          <div className="flex bg-dark-700 rounded-md p-0.5">
            <button
              onClick={() => setProcesoActivo('guias')}
              className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                procesoActivo === 'guias'
                  ? 'bg-primary-500 text-white'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              Guías
            </button>
            <button
              onClick={() => setProcesoActivo('novedad')}
              className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                procesoActivo === 'novedad'
                  ? 'bg-blue-500 text-white'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              Novedad
            </button>
          </div>
        </div>

        {/* Timer + controles */}
        <div className="flex items-center gap-2 no-drag">
          <div className="flex items-center gap-1 bg-dark-700/50 rounded-md px-2 py-1">
            <button
              onClick={timerState === 'running' ? pausarTimer : iniciarTimer}
              className="p-1 rounded hover:bg-dark-600 text-dark-400 hover:text-white"
            >
              {timerState === 'running' ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
            <span className={`font-mono text-sm font-bold ${colorClass}`}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
            <button
              onClick={resetearTimer}
              className="p-1 rounded hover:bg-dark-600 text-dark-400 hover:text-white"
            >
              <RotateCw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Contadores */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {proceso.grupos ? (
          // Novedad con grupos
          <div className="space-y-3">
            {proceso.grupos.map((grupo) => (
              <div key={grupo}>
                <div className="text-[10px] font-bold text-dark-500 uppercase tracking-wider mb-1">{grupo}</div>
                <div className="space-y-1">
                  {proceso.campos
                    .filter((c) => c.grupo === grupo)
                    .map((campo) => (
                      <div
                        key={campo.id}
                        className="flex items-center justify-between py-2 px-3 bg-dark-800/50 rounded-lg"
                        style={{ borderLeft: `3px solid ${campo.color}` }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{campo.icono}</span>
                          <span className="text-sm text-dark-300">{campo.labelCorto}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {!campo.esCalculado && (
                            <button
                              onClick={() => handleDecrement(campo.id)}
                              className="w-9 h-9 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 font-bold text-lg flex items-center justify-center transition-all active:scale-95"
                            >
                              −
                            </button>
                          )}
                          <span className={`min-w-[3rem] text-center text-xl font-bold tabular-nums ${campo.esCalculado ? 'text-pink-400' : 'text-white'}`}>
                            {getValor(campo.id)}
                          </span>
                          {!campo.esCalculado && (
                            <button
                              onClick={() => handleIncrement(campo.id)}
                              className="w-9 h-9 rounded-lg bg-green-500/20 hover:bg-green-500/40 text-green-400 font-bold text-lg flex items-center justify-center transition-all active:scale-95"
                            >
                              +
                            </button>
                          )}
                          {campo.esCalculado && (
                            <span className="text-[10px] text-dark-500 w-[76px] text-center">(auto)</span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Guías sin grupos
          <div className="space-y-1">
            {proceso.campos.map((campo) => (
              <div
                key={campo.id}
                className="flex items-center justify-between py-2 px-3 bg-dark-800/50 rounded-lg"
                style={{ borderLeft: `3px solid ${campo.color}` }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{campo.icono}</span>
                  <span className="text-sm text-dark-300">{campo.labelCorto}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDecrement(campo.id)}
                    className="w-9 h-9 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 font-bold text-lg flex items-center justify-center transition-all active:scale-95"
                  >
                    −
                  </button>
                  <span className="min-w-[3rem] text-center text-xl font-bold text-white tabular-nums">
                    {getValor(campo.id)}
                  </span>
                  <button
                    onClick={() => handleIncrement(campo.id)}
                    className="w-9 h-9 rounded-lg bg-green-500/20 hover:bg-green-500/40 text-green-400 font-bold text-lg flex items-center justify-center transition-all active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="px-3 py-2 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => finalizarBloque()}
            className="flex items-center justify-center gap-2 py-3 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-lg transition-all active:scale-98"
          >
            <RotateCcw className="w-5 h-5" />
            REINICIAR
          </button>
          <button
            onClick={() => setMostrarModalExportar(true)}
            className="flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-all active:scale-98"
          >
            <Download className="w-5 h-5" />
            EXPORTAR
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2 bg-dark-800 border-t border-dark-700 text-xs">
        <span className="text-dark-400">
          #{numeroBloqueHoy} • Hoy: <span className="text-white font-medium">{totalHoy}</span>
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBloques(true)}
            className="flex items-center gap-1 px-2 py-1 bg-dark-700 hover:bg-dark-600 text-dark-300 rounded transition-all"
          >
            <Package className="w-3 h-3" />
            Bloques ({bloquesHoy.length})
          </button>
          <button
            onClick={handleNuevoDia}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-all ${
              confirmNuevoDia
                ? 'bg-red-600 text-white'
                : 'bg-dark-700 text-dark-400 hover:text-white'
            }`}
          >
            <Sunrise className="w-3 h-3" />
            {confirmNuevoDia ? 'Confirmar' : 'Nuevo día'}
          </button>
        </div>
      </div>

      {/* Modal de bloques */}
      {showBloques && <BlocksModal onClose={() => setShowBloques(false)} />}
    </div>
  );
};

export default WidgetLayout;
