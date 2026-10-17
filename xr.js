async function C() {
try {
return !!(navigator.xr && await navigator.xr.isSessionSupported("immersive-ar"));
} catch {
return !1;
}
}
const k = (f, c) => {
const y = new Float32Array(16);
for (let n = 0; n < 4; n++) for (let e = 0; e < 4; e++) {
let m = 0;
for (let g = 0; g < 4; g++) m += f[g * 4 + e] * c[n * 4 + g];
y[n * 4 + e] = m;
}
return y;
};
async function E(f, c) {
const n = document.createElement("canvas").getContext("webgl2", { xrCompatible: !0 }), e = await navigator.xr.requestSession("immersive-ar", {
requiredFeatures: ["hit-test", "local"],
optionalFeatures: ["dom-overlay"],
domOverlay: { root: f }
});
f.hidden = !1, await n.makeXRCompatible(), e.updateRenderState({ baseLayer: new XRWebGLLayer(e, n) });
const m = await e.requestReferenceSpace("local"), g = await e.requestReferenceSpace("viewer"), S = await e.requestHitTestSource({ space: g }), r = [];
let l = null, u = [];
const A = f.querySelector("svg"), w = (s) => s < 1 ? `${(s * 100).toFixed(1)} cm` : `${s.toFixed(2)} m`, h = (s, d) => Math.hypot(s[0] - d[0], s[1] - d[1], s[2] - d[2]);
return c.add.onclick = () => {
l && (r.push(l.slice()), r.length % 2 === 0 && u.push([r[r.length - 2], r[r.length - 1]]), navigator.vibrate?.(15));
}, c.undo.onclick = () => {
r.length % 2 === 0 && u.length && u.pop(), r.pop();
}, c.close.onclick = () => e.end(), e.addEventListener("end", () => {
f.hidden = !0, S.cancel?.(), c.onEnd?.(u.map(([s, d]) => h(s, d)));
}), e.requestAnimationFrame(function s(d, b) {
e.requestAnimationFrame(s);
const R = b.getViewerPose(m), q = e.renderState.baseLayer;
n.bindFramebuffer(n.FRAMEBUFFER, q.framebuffer), n.clearColor(0, 0, 0, 0), n.clear(n.COLOR_BUFFER_BIT);
const L = b.getHitTestResults(S);
if (l = L.length ? Array.from(L[0].getPose(m).transform.position).slice(0, 3) : null, c.reticle.classList.toggle("ok", !!l), !R) return;
const $ = R.views[0], M = q.getViewport($), o = k($.projectionMatrix, $.transform.inverse.matrix), F = (t) => {
const v = o[0] * t[0] + o[4] * t[1] + o[8] * t[2] + o[12], i = o[1] * t[0] + o[5] * t[1] + o[9] * t[2] + o[13], a = o[3] * t[0] + o[7] * t[1] + o[11] * t[2] + o[15];
return a <= 0 ? null : [(v / a * 0.5 + 0.5) * innerWidth, (1 - (i / a * 0.5 + 0.5)) * innerHeight];
};
let p = "";
const x = r.length % 2 === 1 && l ? [[r[r.length - 1], l]] : [];
for (const [t, v] of [...u, ...x]) {
const i = F(t), a = F(v);
!i || !a || (p += `<line x1="${i[0]}" y1="${i[1]}" x2="${a[0]}" y2="${a[1]}"/><circle cx="${i[0]}" cy="${i[1]}" r="6"/><circle cx="${a[0]}" cy="${a[1]}" r="6"/>`, p += `<text x="${(i[0] + a[0]) / 2}" y="${(i[1] + a[1]) / 2 - 12}">${w(h(t, v))}</text>`);
}
if (r.length % 2 === 1 && !l) {
const t = F(r[r.length - 1]);
t && (p += `<circle cx="${t[0]}" cy="${t[1]}" r="6"/>`);
}
A.innerHTML = p, c.read.textContent = x.length ? w(h(x[0][0], x[0][1])) : u.length ? w(h(...u[u.length - 1])) : l ? "Toca + en el primer punto" : "Mueve el celular despacio sobre la superficie";
}), e;
}
export {
E as startMeasure,
C as xrSupported
};
