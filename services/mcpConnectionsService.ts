// services/mcpConnectionsService.ts
// MCP Connections - Integraciones con plataformas externas
// Meta Ads, Google Ads, TikTok Ads, Alegra, Google Sheets, Dropi, etc.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// TIPOS E INTERFACES
// ============================================

export type ConnectionProvider =
  | 'meta_ads'
  | 'google_ads'
  | 'tiktok_ads'
  | 'dropi'
  | 'alegra'
  | 'google_sheets'
  | 'whatsapp'
  | 'shopify'
  | 'woocommerce'
  | 'notion'
  | 'slack'
  | 'zapier'
  | 'make';

export type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'pending' | 'expired';

export interface Connection {
  id: string;
  provider: ConnectionProvider;
  name: string;
  status: ConnectionStatus;
  credentials?: {
    accessToken?: string;
    refreshToken?: string;
    apiKey?: string;
    accountId?: string;
    expiresAt?: string;
  };
  config: Record<string, any>;
  lastSync: string | null;
  syncFrequency: 'realtime' | 'hourly' | 'daily' | 'manual';
  syncEnabled: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface SyncLog {
  id: string;
  connectionId: string;
  type: 'import' | 'export' | 'sync';
  status: 'success' | 'error' | 'partial';
  recordsProcessed: number;
  recordsFailed: number;
  details?: string;
  duration: number;
  timestamp: string;
}

export interface ProviderInfo {
  id: ConnectionProvider;
  name: string;
  description: string;
  icon: string;
  category: 'advertising' | 'ecommerce' | 'accounting' | 'productivity' | 'communication' | 'automation';
  features: string[];
  authType: 'oauth' | 'apikey' | 'credentials';
  docsUrl?: string;
  isPopular?: boolean;
}

// ============================================
// PROVEEDORES DISPONIBLES
// ============================================

export const PROVIDERS: ProviderInfo[] = [
  // Publicidad
  {
    id: 'meta_ads',
    name: 'Meta Ads',
    description: 'Importa gastos y métricas de Facebook e Instagram Ads',
    icon: '📘',
    category: 'advertising',
    features: ['Importar gastos diarios', 'Sincronizar campañas', 'Métricas de rendimiento', 'ROAS automático'],
    authType: 'oauth',
    docsUrl: 'https://developers.facebook.com/docs/marketing-apis',
    isPopular: true,
  },
  {
    id: 'google_ads',
    name: 'Google Ads',
    description: 'Sincroniza campañas y gastos de Google Ads',
    icon: '🔍',
    category: 'advertising',
    features: ['Importar gastos', 'Sincronizar conversiones', 'Métricas por campaña', 'Keywords performance'],
    authType: 'oauth',
    docsUrl: 'https://developers.google.com/google-ads/api',
    isPopular: true,
  },
  {
    id: 'tiktok_ads',
    name: 'TikTok Ads',
    description: 'Conecta tu cuenta de TikTok Ads Manager',
    icon: '🎵',
    category: 'advertising',
    features: ['Importar gastos', 'Métricas de video', 'Audiencias', 'Conversiones'],
    authType: 'oauth',
    isPopular: true,
  },

  // E-commerce
  {
    id: 'dropi',
    name: 'Dropi',
    description: 'Sincronización automática con tu cuenta Dropi',
    icon: '📦',
    category: 'ecommerce',
    features: ['Sincronizar pedidos', 'Estados de guías', 'Inventario', 'Reportes automáticos'],
    authType: 'apikey',
    isPopular: true,
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Conecta tu tienda Shopify',
    icon: '🛒',
    category: 'ecommerce',
    features: ['Sincronizar pedidos', 'Productos', 'Clientes', 'Inventario'],
    authType: 'oauth',
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    description: 'Integra tu tienda WordPress/WooCommerce',
    icon: '🛍️',
    category: 'ecommerce',
    features: ['Pedidos', 'Productos', 'Clientes', 'Reportes'],
    authType: 'apikey',
  },

  // Contabilidad
  {
    id: 'alegra',
    name: 'Alegra',
    description: 'Exporta gastos e ingresos a Alegra Contabilidad',
    icon: '📊',
    category: 'accounting',
    features: ['Exportar facturas', 'Sincronizar gastos', 'Clientes', 'Productos'],
    authType: 'apikey',
    isPopular: true,
  },

  // Productividad
  {
    id: 'google_sheets',
    name: 'Google Sheets',
    description: 'Exporta reportes automáticamente a Google Sheets',
    icon: '📗',
    category: 'productivity',
    features: ['Exportar reportes', 'Sincronización automática', 'Plantillas', 'Dashboards'],
    authType: 'oauth',
    isPopular: true,
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Sincroniza datos con tu workspace de Notion',
    icon: '📝',
    category: 'productivity',
    features: ['Bases de datos', 'Documentación', 'Reportes', 'Tareas'],
    authType: 'oauth',
  },

  // Comunicación
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Envía notificaciones automáticas por WhatsApp',
    icon: '💬',
    category: 'communication',
    features: ['Notificaciones de estado', 'Mensajes masivos', 'Plantillas', 'Chatbot'],
    authType: 'apikey',
    isPopular: true,
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Recibe alertas y reportes en Slack',
    icon: '💼',
    category: 'communication',
    features: ['Alertas', 'Reportes diarios', 'Notificaciones', 'Comandos'],
    authType: 'oauth',
  },

