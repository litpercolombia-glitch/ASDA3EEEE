// vto-api v6 — Zynex Probador (backend). 17-oct-2026
// Acciones (POST JSON {action, ...}):
//   cfg     → configuración pública mínima de la tienda + ficha de sesión firmada (tok).
//   ai      → foto realista con Cloudflare Workers AI (FLUX.2 klein 4B). El servidor resuelve el producto él mismo
//             (tienda + handle), valida tipo, imagen y color, y no guarda la foto del cliente.
//   estado  → lo llama el botón desde la página de la tienda: activa la prueba si el dominio coincide y dice si mostrar el botón.
//   event   → métrica del embudo (abrir, foto, comprar, kit, compartir…).
//   lead    → empresa interesada (landing): queda una tienda pendiente que se activa al instalar el botón.
//   stats   → panel de la tienda (requiere llave del panel).
// Secretos en Supabase Vault (VTO_*), leídos solo con service_role. Límites por IP, por sesión, por tienda y cuota mensual.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/* ---------- orígenes: lista exacta ---------- */
const ORIGINS = new Set([
  'https://probador.zynexapp.com',
  'https://asda3eeee-git-probador-litpers-projects.vercel.app',
  'https://zynex-probador.vercel.app',
]);
const originOk = (o: string | null) => !!o && (ORIGINS.has(o) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d{2,5})?$/.test(o));
const headersFor = (o: string | null, open = false) => ({
  'access-control-allow-origin': open && o ? o : originOk(o) ? o! : 'https://probador.zynexapp.com',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'access-control-max-age': '86400',
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  vary: 'origin',
});

/* ---------- secretos (Vault) con recarga cada 5 minutos ---------- */
let SEC: Record<string, string> | null = null, SEC_T = 0;
async function secrets() {
  if (SEC && Date.now() - SEC_T < 300_000) return SEC;
  const out: Record<string, string> = {};
  await Promise.all(['VTO_CF_API_TOKEN', 'VTO_CF_ACCOUNT_ID', 'VTO_SALT', 'VTO_N2_MAX_DIA', 'VTO_MODERACION'].map(async (n) => {
    const { data } = await sb.rpc('vto_secret', { n });
    if (typeof data === 'string' && data) out[n] = data;
  }));
  if (out.VTO_CF_API_TOKEN && out.VTO_CF_ACCOUNT_ID) { SEC = out; SEC_T = Date.now(); }
  return out;
}

