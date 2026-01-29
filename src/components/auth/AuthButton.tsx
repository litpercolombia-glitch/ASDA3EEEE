/**
 * AuthButton - LITPER PRO
 *
 * Botón premium con animaciones, estados de carga y variantes
 * Inspirado en Linear, Stripe y Vercel
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

interface AuthButtonProps {
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  type = 'button',
  variant = 'primary',
  size = 'lg',
  children,
  onClick,
  disabled = false,
  loading = false,
  loadingText,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  className = '',
}) => {
  const isDisabled = disabled || loading;

  // Size classes
  const sizeClasses = {
    sm: 'h-9 px-3 text-sm gap-1.5',
    md: 'h-11 px-4 text-sm gap-2',
    lg: 'h-12 px-5 text-base gap-2',
    xl: 'h-14 px-6 text-base gap-2.5',
  };

  // Variant classes with premium styling
  const variantClasses = {
    primary: `
      bg-gradient-to-r from-indigo-600 to-purple-600
      hover:from-indigo-500 hover:to-purple-500
      active:from-indigo-700 active:to-purple-700
      text-white font-medium
      shadow-lg shadow-indigo-500/25
      hover:shadow-xl hover:shadow-indigo-500/30
      border border-indigo-500/20
      disabled:from-zinc-700 disabled:to-zinc-700 disabled:shadow-none disabled:border-zinc-600
    `,
    secondary: `
      bg-white/[0.05] hover:bg-white/[0.08] active:bg-white/[0.03]
      text-white font-medium
      border border-white/10 hover:border-white/20
      disabled:bg-white/[0.02] disabled:text-zinc-500 disabled:border-white/5
    `,
    ghost: `
      bg-transparent hover:bg-white/[0.05] active:bg-white/[0.03]
      text-zinc-300 hover:text-white
      font-medium
      disabled:text-zinc-600 disabled:hover:bg-transparent
    `,
    outline: `
      bg-transparent
      text-indigo-400 hover:text-indigo-300
      border-2 border-indigo-500/50 hover:border-indigo-400
      hover:bg-indigo-500/10
      font-medium
      disabled:text-zinc-500 disabled:border-zinc-700 disabled:hover:bg-transparent
    `,
    danger: `
      bg-gradient-to-r from-red-600 to-rose-600
      hover:from-red-500 hover:to-rose-500
      active:from-red-700 active:to-rose-700
      text-white font-medium
      shadow-lg shadow-red-500/25
      hover:shadow-xl hover:shadow-red-500/30
      border border-red-500/20
      disabled:from-zinc-700 disabled:to-zinc-700 disabled:shadow-none disabled:border-zinc-600
    `,
    success: `
      bg-gradient-to-r from-emerald-600 to-teal-600
      hover:from-emerald-500 hover:to-teal-500
      active:from-emerald-700 active:to-teal-700
      text-white font-medium
      shadow-lg shadow-emerald-500/25
      hover:shadow-xl hover:shadow-emerald-500/30
      border border-emerald-500/20
      disabled:from-zinc-700 disabled:to-zinc-700 disabled:shadow-none disabled:border-zinc-600
    `,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        relative inline-flex items-center justify-center
        rounded-xl
        transition-all duration-200
        disabled:cursor-not-allowed
        overflow-hidden
        group
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {/* Shine effect on hover */}
      {variant === 'primary' && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 45%, transparent 50%)',
            animation: 'shine 2s ease-in-out infinite',
          }}
        />
      )}

      {/* Content */}
      <span className="relative flex items-center justify-center gap-2">
        {/* Loading spinner */}
        {loading && (
          <Loader2 className="w-4 h-4 animate-spin" />
        )}

        {/* Left icon */}
        {!loading && icon && iconPosition === 'left' && (
          <span className="flex-shrink-0">{icon}</span>
        )}

        {/* Text */}
        <span>{loading && loadingText ? loadingText : children}</span>

        {/* Right icon */}
        {!loading && icon && iconPosition === 'right' && (
          <span className="flex-shrink-0">{icon}</span>
        )}
      </span>

      {/* Ripple effect styles */}
      <style>{`
        @keyframes shine {
          0% {
            transform: translateX(-100%);
          }
          50%, 100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </button>
  );
};

// Social Login Buttons
interface SocialButtonProps {
  provider: 'google' | 'github' | 'microsoft' | 'apple';
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  showLabel?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export const SocialButton: React.FC<SocialButtonProps> = ({
  provider,
  onClick,
  disabled = false,
  loading = false,
  showLabel = true,
  fullWidth = false,
  className = '',
}) => {
  const configs = {
    google: {
      name: 'Google',
      bg: 'bg-white hover:bg-gray-50',
      text: 'text-gray-800',
      border: 'border-gray-200',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      ),
    },
    github: {
      name: 'GitHub',
      bg: 'bg-[#24292e] hover:bg-[#2f363d]',
      text: 'text-white',
      border: 'border-[#24292e]',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path
            fillRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    microsoft: {
      name: 'Microsoft',
      bg: 'bg-[#2f2f2f] hover:bg-[#3b3b3b]',
      text: 'text-white',
      border: 'border-[#2f2f2f]',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#F25022" d="M1 1h10v10H1z" />
          <path fill="#00A4EF" d="M1 13h10v10H1z" />
          <path fill="#7FBA00" d="M13 1h10v10H13z" />
          <path fill="#FFB900" d="M13 13h10v10H13z" />
        </svg>
      ),
    },
    apple: {
      name: 'Apple',
      bg: 'bg-black hover:bg-zinc-900',
      text: 'text-white',
      border: 'border-black',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
      ),
    },
  };

  const config = configs[provider];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        relative flex items-center justify-center gap-3
        h-12 px-4 rounded-xl
        ${config.bg} ${config.text}
        border ${config.border}
        font-medium text-sm
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        config.icon
      )}
      {showLabel && (
        <span>Continuar con {config.name}</span>
      )}
    </button>
  );
};

// Divider with text
export const AuthDivider: React.FC<{ text?: string }> = ({ text = 'o' }) => (
  <div className="relative flex items-center my-6">
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    <span className="px-4 text-sm text-zinc-500 uppercase tracking-wider">{text}</span>
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
  </div>
);

export default AuthButton;
