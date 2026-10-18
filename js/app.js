// Zynex Probador — app del comprador. 2026-10-17
// Flujo: producto de la tienda → foto (cámara, galería o ejemplo) → IA (Cloudflare FLUX.2 klein, vía Supabase) → comparar → comprar.
import { call, track, money, toast, store, el, $, $$, WA, sesion } from './common.js';
import { fuse, corregir } from './fusion.js';
import { refInfo } from './ref.js';

const Q = new URLSearchParams(location.search);
const slug = (s) => (/^[a-z0-9][a-z0-9-]{0,200}$/.test(String(s || '').toLowerCase()) ? String(s).toLowerCase() : '');
const hostOf = (s) => { const h = String(s || '').toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, ''); return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(h) ? h : ''; };
const TENANT_SHOP = { litper: 'litper.store' };
const DEMO = Q.get('demo') === '1';
const TENANT = DEMO ? 'demo' : slug(Q.get('t')) || 'litper';
let SHOP = DEMO ? hostOf(Q.get('s')) : TENANT_SHOP[TENANT] || ''; // tenant real: el dominio sale de cfg, nunca de la URL
const HANDLE = slug(Q.get('h') || Q.get('p'));
const WANT_V = Number(Q.get('v')) || 0;
const WANT_EXPL = Q.get('vs') === '1'; // el cliente ya eligió medida y color en la ficha de la tienda
const EMBED = Q.get('embed') === '1' || window.top !== window.self;

const GROUP = { protector: 'cama', sabanas: 'cama', edredon: 'cama', cobija: 'cama', almohada: 'cama', cama: 'cama', cortina: 'cortina', mantel: 'mesa', forro: 'mesa', mueble: 'mueble', ropa: 'ropa' };
const COPY = {
  cama: { title: 'Pruébalo en tu cama', empty: 'Toma una foto de tu cama', tip: 'Que se vea la cama completa, con buena luz. La IA hace el resto.', cam: 'Tomar foto de mi cama', gal: 'Subir de la galería', samples: ['cuarto_a', 'cuarto_b'], sampleLab: 'o usa un cuarto de ejemplo', steps: ['Leyendo la luz de tu cuarto', 'Ubicando tu cama y el colchón', 'Poniendo la tela en tu cama', 'Ajustando pliegues y sombras'], after: 'Con el producto', facing: 'environment' },
  cortina: { title: 'Pruébala en tu ventana', empty: 'Toma una foto de tu ventana', tip: 'Párate frente a la ventana y que se vea completa.', cam: 'Tomar foto de mi ventana', gal: 'Subir de la galería', samples: ['ventana_a'], sampleLab: 'o usa una ventana de ejemplo', steps: ['Leyendo la luz', 'Ubicando tu ventana', 'Colgando la cortina', 'Ajustando caída y pliegues'], after: 'Con la cortina', facing: 'environment' },
  mesa: { title: 'Pruébalo en tu comedor', empty: 'Toma una foto de tu comedor', tip: 'Que se vean la mesa y las sillas completas.', cam: 'Tomar foto de mi comedor', gal: 'Subir de la galería', samples: ['comedor_a'], sampleLab: 'o usa un comedor de ejemplo', steps: ['Leyendo la luz', 'Ubicando mesa y sillas', 'Poniendo el producto', 'Ajustando pliegues y sombras'], after: 'Con el producto', facing: 'environment' },
  mueble: { title: 'Pruébalo en tu espacio', empty: 'Toma una foto del lugar', tip: 'Fotografía el sitio donde lo pondrías, con espacio libre.', cam: 'Tomar foto del espacio', gal: 'Subir de la galería', samples: ['entrada_a', 'bano_a'], sampleLab: 'o usa un espacio de ejemplo', steps: ['Leyendo la luz', 'Midiendo el espacio', 'Poniendo el producto a escala', 'Ajustando sombras'], after: 'Con el producto', facing: 'environment' },
  ropa: { title: 'Pruébatelo', empty: 'Sube una foto tuya de cuerpo entero', tip: 'De frente, con buena luz y ropa ajustada. Mejor si alguien te la toma.', cam: 'Tomar una foto mía', gal: 'Subir una foto mía', samples: ['persona_a', 'persona_b'], sampleLab: 'o usa una persona de ejemplo', steps: ['Leyendo la luz', 'Ubicando tu cuerpo y tu postura', 'Ajustando la prenda a tu cuerpo', 'Puliendo arrugas y caída'], after: 'Con la prenda', facing: 'user' },
};
const ILLU = { cama: 's-cama', cortina: 's-cortina', mesa: 's-mesa', mueble: 's-mueble', ropa: 's-ropa' };
const ERR = {
  limite_ip: ['Llegaste al máximo de pruebas de hoy', 'Mañana puedes hacer más. Puedes comprar normal desde la tienda.'],
  limite_sesion: ['Ya hiciste muchas pruebas en esta visita', 'Elige el que más te gustó y cómpralo, o vuelve mañana para probar más.'],
  limite_tienda_dia: ['El probador no está disponible por ahora', 'Puedes comprar normal desde la página del producto.'],
  cuota_agotada: ['El probador no está disponible por ahora', 'Puedes comprar normal desde la página del producto.'],
  tienda_inactiva: ['El probador no está disponible por ahora', 'Puedes comprar normal desde la página del producto.'],
  tienda_no_registrada: ['El probador no está disponible por ahora', 'Puedes comprar normal desde la página del producto.'],
  ia_cupo_diario: ['El probador está en pausa por unas horas', 'Puedes comprar normal; vuelve a intentarlo más tarde.'],
  ia_fallo: ['No pudimos crear tu foto', 'Intenta otra vez. Si se repite, prueba con otra foto con más luz.'],
  ia_rechazo: ['La IA no aceptó esta foto', 'Prueba con otra foto: de frente, con buena luz y sin otras personas.'],
  ia_tiempo: ['Se demoró más de lo normal', 'Intenta otra vez; casi siempre tarda menos de 12 segundos.'],
  tiempo: ['Se demoró más de lo normal', 'Revisa tu conexión e intenta otra vez.'],
  foto_invalida: ['No pudimos leer esa foto', 'Prueba con otra foto (JPG o PNG) o tómala de nuevo.'],
  foto_no_permitida: ['No podemos usar esta foto', 'Solo probamos ropa sobre personas mayores de edad, vestidas. Prueba con otra foto.'],
  falta_consentimiento: ['Falta tu autorización', 'Marca la casilla para confirmar que la foto es tuya o tienes permiso.'],
  moderacion_no_disponible: ['No pudimos revisar la foto', 'Intenta otra vez en un momento.'],
  ropa_no_disponible: ['La prueba de ropa no está disponible por ahora', 'Puedes comprar normal desde la página del producto.'],
  producto_sin_imagen: ['Este producto no tiene una foto que la IA pueda usar', 'La tienda debe subir una foto clara del producto.'],
  imagen_no_valida: ['Esta foto del producto no se puede usar', 'Elige otro color o diseño.'],
  producto_no_encontrado: ['No encontramos este producto en la tienda', 'Puede que ya no esté disponible.'],
  producto_sin_probador: ['Este producto aún no tiene probador', 'Puedes verlo y comprarlo normal en la tienda.'],
  prenda_no_permitida: ['Esta prenda no está disponible en el probador', 'Por privacidad no probamos ropa interior ni trajes de baño.'],
  sin_internet: ['Estás sin internet', 'Revisa tu conexión e intenta otra vez.'],
  red: ['No hubo conexión con el probador', 'Revisa tu conexión e intenta otra vez.'],
};

