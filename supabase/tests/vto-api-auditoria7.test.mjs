// Pruebas de la auditoría 7 (vto-api): moderación que falla cerrada, devolución del cupo y clasificador.
// NO llama a Cloudflare ni a Supabase: carga supabase/functions/vto-api/index.ts con Supabase, Deno y fetch simulados.
// Correr: node --test supabase/tests/   (Node 22.13+; usa module.stripTypeScriptTypes)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { stripTypeScriptTypes } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');

/* ---------- simulaciones ---------- */
const calls = { rpc: [], cf: 0, mod: 0 };
let modRespuestas = []; // cola de respuestas simuladas de Moondream (string | {status} | 'timeout')
const usage = new Map(); // contador simulado de vto_add_utc / vto_get_utc / vto_mod_cupo
let modCaida = false;
const sbMock = {
  rpc: async (name, args) => {
    calls.rpc.push([name, args]);
    if (name === 'vto_secret') return { data: { VTO_CF_API_TOKEN: 'tk', VTO_CF_ACCOUNT_ID: 'acc', VTO_SALT: 'salt' }[args.n] ?? null };
    if (name === 'vto_take4') return { data: { ok: true, restan: 10, restan_sesion: 7 } };
    if (name === 'vto_add_utc') { const n = (usage.get(args.p_key) || 0) + args.p_n; usage.set(args.p_key, n); return { data: n }; }
    if (name === 'vto_get_utc') return { data: usage.get(args.p_key) || 0 };
    if (name === 'vto_mod_cupo') { // mismo contrato que la función SQL (reserva condicional; liberar nunca baja de 0)
      if (modCaida) return { data: null, error: { message: 'db caida' } };
      await new Promise((r) => setTimeout(r, Math.random() * 3)); // intercalado entre pruebas simultáneas
      const n = usage.get(args.p_key) || 0;
      if (args.p_n >= 0) { if (n >= args.p_max) return { data: -1 }; usage.set(args.p_key, n + 1); return { data: n + 1 }; }
      usage.set(args.p_key, Math.max(0, n - 1)); return { data: Math.max(0, n - 1) };
    }
    return { data: null };
  },
  from: (table) => {
    const q = {
      select: () => q, eq: () => q,
      maybeSingle: async () => ({ data: table === 'vto_tenants' ? { id: 'litper', shop_domain: 'litper.store', plan: 'pro', estado: 'activo', config: { ropa: true } } : { n: 0 } }),
      insert: async () => ({ data: null }),
    };
    return q;
  },
};
globalThis.__sbMock = sbMock;
globalThis.Deno = { env: { get: () => 'x' }, serve: () => {} };
const PNG = 'data:image/png;base64,' + Buffer.alloc(3000, 7).toString('base64');
globalThis.fetch = async (url) => {
  const u = String(url);
  if (u.includes('/products/camiseta-basica.js')) return new Response(JSON.stringify({ id: 1, title: 'Camiseta básica algodón', type: 'Camisetas', handle: 'camiseta-basica', tags: [], options: [{ name: 'Talla', values: ['S', 'M', 'L'] }], variants: [{ id: 11, title: 'S' }], images: ['//litper.store/cdn/camiseta.jpg'], media: [] }), { headers: { 'content-type': 'application/json' } });
  if (u.includes('/cdn/camiseta.jpg')) return new Response(Buffer.alloc(3000, 1), { headers: { 'content-type': 'image/jpeg' } });
  if (u.includes('moondream')) {
    calls.mod++;
    const r = modRespuestas.length ? modRespuestas.shift() : '{"person": true, "minor": false, "nudity_or_underwear": false}';
    if (r === 'timeout') { const e = new Error('timeout'); e.name = 'TimeoutError'; throw e; }
    if (r && typeof r === 'object' && r.status) return new Response(JSON.stringify({ errors: [{ code: 1 }] }), { status: r.status });
    return new Response(JSON.stringify({ result: { answer: r } }), { headers: { 'content-type': 'application/json' } });
  }
  if (u.includes('flux-2-klein')) { calls.cf++; return new Response(JSON.stringify({ result: { image: 'iVBORw0KGgo' + 'A'.repeat(100) } })); }
  throw new Error('fetch no simulado: ' + u);
};

