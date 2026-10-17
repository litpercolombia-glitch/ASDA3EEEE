// Fusión fiel (17-oct-2026): conserva los píxeles reales de la foto del cliente y usa la imagen de la IA
// solo donde cambió el producto. Así no cambian la cara, el cuarto, el piso ni la luz.
// Pasos: alinear (escala + desplazamiento) → igualar color → máscara por histéresis (la costura cae donde
// ambas fotos coinciden) → compuertas de calidad → mezcla suave a resolución completa.
// Si alguna compuerta falla, devuelve null y la app muestra la imagen de la IA tal cual.

const L = 256; // resolución de análisis (lado mayor)
const LIM = { err: 6, seam: 14, coverMin: 0.01, coverMax: 0.75 };

function pixels(src, w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true }); x.imageSmoothingQuality = 'high';
  x.drawImage(src, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h).data, n = w * h, f = new Float32Array(n * 3);
  for (let i = 0, j = 0; i < n; i++, j += 4) { f[i * 3] = d[j]; f[i * 3 + 1] = d[j + 1]; f[i * 3 + 2] = d[j + 2]; }
  return f;
}

// Muestra la imagen generada transformada: destino = sc * origen + (1 - sc) * centro + desplazamiento
function warp(g, w, h, sc, dx, dy, out) {
  const cx = w / 2, cy = h / 2, inv = 1 / sc;
  for (let y = 0; y < h; y++) {
    let sy = Math.round((y - (1 - sc) * cy - dy) * inv); sy = sy < 0 ? 0 : sy >= h ? h - 1 : sy;
    for (let x = 0; x < w; x++) {
      let sx = Math.round((x - (1 - sc) * cx - dx) * inv); sx = sx < 0 ? 0 : sx >= w ? w - 1 : sx;
      const s = (sy * w + sx) * 3, d = (y * w + x) * 3;
      out[d] = g[s]; out[d + 1] = g[s + 1]; out[d + 2] = g[s + 2];
    }
  }
  return out;
}

// Error robusto: promedio de la mitad de píxeles que menos cambian (ignora la zona del producto)
function robustErr(o, g, n, hist) {
  hist.fill(0);
  for (let i = 0, j = 0; i < n; i++, j += 3) {
    const v = (Math.abs(g[j] - o[j]) + Math.abs(g[j + 1] - o[j + 1]) + Math.abs(g[j + 2] - o[j + 2])) / 3;
    hist[v > 255 ? 255 : v | 0]++;
  }
  let half = n >> 1, acc = 0, cnt = 0;
  for (let b = 0; b < 256 && cnt < half; b++) { const t = Math.min(hist[b], half - cnt); acc += t * (b + 0.5); cnt += t; }
  return acc / Math.max(1, cnt);
}

function align(o, g, w, h, oc, gcs, wc, hc) {
  // búsqueda gruesa a media resolución y ajuste fino a resolución de análisis
  const hist = new Uint32Array(256);
  const k = w / wc; let best = [1e9, 1, 0, 0];
  const tc = new Float32Array(wc * hc * 3);
  for (let sc = 0.97; sc <= 1.0301; sc += 0.01) for (let dx = -3; dx <= 3; dx++) for (let dy = -3; dy <= 3; dy++) {
    const e = robustErr(oc, warp(gcs, wc, hc, sc, dx, dy, tc), wc * hc, hist); if (e < best[0]) best = [e, sc, dx * k, dy * k];
  }
  const n = w * h, tmp = new Float32Array(n * 3), [, s0, x0, y0] = best; best = [1e9, 1, 0, 0];
  for (const s of [s0 - 0.005, s0, s0 + 0.005]) for (const dx of [x0 - 1, x0, x0 + 1]) for (const dy of [y0 - 1, y0, y0 + 1]) {
    const e = robustErr(o, warp(g, w, h, s, dx, dy, tmp), n, hist); if (e < best[0]) best = [e, s, dx, dy];
  }
  return best;
}

// Desenfoque gaussiano aproximado (3 pasadas de caja) sobre un canal
function blur1(a, w, h, r) {
  if (r < 1) return a;
  const t = new Float32Array(a.length);
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 0; y < h; y++) {
      let acc = 0; const row = y * w;
      for (let x = -r; x <= r; x++) acc += a[row + Math.min(w - 1, Math.max(0, x))];
      for (let x = 0; x < w; x++) {
        t[row + x] = acc / (2 * r + 1);
        acc += a[row + Math.min(w - 1, x + r + 1)] - a[row + Math.max(0, x - r)];
      }
    }
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let y = -r; y <= r; y++) acc += t[Math.min(h - 1, Math.max(0, y)) * w + x];
      for (let y = 0; y < h; y++) {
        a[y * w + x] = acc / (2 * r + 1);
        acc += t[Math.min(h - 1, y + r + 1) * w + x] - t[Math.max(0, y - r) * w + x];
      }
    }
  }
  return a;
}

