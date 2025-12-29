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

/**
 * Validate CRON request authentication
 *
 * Supports multiple auth methods:
 * 1. x-vercel-cron header (Vercel Cron native) - matches CRON_SECRET
 * 2. Authorization: Bearer <CRON_SECRET> (manual calls)
 *
 * Vercel Cron sends x-vercel-cron header automatically.
 * For security, we validate it matches our CRON_SECRET.
 */
function validateCronAuth(req: VercelRequest): { valid: boolean; method: string } {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[CRON] CRON_SECRET not configured');
    return { valid: false, method: 'none' };
  }

  // Method 1: Vercel Cron header
  // Vercel sends this header automatically for cron jobs
  const vercelCronHeader = req.headers['x-vercel-cron'];
  if (vercelCronHeader) {
    // Validate the header value matches our secret
    // This prevents unauthorized calls with fake x-vercel-cron headers
    const isValid = constantTimeCompare(String(vercelCronHeader), cronSecret);
    if (isValid) {
      return { valid: true, method: 'x-vercel-cron' };
    }
    // If header exists but doesn't match, still check Bearer token
  }

  // Method 2: Authorization Bearer token (for manual/testing)
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const [scheme, token] = authHeader.split(' ');
    if (scheme === 'Bearer' && token) {
      const isValid = constantTimeCompare(token, cronSecret);
      if (isValid) {
        return { valid: true, method: 'bearer' };
      }
    }
  }

  return { valid: false, method: 'invalid' };
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
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
  const { createJITPhoneLookup } = await import('../../services/executor/PhoneResolver');

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
    // Set up JIT phone lookup (serverless-safe, fetches from DB)
    ActionExecutor.setPhoneLookup(createJITPhoneLookup());

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

    return summary;
  } catch (error) {
    const finishedAt = new Date();
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Sanitize error message (remove any PII)
    const sanitizedError = errorMessage
      .replace(/\+?\d{10,15}/g, '[PHONE_REDACTED]')
      .replace(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g, '[PHONE_REDACTED]');

    ExecutorRunLog.log(runId, 'ERROR', `Executor run failed: ${sanitizedError}`);

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
// SINGLE-RUN LOCK
// =====================================================

/**
 * Simple in-memory lock for preventing concurrent runs.
 * In serverless, this only prevents concurrent runs within the same instance.
 * For true distributed locking, use Redis/KV storage.
 */
let currentRunId: string | null = null;
let runStartedAt: Date | null = null;
const MAX_RUN_DURATION_MS = 5 * 60 * 1000; // 5 minutes max

function acquireLock(runId: string): boolean {
  const now = Date.now();

  // Check if there's an active lock
  if (currentRunId && runStartedAt) {
    const elapsed = now - runStartedAt.getTime();

    // If lock is stale (exceeded max duration), release it
    if (elapsed > MAX_RUN_DURATION_MS) {
      console.warn(`[CRON] Stale lock detected, releasing: ${currentRunId}`);
      releaseLock();
    } else {
      // Lock is still valid, reject
      return false;
    }
  }

  // Acquire lock
  currentRunId = runId;
  runStartedAt = new Date();
  return true;
}

function releaseLock(): void {
  currentRunId = null;
  runStartedAt = null;
}

function getCurrentLock(): { runId: string; startedAt: Date } | null {
  if (currentRunId && runStartedAt) {
    return { runId: currentRunId, startedAt: runStartedAt };
  }
  return null;
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

  // Validate authentication
  const auth = validateCronAuth(req);
  if (!auth.valid) {
    console.warn(`[CRON] Unauthorized request (method: ${auth.method})`);
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // Generate run ID early for lock
  const { ExecutorRunLog } = await import('../../services/executor/ExecutorRunLog');
  const runId = ExecutorRunLog.generateRunId();

  // Try to acquire lock
  if (!acquireLock(runId)) {
    const activeLock = getCurrentLock();
    console.warn(`[CRON] Run already in progress: ${activeLock?.runId}`);

    ExecutorRunLog.log(runId, 'WARN', 'Run rejected: another run in progress', {
      activeRunId: activeLock?.runId,
      activeRunStartedAt: activeLock?.startedAt?.toISOString(),
    });

    res.status(409).json({
      error: 'Conflict',
      message: 'Another run is in progress',
      activeRunId: activeLock?.runId,
      activeRunStartedAt: activeLock?.startedAt?.toISOString(),
    });
    return;
  }

  try {
    const result = await runExecutor();

    res.status(200).json({
      ...result,
      authMethod: auth.method, // For debugging
    });
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
  } finally {
    // Always release lock
    releaseLock();
  }
}
