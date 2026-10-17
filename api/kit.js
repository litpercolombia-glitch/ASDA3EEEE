// "Completa tu cama": productos de litper.store que combinan con el que el cliente se probó (solo lectura, sin credenciales).
import { json } from './_util.js';
const SHOP = process.env.SHOP_URL || 'https://litper.store';
const group = (p) => {
  const t = `${p.product_type} ${p.title} ${p.handle}`.toLowerCase();
  if (/almohada/.test(t)) return 'almohada';
  if (/protector/.test(t)) return 'protector';
  if (/s[aá]bana/.test(t)) return 'sabanas';
  if (/edred|plum|colcha/.test(t)) return 'edredon';
  if (/velo/.test(t) && !/cortina/.test(t)) return 'velo';
  if (/cortina/.test(t)) return 'cortina';
  if (/cobija|manta/.test(t)) return 'cobija';
  if (/mantel/.test(t)) return 'mantel';
  if (/forro/.test(t)) return 'forro';
  return 'otro';
};
const sized = (u) => (u ? u + (u.includes('?') ? '&' : '?') + 'width=200' : null);
const PAIRS = {
  protector: ['sabanas', 'almohada', 'edredon', 'cobija'], sabanas: ['protector', 'almohada', 'edredon', 'cobija'],
  edredon: ['sabanas', 'protector', 'almohada', 'cobija'], cobija: ['sabanas', 'protector', 'almohada', 'edredon'],
  cortina: ['velo', 'sabanas', 'protector'], velo: ['cortina', 'sabanas'], mantel: ['forro', 'cortina'], forro: ['mantel', 'cortina'],
  otro: ['protector', 'sabanas', 'almohada'],
};
export default async function handler(req, res) {
  const handle = String(req.query?.handle || new URL(req.url, 'http://x').searchParams.get('handle') || '').toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{0,150}$/.test(handle)) return json(res, 400, { error: 'handle_invalido' });
  try {
    const r = await fetch(`${SHOP}/products.json?limit=250`, { headers: { accept: 'application/json' } });
    if (!r.ok) return json(res, 502, { error: 'tienda_no_responde' });
    const all = (await r.json()).products || [];
    const me = all.find((p) => p.handle === handle) || { product_type: '', title: handle, handle };
    const want = PAIRS[group(me)] || PAIRS.otro, out = [];
    for (const g of want) {
      const p = all.filter((x) => x.handle !== handle && group(x) === g && !/-1$/.test(x.handle)).sort((a, b) => b.variants.length - a.variants.length)[0];
      if (!p) continue;
      out.push({
        handle: p.handle, title: p.title, group: g, url: `${SHOP}/products/${p.handle}`, image: sized(p.images?.[0]?.src),
        variants: p.variants.slice(0, 100).map((v) => ({ id: v.id, title: v.title, price: Math.round(parseFloat(v.price)), options: [v.option1, v.option2, v.option3].filter(Boolean), available: v.available, image: sized(v.featured_image?.src) })),
      });
    }
    json(res, 200, { for: handle, group: group(me), items: out }, 'public, s-maxage=600, stale-while-revalidate=3600');
  } catch { json(res, 502, { error: 'tienda_no_responde' }); }
}
