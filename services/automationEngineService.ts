// ============================================
// LITPER COMMAND CENTER - AUTOMATION ENGINE
// Motor de reglas y automatizaciones
// ============================================

import { guiasService, ciudadesService, alertasService, DBGuia, DBCiudadStats } from './supabaseService';
import { chateaService } from './chateaService';

// ============================================
// TIPOS
// ============================================

export type TriggerType =
  | 'schedule'           // Cronograma (cron)
  | 'event'              // Evento del sistema
  | 'threshold'          // Umbral alcanzado
  | 'change'             // Cambio en datos
  | 'manual';            // Ejecución manual

export type ActionType =
  | 'send_whatsapp'      // Enviar WhatsApp
  | 'create_alert'       // Crear alerta
  | 'pause_city'         // Pausar ciudad
  | 'resume_city'        // Reanudar ciudad
  | 'export_report'      // Exportar reporte
  | 'send_email'         // Enviar email
  | 'webhook'            // Llamar webhook
  | 'update_data'        // Actualizar datos
  | 'custom';            // Acción personalizada

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'contains'
  | 'not_contains'
  | 'in'
  | 'not_in'
  | 'between';

export interface AutomationCondition {
  field: string;
  operator: ConditionOperator;
  value: unknown;
  logicalOperator?: 'AND' | 'OR';
}

export interface AutomationTrigger {
  type: TriggerType;
  config: Record<string, unknown>;
}

export interface AutomationAction {
  type: ActionType;
  config: Record<string, unknown>;
  order: number;
  continueOnError?: boolean;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  cooldownMinutes: number; // Tiempo mínimo entre ejecuciones
  lastExecutedAt?: string;
  executionCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface AutomationExecution {
  id: string;
  ruleId: string;
  ruleName: string;
  triggeredBy: string;
  triggeredAt: string;
  completedAt?: string;
  status: 'running' | 'completed' | 'failed' | 'skipped';
  actionsExecuted: {
    actionType: ActionType;
    status: 'success' | 'failed' | 'skipped';
    result?: unknown;
    error?: string;
    executedAt: string;
  }[];
  metadata?: Record<string, unknown>;
}

export interface ScheduleConfig {
  type: 'interval' | 'cron' | 'daily' | 'weekly';
  interval?: number; // minutos para interval
  cron?: string; // expresión cron
  time?: string; // HH:mm para daily/weekly
  daysOfWeek?: number[]; // 0-6 para weekly
  timezone?: string;
}

// ============================================
// STORAGE
// ============================================

const STORAGE_KEYS = {
  RULES: 'litper_automation_rules',
  EXECUTIONS: 'litper_automation_executions',
};

// ============================================
// DEFAULT RULES
// ============================================

const DEFAULT_RULES: AutomationRule[] = [
  {
    id: 'rule-ciudad-roja',
    name: 'Alerta Ciudad en Rojo',
    description: 'Crea una alerta cuando una ciudad cae al estado rojo',
    enabled: true,
    trigger: {
      type: 'threshold',
      config: {
        metric: 'city_delivery_rate',
        threshold: 50,
        direction: 'below',
      },
    },
    conditions: [
      {
        field: 'status',
        operator: 'equals',
        value: 'rojo',
      },
      {
        field: 'total_guias',
        operator: 'greater_than',
        value: 5,
        logicalOperator: 'AND',
      },
    ],
    actions: [
      {
        type: 'create_alert',
        config: {
          tipo: 'critica',
          titulo: 'Ciudad en estado crítico',
          mensaje: 'La ciudad {{ciudad}} ha caído a estado ROJO con tasa de entrega del {{tasa_entrega}}%',
        },
        order: 1,
      },
    ],
    cooldownMinutes: 60,
    executionCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
  },
  {
    id: 'rule-novedad-whatsapp',
    name: 'Notificar Novedad por WhatsApp',
    description: 'Envía WhatsApp al cliente cuando hay novedad en su envío',
    enabled: false, // Deshabilitado por defecto
    trigger: {
      type: 'event',
      config: {
        eventType: 'guia_novedad',
      },
    },
    conditions: [
      {
        field: 'tiene_novedad',
        operator: 'equals',
        value: true,
      },
    ],
    actions: [
      {
        type: 'send_whatsapp',
        config: {
          templateId: 'novedad_envio',
          phoneField: 'telefono',
          message: 'Hola {{nombre_cliente}}, hay una novedad con tu envío #{{numero_guia}}: {{tipo_novedad}}. Por favor contáctanos.',
        },
        order: 1,
      },
    ],
    cooldownMinutes: 1440, // Una vez al día por guía
    executionCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
  },
  {
    id: 'rule-reporte-diario',
    name: 'Reporte Diario',
    description: 'Genera y envía un reporte diario a las 8 PM',
    enabled: false,
    trigger: {
      type: 'schedule',
      config: {
        type: 'daily',
        time: '20:00',
        timezone: 'America/Bogota',
      } as ScheduleConfig,
    },
    conditions: [],
    actions: [
      {
        type: 'export_report',
        config: {
          reportType: 'daily',
          format: 'pdf',
        },
        order: 1,
      },
      {
        type: 'create_alert',
        config: {
          tipo: 'info',
          titulo: 'Reporte diario generado',
          mensaje: 'El reporte diario ha sido generado exitosamente.',
        },
        order: 2,
      },
    ],
    cooldownMinutes: 1440,
    executionCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
  },
];

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function interpolateTemplate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = data[key];
    return value !== undefined ? String(value) : `{{${key}}}`;
  });
}

