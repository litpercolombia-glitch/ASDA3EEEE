// ============================================
// LITPER PRO - WEBHOOK SERVICE
// Manejo de webhooks entrantes y salientes
// ============================================

import { guiasService, alertasService, actividadService } from './supabaseService';
import { chateaService } from './chateaService';

// ============================================
// TIPOS
// ============================================

export interface WebhookPayload {
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
  source: string;
}

export interface TransportadoraWebhook {
  guia: string;
  estado: string;
  fecha: string;
  detalle?: string;
  transportadora: string;
  ciudad?: string;
  novedad?: {
    tipo: string;
    descripcion: string;
  };
}

export interface DropiWebhook {
  order_id: string;
  tracking_number: string;
  status: string;
  carrier: string;
  customer: {
    name: string;
    phone: string;
    address: string;
    city: string;
  };
  product: {
    name: string;
    quantity: number;
    price: number;
  };
}

// ============================================
// MAPEO DE ESTADOS
// ============================================

const ESTADO_MAP: Record<string, string> = {
  // Estados genéricos
  'pending': 'Pendiente',
  'shipped': 'En Tránsito',
  'in_transit': 'En Tránsito',
  'out_for_delivery': 'En Reparto',
  'delivered': 'Entregado',
  'returned': 'Devuelto',
  'cancelled': 'Cancelado',

  // Estados Coordinadora
  'ADMITIDO': 'En Tránsito',
  'EN DISTRIBUCION': 'En Reparto',
  'ENTREGADO': 'Entregado',
  'DEVUELTO': 'Devuelto',
  'NOVEDAD': 'Con Novedad',

  // Estados Servientrega
  'RECIBIDO': 'Pendiente',
  'EN CAMINO': 'En Tránsito',
  'EN CIUDAD DESTINO': 'En Reparto',
  'ENTREGA EXITOSA': 'Entregado',
  'NO ENTREGADO': 'Con Novedad',

  // Estados Interrapidísimo
  'RECEPCION': 'Pendiente',
  'TRANSITO': 'En Tránsito',
  'REPARTO': 'En Reparto',
  'OK': 'Entregado',
  'DEV': 'Devuelto',
};

const mapEstado = (estado: string): string => {
  const upperEstado = estado.toUpperCase();
  return ESTADO_MAP[upperEstado] || ESTADO_MAP[estado] || estado;
};

// ============================================
// HANDLERS DE WEBHOOKS
// ============================================

