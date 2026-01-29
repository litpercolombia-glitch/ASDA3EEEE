/**
 * Retry with Exponential Backoff
 *
 * Utility para reintentar operaciones fallidas con backoff exponencial.
 * Útil para llamadas de red, APIs, y operaciones que pueden fallar temporalmente.
 */

export interface RetryOptions {
  /** Número máximo de reintentos (default: 3) */
  maxRetries?: number;
  /** Delay inicial en ms (default: 1000) */
  initialDelay?: number;
  /** Factor de multiplicación del delay (default: 2) */
  backoffFactor?: number;
  /** Delay máximo en ms (default: 30000) */
  maxDelay?: number;
  /** Función para determinar si el error es retryable */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  /** Callback llamado en cada reintento */
  onRetry?: (error: unknown, attempt: number, delay: number) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  backoffFactor: 2,
  maxDelay: 30000,
  shouldRetry: (error: unknown) => {
    // Por defecto, reintentar en errores de red y errores 5xx
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true; // Error de red
    }
    if (error && typeof error === 'object' && 'status' in error) {
      const status = (error as { status: number }).status;
      return status >= 500 || status === 429; // Server error o rate limit
    }
    return true; // Reintentar por defecto
  },
  onRetry: () => {},
};

/**
 * Ejecuta una función con reintentos y backoff exponencial
 *
 * @example
 * const data = await retryWithBackoff(
 *   () => fetch('/api/data').then(r => r.json()),
 *   { maxRetries: 3, initialDelay: 1000 }
 * );
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Si es el último intento, no reintentar
      if (attempt === opts.maxRetries) {
        break;
      }

      // Verificar si debemos reintentar
      if (!opts.shouldRetry(error, attempt)) {
        break;
      }

      // Calcular delay con backoff exponencial
      const delay = Math.min(
        opts.initialDelay * Math.pow(opts.backoffFactor, attempt),
        opts.maxDelay
      );

      // Callback de reintento
      opts.onRetry(error, attempt + 1, delay);

      // Esperar antes del siguiente intento
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Wrapper para fetch con retry automático
 *
 * @example
 * const response = await fetchWithRetry('/api/data', {
 *   method: 'POST',
 *   body: JSON.stringify(data)
 * });
 */
export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  retryOptions?: RetryOptions
): Promise<Response> {
  return retryWithBackoff(
    async () => {
      const response = await fetch(url, init);

      // Considerar 5xx y 429 como errores retryables
      if (response.status >= 500 || response.status === 429) {
        const error = new Error(`HTTP ${response.status}`);
        (error as any).status = response.status;
        (error as any).response = response;
        throw error;
      }

      return response;
    },
    {
      ...retryOptions,
      shouldRetry: (error) => {
        // Errores de red
        if (error instanceof TypeError) return true;
        // Errores HTTP retryables
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as { status: number }).status;
          return status >= 500 || status === 429;
        }
        return false;
      },
    }
  );
}

/**
 * Ejecuta múltiples promesas con retry individual
 * Similar a Promise.allSettled pero con reintentos
 */
export async function retryAllSettled<T>(
  fns: Array<() => Promise<T>>,
  options?: RetryOptions
): Promise<Array<PromiseSettledResult<T>>> {
  return Promise.allSettled(
    fns.map(fn => retryWithBackoff(fn, options))
  );
}

// Helper para sleep
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Exportar por defecto
export default retryWithBackoff;
