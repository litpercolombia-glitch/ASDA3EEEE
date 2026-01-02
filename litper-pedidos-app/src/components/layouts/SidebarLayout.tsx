import React, { useState } from 'react';
import { Download, RotateCcw, Sunrise, Play, Pause, RotateCw } from 'lucide-react';
import { useAppStore, calcularTotDevoluciones } from '../../stores/appStore';
import { PROCESO_GUIAS, PROCESO_NOVEDAD } from '../../config/processConfig';
import CounterButton from '../CounterButton';
import ViewSwitcher from '../ViewSwitcher';

const SidebarLayout: React.FC = () => {
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

  return (
    <div className="h-screen flex flex-col bg-dark-900">
      {/* Barra superior */}
      <div className="flex items-center justify-between px-3 py-2 bg-dark-800 border-b border-dark-700 drag-region">
        <div className="flex items-center gap-3 no-drag">
          <span className="text-sm font-bold text-primary-400">📦 LITPER</span>

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
          <div className="flex items-center gap-2 bg-dark-700/50 rounded-lg px-2 py-1">
            <button
              onClick={timerState === 'running' ? pausarTimer : iniciarTimer}
              className="p-1 rounded hover:bg-dark-600 text-dark-400 hover:text-white transition-all"
            >
              {timerState === 'running' ? (
                <Pause className="w-3 h-3" />
              ) : (
                <Play className="w-3 h-3" />
              )}
            </button>
            <span className={`font-mono text-sm font-bold ${colorClass}`}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
            <button
              onClick={resetearTimer}
              className="p-1 rounded hover:bg-dark-600 text-dark-400 hover:text-white transition-all"
            >
              <RotateCw className="w-3 h-3" />
            </button>
          </div>

          {/* Info */}
          <span className="text-xs text-dark-400">
            Bloque #{numeroBloqueHoy} • {bloquesHoy.length} hoy
          </span>

          {/* Exportar */}
          <button
            onClick={() => setMostrarModalExportar(true)}
            className="p-1.5 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-all"
            title="Exportar Excel (E)"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Nuevo día */}
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

        {/* Botón reiniciar */}
        <button
          onClick={() => finalizarBloque()}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium text-sm transition-all shadow-glow whitespace-nowrap"
        >
          <RotateCcw className="w-4 h-4" />
          Reiniciar (R)
        </button>
      </div>

      {/* Barra inferior con estadísticas */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-dark-800 border-t border-dark-700 text-xs text-dark-400">
        <span>
          {procesoActivo === 'guias' ? '📦 Generación de Guías' : '📋 Novedad'} •
          Hoy: <span className="text-white font-medium">{totalHoy}</span> {procesoActivo === 'guias' ? 'realizados' : 'solucionadas'}
        </span>
        <span className="flex items-center gap-2">
          <span className="text-dark-500">Atajos: 1-{proceso.campos.length} sumar • Shift+# restar • G/N proceso • E exportar</span>
        </span>
      </div>
    </div>
  );
};

export default SidebarLayout;
