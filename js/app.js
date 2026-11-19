// Zynex Probador — app del comprador. 2026-11-19 (v4.17: auditoría 5 — la casilla guarda la huella del texto y se desmarca si el
//   texto o la categoría cambian; error de IA sin culpar a la demanda; ?t=demo con salida clara; servidor vto-api v6.10.0)
// v4.16: auditoría 4 — ficha propia del navegador, página que incrusta informada,
//   diálogo accesible, casilla revisada al enviar; servidor vto-api v6.9.0)
// v4.15: auditoría 3, cierre — servidor vto-api v6.8.0
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
// Tema (19-nov-2026): por defecto el claro de Litper (css/app.css); con el sistema en oscuro, Litper oscuro.
// A/B: ?tema=oscuro → tema negro neón anterior tal cual; ?tema=claro → claro forzado. La elección queda en la sesión.
const TEMA = (() => {
  const q = String(Q.get('tema') || '').toLowerCase(); let t = q === 'oscuro' || q === 'claro' ? q : '';
  try { if (t) sessionStorage.setItem('vto_tema', t); else t = sessionStorage.getItem('vto_tema') || ''; } catch {}
  return t === 'oscuro' || t === 'claro' ? t : '';
})();
if (TEMA) {
  document.documentElement.dataset.tema = TEMA;
  for (const m of document.querySelectorAll('meta[name=theme-color]')) { m.removeAttribute('media'); m.content = TEMA === 'oscuro' ? '#07080a' : '#FAF8F3'; }
}

