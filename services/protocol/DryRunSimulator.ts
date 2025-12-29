/**
 * DryRunSimulator - Validation before execution
 *
 * Runs ProtocolEngine in simulation mode:
 * - Evaluates all guides
 * - Generates ActionPlans (but doesn't register them)
 * - Produces detailed report for validation
 * - Detects potential false positives
 *
 * Run for 24-72h before enabling real execution.
 */

import {
  DryRunReport,
  DryRunGuideResult,
  DryRunConfig,
  FALSE_POSITIVE_PATTERNS,
} from '../../types/dryrun.types';
import { ProtocolTrigger } from '../../types/protocol.types';
import { CanonicalStatus } from '../../types/canonical.types';
import { EventLogService } from '../eventLog/EventLogService';
import { GuideState, EventLog } from '../../types/eventLog.types';

// Import protocols directly (don't use ProtocolEngine to avoid side effects)
import { NoMovement48HProtocol } from './protocols/NoMovement48H';
import { AtOffice3DProtocol } from './protocols/AtOffice3D';
import { Protocol, ProtocolInput } from '../../types/protocol.types';

// =====================================================
// ACTIVE PROTOCOLS FOR SIMULATION
// =====================================================

const SIMULATION_PROTOCOLS: Protocol[] = [
  NoMovement48HProtocol,
  AtOffice3DProtocol,
];

const TERMINAL_STATUSES: Set<CanonicalStatus> = new Set([
  CanonicalStatus.DELIVERED,
  CanonicalStatus.RETURNED,
  CanonicalStatus.CANCELLED,
]);

// =====================================================
// DRY RUN SIMULATOR
// =====================================================

class DryRunSimulatorImpl {
  /**
   * Run full simulation and generate report
   */
  runSimulation(config: DryRunConfig = {}): DryRunReport {
    const startTime = Date.now();
    const now = new Date();

    // Get all guide states
    let guides = EventLogService.getAllGuideStates();

    // Apply filters
    guides = this.applyFilters(guides, config);

    // Apply limit
    if (config.limit && config.limit > 0) {
      guides = guides.slice(0, config.limit);
    }

    // Evaluate each guide
    const details: DryRunGuideResult[] = [];
    const byProtocol: Record<string, { count: number; guides: string[] }> = {};
    const byStatus: Record<string, number> = {};
    const cityCount: Record<string, number> = {};
    const carrierCount: Record<string, number> = {};
    const daysBuckets = {
      '2-3 days': 0,
      '3-5 days': 0,
      '5-7 days': 0,
      '7+ days': 0,
    };

    let totalEvaluated = 0;
    let totalSkipped = 0;
    let totalWouldTrigger = 0;
    const potentialFalsePositives: DryRunGuideResult[] = [];

    for (const state of guides) {
      // Skip terminal statuses
      if (TERMINAL_STATUSES.has(state.currentStatus)) {
        totalSkipped++;
        byStatus[state.currentStatus] = (byStatus[state.currentStatus] || 0) + 1;
        continue;
      }

      // Get last event
      const lastEvent = EventLogService.getEvent(state.lastEventId);
      if (!lastEvent || lastEvent.isOutOfOrder) {
        totalSkipped++;
        continue;
      }

      totalEvaluated++;

      // Build evaluation result
      const result = this.evaluateGuide(state, lastEvent, now);

      // Track status
      byStatus[state.currentStatus] = (byStatus[state.currentStatus] || 0) + 1;

      // Track city and carrier
      cityCount[result.city] = (cityCount[result.city] || 0) + 1;
      carrierCount[result.carrier] = (carrierCount[result.carrier] || 0) + 1;

      // Track time buckets
      if (result.daysSinceMovement >= 2 && result.daysSinceMovement < 3) {
        daysBuckets['2-3 days']++;
      } else if (result.daysSinceMovement >= 3 && result.daysSinceMovement < 5) {
        daysBuckets['3-5 days']++;
      } else if (result.daysSinceMovement >= 5 && result.daysSinceMovement < 7) {
        daysBuckets['5-7 days']++;
      } else if (result.daysSinceMovement >= 7) {
        daysBuckets['7+ days']++;
      }

      // Track protocols
      if (result.matchedProtocols.length > 0) {
        totalWouldTrigger++;

        for (const trigger of result.matchedProtocols) {
          if (!byProtocol[trigger]) {
            byProtocol[trigger] = { count: 0, guides: [] };
          }
          byProtocol[trigger].count++;
          byProtocol[trigger].guides.push(result.guia);
        }
      }

      // Detect false positives
      if (config.analyzeFalsePositives !== false && result.matchedProtocols.length > 0) {
        const fp = this.detectFalsePositive(result);
        if (fp.isFalsePositive) {
          result.potentialFalsePositive = true;
          result.falsePositiveReason = fp.reason;
          potentialFalsePositives.push(result);
        }
      }

      details.push(result);
    }

    // Build top cities
    const topCities = Object.entries(cityCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([city, count]) => ({ city, count }));

    // Build top carriers
    const topCarriers = Object.entries(carrierCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([carrier, count]) => ({ carrier, count }));

    // Build protocol summary with percentages
    const byProtocolWithPercentage: DryRunReport['byProtocol'] = {};
    for (const [trigger, data] of Object.entries(byProtocol)) {
      byProtocolWithPercentage[trigger as ProtocolTrigger] = {
        ...data,
        percentage: totalEvaluated > 0 ? (data.count / totalEvaluated) * 100 : 0,
      };
    }

    // Calculate daily projection (rough estimate)
    const estimatedDailyActions = {
      NO_MOVEMENT_48H: byProtocol['NO_MOVEMENT_48H']?.count || 0,
      AT_OFFICE_3D: byProtocol['AT_OFFICE_3D']?.count || 0,
      total: totalWouldTrigger,
    };

    return {
      runAt: now,
      periodStart: config.since || new Date(0),
      periodEnd: config.until || now,
      durationMs: Date.now() - startTime,

      totalGuides: guides.length,
      totalEvaluated,
      totalSkipped,
      totalWouldTrigger,

      byProtocol: byProtocolWithPercentage,
      byStatus: byStatus as DryRunReport['byStatus'],
      topCities,
      topCarriers,

      potentialFalsePositives,
      falsePositiveRate: totalWouldTrigger > 0
        ? (potentialFalsePositives.length / totalWouldTrigger) * 100
        : 0,

      byDaysSinceMovement: daysBuckets,
      estimatedDailyActions,

      details,
    };
  }