// En la demo de la landing quien prueba es un comerciante: los avisos le hablan a él
const ERR_DEMO = {
  limite_tienda_dia: ['La demo en vivo llegó a su tope de hoy', 'Mira los ejemplos reales de esta página o déjanos tus datos y te la mostramos por WhatsApp.'],
  limite_ip: ['Ya hiciste muchas pruebas hoy', 'Déjanos tus datos y te la mostramos por WhatsApp con tus productos.'],
  limite_sesion: ['Ya hiciste muchas pruebas en esta visita', 'Déjanos tus datos y te mostramos más por WhatsApp.'],
  ropa_no_disponible: ['La prueba de ropa llega muy pronto', 'Mientras tanto prueba un producto de hogar de tu tienda: cama, cortinas o comedor.'],
};
let P = null, G = 'cama', C = COPY.cama;
let sel = { color: null, size: null, qty: null, extra: {} };
let shown = null; // último resultado mostrado: { key de la foto, color, src }
let genN = 0; // cada prueba lleva su número: una prueba vieja no pisa los avisos de una nueva
let photo = null; // { data (foto completa), ai (versión de 512 px para la IA), w, h (medidas para la IA), fw, fh, key }
const results = new Map();
let busy = false, lastErr = null, KIT = null, kitOn = new Set();
let CFG = { sello: true, kit: true, activo: true, wa: null, tok: null, ropa: false, ia: true };
// Cuando se agota el cupo de IA, el servidor revisa cada hora si ya volvió (Cloudflare no siempre lo devuelve a las 00:00 UTC):
// no se promete una hora exacta.
function vuelveIA() { return 'en unas horas'; }
let cfgReady = null;
// Métricas del panel de la tienda: viajan con la sesión firmada (tok) que entrega cfg; sin ella el servidor las rechaza
const trk = (tipo, extra = {}) => { (cfgReady || Promise.resolve()).then(() => { if (CFG.tok) track(tipo, { ...extra, tok: CFG.tok }); }).catch(() => {}); };

/* ---------- arranque ---------- */
init();
async function init() {
  $('#btnClose').hidden = !EMBED || DEMO; // en la demo de la landing el modal ya trae su propia X
  $('#btnClose').onclick = () => post({ vto: 'close' });
  $('#btnInfo').onclick = () => openSheet('#mInfo');
  $$('[data-close]').forEach((b) => (b.onclick = closeSheets));
  $('#sheetBg').onclick = closeSheets;
  addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (!$('#sheetBg').hidden) closeSheets(); else if (EMBED) post({ vto: 'close' }); } });
  $('#fileCam').onchange = (e) => fromFile(e.target.files[0], 'camara');
  $('#fileGal').onchange = (e) => fromFile(e.target.files[0], 'galeria');
  $('#btnRetake').onclick = retake;
  $('#btnRetry').onclick = () => (lastErr === 'foto_invalida' ? retake() : generate());
  $('#btnBuy').onclick = buy;
  $('#btnShare').onclick = share;
  $('#btnSave').onclick = save;
  $('#btnSizeHelp').onclick = openSizeHelp;
  $('#btnKit').onclick = buyKit;
  if (DEMO) $('#byLink').removeAttribute('target');
  setupCompare();
  $('#chkConsent').onchange = () => { try { sessionStorage.setItem('vto_consent', $('#chkConsent').checked ? '1' : ''); } catch {} syncConsent(); };
  try { $('#chkConsent').checked = sessionStorage.getItem('vto_consent') === '1'; } catch {}
  cfgReady = loadCfg();
  if (!SHOP) { await cfgReady; SHOP = CFG.dominio || ''; if (!SHOP) return fatal('El probador no está disponible por ahora.', 'Puedes comprar normal desde la tienda.'); }
  if (!HANDLE) return showPicker();
  await loadProduct(HANDLE);
}

async function loadCfg() {
  try {
    const c = await call('cfg', { tenant: TENANT }, { timeout: 8000 });
    CFG = { ...CFG, ...c };
    $('.by').hidden = !c.sello; if (!c.kit) { KIT = null; $('#kit').hidden = true; }
    if (c.wa) $('#btnWaErr').href = `https://wa.me/${c.wa}?text=${encodeURIComponent('Hola, necesito ayuda con el probador')}`;
  } catch (e) { if (e.code === 'tienda_no_registrada') CFG.activo = false; }
}
async function loadProduct(handle) {
  setState('cargando');
  try {
    const r = await fetch(`/api/catalogo?shop=${encodeURIComponent(SHOP)}&handle=${encodeURIComponent(handle)}`);
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'no_existe');
    P = await r.json();
  } catch (e) {
    return fatal(e.message === 'no_existe' ? 'No encontramos este producto en la tienda.' : 'La tienda no respondió. Intenta otra vez en un momento.');
  }
  if (P.kind === 'bloqueado') return fatal('Esta prenda no está disponible en el probador.', 'Por privacidad no probamos ropa interior ni trajes de baño.');
  if (P.kind === 'otro') return fatal('Este producto aún no tiene probador.', 'Puedes verlo y comprarlo normal en la tienda.');
  G = GROUP[P.kind] || 'cama'; C = COPY[G];
  $('#illu use').setAttribute('href', '#' + ILLU[G]);
  $('#emptyT').textContent = C.empty; $('#emptyS').textContent = C.tip; // antes de cualquier aviso, para que el texto corresponda a la ilustración
  if (G === 'ropa') { await cfgReady; if (!CFG.ropa) return DEMO ? fatal(...ERR_DEMO.ropa_no_disponible) : fatal('La prueba de ropa no está disponible por ahora.', 'Puedes verla y comprarla normal en la tienda.'); }
  $('#consent').hidden = G !== 'ropa'; syncConsent();
  document.title = `${C.title} · ${P.shopName || SHOP}`;
  $('#barT').textContent = C.title; $('#barS').textContent = P.shopName ? `${P.shopName} · simulación con IA` : 'Simulación con IA sobre tu foto';
  $('#emptyT').textContent = C.empty; $('#emptyS').textContent = C.tip;
  $('#illu use').setAttribute('href', '#' + ILLU[G]);
  $('#camLab').textContent = C.cam; $('#galLab').textContent = C.gal; $('#sampleLab').textContent = C.sampleLab;
  $('#fileCam').setAttribute('capture', C.facing);
  $('#tagR').textContent = P.shopName && P.shopName.length <= 16 ? `Con ${P.shopName}` : C.after;
  $('#sizeLab').textContent = G === 'ropa' ? 'Talla' : 'Medida';
  $('#btnSizeHelp').textContent = G === 'ropa' ? '¿Cuál es mi talla?' : '¿Cuál es la mía?';
  $('#kitT').textContent = { cama: 'Completa tu cama', cortina: 'Completa tu cuarto', mesa: 'Completa tu comedor', mueble: 'Complementa tu espacio', ropa: 'Completa tu look' }[G];
  renderSamples(); renderSaved();
  pickInitialVariant();
  renderProduct(); renderOptions();
  setState('inicio');
  trk('abrir', { tenant: TENANT, handle: P.handle, categoria: P.kind, detalle: { embed: EMBED, demo: DEMO } });
  cfgReady.then(() => { if (CFG.ia === false && !busy) pausaIA(); });
  loadKit();
}

function pausaIA() { // cupo de IA agotado hoy: se avisa antes de pedir la foto
  lastErr = 'ia_cupo_diario';
  fatal('El probador está en pausa', DEMO ? `La demo en vivo vuelve ${vuelveIA()}. Mientras tanto, mira los ejemplos reales de esta página.` : `Vuelve ${vuelveIA()}. Mientras tanto puedes comprar normal desde la tienda.`);
}
function fatal(t, s = '') {
  setState('error'); showErr(null, t, s); $('#btnRetry').hidden = true;
}

