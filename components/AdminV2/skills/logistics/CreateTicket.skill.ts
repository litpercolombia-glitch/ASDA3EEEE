/**
 * CreateTicket Skill
 *
 * Crea tickets de soporte para problemas con envíos
 */

import { AlertCircle, MessageSquare, Clock, CheckCircle } from 'lucide-react';
import { Skill, SkillResult, SkillContext } from '../types';
import SkillsRegistry from '../SkillsRegistry';

export const CreateTicketSkill: Skill = {
  id: 'create-ticket',
  name: 'Crear Ticket',
  description: 'Crea tickets de soporte para problemas con envíos',
  category: 'logistics',
  icon: AlertCircle,
  version: '1.0.0',

  requiredParams: [
    {
      name: 'guideNumber',
      type: 'string',
      label: 'Número de Guía',
      placeholder: 'Ej: 123456789',
    },
    {
      name: 'issueType',
      type: 'select',
      label: 'Tipo de Problema',
      options: [
        { value: 'delay', label: 'Retraso en entrega' },
        { value: 'lost', label: 'Paquete extraviado' },
        { value: 'damaged', label: 'Paquete dañado' },
        { value: 'wrong-address', label: 'Dirección incorrecta' },
        { value: 'customer-absent', label: 'Cliente ausente' },
        { value: 'return', label: 'Solicitud de devolución' },
        { value: 'other', label: 'Otro' },
      ],
    },
  ],

  optionalParams: [
    {
      name: 'priority',
      type: 'select',
      label: 'Prioridad',
      options: [
        { value: 'low', label: 'Baja' },
        { value: 'medium', label: 'Media' },
        { value: 'high', label: 'Alta' },
        { value: 'urgent', label: 'Urgente' },
      ],
    },
    {
      name: 'description',
      type: 'string',
      label: 'Descripción adicional',
      placeholder: 'Detalles del problema...',
    },
  ],

  roles: ['admin', 'operator'],

  keywords: [
    'ticket',
    'problema',
    'soporte',
    'reclamo',
    'queja',
    'incidente',
    'novedad',
    'retraso',
    'perdido',
    'extraviado',
    'dañado',
    'devolucion',
    'ayuda',
    'reportar',
  ],

  examples: [
    'Crear ticket para guía 123456',
    'Reportar problema con envío 789012',
    'Ticket de retraso para guía ABC123',
    'El paquete 456789 está perdido',
    'Crear reclamo por daño en guía 321654',
  ],

  async execute(params: Record<string, any>, context: SkillContext): Promise<SkillResult> {
    const {
      guideNumber,
      issueType = 'other',
      priority = 'medium',
      description = '',
    } = params;

    if (!guideNumber) {
      return {
        success: false,
        message: 'Por favor proporciona el número de guía para crear el ticket',
        error: {
          code: 'MISSING_GUIDE',
          details: 'El número de guía es requerido',
        },
      };
    }

    // Simulate ticket creation
    await new Promise(resolve => setTimeout(resolve, 500));

    const ticketId = `TKT-${Date.now().toString(36).toUpperCase()}`;
    const issueLabels: Record<string, string> = {
      delay: 'Retraso en entrega',
      lost: 'Paquete extraviado',
      damaged: 'Paquete dañado',
      'wrong-address': 'Dirección incorrecta',
      'customer-absent': 'Cliente ausente',
      return: 'Solicitud de devolución',
      other: 'Otro',
    };

    const priorityLabels: Record<string, string> = {
      low: '🟢 Baja',
      medium: '🟡 Media',
      high: '🟠 Alta',
      urgent: '🔴 Urgente',
    };

    const estimatedResponse: Record<string, string> = {
      low: '48 horas',
      medium: '24 horas',
      high: '8 horas',
      urgent: '2 horas',
    };

    return {
      success: true,
      message: `Ticket ${ticketId} creado exitosamente para guía ${guideNumber}`,
      data: {
        ticketId,
        guideNumber,
        issueType,
        priority,
        description,
        status: 'open',
        createdAt: new Date().toISOString(),
      },
      artifact: {
        type: 'table',
        title: `Ticket Creado: ${ticketId}`,
        content: {
          columns: [
            { key: 'field', label: 'Campo', width: '40%' },
            { key: 'value', label: 'Valor', width: '60%' },
          ],
          rows: [
            { field: 'ID del Ticket', value: ticketId },
            { field: 'Número de Guía', value: guideNumber },
            { field: 'Tipo de Problema', value: issueLabels[issueType] },
            { field: 'Prioridad', value: priorityLabels[priority] },
            { field: 'Estado', value: '📋 Abierto' },
            { field: 'Tiempo de Respuesta Estimado', value: estimatedResponse[priority] },
            { field: 'Creado', value: new Date().toLocaleString('es-CO') },
            ...(description ? [{ field: 'Descripción', value: description }] : []),
          ],
        },
      },
      suggestedActions: [
        {
          label: 'Ver estado del ticket',
          skillId: 'ticket-status',
          params: { ticketId },
          icon: Clock,
        },
        {
          label: 'Rastrear guía',
          skillId: 'track-shipment',
          params: { guideNumber },
        },
        {
          label: 'Notificar al cliente',
          skillId: 'send-whatsapp',
          params: { guideNumber, ticketId, template: 'ticket-created' },
          icon: MessageSquare,
        },
        {
          label: 'Ver tickets abiertos',
          skillId: 'list-tickets',
          params: { status: 'open' },
        },
      ],
    };
  },

  artifactType: 'table',
};

SkillsRegistry.register(CreateTicketSkill);

export default CreateTicketSkill;
