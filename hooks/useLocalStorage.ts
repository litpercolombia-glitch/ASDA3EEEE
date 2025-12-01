/**
 * Custom hook for localStorage with expiry
 */

import { useState, useEffect, useCallback } from 'react';
import { logError } from '../utils/errorHandler';

interface StorageData<T> {
  value: T;
  timestamp: number;
  expiryHours: number;
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  expiryHours = 24
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return initialValue;

      const data: StorageData<T> = JSON.parse(item);
      const now = Date.now();
      const expiryTime = data.timestamp + data.expiryHours * 60 * 60 * 1000;

      if (now > expiryTime) {
        window.localStorage.removeItem(key);
        return initialValue;
      }

      return data.value;
    } catch (error) {
      logError(error, `useLocalStorage.load.${key}`);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;

        setStoredValue(valueToStore);

        const data: StorageData<T> = {
          value: valueToStore,
          timestamp: Date.now(),
          expiryHours,
        };

        window.localStorage.setItem(key, JSON.stringify(data));
      } catch (error) {
        logError(error, `useLocalStorage.save.${key}`);
      }
    },
    [key, expiryHours, storedValue]
  );

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      logError(error, `useLocalStorage.remove.${key}`);
    }
  }, [key, initialValue]);

  // Check for expiry on mount and periodically
  useEffect(() => {
    const checkExpiry = () => {
      try {
        const item = window.localStorage.getItem(key);
        if (!item) return;

        const data: StorageData<T> = JSON.parse(item);
        const now = Date.now();
        const expiryTime = data.timestamp + data.expiryHours * 60 * 60 * 1000;

        if (now > expiryTime) {
          removeValue();
        }
      } catch (error) {
        logError(error, `useLocalStorage.checkExpiry.${key}`);
      }
    };

    // Check immediately
    checkExpiry();

    // Check every hour
    const interval = setInterval(checkExpiry, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [key, removeValue]);

  return [storedValue, setValue, removeValue];
}
