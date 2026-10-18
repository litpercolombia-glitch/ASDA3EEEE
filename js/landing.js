// Landing Zynex Probador — escena 3D, galería real, demo con la tienda del visitante, precios y alta de prueba.
import { call, track, toast, el, $, $$, WA, money } from './common.js';
import { PLANS, OFFER, STATS } from './oferta.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wa = (t) => `https://wa.me/${WA}?text=${encodeURIComponent(t)}`;
const utm = Object.fromEntries([...new URLSearchParams(location.search)].filter(([k]) => /^utm_|^ref$|^fbclid$/.test(k)).slice(0, 8));
track('landing', { detalle: { ref: document.referrer ? new URL(document.referrer).hostname : '', ...utm } });

/* ---------- navegación ---------- */
const nav = $('#nav');
addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 10), { passive: true });
for (const id of ['#waFab', '#waFoot', '#waGo']) { const a = $(id); if (a) a.href = wa('Hola, quiero el probador con IA para mi tienda'); }

/* ---------- héroe 3D ---------- */
const SCENES = [
  { title: 'Pruébalo en tu cama', b: 'cuarto_a', a: 'r_protector', p: 'p_protector', c1: 'Foto de tu cliente', c2: 'Protector · Rojo', t: '7,4 s' },
  { title: 'Pruébala en tu ventana', b: 'ventana_a', a: 'r_cortina_nav', p: 'p_cortina_nav', c1: 'Foto de su ventana', c2: 'Cortina · Azul estrellas', t: '7,6 s' },
  { title: 'Pruébalo en tu cama', b: 'cuarto_b', a: 'r_colcha', p: 'p_colcha', c1: 'Foto de su cuarto', c2: 'Colcha · Renos verde', t: '8,4 s' },
];
const card = $('#card3d'), shot = $('#hAfterW').parentElement;
// precarga solo la escena siguiente (auditoría M-13: antes se bajaban todas al entrar)
const pre = (s) => [`${s.b}.webp`, `${s.a}.webp`, `${s.p}_s.webp`].forEach((f) => { const i = new Image(); i.src = `/img/demo/${f}`; });
let sc = 0;
function setP(v, lo = 1) { shot.style.setProperty('--p', v + '%'); shot.style.setProperty('--lo', lo); }
async function heroLoop() {
  if (reduce) { setP(100, 0); return; }
  await wait(900); pre(SCENES[1]);
  for (;;) {
    const s = SCENES[sc % SCENES.length];
    await sweep(0, 100, 1700);
    setP(100, 0); await wait(2600);
    sc++; const n = SCENES[sc % SCENES.length]; pre(SCENES[(sc + 1) % SCENES.length]);
    shot.classList.add('swap'); await wait(250);
    $('#hBefore').src = `/img/demo/${n.b}.webp`; $('#hAfter').src = `/img/demo/${n.a}.webp`; $('#hProd').src = `/img/demo/${n.p}_s.webp`;
    $('#hTitle').textContent = n.title; $('#hC1').textContent = n.c1; $('#hC2').textContent = n.c2; $('#hTime').textContent = n.t;
    setP(0, 1); await wait(900); void s;
  }
}
function sweep(a, b, ms) { return new Promise((r) => { const t0 = performance.now(); const f = (t) => { const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); setP(a + (b - a) * e); k < 1 ? requestAnimationFrame(f) : r(); }; requestAnimationFrame(f); }); }
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const vis = $('.hero-vis');
if (!reduce && matchMedia('(pointer:fine)').matches) {
  vis.addEventListener('pointermove', (e) => { const b = vis.getBoundingClientRect(), x = (e.clientX - b.left) / b.width - 0.5, y = (e.clientY - b.top) / b.height - 0.5; card.style.setProperty('--ry', `${-18 + x * 16}deg`); card.style.setProperty('--rx', `${7 - y * 10}deg`); });
  vis.addEventListener('pointerleave', () => { card.style.setProperty('--ry', '-18deg'); card.style.setProperty('--rx', '7deg'); });
}
heroLoop();

