"""
API Routes para LITPER Tracker - Sincronización con app de escritorio y web
"""

from datetime import datetime, date
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func
from loguru import logger

from database import get_session

# ==================== MODELOS PYDANTIC ====================

class UsuarioTrackerBase(BaseModel):
    """Base para usuario del tracker"""
    nombre: str = Field(..., min_length=1, max_length=100)
    avatar: str = Field(default="😊", max_length=10)
    color: str = Field(default="#8B5CF6", max_length=20)
    meta_diaria: int = Field(default=50, ge=0, le=500)
    activo: bool = Field(default=True)


class UsuarioTrackerCreate(UsuarioTrackerBase):
    """Para crear usuario"""
    id: Optional[str] = None  # ID opcional - si viene de la app web, usar el mismo ID


class UsuarioTrackerUpdate(BaseModel):
    """Para actualizar usuario"""
    nombre: Optional[str] = None
    avatar: Optional[str] = None
    color: Optional[str] = None
    meta_diaria: Optional[int] = None
    activo: Optional[bool] = None


class UsuarioTrackerResponse(UsuarioTrackerBase):
    """Respuesta de usuario"""
    id: str
    fecha_creacion: datetime

    class Config:
        from_attributes = True


class RondaTrackerBase(BaseModel):
    """Base para ronda del tracker"""
    usuario_id: str
    usuario_nombre: str
    numero: int
    fecha: str  # YYYY-MM-DD
    hora_inicio: str
    hora_fin: str
    tiempo_usado: int  # minutos
    tipo: str  # 'guias' | 'novedades'


class RondaGuiasCreate(RondaTrackerBase):
    """Crear ronda de guías"""
    tipo: str = "guias"
    pedidos_iniciales: int = 0
    realizado: int = 0
    cancelado: int = 0
    agendado: int = 0
    dificiles: int = 0
    pendientes: int = 0
    revisado: int = 0


class RondaNovedadesCreate(RondaTrackerBase):
    """Crear ronda de novedades"""
    tipo: str = "novedades"
    revisadas: int = 0
    solucionadas: int = 0
    devolucion: int = 0
    cliente: int = 0
    transportadora: int = 0
    litper: int = 0


class RondaResponse(BaseModel):
    """Respuesta de ronda"""
    id: str
    usuario_id: str
    usuario_nombre: str
    numero: int
    fecha: str
    hora_inicio: str
    hora_fin: str
    tiempo_usado: int
    tipo: str
    # Campos dinámicos según tipo
    datos: dict
    fecha_creacion: datetime


class SyncRequest(BaseModel):
    """Request de sincronización"""
    usuarios: Optional[List[dict]] = None
    rondas: Optional[List[dict]] = None
    ultima_sync: Optional[str] = None


class SyncResponse(BaseModel):
    """Respuesta de sincronización"""
    usuarios: List[dict]
    rondas_hoy: List[dict]
    ultima_sync: str


# ==================== STORAGE EN MEMORIA (para simplificar) ====================
# En producción, usar la base de datos PostgreSQL

# Almacenamiento temporal en memoria
_usuarios_tracker: dict = {}
_rondas_tracker: dict = {}

def _generar_id() -> str:
    """Genera un ID único"""
    import uuid
    return str(uuid.uuid4())[:8]

def _hoy() -> str:
    """Retorna la fecha de hoy en formato YYYY-MM-DD"""
    return date.today().isoformat()


# ==================== ROUTER ====================

router = APIRouter(prefix="/tracker", tags=["Tracker"])


# === USUARIOS ===

