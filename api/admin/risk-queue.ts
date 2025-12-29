/**
 * Admin Endpoint: /api/admin/risk-queue
 *
 * GET - Get prioritized risk queue
 * Query params:
 *   - level: HIGH | MEDIUM | LOW (optional, filter)
 *   - limit: number (default 50)
 *   - includeTerminal: boolean (default false)
 *
 * Returns guides sorted by risk score (HIGH first).
 *
 * Protected by CRON_SECRET.
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
// MOCK DATA SOURCE
// =====================================================

/**
 * In production, replace with actual data source.
 * This demonstrates how to get guide states for scoring.
 */
async function getActiveGuides(): Promise<Array<{
  numero_de_guia: string;
  estatus: string;
  ciudad_de_destino?: string;
  transportadora?: string;
  novedad?: string;
  fecha_de_ultimo_movimiento?: string;
}>> {
  // TODO: Replace with actual data source (Supabase, GuideState cache, etc.)
  // For now, return empty array - endpoint works but needs data integration
  return [];
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
    const { RiskScoringService } = await import('../../services/scoring/RiskScoringService');
    const { RiskFlags } = await import('../../services/config/RiskFlags');
    const { CanonicalStatus } = await import('../../types/canonical.types');

    // Parse query params
    const {
      level,
      limit = '50',
      includeTerminal = 'false',
    } = req.query;

    const maxLimit = Math.min(parseInt(limit as string, 10) || 50, 200);
    const showTerminal = includeTerminal === 'true';

    // Get active guides
    const guides = await getActiveGuides();

    // Score all guides
    const scoredGuides = guides.map(guide => {
      // Map string status to CanonicalStatus enum
      const estatus = (CanonicalStatus as any)[guide.estatus] || CanonicalStatus.IN_TRANSIT;

      const result = RiskScoringService.scoreGuide({
        numero_de_guia: guide.numero_de_guia,
        estatus,
        ciudad_de_destino: guide.ciudad_de_destino,
        transportadora: guide.transportadora,
        novedad: guide.novedad,
        fecha_de_ultimo_movimiento: guide.fecha_de_ultimo_movimiento,
      });

      return {
        guia: guide.numero_de_guia,
        riskLevel: result.riskLevel,
        score: result.score,
        reasons: result.reasons,
        ciudad_de_destino: guide.ciudad_de_destino,
        transportadora: guide.transportadora,
        estatus: guide.estatus,
        fecha_de_ultimo_movimiento: guide.fecha_de_ultimo_movimiento,
        hoursSinceLastMovement: RiskScoringService.getHoursSinceMovement(
          guide.fecha_de_ultimo_movimiento
        ),
        computedAt: result.computedAt.toISOString(),
        isTerminal: result.isTerminal,
      };
    });

    // Filter by level if specified
    let filteredGuides = scoredGuides;

    if (level) {
      const validLevels = ['HIGH', 'MEDIUM', 'LOW'];
      if (validLevels.includes(level as string)) {
        filteredGuides = filteredGuides.filter(g => g.riskLevel === level);
      }
    }

    // Filter terminal unless requested
    if (!showTerminal) {
      filteredGuides = filteredGuides.filter(g => !g.isTerminal);
    }

    // Sort by risk (HIGH first, then score descending)
    filteredGuides.sort((a, b) => {
      const levelOrder: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      const levelDiff = levelOrder[a.riskLevel] - levelOrder[b.riskLevel];
      if (levelDiff !== 0) return levelDiff;
      return b.score - a.score;
    });

    // Apply limit
    const limitedGuides = filteredGuides.slice(0, maxLimit);

    // Calculate stats
    const stats = {
      total: filteredGuides.length,
      byLevel: {
        HIGH: filteredGuides.filter(g => g.riskLevel === 'HIGH').length,
        MEDIUM: filteredGuides.filter(g => g.riskLevel === 'MEDIUM').length,
        LOW: filteredGuides.filter(g => g.riskLevel === 'LOW').length,
      },
      avgScore: filteredGuides.length > 0
        ? Math.round(filteredGuides.reduce((sum, g) => sum + g.score, 0) / filteredGuides.length)
        : 0,
      terminalCount: scoredGuides.filter(g => g.isTerminal).length,
    };

    // Get risk flags config
    const riskFlagsConfig = RiskFlags.getConfig();

    res.status(200).json({
      timestamp: new Date().toISOString(),
      query: {
        level: level || 'ALL',
        limit: maxLimit,
        includeTerminal: showTerminal,
      },
      config: {
        thresholds: RiskScoringService.getThresholds(),
        riskFlags: riskFlagsConfig,
      },
      stats,
      count: limitedGuides.length,
      guides: limitedGuides,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error';
    console.error('[ADMIN] Risk queue error:', message);
    res.status(500).json({ error: message });
  }
}
