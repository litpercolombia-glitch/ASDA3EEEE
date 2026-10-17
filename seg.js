// Detección automática de la superficie (cama, mesa, ventana) con SegFormer ADE20K en el navegador.
// El modelo (4,4 MB) se sirve desde este mismo sitio: /models/... — nada sale del celular.
const TJS = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.5/dist/transformers.min.js';
const LABELS = { cama: ['bed'], mantel: ['table', 'desk'], cortina: ['curtain', 'windowpane'] };
let segP = null;
export function loadSeg() {
  if (segP) return segP;
  segP = (async () => {
    const T = await import(TJS);
    T.env.allowRemoteModels = false; T.env.localModelPath = '/models/'; T.env.allowLocalModels = true;
    const opts = { dtype: 'q8' };
    let gpu = null; try { gpu = navigator.gpu && (await navigator.gpu.requestAdapter()); } catch {}
    if (gpu) { try { return await T.pipeline('image-segmentation', 'Xenova/segformer-b0-finetuned-ade-512-512', { ...opts, device: 'webgpu' }); } catch {} }
    return T.pipeline('image-segmentation', 'Xenova/segformer-b0-finetuned-ade-512-512', { ...opts, device: 'wasm' });
  })().catch((e) => { segP = null; throw e; });
  return segP;
}

// src: canvas o video. Devuelve { mask: canvas con alfa del tamaño W×H, quad: 4 esquinas [x,y] en px, area }
export async function findSurface(src, kind, W, H) {
  const seg = await loadSeg();
  const S = 512, sw = src.videoWidth || src.width, sh = src.videoHeight || src.height, sc = Math.min(1, S / Math.max(sw, sh));
  const c = Object.assign(document.createElement('canvas'), { width: Math.round(sw * sc), height: Math.round(sh * sc) });
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  const out = await seg(c.toDataURL('image/jpeg', 0.9));
  const want = LABELS[kind] || LABELS.cama;
  const hits = out.filter((o) => want.includes(o.label.trim()));
  if (!hits.length) return null;
  const mw = hits[0].mask.width, mh = hits[0].mask.height, m = new Uint8Array(mw * mh);
  for (const h of hits) { const d = h.mask.data; for (let i = 0; i < m.length; i++) if (d[i] > 127) m[i] = 1; }
  const pil = kind === 'cama' ? out.find((o) => o.label.trim() === 'pillow') : null, pm = pil ? Uint8Array.from(pil.mask.data) : null;
  if (pm) { // solo cuentan como almohadas las manchas en la franja de arriba de la cama (evita confundir edredones oscuros)
    let yT = mh, yB = 0; for (let i = 0; i < m.length; i++) if (m[i]) { const y = (i / mw) | 0; if (y < yT) yT = y; if (y > yB) yB = y; }
    const band = yT + 0.45 * (yB - yT); for (let i = 0; i < pm.length; i++) if (pm[i] > 127 && ((i / mw) | 0) > band) pm[i] = 0;
  }
  if (pm) { // quita la cabecera: todo lo de la cama que quede por encima de la línea superior de las almohadas
    const xs = [], ys = [];
    for (let x = 0; x < mw; x += 2) for (let y = 0; y < mh; y++) if (pm[y * mw + x] > 127) { xs.push(x); ys.push(y); break; }
    if (xs.length > 8) {
      const n = xs.length, mx = xs.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n;
      let num = 0, den = 0; for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) ** 2; }
      const a = den ? clampS(num / den, -0.6, 0.6) : 0, b = my - a * mx;
      for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) if (y < a * x + b) m[y * mw + x] = 0;
    }
  }
  // nos quedamos con la mancha más grande (otra cama al fondo, reflejos)
  const keep = largestBlob(m, mw, mh); if (!keep.n || keep.n < mw * mh * 0.03) return null;
  const pts = []; for (let y = 0; y < mh; y += 2) for (let x = 0; x < mw; x += 2) if (keep.m[y * mw + x]) pts.push([x * W / mw, y * H / mh]);
  const hl = hull(pts), quad = toQuad(hl);
  // silueta = contorno convexo (tapa huecos de telas con estampado) menos las almohadas
  const mask = Object.assign(document.createElement('canvas'), { width: W, height: H }), kx = mask.getContext('2d');
  kx.fillStyle = '#000'; kx.beginPath(); hl.forEach((p, i) => (i ? kx.lineTo(...p) : kx.moveTo(...p))); kx.closePath(); kx.fill();
  if (pm) { // cada almohada se resta como su contorno convexo (tapa los huecos interiores)
    const lab = new Int32Array(mw * mh); let cur = 0; kx.globalCompositeOperation = 'destination-out';
    for (let s0 = 0; s0 < pm.length; s0++) {
      if (pm[s0] <= 127 || lab[s0]) continue; cur++; const st = [s0], P = []; lab[s0] = cur;
      while (st.length) { const p = st.pop(), x = p % mw, y = (p / mw) | 0; if (!(x % 2) && !(y % 2)) P.push([x * W / mw, y * H / mh]);
        for (const q of [x > 0 ? p - 1 : -1, x < mw - 1 ? p + 1 : -1, y > 0 ? p - mw : -1, y < mh - 1 ? p + mw : -1]) if (q >= 0 && pm[q] > 127 && !lab[q]) { lab[q] = cur; st.push(q); } }
      if (P.length * 4 < mw * mh * 0.003) continue;
      const h2 = hull(P); kx.beginPath(); h2.forEach((p, i) => (i ? kx.lineTo(...p) : kx.moveTo(...p))); kx.closePath(); kx.fill();
    }
    kx.globalCompositeOperation = 'source-over';
  }
  const soft = Object.assign(document.createElement('canvas'), { width: W, height: H }), sx = soft.getContext('2d');
  sx.filter = `blur(${Math.max(1, Math.round(W / 500))}px)`; sx.drawImage(mask, 0, 0); sx.filter = 'none';
  return { mask: soft, quad, area: keep.n / (mw * mh) };
}

