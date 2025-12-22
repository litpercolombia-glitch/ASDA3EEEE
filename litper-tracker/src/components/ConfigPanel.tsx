import React, { useState } from 'react';
import { Settings, X, Save, Monitor, Smartphone, Minimize2, Square } from 'lucide-react';
import { useTrackerStore, ModoVentana } from '../stores/trackerStore';

const MODOS: { id: ModoVentana; nombre: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'normal', nombre: 'Normal', icon: <Monitor size={18} />, desc: '360x580' },
  { id: 'compacto', nombre: 'Compacto', icon: <Smartphone size={18} />, desc: '320x420' },
  { id: 'mini', nombre: 'Mini', icon: <Minimize2 size={18} />, desc: '280x200' },
  { id: 'micro', nombre: 'Micro', icon: <Square size={12} />, desc: '180x80' },
];

export const ConfigPanel: React.FC = () => {
  const { apiUrl, modo, mostrarConfig, setApiUrl, setModo, toggleConfig } = useTrackerStore();
  const [tempApiUrl, setTempApiUrl] = useState(apiUrl);
  const [guardado, setGuardado] = useState(false);

  const handleGuardarApi = async () => {
    await setApiUrl(tempApiUrl);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2000);
  };

  if (!mostrarConfig) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-600 w-full max-w-sm shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Settings size={20} className="text-purple-400" />
            <span className="font-bold text-white">Configuración</span>
          </div>
          <button
            onClick={toggleConfig}
            className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-5">
          {/* API URL */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">URL del API</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tempApiUrl}
                onChange={(e) => setTempApiUrl(e.target.value)}
                placeholder="https://tu-api.com/api/tracker"
                className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
              />
              <button
                onClick={handleGuardarApi}
                className={`px-3 py-2 rounded-lg transition-all ${
                  guardado
                    ? 'bg-green-600 text-white'
                    : 'bg-purple-600 hover:bg-purple-500 text-white'
                }`}
              >
                {guardado ? '✓' : <Save size={18} />}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Se guarda permanentemente</p>
          </div>

          {/* Tamaño de ventana */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Tamaño de ventana</label>
            <div className="grid grid-cols-2 gap-2">
              {MODOS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setModo(m.id)}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                    modo === m.id
                      ? 'bg-purple-600/30 border-purple-500 text-purple-300'
                      : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {m.icon}
                  <div className="text-left">
                    <div className="text-sm font-medium">{m.nombre}</div>
                    <div className="text-xs text-slate-500">{m.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={toggleConfig}
            className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;
