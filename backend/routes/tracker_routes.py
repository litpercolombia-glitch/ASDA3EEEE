"""
API Routes para LITPER Tracker - Sincronización con app de escritorio y web
Ahora con base de datos SQLite persistente
"""

from datetime import datetime, date
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from loguru import logger
import hashlib
import uuid
import io

# Importar funciones de base de datos
from database_tracker import (
    get_usuarios, get_usuario, crear_usuario, actualizar_usuario, eliminar_usuario,
    verificar_password, crear_ronda_guias, crear_ronda_novedades,
    get_rondas_guias, get_rondas_novedades, get_todas_rondas,
    get_historial_rondas, get_estadisticas_usuario, get_ranking, get_resumen_dia
)

# ==================== MODELOS PYDANTIC ====================

class UsuarioTrackerBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100)
    avatar: str = Field(default="😊", max_length=10)
    color: str = Field(default="#F59E0B", max_length=20)
    meta_diaria: int = Field(default=50, ge=0, le=500)
    activo: bool = Field(default=True)

class UsuarioTrackerCreate(UsuarioTrackerBase):
    id: Optional[str] = None
    password: Optional[str] = None

class UsuarioTrackerUpdate(BaseModel):
    nombre: Optional[str] = None
    avatar: Optional[str] = None
    color: Optional[str] = None
    meta_diaria: Optional[int] = None
    activo: Optional[bool] = None
    password: Optional[str] = None

class LoginRequest(BaseModel):
    usuario_id: str
    password: str

class RondaGuiasCreate(BaseModel):
    usuario_id: str
    usuario_nombre: str
    numero: int
    fecha: str
    hora_inicio: str
    hora_fin: str
    tiempo_usado: int = 0
    pedidos_iniciales: int = 0
    realizado: int = 0
    cancelado: int = 0
    agendado: int = 0
    dificiles: int = 0
    pendientes: int = 0
    revisado: int = 0

class RondaNovedadesCreate(BaseModel):
    usuario_id: str
    usuario_nombre: str
    numero: int
    fecha: str
    hora_inicio: str
    hora_fin: str
    tiempo_usado: int = 0
    revisadas: int = 0
    solucionadas: int = 0
    devolucion: int = 0
    cliente: int = 0
    transportadora: int = 0
    litper: int = 0

class SyncRequest(BaseModel):
    usuarios: Optional[List[dict]] = None
    rondas: Optional[List[dict]] = None
    ultima_sync: Optional[str] = None

class SyncResponse(BaseModel):
    usuarios: List[dict]
    rondas_hoy: List[dict]
    ultima_sync: str

# ==================== HELPERS ====================

def _generar_id() -> str:
    return str(uuid.uuid4())[:8]

def _hoy() -> str:
    return date.today().isoformat()

def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

# ==================== ROUTER ====================

router = APIRouter(prefix="/tracker", tags=["Tracker"])

# ==================== USUARIOS ====================

@router.get("/usuarios", response_model=List[dict])
async def listar_usuarios():
    """Lista todos los usuarios activos del tracker"""
    usuarios = get_usuarios(activos_only=True)
    return usuarios