const enc = new TextEncoder();
const hex = (b: ArrayBuffer, n = 32) => [...new Uint8Array(b)].slice(0, n).map((x) => x.toString(16).padStart(2, '0')).join('');
async function ipHash(req: Request, salt: string) {
  const ip = (req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'sin-ip';
  return hex(await crypto.subtle.digest('SHA-256', enc.encode(salt + '|' + ip)), 16);
}
async function hmac(key: string, msg: string) {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', k, enc.encode(msg)), 12);
}
const utcDay = (d = new Date()) => d.toISOString().slice(0, 10).replace(/-/g, '');

const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const slug = (v: unknown) => { const s = str(v, 60).toLowerCase(); return /^[a-z0-9][a-z0-9-]{0,59}$/.test(s) ? s : ''; };
const handleOk = (v: unknown) => { const s = str(v, 220).toLowerCase(); return /^[a-z0-9][a-z0-9-]{0,210}$/.test(s) ? s : ''; };
const shopHost = (v: unknown) => {
  const h = str(v, 120).toLowerCase().replace(/^https?:\/\//, '').replace(/[/?#].*$/, '');
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(h) && !/^[\d.]+$/.test(h) && !/(^|\.)(localhost|local|internal)$/.test(h) ? h : '';
};

/* ---------- sesión firmada: la emite cfg, la exige ai ---------- */
async function newTok(salt: string, tenant: string) {
  const r = hex(crypto.getRandomValues(new Uint8Array(8)).buffer, 8), d = utcDay();
  return `${r}.${d}.${await hmac(salt, `${r}|${d}|${tenant}`)}`;
}
async function tokOk(salt: string, tenant: string, tok: unknown) {
  const m = /^([a-f0-9]{16})\.(\d{8})\.([a-f0-9]{24})$/.exec(str(tok, 80));
  if (!m) return '';
  const hoy = utcDay(), ayer = utcDay(new Date(Date.now() - 864e5));
  if (m[2] !== hoy && m[2] !== ayer) return '';
  return (await hmac(salt, `${m[1]}|${m[2]}|${tenant}`)) === m[3] ? m[1] : '';
}

/* ---------- qué es el producto (mismo clasificador v2 que /api/_util.js) ---------- */
const normw = (s: unknown) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ]+/g, ' ').trim();
const has = (t: string, words: string) => new RegExp(`(^| )(${words})( |$)`).test(t);
const at = (t: string, words: string) => { const m = new RegExp(`(^| )(${words})( |$)`).exec(t); return m ? m.index : -1; };
const BLOCKED = 'ropa interior|brasier|brasieres|bra|sosten|panty|pantys|tanga|tangas|boxer|boxers|calzon|calzoncillo|lenceria|bikini|bikinis|traje de bano|vestido de bano|banador|trusa|cachetero|bodysuit|body|faja|fajas|moldeador|moldeadora|shapewear|levanta gluteos|levanta cola|erotico|erotica|erotic|sexual|intimo|intima|sex';
const NOT_HOME = 'pantalla|screen|celular|iphone|samsung|xiaomi|telefono|movil|camara|lente|lentes|solar|vidrio|templado|carro|auto|moto|vehiculo|parlante|cargador|bateria|audifonos|reloj|tablet|laptop|portatil|consola|perro|gato|mascota|bebe';
const RULES: [string, string, string | null, string | null][] = [
  ['protector', 'protector|protectores', 'colchon|colchones|cama', NOT_HOME + '|espaldar|cabecero|cabecera|pintura|techo|pared'],
  ['sabanas', 'sabana|sabanas|juego de cama|juegos de cama|kit de cama', null, NOT_HOME + '|caja|organizadora|organizador|bolsa|bolsas|ganchos|sujetador'],
  ['edredon', 'edredon|edredones|colcha|colchas|plumon|plumones|cubrelecho|cubrelechos|duvet|comforter', null, NOT_HOME + '|vasenilla|escalera|caja|organizadora|organizador|bolsa|bolsas'],
  ['cobija', 'cobija|cobijas|cobertor|cobertores|frazada|frazadas|manta|mantas', null, NOT_HOME + '|electrica|peluche|juguete|caja|organizadora|organizador|bolsa|bolsas|para muebles|para sofa|sofa|sala'],
  ['almohada', 'almohada|almohadas', null, 'cervical para carro|viaje|' + NOT_HOME.replace('|bebe', '')],
  ['cortina', 'cortina|cortinas|blackout|velo|velos|persiana|persianas', null, 'cortina de luces|cortina de luz|cortinas de luces|cortinas de luz|led|leds|de bano|ducha|iman|imanes|gancho|ganchos|riel|varilla|soporte|' + NOT_HOME],
  ['mantel', 'mantel|manteles|camino de mesa', null, 'picnic|' + NOT_HOME],
  ['forro', 'forro|forros|funda|fundas|cubresillas|cubre silla|cubre sofa|cubresofa|manta|mantas', 'silla|sillas|sofa|sofas|comedor|mueble|muebles|puestos', NOT_HOME + '|almohada|almohadas|cojin|cojines|colchon'],
  ['mueble', 'zapatero|zapateros|estante|estantes|esquinero|esquineros|armario|armarios|closet|perchero|percheros|repisa|repisas|mueble|muebles|organizador de pie|organizador de zapatos|biblioteca|mesa de noche|tapete|tapetes|alfombra|alfombras', null, NOT_HOME + '|viaje|maleta|cosmetiquero|maquillaje|masajeador|masaje|spa|pies|yoga|ejercicio|frutas|verduras|nevera|cocina|carro|luces|led|embarazada|embarazadas|cinturon|salida de bano|pareo'],
];
const GARMENT_WORDS: Record<string, string> = { camiseta: 'camiseta|camisetas|t shirt|tshirt|polo|polos', camisa: 'camisa|camisas', blusa: 'blusa|blusas', buzo: 'buzo|buzos|hoodie|hoodies|sudadera con capota', saco: 'saco|sacos|sueter|sueteres|cardigan', chaqueta: 'chaqueta|chaquetas|chaqueton|abrigo|parka', chaleco: 'chaleco|chalecos', top: 'top|tops|crop top', pantalon: 'pantalon|pantalones|palazzo', jean: 'jean|jeans', sudadera: 'sudadera|sudaderas|jogger|joggers', falda: 'falda|faldas', short: 'short|shorts|bermuda|bermudas', vestido: 'vestido|vestidos', enterizo: 'enterizo|enterizos|jumpsuit|overol', pijama: 'pijama|pijamas', conjunto: 'conjunto deportivo|conjunto de ropa|conjunto casual|conjunto de dos piezas' };
const HOME_CTX = 'comedor|cama|mesa|silla|sillas|ventana|colchon|sofa|hogar|casa|cocina|bano|sala|habitacion|cuarto|puerta';
const NOT_GARMENT = 'percha|perchas|gancho|ganchos|organizador|mascota|mascotas|perro|perros|gato|gatos|salvavidas|oil|aceite|crema|serum|celulitis|medias|lavadora|plancha|corrector|postura|lastrado|fitness|faja';
function kindOf(p: { title?: string; type?: string; product_type?: string; handle?: string; tags?: unknown }) {
  const title = normw(p.title), type = normw(p.type || p.product_type), handle = normw(p.handle);
  const tags = normw(Array.isArray(p.tags) ? p.tags.join(' ') : String(p.tags || ''));
  if (has(`${type} ${title} ${handle} ${tags}`, BLOCKED)) return { kind: 'bloqueado', garment: '' };
  let best: { i: number; kind: string; garment?: string } | null = null;
  for (const [kind, words, ctx, excl] of RULES) {
    const i = at(title, words); if (i < 0) continue;
    if (excl && has(`${title} ${type}`, excl)) continue;
    if (ctx && !has(`${title} ${type} ${handle}`, ctx)) continue;
    if (!best || i < best.i) best = { i, kind };
  }
  if (!has(`${title} ${handle}`, HOME_CTX) && !has(title, NOT_HOME) && !has(title, NOT_GARMENT)) {
    for (const [g, words] of Object.entries(GARMENT_WORDS)) { const i = at(title, words); if (i >= 0 && (!best || i < best.i)) best = { i, kind: 'ropa', garment: g }; }
  }
  if (best) return { kind: best.kind, garment: best.garment || '' };
  for (const [kind, words, ctx, excl] of RULES) if (has(type, words) && !(excl && has(`${title} ${type}`, excl)) && (!ctx || has(`${title} ${type} ${handle}`, ctx))) return { kind, garment: '' };
  return { kind: 'otro', garment: '' };
}

