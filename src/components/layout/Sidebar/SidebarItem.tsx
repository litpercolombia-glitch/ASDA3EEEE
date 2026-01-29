/**
 * SidebarItem - LITPER PRO
 *
 * Item de navegación con badges, tooltips y estados
 * Inspirado en Linear, Notion y Slack
 */

import React, { forwardRef } from 'react';
import { ChevronRight, Star } from 'lucide-react';
import { SidebarBadge, BadgeVariant } from './SidebarBadge';
import { CollapsedTooltip } from './SidebarTooltip';
import { useSidebarStore } from '../../../stores/sidebarStore';

interface SidebarItemProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  onClick?: () => void;
  isActive?: boolean;
  isCollapsed?: boolean;
  badge?: {
    count?: number;
    variant?: BadgeVariant;
    pulse?: boolean;
  };
  shortcut?: string;
  hasSubmenu?: boolean;
  isSubmenuOpen?: boolean;
  onToggleSubmenu?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  disabled?: boolean;
  indent?: number;
  className?: string;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export const SidebarItem = forwardRef<HTMLButtonElement, SidebarItemProps>(
  (
    {
      id,
      label,
      icon,
      path,
      onClick,
      isActive = false,
      isCollapsed = false,
      badge,
      shortcut,
      hasSubmenu = false,
      isSubmenuOpen = false,
      onToggleSubmenu,
      isFavorite,
      onToggleFavorite,
      disabled = false,
      indent = 0,
      className = '',
      draggable = false,
      onDragStart,
      onDragEnd,
    },
    ref
  ) => {
    const { addRecentItem } = useSidebarStore();

    const handleClick = () => {
      if (disabled) return;

      if (hasSubmenu && onToggleSubmenu) {
        onToggleSubmenu();
      } else if (onClick) {
        onClick();
        // Add to recent items
        addRecentItem({
          id,
          label,
          icon: '', // We'll store icon name as string
          path: path || '',
        });
      }
    };

    const handleFavoriteClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleFavorite?.();
    };

    const content = (
      <button
        ref={ref}
        onClick={handleClick}
        disabled={disabled}
        draggable={draggable}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className={`
          group relative w-full flex items-center gap-3
          h-9 px-3 rounded-lg
          text-sm font-medium
          transition-all duration-200
          outline-none
          ${
            isActive
              ? 'bg-blue-600/20 text-blue-400 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isCollapsed ? 'justify-center px-0' : ''}
          ${className}
        `}
        style={{
          paddingLeft: isCollapsed ? undefined : `${12 + indent * 12}px`,
        }}
      >
        {/* Icon */}
        <span
          className={`
            flex-shrink-0 w-5 h-5 flex items-center justify-center
            transition-colors duration-200
            ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}
          `}
        >
          {icon}
        </span>

        {/* Label (hidden when collapsed) */}
        {!isCollapsed && (
          <>
            <span className="flex-1 text-left truncate">{label}</span>

            {/* Shortcut hint */}
            {shortcut && !badge && (
              <kbd
                className="
                  hidden group-hover:inline-flex
                  px-1.5 py-0.5 text-[10px] font-mono
                  bg-slate-800 border border-slate-700
                  rounded text-slate-500
                  transition-opacity duration-200
                "
              >
                {shortcut}
              </kbd>
            )}

            {/* Badge */}
            {badge && (
              <SidebarBadge
                count={badge.count}
                variant={badge.variant}
                pulse={badge.pulse}
              />
            )}

            {/* Favorite star */}
            {isFavorite !== undefined && (
              <button
                onClick={handleFavoriteClick}
                className={`
                  p-1 rounded opacity-0 group-hover:opacity-100
                  transition-all duration-200
                  ${isFavorite ? 'text-amber-400 opacity-100' : 'text-slate-500 hover:text-amber-400'}
                `}
              >
                <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            )}

            {/* Submenu arrow */}
            {hasSubmenu && (
              <ChevronRight
                className={`
                  w-4 h-4 text-slate-500
                  transition-transform duration-200
                  ${isSubmenuOpen ? 'rotate-90' : ''}
                `}
              />
            )}
          </>
        )}

        {/* Collapsed mode badge indicator */}
        {isCollapsed && badge && badge.count && badge.count > 0 && (
          <span
            className={`
              absolute -top-1 -right-1 w-2 h-2 rounded-full
              ${badge.variant === 'error' ? 'bg-red-500' : ''}
              ${badge.variant === 'warning' ? 'bg-amber-500' : ''}
              ${badge.variant === 'info' ? 'bg-blue-500' : ''}
              ${badge.variant === 'success' ? 'bg-emerald-500' : ''}
              ${badge.pulse ? 'animate-pulse' : ''}
            `}
          />
        )}

        {/* Active indicator line */}
        {isActive && (
          <span
            className="
              absolute left-0 top-1/2 -translate-y-1/2
              w-0.5 h-5 bg-blue-500 rounded-full
            "
          />
        )}
      </button>
    );

    // Wrap with tooltip when collapsed
    return (
      <CollapsedTooltip label={label} shortcut={shortcut} isCollapsed={isCollapsed}>
        {content}
      </CollapsedTooltip>
    );
  }
);

SidebarItem.displayName = 'SidebarItem';

// Compact item for favorites
interface SidebarCompactItemProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  color?: string;
  onClick?: () => void;
  onRemove?: () => void;
  isCollapsed?: boolean;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
}

export const SidebarCompactItem: React.FC<SidebarCompactItemProps> = ({
  id,
  label,
  icon,
  color,
  onClick,
  onRemove,
  isCollapsed = false,
  draggable = false,
  onDragStart,
  onDragEnd,
  onDragOver,
}) => {
  return (
    <CollapsedTooltip label={label} isCollapsed={isCollapsed}>
      <button
        onClick={onClick}
        draggable={draggable}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        className={`
          group relative flex items-center gap-2
          h-7 px-2 rounded-md
          text-xs font-medium text-slate-400
          hover:text-white hover:bg-white/5
          transition-all duration-200
          ${isCollapsed ? 'justify-center w-9 px-0' : 'w-full'}
        `}
      >
        {/* Color dot or icon */}
        {color ? (
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />
        ) : (
          <span className="w-4 h-4 flex items-center justify-center flex-shrink-0 text-slate-500">
            {icon}
          </span>
        )}

        {!isCollapsed && (
          <>
            <span className="flex-1 truncate text-left">{label}</span>

            {onRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="
                  opacity-0 group-hover:opacity-100
                  p-0.5 rounded text-slate-500 hover:text-red-400
                  transition-all duration-200
                "
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </>
        )}
      </button>
    </CollapsedTooltip>
  );
};

export default SidebarItem;