function morph(m, w, h, r, max) { // dilata (max) o erosiona (min) con un cuadrado de lado 2r+1
  const t = new Uint8Array(m.length), o = new Uint8Array(m.length);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let v = max ? 0 : 1;
    for (let k = -r; k <= r; k++) { const xx = x + k; if (xx < 0 || xx >= w) continue; const p = m[y * w + xx]; if (max ? p : !p) { v = max ? 1 : 0; break; } }
    t[y * w + x] = v;
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let v = max ? 0 : 1;
    for (let k = -r; k <= r; k++) { const yy = y + k; if (yy < 0 || yy >= h) continue; const p = t[yy * w + x]; if (max ? p : !p) { v = max ? 1 : 0; break; } }
    o[y * w + x] = v;
  }
  return o;
}

function label(m, w, h) { // componentes conectadas (8 vecinos)
  const lab = new Int32Array(m.length), areas = [0], stack = new Int32Array(m.length);
  let next = 0;
  for (let i = 0; i < m.length; i++) {
    if (!m[i] || lab[i]) continue;
    next++; let sp = 0, area = 0; stack[sp++] = i; lab[i] = next;
    while (sp) {
      const p = stack[--sp]; area++;
      const px = p % w, py = (p / w) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = px + dx, ny = py + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const q = ny * w + nx; if (m[q] && !lab[q]) { lab[q] = next; stack[sp++] = q; }
      }
    }
    areas.push(area);
  }
  return { lab, areas };
}

function otsu(hist, n) {
  let sum = 0; for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sumB = 0, wB = 0, best = 0, t = 0;
  for (let i = 0; i < 256; i++) {
    wB += hist[i]; if (!wB) continue; const wF = n - wB; if (!wF) break;
    sumB += i * hist[i]; const mB = sumB / wB, mF = (sum - sumB) / wF, v = wB * wF * (mB - mF) * (mB - mF);
    if (v > best) { best = v; t = i; }
  }
  return t;
}

/**
 * @param {HTMLCanvasElement|HTMLImageElement} orig foto del cliente (ya recortada al encuadre de la IA)
 * @param {HTMLImageElement} gen imagen de la IA
 * @returns {{canvas: HTMLCanvasElement, info: object} | {canvas: null, info: object}}
 */
