// services/reportsService.ts
// Sistema de Reportes Avanzados para LITPER PRO

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// TIPOS E INTERFACES
// ============================================

export type ReportType =
  | 'sales_summary'
  | 'profit_loss'
  | 'advertising_performance'
  | 'delivery_analysis'
  | 'product_performance'
  | 'customer_insights'
  | 'inventory_status'
  | 'financial_forecast'
  | 'custom';

export type ReportFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'once';

export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json';

export interface ReportTemplate {
  id: string;
  type: ReportType;
  name: string;
  description: string;
  icon: string;
  sections: string[];
  defaultFilters: Record<string, any>;
  isBuiltIn: boolean;
}

export interface ScheduledReport {
  id: string;
  templateId: string;
  name: string;
  frequency: ReportFrequency;
  nextRunDate: string;
  lastRunDate?: string;
  recipients: string[];
  exportFormat: ExportFormat;
  filters: Record<string, any>;
  isActive: boolean;
  createdAt: string;
}

export interface GeneratedReport {
  id: string;
  templateId: string;
  name: string;
  type: ReportType;
  period: {
    start: string;
    end: string;
  };
  data: Record<string, any>;
  summary: string;
  highlights: ReportHighlight[];
  generatedAt: string;
  exportedFormats: ExportFormat[];
}

export interface ReportHighlight {
  type: 'positive' | 'negative' | 'neutral' | 'warning';
  title: string;
  value: string;
  change?: number;
  description: string;
}

export interface ReportFilter {
  id: string;
  name: string;
  type: 'date_range' | 'select' | 'multi_select' | 'number_range';
  options?: string[];
  defaultValue: any;
}

// ============================================
// TEMPLATES DE REPORTES PREDEFINIDOS
// ============================================

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'sales_summary',
    type: 'sales_summary',
    name: 'Resumen de Ventas',
    description: 'Análisis completo de ventas por período, producto y canal',
    icon: 'ShoppingCart',
    sections: ['ventas_totales', 'ventas_por_producto', 'ventas_por_canal', 'comparativa'],
    defaultFilters: { period: 'month', groupBy: 'day' },
    isBuiltIn: true,
  },
  {
    id: 'profit_loss',
    type: 'profit_loss',
    name: 'Estado de Resultados',
    description: 'P&L detallado con ingresos, costos y márgenes',
    icon: 'TrendingUp',
    sections: ['ingresos', 'costos', 'gastos_operativos', 'utilidad_neta', 'margenes'],
    defaultFilters: { period: 'month', compareWith: 'previous_period' },
    isBuiltIn: true,
  },
  {
    id: 'advertising_performance',
    type: 'advertising_performance',
    name: 'Rendimiento Publicitario',
    description: 'Análisis de campañas: ROAS, CPA, CTR por plataforma',
    icon: 'Megaphone',
    sections: ['inversion_total', 'roas_por_plataforma', 'cpa_analisis', 'mejores_campañas'],
    defaultFilters: { period: 'month', platforms: ['facebook', 'instagram', 'tiktok', 'google'] },
    isBuiltIn: true,
  },
  {
    id: 'delivery_analysis',
    type: 'delivery_analysis',
    name: 'Análisis de Entregas',
    description: 'Tasas de entrega, devoluciones y tiempos por zona',
    icon: 'Truck',
    sections: ['tasa_entrega', 'devoluciones', 'tiempos_promedio', 'zonas_criticas'],
    defaultFilters: { period: 'month', includeReturns: true },
    isBuiltIn: true,
  },
  {
    id: 'product_performance',
    type: 'product_performance',
    name: 'Rendimiento de Productos',
    description: 'Top productos, rotación y contribución a las ganancias',
    icon: 'Package',
    sections: ['top_productos', 'peor_rendimiento', 'rotacion', 'margen_por_producto'],
    defaultFilters: { period: 'month', topN: 10 },
    isBuiltIn: true,
  },
  {
    id: 'customer_insights',
    type: 'customer_insights',
    name: 'Insights de Clientes',
    description: 'Comportamiento de compra, LTV y segmentación',
    icon: 'Users',
    sections: ['nuevos_vs_recurrentes', 'ltv_promedio', 'frecuencia_compra', 'segmentos'],
    defaultFilters: { period: 'quarter' },
    isBuiltIn: true,
  },
  {
    id: 'financial_forecast',
    type: 'financial_forecast',
    name: 'Proyección Financiera',
    description: 'Predicciones basadas en tendencias históricas',
    icon: 'LineChart',
    sections: ['proyeccion_ventas', 'proyeccion_costos', 'escenarios', 'recomendaciones'],
    defaultFilters: { forecastMonths: 3, confidence: 0.8 },
    isBuiltIn: true,
  },
];

