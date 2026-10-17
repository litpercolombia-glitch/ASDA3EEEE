// Probador Litper v2 — 2026-10-16
// Cámara en vivo con prendas que se deforman con el cuerpo, hogar a tamaño real,
// medidor AR, talla por 2 fotos y versión ultra realista con IA.
import { Stage, templateFor, mapping, similarity } from './gl.js';
import { buildModel, fabricTexture, solidFabric } from './drape.js';
import { xrSupported, startMeasure } from './xr.js';
import { findSurface, loadSeg } from './seg.js';

const V = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1';
const MODEL = (n) => `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_${n}/float16/1/pose_landmarker_${n}.task`;
const SHOP = 'https://litper.store';
const $ = (id) => document.getElementById(id);
const app = $('app');
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const isPhone = matchMedia('(pointer:coarse)').matches;
let toastT;
function toast(m, ms = 2800) { const t = $('toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), ms); }
function hint(m) { const h = $('hint'); h.hidden = !m; h.textContent = m || ''; }
const num = (v, lo, hi) => { const n = parseFloat(v); return Number.isFinite(n) && n >= lo && n <= hi ? n : null; };
const safeUrl = (u) => { if (!u) return ''; try { const x = new URL(u, location.href); return x.protocol === 'https:' || x.origin === location.origin ? x.href : ''; } catch { return ''; } };

/* ================== 1. PRODUCTO ================== */
const PERSONA = ['superior', 'completo', 'inferior', 'zapatos', 'gafas', 'gorra'];
const HOGAR = ['cama', 'cortina', 'mantel'];
const DEMOS = [
  { title: 'Camiseta índigo', kind: 'superior', price: 'Demo', variants: [{ title: 'Índigo', image: '/assets/camiseta-frente.webp', back: '/assets/camiseta-espalda.webp' }] },
  { title: 'Jean clásico', kind: 'inferior', price: 'Demo', variants: [{ title: 'Azul', image: '/assets/jean.webp' }] },
  { title: 'Tenis blancos', kind: 'zapatos', price: 'Demo', variants: [{ title: 'Blanco', image: '/assets/tenis.webp' }] },
  { title: 'Gafas de sol', kind: 'gafas', price: 'Demo', variants: [{ title: 'Negro', image: '/assets/gafas.webp' }] },
];
const COLORS = [['vino tinto', [110, 22, 38]], ['gris oscuro', [62, 64, 70]], ['gris claro', [190, 192, 196]], ['azul oscuro', [24, 38, 84]], ['palo de rosa', [214, 160, 160]], ['dorad', [196, 150, 62]], ['plata', [176, 178, 184]], ['negr', [28, 28, 30]], ['blanc', [240, 238, 232]], ['beige', [222, 205, 178]], ['rojo', [190, 22, 30]], ['roja', [190, 22, 30]], ['fucsia', [214, 40, 120]], ['lila', [170, 140, 200]], ['menta', [150, 214, 190]], ['rosa', [232, 160, 180]], ['caf', [110, 72, 48]], ['verde', [40, 110, 70]], ['celeste', [140, 190, 228]], ['azul', [40, 80, 160]], ['gris', [130, 132, 138]]];
function colorOf(name) { const n = (name || '').toLowerCase(); let best = null, bi = 1e9; for (const [k, rgb] of COLORS) { const i = n.indexOf(k); if (i >= 0 && i < bi) { bi = i; best = rgb; } } return best; }
function fabricStyle(p) { const t = `${p.type} ${p.title}`.toLowerCase(); return /cortina|velo/.test(t) ? 'tejido' : /protector/.test(t) ? 'rombos' : /edred|plum/.test(t) ? 'cuadros' : null; }
async function textureFor(p, src) { const st = fabricStyle(p), rgb = st && colorOf(p.variants[VAR]?.title); return rgb ? solidFabric(rgb, st) : fabricTexture(src, cropFor(p)); }
const BEDS = [['KING', 200, 200], ['QUEEN', 160, 190], ['SEMI', 120, 190], ['DOBLE', 140, 190], ['SENCILL', 100, 190]];
function kindOf(p) {
  const t = `${p.type} ${p.title}`.toLowerCase();
  if (/cortina|velo|blackout/.test(t)) return 'cortina';
  if (/mantel/.test(t)) return 'mantel';
  if (/protector|s[aá]bana|cobija|edred|colcha|plum|forro|kit de cama|almohada|manta|cubrelecho/.test(t)) return 'cama';
  if (/zapat|tenis|sneaker|bota|sandalia/.test(t)) return 'zapatos';
  if (/gafa|lente/.test(t)) return 'gafas';
  if (/gorra|sombrero/.test(t)) return 'gorra';
  if (/pantal|jean|falda|short|jogger|legging/.test(t)) return 'inferior';
  if (/vestido|pijama|enterizo|bata/.test(t)) return 'completo';
  return 'superior';
}
let PRODUCTS = [], P = null, VAR = 0;

async function loadProduct() {
  const q = new URLSearchParams(location.search);
  const handle = (q.get('p') || '').toLowerCase();
  const custom = safeUrl(q.get('img') || '');
  if (/^[a-z0-9][a-z0-9-]{0,150}$/.test(handle)) {
    try {
      const r = await fetch('/api/catalogo?handle=' + encodeURIComponent(handle));
      if (!r.ok) throw 0;
      const d = await r.json();
      const seen = new Set(), variants = [];
      for (const v of d.variants) { const img = v.image || d.images[0]; const key = v.options[0]; if (seen.has(key)) continue; seen.add(key); variants.push({ title: key, image: img, id: v.id, options: v.options }); }
      PRODUCTS = [{ handle, title: d.title, type: d.type, kind: kindOf(d), price: d.priceText, url: d.url, variants: variants.length ? variants : [{ title: d.title, image: d.images[0] }], all: d.variants, options: d.options }];
    } catch { toast('No encontré ese producto en la tienda. Te muestro ejemplos.'); }
  }
  if (!PRODUCTS.length && custom) PRODUCTS = [{ title: (q.get('n') || 'Producto').slice(0, 80), kind: q.get('c') || 'superior', price: (q.get('precio') || '').slice(0, 30), url: safeUrl(q.get('buy') || ''), variants: [{ title: '', image: custom, back: safeUrl(q.get('back') || '') }] }];
  if (!PRODUCTS.length) PRODUCTS = DEMOS.concat(await litperDemos());
  if (q.get('c') && [...PERSONA, ...HOGAR].includes(q.get('c'))) PRODUCTS[0].kind = q.get('c');
  setProduct(0);
}
async function litperDemos() { // productos reales de Litper para la vitrina
  const out = [];
  for (const h of ['protector-oferta-navidad', 'colcha-navidena-li', 'edredon-tipo-plumon-doble-faz', 'la-cortina-que-apaga-la-luz-de-la-calle-con-sabanas-600-hilos-de-regalo', 'mantel-navideno-li']) {
    try {
      const r = await fetch('/api/catalogo?handle=' + h); if (!r.ok) continue; const d = await r.json();
      const seen = new Set(), variants = [];
      for (const v of d.variants) { const key = v.options[0]; if (seen.has(key) || !v.image) continue; seen.add(key); variants.push({ title: key, image: v.image, id: v.id, options: v.options }); }
      out.push({ handle: h, title: d.title, type: d.type, kind: kindOf(d), price: d.priceText, url: d.url, variants: variants.length ? variants.slice(0, 8) : [{ title: d.title, image: d.images[0] }], all: d.variants, options: d.options });
    } catch {}
  }
  return out;
}
function bedDims() { return [140, 190]; } // doble por defecto; Mi talla lo ajusta
function setProduct(i) {
  P = PRODUCTS[i]; VAR = 0; tpls.clear();
  $('pName').textContent = P.title; $('pPrice').textContent = P.price || '';
  $('selKind').value = P.kind;
  const [w, l] = P.kind === 'cama' ? bedDims(P) : P.kind === 'cortina' ? [280, 230] : P.kind === 'mantel' ? [150, 220] : [140, 190];
  $('dW').value = w; $('dL').value = l; $('dH').value = P.kind === 'cama' ? 30 : P.kind === 'mantel' ? 75 : 3;
  $('tallaCama').hidden = !HOGAR.includes(P.kind); $('tallaRopa').hidden = HOGAR.includes(P.kind);
  renderSwatches(); setVariant(0);
  const persona = PERSONA.includes(P.kind);
  if (persona && (mode === 'espacio' || mode === 'tres')) setMode('probar');
  if (!persona && mode === 'probar') setMode('espacio');
  updateBuy(); loadKit();
}
function renderSwatches() {
  const box = $('swatches'); box.replaceChildren();
  const multi = PRODUCTS.length > 1;
  const items = multi ? PRODUCTS.map((p, i) => ({ img: p.variants[0].image, label: p.title, on: p === P, act: () => setProduct(i) })) : [];
  P.variants.forEach((v, i) => items.push({ img: v.image, label: v.title, on: !multi && i === VAR, act: () => setVariant(i), variant: true }));
  if (multi && P.variants.length > 1) items.splice(PRODUCTS.length, 0, { sep: true });
  for (const it of items) {
    if (it.sep) { const s = document.createElement('span'); s.style.cssText = 'flex:none;width:1px;background:var(--line);margin:6px 2px'; box.append(s); continue; }
    const b = document.createElement('button'); b.className = 'sw'; b.setAttribute('role', 'option'); b.setAttribute('aria-label', it.label || 'Opción');
    b.setAttribute('aria-selected', it.on ? 'true' : 'false'); if (it.variant) b.dataset.v = '1';
    const im = document.createElement('img'); im.src = it.img; im.alt = ''; im.loading = 'lazy'; im.crossOrigin = 'anonymous'; b.append(im);
    b.onclick = () => { it.act(); if (it.variant) box.querySelectorAll('[data-v]').forEach((x) => x.setAttribute('aria-selected', x === b ? 'true' : 'false')); };
    box.append(b);
  }
  if (P.variants[0]?.image) { $('pThumb').src = P.variants[0].image; $('pThumb').hidden = false; }
}

/* ================== 2. IMÁGENES DE PRENDA ================== */
const imgCache = new Map(), tpls = new Map();
function loadImg(src) {
  if (imgCache.has(src)) return imgCache.get(src);
  const pr = new Promise((res, rej) => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => res(im); im.onerror = rej; im.src = src; });
  imgCache.set(src, pr); return pr;
}
function cutout(im) { // quita el fondo claro conectado al borde (si la foto no trae transparencia)
  const W = Math.min(900, im.width), H = Math.round(W * im.height / im.width), c = Object.assign(document.createElement('canvas'), { width: W, height: H }), x = c.getContext('2d');
  x.drawImage(im, 0, 0, W, H); let d; try { d = x.getImageData(0, 0, W, H); } catch { return c; }
  const a = d.data, cs = [0, (W - 1) * 4, (H - 1) * W * 4, ((H - 1) * W + W - 1) * 4];
  if (cs.some((k) => a[k + 3] < 30)) return c;
  const bg = [0, 1, 2].map((ch) => cs.reduce((s, k) => s + a[k + ch], 0) / 4), seen = new Uint8Array(W * H), st = [];
  const near = (p) => Math.abs(a[p] - bg[0]) + Math.abs(a[p + 1] - bg[1]) + Math.abs(a[p + 2] - bg[2]) < 70;
  for (let i = 0; i < W; i++) st.push(i, (H - 1) * W + i); for (let j = 0; j < H; j++) st.push(j * W, j * W + W - 1);
  while (st.length) { const p = st.pop(); if (seen[p]) continue; seen[p] = 1; if (!near(p * 4)) continue; a[p * 4 + 3] = 0; const i = p % W, j = (p / W) | 0; if (i > 0) st.push(p - 1); if (i < W - 1) st.push(p + 1); if (j > 0) st.push(p - W); if (j < H - 1) st.push(p + W); }
  x.putImageData(d, 0, 0); return c;
}
let G = { front: null, back: null, key: '' };
async function setVariant(i) {
  VAR = i; const v = P.variants[i]; G = { front: null, back: null, key: v.image };
  try {
    const f = await loadImg(v.image); if (G.key !== v.image) return;
    G.front = PERSONA.includes(P.kind) ? cutout(f) : f; G.frontRaw = f;
    if (v.back) { const b = await loadImg(v.back); G.back = cutout(b); }
  } catch { toast('No pude cargar la imagen de este producto.'); }
  if (mode === 'espacio') { await prepRoomTexture(); renderRoom(); }
  if (mode === 'tres') build3D();
  if (frozen) draw(frozen, false);
  updateBuy();
}
function tplOf(img, key) { const k = key + '|' + P.kind; if (!tpls.has(k)) tpls.set(k, templateFor(P.kind === 'zapatos' ? 'zapatos' : P.kind, img)); return tpls.get(k); }

/* ================== 3. MODOS ================== */
let mode = 'probar';
function setMode(m) {
  mode = m; app.dataset.mode = m;
  document.querySelectorAll('#dial button').forEach((b) => b.classList.toggle('on', b.dataset.m === m));
  ['talla', 'medir', 'tune', 'shot', 'kit'].forEach((id) => ($(id).hidden = true));
  $('roomTools').hidden = m !== 'espacio';
  $('empty').hidden = !(m === 'probar' && !stream && !frozen);
  hint('');
  if (m !== 'probar') stopCam();
  if (m !== 'espacio') stopRoomCam();
  if (m === 'espacio') { if (!room) useDemoRoom(); else { prepRoomTexture().then(renderRoom); } }
  if (m === 'tres') build3D();
  if (m === 'medir') { $('medir').hidden = false; }
  if (m === 'talla') { $('talla').hidden = false; }
}
$('dial').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setMode(b.dataset.m); });
document.querySelectorAll('[data-close]').forEach((b) => (b.onclick = () => { $(b.dataset.close).hidden = true; if (['talla', 'medir'].includes(b.dataset.close)) setMode(PERSONA.includes(P.kind) ? 'probar' : 'espacio'); }));
$('btnTune').onclick = () => { $('tune').hidden = !$('tune').hidden; };
$('selKind').onchange = () => { P.kind = $('selKind').value; tpls.clear(); setVariant(VAR); };
['dW', 'dL', 'dH'].forEach((id) => $(id).addEventListener('change', () => mode === 'tres' && build3D()));

