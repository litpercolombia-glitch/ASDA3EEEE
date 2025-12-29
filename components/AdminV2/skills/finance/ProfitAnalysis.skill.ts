/**
 * ProfitAnalysis Skill - Analisis de ganancias
 * Muestra ganancias, costos y rentabilidad
 */

import { TrendingUp } from 'lucide-react';
import SkillsRegistry from '../SkillsRegistry';
import { Skill, SkillResult } from '../types';

// Mock data - en produccion conectar con Supabase
const getProfitData = async (periodo: string) => {
  // Simulate different periods
  const baseData = {
    ingresos: 15250000,
    costoFletes: 4575000,
    costoProductos: 7625000,
    otrosGastos: 1200000,
    guiasEntregadas: 450,
    guiasDevueltas: 52,
    ticketPromedio: 33889,
  };

  // Adjust based on period
  const multiplier = periodo === 'semana' ? 0.25 : periodo === 'trimestre' ? 3 : 1;

  return {
    ingresos: Math.round(baseData.ingresos * multiplier),
    costoFletes: Math.round(baseData.costoFletes * multiplier),
    costoProductos: Math.round(baseData.costoProductos * multiplier),
    otrosGastos: Math.round(baseData.otrosGastos * multiplier),
    guiasEntregadas: Math.round(baseData.guiasEntregadas * multiplier),
    guiasDevueltas: Math.round(baseData.guiasDevueltas * multiplier),
    ticketPromedio: baseData.ticketPromedio,
    periodoAnterior: {
      ingresos: Math.round(baseData.ingresos * multiplier * 0.92),
      ganancia: Math.round((baseData.ingresos - baseData.costoFletes - baseData.costoProductos - baseData.otrosGastos) * multiplier * 0.88),
    }
  };
};

const ProfitAnalysisSkill: Skill = {
  id: 'profit-analysis',
  name: 'Analisis de Ganancias',
  description: 'Muestra ganancias, costos, margen y rentabilidad del negocio',
  category: 'finance',
  icon: TrendingUp,
  keywords: [
    'ganancia', 'ganancias', 'rentabilidad', 'margen', 'utilidad',
    'dinero', 'ingresos', 'costos', 'profit', 'cuanto gane'
  ],
  examples: [
    'Cual es mi ganancia del mes?',
    'Cuanto dinero he ganado?',
    'Muestra mi rentabilidad',
    'Analisis de ganancias',
  ],
  requiredParams: [],
  optionalParams: [
    {
      name: 'periodo',
      type: 'select',
      label: 'Periodo',
      options: [
        { value: 'semana', label: 'Esta semana' },
        { value: 'mes', label: 'Este mes' },
        { value: 'trimestre', label: 'Este trimestre' },
      ],
    },
  ],
  roles: ['admin'],

  async execute(params): Promise<SkillResult> {
    try {
      const periodo = params.periodo || 'mes';
      const data = await getProfitData(periodo);

      // Calculate metrics
      const costoTotal = data.costoFletes + data.costoProductos + data.otrosGastos;
      const gananciaTotal = data.ingresos - costoTotal;
      const margenBruto = ((data.ingresos - data.costoProductos) / data.ingresos * 100).toFixed(1);
      const margenNeto = (gananciaTotal / data.ingresos * 100).toFixed(1);
      const costoDevolucion = data.guiasDevueltas * 15000; // Costo estimado por devolucion
      const tasaDevolucion = (data.guiasDevueltas / (data.guiasEntregadas + data.guiasDevueltas) * 100).toFixed(1);

      // Comparison with previous period
      const cambioIngresos = ((data.ingresos - data.periodoAnterior.ingresos) / data.periodoAnterior.ingresos * 100).toFixed(1);
      const cambioGanancia = ((gananciaTotal - data.periodoAnterior.ganancia) / data.periodoAnterior.ganancia * 100).toFixed(1);

      const periodoLabel = periodo === 'semana' ? 'la semana' : periodo === 'trimestre' ? 'el trimestre' : 'el mes';

      let message = `💰 **Analisis de Ganancias - ${periodoLabel.charAt(0).toUpperCase() + periodoLabel.slice(1)}**\n\n`;

      message += `**Resumen Financiero:**\n`;
      message += `• Ingresos: $${data.ingresos.toLocaleString()} (${cambioIngresos > '0' ? '+' : ''}${cambioIngresos}%)\n`;
      message += `• Costos totales: $${costoTotal.toLocaleString()}\n`;
      message += `• **Ganancia neta: $${gananciaTotal.toLocaleString()}** (${cambioGanancia > '0' ? '+' : ''}${cambioGanancia}%)\n\n`;

      message += `**Margenes:**\n`;
      message += `• Margen bruto: ${margenBruto}%\n`;
      message += `• Margen neto: ${margenNeto}%\n\n`;

      message += `**Operaciones:**\n`;
      message += `• Guias entregadas: ${data.guiasEntregadas}\n`;
      message += `• Guias devueltas: ${data.guiasDevueltas} (${tasaDevolucion}%)\n`;
      message += `• Costo por devoluciones: $${costoDevolucion.toLocaleString()}\n`;
      message += `• Ticket promedio: $${data.ticketPromedio.toLocaleString()}\n`;

      return {
        success: true,
        message,
        data: {
          ...data,
          gananciaTotal,
          margenBruto,
          margenNeto,
          costoTotal,
          costoDevolucion,
        },
        artifact: {
          type: 'dashboard',
          title: 'Dashboard Financiero',
          content: {
            metrics: [
              {
                id: 'ingresos',
                label: 'Ingresos',
                value: data.ingresos,
                previousValue: data.periodoAnterior.ingresos,
                format: 'currency',
                icon: 'dollar',
                color: 'info',
              },
              {
                id: 'ganancia',
                label: 'Ganancia Neta',
                value: gananciaTotal,
                previousValue: data.periodoAnterior.ganancia,
                format: 'currency',
                icon: 'target',
                color: gananciaTotal > 0 ? 'success' : 'error',
              },
              {
                id: 'margen',
                label: 'Margen Neto',
                value: parseFloat(margenNeto),
                format: 'percent',
                icon: 'target',
                color: parseFloat(margenNeto) > 15 ? 'success' : 'warning',
              },
              {
                id: 'entregas',
                label: 'Guias Entregadas',
                value: data.guiasEntregadas,
                format: 'number',
                icon: 'package',
                color: 'default',
              },
              {
                id: 'ticket',
                label: 'Ticket Promedio',
                value: data.ticketPromedio,
                format: 'currency',
                icon: 'dollar',
                color: 'default',
              },
              {
                id: 'devolucion',
                label: 'Tasa Devolucion',
                value: parseFloat(tasaDevolucion),
                format: 'percent',
                icon: 'alert',
                color: parseFloat(tasaDevolucion) < 10 ? 'success' : 'error',
              },
            ],
          },
        },
        suggestedActions: [
          { skillId: 'financial-report', label: 'Reporte detallado' },
          { skillId: 'city-analysis', label: 'Analizar por ciudad' },
        ],
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Error al analizar ganancias: ${error.message}`,
        error: error.message,
      };
    }
  },
};

// Auto-register
SkillsRegistry.register(ProfitAnalysisSkill);

export default ProfitAnalysisSkill;
