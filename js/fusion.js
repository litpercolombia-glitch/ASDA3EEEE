// Fusión fiel (17-oct-2026): conserva los píxeles reales de la foto del cliente y usa la imagen de la IA
// solo donde cambió el producto. Así no cambian la cara, el cuarto, el piso ni la luz.
// Pasos: alinear (escala + desplazamiento) → igualar color → máscara por histéresis (la costura cae donde
// ambas fotos coinciden) → compuertas de calidad → mezcla suave a resolución completa.
// Si alguna compuerta falla, devuelve null y la app muestra la imagen de la IA tal cual.
// v4.5 (18-oct-2026): con la referencia del producto (color y paleta de la tela del catálogo) mide si la zona que
// cambió es el producto o un objeto nuevo (p. ej. un cabecero copiado) y corrige el color de la tela hacia el real.
// v4.8 (18-oct-2026): mide si la IA trajo un mueble de la foto del catálogo encima de la tela (el cabecero copiado);
// la app descarta esa versión al elegir entre las 2.
import { lab, rgb, dist2, de00 } from './ref.js';

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

// Tabla de corrección de color (33³, en deltas para no posterizar): mueve los colores cercanos a la tela generada
// hacia el color del catálogo. El peso cae suave con la distancia, así lo que no es la tela no cambia.
function lutColor(ref, corr) {
  const hz = (q) => Math.atan2(q[2], q[1]), Cz = (q) => Math.hypot(q[1], q[2]);
  let dh = hz(ref.lab) - hz(corr); if (dh > Math.PI) dh -= 2 * Math.PI; if (dh < -Math.PI) dh += 2 * Math.PI;
  dh = Math.max(-0.44, Math.min(0.44, dh)); // ±25°
  // croma esperada con la luz del cuarto: en un cuarto más oscuro la tela también se ve menos saturada
  const cEsp = Cz(ref.lab) * Math.sqrt(Math.min(1, (corr[0] + 10) / (ref.lab[0] + 10)));
  const kC = Math.max(0.85, Math.min(1.4, cEsp / Math.max(1, Cz(corr)))), dL = Math.max(-8, Math.min(8, 0.35 * (ref.lab[0] - corr[0])));
  const N = 33, st = 255 / (N - 1), lut = new Int16Array(N * N * N * 3);
  for (let r = 0; r < N; r++) for (let g2 = 0; g2 < N; g2++) for (let b = 0; b < N; b++) {
    const R = r * st, G2 = g2 * st, B = b * st, p = lab(R, G2, B), dd = dist2(p, corr);
    const t = dd <= 16 ? 1 : dd >= 30 ? 0 : (30 - dd) / 14, wgt = t * t * (3 - 2 * t);
    if (!wgt) continue;
    const C = Cz(p) * (1 + (kC - 1) * wgt), hh = hz(p) + dh * wgt, q = rgb(p[0] + dL * wgt, C * Math.cos(hh), C * Math.sin(hh));
    const o2 = ((r * N + g2) * N + b) * 3; lut[o2] = q[0] - R; lut[o2 + 1] = q[1] - G2; lut[o2 + 2] = q[2] - B;
  }
  return { lut, N, st, info: { dh: +(dh * 57.2958).toFixed(1), kC: +kC.toFixed(2), dL: +dL.toFixed(1) } };
}
function aplicarLut(px, { lut, N, st }) {
  for (let i = 0; i < px.length; i += 4) {
    const o2 = ((Math.round(px[i] / st) * N + Math.round(px[i + 1] / st)) * N + Math.round(px[i + 2] / st)) * 3;
    if (lut[o2] | lut[o2 + 1] | lut[o2 + 2]) { px[i] += lut[o2]; px[i + 1] += lut[o2 + 1]; px[i + 2] += lut[o2 + 2]; }
  }
}
// Cuando la fusión no entra y se muestra la imagen de la IA tal cual: igual se corrige el color de la tela
export function corregir(gen, ref) {
  if (!ref?.solid) return null;
  const W = gen.naturalWidth || gen.width, H = gen.naturalHeight || gen.height, s = L / Math.max(W, H), w = Math.round(W * s), h = Math.round(H * s);
  const g = pixels(gen, w, h), Ls = [], As = [], Bs = [];
  const hue = (q) => Math.atan2(q[2], q[1]) * 57.2958, cr = (q) => Math.hypot(q[1], q[2]);
  for (let i = 0; i < w * h; i++) {
    const p = lab(g[i * 3], g[i * 3 + 1], g[i * 3 + 2]);
    const fam = dist2(p, ref.lab) < 22 || (cr(p) > 12 && cr(ref.lab) > 12 && Math.abs(((hue(p) - hue(ref.lab) + 540) % 360) - 180) < 22);
    if (fam && p[0] > 12) { Ls.push(p[0]); As.push(p[1]); Bs.push(p[2]); }
  }
  if (Ls.length < 0.03 * w * h) return null;
  const md = (a) => a.sort((x, y) => x - y)[a.length >> 1], corr = [md(Ls), md(As), md(Bs)], dE = de00(corr, ref.lab);
  if (dE <= 4) return null;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(gen, 0, 0, W, H);
  const id = x.getImageData(0, 0, W, H), t = lutColor(ref, corr); aplicarLut(id.data, t); x.putImageData(id, 0, 0);
  return { canvas: c, info: { dE: +dE.toFixed(1), color: t.info } };
}

