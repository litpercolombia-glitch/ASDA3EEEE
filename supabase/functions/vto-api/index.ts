// vto-api — Zynex Probador (backend). 2026-10-17
// Acciones (POST JSON {action, ...}):
//   ai     → foto ultra realista con Cloudflare Workers AI (FLUX.2 klein 4B). No guarda imágenes.
//   event  → métrica anónima del embudo (abrir, foto, comprar, kit, compartir…).
//   lead   → empresa interesada (landing) + alta de prueba gratis de su tienda.
//   stats  → panel de la tienda (requiere llave del panel).
// Secretos en Supabase Vault (VTO_*), leídos solo con service_role. Límite por IP/día y cuota mensual por tienda.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const ORIGINS = [
  /^https:\/\/([a-z0-9-]+\.)*zynexapp\.com$/,
  /^https:\/\/asda3eeee(-[a-z0-9-]+)?-litpers-projects\.vercel\.app$/,
  /^https:\/\/asda3eeee\.vercel\.app$/,
  /^https:\/\/zynex-probador[a-z0-9-]*\.vercel\.app$/,
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d{2,5})?$/,
];
const originOk = (o: string | null) => !!o && ORIGINS.some((r) => r.test(o));
const headersFor = (o: string | null) => ({
  'access-control-allow-origin': originOk(o) ? o! : 'https://probador.zynexapp.com',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'access-control-max-age': '86400',
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  vary: 'origin',
});

let SEC: Record<string, string> | null = null;
async function secrets() {
  if (SEC) return SEC;
  const out: Record<string, string> = {};
  await Promise.all(['VTO_CF_API_TOKEN', 'VTO_CF_ACCOUNT_ID', 'VTO_SALT'].map(async (n) => {
    const { data } = await sb.rpc('vto_secret', { n });
    if (typeof data === 'string' && data) out[n] = data;
  }));
  if (out.VTO_CF_API_TOKEN && out.VTO_CF_ACCOUNT_ID) SEC = out;
  return out;
}

async function ipHash(req: Request, salt: string) {
  const ip = (req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'sin-ip';
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + '|' + ip));
  return [...new Uint8Array(d)].slice(0, 16).map((b) => b.toString(16).padStart(2, '0')).join('');
}

const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const slug = (v: unknown) => { const s = str(v, 60).toLowerCase(); return /^[a-z0-9][a-z0-9-]{0,59}$/.test(s) ? s : ''; };

/* ---------- prompts (solo palabras de listas fijas: nada del cliente entra crudo al prompt) ---------- */
const COLORS: [RegExp, string][] = [
  [/vino ?tinto|vinotinto|burdeos|borgo/, 'burgundy'], [/palo de rosa/, 'dusty pink'], [/azul (oscuro|marino|navy)|navy/, 'navy blue'],
  [/gris (oscuro|plomo)|grafito|carb[oó]n/, 'charcoal gray'], [/gris claro|perla/, 'light gray'], [/turquesa/, 'turquoise'], [/fucsia/, 'fuchsia'],
  [/mostaza/, 'mustard yellow'], [/terracota/, 'terracotta'], [/lila|lavanda/, 'lilac'], [/morad|violeta|p[uú]rpura/, 'purple'],
  [/menta/, 'mint green'], [/verde (oliva|militar)/, 'olive green'], [/verde/, 'green'], [/celeste|azul cielo/, 'light blue'], [/azul/, 'blue'],
  [/rosad|rosa/, 'pink'], [/roj/, 'red'], [/naranja/, 'orange'], [/amarill/, 'yellow'], [/dorad/, 'gold'], [/platead|plata/, 'silver'],
  [/beige|arena/, 'beige'], [/crema|hueso|marfil/, 'cream'], [/caf[eé]|marr[oó]n|chocolate/, 'brown'], [/camel/, 'camel'],
  [/negr/, 'black'], [/blanc/, 'white'], [/gris/, 'gray'],
];
const colorEn = (s: string) => { const t = s.toLowerCase(); for (const [r, en] of COLORS) if (r.test(t)) return en; return ''; };

