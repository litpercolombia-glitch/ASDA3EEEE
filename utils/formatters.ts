/**
 * FORMATTERS CENTRALIZADOS
 *
 * Este archivo contiene TODAS las funciones de formateo de la aplicacion.
 * NUNCA crees funciones formatCurrency, formatDate, etc. en otros archivos.
 * Siempre importa desde aqui: import { formatCurrency, formatDate } from '@/utils/formatters'
 */

// ============================================
// TIPOS
// ============================================

export type Locale = 'es' | 'en' | 'pt';
export type DateFormat = 'short' | 'medium' | 'long' | 'full' | 'relative' | 'time' | 'datetime';

interface LocaleConfig {
  locale: string;
  currency: string;
}

const LOCALE_MAP: Record<Locale, LocaleConfig> = {
  es: { locale: 'es-CO', currency: 'COP' },
  en: { locale: 'en-US', currency: 'USD' },
  pt: { locale: 'pt-BR', currency: 'BRL' },
};

// Default locale
let currentLocale: Locale = 'es';

// ============================================
// CONFIGURACION DE LOCALE
// ============================================

export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

// ============================================
// FORMATEO DE MONEDA
// ============================================

/**
 * Formatea un numero como moneda
 * @param amount - Cantidad a formatear
 * @param currency - Codigo de moneda (default: segun locale actual)
 * @param options - Opciones adicionales de Intl.NumberFormat
 * @returns String formateado como moneda (ej: "$1.500.000")
 *
 * @example
 * formatCurrency(1500000) // "$1.500.000"
 * formatCurrency(1500.50, 'USD') // "$1,500.50"
 */
export function formatCurrency(
  amount: number,
  currency?: string,
  options?: Partial<Intl.NumberFormatOptions>
): string {
  const config = LOCALE_MAP[currentLocale];
  const currencyCode = currency || config.currency;

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: currencyCode === 'COP' ? 0 : 2,
    ...options,
  }).format(amount);
}

/**
 * Formatea moneda para un pais especifico
 * @deprecated Usa formatCurrency con el currency code directamente
 */
