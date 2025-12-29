/**
 * RiskScoringService - PR #6
 *
 * Simple risk scoring (0-100) using ONLY these logistics fields:
 * - estatus (canonical)
 * - ciudad_de_destino
 * - transportadora
 * - novedad
 * - fecha_de_ultimo_movimiento
 *
 * Score breakdown:
 * A) Time without movement: max 50 pts
 * B) Canonical status: max 25 pts
 * C) Novedad present: max 15 pts
 * D) Risky city/carrier: max 10 pts
 *
 * TOTAL: 0-100
 *
 * Levels:
 * - score >= 70 -> HIGH
 * - score 40-69 -> MEDIUM
 * - score < 40 -> LOW
 */

import {
  RiskLevel,
  RiskScoreResult,
  ScoreReason,
  GuideStateForScoring,
  ScoringThresholds,
} from '../../types/scoring.types';
import { CanonicalStatus } from '../../types/canonical.types';
import { RiskFlags } from '../config/RiskFlags';

// =====================================================
// CONSTANTS
// =====================================================

const DEFAULT_THRESHOLDS: ScoringThresholds = {
  highRiskMin: 70,
  mediumRiskMin: 40,
};

// Terminal statuses (no further action needed)
const TERMINAL_STATUSES: CanonicalStatus[] = [
  CanonicalStatus.DELIVERED,
  CanonicalStatus.CANCELLED,
];

// =====================================================
// SCORING SERVICE IMPLEMENTATION
// =====================================================

class RiskScoringServiceImpl {
  private thresholds: ScoringThresholds = DEFAULT_THRESHOLDS;

  /**
   * Score a guide and return risk level
   */
  scoreGuide(guideState: GuideStateForScoring): RiskScoreResult {
    const now = new Date();
    const reasons: ScoreReason[] = [];

    // Check if terminal
    const isTerminal = TERMINAL_STATUSES.includes(guideState.estatus);

    // If terminal, return LOW with no further scoring
    if (isTerminal) {
      reasons.push('status_delivered');
      return {
        guia: guideState.numero_de_guia,
        riskLevel: 'LOW',
        score: 0,
        reasons,
        computedAt: now,
        isTerminal: true,
        breakdown: {
          timeScore: 0,
          statusScore: 0,
          novedadScore: 0,
          locationScore: 0,
        },
      };
    }

    // Calculate each component
    const timeResult = this.scoreTimeWithoutMovement(guideState.fecha_de_ultimo_movimiento);
    const statusResult = this.scoreStatus(guideState.estatus);
    const novedadResult = this.scoreNovedad(guideState.novedad);
    const locationResult = this.scoreLocation(
      guideState.ciudad_de_destino,
      guideState.transportadora
    );

    // Aggregate reasons
    reasons.push(...timeResult.reasons);
    reasons.push(...statusResult.reasons);
    reasons.push(...novedadResult.reasons);
    reasons.push(...locationResult.reasons);

    // Calculate total score
    const totalScore = Math.min(100,
      timeResult.score +
      statusResult.score +
      novedadResult.score +
      locationResult.score
    );

    // Determine risk level
    const riskLevel = this.scoreToLevel(totalScore);

    return {
      guia: guideState.numero_de_guia,
      riskLevel,
      score: totalScore,
      reasons,
      computedAt: now,
      isTerminal: false,
      breakdown: {
        timeScore: timeResult.score,
        statusScore: statusResult.score,
        novedadScore: novedadResult.score,
        locationScore: locationResult.score,
      },
    };
  }

  /**
   * A) Time without movement (max 50 pts)
   * >= 24h -> +10
   * >= 48h -> +25
   * >= 72h -> +35
   * >= 120h -> +50
   */
  private scoreTimeWithoutMovement(
    fechaUltimoMovimiento: Date | string | undefined
  ): { score: number; reasons: ScoreReason[] } {
    const reasons: ScoreReason[] = [];

    if (!fechaUltimoMovimiento) {
      // No movement date = assume risky
      reasons.push('48h_no_movement');
      return { score: 25, reasons };
    }

    const movementDate = new Date(fechaUltimoMovimiento);
    const now = Date.now();
    const hoursSinceMovement = (now - movementDate.getTime()) / (1000 * 60 * 60);

    let score = 0;

    if (hoursSinceMovement >= 120) {
      score = 50;
      reasons.push('120h_no_movement');
    } else if (hoursSinceMovement >= 72) {
      score = 35;
      reasons.push('72h_no_movement');
    } else if (hoursSinceMovement >= 48) {
      score = 25;
      reasons.push('48h_no_movement');
    } else if (hoursSinceMovement >= 24) {
      score = 10;
      reasons.push('24h_no_movement');
    }

    return { score, reasons };
  }

