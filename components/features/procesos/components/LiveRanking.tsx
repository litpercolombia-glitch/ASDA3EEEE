/**
 * LIVE RANKING COMPONENT
 * Ranking en tiempo real con animaciones
 */

import React, { useEffect, useState } from 'react';
import { Trophy, TrendingUp, Flame, Target } from 'lucide-react';
import { useProcesosStore, COLORES_USUARIO } from '../stores/procesosStore';

interface RankingEntry {
  id: string;
  nombre: string;
  avatar: string;
  color: string;
  guiasHoy: number;
  metaDiaria: number;
  progreso: number;
  posicion: number;
}

const LiveRanking: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { usuarios, getRondasHoy, getTotalHoy } = useProcesosStore();
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  const getColorHex = (colorId: string) =>
    COLORES_USUARIO.find((c) => c.id === colorId)?.hex || '#8B5CF6';

  // Actualizar ranking cada 5 segundos
  useEffect(() => {
    const updateRanking = () => {
      const nuevoRanking = usuarios
        .filter(u => u.activo)
        .map(u => {
          const guiasHoy = getTotalHoy(u.id);
          return {
            id: u.id,
            nombre: u.nombre,
            avatar: u.avatar,
            color: u.color,
            guiasHoy,
            metaDiaria: u.metaDiaria,
            progreso: u.metaDiaria > 0 ? Math.round((guiasHoy / u.metaDiaria) * 100) : 0,
            posicion: 0,
          };
        })
        .sort((a, b) => b.guiasHoy - a.guiasHoy)
        .map((entry, index) => ({ ...entry, posicion: index + 1 }));

      // Detectar cambios de posición para animar
      ranking.forEach(old => {
        const nuevo = nuevoRanking.find(n => n.id === old.id);
        if (nuevo && nuevo.posicion !== old.posicion) {
          setAnimatingId(nuevo.id);
          setTimeout(() => setAnimatingId(null), 1000);
        }
      });

      setRanking(nuevoRanking);
    };

    updateRanking();
    const interval = setInterval(updateRanking, 5000);
    return () => clearInterval(interval);
  }, [usuarios, getTotalHoy, ranking.length]);

  const getMedal = (posicion: number) => {
    switch (posicion) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${posicion}`;
    }
  };

  if (ranking.length === 0) {
    return null;
  }

  return (
    <div className={`bg-slate-800 rounded-xl p-4 ${className}`}>
      <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-amber-400" />
        Ranking del Día
        <span className="text-xs text-slate-500 ml-auto">En vivo</span>
        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
      </h3>

      <div className="space-y-2">
        {ranking.slice(0, 5).map((entry, index) => (
          <div
            key={entry.id}
            className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-500 ${
              animatingId === entry.id ? 'bg-amber-500/20 scale-105' : 'bg-slate-700/50'
            } ${index === 0 ? 'border border-amber-500/30' : ''}`}
          >
            {/* Posición */}
            <div className="w-8 text-center font-bold text-lg">
              {getMedal(entry.posicion)}
            </div>

            {/* Avatar */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
              style={{ backgroundColor: `${getColorHex(entry.color)}30` }}
            >
              {entry.avatar}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-white font-medium truncate">{entry.nombre}</span>
                <span className="text-emerald-400 font-bold">{entry.guiasHoy}</span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-slate-600 rounded-full mt-1 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    entry.progreso >= 100
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                      : entry.progreso >= 75
                      ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                      : 'bg-gradient-to-r from-blue-500 to-blue-400'
                  }`}
                  style={{ width: `${Math.min(100, entry.progreso)}%` }}
                />
              </div>
            </div>

            {/* Meta indicator */}
            {entry.progreso >= 100 && (
              <div className="text-emerald-400" title="Meta cumplida!">
                <Target className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Total del equipo */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Total equipo:</span>
          <span className="text-white font-bold">
            {ranking.reduce((acc, r) => acc + r.guiasHoy, 0)} guías
          </span>
        </div>
      </div>
    </div>
  );
};

export default LiveRanking;
