/**
 * Confirm Dialog
 *
 * Diálogo de confirmación reutilizable para acciones destructivas.
 * Usa un store global para poder llamarlo desde cualquier parte.
 */

import React from 'react';
import { create } from 'zustand';
import { AlertTriangle, Trash2, X, Check, Loader2 } from 'lucide-react';

// ============================================
// TIPOS
// ============================================

type ConfirmVariant = 'danger' | 'warning' | 'info';

interface ConfirmConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  icon?: React.ReactNode;
  requireConfirmText?: string; // Texto que el usuario debe escribir para confirmar
}

interface ConfirmState {
  isOpen: boolean;
  config: ConfirmConfig | null;
  isLoading: boolean;
  inputValue: string;
  resolve: ((value: boolean) => void) | null;

  // Actions
  confirm: (config: ConfirmConfig) => Promise<boolean>;
  close: (result: boolean) => void;
  setInputValue: (value: string) => void;
  setLoading: (loading: boolean) => void;
}

// ============================================
// STORE
// ============================================

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  isOpen: false,
  config: null,
  isLoading: false,
  inputValue: '',
  resolve: null,

  confirm: (config) => {
    return new Promise<boolean>((resolve) => {
      set({
        isOpen: true,
        config,
        resolve,
        inputValue: '',
        isLoading: false,
      });
    });
  },

  close: (result) => {
    const { resolve } = get();
    if (resolve) {
      resolve(result);
    }
    set({
      isOpen: false,
      config: null,
      resolve: null,
      inputValue: '',
      isLoading: false,
    });
  },

  setInputValue: (value) => set({ inputValue: value }),
  setLoading: (loading) => set({ isLoading: loading }),
}));

// ============================================
// FUNCIÓN HELPER
// ============================================

/**
 * Muestra diálogo de confirmación
 *
 * @example
 * const confirmed = await confirm({
 *   title: '¿Eliminar guía?',
 *   message: 'Esta acción no se puede deshacer.',
 *   variant: 'danger',
 * });
 * if (confirmed) {
 *   // Ejecutar acción
 * }
 */
export const confirm = (config: ConfirmConfig): Promise<boolean> => {
  return useConfirmStore.getState().confirm(config);
};

/**
 * Confirmar eliminación (shortcut)
 */
export const confirmDelete = (itemName: string): Promise<boolean> => {
  return confirm({
    title: `¿Eliminar ${itemName}?`,
    message: 'Esta acción no se puede deshacer. El elemento será eliminado permanentemente.',
    confirmText: 'Eliminar',
    variant: 'danger',
    icon: <Trash2 className="w-6 h-6" />,
  });
};

/**
 * Confirmar acción peligrosa con texto de confirmación
 */
export const confirmDangerous = (
  title: string,
  message: string,
  confirmText: string
): Promise<boolean> => {
  return confirm({
    title,
    message,
    confirmText: 'Confirmar',
    variant: 'danger',
    requireConfirmText: confirmText,
  });
};

// ============================================
// COMPONENTE
// ============================================

const variantStyles = {
  danger: {
    icon: 'bg-red-100 dark:bg-red-900/30 text-red-600',
    button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
  },
  warning: {
    icon: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
    button: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
  },
  info: {
    icon: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
    button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
  },
};

export const ConfirmDialog: React.FC = () => {
  const { isOpen, config, isLoading, inputValue, close, setInputValue } =
    useConfirmStore();

  if (!isOpen || !config) return null;

  const variant = config.variant || 'danger';
  const styles = variantStyles[variant];

  const canConfirm = config.requireConfirmText
    ? inputValue === config.requireConfirmText
    : true;

  const handleConfirm = () => {
    if (!canConfirm) return;
    close(true);
  };

  const handleCancel = () => {
    close(false);
  };

  // Cerrar con Escape
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        handleCancel();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isLoading]);

  return (
    <div
      className="fixed inset-0 z-[99998] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          handleCancel();
        }
      }}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
      >
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={`p-3 rounded-full ${styles.icon}`}>
              {config.icon || <AlertTriangle className="w-6 h-6" />}
            </div>

            {/* Content */}
            <div className="flex-1">
              <h3
                id="confirm-title"
                className="text-lg font-semibold text-slate-900 dark:text-white"
              >
                {config.title}
              </h3>
              <p
                id="confirm-message"
                className="mt-2 text-sm text-slate-600 dark:text-slate-300"
              >
                {config.message}
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Input de confirmación */}
          {config.requireConfirmText && (
            <div className="mt-4">
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">
                Escribe <span className="font-mono font-bold text-red-600">{config.requireConfirmText}</span> para confirmar:
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={config.requireConfirmText}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 pt-2 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50"
          >
            {config.cancelText || 'Cancelar'}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || !canConfirm}
            className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${styles.button}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {config.confirmText || 'Confirmar'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
