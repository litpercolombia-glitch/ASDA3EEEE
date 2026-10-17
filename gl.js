// Motor de render del probador: cámara + prendas deformadas por la pose (WebGL2).
// Técnica: malla densa sobre la prenda, deformada con Thin-Plate Spline (TPS)
// desde puntos de control de la prenda hacia puntos del cuerpo detectados.
// El sombreado usa la luz real del video (pliegues y sombras del cuerpo).

const VS_BG = `#version 300 es
in vec2 p; out vec2 uv; uniform vec4 crop; uniform float mir;
void main(){ vec2 t = vec2(p.x, -p.y)*0.5+0.5; t.x = mix(t.x, 1.-t.x, mir); uv = crop.xy + t*crop.zw; gl_Position = vec4(p,0.,1.); }`;
const FS_BG = `#version 300 es
precision mediump float; in vec2 uv; out vec4 o; uniform sampler2D cam;
void main(){ o = texture(cam, uv); }`;
const VS_G = `#version 300 es
in vec2 pos; in vec2 tuv; out vec2 uv; out vec2 scr; uniform vec2 res;
void main(){ uv = tuv; vec2 c = pos/res*2.-1.; c.y = -c.y; scr = pos/res; gl_Position = vec4(c,0.,1.); }`;
const FS_G = `#version 300 es
precision mediump float; in vec2 uv; in vec2 scr; out vec4 o;
uniform sampler2D tex; uniform sampler2D cam; uniform vec4 crop; uniform float shade; uniform float mean; uniform float alpha; uniform float mir;
void main(){
  vec4 g = texture(tex, uv); if (g.a < .03) discard;
  vec2 t = vec2(mix(scr.x, 1.-scr.x, mir), scr.y); vec3 c = texture(cam, crop.xy + t*crop.zw).rgb;
  float l = dot(c, vec3(.299,.587,.114));
  float s = clamp(pow(l/max(mean,.05), .8), .5, 1.3);
  vec3 rgb = g.rgb * mix(1., s, shade);
  float edge = smoothstep(0., .1, min(min(uv.x,1.-uv.x), min(uv.y,1.-uv.y))*8.);
  o = vec4(rgb, g.a*alpha*edge);
}`;

function sh(gl, type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
function prog(gl, vs, fs) { const p = gl.createProgram(); gl.attachShader(p, sh(gl, gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl, gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p; }

/* ---------- Thin-Plate Spline ---------- */
function solve(A, b) { // Gauss con pivoteo
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]]; const d = M[c][c] || 1e-9;
    for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / d; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  return M.map((r, i) => r[n] / (M[i][i] || 1e-9));
}
const U = (r2) => (r2 < 1e-12 ? 0 : r2 * Math.log(r2));
export function tps(src, dst, lambda = 0.0006) {
  const n = src.length, N = n + 3, K = [];
  for (let i = 0; i < N; i++) K.push(new Array(N).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) { const dx = src[i][0] - src[j][0], dy = src[i][1] - src[j][1]; K[i][j] = U(dx * dx + dy * dy) + (i === j ? lambda : 0); }
    K[i][n] = K[n][i] = 1; K[i][n + 1] = K[n + 1][i] = src[i][0]; K[i][n + 2] = K[n + 2][i] = src[i][1];
  }
  const bx = [...dst.map((d) => d[0]), 0, 0, 0], by = [...dst.map((d) => d[1]), 0, 0, 0];
  const wx = solve(K, bx), wy = solve(K, by);
  return (x, y) => {
    let X = wx[n] + wx[n + 1] * x + wx[n + 2] * y, Y = wy[n] + wy[n + 1] * x + wy[n + 2] * y;
    for (let i = 0; i < n; i++) { const dx = x - src[i][0], dy = y - src[i][1], u = U(dx * dx + dy * dy); X += wx[i] * u; Y += wy[i] * u; }
    return [X, Y];
  };
}
export function similarity(a0, a1, b0, b1) { // mapea segmento a0-a1 sobre b0-b1
  const ax = a1[0] - a0[0], ay = a1[1] - a0[1], bx = b1[0] - b0[0], by = b1[1] - b0[1];
  const la = Math.hypot(ax, ay) || 1, s = Math.hypot(bx, by) / la, r = Math.atan2(by, bx) - Math.atan2(ay, ax);
  const c = Math.cos(r) * s, si = Math.sin(r) * s;
  return (x, y) => { const dx = x - a0[0], dy = y - a0[1]; return [b0[0] + c * dx - si * dy, b0[1] + si * dx + c * dy]; };
}