// Prendas permitidas (no se permite ropa interior, vestidos de baño ni lencería: ver /legal del probador)
const GARMENTS: Record<string, { en: string; zone: 'top' | 'bottom' | 'full' }> = {
  camiseta: { en: 't-shirt', zone: 'top' }, polo: { en: 'polo shirt', zone: 'top' }, camisa: { en: 'shirt', zone: 'top' },
  blusa: { en: 'blouse', zone: 'top' }, buzo: { en: 'sweatshirt', zone: 'top' }, hoodie: { en: 'hoodie', zone: 'top' },
  saco: { en: 'sweater', zone: 'top' }, chaqueta: { en: 'jacket', zone: 'top' }, chaleco: { en: 'vest', zone: 'top' }, top: { en: 'top', zone: 'top' },
  pantalon: { en: 'pants', zone: 'bottom' }, jean: { en: 'jeans', zone: 'bottom' }, sudadera: { en: 'sweatpants', zone: 'bottom' },
  falda: { en: 'skirt', zone: 'bottom' }, short: { en: 'shorts', zone: 'bottom' }, jogger: { en: 'joggers', zone: 'bottom' },
  vestido: { en: 'dress', zone: 'full' }, enterizo: { en: 'jumpsuit', zone: 'full' }, pijama: { en: 'pajama set', zone: 'full' },
  conjunto: { en: 'outfit', zone: 'full' }, uniforme: { en: 'uniform', zone: 'full' },
};
const KEEP = 'Keep everything else in image 1 exactly the same: room, walls, floor, furniture, decor, lighting, shadows, camera angle, framing and perspective.';
const BED = 'Keep the bed frame, headboard, nightstands and lamps of image 1 exactly as they are; do not copy the headboard, furniture or room from image 2.';
const CLEAN = 'Ignore any text, logos, watermarks, price tags, graphics, people or background scenery in image 2; use image 2 only as the product reference.';
const PHOTO = 'Photorealistic smartphone photo, natural colors, crisp fabric detail.';

function buildPrompt(kind: string, garment: string, color: string) {
  const c = color ? ` (${color})` : '';
  switch (kind) {
    case 'protector':
      return `Put the exact quilted mattress protector${c} from image 2 on the mattress of the bed in image 1, with matching quilted pillow covers on the pillows: same color, same quilting pattern and texture as image 2. It fits like a fitted sheet: it covers the top and the sides of the mattress only, tight with elastic edges tucked under the mattress, no overhang, smooth surface. Remove the existing sheets and blankets. ${BED} ${KEEP} ${CLEAN} ${PHOTO}`;
    case 'sabanas':
      return `Replace the sheets and pillowcases on the bed in image 1 with the exact bed sheet set${c} from image 2: same color, same pattern at the same scale, same fabric sheen, fitted sheet tight on the mattress, top sheet neatly folded back at the head, matching pillowcases, natural soft folds. ${BED} ${KEEP} ${CLEAN} ${PHOTO}`;
    case 'cobija':
      return `Lay the exact blanket${c} from image 2 over the bed in image 1: same color, same texture and pile, same pattern at the same scale, spread over the bed with natural folds hanging over the sides. ${BED} ${KEEP} ${CLEAN} ${PHOTO}`;
    case 'almohada':
      return `Replace the pillows on the bed in image 1 with the exact pillows${c} from image 2: same shape, color, fabric and thickness, placed neatly at the head of the bed. ${BED} ${KEEP} ${CLEAN} ${PHOTO}`;
    case 'cortina':
      return `Replace the curtains on the window in image 1 with the exact curtains${c} from image 2: same color, same fabric, same opacity, same pattern and pleats, hanging from the rod down to the same length with natural vertical folds. If the window has no curtains, hang them from a rod above the window. ${KEEP} ${CLEAN} ${PHOTO}`;
    case 'mantel':
      return `Cover the table in image 1 with the exact tablecloth${c} from image 2: same color, same pattern at the same scale, draping evenly over the table edges with natural folds. Keep any objects already on the table, and do not add plates, glasses, food or decorations that are not in image 1. ${KEEP} ${CLEAN} ${PHOTO}`;
    case 'forro':
      return `Cover the chairs or the sofa in image 1 with the exact fitted covers${c} from image 2: same color, same print and fabric, snug fit with natural folds. Only the covered furniture changes: do not add a tablecloth, dishes, a Christmas tree or any decoration from image 2. ${KEEP} ${CLEAN} ${PHOTO}`;
    case 'mueble':
      return `Place the exact product${c} from image 2 into the space in image 1 where it naturally belongs, at a realistic real-world size, standing firmly on the floor against a wall (or mounted on the wall if it is a wall item), never floating, with correct perspective, contact shadows and lighting that match image 1. Show only one unit of the product. ${KEEP} ${CLEAN} Photorealistic smartphone photo, natural colors.`;
    case 'ropa': {
      const g = GARMENTS[garment] || GARMENTS.camiseta;
      const other = g.zone === 'top' ? "pants, shoes" : g.zone === 'bottom' ? 'top, shoes' : 'shoes';
      return `Dress the person in image 1 with the exact ${g.en}${c} shown in image 2: same color, same fabric, same print, graphics and logo placement, natural fit for this body with realistic folds and wrinkles. Keep the person's face, identity, hair, skin tone, body shape, pose, hands, ${other}, background and lighting exactly the same as image 1. Ignore any model, mannequin, text or background in image 2. Photorealistic photo, natural colors.`;
    }
    default: // edredón, colcha, plumón, cubrelecho y cualquier ropa de cama
      return `Replace the bedding on the bed in image 1 with the exact comforter or bedspread${c} from image 2 and matching pillow shams: same color, same print or pattern at the same scale, same quilting and thickness, laid neatly over the whole bed with natural drape and folds hanging over the sides. ${BED} ${KEEP} ${CLEAN} ${PHOTO}`;
  }
}
const KINDS = new Set(['protector', 'sabanas', 'edredon', 'cobija', 'almohada', 'cortina', 'mantel', 'forro', 'mueble', 'ropa', 'cama']);

