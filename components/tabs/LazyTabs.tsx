/**
 * LazyTabs - Lazy Loading de Tabs para Performance
 *
 * Mejora el tiempo de carga inicial dividiendo el código en chunks.
 * Cada tab se carga solo cuando el usuario navega a él.
 *
 * ANTES: Todos los 167 componentes se cargan al inicio
 * AHORA: Solo se carga el tab activo + prefetch de tabs vecinos
 */

import React, { Suspense, ComponentType, lazy } from 'react';
import { Loader2 } from 'lucide-react';

// ============================================
// LOADING FALLBACK
// ============================================

interface LoadingFallbackProps {
  message?: string;
}

export const TabLoadingFallback: React.FC<LoadingFallbackProps> = ({
  message = 'Cargando módulo...',
}) => (
  <div className="flex flex-col items-center justify-center h-64 gap-4">
    <div className="relative">
      <div className="w-16 h-16 rounded-full border-4 border-slate-200 dark:border-navy-700" />
      <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-t-indigo-600 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
    </div>
    <p className="text-slate-500 dark:text-slate-400 text-sm">{message}</p>
  </div>
);

// ============================================
// ERROR BOUNDARY
// ============================================

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => (
  <div className="flex flex-col items-center justify-center h-64 gap-4 p-6">
    <div className="text-6xl">⚠️</div>
    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
      Error al cargar el módulo
    </h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-md">
      {error.message}
    </p>
    <button
      onClick={resetError}
      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
    >
      Reintentar
    </button>
  </div>
);

// ============================================
// ERROR BOUNDARY COMPONENT
// ============================================

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class TabErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <ErrorFallback error={this.state.error} resetError={this.resetError} />
      );
    }
    return this.props.children;
  }
}

// ============================================
// LAZY TAB WRAPPER
// ============================================

interface LazyTabProps {
  children: React.ReactNode;
  loadingMessage?: string;
}

export const LazyTab: React.FC<LazyTabProps> = ({ children, loadingMessage }) => (
  <TabErrorBoundary>
    <Suspense fallback={<TabLoadingFallback message={loadingMessage} />}>
      {children}
    </Suspense>
  </TabErrorBoundary>
);

// ============================================
// LAZY IMPORTS - Cada tab en su propio chunk
// ============================================

// Core Tabs
export const LazySeguimientoTab = lazy(() =>
  import('./SeguimientoTab').then((m) => ({ default: m.SeguimientoTab }))
);

export const LazySemaforoTab = lazy(() =>
  import('./SemaforoTabNew').then((m) => ({ default: m.SemaforoTabNew }))
);

export const LazyPrediccionesTab = lazy(() =>
  import('./PrediccionesTab').then((m) => ({ default: m.PrediccionesTab }))
);

export const LazyDemandTab = lazy(() =>
  import('./DemandTab').then((m) => ({ default: m.DemandTab }))
);

export const LazyMLSystemTab = lazy(() =>
  import('./MLSystemTab').then((m) => ({ default: m.MLSystemTab }))
);

// Business Tabs
export const LazyCentroNegocioTab = lazy(() =>
  import('./CentroNegocioTab').then((m) => ({ default: m.CentroNegocioTab }))
);

export const LazyProcesosLitperTab = lazy(() =>
  import('./ProcesosLitperTab').then((m) => ({ default: m.ProcesosLitperTab }))
);

export const LazyGamificationTab = lazy(() =>
  import('./GamificationTab').then((m) => ({ default: m.GamificationTab }))
);

// Intelligence Tabs
export const LazyInteligenciaLogisticaTab = lazy(() =>
  import('./InteligenciaLogisticaTab').then((m) => ({ default: m.InteligenciaLogisticaTab }))
);

export const LazyAsistenteIAUnificado = lazy(() =>
  import('./AsistenteIAUnificado').then((m) => ({ default: m.AsistenteIAUnificado }))
);

export const LazyCiudadAgentesTab = lazy(() =>
  import('./CiudadAgentesTab').then((m) => ({ default: m.CiudadAgentesTab }))
);

// Unified Tabs (New Architecture)
export const LazyOperacionesUnificadoTab = lazy(() =>
  import('./OperacionesUnificadoTab').then((m) => ({ default: m.OperacionesUnificadoTab }))
);

export const LazyInteligenciaIAUnificadoTab = lazy(() =>
  import('./InteligenciaIAUnificadoTab').then((m) => ({ default: m.InteligenciaIAUnificadoTab }))
);

