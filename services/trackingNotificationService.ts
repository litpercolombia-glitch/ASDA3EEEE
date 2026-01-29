/**
 * Tracking Notification Service
 *
 * Servicio para enviar notificaciones automáticas de tracking.
 * Soporta múltiples canales: Email, SMS, WhatsApp.
 */

import type { Guide } from '@/types';

// ============================================
// TIPOS
// ============================================

export type NotificationChannel = 'email' | 'sms' | 'whatsapp' | 'push';

export type NotificationEvent =
  | 'guide_created'
  | 'pickup_scheduled'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'delivery_attempt'
  | 'delivery_exception'
  | 'returned'
  | 'customs_hold';

export interface NotificationTemplate {
  id: string;
  event: NotificationEvent;
  channel: NotificationChannel;
  subject?: string;        // Para email
  body: string;
  variables: string[];     // Variables disponibles: {tracking_number}, {customer_name}, etc.
  isActive: boolean;
}

export interface NotificationConfig {
  id: string;
  channel: NotificationChannel;
  isEnabled: boolean;
  settings: {
    // Email
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
    fromEmail?: string;
    fromName?: string;
    // SMS / WhatsApp
    apiKey?: string;
    apiSecret?: string;
    phoneNumber?: string;
    // Push
    vapidPublicKey?: string;
    vapidPrivateKey?: string;
  };
}

export interface NotificationLog {
  id: string;
  guideId: string;
  event: NotificationEvent;
  channel: NotificationChannel;
  recipient: string;
  status: 'pending' | 'sent' | 'failed' | 'delivered' | 'read';
  sentAt: Date | null;
  deliveredAt: Date | null;
  error: string | null;
  metadata: Record<string, any>;
}

export interface CustomerPreferences {
  email: string;
  phone?: string;
  channels: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
    push: boolean;
  };
  events: NotificationEvent[];
  language: 'es' | 'en';
}

// ============================================
// TEMPLATES POR DEFECTO
// ============================================

