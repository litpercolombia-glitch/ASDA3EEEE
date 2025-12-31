import React from 'react';
import { Download, BarChart3, Package, Settings, Minimize2, Square, X } from 'lucide-react';
import { useAppStore, ViewMode } from '../../stores/appStore';
import ProcessSelector from '../ProcessSelector';
import Timer from '../Timer';
import QuickCounters from '../QuickCounters';
import BlocksPanel from '../BlocksPanel';
import StatsPanel from '../StatsPanel';
import AdminPanel from '../AdminPanel';
import UserSelector from '../UserSelector';

const WidgetLayout: React.FC = () => {
  const {
    viewMode,
    setViewMode,
    setMostrarModalExportar,
    modoAdmin,
    toggleModoAdmin,
    usuarioActual,
    ultimoAutoGuardado,
    numeroBloqueHoy,
    finalizarBloque,
  } = useAppStore();

  const tabs: Array<{ id: ViewMode; label: string; icon: React.ReactNode }> = [
    { id: 'timer', label: 'Timer', icon: <Package className="w-4 h-4" /> },
    { id: 'stats', label: 'Stats', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'bloques', label: 'Bloques', icon: <Package className="w-4 h-4" /> },
  ];

  if (modoAdmin) {
    tabs.push({ id: 'admin', label: 'Admin', icon: <Settings className="w-4 h-4" /> });
  }

  return (
    <div className="h-screen flex flex-col bg-dark-900 rounded-xl overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-dark-800 border-b border-dark-700 drag-region">
        <span className="text-sm font-bold text-primary-400 no-drag">LITPER PEDIDOS</span>
        <div className="flex items-center gap-2 no-drag">
          <button
            onClick={() => setMostrarModalExportar(true)}
            className="p-1.5 rounded bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-all"
            title="Exportar (E)"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={toggleModoAdmin}
            className={`p-1.5 rounded transition-all ${
              modoAdmin ? 'bg-blue-600/20 text-blue-400' : 'bg-dark-700 text-dark-400'
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1 ml-2">
            <button className="p-1 rounded hover:bg-dark-700 text-dark-400">
              <Minimize2 className="w-4 h-4" />
            </button>
            <button className="p-1 rounded hover:bg-red-600/50 text-dark-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Process selector */}
      <div className="px-4 py-2">
        <ProcessSelector />
      </div>

      {/* User selector */}
      <UserSelector />

      {/* Navigation tabs */}
      <div className="px-4 pb-2">
        <div className="flex bg-dark-800/50 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all no-drag ${
                viewMode === tab.id
                  ? 'bg-primary-500 text-white'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === 'timer' && (
          <div className="animate-fade-in px-4">
            <Timer />
            {usuarioActual ? (
              <>
                <QuickCounters showGroups={true} />
                <div className="mt-4">
                  <button
                    onClick={() => finalizarBloque()}
                    className="w-full py-3 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Package className="w-5 h-5" />
                    Reiniciar Bloque
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center text-dark-500 text-sm py-4">
                Selecciona un usuario para registrar
              </div>
            )}
          </div>
        )}

        {viewMode === 'stats' && (
          <div className="animate-fade-in">
            <StatsPanel />
          </div>
        )}

        {viewMode === 'bloques' && (
          <div className="animate-fade-in">
            <BlocksPanel />
          </div>
        )}

        {viewMode === 'admin' && modoAdmin && (
          <div className="animate-fade-in">
            <AdminPanel />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-dark-700/50 flex items-center justify-between">
        <p className="text-[10px] text-dark-500">
          Bloque #{numeroBloqueHoy}
        </p>
        {ultimoAutoGuardado && (
          <p className="text-[10px] text-dark-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
            Auto-guardado
          </p>
        )}
        <p className="text-[10px] text-dark-500">
          LITPER v2.0
        </p>
      </div>
    </div>
  );
};

export default WidgetLayout;
