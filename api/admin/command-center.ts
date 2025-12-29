/**
 * Command Center - PR #7
 *
 * Single Pane of Glass for operations team.
 * Aggregates all critical data in one endpoint.
 *
 * Sections:
 * A) Urgent Queue (HIGH risk)
 * B) Open Tickets
 * C) Actions Feed
 * D) Executor Health (24h)
 *
 * Protected by ADMIN_SECRET.
 * NO PII in responses.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdminAuth } from '../../services/auth';

// =====================================================
// TYPES
// =====================================================

interface CommandCenterResponse {
  timestamp: string;
  sections: {
    urgentQueue: UrgentQueueSection;
    tickets: TicketsSection;
    actionsFeed: ActionsFeedSection;
    executorHealth: ExecutorHealthSection;
  };
  config: {
    executorEnabled: boolean;
    pilotCity: string | null;
    pilotCarrier: string | null;
    phase: string;
  };
}

interface UrgentQueueSection {
  count: number;
  items: Array<{
    guia: string;
    score: number;
    reasons: string[];
    estatus: string;
    ciudad_de_destino?: string;
    transportadora?: string;
    hoursSinceLastMovement?: number;
  }>;
}

interface TicketsSection {
  openCount: number;
  inProgressCount: number;
  items: Array<{
    ticketId: string;
    guia: string;
    trigger: string;
    priority: string;
    status: string;
    createdAt: string;
    riskScore?: number;
  }>;
}

interface ActionsFeedSection {
  planned: number;
  running: number;
  recentFailed: number;
  recentSuccess: number;
  items: Array<{
    id: string;
    guia: string;
    actionType: string;
    status: string;
    trigger?: string;
    ciudad?: string;
    transportadora?: string;
    createdAt: string;
  }>;
}

interface ExecutorHealthSection {
  lastRunAt: string | null;
  lastRunStatus: string | null;
  last24h: {
    runs: number;
    sent: number;
    success: number;
    failed4xx: number;
    failed5xx: number;
    skippedDuplicate: number;
    skippedRateLimit: number;
    successRate: number;
  };
  dailyComparison: {
    todaySent: number;
    yesterdaySent: number;
    delta: number;
  };
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

  // Validate auth (ADMIN_SECRET)
  const auth = requireAdminAuth(req);
  if (!auth.authorized) {
    res.status(401).json({ error: auth.error || 'Unauthorized' });
    return;
  }

  try {
    // Parse query params for filters
    const {
      ciudad,
      transportadora,
      limit = '20',
    } = req.query;

    const maxLimit = Math.min(parseInt(limit as string, 10) || 20, 50);

    // Dynamic imports
    const { RiskScoringService } = await import('../../services/scoring/RiskScoringService');
    const { RiskFlags } = await import('../../services/config/RiskFlags');
    const { TicketService } = await import('../../services/tickets/TicketService');
    const { ActionLogService } = await import('../../services/eventLog/ActionLogService');
    const { ExecutorRunLog } = await import('../../services/executor/ExecutorRunLog');
    const { RolloutConfig } = await import('../../services/config/RolloutConfig');

    // =========================================
    // A) URGENT QUEUE (HIGH risk)
    // =========================================
    const urgentQueue = await buildUrgentQueue(
      RiskScoringService,
      maxLimit,
      ciudad as string | undefined,
      transportadora as string | undefined
    );

    // =========================================
    // B) TICKETS (OPEN, sorted by priority)
    // =========================================
    const ticketsSection = buildTicketsSection(TicketService, maxLimit);

    // =========================================
    // C) ACTIONS FEED
    // =========================================
    const actionsFeed = buildActionsFeed(
      ActionLogService,
      maxLimit,
      ciudad as string | undefined,
      transportadora as string | undefined
    );

    // =========================================
    // D) EXECUTOR HEALTH
    // =========================================
    const executorHealth = buildExecutorHealth(ExecutorRunLog);

    // =========================================
    // CONFIG
    // =========================================
    const rolloutConfig = RolloutConfig.get();

    const response: CommandCenterResponse = {
      timestamp: new Date().toISOString(),
      sections: {
        urgentQueue,
        tickets: ticketsSection,
        actionsFeed,
        executorHealth,
      },
      config: {
        executorEnabled: rolloutConfig.executorEnabled,
        pilotCity: rolloutConfig.pilotCity,
        pilotCarrier: rolloutConfig.pilotCarrier,
        phase: RolloutConfig.getCurrentPhase(),
      },
    };

    // Cache headers for performance (30 seconds)
    res.setHeader('Cache-Control', 'private, max-age=30');
    res.status(200).json(response);

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error';
    console.error('[COMMAND-CENTER] Error:', message);
    res.status(500).json({ error: message });
  }
}

// =====================================================
// SECTION BUILDERS
// =====================================================

async function buildUrgentQueue(
  RiskScoringService: any,
  limit: number,
  filterCiudad?: string,
  filterTransportadora?: string
): Promise<UrgentQueueSection> {
  // In production, get from actual data source
  // For now, return empty - needs integration with GuideState/DB
  const items: UrgentQueueSection['items'] = [];

  return {
    count: items.length,
    items: items.slice(0, limit),
  };
}

function buildTicketsSection(
  TicketService: any,
  limit: number
): TicketsSection {
  const openTickets = TicketService.queryTickets({ status: 'OPEN', limit });
  const inProgressTickets = TicketService.queryTickets({ status: 'IN_PROGRESS', limit: 100 });
  const stats = TicketService.getStats();

  const items = openTickets.map((t: any) => ({
    ticketId: t.ticketId,
    guia: t.guia,
    trigger: t.trigger,
    priority: t.priority,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
  }));

  return {
    openCount: stats.byStatus.OPEN || 0,
    inProgressCount: stats.byStatus.IN_PROGRESS || 0,
    items,
  };
}

function buildActionsFeed(
  ActionLogService: any,
  limit: number,
  filterCiudad?: string,
  filterTransportadora?: string
): ActionsFeedSection {
  const allActions = ActionLogService.getAllActions();
  const stats = ActionLogService.getStats();

  // Filter and sort
  let filtered = allActions;

  if (filterCiudad) {
    filtered = filtered.filter((a: any) =>
      a.metadata?.city?.toLowerCase() === filterCiudad.toLowerCase()
    );
  }

  if (filterTransportadora) {
    filtered = filtered.filter((a: any) =>
      a.metadata?.carrier?.toLowerCase() === filterTransportadora.toLowerCase()
    );
  }

  // Sort by createdAt descending
  filtered.sort((a: any, b: any) =>
    b.createdAt.getTime() - a.createdAt.getTime()
  );

  const items = filtered.slice(0, limit).map((a: any) => ({
    id: a.id,
    guia: a.guia,
    actionType: a.actionType,
    status: a.status,
    trigger: a.metadata?.trigger,
    ciudad: a.metadata?.city,
    transportadora: a.metadata?.carrier,
    createdAt: a.createdAt.toISOString(),
  }));

  return {
    planned: stats.byStatus.PLANNED || 0,
    running: stats.byStatus.RUNNING || 0,
    recentFailed: stats.byStatus.FAILED || 0,
    recentSuccess: stats.byStatus.SUCCESS || 0,
    items,
  };
}

function buildExecutorHealth(ExecutorRunLog: any): ExecutorHealthSection {
  const lastRun = ExecutorRunLog.getLastRun();
  const metrics24h = ExecutorRunLog.get24hMetrics();
  const todaySummary = ExecutorRunLog.generateDailySummary(new Date());

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdaySummary = ExecutorRunLog.generateDailySummary(yesterday);

  return {
    lastRunAt: lastRun?.finishedAt?.toISOString() || null,
    lastRunStatus: lastRun?.status || null,
    last24h: {
      runs: metrics24h.runs,
      sent: metrics24h.sent,
      success: metrics24h.success,
      failed4xx: metrics24h.failed4xx,
      failed5xx: metrics24h.failed5xx,
      skippedDuplicate: metrics24h.skippedDuplicate,
      skippedRateLimit: metrics24h.skippedRateLimit,
      successRate: metrics24h.successRate,
    },
    dailyComparison: {
      todaySent: todaySummary.totalSent,
      yesterdaySent: yesterdaySummary.totalSent,
      delta: todaySummary.totalSent - yesterdaySummary.totalSent,
    },
  };
}