/* ---------- Renderer ---------- */
export class Stage {
  constructor(canvas) {
    const gl = canvas.getContext('webgl2', { premultipliedAlpha: false, preserveDrawingBuffer: true, alpha: false });
    if (!gl) throw new Error('webgl2');
    this.gl = gl; this.cv = canvas;
    this.pBg = prog(gl, VS_BG, FS_BG); this.pG = prog(gl, VS_G, FS_G);
    this.quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    this.camTex = this.tex(); this.meshes = new Map(); this.crop = [0, 0, 1, 1];
    this.vbo = gl.createBuffer(); this.uvbo = gl.createBuffer(); this.ibo = gl.createBuffer();
  }
  tex() { const gl = this.gl, t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t; }
  upload(t, src) { const gl = this.gl; gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src); }
  garmentTex(key, img) { if (!this.meshes.has(key)) { const t = this.tex(); this.upload(t, img); this.meshes.set(key, t); } return this.meshes.get(key); }
  // Ajusta el lienzo al contenedor y recorta la fuente tipo "cover"
  layout(srcW, srcH) {
    const r = this.cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    const W = Math.round(r.width * dpr), H = Math.round(r.height * dpr);
    if (this.cv.width !== W || this.cv.height !== H) { this.cv.width = W; this.cv.height = H; }
    const sa = srcW / srcH, da = W / H;
    let cw = 1, ch = 1; if (sa > da) cw = da / sa; else ch = sa / da;
    this.crop = [(1 - cw) / 2, (1 - ch) / 2, cw, ch];
    this.srcW = srcW; this.srcH = srcH; this.W = W; this.H = H;
    return this;
  }
  // convierte coordenadas normalizadas de la fuente (0..1) a píxeles del lienzo
  toScreen(nx, ny) { const [x0, y0, cw, ch] = this.crop; if (this.mirror) nx = 1 - nx; const sx = this.mirror ? ((nx - (1 - x0 - cw)) / cw) : ((nx - x0) / cw); return [sx * this.W, ((ny - y0) / ch) * this.H]; }
  begin(src) {
    const gl = this.gl; this.upload(this.camTex, src);
    gl.viewport(0, 0, this.W, this.H); gl.disable(gl.BLEND);
    gl.useProgram(this.pBg); gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    const loc = gl.getAttribLocation(this.pBg, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.uniform4fv(gl.getUniformLocation(this.pBg, 'crop'), this.crop); gl.uniform1f(gl.getUniformLocation(this.pBg, 'mir'), this.mirror ? 1 : 0);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.camTex); gl.uniform1i(gl.getUniformLocation(this.pBg, 'cam'), 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); gl.disableVertexAttribArray(loc);
  }
  // dibuja una prenda: map(xImg,yImg)->[xPantalla,yPantalla] en píxeles del lienzo
  garment(texKey, img, map, opt = {}) {
    const gl = this.gl, cols = opt.cols || 22, rows = opt.rows || 26, iw = img.width, ih = img.height;
    const pos = new Float32Array((cols + 1) * (rows + 1) * 2), uv = new Float32Array(pos.length);
    let k = 0;
    for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) {
      const u = i / cols, v = j / rows, [x, y] = map(u * iw, v * ih);
      pos[k] = x; pos[k + 1] = y; uv[k] = u; uv[k + 1] = v; k += 2;
    }
    const idx = new Uint16Array(cols * rows * 6); k = 0;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const a = j * (cols + 1) + i, b = a + 1, c = a + cols + 1, d = c + 1; idx.set([a, b, c, b, d, c], k); k += 6; }
    gl.useProgram(this.pG); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    const lp = gl.getAttribLocation(this.pG, 'pos'), lu = gl.getAttribLocation(this.pG, 'tuv');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo); gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvbo); gl.bufferData(gl.ARRAY_BUFFER, uv, gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(lu); gl.vertexAttribPointer(lu, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.DYNAMIC_DRAW);
    const U_ = (n) => gl.getUniformLocation(this.pG, n);
    gl.uniform2f(U_('res'), this.W, this.H);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.garmentTex(texKey, img)); gl.uniform1i(U_('tex'), 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.camTex); gl.uniform1i(U_('cam'), 1);
    gl.uniform4fv(U_('crop'), this.crop); gl.uniform1f(U_('mir'), this.mirror ? 1 : 0); gl.uniform1f(U_('shade'), opt.shade ?? 0.85); gl.uniform1f(U_('mean'), opt.mean ?? 0.5); gl.uniform1f(U_('alpha'), opt.alpha ?? 1);
    gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
    gl.disableVertexAttribArray(lp); gl.disableVertexAttribArray(lu);
  }
}

