// services/mcpStitchService.ts
// MCP Stitch - Orquestador que conecta y unifica todas las integraciones MCP
// Permite flujos de datos entre plataformas (Stitch = coser/unir)

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useMCPStore, type ConnectionProvider, type Connection } from './mcpConnectionsService';

// ============================================
// TIPOS - STITCH PIPELINE
// ============================================

export type StitchNodeType = 'trigger' | 'action' | 'transform' | 'condition' | 'output';
export type StitchStatus = 'active' | 'paused' | 'error' | 'draft';
export type StitchRunStatus = 'running' | 'success' | 'failed' | 'partial';

export interface StitchNode {
  id: string;
  type: StitchNodeType;
  provider: ConnectionProvider | 'internal' | 'webhook';
  action: string;
  label: string;
  config: Record<string, any>;
  position: { x: number; y: number };
}

export interface StitchEdge {
  id: string;
  from: string;
  to: string;
  condition?: string;
}

export interface StitchPipeline {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: StitchStatus;
  nodes: StitchNode[];
  edges: StitchEdge[];
  schedule?: {
    type: 'cron' | 'interval' | 'event';
    value: string;
  };
  lastRun: string | null;
  runCount: number;
  successRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface StitchRun {
  id: string;
  pipelineId: string;
  pipelineName: string;
  status: StitchRunStatus;
  nodesExecuted: number;
  totalNodes: number;
  dataProcessed: number;
  startedAt: string;
  completedAt: string | null;
  error?: string;
  logs: StitchLogEntry[];
}

export interface StitchLogEntry {
  timestamp: string;
  nodeId: string;
  nodeLabel: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  data?: any;
}

export interface StitchTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  providers: ConnectionProvider[];
  pipeline: Omit<StitchPipeline, 'id' | 'createdAt' | 'updatedAt' | 'lastRun' | 'runCount' | 'successRate'>;
}

// ============================================
// PLANTILLAS PRE-CONSTRUIDAS
// ============================================

