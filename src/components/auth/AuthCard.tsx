/**
 * AuthCard - LITPER PRO
 *
 * Card con efecto glassmorphism premium
 * Inspirado en Linear, Stripe y Apple
 */

import React from 'react';

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'elevated' | 'bordered' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const AuthCard: React.FC<AuthCardProps> = ({
  children,
  className = '',
  variant = 'glass',
  padding = 'lg',
  animate = true,
  maxWidth = 'md',
}) => {
  // Padding classes
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };

  // Max width classes
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full',
  };

  // Variant styles
  const variantClasses = {
    default: `
      bg-zinc-900
      border border-zinc-800
      shadow-2xl
    `,
    glass: `
      bg-white/[0.03]
      backdrop-blur-2xl
      border border-white/[0.08]
      shadow-[0_8px_32px_rgba(0,0,0,0.4)]
    `,
    elevated: `
      bg-zinc-900
      border border-zinc-800
      shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]
    `,
    bordered: `
      bg-transparent
      border-2 border-zinc-700
      hover:border-zinc-600
      transition-colors duration-300
    `,
    gradient: `
      bg-gradient-to-br from-zinc-900/90 via-zinc-900/80 to-zinc-800/90
      backdrop-blur-xl
      border border-white/[0.08]
      shadow-[0_8px_32px_rgba(0,0,0,0.4)]
    `,
  };

  return (
    <div
      className={`
        relative w-full rounded-2xl overflow-hidden
        ${paddingClasses[padding]}
        ${maxWidthClasses[maxWidth]}
        ${variantClasses[variant]}
        ${animate ? 'animate-cardEnter' : ''}
        ${className}
      `}
    >
      {/* Subtle gradient border effect for glass variant */}
      {variant === 'glass' && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: `linear-gradient(135deg,
              rgba(255,255,255,0.1) 0%,
              transparent 40%,
              transparent 60%,
              rgba(255,255,255,0.05) 100%
            )`,
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'xor',
            WebkitMaskComposite: 'xor',
            padding: '1px',
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>

      <style>{`
        @keyframes cardEnter {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-cardEnter {
          animation: cardEnter 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
};

// Header component for auth cards
interface AuthCardHeaderProps {
  logo?: React.ReactNode;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
}

export const AuthCardHeader: React.FC<AuthCardHeaderProps> = ({
  logo,
  title,
  subtitle,
  align = 'center',
}) => (
  <div className={`mb-8 ${align === 'center' ? 'text-center' : 'text-left'}`}>
    {logo && (
      <div className={`mb-6 ${align === 'center' ? 'flex justify-center' : ''}`}>
        {logo}
      </div>
    )}
    <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
    {subtitle && (
      <p className="mt-2 text-zinc-400 text-sm">{subtitle}</p>
    )}
  </div>
);

// Footer component for auth cards
interface AuthCardFooterProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'between';
}

export const AuthCardFooter: React.FC<AuthCardFooterProps> = ({
  children,
  align = 'center',
}) => {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    between: 'justify-between',
  };

  return (
    <div className={`mt-6 pt-6 border-t border-white/5 flex items-center ${alignClasses[align]}`}>
      {children}
    </div>
  );
};

// Link styled for auth pages
interface AuthLinkProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  variant?: 'default' | 'muted' | 'primary';
}

export const AuthLink: React.FC<AuthLinkProps> = ({
  href,
  onClick,
  children,
  variant = 'default',
}) => {
  const variantClasses = {
    default: 'text-zinc-400 hover:text-white',
    muted: 'text-zinc-500 hover:text-zinc-300',
    primary: 'text-indigo-400 hover:text-indigo-300',
  };

  const Component = href ? 'a' : 'button';

  return (
    <Component
      href={href}
      onClick={onClick}
      className={`
        text-sm font-medium
        transition-colors duration-200
        ${variantClasses[variant]}
      `}
    >
      {children}
    </Component>
  );
};

export default AuthCard;