// ============================================
// DATOS DE EJEMPLO
// ============================================

const generateSampleReportData = (type: ReportType): Record<string, any> => {
  const baseData = {
    sales_summary: {
      totalSales: 45250000,
      ordersCount: 523,
      averageOrder: 86520,
      topProducts: [
        { name: 'Producto A', sales: 12500000, units: 145 },
        { name: 'Producto B', sales: 8750000, units: 98 },
        { name: 'Producto C', sales: 6200000, units: 72 },
      ],
      salesByChannel: {
        facebook: 18500000,
        instagram: 15200000,
        tiktok: 8550000,
        organic: 3000000,
      },
      dailyTrend: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        sales: Math.floor(Math.random() * 2000000) + 1000000,
      })),
    },
    profit_loss: {
      revenue: 45250000,
      costOfGoods: 27150000,
      grossProfit: 18100000,
      grossMargin: 0.40,
      operatingExpenses: {
        advertising: 8500000,
        fixedCosts: 3200000,
        tools: 450000,
        other: 350000,
      },
      operatingProfit: 5600000,
      operatingMargin: 0.124,
      netProfit: 5200000,
      netMargin: 0.115,
    },
    advertising_performance: {
      totalSpend: 8500000,
      totalRevenue: 35700000,
      overallROAS: 4.2,
      platforms: {
        facebook: { spend: 3500000, revenue: 15750000, roas: 4.5, cpa: 14500, conversions: 241 },
        instagram: { spend: 2800000, revenue: 11200000, roas: 4.0, cpa: 15200, conversions: 184 },
        tiktok: { spend: 1500000, revenue: 5850000, roas: 3.9, cpa: 18750, conversions: 80 },
        google: { spend: 700000, revenue: 2900000, roas: 4.1, cpa: 13700, conversions: 51 },
      },
      bestCampaigns: [
        { name: 'Promo Diciembre', platform: 'Facebook', roas: 5.8, spend: 1200000 },
        { name: 'Stories Black', platform: 'Instagram', roas: 5.2, spend: 800000 },
      ],
    },
    delivery_analysis: {
      totalOrders: 523,
      delivered: 445,
      inTransit: 38,
      returned: 40,
      deliveryRate: 0.851,
      returnRate: 0.076,
      averageDeliveryDays: 3.2,
      byRegion: {
        'Bogotá': { orders: 180, deliveryRate: 0.94, avgDays: 2.1 },
        'Medellín': { orders: 95, deliveryRate: 0.91, avgDays: 2.8 },
        'Cali': { orders: 72, deliveryRate: 0.88, avgDays: 3.2 },
        'Costa Caribe': { orders: 85, deliveryRate: 0.82, avgDays: 4.1 },
        'Otros': { orders: 91, deliveryRate: 0.75, avgDays: 4.8 },
      },
      problematicCities: ['Quibdó', 'Leticia', 'Mitú'],
    },
    product_performance: {
      topProducts: [
        { id: 1, name: 'Producto Estrella A', revenue: 12500000, margin: 0.42, units: 145, trend: 0.15 },
        { id: 2, name: 'Kit Premium B', revenue: 8750000, margin: 0.38, units: 98, trend: 0.08 },
        { id: 3, name: 'Combo C', revenue: 6200000, margin: 0.35, units: 72, trend: -0.02 },
      ],
      worstPerformers: [
        { id: 10, name: 'Producto X', revenue: 450000, margin: 0.12, units: 8, trend: -0.35 },
        { id: 11, name: 'Accesorio Y', revenue: 320000, margin: 0.18, units: 12, trend: -0.22 },
      ],
      categoryBreakdown: {
        'Categoría Principal': { revenue: 28500000, percentage: 0.63 },
        'Accesorios': { revenue: 10200000, percentage: 0.23 },
        'Combos': { revenue: 6550000, percentage: 0.14 },
      },
    },
    customer_insights: {
      totalCustomers: 487,
      newCustomers: 312,
      returningCustomers: 175,
      repeatRate: 0.36,
      averageLTV: 125000,
      averageOrdersPerCustomer: 1.4,
      segments: {
        'VIP': { count: 45, avgSpend: 285000, percentage: 0.09 },
        'Frecuente': { count: 130, avgSpend: 145000, percentage: 0.27 },
        'Ocasional': { count: 175, avgSpend: 78000, percentage: 0.36 },
        'Nuevo': { count: 137, avgSpend: 62000, percentage: 0.28 },
      },
    },
    financial_forecast: {
      nextMonth: {
        projectedRevenue: 48500000,
        projectedCosts: 29100000,
        projectedProfit: 6200000,
        confidence: 0.82,
      },
      nextQuarter: {
        projectedRevenue: 145000000,
        projectedCosts: 87000000,
        projectedProfit: 18500000,
        confidence: 0.75,
      },
      scenarios: {
        optimistic: { revenue: 52000000, profit: 7800000 },
        realistic: { revenue: 48500000, profit: 6200000 },
        pessimistic: { revenue: 42000000, profit: 4100000 },
      },
      recommendations: [
        'Aumentar inversión en Facebook Ads por mejor ROAS',
        'Considerar restricciones en zonas con alta devolución',
        'Preparar inventario para temporada alta',
      ],
    },
  };

  return baseData[type] || {};
};

