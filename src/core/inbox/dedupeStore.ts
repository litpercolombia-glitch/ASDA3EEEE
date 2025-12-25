// /src/core/inbox/dedupeStore.ts
// Store de deduplicación para idempotencia de eventos

/**
 * Store en memoria para desarrollo/fallback
 * En producción, usar Vercel KV o PostgreSQL
 */
const memoryStore = new Map<string, { seenAt: number; expiresAt: number }>();

// TTL por defecto: 7 días
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Limpieza automática cada hora
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

// Iniciar limpieza periódica
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

function startCleanup() {
  if (cleanupInterval) return;

  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of memoryStore.entries()) {
      if (value.expiresAt < now) {
        memoryStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
}

// Iniciar limpieza al cargar módulo
startCleanup();

/**
 * Verifica si un evento ya fue procesado.
 * Si no existe, lo marca como visto y retorna false.
 * Si ya existe, retorna true (duplicado).
 *
 * @param key - Clave de idempotencia única del evento
 * @param ttlMs - Tiempo de vida en ms (default: 7 días)
 * @returns true si ya fue visto (duplicado), false si es nuevo
 */
export async function dedupeSeenOrMark(
  key: string,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<boolean> {
  // TODO: Reemplazar con Vercel KV en producción
  // Ejemplo con Vercel KV:
  // const existing = await kv.get(key);
  // if (existing) return true;
  // await kv.set(key, { seenAt: Date.now() }, { ex: ttlMs / 1000 });
  // return false;

  const now = Date.now();
  const existing = memoryStore.get(key);

  // Si existe y no ha expirado, es duplicado
  if (existing && existing.expiresAt > now) {
    return true;
  }

  // Marcar como visto
  memoryStore.set(key, {
    seenAt: now,
    expiresAt: now + ttlMs,
  });

  return false;
}

/**
 * Verifica si un evento ya fue procesado sin marcarlo
 * Útil para consultas sin efecto secundario
 */
export async function hasBeenSeen(key: string): Promise<boolean> {
  const existing = memoryStore.get(key);
  return existing !== undefined && existing.expiresAt > Date.now();
}

/**
 * Elimina una entrada del store (para rollback)
 */
export async function removeDedupe(key: string): Promise<void> {
  memoryStore.delete(key);
}

/**
 * Obtiene estadísticas del store (para monitoreo)
 */
export function getDedupeStats(): {
  totalEntries: number;
  memoryUsageEstimate: number;
} {
  return {
    totalEntries: memoryStore.size,
    memoryUsageEstimate: memoryStore.size * 200, // ~200 bytes por entrada estimado
  };
}

/**
 * Limpia todas las entradas (solo para testing)
 */
export function clearDedupeStore(): void {
  memoryStore.clear();
}

// ============================================
// TODO: Implementación con Vercel KV
// ============================================
// import { kv } from '@vercel/kv';
//
// export async function dedupeSeenOrMarkKV(
//   key: string,
//   ttlSeconds: number = 604800 // 7 días
// ): Promise<boolean> {
//   // NX = solo set si no existe
//   const result = await kv.set(key, { seenAt: Date.now() }, {
//     ex: ttlSeconds,
//     nx: true
//   });
//
//   // Si result es null, ya existía (duplicado)
//   return result === null;
// }

// ============================================
// TODO: Implementación con PostgreSQL
// ============================================
// import { sql } from '@vercel/postgres';
//
// export async function dedupeSeenOrMarkPG(
//   key: string,
//   ttlMs: number = 604800000
// ): Promise<boolean> {
//   const expiresAt = new Date(Date.now() + ttlMs);
//
//   // INSERT ON CONFLICT para idempotencia
//   const result = await sql`
//     INSERT INTO event_dedupe (idempotency_key, expires_at)
//     VALUES (${key}, ${expiresAt})
//     ON CONFLICT (idempotency_key)
//     DO NOTHING
//     RETURNING idempotency_key
//   `;
//
//   // Si no retorna filas, ya existía
//   return result.rowCount === 0;
// }
