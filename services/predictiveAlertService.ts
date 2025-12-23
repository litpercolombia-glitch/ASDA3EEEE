// services/predictiveAlertService.ts
// Sistema de Alertas Predictivas Nivel Amazon
// Detecta problemas antes de que ocurran y automatiza acciones

import { eventBus } from './brain/core/EventBus';
import { memoryManager } from './brain/core/MemoryManager';
import { guideHistoryService, GuideHistory, RiskLevel } from './guideHistoryService';

// ============================================
// TIPOS E INTERFACES
// ============================================

export type AlertType =
  | 'delivery_risk'
  | 'delay_pattern'
  | 'carrier_issue'
  | 'customer_action_required'
  | 'office_pickup'
  | 'return_risk'
  | 'performance_drop'
  | 'zone_issue';

export type AlertPriority = 'critical' | 'high' | 'medium' | 'low';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed';

export interface PredictiveAlert {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  status: AlertStatus;
  title: string;
  description: string;
  affectedGuides: string[];
  affectedCount: number;
  prediction: {
    probability: number;
    impact: string;
    timeframe: string;
  };
  recommendations: string[];
  automations: {
    action: string;
    enabled: boolean;
    executed: boolean;
  }[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: (guides: GuideHistory[]) => GuideHistory[];
  alertType: AlertType;
  priority: AlertPriority;
  enabled: boolean;
  cooldownMinutes: number;
  lastTriggered?: Date;
}

export interface AlertStats {
  total: number;
  byType: Record<AlertType, number>;
  byPriority: Record<AlertPriority, number>;
  byStatus: Record<AlertStatus, number>;
  resolvedToday: number;
  avgResolutionTime: number;
}

// ============================================
// REGLAS DE ALERTAS PREDEFINIDAS
// ============================================

const DEFAULT_RULES: AlertRule[] = [
  {
    id: 'critical_delay',
    name: 'Retraso Crítico',
    description: 'Guías con más de 7 días en tránsito',
    condition: (guides) => guides.filter(g =>
      g.metrics.diasEnTransito > 7 &&
      g.currentStatus !== 'entregado' &&
      g.currentStatus !== 'devuelto'
    ),
    alertType: 'delivery_risk',
    priority: 'critical',
    enabled: true,
    cooldownMinutes: 60,
  },
  {
    id: 'office_pickup_risk',
    name: 'Riesgo de Devolución en Oficina',
    description: 'Guías en oficina por más de 3 días',
    condition: (guides) => guides.filter(g =>
      g.currentStatus === 'en_oficina' &&
      g.metrics.diasSinMovimiento > 3
    ),
    alertType: 'office_pickup',
    priority: 'high',
    enabled: true,
    cooldownMinutes: 120,
  },
  {
    id: 'novelty_unresolved',
    name: 'Novedades Sin Resolver',
    description: 'Guías con novedad activa por más de 24 horas',
    condition: (guides) => guides.filter(g =>
      g.metrics.tieneNovedad &&
      g.metrics.diasSinMovimiento >= 1 &&
      g.currentStatus !== 'entregado'
    ),
    alertType: 'customer_action_required',
    priority: 'high',
    enabled: true,
    cooldownMinutes: 180,
  },
  {
    id: 'carrier_performance',
    name: 'Problema con Transportadora',
    description: 'Transportadora con alta tasa de problemas',
    condition: (guides) => {
      const byCarrier: Record<string, { total: number; issues: number }> = {};
      guides.forEach(g => {
        if (!byCarrier[g.transportadora]) {
          byCarrier[g.transportadora] = { total: 0, issues: 0 };
        }
        byCarrier[g.transportadora].total++;
        if (g.metrics.tieneNovedad || g.riskLevel === 'critico' || g.riskLevel === 'alto') {
          byCarrier[g.transportadora].issues++;
        }
      });
      // Retornar guías de transportadoras con >30% de problemas
      const problemCarriers = Object.entries(byCarrier)
        .filter(([_, stats]) => stats.total >= 5 && (stats.issues / stats.total) > 0.3)
        .map(([carrier]) => carrier);
      return guides.filter(g => problemCarriers.includes(g.transportadora));
    },
    alertType: 'carrier_issue',
    priority: 'medium',
    enabled: true,
    cooldownMinutes: 240,
  },
  {
    id: 'return_risk',
    name: 'Alto Riesgo de Devolución',
    description: 'Guías con alta probabilidad de devolución',
    condition: (guides) => guides.filter(g =>
      g.prediction.entrega === 'critico' &&
      g.currentStatus !== 'devuelto' &&
      g.currentStatus !== 'entregado'
    ),
    alertType: 'return_risk',
    priority: 'critical',
    enabled: true,
    cooldownMinutes: 60,
  },
  {
    id: 'zone_delay',
    name: 'Retraso por Zona',
    description: 'Múltiples guías retrasadas a la misma zona',
    condition: (guides) => {
      const byCity: Record<string, GuideHistory[]> = {};
      guides.forEach(g => {
        if (g.metrics.diasEnTransito > 5 && g.currentStatus !== 'entregado') {
          if (!byCity[g.ciudadDestino]) byCity[g.ciudadDestino] = [];
          byCity[g.ciudadDestino].push(g);
        }
      });
      // Ciudades con 3+ guías retrasadas
      const problemCities = Object.entries(byCity)
        .filter(([_, guides]) => guides.length >= 3)
        .flatMap(([_, guides]) => guides);
      return problemCities;
    },
    alertType: 'zone_issue',
    priority: 'medium',
    enabled: true,
    cooldownMinutes: 360,
  },
];

// ============================================
// SERVICIO DE ALERTAS PREDICTIVAS
// ============================================

class PredictiveAlertService {
  private alerts: Map<string, PredictiveAlert> = new Map();
  private rules: AlertRule[] = [...DEFAULT_RULES];
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    console.log('🚨 [Alerts] Inicializando servicio de alertas predictivas...');
    this.loadFromMemory();
    this.setupEventListeners();
    this.startPeriodicCheck();
    console.log(`🚨 [Alerts] Servicio inicializado con ${this.alerts.size} alertas activas`);
  }

