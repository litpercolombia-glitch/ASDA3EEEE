// Pone el producto de hogar (cobija, sábanas, cortina, mantel) en la foto real del cliente con IA de imagen (Gemini).
import { originOk, json, readJson, imageUrlOk, isDataImage } from './_util.js';
const PROMPT = {
  cama: 'Dress the bed in the FIRST photo with the exact bedding product shown in the SECOND photo (same pattern, colors, fabric and quilting). Fit it to that mattress size with natural drape, folds and tuck. Keep the room, camera angle, lighting, furniture and every other object exactly the same. Photorealistic smartphone photo, no text.',
  cortina: 'Hang the exact curtains shown in the SECOND photo on the window of the FIRST photo (same color, fabric and opacity), with natural pleats from the top of the window to the floor. Keep everything else exactly the same. Photorealistic, no text.',
  mantel: 'Put the exact tablecloth shown in the SECOND photo on the table of the FIRST photo (same print and colors), with natural drape over the edges. Keep everything else exactly the same. Photorealistic, no text.',
};
export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'metodo' });
  if (!originOk(req)) return json(res, 403, { error: 'origen' });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return json(res, 503, { error: 'sin_llave' });
  let b; try { b = await readJson(req); } catch (e) { return json(res, e.code || 400, { error: 'cuerpo', message: e.message }); }
  if (!isDataImage(b.room)) return json(res, 400, { error: 'foto', message: 'Falta la foto de tu espacio.' });
  if (!imageUrlOk(b.product, req.headers.host)) return json(res, 400, { error: 'producto' });
  const kind = PROMPT[b.kind] ? b.kind : 'cama';
  try {
    const pr = await fetch(b.product); if (!pr.ok) throw 0;
    const pmime = (pr.headers.get('content-type') || 'image/jpeg').split(';')[0];
    const pb64 = Buffer.from(await pr.arrayBuffer()).toString('base64');
    const [, rmime, rb64] = b.room.match(/^data:(image\/\w+);base64,(.*)$/);
    const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ inline_data: { mime_type: rmime, data: rb64 } }, { inline_data: { mime_type: pmime, data: pb64 } }, { text: PROMPT[kind] }] }], generationConfig: { responseModalities: ['IMAGE'] } }),
    });
    const d = await r.json();
    const part = d.candidates?.[0]?.content?.parts?.find((p) => p.inlineData || p.inline_data);
    if (!r.ok || !part) return json(res, 502, { error: 'ia', message: d.error?.message ? 'La IA no pudo con esta foto.' : 'La IA no devolvió imagen.' });
    const im = part.inlineData || part.inline_data;
    json(res, 200, { image: `data:${im.mimeType || im.mime_type};base64,${im.data}` });
  } catch { json(res, 502, { error: 'ia', message: 'No hubo conexión con la IA.' }); }
}
