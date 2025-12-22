// services/skills/SkillsEngine.ts
// Motor de Skills - Automatizaciones ejecutables

import { integrationManager } from '../integrations/IntegrationManager';

// ==================== TIPOS ====================

export type SkillTriggerType = 'event' | 'schedule' | 'condition' | 'manual' | 'command';

export type SkillActionType =
  | 'whatsapp_send'
  | 'whatsapp_template'
  | 'notification'
  | 'update_status'
  | 'create_alert'
  | 'create_ticket'
  | 'api_call'
  | 'log';

export interface SkillTrigger {
  type: SkillTriggerType;
  event?: string; // e.g., 'order.created', 'shipment.in_office'
  schedule?: string; // cron expression
  condition?: SkillCondition;
  commands?: string[]; // Comandos naturales que activan el skill
}

export interface SkillCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: unknown;
}

export interface SkillAction {
  type: SkillActionType;
  config: Record<string, unknown>;
  delay?: number; // ms antes de ejecutar
  retries?: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: 'logistica' | 'ventas' | 'hibrido' | 'analisis';
  icon: string;
  color: string;

  enabled: boolean;
  trigger: SkillTrigger;
  conditions: SkillCondition[];
  actions: SkillAction[];

  settings: {
    schedule?: { start: string; end: string }; // Horario de ejecución
    maxExecutions?: number; // Límite por día
    cooldown?: number; // ms entre ejecuciones para mismo target
    template?: string; // Template de WhatsApp a usar
  };

  stats: {
    totalExecutions: number;
    successCount: number;
    failCount: number;
    lastExecution?: Date;
    todayExecutions: number;
  };

  createdAt: Date;
  updatedAt: Date;
}

export interface SkillExecution {
  id: string;
  skillId: string;
  skillName: string;
  trigger: string;
  target?: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  result?: string;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}

// ==================== SKILLS PREDEFINIDOS ====================

