// components/ui/SkeletonLoader.tsx
// Componentes de skeleton loading para mejorar UX

import React from 'react';

// ============================================
// SKELETON BASE
// ============================================

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className = '',
  variant = 'default',
  width,
  height,
  animation = 'wave',
}: SkeletonProps) {
  const baseClasses = 'skeleton';
  const variantClasses = {
    default: 'rounded-lg',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
  };
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: '',
    none: '',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
}

// ============================================
// SKELETON CARD
// ============================================

export function SkeletonCard() {
  return (
    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton height={16} width="60%" />
          <Skeleton height={12} width="40%" />
        </div>
      </div>
      <Skeleton height={12} />
      <Skeleton height={12} width="80%" />
      <div className="flex gap-2 pt-2">
        <Skeleton height={32} className="flex-1" />
        <Skeleton height={32} className="flex-1" />
      </div>
    </div>
  );
}

// ============================================
// SKELETON STATS
// ============================================

export function SkeletonStats({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 stagger-item"
          style={{ animationDelay: `${idx * 60}ms` }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Skeleton variant="circular" width={16} height={16} />
            <Skeleton height={12} width="60%" />
          </div>
          <Skeleton height={28} width="50%" />
        </div>
      ))}
    </div>
  );
}

// ============================================
// SKELETON TABLE ROW
// ============================================

export function SkeletonTableRow({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-gray-800/50">
      {Array.from({ length: columns }).map((_, idx) => (
        <td key={idx} className="px-4 py-3">
          <Skeleton height={16} width={idx === 0 ? '70%' : idx === columns - 1 ? '50%' : '80%'} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonTable({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-800">
            {Array.from({ length: columns }).map((_, idx) => (
              <th key={idx} className="px-4 py-3 text-left">
                <Skeleton height={14} width="60%" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, idx) => (
            <SkeletonTableRow key={idx} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================
// SKELETON LIST ITEM
// ============================================

export function SkeletonListItem() {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-xl">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="flex-1 space-y-2">
        <Skeleton height={16} width="70%" />
        <Skeleton height={12} width="50%" />
      </div>
      <Skeleton width={80} height={32} />
    </div>
  );
}

export function SkeletonList({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: items }).map((_, idx) => (
        <div key={idx} className="stagger-item" style={{ animationDelay: `${idx * 50}ms` }}>
          <SkeletonListItem />
        </div>
      ))}
    </div>
  );
}

// ============================================
// SKELETON CHART
// ============================================

export function SkeletonChart({ type = 'bar' }: { type?: 'bar' | 'line' | 'pie' }) {
  if (type === 'pie') {
    return (
      <div className="flex items-center justify-center p-8">
        <Skeleton variant="circular" width={200} height={200} />
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
      <div className="flex items-center justify-between mb-4">
        <Skeleton height={20} width="30%" />
        <div className="flex gap-2">
          <Skeleton height={24} width={60} />
          <Skeleton height={24} width={60} />
        </div>
      </div>
      <div className="flex items-end gap-2 h-48">
        {Array.from({ length: 12 }).map((_, idx) => (
          <div key={idx} className="flex-1">
            <Skeleton
              height={`${Math.random() * 60 + 40}%`}
              className="w-full"
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2">
        {Array.from({ length: 6 }).map((_, idx) => (
          <Skeleton key={idx} height={12} width={30} />
        ))}
      </div>
    </div>
  );
}

// ============================================
// SKELETON PROFILE
// ============================================

export function SkeletonProfile() {
  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
      <div className="flex items-center gap-4 mb-6">
        <Skeleton variant="circular" width={80} height={80} />
        <div className="space-y-2">
          <Skeleton height={24} width={150} />
          <Skeleton height={14} width={200} />
        </div>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Skeleton height={12} width="40%" className="mb-2" />
            <Skeleton height={40} />
          </div>
          <div>
            <Skeleton height={12} width="40%" className="mb-2" />
            <Skeleton height={40} />
          </div>
        </div>
        <div>
          <Skeleton height={12} width="30%" className="mb-2" />
          <Skeleton height={80} />
        </div>
      </div>
    </div>
  );
}

// ============================================
// LOADING SPINNER
// ============================================

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'amber' | 'white' | 'gray';
}

export function Spinner({ size = 'md', color = 'amber' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };
  const colorClasses = {
    amber: 'border-amber-500',
    white: 'border-white',
    gray: 'border-gray-400',
  };

  return (
    <div
      className={`${sizeClasses[size]} border-2 ${colorClasses[color]} border-t-transparent rounded-full loader-spinner`}
    />
  );
}

// ============================================
// LOADING DOTS
// ============================================

export function LoadingDots({ color = 'amber' }: { color?: 'amber' | 'white' | 'gray' }) {
  const colorClasses = {
    amber: 'bg-amber-500',
    white: 'bg-white',
    gray: 'bg-gray-400',
  };

  return (
    <div className="loader-dots flex gap-1">
      <span className={`w-2 h-2 ${colorClasses[color]} rounded-full`} />
      <span className={`w-2 h-2 ${colorClasses[color]} rounded-full`} />
      <span className={`w-2 h-2 ${colorClasses[color]} rounded-full`} />
    </div>
  );
}

// ============================================
// FULL PAGE LOADER
// ============================================

export function FullPageLoader({ message = 'Cargando...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full loader-spinner mx-auto mb-4" />
        <p className="text-white font-medium">{message}</p>
        <LoadingDots color="amber" />
      </div>
    </div>
  );
}

// ============================================
// INLINE LOADER
// ============================================

export function InlineLoader({ text = 'Procesando' }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 text-gray-400">
      <Spinner size="sm" />
      <span className="text-sm">{text}</span>
    </div>
  );
}

export default {
  Skeleton,
  SkeletonCard,
  SkeletonStats,
  SkeletonTable,
  SkeletonList,
  SkeletonChart,
  SkeletonProfile,
  Spinner,
  LoadingDots,
  FullPageLoader,
  InlineLoader,
};