function evaluateCondition(condition: AutomationCondition, data: Record<string, unknown>): boolean {
  const fieldValue = data[condition.field];
  const conditionValue = condition.value;

  switch (condition.operator) {
    case 'equals':
      return fieldValue === conditionValue;
    case 'not_equals':
      return fieldValue !== conditionValue;
    case 'greater_than':
      return Number(fieldValue) > Number(conditionValue);
    case 'less_than':
      return Number(fieldValue) < Number(conditionValue);
    case 'contains':
      return String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase());
    case 'not_contains':
      return !String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase());
    case 'in':
      return Array.isArray(conditionValue) && conditionValue.includes(fieldValue);
    case 'not_in':
      return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue);
    case 'between':
      if (Array.isArray(conditionValue) && conditionValue.length === 2) {
        const num = Number(fieldValue);
        return num >= Number(conditionValue[0]) && num <= Number(conditionValue[1]);
      }
      return false;
    default:
      return false;
  }
}

function evaluateConditions(conditions: AutomationCondition[], data: Record<string, unknown>): boolean {
  if (conditions.length === 0) return true;

  let result = evaluateCondition(conditions[0], data);

  for (let i = 1; i < conditions.length; i++) {
    const condition = conditions[i];
    const conditionResult = evaluateCondition(condition, data);

    if (condition.logicalOperator === 'OR') {
      result = result || conditionResult;
    } else {
      result = result && conditionResult;
    }
  }

  return result;
}

// ============================================
// EJECUTORES DE ACCIONES
// ============================================

async function executeAction(
  action: AutomationAction,
  data: Record<string, unknown>
): Promise<{ success: boolean; result?: unknown; error?: string }> {
  try {
    switch (action.type) {
      case 'send_whatsapp': {
        const phone = data[action.config.phoneField as string] as string;
        const message = interpolateTemplate(action.config.message as string, data);

        if (!phone) {
          return { success: false, error: 'Teléfono no disponible' };
        }

        await chateaService.enviarMensaje(phone, message);
        return { success: true, result: { phone, message } };
      }

      case 'create_alert': {
        const titulo = interpolateTemplate(action.config.titulo as string, data);
        const mensaje = interpolateTemplate(action.config.mensaje as string, data);

        const alerta = await alertasService.crear({
          tipo: action.config.tipo as 'critica' | 'advertencia' | 'info' | 'exito',
          titulo,
          mensaje,
          fuente: 'AUTOMATION',
          leida: false,
        });

        return { success: true, result: alerta };
      }

      case 'pause_city': {
        const ciudadId = data.id as string || action.config.ciudadId as string;
        await ciudadesService.pausar(ciudadId);
        return { success: true, result: { ciudadId, action: 'paused' } };
      }

      case 'resume_city': {
        const ciudadId = data.id as string || action.config.ciudadId as string;
        await ciudadesService.reanudar(ciudadId);
        return { success: true, result: { ciudadId, action: 'resumed' } };
      }

      case 'webhook': {
        const url = action.config.url as string;
        const method = (action.config.method as string) || 'POST';
        const payload = action.config.includeData ? { ...action.config.payload, data } : action.config.payload;

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...(action.config.headers as Record<string, string> || {}),
          },
          body: method !== 'GET' ? JSON.stringify(payload) : undefined,
        });

        return { success: response.ok, result: { status: response.status } };
      }

      case 'export_report':
        // Placeholder - se implementaría con el servicio de reportes
        return { success: true, result: { type: action.config.reportType } };

      case 'send_email':
        // Placeholder - requiere servicio de email
        return { success: false, error: 'Email service not configured' };

      case 'update_data':
        // Placeholder - actualizar datos según configuración
        return { success: true, result: { updated: true } };

      case 'custom':
        // Ejecutar función personalizada si está definida
        return { success: true, result: { custom: true } };

      default:
        return { success: false, error: `Unknown action type: ${action.type}` };
    }
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ============================================
// SERVICIO DE AUTOMATIZACIÓN
// ============================================

