/**
 * SidebarItem - LITPER PRO
 *
 * Item de navegación con animaciones premium, badges, tooltips y estados
 * Inspirado en Linear, Notion y Slack
 */

import React, { forwardRef, useState } from 'react';
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
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);

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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsPressed(false);
        }}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        disabled={disabled}
        draggable={draggable}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className={`
          group relative w-full flex items-center gap-3
          h-9 px-3 rounded-lg
          text-sm font-medium
          outline-none
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isCollapsed ? 'justify-center px-0' : ''}
          ${className}
        `}
        style={{
          paddingLeft: isCollapsed ? undefined : `${12 + indent * 12}px`,
          // Animación de transform suave
          transform: isPressed
            ? 'scale(0.98)'
            : isHovered && !disabled
              ? 'translateX(4px)'
              : 'translateX(0)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          // Background con gradiente animado
          background: isActive
            ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(99, 102, 241, 0.15) 100%)'
            : isHovered && !disabled
              ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)'
              : 'transparent',
          // Sombra sutil en hover
          boxShadow: isActive
            ? '0 0 20px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            : isHovered && !disabled
              ? '0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
              : 'none',
          // Color del texto
          color: isActive
            ? '#60a5fa'
            : isHovered && !disabled
              ? '#ffffff'
              : '#94a3b8',
        }}
      >
        {/* Efecto de brillo en hover */}
        <span
          className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none"
          style={{
            opacity: isHovered && !disabled && !isActive ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        >
          <span
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)',
              transform: isHovered ? 'translateX(100%)' : 'translateX(-100%)',
              transition: 'transform 0.6s ease',
            }}
          />
        </span>

        {/* Icon con animación */}
        <span
          className="flex-shrink-0 w-5 h-5 flex items-center justify-center relative z-10"
          style={{
            color: isActive
              ? '#60a5fa'
              : isHovered && !disabled
                ? '#e2e8f0'
                : '#64748b',
            transform: isHovered && !disabled ? 'scale(1.1)' : 'scale(1)',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: isActive ? 'drop-shadow(0 0 6px rgba(96, 165, 250, 0.5))' : 'none',
          }}
        >
          {icon}
        </span>

        {/* Label (hidden when collapsed) */}
        {!isCollapsed && (
          <>
            <span
              className="flex-1 text-left truncate relative z-10"
              style={{
                transform: isHovered && !disabled ? 'translateX(2px)' : 'translateX(0)',
                transition: 'transform 0.2s ease',
              }}
            >
              {label}
            </span>

            {/* Shortcut hint */}
            {shortcut && !badge && (
              <kbd
                className="relative z-10"
                style={{
                  display: isHovered ? 'inline-flex' : 'none',
                  padding: '2px 6px',
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(71, 85, 105, 0.5)',
                  borderRadius: '4px',
                  color: '#64748b',
                  backdropFilter: 'blur(4px)',
                  animation: isHovered ? 'fadeSlideIn 0.2s ease' : 'none',
                }}
              >
                {shortcut}
              </kbd>
            )}

            {/* Badge */}
            {badge && (
              <span className="relative z-10">
                <SidebarBadge
                  count={badge.count}
                  variant={badge.variant}
                  pulse={badge.pulse}
                />
              </span>
            )}

            {/* Favorite star con animación */}
            {isFavorite !== undefined && (
              <button
                onClick={handleFavoriteClick}
                className="relative z-10 p-1 rounded"
                style={{
                  opacity: isFavorite ? 1 : isHovered ? 1 : 0,
                  color: isFavorite ? '#fbbf24' : '#64748b',
                  transform: isFavorite || isHovered ? 'scale(1)' : 'scale(0.8)',
                  transition: 'all 0.2s ease',
                }}
              >
                <Star
                  className="w-3.5 h-3.5"
                  style={{
                    fill: isFavorite ? 'currentColor' : 'none',
                    filter: isFavorite ? 'drop-shadow(0 0 4px rgba(251, 191, 36, 0.5))' : 'none',
                  }}
                />
              </button>
            )}

            {/* Submenu arrow con rotación suave */}
            {hasSubmenu && (
              <ChevronRight
                className="w-4 h-4 relative z-10"
                style={{
                  color: '#64748b',
                  transform: isSubmenuOpen ? 'rotate(90deg)' : 'rotate(0)',
                  transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            )}
          </>
        )}

        {/* Collapsed mode badge indicator con pulso */}
        {isCollapsed && badge && badge.count && badge.count > 0 && (
          <span
            className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
            style={{
              background: badge.variant === 'error' ? '#ef4444'
                : badge.variant === 'warning' ? '#f59e0b'
                : badge.variant === 'success' ? '#10b981'
                : '#3b82f6',
              boxShadow: `0 0 8px ${
                badge.variant === 'error' ? 'rgba(239, 68, 68, 0.5)'
                : badge.variant === 'warning' ? 'rgba(245, 158, 11, 0.5)'
                : badge.variant === 'success' ? 'rgba(16, 185, 129, 0.5)'
                : 'rgba(59, 130, 246, 0.5)'
              }`,
              animation: badge.pulse ? 'pulse 2s infinite' : 'none',
            }}
          />
        )}

        {/* Active indicator line con glow */}
        {isActive && (
          <span
            className="absolute left-0 top-1/2 rounded-full"
            style={{
              width: '3px',
              height: '20px',
              transform: 'translateY(-50%)',
              background: 'linear-gradient(180deg, #3b82f6 0%, #6366f1 100%)',
              boxShadow: '0 0 10px rgba(59, 130, 246, 0.5), 0 0 20px rgba(99, 102, 241, 0.3)',
            }}
          />
        )}

        {/* Border glow en hover */}
        <span
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            border: isHovered && !disabled && !isActive
              ? '1px solid rgba(148, 163, 184, 0.1)'
              : '1px solid transparent',
            transition: 'border-color 0.2s ease',
          }}
        />
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

