// Zynex Probador — app del comprador. 2026-10-17
// Flujo: producto de la tienda → foto (cámara, galería o ejemplo) → IA (Cloudflare FLUX.2 klein, vía Supabase) → comparar → comprar.
import { call, track, money, toast, store, el, $, $$, WA, sesion } from './common.js';

const Q = new URLSearchParams(location.search);
const slug = (s) => (/^[a-z0-9][a-z0-9-]{0,200}$/.test(String(s || '').toLowerCase()) ? String(s).toLowerCase() : '');
const hostOf = (s) => { const h = String(s || '').toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, ''); return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(h) ? h : ''; };
const TENANT_SHOP = { litper: 'litper.store' };
const DEMO = Q.get('demo') === '1';
const TENANT = DEMO ? 'demo' : slug(Q.get('t')) || 'litper';
const SHOP = hostOf(Q.get('s')) || TENANT_SHOP[TENANT] || 'litper.store';
const HANDLE = slug(Q.get('h') || Q.get('p'));
const WANT_V = Number(Q.get('v')) || 0;
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
  limite_ip: ['Llegaste al máximo de pruebas de hoy', 'Mañana puedes hacer más. Si quieres ayuda para elegir, escríbenos por WhatsApp.'],
  cuota_agotada: ['El probador de esta tienda está en pausa', 'Se usaron todas las pruebas del mes. Puedes comprar normal o escribir a la tienda.'],
  tienda_inactiva: ['El probador no está activo en esta tienda', 'Puedes comprar normal desde la página del producto.'],
  tienda_no_registrada: ['El probador no está activo en esta tienda', 'Puedes comprar normal desde la página del producto.'],
  ia_cupo_diario: ['La IA está muy ocupada ahora', 'Hay muchas personas probando al mismo tiempo. Intenta en unos minutos.'],
  ia_fallo: ['No pudimos crear tu foto', 'Intenta otra vez. Si se repite, prueba con otra foto con más luz.'],
  ia_tiempo: ['Se demoró más de lo normal', 'Intenta otra vez; casi siempre tarda menos de 10 segundos.'],
  tiempo: ['Se demoró más de lo normal', 'Revisa tu conexión e intenta otra vez.'],
  foto_invalida: ['No pudimos leer esa foto', 'Prueba con otra foto (JPG o PNG) o tómala de nuevo.'],
  producto_sin_imagen: ['Este producto no tiene una foto que la IA pueda usar', 'La tienda debe subir una foto clara del producto.'],
  prenda_no_permitida: ['Esta prenda no está disponible en el probador', 'Por privacidad no probamos ropa interior ni trajes de baño.'],
  sin_internet: ['Estás sin internet', 'Revisa tu conexión e intenta otra vez.'],
  red: ['No hubo conexión con el probador', 'Revisa tu conexión e intenta otra vez.'],
};

let P = null, G = 'cama', C = COPY.cama;
let sel = { color: null, size: null, qty: null };
let photo = null; // { data, w, h, key, src }
const results = new Map();
let busy = false, lastErr = null, KIT = null, kitOn = new Set();
let CFG = { sello: true, kit: true, activo: true };

/* ---------- arranque ---------- */
init();
async function init() {
  $('#btnClose').hidden = !EMBED;
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
  $('#btnWaErr').href = `https://wa.me/${WA}?text=${encodeURIComponent('Hola, necesito ayuda con el probador de ' + SHOP)}`;
  if (DEMO) $('#byLink').removeAttribute('target');
  setupCompare();
  call('cfg', { tenant: TENANT }, { timeout: 8000 }).then((c) => { CFG = c; $('.by').hidden = !c.sello; if (!c.kit) { KIT = null; $('#kit').hidden = true; } }).catch((e) => { if (e.code === 'tienda_no_registrada') CFG.activo = false; });
  if (!HANDLE) return showPicker();
  await loadProduct(HANDLE);
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
  document.title = `${C.title} · ${P.shopName || SHOP}`;
  $('#barT').textContent = C.title; $('#barS').textContent = P.shopName ? `${P.shopName} · foto real con IA` : 'Foto real con IA';
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
  track('abrir', { tenant: TENANT, handle: P.handle, categoria: P.kind, detalle: { embed: EMBED, demo: DEMO } });
  loadKit();
}

