/**
 * CalibrationRules - PR #8
 *
 * Automatic calibration based on outcome data.
 * Applies recommendations with limits and audit trail.
 *
 * Safety features:
 * - Max changes per run
 * - Cooldown period between changes
 * - Audit logging for all changes
 * - Dry-run mode
 */

import {
  CalibrationRecommendation,
  CalibrationThresholds,
  DEFAULT_CALIBRATION_THRESHOLDS,
  RecommendationType,
} from '../../types/outcome.types';
import { CalibrationReportService } from './CalibrationReportService';
import { logAdminAction } from '../auth/AdminAuth';

// =====================================================
// CONFIGURATION
// =====================================================

export interface CalibrationConfig {
  /** Maximum number of changes per calibration run */
  maxChangesPerRun: number;

  /** Minimum hours between auto-calibrations */
  cooldownHours: number;

  /** Only apply high-confidence recommendations */
  requireHighConfidence: boolean;

  /** Thresholds for generating recommendations */
  thresholds: CalibrationThresholds;
}

export const DEFAULT_CALIBRATION_CONFIG: CalibrationConfig = {
  maxChangesPerRun: 3,
  cooldownHours: 24,
  requireHighConfidence: true,
  thresholds: DEFAULT_CALIBRATION_THRESHOLDS,
};

// =====================================================
// CALIBRATION STATE
// =====================================================

interface CalibrationState {
  lastCalibrationAt?: Date;
  appliedChanges: Array<{
    timestamp: Date;
    type: RecommendationType;
    target: CalibrationRecommendation['target'];
    oldValue?: string | number;
    newValue?: string | number;
    reason: string;
  }>;
  pendingSuggestions: CalibrationRecommendation[];
}

const state: CalibrationState = {
  appliedChanges: [],
  pendingSuggestions: [],
};

// =====================================================
// CALIBRATION RULES SERVICE
// =====================================================

class CalibrationRulesImpl {
  private config: CalibrationConfig = DEFAULT_CALIBRATION_CONFIG;

  /**
   * Update configuration
   */
  setConfig(config: Partial<CalibrationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): CalibrationConfig {
    return { ...this.config };
  }

  /**
   * Run calibration analysis and generate suggestions
   * Does NOT apply changes automatically
   */
  analyze(days: number = 7): {
    recommendations: CalibrationRecommendation[];
    canAutoApply: boolean;
    cooldownRemaining?: number;
  } {
    // Check cooldown
    if (state.lastCalibrationAt) {
      const hoursSinceLast = (Date.now() - state.lastCalibrationAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLast < this.config.cooldownHours) {
        return {
          recommendations: state.pendingSuggestions,
          canAutoApply: false,
          cooldownRemaining: Math.ceil(this.config.cooldownHours - hoursSinceLast),
        };
      }
    }

    // Generate report with recommendations
    const report = CalibrationReportService.generateReport(days, this.config.thresholds);

    // Filter by confidence if required
    let recommendations = report.recommendations;
    if (this.config.requireHighConfidence) {
      recommendations = recommendations.filter(r => r.confidence === 'high');
    }

    // Store for later reference
    state.pendingSuggestions = recommendations;

    return {
      recommendations,
      canAutoApply: recommendations.length > 0,
    };
  }

  /**
   * Apply a specific recommendation (manual approval)
   */
  applyRecommendation(
    recommendation: CalibrationRecommendation,
    dryRun: boolean = true
  ): {
    success: boolean;
    applied: boolean;
    message: string;
  } {
    if (dryRun) {
      return {
        success: true,
        applied: false,
        message: `[DRY RUN] Would apply: ${recommendation.type} for ${JSON.stringify(recommendation.target)}`,
      };
    }

    // Check max changes limit
    const recentChanges = state.appliedChanges.filter(c => {
      const hoursSince = (Date.now() - c.timestamp.getTime()) / (1000 * 60 * 60);
      return hoursSince < 24;
    });

    if (recentChanges.length >= this.config.maxChangesPerRun) {
      return {
        success: false,
        applied: false,
        message: `Max changes per day (${this.config.maxChangesPerRun}) reached. Wait before applying more.`,
      };
    }

    // Apply the change based on type
    const result = this.executeChange(recommendation);

    if (result.success) {
      // Record the change
      state.appliedChanges.push({
        timestamp: new Date(),
        type: recommendation.type,
        target: recommendation.target,
        oldValue: recommendation.currentValue,
        newValue: recommendation.suggestedValue,
        reason: recommendation.reason,
      });

      state.lastCalibrationAt = new Date();

      // Audit log
      logAdminAction('CALIBRATION_APPLIED', {
        type: recommendation.type,
        target: recommendation.target,
        reason: recommendation.reason,
        confidence: recommendation.confidence,
        evidence: recommendation.evidence,
      });
    }

    return result;
  }

