// ============================================
// SERVICIO LITPER FLASH - ONE-CLICK SHIPPING
// ============================================

import { v4 as uuidv4 } from 'uuid';
import {
  FlashProfile,
  FlashShipment,
  FlashStats,
  FlashRecipient,
  FlashAddress,
  FlashProduct,
  TIME_SAVED_PER_SHIPMENT,
} from '../types/flash';
import { Country } from '../types/country';
import { getCarrierById } from './countryService';

const PROFILES_KEY = 'litper_flash_profiles';
const SHIPMENTS_KEY = 'litper_flash_shipments';
const STATS_KEY = 'litper_flash_stats';

// ============================================
// GESTIÓN DE PERFILES
// ============================================

export const getFlashProfiles = (country: Country): FlashProfile[] => {
  try {
    const data = localStorage.getItem(PROFILES_KEY);
    if (data) {
      const profiles: FlashProfile[] = JSON.parse(data);
      return profiles.filter((p) => p.country === country);
    }
    return [];
  } catch {
    return [];
  }
};

export const getAllFlashProfiles = (): FlashProfile[] => {
  try {
    const data = localStorage.getItem(PROFILES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveFlashProfiles = (profiles: FlashProfile[]): void => {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch (e) {
    console.error('Error saving flash profiles:', e);
  }
};

export const createFlashProfile = (
  name: string,
  country: Country,
  carrierId: string,
  serviceId: string,
  recipient: FlashRecipient,
  address: FlashAddress,
  options?: {
    emoji?: string;
    color?: string;
    defaultProduct?: FlashProduct;
    deliveryInstructions?: string;
    tags?: string[];
  }
): FlashProfile => {
  const profile: FlashProfile = {
    id: uuidv4(),
    name,
    emoji: options?.emoji || '📦',
    color: options?.color || 'blue',
    country,
    carrierId,
    serviceId,
    recipient,
    address,
    defaultProduct: options?.defaultProduct,
    deliveryInstructions: options?.deliveryInstructions,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: options?.tags || [],
    isFavorite: false,
  };

  const profiles = getAllFlashProfiles();
  profiles.push(profile);
  saveFlashProfiles(profiles);

  return profile;
};

export const updateFlashProfile = (
  profileId: string,
  updates: Partial<FlashProfile>
): FlashProfile | null => {
  const profiles = getAllFlashProfiles();
  const index = profiles.findIndex((p) => p.id === profileId);

  if (index === -1) return null;

  profiles[index] = {
    ...profiles[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveFlashProfiles(profiles);
  return profiles[index];
};

export const deleteFlashProfile = (profileId: string): boolean => {
  const profiles = getAllFlashProfiles();
  const filtered = profiles.filter((p) => p.id !== profileId);

  if (filtered.length === profiles.length) return false;

  saveFlashProfiles(filtered);
  return true;
};

export const toggleProfileFavorite = (profileId: string): FlashProfile | null => {
  const profiles = getAllFlashProfiles();
  const profile = profiles.find((p) => p.id === profileId);

  if (!profile) return null;

  return updateFlashProfile(profileId, { isFavorite: !profile.isFavorite });
};

export const getProfileById = (profileId: string): FlashProfile | undefined => {
  return getAllFlashProfiles().find((p) => p.id === profileId);
};

export const getFavoriteProfiles = (country: Country): FlashProfile[] => {
  return getFlashProfiles(country).filter((p) => p.isFavorite);
};

export const getMostUsedProfiles = (country: Country, limit: number = 5): FlashProfile[] => {
  return getFlashProfiles(country)
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, limit);
};

export const getRecentProfiles = (country: Country, limit: number = 5): FlashProfile[] => {
  return getFlashProfiles(country)
    .filter((p) => p.lastUsed)
    .sort((a, b) => new Date(b.lastUsed!).getTime() - new Date(a.lastUsed!).getTime())
    .slice(0, limit);
};

// ============================================
// GESTIÓN DE ENVÍOS FLASH
// ============================================

export const getFlashShipments = (): FlashShipment[] => {
  try {
    const data = localStorage.getItem(SHIPMENTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveFlashShipments = (shipments: FlashShipment[]): void => {
  try {
    localStorage.setItem(SHIPMENTS_KEY, JSON.stringify(shipments));
  } catch (e) {
    console.error('Error saving flash shipments:', e);
  }
};

export const createFlashShipment = (
  profile: FlashProfile,
  country: Country,
  product?: FlashProduct
): FlashShipment => {
  const carrier = getCarrierById(country, profile.carrierId);
  const service = carrier?.services.find((s) => s.id === profile.serviceId);

  const shipment: FlashShipment = {
    id: uuidv4(),
    profileId: profile.id,
    profileName: profile.name,
    guideNumber: generateTemporaryGuide(),
    carrierId: profile.carrierId,
    carrierName: carrier?.name || 'Desconocido',
    serviceId: profile.serviceId,
    serviceName: service?.name || 'Estándar',
    recipient: profile.recipient,
    address: profile.address,
    product: product ||
      profile.defaultProduct || {
        name: 'Paquete',
        description: 'Paquete estándar',
      },
    status: 'label_generated',
    createdAt: new Date().toISOString(),
    estimatedDelivery: calculateEstimatedDelivery(service?.avgDays || 3),
    notificationsSent: [
      {
        type: 'label',
        sentAt: new Date().toISOString(),
        channel: 'whatsapp',
      },
    ],
  };

  // Actualizar uso del perfil
  updateFlashProfile(profile.id, {
    usageCount: profile.usageCount + 1,
    lastUsed: new Date().toISOString(),
  });

  const shipments = getFlashShipments();
  shipments.unshift(shipment);
  saveFlashShipments(shipments);

  // Actualizar estadísticas
  updateFlashStats(shipment);

  return shipment;
};

export const updateFlashShipment = (
  shipmentId: string,
  updates: Partial<FlashShipment>
): FlashShipment | null => {
  const shipments = getFlashShipments();
  const index = shipments.findIndex((s) => s.id === shipmentId);

  if (index === -1) return null;

  shipments[index] = {
    ...shipments[index],
    ...updates,
  };

  saveFlashShipments(shipments);
  return shipments[index];
};

// ============================================
// ESTADÍSTICAS
// ============================================

export const getFlashStats = (): FlashStats => {
  try {
    const data = localStorage.getItem(STATS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return createEmptyStats();
  } catch {
    return createEmptyStats();
  }
};

const createEmptyStats = (): FlashStats => ({
  totalProfiles: 0,
  totalShipments: 0,
  totalTimeSaved: 0,
  avgTimePerShipment: 8,
  mostUsedProfiles: [],
  shipmentsByDay: [],
});

const updateFlashStats = (shipment: FlashShipment): void => {
  const stats = getFlashStats();
  const profiles = getAllFlashProfiles();

  stats.totalProfiles = profiles.length;
  stats.totalShipments += 1;
  stats.totalTimeSaved += TIME_SAVED_PER_SHIPMENT;

  // Actualizar más usados
  stats.mostUsedProfiles = profiles
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 5)
    .map((p) => ({
      profileId: p.id,
      profileName: p.name,
      count: p.usageCount,
    }));

  // Actualizar por día
  const today = new Date().toISOString().split('T')[0];
  const dayIndex = stats.shipmentsByDay.findIndex((d) => d.date === today);

  if (dayIndex >= 0) {
    stats.shipmentsByDay[dayIndex].count += 1;
    stats.shipmentsByDay[dayIndex].timeSaved += TIME_SAVED_PER_SHIPMENT;
  } else {
    stats.shipmentsByDay.push({
      date: today,
      count: 1,
      timeSaved: TIME_SAVED_PER_SHIPMENT,
    });
  }

  // Mantener solo últimos 30 días
  stats.shipmentsByDay = stats.shipmentsByDay.slice(-30);

  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Error saving flash stats:', e);
  }
};

// ============================================
// UTILIDADES
// ============================================

const generateTemporaryGuide = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `LF${timestamp}${random}`;
};

const calculateEstimatedDelivery = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

export const formatTimeSaved = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} minutos`;
};

export const calculateMonthlySavings = (): {
  timeSavedHours: number;
  shipmentsThisMonth: number;
  estimatedMoneySaved: number;
} => {
  const stats = getFlashStats();
  const now = new Date();
  const thisMonth = stats.shipmentsByDay.filter((d) => {
    const date = new Date(d.date);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });

  const shipmentsThisMonth = thisMonth.reduce((sum, d) => sum + d.count, 0);
  const timeSavedSeconds = thisMonth.reduce((sum, d) => sum + d.timeSaved, 0);
  const timeSavedHours = timeSavedSeconds / 3600;

  // Estimación: $15,000 COP por hora de trabajo operativo ahorrado
  const estimatedMoneySaved = timeSavedHours * 15000;

  return {
    timeSavedHours,
    shipmentsThisMonth,
    estimatedMoneySaved,
  };
};
