// Panel de la tienda: uso del plan, embudo de 30 días y productos más probados.
import { call, el, $, WA } from './common.js';

const Q = new URLSearchParams(location.search);
const T = (Q.get('t') || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);
const K = (Q.get('k') || '').replace(/[^a-f0-9]/g, '').slice(0, 64);
$('#lnkWa').href = `https://wa.me/${WA}?text=${encodeURIComponent('Hola, necesito ayuda con el panel del probador' + (T ? ' (' + T + ')' : ''))}`;
$('#fL').addEventListener('submit', (e) => { e.preventDefault(); location.search = `?t=${encodeURIComponent($('#inT').value.trim().toLowerCase())}&k=${encodeURIComponent($('#inK').value.trim())}`; });
if (T) $('#lnkIns').href = `/instalar?t=${encodeURIComponent(T)}${K ? '&k=' + K : ''}`;
if (!T || !K) $('#login').hidden = false; else load();

const PLAN = { prueba: 'Prueba gratis', gratis: 'Plan Gratis', basico: 'Plan Básico', crecimiento: 'Plan Crecimiento', escala: 'Plan Escala', interno: 'Plan interno', demo: 'Demo' };
const nf = new Intl.NumberFormat('es-CO');

async function load() {
  let d;
  try { d = await call('stats', { tenant: T, key: K }); } catch { $('#login').hidden = false; $('#sub').textContent = 'No pudimos entrar: revisa el código y la llave.'; return; }
  $('#ttl').textContent = d.tienda; $('#sub').textContent = `${d.dominio} · últimos 30 días`;
  $('#plan').textContent = (PLAN[d.plan] || d.plan) + (d.estado === 'pendiente' ? ' · pendiente' : '');
  if (d.estado === 'pendiente') $('#venc').textContent = 'Tu prueba arranca cuando el botón aparezca en tu tienda. Sigue la guía de instalación.';
  if (d.estado !== 'pendiente') $('#venc').textContent = d.vence ? `vence el ${new Date(d.vence + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}` : '';
  $('#meter').style.width = Math.min(100, (100 * d.usadas) / Math.max(1, d.cuota)).toFixed(1) + '%';
  $('#uso').textContent = `${nf.format(d.usadas)} de ${nf.format(d.cuota)} pruebas usadas este mes`;
  const t = d.totales || {}, ia = (d.dias || []).reduce((a, x) => a + x.ia, 0), buy = (t.comprar || 0) + (t.kit || 0);
  const kp = [
    ['Abrieron el probador', t.abrir || 0, 'personas que tocaron el botón'],
    ['Fotos creadas', ia, `${t.foto || 0} subieron una foto`],
    ['Tocaron «Comprar»', buy, ia ? `${Math.round((100 * buy) / ia)} % de las fotos` : 'sin fotos aún'],
    ['Compartieron', t.compartir || 0, 'fotos enviadas a otros'],
  ];
  $('#kpis').replaceChildren(...kp.map(([a, b, c]) => el('div', { class: 'kpi' }, el('small', { text: a }), el('b', { text: nf.format(b) }), el('span', { text: c }))));
  chart(d.dias || []);
  // nombre del producto (no el handle): se lee del catálogo público de la tienda
  const names = new Map();
  if (d.top?.length && d.dominio) { try { const r = await fetch(`/api/tienda?shop=${encodeURIComponent(d.dominio)}`); const c = await r.json(); for (const it of c.items || []) names.set(it.handle, it.title); } catch {} }
  const nombre = (h) => names.get(h) || String(h || '').replace(/-/g, ' ').replace(/^./, (m) => m.toUpperCase());
  $('#top').replaceChildren(...(d.top?.length ? d.top.map((r) => el('tr', {}, el('td', { text: nombre(r.handle) }), el('td', { class: 'n', text: nf.format(r.ia) }), el('td', { class: 'n', text: nf.format(r.comprar) }))) : [el('tr', {}, el('td', { colspan: '3', class: 'muted', text: 'Aún no hay pruebas. Cuando tus clientes usen el botón, aparecen aquí.' }))]));
  $('#dash').hidden = false;
}

function chart(days) {
  const svg = $('#chart'), W = svg.clientWidth || 600, H = 200, pad = 22, n = Math.max(1, days.length);
  const max = Math.max(1, ...days.map((d) => Math.max(d.abrir, d.ia, d.comprar)));
  const ns = 'http://www.w3.org/2000/svg', mk = (tag, a) => { const e = document.createElementNS(ns, tag); for (const k in a) e.setAttribute(k, a[k]); return e; };
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.replaceChildren();
  const bw = (W - pad * 2) / n;
  days.forEach((d, i) => {
    const x = pad + i * bw, h = (v) => ((H - pad * 2) * v) / max;
    [['abrir', '#2b3a44', 0], ['ia', '#00d4f5', 0.22], ['comprar', '#00ff88', 0.44]].forEach(([k, c, o]) => {
      const v = d[k]; svg.append(mk('rect', { x: x + bw * o + 1, y: H - pad - h(v), width: Math.max(2, bw * 0.22), height: h(v), rx: 2, fill: c }));
    });
  });
  if (!days.length) { const tx = mk('text', { x: W / 2, y: H / 2, 'text-anchor': 'middle', fill: '#6c7672', 'font-size': 14 }); tx.textContent = 'Sin datos todavía'; svg.append(tx); }
}
