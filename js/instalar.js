// Guía de instalación: genera el bloque Liquid con el código de la tienda y links del probador por producto.
import { call, toast, el, $, WA } from './common.js';

const Q = new URLSearchParams(location.search);
const T = (Q.get('t') || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);
const K = (Q.get('k') || '').replace(/[^a-f0-9]/g, '').slice(0, 64);
const APP = location.origin;
$('#lnkWa').href = `https://wa.me/${WA}?text=${encodeURIComponent('Hola, quiero que me ayuden a instalar el probador' + (T ? ' en la tienda ' + T : ''))}`;
$('#fT').addEventListener('submit', (e) => { e.preventDefault(); location.search = '?t=' + encodeURIComponent($('#inT').value.trim().toLowerCase()); });

if (!T) $('#noTenant').hidden = false;
else start();

async function start() {
  let cfg;
  try { cfg = await call('cfg', { tenant: T }); } catch { $('#noTenant').hidden = false; toast('No encontramos esa tienda. Revisa el código.'); return; }
  $('#ttl').textContent = `Instala el probador en ${cfg.nombre}`;
  $('#sub').textContent = `Tu código de tienda es «${cfg.id}» (${cfg.dominio}). Son 5 minutos y no necesitas programador.`;
  if (K) { const p = $('#lnkPanel'); p.hidden = false; p.href = `/panel?t=${encodeURIComponent(T)}&k=${K}`; }
  $('#snippet').value = snippet(cfg.id);
  $('#lnkEditor').href = `https://${cfg.dominio}/admin/themes/current/editor?template=product`;
  $('#guide').hidden = false;
  $('#btnCopy').onclick = () => copy($('#snippet').value, '#copied', 'Copiado. Ahora pégalo en tu tema.');
  loadProducts(cfg);
}

function snippet(id) {
  return `{%- comment -%} Zynex Probador · pegar en un bloque «Liquid personalizado» de la plantilla de producto {%- endcomment -%}
<div data-zvto data-t="${id}" data-h="{{ product.handle }}" data-v="{{ product.selected_or_first_available_variant.id }}" data-title="{{ product.title | escape }}" data-type="{{ product.type | escape }}"></div>
<script src="${APP}/embed.js" defer></script>`;
}

async function copy(text, outSel, okMsg) {
  try { await navigator.clipboard.writeText(text); } catch { const ta = el('textarea', { class: 'sr' }); ta.value = text; document.body.append(ta); ta.select(); document.execCommand('copy'); ta.remove(); }
  if (outSel) $(outSel).textContent = okMsg; toast(okMsg);
}

async function loadProducts(cfg) {
  try {
    const d = await (await fetch(`/api/tienda?shop=${encodeURIComponent(cfg.dominio)}`)).json();
    if (!d.items?.length) return;
    const sel = $('#selProd'); sel.replaceChildren(...d.items.map((it) => el('option', { value: it.handle, text: it.title })));
    const upd = () => { const u = `${APP}/p?t=${encodeURIComponent(cfg.id)}&h=${encodeURIComponent(sel.value)}`; $('#prodLink').value = u; $('#btnTryLink').href = u; };
    sel.onchange = upd; upd();
    $('#btnCopyLink').onclick = () => copy($('#prodLink').value, null, 'Link copiado. Pégalo en WhatsApp.');
    $('#links').hidden = false;
  } catch {}
}
