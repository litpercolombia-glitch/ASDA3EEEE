/**
 * Executive Dashboard Store
 *
 * Zustand store para el estado del Dashboard Ejecutivo.
 * Maneja datos, filtros, configuración y actualizaciones en tiempo real.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ExecutiveKPIs,
  RevenueTrendData,
  DeliveryTrendData,
  OperationsFunnel,
  CarrierPerformance,
  CityPerformance,
  StatusDistribution,
  AlertsSummary,
  ActivityFeed,
  PerformanceComparison,
  DashboardFilters,
  PeriodType,
  RealTimeEvent,
  ExecutiveAlert,
} from '../types/executiveDashboard.types';
import { executiveDashboardService, PeriodCalculator } from '../services/executiveDashboardService';

// ============================================
// TIPOS DEL STORE
// ============================================

interface ExecutiveDashboardState {
  // Datos del Dashboard
  kpis: ExecutiveKPIs | null;
  revenueTrend: RevenueTrendData | null;
  deliveryTrend: DeliveryTrendData | null;
  operationsFunnel: OperationsFunnel | null;
  carrierPerformance: CarrierPerformance[];
  cityPerformance: CityPerformance[];
  statusDistribution: StatusDistribution | null;
  alertsSummary: AlertsSummary | null;
  activityFeed: ActivityFeed | null;
  comparison: PerformanceComparison | null;

  // Estado de UI
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastRefresh: Date | null;

  // Filtros activos
  filters: DashboardFilters;

  // Configuración
  autoRefresh: boolean;
  refreshInterval: number;
  compactMode: boolean;
  darkMode: boolean;
  visibleSections: string[];

  // Buffer de eventos en tiempo real
  realtimeBuffer: RealTimeEvent[];
  maxBufferSize: number;

  // Acciones
  loadDashboard: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  setFilters: (filters: Partial<DashboardFilters>) => void;
  setPeriod: (period: PeriodType) => void;
  setCustomDateRange: (start: Date, end: Date) => void;
  toggleAutoRefresh: () => void;
  setRefreshInterval: (seconds: number) => void;
  toggleCompactMode: () => void;
  toggleDarkMode: () => void;
  toggleSection: (sectionId: string) => void;
  addRealtimeEvent: (event: RealTimeEvent) => void;
  acknowledgeAlert: (alertId: string) => void;
  dismissAlert: (alertId: string) => void;
  clearError: () => void;
  reset: () => void;
}

// ============================================
// ESTADO INICIAL
// ============================================

const initialFilters: DashboardFilters = {
  period: 'last_7_days',
  carriers: [],
  cities: [],
  warehouses: [],
  channels: [],
};

const defaultVisibleSections = [
  'kpi_grid',
  'revenue_trend',
  'operations_funnel',
  'status_distribution',
  'carrier_performance',
  'alerts',
  'activity_feed',
];

// ============================================
// STORE
// ============================================

export const useExecutiveDashboardStore = create<ExecutiveDashboardState>()(
  persist(
    (set, get) => ({
      // Estado inicial de datos
      kpis: null,
      revenueTrend: null,
      deliveryTrend: null,
      operationsFunnel: null,
      carrierPerformance: [],
      cityPerformance: [],
      statusDistribution: null,
      alertsSummary: null,
      activityFeed: null,
      comparison: null,

      // Estado de UI
      isLoading: false,
      isRefreshing: false,
      error: null,
      lastRefresh: null,

      // Filtros
      filters: initialFilters,

      // Configuración
      autoRefresh: true,
      refreshInterval: 60, // 60 segundos
      compactMode: false,
      darkMode: true,
      visibleSections: defaultVisibleSections,

      // Buffer tiempo real
      realtimeBuffer: [],
      maxBufferSize: 100,

      // ============================================
      // ACCIONES DE CARGA DE DATOS
      // ============================================

      loadDashboard: async () => {
        const { filters, isLoading } = get();

        if (isLoading) return;

        set({ isLoading: true, error: null });

        try {
          const response = await executiveDashboardService.getDashboardData(filters);

          if (response.success) {
            set({
              kpis: response.data.kpis,
              revenueTrend: response.data.trends.revenue,
              deliveryTrend: response.data.trends.delivery,
              operationsFunnel: response.data.funnel,
              carrierPerformance: response.data.carriers,
              cityPerformance: response.data.cities,
              statusDistribution: response.data.statusDistribution,
              alertsSummary: response.data.alerts,
              comparison: response.data.comparison,
              lastRefresh: new Date(),
              isLoading: false,
            });

            // Cargar activity feed por separado
            const activityFeed = await executiveDashboardService.getActivityFeed(20);
            set({ activityFeed });
          }
        } catch (error) {
          console.error('Error loading executive dashboard:', error);
          set({
            error: error instanceof Error ? error.message : 'Error al cargar el dashboard',
            isLoading: false,
          });
        }
      },

      refreshDashboard: async () => {
        const { isRefreshing, loadDashboard } = get();

        if (isRefreshing) return;

        set({ isRefreshing: true });

        try {
          await loadDashboard();
        } finally {
          set({ isRefreshing: false });
        }
      },

      // ============================================
      // ACCIONES DE FILTROS
      // ============================================

      setFilters: (newFilters: Partial<DashboardFilters>) => {
        const { filters, loadDashboard } = get();
        set({ filters: { ...filters, ...newFilters } });
        loadDashboard();
      },

      setPeriod: (period: PeriodType) => {
        const { setFilters } = get();
        setFilters({ period, customRange: undefined });
      },

      setCustomDateRange: (start: Date, end: Date) => {
        const { setFilters } = get();
        setFilters({ period: 'custom', customRange: { start, end } });
      },

      // ============================================
      // ACCIONES DE CONFIGURACIÓN
      // ============================================

      toggleAutoRefresh: () => {
        set((state) => ({ autoRefresh: !state.autoRefresh }));
      },

      setRefreshInterval: (seconds: number) => {
        set({ refreshInterval: Math.max(30, Math.min(300, seconds)) });
      },

      toggleCompactMode: () => {
        set((state) => ({ compactMode: !state.compactMode }));
      },

      toggleDarkMode: () => {
        set((state) => ({ darkMode: !state.darkMode }));
      },

      toggleSection: (sectionId: string) => {
        set((state) => {
          const { visibleSections } = state;
          const isVisible = visibleSections.includes(sectionId);

          return {
            visibleSections: isVisible
              ? visibleSections.filter((id) => id !== sectionId)
              : [...visibleSections, sectionId],
          };
        });
      },

      // ============================================
      // ACCIONES DE TIEMPO REAL
      // ============================================

      addRealtimeEvent: (event: RealTimeEvent) => {
        set((state) => {
          const { realtimeBuffer, maxBufferSize, activityFeed } = state;

          // Agregar al buffer
          const newBuffer = [event, ...realtimeBuffer].slice(0, maxBufferSize);

          // Actualizar activity feed si existe
          let newActivityFeed = activityFeed;
          if (activityFeed) {
            newActivityFeed = {
              ...activityFeed,
              events: [event, ...activityFeed.events].slice(0, 20),
              stats: {
                ...activityFeed.stats,
                totalToday: activityFeed.stats.totalToday + 1,
                byType: {
                  ...activityFeed.stats.byType,
                  [event.type]: (activityFeed.stats.byType[event.type] || 0) + 1,
                },
              },
            };
          }

          return {
            realtimeBuffer: newBuffer,
            activityFeed: newActivityFeed,
          };
        });
      },

      // ============================================
      // ACCIONES DE ALERTAS
      // ============================================

      acknowledgeAlert: (alertId: string) => {
        set((state) => {
          if (!state.alertsSummary) return state;

          const updatedAlerts = state.alertsSummary.alerts.map((alert) =>
            alert.id === alertId ? { ...alert, status: 'acknowledged' as const } : alert
          );

          return {
            alertsSummary: {
              ...state.alertsSummary,
              alerts: updatedAlerts,
              acknowledgedCount: state.alertsSummary.acknowledgedCount + 1,
              pendingActionCount: Math.max(0, state.alertsSummary.pendingActionCount - 1),
            },
          };
        });
      },

      dismissAlert: (alertId: string) => {
        set((state) => {
          if (!state.alertsSummary) return state;

          const updatedAlerts = state.alertsSummary.alerts.map((alert) =>
            alert.id === alertId ? { ...alert, status: 'dismissed' as const } : alert
          );

          return {
            alertsSummary: {
              ...state.alertsSummary,
              alerts: updatedAlerts,
              total: state.alertsSummary.total - 1,
            },
          };
        });
      },

      // ============================================
      // ACCIONES DE UTILIDAD
      // ============================================

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set({
          kpis: null,
          revenueTrend: null,
          deliveryTrend: null,
          operationsFunnel: null,
          carrierPerformance: [],
          cityPerformance: [],
          statusDistribution: null,
          alertsSummary: null,
          activityFeed: null,
          comparison: null,
          isLoading: false,
          isRefreshing: false,
          error: null,
          lastRefresh: null,
          filters: initialFilters,
          realtimeBuffer: [],
        });
      },
    }),
    {
      name: 'executive-dashboard-store',
      partialize: (state) => ({
        filters: state.filters,
        autoRefresh: state.autoRefresh,
        refreshInterval: state.refreshInterval,
        compactMode: state.compactMode,
        darkMode: state.darkMode,
        visibleSections: state.visibleSections,
      }),
    }
  )
);

// ============================================
// SELECTORES
// ============================================

export const selectKPIs = (state: ExecutiveDashboardState) => state.kpis;
export const selectFinancialKPIs = (state: ExecutiveDashboardState) => state.kpis?.financial;
export const selectOperationsKPIs = (state: ExecutiveDashboardState) => state.kpis?.operations;
export const selectCustomerKPIs = (state: ExecutiveDashboardState) => state.kpis?.customer;
export const selectRiskKPIs = (state: ExecutiveDashboardState) => state.kpis?.risk;
export const selectMarketingKPIs = (state: ExecutiveDashboardState) => state.kpis?.marketing;
export const selectInventoryKPIs = (state: ExecutiveDashboardState) => state.kpis?.inventory;

export const selectTrends = (state: ExecutiveDashboardState) => ({
  revenue: state.revenueTrend,
  delivery: state.deliveryTrend,
});

export const selectCarrierPerformance = (state: ExecutiveDashboardState) => state.carrierPerformance;
export const selectCityPerformance = (state: ExecutiveDashboardState) => state.cityPerformance;
export const selectStatusDistribution = (state: ExecutiveDashboardState) => state.statusDistribution;
export const selectAlerts = (state: ExecutiveDashboardState) => state.alertsSummary;
export const selectActivityFeed = (state: ExecutiveDashboardState) => state.activityFeed;
export const selectComparison = (state: ExecutiveDashboardState) => state.comparison;

export const selectIsLoading = (state: ExecutiveDashboardState) => state.isLoading;
export const selectIsRefreshing = (state: ExecutiveDashboardState) => state.isRefreshing;
export const selectError = (state: ExecutiveDashboardState) => state.error;
export const selectLastRefresh = (state: ExecutiveDashboardState) => state.lastRefresh;

export const selectFilters = (state: ExecutiveDashboardState) => state.filters;
export const selectPeriod = (state: ExecutiveDashboardState) => state.filters.period;

export const selectConfig = (state: ExecutiveDashboardState) => ({
  autoRefresh: state.autoRefresh,
  refreshInterval: state.refreshInterval,
  compactMode: state.compactMode,
  darkMode: state.darkMode,
  visibleSections: state.visibleSections,
});

export const selectCriticalAlerts = (state: ExecutiveDashboardState) =>
  state.alertsSummary?.alerts.filter(
    (alert) => alert.severity === 'critical' || alert.severity === 'emergency'
  ) || [];

export const selectPendingAlerts = (state: ExecutiveDashboardState) =>
  state.alertsSummary?.alerts.filter((alert) => alert.status === 'new') || [];

// ============================================
// HOOK PERSONALIZADO CON AUTO-REFRESH
// ============================================

export const useExecutiveDashboardWithAutoRefresh = () => {
  const store = useExecutiveDashboardStore();

  // Efecto para auto-refresh (se debe usar en el componente)
  const startAutoRefresh = () => {
    if (!store.autoRefresh) return undefined;

    const interval = setInterval(() => {
      store.refreshDashboard();
    }, store.refreshInterval * 1000);

    return () => clearInterval(interval);
  };

  return {
    ...store,
    startAutoRefresh,
  };
};

export default useExecutiveDashboardStore;