/* ---------- carga del módulo real ---------- */
let src = fs.readFileSync(path.join(root, 'supabase/functions/vto-api/index.ts'), 'utf8');
src = src.replace(/^import \{ createClient \} from 'npm:@supabase\/supabase-js@[^']+';$/m, 'const createClient = () => globalThis.__sbMock;');
src = stripTypeScriptTypes(src, { mode: 'strip' }) + '\nexport { actionAI, veredicto, kindOf, newTok, consentDe };\n';
const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'vto7-')), 'vto.mjs');
fs.writeFileSync(tmp, src);
const M = await import(pathToFileURL(tmp).href);
const U = await import(pathToFileURL(path.join(root, 'api/_util.js')).href);

/* ---------- 1) veredicto: solo pasa con los dos campos en false booleano ---------- */
const casos = [
  ['{"person": true, "minor": false, "nudity_or_underwear": false}', 'ok'],
  ['Respuesta: {"minor": false, "nudity_or_underwear": false} listo', 'ok'],
  ['{"person": true, "minor": true, "nudity_or_underwear": false}', 'bloquear'],
  ['{"person": true, "minor": false, "nudity_or_underwear": true}', 'bloquear'],
  ['{"minor": "true", "nudity_or_underwear": false}', 'bloquear'],
  ['{"minor": false, "nudity_or_underwear": "yes"}', 'bloquear'],
  ['{"minor": 1, "nudity_or_underwear": false}', 'bloquear'],
  ['{"minor": "false", "nudity_or_underwear": false}', 'duda'], // texto, no booleano
  ['{"minor": "no", "nudity_or_underwear": false}', 'duda'],
  ['{"minor": null, "nudity_or_underwear": false}', 'duda'],
  ['{"person": true, "nudity_or_underwear": false}', 'duda'], // falta minor
  ['{"person": true, "minor": false}', 'duda'], // falta nudity_or_underwear
  ['{"person": true}', 'duda'],
  ['{}', 'duda'],
  ['{minor: false, nudity_or_underwear: false}', 'duda'], // JSON inválido
  ['no puedo responder', 'duda'],
  ['', 'duda'],
  [null, 'duda'],
  [42, 'duda'],
];
for (const [txt, esperado] of casos) test(`veredicto ${JSON.stringify(txt)} → ${esperado}`, () => assert.equal(M.veredicto(txt).estado, esperado));

