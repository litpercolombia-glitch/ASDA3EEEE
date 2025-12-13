// i18n/index.ts
// Sistema de Internacionalización - Hook y Provider
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { translations, Locale, TranslationKeys } from './translations';

// ============================================
// I18N STORE
// ============================================
interface I18nState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      locale: 'es',
      setLocale: (locale) => {
        set({ locale });
        // Update HTML lang attribute
        if (typeof document !== 'undefined') {
          document.documentElement.lang = locale;
        }
      },
    }),
    {
      name: 'litper-i18n',
    }
  )
);

// ============================================
// TRANSLATION HOOK
// ============================================
type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}.${NestedKeyOf<T[K]>}` | K
          : K
        : never;
    }[keyof T]
  : never;

type TranslationKey = NestedKeyOf<TranslationKeys>;

export function useTranslation() {
  const { locale, setLocale } = useI18nStore();
  const t = translations[locale];

  /**
   * Get translation by key path (e.g., 'common.loading', 'status.delivered')
   */
  function translate(key: string, params?: Record<string, string | number>): string {
    const keys = key.split('.');
    let value: any = t;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`[i18n] Missing translation for key: ${key}`);
        return key;
      }
    }

    if (typeof value !== 'string') {
      console.warn(`[i18n] Translation key ${key} is not a string`);
      return key;
    }

    // Replace parameters (e.g., {n} -> actual value)
    if (params) {
      return Object.entries(params).reduce(
        (str, [param, val]) => str.replace(new RegExp(`\\{${param}\\}`, 'g'), String(val)),
        value
      );
    }

    return value;
  }

  /**
   * Format date according to locale
   */
  function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const localeMap: Record<Locale, string> = {
      es: 'es-CO',
      en: 'en-US',
      pt: 'pt-BR',
    };
    return d.toLocaleDateString(localeMap[locale], options);
  }

  /**
   * Format number according to locale
   */
  function formatNumber(num: number, options?: Intl.NumberFormatOptions): string {
    const localeMap: Record<Locale, string> = {
      es: 'es-CO',
      en: 'en-US',
      pt: 'pt-BR',
    };
    return num.toLocaleString(localeMap[locale], options);
  }

  /**
   * Format currency according to locale
   */
  function formatCurrency(amount: number, currency: string = 'COP'): string {
    const localeMap: Record<Locale, string> = {
      es: 'es-CO',
      en: 'en-US',
      pt: 'pt-BR',
    };
    const currencyMap: Record<Locale, string> = {
      es: 'COP',
      en: 'USD',
      pt: 'BRL',
    };
    return amount.toLocaleString(localeMap[locale], {
      style: 'currency',
      currency: currency || currencyMap[locale],
    });
  }

  /**
   * Format relative time (e.g., "5 minutes ago")
   */
  function formatRelativeTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - d.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t.time.now;
    if (minutes < 60) return t.time.minutesAgo.replace('{n}', String(minutes));
    if (hours < 24) return t.time.hoursAgo.replace('{n}', String(hours));
    return t.time.daysAgo.replace('{n}', String(days));
  }

  /**
   * Get available locales
   */
  function getAvailableLocales(): { code: Locale; name: string; flag: string }[] {
    return [
      { code: 'es', name: 'Español', flag: '🇨🇴' },
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'pt', name: 'Português', flag: '🇧🇷' },
    ];
  }

  return {
    t: translate,
    locale,
    setLocale,
    formatDate,
    formatNumber,
    formatCurrency,
    formatRelativeTime,
    getAvailableLocales,
    // Direct access to translation objects
    translations: t,
  };
}

// ============================================
// LANGUAGE SELECTOR COMPONENT
// ============================================
import React, { useState } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';

export const LanguageSelector: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { locale, setLocale, getAvailableLocales } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const locales = getAvailableLocales();
  const currentLocale = locales.find((l) => l.code === locale);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm transition-all border border-white/10"
      >
        <Globe className="w-4 h-4 text-accent-400" />
        <span className="hidden lg:inline text-slate-300">
          {currentLocale?.flag} {currentLocale?.name}
        </span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-navy-800 rounded-xl shadow-xl border border-slate-200 dark:border-navy-700 py-2 z-50 animate-fade-in">
            {locales.map((loc) => (
              <button
                key={loc.code}
                onClick={() => {
                  setLocale(loc.code);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors ${
                  locale === loc.code ? 'text-accent-600 dark:text-accent-400 font-medium' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-lg">{loc.flag}</span>
                  {loc.name}
                </span>
                {locale === loc.code && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ============================================
// EXPORTS
// ============================================
export { translations, type Locale, type TranslationKeys } from './translations';
export default useTranslation;
