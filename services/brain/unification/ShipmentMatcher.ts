// services/brain/unification/ShipmentMatcher.ts
// Encuentra coincidencias entre datos de Tracking y Dropi

import { DataSource } from '../types/brain.types';

export interface TrackingData {
  trackingNumber: string;
  carrier: string;
  status: string;
  lastUpdate: Date;
  location?: string;
  origin?: string;
  destination?: string;
  events?: Array<{
    date: Date;
    description: string;
    location?: string;
  }>;
  rawData?: unknown;
}

export interface DropiData {
  orderNumber: string;
  trackingNumber?: string;
  invoiceNumber?: string;
  carrier?: string;
  status?: string;
  customer: {
    name: string;
    phone?: string;
    email?: string;
    address: string;
    city: string;
    department?: string;
  };
  product: {
    name: string;
    quantity: number;
    value: number;
  };
  store?: string;
  createdAt: Date;
  rawData?: unknown;
}

export interface MatchResult {
  trackingData: TrackingData;
  dropiData: DropiData | null;
  matchConfidence: number;
  matchMethod: 'tracking_number' | 'fuzzy_match' | 'manual' | 'none';
  matchDetails: string;
}

class ShipmentMatcherService {
  /**
   * Buscar coincidencia para datos de tracking
   */
  findMatchForTracking(
    tracking: TrackingData,
    dropiDataList: DropiData[]
  ): MatchResult {
    // 1. Buscar por número de guía exacto
    const exactMatch = dropiDataList.find(
      d => d.trackingNumber === tracking.trackingNumber
    );

    if (exactMatch) {
      return {
        trackingData: tracking,
        dropiData: exactMatch,
        matchConfidence: 100,
        matchMethod: 'tracking_number',
        matchDetails: 'Coincidencia exacta por número de guía',
      };
    }

    // 2. Buscar por número de guía parcial (puede tener prefijos/sufijos diferentes)
    const partialMatch = dropiDataList.find(d => {
      if (!d.trackingNumber) return false;
      const trackClean = tracking.trackingNumber.replace(/\D/g, '');
      const dropiClean = d.trackingNumber.replace(/\D/g, '');
      return trackClean.includes(dropiClean) || dropiClean.includes(trackClean);
    });

    if (partialMatch) {
      return {
        trackingData: tracking,
        dropiData: partialMatch,
        matchConfidence: 85,
        matchMethod: 'fuzzy_match',
        matchDetails: 'Coincidencia parcial por número de guía',
      };
    }

    // 3. Buscar por ciudad destino + transportadora + fecha cercana
    const fuzzyMatches = dropiDataList.filter(d => {
      const sameCarrier = d.carrier?.toLowerCase() === tracking.carrier?.toLowerCase();
      const sameCity = this.normalizeCity(d.customer.city) ===
        this.normalizeCity(tracking.destination || '');
      const recentOrder = this.isDateClose(d.createdAt, tracking.lastUpdate, 7);

      return sameCarrier && sameCity && recentOrder;
    });

    if (fuzzyMatches.length === 1) {
      return {
        trackingData: tracking,
        dropiData: fuzzyMatches[0],
        matchConfidence: 60,
        matchMethod: 'fuzzy_match',
        matchDetails: 'Coincidencia por transportadora + ciudad + fecha',
      };
    }

    // No se encontró coincidencia
    return {
      trackingData: tracking,
      dropiData: null,
      matchConfidence: 0,
      matchMethod: 'none',
      matchDetails: 'Sin coincidencia encontrada',
    };
  }

