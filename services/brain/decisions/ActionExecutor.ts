// services/brain/decisions/ActionExecutor.ts
// Ejecuta las acciones decididas por el motor de decisiones

import { Decision, DecisionType } from '../types/brain.types';
import { eventBus } from '../core/EventBus';
import { memoryManager } from '../core/MemoryManager';

export interface ActionResult {
  success: boolean;
  decisionId: string;
  actionType: string;
  message: string;
  data?: Record<string, unknown>;
  executedAt: Date;
  error?: string;
}

export interface ActionHandler {
  type: string;
  execute: (params: Record<string, unknown>) => Promise<ActionResult>;
}

class ActionExecutorService {
  private handlers: Map<string, ActionHandler> = new Map();
  private executionHistory: ActionResult[] = [];
  private isAutoExecuteEnabled: boolean = false;

  constructor() {
    this.registerDefaultHandlers();
    this.setupEventListeners();
  }

  /**
   * Registrar handlers por defecto
   */
  private registerDefaultHandlers(): void {
    // Handler: Crear alerta
    this.registerHandler({
      type: 'create_alert',
      execute: async (params) => {
        try {
          eventBus.emit('alert.created', {
            severity: params.severity,
            shipmentId: params.shipmentId,
            trackingNumber: params.trackingNumber,
            message: params.message,
          });

          return {
            success: true,
            decisionId: params.decisionId as string,
            actionType: 'create_alert',
            message: `Alerta creada para envío ${params.trackingNumber}`,
            data: params,
            executedAt: new Date(),
          };
        } catch (error) {
          return {
            success: false,
            decisionId: params.decisionId as string,
            actionType: 'create_alert',
            message: 'Error al crear alerta',
            executedAt: new Date(),
            error: String(error),
          };
        }
      },
    });

    // Handler: Notificación push
    this.registerHandler({
      type: 'push_notification',
      execute: async (params) => {
        try {
          // En producción, esto llamaría al servicio de push notifications
          console.log('📱 Push notification:', {
            title: params.title,
            body: params.body,
            shipmentId: params.shipmentId,
          });

          // Simular envío exitoso
          return {
            success: true,
            decisionId: params.decisionId as string,
            actionType: 'push_notification',
            message: `Notificación enviada: ${params.title}`,
            data: { title: params.title, body: params.body },
            executedAt: new Date(),
          };
        } catch (error) {
          return {
            success: false,
            decisionId: params.decisionId as string,
            actionType: 'push_notification',
            message: 'Error al enviar notificación',
            executedAt: new Date(),
            error: String(error),
          };
        }
      },
    });

    // Handler: WhatsApp
    this.registerHandler({
      type: 'whatsapp',
      execute: async (params) => {
        try {
          if (!params.phone) {
            return {
              success: false,
              decisionId: params.decisionId as string,
              actionType: 'whatsapp',
              message: 'No hay número de teléfono disponible',
              executedAt: new Date(),
            };
          }

          // En producción, esto llamaría a la API de WhatsApp
          console.log('📲 WhatsApp message:', {
            phone: params.phone,
            template: params.template,
            variables: params.variables,
          });

          return {
            success: true,
            decisionId: params.decisionId as string,
            actionType: 'whatsapp',
            message: `WhatsApp enviado a ${params.phone}`,
            data: { phone: params.phone, template: params.template },
            executedAt: new Date(),
          };
        } catch (error) {
          return {
            success: false,
            decisionId: params.decisionId as string,
            actionType: 'whatsapp',
            message: 'Error al enviar WhatsApp',
            executedAt: new Date(),
            error: String(error),
          };
        }
      },
    });

    // Handler: Sugerencia
    this.registerHandler({
      type: 'suggest',
      execute: async (params) => {
        // Las sugerencias se muestran al usuario, no se ejecutan automáticamente
        return {
          success: true,
          decisionId: params.decisionId as string,
          actionType: 'suggest',
          message: `Sugerencia generada: ${params.message}`,
          data: params,
          executedAt: new Date(),
        };
      },
    });

    // Handler: Warning
    this.registerHandler({
      type: 'warning',
      execute: async (params) => {
        eventBus.emit('shipment.delayed', {
          shipmentId: params.shipmentId,
          riskLevel: params.riskLevel,
          factors: params.factors,
        });

        return {
          success: true,
          decisionId: params.decisionId as string,
          actionType: 'warning',
          message: 'Advertencia de riesgo registrada',
          data: params,
          executedAt: new Date(),
        };
      },
    });

    // Handler: Crear tarea
    this.registerHandler({
      type: 'task',
      execute: async (params) => {
        // En producción, esto crearía una tarea en el sistema
        console.log('📋 Task created:', {
          title: params.title,
          description: params.description,
          priority: params.priority,
          dueDate: params.dueDate,
        });

        return {
          success: true,
          decisionId: params.decisionId as string,
          actionType: 'task',
          message: `Tarea creada: ${params.title}`,
          data: params,
          executedAt: new Date(),
        };
      },
    });
  }

