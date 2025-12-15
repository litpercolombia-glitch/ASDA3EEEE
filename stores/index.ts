/**
 * STORES INDEX
 *
 * Exportaciones centralizadas de todos los stores.
 *
 * USO:
 * import { useShipmentStore, useUIStore, useAnalyticsStore } from '@/stores'
 */

// ============================================
// STORES PRINCIPALES
// ============================================

// Autenticacion y usuario
export { useAuthStore } from './authStore';
export type { User, AuthState } from './authStore';

// Envios y guias
export { useShipmentStore } from './shipmentStore';
export type { ShipmentFilters, ShipmentMetrics } from './shipmentStore';

// UI y navegacion
export { useUIStore, useActiveTab, useTheme, useSidebar } from './uiStore';
export type { Theme, TabId, Notification, ModalConfig } from './uiStore';

// Analytics y metricas
export { useAnalyticsStore } from './analyticsStore';
export type { DashboardMetrics, Prediction, CarrierStats, CityStats, DateRange } from './analyticsStore';

// Asistente PRO
export { useProAssistantStore } from './proAssistantStore';

// ============================================
// HOOKS COMBINADOS
// ============================================

/**
 * Hook para acceder a multiples stores a la vez
 * Util para componentes que necesitan datos de varios stores
 */
export function useAppState() {
  const shipments = useShipmentStore((state) => state.shipments);
  const activeTab = useUIStore((state) => state.activeTab);
  const theme = useUIStore((state) => state.theme);
  const metrics = useAnalyticsStore((state) => state.metrics);

  return {
    shipments,
    activeTab,
    theme,
    metrics,
  };
}

/**
 * Hook para acciones globales
 */
export function useAppActions() {
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const addNotification = useUIStore((state) => state.addNotification);
  const setShipments = useShipmentStore((state) => state.setShipments);

  return {
    setActiveTab,
    addNotification,
    setShipments,
  };
}
