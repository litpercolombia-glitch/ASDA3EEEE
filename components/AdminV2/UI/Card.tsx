/**
 * Card - Componente de card profesional
 * Con variantes, hover effects y composición
 */

import React, { useState } from 'react';
import { colors, radius, shadows, transitions } from '../../../styles/theme';

// ============================================
// TYPES
// ============================================

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  selected?: boolean;
  children: React.ReactNode;
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right' | 'between';
}

// ============================================
// STYLES
// ============================================

const paddingMap = {
  none: '0',
  sm: '0.75rem',
  md: '1rem',
  lg: '1.5rem',
};

const variantStyles: Record<string, React.CSSProperties> = {
  default: {
    backgroundColor: colors.bg.tertiary,
    border: `1px solid ${colors.border.light}`,
  },
  elevated: {
    backgroundColor: colors.bg.elevated,
    boxShadow: shadows.md,
    border: 'none',
  },
  outlined: {
    backgroundColor: 'transparent',
    border: `1px solid ${colors.border.default}`,
  },
  ghost: {
    backgroundColor: 'transparent',
    border: 'none',
  },
  interactive: {
    backgroundColor: colors.bg.tertiary,
    border: `1px solid ${colors.border.light}`,
    cursor: 'pointer',
  },
};

// ============================================
// MAIN CARD COMPONENT
// ============================================

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  hoverable = false,
  selected = false,
  children,
  style,
  onMouseEnter,
  onMouseLeave,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const baseStyles: React.CSSProperties = {
    borderRadius: radius.xl,
    overflow: 'hidden',
    transition: `all ${transitions.slow}`,
  };

  const hoverStyles: React.CSSProperties = (hoverable || variant === 'interactive') && isHovered ? {
    transform: 'translateY(-2px)',
    boxShadow: shadows.lg,
    borderColor: colors.border.hover,
  } : {};

  const selectedStyles: React.CSSProperties = selected ? {
    borderColor: colors.brand.primary,
    boxShadow: `0 0 0 1px ${colors.brand.primary}`,
  } : {};

  const combinedStyles: React.CSSProperties = {
    ...baseStyles,
    ...variantStyles[variant],
    padding: paddingMap[padding],
    ...hoverStyles,
    ...selectedStyles,
    ...style,
  };

  return (
    <div
      {...props}
      style={combinedStyles}
      onMouseEnter={(e) => {
        setIsHovered(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
        onMouseLeave?.(e);
      }}
    >
      {children}
    </div>
  );
};

// ============================================
// CARD HEADER
// ============================================

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  action,
  icon,
  children,
  style,
  ...props
}) => {
  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '1rem',
    marginBottom: '1rem',
    ...style,
  };

  const contentStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flex: 1,
  };

  const textStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  };

  const titleStyles: React.CSSProperties = {
    fontSize: '1rem',
    fontWeight: 600,
    color: colors.text.primary,
    margin: 0,
  };

  const subtitleStyles: React.CSSProperties = {
    fontSize: '0.875rem',
    color: colors.text.secondary,
    margin: 0,
  };

  if (children) {
    return <div style={headerStyles} {...props}>{children}</div>;
  }

  return (
    <div style={headerStyles} {...props}>
      <div style={contentStyles}>
        {icon && <div>{icon}</div>}
        <div style={textStyles}>
          {title && <h3 style={titleStyles}>{title}</h3>}
          {subtitle && <p style={subtitleStyles}>{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

// ============================================
// CARD CONTENT
// ============================================

export const CardContent: React.FC<CardContentProps> = ({
  children,
  style,
  ...props
}) => {
  return (
    <div style={style} {...props}>
      {children}
    </div>
  );
};

// ============================================
// CARD FOOTER
// ============================================

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  align = 'right',
  style,
  ...props
}) => {
  const alignMap = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end',
    between: 'space-between',
  };

  const footerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: alignMap[align],
    gap: '0.75rem',
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: `1px solid ${colors.border.light}`,
    ...style,
  };

  return (
    <div style={footerStyles} {...props}>
      {children}
    </div>
  );
};

export default Card;