/* ---------- 2) flujo completo de una prueba de ropa con respuestas simuladas ---------- */
async function prueba() {
  const tok = await M.newTok('salt', 'litper');
  const body = { tenant: 'litper', tok, consiento: true, consent: { v: '2026-11-19', h: await M.consentDe('ropa') }, handle: 'camiseta-basica', product: '//litper.store/cdn/camiseta.jpg', photo: PNG, w: 512, h: 512 };
  const req = new Request('https://x/vto-api', { method: 'POST', headers: { 'cf-connecting-ip': '200.1.2.' + Math.floor(Math.random() * 250) } });
  calls.rpc = []; calls.cf = 0; calls.mod = 0;
  const [status, out] = await M.actionAI(body, req);
  const refund = calls.rpc.filter(([n]) => n === 'vto_refund2');
  return { status, out, refund, cf: calls.cf, mod: calls.mod };
}
const OK = '{"person": true, "minor": false, "nudity_or_underwear": false}';
const flujo = [
  // [nombre, respuestas de moderación (antes, después), status, generó IA, devuelve cupo]
  ['todo limpio', [OK, OK], 200, 1, false],
  ['menor antes', ['{"minor": true, "nudity_or_underwear": false}'], 422, 0, true],
  ['"true" texto antes', ['{"minor": "true", "nudity_or_underwear": false}'], 422, 0, true],
  ['falta clave antes', ['{"person": true, "minor": false}'], 503, 0, true],
  ['null antes', ['{"minor": null, "nudity_or_underwear": false}'], 503, 0, true],
  ['JSON inválido antes', ['{minor:false}'], 503, 0, true],
  ['timeout antes', ['timeout'], 503, 0, true],
  ['HTTP 500 antes', [{ status: 500 }], 503, 0, true],
  ['desnudo después', [OK, '{"minor": false, "nudity_or_underwear": true}'], 422, 1, true],
  ['"yes" después', [OK, '{"minor": false, "nudity_or_underwear": "yes"}'], 422, 1, true],
  ['falta clave después', [OK, '{"person": true}'], 503, 1, true],
  ['timeout después', [OK, 'timeout'], 503, 1, true],
];
for (const [nombre, resp, st, cf, devuelve] of flujo) {
  test(`flujo: ${nombre} → ${st}${devuelve ? ' + cupo devuelto' : ''}`, async () => {
    modRespuestas = [...resp];
    const r = await prueba();
    assert.equal(r.status, st, JSON.stringify(r.out));
    assert.equal(r.cf, cf, 'llamadas simuladas a la IA de imagen');
    assert.equal(r.refund.length, devuelve ? 1 : 0, 'vto_refund2 (IP + sesión + tienda, atómico)');
    if (devuelve) { const a = r.refund[0][1]; assert.ok(a.p_ip && a.p_tenant === 'litper' && a.p_tok); }
    if (st !== 200) assert.equal(r.out.image, undefined, 'nunca devuelve imagen si la moderación no pasó limpia');
  });
}
test('tope de 6 rechazos de moderación por IP y día (el reembolso no es infinito)', async () => {
  usage.clear();
  const ipFija = '201.9.9.9';
  const tok = await M.newTok('salt', 'litper');
  const body = { tenant: 'litper', tok, consiento: true, consent: { v: '2026-11-19', h: await M.consentDe('ropa') }, handle: 'camiseta-basica', product: '//litper.store/cdn/camiseta.jpg', photo: PNG, w: 512, h: 512 };
  const sts = [];
  for (let i = 0; i < 7; i++) {
    modRespuestas = ['{"minor": true, "nudity_or_underwear": false}'];
    const [s] = await M.actionAI(body, new Request('https://x', { method: 'POST', headers: { 'cf-connecting-ip': ipFija } }));
    sts.push(s);
  }
  assert.deepEqual(sts, [422, 422, 422, 422, 422, 422, 429]);
});
// auditoría 8: el tope se reserva ANTES de moderar (atómico): 20 pruebas simultáneas que fallan → solo 6 llegan a moderar
test('auditoría 8: 20 pruebas simultáneas con moderación fallida → 6 moderan, 14 reciben limite_moderacion', async () => {
  usage.clear(); calls.mod = 0; calls.rpc = [];
  const tok = await M.newTok('salt', 'litper');
  const body = { tenant: 'litper', tok, consiento: true, consent: { v: '2026-11-19', h: await M.consentDe('ropa') }, handle: 'camiseta-basica', product: '//litper.store/cdn/camiseta.jpg', photo: PNG, w: 512, h: 512 };
  modRespuestas = Array(20).fill('{"minor": true, "nudity_or_underwear": false}');
  const rs = await Promise.all(Array.from({ length: 20 }, () => M.actionAI(body, new Request('https://x', { method: 'POST', headers: { 'cf-connecting-ip': '203.3.3.3' } }))));
  const sts = rs.map(([s]) => s);
  assert.equal(sts.filter((s) => s === 422).length, 6);
  assert.equal(sts.filter((s) => s === 429).length, 14);
  assert.ok(rs.filter(([s]) => s === 429).every(([, o]) => o.error === 'limite_moderacion'), 'mensaje propio, no limite_ip');
  assert.equal(calls.mod, 6, 'solo 6 llamadas a la moderación');
  assert.equal(calls.rpc.filter(([n]) => n === 'vto_refund2').length, 20, 'todas devuelven el cupo general');
  assert.ok([...usage.values()].every((n) => n >= 0 && n <= 6));
});
test('auditoría 8: prueba limpia libera la reserva (no gasta tope) y nunca queda negativo', async () => {
  usage.clear();
  const tok = await M.newTok('salt', 'litper');
  const body = { tenant: 'litper', tok, consiento: true, consent: { v: '2026-11-19', h: await M.consentDe('ropa') }, handle: 'camiseta-basica', product: '//litper.store/cdn/camiseta.jpg', photo: PNG, w: 512, h: 512 };
  for (let i = 0; i < 10; i++) { modRespuestas = [OK, OK]; const [s] = await M.actionAI(body, new Request('https://x', { method: 'POST', headers: { 'cf-connecting-ip': '204.4.4.4' } })); assert.equal(s, 200); }
  assert.ok([...usage.entries()].filter(([k]) => k.startsWith('modfallo:')).every(([, n]) => n === 0));
});
test('auditoría 8: base sin respuesta en la reserva → 503 servicio_ocupado, sin moderar ni IA, cupo devuelto', async () => {
  usage.clear(); calls.mod = 0; calls.cf = 0; calls.rpc = []; modCaida = true;
  try {
    const r = await prueba();
    assert.equal(r.status, 503); assert.equal(r.out.error, 'servicio_ocupado'); assert.equal(r.mod, 0); assert.equal(r.cf, 0); assert.equal(r.refund.length, 1);
  } finally { modCaida = false; }
});

