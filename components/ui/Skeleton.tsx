// components/ui/Skeleton.tsx
// Sistema completo de Loading Skeletons estilo Amazon
import React from 'react';

// ============================================
// BASE SKELETON COMPONENT
// ============================================
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}) => {
  const baseClass = 'bg-slate-200 dark:bg-navy-700';

  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-xl',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'skeleton-wave',
    none: '',
  };

  const style: React.CSSProperties = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'text' ? '1em' : undefined),
  };

  return (
    <div
      className={`${baseClass} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
};

// ============================================
// CARD SKELETON
// ============================================
export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-navy-800 ${className}`}>
    <div className="flex items-start justify-between mb-4">
      <div className="space-y-2 flex-1">
        <Skeleton variant="text" width="60%" height={12} />
        <Skeleton variant="text" width="40%" height={24} />
      </div>
      <Skeleton variant="rounded" width={48} height={48} />
    </div>
    <div className="flex items-center gap-2">
      <Skeleton variant="circular" width={16} height={16} />
      <Skeleton variant="text" width="30%" height={10} />
    </div>
  </div>
);

// ============================================
// STATS CARD SKELETON
// ============================================
export const StatsCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-navy-900 rounded-2xl p-5 shadow-card border border-slate-100 dark:border-navy-800">
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <Skeleton variant="text" width={80} height={12} />
        <Skeleton variant="text" width={60} height={32} />
      </div>
      <Skeleton variant="rounded" width={44} height={44} />
    </div>
    <div className="mt-3 flex items-center gap-2">
      <Skeleton variant="circular" width={14} height={14} />
      <Skeleton variant="text" width={100} height={10} />
    </div>
  </div>
);

// ============================================
// TABLE ROW SKELETON
// ============================================
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 6 }) => (
  <tr className="border-b border-slate-100 dark:border-navy-800">
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="px-4 py-4">
        <Skeleton
          variant="text"
          width={i === 0 ? '80%' : i === columns - 1 ? 60 : '70%'}
          height={16}
        />
      </td>
    ))}
  </tr>
);

// ============================================
// TABLE SKELETON
// ============================================
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 6
}) => (
  <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-lg border border-slate-100 dark:border-navy-800 overflow-hidden">
    {/* Header */}
    <div className="bg-slate-50 dark:bg-navy-950 px-4 py-3 border-b border-slate-200 dark:border-navy-800">
      <div className="flex items-center gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text" width={80} height={12} />
        ))}
      </div>
    </div>
    {/* Rows */}
    <table className="w-full">
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRowSkeleton key={i} columns={columns} />
        ))}
      </tbody>
    </table>
  </div>
);

// ============================================
// DASHBOARD SKELETON
// ============================================
export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-8 animate-fade-in">
    {/* Welcome Banner Skeleton */}
    <div className="rounded-3xl bg-gradient-to-r from-slate-200 to-slate-300 dark:from-navy-800 dark:to-navy-700 p-8 animate-pulse">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-3">
            <Skeleton variant="rounded" width={56} height={56} />
            <div className="space-y-2">
              <Skeleton variant="text" width={300} height={32} className="bg-white/20" />
              <Skeleton variant="text" width={200} height={16} className="bg-white/20" />
            </div>
          </div>
          <div className="flex gap-3">
            <Skeleton variant="rounded" width={120} height={36} className="bg-white/20" />
            <Skeleton variant="rounded" width={140} height={36} className="bg-white/20" />
          </div>
        </div>
        <div className="flex gap-4">
          <Skeleton variant="rounded" width={120} height={80} className="bg-white/20" />
          <Skeleton variant="rounded" width={120} height={80} className="bg-white/20" />
        </div>
      </div>
    </div>

    {/* Stats Cards Skeleton */}
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <StatsCardSkeleton key={i} />
      ))}
    </div>

    {/* Quick Actions Skeleton */}
    <div>
      <div className="flex items-center gap-3 mb-5">
        <Skeleton variant="circular" width={24} height={24} />
        <Skeleton variant="text" width={180} height={24} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={160} className="bg-slate-200 dark:bg-navy-800" />
        ))}
      </div>
    </div>
  </div>
);

// ============================================
// LIST ITEM SKELETON
// ============================================
export const ListItemSkeleton: React.FC = () => (
  <div className="flex items-center gap-4 p-4 bg-white dark:bg-navy-900 rounded-xl border border-slate-100 dark:border-navy-800">
    <Skeleton variant="circular" width={48} height={48} />
    <div className="flex-1 space-y-2">
      <Skeleton variant="text" width="70%" height={16} />
      <Skeleton variant="text" width="50%" height={12} />
    </div>
    <Skeleton variant="rounded" width={80} height={32} />
  </div>
);

