/**
 * SHIPMENT STORE
 *
 * Store centralizado para manejo de envios/guias.
 * Usa Zustand para estado global.
 *
 * USO:
 * import { useShipmentStore } from '@/stores/shipmentStore'
 *
 * const { shipments, selectedShipment, setShipments } = useShipmentStore()
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Shipment, ShipmentStatus } from '../types';
import { STORAGE_KEYS } from '../constants';

// ============================================
// TIPOS
// ============================================

export interface ShipmentFilters {
  status: ShipmentStatus[];
  carriers: string[];
  cities: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  search: string;
  riskLevel: ('low' | 'medium' | 'high')[];
}

export interface ShipmentMetrics {
  total: number;
  delivered: number;
  inTransit: number;
  inOffice: number;
  issues: number;
  pending: number;
  deliveryRate: number;
  avgDeliveryTime: number;
}

interface ShipmentState {
  // Data
  shipments: Shipment[];
  selectedShipment: Shipment | null;
  selectedShipmentIds: string[];

  // Filters
  filters: ShipmentFilters;

  // UI State
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Computed (cached)
  _metricsCache: ShipmentMetrics | null;

  // Actions - Data
  setShipments: (shipments: Shipment[]) => void;
  addShipments: (shipments: Shipment[]) => void;
  updateShipment: (id: string, updates: Partial<Shipment>) => void;
  removeShipment: (id: string) => void;
  clearShipments: () => void;

  // Actions - Selection
  selectShipment: (shipment: Shipment | null) => void;
  selectShipmentById: (id: string) => void;
  toggleShipmentSelection: (id: string) => void;
  selectAllShipments: () => void;
  clearSelection: () => void;

  // Actions - Filters
  setFilter: <K extends keyof ShipmentFilters>(key: K, value: ShipmentFilters[K]) => void;
  setFilters: (filters: Partial<ShipmentFilters>) => void;
  resetFilters: () => void;

  // Actions - State
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Getters
  getFilteredShipments: () => Shipment[];
  getMetrics: () => ShipmentMetrics;
  getShipmentById: (id: string) => Shipment | undefined;
  getShipmentsByStatus: (status: ShipmentStatus) => Shipment[];
}

// ============================================
// DEFAULT VALUES
// ============================================

const DEFAULT_FILTERS: ShipmentFilters = {
  status: [],
  carriers: [],
  cities: [],
  dateRange: {
    start: null,
    end: null,
  },
  search: '',
  riskLevel: [],
};

// ============================================
// HELPERS
// ============================================

const calculateMetrics = (shipments: Shipment[]): ShipmentMetrics => {
  const total = shipments.length;
  const delivered = shipments.filter((s) => s.status === ShipmentStatus.DELIVERED).length;
  const inTransit = shipments.filter((s) => s.status === ShipmentStatus.IN_TRANSIT).length;
  const inOffice = shipments.filter((s) => s.status === ShipmentStatus.IN_OFFICE).length;
  const issues = shipments.filter((s) => s.status === ShipmentStatus.ISSUE).length;
  const pending = shipments.filter((s) => s.status === ShipmentStatus.PENDING).length;

  const deliveredWithTime = shipments.filter(
    (s) => s.status === ShipmentStatus.DELIVERED && s.detailedInfo?.daysInTransit
  );
  const avgDeliveryTime =
    deliveredWithTime.length > 0
      ? deliveredWithTime.reduce((acc, s) => acc + (s.detailedInfo?.daysInTransit || 0), 0) /
        deliveredWithTime.length
      : 0;

  return {
    total,
    delivered,
    inTransit,
    inOffice,
    issues,
    pending,
    deliveryRate: total > 0 ? (delivered / total) * 100 : 0,
    avgDeliveryTime,
  };
};

const applyFilters = (shipments: Shipment[], filters: ShipmentFilters): Shipment[] => {
  return shipments.filter((shipment) => {
    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(shipment.status as ShipmentStatus)) {
      return false;
    }

    // Carrier filter
    if (filters.carriers.length > 0 && !filters.carriers.includes(shipment.carrier || '')) {
      return false;
    }

    // City filter
    if (filters.cities.length > 0) {
      const city = shipment.detailedInfo?.destination || '';
      if (!filters.cities.some((c) => city.toLowerCase().includes(c.toLowerCase()))) {
        return false;
      }
    }

    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const matchesId = shipment.id?.toLowerCase().includes(search);
      const matchesPhone = shipment.phone?.includes(search);
      const matchesCity = shipment.detailedInfo?.destination?.toLowerCase().includes(search);
      if (!matchesId && !matchesPhone && !matchesCity) {
        return false;
      }
    }

    // Risk level filter
    if (filters.riskLevel.length > 0) {
      const days = shipment.detailedInfo?.daysInTransit || 0;
      const hasIssue = shipment.status === ShipmentStatus.ISSUE;
      const level = hasIssue || days > 5 ? 'high' : days > 3 ? 'medium' : 'low';
      if (!filters.riskLevel.includes(level)) {
        return false;
      }
    }

    return true;
  });
};

// ============================================
// STORE
// ============================================

export const useShipmentStore = create<ShipmentState>()(
  persist(
    (set, get) => ({
      // Initial State
      shipments: [],
      selectedShipment: null,
      selectedShipmentIds: [],
      filters: DEFAULT_FILTERS,
      isLoading: false,
      error: null,
      lastUpdated: null,
      _metricsCache: null,

      // Actions - Data
      setShipments: (shipments) =>
        set({
          shipments,
          lastUpdated: new Date(),
          _metricsCache: null,
        }),

      addShipments: (newShipments) =>
        set((state) => {
          const existingIds = new Set(state.shipments.map((s) => s.id));
          const uniqueNew = newShipments.filter((s) => !existingIds.has(s.id));
          return {
            shipments: [...state.shipments, ...uniqueNew],
            lastUpdated: new Date(),
            _metricsCache: null,
          };
        }),

      updateShipment: (id, updates) =>
        set((state) => ({
          shipments: state.shipments.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
          selectedShipment:
            state.selectedShipment?.id === id
              ? { ...state.selectedShipment, ...updates }
              : state.selectedShipment,
          _metricsCache: null,
        })),

      removeShipment: (id) =>
        set((state) => ({
          shipments: state.shipments.filter((s) => s.id !== id),
          selectedShipment:
            state.selectedShipment?.id === id ? null : state.selectedShipment,
          selectedShipmentIds: state.selectedShipmentIds.filter((i) => i !== id),
          _metricsCache: null,
        })),

      clearShipments: () =>
        set({
          shipments: [],
          selectedShipment: null,
          selectedShipmentIds: [],
          _metricsCache: null,
        }),

      // Actions - Selection
      selectShipment: (shipment) => set({ selectedShipment: shipment }),

      selectShipmentById: (id) =>
        set((state) => ({
          selectedShipment: state.shipments.find((s) => s.id === id) || null,
        })),

      toggleShipmentSelection: (id) =>
        set((state) => ({
          selectedShipmentIds: state.selectedShipmentIds.includes(id)
            ? state.selectedShipmentIds.filter((i) => i !== id)
            : [...state.selectedShipmentIds, id],
        })),

      selectAllShipments: () =>
        set((state) => ({
          selectedShipmentIds: state.shipments.map((s) => s.id),
        })),

      clearSelection: () =>
        set({
          selectedShipment: null,
          selectedShipmentIds: [],
        }),

      // Actions - Filters
      setFilter: (key, value) =>
        set((state) => ({
          filters: { ...state.filters, [key]: value },
        })),

      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),

      resetFilters: () => set({ filters: DEFAULT_FILTERS }),

      // Actions - State
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      // Getters
      getFilteredShipments: () => {
        const state = get();
        return applyFilters(state.shipments, state.filters);
      },

      getMetrics: () => {
        const state = get();
        if (state._metricsCache) return state._metricsCache;
        const metrics = calculateMetrics(state.shipments);
        // Cache the result
        set({ _metricsCache: metrics });
        return metrics;
      },

      getShipmentById: (id) => {
        return get().shipments.find((s) => s.id === id);
      },

      getShipmentsByStatus: (status) => {
        return get().shipments.filter((s) => s.status === status);
      },
    }),
    {
      name: STORAGE_KEYS.SHIPMENTS_CACHE,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        shipments: state.shipments,
        lastUpdated: state.lastUpdated,
      }),
    }
  )
);

export default useShipmentStore;
