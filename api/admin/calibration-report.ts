/**
 * Admin Endpoint: /api/admin/calibration-report
 *
 * GET - Get calibration report with outcome metrics and recommendations
 *
 * Query params:
 * - days: Number of days to analyze (default: 7, max: 30)
 *
 * Returns:
 * - Daily reports with movedWithin24h%, movedWithin48h%
 * - Worst performing cities/carriers
 * - AI-free recommendations based on data
 *
 * Protected by ADMIN_SECRET.
 * NO mutations - read-only endpoint.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdminAuth } from '../../services/auth';
import { CalibrationReportService } from '../../services/calibration/CalibrationReportService';
import { CalibrationRules } from '../../services/calibration/CalibrationRules';
import { OutcomeService } from '../../services/outcome/OutcomeService';

// =====================================================
// HANDLER
// =====================================================

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Only GET allowed
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed. Use GET.' });
    return;
  }

  // Validate auth (ADMIN_SECRET)
  const auth = requireAdminAuth(req);
  if (!auth.authorized) {
    res.status(401).json({ error: auth.error || 'Unauthorized' });
    return;
  }

  // Parse query params
  const daysParam = req.query.days;
  let days = 7;

  if (daysParam) {
    const parsed = parseInt(String(daysParam), 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 30) {
      days = parsed;
    }
  }

  try {
    // First, update pending outcomes
    const outcomeUpdate = OutcomeService.updateOutcomes();

    // Generate the full report
    const report = CalibrationReportService.generateReport(days);

    // Get calibration status
    const calibrationStatus = CalibrationRules.getStatus();

    // Get recent calibration history
    const history = CalibrationRules.getHistory().slice(-10);

    // Add cache header (read-only, 60s cache is fine)
    res.setHeader('Cache-Control', 'private, max-age=60');

    res.status(200).json({
      timestamp: new Date().toISOString(),
      requestedDays: days,

      // Summary section
      summary: {
        periodStart: report.periodStart.toISOString(),
        periodEnd: report.periodEnd.toISOString(),
        totalSent: report.aggregated.totalSent,
        successRate: report.aggregated.successRate,
        movedWithin24hRate: report.aggregated.movedWithin24hRate,
        movedWithin48hRate: report.aggregated.movedWithin48hRate,
        ticketCreatedRate: report.aggregated.ticketCreatedRate,
        outcomesUpdated: outcomeUpdate.updated,
        outcomesFinalized: outcomeUpdate.finalized,
      },

      // Detailed daily reports
      dailyReports: report.dailyReports.map(r => ({
        date: r.date,
        overall: r.overall,
        worstCities: r.worstCities,
        worstCarriers: r.worstCarriers,
      })),

      // By trigger breakdown
      byTrigger: report.dailyReports.length > 0
        ? report.dailyReports[report.dailyReports.length - 1].byTrigger
        : {},

      // Recommendations (the key value-add)
      recommendations: report.recommendations.map(r => ({
        type: r.type,
        confidence: r.confidence,
        target: r.target,
        reason: r.reason,
        currentValue: r.currentValue,
        suggestedValue: r.suggestedValue,
        evidence: {
          sampleSize: r.evidence.sampleSize,
          currentRate: `${r.evidence.currentRate}%`,
          threshold: `${r.evidence.threshold}%`,
        },
        autoApply: r.autoApply,
      })),

      // Calibration system status
      calibration: {
        lastCalibrationAt: calibrationStatus.lastCalibrationAt?.toISOString(),
        changesLast24h: calibrationStatus.changesLast24h,
        pendingSuggestions: calibrationStatus.pendingSuggestions,
        cooldownActive: calibrationStatus.cooldownActive,
        cooldownRemaining: calibrationStatus.cooldownRemaining
          ? `${calibrationStatus.cooldownRemaining}h`
          : undefined,
        recentHistory: history.map(h => ({
          timestamp: h.timestamp.toISOString(),
          type: h.type,
          target: h.target,
          reason: h.reason,
        })),
      },

      // Quick stats
      outcomeStats: OutcomeService.getStats(),
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error';
    console.error('[CALIBRATION-REPORT] Error:', message);
    res.status(500).json({ error: message });
  }
}