  private loadFromMemory(): void {
    const savedAlerts = memoryManager.recallByCategory('predictive_alerts');
    savedAlerts.forEach(entry => {
      const alert = entry.data as PredictiveAlert;
      if (alert && alert.id && alert.status === 'active') {
        this.alerts.set(alert.id, alert);
      }
    });
  }

  private setupEventListeners(): void {
    eventBus.on('guide.event_added', () => {
      this.checkAllRules();
    });

    eventBus.on('guide.history_created', () => {
      this.checkAllRules();
    });
  }

  private startPeriodicCheck(): void {
    // Verificar cada 5 minutos
    this.checkInterval = setInterval(() => {
      this.checkAllRules();
    }, 5 * 60 * 1000);
  }

  // ==================== EVALUACIÓN DE REGLAS ====================

  /**
   * Verificar todas las reglas
   */
  checkAllRules(): void {
    const guides = guideHistoryService.getAllHistories();
    if (guides.length === 0) return;

    this.rules.filter(r => r.enabled).forEach(rule => {
      this.evaluateRule(rule, guides);
    });
  }

  private evaluateRule(rule: AlertRule, guides: GuideHistory[]): void {
    // Verificar cooldown
    if (rule.lastTriggered) {
      const elapsed = Date.now() - rule.lastTriggered.getTime();
      if (elapsed < rule.cooldownMinutes * 60 * 1000) {
        return;
      }
    }

    // Evaluar condición
    const affectedGuides = rule.condition(guides);

    if (affectedGuides.length > 0) {
      this.createOrUpdateAlert(rule, affectedGuides);
      rule.lastTriggered = new Date();
    }
  }

  private createOrUpdateAlert(rule: AlertRule, affectedGuides: GuideHistory[]): void {
    const existingAlertId = `${rule.id}_active`;
    const existing = this.alerts.get(existingAlertId);

    if (existing && existing.status === 'active') {
      // Actualizar alerta existente
      existing.affectedGuides = affectedGuides.map(g => g.guia);
      existing.affectedCount = affectedGuides.length;
      existing.updatedAt = new Date();
      this.persistAlert(existing);
      return;
    }

    // Crear nueva alerta
    const alert = this.generateAlert(rule, affectedGuides);
    this.alerts.set(alert.id, alert);
    this.persistAlert(alert);

    // Emitir evento
    eventBus.emit('alert.created', {
      alertId: alert.id,
      type: alert.type,
      priority: alert.priority,
      affectedCount: alert.affectedCount,
    });

    console.log(`🚨 [Alerts] Nueva alerta: ${alert.title} (${alert.affectedCount} guías)`);
  }

