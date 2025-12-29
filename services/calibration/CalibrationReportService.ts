/**
 * CalibrationReportService - PR #8
 *
 * Generates calibration reports with outcome metrics.
 * Used to measure effectiveness of protocols and identify
 * cities/carriers with poor performance.
 *
 * Key metrics:
 * - movedWithin24h% / movedWithin48h%
 * - ticketsCreatedAfterSend%
 * - Top worst performers
 */

import {
  OutcomeLog,
  OutcomeMetrics,
  DailyCalibrationReport,
  CalibrationReportWithRecommendations,
  CalibrationRecommendation,
  DEFAULT_CALIBRATION_THRESHOLDS,
  CalibrationThresholds,
} from '../../types/outcome.types';
import { ProtocolTrigger } from '../../types/protocol.types';
import { OutcomeService } from '../outcome/OutcomeService';
import { ActionLogService } from '../eventLog/ActionLogService';
import { TicketService } from '../tickets/TicketService';

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get date string in YYYY-MM-DD format
 */
function dateToString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get start of day
 */
function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of day
 */
function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Calculate percentage (0-100)
 */
function percentage(count: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((count / total) * 1000) / 10; // 1 decimal
}

// =====================================================
// CALIBRATION REPORT SERVICE
// =====================================================

class CalibrationReportServiceImpl {
  /**
   * Generate a daily calibration report
   */
  generateDailyReport(date: Date = new Date()): DailyCalibrationReport {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    const dateStr = dateToString(date);

    // Get outcomes for this day
    const outcomes = OutcomeService.getOutcomesInRange(dayStart, dayEnd);
    const finalOutcomes = outcomes.filter(o => o.isFinal);

    // Get actions for this day (for success rate)
    const allActions = ActionLogService.getAllActions();
    const dayActions = allActions.filter(a => {
      const actionDate = dateToString(a.createdAt);
      return actionDate === dateStr && a.actionType === 'SEND_WHATSAPP';
    });

    const successActions = dayActions.filter(a => a.status === 'SUCCESS');
    const failedActions = dayActions.filter(a => a.status === 'FAILED');

    // Calculate overall metrics
    const overall = {
      totalSent: dayActions.length,
      successRate: percentage(successActions.length, dayActions.length),
      movedWithin24hRate: percentage(
        finalOutcomes.filter(o => o.movedWithin24h).length,
        finalOutcomes.length
      ),
      movedWithin48hRate: percentage(
        finalOutcomes.filter(o => o.movedWithin48h).length,
        finalOutcomes.length
      ),
      ticketCreatedRate: percentage(
        finalOutcomes.filter(o => o.ticketCreatedAfter).length,
        finalOutcomes.length
      ),
    };

    // Calculate by trigger
    const byTrigger = this.calculateMetricsByTrigger(finalOutcomes, dayStart, dayEnd);

    // Calculate worst cities
    const worstCities = this.calculateWorstCities(finalOutcomes);

    // Calculate worst carriers
    const worstCarriers = this.calculateWorstCarriers(finalOutcomes);

    return {
      date: dateStr,
      overall,
      byTrigger,
      worstCities,
      worstCarriers,
      generatedAt: new Date(),
    };
  }

  /**
   * Calculate metrics grouped by trigger
   */
  private calculateMetricsByTrigger(
    outcomes: OutcomeLog[],
    periodStart: Date,
    periodEnd: Date
  ): Record<ProtocolTrigger, OutcomeMetrics> {
    const triggers: ProtocolTrigger[] = [
      'NO_MOVEMENT_48H',
      'AT_OFFICE_3D',
      'DELIVERY_FAILED',
      'RETURNED_START',
      'MANUAL',
    ];

    const result: Record<string, OutcomeMetrics> = {};

    for (const trigger of triggers) {
      const triggerOutcomes = outcomes.filter(o => o.trigger === trigger);

      if (triggerOutcomes.length === 0) {
        result[trigger] = this.emptyMetrics(trigger, periodStart, periodEnd);
        continue;
      }

      const moved24h = triggerOutcomes.filter(o => o.movedWithin24h).length;
      const moved48h = triggerOutcomes.filter(o => o.movedWithin48h).length;
      const ticketed = triggerOutcomes.filter(o => o.ticketCreatedAfter).length;

      const hoursToMovement = triggerOutcomes
        .filter(o => o.hoursToMovement !== undefined)
        .map(o => o.hoursToMovement!);

      const avgHours = hoursToMovement.length > 0
        ? hoursToMovement.reduce((a, b) => a + b, 0) / hoursToMovement.length
        : undefined;

      result[trigger] = {
        trigger,
        totalSent: triggerOutcomes.length,
        successfulSends: triggerOutcomes.length, // All outcomes are from SUCCESS actions
        failedSends: 0,
        movedWithin24hRate: percentage(moved24h, triggerOutcomes.length),
        movedWithin48hRate: percentage(moved48h, triggerOutcomes.length),
        ticketCreatedRate: percentage(ticketed, triggerOutcomes.length),
        avgHoursToMovement: avgHours ? Math.round(avgHours * 10) / 10 : undefined,
        periodStart,
        periodEnd,
      };
    }

    return result as Record<ProtocolTrigger, OutcomeMetrics>;
  }

