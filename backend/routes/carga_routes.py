# backend/routes/carga_routes.py
# Rutas API para el sistema de cargas

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from ..database.connection import get_db
from ..services.carga_service import CargaServiceDB
from ..models.carga_models import (
    CargaCreate, CargaUpdate, CargaResponse, CargaListResponse,
    GuiaCargaCreate, GuiaCargaResponse, FiltrosCarga, HistorialResponse
)

router = APIRouter(prefix="/cargas", tags=["Cargas"])


# ==================== CARGAS ====================

@router.post("/", response_model=CargaResponse)
def crear_carga(
    usuario_id: str = Query(..., description="ID del usuario"),
    data: CargaCreate = Body(default=None),
    db: Session = Depends(get_db)
):
    """Crear una nueva carga"""
    service = CargaServiceDB(db)
    carga = service.crear_carga(usuario_id, data)

    return _carga_to_response(carga, db)


@router.get("/actual", response_model=CargaResponse)
def obtener_carga_actual(
    usuario_id: str = Query(..., description="ID del usuario"),
    db: Session = Depends(get_db)
):
    """Obtener o crear la carga actual del día para el usuario"""
    service = CargaServiceDB(db)
    carga = service.obtener_o_crear_carga_hoy(usuario_id)

    return _carga_to_response(carga, db)


