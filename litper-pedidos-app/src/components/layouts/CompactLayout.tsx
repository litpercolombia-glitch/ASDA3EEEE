import React, { useEffect, useState } from 'react';
import { Download, RotateCcw, Play, Pause, Settings, RotateCw, Save, Sunrise } from 'lucide-react';
import { useAppStore, calcularTotDevoluciones } from '../../stores/appStore';
import { PROCESO_GUIAS, PROCESO_NOVEDAD } from '../../config/processConfig';
import ViewSwitcher from '../ViewSwitcher';
import SettingsModal from '../SettingsModal';
import BlocksModal from '../BlocksModal';

// Barra Lateral Vertical (Compact) - FUNCIONAL con TODOS los estatus
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
      {/* Header con Usuario */}
      <div className="px-2 py-2 bg-dark-800 border-b border-dark-700 drag-region">
        <div className="flex items-center justify-between no-drag">
          {usuarioActual ? (
            <div className="flex items-center gap-2">
              <span className="text-xl" style={{ color: usuarioActual.color }}>{usuarioActual.avatar}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{usuarioActual.nombre}</p>
                <p className="text-[10px] text-dark-400">Ronda #{numeroBloqueHoy}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-lg">👤</span>
              <span className="text-[10px] text-dark-400">Sin usuario</span>
            </div>
          )}
          <ViewSwitcher compact />
        </div>
      </div>

      {/* Timer Grande */}
      <div className="px-2 py-3 bg-dark-800/50 border-b border-dark-700">
        <div className="text-center">
          <span className={`font-mono text-2xl font-bold ${colorClass}`}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>
        <div className="flex items-center justify-center gap-2 mt-2">
          <button
            onClick={timerState === 'running' ? pausarTimer : iniciarTimer}
            className={`p-1.5 rounded-lg transition-all ${
              timerState === 'running'
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-green-500/20 text-green-400'
            }`}
          >
            {timerState === 'running' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={resetearTimer}
            className="p-1.5 rounded-lg bg-dark-700 text-dark-400 hover:text-white transition-all"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Selector de Proceso */}
      <div className="px-2 py-1.5 bg-dark-800/30 border-b border-dark-700">
        <div className="flex bg-dark-700 rounded-lg p-0.5">
          <button
            onClick={() => setProcesoActivo('guias')}
            className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-all ${
              procesoActivo === 'guias' ? 'bg-primary-500 text-white' : 'text-dark-400'
            }`}
          >
            📦 G
          </button>
          <button
            onClick={() => setProcesoActivo('novedad')}
            className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-all ${
              procesoActivo === 'novedad' ? 'bg-blue-500 text-white' : 'text-dark-400'
            }`}
          >
            📋 N
          </button>
        </div>
      </div>

      {/* TODOS los Contadores - SIEMPRE VISIBLES */}
      <div className="flex-1 overflow-y-auto px-2 py-1.5">
        <div className="space-y-1">
          {proceso.campos.map((campo) => (
            <div
              key={campo.id}
              className="flex items-center justify-between py-1.5 px-2 bg-dark-800/50 rounded-lg"
              style={{ borderLeft: `3px solid ${campo.color}` }}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[10px] font-bold text-dark-500 w-3">{getLetra(campo.id)}</span>
                <span className="text-sm">{campo.icono}</span>
              </div>
              <div className="flex items-center gap-1">
                {/* Botón - SIEMPRE VISIBLE */}
                {!campo.esCalculado && (
                  <button
                    onClick={() => decrementarContador(campo.id)}
                    className="w-6 h-6 rounded bg-red-500/30 hover:bg-red-500/50 text-red-400 text-sm font-bold flex items-center justify-center transition-all active:scale-95"
                  >
                    −
                  </button>
                )}
                <span className={`min-w-[28px] text-center text-base font-bold tabular-nums ${campo.esCalculado ? 'text-pink-400' : 'text-white'}`}>
                  {getValor(campo.id)}
                </span>
                {/* Botón + SIEMPRE VISIBLE */}
                {!campo.esCalculado && (
                  <button
                    onClick={() => incrementarContador(campo.id)}
                    className="w-6 h-6 rounded bg-green-500/30 hover:bg-green-500/50 text-green-400 text-sm font-bold flex items-center justify-center transition-all active:scale-95"
                  >
                    +
                  </button>
                )}
                {campo.esCalculado && (
                  <span className="text-[8px] text-dark-500 w-[52px]">auto</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="px-2 py-2 bg-dark-800/50 border-t border-dark-700 space-y-1.5">
        {/* GUARDAR RONDA - Azul */}
        <button
          onClick={() => guardarRonda()}
          className="w-full flex items-center justify-center gap-1.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all active:scale-98"
        >
          <Save className="w-4 h-4" />
          GUARDAR
        </button>

        <div className="grid grid-cols-2 gap-1.5">
          {/* REINICIAR - Naranja */}
          <button
            onClick={() => finalizarBloque()}
            className="py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-all flex items-center justify-center gap-1"
            title="Reiniciar"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          {/* EXPORTAR - Verde */}
          <button
            onClick={() => setMostrarModalExportar(true)}
            className="py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-all flex items-center justify-center gap-1"
            title="Exportar"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Footer con Bloques y Nuevo Día */}
      <div className="px-2 py-1.5 bg-dark-800 border-t border-dark-700">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => setShowBloques(true)}
            className="py-1 bg-dark-700 hover:bg-dark-600 text-dark-300 rounded text-[10px] transition-all"
          >
            📦 {bloquesHoy.length}
          </button>
          <button
            onClick={handleNuevoDia}
            className={`py-1 rounded text-[10px] transition-all ${
              confirmNuevoDia ? 'bg-red-600 text-white' : 'bg-dark-700 text-dark-400 hover:text-white'
            }`}
          >
            {confirmNuevoDia ? '¿OK?' : '🌅'}
          </button>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="w-full mt-1.5 py-1 bg-dark-700 hover:bg-dark-600 text-dark-400 hover:text-white rounded text-[10px] transition-all flex items-center justify-center gap-1"
        >
          <Settings className="w-3 h-3" />
          Config
        </button>
      </div>

      {/* Modales */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showBloques && <BlocksModal onClose={() => setShowBloques(false)} />}
    </div>
  );
};

export default CompactLayout;
