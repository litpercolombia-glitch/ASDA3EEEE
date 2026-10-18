// Referencia del producto (18-oct-2026): color y zona de la tela en la foto de la variante del catálogo.
// Sirve para elegir la mejor versión de la IA (color fiel y sin objetos nuevos) y para corregir el color
// de la simulación hacia el color real. Todo en el celular; si algo falla, devuelve null y la app sigue igual.

// sRGB (0–255) → CIELAB (D65)
const lin = (u) => { u /= 255; return u <= 0.04045 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4); };
const LT = new Float32Array(256); for (let i = 0; i < 256; i++) LT[i] = lin(i);
const fl = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
export function lab(r, g, b) {
  const R = LT[r | 0], G = LT[g | 0], B = LT[b | 0];
  const x = fl((0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047), y = fl(0.2126 * R + 0.7152 * G + 0.0722 * B), z = fl((0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
const gam = (u) => { const v = u <= 0.0031308 ? 12.92 * u : 1.055 * Math.pow(u, 1 / 2.4) - 0.055; return Math.min(255, Math.max(0, Math.round(v * 255))); };
const fi = (t) => (t > 0.206893 ? t * t * t : (t - 16 / 116) / 7.787);
export function rgb(L, a, b) {
  const y = (L + 16) / 116, x = a / 500 + y, z = y - b / 200;
  const X = 0.95047 * fi(x), Y = fi(y), Z = 1.08883 * fi(z);
  return [gam(3.2406 * X - 1.5372 * Y - 0.4986 * Z), gam(-0.9689 * X + 1.8758 * Y + 0.0415 * Z), gam(0.0557 * X - 0.204 * Y + 1.057 * Z)];
}
// Distancia de color con la luz pesando la mitad (la luz del cuarto cambia el brillo, no el color de la tela)
export const dist2 = (p, q) => Math.hypot((p[0] - q[0]) / 2, p[1] - q[1], p[2] - q[2]);

// CIEDE2000
export function de00(p, q) {
  const [L1, a1, b1] = p, [L2, a2, b2] = q, rad = Math.PI / 180;
  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cm = (C1 + C2) / 2, G = 0.5 * (1 - Math.sqrt(Cm ** 7 / (Cm ** 7 + 25 ** 7)));
  const a1p = (1 + G) * a1, a2p = (1 + G) * a2, C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
  const h = (a, b) => { if (!a && !b) return 0; const t = Math.atan2(b, a) / rad; return t < 0 ? t + 360 : t; };
  const h1 = h(a1p, b1), h2 = h(a2p, b2), dL = L2 - L1, dC = C2p - C1p;
  let dh = 0; if (C1p * C2p) { dh = h2 - h1; if (dh > 180) dh -= 360; else if (dh < -180) dh += 360; }
  const dH = 2 * Math.sqrt(C1p * C2p) * Math.sin((dh / 2) * rad);
  const Lm = (L1 + L2) / 2, Cpm = (C1p + C2p) / 2;
  let hm = h1 + h2; if (C1p * C2p) { if (Math.abs(h1 - h2) > 180) hm += h1 + h2 < 360 ? 360 : -360; hm /= 2; }
  const T = 1 - 0.17 * Math.cos((hm - 30) * rad) + 0.24 * Math.cos(2 * hm * rad) + 0.32 * Math.cos((3 * hm + 6) * rad) - 0.2 * Math.cos((4 * hm - 63) * rad);
  const SL = 1 + (0.015 * (Lm - 50) ** 2) / Math.sqrt(20 + (Lm - 50) ** 2), SC = 1 + 0.045 * Cpm, SH = 1 + 0.015 * Cpm * T;
  const RT = -2 * Math.sqrt(Cpm ** 7 / (Cpm ** 7 + 25 ** 7)) * Math.sin(60 * Math.exp(-(((hm - 275) / 25) ** 2)) * rad);
  return Math.sqrt((dL / SL) ** 2 + (dC / SC) ** 2 + (dH / SH) ** 2 + RT * (dC / SC) * (dH / SH));
}

const med = (arr) => { const s = [...arr].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : 0; };

// Color con nombre (como lo escriben las tiendas) → Lab aproximado. El orden importa: lo más específico primero.
const NOMBRES = [
  [/vino ?tinto|vinotinto|burdeos|borgo|\bvino\b/, [30, 40, 15]], [/palo (de )?rosa|rosa palo/, [70, 15, 8]], [/fucsia/, [50, 70, -10]],
  [/azul (oscuro|marino|navy)|navy|\bmarino\b/, [20, 8, -30]], [/azul rey/, [35, 30, -70]], [/azul (claro|cielo)|celeste|azul beb/, [75, -8, -22]],
  [/azul petr|petr[oó]leo/, [35, -15, -15]], [/verde (oscuro|botella|bosque)/, [30, -25, 8]], [/verde menta|\bmenta\b/, [85, -25, 5]],
  [/verde (oliva|militar)|\boliva\b/, [50, -8, 30]], [/turques/, [65, -35, -10]], [/mostaza/, [65, 10, 55]], [/terracota/, [50, 35, 35]],
  [/lila|lavanda/, [70, 15, -20]], [/morad|violeta|p[uú]rpura/, [40, 40, -40]], [/rosad|\brosa\b/, [70, 30, 5]],
  [/roj/, [40, 65, 45]], [/naranj/, [60, 45, 60]], [/amarill/, [85, 0, 75]], [/dorad/, [65, 5, 45]],
  [/caf[eé]|marr[oó]n|chocolate|\bcamel\b/, [35, 15, 22]], [/verde/, [50, -40, 25]], [/azul/, [40, 15, -55]],
  [/gris (oscuro|plomo|rat[oó]n)|grafito|carb[oó]n|plomo/, [35, 0, 0]], [/gris claro|perla|platead|plata/, [78, 0, 0]], [/gris/, [60, 0, 0]],
  [/beige|arena/, [78, 3, 15]], [/crema|hueso|marfil/, [90, 0, 12]], [/negr/, [12, 0, 0]], [/blanc/, [95, 0, 2]],
];
const ESTAMPADO = /estampad|reno|estrella|navid|santa|flor|raya|cuadro|[aá]rbol|bast[oó]n|copo|dise[ñn]o|mix|combinad|punto|animal|infantil|coraz[oó]n|letra|\b(y|con)\b|[-/+]/;
// solo la parte antes de «+» (ej. «Cortina gris oscuro + sábana vino tinto» → gris oscuro), igual que el servidor
const primero = (nombre) => String(nombre || '').toLowerCase().split('+')[0];
function objetivo(nombre) {
  const t = primero(nombre);
  for (const [re, l] of NOMBRES) if (re.test(t)) return l;
  return null;
}
const hueDiff = (p, q) => Math.abs(((Math.atan2(p[2], p[1]) - Math.atan2(q[2], q[1])) * 57.2958 + 540) % 360 - 180);

function analyze(im, colorName) {
  const tgt = objetivo(colorName); if (!tgt) return null; // sin color reconocible no se adivina
  const W = 200, H = Math.max(40, Math.round((W * (im.naturalHeight || im.height)) / (im.naturalWidth || im.width)));
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0, W, H);
  const d = x.getImageData(0, 0, W, H).data;
  // sin la franja de arriba (allí suelen ir textos y sellos de la tienda) ni los bordes
  const x0 = Math.round(W * 0.04), x1 = Math.round(W * 0.96), y0 = Math.round(H * 0.16), y1 = Math.round(H * 0.98);
  const Ct = Math.hypot(tgt[1], tgt[2]), cromatico = Ct >= 12, S = [], P = [];
  let tot = 0;
  for (let yy = y0; yy < y1; yy += 2) for (let xx = x0; xx < x1; xx += 2) {
    const j = (yy * W + xx) * 4, p = lab(d[j], d[j + 1], d[j + 2]); tot++;
    const C = Math.hypot(p[1], p[2]);
    const es = cromatico ? C >= Math.max(6, 0.5 * Ct) && hueDiff(p, tgt) <= 22 && Math.abs(p[0] - tgt[0]) < 40 : C < 12 && Math.abs(p[0] - tgt[0]) < 18;
    if (es) { S.push(p); P.push(xx, yy); }
  }
  if (S.length < 0.04 * tot) return null;
  const ref = [med(S.map((p) => p[0])), med(S.map((p) => p[1])), med(S.map((p) => p[2]))];
  // zona de la tela: rejilla de 20×20; celdas con ≥ 60 % de tela; el bloque conectado más grande (así no entran cabecero, base ni muebles)
  const N = 20, cw = W / N, chh = H / N, hit = new Float32Array(N * N), cnt = new Float32Array(N * N);
  for (let yy = y0; yy < y1; yy += 2) for (let xx = x0; xx < x1; xx += 2) cnt[Math.min(N - 1, (yy / chh) | 0) * N + Math.min(N - 1, (xx / cw) | 0)]++;
  for (let i = 0; i < P.length; i += 2) hit[Math.min(N - 1, (P[i + 1] / chh) | 0) * N + Math.min(N - 1, (P[i] / cw) | 0)]++;
  const on = Array.from({ length: N * N }, (_, i) => cnt[i] > 0 && hit[i] / cnt[i] >= 0.6), seen = new Uint8Array(N * N);
  let best = null;
  for (let i = 0; i < N * N; i++) {
    if (!on[i] || seen[i]) continue;
    const st = [i]; seen[i] = 1; let n = 0, cx0 = N, cy0 = N, cx1 = -1, cy1 = -1;
    while (st.length) {
      const c = st.pop(), cx = c % N, cy = (c / N) | 0; n++;
      cx0 = Math.min(cx0, cx); cy0 = Math.min(cy0, cy); cx1 = Math.max(cx1, cx); cy1 = Math.max(cy1, cy);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy, k = ny * N + nx; if (nx >= 0 && ny >= 0 && nx < N && ny < N && on[k] && !seen[k]) { seen[k] = 1; st.push(k); } }
    }
    if (!best || n > best.n) best = { n, cx0, cy0, cx1, cy1 };
  }
  let box = best && best.n >= 8 ? [best.cx0 / N, best.cy0 / N, (best.cx1 + 1) / N, (best.cy1 + 1) / N] : null;
  // tela lisa: el rectángulo más grande hecho solo de celdas de tela (así el recorte no lleva cabecero, base ni muebles)
  const solidName = !ESTAMPADO.test(primero(colorName).trim());
  if (box && solidName) {
    const hgt = new Array(N).fill(0); let mr = null;
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) hgt[x] = on[y * N + x] ? hgt[x] + 1 : 0;
      for (let x = 0; x < N; x++) { let hmin = N; for (let x2 = x; x2 < N && hgt[x2]; x2++) { hmin = Math.min(hmin, hgt[x2]); const a = hmin * (x2 - x + 1); if (!mr || a > mr.a) mr = { a, x0: x, x1: x2, y1: y, y0: y - hmin + 1 }; } }
    }
    if (mr && mr.a >= 0.12 * N * N) box = [mr.x0 / N, mr.y0 / N, (mr.x1 + 1) / N, (mr.y1 + 1) / N];
  }
  if (box) box = box.map((v) => +v.toFixed(3));
  const solid = solidName;
  const [r, g, b] = rgb(...ref);
  return { lab: ref.map((v) => +v.toFixed(1)), hex: '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join(''), solid, share: +(S.length / tot).toFixed(2), box, palette: [ref.map((v) => +v.toFixed(1))] };
}

const cache = new Map();
/** Color y zona de la tela de la foto de una variante. @returns {Promise<null|{lab:number[],hex:string,solid:boolean,share:number,box:number[]|null,palette:number[][]}>} */
export function refInfo(url, colorName = '') {
  if (!url) return Promise.resolve(null);
  const k = url + '|' + colorName;
  if (!cache.has(k)) cache.set(k, new Promise((res) => {
    const im = new Image(); im.crossOrigin = 'anonymous'; im.decoding = 'async';
    const t = setTimeout(() => res(null), 6000);
    im.onload = () => { clearTimeout(t); try { res(analyze(im, colorName)); } catch { res(null); } };
    im.onerror = () => { clearTimeout(t); res(null); };
    im.src = url.startsWith('data:') ? url : url + (url.includes('?') ? '&' : '?') + 'width=200';
  }));
  return cache.get(k);
}
