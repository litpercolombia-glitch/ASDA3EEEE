// services/brain/decisions/DecisionEngine.ts
// Motor de decisiones que evalúa situaciones y propone acciones

import { UnifiedShipment, Decision, DecisionType, BrainEventType } from '../types/brain.types';
import { eventBus } from '../core/EventBus';
import { memoryManager } from '../core/MemoryManager';
import { knowledgeHub } from '../knowledge/KnowledgeHub';

export interface DecisionRule {
  id: string;
  name: string;
  description: string;
  priority: number; // 1-10, mayor = más importante
  condition: (context: DecisionContext) => boolean;
  decision: (context: DecisionContext) => Omit<Decision, 'id' | 'createdAt'>;
}

export interface DecisionContext {
  shipment?: UnifiedShipment;
  event?: {
    type: BrainEventType;
    payload: Record<string, unknown>;
  };
  aggregateData?: {
    totalShipments: number;
    delayedShipments: number;
    issueShipments: number;
    deliveredToday: number;
  };
}

export interface PendingDecision extends Decision {
  context: DecisionContext;
  expiresAt: Date;
}

class DecisionEngineService {
  private rules: DecisionRule[] = [];
  private pendingDecisions: Map<string, PendingDecision> = new Map();
  private decisionHistory: Decision[] = [];

  constructor() {
    this.initializeRules();
    this.setupEventListeners();
  }

