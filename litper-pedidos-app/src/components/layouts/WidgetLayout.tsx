import React, { useState, useEffect } from 'react';
import { Download, RotateCcw, Sunrise, Play, Pause, RotateCw, Package, Settings, Save } from 'lucide-react';
import { useAppStore, calcularTotDevoluciones } from '../../stores/appStore';
import { PROCESO_GUIAS, PROCESO_NOVEDAD } from '../../config/processConfig';
import BlocksModal from '../BlocksModal';
import SettingsModal from '../SettingsModal';
import ViewSwitcher from '../ViewSwitcher';

const WidgetLayout: React.FC = () => {
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
    <div className="h-screen flex flex-col bg-dark-900 select-none">
      {/* Header - Logo, Settings, ViewSwitcher */}
      <div className="flex items-center justify-between px-3 py-2 bg-dark-800 border-b border-dark-700 drag-region">
        <span className="text-sm font-bold text-primary-400 no-drag">📦 LITPER</span>
        <div className="flex items-center gap-2 no-drag">
          <ViewSwitcher compact />
          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-white transition-all"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Usuario Grande */}
      <div className="px-3 py-3 bg-gradient-to-b from-dark-800 to-dark-900 border-b border-dark-700">
        {usuarioActual ? (
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ backgroundColor: usuarioActual.color + '30', border: `2px solid ${usuarioActual.color}` }}
            >
              {usuarioActual.avatar}
            </div>
            <div>
              <p className="font-bold text-white text-lg">{usuarioActual.nombre}</p>
              <p className="text-xs text-dark-400">Ronda #{numeroBloqueHoy} de hoy</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-dark-700 border-2 border-dashed border-dark-600">
              👤
            </div>
            <div>
              <p className="font-medium text-dark-400">Sin usuario</p>
              <button
                onClick={() => setShowSettings(true)}
                className="text-xs text-primary-400 hover:underline"
              >
                Crear usuario →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Timer Grande Central */}
      <div className="px-3 py-4 bg-dark-800/30">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={timerState === 'running' ? pausarTimer : iniciarTimer}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              timerState === 'running'
                ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
            }`}
          >
            {timerState === 'running' ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </button>
          <div className="text-center">
            <span className={`font-mono text-4xl font-bold ${colorClass}`}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
            <p className="text-[10px] text-dark-500 mt-1">
              {timerState === 'running' ? 'En progreso...' : timerState === 'paused' ? 'Pausado' : 'Listo para iniciar'}
            </p>
          </div>
          <button
            onClick={resetearTimer}
            className="w-12 h-12 rounded-xl flex items-center justify-center bg-dark-700 text-dark-400 hover:text-white hover:bg-dark-600 transition-all"
          >
            <RotateCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Selector de Proceso */}
      <div className="px-3 py-2 border-b border-dark-700">
        <div className="flex bg-dark-700 rounded-lg p-1">
          <button
            onClick={() => setProcesoActivo('guias')}
            className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              procesoActivo === 'guias'
                ? 'bg-primary-500 text-white'
                : 'text-dark-400 hover:text-white'
            }`}
          >
            📦 Guías
          </button>
          <button
            onClick={() => setProcesoActivo('novedad')}
            className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              procesoActivo === 'novedad'
                ? 'bg-blue-500 text-white'
                : 'text-dark-400 hover:text-white'
            }`}
          >
            📋 Novedad
          </button>
        </div>
      </div>

      {/* Contadores */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {proceso.grupos ? (
          <div className="space-y-2">
            {proceso.grupos.map((grupo) => (
              <div key={grupo}>
                <div className="text-[9px] font-bold text-dark-500 uppercase tracking-wider mb-1 px-1">{grupo}</div>
                <div className="space-y-0.5">
                  {proceso.campos
                    .filter((c) => c.grupo === grupo)
                    .map((campo) => (
                      <div
                        key={campo.id}
                        className="flex items-center justify-between py-1.5 px-2 bg-dark-800/50 rounded"
                        style={{ borderLeft: `3px solid ${campo.color}` }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-dark-500 w-3">{getLetra(campo.id)}</span>
                          <span className="text-sm">{campo.icono}</span>
                          <span className="text-xs text-dark-300">{campo.labelCorto}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {!campo.esCalculado && (
                            <button
                              onClick={() => decrementarContador(campo.id)}
                              className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 font-bold text-lg flex items-center justify-center transition-all active:scale-95"
                            >
                              −
                            </button>
                          )}
                          <span className={`min-w-[2.5rem] text-center text-xl font-bold tabular-nums ${campo.esCalculado ? 'text-pink-400' : 'text-white'}`}>
                            {getValor(campo.id)}
                          </span>
                          {!campo.esCalculado && (
                            <button
                              onClick={() => incrementarContador(campo.id)}
                              className="w-8 h-8 rounded-lg bg-green-500/20 hover:bg-green-500/40 text-green-400 font-bold text-lg flex items-center justify-center transition-all active:scale-95"
                            >
                              +
                            </button>
                          )}
                          {campo.esCalculado && <span className="text-[8px] text-dark-500 w-[60px] text-center">(auto)</span>}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-0.5">
            {proceso.campos.map((campo) => (
              <div
                key={campo.id}
                className="flex items-center justify-between py-1.5 px-2 bg-dark-800/50 rounded"
                style={{ borderLeft: `3px solid ${campo.color}` }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-dark-500 w-3">{getLetra(campo.id)}</span>
                  <span className="text-sm">{campo.icono}</span>
                  <span className="text-xs text-dark-300">{campo.labelCorto}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => decrementarContador(campo.id)}
                    className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 font-bold text-lg flex items-center justify-center transition-all active:scale-95"
                  >
                    −
                  </button>
                  <span className="min-w-[2.5rem] text-center text-xl font-bold text-white tabular-nums">
                    {getValor(campo.id)}
                  </span>
                  <button
                    onClick={() => incrementarContador(campo.id)}
                    className="w-8 h-8 rounded-lg bg-green-500/20 hover:bg-green-500/40 text-green-400 font-bold text-lg flex items-center justify-center transition-all active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botones de Acción - GUARDAR RONDA y REINICIAR */}
      <div className="px-3 py-2 space-y-2 bg-dark-800/50 border-t border-dark-700">
        {/* GUARDAR RONDA - Azul (principal) */}
        <button
          onClick={() => guardarRonda()}
          className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-lg transition-all active:scale-98 shadow-lg"
        >
          <Save className="w-5 h-5" />
          GUARDAR RONDA
        </button>

        <div className="grid grid-cols-2 gap-2">
          {/* REINICIAR - Naranja */}
          <button
            onClick={() => finalizarBloque()}
            className="flex items-center justify-center gap-1.5 py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm rounded-lg transition-all active:scale-98"
          >
            <RotateCcw className="w-4 h-4" />
            REINICIAR
          </button>
          {/* EXPORTAR - Verde */}
          <button
            onClick={() => setMostrarModalExportar(true)}
            className="flex items-center justify-center gap-1.5 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold text-sm rounded-lg transition-all active:scale-98"
          >
            <Download className="w-4 h-4" />
            EXPORTAR
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2 bg-dark-800 border-t border-dark-700 text-xs">
        <button
          onClick={() => setShowBloques(true)}
          className="flex items-center gap-1.5 px-2 py-1 bg-dark-700 hover:bg-dark-600 text-dark-300 rounded-lg transition-all"
        >
          <Package className="w-3.5 h-3.5" />
          Bloques ({bloquesHoy.length})
        </button>
        <button
          onClick={handleNuevoDia}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all ${
            confirmNuevoDia
              ? 'bg-red-600 text-white'
              : 'bg-dark-700 text-dark-400 hover:text-white'
          }`}
        >
          <Sunrise className="w-3.5 h-3.5" />
          {confirmNuevoDia ? '¿Confirmar?' : 'Nuevo Día'}
        </button>
      </div>

      {/* Modales */}
      {showBloques && <BlocksModal onClose={() => setShowBloques(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default WidgetLayout;