// Compact item for favorites con animaciones
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
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  return (
    <CollapsedTooltip label={label} isCollapsed={isCollapsed}>
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsPressed(false);
        }}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        draggable={draggable}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        className={`
          group relative flex items-center gap-2
          h-7 px-2 rounded-md
          text-xs font-medium
          ${isCollapsed ? 'justify-center w-9 px-0' : 'w-full'}
        `}
        style={{
          color: isHovered ? '#ffffff' : '#94a3b8',
          background: isHovered
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)'
            : 'transparent',
          transform: isPressed
            ? 'scale(0.98)'
            : isHovered
              ? 'translateX(3px)'
              : 'translateX(0)',
          boxShadow: isHovered
            ? '0 2px 8px rgba(0, 0, 0, 0.1)'
            : 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Color dot or icon con animación */}
        {color ? (
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              backgroundColor: color,
              boxShadow: isHovered ? `0 0 8px ${color}` : 'none',
              transform: isHovered ? 'scale(1.2)' : 'scale(1)',
              transition: 'all 0.2s ease',
            }}
          />
        ) : (
          <span
            className="w-4 h-4 flex items-center justify-center flex-shrink-0"
            style={{
              color: isHovered ? '#e2e8f0' : '#64748b',
              transform: isHovered ? 'scale(1.1)' : 'scale(1)',
              transition: 'all 0.2s ease',
            }}
          >
            {icon}
          </span>
        )}

        {!isCollapsed && (
          <>
            <span
              className="flex-1 truncate text-left"
              style={{
                transform: isHovered ? 'translateX(2px)' : 'translateX(0)',
                transition: 'transform 0.2s ease',
              }}
            >
              {label}
            </span>

            {onRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="p-0.5 rounded"
                style={{
                  opacity: isHovered ? 1 : 0,
                  color: '#64748b',
                  transform: isHovered ? 'scale(1)' : 'scale(0.8)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.color = '#f87171';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.color = '#64748b';
                }}
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

// Agregar estilos de animación globales
const styles = `
@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateX(-4px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}
`;

// Inyectar estilos si no existen
if (typeof document !== 'undefined') {
  const styleId = 'sidebar-item-animations';
  if (!document.getElementById(styleId)) {
    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }
}

export default SidebarItem;
