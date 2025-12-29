/**
 * Dry Run Types
 *
 * Types for protocol simulation and validation.
 * Run BEFORE executing real actions.
 */

import { ProtocolTrigger, ActionPlan, ActionPriority } from './protocol.types';
import { CanonicalStatus } from './canonical.types';

// =====================================================
// DRY RUN RESULT
// =====================================================

/**
 * Single guide evaluation in dry run
 */
export interface DryRunGuideResult {
  guia: string;
  currentStatus: CanonicalStatus;
  city: string;
  carrier: string;
  lastMovementAt: Date;
  daysSinceMovement: number;
  hoursSinceMovement: number;
  matchedProtocols: ProtocolTrigger[];
  wouldCreateActions: {
    type: string;
    reason: string;
    priority: ActionPriority;
  }[];
  potentialFalsePositive: boolean;
  falsePositiveReason?: string;
}

/**
 * Aggregated dry run report
 */
export interface DryRunReport {
  // Metadata
  runAt: Date;
  periodStart: Date;
  periodEnd: Date;
  durationMs: number;

  // Volume summary
  totalGuides: number;
  totalEvaluated: number;
  totalSkipped: number;
  totalWouldTrigger: number;

  // By protocol
  byProtocol: {
    [K in ProtocolTrigger]?: {
      count: number;
      percentage: number;
      guides: string[];
    };
  };

  // By status
  byStatus: {
    [K in CanonicalStatus]?: number;
  };

  // By city (top 10)
  topCities: {
    city: string;
    count: number;
  }[];

  // By carrier (top 10)
  topCarriers: {
    carrier: string;
    count: number;
  }[];

  // Potential issues
  potentialFalsePositives: DryRunGuideResult[];
  falsePositiveRate: number;

  // Time distribution
  byDaysSinceMovement: {
    '2-3 days': number;
    '3-5 days': number;
    '5-7 days': number;
    '7+ days': number;
  };

  // Daily projection
  estimatedDailyActions: {
    NO_MOVEMENT_48H: number;
    AT_OFFICE_3D: number;
    total: number;
  };

  // Raw data for analysis
  details: DryRunGuideResult[];
}

// =====================================================
// FALSE POSITIVE DETECTION
// =====================================================

/**
 * Patterns that might indicate false positives
 */
export interface FalsePositivePattern {
  id: string;
  name: string;
  description: string;
  detect: (guide: DryRunGuideResult, rawData?: Record<string, unknown>) => boolean;
}

/**
 * Known false positive patterns
 */
export const FALSE_POSITIVE_PATTERNS: FalsePositivePattern[] = [
  {
    id: 'RECENT_NOVELTY_UPDATE',
    name: 'Novedad reciente sin detectar',
    description: 'La novedad tiene contenido pero no se detectó como resuelta',
    detect: (guide) => {
      // Check if there's novelty content that looks active
      return false; // Will be implemented with actual data
    },
  },
  {
    id: 'WEEKEND_DELAY',
    name: 'Retraso de fin de semana',
    description: 'Sin movimiento porque es fin de semana normal',
    detect: (guide) => {
      const day = guide.lastMovementAt.getDay();
      const isWeekend = day === 0 || day === 6;
      return isWeekend && guide.daysSinceMovement <= 3;
    },
  },
  {
    id: 'JUST_CROSSED_THRESHOLD',
    name: 'Apenas cruzó el umbral',
    description: 'Acaba de pasar las 48h, podría moverse pronto',
    detect: (guide) => {
      return guide.hoursSinceMovement >= 48 && guide.hoursSinceMovement < 52;
    },
  },
];

// =====================================================
// SIMULATION CONFIG
// =====================================================

/**
 * Configuration for dry run simulation
 */
export interface DryRunConfig {
  /** Only evaluate guides updated after this date */
  since?: Date;

  /** Only evaluate guides updated before this date */
  until?: Date;

  /** Limit number of guides to evaluate */
  limit?: number;

  /** Include detailed false positive analysis */
  analyzeFalsePositives?: boolean;

  /** Filter by specific carriers */
  carriers?: string[];

  /** Filter by specific cities */
  cities?: string[];

  /** Filter by specific statuses */
  statuses?: CanonicalStatus[];
}