export function formatCurrencyForCountry(
  country: { currency: string; locale?: string },
  amount: number
): string {
  const locale = country.locale || 'es-CO';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: country.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ============================================
// FORMATEO DE NUMEROS
// ============================================

/**
 * Formatea un numero con separadores de miles
 * @param value - Numero a formatear
 * @param decimals - Cantidad de decimales (default: 0)
 * @returns String formateado (ej: "1.500.000")
 *
 * @example
 * formatNumber(1500000) // "1.500.000"
 * formatNumber(1500.567, 2) // "1.500,57"
 */
export function formatNumber(value: number, decimals: number = 0): string {
  const config = LOCALE_MAP[currentLocale];
  return new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Formatea un porcentaje
 * @param value - Valor del porcentaje (0-100 o 0-1 dependiendo de asDecimal)
 * @param decimals - Cantidad de decimales
 * @param asDecimal - Si true, el valor se multiplica por 100
 * @returns String formateado (ej: "75.5%")
 *
 * @example
 * formatPercentage(75.5) // "75.5%"
 * formatPercentage(0.755, 1, true) // "75.5%"
 */
export function formatPercentage(
  value: number,
  decimals: number = 1,
  asDecimal: boolean = false
): string {
  const percentage = asDecimal ? value * 100 : value;
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Formatea un numero compacto (1K, 1M, etc.)
 * @param value - Numero a formatear
 * @returns String compacto (ej: "1.5M")
 *
 * @example
 * formatCompactNumber(1500000) // "1.5M"
 * formatCompactNumber(1500) // "1.5K"
 */
export function formatCompactNumber(value: number): string {
  const config = LOCALE_MAP[currentLocale];
  return new Intl.NumberFormat(config.locale, {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value);
}

// ============================================
// FORMATEO DE FECHAS
// ============================================

/**
 * Formatea una fecha segun el formato especificado
 * @param date - Fecha a formatear (Date, string ISO, o timestamp)
 * @param format - Formato deseado
 * @returns String formateado
 *
 * @example
 * formatDate(new Date()) // "15/12/2024"
 * formatDate("2024-12-15", "long") // "15 de diciembre de 2024"
 * formatDate(new Date(), "relative") // "hace 5 minutos"
 */
export function formatDate(
  date: Date | string | number,
  format: DateFormat = 'short'
): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  if (isNaN(d.getTime())) {
    return 'Fecha inválida';
  }

  const config = LOCALE_MAP[currentLocale];

  switch (format) {
    case 'short':
      return d.toLocaleDateString(config.locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

    case 'medium':
      return d.toLocaleDateString(config.locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

    case 'long':
      return d.toLocaleDateString(config.locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

    case 'full':
      return d.toLocaleDateString(config.locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

    case 'time':
      return d.toLocaleTimeString(config.locale, {
        hour: '2-digit',
        minute: '2-digit',
      });

    case 'datetime':
      return d.toLocaleString(config.locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

    case 'relative':
      return formatRelativeTime(d);

    default:
      return d.toLocaleDateString(config.locale);
  }
}

/**
 * Formatea una fecha como tiempo relativo
 * @param date - Fecha a formatear
 * @returns String relativo (ej: "hace 5 minutos")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (seconds < 60) return 'ahora';
  if (minutes < 60) return `hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  if (hours < 24) return `hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  if (days < 7) return `hace ${days} ${days === 1 ? 'día' : 'días'}`;
  if (days < 30) return `hace ${Math.floor(days / 7)} ${Math.floor(days / 7) === 1 ? 'semana' : 'semanas'}`;
  if (days < 365) return `hace ${Math.floor(days / 30)} ${Math.floor(days / 30) === 1 ? 'mes' : 'meses'}`;
  return `hace ${Math.floor(days / 365)} ${Math.floor(days / 365) === 1 ? 'año' : 'años'}`;
}

/**
 * Formatea una fecha para mostrar en sesiones/logs
 * @param date - Fecha a formatear
 * @returns String en formato "DD/MM/YYYY HH:mm"
 */
export function formatDateTime(date: Date | string): string {
  return formatDate(date, 'datetime');
}

/**
 * Formatea solo la hora
 * @param date - Fecha/hora a formatear
 * @returns String en formato "HH:mm"
 */
export function formatTime(date: Date | string): string {
  return formatDate(date, 'time');
}

/**
 * Obtiene el nombre del mes
 * @param monthIndex - Indice del mes (0-11) o string "YYYY-MM"
 * @returns Nombre del mes en espanol
 */
export function getMonthName(monthIndex: number | string): string {
  const MONTHS_ES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  if (typeof monthIndex === 'string') {
    const [, month] = monthIndex.split('-').map(Number);
    return MONTHS_ES[month - 1] || '';
  }

  return MONTHS_ES[monthIndex] || '';
}

// ============================================
// FORMATEO DE TELEFONO
// ============================================

/**
 * Formatea un numero de telefono
 * @param phone - Numero de telefono
 * @param format - Formato deseado ('co' para Colombia, 'international')
 * @returns Telefono formateado
 *
 * @example
 * formatPhone("3001234567") // "300 123 4567"
 * formatPhone("573001234567", "international") // "+57 300 123 4567"
 */
export function formatPhone(phone: string, format: 'co' | 'international' = 'co'): string {
  // Limpiar el telefono de caracteres no numericos
  const cleaned = phone.replace(/\D/g, '');

  if (format === 'international' && cleaned.length >= 12) {
    // +57 300 123 4567
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }

  if (cleaned.length === 10) {
    // 300 123 4567
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }

  // Si no coincide con ningun formato, devolver tal cual
  return phone;
}

// ============================================
// FORMATEO DE GUIAS/TRACKING
// ============================================

/**
 * Formatea un numero de guia para mostrar
 * @param guia - Numero de guia
 * @param maxLength - Longitud maxima antes de truncar
 * @returns Guia formateada
 */
export function formatGuideNumber(guia: string, maxLength: number = 20): string {
  if (!guia) return '';
  if (guia.length <= maxLength) return guia;
  return `${guia.slice(0, maxLength - 3)}...`;
}

// ============================================
// FORMATEO DE TEXTO
// ============================================

/**
 * Capitaliza la primera letra de un texto
 * @param text - Texto a capitalizar
 * @returns Texto con primera letra mayuscula
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Capitaliza cada palabra de un texto
 * @param text - Texto a capitalizar
 * @returns Texto con cada palabra capitalizada
 */
export function capitalizeWords(text: string): string {
  if (!text) return '';
  return text.split(' ').map(capitalize).join(' ');
}

/**
 * Trunca un texto a una longitud maxima
 * @param text - Texto a truncar
 * @param maxLength - Longitud maxima
 * @param suffix - Sufijo a agregar (default: "...")
 * @returns Texto truncado
 */
export function truncate(text: string, maxLength: number, suffix: string = '...'): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
}

// ============================================
// FORMATEO DE BYTES/TAMAÑO
// ============================================

/**
 * Formatea bytes a unidades legibles
 * @param bytes - Cantidad de bytes
 * @param decimals - Cantidad de decimales
 * @returns String formateado (ej: "1.5 MB")
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

// ============================================
// FORMATEO DE DURACION
// ============================================

/**
 * Formatea una duracion en milisegundos a formato legible
 * @param ms - Duracion en milisegundos
 * @returns String formateado (ej: "2h 30m")
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Formatea horas a formato legible
 * @param hours - Cantidad de horas
 * @returns String formateado (ej: "2 días 5 horas")
 */
export function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} minutos`;
  if (hours < 24) return `${Math.round(hours)} ${Math.round(hours) === 1 ? 'hora' : 'horas'}`;
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  if (remainingHours === 0) return `${days} ${days === 1 ? 'día' : 'días'}`;
  return `${days} ${days === 1 ? 'día' : 'días'} ${remainingHours}h`;
}
