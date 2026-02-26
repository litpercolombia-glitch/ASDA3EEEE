import React, { useState } from 'react';
import { useTrackerStore, TipoProceso } from '../stores/trackerStore';
import { X, Plus, Trash2, Play, Clock, FileText, AlertTriangle, Bookmark } from 'lucide-react';

const TemplatesPanel: React.FC = () => {
  const {
    showTemplates,
    toggleTemplates,
    plantillas,
    agregarPlantilla,
    eliminarPlantilla,
    aplicarPlantilla,
  } = useTrackerStore();

  const [creando, setCreando] = useState(false);
  const [nuevaPlantilla, setNuevaPlantilla] = useState({
    nombre: '',
    tipo: 'guias' as TipoProceso,
    tiempoMinutos: 30,
    descripcion: '',
  });

  const handleCrear = () => {
    if (nuevaPlantilla.nombre.trim()) {
      agregarPlantilla(nuevaPlantilla);
      setNuevaPlantilla({
        nombre: '',
        tipo: 'guias',
        tiempoMinutos: 30,
        descripcion: '',
      });
      setCreando(false);
    }
  };

  if (!showTemplates) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 rounded-xl border border-dark-600 w-full max-w-sm max-h-[80vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-600">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Plantillas de Ronda</h2>
          </div>
          <button
            onClick={toggleTemplates}
            className="p-1 hover:bg-dark-700 rounded text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Lista de plantillas */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {plantillas.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              <Bookmark className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay plantillas</p>
              <p className="text-xs mt-1">Crea una plantilla para empezar rápido</p>
            </div>
          ) : (
            plantillas.map((plantilla) => (
              <div
                key={plantilla.id}
                className={`p-3 rounded-lg border ${
                  plantilla.tipo === 'guias'
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-orange-500/10 border-orange-500/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {plantilla.tipo === 'guias' ? (
                      <FileText size={14} className="text-emerald-400" />
                    ) : (
                      <AlertTriangle size={14} className="text-orange-400" />
                    )}
                    <span className="font-medium text-white">{plantilla.nombre}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => aplicarPlantilla(plantilla.id)}
                      className="p-1.5 bg-blue-600 hover:bg-blue-500 rounded text-white transition-colors"
                      title="Aplicar"
                    >
                      <Play size={12} />
                    </button>
                    <button
                      onClick={() => eliminarPlantilla(plantilla.id)}
                      className="p-1.5 bg-red-600/20 hover:bg-red-600/40 rounded text-red-400 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <Clock size={10} />
                    <span>{plantilla.tiempoMinutos} min</span>
                  </div>
                  <span className={plantilla.tipo === 'guias' ? 'text-emerald-400' : 'text-orange-400'}>
                    {plantilla.tipo === 'guias' ? 'Guías' : 'Novedades'}
                  </span>
                </div>

                {plantilla.descripcion && (
                  <p className="text-xs text-slate-500 mt-1">{plantilla.descripcion}</p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Crear nueva plantilla */}
        {creando ? (
          <div className="p-4 border-t border-dark-600 space-y-3">
            <input
              type="text"
              placeholder="Nombre de la plantilla"
              value={nuevaPlantilla.nombre}
              onChange={(e) => setNuevaPlantilla({ ...nuevaPlantilla, nombre: e.target.value })}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              autoFocus
            />

            <div className="grid grid-cols-2 gap-2">
              <select
                value={nuevaPlantilla.tipo}
                onChange={(e) => setNuevaPlantilla({ ...nuevaPlantilla, tipo: e.target.value as TipoProceso })}
                className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="guias">Guías</option>
                <option value="novedades">Novedades</option>
              </select>

              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={nuevaPlantilla.tiempoMinutos}
                  onChange={(e) => setNuevaPlantilla({ ...nuevaPlantilla, tiempoMinutos: parseInt(e.target.value) || 30 })}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  min={5}
                  max={120}
                />
                <span className="text-slate-400 text-sm">min</span>
              </div>
            </div>

            <input
              type="text"
              placeholder="Descripción (opcional)"
              value={nuevaPlantilla.descripcion}
              onChange={(e) => setNuevaPlantilla({ ...nuevaPlantilla, descripcion: e.target.value })}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setCreando(false)}
                className="flex-1 py-2 bg-dark-700 hover:bg-dark-600 text-slate-400 text-sm font-medium rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCrear}
                disabled={!nuevaPlantilla.nombre.trim()}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-dark-600 disabled:text-slate-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Crear
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 border-t border-dark-600">
            <button
              onClick={() => setCreando(true)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Nueva Plantilla
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplatesPanel;
