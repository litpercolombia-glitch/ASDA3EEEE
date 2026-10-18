// GET /api/kit?shop=tienda.com&handle=producto → productos que completan la compra (cama, ventana, mesa o look).
import { json, q, shopHost, handleOk, getJSON, img, kindOf } from './_util.js';

const PAIRS = {
  protector: ['sabanas', 'almohada', 'edredon', 'cobija'], sabanas: ['protector', 'almohada', 'edredon', 'cobija'],
  edredon: ['sabanas', 'protector', 'almohada', 'cobija'], cobija: ['sabanas', 'protector', 'almohada', 'edredon'],
  almohada: ['protector', 'sabanas', 'edredon'], cortina: ['sabanas', 'edredon', 'cobija'], mantel: ['forro', 'cortina'],
  forro: ['mantel', 'cortina'], mueble: ['mueble'], ropa: ['ropa'],
};
// Combos y paquetes (dúo, trío, kit, x2, «paga 1 lleva 2»…) piden elegir cada unidad en su ficha: no se sugieren en el kit
const COMBO = /(^|[^a-z])(duo|trio|combo|kit|pack|packs|paquete|juegos|set de \d)([^a-z]|$)|(^|[^a-z0-9])x ?[2-9]([^0-9]|$)|\d+ ?x ?\d|paga \d+ y? ?lleva|lleva(te)? \d+|a elegir/;
const sinTilde = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
// Espacios: zapatero con clóset y entrada; estante de baño con baño (no mezclar)
const ZONA_MUEBLE = (t) => /ba[nñ]o|inodoro|ducha|toalla/i.test(t) ? 'bano' : /zapat|closet|cl[oó]set|armario|perchero|entrada|ropa/i.test(t) ? 'ropa' : /cocina|alacena|especiero/i.test(t) ? 'cocina' : 'otro';
const ZONE = { camiseta: 'top', polo: 'top', camisa: 'top', blusa: 'top', buzo: 'top', hoodie: 'top', saco: 'top', chaqueta: 'top', chaleco: 'top', top: 'top', pantalon: 'bottom', jean: 'bottom', sudadera: 'bottom', jogger: 'bottom', falda: 'bottom', short: 'bottom' };

export default async function handler(req, res) {
  res.setHeader('access-control-allow-origin', '*');
  const shop = shopHost(q(req, 'shop')), handle = q(req, 'handle').toLowerCase();
  if (!shop || !handleOk(handle)) return json(res, 400, { error: 'datos_invalidos' });
  try {
    const all = (await getJSON(`https://${shop}/products.json?limit=250`)).products || [];
    const info = (p) => kindOf({ type: p.product_type, title: p.title, handle: p.handle, tags: typeof p.tags === 'string' ? p.tags.split(',') : p.tags });
    const me = all.find((p) => p.handle === handle); if (!me) return json(res, 200, { items: [] }, 'public, s-maxage=600');
    // si el producto principal es un combo, su ficha pide cada unidad: el kit no se ofrece (se compraría por el carrito)
    if (COMBO.test(sinTilde(me.title))) return json(res, 200, { for: handle, items: [], motivo: 'combo' }, 'public, s-maxage=900');
    const mi = info(me), want = PAIRS[mi.kind] || [], out = [];
    for (const k of want) {
      const cands = all.filter((p) => p.handle !== handle && !out.some((o) => o.handle === p.handle) && p.images?.length && p.variants?.some((v) => v.available)).filter((p) => {
        const i = info(p); if (i.kind !== k) return false;
        if (COMBO.test(sinTilde(p.title))) return false;
        if (k === 'mueble' && ZONA_MUEBLE(p.title) !== ZONA_MUEBLE(me.title)) return false;
        if (k === 'ropa') { const a = ZONE[mi.garment] || 'full', b = ZONE[i.garment] || 'full'; return a !== b && a !== 'full' && b !== 'full'; }
        return true;
      });
      const p = cands.sort((a, b) => b.variants.length - a.variants.length)[0];
      if (!p) continue;
      out.push({
        handle: p.handle, title: p.title, kind: k, url: `https://${shop}/products/${p.handle}`, image: img(p.images[0].src, 240),
        variants: p.variants.slice(0, 120).map((v) => ({ id: v.id, title: v.title, options: [v.option1, v.option2, v.option3].filter(Boolean), price: Math.round(parseFloat(v.price) * 100) / 100, available: v.available, image: img(v.featured_image?.src, 240) })),
      });
      if (out.length >= 3) break;
    }
    json(res, 200, { for: handle, kind: mi.kind, items: out }, 'public, s-maxage=900, stale-while-revalidate=86400');
  } catch { json(res, 200, { items: [] }, 'public, s-maxage=120'); }
}
