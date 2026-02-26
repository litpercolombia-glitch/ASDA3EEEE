import React, { useState } from 'react';
import { Minus, X, Pin, Settings, ChevronDown, Monitor, Smartphone, Minimize2, Square, GripVertical, TrendingUp } from 'lucide-react';
import { useTrackerStore, ModoVentana, NIVELES } from '../stores/trackerStore';

const MODOS_INFO: { id: ModoVentana; nombre: string; icon: React.ReactNode; color: string }[] = [
  { id: 'normal', nombre: 'Normal', icon: <Monitor size={12} />, color: 'text-emerald-400' },
  { id: 'compacto', nombre: 'Compacto', icon: <Smartphone size={12} />, color: 'text-blue-400' },
  { id: 'mini', nombre: 'Mini', icon: <Minimize2 size={12} />, color: 'text-amber-400' },
  { id: 'micro', nombre: 'Micro', icon: <Square size={10} />, color: 'text-orange-400' },
  { id: 'barra', nombre: 'Barra', icon: <GripVertical size={12} />, color: 'text-purple-400' },
];

const TitleBar: React.FC = () => {
  const { modo, setModo, alwaysOnTop, toggleAlwaysOnTop, toggleConfig, toggleStats, userStats } = useTrackerStore();
  const [showModos, setShowModos] = useState(false);

  const handleMinimize = () => {
    window.electronAPI?.minimize();
  };

  const handleClose = () => {
    window.electronAPI?.close();
  };

  const modoActual = MODOS_INFO.find(m => m.id === modo) || MODOS_INFO[0];
  const nivelActual = NIVELES.find(n => n.id === userStats.nivel) || NIVELES[0];

  // Calcular progreso de XP
  const xpEnNivel = userStats.xp - nivelActual.xpMin;
  const xpParaNivel = nivelActual.xpMax - nivelActual.xpMin;
  const progreso = Math.min((xpEnNivel / xpParaNivel) * 100, 100);

  return (
    <div className="drag-region bg-dark-900 px-2 py-1.5 flex items-center justify-between border-b border-dark-600 relative">
      {/* Logo y Nivel */}
      <div className="flex items-center gap-2">
        <span className="text-amber-400 font-bold text-xs">LITPER</span>

        {/* Indicador de Nivel - clickeable para ver stats */}
        <button
          onClick={toggleStats}
          className="no-drag flex items-center gap-1 px-1.5 py-0.5 bg-dark-700 hover:bg-dark-600 rounded transition-colors"
          title="Ver estadísticas"
        >
          <span className="text-sm">{nivelActual.icon}</span>
          <div className="flex flex-col items-start">
            <span className="text-[8px] text-slate-400 leading-none">Nv.{nivelActual.id}</span>
            {/* Mini barra de XP */}
            <div className="w-8 h-0.5 bg-dark-500 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all duration-300"
                style={{ width: `${progreso}%` }}
              />
            </div>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-0.5 no-drag">
        {/* Botón Estadísticas */}
        <button
          onClick={toggleStats}
          className="p-1 hover:bg-dark-700 rounded transition-colors text-slate-400 hover:text-amber-400"
          title="Estadísticas"
        >
          <TrendingUp size={12} />
        </button>

        {/* Selector de modo - Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowModos(!showModos)}
            className={`flex items-center gap-1 px-1.5 py-1 rounded transition-colors text-xs ${modoActual.color} hover:bg-dark-700`}
            title="Cambiar modo de vista"
          >
            {modoActual.icon}
            <span className="text-[10px]">{modoActual.nombre}</span>
            <ChevronDown size={10} className={`transition-transform ${showModos ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown de modos */}
          {showModos && (
            <div className="absolute top-full right-0 mt-1 bg-dark-800 border border-dark-600 rounded-lg shadow-xl z-50 py-1 min-w-[100px]">
              {MODOS_INFO.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setModo(m.id);
                    setShowModos(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
                    modo === m.id
                      ? `${m.color} bg-dark-700`
                      : 'text-slate-300 hover:bg-dark-700'
                  }`}
                >
                  {m.icon}
                  <span>{m.nombre}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Configuración */}
        <button
          onClick={toggleConfig}
          className="p-1 hover:bg-dark-700 rounded transition-colors text-slate-400 hover:text-purple-400"
          title="Configuración"
        >
          <Settings size={12} />
        </button>

        {/* Always on top */}
        <button
          onClick={toggleAlwaysOnTop}
          className={`p-1 rounded transition-colors ${
            alwaysOnTop
              ? 'bg-amber-500/20 text-amber-400'
              : 'hover:bg-dark-700 text-slate-400 hover:text-white'
          }`}
          title={alwaysOnTop ? 'Siempre encima: ON' : 'Siempre encima: OFF'}
        >
          <Pin size={12} />
        </button>

        {/* Minimize */}
        <button
          onClick={handleMinimize}
          className="p-1 hover:bg-dark-700 rounded transition-colors text-slate-400 hover:text-white"
          title="Minimizar"
        >
          <Minus size={12} />
        </button>

        {/* Close */}
        <button
          onClick={handleClose}
          className="p-1 hover:bg-red-500/20 rounded transition-colors text-slate-400 hover:text-red-400"
          title="Cerrar"
        >
          <X size={12} />
        </button>
      </div>

      {/* Cerrar dropdown al hacer click afuera */}
      {showModos && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowModos(false)}
        />
      )}
    </div>
  );
};

export default TitleBar;
