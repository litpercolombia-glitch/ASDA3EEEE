// /api/health.ts
// Endpoint de health check para monitoreo

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDedupeStats } from '../src/core/inbox/dedupeStore';
import { getThreadStats } from '../src/core/chats/chatRouter';

/**
 * GET /api/health
 * Health check y estadísticas básicas
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const dedupeStats = getDedupeStats();
    const threadStats = getThreadStats();

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'dev',
      environment: process.env.VERCEL_ENV ?? 'development',
      region: process.env.VERCEL_REGION ?? 'unknown',

      // Configuración
      config: {
        hasChateaSecret: !!process.env.CHATEA_WEBHOOK_SECRET,
        hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        signatureValidation: process.env.ENABLE_WEBHOOK_SIGNATURE_VALIDATION === 'true',
      },

      // Estadísticas en memoria
      stats: {
        dedupe: dedupeStats,
        chats: threadStats,
      },

      // Uptime (aproximado en serverless)
      uptime: process.uptime(),
    };

    // Headers de cache
    res.setHeader('Cache-Control', 'no-store, max-age=0');

    return res.status(200).json(health);
  } catch (error) {
    return res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}