function fatal(t, s = '') {
  setState('error'); showErr(null, t, s); $('#btnRetry').hidden = true;
}

/* ---------- producto, colores y medidas ---------- */
const idx = (role) => P.options.findIndex((o) => o.role === role);
function pickInitialVariant() {
  const v = P.variants.find((x) => x.id === WANT_V) || P.variants.find((x) => x.available) || P.variants[0];
  const ci = idx('color'), si = idx('size'), qi = idx('qty');
  sel = { color: ci >= 0 ? v.options[ci] : null, size: si >= 0 ? v.options[si] : null, qty: qi >= 0 ? v.options[qi] : null };
}
function currentVariant() {
  const ci = idx('color'), si = idx('size'), qi = idx('qty');
  const ok = (v) => (ci < 0 || v.options[ci] === sel.color) && (si < 0 || v.options[si] === sel.size) && (qi < 0 || v.options[qi] === sel.qty);
  return P.variants.find(ok) || P.variants.find((v) => ci < 0 || v.options[ci] === sel.color) || P.variants[0];
}
function colorImage(value) {
  const ci = idx('color');
  const v = ci >= 0 ? P.variants.find((x) => x.options[ci] === value && x.image) : currentVariant();
  return (v && v.image) || P.images[0];
}
function productImage() { return idx('color') >= 0 ? colorImage(sel.color) : currentVariant().image || P.images[0]; }

function renderProduct() {
  const v = currentVariant();
  $('#prod').hidden = false;
  $('#pImg').src = thumb(productImage(), 160);
  $('#pName').textContent = P.title;
  const pr = $('#pPrice'); pr.replaceChildren(money(v.price, P.currency));
  if (v.compare && v.compare > v.price) pr.append(el('s', { text: money(v.compare, P.currency) }));
  $('#buyLab').textContent = DEMO ? 'Quiero esto en mi tienda' : v.available === false ? 'Pedir este' : `Comprar · ${money(v.price, P.currency)}`;
  if (document.body.dataset.state === 'resultado') renderKit();
}
const thumb = (u, w) => (u ? u + (u.includes('?') ? '&' : '?') + 'width=' + w : '');
const SIZE_CM = { sencill: '100 × 190', semi: '120 × 190', doble: '140 × 190', queen: '160 × 190', king: '200 × 200' };
const cmOf = (v) => { const n = v.toLowerCase(); for (const k in SIZE_CM) if (n.includes(k)) return SIZE_CM[k]; return ''; };

