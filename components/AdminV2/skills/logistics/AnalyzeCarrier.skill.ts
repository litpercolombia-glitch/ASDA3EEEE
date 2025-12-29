/**
 * AnalyzeCarrier Skill
 *
 * Analiza el rendimiento de las transportadoras
 */

import { TrendingUp, BarChart3, Award, AlertTriangle } from 'lucide-react';
import { Skill, SkillResult, SkillContext } from '../types';
import SkillsRegistry from '../SkillsRegistry';

export const AnalyzeCarrierSkill: Skill = {
  id: 'analyze-carrier',
  name: 'Analizar Transportadora',
  description: 'Analiza el rendimiento y métricas de transportadoras',
  category: 'logistics',
  icon: TrendingUp,
  version: '1.0.0',

  requiredParams: [],

  optionalParams: [
    {
      name: 'carrier',
      type: 'select',
      label: 'Transportadora',
      options: [
        { value: 'all', label: 'Comparar todas' },
        { value: 'interrapidisimo', label: 'Interrapidísimo' },
        { value: 'coordinadora', label: 'Coordinadora' },
        { value: 'servientrega', label: 'Servientrega' },
        { value: 'envia', label: 'Envía' },
        { value: 'tcc', label: 'TCC' },
      ],
    },
    {
      name: 'dateRange',
      type: 'select',
      label: 'Período',
      options: [
        { value: 'week', label: 'Última semana' },
        { value: 'month', label: 'Último mes' },
        { value: 'quarter', label: 'Último trimestre' },
      ],
    },
  ],

  roles: ['admin', 'operator', 'viewer'],

  keywords: [
    'analizar',
    'transportadora',
    'carrier',
    'rendimiento',
    'performance',
    'comparar',
    'metricas',
    'interrapidisimo',
    'coordinadora',
    'servientrega',
    'envia',
    'tcc',
    'cual es mejor',
    'ranking',
  ],

  examples: [
    'Analizar rendimiento de transportadoras',
    'Comparar todas las transportadoras',
    'Como está Coordinadora este mes?',
    'Cuál transportadora es mejor?',
    'Métricas de Interrapidísimo',
    'Ranking de transportadoras',
  ],

  async execute(params: Record<string, any>, context: SkillContext): Promise<SkillResult> {
    const { carrier = 'all', dateRange = 'month' } = params;

    await new Promise(resolve => setTimeout(resolve, 600));

    const carrierData = generateCarrierAnalysis(carrier, dateRange);

    if (carrier === 'all') {
      return {
        success: true,
        message: `Análisis comparativo de ${carrierData.length} transportadoras completado`,
        data: carrierData,
        artifact: {
          type: 'table',
          title: 'Ranking de Transportadoras',
          content: {
            columns: [
              { key: 'rank', label: '#', width: '8%' },
              { key: 'name', label: 'Transportadora', width: '22%' },
              { key: 'deliveryRate', label: 'Tasa Entrega', width: '15%' },
              { key: 'avgTime', label: 'Tiempo Prom.', width: '15%' },
              { key: 'returns', label: 'Devoluciones', width: '15%' },
              { key: 'score', label: 'Puntuación', width: '15%' },
              { key: 'trend', label: 'Tendencia', width: '10%' },
            ],
            rows: carrierData.map((c: any, idx: number) => ({
              rank: idx + 1,
              name: c.name,
              deliveryRate: `${c.deliveryRate}%`,
              avgTime: `${c.avgTime} días`,
              returns: `${c.returns}%`,
              score: `${c.score}/100`,
              trend: c.trend > 0 ? `↑ +${c.trend}%` : `↓ ${c.trend}%`,
            })),
            summary: {
              period: dateRange === 'week' ? 'Última semana' : dateRange === 'month' ? 'Último mes' : 'Último trimestre',
              bestCarrier: carrierData[0]?.name,
              avgDeliveryRate: `${(carrierData.reduce((a: number, c: any) => a + c.deliveryRate, 0) / carrierData.length).toFixed(1)}%`,
            },
          },
        },
        suggestedActions: [
          {
            label: `Ver detalle de ${carrierData[0]?.name}`,
            skillId: 'analyze-carrier',
            params: { carrier: carrierData[0]?.id, dateRange },
          },
          {
            label: 'Ver gráfico de tendencias',
            skillId: 'carrier-trends-chart',
            params: { dateRange },
            icon: BarChart3,
          },
          {
            label: 'Exportar análisis',
            skillId: 'export-data',
            params: { data: carrierData, format: 'xlsx' },
          },
        ],
      };
    }

    // Single carrier analysis
    const singleCarrier = carrierData[0];
    return {
      success: true,
      message: `Análisis de ${singleCarrier.name} completado - Puntuación: ${singleCarrier.score}/100`,
      data: singleCarrier,
      artifact: {
        type: 'table',
        title: `Análisis: ${singleCarrier.name}`,
        content: {
          columns: [
            { key: 'metric', label: 'Métrica', width: '40%' },
            { key: 'value', label: 'Valor', width: '30%' },
            { key: 'status', label: 'Estado', width: '30%' },
          ],
          rows: [
            { metric: 'Tasa de Entrega', value: `${singleCarrier.deliveryRate}%`, status: singleCarrier.deliveryRate >= 90 ? '✅ Excelente' : singleCarrier.deliveryRate >= 80 ? '⚠️ Aceptable' : '❌ Bajo' },
            { metric: 'Tiempo Promedio', value: `${singleCarrier.avgTime} días`, status: singleCarrier.avgTime <= 2 ? '✅ Rápido' : singleCarrier.avgTime <= 3 ? '⚠️ Normal' : '❌ Lento' },
            { metric: 'Tasa de Devolución', value: `${singleCarrier.returns}%`, status: singleCarrier.returns <= 5 ? '✅ Baja' : singleCarrier.returns <= 10 ? '⚠️ Media' : '❌ Alta' },
            { metric: 'Novedades', value: `${singleCarrier.incidents}%`, status: singleCarrier.incidents <= 10 ? '✅ Pocas' : '⚠️ Revisar' },
            { metric: 'Puntuación General', value: `${singleCarrier.score}/100`, status: singleCarrier.score >= 85 ? '⭐ Recomendada' : '📊 Normal' },
            { metric: 'Tendencia', value: singleCarrier.trend > 0 ? `+${singleCarrier.trend}%` : `${singleCarrier.trend}%`, status: singleCarrier.trend > 0 ? '📈 Mejorando' : '📉 Declinando' },
          ],
        },
      },
      suggestedActions: [
        {
          label: 'Comparar con otras',
          skillId: 'analyze-carrier',
          params: { carrier: 'all', dateRange },
        },
        {
          label: 'Ver envíos de esta transportadora',
          skillId: 'list-shipments',
          params: { carrier: singleCarrier.id, dateRange },
        },
        {
          label: 'Ver novedades',
          skillId: 'list-incidents',
          params: { carrier: singleCarrier.id },
          icon: AlertTriangle,
        },
      ],
    };
  },

  artifactType: 'table',
};