  /**
   * Evaluate a single guide without side effects
   */
  private evaluateGuide(
    state: GuideState,
    event: EventLog,
    now: Date
  ): DryRunGuideResult {
    const hoursSinceMovement = (now.getTime() - state.lastEventAt.getTime()) / (1000 * 60 * 60);
    const daysSinceMovement = hoursSinceMovement / 24;

    // Build protocol input
    const input: ProtocolInput = {
      guia: state.guia,
      canonicalStatus: state.currentStatus,
      exceptionReason: state.currentReason,
      novedad: event.novelty,
      ciudad_de_destino: event.city,
      transportadora: event.carrier,
      fecha_de_ultimo_movimiento: state.lastEventAt,
      ultimo_movimiento: event.lastMovementText,
      fecha_de_generacion_de_guia: event.guideCreatedAt,
      lastEventId: event.id,
    };

    // Evaluate protocols
    const matchedProtocols: ProtocolTrigger[] = [];
    const wouldCreateActions: DryRunGuideResult['wouldCreateActions'] = [];

    for (const protocol of SIMULATION_PROTOCOLS) {
      if (protocol.evaluate(input, now)) {
        matchedProtocols.push(protocol.id);

        const actions = protocol.generateActions(input);
        for (const action of actions) {
          wouldCreateActions.push({
            type: action.type,
            reason: action.reason,
            priority: action.priority,
          });
        }
      }
    }

    return {
      guia: state.guia,
      currentStatus: state.currentStatus,
      city: event.city,
      carrier: event.carrier,
      lastMovementAt: state.lastEventAt,
      daysSinceMovement: Math.round(daysSinceMovement * 10) / 10,
      hoursSinceMovement: Math.round(hoursSinceMovement * 10) / 10,
      matchedProtocols,
      wouldCreateActions,
      potentialFalsePositive: false,
    };
  }

  /**
   * Detect if a guide might be a false positive
   */
  private detectFalsePositive(guide: DryRunGuideResult): {
    isFalsePositive: boolean;
    reason?: string;
  } {
    for (const pattern of FALSE_POSITIVE_PATTERNS) {
      if (pattern.detect(guide)) {
        return {
          isFalsePositive: true,
          reason: pattern.name,
        };
      }
    }

    return { isFalsePositive: false };
  }

