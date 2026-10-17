import { Stage as ge, templateFor as be, mapping as we, similarity as ye } from "./gl.js";
import { buildModel as ve, fabricTexture as ke, solidFabric as xe } from "./drape.js";
import { xrSupported as Me, startMeasure as Le } from "./xr.js";
const zt = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1", qt = (t) => `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_${t}/float16/1/pose_landmarker_${t}.task`, Xe = "https://litper.store", i = (t) => document.getElementById(t), Ce = i("app"), $ = (t, e, n) => Math.min(n, Math.max(e, t)), wt = matchMedia("(pointer:coarse)").matches;
let Ht;
function O(t, e = 2800) {
const n = i("toast");
n.textContent = t, n.classList.add("on"), clearTimeout(Ht), Ht = setTimeout(() => n.classList.remove("on"), e);
}
function P(t) {
const e = i("hint");
e.hidden = !t, e.textContent = t || "";
}
const N = (t, e, n) => {
const o = parseFloat(t);
return Number.isFinite(o) && o >= e && o <= n ? o : null;
}, yt = (t) => {
if (!t) return "";
try {
const e = new URL(t, location.href);
return e.protocol === "https:" || e.origin === location.origin ? e.href : "";
} catch {
return "";
}
}, G = ["superior", "completo", "inferior", "zapatos", "gafas", "gorra"], Z = ["cama", "cortina", "mantel"], Ee = [
{ title: "Camiseta índigo", kind: "superior", price: "Demo", variants: [{ title: "Índigo", image: "/assets/camiseta-frente.webp", back: "/assets/camiseta-espalda.webp" }] },
{ title: "Jean clásico", kind: "inferior", price: "Demo", variants: [{ title: "Azul", image: "/assets/jean.webp" }] },
{ title: "Tenis blancos", kind: "zapatos", price: "Demo", variants: [{ title: "Blanco", image: "/assets/tenis.webp" }] },
{ title: "Gafas de sol", kind: "gafas", price: "Demo", variants: [{ title: "Negro", image: "/assets/gafas.webp" }] }
], Re = [["vino tinto", [110, 22, 38]], ["gris oscuro", [62, 64, 70]], ["gris claro", [190, 192, 196]], ["azul oscuro", [24, 38, 84]], ["palo de rosa", [214, 160, 160]], ["dorad", [196, 150, 62]], ["plata", [176, 178, 184]], ["negr", [28, 28, 30]], ["blanc", [240, 238, 232]], ["beige", [222, 205, 178]], ["rojo", [190, 22, 30]], ["roja", [190, 22, 30]], ["fucsia", [214, 40, 120]], ["lila", [170, 140, 200]], ["menta", [150, 214, 190]], ["rosa", [232, 160, 180]], ["caf", [110, 72, 48]], ["verde", [40, 110, 70]], ["celeste", [140, 190, 228]], ["azul", [40, 80, 160]], ["gris", [130, 132, 138]]];
function Se(t) {
const e = (t || "").toLowerCase();
for (const [n, o] of Re) if (e.includes(n)) return o;
return null;
}
function je(t) {
const e = `${t.type} ${t.title}`.toLowerCase();
return /cortina|velo/.test(e) ? "tejido" : /protector/.test(e) ? "rombos" : /edred|plum/.test(e) ? "cuadros" : null;
}
async function Wt(t, e) {
const n = je(t), o = n && Se(t.variants[W]?.title);
return o ? xe(o, n) : ke(e, He(t));
}
const Ge = [["KING", 200, 200], ["QUEEN", 160, 190], ["SEMI", 120, 190], ["DOBLE", 140, 190], ["SENCILL", 100, 190]];
function Ft(t) {
const e = `${t.type} ${t.title}`.toLowerCase();
return /cortina|velo|blackout/.test(e) ? "cortina" : /mantel/.test(e) ? "mantel" : /protector|s[aá]bana|cobija|edred|colcha|plum|forro|kit de cama|almohada|manta|cubrelecho/.test(e) ? "cama" : /zapat|tenis|sneaker|bota|sandalia/.test(e) ? "zapatos" : /gafa|lente/.test(e) ? "gafas" : /gorra|sombrero/.test(e) ? "gorra" : /pantal|jean|falda|short|jogger|legging/.test(e) ? "inferior" : /vestido|pijama|enterizo|bata/.test(e) ? "completo" : "superior";
}
let z = [], h = null, W = 0;
async function Oe() {
const t = new URLSearchParams(location.search), e = (t.get("p") || "").toLowerCase(), n = yt(t.get("img") || "");
if (/^[a-z0-9][a-z0-9-]{0,150}$/.test(e))
try {
const o = await fetch("/api/catalogo?handle=" + encodeURIComponent(e));
if (!o.ok) throw 0;
const a = await o.json(), s = /* @__PURE__ */ new Set(), d = [];
for (const u of a.variants) {
const c = u.image || a.images[0], f = u.options[0];
s.has(f) || (s.add(f), d.push({ title: f, image: c, id: u.id, options: u.options }));
}
z = [{ handle: e, title: a.title, type: a.type, kind: Ft(a), price: a.priceText, url: a.url, variants: d.length ? d : [{ title: a.title, image: a.images[0] }], all: a.variants, options: a.options }];
} catch {
O("No encontré ese producto en la tienda. Te muestro ejemplos.");
}
!z.length && n && (z = [{ title: (t.get("n") || "Producto").slice(0, 80), kind: t.get("c") || "superior", price: (t.get("precio") || "").slice(0, 30), url: yt(t.get("buy") || ""), variants: [{ title: "", image: n, back: yt(t.get("back") || "") }] }]), z.length || (z = Ee.concat(await Pe())), t.get("c") && [...G, ...Z].includes(t.get("c")) && (z[0].kind = t.get("c")), $t(0);
}
async function Pe() {
const t = [];
for (const e of ["protector-oferta-navidad", "colcha-navidena-li", "edredon-tipo-plumon-doble-faz", "la-cortina-que-apaga-la-luz-de-la-calle-con-sabanas-600-hilos-de-regalo", "mantel-navideno-li"])
try {
const n = await fetch("/api/catalogo?handle=" + e);
if (!n.ok) continue;
const o = await n.json(), a = /* @__PURE__ */ new Set(), s = [];
for (const d of o.variants) {
const u = d.options[0];
a.has(u) || !d.image || (a.add(u), s.push({ title: u, image: d.image, id: d.id, options: d.options }));
}
t.push({ handle: e, title: o.title, type: o.type, kind: Ft(o), price: o.priceText, url: o.url, variants: s.length ? s.slice(0, 8) : [{ title: o.title, image: o.images[0] }], all: o.variants, options: o.options });
} catch {
}
return t;
}
function Ue() {
return [140, 190];
}
function $t(t) {
h = z[t], W = 0, at.clear(), i("pName").textContent = h.title, i("pPrice").textContent = h.price || "", i("selKind").value = h.kind;
const [e, n] = h.kind === "cama" ? Ue(h) : h.kind === "cortina" ? [280, 230] : h.kind === "mantel" ? [150, 220] : [140, 190];
i("dW").value = e, i("dL").value = n, i("dH").value = h.kind === "cama" ? 30 : h.kind === "mantel" ? 75 : 3, i("tallaCama").hidden = !Z.includes(h.kind), i("tallaRopa").hidden = Z.includes(h.kind), Te(), xt(0);
const o = G.includes(h.kind);
o && (S === "espacio" || S === "tres") && tt("probar"), !o && S === "probar" && tt("espacio"), gt();
}
function Te() {
const t = i("swatches");
t.replaceChildren();
const e = z.length > 1, n = e ? z.map((o, a) => ({ img: o.variants[0].image, label: o.title, on: o === h, act: () => $t(a) })) : [];
h.variants.forEach((o, a) => n.push({ img: o.image, label: o.title, on: !e && a === W, act: () => xt(a), variant: !0 })), e && h.variants.length > 1 && n.splice(z.length, 0, { sep: !0 });
for (const o of n) {
if (o.sep) {
const d = document.createElement("span");
d.style.cssText = "flex:none;width:1px;background:var(--line);margin:6px 2px", t.append(d);
continue;
}
const a = document.createElement("button");
a.className = "sw", a.setAttribute("role", "option"), a.setAttribute("aria-label", o.label || "Opción"), a.setAttribute("aria-selected", o.on ? "true" : "false"), o.variant && (a.dataset.v = "1");
const s = document.createElement("img");
s.src = o.img, s.alt = "", s.loading = "lazy", s.crossOrigin = "anonymous", a.append(s), a.onclick = () => {
o.act(), o.variant && t.querySelectorAll("[data-v]").forEach((d) => d.setAttribute("aria-selected", d === a ? "true" : "false"));
}, t.append(a);
}
h.variants[0]?.image && (i("pThumb").src = h.variants[0].image, i("pThumb").hidden = !1);
}
const vt = /* @__PURE__ */ new Map(), at = /* @__PURE__ */ new Map();
function kt(t) {
if (vt.has(t)) return vt.get(t);
const e = new Promise((n, o) => {
const a = new Image();
a.crossOrigin = "anonymous", a.onload = () => n(a), a.onerror = o, a.src = t;
});
return vt.set(t, e), e;
}
function Nt(t) {
const e = Math.min(900, t.width), n = Math.round(e * t.height / t.width), o = Object.assign(document.createElement("canvas"), { width: e, height: n }), a = o.getContext("2d");
a.drawImage(t, 0, 0, e, n);
let s;
try {
s = a.getImageData(0, 0, e, n);
} catch {
return o;
}
const d = s.data, u = [0, (e - 1) * 4, (n - 1) * e * 4, ((n - 1) * e + e - 1) * 4];
if (u.some((l) => d[l + 3] < 30)) return o;
const c = [0, 1, 2].map((l) => u.reduce((g, p) => g + d[p + l], 0) / 4), f = new Uint8Array(e * n), r = [], m = (l) => Math.abs(d[l] - c[0]) + Math.abs(d[l + 1] - c[1]) + Math.abs(d[l + 2] - c[2]) < 70;
for (let l = 0; l < e; l++) r.push(l, (n - 1) * e + l);
for (let l = 0; l < n; l++) r.push(l * e, l * e + e - 1);
for (; r.length; ) {
const l = r.pop();
if (f[l] || (f[l] = 1, !m(l * 4))) continue;
d[l * 4 + 3] = 0;
const g = l % e, p = l / e | 0;
g > 0 && r.push(l - 1), g < e - 1 && r.push(l + 1), p > 0 && r.push(l - e), p < n - 1 && r.push(l + e);
}
return a.putImageData(s, 0, 0), o;
}
let C = { front: null, back: null, key: "" };
async function xt(t) {
W = t;
const e = h.variants[t];
C = { front: null, back: null, key: e.image };
try {
const n = await kt(e.image);
if (C.key !== e.image) return;
if (C.front = G.includes(h.kind) ? Nt(n) : n, C.frontRaw = n, e.back) {
const o = await kt(e.back);
C.back = Nt(o);
}
} catch {
O("No pude cargar la imagen de este producto.");
}
S === "espacio" && (await Rt(), D()), S === "tres" && jt(), j && ot(j, !1), gt();
}
function _t(t, e) {
const n = e + "|" + h.kind;
return at.has(n) || at.set(n, be(h.kind === "zapatos" ? "zapatos" : h.kind, t)), at.get(n);
}
let S = "probar";
function tt(t) {
S = t, Ce.dataset.mode = t, document.querySelectorAll("#dial button").forEach((e) => e.classList.toggle("on", e.dataset.m === t)), ["talla", "medir", "tune", "shot"].forEach((e) => i(e).hidden = !0), i("roomTools").hidden = t !== "espacio", i("empty").hidden = !(t === "probar" && !_ && !j), P(""), t !== "probar" && ut(), t === "espacio" && (et ? Rt().then(D) : ne()), t === "tres" && jt(), t === "medir" && (i("medir").hidden = !1), t === "talla" && (i("talla").hidden = !1);
}
i("dial").addEventListener("click", (t) => {
const e = t.target.closest("button");
e && tt(e.dataset.m);
}), document.querySelectorAll("[data-close]").forEach((t) => t.onclick = () => {
i(t.dataset.close).hidden = !0, ["talla", "medir"].includes(t.dataset.close) && tt(G.includes(h.kind) ? "probar" : "espacio");
}), i("btnTune").onclick = () => {
i("tune").hidden = !i("tune").hidden;
}, i("selKind").onchange = () => {
h.kind = i("selKind").value, at.clear(), xt(W);
}, ["dW", "dL", "dH"].forEach((t) => i(t).addEventListener("change", () => S === "tres" && jt()));
const Vt = i("gl");
let U;
try {
U = new ge(Vt);
} catch {
O("Tu navegador no soporta gráficos 3D (WebGL2).");
}
const T = i("vid");
let F = null, Mt = null, ct = null, _ = null, lt = "user", Lt = 0, Bt = -1, V = null, B = null, j = null, dt = 0.5, Xt = 0, K = !1, Q = 0;
async function Ct() {
return F || (Mt || (Mt = (async () => {
P("Cargando el detector del cuerpo…");
const t = await import(zt + "/vision_bundle.mjs"), e = await t.FilesetResolver.forVisionTasks(zt + "/wasm"), n = (o) => ({ baseOptions: { modelAssetPath: qt(wt ? "lite" : "full"), delegate: o }, runningMode: "VIDEO", numPoses: 1, minPoseDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
try {
F = await t.PoseLandmarker.createFromOptions(e, n("GPU"));
} catch {
F = await t.PoseLandmarker.createFromOptions(e, n("CPU"));
}
return ct = "VIDEO", window.__vision = t, window.__fs = e, P(""), F;
})().catch((t) => {
throw Mt = null, t;
})), Mt);
}
async function Gt(t) {
ct !== t && (await F.setOptions({ runningMode: t }), ct = t);
}
function ut() {
cancelAnimationFrame(Lt), Lt = 0, _ && (_.getTracks().forEach((t) => t.stop()), _ = null);
}
async function Kt() {
if (!navigator.mediaDevices?.getUserMedia) {
O("Este navegador no deja usar la cámara. Sube una foto.");
return;
}
ut(), j = null, V = null;
try {
_ = await navigator.mediaDevices.getUserMedia({ audio: !1, video: { facingMode: lt, width: { ideal: wt ? 720 : 1280 }, height: { ideal: wt ? 1280 : 720 } } });
} catch {
O("Sin permiso de cámara. Puedes subir una foto.");
return;
}
T.srcObject = _, await T.play(), i("empty").hidden = !0, U.mirror = lt === "user";
try {
await Ct(), await Gt("VIDEO");
} catch {
O("No cargó el detector. Revisa tu conexión.");
}
P("Aléjate hasta que se vea tu cuerpo completo"), Qt();
}
function Qt() {
if (Lt = requestAnimationFrame(Qt), !(!T.videoWidth || !U)) {
if (F && ct === "VIDEO" && T.currentTime !== Bt) {
Bt = T.currentTime;
try {
const t = F.detectForVideo(T, performance.now());
Yt(t.landmarks?.[0]);
} catch {
}
}
++Xt % 15 === 0 && (dt = Jt(T)), ot(T, !0);
}
}
const Ie = Object.assign(document.createElement("canvas"), { width: 24, height: 24 });
function Jt(t) {
const e = Ie.getContext("2d", { willReadFrequently: !0 });
e.drawImage(t, 0, 0, 24, 24);
const n = e.getImageData(4, 4, 16, 16).data;
let o = 0;
for (let a = 0; a < n.length; a += 4) o += n[a] * 0.299 + n[a + 1] * 0.587 + n[a + 2] * 0.114;
return $(o / (n.length / 4) / 255, 0.15, 0.85);
}
function Yt(t) {
if (!t) {
B = null;
return;
}
const e = 0.45;
V = V && V.length === t.length ? V.map((a, s) => ({ x: a.x + (t[s].x - a.x) * e, y: a.y + (t[s].y - a.y) * e, v: t[s].visibility ?? 1 })) : t.map((a) => ({ x: a.x, y: a.y, v: a.visibility ?? 1 })), B = V;
const o = (t[0].visibility ?? 1) < 0.35 && (t[2].visibility ?? 1) < 0.35 && (t[11].visibility ?? 0) > 0.6 ? -1 : Math.sign(t[11].x - t[12].x) * (Math.abs(t[11].x - t[12].x) > 0.02 ? 1 : 0);
Q = $(Q + o * 0.25, -1, 1), Q < -0.6 ? K = !0 : Q > 0.6 && (K = !1);
}
const Zt = { sh0: 11, sh1: 12, el0: 13, el1: 14, wr0: 15, wr1: 16, hp0: 23, hp1: 24, kn0: 25, kn1: 26, an0: 27, an1: 28, ey0: 2, ey1: 5, ea0: 7, ea1: 8, he0: 29, he1: 30, ft0: 31, ft1: 32 };
function De(t, e) {
const n = {};
for (const o in Zt) {
const a = B[Zt[o]];
n[o] = U.toScreen(a.x, a.y);
}
return n;
}
function ot(t, e) {
const n = t.videoWidth || t.width, o = t.videoHeight || t.height;
if (U.layout(n, o), U.begin(t), !B || !C.front) return;
const a = De(n, o), s = { scale: +i("rScale").value, offsetY: +i("rOff").value * U.H * 0.3 }, d = i("chkShade").checked ? 0.9 : 0, u = i("selView").value, c = (u === "back" || u === "auto" && K) && C.back, f = c ? C.back : C.front, r = C.key + (c ? "#b" : "");
if (h.kind === "zapatos")
Ae(f, r, a, d);
else if (G.includes(h.kind)) {
const m = _t(f, r);
if (!m) return;
const l = we(m, a, s);
l && U.garment(r, f, l, { shade: d, mean: dt });
}
if (i("chkDots").checked && ze(a), e && h.kind !== "gafas" && h.kind !== "gorra") {
const m = (l) => (B[l]?.v ?? 0) > 0.5;
Xt % 20 === 0 && P(h.kind === "zapatos" ? m(31) && m(32) ? "" : "Apunta la cámara a tus pies" : m(11) && m(12) && m(23) && m(24) ? K && C.back ? "Viendo la espalda" : "" : "Aléjate: necesito ver hombros y cadera");
}
}
function Ae(t, e, n, o) {
const a = _t(t, e);
if (!a) return;
const s = t.width;
for (const [d, u] of [[n.he0, n.ft0], [n.he1, n.ft1]]) {
const c = u[0] - d[0], f = u[1] - d[1], r = Math.hypot(c, f) || 1, m = c / r, l = f / r, g = [d[0] - m * r * 0.18, d[1] - l * r * 0.18 + r * 0.08], p = [u[0] + m * r * 0.22, u[1] + l * r * 0.22 + r * 0.08], b = p[0] < g[0], M = b ? [s - a.pts.heel[0], a.pts.heel[1]] : a.pts.heel, w = b ? [s - a.pts.toe[0], a.pts.toe[1]] : a.pts.toe, E = ye(M, w, g, p), y = b ? (v, L) => E(s - v, L) : E;
U.garment(e, t, y, { shade: o, mean: dt, cols: 10, rows: 6 });
}
}
let q;
function ze(t) {
q || (q = document.createElement("canvas"), q.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none", i("stage").append(q)), q.width = U.W, q.height = U.H;
const e = q.getContext("2d");
e.fillStyle = "#f4b43a";
for (const n in t)
e.beginPath(), e.arc(t[n][0], t[n][1], 6, 0, 7), e.fill();
}
i("chkDots").onchange = () => {
!i("chkDots").checked && q && (q.remove(), q = null);
}, ["rScale", "rOff", "chkShade", "selView"].forEach((t) => i(t).addEventListener("input", () => j && ot(j, !1)));
async function qe(t) {
if (!t?.type.startsWith("image/")) return;
ut(), V = null;
const e = URL.createObjectURL(t);
let n;
try {
n = await ht(e);
} finally {
URL.revokeObjectURL(e);
}
j = J(n, 1400), U.mirror = !1, i("empty").hidden = !0, P("Analizando tu foto…");
try {
await Ct(), await Gt("IMAGE");
const o = F.detect(j), a = o.landmarks?.[0];
Q = 0, Yt(a), a && (K = Q < 0, Q = K ? -1 : 1);
} catch {
B = null;
}
dt = Jt(j), P(B ? "" : "No encontré a la persona. Usa una foto de cuerpo entero."), ot(j, !1);
}
function ht(t) {
return new Promise((e, n) => {
const o = new Image();
o.onload = () => e(o), o.onerror = n, o.src = t;
});
}
function J(t, e) {
const n = t.naturalWidth || t.width, o = t.naturalHeight || t.height, a = Math.min(1, e / Math.max(n, o)), s = Object.assign(document.createElement("canvas"), { width: Math.round(n * a), height: Math.round(o * a) });
return s.getContext("2d").drawImage(t, 0, 0, s.width, s.height), s;
}
i("btnStart").onclick = Kt, i("filePhoto").onchange = (t) => qe(t.target.files[0]), i("btnUpload").onclick = () => i(S === "espacio" ? "fileRoom" : "filePhoto").click(), i("btnFlip").onclick = () => {
lt = lt === "user" ? "environment" : "user", V = null, S === "probar" && Kt();
}, document.addEventListener("visibilitychange", () => {
document.hidden && ut();
});
const k = i("room"), x = k.getContext("2d");
let et = null, Et = null, H = null, te = null, X = null, ft = -1;
const ee = { src: "/assets/cama-demo.webp", q: [[0.046, 0.47], [0.62, 0.36], [1, 0.585], [0.556, 0.84]] };
async function ne() {
const t = await kt(ee.src);
ae(J(t, 1400), ee.q), P("Ejemplo. Toma una foto de tu cama para verlo en la tuya.");
}
async function ae(t, e) {
et = t, Et = t, k.width = t.width, k.height = t.height, H = (e || [[0.18, 0.45], [0.82, 0.45], [0.95, 0.85], [0.05, 0.85]]).map(([n, o]) => [n * t.width, o * t.height]), te = We(t), await Rt(), D();
}
async function Rt() {
if (!C.frontRaw && !C.front) return;
const t = C.frontRaw || C.front;
Z.includes(h.kind) ? X = (await Wt(h, t)).canvas : X = C.front;
}
function He(t) {
const e = new URLSearchParams(location.search).get("tela");
if (e) {
const n = e.split(",").map(Number);
if (n.length === 4 && n.every((o) => o >= 0 && o <= 1)) return n;
}
return t.kind === "cortina" ? [0.8, 0.2, 0.14, 0.35] : t.kind === "mantel" ? [0.2, 0.62, 0.5, 0.25] : [0.32, 0.62, 0.36, 0.2];
}
function We(t) {
const e = Object.assign(document.createElement("canvas"), { width: t.width, height: t.height }), n = e.getContext("2d");
n.drawImage(t, 0, 0);
const o = n.getImageData(0, 0, e.width, e.height), a = o.data;
let s = 0, d = 0;
for (let c = 0; c < a.length; c += 16) {
const f = a[c] * 0.3 + a[c + 1] * 0.59 + a[c + 2] * 0.11;
s += f, d++;
}
const u = s / d || 128;
for (let c = 0; c < a.length; c += 4) {
const f = a[c] * 0.3 + a[c + 1] * 0.59 + a[c + 2] * 0.11, r = $(Math.pow(f / (u * 1.25), 0.85) * 255, 0, 255);
a[c] = a[c + 1] = a[c + 2] = r;
}
return n.putImageData(o, 0, 0), e;
}
function Fe(t) {
const [e, n, o, a] = t.map(([b, M]) => ({ x: b, y: M })), s = e.x - n.x + o.x - a.x, d = e.y - n.y + o.y - a.y;
let u, c, f, r, m, l, g = 0, p = 0;
if (Math.abs(s) < 1e-9 && Math.abs(d) < 1e-9)
u = n.x - e.x, c = a.x - e.x, f = e.x, r = n.y - e.y, m = a.y - e.y, l = e.y;
else {
const b = n.x - o.x, M = a.x - o.x, w = n.y - o.y, E = a.y - o.y, y = b * E - M * w;
g = (s * E - M * d) / y, p = (b * d - s * w) / y, u = n.x - e.x + g * n.x, c = a.x - e.x + p * a.x, f = e.x, r = n.y - e.y + g * n.y, m = a.y - e.y + p * a.y, l = e.y;
}
return (b, M) => {
const w = g * b + p * M + 1;
return [(u * b + c * M + f) / w, (r * b + m * M + l) / w];
};
}
function oe(t, e, n, o) {
const [[a, s], [d, u], [c, f]] = n, [[r, m], [l, g], [p, b]] = o, M = (a + d + c) / 3, w = (s + u + f) / 3, E = (Ut, Tt) => {
const It = Ut - M, Dt = Tt - w, At = Math.hypot(It, Dt) || 1;
return [Ut + It / At * 0.7, Tt + Dt / At * 0.7];
}, y = r * g + m * p + l * b - g * p - m * l - r * b;
if (!y) return;
const v = (a * g + m * c + d * b - g * c - m * d - a * b) / y, L = (r * d + a * p + l * c - d * p - a * l - r * c) / y, R = (r * g * c + m * d * p + a * l * b - a * g * p - m * l * c - r * d * b) / y, I = (s * g + m * f + u * b - g * f - m * u - s * b) / y, Y = (r * u + s * p + l * f - u * p - s * l - r * f) / y, he = (r * g * f + m * u * p + s * l * b - s * g * p - m * l * f - r * u * b) / y, [fe, me, pe] = [E(a, s), E(d, u), E(c, f)];
t.save(), t.beginPath(), t.moveTo(...fe), t.lineTo(...me), t.lineTo(...pe), t.closePath(), t.clip(), t.transform(v, I, L, Y, R, he), t.drawImage(e, 0, 0), t.restore();
}
function D() {
if (!et) return;
const t = k.width, e = k.height;
if (x.clearRect(0, 0, t, e), x.drawImage(et, 0, 0), !X) return;
const n = Object.assign(document.createElement("canvas"), { width: t, height: e }), o = n.getContext("2d"), a = Fe(H), s = 16, d = X.width, u = X.height, c = [];
for (let r = 0; r <= s; r++) for (let m = 0; m <= s; m++) c.push(a(m / s, r / s));
for (let r = 0; r < s; r++) for (let m = 0; m < s; m++) {
const l = r * (s + 1) + m, g = c[l], p = c[l + 1], b = c[l + s + 2], M = c[l + s + 1], w = [m / s * d, r / s * u], E = [(m + 1) / s * d, r / s * u], y = [(m + 1) / s * d, (r + 1) / s * u], v = [m / s * d, (r + 1) / s * u];
oe(o, X, [g, p, b], [w, E, y]), oe(o, X, [g, b, M], [w, y, v]);
}
if (i("chkShade").checked && Z.includes(h.kind) && (o.save(), o.globalCompositeOperation = "multiply", o.drawImage(te, 0, 0), o.globalCompositeOperation = "destination-in", o.beginPath(), H.forEach((r, m) => m ? o.lineTo(...r) : o.moveTo(...r)), o.closePath(), o.fill(), o.restore()), x.drawImage(n, 0, 0), !mt) return;
const f = Math.max(12, t / 40);
x.lineWidth = f / 5, x.strokeStyle = "rgba(244,180,58,.9)", x.setLineDash([f * 0.8, f * 0.6]), x.beginPath(), H.forEach((r, m) => m ? x.lineTo(...r) : x.moveTo(...r)), x.closePath(), x.stroke(), x.setLineDash([]), H.forEach((r) => {
x.fillStyle = "#fff", x.strokeStyle = "#f4b43a", x.lineWidth = f / 3, x.beginPath(), x.arc(r[0], r[1], f, 0, 7), x.fill(), x.stroke();
});
}
let mt = !0;
function St(t) {
const e = k.getBoundingClientRect(), n = Math.min(e.width / k.width, e.height / k.height), o = (e.width - k.width * n) / 2, a = (e.height - k.height * n) / 2;
return [(t.clientX - e.left - o) / n, (t.clientY - e.top - a) / n];
}
k.style.objectFit = "contain", k.addEventListener("pointerdown", (t) => {
if (!H) return;
const e = St(t);
let n = -1, o = k.width / 7;
H.forEach((a, s) => {
const d = Math.hypot(a[0] - e[0], a[1] - e[1]);
d < o && (o = d, n = s);
}), ft = n, n >= 0 && (k.setPointerCapture(t.pointerId), mt = !0);
}), k.addEventListener("pointermove", (t) => {
if (ft < 0) return;
const e = St(t);
H[ft] = [$(e[0], 0, k.width), $(e[1], 0, k.height)], D.q || (D.q = requestAnimationFrame(() => {
D.q = 0, D();
}));
}), k.addEventListener("pointerup", () => ft = -1), i("fileRoom").onchange = async (t) => {
const e = t.target.files[0];
if (!e?.type.startsWith("image/")) return;
const n = URL.createObjectURL(e);
try {
await ae(J(await ht(n), 1600)), P("Arrastra los 4 puntos a las esquinas de tu colchón");
} finally {
URL.revokeObjectURL(n);
}
}, i("btnRoomDemo").onclick = ne, i("btnRoomReset").onclick = () => {
et && (H = [[0.18, 0.45], [0.82, 0.45], [0.95, 0.85], [0.05, 0.85]].map(([t, e]) => [t * k.width, e * k.height]), D());
}, i("chkShade").addEventListener("input", () => S === "espacio" && D());
let pt = null;
async function jt() {
if (!C.frontRaw && !C.front) return;
const t = Z.includes(h.kind) ? h.kind : "cama", e = { w: N(i("dW").value, 10, 400) ?? 140, l: N(i("dL").value, 10, 400) ?? 190, h: N(i("dH").value, 1, 80) ?? 30 }, n = await Wt(h, C.frontRaw || C.front), { blob: o, placement: a } = ve(t, e, n);
pt && URL.revokeObjectURL(pt), pt = URL.createObjectURL(o);
const s = i("mv");
s.setAttribute("ar-placement", a), s.src = pt, P(`${h.kind === "cortina" ? "Cortina" : h.kind === "mantel" ? "Mesa con mantel" : "Cama"} de ${e.w} × ${e.l} cm`);
}
(async () => await Me() && (i("medirXR").hidden = !1, i("medirFoto").querySelector(".lead").textContent = "¿Sin realidad aumentada? Pon una tarjeta bancaria sobre lo que vas a medir, toma la foto y marca los puntos."))(), i("btnXR").onclick = async () => {
try {
await Le(i("xrui"), {
add: i("xrAdd"),
undo: i("xrUndo"),
close: i("xrClose"),
reticle: i("ret"),
read: i("xrRead"),
onEnd: (t) => {
t.length && ie(t.map((e) => Math.round(e * 1e3) / 10));
}
});
} catch {
O("Tu celular no permitió abrir la realidad aumentada. Usa la medición con tarjeta.");
}
};
function ie(t) {
const e = i("resMedir");
e.hidden = !1, e.replaceChildren();
const n = document.createElement("div");
if (n.className = "size", n.textContent = `${t[t.length - 1]} cm`, e.append(n), t.length > 1) {
const o = document.createElement("p");
o.textContent = "Medidas: " + t.map((a) => a + " cm").join(" · "), e.append(o);
}
if (h.kind === "cama" && t.length >= 2) {
i("bW").value = Math.round(Math.min(t[0], t[1])), i("bL").value = Math.round(Math.max(t[0], t[1])), t[2] && (i("bH").value = Math.round(t[2]));
const o = document.createElement("p");
o.textContent = "Lo pasé a Mi talla para recomendarte la medida.", e.append(o);
}
}
let A = [], it = null;
i("fileMeasure").onchange = async (t) => {
const e = t.target.files[0];
if (!e) return;
const n = URL.createObjectURL(e);
try {
it = J(await ht(n), 1600);
} finally {
URL.revokeObjectURL(n);
}
A = [], tt("espacio"), et = it, k.width = it.width, k.height = it.height, X = null, H = null, x.drawImage(it, 0, 0), i("roomTools").hidden = !0, P("1/4 Toca un extremo del lado largo de la tarjeta"), Ot = !0;
};
let Ot = !1;
k.addEventListener("click", (t) => {
if (!Ot) return;
const e = St(t);
A.push(e);
const n = x;
if (n.fillStyle = "#f4b43a", n.beginPath(), n.arc(e[0], e[1], Math.max(8, k.width / 90), 0, 7), n.fill(), A.length % 2 === 0) {
const u = A[A.length - 2];
n.strokeStyle = "#f4b43a", n.lineWidth = Math.max(4, k.width / 250), n.beginPath(), n.moveTo(...u), n.lineTo(...e), n.stroke();
}
const o = ["", "2/4 Toca el otro extremo de la tarjeta", "3/4 Toca el inicio de lo que quieres medir", "4/4 Toca el final"];
if (A.length < 4) return P(o[A.length]);
const a = (u, c) => Math.hypot(u[0] - c[0], u[1] - c[1]), s = a(A[2], A[3]) / a(A[0], A[1]) * 8.56;
Ot = !1, P(""), i("medir").hidden = !1, ie([Math.round(s * 10) / 10]);
const d = document.createElement("p");
d.textContent = "Por foto la precisión es de ±3 %. Pon la tarjeta a la misma distancia que lo que mides.", i("resMedir").append(d);
});
const nt = { f: null, s: null };
document.querySelectorAll(".shot input").forEach((t) => t.onchange = async (e) => {
const n = e.target.files[0];
if (!n) return;
const o = URL.createObjectURL(n);
try {
nt[t.dataset.side] = J(await ht(o), 1200);
const a = t.parentElement;
a.style.backgroundImage = `url(${nt[t.dataset.side].toDataURL("image/jpeg", 0.6)})`, a.classList.add("has");
} finally {
URL.revokeObjectURL(o);
}
});
let st = null;
async function $e() {
if (st) return st;
await Ct();
const t = window.__vision, e = (n, o) => ({ baseOptions: { modelAssetPath: qt(o), delegate: n }, runningMode: "IMAGE", numPoses: 1, outputSegmentationMasks: !0 });
try {
st = await t.PoseLandmarker.createFromOptions(window.__fs, e("GPU", "full"));
} catch {
st = await t.PoseLandmarker.createFromOptions(window.__fs, e("CPU", "lite"));
}
return st;
}
async function se(t) {
const e = (await $e()).detect(t), n = e.landmarks?.[0], o = e.segmentationMasks?.[0];
if (!n || !o) return null;
const a = o.width, s = o.height, d = o.getAsFloat32Array();
o.close?.();
const u = (v, L) => d[L * a + v] > 0.5;
let c = -1, f = -1;
for (let v = 0; v < s; v++) {
let L = !1;
for (let R = 0; R < a; R += 2) if (u(R, v)) {
L = !0;
break;
}
L && (c < 0 && (c = v), f = v);
}
const r = Math.round((n[11].x + n[12].x + n[23].x + n[24].x) / 4 * a), m = (v) => {
const L = Math.round($(v, 0, 1) * s);
if (!u(r, L)) return 0;
let R = r, I = r;
for (; R > 0 && u(R - 1, L); ) R--;
for (; I < a - 1 && u(I + 1, L); ) I++;
return I - R;
}, l = (n[11].y + n[12].y) / 2, g = (n[23].y + n[24].y) / 2, p = g - l, b = Math.abs(n[11].x - n[12].x) * a, M = Math.abs(n[23].x - n[24].x) * a, w = (v, L) => {
const R = Math.round($(v, 0, 1) * s);
if (!u(r, R)) return 0;
let I = r, Y = r;
for (; I > 0 && u(I - 1, R); ) I--;
for (; Y < a - 1 && u(Y + 1, R); ) Y++;
return Math.min(Y - I, L);
};
if (b < 0.08 * a) return { hpx: f - c, chest: w(l + p * 0.22, 1e9), waist: w(l + p * 0.75, 1e9), hip: w(g + p * 0.08, 1e9), side: !0 };
let y = 1e9;
for (let v = 0.6; v <= 0.85; v += 0.05) y = Math.min(y, w(l + p * v, M * 1.75) || 1e9);
return { hpx: f - c, chest: w(l + p * 0.22, b * 0.98), waist: y === 1e9 ? 0 : y, hip: w(g + p * 0.08, M * 1.85), side: !1 };
}
const Pt = (t, e) => {
const n = t / 2, o = e / 2;
return Math.PI * (3 * (n + o) - Math.sqrt((3 * n + o) * (n + 3 * o)));
}, Ne = {
f: [["XS", 80, 64, 88], ["S", 86, 70, 94], ["M", 92, 76, 100], ["L", 100, 84, 108], ["XL", 108, 92, 116], ["XXL", 116, 100, 124]],
m: [["XS", 84, 70, 86], ["S", 90, 76, 92], ["M", 98, 84, 100], ["L", 106, 92, 106], ["XL", 114, 100, 112], ["XXL", 122, 108, 118]]
};
i("btnTalla").onclick = async () => {
const t = N(i("tH").value, 100, 220), e = N(i("tW").value, 30, 200), n = i("tS").value;
if (!t) return O("Escribe tu estatura.");
const o = i("btnTalla");
o.disabled = !0, o.textContent = "Midiendo tu cuerpo…";
try {
let a, s, d, u;
const c = nt.f ? await se(nt.f) : null, f = nt.s ? await se(nt.s) : null;
if (window.__talla = { F: c, S: f }, c && c.hpx > 50 && c.chest) {
const w = t / c.hpx, E = f && f.hpx > 50 ? t / f.hpx : 0, y = (v, L, R) => f && L ? L * E : v * w * R;
a = Pt(c.chest * w, y(c.chest, f?.chest, 0.72)), s = Pt(c.waist * w, y(c.waist, f?.waist, 0.74)), d = Pt(c.hip * w, y(c.hip, f?.hip, 0.8)), u = f ? "medidas con tus 2 fotos" : "medidas con tu foto de frente (agrega la de lado para más precisión)";
} else {
if (!e) throw new Error("Toma la foto de frente o escribe tu peso.");
const w = e / (t / 100) ** 2;
a = (n === "m" ? 0.54 : 0.53) * t + 1.6 * (w - 22), s = a * (n === "m" ? 0.86 : 0.8), d = a * (n === "m" ? 1 : 1.08), u = "estimadas por estatura y peso (toma las fotos para medirte de verdad)";
}
const r = Ne[n], m = h.kind === "inferior";
let l = r.findIndex((w) => m ? d <= w[3] + 2 : a <= w[1] + 3);
l < 0 && (l = r.length - 1), l = $(l + +i("tF").value, 0, r.length - 1);
const g = i("res");
g.hidden = !1, g.replaceChildren();
const p = document.createElement("div");
p.className = "size", p.textContent = r[l][0];
const b = document.createElement("div");
b.className = "meas";
for (const [w, E] of [["Pecho", a], ["Cintura", s], ["Cadera", d]]) {
const y = document.createElement("div"), v = document.createElement("b");
v.textContent = `${Math.round(E)} cm`;
const L = document.createElement("span");
L.textContent = w, y.append(v, L), b.append(y);
}
const M = document.createElement("p");
M.textContent = `Talla recomendada: ${u}.`, g.append(p, b, M), ce(r[l][0]);
} catch (a) {
O(a.message || "No pude medir. Usa fotos de cuerpo entero con buena luz.");
}
o.disabled = !1, o.textContent = "Calcular mi talla";
}, i("btnCama").onclick = () => {
const t = N(i("bW").value, 60, 250), e = N(i("bL").value, 150, 230), n = N(i("bH").value, 5, 60);
if (!t || !e || !n) return O("Revisa las medidas del colchón.");
const a = [["Sencilla", 100, 190, "SENCILL"], ["Semidoble", 120, 190, "SEMI"], ["Doble", 140, 190, "DOBLE"], ["Queen", 160, 190, "QUEEN"], ["King", 200, 200, "KING"]].reduce((c, f) => Math.abs(f[1] - t) + Math.abs(f[2] - e) < Math.abs(c[1] - t) + Math.abs(c[2] - e) ? f : c), s = i("res");
s.hidden = !1, s.replaceChildren();
const d = document.createElement("div");
d.className = "size", d.textContent = a[0];
const u = document.createElement("p");
u.textContent = `Tu colchón es ${a[0].toLowerCase()} (${a[1]} × ${a[2]} cm). Protector y sábana ajustable: necesitas un fondo de ${Math.ceil(n + 5)} cm o más. Cobija o edredón: mínimo ${t + 60} × ${e + 30} cm para que cuelgue a los lados.`, s.append(d, u), ce(a[3]), i("dW").value = a[1], i("dL").value = a[2], i("dH").value = n;
};
let re = null;
function ce(t) {
if (!h.all) return gt();
const e = t.toUpperCase(), n = h.variants[W]?.options?.[0];
re = h.all.find((o) => o.options[0] === n && o.options.some((a) => a.toUpperCase().includes(e))) || h.all.find((o) => o.options.some((a) => a.toUpperCase().includes(e))) || null, gt(t);
}
function gt(t) {
const e = h?.url;
if (i("btnBuy").hidden = !e, !e) return;
const n = re || (h.variants[W]?.id ? h.variants[W] : null);
i("btnBuy").href = n?.id ? `${e}?variant=${n.id}` : e, i("btnBuy").textContent = t ? `Comprar ${t.toLowerCase().replace("sencill", "sencilla")}` : "Comprar";
}
let bt = null, rt = null;
i("btnShot").onclick = async () => {
if (S === "tres") {
i("mv").activateAR?.();
return;
}
if (S === "espacio")
return mt = !1, D(), bt = k.toDataURL("image/jpeg", 0.9), mt = !0, D(), rt = Et ? J(Et, 1280).toDataURL("image/jpeg", 0.88) : null, le(bt);
if (S !== "probar") return;
if (!_ && !j) return O("Activa la cámara o sube una foto primero.");
bt = Vt.toDataURL("image/jpeg", 0.9);
const t = j || T;
rt = J(t.videoWidth ? (() => {
const n = Object.assign(document.createElement("canvas"), { width: T.videoWidth, height: T.videoHeight });
return n.getContext("2d").drawImage(T, 0, 0), n;
})() : t, 1280).toDataURL("image/jpeg", 0.88), le(bt);
};
function le(t) {
i("shot").hidden = !1, i("shotT").textContent = "Tu foto", i("shotImg").src = t, i("spin").hidden = !0;
}
i("btnSave").onclick = async () => {
const t = await (await fetch(i("shotImg").src)).blob(), e = new File([t], "probador-litper.jpg", { type: t.type || "image/jpeg" });
if (navigator.canShare?.({ files: [e] }))
try {
await navigator.share({ files: [e], title: h.title });
return;
} catch {
}
const n = document.createElement("a");
n.href = URL.createObjectURL(t), n.download = "probador-litper.jpg", n.click(), setTimeout(() => URL.revokeObjectURL(n.href), 4e3);
};
async function de() {
if (!rt)
if (S === "probar" && (_ || j))
i("btnShot").click();
else return O("Toma primero la foto.");
i("shot").hidden = !1, i("spin").hidden = !1, i("shotT").textContent = "Versión ultra realista";
const t = h.variants[W], e = new URL(t.image, location.href).href, n = G.includes(h.kind);
try {
const o = await fetch(n ? "/api/tryon" : "/api/hogar", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(n ? { person: rt, garment: e, category: h.kind } : { room: rt, product: e, kind: h.kind, title: h.title }) }), a = await o.json().catch(() => ({}));
if (!o.ok) throw new Error(a.error === "sin_llave" ? "La versión con IA se activa cuando Litper conecte su llave de IA. Mientras tanto usa la cámara en vivo." : a.message || "La IA no respondió. Intenta otra vez.");
i("shotImg").src = a.image;
} catch (o) {
O(o.message, 5e3);
}
i("spin").hidden = !0;
}
i("btnAI").onclick = de, i("btnAI2").onclick = de;
const ue = document.querySelector(".bottom");
new ResizeObserver(() => {
document.documentElement.style.setProperty("--foot", Math.round(ue.getBoundingClientRect().height - 8) + "px"), j && ot(j, !1);
}).observe(ue), Oe().then(() => tt(G.includes(h.kind) ? "probar" : "espacio")), window.__probador = { get mode() {
return S;
}, get LM() {
return B;
}, get P() {
return h;
}, get backView() {
return K;
} };
