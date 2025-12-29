/**
 * BulkStatusUpdate Skill
 *
 * Actualiza estados de múltiples guías de forma masiva
 */

import { RefreshCw, Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import { Skill, SkillResult, SkillContext } from '../types';
import SkillsRegistry from '../SkillsRegistry';

export const BulkStatusUpdateSkill: Skill = {
  id: 'bulk-status-update',
  name: 'Actualización Masiva',
  description: 'Actualiza el estado de múltiples guías simultáneamente',
  category: 'logistics',
  icon: RefreshCw,
  version: '1.0.0',

  requiredParams: [
    {
      name: 'action',
      type: 'select',
      label: 'Acción',
      options: [
        { value: 'sync', label: 'Sincronizar con transportadoras' },
        { value: 'mark-delivered', label: 'Marcar como entregados' },
        { value: 'mark-returned', label: 'Marcar como devueltos' },
        { value: 'refresh-all', label: 'Refrescar todos los estados' },
      ],
    },
  ],

  optionalParams: [
    {
      name: 'carrier',
      type: 'select',
      label: 'Transportadora',
      options: [
        { value: 'all', label: 'Todas' },
        { value: 'interrapidisimo', label: 'Interrapidísimo' },
        { value: 'coordinadora', label: 'Coordinadora' },
        { value: 'servientrega', label: 'Servientrega' },
      ],
    },
    {
      name: 'guideNumbers',
      type: 'string',
      label: 'Números de Guía (separados por coma)',
      placeholder: 'Ej: 123456, 789012, 345678',
    },
  ],

  roles: ['admin', 'operator'],

  keywords: [
    'actualizar',
    'masivo',
    'bulk',
    'sincronizar',
    'sync',
    'refrescar',
    'refresh',
    'estados',
    'multiple',
    'todos',
    'lote',
  ],

  examples: [
    'Sincronizar estados con transportadoras',
    'Actualizar todas las guías de Coordinadora',
    'Refrescar estados de hoy',
    'Marcar como entregados 123456, 789012',
    'Actualización masiva de pendientes',
  ],

  async execute(params: Record<string, any>, context: SkillContext): Promise<SkillResult> {
    const { action = 'sync', carrier = 'all', guideNumbers } = params;

    // Simulate bulk update process
    await new Promise(resolve => setTimeout(resolve, 1500));

    const actionLabels: Record<string, string> = {
      sync: 'Sincronización',
      'mark-delivered': 'Marcar entregados',
      'mark-returned': 'Marcar devueltos',
      'refresh-all': 'Refrescar estados',
    };

    const results = generateBulkUpdateResults(action, carrier, guideNumbers);

    return {
      success: true,
      message: `${actionLabels[action]} completada: ${results.successful} exitosos, ${results.failed} fallidos`,
      data: results,
      artifact: {
        type: 'table',
        title: `Resultado: ${actionLabels[action]}`,
        content: {
          columns: [
            { key: 'status', label: 'Estado', width: '20%' },
            { key: 'count', label: 'Cantidad', width: '20%' },
            { key: 'details', label: 'Detalles', width: '60%' },
          ],
          rows: [
            {
              status: '✅ Exitosos',
              count: results.successful,
              details: `Guías actualizadas correctamente`,
            },
            {
              status: '❌ Fallidos',
              count: results.failed,
              details: results.failed > 0 ? 'Error de conexión con API' : 'Sin errores',
            },
            {
              status: '⏭️ Omitidos',
              count: results.skipped,
              details: 'Ya tenían el estado actualizado',
            },
          ],
          summary: {
            totalProcessed: results.total,
            duration: `${results.duration}s`,
            timestamp: new Date().toLocaleString('es-CO'),
          },
        },
      },
      suggestedActions: [
        {
          label: 'Ver guías fallidas',
          skillId: 'list-failed-updates',
          params: { sessionId: results.sessionId },
          icon: AlertTriangle,
        },
        {
          label: 'Reintentar fallidos',
          skillId: 'bulk-status-update',
          params: { action: 'retry', sessionId: results.sessionId },
          icon: RefreshCw,
        },
        {
          label: 'Generar reporte',
          skillId: 'generate-report',
          params: { reportType: 'summary', dateRange: 'today' },
        },
      ],
    };
  },

  artifactType: 'table',
};

function generateBulkUpdateResults(action: string, carrier: string, guideNumbers?: string) {
  const total = guideNumbers
    ? guideNumbers.split(',').length
    : Math.floor(Math.random() * 100) + 50;

  const successRate = 0.92 + Math.random() * 0.06; // 92-98% success
  const successful = Math.floor(total * successRate);
  const failed = Math.floor(total * 0.02);
  const skipped = total - successful - failed;

  return {
    total,
    successful,
    failed,
    skipped,
    duration: (Math.random() * 3 + 1).toFixed(1),
    sessionId: `bulk-${Date.now()}`,
    carrier,
    action,
  };
}

SkillsRegistry.register(BulkStatusUpdateSkill);

export default BulkStatusUpdateSkill;
