// services/whatsappIntegrationService.ts
// Servicio de Integración de WhatsApp con Chatea Pro
// Mensajes masivos, plantillas inteligentes y seguimiento

// ============================================
// INTERFACES
// ============================================

export interface WhatsAppConfig {
  chateaProFlowId: string;
  chateaProUrl: string;
  defaultCountryCode: string;
  maxMessagesPerBatch: number;
  delayBetweenMessages: number; // milliseconds
}

export interface MessageTemplate {
  id: string;
  name: string;
  category: MessageCategory;
  content: string;
  variables: string[];
  emoji?: string;
  buttons?: TemplateButton[];
}

export type MessageCategory =
  | 'RECLAMO_OFICINA'
  | 'NO_ESTABA'
  | 'DIRECCION_ERRADA'
  | 'CONFIRMAR_ENTREGA'
  | 'RECORDATORIO'
  | 'AGRADECIMIENTO'
  | 'PROMOCION'
  | 'GENERAL';

export interface TemplateButton {
  type: 'CALL' | 'URL' | 'REPLY';
  text: string;
  value: string;
}

export interface WhatsAppMessage {
  id: string;
  phone: string;
  templateId: string;
  variables: Record<string, string>;
  status: MessageStatus;
  createdAt: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  errorMessage?: string;
}

export type MessageStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export interface MessageBatch {
  id: string;
  name: string;
  templateId: string;
  messages: WhatsAppMessage[];
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'PARTIAL';
  createdAt: Date;
  completedAt?: Date;
  stats: BatchStats;
}

export interface BatchStats {
  total: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  successRate: number;
}

// ============================================
// CONSTANTES
// ============================================

const STORAGE_KEY = 'litper_whatsapp_messages';
const CHATEA_PRO_URL = 'https://chateapro.app/flow/f140677#/livechat';

const DEFAULT_CONFIG: WhatsAppConfig = {
  chateaProFlowId: 'f140677',
  chateaProUrl: CHATEA_PRO_URL,
  defaultCountryCode: '57',
  maxMessagesPerBatch: 100,
  delayBetweenMessages: 2000,
};