/* ================== 4. PROBADOR EN VIVO ================== */
const glc = $('gl'); let stage;
try { stage = new Stage(glc); } catch { toast('Tu navegador no soporta gráficos 3D (WebGL2).'); }
const vid = $('vid');
let pose = null, poseLoading = null, poseMode = null, stream = null, facing = 'user', raf = 0, lastT = -1, sm = null, LM = null, frozen = null, meanL = 0.5, frame = 0, backView = false, frontScore = 0;

async function getPose() {
  if (pose) return pose;
  poseLoading ||= (async () => {
    hint('Cargando el detector del cuerpo…');
    const vision = await import(V + '/vision_bundle.mjs');
    const fs = await vision.FilesetResolver.forVisionTasks(V + '/wasm');
    const o = (d) => ({ baseOptions: { modelAssetPath: MODEL(isPhone ? 'lite' : 'full'), delegate: d }, runningMode: 'VIDEO', numPoses: 1, minPoseDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
    try { pose = await vision.PoseLandmarker.createFromOptions(fs, o('GPU')); } catch { pose = await vision.PoseLandmarker.createFromOptions(fs, o('CPU')); }
    poseMode = 'VIDEO'; window.__vision = vision; window.__fs = fs; hint(''); return pose;
  })().catch((e) => { poseLoading = null; throw e; });
  return poseLoading;
}
async function runMode(m) { if (poseMode !== m) { await pose.setOptions({ runningMode: m }); poseMode = m; } }

function stopCam() { cancelAnimationFrame(raf); raf = 0; if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; } }
async function startCam() {
  if (!navigator.mediaDevices?.getUserMedia) { toast('Este navegador no deja usar la cámara. Sube una foto.'); return; }
  stopCam(); frozen = null; sm = null;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: facing, width: { ideal: isPhone ? 720 : 1280 }, height: { ideal: isPhone ? 1280 : 720 } } }); }
  catch { toast('Sin permiso de cámara. Puedes subir una foto.'); return; }
  vid.srcObject = stream; await vid.play(); $('empty').hidden = true;
  stage.mirror = facing === 'user';
  try { await getPose(); await runMode('VIDEO'); } catch { toast('No cargó el detector. Revisa tu conexión.'); }
  hint('Aléjate hasta que se vea tu cuerpo completo');
  loop();
}
function loop() {
  raf = requestAnimationFrame(loop);
  if (!vid.videoWidth || !stage) return;
  if (pose && poseMode === 'VIDEO' && vid.currentTime !== lastT) {
    lastT = vid.currentTime;
    try { const r = pose.detectForVideo(vid, performance.now()); setLM(r.landmarks?.[0]); } catch {}
  }
  if (++frame % 15 === 0) meanL = luminance(vid);
  draw(vid, true);
}
const lumC = Object.assign(document.createElement('canvas'), { width: 24, height: 24 });
function luminance(src) {
  const x = lumC.getContext('2d', { willReadFrequently: true }); x.drawImage(src, 0, 0, 24, 24);
  const d = x.getImageData(4, 4, 16, 16).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += d[i] * .299 + d[i + 1] * .587 + d[i + 2] * .114;
  return clamp(s / (d.length / 4) / 255, 0.15, 0.85);
}
function setLM(l) {
  if (!l) { LM = null; return; }
  const a = 0.45; sm = sm && sm.length === l.length ? sm.map((s, i) => ({ x: s.x + (l[i].x - s.x) * a, y: s.y + (l[i].y - s.y) * a, v: l[i].visibility ?? 1 })) : l.map((p) => ({ x: p.x, y: p.y, v: p.visibility ?? 1 }));
  LM = sm;
  // frente o espalda: en la imagen sin espejo, de frente el hombro izquierdo (11) queda a la derecha
  const faceHidden = (l[0].visibility ?? 1) < 0.35 && (l[2].visibility ?? 1) < 0.35 && (l[11].visibility ?? 0) > 0.6;
  const s = faceHidden ? -1 : Math.sign(l[11].x - l[12].x) * (Math.abs(l[11].x - l[12].x) > 0.02 ? 1 : 0);
  frontScore = clamp(frontScore + s * 0.25, -1, 1);
  if (frontScore < -0.6) backView = true; else if (frontScore > 0.6) backView = false;
}
const IDX = { sh0: 11, sh1: 12, el0: 13, el1: 14, wr0: 15, wr1: 16, hp0: 23, hp1: 24, kn0: 25, kn1: 26, an0: 27, an1: 28, ey0: 2, ey1: 5, ea0: 7, ea1: 8, he0: 29, he1: 30, ft0: 31, ft1: 32 };
function screenLM(srcW, srcH) { const L = {}; for (const k in IDX) { const p = LM[IDX[k]]; L[k] = stage.toScreen(p.x, p.y); } return L; }

