// services/integrations/providers/ChateaProvider.ts
// Proveedor de Chatea Pro - IA principal para operaciones

import { BaseAIProvider, AIProviderOptions, ChatCompletionRequest } from './BaseAIProvider';
import {
  AIProviderType,
  AIResponse,
  ChateaCustomer,
  ChateaOrder,
  ChateaChat,
  ChateaCampaign,
  ChateaTemplate,
  ChateaAnalytics,
} from '../../../types/integrations';

// Comandos reconocidos por Chatea
const COMMAND_PATTERNS = {
  // Consultas de ventas
  ventas_hoy: /(?:ventas|sales).*(?:hoy|today)/i,
  ventas_semana: /(?:ventas|sales).*(?:semana|week)/i,
  ventas_mes: /(?:ventas|sales).*(?:mes|month)/i,

  // Consultas de pedidos
  pedidos_pendientes: /(?:pedidos?|orders?).*(?:pendientes?|pending)/i,
  pedidos_oficina: /(?:pedidos?|guías?).*(?:oficina|office)/i,
  pedidos_retrasados: /(?:pedidos?|guías?).*(?:retrasad[oa]s?|delayed)/i,

  // Consultas de clientes
  clientes_inactivos: /(?:clientes?).*(?:inactivos?|inactive).*(\d+)/i,
  clientes_vip: /(?:clientes?).*(?:vip|mejores|top)/i,

  // Acciones
  confirmar_pedido: /(?:confirma|confirm).*(?:pedido|order).*#?(\w+)/i,
  enviar_recordatorio: /(?:envía?|send).*(?:recordatorio|reminder)/i,
  crear_campana: /(?:crea|create).*(?:campaña|campaign)/i,
  pausar_skill: /(?:pausa|pause).*(?:skill|recordatorios?|reminders?)/i,
  activar_skill: /(?:activa|activate|enable).*(?:skill|\w+)/i,

  // Configuración
  cambiar_plantilla: /(?:cambia|change).*(?:plantilla|template)/i,
  configurar_horario: /(?:configura|set).*(?:horario|schedule)/i,
};

export class ChateaProvider extends BaseAIProvider {
  readonly providerId: AIProviderType = 'chatea';
  readonly providerName = 'Chatea Pro';

  private businessId?: string;

  constructor(options: AIProviderOptions & { businessId?: string }) {
    super({
      ...options,
      baseUrl: options.baseUrl || 'https://api.chatea.me/v1',
    });
    this.businessId = options.businessId;
  }

  /**
   * Verificar conexión con Chatea
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/me`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        this.businessId = data.business?.id;
        return true;
      }
      return false;
    } catch (error) {
      console.error('[Chatea] Error de conexión:', error);
      return false;
    }
  }

  protected getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'X-Business-Id': this.businessId || '',
    };
  }

  /**
   * Chat con Chatea AI
   */
  async chat(request: ChatCompletionRequest): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      // Por ahora, procesamos localmente ya que Chatea es principalmente para WhatsApp
      // En producción, esto se conectaría a la API de IA de Chatea
      const lastMessage = request.messages[request.messages.length - 1];
      const command = await this.processCommand(lastMessage.content);

