// GET /api/catalogo?shop=tienda.com&handle=producto → producto normalizado para el probador (catálogo público, sin credenciales).
import { json, q, shopHost, handleOk, getJSON, shopMeta, img, kindOf, optionRoles, imageForValue } from './_util.js';

export default async function handler(req, res) {
  res.setHeader('access-control-allow-origin', '*');
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
    // Cada color o diseño debe tener su foto propia; si no la tiene, el probador no lo ofrece (auditoría A-5)
    const own = new Map(); // valor → url propia
    const variants = (p.variants || []).map((v) => {
      const opts = v.options || [v.option1, v.option2, v.option3].filter(Boolean);
      let image = img(v.featured_image?.src), propia = !!image;
      if (!image && ci >= 0) { image = imageForValue(opts[ci], images, options[ci]?.values || []); propia = !!image; }
      if (ci >= 0 && propia && !own.has(opts[ci])) own.set(opts[ci], image);
      return { id: v.id, title: v.title, options: opts, price: Math.round(v.price) / 100, compare: v.compare_at_price ? Math.round(v.compare_at_price) / 100 : null, available: v.available !== false, image: image || images[0] || null, propia };
    });
    // dos valores distintos con la misma foto: solo cuenta como propia para el que la tiene como foto de variante
    if (ci >= 0) {
      const byUrl = new Map();
      for (const [val, u] of own) byUrl.set(u, (byUrl.get(u) || []).concat(val));
      for (const [u, vals] of byUrl) if (vals.length > 1) {
        const dueño = (p.variants || []).find((v) => img(v.featured_image?.src) === u);
        const keep = dueño ? (dueño.options || [dueño.option1, dueño.option2, dueño.option3])[ci] : null;
        for (const val of vals) if (val !== keep) own.delete(val);
      }
      for (const v of variants) v.propia = own.get(v.options[ci]) === v.image;
    }
    const sinFoto = ci >= 0 && own.size > 0 ? (options[ci]?.values || []).filter((val) => !own.has(val)) : [];
    json(res, 200, {
      shop, shopName: meta.name, currency: meta.currency,
      handle: p.handle, title: p.title, type: p.type || '', vendor: p.vendor || '', url: `https://${shop}/products/${p.handle}`,
      kind, garment, options: options.map((o, i) => ({ ...o, role: roles[i] })), variants, images, sinFoto,
    }, 'public, s-maxage=600, stale-while-revalidate=86400');
  } catch (e) {
    json(res, e.status === 404 ? 404 : 502, { error: e.status === 404 ? 'no_existe' : 'tienda_no_responde' });
  }
}
