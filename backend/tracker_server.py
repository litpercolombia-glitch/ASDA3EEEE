"""
Servidor mínimo para LITPER Tracker
Solo sincronización entre desktop y web
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import date
import database_tracker as db
from loguru import logger

# Configurar logging
logger.remove()
logger.add(lambda msg: print(msg), format="{time:HH:mm:ss} | {level} | {message}", level="INFO")

app = FastAPI(
    title="LITPER Tracker API",
    description="API de sincronización para LITPER Tracker",
    version="1.0.0"
)

# CORS - permitir todas las conexiones locales
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== MODELOS ====================

class RondaGuiasCreate(BaseModel):
    usuario_id: str
    usuario_nombre: Optional[str] = None
    numero: Optional[int] = 1
    fecha: Optional[str] = None
    hora_inicio: Optional[str] = None
    hora_fin: Optional[str] = None
    tiempo_usado: Optional[int] = 0
    pedidos_iniciales: Optional[int] = 0
    realizado: Optional[int] = 0
    cancelado: Optional[int] = 0
    agendado: Optional[int] = 0
    dificiles: Optional[int] = 0
    pendientes: Optional[int] = 0
    revisado: Optional[int] = 0

class RondaNovedadesCreate(BaseModel):
    usuario_id: str
    usuario_nombre: Optional[str] = None
    numero: Optional[int] = 1
    fecha: Optional[str] = None
    hora_inicio: Optional[str] = None
    hora_fin: Optional[str] = None
    tiempo_usado: Optional[int] = 0
    revisadas: Optional[int] = 0
    solucionadas: Optional[int] = 0
    devolucion: Optional[int] = 0
    cliente: Optional[int] = 0
    transportadora: Optional[int] = 0
    litper: Optional[int] = 0

# ==================== ENDPOINTS ====================

@app.get("/")
async def root():
    return {"message": "LITPER Tracker API", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "tracker"}

# === USUARIOS ===

@app.get("/api/tracker/usuarios")
async def get_usuarios():
    """Obtiene todos los usuarios activos"""
    usuarios = db.get_usuarios(activos_only=True)
    logger.info(f"📋 GET /usuarios - {len(usuarios)} usuarios")
    return usuarios

@app.get("/api/tracker/usuarios/{usuario_id}")
async def get_usuario(usuario_id: str):
    """Obtiene un usuario específico"""
    usuario = db.get_usuario(usuario_id)
    if not usuario:
        return {"error": "Usuario no encontrado"}, 404
    return usuario

# === RONDAS GUÍAS ===

@app.post("/api/tracker/rondas/guias")
async def crear_ronda_guias(ronda: RondaGuiasCreate):
    """Crea una nueva ronda de guías"""
    import uuid

    fecha = ronda.fecha or date.today().isoformat()

    data = {
        "id": str(uuid.uuid4())[:8],
        "usuario_id": ronda.usuario_id,
        "usuario_nombre": ronda.usuario_nombre,
        "numero": ronda.numero,
        "fecha": fecha,
        "hora_inicio": ronda.hora_inicio,
        "hora_fin": ronda.hora_fin,
        "tiempo_usado": ronda.tiempo_usado,
        "pedidos_iniciales": ronda.pedidos_iniciales,
        "realizado": ronda.realizado,
        "cancelado": ronda.cancelado,
        "agendado": ronda.agendado,
        "dificiles": ronda.dificiles,
        "pendientes": ronda.pendientes,
        "revisado": ronda.revisado,
    }

    result = db.crear_ronda_guias(data)
    logger.info(f"✅ POST /rondas/guias - Usuario: {ronda.usuario_nombre}, Realizado: {ronda.realizado}")
    return result

@app.get("/api/tracker/rondas/guias")
async def get_rondas_guias(fecha: Optional[str] = None, usuario_id: Optional[str] = None):
    """Obtiene rondas de guías"""
    fecha_filtro = fecha or date.today().isoformat()
    rondas = db.get_rondas_guias(fecha=fecha_filtro, usuario_id=usuario_id)
    logger.info(f"📋 GET /rondas/guias - Fecha: {fecha_filtro}, {len(rondas)} rondas")
    return rondas

# === RONDAS NOVEDADES ===

@app.post("/api/tracker/rondas/novedades")
async def crear_ronda_novedades(ronda: RondaNovedadesCreate):
    """Crea una nueva ronda de novedades"""
    import uuid

    fecha = ronda.fecha or date.today().isoformat()

    data = {
        "id": str(uuid.uuid4())[:8],
        "usuario_id": ronda.usuario_id,
        "usuario_nombre": ronda.usuario_nombre,
        "numero": ronda.numero,
        "fecha": fecha,
        "hora_inicio": ronda.hora_inicio,
        "hora_fin": ronda.hora_fin,
        "tiempo_usado": ronda.tiempo_usado,
        "revisadas": ronda.revisadas,
        "solucionadas": ronda.solucionadas,
        "devolucion": ronda.devolucion,
        "cliente": ronda.cliente,
        "transportadora": ronda.transportadora,
        "litper": ronda.litper,
    }

    result = db.crear_ronda_novedades(data)
    logger.info(f"✅ POST /rondas/novedades - Usuario: {ronda.usuario_nombre}, Solucionadas: {ronda.solucionadas}")
    return result

@app.get("/api/tracker/rondas/novedades")
async def get_rondas_novedades(fecha: Optional[str] = None, usuario_id: Optional[str] = None):
    """Obtiene rondas de novedades"""
    fecha_filtro = fecha or date.today().isoformat()
    rondas = db.get_rondas_novedades(fecha=fecha_filtro, usuario_id=usuario_id)
    logger.info(f"📋 GET /rondas/novedades - Fecha: {fecha_filtro}, {len(rondas)} rondas")
    return rondas

# === TODAS LAS RONDAS ===

@app.get("/api/tracker/rondas")
async def get_todas_rondas(fecha: Optional[str] = None, usuario_id: Optional[str] = None, tipo: Optional[str] = None):
    """Obtiene todas las rondas (guías + novedades)"""
    fecha_filtro = fecha or date.today().isoformat()

    if tipo == "guias":
        rondas = db.get_rondas_guias(fecha=fecha_filtro, usuario_id=usuario_id)
    elif tipo == "novedades":
        rondas = db.get_rondas_novedades(fecha=fecha_filtro, usuario_id=usuario_id)
    else:
        rondas = db.get_todas_rondas(fecha=fecha_filtro, usuario_id=usuario_id)

    logger.info(f"📋 GET /rondas - Fecha: {fecha_filtro}, {len(rondas)} rondas")
    return rondas

# === ESTADÍSTICAS ===

@app.get("/api/tracker/estadisticas/{usuario_id}")
async def get_estadisticas(usuario_id: str, fecha: Optional[str] = None):
    """Obtiene estadísticas de un usuario"""
    return db.get_estadisticas_usuario(usuario_id, fecha)

@app.get("/api/tracker/ranking")
async def get_ranking(fecha: Optional[str] = None, tipo: str = "guias"):
    """Obtiene ranking de usuarios"""
    return db.get_ranking(fecha, tipo)

@app.get("/api/tracker/resumen")
async def get_resumen(fecha: Optional[str] = None):
    """Obtiene resumen del día"""
    return db.get_resumen_dia(fecha)

# === HISTORIAL ===

@app.get("/api/tracker/historial")
async def get_historial(usuario_id: Optional[str] = None, dias: int = 30):
    """Obtiene historial de rondas"""
    return db.get_historial_rondas(usuario_id, dias)

# ==================== MAIN ====================

if __name__ == "__main__":
    logger.info("🚀 Iniciando LITPER Tracker API...")
    logger.info("📊 Endpoints disponibles:")
    logger.info("   - GET  /api/tracker/usuarios")
    logger.info("   - GET  /api/tracker/rondas")
    logger.info("   - POST /api/tracker/rondas/guias")
    logger.info("   - POST /api/tracker/rondas/novedades")
    logger.info("   - GET  /api/tracker/resumen")
    logger.info("   - GET  /api/tracker/ranking")

    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