  /**
   * Execute a specific change
   */
  private async executeChange(recommendation: CalibrationRecommendation): Promise<{
    success: boolean;
    applied: boolean;
    message: string;
  }> {
    const { type, target } = recommendation;

    switch (type) {
      case 'ADD_RISKY_CITY':
        if (!target.city) {
          return { success: false, applied: false, message: 'No city specified' };
        }
        // Dynamic import to avoid circular dependency
        const { RiskFlags } = await import('../config/RiskFlags');
        RiskFlags.addRiskyCity(target.city);
        return {
          success: true,
          applied: true,
          message: `Added "${target.city}" to risky cities`,
        };

      case 'REMOVE_RISKY_CITY':
        if (!target.city) {
          return { success: false, applied: false, message: 'No city specified' };
        }
        const { RiskFlags: RF1 } = await import('../config/RiskFlags');
        RF1.removeRiskyCity(target.city);
        return {
          success: true,
          applied: true,
          message: `Removed "${target.city}" from risky cities`,
        };

      case 'ADD_RISKY_CARRIER':
        if (!target.carrier) {
          return { success: false, applied: false, message: 'No carrier specified' };
        }
        const { RiskFlags: RF2 } = await import('../config/RiskFlags');
        RF2.addRiskyCarrier(target.carrier);
        return {
          success: true,
          applied: true,
          message: `Added "${target.carrier}" to risky carriers`,
        };

      case 'REMOVE_RISKY_CARRIER':
        if (!target.carrier) {
          return { success: false, applied: false, message: 'No carrier specified' };
        }
        const { RiskFlags: RF3 } = await import('../config/RiskFlags');
        RF3.removeRiskyCarrier(target.carrier);
        return {
          success: true,
          applied: true,
          message: `Removed "${target.carrier}" from risky carriers`,
        };

      case 'INCREASE_THRESHOLD':
      case 'DECREASE_THRESHOLD':
      case 'CREATE_TICKET_FASTER':
      case 'DISABLE_TRIGGER':
      case 'ENABLE_TRIGGER':
        // These require code changes or config updates
        // Return as suggestion only
        return {
          success: true,
          applied: false,
          message: `Recommendation logged: ${type} for ${target.trigger || 'general'}. Manual action required.`,
        };

      case 'NO_CHANGE':
        return {
          success: true,
          applied: false,
          message: 'No change needed',
        };

      default:
        return {
          success: false,
          applied: false,
          message: `Unknown recommendation type: ${type}`,
        };
    }
  }

  /**
   * Get calibration history
   */
  getHistory(): CalibrationState['appliedChanges'] {
    return [...state.appliedChanges];
  }

  /**
   * Get pending suggestions
   */
  getPendingSuggestions(): CalibrationRecommendation[] {
    return [...state.pendingSuggestions];
  }

  /**
   * Get calibration status
   */
  getStatus(): {
    lastCalibrationAt?: Date;
    changesLast24h: number;
    pendingSuggestions: number;
    cooldownActive: boolean;
    cooldownRemaining?: number;
  } {
    const recentChanges = state.appliedChanges.filter(c => {
      const hoursSince = (Date.now() - c.timestamp.getTime()) / (1000 * 60 * 60);
      return hoursSince < 24;
    });

    let cooldownRemaining: number | undefined;
    let cooldownActive = false;

    if (state.lastCalibrationAt) {
      const hoursSinceLast = (Date.now() - state.lastCalibrationAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLast < this.config.cooldownHours) {
        cooldownActive = true;
        cooldownRemaining = Math.ceil(this.config.cooldownHours - hoursSinceLast);
      }
    }

    return {
      lastCalibrationAt: state.lastCalibrationAt,
      changesLast24h: recentChanges.length,
      pendingSuggestions: state.pendingSuggestions.length,
      cooldownActive,
      cooldownRemaining,
    };
  }

  /**
   * Clear state (for testing)
   */
  clear(): void {
    state.lastCalibrationAt = undefined;
    state.appliedChanges = [];
    state.pendingSuggestions = [];
  }
}

// Singleton export
export const CalibrationRules = new CalibrationRulesImpl();

export default CalibrationRules;