  /**
   * Inicializar reglas de decisión
   */
  private initializeRules(): void {
    this.rules = [
      // Regla: Envío muy retrasado
      {
        id: 'delayed_shipment_alert',
        name: 'Alerta de Envío Retrasado',
        description: 'Alerta cuando un envío lleva más de 5 días en tránsito',
        priority: 8,
        condition: (ctx) => {
          if (!ctx.shipment) return false;
          return (
            ctx.shipment.daysInTransit > 5 &&
            ctx.shipment.currentStatus.value !== 'delivered' &&
            ctx.shipment.currentStatus.value !== 'returned'
          );
        },
        decision: (ctx) => ({
          type: 'escalate_alert',
          reason: `Envío ${ctx.shipment!.trackingNumber} lleva ${ctx.shipment!.daysInTransit} días sin entregarse`,
          confidence: 95,
          action: {
            type: 'create_alert',
            params: {
              severity: 'high',
              shipmentId: ctx.shipment!.id,
              trackingNumber: ctx.shipment!.trackingNumber,
              message: `Envío retrasado: ${ctx.shipment!.daysInTransit} días en tránsito`,
            },
          },
        }),
      },

      // Regla: Envío con novedad requiere seguimiento
      {
        id: 'issue_requires_action',
        name: 'Novedad Requiere Acción',
        description: 'Cuando un envío tiene novedad, sugerir contactar transportadora',
        priority: 9,
        condition: (ctx) => {
          if (!ctx.shipment) return false;
          return ctx.shipment.hasIssue && ctx.shipment.currentStatus.value === 'issue';
        },
        decision: (ctx) => ({
          type: 'suggest_action',
          reason: `Envío ${ctx.shipment!.trackingNumber} tiene una novedad que requiere atención`,
          confidence: 90,
          action: {
            type: 'suggest',
            params: {
              suggestion: 'contact_carrier',
              shipmentId: ctx.shipment!.id,
              carrier: ctx.shipment!.carrier.value,
              message: 'Contactar transportadora para resolver novedad',
            },
          },
        }),
      },

      // Regla: Notificar cliente de entrega próxima
      {
        id: 'notify_near_delivery',
        name: 'Notificar Entrega Próxima',
        description: 'Notificar al cliente cuando el envío está en reparto',
        priority: 7,
        condition: (ctx) => {
          if (!ctx.shipment) return false;
          return ctx.shipment.currentStatus.value === 'out_for_delivery';
        },
        decision: (ctx) => ({
          type: 'send_notification',
          reason: `Envío ${ctx.shipment!.trackingNumber} está en reparto`,
          confidence: 95,
          action: {
            type: 'push_notification',
            params: {
              type: 'delivery_soon',
              shipmentId: ctx.shipment!.id,
              title: '¡Tu pedido está en camino!',
              body: `El envío ${ctx.shipment!.trackingNumber} llegará hoy`,
              customerPhone: ctx.shipment!.customer.phone?.value,
            },
          },
        }),
      },

      // Regla: WhatsApp automático para envíos entregados
      {
        id: 'whatsapp_delivered',
        name: 'WhatsApp Entrega Exitosa',
        description: 'Enviar WhatsApp confirmando entrega exitosa',
        priority: 6,
        condition: (ctx) => {
          if (!ctx.shipment) return false;
          return ctx.shipment.currentStatus.value === 'delivered';
        },
        decision: (ctx) => ({
          type: 'send_whatsapp',
          reason: `Envío ${ctx.shipment!.trackingNumber} entregado exitosamente`,
          confidence: 85,
          action: {
            type: 'whatsapp',
            params: {
              template: 'delivery_confirmation',
              phone: ctx.shipment!.customer.phone?.value,
              variables: {
                customerName: ctx.shipment!.customer.name.value,
                trackingNumber: ctx.shipment!.trackingNumber,
                deliveryDate: ctx.shipment!.actualDelivery?.toLocaleDateString('es-CO'),
              },
            },
          },
        }),
      },

      // Regla: Predecir posible retraso
      {
        id: 'predict_delay',
        name: 'Predicción de Retraso',
        description: 'Predecir si un envío puede retrasarse basado en historial',
        priority: 5,
        condition: (ctx) => {
          if (!ctx.shipment) return false;
          const predictions = knowledgeHub.getPredictionForShipment(ctx.shipment.id);
          return predictions ? predictions.issueRisk.value > 0.5 : false;
        },
        decision: (ctx) => {
          const predictions = knowledgeHub.getPredictionForShipment(ctx.shipment!.id);
          return {
            type: 'predict_delay',
            reason: `Envío ${ctx.shipment!.trackingNumber} tiene ${Math.round((predictions?.issueRisk.value || 0) * 100)}% de riesgo de retraso`,
            confidence: predictions?.issueRisk.confidence || 60,
            action: {
              type: 'warning',
              params: {
                shipmentId: ctx.shipment!.id,
                riskLevel: predictions?.issueRisk.value,
                factors: predictions?.issueRisk.factors,
              },
            },
          };
        },
      },

      // Regla: Crear tarea para envíos sin actualización
      {
        id: 'stale_shipment_task',
        name: 'Tarea para Envío Sin Actualización',
        description: 'Crear tarea cuando un envío no tiene actualizaciones en 48h',
        priority: 6,
        condition: (ctx) => {
          if (!ctx.shipment) return false;
          const hoursSinceUpdate =
            (Date.now() - ctx.shipment.lastUpdate.getTime()) / (1000 * 60 * 60);
          return (
            hoursSinceUpdate > 48 &&
            ctx.shipment.currentStatus.value !== 'delivered' &&
            ctx.shipment.currentStatus.value !== 'returned'
          );
        },
        decision: (ctx) => ({
          type: 'create_task',
          reason: `Envío ${ctx.shipment!.trackingNumber} sin actualizaciones en más de 48h`,
          confidence: 88,
          action: {
            type: 'task',
            params: {
              title: `Verificar envío ${ctx.shipment!.trackingNumber}`,
              description: 'Sin actualizaciones en 48+ horas',
              priority: 'medium',
              dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Mañana
              shipmentId: ctx.shipment!.id,
            },
          },
        }),
      },
    ];

    // Ordenar por prioridad
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Configurar listeners de eventos
   */
  private setupEventListeners(): void {
    // Evaluar decisiones cuando cambia estado de envío
    eventBus.on('shipment.updated', (event) => {
      const shipment = event.payload.shipment as UnifiedShipment | undefined;
      if (shipment) {
        this.evaluateForShipment(shipment);
      }
    });

    // Evaluar cuando hay alerta nueva
    eventBus.on('alert.created', (event) => {
      this.evaluateForEvent(event.type, event.payload);
    });
  }

  /**
   * Evaluar todas las reglas para un envío
   */
  evaluateForShipment(shipment: UnifiedShipment): Decision[] {
    const context: DecisionContext = { shipment };
    return this.evaluate(context);
  }

  /**
   * Evaluar reglas para un evento
   */
  evaluateForEvent(
    eventType: BrainEventType,
    payload: Record<string, unknown>
  ): Decision[] {
    const context: DecisionContext = {
      event: { type: eventType, payload },
    };
    return this.evaluate(context);
  }

  /**
   * Evaluar todas las reglas con un contexto dado
   */
  evaluate(context: DecisionContext): Decision[] {
    const decisions: Decision[] = [];

    for (const rule of this.rules) {
      try {
        if (rule.condition(context)) {
          const decisionData = rule.decision(context);
          const decision: Decision = {
            id: `decision_${rule.id}_${Date.now()}`,
            ...decisionData,
            createdAt: new Date(),
            result: 'pending',
          };

          decisions.push(decision);
          this.decisionHistory.push(decision);

          // Crear decisión pendiente
          const pending: PendingDecision = {
            ...decision,
            context,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
          };
          this.pendingDecisions.set(decision.id, pending);

          // Emitir evento
          eventBus.emit('decision.made', {
            decisionId: decision.id,
            type: decision.type,
            confidence: decision.confidence,
            ruleId: rule.id,
          });

          // Guardar en memoria
          memoryManager.remember(`decision_${decision.id}`, decision, {
            type: 'SHORT_TERM',
            importance: decision.confidence,
          });
        }
      } catch (error) {
        console.error(`Error evaluating rule ${rule.id}:`, error);
      }
    }

    return decisions;
  }

  /**
   * Evaluar todos los envíos activos
   */
  evaluateAllShipments(shipments: UnifiedShipment[]): Decision[] {
    const allDecisions: Decision[] = [];

    shipments.forEach(shipment => {
      const decisions = this.evaluateForShipment(shipment);
      allDecisions.push(...decisions);
    });

    return allDecisions;
  }

  /**
   * Obtener decisiones pendientes
   */
  getPendingDecisions(): PendingDecision[] {
    // Limpiar expiradas
    const now = new Date();
    for (const [id, decision] of this.pendingDecisions) {
      if (decision.expiresAt < now) {
        this.pendingDecisions.delete(id);
      }
    }

    return Array.from(this.pendingDecisions.values());
  }

  /**
   * Aprobar una decisión para ejecución
   */
  approveDecision(decisionId: string): Decision | null {
    const pending = this.pendingDecisions.get(decisionId);
    if (!pending) return null;

    pending.result = 'pending'; // Will be executed
    this.pendingDecisions.delete(decisionId);

    eventBus.emit('action.executed', {
      decisionId,
      action: pending.action,
      approved: true,
    });

    return pending;
  }

  /**
   * Rechazar una decisión
   */
  rejectDecision(decisionId: string): boolean {
    const pending = this.pendingDecisions.get(decisionId);
    if (!pending) return false;

    pending.result = 'failure';
    this.pendingDecisions.delete(decisionId);

    return true;
  }

  /**
   * Obtener historial de decisiones
   */
  getDecisionHistory(limit: number = 50): Decision[] {
    return this.decisionHistory.slice(-limit);
  }

  /**
   * Agregar regla personalizada
   */
  addRule(rule: DecisionRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Obtener todas las reglas
   */
  getRules(): DecisionRule[] {
    return this.rules;
  }
}

// Singleton
export const decisionEngine = new DecisionEngineService();
export default decisionEngine;
