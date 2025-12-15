/**
 * ERROR STATE COMPONENT
 */

import React from 'react';
import { AlertTriangle, RefreshCw, XCircle } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: Error | string;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: 'inline' | 'card' | 'fullscreen';
  className?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Ocurrio un error',
  message,
  error,
  onRetry,
  onDismiss,
  variant = 'card',
  className = '',
}) => {
  const errorMessage = message || (error instanceof Error ? error.message : error) || 'Error desconocido';

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 text-red-400 ${className}`}>
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm">{errorMessage}</span>
        {onRetry && (
          <button onClick={onRetry} className="text-red-300 hover:text-red-200 underline text-sm">
            Reintentar
          </button>
        )}
      </div>
    );
  }

  if (variant === 'fullscreen') {
    return (
      <div className="fixed inset-0 bg-slate-900 z-50 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
          <p className="text-slate-400 mb-8">{errorMessage}</p>
          <div className="flex gap-4 justify-center">
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reintentar
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cerrar
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-red-500/10 border border-red-500/30 rounded-xl p-6 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="p-2 bg-red-500/20 rounded-lg">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-400 mb-2">{title}</h3>
          <p className="text-sm text-slate-400 mb-4">{errorMessage}</p>
          <div className="flex gap-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Reintentar
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm"
              >
                Cerrar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorState;
