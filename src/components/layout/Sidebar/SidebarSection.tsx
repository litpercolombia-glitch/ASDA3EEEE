/**
 * SidebarSection - LITPER PRO
 *
 * Sección colapsable del sidebar con header animado y items
 * Inspirado en Linear, Notion y Slack
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, MoreHorizontal } from 'lucide-react';
import { SidebarBadge } from './SidebarBadge';
import { useSidebarStore, SidebarSection as SectionType } from '../../../../stores/sidebarStore';

interface SidebarSectionProps {
  id: SectionType;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  isCollapsed?: boolean;
  defaultExpanded?: boolean;
  badge?: number;
  badgeVariant?: 'error' | 'warning' | 'info' | 'success';
  actions?: React.ReactNode;
  className?: string;
}

export const SidebarSection: React.FC<SidebarSectionProps> = ({
  id,
  title,
  icon,
  children,
  isCollapsed = false,
  defaultExpanded = true,
  badge,
  badgeVariant = 'info',
  actions,
  className = '',
}) => {
  const { expandedSections, toggleSection } = useSidebarStore();
  const isExpanded = expandedSections.includes(id);
  const [isHovered, setIsHovered] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | 'auto'>('auto');

  // Calculate content height for animation
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [children]);

  // In collapsed mode, show only icons
  if (isCollapsed) {
    return (
      <div className={`py-2 ${className}`}>
        {/* Section divider con animación */}
        <div
          className="h-px mx-3 mb-2"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(71, 85, 105, 0.5) 50%, transparent 100%)',
          }}
        />
        {children}
      </div>
    );
  }

  return (
    <div className={`py-1 ${className}`}>
      {/* Section Header con animaciones */}
      <button
        onClick={() => toggleSection(id)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group w-full flex items-center gap-2 h-8 px-3"
        style={{
          background: isHovered
            ? 'linear-gradient(90deg, rgba(255, 255, 255, 0.03) 0%, transparent 100%)'
            : 'transparent',
          borderRadius: '6px',
          transition: 'all 0.2s ease',
        }}
      >
        {/* Collapse indicator con rotación suave */}
        <ChevronDown
          className="w-3 h-3"
          style={{
            color: isHovered ? '#94a3b8' : '#475569',
            transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />

        {/* Icon con animación */}
        {icon && (
          <span
            className="w-4 h-4 flex items-center justify-center"
            style={{
              color: isHovered ? '#94a3b8' : '#475569',
              transform: isHovered ? 'scale(1.1)' : 'scale(1)',
              transition: 'all 0.2s ease',
            }}
          >
            {icon}
          </span>
        )}

        {/* Title con animación */}
        <span
          className="flex-1 text-left text-xs font-semibold uppercase tracking-wider"
          style={{
            color: isHovered ? '#cbd5e1' : '#64748b',
            transform: isHovered ? 'translateX(2px)' : 'translateX(0)',
            transition: 'all 0.2s ease',
          }}
        >
          {title}
        </span>

        {/* Badge con glow */}
        {badge !== undefined && badge > 0 && (
          <span
            style={{
              filter: isHovered ? 'brightness(1.2)' : 'brightness(1)',
              transition: 'filter 0.2s ease',
            }}
          >
            <SidebarBadge count={badge} variant={badgeVariant} />
          </span>
        )}

        {/* Actions con fade in */}
        {actions && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              opacity: isHovered ? 1 : 0,
              transform: isHovered ? 'translateX(0)' : 'translateX(4px)',
              transition: 'all 0.2s ease',
            }}
          >
            {actions}
          </div>
        )}
      </button>

      {/* Section Content con animación de altura */}
      <div
        style={{
          height: isExpanded ? contentHeight : 0,
          opacity: isExpanded ? 1 : 0,
          overflow: 'hidden',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div ref={contentRef} className="py-1">
          {children}
        </div>
      </div>
    </div>
  );
};

// Simple divider section con animación
interface SidebarDividerProps {
  label?: string;
  className?: string;
}

export const SidebarDivider: React.FC<SidebarDividerProps> = ({
  label,
  className = '',
}) => (
  <div className={`py-3 ${className}`}>
    {label ? (
      <div className="flex items-center gap-2 px-3">
        <div
          className="flex-1 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(71, 85, 105, 0.5) 50%, rgba(71, 85, 105, 0.3) 100%)',
          }}
        />
        <span
          className="text-[10px] font-medium uppercase tracking-wider"
          style={{ color: '#475569' }}
        >
          {label}
        </span>
        <div
          className="flex-1 h-px"
          style={{
            background: 'linear-gradient(90deg, rgba(71, 85, 105, 0.3) 0%, rgba(71, 85, 105, 0.5) 50%, transparent 100%)',
          }}
        />
      </div>
    ) : (
      <div
        className="h-px mx-3"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(71, 85, 105, 0.5) 50%, transparent 100%)',
        }}
      />
    )}
  </div>
);

// Section header actions menu con animaciones
interface SectionActionsProps {
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
  onAddItem?: () => void;
}

export const SectionActions: React.FC<SectionActionsProps> = ({
  onExpandAll,
  onCollapseAll,
  onAddItem,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="p-1 rounded"
        style={{
          color: isHovered ? '#cbd5e1' : '#64748b',
          background: isHovered ? 'rgba(71, 85, 105, 0.3)' : 'transparent',
          transform: isHovered ? 'scale(1.1)' : 'scale(1)',
          transition: 'all 0.2s ease',
        }}
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1 z-50 min-w-[140px] py-1 rounded-lg shadow-xl"
          style={{
            background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)',
            border: '1px solid rgba(71, 85, 105, 0.5)',
            backdropFilter: 'blur(12px)',
            animation: 'menuFadeIn 0.15s ease',
          }}
        >
          {onAddItem && (
            <MenuButton onClick={() => { onAddItem(); setIsOpen(false); }}>
              Agregar
            </MenuButton>
          )}
          {onExpandAll && (
            <MenuButton onClick={() => { onExpandAll(); setIsOpen(false); }}>
              Expandir todo
            </MenuButton>
          )}
          {onCollapseAll && (
            <MenuButton onClick={() => { onCollapseAll(); setIsOpen(false); }}>
              Colapsar todo
            </MenuButton>
          )}
        </div>
      )}
    </div>
  );
};

// Menu button component con hover animation
const MenuButton: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
}> = ({ onClick, children }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm"
      style={{
        color: isHovered ? '#ffffff' : '#cbd5e1',
        background: isHovered
          ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.2) 0%, transparent 100%)'
          : 'transparent',
        transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
        transition: 'all 0.15s ease',
      }}
    >
      {children}
    </button>
  );
};

// Inyectar estilos de animación si no existen
const sectionStyles = `
@keyframes menuFadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
`;

if (typeof document !== 'undefined') {
  const styleId = 'sidebar-section-animations';
  if (!document.getElementById(styleId)) {
    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.textContent = sectionStyles;
    document.head.appendChild(styleSheet);
  }
}

export default SidebarSection;
