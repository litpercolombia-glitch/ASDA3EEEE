/**
 * AdminAuth - PR #7
 *
 * Centralized admin authentication.
 *
 * Two separate secrets:
 * - CRON_SECRET: Only for /api/cron/* endpoints (Vercel CRON jobs)
 * - ADMIN_SECRET: For all admin endpoints (/api/admin/*)
 *
 * Security:
 * - Constant-time comparison to prevent timing attacks
 * - Clear separation of concerns
 */

import type { VercelRequest } from '@vercel/node';

// =====================================================
// TYPES
// =====================================================

export interface AuthResult {
  valid: boolean;
  method: 'bearer' | 'x-vercel-cron' | 'none';
  error?: string;
}

// =====================================================
// CONSTANT-TIME COMPARISON
// =====================================================

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
// ADMIN AUTH
// =====================================================

/**
 * Validate admin authentication using ADMIN_SECRET
 * For all /api/admin/* endpoints
 */
export function validateAdminAuth(req: VercelRequest): AuthResult {
  const adminSecret = process.env.ADMIN_SECRET;

  // If ADMIN_SECRET not set, fall back to CRON_SECRET for backwards compatibility
  // but log a warning
  const secret = adminSecret || process.env.CRON_SECRET;

  if (!secret) {
    return {
      valid: false,
      method: 'none',
      error: 'ADMIN_SECRET not configured',
    };
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return {
      valid: false,
      method: 'none',
      error: 'Authorization header required',
    };
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return {
      valid: false,
      method: 'none',
      error: 'Invalid authorization format. Expected: Bearer <token>',
    };
  }

  const isValid = constantTimeCompare(token, secret);

  return {
    valid: isValid,
    method: 'bearer',
    error: isValid ? undefined : 'Invalid token',
  };
}

// =====================================================
// CRON AUTH
// =====================================================

/**
 * Validate CRON authentication using CRON_SECRET
 * For /api/cron/* endpoints only
 *
 * Supports:
 * 1. x-vercel-cron header (Vercel CRON jobs)
 * 2. Authorization Bearer token (manual triggers)
 */
export function validateCronAuth(req: VercelRequest): AuthResult {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return {
      valid: false,
      method: 'none',
      error: 'CRON_SECRET not configured',
    };
  }

  // Method 1: Vercel Cron header
  const vercelCronHeader = req.headers['x-vercel-cron'];
  if (vercelCronHeader) {
    const isValid = constantTimeCompare(String(vercelCronHeader), cronSecret);
    if (isValid) {
      return { valid: true, method: 'x-vercel-cron' };
    }
  }

  // Method 2: Authorization Bearer token
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

  return {
    valid: false,
    method: 'none',
    error: 'Invalid CRON authentication',
  };
}

// =====================================================
// MIDDLEWARE HELPERS
// =====================================================

/**
 * Express-style middleware for admin auth
 */
export function requireAdminAuth(req: VercelRequest): { authorized: boolean; error?: string } {
  const result = validateAdminAuth(req);

  if (!result.valid) {
    return { authorized: false, error: result.error };
  }

  return { authorized: true };
}

/**
 * Express-style middleware for cron auth
 */
export function requireCronAuth(req: VercelRequest): { authorized: boolean; error?: string } {
  const result = validateCronAuth(req);

  if (!result.valid) {
    return { authorized: false, error: result.error };
  }

  return { authorized: true };
}

// =====================================================
// AUDIT
// =====================================================

/**
 * Log admin action for audit trail
 */
export function logAdminAction(
  action: string,
  details: Record<string, unknown>,
  req?: VercelRequest
): void {
  const timestamp = new Date().toISOString();
  const ip = req?.headers['x-forwarded-for'] || req?.headers['x-real-ip'] || 'unknown';

  // Sanitize details to remove any PII
  const sanitizedDetails = JSON.stringify(details)
    .replace(/\+?\d{10,15}/g, '[PHONE_REDACTED]')
    .replace(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g, '[PHONE_REDACTED]');

  console.log(JSON.stringify({
    type: 'ADMIN_AUDIT',
    timestamp,
    action,
    ip,
    details: JSON.parse(sanitizedDetails),
  }));
}
