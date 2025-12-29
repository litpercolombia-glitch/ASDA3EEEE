/**
 * Badge - Componente de badge profesional
 * Para categorías, estados y etiquetas
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { colors, radius, transitions } from '../../../styles/theme';

// ============================================
// TYPES
// ============================================

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'outline';
  size?: 'xs' | 'sm' | 'md';
  icon?: LucideIcon;
  dot?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  children: React.ReactNode;
}

// ============================================
// STYLES
// ============================================

const variantStyles: Record<string, React.CSSProperties> = {
  default: {
    backgroundColor: colors.bg.elevated,
    color: colors.text.secondary,
    border: `1px solid ${colors.border.default}`,
  },
  primary: {
    backgroundColor: colors.brand.primary + '20',
    color: colors.brand.primary,
    border: `1px solid ${colors.brand.primary}40`,
  },
  secondary: {
    backgroundColor: colors.brand.secondary + '20',
    color: colors.brand.secondary,
    border: `1px solid ${colors.brand.secondary}40`,
  },
  success: {
    backgroundColor: colors.success.light,
    color: colors.success.default,
    border: `1px solid ${colors.success.default}40`,
  },
  warning: {
    backgroundColor: colors.warning.light,
    color: colors.warning.default,
    border: `1px solid ${colors.warning.default}40`,
  },
  error: {
    backgroundColor: colors.error.light,
    color: colors.error.default,
    border: `1px solid ${colors.error.default}40`,
  },
  info: {
    backgroundColor: colors.info.light,
    color: colors.info.default,
    border: `1px solid ${colors.info.default}40`,
  },
  outline: {
    backgroundColor: 'transparent',
    color: colors.text.secondary,
    border: `1px solid ${colors.border.default}`,
  },
};

const sizeStyles: Record<string, { padding: string; fontSize: string; iconSize: number }> = {
  xs: { padding: '0.125rem 0.375rem', fontSize: '0.625rem', iconSize: 10 },
  sm: { padding: '0.25rem 0.5rem', fontSize: '0.75rem', iconSize: 12 },
  md: { padding: '0.375rem 0.75rem', fontSize: '0.875rem', iconSize: 14 },
};

// ============================================
// COMPONENT
// ============================================

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'sm',
  icon: Icon,
  dot,
  removable,
  onRemove,
  children,
  style,
  ...props
}) => {
  const config = sizeStyles[size];

  const badgeStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: config.padding,
    fontSize: config.fontSize,
    fontWeight: 500,
    borderRadius: radius.full,
    transition: `all ${transitions.fast}`,
    whiteSpace: 'nowrap',
    ...variantStyles[variant],
    ...style,
  };

  const dotStyles: React.CSSProperties = {
    width: size === 'xs' ? '0.375rem' : '0.5rem',
    height: size === 'xs' ? '0.375rem' : '0.5rem',
    borderRadius: radius.full,
    backgroundColor: 'currentColor',
  };

  const removeButtonStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: config.iconSize + 2,
    height: config.iconSize + 2,
    marginLeft: '0.125rem',
    marginRight: '-0.25rem',
    padding: 0,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: radius.full,
    color: 'currentColor',
    opacity: 0.7,
    cursor: 'pointer',
    transition: `opacity ${transitions.fast}`,
  };

  return (
    <span style={badgeStyles} {...props}>
      {dot && <span style={dotStyles} />}
      {Icon && <Icon size={config.iconSize} />}
      {children}
      {removable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          style={removeButtonStyles}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
        >
          <svg width={config.iconSize} height={config.iconSize} viewBox="0 0 12 12" fill="none">
            <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      )}
    </span>
  );
};

// ============================================
// SKILL CATEGORY BADGE
// ============================================

export interface SkillBadgeProps {
  category: 'logistics' | 'finance' | 'analytics' | 'automation' | 'communication';
  size?: 'xs' | 'sm' | 'md';
  showIcon?: boolean;
}

const categoryConfig: Record<string, { label: string; emoji: string }> = {
  logistics: { label: 'Logistica', emoji: '📦' },
  finance: { label: 'Finanzas', emoji: '💰' },
  analytics: { label: 'Analitica', emoji: '📊' },
  automation: { label: 'Automatizacion', emoji: '⚡' },
  communication: { label: 'Comunicacion', emoji: '💬' },
};

export const SkillBadge: React.FC<SkillBadgeProps> = ({
  category,
  size = 'sm',
  showIcon = true,
}) => {
  const config = categoryConfig[category];
  const categoryColors = colors.skills[category];
  const sizeConfig = sizeStyles[size];

  const badgeStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: sizeConfig.padding,
    fontSize: sizeConfig.fontSize,
    fontWeight: 500,
    borderRadius: radius.full,
    backgroundColor: categoryColors.bg,
    color: categoryColors.text,
    border: `1px solid ${categoryColors.border}`,
  };

  return (
    <span style={badgeStyles}>
      {showIcon && <span>{config.emoji}</span>}
      {config.label}
    </span>
  );
};

export default Badge;
