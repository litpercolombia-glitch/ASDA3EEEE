import React, { useEffect, useState } from 'react';
import { Download, RotateCcw, Play, Pause, Settings, RotateCw, Save } from 'lucide-react';
import { useAppStore, calcularTotDevoluciones } from '../../stores/appStore';
import { PROCESO_GUIAS, PROCESO_NOVEDAD } from '../../config/processConfig';
import ViewSwitcher from '../ViewSwitcher';
import SettingsModal from '../SettingsModal';

// Barra Lateral Vertical (Compact)
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
  } = useAppStore();

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

  return (
    <div className="h-screen w-full flex flex-col bg-dark-900 select-none">
      {/* Header con Usuario y Ronda */}
      <div className="px-2 py-2 bg-dark-800 border-b border-dark-700 drag-region">
        <div className="flex items-center justify-between no-drag">
          {usuarioActual ? (
            <div className="flex items-center gap-2">
              <span className="text-xl" style={{ color: usuarioActual.color }}>{usuarioActual.avatar}</span>
              <div>
                <p className="text-[10px] font-medium text-white truncate max-w-[60px]">{usuarioActual.nombre}</p>
                <p className="text-[8px] text-dark-400">#{numeroBloqueHoy}</p>
              </div>
            </div>
          ) : (
            <span className="text-lg">👤</span>
          )}
          <ViewSwitcher compact />
        </div>
      </div>

      {/* Timer */}
      <div className="px-2 py-2 bg-dark-800/50 border-b border-dark-700">
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={timerState === 'running' ? pausarTimer : iniciarTimer}
            className={`p-1 rounded transition-all ${
              timerState === 'running' ? 'text-yellow-400' : 'text-green-400'
            }`}
          >
            {timerState === 'running' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <span className={`font-mono text-sm font-bold ${colorClass}`}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
          <button onClick={resetearTimer} className="text-dark-400 hover:text-white p-1">
            <RotateCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Selector de Proceso */}
      <div className="px-2 py-1 bg-dark-800/30 border-b border-dark-700">
        <div className="flex bg-dark-700 rounded p-0.5">
          <button
            onClick={() => setProcesoActivo('guias')}
            className={`flex-1 px-1 py-0.5 rounded text-[9px] font-medium transition-all ${
              procesoActivo === 'guias' ? 'bg-primary-500 text-white' : 'text-dark-400'
            }`}
          >
            G
          </button>
          <button
            onClick={() => setProcesoActivo('novedad')}
            className={`flex-1 px-1 py-0.5 rounded text-[9px] font-medium transition-all ${
              procesoActivo === 'novedad' ? 'bg-blue-500 text-white' : 'text-dark-400'
            }`}
          >
            N
          </button>
        </div>
      </div>

      {/* Contadores Verticales */}
      <div className="flex-1 overflow-y-auto px-1.5 py-1">
        <div className="space-y-0.5">
          {proceso.campos.map((campo) => (
            <div
              key={campo.id}
              className="flex items-center justify-between py-1 px-1.5 bg-dark-800/50 rounded group"
              style={{ borderLeft: `2px solid ${campo.color}` }}
            >
              <div className="flex items-center gap-1">
                <span className="text-[8px] font-bold text-dark-500">{getLetra(campo.id)}</span>
                <span className="text-[10px]">{campo.icono}</span>
              </div>
              <div className="flex items-center gap-0.5">
                {!campo.esCalculado && (
                  <button
                    onClick={() => decrementarContador(campo.id)}
                    className="w-5 h-5 rounded bg-red-500/20 hover:bg-red-500/40 text-red-400 text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    −
                  </button>
                )}
                <span className={`min-w-[20px] text-center text-sm font-bold tabular-nums ${campo.esCalculado ? 'text-pink-400' : 'text-white'}`}>
                  {getValor(campo.id)}
                </span>
                {!campo.esCalculado && (
                  <button
                    onClick={() => incrementarContador(campo.id)}
                    className="w-5 h-5 rounded bg-green-500/20 hover:bg-green-500/40 text-green-400 text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    +
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="px-1.5 py-1.5 bg-dark-800/50 border-t border-dark-700 space-y-1">
        {/* GUARDAR - Azul */}
        <button
          onClick={() => guardarRonda()}
          className="w-full flex items-center justify-center gap-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold transition-all"
        >
          <Save className="w-3 h-3" />
          GUARDAR
        </button>

        <div className="grid grid-cols-2 gap-1">
          {/* REINICIAR - Naranja */}
          <button
            onClick={() => finalizarBloque()}
            className="p-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded transition-all flex items-center justify-center"
            title="Reiniciar"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          {/* EXPORTAR - Verde */}
          <button
            onClick={() => setMostrarModalExportar(true)}
            className="p-1.5 bg-green-600 hover:bg-green-500 text-white rounded transition-all flex items-center justify-center"
            title="Exportar"
          >
            <Download className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Settings Button */}
      <div className="px-1.5 py-1 bg-dark-800 border-t border-dark-700">
        <button
          onClick={() => setShowSettings(true)}
          className="w-full p-1 bg-dark-700 hover:bg-dark-600 text-dark-400 hover:text-white rounded transition-all flex items-center justify-center"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Settings Modal */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default CompactLayout;
