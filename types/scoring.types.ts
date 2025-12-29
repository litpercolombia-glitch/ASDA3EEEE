/**
 * Scoring Types - PR #6
 *
 * Simple risk scoring (0-100) using ONLY these logistics fields:
 * - fecha
 * - telefono (hash only)
 * - numero_de_guia
 * - estatus (canonical)
 * - ciudad_de_destino
 * - transportadora
 * - novedad
 * - fecha_de_ultimo_movimiento
 * - ultimo_movimiento
 * - fecha_de_generacion_de_guia
 */

import { CanonicalStatus } from './canonical.types';

// =====================================================
// CORE TYPES
// =====================================================

/**
 * Risk level derived from score
 */
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

/**
 * Reason codes for score components
 */
export type ScoreReason =
  // Time without movement
  | '24h_no_movement'
  | '48h_no_movement'
  | '72h_no_movement'
  | '120h_no_movement'
  // Status
  | 'status_at_office'
  | 'status_exception'
  | 'status_return'
  | 'status_in_transit'
  | 'status_delivered'
  // Novedad
  | 'novedad_present'
  // Location/Carrier risk
  | 'risky_city'
  | 'risky_carrier';

/**
 * Result of scoring a guide
 */
export interface RiskScoreResult {
  guia: string;
  riskLevel: RiskLevel;
  score: number; // 0-100
  reasons: ScoreReason[];
  computedAt: Date;

  // Terminal flag (DELIVERED = no further action needed)
  isTerminal: boolean;

  // Breakdown for debugging
  breakdown?: {
    timeScore: number;
    statusScore: number;
    novedadScore: number;
    locationScore: number;
  };
}

// =====================================================
// INPUT TYPES
// =====================================================

/**
 * Guide state input for scoring
 * Uses ONLY allowed logistics fields
 */
export interface GuideStateForScoring {
  numero_de_guia: string;
  estatus: CanonicalStatus;
  ciudad_de_destino?: string;
  transportadora?: string;
  novedad?: string;
  fecha_de_ultimo_movimiento?: Date | string;
  fecha_de_generacion_de_guia?: Date | string;
}

// =====================================================
// CONFIG TYPES
// =====================================================

/**
 * Risk flags configuration
 */
export interface RiskFlagsConfig {
  riskyCities: string[];
  riskyCarriers: string[];
}

/**
 * Scoring thresholds configuration
 */
export interface ScoringThresholds {
  highRiskMin: number;   // >= this = HIGH
  mediumRiskMin: number; // >= this = MEDIUM, < highRiskMin
  // < mediumRiskMin = LOW
}

// =====================================================
// QUEUE TYPES
// =====================================================

/**
 * Risk queue entry for admin endpoint
 */
export interface RiskQueueEntry {
  guia: string;
  riskLevel: RiskLevel;
  score: number;
  reasons: ScoreReason[];
  ciudad_de_destino?: string;
  transportadora?: string;
  estatus: string;
  fecha_de_ultimo_movimiento?: string;
  hoursSinceLastMovement?: number;
  computedAt: string;
}

/**
 * Risk queue stats
 */
export interface RiskQueueStats {
  total: number;
  byLevel: Record<RiskLevel, number>;
  avgScore: number;
  terminalCount: number;
}
