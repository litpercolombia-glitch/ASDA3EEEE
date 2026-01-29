/**
 * SidebarBadge - LITPER PRO
 *
 * Badges de notificación para el sidebar
 * Variantes: error (rojo), warning (naranja), info (azul), success (verde)
 */

import React from 'react';

export type BadgeVariant = 'error' | 'warning' | 'info' | 'success' | 'neutral';

interface SidebarBadgeProps {
  count?: number;
  variant?: BadgeVariant;
  pulse?: boolean;
  dot?: boolean;
  max?: number;
  className?: string;
}

export const SidebarBadge: React.FC<SidebarBadgeProps> = ({
  count,
  variant = 'info',
  pulse = false,
  dot = false,
  max = 99,
  className = '',
}) => {
  // Don't render if no count and not a dot
  if (!dot && (count === undefined || count === 0)) {
    return null;
  }

  const variantStyles: Record<BadgeVariant, string> = {
    error: 'bg-red-500 text-white shadow-red-500/30',
    warning: 'bg-amber-500 text-white shadow-amber-500/30',
    info: 'bg-blue-500 text-white shadow-blue-500/30',
    success: 'bg-emerald-500 text-white shadow-emerald-500/30',
    neutral: 'bg-zinc-600 text-white shadow-zinc-600/30',
  };

  const displayCount = count !== undefined && count > max ? `${max}+` : count;

  // Dot variant (no number)
  if (dot) {
    return (
      <span
        className={`
          relative flex h-2.5 w-2.5
          ${className}
        `}
      >
        {pulse && (
          <span
            className={`
              absolute inline-flex h-full w-full rounded-full opacity-75
              animate-ping
              ${variantStyles[variant].split(' ')[0]}
            `}
          />
        )}
        <span
          className={`
            relative inline-flex rounded-full h-2.5 w-2.5
            ${variantStyles[variant]}
          `}
        />
      </span>
    );
  }

  return (
    <span
      className={`
        inline-flex items-center justify-center
        min-w-[18px] h-[18px] px-1.5
        text-[10px] font-bold
        rounded-full
        shadow-lg
        ${pulse ? 'animate-pulse' : ''}
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {displayCount}
    </span>
  );
};

// Badge group for multiple notifications
interface BadgeGroupProps {
  badges: Array<{
    count?: number;
    variant: BadgeVariant;
    pulse?: boolean;
  }>;
  className?: string;
}

export const SidebarBadgeGroup: React.FC<BadgeGroupProps> = ({
  badges,
  className = '',
}) => {
  const filteredBadges = badges.filter((b) => b.count && b.count > 0);

  if (filteredBadges.length === 0) return null;

  // If only one badge, show it normally
  if (filteredBadges.length === 1) {
    return <SidebarBadge {...filteredBadges[0]} className={className} />;
  }

  // Multiple badges - show stacked
  return (
    <div className={`flex -space-x-1 ${className}`}>
      {filteredBadges.slice(0, 3).map((badge, index) => (
        <SidebarBadge
          key={index}
          {...badge}
          className={`ring-2 ring-slate-900 ${index > 0 ? '-ml-1' : ''}`}
        />
      ))}
    </div>
  );
};

// Status indicator (online, away, busy, offline)
type StatusType = 'online' | 'away' | 'busy' | 'offline';

interface StatusIndicatorProps {
  status: StatusType;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  className = '',
}) => {
  const statusStyles: Record<StatusType, string> = {
    online: 'bg-emerald-500',
    away: 'bg-amber-500',
    busy: 'bg-red-500',
    offline: 'bg-zinc-500',
  };

  return (
    <span
      className={`
        inline-block w-2.5 h-2.5 rounded-full
        ring-2 ring-slate-900
        ${statusStyles[status]}
        ${status === 'online' ? 'animate-pulse' : ''}
        ${className}
      `}
    />
  );
};

export default SidebarBadge;
