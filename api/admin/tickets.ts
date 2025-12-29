/**
 * Admin Endpoint: /api/admin/tickets
 *
 * GET - List tickets with filters
 * Query params:
 *   - status: OPEN | IN_PROGRESS | RESOLVED | CLOSED
 *   - trigger: FAILED_4XX | FAILED_5XX_RETRIES | NO_MOVEMENT_AFTER_CONTACT | AT_OFFICE_STILL
 *   - priority: alta | media
 *   - limit: number (default 50)
 *   - offset: number (default 0)
 *
 * Protected by CRON_SECRET (same as other admin endpoints).
 * NO PII in responses.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// =====================================================
// SECURITY
// =====================================================

function validateAdminAuth(req: VercelRequest): boolean {
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

  // Validate auth
  if (!validateAdminAuth(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const { TicketService } = await import('../../services/tickets/TicketService');

    // Parse query params
    const {
      status,
      trigger,
      priority,
      limit = '50',
      offset = '0',
    } = req.query;

    // Build query
    const query: {
      status?: string | string[];
      trigger?: string | string[];
      priority?: string;
      limit: number;
      offset: number;
    } = {
      limit: Math.min(parseInt(limit as string, 10) || 50, 100),
      offset: parseInt(offset as string, 10) || 0,
    };

    if (status) {
      query.status = status as string | string[];
    }

    if (trigger) {
      query.trigger = trigger as string | string[];
    }

    if (priority) {
      query.priority = priority as string;
    }

    // Get tickets
    const tickets = TicketService.queryTickets(query as any);
    const stats = TicketService.getStats();

    res.status(200).json({
      timestamp: new Date().toISOString(),
      query: {
        status: query.status,
        trigger: query.trigger,
        priority: query.priority,
        limit: query.limit,
        offset: query.offset,
      },
      stats: {
        total: stats.total,
        openCount: stats.openCount,
        byStatus: stats.byStatus,
        byTrigger: stats.byTrigger,
        byPriority: stats.byPriority,
        avgResolutionTimeMs: stats.avgResolutionTimeMs,
      },
      count: tickets.length,
      tickets: tickets.map(t => TicketService.formatForApi(t)),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error';
    console.error('[ADMIN] Tickets list error:', message);
    res.status(500).json({ error: message });
  }
}