/* ---------- Plantillas automáticas: lee la silueta de la prenda ---------- */
export function analyzeGarment(img) {
  const c = document.createElement('canvas'), W = 160, H = Math.round((160 * img.height) / img.width);
  c.width = W; c.height = H; const x = c.getContext('2d'); x.drawImage(img, 0, 0, W, H);
  let d; try { d = x.getImageData(0, 0, W, H).data; } catch { return null; }
  const on = (i, j) => d[(j * W + i) * 4 + 3] > 60;
  const row = (j) => { let a = -1, b = -1; for (let i = 0; i < W; i++) if (on(i, j)) { if (a < 0) a = i; b = i; } return [a, b]; };
  const runs = (j) => { const r = []; let s = -1; for (let i = 0; i <= W; i++) { const v = i < W && on(i, j); if (v && s < 0) s = i; if (!v && s >= 0) { r.push([s, i - 1]); s = -1; } } return r; };
  let top = 0, bot = H - 1; while (top < H && row(top)[0] < 0) top++; while (bot > 0 && row(bot)[0] < 0) bot--;
  const at = (f) => Math.round(top + (bot - top) * f), sx = img.width / W, sy = img.height / H;
  return { W, H, top, bot, row, runs, at, sx, sy };
}
export function templateFor(kind, img) {
  const A = analyzeGarment(img), w = img.width, h = img.height;
  if (!A) return null;
  const P = (i, j) => [i * A.sx, j * A.sy];
  if (kind === 'superior' || kind === 'completo') {
    const jt = A.at(kind === 'completo' ? 0.4 : 0.72), [tl, tr] = A.row(jt); // torso bajo las mangas
    const js = A.at(0.06); let [sl, sr] = A.row(js);
    // punta de mangas: el píxel más externo entre 5% y 50% de alto
    let ml = [w, 0], mr = [0, 0];
    for (let j = A.at(0.05); j <= A.at(0.5); j++) { const [a, b] = A.row(j); if (a >= 0 && a * A.sx < ml[0]) ml = P(a, j); if (b >= 0 && b * A.sx > mr[0]) mr = P(b, j); }
    const shoulderY = A.at(0.08) * A.sy, hemY = A.bot * A.sy;
    const tlx = tl * A.sx, trx = tr * A.sx;
    const sleeveLong = ml[1] > A.at(0.55) * A.sy;
    // axilas: primera fila (bajando) donde ya no hay manga por fuera del torso
    let ja = A.at(0.12); while (ja < A.at(0.6)) { const [a, b] = A.row(ja); if (a >= tl - 2 && b <= tr + 2) break; ja++; }
    const armY = ja * A.sy;
    return {
      kind, sleeveLong,
      pts: {
        shL: [tlx, shoulderY], shR: [trx, shoulderY],
        neck: [(tlx + trx) / 2, A.top * A.sy],
        slL: ml, slR: mr, axL: [tlx, armY], axR: [trx, armY],
        hipL: [tlx, A.at(kind === 'completo' ? 0.42 : 0.78) * A.sy], hipR: [trx, A.at(kind === 'completo' ? 0.42 : 0.78) * A.sy],
        hemL: [tlx, hemY], hemR: [trx, hemY], hemC: [(tlx + trx) / 2, hemY],
      },
    };
  }
  if (kind === 'inferior') {
    const [wl, wr] = A.row(A.at(0.02));
    const legs = (f) => { const r = A.runs(A.at(f)); if (r.length >= 2) return [P((r[0][0] + r[0][1]) / 2, A.at(f)), P((r[r.length - 1][0] + r[r.length - 1][1]) / 2, A.at(f))]; const [a, b] = A.row(A.at(f)); return [P(a + (b - a) * 0.25, A.at(f)), P(a + (b - a) * 0.75, A.at(f))]; };
    const [kl, kr] = legs(0.52), [al, ar] = legs(0.97);
    return { kind, pts: { wL: P(wl, A.at(0.02)), wR: P(wr, A.at(0.02)), cr: P((wl + wr) / 2, A.at(0.3)), kL: kl, kR: kr, aL: al, aR: ar } };
  }
  if (kind === 'zapatos') { const [a, b] = A.row(A.at(0.95)); return { kind, pts: { heel: P(a, A.at(0.95)), toe: P(b, A.at(0.95)) } }; }
  if (kind === 'gafas') { const r = A.runs(A.at(0.55)); const L = r[0] || [w * 0.2 / A.sx, 0], R = r[r.length - 1] || [w * 0.8 / A.sx, 0]; return { kind, pts: { eL: P((L[0] + L[1]) / 2, A.at(0.55)), eR: P((R[0] + R[1]) / 2, A.at(0.55)) } }; }
  if (kind === 'gorra') return { kind, pts: { l: [0.08 * w, 0.92 * h], r: [0.92 * w, 0.92 * h] } };
  return null;
}