  private generateAlert(rule: AlertRule, affectedGuides: GuideHistory[]): PredictiveAlert {
    const now = new Date();

    // Calcular probabilidad e impacto
    const avgRisk = affectedGuides.reduce((sum, g) => {
      const riskScore = { bajo: 25, medio: 50, alto: 75, critico: 100 };
      return sum + (riskScore[g.riskLevel] || 50);
    }, 0) / affectedGuides.length;

    const estimatedLoss = affectedGuides.reduce((sum, g) => sum + (g.valor || 50000), 0);

    // Generar recomendaciones
    const recommendations = this.generateRecommendations(rule, affectedGuides);

    // Generar automatizaciones
    const automations = this.generateAutomations(rule, affectedGuides);

    return {
      id: `${rule.id}_${Date.now()}`,
      type: rule.alertType,
      priority: rule.priority,
      status: 'active',
      title: this.generateTitle(rule, affectedGuides),
      description: this.generateDescription(rule, affectedGuides),
      affectedGuides: affectedGuides.map(g => g.guia),
      affectedCount: affectedGuides.length,
      prediction: {
        probability: Math.round(avgRisk),
        impact: `Pérdida potencial: $${estimatedLoss.toLocaleString('es-CO')} COP`,
        timeframe: this.estimateTimeframe(rule, affectedGuides),
      },
      recommendations,
      automations,
      metadata: {
        ruleId: rule.id,
        avgDaysInTransit: affectedGuides.reduce((s, g) => s + g.metrics.diasEnTransito, 0) / affectedGuides.length,
        carriers: [...new Set(affectedGuides.map(g => g.transportadora))],
        cities: [...new Set(affectedGuides.map(g => g.ciudadDestino))],
      },
      createdAt: now,
      updatedAt: now,
    };
  }

  private generateTitle(rule: AlertRule, guides: GuideHistory[]): string {
    switch (rule.alertType) {
      case 'delivery_risk':
        return `${guides.length} guías en riesgo de no entrega`;
      case 'office_pickup':
        return `${guides.length} guías en oficina requieren acción`;
      case 'customer_action_required':
        return `${guides.length} novedades sin resolver`;
      case 'carrier_issue':
        const carriers = [...new Set(guides.map(g => g.transportadora))];
        return `Problemas con ${carriers.join(', ')}`;
      case 'return_risk':
        return `${guides.length} guías con alto riesgo de devolución`;
      case 'zone_issue':
        const cities = [...new Set(guides.map(g => g.ciudadDestino))];
        return `Retrasos en zona: ${cities.slice(0, 2).join(', ')}`;
      default:
        return rule.name;
    }
  }

  private generateDescription(rule: AlertRule, guides: GuideHistory[]): string {
    const avgDays = guides.reduce((s, g) => s + g.metrics.diasEnTransito, 0) / guides.length;
    const withNovedad = guides.filter(g => g.metrics.tieneNovedad).length;

    switch (rule.alertType) {
      case 'delivery_risk':
        return `Promedio de ${avgDays.toFixed(1)} días en tránsito. ${withNovedad} con novedad activa.`;
      case 'office_pickup':
        return `Estas guías llevan más de 3 días en oficina y pueden ser devueltas pronto.`;
      case 'customer_action_required':
        return `Novedades que requieren contacto con cliente o gestión con transportadora.`;
      case 'carrier_issue':
        return `Tasa de problemas superior al 30%. Considerar escalamiento.`;
      case 'return_risk':
        return `Alta probabilidad de devolución si no se toman acciones inmediatas.`;
      case 'zone_issue':
        return `Múltiples guías con retraso hacia la misma zona. Posible problema regional.`;
      default:
        return rule.description;
    }
  }

