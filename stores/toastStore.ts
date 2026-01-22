/**
 * Toast Store Global
 *
 * Store de Zustand para manejar toast notifications globalmente.
 * Permite mostrar toasts desde cualquier parte de la aplicación,
 * incluyendo servicios y utilidades fuera de componentes React.
 */

import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
  createdAt: Date;
}

interface ToastState {
  toasts: Toast[];
  maxToasts: number;

  // Actions
  addToast: (type: ToastType, message: string, duration?: number) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;

  // Convenience methods
  success: (message: string, duration?: number) => string;
  error: (message: string, duration?: number) => string;
  warning: (message: string, duration?: number) => string;
  info: (message: string, duration?: number) => string;
}

const generateId = () => `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  maxToasts: 5,

  addToast: (type, message, duration = 4000) => {
    const id = generateId();
    const toast: Toast = {
      id,
      type,
      message,
      duration,
      createdAt: new Date(),
    };

    set((state) => {
      // Limitar número de toasts
      const newToasts = [...state.toasts, toast];
      if (newToasts.length > state.maxToasts) {
        newToasts.shift(); // Remover el más antiguo
      }
      return { toasts: newToasts };
    });

    // Auto-remove después de duration
    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearAll: () => {
    set({ toasts: [] });
  },

  // Convenience methods
  success: (message, duration) => get().addToast('success', message, duration),
  error: (message, duration) => get().addToast('error', message, duration ?? 6000), // Errores duran más
  warning: (message, duration) => get().addToast('warning', message, duration ?? 5000),
  info: (message, duration) => get().addToast('info', message, duration),
}));

// ============================================
// FUNCIONES GLOBALES PARA USO FUERA DE REACT
// ============================================

/**
 * Muestra un toast de éxito
 * @example toast.success('Guardado correctamente')
 */
export const toast = {
  success: (message: string, duration?: number) =>
    useToastStore.getState().success(message, duration),

  error: (message: string, duration?: number) =>
    useToastStore.getState().error(message, duration),

  warning: (message: string, duration?: number) =>
    useToastStore.getState().warning(message, duration),

  info: (message: string, duration?: number) =>
    useToastStore.getState().info(message, duration),

  /** Muestra un toast basado en el resultado de una operación */
  fromResult: <T>(
    result: { success: boolean; message?: string; error?: string },
    options?: { successMessage?: string; errorMessage?: string }
  ) => {
    if (result.success) {
      toast.success(options?.successMessage || result.message || 'Operación exitosa');
    } else {
      toast.error(options?.errorMessage || result.error || result.message || 'Error en la operación');
    }
  },

  /** Wrapper para promesas - muestra loading, success o error */
  promise: async <T>(
    promise: Promise<T>,
    messages: {
      loading?: string;
      success?: string | ((data: T) => string);
      error?: string | ((error: unknown) => string);
    }
  ): Promise<T> => {
    let loadingId: string | undefined;

    if (messages.loading) {
      loadingId = toast.info(messages.loading, 0); // Sin auto-dismiss
    }

    try {
      const result = await promise;

      if (loadingId) {
        useToastStore.getState().removeToast(loadingId);
      }

      const successMsg = typeof messages.success === 'function'
        ? messages.success(result)
        : messages.success;

      if (successMsg) {
        toast.success(successMsg);
      }

      return result;
    } catch (error) {
      if (loadingId) {
        useToastStore.getState().removeToast(loadingId);
      }

      const errorMsg = typeof messages.error === 'function'
        ? messages.error(error)
        : messages.error || (error instanceof Error ? error.message : 'Error desconocido');

      toast.error(errorMsg);
      throw error;
    }
  },
};

export default useToastStore;