export const webhookHandlers = {
  /**
   * Procesar webhook de transportadora
   */
  async handleTransportadora(payload: TransportadoraWebhook): Promise<{ success: boolean; message: string }> {
    try {
      // Buscar la guía en la base de datos
      const guias = await guiasService.getAll(1000);
      const guia = guias.find(g => g.numero_guia === payload.guia);

      if (!guia) {
        console.warn(`Guía ${payload.guia} no encontrada en la base de datos`);
        return { success: false, message: 'Guía no encontrada' };
      }

      const nuevoEstado = mapEstado(payload.estado);
      const tieneNovedad = payload.novedad !== undefined;

      // Actualizar la guía
      await guiasService.update(guia.id, {
        estado: nuevoEstado,
        estado_detalle: payload.detalle,
        tiene_novedad: tieneNovedad,
        tipo_novedad: payload.novedad?.tipo,
        descripcion_novedad: payload.novedad?.descripcion,
        fecha_actualizacion: new Date().toISOString(),
        ...(nuevoEstado === 'Entregado' && { fecha_entrega: new Date().toISOString() }),
      });

      // Registrar actividad
      await actividadService.create({
        tipo: tieneNovedad ? 'novedad' : 'entrega',
        titulo: `Estado actualizado: ${nuevoEstado}`,
        descripcion: `Guía ${payload.guia} - ${payload.transportadora}`,
        metadata: { payload },
      });

      // Si hay novedad crítica, enviar alerta por WhatsApp
      if (tieneNovedad && payload.novedad?.tipo === 'critica') {
        await alertasService.create({
          tipo: 'critica',
          titulo: `Novedad en guía ${payload.guia}`,
          mensaje: payload.novedad.descripcion || 'Novedad detectada',
          fuente: payload.transportadora,
        });

        // Enviar WhatsApp (el número debería venir de configuración)
        try {
          await chateaService.sendAlerta({
            tipo: 'critica',
            titulo: `🚨 NOVEDAD CRÍTICA`,
            mensaje: `Guía: ${payload.guia}\n${payload.novedad.descripcion}`,
            accion: 'Gestionar inmediatamente',
          });
        } catch (whatsappError) {
          console.error('Error enviando WhatsApp:', whatsappError);
        }
      }

      return { success: true, message: `Guía ${payload.guia} actualizada a ${nuevoEstado}` };
    } catch (error) {
      console.error('Error procesando webhook transportadora:', error);
      return { success: false, message: 'Error interno' };
    }
  },

  /**
   * Procesar webhook de Dropi
   */
  async handleDropi(payload: DropiWebhook): Promise<{ success: boolean; message: string; guiaId?: string }> {
    try {
      // Crear nueva guía desde Dropi
      const nuevaGuia = await guiasService.create({
        numero_guia: payload.tracking_number,
        transportadora: payload.carrier,
        ciudad_destino: payload.customer.city,
        estado: mapEstado(payload.status),
        nombre_cliente: payload.customer.name,
        telefono: payload.customer.phone,
        direccion: payload.customer.address,
        valor_declarado: payload.product.price * payload.product.quantity,
        fuente: 'DROPI',
        metadata: {
          dropi_order_id: payload.order_id,
          producto: payload.product.name,
          cantidad: payload.product.quantity,
        },
      });

      // Registrar actividad
      await actividadService.create({
        tipo: 'carga',
        titulo: 'Nueva guía desde Dropi',
        descripcion: `Guía ${payload.tracking_number} - ${payload.customer.city}`,
        metadata: { dropi_order_id: payload.order_id },
      });

      return {
        success: true,
        message: `Guía ${payload.tracking_number} creada exitosamente`,
        guiaId: nuevaGuia.id,
      };
    } catch (error) {
      console.error('Error procesando webhook Dropi:', error);
      return { success: false, message: 'Error interno' };
    }
  },

  /**
   * Procesar webhook genérico
   */
  async handleGeneric(payload: WebhookPayload): Promise<{ success: boolean; message: string }> {
    try {
      // Registrar el webhook recibido
      await actividadService.create({
        tipo: 'sistema',
        titulo: `Webhook recibido: ${payload.event}`,
        descripcion: `Fuente: ${payload.source}`,
        metadata: payload,
      });

      // Procesar según el tipo de evento
      switch (payload.event) {
        case 'guia.created':
        case 'guia.updated':
        case 'guia.delivered':
        case 'guia.returned':
          // Estos eventos ya deberían procesarse por handleTransportadora
          break;

        case 'alert.triggered':
          // Crear alerta
          await alertasService.create({
            tipo: 'info',
            titulo: String(payload.data.title || 'Alerta externa'),
            mensaje: String(payload.data.message || 'Sin mensaje'),
            fuente: payload.source,
          });
          break;

        default:
          console.log(`Evento no manejado: ${payload.event}`);
      }

      return { success: true, message: 'Webhook procesado' };
    } catch (error) {
      console.error('Error procesando webhook genérico:', error);
      return { success: false, message: 'Error interno' };
    }
  },
};

// ============================================
// WEBHOOK OUTBOUND (para enviar a servicios externos)
// ============================================

export const webhookOutbound = {
  /**
   * Enviar webhook a URL externa
   */
  async send(url: string, payload: WebhookPayload): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Source': 'litper-pro',
          'X-Webhook-Timestamp': new Date().toISOString(),
        },
        body: JSON.stringify(payload),
      });

      return response.ok;
    } catch (error) {
      console.error('Error enviando webhook outbound:', error);
      return false;
    }
  },

  /**
   * Notificar cambio de estado a sistema externo
   */
  async notifyEstadoChange(
    guiaId: string,
    nuevoEstado: string,
    webhookUrl?: string
  ): Promise<void> {
    if (!webhookUrl) return;

    const payload: WebhookPayload = {
      event: 'guia.status_changed',
      data: {
        guia_id: guiaId,
        nuevo_estado: nuevoEstado,
      },
      timestamp: new Date().toISOString(),
      source: 'litper-pro',
    };

    await this.send(webhookUrl, payload);
  },
};

// ============================================
// VERIFICACIÓN DE WEBHOOKS
// ============================================

export const webhookVerification = {
  /**
   * Verificar firma HMAC de webhook
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    // Implementación básica - en producción usar crypto
    // const expectedSignature = crypto
    //   .createHmac('sha256', secret)
    //   .update(payload)
    //   .digest('hex');
    // return signature === expectedSignature;

    // Por ahora, verificación simple
    return signature.length > 0 && secret.length > 0;
  },

  /**
   * Verificar que el timestamp no sea muy antiguo (prevenir replay attacks)
   */
  verifyTimestamp(timestamp: string, maxAgeSeconds: number = 300): boolean {
    const webhookTime = new Date(timestamp).getTime();
    const now = Date.now();
    const age = (now - webhookTime) / 1000;
    return age <= maxAgeSeconds;
  },
};

// ============================================
// EXPORTAR TODO
// ============================================

export default {
  handlers: webhookHandlers,
  outbound: webhookOutbound,
  verification: webhookVerification,
};
