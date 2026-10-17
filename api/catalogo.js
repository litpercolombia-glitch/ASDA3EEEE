// Lee un producto público de la tienda Shopify por su handle (sin credenciales).
import { json } from './_util.js';
const SHOP = process.env.SHOP_URL || 'https://litper.store';
export default async function handler(req, res) {
  const handle = String(req.query?.handle || new URL(req.url, 'http://x').searchParams.get('handle') || '').toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{0,150}$/.test(handle)) return json(res, 400, { error: 'handle_invalido' });
  try {
    const r = await fetch(`${SHOP}/products/${handle}.js`, { headers: { accept: 'application/json' } });
    if (!r.ok) return json(res, 404, { error: 'no_existe' });
    const p = await r.json();
    const img = (u) => (u ? (u.startsWith('//') ? 'https:' + u : u) : null);
    const money = (c) => '$' + Math.round(c / 100).toLocaleString('es-CO');
    json(res, 200, {
      handle: p.handle, title: p.title, type: p.type, url: `${SHOP}/products/${p.handle}`,
      priceText: money(p.price), images: (p.images || []).map(img).slice(0, 20),
      options: (p.options || []).map((o) => ({ name: o.name, values: o.values })),
      variants: (p.variants || []).map((v) => ({ id: v.id, title: v.title, options: v.options || [v.option1, v.option2, v.option3].filter(Boolean), price: v.price, available: v.available, image: img(v.featured_image?.src) })),
    }, 'public, s-maxage=600, stale-while-revalidate=3600');
  } catch { json(res, 502, { error: 'tienda_no_responde' }); }
}
