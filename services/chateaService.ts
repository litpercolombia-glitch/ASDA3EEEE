// ============================================
// LITPER PRO - CHATEA SERVICE
// Integración con Chatea para WhatsApp Business
// ============================================

// ============================================
// CONFIGURACIÓN
// ============================================

const CHATEA_API_KEY = import.meta.env.VITE_CHATEA_API_KEY || 'HSbSQoOYa6kfnRxZ6YekDcVj85u85oInCGsP6CRJtnPCKBtEfsWvLe0TiN0W';
const CHATEA_WEBHOOK_URL = import.meta.env.VITE_CHATEA_WEBHOOK_URL || 'https://chateapro.app/api/iwh/5423b247e32fc95f089fc0905393cd69';
const CHATEA_API_BASE = 'https://chateapro.app/api';

// ============================================
// TIPOS
// ============================================

export interface WhatsAppMessage {
  to: string; // Número de teléfono con código de país (ej: 573001234567)
  message: string;
  type?: 'text' | 'template' | 'media';
  mediaUrl?: string;
  templateName?: string;
  templateParams?: string[];
}

export interface ChateaResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface AlertaWhatsApp {
  tipo: 'critica' | 'advertencia' | 'info' | 'exito';
  titulo: string;
  mensaje: string;
  destinatarios: string[]; // Números de WhatsApp
  datos?: Record<string, string | number>;
}

// ============================================
// TEMPLATES DE MENSAJES
// ============================================

const MENSAJE_TEMPLATES = {
  alerta_critica: (titulo: string, mensaje: string, datos?: Record<string, string | number>) => `
🚨 *ALERTA CRÍTICA - LITPER PRO*

*${titulo}*

${mensaje}

${datos ? Object.entries(datos).map(([k, v]) => `• ${k}: ${v}`).join('\n') : ''}

⏰ ${new Date().toLocaleString('es-CO')}
`.trim(),

  alerta_advertencia: (titulo: string, mensaje: string, datos?: Record<string, string | number>) => `
⚠️ *ADVERTENCIA - LITPER PRO*

*${titulo}*

${mensaje}

${datos ? Object.entries(datos).map(([k, v]) => `• ${k}: ${v}`).join('\n') : ''}

⏰ ${new Date().toLocaleString('es-CO')}
`.trim(),

  alerta_info: (titulo: string, mensaje: string, datos?: Record<string, string | number>) => `
ℹ️ *INFO - LITPER PRO*

*${titulo}*

${mensaje}

${datos ? Object.entries(datos).map(([k, v]) => `• ${k}: ${v}`).join('\n') : ''}

⏰ ${new Date().toLocaleString('es-CO')}
`.trim(),

  alerta_exito: (titulo: string, mensaje: string, datos?: Record<string, string | number>) => `
✅ *ÉXITO - LITPER PRO*

*${titulo}*

${mensaje}

${datos ? Object.entries(datos).map(([k, v]) => `• ${k}: ${v}`).join('\n') : ''}

⏰ ${new Date().toLocaleString('es-CO')}
`.trim(),

  resumen_diario: (datos: {
    guiasHoy: number;
    entregadas: number;
    tasaEntrega: number;
    ventasHoy: number;
    novedades: number;
  }) => `
📊 *RESUMEN DIARIO - LITPER PRO*
📅 ${new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}

📦 *Guías procesadas:* ${datos.guiasHoy}
✅ *Entregadas:* ${datos.entregadas} (${datos.tasaEntrega}%)
💰 *Ventas del día:* $${datos.ventasHoy.toLocaleString('es-CO')}
⚠️ *Novedades:* ${datos.novedades}

${datos.tasaEntrega >= 75 ? '🟢 Rendimiento: EXCELENTE' : datos.tasaEntrega >= 60 ? '🟡 Rendimiento: REGULAR' : '🔴 Rendimiento: CRÍTICO'}

¡Gracias por usar Litper Pro!
`.trim(),

  ciudad_critica: (ciudad: string, tasa: number, recomendacion: string) => `
🚨 *CIUDAD EN ZONA ROJA*

📍 *${ciudad}*
📉 Tasa de entrega: *${tasa}%*

💡 *Recomendación:*
${recomendacion}

⏰ ${new Date().toLocaleString('es-CO')}
`.trim(),

  meta_alcanzada: (meta: string, valor: string) => `
🎉 *¡META ALCANZADA!*

🏆 *${meta}*
📊 Valor: *${valor}*

¡Excelente trabajo equipo! 💪

⏰ ${new Date().toLocaleString('es-CO')}
`.trim(),
};

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

const formatPhoneNumber = (phone: string): string => {
  // Remover espacios, guiones y paréntesis
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // Si no empieza con +, agregar código de Colombia
  if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('57')) {
      cleaned = '+' + cleaned;
    } else {
      cleaned = '+57' + cleaned;
    }
  }

  return cleaned;
};

// ============================================
// SERVICIO PRINCIPAL
// ============================================

