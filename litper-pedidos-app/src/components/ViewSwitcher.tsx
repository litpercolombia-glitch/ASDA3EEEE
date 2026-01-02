import React from 'react';
import { Columns, LayoutGrid, Minus } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { ViewLayout } from '../config/processConfig';

interface ViewSwitcherProps {
  compact?: boolean;
}

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ compact = false }) => {
  const { viewLayout, setViewLayout } = useAppStore();

  const views: Array<{ id: ViewLayout; label: string; icon: React.ReactNode; shortcut: string }> = [
    { id: 'widget', label: 'Widget', icon: <LayoutGrid className="w-4 h-4" />, shortcut: 'F1' },
    { id: 'sidebar', label: 'Barra', icon: <Columns className="w-4 h-4" />, shortcut: 'F2' },
    { id: 'compact', label: 'Mini', icon: <Minus className="w-4 h-4" />, shortcut: 'F3' },
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => setViewLayout(view.id)}
            className={`p-1.5 rounded transition-all ${
              viewLayout === view.id
                ? 'bg-primary-500 text-white'
                : 'bg-dark-700 text-dark-400 hover:text-white hover:bg-dark-600'
            }`}
            title={`${view.label} (${view.shortcut})`}
          >
            {view.icon}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-dark-800/50 rounded-lg">
      <span className="text-xs text-dark-400 mr-2">Vista:</span>
      {views.map((view) => (
        <button
          key={view.id}
          onClick={() => setViewLayout(view.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            viewLayout === view.id
              ? 'bg-primary-500 text-white shadow-glow'
              : 'bg-dark-700 text-dark-400 hover:text-white hover:bg-dark-600'
          }`}
        >
          {view.icon}
          <span>{view.label}</span>
          <span className="text-[10px] opacity-60">({view.shortcut})</span>
        </button>
      ))}
    </div>
  );
};

export default ViewSwitcher;