  // Automatización
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Conecta con miles de apps via Zapier',
    icon: '⚡',
    category: 'automation',
    features: ['Triggers', 'Actions', 'Multi-step Zaps', 'Filtros'],
    authType: 'apikey',
  },
  {
    id: 'make',
    name: 'Make (Integromat)',
    description: 'Automatizaciones avanzadas con Make',
    icon: '🔄',
    category: 'automation',
    features: ['Scenarios', 'Webhooks', 'Data transformation', 'Scheduling'],
    authType: 'apikey',
  },
];

export const CATEGORY_LABELS: Record<string, string> = {
  advertising: 'Publicidad',
  ecommerce: 'E-commerce',
  accounting: 'Contabilidad',
  productivity: 'Productividad',
  communication: 'Comunicación',
  automation: 'Automatización',
};

// ============================================
// STORE
// ============================================

interface MCPState {
  connections: Connection[];
  syncLogs: SyncLog[];

  // Conexiones
  addConnection: (provider: ConnectionProvider, config: Record<string, any>) => Connection;
  updateConnection: (id: string, updates: Partial<Connection>) => void;
  deleteConnection: (id: string) => void;
  connectOAuth: (provider: ConnectionProvider) => Promise<string>; // Returns auth URL
  handleOAuthCallback: (provider: ConnectionProvider, code: string) => Promise<boolean>;
  disconnectProvider: (id: string) => void;

  // Sincronización
  syncConnection: (id: string) => Promise<SyncLog>;
  syncAll: () => Promise<SyncLog[]>;
  getSyncHistory: (connectionId: string) => SyncLog[];

