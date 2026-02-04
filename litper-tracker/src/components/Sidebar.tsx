import React from 'react';
import { FileText, AlertTriangle, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTrackerStore, TipoProceso } from '../stores/trackerStore';

interface SidebarProps {
  currentProcess: TipoProceso | null;
  onSelectProcess: (process: TipoProceso) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentProcess, onSelectProcess }) => {
  const { sidebarCollapsed, toggleSidebar, totalHoyGuias, totalHoyNovedades } = useTrackerStore();

  const menuItems = [
    {
      id: 'guias' as TipoProceso,
      label: 'Guías',
      icon: FileText,
      color: 'emerald',
      badge: totalHoyGuias,
    },
    {
      id: 'novedades' as TipoProceso,
      label: 'Novedades',
      icon: AlertTriangle,
      color: 'orange',
      badge: totalHoyNovedades,
    },
  ];

  return (
    <div
      className={`bg-dark-900 border-r border-dark-600 flex flex-col transition-all duration-200 ease-in-out ${
        sidebarCollapsed ? 'w-12' : 'w-40'
      }`}
    >
      {/* Menu items */}
      <div className="flex-1 py-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentProcess === item.id;
          const colorClasses = {
            emerald: isActive
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500'
              : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 border-transparent',
            orange: isActive
              ? 'bg-orange-500/20 text-orange-400 border-orange-500'
              : 'text-slate-400 hover:text-orange-400 hover:bg-orange-500/10 border-transparent',
          };

          return (
            <button
              key={item.id}
              onClick={() => onSelectProcess(item.id)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 border-l-2 transition-all duration-150 ${
                colorClasses[item.color as keyof typeof colorClasses]
              }`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && (
                <>
                  <span className="text-sm font-medium flex-1 text-left truncate">
                    {item.label}
                  </span>
                  {item.badge > 0 && (
                    <span className="text-xs bg-dark-700 px-1.5 py-0.5 rounded">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
              {sidebarCollapsed && item.badge > 0 && (
                <span className="absolute left-8 top-1 text-[10px] bg-amber-500 text-white w-4 h-4 rounded-full flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        className="p-2 border-t border-dark-600 text-slate-500 hover:text-white hover:bg-dark-700 transition-colors flex items-center justify-center"
        title={sidebarCollapsed ? 'Expandir' : 'Contraer'}
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
    </div>
  );
};

export default Sidebar;
