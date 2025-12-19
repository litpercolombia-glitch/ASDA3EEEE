// services/brain/automation/RulesManager.ts
// Gestiona reglas de automatización

import { AutomationRule, BrainEventType, DecisionType, UnifiedShipment } from '../types/brain.types';
import { eventBus } from '../core/EventBus';
import { memoryManager } from '../core/MemoryManager';
import { decisionEngine } from '../decisions/DecisionEngine';
import { actionExecutor } from '../decisions/ActionExecutor';

export interface RuleExecution {
  ruleId: string;
  triggeredBy: BrainEventType;
  triggeredAt: Date;
  shipmentId?: string;
  actionTaken: string;
  success: boolean;
}

class RulesManagerService {
  private rules: Map<string, AutomationRule> = new Map();
  private executionLog: RuleExecution[] = [];
  private isEnabled: boolean = true;

  constructor() {
    this.initializeDefaultRules();
    this.setupEventListeners();
  }

  /**
   * Inicializar reglas por defecto
   */
  private initializeDefaultRules(): void {
    const defaultRules: AutomationRule[] = [
      {
        id: 'auto_alert_delayed',
        name: 'Alerta Automática de Retraso',
        description: 'Crear alerta cuando un envío lleva más de 5 días en tránsito',
        enabled: true,
        trigger: {
          event: 'shipment.updated',
          conditions: {
            daysInTransit: { $gt: 5 },
            status: { $nin: ['delivered', 'returned', 'cancelled'] },
          },
        },
        action: {
          type: 'escalate_alert',
          params: {
            severity: 'high',
            template: 'shipment_delayed',
          },
        },
        priority: 8,
        executionCount: 0,
      },
      {
        id: 'auto_notify_delivered',
        name: 'Notificación de Entrega',
        description: 'Enviar notificación cuando un envío es entregado',
        enabled: true,
        trigger: {
          event: 'shipment.delivered',
          conditions: {},
        },
        action: {
          type: 'send_notification',
          params: {
            type: 'delivery_confirmation',
            template: 'delivered',
          },
        },
        priority: 7,
        executionCount: 0,
      },
      {
        id: 'auto_alert_issue',
        name: 'Alerta de Novedad',
        description: 'Crear alerta cuando un envío tiene una novedad',
        enabled: true,
        trigger: {
          event: 'shipment.issue',
          conditions: {},
        },
        action: {
          type: 'escalate_alert',
          params: {
            severity: 'critical',
            template: 'shipment_issue',
          },
        },
        priority: 9,
        executionCount: 0,
      },
      {
        id: 'auto_whatsapp_delivery_soon',
        name: 'WhatsApp Entrega Próxima',
        description: 'Enviar WhatsApp cuando el envío está en reparto',
        enabled: false, // Desactivado por defecto
        trigger: {
          event: 'shipment.updated',
          conditions: {
            status: 'out_for_delivery',
          },
        },
        action: {
          type: 'send_whatsapp',
          params: {
            template: 'delivery_today',
          },
        },
        priority: 6,
        executionCount: 0,
      },
      {
        id: 'auto_task_stale',
        name: 'Tarea para Envío Estancado',
        description: 'Crear tarea cuando no hay actualizaciones en 72h',
        enabled: true,
        trigger: {
          event: 'shipment.updated',
          conditions: {
            hoursSinceUpdate: { $gt: 72 },
            status: { $nin: ['delivered', 'returned', 'cancelled'] },
          },
        },
        action: {
          type: 'create_task',
          params: {
            priority: 'high',
            template: 'verify_stale_shipment',
          },
        },
        priority: 7,
        executionCount: 0,
      },
    ];

    defaultRules.forEach(rule => this.rules.set(rule.id, rule));
  }

  /**
   * Configurar listeners de eventos
   */
  private setupEventListeners(): void {
    // Escuchar todos los eventos de envío
    const shipmentEvents: BrainEventType[] = [
      'shipment.created',
      'shipment.updated',
      'shipment.delivered',
      'shipment.delayed',
      'shipment.issue',
    ];

    shipmentEvents.forEach(eventType => {
      eventBus.on(eventType, (event) => {
        if (this.isEnabled) {
          this.evaluateRules(eventType, event.payload);
        }
      });
    });
  }

