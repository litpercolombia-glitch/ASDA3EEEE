// GET /api/boton?shop=tienda.com&handle=producto → ¿mostrar el botón «Pruébalo» en esta ficha y con qué texto?
// Público y cacheado: lo llama embed.js desde la página de producto de la tienda.
import { json, q, shopHost, handleOk, getJSON, kindOf } from './_util.js';

const GROUP = { protector: 'cama', sabanas: 'cama', edredon: 'cama', cobija: 'cama', almohada: 'cama', cortina: 'cortina', mantel: 'mesa', forro: 'mesa', mueble: 'mueble', ropa: 'ropa' };
const LABEL = { cama: 'Pruébalo en tu cama', cortina: 'Pruébala en tu ventana', mesa: 'Pruébalo en tu comedor', mueble: 'Pruébalo en tu espacio', ropa: 'Pruébatelo con una foto' };

export default async function handler(req, res) {
  res.setHeader('access-control-allow-origin', '*');
  const shop = shopHost(q(req, 'shop')), handle = q(req, 'handle').toLowerCase();
  if (!shop || !handleOk(handle)) return json(res, 400, { mostrar: false });
  try {
    const p = await getJSON(`https://${shop}/products/${handle}.js`, 6000);
    const { kind, garment } = kindOf({ type: p.type, title: p.title, handle: p.handle, tags: p.tags });
    const g = GROUP[kind], mostrar = !!g && (p.images || []).length > 0;
    json(res, 200, { mostrar, kind, garment, label: mostrar ? LABEL[g] : null }, 'public, s-maxage=3600, stale-while-revalidate=86400');
  } catch { json(res, 200, { mostrar: false }, 'public, s-maxage=120'); }
}