/* ---------- 3) clasificador: igual en el servidor y en api/_util.js ---------- */
const P = (title, extra = {}) => ({ title, ...extra });
const esperados = [
  [P('Camiseta básica algodón', { options: [{ name: 'Talla', values: ['S', 'M', 'L', 'XL'] }] }), 'ropa'],
  [P('Camiseta estampada talla niño'), 'bloqueado'],
  [P('Conjunto deportivo infantil'), 'bloqueado'],
  [P('Buzo bebé con capota'), 'otro'], // «bebé» ya lo saca de ropa (NOT_HOME): sin probador
  [P('Camiseta básica', { options: [{ name: 'Talla', values: ['2', '4', '6', '8', '10', '12', '14', '16'] }] }), 'bloqueado'],
  [P('Pijama enteriza', { options: [{ name: 'Edad', values: ['2 años', '4 años'] }] }), 'bloqueado'],
  [P('Vestido de fiesta', { variants: [{ title: '4T' }] }), 'bloqueado'],
  [P('Tenis deportivos', { options: [{ name: 'Talla', values: ['24', '26', '28', '30'] }] }), 'bloqueado'],
  [P('Tenis deportivos', { options: [{ name: 'Talla', values: ['37', '38', '39', '40', '41'] }] }), 'ropa'],
  [P('Jean clásico', { options: [{ name: 'Talla', values: ['28', '30', '32', '34'] }] }), 'ropa'],
  [P('Saco de dormir térmico'), 'otro'],
  [P('Sacos de dormir para camping'), 'otro'],
  [P('Pijama de dormir en seda'), 'otro'],
  [P('Saco tejido cuello alto'), 'ropa'],
  [P('Lencería para el hogar: juego de sábanas 600 hilos'), 'sabanas'],
  [P('Sábanas 600 hilos', { tags: ['lencería de hogar'] }), 'sabanas'],
  [P('Lencería de cama: cobija piel de conejo'), 'cobija'],
  [P('Lencería sexy de encaje'), 'bloqueado'],
  [P('Lencería'), 'bloqueado'],
  [P('Lencería para el hogar sexy'), 'bloqueado'],
  [P('Brasier push up'), 'bloqueado'],
  [P('Tanga de encaje'), 'bloqueado'],
  [P('Protector de colchón antifluido'), 'protector'],
  // auditoría 8 (tallas de dama 4–16, calzado 33–34, little, lencería de cama)
  [P('Jean mujer talla 14'), 'ropa'],
  [P('Jean dama talla 8'), 'ropa'],
  [P('Jean mujer tallas 6 a 16'), 'ropa'],
  [P('Pantalón dama tallas 4-16'), 'ropa'],
  [P('Blusa mujer talla 4'), 'ropa'],
  [P('Camisa caballero talla 16'), 'ropa'],
  [P('Pantalón hombre talla 12'), 'ropa'],
  [P('Vestido de mujer talla 10'), 'ropa'],
  [P('Falda dama talla 6'), 'ropa'],
  [P('Chaqueta mujer talla 2'), 'ropa'],
  [P('Jean talla 14'), 'ropa'],
  [P('Jean talla 10'), 'ropa'],
  [P('Blusa talla 8'), 'ropa'],
  [P('Jean clásico', { options: [{ name: 'Talla', values: ['6','8','10','12','14','16'] }] }), 'ropa'],
  [P('Jean mujer', { options: [{ name: 'Talla', values: ['4','6','8','10','12','14','16'] }] }), 'ropa'],
  [P('Pantalón dama', { options: [{ name: 'Talla', values: ['2','4','6','8'] }] }), 'ropa'],
  [P('Jean clásico', { options: [{ name: 'Talla', values: ['4','6','8','10'] }] }), 'bloqueado'],
  [P('Camiseta', { options: [{ name: 'Talla', values: ['2','3','4'] }] }), 'bloqueado'],
  [P('Camiseta talla 2'), 'bloqueado'],
  [P('Camiseta talla 4'), 'bloqueado'],
  [P('Vestido tallas 2 a 4'), 'bloqueado'],
  [P('Pijama talla 3'), 'bloqueado'],
  [P('Jean niña talla 14'), 'bloqueado'],
  [P('Vestido mujer y niña talla 8'), 'bloqueado'],
  [P('Camiseta infantil talla 10'), 'bloqueado'],
  [P('Sudadera colegial talla 12'), 'bloqueado'],
  [P('Camisa escolar blanca'), 'bloqueado'],
  [P('Pantalón escolar talla 14'), 'bloqueado'],
  [P('Conjunto deportivo 4 años'), 'bloqueado'],
  [P('Pijama 18 meses'), 'bloqueado'],
  [P('Vestido', { variants: [{ title: '3T' }] }), 'bloqueado'],
  [P('Camiseta mujer', { options: [{ name: 'Talla', values: ['S', 'M', 'Niña 8'] }] }), 'bloqueado'],
  [P('Zapatos colegiales'), 'bloqueado'],
  [P('Zapatos escolares negros'), 'bloqueado'],
  [P('Zapato colegial de cuero'), 'bloqueado'],
  [P('Tenis talla 33'), 'bloqueado'],
  [P('Tenis talla 34'), 'bloqueado'],
  [P('Zapatos talla 30'), 'bloqueado'],
  [P('Tenis dama talla 34'), 'ropa'],
  [P('Tenis hombre talla 33'), 'ropa'],
  [P('Tenis dama talla 30'), 'bloqueado'],
  [P('Tenis talla 38'), 'ropa'],
  [P('Botas mujer talla 36'), 'ropa'],
  [P('Tenis deportivos', { options: [{ name: 'Talla', values: ['33','34','35','36'] }] }), 'bloqueado'],
  [P('Tenis deportivos dama', { options: [{ name: 'Talla', values: ['34','35','36','37'] }] }), 'ropa'],
  [P('Tenis caballero', { options: [{ name: 'Talla', values: ['38','39','40','41','42'] }] }), 'ropa'],
  [P('Botas', { options: [{ name: 'Talla', values: ['35','36','37','38'] }] }), 'ropa'],
  [P('Mocasines hombre', { options: [{ name: 'Talla', values: ['32','38'] }] }), 'bloqueado'],
  [P('Camisa little black'), 'ropa'],
  [P('Vestido little black dress'), 'ropa'],
  [P('Camiseta little girls'), 'bloqueado'],
  [P('Buzo little kids'), 'bloqueado'],
  [P('Camiseta little boy'), 'bloqueado'],
  [P('Lencería de cama 3 piezas'), 'sabanas'],
  [P('Lencería para cama doble'), 'sabanas'],
  [P('Lencería de cama'), 'sabanas'],
  [P('Ropa de cama 4 piezas'), 'sabanas'],
  [P('Lencería de cama sexy'), 'bloqueado'],
  [P('Lencería de hogar 3 piezas'), 'otro'],
  [P('Lencería de cama: edredón doble faz'), 'edredon'],
  [P('Camiseta oversize unisex'), 'ropa'],
  [P('Camisa de lino hombre'), 'ropa'],
  [P('Blusa campesina'), 'ropa'],
  [P('Buzo con capota'), 'ropa'],
  [P('Saco de lana'), 'ropa'],
  [P('Chaqueta de jean'), 'ropa'],
  [P('Chaleco acolchado'), 'ropa'],
  [P('Crop top deportivo'), 'ropa'],
  [P('Pantalón palazzo'), 'ropa'],
  [P('Jean mom fit'), 'ropa'],
  [P('Jogger cargo'), 'ropa'],
  [P('Falda plisada'), 'ropa'],
  [P('Short de jean'), 'ropa'],
  [P('Vestido largo floral'), 'ropa'],
  [P('Enterizo largo'), 'ropa'],
  [P('Pijama de satín mujer'), 'ropa'],
  [P('Tenis blancos'), 'ropa'],
  [P('Botines de cuero'), 'ropa'],
  [P('Conjunto deportivo mujer'), 'ropa'],
  [P('Camiseta básica', { options: [{ name: 'Talla', values: ['XS','S','M','L','XL'] }] }), 'ropa'],
  [P('Bikini tropical'), 'bloqueado'],
  [P('Body manga larga'), 'bloqueado'],
  [P('Faja colombiana'), 'bloqueado'],
  [P('Vestido transparente'), 'bloqueado'],
  [P('Pijama babydoll'), 'bloqueado'],
  [P('Camiseta niño'), 'bloqueado'],
  [P('Vestido bebé'), 'otro'],
  [P('Ropa interior hombre'), 'bloqueado'],
  [P('Juego de sábanas 1400 hilos'), 'sabanas'],
  [P('Sábanas queen'), 'sabanas'],
  [P('Edredón doble faz'), 'edredon'],
  [P('Cobija ovejera'), 'cobija'],
  [P('Almohada de plumas'), 'almohada'],
  [P('Cortina blackout'), 'cortina'],
  [P('Cortinas de luces led'), 'otro'],
  [P('Mantel antifluido'), 'mantel'],
  [P('Forro para sillas de comedor'), 'forro'],
  [P('Comedor 4 puestos'), 'mueble'],
  [P('Zapatero de 5 niveles'), 'mueble'],
  [P('Protector de pantalla'), 'otro'],
  [P('Protector impermeable para colchón'), 'protector'],
  [P('Persiana enrollable'), 'cortina'],
  [P('Cama doble con cabecero'), 'mueble'],
  [P('Tapete de sala'), 'mueble'],
  [P('Funda de colchón'), 'protector'],
  [P('Colcha de patchwork'), 'edredon'],
  [P('Manta para sofá'), 'forro'],
  [P('Saco de dormir para camping'), 'otro'],
  [P('Reloj inteligente'), 'otro'],
  [P('Audífonos bluetooth'), 'otro'],
  [P('Crema corporal'), 'otro'],
  [P('Medias de compresión'), 'otro'],
  [P('Organizador de ropa'), 'otro'],
];
for (const [p, k] of esperados) test(`clasificador «${p.title}» → ${k}`, () => {
  assert.equal(M.kindOf(p).kind, k, 'servidor');
  assert.equal(U.kindOf(p).kind, k, 'api/_util.js');
});
// catálogo real de litper.store (copia en supabase/tests/litper-store.json): servidor y Vercel coinciden y nada cambia
const catPath = path.join(here, 'litper-store.json');
if (fs.existsSync(catPath)) test('catálogo litper.store: mismo resultado en servidor y _util, igual al esperado', () => {
  const { products, esperado } = JSON.parse(fs.readFileSync(catPath, 'utf8'));
  for (const p of products) {
    const q = { title: p.title, type: p.product_type, handle: p.handle, tags: p.tags, options: p.options, variants: p.variants };
    assert.equal(M.kindOf(q).kind, U.kindOf(q).kind, p.title);
    assert.equal(U.kindOf(q).kind, esperado[p.handle], p.title);
  }
});
