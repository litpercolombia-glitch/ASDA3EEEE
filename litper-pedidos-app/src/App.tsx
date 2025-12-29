import React, { useState } from 'react';
import { useAppStore } from './stores/appStore';
import {
  TitleBar,
  CountdownTimer,
  UserSelector,
  AdminPanel,
  RoundForm,
  StatsPanel,
  Sidebar,
} from './components';

const App: React.FC = () => {
  const { modoAdmin, viewMode, usuarioActual, isCompact } = useAppStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  // Modo compacto - solo muestra lo esencial
  if (isCompact) {
    return (
      <div className="h-screen flex flex-col glass rounded-xl overflow-hidden">
        <TitleBar />
        <div className="flex-1 overflow-y-auto p-2">
          <CountdownTimer compact />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col glass rounded-xl overflow-hidden">
      {/* Title bar */}
      <TitleBar />

      {/* Main content with sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* User selector */}
          <UserSelector />

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
          <div className="px-4 py-1.5 border-t border-dark-700/50 text-center">
            <p className="text-[10px] text-dark-500">
              LITPER PEDIDOS v1.1 | Siempre encima
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
