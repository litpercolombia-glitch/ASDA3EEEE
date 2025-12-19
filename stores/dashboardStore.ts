// stores/dashboardStore.ts
// Store para el dashboard analytics avanzado
import { create } from 'zustand';
import { subDays } from 'date-fns';

export interface DashboardMetrics {
  totalGuias: number;
  guiasEntregadas: number;
  guiasEnTransito: number;
  guiasConNovedad: number;
  guiasEnRetraso: number;
  tasaEntrega: number;
  tasaRetraso: number;
  tiempoCicloPromedio: number;
  otifScore: number;
  npsLogistico: number;
  costoPromedioPorEntrega: number;
  tasaPrimeraEntrega: number;
}

export interface TrendData {
  fecha: string;
  entregas: number;
  retrasos: number;
  novedades: number;
  satisfaccion: number;
}

export interface CarrierStats {
  nombre: string;
  totalGuias: number;
  entregadas: number;
  tasaEntrega: number;
  tiempoPromedio: number;
  retrasos: number;
}

export interface CityStats {
  ciudad: string;
  totalGuias: number;
  entregadas: number;
  novedades: number;
  tasaExito: number;
}

export interface StatusDistribution {
  delivered: number;
  in_transit: number;
  issue: number;
  in_office: number;
  returned: number;
}

interface DashboardState {
  // Filtros
  dateRange: { start: Date; end: Date };
  selectedCarrier: string | null;
  selectedCity: string | null;

  // Estado
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Datos
  metrics: DashboardMetrics | null;
  trends: TrendData[];
  carrierStats: CarrierStats[];
  cityStats: CityStats[];
  statusDistribution: StatusDistribution | null;

  // Acciones
  setDateRange: (range: { start: Date; end: Date }) => void;
  setSelectedCarrier: (carrier: string | null) => void;
  setSelectedCity: (city: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setMetrics: (metrics: DashboardMetrics) => void;
  setTrends: (trends: TrendData[]) => void;
  setCarrierStats: (stats: CarrierStats[]) => void;
  setCityStats: (stats: CityStats[]) => void;
  setStatusDistribution: (distribution: StatusDistribution) => void;
  resetFilters: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  // Estado inicial
  dateRange: {
    start: subDays(new Date(), 30),
    end: new Date(),
  },
  selectedCarrier: null,
  selectedCity: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
  metrics: null,
  trends: [],
  carrierStats: [],
  cityStats: [],
  statusDistribution: null,

  // Acciones
  setDateRange: (range) => set({ dateRange: range }),
  setSelectedCarrier: (carrier) => set({ selectedCarrier: carrier }),
  setSelectedCity: (city) => set({ selectedCity: city }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setMetrics: (metrics) => set({ metrics, lastUpdated: new Date() }),
  setTrends: (trends) => set({ trends }),
  setCarrierStats: (stats) => set({ carrierStats: stats }),
  setCityStats: (stats) => set({ cityStats: stats }),
  setStatusDistribution: (distribution) => set({ statusDistribution: distribution }),
  resetFilters: () => set({
    dateRange: { start: subDays(new Date(), 30), end: new Date() },
    selectedCarrier: null,
    selectedCity: null,
  }),
}));
