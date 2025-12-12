"""
LITPER - Rutas de API para Tracking de Guías
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from loguru import logger

from services.tracking_service import (
    tracking_service,
    TrackingResult,
    CarrierType,
    TrackingStatus
)


router = APIRouter(prefix="/tracking", tags=["Tracking"])


# ==================== MODELOS ====================

class TrackingRequest(BaseModel):
    """Request para tracking individual"""
    tracking_number: str = Field(..., min_length=5, max_length=50)
    carrier: Optional[str] = None


class BulkTrackingRequest(BaseModel):
    """Request para tracking masivo"""
    tracking_numbers: List[str] = Field(..., min_items=1, max_items=100)


class TrackingResponse(BaseModel):
    """Response de tracking"""
    tracking_number: str
    carrier: str
    current_status: str
    status_description: str
    origin_city: str = ""
    destination_city: str = ""
    recipient_name: str = ""
    days_in_transit: int = 0
    has_issue: bool = False
    issue_type: str = ""
    events: List[dict] = []
    success: bool = True
    error_message: str = ""


# ==================== ENDPOINTS ====================

@router.get("/status/{tracking_number}", response_model=TrackingResponse)
async def get_tracking_status(
    tracking_number: str,
    carrier: Optional[str] = Query(None, description="Forzar transportadora específica")
):
    """
    Obtiene el estado de tracking de una guía

    - **tracking_number**: Número de guía a consultar
    - **carrier**: (Opcional) Transportadora específica
    """
    try:
        carrier_type = None
        if carrier:
            try:
                carrier_type = CarrierType[carrier.upper()]
            except KeyError:
                pass

        result = await tracking_service.get_tracking(
            tracking_number=tracking_number,
            carrier=carrier_type
        )

        return TrackingResponse(
            tracking_number=result.tracking_number,
            carrier=result.carrier.value,
            current_status=result.current_status.value,
            status_description=result.status_description,
            origin_city=result.origin_city,
            destination_city=result.destination_city,
            recipient_name=result.recipient_name,
            days_in_transit=result.days_in_transit,
            has_issue=result.has_issue,
            issue_type=result.issue_type,
            events=[{
                "timestamp": e.timestamp.isoformat(),
                "status": e.status.value,
                "description": e.description,
                "location": e.location,
                "city": e.city
            } for e in result.events],
            success=result.success,
            error_message=result.error_message
        )

    except Exception as e:
        logger.error(f"Error en tracking {tracking_number}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bulk", response_model=List[TrackingResponse])
async def get_bulk_tracking(request: BulkTrackingRequest):
    """
    Obtiene el estado de tracking de múltiples guías

    - **tracking_numbers**: Lista de números de guía (máximo 100)
    """
    try:
        results = await tracking_service.get_bulk_tracking(
            tracking_numbers=request.tracking_numbers
        )

        return [
            TrackingResponse(
                tracking_number=r.tracking_number,
                carrier=r.carrier.value,
                current_status=r.current_status.value,
                status_description=r.status_description,
                destination_city=r.destination_city,
                days_in_transit=r.days_in_transit,
                has_issue=r.has_issue,
                issue_type=r.issue_type,
                success=r.success,
                error_message=r.error_message
            )
            for r in results
        ]

    except Exception as e:
        logger.error(f"Error en bulk tracking: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/detect-carrier/{tracking_number}")
async def detect_carrier(tracking_number: str):
    """
    Detecta la transportadora basándose en el número de guía

    - **tracking_number**: Número de guía
    """
    carrier = tracking_service.detect_carrier(tracking_number)

    return {
        "tracking_number": tracking_number,
        "detected_carrier": carrier.value,
        "is_known": carrier != CarrierType.UNKNOWN
    }


@router.get("/carriers")
async def list_carriers():
    """
    Lista las transportadoras soportadas
    """
    return {
        "carriers": [
            {
                "id": c.value,
                "name": c.value.replace("_", " ").title(),
                "supported": True
            }
            for c in CarrierType
            if c != CarrierType.UNKNOWN
        ]
    }


@router.get("/statuses")
async def list_statuses():
    """
    Lista los estados de tracking disponibles
    """
    status_descriptions = {
        TrackingStatus.CREATED: "Guía creada",
        TrackingStatus.PICKED_UP: "Recogido",
        TrackingStatus.IN_TRANSIT: "En tránsito",
        TrackingStatus.IN_WAREHOUSE: "En bodega/centro",
        TrackingStatus.OUT_FOR_DELIVERY: "En reparto",
        TrackingStatus.DELIVERED: "Entregado",
        TrackingStatus.RETURNED: "Devuelto",
        TrackingStatus.EXCEPTION: "Novedad/Problema",
        TrackingStatus.CANCELLED: "Cancelado",
        TrackingStatus.UNKNOWN: "Desconocido"
    }

    return {
        "statuses": [
            {
                "id": s.value,
                "description": status_descriptions.get(s, s.value)
            }
            for s in TrackingStatus
        ]
    }


@router.post("/cache/clear")
async def clear_tracking_cache():
    """
    Limpia el caché de tracking
    """
    tracking_service.clear_cache()
    return {"success": True, "message": "Caché limpiado"}


@router.get("/cache/stats")
async def get_cache_stats():
    """
    Obtiene estadísticas del caché de tracking
    """
    return tracking_service.get_cache_stats()