/* ---------- imágenes ---------- */
function b64ToBytes(b64: string) { const bin = atob(b64); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
function dataUrlBlob(d: string, max: number) {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(d || '');
  if (!m) return null; const bytes = b64ToBytes(m[2]); if (bytes.length > max || bytes.length < 2000) return null;
  return new Blob([bytes], { type: m[1] });
}
async function productBlob(u: string, shop: string) {
  let url: URL; try { url = new URL(u); } catch { return null; }
  const h = url.hostname.toLowerCase(), s = shop.replace(/^www\./, '');
  const cdn = h === 'cdn.shopify.com' || /^\/(cdn\/shop|s\/files)\//.test(url.pathname);
  const own = h === s || h === 'www.' + s || h.endsWith('.myshopify.com');
  if (url.protocol !== 'https:' || /^[\d.]+$|^localhost$|\.local$|\.internal$/.test(h) || !(cdn || own)) return null;
  url.searchParams.set('width', '1024');
  const r = await fetch(url, { headers: { accept: 'image/jpeg,image/png;q=0.9' }, signal: AbortSignal.timeout(12000) }).catch(() => null);
  if (!r?.ok) return null;
  const type = (r.headers.get('content-type') || '').split(';')[0];
  if (!/^image\/(jpeg|png|webp)$/.test(type)) return null;
  const b = new Uint8Array(await r.arrayBuffer()); if (b.length > 8e6) return null;
  return new Blob([b], { type });
}
function outSize(w: number, h: number) {
  if (!(w > 0 && h > 0)) return [768, 1024];
  const k = Math.min(1, 1024 / Math.max(w, h)); const r16 = (v: number) => Math.max(256, Math.round((v * k) / 16) * 16);
  return [r16(w), r16(h)];
}

/* ---------- acciones ---------- */
async function actionAI(body: any, req: Request) {
  const sec = await secrets(); if (!sec.VTO_CF_API_TOKEN) return [503, { error: 'ia_no_configurada' }];
  const tenant = slug(body.tenant) || 'litper';
  const kind = KINDS.has(body.kind) ? body.kind : 'cama';
  const garment = kind === 'ropa' ? (GARMENTS[str(body.garment, 20)] ? str(body.garment, 20) : '') : '';
  if (kind === 'ropa' && !garment) return [422, { error: 'prenda_no_permitida' }];
  const room = dataUrlBlob(str(body.photo, 6_000_000), 4_000_000);
  if (!room) return [400, { error: 'foto_invalida' }];
  const { data: t } = await sb.from('vto_tenants').select('shop_domain').eq('id', tenant).maybeSingle();
  if (!t) return [404, { error: 'tienda_no_registrada' }];
  const ip = await ipHash(req, sec.VTO_SALT || 'x');
  const { data: take } = await sb.rpc('vto_take', { p_ip: ip, p_tenant: tenant, p_max_ip: 12 });
  if (!take?.ok) return [429, { error: take?.motivo || 'limite' }];
  const t0 = Date.now(); let ok = false, err = '';
  try {
    const prod = await productBlob(str(body.product, 1200), t.shop_domain);
    if (!prod) { err = 'producto_sin_imagen'; return [400, { error: err }]; }
    const [W, H] = outSize(+body.w, +body.h);
    const fd = new FormData();
    fd.append('prompt', buildPrompt(kind, garment, colorEn(str(body.color, 60))));
    fd.append('width', String(W)); fd.append('height', String(H));
    fd.append('input_image_0', room, 'foto.jpg'); fd.append('input_image_1', prod, 'producto.jpg');
    const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${sec.VTO_CF_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-2-klein-4b`, {
      method: 'POST', headers: { authorization: `Bearer ${sec.VTO_CF_API_TOKEN}` }, body: fd, signal: AbortSignal.timeout(60000),
    });
    const j = await r.json().catch(() => ({}));
    const img: string | undefined = j?.result?.image;
    if (!r.ok || !img) {
      const msg = JSON.stringify(j?.errors || j).slice(0, 300);
      err = /neuron|allocation|4006|quota|limit/i.test(msg) ? 'ia_cupo_diario' : 'ia_fallo';
      console.error('cf', r.status, msg);
      return [502, { error: err }];
    }
    const mime = img.startsWith('iVBOR') ? 'image/png' : img.startsWith('UklGR') ? 'image/webp' : 'image/jpeg';
    ok = true;
    return [200, { image: `data:${mime};base64,${img}`, ms: Date.now() - t0, via: 'cf-klein4b', restan: take.restan, w: W, h: H }];
  } catch (e) {
    err = String((e as Error)?.name === 'TimeoutError' ? 'ia_tiempo' : 'ia_fallo'); console.error('ai', e);
    return [502, { error: err }];
  } finally {
    if (!ok) await sb.rpc('vto_refund', { p_ip: ip, p_tenant: tenant });
    await sb.from('vto_events').insert({ tenant_id: tenant, tipo: 'ia', handle: slug(body.handle) || null, categoria: kind, via: 'cf-klein4b', ms: Date.now() - t0, ok, detalle: err ? { error: err } : null, ip_hash: ip, sesion: str(body.sesion, 40) || null });
  }
}

const TIPOS = new Set(['abrir', 'foto', 'ver', 'comprar', 'kit', 'compartir', 'descargar', 'variante', 'talla', 'camara', 'error', 'landing', 'demo', 'cta']);
function flat(o: unknown) { // detalle plano y corto: hasta 8 claves con valores simples
  if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(o as Record<string, unknown>).slice(0, 8)) {
    if (typeof v === 'string') out[str(k, 30)] = v.slice(0, 100); else if (typeof v === 'number' && Number.isFinite(v)) out[str(k, 30)] = v; else if (typeof v === 'boolean') out[str(k, 30)] = v;
  }
  return out;
}
async function actionEvent(body: any, req: Request) {
  const tipo = str(body.tipo, 20); if (!TIPOS.has(tipo)) return [400, { error: 'tipo' }];
  const sec = await secrets(); const ip = await ipHash(req, sec.VTO_SALT || 'x');
  const { data: okRate } = await sb.rpc('vto_rate', { p_key: ip + '#ev', p_max: 400 });
  if (okRate === false) return [429, { error: 'limite' }];
  await sb.from('vto_events').insert({ tenant_id: slug(body.tenant) || null, tipo, handle: slug(body.handle) || null, categoria: str(body.categoria, 20) || null, sesion: str(body.sesion, 40) || null, detalle: flat(body.detalle), ip_hash: ip });
  return [200, { ok: true }];
}

async function isShopify(domain: string) {
  try {
    const r = await fetch(`https://${domain}/products.json?limit=1`, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return false; const j = await r.json(); return Array.isArray(j?.products);
  } catch { return false; }
}
async function actionLead(body: any, req: Request) {
  const sec = await secrets();
  const nombre = str(body.nombre, 80), empresa = str(body.empresa, 100), email = str(body.email, 120).toLowerCase();
  const whatsapp = str(body.whatsapp, 30).replace(/[^\d+]/g, '');
  const tienda = str(body.tienda, 120).toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const plan = str(body.plan, 30), mensaje = str(body.mensaje, 600);
  if (!nombre || (!whatsapp && !email)) return [400, { error: 'faltan_datos' }];
  if (email && !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(email)) return [400, { error: 'email_invalido' }];
  if (whatsapp && whatsapp.replace(/\D/g, '').length < 7) return [400, { error: 'whatsapp_invalido' }];
  if (tienda && !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(tienda)) return [400, { error: 'tienda_invalida' }];
  const ip = await ipHash(req, sec.VTO_SALT || 'x');
  const { data: okRate } = await sb.rpc('vto_rate', { p_key: ip + '#lead', p_max: 6 });
  if (okRate === false) return [429, { error: 'demasiados_intentos' }];
  let tenantInfo: any = null;
  if (tienda && (await isShopify(tienda))) {
    const { data } = await sb.rpc('vto_tenant_upsert', { p_shop: tienda, p_nombre: empresa || nombre, p_contacto: { nombre, whatsapp, email } });
    if (data?.ok) tenantInfo = data;
  }
  const utm = body.utm && typeof body.utm === 'object' ? Object.fromEntries(Object.entries(body.utm).slice(0, 8).map(([k, v]) => [str(k, 30), str(v, 100)])) : null;
  await sb.from('vto_leads').insert({ nombre, empresa, whatsapp, email, tienda, plan, mensaje, origen: str(body.origen, 60) || 'landing', utm, ip_hash: ip, tenant_id: tenantInfo?.id || null });
  await sb.from('zynex_pipeline').insert({
    empresa: empresa || nombre, dominio: tienda || null, pais: str(body.pais, 2).toUpperCase() || 'CO', producto: 'Probador IA', canal: 'landing',
    contacto: [nombre, whatsapp, email].filter(Boolean).join(' · '), fuente: 'probador.zynexapp.com', etapa: 'nuevo', oferta: plan || null,
    proximo_paso: 'Escribir por WhatsApp en menos de 1 hora y agendar demo de 15 min', fecha_proximo: new Date().toISOString().slice(0, 10),
    notas: mensaje || null, origen_id: tenantInfo?.id ? 'vto:' + tenantInfo.id : null,
  });
  await sb.from('slack_cola').insert({
    tipo: 'parte', destino: 'dm_ceo', empresa: 'zynex', origen: 'probador-landing',
    mensaje: `🟢 Lead nuevo · Probador IA\n${empresa || nombre}${tienda ? ` (${tienda})` : ''} — ${nombre}\nWhatsApp: ${whatsapp || '—'} · Email: ${email || '—'} · Plan: ${plan || '—'}${tenantInfo?.nuevo ? `\nPrueba gratis activada: tienda "${tenantInfo.id}", ${tenantInfo.cuota} fotos IA hasta ${tenantInfo.vence}` : ''}\nPróximo paso: escribirle en menos de 1 hora.`,
  });
  return [200, { ok: true, tienda: tenantInfo ? { id: tenantInfo.id, nuevo: tenantInfo.nuevo, cuota: tenantInfo.cuota, vence: tenantInfo.vence, panel_key: tenantInfo.panel_key || null } : null, shopify: !!tenantInfo }];
}

const SELLO = new Set(['prueba', 'gratis', 'basico', 'demo', 'interno']);
const KIT = new Set(['prueba', 'crecimiento', 'escala', 'interno']);
async function actionCfg(body: any) {
  const id = slug(body.tenant); if (!id) return [400, { error: 'tienda' }];
  const { data: t } = await sb.from('vto_tenants').select('id, nombre, shop_domain, plan, estado').eq('id', id).maybeSingle();
  if (!t) return [404, { error: 'tienda_no_registrada' }];
  return [200, { id: t.id, nombre: t.nombre, dominio: t.shop_domain, plan: t.plan, activo: t.estado === 'activo', sello: SELLO.has(t.plan), kit: KIT.has(t.plan) }];
}

async function actionStats(body: any) {
  const { data } = await sb.rpc('vto_stats', { p_tenant: slug(body.tenant), p_key: str(body.key, 80) });
  if (!data?.ok) return [403, { error: 'llave_invalida' }];
  return [200, data];
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const h = headersFor(origin);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
  if (req.method !== 'POST') return new Response(JSON.stringify({ ok: true, servicio: 'zynex-probador' }), { status: 200, headers: h });
  if (!originOk(origin)) return new Response(JSON.stringify({ error: 'origen_no_permitido' }), { status: 403, headers: h });
  const len = +(req.headers.get('content-length') || 0); if (len > 7_000_000) return new Response(JSON.stringify({ error: 'muy_grande' }), { status: 413, headers: h });
  let body: any; try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: 'json' }), { status: 400, headers: h }); }
  let out: [number, unknown];
  try {
    switch (body?.action) {
      case 'ai': out = await actionAI(body, req) as [number, unknown]; break;
      case 'event': out = await actionEvent(body, req) as [number, unknown]; break;
      case 'lead': out = await actionLead(body, req) as [number, unknown]; break;
      case 'stats': out = await actionStats(body) as [number, unknown]; break;
      case 'cfg': out = await actionCfg(body) as [number, unknown]; break;
      default: out = [400, { error: 'accion' }];
    }
  } catch (e) { console.error('vto', e); out = [500, { error: 'interno' }]; }
  return new Response(JSON.stringify(out[1]), { status: out[0], headers: h });
});