/* ---------- galería antes/después ---------- */
const GAL = [
  { tab: 'Protector', b: 'cuarto_a', a: 'r_protector', p: 'p_protector', name: 'Protector de colchón acolchado · Rojo', t: '7,4 s', note: 'Cama con sábanas blancas: el protector y las fundas de las almohadas toman la tela acolchada del catálogo.' },
  { tab: 'Colcha', b: 'cuarto_b', a: 'r_colcha', p: 'p_colcha', name: 'Colcha navideña · Renos verde', t: '8,4 s', note: 'Edredón gris liso cambiado por la colcha estampada: respeta el diseño, la escala y la caída.' },
  { tab: 'Edredón', b: 'cuarto_a', a: 'r_edredon', p: 'p_edredon', name: 'Edredón doble faz · Azul oscuro y celeste', t: '6,5 s', note: 'Se ven las dos caras del edredón y los cojines a juego.' },
  { tab: 'Cortina', b: 'ventana_a', a: 'r_cortina_nav', p: 'p_cortina_nav', name: 'Cortina navideña + velo · Azul estrellas', t: '7,6 s', note: 'Ventana con visillos blancos. La cortina se cuelga en la misma varilla.' },
  { tab: 'Camiseta', b: 'persona_a', a: 'r_camiseta', p: 'p_camiseta', name: 'Camiseta de algodón · Verde oliva (ejemplo)', t: '8,6 s', note: 'La cara, el pelo y el fondo son los píxeles de la foto original: cambia solo la prenda, con su logo en el lugar correcto.' },
];
const gc = $('#galCmp');
function galSet(i) {
  const g = GAL[i];
  $$('#galTabs button').forEach((b, k) => b.setAttribute('aria-selected', String(k === i)));
  $('#galBefore').src = `/img/demo/${g.b}.webp`; $('#galAfter').src = `/img/demo/${g.a}.webp`;
  $('#galProd').src = g.p ? `/img/demo/${g.p}_s.webp` : `/img/demo/${g.a}.webp`;
  $('#galName').textContent = g.name; $('#galNote').textContent = g.note; $('#galTime').textContent = `IA: ${g.t} (17-oct-2026)`;
  setCut(50);
}
GAL.forEach((g, i) => $('#galTabs').append(el('button', { type: 'button', role: 'tab', 'aria-selected': 'false', onclick: () => { galSet(i); track('demo', { detalle: { galeria: g.tab } }); } }, g.tab)));
function setCut(p) { gc.style.setProperty('--cut', p + '%'); gc.dataset.cut = p; }
let gdrag = false;
const gat = (e) => { const b = gc.getBoundingClientRect(); setCut(Math.max(0, Math.min(100, ((e.clientX - b.left) / b.width) * 100))); };
gc.addEventListener('pointerdown', (e) => { gdrag = true; gc.setPointerCapture(e.pointerId); gat(e); });
gc.addEventListener('pointermove', (e) => gdrag && gat(e));
gc.addEventListener('pointerup', () => (gdrag = false));
gc.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); setCut(Math.max(0, Math.min(100, +gc.dataset.cut + (e.key === 'ArrowLeft' ? -5 : 5)))); } });
galSet(0);
// al entrar en pantalla, una pasada que enseña a deslizar
new IntersectionObserver((es, o) => { if (es[0].isIntersecting && !reduce) { o.disconnect(); const t0 = performance.now(); const f = (t) => { const k = Math.min(1, (t - t0) / 1600); setCut(50 + Math.sin(k * Math.PI * 2) * 22 * (1 - k)); if (k < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); } }, { threshold: 0.6 }).observe(gc);

/* ---------- ropa: se vende solo cuando la revisión automática de fotos está encendida en el servidor ---------- */
// Mientras esté apagada, la landing la muestra como «muy pronto» y la demo no deja probar prendas (no hay salida sin revisión).
const ROPA = call('cfg', { tenant: 'demo' }, { timeout: 8000 }).then((c) => c.ropa === true).catch(() => false);
ROPA.then((on) => {
  // la página sale sin promesas de ropa; si la prueba de ropa está encendida se agrega aquí
  if (on) {
    $('#catRopaT small')?.remove();
    const lead = $('.lead'); if (lead) for (const n of lead.childNodes) if (n.nodeType === 3 && /su ventana o su comedor/.test(n.textContent)) n.textContent = n.textContent.replace('su ventana o su comedor', 'su ventana o de sí mismo');
    return;
  }
  for (const li of $$('#plans li')) if (/y ropa/.test(li.textContent)) li.textContent = li.textContent.replace('y ropa', '(ropa: muy pronto)');
  for (const b of $$('#galTabs button')) if (b.textContent === 'Camiseta') b.textContent = 'Camiseta · pronto';
});

/* ---------- demo con la tienda del visitante ---------- */
const KIND = { protector: 'Cama', sabanas: 'Cama', edredon: 'Cama', cobija: 'Cama', almohada: 'Cama', cortina: 'Ventana', mantel: 'Comedor', forro: 'Comedor', mueble: 'Espacio', ropa: 'Ropa' };
let demoShop = '';
$('#demoForm').addEventListener('submit', (e) => { e.preventDefault(); loadShop($('#demoShop').value); });
$('#demoLitper').onclick = () => { $('#demoShop').value = 'litper.store'; loadShop('litper.store'); };
async function loadShop(raw, sample = false) {
  const shop = String(raw || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(shop)) { msg('Escribe la dirección completa, por ejemplo: mitienda.com o mitienda.myshopify.com'); return; }
  msg('Buscando tus productos…');
  const grid = $('#demoGrid'); grid.replaceChildren(...Array.from({ length: 6 }, () => el('div', { class: 'dp sk' })));
  try {
    const r = await fetch(`/api/tienda?shop=${encodeURIComponent(shop)}`); const d = await r.json();
    if (!r.ok) throw new Error(d.error);
    if (!sample) demoShop = shop; grid.replaceChildren();
    if (!d.items.length) { msg(`Encontramos ${d.total} productos en ${d.shopName}, pero ninguno es de cama, ventanas, comedor o ropa. Escríbenos y lo adaptamos.`); return; }
    const ropaOn = await ROPA, hogar = d.items.filter((it) => it.kind !== 'ropa'), ropa = d.items.length - hogar.length;
    const lista = ropaOn ? d.items : [...hogar, ...d.items.filter((it) => it.kind === 'ropa')];
    msg(sample ? `Ejemplo con ${d.shopName}: toca un producto y pruébalo con una foto. Luego escribe tu tienda arriba.`
      : ropaOn || !ropa ? `${d.shopName}: ${d.items.length} productos listos para probar. Toca uno.`
      : hogar.length ? `${d.shopName}: ${hogar.length} productos listos para probar hoy y ${ropa} de ropa que podrás probar muy pronto. Toca uno.`
      : `${d.shopName}: encontramos ${ropa} productos de ropa. La prueba de ropa llega muy pronto: déjanos tus datos abajo y te avisamos primero.`);
    for (const it of lista.slice(0, 24)) {
      const pronto = !ropaOn && it.kind === 'ropa';
      grid.append(el('button', { class: 'dp' + (pronto ? ' pronto' : ''), type: 'button', onclick: () => (pronto ? toast('La prueba de ropa llega muy pronto. Déjanos tus datos y te avisamos primero.') : openTry(shop, it.handle)) },
        el('img', { src: it.image, alt: '', loading: 'lazy' }), el('span', { text: pronto ? 'Ropa · muy pronto' : KIND[it.kind] || 'Probar' }), el('b', { text: it.title })));
    }
    if (!sample) { track('demo', { detalle: { tienda: shop, productos: d.items.length } }); $('#fTienda').value ||= shop; }
  } catch (err) {
    grid.replaceChildren();
    msg(err.message === 'no_es_shopify' ? 'Esa dirección no parece una tienda Shopify. Revisa que esté bien escrita.' : 'No pudimos leer esa tienda ahora. Revisa la dirección o intenta en un momento.');
  }
}
function msg(t) { $('#demoMsg').textContent = t; }
// link personalizado para vender: ?tienda=sutienda.com carga sus productos en la demo
const preTienda = new URLSearchParams(location.search).get('tienda');
if (preTienda) { $('#demoShop').value = preTienda; loadShop(preTienda); setTimeout(() => $('#demo').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }), 400); }
new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { o.disconnect(); if (!demoShop && !preTienda) loadShop('litper.store', true); } }, { rootMargin: '300px' }).observe($('#demo'));
const modal = $('#tryModal'), frame = $('#tryFrame');
let tryBack = null;
function openTry(shop, handle) {
  tryBack = document.activeElement;
  frame.src = `/p?demo=1&embed=1&s=${encodeURIComponent(shop)}&h=${encodeURIComponent(handle)}`;
  modal.hidden = false; document.body.style.overflow = 'hidden'; $('#tryClose').focus();
}
function closeTry() { modal.hidden = true; frame.src = 'about:blank'; document.body.style.overflow = ''; if (tryBack?.focus) tryBack.focus({ preventScroll: true }); tryBack = null; }
addEventListener('keydown', (e) => {
  if (e.key !== 'Tab' || modal.hidden) return;
  const f = [$('#tryClose'), frame];
  if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); frame.focus(); }
  else if (!e.shiftKey && !modal.contains(document.activeElement)) { e.preventDefault(); f[0].focus(); }
});
$('#tryClose').onclick = closeTry;
modal.addEventListener('click', (e) => { if (e.target === modal) closeTry(); });
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeTry(); });
addEventListener('message', (e) => {
  if (e.origin !== location.origin || !e.data?.vto) return;
  if (e.data.vto === 'close') closeTry();
  if (e.data.vto === 'demo-cta') {
    closeTry(); track('cta', { detalle: { desde: 'demo', tienda: e.data.shop } });
    $('#fTienda').value = demoShop || ''; $('#empezar').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    setTimeout(() => $('#fNombre').focus({ preventScroll: true }), 700);
    toast('Actívalo gratis 14 días en tu tienda: llena estos 3 datos.');
  }
});