function draw(src, live) {
  const sw = src.videoWidth || src.width, sh = src.videoHeight || src.height;
  stage.layout(sw, sh); stage.begin(src);
  if (!LM || !G.front) return;
  const L = screenLM(sw, sh), opt = { scale: +$('rScale').value, offsetY: +$('rOff').value * stage.H * 0.3 };
  const shade = $('chkShade').checked ? 0.9 : 0, view = $('selView').value;
  const useBack = (view === 'back' || (view === 'auto' && backView)) && G.back;
  const img = useBack ? G.back : G.front, key = G.key + (useBack ? '#b' : '');
  if (P.kind === 'zapatos') { drawShoes(img, key, L, shade); }
  else if (PERSONA.includes(P.kind)) {
    const t = tplOf(img, key); if (!t) return;
    const map = mapping(t, L, opt); if (map) stage.garment(key, img, map, { shade, mean: meanL });
  }
  if ($('chkDots').checked) dots(L);
  if (live && P.kind !== 'gafas' && P.kind !== 'gorra') {
    const vis = (i) => (LM[i]?.v ?? 0) > 0.5;
    if (frame % 20 === 0) hint(P.kind === 'zapatos' ? (vis(31) && vis(32) ? '' : 'Apunta la cámara a tus pies') : (vis(11) && vis(12) && vis(23) && vis(24) ? (backView && G.back ? 'Viendo la espalda' : '') : 'Aléjate: necesito ver hombros y cadera'));
  }
}
function drawShoes(img, key, L, shade) {
  const t = tplOf(img, key); if (!t) return; const w = img.width;
  for (const [h, f] of [[L.he0, L.ft0], [L.he1, L.ft1]]) {
    const dx = f[0] - h[0], dy = f[1] - h[1], len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
    const H = [h[0] - ux * len * 0.18, h[1] - uy * len * 0.18 + len * 0.08], T = [f[0] + ux * len * 0.22, f[1] + uy * len * 0.22 + len * 0.08];
    const flip = T[0] < H[0];
    const a0 = flip ? [w - t.pts.heel[0], t.pts.heel[1]] : t.pts.heel, a1 = flip ? [w - t.pts.toe[0], t.pts.toe[1]] : t.pts.toe;
    const sim = similarity(a0, a1, H, T), map = flip ? (x, y) => sim(w - x, y) : sim;
    stage.garment(key, img, map, { shade, mean: meanL, cols: 10, rows: 6 });
  }
}
let dotC;
function dots(L) {
  // marcadores de depuración sobre una capa 2D
  if (!dotC) { dotC = document.createElement('canvas'); dotC.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none'; $('stage').append(dotC); }
  dotC.width = stage.W; dotC.height = stage.H; const x = dotC.getContext('2d'); x.fillStyle = '#f4b43a';
  for (const k in L) { x.beginPath(); x.arc(L[k][0], L[k][1], 6, 0, 7); x.fill(); }
}
$('chkDots').onchange = () => { if (!$('chkDots').checked && dotC) { dotC.remove(); dotC = null; } };
['rScale', 'rOff', 'chkShade', 'selView'].forEach((id) => $(id).addEventListener('input', () => frozen && draw(frozen, false)));

async function usePhoto(file) {
  if (!file?.type.startsWith('image/')) return;
  stopCam(); sm = null;
  const url = URL.createObjectURL(file); let im;
  try { im = await loadImgLocal(url); } finally { URL.revokeObjectURL(url); }
  frozen = fit(im, 1400); stage.mirror = false; $('empty').hidden = true; hint('Analizando tu foto…');
  try { await getPose(); await runMode('IMAGE'); const r = pose.detect(frozen), l = r.landmarks?.[0]; frontScore = 0; setLM(l); if (l) { backView = frontScore < 0; frontScore = backView ? -1 : 1; } }
  catch { LM = null; }
  meanL = luminance(frozen);
  hint(LM ? '' : 'No encontré a la persona. Usa una foto de cuerpo entero.');
  draw(frozen, false);
}
function loadImgLocal(src) { return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; }); }
function fit(src, max) { const w = src.naturalWidth || src.width, h = src.naturalHeight || src.height, s = Math.min(1, max / Math.max(w, h)); const c = Object.assign(document.createElement('canvas'), { width: Math.round(w * s), height: Math.round(h * s) }); c.getContext('2d').drawImage(src, 0, 0, c.width, c.height); return c; }

