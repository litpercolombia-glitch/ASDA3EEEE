/**
 * POST /api/auth/verify
 *
 * Verifica si una sesión de admin sigue siendo válida (usado al recargar
 * la página, para no obligar a re-escribir la contraseña en cada visita,
 * pero sin necesidad de confiar ciegamente en localStorage).
 *
 * Body: { token: string, expiresAt: number }
 * 200: { valid: true }
 * 401: { valid: false }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const adminSecret = process.env.ADMIN_SECRET;
  const { token, expiresAt } = (req.body || {}) as { token?: string; expiresAt?: number };

  if (!adminSecret || !token || !expiresAt) {
    res.status(401).json({ valid: false });
    return;
  }

  if (Date.now() > expiresAt) {
    res.status(401).json({ valid: false, reason: 'expired' });
    return;
  }

  const valid = constantTimeCompare(token, adminSecret);
  res.status(valid ? 200 : 401).json({ valid });
}
