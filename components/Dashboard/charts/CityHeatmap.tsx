// components/dashboard/charts/CityHeatmap.tsx
// Mapa de calor por ciudad/zona
import React from 'react';
import { MapPin, AlertTriangle, CheckCircle } from 'lucide-react';
import { CityStats } from '../../../stores/dashboardStore';

interface CityHeatmapProps {
  data: CityStats[];
  title?: string;
  maxItems?: number;
}

export const CityHeatmap: React.FC<CityHeatmapProps> = ({
  data,
  title = 'Top Ciudades',
  maxItems = 8,
}) => {
  const cities = data.slice(0, maxItems);

  if (cities.length === 0) {
    return (
      <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 p-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-cyan-500" />
          {title}
        </h3>
        <div className="h-[200px] flex items-center justify-center text-slate-400">
          Sin datos disponibles
        </div>
      </div>
    );
  }

  // Calcular máximo para normalizar
  const maxTotal = Math.max(...cities.map(c => c.totalGuias));

  // Función para obtener color según tasa de éxito
  const getHeatColor = (tasaExito: number) => {
    if (tasaExito >= 90) return 'bg-emerald-500';
    if (tasaExito >= 75) return 'bg-emerald-400';
    if (tasaExito >= 60) return 'bg-amber-400';
    if (tasaExito >= 40) return 'bg-orange-400';
    return 'bg-red-400';
  };

  const getBgColor = (tasaExito: number) => {
    if (tasaExito >= 90) return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
    if (tasaExito >= 75) return 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800';
    if (tasaExito >= 60) return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
    if (tasaExito >= 40) return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  };

  return (
    <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 p-6">
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-cyan-500" />
        {title}
      </h3>

      <div className="space-y-2">
        {cities.map((city, index) => (
          <div
            key={city.ciudad}
            className={`p-3 rounded-lg border ${getBgColor(city.tasaExito)} transition-all hover:scale-[1.02]`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 w-5">#{index + 1}</span>
                <span className="font-medium text-slate-700 dark:text-slate-200 truncate max-w-[120px]">
                  {city.ciudad}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Indicador de novedades */}
                {city.novedades > 0 && (
                  <div className="flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="w-3 h-3" />
                    <span className="text-xs">{city.novedades}</span>
                  </div>
                )}

                {/* Tasa de éxito */}
                <div className="flex items-center gap-1">
                  <CheckCircle className={`w-3 h-3 ${city.tasaExito >= 75 ? 'text-emerald-500' : 'text-amber-500'}`} />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {city.tasaExito}%
                  </span>
                </div>
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-2 bg-slate-200 dark:bg-navy-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${getHeatColor(city.tasaExito)} transition-all`}
                  style={{ width: `${(city.totalGuias / maxTotal) * 100}%` }}
                />
              </div>
              <span className="text-xs text-slate-500 w-12 text-right">
                {city.totalGuias}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Leyenda */}
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-navy-700">
        <p className="text-xs text-slate-500 mb-2">Tasa de éxito:</p>
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-slate-500">≥90%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-amber-400" />
            <span className="text-slate-500">60-89%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-400" />
            <span className="text-slate-500">&lt;60%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CityHeatmap;