const SAMPLES = 'https://gtsivwbnhcawvmsfujby.supabase.co/storage/v1/object/public/vto-samples/';
const GROUP = { protector: 'cama', sabanas: 'cama', edredon: 'cama', cobija: 'cama', almohada: 'cama', cama: 'cama', cortina: 'cortina', mantel: 'mesa', forro: 'mesa', mueble: 'mueble', ropa: 'ropa' };
const COPY = {
  cama: { title: 'Pruébalo en tu cama', empty: 'Toma una foto de tu cama', tip: 'Que se vea la cama completa, con buena luz. La IA hace el resto.', cam: 'Tomar foto de mi cama', gal: 'Subir de la galería', samples: ['cuarto_01', 'cuarto_02', 'cuarto_03', 'cuarto_04', 'cuarto_05', 'cuarto_06', 'cuarto_07', 'cuarto_08', 'cuarto_09', 'cuarto_10', 'cuarto_11', 'cuarto_12'], sampleLab: 'o usa un cuarto de ejemplo', steps: ['Leyendo la luz de tu cuarto', 'Ubicando tu cama y el colchón', 'Poniendo la tela en tu cama', 'Ajustando pliegues y sombras'], after: 'Con el producto', facing: 'environment' },
  cortina: { title: 'Pruébala en tu ventana', empty: 'Toma una foto de tu ventana', tip: 'Párate frente a la ventana y que se vea completa.', cam: 'Tomar foto de mi ventana', gal: 'Subir de la galería', samples: ['ventana_01', 'ventana_02', 'ventana_03', 'ventana_04', 'ventana_05', 'ventana_06', 'ventana_07', 'ventana_08', 'ventana_09', 'ventana_10', 'ventana_11', 'ventana_12'], sampleLab: 'o usa una ventana de ejemplo', steps: ['Leyendo la luz', 'Ubicando tu ventana', 'Colgando la cortina', 'Ajustando caída y pliegues'], after: 'Con la cortina', facing: 'environment' },
  mesa: { title: 'Pruébalo en tu comedor', empty: 'Toma una foto de tu comedor', tip: 'Que se vean la mesa y las sillas completas.', cam: 'Tomar foto de mi comedor', gal: 'Subir de la galería', samples: ['comedor_01', 'comedor_02', 'comedor_03', 'comedor_04', 'comedor_05', 'comedor_06', 'comedor_07', 'comedor_08', 'comedor_09', 'comedor_10', 'comedor_11'], sampleLab: 'o usa un comedor de ejemplo', steps: ['Leyendo la luz', 'Ubicando mesa y sillas', 'Poniendo el producto', 'Ajustando pliegues y sombras'], after: 'Con el producto', facing: 'environment' },
  mueble: { title: 'Pruébalo en tu espacio', empty: 'Toma una foto del lugar', tip: 'Fotografía el sitio donde lo pondrías, con espacio libre.', cam: 'Tomar foto del espacio', gal: 'Subir de la galería', samples: ['espacio_01', 'espacio_02', 'espacio_03', 'espacio_04', 'espacio_05', 'espacio_06', 'espacio_07', 'espacio_08', 'espacio_09', 'espacio_10', 'bano_01', 'bano_02', 'bano_03', 'bano_04', 'bano_05', 'bano_06', 'bano_07', 'bano_08', 'bano_09', 'bano_10'], sampleLab: 'o usa un espacio de ejemplo', steps: ['Leyendo la luz', 'Midiendo el espacio', 'Poniendo el producto a escala', 'Ajustando sombras'], after: 'Con el producto', facing: 'environment' },
  ropa: { title: 'Pruébatelo', empty: 'Sube una foto tuya de cuerpo entero', tip: 'De frente, con buena luz y ropa ajustada. Mejor si alguien te la toma.', cam: 'Tomar una foto mía', gal: 'Subir una foto mía', samples: ['persona_01', 'persona_02', 'persona_03', 'persona_04', 'persona_05', 'persona_06', 'persona_07', 'persona_08', 'persona_09', 'persona_10', 'persona_11', 'persona_12'], samplesZapato: ['zapato_01', 'zapato_02', 'zapato_03', 'zapato_04', 'zapato_05', 'zapato_06', 'zapato_07', 'zapato_08', 'zapato_09', 'zapato_10', 'zapato_11'], sampleLab: 'o usa una persona de ejemplo', steps: ['Leyendo la luz', 'Ubicando tu cuerpo y tu postura', 'Ajustando la prenda a tu cuerpo', 'Puliendo arrugas y caída'], after: 'Con la prenda', facing: 'user' },
};
const ILLU = { cama: 's-cama', cortina: 's-cortina', mesa: 's-mesa', mueble: 's-mueble', ropa: 's-ropa' };
const ERR = {
  limite_ip: ['Llegaste al máximo de pruebas de hoy', 'Mañana puedes hacer más. Puedes comprar normal desde la tienda.'],
  limite_sesion: ['Ya hiciste muchas pruebas en esta visita', 'Elige el que más te gustó y cómpralo, o vuelve mañana para probar más.'],
  tienda_no_permitida: ['Esta tienda no está disponible en la demo', 'Prueba con un producto de Litper o déjanos tus datos y te la mostramos por WhatsApp.'],
  limite_tienda_dia: ['El probador no está disponible por ahora', 'Puedes comprar normal desde la página del producto.'],
  cuota_agotada: ['El probador no está disponible por ahora', 'Puedes comprar normal desde la página del producto.'],
  tienda_inactiva: ['El probador no está disponible por ahora', 'Puedes comprar normal desde la página del producto.'],
  tienda_no_registrada: ['El probador no está disponible por ahora', 'Puedes comprar normal desde la página del producto.'],
  ia_cupo_diario: ['El probador está en pausa por unas horas', 'Puedes comprar normal; vuelve a intentarlo más tarde.'],
  ia_fallo: ['Algo falló, intenta de nuevo', 'Tu foto está bien: prueba otra vez en unos segundos.'],
  servicio_ocupado: ['Servicio ocupado, intenta de nuevo', 'No es tu foto: el probador está ocupado. Prueba otra vez en unos segundos.'],
  origen_no_permitido: ['El probador no está disponible aquí', 'Ábrelo desde la página oficial de la tienda.'],
  ia_rechazo: ['La IA no aceptó esta foto', 'Prueba con otra foto: de frente, con buena luz y sin otras personas.'],
  ia_tiempo: ['Se demoró más de lo normal', 'Intenta otra vez; casi siempre tarda menos de 12 segundos.'],
  tiempo: ['Se demoró más de lo normal', 'Revisa tu conexión e intenta otra vez.'],
  foto_invalida: ['No pudimos leer esa foto', 'Prueba con otra foto (JPG o PNG) o tómala de nuevo.'],
  foto_no_permitida: ['No podemos usar esta foto', 'Solo probamos ropa sobre personas mayores de edad, vestidas. Prueba con otra foto.'],
  falta_consentimiento: ['Falta tu autorización', 'Marca la casilla para confirmar que la foto es tuya o tienes permiso.'],
  moderacion_no_disponible: ['No pudimos revisar la foto', 'Intenta otra vez en un momento.'],
  ropa_no_disponible: ['La prueba de ropa y zapatos llega próximamente', 'Puedes comprar normal desde la página del producto.'],
  consentimiento_invalido: ['Vuelve a marcar la autorización', 'Recarga la página, marca la casilla y prueba otra vez.'],
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
  tienda_no_permitida: ['La demo en vivo solo carga tiendas de ejemplo', 'Déjanos tus datos y te mostramos el probador con los productos de tu tienda por WhatsApp.'],
  ropa_no_disponible: ['La prueba de ropa y zapatos llega próximamente', 'Mientras tanto prueba un producto de hogar de tu tienda: cama, cortinas o comedor.'],
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
  $('#btnBack').onclick = volver;
  $('#btnTry').onclick = () => { tryHide(); generate(); };
  $('#btnSampleGo').onclick = () => { const u = pendSample; sampleClear(); if (u) fromUrl(u); };
  $('#btnBuy').onclick = buy;
  $('#btnShare').onclick = share;
  $('#btnSave').onclick = save;
  $('#btnSizeHelp').onclick = openSizeHelp;
  $('#btnKit').onclick = buyKit;
  if (DEMO) $('#byLink').removeAttribute('target');
  setupCompare();
  $('#chkConsent').onchange = () => { guardarConsent(); syncConsent(); };
  $('#chkConsent').checked = false; // se marca solo si lo guardado corresponde al texto que se ve (restaurarConsent, al cargar el producto)
  cfgReady = loadCfg();
  if (!SHOP) {
    await cfgReady; SHOP = CFG.dominio || '';
    // ?t=demo (o una tienda sin dominio): no hay tienda a la cual volver → se explica qué hacer y se da una salida real
    if (!SHOP && TENANT === 'demo') { SALIDA = '/#demo'; $('#btnBack').textContent = 'Ver la demo en vivo'; return fatal('Este enlace de demo no trae una tienda', 'La demo en vivo se abre desde la página del probador: elige un producto de ejemplo y pruébalo ahí.'); }
    if (!SHOP) return fatal('El probador no está disponible por ahora.', 'Puedes comprar normal desde la tienda.');
  }
  if (!HANDLE) return showPicker();
  await loadProduct(HANDLE);
  cfgReady.then(() => { if (CFG.bloqueado) fatal(...ERR.origen_no_permitido); });
}
// Ficha de sesión propia de este navegador (por tienda): recargar la página reusa la misma, así no gasta la sesión de la IP
// (funciones y no constantes: loadCfg las usa durante el arranque, antes de que el módulo termine de evaluarse)
function tokGet() { try { return localStorage.getItem('vto_tok:' + TENANT) || undefined; } catch { return undefined; } }
function tokSet(v) { try { if (v) localStorage.setItem('vto_tok:' + TENANT, v); else localStorage.removeItem('vto_tok:' + TENANT); } catch {} }
// Página que incrusta el probador (el servidor la compara con los dominios de la tienda): emb + origen exacto, o nada
function padreInfo() { const p = parentOrigin(); return window.top === window.self ? {} : { emb: true, padre: p || '' }; }