const DEFAULT_TEMPLATES: NotificationTemplate[] = [
  // Guía creada
  {
    id: 'guide_created_email',
    event: 'guide_created',
    channel: 'email',
    subject: '¡Tu pedido ha sido procesado! - Guía #{tracking_number}',
    body: `
Hola {customer_name},

¡Tu pedido ha sido procesado exitosamente!

📦 Número de guía: {tracking_number}
🏢 Transportadora: {carrier}
📅 Fecha estimada de entrega: {estimated_delivery}

Puedes rastrear tu envío en cualquier momento usando el siguiente enlace:
{tracking_url}

¡Gracias por tu compra!

Atentamente,
{company_name}
    `.trim(),
    variables: ['tracking_number', 'customer_name', 'carrier', 'estimated_delivery', 'tracking_url', 'company_name'],
    isActive: true,
  },
  {
    id: 'guide_created_sms',
    event: 'guide_created',
    channel: 'sms',
    body: '{company_name}: Tu pedido #{tracking_number} ha sido procesado. Rastrea en: {tracking_url}',
    variables: ['tracking_number', 'company_name', 'tracking_url'],
    isActive: true,
  },
  {
    id: 'guide_created_whatsapp',
    event: 'guide_created',
    channel: 'whatsapp',
    body: `
🎉 *¡Tu pedido está en camino!*

Hola {customer_name},

Tu pedido ha sido procesado:
📦 Guía: *{tracking_number}*
🚚 Transportadora: {carrier}
📅 Entrega estimada: {estimated_delivery}

🔗 Rastrea aquí: {tracking_url}

_Gracias por tu compra!_
    `.trim(),
    variables: ['tracking_number', 'customer_name', 'carrier', 'estimated_delivery', 'tracking_url'],
    isActive: true,
  },

  // En tránsito
  {
    id: 'in_transit_email',
    event: 'in_transit',
    channel: 'email',
    subject: '🚚 Tu paquete está en camino - Guía #{tracking_number}',
    body: `
Hola {customer_name},

¡Tu paquete está en camino!

📦 Guía: {tracking_number}
📍 Ubicación actual: {current_location}
🚚 Estado: En tránsito
📅 Entrega estimada: {estimated_delivery}

Rastrea tu envío: {tracking_url}

{company_name}
    `.trim(),
    variables: ['tracking_number', 'customer_name', 'current_location', 'estimated_delivery', 'tracking_url', 'company_name'],
    isActive: true,
  },
  {
    id: 'in_transit_sms',
    event: 'in_transit',
    channel: 'sms',
    body: '🚚 Tu paquete #{tracking_number} está en tránsito. Ubicación: {current_location}. Rastrea: {tracking_url}',
    variables: ['tracking_number', 'current_location', 'tracking_url'],
    isActive: true,
  },

  // En reparto
  {
    id: 'out_for_delivery_email',
    event: 'out_for_delivery',
    channel: 'email',
    subject: '🎉 ¡Tu paquete sale hoy para entrega! - Guía #{tracking_number}',
    body: `
Hola {customer_name},

¡Excelentes noticias! Tu paquete sale hoy para entrega.

📦 Guía: {tracking_number}
🏠 Dirección de entrega: {delivery_address}
⏰ Horario estimado: {delivery_window}

Por favor asegúrate de que haya alguien disponible para recibir el paquete.

Rastrea tu envío: {tracking_url}

{company_name}
    `.trim(),
    variables: ['tracking_number', 'customer_name', 'delivery_address', 'delivery_window', 'tracking_url', 'company_name'],
    isActive: true,
  },
  {
    id: 'out_for_delivery_whatsapp',
    event: 'out_for_delivery',
    channel: 'whatsapp',
    body: `
🎉 *¡Tu paquete llega hoy!*

📦 Guía: *{tracking_number}*
🏠 Dirección: {delivery_address}
⏰ Horario: {delivery_window}

_Asegúrate de estar disponible para recibirlo._

🔗 {tracking_url}
    `.trim(),
    variables: ['tracking_number', 'delivery_address', 'delivery_window', 'tracking_url'],
    isActive: true,
  },

  // Entregado
  {
    id: 'delivered_email',
    event: 'delivered',
    channel: 'email',
    subject: '✅ ¡Tu paquete ha sido entregado! - Guía #{tracking_number}',
    body: `
Hola {customer_name},

¡Tu paquete ha sido entregado exitosamente!

📦 Guía: {tracking_number}
📅 Fecha de entrega: {delivery_date}
⏰ Hora: {delivery_time}
👤 Recibido por: {received_by}

¿Todo llegó en orden? Nos encantaría conocer tu opinión.

¡Gracias por tu compra!

{company_name}
    `.trim(),
    variables: ['tracking_number', 'customer_name', 'delivery_date', 'delivery_time', 'received_by', 'company_name'],
    isActive: true,
  },
  {
    id: 'delivered_whatsapp',
    event: 'delivered',
    channel: 'whatsapp',
    body: `
✅ *¡Paquete entregado!*

📦 Guía: *{tracking_number}*
📅 Fecha: {delivery_date} {delivery_time}
👤 Recibió: {received_by}

_¡Gracias por tu compra!_
    `.trim(),
    variables: ['tracking_number', 'delivery_date', 'delivery_time', 'received_by'],
    isActive: true,
  },

  // Intento de entrega fallido
  {
    id: 'delivery_attempt_email',
    event: 'delivery_attempt',
    channel: 'email',
    subject: '⚠️ Intento de entrega fallido - Guía #{tracking_number}',
    body: `
Hola {customer_name},

Intentamos entregar tu paquete pero no fue posible.

📦 Guía: {tracking_number}
📅 Fecha del intento: {attempt_date}
❌ Motivo: {attempt_reason}

🔄 Próximo intento: {next_attempt_date}

Por favor asegúrate de estar disponible o contacta a la transportadora para reprogramar.

{company_name}
    `.trim(),
    variables: ['tracking_number', 'customer_name', 'attempt_date', 'attempt_reason', 'next_attempt_date', 'company_name'],
    isActive: true,
  },

  // Excepción de entrega
  {
    id: 'delivery_exception_email',
    event: 'delivery_exception',
    channel: 'email',
    subject: '⚠️ Problema con tu envío - Guía #{tracking_number}',
    body: `
Hola {customer_name},

Hay un problema con tu envío que requiere atención.

📦 Guía: {tracking_number}
⚠️ Problema: {exception_reason}

Por favor contacta a nuestro equipo de soporte lo antes posible:
📧 Email: {support_email}
📞 Teléfono: {support_phone}

{company_name}
    `.trim(),
    variables: ['tracking_number', 'customer_name', 'exception_reason', 'support_email', 'support_phone', 'company_name'],
    isActive: true,
  },
];

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  TEMPLATES: 'litper_notification_templates',
  CONFIG: 'litper_notification_config',
  LOGS: 'litper_notification_logs',
  PREFERENCES: 'litper_customer_preferences',
};

