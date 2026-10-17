function U() {
return { P: [], N: [], U: [], I: [] };
}
function V(e) {
const o = new Float32Array(e.P.length);
for (let n = 0; n < e.I.length; n += 3) {
const [t, r, s] = [e.I[n] * 3, e.I[n + 1] * 3, e.I[n + 2] * 3], l = e.P[r] - e.P[t], i = e.P[r + 1] - e.P[t + 1], p = e.P[r + 2] - e.P[t + 2], a = e.P[s] - e.P[t], c = e.P[s + 1] - e.P[t + 1], m = e.P[s + 2] - e.P[t + 2], u = i * m - p * c, f = p * a - l * m, h = l * c - i * a;
for (const g of [t, r, s])
o[g] += u, o[g + 1] += f, o[g + 2] += h;
}
for (let n = 0; n < o.length; n += 3) {
const t = Math.hypot(o[n], o[n + 1], o[n + 2]) || 1;
o[n] /= t, o[n + 1] /= t, o[n + 2] /= t;
}
return e.N = Array.from(o), e;
}
function C(e, o, n, t) {
const r = e.P.length / 3;
for (let s = 0; s <= n; s++) for (let l = 0; l <= o; l++) {
const i = t(l / o, s / n);
e.P.push(...i.p), e.U.push(...i.uv);
}
for (let s = 0; s < n; s++) for (let l = 0; l < o; l++) {
const i = r + s * (o + 1) + l, p = i + 1, a = i + o + 1, c = a + 1;
e.I.push(i, a, p, p, a, c);
}
return e;
}
function A(e, o, n, t, r, s, l) {
const i = (p, a, c, m) => {
const u = e.P.length / 3;
[p, a, c, m].forEach((f) => {
e.P.push(...f), e.U.push(0, 0);
}), e.I.push(u, u + 1, u + 2, u, u + 2, u + 3);
};
return i([o, s, l], [r, s, l], [r, s, t], [o, s, t]), i([o, n, t], [r, n, t], [r, n, l], [o, n, l]), i([o, n, l], [r, n, l], [r, s, l], [o, s, l]), i([r, n, t], [o, n, t], [o, s, t], [r, s, t]), i([r, n, l], [r, n, t], [r, s, t], [r, s, l]), i([o, n, t], [o, n, l], [o, s, l], [o, s, t]), e;
}
function F(e, o, n, t, r, s = !1) {
const l = U(), i = 70, p = 80, a = e + 2 * t, c = o + t + (s ? t : 0.02);
return V(C(l, i, p, (m, u) => {
const f = m * a - t, h = u * c - (s ? t : 0.02), g = f < 0 ? -f : f > e ? f - e : 0, P = h > o ? h - o : h < 0 ? -h : 0, d = Math.max(g, P);
let O = Math.min(Math.max(f, 0), e), b = Math.min(Math.max(h, 0), o), w = n + 0.012;
if (d > 0) {
const v = d / t, j = Math.sin((g > 0 ? h : f) * Math.PI * 2 / 0.22) * 0.018 * v, M = Math.min(d, 0.03);
w = n + 0.012 - (d - M * 0.5), g > 0 ? O = (f < 0 ? -1 : 1) * (M + j) + (f < 0 ? 0 : e) : O += j * 0.6, P > 0 && (b = (h > o ? o + M : -M) + (g > 0 ? 0 : j)), g > 0 && P > 0 && (w = n + 0.012 - d * 1.05), w = Math.max(w, 5e-3);
} else
w += Math.sin(f * 9) * Math.sin(h * 7) * 4e-3;
return { p: [O - e / 2, w, b - o / 2], uv: [m * r % 1e9, u * r * (c / a)] };
}));
}
function S(e, o, n) {
const t = U(), r = 0.11, s = 0.035, l = Math.max(40, Math.round(e / r * 6));
return V(C(t, l, 40, (p, a) => {
const c = p * e, m = (1 - a) * o, u = Math.sin(c / r * Math.PI * 2) * s * (0.7 + 0.3 * a);
return { p: [c - e / 2, m, u + s + 0.06], uv: [p * n, a * n * (o / e)] };
}));
}
function x(e, o, n) {
const t = [], r = [], s = [], l = [];
let i = 0;
const p = (b) => b + 3 & -4, a = (b, w) => (r.push({ buffer: 0, byteOffset: i, byteLength: b.byteLength, ...w ? { target: w } : {} }), t.push([i, b]), i = p(i + b.byteLength), r.length - 1);
for (const b of e) {
const w = new Float32Array(b.P), v = [1e9, 1e9, 1e9], j = [-1e9, -1e9, -1e9];
for (let T = 0; T < w.length; T += 3) for (let y = 0; y < 3; y++)
v[y] = Math.min(v[y], w[T + y]), j[y] = Math.max(j[y], w[T + y]);
b.N.length || V(b);
const M = w.length / 3, E = M > 65535 ? new Uint32Array(b.I) : new Uint16Array(b.I), I = s.length;
s.push({ bufferView: a(w, 34962), componentType: 5126, count: M, type: "VEC3", min: v, max: j }), s.push({ bufferView: a(new Float32Array(b.N), 34962), componentType: 5126, count: M, type: "VEC3" }), s.push({ bufferView: a(new Float32Array(b.U), 34962), componentType: 5126, count: M, type: "VEC2" }), s.push({ bufferView: a(E, 34963), componentType: E instanceof Uint32Array ? 5125 : 5123, count: E.length, type: "SCALAR" }), l.push({ attributes: { POSITION: I, NORMAL: I + 1, TEXCOORD_0: I + 2 }, indices: I + 3, material: b.mat });
}
const c = { asset: { version: "2.0", generator: "Litper Probador" }, scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0 }], meshes: [{ primitives: l }], accessors: s, bufferViews: r, buffers: [] };
c.materials = o.map((b) => ({ pbrMetallicRoughness: { baseColorFactor: [...b.color || [1, 1, 1], 1], metallicFactor: 0, roughnessFactor: b.rough ?? 0.92, ...b.tex ? { baseColorTexture: { index: 0 } } : {} }, doubleSided: !0 })), n && (c.images = [{ bufferView: a(n.bytes, 0), mimeType: n.mime }], c.textures = [{ sampler: 0, source: 0 }], c.samplers = [{ magFilter: 9729, minFilter: 9987, wrapS: 33648, wrapT: 33648 }]), c.bufferViews.forEach((b) => {
b.target || delete b.target;
}), c.buffers = [{ byteLength: i }];
const m = new Uint8Array(i);
t.forEach(([b, w]) => m.set(new Uint8Array(w.buffer, w.byteOffset, w.byteLength), b));
const u = new TextEncoder().encode(JSON.stringify(c)), f = p(u.length), h = new Uint8Array(f).fill(32);
h.set(u);
const g = 28 + f + i, P = new ArrayBuffer(g), d = new DataView(P), O = new Uint8Array(P);
return d.setUint32(0, 1179937895, !0), d.setUint32(4, 2, !0), d.setUint32(8, g, !0), d.setUint32(12, f, !0), d.setUint32(16, 1313821514, !0), O.set(h, 20), d.setUint32(20 + f, i, !0), d.setUint32(24 + f, 5130562, !0), O.set(m, 28 + f), new Blob([P], { type: "model/gltf-binary" });
}
async function B(e, o = [0.3, 0.62, 0.4, 0.22]) {
const n = document.createElement("canvas");
n.width = n.height = 1024;
const t = n.getContext("2d"), r = e.width * o[2], s = e.height * o[3], l = e.width * o[0], i = e.height * o[1];
for (let a = 0; a < 2; a++) for (let c = 0; c < 2; c++)
t.save(), t.translate(a * 512 + (a ? 512 : 0), c * 512 + (c ? 512 : 0)), t.scale(a ? -1 : 1, c ? -1 : 1), t.drawImage(e, l, i, r, s, 0, 0, 512, 512), t.restore();
const p = await new Promise((a) => n.toBlob(a, "image/jpeg", 0.88));
return { bytes: new Uint8Array(await p.arrayBuffer()), mime: "image/jpeg", canvas: n };
}
async function L(e, o) {
const n = document.createElement("canvas");
n.width = n.height = 1024;
const t = n.getContext("2d"), [r, s, l] = e, i = (a) => `rgb(${Math.round(r * a)},${Math.round(s * a)},${Math.round(l * a)})`;
t.fillStyle = i(1), t.fillRect(0, 0, 1024, 1024);
for (let a = 0; a < 9e3; a++)
t.fillStyle = Math.random() < 0.5 ? i(0.93) : i(1.06), t.fillRect(Math.random() * 1024, Math.random() * 1024, 2, 2);
if (o === "rombos" || o === "cuadros") {
const a = o === "rombos" ? 128 : 256;
t.lineWidth = 6;
for (let c = -1024; c <= 2048; c += a) {
const m = (u, f, h, g) => {
t.strokeStyle = i(0.72), t.beginPath(), t.moveTo(u, f), t.lineTo(h, g), t.stroke(), t.strokeStyle = i(1.12), t.lineWidth = 3, t.beginPath(), t.moveTo(u + 5, f), t.lineTo(h + 5, g), t.stroke(), t.lineWidth = 6;
};
o === "rombos" ? (m(c, 0, c + 1024, 1024), m(c, 1024, c + 1024, 0)) : (m(c, 0, c, 1024), m(0, c, 1024, c));
}
} else
for (let a = 0; a < 1024; a += 6)
t.fillStyle = a % 12 ? i(0.97) : i(1.04), t.fillRect(a, 0, 3, 1024);
const p = await new Promise((a) => n.toBlob(a, "image/jpeg", 0.9));
return { bytes: new Uint8Array(await p.arrayBuffer()), mime: "image/jpeg", canvas: n };
}
const R = [0.93, 0.92, 0.9], N = [0.42, 0.29, 0.18];
function $(e, o, n) {
const t = o.w / 100, r = o.l / 100, s = (o.h || 30) / 100;
if (e === "cortina") {
const u = [Object.assign(S(t * 0.5, r, 2), { mat: 0 }), Object.assign(S(t * 0.5, r, 2), { mat: 0 })];
u[0].P = u[0].P.map((h, g) => g % 3 === 0 ? h - t * 0.27 : h), u[1].P = u[1].P.map((h, g) => g % 3 === 0 ? h + t * 0.27 : h);
const f = Object.assign(A(U(), -t * 0.58, r - 0.01, 0.04, t * 0.58, r + 0.02, 0.07), { mat: 1 });
return { blob: x([...u, f], [{ tex: !0 }, { color: [0.2, 0.2, 0.22], rough: 0.4 }], n), placement: "wall" };
}
if (e === "mantel") {
const f = Object.assign(F(t, r, 0.75, 0.24, 2, !0), { mat: 0 }), h = U();
A(h, -t / 2, 0.75 - 0.03, -r / 2, t / 2, 0.75, r / 2);
for (const [g, P] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) A(h, g * (t / 2 - 0.06) - 0.03, 0, P * (r / 2 - 0.06) - 0.03, g * (t / 2 - 0.06) + 0.03, 0.75 - 0.03, P * (r / 2 - 0.06) + 0.03);
return { blob: x([f, Object.assign(h, { mat: 1 })], [{ tex: !0 }, { color: N, rough: 0.6 }], n), placement: "floor" };
}
const l = e === "cobija" ? 0.32 : 0.3, i = Object.assign(F(t, r, e === "cobija" ? 0 + s : s, Math.min(l, s + 0.25), 2), { mat: 0 });
if (e === "cobija") return { blob: x([i], [{ tex: !0 }], n), placement: "floor" };
const p = U();
A(p, -t / 2, 0, -r / 2, t / 2, s, r / 2);
const a = U();
A(a, -t / 2 - 0.03, 0, -r / 2 - 0.08, t / 2 + 0.03, s + 0.75, -r / 2 - 0.02);
const c = U(), m = t > 1.3 ? t / 2 - 0.08 : t - 0.2;
for (const u of t > 1.3 ? [-t / 4, t / 4] : [0]) A(c, u - m / 2, s + 0.02, -r / 2 + 0.04, u + m / 2, s + 0.15, -r / 2 + 0.42);
return { blob: x([i, Object.assign(p, { mat: 1 }), Object.assign(a, { mat: 2 }), Object.assign(c, { mat: 1 })], [{ tex: !0 }, { color: R }, { color: N, rough: 0.7 }], n), placement: "floor" };
}
export {
$ as buildModel,
B as fabricTexture,
L as solidFabric
};
