// ============================================
// SERVICIO DE PAÍS Y TRANSPORTADORAS
// ============================================

import { Country, CountryConfig, Carrier, COUNTRY_CONFIGS, MAIN_CITIES } from '../types/country';

const STORAGE_KEY = 'litper_selected_country';

// Obtener país guardado o null
export const getSelectedCountry = (): Country | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (saved === 'COLOMBIA' || saved === 'ECUADOR' || saved === 'CHILE')) {
      return saved as Country;
    }
    return null;
  } catch {
    return null;
  }
};

// Guardar país seleccionado
export const saveSelectedCountry = (country: Country): void => {
  try {
    localStorage.setItem(STORAGE_KEY, country);
  } catch (e) {
    console.error('Error saving country:', e);
  }
};

// Obtener configuración de país
export const getCountryConfig = (country: Country): CountryConfig => {
  return COUNTRY_CONFIGS[country];
};

// Obtener todas las transportadoras de un país
export const getCarriersByCountry = (country: Country): Carrier[] => {
  return COUNTRY_CONFIGS[country].carriers;
};

// Obtener transportadora por ID y país
export const getCarrierById = (country: Country, carrierId: string): Carrier | undefined => {
  return COUNTRY_CONFIGS[country].carriers.find((c) => c.id === carrierId);
};

// Obtener ciudades principales de un país
export const getCitiesByCountry = (country: Country): string[] => {
  return MAIN_CITIES[country];
};

// Detectar transportadora por número de guía
export const detectCarrierByGuide = (country: Country, guide: string): Carrier | undefined => {
  const carriers = getCarriersByCountry(country);
  return carriers.find((carrier) => carrier.guidePattern.test(guide));
};

// Obtener URL de rastreo
export const getTrackingUrl = (country: Country, carrierId: string, guide: string): string => {
  const carrier = getCarrierById(country, carrierId);
  if (!carrier) return '';
  return carrier.trackingUrlPattern.replace('{guide}', guide);
};

// Validar número de teléfono por país
export const validatePhone = (country: Country, phone: string): boolean => {
  const config = getCountryConfig(country);
  return config.phonePattern.test(phone);
};

// Formatear número de teléfono
export const formatPhone = (country: Country, phone: string): string => {
  const config = getCountryConfig(country);
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith(config.phonePrefix.replace('+', ''))) {
    return `+${cleaned}`;
  }

  return `${config.phonePrefix}${cleaned}`;
};

// Formatear moneda
export const formatCurrency = (country: Country, amount: number): string => {
  const config = getCountryConfig(country);

  return new Intl.NumberFormat(
    country === 'COLOMBIA' ? 'es-CO' : country === 'ECUADOR' ? 'es-EC' : 'es-CL',
    {
      style: 'currency',
      currency: config.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }
  ).format(amount);
};

// Obtener todos los países disponibles
export const getAllCountries = (): CountryConfig[] => {
  return Object.values(COUNTRY_CONFIGS);
};

// Verificar si hay país seleccionado
export const hasSelectedCountry = (): boolean => {
  return getSelectedCountry() !== null;
};

// Limpiar selección de país
export const clearSelectedCountry = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Error clearing country:', e);
  }
};
