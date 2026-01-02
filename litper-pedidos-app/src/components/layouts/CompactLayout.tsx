import React, { useEffect, useState } from 'react';
import { Download, RotateCcw, Play, Pause, Settings, RotateCw, Save } from 'lucide-react';
import { useAppStore, calcularTotDevoluciones } from '../../stores/appStore';
import { PROCESO_GUIAS, PROCESO_NOVEDAD } from '../../config/processConfig';
import ViewSwitcher from '../ViewSwitcher';
import SettingsModal from '../SettingsModal';
import BlocksModal from '../BlocksModal';

// Barra Lateral Vertical DELGADA - FUNCIONAL con TODOS los estatus
const CompactLayout: React.FC = () => {
  const {
    procesoActivo,
    setProcesoActivo,
    contadoresGuias,
    contadoresNovedad,
    incrementarContador,
    decrementarContador,
    finalizarBloque,
    guardarRonda,
    setMostrarModalExportar,
    timerState,
    tiempoRestante,
    iniciarTimer,
    pausarTimer,
    resetearTimer,
    getTimerColor,
    numeroBloqueHoy,
    tick,
    usuarioActual,
    getBloquesHoy,
    iniciarNuevoDia,
  } = useAppStore();

  const [showSettings, setShowSettings] = useState(false);
  const [showBloques, setShowBloques] = useState(false);
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

  // Letras de referencia
  const getLetra = (campoId: string): string => {
    const letras: Record<string, string> = {
      realizado: 'R', cancelados: 'C', agendados: 'A', dificiles: 'D', pedidoPendiente: 'P', revisado: 'V',
      novedadesIniciales: 'I', novedadesSolucionadas: 'S', novedadesRevisadas: 'R', novedadesFinalePendientes: 'F',
      devolucionLitper: 'L', devolucion3Intentos: 'T', devolucionErrorTransportadora: 'E', devolucionProveedor: 'O',
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
    <div className="h-screen w-full flex flex-col bg-dark-900 select-none">
      {/* Header compacto */}
      <div className="px-1 py-1.5 bg-dark-800 border-b border-dark-700 drag-region">
        <div className="flex items-center justify-between no-drag">
          {usuarioActual ? (
            <div className="flex items-center gap-1">
              <span className="text-base" style={{ color: usuarioActual.color }}>{usuarioActual.avatar}</span>
              <span className="text-[9px] text-dark-400">#{numeroBloqueHoy}</span>
            </div>
          ) : (
            <span className="text-sm">👤</span>
          )}
          <ViewSwitcher compact />
        </div>
      </div>

      {/* Timer */}
      <div className="px-1 py-2 bg-dark-800/50 border-b border-dark-700 text-center">
        <span className={`font-mono text-xl font-bold ${colorClass}`}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
        <div className="flex items-center justify-center gap-1 mt-1">
          <button
            onClick={timerState === 'running' ? pausarTimer : iniciarTimer}
            className={`p-1 rounded transition-all ${
              timerState === 'running' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
            }`}
          >
            {timerState === 'running' ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </button>
          <button onClick={resetearTimer} className="p-1 rounded bg-dark-700 text-dark-400 hover:text-white">
            <RotateCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Selector Proceso */}
      <div className="px-1 py-1 bg-dark-800/30 border-b border-dark-700">
        <div className="flex bg-dark-700 rounded p-0.5">
          <button
            onClick={() => setProcesoActivo('guias')}
            className={`flex-1 py-0.5 rounded text-[9px] font-bold ${
              procesoActivo === 'guias' ? 'bg-primary-500 text-white' : 'text-dark-400'
            }`}
          >
            G
          </button>
          <button
            onClick={() => setProcesoActivo('novedad')}
            className={`flex-1 py-0.5 rounded text-[9px] font-bold ${
              procesoActivo === 'novedad' ? 'bg-blue-500 text-white' : 'text-dark-400'
            }`}
          >
            N
          </button>
        </div>
      </div>

      {/* TODOS los Contadores */}
      <div className="flex-1 overflow-y-auto px-1 py-1">
        <div className="space-y-0.5">
          {proceso.campos.map((campo) => (
            <div
              key={campo.id}
              className="flex items-center justify-between py-1 px-1 bg-dark-800/50 rounded"
              style={{ borderLeft: `2px solid ${campo.color}` }}
            >
              <span className="text-xs">{campo.icono}</span>
              <div className="flex items-center gap-0.5">
                {!campo.esCalculado && (
                  <button
                    onClick={() => decrementarContador(campo.id)}
                    className="w-5 h-5 rounded bg-red-500/30 text-red-400 text-xs font-bold flex items-center justify-center active:scale-95"
                  >
                    −
                  </button>
                )}
                <span className={`min-w-[22px] text-center text-sm font-bold ${campo.esCalculado ? 'text-pink-400' : 'text-white'}`}>
                  {getValor(campo.id)}
                </span>
                {!campo.esCalculado && (
                  <button
                    onClick={() => incrementarContador(campo.id)}
                    className="w-5 h-5 rounded bg-green-500/30 text-green-400 text-xs font-bold flex items-center justify-center active:scale-95"
                  >
                    +
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Botones Acción */}
      <div className="px-1 py-1.5 bg-dark-800/50 border-t border-dark-700 space-y-1">
        <button
          onClick={() => guardarRonda()}
          className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold flex items-center justify-center gap-1"
        >
          <Save className="w-3 h-3" />
          GUARDAR
        </button>
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => finalizarBloque()}
            className="py-1 bg-orange-600 text-white rounded flex items-center justify-center"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          <button
            onClick={() => setMostrarModalExportar(true)}
            className="py-1 bg-green-600 text-white rounded flex items-center justify-center"
          >
            <Download className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-1 py-1 bg-dark-800 border-t border-dark-700 space-y-1">
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => setShowBloques(true)}
            className="py-0.5 bg-dark-700 text-dark-300 rounded text-[9px]"
          >
            📦{bloquesHoy.length}
          </button>
          <button
            onClick={handleNuevoDia}
            className={`py-0.5 rounded text-[9px] ${confirmNuevoDia ? 'bg-red-600 text-white' : 'bg-dark-700 text-dark-400'}`}
          >
            {confirmNuevoDia ? '¿?' : '🌅'}
          </button>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="w-full py-0.5 bg-dark-700 text-dark-400 rounded text-[9px] flex items-center justify-center gap-1"
        >
          <Settings className="w-2.5 h-2.5" />
        </button>
      </div>

      {/* Modales */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showBloques && <BlocksModal onClose={() => setShowBloques(false)} />}
    </div>
  );
};

export default CompactLayout;
