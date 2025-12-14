// components/lazy/LazyComponents.tsx
// Lazy Loading Configuration - Code Splitting for better performance
import React, { Suspense, lazy, ComponentType } from 'react';
import { DashboardSkeleton, TableSkeleton, ChartSkeleton, ProfileSkeleton } from '../ui/Skeleton';
import { LoadingOverlay } from '../ui/Skeleton';

// ============================================
// LAZY LOADING WRAPPER
// ============================================
interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const LazyWrapper: React.FC<LazyWrapperProps> = ({
  children,
  fallback = <LoadingOverlay message="Cargando módulo..." />,
}) => {
  return <Suspense fallback={fallback}>{children}</Suspense>;
};

// ============================================
// CUSTOM LAZY WITH RETRY
// ============================================
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 3
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    let lastError: Error | null = null;

    for (let i = 0; i < retries; i++) {
      try {
        return await factory();
      } catch (error) {
        lastError = error as Error;
        // Wait before retry with exponential backoff
        if (i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, i)));
        }
      }
    }

    throw lastError;
  });
}

// ============================================
// PRELOAD FUNCTION
// ============================================
type LazyModule = () => Promise<{ default: ComponentType<any> }>;

const preloadedModules = new Set<LazyModule>();

export function preload(factory: LazyModule): void {
  if (!preloadedModules.has(factory)) {
    preloadedModules.add(factory);
    factory().catch(() => {
      preloadedModules.delete(factory);
    });
  }
}

// ============================================
// LAZY LOADED TAB COMPONENTS
// ============================================

// Dashboard & Home
export const LazyPremiumDashboard = lazyWithRetry(
  () => import('../dashboard/QuickDashboard').then(m => ({ default: m.QuickDashboard }))
);

// Operations Tab
export const LazyOperacionesTab = lazyWithRetry(
  () => import('../tabs/OperacionesUnificadoTab').then(m => ({ default: m.OperacionesUnificadoTab }))
);

// Intelligence Tab
export const LazyInteligenciaIATab = lazyWithRetry(
  () => import('../tabs/InteligenciaIAUnificadoTab').then(m => ({ default: m.InteligenciaIAUnificadoTab }))
);

// Analysis Tab
export const LazyAnalisisTab = lazyWithRetry(
  () => import('../tabs/AnalisisUnificadoTab').then(m => ({ default: m.AnalisisUnificadoTab }))
);

// Processes Tab
export const LazyProcesosTab = lazyWithRetry(
  () => import('../tabs/ProcesosLitperTab').then(m => ({ default: m.default }))
);

// Admin Panel
export const LazyAdminPanel = lazyWithRetry(
  () => import('../Admin/AdminPanelPro').then(m => ({ default: m.AdminPanelPro }))
);

// Legacy Tabs
export const LazySeguimientoTab = lazyWithRetry(
  () => import('../tabs/SeguimientoTab').then(m => ({ default: m.default }))
);

export const LazySemaforoTab = lazyWithRetry(
  () => import('../tabs/SemaforoTabNew').then(m => ({ default: m.default }))
);

export const LazyDemandTab = lazyWithRetry(
  () => import('../tabs/DemandTab').then(m => ({ default: m.default }))
);

export const LazyPrediccionesTab = lazyWithRetry(
  () => import('../tabs/PrediccionesTab').then(m => ({ default: m.default }))
);

export const LazyMLSystemTab = lazyWithRetry(
  () => import('../tabs/MLSystemTab').then(m => ({ default: m.default }))
);

export const LazyAsistenteTab = lazyWithRetry(
  () => import('../tabs/AsistenteIAUnificado').then(m => ({ default: m.AsistenteIAUnificado }))
);

export const LazyGamificationTab = lazyWithRetry(
  () => import('../tabs/GamificationTab').then(m => ({ default: m.default }))
);

export const LazyCiudadAgentesTab = lazyWithRetry(
  () => import('../tabs/CiudadAgentesTab').then(m => ({ default: m.CiudadAgentesTab }))
);

export const LazyInteligenciaLogisticaTab = lazyWithRetry(
  () => import('../tabs/InteligenciaLogisticaTab').then(m => ({ default: m.InteligenciaLogisticaTab }))
);

// ============================================
// LAZY COMPONENT WRAPPERS WITH SKELETONS
// ============================================

interface LazyTabWrapperProps {
  children: React.ReactNode;
  type?: 'dashboard' | 'table' | 'chart' | 'profile' | 'default';
}

export const LazyTabWrapper: React.FC<LazyTabWrapperProps> = ({ children, type = 'default' }) => {
  const getFallback = () => {
    switch (type) {
      case 'dashboard':
        return <DashboardSkeleton />;
      case 'table':
        return <TableSkeleton rows={10} columns={6} />;
      case 'chart':
        return <ChartSkeleton type="bar" />;
      case 'profile':
        return <ProfileSkeleton />;
      default:
        return (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-slate-200 dark:border-navy-700 border-t-accent-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">Cargando...</p>
            </div>
          </div>
        );
    }
  };

  return <Suspense fallback={getFallback()}>{children}</Suspense>;
};

// ============================================
// PRELOAD UTILITIES
// ============================================

// Preload modules on hover (for navigation)
export const preloadModules = {
  operaciones: () => preload(() => import('../tabs/OperacionesUnificadoTab')),
  inteligenciaIA: () => preload(() => import('../tabs/InteligenciaIAUnificadoTab')),
  analisis: () => preload(() => import('../tabs/AnalisisUnificadoTab')),
  procesos: () => preload(() => import('../tabs/ProcesosLitperTab')),
  admin: () => preload(() => import('../Admin/AdminPanelPro')),
  seguimiento: () => preload(() => import('../tabs/SeguimientoTab')),
  gamification: () => preload(() => import('../tabs/GamificationTab')),
  ml: () => preload(() => import('../tabs/MLSystemTab')),
};

// Preload on idle
export const preloadOnIdle = (): void => {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      // Preload most common modules
      preloadModules.operaciones();
      preloadModules.analisis();
    });
  }
};

// ============================================
// ERROR BOUNDARY FOR LAZY COMPONENTS
// ============================================
interface LazyErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  LazyErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): LazyErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
              Error al cargar el módulo
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-4">
              {this.state.error?.message || 'Ocurrió un error inesperado'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors"
            >
              Recargar página
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default LazyWrapper;