const generateHighlights = (type: ReportType, data: Record<string, any>): ReportHighlight[] => {
  switch (type) {
    case 'sales_summary':
      return [
        { type: 'positive', title: 'Ventas Totales', value: '$45.2M', change: 12, description: 'vs mes anterior' },
        { type: 'positive', title: 'Ticket Promedio', value: '$86,520', change: 5, description: 'aumento sostenido' },
        { type: 'neutral', title: 'Órdenes', value: '523', change: 8, description: 'nuevas órdenes' },
      ];
    case 'profit_loss':
      return [
        { type: 'positive', title: 'Utilidad Neta', value: '$5.2M', change: 15, description: 'mejor mes del año' },
        { type: 'positive', title: 'Margen Bruto', value: '40%', change: 2, description: 'mejora en costos' },
        { type: 'warning', title: 'Gastos Ads', value: '$8.5M', change: 18, description: 'monitorear ROI' },
      ];
    case 'advertising_performance':
      return [
        { type: 'positive', title: 'ROAS General', value: '4.2x', change: 8, description: 'excelente rendimiento' },
        { type: 'positive', title: 'Mejor Plataforma', value: 'Facebook 4.5x', description: 'incrementar presupuesto' },
        { type: 'warning', title: 'CPA Promedio', value: '$15,200', change: -3, description: 'optimizar audiencias' },
      ];
    case 'delivery_analysis':
      return [
        { type: 'positive', title: 'Tasa de Entrega', value: '85.1%', change: 2, description: 'mejora continua' },
        { type: 'negative', title: 'Devoluciones', value: '7.6%', change: -1, description: 'zonas problemáticas' },
        { type: 'neutral', title: 'Tiempo Promedio', value: '3.2 días', description: 'dentro del objetivo' },
      ];
    default:
      return [];
  }
};

// ============================================
// STORE
// ============================================

interface ReportsState {
  templates: ReportTemplate[];
  scheduledReports: ScheduledReport[];
  generatedReports: GeneratedReport[];
  isGenerating: boolean;

  // Templates
  getTemplate: (id: string) => ReportTemplate | undefined;
  addCustomTemplate: (template: Omit<ReportTemplate, 'id' | 'isBuiltIn'>) => void;

