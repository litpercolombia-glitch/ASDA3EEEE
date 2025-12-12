"""
LITPER - Rutas de API para Sistema de Rescate
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response
from pydantic import BaseModel, Field
from loguru import logger

from services.rescue_service import (
    rescue_service,
    RescueItem,
    RescuePriority,
    RescueStatus,
    NoveltyType
)


router = APIRouter(prefix="/rescue", tags=["Sistema de Rescate"])


# ==================== MODELOS ====================

class AddToQueueRequest(BaseModel):
    """Request para añadir guía a cola de rescate"""
    tracking_number: str = Field(..., min_length=5)
    carrier: str
    customer_name: str
    customer_phone: str
    destination_city: str
    address: str = ""
    novelty_type: str = "OTRO"
    novelty_description: str = ""
    days_without_movement: int = 0


class BulkAddRequest(BaseModel):
    """Request para añadir múltiples guías"""
    guides: List[AddToQueueRequest]


class RescueItemResponse(BaseModel):
    """Response de item de rescate"""
    id: str
    tracking_number: str
    carrier: str
    customer_name: str
    customer_phone: str
    destination_city: str
    novelty_type: str
    novelty_description: str
    days_without_movement: int
    priority: str
    status: str
    recovery_probability: float
    attempts: int
    whatsapp_sent: bool
    call_made: bool
    notes: List[str]


class CallScriptResponse(BaseModel):
    """Response de script de llamada"""
    tracking_number: str
    customer_name: str
    phone: str
    novelty_type: str
    script: str
    tips: List[str]


class MarkCallRequest(BaseModel):
    """Request para marcar llamada completada"""
    result: str = Field(..., description="Resultado de la llamada")
    notes: str = ""


class RescheduleRequest(BaseModel):
    """Request para reagendar"""
    next_action_at: datetime
    notes: str = ""


# ==================== ENDPOINTS ====================

@router.post("/queue/add", response_model=RescueItemResponse)
async def add_to_queue(request: AddToQueueRequest):
    """
    Añade una guía a la cola de rescate

    La prioridad se calcula automáticamente según días sin movimiento y tipo de novedad.
    """
    try:
        item = rescue_service.add_to_queue(
            tracking_number=request.tracking_number,
            carrier=request.carrier,
            customer_name=request.customer_name,
            customer_phone=request.customer_phone,
            destination_city=request.destination_city,
            address=request.address,
            novelty_type=request.novelty_type,
            novelty_description=request.novelty_description,
            days_without_movement=request.days_without_movement
        )

        return _item_to_response(item)

    except Exception as e:
        logger.error(f"Error añadiendo a cola: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/queue/bulk-add")
async def bulk_add_to_queue(request: BulkAddRequest):
    """
    Añade múltiples guías a la cola de rescate
    """
    try:
        guides_data = [g.dict() for g in request.guides]
        items = rescue_service.add_bulk_to_queue(guides_data)

        return {
            "success": True,
            "added": len(items),
            "items": [_item_to_response(i) for i in items]
        }

    except Exception as e:
        logger.error(f"Error en bulk add: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/queue", response_model=List[RescueItemResponse])
async def get_queue(
    priority: Optional[str] = Query(None, description="Filtrar por prioridad: CRITICAL, HIGH, MEDIUM, LOW"),
    status: Optional[str] = Query(None, description="Filtrar por estado"),
    limit: int = Query(100, ge=1, le=500)
):
    """
    Obtiene la cola de rescate

    - **priority**: Filtrar por prioridad
    - **status**: Filtrar por estado
    - **limit**: Máximo de resultados
    """
    try:
        priority_filter = None
        if priority:
            try:
                priority_filter = RescuePriority[priority.upper()]
            except KeyError:
                pass

        status_filter = None
        if status:
            try:
                status_filter = RescueStatus[status.upper()]
            except KeyError:
                pass

        items = rescue_service.get_queue(
            priority=priority_filter,
            status=status_filter,
            limit=limit
        )

        return [_item_to_response(i) for i in items]

    except Exception as e:
        logger.error(f"Error obteniendo cola: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/queue/{tracking_number}", response_model=RescueItemResponse)
async def get_queue_item(tracking_number: str):
    """
    Obtiene un item específico de la cola
    """
    item = rescue_service.get_item(tracking_number)
    if not item:
        raise HTTPException(status_code=404, detail="Guía no encontrada en cola de rescate")

    return _item_to_response(item)


@router.post("/queue/{tracking_number}/whatsapp")
async def send_whatsapp(tracking_number: str):
    """
    Envía mensaje de WhatsApp de rescate a la guía
    """
    result = await rescue_service.send_whatsapp(tracking_number)

    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))

    return result


@router.post("/queue/whatsapp-bulk")
async def send_bulk_whatsapp(
    priority: Optional[str] = Query(None, description="Enviar solo a guías con esta prioridad")
):
    """
    Envía WhatsApp masivo a guías en cola pendientes
    """
    priority_filter = None
    if priority:
        try:
            priority_filter = RescuePriority[priority.upper()]
        except KeyError:
            pass

    result = await rescue_service.send_bulk_whatsapp(priority=priority_filter)
    return result


@router.get("/queue/{tracking_number}/call-script", response_model=CallScriptResponse)
async def get_call_script(tracking_number: str):
    """
    Obtiene el script de llamada para una guía
    """
    result = rescue_service.get_call_script(tracking_number)

    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])

    return CallScriptResponse(**result)


@router.post("/queue/{tracking_number}/call-completed")
async def mark_call_completed(tracking_number: str, request: MarkCallRequest):
    """
    Marca una llamada como completada
    """
    result = rescue_service.mark_call_completed(
        tracking_number=tracking_number,
        result=request.result,
        notes=request.notes
    )

    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))

    return {"success": True, "message": "Llamada registrada"}


@router.post("/queue/{tracking_number}/recovered")
async def mark_recovered(
    tracking_number: str,
    notes: str = Query("", description="Notas sobre la recuperación")
):
    """
    Marca una guía como recuperada exitosamente
    """
    result = rescue_service.mark_recovered(tracking_number, notes)

    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))

    return result


@router.post("/queue/{tracking_number}/lost")
async def mark_lost(
    tracking_number: str,
    reason: str = Query("", description="Razón de pérdida")
):
    """
    Marca una guía como perdida (devolución)
    """
    result = rescue_service.mark_lost(tracking_number, reason)

    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))

    return result


@router.post("/queue/{tracking_number}/reschedule")
async def reschedule(tracking_number: str, request: RescheduleRequest):
    """
    Reagenda una acción de rescate
    """
    result = rescue_service.reschedule(
        tracking_number=tracking_number,
        next_action_at=request.next_action_at,
        notes=request.notes
    )

    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))

    return result


@router.get("/stats")
async def get_stats():
    """
    Obtiene estadísticas del sistema de rescate
    """
    stats = rescue_service.get_stats()

    return {
        "total_in_queue": stats.total_in_queue,
        "by_priority": {
            "critical": stats.critical,
            "high": stats.high,
            "medium": stats.medium,
            "low": stats.low
        },
        "recovered_today": stats.recovered_today,
        "recovered_week": stats.recovered_week,
        "lost_today": stats.lost_today,
        "recovery_rate": stats.recovery_rate
    }


@router.get("/export/csv")
async def export_csv():
    """
    Exporta la cola de rescate a CSV
    """
    csv_content = rescue_service.export_queue_csv()

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=rescue_queue_{datetime.now().strftime('%Y%m%d_%H%M')}.csv"
        }
    )


@router.get("/novelty-types")
async def list_novelty_types():
    """
    Lista los tipos de novedad disponibles
    """
    from services.rescue_service import RECOVERY_RATES

    return {
        "types": [
            {
                "id": n.value,
                "name": n.value.replace("_", " ").title(),
                "recovery_rate": RECOVERY_RATES.get(n, 0.5)
            }
            for n in NoveltyType
        ]
    }


@router.get("/priorities")
async def list_priorities():
    """
    Lista las prioridades disponibles
    """
    return {
        "priorities": [
            {"id": p.value, "name": p.value, "order": i}
            for i, p in enumerate(RescuePriority)
        ]
    }


def _item_to_response(item: RescueItem) -> RescueItemResponse:
    """Convierte RescueItem a RescueItemResponse"""
    return RescueItemResponse(
        id=item.id,
        tracking_number=item.tracking_number,
        carrier=item.carrier,
        customer_name=item.customer_name,
        customer_phone=item.customer_phone,
        destination_city=item.destination_city,
        novelty_type=item.novelty_type.value,
        novelty_description=item.novelty_description,
        days_without_movement=item.days_without_movement,
        priority=item.priority.value,
        status=item.status.value,
        recovery_probability=item.recovery_probability,
        attempts=item.attempts,
        whatsapp_sent=item.whatsapp_sent,
        call_made=item.call_made,
        notes=item.notes
    )
