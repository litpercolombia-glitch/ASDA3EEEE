/**
 * Admin Endpoint: /api/admin/rollout-config
 *
 * Returns current rollout configuration and phase.
 * Protected by CRON_SECRET.
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
    const { RolloutConfig } = await import('../../services/config/RolloutConfig');

    // Get config
    const configResponse = RolloutConfig.toApiResponse();

    // Validate config
    const validation = RolloutConfig.validate();

    // Check if can send
    const sendStatus = RolloutConfig.canSend();

    res.status(200).json({
      timestamp: new Date().toISOString(),
      ...configResponse,
      validation,
      sendStatus,
      env: {
        // Show which env vars are set (not their values)
        EXECUTOR_ENABLED: !!process.env.EXECUTOR_ENABLED,
        PILOT_CITY: !!process.env.PILOT_CITY,
        PILOT_CARRIER: !!process.env.PILOT_CARRIER,
        DAILY_SEND_LIMIT: !!process.env.DAILY_SEND_LIMIT,
        RATE_LIMIT_PER_MINUTE: !!process.env.RATE_LIMIT_PER_MINUTE,
        CRON_SECRET: !!process.env.CRON_SECRET,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error';
    console.error('[ADMIN] Rollout config error:', message);
    res.status(500).json({ error: message });
  }
}
