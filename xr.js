// Medidor AR (como la app Medida del iPhone): WebXR + hit-test sobre superficies reales.
// Android + Chrome con ARCore. En iPhone se usa la medición por foto con tarjeta.

export async function xrSupported() {
  try { return !!(navigator.xr && (await navigator.xr.isSessionSupported('immersive-ar'))); } catch { return false; }
}

const mul = (a, b) => { const o = new Float32Array(16); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s; } return o; };

export async function startMeasure(overlay, ui) {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2', { xrCompatible: true });
  const session = await navigator.xr.requestSession('immersive-ar', {
    requiredFeatures: ['hit-test', 'local'], optionalFeatures: ['dom-overlay'], domOverlay: { root: overlay },
  });
  overlay.hidden = false;
  await gl.makeXRCompatible();
  session.updateRenderState({ baseLayer: new XRWebGLLayer(session, gl) });
  const ref = await session.requestReferenceSpace('local');
  const viewer = await session.requestReferenceSpace('viewer');
  const hitSrc = await session.requestHitTestSource({ space: viewer });
  const pts = []; let cur = null, segs = [];
  const svg = overlay.querySelector('svg');
  const fmt = (m) => (m < 1 ? `${(m * 100).toFixed(1)} cm` : `${m.toFixed(2)} m`);
  const d3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

  ui.add.onclick = () => { if (!cur) return; pts.push(cur.slice()); if (pts.length % 2 === 0) segs.push([pts[pts.length - 2], pts[pts.length - 1]]); navigator.vibrate?.(15); };
  ui.undo.onclick = () => { if (pts.length % 2 === 0 && segs.length) segs.pop(); pts.pop(); };
  ui.close.onclick = () => session.end();
  session.addEventListener('end', () => { overlay.hidden = true; hitSrc.cancel?.(); ui.onEnd?.(segs.map(([a, b]) => d3(a, b))); });

  session.requestAnimationFrame(function frame(t, f) {
    session.requestAnimationFrame(frame);
    const pose = f.getViewerPose(ref); const layer = session.renderState.baseLayer;
    gl.bindFramebuffer(gl.FRAMEBUFFER, layer.framebuffer); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    const hits = f.getHitTestResults(hitSrc);
    cur = hits.length ? Array.from(hits[0].getPose(ref).transform.position).slice(0, 3) : null;
    ui.reticle.classList.toggle('ok', !!cur);
    if (!pose) return;
    const view = pose.views[0], vp = layer.getViewport(view), M = mul(view.projectionMatrix, view.transform.inverse.matrix);
    const proj = (p) => { const x = M[0] * p[0] + M[4] * p[1] + M[8] * p[2] + M[12], y = M[1] * p[0] + M[5] * p[1] + M[9] * p[2] + M[13], w = M[3] * p[0] + M[7] * p[1] + M[11] * p[2] + M[15]; if (w <= 0) return null; return [((x / w) * 0.5 + 0.5) * innerWidth, (1 - ((y / w) * 0.5 + 0.5)) * innerHeight]; };
    let html = '';
    const live = pts.length % 2 === 1 && cur ? [[pts[pts.length - 1], cur]] : [];
    for (const [a, b] of [...segs, ...live]) {
      const A = proj(a), B = proj(b); if (!A || !B) continue;
      html += `<line x1="${A[0]}" y1="${A[1]}" x2="${B[0]}" y2="${B[1]}"/><circle cx="${A[0]}" cy="${A[1]}" r="6"/><circle cx="${B[0]}" cy="${B[1]}" r="6"/>`;
      html += `<text x="${(A[0] + B[0]) / 2}" y="${(A[1] + B[1]) / 2 - 12}">${fmt(d3(a, b))}</text>`;
    }
    if (pts.length % 2 === 1 && !cur) { const A = proj(pts[pts.length - 1]); if (A) html += `<circle cx="${A[0]}" cy="${A[1]}" r="6"/>`; }
    svg.innerHTML = html;
    ui.read.textContent = live.length ? fmt(d3(live[0][0], live[0][1])) : segs.length ? fmt(d3(...segs[segs.length - 1])) : cur ? 'Toca + en el primer punto' : 'Mueve el celular despacio sobre la superficie';
    void vp;
  });
  return session;
}
