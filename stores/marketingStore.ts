// stores/marketingStore.ts
// Store de Zustand para el Sistema de Marketing Tracking

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AdPlatform,
  AdAccount,
  Campaign,
  AdSet,
  Ad,
  Sale,
  DashboardMetrics,
  MarketingFilters,
  AutomationRule,
  Expense,
  WebhookEndpoint,
  Pixel,
  UTMStats,
  SalesByPaymentMethod,
} from '../types/marketing.types';

// ============================================
// TIPOS DEL STORE
// ============================================

interface MarketingState {
  // ========== CONEXIONES ==========
  connections: {
    meta: {
      isConnected: boolean;
      accessToken: string | null;
      refreshToken: string | null;
      expiresAt: Date | null;
    };
    google: {
      isConnected: boolean;
      accessToken: string | null;
      refreshToken: string | null;
      expiresAt: Date | null;
    };
    tiktok: {
      isConnected: boolean;
      accessToken: string | null;
      refreshToken: string | null;
      expiresAt: Date | null;
    };
  };

  // ========== CUENTAS ==========
  accounts: AdAccount[];
  selectedAccountIds: string[];

  // ========== CAMPAÑAS ==========
  campaigns: Campaign[];
  adSets: AdSet[];
  ads: Ad[];
  selectedCampaignIds: string[];

  // ========== VENTAS ==========
  sales: Sale[];

  // ========== MÉTRICAS ==========
  dashboardMetrics: DashboardMetrics | null;
  utmStats: UTMStats[];
  salesByPaymentMethod: SalesByPaymentMethod[];

  // ========== CONFIGURACIÓN ==========
  filters: MarketingFilters;
  rules: AutomationRule[];
  expenses: Expense[];
  webhooks: WebhookEndpoint[];
  pixels: Pixel[];

  // ========== ESTADO UI ==========
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncAt: Date | null;
  error: string | null;

  // ========== ACTIONS - CONEXIONES ==========
  connectPlatform: (platform: AdPlatform, token: string, refreshToken?: string, expiresAt?: Date) => void;
  disconnectPlatform: (platform: AdPlatform) => void;
  isConnected: (platform: AdPlatform) => boolean;
  getConnectedPlatforms: () => AdPlatform[];

  // ========== ACTIONS - CUENTAS ==========
  setAccounts: (accounts: AdAccount[]) => void;
  addAccounts: (accounts: AdAccount[]) => void;
  toggleAccountSelection: (accountId: string) => void;
  selectAllAccounts: (platform?: AdPlatform) => void;
  deselectAllAccounts: () => void;

  // ========== ACTIONS - CAMPAÑAS ==========
  setCampaigns: (campaigns: Campaign[]) => void;
  updateCampaign: (campaignId: string, updates: Partial<Campaign>) => void;
  toggleCampaignSelection: (campaignId: string) => void;
  toggleCampaignStatus: (campaignId: string) => Promise<boolean>;

  // ========== ACTIONS - ADSETS Y ADS ==========
  setAdSets: (adSets: AdSet[]) => void;
  setAds: (ads: Ad[]) => void;

  // ========== ACTIONS - VENTAS ==========
  setSales: (sales: Sale[]) => void;
  addSale: (sale: Sale) => void;

  // ========== ACTIONS - MÉTRICAS ==========
  setDashboardMetrics: (metrics: DashboardMetrics) => void;
  setUTMStats: (stats: UTMStats[]) => void;
  setSalesByPaymentMethod: (data: SalesByPaymentMethod[]) => void;

  // ========== ACTIONS - FILTROS ==========
  setFilters: (filters: Partial<MarketingFilters>) => void;
  setDateRange: (start: Date, end: Date, preset?: string) => void;
  togglePlatformFilter: (platform: AdPlatform) => void;

  // ========== ACTIONS - REGLAS ==========
  setRules: (rules: AutomationRule[]) => void;
  addRule: (rule: AutomationRule) => void;
  updateRule: (ruleId: string, updates: Partial<AutomationRule>) => void;
  deleteRule: (ruleId: string) => void;
  toggleRule: (ruleId: string) => void;

  // ========== ACTIONS - GASTOS ==========
  setExpenses: (expenses: Expense[]) => void;
  addExpense: (expense: Expense) => void;
  deleteExpense: (expenseId: string) => void;

  // ========== ACTIONS - WEBHOOKS ==========
  setWebhooks: (webhooks: WebhookEndpoint[]) => void;
  addWebhook: (webhook: WebhookEndpoint) => void;
  toggleWebhook: (webhookId: string) => void;

  // ========== ACTIONS - PIXELS ==========
  setPixels: (pixels: Pixel[]) => void;
  addPixel: (pixel: Pixel) => void;
  togglePixel: (pixelId: string) => void;

