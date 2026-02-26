import React, { useState, useEffect } from 'react';
import { Settings, X, Save } from 'lucide-react';
import { useTrackerStore } from '../stores/trackerStore';

export const ConfigPanel: React.FC = () => {
  const { apiUrl, mostrarConfig, setApiUrl, toggleConfig } = useTrackerStore();
  const [tempApiUrl, setTempApiUrl] = useState(apiUrl);
  const [guardado, setGuardado] = useState(false);

  // Sincronizar tempApiUrl cuando cambie apiUrl
  useEffect(() => {
    setTempApiUrl(apiUrl);
  }, [apiUrl]);

  const handleGuardarApi = async () => {
    await setApiUrl(tempApiUrl);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2000);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleConfig();
  };

  if (!mostrarConfig) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-dark-800 rounded-xl border border-dark-600 w-full max-w-xs shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-dark-600">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-purple-400" />
            <span className="font-bold text-white text-sm">Configuración</span>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-dark-700 rounded transition-colors"
          >
            <X size={18} className="text-slate-400 hover:text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 space-y-4">
          {/* API URL */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">URL del API</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tempApiUrl}
                onChange={(e) => setTempApiUrl(e.target.value)}
                placeholder="https://tu-api.com/api/tracker"
                className="flex-1 bg-dark-900 border border-dark-600 rounded-lg px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
              />
              <button
                onClick={handleGuardarApi}
                className={`px-2 py-1.5 rounded-lg transition-all text-xs ${
                  guardado
                    ? 'bg-emerald-600 text-white'
                    : 'bg-purple-600 hover:bg-purple-500 text-white'
                }`}
              >
                {guardado ? '✓' : <Save size={14} />}
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="text-xs text-slate-500 bg-dark-700 rounded-lg p-2">
            <p>Usa los botones de la barra superior para cambiar el modo de vista.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-dark-600">
          <button
            onClick={handleClose}
            className="w-full py-2 bg-dark-700 hover:bg-dark-600 text-white text-sm rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;