$('btnStart').onclick = startCam;
$('filePhoto').onchange = (e) => usePhoto(e.target.files[0]);
$('btnUpload').onclick = () => (mode === 'espacio' ? $('fileRoom') : $('filePhoto')).click();
$('btnFlip').onclick = () => { facing = facing === 'user' ? 'environment' : 'user'; sm = null; if (mode === 'probar') startCam(); };
document.addEventListener('visibilitychange', () => { if (document.hidden) stopCam(); });

/* ================== 5. MI ESPACIO (foto real + perspectiva) ================== */
const rc = $('room'), rx = rc.getContext('2d');
let room = null, roomSrc = null, corners = null, roomTex = null, bigTex = null, dragI = -1, surf = null, roomMean = 0.5, manual = false;
let roomLive = null, segBusy = false, segT = 0, scanT = 0;
const DEMO_ROOM = { src: '/assets/cama-demo.webp', q: [[0.046, 0.47], [0.62, 0.36], [1.0, 0.585], [0.556, 0.84]] };
async function useDemoRoom() { stopRoomCam(); const im = await loadImg(DEMO_ROOM.src); await setRoom(fit(im, 1400)); }
async function setRoom(c) {
  stopRoomCam(); room = c; roomSrc = c; rc.width = c.width; rc.height = c.height; manual = false; surf = null;
  corners = [[0.18, 0.45], [0.82, 0.45], [0.95, 0.85], [0.05, 0.85]].map(([x, y]) => [x * c.width, y * c.height]);
  roomMean = meanLum(c); await prepRoomTexture(); renderRoom();
  scanT = performance.now(); scanLoop(); hint(`Detectando tu ${surfName()}…`);
  try {
    const s = await findSurface(c, P.kind, c.width, c.height);
    if (room !== c) return;
    if (s?.quad) { surf = s; corners = s.quad; hint(''); toast(`Listo: lo puse sobre tu ${surfName()}`); }
    else { manual = true; hint(`No encontré la ${surfName()}. Arrastra los 4 puntos a sus esquinas.`); }
  } catch { manual = true; hint('Arrastra los 4 puntos a las esquinas.'); }
  scanT = 0; renderRoom();
}
const surfName = () => (P.kind === 'mantel' ? 'mesa' : P.kind === 'cortina' ? 'ventana' : 'cama');
function scanLoop() { if (!scanT) return renderRoom(); renderRoom(); requestAnimationFrame(scanLoop); }
async function prepRoomTexture() {
  if (!G.frontRaw && !G.front) return;
  const src = G.frontRaw || G.front;
  roomTex = HOGAR.includes(P.kind) ? (await textureFor(P, src)).canvas : G.front;
  // textura de 2×2 baldosas para cubrir también los costados de la cama
  bigTex = Object.assign(document.createElement('canvas'), { width: roomTex.width * 2, height: roomTex.height * 2 });
  const b = bigTex.getContext('2d'); for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) b.drawImage(roomTex, i * roomTex.width, j * roomTex.height);
}
function cropFor(p) { const q = new URLSearchParams(location.search).get('tela'); if (q) { const a = q.split(',').map(Number); if (a.length === 4 && a.every((v) => v >= 0 && v <= 1)) return a; } return p.kind === 'cortina' ? [0.8, 0.2, 0.14, 0.35] : p.kind === 'mantel' ? [0.2, 0.62, 0.5, 0.25] : [0.32, 0.62, 0.36, 0.2]; }
const lumC2 = Object.assign(document.createElement('canvas'), { width: 32, height: 32 });
function meanLum(src, m) {
  const x = lumC2.getContext('2d', { willReadFrequently: true }); x.clearRect(0, 0, 32, 32); x.drawImage(src, 0, 0, 32, 32);
  if (m) { x.globalCompositeOperation = 'destination-in'; x.drawImage(m, 0, 0, 32, 32); x.globalCompositeOperation = 'source-over'; }
  const d = x.getImageData(0, 0, 32, 32).data; let s = 0, n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 128) { s += d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11; n++; }
  return n ? s / n / 255 : 0.5;
}
function homography(q) {
  const [p0, p1, p2, p3] = q.map(([x, y]) => ({ x, y }));
  const sx = p0.x - p1.x + p2.x - p3.x, sy = p0.y - p1.y + p2.y - p3.y; let a, b, c, d, e, f, g = 0, h = 0;
  if (Math.abs(sx) < 1e-9 && Math.abs(sy) < 1e-9) { a = p1.x - p0.x; b = p3.x - p0.x; c = p0.x; d = p1.y - p0.y; e = p3.y - p0.y; f = p0.y; }
  else { const dx1 = p1.x - p2.x, dx2 = p3.x - p2.x, dy1 = p1.y - p2.y, dy2 = p3.y - p2.y, den = dx1 * dy2 - dx2 * dy1; g = (sx * dy2 - dx2 * sy) / den; h = (dx1 * sy - sx * dy1) / den; a = p1.x - p0.x + g * p1.x; b = p3.x - p0.x + h * p3.x; c = p0.x; d = p1.y - p0.y + g * p1.y; e = p3.y - p0.y + h * p3.y; f = p0.y; }
  return (u, v) => { const w = g * u + h * v + 1; return [(a * u + b * v + c) / w, (d * u + e * v + f) / w]; };
}
function tri(x, img, d, s) {
  const [[x0, y0], [x1, y1], [x2, y2]] = d, [[u0, v0], [u1, v1], [u2, v2]] = s, cx = (x0 + x1 + x2) / 3, cy = (y0 + y1 + y2) / 3;
  const inf = (px, py) => { const dx = px - cx, dy = py - cy, l = Math.hypot(dx, dy) || 1; return [px + dx / l * .7, py + dy / l * .7]; };
  const den = u0 * v1 + v0 * u2 + u1 * v2 - v1 * u2 - v0 * u1 - u0 * v2; if (!den) return;
  const A = (x0 * v1 + v0 * x2 + x1 * v2 - v1 * x2 - v0 * x1 - x0 * v2) / den, B = (u0 * x1 + x0 * u2 + u1 * x2 - x1 * u2 - x0 * u1 - u0 * x2) / den, C = (u0 * v1 * x2 + v0 * x1 * u2 + x0 * u1 * v2 - x0 * v1 * u2 - v0 * u1 * x2 - u0 * x1 * v2) / den;
  const D = (y0 * v1 + v0 * y2 + y1 * v2 - v1 * y2 - v0 * y1 - y0 * v2) / den, E = (u0 * y1 + y0 * u2 + u1 * y2 - y1 * u2 - y0 * u1 - u0 * y2) / den, F = (u0 * v1 * y2 + v0 * y1 * u2 + y0 * u1 * v2 - y0 * v1 * u2 - v0 * u1 * y2 - u0 * y1 * v2) / den;
  const [e0, e1, e2] = [inf(x0, y0), inf(x1, y1), inf(x2, y2)];
  x.save(); x.beginPath(); x.moveTo(...e0); x.lineTo(...e1); x.lineTo(...e2); x.closePath(); x.clip(); x.transform(A, D, B, E, C, F); x.drawImage(img, 0, 0); x.restore();
}
const layer = document.createElement('canvas'); let shadeMap = null;
// Luz y pliegues sin el color original: luminancia / luminancia desenfocada (quita estampados y colores oscuros, deja sombras y arrugas)
function buildShadeMap(src, mask) {
  const sw = src.videoWidth || src.width, sh = src.videoHeight || src.height, k = Math.min(1, 420 / Math.max(sw, sh)), w = Math.max(8, Math.round(sw * k)), h = Math.max(8, Math.round(sh * k));
  const c = Object.assign(document.createElement('canvas'), { width: w, height: h }), x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(src, 0, 0, w, h); const id = x.getImageData(0, 0, w, h), d = id.data, L = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) L[i] = d[i * 4] * .3 + d[i * 4 + 1] * .59 + d[i * 4 + 2] * .11 + 1;
  const B = boxBlur(boxBlur(L, w, h, Math.round(w / 30)), w, h, Math.round(w / 30));
  let mA = null; if (mask) { const mc = Object.assign(document.createElement('canvas'), { width: w, height: h }), mx = mc.getContext('2d', { willReadFrequently: true }); mx.drawImage(mask, 0, 0, w, h); mA = mx.getImageData(0, 0, w, h).data; }
  let sum = 0, n = 0; for (let i = 0; i < w * h; i++) if (!mA || mA[i * 4 + 3] > 128) { sum += B[i]; n++; }
  const mB = sum / Math.max(1, n);
  for (let i = 0; i < w * h; i++) {
    const fold = clamp(Math.pow(L[i] / B[i], 1.05), 0.68, 1.25), light = clamp(Math.pow(B[i] / mB, 0.45), 0.8, 1.12), v = fold * light;
    const g = clamp(128 + (v > 1 ? (v - 1) * 0.5 : v - 1) * 240, 0, 255); d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = g; d[i * 4 + 3] = 255;
  }
  x.putImageData(id, 0, 0); return { c, src, key: mask || 0, t: performance.now() };
}
function boxBlur(a, w, h, r) {
  r = Math.max(1, r); const t = new Float32Array(w * h), o = new Float32Array(w * h);
  for (let y = 0; y < h; y++) { let s = 0; const row = y * w; for (let x = -r; x <= r; x++) s += a[row + clamp(x, 0, w - 1)]; for (let x = 0; x < w; x++) { t[row + x] = s / (2 * r + 1); s += a[row + clamp(x + r + 1, 0, w - 1)] - a[row + clamp(x - r, 0, w - 1)]; } }
  for (let x = 0; x < w; x++) { let s = 0; for (let y = -r; y <= r; y++) s += t[clamp(y, 0, h - 1) * w + x]; for (let y = 0; y < h; y++) { o[y * w + x] = s / (2 * r + 1); s += t[clamp(y + r + 1, 0, h - 1) * w + x] - t[clamp(y - r, 0, h - 1) * w + x]; } }
  return o;
}
function renderRoom(srcFrame) {
  const base = srcFrame || room; if (!base) return;
  const W = rc.width, H = rc.height; rx.clearRect(0, 0, W, H); rx.drawImage(base, 0, 0, W, H);
  if (scanT) return drawScan(W, H);
  if (!bigTex || !corners) return;
  if (layer.width !== W || layer.height !== H) { layer.width = W; layer.height = H; }
  const lx = layer.getContext('2d'); lx.clearRect(0, 0, W, H);
  // con máscara detectada la tela cubre también los costados (u,v de -0,35 a 1,35) y se recorta a la silueta real
  const ext = surf && !manual ? 0.35 : 0, Hm = homography(corners), N = 18, tw = bigTex.width, th = bigTex.height, pts = [];
  const U = (k) => -ext + (1 + 2 * ext) * k / N;
  for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) pts.push(Hm(U(i), U(j)));
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const k = j * (N + 1) + i, a = pts[k], b = pts[k + 1], c = pts[k + N + 2], d = pts[k + N + 1];
    const s = (ii, jj) => [(0.5 + (U(ii) - 0.5) * 0.5) * tw, (0.5 + (U(jj) - 0.5) * 0.5) * th];
    tri(lx, bigTex, [a, b, c], [s(i, j), s(i + 1, j), s(i + 1, j + 1)]); tri(lx, bigTex, [a, c, d], [s(i, j), s(i + 1, j + 1), s(i, j + 1)]);
  }
  if ($('chkShade').checked && HOGAR.includes(P.kind)) {
    if (!shadeMap || shadeMap.src !== base || shadeMap.key !== (surf && !manual ? surf.mask : 0) || (base.videoWidth && performance.now() - shadeMap.t > 700)) shadeMap = buildShadeMap(base, surf && !manual ? surf.mask : null);
    lx.globalCompositeOperation = 'overlay'; lx.drawImage(shadeMap.c, 0, 0, W, H); lx.globalCompositeOperation = 'source-over';
  }
  lx.globalCompositeOperation = 'destination-in';
  if (surf && !manual) lx.drawImage(surf.mask, 0, 0, W, H);
  else { lx.beginPath(); corners.forEach((p, i) => (i ? lx.lineTo(...p) : lx.moveTo(...p))); lx.closePath(); lx.fill(); }
  lx.globalCompositeOperation = 'source-over';
  rx.drawImage(layer, 0, 0);
  if (!showHandles || !manual) return;
  const r = Math.max(12, W / 40);
  rx.lineWidth = r / 5; rx.strokeStyle = 'rgba(0,255,136,.95)'; rx.setLineDash([r * .8, r * .6]); rx.beginPath(); corners.forEach((p, i) => (i ? rx.lineTo(...p) : rx.moveTo(...p))); rx.closePath(); rx.stroke(); rx.setLineDash([]);
  corners.forEach((p) => { rx.fillStyle = '#07080a'; rx.strokeStyle = '#00ff88'; rx.lineWidth = r / 3; rx.beginPath(); rx.arc(p[0], p[1], r, 0, 7); rx.fill(); rx.stroke(); });
}
function drawScan(W, H) { // barrido de luz mientras la IA detecta la superficie
  const t = ((performance.now() - scanT) / 1400) % 1, y = t * H;
  const g = rx.createLinearGradient(0, y - H * 0.18, 0, y); g.addColorStop(0, 'rgba(0,255,136,0)'); g.addColorStop(1, 'rgba(0,255,136,.28)');
  rx.fillStyle = 'rgba(7,8,10,.25)'; rx.fillRect(0, 0, W, H); rx.fillStyle = g; rx.fillRect(0, y - H * 0.18, W, H * 0.18);
  rx.fillStyle = '#00ff88'; rx.shadowColor = '#00ff88'; rx.shadowBlur = 24; rx.fillRect(0, y - 2, W, 3); rx.shadowBlur = 0;
}
// Cámara en vivo sobre la cama: re-detecta cada ~0,8 s y dibuja a 30 fps
async function startRoomCam() {
  if (!navigator.mediaDevices?.getUserMedia) return toast('Este navegador no deja usar la cámara. Sube una foto.');
  stopRoomCam(); stopCam();
  let st; try { st = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } }); } catch { return toast('Sin permiso de cámara. Puedes subir una foto.'); }
  const v = document.createElement('video'); v.playsInline = true; v.muted = true; v.srcObject = st; await v.play();
  roomLive = { v, st, raf: 0 }; rc.width = v.videoWidth; rc.height = v.videoHeight; room = null; surf = null; manual = false; corners = null;
  hint(`Apunta a tu ${surfName()}…`);
  const tick = () => {
    if (!roomLive) return; roomLive.raf = requestAnimationFrame(tick);
    renderRoom(v);
    if (!segBusy && performance.now() - segT > 800) {
      segBusy = true; segT = performance.now();
      findSurface(v, P.kind, rc.width, rc.height).then((s) => { if (!roomLive) return; if (s?.quad) { surf = s; corners = s.quad; roomMean = meanLum(v, s.mask); hint(''); } else hint(`Apunta a tu ${surfName()}…`); }).catch(() => {}).finally(() => { segBusy = false; });
    }
  };
  tick();
}
function stopRoomCam() { if (!roomLive) return; cancelAnimationFrame(roomLive.raf); roomLive.st.getTracks().forEach((t) => t.stop()); roomLive = null; }
let showHandles = true;
function roomPoint(e) { const r = rc.getBoundingClientRect(), s = Math.min(r.width / rc.width, r.height / rc.height), ox = (r.width - rc.width * s) / 2, oy = (r.height - rc.height * s) / 2; return [(e.clientX - r.left - ox) / s, (e.clientY - r.top - oy) / s]; }
rc.style.objectFit = 'contain';
rc.addEventListener('pointerdown', (e) => { if (!corners || !manual) return; const p = roomPoint(e); let b = -1, bd = rc.width / 7; corners.forEach((c, i) => { const d = Math.hypot(c[0] - p[0], c[1] - p[1]); if (d < bd) { bd = d; b = i; } }); dragI = b; if (b >= 0) { rc.setPointerCapture(e.pointerId); showHandles = true; } });
rc.addEventListener('pointermove', (e) => { if (dragI < 0) return; const p = roomPoint(e); corners[dragI] = [clamp(p[0], 0, rc.width), clamp(p[1], 0, rc.height)]; if (!renderRoom.q) renderRoom.q = requestAnimationFrame(() => { renderRoom.q = 0; renderRoom(); }); });
rc.addEventListener('pointerup', () => (dragI = -1));
$('fileRoom').onchange = async (e) => { const f = e.target.files[0]; if (!f?.type.startsWith('image/')) return; const u = URL.createObjectURL(f); try { await setRoom(fit(await loadImgLocal(u), 1600)); } finally { URL.revokeObjectURL(u); } };
$('btnRoomDemo').onclick = useDemoRoom;
$('btnRoomLive').onclick = startRoomCam;
$('btnRoomReset').onclick = () => { if (!rc.width) return; manual = !manual; if (manual && !surf) corners = [[0.18, 0.45], [0.82, 0.45], [0.95, 0.85], [0.05, 0.85]].map(([x, y]) => [x * rc.width, y * rc.height]); $('btnRoomReset').textContent = manual ? 'Volver a automático' : 'Ajustar a mano'; if (!manual && !surf) toast('Primero sube una foto donde se vea la cama.'); renderRoom(); };
$('chkShade').addEventListener('input', () => mode === 'espacio' && renderRoom());

