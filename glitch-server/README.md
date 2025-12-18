# LITPER Tracker API - Servidor para Glitch

## Despliegue en Glitch (GRATIS)

### Pasos:

1. Ve a **https://glitch.com**
2. Crea una cuenta (o inicia sesión con GitHub)
3. Click en **"New Project"** → **"glitch-hello-node"**
4. En el editor de Glitch:
   - Borra todo el contenido de `server.js`
   - Copia y pega el contenido de este `server.js`
   - Edita `package.json` con el contenido de este `package.json`
5. ¡Listo! Tu servidor estará en: `https://TU-PROYECTO.glitch.me`

### URL para la app:

Una vez desplegado, tu URL del API será:
```
https://TU-PROYECTO.glitch.me/api/tracker
```

Esa URL es la que debes poner en la configuración de conexión de LITPER Tracker.

## Endpoints disponibles

- `GET /api/tracker/usuarios` - Lista de usuarios
- `GET /api/tracker/rondas/guias` - Rondas de guías
- `POST /api/tracker/rondas/guias` - Agregar ronda de guías
- `GET /api/tracker/rondas/novedades` - Rondas de novedades
- `POST /api/tracker/rondas/novedades` - Agregar ronda de novedades
- `GET /api/tracker/resumen` - Resumen de totales
- `GET /api/tracker/ranking` - Ranking de usuarios

## Notas

- Los datos se guardan en memoria (se pierden al reiniciar)
- Glitch reinicia los proyectos gratis después de 5 minutos de inactividad
- Para datos persistentes, considera usar Glitch con SQLite o un servicio de base de datos
