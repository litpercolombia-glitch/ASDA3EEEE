/**
 * Admin Endpoint: /api/admin/executor-status
 *
 * Returns executor status and recent run history.
 * Protected by CRON_SECRET (same as CRON endpoint).
 *
 * NO PII in responses.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// =====================================================
// SECURITY
// =====================================================

function validateAdminSecret(req: VercelRequest): boolean {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return false;
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return false;
  }

  // Use same CRON_SECRET for admin endpoints
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return false;
  }

  // Constant-time comparison
  if (token.length !== secret.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ secret.charCodeAt(i);
  }

  return result === 0;
}

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

  // Validate secret
  if (!validateAdminSecret(req)) {
    res.status(401).json({ error: 'Unauthorized' });
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
      recentRuns,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error';
    console.error('[ADMIN] Status error:', message);
    res.status(500).json({ error: message });
  }
}
