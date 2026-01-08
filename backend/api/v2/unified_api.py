"""
API Unificada v2 - LITPER
Endpoints centralizados para toda la persistencia de datos.
Reemplaza la duplicación entre Supabase y PostgreSQL.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from pydantic import BaseModel, Field
from loguru import logger

import sys
sys.path.append('..')
from database.config import get_session
from database.models import (
    GuiaHistorica,
    ArchivoCargado,
    AlertaSistema,
    ConfiguracionSistema,
    ConversacionChat,
    PrediccionTiempoReal,
)

router = APIRouter(prefix="/api/v2", tags=["unified"])


# ==================== SCHEMAS ====================

class GuiaBase(BaseModel):
    numero_guia: str
    transportadora: Optional[str] = None
    ciudad_destino: Optional[str] = None
    departamento_destino: Optional[str] = None
    estatus: Optional[str] = None
    nombre_cliente: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    valor_facturado: Optional[float] = None
    ganancia: Optional[float] = None
    tiene_novedad: bool = False
    tipo_novedad: Optional[str] = None
    descripcion_novedad: Optional[str] = None


class GuiaCreate(GuiaBase):
    pass


class GuiaUpdate(BaseModel):
    estatus: Optional[str] = None
    tiene_novedad: Optional[bool] = None
    tipo_novedad: Optional[str] = None
    descripcion_novedad: Optional[str] = None
    fue_solucionada: Optional[bool] = None
    solucion: Optional[str] = None


class GuiaResponse(GuiaBase):
    id: int
    fecha_generacion_guia: Optional[datetime] = None
    fecha_ultimo_movimiento: Optional[datetime] = None
    dias_en_transito: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CargaBase(BaseModel):
    nombre: str
    usuario_id: str
    usuario_nombre: str


class CargaCreate(CargaBase):
    guias: List[GuiaCreate] = []


class CargaResponse(BaseModel):
    id: str
    nombre: str
    numero_carga: int
    fecha: str
    usuario_id: str
    usuario_nombre: str
    estado: str
    total_guias: int
    entregadas: int
    en_transito: int
    con_novedad: int
    devueltas: int
    porcentaje_entrega: float
    valor_total: float
    ganancia_total: float
    created_at: datetime
    updated_at: datetime


class FinanzaBase(BaseModel):
    tipo: str  # 'ingreso' | 'gasto'
    categoria: str
    subcategoria: Optional[str] = None
    descripcion: str
    monto: float
    fecha: str
    mes: str


class FinanzaCreate(FinanzaBase):
    usuario_id: str


class FinanzaResponse(FinanzaBase):
    id: str
    usuario_id: str
    created_at: datetime


class SyncDataRequest(BaseModel):
    key: str
    data: Dict[str, Any]
    timestamp: Optional[int] = None


class SyncDataResponse(BaseModel):
    success: bool
    key: str
    server_timestamp: int


class StorageItem(BaseModel):
    key: str
    value: Any
    updated_at: datetime


# ==================== STORAGE SYNC ====================

# In-memory storage para sincronización (en producción usar Redis)
_sync_storage: Dict[str, Dict[str, Any]] = {}


@router.put("/storage/{key}")
async def sync_storage_item(
    key: str,
    data: Dict[str, Any],
    db: Session = Depends(get_session)
) -> SyncDataResponse:
    """
    Sincronizar un item de storage con el servidor.
    Usado por el frontend para persistir datos críticos.
    """
    try:
        _sync_storage[key] = {
            "data": data,
            "updated_at": datetime.utcnow(),
            "timestamp": int(datetime.utcnow().timestamp() * 1000)
        }

        logger.info(f"Storage sync: {key}")

        return SyncDataResponse(
            success=True,
            key=key,
            server_timestamp=_sync_storage[key]["timestamp"]
        )
    except Exception as e:
        logger.error(f"Error syncing storage {key}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/storage/{key}")
async def get_storage_item(
    key: str,
    db: Session = Depends(get_session)
) -> Optional[Dict[str, Any]]:
    """Obtener un item de storage del servidor."""
    if key in _sync_storage:
        return _sync_storage[key]["data"]
    return None


@router.get("/storage/changes")
async def get_storage_changes(
    since: Optional[str] = Query(None, description="ISO timestamp"),
    db: Session = Depends(get_session)
) -> List[Dict[str, Any]]:
    """
    Obtener cambios de storage desde una fecha.
    Usado para sincronización incremental.
    """
    changes = []
    since_dt = datetime.fromisoformat(since) if since else datetime.min

    for key, item in _sync_storage.items():
        if item["updated_at"] > since_dt:
            changes.append({
                "key": key,
                "data": item["data"],
                "timestamp": item["timestamp"]
            })

    return changes


# ==================== GUÍAS ====================

@router.get("/guias", response_model=List[GuiaResponse])
async def get_guias(
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    estado: Optional[str] = None,
    transportadora: Optional[str] = None,
    ciudad: Optional[str] = None,
    con_novedad: Optional[bool] = None,
    fecha_desde: Optional[str] = None,
    fecha_hasta: Optional[str] = None,
    db: Session = Depends(get_session)
) -> List[GuiaResponse]:
    """
    Obtener guías con filtros opcionales.
    Reemplaza guiasService.getAll() de Supabase.
    """
    try:
        query = db.query(GuiaHistorica)

        if estado:
            query = query.filter(GuiaHistorica.estatus.ilike(f"%{estado}%"))
        if transportadora:
            query = query.filter(GuiaHistorica.transportadora == transportadora)
        if ciudad:
            query = query.filter(GuiaHistorica.ciudad_destino.ilike(f"%{ciudad}%"))
        if con_novedad is not None:
            query = query.filter(GuiaHistorica.tiene_novedad == con_novedad)
        if fecha_desde:
            query = query.filter(GuiaHistorica.fecha_generacion_guia >= fecha_desde)
        if fecha_hasta:
            query = query.filter(GuiaHistorica.fecha_generacion_guia <= fecha_hasta)

        guias = query.order_by(GuiaHistorica.id.desc()).offset(offset).limit(limit).all()

        return [GuiaResponse.model_validate(g) for g in guias]
    except Exception as e:
        logger.error(f"Error getting guias: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/guias/{guia_id}", response_model=GuiaResponse)
async def get_guia(
    guia_id: int,
    db: Session = Depends(get_session)
) -> GuiaResponse:
    """Obtener una guía por ID."""
    guia = db.query(GuiaHistorica).filter(GuiaHistorica.id == guia_id).first()
    if not guia:
        raise HTTPException(status_code=404, detail="Guía no encontrada")
    return GuiaResponse.model_validate(guia)


@router.get("/guias/numero/{numero_guia}", response_model=GuiaResponse)
async def get_guia_by_numero(
    numero_guia: str,
    db: Session = Depends(get_session)
) -> GuiaResponse:
    """Obtener una guía por número."""
    guia = db.query(GuiaHistorica).filter(GuiaHistorica.numero_guia == numero_guia).first()
    if not guia:
        raise HTTPException(status_code=404, detail="Guía no encontrada")
    return GuiaResponse.model_validate(guia)


@router.post("/guias", response_model=GuiaResponse)
async def create_guia(
    guia: GuiaCreate,
    db: Session = Depends(get_session)
) -> GuiaResponse:
    """
    Crear una nueva guía.
    Reemplaza guiasService.create() de Supabase.
    """
    try:
        db_guia = GuiaHistorica(
            numero_guia=guia.numero_guia,
            transportadora=guia.transportadora,
            ciudad_destino=guia.ciudad_destino,
            departamento_destino=guia.departamento_destino,
            estatus=guia.estatus or "PENDIENTE",
            nombre_cliente=guia.nombre_cliente,
            telefono=guia.telefono,
            direccion=guia.direccion,
            valor_facturado=guia.valor_facturado,
            ganancia=guia.ganancia,
            tiene_novedad=guia.tiene_novedad,
            tipo_novedad=guia.tipo_novedad,
            descripcion_novedad=guia.descripcion_novedad,
            fecha_generacion_guia=datetime.utcnow(),
        )

        db.add(db_guia)
        db.commit()
        db.refresh(db_guia)

        logger.info(f"Guía creada: {guia.numero_guia}")
        return GuiaResponse.model_validate(db_guia)
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating guia: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/guias/batch", response_model=List[GuiaResponse])
async def create_guias_batch(
    guias: List[GuiaCreate],
    db: Session = Depends(get_session)
) -> List[GuiaResponse]:
    """
    Crear múltiples guías en batch.
    Reemplaza guiasService.createMany() de Supabase.
    """
    try:
        created = []
        for guia in guias:
            # Verificar si ya existe
            existing = db.query(GuiaHistorica).filter(
                GuiaHistorica.numero_guia == guia.numero_guia
            ).first()

            if existing:
                continue  # Skip duplicados

            db_guia = GuiaHistorica(
                numero_guia=guia.numero_guia,
                transportadora=guia.transportadora,
                ciudad_destino=guia.ciudad_destino,
                departamento_destino=guia.departamento_destino,
                estatus=guia.estatus or "PENDIENTE",
                nombre_cliente=guia.nombre_cliente,
                telefono=guia.telefono,
                direccion=guia.direccion,
                valor_facturado=guia.valor_facturado,
                ganancia=guia.ganancia,
                tiene_novedad=guia.tiene_novedad,
                tipo_novedad=guia.tipo_novedad,
                descripcion_novedad=guia.descripcion_novedad,
                fecha_generacion_guia=datetime.utcnow(),
            )
            db.add(db_guia)
            created.append(db_guia)

        db.commit()

        for g in created:
            db.refresh(g)

        logger.info(f"Batch creado: {len(created)} guías")
        return [GuiaResponse.model_validate(g) for g in created]
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating batch: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/guias/{guia_id}", response_model=GuiaResponse)
async def update_guia(
    guia_id: int,
    updates: GuiaUpdate,
    db: Session = Depends(get_session)
) -> GuiaResponse:
    """Actualizar una guía."""
    guia = db.query(GuiaHistorica).filter(GuiaHistorica.id == guia_id).first()
    if not guia:
        raise HTTPException(status_code=404, detail="Guía no encontrada")

    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(guia, field, value)

    guia.fecha_ultimo_movimiento = datetime.utcnow()

    db.commit()
    db.refresh(guia)

    return GuiaResponse.model_validate(guia)


@router.delete("/guias/{guia_id}")
async def delete_guia(
    guia_id: int,
    db: Session = Depends(get_session)
) -> Dict[str, bool]:
    """Eliminar una guía."""
    guia = db.query(GuiaHistorica).filter(GuiaHistorica.id == guia_id).first()
    if not guia:
        raise HTTPException(status_code=404, detail="Guía no encontrada")

    db.delete(guia)
    db.commit()

    return {"success": True}


# ==================== ESTADÍSTICAS ====================

@router.get("/guias/stats/resumen")
async def get_guias_stats(
    db: Session = Depends(get_session)
) -> Dict[str, Any]:
    """
    Obtener estadísticas de guías.
    Reemplaza guiasService.getStats() de Supabase.
    """
    try:
        total = db.query(func.count(GuiaHistorica.id)).scalar() or 0

        entregadas = db.query(func.count(GuiaHistorica.id)).filter(
            GuiaHistorica.estatus.ilike("%entregad%")
        ).scalar() or 0

        en_transito = db.query(func.count(GuiaHistorica.id)).filter(
            or_(
                GuiaHistorica.estatus.ilike("%transito%"),
                GuiaHistorica.estatus.ilike("%ruta%")
            )
        ).scalar() or 0

        con_novedad = db.query(func.count(GuiaHistorica.id)).filter(
            GuiaHistorica.tiene_novedad == True
        ).scalar() or 0

        devueltas = db.query(func.count(GuiaHistorica.id)).filter(
            or_(
                GuiaHistorica.estatus.ilike("%devolu%"),
                GuiaHistorica.estatus.ilike("%retorno%")
            )
        ).scalar() or 0

        return {
            "total": total,
            "entregadas": entregadas,
            "enTransito": en_transito,
            "conNovedad": con_novedad,
            "devueltas": devueltas,
            "tasaEntrega": round((entregadas / total * 100) if total > 0 else 0, 2),
        }
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/guias/stats/hoy")
async def get_guias_hoy(
    db: Session = Depends(get_session)
) -> Dict[str, Any]:
    """Obtener estadísticas del día de hoy."""
    hoy = datetime.utcnow().date()

    guias_hoy = db.query(GuiaHistorica).filter(
        func.date(GuiaHistorica.fecha_generacion_guia) == hoy
    ).all()

    total = len(guias_hoy)
    entregadas = sum(1 for g in guias_hoy if g.estatus and 'entregad' in g.estatus.lower())
    valor_total = sum(g.valor_facturado or 0 for g in guias_hoy)
    ganancia_total = sum(g.ganancia or 0 for g in guias_hoy)

    return {
        "guiasHoy": total,
        "entregadasHoy": entregadas,
        "valorTotal": valor_total,
        "gananciaTotal": ganancia_total,
        "fecha": hoy.isoformat(),
    }


# ==================== CARGAS ====================

# Storage temporal para cargas (en producción, crear tabla en PostgreSQL)
_cargas_storage: Dict[str, Dict[str, Any]] = {}
_carga_counter = 0


@router.get("/cargas")
async def get_cargas(
    estado: Optional[str] = None,
    usuario_id: Optional[str] = None,
    db: Session = Depends(get_session)
) -> List[Dict[str, Any]]:
    """
    Obtener todas las cargas.
    Reemplaza cargasService.getAll() de Supabase.
    """
    cargas = list(_cargas_storage.values())

    if estado:
        cargas = [c for c in cargas if c.get("estado") == estado]
    if usuario_id:
        cargas = [c for c in cargas if c.get("usuario_id") == usuario_id]

    return sorted(cargas, key=lambda x: x.get("created_at", ""), reverse=True)


@router.get("/cargas/activas")
async def get_cargas_activas(
    db: Session = Depends(get_session)
) -> List[Dict[str, Any]]:
    """Obtener solo cargas activas."""
    return [c for c in _cargas_storage.values() if c.get("estado") == "activa"]


@router.get("/cargas/{carga_id}")
async def get_carga(
    carga_id: str,
    db: Session = Depends(get_session)
) -> Dict[str, Any]:
    """Obtener una carga por ID."""
    if carga_id not in _cargas_storage:
        raise HTTPException(status_code=404, detail="Carga no encontrada")
    return _cargas_storage[carga_id]


@router.post("/cargas")
async def create_carga(
    carga: CargaCreate,
    db: Session = Depends(get_session)
) -> Dict[str, Any]:
    """
    Crear una nueva carga.
    Reemplaza cargasService.create() de Supabase y cargaService local.
    """
    global _carga_counter
    _carga_counter += 1

    hoy = datetime.utcnow().strftime("%Y-%m-%d")
    carga_id = f"carga_{hoy}_{_carga_counter}_{int(datetime.utcnow().timestamp())}"

    now = datetime.utcnow()

    nueva_carga = {
        "id": carga_id,
        "nombre": carga.nombre,
        "numero_carga": _carga_counter,
        "fecha": hoy,
        "usuario_id": carga.usuario_id,
        "usuario_nombre": carga.usuario_nombre,
        "estado": "activa",
        "total_guias": len(carga.guias),
        "entregadas": 0,
        "en_transito": len(carga.guias),
        "con_novedad": 0,
        "devueltas": 0,
        "porcentaje_entrega": 0.0,
        "valor_total": sum(g.valor_facturado or 0 for g in carga.guias),
        "ganancia_total": sum(g.ganancia or 0 for g in carga.guias),
        "guias": [g.model_dump() for g in carga.guias],
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }

    _cargas_storage[carga_id] = nueva_carga

    logger.info(f"Carga creada: {carga_id}")
    return nueva_carga


@router.patch("/cargas/{carga_id}")
async def update_carga(
    carga_id: str,
    updates: Dict[str, Any],
    db: Session = Depends(get_session)
) -> Dict[str, Any]:
    """Actualizar una carga."""
    if carga_id not in _cargas_storage:
        raise HTTPException(status_code=404, detail="Carga no encontrada")

    carga = _cargas_storage[carga_id]
    carga.update(updates)
    carga["updated_at"] = datetime.utcnow().isoformat()

    return carga


@router.post("/cargas/{carga_id}/cerrar")
async def cerrar_carga(
    carga_id: str,
    db: Session = Depends(get_session)
) -> Dict[str, Any]:
    """Cerrar una carga."""
    if carga_id not in _cargas_storage:
        raise HTTPException(status_code=404, detail="Carga no encontrada")

    carga = _cargas_storage[carga_id]
    carga["estado"] = "cerrada"
    carga["closed_at"] = datetime.utcnow().isoformat()
    carga["updated_at"] = datetime.utcnow().isoformat()

    return carga


# ==================== FINANZAS ====================

_finanzas_storage: Dict[str, Dict[str, Any]] = {}


@router.get("/finanzas")
async def get_finanzas(
    mes: Optional[str] = None,
    tipo: Optional[str] = None,
    db: Session = Depends(get_session)
) -> List[Dict[str, Any]]:
    """
    Obtener registros financieros.
    Reemplaza finanzasService de Supabase.
    """
    finanzas = list(_finanzas_storage.values())

    if mes:
        finanzas = [f for f in finanzas if f.get("mes") == mes]
    if tipo:
        finanzas = [f for f in finanzas if f.get("tipo") == tipo]

    return sorted(finanzas, key=lambda x: x.get("fecha", ""), reverse=True)


@router.get("/finanzas/resumen/{mes}")
async def get_resumen_mes(
    mes: str,
    db: Session = Depends(get_session)
) -> Dict[str, Any]:
    """Obtener resumen financiero de un mes."""
    finanzas = [f for f in _finanzas_storage.values() if f.get("mes") == mes]

    ingresos = sum(f["monto"] for f in finanzas if f["tipo"] == "ingreso")
    gastos = sum(f["monto"] for f in finanzas if f["tipo"] == "gasto")
    utilidad = ingresos - gastos
    margen = (utilidad / ingresos * 100) if ingresos > 0 else 0

    return {
        "mes": mes,
        "ingresos": ingresos,
        "gastos": gastos,
        "utilidad": utilidad,
        "margen": round(margen, 2),
    }


@router.post("/finanzas")
async def create_finanza(
    finanza: FinanzaCreate,
    db: Session = Depends(get_session)
) -> Dict[str, Any]:
    """Crear un registro financiero."""
    finanza_id = f"fin_{int(datetime.utcnow().timestamp())}"

    nueva_finanza = {
        "id": finanza_id,
        **finanza.model_dump(),
        "created_at": datetime.utcnow().isoformat(),
    }

    _finanzas_storage[finanza_id] = nueva_finanza
    return nueva_finanza


# ==================== ALERTAS ====================

@router.get("/alertas")
async def get_alertas(
    leida: Optional[bool] = None,
    limit: int = Query(20, le=100),
    db: Session = Depends(get_session)
) -> List[Dict[str, Any]]:
    """Obtener alertas del sistema."""
    try:
        query = db.query(AlertaSistema)

        if leida is not None:
            query = query.filter(AlertaSistema.esta_activa == (not leida))

        alertas = query.order_by(AlertaSistema.fecha_creacion.desc()).limit(limit).all()

        return [{
            "id": a.id,
            "tipo": a.tipo.value if a.tipo else None,
            "severidad": a.severidad.value if a.severidad else None,
            "mensaje": a.mensaje,
            "leida": not a.esta_activa,
            "created_at": a.fecha_creacion.isoformat() if a.fecha_creacion else None,
        } for a in alertas]
    except Exception as e:
        logger.error(f"Error getting alertas: {e}")
        return []


@router.post("/alertas/{alerta_id}/leer")
async def marcar_alerta_leida(
    alerta_id: int,
    db: Session = Depends(get_session)
) -> Dict[str, bool]:
    """Marcar una alerta como leída."""
    alerta = db.query(AlertaSistema).filter(AlertaSistema.id == alerta_id).first()
    if alerta:
        alerta.esta_activa = False
        db.commit()
    return {"success": True}


# ==================== DASHBOARD ====================

@router.get("/dashboard/stats")
async def get_dashboard_stats(
    db: Session = Depends(get_session)
) -> Dict[str, Any]:
    """
    Obtener estadísticas para el dashboard.
    Reemplaza dashboardService de Supabase.
    """
    try:
        guias_stats = await get_guias_stats(db)
        guias_hoy = await get_guias_hoy(db)
        cargas_activas = await get_cargas_activas(db)
        alertas = await get_alertas(leida=False, db=db)

        return {
            **guias_stats,
            **guias_hoy,
            "cargasActivas": len(cargas_activas),
            "alertasNoLeidas": len(alertas),
        }
    except Exception as e:
        logger.error(f"Error getting dashboard stats: {e}")
        return {
            "total": 0,
            "entregadas": 0,
            "enTransito": 0,
            "conNovedad": 0,
            "devueltas": 0,
            "tasaEntrega": 0,
            "guiasHoy": 0,
            "entregadasHoy": 0,
            "valorTotal": 0,
            "gananciaTotal": 0,
            "cargasActivas": 0,
            "alertasNoLeidas": 0,
        }


# ==================== HEALTH CHECK ====================

@router.get("/health")
async def health_check(db: Session = Depends(get_session)) -> Dict[str, Any]:
    """Health check del API."""
    try:
        # Test DB connection
        db.execute("SELECT 1")
        db_status = "healthy"
    except Exception:
        db_status = "unhealthy"

    return {
        "status": "ok",
        "database": db_status,
        "timestamp": datetime.utcnow().isoformat(),
        "version": "2.0.0",
    }
