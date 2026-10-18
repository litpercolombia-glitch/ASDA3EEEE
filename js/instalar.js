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
  $('#ttl').textContent = `Instala el probador en ${cfg.dominio || cfg.id}`;
  $('#sub').textContent = `Tu código de tienda es «${cfg.id}» (${cfg.dominio}). Son 5 minutos y no necesitas programador.`;
  if (K) { const p = $('#lnkPanel'); p.hidden = false; p.href = `/panel?t=${encodeURIComponent(T)}&k=${K}`; }
  $('#snippet').value = snippet(cfg.id);
  if (cfg.dominio) $('#lnkEditor').href = `https://${cfg.dominio}/admin/themes/current/editor?template=product`;
  if (cfg.estado === 'pendiente') $('#sub').textContent += ' Tus 14 días de prueba arrancan cuando el botón aparezca en tu tienda.';
  estado(cfg);
  $('#guide').hidden = false;
  $('#btnCopy').onclick = () => copy($('#snippet').value, '#copied', 'Copiado. Ahora pégalo en tu tema.');
  loadProducts(cfg);
}

// ¿Ya vimos el botón en la tienda? (el servidor guarda la última vez que cargó en su dominio)
function estado(cfg) {
  const box = $('#estadoIns'), visto = cfg.visto ? new Date(cfg.visto) : null;
  const fecha = (d) => d.toLocaleString('es-CO', { day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });
  box.className = 'card estado ' + (visto ? 'ok' : 'pend');
  box.replaceChildren(
    el('b', { text: visto ? 'El botón ya está en tu tienda' : 'Aún no vemos el botón en tu tienda' }),
    el('p', { class: 'muted', text: visto ? `Lo vimos cargar por última vez el ${fecha(visto)}.${cfg.desde ? ` Tu prueba arrancó el ${new Date(cfg.desde).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}.` : ''}` : 'Pega el bloque, abre un producto de tu tienda en el celular y toca «Verificar». Tus 14 días de prueba arrancan solos ese día.' }),
    el('button', { class: 'btn sec', type: 'button', onclick: async (e) => {
      e.target.disabled = true;
      try { const c = await call('cfg', { tenant: T }); estado(c); toast(c.visto ? 'Listo: el botón está en tu tienda.' : 'Aún no lo vemos. Abre un producto de tu tienda y vuelve a verificar.'); }
      catch { toast('No pudimos verificar ahora. Intenta en un momento.'); e.target.disabled = false; }
    } }, 'Verificar'));
  box.hidden = false;
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
  if (!cfg.dominio) return;
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
