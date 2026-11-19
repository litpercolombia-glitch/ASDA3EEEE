// vto-mirror — RETIRADA (19-nov-2026, auditoría 4). Ya copió las fotos de ejemplo al bucket vto-samples y no se necesita más.
// Stub neutro: no lee cabeceras ni tokens, no usa claves y no escribe nada. Responde 410 a todo.
Deno.serve(() => new Response(JSON.stringify({ error: 'retirada' }), { status: 410, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } }));
