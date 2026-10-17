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
// fal.ai: una sola llave (FAL_KEY) para FASHN (ropa) y Nano Banana (hogar). sync_mode devuelve la imagen como data URI.
export async function falRun(model, input) {
  const r = await fetch(`https://fal.run/${model}`, { method: 'POST', headers: { authorization: `Key ${process.env.FAL_KEY}`, 'content-type': 'application/json' }, body: JSON.stringify({ ...input, sync_mode: true }) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(d.detail?.[0]?.msg || d.detail || 'La IA no pudo con esta foto.'), { code: 502 });
  const url = d.images?.[0]?.url; if (!url) throw Object.assign(new Error('La IA no devolvió imagen.'), { code: 502 });
  if (url.startsWith('data:')) return url;
  const im = await fetch(url); const b = Buffer.from(await im.arrayBuffer());
  return `data:${(im.headers.get('content-type') || 'image/jpeg').split(';')[0]};base64,${b.toString('base64')}`;
}
// tope por IP (mejor esfuerzo, por instancia): evita que alguien gaste el saldo de IA
const hits = new Map();
export function rateOk(req, max = Number(process.env.AI_MAX_PER_IP_DAY || 6)) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim(), day = new Date().toISOString().slice(0, 10), k = ip + '|' + day;
  const n = (hits.get(k) || 0) + 1; hits.set(k, n); if (hits.size > 5000) hits.clear(); return n <= max;
}