export const STITCH_TEMPLATES: StitchTemplate[] = [
  {
    id: 'ads-to-sheets',
    name: 'Ads -> Google Sheets',
    description: 'Sincroniza gastos de publicidad (Meta, Google, TikTok) a una hoja de cálculo automáticamente',
    icon: '📊',
    category: 'reporting',
    providers: ['meta_ads', 'google_ads', 'google_sheets'],
    pipeline: {
      name: 'Gastos Ads a Google Sheets',
      description: 'Recopila datos de gasto publicitario y los exporta a Google Sheets',
      icon: '📊',
      status: 'draft',
      nodes: [
        { id: 'n1', type: 'trigger', provider: 'internal', action: 'schedule', label: 'Cada día a las 8am', config: { cron: '0 8 * * *' }, position: { x: 0, y: 0 } },
        { id: 'n2', type: 'action', provider: 'meta_ads', action: 'get_spend', label: 'Obtener gastos Meta', config: { dateRange: 'yesterday' }, position: { x: 200, y: 0 } },
        { id: 'n3', type: 'action', provider: 'google_ads', action: 'get_spend', label: 'Obtener gastos Google', config: { dateRange: 'yesterday' }, position: { x: 200, y: 100 } },
        { id: 'n4', type: 'transform', provider: 'internal', action: 'merge', label: 'Unificar datos', config: { strategy: 'concat' }, position: { x: 400, y: 50 } },
        { id: 'n5', type: 'output', provider: 'google_sheets', action: 'append_row', label: 'Exportar a Sheets', config: { sheetName: 'Gastos Diarios' }, position: { x: 600, y: 50 } },
      ],
      edges: [
        { id: 'e1', from: 'n1', to: 'n2' },
        { id: 'e2', from: 'n1', to: 'n3' },
        { id: 'e3', from: 'n2', to: 'n4' },
        { id: 'e4', from: 'n3', to: 'n4' },
        { id: 'e5', from: 'n4', to: 'n5' },
      ],
      schedule: { type: 'cron', value: '0 8 * * *' },
    },
  },
  {
    id: 'dropi-to-whatsapp',
    name: 'Dropi -> WhatsApp',
    description: 'Notifica al cliente por WhatsApp cuando cambia el estado de su pedido en Dropi',
    icon: '💬',
    category: 'notifications',
    providers: ['dropi', 'whatsapp'],
    pipeline: {
      name: 'Notificaciones Dropi por WhatsApp',
      description: 'Envía alertas de cambio de estado via WhatsApp',
      icon: '💬',
      status: 'draft',
      nodes: [
        { id: 'n1', type: 'trigger', provider: 'dropi', action: 'order_status_change', label: 'Cambio de estado Dropi', config: {}, position: { x: 0, y: 0 } },
        { id: 'n2', type: 'condition', provider: 'internal', action: 'filter', label: 'Filtrar estados importantes', config: { statuses: ['shipped', 'delivered', 'returned'] }, position: { x: 200, y: 0 } },
        { id: 'n3', type: 'transform', provider: 'internal', action: 'template', label: 'Generar mensaje', config: { template: 'whatsapp_status_update' }, position: { x: 400, y: 0 } },
        { id: 'n4', type: 'output', provider: 'whatsapp', action: 'send_template', label: 'Enviar WhatsApp', config: { templateName: 'order_update' }, position: { x: 600, y: 0 } },
      ],
      edges: [
        { id: 'e1', from: 'n1', to: 'n2' },
        { id: 'e2', from: 'n2', to: 'n3' },
        { id: 'e3', from: 'n3', to: 'n4' },
      ],
      schedule: { type: 'event', value: 'dropi.order.status_changed' },
    },
  },
  {
    id: 'orders-to-alegra',
    name: 'Pedidos -> Alegra',
    description: 'Exporta pedidos entregados como facturas en Alegra Contabilidad automáticamente',
    icon: '🧾',
    category: 'accounting',
    providers: ['dropi', 'alegra'],
    pipeline: {
      name: 'Facturación automática en Alegra',
      description: 'Crea facturas en Alegra al entregar pedidos',
      icon: '🧾',
      status: 'draft',
      nodes: [
        { id: 'n1', type: 'trigger', provider: 'dropi', action: 'order_delivered', label: 'Pedido entregado', config: {}, position: { x: 0, y: 0 } },
        { id: 'n2', type: 'transform', provider: 'internal', action: 'map', label: 'Mapear a factura', config: { mapping: 'dropi_to_alegra_invoice' }, position: { x: 200, y: 0 } },
        { id: 'n3', type: 'output', provider: 'alegra', action: 'create_invoice', label: 'Crear factura Alegra', config: {}, position: { x: 400, y: 0 } },
      ],
      edges: [
        { id: 'e1', from: 'n1', to: 'n2' },
        { id: 'e2', from: 'n2', to: 'n3' },
      ],
      schedule: { type: 'event', value: 'dropi.order.delivered' },
    },
  },
  {
    id: 'n8n-sync',
    name: 'N8N Webhook Bridge',
    description: 'Conecta eventos de Litper con flujos de N8N para automatizaciones personalizadas',
    icon: '⚡',
    category: 'automation',
    providers: ['zapier'],
    pipeline: {
      name: 'Bridge N8N',
      description: 'Envía eventos a N8N webhooks',
      icon: '⚡',
      status: 'draft',
      nodes: [
        { id: 'n1', type: 'trigger', provider: 'internal', action: 'any_event', label: 'Cualquier evento Litper', config: { events: ['order.created', 'shipment.updated', 'delivery.completed'] }, position: { x: 0, y: 0 } },
        { id: 'n2', type: 'transform', provider: 'internal', action: 'format', label: 'Formatear payload', config: { format: 'n8n_webhook' }, position: { x: 200, y: 0 } },
        { id: 'n3', type: 'output', provider: 'webhook', action: 'post', label: 'Enviar a N8N', config: { url: '' }, position: { x: 400, y: 0 } },
      ],
      edges: [
        { id: 'e1', from: 'n1', to: 'n2' },
        { id: 'e2', from: 'n2', to: 'n3' },
      ],
      schedule: { type: 'event', value: 'litper.*' },
    },
  },
  {
    id: 'full-reporting',
    name: 'Reporte Integral Diario',
    description: 'Consolida datos de todas las fuentes y genera un reporte completo en Notion + Slack',
    icon: '📋',
    category: 'reporting',
    providers: ['meta_ads', 'google_ads', 'dropi', 'notion', 'slack'],
    pipeline: {
      name: 'Reporte Diario Integral',
      description: 'Genera reporte consolidado de ventas, envíos y publicidad',
      icon: '📋',
      status: 'draft',
      nodes: [
        { id: 'n1', type: 'trigger', provider: 'internal', action: 'schedule', label: 'Lunes a Viernes 7pm', config: { cron: '0 19 * * 1-5' }, position: { x: 0, y: 50 } },
        { id: 'n2', type: 'action', provider: 'dropi', action: 'get_daily_orders', label: 'Pedidos del día', config: {}, position: { x: 200, y: 0 } },
        { id: 'n3', type: 'action', provider: 'meta_ads', action: 'get_spend', label: 'Gasto Meta Ads', config: {}, position: { x: 200, y: 100 } },
        { id: 'n4', type: 'transform', provider: 'internal', action: 'report_builder', label: 'Construir reporte', config: { template: 'daily_full_report' }, position: { x: 400, y: 50 } },
        { id: 'n5', type: 'output', provider: 'notion', action: 'create_page', label: 'Guardar en Notion', config: { database: 'Reportes Diarios' }, position: { x: 600, y: 0 } },
        { id: 'n6', type: 'output', provider: 'slack', action: 'send_message', label: 'Notificar en Slack', config: { channel: '#reportes' }, position: { x: 600, y: 100 } },
      ],
      edges: [
        { id: 'e1', from: 'n1', to: 'n2' },
        { id: 'e2', from: 'n1', to: 'n3' },
        { id: 'e3', from: 'n2', to: 'n4' },
        { id: 'e4', from: 'n3', to: 'n4' },
        { id: 'e5', from: 'n4', to: 'n5' },
        { id: 'e6', from: 'n4', to: 'n6' },
      ],
      schedule: { type: 'cron', value: '0 19 * * 1-5' },
    },
  },
];