  /**
   * Buscar coincidencia para datos de Dropi
   */
  findMatchForDropi(
    dropi: DropiData,
    trackingDataList: TrackingData[]
  ): MatchResult | null {
    // Si Dropi ya tiene número de guía, buscar directo
    if (dropi.trackingNumber) {
      const exactMatch = trackingDataList.find(
        t => t.trackingNumber === dropi.trackingNumber
      );

      if (exactMatch) {
        return {
          trackingData: exactMatch,
          dropiData: dropi,
          matchConfidence: 100,
          matchMethod: 'tracking_number',
          matchDetails: 'Coincidencia exacta por número de guía',
        };
      }
    }

    // Buscar por transportadora + ciudad
    const candidates = trackingDataList.filter(t => {
      if (dropi.carrier && t.carrier) {
        if (dropi.carrier.toLowerCase() !== t.carrier.toLowerCase()) return false;
      }
      if (t.destination) {
        if (this.normalizeCity(t.destination) !== this.normalizeCity(dropi.customer.city)) {
          return false;
        }
      }
      return true;
    });

    if (candidates.length === 1) {
      return {
        trackingData: candidates[0],
        dropiData: dropi,
        matchConfidence: 55,
        matchMethod: 'fuzzy_match',
        matchDetails: 'Coincidencia por transportadora + ciudad',
      };
    }

    return null;
  }

  /**
   * Hacer match masivo entre listas de tracking y dropi
   */
  matchBulk(
    trackingList: TrackingData[],
    dropiList: DropiData[]
  ): {
    matched: MatchResult[];
    unmatchedTracking: TrackingData[];
    unmatchedDropi: DropiData[];
  } {
    const matched: MatchResult[] = [];
    const unmatchedTracking: TrackingData[] = [];
    const usedDropiIndexes = new Set<number>();

    // Primero hacer match por número de guía exacto
    trackingList.forEach(tracking => {
      const dropiIndex = dropiList.findIndex(
        (d, i) => !usedDropiIndexes.has(i) && d.trackingNumber === tracking.trackingNumber
      );

      if (dropiIndex !== -1) {
        matched.push({
          trackingData: tracking,
          dropiData: dropiList[dropiIndex],
          matchConfidence: 100,
          matchMethod: 'tracking_number',
          matchDetails: 'Coincidencia exacta',
        });
        usedDropiIndexes.add(dropiIndex);
      }
    });

    // Luego intentar fuzzy match para los que no tienen coincidencia
    trackingList.forEach(tracking => {
      const alreadyMatched = matched.some(m => m.trackingData === tracking);
      if (alreadyMatched) return;

      const availableDropi = dropiList.filter((_, i) => !usedDropiIndexes.has(i));
      const result = this.findMatchForTracking(tracking, availableDropi);

      if (result.dropiData && result.matchConfidence >= 50) {
        const dropiIndex = dropiList.indexOf(result.dropiData);
        usedDropiIndexes.add(dropiIndex);
        matched.push(result);
      } else {
        unmatchedTracking.push(tracking);
      }
    });

    // Obtener dropi sin match
    const unmatchedDropi = dropiList.filter((_, i) => !usedDropiIndexes.has(i));

    return { matched, unmatchedTracking, unmatchedDropi };
  }

  /**
   * Calcular similitud entre dos strings
   */
  calculateStringSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 100;
    if (s1.includes(s2) || s2.includes(s1)) return 80;

    // Levenshtein simplificado
    const maxLen = Math.max(s1.length, s2.length);
    if (maxLen === 0) return 100;

    let matches = 0;
    const minLen = Math.min(s1.length, s2.length);
    for (let i = 0; i < minLen; i++) {
      if (s1[i] === s2[i]) matches++;
    }

    return Math.round((matches / maxLen) * 100);
  }

  /**
   * Normalizar nombre de ciudad
   */
  private normalizeCity(city: string): string {
    return city
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
      .replace(/[^a-z0-9]/g, '') // Solo alfanuméricos
      .trim();
  }

  /**
   * Verificar si dos fechas están cerca
   */
  private isDateClose(date1: Date, date2: Date, maxDaysDiff: number): boolean {
    const diffMs = Math.abs(date1.getTime() - date2.getTime());
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays <= maxDaysDiff;
  }

  /**
   * Match manual (cuando el usuario confirma)
   */
  manualMatch(tracking: TrackingData, dropi: DropiData): MatchResult {
    return {
      trackingData: tracking,
      dropiData: dropi,
      matchConfidence: 100,
      matchMethod: 'manual',
      matchDetails: 'Coincidencia confirmada manualmente',
    };
  }
}

// Singleton
export const shipmentMatcher = new ShipmentMatcherService();
export default shipmentMatcher;