// Plantillas predefinidas por categoría
const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: 'reclamo_oficina_urgente',
    name: 'Reclamo en Oficina - Urgente',
    category: 'RECLAMO_OFICINA',
    emoji: '🚨',
    content: `🚨 *URGENTE - Pedido en Oficina*

Hola {nombre}!

Tu pedido con guía *{guia}* está en la oficina de *{transportadora}* y quedan solo *{dias}* días para recogerlo.

📍 *Ubicación:* {ubicacion}
⏰ *Horario:* Lunes a Viernes 8am-6pm

*Lleva tu cédula para el retiro.*

Si no puedes ir, puedes autorizar a otra persona con una carta y copia de tu cédula.

¿Tienes alguna duda? Responde este mensaje.`,
    variables: ['nombre', 'guia', 'transportadora', 'dias', 'ubicacion'],
  },
  {
    id: 'no_estaba_reagendar',
    name: 'No Estaba - Reagendar',
    category: 'NO_ESTABA',
    emoji: '📦',
    content: `📦 *Intentamos entregar tu pedido*

Hola {nombre}!

Pasamos a entregar tu pedido *{guia}* pero no encontramos a nadie en la dirección.

🏠 *Dirección:* {direccion}

¿A qué hora estarás disponible mañana para recibirlo?

Por favor responde con tu horario preferido:
• Mañana (8am-12pm)
• Tarde (12pm-6pm)

¡Queremos que recibas tu pedido pronto!`,
    variables: ['nombre', 'guia', 'direccion'],
  },
  {
    id: 'direccion_errada_confirmar',
    name: 'Dirección Errada - Confirmar',
    category: 'DIRECCION_ERRADA',
    emoji: '📍',
    content: `📍 *Problema con la dirección*

Hola {nombre}!

Tu pedido *{guia}* no pudo ser entregado porque hay un problema con la dirección:

🏠 *Dirección actual:* {direccion}

Por favor envíanos la dirección correcta con:
✅ Barrio
✅ Número de casa/apartamento
✅ Referencias (cerca de qué queda)

Ejemplo: Cra 10 #25-30, Barrio Centro, cerca al parque principal.`,
    variables: ['nombre', 'guia', 'direccion'],
  },
  {
    id: 'confirmar_entrega_hoy',
    name: 'Confirmar Entrega Hoy',
    category: 'CONFIRMAR_ENTREGA',
    emoji: '🚚',
    content: `🚚 *¡Tu pedido llega hoy!*

Hola {nombre}!

Tu pedido *{guia}* está en camino y llegará hoy entre las *{horaInicio}* y *{horaFin}*.

📍 *Dirección:* {direccion}
💰 *Valor a pagar:* ${valor} (contraentrega)

*¿Estarás disponible para recibirlo?*

Responde:
✅ *SI* - Confirmo que estaré
❌ *NO* - No estaré, reagendar

¡Gracias por tu compra!`,
    variables: ['nombre', 'guia', 'horaInicio', 'horaFin', 'direccion', 'valor'],
  },
  {
    id: 'recordatorio_retiro',
    name: 'Recordatorio de Retiro',
    category: 'RECORDATORIO',
    emoji: '⏰',
    content: `⏰ *Recordatorio importante*

Hola {nombre}!

Te recordamos que tu pedido *{guia}* sigue esperándote en la oficina de {transportadora}.

📅 *Fecha límite:* {fechaLimite}
📍 *Ubicación:* {ubicacion}

⚠️ Si no lo recoges antes de esa fecha, será devuelto y podrías perder tu compra.

¿Necesitas ayuda para coordinar el retiro?`,
    variables: ['nombre', 'guia', 'transportadora', 'fechaLimite', 'ubicacion'],
  },
  {
    id: 'agradecimiento_entrega',
    name: 'Agradecimiento por Entrega',
    category: 'AGRADECIMIENTO',
    emoji: '🎉',
    content: `🎉 *¡Pedido entregado!*

Hola {nombre}!

Tu pedido *{guia}* fue entregado exitosamente.

¿Quedaste satisfecho con tu compra? Tu opinión es muy importante para nosotros.

⭐⭐⭐⭐⭐

Responde del 1 al 5 qué tan satisfecho quedaste.

¡Gracias por confiar en nosotros!`,
    variables: ['nombre', 'guia'],
  },
  {
    id: 'no_cancela_valor',
    name: 'No Cancela Valor',
    category: 'GENERAL',
    emoji: '💰',
    content: `💰 *Información de pago*

Hola {nombre}!

Tu pedido *{guia}* requiere pago contraentrega de *${valor}*.

El repartidor NO puede dar cambio de billetes grandes. Por favor ten el valor exacto o cercano.

¿Tendrás el dinero listo para cuando llegue?

Responde:
✅ *SI* - Tendré el dinero
❌ *NO* - Necesito reagendar`,
    variables: ['nombre', 'guia', 'valor'],
  },
  {
    id: 'verificar_datos',
    name: 'Verificar Datos de Entrega',
    category: 'GENERAL',
    emoji: '📋',
    content: `📋 *Verificación de datos*

Hola {nombre}!

Antes de enviar tu pedido *{guia}*, queremos confirmar los datos:

📍 *Dirección:* {direccion}
📱 *Teléfono:* {telefono}

¿Los datos son correctos?

Responde:
✅ *SI* - Todo correcto
✏️ *CORREGIR* - Necesito cambiar algo`,
    variables: ['nombre', 'guia', 'direccion', 'telefono'],
  },
];

// ============================================
// CLASE PRINCIPAL
// ============================================

class WhatsAppIntegrationService {
  private config: WhatsAppConfig;
  private batches: MessageBatch[];

  constructor(config?: Partial<WhatsAppConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.batches = this.loadBatches();
  }

  // ============================================
  // GESTIÓN DE ALMACENAMIENTO
  // ============================================

