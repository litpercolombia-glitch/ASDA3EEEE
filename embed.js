/*! Zynex Probador · botón para la página de producto de Shopify · v4.7 · 2026-10-18
   Uso: <div data-zvto data-t="TU-TIENDA" data-h="{{ product.handle }}" data-v="{{ product.selected_or_first_available_variant.id }}" data-title="{{ product.title | escape }}" data-type="{{ product.type | escape }}"></div>
        <script src="https://<este-dominio>/embed.js" defer></script>
   Opcional, para la marca: data-label="Pruébalo en tu cama" data-bg="#000000" data-fg="#ffffff" data-accent="#00ff88" data-radius="12" */
(function () {
  if (window.__zvto) return; window.__zvto = 1;
  var me = document.currentScript || document.querySelector('script[src*="/embed.js"]');
  var APP = new URL(me ? me.src : location.href).origin;
  var FN = 'https://gtsivwbnhcawvmsfujby.supabase.co/functions/v1/vto-api';
  var visible = function (n) { return !!(n && n.offsetParent !== null && getComputedStyle(n).visibility !== 'hidden'); };
  // Con Releasit (contraentrega) el carrito abre su formulario en /cart#rsi-form-top-anchor; sin Releasit se va al pago normal
  var RSI_BTN = '[data-rsi-cod-button], #rsi_buy_now_button, .rsi_buy_now_button';
  var hasRsi = function () { return !!(window._RSI_COD_FORM_SETTINGS || document.querySelector(RSI_BTN)); };
  // Releasit dice si su botón va en la ficha (productPage.isEnabled); si está apagado, el formulario vive solo en el carrito
  var rsiSoloCarrito = function () { var s = window._RSI_COD_FORM_SETTINGS; return !!(s && s.productPage && s.productPage.isEnabled === false); };
  var codGo = function () { location.href = hasRsi() ? '/cart#rsi-form-top-anchor' : '/checkout'; };
  var norm = function (s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };

  var css = '.zvto-b{all:unset;box-sizing:border-box;display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:52px;margin:10px 0;padding:0 18px;border-radius:var(--zvto-r,999px);background:var(--zvto-bg,#07080a);color:var(--zvto-fg,#fff);font:600 16px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif;cursor:pointer;position:relative;overflow:hidden;box-shadow:0 0 0 1px rgba(0,255,136,.45),0 8px 22px rgba(0,0,0,.18);box-shadow:0 0 0 1px color-mix(in srgb,var(--zvto-ac,#00ff88) 45%,transparent),0 8px 22px rgba(0,0,0,.18);transition:transform .2s,box-shadow .2s;-webkit-tap-highlight-color:transparent}'
    + '.zvto-b:hover{box-shadow:0 0 0 1px rgba(0,255,136,.8),0 10px 26px rgba(0,0,0,.24);box-shadow:0 0 0 1px color-mix(in srgb,var(--zvto-ac,#00ff88) 80%,transparent),0 10px 26px rgba(0,0,0,.24)}.zvto-b:active{transform:scale(.98)}.zvto-b:focus-visible{outline:3px solid var(--zvto-ac,#00ff88);outline-offset:3px}'
    + '.zvto-b svg{width:20px;height:20px;flex:none;color:var(--zvto-ac,#00ff88)}.zvto-b i{font-style:normal;font-size:11px;font-weight:700;letter-spacing:.02em;padding:3px 7px;border-radius:999px;background:var(--zvto-ac,#00ff88);color:var(--zvto-ai,#03140b)}'
    + '.zvto-b::after{content:"";position:absolute;top:0;bottom:0;width:40%;left:-60%;background:linear-gradient(90deg,transparent,rgba(0,255,136,.28),transparent);background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--zvto-ac,#00ff88) 28%,transparent),transparent);animation:zvto-sh 2.6s ease-out 1.2s 2}'
    + '@keyframes zvto-sh{to{left:120%}}@media (prefers-reduced-motion:reduce){.zvto-b::after{display:none}}'
    + '.zvto-m{position:fixed;inset:0;z-index:2147483646;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;animation:zvto-f .2s}'
    + '.zvto-m iframe{width:min(1040px,100vw);height:min(780px,100dvh);border:0;border-radius:20px;background:#07080a;box-shadow:0 30px 80px rgba(0,0,0,.5)}'
    + '@media (max-width:719px){.zvto-m iframe{width:100vw;height:100dvh;border-radius:0}}@keyframes zvto-f{from{opacity:0}}'
    + '.zvto-hl{animation:zvto-p 1.2s 3}@keyframes zvto-p{50%{box-shadow:0 0 0 6px rgba(0,255,136,.55)}}'
    + '.zvto-w{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483646;display:flex;align-items:center;gap:10px;padding:12px 18px;white-space:nowrap;max-width:calc(100vw - 32px);border-radius:999px;background:#07080a;color:#fff;font:600 15px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:0 0 0 1px rgba(0,255,136,.45),0 10px 28px rgba(0,0,0,.3)}'
    + '.zvto-w i{width:16px;height:16px;border-radius:50%;border:2px solid #00ff88;border-right-color:transparent;animation:zvto-r .8s linear infinite}@keyframes zvto-r{to{transform:rotate(360deg)}}'
    + '@media (prefers-reduced-motion:reduce){.zvto-w i{animation:none}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  var ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="3.6" fill="none" stroke="currentColor" stroke-width="2"/></svg>';

  function pageVariant() {
    var q = new URLSearchParams(location.search).get('variant');
    var inp = document.querySelector('form[action*="/cart/add"] [name="id"]');
    return q || (inp && inp.value) || '';
  }
  function currentVariant(el) { return pageVariant() || el.getAttribute('data-v') || ''; }
  var v0 = pageVariant(), vChanged = false;
  document.addEventListener('change', function (e) { var t = e.target; if (t && t.closest && t.closest('form[action*="/cart/add"], variant-picker, variant-selects, variant-radios, [data-variant-picker], .product-form')) vChanged = true; }, true);
  var modal = null, lastFocus = null;
  function open(el) {
    lastFocus = document.activeElement;
    var u = new URL(APP + '/p');
    u.searchParams.set('t', el.getAttribute('data-t') || '');
    u.searchParams.set('s', el.getAttribute('data-s') || location.hostname.replace(/^www\./, ''));
    u.searchParams.set('h', el.getAttribute('data-h') || '');
    var v = currentVariant(el); if (v) u.searchParams.set('v', v);
    if (vChanged || (pageVariant() && pageVariant() !== v0)) u.searchParams.set('vs', '1'); // el cliente cambió medida/color en la ficha
    u.searchParams.set('embed', '1');
    modal = document.createElement('div'); modal.className = 'zvto-m'; modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-label', 'Probador con IA');
    var f = document.createElement('iframe'); f.src = u.href; f.title = 'Probador con IA'; f.allow = 'camera; web-share; clipboard-write';
    var trap = function () { var t = document.createElement('div'); t.tabIndex = 0; t.addEventListener('focus', function () { f.focus(); }); return t; };
    modal.appendChild(trap()); modal.appendChild(f); modal.appendChild(trap()); modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
    document.body.appendChild(modal); document.documentElement.style.overflow = 'hidden'; f.focus();
  }
  var pill = null;
  function wait(on, txt) {
    if (!on) { if (pill) pill.remove(); pill = null; return; }
    if (!pill) { pill = document.createElement('div'); pill.className = 'zvto-w'; pill.setAttribute('role', 'status'); pill.innerHTML = '<i></i><span></span>'; document.body.appendChild(pill); }
    pill.querySelector('span').textContent = txt || 'Abriendo tu pedido…';
  }
  try { if (sessionStorage.getItem('zvto:compra') && location.hash === '#zvto-comprar') wait(true); } catch (x) {}
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
      ack(); close(); wait(true);
      try { sessionStorage.setItem('zvto:compra', '1'); } catch (x) {}
      mark('producto').then(function () {
        // Se compra por la ficha: ahí corren el formulario contraentrega y lo propio de cada tienda (combos, ofertas, notas).
        var onPage = location.pathname.indexOf('/products/' + d.handle) >= 0;
        if (onPage && String(pageVariant()) === String(d.variant)) return buyHere(d.variant); // misma variante: sin recargar
        location.href = '/products/' + encodeURIComponent(d.handle) + '?variant=' + encodeURIComponent(d.variant) + '#zvto-comprar';
      });
    }
    if (d.vto === 'cart' && d.items && d.items.length) {
      ack(); close(); wait(true);
      fetch('/cart.js', { headers: { accept: 'application/json' } }).then(function (r) { return r.json(); }).catch(function () { return {}; })
        .then(function (c) { // lo que ya está en el carrito no se vuelve a agregar
          var ya = {}; (c.items || []).forEach(function (i) { ya[String(i.variant_id)] = 1; });
          var items = d.items.slice(0, 6).filter(function (i) { return !ya[String(i.id)]; }).map(function (i) { return { id: i.id, quantity: i.quantity || 1, properties: { _probador: 'kit' } }; });
          return items.length ? fetch('/cart/add.js', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ items: items }) })
            .then(function (r) { if (!r.ok) throw r; }) : null;
        })
        .then(function () { return mark('kit'); }).then(codGo)
        .catch(function () { location.href = d.url || '/cart'; });
    }
  });
  // Botón contraentrega visible de Releasit en esta página (si lo hay)
  function codButton() {
    var c = document.querySelectorAll(RSI_BTN), i, alt = null;
    for (i = 0; i < c.length; i++) if (visible(c[i])) { if (c[i].closest('form[action*="/cart/add"]')) return c[i]; alt = alt || c[i]; }
    return alt;
  }
  function toCart(variant) { // si la variante ya está en el carrito no la duplica (doble toque o volver atrás)
    return fetch('/cart.js', { headers: { accept: 'application/json' } }).then(function (r) { return r.json(); })
      .then(function (c) { return (c.items || []).some(function (i) { return String(i.variant_id) === String(variant); }); }, function () { return false; })
      .then(function (ya) { return ya || fetch('/cart/add.js', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ items: [{ id: +variant, quantity: 1 }] }) }).then(function (r) { if (!r.ok) throw r; }); })
      .then(function () { return mark('producto'); }).then(codGo).catch(function () { location.href = '/cart'; });
  }
  // En la ficha con la variante elegida: toca el botón contraentrega de la tienda (corren sus combos, ofertas y notas).
  // En litper.store el botón de Releasit ya está visible al cargar la ficha (7 de 8 cargas el 18-oct), así que se toca al primer intento.
  // Si Releasit lo pinta tarde se espera hasta 5 s; si no aparece, se usa el formulario del carrito.
  // Sin Releasit: toca el botón «Agregar al carrito» visible de la tienda; si no hay, va al pago.
  function buyHere(variant) {
    variant = variant || new URLSearchParams(location.search).get('variant');
    var tries = 0;
    wait(true);
    (function tick() {
      var b = codButton(), i;
      if (!b && variant && rsiSoloCarrito()) return void toCart(variant);
      if (!b && !hasRsi() && tries >= 8) {
        var adds = document.querySelectorAll('form[action*="/cart/add"] [type="submit"]:not([disabled]), form[action*="/cart/add"] button[name="add"]:not([disabled])');
        for (i = 0; i < adds.length && !b; i++) if (visible(adds[i])) b = adds[i];
      }
      if (b) { b.scrollIntoView({ block: 'center', behavior: 'smooth' }); setTimeout(function () { b.click(); setTimeout(function () { wait(false); }, 1200); }, 450); try { sessionStorage.removeItem('zvto:compra'); } catch (x) {} return; }
      if (++tries < 20) return void setTimeout(tick, 250);
      if (variant) toCart(variant); else wait(false);
    })();
  }
  if (location.hash === '#zvto-comprar') { history.replaceState(null, '', location.pathname + location.search); if (document.readyState === 'complete') buyHere(); else addEventListener('load', function () { buyHere(); }); }

  function mount(el) {
    if (el.__zvto) return; el.__zvto = 1;
    var shop = el.getAttribute('data-s') || location.hostname.replace(/^www\./, ''), h = el.getAttribute('data-h') || '';
    var key = 'zvto:' + shop + ':' + h, done = function (d) {
      if (!d || !d.mostrar) { el.style.display = 'none'; return; }
      var b = document.createElement('button'); b.type = 'button'; b.className = 'zvto-b';
      b.innerHTML = ICON + '<span></span><i>IA</i>'; b.querySelector('span').textContent = el.getAttribute('data-label') || d.label;
      // colores y forma de la marca (opcionales): data-bg, data-fg, data-accent (#hex) y data-radius (px)
      var hx = function (v) { return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v || '') ? v : ''; };
      var lum = function (h) { h = h.slice(1); if (h.length === 3) h = h.replace(/./g, '$&$&'); var n = parseInt(h, 16); return (0.299 * (n >> 16) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255; };
      var bg = hx(el.getAttribute('data-bg')), fg = hx(el.getAttribute('data-fg')), ac = hx(el.getAttribute('data-accent')), rd = el.getAttribute('data-radius') || '';
      if (bg) b.style.setProperty('--zvto-bg', bg);
      if (fg) b.style.setProperty('--zvto-fg', fg);
      if (ac) { b.style.setProperty('--zvto-ac', ac); b.style.setProperty('--zvto-ai', lum(ac) > 0.55 ? '#03140b' : '#ffffff'); }
      if (/^\d{1,2}$/.test(rd)) b.style.setProperty('--zvto-r', rd + 'px');
      b.addEventListener('click', function () { open(el); });
      b.addEventListener('pointerenter', function () { if (!document.querySelector('link[data-zvto-pre]')) { var l = document.createElement('link'); l.rel = 'preconnect'; l.href = APP; l.setAttribute('data-zvto-pre', ''); document.head.appendChild(l); } }, { once: true });
      el.appendChild(b);
    };
    var t = el.getAttribute('data-t') || '', ek = 'zvto:estado:' + t, now = Date.now();
    var cached = function (k, ttl) { try { var c = JSON.parse(sessionStorage.getItem(k)); return c && now - c.at < ttl ? c.d : null; } catch (x) { return null; } };
    var keep = function (k, d) { try { sessionStorage.setItem(k, JSON.stringify({ at: now, d: d })); } catch (x) {} return d; };
    var bt = cached(key, 36e5), es = cached(ek, 6e5);
    Promise.all([
      bt ? Promise.resolve(bt) : fetch(APP + '/api/boton?shop=' + encodeURIComponent(shop) + '&handle=' + encodeURIComponent(h)).then(function (r) { return r.json(); }).then(function (d) { return keep(key, d); }),
      es ? Promise.resolve(es) : fetch(FN, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: JSON.stringify({ action: 'estado', tenant: t, p: location.pathname }) }).then(function (r) { return r.json(); }).then(function (d) { return keep(ek, d); }),
    ]).then(function (r) { // se oculta si la tienda no está activa, si la IA está en pausa hoy o si es ropa sin revisión de fotos activa
      var b = r[0], e = r[1] || {};
      done(e.mostrar && e.ia !== false && !(b && b.kind === 'ropa' && e.ropa === false) ? b : null);
    }).catch(function () { el.style.display = 'none'; });
  }
  function scan() { Array.prototype.forEach.call(document.querySelectorAll('[data-zvto]'), mount); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();
})();
