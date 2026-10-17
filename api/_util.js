// Utilidades compartidas de las funciones del probador (solo lectura de catálogos públicos de Shopify).
export function json(res, status, body, cache = 'no-store') {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', cache);
  res.setHeader('x-content-type-options', 'nosniff');
  res.end(JSON.stringify(body));
}
export const q = (req, k) => String(req.query?.[k] ?? new URL(req.url, 'http://x').searchParams.get(k) ?? '');

// Dominio de tienda válido (nada de IPs, localhost ni redes internas)
export function shopHost(raw) {
  const h = String(raw || 'litper.store').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/:\d+$/, '');
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(h) || h.length > 120) return null;
  if (/^[\d.]+$/.test(h) || /(^|\.)(localhost|local|internal|lan|home|corp)$/.test(h)) return null;
  return h;
}
export const handleOk = (h) => /^[a-z0-9][a-z0-9-]{0,200}$/.test(h);

export async function getJSON(url, ms = 9000) {
  const r = await fetch(url, { headers: { accept: 'application/json', 'user-agent': 'ZynexProbador/1.0 (+https://probador.zynexapp.com)' }, redirect: 'follow', signal: AbortSignal.timeout(ms) });
  if (!r.ok) { const e = new Error('http_' + r.status); e.status = r.status; throw e; }
  const t = await r.text(); if (t.length > 8_000_000) throw new Error('muy_grande');
  return JSON.parse(t);
}

const cacheMeta = new Map();
export async function shopMeta(shop) {
  const c = cacheMeta.get(shop); if (c && Date.now() - c.t < 3600e3) return c.v;
  let v = { name: shop, currency: 'COP' };
  try { const m = await getJSON(`https://${shop}/meta.json`, 6000); v = { name: m.name || shop, currency: m.currency || 'COP', country: m.country || null }; } catch {}
  cacheMeta.set(shop, { t: Date.now(), v }); return v;
}

export const img = (u, w) => { if (!u) return null; let s = u.startsWith('//') ? 'https:' + u : u; if (w) s += (s.includes('?') ? '&' : '?') + 'width=' + w; return s; };
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// Qué es el producto: decide el tipo de prueba (cama, ventana, mesa, cuerpo, espacio)
const TYPE_MAP = [
  [/protector/, 'protector'], [/kit de cama|juego de s[aá]banas|s[aá]bana/, 'sabanas'], [/cortina|velo|persiana/, 'cortina'],
  [/edred|colcha|plum[oó]n|cubrelecho|duvet/, 'edredon'], [/cobija|manta|frazada|cobertor/, 'cobija'], [/mantel/, 'mantel'],
  [/almohada/, 'almohada'],
];
const WORDS = [
  ['cortina', 'cortina'], ['blackout', 'cortina'], ['velo', 'cortina'], ['ventana', 'cortina'], ['persiana', 'cortina'],
  ['mantel', 'mantel'], ['forro', 'forro'], ['silla', 'forro'], ['sofa', 'forro'], ['protector', 'protector'],
  ['sabana', 'sabanas'], ['edredon', 'edredon'], ['colcha', 'edredon'], ['plumon', 'edredon'], ['cubrelecho', 'edredon'], ['duvet', 'edredon'],
  ['cobija', 'cobija'], ['cobertor', 'cobija'], ['manta', 'cobija'], ['frazada', 'cobija'], ['almohada', 'almohada'],
  ['zapatero', 'mueble'], ['estante', 'mueble'], ['esquinero', 'mueble'], ['armario', 'mueble'], ['perchero', 'mueble'], ['organizador', 'mueble'],
  ['repisa', 'mueble'], ['mueble', 'mueble'], ['tapete', 'mueble'], ['alfombra', 'mueble'], ['lampara', 'mueble'], ['espejo', 'mueble'], ['cuadro', 'mueble'],
];
const GARMENT_WORDS = [
  ['camiseta', 'camiseta'], ['t-shirt', 'camiseta'], ['polo', 'polo'], ['camisa', 'camisa'], ['blusa', 'blusa'], ['buzo', 'buzo'], ['hoodie', 'hoodie'],
  ['saco', 'saco'], ['sueter', 'saco'], ['chaqueta', 'chaqueta'], ['chaleco', 'chaleco'], ['crop top', 'top'], ['top ', 'top'],
  ['pantalon', 'pantalon'], ['jean', 'jean'], ['sudadera', 'sudadera'], ['jogger', 'jogger'], ['falda', 'falda'], ['short', 'short'], ['bermuda', 'short'],
  ['vestido', 'vestido'], ['enterizo', 'enterizo'], ['jumpsuit', 'enterizo'], ['pijama', 'pijama'], ['conjunto', 'conjunto'], ['uniforme', 'uniforme'],
];
const BLOCKED = /ropa interior|brasier|sosten|panty|tanga|boxer|calzon|lenceri|bikini|traje de ba|vestido de ba|banador|trusa|cachetero|bodysuit/;