async function loadCfg() {
  try {
    const c = await call('cfg', { tenant: TENANT, tok: tokGet(), ...padreInfo() }, { timeout: 8000 });
    CFG = { ...CFG, ...c }; tokSet(c.tok);
    if (c.ropa) { // con ropa encendida el texto vuelve a prometer «en ti»
      $('#howRopa').hidden = false;
      const m = document.querySelector('meta[name="description"]'); if (m) m.content = 'Toma una foto y mira el producto puesto en tu cama, tu ventana o en ti, en segundos.';
    }
    $('.by').hidden = !c.sello; if (!c.kit) { KIT = null; $('#kit').hidden = true; }
    if (c.wa) $('#btnWaErr').href = `https://wa.me/${c.wa}?text=${encodeURIComponent('Hola, necesito ayuda con el probador')}`;
  } catch (e) { if (e.code === 'tienda_no_registrada') CFG.activo = false; if (e.code === 'origen_no_permitido') { CFG.activo = false; CFG.bloqueado = true; } }
}
async function loadProduct(handle) {
  setState('cargando');
  try {
    const r = await fetch(`/api/catalogo?shop=${encodeURIComponent(SHOP)}&t=${encodeURIComponent(TENANT)}&handle=${encodeURIComponent(handle)}`);
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'no_existe');
    P = await r.json();
  } catch (e) {
    if (e.message === 'tienda_no_registrada') return fatal(...ERR.tienda_no_registrada);
    return fatal(e.message === 'no_existe' ? 'No encontramos este producto en la tienda.' : 'La tienda no respondió. Intenta otra vez en un momento.');
  }
  if (P.kind === 'bloqueado') return fatal('Esta prenda no está disponible en el probador.', 'Por privacidad no probamos ropa interior ni trajes de baño.');
  if (P.kind === 'otro') return fatal('Este producto aún no tiene probador.', 'Puedes verlo y comprarlo normal en la tienda.');
  G = GROUP[P.kind] || 'cama'; C = G === 'mueble' ? copyMueble(P) : COPY[G];
  // ropa/zapatos: con config.ropa=false (moderación apagada) no se muestra ninguna foto ni promesa de prueba; se activa solo con la config
  if (G === 'ropa') { await cfgReady; if (!CFG.ropa) return DEMO ? fatal(...ERR_DEMO.ropa_no_disponible) : fatal(...ERR.ropa_no_disponible); }
  $('#illu use').setAttribute('href', '#' + ILLU[G]);
  $('#emptyT').textContent = C.empty; $('#emptyS').textContent = C.tip; // antes de cualquier aviso, para que el texto corresponda a la ilustración
  P.title = tit(P.title); P.shopName = tit(P.shopName); for (const o of P.options) o.name = tit(o.name); // textos crudos de la tienda («PROTECTOR OFERTA» → «Protector Oferta»)
  $('#illu use').setAttribute('href', '#' + ILLU[G]); $('#emptyT').hidden = false; $('#emptyS').hidden = false;
  $('#consentT').textContent = G === 'ropa' ? CONSENT.ropa : CONSENT.otro; await restaurarConsent(); syncConsent();
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
  // aviso general: ilustración neutra (nada de «toma una foto de tu cama») y salida clara a la tienda
  $('#illu use').setAttribute('href', '#s-aviso'); $('#emptyT').hidden = true; $('#emptyS').hidden = true;
  setState('error'); showErr(null, t, s); $('#btnRetry').hidden = true; $('#btnBack').hidden = !hayTienda() && !SALIDA; // sin tienda conocida no hay botón vacío; con ?t=demo lleva a la demo
  brandBar();
}
// la pantalla de error conserva la marca de la tienda en el encabezado (nunca queda anónima)
function brandBar() {
  const n = P?.shopName || (TENANT === 'litper' ? 'Litper' : SHOP ? tit(SHOP.replace(/^www\./, '').split('.')[0]) : '');
  if (!n) return;
  $('#barT').textContent = $('#barT').textContent || 'Probador con IA'; $('#barS').textContent = `${n} · simulación con IA`;
  if (!document.title.includes(n)) document.title = `Probador con IA · ${n}`;
}
function hayTienda() { return !!SHOP || (EMBED && !!parentOrigin()); }
var SALIDA = ''; // var: fatal() puede correr antes de que el módulo termine de evaluarse; // salida cuando no hay tienda (?t=demo → la demo en vivo de la landing)
function volver() { // «Volver a la tienda»: cierra el modal si está incrustado; si no, va a la tienda
  if (!SHOP && SALIDA) { try { window.top.location.href = SALIDA; } catch { window.open(SALIDA, '_blank', 'noopener'); } return; }
  const url = SHOP ? `https://${SHOP}/` : '';
  if (EMBED && PARENT) { post({ vto: 'close' }); if (url) setTimeout(() => { try { window.top.location.href = url; } catch { window.open(url, '_blank', 'noopener'); } }, 700); return; }
  if (url) location.href = url; else if (history.length > 1) history.back(); else location.href = '/';
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
  const n = String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
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

// Título crudo de la tienda (todo en mayúsculas o todo en minúsculas) → «Título Legible»; si ya viene bien escrito no se toca
function tit(s) {
  s = String(s || '').trim(); if (!/[a-záéíóúñ]/i.test(s)) return s;
  if (/[a-záéíóúñ]/.test(s) && /[A-ZÁÉÍÓÚÑ]/.test(s)) return s;
  return s.toLowerCase().replace(/(^|\s|-|\/)\S/g, (m) => m.toUpperCase()).replace(/\b(\d?x{1,3}[sl]|xs|xl)\b/gi, (m) => m.toUpperCase());
}
const CONSENT = {
  ropa: 'La foto es mía, o tengo permiso de la persona, y es mayor de edad. Autorizo que una copia pequeña se procese con IA en un proveedor externo (Cloudflare) solo para crear esta simulación; no se guarda.',
  otro: 'La foto es mía, o tengo permiso de quienes aparecen. Autorizo que una copia pequeña se procese con IA en un proveedor externo (Cloudflare) solo para crear esta simulación; no se guarda.',
};

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
  if (photo && !busy) {
    // primer toque: selecciona. Si ya está probado se muestra gratis; si no, se pide confirmar (cada prueba gasta IA)
    if (results.has(photo.key + '|' + productImage())) { tryHide(); generate(); }
    else if (document.body.dataset.state === 'resultado') tryShow(`Elegiste «${prettify(val)}». Toca «Probar este color en mi foto» para verlo.`);
  }
}
function tryShow(msg) { const b = $('#btnTry'); b.hidden = false; $('#resHint').textContent = msg; }
function tryHide() { const b = $('#btnTry'); if (b) b.hidden = true; }

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
// etiqueta de cada ejemplo: «Foto de baño 3» / «Foto de espacio 2»; en los demás nichos «Foto de ejemplo N»
function sampleLabel(s, i) {
  const m = /^(bano|espacio|cuarto)_(\d+)$/.exec(s);
  return m && G === 'mueble' ? `Foto de ${{ bano: 'baño', espacio: 'espacio', cuarto: 'cuarto' }[m[1]]} ${Number(m[2])}` : `Foto de ejemplo ${i + 1}`;
}
// Muebles: las fotos de ejemplo y el texto dependen del tipo de mueble (un estante de baño se prueba en un baño, no en una sala)
const SERIE = (pre, n) => Array.from({ length: n }, (_, i) => `${pre}_${String(i + 1).padStart(2, '0')}`);
function tipoMueble(p) {
  const t = `${p?.title || ''} ${p?.type || ''} ${p?.handle || ''}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (/bano|inodoro|sanitario|ducha|toalla|lavamanos/.test(t)) return 'bano';
  if (/zapat|closet|armario|perchero|entrada|ropa|calzado/.test(t)) return 'zapatero';
  if (/tapete|alfombra/.test(t)) return 'tapete';
  if (/mesa de noche|nochero|cama|habitacion|cuarto/.test(t)) return 'cuarto';
  return 'espacio';
}
function copyMueble(p) {
  const base = COPY.mueble, tipo = tipoMueble(p);
  if (tipo === 'bano') return { ...base, title: 'Pruébalo en tu baño', empty: 'Toma una foto de tu baño', tip: 'Fotografía la pared o el rincón donde lo pondrías, con buena luz.', cam: 'Tomar foto de mi baño', samples: [...SERIE('bano', 10), ...SERIE('espacio', 4)], sampleLab: 'o usa un baño de ejemplo' };
  if (tipo === 'zapatero') return { ...base, empty: 'Toma una foto de tu entrada o clóset', tip: 'Fotografía el rincón donde lo pondrías, con el piso y la pared a la vista.', cam: 'Tomar foto de mi entrada', samples: [...SERIE('espacio', 10), ...SERIE('cuarto', 6)], sampleLab: 'o usa un espacio de ejemplo' };
  if (tipo === 'tapete') return { ...base, empty: 'Toma una foto del piso donde va', tip: 'Que se vea el piso libre donde pondrías el tapete.', cam: 'Tomar foto del piso', samples: [...SERIE('espacio', 10), ...SERIE('cuarto', 6)] };
  if (tipo === 'cuarto') return { ...base, empty: 'Toma una foto de tu cuarto', tip: 'Fotografía el lado de la cama o el rincón donde lo pondrías.', cam: 'Tomar foto de mi cuarto', samples: [...SERIE('cuarto', 12), ...SERIE('espacio', 4)], sampleLab: 'o usa un cuarto de ejemplo' };
  return { ...base, samples: SERIE('espacio', 10) };
}
function renderSamples() {
  const row = $('#samples'); row.replaceChildren(); Object.assign(row.style, { justifyContent: 'flex-start', overflowX: 'auto', maxWidth: '100%', padding: '2px 2px 8px' });
  const list = G === 'ropa' && P && P.garment === 'zapato' && C.samplesZapato ? C.samplesZapato : C.samples;
  sampleClear();
  list.forEach((s, i) => {
    const u = `${SAMPLES}${s}.jpg`;
    const b = el('button', { type: 'button', 'aria-label': sampleLabel(s, i), title: sampleLabel(s, i), 'aria-pressed': 'false' }, el('img', { src: u, alt: '', loading: 'lazy', decoding: 'async' }));
    b.style.flex = 'none'; b.dataset.u = u; b.onclick = () => (pendSample === u ? $('#btnSampleGo').click() : samplePick(u));
    row.append(b);
  });
}
// Tocar un ejemplo solo lo selecciona; la prueba (que gasta IA) arranca con «Probar con esta foto» o con un segundo toque
let pendSample = null;
function samplePick(u) { pendSample = u; $$('#samples button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.u === u))); $('#btnSampleGo').hidden = false; }
function sampleClear() { pendSample = null; $$('#samples button').forEach((x) => x.setAttribute('aria-pressed', 'false')); const g = $('#btnSampleGo'); if (g) g.hidden = true; }
async function fromFile(file, fuente) {
  if (!file) return;
  if (!/^image\//.test(file.type) && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) return toast('Ese archivo no es una foto.');
  if (!consentOk()) { $('#fileCam').value = ''; $('#fileGal').value = ''; return needConsent(); }
  toast('Preparando tu foto…', 6000);
  let src = null, url = null;
  try { if (window.createImageBitmap) src = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch { src = null; }
  if (!src) url = URL.createObjectURL(file);
  try { await usePhoto(src || url, fuente); } finally { if (url) setTimeout(() => URL.revokeObjectURL(url), 60000); $('#fileCam').value = ''; $('#fileGal').value = ''; }
}
async function fromUrl(url) { await usePhoto(url, 'ejemplo'); }
function loadImage(src) { return new Promise((ok, ko) => { const i = new Image(); i.decoding = 'async'; if (/^https?:/.test(src)) i.crossOrigin = 'anonymous'; i.onload = () => ok(i); i.onerror = ko; i.src = src; }); }
async function usePhoto(src, fuente) {
  if (!consentOk()) return needConsent(); // Ley 1581: sin autorización no sale ninguna foto (ni propia, ni guardada, ni de ejemplo)
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
  photo = { data, ai, w: aw, h: ah, fw, fh, key: hashStr(data.slice(-6000) + data.length), src: data, fuente, consent: true };
  sampleClear();
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
  photo = null; shown = null; results.clear(); delete document.body.dataset.orient; tryHide(); setState('inicio'); renderOptions(); renderSaved();
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
  // la autorización se revisa al enviar: si la casilla se desmarcó después de elegir la foto, no sale nada
  if (!consentOk()) { if (!shown) retake(); needConsent(); return; }
  const gen = ++genN;
  busy = true; lastErr = null; tryHide(); setState('procesando'); startProgress();
  const tt = document.getElementById('toast'); if (tt && /Preparando tu foto/.test(tt.textContent)) tt.classList.remove('on'); // ya se ve el avance
  markSwatch(sel.color, 'loading');
  const t0 = performance.now();
  try {
    await cfgReady;
    // color y zona de la tela en la foto de la variante (en paralelo; si tarda, la IA no la espera)
    const refP = refInfo(prodUrl, sel.color || '', G), ref0 = await Promise.race([refP, wait(1200).then(() => null)]);
    const d = await call('ai', { tenant: TENANT, tok: CFG.tok, shop: DEMO ? SHOP : undefined, handle: P.handle, photo: photo.ai || photo.data, product: prodUrl, color: sel.color || '', w: photo.w, h: photo.h, sesion, ...padreInfo(), consiento: consentOk() ? true : undefined, consent: consentOk() ? { v: CONSENT_V, h: await consentHuella() } : undefined, ref: ref0?.solid ? { hex: ref0.hex, box: ref0.box } : undefined }, { timeout: 80000 }); // en estampados el recorte cortaría el diseño
    const gens = (d.images?.length ? d.images : [d.image]).filter(Boolean).slice(0, 1); // el servidor entrega 1 sola imagen por prueba
    if (!gens.length) throw Object.assign(new Error('ia_fallo'), { code: 'ia_fallo' });
    const fz = await fuseResult(photo, gens, ref0 || (await refP));
    results.set(key, fz.src);
    await stopProgress(true);
    busy = false;
    if (productImage() !== prodUrl) { markSwatch(null); return generate(); }
    shown = { key: photo.key, color: sel.color, src: fz.src };
    trk('ver', { tenant: TENANT, handle: P.handle, categoria: P.kind, detalle: { ms: Math.round(performance.now() - t0), fusion: fz.info.ok ? 1 : 0, motivo: fz.info.motivo || '', err: fz.info.err ?? null, costura: fz.info.seam ?? null, n: fz.n, elegida: fz.i, prod: fz.info.prod ? `${fz.info.prod.dE ?? '-'}|${fz.info.prod.nuevo ?? '-'}|${fz.info.color ? 'c' : ''}|${fz.info.prod.arriba ?? '-'}/${fz.info.prod.cob ?? '-'}${fz.info.prod.est ? 'e' : ''}${fz.info.prod.clara ? 'k' : ''}|${fz.copias}` : '' } });
    await showResult(fz.src, true, gen);
    if (gen !== genN) return; // mientras se mostraba, el cliente ya pidió otra prueba
    if (fz.info.motivo === 'encuadre') $('#resHint').textContent = 'La IA movió un poco el encuadre de tu foto. Desliza para comparar.';
    if (d.restan_sesion != null && d.restan_sesion <= 3) $('#resHint').textContent += d.restan_sesion > 1 ? ` Te quedan ${d.restan_sesion} pruebas en esta visita.` : d.restan_sesion === 1 ? ' Te queda 1 prueba en esta visita.' : ' Esta fue tu última prueba en esta visita.';
    offerSave(photo.fuente);
    if (KIT?.items?.length) renderKit();
  } catch (e) {
    busy = false;
    if (e.code === 'sesion_invalida' && retry) { await stopProgress(false); tokSet(null); cfgReady = loadCfg(); await cfgReady; markSwatch(null); return generate(false); }
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
// Fusión fiel: llega 1 versión de la IA (costo fijo por prueba); si calza, se funde con tus píxeles originales;
// si no calza, se muestra tal cual con el color de la tela corregido. Sigue aceptando varias versiones (elige la mejor):
// gana la versión que funde con la foto real, conserva el color de la tela y no trae objetos nuevos
// el fondo intacto manda; el color de la tela solo desempata; castigo fuerte si casi no aparece la tela y más fuerte si la IA
// trajo un mueble del catálogo encima de la tela (cabecero copiado): esa versión pierde aunque sea la única que se funde
const copiaMueble = (p) => !!p && p.cob >= (p.est ? 0.12 : 0.2); // fusion.js 5c: un mueble del catálogo encima de la tela (p. ej. el cabecero); en estampados las limpias dan ≤ 0,012
const castigo = (inf) => { const p = inf.prod; if (!p) return 0; return (p.dE != null ? 0.1 * p.dE : 0) + (p.frac < 0.25 ? 12 : 0) + (copiaMueble(p) ? 150 + 100 * p.cob : 0); };
async function fuseResult(ph, gens, ref = null) {
  gens = gens.filter(Boolean); if (!gens.length) throw Object.assign(new Error('ia_fallo'), { code: 'ia_fallo' });
  let o; try { o = await loadImage(ph.data); } catch { return { src: gens[0], info: { motivo: 'error' }, i: 0, n: gens.length, copias: 0 }; }
  let best = null, copias = 0; // copias: versiones con un mueble del catálogo encima de la tela
  for (let i = 0; i < gens.length; i++) {
    let r, g = null;
    try { g = await loadImage(gens[i]); await new Promise((ok) => requestAnimationFrame(() => ok())); r = fuse(o, g, ref, { cama: G === 'cama' }); } catch { r = { canvas: null, info: { motivo: 'error' } }; }
    if (copiaMueble(r.info.prod)) copias++;
    const score = (r.canvas ? r.info.err : 100 + (r.info.err ?? 50) + (r.info.seam ?? 0) / 4) + castigo(r.info);
    if (!best || score < best.score) best = { score, i, r, g };
  }
  const { r, i, g } = best;
  if (!r.canvas && g && ref) { // sin fusión: se muestra la imagen de la IA, con el color de la tela corregido
    try { const c = corregir(g, ref); if (c) return { src: c.canvas.toDataURL('image/jpeg', 0.92), info: { ...r.info, color: c.info.color, prod: { dE: c.info.dE, nuevo: '-', arriba: r.info.prod?.arriba, cob: r.info.prod?.cob } }, i, n: gens.length, copias }; } catch {}
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
  $('#btnRetry').hidden = false; $('#btnBack').hidden = true;
  if (s !== 'resultado') tryHide();
  $('#picker').hidden = s !== 'picker';
  $('#kit').hidden = !(s === 'resultado' && KIT?.items?.length && !DEMO);
  if (s === 'inicio' && !has) { $('#imgBefore').removeAttribute('src'); }
}
function showErr(code, t, s) {
  $('#errT').textContent = t; $('#errS').textContent = s;
  $('#btnWaErr').hidden = !CFG.wa || !['limite_ip', 'limite_sesion', 'ia_fallo', 'ia_rechazo', 'producto_sin_imagen', 'imagen_no_valida'].includes(code);
  $('#btnRetry').hidden = ['cuota_agotada', 'tienda_inactiva', 'tienda_no_registrada', 'limite_tienda_dia', 'limite_sesion', 'limite_ip', 'ropa_no_disponible', 'prenda_no_permitida', 'producto_sin_probador'].includes(code);
  $('#btnBack').hidden = !$('#btnRetry').hidden || !hayTienda(); // sin «Intentar otra vez», siempre queda una salida a la tienda (si se sabe cuál es)
  if (DEMO) { // en la demo quien lee es un comerciante: siempre hay un paso siguiente
    const wa = $('#btnWaErr');
    const b = $('#btnDemoCta') || wa.parentElement.insertBefore(el('button', { class: 'btn pri', id: 'btnDemoCta', type: 'button', onclick: () => { trk('cta', { tenant: TENANT, handle: P?.handle, detalle: { desde: 'demo-error', code: code || '' } }); post({ vto: 'demo-cta', shop: SHOP, handle: P?.handle || '' }); } }, 'Quiero esto en mi tienda'), wa);
    b.hidden = false;
    wa.hidden = false; wa.href = `https://wa.me/${CFG.wa || WA}?text=${encodeURIComponent('Hola, quiero ver el probador con IA en mi tienda' + (SHOP ? ` (${SHOP})` : ''))}`;
    if (!wa.dataset.demo) { wa.dataset.demo = '1'; wa.replaceChildren(...[wa.querySelector('svg'), 'Escríbenos'].filter(Boolean)); }
  }
}
// autorización para toda foto (Ley 1581): casilla visible en todos los nichos antes de tomar, subir o probar con una foto
function consentOk() { return $('#chkConsent').checked; }
// versión y huella (SHA-256, 16 hex) del texto EXACTO que vio el comprador; el servidor las guarda con cada prueba
// OJO: al cambiar un texto de CONSENT hay que subir CONSENT_V (aquí y en vto-api). La URL de app.js lleva la versión del despliegue
// (api/p.js) y app.js va con no-cache, así que nadie se queda con el texto viejo en caché.
const CONSENT_V = '2026-11-19';
// La casilla se recuerda en la visita junto con la huella del texto y la categoría: si cambia el texto, la versión o la categoría
// (ej. de cama a ropa, que exige mayoría de edad), se desmarca y hay que volver a aceptar.
const consentCat = () => (G === 'ropa' ? 'ropa' : 'otro');
async function guardarConsent() {
  const on = $('#chkConsent').checked;
  try { if (!on) return sessionStorage.removeItem('vto_consent'); } catch { return; }
  const h = await consentHuella();
  try { if ($('#chkConsent').checked) sessionStorage.setItem('vto_consent', JSON.stringify({ v: CONSENT_V, h, cat: consentCat() })); } catch {}
}
async function restaurarConsent() {
  let g = null; try { g = JSON.parse(sessionStorage.getItem('vto_consent') || 'null'); } catch {}
  const h = await consentHuella();
  const ok = !!g && g.v === CONSENT_V && g.h === h && g.cat === consentCat() && !!h;
  $('#chkConsent').checked = ok;
  if (!ok) { try { sessionStorage.removeItem('vto_consent'); } catch {} }
}
async function consentHuella() {
  try { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode($('#consentT').textContent)); return [...new Uint8Array(b)].slice(0, 8).map((x) => x.toString(16).padStart(2, '0')).join(''); } catch { return ''; }
}
function needConsent() { toast('Primero marca la casilla de autorización.'); const c = $('#consent'); c.scrollIntoView({ behavior: 'smooth', block: 'center' }); c.classList.add('pulse'); setTimeout(() => c.classList.remove('pulse'), 1600); }
// Sin casilla marcada los botones se ven normales (nada atenuado que parezca roto): al tocarlos se explica qué falta
function syncConsent() {
  const need = !consentOk();
  for (const id of ['#fileCam', '#fileGal']) { const i = $(id); i.disabled = false; i.closest('.btn').classList.remove('off'); }
  const h = $('#consentHint'); if (h) h.hidden = !need;
}
for (const id of ['#fileCam', '#fileGal']) $(id).addEventListener('click', (e) => { if (!consentOk()) { e.preventDefault(); needConsent(); } });

