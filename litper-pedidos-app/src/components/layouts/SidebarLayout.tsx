import React, { useState, useEffect } from 'react';
import { Download, RotateCcw, Sunrise, Play, Pause, RotateCw, Settings, User, Save } from 'lucide-react';
import { useAppStore, calcularTotDevoluciones } from '../../stores/appStore';
import { PROCESO_GUIAS, PROCESO_NOVEDAD } from '../../config/processConfig';
import CounterButton from '../CounterButton';
import ViewSwitcher from '../ViewSwitcher';
import SettingsModal from '../SettingsModal';

const SidebarLayout: React.FC = () => {
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

  const [confirmNuevoDia, setConfirmNuevoDia] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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
    <div className="h-screen flex flex-col bg-dark-900">
      {/* Barra superior */}
      <div className="flex items-center justify-between px-3 py-2 bg-dark-800 border-b border-dark-700 drag-region">
        <div className="flex items-center gap-3 no-drag">
          <span className="text-sm font-bold text-primary-400">📦 LITPER</span>

          {/* Usuario */}
          <div className="flex items-center gap-2 px-2 py-1 bg-dark-700/50 rounded-lg">
            {usuarioActual ? (
              <>
                <span className="text-lg" style={{ color: usuarioActual.color }}>{usuarioActual.avatar}</span>
                <span className="text-xs font-medium text-white">{usuarioActual.nombre}</span>
                <span className="text-[10px] text-dark-400">Ronda #{numeroBloqueHoy}</span>
              </>
            ) : (
              <>
                <User className="w-4 h-4 text-dark-400" />
                <span className="text-xs text-dark-400">Sin usuario</span>
              </>
            )}
          </div>

          {/* Selector de proceso */}
          <div className="flex items-center bg-dark-700 rounded-lg p-0.5">
            <button
              onClick={() => setProcesoActivo('guias')}
              className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                procesoActivo === 'guias'
                  ? 'bg-primary-500 text-white'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              📦 Guías
            </button>
            <button
              onClick={() => setProcesoActivo('novedad')}
              className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                procesoActivo === 'novedad'
                  ? 'bg-blue-500 text-white'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              📋 Novedad
            </button>
          </div>

          {/* Vista switcher compacto */}
          <ViewSwitcher compact />
        </div>

        <div className="flex items-center gap-3 no-drag">
          {/* Timer compacto con controles */}
          <div className="flex items-center gap-2 bg-dark-700/50 rounded-lg px-3 py-1.5">
            <button
              onClick={timerState === 'running' ? pausarTimer : iniciarTimer}
              className={`p-1 rounded transition-all ${
                timerState === 'running'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-green-500/20 text-green-400'
              }`}
            >
              {timerState === 'running' ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
            <span className={`font-mono text-lg font-bold ${colorClass}`}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
            <button
              onClick={resetearTimer}
              className="p-1 rounded hover:bg-dark-600 text-dark-400 hover:text-white transition-all"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {/* Exportar - Verde */}
          <button
            onClick={() => setMostrarModalExportar(true)}
            className="p-1.5 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-all"
            title="Exportar Excel (E)"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Nuevo día - Rojo */}
          <button
            onClick={handleNuevoDia}
            className={`p-1.5 rounded-lg transition-all ${
              confirmNuevoDia
                ? 'bg-red-600 text-white'
                : 'bg-dark-700 text-dark-400 hover:text-white'
            }`}
            title="Nuevo día"
          >
            <Sunrise className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 rounded-lg bg-dark-700 text-dark-400 hover:text-white transition-all"
            title="Configuración"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contadores en línea */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-dark-800/50 overflow-x-auto">
        {proceso.campos.map((campo) => (
          <CounterButton
            key={campo.id}
            id={campo.id}
            label={campo.label}
            labelCorto={campo.labelCorto}
            icono={campo.icono}
            color={campo.color}
            valor={getValor(campo.id)}
            esCalculado={campo.esCalculado}
            compact={true}
            onIncrement={incrementarContador}
            onDecrement={decrementarContador}
          />
        ))}

        {/* Separador */}
        <div className="w-px h-8 bg-dark-600 mx-1" />

        {/* GUARDAR RONDA - Azul (principal) */}
        <button
          onClick={() => guardarRonda()}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-sm transition-all shadow-glow whitespace-nowrap"
        >
          <Save className="w-4 h-4" />
          Guardar
        </button>

        {/* REINICIAR - Naranja */}
        <button
          onClick={() => finalizarBloque()}
          className="flex items-center gap-1.5 px-3 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-medium text-sm transition-all whitespace-nowrap"
        >
          <RotateCcw className="w-4 h-4" />
          Reiniciar
        </button>
      </div>

      {/* Barra inferior con estadísticas */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-dark-800 border-t border-dark-700 text-xs text-dark-400">
        <span>
          {procesoActivo === 'guias' ? '📦 Generación de Guías' : '📋 Novedad'} •
          Bloques hoy: <span className="text-white font-medium">{bloquesHoy.length}</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="text-dark-500">Atajos: 1-{proceso.campos.length} sumar • Shift+# restar • G/N proceso • E exportar</span>
        </span>
      </div>

      {/* Settings Modal */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default SidebarLayout;
