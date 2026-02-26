import React from 'react';
import { X, Trophy, Target, Clock, Zap, Award, TrendingUp } from 'lucide-react';
import { useTrackerStore, NIVELES, BADGES_DEFINICION } from '../stores/trackerStore';

const StatsPanel: React.FC = () => {
  const { userStats, badges, showStats, toggleStats, getNivelActual } = useTrackerStore();

  if (!showStats) return null;

  const nivelActual = getNivelActual();
  const xpEnNivel = userStats.xp - nivelActual.xpMin;
  const xpParaNivel = nivelActual.xpMax - nivelActual.xpMin;
  const progreso = Math.min((xpEnNivel / xpParaNivel) * 100, 100);

  const badgesDesbloqueados = badges.filter(b => b.desbloqueado).length;

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2"
      onClick={toggleStats}
    >
      <div
        className="bg-dark-800 rounded-xl border border-dark-600 w-full max-w-sm max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-dark-600 bg-dark-900">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-amber-400" />
            <span className="font-bold text-white text-sm">Estadísticas</span>
          </div>
          <button
            onClick={toggleStats}
            className="p-1 hover:bg-dark-700 rounded transition-colors"
          >
            <X size={18} className="text-slate-400 hover:text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Nivel y XP */}
          <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-xl p-4 border border-purple-500/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-3xl">{nivelActual.icon}</span>
                <div>
                  <div className="text-white font-bold">{nivelActual.nombre}</div>
                  <div className="text-xs text-slate-400">Nivel {nivelActual.id}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-amber-400">{userStats.xp}</div>
                <div className="text-xs text-slate-400">XP Total</div>
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="relative h-3 bg-dark-700 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${progreso}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-slate-500">
              <span>{xpEnNivel} XP</span>
              <span>{xpParaNivel - xpEnNivel} XP para nivel {nivelActual.id + 1}</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2">
            <StatCard
              icon={<Target size={16} />}
              label="Rondas Totales"
              value={userStats.rondasTotales}
              color="emerald"
            />
            <StatCard
              icon={<Clock size={16} />}
              label="Tiempo Trabajado"
              value={`${Math.floor(userStats.tiempoTotalTrabajado / 60)}h ${userStats.tiempoTotalTrabajado % 60}m`}
              color="blue"
            />
            <StatCard
              icon={<Zap size={16} />}
              label="Rondas Veloces"
              value={userStats.rondasVeloces}
              color="amber"
            />
            <StatCard
              icon={<Award size={16} />}
              label="Rondas Perfectas"
              value={userStats.rondasPerfectas}
              color="purple"
            />
          </div>

          {/* Estadísticas detalladas */}
          <div className="bg-dark-700 rounded-lg p-3">
            <h3 className="text-xs text-slate-400 mb-2">Productividad</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Guías realizadas</span>
                <span className="text-emerald-400 font-bold">{userStats.guiasRealizadas}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Novedades solucionadas</span>
                <span className="text-orange-400 font-bold">{userStats.novedadesSolucionadas}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Racha actual</span>
                <span className="text-red-400 font-bold">{userStats.rachaActual} días 🔥</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Mejor racha</span>
                <span className="text-amber-400 font-bold">{userStats.mejorRacha} días</span>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs text-slate-400 flex items-center gap-1">
                <Trophy size={12} />
                Logros
              </h3>
              <span className="text-xs text-slate-500">{badgesDesbloqueados}/{BADGES_DEFINICION.length}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                    badge.desbloqueado
                      ? 'bg-dark-600'
                      : 'bg-dark-700 opacity-40 grayscale'
                  }`}
                  title={`${badge.nombre}: ${badge.descripcion}`}
                >
                  <span className="text-xl">{badge.icon}</span>
                  <span className="text-[8px] text-slate-400 mt-1 text-center truncate w-full">
                    {badge.nombre}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-dark-600">
          <button
            onClick={toggleStats}
            className="w-full py-2 bg-dark-700 hover:bg-dark-600 text-white text-sm rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: 'emerald' | 'blue' | 'amber' | 'purple' | 'red';
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => {
  const colors = {
    emerald: 'bg-emerald-500/20 text-emerald-400',
    blue: 'bg-blue-500/20 text-blue-400',
    amber: 'bg-amber-500/20 text-amber-400',
    purple: 'bg-purple-500/20 text-purple-400',
    red: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className={`${colors[color]} rounded-lg p-3`}>
      <div className="flex items-center gap-1 mb-1">
        {icon}
        <span className="text-[10px] opacity-80">{label}</span>
      </div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
};

export default StatsPanel;
