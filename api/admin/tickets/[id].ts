/**
 * Admin Endpoint: /api/admin/tickets/:id
 *
 * GET - Get ticket by ID
 * PATCH - Update ticket (status, priority, resolution notes)
 *
 * Protected by ADMIN_SECRET.
 * NO PII in responses.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdminAuth, logAdminAction } from '../../../services/auth';

// =====================================================
// VALIDATION
// =====================================================

const VALID_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const VALID_PRIORITIES = ['alta', 'media'];

function validateUpdateBody(body: any): {
  valid: boolean;
  errors: string[];
  data?: {
    status?: string;
    priority?: string;
    resolutionNotes?: string;
  };
} {
  const errors: string[] = [];
  const data: any = {};

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      errors.push(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    } else {
      data.status = body.status;
    }
  }

  if (body.priority !== undefined) {
    if (!VALID_PRIORITIES.includes(body.priority)) {
      errors.push(`Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`);
    } else {
      data.priority = body.priority;
    }
  }

  if (body.resolutionNotes !== undefined) {
    if (typeof body.resolutionNotes !== 'string') {
      errors.push('resolutionNotes must be a string');
    } else if (body.resolutionNotes.length > 2000) {
      errors.push('resolutionNotes must be <= 2000 characters');
    } else {
      data.resolutionNotes = body.resolutionNotes;
    }
  }

  // Check for PII in resolution notes
  if (data.resolutionNotes) {
    const phonePattern = /\+?\d{10,15}|\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/;
    if (phonePattern.test(data.resolutionNotes)) {
      errors.push('resolutionNotes must not contain phone numbers');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? data : undefined,
  };
}

// =====================================================
// HANDLER
// =====================================================

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Validate auth (ADMIN_SECRET)
  const auth = requireAdminAuth(req);
  if (!auth.authorized) {
    res.status(401).json({ error: auth.error || 'Unauthorized' });
    return;
  }

  // Get ticket ID from path
  const { id } = req.query;
  const ticketId = Array.isArray(id) ? id[0] : id;

  if (!ticketId) {
    res.status(400).json({ error: 'Ticket ID required' });
    return;
  }

  try {
    const { TicketService } = await import('../../../services/tickets/TicketService');

    // GET - Retrieve ticket
    if (req.method === 'GET') {
      const ticket = TicketService.getTicket(ticketId);

      if (!ticket) {
        res.status(404).json({ error: 'Ticket not found' });
        return;
      }

      res.status(200).json({
        timestamp: new Date().toISOString(),
        ticket: TicketService.formatForApi(ticket),
      });
      return;
    }

    // PATCH - Update ticket
    if (req.method === 'PATCH') {
      const ticket = TicketService.getTicket(ticketId);

      if (!ticket) {
        res.status(404).json({ error: 'Ticket not found' });
        return;
      }

      // Validate body
      const validation = validateUpdateBody(req.body);

      if (!validation.valid) {
        res.status(400).json({
          error: 'Validation failed',
          details: validation.errors,
        });
        return;
      }

      // Check for invalid state transitions
      if (validation.data?.status) {
        const currentStatus = ticket.status;
        const newStatus = validation.data.status;

        // Can't reopen CLOSED tickets
        if (currentStatus === 'CLOSED' && newStatus !== 'CLOSED') {
          res.status(400).json({
            error: 'Cannot reopen a CLOSED ticket',
          });
          return;
        }

        // Can't go backwards (RESOLVED -> OPEN)
        const statusOrder = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
        const currentIndex = statusOrder.indexOf(currentStatus);
        const newIndex = statusOrder.indexOf(newStatus);

        if (newIndex < currentIndex && newStatus !== 'IN_PROGRESS') {
          // Allow RESOLVED -> IN_PROGRESS (reopen for more work)
          if (!(currentStatus === 'RESOLVED' && newStatus === 'IN_PROGRESS')) {
            res.status(400).json({
              error: `Invalid status transition: ${currentStatus} -> ${newStatus}`,
            });
            return;
          }
        }
      }

      // Update ticket
      const updated = TicketService.updateTicket(ticketId, {
        status: validation.data?.status as any,
        priority: validation.data?.priority as any,
        resolutionNotes: validation.data?.resolutionNotes,
        addTimelineEntry: {
          action: 'ADMIN_UPDATE',
          actor: 'user',
          details: {
            updates: Object.keys(validation.data || {}),
          },
        },
      });

      if (!updated) {
        res.status(500).json({ error: 'Failed to update ticket' });
        return;
      }

      res.status(200).json({
        timestamp: new Date().toISOString(),
        message: 'Ticket updated',
        ticket: TicketService.formatForApi(updated),
      });
      return;
    }

    // Method not allowed
    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error';
    console.error('[ADMIN] Ticket error:', message);
    res.status(500).json({ error: message });
  }
}
