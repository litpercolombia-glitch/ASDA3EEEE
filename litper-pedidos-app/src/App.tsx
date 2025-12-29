import React, { useState } from 'react';
import { useAppStore } from './stores/appStore';
import {
  TitleBar,
  CountdownTimer,
  UserSelector,
  AdminPanel,
  StatsPanel,
  Sidebar,
  QuickCounters,
} from './components';

const App: React.FC = () => {
  const { modoAdmin, viewMode, displayMode } = useAppStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  // ============ MODO COMPACTO ============
  if (displayMode === 'compact') {
    return (
      <div className="h-screen flex flex-col glass rounded-xl overflow-hidden">
        <TitleBar />
        <div className="flex-1 overflow-y-auto">
          <CountdownTimer compact />
          <QuickCounters mode="compact" />
        </div>
      </div>
    );
  }

  // ============ MODO BARRA LATERAL ============
  if (displayMode === 'sidebar') {
    return (
      <div className="h-screen flex flex-col glass rounded-xl overflow-hidden" style={{ width: '80px' }}>
        <TitleBar />
        <div className="flex-1 overflow-y-auto">
          <CountdownTimer compact />
          <QuickCounters mode="sidebar" />
        </div>
      </div>
    );
  }

  // ============ MODO NORMAL ============
  return (
    <div className="h-screen flex flex-col glass rounded-xl overflow-hidden">
      {/* Title bar */}
      <TitleBar />

      {/* Main content with sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar de navegación */}
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
                <QuickCounters mode="normal" />
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
              LITPER PEDIDOS v1.2 | Siempre encima
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
