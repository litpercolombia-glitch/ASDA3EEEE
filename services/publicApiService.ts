// services/publicApiService.ts
// API Pública LITPER - Endpoints, API Keys, Webhooks y Documentación

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// TIPOS E INTERFACES
// ============================================

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  type: 'live' | 'test';
  permissions: ApiPermission[];
  rateLimit: number; // requests per minute
  usageCount: number;
  lastUsed: string | null;
  createdAt: string;
  expiresAt: string | null;
  isActive: boolean;
}

export type ApiPermission =
  | 'guides:read'
  | 'guides:write'
  | 'finance:read'
  | 'finance:write'
  | 'reports:read'
  | 'reports:generate'
  | 'webhooks:manage'
  | 'settings:read';

export interface Webhook {
  id: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  isActive: boolean;
  lastTriggered: string | null;
  failureCount: number;
  createdAt: string;
}

export type WebhookEvent =
  | 'guide.created'
  | 'guide.updated'
  | 'guide.delivered'
  | 'guide.returned'
  | 'expense.created'
  | 'income.created'
  | 'report.generated'
  | 'alert.triggered';

export interface ApiUsageLog {
  id: string;
  apiKeyId: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  statusCode: number;
  responseTime: number;
  timestamp: string;
  ip?: string;
}

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  permission: ApiPermission;
  parameters?: ApiParameter[];
  requestBody?: ApiRequestBody;
  responses: ApiResponse[];
  example?: {
    request?: any;
    response: any;
  };
}

export interface ApiParameter {
  name: string;
  in: 'path' | 'query' | 'header';
  required: boolean;
  type: string;
  description: string;
}

export interface ApiRequestBody {
  contentType: string;
  schema: Record<string, any>;
}

export interface ApiResponse {
  status: number;
  description: string;
  schema?: Record<string, any>;
}

// ============================================
// CONSTANTES
// ============================================

export const PERMISSION_LABELS: Record<ApiPermission, string> = {
  'guides:read': 'Leer guías',
  'guides:write': 'Crear/editar guías',
  'finance:read': 'Leer datos financieros',
  'finance:write': 'Registrar ingresos/gastos',
  'reports:read': 'Ver reportes',
  'reports:generate': 'Generar reportes',
  'webhooks:manage': 'Gestionar webhooks',
  'settings:read': 'Leer configuración',
};

export const WEBHOOK_EVENT_LABELS: Record<WebhookEvent, string> = {
  'guide.created': 'Guía creada',
  'guide.updated': 'Guía actualizada',
  'guide.delivered': 'Guía entregada',
  'guide.returned': 'Guía devuelta',
  'expense.created': 'Gasto registrado',
  'income.created': 'Ingreso registrado',
  'report.generated': 'Reporte generado',
  'alert.triggered': 'Alerta disparada',
};

// ============================================
// ENDPOINTS DOCUMENTADOS
// ============================================

