/**
 * Section Error Boundary
 *
 * Error Boundary especializado para secciones/tabs de la aplicación.
 * No bloquea toda la app, solo la sección afectada.
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface SectionErrorBoundaryProps {
  children: ReactNode;
  /** Nombre de la sección para logs */
  sectionName?: string;
  /** Fallback personalizado */
  fallback?: ReactNode;
  /** Callback cuando ocurre un error */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Mostrar versión compacta */
  compact?: boolean;
}

interface SectionErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

export class SectionErrorBoundary extends Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  state: SectionErrorBoundaryState = {
    hasError: false,
    error: null,
    errorId: null,
  };

  static getDerivedStateFromError(error: Error): Partial<SectionErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `err_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { sectionName, onError } = this.props;

    // Log del error con contexto
    console.error(
      `[SectionErrorBoundary] Error en sección "${sectionName || 'unknown'}":`,
      error,
      errorInfo
    );

    // Callback personalizado
    onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
    });
  };

  render() {
    const { hasError, error, errorId } = this.state;
    const { children, fallback, sectionName, compact } = this.props;

    if (!hasError) {
      return children;
    }

    // Fallback personalizado
    if (fallback) {
      return fallback;
    }

    // Versión compacta para espacios reducidos
    if (compact) {
      return (
        <div className="flex items-center justify-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-sm text-red-700 dark:text-red-300">
            Error en {sectionName || 'esta sección'}
          </span>
          <button
            onClick={this.handleRetry}
            className="ml-3 p-1 hover:bg-red-100 dark:hover:bg-red-800 rounded"
            title="Reintentar"
          >
            <RefreshCw className="w-4 h-4 text-red-600" />
          </button>
        </div>
      );
    }

    // Versión completa
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 min-h-[200px]">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
            <AlertTriangle className="w-6 h-6 text-red-500" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Error en {sectionName || 'esta sección'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Algo salió mal al cargar el contenido
            </p>
          </div>
        </div>

        {error && (
          <details className="w-full max-w-md mb-4">
            <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
              Ver detalles del error
            </summary>
            <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono overflow-auto max-h-32">
              <p className="text-red-600 dark:text-red-400">{error.message}</p>
              {errorId && (
                <p className="mt-1 text-gray-500">ID: {errorId}</p>
              )}
            </div>
          </details>
        )}

        <div className="flex gap-3">
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors text-sm"
          >
            Recargar página
          </button>
        </div>
      </div>
    );
  }
}

export default SectionErrorBoundary;
