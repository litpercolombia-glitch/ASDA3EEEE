/**
 * ANALYTICS STORE
 *
 * Store centralizado para datos de analytics y metricas.
 *
 * USO:
 * import { useAnalyticsStore } from '@/stores/analyticsStore'
 *
 * const { metrics, predictions, fetchMetrics } = useAnalyticsStore()
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { STORAGE_KEYS } from '../constants';

// ============================================
// TIPOS
// ============================================

export interface DashboardMetrics {
  // Entregas
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  pendingDeliveries: number;
  deliveryRate: number;

  // Tiempos
  avgDeliveryTime: number;
  fastestDelivery: number;
  slowestDelivery: number;

  // Financiero
  totalRevenue: number;
  avgOrderValue: number;
  costPerDelivery: number;

  // Comparativo
  deliveryRateChange: number;
  revenueChange: number;
  volumeChange: number;
}

export interface Prediction {
  id: string;
  type: 'delivery' | 'demand' | 'risk';
  title: string;
  description: string;
  confidence: number;
  value: number | string;
  trend: 'up' | 'down' | 'stable';
  timestamp: Date;
}

export interface CarrierStats {
  carrier: string;
  totalShipments: number;
  deliveryRate: number;
  avgDeliveryTime: number;
  issues: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface CityStats {
  city: string;
  totalShipments: number;
  deliveryRate: number;
  avgDeliveryTime: number;
  topCarrier: string;
}

export interface DateRange {
  start: Date;
  end: Date;
  preset?: 'today' | '7days' | '30days' | '90days' | 'custom';
}

interface AnalyticsState {
  // Data
  metrics: DashboardMetrics | null;
  predictions: Prediction[];
  carrierStats: CarrierStats[];
  cityStats: CityStats[];

  // Filters
  dateRange: DateRange;

  // State
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Actions - Data
  setMetrics: (metrics: DashboardMetrics) => void;
  setPredictions: (predictions: Prediction[]) => void;
  setCarrierStats: (stats: CarrierStats[]) => void;
  setCityStats: (stats: CityStats[]) => void;

  // Actions - Filters
  setDateRange: (range: DateRange) => void;
  setDatePreset: (preset: DateRange['preset']) => void;

  // Actions - State
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Actions - Fetch (mock)
  fetchMetrics: () => Promise<void>;
  refreshData: () => Promise<void>;
}

// ============================================
// HELPERS
// ============================================

const getDateRangeFromPreset = (preset: DateRange['preset']): DateRange => {
  const end = new Date();
  let start = new Date();

  switch (preset) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case '7days':
      start.setDate(start.getDate() - 7);
      break;
    case '30days':
      start.setDate(start.getDate() - 30);
      break;
    case '90days':
      start.setDate(start.getDate() - 90);
      break;
    default:
      start.setDate(start.getDate() - 30);
  }

  return { start, end, preset };
};

// ============================================
// STORE
// ============================================

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      // Initial State
      metrics: null,
      predictions: [],
      carrierStats: [],
      cityStats: [],
      dateRange: getDateRangeFromPreset('30days'),
      isLoading: false,
      error: null,
      lastUpdated: null,

      // Actions - Data
      setMetrics: (metrics) =>
        set({
          metrics,
          lastUpdated: new Date(),
        }),

      setPredictions: (predictions) =>
        set({ predictions }),

      setCarrierStats: (stats) =>
        set({ carrierStats: stats }),

      setCityStats: (stats) =>
        set({ cityStats: stats }),

      // Actions - Filters
      setDateRange: (range) =>
        set({ dateRange: range }),

      setDatePreset: (preset) =>
        set({ dateRange: getDateRangeFromPreset(preset) }),

      // Actions - State
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      // Actions - Fetch
      fetchMetrics: async () => {
        set({ isLoading: true, error: null });

        try {
          // En produccion, esto seria una llamada al API
          // Simulamos datos para demo
          await new Promise((resolve) => setTimeout(resolve, 500));

          const mockMetrics: DashboardMetrics = {
            totalDeliveries: 1250,
            successfulDeliveries: 1100,
            failedDeliveries: 50,
            pendingDeliveries: 100,
            deliveryRate: 88,
            avgDeliveryTime: 2.5,
            fastestDelivery: 0.5,
            slowestDelivery: 7,
            totalRevenue: 125000000,
            avgOrderValue: 100000,
            costPerDelivery: 8500,
            deliveryRateChange: 2.5,
            revenueChange: 12.3,
            volumeChange: 8.7,
          };

          set({
            metrics: mockMetrics,
            isLoading: false,
            lastUpdated: new Date(),
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Error fetching metrics',
            isLoading: false,
          });
        }
      },

      refreshData: async () => {
        await get().fetchMetrics();
      },
    }),
    {
      name: STORAGE_KEYS.ANALYTICS_CACHE,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        dateRange: state.dateRange,
        lastUpdated: state.lastUpdated,
      }),
    }
  )
);

export default useAnalyticsStore;
