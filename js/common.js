// Zynex Probador — utilidades compartidas (sin dependencias)
export const FN = 'https://gtsivwbnhcawvmsfujby.supabase.co/functions/v1/vto-api';
export const WA = '573022658970';
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const sesion = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export async function call(action, body = {}, { timeout = 20000 } = {}) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), timeout);
  try {
    const r = await fetch(FN, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, ...body }), signal: ctl.signal });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(d.error || 'error'), { code: d.error || 'error', status: r.status });
    return d;
  } catch (e) {
    if (e.name === 'AbortError') throw Object.assign(new Error('tiempo'), { code: 'tiempo' });
    if (!e.code) e.code = navigator.onLine === false ? 'sin_internet' : 'red';
    throw e;
  } finally { clearTimeout(t); }
}

// Métrica seudónima del embudo; beacon para no frenar la navegación
export function track(tipo, extra = {}) {
  const body = JSON.stringify({ action: 'event', tipo, sesion, ...extra });
  try { if (navigator.sendBeacon && navigator.sendBeacon(FN, new Blob([body], { type: 'text/plain' }))) return; } catch {}
  fetch(FN, { method: 'POST', body, keepalive: true, headers: { 'content-type': 'text/plain' } }).catch(() => {});
}

export function money(n, cur = 'COP') {
  if (n == null || !isFinite(n)) return '';
  try { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: cur, maximumFractionDigits: ['COP', 'CLP', 'PYG'].includes(cur) ? 0 : 2 }).format(n).replace(/^\$\s/, '$').replace(/^(US)?\$\u00a0/, '$1$'); }
  catch { return '$' + Math.round(n).toLocaleString('es-CO'); }
}

let toastT;
export function toast(msg, ms = 3200) {
  const t = $('#toast'); if (!t) return; t.textContent = msg; t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), ms);
}

export const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

export function el(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null) e.append(k.nodeType ? k : document.createTextNode(k));
  return e;
}
