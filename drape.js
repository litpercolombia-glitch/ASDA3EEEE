// Modelos 3D de textiles a medida real (metros) para AR en vivo.
// Genera GLB en el navegador: tela con caída y pliegues + muebles base.

function mesh() { return { P: [], N: [], U: [], I: [] }; }
function normals(m) {
  const n = new Float32Array(m.P.length);
  for (let i = 0; i < m.I.length; i += 3) {
    const [a, b, c] = [m.I[i] * 3, m.I[i + 1] * 3, m.I[i + 2] * 3];
    const ux = m.P[b] - m.P[a], uy = m.P[b + 1] - m.P[a + 1], uz = m.P[b + 2] - m.P[a + 2];
    const vx = m.P[c] - m.P[a], vy = m.P[c + 1] - m.P[a + 1], vz = m.P[c + 2] - m.P[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    for (const k of [a, b, c]) { n[k] += nx; n[k + 1] += ny; n[k + 2] += nz; }
  }
  for (let i = 0; i < n.length; i += 3) { const l = Math.hypot(n[i], n[i + 1], n[i + 2]) || 1; n[i] /= l; n[i + 1] /= l; n[i + 2] /= l; }
  m.N = Array.from(n); return m;
}
function grid(m, cols, rows, f) { // f(u,v)->{p:[x,y,z], uv:[s,t]}
  const o = m.P.length / 3;
  for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) { const r = f(i / cols, j / rows); m.P.push(...r.p); m.U.push(...r.uv); }
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const a = o + j * (cols + 1) + i, b = a + 1, c = a + cols + 1, d = c + 1; m.I.push(a, c, b, b, c, d); }
  return m;
}
function box(m, x0, y0, z0, x1, y1, z1) {
  const q = (a, b, c, d) => { const o = m.P.length / 3; [a, b, c, d].forEach((p) => { m.P.push(...p); m.U.push(0, 0); }); m.I.push(o, o + 1, o + 2, o, o + 2, o + 3); };
  q([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]); q([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]);
  q([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]); q([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]);
  q([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]); q([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]);
  return m;
}
// Tela sobre una superficie W×L a altura H con caída D por los lados (sin cabecera)
function drapeCloth(W, L, H, D, rep, head = false) {
  const m = mesh(), cols = 70, rows = 80, uW = W + 2 * D, uL = L + D + (head ? D : 0.02);
  return normals(grid(m, cols, rows, (a, b) => {
    const u = a * uW - D, v = b * uL - (head ? D : 0.02); // u en [-D, W+D], v en [-?, L+D]
    const sx = u < 0 ? -u : u > W ? u - W : 0, sz = v > L ? v - L : v < 0 ? -v : 0;
    const s = Math.max(sx, sz);
    let x = Math.min(Math.max(u, 0), W), z = Math.min(Math.max(v, 0), L), y = H + 0.012;
    if (s > 0) {
      const t = s / D, fold = Math.sin((sx > 0 ? v : u) * Math.PI * 2 / 0.22) * 0.018 * t;
      const roll = Math.min(s, 0.03); // borde redondeado
      y = H + 0.012 - (s - roll * 0.5);
      if (sx > 0) x = (u < 0 ? -1 : 1) * (roll + fold) + (u < 0 ? 0 : W); else x += fold * 0.6;
      if (sz > 0) z = (v > L ? L + roll : -roll) + (sx > 0 ? 0 : fold);
      if (sx > 0 && sz > 0) { y = H + 0.012 - s * 1.05; }
      y = Math.max(y, 0.005);
    } else {
      y += Math.sin(u * 9) * Math.sin(v * 7) * 0.004; // arrugas suaves sobre la cama
    }
    return { p: [x - W / 2, y, z - L / 2], uv: [(a * rep) % 1e9, b * rep * (uL / uW)] };
  }));
}
function curtain(W, H, rep) {
  const m = mesh(), pleat = 0.11, amp = 0.035, cols = Math.max(40, Math.round(W / pleat * 6)), rows = 40;
  return normals(grid(m, cols, rows, (a, b) => {
    const x = a * W, y = (1 - b) * H, z = Math.sin(x / pleat * Math.PI * 2) * amp * (0.7 + 0.3 * b);
    return { p: [x - W / 2, y, z + amp + 0.06], uv: [a * rep, b * rep * (H / W)] };
  }));
}