  // Scheduled Reports
  scheduleReport: (report: Omit<ScheduledReport, 'id' | 'createdAt'>) => void;
  updateScheduledReport: (id: string, updates: Partial<ScheduledReport>) => void;
  deleteScheduledReport: (id: string) => void;
  toggleScheduledReport: (id: string) => void;

  // Generated Reports
  generateReport: (templateId: string, filters: Record<string, any>) => Promise<GeneratedReport>;
  deleteGeneratedReport: (id: string) => void;
  exportReport: (reportId: string, format: ExportFormat) => void;

  // Utilities
  getReportsByType: (type: ReportType) => GeneratedReport[];
  getRecentReports: (limit: number) => GeneratedReport[];
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useReportsStore = create<ReportsState>()(
  persist(
    (set, get) => ({
      templates: REPORT_TEMPLATES,
      scheduledReports: [],
      generatedReports: [],
      isGenerating: false,

      getTemplate: (id) => {
        return get().templates.find((t) => t.id === id);
      },

      addCustomTemplate: (template) => {
        const newTemplate: ReportTemplate = {
          ...template,
          id: generateId(),
          isBuiltIn: false,
        };
        set((state) => ({
          templates: [...state.templates, newTemplate],
        }));
      },

      scheduleReport: (report) => {
        const newReport: ScheduledReport = {
          ...report,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          scheduledReports: [...state.scheduledReports, newReport],
        }));
      },

      updateScheduledReport: (id, updates) => {
        set((state) => ({
          scheduledReports: state.scheduledReports.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        }));
      },

      deleteScheduledReport: (id) => {
        set((state) => ({
          scheduledReports: state.scheduledReports.filter((r) => r.id !== id),
        }));
      },

      toggleScheduledReport: (id) => {
        set((state) => ({
          scheduledReports: state.scheduledReports.map((r) =>
            r.id === id ? { ...r, isActive: !r.isActive } : r
          ),
        }));
      },

      generateReport: async (templateId, filters) => {
        set({ isGenerating: true });

        // Simular generación
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const template = get().getTemplate(templateId);
        if (!template) {
          set({ isGenerating: false });
          throw new Error('Template not found');
        }

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const data = generateSampleReportData(template.type);
        const highlights = generateHighlights(template.type, data);

        const report: GeneratedReport = {
          id: generateId(),
          templateId,
          name: `${template.name} - ${now.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}`,
          type: template.type,
          period: {
            start: startOfMonth.toISOString(),
            end: now.toISOString(),
          },
          data,
          summary: `Reporte generado el ${now.toLocaleString('es-CO')}. Incluye datos del período seleccionado con análisis detallado.`,
          highlights,
          generatedAt: now.toISOString(),
          exportedFormats: [],
        };

        set((state) => ({
          generatedReports: [report, ...state.generatedReports],
          isGenerating: false,
        }));

        return report;
      },

      deleteGeneratedReport: (id) => {
        set((state) => ({
          generatedReports: state.generatedReports.filter((r) => r.id !== id),
        }));
      },

      exportReport: (reportId, format) => {
        set((state) => ({
          generatedReports: state.generatedReports.map((r) =>
            r.id === reportId
              ? { ...r, exportedFormats: [...new Set([...r.exportedFormats, format])] }
              : r
          ),
        }));

        // En producción, aquí se generaría el archivo real
        console.log(`Exporting report ${reportId} as ${format}`);
      },

      getReportsByType: (type) => {
        return get().generatedReports.filter((r) => r.type === type);
      },

      getRecentReports: (limit) => {
        return get().generatedReports.slice(0, limit);
      },
    }),
    {
      name: 'litper-reports-store',
    }
  )
);

// ============================================
// HOOKS
// ============================================

export function useReports() {
  const store = useReportsStore();

  const activeScheduled = store.scheduledReports.filter((r) => r.isActive);
  const recentReports = store.getRecentReports(5);

  return {
    ...store,
    activeScheduled,
    recentReports,
  };
}

export default useReportsStore;