/* ---------- cómo funciona: capas que se separan y se juntan con el scroll ---------- */
const how = $('#como'), layers = $$('.layer'), steps = $$('#howSteps li');
function howFrame() {
  const r = how.getBoundingClientRect(), total = r.height - innerHeight, p = Math.max(0, Math.min(1, -r.top / Math.max(1, total)));
  const step = Math.min(3, Math.floor(p * 4.2));
  steps.forEach((li, i) => li.classList.toggle('on', i === step));
  // 0→0,55: se separan las capas en 3D; 0,55→1: se juntan en el resultado final
  const open = p < 0.55 ? p / 0.55 : 1 - (p - 0.55) / 0.45, e = 0.5 - Math.cos(Math.PI * Math.max(0, Math.min(1, open))) / 2;
  layers.forEach((l, i) => {
    const z = (i - 1.5) * 120 * e, y = -(i - 1.5) * 46 * e, show = i <= step || p > 0.55;
    l.style.transform = `translate(-50%, -50%) rotateX(${52 * e}deg) rotateZ(${-24 * e}deg) translate3d(0, ${y}px, ${z}px)`;
    l.style.opacity = show ? (i === 3 || e > 0.05 ? 1 : i === 0 ? 1 : 0) : 0.0;
  });
}
if (reduce) { layers.forEach((l, i) => { l.style.transform = 'translate(-50%, -50%)'; l.style.opacity = i === 3 ? 1 : 0; }); steps.forEach((li) => li.classList.add('on')); }
else { addEventListener('scroll', () => requestAnimationFrame(howFrame), { passive: true }); addEventListener('resize', howFrame); howFrame(); }