export function fuse(orig, gen) {
  const W = orig.width || orig.naturalWidth, H = orig.height || orig.naturalHeight;
  const s = L / Math.max(W, H), w = Math.round(W * s), h = Math.round(H * s), n = w * h;
  const o = pixels(orig, w, h), g0 = pixels(gen, w, h);
  const wc = Math.round(w / 2), hc = Math.round(h / 2);
  const [err, sc, dx, dy] = align(o, g0, w, h, pixels(orig, wc, hc), pixels(gen, wc, hc), wc, hc);
  const info = { err: +err.toFixed(2), sc: +sc.toFixed(3), dx, dy };
  if (err > LIM.err) return { canvas: null, info: { ...info, motivo: 'encuadre' } };
  const g = warp(g0, w, h, sc, dx, dy, new Float32Array(n * 3));

  // 1) diferencia suave para elegir dónde medir el color
  const dc = [0, 1, 2].map((c) => { const a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = g[i * 3 + c] - o[i * 3 + c]; return blur1(a, w, h, 1); });
  const d0 = new Float32Array(n), hist = new Uint32Array(256);
  for (let i = 0; i < n; i++) { const v = (Math.abs(dc[0][i]) + Math.abs(dc[1][i]) + Math.abs(dc[2][i])) / 3; d0[i] = v; hist[v > 255 ? 255 : v | 0]++; }
  let p40 = 0; for (let b = 0, acc = 0; b < 256; b++) { acc += hist[b]; if (acc >= n * 0.4) { p40 = b + 1; break; } }

  // 2) corrección de color por canal (ganancia y desplazamiento) donde no cambió nada
  const A = [0, 1, 2].map((c) => {
    let sx = 0, sy = 0, sxx = 0, sxy = 0, k = 0;
    for (let i = 0; i < n; i++) { if (d0[i] >= p40) continue; const x = g[i * 3 + c], y = o[i * 3 + c]; sx += x; sy += y; sxx += x * x; sxy += x * y; k++; }
    const den = k * sxx - sx * sx; let a = den ? (k * sxy - sx * sy) / den : 1, b = k ? (sy - a * sx) / k : 0;
    a = Math.min(1.25, Math.max(0.8, a)); b = Math.min(30, Math.max(-30, b));
    return [a, b];
  });

  // 3) diferencia de color ya corregida
  const ec = [0, 1, 2].map((c) => { const [a, b] = A[c], t = new Float32Array(n); for (let i = 0; i < n; i++) t[i] = g[i * 3 + c] * a + b - o[i * 3 + c]; return blur1(t, w, h, 1); });
  const d = new Float32Array(n); hist.fill(0);
  for (let i = 0; i < n; i++) { const v = Math.hypot(ec[0][i], ec[1][i], ec[2][i]); d[i] = v; hist[v > 255 ? 255 : v | 0]++; }
  const ts = Math.max(otsu(hist, n), 28), tw = Math.max(12, 0.45 * ts);

  // 4) semillas fuertes → crecen por la zona débil conectada (histéresis)
  let seed = new Uint8Array(n); for (let i = 0; i < n; i++) seed[i] = d[i] > ts ? 1 : 0;
  seed = morph(morph(seed, w, h, 1, false), w, h, 1, true);
  const S = label(seed, w, h); if (S.areas.length <= 1) return { canvas: null, info: { ...info, motivo: 'sin_cambio' } };
  const big = Math.max(...S.areas.slice(1)), keepS = new Set();
  S.areas.forEach((a, i) => { if (i && a >= Math.max(0.2 * big, 0.003 * n)) keepS.add(i); });
  const weak = new Uint8Array(n); for (let i = 0; i < n; i++) weak[i] = d[i] > tw ? 1 : 0;
  const Wk = label(weak, w, h), keepW = new Set();
  for (let i = 0; i < n; i++) if (keepS.has(S.lab[i]) && Wk.lab[i]) keepW.add(Wk.lab[i]);
  let m = new Uint8Array(n); for (let i = 0; i < n; i++) m[i] = keepW.has(Wk.lab[i]) ? 1 : 0;
  m = morph(morph(m, w, h, 3, true), w, h, 3, false); // cierre

  // 5) rellenar huecos interiores
  const out = new Uint8Array(n), st = new Int32Array(n); let sp = 0;
  const push = (q) => { if (!m[q] && !out[q]) { out[q] = 1; st[sp++] = q; } };
  for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
  while (sp) { const p = st[--sp], px = p % w, py = (p / w) | 0; if (px > 0) push(p - 1); if (px < w - 1) push(p + 1); if (py > 0) push(p - w); if (py < h - 1) push(p + w); }
  for (let i = 0; i < n; i++) if (!out[i]) m[i] = 1;
  m = morph(m, w, h, 2, true);

  // 6) compuertas de calidad: cuánto cambia y si la costura cae donde ambas fotos coinciden
  let cover = 0; for (let i = 0; i < n; i++) cover += m[i]; cover /= n;
  const ring = morph(m, w, h, 3, true); let seamS = 0, seamN = 0;
  for (let i = 0; i < n; i++) if (ring[i] && !m[i]) { seamS += d[i]; seamN++; }
  const seam = seamN ? seamS / seamN : 99;
  Object.assign(info, { cover: +cover.toFixed(3), seam: +seam.toFixed(1), ts });
  if (cover < LIM.coverMin || cover > LIM.coverMax) return { canvas: null, info: { ...info, motivo: 'area' } };
  if (seam > LIM.seam) return { canvas: null, info: { ...info, motivo: 'costura' } };

  // 7) máscara suave a resolución completa
  const mf = new Float32Array(n); for (let i = 0; i < n; i++) mf[i] = m[i];
  blur1(mf, w, h, 1);
  const mc = document.createElement('canvas'); mc.width = w; mc.height = h;
  const mx = mc.getContext('2d'), mi = mx.createImageData(w, h);
  for (let i = 0; i < n; i++) { mi.data[i * 4 + 3] = Math.round(Math.min(1, Math.max(0, mf[i])) * 255); }
  mx.putImageData(mi, 0, 0);

  // 8) IA alineada y con color corregido, recortada por la máscara, sobre la foto original
  const gc = document.createElement('canvas'); gc.width = W; gc.height = H;
  const gx = gc.getContext('2d', { willReadFrequently: true }); gx.imageSmoothingQuality = 'high';
  const k = W / w; gx.setTransform(sc, 0, 0, sc, (1 - sc) * W / 2 + dx * k, (1 - sc) * H / 2 + dy * k);
  gx.drawImage(gen, 0, 0, W, H); gx.setTransform(1, 0, 0, 1, 0, 0);
  const id = gx.getImageData(0, 0, W, H), px = id.data;
  for (let i = 0; i < px.length; i += 4) { px[i] = px[i] * A[0][0] + A[0][1]; px[i + 1] = px[i + 1] * A[1][0] + A[1][1]; px[i + 2] = px[i + 2] * A[2][0] + A[2][1]; }
  gx.putImageData(id, 0, 0);
  gx.globalCompositeOperation = 'destination-in'; gx.imageSmoothingQuality = 'high'; gx.drawImage(mc, 0, 0, W, H);
  const fc = document.createElement('canvas'); fc.width = W; fc.height = H;
  const fx = fc.getContext('2d'); fx.drawImage(orig, 0, 0, W, H); fx.drawImage(gc, 0, 0);
  return { canvas: fc, info: { ...info, ok: true } };
}
