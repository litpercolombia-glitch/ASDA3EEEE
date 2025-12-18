/**
 * LITPER Tracker API - Servidor para Glitch
 * Un servidor simple para sincronizar datos entre apps
 */

const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Datos en memoria (en producción usar base de datos)
const datos = {
  usuarios: [
    { id: 'cat1', nombre: 'CATALINA', avatar: '😊', color: '#F59E0B', meta_diaria: 50, activo: true },
    { id: 'ang1', nombre: 'ANGIE', avatar: '🌟', color: '#EC4899', meta_diaria: 50, activo: true },
    { id: 'car1', nombre: 'CAROLINA', avatar: '💜', color: '#8B5CF6', meta_diaria: 50, activo: true },
    { id: 'ale1', nombre: 'ALEJANDRA', avatar: '🌸', color: '#F472B6', meta_diaria: 50, activo: true },
    { id: 'eva1', nombre: 'EVAN', avatar: '🚀', color: '#3B82F6', meta_diaria: 50, activo: true },
    { id: 'jim1', nombre: 'JIMMY', avatar: '⚡', color: '#10B981', meta_diaria: 50, activo: true },
    { id: 'fel1', nombre: 'FELIPE', avatar: '🔥', color: '#EF4444', meta_diaria: 50, activo: true },
    { id: 'nor1', nombre: 'NORMA', avatar: '🌺', color: '#06B6D4', meta_diaria: 50, activo: true },
    { id: 'kar1', nombre: 'KAREN', avatar: '💫', color: '#A855F7', meta_diaria: 50, activo: true },
  ],
  rondas_guias: [],
  rondas_novedades: []
};

// ============================================
// ENDPOINTS
// ============================================

// Página principal
app.get('/', (req, res) => {
  res.json({
    nombre: 'LITPER Tracker API',
    version: '1.0.0',
    endpoints: [
      'GET  /api/tracker/usuarios',
      'GET  /api/tracker/rondas/guias',
      'POST /api/tracker/rondas/guias',
      'GET  /api/tracker/rondas/novedades',
      'POST /api/tracker/rondas/novedades',
      'GET  /api/tracker/resumen',
      'GET  /api/tracker/ranking'
    ]
  });
});

// Obtener usuarios
app.get('/api/tracker/usuarios', (req, res) => {
  res.json(datos.usuarios);
});

// Obtener rondas de guías
app.get('/api/tracker/rondas/guias', (req, res) => {
  const { fecha } = req.query;
  if (fecha) {
    const filtradas = datos.rondas_guias.filter(r => r.fecha === fecha);
    return res.json(filtradas);
  }
  res.json(datos.rondas_guias);
});

// Agregar ronda de guías
app.post('/api/tracker/rondas/guias', (req, res) => {
  const ronda = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    ...req.body,
    tipo: 'guias',
    created_at: new Date().toISOString()
  };
  datos.rondas_guias.push(ronda);
  console.log('✅ Nueva ronda guías:', ronda.usuario_nombre);
  res.json({ status: 'ok', ronda });
});

// Obtener rondas de novedades
app.get('/api/tracker/rondas/novedades', (req, res) => {
  const { fecha } = req.query;
  if (fecha) {
    const filtradas = datos.rondas_novedades.filter(r => r.fecha === fecha);
    return res.json(filtradas);
  }
  res.json(datos.rondas_novedades);
});

// Agregar ronda de novedades
app.post('/api/tracker/rondas/novedades', (req, res) => {
  const ronda = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    ...req.body,
    tipo: 'novedades',
    created_at: new Date().toISOString()
  };
  datos.rondas_novedades.push(ronda);
  console.log('✅ Nueva ronda novedades:', ronda.usuario_nombre);
  res.json({ status: 'ok', ronda });
});

// Obtener todas las rondas (para cargar datos)
app.get('/api/tracker/rondas', (req, res) => {
  const { fecha } = req.query;
  let todas = [...datos.rondas_guias, ...datos.rondas_novedades];
  if (fecha) {
    todas = todas.filter(r => r.fecha === fecha);
  }
  res.json(todas);
});

// Resumen
app.get('/api/tracker/resumen', (req, res) => {
  const totalGuias = datos.rondas_guias.reduce((acc, r) => acc + (r.realizado || 0), 0);
  const totalNovedades = datos.rondas_novedades.reduce((acc, r) => acc + (r.solucionadas || 0), 0);

  res.json({
    total_guias: totalGuias,
    total_novedades: totalNovedades,
    rondas_guias: datos.rondas_guias.length,
    rondas_novedades: datos.rondas_novedades.length
  });
});

// Ranking
app.get('/api/tracker/ranking', (req, res) => {
  const ranking = {};

  // Sumar guías
  datos.rondas_guias.forEach(r => {
    const u = r.usuario_nombre;
    if (!ranking[u]) ranking[u] = { guias: 0, novedades: 0 };
    ranking[u].guias += r.realizado || 0;
  });

  // Sumar novedades
  datos.rondas_novedades.forEach(r => {
    const u = r.usuario_nombre;
    if (!ranking[u]) ranking[u] = { guias: 0, novedades: 0 };
    ranking[u].novedades += r.solucionadas || 0;
  });

  // Convertir a array y ordenar
  const resultado = Object.entries(ranking)
    .map(([usuario, totales]) => ({
      usuario,
      total_guias: totales.guias,
      total_novedades: totales.novedades,
      total: totales.guias + totales.novedades
    }))
    .sort((a, b) => b.total - a.total);

  res.json(resultado);
});

// ============================================
// INICIAR SERVIDOR
// ============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('🚀 LITPER Tracker API iniciado');
  console.log(`📊 Puerto: ${PORT}`);
  console.log('📋 Endpoints disponibles:');
  console.log('   - GET  /api/tracker/usuarios');
  console.log('   - GET  /api/tracker/rondas/guias');
  console.log('   - POST /api/tracker/rondas/guias');
  console.log('   - GET  /api/tracker/rondas/novedades');
  console.log('   - POST /api/tracker/rondas/novedades');
  console.log('   - GET  /api/tracker/resumen');
  console.log('   - GET  /api/tracker/ranking');
});
