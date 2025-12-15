import React from 'react';
import { Timer, BarChart3, Settings } from 'lucide-react';
import { useAppStore, ViewMode } from './stores/appStore';
import {
  TitleBar,
  CountdownTimer,
  UserSelector,
  AdminPanel,
  RoundForm,
  StatsPanel,
} from './components';

const App: React.FC = () => {
  const { modoAdmin, viewMode, setViewMode, usuarioActual } = useAppStore();

  const tabs: Array<{ id: ViewMode; label: string; icon: React.ReactNode }> = [
    { id: 'timer', label: 'Timer', icon: <Timer className="w-4 h-4" /> },
    { id: 'stats', label: 'Stats', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  if (modoAdmin) {
    tabs.push({ id: 'admin', label: 'Admin', icon: <Settings className="w-4 h-4" /> });
  }

  return (
    <div className="h-screen flex flex-col glass rounded-xl overflow-hidden">
      {/* Title bar */}
      <TitleBar />

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
          <div className="animate-fade-in">
            <CountdownTimer />
            {usuarioActual && <RoundForm />}
            {!usuarioActual && (
              <div className="px-4 text-center text-dark-500 text-sm">
                Selecciona un usuario para registrar rondas
              </div>
            )}
          </div>
        )}

        {viewMode === 'stats' && (
          <div className="animate-fade-in">
            <StatsPanel />
          </div>
        )}

        {viewMode === 'admin' && modoAdmin && (
          <div className="animate-fade-in">
            <AdminPanel />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-dark-700/50 text-center">
        <p className="text-[10px] text-dark-500">
          LITPER PEDIDOS v1.0 | Siempre encima
        </p>
      </div>
    </div>
  );
};

export default App;
