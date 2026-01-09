// stores/marketingStore.ts
// Store de Marketing Tracking

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdPlatform, AdAccount, Campaign, DashboardMetrics } from '../types/marketing.types';

interface MarketingState {
  // Conexiones
  connections: {
    meta: { isConnected: boolean; accessToken: string | null };
    google: { isConnected: boolean; accessToken: string | null };
    tiktok: { isConnected: boolean; accessToken: string | null };
  };

  // Cuentas y campañas
  accounts: AdAccount[];
  campaigns: Campaign[];

  // Métricas
  dashboardMetrics: DashboardMetrics | null;

  // Estado
  isLoading: boolean;
  lastSyncAt: Date | null;

  // Actions
  connectPlatform: (platform: AdPlatform, token: string) => void;
  disconnectPlatform: (platform: AdPlatform) => void;
  isConnected: (platform: AdPlatform) => boolean;
  addAccounts: (accounts: AdAccount[]) => void;
  setDashboardMetrics: (metrics: DashboardMetrics) => void;
}

const initialConnections = {
  meta: { isConnected: false, accessToken: null },
  google: { isConnected: false, accessToken: null },
  tiktok: { isConnected: false, accessToken: null },
};

export const useMarketingStore = create<MarketingState>()(
  persist(
    (set, get) => ({
      connections: initialConnections,
      accounts: [],
      campaigns: [],
      dashboardMetrics: null,
      isLoading: false,
      lastSyncAt: null,

      connectPlatform: (platform, token) => {
        set((state) => ({
          connections: {
            ...state.connections,
            [platform]: { isConnected: true, accessToken: token },
          },
        }));
      },

      disconnectPlatform: (platform) => {
        set((state) => ({
          connections: {
            ...state.connections,
            [platform]: initialConnections[platform],
          },
          accounts: state.accounts.filter((a) => a.platform !== platform),
        }));
      },

      isConnected: (platform) => get().connections[platform].isConnected,

      addAccounts: (newAccounts) => {
        set((state) => {
          const existingIds = new Set(state.accounts.map((a) => a.externalId));
          const filtered = newAccounts.filter((a) => !existingIds.has(a.externalId));
          return { accounts: [...state.accounts, ...filtered] };
        });
      },

      setDashboardMetrics: (metrics) => set({ dashboardMetrics: metrics, lastSyncAt: new Date() }),
    }),
    {
      name: 'litper-marketing-store',
      partialize: (state) => ({
        connections: state.connections,
        accounts: state.accounts,
      }),
    }
  )
);

// Hook para acceder a las métricas del dashboard
export const useMarketingMetrics = () => {
  return useMarketingStore((state) => ({
    metrics: state.dashboardMetrics,
    isLoading: state.isLoading,
    lastSyncAt: state.lastSyncAt,
    setMetrics: state.setDashboardMetrics,
  }));
};

export default useMarketingStore;