export const chateaService = {
  /**
   * Enviar mensaje de WhatsApp
   */
  async sendMessage(message: WhatsAppMessage): Promise<ChateaResponse> {
    try {
      const formattedPhone = formatPhoneNumber(message.to);

      const response = await fetch(`${CHATEA_API_BASE}/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CHATEA_API_KEY}`,
          'X-API-Key': CHATEA_API_KEY,
        },
        body: JSON.stringify({
          phone: formattedPhone,
          message: message.message,
          type: message.type || 'text',
          ...(message.mediaUrl && { mediaUrl: message.mediaUrl }),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Chatea API error:', errorText);
        return {
          success: false,
          error: `Error ${response.status}: ${errorText}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.messageId || data.id,
      };
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  },

  /**
   * Enviar mensaje a múltiples destinatarios
   */
  async sendToMany(phones: string[], message: string): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const phone of phones) {
      const result = await this.sendMessage({ to: phone, message });
      if (result.success) {
        sent++;
      } else {
        failed++;
        console.error(`Failed to send to ${phone}:`, result.error);
      }
      // Pequeño delay para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return { sent, failed };
  },

  /**
   * Enviar alerta por WhatsApp
   */
  async sendAlerta(alerta: AlertaWhatsApp): Promise<{ sent: number; failed: number }> {
    const templateFn = MENSAJE_TEMPLATES[`alerta_${alerta.tipo}` as keyof typeof MENSAJE_TEMPLATES];

    if (typeof templateFn !== 'function') {
      console.error('Template no encontrado:', alerta.tipo);
      return { sent: 0, failed: alerta.destinatarios.length };
    }

    const mensaje = templateFn(alerta.titulo, alerta.mensaje, alerta.datos);
    return this.sendToMany(alerta.destinatarios, mensaje);
  },

  /**
   * Enviar resumen diario
   */
  async sendResumenDiario(
    destinatarios: string[],
    datos: {
      guiasHoy: number;
      entregadas: number;
      tasaEntrega: number;
      ventasHoy: number;
      novedades: number;
    }
  ): Promise<{ sent: number; failed: number }> {
    const mensaje = MENSAJE_TEMPLATES.resumen_diario(datos);
    return this.sendToMany(destinatarios, mensaje);
  },

  /**
   * Enviar alerta de ciudad crítica
   */
  async sendAlertaCiudadCritica(
    destinatarios: string[],
    ciudad: string,
    tasa: number,
    recomendacion: string
  ): Promise<{ sent: number; failed: number }> {
    const mensaje = MENSAJE_TEMPLATES.ciudad_critica(ciudad, tasa, recomendacion);
    return this.sendToMany(destinatarios, mensaje);
  },

  /**
   * Enviar notificación de meta alcanzada
   */
  async sendMetaAlcanzada(
    destinatarios: string[],
    meta: string,
    valor: string
  ): Promise<{ sent: number; failed: number }> {
    const mensaje = MENSAJE_TEMPLATES.meta_alcanzada(meta, valor);
    return this.sendToMany(destinatarios, mensaje);
  },

  /**
   * Registrar webhook entrante
   * Esta función se llama cuando Chatea envía datos a nuestro webhook
   */
  async handleWebhook(data: Record<string, unknown>): Promise<void> {
    console.log('Webhook recibido de Chatea:', data);

    // Aquí puedes procesar mensajes entrantes
    // Por ejemplo, respuestas de clientes, confirmaciones, etc.

    const messageType = data.type as string;
    const from = data.from as string;
    const message = data.message as string;

    if (messageType === 'message' && message) {
      // Procesar mensaje entrante
      console.log(`Mensaje de ${from}: ${message}`);

      // Aquí podrías:
      // 1. Guardar el mensaje en la base de datos
      // 2. Responder automáticamente
      // 3. Notificar al equipo
    }
  },

  /**
   * Verificar que la API está funcionando
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${CHATEA_API_BASE}/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${CHATEA_API_KEY}`,
          'X-API-Key': CHATEA_API_KEY,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Error testing Chatea connection:', error);
      return false;
    }
  },
};

// ============================================
// ALERTAS AUTOMÁTICAS
// ============================================

export const alertasAutomaticas = {
  /**
   * Configuración de destinatarios por tipo de alerta
   */
  destinatarios: {
    criticas: ['573001234567'], // Reemplazar con números reales
    operaciones: ['573001234567'],
    finanzas: ['573001234567'],
    general: ['573001234567'],
  },

  /**
   * Verificar y enviar alertas de ciudades críticas
   */
  async verificarCiudadesCriticas(ciudades: Array<{ ciudad: string; tasa: number }>): Promise<void> {
    for (const ciudad of ciudades) {
      if (ciudad.tasa < 50) {
        await chateaService.sendAlertaCiudadCritica(
          this.destinatarios.criticas,
          ciudad.ciudad,
          ciudad.tasa,
          'Se recomienda PAUSAR los envíos a esta ciudad hasta mejorar las condiciones.'
        );
      } else if (ciudad.tasa < 65) {
        await chateaService.sendAlertaCiudadCritica(
          this.destinatarios.operaciones,
          ciudad.ciudad,
          ciudad.tasa,
          'Monitorear de cerca. Considerar prepago obligatorio.'
        );
      }
    }
  },

  /**
   * Enviar resumen diario automático
   */
  async enviarResumenDiario(datos: {
    guiasHoy: number;
    entregadas: number;
    tasaEntrega: number;
    ventasHoy: number;
    novedades: number;
  }): Promise<void> {
    await chateaService.sendResumenDiario(this.destinatarios.general, datos);
  },

  /**
   * Alerta de margen bajo
   */
  async alertaMargenBajo(margen: number, umbral: number = 15): Promise<void> {
    if (margen < umbral) {
      await chateaService.sendAlerta({
        tipo: 'critica',
        titulo: 'Margen de ganancia bajo',
        mensaje: `El margen actual (${margen.toFixed(1)}%) está por debajo del objetivo (${umbral}%).`,
        destinatarios: this.destinatarios.finanzas,
        datos: {
          'Margen actual': `${margen.toFixed(1)}%`,
          'Objetivo': `${umbral}%`,
          'Diferencia': `${(umbral - margen).toFixed(1)}%`,
        },
      });
    }
  },
};

// ============================================
// EXPORT DEFAULT
// ============================================

export default chateaService;
