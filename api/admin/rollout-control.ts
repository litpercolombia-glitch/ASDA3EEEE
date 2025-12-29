/**
 * Admin Endpoint: /api/admin/rollout-control
 *
 * POST - Update rollout settings (pause/resume, adjust limits)
 *
 * Allowed actions:
 * - pause: Set EXECUTOR_ENABLED=false
 * - resume: Set EXECUTOR_ENABLED=true
 * - adjustLimits: Update rate limits
 *
 * Protected by ADMIN_SECRET.
 * NO direct WhatsApp sending from this endpoint.
 * All changes are audited.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdminAuth, logAdminAction } from '../../services/auth';

// =====================================================
// TYPES
// =====================================================

interface RolloutControlRequest {
  action: 'pause' | 'resume' | 'adjustLimits';
  limits?: {
    dailySendLimit?: number;
    rateLimitPerMinute?: number;
    rateLimitPerPhoneDay?: number;
  };
  reason?: string;
}

// In-memory state for runtime adjustments
// In production, use a persistent store
const runtimeOverrides: {
  executorPaused: boolean;
  pausedAt?: Date;
  pauseReason?: string;
  limits: {
    dailySendLimit?: number;
    rateLimitPerMinute?: number;
    rateLimitPerPhoneDay?: number;
  };
  lastModifiedAt?: Date;
} = {
  executorPaused: false,
  limits: {},
};

// =====================================================
// PUBLIC API FOR OTHER MODULES
// =====================================================

export function isExecutorPaused(): boolean {
  return runtimeOverrides.executorPaused;
}

export function getRuntimeLimits(): typeof runtimeOverrides.limits {
  return { ...runtimeOverrides.limits };
}

export function getRolloutState(): typeof runtimeOverrides {
  return { ...runtimeOverrides };
}

// =====================================================
// VALIDATION
// =====================================================

function validateRequest(body: any): {
  valid: boolean;
  errors: string[];
  data?: RolloutControlRequest;
} {
  const errors: string[] = [];

  if (!body.action) {
    errors.push('action is required');
  } else if (!['pause', 'resume', 'adjustLimits'].includes(body.action)) {
    errors.push('action must be: pause, resume, or adjustLimits');
  }

  if (body.action === 'adjustLimits') {
    if (!body.limits || typeof body.limits !== 'object') {
      errors.push('limits object required for adjustLimits action');
    } else {
      const { dailySendLimit, rateLimitPerMinute, rateLimitPerPhoneDay } = body.limits;

      if (dailySendLimit !== undefined) {
        if (typeof dailySendLimit !== 'number' || dailySendLimit < 0 || dailySendLimit > 10000) {
          errors.push('dailySendLimit must be 0-10000');
        }
      }

      if (rateLimitPerMinute !== undefined) {
        if (typeof rateLimitPerMinute !== 'number' || rateLimitPerMinute < 1 || rateLimitPerMinute > 100) {
          errors.push('rateLimitPerMinute must be 1-100');
        }
      }

      if (rateLimitPerPhoneDay !== undefined) {
        if (typeof rateLimitPerPhoneDay !== 'number' || rateLimitPerPhoneDay < 1 || rateLimitPerPhoneDay > 10) {
          errors.push('rateLimitPerPhoneDay must be 1-10');
        }
      }
    }
  }

  // Sanitize reason (no PII)
  if (body.reason) {
    const phonePattern = /\+?\d{10,15}|\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/;
    if (phonePattern.test(body.reason)) {
      errors.push('reason must not contain phone numbers');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? body as RolloutControlRequest : undefined,
  };
}

// =====================================================
// HANDLER
// =====================================================

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // GET - Return current state
  if (req.method === 'GET') {
    const auth = requireAdminAuth(req);
    if (!auth.authorized) {
      res.status(401).json({ error: auth.error || 'Unauthorized' });
      return;
    }

    res.status(200).json({
      timestamp: new Date().toISOString(),
      state: getRolloutState(),
      envConfig: {
        EXECUTOR_ENABLED: process.env.EXECUTOR_ENABLED === 'true',
        DAILY_SEND_LIMIT: process.env.DAILY_SEND_LIMIT,
        RATE_LIMIT_PER_MINUTE: process.env.RATE_LIMIT_PER_MINUTE,
      },
    });
    return;
  }

  // POST - Update state
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Validate auth (ADMIN_SECRET)
  const auth = requireAdminAuth(req);
  if (!auth.authorized) {
    res.status(401).json({ error: auth.error || 'Unauthorized' });
    return;
  }

  // Validate request
  const validation = validateRequest(req.body);
  if (!validation.valid) {
    res.status(400).json({
      error: 'Validation failed',
      details: validation.errors,
    });
    return;
  }

  const { action, limits, reason } = validation.data!;
  const now = new Date();

  try {
    switch (action) {
      case 'pause':
        runtimeOverrides.executorPaused = true;
        runtimeOverrides.pausedAt = now;
        runtimeOverrides.pauseReason = reason || 'Manual pause via admin';
        runtimeOverrides.lastModifiedAt = now;

        logAdminAction('EXECUTOR_PAUSED', {
          reason: runtimeOverrides.pauseReason,
        }, req);

        res.status(200).json({
          timestamp: now.toISOString(),
          action: 'pause',
          success: true,
          message: 'Executor paused. No messages will be sent until resumed.',
          state: getRolloutState(),
        });
        break;

      case 'resume':
        const wasPaused = runtimeOverrides.executorPaused;
        runtimeOverrides.executorPaused = false;
        runtimeOverrides.pausedAt = undefined;
        runtimeOverrides.pauseReason = undefined;
        runtimeOverrides.lastModifiedAt = now;

        logAdminAction('EXECUTOR_RESUMED', {
          wasPaused,
          reason: reason || 'Manual resume via admin',
        }, req);

        res.status(200).json({
          timestamp: now.toISOString(),
          action: 'resume',
          success: true,
          message: 'Executor resumed. Messages will be sent on next CRON run.',
          state: getRolloutState(),
        });
        break;

      case 'adjustLimits':
        const oldLimits = { ...runtimeOverrides.limits };

        if (limits?.dailySendLimit !== undefined) {
          runtimeOverrides.limits.dailySendLimit = limits.dailySendLimit;
        }
        if (limits?.rateLimitPerMinute !== undefined) {
          runtimeOverrides.limits.rateLimitPerMinute = limits.rateLimitPerMinute;
        }
        if (limits?.rateLimitPerPhoneDay !== undefined) {
          runtimeOverrides.limits.rateLimitPerPhoneDay = limits.rateLimitPerPhoneDay;
        }

        runtimeOverrides.lastModifiedAt = now;

        logAdminAction('LIMITS_ADJUSTED', {
          oldLimits,
          newLimits: runtimeOverrides.limits,
          reason: reason || 'Manual adjustment via admin',
        }, req);

        res.status(200).json({
          timestamp: now.toISOString(),
          action: 'adjustLimits',
          success: true,
          message: 'Limits updated. Will apply on next CRON run.',
          oldLimits,
          newLimits: runtimeOverrides.limits,
          state: getRolloutState(),
        });
        break;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error';
    console.error('[ROLLOUT-CONTROL] Error:', message);
    res.status(500).json({ error: message });
  }
}