export function kindOf(p) {
  const type = norm(p.type || p.product_type), title = norm(p.title), handle = norm(p.handle).replace(/-/g, ' ');
  const all = `${type} ${title} ${handle} ${norm((p.tags || []).join(' '))}`;
  if (BLOCKED.test(all)) return { kind: 'bloqueado', garment: null };
  for (const [r, k] of TYPE_MAP) if (r.test(type)) return { kind: k, garment: null };
  // primero la prenda o el artículo que se nombra antes en el título (el principal)
  let best = null;
  for (const [w, k] of WORDS) { const i = (' ' + title + ' ').indexOf(' ' + w); if (i >= 0 && (!best || i < best.i)) best = { i, kind: k }; }
  // "comedor vestido de Navidad" no es ropa: si el título habla de la casa, las palabras de ropa no cuentan
  const home = /(^| )(comedor|cama|mesa|silla|sillas|ventana|colchon|sofa|hogar|casa|cocina|bano|sala|habitacion|cuarto|puerta)( |$)/.test(`${title} ${handle}`);
  if (!home) for (const [w, g] of GARMENT_WORDS) { const i = (' ' + title + ' ').indexOf(' ' + w); if (i >= 0 && (!best || i < best.i)) best = { i, kind: 'ropa', garment: g }; }
  if (best) return { kind: best.kind, garment: best.garment || null };
  for (const [w, k] of WORDS) if (handle.includes(w)) return { kind: k, garment: null };
  if (!home) for (const [w, g] of GARMENT_WORDS) if (`${handle} ${type}`.includes(w.trim())) return { kind: 'ropa', garment: g };
  return { kind: 'otro', garment: null };
}

export function optionRoles(options) {
  const r = options.map((o) => {
    const n = norm(o.name);
    if (/color|dise|estampado|tono|modelo/.test(n)) return 'color';
    if (/medid|tama|talla|size|^medi$|cama/.test(n)) return 'size';
    if (/cant|pack|unid|x\d/.test(n)) return 'qty';
    return 'other';
  });
  // sin opción de color: la primera opción "otra" con varios valores hace de color/diseño (ej. "Cortina + sábanas")
  if (!r.includes('color')) { const i = r.findIndex((x, k) => x === 'other' && (options[k].values || []).length > 1); if (i >= 0) r[i] = 'color'; }
  return r;
}

// Busca la foto que corresponde a un valor (ej. "6 DORADO" → ...-dorado.jpg) cuando la variante no trae imagen
export function imageForValue(value, images) {
  const words = norm(value).replace(/[^a-z ]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !['con', 'para', 'del', 'las', 'los', 'navidad', 'premium'].includes(w));
  let best = null, bs = 0;
  for (const u of images) { const f = norm(decodeURIComponent((u.split('/').pop() || '').split('?')[0])); const s = words.reduce((a, w) => a + (f.includes(w) ? 1 : 0), 0); if (s > bs) { bs = s; best = u; } }
  return best;
}
