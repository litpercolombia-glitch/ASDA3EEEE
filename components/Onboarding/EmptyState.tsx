'use client';

import React from 'react';
import {
  Package,
  Search,
  Bell,
  AlertCircle,
  FileText,
  Upload,
  Database,
  Play,
  HelpCircle,
  ArrowRight,
  Plus,
  Truck,
  BarChart3,
  Settings,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

// ============================================
// EMPTY STATE - Estados vacíos mejorados
// Con ilustraciones animadas y CTAs múltiples
// ============================================

type EmptyStateVariant =
  | 'no-guides'
  | 'no-tracking'
  | 'no-alerts'
  | 'no-results'
  | 'no-data'
  | 'error'
  | 'coming-soon'
  | 'maintenance';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: React.ElementType;
}

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  actions?: EmptyStateAction[];
  helpLink?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

// Animated SVG Illustrations
const PackageIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={`${className}`}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Floating package animation */}
    <g className="animate-[float_3s_ease-in-out_infinite]">
      {/* Box body */}
      <rect x="50" y="70" width="100" height="80" rx="8" fill="url(#boxGradient)" />
      {/* Box top */}
      <path d="M50 78L100 50L150 78V90H50V78Z" fill="url(#boxTopGradient)" />
      {/* Box tape */}
      <rect x="90" y="50" width="20" height="100" fill="#8B5CF6" opacity="0.8" />
      {/* Box highlight */}
      <rect x="55" y="95" width="40" height="3" rx="1.5" fill="white" opacity="0.2" />
      {/* Sparkles */}
      <circle cx="170" cy="60" r="3" fill="#F59E0B" className="animate-ping" />
      <circle cx="30" cy="90" r="2" fill="#10B981" className="animate-ping" style={{ animationDelay: '0.5s' }} />
      <circle cx="160" cy="130" r="2.5" fill="#8B5CF6" className="animate-ping" style={{ animationDelay: '1s' }} />
    </g>
    <defs>
      <linearGradient id="boxGradient" x1="50" y1="70" x2="150" y2="150" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4F46E5" />
        <stop offset="1" stopColor="#7C3AED" />
      </linearGradient>
      <linearGradient id="boxTopGradient" x1="50" y1="50" x2="150" y2="90" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6366F1" />
        <stop offset="1" stopColor="#8B5CF6" />
      </linearGradient>
    </defs>
  </svg>
);

const SearchIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={`${className}`}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g className="animate-[float_3s_ease-in-out_infinite]">
      {/* Magnifying glass */}
      <circle cx="85" cy="85" r="40" stroke="url(#searchGradient)" strokeWidth="8" fill="none" />
      <line x1="115" y1="115" x2="155" y2="155" stroke="url(#searchGradient)" strokeWidth="10" strokeLinecap="round" />
      {/* Glass reflection */}
      <path d="M65 65 Q75 55 85 65" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
      {/* Question marks */}
      <text x="75" y="95" fill="#64748B" fontSize="24" fontWeight="bold" className="animate-pulse">?</text>
      {/* Dots */}
      <circle cx="160" cy="50" r="4" fill="#F59E0B" className="animate-ping" />
      <circle cx="40" cy="140" r="3" fill="#10B981" className="animate-ping" style={{ animationDelay: '0.7s' }} />
    </g>
    <defs>
      <linearGradient id="searchGradient" x1="60" y1="60" x2="160" y2="160" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6366F1" />
        <stop offset="1" stopColor="#8B5CF6" />
      </linearGradient>
    </defs>
  </svg>
);

const AlertIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={`${className}`}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g className="animate-[float_3s_ease-in-out_infinite]">
      {/* Bell */}
      <path
        d="M100 40C72 40 50 62 50 90V120L40 140H160L150 120V90C150 62 128 40 100 40Z"
        fill="url(#bellGradient)"
      />
      <circle cx="100" cy="160" r="15" fill="#10B981" />
      {/* Check mark */}
      <path d="M92 160L98 166L110 154" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {/* Sparkles */}
      <circle cx="170" cy="70" r="4" fill="#10B981" className="animate-ping" />
      <circle cx="30" cy="100" r="3" fill="#10B981" className="animate-ping" style={{ animationDelay: '0.5s' }} />
    </g>
    <defs>
      <linearGradient id="bellGradient" x1="40" y1="40" x2="160" y2="160" gradientUnits="userSpaceOnUse">
        <stop stopColor="#10B981" />
        <stop offset="1" stopColor="#059669" />
      </linearGradient>
    </defs>
  </svg>
);

const ErrorIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={`${className}`}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g className="animate-[float_3s_ease-in-out_infinite]">
      {/* Warning triangle */}
      <path
        d="M100 40L170 150H30L100 40Z"
        fill="url(#errorGradient)"
        stroke="#EF4444"
        strokeWidth="4"
      />
      {/* Exclamation */}
      <line x1="100" y1="75" x2="100" y2="110" stroke="white" strokeWidth="8" strokeLinecap="round" />
      <circle cx="100" cy="130" r="5" fill="white" />
      {/* X marks */}
      <g className="animate-pulse">
        <line x1="160" y1="50" x2="175" y2="65" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
        <line x1="175" y1="50" x2="160" y2="65" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
      </g>
      <g className="animate-pulse" style={{ animationDelay: '0.5s' }}>
        <line x1="25" y1="90" x2="40" y2="105" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
        <line x1="40" y1="90" x2="25" y2="105" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
      </g>
    </g>
    <defs>
      <linearGradient id="errorGradient" x1="30" y1="40" x2="170" y2="150" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FCA5A5" />
        <stop offset="1" stopColor="#F87171" />
      </linearGradient>
    </defs>
  </svg>
);

const ComingSoonIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={`${className}`}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g className="animate-[float_3s_ease-in-out_infinite]">
      {/* Rocket */}
      <path
        d="M100 30L130 100L100 90L70 100L100 30Z"
        fill="url(#rocketGradient)"
      />
      <ellipse cx="100" cy="110" rx="30" ry="15" fill="#4F46E5" />
      {/* Flames */}
      <path
        d="M85 120L100 160L115 120"
        fill="#F59E0B"
        className="animate-pulse"
      />
      <path
        d="M90 120L100 145L110 120"
        fill="#FBBF24"
        className="animate-pulse"
        style={{ animationDelay: '0.2s' }}
      />
      {/* Stars */}
      <circle cx="40" cy="50" r="3" fill="#F59E0B" className="animate-ping" />
      <circle cx="160" cy="70" r="2" fill="#8B5CF6" className="animate-ping" style={{ animationDelay: '0.3s' }} />
      <circle cx="150" cy="140" r="3" fill="#10B981" className="animate-ping" style={{ animationDelay: '0.6s' }} />
      <circle cx="50" cy="130" r="2" fill="#F59E0B" className="animate-ping" style={{ animationDelay: '0.9s' }} />
    </g>
    <defs>
      <linearGradient id="rocketGradient" x1="70" y1="30" x2="130" y2="110" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6366F1" />
        <stop offset="1" stopColor="#8B5CF6" />
      </linearGradient>
    </defs>
  </svg>
);

