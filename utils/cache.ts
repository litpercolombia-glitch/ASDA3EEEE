// utils/cache.ts
// Sistema de Caché SWR (Stale-While-Revalidate) estilo Amazon
// Proporciona caching inteligente para datos y respuestas

// ============================================
// TYPES
// ============================================
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  staleAt: number;
}

interface CacheOptions {
  /** Time in ms before data is considered stale (default: 5 min) */
  staleTime?: number;
  /** Time in ms before cache entry expires completely (default: 30 min) */
  cacheTime?: number;
  /** Whether to persist in localStorage (default: false) */
  persist?: boolean;
  /** Storage key prefix for persistence */
  storagePrefix?: string;
}

interface FetchOptions<T> extends CacheOptions {
  /** Callback when data is fetched fresh */
  onFresh?: (data: T) => void;
  /** Callback when stale data is served */
  onStale?: (data: T) => void;
  /** Callback when revalidation completes */
  onRevalidate?: (data: T) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

// ============================================
// CACHE STORE
// ============================================
class CacheStore {
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, Promise<any>>();
  private subscribers = new Map<string, Set<(data: any) => void>>();

  private defaultOptions: Required<CacheOptions> = {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    persist: false,
    storagePrefix: 'litper-cache',
  };

  constructor() {
    // Cleanup expired entries periodically
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanup(), 60 * 1000); // Every minute
    }
  }

  // ============================================
  // CORE METHODS
  // ============================================

  /**
   * Get data from cache with SWR strategy
   */
  async fetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: FetchOptions<T>
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options };
    const now = Date.now();

    // Check memory cache first
    let entry = this.cache.get(key);

    // Check persistent storage if enabled and not in memory
    if (!entry && opts.persist) {
      entry = this.loadFromStorage<T>(key, opts.storagePrefix);
      if (entry) {
        this.cache.set(key, entry);
      }
    }

    // If we have valid cache data
    if (entry) {
      const isStale = now > entry.staleAt;
      const isExpired = now > entry.expiresAt;

      if (!isExpired) {
        if (isStale) {
          // Stale data - serve it but revalidate in background
          opts.onStale?.(entry.data);
          this.revalidateInBackground(key, fetcher, opts);
        } else {
          // Fresh data
          opts.onFresh?.(entry.data);
        }
        return entry.data;
      }
    }

    // No cache or expired - fetch fresh data
    return this.fetchFresh(key, fetcher, opts);
  }

  /**
   * Fetch fresh data and update cache
   */
  private async fetchFresh<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: Required<FetchOptions<T>>
  ): Promise<T> {
    // Deduplicate concurrent requests
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending;
    }

    const request = fetcher()
      .then((data) => {
        this.set(key, data, options);
        options.onFresh?.(data);
        return data;
      })
      .catch((error) => {
        options.onError?.(error);
        // Return stale data if available on error
        const staleEntry = this.cache.get(key);
        if (staleEntry) {
          return staleEntry.data;
        }
        throw error;
      })
      .finally(() => {
        this.pendingRequests.delete(key);
      });

    this.pendingRequests.set(key, request);
    return request;
  }

  /**
   * Revalidate in background (SWR pattern)
   */
  private async revalidateInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: Required<FetchOptions<T>>
  ): Promise<void> {
    // Don't duplicate if already revalidating
    if (this.pendingRequests.has(key)) {
      return;
    }

    try {
      const data = await this.fetchFresh(key, fetcher, options);
      options.onRevalidate?.(data);
      this.notifySubscribers(key, data);
    } catch (error) {
      // Silently fail background revalidation
      console.warn(`[Cache] Background revalidation failed for ${key}:`, error);
    }
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, options?: CacheOptions): void {
    const opts = { ...this.defaultOptions, ...options };
    const now = Date.now();

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      staleAt: now + opts.staleTime,
      expiresAt: now + opts.cacheTime,
    };

    this.cache.set(key, entry);

    // Persist if enabled
    if (opts.persist) {
      this.saveToStorage(key, entry, opts.storagePrefix);
    }

    // Notify subscribers
    this.notifySubscribers(key, data);
  }

  /**
   * Get data from cache without fetching
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (entry && Date.now() < entry.expiresAt) {
      return entry.data;
    }
    return undefined;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return !!entry && Date.now() < entry.expiresAt;
  }

  /**
   * Check if data is stale
   */
  isStale(key: string): boolean {
    const entry = this.cache.get(key);
    return !entry || Date.now() > entry.staleAt;
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    this.removeFromStorage(key, this.defaultOptions.storagePrefix);
  }

  /**
   * Invalidate all entries matching pattern
   */
  invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.invalidate(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.clearStorage(this.defaultOptions.storagePrefix);
  }

  // ============================================
  // SUBSCRIPTION METHODS
  // ============================================

  /**
   * Subscribe to cache updates for a key
   */
  subscribe<T>(key: string, callback: (data: T) => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(callback);

    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(key);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscribers.delete(key);
        }
      }
    };
  }

  private notifySubscribers(key: string, data: any): void {
    const subs = this.subscribers.get(key);
    if (subs) {
      subs.forEach((callback) => callback(data));
    }
  }

  // ============================================
  // PERSISTENCE METHODS
  // ============================================

  private loadFromStorage<T>(key: string, prefix: string): CacheEntry<T> | null {
    if (typeof localStorage === 'undefined') return null;

    try {
      const stored = localStorage.getItem(`${prefix}:${key}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn(`[Cache] Failed to load from storage:`, error);
    }
    return null;
  }

  private saveToStorage<T>(key: string, entry: CacheEntry<T>, prefix: string): void {
    if (typeof localStorage === 'undefined') return;

    try {
      localStorage.setItem(`${prefix}:${key}`, JSON.stringify(entry));
    } catch (error) {
      console.warn(`[Cache] Failed to save to storage:`, error);
      // If storage is full, clear old entries
      this.clearOldStorageEntries(prefix);
    }
  }

  private removeFromStorage(key: string, prefix: string): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(`${prefix}:${key}`);
  }

  private clearStorage(prefix: string): void {
    if (typeof localStorage === 'undefined') return;

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`${prefix}:`)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }

  private clearOldStorageEntries(prefix: string): void {
    if (typeof localStorage === 'undefined') return;

    const now = Date.now();
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`${prefix}:`)) {
        try {
          const entry = JSON.parse(localStorage.getItem(key) || '');
          if (entry.expiresAt < now) {
            keysToRemove.push(key);
          }
        } catch {
          keysToRemove.push(key!);
        }
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }

  // ============================================
  // CLEANUP
  // ============================================

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  // ============================================
  // DEBUG METHODS
  // ============================================

  getStats(): { size: number; keys: string[]; pendingRequests: number } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      pendingRequests: this.pendingRequests.size,
    };
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================
export const cache = new CacheStore();

// ============================================
// REACT HOOK FOR SWR
// ============================================
import { useState, useEffect, useCallback } from 'react';

interface UseCacheResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isValidating: boolean;
  error: Error | null;
  mutate: (data?: T | ((current: T | undefined) => T)) => void;
  refresh: () => Promise<void>;
}

export function useCache<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  options?: FetchOptions<T>
): UseCacheResult<T> {
  const [data, setData] = useState<T | undefined>(() => key ? cache.get<T>(key) : undefined);
  const [isLoading, setIsLoading] = useState(!data);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!key) return;

    const isInitial = !cache.has(key);
    if (isInitial) {
      setIsLoading(true);
    } else {
      setIsValidating(true);
    }

    try {
      const result = await cache.fetch(key, fetcher, {
        ...options,
        onFresh: (d) => {
          setData(d);
          options?.onFresh?.(d);
        },
        onStale: (d) => {
          setData(d);
          options?.onStale?.(d);
        },
        onRevalidate: (d) => {
          setData(d);
          options?.onRevalidate?.(d);
        },
        onError: (e) => {
          setError(e);
          options?.onError?.(e);
        },
      });
      setData(result);
      setError(null);
    } catch (e) {
      setError(e as Error);
    } finally {
      setIsLoading(false);
      setIsValidating(false);
    }
  }, [key, fetcher, options]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Subscribe to updates
  useEffect(() => {
    if (!key) return;
    return cache.subscribe<T>(key, setData);
  }, [key]);

  const mutate = useCallback(
    (newData?: T | ((current: T | undefined) => T)) => {
      if (!key) return;

      const value = typeof newData === 'function'
        ? (newData as (current: T | undefined) => T)(data)
        : newData;

      if (value !== undefined) {
        cache.set(key, value, options);
        setData(value);
      } else {
        // Revalidate
        fetchData();
      }
    },
    [key, data, options, fetchData]
  );

  const refresh = useCallback(async () => {
    if (!key) return;
    cache.invalidate(key);
    await fetchData();
  }, [key, fetchData]);

  return { data, isLoading, isValidating, error, mutate, refresh };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Prefetch data into cache
 */
export async function prefetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: CacheOptions
): Promise<void> {
  if (!cache.has(key)) {
    await cache.fetch(key, fetcher, options);
  }
}

/**
 * Create a cache key from parameters
 */
export function createCacheKey(base: string, params?: Record<string, any>): string {
  if (!params) return base;
  const sortedParams = Object.keys(params)
    .sort()
    .map((k) => `${k}=${JSON.stringify(params[k])}`)
    .join('&');
  return `${base}?${sortedParams}`;
}

export default cache;
