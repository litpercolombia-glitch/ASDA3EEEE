// Utilidades comunes de las funciones: origen permitido, límites y respuestas JSON.
const ALLOWED = (process.env.ALLOWED_ORIGINS || 'litper.store,.vercel.app,.myshopify.com').split(',').map((s) => s.trim()).filter(Boolean);
export function originOk(req) {
  const o = req.headers.origin || req.headers.referer || '';
  if (!o) return true; // navegación directa / mismo origen sin cabecera
  try { const h = new URL(o).hostname; return ALLOWED.some((a) => (a.startsWith('.') ? h.endsWith(a) : h === a || h.endsWith('.' + a))); } catch { return false; }
}
export function json(res, code, body, cache) {
  res.statusCode = code;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', cache || 'no-store');
  res.setHeader('x-content-type-options', 'nosniff');
  res.end(JSON.stringify(body));
}
export async function readJson(req, max = 4_000_000) {
  if (req.body && typeof req.body === 'object') return req.body;
  let size = 0; const chunks = [];
  for await (const c of req) { size += c.length; if (size > max) throw Object.assign(new Error('La foto es muy pesada'), { code: 413 }); chunks.push(c); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}
const IMG_HOSTS = ['cdn.shopify.com', 'litper.store'];
export function imageUrlOk(u, selfHost) {
  try { const x = new URL(u); return x.protocol === 'https:' && (IMG_HOSTS.includes(x.hostname) || x.hostname === selfHost); } catch { return false; }
}
export const isDataImage = (s) => typeof s === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s) && s.length < 4_000_000;
