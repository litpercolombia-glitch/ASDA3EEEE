/**
 * SidebarSection - LITPER PRO
 *
 * Sección colapsable del sidebar con header y items
 * Inspirado en Linear, Notion y Slack
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, MoreHorizontal } from 'lucide-react';
import { SidebarBadge } from './SidebarBadge';
import { useSidebarStore, SidebarSection as SectionType } from '../../../stores/sidebarStore';

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
        {/* Section divider */}
        <div className="h-px bg-slate-800 mx-3 mb-2" />
        {children}
      </div>
    );
  }

  return (
    <div className={`py-1 ${className}`}>
      {/* Section Header */}
      <button
        onClick={() => toggleSection(id)}
        className="
          group w-full flex items-center gap-2
          h-8 px-3
          text-xs font-semibold uppercase tracking-wider
          text-slate-500 hover:text-slate-300
          transition-colors duration-200
        "
      >
        {/* Collapse indicator */}
        <ChevronDown
          className={`
            w-3 h-3 text-slate-600 group-hover:text-slate-400
            transition-transform duration-200
            ${isExpanded ? '' : '-rotate-90'}
          `}
        />

        {/* Icon */}
        {icon && (
          <span className="w-4 h-4 flex items-center justify-center text-slate-600">
            {icon}
          </span>
        )}

        {/* Title */}
        <span className="flex-1 text-left">{title}</span>

        {/* Badge */}
        {badge !== undefined && badge > 0 && (
          <SidebarBadge count={badge} variant={badgeVariant} />
        )}

        {/* Actions */}
        {actions && (
          <div
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {actions}
          </div>
        )}
      </button>

      {/* Section Content */}
      <div
        className="overflow-hidden transition-all duration-200 ease-out"
        style={{
          height: isExpanded ? contentHeight : 0,
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div ref={contentRef} className="py-1">
          {children}
        </div>
      </div>
    </div>
  );
};

// Simple divider section
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
        <div className="flex-1 h-px bg-slate-800" />
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-600">
          {label}
        </span>
        <div className="flex-1 h-px bg-slate-800" />
      </div>
    ) : (
      <div className="h-px bg-slate-800 mx-3" />
    )}
  </div>
);

// Section header actions menu
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
        className="
          p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800
          transition-colors duration-200
        "
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          className="
            absolute right-0 top-full mt-1 z-50
            min-w-[140px] py-1
            bg-slate-800 border border-slate-700
            rounded-lg shadow-xl
            animate-in fade-in slide-in-from-top-1 duration-150
          "
        >
          {onAddItem && (
            <button
              onClick={() => {
                onAddItem();
                setIsOpen(false);
              }}
              className="
                w-full flex items-center gap-2 px-3 py-1.5
                text-sm text-slate-300 hover:text-white hover:bg-slate-700
              "
            >
              Agregar
            </button>
          )}
          {onExpandAll && (
            <button
              onClick={() => {
                onExpandAll();
                setIsOpen(false);
              }}
              className="
                w-full flex items-center gap-2 px-3 py-1.5
                text-sm text-slate-300 hover:text-white hover:bg-slate-700
              "
            >
              Expandir todo
            </button>
          )}
          {onCollapseAll && (
            <button
              onClick={() => {
                onCollapseAll();
                setIsOpen(false);
              }}
              className="
                w-full flex items-center gap-2 px-3 py-1.5
                text-sm text-slate-300 hover:text-white hover:bg-slate-700
              "
            >
              Colapsar todo
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SidebarSection;
