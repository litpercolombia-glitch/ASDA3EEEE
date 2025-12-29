/**
 * Input - Componente de input profesional
 * Con label flotante, validación, iconos y estados
 */

import React, { useState, useId } from 'react';
import { LucideIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { colors, radius, transitions } from '../../../styles/theme';

// ============================================
// TYPES
// ============================================

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export const Input: React.FC<InputProps> = ({
  label,
  error,
  success,
  hint,
  icon: Icon,
  iconPosition = 'left',
  size = 'md',
  fullWidth = true,
  disabled,
  value,
  placeholder,
  onFocus,
  onBlur,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const id = useId();
  const hasValue = value !== undefined && value !== '';
  const showFloatingLabel = label && (isFocused || hasValue);

  // Sizes
  const sizeConfig = {
    sm: { height: '2rem', fontSize: '0.875rem', padding: '0.5rem', iconSize: 16 },
    md: { height: '2.5rem', fontSize: '0.875rem', padding: '0.75rem', iconSize: 18 },
    lg: { height: '3rem', fontSize: '1rem', padding: '1rem', iconSize: 20 },
  };

  const config = sizeConfig[size];

  // Border color
  const getBorderColor = () => {
    if (error) return colors.error.default;
    if (success) return colors.success.default;
    if (isFocused) return colors.brand.primary;
    return colors.border.default;
  };

  // Wrapper styles
  const wrapperStyles: React.CSSProperties = {
    position: 'relative',
    width: fullWidth ? '100%' : 'auto',
  };

  // Container styles
  const containerStyles: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.lg,
    border: `1px solid ${getBorderColor()}`,
    transition: `all ${transitions.normal}`,
    ...(isFocused && {
      boxShadow: `0 0 0 3px ${error ? colors.error.light : success ? colors.success.light : colors.brand.primary + '20'}`,
    }),
  };

  // Input styles
  const inputStyles: React.CSSProperties = {
    width: '100%',
    height: config.height,
    padding: config.padding,
    paddingLeft: Icon && iconPosition === 'left' ? `calc(${config.padding} + ${config.iconSize}px + 0.5rem)` : config.padding,
    paddingRight: Icon && iconPosition === 'right' ? `calc(${config.padding} + ${config.iconSize}px + 0.5rem)` : config.padding,
    paddingTop: label ? '1.25rem' : config.padding,
    paddingBottom: label ? '0.375rem' : config.padding,
    fontSize: config.fontSize,
    fontFamily: 'inherit',
    color: colors.text.primary,
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    transition: `all ${transitions.normal}`,
    ...(disabled && {
      color: colors.text.muted,
      cursor: 'not-allowed',
    }),
    ...style,
  };

  // Label styles
  const labelStyles: React.CSSProperties = {
    position: 'absolute',
    left: Icon && iconPosition === 'left' ? `calc(${config.padding} + ${config.iconSize}px + 0.5rem)` : config.padding,
    top: showFloatingLabel ? '0.375rem' : '50%',
    transform: showFloatingLabel ? 'none' : 'translateY(-50%)',
    fontSize: showFloatingLabel ? '0.75rem' : config.fontSize,
    color: isFocused ? colors.brand.primary : colors.text.tertiary,
    pointerEvents: 'none',
    transition: `all ${transitions.normal}`,
  };

  // Icon styles
  const iconStyles: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    color: isFocused ? colors.brand.primary : colors.text.tertiary,
    pointerEvents: 'none',
    transition: `color ${transitions.normal}`,
    ...(iconPosition === 'left' ? { left: config.padding } : { right: config.padding }),
  };

  // Message styles
  const messageStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    marginTop: '0.375rem',
    fontSize: '0.75rem',
  };

  return (
    <div style={wrapperStyles}>
      <div style={containerStyles}>
        {Icon && (
          <div style={iconStyles}>
            <Icon size={config.iconSize} />
          </div>
        )}

        {label && <label htmlFor={id} style={labelStyles}>{label}</label>}

        <input
          {...props}
          id={id}
          value={value}
          disabled={disabled}
          placeholder={!label || showFloatingLabel ? placeholder : undefined}
          style={inputStyles}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
        />
      </div>

      {/* Error message */}
      {error && (
        <div style={{ ...messageStyles, color: colors.error.default }}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Success message */}
      {success && !error && (
        <div style={{ ...messageStyles, color: colors.success.default }}>
          <CheckCircle size={14} />
          <span>{success}</span>
        </div>
      )}

      {/* Hint */}
      {hint && !error && !success && (
        <div style={{ ...messageStyles, color: colors.text.tertiary }}>
          <span>{hint}</span>
        </div>
      )}
    </div>
  );
};

export default Input;