/* ---------- GLB ---------- */
function glb(parts, materials, img) {
  const bufs = [], views = [], accs = [], prims = [];
  let off = 0; const pad = (n) => (n + 3) & ~3;
  const push = (arr, target) => { views.push({ buffer: 0, byteOffset: off, byteLength: arr.byteLength, ...(target ? { target } : {}) }); bufs.push([off, arr]); off = pad(off + arr.byteLength); return views.length - 1; };
  for (const p of parts) {
    const pos = new Float32Array(p.P), mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
    for (let i = 0; i < pos.length; i += 3) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], pos[i + k]); mx[k] = Math.max(mx[k], pos[i + k]); }
    if (!p.N.length) normals(p);
    const n = pos.length / 3, idx = n > 65535 ? new Uint32Array(p.I) : new Uint16Array(p.I);
    const a0 = accs.length;
    accs.push({ bufferView: push(pos, 34962), componentType: 5126, count: n, type: 'VEC3', min: mn, max: mx });
    accs.push({ bufferView: push(new Float32Array(p.N), 34962), componentType: 5126, count: n, type: 'VEC3' });
    accs.push({ bufferView: push(new Float32Array(p.U), 34962), componentType: 5126, count: n, type: 'VEC2' });
    accs.push({ bufferView: push(idx, 34963), componentType: idx instanceof Uint32Array ? 5125 : 5123, count: idx.length, type: 'SCALAR' });
    prims.push({ attributes: { POSITION: a0, NORMAL: a0 + 1, TEXCOORD_0: a0 + 2 }, indices: a0 + 3, material: p.mat });
  }
  const json = { asset: { version: '2.0', generator: 'Litper Probador' }, scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0 }], meshes: [{ primitives: prims }], accessors: accs, bufferViews: views, buffers: [] };
  json.materials = materials.map((m) => ({ pbrMetallicRoughness: { baseColorFactor: [...(m.color || [1, 1, 1]), 1], metallicFactor: 0, roughnessFactor: m.rough ?? 0.92, ...(m.tex ? { baseColorTexture: { index: 0 } } : {}) }, doubleSided: true }));
  if (img) { json.images = [{ bufferView: push(img.bytes, 0), mimeType: img.mime }]; json.textures = [{ sampler: 0, source: 0 }]; json.samplers = [{ magFilter: 9729, minFilter: 9987, wrapS: 33648, wrapT: 33648 }]; }
  json.bufferViews.forEach((v) => { if (!v.target) delete v.target; });
  json.buffers = [{ byteLength: off }];
  const bin = new Uint8Array(off); bufs.forEach(([o, a]) => bin.set(new Uint8Array(a.buffer, a.byteOffset, a.byteLength), o));
  const js = new TextEncoder().encode(JSON.stringify(json)), jl = pad(js.length), jp = new Uint8Array(jl).fill(32); jp.set(js);
  const total = 28 + jl + off, out = new ArrayBuffer(total), dv = new DataView(out), u8 = new Uint8Array(out);
  dv.setUint32(0, 0x46546c67, true); dv.setUint32(4, 2, true); dv.setUint32(8, total, true);
  dv.setUint32(12, jl, true); dv.setUint32(16, 0x4e4f534a, true); u8.set(jp, 20);
  dv.setUint32(20 + jl, off, true); dv.setUint32(24 + jl, 0x004e4942, true); u8.set(bin, 28 + jl);
  return new Blob([out], { type: 'model/gltf-binary' });
}

// Textura de tela: recorte de la foto del producto, espejada 2×2 para que no se noten uniones
export async function fabricTexture(img, crop = [0.3, 0.62, 0.4, 0.22]) {
  const c = document.createElement('canvas'); c.width = c.height = 1024; const x = c.getContext('2d');
  const sw = img.width * crop[2], sh = img.height * crop[3], sx = img.width * crop[0], sy = img.height * crop[1];
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    x.save(); x.translate(i * 512 + (i ? 512 : 0), j * 512 + (j ? 512 : 0)); x.scale(i ? -1 : 1, j ? -1 : 1);
    x.drawImage(img, sx, sy, sw, sh, 0, 0, 512, 512); x.restore();
  }
  const b = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.88));
  return { bytes: new Uint8Array(await b.arrayBuffer()), mime: 'image/jpeg', canvas: c };
}

