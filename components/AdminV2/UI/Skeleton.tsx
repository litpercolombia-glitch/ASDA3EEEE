/**
 * Skeleton - Componentes de skeleton loading
 * Para estados de carga profesionales
 */

import React from 'react';
import { colors, radius } from '../../../styles/theme';

// ============================================
// KEYFRAMES (inline)
// ============================================

const shimmerKeyframes = `
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
`;

// ============================================
// BASE SKELETON
// ============================================

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  borderRadius = radius.md,
  style,
}) => {
  const skeletonStyles: React.CSSProperties = {
    width,
    height,
    borderRadius,
    background: `linear-gradient(90deg, ${colors.bg.tertiary} 25%, ${colors.bg.elevated} 50%, ${colors.bg.tertiary} 75%)`,
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    ...style,
  };

  return (
    <>
      <style>{shimmerKeyframes}</style>
      <div style={skeletonStyles} />
    </>
  );
};

// ============================================
// SKELETON VARIANTS
// ============================================

export const SkeletonText: React.FC<{ lines?: number; gap?: string }> = ({
  lines = 3,
  gap = '0.5rem',
}) => {
  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap,
  };

  return (
    <div style={containerStyles}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="0.875rem"
          width={i === lines - 1 ? '60%' : '100%'}
        />
      ))}
    </div>
  );
};

export const SkeletonAvatar: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeMap = { sm: '2rem', md: '2.5rem', lg: '3rem' };
  return <Skeleton width={sizeMap[size]} height={sizeMap[size]} borderRadius={radius.full} />;
};

export const SkeletonButton: React.FC<{ width?: string }> = ({ width = '6rem' }) => {
  return <Skeleton width={width} height="2.5rem" borderRadius={radius.lg} />;
};

// ============================================
// MESSAGE SKELETON
// ============================================

export const SkeletonMessage: React.FC<{ isUser?: boolean }> = ({ isUser = false }) => {
  const containerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    justifyContent: isUser ? 'flex-end' : 'flex-start',
    marginBottom: '1rem',
  };

  const bubbleStyles: React.CSSProperties = {
    maxWidth: '70%',
    padding: '1rem',
    borderRadius: radius.xl,
    backgroundColor: colors.bg.tertiary,
  };

  return (
    <div style={containerStyles}>
      {!isUser && <SkeletonAvatar size="md" />}
      <div style={bubbleStyles}>
        <SkeletonText lines={2} />
      </div>
      {isUser && <SkeletonAvatar size="md" />}
    </div>
  );
};

// ============================================
// CARD SKELETON
// ============================================

export const SkeletonCard: React.FC = () => {
  const cardStyles: React.CSSProperties = {
    padding: '1rem',
    borderRadius: radius.xl,
    backgroundColor: colors.bg.tertiary,
    border: `1px solid ${colors.border.light}`,
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1rem',
  };

  return (
    <div style={cardStyles}>
      <div style={headerStyles}>
        <Skeleton width="2.5rem" height="2.5rem" borderRadius={radius.lg} />
        <div style={{ flex: 1 }}>
          <Skeleton height="1rem" width="60%" style={{ marginBottom: '0.5rem' }} />
          <Skeleton height="0.75rem" width="40%" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
};

// ============================================
// TABLE SKELETON
// ============================================

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 4,
}) => {
  const tableStyles: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
  };

  const cellStyles: React.CSSProperties = {
    padding: '0.75rem',
    borderBottom: `1px solid ${colors.border.light}`,
  };

  return (
    <table style={tableStyles}>
      <thead>
        <tr>
          {Array.from({ length: cols }).map((_, i) => (
            <th key={i} style={cellStyles}>
              <Skeleton height="0.875rem" width="80%" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <tr key={rowIndex}>
            {Array.from({ length: cols }).map((_, colIndex) => (
              <td key={colIndex} style={cellStyles}>
                <Skeleton height="0.875rem" width={colIndex === 0 ? '90%' : '70%'} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Skeleton;
