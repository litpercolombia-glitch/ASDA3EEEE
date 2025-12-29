import React from 'react';
import { BarChart3, TrendingUp, Clock, Target, Package } from 'lucide-react';
import { useAppStore, COLORES_USUARIO } from '../stores/appStore';

const StatsPanel: React.FC = () => {
  const { usuarios, rondas, getTotalHoy, getRondasHoy } = useAppStore();

  const hoy = new Date().toISOString().split('T')[0];

  // Stats generales
  const rondasHoy = rondas.filter((r) => r.fecha === hoy);
  const totalPedidosHoy = rondasHoy.reduce((acc, r) => acc + r.realizados, 0);
  const totalCancelados = rondasHoy.reduce((acc, r) => acc + r.cancelados, 0);
  const totalAgendados = rondasHoy.reduce((acc, r) => acc + r.agendados, 0);

  // Ranking de usuarios
  const ranking = usuarios
    .map((u) => ({
      ...u,
      totalHoy: getTotalHoy(u.id),
      rondasHoy: getRondasHoy(u.id).length,
    }))
    .sort((a, b) => b.totalHoy - a.totalHoy);

  const getColorHex = (colorId: string) =>
    COLORES_USUARIO.find((c) => c.id === colorId)?.hex || '#F97316';

  return (
    <div className="px-4 py-3 space-y-4">
      {/* Header */}
      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-primary-400" />
        Estadísticas del día
      </h3>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="card text-center py-3">
          <Package className="w-5 h-5 text-accent-green mx-auto mb-1" />
          <p className="text-xl font-bold text-white">{totalPedidosHoy}</p>
          <p className="text-[10px] text-dark-400">Realizados</p>
        </div>
        <div className="card text-center py-3">
          <Target className="w-5 h-5 text-primary-400 mx-auto mb-1" />
          <p className="text-xl font-bold text-white">{rondasHoy.length}</p>
          <p className="text-[10px] text-dark-400">Rondas</p>
        </div>
        <div className="card text-center py-3">
          <TrendingUp className="w-5 h-5 text-accent-red mx-auto mb-1" />
          <p className="text-xl font-bold text-white">{totalCancelados}</p>
          <p className="text-[10px] text-dark-400">Cancelados</p>
        </div>
        <div className="card text-center py-3">
          <Clock className="w-5 h-5 text-accent-blue mx-auto mb-1" />
          <p className="text-xl font-bold text-white">{totalAgendados}</p>
          <p className="text-[10px] text-dark-400">Agendados</p>
        </div>
      </div>

      {/* Ranking */}
      {ranking.length > 0 && (
        <div className="card">
          <h4 className="text-xs font-semibold text-dark-400 mb-2">RANKING</h4>
          <div className="space-y-2">
            {ranking.map((usuario, index) => {
              const colorHex = getColorHex(usuario.color);
              const progreso = (usuario.totalHoy / usuario.metaDiaria) * 100;

              return (
                <div key={usuario.id} className="flex items-center gap-2">
                  {/* Position */}
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      index === 0
                        ? 'bg-accent-yellow text-dark-900'
                        : index === 1
                        ? 'bg-dark-400 text-dark-900'
                        : index === 2
                        ? 'bg-primary-700 text-white'
                        : 'bg-dark-700 text-dark-400'
                    }`}
                  >
                    {index + 1}
                  </div>

                  {/* Avatar */}
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
                    style={{ backgroundColor: `${colorHex}30` }}
                  >
                    {usuario.avatar}
                  </div>

                  {/* Name and progress */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-white truncate">{usuario.nombre}</p>
                      <p className="text-[10px] text-dark-400">
                        {usuario.totalHoy}/{usuario.metaDiaria}
                      </p>
                    </div>
                    <div className="h-1 bg-dark-700 rounded-full overflow-hidden mt-0.5">
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${Math.min(100, progreso)}%`,
                          backgroundColor: progreso >= 100 ? '#10B981' : colorHex,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {ranking.length === 0 && (
        <div className="text-center py-6 text-dark-500">
          <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Sin datos aún</p>
        </div>
      )}
    </div>
  );
};

export default StatsPanel;