  private generateRecommendations(rule: AlertRule, guides: GuideHistory[]): string[] {
    const recommendations: string[] = [];

    switch (rule.alertType) {
      case 'delivery_risk':
        recommendations.push('Contactar transportadora para escalamiento');
        recommendations.push('Llamar a clientes afectados');
        recommendations.push('Considerar reenvío con otra transportadora');
        break;
      case 'office_pickup':
        recommendations.push('Llamar clientes para coordinar recogida');
        recommendations.push('Enviar WhatsApp con horarios de oficina');
        recommendations.push('Programar reintento de entrega');
        break;
      case 'customer_action_required':
        recommendations.push('Verificar dirección con cliente');
        recommendations.push('Confirmar disponibilidad de recepción');
        recommendations.push('Actualizar datos de contacto');
        break;
      case 'carrier_issue':
        recommendations.push('Escalar con ejecutivo de cuenta');
        recommendations.push('Solicitar compensación por servicio');
        recommendations.push('Evaluar alternativas de transportadora');
        break;
      case 'return_risk':
        recommendations.push('URGENTE: Contactar cliente inmediatamente');
        recommendations.push('Ofrecer alternativa de entrega');
        recommendations.push('Coordinar con transportadora');
        break;
      case 'zone_issue':
        recommendations.push('Verificar condiciones de la zona');
        recommendations.push('Contactar transportadora sobre la zona');
        recommendations.push('Considerar rutas alternativas');
        break;
    }

    return recommendations;
  }

  private generateAutomations(rule: AlertRule, guides: GuideHistory[]): PredictiveAlert['automations'] {
    const automations: PredictiveAlert['automations'] = [];

    if (guides.some(g => g.telefono)) {
      automations.push({
        action: 'Enviar WhatsApp masivo a clientes',
        enabled: false,
        executed: false,
      });
    }

    automations.push({
      action: 'Programar llamadas automáticas',
      enabled: false,
      executed: false,
    });

    if (rule.priority === 'critical' || rule.priority === 'high') {
      automations.push({
        action: 'Escalar a supervisor',
        enabled: true,
        executed: false,
      });
    }

    return automations;
  }

  private estimateTimeframe(rule: AlertRule, guides: GuideHistory[]): string {
    switch (rule.alertType) {
      case 'office_pickup':
        return 'Devolución en 2-3 días si no hay acción';
      case 'return_risk':
        return 'Devolución inminente (24-48 horas)';
      case 'delivery_risk':
        return 'Requiere acción en las próximas 24 horas';
      default:
        return 'Próximas 48-72 horas';
    }
  }

  // ==================== GESTIÓN DE ALERTAS ====================

  /**
   * Obtener todas las alertas activas
   */
  getActiveAlerts(): PredictiveAlert[] {
    return Array.from(this.alerts.values())
      .filter(a => a.status === 'active')
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
  }

  /**
   * Obtener alerta por ID
   */
  getAlert(id: string): PredictiveAlert | undefined {
    return this.alerts.get(id);
  }

  /**
   * Obtener alertas por tipo
   */
  getAlertsByType(type: AlertType): PredictiveAlert[] {
    return Array.from(this.alerts.values()).filter(a => a.type === type);
  }

  /**
   * Marcar alerta como reconocida
   */
  acknowledgeAlert(id: string): boolean {
    const alert = this.alerts.get(id);
    if (!alert) return false;

    alert.status = 'acknowledged';
    alert.updatedAt = new Date();
    this.persistAlert(alert);
    return true;
  }

  /**
   * Resolver alerta
   */
  resolveAlert(id: string): boolean {
    const alert = this.alerts.get(id);
    if (!alert) return false;

    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    alert.updatedAt = new Date();
    this.persistAlert(alert);

    eventBus.emit('alert.resolved', { alertId: id });
    return true;
  }

  /**
   * Descartar alerta
   */
  dismissAlert(id: string): boolean {
    const alert = this.alerts.get(id);
    if (!alert) return false;

    alert.status = 'dismissed';
    alert.updatedAt = new Date();
    this.persistAlert(alert);
    return true;
  }

  /**
   * Ejecutar automatización
   */
  async executeAutomation(alertId: string, automationIndex: number): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    if (!alert || !alert.automations[automationIndex]) return false;

