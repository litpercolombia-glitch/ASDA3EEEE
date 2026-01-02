import React, { useState, useEffect } from 'react';
import { Download, RotateCcw, Sunrise, Play, Pause, RotateCw, Package, Settings, User } from 'lucide-react';
import { useAppStore, calcularTotDevoluciones } from '../../stores/appStore';
import { PROCESO_GUIAS, PROCESO_NOVEDAD } from '../../config/processConfig';
import BlocksModal from '../BlocksModal';
import SettingsModal from '../SettingsModal';

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
    tick,
    usuarioActual,
  } = useAppStore();

  const [showBloques, setShowBloques] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [confirmNuevoDia, setConfirmNuevoDia] = useState(false);

  // Timer tick cada segundo
  useEffect(() => {
    if (timerState !== 'running') return;
    const interval = setInterval(() => {
      tick();
    }, 1000);
    return () => clearInterval(interval);
  }, [timerState, tick]);

  const proceso = procesoActivo === 'guias' ? PROCESO_GUIAS : PROCESO_NOVEDAD;
  const contadores = procesoActivo === 'guias' ? contadoresGuias : contadoresNovedad;

  const getValor = (campoId: string): number => {
    if (campoId === 'totDevoluciones' && procesoActivo === 'novedad') {
      return calcularTotDevoluciones(contadoresNovedad);
    }
    return (contadores as any)[campoId] || 0;
  };

  // Letras de referencia para cada campo
  const getLetra = (campoId: string): string => {
    const letras: Record<string, string> = {
      // Guías
      realizado: 'R',
      cancelados: 'C',
      agendados: 'A',
      dificiles: 'D',
      pedidoPendiente: 'P',
      revisado: 'V',
      // Novedad
      novedadesIniciales: 'I',
      novedadesSolucionadas: 'S',
      novedadesRevisadas: 'R',
      novedadesFinalePendientes: 'F',
      devolucionLitper: 'L',
      devolucion3Intentos: 'T',
      devolucionErrorTransportadora: 'E',
      devolucionProveedor: 'O',
      totDevoluciones: 'Σ',
    };
    return letras[campoId] || '?';
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

  return (
    <div className="h-screen flex flex-col bg-dark-900 select-none">
      {/* Header compacto */}
      <div className="flex items-center justify-between px-2 py-1.5 bg-dark-800 border-b border-dark-700 drag-region">
        <div className="flex items-center gap-2 no-drag">
          <span className="text-xs font-bold text-primary-400">LITPER</span>

          {/* Usuario */}
          <div className="flex items-center gap-1 text-[10px] text-dark-400">
            <User className="w-3 h-3" />
            <span>{usuarioActual?.nombre || 'Sin usuario'}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 no-drag">
          {/* Selector de proceso */}
          <div className="flex bg-dark-700 rounded p-0.5">
            <button
              onClick={() => setProcesoActivo('guias')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-all ${
                procesoActivo === 'guias'
                  ? 'bg-primary-500 text-white'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              Guías
            </button>
            <button
              onClick={() => setProcesoActivo('novedad')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-all ${
                procesoActivo === 'novedad'
                  ? 'bg-blue-500 text-white'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              Novedad
            </button>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-0.5 bg-dark-700/50 rounded px-1.5 py-0.5">
            <button
              onClick={timerState === 'running' ? pausarTimer : iniciarTimer}
              className="p-0.5 rounded hover:bg-dark-600 text-dark-400 hover:text-white"
            >
              {timerState === 'running' ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
            <span className={`font-mono text-xs font-bold ${colorClass}`}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
            <button
              onClick={resetearTimer}
              className="p-0.5 rounded hover:bg-dark-600 text-dark-400 hover:text-white"
            >
              <RotateCw className="w-3 h-3" />
            </button>
          </div>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-1 rounded hover:bg-dark-700 text-dark-400 hover:text-white"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Contadores */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {proceso.grupos ? (
          // Novedad con grupos
          <div className="space-y-2">
            {proceso.grupos.map((grupo) => (
              <div key={grupo}>
                <div className="text-[9px] font-bold text-dark-500 uppercase tracking-wider mb-0.5 px-1">{grupo}</div>
                <div className="space-y-0.5">
                  {proceso.campos
                    .filter((c) => c.grupo === grupo)
                    .map((campo) => (
                      <div
                        key={campo.id}
                        className="flex items-center justify-between py-1 px-2 bg-dark-800/50 rounded"
                        style={{ borderLeft: `2px solid ${campo.color}` }}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-dark-500 w-3">{getLetra(campo.id)}</span>
                          <span className="text-sm">{campo.icono}</span>
                          <span className="text-xs text-dark-300">{campo.labelCorto}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {!campo.esCalculado && (
                            <button
                              onClick={() => decrementarContador(campo.id)}
                              className="w-7 h-7 rounded bg-red-500/20 hover:bg-red-500/40 text-red-400 font-bold text-sm flex items-center justify-center transition-all active:scale-95"
                            >
                              −
                            </button>
                          )}
                          <span className={`min-w-[2.5rem] text-center text-lg font-bold tabular-nums ${campo.esCalculado ? 'text-pink-400' : 'text-white'}`}>
                            {getValor(campo.id)}
                          </span>
                          {!campo.esCalculado && (
                            <button
                              onClick={() => incrementarContador(campo.id)}
                              className="w-7 h-7 rounded bg-green-500/20 hover:bg-green-500/40 text-green-400 font-bold text-sm flex items-center justify-center transition-all active:scale-95"
                            >
                              +
                            </button>
                          )}
                          {campo.esCalculado && (
                            <span className="text-[8px] text-dark-500 w-[60px] text-center">(auto)</span>
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
          <div className="space-y-0.5">
            {proceso.campos.map((campo) => (
              <div
                key={campo.id}
                className="flex items-center justify-between py-1 px-2 bg-dark-800/50 rounded"
                style={{ borderLeft: `2px solid ${campo.color}` }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-dark-500 w-3">{getLetra(campo.id)}</span>
                  <span className="text-sm">{campo.icono}</span>
                  <span className="text-xs text-dark-300">{campo.labelCorto}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => decrementarContador(campo.id)}
                    className="w-7 h-7 rounded bg-red-500/20 hover:bg-red-500/40 text-red-400 font-bold text-sm flex items-center justify-center transition-all active:scale-95"
                  >
                    −
                  </button>
                  <span className="min-w-[2.5rem] text-center text-lg font-bold text-white tabular-nums">
                    {getValor(campo.id)}
                  </span>
                  <button
                    onClick={() => incrementarContador(campo.id)}
                    className="w-7 h-7 rounded bg-green-500/20 hover:bg-green-500/40 text-green-400 font-bold text-sm flex items-center justify-center transition-all active:scale-95"
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
      <div className="px-2 py-1.5">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => finalizarBloque()}
            className="flex items-center justify-center gap-1.5 py-2 bg-primary-600 hover:bg-primary-500 text-white font-semibold text-sm rounded transition-all active:scale-98"
          >
            <RotateCcw className="w-4 h-4" />
            REINICIAR
          </button>
          <button
            onClick={() => setMostrarModalExportar(true)}
            className="flex items-center justify-center gap-1.5 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold text-sm rounded transition-all active:scale-98"
          >
            <Download className="w-4 h-4" />
            EXPORTAR
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-2 py-1 bg-dark-800 border-t border-dark-700 text-[10px]">
        <span className="text-dark-400">
          #{numeroBloqueHoy} • Hoy: <span className="text-white font-medium">{totalHoy}</span>
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowBloques(true)}
            className="flex items-center gap-1 px-1.5 py-0.5 bg-dark-700 hover:bg-dark-600 text-dark-300 rounded transition-all"
          >
            <Package className="w-3 h-3" />
            Bloques ({bloquesHoy.length})
          </button>
          <button
            onClick={handleNuevoDia}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-all ${
              confirmNuevoDia
                ? 'bg-red-600 text-white'
                : 'bg-dark-700 text-dark-400 hover:text-white'
            }`}
          >
            <Sunrise className="w-3 h-3" />
            {confirmNuevoDia ? 'OK?' : 'Nuevo'}
          </button>
        </div>
      </div>

      {/* Modales */}
      {showBloques && <BlocksModal onClose={() => setShowBloques(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default WidgetLayout;