  // ========== ACTIONS - UI ==========
  setLoading: (loading: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setError: (error: string | null) => void;
  setLastSync: (date: Date) => void;

  // ========== COMPUTED ==========
  getAccountsByPlatform: (platform: AdPlatform) => AdAccount[];
  getCampaignsByPlatform: (platform: AdPlatform) => Campaign[];
  getCampaignsByAccount: (accountId: string) => Campaign[];
  getTotalSpend: () => number;
  getTotalRevenue: () => number;
}

// ============================================
// VALORES INICIALES
// ============================================

const initialFilters: MarketingFilters = {
  dateRange: {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Últimos 7 días
    end: new Date(),
    preset: 'last_7_days',
  },
  platforms: ['meta', 'google', 'tiktok'],
  accounts: [],
};

const initialConnections = {
  meta: { isConnected: false, accessToken: null, refreshToken: null, expiresAt: null },
  google: { isConnected: false, accessToken: null, refreshToken: null, expiresAt: null },
  tiktok: { isConnected: false, accessToken: null, refreshToken: null, expiresAt: null },
};

// ============================================
// STORE
// ============================================

export const useMarketingStore = create<MarketingState>()(
  persist(
    (set, get) => ({
      // ========== ESTADO INICIAL ==========
      connections: initialConnections,
      accounts: [],
      selectedAccountIds: [],
      campaigns: [],
      adSets: [],
      ads: [],
      selectedCampaignIds: [],
      sales: [],
      dashboardMetrics: null,
      utmStats: [],
      salesByPaymentMethod: [],
      filters: initialFilters,
      rules: [],
      expenses: [],
      webhooks: [],
      pixels: [],
      isLoading: false,
      isSyncing: false,
      lastSyncAt: null,
      error: null,

      // ========== CONEXIONES ==========
      connectPlatform: (platform, token, refreshToken, expiresAt) => {
        set((state) => ({
          connections: {
            ...state.connections,
            [platform]: {
              isConnected: true,
              accessToken: token,
              refreshToken: refreshToken || null,
              expiresAt: expiresAt || null,
            },
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
          campaigns: state.campaigns.filter((c) => c.platform !== platform),
          adSets: state.adSets.filter((a) => {
            const campaign = state.campaigns.find((c) => c.id === a.campaignId);
            return campaign?.platform !== platform;
          }),
          ads: state.ads.filter((a) => {
            const campaign = state.campaigns.find((c) => c.id === a.campaignId);
            return campaign?.platform !== platform;
          }),
        }));
      },

      isConnected: (platform) => get().connections[platform].isConnected,

      getConnectedPlatforms: () => {
        const { connections } = get();
        const platforms: AdPlatform[] = [];
        if (connections.meta.isConnected) platforms.push('meta');
        if (connections.google.isConnected) platforms.push('google');
        if (connections.tiktok.isConnected) platforms.push('tiktok');
        return platforms;
      },

      // ========== CUENTAS ==========
      setAccounts: (accounts) => set({ accounts }),

      addAccounts: (newAccounts) => {
        set((state) => {
          const existingIds = new Set(state.accounts.map((a) => a.externalId));
          const filtered = newAccounts.filter((a) => !existingIds.has(a.externalId));
          return { accounts: [...state.accounts, ...filtered] };
        });
      },

      toggleAccountSelection: (accountId) => {
        set((state) => ({
          selectedAccountIds: state.selectedAccountIds.includes(accountId)
            ? state.selectedAccountIds.filter((id) => id !== accountId)
            : [...state.selectedAccountIds, accountId],
        }));
      },

      selectAllAccounts: (platform) => {
        const { accounts } = get();
        const filtered = platform ? accounts.filter((a) => a.platform === platform) : accounts;
        set({ selectedAccountIds: filtered.map((a) => a.id) });
      },

      deselectAllAccounts: () => set({ selectedAccountIds: [] }),

      // ========== CAMPAÑAS ==========
      setCampaigns: (campaigns) => set({ campaigns }),

      updateCampaign: (campaignId, updates) => {
        set((state) => ({
          campaigns: state.campaigns.map((c) =>
            c.id === campaignId ? { ...c, ...updates, updatedAt: new Date() } : c
          ),
        }));
      },

      toggleCampaignSelection: (campaignId) => {
        set((state) => ({
          selectedCampaignIds: state.selectedCampaignIds.includes(campaignId)
            ? state.selectedCampaignIds.filter((id) => id !== campaignId)
            : [...state.selectedCampaignIds, campaignId],
        }));
      },

      toggleCampaignStatus: async (campaignId) => {
        const campaign = get().campaigns.find((c) => c.id === campaignId);
        if (!campaign) return false;

        const newStatus = campaign.status === 'active' ? 'paused' : 'active';

        // TODO: Llamar a la API de la plataforma para cambiar el estado
        // Por ahora solo actualizamos localmente
        set((state) => ({
          campaigns: state.campaigns.map((c) =>
            c.id === campaignId ? { ...c, status: newStatus, updatedAt: new Date() } : c
          ),
        }));

        return true;
      },

      // ========== ADSETS Y ADS ==========
      setAdSets: (adSets) => set({ adSets }),
      setAds: (ads) => set({ ads }),

      // ========== VENTAS ==========
      setSales: (sales) => set({ sales }),

      addSale: (sale) => {
        set((state) => ({ sales: [sale, ...state.sales] }));
      },

      // ========== MÉTRICAS ==========
      setDashboardMetrics: (metrics) => set({ dashboardMetrics: metrics }),
      setUTMStats: (stats) => set({ utmStats: stats }),
      setSalesByPaymentMethod: (data) => set({ salesByPaymentMethod: data }),

      // ========== FILTROS ==========
      setFilters: (filters) => {
        set((state) => ({ filters: { ...state.filters, ...filters } }));
      },

      setDateRange: (start, end, preset) => {
        set((state) => ({
          filters: {
            ...state.filters,
            dateRange: { start, end, preset: preset as MarketingFilters['dateRange']['preset'] },
          },
        }));
      },

      togglePlatformFilter: (platform) => {
        set((state) => ({
          filters: {
            ...state.filters,
            platforms: state.filters.platforms.includes(platform)
              ? state.filters.platforms.filter((p) => p !== platform)
              : [...state.filters.platforms, platform],
          },
        }));
      },

      // ========== REGLAS ==========
      setRules: (rules) => set({ rules }),

      addRule: (rule) => {
        set((state) => ({ rules: [...state.rules, rule] }));
      },

      updateRule: (ruleId, updates) => {
        set((state) => ({
          rules: state.rules.map((r) => (r.id === ruleId ? { ...r, ...updates } : r)),
        }));
      },

      deleteRule: (ruleId) => {
        set((state) => ({ rules: state.rules.filter((r) => r.id !== ruleId) }));
      },

      toggleRule: (ruleId) => {
        set((state) => ({
          rules: state.rules.map((r) =>
            r.id === ruleId ? { ...r, isActive: !r.isActive } : r
          ),
        }));
      },

      // ========== GASTOS ==========
      setExpenses: (expenses) => set({ expenses }),

      addExpense: (expense) => {
        set((state) => ({ expenses: [expense, ...state.expenses] }));
      },

      deleteExpense: (expenseId) => {
        set((state) => ({ expenses: state.expenses.filter((e) => e.id !== expenseId) }));
      },

      // ========== WEBHOOKS ==========
      setWebhooks: (webhooks) => set({ webhooks }),

      addWebhook: (webhook) => {
        set((state) => ({ webhooks: [...state.webhooks, webhook] }));
      },

      toggleWebhook: (webhookId) => {
        set((state) => ({
          webhooks: state.webhooks.map((w) =>
            w.id === webhookId ? { ...w, isActive: !w.isActive } : w
          ),
        }));
      },

      // ========== PIXELS ==========
      setPixels: (pixels) => set({ pixels }),

      addPixel: (pixel) => {
        set((state) => ({ pixels: [...state.pixels, pixel] }));
      },

      togglePixel: (pixelId) => {
        set((state) => ({
          pixels: state.pixels.map((p) =>
            p.id === pixelId ? { ...p, isActive: !p.isActive } : p
          ),
        }));
      },

      // ========== UI ==========
      setLoading: (loading) => set({ isLoading: loading }),
      setSyncing: (syncing) => set({ isSyncing: syncing }),
      setError: (error) => set({ error }),
      setLastSync: (date) => set({ lastSyncAt: date }),

      // ========== COMPUTED ==========
      getAccountsByPlatform: (platform) => {
        return get().accounts.filter((a) => a.platform === platform);
      },

      getCampaignsByPlatform: (platform) => {
        return get().campaigns.filter((c) => c.platform === platform);
      },

      getCampaignsByAccount: (accountId) => {
        return get().campaigns.filter((c) => c.accountId === accountId);
      },

      getTotalSpend: () => {
        return get().campaigns.reduce((sum, c) => sum + c.metrics.spend, 0);
      },

      getTotalRevenue: () => {
        return get().campaigns.reduce((sum, c) => sum + c.metrics.revenue, 0);
      },
    }),
    {
      name: 'litper-marketing-store',
      partialize: (state) => ({
        // Solo persistir datos importantes
        connections: state.connections,
        accounts: state.accounts,
        selectedAccountIds: state.selectedAccountIds,
        filters: state.filters,
        rules: state.rules,
        webhooks: state.webhooks,
        pixels: state.pixels,
      }),
    }
  )
);

// ============================================
// HOOKS HELPER
// ============================================

export function useMarketingConnection(platform: AdPlatform) {
  const store = useMarketingStore();
  return {
    isConnected: store.connections[platform].isConnected,
    connect: (token: string, refreshToken?: string) => store.connectPlatform(platform, token, refreshToken),
    disconnect: () => store.disconnectPlatform(platform),
    accounts: store.getAccountsByPlatform(platform),
    campaigns: store.getCampaignsByPlatform(platform),
  };
}

export function useMarketingMetrics() {
  const store = useMarketingStore();
  return {
    metrics: store.dashboardMetrics,
    utmStats: store.utmStats,
    salesByPaymentMethod: store.salesByPaymentMethod,
    totalSpend: store.getTotalSpend(),
    totalRevenue: store.getTotalRevenue(),
    isLoading: store.isLoading,
    lastSync: store.lastSyncAt,
  };
}

export default useMarketingStore;
