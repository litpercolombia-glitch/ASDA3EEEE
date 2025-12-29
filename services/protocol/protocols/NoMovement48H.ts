/**
 * Protocol A: NO_MOVEMENT_48H
 *
 * Condición:
 * - fecha_de_ultimo_movimiento > 48h
 * - estatus != DELIVERED
 * - novedad vacía o no resuelta
 *
 * Decisión:
 * - ActionPlan: SEND_WHATSAPP
 * - priority: media
 * - trigger: 'NO_MOVEMENT_48H'
 */

import { Protocol, ProtocolInput, PlannedAction } from '../../../types/protocol.types';
import { CanonicalStatus } from '../../../types/canonical.types';

// 48 hours in milliseconds
const HOURS_48_MS = 48 * 60 * 60 * 1000;

/**
 * Check if a novelty indicates an unresolved issue
 * Empty novelty or certain keywords mean "no resolved novelty"
 */
function hasUnresolvedNovelty(novedad: string | null): boolean {
  if (!novedad || novedad.trim() === '') {
    return true; // No novelty = could still need attention
  }

  const resolved = novedad.toLowerCase();

  // Keywords that indicate resolved issues
  const resolvedKeywords = [
    'solucionado',
    'resuelto',
    'entregado',
    'ok',
    'completado',
    'exitoso',
  ];

  // If any resolved keyword found, novelty is resolved
  return !resolvedKeywords.some(keyword => resolved.includes(keyword));
}

/**
 * Calculate hours since last movement
 */
function hoursSinceMovement(lastMovement: Date, now: Date): number {
  const diffMs = now.getTime() - lastMovement.getTime();
  return diffMs / (60 * 60 * 1000);
}

export const NoMovement48HProtocol: Protocol = {
  id: 'NO_MOVEMENT_48H',
  name: 'Sin Movimiento 48 Horas',
  description: 'Detecta guías sin movimiento por más de 48 horas que no están entregadas',

  evaluate(input: ProtocolInput, now: Date): boolean {
    // Skip if already delivered (or other terminal state)
    // Note: ProtocolEngine already filters these, but double-check here
    if (input.canonicalStatus === CanonicalStatus.DELIVERED) {
      return false;
    }

    // Check time since last movement
    const diffMs = now.getTime() - input.fecha_de_ultimo_movimiento.getTime();
    if (diffMs < HOURS_48_MS) {
      return false; // Less than 48 hours
    }

    // Check novelty
    if (!hasUnresolvedNovelty(input.novedad)) {
      return false; // Novelty is resolved
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
        reason: 'sin_movimiento',
        priority: 'media',
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

export default NoMovement48HProtocol;
