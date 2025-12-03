// ============================================
// TAB-SPECIFIC STORAGE UTILITIES
// Each tab has independent localStorage
// ============================================

import { STORAGE_KEYS } from '../types/logistics';

interface StorageItem<T> {
  data: T;
  timestamp: string;
  version: string;
}

const STORAGE_VERSION = '1.0.0';

/**
 * Save data to localStorage for a specific tab
 */
export function saveTabData<T>(key: string, data: T): void {
  try {
    const item: StorageItem<T> = {
      data,
      timestamp: new Date().toISOString(),
      version: STORAGE_VERSION,
    };
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.error(`Error saving to localStorage [${key}]:`, error);
  }
}

/**
 * Load data from localStorage for a specific tab
 */
export function loadTabData<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;

    const item: StorageItem<T> = JSON.parse(stored);

    // Check version compatibility
    if (item.version !== STORAGE_VERSION) {
      console.warn(`Storage version mismatch for ${key}, using defaults`);
      return defaultValue;
    }

    return item.data;
  } catch (error) {
    console.error(`Error loading from localStorage [${key}]:`, error);
    return defaultValue;
  }
}

/**
 * Clear data for a specific tab
 */
export function clearTabData(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error clearing localStorage [${key}]:`, error);
  }
}

/**
 * Get storage info (size, timestamp)
 */
export function getStorageInfo(key: string): { size: number; timestamp: Date | null } | null {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const item = JSON.parse(stored);
    return {
      size: new Blob([stored]).size,
      timestamp: item.timestamp ? new Date(item.timestamp) : null,
    };
  } catch {
    return null;
  }
}

/**
 * Clear all Litper storage
 */
export function clearAllLitperStorage(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    clearTabData(key);
  });
}

/**
 * Export all storage data
 */
export function exportAllStorage(): Record<string, any> {
  const exported: Record<string, any> = {};
  Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
    const data = localStorage.getItem(key);
    if (data) {
      exported[name] = JSON.parse(data);
    }
  });
  return exported;
}

/**
 * Import storage data
 */
export function importStorage(data: Record<string, any>): void {
  Object.entries(data).forEach(([name, value]) => {
    const key = STORAGE_KEYS[name as keyof typeof STORAGE_KEYS];
    if (key) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  });
}
