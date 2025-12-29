/**
 * DashboardMetrics Skill
 *
 * Muestra métricas generales del dashboard
 */

import { BarChart3, TrendingUp, Package, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import { Skill, SkillResult, SkillContext } from '../types';
import SkillsRegistry from '../SkillsRegistry';

export const DashboardMetricsSkill: Skill = {
  id: 'dashboard-metrics',
  name: 'Métricas del Dashboard',
  description: 'Muestra las métricas principales del negocio en tiempo real',
  category: 'analytics',
  icon: BarChart3,
  version: '1.0.0',

  requiredParams: [],

  optionalParams: [
    {
      name: 'period',
      type: 'select',
      label: 'Período',
      options: [
        { value: 'realtime', label: 'Tiempo real' },
        { value: 'today', label: 'Hoy' },
        { value: 'week', label: 'Esta semana' },
        { value: 'month', label: 'Este mes' },
      ],
    },
  ],

  roles: ['admin', 'operator', 'viewer'],

  keywords: [
    'dashboard',
    'metricas',
    'resumen',
    'overview',
    'estadisticas',
    'numeros',
    'kpi',
    'indicadores',
    'como va',
    'como estamos',
    'situacion',
  ],

  examples: [
    'Mostrar métricas del dashboard',
    'Cómo estamos hoy?',
    'Dame un resumen general',
    'Cuáles son los KPIs actuales?',
    'Estadísticas en tiempo real',
  ],

  async execute(params: Record<string, any>, context: SkillContext): Promise<SkillResult> {
    const { period = 'today' } = params;

    await new Promise(resolve => setTimeout(resolve, 400));

    const metrics = generateDashboardMetrics(period);
    const formatCurrency = (v: number) =>
      new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

    const periodLabels: Record<string, string> = {
      realtime: 'Tiempo Real',
      today: 'Hoy',
      week: 'Esta Semana',
      month: 'Este Mes',
    };

    return {
      success: true,
      message: `Dashboard ${periodLabels[period]}: ${metrics.totalOrders} pedidos, ${metrics.deliveryRate}% entregados, ${formatCurrency(metrics.revenue)} facturado`,
      data: metrics,
      artifact: {
        type: 'table',
        title: `Dashboard - ${periodLabels[period]}`,
        content: {
          columns: [
            { key: 'icon', label: '', width: '8%' },
            { key: 'metric', label: 'Métrica', width: '35%' },
            { key: 'value', label: 'Valor', width: '30%' },
            { key: 'trend', label: 'Tendencia', width: '27%' },
          ],
          rows: [
            { icon: '📦', metric: 'Total Pedidos', value: metrics.totalOrders.toLocaleString(), trend: `${metrics.ordersChange > 0 ? '↑' : '↓'} ${Math.abs(metrics.ordersChange)}%` },
            { icon: '✅', metric: 'Entregados', value: `${metrics.delivered} (${metrics.deliveryRate}%)`, trend: `${metrics.deliveryChange > 0 ? '↑' : '↓'} ${Math.abs(metrics.deliveryChange)}%` },
            { icon: '🚚', metric: 'En Tránsito', value: metrics.inTransit.toLocaleString(), trend: `${metrics.transitChange > 0 ? '↑' : '↓'} ${Math.abs(metrics.transitChange)}%` },
            { icon: '⏳', metric: 'Pendientes', value: metrics.pending.toLocaleString(), trend: `${metrics.pendingChange > 0 ? '↑' : '↓'} ${Math.abs(metrics.pendingChange)}%` },
            { icon: '↩️', metric: 'Devoluciones', value: `${metrics.returns} (${metrics.returnRate}%)`, trend: `${metrics.returnChange > 0 ? '↑' : '↓'} ${Math.abs(metrics.returnChange)}%` },
            { icon: '💰', metric: 'Facturado', value: formatCurrency(metrics.revenue), trend: `${metrics.revenueChange > 0 ? '↑' : '↓'} ${Math.abs(metrics.revenueChange)}%` },
            { icon: '📈', metric: 'Ganancia Neta', value: formatCurrency(metrics.profit), trend: `${metrics.profitChange > 0 ? '↑' : '↓'} ${Math.abs(metrics.profitChange)}%` },
            { icon: '⚡', metric: 'Tiempo Promedio', value: `${metrics.avgDeliveryTime} días`, trend: metrics.timeChange < 0 ? '✅ Mejorando' : '⚠️ Revisar' },
          ],
          summary: {
            lastUpdate: new Date().toLocaleString('es-CO'),
            healthScore: `${metrics.healthScore}/100`,
          },
        },
      },
      suggestedActions: [
        {
          label: 'Ver reporte financiero',
          skillId: 'financial-report',
          params: { period },
          icon: DollarSign,
        },
        {
          label: 'Analizar transportadoras',
          skillId: 'analyze-carrier',
          params: { dateRange: period },
          icon: TrendingUp,
        },
        {
          label: 'Ver pendientes',
          skillId: 'generate-report',
          params: { reportType: 'pending', dateRange: period },
          icon: Clock,
        },
        {
          label: 'Ver novedades',
          skillId: 'generate-report',
          params: { reportType: 'incidents', dateRange: period },
          icon: AlertTriangle,
        },
      ],
    };
  },

  artifactType: 'table',
};

function generateDashboardMetrics(period: string) {
  const multiplier = period === 'realtime' ? 0.3 : period === 'today' ? 1 : period === 'week' ? 7 : 30;

  const totalOrders = Math.floor(180 * multiplier);
  const delivered = Math.floor(totalOrders * 0.72);
  const inTransit = Math.floor(totalOrders * 0.18);
  const pending = Math.floor(totalOrders * 0.05);
  const returns = Math.floor(totalOrders * 0.05);

  return {
    totalOrders,
    delivered,
    inTransit,
    pending,
    returns,
    deliveryRate: ((delivered / totalOrders) * 100).toFixed(1),
    returnRate: ((returns / totalOrders) * 100).toFixed(1),
    revenue: Math.floor(totalOrders * 95000),
    profit: Math.floor(totalOrders * 25000),
    avgDeliveryTime: (1.5 + Math.random()).toFixed(1),
    healthScore: Math.floor(75 + Math.random() * 20),

    // Changes
    ordersChange: Math.floor(Math.random() * 20 - 5),
    deliveryChange: Math.floor(Math.random() * 10),
    transitChange: Math.floor(Math.random() * 10 - 5),
    pendingChange: Math.floor(Math.random() * 15 - 10),
    returnChange: Math.floor(Math.random() * 20 - 15),
    revenueChange: Math.floor(Math.random() * 15),
    profitChange: Math.floor(Math.random() * 12),
    timeChange: Math.random() > 0.5 ? -0.2 : 0.1,
  };
}

SkillsRegistry.register(DashboardMetricsSkill);

export default DashboardMetricsSkill;