function renderOptions() {
  const ci = idx('color'), si = idx('size'), qi = idx('qty');
  const many = (i) => i >= 0 && P.options[i].values.length > 1;
  $('#optColor').hidden = !many(ci); $('#optSize').hidden = !many(si); $('#optQty').hidden = !many(qi);
  if (ci >= 0) {
    const box = $('#swatches'); box.replaceChildren();
    $('#colorLab').textContent = /dise/i.test(P.options[ci].name) ? 'Diseño' : 'Color';
    for (const val of P.options[ci].values) {
      const b = el('button', { type: 'button', 'aria-pressed': String(val === sel.color), 'aria-label': val, title: val });
      b.append(el('img', { src: thumb(colorImage(val), 140), alt: '', loading: 'lazy' }));
      if (photo && results.has(photo.key + '|' + colorImage(val))) b.classList.add('done');
      b.onclick = () => chooseColor(val);
      box.append(b);
    }
    $('#colorVal').textContent = prettify(sel.color);
  }
  if (si >= 0) {
    const box = $('#sizes'); box.replaceChildren();
    $('#btnSizeHelp').hidden = !(G === 'cama' || G === 'ropa');
    for (const val of P.options[si].values) {
      const cm = G === 'cama' ? cmOf(val) : '';
      const b = el('button', { class: 'chip', type: 'button', 'aria-pressed': String(val === sel.size) }, prettify(val), cm ? el('small', { text: cm }) : null);
      b.onclick = () => { sel.size = val; renderOptions(); renderProduct(); track('talla', { tenant: TENANT, handle: P.handle, detalle: { valor: val } }); };
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
}
const prettify = (s) => String(s || '').toLowerCase().replace(/^\d+\s+/, '').replace(/(^|\s|-)\S/g, (m) => m.toUpperCase());

function chooseColor(val) {
  if (val === sel.color) return;
  sel.color = val; renderOptions(); renderProduct();
  track('variante', { tenant: TENANT, handle: P.handle, detalle: { valor: val } });
  if (photo && !busy) generate();
}

/* ---------- fotos ---------- */
const SAVED_KEY = () => 'vto_foto_' + G;
function savedPhoto() { const s = store.get(SAVED_KEY()); return s && Date.now() - s.t < 30 * 864e5 ? s : null; }
function renderSaved() {
  const s = savedPhoto(), box = $('#saved'); if (!box) return;
  box.hidden = !s; if (!s) return;
  $('#savedImg').src = s.data;
  $('#btnSaved').onclick = () => { track('foto', { tenant: TENANT, handle: P.handle, categoria: P.kind, detalle: { fuente: 'guardada' } }); usePhoto(s.data, 'guardada'); };
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
  const url = URL.createObjectURL(file);
  try { await usePhoto(url, fuente); } finally { setTimeout(() => URL.revokeObjectURL(url), 60000); $('#fileCam').value = ''; $('#fileGal').value = ''; }
}
async function fromUrl(url) { await usePhoto(url, 'ejemplo'); }
function loadImage(src) { return new Promise((ok, ko) => { const i = new Image(); i.decoding = 'async'; i.onload = () => ok(i); i.onerror = ko; i.src = src; }); }
async function usePhoto(src, fuente) {
  let im; try { im = await loadImage(src); } catch { return toast('No pudimos abrir esa foto. Prueba con otra.'); }
  const w0 = im.naturalWidth, h0 = im.naturalHeight; if (!w0 || !h0) return toast('No pudimos abrir esa foto.');
  if (Math.min(w0, h0) < 320) toast('La foto es pequeña; el resultado puede verse borroso.');
  const k = Math.min(1, 1024 / Math.max(w0, h0)), w = Math.round(w0 * k), h = Math.round(h0 * k);
  const c = el('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(im, 0, 0, w, h);
  let data = c.toDataURL('image/jpeg', 0.86); if (data.length > 3_800_000) data = c.toDataURL('image/jpeg', 0.7);
  photo = { data, w, h, key: hashStr(data.slice(-6000) + data.length), src: data, fuente };
  track('foto', { tenant: TENANT, handle: P.handle, categoria: P.kind, detalle: { fuente } });
  const cmp = $('#cmp');
  cmp.style.setProperty('--ar', `${w} / ${h}`); cmp.style.setProperty('--ar-n', String(w / h));
  $('#imgBefore').src = data; $('#imgAfter').removeAttribute('src');
  generate();
}
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i += 7) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
function retake() {
  photo = null; results.clear(); setState('inicio'); renderOptions(); renderSaved();
  $('#fileCam').value = ''; $('#fileGal').value = '';
}

/* ---------- IA ---------- */
async function generate() {
  if (!photo || busy) return;
  const prodUrl = productImage(), key = photo.key + '|' + prodUrl;
  if (results.has(key)) return showResult(results.get(key), false);
  busy = true; lastErr = null; setState('procesando'); startProgress();
  markSwatch(sel.color, 'loading');
  const t0 = performance.now();
  try {
    const d = await call('ai', { tenant: TENANT, kind: P.kind, garment: P.garment, photo: photo.data, product: prodUrl, color: sel.color || '', w: photo.w, h: photo.h, handle: P.handle, sesion }, { timeout: 80000 });
    results.set(key, d.image);
    await stopProgress(true);
    busy = false;
    if (productImage() !== prodUrl) { markSwatch(null); return generate(); }
    await showResult(d.image, true);
    track('ver', { tenant: TENANT, handle: P.handle, categoria: P.kind, detalle: { ms: Math.round(performance.now() - t0) } });
    offerSave(photo.fuente);
    if (KIT?.items?.length) renderKit();
  } catch (e) {
    busy = false; await stopProgress(false);
    lastErr = e.code || 'ia_fallo';
    track('error', { tenant: TENANT, handle: P.handle, detalle: { code: lastErr } });
    const [t, s] = ERR[lastErr] || ERR.ia_fallo;
    setState('error'); showErr(lastErr, t, s);
  } finally { markSwatch(null); renderOptions(); }
}
function markSwatch(val, cls) {
  $$('#swatches button').forEach((b) => b.classList.toggle('loading', !!cls && b.getAttribute('aria-label') === val));
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

async function showResult(src, animate) {
  const img = $('#imgAfter'), cmp = $('#cmp');
  await new Promise((r) => { img.onload = r; img.onerror = r; img.src = src; });
  setState('resultado');
  cmp.classList.remove('busy', 'compare', 'nudge', 'reveal', 'full');
  if (animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    cmp.classList.add('reveal');
    await wait(1150);
    cmp.classList.remove('reveal'); cmp.classList.add('full');
    await wait(700);
  }
  cmp.classList.remove('full');
  setCut(50); cmp.classList.add('compare');
  $('#cmpR').hidden = false; $('#tagL').hidden = false; $('#tagR').hidden = false;
  if (animate) { cmp.classList.add('nudge'); setTimeout(() => cmp.classList.remove('nudge'), 1800); }
  const first = !store.get('vto_hint_cmp');
  $('#resHint').textContent = first ? 'Desliza sobre la foto para comparar. Toca otro color para verlo en tu foto.' : 'Toca otro color o diseño para verlo en tu misma foto.';
  store.set('vto_hint_cmp', 1);
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- comparador ---------- */
function setCut(p) { $('#cmp').style.setProperty('--cut', p + '%'); $('#cmpR').value = p; }
function setupCompare() {
  const cmp = $('#cmp'), r = $('#cmpR');
  r.addEventListener('input', () => setCut(+r.value));
  let drag = false;
  const at = (e) => { const b = cmp.getBoundingClientRect(); setCut(Math.max(0, Math.min(100, ((e.clientX - b.left) / b.width) * 100))); };
  cmp.addEventListener('pointerdown', (e) => { if (!cmp.classList.contains('compare')) return; drag = true; cmp.setPointerCapture(e.pointerId); at(e); });
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
  if (s !== 'resultado') { $('#cmp').classList.remove('compare'); $('#cmpR').hidden = true; $('#tagL').hidden = true; $('#tagR').hidden = true; }
  $('#actsStart').hidden = !(s === 'inicio');
  $('#actsResult').hidden = s !== 'resultado';
  $('#errBox').hidden = s !== 'error';
  $('#btnRetry').hidden = false;
  $('#picker').hidden = s !== 'picker';
  $('#kit').hidden = !(s === 'resultado' && KIT?.items?.length && !DEMO);
  if (s === 'inicio' && !has) { $('#imgBefore').removeAttribute('src'); }
}
function showErr(code, t, s) { $('#errT').textContent = t; $('#errS').textContent = s; $('#btnWaErr').hidden = !['limite_ip', 'cuota_agotada', 'tienda_inactiva', 'tienda_no_registrada'].includes(code); }

/* ---------- comprar ---------- */
function post(msg) { try { window.parent.postMessage(msg, '*'); } catch {} }
let ackT = 0;
addEventListener('message', (e) => { if (e.data?.vto === 'ack') clearTimeout(ackT); });
function buy() {
  const v = currentVariant();
  if (idx('size') >= 0 && !sel.size) { toast('Elige la medida primero.'); return; }
  track('comprar', { tenant: TENANT, handle: P.handle, categoria: P.kind, detalle: { variante: String(v.id), precio: v.price } });
  if (DEMO) return post({ vto: 'demo-cta', shop: SHOP, handle: P.handle });
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
    KIT = d; kitOn = new Set(d.items.slice(0, 2).map((i) => i.handle));
  } catch {}
}
function kitVariant(it) {
  const tok = (sel.size || '').toLowerCase().replace(/cama /, '').slice(0, 5);
  const av = it.variants.filter((v) => v.available !== false), list = av.length ? av : it.variants;
  return (tok && list.find((v) => v.options.some((o) => o.toLowerCase().includes(tok)))) || list[0];
}
function renderKit() {
  if (!KIT?.items?.length || DEMO) return;
  const list = $('#kitList'); list.replaceChildren();
  const main = currentVariant(); let total = main.price, n = 1;
  for (const it of KIT.items) {
    const v = kitVariant(it), on = kitOn.has(it.handle);
    const row = el('div', { class: 'ki', role: 'checkbox', tabindex: '0', 'aria-checked': String(on) },
      el('img', { src: v.image || it.image, alt: '', loading: 'lazy' }),
      el('div', {}, el('b', { text: it.title }), el('span', { text: money(v.price, P.currency) })), el('i'));
    const tog = () => { kitOn.has(it.handle) ? kitOn.delete(it.handle) : kitOn.add(it.handle); renderKit(); };
    row.onclick = tog; row.onkeydown = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); tog(); } };
    list.append(row);
    if (on) { total += v.price; n++; }
  }
  $('#kitLab').textContent = `Agregar ${n} productos · ${money(total, P.currency)}`;
  $('#kit').hidden = document.body.dataset.state !== 'resultado';
}
function buyKit() {
  const items = [{ id: currentVariant().id, quantity: 1 }];
  for (const it of KIT.items) if (kitOn.has(it.handle)) items.push({ id: kitVariant(it).id, quantity: 1 });
  track('kit', { tenant: TENANT, handle: P.handle, detalle: { n: items.length } });
  const url = `https://${SHOP}/cart/${items.map((i) => `${i.id}:${i.quantity}`).join(',')}?storefront=true`;
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
  track('compartir', { tenant: TENANT, handle: P.handle });
  const text = `¿Cómo me queda? Lo probé en mi casa con IA: ${P.url}`;
  try {
    const blob = await composeShare(), f = new File([blob], 'mi-prueba.jpg', { type: 'image/jpeg' });
    if (navigator.canShare?.({ files: [f] })) { await navigator.share({ files: [f], text, title: P.title }); return; }
    download(blob, 'mi-prueba.jpg');
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  } catch (e) { if (e?.name !== 'AbortError') toast('No pudimos compartir. Usa Guardar y envíala tú.'); }
}
async function save() {
  track('descargar', { tenant: TENANT, handle: P.handle });
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
    for (const [k, w] of BED_W) { const v = P.options[idx('size')]?.values.find((x) => x.toLowerCase().includes(k)); if (v) tb.append(el('tr', { 'data-k': k }, el('td', { text: prettify(v) }), el('td', { text: `${SIZE_CM[k]} cm` }))); }
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
    pick = values.find((v) => v.toLowerCase().includes(best[0]));
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
  if (pick) { sel.size = pick; renderOptions(); renderProduct(); track('talla', { tenant: TENANT, handle: P.handle, detalle: { ayuda: true, valor: pick } }); }
  const ok = $('#btnSizeOk'); ok.textContent = pick ? `Usar ${prettify(pick)}` : 'Calcular otra vez';
  ok.onclick = pick ? () => { closeSheets(); ok.textContent = 'Calcular'; ok.onclick = calcSize; } : calcSize;
}
function openSheet(id) { $('#sheetBg').hidden = false; $(id).hidden = false; $(id).querySelector('input, button:not([data-close])')?.focus({ preventScroll: true }); }
function closeSheets() { $('#sheetBg').hidden = true; $$('.sheet').forEach((s) => (s.hidden = true)); }

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
