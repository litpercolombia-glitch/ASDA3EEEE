import React, { useEffect, useState } from 'react';
import { useTrackerStore, Ronda, RondaGuias, RondaNovedades } from '../stores/trackerStore';
import { X, Calendar, User, Filter, FileText, AlertTriangle, Clock, Download } from 'lucide-react';

const HistoryPanel: React.FC = () => {
  const {
    showHistory,
    toggleHistory,
    historialRondas,
    historialFiltros,
    setHistorialFiltros,
    cargarHistorial,
    usuarios,
    exportarExcel,
  } = useTrackerStore();

  const [filtroLocal, setFiltroLocal] = useState({
    fechaInicio: historialFiltros.fechaInicio,
    fechaFin: historialFiltros.fechaFin,
    usuario: historialFiltros.usuario || '',
    tipo: historialFiltros.tipo || '',
  });

  useEffect(() => {
    if (showHistory) {
      cargarHistorial();
    }
  }, [showHistory]);

  const aplicarFiltros = () => {
    cargarHistorial({
      fechaInicio: filtroLocal.fechaInicio,
      fechaFin: filtroLocal.fechaFin,
      usuario: filtroLocal.usuario || null,
      tipo: (filtroLocal.tipo as 'guias' | 'novedades') || null,
    });
  };

  if (!showHistory) return null;

  const formatTime = (minutos: number) => {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  // Agrupar por fecha
  const rondasPorFecha = historialRondas.reduce((acc, ronda) => {
    if (!acc[ronda.fecha]) {
      acc[ronda.fecha] = [];
    }
    acc[ronda.fecha].push(ronda);
    return acc;
  }, {} as Record<string, Ronda[]>);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 rounded-xl border border-dark-600 w-full max-w-lg max-h-[80vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-600">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">Historial de Sesiones</h2>
          </div>
          <button
            onClick={toggleHistory}
            className="p-1 hover:bg-dark-700 rounded text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filtros */}
        <div className="p-4 border-b border-dark-700 space-y-3">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Filter size={14} />
            <span>Filtros</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Fecha inicio */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Desde</label>
              <input
                type="date"
                value={filtroLocal.fechaInicio}
                onChange={(e) => setFiltroLocal({ ...filtroLocal, fechaInicio: e.target.value })}
                className="w-full px-2 py-1.5 bg-dark-700 border border-dark-600 rounded text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Fecha fin */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Hasta</label>
              <input
                type="date"
                value={filtroLocal.fechaFin}
                onChange={(e) => setFiltroLocal({ ...filtroLocal, fechaFin: e.target.value })}
                className="w-full px-2 py-1.5 bg-dark-700 border border-dark-600 rounded text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Usuario */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Usuario</label>
              <select
                value={filtroLocal.usuario}
                onChange={(e) => setFiltroLocal({ ...filtroLocal, usuario: e.target.value })}
                className="w-full px-2 py-1.5 bg-dark-700 border border-dark-600 rounded text-white text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="">Todos</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>{u.nombre}</option>
                ))}
              </select>
            </div>

            {/* Tipo */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Tipo</label>
              <select
                value={filtroLocal.tipo}
                onChange={(e) => setFiltroLocal({ ...filtroLocal, tipo: e.target.value })}
                className="w-full px-2 py-1.5 bg-dark-700 border border-dark-600 rounded text-white text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="">Todos</option>
                <option value="guias">Guías</option>
                <option value="novedades">Novedades</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={aplicarFiltros}
              className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded transition-colors"
            >
              Aplicar Filtros
            </button>
            <button
              onClick={exportarExcel}
              className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-sm font-medium rounded transition-colors flex items-center gap-1"
            >
              <Download size={14} />
              CSV
            </button>
          </div>
        </div>

        {/* Lista de rondas */}
        <div className="flex-1 overflow-y-auto p-4">
          {Object.keys(rondasPorFecha).length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay rondas registradas</p>
              <p className="text-xs mt-1">Ajusta los filtros o realiza algunas rondas</p>
            </div>
          ) : (
            Object.entries(rondasPorFecha)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([fecha, rondas]) => (
                <div key={fecha} className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={12} className="text-slate-500" />
                    <span className="text-xs text-slate-400 font-medium">{fecha}</span>
                    <span className="text-xs text-slate-600">({rondas.length} rondas)</span>
                  </div>

                  <div className="space-y-2">
                    {rondas.map((ronda) => (
                      <RondaCard key={ronda.id} ronda={ronda} />
                    ))}
                  </div>
                </div>
              ))
          )}
        </div>

        {/* Footer con resumen */}
        <div className="p-3 border-t border-dark-700 bg-dark-900/50">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{historialRondas.length} rondas encontradas</span>
            <span>
              Total: {historialRondas.reduce((acc, r) => acc + r.tiempoUsado, 0)} min
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface RondaCardProps {
  ronda: Ronda;
}

const RondaCard: React.FC<RondaCardProps> = ({ ronda }) => {
  const esGuias = ronda.tipo === 'guias';

  return (
    <div className={`p-3 rounded-lg border ${
      esGuias
        ? 'bg-emerald-500/10 border-emerald-500/30'
        : 'bg-orange-500/10 border-orange-500/30'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {esGuias ? (
            <FileText size={14} className="text-emerald-400" />
          ) : (
            <AlertTriangle size={14} className="text-orange-400" />
          )}
          <span className={`text-sm font-medium ${esGuias ? 'text-emerald-400' : 'text-orange-400'}`}>
            {esGuias ? 'Guías' : 'Novedades'} #{ronda.numero}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <User size={10} />
          <span>{ronda.usuarioNombre}</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">
          {ronda.horaInicio} - {ronda.horaFin}
        </span>
        {esGuias ? (
          <span className="text-emerald-400 font-medium">
            {(ronda as RondaGuias).realizado} realizadas
          </span>
        ) : (
          <span className="text-orange-400 font-medium">
            {(ronda as RondaNovedades).solucionadas} solucionadas
          </span>
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;
