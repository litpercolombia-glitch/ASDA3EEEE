/**
 * ScheduleTask Skill
 *
 * Programa tareas automáticas recurrentes
 */

import { Clock, Calendar, Repeat, Play, Pause, Trash2 } from 'lucide-react';
import { Skill, SkillResult, SkillContext } from '../types';
import SkillsRegistry from '../SkillsRegistry';

export const ScheduleTaskSkill: Skill = {
  id: 'schedule-task',
  name: 'Programar Tarea',
  description: 'Programa tareas automáticas para ejecutar periódicamente',
  category: 'automation',
  icon: Clock,
  version: '1.0.0',

  requiredParams: [
    {
      name: 'taskType',
      type: 'select',
      label: 'Tipo de Tarea',
      options: [
        { value: 'sync-status', label: 'Sincronizar estados' },
        { value: 'daily-report', label: 'Reporte diario' },
        { value: 'weekly-report', label: 'Reporte semanal' },
        { value: 'notify-delays', label: 'Notificar retrasos' },
        { value: 'cleanup-old', label: 'Limpiar registros antiguos' },
        { value: 'backup-data', label: 'Respaldo de datos' },
      ],
    },
    {
      name: 'schedule',
      type: 'select',
      label: 'Frecuencia',
      options: [
        { value: 'hourly', label: 'Cada hora' },
        { value: 'daily-9am', label: 'Diario a las 9am' },
        { value: 'daily-6pm', label: 'Diario a las 6pm' },
        { value: 'weekly-monday', label: 'Cada lunes' },
        { value: 'monthly-1st', label: 'Primer día del mes' },
      ],
    },
  ],

  optionalParams: [
    {
      name: 'notifyOnComplete',
      type: 'boolean',
      label: 'Notificar al completar',
    },
    {
      name: 'params',
      type: 'string',
      label: 'Parámetros adicionales (JSON)',
      placeholder: '{"carrier": "all"}',
    },
  ],

  roles: ['admin'],

  keywords: [
    'programar',
    'schedule',
    'automatico',
    'recurrente',
    'tarea',
    'cron',
    'diario',
    'semanal',
    'cada hora',
    'automatizar',
  ],

  examples: [
    'Programar reporte diario a las 9am',
    'Automatizar sincronización cada hora',
    'Crear tarea semanal de respaldo',
    'Programar notificaciones de retrasos',
  ],

  async execute(params: Record<string, any>, context: SkillContext): Promise<SkillResult> {
    const {
      taskType,
      schedule,
      notifyOnComplete = true,
      params: extraParams,
    } = params;

    if (!taskType || !schedule) {
      return {
        success: false,
        message: 'Por favor selecciona el tipo de tarea y la frecuencia',
        error: {
          code: 'MISSING_PARAMS',
          details: 'Se requiere tipo de tarea y frecuencia',
        },
      };
    }

    await new Promise(resolve => setTimeout(resolve, 300));

    const taskId = `TASK-${Date.now().toString(36).toUpperCase()}`;

    const taskLabels: Record<string, string> = {
      'sync-status': 'Sincronizar Estados',
      'daily-report': 'Reporte Diario',
      'weekly-report': 'Reporte Semanal',
      'notify-delays': 'Notificar Retrasos',
      'cleanup-old': 'Limpiar Registros Antiguos',
      'backup-data': 'Respaldo de Datos',
    };

    const scheduleLabels: Record<string, string> = {
      hourly: 'Cada hora',
      'daily-9am': 'Diario a las 9:00 AM',
      'daily-6pm': 'Diario a las 6:00 PM',
      'weekly-monday': 'Cada lunes a las 9:00 AM',
      'monthly-1st': 'Primer día del mes',
    };

    const nextRun = calculateNextRun(schedule);

    return {
      success: true,
      message: `Tarea "${taskLabels[taskType]}" programada exitosamente - Próxima ejecución: ${nextRun}`,
      data: {
        taskId,
        taskType,
        schedule,
        status: 'active',
        createdAt: new Date().toISOString(),
        nextRun,
      },
      artifact: {
        type: 'table',
        title: `Tarea Programada: ${taskId}`,
        content: {
          columns: [
            { key: 'field', label: 'Campo', width: '40%' },
            { key: 'value', label: 'Valor', width: '60%' },
          ],
          rows: [
            { field: 'ID de Tarea', value: taskId },
            { field: 'Tipo', value: taskLabels[taskType] },
            { field: 'Frecuencia', value: scheduleLabels[schedule] },
            { field: 'Estado', value: '✅ Activa' },
            { field: 'Próxima Ejecución', value: nextRun },
            { field: 'Notificar', value: notifyOnComplete ? 'Sí' : 'No' },
            { field: 'Creada', value: new Date().toLocaleString('es-CO') },
          ],
        },
      },
      suggestedActions: [
        {
          label: 'Ver todas las tareas',
          skillId: 'list-scheduled-tasks',
          icon: Calendar,
        },
        {
          label: 'Ejecutar ahora',
          skillId: 'run-task',
          params: { taskId },
          icon: Play,
        },
        {
          label: 'Pausar tarea',
          skillId: 'pause-task',
          params: { taskId },
          icon: Pause,
        },
      ],
    };
  },

  artifactType: 'table',
};

function calculateNextRun(schedule: string): string {
  const now = new Date();
  let next: Date;

  switch (schedule) {
    case 'hourly':
      next = new Date(now.getTime() + 60 * 60 * 1000);
      break;
    case 'daily-9am':
      next = new Date(now);
      next.setHours(9, 0, 0, 0);
      if (next <= now) next.setDate(next.getDate() + 1);
      break;
    case 'daily-6pm':
      next = new Date(now);
      next.setHours(18, 0, 0, 0);
      if (next <= now) next.setDate(next.getDate() + 1);
      break;
    case 'weekly-monday':
      next = new Date(now);
      const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
      next.setDate(now.getDate() + daysUntilMonday);
      next.setHours(9, 0, 0, 0);
      break;
    case 'monthly-1st':
      next = new Date(now.getFullYear(), now.getMonth() + 1, 1, 9, 0, 0);
      break;
    default:
      next = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }

  return next.toLocaleString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

SkillsRegistry.register(ScheduleTaskSkill);

export default ScheduleTaskSkill;