@router.get("/usuarios", response_model=List[dict])
async def listar_usuarios():
    """Lista todos los usuarios activos del tracker"""
    usuarios = [
        {**u, "id": uid}
        for uid, u in _usuarios_tracker.items()
        if u.get("activo", True)
    ]

    # Si no hay usuarios, crear algunos por defecto
    if not usuarios:
        usuarios_default = [
            {"id": "user1", "nombre": "Usuario 1", "avatar": "😊", "color": "#8B5CF6", "meta_diaria": 50, "activo": True},
            {"id": "user2", "nombre": "Usuario 2", "avatar": "🚀", "color": "#10B981", "meta_diaria": 60, "activo": True},
            {"id": "user3", "nombre": "Usuario 3", "avatar": "⭐", "color": "#F59E0B", "meta_diaria": 40, "activo": True},
        ]
        for u in usuarios_default:
            _usuarios_tracker[u["id"]] = u
        return usuarios_default

    return usuarios


@router.post("/usuarios", response_model=dict)
async def crear_usuario(usuario: UsuarioTrackerCreate):
    """Crea un nuevo usuario del tracker o actualiza si ya existe"""
    # Usar ID proporcionado o generar uno nuevo
    usuario_id = usuario.id if usuario.id else _generar_id()

    # Si ya existe, actualizar
    if usuario_id in _usuarios_tracker:
        _usuarios_tracker[usuario_id].update({
            "nombre": usuario.nombre,
            "avatar": usuario.avatar,
            "color": usuario.color,
            "meta_diaria": usuario.meta_diaria,
            "activo": usuario.activo,
        })
        logger.info(f"Usuario tracker actualizado: {usuario.nombre}")
        return {**_usuarios_tracker[usuario_id], "id": usuario_id}

    nuevo_usuario = {
        "id": usuario_id,
        "nombre": usuario.nombre,
        "avatar": usuario.avatar,
        "color": usuario.color,
        "meta_diaria": usuario.meta_diaria,
        "activo": usuario.activo,
        "fecha_creacion": datetime.now().isoformat()
    }
    _usuarios_tracker[usuario_id] = nuevo_usuario
    logger.info(f"Usuario tracker creado: {usuario.nombre}")
    return nuevo_usuario


@router.put("/usuarios/{usuario_id}", response_model=dict)
async def actualizar_usuario(usuario_id: str, datos: UsuarioTrackerUpdate):
    """Actualiza un usuario existente"""
    if usuario_id not in _usuarios_tracker:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    usuario = _usuarios_tracker[usuario_id]

    if datos.nombre is not None:
        usuario["nombre"] = datos.nombre
    if datos.avatar is not None:
        usuario["avatar"] = datos.avatar
    if datos.color is not None:
        usuario["color"] = datos.color
    if datos.meta_diaria is not None:
        usuario["meta_diaria"] = datos.meta_diaria
    if datos.activo is not None:
        usuario["activo"] = datos.activo

    _usuarios_tracker[usuario_id] = usuario
    return {**usuario, "id": usuario_id}


@router.delete("/usuarios/{usuario_id}")
async def eliminar_usuario(usuario_id: str):
    """Desactiva un usuario (soft delete)"""
    if usuario_id not in _usuarios_tracker:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    _usuarios_tracker[usuario_id]["activo"] = False
    return {"exito": True, "mensaje": "Usuario desactivado"}


# === RONDAS ===

@router.get("/rondas", response_model=List[dict])
async def listar_rondas(
    fecha: Optional[str] = None,
    usuario_id: Optional[str] = None,
    tipo: Optional[str] = None
):
    """Lista rondas con filtros opcionales"""
    fecha_filtro = fecha or _hoy()

    rondas = []
    for ronda_id, ronda in _rondas_tracker.items():
        # Filtrar por fecha
        if ronda.get("fecha") != fecha_filtro:
            continue
        # Filtrar por usuario
        if usuario_id and ronda.get("usuario_id") != usuario_id:
            continue
        # Filtrar por tipo
        if tipo and ronda.get("tipo") != tipo:
            continue

        rondas.append({**ronda, "id": ronda_id})

    return sorted(rondas, key=lambda x: x.get("hora_inicio", ""))


