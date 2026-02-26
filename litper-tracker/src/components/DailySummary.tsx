import React from 'react';
import { useTrackerStore, NIVELES } from '../stores/trackerStore';
import { X, TrendingUp, Clock, FileText, AlertTriangle, Award, Zap, Target } from 'lucide-react';

const DailySummary: React.FC = () => {
  const {
    showDailySummary,
    toggleDailySummary,
    generarResumenDiario,
    rondasHoy,
    userStats,
    metasDiarias,
    usuarioActual,
  } = useTrackerStore();

  if (!showDailySummary) return null;

  const resumen = generarResumenDiario();
  const nivelActual = NIVELES.find((n) => n.id === userStats.nivel) || NIVELES[0];

  // Calcular estadísticas adicionales
  const rondasGuias = rondasHoy.filter((r) => r.tipo === 'guias').length;
  const rondasNovedades = rondasHoy.filter((r) => r.tipo === 'novedades').length;
  const tiempoHoras = Math.floor(resumen.tiempoTotal / 60);
  const tiempoMinutos = resumen.tiempoTotal % 60;

  const metaGuias = metasDiarias.find((m) => m.tipo === 'guias');
  const metaNovedades = metasDiarias.find((m) => m.tipo === 'novedades');

  const progresoGuias = metaGuias ? Math.min((resumen.guias / metaGuias.objetivo) * 100, 100) : 0;
  const progresoNovedades = metaNovedades ? Math.min((resumen.novedades / metaNovedades.objetivo) * 100, 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 rounded-xl border border-dark-600 w-full max-w-sm animate-scale-in overflow-hidden">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-white" />
              <h2 className="text-lg font-bold text-white">Resumen del Día</h2>
            </div>
            <button
              onClick={toggleDailySummary}
              className="p-1 hover:bg-white/20 rounded text-white/80 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          {usuarioActual && (
            <div className="flex items-center gap-2 mt-2 text-white/80 text-sm">
              <span>{usuarioActual.avatar}</span>
              <span>{usuarioActual.nombre}</span>
            </div>
          )}
        </div>

        {/* Estadísticas principales */}
        <div className="p-4 space-y-4">
          {/* Rondas y Tiempo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-dark-700 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-white">{resumen.rondas}</div>
              <div className="text-xs text-slate-400">Rondas Totales</div>
            </div>
            <div className="bg-dark-700 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <Clock size={16} className="text-blue-400" />
                <span className="text-2xl font-bold text-white">
                  {tiempoHoras > 0 ? `${tiempoHoras}h${tiempoMinutos}m` : `${tiempoMinutos}m`}
                </span>
              </div>
              <div className="text-xs text-slate-400">Tiempo Trabajado</div>
            </div>
          </div>

          {/* Guías */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">Guías</span>
              </div>
              <span className="text-lg font-bold text-white">{resumen.guias}</span>
            </div>
            {metaGuias && (
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Meta: {metaGuias.objetivo}</span>
                  <span>{Math.round(progresoGuias)}%</span>
                </div>
                <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${progresoGuias}%` }}
                  />
                </div>
              </div>
            )}
            <div className="text-xs text-slate-500 mt-1">{rondasGuias} rondas</div>
          </div>

          {/* Novedades */}
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-orange-400" />
                <span className="text-sm font-medium text-orange-400">Novedades</span>
              </div>
              <span className="text-lg font-bold text-white">{resumen.novedades}</span>
            </div>
            {metaNovedades && (
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Meta: {metaNovedades.objetivo}</span>
                  <span>{Math.round(progresoNovedades)}%</span>
                </div>
                <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 transition-all duration-500"
                    style={{ width: `${progresoNovedades}%` }}
                  />
                </div>
              </div>
            )}
            <div className="text-xs text-slate-500 mt-1">{rondasNovedades} rondas</div>
          </div>

          {/* XP y Nivel */}
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{nivelActual.icon}</span>
                <div>
                  <div className="text-sm font-medium text-purple-400">{nivelActual.nombre}</div>
                  <div className="text-xs text-slate-500">Nivel {nivelActual.id}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-amber-400">
                  <Zap size={14} />
                  <span className="font-bold">+{resumen.xpGanado} XP</span>
                </div>
                <div className="text-xs text-slate-500">ganado hoy</div>
              </div>
            </div>
          </div>

          {/* Logros del día */}
          {(metaGuias?.completada || metaNovedades?.completada) && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Award size={16} className="text-amber-400" />
                <span className="text-sm font-medium text-amber-400">Logros del Día</span>
              </div>
              <div className="space-y-1">
                {metaGuias?.completada && (
                  <div className="flex items-center gap-2 text-xs text-white">
                    <Target size={12} className="text-emerald-400" />
                    <span>Meta de guías completada</span>
                  </div>
                )}
                {metaNovedades?.completada && (
                  <div className="flex items-center gap-2 text-xs text-white">
                    <Target size={12} className="text-orange-400" />
                    <span>Meta de novedades completada</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-dark-700 bg-dark-900/50">
          <button
            onClick={toggleDailySummary}
            className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailySummary;
