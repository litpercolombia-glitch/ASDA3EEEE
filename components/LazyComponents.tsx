// components/LazyComponents.tsx
// Componentes con carga diferida (lazy loading) para mejorar performance

import React, { Suspense, lazy, ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

// ==================== LOADING FALLBACKS ====================

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; text?: string }> = ({
  size = 'md',
  text,
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  };

  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-purple-500`} />
      {text && <p className="text-sm text-slate-500 dark:text-slate-400">{text}</p>}
    </div>
  );
};

export const LoadingCard: React.FC = () => (
  <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 p-6 animate-pulse">
    <div className="h-6 bg-slate-200 dark:bg-navy-700 rounded w-1/3 mb-4" />
    <div className="space-y-3">
      <div className="h-4 bg-slate-200 dark:bg-navy-700 rounded w-full" />
      <div className="h-4 bg-slate-200 dark:bg-navy-700 rounded w-5/6" />
      <div className="h-4 bg-slate-200 dark:bg-navy-700 rounded w-4/6" />
    </div>
  </div>
);

export const LoadingDashboard: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    {/* Header skeleton */}
    <div className="bg-slate-200 dark:bg-navy-800 rounded-2xl h-32" />

    {/* KPI cards skeleton */}
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-slate-200 dark:bg-navy-800 rounded-xl h-24" />
      ))}
    </div>

    {/* Charts skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-slate-200 dark:bg-navy-800 rounded-2xl h-80" />
      <div className="bg-slate-200 dark:bg-navy-800 rounded-2xl h-80" />
    </div>
  </div>
);

// ==================== HOC PARA LAZY LOADING ====================

/**
 * Higher-Order Component para envolver componentes lazy con Suspense
 */
export function withLazy<P extends object>(
  LazyComponent: React.LazyExoticComponent<ComponentType<P>>,
  FallbackComponent: React.FC = LoadingSpinner
): React.FC<P> {
  const WrappedComponent: React.FC<P> = (props) => (
    <Suspense fallback={<FallbackComponent />}>
      <LazyComponent {...props} />
    </Suspense>
  );

  WrappedComponent.displayName = `Lazy(${LazyComponent.displayName || 'Component'})`;

  return WrappedComponent;
}

// ==================== LAZY IMPORTS ====================

// Dashboard Components
const AdvancedDashboardLazy = lazy(() =>
  import('./dashboard/AdvancedDashboard').then(module => ({
    default: module.AdvancedDashboard,
  }))
);

// Charts
const DeliveryTrendChartLazy = lazy(() =>
  import('./dashboard/charts/DeliveryTrendChart').then(module => ({
    default: module.DeliveryTrendChart,
  }))
);

const CarrierPerformanceChartLazy = lazy(() =>
  import('./dashboard/charts/CarrierPerformanceChart').then(module => ({
    default: module.CarrierPerformanceChart,
  }))
);

// Heavy Components (ejemplo - ajustar según componentes reales)
const PredictiveReportLazy = lazy(() =>
  import('./PredictiveReport').catch(() => ({
    default: () => <div>Componente no disponible</div>,
  }))
);

// ==================== COMPONENTES LAZY EXPORTADOS ====================

export const LazyAdvancedDashboard = withLazy(AdvancedDashboardLazy, LoadingDashboard);
export const LazyDeliveryTrendChart = withLazy(DeliveryTrendChartLazy, LoadingCard);
export const LazyCarrierPerformanceChart = withLazy(CarrierPerformanceChartLazy, LoadingCard);
export const LazyPredictiveReport = withLazy(PredictiveReportLazy);

// ==================== PRELOAD HELPERS ====================

/**
 * Precarga un componente lazy para mejorar la experiencia de usuario
 */
export const preloadComponent = (
  importFn: () => Promise<{ default: ComponentType<unknown> }>
): void => {
  importFn().catch(() => {
    // Silenciar errores de precarga
  });
};

/**
 * Precarga múltiples componentes
 */
export const preloadComponents = (
  components: Array<() => Promise<{ default: ComponentType<unknown> }>>
): void => {
  components.forEach(preloadComponent);
};

// ==================== LAZY ROUTE WRAPPER ====================

interface LazyRouteProps {
  component: React.LazyExoticComponent<ComponentType<unknown>>;
  fallback?: React.ReactNode;
}

export const LazyRoute: React.FC<LazyRouteProps> = ({
  component: Component,
  fallback = <LoadingSpinner text="Cargando..." />,
}) => (
  <Suspense fallback={fallback}>
    <Component />
  </Suspense>
);

// ==================== EXPORT DEFAULT ====================

export default {
  LoadingSpinner,
  LoadingCard,
  LoadingDashboard,
  withLazy,
  LazyAdvancedDashboard,
  LazyDeliveryTrendChart,
  LazyCarrierPerformanceChart,
  LazyPredictiveReport,
  preloadComponent,
  preloadComponents,
  LazyRoute,
};