  /**
   * Configurar listeners de eventos
   */
  private setupEventListeners(): void {
    // Escuchar decisiones aprobadas
    eventBus.on('action.executed', async (event) => {
      if (event.payload.approved && event.payload.action) {
        const action = event.payload.action as { type: string; params: Record<string, unknown> };
        await this.execute(event.payload.decisionId as string, action);
      }
    });

    // Auto-ejecutar decisiones de alta confianza si está habilitado
    eventBus.on('decision.made', async (event) => {
      if (this.isAutoExecuteEnabled && (event.payload.confidence as number) >= 90) {
        // En producción, podrías auto-ejecutar decisiones de alta confianza
        console.log('Auto-execute available for high confidence decision:', event.payload);
      }
    });
  }

  /**
   * Registrar un handler de acción
   */
  registerHandler(handler: ActionHandler): void {
    this.handlers.set(handler.type, handler);
  }

  /**
   * Ejecutar una decisión
   */
  async executeDecision(decision: Decision): Promise<ActionResult> {
    const action = decision.action;
    return this.execute(decision.id, action);
  }

  /**
   * Ejecutar una acción
   */
  async execute(
    decisionId: string,
    action: { type: string; params: Record<string, unknown> }
  ): Promise<ActionResult> {
    const handler = this.handlers.get(action.type);

    if (!handler) {
      const result: ActionResult = {
        success: false,
        decisionId,
        actionType: action.type,
        message: `No hay handler para el tipo de acción: ${action.type}`,
        executedAt: new Date(),
      };
      this.executionHistory.push(result);
      return result;
    }

    try {
      const result = await handler.execute({
        ...action.params,
        decisionId,
      });

      this.executionHistory.push(result);

      // Guardar resultado en memoria
      memoryManager.remember(`action_result_${decisionId}`, result, {
        type: 'SHORT_TERM',
        importance: result.success ? 60 : 80,
      });

      // Emitir evento de resultado
      eventBus.emit('action.executed', {
        decisionId,
        result: result.success ? 'success' : 'failure',
        actionType: action.type,
      });

      return result;
    } catch (error) {
      const result: ActionResult = {
        success: false,
        decisionId,
        actionType: action.type,
        message: 'Error durante la ejecución',
        executedAt: new Date(),
        error: String(error),
      };

      this.executionHistory.push(result);
      return result;
    }
  }

  /**
   * Ejecutar múltiples decisiones
   */
  async executeBatch(decisions: Decision[]): Promise<ActionResult[]> {
    const results: ActionResult[] = [];

    for (const decision of decisions) {
      const result = await this.executeDecision(decision);
      results.push(result);
    }

    return results;
  }

  /**
   * Habilitar/deshabilitar auto-ejecución
   */
  setAutoExecute(enabled: boolean): void {
    this.isAutoExecuteEnabled = enabled;
  }

  /**
   * Obtener historial de ejecuciones
   */
  getExecutionHistory(limit: number = 50): ActionResult[] {
    return this.executionHistory.slice(-limit);
  }

  /**
   * Obtener estadísticas de ejecución
   */
  getStats(): {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    successRate: number;
    byActionType: Record<string, { success: number; failed: number }>;
  } {
    const byType: Record<string, { success: number; failed: number }> = {};

    let successful = 0;
    let failed = 0;

    this.executionHistory.forEach(result => {
      if (!byType[result.actionType]) {
        byType[result.actionType] = { success: 0, failed: 0 };
      }

      if (result.success) {
        successful++;
        byType[result.actionType].success++;
      } else {
        failed++;
        byType[result.actionType].failed++;
      }
    });

    return {
      totalExecutions: this.executionHistory.length,
      successfulExecutions: successful,
      failedExecutions: failed,
      successRate: this.executionHistory.length > 0
        ? (successful / this.executionHistory.length) * 100
        : 0,
      byActionType: byType,
    };
  }

  /**
   * Obtener handlers registrados
   */
  getRegisteredHandlers(): string[] {
    return Array.from(this.handlers.keys());
  }
}

// Singleton
export const actionExecutor = new ActionExecutorService();
export default actionExecutor;
