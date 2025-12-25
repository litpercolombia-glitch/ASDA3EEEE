// /src/config/env.ts
// Gestión centralizada de variables de entorno

/**
 * Variables de entorno de la aplicación
 */
export interface AppEnv {
  // Entorno
  APP_ENV: 'development' | 'staging' | 'production';
  IS_DEV: boolean;
  IS_PROD: boolean;

  // Chatea/WhatsApp
  CHATEA_WEBHOOK_SECRET: string;
  CHATEA_API_KEY: string;
  CHATEA_API_URL: string;

  // IA Providers
  ANTHROPIC_API_KEY: string;
  GEMINI_API_KEY: string;
  OPENAI_API_KEY: string;
  DEFAULT_AI_PROVIDER: 'claude' | 'gemini' | 'openai';

  // Supabase
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_KEY: string;

  // Vercel KV (para dedupe en producción)
  KV_REST_API_URL: string;
  KV_REST_API_TOKEN: string;

  // Backend
  BACKEND_URL: string;

  // Feature flags
  ENABLE_WEBHOOK_SIGNATURE_VALIDATION: boolean;
  ENABLE_AUTONOMOUS_ACTIONS: boolean;
  ENABLE_CUSTOMER_NOTIFICATIONS: boolean;
}

/**
 * Obtiene todas las variables de entorno
 * Funciona tanto en cliente (VITE_) como en serverless (process.env)
 */
export function getEnv(): AppEnv {
  // Detectar si estamos en browser o Node
  const isBrowser = typeof window !== 'undefined';

  // Helper para obtener variable de entorno
  const get = (key: string, defaultValue = ''): string => {
    if (isBrowser) {
      // En browser, usar import.meta.env (Vite)
      return (import.meta.env?.[`VITE_${key}`] as string) ?? defaultValue;
    }
    // En serverless, usar process.env
    return process.env[key] ?? process.env[`VITE_${key}`] ?? defaultValue;
  };

  const appEnv = get('APP_ENV', 'development') as AppEnv['APP_ENV'];

  return {
    // Entorno
    APP_ENV: appEnv,
    IS_DEV: appEnv === 'development',
    IS_PROD: appEnv === 'production',

    // Chatea/WhatsApp
    CHATEA_WEBHOOK_SECRET: get('CHATEA_WEBHOOK_SECRET'),
    CHATEA_API_KEY: get('CHATEA_API_KEY'),
    CHATEA_API_URL: get('CHATEA_API_URL', 'https://api.chateapro.app'),

    // IA Providers
    ANTHROPIC_API_KEY: get('ANTHROPIC_API_KEY'),
    GEMINI_API_KEY: get('GEMINI_API_KEY'),
    OPENAI_API_KEY: get('OPENAI_API_KEY'),
    DEFAULT_AI_PROVIDER: (get('DEFAULT_AI_PROVIDER', 'claude') as AppEnv['DEFAULT_AI_PROVIDER']),

    // Supabase
    SUPABASE_URL: get('SUPABASE_URL'),
    SUPABASE_ANON_KEY: get('SUPABASE_ANON_KEY'),
    SUPABASE_SERVICE_KEY: get('SUPABASE_SERVICE_KEY'),

    // Vercel KV
    KV_REST_API_URL: get('KV_REST_API_URL'),
    KV_REST_API_TOKEN: get('KV_REST_API_TOKEN'),

    // Backend
    BACKEND_URL: get('BACKEND_URL', 'http://localhost:8000'),

    // Feature flags
    ENABLE_WEBHOOK_SIGNATURE_VALIDATION: get('ENABLE_WEBHOOK_SIGNATURE_VALIDATION', 'false') === 'true',
    ENABLE_AUTONOMOUS_ACTIONS: get('ENABLE_AUTONOMOUS_ACTIONS', 'false') === 'true',
    ENABLE_CUSTOMER_NOTIFICATIONS: get('ENABLE_CUSTOMER_NOTIFICATIONS', 'false') === 'true',
  };
}

/**
 * Valida que las variables requeridas estén presentes
 */
export function validateEnv(requiredKeys: (keyof AppEnv)[]): { valid: boolean; missing: string[] } {
  const env = getEnv();
  const missing: string[] = [];

  for (const key of requiredKeys) {
    const value = env[key];
    if (value === '' || value === undefined || value === null) {
      missing.push(key);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Obtiene variables de entorno para el servidor (solo en serverless)
 * Nunca expone estas variables al cliente
 */
export function getServerEnv(): Pick<
  AppEnv,
  | 'CHATEA_WEBHOOK_SECRET'
  | 'CHATEA_API_KEY'
  | 'ANTHROPIC_API_KEY'
  | 'SUPABASE_SERVICE_KEY'
  | 'KV_REST_API_TOKEN'
> {
  if (typeof window !== 'undefined') {
    throw new Error('getServerEnv() cannot be called in browser');
  }

  return {
    CHATEA_WEBHOOK_SECRET: process.env.CHATEA_WEBHOOK_SECRET ?? '',
    CHATEA_API_KEY: process.env.CHATEA_API_KEY ?? '',
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ?? '',
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ?? '',
  };
}

// Singleton para evitar múltiples lecturas
let cachedEnv: AppEnv | null = null;

/**
 * Obtiene env cacheado (útil para múltiples lecturas)
 */
export function getCachedEnv(): AppEnv {
  if (!cachedEnv) {
    cachedEnv = getEnv();
  }
  return cachedEnv;
}

/**
 * Limpia cache (útil para testing)
 */
export function clearEnvCache(): void {
  cachedEnv = null;
}