/* ---------- producto, colores y medidas ---------- */
const idx = (role) => P.options.findIndex((o) => o.role === role);
// Opciones que no son el color principal, la medida ni la cantidad (ej. segundo diseño de un kit): el cliente las elige todas
function extraIdx() { const main = [idx('color'), idx('size'), idx('qty')]; return P.options.map((_, i) => i).filter((i) => !main.includes(i) && P.options[i].values.length > 1); }
function pickInitialVariant() {
  const ci = idx('color'), si = idx('size'), qi = idx('qty');
  const ok = (x) => ci < 0 || !sinFoto(x.options[ci]); // empezar en un color o diseño que sí se puede probar
  const w = P.variants.find((x) => x.id === WANT_V);
  const v = (w && ok(w) ? w : null) || P.variants.find((x) => x.available && ok(x)) || P.variants.find(ok) || w || P.variants.find((x) => x.available) || P.variants[0];
  const one = (i) => i >= 0 && P.options[i].values.length === 1;
  const pre = (i) => (one(i) ? v.options[i] : WANT_EXPL && w ? w.options[i] : null); // lo que el cliente ya eligió en la ficha se respeta
  sel = { color: ci >= 0 ? v.options[ci] : null, size: si >= 0 ? pre(si) : null, qty: qi >= 0 ? v.options[qi] : null, extra: {} };
  for (const i of extraIdx()) sel.extra[i] = pre(i);
}
// Variante exacta de lo elegido (null si esa combinación no existe en la tienda)
function exactVariant() {
  const ci = idx('color'), si = idx('size'), qi = idx('qty'), xs = extraIdx();
  return P.variants.find((v) => (ci < 0 || v.options[ci] === sel.color) && (si < 0 || v.options[si] === sel.size) && (qi < 0 || v.options[qi] === sel.qty) && xs.every((i) => v.options[i] === sel.extra[i])) || null;
}
// ¿Existe la combinación si cambio la opción i por val?
function existe(i, val) {
  const ci = idx('color'), si = idx('size'), qi = idx('qty'), xs = extraIdx();
  const want = (k) => (k === i ? val : k === ci ? sel.color : k === si ? sel.size : k === qi ? sel.qty : sel.extra[k]);
  return P.variants.some((v) => [ci, si, qi, ...xs].every((k) => k < 0 || want(k) == null || v.options[k] === want(k)));
}
function currentVariant() {
  const ci = idx('color'), si = idx('size'), qi = idx('qty'), xs = extraIdx();
  const ok = (v) => (ci < 0 || v.options[ci] === sel.color) && (si < 0 || v.options[si] === sel.size) && (qi < 0 || v.options[qi] === sel.qty) && xs.every((i) => !sel.extra[i] || v.options[i] === sel.extra[i]);
  return P.variants.find(ok) || P.variants.find((v) => ci < 0 || v.options[ci] === sel.color) || P.variants[0];
}
// Qué falta elegir antes de comprar: la medida (o talla) y cada opción extra
function falta() {
  const si = idx('size');
  if (si >= 0 && P.options[si].values.length > 1 && !sel.size) return { txt: G === 'ropa' ? 'tu talla' : 'tu medida', el: '#optSize' };
  for (const i of extraIdx()) if (!sel.extra[i]) return { txt: prettify(P.options[i].name).toLowerCase(), el: `#optX${i}` };
  return null;
}
function colorImage(value) {
  const ci = idx('color');
  const v = ci >= 0 ? P.variants.find((x) => x.options[ci] === value && x.image) : currentVariant();
  return (v && v.image) || P.images[0];
}
function productImage() { return idx('color') >= 0 ? colorImage(sel.color) : currentVariant().image || P.images[0]; }

function renderProduct() {
  const fx = falta(), ex = fx ? null : exactVariant(), v = ex || currentVariant(), noExiste = !fx && !ex;
  $('#prod').hidden = false;
  $('#pImg').src = thumb(productImage(), 160);
  $('#pName').textContent = P.title;
  const pr = $('#pPrice');
  if (fx || noExiste) {
    const ci = idx('color'), same = P.variants.filter((x) => ci < 0 || x.options[ci] === sel.color), min = Math.min(...same.map((x) => x.price));
    pr.replaceChildren(`Desde ${money(min, P.currency)}`);
  } else {
    pr.replaceChildren(money(v.price, P.currency));
    if (v.compare && v.compare > v.price) pr.append(el('s', { text: money(v.compare, P.currency) }));
  }
  $('#buyLab').textContent = DEMO ? 'Quiero esto en mi tienda' : fx ? `Elige ${fx.txt} para comprar` : noExiste ? 'Esa combinación no existe' : v.available === false ? 'Pedir este' : `Comprar · ${money(v.price, P.currency)}`;
  if (document.body.dataset.state === 'resultado') renderKit();
}
const sinFoto = (val) => !!(P?.sinFoto?.length && P.sinFoto.includes(val));
const thumb = (u, w) => (u ? u + (u.includes('?') ? '&' : '?') + 'width=' + w : '');
const SIZE_CM = { sencill: '100 × 190', semi: '120 × 190', doble: '140 × 190', queen: '160 × 190', king: '200 × 200' };
// Clave única de medida de cama: «SEMIDOBLE» es semi (no doble), «Cama doble 140» es doble, «1.40 x 1.90» es doble.
export function sizeKey(s) {
  const n = String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (/semi/.test(n)) return 'semi';
  if (/sencill|individual|twin|\b1 ?plaza/.test(n)) return 'sencill';
  if (/queen/.test(n)) return 'queen';
  if (/king/.test(n)) return 'king';
  if (/doble|double|\bfull\b|matrimonial/.test(n)) return 'doble';
  const m = /(\d+(?:[.,]\d+)?)/.exec(n); if (m) { let w = parseFloat(m[1].replace(',', '.')); if (w < 3) w *= 100; const near = [[100, 'sencill'], [120, 'semi'], [140, 'doble'], [160, 'queen'], [200, 'king']].find(([c]) => Math.abs(c - w) <= 10); if (near) return near[1]; }
  return 'x:' + n.trim();
}
const cmOf = (v) => (P?.currency === 'COP' ? SIZE_CM[sizeKey(v)] || '' : ''); // medidas colombianas: solo tiendas en pesos
const SIZE_ORDER = ['sencill', 'semi', 'doble', 'queen', 'king'];
const bySize = (a, b) => { const x = SIZE_ORDER.indexOf(sizeKey(a)), y = SIZE_ORDER.indexOf(sizeKey(b)); return (x < 0 ? 9 : x) - (y < 0 ? 9 : y); };

