import React, { useState } from 'react';
import { Timer, BarChart3, Settings, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore, ViewMode } from '../stores/appStore';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggleCollapse }) => {
  const { modoAdmin, viewMode, setViewMode, reiniciarRondas, rondaActual } = useAppStore();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const menuItems: Array<{
    id: ViewMode | 'reset';
    label: string;
    icon: React.ReactNode;
    action?: () => void;
    isSpecial?: boolean;
    showAlways?: boolean;
  }> = [
    {
      id: 'timer',
      label: 'Timer',
      icon: <Timer className="w-5 h-5" />,
      showAlways: true,
    },
    {
      id: 'stats',
      label: 'Estadísticas',
      icon: <BarChart3 className="w-5 h-5" />,
      showAlways: true,
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: <Settings className="w-5 h-5" />,
      showAlways: false,
    },
    {
      id: 'reset',
      label: `Reiniciar (R${rondaActual})`,
      icon: <RotateCcw className="w-5 h-5" />,
      isSpecial: true,
      showAlways: true,
      action: () => setShowResetConfirm(true),
    },
  ];

  const handleMenuClick = (item: typeof menuItems[0]) => {
    if (item.action) {
      item.action();
    } else if (item.id !== 'reset') {
      setViewMode(item.id as ViewMode);
    }
  };

  const handleConfirmReset = () => {
    reiniciarRondas();
    setShowResetConfirm(false);
  };

  const visibleItems = menuItems.filter(
    (item) => item.showAlways || (item.id === 'admin' && modoAdmin)
  );

  return (
    <>
      <div
        className={`flex flex-col bg-dark-900/80 border-r border-dark-700/50 transition-all duration-300 ${
          isCollapsed ? 'w-12' : 'w-36'
        }`}
      >
        {/* Menu Items */}
        <div className="flex-1 py-2 flex flex-col gap-1">
          {visibleItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item)}
              className={`group flex items-center gap-3 px-3 py-2.5 mx-1 rounded-lg transition-all no-drag ${
                item.isSpecial
                  ? 'text-amber-400 hover:bg-amber-500/20 hover:text-amber-300'
                  : viewMode === item.id
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'text-dark-400 hover:bg-dark-700/50 hover:text-white'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <span className={`flex-shrink-0 ${item.isSpecial ? 'animate-pulse' : ''}`}>
                {item.icon}
              </span>
              {!isCollapsed && (
                <span className="text-xs font-medium truncate">{item.label}</span>
              )}
            </button>
          ))}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="flex items-center justify-center py-3 border-t border-dark-700/50 text-dark-500 hover:text-white transition-colors no-drag"
          title={isCollapsed ? 'Expandir' : 'Colapsar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-dark-800 rounded-xl p-4 mx-4 max-w-xs w-full border border-dark-600 shadow-xl">
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-400" />
              Reiniciar Rondas
            </h3>
            <p className="text-dark-300 text-sm mb-4">
              ¿Estás seguro de reiniciar el contador de rondas a 1? Las rondas guardadas no se eliminarán.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-3 py-2 rounded-lg bg-dark-700 text-dark-300 hover:bg-dark-600 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmReset}
                className="flex-1 px-3 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors text-sm font-medium"
              >
                Reiniciar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