/* ---------- prompts (solo palabras de listas fijas: nada del cliente entra crudo al prompt) ---------- */
const COLORS: [RegExp, string][] = [
  [/vino ?tinto|vinotinto|burdeos|borgo/, 'burgundy'], [/palo de rosa/, 'dusty pink'], [/azul (oscuro|marino|navy)|navy/, 'navy blue'], [/azul rey/, 'royal blue'],
  [/gris (oscuro|plomo|raton|ratón)|grafito|carb[oó]n/, 'neutral charcoal gray (no blue tint)'], [/gris claro|perla/, 'neutral light gray (no blue tint)'], [/turque[sz]a/, 'turquoise'], [/fucsia/, 'fuchsia'],
  [/mostaza/, 'mustard yellow'], [/terracota/, 'terracotta'], [/lila|lavanda/, 'lilac'], [/morad|violeta|p[uú]rpura/, 'purple'],
  [/menta/, 'mint green'], [/verde (oliva|militar)/, 'olive green'], [/verde/, 'green'], [/celeste|azul cielo/, 'light blue'], [/azul/, 'blue'],
  [/rosad|rosa/, 'pink'], [/roj/, 'red'], [/naranja/, 'orange'], [/amarill/, 'yellow'], [/dorad/, 'gold'], [/platead|plata/, 'silver'],
  [/beige|arena/, 'beige'], [/crema|hueso|marfil/, 'cream'], [/caf[eé]|marr[oó]n|chocolate/, 'brown'], [/camel/, 'camel'],
  [/negr/, 'black'], [/blanc/, 'white'], [/gris/, 'neutral gray (no blue tint)'],
];
// Color del producto: solo la parte antes de «+» (ej. «NEGRA + SÁBANA GRIS CLARO» → negra) y en el orden en que aparece
// (bicolor «VINO TINTO-BEIGE» → burgundy and beige). Si no hay color reconocible no se manda color.
function colorEn(s: string) {
  const seg = s.toLowerCase().split('+')[0];
  const hits: { i: number; e: number; en: string; k: number }[] = [];
  COLORS.forEach(([r, en], k) => { const g = new RegExp(r.source, 'g'); let m: RegExpExecArray | null; while ((m = g.exec(seg))) { hits.push({ i: m.index, e: m.index + m[0].length, en, k }); if (!m[0].length) g.lastIndex++; } });
  hits.sort((a, b) => a.i - b.i || a.k - b.k);
  const out: string[] = []; let end = -1;
  for (const h of hits) { if (h.i < end) continue; if (!out.includes(h.en)) out.push(h.en); end = h.e; if (out.length === 2) break; }
  return out.join(' and ');
}

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
const BED = 'Keep the bed frame, headboard, nightstands and lamps of image 1 exactly as they are; do not copy the headboard, bed base, furniture or room from image 2.';
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
      return `Replace the curtains on the window in image 1 with the exact curtains${c} from image 2: same color, same fabric, same opacity (if image 2 shows blackout fabric, they are fully opaque), same pattern and pleats, hanging from the rod down to the same length with natural vertical folds. If the window has no curtains, hang them from a rod above the window. ${KEEP} ${CLEAN} ${PHOTO}`;
    case 'mantel':
      return `First remove any table runner, placemats or old tablecloth from the table in image 1. Then cover the table with the exact tablecloth${c} from image 2 only: same color, same pattern at the same scale, draping evenly over the table edges with natural folds; do not mix in patterns from image 1. Keep any objects already on the table, and do not add plates, glasses, food or decorations that are not in image 1. ${KEEP} ${CLEAN} ${PHOTO}`;
    case 'forro':
      return `Cover the chairs or the sofa in image 1 with the exact fitted covers${c} from image 2: same color, same print and fabric, snug fit with natural folds. Only the covered furniture changes: do not add a tablecloth, dishes, a Christmas tree or any decoration from image 2. ${KEEP} ${CLEAN} ${PHOTO}`;
    case 'mueble':
      return `Place the exact product${c} from image 2 into the space in image 1 where it naturally belongs, at a realistic real-world size, standing firmly on the floor against a wall (or mounted on the wall if it is a wall item), never floating, with correct perspective, contact shadows and lighting that match image 1. Show only one unit of the product. ${KEEP} ${CLEAN} Photorealistic smartphone photo, natural colors.`;
    case 'ropa': {
      const g = GARMENTS[garment] || GARMENTS.camiseta;
      const other = g.zone === 'top' ? 'pants, shoes' : g.zone === 'bottom' ? 'top, shoes' : 'shoes';
      return `Dress the person in image 1 with the exact ${g.en}${c} shown in image 2: same color, same fabric, same print, graphics and logo placement, natural fit for this body with realistic folds and wrinkles. Keep the person's face, identity, hair, skin tone, body shape, pose, hands, ${other}, background and lighting exactly the same as image 1. Ignore any model, mannequin, text or background in image 2. Photorealistic photo, natural colors.`;
    }
    default: // edredón, colcha, plumón, cubrelecho
      return `Replace the bedding on the bed in image 1 with the exact comforter or bedspread${c} from image 2 and matching pillow shams: same color, same print or pattern at the same scale, same quilting and thickness, laid neatly over the whole bed with natural drape and folds hanging over the sides. ${BED} ${KEEP} ${CLEAN} ${PHOTO}`;
  }
}