// Tela de color sólido con su textura (acolchado en rombos, cuadros de plumón o tejido de cortina)
export async function solidFabric(rgb, style) {
  const c = document.createElement('canvas'); c.width = c.height = 1024; const x = c.getContext('2d');
  const [r, g, b] = rgb, col = (k) => `rgb(${Math.round(r * k)},${Math.round(g * k)},${Math.round(b * k)})`;
  x.fillStyle = col(1); x.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 9000; i++) { x.fillStyle = Math.random() < .5 ? col(0.93) : col(1.06); x.fillRect(Math.random() * 1024, Math.random() * 1024, 2, 2); }
  if (style === 'rombos' || style === 'cuadros') {
    const step = style === 'rombos' ? 128 : 256; x.lineWidth = 6;
    for (let k = -1024; k <= 2048; k += step) {
      const grad = (x0, y0, x1, y1) => { x.strokeStyle = col(0.72); x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke(); x.strokeStyle = col(1.12); x.lineWidth = 3; x.beginPath(); x.moveTo(x0 + 5, y0); x.lineTo(x1 + 5, y1); x.stroke(); x.lineWidth = 6; };
      if (style === 'rombos') { grad(k, 0, k + 1024, 1024); grad(k, 1024, k + 1024, 0); } else { grad(k, 0, k, 1024); grad(0, k, 1024, k); }
    }
  } else { for (let i = 0; i < 1024; i += 6) { x.fillStyle = i % 12 ? col(0.97) : col(1.04); x.fillRect(i, 0, 3, 1024); } }
  const bl = await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.9));
  return { bytes: new Uint8Array(await bl.arrayBuffer()), mime: 'image/jpeg', canvas: c };
}

const LINEN = [0.93, 0.92, 0.9], WOOD = [0.42, 0.29, 0.18];
// kind: cama | cobija | cortina | mantel ; dims en cm
export function buildModel(kind, dims, tex) {
  const W = dims.w / 100, L = dims.l / 100, H = (dims.h || 30) / 100;
  if (kind === 'cortina') {
    const parts = [Object.assign(curtain(W * 0.5, L, 2), { mat: 0 }), Object.assign(curtain(W * 0.5, L, 2), { mat: 0 })];
    parts[0].P = parts[0].P.map((v, i) => (i % 3 === 0 ? v - W * 0.27 : v)); parts[1].P = parts[1].P.map((v, i) => (i % 3 === 0 ? v + W * 0.27 : v));
    const rod = Object.assign(box(mesh(), -W * 0.58, L - 0.01, 0.04, W * 0.58, L + 0.02, 0.07), { mat: 1 });
    return { blob: glb([...parts, rod], [{ tex: true }, { color: [0.2, 0.2, 0.22], rough: 0.4 }], tex), placement: 'wall' };
  }
  if (kind === 'mantel') {
    const top = 0.75, cloth = Object.assign(drapeCloth(W, L, top, 0.24, 2, true), { mat: 0 });
    const t = mesh(); box(t, -W / 2, top - 0.03, -L / 2, W / 2, top, L / 2);
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(t, x * (W / 2 - 0.06) - 0.03, 0, z * (L / 2 - 0.06) - 0.03, x * (W / 2 - 0.06) + 0.03, top - 0.03, z * (L / 2 - 0.06) + 0.03);
    return { blob: glb([cloth, Object.assign(t, { mat: 1 })], [{ tex: true }, { color: WOOD, rough: 0.6 }], tex), placement: 'floor' };
  }
  const drop = kind === 'cobija' ? 0.32 : 0.3;
  const cloth = Object.assign(drapeCloth(W, L, kind === 'cobija' ? 0.0 + H : H, Math.min(drop, H + 0.25), 2), { mat: 0 });
  if (kind === 'cobija') return { blob: glb([cloth], [{ tex: true }], tex), placement: 'floor' };
  const bed = mesh(); box(bed, -W / 2, 0.0, -L / 2, W / 2, H, L / 2);
  const frame = mesh(); box(frame, -W / 2 - 0.03, 0, -L / 2 - 0.08, W / 2 + 0.03, H + 0.75, -L / 2 - 0.02);
  const pil = mesh(); const pw = W > 1.3 ? W / 2 - 0.08 : W - 0.2;
  for (const cx of W > 1.3 ? [-W / 4, W / 4] : [0]) box(pil, cx - pw / 2, H + 0.02, -L / 2 + 0.04, cx + pw / 2, H + 0.15, -L / 2 + 0.42);
  return { blob: glb([cloth, Object.assign(bed, { mat: 1 }), Object.assign(frame, { mat: 2 }), Object.assign(pil, { mat: 1 })], [{ tex: true }, { color: LINEN }, { color: WOOD, rough: 0.7 }], tex), placement: 'floor' };
}
