'use client';

import React from 'react';

// ============================================
// SKELETON LOADER - Componentes de carga animados
// Estilo: Shimmer animation para dark mode
// ============================================

interface SkeletonProps {
  className?: string;
  animate?: 'shimmer' | 'pulse';
}

// Base skeleton with shimmer effect
export const Skeleton: React.FC<SkeletonProps & { width?: string; height?: string }> = ({
  className = '',
  width = '100%',
  height = '20px',
  animate = 'shimmer',
}) => {
  const baseClass = 'bg-slate-700/50 rounded';
  const animationClass = animate === 'shimmer'
    ? 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-slate-600/20 before:to-transparent'
    : 'animate-pulse';

  return (
    <div
      className={`${baseClass} ${animationClass} ${className}`}
      style={{ width, height }}
    />
  );
};

// Skeleton for text lines
export const SkeletonText: React.FC<SkeletonProps & { lines?: number; lastLineWidth?: string }> = ({
  className = '',
  lines = 3,
  lastLineWidth = '60%',
  animate = 'shimmer',
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="16px"
          width={i === lines - 1 ? lastLineWidth : '100%'}
          animate={animate}
        />
      ))}
    </div>
  );
};

// Skeleton for avatar/profile pictures
export const SkeletonAvatar: React.FC<SkeletonProps & { size?: 'sm' | 'md' | 'lg' | 'xl' }> = ({
  className = '',
  size = 'md',
  animate = 'shimmer',
}) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <Skeleton
      className={`${sizes[size]} rounded-full ${className}`}
      width=""
      height=""
      animate={animate}
    />
  );
};

// Skeleton for metric cards
export const SkeletonCard: React.FC<SkeletonProps> = ({
  className = '',
  animate = 'shimmer',
}) => {
  return (
    <div className={`bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <Skeleton width="100px" height="14px" animate={animate} />
        <Skeleton width="24px" height="24px" className="rounded-lg" animate={animate} />
      </div>
      <Skeleton width="140px" height="32px" className="mb-2" animate={animate} />
      <Skeleton width="80px" height="12px" animate={animate} />
    </div>
  );
};

// Skeleton for table rows
export const SkeletonTableRow: React.FC<SkeletonProps & { columns?: number }> = ({
  className = '',
  columns = 5,
  animate = 'shimmer',
}) => {
  return (
    <tr className={`border-b border-slate-700/50 ${className}`}>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <Skeleton
            width={i === 0 ? '120px' : i === columns - 1 ? '80px' : '100px'}
            height="16px"
            animate={animate}
          />
        </td>
      ))}
    </tr>
  );
};

// Skeleton for full table
export const SkeletonTable: React.FC<SkeletonProps & { rows?: number; columns?: number }> = ({
  className = '',
  rows = 5,
  columns = 5,
  animate = 'shimmer',
}) => {
  return (
    <div className={`bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-slate-800/50 px-4 py-3 border-b border-slate-700/50">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} width="80px" height="12px" animate={animate} />
          ))}
        </div>
      </div>
      {/* Rows */}
      <table className="w-full">
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} columns={columns} animate={animate} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Skeleton for charts
export const SkeletonChart: React.FC<SkeletonProps & { type?: 'bar' | 'line' | 'pie' }> = ({
  className = '',
  type = 'bar',
  animate = 'shimmer',
}) => {
  if (type === 'pie') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <Skeleton width="150px" height="150px" className="rounded-full" animate={animate} />
      </div>
    );
  }

  return (
    <div className={`bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton width="120px" height="20px" animate={animate} />
        <Skeleton width="80px" height="16px" animate={animate} />
      </div>
      <div className="flex items-end gap-2 h-32">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={i}
            width="100%"
            height={`${Math.random() * 60 + 40}%`}
            className="rounded-t"
            animate={animate}
          />
        ))}
      </div>
    </div>
  );
};

// Skeleton for sidebar menu items
export const SkeletonMenuItem: React.FC<SkeletonProps> = ({
  className = '',
  animate = 'shimmer',
}) => {
  return (
    <div className={`flex items-center gap-3 px-3 py-2 ${className}`}>
      <Skeleton width="20px" height="20px" className="rounded" animate={animate} />
      <Skeleton width="100px" height="14px" animate={animate} />
    </div>
  );
};

// Skeleton for list items
export const SkeletonListItem: React.FC<SkeletonProps & { withAvatar?: boolean }> = ({
  className = '',
  withAvatar = true,
  animate = 'shimmer',
}) => {
  return (
    <div className={`flex items-center gap-3 p-3 ${className}`}>
      {withAvatar && <SkeletonAvatar size="md" animate={animate} />}
      <div className="flex-1">
        <Skeleton width="60%" height="16px" className="mb-2" animate={animate} />
        <Skeleton width="40%" height="12px" animate={animate} />
      </div>
      <Skeleton width="60px" height="24px" className="rounded-lg" animate={animate} />
    </div>
  );
};

// Skeleton for notification items
export const SkeletonNotification: React.FC<SkeletonProps> = ({
  className = '',
  animate = 'shimmer',
}) => {
  return (
    <div className={`flex items-start gap-3 p-4 border-b border-slate-700/50 ${className}`}>
      <Skeleton width="40px" height="40px" className="rounded-lg flex-shrink-0" animate={animate} />
      <div className="flex-1">
        <Skeleton width="80%" height="14px" className="mb-2" animate={animate} />
        <Skeleton width="100%" height="12px" className="mb-1" animate={animate} />
        <Skeleton width="60px" height="10px" animate={animate} />
      </div>
    </div>
  );
};

// Full page skeleton loader
export const SkeletonPage: React.FC<SkeletonProps> = ({
  className = '',
  animate = 'shimmer',
}) => {
  return (
    <div className={`space-y-6 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton width="200px" height="28px" className="mb-2" animate={animate} />
          <Skeleton width="300px" height="16px" animate={animate} />
        </div>
        <div className="flex gap-3">
          <Skeleton width="100px" height="40px" className="rounded-lg" animate={animate} />
          <Skeleton width="120px" height="40px" className="rounded-lg" animate={animate} />
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} animate={animate} />
        ))}
      </div>

      {/* Table */}
      <SkeletonTable rows={5} columns={6} animate={animate} />
    </div>
  );
};

// Dashboard skeleton
export const SkeletonDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <SkeletonPage />
    </div>
  );
};

export default Skeleton;
