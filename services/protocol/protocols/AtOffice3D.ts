/**
 * Protocol B: AT_OFFICE_3D
 *
 * Condición:
 * - estatus == AT_OFFICE
 * - fecha_de_ultimo_movimiento > 72h
 *
 * Decisión:
 * - ActionPlan: SEND_WHATSAPP
 * - priority: alta
 * - trigger: 'AT_OFFICE_3D'
 */

import { Protocol, ProtocolInput, PlannedAction } from '../../../types/protocol.types';
import { CanonicalStatus } from '../../../types/canonical.types';

// 72 hours in milliseconds
const HOURS_72_MS = 72 * 60 * 60 * 1000;

/**
 * Calculate hours since last movement
 */
function hoursSinceMovement(lastMovement: Date, now: Date): number {
  const diffMs = now.getTime() - lastMovement.getTime();
  return diffMs / (60 * 60 * 1000);
}

export const AtOffice3DProtocol: Protocol = {
  id: 'AT_OFFICE_3D',
  name: 'En Oficina 3 Días',
  description: 'Detecta guías que llevan más de 72 horas en oficina de la transportadora',

  evaluate(input: ProtocolInput, now: Date): boolean {
    // Must be AT_OFFICE status
    if (input.canonicalStatus !== CanonicalStatus.AT_OFFICE) {
      return false;
    }

    // Check time since last movement
    const diffMs = now.getTime() - input.fecha_de_ultimo_movimiento.getTime();
    if (diffMs < HOURS_72_MS) {
      return false; // Less than 72 hours
    }

    // All conditions met
    return true;
  },

  generateActions(input: ProtocolInput): PlannedAction[] {
    const hours = hoursSinceMovement(input.fecha_de_ultimo_movimiento, new Date());
    const days = Math.floor(hours / 24);

    return [
      {
        type: 'SEND_WHATSAPP',
        reason: 'en_oficina_prolongado',
        priority: 'alta',
        metadata: {
          city: input.ciudad_de_destino,
          carrier: input.transportadora,
          daysSinceMovement: days,
          lastStatus: input.canonicalStatus,
          novelty: input.novedad || undefined,
        },
      },
    ];
  },
};

export default AtOffice3DProtocol;
