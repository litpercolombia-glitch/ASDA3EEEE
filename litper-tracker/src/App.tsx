import React, { useEffect } from 'react';
import { useTrackerStore } from './stores/trackerStore';
import TitleBar from './components/TitleBar';
import Timer from './components/Timer';
import QuickCounter from './components/QuickCounter';
import ProgressBar from './components/ProgressBar';
import MiniMode from './components/MiniMode';
import SuperMiniMode from './components/SuperMiniMode';

const App: React.FC = () => {
  const { modo, cargarDatos, tick, estadoTimer } = useTrackerStore();

  // Cargar datos al iniciar
  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Timer tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (estadoTimer === 'running') {
      interval = setInterval(tick, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [estadoTimer, tick]);

  // Renderizar segun modo
  if (modo === 'super-mini') {
    return <SuperMiniMode />;
  }

  if (modo === 'mini') {
    return <MiniMode />;
  }

  return <NormalMode />;
};

// Modo Normal - Vista completa
const NormalMode: React.FC = () => {
  const {
    valores,
    incrementar,
    decrementar,
    setValor,
    guardarRonda,
    rondaNumero,
    totalHoy,
    metaDiaria,
    estadoTimer,
  } = useTrackerStore();

  const campos: Array<{
    key: keyof typeof valores;
    label: string;
    icon: string;
    color: string;
  }> = [
    { key: 'pedidosIniciales', label: 'Iniciales', icon: '📋', color: 'slate' },
    { key: 'realizado', label: 'Realizado', icon: '✅', color: 'emerald' },
    { key: 'cancelado', label: 'Cancelado', icon: '❌', color: 'red' },
    { key: 'agendado', label: 'Agendado', icon: '📅', color: 'blue' },
    { key: 'dificiles', label: 'Difíciles', icon: '⚠️', color: 'orange' },
    { key: 'pendientes', label: 'Pendientes', icon: '⏳', color: 'yellow' },
    { key: 'revisado', label: 'Revisado', icon: '👁️', color: 'purple' },
  ];

  return (
    <div className="h-full bg-dark-800 rounded-xl overflow-hidden flex flex-col border border-dark-600">
      <TitleBar />

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Timer */}
        <Timer />

        {/* Numero de ronda */}
        <div className="text-center text-sm text-slate-400">
          Ronda #{rondaNumero}
        </div>

        {/* Contadores */}
        <div className="space-y-1">
          {campos.map((campo) => (
            <QuickCounter
              key={campo.key}
              label={campo.label}
              icon={campo.icon}
              value={valores[campo.key]}
              color={campo.color}
              onIncrement={(amount) => incrementar(campo.key, amount)}
              onDecrement={(amount) => decrementar(campo.key, amount)}
              onChange={(value) => setValor(campo.key, value)}
            />
          ))}
        </div>

        {/* Boton Guardar */}
        <button
          onClick={guardarRonda}
          className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
            estadoTimer === 'finished'
              ? 'bg-amber-500 hover:bg-amber-600 animate-pulse-red'
              : 'bg-amber-600 hover:bg-amber-500'
          }`}
        >
          💾 GUARDAR RONDA
        </button>

        {/* Progreso del dia */}
        <ProgressBar current={totalHoy} target={metaDiaria} />
      </div>
    </div>
  );
};

export default App;
