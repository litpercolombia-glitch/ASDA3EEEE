// Prueba ultra realista de ropa con IA (FASHN tryon). La foto se procesa y no se guarda.
import { originOk, json, readJson, imageUrlOk, isDataImage, falRun } from './_util.js';
const CAT = { superior: 'tops', inferior: 'bottoms', completo: 'one-pieces' };
export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'metodo' });
  if (!originOk(req)) return json(res, 403, { error: 'origen' });
  const key = process.env.FASHN_API_KEY, fal = process.env.FAL_KEY;
  if (!key && !fal) return json(res, 503, { error: 'sin_llave' });
  let b; try { b = await readJson(req); } catch (e) { return json(res, e.code || 400, { error: 'cuerpo', message: e.message }); }
  const self = req.headers.host;
  if (!isDataImage(b.person)) return json(res, 400, { error: 'foto', message: 'Falta la foto de la persona.' });
  let garment = b.garment;
  if (!imageUrlOk(garment, self)) return json(res, 400, { error: 'prenda', message: 'La imagen de la prenda no es válida.' });
  if (!CAT[b.category]) return json(res, 400, { error: 'categoria', message: 'Este producto no se prueba con IA en persona.' });
  if (fal) { try { return json(res, 200, { image: await falRun('fal-ai/fashn/tryon/v1.6', { model_image: b.person, garment_image: garment, category: CAT[b.category], mode: 'balanced', output_format: 'jpeg', moderation_level: 'permissive' }) }); } catch (e) { return json(res, e.code || 502, { error: 'ia', message: e.message }); } }
  try {
    const run = await fetch('https://api.fashn.ai/v1/run', { method: 'POST', headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model_name: 'tryon-v1.6', inputs: { model_image: b.person, garment_image: garment, category: CAT[b.category], mode: 'balanced', output_format: 'jpeg', return_base64: true, moderation_level: 'permissive' } }) });
    const r0 = await run.json(); if (!run.ok || !r0.id) return json(res, 502, { error: 'ia', message: r0.message || 'La IA rechazó la foto.' });
    const t0 = Date.now();
    while (Date.now() - t0 < 55_000) {
      await new Promise((r) => setTimeout(r, 1500));
      const st = await (await fetch(`https://api.fashn.ai/v1/status/${r0.id}`, { headers: { authorization: `Bearer ${key}` } })).json();
      if (st.status === 'completed') return json(res, 200, { image: st.output[0] });
      if (st.status === 'failed') return json(res, 422, { error: 'ia', message: st.error?.name === 'PoseError' ? 'No se ve bien el cuerpo. Usa una foto de frente con el torso completo.' : 'La IA no pudo con esta foto.' });
    }
    json(res, 504, { error: 'tiempo', message: 'La IA tardó demasiado. Intenta otra vez.' });
  } catch { json(res, 502, { error: 'ia', message: 'No hubo conexión con la IA.' }); }
}