function renderOptions() {
  const ci = idx('color'), si = idx('size'), qi = idx('qty');
  const many = (i) => i >= 0 && P.options[i].values.length > 1;
  $('#optColor').hidden = !many(ci); $('#optSize').hidden = !many(si); $('#optQty').hidden = !many(qi);
  if (ci >= 0) {
    const box = $('#swatches');
    $('#colorLab').textContent = /dise/i.test(P.options[ci].name) ? 'Diseño' : 'Color';
    if (box.dataset.for !== P.handle) { // se crean una sola vez por producto
      box.replaceChildren(); box.dataset.for = P.handle;
      for (const val of P.options[ci].values) {
        const b = el('button', { type: 'button', 'aria-label': prettify(val), title: prettify(val) });
        b.dataset.val = val;
        if (sinFoto(val)) { b.classList.add('nofoto'); b.append(el('span', { text: prettify(val) })); } else b.append(el('img', { src: thumb(colorImage(val), 140), alt: '', decoding: 'async' }));
        b.onclick = () => chooseColor(val);
        box.append(b);
      }
    }
    for (const b of box.children) {
      const val = b.dataset.val; b.setAttribute('aria-pressed', String(val === sel.color));
      b.classList.toggle('done', !!(photo && results.has(photo.key + '|' + colorImage(val))));
    }
    $('#colorVal').textContent = prettify(sel.color);
  }
  if (si >= 0) {
    const box = $('#sizes'); box.replaceChildren();
    $('#btnSizeHelp').hidden = !((G === 'cama' && P.currency === 'COP') || G === 'ropa');
    const vals = G === 'cama' ? [...P.options[si].values].sort(bySize) : P.options[si].values;
    for (const val of vals) {
      const cm = G === 'cama' ? cmOf(val) : '';
      const ok = existe(si, val);
      const b = el('button', { class: 'chip' + (ok ? '' : ' na'), type: 'button', 'aria-pressed': String(val === sel.size), 'aria-disabled': String(!ok), title: ok ? '' : 'No viene en este color o diseño' }, prettify(val), cm ? el('small', { text: cm }) : ok ? null : el('small', { text: 'No disponible' }));
      b.onclick = () => { if (!ok) return toast('Esa medida no viene en este color o diseño.'); sel.size = val; renderOptions(); renderProduct(); if (KIT?.items?.length) renderKit(); trk('talla', { tenant: TENANT, handle: P.handle, detalle: { valor: val } }); };
      box.append(b);
    }
  }
  if (qi >= 0) {
    const box = $('#qtys'); box.replaceChildren(); $('#qtyLab').textContent = prettify(P.options[qi].name);
    for (const val of P.options[qi].values) {
      const b = el('button', { class: 'chip', type: 'button', 'aria-pressed': String(val === sel.qty) }, prettify(val));
      b.onclick = () => { sel.qty = val; renderOptions(); renderProduct(); };
      box.append(b);
    }
  }
  const xbox = $('#optExtra'); xbox.replaceChildren();
  for (const i of extraIdx()) { // ej. «Diseño del forro» en el kit puerta y ventana: también se elige
    const name = String(P.options[i].name || '').toLowerCase().replace(/^./, (m) => m.toUpperCase()); // «Diseño de forro»
    const chips = el('div', { class: 'chips', role: 'group', 'aria-label': name });
    for (const val of P.options[i].values) {
      const ok = existe(i, val);
      const b = el('button', { class: 'chip' + (ok ? '' : ' na'), type: 'button', 'aria-pressed': String(val === sel.extra[i]), 'aria-disabled': String(!ok) }, prettify(val));
      b.onclick = () => { if (!ok) return toast('Esa opción no viene con lo que elegiste.'); sel.extra[i] = val; renderOptions(); renderProduct(); };
      chips.append(b);
    }
    xbox.append(el('div', { class: 'opt', id: `optX${i}` }, el('div', { class: 'lab' }, el('span', { text: name })), chips));
  }
}
// Etiquetas legibles: «VINO TINTO» → «Vino Tinto»; las tallas (XS, XL, 2XL, 3XL) quedan en mayúscula
const prettify = (s) => String(s || '').toLowerCase().replace(/^\d+\s+/, '').replace(/(^|\s|-)\S/g, (m) => m.toUpperCase()).replace(/\b(\d?x{1,3}[sl]|xs|xl)\b/gi, (m) => m.toUpperCase());

function chooseColor(val) {
  if (val === sel.color) return;
  sel.color = val;
  const si = idx('size');
  if (si >= 0 && sel.size && !existe(si, sel.size)) { toast(`La medida ${prettify(sel.size)} no viene en ${prettify(val)}: elige otra.`); sel.size = null; }
  for (const i of extraIdx()) if (sel.extra[i] && !existe(i, sel.extra[i])) sel.extra[i] = null;
  renderOptions(); renderProduct();
  trk('variante', { tenant: TENANT, handle: P.handle, detalle: { valor: val } });
  if (sinFoto(val)) {
    if (shown && document.body.dataset.state === 'resultado') { $('#cmp').classList.add('stale'); $('#resHint').textContent = `Este diseño no tiene foto propia para probarlo: la foto muestra «${prettify(shown.color)}». Puedes comprar «${prettify(val)}» igual.`; }
    else $('#resHint').textContent = 'Este diseño no tiene foto propia en la tienda, así que no lo podemos probar. Puedes comprarlo igual.';
    toast('Este diseño no tiene foto para probarlo.'); return;
  }
  $('#cmp').classList.remove('stale');
  if (photo && !busy) generate();
}

