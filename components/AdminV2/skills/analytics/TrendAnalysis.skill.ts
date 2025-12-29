/**
 * TrendAnalysis Skill - Analisis de tendencias
 * Muestra graficos de tendencias de entregas y ventas
 */

import { LineChart } from 'lucide-react';
import SkillsRegistry from '../SkillsRegistry';
import { Skill, SkillResult } from '../types';

// Mock data - en produccion conectar con Supabase
const getTrendData = async (dias: number) => {
  const today = new Date();
  const data = [];

  for (let i = dias - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Generate realistic looking data with some variance
    const baseEntregas = 45 + Math.floor(Math.random() * 20);
    const baseVentas = 1200000 + Math.floor(Math.random() * 500000);
    const baseTasa = 78 + Math.floor(Math.random() * 15);

    // Weekend effect (less on weekends)
    const dayOfWeek = date.getDay();
    const weekendMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 0.6 : 1;

    data.push({
      fecha: date.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' }),
      entregas: Math.round(baseEntregas * weekendMultiplier),
      ventas: Math.round(baseVentas * weekendMultiplier),
      tasaEntrega: Math.min(95, baseTasa),
    });
  }

  return data;
};

const TrendAnalysisSkill: Skill = {
  id: 'trend-analysis',
  name: 'Analisis de Tendencias',
  description: 'Muestra graficas de tendencias de entregas, ventas y metricas clave',
  category: 'analytics',
  icon: LineChart,
  keywords: [
    'tendencia', 'tendencias', 'grafica', 'graficas', 'historico',
    'evolucion', 'comparar', 'tiempo', 'crecimiento'
  ],
  examples: [
    'Muestra la tendencia de entregas',
    'Como han evolucionado las ventas?',
    'Grafica de los ultimos 30 dias',
    'Analisis de tendencias',
  ],
  requiredParams: [],
  optionalParams: [
    {
      name: 'dias',
      type: 'select',
      label: 'Periodo',
      options: [
        { value: '7', label: 'Ultimos 7 dias' },
        { value: '15', label: 'Ultimos 15 dias' },
        { value: '30', label: 'Ultimos 30 dias' },
      ],
    },
    {
      name: 'metrica',
      type: 'select',
      label: 'Metrica principal',
      options: [
        { value: 'entregas', label: 'Entregas' },
        { value: 'ventas', label: 'Ventas' },
        { value: 'tasaEntrega', label: 'Tasa de entrega' },
      ],
    },
  ],
  roles: ['admin', 'operator'],

  async execute(params): Promise<SkillResult> {
    try {
      const dias = parseInt(params.dias) || 15;
      const data = await getTrendData(dias);

      // Calculate trends
      const firstHalf = data.slice(0, Math.floor(data.length / 2));
      const secondHalf = data.slice(Math.floor(data.length / 2));

      const avgEntregasFirst = firstHalf.reduce((sum, d) => sum + d.entregas, 0) / firstHalf.length;
      const avgEntregasSecond = secondHalf.reduce((sum, d) => sum + d.entregas, 0) / secondHalf.length;
      const entregasTrend = ((avgEntregasSecond - avgEntregasFirst) / avgEntregasFirst * 100).toFixed(1);

      const avgVentasFirst = firstHalf.reduce((sum, d) => sum + d.ventas, 0) / firstHalf.length;
      const avgVentasSecond = secondHalf.reduce((sum, d) => sum + d.ventas, 0) / secondHalf.length;
      const ventasTrend = ((avgVentasSecond - avgVentasFirst) / avgVentasFirst * 100).toFixed(1);

      const avgTasaFirst = firstHalf.reduce((sum, d) => sum + d.tasaEntrega, 0) / firstHalf.length;
      const avgTasaSecond = secondHalf.reduce((sum, d) => sum + d.tasaEntrega, 0) / secondHalf.length;
      const tasaTrend = (avgTasaSecond - avgTasaFirst).toFixed(1);

      // Best and worst days
      const sortedByEntregas = [...data].sort((a, b) => b.entregas - a.entregas);
      const bestDay = sortedByEntregas[0];
      const worstDay = sortedByEntregas[sortedByEntregas.length - 1];

      // Totals
      const totalEntregas = data.reduce((sum, d) => sum + d.entregas, 0);
      const totalVentas = data.reduce((sum, d) => sum + d.ventas, 0);
      const promedioTasa = (data.reduce((sum, d) => sum + d.tasaEntrega, 0) / data.length).toFixed(1);

      let message = `📈 **Analisis de Tendencias - Ultimos ${dias} dias**\n\n`;

      message += `**Totales del periodo:**\n`;
      message += `• Entregas: ${totalEntregas} (${entregasTrend > '0' ? '+' : ''}${entregasTrend}% tendencia)\n`;
      message += `• Ventas: $${totalVentas.toLocaleString()} (${ventasTrend > '0' ? '+' : ''}${ventasTrend}% tendencia)\n`;
      message += `• Tasa promedio: ${promedioTasa}% (${tasaTrend > '0' ? '+' : ''}${tasaTrend}pp tendencia)\n\n`;

      message += `**Dias destacados:**\n`;
      message += `• Mejor dia: ${bestDay.fecha} con ${bestDay.entregas} entregas\n`;
      message += `• Peor dia: ${worstDay.fecha} con ${worstDay.entregas} entregas\n\n`;

      const trendEmoji = parseFloat(entregasTrend) > 0 ? '📈' : parseFloat(entregasTrend) < 0 ? '📉' : '➡️';
      message += `${trendEmoji} La tendencia general es ${parseFloat(entregasTrend) > 5 ? 'positiva' : parseFloat(entregasTrend) < -5 ? 'negativa' : 'estable'}.`;

      return {
        success: true,
        message,
        data: {
          chartData: data,
          trends: { entregas: entregasTrend, ventas: ventasTrend, tasa: tasaTrend },
          totals: { entregas: totalEntregas, ventas: totalVentas, tasa: promedioTasa },
        },
        artifact: {
          type: 'chart',
          title: `Tendencias - Ultimos ${dias} dias`,
          content: {
            type: 'line',
            data,
            series: [
              { key: 'entregas', name: 'Entregas' },
              { key: 'tasaEntrega', name: 'Tasa %' },
            ],
          },
        },
        suggestedActions: [
          { skillId: 'city-analysis', label: 'Analizar por ciudad' },
          { skillId: 'profit-analysis', label: 'Ver ganancias' },
        ],
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Error al analizar tendencias: ${error.message}`,
        error: error.message,
      };
    }
  },
};

// Auto-register
SkillsRegistry.register(TrendAnalysisSkill);

export default TrendAnalysisSkill;
