// GET /api/catalogo?shop=tienda.com&handle=producto → producto normalizado para el probador (catálogo público, sin credenciales).
import { json, q, shopHost, handleOk, getJSON, shopMeta, img, kindOf, optionRoles, imageForValue } from './_util.js';

export default async function handler(req, res) {
  const shop = shopHost(q(req, 'shop')), handle = q(req, 'handle').toLowerCase();
  if (!shop) return json(res, 400, { error: 'tienda_invalida' });
  if (!handleOk(handle)) return json(res, 400, { error: 'producto_invalido' });
  try {
    const [p, meta] = await Promise.all([getJSON(`https://${shop}/products/${handle}.js`), shopMeta(shop)]);
    const images = (p.images || []).map((u) => img(u)).filter(Boolean).slice(0, 40);
    const options = (p.options || []).map((o) => ({ name: o.name, values: o.values || [] }));
    const roles = optionRoles(options);
    const { kind, garment } = kindOf({ type: p.type, title: p.title, handle: p.handle, tags: p.tags });
    const ci = roles.indexOf('color');
    const variants = (p.variants || []).map((v) => {
      const opts = v.options || [v.option1, v.option2, v.option3].filter(Boolean);
      let image = img(v.featured_image?.src);
      if (!image && ci >= 0) image = imageForValue(opts[ci], images);
      return { id: v.id, title: v.title, options: opts, price: Math.round(v.price) / 100, compare: v.compare_at_price ? Math.round(v.compare_at_price) / 100 : null, available: v.available !== false, image: image || images[0] || null };
    });
    json(res, 200, {
      shop, shopName: meta.name, currency: meta.currency,
      handle: p.handle, title: p.title, type: p.type || '', vendor: p.vendor || '', url: `https://${shop}/products/${p.handle}`,
      kind, garment, options: options.map((o, i) => ({ ...o, role: roles[i] })), variants, images,
    }, 'public, s-maxage=600, stale-while-revalidate=86400');
  } catch (e) {
    json(res, e.status === 404 ? 404 : 502, { error: e.status === 404 ? 'no_existe' : 'tienda_no_responde' });
  }
}
