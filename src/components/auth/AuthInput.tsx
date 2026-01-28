/**
 * AuthInput - LITPER PRO
 *
 * Input premium con validación en tiempo real, animaciones y estados
 * Inspirado en Linear, Stripe y Vercel
 */

import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, Check, AlertCircle, Info } from 'lucide-react';

interface AuthInputProps {
  id: string;
  name: string;
  type: 'text' | 'email' | 'password' | 'tel';
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  error?: string;
  warning?: string;
  success?: string;
  hint?: string;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
  maxLength?: number;
  className?: string;
}

export const AuthInput: React.FC<AuthInputProps> = ({
  id,
  name,
  type,
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  warning,
  success,
  hint,
  disabled = false,
  required = false,
  autoComplete,
  autoFocus = false,
  icon,
  rightIcon,
  showPasswordToggle = false,
  maxLength,
  className = '',
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const inputType = type === 'password' && showPassword ? 'text' : type;

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    setHasInteracted(true);
    onBlur?.();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  // Determine state for styling
  const hasError = error && hasInteracted;
  const hasWarning = warning && hasInteracted && !error;
  const hasSuccess = success && hasInteracted && !error && !warning;
  const isActive = isFocused || value.length > 0;

  // State colors
  const getBorderColor = () => {
    if (hasError) return 'border-red-500';
    if (hasWarning) return 'border-amber-500';
    if (hasSuccess) return 'border-emerald-500';
    if (isFocused) return 'border-indigo-500';
    return 'border-white/10 hover:border-white/20';
  };

  const getGlowColor = () => {
    if (hasError) return 'shadow-[0_0_0_3px_rgba(239,68,68,0.1)]';
    if (hasWarning) return 'shadow-[0_0_0_3px_rgba(245,158,11,0.1)]';
    if (hasSuccess) return 'shadow-[0_0_0_3px_rgba(16,185,129,0.1)]';
    if (isFocused) return 'shadow-[0_0_0_3px_rgba(99,102,241,0.15)]';
    return '';
  };

  const getLabelColor = () => {
    if (hasError) return 'text-red-400';
    if (hasWarning) return 'text-amber-400';
    if (hasSuccess) return 'text-emerald-400';
    if (isFocused) return 'text-indigo-400';
    return 'text-zinc-400';
  };

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div className={`relative ${className}`}>
      {/* Floating Label */}
      <label
        htmlFor={id}
        className={`
          absolute left-3 transition-all duration-200 pointer-events-none z-10
          ${isActive
            ? '-top-2.5 text-xs px-1 bg-[#18181b]'
            : 'top-1/2 -translate-y-1/2 text-sm'
          }
          ${getLabelColor()}
          ${icon ? (isActive ? 'left-3' : 'left-11') : 'left-3'}
        `}
      >
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {icon && (
          <div
            className={`
              absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200
              ${isFocused ? 'text-indigo-400' : 'text-zinc-500'}
            `}
          >
            {icon}
          </div>
        )}

        {/* Input Field */}
        <input
          ref={inputRef}
          id={id}
          name={name}
          type={inputType}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={isActive ? placeholder : ''}
          disabled={disabled}
          autoComplete={autoComplete}
          maxLength={maxLength}
          className={`
            w-full h-14 px-4 pt-2
            bg-white/[0.03] backdrop-blur-sm
            border rounded-xl
            text-white text-base
            placeholder:text-zinc-600
            transition-all duration-200
            outline-none
            disabled:opacity-50 disabled:cursor-not-allowed
            ${icon ? 'pl-11' : 'pl-4'}
            ${(showPasswordToggle && type === 'password') || rightIcon ? 'pr-12' : 'pr-4'}
            ${getBorderColor()}
            ${getGlowColor()}
          `}
        />

        {/* Right Icon / Password Toggle / Status Icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {/* Status Icon */}
          {hasError && (
            <AlertCircle className="w-5 h-5 text-red-400 animate-pulse" />
          )}
          {hasWarning && (
            <AlertCircle className="w-5 h-5 text-amber-400" />
          )}
          {hasSuccess && (
            <Check className="w-5 h-5 text-emerald-400" />
          )}

          {/* Password Toggle */}
          {showPasswordToggle && type === 'password' && !hasError && !hasWarning && !hasSuccess && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          )}

          {/* Custom Right Icon */}
          {rightIcon && !showPasswordToggle && !hasError && !hasWarning && !hasSuccess && (
            <div className="text-zinc-500">{rightIcon}</div>
          )}
        </div>
      </div>

      {/* Helper Text / Error / Warning / Success Messages */}
      <div className="mt-1.5 min-h-[20px]">
        {hasError && (
          <p className="text-xs text-red-400 flex items-center gap-1 animate-slideDown">
            <AlertCircle className="w-3 h-3" />
            {error}
          </p>
        )}
        {hasWarning && (
          <p className="text-xs text-amber-400 flex items-center gap-1 animate-slideDown">
            <AlertCircle className="w-3 h-3" />
            {warning}
          </p>
        )}
        {hasSuccess && (
          <p className="text-xs text-emerald-400 flex items-center gap-1 animate-slideDown">
            <Check className="w-3 h-3" />
            {success}
          </p>
        )}
        {hint && !hasError && !hasWarning && !hasSuccess && (
          <p className="text-xs text-zinc-500 flex items-center gap-1">
            <Info className="w-3 h-3" />
            {hint}
          </p>
        )}
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AuthInput;