@router.post("/rondas/guias", response_model=dict)
async def crear_ronda_guias(ronda: RondaGuiasCreate):
    """Crea una ronda de guías"""
    ronda_id = _generar_id()
    nueva_ronda = {
        "id": ronda_id,
        "usuario_id": ronda.usuario_id,
        "usuario_nombre": ronda.usuario_nombre,
        "numero": ronda.numero,
        "fecha": ronda.fecha,
        "hora_inicio": ronda.hora_inicio,
        "hora_fin": ronda.hora_fin,
        "tiempo_usado": ronda.tiempo_usado,
        "tipo": "guias",
        "pedidos_iniciales": ronda.pedidos_iniciales,
        "realizado": ronda.realizado,
        "cancelado": ronda.cancelado,
        "agendado": ronda.agendado,
        "dificiles": ronda.dificiles,
        "pendientes": ronda.pendientes,
        "revisado": ronda.revisado,
        "fecha_creacion": datetime.now().isoformat()
    }
    _rondas_tracker[ronda_id] = nueva_ronda
    logger.info(f"Ronda guías guardada: Usuario {ronda.usuario_nombre}, Realizado: {ronda.realizado}")
    return nueva_ronda


@router.post("/rondas/novedades", response_model=dict)
async def crear_ronda_novedades(ronda: RondaNovedadesCreate):
    """Crea una ronda de novedades"""
    ronda_id = _generar_id()
    nueva_ronda = {
        "id": ronda_id,
        "usuario_id": ronda.usuario_id,
        "usuario_nombre": ronda.usuario_nombre,
        "numero": ronda.numero,
        "fecha": ronda.fecha,
        "hora_inicio": ronda.hora_inicio,
        "hora_fin": ronda.hora_fin,
        "tiempo_usado": ronda.tiempo_usado,
        "tipo": "novedades",
        "revisadas": ronda.revisadas,
        "solucionadas": ronda.solucionadas,
        "devolucion": ronda.devolucion,
        "cliente": ronda.cliente,
        "transportadora": ronda.transportadora,
        "litper": ronda.litper,
        "fecha_creacion": datetime.now().isoformat()
    }
    _rondas_tracker[ronda_id] = nueva_ronda
    logger.info(f"Ronda novedades guardada: Usuario {ronda.usuario_nombre}, Solucionadas: {ronda.solucionadas}")
    return nueva_ronda


@router.delete("/rondas/{ronda_id}")
async def eliminar_ronda(ronda_id: str):
    """Elimina una ronda"""
    if ronda_id not in _rondas_tracker:
        raise HTTPException(status_code=404, detail="Ronda no encontrada")

    del _rondas_tracker[ronda_id]
    return {"exito": True, "mensaje": "Ronda eliminada"}


# === SINCRONIZACIÓN ===

@router.post("/sync", response_model=SyncResponse)
async def sincronizar(request: SyncRequest):
    """
    Endpoint principal de sincronización bidireccional.
    - Recibe datos del cliente (escritorio/web)
    - Retorna datos actualizados del servidor
    """
    fecha_hoy = _hoy()

    # Procesar usuarios enviados por el cliente
    if request.usuarios:
        for usuario in request.usuarios:
            uid = usuario.get("id")
            if uid:
                _usuarios_tracker[uid] = usuario

    # Procesar rondas enviadas por el cliente
    if request.rondas:
        for ronda in request.rondas:
            rid = ronda.get("id")
            if rid and ronda.get("fecha") == fecha_hoy:
                _rondas_tracker[rid] = ronda

    # Preparar respuesta con todos los datos actuales
    usuarios_response = [
        {**u, "id": uid}
        for uid, u in _usuarios_tracker.items()
        if u.get("activo", True)
    ]

    # Si no hay usuarios, crear por defecto
    if not usuarios_response:
        usuarios_default = [
            {"id": "user1", "nombre": "Usuario 1", "avatar": "😊", "color": "#8B5CF6", "meta_diaria": 50, "activo": True},
            {"id": "user2", "nombre": "Usuario 2", "avatar": "🚀", "color": "#10B981", "meta_diaria": 60, "activo": True},
            {"id": "user3", "nombre": "Usuario 3", "avatar": "⭐", "color": "#F59E0B", "meta_diaria": 40, "activo": True},
        ]
        for u in usuarios_default:
            _usuarios_tracker[u["id"]] = u
        usuarios_response = usuarios_default

    rondas_hoy = [
        {**r, "id": rid}
        for rid, r in _rondas_tracker.items()
        if r.get("fecha") == fecha_hoy
    ]

    return SyncResponse(
        usuarios=usuarios_response,
        rondas_hoy=rondas_hoy,
        ultima_sync=datetime.now().isoformat()
    )


