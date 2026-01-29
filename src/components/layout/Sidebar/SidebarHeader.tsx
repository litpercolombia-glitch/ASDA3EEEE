/**
 * SidebarHeader - LITPER PRO
 *
 * Header del sidebar con logo y toggle de colapsar
 * Inspirado en Linear, Notion y Slack
 */

import React from 'react';
import { PanelLeftClose, PanelLeft, Sparkles } from 'lucide-react';
import { useSidebarStore } from '../../../stores/sidebarStore';
import { SidebarTooltip } from './SidebarTooltip';

interface SidebarHeaderProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  logo?: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  isCollapsed = false,
  onToggleCollapse,
  logo,
  title = 'LITPER',
  subtitle = 'Logística PRO',
}) => {
  const { toggleCollapsed } = useSidebarStore();

  const handleToggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      toggleCollapsed();
    }
  };

  return (
    <div
      className={`
        relative flex items-center
        h-16 px-3
        border-b border-slate-800/50
        ${isCollapsed ? 'justify-center' : 'justify-between'}
      `}
    >
      {/* Logo & Title */}
      <div className={`flex items-center gap-3 ${isCollapsed ? '' : 'flex-1 min-w-0'}`}>
        {/* Logo */}
        <div
          className={`
            relative flex-shrink-0
            w-9 h-9 rounded-xl
            bg-gradient-to-br from-blue-600 to-indigo-600
            flex items-center justify-center
            shadow-lg shadow-blue-500/20
            transition-transform duration-200
            hover:scale-105
          `}
        >
          {logo || <Sparkles className="w-5 h-5 text-white" />}

          {/* Pro badge */}
          <span
            className="
              absolute -bottom-0.5 -right-0.5
              px-1 py-px text-[8px] font-bold
              bg-amber-500 text-white
              rounded-full
              shadow-sm
            "
          >
            PRO
          </span>
        </div>

        {/* Title & Subtitle */}
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-white truncate">
              {title}
            </h1>
            <p className="text-[10px] text-slate-500 truncate -mt-0.5">
              {subtitle}
            </p>
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      {!isCollapsed && (
        <SidebarTooltip
          content={isCollapsed ? 'Expandir' : 'Colapsar'}
          shortcut="["
          side="right"
        >
          <button
            onClick={handleToggle}
            className="
              p-2 rounded-lg
              text-slate-500 hover:text-white
              hover:bg-white/5
              transition-all duration-200
              group
            "
            aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          >
            <PanelLeftClose
              className="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
            />
          </button>
        </SidebarTooltip>
      )}

      {/* Expand button when collapsed */}
      {isCollapsed && (
        <SidebarTooltip content="Expandir" shortcut="[" side="right">
          <button
            onClick={handleToggle}
            className="
              absolute -right-3 top-1/2 -translate-y-1/2
              w-6 h-6 rounded-full
              bg-slate-800 border border-slate-700
              text-slate-400 hover:text-white
              flex items-center justify-center
              opacity-0 group-hover:opacity-100
              transition-all duration-200
              shadow-lg
              hover:bg-slate-700
              z-50
            "
            aria-label="Expandir sidebar"
          >
            <PanelLeft className="w-3 h-3" />
          </button>
        </SidebarTooltip>
      )}
    </div>
  );
};

// Workspace switcher for teams (future feature)
interface WorkspaceSwitcherProps {
  currentWorkspace: {
    name: string;
    logo?: React.ReactNode;
    plan?: string;
  };
  workspaces?: Array<{
    id: string;
    name: string;
    logo?: React.ReactNode;
  }>;
  onSwitch?: (id: string) => void;
  isCollapsed?: boolean;
}

export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({
  currentWorkspace,
  workspaces = [],
  onSwitch,
  isCollapsed = false,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  if (isCollapsed) {
    return (
      <SidebarTooltip content={currentWorkspace.name} side="right">
        <button
          className="
            w-9 h-9 rounded-xl
            bg-gradient-to-br from-slate-700 to-slate-800
            flex items-center justify-center
            text-white font-bold text-sm
            border border-slate-700
            hover:border-slate-600
            transition-colors duration-200
          "
        >
          {currentWorkspace.logo || currentWorkspace.name.charAt(0)}
        </button>
      </SidebarTooltip>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-full flex items-center gap-3 p-2 rounded-lg
          hover:bg-white/5
          transition-colors duration-200
        "
      >
        <div
          className="
            w-8 h-8 rounded-lg
            bg-gradient-to-br from-slate-700 to-slate-800
            flex items-center justify-center
            text-white font-bold text-sm
            border border-slate-700
          "
        >
          {currentWorkspace.logo || currentWorkspace.name.charAt(0)}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {currentWorkspace.name}
          </p>
          {currentWorkspace.plan && (
            <p className="text-[10px] text-slate-500">{currentWorkspace.plan}</p>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && workspaces.length > 0 && (
        <div
          className="
            absolute left-0 right-0 top-full mt-1 z-50
            bg-slate-800 border border-slate-700
            rounded-lg shadow-xl overflow-hidden
          "
        >
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => {
                onSwitch?.(ws.id);
                setIsOpen(false);
              }}
              className="
                w-full flex items-center gap-3 p-2
                hover:bg-white/5
                transition-colors duration-200
              "
            >
              <div
                className="
                  w-7 h-7 rounded-md
                  bg-slate-700
                  flex items-center justify-center
                  text-white text-xs font-bold
                "
              >
                {ws.logo || ws.name.charAt(0)}
              </div>
              <span className="text-sm text-slate-300">{ws.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SidebarHeader;
