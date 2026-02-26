import React from 'react';
import { useTrackerStore, NIVELES } from '../stores/trackerStore';

// Componente de Level Up
export const LevelUpNotification: React.FC = () => {
  const { showLevelUp, hideLevelUp, userStats } = useTrackerStore();

  if (!showLevelUp) return null;

  const nivelActual = NIVELES.find(n => n.id === userStats.nivel) || NIVELES[0];

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-fadeIn"
      onClick={hideLevelUp}
    >
      <div
        className="bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 rounded-2xl p-6 border-2 border-amber-400 shadow-2xl shadow-amber-500/20 animate-bounceIn text-center max-w-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Confetti effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#f59e0b', '#8b5cf6', '#3b82f6', '#10b981', '#ef4444'][i % 5],
                animationDelay: `${Math.random() * 0.5}s`,
              }}
            />
          ))}
        </div>

        <div className="text-6xl mb-3 animate-pulse">{nivelActual.icon}</div>
        <div className="text-amber-400 text-xs font-bold mb-1">¡SUBISTE DE NIVEL!</div>
        <div className="text-3xl font-black text-white mb-2">{nivelActual.nombre}</div>
        <div className="text-slate-400 text-sm">Nivel {nivelActual.id}</div>

        <div className="mt-4 px-4 py-2 bg-amber-500/20 rounded-lg">
          <span className="text-amber-400 text-sm">+{userStats.xp} XP totales</span>
        </div>

        <button
          onClick={hideLevelUp}
          className="mt-4 text-xs text-slate-500 hover:text-white transition-colors"
        >
          Toca para cerrar
        </button>
      </div>
    </div>
  );
};

// Componente de Nuevo Badge
export const BadgeNotification: React.FC = () => {
  const { newBadge, hideNewBadge } = useTrackerStore();

  if (!newBadge) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4"
      onClick={hideNewBadge}
    >
      <div
        className="bg-gradient-to-br from-amber-900 via-orange-900 to-red-900 rounded-2xl p-6 border-2 border-amber-400 shadow-2xl shadow-amber-500/30 text-center max-w-xs animate-bounceIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-xs text-amber-300 font-bold mb-2">🏆 LOGRO DESBLOQUEADO</div>

        <div
          className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-5xl mb-3 animate-pulse"
          style={{ backgroundColor: newBadge.color + '30', borderColor: newBadge.color, borderWidth: 3 }}
        >
          {newBadge.icon}
        </div>

        <div className="text-2xl font-black text-white mb-1">{newBadge.nombre}</div>
        <div className="text-slate-300 text-sm">{newBadge.descripcion}</div>

        <button
          onClick={hideNewBadge}
          className="mt-4 px-6 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-sm transition-colors"
        >
          ¡Genial!
        </button>
      </div>
    </div>
  );
};

// Componente combinado para exportar
const Celebrations: React.FC = () => {
  return (
    <>
      <LevelUpNotification />
      <BadgeNotification />
    </>
  );
};

export default Celebrations;