// Variant configurations
const variantConfig: Record<EmptyStateVariant, {
  illustration: React.FC<{ className?: string }>;
  defaultTitle: string;
  defaultDescription: string;
  defaultActions: EmptyStateAction[];
  iconColor: string;
}> = {
  'no-guides': {
    illustration: PackageIllustration,
    defaultTitle: '¡Comienza tu primera operación!',
    defaultDescription: 'Importa tus guías y empieza a trackear en segundos. Es rápido, fácil y totalmente automatizado.',
    defaultActions: [
      { label: 'Cargar Guías', onClick: () => {}, variant: 'primary', icon: Upload },
      { label: 'Importar Excel', onClick: () => {}, variant: 'secondary', icon: FileText },
      { label: 'Conectar API', onClick: () => {}, variant: 'secondary', icon: Database },
    ],
    iconColor: 'text-violet-400',
  },
  'no-tracking': {
    illustration: SearchIllustration,
    defaultTitle: 'Sin envíos para trackear',
    defaultDescription: 'Cuando cargues guías, aquí podrás ver el estado en tiempo real de todos tus envíos.',
    defaultActions: [
      { label: 'Cargar primera guía', onClick: () => {}, variant: 'primary', icon: Plus },
      { label: 'Ver demo', onClick: () => {}, variant: 'secondary', icon: Play },
    ],
    iconColor: 'text-blue-400',
  },
  'no-alerts': {
    illustration: AlertIllustration,
    defaultTitle: '¡Todo en orden!',
    defaultDescription: 'No tienes alertas pendientes. Tu operación está funcionando perfectamente.',
    defaultActions: [
      { label: 'Configurar alertas', onClick: () => {}, variant: 'secondary', icon: Settings },
    ],
    iconColor: 'text-emerald-400',
  },
  'no-results': {
    illustration: SearchIllustration,
    defaultTitle: 'No encontramos resultados',
    defaultDescription: 'Intenta con otros términos de búsqueda o ajusta los filtros aplicados.',
    defaultActions: [
      { label: 'Limpiar filtros', onClick: () => {}, variant: 'secondary', icon: RefreshCw },
    ],
    iconColor: 'text-slate-400',
  },
  'no-data': {
    illustration: PackageIllustration,
    defaultTitle: 'Sin datos disponibles',
    defaultDescription: 'Aún no hay información para mostrar en esta sección.',
    defaultActions: [
      { label: 'Actualizar', onClick: () => {}, variant: 'secondary', icon: RefreshCw },
    ],
    iconColor: 'text-slate-400',
  },
  'error': {
    illustration: ErrorIllustration,
    defaultTitle: 'Algo salió mal',
    defaultDescription: 'Ocurrió un error inesperado. Por favor intenta de nuevo o contacta soporte.',
    defaultActions: [
      { label: 'Reintentar', onClick: () => {}, variant: 'primary', icon: RefreshCw },
      { label: 'Contactar soporte', onClick: () => {}, variant: 'secondary', icon: HelpCircle },
    ],
    iconColor: 'text-red-400',
  },
  'coming-soon': {
    illustration: ComingSoonIllustration,
    defaultTitle: '¡Próximamente!',
    defaultDescription: 'Estamos trabajando en esta funcionalidad. Pronto estará disponible para ti.',
    defaultActions: [
      { label: 'Recibir notificación', onClick: () => {}, variant: 'primary', icon: Bell },
    ],
    iconColor: 'text-amber-400',
  },
  'maintenance': {
    illustration: ErrorIllustration,
    defaultTitle: 'En mantenimiento',
    defaultDescription: 'Estamos realizando mejoras. Volveremos pronto con una mejor experiencia.',
    defaultActions: [],
    iconColor: 'text-amber-400',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'no-guides',
  title,
  description,
  actions,
  helpLink,
  className = '',
  size = 'md',
}) => {
  const config = variantConfig[variant];
  const Illustration = config.illustration;

  const sizeClasses = {
    sm: { container: 'py-8', illustration: 'w-24 h-24', title: 'text-lg', description: 'text-sm' },
    md: { container: 'py-12', illustration: 'w-40 h-40', title: 'text-xl', description: 'text-base' },
    lg: { container: 'py-16', illustration: 'w-56 h-56', title: 'text-2xl', description: 'text-lg' },
  };

  const sizes = sizeClasses[size];
  const displayTitle = title || config.defaultTitle;
  const displayDescription = description || config.defaultDescription;
  const displayActions = actions || config.defaultActions;

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${sizes.container} animate-[fadeIn_0.5s_ease-out] ${className}`}
    >
      {/* Illustration */}
      <div className={`${sizes.illustration} mb-6`}>
        <Illustration className="w-full h-full" />
      </div>

      {/* Title */}
      <h3 className={`${sizes.title} font-bold text-white mb-2`}>
        {displayTitle}
      </h3>

      {/* Description */}
      <p className={`${sizes.description} text-slate-400 max-w-md mb-6`}>
        {displayDescription}
      </p>

      {/* Actions */}
      {displayActions.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
          {displayActions.map((action, index) => {
            const Icon = action.icon;
            const variantClasses = {
              primary: 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25',
              secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700',
              ghost: 'text-slate-400 hover:text-white hover:bg-slate-800/50',
            };

            return (
              <button
                key={index}
                onClick={action.onClick}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium
                  transition-all duration-200 transform hover:scale-105
                  ${variantClasses[action.variant || 'secondary']}
                  ${index === 0 && action.variant === 'primary' ? 'text-base' : 'text-sm'}
                `}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {action.label}
                {index === 0 && action.variant === 'primary' && (
                  <ArrowRight className="w-4 h-4 ml-1" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Help link */}
      {helpLink && (
        <button
          onClick={helpLink.onClick}
          className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          {helpLink.label}
        </button>
      )}
    </div>
  );
};

// Preset empty states for common use cases
export const NoGuidesEmptyState: React.FC<{ onUpload?: () => void; onImportExcel?: () => void }> = ({
  onUpload,
  onImportExcel,
}) => (
  <EmptyState
    variant="no-guides"
    actions={[
      { label: 'Cargar Guías', onClick: onUpload || (() => {}), variant: 'primary', icon: Upload },
      { label: 'Importar Excel', onClick: onImportExcel || (() => {}), variant: 'secondary', icon: FileText },
      { label: 'Ver demo', onClick: () => {}, variant: 'ghost', icon: Play },
    ]}
    helpLink={{
      label: '¿Necesitas ayuda? Ver tutorial de 2 min',
      onClick: () => {},
    }}
  />
);

export const NoResultsEmptyState: React.FC<{ onClearFilters?: () => void }> = ({ onClearFilters }) => (
  <EmptyState
    variant="no-results"
    size="sm"
    actions={[
      { label: 'Limpiar filtros', onClick: onClearFilters || (() => {}), variant: 'secondary', icon: RefreshCw },
    ]}
  />
);

export const ErrorEmptyState: React.FC<{ onRetry?: () => void; error?: string }> = ({ onRetry, error }) => (
  <EmptyState
    variant="error"
    description={error || 'Ocurrió un error inesperado. Por favor intenta de nuevo.'}
    actions={[
      { label: 'Reintentar', onClick: onRetry || (() => {}), variant: 'primary', icon: RefreshCw },
    ]}
  />
);

export default EmptyState;