/* ================== 6. TAMAÑO REAL 3D / AR ================== */
let mvUrl = null;
async function build3D() {
  if (!G.frontRaw && !G.front) return;
  const kind = HOGAR.includes(P.kind) ? P.kind : 'cama';
  const dims = { w: num($('dW').value, 10, 400) ?? 140, l: num($('dL').value, 10, 400) ?? 190, h: num($('dH').value, 1, 80) ?? 30 };
  const tex = await textureFor(P, G.frontRaw || G.front);
  const { blob, placement } = buildModel(kind, dims, tex);
  if (mvUrl) URL.revokeObjectURL(mvUrl); mvUrl = URL.createObjectURL(blob);
  const mv = $('mv'); mv.setAttribute('ar-placement', placement); mv.src = mvUrl;
  hint(`${P.kind === 'cortina' ? 'Cortina' : P.kind === 'mantel' ? 'Mesa con mantel' : 'Cama'} de ${dims.w} × ${dims.l} cm`);
}

/* ================== 7. MEDIR ================== */
(async () => { if (await xrSupported()) { $('medirXR').hidden = false; $('medirFoto').querySelector('.lead').textContent = '¿Sin realidad aumentada? Pon una tarjeta bancaria sobre lo que vas a medir, toma la foto y marca los puntos.'; } })();
$('btnXR').onclick = async () => {
  try {
    await startMeasure($('xrui'), { add: $('xrAdd'), undo: $('xrUndo'), close: $('xrClose'), reticle: $('ret'), read: $('xrRead'),
      onEnd: (ms) => { if (!ms.length) return; showMeasure(ms.map((m) => Math.round(m * 1000) / 10)); } });
  } catch { toast('Tu celular no permitió abrir la realidad aumentada. Usa la medición con tarjeta.'); }
};
function showMeasure(cms) {
  const r = $('resMedir'); r.hidden = false; r.replaceChildren();
  const s = document.createElement('div'); s.className = 'size'; s.textContent = `${cms[cms.length - 1]} cm`; r.append(s);
  if (cms.length > 1) { const p = document.createElement('p'); p.textContent = 'Medidas: ' + cms.map((c) => c + ' cm').join(' · '); r.append(p); }
  if (P.kind === 'cama' && cms.length >= 2) { $('bW').value = Math.round(Math.min(cms[0], cms[1])); $('bL').value = Math.round(Math.max(cms[0], cms[1])); if (cms[2]) $('bH').value = Math.round(cms[2]); const p = document.createElement('p'); p.textContent = 'Lo pasé a Mi talla para recomendarte la medida.'; r.append(p); }
}
// Medición por foto con tarjeta (85,6 mm)
let mPts = [], mImg = null;
$('fileMeasure').onchange = async (e) => {
  const f = e.target.files[0]; if (!f) return; const u = URL.createObjectURL(f);
  try { mImg = fit(await loadImgLocal(u), 1600); } finally { URL.revokeObjectURL(u); }
  mPts = []; setMode('espacio'); room = mImg; rc.width = mImg.width; rc.height = mImg.height; roomTex = null; corners = null; rx.drawImage(mImg, 0, 0);
  $('roomTools').hidden = true; hint('1/4 Toca un extremo del lado largo de la tarjeta'); measuring = true;
};
let measuring = false;
rc.addEventListener('click', (e) => {
  if (!measuring) return; const p = roomPoint(e); mPts.push(p);
  const x = rx; x.fillStyle = '#f4b43a'; x.beginPath(); x.arc(p[0], p[1], Math.max(8, rc.width / 90), 0, 7); x.fill();
  if (mPts.length % 2 === 0) { const a = mPts[mPts.length - 2]; x.strokeStyle = '#f4b43a'; x.lineWidth = Math.max(4, rc.width / 250); x.beginPath(); x.moveTo(...a); x.lineTo(...p); x.stroke(); }
  const msg = ['', '2/4 Toca el otro extremo de la tarjeta', '3/4 Toca el inicio de lo que quieres medir', '4/4 Toca el final'];
  if (mPts.length < 4) return hint(msg[mPts.length]);
  const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]), cm = d(mPts[2], mPts[3]) / d(mPts[0], mPts[1]) * 8.56;
  measuring = false; hint(''); $('medir').hidden = false; showMeasure([Math.round(cm * 10) / 10]);
  const n = document.createElement('p'); n.textContent = 'Por foto la precisión es de ±3 %. Pon la tarjeta a la misma distancia que lo que mides.'; $('resMedir').append(n);
});