// 5c) ¿La IA trajo un mueble de la foto del catálogo (p. ej. su cabecero)? Mira justo encima de la tela, donde está el
// cabecero de la cama del cliente, y busca lo que cambió sin parecerse a la tela. Cada píxel se compara con la foto real
// a ±4 px, así un leve corrimiento de la IA o un tamaño de foto distinto no cuentan.
// - cob (decide): parte del ancho de la tela que tiene, justo encima, un tramo vertical de cambio de 4 px o más. Un cabecero
//   copiado cubre casi todo el ancho aunque las almohadas tapen la mayor parte; los bordes de las almohadas dan 1–2 px.
// - arriba (solo métrica): parte de la franja de arriba (18 % del alto) que es nueva, sin líneas finas.
// v4.10 (18-oct-2026), con 25 salidas reales etiquetadas del 17-oct a tamaño igual y al doble (test/t_cabecero410.py): cabeceros
// copiados lisos cob 0,27–0,67 y colcha estampada 0,18–0,21; versiones limpias 0–0,12. Límite conocido: en telas claras
// (blanco, gris claro, beige) un cabecero gris se parece a la tela y no se ve (auditoría 7, R7-M1).
function encima(o, LG, tela, m, w, h) {
  const n = w * h, F = new Uint8Array(n); let nf = 0;
  for (let i = 0; i < n; i++) if (m[i] && tela[i]) { F[i] = 1; nf++; }
  if (nf < 0.02 * n) return null;
  const B = Math.round(0.18 * h), VEN = Math.round(0.12 * h), cerca3 = morph(tela, w, h, 3, true), cerca1 = morph(tela, w, h, 1, true);
  const band = new Uint8Array(n), top = new Int32Array(w).fill(-1);
  for (let x = 0; x < w; x++) {
    let c = 0; for (let y = 0; y < h; y++) c += F[y * w + x];
    if (c < 0.04 * h) continue;
    for (let y = 0; y + 2 < h; y++) if (F[y * w + x] && F[(y + 1) * w + x] && F[(y + 2) * w + x]) { top[x] = y; break; }
    for (let y = Math.max(0, top[x] - B); y < top[x] - 3; y++) if (!cerca3[y * w + x]) band[y * w + x] = 1;
  }
  const zona = morph(band, w, h, 2, true); // la franja con margen para la apertura, más la ventana justo encima de la tela
  for (let x = 0; x < w; x++) if (top[x] > 0) for (let y = Math.max(0, top[x] - VEN); y < top[x]; y++) zona[y * w + x] = 1;
  const R = 4, alrededor = morph(zona, w, h, R, true), LO = new Float32Array(n * 3); // ±4 px: aguanta un leve reencuadre de la IA y otro tamaño de foto
  for (let i = 0; i < n; i++) if (alrededor[i]) { const p = lab(o[i * 3], o[i * 3 + 1], o[i * 3 + 2]); LO[i * 3] = p[0]; LO[i * 3 + 1] = p[1]; LO[i * 3 + 2] = p[2]; }
  const ch = new Uint8Array(n);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; if (!zona[i] || tela[i]) continue;
    const L = LG[i * 3], a = LG[i * 3 + 1], b = LG[i * 3 + 2]; let best = 1e9;
    for (let dy = -R; dy <= R && best > 1; dy++) {
      const yy = y + dy; if (yy < 0 || yy >= h) continue;
      for (let dx = -R; dx <= R; dx++) {
        const xx = x + dx; if (xx < 0 || xx >= w) continue;
        const j = (yy * w + xx) * 3, s = Math.max(Math.hypot(a - LO[j + 1], b - LO[j + 2]) / 7, Math.abs(L - LO[j]) / 14);
        if (s < best) { best = s; if (best <= 1) break; }
      }
    }
    if (best > 1) ch[i] = 1;
  }
  const op = morph(morph(ch, w, h, 2, false), w, h, 2, true);
  let k = 0, nb = 0; for (let i = 0; i < n; i++) { nb += band[i]; if (op[i] && band[i]) k++; }
  let cols = 0, con = 0;
  for (let x = 0; x < w; x++) {
    if (top[x] < 0) continue; cols++;
    let run = 0, best = 0;
    for (let y = top[x] - 2; y >= Math.max(0, top[x] - VEN); y--) { const i = y * w + x; if (ch[i] && !cerca1[i]) { if (++run > best) best = run; } else run = 0; }
    if (best >= 4) con++;
  }
  return { arriba: nb ? +(k / nb).toFixed(3) : 0, cob: cols ? +(con / cols).toFixed(3) : 0 };
}

