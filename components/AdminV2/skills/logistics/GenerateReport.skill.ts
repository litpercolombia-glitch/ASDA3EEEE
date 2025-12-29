/**
 * GenerateReport Skill
 *
 * Genera reportes de envíos con diferentes filtros y formatos
 */

import { FileText, Download, Calendar, Filter } from 'lucide-react';
import { Skill, SkillResult, SkillContext } from '../types';
import SkillsRegistry from '../SkillsRegistry';

export const GenerateReportSkill: Skill = {
  id: 'generate-report',
  name: 'Generar Reporte',
  description: 'Genera reportes de envíos, entregas y novedades',
  category: 'logistics',
  icon: FileText,
  version: '1.0.0',

  requiredParams: [
    {
      name: 'reportType',
      type: 'select',
      label: 'Tipo de Reporte',
      options: [
        { value: 'deliveries', label: 'Entregas' },
        { value: 'pending', label: 'Pendientes' },
        { value: 'returns', label: 'Devoluciones' },
        { value: 'incidents', label: 'Novedades' },
        { value: 'summary', label: 'Resumen General' },
      ],
    },
  ],

  optionalParams: [
    {
      name: 'dateRange',
      type: 'select',
      label: 'Rango de Fechas',
      options: [
        { value: 'today', label: 'Hoy' },
        { value: 'yesterday', label: 'Ayer' },
        { value: 'week', label: 'Esta semana' },
        { value: 'month', label: 'Este mes' },
        { value: 'custom', label: 'Personalizado' },
      ],
    },
    {
      name: 'carrier',
      type: 'select',
      label: 'Transportadora',
      options: [
        { value: 'all', label: 'Todas' },
        { value: 'interrapidisimo', label: 'Interrapidísimo' },
        { value: 'coordinadora', label: 'Coordinadora' },
        { value: 'servientrega', label: 'Servientrega' },
        { value: 'envia', label: 'Envía' },
      ],
    },
  ],

  roles: ['admin', 'operator'],

  keywords: [
    'reporte',
    'report',
    'generar',
    'crear',
    'exportar',
    'entregas',
    'pendientes',
    'devoluciones',
    'novedades',
    'resumen',
    'hoy',
    'semana',
    'mes',
  ],

  examples: [
    'Generar reporte de entregas de hoy',
    'Reporte de devoluciones de esta semana',
    'Dame un resumen de pendientes',
    'Exportar novedades del mes',
    'Reporte de Coordinadora esta semana',
  ],

  async execute(params: Record<string, any>, context: SkillContext): Promise<SkillResult> {
    const { reportType = 'summary', dateRange = 'today', carrier = 'all' } = params;

    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 800));

    const reportData = generateMockReportData(reportType, dateRange, carrier);

    const reportTypeLabels: Record<string, string> = {
      deliveries: 'Entregas',
      pending: 'Pendientes',
      returns: 'Devoluciones',
      incidents: 'Novedades',
      summary: 'Resumen General',
    };

    const dateRangeLabels: Record<string, string> = {
      today: 'Hoy',
      yesterday: 'Ayer',
      week: 'Esta semana',
      month: 'Este mes',
    };

    return {
      success: true,
      message: `Reporte de ${reportTypeLabels[reportType]} - ${dateRangeLabels[dateRange]} generado exitosamente`,
      data: reportData,
      artifact: {
        type: 'table',
        title: `Reporte: ${reportTypeLabels[reportType]} (${dateRangeLabels[dateRange]})`,
        content: {
          columns: [
            { key: 'metric', label: 'Métrica', width: '50%' },
            { key: 'value', label: 'Valor', width: '25%' },
            { key: 'change', label: 'Cambio', width: '25%' },
          ],
          rows: reportData.metrics,
          summary: {
            generated: new Date().toLocaleString('es-CO'),
            totalRecords: reportData.totalRecords,
          },
        },
      },
      suggestedActions: [
        {
          label: 'Exportar a Excel',
          skillId: 'export-data',
          params: { format: 'xlsx', data: reportData },
          icon: Download,
        },
        {
          label: 'Ver detalle por transportadora',
          skillId: 'analyze-carrier',
          params: { dateRange },
        },
        {
          label: 'Generar otro reporte',
          skillId: 'generate-report',
        },
      ],
    };
  },

  artifactType: 'table',
};