@router.get("/historial", response_model=HistorialResponse)
def obtener_historial(
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    usuario_id: Optional[str] = None,
    estado: Optional[str] = None,
    limite_dias: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Obtener historial de cargas agrupado por día"""
    service = CargaServiceDB(db)

    filtros = FiltrosCarga(
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        usuario_id=usuario_id,
        estado=estado
    )

    return service.obtener_historial(filtros, limite_dias)


@router.get("/dia/{fecha}", response_model=List[CargaListResponse])
def obtener_cargas_dia(
    fecha: date,
    usuario_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Obtener cargas de un día específico"""
    service = CargaServiceDB(db)
    cargas = service.obtener_cargas_del_dia(fecha, usuario_id)

    return [_carga_to_list_response(c, db) for c in cargas]


@router.get("/{carga_id}", response_model=CargaResponse)
def obtener_carga(
    carga_id: str,
    db: Session = Depends(get_db)
):
    """Obtener una carga por ID"""
    service = CargaServiceDB(db)
    carga = service.obtener_carga(carga_id)

    if not carga:
        raise HTTPException(status_code=404, detail="Carga no encontrada")

    return _carga_to_response(carga, db)


@router.patch("/{carga_id}", response_model=CargaResponse)
def actualizar_carga(
    carga_id: str,
    data: CargaUpdate,
    db: Session = Depends(get_db)
):
    """Actualizar una carga"""
    service = CargaServiceDB(db)
    carga = service.actualizar_carga(carga_id, data)

    if not carga:
        raise HTTPException(status_code=404, detail="Carga no encontrada")

    return _carga_to_response(carga, db)


@router.post("/{carga_id}/cerrar")
def cerrar_carga(
    carga_id: str,
    db: Session = Depends(get_db)
):
    """Cerrar una carga (no se puede editar después)"""
    service = CargaServiceDB(db)

    if not service.cerrar_carga(carga_id):
        raise HTTPException(status_code=404, detail="Carga no encontrada")

    return {"message": "Carga cerrada exitosamente"}


@router.delete("/{carga_id}")
def eliminar_carga(
    carga_id: str,
    db: Session = Depends(get_db)
):
    """Eliminar una carga y sus guías"""
    service = CargaServiceDB(db)

    if not service.eliminar_carga(carga_id):
        raise HTTPException(status_code=404, detail="Carga no encontrada")

    return {"message": "Carga eliminada exitosamente"}


# ==================== GUÍAS ====================

@router.post("/{carga_id}/guias", response_model=dict)
def agregar_guias(
    carga_id: str,
    guias: List[GuiaCargaCreate],
    db: Session = Depends(get_db)
):
    """Agregar guías a una carga"""
    service = CargaServiceDB(db)

    # Verificar que la carga existe
    carga = service.obtener_carga(carga_id)
    if not carga:
        raise HTTPException(status_code=404, detail="Carga no encontrada")

    if carga.estado != "activa":
        raise HTTPException(status_code=400, detail="La carga está cerrada y no se pueden agregar guías")

    agregadas = service.agregar_guias(carga_id, guias)

    return {
        "message": f"{agregadas} guías agregadas exitosamente",
        "agregadas": agregadas,
        "total_enviadas": len(guias),
        "duplicadas": len(guias) - agregadas
    }


@router.get("/{carga_id}/guias", response_model=List[GuiaCargaResponse])
def obtener_guias(
    carga_id: str,
    busqueda: Optional[str] = None,
    transportadora: Optional[str] = None,
    ciudad_destino: Optional[str] = None,
    solo_con_novedad: bool = False,
    db: Session = Depends(get_db)
):
    """Obtener guías de una carga con filtros"""
    service = CargaServiceDB(db)

    # Verificar que la carga existe
    carga = service.obtener_carga(carga_id)
    if not carga:
        raise HTTPException(status_code=404, detail="Carga no encontrada")

    filtros = FiltrosCarga(
        busqueda=busqueda,
        transportadora=transportadora,
        ciudad_destino=ciudad_destino,
        solo_con_novedad=solo_con_novedad
    )

    guias = service.obtener_guias_carga(carga_id, filtros)

    return guias


@router.patch("/{carga_id}/guias/{guia_id}", response_model=GuiaCargaResponse)
def actualizar_guia(
    carga_id: str,
    guia_id: str,
    updates: dict,
    db: Session = Depends(get_db)
):
    """Actualizar una guía"""
    service = CargaServiceDB(db)

    guia = service.actualizar_guia(guia_id, updates)

    if not guia:
        raise HTTPException(status_code=404, detail="Guía no encontrada")

    return guia


@router.delete("/{carga_id}/guias/{guia_id}")
def eliminar_guia(
    carga_id: str,
    guia_id: str,
    db: Session = Depends(get_db)
):
    """Eliminar una guía"""
    service = CargaServiceDB(db)

    if not service.eliminar_guia(guia_id):
        raise HTTPException(status_code=404, detail="Guía no encontrada")

    return {"message": "Guía eliminada exitosamente"}


# ==================== BÚSQUEDA ====================

@router.get("/buscar/guia", response_model=list)
def buscar_guia(
    numero: str = Query(..., min_length=3),
    db: Session = Depends(get_db)
):
    """Buscar una guía en todas las cargas"""
    service = CargaServiceDB(db)
    resultados = service.buscar_guia(numero)

    return [{
        "guia": {
            "id": r["guia"].id,
            "numero_guia": r["guia"].numero_guia,
            "estado": r["guia"].estado,
            "transportadora": r["guia"].transportadora,
            "ciudad_destino": r["guia"].ciudad_destino,
            "telefono": r["guia"].telefono,
            "dias_transito": r["guia"].dias_transito,
            "tiene_novedad": r["guia"].tiene_novedad
        },
        "carga": r["carga"]
    } for r in resultados]


# ==================== UTILIDADES ====================

@router.post("/limpiar-antiguas")
def limpiar_cargas_antiguas(
    dias_maximos: int = Query(90, ge=30, le=365),
    db: Session = Depends(get_db)
):
    """Eliminar cargas más antiguas que X días"""
    service = CargaServiceDB(db)
    eliminadas = service.limpiar_cargas_antiguas(dias_maximos)

    return {
        "message": f"{eliminadas} cargas eliminadas",
        "eliminadas": eliminadas
    }


# ==================== HELPERS ====================

def _carga_to_response(carga, db: Session) -> CargaResponse:
    """Convertir modelo Carga a CargaResponse"""
    from ..models.carga_models import Usuario, CargaStats

    usuario = db.query(Usuario).filter(Usuario.id == carga.usuario_id).first()

    stats = CargaStats(
        total_guias=carga.total_guias or 0,
        entregadas=carga.entregadas or 0,
        en_transito=carga.en_transito or 0,
        con_novedad=carga.con_novedad or 0,
        devueltas=carga.devueltas or 0,
        porcentaje_entrega=carga.porcentaje_entrega or 0,
        dias_promedio_transito=carga.dias_promedio_transito or 0,
        transportadoras=carga.stats_transportadoras or {},
        ciudades=carga.stats_ciudades or {}
    )

    return CargaResponse(
        id=carga.id,
        fecha=carga.fecha,
        numero_carga=carga.numero_carga,
        nombre=carga.nombre,
        usuario_id=carga.usuario_id,
        usuario_nombre=usuario.nombre if usuario else None,
        total_guias=carga.total_guias or 0,
        estado=carga.estado,
        stats=stats,
        notas=carga.notas,
        tags=carga.tags,
        created_at=carga.created_at,
        updated_at=carga.updated_at,
        closed_at=carga.closed_at
    )


def _carga_to_list_response(carga, db: Session) -> CargaListResponse:
    """Convertir modelo Carga a CargaListResponse"""
    from ..models.carga_models import Usuario

    usuario = db.query(Usuario).filter(Usuario.id == carga.usuario_id).first()

    return CargaListResponse(
        id=carga.id,
        fecha=carga.fecha,
        numero_carga=carga.numero_carga,
        nombre=carga.nombre,
        usuario_nombre=usuario.nombre if usuario else "Desconocido",
        total_guias=carga.total_guias or 0,
        entregadas=carga.entregadas or 0,
        con_novedad=carga.con_novedad or 0,
        estado=carga.estado,
        created_at=carga.created_at
    )