/* ---------- datos de impacto ---------- */
$('#stats').replaceChildren(...STATS.map((s) => el('div', { class: 'stat' }, el('b', { text: s.n }), el('p', { text: s.t }), el('small', {}, s.src + ' · ', el('a', { href: s.url, target: '_blank', rel: 'noopener', text: 'fuente' })))));

/* ---------- precios ---------- */
let cur = 'COP';
function renderPlans() {
  const box = $('#plans'); box.replaceChildren();
  for (const p of PLANS) {
    const price = cur === 'COP' ? p.cop : p.usd, regular = cur === 'COP' ? p.copReg : p.usdReg;
    const btn = el('a', { class: `btn ${p.rec ? 'amber' : 'sec'}`, href: '#empezar', onclick: () => { $('#fPlan').value = p.id; track('cta', { detalle: { plan: p.id } }); } }, p.cta);
    box.append(el('article', { class: 'plan' + (p.rec ? ' rec' : '') },
      p.rec ? el('span', { class: 'badge', text: 'Recomendado' }) : null,
      el('h3', { text: p.name }), el('p', { class: 'who', text: p.who }),
      el('div', { class: 'price' }, el('b', { text: money(price, cur) }), el('span', { text: '/ mes' }), regular ? el('s', { text: money(regular, cur) }) : null),
      el('p', { class: 'ref', text: cur === 'COP' ? `≈ US$${p.usd} al mes${regular ? ' · precio fundador' : ''}` : `≈ ${money(p.cop, 'COP')} al mes${regular ? ' · precio fundador' : ''}` }),
      el('ul', {}, p.items.map((t) => el('li', {}, svg('i-check'), el('span', { text: t })))), btn));
  }
}
function svg(id) { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); const u = document.createElementNS('http://www.w3.org/2000/svg', 'use'); u.setAttribute('href', '#' + id); s.append(u); return s; }
$$('.cur .chip').forEach((b) => (b.onclick = () => { cur = b.dataset.cur; $$('.cur .chip').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); renderPlans(); }));
renderPlans();
$('#preLead').textContent = OFFER.lead; $('#garT').textContent = OFFER.garT; $('#garS').textContent = OFFER.garS;
$('#founder').replaceChildren(el('b', { text: OFFER.founderT }), el('p', { text: OFFER.founderS }));
$('#fPlan').replaceChildren(...[...PLANS.map((p) => el('option', { value: p.id, text: `${p.name} · ${money(p.cop, 'COP')}/mes` })), el('option', { value: 'no-se', text: 'Aún no sé, quiero asesoría' })]);
$('#fPlan').value = PLANS.find((p) => p.rec)?.id || PLANS[0].id;

