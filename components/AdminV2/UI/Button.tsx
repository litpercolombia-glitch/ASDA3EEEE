/**
 * Button - Componente de botón profesional
 * Con variantes, tamaños, estados y animaciones
 */

import React from 'react';
import { Loader2, LucideIcon } from 'lucide-react';
import { colors, radius, transitions } from '../../../styles/theme';

// ============================================
// TYPES
// ============================================

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children?: React.ReactNode;
}

// ============================================
// STYLES
// ============================================

const baseStyles: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  fontWeight: 500,
  borderRadius: radius.lg,
  transition: `all ${transitions.normal}`,
  cursor: 'pointer',
  border: 'none',
  outline: 'none',
  fontFamily: 'inherit',
  whiteSpace: 'nowrap',
};

const variantStyles: Record<string, { default: React.CSSProperties; hover: React.CSSProperties; disabled: React.CSSProperties }> = {
  primary: {
    default: {
      backgroundColor: colors.brand.primary,
      color: '#FFFFFF',
    },
    hover: {
      backgroundColor: colors.brand.primaryHover,
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
    },
    disabled: {
      backgroundColor: colors.bg.elevated,
      color: colors.text.muted,
      cursor: 'not-allowed',
    },
  },
  secondary: {
    default: {
      backgroundColor: colors.brand.secondary,
      color: '#FFFFFF',
    },
    hover: {
      backgroundColor: colors.brand.secondaryHover,
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
    },
    disabled: {
      backgroundColor: colors.bg.elevated,
      color: colors.text.muted,
      cursor: 'not-allowed',
    },
  },
  ghost: {
    default: {
      backgroundColor: 'transparent',
      color: colors.text.secondary,
    },
    hover: {
      backgroundColor: colors.bg.hover,
      color: colors.text.primary,
    },
    disabled: {
      backgroundColor: 'transparent',
      color: colors.text.muted,
      cursor: 'not-allowed',
    },
  },
  danger: {
    default: {
      backgroundColor: colors.error.default,
      color: '#FFFFFF',
    },
    hover: {
      backgroundColor: colors.error.dark,
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
    },
    disabled: {
      backgroundColor: colors.bg.elevated,
      color: colors.text.muted,
      cursor: 'not-allowed',
    },
  },
  success: {
    default: {
      backgroundColor: colors.success.default,
      color: '#FFFFFF',
    },
    hover: {
      backgroundColor: colors.success.dark,
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
    },
    disabled: {
      backgroundColor: colors.bg.elevated,
      color: colors.text.muted,
      cursor: 'not-allowed',
    },
  },
  outline: {
    default: {
      backgroundColor: 'transparent',
      color: colors.brand.primary,
      border: `1px solid ${colors.brand.primary}`,
    },
    hover: {
      backgroundColor: colors.brand.primary + '15',
      borderColor: colors.brand.primaryHover,
    },
    disabled: {
      backgroundColor: 'transparent',
      color: colors.text.muted,
      borderColor: colors.border.default,
      cursor: 'not-allowed',
    },
  },
};

const sizeStyles: Record<string, React.CSSProperties> = {
  xs: {
    padding: '0.375rem 0.75rem',
    fontSize: '0.75rem',
    minHeight: '1.75rem',
  },
  sm: {
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    minHeight: '2rem',
  },
  md: {
    padding: '0.625rem 1.25rem',
    fontSize: '0.875rem',
    minHeight: '2.5rem',
  },
  lg: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    minHeight: '3rem',
  },
};

// ============================================
// COMPONENT
// ============================================

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled,
  children,
  style,
  onMouseEnter,
  onMouseLeave,
  ...props
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const isDisabled = disabled || loading;
  const variantStyle = variantStyles[variant];
  const currentVariantStyle = isDisabled
    ? variantStyle.disabled
    : isHovered
      ? { ...variantStyle.default, ...variantStyle.hover }
      : variantStyle.default;

  const combinedStyles: React.CSSProperties = {
    ...baseStyles,
    ...sizeStyles[size],
    ...currentVariantStyle,
    ...(fullWidth && { width: '100%' }),
    ...style,
  };

  const iconSize = size === 'xs' ? 14 : size === 'sm' ? 16 : size === 'lg' ? 20 : 18;

  return (
    <button
      {...props}
      disabled={isDisabled}
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
      {loading ? (
        <Loader2 size={iconSize} className="animate-spin" />
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon size={iconSize} />}
          {children}
          {Icon && iconPosition === 'right' && <Icon size={iconSize} />}
        </>
      )}
    </button>
  );
};

export default Button;