function generateCarrierAnalysis(carrier: string, dateRange: string) {
  const carriers = [
    { id: 'coordinadora', name: 'Coordinadora', base: 92 },
    { id: 'interrapidisimo', name: 'Interrapidísimo', base: 89 },
    { id: 'servientrega', name: 'Servientrega', base: 87 },
    { id: 'envia', name: 'Envía', base: 85 },
    { id: 'tcc', name: 'TCC', base: 83 },
  ];

  const generateMetrics = (c: any) => ({
    id: c.id,
    name: c.name,
    deliveryRate: c.base + Math.floor(Math.random() * 5),
    avgTime: (1.5 + Math.random() * 2).toFixed(1),
    returns: (3 + Math.random() * 7).toFixed(1),
    incidents: (5 + Math.random() * 10).toFixed(1),
    score: c.base + Math.floor(Math.random() * 8),
    trend: Math.floor(Math.random() * 10) - 3,
    totalShipments: Math.floor(Math.random() * 500) + 200,
  });

  if (carrier === 'all') {
    return carriers
      .map(generateMetrics)
      .sort((a, b) => b.score - a.score);
  }

  const found = carriers.find(c => c.id === carrier);
  if (found) {
    return [generateMetrics(found)];
  }

  return carriers.map(generateMetrics).sort((a, b) => b.score - a.score);
}

SkillsRegistry.register(AnalyzeCarrierSkill);

export default AnalyzeCarrierSkill;