  private loadBatches(): MessageBatch[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data).map((b: any) => ({
        ...b,
        createdAt: new Date(b.createdAt),
        completedAt: b.completedAt ? new Date(b.completedAt) : undefined,
        messages: b.messages.map((m: any) => ({
          ...m,
          createdAt: new Date(m.createdAt),
          sentAt: m.sentAt ? new Date(m.sentAt) : undefined,
          deliveredAt: m.deliveredAt ? new Date(m.deliveredAt) : undefined,
          readAt: m.readAt ? new Date(m.readAt) : undefined,
        })),
      }));
    } catch {
      return [];
    }
  }

  private saveBatches(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.batches));
  }

  private generateId(): string {
    return `wa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============================================
  // API DE PLANTILLAS
  // ============================================

  /**
   * Obtiene todas las plantillas disponibles
   */
  getTemplates(): MessageTemplate[] {
    return MESSAGE_TEMPLATES;
  }

  /**
   * Obtiene plantillas por categoría
   */
  getTemplatesByCategory(category: MessageCategory): MessageTemplate[] {
    return MESSAGE_TEMPLATES.filter(t => t.category === category);
  }

  /**
   * Obtiene una plantilla por ID
   */
  getTemplate(templateId: string): MessageTemplate | undefined {
    return MESSAGE_TEMPLATES.find(t => t.id === templateId);
  }

  /**
   * Sugiere la mejor plantilla según el tipo de novedad
   */
  suggestTemplate(noveltyType: string): MessageTemplate | undefined {
    const type = noveltyType.toUpperCase();

    if (type.includes('OFICINA') || type.includes('RECLAMO')) {
      return this.getTemplate('reclamo_oficina_urgente');
    }
    if (type.includes('NO_ESTABA') || type.includes('AUSENTE')) {
      return this.getTemplate('no_estaba_reagendar');
    }
    if (type.includes('DIRECCION') || type.includes('ERRADA')) {
      return this.getTemplate('direccion_errada_confirmar');
    }
    if (type.includes('NO_CANCELA') || type.includes('PAGO')) {
      return this.getTemplate('no_cancela_valor');
    }
    if (type.includes('ENTREGA') || type.includes('REPARTO')) {
      return this.getTemplate('confirmar_entrega_hoy');
    }

    return this.getTemplate('verificar_datos');
  }

  // ============================================
  // API DE MENSAJES
  // ============================================

  /**
   * Genera el texto del mensaje con variables reemplazadas
   */
  generateMessageText(templateId: string, variables: Record<string, string>): string {
    const template = this.getTemplate(templateId);
    if (!template) throw new Error(`Template ${templateId} not found`);

    let text = template.content;
    Object.entries(variables).forEach(([key, value]) => {
      text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });

    return text;
  }

  /**
   * Genera la URL de WhatsApp para un mensaje individual
   */
  generateWhatsAppUrl(phone: string, message: string): string {
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith(this.config.defaultCountryCode)
      ? cleanPhone
      : `${this.config.defaultCountryCode}${cleanPhone}`;
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${fullPhone}?text=${encodedMessage}`;
  }

  /**
   * Abre WhatsApp Web/App para un mensaje individual
   */
  sendIndividualMessage(phone: string, templateId: string, variables: Record<string, string>): void {
    const message = this.generateMessageText(templateId, variables);
    const url = this.generateWhatsAppUrl(phone, message);
    window.open(url, '_blank');
  }

  /**
   * Crea un lote de mensajes para envío masivo
   */
  createBatch(
    name: string,
    templateId: string,
    recipients: Array<{ phone: string; variables: Record<string, string> }>
  ): MessageBatch {
    const messages: WhatsAppMessage[] = recipients.map(r => ({
      id: this.generateId(),
      phone: r.phone,
      templateId,
      variables: r.variables,
      status: 'PENDING',
      createdAt: new Date(),
    }));

    const batch: MessageBatch = {
      id: this.generateId(),
      name,
      templateId,
      messages,
      status: 'PENDING',
      createdAt: new Date(),
      stats: {
        total: messages.length,
        sent: 0,
        delivered: 0,
        read: 0,
        failed: 0,
        successRate: 0,
      },
    };

    this.batches.push(batch);
    this.saveBatches();

    return batch;
  }

  /**
   * Abre Chatea Pro para envío masivo
   */
  openChateaPro(): void {
    window.open(this.config.chateaProUrl, '_blank');
  }

  /**
   * Genera archivo CSV para importar en Chatea Pro
   */
  generateChateaProCSV(
    templateId: string,
    recipients: Array<{ phone: string; variables: Record<string, string> }>
  ): string {
    const template = this.getTemplate(templateId);
    if (!template) throw new Error(`Template ${templateId} not found`);

    // Headers: phone, message
    let csv = 'telefono,mensaje\n';

    recipients.forEach(r => {
      const message = this.generateMessageText(templateId, r.variables);
      const cleanPhone = r.phone.replace(/\D/g, '');
      const fullPhone = cleanPhone.startsWith(this.config.defaultCountryCode)
        ? cleanPhone
        : `${this.config.defaultCountryCode}${cleanPhone}`;

      // Escapar comillas en el mensaje
      const escapedMessage = message.replace(/"/g, '""');
      csv += `${fullPhone},"${escapedMessage}"\n`;
    });

    return csv;
  }

  /**
   * Descarga archivo CSV para Chatea Pro
   */
  downloadChateaProCSV(
    templateId: string,
    recipients: Array<{ phone: string; variables: Record<string, string> }>,
    filename?: string
  ): void {
    const csv = this.generateChateaProCSV(templateId, recipients);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `whatsapp_masivo_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  // ============================================
  // API DE ESTADÍSTICAS
  // ============================================

  /**
   * Obtiene todos los lotes
   */
  getBatches(): MessageBatch[] {
    return this.batches.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Obtiene estadísticas globales
   */
  getGlobalStats(): BatchStats {
    const allMessages = this.batches.flatMap(b => b.messages);

    return {
      total: allMessages.length,
      sent: allMessages.filter(m => m.status !== 'PENDING').length,
      delivered: allMessages.filter(m => m.status === 'DELIVERED' || m.status === 'READ').length,
      read: allMessages.filter(m => m.status === 'READ').length,
      failed: allMessages.filter(m => m.status === 'FAILED').length,
      successRate: allMessages.length > 0
        ? (allMessages.filter(m => m.status !== 'FAILED' && m.status !== 'PENDING').length / allMessages.length) * 100
        : 0,
    };
  }

  /**
   * Actualiza el estado de un mensaje
   */
  updateMessageStatus(batchId: string, messageId: string, status: MessageStatus): void {
    const batch = this.batches.find(b => b.id === batchId);
    if (!batch) return;

    const message = batch.messages.find(m => m.id === messageId);
    if (!message) return;

    message.status = status;
    const now = new Date();

    switch (status) {
      case 'SENT':
        message.sentAt = now;
        batch.stats.sent++;
        break;
      case 'DELIVERED':
        message.deliveredAt = now;
        batch.stats.delivered++;
        break;
      case 'READ':
        message.readAt = now;
        batch.stats.read++;
        break;
      case 'FAILED':
        batch.stats.failed++;
        break;
    }

    batch.stats.successRate = batch.messages.length > 0
      ? ((batch.stats.sent - batch.stats.failed) / batch.messages.length) * 100
      : 0;

    // Actualizar estado del lote
    const allProcessed = batch.messages.every(m => m.status !== 'PENDING');
    if (allProcessed) {
      batch.status = batch.stats.failed > 0 ? 'PARTIAL' : 'COMPLETED';
      batch.completedAt = now;
    }

    this.saveBatches();
  }

  /**
   * Elimina un lote
   */
  deleteBatch(batchId: string): void {
    this.batches = this.batches.filter(b => b.id !== batchId);
    this.saveBatches();
  }

  /**
   * Limpia lotes antiguos
   */
  cleanupOldBatches(daysOld: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const before = this.batches.length;
    this.batches = this.batches.filter(b => b.createdAt > cutoffDate);
    this.saveBatches();

    return before - this.batches.length;
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const whatsappService = new WhatsAppIntegrationService();

export default WhatsAppIntegrationService;
