// Solo tiendas registradas (auditoría 19-nov-2026): litper.store o el dominio del tenant (consultado a la función vto-api, cacheado 10 min).
// Antes cualquiera podía usar estas rutas como proxy de cualquier tienda Shopify.
const FN = 'https://gtsivwbnhcawvmsfujby.supabase.co/functions/v1/vto-api';
const FIJAS = new Set(['litper.store']);
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
      const r = await fetch(FN, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'cfg', tenant: t }), signal: AbortSignal.timeout(6000) });
      const d = await r.json().catch(() => ({})); dom = r.ok && typeof d.dominio === 'string' ? sinWww(d.dominio.toLowerCase()) : '';
    } catch { dom = null; } // si la consulta falla no se cachea
    if (dom !== null) cacheTenant.set(t, { t: Date.now(), v: dom });
  }
  return !!dom && dom === h;
}
