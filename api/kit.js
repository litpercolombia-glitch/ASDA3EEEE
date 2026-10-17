// GET /api/kit?shop=tienda.com&handle=producto → productos que completan la compra (cama, ventana, mesa o look).
import { json, q, shopHost, handleOk, getJSON, img, kindOf } from './_util.js';

const PAIRS = {
  protector: ['sabanas', 'almohada', 'edredon', 'cobija'], sabanas: ['protector', 'almohada', 'edredon', 'cobija'],
  edredon: ['sabanas', 'protector', 'almohada', 'cobija'], cobija: ['sabanas', 'protector', 'almohada', 'edredon'],
  almohada: ['protector', 'sabanas', 'edredon'], cortina: ['sabanas', 'edredon', 'cobija'], mantel: ['forro', 'cortina'],
  forro: ['mantel', 'cortina'], mueble: ['mueble'], ropa: ['ropa'],
};
const ZONE = { camiseta: 'top', polo: 'top', camisa: 'top', blusa: 'top', buzo: 'top', hoodie: 'top', saco: 'top', chaqueta: 'top', chaleco: 'top', top: 'top', pantalon: 'bottom', jean: 'bottom', sudadera: 'bottom', jogger: 'bottom', falda: 'bottom', short: 'bottom' };

export default async function handler(req, res) {
  res.setHeader('access-control-allow-origin', '*');
  const shop = shopHost(q(req, 'shop')), handle = q(req, 'handle').toLowerCase();
  if (!shop || !handleOk(handle)) return json(res, 400, { error: 'datos_invalidos' });
  try {
    const all = (await getJSON(`https://${shop}/products.json?limit=250`)).products || [];
    const info = (p) => kindOf({ type: p.product_type, title: p.title, handle: p.handle, tags: typeof p.tags === 'string' ? p.tags.split(',') : p.tags });
    const me = all.find((p) => p.handle === handle); if (!me) return json(res, 200, { items: [] }, 'public, s-maxage=600');
    const mi = info(me), want = PAIRS[mi.kind] || [], out = [];
    for (const k of want) {
      const cands = all.filter((p) => p.handle !== handle && !out.some((o) => o.handle === p.handle) && p.images?.length && p.variants?.some((v) => v.available)).filter((p) => {
        const i = info(p); if (i.kind !== k) return false;
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
