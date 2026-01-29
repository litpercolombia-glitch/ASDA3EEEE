/**
 * SidebarHeader - LITPER PRO
 *
 * Header del sidebar con logo animado y toggle de colapsar
 * Inspirado en Linear, Notion y Slack
 */

import React, { useState } from 'react';
import { PanelLeftClose, PanelLeft, Sparkles } from 'lucide-react';
import { useSidebarStore } from '../../../../stores/sidebarStore';
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
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [isToggleHovered, setIsToggleHovered] = useState(false);

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
        ${isCollapsed ? 'justify-center' : 'justify-between'}
      `}
      style={{
        borderBottom: '1px solid rgba(51, 65, 85, 0.5)',
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.5) 0%, transparent 100%)',
      }}
    >
      {/* Logo & Title */}
      <div className={`flex items-center gap-3 ${isCollapsed ? '' : 'flex-1 min-w-0'}`}>
        {/* Logo con animación premium */}
        <div
          onMouseEnter={() => setIsLogoHovered(true)}
          onMouseLeave={() => setIsLogoHovered(false)}
          className="relative flex-shrink-0 cursor-pointer"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '12px',
            background: isLogoHovered
              ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #6366f1 100%)'
              : 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isLogoHovered
              ? '0 8px 32px rgba(59, 130, 246, 0.4), 0 0 0 2px rgba(99, 102, 241, 0.2)'
              : '0 4px 16px rgba(59, 130, 246, 0.25)',
            transform: isLogoHovered ? 'scale(1.08) rotate(3deg)' : 'scale(1) rotate(0deg)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Efecto de brillo animado */}
          <span
            className="absolute inset-0 rounded-xl overflow-hidden"
            style={{
              opacity: isLogoHovered ? 1 : 0,
              transition: 'opacity 0.3s ease',
            }}
          >
            <span
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
                transform: isLogoHovered ? 'translateX(100%)' : 'translateX(-100%)',
                transition: 'transform 0.6s ease',
              }}
            />
          </span>

          {logo || (
            <Sparkles
              className="w-5 h-5 text-white relative z-10"
              style={{
                filter: isLogoHovered ? 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))' : 'none',
                transform: isLogoHovered ? 'rotate(12deg)' : 'rotate(0deg)',
                transition: 'all 0.3s ease',
              }}
            />
          )}

          {/* Pro badge con glow */}
          <span
            className="absolute -bottom-0.5 -right-0.5 px-1 py-px text-[8px] font-bold rounded-full"
            style={{
              background: isLogoHovered
                ? 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)'
                : '#f59e0b',
              color: 'white',
              boxShadow: isLogoHovered
                ? '0 0 12px rgba(245, 158, 11, 0.6)'
                : '0 2px 4px rgba(0, 0, 0, 0.2)',
              transform: isLogoHovered ? 'scale(1.1)' : 'scale(1)',
              transition: 'all 0.2s ease',
            }}
          >
            PRO
          </span>
        </div>

        {/* Title & Subtitle con animación */}
        {!isCollapsed && (
          <div
            className="flex-1 min-w-0"
            style={{
              transform: isLogoHovered ? 'translateX(4px)' : 'translateX(0)',
              transition: 'transform 0.2s ease',
            }}
          >
            <h1
              className="text-base font-bold truncate"
              style={{
                color: isLogoHovered ? '#ffffff' : '#f1f5f9',
                textShadow: isLogoHovered ? '0 0 20px rgba(255, 255, 255, 0.3)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              {title}
            </h1>
            <p
              className="text-[10px] truncate -mt-0.5"
              style={{
                color: isLogoHovered ? '#94a3b8' : '#64748b',
                transition: 'color 0.2s ease',
              }}
            >
              {subtitle}
            </p>
          </div>
        )}
      </div>

      {/* Collapse Toggle con animación */}
      {!isCollapsed && (
        <SidebarTooltip
          content={isCollapsed ? 'Expandir' : 'Colapsar'}
          shortcut="["
          side="right"
        >
          <button
            onClick={handleToggle}
            onMouseEnter={() => setIsToggleHovered(true)}
            onMouseLeave={() => setIsToggleHovered(false)}
            className="p-2 rounded-lg group"
            style={{
              color: isToggleHovered ? '#ffffff' : '#64748b',
              background: isToggleHovered
                ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)'
                : 'transparent',
              boxShadow: isToggleHovered
                ? '0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                : 'none',
              transform: isToggleHovered ? 'scale(1.05)' : 'scale(1)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          >
            <PanelLeftClose
              className="w-4 h-4"
              style={{
                transform: isToggleHovered ? 'translateX(-2px)' : 'translateX(0)',
                transition: 'transform 0.2s ease',
              }}
            />
          </button>
        </SidebarTooltip>
      )}

      {/* Expand button when collapsed con animación */}
      {isCollapsed && (
        <SidebarTooltip content="Expandir" shortcut="[" side="right">
          <button
            onClick={handleToggle}
            onMouseEnter={() => setIsToggleHovered(true)}
            onMouseLeave={() => setIsToggleHovered(false)}
            className="absolute -right-3 top-1/2 flex items-center justify-center z-50"
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              transform: `translateY(-50%) scale(${isToggleHovered ? 1.15 : 1})`,
              background: isToggleHovered
                ? 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)'
                : '#1e293b',
              border: `1px solid ${isToggleHovered ? '#60a5fa' : '#334155'}`,
              color: isToggleHovered ? '#ffffff' : '#94a3b8',
              boxShadow: isToggleHovered
                ? '0 4px 16px rgba(59, 130, 246, 0.4), 0 0 0 4px rgba(59, 130, 246, 0.1)'
                : '0 4px 12px rgba(0, 0, 0, 0.3)',
              opacity: 1,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            aria-label="Expandir sidebar"
          >
            <PanelLeft
              className="w-3 h-3"
              style={{
                transform: isToggleHovered ? 'translateX(1px)' : 'translateX(0)',
                transition: 'transform 0.2s ease',
              }}
            />
          </button>
        </SidebarTooltip>
      )}
    </div>
  );
};

// Workspace switcher for teams (future feature) con animaciones
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
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredWorkspace, setHoveredWorkspace] = useState<string | null>(null);

  if (isCollapsed) {
    return (
      <SidebarTooltip content={currentWorkspace.name} side="right">
        <button
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="flex items-center justify-center"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '12px',
            background: isHovered
              ? 'linear-gradient(135deg, rgba(71, 85, 105, 0.8) 0%, rgba(51, 65, 85, 0.8) 100%)'
              : 'linear-gradient(135deg, #475569 0%, #334155 100%)',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '14px',
            border: `1px solid ${isHovered ? '#64748b' : '#475569'}`,
            boxShadow: isHovered
              ? '0 4px 12px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba(100, 116, 139, 0.2)'
              : 'none',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
            transition: 'all 0.2s ease',
          }}
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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="w-full flex items-center gap-3 p-2 rounded-lg"
        style={{
          background: isHovered
            ? 'linear-gradient(90deg, rgba(255, 255, 255, 0.05) 0%, transparent 100%)'
            : 'transparent',
          transform: isHovered ? 'translateX(2px)' : 'translateX(0)',
          transition: 'all 0.2s ease',
        }}
      >
        <div
          className="flex items-center justify-center"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '14px',
            border: '1px solid #475569',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 0.2s ease',
          }}
        >
          {currentWorkspace.logo || currentWorkspace.name.charAt(0)}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p
            className="text-sm font-medium truncate"
            style={{
              color: isHovered ? '#ffffff' : '#f1f5f9',
              transition: 'color 0.2s ease',
            }}
          >
            {currentWorkspace.name}
          </p>
          {currentWorkspace.plan && (
            <p
              className="text-[10px]"
              style={{
                color: isHovered ? '#94a3b8' : '#64748b',
                transition: 'color 0.2s ease',
              }}
            >
              {currentWorkspace.plan}
            </p>
          )}
        </div>
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          style={{
            color: '#64748b',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && workspaces.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full mt-1 z-50 overflow-hidden rounded-lg shadow-xl"
          style={{
            background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)',
            border: '1px solid rgba(71, 85, 105, 0.5)',
            backdropFilter: 'blur(12px)',
            animation: 'dropdownFadeIn 0.15s ease',
          }}
        >
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => {
                onSwitch?.(ws.id);
                setIsOpen(false);
              }}
              onMouseEnter={() => setHoveredWorkspace(ws.id)}
              onMouseLeave={() => setHoveredWorkspace(null)}
              className="w-full flex items-center gap-3 p-2"
              style={{
                background: hoveredWorkspace === ws.id
                  ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.15) 0%, transparent 100%)'
                  : 'transparent',
                transform: hoveredWorkspace === ws.id ? 'translateX(4px)' : 'translateX(0)',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: '#475569',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  transform: hoveredWorkspace === ws.id ? 'scale(1.05)' : 'scale(1)',
                  transition: 'transform 0.15s ease',
                }}
              >
                {ws.logo || ws.name.charAt(0)}
              </div>
              <span
                className="text-sm"
                style={{
                  color: hoveredWorkspace === ws.id ? '#ffffff' : '#cbd5e1',
                  transition: 'color 0.15s ease',
                }}
              >
                {ws.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Inyectar estilos de animación
const headerStyles = `
@keyframes dropdownFadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
`;

if (typeof document !== 'undefined') {
  const styleId = 'sidebar-header-animations';
  if (!document.getElementById(styleId)) {
    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.textContent = headerStyles;
    document.head.appendChild(styleSheet);
  }
}

export default SidebarHeader;