  /**
   * B) Canonical status (max 25 pts)
   * DELIVERED -> +0 (terminal)
   * IN_OFFICE -> +20
   * ISSUE / RETURNED -> +25
   * IN_TRANSIT / OUT_FOR_DELIVERY -> +10
   * Others -> +5
   */
  private scoreStatus(
    estatus: CanonicalStatus
  ): { score: number; reasons: ScoreReason[] } {
    const reasons: ScoreReason[] = [];
    let score = 0;

    switch (estatus) {
      case CanonicalStatus.DELIVERED:
      case CanonicalStatus.CANCELLED:
        // Terminal - handled separately
        reasons.push('status_delivered');
        score = 0;
        break;

      case CanonicalStatus.IN_OFFICE:
        reasons.push('status_at_office');
        score = 20;
        break;

      case CanonicalStatus.ISSUE:
        reasons.push('status_exception');
        score = 25;
        break;

      case CanonicalStatus.RETURNED:
        reasons.push('status_return');
        score = 25;
        break;

      case CanonicalStatus.IN_TRANSIT:
      case CanonicalStatus.OUT_FOR_DELIVERY:
        reasons.push('status_in_transit');
        score = 10;
        break;

      default:
        // CREATED, PROCESSING, SHIPPED
        score = 5;
        break;
    }

    return { score, reasons };
  }

  /**
   * C) Novedad (max 15 pts)
   * Empty -> +0
   * Present -> +15
   */
  private scoreNovedad(
    novedad: string | undefined
  ): { score: number; reasons: ScoreReason[] } {
    const reasons: ScoreReason[] = [];

    if (novedad && novedad.trim().length > 0) {
      reasons.push('novedad_present');
      return { score: 15, reasons };
    }

    return { score: 0, reasons };
  }

  /**
   * D) Location/Carrier risk (max 10 pts total)
   * Risky city -> +5
   * Risky carrier -> +5
   */
  private scoreLocation(
    ciudad: string | undefined,
    transportadora: string | undefined
  ): { score: number; reasons: ScoreReason[] } {
    const reasons: ScoreReason[] = [];
    let score = 0;

    if (RiskFlags.isRiskyCity(ciudad)) {
      reasons.push('risky_city');
      score += 5;
    }

    if (RiskFlags.isRiskyCarrier(transportadora)) {
      reasons.push('risky_carrier');
      score += 5;
    }

    return { score, reasons };
  }

  /**
   * Convert score to risk level
   */
  private scoreToLevel(score: number): RiskLevel {
    if (score >= this.thresholds.highRiskMin) {
      return 'HIGH';
    }
    if (score >= this.thresholds.mediumRiskMin) {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  /**
   * Calculate hours since last movement
   */
  getHoursSinceMovement(fechaUltimoMovimiento: Date | string | undefined): number | undefined {
    if (!fechaUltimoMovimiento) {
      return undefined;
    }
    const movementDate = new Date(fechaUltimoMovimiento);
    const now = Date.now();
    return Math.round((now - movementDate.getTime()) / (1000 * 60 * 60));
  }

  /**
   * Set custom thresholds
   */
  setThresholds(thresholds: ScoringThresholds): void {
    this.thresholds = thresholds;
  }

  /**
   * Get current thresholds
   */
  getThresholds(): ScoringThresholds {
    return { ...this.thresholds };
  }

  /**
   * Reset to default thresholds
   */
  resetThresholds(): void {
    this.thresholds = DEFAULT_THRESHOLDS;
  }

  /**
   * Batch score multiple guides
   */
  scoreGuides(guides: GuideStateForScoring[]): RiskScoreResult[] {
    return guides.map(g => this.scoreGuide(g));
  }

  /**
   * Sort guides by risk (HIGH first, then by score descending)
   */
  sortByRisk(results: RiskScoreResult[]): RiskScoreResult[] {
    return [...results].sort((a, b) => {
      // Terminal always last
      if (a.isTerminal && !b.isTerminal) return 1;
      if (!a.isTerminal && b.isTerminal) return -1;

      // HIGH first
      const levelOrder: Record<RiskLevel, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      const levelDiff = levelOrder[a.riskLevel] - levelOrder[b.riskLevel];
      if (levelDiff !== 0) return levelDiff;

      // Then by score descending
      return b.score - a.score;
    });
  }

  /**
   * Filter by risk level
   */
  filterByLevel(results: RiskScoreResult[], level: RiskLevel): RiskScoreResult[] {
    return results.filter(r => r.riskLevel === level && !r.isTerminal);
  }

  /**
   * Get statistics
   */
  getStats(results: RiskScoreResult[]): {
    total: number;
    byLevel: Record<RiskLevel, number>;
    avgScore: number;
    terminalCount: number;
  } {
    const byLevel: Record<RiskLevel, number> = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    let totalScore = 0;
    let nonTerminalCount = 0;
    let terminalCount = 0;

    for (const r of results) {
      if (r.isTerminal) {
        terminalCount++;
      } else {
        byLevel[r.riskLevel]++;
        totalScore += r.score;
        nonTerminalCount++;
      }
    }

    return {
      total: results.length,
      byLevel,
      avgScore: nonTerminalCount > 0 ? Math.round(totalScore / nonTerminalCount) : 0,
      terminalCount,
    };
  }
}

// =====================================================
// SINGLETON EXPORT
// =====================================================

export const RiskScoringService = new RiskScoringServiceImpl();
export default RiskScoringService;