// ============================================
// SERVICIO PRINCIPAL
// ============================================

class TrackingNotificationService {
  private templates: Map<string, NotificationTemplate> = new Map();
  private configs: Map<NotificationChannel, NotificationConfig> = new Map();

  constructor() {
    this.loadTemplates();
    this.loadConfigs();
  }

  // ============================================
  // TEMPLATES
  // ============================================

  /**
   * Carga templates desde localStorage o usa los por defecto
   */
  private loadTemplates(): void {
    const stored = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    if (stored) {
      const templates: NotificationTemplate[] = JSON.parse(stored);
      templates.forEach(t => this.templates.set(t.id, t));
    } else {
      DEFAULT_TEMPLATES.forEach(t => this.templates.set(t.id, t));
      this.saveTemplates();
    }
  }

  /**
   * Guarda templates en localStorage
   */
  private saveTemplates(): void {
    const templates = Array.from(this.templates.values());
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  }

  /**
   * Obtiene todos los templates
   */
  getTemplates(): NotificationTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Obtiene templates por evento
   */
  getTemplatesForEvent(event: NotificationEvent): NotificationTemplate[] {
    return this.getTemplates().filter(t => t.event === event && t.isActive);
  }

  /**
   * Actualiza un template
   */
  updateTemplate(id: string, updates: Partial<NotificationTemplate>): void {
    const template = this.templates.get(id);
    if (template) {
      this.templates.set(id, { ...template, ...updates });
      this.saveTemplates();
    }
  }

  /**
   * Crea un nuevo template
   */
  createTemplate(template: Omit<NotificationTemplate, 'id'>): NotificationTemplate {
    const newTemplate: NotificationTemplate = {
      ...template,
      id: `custom_${Date.now()}`,
    };
    this.templates.set(newTemplate.id, newTemplate);
    this.saveTemplates();
    return newTemplate;
  }

  /**
   * Elimina un template
   */
  deleteTemplate(id: string): void {
    this.templates.delete(id);
    this.saveTemplates();
  }

  // ============================================
  // CONFIGURACIÓN
  // ============================================

  /**
   * Carga configuraciones desde localStorage
   */
  private loadConfigs(): void {
    const stored = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (stored) {
      const configs: NotificationConfig[] = JSON.parse(stored);
      configs.forEach(c => this.configs.set(c.channel, c));
    }
  }

