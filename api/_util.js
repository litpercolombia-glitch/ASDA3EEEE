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

// Lee JSON público de una tienda. Sigue máximo 3 redirecciones y revalida cada destino (https y dominio público),
// para que una tienda no pueda mandarnos a una red interna (SSRF).
export async function getJSON(url, ms = 9000) {
  const t0 = Date.now(); let u = new URL(url);
  for (let hop = 0; hop < 4; hop++) {
    if (u.protocol !== 'https:' || !shopHost(u.hostname)) { const e = new Error('destino_invalido'); e.status = 400; throw e; }
    const r = await fetch(u, { headers: { accept: 'application/json', 'user-agent': 'ZynexProbador/1.0 (+https://probador.zynexapp.com)' }, redirect: 'manual', signal: AbortSignal.timeout(Math.max(1000, ms - (Date.now() - t0))) });
    if (r.status >= 300 && r.status < 400 && r.headers.get('location')) { u = new URL(r.headers.get('location'), u); continue; }
    if (!r.ok) { const e = new Error('http_' + r.status); e.status = r.status; throw e; }
    const t = await r.text(); if (t.length > 8_000_000) throw new Error('muy_grande');
    return JSON.parse(t);
  }
  const e = new Error('demasiadas_redirecciones'); e.status = 508; throw e;
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

// Qué es el producto: decide el tipo de prueba (v2, 17-oct-2026: palabras completas, contexto obligatorio y exclusiones;
// probado con 3.000+ productos de 17 tiendas colombianas: evita «protector de pantalla», «cortina de luces», «silla plegable», etc.)
const normw = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ]+/g, ' ').trim();
const has = (t, words) => new RegExp(`(^| )(${words})( |$)`).test(t);
const at = (t, words) => { const m = new RegExp(`(^| )(${words})( |$)`).exec(t); return m ? m.index : -1; };
const BLOCKED = 'ropa interior|brasier|brasieres|bra|sosten|panty|pantys|tanga|tangas|boxer|boxers|calzon|calzones|calzoncillo|calzoncillos|lenceria|bikini|bikinis|traje de bano|vestido de bano|banador|trusa|cachetero|bodysuit|body|faja|fajas|moldeador|moldeadora|shapewear|levanta gluteos|levanta cola|erotico|erotica|erotic|sexual|intimo|intima|sex|tanguita|hilo dental|lingerie|underwear|swimsuit|swimsuits|swimwear|thong|thongs|briefs|panties|negligee|nightie';
// Solo para ropa (en hogar «transparente» o «malla» son normales: mantel transparente, organizador de malla)
const BLOCKED_ROPA = 'sexy|transparente|transparentes|transparencia|transparencias|bralette|bralettes|babydoll|baby doll|corset|corsets|corse|corses|corpino|liguero|ligueros|camison|camisones|malla|mallas|encaje|encajes|infantil|infantiles|nino|nina|ninos|ninas|bebe|bebes|bebito|bebita|kids|kid|juvenil|escolar|colegial|colegio|preescolar|primaria|girls|girl|boys|boy|baby|babies|teen|teens|toddler|toddlers|junior|juniors|adolescente|adolescentes|infante|infantes|chicos|nene|nena|nenes|nenas|peques|recien nacido|youth|little|menor|menores|pequenos|pequenas|chiquito|chiquitos|chiquita|chiquitas|anos|meses|encaje transparente';
const NOT_HOME = 'pantalla|screen|celular|iphone|samsung|xiaomi|telefono|movil|camara|lente|lentes|solar|vidrio|templado|carro|auto|moto|vehiculo|parlante|cargador|bateria|audifonos|reloj|tablet|laptop|portatil|consola|perro|gato|mascota|bebe';
const RULES = [ // [kind, palabras que lo identifican, contexto requerido (opcional), exclusiones]
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
const GARMENTS = { camiseta: 'camiseta|camisetas|t shirt|tshirt|polo|polos', camisa: 'camisa|camisas', blusa: 'blusa|blusas', buzo: 'buzo|buzos|hoodie|hoodies|sudadera con capota', saco: 'saco|sacos|sueter|sueteres|cardigan', chaqueta: 'chaqueta|chaquetas|chaqueton|abrigo|parka', chaleco: 'chaleco|chalecos', top: 'top|tops|crop top', pantalon: 'pantalon|pantalones|palazzo', jean: 'jean|jeans', sudadera: 'sudadera|sudaderas|jogger|joggers', falda: 'falda|faldas', short: 'short|shorts|bermuda|bermudas', vestido: 'vestido|vestidos', enterizo: 'enterizo|enterizos|jumpsuit|overol', pijama: 'pijama|pijamas', conjunto: 'conjunto deportivo|conjunto de ropa|conjunto casual|conjunto de dos piezas' };
const HOME_CTX = 'comedor|cama|mesa|silla|sillas|ventana|colchon|sofa|hogar|casa|cocina|bano|sala|habitacion|cuarto|puerta';
const NOT_GARMENT = 'percha|perchas|gancho|ganchos|organizador|mascota|mascotas|perro|perros|gato|gatos|salvavidas|oil|aceite|crema|serum|celulitis|medias|lavadora|plancha|corrector|postura|lastrado|fitness|faja';
export function kindOf(p) {
  const title = normw(p.title), type = normw(p.type || p.product_type), handle = normw(p.handle), tags = normw([].concat(p.tags || []).join(' '));
  const all = `${type} ${title} ${handle} ${tags}`;
  if (has(all, BLOCKED)) return { kind: 'bloqueado', garment: null };
  let best = null;
  for (const [kind, words, ctx, excl] of RULES) {
    const i = at(title, words); if (i < 0) continue;
    if (excl && has(`${title} ${type}`, excl)) continue;
    if (ctx && !has(`${title} ${type} ${handle}`, ctx)) continue;
    if (!best || i < best.i) best = { i, kind };
  }
  if (!has(`${title} ${handle}`, HOME_CTX) && !has(title, NOT_HOME) && !has(title, NOT_GARMENT)) {
    for (const [g, words] of Object.entries(GARMENTS)) { const i = at(title, words); if (i >= 0 && (!best || i < best.i)) best = { i, kind: 'ropa', garment: g }; }
  }
  if (best && best.kind === 'ropa' && has(all, BLOCKED_ROPA)) return { kind: 'bloqueado', garment: null };
  if (best) return { kind: best.kind, garment: best.garment || null };
  // sin palabra en el título: miramos el tipo de producto con las mismas reglas
  for (const [kind, words, ctx, excl] of RULES) if (has(type, words) && !(excl && has(`${title} ${type}`, excl)) && (!ctx || has(`${title} ${type} ${handle}`, ctx))) return { kind, garment: null };
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

// Busca la foto que corresponde a un valor (ej. "6 DORADO" → ...-dorado.jpg) cuando la variante no trae imagen.
// v2 (17-oct-2026): pesa más las palabras raras (las que distinguen un diseño de otro), descarta fotos con un color
// que contradice al valor y, si hay empate, no adivina (devuelve null → el probador no ofrece ese diseño).
const COLOR_WORDS = ['rojo', 'roja', 'azul', 'gris', 'rosa', 'rosado', 'dorado', 'dorada', 'blanco', 'blanca', 'negro', 'negra', 'verde', 'beige', 'crema', 'vino', 'morado', 'lila', 'fucsia', 'turquesa', 'turqueza', 'naranja', 'amarillo', 'cafe', 'plateado', 'plata'];
const STOP = ['con', 'para', 'del', 'las', 'los', 'navidad', 'navideno', 'premium', 'x'];
const wordsOf = (v) => norm(v).replace(/[^a-z ]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.includes(w));
export function imageForValue(value, images, allValues = []) {
  const words = wordsOf(value); if (!words.length) return null;
  const df = (w) => Math.max(1, allValues.filter((v) => wordsOf(v).includes(w)).length);
  const myColors = words.filter((w) => COLOR_WORDS.includes(w));
  let best = null, bs = 0, tie = false;
  for (const u of images) {
    const f = norm(decodeURIComponent((u.split('/').pop() || '').split('?')[0])).replace(/[^a-z]+/g, ' ');
    const fw = f.split(' ');
    const fColors = fw.filter((w) => COLOR_WORDS.includes(w));
    if (myColors.length && fColors.length && !fColors.some((c) => myColors.some((m) => m.slice(0, 4) === c.slice(0, 4)))) continue; // color que no corresponde
    const sc = words.reduce((a, w) => a + (fw.includes(w) ? 1 / df(w) : 0), 0);
    if (sc > bs + 1e-9) { bs = sc; best = u; tie = false; } else if (sc > 0 && Math.abs(sc - bs) < 1e-9) tie = true;
  }
  return tie ? null : best;
}