@router.get("/sync/estado")
async def estado_sync():
    """Verifica el estado de sincronización"""
    return {
        "online": True,
        "usuarios_count": len(_usuarios_tracker),
        "rondas_hoy_count": len([r for r in _rondas_tracker.values() if r.get("fecha") == _hoy()]),
        "ultima_actualizacion": datetime.now().isoformat()
    }


# === REPORTES ===

@router.get("/reportes/resumen-dia")
async def resumen_dia(fecha: Optional[str] = None):
    """Obtiene resumen del día para todos los usuarios"""
    fecha_filtro = fecha or _hoy()

    rondas_dia = [r for r in _rondas_tracker.values() if r.get("fecha") == fecha_filtro]

    # Agrupar por usuario
    resumen_usuarios = {}
    for ronda in rondas_dia:
        uid = ronda.get("usuario_id")
        if uid not in resumen_usuarios:
            resumen_usuarios[uid] = {
                "usuario_id": uid,
                "usuario_nombre": ronda.get("usuario_nombre"),
                "rondas_guias": 0,
                "rondas_novedades": 0,
                "total_realizado": 0,
                "total_solucionadas": 0,
                "tiempo_total": 0
            }

        resumen = resumen_usuarios[uid]
        resumen["tiempo_total"] += ronda.get("tiempo_usado", 0)

        if ronda.get("tipo") == "guias":
            resumen["rondas_guias"] += 1
            resumen["total_realizado"] += ronda.get("realizado", 0)
        else:
            resumen["rondas_novedades"] += 1
            resumen["total_solucionadas"] += ronda.get("solucionadas", 0)

    return {
        "fecha": fecha_filtro,
        "total_rondas": len(rondas_dia),
        "usuarios": list(resumen_usuarios.values())
    }


@router.get("/reportes/ranking")
async def ranking_dia(fecha: Optional[str] = None, tipo: str = "guias"):
    """Obtiene ranking del día por tipo de proceso"""
    fecha_filtro = fecha or _hoy()

    rondas_dia = [
        r for r in _rondas_tracker.values()
        if r.get("fecha") == fecha_filtro and r.get("tipo") == tipo
    ]

    # Agrupar por usuario
    totales = {}
    for ronda in rondas_dia:
        uid = ronda.get("usuario_id")
        if uid not in totales:
            totales[uid] = {
                "usuario_id": uid,
                "usuario_nombre": ronda.get("usuario_nombre"),
                "total": 0,
                "rondas": 0
            }

        totales[uid]["rondas"] += 1
        if tipo == "guias":
            totales[uid]["total"] += ronda.get("realizado", 0)
        else:
            totales[uid]["total"] += ronda.get("solucionadas", 0)

    # Ordenar por total
    ranking = sorted(totales.values(), key=lambda x: x["total"], reverse=True)

    # Agregar posición
    for i, r in enumerate(ranking):
        r["posicion"] = i + 1

    return {
        "fecha": fecha_filtro,
        "tipo": tipo,
        "ranking": ranking
    }