  /**
   * Apply filters to guide list
   */
  private applyFilters(guides: GuideState[], config: DryRunConfig): GuideState[] {
    let filtered = guides;

    if (config.since) {
      filtered = filtered.filter(g => g.lastEventAt >= config.since!);
    }

    if (config.until) {
      filtered = filtered.filter(g => g.lastEventAt <= config.until!);
    }

    if (config.statuses && config.statuses.length > 0) {
      const statusSet = new Set(config.statuses);
      filtered = filtered.filter(g => statusSet.has(g.currentStatus));
    }

    // Note: city/carrier filters would require accessing events
    // For now, we filter in the evaluation loop

    return filtered;
  }

  /**
   * Generate human-readable summary
   */
  formatReport(report: DryRunReport): string {
    const lines: string[] = [
      '═══════════════════════════════════════════════════════════════',
      '                    DRY RUN SIMULATION REPORT',
      '═══════════════════════════════════════════════════════════════',
      '',
      `Run at: ${report.runAt.toISOString()}`,
      `Duration: ${report.durationMs}ms`,
      '',
      '── VOLUME SUMMARY ──────────────────────────────────────────────',
      `Total guides:        ${report.totalGuides}`,
      `Evaluated:           ${report.totalEvaluated}`,
      `Skipped (terminal):  ${report.totalSkipped}`,
      `Would trigger:       ${report.totalWouldTrigger} (${((report.totalWouldTrigger / report.totalEvaluated) * 100).toFixed(1)}%)`,
      '',
      '── BY PROTOCOL ─────────────────────────────────────────────────',
    ];

    for (const [trigger, data] of Object.entries(report.byProtocol)) {
      if (data) {
        lines.push(`${trigger}: ${data.count} guides (${data.percentage.toFixed(1)}%)`);
      }
    }

    lines.push('');
    lines.push('── BY DAYS SINCE MOVEMENT ──────────────────────────────────────');
    lines.push(`2-3 days: ${report.byDaysSinceMovement['2-3 days']}`);
    lines.push(`3-5 days: ${report.byDaysSinceMovement['3-5 days']}`);
    lines.push(`5-7 days: ${report.byDaysSinceMovement['5-7 days']}`);
    lines.push(`7+ days:  ${report.byDaysSinceMovement['7+ days']}`);

    lines.push('');
    lines.push('── TOP CITIES ──────────────────────────────────────────────────');
    for (const { city, count } of report.topCities.slice(0, 5)) {
      lines.push(`  ${city}: ${count}`);
    }

    lines.push('');
    lines.push('── TOP CARRIERS ────────────────────────────────────────────────');
    for (const { carrier, count } of report.topCarriers.slice(0, 5)) {
      lines.push(`  ${carrier}: ${count}`);
    }

    lines.push('');
    lines.push('── POTENTIAL FALSE POSITIVES ───────────────────────────────────');
    lines.push(`Count: ${report.potentialFalsePositives.length}`);
    lines.push(`Rate:  ${report.falsePositiveRate.toFixed(1)}%`);

    if (report.potentialFalsePositives.length > 0) {
      lines.push('');
      lines.push('Examples:');
      for (const fp of report.potentialFalsePositives.slice(0, 5)) {
        lines.push(`  - ${fp.guia}: ${fp.falsePositiveReason} (${fp.daysSinceMovement} days)`);
      }
    }

    lines.push('');
    lines.push('── DAILY PROJECTION ────────────────────────────────────────────');
    lines.push(`NO_MOVEMENT_48H: ~${report.estimatedDailyActions.NO_MOVEMENT_48H} messages/day`);
    lines.push(`AT_OFFICE_3D:    ~${report.estimatedDailyActions.AT_OFFICE_3D} messages/day`);
    lines.push(`TOTAL:           ~${report.estimatedDailyActions.total} messages/day`);

    lines.push('');
    lines.push('═══════════════════════════════════════════════════════════════');

    return lines.join('\n');
  }

  /**
   * Export report to JSON
   */
  exportJSON(report: DryRunReport): string {
    return JSON.stringify(report, (key, value) => {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    }, 2);
  }

  /**
   * Quick summary for logging
   */
  quickSummary(report: DryRunReport): string {
    return [
      `DryRun: ${report.totalGuides} guides`,
      `would trigger ${report.totalWouldTrigger}`,
      `(NO_MOVEMENT_48H: ${report.byProtocol['NO_MOVEMENT_48H']?.count || 0}`,
      `AT_OFFICE_3D: ${report.byProtocol['AT_OFFICE_3D']?.count || 0})`,
      `FP rate: ${report.falsePositiveRate.toFixed(1)}%`,
    ].join(' ');
  }
}

// Singleton export
export const DryRunSimulator = new DryRunSimulatorImpl();

export default DryRunSimulator;