const DEFAULT_SKILLS: Skill[] = [
  {
    id: 'confirmacion_pedidos',
    name: 'Confirmación de Pedidos',
    description: 'Envía WhatsApp automático para confirmar nuevos pedidos',
    category: 'ventas',
    icon: '✅',
    color: 'emerald',
    enabled: false,
    trigger: {
      type: 'event',
      event: 'order.created',
      commands: ['confirmar pedidos', 'activar confirmación'],
    },
    conditions: [
      { field: 'status', operator: 'equals', value: 'pending' },
    ],
    actions: [
      {
        type: 'whatsapp_template',
        config: {
          templateId: 'confirmacion_pedido',
          variables: ['customerName', 'orderId', 'total'],
        },
      },
      {
        type: 'update_status',
        config: { newStatus: 'awaiting_confirmation' },
      },
    ],
    settings: {
      schedule: { start: '08:00', end: '20:00' },
      maxExecutions: 100,
      cooldown: 3600000, // 1 hora
    },
    stats: {
      totalExecutions: 0,
      successCount: 0,
      failCount: 0,
      todayExecutions: 0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'reclamo_oficina',
    name: 'Reclamo en Oficina',
    description: 'Notifica a clientes con pedidos en oficina más de 48h',
    category: 'logistica',
    icon: '📍',
    color: 'amber',
    enabled: false,
    trigger: {
      type: 'condition',
      condition: { field: 'status', operator: 'equals', value: 'in_office' },
      commands: ['reclamar oficina', 'notificar oficina'],
    },
    conditions: [
      { field: 'daysInOffice', operator: 'greater_than', value: 2 },
    ],
    actions: [
      {
        type: 'whatsapp_template',
        config: {
          templateId: 'reclamo_oficina',
          variables: ['customerName', 'trackingNumber', 'officeAddress'],
        },
      },
      {
        type: 'create_alert',
        config: { severity: 'warning', message: 'Pedido en oficina +48h' },
      },
    ],
    settings: {
      schedule: { start: '09:00', end: '18:00' },
      maxExecutions: 50,
      cooldown: 86400000, // 24 horas
    },
    stats: {
      totalExecutions: 0,
      successCount: 0,
      failCount: 0,
      todayExecutions: 0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'recordatorios_automaticos',
    name: 'Recordatorios Automáticos',
    description: 'Envía recordatorios a envíos sin movimiento',
    category: 'logistica',
    icon: '🔔',
    color: 'blue',
    enabled: false,
    trigger: {
      type: 'schedule',
      schedule: '0 10 * * *', // Todos los días a las 10am
      commands: ['enviar recordatorios', 'recordar envíos'],
    },
    conditions: [
      { field: 'daysWithoutMovement', operator: 'greater_than', value: 3 },
      { field: 'status', operator: 'not_in', value: ['delivered', 'cancelled', 'returned'] },
    ],
    actions: [
      {
        type: 'whatsapp_send',
        config: {
          message: 'Hola {customerName}, tu pedido {trackingNumber} está en camino. Puedes rastrearlo aquí: {trackingUrl}',
        },
      },
    ],
    settings: {
      schedule: { start: '09:00', end: '19:00' },
      maxExecutions: 200,
      cooldown: 86400000,
    },
    stats: {
      totalExecutions: 0,
      successCount: 0,
      failCount: 0,
      todayExecutions: 0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'sincronizar_guia',
    name: 'Sincronizar Pedido → Guía',
    description: 'Crea guía automáticamente al confirmar pedido',
    category: 'hibrido',
    icon: '🔄',
    color: 'purple',
    enabled: false,
    trigger: {
      type: 'event',
      event: 'order.confirmed',
      commands: ['sincronizar guía', 'crear guía'],
    },
    conditions: [
      { field: 'hasTrackingNumber', operator: 'equals', value: false },
    ],
    actions: [
      {
        type: 'api_call',
        config: {
          endpoint: 'carriers/create_shipment',
          method: 'POST',
          body: {
            carrier: '{preferredCarrier}',
            recipient: '{customerName}',
            address: '{shippingAddress}',
            phone: '{customerPhone}',
          },
        },
      },
      {
        type: 'update_status',
        config: { newStatus: 'shipped' },
      },
      {
        type: 'whatsapp_template',
        config: {
          templateId: 'guia_creada',
          variables: ['customerName', 'trackingNumber', 'carrier'],
        },
      },
    ],
    settings: {},
    stats: {
      totalExecutions: 0,
      successCount: 0,
      failCount: 0,
      todayExecutions: 0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'carrito_abandonado',
    name: 'Carrito Abandonado',
    description: 'Recupera carritos abandonados con recordatorio',
    category: 'ventas',
    icon: '🛒',
    color: 'orange',
    enabled: false,
    trigger: {
      type: 'condition',
      condition: { field: 'cartAge', operator: 'greater_than', value: 24 }, // horas
      commands: ['recuperar carritos', 'carritos abandonados'],
    },
    conditions: [
      { field: 'status', operator: 'equals', value: 'cart' },
      { field: 'contacted', operator: 'equals', value: false },
    ],
    actions: [
      {
        type: 'whatsapp_template',
        config: {
          templateId: 'carrito_abandonado',
          variables: ['customerName', 'productName', 'discountCode'],
        },
      },
      {
        type: 'update_status',
        config: { contacted: true },
      },
    ],
    settings: {
      schedule: { start: '10:00', end: '20:00' },
      maxExecutions: 50,
      cooldown: 172800000, // 48 horas
    },
    stats: {
      totalExecutions: 0,
      successCount: 0,
      failCount: 0,
      todayExecutions: 0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'postventa',
    name: 'Postventa / Recompra',
    description: 'Contacta clientes después de entrega para fidelización',
    category: 'ventas',
    icon: '💝',
    color: 'pink',
    enabled: false,
    trigger: {
      type: 'event',
      event: 'shipment.delivered',
      commands: ['postventa', 'fidelizar clientes'],
    },
    conditions: [
      { field: 'daysSinceDelivery', operator: 'equals', value: 7 },
    ],
    actions: [
      {
        type: 'whatsapp_template',
        config: {
          templateId: 'postventa',
          variables: ['customerName', 'productName', 'reviewUrl'],
        },
        delay: 604800000, // 7 días
      },
    ],
    settings: {
      schedule: { start: '10:00', end: '18:00' },
      maxExecutions: 30,
    },
    stats: {
      totalExecutions: 0,
      successCount: 0,
      failCount: 0,
      todayExecutions: 0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// ==================== STORAGE ====================

const SKILLS_STORAGE_KEY = 'litper_skills';
const EXECUTIONS_STORAGE_KEY = 'litper_skill_executions';

// ==================== SKILLS ENGINE ====================

class SkillsEngineService {
  private skills: Map<string, Skill> = new Map();
  private executions: SkillExecution[] = [];
  private listeners: Map<string, ((execution: SkillExecution) => void)[]> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  // ==================== INICIALIZACIÓN ====================

  private loadFromStorage(): void {
    try {
      // Cargar skills
      const savedSkills = localStorage.getItem(SKILLS_STORAGE_KEY);
      if (savedSkills) {
        const skills = JSON.parse(savedSkills) as Skill[];
        skills.forEach((s) => this.skills.set(s.id, s));
      } else {
        // Usar skills por defecto
        DEFAULT_SKILLS.forEach((s) => this.skills.set(s.id, s));
        this.saveToStorage();
      }

      // Cargar ejecuciones recientes
      const savedExecutions = localStorage.getItem(EXECUTIONS_STORAGE_KEY);
      if (savedExecutions) {
        this.executions = JSON.parse(savedExecutions);
      }
    } catch (error) {
      console.error('[SkillsEngine] Error cargando:', error);
      DEFAULT_SKILLS.forEach((s) => this.skills.set(s.id, s));
    }
  }

  private saveToStorage(): void {
    try {
      const skills = Array.from(this.skills.values());
      localStorage.setItem(SKILLS_STORAGE_KEY, JSON.stringify(skills));

      // Solo guardar las últimas 100 ejecuciones
      const recentExecutions = this.executions.slice(-100);
      localStorage.setItem(EXECUTIONS_STORAGE_KEY, JSON.stringify(recentExecutions));
    } catch (error) {
      console.error('[SkillsEngine] Error guardando:', error);
    }
  }

  // ==================== GESTIÓN DE SKILLS ====================

  /**
   * Obtener todos los skills
   */
  getAllSkills(): Skill[] {
    return Array.from(this.skills.values());
  }

  /**
   * Obtener skills por categoría
   */
  getSkillsByCategory(category: Skill['category']): Skill[] {
    return this.getAllSkills().filter((s) => s.category === category);
  }

  /**
   * Obtener skills activos
   */
  getActiveSkills(): Skill[] {
    return this.getAllSkills().filter((s) => s.enabled);
  }

  /**
   * Obtener skill por ID
   */
  getSkill(id: string): Skill | undefined {
    return this.skills.get(id);
  }

  /**
   * Crear nuevo skill
   */
  createSkill(skill: Omit<Skill, 'id' | 'stats' | 'createdAt' | 'updatedAt'>): Skill {
    const newSkill: Skill = {
      ...skill,
      id: `skill_${Date.now()}`,
      stats: {
        totalExecutions: 0,
        successCount: 0,
        failCount: 0,
        todayExecutions: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.skills.set(newSkill.id, newSkill);
    this.saveToStorage();
    return newSkill;
  }

  /**
   * Actualizar skill
   */
  updateSkill(id: string, updates: Partial<Skill>): Skill | null {
    const skill = this.skills.get(id);
    if (!skill) return null;

    const updated = {
      ...skill,
      ...updates,
      updatedAt: new Date(),
    };

    this.skills.set(id, updated);
    this.saveToStorage();
    return updated;
  }

  /**
   * Habilitar/deshabilitar skill
   */
  toggleSkill(id: string, enabled?: boolean): boolean {
    const skill = this.skills.get(id);
    if (!skill) return false;

    skill.enabled = enabled ?? !skill.enabled;
    skill.updatedAt = new Date();
    this.saveToStorage();
    return skill.enabled;
  }

  /**
   * Eliminar skill
   */
  deleteSkill(id: string): boolean {
    const deleted = this.skills.delete(id);
    if (deleted) this.saveToStorage();
    return deleted;
  }

  // ==================== EJECUCIÓN DE SKILLS ====================

  /**
   * Ejecutar skill manualmente
   */
  async executeSkill(
    skillId: string,
    targets?: unknown[],
    params?: Record<string, unknown>
  ): Promise<SkillExecution> {
    const skill = this.skills.get(skillId);
    if (!skill) {
      throw new Error(`Skill ${skillId} no encontrado`);
    }

    const execution: SkillExecution = {
      id: `exec_${Date.now()}`,
      skillId: skill.id,
      skillName: skill.name,
      trigger: 'manual',
      target: targets ? `${targets.length} items` : undefined,
      status: 'running',
      startedAt: new Date(),
    };

    this.executions.push(execution);
    this.notifyListeners(execution);

    try {
      // Ejecutar acciones
      for (const action of skill.actions) {
        await this.executeAction(action, targets, params);
      }

      // Actualizar stats
      skill.stats.totalExecutions++;
      skill.stats.successCount++;
      skill.stats.todayExecutions++;
      skill.stats.lastExecution = new Date();

      execution.status = 'success';
      execution.result = `Ejecutado correctamente en ${targets?.length || 1} items`;
      execution.completedAt = new Date();
    } catch (error) {
      skill.stats.totalExecutions++;
      skill.stats.failCount++;

      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : 'Error desconocido';
      execution.completedAt = new Date();
    }

    this.saveToStorage();
    this.notifyListeners(execution);
    return execution;
  }

  /**
   * Ejecutar una acción específica
   */
  private async executeAction(
    action: SkillAction,
    targets?: unknown[],
    params?: Record<string, unknown>
  ): Promise<void> {
    // Esperar delay si existe
    if (action.delay) {
      await new Promise((resolve) => setTimeout(resolve, action.delay));
    }

    switch (action.type) {
      case 'whatsapp_send':
      case 'whatsapp_template':
        await this.executeWhatsAppAction(action, targets);
        break;

      case 'notification':
        this.executeNotificationAction(action);
        break;

      case 'create_alert':
        this.executeCreateAlertAction(action);
        break;

      case 'update_status':
        await this.executeUpdateStatusAction(action, targets);
        break;

      case 'api_call':
        await this.executeApiCallAction(action, params);
        break;

      case 'log':
        console.log('[Skill Action]', action.config);
        break;
    }
  }

  private async executeWhatsAppAction(action: SkillAction, targets?: unknown[]): Promise<void> {
    const chateaProvider = integrationManager.getChateaProvider();
    if (!chateaProvider) {
      throw new Error('Chatea no está conectado');
    }

    // Enviar a cada target
    if (targets && Array.isArray(targets)) {
      for (const target of targets) {
        const phone = (target as Record<string, string>).phone ||
                     (target as Record<string, string>).recipientPhone ||
                     (target as Record<string, string>).customerPhone;

        if (phone) {
          const message = this.interpolateMessage(
            action.config.message as string || action.config.templateId as string,
            target as Record<string, unknown>
          );
          await chateaProvider.sendWhatsApp(phone, message, action.config.templateId as string);
        }
      }
    }
  }

  private executeNotificationAction(action: SkillAction): void {
    // Mostrar notificación del navegador
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(action.config.title as string || 'Litper Pro', {
        body: action.config.message as string,
        icon: '/icon.png',
      });
    }
  }

  private executeCreateAlertAction(action: SkillAction): void {
    // Crear alerta en el sistema
    console.log('[Skill] Creando alerta:', action.config);
  }

  private async executeUpdateStatusAction(action: SkillAction, targets?: unknown[]): Promise<void> {
    // Actualizar estado de los targets
    console.log('[Skill] Actualizando estado:', action.config, 'en', targets?.length, 'items');
  }

  private async executeApiCallAction(
    action: SkillAction,
    params?: Record<string, unknown>
  ): Promise<void> {
    const endpoint = action.config.endpoint as string;
    const method = (action.config.method as string) || 'POST';
    const body = this.interpolateObject(
      action.config.body as Record<string, unknown>,
      params || {}
    );

    console.log('[Skill] API Call:', method, endpoint, body);
    // Aquí iría la llamada real a la API
  }

  /**
   * Interpolar variables en mensaje
   */
  private interpolateMessage(template: string, data: Record<string, unknown>): string {
    return template.replace(/\{(\w+)\}/g, (_, key) => {
      return String(data[key] || `{${key}}`);
    });
  }

  /**
   * Interpolar variables en objeto
   */
  private interpolateObject(
    template: Record<string, unknown>,
    data: Record<string, unknown>
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(template)) {
      if (typeof value === 'string') {
        result[key] = this.interpolateMessage(value, data);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  // ==================== EJECUCIONES ====================

  /**
   * Obtener ejecuciones recientes
   */
  getRecentExecutions(limit: number = 20): SkillExecution[] {
    return this.executions.slice(-limit).reverse();
  }

  /**
   * Obtener ejecuciones de un skill
   */
  getSkillExecutions(skillId: string, limit: number = 10): SkillExecution[] {
    return this.executions
      .filter((e) => e.skillId === skillId)
      .slice(-limit)
      .reverse();
  }

  // ==================== LISTENERS ====================

  /**
   * Suscribirse a ejecuciones
   */
  onExecution(callback: (execution: SkillExecution) => void): () => void {
    const key = 'all';
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key)!.push(callback);

    return () => {
      const callbacks = this.listeners.get(key);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) callbacks.splice(index, 1);
      }
    };
  }

  private notifyListeners(execution: SkillExecution): void {
    const callbacks = this.listeners.get('all') || [];
    callbacks.forEach((cb) => cb(execution));
  }

  // ==================== COMANDOS NATURALES ====================

  /**
   * Buscar skill por comando natural
   */
  findSkillByCommand(command: string): Skill | undefined {
    const lowerCommand = command.toLowerCase();

    for (const skill of this.skills.values()) {
      if (!skill.trigger.commands) continue;

      for (const cmd of skill.trigger.commands) {
        if (lowerCommand.includes(cmd.toLowerCase())) {
          return skill;
        }
      }
    }

    return undefined;
  }

  /**
   * Ejecutar skill por comando natural
   */
  async executeByCommand(
    command: string,
    context?: Record<string, unknown>
  ): Promise<{ skill: Skill; execution: SkillExecution } | null> {
    const skill = this.findSkillByCommand(command);
    if (!skill) return null;

    const execution = await this.executeSkill(skill.id, undefined, context);
    return { skill, execution };
  }

  // ==================== ESTADÍSTICAS ====================

  /**
   * Obtener estadísticas globales
   */
  getStats(): {
    totalSkills: number;
    activeSkills: number;
    totalExecutions: number;
    todayExecutions: number;
    successRate: number;
  } {
    const skills = this.getAllSkills();
    const totalExecutions = skills.reduce((sum, s) => sum + s.stats.totalExecutions, 0);
    const successCount = skills.reduce((sum, s) => sum + s.stats.successCount, 0);

    return {
      totalSkills: skills.length,
      activeSkills: skills.filter((s) => s.enabled).length,
      totalExecutions,
      todayExecutions: skills.reduce((sum, s) => sum + s.stats.todayExecutions, 0),
      successRate: totalExecutions > 0 ? Math.round((successCount / totalExecutions) * 100) : 100,
    };
  }

  /**
   * Resetear contadores diarios
   */
  resetDailyStats(): void {
    for (const skill of this.skills.values()) {
      skill.stats.todayExecutions = 0;
    }
    this.saveToStorage();
  }
}

// Singleton
export const skillsEngine = new SkillsEngineService();
export default skillsEngine;
