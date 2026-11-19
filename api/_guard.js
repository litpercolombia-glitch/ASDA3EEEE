// Solo tiendas registradas (auditoría 19-nov-2026): las tiendas fijas de la demo o el dominio del tenant (consultado a la función vto-api, cacheado 10 min).
// Antes cualquiera podía usar estas rutas como proxy de cualquier tienda Shopify.
const FN = 'https://gtsivwbnhcawvmsfujby.supabase.co/functions/v1/vto-api';
// Lista fija = la misma DEMO_SHOPS de supabase/functions/vto-api (sin www): la demo de la landing solo carga estas tiendas.
const FIJAS = new Set(['litper.store', '1wqq1s-2t.myshopify.com']);
const sinWww = (h) => String(h || '').replace(/^www\./, '');
const cacheTenant = new Map();
export async function tiendaPermitida(shop, tenant) {
  const h = sinWww(shop); if (!h) return false;
  if (FIJAS.has(h)) return true;
  const t = String(tenant || '').toLowerCase(); if (!/^[a-z0-9][a-z0-9-]{0,59}$/.test(t) || t === 'demo') return false;
  const c = cacheTenant.get(t); let dom;
  if (c && Date.now() - c.t < 600e3) dom = c.v;
  else {
    try {
      // Origin fijo: la función filtra por Origin (CORS); no es autenticación, cfg solo devuelve datos públicos de la tienda
      const r = await fetch(FN, { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://probador.zynexapp.com' }, body: JSON.stringify({ action: 'cfg', tenant: t }), signal: AbortSignal.timeout(6000) });
      const d = await r.json().catch(() => ({})); dom = r.ok && typeof d.dominio === 'string' ? sinWww(d.dominio.toLowerCase()) : '';
    } catch { dom = null; } // si la consulta falla no se cachea
    if (dom !== null) cacheTenant.set(t, { t: Date.now(), v: dom });
  }
  return !!dom && dom === h;
}