    const automation = alert.automations[automationIndex];

    // Aquí iría la lógica real de automatización
    console.log(`🚨 [Alerts] Ejecutando: ${automation.action}`);

    automation.executed = true;
    alert.updatedAt = new Date();
    this.persistAlert(alert);

    eventBus.emit('automation.executed', {
      alertId,
      action: automation.action,
    });

    return true;
  }

  // ==================== ESTADÍSTICAS ====================

  /**
   * Obtener estadísticas de alertas
   */
  getStats(): AlertStats {
    const alerts = Array.from(this.alerts.values());
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const byType: Record<AlertType, number> = {
      delivery_risk: 0, delay_pattern: 0, carrier_issue: 0,
      customer_action_required: 0, office_pickup: 0, return_risk: 0,
      performance_drop: 0, zone_issue: 0,
    };
    const byPriority: Record<AlertPriority, number> = {
      critical: 0, high: 0, medium: 0, low: 0,
    };
    const byStatus: Record<AlertStatus, number> = {
      active: 0, acknowledged: 0, resolved: 0, dismissed: 0,
    };

    let resolvedToday = 0;
    let totalResolutionTime = 0;
    let resolvedCount = 0;

    alerts.forEach(alert => {
      byType[alert.type]++;
      byPriority[alert.priority]++;
      byStatus[alert.status]++;

      if (alert.resolvedAt) {
        const resolvedDate = new Date(alert.resolvedAt);
        resolvedDate.setHours(0, 0, 0, 0);
        if (resolvedDate.getTime() === today.getTime()) {
          resolvedToday++;
        }
        totalResolutionTime += alert.resolvedAt.getTime() - alert.createdAt.getTime();
        resolvedCount++;
      }
    });

    return {
      total: alerts.length,
      byType,
      byPriority,
      byStatus,
      resolvedToday,
      avgResolutionTime: resolvedCount > 0 ? totalResolutionTime / resolvedCount / (1000 * 60 * 60) : 0, // en horas
    };
  }

  /**
   * Obtener contexto para IA
   */
  getAIContext(): string {
    const activeAlerts = this.getActiveAlerts();
    const stats = this.getStats();

    if (activeAlerts.length === 0) {
      return 'No hay alertas activas en este momento.';
    }

    return `
ALERTAS ACTIVAS: ${activeAlerts.length}

CRÍTICAS (${stats.byPriority.critical}):
${activeAlerts.filter(a => a.priority === 'critical').map(a =>
  `- ${a.title} (${a.affectedCount} guías)`
).join('\n') || 'Ninguna'}

ALTAS (${stats.byPriority.high}):
${activeAlerts.filter(a => a.priority === 'high').map(a =>
  `- ${a.title} (${a.affectedCount} guías)`
).join('\n') || 'Ninguna'}

RECOMENDACIONES URGENTES:
${activeAlerts.slice(0, 3).flatMap(a => a.recommendations.slice(0, 2)).join('\n- ')}
`.trim();
  }

  // ==================== PERSISTENCIA ====================

  private persistAlert(alert: PredictiveAlert): void {
    memoryManager.remember('predictive_alerts', alert, {
      type: 'MEDIUM_TERM',
      importance: alert.priority === 'critical' ? 90 : alert.priority === 'high' ? 70 : 50,
      id: `alert_${alert.id}`,
    });
  }

  // ==================== CONFIGURACIÓN ====================

  /**
   * Activar/desactivar regla
   */
  setRuleEnabled(ruleId: string, enabled: boolean): boolean {
    const rule = this.rules.find(r => r.id === ruleId);
    if (!rule) return false;
    rule.enabled = enabled;
    return true;
  }

  /**
   * Obtener reglas
   */
  getRules(): AlertRule[] {
    return [...this.rules];
  }

  /**
   * Limpiar alertas resueltas
   */
  clearResolved(): void {
    const resolved = Array.from(this.alerts.values())
      .filter(a => a.status === 'resolved' || a.status === 'dismissed');
    resolved.forEach(a => this.alerts.delete(a.id));
  }

  /**
   * Detener servicio
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

// Singleton
export const predictiveAlertService = new PredictiveAlertService();
export default predictiveAlertService;
