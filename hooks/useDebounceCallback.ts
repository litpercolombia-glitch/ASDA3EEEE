/**
 * Debounce Hooks
 *
 * Hooks para debouncing de valores y callbacks.
 * Útil para búsquedas, filtros y otras operaciones frecuentes.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * Hook para debounce de un valor
 *
 * @example
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 300);
 *
 * useEffect(() => {
 *   // Se ejecuta 300ms después del último cambio
 *   fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook para debounce de un callback
 *
 * @example
 * const handleSearch = useDebouncedCallback(
 *   (query: string) => fetchResults(query),
 *   300
 * );
 *
 * <input onChange={(e) => handleSearch(e.target.value)} />
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const callbackRef = useRef(callback);

  // Mantener referencia actualizada del callback
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );
}

/**
 * Hook para throttle de un callback
 *
 * @example
 * const handleScroll = useThrottledCallback(
 *   () => console.log('Scrolling...'),
 *   100
 * );
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const lastCall = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCall.current;

      if (timeSinceLastCall >= delay) {
        lastCall.current = now;
        callbackRef.current(...args);
      } else {
        // Programar llamada al final del período
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          lastCall.current = Date.now();
          callbackRef.current(...args);
        }, delay - timeSinceLastCall);
      }
    },
    [delay]
  );
}

/**
 * Hook para búsqueda con debounce
 *
 * @example
 * const { query, setQuery, debouncedQuery, isSearching } = useSearchDebounce();
 */
export function useSearchDebounce(initialValue = '', delay = 300) {
  const [query, setQuery] = useState(initialValue);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(query, delay);

  // Track si hay un debounce pendiente
  useEffect(() => {
    if (query !== debouncedQuery) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  }, [query, debouncedQuery]);

  const clear = useCallback(() => {
    setQuery('');
  }, []);

  return {
    query,
    setQuery,
    debouncedQuery,
    isSearching,
    clear,
  };
}

/**
 * Hook para input controlado con debounce
 *
 * @example
 * const { value, onChange, debouncedValue } = useDebouncedInput('', 300);
 * <input value={value} onChange={onChange} />
 */
export function useDebouncedInput(initialValue = '', delay = 300) {
  const [value, setValue] = useState(initialValue);
  const debouncedValue = useDebounce(value, delay);

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValue(e.target.value);
    },
    []
  );

  const reset = useCallback(() => {
    setValue(initialValue);
  }, [initialValue]);

  return {
    value,
    setValue,
    onChange,
    debouncedValue,
    reset,
  };
}

export default useDebounce;