  // Importación de datos
  importAdsData: (connectionId: string, dateRange: { from: string; to: string }) => Promise<any>;
  exportToAccounting: (connectionId: string, data: any) => Promise<boolean>;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useMCPStore = create<MCPState>()(
  persist(
    (set, get) => ({
      connections: [],
      syncLogs: [],

      addConnection: (provider, config) => {
        const providerInfo = PROVIDERS.find((p) => p.id === provider);
        const connection: Connection = {
          id: generateId(),
          provider,
          name: providerInfo?.name || provider,
          status: 'pending',
          config,
          lastSync: null,
          syncFrequency: 'daily',
          syncEnabled: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ connections: [...state.connections, connection] }));
        return connection;
      },

      updateConnection: (id, updates) => {
        set((state) => ({
          connections: state.connections.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
          ),
        }));
      },

      deleteConnection: (id) => {
        set((state) => ({
          connections: state.connections.filter((c) => c.id !== id),
          syncLogs: state.syncLogs.filter((l) => l.connectionId !== id),
        }));
      },

      connectOAuth: async (provider) => {
        // Simular generación de URL OAuth
        const baseUrls: Record<string, string> = {
          meta_ads: 'https://www.facebook.com/v18.0/dialog/oauth',
          google_ads: 'https://accounts.google.com/o/oauth2/v2/auth',
          google_sheets: 'https://accounts.google.com/o/oauth2/v2/auth',
          tiktok_ads: 'https://ads.tiktok.com/marketing_api/auth',
          shopify: 'https://{{shop}}.myshopify.com/admin/oauth/authorize',
        };

        const clientId = 'your_client_id';
        const redirectUri = 'https://app.litper.co/oauth/callback';
        const scope = 'ads_read,insights';

        return `${baseUrls[provider] || '#'}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
      },

      handleOAuthCallback: async (provider, code) => {
        // Simular intercambio de código por token
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const connection = get().connections.find((c) => c.provider === provider && c.status === 'pending');
        if (connection) {
          set((state) => ({
            connections: state.connections.map((c) =>
              c.id === connection.id
                ? {
                    ...c,
                    status: 'connected',
                    credentials: {
                      accessToken: `access_${generateId()}`,
                      refreshToken: `refresh_${generateId()}`,
                      expiresAt: new Date(Date.now() + 3600000).toISOString(),
                    },
                    updatedAt: new Date().toISOString(),
                  }
                : c
            ),
          }));
          return true;
        }
        return false;
      },

      disconnectProvider: (id) => {
        set((state) => ({
          connections: state.connections.map((c) =>
            c.id === id
              ? { ...c, status: 'disconnected', credentials: undefined, updatedAt: new Date().toISOString() }
              : c
          ),
        }));
      },

      syncConnection: async (id) => {
        const connection = get().connections.find((c) => c.id === id);
        if (!connection || connection.status !== 'connected') {
          throw new Error('Connection not found or not connected');
        }

        const startTime = Date.now();

        // Simular sincronización
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const log: SyncLog = {
          id: generateId(),
          connectionId: id,
          type: 'sync',
          status: 'success',
          recordsProcessed: Math.floor(Math.random() * 100) + 10,
          recordsFailed: Math.floor(Math.random() * 3),
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        };

        set((state) => ({
          syncLogs: [...state.syncLogs.slice(-99), log],
          connections: state.connections.map((c) =>
            c.id === id ? { ...c, lastSync: new Date().toISOString() } : c
          ),
        }));

        return log;
      },

      syncAll: async () => {
        const activeConnections = get().connections.filter(
          (c) => c.status === 'connected' && c.syncEnabled
        );
        const logs: SyncLog[] = [];

        for (const connection of activeConnections) {
          try {
            const log = await get().syncConnection(connection.id);
            logs.push(log);
          } catch (error) {
            // Log error
          }
        }

        return logs;
      },

      getSyncHistory: (connectionId) => {
        return get().syncLogs.filter((l) => l.connectionId === connectionId);
      },

      importAdsData: async (connectionId, dateRange) => {
        const connection = get().connections.find((c) => c.id === connectionId);
        if (!connection) throw new Error('Connection not found');

        // Simular importación de datos de ads
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Datos simulados
        const data = {
          provider: connection.provider,
          dateRange,
          campaigns: [
            { name: 'Campaña Black Friday', spend: 500000, impressions: 150000, clicks: 5000, conversions: 120 },
            { name: 'Remarketing', spend: 200000, impressions: 80000, clicks: 3200, conversions: 85 },
            { name: 'Prospecting', spend: 300000, impressions: 120000, clicks: 4000, conversions: 95 },
          ],
          totals: {
            spend: 1000000,
            impressions: 350000,
            clicks: 12200,
            conversions: 300,
            cpc: 82,
            cpa: 3333,
            roas: 4.5,
          },
        };

        return data;
      },

      exportToAccounting: async (connectionId, data) => {
        const connection = get().connections.find((c) => c.id === connectionId);
        if (!connection) throw new Error('Connection not found');

        // Simular exportación
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const log: SyncLog = {
          id: generateId(),
          connectionId,
          type: 'export',
          status: 'success',
          recordsProcessed: Object.keys(data).length,
          recordsFailed: 0,
          duration: 1000,
          timestamp: new Date().toISOString(),
        };

        set((state) => ({ syncLogs: [...state.syncLogs, log] }));

        return true;
      },
    }),
    {
      name: 'litper-mcp-store',
    }
  )
);

// ============================================
// HOOKS
// ============================================

export function useMCP() {
  const store = useMCPStore();

  const connectedCount = store.connections.filter((c) => c.status === 'connected').length;
  const pendingCount = store.connections.filter((c) => c.status === 'pending').length;

  return {
    ...store,
    providers: PROVIDERS,
    categoryLabels: CATEGORY_LABELS,
    connectedCount,
    pendingCount,
  };
}

export function useConnection(connectionId: string) {
  const store = useMCPStore();
  const connection = store.connections.find((c) => c.id === connectionId);
  const syncHistory = store.getSyncHistory(connectionId);

  return {
    connection,
    syncHistory,
    sync: () => store.syncConnection(connectionId),
    disconnect: () => store.disconnectProvider(connectionId),
    update: (updates: Partial<Connection>) => store.updateConnection(connectionId, updates),
  };
}

export default useMCPStore;
