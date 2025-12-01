/**
 * Centralized error handling utilities
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class APIError extends AppError {
  constructor(message: string, statusCode: number, details?: unknown) {
    super(message, 'API_ERROR', statusCode, details);
    this.name = 'APIError';
  }
}

export class StorageError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'STORAGE_ERROR', 500, details);
    this.name = 'StorageError';
  }
}

/**
 * Error handler that provides user-friendly messages
 */
export function handleError(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('fetch')) {
      return 'Error de conexión. Verifica tu conexión a internet.';
    }

    // Quota exceeded errors
    if (error.name === 'QuotaExceededError') {
      return 'Almacenamiento lleno. Libera espacio en tu navegador.';
    }

    return error.message;
  }

  return 'Ha ocurrido un error inesperado. Intenta de nuevo.';
}

/**
 * Log error for debugging (only in development)
 */
export function logError(error: unknown, context?: string): void {
  if (import.meta.env.DEV) {
    console.error(`[${context || 'Error'}]:`, error);
  }
}

/**
 * Safe async operation wrapper
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  errorMessage?: string
): Promise<[T | null, Error | null]> {
  try {
    const result = await operation();
    return [result, null];
  } catch (error) {
    const err = error instanceof Error ? error : new Error(errorMessage || 'Unknown error');
    logError(err);
    return [null, err];
  }
}

/**
 * Retry operation with exponential backoff
 */
export async function retry<T>(
  operation: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, attempt - 1)));
      }
    }
  }

  throw lastError!;
}