/* ================== 8. MI TALLA (2 fotos + estatura) ================== */
const shots = { f: null, s: null };
document.querySelectorAll('.shot input').forEach((inp) => (inp.onchange = async (e) => {
  const f = e.target.files[0]; if (!f) return; const u = URL.createObjectURL(f);
  try { shots[inp.dataset.side] = fit(await loadImgLocal(u), 1200); const lab = inp.parentElement; lab.style.backgroundImage = `url(${shots[inp.dataset.side].toDataURL('image/jpeg', 0.6)})`; lab.classList.add('has'); } finally { URL.revokeObjectURL(u); }
}));
let segPose = null;
async function getSeg() {
  if (segPose) return segPose; await getPose(); const vision = window.__vision;
  const so = (d, m) => ({ baseOptions: { modelAssetPath: MODEL(m), delegate: d }, runningMode: 'IMAGE', numPoses: 1, outputSegmentationMasks: true });
  try { segPose = await vision.PoseLandmarker.createFromOptions(window.__fs, so('GPU', 'full')); } catch { segPose = await vision.PoseLandmarker.createFromOptions(window.__fs, so('CPU', 'lite')); }
  return segPose;
}
async function bodyMeasure(img) {
  const r = (await getSeg()).detect(img), lm = r.landmarks?.[0], m = r.segmentationMasks?.[0];
  if (!lm || !m) return null;
  const W = m.width, H = m.height, a = m.getAsFloat32Array(); m.close?.();
  const on = (x, y) => a[y * W + x] > 0.5;
  let top = -1, bot = -1; for (let y = 0; y < H; y++) { let any = false; for (let x = 0; x < W; x += 2) if (on(x, y)) { any = true; break; } if (any) { if (top < 0) top = y; bot = y; } }
  const cx = Math.round(((lm[11].x + lm[12].x + lm[23].x + lm[24].x) / 4) * W);
  const width = (fy) => { const y = Math.round(clamp(fy, 0, 1) * H); if (!on(cx, y)) return 0; let l = cx, rr = cx; while (l > 0 && on(l - 1, y)) l--; while (rr < W - 1 && on(rr + 1, y)) rr++; return rr - l; };
  const sh = (lm[11].y + lm[12].y) / 2, hp = (lm[23].y + lm[24].y) / 2, t = hp - sh;
  // ancho del cuerpo a una altura, cortando los brazos: busca huecos y, si no hay, limita por las articulaciones
  const swPx = Math.abs(lm[11].x - lm[12].x) * W, hwPx = Math.abs(lm[23].x - lm[24].x) * W;
  const torsoW = (fy, cap) => {
    const y = Math.round(clamp(fy, 0, 1) * H); if (!on(cx, y)) return 0;
    let l = cx, rr = cx; while (l > 0 && on(l - 1, y)) l--; while (rr < W - 1 && on(rr + 1, y)) rr++;
    return Math.min(rr - l, cap);
  };
  const side = swPx < 0.08 * W; // foto de perfil: hombros casi superpuestos
  if (side) return { hpx: bot - top, chest: torsoW(sh + t * 0.22, 1e9), waist: torsoW(sh + t * 0.75, 1e9), hip: torsoW(hp + t * 0.08, 1e9), side: true };
  let waist = 1e9; for (let f = 0.6; f <= 0.85; f += 0.05) waist = Math.min(waist, torsoW(sh + t * f, hwPx * 1.75) || 1e9);
  return { hpx: bot - top, chest: torsoW(sh + t * 0.22, swPx * 0.98), waist: waist === 1e9 ? 0 : waist, hip: torsoW(hp + t * 0.08, hwPx * 1.85), side: false };
}
const ellipse = (w, d) => { const a = w / 2, b = d / 2; return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b))); };
const CHART = {
  f: [['XS', 80, 64, 88], ['S', 86, 70, 94], ['M', 92, 76, 100], ['L', 100, 84, 108], ['XL', 108, 92, 116], ['XXL', 116, 100, 124]],
  m: [['XS', 84, 70, 86], ['S', 90, 76, 92], ['M', 98, 84, 100], ['L', 106, 92, 106], ['XL', 114, 100, 112], ['XXL', 122, 108, 118]],
};
$('btnTalla').onclick = async () => {
  const Hc = num($('tH').value, 100, 220), Wk = num($('tW').value, 30, 200), sex = $('tS').value;
  if (!Hc) return toast('Escribe tu estatura.');
  const btn = $('btnTalla'); btn.disabled = true; btn.textContent = 'Midiendo tu cuerpo…';
  try {
    let chest, waist, hip, how;
    const F = shots.f ? await bodyMeasure(shots.f) : null, S = shots.s ? await bodyMeasure(shots.s) : null; window.__talla = { F, S };
    if (F && F.hpx > 50 && F.chest) {
      const k = Hc / F.hpx; const ks = S && S.hpx > 50 ? Hc / S.hpx : 0;
      const dd = (fw, sd, ratio) => (S && sd ? sd * ks : fw * k * ratio);
      chest = ellipse(F.chest * k, dd(F.chest, S?.chest, 0.72)); waist = ellipse(F.waist * k, dd(F.waist, S?.waist, 0.74)); hip = ellipse(F.hip * k, dd(F.hip, S?.hip, 0.8));
      how = S ? 'medidas con tus 2 fotos' : 'medidas con tu foto de frente (agrega la de lado para más precisión)';
    } else {
      if (!Wk) throw new Error('Toma la foto de frente o escribe tu peso.');
      const bmi = Wk / (Hc / 100) ** 2; chest = (sex === 'm' ? 0.54 : 0.53) * Hc + 1.6 * (bmi - 22); waist = chest * (sex === 'm' ? 0.86 : 0.8); hip = chest * (sex === 'm' ? 1.0 : 1.08);
      how = 'estimadas por estatura y peso (toma las fotos para medirte de verdad)';
    }
    const ch = CHART[sex], useBottom = P.kind === 'inferior';
    let idx = ch.findIndex((r) => (useBottom ? hip <= r[3] + 2 : chest <= r[1] + 3)); if (idx < 0) idx = ch.length - 1;
    idx = clamp(idx + (+$('tF').value), 0, ch.length - 1);
    const out = $('res'); out.hidden = false; out.replaceChildren();
    const big = document.createElement('div'); big.className = 'size'; big.textContent = ch[idx][0];
    const meas = document.createElement('div'); meas.className = 'meas';
    for (const [n, v] of [['Pecho', chest], ['Cintura', waist], ['Cadera', hip]]) { const d = document.createElement('div'); const b = document.createElement('b'); b.textContent = `${Math.round(v)} cm`; const s = document.createElement('span'); s.textContent = n; d.append(b, s); meas.append(d); }
    const p = document.createElement('p'); p.textContent = `Talla recomendada: ${how}.`;
    out.append(big, meas, p); pickVariant(ch[idx][0]);
  } catch (e) { toast(e.message || 'No pude medir. Usa fotos de cuerpo entero con buena luz.'); }
  btn.disabled = false; btn.textContent = 'Calcular mi talla';
};
$('btnCama').onclick = () => {
  const w = num($('bW').value, 60, 250), l = num($('bL').value, 150, 230), h = num($('bH').value, 5, 60);
  if (!w || !l || !h) return toast('Revisa las medidas del colchón.');
  const sizes = [['Sencilla', 100, 190, 'SENCILL'], ['Semidoble', 120, 190, 'SEMI'], ['Doble', 140, 190, 'DOBLE'], ['Queen', 160, 190, 'QUEEN'], ['King', 200, 200, 'KING']];
  const b = sizes.reduce((a, c) => (Math.abs(c[1] - w) + Math.abs(c[2] - l) < Math.abs(a[1] - w) + Math.abs(a[2] - l) ? c : a));
  const out = $('res'); out.hidden = false; out.replaceChildren();
  const big = document.createElement('div'); big.className = 'size'; big.textContent = b[0];
  const p = document.createElement('p'); p.textContent = `Tu colchón es ${b[0].toLowerCase()} (${b[1]} × ${b[2]} cm). Protector y sábana ajustable: necesitas un fondo de ${Math.ceil(h + 5)} cm o más. Cobija o edredón: mínimo ${w + 60} × ${l + 30} cm para que cuelgue a los lados.`;
  out.append(big, p); pickVariant(b[3]); $('dW').value = b[1]; $('dL').value = b[2]; $('dH').value = h;
};
let chosen = null;
function pickVariant(token) {
  if (!P.all) return updateBuy();
  const t = token.toUpperCase(), cur = P.variants[VAR]?.options?.[0];
  chosen = P.all.find((v) => v.options[0] === cur && v.options.some((o) => o.toUpperCase().includes(t))) || P.all.find((v) => v.options.some((o) => o.toUpperCase().includes(t))) || null;
  updateBuy(token);
}
function updateBuy(label) {
  const url = P?.url; $('btnBuy').hidden = !url; if (!url) return;
  const v = chosen || (P.variants[VAR]?.id ? P.variants[VAR] : null);
  $('btnBuy').href = v?.id ? `${url}?variant=${v.id}` : url;
  $('btnBuy').textContent = label ? `Comprar ${label.toLowerCase().replace('sencill', 'sencilla')}` : 'Comprar';
}

