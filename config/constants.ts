/**
 * Application configuration constants
 *
 * SEGURIDAD: Las API keys de IA (Claude, Gemini, OpenAI) DEBEN estar
 * configuradas SOLO en el backend (.env.backend), NO en el frontend.
 * Usar secureAIService.ts para todas las llamadas de IA.
 */

// Backend Configuration - SEGURO
export const BACKEND_CONFIG = {
  URL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000',
  AI_PROXY_PATH: '/api/ai',
  BRAIN_PATH: '/api/brain',
} as const;

// API Configuration
// DEPRECATED: Las API keys no deben usarse en el frontend
// Use secureAIService.ts en su lugar que llama al backend proxy
export const API_CONFIG = {
  // @deprecated - Usar BACKEND_CONFIG.URL + AI_PROXY_PATH
  // Las API keys se mantienen solo por compatibilidad temporal
  CLAUDE_API_KEY: import.meta.env.VITE_CLAUDE_API_KEY || '',
  CLAUDE_MODELS: {
    DEFAULT: 'claude-sonnet-4-20250514', // Latest Claude Sonnet
    VISION: 'claude-sonnet-4-20250514', // Supports vision
    HAIKU: 'claude-3-5-haiku-20241022', // Fast responses
  },
  // @deprecated - Usar BACKEND_CONFIG.URL + AI_PROXY_PATH
  GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '',
  GEMINI_MODELS: {
    VISION: 'gemini-1.5-flash',
    FLASH: 'gemini-1.5-flash',
    IMAGE: 'gemini-1.5-flash',
    PRO: 'gemini-1.5-flash',
  },
} as const;

// Storage Configuration
export const STORAGE_CONFIG = {
  KEY: import.meta.env.VITE_STORAGE_KEY || 'litper-shipments',
  EXPIRY_HOURS: Number(import.meta.env.VITE_STORAGE_EXPIRY_HOURS) || 24,
} as const;

// Feature Flags
export const FEATURES = {
  AI_ASSISTANT: import.meta.env.VITE_ENABLE_AI_ASSISTANT !== 'false',
  IMAGE_ANALYSIS: import.meta.env.VITE_ENABLE_IMAGE_ANALYSIS !== 'false',
  AUDIO_TRANSCRIPTION: import.meta.env.VITE_ENABLE_AUDIO_TRANSCRIPTION !== 'false',
} as const;

// Application Limits
export const LIMITS = {
  MAX_BATCH_TRACKING: 40, // 17track limitation
  MAX_FILE_SIZE_MB: 10,
  MAX_IMAGE_DIMENSION: 4096,
} as const;

// Carrier Patterns
export const CARRIER_PATTERNS = {
  INTER: /^(80|81|82|83|84|85|86|87|88|89)\d{8,9}$/,
  ENVIA: /^(ENV|env|Env)\d{10}$/,
  COORDINADORA: /^\d{11}$/,
  TCC: /^(7|8|9)\d{10,11}$/,
  VELOCES: /^V\d{8,9}$/i,
} as const;

// Risk Analysis Thresholds
export const RISK_THRESHOLDS = {
  BOGOTA: {
    URGENT_DAYS: 4,
    ATTENTION_DAYS: 3,
    TRACKING_DAYS: 2,
  },
  MEDELLIN: {
    URGENT_DAYS: 5,
    ATTENTION_DAYS: 4,
    TRACKING_DAYS: 3,
  },
  CALI: {
    URGENT_DAYS: 6,
    ATTENTION_DAYS: 5,
    TRACKING_DAYS: 4,
  },
  OTHER: {
    URGENT_DAYS: 7,
    ATTENTION_DAYS: 6,
    TRACKING_DAYS: 5,
  },
} as const;

// Status Keywords
export const STATUS_KEYWORDS = {
  URGENT: ['No Contesta', 'Dirección Errada', 'Rechazado', 'Devuelto', 'No Reclamado'],
  ATTENTION: ['En Oficina', 'Retenido', 'En Verificación', 'Pendiente de Pago'],
  TRACKING: ['En Reparto', 'En Tránsito', 'En Centro de Distribución'],
} as const;

// UI Constants
export const UI = {
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 3000,
  ANIMATION_DURATION: 200,
} as const;

// Validation Patterns
export const VALIDATION = {
  PHONE: /^(\+57)?3\d{9}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  TRACKING_NUMBER: /^[A-Z0-9]{8,15}$/i,
} as const;
