// GET /api/tienda?shop=tienda.com → productos que se pueden probar (para la demo de la landing y el selector).
import { json, q, shopHost, getJSON, shopMeta, img, kindOf } from './_util.js';

export default async function handler(req, res) {
  const shop = shopHost(q(req, 'shop'));
  if (!shop) return json(res, 400, { error: 'tienda_invalida' });
  try {
    const [d, meta] = await Promise.all([getJSON(`https://${shop}/products.json?limit=250`), shopMeta(shop)]);
    if (!Array.isArray(d?.products)) return json(res, 422, { error: 'no_es_shopify' });
    const items = [];
    for (const p of d.products) {
      const im = p.images?.[0]?.src; if (!im) continue;
      const { kind } = kindOf({ type: p.product_type, title: p.title, handle: p.handle, tags: typeof p.tags === 'string' ? p.tags.split(',') : p.tags });
      if (kind === 'otro' || kind === 'bloqueado') continue;
      const v = p.variants?.[0];
      items.push({ handle: p.handle, title: p.title, kind, image: img(im, 480), price: v ? Math.round(parseFloat(v.price) * 100) / 100 : null });
    }
    // primero lo más vistoso para probar: cama y ventanas, luego ropa y el resto
    const order = { protector: 0, edredon: 1, sabanas: 2, cobija: 3, cortina: 4, ropa: 5, mantel: 6, forro: 7, almohada: 8, mueble: 9 };
    items.sort((a, b) => (order[a.kind] ?? 9) - (order[b.kind] ?? 9));
    json(res, 200, { shop, shopName: meta.name, currency: meta.currency, total: d.products.length, items: items.slice(0, 48) }, 'public, s-maxage=900, stale-while-revalidate=86400');
  } catch (e) {
    json(res, e.status === 404 ? 422 : 502, { error: e.status === 404 ? 'no_es_shopify' : 'tienda_no_responde' });
  }
}
