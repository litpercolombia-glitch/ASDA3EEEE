/**
 * SidebarSearch - LITPER PRO
 *
 * Barra de búsqueda con Cmd+K para abrir Command Palette
 * Inspirado en Linear, Raycast y Slack
 */

import React from 'react';
import { Search, Command } from 'lucide-react';
import { useSidebarStore } from '../../../stores/sidebarStore';
import { SidebarTooltip } from './SidebarTooltip';

interface SidebarSearchProps {
  isCollapsed?: boolean;
  placeholder?: string;
  className?: string;
}

export const SidebarSearch: React.FC<SidebarSearchProps> = ({
  isCollapsed = false,
  placeholder = 'Buscar...',
  className = '',
}) => {
  const { openCommandPalette } = useSidebarStore();

  const handleClick = () => {
    openCommandPalette();
  };

  // Collapsed version - just an icon
  if (isCollapsed) {
    return (
      <div className={`px-3 py-2 ${className}`}>
        <SidebarTooltip content="Buscar" shortcut="⌘K" side="right">
          <button
            onClick={handleClick}
            className="
              w-full h-9 rounded-lg
              bg-slate-800/50 border border-slate-700/50
              flex items-center justify-center
              text-slate-500 hover:text-slate-300
              hover:bg-slate-800 hover:border-slate-600
              transition-all duration-200
            "
          >
            <Search className="w-4 h-4" />
          </button>
        </SidebarTooltip>
      </div>
    );
  }

  // Expanded version
  return (
    <div className={`px-3 py-2 ${className}`}>
      <button
        onClick={handleClick}
        className="
          group w-full h-9 px-3 rounded-lg
          bg-slate-800/50 border border-slate-700/50
          flex items-center gap-2
          text-sm text-slate-500
          hover:bg-slate-800 hover:border-slate-600 hover:text-slate-400
          transition-all duration-200
        "
      >
        <Search className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
        <span className="flex-1 text-left">{placeholder}</span>
        <div className="flex items-center gap-0.5">
          <kbd
            className="
              px-1.5 py-0.5 text-[10px] font-medium
              bg-slate-700/50 border border-slate-600/50
              rounded text-slate-500
              group-hover:bg-slate-700 group-hover:border-slate-600
            "
          >
            <Command className="w-2.5 h-2.5 inline-block" />
          </kbd>
          <kbd
            className="
              px-1.5 py-0.5 text-[10px] font-medium
              bg-slate-700/50 border border-slate-600/50
              rounded text-slate-500
              group-hover:bg-slate-700 group-hover:border-slate-600
            "
          >
            K
          </kbd>
        </div>
      </button>
    </div>
  );
};

// Quick filter pills
interface QuickFiltersProps {
  filters: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    count?: number;
  }>;
  activeFilter?: string;
  onFilterChange?: (filterId: string) => void;
  isCollapsed?: boolean;
}

export const QuickFilters: React.FC<QuickFiltersProps> = ({
  filters,
  activeFilter,
  onFilterChange,
  isCollapsed = false,
}) => {
  if (isCollapsed) return null;

  return (
    <div className="px-3 py-1">
      <div className="flex flex-wrap gap-1">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => onFilterChange?.(filter.id)}
            className={`
              inline-flex items-center gap-1 px-2 py-1
              text-[11px] font-medium rounded-md
              transition-all duration-200
              ${
                activeFilter === filter.id
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
              }
            `}
          >
            {filter.icon && (
              <span className="w-3 h-3">{filter.icon}</span>
            )}
            {filter.label}
            {filter.count !== undefined && (
              <span className="text-[10px] opacity-60">
                {filter.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SidebarSearch;