// Colores de un estampado sacados de la misma tela generada (debajo de su borde de arriba): k-medias en Lab
function paletaDe(LG, m, telaN, w, h) {
  const S = [];
  for (let x = 0; x < w; x += 2) {
    let c = 0; for (let y = 0; y < h; y++) c += telaN[y * w + x];
    if (c < 0.04 * h) continue;
    let top = -1; for (let y = 0; y + 2 < h; y++) if (telaN[y * w + x] && telaN[(y + 1) * w + x] && telaN[(y + 2) * w + x]) { top = y; break; }
    if (top < 0) continue;
    for (let y = top + 3; y < Math.min(h, top + Math.round(0.3 * h)); y += 2) { const i = y * w + x; if (m[i]) S.push([LG[i * 3], LG[i * 3 + 1], LG[i * 3 + 2]]); }
  }
  if (S.length < 60) return [];
  const cen = [S[0].slice()];
  while (cen.length < 6) { let bi = 0, bd = -1; for (let j = 0; j < S.length; j += 3) { let d = 1e9; for (const c of cen) d = Math.min(d, dist2(S[j], c)); if (d > bd) { bd = d; bi = j; } } cen.push(S[bi].slice()); }
  const cnt = new Array(6).fill(0);
  for (let it = 0; it < 8; it++) {
    const acc = cen.map(() => [0, 0, 0, 0]); cnt.fill(0);
    for (const p of S) { let bj = 0, bd = 1e9; cen.forEach((c, j) => { const d = dist2(p, c); if (d < bd) { bd = d; bj = j; } }); const a2 = acc[bj]; a2[0] += p[0]; a2[1] += p[1]; a2[2] += p[2]; a2[3]++; cnt[bj]++; }
    acc.forEach((a2, j) => { if (a2[3]) cen[j] = [a2[0] / a2[3], a2[1] / a2[3], a2[2] / a2[3]]; });
  }
  return cen.filter((_, j) => cnt[j] >= 0.05 * S.length);
}

/**
 * @param {HTMLCanvasElement|HTMLImageElement} orig foto del cliente (ya recortada al encuadre de la IA)
 * @param {HTMLImageElement} gen imagen de la IA
 * @param {object|null} ref color y zona de la tela de la variante (ref.js)
 * @param {{cama?: boolean}} opts cama: producto de cama (protector, sábanas, edredón, cobija, almohada)
 * @returns {{canvas: HTMLCanvasElement, info: object} | {canvas: null, info: object}}
 */