  /**
   * Create empty metrics for a trigger
   */
  private emptyMetrics(
    trigger: ProtocolTrigger,
    periodStart: Date,
    periodEnd: Date
  ): OutcomeMetrics {
    return {
      trigger,
      totalSent: 0,
      successfulSends: 0,
      failedSends: 0,
      movedWithin24hRate: 0,
      movedWithin48hRate: 0,
      ticketCreatedRate: 0,
      periodStart,
      periodEnd,
    };
  }

  /**
   * Calculate top 5 worst performing cities
   */
  private calculateWorstCities(
    outcomes: OutcomeLog[]
  ): DailyCalibrationReport['worstCities'] {
    const cityStats: Map<string, { moved48h: number; total: number }> = new Map();

    for (const o of outcomes) {
      const stats = cityStats.get(o.city) || { moved48h: 0, total: 0 };
      stats.total++;
      if (o.movedWithin48h) stats.moved48h++;
      cityStats.set(o.city, stats);
    }

    // Convert to array and sort by worst rate (lowest moved48h%)
    const cities = Array.from(cityStats.entries())
      .map(([city, stats]) => ({
        city,
        movedWithin48hRate: percentage(stats.moved48h, stats.total),
        totalSent: stats.total,
      }))
      .filter(c => c.totalSent >= 3) // Min 3 sends for significance
      .sort((a, b) => a.movedWithin48hRate - b.movedWithin48hRate)
      .slice(0, 5);

    return cities;
  }

  /**
   * Calculate top 5 worst performing carriers
   */
  private calculateWorstCarriers(
    outcomes: OutcomeLog[]
  ): DailyCalibrationReport['worstCarriers'] {
    const carrierStats: Map<string, { moved48h: number; total: number }> = new Map();

    for (const o of outcomes) {
      const stats = carrierStats.get(o.carrier) || { moved48h: 0, total: 0 };
      stats.total++;
      if (o.movedWithin48h) stats.moved48h++;
      carrierStats.set(o.carrier, stats);
    }

    const carriers = Array.from(carrierStats.entries())
      .map(([carrier, stats]) => ({
        carrier,
        movedWithin48hRate: percentage(stats.moved48h, stats.total),
        totalSent: stats.total,
      }))
      .filter(c => c.totalSent >= 3)
      .sort((a, b) => a.movedWithin48hRate - b.movedWithin48hRate)
      .slice(0, 5);

    return carriers;
  }

  /**
   * Generate a multi-day calibration report with recommendations
   */
  generateReport(
    days: number = 7,
    thresholds: CalibrationThresholds = DEFAULT_CALIBRATION_THRESHOLDS
  ): CalibrationReportWithRecommendations {
    const now = new Date();
    const periodEnd = endOfDay(now);
    const periodStart = startOfDay(new Date(now.getTime() - days * 24 * 60 * 60 * 1000));

    // Generate daily reports
    const dailyReports: DailyCalibrationReport[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(periodStart.getTime() + i * 24 * 60 * 60 * 1000);
      dailyReports.push(this.generateDailyReport(date));
    }

    // Get all outcomes for the period
    const outcomes = OutcomeService.getOutcomesInRange(periodStart, periodEnd);
    const finalOutcomes = outcomes.filter(o => o.isFinal);

    // Calculate aggregated metrics
    const aggregated = {
      totalSent: dailyReports.reduce((sum, r) => sum + r.overall.totalSent, 0),
      successRate: this.averageNonZero(dailyReports.map(r => r.overall.successRate)),
      movedWithin24hRate: percentage(
        finalOutcomes.filter(o => o.movedWithin24h).length,
        finalOutcomes.length
      ),
      movedWithin48hRate: percentage(
        finalOutcomes.filter(o => o.movedWithin48h).length,
        finalOutcomes.length
      ),
      ticketCreatedRate: percentage(
        finalOutcomes.filter(o => o.ticketCreatedAfter).length,
        finalOutcomes.length
      ),
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      finalOutcomes,
      dailyReports,
      thresholds
    );

    return {
      periodDays: days,
      periodStart,
      periodEnd,
      dailyReports,
      aggregated,
      recommendations,
      generatedAt: new Date(),
    };
  }

