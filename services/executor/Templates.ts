/**
 * WhatsApp Templates
 *
 * Template definitions for Chatea API.
 * Only uses logistics fields, no PII.
 */

import { WhatsAppTemplate, TemplateInput } from '../../types/executor.types';
import { ProtocolTrigger } from '../../types/protocol.types';

// =====================================================
// TEMPLATE DEFINITIONS
// =====================================================

/**
 * Template: No Movement 48H
 * Triggered when guide has no movement for 48+ hours
 */
export const TEMPLATE_NO_MOVEMENT_48H: WhatsAppTemplate = {
  id: 'no_movement_48h',
  name: 'no_movement_48h',
  trigger: 'NO_MOVEMENT_48H',
  variables: [
    'numero_de_guia',
    'transportadora',
    'ultimo_movimiento',
    'fecha_de_ultimo_movimiento',
  ],
  body: `🚚 Actualización de tu envío

Tu pedido con guía *{{numero_de_guia}}* no ha tenido movimiento en las últimas 48 horas.

📦 Transportadora: {{transportadora}}
📍 Último estado: {{ultimo_movimiento}}
📅 Última actualización: {{fecha_de_ultimo_movimiento}}

Estamos haciendo seguimiento para que tu pedido llegue pronto.

Si tienes preguntas, responde a este mensaje.`,
};

/**
 * Template: At Office 3 Days
 * Triggered when guide is at carrier office for 72+ hours
 */
export const TEMPLATE_AT_OFFICE_3D: WhatsAppTemplate = {
  id: 'at_office_3d',
  name: 'at_office_3d',
  trigger: 'AT_OFFICE_3D',
  variables: [
    'numero_de_guia',
    'ciudad_de_destino',
    'transportadora',
  ],
  body: `📬 Tu pedido te está esperando

Tu pedido con guía *{{numero_de_guia}}* está disponible para recogida en la oficina de {{transportadora}} en {{ciudad_de_destino}}.

⚠️ Lleva más de 3 días esperándote.

Por favor, recógelo lo antes posible para evitar devolución.

Si tienes preguntas, responde a este mensaje.`,
};

// =====================================================
// TEMPLATE REGISTRY
// =====================================================

const TEMPLATES: Record<ProtocolTrigger, WhatsAppTemplate> = {
  'NO_MOVEMENT_48H': TEMPLATE_NO_MOVEMENT_48H,
  'AT_OFFICE_3D': TEMPLATE_AT_OFFICE_3D,
  'DELIVERY_FAILED': TEMPLATE_NO_MOVEMENT_48H, // Placeholder
  'RETURNED_START': TEMPLATE_NO_MOVEMENT_48H, // Placeholder
  'MANUAL': TEMPLATE_NO_MOVEMENT_48H, // Placeholder
};

// =====================================================
// TEMPLATE SERVICE
// =====================================================

class TemplateServiceImpl {
  /**
   * Get template for a trigger
   */
  getTemplate(trigger: ProtocolTrigger): WhatsAppTemplate | null {
    return TEMPLATES[trigger] || null;
  }

  /**
   * Get template name for Chatea API
   */
  getTemplateName(trigger: ProtocolTrigger): string {
    const template = this.getTemplate(trigger);
    return template?.name || 'default';
  }

  /**
   * Render template variables from input
   */
  renderVariables(trigger: ProtocolTrigger, input: TemplateInput): Record<string, string> {
    const template = this.getTemplate(trigger);
    if (!template) {
      return {};
    }

    const variables: Record<string, string> = {};

    for (const varName of template.variables) {
      const key = varName as keyof TemplateInput;
      variables[varName] = input[key] || '';
    }

    return variables;
  }

  /**
   * Format date for display
   */
  formatDate(dateStr: string): string {
    if (!dateStr) return '';

    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return dateStr; // Return as-is if invalid
      }

      // Format: "15 ene 2024"
      return date.toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  /**
   * Build template input from action metadata
   */
  buildTemplateInput(metadata: {
    guia?: string;
    canonicalStatus?: string;
    city?: string;
    carrier?: string;
    lastMovementAt?: Date | string;
    lastMovementText?: string;
  }): TemplateInput {
    return {
      numero_de_guia: metadata.guia || '',
      estatus: metadata.canonicalStatus || '',
      ciudad_de_destino: metadata.city || '',
      transportadora: metadata.carrier || '',
      fecha_de_ultimo_movimiento: metadata.lastMovementAt
        ? this.formatDate(String(metadata.lastMovementAt))
        : '',
      ultimo_movimiento: metadata.lastMovementText || '',
    };
  }

  /**
   * Get all registered templates
   */
  getAllTemplates(): WhatsAppTemplate[] {
    return Object.values(TEMPLATES);
  }

  /**
   * Validate template exists in Chatea
   * (Would call Chatea API to verify)
   */
  async validateTemplate(templateName: string): Promise<boolean> {
    // TODO: Implement actual Chatea template validation
    return Object.values(TEMPLATES).some(t => t.name === templateName);
  }
}

// Singleton export
export const TemplateService = new TemplateServiceImpl();

export default TemplateService;