  /**
   * Guarda configuraciones en localStorage
   */
  private saveConfigs(): void {
    const configs = Array.from(this.configs.values());
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(configs));
  }

  /**
   * Obtiene la configuración de un canal
   */
  getConfig(channel: NotificationChannel): NotificationConfig | undefined {
    return this.configs.get(channel);
  }

  /**
   * Actualiza la configuración de un canal
   */
  setConfig(config: NotificationConfig): void {
    this.configs.set(config.channel, config);
    this.saveConfigs();
  }

  /**
   * Verifica si un canal está habilitado
   */
  isChannelEnabled(channel: NotificationChannel): boolean {
    const config = this.configs.get(channel);
    return config?.isEnabled ?? false;
  }

  // ============================================
  // ENVÍO DE NOTIFICACIONES
  // ============================================

  /**
   * Envía notificación para un evento de tracking
   */
  async sendNotification(
    guide: Guide,
    event: NotificationEvent,
    additionalData?: Record<string, string>
  ): Promise<NotificationLog[]> {
    const logs: NotificationLog[] = [];
    const templates = this.getTemplatesForEvent(event);

    for (const template of templates) {
      if (!this.isChannelEnabled(template.channel)) continue;

      const log = await this.sendSingleNotification(guide, template, additionalData);
      logs.push(log);
      this.saveLog(log);
    }

    return logs;
  }

  /**
   * Envía una notificación individual
   */
  private async sendSingleNotification(
    guide: Guide,
    template: NotificationTemplate,
    additionalData?: Record<string, string>
  ): Promise<NotificationLog> {
    const variables = this.buildVariables(guide, additionalData);
    const body = this.replaceVariables(template.body, variables);
    const subject = template.subject ? this.replaceVariables(template.subject, variables) : undefined;

    const log: NotificationLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      guideId: guide.id || '',
      event: template.event,
      channel: template.channel,
      recipient: this.getRecipient(guide, template.channel),
      status: 'pending',
      sentAt: null,
      deliveredAt: null,
      error: null,
      metadata: {
        subject,
        body: body.substring(0, 100),
        variables,
      },
    };

    try {
      switch (template.channel) {
        case 'email':
          await this.sendEmail(log.recipient, subject || '', body);
          break;
        case 'sms':
          await this.sendSMS(log.recipient, body);
          break;
        case 'whatsapp':
          await this.sendWhatsApp(log.recipient, body);
          break;
        case 'push':
          await this.sendPush(log.recipient, subject || '', body);
          break;
      }

      log.status = 'sent';
      log.sentAt = new Date();
    } catch (error) {
      log.status = 'failed';
      log.error = error instanceof Error ? error.message : 'Error desconocido';
    }

    return log;
  }

  /**
   * Construye las variables para reemplazar en el template
   */
  private buildVariables(
    guide: Guide,
    additionalData?: Record<string, string>
  ): Record<string, string> {
    const now = new Date();
    const estimatedDelivery = new Date(now);
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);

    return {
      tracking_number: guide.trackingNumber || guide.numeroGuia || '',
      customer_name: guide.nombreDestinatario || 'Cliente',
      carrier: guide.transportadora || 'Transportadora',
      estimated_delivery: estimatedDelivery.toLocaleDateString('es-CO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
      tracking_url: `${window.location.origin}/tracking/${guide.trackingNumber || guide.numeroGuia}`,
      company_name: 'LITPER PRO',
      delivery_address: `${guide.direccionDestinatario || ''}, ${guide.ciudadDestinatario || ''}`,
      current_location: guide.ciudadOrigen || 'En proceso',
      delivery_date: now.toLocaleDateString('es-CO'),
      delivery_time: now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      delivery_window: '8:00 AM - 6:00 PM',
      received_by: 'Destinatario',
      support_email: 'soporte@litper.co',
      support_phone: '+57 1 234 5678',
      ...additionalData,
    };
  }

  /**
   * Reemplaza variables en el texto
   */
  private replaceVariables(text: string, variables: Record<string, string>): string {
    let result = text;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return result;
  }

  /**
   * Obtiene el destinatario según el canal
   */
  private getRecipient(guide: Guide, channel: NotificationChannel): string {
    switch (channel) {
      case 'email':
        return guide.correoDestinatario || guide.correoRemitente || '';
      case 'sms':
      case 'whatsapp':
        return guide.telefonoDestinatario || guide.celularDestinatario || '';
      case 'push':
        return guide.id || '';
      default:
        return '';
    }
  }

  // ============================================
  // MÉTODOS DE ENVÍO (SIMULADOS)
  // ============================================

  /**
   * Envía un email (simulado - integrar con servicio real)
   */
  private async sendEmail(to: string, subject: string, body: string): Promise<void> {
    console.log('[NotificationService] Sending email:', { to, subject });

    // TODO: Integrar con servicio de email real (SendGrid, SES, etc.)
    // const config = this.getConfig('email');
    // if (!config) throw new Error('Email not configured');

    // Simular delay de envío
    await new Promise(resolve => setTimeout(resolve, 500));

    // En producción, aquí iría la llamada real al API de email
    if (!to) throw new Error('No email address provided');
  }

  /**
   * Envía un SMS (simulado - integrar con servicio real)
   */
  private async sendSMS(to: string, body: string): Promise<void> {
    console.log('[NotificationService] Sending SMS:', { to, body: body.substring(0, 50) });

    // TODO: Integrar con servicio de SMS (Twilio, MessageBird, etc.)
    await new Promise(resolve => setTimeout(resolve, 300));

    if (!to) throw new Error('No phone number provided');
  }

  /**
   * Envía un mensaje de WhatsApp (simulado - integrar con servicio real)
   */
  private async sendWhatsApp(to: string, body: string): Promise<void> {
    console.log('[NotificationService] Sending WhatsApp:', { to, body: body.substring(0, 50) });

    // TODO: Integrar con WhatsApp Business API
    await new Promise(resolve => setTimeout(resolve, 400));

    if (!to) throw new Error('No phone number provided');
  }

  /**
   * Envía una notificación push (simulado)
   */
  private async sendPush(userId: string, title: string, body: string): Promise<void> {
    console.log('[NotificationService] Sending Push:', { userId, title });

    // TODO: Integrar con Web Push o Firebase Cloud Messaging
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // ============================================
  // LOGS
  // ============================================

  /**
   * Guarda un log de notificación
   */
  private saveLog(log: NotificationLog): void {
    const logs = this.getLogs();
    logs.unshift(log);
    // Mantener solo los últimos 1000 logs
    const trimmed = logs.slice(0, 1000);
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(trimmed));
  }

  /**
   * Obtiene todos los logs
   */
  getLogs(limit?: number): NotificationLog[] {
    const stored = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (!stored) return [];
    const logs: NotificationLog[] = JSON.parse(stored);
    return limit ? logs.slice(0, limit) : logs;
  }

  /**
   * Obtiene logs de una guía específica
   */
  getLogsForGuide(guideId: string): NotificationLog[] {
    return this.getLogs().filter(log => log.guideId === guideId);
  }

  /**
   * Obtiene estadísticas de notificaciones
   */
  getStats(period?: { from: Date; to: Date }): {
    total: number;
    sent: number;
    failed: number;
    delivered: number;
    byChannel: Record<NotificationChannel, number>;
    byEvent: Record<NotificationEvent, number>;
  } {
    let logs = this.getLogs();

    if (period) {
      logs = logs.filter(log => {
        const sentAt = log.sentAt ? new Date(log.sentAt) : null;
        return sentAt && sentAt >= period.from && sentAt <= period.to;
      });
    }

    const byChannel: Record<NotificationChannel, number> = {
      email: 0,
      sms: 0,
      whatsapp: 0,
      push: 0,
    };

    const byEvent: Record<NotificationEvent, number> = {
      guide_created: 0,
      pickup_scheduled: 0,
      picked_up: 0,
      in_transit: 0,
      out_for_delivery: 0,
      delivered: 0,
      delivery_attempt: 0,
      delivery_exception: 0,
      returned: 0,
      customs_hold: 0,
    };

    logs.forEach(log => {
      byChannel[log.channel]++;
      byEvent[log.event]++;
    });

    return {
      total: logs.length,
      sent: logs.filter(l => l.status === 'sent' || l.status === 'delivered').length,
      failed: logs.filter(l => l.status === 'failed').length,
      delivered: logs.filter(l => l.status === 'delivered').length,
      byChannel,
      byEvent,
    };
  }
}

// ============================================
// SINGLETON
// ============================================

export const trackingNotificationService = new TrackingNotificationService();

// ============================================
// HOOK PARA REACT
// ============================================

export function useTrackingNotifications() {
  return {
    sendNotification: trackingNotificationService.sendNotification.bind(trackingNotificationService),
    getTemplates: trackingNotificationService.getTemplates.bind(trackingNotificationService),
    updateTemplate: trackingNotificationService.updateTemplate.bind(trackingNotificationService),
    getLogs: trackingNotificationService.getLogs.bind(trackingNotificationService),
    getStats: trackingNotificationService.getStats.bind(trackingNotificationService),
    isChannelEnabled: trackingNotificationService.isChannelEnabled.bind(trackingNotificationService),
    setConfig: trackingNotificationService.setConfig.bind(trackingNotificationService),
  };
}

export default trackingNotificationService;