// Construye el mapeo prenda->pantalla a partir de landmarks (en píxeles del lienzo)
export function mapping(tpl, L, opt = {}) {
  const k = opt.scale ?? 1, oy = opt.offsetY ?? 0, p = tpl.pts;
  const add = (a, b, f = 1) => [a[0] + b[0] * f, a[1] + b[1] * f], sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const out = (a, b, f) => { const v = sub(a, b); return add(a, v, f); }; // empuja a lejos de b
  const S = (q) => [q[0], q[1] + oy];
  if (tpl.kind === 'superior' || tpl.kind === 'completo') {
    // lado de la prenda "izquierda de la imagen" -> hombro del lado izquierdo en pantalla
    const [A_, B_] = L.sh0[0] <= L.sh1[0] ? ['0', '1'] : ['1', '0'];
    const sh = { l: L['sh' + A_], r: L['sh' + B_] }, el = { l: L['el' + A_], r: L['el' + B_] }, wr = { l: L['wr' + A_], r: L['wr' + B_] }, hp = { l: L['hp' + A_], r: L['hp' + B_] }, kn = { l: L['kn' + A_], r: L['kn' + B_] };
    const swv = sub(sh.r, sh.l), swr = Math.hypot(...swv) || 1, sw = swr * k, mid = lerp(sh.l, sh.r, 0.5);
    const ux = [swv[0] / swr, swv[1] / swr]; // eje de hombros (izq->der en pantalla)
    let upv = [ux[1], -ux[0]]; if (upv[1] > 0) upv = [-upv[0], -upv[1]]; // perpendicular hacia arriba
    const at = (base, along, up) => [base[0] + ux[0] * along + upv[0] * up, base[1] + ux[1] * along + upv[1] * up];
    const shL = at(sh.l, -0.13 * sw, 0.13 * sw), shR = at(sh.r, 0.13 * sw, 0.13 * sw);
    const neck = at(mid, 0, 0.36 * sw);
    const axL = at(sh.l, 0.02 * sw, -0.42 * sw), axR = at(sh.r, -0.02 * sw, -0.42 * sw);
    const hipL = out(hp.l, hp.r, 0.42 * k), hipR = out(hp.r, hp.l, 0.42 * k);
    const torso = Math.hypot(...sub(lerp(hp.l, hp.r, .5), mid));
    const hemL = tpl.kind === 'completo' ? out(kn.l, kn.r, 0.6 * k) : add(hipL, [0, torso * 0.2]);
    const hemR = tpl.kind === 'completo' ? out(kn.r, kn.l, 0.6 * k) : add(hipR, [0, torso * 0.2]);
    // punta exterior de la manga: a lo largo del brazo y hacia afuera del cuerpo
    const sleeve = (s0, e0, w0, side) => {
      const target = tpl.sleeveLong ? w0 : lerp(s0, e0, 0.55);
      const v = sub(e0, s0), l = Math.hypot(...v) || 1; let pp = [-v[1] / l, v[0] / l];
      if ((pp[0] * side) < 0) pp = [-pp[0], -pp[1]];
      return add(target, pp, 0.17 * sw);
    };
    const slL = sleeve(sh.l, el.l, wr.l, -1), slR = sleeve(sh.r, el.r, wr.r, 1);
    const src = [p.shL, p.shR, p.neck, p.slL, p.slR, p.axL, p.axR, p.hipL, p.hipR, p.hemL, p.hemR];
    const dst = [shL, shR, neck, slL, slR, axL, axR, hipL, hipR, hemL, hemR].map(S);
    return tps(src, dst);
  }
  if (tpl.kind === 'inferior') {
    const [A_, B_] = L.hp0[0] <= L.hp1[0] ? ['0', '1'] : ['1', '0'];
    const hp = { l: L['hp' + A_], r: L['hp' + B_] }, kn = { l: L['kn' + A_], r: L['kn' + B_] }, an = { l: L['an' + A_], r: L['an' + B_] };
    const wL = out(hp.l, hp.r, 0.32 * k), wR = out(hp.r, hp.l, 0.32 * k);
    const up = Math.hypot(...sub(hp.r, hp.l)) * 0.12;
    const src = [p.wL, p.wR, p.cr, p.kL, p.kR, p.aL, p.aR];
    const dst = [add(wL, [0, -up]), add(wR, [0, -up]), lerp(lerp(hp.l, hp.r, .5), lerp(kn.l, kn.r, .5), .35), kn.l, kn.r, add(an.l, [0, up * 0.3]), add(an.r, [0, up * 0.3])].map(S);
    return tps(src, dst);
  }
  if (tpl.kind === 'gafas') { const [a, b] = L.ey0[0] <= L.ey1[0] ? [L.ey0, L.ey1] : [L.ey1, L.ey0]; const c = lerp(a, b, .5); const f = 1.12 * k; return similarity(p.eL, p.eR, S(add(c, sub(a, c), f)), S(add(c, sub(b, c), f))); }
  if (tpl.kind === 'gorra') { const [a, b] = L.ea0[0] <= L.ea1[0] ? [L.ea0, L.ea1] : [L.ea1, L.ea0]; const lift = Math.hypot(...sub(b, a)) * 0.35; const c = lerp(a, b, .5); return similarity(p.l, p.r, S(add(add(c, sub(a, c), 1.3 * k), [0, -lift])), S(add(add(c, sub(b, c), 1.3 * k), [0, -lift]))); }
  return null;
}
