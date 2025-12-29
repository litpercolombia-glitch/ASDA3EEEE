/**
 * Admin Endpoint: /api/admin/executor-status
 *
 * Returns executor status and recent run history.
 * Protected by ADMIN_SECRET.
 *
 * NO PII in responses.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdminAuth } from '../../services/auth';

// =====================================================
// HANDLER
// =====================================================

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Only allow GET
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Validate auth (ADMIN_SECRET)
  const auth = requireAdminAuth(req);
  if (!auth.authorized) {
    res.status(401).json({ error: auth.error || 'Unauthorized' });
    return;
  }

  try {
    // Dynamic imports
    const { ExecutorRunLog } = await import('../../services/executor/ExecutorRunLog');
    const { ActionLogService } = await import('../../services/eventLog/ActionLogService');
    const { RateLimiter } = await import('../../services/executor/RateLimiter');
    const { PIIVault } = await import('../../services/executor/PIIVault');

    // Get current config
    const config = {
      executorEnabled: process.env.EXECUTOR_ENABLED === 'true',
      pilotCity: process.env.PILOT_CITY || null,
      pilotCarrier: process.env.PILOT_CARRIER || null,
      dailySendLimit: parseInt(process.env.DAILY_SEND_LIMIT || '100', 10),
      rateLimitPerMinute: parseInt(process.env.RATE_LIMIT_PER_MINUTE || '20', 10),
      rateLimitPerPhoneDay: parseInt(process.env.RATE_LIMIT_PER_PHONE_DAY || '2', 10),
    };

    // Get stats
    const runStats = ExecutorRunLog.getStats();
    const actionStats = ActionLogService.getStats();
    const rateLimiterStats = RateLimiter.getStats();
    const vaultStats = PIIVault.getStats();

    // Get 24h detailed metrics (P0-4)
    const metrics24h = ExecutorRunLog.get24hMetrics();

    // Get today's summary
    const todaySummary = ExecutorRunLog.generateDailySummary(new Date());

    // Get yesterday for comparison
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdaySummary = ExecutorRunLog.generateDailySummary(yesterday);

    // Get recent runs
    const recentRuns = ExecutorRunLog.getAllRuns(10).map(run =>
      ExecutorRunLog.formatRunForApi(run)
    );

    // Get last run
    const lastRun = ExecutorRunLog.getLastRun();

    res.status(200).json({
      timestamp: new Date().toISOString(),
      config,
      status: {
        executorReady: true,
        lastRunAt: lastRun?.finishedAt?.toISOString() || null,
        lastRunStatus: lastRun?.status || null,
      },
      stats: {
        runs: runStats,
        actions: {
          total: actionStats.total,
          planned: actionStats.byStatus.PLANNED || 0,
          success: actionStats.byStatus.SUCCESS || 0,
          failed: actionStats.byStatus.FAILED || 0,
          skippedRateLimit: actionStats.byStatus.SKIPPED_RATE_LIMIT || 0,
        },
        rateLimiter: rateLimiterStats,
        vault: {
          entriesInMemory: vaultStats.entryCount,
          ttlMs: vaultStats.ttlMs,
        },
      },
      // P0-4: 24h metrics
      metrics24h,
      // P0-4: Daily summaries for comparison
      dailySummary: {
        today: todaySummary,
        yesterday: yesterdaySummary,
        delta: {
          runs: todaySummary.runs - yesterdaySummary.runs,
          sent: todaySummary.totalSent - yesterdaySummary.totalSent,
          success: todaySummary.totalSuccess - yesterdaySummary.totalSuccess,
          failed: todaySummary.totalFailed - yesterdaySummary.totalFailed,
          successRateDelta: Math.round((todaySummary.successRate - yesterdaySummary.successRate) * 100) / 100,
        },
      },
      recentRuns,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error';
    console.error('[ADMIN] Status error:', message);
    res.status(500).json({ error: message });
  }
}