@router.get("/usuarios/{usuario_id}")
async def obtener_usuario(usuario_id: str):
    """Obtiene un usuario por ID"""
    usuario = get_usuario(usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario

@router.post("/usuarios", response_model=dict)
async def crear_usuario_endpoint(usuario: UsuarioTrackerCreate):
    """Crea un nuevo usuario o actualiza si existe"""
    usuario_id = usuario.id if usuario.id else _generar_id()
    password_hash = _hash_password(usuario.password) if usuario.password else None

    nuevo = crear_usuario(
        id=usuario_id,
        nombre=usuario.nombre,
        avatar=usuario.avatar,
        color=usuario.color,
        meta_diaria=usuario.meta_diaria,
        password_hash=password_hash
    )
    logger.info(f"Usuario tracker creado/actualizado: {usuario.nombre}")
    return nuevo

@router.put("/usuarios/{usuario_id}", response_model=dict)
async def actualizar_usuario_endpoint(usuario_id: str, datos: UsuarioTrackerUpdate):
    """Actualiza un usuario existente"""
    usuario = get_usuario(usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    update_data = datos.dict(exclude_unset=True)
    if 'password' in update_data and update_data['password']:
        update_data['password_hash'] = _hash_password(update_data.pop('password'))
    elif 'password' in update_data:
        del update_data['password']

    actualizado = actualizar_usuario(usuario_id, update_data)
    return actualizado

@router.delete("/usuarios/{usuario_id}")
async def eliminar_usuario_endpoint(usuario_id: str):
    """Desactiva un usuario (soft delete)"""
    if eliminar_usuario(usuario_id):
        return {"exito": True, "mensaje": "Usuario desactivado"}
    raise HTTPException(status_code=404, detail="Usuario no encontrado")

# ==================== AUTENTICACIÓN ====================

@router.post("/auth/login")
async def login(request: LoginRequest):
    """Verifica credenciales de usuario"""
    usuario = get_usuario(request.usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if usuario.get('password_hash'):
        if not verificar_password(request.usuario_id, _hash_password(request.password)):
            raise HTTPException(status_code=401, detail="Contraseña incorrecta")

    return {
        "exito": True,
        "usuario": usuario,
        "mensaje": "Login exitoso"
    }

@router.post("/auth/set-password/{usuario_id}")
async def set_password(usuario_id: str, password: str = Query(...)):
    """Establece contraseña para un usuario"""
    usuario = get_usuario(usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    actualizar_usuario(usuario_id, {'password_hash': _hash_password(password)})
    return {"exito": True, "mensaje": "Contraseña establecida"}

# ==================== RONDAS ====================

@router.get("/rondas", response_model=List[dict])
async def listar_rondas(
    fecha: Optional[str] = None,
    usuario_id: Optional[str] = None,
    tipo: Optional[str] = None
):
    """Lista rondas con filtros opcionales"""
    fecha_filtro = fecha or _hoy()

    if tipo == 'guias':
        return get_rondas_guias(fecha_filtro, usuario_id)
    elif tipo == 'novedades':
        return get_rondas_novedades(fecha_filtro, usuario_id)
    else:
        return get_todas_rondas(fecha_filtro, usuario_id)

@router.post("/rondas/guias", response_model=dict)
async def crear_ronda_guias_endpoint(ronda: RondaGuiasCreate):
    """Crea una ronda de guías"""
    data = ronda.dict()
    data['id'] = _generar_id()

    nueva = crear_ronda_guias(data)
    logger.info(f"Ronda guías guardada: Usuario {ronda.usuario_nombre}, Realizado: {ronda.realizado}")
    return nueva

@router.post("/rondas/novedades", response_model=dict)
async def crear_ronda_novedades_endpoint(ronda: RondaNovedadesCreate):
    """Crea una ronda de novedades"""
    data = ronda.dict()
    data['id'] = _generar_id()

    nueva = crear_ronda_novedades(data)
    logger.info(f"Ronda novedades guardada: Usuario {ronda.usuario_nombre}, Solucionadas: {ronda.solucionadas}")
    return nueva

# ==================== HISTORIAL ====================

@router.get("/historial")
async def obtener_historial(
    usuario_id: Optional[str] = None,
    dias: int = Query(default=30, ge=1, le=365)
):
    """Obtiene historial de rondas"""
    historial = get_historial_rondas(usuario_id, dias)
    return {
        "dias": dias,
        "total_rondas": len(historial),
        "rondas": historial
    }

# ==================== SINCRONIZACIÓN ====================

@router.post("/sync", response_model=SyncResponse)
async def sincronizar(request: SyncRequest):
    """Endpoint principal de sincronización bidireccional"""
    fecha_hoy = _hoy()

    # Procesar usuarios enviados
    if request.usuarios:
        for u in request.usuarios:
            if u.get('id'):
                crear_usuario(
                    id=u['id'],
                    nombre=u.get('nombre', 'Usuario'),
                    avatar=u.get('avatar', '😊'),
                    color=u.get('color', '#F59E0B'),
                    meta_diaria=u.get('meta_diaria', 50)
                )

    # Procesar rondas enviadas
    if request.rondas:
        for r in request.rondas:
            if r.get('tipo') == 'guias':
                crear_ronda_guias(r)
            elif r.get('tipo') == 'novedades':
                crear_ronda_novedades(r)

    return SyncResponse(
        usuarios=get_usuarios(),
        rondas_hoy=get_todas_rondas(fecha_hoy),
        ultima_sync=datetime.now().isoformat()
    )

@router.get("/sync/estado")
async def estado_sync():
    """Verifica el estado de sincronización"""
    usuarios = get_usuarios()
    rondas_hoy = get_todas_rondas(_hoy())

    return {
        "online": True,
        "usuarios_count": len(usuarios),
        "rondas_hoy_count": len(rondas_hoy),
        "ultima_actualizacion": datetime.now().isoformat()
    }

# ==================== REPORTES ====================

@router.get("/reportes/resumen-dia")
async def resumen_dia(fecha: Optional[str] = None):
    """Obtiene resumen del día"""
    return get_resumen_dia(fecha)

@router.get("/reportes/ranking")
async def ranking_dia(fecha: Optional[str] = None, tipo: str = "guias"):
    """Obtiene ranking del día"""
    return {
        "fecha": fecha or _hoy(),
        "tipo": tipo,
        "ranking": get_ranking(fecha, tipo)
    }

@router.get("/reportes/estadisticas/{usuario_id}")
async def estadisticas_usuario(usuario_id: str, fecha: Optional[str] = None):
    """Obtiene estadísticas de un usuario"""
    return get_estadisticas_usuario(usuario_id, fecha)

# ==================== EXPORTAR EXCEL ====================

@router.get("/exportar/excel")
async def exportar_excel(
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    usuario_id: Optional[str] = None
):
    """Exporta rondas a Excel"""
    try:
        import pandas as pd
        from io import BytesIO

        # Obtener datos
        historial = get_historial_rondas(usuario_id, dias=365)

        if fecha_inicio:
            historial = [r for r in historial if r.get('fecha', '') >= fecha_inicio]
        if fecha_fin:
            historial = [r for r in historial if r.get('fecha', '') <= fecha_fin]

        if not historial:
            raise HTTPException(status_code=404, detail="No hay datos para exportar")

        # Crear DataFrame
        df = pd.DataFrame(historial)

        # Crear archivo Excel
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Rondas', index=False)

        output.seek(0)

        filename = f"reporte_tracker_{_hoy()}.xlsx"
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    except ImportError:
        raise HTTPException(status_code=500, detail="pandas/openpyxl no instalados")

# ==================== NOTIFICACIONES ====================

# Almacenamiento de notificaciones en memoria (podrían moverse a DB)
_notificaciones: List[dict] = []

@router.get("/notificaciones")
async def obtener_notificaciones(usuario_id: Optional[str] = None):
    """Obtiene notificaciones pendientes"""
    if usuario_id:
        return [n for n in _notificaciones if n.get('usuario_id') == usuario_id or n.get('para_todos')]
    return _notificaciones

@router.post("/notificaciones")
async def crear_notificacion(
    mensaje: str,
    tipo: str = "info",
    usuario_id: Optional[str] = None
):
    """Crea una notificación"""
    notif = {
        "id": _generar_id(),
        "mensaje": mensaje,
        "tipo": tipo,
        "usuario_id": usuario_id,
        "para_todos": usuario_id is None,
        "timestamp": datetime.now().isoformat(),
        "leida": False
    }
    _notificaciones.insert(0, notif)

    # Mantener solo las últimas 100
    if len(_notificaciones) > 100:
        _notificaciones.pop()

    return notif

@router.delete("/notificaciones/{notif_id}")
async def eliminar_notificacion(notif_id: str):
    """Elimina/marca como leída una notificación"""
    global _notificaciones
    _notificaciones = [n for n in _notificaciones if n.get('id') != notif_id]
    return {"exito": True}