export const TEMPLATE_CATEGORIES: Record<string, string> = {
  reporting: 'Reportes',
  notifications: 'Notificaciones',
  accounting: 'Contabilidad',
  automation: 'Automatización',
  sync: 'Sincronización',
};

// ============================================
// STORE - STITCH
// ============================================

interface StitchState {
  pipelines: StitchPipeline[];
  runs: StitchRun[];
  isRunning: Record<string, boolean>;

  // Pipeline CRUD
  createPipeline: (pipeline: Omit<StitchPipeline, 'id' | 'createdAt' | 'updatedAt' | 'lastRun' | 'runCount' | 'successRate'>) => StitchPipeline;
  createFromTemplate: (templateId: string) => StitchPipeline | null;
  updatePipeline: (id: string, updates: Partial<StitchPipeline>) => void;
  deletePipeline: (id: string) => void;
  togglePipeline: (id: string) => void;

  // Ejecución
  runPipeline: (id: string) => Promise<StitchRun>;
  runAllActive: () => Promise<StitchRun[]>;

  // Consultas
  getPipelineRuns: (pipelineId: string) => StitchRun[];
  getActiveCount: () => number;
  getTotalRuns: () => number;
  getOverallSuccessRate: () => number;
}

const generateId = () => `stitch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useStitchStore = create<StitchState>()(
  persist(
    (set, get) => ({
      pipelines: [],
      runs: [],
      isRunning: {},

      createPipeline: (pipelineData) => {
        const pipeline: StitchPipeline = {
          ...pipelineData,
          id: generateId(),
          lastRun: null,
          runCount: 0,
          successRate: 100,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ pipelines: [...state.pipelines, pipeline] }));
        return pipeline;
      },

      createFromTemplate: (templateId) => {
        const template = STITCH_TEMPLATES.find((t) => t.id === templateId);
        if (!template) return null;
        return get().createPipeline(template.pipeline);
      },

      updatePipeline: (id, updates) => {
        set((state) => ({
          pipelines: state.pipelines.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },

      deletePipeline: (id) => {
        set((state) => ({
          pipelines: state.pipelines.filter((p) => p.id !== id),
          runs: state.runs.filter((r) => r.pipelineId !== id),
        }));
      },

      togglePipeline: (id) => {
        set((state) => ({
          pipelines: state.pipelines.map((p) =>
            p.id === id
              ? { ...p, status: p.status === 'active' ? 'paused' : 'active', updatedAt: new Date().toISOString() }
              : p
          ),
        }));
      },

      runPipeline: async (id) => {
        const pipeline = get().pipelines.find((p) => p.id === id);
        if (!pipeline) throw new Error('Pipeline not found');

        set((state) => ({ isRunning: { ...state.isRunning, [id]: true } }));

        const startedAt = new Date().toISOString();
        const logs: StitchLogEntry[] = [];
        const mcpConnections = useMCPStore.getState().connections;

        // Simular ejecución de cada nodo
        for (let i = 0; i < pipeline.nodes.length; i++) {
          const node = pipeline.nodes[i];
          await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 500));

          // Verificar si el provider está conectado
          if (node.provider !== 'internal' && node.provider !== 'webhook') {
            const providerConnection = mcpConnections.find(
              (c: Connection) => c.provider === node.provider && c.status === 'connected'
            );
            if (!providerConnection) {
              logs.push({
                timestamp: new Date().toISOString(),
                nodeId: node.id,
                nodeLabel: node.label,
                level: 'warning',
                message: `Provider ${node.provider} no conectado - usando datos simulados`,
              });
            }
          }

          logs.push({
            timestamp: new Date().toISOString(),
            nodeId: node.id,
            nodeLabel: node.label,
            level: 'success',
            message: `Nodo ejecutado: ${node.label}`,
            data: { recordsProcessed: Math.floor(Math.random() * 50) + 5 },
          });
        }

        const success = Math.random() > 0.1; // 90% success rate
        const run: StitchRun = {
          id: generateId(),
          pipelineId: id,
          pipelineName: pipeline.name,
          status: success ? 'success' : 'partial',
          nodesExecuted: pipeline.nodes.length,
          totalNodes: pipeline.nodes.length,
          dataProcessed: logs.reduce((acc, l) => acc + (l.data?.recordsProcessed || 0), 0),
          startedAt,
          completedAt: new Date().toISOString(),
          logs,
        };

        // Actualizar stats del pipeline
        const currentRuns = get().runs.filter((r) => r.pipelineId === id);
        const successCount = currentRuns.filter((r) => r.status === 'success').length + (success ? 1 : 0);
        const totalCount = currentRuns.length + 1;

        set((state) => ({
          runs: [...state.runs.slice(-199), run],
          isRunning: { ...state.isRunning, [id]: false },
          pipelines: state.pipelines.map((p) =>
            p.id === id
              ? {
                  ...p,
                  lastRun: new Date().toISOString(),
                  runCount: p.runCount + 1,
                  successRate: Math.round((successCount / totalCount) * 100),
                }
              : p
          ),
        }));

        return run;
      },

      runAllActive: async () => {
        const activePipelines = get().pipelines.filter((p) => p.status === 'active');
        const results: StitchRun[] = [];
        for (const pipeline of activePipelines) {
          try {
            const run = await get().runPipeline(pipeline.id);
            results.push(run);
          } catch {
            // Skip failed
          }
        }
        return results;
      },

      getPipelineRuns: (pipelineId) => {
        return get().runs.filter((r) => r.pipelineId === pipelineId).reverse();
      },

      getActiveCount: () => {
        return get().pipelines.filter((p) => p.status === 'active').length;
      },

      getTotalRuns: () => {
        return get().runs.length;
      },

      getOverallSuccessRate: () => {
        const runs = get().runs;
        if (runs.length === 0) return 100;
        const successCount = runs.filter((r) => r.status === 'success').length;
        return Math.round((successCount / runs.length) * 100);
      },
    }),
    {
      name: 'litper-stitch-store',
    }
  )
);

// ============================================
// HOOKS
// ============================================

export function useStitch() {
  const store = useStitchStore();
  return {
    ...store,
    templates: STITCH_TEMPLATES,
    templateCategories: TEMPLATE_CATEGORIES,
    activeCount: store.getActiveCount(),
    totalRuns: store.getTotalRuns(),
    successRate: store.getOverallSuccessRate(),
  };
}

export default useStitchStore;
