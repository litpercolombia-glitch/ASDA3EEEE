const tt = `#version 300 es
in vec2 p; out vec2 uv; uniform vec4 crop; uniform float mir;
void main(){ vec2 t = vec2(p.x, -p.y)*0.5+0.5; t.x = mix(t.x, 1.-t.x, mir); uv = crop.xy + t*crop.zw; gl_Position = vec4(p,0.,1.); }`, et = `#version 300 es
precision mediump float; in vec2 uv; out vec4 o; uniform sampler2D cam;
void main(){ o = texture(cam, uv); }`, rt = `#version 300 es
in vec2 pos; in vec2 tuv; out vec2 uv; out vec2 scr; uniform vec2 res;
void main(){ uv = tuv; vec2 c = pos/res*2.-1.; c.y = -c.y; scr = pos/res; gl_Position = vec4(c,0.,1.); }`, ot = `#version 300 es
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
function I(s, o, t) {
const r = s.createShader(o);
if (s.shaderSource(r, t), s.compileShader(r), !s.getShaderParameter(r, s.COMPILE_STATUS)) throw new Error(s.getShaderInfoLog(r));
return r;
}
function N(s, o, t) {
const r = s.createProgram();
if (s.attachShader(r, I(s, s.VERTEX_SHADER, o)), s.attachShader(r, I(s, s.FRAGMENT_SHADER, t)), s.linkProgram(r), !s.getProgramParameter(r, s.LINK_STATUS)) throw new Error(s.getProgramInfoLog(r));
return r;
}
function G(s, o) {
const t = o.length, r = s.map((f, e) => [...f, o[e]]);
for (let f = 0; f < t; f++) {
let e = f;
for (let a = f + 1; a < t; a++) Math.abs(r[a][f]) > Math.abs(r[e][f]) && (e = a);
[r[f], r[e]] = [r[e], r[f]];
const l = r[f][f] || 1e-9;
for (let a = 0; a < t; a++) if (a !== f) {
const x = r[a][f] / l;
for (let R = f; R <= t; R++) r[a][R] -= x * r[f][R];
}
}
return r.map((f, e) => f[t] / (r[e][e] || 1e-9));
}
const X = (s) => s < 1e-12 ? 0 : s * Math.log(s);
function Y(s, o, t = 6e-4) {
const r = s.length, f = r + 3, e = [];
for (let h = 0; h < f; h++) e.push(new Array(f).fill(0));
for (let h = 0; h < r; h++) {
for (let i = 0; i < r; i++) {
const c = s[h][0] - s[i][0], n = s[h][1] - s[i][1];
e[h][i] = X(c * c + n * n) + (h === i ? t : 0);
}
e[h][r] = e[r][h] = 1, e[h][r + 1] = e[r + 1][h] = s[h][0], e[h][r + 2] = e[r + 2][h] = s[h][1];
}
const l = [...o.map((h) => h[0]), 0, 0, 0], a = [...o.map((h) => h[1]), 0, 0, 0], x = G(e, l), R = G(e, a);
return (h, i) => {
let c = x[r] + x[r + 1] * h + x[r + 2] * i, n = R[r] + R[r + 1] * h + R[r + 2] * i;
for (let u = 0; u < r; u++) {
const v = h - s[u][0], m = i - s[u][1], p = X(v * v + m * m);
c += x[u] * p, n += R[u] * p;
}
return [c, n];
};
}
function C(s, o, t, r) {
const f = o[0] - s[0], e = o[1] - s[1], l = r[0] - t[0], a = r[1] - t[1], x = Math.hypot(f, e) || 1, R = Math.hypot(l, a) / x, h = Math.atan2(a, l) - Math.atan2(e, f), i = Math.cos(h) * R, c = Math.sin(h) * R;
return (n, u) => {
const v = n - s[0], m = u - s[1];
return [t[0] + i * v - c * m, t[1] + c * v + i * m];
};
}
class nt {
constructor(o) {
const t = o.getContext("webgl2", { premultipliedAlpha: !1, preserveDrawingBuffer: !0, alpha: !1 });
if (!t) throw new Error("webgl2");
this.gl = t, this.cv = o, this.pBg = N(t, tt, et), this.pG = N(t, rt, ot), this.quad = t.createBuffer(), t.bindBuffer(t.ARRAY_BUFFER, this.quad), t.bufferData(t.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), t.STATIC_DRAW), this.camTex = this.tex(), this.meshes = /* @__PURE__ */ new Map(), this.crop = [0, 0, 1, 1], this.vbo = t.createBuffer(), this.uvbo = t.createBuffer(), this.ibo = t.createBuffer();
}
tex() {
const o = this.gl, t = o.createTexture();
return o.bindTexture(o.TEXTURE_2D, t), o.texParameteri(o.TEXTURE_2D, o.TEXTURE_MIN_FILTER, o.LINEAR), o.texParameteri(o.TEXTURE_2D, o.TEXTURE_MAG_FILTER, o.LINEAR), o.texParameteri(o.TEXTURE_2D, o.TEXTURE_WRAP_S, o.CLAMP_TO_EDGE), o.texParameteri(o.TEXTURE_2D, o.TEXTURE_WRAP_T, o.CLAMP_TO_EDGE), t;
}
upload(o, t) {
const r = this.gl;
r.bindTexture(r.TEXTURE_2D, o), r.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL, !1), r.texImage2D(r.TEXTURE_2D, 0, r.RGBA, r.RGBA, r.UNSIGNED_BYTE, t);
}
garmentTex(o, t) {
if (!this.meshes.has(o)) {
const r = this.tex();
this.upload(r, t), this.meshes.set(o, r);
}
return this.meshes.get(o);
}
// Ajusta el lienzo al contenedor y recorta la fuente tipo "cover"
layout(o, t) {
const r = this.cv.getBoundingClientRect(), f = Math.min(devicePixelRatio || 1, 2), e = Math.round(r.width * f), l = Math.round(r.height * f);
(this.cv.width !== e || this.cv.height !== l) && (this.cv.width = e, this.cv.height = l);
const a = o / t, x = e / l;
let R = 1, h = 1;
return a > x ? R = x / a : h = a / x, this.crop = [(1 - R) / 2, (1 - h) / 2, R, h], this.srcW = o, this.srcH = t, this.W = e, this.H = l, this;
}
// convierte coordenadas normalizadas de la fuente (0..1) a píxeles del lienzo
toScreen(o, t) {
const [r, f, e, l] = this.crop;
return this.mirror && (o = 1 - o), [(this.mirror ? (o - (1 - r - e)) / e : (o - r) / e) * this.W, (t - f) / l * this.H];
}
begin(o) {
const t = this.gl;
this.upload(this.camTex, o), t.viewport(0, 0, this.W, this.H), t.disable(t.BLEND), t.useProgram(this.pBg), t.bindBuffer(t.ARRAY_BUFFER, this.quad);
const r = t.getAttribLocation(this.pBg, "p");
t.enableVertexAttribArray(r), t.vertexAttribPointer(r, 2, t.FLOAT, !1, 0, 0), t.uniform4fv(t.getUniformLocation(this.pBg, "crop"), this.crop), t.uniform1f(t.getUniformLocation(this.pBg, "mir"), this.mirror ? 1 : 0), t.activeTexture(t.TEXTURE0), t.bindTexture(t.TEXTURE_2D, this.camTex), t.uniform1i(t.getUniformLocation(this.pBg, "cam"), 0), t.drawArrays(t.TRIANGLE_STRIP, 0, 4), t.disableVertexAttribArray(r);
}
// dibuja una prenda: map(xImg,yImg)->[xPantalla,yPantalla] en píxeles del lienzo
garment(o, t, r, f = {}) {
const e = this.gl, l = f.cols || 22, a = f.rows || 26, x = t.width, R = t.height, h = new Float32Array((l + 1) * (a + 1) * 2), i = new Float32Array(h.length);
let c = 0;
for (let p = 0; p <= a; p++) for (let A = 0; A <= l; A++) {
const d = A / l, E = p / a, [T, g] = r(d * x, E * R);
h[c] = T, h[c + 1] = g, i[c] = d, i[c + 1] = E, c += 2;
}
const n = new Uint16Array(l * a * 6);
c = 0;
for (let p = 0; p < a; p++) for (let A = 0; A < l; A++) {
const d = p * (l + 1) + A, E = d + 1, T = d + l + 1, g = T + 1;
n.set([d, E, T, E, g, T], c), c += 6;
}
e.useProgram(this.pG), e.enable(e.BLEND), e.blendFunc(e.SRC_ALPHA, e.ONE_MINUS_SRC_ALPHA);
const u = e.getAttribLocation(this.pG, "pos"), v = e.getAttribLocation(this.pG, "tuv");
e.bindBuffer(e.ARRAY_BUFFER, this.vbo), e.bufferData(e.ARRAY_BUFFER, h, e.DYNAMIC_DRAW), e.enableVertexAttribArray(u), e.vertexAttribPointer(u, 2, e.FLOAT, !1, 0, 0), e.bindBuffer(e.ARRAY_BUFFER, this.uvbo), e.bufferData(e.ARRAY_BUFFER, i, e.DYNAMIC_DRAW), e.enableVertexAttribArray(v), e.vertexAttribPointer(v, 2, e.FLOAT, !1, 0, 0), e.bindBuffer(e.ELEMENT_ARRAY_BUFFER, this.ibo), e.bufferData(e.ELEMENT_ARRAY_BUFFER, n, e.DYNAMIC_DRAW);
const m = (p) => e.getUniformLocation(this.pG, p);
e.uniform2f(m("res"), this.W, this.H), e.activeTexture(e.TEXTURE0), e.bindTexture(e.TEXTURE_2D, this.garmentTex(o, t)), e.uniform1i(m("tex"), 0), e.activeTexture(e.TEXTURE1), e.bindTexture(e.TEXTURE_2D, this.camTex), e.uniform1i(m("cam"), 1), e.uniform4fv(m("crop"), this.crop), e.uniform1f(m("mir"), this.mirror ? 1 : 0), e.uniform1f(m("shade"), f.shade ?? 0.85), e.uniform1f(m("mean"), f.mean ?? 0.5), e.uniform1f(m("alpha"), f.alpha ?? 1), e.drawElements(e.TRIANGLES, n.length, e.UNSIGNED_SHORT, 0), e.disableVertexAttribArray(u), e.disableVertexAttribArray(v);
}
}
function st(s) {
const o = document.createElement("canvas"), t = 160, r = Math.round(160 * s.height / s.width);
o.width = t, o.height = r;
const f = o.getContext("2d");
f.drawImage(s, 0, 0, t, r);
let e;
try {
e = f.getImageData(0, 0, t, r).data;
} catch {
return null;
}
const l = (u, v) => e[(v * t + u) * 4 + 3] > 60, a = (u) => {
let v = -1, m = -1;
for (let p = 0; p < t; p++) l(p, u) && (v < 0 && (v = p), m = p);
return [v, m];
}, x = (u) => {
const v = [];
let m = -1;
for (let p = 0; p <= t; p++) {
const A = p < t && l(p, u);
A && m < 0 && (m = p), !A && m >= 0 && (v.push([m, p - 1]), m = -1);
}
return v;
};
let R = 0, h = r - 1;
for (; R < r && a(R)[0] < 0; ) R++;
for (; h > 0 && a(h)[0] < 0; ) h--;
const i = (u) => Math.round(R + (h - R) * u), c = s.width / t, n = s.height / r;
return { W: t, H: r, top: R, bot: h, row: a, runs: x, at: i, sx: c, sy: n };
}
function it(s, o) {
const t = st(o), r = o.width, f = o.height;
if (!t) return null;
const e = (l, a) => [l * t.sx, a * t.sy];
if (s === "superior" || s === "completo") {
const l = t.at(s === "completo" ? 0.4 : 0.72), [a, x] = t.row(l), R = t.at(0.06);
let [h, i] = t.row(R), c = [r, 0], n = [0, 0];
for (let T = t.at(0.05); T <= t.at(0.5); T++) {
const [g, w] = t.row(T);
g >= 0 && g * t.sx < c[0] && (c = e(g, T)), w >= 0 && w * t.sx > n[0] && (n = e(w, T));
}
const u = t.at(0.08) * t.sy, v = t.bot * t.sy, m = a * t.sx, p = x * t.sx, A = c[1] > t.at(0.55) * t.sy;
let d = t.at(0.12);
for (; d < t.at(0.6); ) {
const [T, g] = t.row(d);
if (T >= a - 2 && g <= x + 2) break;
d++;
}
const E = d * t.sy;
return {
kind: s,
sleeveLong: A,
pts: {
shL: [m, u],
shR: [p, u],
neck: [(m + p) / 2, t.top * t.sy],
slL: c,
slR: n,
axL: [m, E],
axR: [p, E],
hipL: [m, t.at(s === "completo" ? 0.42 : 0.78) * t.sy],
hipR: [p, t.at(s === "completo" ? 0.42 : 0.78) * t.sy],
hemL: [m, v],
hemR: [p, v],
hemC: [(m + p) / 2, v]
}
};
}
if (s === "inferior") {
const [l, a] = t.row(t.at(0.02)), x = (n) => {
const u = t.runs(t.at(n));
if (u.length >= 2) return [e((u[0][0] + u[0][1]) / 2, t.at(n)), e((u[u.length - 1][0] + u[u.length - 1][1]) / 2, t.at(n))];
const [v, m] = t.row(t.at(n));
return [e(v + (m - v) * 0.25, t.at(n)), e(v + (m - v) * 0.75, t.at(n))];
}, [R, h] = x(0.52), [i, c] = x(0.97);
return { kind: s, pts: { wL: e(l, t.at(0.02)), wR: e(a, t.at(0.02)), cr: e((l + a) / 2, t.at(0.3)), kL: R, kR: h, aL: i, aR: c } };
}
if (s === "zapatos") {
const [l, a] = t.row(t.at(0.95));
return { kind: s, pts: { heel: e(l, t.at(0.95)), toe: e(a, t.at(0.95)) } };
}
if (s === "gafas") {
const l = t.runs(t.at(0.55)), a = l[0] || [r * 0.2 / t.sx, 0], x = l[l.length - 1] || [r * 0.8 / t.sx, 0];
return { kind: s, pts: { eL: e((a[0] + a[1]) / 2, t.at(0.55)), eR: e((x[0] + x[1]) / 2, t.at(0.55)) } };
}
return s === "gorra" ? { kind: s, pts: { l: [0.08 * r, 0.92 * f], r: [0.92 * r, 0.92 * f] } } : null;
}
function at(s, o, t = {}) {
const r = t.scale ?? 1, f = t.offsetY ?? 0, e = s.pts, l = (i, c, n = 1) => [i[0] + c[0] * n, i[1] + c[1] * n], a = (i, c) => [i[0] - c[0], i[1] - c[1]], x = (i, c, n) => [i[0] + (c[0] - i[0]) * n, i[1] + (c[1] - i[1]) * n], R = (i, c, n) => {
const u = a(i, c);
return l(i, u, n);
}, h = (i) => [i[0], i[1] + f];
if (s.kind === "superior" || s.kind === "completo") {
const [i, c] = o.sh0[0] <= o.sh1[0] ? ["0", "1"] : ["1", "0"], n = { l: o["sh" + i], r: o["sh" + c] }, u = { l: o["el" + i], r: o["el" + c] }, v = { l: o["wr" + i], r: o["wr" + c] }, m = { l: o["hp" + i], r: o["hp" + c] }, p = { l: o["kn" + i], r: o["kn" + c] }, A = a(n.r, n.l), d = Math.hypot(...A) || 1, E = d * r, T = x(n.l, n.r, 0.5), g = [A[0] / d, A[1] / d];
let w = [g[1], -g[0]];
w[1] > 0 && (w = [-w[0], -w[1]]);
const _ = (b, y, B) => [b[0] + g[0] * y + w[0] * B, b[1] + g[1] * y + w[1] * B], W = _(n.l, -0.13 * E, 0.13 * E), k = _(n.r, 0.13 * E, 0.13 * E), H = _(T, 0, 0.36 * E), V = _(n.l, 0.02 * E, -0.42 * E), O = _(n.r, -0.02 * E, -0.42 * E), M = R(m.l, m.r, 0.42 * r), F = R(m.r, m.l, 0.42 * r), P = Math.hypot(...a(x(m.l, m.r, 0.5), T)), j = s.kind === "completo" ? R(p.l, p.r, 0.6 * r) : l(M, [0, P * 0.2]), z = s.kind === "completo" ? R(p.r, p.l, 0.6 * r) : l(F, [0, P * 0.2]), S = (b, y, B, Z) => {
const $ = s.sleeveLong ? B : x(b, y, 0.55), D = a(y, b), L = Math.hypot(...D) || 1;
let U = [-D[1] / L, D[0] / L];
return U[0] * Z < 0 && (U = [-U[0], -U[1]]), l($, U, 0.17 * E);
}, K = S(n.l, u.l, v.l, -1), q = S(n.r, u.r, v.r, 1), J = [e.shL, e.shR, e.neck, e.slL, e.slR, e.axL, e.axR, e.hipL, e.hipR, e.hemL, e.hemR], Q = [W, k, H, K, q, V, O, M, F, j, z].map(h);
return Y(J, Q);
}
if (s.kind === "inferior") {
const [i, c] = o.hp0[0] <= o.hp1[0] ? ["0", "1"] : ["1", "0"], n = { l: o["hp" + i], r: o["hp" + c] }, u = { l: o["kn" + i], r: o["kn" + c] }, v = { l: o["an" + i], r: o["an" + c] }, m = R(n.l, n.r, 0.32 * r), p = R(n.r, n.l, 0.32 * r), A = Math.hypot(...a(n.r, n.l)) * 0.12, d = [e.wL, e.wR, e.cr, e.kL, e.kR, e.aL, e.aR], E = [l(m, [0, -A]), l(p, [0, -A]), x(x(n.l, n.r, 0.5), x(u.l, u.r, 0.5), 0.35), u.l, u.r, l(v.l, [0, A * 0.3]), l(v.r, [0, A * 0.3])].map(h);
return Y(d, E);
}
if (s.kind === "gafas") {
const [i, c] = o.ey0[0] <= o.ey1[0] ? [o.ey0, o.ey1] : [o.ey1, o.ey0], n = x(i, c, 0.5), u = 1.12 * r;
return C(e.eL, e.eR, h(l(n, a(i, n), u)), h(l(n, a(c, n), u)));
}
if (s.kind === "gorra") {
const [i, c] = o.ea0[0] <= o.ea1[0] ? [o.ea0, o.ea1] : [o.ea1, o.ea0], n = Math.hypot(...a(c, i)) * 0.35, u = x(i, c, 0.5);
return C(e.l, e.r, h(l(l(u, a(i, u), 1.3 * r), [0, -n])), h(l(l(u, a(c, u), 1.3 * r), [0, -n])));
}
return null;
}
export {
nt as Stage,
st as analyzeGarment,
at as mapping,
C as similarity,
it as templateFor,
Y as tps
};