export const LazyAnalisisUnificadoTab = lazy(() =>
  import('./AnalisisUnificadoTab').then((m) => ({ default: m.AnalisisUnificadoTab }))
);

// Google Sheets Integration
export const LazyGoogleSheetsTab = lazy(() =>
  import('./GoogleSheetsTab').then((m) => ({ default: m.default }))
);

// ============================================
// PREFETCH UTILITY
// ============================================

const tabImportMap: Record<string, () => Promise<unknown>> = {
  seguimiento: () => import('./SeguimientoTab'),
  semaforo: () => import('./SemaforoTabNew'),
  predicciones: () => import('./PrediccionesTab'),
  demanda: () => import('./DemandTab'),
  ml: () => import('./MLSystemTab'),
  negocio: () => import('./CentroNegocioTab'),
  'procesos-litper': () => import('./ProcesosLitperTab'),
  gamificacion: () => import('./GamificationTab'),
  'inteligencia-logistica': () => import('./InteligenciaLogisticaTab'),
  asistente: () => import('./AsistenteIAUnificado'),
  'ciudad-agentes': () => import('./CiudadAgentesTab'),
  operaciones: () => import('./OperacionesUnificadoTab'),
  'inteligencia-ia': () => import('./InteligenciaIAUnificadoTab'),
  analisis: () => import('./AnalisisUnificadoTab'),
  'google-sheets': () => import('./GoogleSheetsTab'),
};

/**
 * Prefetch a tab module in the background
 * Call this on hover or when you anticipate the user will navigate
 */
export function prefetchTab(tabId: string): void {
  const importer = tabImportMap[tabId];
  if (importer) {
    importer().catch(() => {
      // Silent fail - prefetch is optional optimization
    });
  }
}

/**
 * Prefetch multiple tabs
 */
export function prefetchTabs(tabIds: string[]): void {
  tabIds.forEach(prefetchTab);
}

/**
 * Prefetch adjacent tabs based on current tab
 * Useful for prefetching likely next navigations
 */
export function prefetchAdjacentTabs(currentTab: string): void {
  const tabOrder = [
    'home',
    'operaciones',
    'inteligencia-ia',
    'negocio',
    'admin',
    'seguimiento',
    'semaforo',
    'predicciones',
    'demanda',
    'ml',
  ];

  const currentIndex = tabOrder.indexOf(currentTab);
  if (currentIndex === -1) return;

  const adjacentTabs = [
    tabOrder[currentIndex - 1],
    tabOrder[currentIndex + 1],
  ].filter(Boolean);

  prefetchTabs(adjacentTabs as string[]);
}

// ============================================
// TAB RENDERER WITH LAZY LOADING
// ============================================

interface TabRendererProps {
  tabId: string;
  // Pass through common props to tabs
  shipments?: unknown[];
  [key: string]: unknown;
}

/**
 * Renders the appropriate lazy-loaded tab based on tabId
 */
export const LazyTabRenderer: React.FC<TabRendererProps> = ({ tabId, ...props }) => {
  const renderTab = () => {
    switch (tabId) {
      case 'seguimiento':
        return <LazySeguimientoTab {...props} />;
      case 'semaforo':
        return <LazySemaforoTab {...props} />;
      case 'predicciones':
        return <LazyPrediccionesTab {...props} />;
      case 'demanda':
        return <LazyDemandTab {...props} />;
      case 'ml':
        return <LazyMLSystemTab {...props} />;
      case 'negocio':
        return <LazyCentroNegocioTab {...props} />;
      case 'procesos-litper':
        return <LazyProcesosLitperTab {...props} />;
      case 'gamificacion':
        return <LazyGamificationTab {...props} />;
      case 'inteligencia-logistica':
        return <LazyInteligenciaLogisticaTab {...props} />;
      case 'asistente':
        return <LazyAsistenteIAUnificado {...props} />;
      case 'ciudad-agentes':
        return <LazyCiudadAgentesTab {...props} />;
      case 'operaciones':
        return <LazyOperacionesUnificadoTab {...props} />;
      case 'inteligencia-ia':
        return <LazyInteligenciaIAUnificadoTab {...props} />;
      case 'analisis':
        return <LazyAnalisisUnificadoTab {...props} />;
      case 'google-sheets':
        return <LazyGoogleSheetsTab {...props} />;
      default:
        return null;
    }
  };

  return (
    <LazyTab loadingMessage={`Cargando ${tabId}...`}>
      {renderTab()}
    </LazyTab>
  );
};

export default LazyTabRenderer;
