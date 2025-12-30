/**
 * SendWhatsApp Skill
 *
 * Envía mensajes de WhatsApp a clientes
 */

import { MessageCircle, Send, Check, Clock } from 'lucide-react';
import { Skill, SkillResult, SkillContext } from '../types';
import SkillsRegistry from '../SkillsRegistry';

export const SendWhatsAppSkill: Skill = {
  id: 'send-whatsapp',
  name: 'Enviar WhatsApp',
  description: 'Envía mensajes de WhatsApp a clientes sobre sus envíos',
  category: 'communication',
  icon: MessageCircle,
  version: '1.0.0',

  requiredParams: [
    {
      name: 'guideNumber',
      type: 'string',
      label: 'Número de Guía',
      placeholder: 'Ej: 123456789',
    },
  ],

  optionalParams: [
    {
      name: 'template',
      type: 'select',
      label: 'Plantilla',
      options: [
        { value: 'status-update', label: 'Actualización de estado' },
        { value: 'delivery-today', label: 'Entrega programada hoy' },
        { value: 'delivery-attempt', label: 'Intento de entrega' },
        { value: 'delivered', label: 'Entrega exitosa' },
        { value: 'delay-notice', label: 'Aviso de retraso' },
        { value: 'return-notice', label: 'Aviso de devolución' },
        { value: 'custom', label: 'Mensaje personalizado' },
      ],
    },
    {
      name: 'customMessage',
      type: 'string',
      label: 'Mensaje personalizado',
      placeholder: 'Escribe tu mensaje...',
    },
    {
      name: 'phone',
      type: 'string',
      label: 'Teléfono (opcional)',
      placeholder: '+57 300 123 4567',
    },
  ],

  roles: ['admin', 'operator'],

  keywords: [
    'whatsapp',
    'mensaje',
    'enviar',
    'notificar',
    'cliente',
    'comunicar',
    'avisar',
    'contactar',
    'wa',
    'wsp',
  ],

  examples: [
    'Enviar WhatsApp para guía 123456',
    'Notificar cliente de la guía 789012',
    'Enviar aviso de entrega hoy',
    'Mensaje de retraso para 456789',
    'Contactar cliente por WhatsApp',
  ],

  async execute(params: Record<string, any>, context: SkillContext): Promise<SkillResult> {
    const {
      guideNumber,
      template = 'status-update',
      customMessage,
      phone,
    } = params;

    if (!guideNumber) {
      return {
        success: false,
        message: 'Por favor proporciona el número de guía',
        error: {
          code: 'MISSING_GUIDE',
          details: 'El número de guía es requerido para enviar el mensaje',
        },
      };
    }

    // Simulate sending message
    await new Promise(resolve => setTimeout(resolve, 800));

    const templates: Record<string, { title: string; message: string }> = {
      'status-update': {
        title: 'Actualización de Estado',
        message: `Hola! Tu pedido con guía ${guideNumber} está en camino. Puedes rastrearlo aquí: [link]`,
      },
      'delivery-today': {
        title: 'Entrega Programada Hoy',
        message: `Hola! Tu pedido con guía ${guideNumber} será entregado hoy. Por favor mantente disponible. 📦`,
      },
      'delivery-attempt': {
        title: 'Intento de Entrega',
        message: `Hola! Intentamos entregar tu pedido ${guideNumber} pero no fue posible. Te contactaremos para reprogramar.`,
      },
      delivered: {
        title: 'Entrega Exitosa',
        message: `Tu pedido con guía ${guideNumber} fue entregado exitosamente. ¡Gracias por tu compra! ⭐`,
      },
      'delay-notice': {
        title: 'Aviso de Retraso',
        message: `Hola! Lamentamos informarte que tu pedido ${guideNumber} tiene un pequeño retraso. Nuevo estimado: mañana.`,
      },
      'return-notice': {
        title: 'Aviso de Devolución',
        message: `Tu pedido ${guideNumber} está en proceso de devolución. Te contactaremos pronto con más información.`,
      },
      custom: {
        title: 'Mensaje Personalizado',
        message: customMessage || 'Mensaje no especificado',
      },
    };

    const selectedTemplate = templates[template];
    const customerPhone = phone || '+57 300 XXX XXXX';
    const messageId = `MSG-${Date.now().toString(36).toUpperCase()}`;

    return {
      success: true,
      message: `Mensaje de WhatsApp enviado exitosamente a ${customerPhone}`,
      data: {
        messageId,
        guideNumber,
        template,
        phone: customerPhone,
        status: 'sent',
        sentAt: new Date().toISOString(),
      },
      artifact: {
        type: 'table',
        title: `WhatsApp Enviado: ${selectedTemplate.title}`,
        content: {
          columns: [
            { key: 'field', label: 'Campo', width: '35%' },
            { key: 'value', label: 'Valor', width: '65%' },
          ],
          rows: [
            { field: 'ID del Mensaje', value: messageId },
            { field: 'Guía', value: guideNumber },
            { field: 'Teléfono', value: customerPhone },
            { field: 'Plantilla', value: selectedTemplate.title },
            { field: 'Estado', value: '✅ Enviado' },
            { field: 'Enviado', value: new Date().toLocaleString('es-CO') },
            { field: 'Mensaje', value: selectedTemplate.message },
          ],
        },
      },
      suggestedActions: [
        {
          label: 'Ver historial de mensajes',
          skillId: 'message-history',
          params: { guideNumber },
          icon: Clock,
        },
        {
          label: 'Enviar otro mensaje',
          skillId: 'send-whatsapp',
          params: { guideNumber },
          icon: Send,
        },
        {
          label: 'Rastrear guía',
          skillId: 'track-shipment',
          params: { guideNumber },
        },
      ],
    };
  },

  artifactType: 'table',
};

SkillsRegistry.register(SendWhatsAppSkill);

export default SendWhatsAppSkill;