/* ---------- fotos ---------- */
const SAVED_KEY = () => 'vto_foto_' + G;
function savedPhoto() { const s = store.get(SAVED_KEY()); return s && Date.now() - s.t < 30 * 864e5 ? s : null; }
function renderSaved() {
  const s = savedPhoto(), box = $('#saved'); if (!box) return;
  box.hidden = !s; if (!s) return;
  $('#savedImg').src = s.data;
  $('#btnSaved').onclick = () => { trk('foto', { tenant: TENANT, handle: P.handle, categoria: P.kind, detalle: { fuente: 'guardada' } }); usePhoto(s.data, 'guardada'); };
  $('#btnSavedDel').onclick = () => { try { localStorage.removeItem(SAVED_KEY()); } catch {} renderSaved(); toast('Borramos tu foto de este celular.'); };
}
function offerSave(fuente) {
  if (!['camara', 'galeria'].includes(fuente) || savedPhoto()?.key === photo?.key) return;
  const hint = $('#resHint'); hint.replaceChildren('¿Guardamos tu foto en este celular para probar otros productos sin tomarla de nuevo? ',
    el('button', { class: 'link', type: 'button', onclick: () => { store.set(SAVED_KEY(), { data: photo.data, w: photo.w, h: photo.h, key: photo.key, t: Date.now() }); hint.textContent = 'Listo: tu foto queda solo en este celular (puedes borrarla cuando quieras).'; } }, 'Sí, guardar'),
    ' · ', el('button', { class: 'link', type: 'button', onclick: () => { hint.textContent = 'Desliza sobre la foto para comparar.'; } }, 'No'));
}
function renderSamples() {
  const row = $('#samples'); row.replaceChildren();
  for (const s of C.samples) {
    const b = el('button', { type: 'button', 'aria-label': 'Usar foto de ejemplo' }, el('img', { src: `/img/demo/${s}.webp`, alt: '', loading: 'lazy' }));
    b.onclick = () => fromUrl(`/img/demo/${s}.jpg`);
    row.append(b);
  }
}
async function fromFile(file, fuente) {
  if (!file) return;
  if (!/^image\//.test(file.type) && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) return toast('Ese archivo no es una foto.');
  if (G === 'ropa' && !consentOk()) { $('#fileCam').value = ''; $('#fileGal').value = ''; return toast('Primero marca la casilla de autorización.'); }
  toast('Preparando tu foto…', 6000);
  let src = null, url = null;
  try { if (window.createImageBitmap) src = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch { src = null; }
  if (!src) url = URL.createObjectURL(file);
  try { await usePhoto(src || url, fuente); } finally { if (url) setTimeout(() => URL.revokeObjectURL(url), 60000); $('#fileCam').value = ''; $('#fileGal').value = ''; }
}
async function fromUrl(url) { await usePhoto(url, 'ejemplo'); }
function loadImage(src) { return new Promise((ok, ko) => { const i = new Image(); i.decoding = 'async'; i.onload = () => ok(i); i.onerror = ko; i.src = src; }); }
async function usePhoto(src, fuente) {
  let im; try { im = typeof src === 'string' ? await loadImage(src) : src; } catch { return toast('No pudimos abrir esa foto. Prueba con otra.'); }
  const w0 = im.naturalWidth || im.width, h0 = im.naturalHeight || im.height; if (!w0 || !h0) return toast('No pudimos abrir esa foto.');
  if (Math.min(w0, h0) < 300) return toast('La foto es muy pequeña. Toma una nueva o elige otra de más calidad.');
  if (Math.min(w0, h0) < 500) toast('La foto es pequeña; el resultado puede verse borroso.');
  // Encuadre único para la foto, la IA y el resultado: la IA recibe 512 px (múltiplos de 16) y devuelve el doble,
  // así su imagen calza exacto sobre la foto original y la fusión conserva tus píxeles reales.
  const k5 = 512 / Math.max(w0, h0), aw = Math.max(256, Math.round((w0 * k5) / 16) * 16), ah = Math.max(256, Math.round((h0 * k5) / 16) * 16);
  let cw = w0, ch = Math.round(w0 * ah / aw); if (ch > h0) { ch = h0; cw = Math.round(h0 * aw / ah); }
  const cx = Math.round((w0 - cw) / 2), cy = Math.round((h0 - ch) / 2);
  const kf = Math.min(1, 1024 / Math.max(cw, ch)), fw = Math.round(cw * kf), fh = Math.round(ch * kf);
  const draw = (w, h) => { const c = el('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(im, cx, cy, cw, ch, 0, 0, w, h); return c; };
  let data = draw(fw, fh).toDataURL('image/jpeg', 0.88); if (data.length > 3_800_000) data = draw(fw, fh).toDataURL('image/jpeg', 0.72);
  const ai = draw(aw, ah).toDataURL('image/jpeg', 0.9);
  photo = { data, ai, w: aw, h: ah, fw, fh, key: hashStr(data.slice(-6000) + data.length), src: data, fuente };
  if (im.close) try { im.close(); } catch {}
  trk('foto', { tenant: TENANT, handle: P.handle, categoria: P.kind, detalle: { fuente } });
  const cmp = $('#cmp');
  cmp.style.setProperty('--ar', `${fw} / ${fh}`); cmp.style.setProperty('--ar-n', String(fw / fh));
  // foto horizontal en celular: el escenario se ajusta a la foto (sin franjas vacías) y los botones suben
  document.body.dataset.orient = fw / fh > 1.05 ? 'h' : 'v'; $('.stage').style.setProperty('--ar-n', String(fw / fh));
  $('#imgBefore').src = data; $('#imgAfter').removeAttribute('src');
  generate();
}
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i += 7) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
function retake() {
  photo = null; shown = null; results.clear(); delete document.body.dataset.orient; setState('inicio'); renderOptions(); renderSaved();
  $('#fileCam').value = ''; $('#fileGal').value = '';
}

/* ---------- IA ---------- */
async function generate(retry = true) {
  if (!photo || busy) return;
  if (sinFoto(sel.color)) { toast('Este diseño no tiene foto para probarlo. Elige otro.'); return; }
  const prodUrl = productImage(), key = photo.key + '|' + prodUrl;
  if (CFG.ia === false && !results.has(key)) { // IA en pausa hoy: no se gasta otra llamada
    const m = DEMO ? `La demo en vivo vuelve ${vuelveIA()}.` : `El probador está en pausa: vuelve ${vuelveIA()}. Puedes comprar este color igual.`;
    if (shown) { sel.color = shown.color; renderOptions(); renderProduct(); $('#resHint').textContent = m; }
    toast(m, 5000); return;
  }
  if (results.has(key)) { shown = { key: photo.key, color: sel.color, src: results.get(key) }; return showResult(results.get(key), false); }
  const gen = ++genN;
  busy = true; lastErr = null; setState('procesando'); startProgress();
  const tt = document.getElementById('toast'); if (tt && /Preparando tu foto/.test(tt.textContent)) tt.classList.remove('on'); // ya se ve el avance
  markSwatch(sel.color, 'loading');
  const t0 = performance.now();
  try {
    await cfgReady;
    // color y zona de la tela en la foto de la variante (en paralelo; si tarda, la IA no la espera)
    const refP = refInfo(prodUrl, sel.color || ''), ref0 = await Promise.race([refP, wait(1200).then(() => null)]);
    const d = await call('ai', { tenant: TENANT, tok: CFG.tok, shop: DEMO ? SHOP : undefined, handle: P.handle, photo: photo.ai || photo.data, product: prodUrl, color: sel.color || '', w: photo.w, h: photo.h, sesion, n: 2, consiento: G === 'ropa' ? (photo.fuente === 'ejemplo' || consentOk()) : undefined, ref: ref0 ? { hex: ref0.hex, box: ref0.box } : undefined }, { timeout: 80000 });
    const fz = await fuseResult(photo, d.images?.length ? d.images : [d.image], ref0 || (await refP));
    results.set(key, fz.src);
    await stopProgress(true);
    busy = false;
    if (productImage() !== prodUrl) { markSwatch(null); return generate(); }
    shown = { key: photo.key, color: sel.color, src: fz.src };
    trk('ver', { tenant: TENANT, handle: P.handle, categoria: P.kind, detalle: { ms: Math.round(performance.now() - t0), fusion: fz.info.ok ? 1 : 0, motivo: fz.info.motivo || '', err: fz.info.err ?? null, costura: fz.info.seam ?? null, n: fz.n, elegida: fz.i, prod: fz.info.prod ? `${fz.info.prod.dE ?? '-'}|${fz.info.prod.nuevo}|${fz.info.color ? 'c' : ''}|${fz.info.prod.arriba ?? '-'}|${fz.copias}` : '' } });
    await showResult(fz.src, true, gen);
    if (gen !== genN) return; // mientras se mostraba, el cliente ya pidió otra prueba
    if (fz.info.motivo === 'encuadre') $('#resHint').textContent = 'La IA movió un poco el encuadre de tu foto. Desliza para comparar.';
    if (d.restan_sesion != null && d.restan_sesion <= 3) $('#resHint').textContent += d.restan_sesion > 1 ? ` Te quedan ${d.restan_sesion} pruebas en esta visita.` : d.restan_sesion === 1 ? ' Te queda 1 prueba en esta visita.' : ' Esta fue tu última prueba en esta visita.';
    offerSave(photo.fuente);
    if (KIT?.items?.length) renderKit();
  } catch (e) {
    busy = false;
    if (e.code === 'sesion_invalida' && retry) { await stopProgress(false); cfgReady = loadCfg(); await cfgReady; markSwatch(null); return generate(false); }
    await stopProgress(false);
    lastErr = e.code || 'ia_fallo';
    trk('error', { tenant: TENANT, handle: P.handle, detalle: { code: lastErr } });
    const [t, s0] = (DEMO && ERR_DEMO[lastErr]) || ERR[lastErr] || ERR.ia_fallo, s = lastErr === 'ia_cupo_diario' ? (DEMO ? `La demo en vivo vuelve ${vuelveIA()}. Mientras tanto, mira los ejemplos reales de esta página.` : `Vuelve ${vuelveIA()}. Mientras tanto puedes comprar normal desde la tienda.`) : s0;
    if (lastErr === 'ia_cupo_diario') CFG.ia = false;
    if (shown && photo && shown.key === photo.key) { // ya había un resultado: no se pierde «Comprar»
      sel.color = shown.color; renderOptions(); renderProduct();
      await showResult(shown.src, false);
      const msg = lastErr === 'limite_sesion' ? 'Ya hiciste muchas pruebas en esta visita: compra el que más te gustó o vuelve mañana para probar más.' : `No pudimos probar ese color: ${t.toLowerCase()}. ${s}`;
      $('#resHint').textContent = msg; toast(msg, 5000);
      return;
    }
    setState('error'); showErr(lastErr, t, s);
  } finally { markSwatch(null); renderOptions(); }
}
// Fusión fiel: llegan 2 versiones de la IA; se queda la que mejor conserva tu foto real (cuarto, cara, luz)
// y, si calza, se funde con tus píxeles originales. Si ninguna calza, se muestra la más fiel tal cual.
// Mejor de 2: gana la versión que funde con la foto real, conserva el color de la tela y no trae objetos nuevos
// el fondo intacto manda; el color de la tela solo desempata; castigo fuerte si casi no aparece la tela y más fuerte si la IA
// trajo un mueble del catálogo encima de la tela (cabecero copiado): esa versión pierde aunque sea la única que se funde
const castigo = (inf) => { const p = inf.prod; if (!p) return 0; return (p.dE != null ? 0.1 * p.dE : 0) + (p.frac < 0.25 ? 12 : 0) + (p.arriba > 0.04 ? 150 + 100 * p.arriba : 0); };
async function fuseResult(ph, gens, ref = null) {
  let o; try { o = await loadImage(ph.data); } catch { return { src: gens[0], info: { motivo: 'error' }, i: 0, n: gens.length, copias: 0 }; }
  let best = null, copias = 0; // copias: versiones con un mueble del catálogo encima de la tela
  for (let i = 0; i < gens.length; i++) {
    let r, g = null;
    try { g = await loadImage(gens[i]); await new Promise((ok) => requestAnimationFrame(() => ok())); r = fuse(o, g, ref); } catch { r = { canvas: null, info: { motivo: 'error' } }; }
    if (r.info.prod?.arriba > 0.04) copias++;
    const score = (r.canvas ? r.info.err : 100 + (r.info.err ?? 50) + (r.info.seam ?? 0) / 4) + castigo(r.info);
    if (!best || score < best.score) best = { score, i, r, g };
  }
  const { r, i, g } = best;
  if (!r.canvas && g && ref) { // sin fusión: se muestra la imagen de la IA, con el color de la tela corregido
    try { const c = corregir(g, ref); if (c) return { src: c.canvas.toDataURL('image/jpeg', 0.92), info: { ...r.info, color: c.info.color, prod: { dE: c.info.dE, nuevo: '-', arriba: r.info.prod?.arriba } }, i, n: gens.length, copias }; } catch {}
  }
  return { src: r.canvas ? r.canvas.toDataURL('image/jpeg', 0.9) : gens[i], info: r.info || {}, i, n: gens.length, copias };
}
function markSwatch(val, cls) {
  $$('#swatches button').forEach((b) => b.classList.toggle('loading', !!cls && b.dataset.val === val));
}

let progT = 0, progStart = 0;
function startProgress() {
  const list = $('#stepList'); list.replaceChildren(...C.steps.map((s) => el('li', {}, el('i'), s)));
  $('#steps').hidden = false; progStart = performance.now();
  const lis = $$('#stepList li'), cmp = $('#cmp'), bar = $('#progBar');
  cancelAnimationFrame(progT);
  const tick = () => {
    const t = (performance.now() - progStart) / 1000;
    const p = Math.min(0.94, 1 - Math.exp(-t / 4.2)); // se acerca al 94 % en ~10 s
    bar.style.width = (p * 100).toFixed(1) + '%';
    const step = Math.min(lis.length - 1, Math.floor(t / 2.2));
    lis.forEach((li, i) => { li.className = i < step ? 'ok' : i === step ? 'on' : ''; });
    cmp.style.setProperty('--scan', (((t % 2.4) / 2.4) * 100).toFixed(1) + '%');
    progT = requestAnimationFrame(tick);
  };
  tick();
}
function stopProgress(ok) {
  cancelAnimationFrame(progT);
  if (!ok) { $('#steps').hidden = true; return Promise.resolve(); }
  $('#progBar').style.width = '100%'; $$('#stepList li').forEach((li) => (li.className = 'ok'));
  return new Promise((r) => setTimeout(() => { $('#steps').hidden = true; r(); }, 380));
}

async function showResult(src, animate, g = genN) {
  const img = $('#imgAfter'), cmp = $('#cmp'); cmp.classList.remove('stale');
  await new Promise((r) => { img.onload = r; img.onerror = r; img.src = src; });
  if (g !== genN) return; // ya hay una prueba más nueva en curso
  setState('resultado');
  cmp.classList.remove('busy', 'compare', 'nudge', 'reveal', 'full');
  if (animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    skipReveal = false; cmp.classList.add('reveal');
    await waitOr(1150);
    if (g !== genN) return;
    cmp.classList.remove('reveal'); if (!skipReveal) { cmp.classList.add('full'); await waitOr(700); }
    if (g !== genN) return;
  }
  cmp.classList.remove('full');
  setCut(50); cmp.classList.add('compare');
  $('#cmpR').hidden = false; $('#tagL').hidden = false; $('#tagR').hidden = false;
  // muestra del color real del producto (foto del catálogo) junto a la simulación
  const real = shown?.color && idx('color') >= 0 ? colorImage(shown.color) : productImage();
  $('#tagSwImg').style.backgroundImage = real ? `url("${thumb(real, 160)}")` : ''; $('#tagSw').hidden = !real;
  if (animate) { cmp.classList.add('nudge'); setTimeout(() => cmp.classList.remove('nudge'), 1800); }
  const first = !store.get('vto_hint_cmp');
  $('#resHint').textContent = first ? 'Desliza sobre la foto para comparar. Toca otro color para verlo en tu foto.' : 'Toca otro color o diseño para verlo en tu misma foto.';
  store.set('vto_hint_cmp', 1);
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let skipReveal = false;
const waitOr = (ms) => new Promise((r) => { const t0 = performance.now(); const f = () => (skipReveal || performance.now() - t0 >= ms ? r() : requestAnimationFrame(f)); f(); });

/* ---------- comparador ---------- */
function setCut(p) { $('#cmp').style.setProperty('--cut', p + '%'); $('#cmpR').value = p; }
function setupCompare() {
  const cmp = $('#cmp'), r = $('#cmpR');
  r.addEventListener('input', () => setCut(+r.value));
  let drag = false;
  const at = (e) => { const b = cmp.getBoundingClientRect(); setCut(Math.max(0, Math.min(100, ((e.clientX - b.left) / b.width) * 100))); };
  cmp.addEventListener('pointerdown', (e) => {
    if (cmp.classList.contains('reveal') || cmp.classList.contains('full')) { skipReveal = true; cmp.classList.remove('reveal', 'full'); cmp.classList.add('compare'); }
    if (!cmp.classList.contains('compare')) return; drag = true; cmp.setPointerCapture(e.pointerId); at(e);
  });
  cmp.addEventListener('pointermove', (e) => drag && at(e));
  cmp.addEventListener('pointerup', () => (drag = false));
  cmp.addEventListener('pointercancel', () => (drag = false));
}

/* ---------- estados ---------- */
function setState(s) {
  document.body.dataset.state = s;
  const has = !!photo;
  $('#empty').hidden = has;
  $('#frame').hidden = !has;
  $('#cmp').classList.toggle('busy', s === 'procesando');
  if (s !== 'resultado') { $('#cmp').classList.remove('compare'); $('#cmpR').hidden = true; $('#tagL').hidden = true; $('#tagR').hidden = true; $('#tagSw').hidden = true; }
  $('#actsStart').hidden = !(s === 'inicio');
  $('#actsResult').hidden = s !== 'resultado';
  $('#errBox').hidden = s !== 'error';
  $('#btnRetry').hidden = false;
  $('#picker').hidden = s !== 'picker';
  $('#kit').hidden = !(s === 'resultado' && KIT?.items?.length && !DEMO);
  if (s === 'inicio' && !has) { $('#imgBefore').removeAttribute('src'); }
}
function showErr(code, t, s) {
  $('#errT').textContent = t; $('#errS').textContent = s;
  $('#btnWaErr').hidden = !CFG.wa || !['limite_ip', 'limite_sesion', 'ia_fallo', 'ia_rechazo', 'producto_sin_imagen', 'imagen_no_valida'].includes(code);
  $('#btnRetry').hidden = ['cuota_agotada', 'tienda_inactiva', 'tienda_no_registrada', 'limite_tienda_dia', 'limite_sesion', 'limite_ip', 'ropa_no_disponible', 'prenda_no_permitida', 'producto_sin_probador'].includes(code);
  if (DEMO) { // en la demo quien lee es un comerciante: siempre hay un paso siguiente
    const wa = $('#btnWaErr');
    const b = $('#btnDemoCta') || wa.parentElement.insertBefore(el('button', { class: 'btn pri', id: 'btnDemoCta', type: 'button', onclick: () => { trk('cta', { tenant: TENANT, handle: P?.handle, detalle: { desde: 'demo-error', code: code || '' } }); post({ vto: 'demo-cta', shop: SHOP, handle: P?.handle || '' }); } }, 'Quiero esto en mi tienda'), wa);
    b.hidden = false;
    wa.hidden = false; wa.href = `https://wa.me/${CFG.wa || WA}?text=${encodeURIComponent('Hola, quiero ver el probador con IA en mi tienda' + (SHOP ? ` (${SHOP})` : ''))}`;
    if (!wa.dataset.demo) { wa.dataset.demo = '1'; wa.replaceChildren(...[wa.querySelector('svg'), 'Escríbenos'].filter(Boolean)); }
  }
}
// autorización para fotos de personas (Ley 1581): casilla antes de tomar o subir la foto
function consentOk() { return $('#chkConsent').checked; }
function syncConsent() {
  const need = G === 'ropa' && !consentOk();
  for (const id of ['#fileCam', '#fileGal']) { const i = $(id); i.disabled = need; i.closest('.btn').classList.toggle('off', need); }
}

/* ---------- comprar ---------- */
function post(msg) { try { window.parent.postMessage(msg, '*'); } catch {} }
let ackT = 0;
addEventListener('message', (e) => { if (e.data?.vto === 'ack') clearTimeout(ackT); });
function pedirFalta(f) {
  toast(`Elige ${f.txt} primero.`); const o = $(f.el); if (!o) return;
  o.scrollIntoView({ behavior: 'smooth', block: 'center' }); o.classList.add('pulse'); setTimeout(() => o.classList.remove('pulse'), 1600);
}
function buy() {
  const v = exactVariant() || currentVariant();
  if (DEMO) { trk('cta', { tenant: TENANT, handle: P.handle, detalle: { desde: 'demo' } }); return post({ vto: 'demo-cta', shop: SHOP, handle: P.handle }); }
  const f = falta(); if (f) return pedirFalta(f);
  if (!exactVariant()) return toast('Esa combinación no existe en la tienda. Elige otra medida o color.');
  trk('comprar', { tenant: TENANT, handle: P.handle, categoria: P.kind, detalle: { variante: String(v.id), precio: v.price } });
  const url = `${P.url}?variant=${v.id}#zvto-comprar`;
  if (EMBED) {
    post({ vto: 'buy', handle: P.handle, variant: v.id, url });
    ackT = setTimeout(() => { try { window.top.location.href = url; } catch { window.open(url, '_blank', 'noopener'); } }, 900);
  } else location.href = url;
}

/* ---------- kit / completa la compra ---------- */
async function loadKit() {
  if (DEMO || CFG.kit === false) return;
  try {
    const r = await fetch(`/api/kit?shop=${encodeURIComponent(SHOP)}&handle=${encodeURIComponent(P.handle)}`);
    const d = await r.json(); if (!d.items?.length) return;
    KIT = d; kitOn = new Set(); // nada marcado por defecto: el cliente decide qué agregar
  } catch {}
}
function kitVariant(it) {
  const av = it.variants.filter((v) => v.available !== false), list = av.length ? av : it.variants;
  if (list.length === 1) return list[0];
  if (!sel.size) return null;
  const want = sizeKey(sel.size), up = String(sel.size).trim().toUpperCase();
  const m = list.filter((v) => v.options.some((o) => sizeKey(o) === want || String(o).trim().toUpperCase() === up));
  return m.length === 1 ? m[0] : null; // si hay varios colores para esa medida, el color lo elige el cliente
}
const kitPick = new Map(); // producto del kit → variante que el cliente eligió a mano
function kitChosen(it) {
  const av = it.variants.filter((v) => v.available !== false), opts = av.length ? av : it.variants;
  return (kitPick.has(it.handle) && opts.find((x) => x.id === kitPick.get(it.handle))) || kitVariant(it);
}
function renderKit() {
  if (!KIT?.items?.length || DEMO) return;
  const list = $('#kitList'); list.replaceChildren();
  const main = currentVariant(); let total = main.price, n = 1;
  for (const it of KIT.items) {
    const av = it.variants.filter((v) => v.available !== false), opts = av.length ? av : it.variants;
    const v = kitChosen(it);
    const on = kitOn.has(it.handle) && !!v;
    const id = 'k_' + it.handle.slice(0, 40);
    const cb = el('input', { type: 'checkbox', id, checked: on, 'aria-label': `Agregar ${it.title}` });
    cb.onchange = () => { if (cb.checked && !v) { cb.checked = false; toast('Elige la medida o el color de este producto.'); sel2?.focus(); return; } cb.checked ? kitOn.add(it.handle) : kitOn.delete(it.handle); renderKit(); };
    const vt = (x) => (/^default title$/i.test(x.title) ? 'Presentación única' : prettify(x.title));
    const sel2 = opts.length < 2 ? null : el('select', { class: 'ki-sel', 'aria-label': `Medida y color de ${it.title}` },
      el('option', { value: '', text: v ? 'Cambiar medida o color' : 'Elige medida y color' }),
      ...opts.map((x) => el('option', { value: String(x.id), selected: v && x.id === v.id, text: `${vt(x)} · ${money(x.price, P.currency)}` })));
    if (sel2) sel2.onchange = () => { const nv = opts.find((x) => String(x.id) === sel2.value); if (!nv) return; kitPick.set(it.handle, nv.id); kitOn.add(it.handle); renderKit(); };
    const row = el('div', { class: 'ki' + (on ? ' on' : '') },
      el('img', { src: (v && v.image) || it.image, alt: '', loading: 'lazy' }),
      el('div', {}, el('label', { for: id }, el('b', { text: it.title })),
        el('small', { class: 'ki-v', text: v ? vt(v) : 'Falta elegir medida o color' }),
        el('span', { text: v ? money(v.price, P.currency) : '' }), sel2),
      cb);
    list.append(row);
    if (on) { total += v.price; n++; }
  }
  $('#kitLab').textContent = n > 1 ? `Agregar ${n} productos · ${money(total, P.currency)}` : `Agregar solo este · ${money(total, P.currency)}`;
  $('#kit').hidden = document.body.dataset.state !== 'resultado';
}
function buyKit() {
  const f = falta(); if (f) return pedirFalta(f);
  const main = exactVariant(); if (!main) return toast('Esa combinación no existe en la tienda. Elige otra medida o color.');
  const items = [{ id: main.id, quantity: 1 }];
  for (const it of KIT.items) { const v = kitChosen(it); if (kitOn.has(it.handle) && v) items.push({ id: v.id, quantity: 1 }); }
  trk('kit', { tenant: TENANT, handle: P.handle, detalle: { n: items.length } });
  // contraentrega (Releasit): carrito + formulario; si no, directo al pago
  const ids = items.map((i) => `${i.id}:${i.quantity}`).join(',');
  const url = CFG.cod ? `https://${SHOP}/cart/${ids}?storefront=true#rsi-form-top-anchor` : `https://${SHOP}/cart/${ids}`;
  if (EMBED) { post({ vto: 'cart', items, url }); ackT = setTimeout(() => { try { window.top.location.href = url; } catch { window.open(url, '_blank', 'noopener'); } }, 900); }
  else location.href = url;
}

/* ---------- compartir y guardar ---------- */
async function composeShare() {
  const a = await loadImage($('#imgAfter').src), b = await loadImage(photo.data);
  const W = 1080, H = Math.round(W * a.naturalHeight / a.naturalWidth), c = el('canvas'); c.width = W; c.height = H + 150;
  const x = c.getContext('2d');
  x.fillStyle = '#07080a'; x.fillRect(0, 0, c.width, c.height); x.drawImage(a, 0, 0, W, H);
  const tw = 250, th = Math.round(tw * b.naturalHeight / b.naturalWidth);
  x.fillStyle = '#fff'; x.fillRect(28, 28, tw + 8, th + 8); x.drawImage(b, 32, 32, tw, th);
  x.fillStyle = 'rgba(7,8,10,.75)'; x.fillRect(32, 32 + th - 40, 92, 40); x.fillStyle = '#fff'; x.font = '600 24px Outfit, sans-serif'; x.fillText('Antes', 44, 32 + th - 12);
  x.fillStyle = '#00ff88'; x.fillRect(0, H, W, 6);
  x.fillStyle = '#eef3f0'; x.font = '700 40px Outfit, sans-serif'; x.fillText(trim(x, P.title, W - 80), 40, H + 66);
  x.fillStyle = '#9ba6a1'; x.font = '500 30px Outfit, sans-serif'; x.fillText(`Lo probé con IA en ${P.shopName || SHOP}`, 40, H + 116);
  return new Promise((r) => c.toBlob(r, 'image/jpeg', 0.9));
}
function trim(x, s, max) { if (x.measureText(s).width <= max) return s; while (s.length > 4 && x.measureText(s + '…').width > max) s = s.slice(0, -1); return s + '…'; }
async function share() {
  trk('compartir', { tenant: TENANT, handle: P.handle });
  const text = `¿Cómo me queda? Lo probé en mi casa con IA: ${P.url}`;
  try {
    const blob = await composeShare(), f = new File([blob], 'mi-prueba.jpg', { type: 'image/jpeg' });
    if (navigator.canShare?.({ files: [f] })) { await navigator.share({ files: [f], text, title: P.title }); return; }
    download(blob, 'mi-prueba.jpg');
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  } catch (e) { if (e?.name !== 'AbortError') toast('No pudimos compartir. Usa Guardar y envíala tú.'); }
}
async function save() {
  trk('descargar', { tenant: TENANT, handle: P.handle });
  const blob = await (await fetch($('#imgAfter').src)).blob();
  download(blob, `${P.handle.slice(0, 40)}-en-mi-casa.jpg`); toast('Foto guardada.');
}
function download(blob, name) { const a = el('a', { href: URL.createObjectURL(blob), download: name }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); }

/* ---------- ayuda de medida y talla ---------- */
const BED_W = [['sencill', 100], ['semi', 120], ['doble', 140], ['queen', 160], ['king', 200]];
const CHART = [['XS', 82], ['S', 88], ['M', 96], ['L', 104], ['XL', 112], ['XXL', 120]];
let fit = 0;
function openSizeHelp() {
  const ropa = G === 'ropa';
  $('#sizeHome').hidden = ropa; $('#sizeBody').hidden = !ropa; $('#sizeRes').hidden = true;
  $('#mSizeT').textContent = ropa ? '¿Cuál es tu talla?' : '¿Cuál es tu medida?';
  if (!ropa) {
    const tb = $('#sizeTable'); tb.replaceChildren();
    for (const [k] of BED_W) { const v = P.options[idx('size')]?.values.find((x) => sizeKey(x) === k); if (v) tb.append(el('tr', { 'data-k': k }, el('td', { text: prettify(v) }), el('td', { text: `${SIZE_CM[k]} cm` }))); }
  }
  $$('#fitChips .chip').forEach((b) => (b.onclick = () => { fit = +b.dataset.fit; $$('#fitChips .chip').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); }));
  $('#btnSizeOk').textContent = 'Calcular'; $('#btnSizeOk').onclick = calcSize;
  openSheet('#mSize');
}
function calcSize() {
  const si = idx('size'), values = si >= 0 ? P.options[si].values : [];
  let pick = null, msg = '';
  if (G !== 'ropa') {
    const w = +$('#inAncho').value; if (!(w >= 60 && w <= 230)) return toast('Escribe el ancho en centímetros (ej: 140).');
    const best = BED_W.reduce((a, c) => (Math.abs(c[1] - w) < Math.abs(a[1] - w) ? c : a));
    pick = values.find((v) => sizeKey(v) === best[0]);
    $$('#sizeTable tr').forEach((tr) => tr.classList.toggle('on', tr.dataset.k === best[0]));
    msg = `Para un colchón de ${w} cm de ancho. Si tu colchón es muy alto (más de 30 cm), escríbenos antes de comprar.`;
  } else {
    const hcm = +$('#inAlto').value, kg = +$('#inPeso').value;
    if (!(hcm >= 120 && hcm <= 220) || !(kg >= 30 && kg <= 200)) return toast('Escribe tu estatura (cm) y tu peso (kg).');
    const bmi = kg / (hcm / 100) ** 2, chest = 0.535 * hcm + 1.7 * (bmi - 22);
    let i = CHART.findIndex((r) => chest <= r[1] + 2); if (i < 0) i = CHART.length - 1; i = Math.max(0, Math.min(CHART.length - 1, i + fit));
    const want = CHART[i][0];
    pick = values.find((v) => v.toUpperCase().trim() === want) || values.find((v) => v.toUpperCase().split(/[\s/]/).includes(want));
    msg = `Es una estimación con tu estatura y peso. Revisa la tabla de medidas de la tienda si estás entre dos tallas.`;
    if (!pick) msg = `Te sugerimos ${want}. ` + msg;
  }
  const res = $('#sizeRes'); res.hidden = false; res.replaceChildren(el('small', { text: 'Te recomendamos' }), el('b', { text: pick ? prettify(pick) : G === 'ropa' ? '—' : 'Revisa la tabla' }), el('p', { class: 'muted small', text: msg }));
  if (pick) { sel.size = pick; renderOptions(); renderProduct(); if (KIT?.items?.length) renderKit(); trk('talla', { tenant: TENANT, handle: P.handle, detalle: { ayuda: true, valor: pick } }); }
  const ok = $('#btnSizeOk'); ok.textContent = pick ? `Usar ${prettify(pick)}` : 'Calcular otra vez';
  ok.onclick = pick ? () => { closeSheets(); ok.textContent = 'Calcular'; ok.onclick = calcSize; } : calcSize;
}
let sheetBack = null;
function openSheet(id) {
  sheetBack = document.activeElement; $('#sheetBg').hidden = false; $(id).hidden = false;
  $(id).querySelector('input, button:not([data-close])')?.focus({ preventScroll: true });
}
addEventListener('keydown', (e) => {
  if (e.key !== 'Tab') return;
  const sh = $$('.sheet').find((x) => !x.hidden); if (!sh) return;
  const f = $$('button, [href], input, select, textarea', sh).filter((x) => !x.disabled && x.offsetParent !== null);
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && (document.activeElement === last || !sh.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
});
function closeSheets() { $('#sheetBg').hidden = true; $$('.sheet').forEach((s) => (s.hidden = true)); if (sheetBack?.focus) sheetBack.focus({ preventScroll: true }); sheetBack = null; }

/* ---------- selector de producto (sin handle) ---------- */
async function showPicker() {
  setState('picker');
  $('#barT').textContent = 'Probador con IA'; $('#emptyT').textContent = 'Elige un producto para probar'; $('#emptyS').textContent = 'Luego tomas una foto y lo ves puesto en segundos.';
  try {
    const d = await (await fetch(`/api/tienda?shop=${encodeURIComponent(SHOP)}`)).json();
    const grid = $('#pickGrid'); grid.replaceChildren();
    for (const it of d.items || []) {
      const b = el('button', { class: 'pk', type: 'button' }, el('img', { src: it.image, alt: '', loading: 'lazy' }), el('b', { text: it.title }));
      b.onclick = () => { history.replaceState(null, '', `?${new URLSearchParams({ ...Object.fromEntries(Q), h: it.handle })}`); $('#picker').hidden = true; loadProduct(it.handle); };
      grid.append(b);
    }
    if (!d.items?.length) $('#pickGrid').append(el('p', { class: 'muted', text: 'Esta tienda aún no tiene productos que se puedan probar.' }));
  } catch { toast('La tienda no respondió.'); }
}

window.__probador = { get P() { return P; }, get sel() { return sel; }, get state() { return document.body.dataset.state; } };
