/**
 * RANKING LIVE COMPONENT
 * Ranking en tiempo real de usuarios
 */

import React, { useState, useEffect } from 'react';
import { Trophy, Medal, TrendingUp, RefreshCw, Package, AlertTriangle } from 'lucide-react';

interface RankingItem {
  posicion: number;
  usuario_id: string;
  usuario_nombre: string;
  rondas: number;
  total: number;
  tiempo: number;
}

const API_URL = 'http://localhost:8000/api/tracker';

const RankingLive: React.FC = () => {
  const [rankingGuias, setRankingGuias] = useState<RankingItem[]>([]);
  const [rankingNovedades, setRankingNovedades] = useState<RankingItem[]>([]);
  const [tipo, setTipo] = useState<'guias' | 'novedades'>('guias');
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchRanking = async () => {
    setLoading(true);
    try {
      const [guiasRes, novedadesRes] = await Promise.all([
        fetch(`${API_URL}/reportes/ranking?tipo=guias`),
        fetch(`${API_URL}/reportes/ranking?tipo=novedades`)
      ]);

      if (guiasRes.ok) {
        const data = await guiasRes.json();
        setRankingGuias(data.ranking || []);
      }

      if (novedadesRes.ok) {
        const data = await novedadesRes.json();
        setRankingNovedades(data.ranking || []);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.warn('Error cargando ranking:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRanking();
    // Auto-refresh cada 30 segundos
    const interval = setInterval(fetchRanking, 30000);
    return () => clearInterval(interval);
  }, []);

  const ranking = tipo === 'guias' ? rankingGuias : rankingNovedades;

  const getMedalColor = (posicion: number) => {
    switch (posicion) {
      case 1: return 'text-yellow-400';
      case 2: return 'text-gray-300';
      case 3: return 'text-amber-600';
      default: return 'text-slate-500';
    }
  };

  const getMedalBg = (posicion: number) => {
    switch (posicion) {
      case 1: return 'bg-yellow-500/20 border-yellow-500/50';
      case 2: return 'bg-gray-400/20 border-gray-400/50';
      case 3: return 'bg-amber-600/20 border-amber-600/50';
      default: return 'bg-slate-700/50 border-slate-600/50';
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          Ranking en Vivo
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchRanking}
            disabled={loading}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {lastUpdate && (
            <span className="text-xs text-slate-500">
              {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTipo('guias')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
            tipo === 'guias'
              ? 'bg-emerald-500 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          <Package className="w-4 h-4" />
          Guías
        </button>
        <button
          onClick={() => setTipo('novedades')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
            tipo === 'novedades'
              ? 'bg-amber-500 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Novedades
        </button>
      </div>

      {/* Ranking List */}
      <div className="space-y-2">
        {ranking.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Sin datos de hoy</p>
          </div>
        ) : (
          ranking.map((item, index) => (
            <div
              key={item.usuario_id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${getMedalBg(item.posicion)}`}
            >
              {/* Posición */}
              <div className={`w-8 h-8 flex items-center justify-center font-bold ${getMedalColor(item.posicion)}`}>
                {item.posicion <= 3 ? (
                  <Medal className="w-6 h-6" />
                ) : (
                  <span className="text-lg">{item.posicion}</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <p className="font-semibold text-white">{item.usuario_nombre}</p>
                <p className="text-xs text-slate-400">{item.rondas} rondas • {item.tiempo} min</p>
              </div>

              {/* Total */}
              <div className="text-right">
                <p className={`text-2xl font-bold ${tipo === 'guias' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {item.total}
                </p>
                <p className="text-xs text-slate-500">
                  {tipo === 'guias' ? 'realizadas' : 'solucionadas'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RankingLive;