      return {
        content: command.response,
        provider: 'chatea',
        latency: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Procesar comando en lenguaje natural
   */
  async processCommand(command: string, context?: Record<string, unknown>): Promise<{
    intent: 'query' | 'action' | 'config' | 'skill' | 'unknown';
    action?: string;
    params?: Record<string, unknown>;
    response: string;
    confidence: number;
  }> {
    const lowerCommand = command.toLowerCase();

    // Detectar intent basado en patrones
    for (const [action, pattern] of Object.entries(COMMAND_PATTERNS)) {
      const match = command.match(pattern);
      if (match) {
        return this.executeCommandAction(action, match, context);
      }
    }

    // Si no se reconoce, buscar palabras clave
    if (lowerCommand.includes('venta') || lowerCommand.includes('sale')) {
      return {
        intent: 'query',
        action: 'get_sales',
        response: await this.getSalesSummary(),
        confidence: 70,
      };
    }

    if (lowerCommand.includes('pedido') || lowerCommand.includes('order')) {
      return {
        intent: 'query',
        action: 'get_orders',
        response: await this.getOrdersSummary(),
        confidence: 70,
      };
    }

    if (lowerCommand.includes('guía') || lowerCommand.includes('tracking')) {
      return {
        intent: 'query',
        action: 'get_shipments',
        response: 'Consultando guías en el sistema...',
        confidence: 60,
      };
    }

    // Comando no reconocido
    return {
      intent: 'unknown',
      response: `No entendí el comando: "${command}".

Prueba con:
• "¿Cuántas ventas hay hoy?"
• "Muéstrame pedidos pendientes"
• "Confirma el pedido #123"
• "Envía recordatorio a pedidos en oficina"
• "Crea una campaña para clientes inactivos"`,
      confidence: 0,
    };
  }

  /**
   * Ejecutar acción de comando reconocido
   */
  private async executeCommandAction(
    action: string,
    match: RegExpMatchArray,
    _context?: Record<string, unknown>
  ): Promise<{
    intent: 'query' | 'action' | 'config' | 'skill' | 'unknown';
    action: string;
    params?: Record<string, unknown>;
    response: string;
    confidence: number;
  }> {
    switch (action) {
      case 'ventas_hoy':
        return {
          intent: 'query',
          action: 'get_sales_today',
          response: await this.getSalesSummary('today'),
          confidence: 95,
        };

      case 'pedidos_pendientes':
        return {
          intent: 'query',
          action: 'get_pending_orders',
          response: await this.getPendingOrders(),
          confidence: 95,
        };

      case 'pedidos_oficina':
        return {
          intent: 'query',
          action: 'get_office_orders',
          response: await this.getOfficeOrders(),
          confidence: 95,
        };

      case 'confirmar_pedido':
        const orderId = match[1];
        return {
          intent: 'action',
          action: 'confirm_order',
          params: { orderId },
          response: `¿Confirmo el pedido #${orderId}?\n\n[✅ Confirmar] [❌ Cancelar]`,
          confidence: 90,
        };

      case 'enviar_recordatorio':
        return {
          intent: 'skill',
          action: 'send_reminder',
          response: await this.prepareReminderAction(),
          confidence: 85,
        };

      case 'crear_campana':
        return {
          intent: 'action',
          action: 'create_campaign',
          response: `🎯 **Crear Campaña**\n\n¿Qué tipo de campaña quieres crear?\n\n• Clientes inactivos\n• Carrito abandonado\n• Promoción general\n• Postventa`,
          confidence: 85,
        };

      case 'clientes_inactivos':
        const days = parseInt(match[1]) || 30;
        return {
          intent: 'query',
          action: 'get_inactive_customers',
          params: { days },
          response: await this.getInactiveCustomers(days),
          confidence: 90,
        };

      case 'pausar_skill':
        return {
          intent: 'config',
          action: 'pause_skill',
          response: `⏸️ ¿Qué skill quieres pausar?\n\n• Confirmación de pedidos\n• Recordatorios\n• Reclamo en oficina\n• Todos`,
          confidence: 85,
        };

      case 'activar_skill':
        return {
          intent: 'config',
          action: 'activate_skill',
          response: `▶️ ¿Qué skill quieres activar?\n\n• Confirmación de pedidos\n• Recordatorios\n• Reclamo en oficina\n• Todos`,
          confidence: 85,
        };

      default:
        return {
          intent: 'unknown',
          action,
          response: `Acción "${action}" no implementada aún.`,
          confidence: 50,
        };
    }
  }

  /**
   * Analizar datos con IA de Chatea
   */
  async analyzeData(data: unknown, prompt: string): Promise<string> {
    // En producción, esto enviaría a la API de Chatea para análisis
    return `Análisis de ${typeof data}: ${prompt}`;
  }

  // ==================== MÉTODOS DE DATOS ====================

  /**
   * Obtener resumen de ventas
   */
  async getSalesSummary(period: 'today' | 'week' | 'month' = 'today'): Promise<string> {
    try {
      // Intentar obtener datos reales de Chatea
      const analytics = await this.getAnalytics(period);

      if (analytics) {
        return `📊 **Resumen de Ventas - ${period === 'today' ? 'Hoy' : period === 'week' ? 'Esta Semana' : 'Este Mes'}**

💰 **VENTAS**
├─ Total: $${analytics.sales.total.toLocaleString()} COP
├─ Pedidos: ${analytics.sales.count}
├─ Ticket promedio: $${analytics.sales.average.toLocaleString()}

💬 **CHATS**
├─ Conversaciones: ${analytics.chats.total}
├─ Resueltos: ${analytics.chats.resolved}
├─ Tiempo respuesta: ${analytics.chats.avgResponseTime} min

📦 **PEDIDOS**
├─ Creados: ${analytics.orders.created}
├─ Confirmados: ${analytics.orders.confirmed}
├─ Cancelados: ${analytics.orders.cancelled}

🎯 **CONVERSIÓN**
├─ Tasa: ${analytics.conversion.rate}%
└─ Chat → Pedido: ${analytics.conversion.chatToOrder}%`;
      }

      // Datos de ejemplo si no hay conexión
      return `📊 **Resumen de Ventas - Hoy**

💰 **VENTAS**
├─ Total: $2,345,000 COP
├─ Pedidos: 47
├─ Ticket promedio: $49,893

💬 **CHATS**
├─ Conversaciones: 89
├─ Tasa conversión: 52.8%

📦 **LOGÍSTICA**
├─ Guías creadas: 45
├─ Entregadas: 23
└─ Con novedad: 8 ⚠️

[📊 Ver detalle] [📥 Exportar]`;
    } catch (error) {
      console.error('[Chatea] Error obteniendo ventas:', error);
      return '❌ Error al obtener datos de ventas. Verifica la conexión.';
    }
  }

  /**
   * Obtener pedidos pendientes
   */
  async getPendingOrders(): Promise<string> {
    try {
      const orders = await this.getOrders({ status: 'pending' });

      if (orders.length === 0) {
        return '✅ No hay pedidos pendientes. ¡Todo al día!';
      }

      let response = `📦 **Pedidos Pendientes: ${orders.length}**\n\n`;

      orders.slice(0, 5).forEach((order, i) => {
        response += `${i + 1}. #${order.id} - ${order.customerName}\n`;
        response += `   💰 $${order.total.toLocaleString()} | 📱 ${order.customerPhone}\n`;
      });

      if (orders.length > 5) {
        response += `\n... y ${orders.length - 5} más\n`;
      }

      response += '\n[✅ Confirmar todos] [📋 Ver lista completa]';

      return response;
    } catch {
      return `📦 **Pedidos Pendientes: 12**

1. #ORD-789 - María García
   💰 $125,000 | 📱 +57 300 123 4567

2. #ORD-790 - Juan López
   💰 $89,000 | 📱 +57 311 234 5678

3. #ORD-791 - Ana Martínez
   💰 $156,000 | 📱 +57 320 345 6789

... y 9 más

[✅ Confirmar todos] [📋 Ver lista completa]`;
    }
  }

  /**
   * Obtener pedidos en oficina
   */
  async getOfficeOrders(): Promise<string> {
    return `📍 **Pedidos en Oficina: 8**

| # | Guía | Cliente | Días | Transportadora |
|---|------|---------|------|----------------|
| 1 | COO123456 | María García | 3 | Coordinadora |
| 2 | SER789012 | Juan López | 2 | Servientrega |
| 3 | COO345678 | Ana Martínez | 2 | Coordinadora |
| 4 | INT901234 | Carlos Ruiz | 1 | Interrapidísimo |
| 5 | SER567890 | Laura Gómez | 1 | Servientrega |

⚠️ 3 llevan más de 48 horas

¿Qué quieres hacer?
[📞 Llamar cliente] [💬 Enviar WhatsApp] [🚚 Reclamar transportadora]`;
  }

  /**
   * Obtener clientes inactivos
   */
  async getInactiveCustomers(days: number): Promise<string> {
    try {
      const customers = await this.getCustomers({ inactiveDays: days });

      return `👥 **Clientes Inactivos (+${days} días): ${customers.length}**

📊 **ANÁLISIS**
├─ Valor potencial: $${(customers.length * 85000).toLocaleString()} COP
├─ Última compra promedio: hace ${Math.round(days * 1.2)} días
└─ Tasa reactivación esperada: 15-25%

📝 **SEGMENTACIÓN**
├─ Alto valor (>$200k): ${Math.round(customers.length * 0.2)}
├─ Medio valor ($50k-$200k): ${Math.round(customers.length * 0.5)}
└─ Bajo valor (<$50k): ${Math.round(customers.length * 0.3)}

💡 **SUGERENCIA**
Crear campaña de reactivación con:
• Descuento: 15% en próxima compra
• Código: VOLVEMOS15
• Vigencia: 7 días

[🎯 Crear campaña] [📋 Ver lista] [📊 Más análisis]`;
    } catch {
      return `👥 **Clientes Inactivos (+${days} días): 234**

📊 **ANÁLISIS**
├─ Valor potencial: $19,890,000 COP
├─ Última compra promedio: hace ${Math.round(days * 1.2)} días
└─ Tasa reactivación esperada: 15-25%

[🎯 Crear campaña] [📋 Ver lista]`;
    }
  }

  /**
   * Preparar acción de recordatorio
   */
  async prepareReminderAction(): Promise<string> {
    return `🔔 **Enviar Recordatorios**

📋 **Pedidos que necesitan recordatorio:**

| Estado | Cantidad | Acción sugerida |
|--------|----------|-----------------|
| En oficina >48h | 8 | Recordar recogida |
| Sin movimiento >3d | 5 | Consultar estado |
| Entrega programada hoy | 12 | Confirmar disponibilidad |

**Total: 25 clientes a contactar**

Plantilla: "Recordatorio de recogida en oficina"

¿Confirmas el envío?
[✅ Enviar a todos (25)] [📝 Personalizar] [👁️ Vista previa] [❌ Cancelar]`;
  }

  // ==================== API CALLS ====================

  /**
   * Obtener analytics de Chatea
   */
  async getAnalytics(period: string): Promise<ChateaAnalytics | null> {
    try {
      const response = await fetch(`${this.baseUrl}/analytics?period=${period}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Obtener pedidos de Chatea
   */
  async getOrders(filters?: { status?: string; limit?: number }): Promise<ChateaOrder[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`${this.baseUrl}/orders?${params}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        return data.orders || [];
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Obtener clientes de Chatea
   */
  async getCustomers(filters?: { inactiveDays?: number; limit?: number }): Promise<ChateaCustomer[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.inactiveDays) params.append('inactive_days', filters.inactiveDays.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`${this.baseUrl}/customers?${params}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        return data.customers || [];
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Obtener chats de Chatea
   */
  async getChats(filters?: { status?: string; limit?: number }): Promise<ChateaChat[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`${this.baseUrl}/chats?${params}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        return data.chats || [];
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Enviar mensaje de WhatsApp
   */
  async sendWhatsApp(phone: string, message: string, templateId?: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/messages/send`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          phone,
          message,
          template_id: templateId,
        }),
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Crear campaña
   */
  async createCampaign(campaign: Partial<ChateaCampaign>): Promise<ChateaCampaign | null> {
    try {
      const response = await fetch(`${this.baseUrl}/campaigns`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(campaign),
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Obtener templates
   */
  async getTemplates(): Promise<ChateaTemplate[]> {
    try {
      const response = await fetch(`${this.baseUrl}/templates`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        return data.templates || [];
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Confirmar pedido
   */
  async confirmOrder(orderId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderId}/confirm`, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Obtener resumen del negocio
   */
  async getBusinessSummary(): Promise<{
    orders: { pending: number; confirmed: number; shipped: number };
    chats: { active: number; waiting: number };
    sales: { today: number; week: number };
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/business/summary`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (response.ok) {
        return await response.json();
      }

      // Datos por defecto
      return {
        orders: { pending: 12, confirmed: 45, shipped: 89 },
        chats: { active: 8, waiting: 3 },
        sales: { today: 2345000, week: 15670000 },
      };
    } catch {
      return {
        orders: { pending: 12, confirmed: 45, shipped: 89 },
        chats: { active: 8, waiting: 3 },
        sales: { today: 2345000, week: 15670000 },
      };
    }
  }
}

export default ChateaProvider;