/* ---------- comprar ---------- */
// Origen exacto de la página que nos incrusta (nunca '*'): ancestorOrigins (Chrome/Safari) o, si no, el referrer.
// Si no se puede saber, no se manda nada (la compra cae al respaldo de abrir la URL directo).
function parentOrigin() { // función (no constante) para poder usarla desde el arranque
  if (window.top === window.self) return location.origin; // sin incrustar: los avisos van a esta misma página
  try { const a = location.ancestorOrigins && location.ancestorOrigins[0]; if (a && /^https?:\/\//.test(a)) return new URL(a).origin; } catch {}
  try { if (document.referrer) { const o = new URL(document.referrer).origin; if (/^https?:/.test(o)) return o; } } catch {}
  return null;
}
const PARENT = parentOrigin();
function post(msg) { if (!PARENT) return; try { window.parent.postMessage(msg, PARENT); } catch {} }
let ackT = 0;
addEventListener('message', (e) => { if (e.source === window.parent && PARENT && e.origin === PARENT && e.data?.vto === 'ack') clearTimeout(ackT); });
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
    const r = await fetch(`/api/kit?shop=${encodeURIComponent(SHOP)}&t=${encodeURIComponent(TENANT)}&handle=${encodeURIComponent(P.handle)}`);
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
    const cb = el('input', { type: 'checkbox', id, checked: on, 'aria-label': `Agregar ${tit(it.title)}` });
    cb.onchange = () => { if (cb.checked && !v) { cb.checked = false; toast('Elige la medida o el color de este producto.'); sel2?.focus(); return; } cb.checked ? kitOn.add(it.handle) : kitOn.delete(it.handle); renderKit(); };
    const vt = (x) => (/^default title$/i.test(x.title) ? 'Presentación única' : prettify(x.title));
    const sel2 = opts.length < 2 ? null : el('select', { class: 'ki-sel', 'aria-label': `Medida y color de ${tit(it.title)}` },
      el('option', { value: '', text: v ? 'Cambiar medida o color' : 'Elige medida y color' }),
      ...opts.map((x) => el('option', { value: String(x.id), selected: v && x.id === v.id, text: `${vt(x)} · ${money(x.price, P.currency)}` })));
    if (sel2) sel2.onchange = () => { const nv = opts.find((x) => String(x.id) === sel2.value); if (!nv) return; kitPick.set(it.handle, nv.id); kitOn.add(it.handle); renderKit(); };
    const row = el('div', { class: 'ki' + (on ? ' on' : '') },
      el('img', { src: (v && v.image) || it.image, alt: '', loading: 'lazy' }),
      el('div', {}, el('label', { for: id }, el('b', { text: tit(it.title) })),
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
  const cs = getComputedStyle(document.documentElement), tv = (n, d) => cs.getPropertyValue(n).trim() || d; // colores del tema activo
  const neon = TEMA === 'oscuro', fu = 'Jost, sans-serif'; // auditoría 7: misma letra que litper.store en todos los temas
  x.fillStyle = tv('--bg', '#07080a'); x.fillRect(0, 0, c.width, c.height); x.drawImage(a, 0, 0, W, H);
  const tw = 250, th = Math.round(tw * b.naturalHeight / b.naturalWidth);
  x.fillStyle = '#fff'; x.fillRect(28, 28, tw + 8, th + 8); x.drawImage(b, 32, 32, tw, th);
  x.fillStyle = 'rgba(7,8,10,.75)'; x.fillRect(32, 32 + th - 40, 92, 40); x.fillStyle = '#fff'; x.font = `600 24px ${fu}`; x.fillText('Antes', 44, 32 + th - 12);
  x.fillStyle = neon ? '#00ff88' : tv('--gold', '#C9A84C'); x.fillRect(0, H, W, 6);
  x.fillStyle = tv('--tx', '#eef3f0'); x.font = `700 40px ${fu}`; x.fillText(trim(x, P.title, W - 80), 40, H + 66);
  x.fillStyle = tv('--mu', '#9ba6a1'); x.font = `500 30px ${fu}`; x.fillText(`Lo probé con IA en ${P.shopName || SHOP}`, 40, H + 116);
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
function openSheet(id) { // WCAG 2.4.3: el foco entra al diálogo, queda atrapado (Tab) y Esc lo cierra devolviéndolo al botón
  sheetBack = document.activeElement; $('#sheetBg').hidden = false; const sh = $(id); sh.hidden = false;
  const t = sh.querySelector('input, button:not([data-close])') || sh.querySelector('[data-close]') || sh;
  if (t === sh) sh.setAttribute('tabindex', '-1');
  t.focus({ preventScroll: true });
}
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && $$('.sheet').some((x) => !x.hidden)) { e.preventDefault(); e.stopImmediatePropagation(); closeSheets(); return; }
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
    const d = await (await fetch(`/api/tienda?shop=${encodeURIComponent(SHOP)}&t=${encodeURIComponent(TENANT)}`)).json();
    if (d.error === 'tienda_no_registrada') return fatal(...ERR.tienda_no_registrada);
    const grid = $('#pickGrid'); grid.replaceChildren();
    await cfgReady; const ropaOff = !CFG.ropa, items = (d.items || []).filter((it) => !(ropaOff && it.kind === 'ropa')); // ropa apagada: ni foto ni promesa
    for (const it of items) {
      const b = el('button', { class: 'pk', type: 'button' }, el('img', { src: it.image, alt: '', loading: 'lazy' }), el('b', { text: tit(it.title) }));
      b.onclick = () => { history.replaceState(null, '', `?${new URLSearchParams({ ...Object.fromEntries(Q), h: it.handle })}`); $('#picker').hidden = true; loadProduct(it.handle); };
      grid.append(b);
    }
    if (!items.length) grid.append(el('p', { class: 'muted', text: 'Esta tienda aún no tiene productos que se puedan probar.' }));
    if (ropaOff && items.length < (d.items || []).length) grid.append(el('p', { class: 'muted small', text: 'Ropa y zapatos: próximamente.' }));
  } catch { toast('La tienda no respondió.'); }
}

window.__probador = { get P() { return P; }, get sel() { return sel; }, get state() { return document.body.dataset.state; } };
