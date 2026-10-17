/*! Zynex Probador · botón para la página de producto de Shopify · 2026-10-17
   Uso: <div data-zvto data-t="TU-TIENDA" data-h="{{ product.handle }}" data-v="{{ product.selected_or_first_available_variant.id }}" data-title="{{ product.title | escape }}" data-type="{{ product.type | escape }}"></div>
        <script src="https://<este-dominio>/embed.js" defer></script> */
(function () {
  if (window.__zvto) return; window.__zvto = 1;
  var me = document.currentScript || document.querySelector('script[src*="/embed.js"]');
  var APP = new URL(me ? me.src : location.href).origin;
  var norm = function (s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };

  // Qué tipo de prueba es (misma lógica del servidor, resumida)
  function kindOf(title, type, handle) {
    var t = ' ' + norm(type) + ' ' + norm(title) + ' ' + norm(handle).replace(/-/g, ' ') + ' ';
    if (/ropa interior|brasier|panty|tanga|boxer|lenceri|bikini|traje de ba|vestido de ba|banador/.test(t)) return null;
    var home = / (comedor|cama|mesa|silla|sillas|ventana|colchon|sofa|hogar|casa|cocina|bano|sala|cuarto|puerta) /.test(t);
    var rules = [[/ (cortina|blackout|velo|ventana|persiana)/, 'cortina'], [/ (mantel|forro|silla)/, 'mesa'], [/ (protector|sabana|edredon|colcha|plumon|cubrelecho|cobija|cobertor|manta|frazada|almohada|kit de cama)/, 'cama'],
      [/ (zapatero|estante|esquinero|armario|perchero|organizador|repisa|tapete|alfombra|mueble)/, 'mueble']];
    var best = null, bi = 1e9;
    rules.forEach(function (r) { var m = r[0].exec(t); if (m && m.index < bi) { bi = m.index; best = r[1]; } });
    if (!home) { var m2 = / (camiseta|polo|camisa|blusa|buzo|hoodie|saco|sueter|chaqueta|chaleco|pantalon|jean|sudadera|jogger|falda|short|vestido|enterizo|pijama|conjunto|uniforme)/.exec(t); if (m2 && m2.index < bi) best = 'ropa'; }
    return best;
  }
  var LABEL = { cama: 'Pruébalo en tu cama', cortina: 'Pruébala en tu ventana', mesa: 'Pruébalo en tu comedor', mueble: 'Pruébalo en tu espacio', ropa: 'Pruébatelo con una foto' };

  var css = '.zvto-b{all:unset;box-sizing:border-box;display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:52px;margin:10px 0;padding:0 18px;border-radius:999px;background:#07080a;color:#fff;font:600 16px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif;cursor:pointer;position:relative;overflow:hidden;box-shadow:0 0 0 1px rgba(0,255,136,.45),0 8px 22px rgba(0,0,0,.18);transition:transform .2s,box-shadow .2s;-webkit-tap-highlight-color:transparent}'
    + '.zvto-b:hover{box-shadow:0 0 0 1px rgba(0,255,136,.8),0 10px 26px rgba(0,0,0,.24)}.zvto-b:active{transform:scale(.98)}.zvto-b:focus-visible{outline:3px solid #00ff88;outline-offset:3px}'
    + '.zvto-b svg{width:20px;height:20px;flex:none;color:#00ff88}.zvto-b i{font-style:normal;font-size:11px;font-weight:700;letter-spacing:.02em;padding:3px 7px;border-radius:999px;background:#00ff88;color:#03140b}'
    + '.zvto-b::after{content:"";position:absolute;top:0;bottom:0;width:40%;left:-60%;background:linear-gradient(90deg,transparent,rgba(0,255,136,.28),transparent);animation:zvto-sh 2.6s ease-out 1.2s 2}'
    + '@keyframes zvto-sh{to{left:120%}}@media (prefers-reduced-motion:reduce){.zvto-b::after{display:none}}'
    + '.zvto-m{position:fixed;inset:0;z-index:2147483646;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;animation:zvto-f .2s}'
    + '.zvto-m iframe{width:min(1040px,100vw);height:min(780px,100dvh);border:0;border-radius:20px;background:#07080a;box-shadow:0 30px 80px rgba(0,0,0,.5)}'
    + '@media (max-width:719px){.zvto-m iframe{width:100vw;height:100dvh;border-radius:0}}@keyframes zvto-f{from{opacity:0}}'
    + '.zvto-hl{animation:zvto-p 1.2s 3}@keyframes zvto-p{50%{box-shadow:0 0 0 6px rgba(0,255,136,.55)}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  var ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="3.6" fill="none" stroke="currentColor" stroke-width="2"/></svg>';

  function currentVariant(el) {
    var q = new URLSearchParams(location.search).get('variant');
    var inp = document.querySelector('form[action*="/cart/add"] [name="id"]');
    return q || (inp && inp.value) || el.getAttribute('data-v') || '';
  }
  var modal = null, lastFocus = null;
  function open(el) {
    lastFocus = document.activeElement;
    var u = new URL(APP + '/p');
    u.searchParams.set('t', el.getAttribute('data-t') || '');
    u.searchParams.set('s', el.getAttribute('data-s') || location.hostname.replace(/^www\./, ''));
    u.searchParams.set('h', el.getAttribute('data-h') || '');
    var v = currentVariant(el); if (v) u.searchParams.set('v', v);
    u.searchParams.set('embed', '1');
    modal = document.createElement('div'); modal.className = 'zvto-m'; modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-label', 'Probador con IA');
    var f = document.createElement('iframe'); f.src = u.href; f.title = 'Probador con IA'; f.allow = 'camera; web-share; clipboard-write';
    modal.appendChild(f); modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
    document.body.appendChild(modal); document.documentElement.style.overflow = 'hidden'; f.focus();
  }
  function close() { if (!modal) return; modal.remove(); modal = null; document.documentElement.style.overflow = ''; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  function mark(extra) { // marca el pedido como venta del probador (atributos ocultos del carrito)
    var a = { _probador: 'si', _probador_fecha: new Date().toISOString().slice(0, 10) }; if (extra) a._probador_tipo = extra;
    return fetch('/cart/update.js', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ attributes: a }) }).catch(function () {});
  }
  addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  addEventListener('message', function (e) {
    if (e.origin !== APP || !e.data || !e.data.vto) return;
    var d = e.data, src = e.source;
    var ack = function () { try { src.postMessage({ vto: 'ack' }, APP); } catch (x) {} };
    if (d.vto === 'close') close();
    if (d.vto === 'buy' && d.variant) {
      ack(); close();
      mark('producto').then(function () {
        var path = '/products/' + encodeURIComponent(d.handle) + '?variant=' + encodeURIComponent(d.variant) + '#zvto-comprar';
        if (location.pathname.indexOf('/products/' + d.handle) >= 0 && new URLSearchParams(location.search).get('variant') === String(d.variant)) { buyHere(); }
        else location.href = path;
      });
    }
    if (d.vto === 'cart' && d.items && d.items.length) {
      ack(); close();
      var items = d.items.slice(0, 6).map(function (i) { return { id: i.id, quantity: i.quantity || 1, properties: { _probador: 'kit' } }; });
      fetch('/cart/add.js', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ items: items }) })
        .then(function () { return mark('kit'); }).then(function () { location.href = '/cart'; })
        .catch(function () { location.href = d.url || '/cart'; });
    }
  });
  // Al volver del probador: abre el formulario contraentrega (Releasit) o el botón de compra de la tienda
  function buyHere() {
    var tries = 0;
    (function tick() {
      var b = document.querySelector('[data-rsi-cod-button]') || document.querySelector('form[action*="/cart/add"] button[name="add"]:not([disabled])') || document.querySelector('form[action*="/cart/add"] [type="submit"]:not([disabled])');
      if (b) { b.scrollIntoView({ block: 'center', behavior: 'smooth' }); setTimeout(function () { b.click(); }, 450); return; }
      if (++tries < 40) setTimeout(tick, 250);
    })();
  }
  if (location.hash === '#zvto-comprar') { history.replaceState(null, '', location.pathname + location.search); if (document.readyState === 'complete') buyHere(); else addEventListener('load', buyHere); }

  function mount(el) {
    if (el.__zvto) return; el.__zvto = 1;
    var kind = kindOf(el.getAttribute('data-title'), el.getAttribute('data-type'), el.getAttribute('data-h'));
    if (!kind && !el.getAttribute('data-label')) { el.style.display = 'none'; return; }
    var b = document.createElement('button'); b.type = 'button'; b.className = 'zvto-b';
    b.innerHTML = ICON + '<span></span><i>IA</i>'; b.querySelector('span').textContent = el.getAttribute('data-label') || LABEL[kind];
    b.addEventListener('click', function () { open(el); });
    b.addEventListener('pointerenter', function () { if (!document.querySelector('link[data-zvto-pre]')) { var l = document.createElement('link'); l.rel = 'preconnect'; l.href = APP; l.setAttribute('data-zvto-pre', ''); document.head.appendChild(l); } }, { once: true });
    el.appendChild(b);
  }
  function scan() { Array.prototype.forEach.call(document.querySelectorAll('[data-zvto]'), mount); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();
})();