/* ================== 9. FOTO + IA ULTRA REALISTA ================== */
let lastShot = null, lastClean = null, lastBefore = null;
$('btnShot').onclick = async () => {
  if (mode === 'tres') { $('mv').activateAR?.(); return; }
  if (mode === 'espacio') { showHandles = false; renderRoom(); lastShot = rc.toDataURL('image/jpeg', 0.9); showHandles = true; renderRoom(); lastClean = roomLive ? fit((() => { const t = Object.assign(document.createElement('canvas'), { width: roomLive.v.videoWidth, height: roomLive.v.videoHeight }); t.getContext('2d').drawImage(roomLive.v, 0, 0); return t; })(), 1280).toDataURL('image/jpeg', 0.88) : roomSrc ? fit(roomSrc, 1280).toDataURL('image/jpeg', 0.88) : null; lastBefore = lastClean; return openShot(lastShot); }
  if (mode !== 'probar') return;
  if (!stream && !frozen) return toast('Activa la cámara o sube una foto primero.');
  const keep = G.front; G.front = null; draw(frozen || vid, false); lastBefore = glc.toDataURL('image/jpeg', 0.85); G.front = keep; draw(frozen || vid, false);
  lastShot = glc.toDataURL('image/jpeg', 0.9);
  const src = frozen || vid, c = fit(src.videoWidth ? (() => { const t = Object.assign(document.createElement('canvas'), { width: vid.videoWidth, height: vid.videoHeight }); t.getContext('2d').drawImage(vid, 0, 0); return t; })() : src, 1280);
  lastClean = c.toDataURL('image/jpeg', 0.88); openShot(lastShot);
};
function openShot(url) { $('kit').hidden = true; $('shot').hidden = false; $('shotT').textContent = 'Tu foto'; $('shotImg').src = url; $('spin').hidden = true; setCompare(lastBefore); $('btnKit2').hidden = !KIT; }
$('btnSave').onclick = async () => {
  const b = await (await fetch($('shotImg').src)).blob(), f = new File([b], 'probador-litper.jpg', { type: b.type || 'image/jpeg' });
  if (navigator.canShare?.({ files: [f] })) { try { await navigator.share({ files: [f], title: P.title }); return; } catch {} }
  const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'probador-litper.jpg'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
};
async function ultra() {
  if (!lastClean) { if (mode === 'probar' && (stream || frozen)) { $('btnShot').click(); } else return toast('Toma primero la foto.'); }
  $('shot').hidden = false; $('spin').hidden = false; $('shotT').textContent = 'Versión ultra realista';
  const v = P.variants[VAR], garment = new URL(v.image, location.href).href;
  const persona = PERSONA.includes(P.kind);
  try {
    const r = await fetch(persona ? '/api/tryon' : '/api/hogar', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(persona ? { person: lastClean, garment, category: P.kind } : { room: lastClean, product: garment, kind: P.kind, title: P.title }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error === 'sin_llave' ? 'La versión con IA se activa cuando Litper conecte su llave de IA. Mientras tanto usa la cámara en vivo.' : d.message || 'La IA no respondió. Intenta otra vez.');
    $('shotImg').src = d.image; setCompare(lastClean);
  } catch (e) { toast(e.message, 5000); }
  $('spin').hidden = true;
}
$('btnAI').onclick = ultra; $('btnAI2').onclick = ultra;


/* ================== 10. COMPLETA TU CAMA (kit / upsell) ================== */
let KIT = null, kitSel = new Set();
const money = (n) => '$' + Math.round(n).toLocaleString('es-CO');
const SIZE_RX = /(sencill|semi|doble|queen|king|super king)/i;
function sizeToken() { const t = (chosen?.options || []).join(' ') + ' ' + ($('res')?.querySelector('.size')?.textContent || ''); return (t.match(SIZE_RX) || [])[1] || 'doble'; }
function kitVariant(it) {
  const tok = sizeToken().toLowerCase(), av = it.variants.filter((v) => v.available !== false), list = av.length ? av : it.variants;
  return (tok && list.find((v) => v.options.some((o) => o.toLowerCase().includes(tok)))) || list[0];
}
async function loadKit() {
  KIT = null; kitSel = new Set(); $('btnKit').hidden = true;
  if (!P?.handle) return;
  try {
    const r = await fetch('/api/kit?handle=' + encodeURIComponent(P.handle)); if (!r.ok) return;
    const d = await r.json(); if (!d.items?.length) return;
    KIT = d; d.items.slice(0, 2).forEach((it) => kitSel.add(it.handle));
    $('kitT').textContent = HOGAR.includes(P.kind) ? (P.kind === 'mantel' ? 'Completa tu mesa' : P.kind === 'cortina' ? 'Completa tu ventana' : 'Completa tu cama') : 'Completa tu look';
    $('btnKit').hidden = false;
  } catch {}
}
function renderKit() {
  const list = $('kitList'); list.replaceChildren();
  const mainV = chosen || P.variants[VAR], mainPrice = parseFloat((P.all?.find((v) => v.id === mainV?.id)?.price ?? 0)) / 100 || 0;
  let total = mainPrice; const ids = mainV?.id ? [`${mainV.id}:1`] : [];
  for (const it of KIT.items) {
    const v = kitVariant(it), on = kitSel.has(it.handle);
    const row = document.createElement('div'); row.className = 'ki'; row.setAttribute('role', 'checkbox'); row.setAttribute('aria-checked', on ? 'true' : 'false'); row.tabIndex = 0;
    const im = document.createElement('img'); im.src = v.image || it.image || ''; im.alt = ''; im.loading = 'lazy';
    const tx = document.createElement('div'); const b = document.createElement('b'); b.textContent = it.title.length > 58 ? it.title.slice(0, 56) + '…' : it.title; const sm = document.createElement('small'); sm.textContent = v.title === 'Default Title' ? '' : v.title; const pr = document.createElement('div'); pr.className = 'pr'; pr.textContent = money(v.price); tx.append(b, sm, pr);
    const ck = document.createElement('i'); ck.textContent = on ? '✓' : '';
    row.append(im, tx, ck);
    const tog = () => { kitSel.has(it.handle) ? kitSel.delete(it.handle) : kitSel.add(it.handle); renderKit(); };
    row.onclick = tog; row.onkeydown = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); tog(); } };
    list.append(row);
    if (on) { total += v.price; ids.push(`${v.id}:1`); }
  }
  $('kitTotal').textContent = money(total);
  $('kitBuy').href = ids.length ? `${SHOP}/cart/${ids.join(',')}` : (P.url || SHOP);
  $('kitBuy').textContent = `Agregar ${ids.length} al carrito`;
}
function openKit() { if (!KIT) return toast('Abre un producto de la tienda para armar tu kit.'); ['shot', 'tune'].forEach((id) => ($(id).hidden = true)); renderKit(); $('kit').hidden = false; }
$('btnKit').onclick = openKit; $('btnKit2').onclick = openKit;

