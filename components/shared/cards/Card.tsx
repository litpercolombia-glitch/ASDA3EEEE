/**
 * CARD COMPONENT
 *
 * Componente base de tarjeta reutilizable.
 */

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  onClick?: () => void;
  hoverable?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  variant = 'default',
  onClick,
  hoverable = false,
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const variantClasses = {
    default: 'bg-slate-800/50 border border-slate-700/50',
    elevated: 'bg-slate-800 shadow-xl shadow-black/20',
    outlined: 'bg-transparent border-2 border-slate-600',
    glass: 'bg-slate-800/30 backdrop-blur-lg border border-slate-700/30',
  };

  const baseClasses = `
    rounded-xl
    ${paddingClasses[padding]}
    ${variantClasses[variant]}
    ${hoverable || onClick ? 'cursor-pointer transition-all hover:border-slate-500 hover:shadow-lg' : ''}
    ${className}
  `;

  return (
    <div className={baseClasses} onClick={onClick}>
      {children}
    </div>
  );
};

export default Card;
