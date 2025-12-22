/**
 * CHARTS DASHBOARD COMPONENT
 * Gráficas y estadísticas visuales
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Download,
  RefreshCw,
  Users,
  Target,
  Clock
} from 'lucide-react';

interface ResumenDia {
  fecha: string;
  usuarios_activos: number;
  guias: {
    rondas: number;
    realizado: number;
    cancelado: number;
  };
  novedades: {
    rondas: number;
    solucionadas: number;
  };
}

interface HistorialItem {
  fecha: string;
  tipo: string;
  realizado?: number;
  solucionadas?: number;
}

const API_URL = 'http://localhost:8000/api/tracker';

const ChartsDashboard: React.FC = () => {
  const [resumen, setResumen] = useState<ResumenDia | null>(null);
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dias, setDias] = useState(7);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Resumen del día
      const resumenRes = await fetch(`${API_URL}/reportes/resumen-dia`);
      if (resumenRes.ok) {
        setResumen(await resumenRes.json());
      }

      // Historial
      const historialRes = await fetch(`${API_URL}/historial?dias=${dias}`);
      if (historialRes.ok) {
        const data = await historialRes.json();
        setHistorial(data.rondas || []);
      }
    } catch (error) {
      console.warn('Error cargando datos:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [dias]);

  // Agrupar historial por fecha
  const datosAgrupados = historial.reduce((acc, item) => {
    const fecha = item.fecha;
    if (!acc[fecha]) {
      acc[fecha] = { guias: 0, novedades: 0 };
    }
    if (item.tipo === 'guias') {
      acc[fecha].guias += item.realizado || 0;
    } else {
      acc[fecha].novedades += item.solucionadas || 0;
    }
    return acc;
  }, {} as Record<string, { guias: number; novedades: number }>);

  // Preparar datos para gráfica
  const fechas = Object.keys(datosAgrupados).sort().slice(-7);
  const maxValor = Math.max(
    ...fechas.map(f => Math.max(datosAgrupados[f].guias, datosAgrupados[f].novedades)),
    1
  );

  const exportarExcel = async () => {
    try {
      window.open(`${API_URL}/exportar/excel`, '_blank');
    } catch (error) {
      console.error('Error exportando:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          Estadísticas
        </h3>
        <div className="flex items-center gap-2">
          <select
            value={dias}
            onChange={(e) => setDias(Number(e.target.value))}
            className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
          >
            <option value={7}>7 días</option>
            <option value={14}>14 días</option>
            <option value={30}>30 días</option>
          </select>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={exportarExcel}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Excel
          </button>
        </div>
      </div>

      {/* Cards Resumen */}
      {resumen && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl p-4 border border-blue-500/30">
            <Users className="w-6 h-6 text-blue-400 mb-2" />
            <p className="text-2xl font-bold text-white">{resumen.usuarios_activos}</p>
            <p className="text-sm text-slate-400">Usuarios activos hoy</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-xl p-4 border border-emerald-500/30">
            <Target className="w-6 h-6 text-emerald-400 mb-2" />
            <p className="text-2xl font-bold text-white">{resumen.guias.realizado}</p>
            <p className="text-sm text-slate-400">Guías realizadas</p>
          </div>

          <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-xl p-4 border border-amber-500/30">
            <TrendingUp className="w-6 h-6 text-amber-400 mb-2" />
            <p className="text-2xl font-bold text-white">{resumen.novedades.solucionadas}</p>
            <p className="text-sm text-slate-400">Novedades solucionadas</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl p-4 border border-purple-500/30">
            <Clock className="w-6 h-6 text-purple-400 mb-2" />
            <p className="text-2xl font-bold text-white">
              {resumen.guias.rondas + resumen.novedades.rondas}
            </p>
            <p className="text-sm text-slate-400">Rondas totales</p>
          </div>
        </div>
      )}

      {/* Gráfica de barras simple */}
      <div className="bg-slate-800 rounded-xl p-4">
        <h4 className="text-white font-medium mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          Últimos {dias} días
        </h4>

        {fechas.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Sin datos en este período</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Leyenda */}
            <div className="flex justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded" />
                <span className="text-slate-400">Guías</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-500 rounded" />
                <span className="text-slate-400">Novedades</span>
              </div>
            </div>

            {/* Barras */}
            <div className="flex items-end justify-around gap-2 h-48">
              {fechas.map((fecha) => {
                const datos = datosAgrupados[fecha];
                const heightGuias = (datos.guias / maxValor) * 100;
                const heightNovedades = (datos.novedades / maxValor) * 100;
                const fechaCorta = fecha.split('-').slice(1).join('/');

                return (
                  <div key={fecha} className="flex-1 flex flex-col items-center gap-1">
                    <div className="flex gap-1 items-end h-40 w-full justify-center">
                      {/* Barra Guías */}
                      <div
                        className="w-6 bg-emerald-500 rounded-t transition-all duration-500 relative group"
                        style={{ height: `${Math.max(heightGuias, 2)}%` }}
                      >
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-700 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {datos.guias}
                        </div>
                      </div>
                      {/* Barra Novedades */}
                      <div
                        className="w-6 bg-amber-500 rounded-t transition-all duration-500 relative group"
                        style={{ height: `${Math.max(heightNovedades, 2)}%` }}
                      >
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-700 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {datos.novedades}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500">{fechaCorta}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Tasa de éxito */}
      {resumen && resumen.guias.realizado > 0 && (
        <div className="bg-slate-800 rounded-xl p-4">
          <h4 className="text-white font-medium mb-4">Tasa de Éxito - Guías</h4>
          <div className="relative h-6 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{
                width: `${(resumen.guias.realizado / (resumen.guias.realizado + resumen.guias.cancelado)) * 100}%`
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-white">
              {Math.round((resumen.guias.realizado / (resumen.guias.realizado + resumen.guias.cancelado)) * 100)}%
              exitosas
            </div>
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-2">
            <span>{resumen.guias.realizado} realizadas</span>
            <span>{resumen.guias.cancelado} canceladas</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartsDashboard;