/* ================== 11. detalles de interfaz ================== */
function moveInk() { const on = document.querySelector('#dial button.on'), ink = $('dialInk'); if (!on || !ink) return; ink.style.width = on.offsetWidth + 'px'; ink.style.transform = `translateX(${on.offsetLeft}px)`; }
new MutationObserver(moveInk).observe($('dial'), { subtree: true, attributes: true, attributeFilter: ['class'] });
addEventListener('resize', moveInk); document.fonts?.ready.then(moveInk);
function setCompare(before) {
  const has = !!before; $('shotBefore').hidden = !has; $('cmpR').hidden = !has; $('cmpBar').hidden = !has;
  if (has) { $('shotBefore').src = before; $('cmpR').value = 50; $('cmp').style.setProperty('--cut', '50%'); }
}
$('cmpR').addEventListener('input', (e) => $('cmp').style.setProperty('--cut', e.target.value + '%'));

/* ================== arranque ================== */
const footer = document.querySelector('.bottom');
new ResizeObserver(() => { document.documentElement.style.setProperty('--foot', Math.round(footer.getBoundingClientRect().height - 8) + 'px'); if (frozen) draw(frozen, false); }).observe(footer);
loadProduct().then(() => setMode(PERSONA.includes(P.kind) ? 'probar' : 'espacio'));
window.__probador = { get mode() { return mode; }, get LM() { return LM; }, get P() { return P; }, get backView() { return backView; } };
