// ============================================
// LITPER PRO - WEBHOOK SERVICE
// Manejo de webhooks entrantes y salientes
// ============================================

import { guiasService, alertasService, actividadService } from './supabaseService';
import { chateaService } from './chateaService';
import { StatusNormalizer, detectCarrier } from './StatusNormalizer';
import { CanonicalStatus, CanonicalStatusLabels, ExceptionReason, ExceptionReasonLabels } from '../types/canonical.types';

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
// MAPEO DE ESTADOS - Usa StatusNormalizer (fuente única de verdad)
// ============================================

/**
 * Mapea un estado de transportadora a un estado legible en español
 * usando el sistema canónico unificado
 */
const mapEstado = (estado: string, transportadora?: string): string => {
  const carrier = transportadora ? detectCarrier(transportadora) : 'UNKNOWN';
  const normalized = StatusNormalizer.normalize(estado, carrier);
  return CanonicalStatusLabels[normalized.status];
};

/**
 * Obtiene información completa del estado normalizado
 */
const getNormalizedStatus = (estado: string, transportadora?: string) => {
  const carrier = transportadora ? detectCarrier(transportadora) : 'UNKNOWN';
  return StatusNormalizer.normalize(estado, carrier);
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

      // Usar el normalizador canónico para obtener estado + razón
      const normalized = getNormalizedStatus(payload.estado, payload.transportadora);
      const nuevoEstado = CanonicalStatusLabels[normalized.status];
      const tieneNovedad = normalized.status === CanonicalStatus.ISSUE || payload.novedad !== undefined;
      const tipoNovedad = normalized.reason !== ExceptionReason.NONE
        ? ExceptionReasonLabels[normalized.reason]
        : payload.novedad?.tipo;

      // Actualizar la guía con datos canónicos
      await guiasService.update(guia.id, {
        estado: nuevoEstado,
        estado_detalle: payload.detalle,
        tiene_novedad: tieneNovedad,
        tipo_novedad: tipoNovedad,
        descripcion_novedad: payload.novedad?.descripcion,
        fecha_actualizacion: new Date().toISOString(),
        // Datos canónicos adicionales
        canonical_status: normalized.status,
        canonical_reason: normalized.reason,
        raw_status: normalized.rawStatus,
        ...(normalized.status === CanonicalStatus.DELIVERED && { fecha_entrega: new Date().toISOString() }),
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
      // Normalizar estado usando sistema canónico
      const normalized = getNormalizedStatus(payload.status, payload.carrier);

      // Crear nueva guía desde Dropi
      const nuevaGuia = await guiasService.create({
        numero_guia: payload.tracking_number,
        transportadora: payload.carrier,
        ciudad_destino: payload.customer.city,
        estado: CanonicalStatusLabels[normalized.status],
        canonical_status: normalized.status,
        canonical_reason: normalized.reason,
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
// UTILIDADES DE WEBHOOK (FRONTEND - SIN SECRETOS)
// ============================================
// NOTA: La verificación HMAC de webhooks se hace 100% en el BACKEND.
// El frontend NUNCA debe tener acceso a secrets de webhook.
// Este módulo solo contiene utilidades de formato y timestamp.

export const webhookUtils = {
  /**
   * Verificar que el timestamp no sea muy antiguo (prevenir replay attacks)
   * Esta verificación NO requiere secretos - es solo validación de tiempo
   */
  isTimestampValid(timestamp: string, maxAgeSeconds: number = 300): boolean {
    try {
      const webhookTime = new Date(timestamp).getTime();
      const now = Date.now();
      const age = (now - webhookTime) / 1000;

      if (age > maxAgeSeconds) {
        console.warn(`⚠️ Webhook timestamp too old: ${age}s (max: ${maxAgeSeconds}s)`);
        return false;
      }

      if (age < -60) {
        // Timestamp en el futuro (más de 1 minuto) - sospechoso
        console.warn(`⚠️ Webhook timestamp in future: ${age}s`);
        return false;
      }

      return true;
    } catch {
      console.warn('⚠️ Invalid timestamp format');
      return false;
    }
  },

  /**
   * Formatear payload para envío (sin firma - el backend firma si es necesario)
   */
  formatPayload(event: string, data: Record<string, unknown>): string {
    return JSON.stringify({
      event,
      data,
      timestamp: new Date().toISOString(),
      source: 'litper-pro-frontend',
    });
  },
};

// Para compatibilidad con código existente, exportamos webhookVerification
// pero sin funciones que usen secretos
export const webhookVerification = {
  /**
   * @deprecated La verificación HMAC debe hacerse en el BACKEND.
   * Esta función solo valida el timestamp.
   */
  isTimestampValid: webhookUtils.isTimestampValid,
};

// ============================================
// EXPORTAR TODO
// ============================================

export default {
  handlers: webhookHandlers,
  outbound: webhookOutbound,
  utils: webhookUtils,
  // verification se mantiene solo para compatibilidad pero sin secretos
};