export function fuse(orig, gen, ref = null, opts = {}) {
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

  // 5b) ¿lo que cambió es el producto o algo nuevo? (con el color de la tela del catálogo)
  let corr = null;
  if (ref && ref.palette?.length && (ref.solid || opts.cama)) { // estampados: solo la medida de muebles copiados, y solo en camas
    const cl = (v) => (v < 0 ? 0 : v > 255 ? 255 : v), hue = (q) => Math.atan2(q[2], q[1]) * 57.2958, cr = (q) => Math.hypot(q[1], q[2]);
    const dTono = (p, q) => Math.abs(((hue(p) - hue(q) + 540) % 360) - 180);
    const mismaFamilia = (p) => ref.palette.some((q) => dist2(p, q) < 22 || (cr(p) > 12 && cr(q) > 12 && dTono(p, q) < 22));
    // parecido a la tela, para la medida de arriba: tono a ±40° (la sombra y el brillo lo corren) con una croma parecida
    // (la madera tiene la mitad de croma que una tela roja y el doble que una beige); en telas sin color, una luz parecida
    const pareceTela = (p) => ref.palette.some((q) => cr(q) > 12 ? dTono(p, q) <= 40 && cr(p) >= 0.6 * cr(q) && cr(p) <= 1.4 * cr(q) + 6 : cr(p) <= 12 && Math.abs(p[0] - q[0]) <= 25);
    const LG = new Float32Array(n * 3), fab = new Uint8Array(n), tela = new Uint8Array(n); // color de la IA (ya igualado) en Lab
    for (let i = 0; i < n; i++) {
      const p = lab(cl(g[i * 3] * A[0][0] + A[0][1]), cl(g[i * 3 + 1] * A[1][0] + A[1][1]), cl(g[i * 3 + 2] * A[2][0] + A[2][1]));
      LG[i * 3] = p[0]; LG[i * 3 + 1] = p[1]; LG[i * 3 + 2] = p[2]; fab[i] = mismaFamilia(p) ? 1 : 0; tela[i] = pareceTela(p) ? 1 : 0;
    }
    const prod = {};
    if (ref.solid) {
      let cnt = 0, pl = 0, nw = 0; const Ls = [], As = [], Bs = [];
      for (let i = 0; i < n; i++) {
        if (!m[i]) continue; cnt++;
        const p = [LG[i * 3], LG[i * 3 + 1], LG[i * 3 + 2]];
        if (fab[i]) { pl++; if (dist2(p, ref.lab) < 34 && p[0] > 12) { Ls.push(p[0]); As.push(p[1]); Bs.push(p[2]); } }
        else if (d[i] > ts && p[0] > 25 && p[0] < 92) nw++;
      }
      if (cnt) {
        prod.frac = +(pl / cnt).toFixed(3); prod.nuevo = +(nw / cnt).toFixed(3);
        if (Ls.length > 30) {
          const md = (a) => a.sort((x, y) => x - y)[a.length >> 1], mlab = [md(Ls), md(As), md(Bs)];
          prod.dE = +de00(mlab, ref.lab).toFixed(1); corr = mlab;
        }
      }
    } else { // estampado de cama: además del color nombrado, cuentan como tela los colores del diseño que la IA puso en la cama
      const telaN = new Uint8Array(n); for (let i = 0; i < n; i++) telaN[i] = m[i] && tela[i] ? 1 : 0;
      const pal = paletaDe(LG, m, telaN, w, h);
      if (pal.length) for (let i = 0; i < n; i++) if (!tela[i]) { const p = [LG[i * 3], LG[i * 3 + 1], LG[i * 3 + 2]]; if (pal.some((c) => dist2(p, c) < 14)) tela[i] = 1; }
      prod.paleta = pal.length;
    }
    const enc = encima(o, LG, tela, m, w, h);
    if (enc) { prod.arriba = enc.arriba; prod.cob = enc.cob; if (!ref.solid) prod.est = 1; }
    const q0 = ref.palette[0]; if (ref.solid && (cr(q0) <= 12 ? q0[0] > 55 : q0[0] > 60 && cr(q0) < 25)) prod.clara = 1; // tela clara: la medida no ve un cabecero gris
    if (Object.keys(prod).length) info.prod = prod;
  }

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
  // 8b) color de la tela hacia el del catálogo: tono y croma casi completos, luz solo en parte (respeta la luz del cuarto)
  if (corr && info.prod.dE > 4) { const t = lutColor(ref, corr); aplicarLut(px, t); info.color = t.info; }
  gx.putImageData(id, 0, 0);
  gx.globalCompositeOperation = 'destination-in'; gx.imageSmoothingQuality = 'high'; gx.drawImage(mc, 0, 0, W, H);
  const fc = document.createElement('canvas'); fc.width = W; fc.height = H;
  const fx = fc.getContext('2d'); fx.drawImage(orig, 0, 0, W, H); fx.drawImage(gc, 0, 0);
  return { canvas: fc, info: { ...info, ok: true } };
}
