/**
 * Protocol Types - PR #3
 *
 * Types for ProtocolEngine decision system.
 * Decides WHAT to do, does NOT execute.
 */

import { CanonicalStatus, ExceptionReason } from './canonical.types';
import { ActionType } from './eventLog.types';

// =====================================================
// PROTOCOL TRIGGERS
// =====================================================

/**
 * Known protocol triggers
 * Each trigger maps to a specific business rule
 */
export type ProtocolTrigger =
  | 'NO_MOVEMENT_48H'    // Sin movimiento por 48+ horas
  | 'AT_OFFICE_3D'       // En oficina por 72+ horas
  | 'DELIVERY_FAILED'    // Intento de entrega fallido
  | 'RETURNED_START'     // Inicio de devolución
  | 'MANUAL';            // Disparado manualmente

/**
 * Priority levels for actions
 */
export type ActionPriority = 'baja' | 'media' | 'alta' | 'critica';

// =====================================================
// ACTION PLAN
// =====================================================

/**
 * Single action to be taken
 */
export interface PlannedAction {
  type: ActionType;
  reason: string;
  priority: ActionPriority;
  metadata?: {
    city?: string;
    carrier?: string;
    daysSinceMovement?: number;
    lastStatus?: string;
    novelty?: string;
  };
}

/**
 * Complete action plan for a guide
 * Output of ProtocolEngine
 */
export interface ActionPlan {
  guia: string;
  trigger: ProtocolTrigger;
  actions: PlannedAction[];
  evaluatedAt: Date;
  guideState: {
    currentStatus: CanonicalStatus;
    currentReason?: ExceptionReason;
    lastEventAt: Date;
    city: string;
    carrier: string;
  };
}

// =====================================================
// PROTOCOL DEFINITION
// =====================================================

/**
 * Input data for protocol evaluation
 * Based ONLY on allowed fields from Dropi
 */
export interface ProtocolInput {
  guia: string;
  canonicalStatus: CanonicalStatus;
  exceptionReason?: ExceptionReason;
  novedad: string | null;
  ciudad_de_destino: string;
  transportadora: string;
  fecha_de_ultimo_movimiento: Date;
  ultimo_movimiento: string;
  fecha_de_generacion_de_guia: Date | null;
  lastEventId: string;
}

/**
 * Protocol definition
 */
export interface Protocol {
  id: ProtocolTrigger;
  name: string;
  description: string;

  /**
   * Check if this protocol applies
   * Returns true if conditions are met
   */
  evaluate: (input: ProtocolInput, now: Date) => boolean;

  /**
   * Generate actions if protocol applies
   */
  generateActions: (input: ProtocolInput) => PlannedAction[];
}

// =====================================================
// PROTOCOL ENGINE RESULT
// =====================================================

/**
 * Result of evaluating all protocols for a guide
 */
export interface ProtocolEvaluationResult {
  guia: string;
  evaluated: boolean;
  skipped: boolean;
  skipReason?: 'DELIVERED' | 'OUT_OF_ORDER' | 'NO_STATE' | 'NO_EVENT';
  matchedProtocols: ProtocolTrigger[];
  actionPlans: ActionPlan[];
  evaluatedAt: Date;
}

/**
 * Result of running protocols on all guides
 */
export interface BatchProtocolResult {
  totalGuides: number;
  evaluated: number;
  skipped: number;
  actionPlansCreated: number;
  duplicatesSkipped: number;
  byTrigger: Record<ProtocolTrigger, number>;
  durationMs: number;
}

// =====================================================
// IDEMPOTENCY
// =====================================================

/**
 * Build idempotency key for action plan
 * Format: action:{guia}:{trigger}:{date}
 */
export function buildActionPlanKey(
  guia: string,
  trigger: ProtocolTrigger,
  date: Date = new Date()
): string {
  const day = date.toISOString().split('T')[0]; // YYYY-MM-DD
  return `action:${guia}:${trigger}:${day}`;
}