function generateMockReportData(reportType: string, dateRange: string, carrier: string) {
  const baseMultiplier = dateRange === 'today' ? 1 : dateRange === 'week' ? 7 : 30;

  const reports: Record<string, any> = {
    deliveries: {
      totalRecords: Math.floor(150 * baseMultiplier),
      metrics: [
        { metric: 'Total Entregas', value: Math.floor(150 * baseMultiplier), change: '+12%' },
        { metric: 'Entregas Exitosas', value: Math.floor(135 * baseMultiplier), change: '+15%' },
        { metric: 'Tasa de Éxito', value: '90%', change: '+3%' },
        { metric: 'Tiempo Promedio', value: '2.3 días', change: '-0.5 días' },
        { metric: 'Entregas a Tiempo', value: '87%', change: '+5%' },
      ],
    },
    pending: {
      totalRecords: Math.floor(45 * baseMultiplier),
      metrics: [
        { metric: 'Total Pendientes', value: Math.floor(45 * baseMultiplier), change: '-8%' },
        { metric: 'En Tránsito', value: Math.floor(30 * baseMultiplier), change: '-5%' },
        { metric: 'En Bodega', value: Math.floor(10 * baseMultiplier), change: '-10%' },
        { metric: 'Programados', value: Math.floor(5 * baseMultiplier), change: '+2%' },
        { metric: 'Días Promedio Pendiente', value: '1.8 días', change: '-0.3 días' },
      ],
    },
    returns: {
      totalRecords: Math.floor(15 * baseMultiplier),
      metrics: [
        { metric: 'Total Devoluciones', value: Math.floor(15 * baseMultiplier), change: '-20%' },
        { metric: 'Por Dirección Incorrecta', value: Math.floor(5 * baseMultiplier), change: '-15%' },
        { metric: 'Por Rechazo Cliente', value: Math.floor(6 * baseMultiplier), change: '-25%' },
        { metric: 'Por Daño', value: Math.floor(2 * baseMultiplier), change: '-10%' },
        { metric: 'Tasa de Devolución', value: '10%', change: '-2%' },
      ],
    },
    incidents: {
      totalRecords: Math.floor(25 * baseMultiplier),
      metrics: [
        { metric: 'Total Novedades', value: Math.floor(25 * baseMultiplier), change: '-15%' },
        { metric: 'Retrasos', value: Math.floor(12 * baseMultiplier), change: '-20%' },
        { metric: 'Problemas de Acceso', value: Math.floor(8 * baseMultiplier), change: '-10%' },
        { metric: 'Cliente Ausente', value: Math.floor(5 * baseMultiplier), change: '-5%' },
        { metric: 'Resueltas', value: '85%', change: '+8%' },
      ],
    },
    summary: {
      totalRecords: Math.floor(200 * baseMultiplier),
      metrics: [
        { metric: 'Total Envíos', value: Math.floor(200 * baseMultiplier), change: '+10%' },
        { metric: 'Entregados', value: Math.floor(150 * baseMultiplier), change: '+12%' },
        { metric: 'Pendientes', value: Math.floor(35 * baseMultiplier), change: '-8%' },
        { metric: 'Devoluciones', value: Math.floor(15 * baseMultiplier), change: '-20%' },
        { metric: 'Tasa de Entrega', value: '90%', change: '+3%' },
        { metric: 'Satisfacción Cliente', value: '4.5/5', change: '+0.2' },
      ],
    },
  };

  return reports[reportType] || reports.summary;
}

SkillsRegistry.register(GenerateReportSkill);

export default GenerateReportSkill;
