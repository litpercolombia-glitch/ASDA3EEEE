/**
 * CONSTANTES CENTRALIZADAS
 *
 * Este archivo contiene TODAS las constantes de la aplicacion.
 * NUNCA definas constantes magicas en otros archivos.
 * Siempre importa desde aqui: import { API_ENDPOINTS, STORAGE_KEYS } from '@/constants'
 */

// ============================================
// API ENDPOINTS
// ============================================

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    REGISTER: '/api/auth/register',
    ME: '/api/auth/me',
  },

  // Shipments / Guias
  SHIPMENTS: {
    BASE: '/api/shipments',
    TRACK: '/api/shipments/track',
    BULK: '/api/shipments/bulk',
    HISTORY: '/api/shipments/history',
    STATS: '/api/shipments/stats',
  },

  // Analytics
  ANALYTICS: {
    BASE: '/api/analytics',
    DASHBOARD: '/api/analytics/dashboard',
    METRICS: '/api/analytics/metrics',
    REPORTS: '/api/analytics/reports',
  },

  // ML / Predictions
  ML: {
    BASE: '/api/ml',
    PREDICT: '/api/ml/predict',
    TRAIN: '/api/ml/train',
    STATUS: '/api/ml/status',
    ALERTS: '/api/ml/alerts',
  },

  // Users
  USERS: {
    BASE: '/api/users',
    PROFILE: '/api/users/profile',
    PREFERENCES: '/api/users/preferences',
  },

  // Finance
  FINANCE: {
    BASE: '/api/finance',
    INCOME: '/api/finance/income',
    EXPENSES: '/api/finance/expenses',
    REPORTS: '/api/finance/reports',
  },

  // CRM
  CRM: {
    BASE: '/api/crm',
    CUSTOMERS: '/api/crm/customers',
    LEADS: '/api/crm/leads',
  },

  // Orders
  ORDERS: {
    BASE: '/api/orders',
    CREATE: '/api/orders/create',
    UPDATE: '/api/orders/update',
  },
} as const;

// ============================================
// STORAGE KEYS
// ============================================

export const STORAGE_KEYS = {
  // Auth
  AUTH_TOKEN: 'litper_auth_token',
  REFRESH_TOKEN: 'litper_refresh_token',
  USER_DATA: 'litper_user_data',

  // UI Preferences
  THEME: 'litper_theme',
  SIDEBAR_STATE: 'litper_sidebar_state',
  LANGUAGE: 'litper_language',

  // Session
  LAST_SESSION: 'litper_last_session',
  SESSION_DATA: 'litper_session_data',
  ACTIVE_TAB: 'litper_active_tab',

  // Shipments
  SHIPMENTS_CACHE: 'litper_shipments_cache',
  LAST_LOAD: 'litper_last_load',
  TRACKED_GUIDES: 'litper_tracked_guides',

  // Filters & Preferences
  VIEW_PREFERENCES: 'litper_view_preferences',
  FILTER_PRESETS: 'litper_filter_presets',
  COLUMN_CONFIG: 'litper_column_config',

  // Finance
  FINANCE_DATA: 'litper_finance_data',
  INCOME_DATA: 'litper_income_data',
  EXPENSES_DATA: 'litper_expenses_data',

  // Assistant
  ASSISTANT_HISTORY: 'litper_assistant_history',
  QUICK_TEXTS: 'litper_quick_texts',

  // Gamification
  GAMIFICATION_DATA: 'litper_gamification_data',
  ACHIEVEMENTS: 'litper_achievements',
  XP_DATA: 'litper_xp_data',

  // ML/Analytics
  ML_PREDICTIONS: 'litper_ml_predictions',
  ANALYTICS_CACHE: 'litper_analytics_cache',
} as const;

// ============================================
// ESTADOS DE ENVIO
// ============================================

export const SHIPMENT_STATES = {
  PENDING: 'pendiente',
  IN_TRANSIT: 'en_transito',
  IN_DELIVERY: 'en_reparto',
  IN_OFFICE: 'en_oficina',
  DELIVERED: 'entregado',
  RETURNED: 'devuelto',
  ISSUE: 'novedad',
  UNKNOWN: 'desconocido',
} as const;

export type ShipmentState = (typeof SHIPMENT_STATES)[keyof typeof SHIPMENT_STATES];

// ============================================
// COLORES DEL SEMAFORO
// ============================================

export const SEMAFORO_COLORS = {
  GREEN: {
    name: 'green',
    label: 'Entregado',
    bg: 'bg-green-500',
    bgLight: 'bg-green-100',
    text: 'text-green-600',
    border: 'border-green-500',
    hex: '#22c55e',
  },
  YELLOW: {
    name: 'yellow',
    label: 'En Proceso',
    bg: 'bg-yellow-500',
    bgLight: 'bg-yellow-100',
    text: 'text-yellow-600',
    border: 'border-yellow-500',
    hex: '#eab308',
  },
  ORANGE: {
    name: 'orange',
    label: 'En Oficina',
    bg: 'bg-orange-500',
    bgLight: 'bg-orange-100',
    text: 'text-orange-600',
    border: 'border-orange-500',
    hex: '#f97316',
  },
  RED: {
    name: 'red',
    label: 'Novedad',
    bg: 'bg-red-500',
    bgLight: 'bg-red-100',
    text: 'text-red-600',
    border: 'border-red-500',
    hex: '#ef4444',
  },
} as const;

