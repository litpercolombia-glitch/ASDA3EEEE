/**
 * CRON Endpoint: /api/cron/run-executor
 *
 * Executes pending ActionPlans via ActionExecutor.
 * Protected by CRON_SECRET header validation.
 *
 * Security:
 * - Requires: Authorization: Bearer ${CRON_SECRET}
 * - Returns 401 if missing/invalid
 * - NEVER logs PII (phones)
 *
 * Response:
 * {
 *   runId, planned, wouldSend, sent, success,
 *   failed4xx, failed5xx, skippedDuplicate, skippedRateLimit,
 *   durationMs, status
 * }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// =====================================================
// SECURITY
// =====================================================

function validateCronSecret(req: VercelRequest): boolean {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return false;
  }

  // Expected format: "Bearer <CRON_SECRET>"
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return false;
  }

  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[CRON] CRON_SECRET not configured');
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  if (token.length !== cronSecret.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ cronSecret.charCodeAt(i);
  }

  return result === 0;
}

// =====================================================
// EXECUTOR RUNNER
// =====================================================

interface RunResult {
  runId: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  planned: number;
  wouldSend: number;
  sent: number;
  success: number;
  failed4xx: number;
  failed5xx: number;
  skippedDuplicate: number;
  skippedRateLimit: number;
  skippedDisabled: number;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  message?: string;
  config: {
    executorEnabled: boolean;
    pilotCity?: string;
    pilotCarrier?: string;
    dailySendLimit: number;
    rateLimitPerMinute: number;
  };
}

async function runExecutor(): Promise<RunResult> {
  // Dynamic imports to avoid issues with Vercel bundling
  const { ActionExecutor } = await import('../../services/executor/ActionExecutor');
  const { ExecutorRunLog } = await import('../../services/executor/ExecutorRunLog');
  const { ActionLogService } = await import('../../services/eventLog/ActionLogService');
  const { PIIVault, createPhoneLookup } = await import('../../services/executor/PIIVault');

  const runId = ExecutorRunLog.generateRunId();
  const startedAt = new Date();

  // Load config from environment
  const config = {
    executorEnabled: process.env.EXECUTOR_ENABLED === 'true',
    pilotCity: process.env.PILOT_CITY || undefined,
    pilotCarrier: process.env.PILOT_CARRIER || undefined,
    dailySendLimit: parseInt(process.env.DAILY_SEND_LIMIT || '100', 10),
    rateLimitPerMinute: parseInt(process.env.RATE_LIMIT_PER_MINUTE || '20', 10),
  };

  ExecutorRunLog.log(runId, 'INFO', 'Starting executor run', { config });

  try {
    // Set up phone lookup from PIIVault
    ActionExecutor.setPhoneLookup(createPhoneLookup());

    // Get planned actions count
    const plannedActions = ActionLogService.getPlannedActions();
    const planned = plannedActions.length;

    ExecutorRunLog.log(runId, 'INFO', `Found ${planned} planned actions`);

    if (planned === 0) {
      const finishedAt = new Date();
      const summary = {
        runId,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        planned: 0,
        wouldSend: 0,
        sent: 0,
        success: 0,
        failed4xx: 0,
        failed5xx: 0,
        skippedDuplicate: 0,
        skippedRateLimit: 0,
        skippedDisabled: 0,
        status: 'SUCCESS' as const,
        message: 'No planned actions to process',
        config,
      };

      return summary;
    }

    // Execute planned actions
    const result = await ActionExecutor.executePlanned({
      dryRun: !config.executorEnabled, // If disabled, run in dry mode
    });

    const finishedAt = new Date();

    // Count error types
    let failed4xx = 0;
    let failed5xx = 0;

    for (const r of result.results) {
      if (r.failureReason === 'API_ERROR_4XX') failed4xx++;
      if (r.failureReason === 'API_ERROR_5XX') failed5xx++;
    }

    // Determine status
    let status: 'SUCCESS' | 'PARTIAL' | 'FAILED' = 'SUCCESS';
    if (result.failed > 0 && result.success === 0) {
      status = 'FAILED';
    } else if (result.failed > 0) {
      status = 'PARTIAL';
    }

    // Build summary
    const summary: RunResult = {
      runId,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: result.durationMs,
      planned,
      wouldSend: result.wouldSend,
      sent: config.executorEnabled ? result.success : 0,
      success: result.success,
      failed4xx,
      failed5xx,
      skippedDuplicate: result.skippedDuplicate,
      skippedRateLimit: result.skippedRateLimit,
      skippedDisabled: result.skippedDisabled,
      status,
      config,
    };

    // Record run
    ExecutorRunLog.recordRun({
      ...summary,
      startedAt,
      finishedAt,
      errorSummary: [
        { type: 'API_ERROR_4XX', count: failed4xx },
        { type: 'API_ERROR_5XX', count: failed5xx },
      ].filter(e => e.count > 0),
    });

    ExecutorRunLog.log(runId, 'INFO', 'Executor run completed', {
      success: result.success,
      failed: result.failed,
      skipped: result.skippedDuplicate + result.skippedRateLimit,
    });

    // Clear PIIVault after execution
    PIIVault.clear();

    return summary;
  } catch (error) {
    const finishedAt = new Date();
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Sanitize error message (remove any PII)
    const sanitizedError = errorMessage
      .replace(/\+?\d{10,15}/g, '[PHONE_REDACTED]')
      .replace(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g, '[PHONE_REDACTED]');

    ExecutorRunLog.log(runId, 'ERROR', `Executor run failed: ${sanitizedError}`);

    // Clear PIIVault on error too
    PIIVault.clear();

    return {
      runId,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      planned: 0,
      wouldSend: 0,
      sent: 0,
      success: 0,
      failed4xx: 0,
      failed5xx: 0,
      skippedDuplicate: 0,
      skippedRateLimit: 0,
      skippedDisabled: 0,
      status: 'FAILED',
      message: sanitizedError,
      config,
    };
  }
}

// =====================================================
// HANDLER
// =====================================================

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Only allow POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Validate CRON_SECRET
  if (!validateCronSecret(req)) {
    console.warn('[CRON] Unauthorized request to run-executor');
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const result = await runExecutor();

    res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error';

    // Sanitize any PII from error
    const sanitized = message
      .replace(/\+?\d{10,15}/g, '[REDACTED]')
      .replace(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g, '[REDACTED]');

    console.error('[CRON] Executor error:', sanitized);

    res.status(500).json({
      error: 'Internal error',
      message: sanitized,
    });
  }
}
