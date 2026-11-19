// Solo tiendas registradas (auditoría 19-nov-2026): las tiendas fijas de la demo o los dominios del tenant (consultados a la función
// vto-api, caché corta). Antes cualquiera podía usar estas rutas como proxy de cualquier tienda Shopify.
// Auditoría 5: la misma lista de dominios arma el frame-ancestors de /p (api/p.js) y es la que acepta el servidor (padreOk en vto-api):
// tienda + su myshopify + config.dominios. Una tienda nueva queda incrustable sola, sin tocar vercel.json.
const FN = 'https://gtsivwbnhcawvmsfujby.supabase.co/functions/v1/vto-api';
// Lista fija = la misma DEMO_SHOPS de supabase/functions/vto-api (sin www): la demo de la landing solo carga estas tiendas.
const FIJAS = new Set(['litper.store', '1wqq1s-2t.myshopify.com']);
const sinWww = (h) => String(h || '').toLowerCase().replace(/^www\./, '');
const okHost = (h) => /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(h) && h.length <= 120 && !/^[\d.]+$/.test(h);
export const tenantOk = (t) => /^[a-z0-9][a-z0-9-]{0,59}$/.test(String(t || ''));
const cacheTenant = new Map();
const TTL_OK = 300e3, TTL_NO = 60e3; // 5 min con dominios; 1 min si la tienda no existe (un lead nuevo no espera mucho)
// Dominios (sin www) registrados de la tienda; [] si no existe o es la demo; null si la consulta falló (no se cachea).
export async function dominiosTenant(tenant) {
  const t = String(tenant || '').toLowerCase(); if (!tenantOk(t) || t === 'demo') return [];
  const c = cacheTenant.get(t);
  if (c && Date.now() - c.t < (c.v.length ? TTL_OK : TTL_NO)) return c.v;
  let v;
  try {
    // Origin fijo: la función filtra por Origin (CORS); no es autenticación, cfg solo devuelve datos públicos de la tienda
    const r = await fetch(FN, { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://probador.zynexapp.com' }, body: JSON.stringify({ action: 'cfg', tenant: t }), signal: AbortSignal.timeout(6000) });
    const d = await r.json().catch(() => ({}));
    if (r.status === 404) v = [];
    else if (!r.ok) return null;
    else v = [...new Set([...(Array.isArray(d.dominios) ? d.dominios : []), d.dominio].map(sinWww).filter(okHost))].slice(0, 20);
  } catch { return null; }
  if (cacheTenant.size > 2000) cacheTenant.clear();
  cacheTenant.set(t, { t: Date.now(), v });
  return v;
}
export async function tiendaPermitida(shop, tenant) {
  const h = sinWww(shop); if (!h) return false;
  if (FIJAS.has(h)) return true;
  const d = await dominiosTenant(tenant);
  return !!d && d.includes(h);
}