const clampS = (v, a, b) => Math.min(b, Math.max(a, v));
function largestBlob(m, w, h) {
  const lab = new Int32Array(w * h); let best = 0, bestN = 0, cur = 0;
  for (let s = 0; s < m.length; s++) {
    if (!m[s] || lab[s]) continue; cur++; let n = 0; const st = [s]; lab[s] = cur;
    while (st.length) { const p = st.pop(); n++; const x = p % w, y = (p / w) | 0;
      for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]) if (q >= 0 && m[q] && !lab[q]) { lab[q] = cur; st.push(q); } }
    if (n > bestN) { bestN = n; best = cur; }
  }
  const out = new Uint8Array(w * h); for (let i = 0; i < out.length; i++) out[i] = lab[i] === best ? 1 : 0;
  return { m: out, n: bestN };
}
function hull(P) {
  P = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]); if (P.length < 4) return P;
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
// reduce el contorno a 4 esquinas (Visvalingam) y las ordena: atrás-izq, atrás-der, frente-der, frente-izq
function toQuad(h) {
  h = h.slice(); const area = (a, b, c) => Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2;
  while (h.length > 4) { let bi = 0, bv = Infinity; for (let i = 0; i < h.length; i++) { const v = area(h[(i - 1 + h.length) % h.length], h[i], h[(i + 1) % h.length]); if (v < bv) { bv = v; bi = i; } } h.splice(bi, 1); }
  if (h.length < 4) return null;
  const cx = h.reduce((s, p) => s + p[0], 0) / 4, cy = h.reduce((s, p) => s + p[1], 0) / 4;
  h.sort((a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx)); // horario en pantalla
  let s = 0, bs = Infinity; h.forEach((p, i) => { if (p[1] < bs) { bs = p[1]; s = i; } }); // empieza por la esquina más alta (fondo)
  const r = [0, 1, 2, 3].map((k) => h[(s + k) % 4]);
  // si el punto más alto quedó a la derecha, rota para que el orden sea izq-fondo primero
  return r[0][0] > r[1][0] ? [r[3], r[0], r[1], r[2]] : r;
}