/* ---------- catálogo: el servidor resuelve el producto (no confía en el navegador) ---------- */
const PCACHE = new Map<string, { t: number; v: any }>();
async function productJson(shop: string, handle: string) {
  const k = `${shop}/${handle}`, c = PCACHE.get(k);
  if (c && Date.now() - c.t < 600_000) return c.v;
  const r = await fetch(`https://${shop}/products/${handle}.js`, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(8000) }).catch(() => null);
  if (!r?.ok) return null;
  const fin = new URL(r.url);
  if (fin.protocol !== 'https:' || !shopHost(fin.hostname)) return null;
  const v = await r.json().catch(() => null);
  if (!v?.id || !Array.isArray(v.variants)) return null;
  if (PCACHE.size > 300) PCACHE.clear();
  PCACHE.set(k, { t: Date.now(), v });
  return v;
}
const imgKey = (u: string) => { try { const x = new URL(u.startsWith('//') ? 'https:' + u : u); return (x.hostname.replace(/^www\./, '') + x.pathname).toLowerCase(); } catch { return ''; } };
function productImageUrl(p: any, wanted: string) {
  const list: string[] = [...(p.images || []), ...(p.variants || []).map((v: any) => v?.featured_image?.src), ...(p.media || []).map((m: any) => m?.src || m?.preview_image?.src)]
    .filter((u: unknown) => typeof u === 'string' && u);
  const want = imgKey(wanted);
  const hit = want && list.find((u) => imgKey(u) === want);
  if (!hit) return null;
  const url = new URL(hit.startsWith('//') ? 'https:' + hit : hit);
  url.search = ''; url.searchParams.set('width', '512'); url.searchParams.set('height', '512');
  return url;
}
async function productBlob(url: URL) {
  if (url.protocol !== 'https:' || !shopHost(url.hostname)) return null;
  const r = await fetch(url, { headers: { accept: 'image/jpeg,image/png;q=0.9' }, redirect: 'manual', signal: AbortSignal.timeout(12000) }).catch(() => null);
  if (!r?.ok) return null;
  const type = (r.headers.get('content-type') || '').split(';')[0];
  if (!/^image\/(jpeg|png|webp)$/.test(type)) return null;
  const b = new Uint8Array(await r.arrayBuffer()); if (b.length > 8e6) return null;
  return new Blob([b], { type });
}
function b64ToBytes(b64: string) { const bin = atob(b64); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
function dataUrlBlob(d: string, max: number) {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(d || '');
  if (!m) return null; const bytes = b64ToBytes(m[2]); if (bytes.length > max || bytes.length < 2000) return null;
  return new Blob([bytes], { type: m[1] });
}
// Salida: lado mayor de 1024 px, mismas proporciones que la foto recibida (la app manda 512 px → sale el doble exacto)
function outSize(w: number, h: number) {
  if (!(w > 0 && h > 0)) return [768, 1024];
  const k = 1024 / Math.max(w, h); const r16 = (v: number) => Math.min(1024, Math.max(256, Math.round((v * k) / 16) * 16));
  return [r16(w), r16(h)];
}

/* ---------- moderación de fotos de personas (Cloudflare Moondream), en paralelo con la generación ---------- */
const MOD_Q = 'Look at the image and answer with JSON only, no other text: {"person": true or false, "minor": true or false, "nudity_or_underwear": true or false}. "minor" is true if any person looks younger than 18. "nudity_or_underwear" is true if anyone is nude, topless, or shown in underwear, lingerie or swimwear.';
async function moderar(sec: Record<string, string>, photo: string) {
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${sec.VTO_CF_ACCOUNT_ID}/ai/run/@cf/moondream/moondream3.1-9B-A2B`, {
    method: 'POST', headers: { authorization: `Bearer ${sec.VTO_CF_API_TOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify({ task: 'query', image: photo, question: MOD_Q, reasoning: false, max_tokens: 80, temperature: 0 }), signal: AbortSignal.timeout(25000),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error('moderacion ' + r.status + ' ' + JSON.stringify(j?.errors || '').slice(0, 200));
  const res = j?.result, txt = typeof res === 'string' ? res : String(res?.answer ?? res?.response ?? res?.text ?? JSON.stringify(res ?? ''));
  const m = /\{[\s\S]*?\}/.exec(txt); if (!m) throw new Error('moderacion_formato ' + txt.slice(0, 120));
  const o = JSON.parse(m[0]);
  return { bloquear: o.minor === true || o.nudity_or_underwear === true, persona: o.person === true, o };
}

async function avisoUnaVezAlDia(clave: string, mensaje: string) {
  const { data: n } = await sb.rpc('vto_add', { p_key: `aviso:${clave}:${utcDay()}`, p_n: 1 });
  if (n === 1) await sb.from('slack_cola').insert({ tipo: 'parte', destino: 'dm_ceo', empresa: 'zynex', origen: 'probador', mensaje });
}

/* ---------- acciones ---------- */
async function actionAI(body: any, req: Request) {
  const sec = await secrets(); if (!sec.VTO_CF_API_TOKEN) return [503, { error: 'ia_no_configurada' }];
  const tenant = slug(body.tenant); if (!tenant) return [400, { error: 'tienda_requerida' }];
  const { data: t } = await sb.from('vto_tenants').select('id, shop_domain, plan, estado, config').eq('id', tenant).maybeSingle();
  if (!t) return [404, { error: 'tienda_no_registrada' }];
  const tokId = await tokOk(sec.VTO_SALT || 'x', tenant, body.tok);
  if (!tokId) return [401, { error: 'sesion_invalida' }];
  const shop = t.plan === 'demo' ? shopHost(body.shop) : shopHost(t.shop_domain);
  const handle = handleOk(body.handle);
  if (!shop || !handle) return [400, { error: 'producto_invalido' }];
  const p = await productJson(shop, handle);
  if (!p) return [404, { error: 'producto_no_encontrado' }];
  const { kind, garment } = kindOf(p);
  if (kind === 'bloqueado') return [422, { error: 'prenda_no_permitida' }];
  if (kind === 'otro') return [422, { error: 'producto_sin_probador' }];
  const moderacion = sec.VTO_MODERACION === 'on';
  if (kind === 'ropa' && !moderacion) return [422, { error: 'ropa_no_disponible' }];
  if (kind === 'ropa' && body.consiento !== true) return [400, { error: 'falta_consentimiento' }];
  const imgUrl = productImageUrl(p, str(body.product, 1200));
  if (!imgUrl) return [400, { error: 'imagen_no_valida' }];
  const values = new Set<string>((p.options || []).flatMap((o: any) => (Array.isArray(o?.values) ? o.values : [])).map((v: unknown) => String(v)));
  const color = values.has(str(body.color, 120)) ? colorEn(str(body.color, 120)) : '';
  const photo = str(body.photo, 6_000_000);
  const room = dataUrlBlob(photo, 4_000_000);
  if (!room) return [400, { error: 'foto_invalida' }];
  const ip = await ipHash(req, sec.VTO_SALT || 'x');
  const { data: take } = await sb.rpc('vto_take2', { p_ip: ip, p_tenant: tenant, p_max_ip: 80, p_tok: tokId, p_max_tok: 15 });
  if (!take?.ok) {
    if (take?.motivo === 'cuota_agotada') await avisoUnaVezAlDia(`cuota-${tenant}`, `🟠 Probador IA: la tienda "${tenant}" se quedó sin pruebas del mes. El botón se oculta solo hasta que suba de plan.`);
    return [429, { error: take?.motivo || 'limite' }];
  }
  const t0 = Date.now(); let ok = false, err = '', n = 1;
  try {
    const prod = await productBlob(imgUrl);
    if (!prod) { err = 'producto_sin_imagen'; return [400, { error: err }]; }
    const [W, H] = outSize(+body.w, +body.h);
    const prompt = buildPrompt(kind, garment, color);
    // Mejor de 2: dos versiones en paralelo y la app se queda con la más fiel. Con el cupo gratis de Cloudflare
    // se usa 1 sola versión cuando el día pasa de VTO_N2_MAX_DIA imágenes (por defecto 70).
    const dia = utcDay(), maxN2 = Number(sec.VTO_N2_MAX_DIA) || 70;
    const { data: imgsHoy } = await sb.rpc('vto_add', { p_key: `imgs:${dia}`, p_n: 0 });
    n = Math.min(2, Math.max(1, Math.floor(+body.n) || 1)); if ((imgsHoy ?? 0) >= maxN2) n = 1;
    const once = async () => {
      const fd = new FormData();
      fd.append('prompt', prompt); fd.append('width', String(W)); fd.append('height', String(H));
      fd.append('input_image_0', room, 'foto.jpg'); fd.append('input_image_1', prod, 'producto.jpg');
      const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${sec.VTO_CF_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-2-klein-4b`, {
        method: 'POST', headers: { authorization: `Bearer ${sec.VTO_CF_API_TOKEN}` }, body: fd, signal: AbortSignal.timeout(60000),
      });
      const j = await r.json().catch(() => ({}));
      const img: string | undefined = j?.result?.image;
      if (!r.ok || !img) throw new Error(`cf ${r.status} ${JSON.stringify(j?.errors || j).slice(0, 300)}`);
      const mime = img.startsWith('iVBOR') ? 'image/png' : img.startsWith('UklGR') ? 'image/webp' : 'image/jpeg';
      return `data:${mime};base64,${img}`;
    };
    const modP = kind === 'ropa' ? moderar(sec, photo).catch((e) => ({ error: String((e as Error)?.message || e) })) : Promise.resolve(null);
    const [runs, mod] = await Promise.all([Promise.allSettled(Array.from({ length: n }, once)), modP]);
    if (kind === 'ropa') {
      if (!mod || 'error' in mod) { err = 'moderacion_no_disponible'; console.error('mod', mod); return [503, { error: err }]; }
      if (mod.bloquear) { err = 'foto_no_permitida'; ok = true; return [422, { error: err }]; } // cuenta como prueba: no se devuelve
    }
    const images = runs.flatMap((x) => (x.status === 'fulfilled' ? [x.value] : []));
    if (!images.length) {
      const msg = runs.map((x) => (x.status === 'rejected' ? String((x.reason as Error)?.name === 'TimeoutError' ? 'TimeoutError' : (x.reason as Error)?.message || x.reason) : '')).join(' | ');
      err = /4006|neuron|allocation/i.test(msg) ? 'ia_cupo_diario' : /3030|flagged/i.test(msg) ? 'ia_rechazo' : /TimeoutError/.test(msg) ? 'ia_tiempo' : 'ia_fallo';
      console.error('cf', msg);
      if (err === 'ia_cupo_diario') await avisoUnaVezAlDia('cupo-cf', '🔴 Probador IA sin cupo hoy: se acabaron las 10.000 neuronas gratis de Cloudflare. Vuelve a las 7:00 p. m. (Colombia). Para que no se apague: activar Workers Paid (US$5/mes).');
      return [502, { error: err }];
    }
    await sb.rpc('vto_add', { p_key: `imgs:${dia}`, p_n: images.length });
    ok = true;
    return [200, { image: images[0], images, ms: Date.now() - t0, via: 'cf-klein4b', restan: take.restan, restan_sesion: take.restan_sesion, w: W, h: H, kind }];
  } catch (e) {
    err = String((e as Error)?.name === 'TimeoutError' ? 'ia_tiempo' : 'ia_fallo'); console.error('ai', e);
    return [502, { error: err }];
  } finally {
    if (!ok) await sb.rpc('vto_refund2', { p_ip: ip, p_tenant: tenant, p_tok: tokId });
    await sb.from('vto_events').insert({ tenant_id: tenant, tipo: 'ia', handle, categoria: kind, via: 'cf-klein4b', ms: Date.now() - t0, ok: ok && !err, detalle: err ? { error: err } : { n, ...(kind === 'ropa' ? { consentimiento: true } : {}) }, ip_hash: ip, sesion: str(body.sesion, 40) || null });
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
  await sb.from('vto_events').insert({ tenant_id: slug(body.tenant) || null, tipo, handle: handleOk(body.handle) || null, categoria: str(body.categoria, 20) || null, sesion: str(body.sesion, 40) || null, detalle: flat(body.detalle), ip_hash: ip });
  return [200, { ok: true }];
}

async function isShopify(domain: string) {
  try {
    const r = await fetch(`https://${domain}/products.json?limit=1`, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return false; const j = await r.json(); return Array.isArray(j?.products);
  } catch { return false; }
}
async function actionLead(body: any, req: Request) {
  // trampa para robots: campo oculto «web» y menos de 2,5 s llenando el formulario → se responde ok sin hacer nada
  if (str(body.web, 200) || (Number(body.ms) > 0 && Number(body.ms) < 2500)) return [200, { ok: true, tienda: null, shopify: false }];
  const sec = await secrets();
  const nombre = str(body.nombre, 80), empresa = str(body.empresa, 100), email = str(body.email, 120).toLowerCase();
  const whatsapp = str(body.whatsapp, 30).replace(/[^\d+]/g, '');
  const tienda = shopHost(body.tienda);
  const plan = str(body.plan, 30), mensaje = str(body.mensaje, 600);
  if (!nombre || (!whatsapp && !email)) return [400, { error: 'faltan_datos' }];
  if (email && !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(email)) return [400, { error: 'email_invalido' }];
  if (whatsapp && whatsapp.replace(/\D/g, '').length < 7) return [400, { error: 'whatsapp_invalido' }];
  if (str(body.tienda, 120) && !tienda) return [400, { error: 'tienda_invalida' }];
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
    mensaje: `🟢 Lead nuevo · Probador IA\n${empresa || nombre}${tienda ? ` (${tienda})` : ''} — ${nombre}\nWhatsApp: ${whatsapp || '—'} · Email: ${email || '—'} · Plan: ${plan || '—'}${tenantInfo?.nuevo ? `\nTienda "${tenantInfo.id}" creada: la prueba de 14 días (100 fotos) arranca cuando el botón cargue en ${tienda}.` : ''}\nPróximo paso: escribirle en menos de 1 hora.`,
  });
  return [200, { ok: true, tienda: tenantInfo ? { id: tenantInfo.id, nuevo: tenantInfo.nuevo, estado: tenantInfo.estado, cuota: tenantInfo.cuota, vence: tenantInfo.vence, panel_key: tenantInfo.panel_key || null } : null, shopify: !!tenantInfo }];
}

const SELLO = new Set(['prueba', 'gratis', 'basico', 'demo', 'interno']);
const KIT = new Set(['prueba', 'crecimiento', 'escala', 'interno']);
async function actionCfg(body: any, req: Request) {
  const id = slug(body.tenant); if (!id) return [400, { error: 'tienda' }];
  const sec = await secrets(); const ip = await ipHash(req, sec.VTO_SALT || 'x');
  const { data: okRate } = await sb.rpc('vto_rate', { p_key: ip + '#cfg', p_max: 300 });
  if (okRate === false) return [429, { error: 'limite' }];
  const { data: t } = await sb.from('vto_tenants').select('id, shop_domain, plan, estado, config').eq('id', id).maybeSingle();
  if (!t) return [404, { error: 'tienda_no_registrada' }];
  const wa = /^\d{8,15}$/.test(String(t.config?.whatsapp || '')) ? String(t.config.whatsapp) : null;
  return [200, {
    id: t.id, dominio: t.plan === 'demo' ? null : t.shop_domain, activo: t.estado === 'activo', estado: t.estado,
    sello: SELLO.has(t.plan), kit: KIT.has(t.plan), wa, cod: t.config?.cod === true, ropa: sec.VTO_MODERACION === 'on', tok: await newTok(sec.VTO_SALT || 'x', t.id),
  }];
}

// Lo llama el botón desde la página de la tienda (CORS abierto solo para esta acción): activa la prueba y dice si mostrar el botón
async function actionEstado(body: any, req: Request, origin: string | null) {
  const id = slug(body.tenant); if (!id) return [400, { error: 'tienda' }];
  let host = ''; try { host = origin ? new URL(origin).hostname : ''; } catch { host = ''; }
  const sec = await secrets(); const ip = await ipHash(req, sec.VTO_SALT || 'x');
  const { data: okRate } = await sb.rpc('vto_rate', { p_key: ip + '#estado', p_max: 500 });
  if (okRate === false) return [429, { error: 'limite' }];
  const { data } = await sb.rpc('vto_activar', { p_tenant: id, p_host: host });
  if (data?.activado) await sb.from('slack_cola').insert({ tipo: 'parte', destino: 'dm_ceo', empresa: 'zynex', origen: 'probador', mensaje: `🟢 Probador IA instalado: la tienda "${id}" (${host}) activó su prueba de 14 días con 100 fotos.` });
  return [200, { mostrar: !!(data?.ok && data.activo && data.cupo > 0), activado: !!data?.activado }];
}

async function actionStats(body: any) {
  const { data } = await sb.rpc('vto_stats', { p_tenant: slug(body.tenant), p_key: str(body.key, 80) });
  if (!data?.ok) return [403, { error: 'llave_invalida' }];
  return [200, data];
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: headersFor(origin) });
  if (req.method !== 'POST') return new Response(JSON.stringify({ ok: true, servicio: 'zynex-probador' }), { status: 200, headers: headersFor(origin) });
  const len = +(req.headers.get('content-length') || 0);
  if (len > 7_000_000) return new Response(JSON.stringify({ error: 'muy_grande' }), { status: 413, headers: headersFor(origin) });
  let raw = '', body: any;
  try { raw = await req.text(); } catch { raw = ''; }
  if (raw.length > 7_000_000) return new Response(JSON.stringify({ error: 'muy_grande' }), { status: 413, headers: headersFor(origin) });
  try { body = JSON.parse(raw); } catch { return new Response(JSON.stringify({ error: 'json' }), { status: 400, headers: headersFor(origin) }); }
  const open = body?.action === 'estado';
  const h = headersFor(origin, open);
  if (!open && !originOk(origin)) return new Response(JSON.stringify({ error: 'origen_no_permitido' }), { status: 403, headers: h });
  let out: [number, unknown];
  try {
    switch (body?.action) {
      case 'ai': out = await actionAI(body, req) as [number, unknown]; break;
      case 'event': out = await actionEvent(body, req) as [number, unknown]; break;
      case 'lead': out = await actionLead(body, req) as [number, unknown]; break;
      case 'stats': out = await actionStats(body) as [number, unknown]; break;
      case 'cfg': out = await actionCfg(body, req) as [number, unknown]; break;
      case 'estado': out = await actionEstado(body, req, origin) as [number, unknown]; break;
      default: out = [400, { error: 'accion' }];
    }
  } catch (e) { console.error('vto', e); out = [500, { error: 'interno' }]; }
  return new Response(JSON.stringify(out[1]), { status: out[0], headers: h });
});
