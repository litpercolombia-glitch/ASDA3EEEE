// /p (app del comprador) con frame-ancestors POR TIENDA (auditoría 5, 19-nov-2026).
// Antes la lista estaba fija en vercel.json: una tienda nueva (lead que se da de alta sola) no podía incrustar el probador.
// Ahora, para /p?t=<tienda>, se permiten los dominios registrados de ESA tienda (los mismos que valida el servidor en padreOk)
// más los propios del probador. Tienda inexistente o demo → solo los propios. Nunca *.myshopify.com abierto.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { dominiosTenant, tenantOk } from './_guard.js';

const PROPIOS = ["'self'", 'https://probador.zynexapp.com', 'https://zynex-probador.vercel.app', 'https://asda3eeee.vercel.app', 'https://asda3eeee-git-probador-litpers-projects.vercel.app'];
// Versión del JS en la URL: cada despliegue (y por tanto cada cambio de CONSENT_V en app.js) fuerza a bajar el app.js nuevo
const VER = (process.env.VERCEL_GIT_COMMIT_SHA || String(Date.now())).slice(0, 10);
let SHELL = null;
function shell() {
  if (!SHELL) SHELL = readFileSync(join(process.cwd(), 'p', 'app.html'), 'utf8').replace('src="/js/app.js"', `src="/js/app.js?v=${VER}"`);
  return SHELL;
}
const csp = (fa) => `default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://gtsivwbnhcawvmsfujby.supabase.co data: blob:; frame-ancestors ${fa}; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests`;

export default async function handler(req, res) {
  const u = new URL(req.url, 'http://x');
  // misma regla que js/app.js: demo=1 → demo; si no, ?t= (por defecto litper)
  const raw = u.searchParams.get('demo') === '1' ? 'demo' : String(u.searchParams.get('t') || 'litper').toLowerCase();
  const tenant = tenantOk(raw) ? raw : '';
  // auditoría 6: máximo 2 s esperando a Supabase; si no responde, falla cerrado (solo los dominios propios, sin caché)
  const doms = tenant ? await dominiosTenant(tenant, 2000) : [];
  const fuentes = [...PROPIOS];
  for (const d of doms || []) {
    fuentes.push(`https://${d}`);
    if (!d.endsWith('.myshopify.com')) fuentes.push(`https://www.${d}`);
  }
  res.statusCode = 200;
  res.setHeader('content-type', 'text/html; charset=utf-8');
  res.setHeader('content-security-policy', csp(fuentes.join(' ')));
  // caché corta en el CDN (la URL incluye ?t=, así que es por tienda); si la consulta falló, sin caché
  res.setHeader('cache-control', doms ? 'public, max-age=0, s-maxage=60, stale-while-revalidate=60' : 'no-store');
  res.setHeader('x-robots-tag', 'noindex');
  res.end(shell());
}