export const automationEngineService = {
  /**
   * Obtener todas las reglas
   */
  getRules(): AutomationRule[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.RULES);
      if (stored) {
        return JSON.parse(stored);
      }
      // Guardar reglas por defecto
      localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(DEFAULT_RULES));
      return DEFAULT_RULES;
    } catch (error) {
      console.error('Error loading automation rules:', error);
      return DEFAULT_RULES;
    }
  },

  /**
   * Guardar reglas
   */
  saveRules(rules: AutomationRule[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(rules));
    } catch (error) {
      console.error('Error saving automation rules:', error);
    }
  },

  /**
   * Obtener regla por ID
   */
  getRuleById(ruleId: string): AutomationRule | null {
    const rules = this.getRules();
    return rules.find(r => r.id === ruleId) || null;
  },

  /**
   * Crear nueva regla
   */
  createRule(rule: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt' | 'executionCount'>): AutomationRule {
    const rules = this.getRules();
    const newRule: AutomationRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      executionCount: 0,
    };

    rules.push(newRule);
    this.saveRules(rules);
    return newRule;
  },

  /**
   * Actualizar regla
   */
  updateRule(ruleId: string, updates: Partial<AutomationRule>): AutomationRule | null {
    const rules = this.getRules();
    const index = rules.findIndex(r => r.id === ruleId);

    if (index === -1) return null;

    rules[index] = {
      ...rules[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.saveRules(rules);
    return rules[index];
  },

  /**
   * Eliminar regla
   */
  deleteRule(ruleId: string): boolean {
    const rules = this.getRules();
    const filtered = rules.filter(r => r.id !== ruleId);

    if (filtered.length === rules.length) return false;

    this.saveRules(filtered);
    return true;
  },

  /**
   * Habilitar/Deshabilitar regla
   */
  toggleRule(ruleId: string): AutomationRule | null {
    const rule = this.getRuleById(ruleId);
    if (!rule) return null;

    return this.updateRule(ruleId, { enabled: !rule.enabled });
  },

  /**
   * Ejecutar regla manualmente
   */
  async executeRule(ruleId: string, data: Record<string, unknown> = {}): Promise<AutomationExecution> {
    const rule = this.getRuleById(ruleId);

    if (!rule) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    const execution: AutomationExecution = {
      id: `exec-${Date.now()}`,
      ruleId: rule.id,
      ruleName: rule.name,
      triggeredBy: 'manual',
      triggeredAt: new Date().toISOString(),
      status: 'running',
      actionsExecuted: [],
    };

    // Verificar condiciones
    if (!evaluateConditions(rule.conditions, data)) {
      execution.status = 'skipped';
      execution.completedAt = new Date().toISOString();
      this.saveExecution(execution);
      return execution;
    }

    // Ejecutar acciones en orden
    const sortedActions = [...rule.actions].sort((a, b) => a.order - b.order);

    for (const action of sortedActions) {
      const result = await executeAction(action, data);

      execution.actionsExecuted.push({
        actionType: action.type,
        status: result.success ? 'success' : 'failed',
        result: result.result,
        error: result.error,
        executedAt: new Date().toISOString(),
      });

      // Si falla y no debe continuar, parar
      if (!result.success && !action.continueOnError) {
        execution.status = 'failed';
        break;
      }
    }

    if (execution.status !== 'failed') {
      execution.status = 'completed';
    }

    execution.completedAt = new Date().toISOString();

    // Actualizar estadísticas de la regla
    this.updateRule(ruleId, {
      lastExecutedAt: new Date().toISOString(),
      executionCount: rule.executionCount + 1,
    });

    this.saveExecution(execution);
    return execution;
  },

  /**
   * Procesar triggers de eventos
   */
  async processEventTrigger(eventType: string, data: Record<string, unknown>): Promise<AutomationExecution[]> {
    const rules = this.getRules().filter(r =>
      r.enabled &&
      r.trigger.type === 'event' &&
      r.trigger.config.eventType === eventType
    );

    const executions: AutomationExecution[] = [];

    for (const rule of rules) {
      // Verificar cooldown
      if (rule.lastExecutedAt) {
        const lastExec = new Date(rule.lastExecutedAt).getTime();
        const cooldownMs = rule.cooldownMinutes * 60 * 1000;
        if (Date.now() - lastExec < cooldownMs) {
          continue; // Saltar por cooldown
        }
      }

      try {
        const execution = await this.executeRule(rule.id, data);
        executions.push(execution);
      } catch (error) {
        console.error(`Error executing rule ${rule.id}:`, error);
      }
    }

    return executions;
  },

  /**
   * Procesar triggers de umbral
   */
  async processThresholdTrigger(metric: string, value: number, data: Record<string, unknown>): Promise<AutomationExecution[]> {
    const rules = this.getRules().filter(r =>
      r.enabled &&
      r.trigger.type === 'threshold' &&
      r.trigger.config.metric === metric
    );

    const executions: AutomationExecution[] = [];

    for (const rule of rules) {
      const threshold = Number(rule.trigger.config.threshold);
      const direction = rule.trigger.config.direction as 'above' | 'below';

      const shouldTrigger =
        (direction === 'above' && value > threshold) ||
        (direction === 'below' && value < threshold);

      if (!shouldTrigger) continue;

      // Verificar cooldown
      if (rule.lastExecutedAt) {
        const lastExec = new Date(rule.lastExecutedAt).getTime();
        const cooldownMs = rule.cooldownMinutes * 60 * 1000;
        if (Date.now() - lastExec < cooldownMs) {
          continue;
        }
      }

      try {
        const execution = await this.executeRule(rule.id, { ...data, _metric: metric, _value: value });
        executions.push(execution);
      } catch (error) {
        console.error(`Error executing rule ${rule.id}:`, error);
      }
    }

    return executions;
  },

  /**
   * Guardar ejecución en historial
   */
  saveExecution(execution: AutomationExecution): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.EXECUTIONS);
      const executions: AutomationExecution[] = stored ? JSON.parse(stored) : [];

      executions.unshift(execution);

      // Mantener solo las últimas 100 ejecuciones
      const trimmed = executions.slice(0, 100);

      localStorage.setItem(STORAGE_KEYS.EXECUTIONS, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Error saving execution:', error);
    }
  },

  /**
   * Obtener historial de ejecuciones
   */
  getExecutions(limit: number = 50): AutomationExecution[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.EXECUTIONS);
      if (stored) {
        const executions: AutomationExecution[] = JSON.parse(stored);
        return executions.slice(0, limit);
      }
      return [];
    } catch (error) {
      console.error('Error loading executions:', error);
      return [];
    }
  },

  /**
   * Obtener ejecuciones de una regla específica
   */
  getRuleExecutions(ruleId: string, limit: number = 20): AutomationExecution[] {
    return this.getExecutions(100).filter(e => e.ruleId === ruleId).slice(0, limit);
  },

  /**
   * Verificar y ejecutar reglas programadas
   */
  async checkScheduledRules(): Promise<AutomationExecution[]> {
    const rules = this.getRules().filter(r =>
      r.enabled && r.trigger.type === 'schedule'
    );

    const executions: AutomationExecution[] = [];
    const now = new Date();

    for (const rule of rules) {
      const schedule = rule.trigger.config as ScheduleConfig;
      let shouldRun = false;

      if (schedule.type === 'daily' && schedule.time) {
        const [hours, minutes] = schedule.time.split(':').map(Number);
        if (now.getHours() === hours && now.getMinutes() === minutes) {
          shouldRun = true;
        }
      }

      if (schedule.type === 'weekly' && schedule.time && schedule.daysOfWeek) {
        const [hours, minutes] = schedule.time.split(':').map(Number);
        if (
          schedule.daysOfWeek.includes(now.getDay()) &&
          now.getHours() === hours &&
          now.getMinutes() === minutes
        ) {
          shouldRun = true;
        }
      }

      if (!shouldRun) continue;

      // Verificar cooldown
      if (rule.lastExecutedAt) {
        const lastExec = new Date(rule.lastExecutedAt).getTime();
        const cooldownMs = rule.cooldownMinutes * 60 * 1000;
        if (Date.now() - lastExec < cooldownMs) {
          continue;
        }
      }

      try {
        const execution = await this.executeRule(rule.id, {});
        executions.push(execution);
      } catch (error) {
        console.error(`Error executing scheduled rule ${rule.id}:`, error);
      }
    }

    return executions;
  },

  /**
   * Obtener estadísticas de automatización
   */
  getStats(): {
    totalRules: number;
    enabledRules: number;
    totalExecutions: number;
    successRate: number;
    lastExecution?: string;
  } {
    const rules = this.getRules();
    const executions = this.getExecutions(100);

    const successCount = executions.filter(e => e.status === 'completed').length;

    return {
      totalRules: rules.length,
      enabledRules: rules.filter(r => r.enabled).length,
      totalExecutions: executions.length,
      successRate: executions.length > 0 ? (successCount / executions.length) * 100 : 0,
      lastExecution: executions[0]?.triggeredAt,
    };
  },

  /**
   * Restaurar reglas por defecto
   */
  resetToDefaults(): void {
    this.saveRules(DEFAULT_RULES);
  },
};

export default automationEngineService;