  /**
   * Generate recommendations based on outcome data
   */
  private generateRecommendations(
    outcomes: OutcomeLog[],
    dailyReports: DailyCalibrationReport[],
    thresholds: CalibrationThresholds
  ): CalibrationRecommendation[] {
    const recommendations: CalibrationRecommendation[] = [];

    // Check by trigger
    const triggers: ProtocolTrigger[] = ['NO_MOVEMENT_48H', 'AT_OFFICE_3D'];

    for (const trigger of triggers) {
      const triggerOutcomes = outcomes.filter(o => o.trigger === trigger);

      if (triggerOutcomes.length < thresholds.minSampleSize) {
        continue;
      }

      const moved48hRate = percentage(
        triggerOutcomes.filter(o => o.movedWithin48h).length,
        triggerOutcomes.length
      );

      const ticketRate = percentage(
        triggerOutcomes.filter(o => o.ticketCreatedAfter).length,
        triggerOutcomes.length
      );

      // Low outcome rate → suggest increasing threshold
      if (moved48hRate < thresholds.lowOutcomeRateThreshold) {
        recommendations.push({
          type: 'INCREASE_THRESHOLD',
          confidence: this.calculateConfidence(triggerOutcomes.length, thresholds),
          target: { trigger },
          reason: `${trigger} has ${moved48hRate}% moved within 48h, below ${thresholds.lowOutcomeRateThreshold}% threshold`,
          currentValue: trigger === 'NO_MOVEMENT_48H' ? '48h' : '72h',
          suggestedValue: trigger === 'NO_MOVEMENT_48H' ? '72h' : '96h',
          evidence: {
            sampleSize: triggerOutcomes.length,
            currentRate: moved48hRate,
            threshold: thresholds.lowOutcomeRateThreshold,
            periodDays: dailyReports.length,
          },
          autoApply: false,
        });
      }

      // High ticket rate → something is broken
      if (ticketRate > thresholds.highTicketRateThreshold) {
        recommendations.push({
          type: 'CREATE_TICKET_FASTER',
          confidence: this.calculateConfidence(triggerOutcomes.length, thresholds),
          target: { trigger },
          reason: `${trigger} has ${ticketRate}% ticket creation rate, above ${thresholds.highTicketRateThreshold}% threshold`,
          evidence: {
            sampleSize: triggerOutcomes.length,
            currentRate: ticketRate,
            threshold: thresholds.highTicketRateThreshold,
            periodDays: dailyReports.length,
          },
          autoApply: false,
        });
      }
    }

    // Check by city
    const cityOutcomes = this.groupByCity(outcomes);
    for (const [city, cityData] of cityOutcomes) {
      if (cityData.length < thresholds.minSampleSize) continue;

      const moved48hRate = percentage(
        cityData.filter(o => o.movedWithin48h).length,
        cityData.length
      );

      if (moved48hRate < thresholds.lowOutcomeRateThreshold) {
        recommendations.push({
          type: 'ADD_RISKY_CITY',
          confidence: this.calculateConfidence(cityData.length, thresholds),
          target: { city },
          reason: `City "${city}" has ${moved48hRate}% moved within 48h`,
          evidence: {
            sampleSize: cityData.length,
            currentRate: moved48hRate,
            threshold: thresholds.lowOutcomeRateThreshold,
            periodDays: dailyReports.length,
          },
          autoApply: false,
        });
      }
    }

    // Check by carrier
    const carrierOutcomes = this.groupByCarrier(outcomes);
    for (const [carrier, carrierData] of carrierOutcomes) {
      if (carrierData.length < thresholds.minSampleSize) continue;

      const moved48hRate = percentage(
        carrierData.filter(o => o.movedWithin48h).length,
        carrierData.length
      );

      if (moved48hRate < thresholds.lowOutcomeRateThreshold) {
        recommendations.push({
          type: 'ADD_RISKY_CARRIER',
          confidence: this.calculateConfidence(carrierData.length, thresholds),
          target: { carrier },
          reason: `Carrier "${carrier}" has ${moved48hRate}% moved within 48h`,
          evidence: {
            sampleSize: carrierData.length,
            currentRate: moved48hRate,
            threshold: thresholds.lowOutcomeRateThreshold,
            periodDays: dailyReports.length,
          },
          autoApply: false,
        });
      }
    }

    return recommendations;
  }

  /**
   * Calculate confidence level based on sample size
   */
  private calculateConfidence(
    sampleSize: number,
    thresholds: CalibrationThresholds
  ): 'high' | 'medium' | 'low' {
    if (sampleSize >= thresholds.minSampleSize * 5) return 'high';
    if (sampleSize >= thresholds.minSampleSize * 2) return 'medium';
    return 'low';
  }

  /**
   * Group outcomes by city
   */
  private groupByCity(outcomes: OutcomeLog[]): Map<string, OutcomeLog[]> {
    const groups = new Map<string, OutcomeLog[]>();
    for (const o of outcomes) {
      const arr = groups.get(o.city) || [];
      arr.push(o);
      groups.set(o.city, arr);
    }
    return groups;
  }

  /**
   * Group outcomes by carrier
   */
  private groupByCarrier(outcomes: OutcomeLog[]): Map<string, OutcomeLog[]> {
    const groups = new Map<string, OutcomeLog[]>();
    for (const o of outcomes) {
      const arr = groups.get(o.carrier) || [];
      arr.push(o);
      groups.set(o.carrier, arr);
    }
    return groups;
  }

  /**
   * Calculate average of non-zero values
   */
  private averageNonZero(values: number[]): number {
    const nonZero = values.filter(v => v > 0);
    if (nonZero.length === 0) return 0;
    return Math.round((nonZero.reduce((a, b) => a + b, 0) / nonZero.length) * 10) / 10;
  }
}

// Singleton export
export const CalibrationReportService = new CalibrationReportServiceImpl();

export default CalibrationReportService;