export const API_ENDPOINTS: ApiEndpoint[] = [
  // GUÍAS
  {
    method: 'GET',
    path: '/api/v1/guides',
    description: 'Listar todas las guías con filtros opcionales',
    permission: 'guides:read',
    parameters: [
      { name: 'status', in: 'query', required: false, type: 'string', description: 'Filtrar por estado (ENTREGADO, EN_TRANSITO, DEVUELTO)' },
      { name: 'carrier', in: 'query', required: false, type: 'string', description: 'Filtrar por transportadora' },
      { name: 'from_date', in: 'query', required: false, type: 'string', description: 'Fecha inicio (YYYY-MM-DD)' },
      { name: 'to_date', in: 'query', required: false, type: 'string', description: 'Fecha fin (YYYY-MM-DD)' },
      { name: 'limit', in: 'query', required: false, type: 'number', description: 'Límite de resultados (max 100)' },
      { name: 'offset', in: 'query', required: false, type: 'number', description: 'Offset para paginación' },
    ],
    responses: [
      { status: 200, description: 'Lista de guías', schema: { type: 'array', items: { '$ref': '#/Guide' } } },
      { status: 401, description: 'No autorizado' },
    ],
    example: {
      response: {
        success: true,
        data: [
          { id: 'G001', guideNumber: '123456789', status: 'ENTREGADO', carrier: 'Servientrega', city: 'Bogotá' }
        ],
        pagination: { total: 150, limit: 10, offset: 0 }
      }
    }
  },
  {
    method: 'GET',
    path: '/api/v1/guides/:id',
    description: 'Obtener detalle de una guía específica',
    permission: 'guides:read',
    parameters: [
      { name: 'id', in: 'path', required: true, type: 'string', description: 'ID o número de guía' },
    ],
    responses: [
      { status: 200, description: 'Detalle de la guía' },
      { status: 404, description: 'Guía no encontrada' },
    ],
    example: {
      response: {
        success: true,
        data: {
          id: 'G001',
          guideNumber: '123456789',
          status: 'ENTREGADO',
          carrier: 'Servientrega',
          city: 'Bogotá',
          recipient: 'Juan Pérez',
          phone: '3001234567',
          createdAt: '2024-01-15T10:30:00Z',
          deliveredAt: '2024-01-18T14:20:00Z',
          timeline: [
            { status: 'CREADO', date: '2024-01-15T10:30:00Z' },
            { status: 'EN_TRANSITO', date: '2024-01-16T08:00:00Z' },
            { status: 'ENTREGADO', date: '2024-01-18T14:20:00Z' }
          ]
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/api/v1/guides/track',
    description: 'Consultar estado de múltiples guías',
    permission: 'guides:read',
    requestBody: {
      contentType: 'application/json',
      schema: {
        type: 'object',
        properties: {
          guideNumbers: { type: 'array', items: { type: 'string' }, maxItems: 50 }
        }
      }
    },
    responses: [
      { status: 200, description: 'Estados de las guías' },
    ],
    example: {
      request: { guideNumbers: ['123456789', '987654321'] },
      response: {
        success: true,
        data: [
          { guideNumber: '123456789', status: 'ENTREGADO', lastUpdate: '2024-01-18T14:20:00Z' },
          { guideNumber: '987654321', status: 'EN_TRANSITO', lastUpdate: '2024-01-19T09:00:00Z' }
        ]
      }
    }
  },

  // FINANZAS
  {
    method: 'GET',
    path: '/api/v1/finance/summary',
    description: 'Obtener resumen financiero del período',
    permission: 'finance:read',
    parameters: [
      { name: 'month', in: 'query', required: false, type: 'string', description: 'Mes (YYYY-MM), default: mes actual' },
    ],
    responses: [
      { status: 200, description: 'Resumen financiero' },
    ],
    example: {
      response: {
        success: true,
        data: {
          month: '2024-01',
          grossSales: 15000000,
          netProfit: 3500000,
          margin: 23.3,
          totalOrders: 450,
          deliveryRate: 85.5,
          roas: 4.2,
          advertisingExpenses: 2000000,
          fixedExpenses: 500000
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/api/v1/finance/pnl',
    description: 'Obtener Estado de Pérdidas y Ganancias completo',
    permission: 'finance:read',
    parameters: [
      { name: 'month', in: 'query', required: false, type: 'string', description: 'Mes (YYYY-MM)' },
    ],
    responses: [
      { status: 200, description: 'P&L completo' },
    ],
    example: {
      response: {
        success: true,
        data: {
          period: '2024-01',
          income: { grossSales: 15000000, returns: -1200000, netSales: 13800000 },
          costOfSales: { products: 8000000, shipping: 1500000, commissions: 300000 },
          grossProfit: 4000000,
          operatingExpenses: { advertising: 2000000, fixed: 500000, variable: 200000 },
          netProfit: 1300000,
          kpis: { grossMargin: 29.0, netMargin: 9.4, roas: 7.5 }
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/api/v1/finance/expenses',
    description: 'Registrar un nuevo gasto',
    permission: 'finance:write',
    requestBody: {
      contentType: 'application/json',
      schema: {
        type: 'object',
        required: ['category', 'amount', 'description'],
        properties: {
          category: { type: 'string', enum: ['advertising_facebook', 'advertising_instagram', 'fixed_dropi', 'fixed_tools'] },
          amount: { type: 'number' },
          description: { type: 'string' },
          date: { type: 'string', format: 'date' }
        }
      }
    },
    responses: [
      { status: 201, description: 'Gasto creado' },
      { status: 400, description: 'Datos inválidos' },
    ],
    example: {
      request: {
        category: 'advertising_facebook',
        amount: 500000,
        description: 'Campaña Black Friday',
        date: '2024-01-15'
      },
      response: { success: true, data: { id: 'exp_123', message: 'Gasto registrado exitosamente' } }
    }
  },

  // REPORTES
  {
    method: 'GET',
    path: '/api/v1/reports/daily',
    description: 'Obtener reporte diario',
    permission: 'reports:read',
    parameters: [
      { name: 'date', in: 'query', required: false, type: 'string', description: 'Fecha (YYYY-MM-DD), default: hoy' },
    ],
    responses: [
      { status: 200, description: 'Reporte diario' },
    ],
    example: {
      response: {
        success: true,
        data: {
          date: '2024-01-15',
          orders: 45,
          delivered: 38,
          revenue: 2500000,
          topCarrier: 'Servientrega',
          alerts: []
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/api/v1/reports/weekly',
    description: 'Obtener reporte semanal',
    permission: 'reports:read',
    responses: [
      { status: 200, description: 'Reporte semanal' },
    ],
  },
  {
    method: 'GET',
    path: '/api/v1/reports/monthly',
    description: 'Obtener reporte mensual completo',
    permission: 'reports:read',
    parameters: [
      { name: 'month', in: 'query', required: false, type: 'string', description: 'Mes (YYYY-MM)' },
    ],
    responses: [
      { status: 200, description: 'Reporte mensual' },
    ],
  },

  // WEBHOOKS
  {
    method: 'GET',
    path: '/api/v1/webhooks',
    description: 'Listar webhooks configurados',
    permission: 'webhooks:manage',
    responses: [
      { status: 200, description: 'Lista de webhooks' },
    ],
  },
  {
    method: 'POST',
    path: '/api/v1/webhooks',
    description: 'Crear un nuevo webhook',
    permission: 'webhooks:manage',
    requestBody: {
      contentType: 'application/json',
      schema: {
        type: 'object',
        required: ['url', 'events'],
        properties: {
          url: { type: 'string', format: 'uri' },
          events: { type: 'array', items: { type: 'string' } }
        }
      }
    },
    responses: [
      { status: 201, description: 'Webhook creado' },
    ],
    example: {
      request: {
        url: 'https://mi-app.com/webhooks/litper',
        events: ['guide.delivered', 'guide.returned']
      },
      response: {
        success: true,
        data: {
          id: 'wh_123',
          secret: 'whsec_abc123...',
          message: 'Webhook creado. Guarda el secret para validar las solicitudes.'
        }
      }
    }
  },
  {
    method: 'DELETE',
    path: '/api/v1/webhooks/:id',
    description: 'Eliminar un webhook',
    permission: 'webhooks:manage',
    responses: [
      { status: 200, description: 'Webhook eliminado' },
      { status: 404, description: 'Webhook no encontrado' },
    ],
  },
];

// ============================================
// STORE
// ============================================

interface ApiState {
  apiKeys: ApiKey[];
  webhooks: Webhook[];
  usageLogs: ApiUsageLog[];

  // API Keys
  createApiKey: (name: string, type: 'live' | 'test', permissions: ApiPermission[]) => ApiKey;
  revokeApiKey: (id: string) => void;
  rotateApiKey: (id: string) => ApiKey | null;

  // Webhooks
  createWebhook: (url: string, events: WebhookEvent[]) => Webhook;
  updateWebhook: (id: string, updates: Partial<Webhook>) => void;
  deleteWebhook: (id: string) => void;
  testWebhook: (id: string) => Promise<boolean>;

  // Usage
  logUsage: (log: Omit<ApiUsageLog, 'id' | 'timestamp'>) => void;
  getUsageStats: (apiKeyId: string) => { total: number; byEndpoint: Record<string, number>; avgResponseTime: number };
}

const generateApiKey = (type: 'live' | 'test'): string => {
  const prefix = type === 'live' ? 'sk_live_' : 'sk_test_';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = prefix;
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateWebhookSecret = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'whsec_';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useApiStore = create<ApiState>()(
  persist(
    (set, get) => ({
      apiKeys: [],
      webhooks: [],
      usageLogs: [],

      createApiKey: (name, type, permissions) => {
        const newKey: ApiKey = {
          id: generateId(),
          name,
          key: generateApiKey(type),
          type,
          permissions,
          rateLimit: type === 'live' ? 100 : 20,
          usageCount: 0,
          lastUsed: null,
          createdAt: new Date().toISOString(),
          expiresAt: null,
          isActive: true,
        };
        set((state) => ({ apiKeys: [...state.apiKeys, newKey] }));
        return newKey;
      },

      revokeApiKey: (id) => {
        set((state) => ({
          apiKeys: state.apiKeys.map((k) =>
            k.id === id ? { ...k, isActive: false } : k
          ),
        }));
      },

      rotateApiKey: (id) => {
        const key = get().apiKeys.find((k) => k.id === id);
        if (!key) return null;

        const newKey = generateApiKey(key.type);
        set((state) => ({
          apiKeys: state.apiKeys.map((k) =>
            k.id === id ? { ...k, key: newKey } : k
          ),
        }));
        return { ...key, key: newKey };
      },

      createWebhook: (url, events) => {
        const webhook: Webhook = {
          id: generateId(),
          url,
          events,
          secret: generateWebhookSecret(),
          isActive: true,
          lastTriggered: null,
          failureCount: 0,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ webhooks: [...state.webhooks, webhook] }));
        return webhook;
      },

      updateWebhook: (id, updates) => {
        set((state) => ({
          webhooks: state.webhooks.map((w) =>
            w.id === id ? { ...w, ...updates } : w
          ),
        }));
      },

      deleteWebhook: (id) => {
        set((state) => ({
          webhooks: state.webhooks.filter((w) => w.id !== id),
        }));
      },

      testWebhook: async (id) => {
        const webhook = get().webhooks.find((w) => w.id === id);
        if (!webhook) return false;

        // Simular envío de test
        await new Promise((resolve) => setTimeout(resolve, 1000));

        set((state) => ({
          webhooks: state.webhooks.map((w) =>
            w.id === id ? { ...w, lastTriggered: new Date().toISOString() } : w
          ),
        }));

        return true;
      },

      logUsage: (log) => {
        const newLog: ApiUsageLog = {
          ...log,
          id: generateId(),
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          usageLogs: [...state.usageLogs.slice(-999), newLog],
          apiKeys: state.apiKeys.map((k) =>
            k.id === log.apiKeyId
              ? { ...k, usageCount: k.usageCount + 1, lastUsed: new Date().toISOString() }
              : k
          ),
        }));
      },

      getUsageStats: (apiKeyId) => {
        const logs = get().usageLogs.filter((l) => l.apiKeyId === apiKeyId);
        const byEndpoint: Record<string, number> = {};
        let totalResponseTime = 0;

        logs.forEach((log) => {
          byEndpoint[log.endpoint] = (byEndpoint[log.endpoint] || 0) + 1;
          totalResponseTime += log.responseTime;
        });

        return {
          total: logs.length,
          byEndpoint,
          avgResponseTime: logs.length > 0 ? totalResponseTime / logs.length : 0,
        };
      },
    }),
    {
      name: 'litper-api-store',
    }
  )
);

// ============================================
// HOOKS
// ============================================

export function useApi() {
  const store = useApiStore();

  return {
    ...store,
    endpoints: API_ENDPOINTS,
    permissionLabels: PERMISSION_LABELS,
    webhookEventLabels: WEBHOOK_EVENT_LABELS,
  };
}

export default useApiStore;