  /**
   * Evaluar reglas para un evento
   */
  private async evaluateRules(
    eventType: BrainEventType,
    payload: Record<string, unknown>
  ): Promise<void> {
    const matchingRules = Array.from(this.rules.values())
      .filter(rule => rule.enabled && rule.trigger.event === eventType)
      .sort((a, b) => b.priority - a.priority);

    for (const rule of matchingRules) {
      try {
        if (this.checkConditions(rule.trigger.conditions, payload)) {
          await this.executeRule(rule, payload);
        }
      } catch (error) {
        console.error(`Error executing rule ${rule.id}:`, error);
      }
    }
  }

  /**
   * Verificar condiciones de una regla
   */
  private checkConditions(
    conditions: Record<string, unknown>,
    payload: Record<string, unknown>
  ): boolean {
    for (const [key, condition] of Object.entries(conditions)) {
      const value = payload[key];

      if (typeof condition === 'object' && condition !== null) {
        const condObj = condition as Record<string, unknown>;

        // Operadores de comparación
        if ('$gt' in condObj && !(Number(value) > Number(condObj.$gt))) return false;
        if ('$lt' in condObj && !(Number(value) < Number(condObj.$lt))) return false;
        if ('$gte' in condObj && !(Number(value) >= Number(condObj.$gte))) return false;
        if ('$lte' in condObj && !(Number(value) <= Number(condObj.$lte))) return false;
        if ('$eq' in condObj && value !== condObj.$eq) return false;
        if ('$ne' in condObj && value === condObj.$ne) return false;
        if ('$in' in condObj && !(condObj.$in as unknown[]).includes(value)) return false;
        if ('$nin' in condObj && (condObj.$nin as unknown[]).includes(value)) return false;
      } else {
        // Comparación directa
        if (value !== condition) return false;
      }
    }

    return true;
  }

  /**
   * Ejecutar una regla
   */
  private async executeRule(
    rule: AutomationRule,
    payload: Record<string, unknown>
  ): Promise<void> {
    const execution: RuleExecution = {
      ruleId: rule.id,
      triggeredBy: rule.trigger.event,
      triggeredAt: new Date(),
      shipmentId: payload.shipmentId as string | undefined,
      actionTaken: rule.action.type,
      success: false,
    };

    try {
      // Combinar params de la regla con datos del payload
      const actionParams = {
        ...rule.action.params,
        shipmentId: payload.shipmentId,
        trackingNumber: payload.trackingNumber,
      };

      // Ejecutar acción
      const result = await actionExecutor.execute(`rule_${rule.id}_${Date.now()}`, {
        type: rule.action.type,
        params: actionParams,
      });

      execution.success = result.success;

      // Actualizar contador de ejecuciones
      rule.executionCount++;
      rule.lastExecuted = new Date();

      // Guardar en memoria
      memoryManager.remember(`rule_execution_${rule.id}`, execution, {
        type: 'SHORT_TERM',
        importance: 60,
      });

      // Emitir evento
      eventBus.emit('action.executed', {
        ruleId: rule.id,
        actionType: rule.action.type,
        success: execution.success,
      });
    } catch (error) {
      execution.success = false;
      console.error(`Rule execution failed for ${rule.id}:`, error);
    }

    this.executionLog.push(execution);
  }

  /**
   * Agregar nueva regla
   */
  addRule(rule: AutomationRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Actualizar regla existente
   */
  updateRule(ruleId: string, updates: Partial<AutomationRule>): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    Object.assign(rule, updates);
    return true;
  }

  /**
   * Eliminar regla
   */
  deleteRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  /**
   * Habilitar/deshabilitar regla
   */
  toggleRule(ruleId: string, enabled?: boolean): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    rule.enabled = enabled !== undefined ? enabled : !rule.enabled;
    return true;
  }

  /**
   * Obtener todas las reglas
   */
  getRules(): AutomationRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Obtener regla por ID
   */
  getRule(ruleId: string): AutomationRule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * Obtener log de ejecuciones
   */
  getExecutionLog(limit: number = 50): RuleExecution[] {
    return this.executionLog.slice(-limit);
  }

  /**
   * Habilitar/deshabilitar todo el sistema de reglas
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Verificar si el sistema está habilitado
   */
  isSystemEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Obtener estadísticas
   */
  getStats(): {
    totalRules: number;
    enabledRules: number;
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
  } {
    const rules = this.getRules();
    const successful = this.executionLog.filter(e => e.success).length;

    return {
      totalRules: rules.length,
      enabledRules: rules.filter(r => r.enabled).length,
      totalExecutions: this.executionLog.length,
      successfulExecutions: successful,
      failedExecutions: this.executionLog.length - successful,
    };
  }
}

// Singleton
export const rulesManager = new RulesManagerService();
export default rulesManager;
