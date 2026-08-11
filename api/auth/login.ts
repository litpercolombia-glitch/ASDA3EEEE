/**
 * POST /api/auth/login
 *
 * Reemplaza los password hardcodeados que existían en el frontend
 * (EnterpriseAdminDashboard.tsx y AdminPanelV2.tsx). La verificación
 * ahora ocurre en el servidor, contra la variable de entorno ADMIN_SECRET
 * (la misma que ya protege todos los endpoints /api/admin/* vía
 * services/auth/AdminAuth.ts) — así queda un único secreto administrado
 * desde Vercel, nunca embebido en el bundle que se descarga al navegador.
 *
 * Body: { password: string }
 * 200: { token: string, expiresAt: number }  (token = ADMIN_SECRET; se usa
 *       como Bearer token para llamar a /api/admin/*)
 * 401: { error: string }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const SESSION_HOURS = 12;

// Comparación en tiempo constante para evitar timing attacks (igual que AdminAuth.ts)
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Rate limiting muy simple en memoria (best-effort; una función serverless
// puede reiniciarse en cualquier momento, así que esto NO reemplaza un
// rate limiter real con almacenamiento externo — ver nota en PLAN de mejoras).
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 10 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const ip = String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown');
  if (isRateLimited(ip)) {
    res.status(429).json({ error: 'Demasiados intentos. Espera unos minutos.' });
    return;
  }

  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    // No debe pasar en producción si Vercel está bien configurado.
    res.status(500).json({ error: 'ADMIN_SECRET no configurado en el servidor' });
    return;
  }

  const { password } = (req.body || {}) as { password?: string };
  if (!password || typeof password !== 'string') {
    res.status(400).json({ error: 'password requerido' });
    return;
  }

  const valid = constantTimeCompare(password, adminSecret);
  if (!valid) {
    res.status(401).json({ error: 'Credenciales inválidas' });
    return;
  }

  const expiresAt = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  res.status(200).json({ token: adminSecret, expiresAt });
}
