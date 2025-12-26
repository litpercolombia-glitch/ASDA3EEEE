// components/ReviewedBadge.tsx
// Badge de verificación estilo Meta para indicar guías revisadas

import React from 'react';

interface ReviewedBadgeProps {
  revisada: boolean;
  fechaRevision?: Date;
  revisadoPor?: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  onClick?: () => void;
  animated?: boolean;
}

export const ReviewedBadge: React.FC<ReviewedBadgeProps> = ({
  revisada,
  fechaRevision,
  revisadoPor,
  size = 'md',
  showTooltip = true,
  onClick,
  animated = true,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const formatDate = (date?: Date) => {
    if (!date) return '';
    return new Date(date).toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const tooltipText = revisada
    ? `Revisada por ${revisadoPor || 'Usuario'} el ${formatDate(fechaRevision)}`
    : 'Pendiente de revisión - Clic para marcar';

  if (!revisada) {
    return (
      <button
        onClick={onClick}
        className={`
          reviewed-badge-pending ${sizeClasses[size]}
          ${onClick ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
        `}
        title={showTooltip ? tooltipText : undefined}
        type="button"
      >
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="4 2"
          />
        </svg>

        <style>{`
          .reviewed-badge-pending {
            color: #94a3b8;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: none;
            border: none;
            padding: 0;
          }

          .reviewed-badge-pending:hover {
            color: #3b82f6;
          }
        `}</style>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`
        reviewed-badge ${sizeClasses[size]}
        ${animated ? 'reviewed-badge-animated' : ''}
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
      `}
      title={showTooltip ? tooltipText : undefined}
      type="button"
    >
      {/* Círculo de fondo con gradiente */}
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id="metaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0095f6" />
            <stop offset="100%" stopColor="#0077cc" />
          </linearGradient>
        </defs>

        {/* Círculo principal */}
        <circle cx="12" cy="12" r="10" fill="url(#metaGradient)" />

        {/* Check blanco */}
        <path
          d="M8 12.5L10.5 15L16 9.5"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="check-path"
        />
      </svg>

      <style>{`
        .reviewed-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          padding: 0;
          filter: drop-shadow(0 1px 2px rgba(0, 149, 246, 0.3));
          transition: all 0.2s ease;
        }

        .reviewed-badge:hover {
          filter: drop-shadow(0 2px 4px rgba(0, 149, 246, 0.4));
          transform: scale(1.05);
        }

        .reviewed-badge-animated {
          animation: verifyPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .reviewed-badge-animated .check-path {
          animation: drawCheck 0.3s ease-out 0.1s both;
          stroke-dasharray: 20;
          stroke-dashoffset: 20;
        }

        @keyframes verifyPop {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes drawCheck {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </button>
  );
};

// Componente de badge pequeño para usar en línea
export const ReviewedBadgeInline: React.FC<{
  revisada: boolean;
  onClick?: () => void;
}> = ({ revisada, onClick }) => (
  <ReviewedBadge
    revisada={revisada}
    size="sm"
    showTooltip={false}
    onClick={onClick}
    animated={false}
  />
);

// Componente de contador de revisión
export const ReviewedCounter: React.FC<{
  revisadas: number;
  total: number;
  showPercentage?: boolean;
}> = ({ revisadas, total, showPercentage = true }) => {
  const porcentaje = total > 0 ? Math.round((revisadas / total) * 100) : 0;
  const isComplete = revisadas === total && total > 0;

  return (
    <div className="reviewed-counter">
      <div className="counter-icon">
        {isComplete ? (
          <ReviewedBadge revisada={true} size="sm" showTooltip={false} animated={false} />
        ) : (
          <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </div>

      <div className="counter-text">
        <span className="counter-numbers">
          <strong className={isComplete ? 'text-emerald-600' : 'text-blue-600'}>
            {revisadas}
          </strong>
          <span className="text-slate-400">/{total}</span>
        </span>
        {showPercentage && (
          <span className={`counter-percentage ${isComplete ? 'complete' : ''}`}>
            {porcentaje}%
          </span>
        )}
      </div>

      {/* Barra de progreso */}
      <div className="counter-progress">
        <div
          className={`counter-progress-fill ${isComplete ? 'complete' : ''}`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>

      <style>{`
        .reviewed-counter {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.375rem 0.75rem;
          background: #f8fafc;
          border-radius: 9999px;
          font-size: 0.75rem;
        }

        .counter-icon {
          display: flex;
          align-items: center;
        }

        .counter-text {
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        .counter-numbers {
          font-weight: 500;
        }

        .counter-percentage {
          padding: 0.125rem 0.375rem;
          background: #e2e8f0;
          border-radius: 4px;
          font-weight: 600;
          color: #64748b;
        }

        .counter-percentage.complete {
          background: #d1fae5;
          color: #059669;
        }

        .counter-progress {
          width: 60px;
          height: 4px;
          background: #e2e8f0;
          border-radius: 2px;
          overflow: hidden;
        }

        .counter-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #0095f6);
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .counter-progress-fill.complete {
          background: linear-gradient(90deg, #22c55e, #10b981);
        }
      `}</style>
    </div>
  );
};

export default ReviewedBadge;
