/**
 * Global Loading Overlay
 *
 * Componente de loading global que se muestra durante operaciones largas.
 * Incluye spinner animado, mensaje personalizable y progress bar opcional.
 */

import React from 'react';
import { Loader2, Package } from 'lucide-react';
import { create } from 'zustand';

// ============================================
// STORE DE LOADING GLOBAL
// ============================================

interface LoadingState {
  isLoading: boolean;
  message: string;
  progress: number | null;
  showLogo: boolean;

  // Actions
  startLoading: (message?: string, showLogo?: boolean) => void;
  stopLoading: () => void;
  setProgress: (progress: number) => void;
  setMessage: (message: string) => void;
}

export const useLoadingStore = create<LoadingState>((set) => ({
  isLoading: false,
  message: 'Cargando...',
  progress: null,
  showLogo: true,

  startLoading: (message = 'Cargando...', showLogo = true) =>
    set({ isLoading: true, message, showLogo, progress: null }),

  stopLoading: () =>
    set({ isLoading: false, message: 'Cargando...', progress: null }),

  setProgress: (progress) => set({ progress }),

  setMessage: (message) => set({ message }),
}));

// ============================================
// FUNCIONES HELPER
// ============================================

/**
 * Muestra loading global
 * @example showLoading('Guardando cambios...')
 */
export const showLoading = (message?: string, showLogo?: boolean) => {
  useLoadingStore.getState().startLoading(message, showLogo);
};

/**
 * Oculta loading global
 */
export const hideLoading = () => {
  useLoadingStore.getState().stopLoading();
};

/**
 * Ejecuta una función con loading automático
 * @example await withLoading(() => fetchData(), 'Cargando datos...')
 */
export const withLoading = async <T,>(
  fn: () => Promise<T>,
  message?: string
): Promise<T> => {
  showLoading(message);
  try {
    return await fn();
  } finally {
    hideLoading();
  }
};

// ============================================
// COMPONENTE
// ============================================

export const GlobalLoadingOverlay: React.FC = () => {
  const { isLoading, message, progress, showLogo } = useLoadingStore();

  if (!isLoading) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Cargando"
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 min-w-[280px] animate-in fade-in zoom-in duration-200">
        {/* Logo animado */}
        {showLogo && (
          <div className="relative">
            <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl animate-pulse" />
            <div className="relative p-4 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-lg">
              <Package className="w-8 h-8 text-white animate-bounce" />
            </div>
          </div>
        )}

        {/* Spinner */}
        <div className="relative">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
          {progress !== null && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-amber-600">
                {Math.round(progress)}%
              </span>
            </div>
          )}
        </div>

        {/* Mensaje */}
        <p className="text-slate-700 dark:text-slate-200 font-medium text-center">
          {message}
        </p>

        {/* Progress bar */}
        {progress !== null && (
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Puntos animados */}
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default GlobalLoadingOverlay;
