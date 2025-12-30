/**
 * FinancialReport Skill
 *
 * Genera reportes financieros con análisis de rentabilidad
 */

import { DollarSign, TrendingUp, TrendingDown, PieChart, Download } from 'lucide-react';
import { Skill, SkillResult, SkillContext } from '../types';
import SkillsRegistry from '../SkillsRegistry';

export const FinancialReportSkill: Skill = {
  id: 'financial-report',
  name: 'Reporte Financiero',
  description: 'Genera análisis financiero con ganancias, costos y rentabilidad',
  category: 'finance',
  icon: DollarSign,
  version: '1.0.0',

  requiredParams: [],

  optionalParams: [
    {
      name: 'period',
      type: 'select',
      label: 'Período',
      options: [
        { value: 'today', label: 'Hoy' },
        { value: 'week', label: 'Esta semana' },
        { value: 'month', label: 'Este mes' },
        { value: 'quarter', label: 'Este trimestre' },
        { value: 'year', label: 'Este año' },
      ],
    },
    {
      name: 'breakdown',
      type: 'select',
      label: 'Desglose por',
      options: [
        { value: 'summary', label: 'Resumen general' },
        { value: 'carrier', label: 'Por transportadora' },
        { value: 'product', label: 'Por producto' },
        { value: 'city', label: 'Por ciudad' },
      ],
    },
  ],

  roles: ['admin'],

  keywords: [
    'financiero',
    'finanzas',
    'ganancias',
    'costos',
    'rentabilidad',
    'margen',
    'ingresos',
    'gastos',
    'balance',
    'dinero',
    'plata',
    'ventas',
    'facturado',
    'perdidas',
  ],

  examples: [
    'Reporte financiero del mes',
    'Cuánto hemos ganado hoy?',
    'Análisis de rentabilidad',
    'Balance de esta semana',
    'Ganancias por transportadora',
    'Cuál es el margen de ganancia?',
  ],

  async execute(params: Record<string, any>, context: SkillContext): Promise<SkillResult> {
    const { period = 'month', breakdown = 'summary' } = params;

    await new Promise(resolve => setTimeout(resolve, 700));

    const financialData = generateFinancialData(period, breakdown);

    const periodLabels: Record<string, string> = {
      today: 'Hoy',
      week: 'Esta semana',
      month: 'Este mes',
      quarter: 'Este trimestre',
      year: 'Este año',
    };

    const formatCurrency = (value: number) =>
      new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

    return {
      success: true,
      message: `Reporte financiero de ${periodLabels[period]}: Ganancia neta ${formatCurrency(financialData.netProfit)} (Margen: ${financialData.profitMargin}%)`,
      data: financialData,
      artifact: {
        type: 'table',
        title: `Reporte Financiero - ${periodLabels[period]}`,
        content: {
          columns: [
            { key: 'concept', label: 'Concepto', width: '45%' },
            { key: 'value', label: 'Valor', width: '30%' },
            { key: 'change', label: 'vs Anterior', width: '25%' },
          ],
          rows: [
            { concept: '💰 Total Facturado', value: formatCurrency(financialData.totalRevenue), change: `+${financialData.revenueChange}%` },
            { concept: '📦 Costo de Envíos', value: formatCurrency(financialData.shippingCosts), change: `${financialData.shippingChange}%` },
            { concept: '🚚 Fletes Pagados', value: formatCurrency(financialData.freightCosts), change: `${financialData.freightChange}%` },
            { concept: '↩️ Devoluciones', value: formatCurrency(financialData.returnCosts), change: `${financialData.returnChange}%` },
            { concept: '📊 Ganancia Bruta', value: formatCurrency(financialData.grossProfit), change: `+${financialData.grossChange}%` },
            { concept: '✅ Ganancia Neta', value: formatCurrency(financialData.netProfit), change: `+${financialData.netChange}%` },
            { concept: '📈 Margen de Ganancia', value: `${financialData.profitMargin}%`, change: `+${financialData.marginChange}%` },
          ],
          summary: {
            totalOrders: financialData.totalOrders,
            avgOrderValue: formatCurrency(financialData.avgOrderValue),
            profitPerOrder: formatCurrency(financialData.profitPerOrder),
          },
        },
      },
      suggestedActions: [
        {
          label: 'Ver por transportadora',
          skillId: 'financial-report',
          params: { period, breakdown: 'carrier' },
          icon: PieChart,
        },
        {
          label: 'Analizar costos',
          skillId: 'expense-analysis',
          params: { period },
          icon: TrendingDown,
        },
        {
          label: 'Exportar a Excel',
          skillId: 'export-data',
          params: { data: financialData, format: 'xlsx' },
          icon: Download,
        },
        {
          label: 'Ver tendencias',
          skillId: 'financial-trends',
          params: { period },
          icon: TrendingUp,
        },
      ],
    };
  },

  artifactType: 'table',
};

function generateFinancialData(period: string, breakdown: string) {
  const multiplier = period === 'today' ? 1 : period === 'week' ? 7 : period === 'month' ? 30 : period === 'quarter' ? 90 : 365;

  const baseOrders = 50 * multiplier;
  const avgOrderValue = 85000 + Math.random() * 30000;
  const totalRevenue = baseOrders * avgOrderValue;

  const shippingCosts = totalRevenue * 0.12;
  const freightCosts = totalRevenue * 0.08;
  const returnCosts = totalRevenue * 0.03;
  const grossProfit = totalRevenue - shippingCosts - freightCosts;
  const netProfit = grossProfit - returnCosts;
  const profitMargin = ((netProfit / totalRevenue) * 100).toFixed(1);

  return {
    totalOrders: Math.floor(baseOrders),
    totalRevenue: Math.floor(totalRevenue),
    shippingCosts: Math.floor(shippingCosts),
    freightCosts: Math.floor(freightCosts),
    returnCosts: Math.floor(returnCosts),
    grossProfit: Math.floor(grossProfit),
    netProfit: Math.floor(netProfit),
    profitMargin: parseFloat(profitMargin),
    avgOrderValue: Math.floor(avgOrderValue),
    profitPerOrder: Math.floor(netProfit / baseOrders),

    // Changes vs previous period
    revenueChange: (Math.random() * 15 + 5).toFixed(1),
    shippingChange: (Math.random() * 5 - 2).toFixed(1),
    freightChange: (Math.random() * 3 - 1).toFixed(1),
    returnChange: (Math.random() * 10 - 15).toFixed(1),
    grossChange: (Math.random() * 12 + 3).toFixed(1),
    netChange: (Math.random() * 10 + 5).toFixed(1),
    marginChange: (Math.random() * 3).toFixed(1),
  };
}

SkillsRegistry.register(FinancialReportSkill);

export default FinancialReportSkill;
