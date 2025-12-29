/**
 * Outcome Types - PR #8
 *
 * Tracks real outcomes of automated actions.
 * Measures if shipments moved after WhatsApp contact.
 *
 * NO PII stored - only aggregated metrics and hashed identifiers.
 */

import { ProtocolTrigger } from './protocol.types';
import { CanonicalStatus } from './canonical.types';

// =====================================================
// OUTCOME LOG
// =====================================================

/**
 * OutcomeLog - Tracks result of a SEND_WHATSAPP action
 * Records whether the shipment moved after contact
 */
export interface OutcomeLog {
  /** Unique outcome ID */
  id: string;

  /** Reference to the ActionLog that was executed */
  actionId: string;

  /** Tracking number */
  guia: string;

  /** What trigger caused this action */
  trigger: ProtocolTrigger;

  /** When the WhatsApp was sent */
  sentAt: Date;

  /** Status when the message was sent */
  statusAtSend: CanonicalStatus;

  /** City at time of send (for aggregation) */
  city: string;

  /** Carrier at time of send (for aggregation) */
  carrier: string;

  // =====================================================
  // OUTCOME TRACKING (computed fields)
  // =====================================================

  /** Previous fecha_de_ultimo_movimiento when message was sent */
  prevMovementAt: Date;

  /** New fecha_de_ultimo_movimiento (if any movement occurred) */
  newMovementAt?: Date;

  /** Did the shipment move within 24h of the message? */
  movedWithin24h: boolean;

  /** Did the shipment move within 48h of the message? */
  movedWithin48h: boolean;

  /** Delta in hours between send and next movement */
  hoursToMovement?: number;

  /** Final status after outcome window (48h) */
  finalStatus?: CanonicalStatus;

  /** Was a ticket created after this action? (indicates failure) */
  ticketCreatedAfter: boolean;

  /** When this outcome was computed/updated */
  computedAt: Date;

  /** Is this outcome final (48h window passed)? */
  isFinal: boolean;
}

// =====================================================
// OUTCOME COMPUTATION
// =====================================================

/**
 * Input for computing an outcome
 */
export interface OutcomeComputeInput {
  actionId: string;
  guia: string;
  trigger: ProtocolTrigger;
  sentAt: Date;
  statusAtSend: CanonicalStatus;
  city: string;
  carrier: string;
  prevMovementAt: Date;
}

/**
 * Result of checking for movement after send
 */
export interface MovementCheckResult {
  hasMoved: boolean;
  newMovementAt?: Date;
  hoursToMovement?: number;
  currentStatus: CanonicalStatus;
}

// =====================================================
// AGGREGATED METRICS
// =====================================================

/**
 * Metrics for a specific trigger/city/carrier combination
 */
export interface OutcomeMetrics {
  /** What we're measuring */
  trigger: ProtocolTrigger;
  city?: string;
  carrier?: string;

  /** Counts */
  totalSent: number;
  successfulSends: number;
  failedSends: number;

  /** Outcome rates (as percentages 0-100) */
  movedWithin24hRate: number;
  movedWithin48hRate: number;

  /** Ticket creation rate (proxy for "didn't work") */
  ticketCreatedRate: number;

  /** Average hours to movement (for successful outcomes) */
  avgHoursToMovement?: number;

  /** Time period */
  periodStart: Date;
  periodEnd: Date;
}

/**
 * Daily calibration report
 */
export interface DailyCalibrationReport {
  /** Report date */
  date: string; // YYYY-MM-DD

  /** Overall metrics */
  overall: {
    totalSent: number;
    successRate: number;
    movedWithin24hRate: number;
    movedWithin48hRate: number;
    ticketCreatedRate: number;
  };

  /** Breakdown by trigger */
  byTrigger: Record<ProtocolTrigger, OutcomeMetrics>;

  /** Top 5 worst performing cities */
  worstCities: Array<{
    city: string;
    movedWithin48hRate: number;
    totalSent: number;
  }>;

  /** Top 5 worst performing carriers */
  worstCarriers: Array<{
    carrier: string;
    movedWithin48hRate: number;
    totalSent: number;
  }>;

  /** When this report was generated */
  generatedAt: Date;
}

// =====================================================
// CALIBRATION RECOMMENDATIONS
// =====================================================

/**
 * Types of calibration recommendations
 */
export type RecommendationType =
  | 'INCREASE_THRESHOLD'   // Increase time threshold (e.g., 48h → 72h)
  | 'DECREASE_THRESHOLD'   // Decrease time threshold
  | 'ADD_RISKY_CITY'       // Add city to risky flags
  | 'REMOVE_RISKY_CITY'    // Remove city from risky flags
  | 'ADD_RISKY_CARRIER'    // Add carrier to risky flags
  | 'REMOVE_RISKY_CARRIER' // Remove carrier from risky flags
  | 'DISABLE_TRIGGER'      // Disable trigger for city/carrier
  | 'ENABLE_TRIGGER'       // Re-enable trigger
  | 'CREATE_TICKET_FASTER' // Reduce time before ticket creation
  | 'NO_CHANGE';           // Current settings are optimal

/**
 * Confidence level for recommendations
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * Single calibration recommendation
 */
export interface CalibrationRecommendation {
  /** Type of recommendation */
  type: RecommendationType;

  /** Confidence based on sample size and consistency */
  confidence: ConfidenceLevel;

  /** What this affects */
  target: {
    trigger?: ProtocolTrigger;
    city?: string;
    carrier?: string;
  };

  /** Human-readable explanation */
  reason: string;

  /** Current value (if applicable) */
  currentValue?: string | number;

  /** Suggested new value */
  suggestedValue?: string | number;

  /** Supporting data */
  evidence: {
    sampleSize: number;
    currentRate: number;
    threshold: number;
    periodDays: number;
  };

  /** Should this be auto-applied? */
  autoApply: boolean;
}

/**
 * Full calibration report with recommendations
 */
export interface CalibrationReportWithRecommendations {
  /** Period covered */
  periodDays: number;
  periodStart: Date;
  periodEnd: Date;

  /** Daily reports */
  dailyReports: DailyCalibrationReport[];

  /** Aggregated metrics for the period */
  aggregated: {
    totalSent: number;
    successRate: number;
    movedWithin24hRate: number;
    movedWithin48hRate: number;
    ticketCreatedRate: number;
  };

  /** Generated recommendations */
  recommendations: CalibrationRecommendation[];

  /** When this was generated */
  generatedAt: Date;
}

// =====================================================
// CALIBRATION THRESHOLDS
// =====================================================

/**
 * Thresholds for generating recommendations
 */
export interface CalibrationThresholds {
  /** Minimum sample size to generate recommendations */
  minSampleSize: number;

  /** If movedWithin48h < this %, suggest increasing threshold */
  lowOutcomeRateThreshold: number; // e.g., 30%

  /** If movedWithin48h > this %, trigger is working well */
  highOutcomeRateThreshold: number; // e.g., 60%

  /** If ticketCreatedRate > this %, something is wrong */
  highTicketRateThreshold: number; // e.g., 40%

  /** Days of consistent data needed for high confidence */
  consistentDaysForHighConfidence: number;
}

/**
 * Default calibration thresholds
 */
export const DEFAULT_CALIBRATION_THRESHOLDS: CalibrationThresholds = {
  minSampleSize: 10,
  lowOutcomeRateThreshold: 30,
  highOutcomeRateThreshold: 60,
  highTicketRateThreshold: 40,
  consistentDaysForHighConfidence: 5,
};