// ============================================
// GUIDE CARD SKELETON
// ============================================
export const GuideCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-navy-900 rounded-xl p-4 shadow-md border border-slate-100 dark:border-navy-800">
    <div className="flex items-start justify-between mb-3">
      <div className="space-y-2">
        <Skeleton variant="text" width={140} height={18} />
        <Skeleton variant="rounded" width={80} height={24} />
      </div>
      <Skeleton variant="rounded" width={36} height={36} />
    </div>
    <div className="space-y-2 mb-3">
      <div className="flex items-center gap-2">
        <Skeleton variant="circular" width={16} height={16} />
        <Skeleton variant="text" width="60%" height={14} />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton variant="circular" width={16} height={16} />
        <Skeleton variant="text" width="40%" height={14} />
      </div>
    </div>
    <div className="flex gap-2">
      <Skeleton variant="rounded" width={70} height={28} />
      <Skeleton variant="rounded" width={70} height={28} />
    </div>
  </div>
);

// ============================================
// NOTIFICATION SKELETON
// ============================================
export const NotificationSkeleton: React.FC = () => (
  <div className="flex items-start gap-3 p-4 bg-white dark:bg-navy-900 rounded-xl border border-slate-100 dark:border-navy-800">
    <Skeleton variant="circular" width={40} height={40} />
    <div className="flex-1 space-y-2">
      <Skeleton variant="text" width="80%" height={14} />
      <Skeleton variant="text" width="60%" height={12} />
      <Skeleton variant="text" width={80} height={10} />
    </div>
  </div>
);

// ============================================
// CHART SKELETON
// ============================================
export const ChartSkeleton: React.FC<{ type?: 'bar' | 'line' | 'pie' }> = ({ type = 'bar' }) => (
  <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-navy-800">
    <div className="flex items-center justify-between mb-6">
      <Skeleton variant="text" width={150} height={20} />
      <Skeleton variant="rounded" width={100} height={32} />
    </div>
    {type === 'bar' && (
      <div className="flex items-end justify-around h-48 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={i}
            variant="rounded"
            width={32}
            height={Math.random() * 120 + 40}
          />
        ))}
      </div>
    )}
    {type === 'line' && (
      <div className="h-48 flex items-center justify-center">
        <Skeleton variant="rounded" width="100%" height={120} />
      </div>
    )}
    {type === 'pie' && (
      <div className="h-48 flex items-center justify-center">
        <Skeleton variant="circular" width={160} height={160} />
      </div>
    )}
  </div>
);

// ============================================
// PROFILE SKELETON
// ============================================
export const ProfileSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-navy-800">
    <div className="flex items-center gap-4 mb-6">
      <Skeleton variant="circular" width={80} height={80} />
      <div className="space-y-2">
        <Skeleton variant="text" width={150} height={24} />
        <Skeleton variant="text" width={200} height={14} />
        <Skeleton variant="rounded" width={80} height={24} />
      </div>
    </div>
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <Skeleton variant="text" width={100} height={14} />
          <Skeleton variant="text" width={150} height={14} />
        </div>
      ))}
    </div>
  </div>
);

// ============================================
// SHIMMER EFFECT STYLES (inject once)
// ============================================
const shimmerStyles = `
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }

  .skeleton-wave {
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.4) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  .dark .skeleton-wave {
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.1) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    background-size: 200% 100%;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.textContent = shimmerStyles;
  document.head.appendChild(styleEl);
}

// ============================================
// LOADING OVERLAY
// ============================================
export const LoadingOverlay: React.FC<{ message?: string }> = ({ message = 'Cargando...' }) => (
  <div className="fixed inset-0 bg-white/80 dark:bg-navy-950/80 backdrop-blur-sm z-50 flex items-center justify-center">
    <div className="text-center">
      <div className="relative w-20 h-20 mx-auto mb-4">
        <div className="absolute inset-0 border-4 border-slate-200 dark:border-navy-700 rounded-full" />
        <div className="absolute inset-0 border-4 border-transparent border-t-accent-500 rounded-full animate-spin" />
        <div className="absolute inset-2 border-4 border-transparent border-t-corporate-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
      </div>
      <p className="text-lg font-medium text-slate-600 dark:text-slate-300">{message}</p>
      <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Por favor espere...</p>
    </div>
  </div>
);

// ============================================
// INLINE LOADER
// ============================================
export const InlineLoader: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  return (
    <div className={`${sizes[size]} border-slate-200 dark:border-navy-700 border-t-accent-500 rounded-full animate-spin`} />
  );
};

// ============================================
// PULSE DOT LOADER
// ============================================
export const PulseDots: React.FC = () => (
  <div className="flex items-center gap-1">
    <div className="w-2 h-2 bg-accent-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
    <div className="w-2 h-2 bg-accent-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
    <div className="w-2 h-2 bg-accent-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
  </div>
);

export default Skeleton;