/* ---------- alta de prueba (lead) ---------- */
const formT0 = Date.now();
$('#leadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target, m = $('#leadMsg'), b = $('#leadBtn');
  const data = { web: f.web.value, ms: Date.now() - formT0, nombre: f.nombre.value.trim(), whatsapp: f.whatsapp.value.trim(), tienda: f.tienda.value.trim(), email: f.email.value.trim(), plan: f.plan.value, origen: 'landing', utm, pais: (f.whatsapp.value.replace(/\D/g, '').startsWith('57') || !f.whatsapp.value.trim().startsWith('+')) ? 'CO' : '' };
  if (!data.nombre) return fail('Escribe tu nombre.', f.nombre);
  if (data.whatsapp.replace(/\D/g, '').length < 7) return fail('Escribe tu WhatsApp con indicativo (ej: +57 300 000 0000).', f.whatsapp);
  if (!$('#fOk').checked) return fail('Acepta que te escribamos por WhatsApp para activar tu prueba.', $('#fOk'));
  b.disabled = true; b.textContent = 'Activando…'; m.className = 'form-msg'; m.textContent = '';
  try {
    const d = await call('lead', data, { timeout: 25000 });
    track('cta', { detalle: { lead: true, plan: data.plan } });
    const t = d.tienda, inst = t ? `/instalar?t=${encodeURIComponent(t.id)}` : null;
    const done = el('div', { class: 'done', role: 'status' },
      el('b', { text: t?.nuevo ? `Listo, ${data.nombre.split(' ')[0]}: tu tienda quedó registrada` : `Gracias, ${data.nombre.split(' ')[0]}. Te escribimos en menos de 1 hora hábil.` }),
      el('p', { text: t ? (t.estado === 'pendiente' ? `Tienda «${t.id}»: tus ${t.cuota} pruebas gratis por 14 días arrancan solas cuando el botón aparezca en ${data.tienda}. Sigue la guía para pegarlo en tu tema; si prefieres, lo hacemos contigo.` : `Tienda «${t.id}» ya registrada. Te escribimos para ayudarte con la instalación.`) : 'Si nos dejaste tu tienda Shopify, te enviamos el código listo para pegar.' }),
      el('div', { class: 'row' }, inst ? el('a', { class: 'btn pri', href: inst }, 'Ver mi guía de instalación') : null,
        el('a', { class: 'btn sec', href: wa(`Hola, soy ${data.nombre}. Acabo de activar la prueba del probador${t ? ' para ' + t.id : ''}.`), target: '_blank', rel: 'noopener' }, 'Hablar por WhatsApp')),
      t ? el('p', { class: 'small', text: 'El acceso a tu panel te lo enviamos por WhatsApp cuando confirmemos que la tienda es tuya.' }) : null);
    f.replaceWith(done);
  } catch (err) {
    b.disabled = false; b.textContent = 'Activar mi prueba gratis';
    fail(err.code === 'demasiados_intentos' ? 'Ya recibimos varios registros desde aquí. Escríbenos por WhatsApp.' : err.code === 'tienda_invalida' ? 'Revisa la dirección de la tienda (ej: mitienda.com).' : 'No se pudo enviar. Revisa tu conexión o escríbenos por WhatsApp.');
  }
  function fail(t, focus) { m.className = 'form-msg err'; m.textContent = t; focus?.focus(); }
});