// ============================================
// PAGINACION
// ============================================

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 100,
} as const;

// ============================================
// TIMEOUTS Y DELAYS
// ============================================

export const TIMEOUTS = {
  API_REQUEST: 30000, // 30 segundos
  DEBOUNCE_SEARCH: 300, // 300ms
  DEBOUNCE_INPUT: 150, // 150ms
  TOAST_DURATION: 5000, // 5 segundos
  SESSION_TIMEOUT: 3600000, // 1 hora
  REFRESH_INTERVAL: 60000, // 1 minuto
  CACHE_TTL: 300000, // 5 minutos
} as const;

// ============================================
// TRANSPORTADORAS
// ============================================

export const CARRIERS = {
  COORDINADORA: {
    id: 'coordinadora',
    name: 'Coordinadora',
    logo: '/logos/coordinadora.png',
    trackingUrl: 'https://www.coordinadora.com/portafolio-de-servicios/servicios-en-linea/rastrear-guias/',
  },
  SERVIENTREGA: {
    id: 'servientrega',
    name: 'Servientrega',
    logo: '/logos/servientrega.png',
    trackingUrl: 'https://www.servientrega.com/wps/portal/rastreo-envio',
  },
  ENVIA: {
    id: 'envia',
    name: 'Envia',
    logo: '/logos/envia.png',
    trackingUrl: 'https://www.envia.co/rastreo',
  },
  INTERRAPIDISIMO: {
    id: 'interrapidisimo',
    name: 'InterRapidisimo',
    logo: '/logos/interrapidisimo.png',
    trackingUrl: 'https://www.interrapidisimo.com/',
  },
  TCC: {
    id: 'tcc',
    name: 'TCC',
    logo: '/logos/tcc.png',
    trackingUrl: 'https://www.tcc.com.co/',
  },
  DEPRISA: {
    id: 'deprisa',
    name: 'Deprisa',
    logo: '/logos/deprisa.png',
    trackingUrl: 'https://www.deprisa.com/',
  },
} as const;

// ============================================
// REGEX PATTERNS
// ============================================

export const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_CO: /^(\+57)?3\d{9}$/,
  GUIDE_NUMBER: /^[A-Za-z0-9]{6,30}$/,
  NIT: /^\d{9}-\d$/,
  CC: /^\d{6,12}$/,
} as const;

// ============================================
// MESES EN ESPANOL
// ============================================

export const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const;

export const MONTHS_SHORT_ES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
] as const;

export const DAYS_ES = [
  'Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado',
] as const;

export const DAYS_SHORT_ES = [
  'Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab',
] as const;

// ============================================
// FEATURE FLAGS
// ============================================

export const FEATURE_FLAGS = {
  ENABLE_ML_PREDICTIONS: true,
  ENABLE_GAMIFICATION: true,
  ENABLE_DARK_MODE: true,
  ENABLE_PWA: true,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_RESCUE_SYSTEM: true,
  ENABLE_MAP_TRACKING: true,
  ENABLE_VOICE_COMMANDS: false,
  ENABLE_BETA_FEATURES: false,
} as const;

// ============================================
// LIMITES
// ============================================

export const LIMITS = {
  MAX_GUIDES_PER_LOAD: 1000,
  MAX_FILE_SIZE_MB: 10,
  MAX_EXPORT_ROWS: 10000,
  MAX_HISTORY_ITEMS: 100,
  MAX_QUICK_TEXTS: 50,
  MAX_FILTER_PRESETS: 20,
} as const;

// ============================================
// ERRORES COMUNES
// ============================================

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Error de conexión. Verifica tu internet.',
  UNAUTHORIZED: 'Sesión expirada. Por favor inicia sesión nuevamente.',
  NOT_FOUND: 'Recurso no encontrado.',
  SERVER_ERROR: 'Error del servidor. Intenta más tarde.',
  VALIDATION_ERROR: 'Datos inválidos. Revisa la información.',
  FILE_TOO_LARGE: 'El archivo es demasiado grande.',
  INVALID_FORMAT: 'Formato de archivo no válido.',
} as const;

// ============================================
// EXITOS COMUNES
// ============================================

export const SUCCESS_MESSAGES = {
  SAVED: 'Guardado exitosamente.',
  DELETED: 'Eliminado exitosamente.',
  UPDATED: 'Actualizado exitosamente.',
  SENT: 'Enviado exitosamente.',
  LOADED: 'Cargado exitosamente.',
  EXPORTED: 'Exportado exitosamente.',
} as const;
