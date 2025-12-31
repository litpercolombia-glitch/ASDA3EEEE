import React, { useEffect } from 'react';
import { useAppStore } from './stores/appStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useAutoSave } from './hooks/useAutoSave';
import {
  WidgetLayout,
  SidebarLayout,
  CompactLayout,
  ExportModal,
} from './components';

const App: React.FC = () => {
  const { viewLayout } = useAppStore();

  // Activar atajos de teclado
  useKeyboardShortcuts();

  // Activar auto-guardado
  useAutoSave();

  // Renderizar layout según selección
  const renderLayout = () => {
    switch (viewLayout) {
      case 'sidebar':
        return <SidebarLayout />;
      case 'compact':
        return <CompactLayout />;
      case 'widget':
      default:
        return <WidgetLayout />;
    }
  };

  return (
    <div className="h-screen overflow-hidden">
      {renderLayout()}
      <ExportModal />
    </div>
  );
};

export default App;
