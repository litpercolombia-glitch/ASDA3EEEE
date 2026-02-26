import React, { useState } from 'react';
import { useTrackerStore } from '../stores/trackerStore';
import { Target, X, Check, FileText, AlertTriangle } from 'lucide-react';

const GoalsIndicator: React.FC = () => {
  const {
    metasDiarias,
    setMetaDiaria,
    showGoals,
    toggleGoals,
    totalHoyGuias,
    totalHoyNovedades,
  } = useTrackerStore();

  const [editando, setEditando] = useState<string | null>(null);
  const [valorTemp, setValorTemp] = useState<number>(0);

  const metaGuias = metasDiarias.find((m) => m.tipo === 'guias');
  const metaNovedades = metasDiarias.find((m) => m.tipo === 'novedades');

  const progresoGuias = metaGuias ? Math.min((totalHoyGuias / metaGuias.objetivo) * 100, 100) : 0;
  const progresoNovedades = metaNovedades ? Math.min((totalHoyNovedades / metaNovedades.objetivo) * 100, 100) : 0;

  const handleEditar = (tipo: 'guias' | 'novedades', valorActual: number) => {
    setEditando(tipo);
    setValorTemp(valorActual);
  };

  const handleGuardar = (tipo: 'guias' | 'novedades') => {
    if (valorTemp > 0) {
      setMetaDiaria(tipo, valorTemp);
    }
    setEditando(null);
  };

  if (!showGoals) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 rounded-xl border border-dark-600 w-full max-w-xs animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-600">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Metas Diarias</h2>
          </div>
          <button
            onClick={toggleGoals}
            className="p-1 hover:bg-dark-700 rounded text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Meta Guías */}
          <div className={`p-4 rounded-lg border ${
            metaGuias?.completada
              ? 'bg-emerald-500/20 border-emerald-500/50'
              : 'bg-dark-700 border-dark-600'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">Guías</span>
                {metaGuias?.completada && (
                  <Check size={14} className="text-emerald-400" />
                )}
              </div>
              {editando === 'guias' ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={valorTemp}
                    onChange={(e) => setValorTemp(parseInt(e.target.value) || 0)}
                    className="w-16 px-2 py-1 bg-dark-600 border border-dark-500 rounded text-white text-sm text-center focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                  <button
                    onClick={() => handleGuardar('guias')}
                    className="p-1 bg-emerald-600 hover:bg-emerald-500 rounded text-white"
                  >
                    <Check size={12} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleEditar('guias', metaGuias?.objetivo || 60)}
                  className="text-sm text-slate-400 hover:text-white"
                >
                  Meta: {metaGuias?.objetivo || 60}
                </button>
              )}
            </div>

            <div className="relative">
              <div className="h-3 bg-dark-600 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    metaGuias?.completada
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${progresoGuias}%` }}
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white drop-shadow">
                  {totalHoyGuias} / {metaGuias?.objetivo || 60}
                </span>
              </div>
            </div>

            <div className="flex justify-between mt-2 text-xs text-slate-400">
              <span>{Math.round(progresoGuias)}% completado</span>
              {!metaGuias?.completada && metaGuias && (
                <span>Faltan {Math.max(0, metaGuias.objetivo - totalHoyGuias)}</span>
              )}
            </div>
          </div>

          {/* Meta Novedades */}
          <div className={`p-4 rounded-lg border ${
            metaNovedades?.completada
              ? 'bg-orange-500/20 border-orange-500/50'
              : 'bg-dark-700 border-dark-600'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-orange-400" />
                <span className="text-sm font-medium text-orange-400">Novedades</span>
                {metaNovedades?.completada && (
                  <Check size={14} className="text-orange-400" />
                )}
              </div>
              {editando === 'novedades' ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={valorTemp}
                    onChange={(e) => setValorTemp(parseInt(e.target.value) || 0)}
                    className="w-16 px-2 py-1 bg-dark-600 border border-dark-500 rounded text-white text-sm text-center focus:outline-none focus:border-orange-500"
                    autoFocus
                  />
                  <button
                    onClick={() => handleGuardar('novedades')}
                    className="p-1 bg-orange-600 hover:bg-orange-500 rounded text-white"
                  >
                    <Check size={12} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleEditar('novedades', metaNovedades?.objetivo || 30)}
                  className="text-sm text-slate-400 hover:text-white"
                >
                  Meta: {metaNovedades?.objetivo || 30}
                </button>
              )}
            </div>

            <div className="relative">
              <div className="h-3 bg-dark-600 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    metaNovedades?.completada
                      ? 'bg-gradient-to-r from-orange-500 to-orange-400'
                      : 'bg-orange-500'
                  }`}
                  style={{ width: `${progresoNovedades}%` }}
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white drop-shadow">
                  {totalHoyNovedades} / {metaNovedades?.objetivo || 30}
                </span>
              </div>
            </div>

            <div className="flex justify-between mt-2 text-xs text-slate-400">
              <span>{Math.round(progresoNovedades)}% completado</span>
              {!metaNovedades?.completada && metaNovedades && (
                <span>Faltan {Math.max(0, metaNovedades.objetivo - totalHoyNovedades)}</span>
              )}
            </div>
          </div>

          {/* Tips */}
          <div className="text-xs text-slate-500 text-center">
            Click en "Meta" para editar el objetivo
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalsIndicator;
