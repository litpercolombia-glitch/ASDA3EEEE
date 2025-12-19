"""
Rutas para Webhooks del sistema Litper Pro.
"""

import os
import secrets
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field, HttpUrl
from sqlalchemy.orm import Session
from loguru import logger

# Importar dependencias del proyecto
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_session
from services.webhook_service import webhook_service

router = APIRouter(prefix="/api/webhooks", tags=["Webhooks"])


# ==================== MODELOS PYDANTIC ====================

class WebhookCreate(BaseModel):
    """Modelo para crear webhook"""
    name: str = Field(..., min_length=1, max_length=100)
    url: str = Field(..., min_length=10)
    events: List[str] = Field(..., min_items=1)
    description: Optional[str] = None


class WebhookUpdate(BaseModel):
    """Modelo para actualizar webhook"""
    name: Optional[str] = None
    url: Optional[str] = None
    events: Optional[List[str]] = None
    is_active: Optional[bool] = None
    description: Optional[str] = None


class WebhookResponse(BaseModel):
    """Respuesta de webhook"""
    id: int
    name: str
    url: str
    events: List[str]
    is_active: bool
    secret: Optional[str] = None
    created_at: str
    last_triggered: Optional[str] = None
    failure_count: int
    description: Optional[str] = None


class WebhookTestRequest(BaseModel):
    """Request para probar webhook"""
    payload: Optional[dict] = None


class DeliveryRecord(BaseModel):
    """Registro de entrega de webhook"""
    id: int
    event_type: str
    success: bool
    status_code: Optional[int]
    created_at: str
    delivered_at: Optional[str]


# ==================== ALMACENAMIENTO EN MEMORIA ====================
# En producción, usar base de datos

_webhooks: dict = {}  # id -> webhook_data
_webhook_counter: int = 0
_deliveries: list = []  # Lista de entregas recientes


def _get_next_id() -> int:
    global _webhook_counter
    _webhook_counter += 1
    return _webhook_counter


# ==================== ENDPOINTS ====================

@router.get("/events")
async def list_available_events():
    """
    Lista todos los eventos disponibles para webhooks.

    Returns:
        Dict con eventos y sus descripciones
    """
    return {
        "events": webhook_service.get_available_events(),
        "total": len(webhook_service.AVAILABLE_EVENTS)
    }


@router.post("/", response_model=WebhookResponse)
async def create_webhook(
    webhook: WebhookCreate,
    session: Session = Depends(get_session)
):
    """
    Crea un nuevo endpoint de webhook.

    Args:
        webhook: Datos del webhook

    Returns:
        Webhook creado con secret (solo se muestra una vez)
    """
    # Validar eventos
    available_events = webhook_service.get_available_events()
    invalid_events = [e for e in webhook.events if e not in available_events]
    if invalid_events:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Eventos inválidos: {invalid_events}"
        )

    # Generar secret
    secret = secrets.token_hex(32)

    # Crear webhook
    webhook_id = _get_next_id()
    webhook_data = {
        "id": webhook_id,
        "name": webhook.name,
        "url": str(webhook.url),
        "events": webhook.events,
        "secret": secret,
        "is_active": True,
        "created_at": datetime.utcnow().isoformat(),
        "last_triggered": None,
        "failure_count": 0,
        "description": webhook.description
    }

    _webhooks[webhook_id] = webhook_data

    logger.info(f"Webhook creado: {webhook.name} (ID: {webhook_id})")

    return WebhookResponse(
        id=webhook_id,
        name=webhook.name,
        url=str(webhook.url),
        events=webhook.events,
        is_active=True,
        secret=secret,  # Solo se muestra una vez
        created_at=webhook_data["created_at"],
        last_triggered=None,
        failure_count=0,
        description=webhook.description
    )


@router.get("/")
async def list_webhooks(
    session: Session = Depends(get_session)
):
    """
    Lista todos los webhooks configurados.

    Returns:
        Lista de webhooks (sin secrets)
    """
    return {
        "total": len(_webhooks),
        "webhooks": [
            {
                "id": wh["id"],
                "name": wh["name"],
                "url": wh["url"],
                "events": wh["events"],
                "is_active": wh["is_active"],
                "created_at": wh["created_at"],
                "last_triggered": wh["last_triggered"],
                "failure_count": wh["failure_count"],
                "description": wh.get("description")
            }
            for wh in _webhooks.values()
        ]
    }


@router.get("/{webhook_id}")
async def get_webhook(
    webhook_id: int,
    session: Session = Depends(get_session)
):
    """
    Obtiene detalles de un webhook específico.

    Args:
        webhook_id: ID del webhook

    Returns:
        Detalles del webhook (sin secret)
    """
    if webhook_id not in _webhooks:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Webhook no encontrado"
        )

    wh = _webhooks[webhook_id]
    return {
        "id": wh["id"],
        "name": wh["name"],
        "url": wh["url"],
        "events": wh["events"],
        "is_active": wh["is_active"],
        "created_at": wh["created_at"],
        "last_triggered": wh["last_triggered"],
        "failure_count": wh["failure_count"],
        "description": wh.get("description")
    }


@router.put("/{webhook_id}")
async def update_webhook(
    webhook_id: int,
    update: WebhookUpdate,
    session: Session = Depends(get_session)
):
    """
    Actualiza un webhook existente.

    Args:
        webhook_id: ID del webhook
        update: Campos a actualizar

    Returns:
        Webhook actualizado
    """
    if webhook_id not in _webhooks:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Webhook no encontrado"
        )

    wh = _webhooks[webhook_id]

    if update.name is not None:
        wh["name"] = update.name
    if update.url is not None:
        wh["url"] = str(update.url)
    if update.events is not None:
        # Validar eventos
        available_events = webhook_service.get_available_events()
        invalid_events = [e for e in update.events if e not in available_events]
        if invalid_events:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Eventos inválidos: {invalid_events}"
            )
        wh["events"] = update.events
    if update.is_active is not None:
        wh["is_active"] = update.is_active
    if update.description is not None:
        wh["description"] = update.description

    logger.info(f"Webhook actualizado: {wh['name']} (ID: {webhook_id})")

    return {
        "success": True,
        "message": "Webhook actualizado",
        "webhook": {
            "id": wh["id"],
            "name": wh["name"],
            "url": wh["url"],
            "events": wh["events"],
            "is_active": wh["is_active"]
        }
    }


@router.delete("/{webhook_id}")
async def delete_webhook(
    webhook_id: int,
    session: Session = Depends(get_session)
):
    """
    Elimina un webhook.

    Args:
        webhook_id: ID del webhook a eliminar

    Returns:
        Confirmación de eliminación
    """
    if webhook_id not in _webhooks:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Webhook no encontrado"
        )

    webhook_name = _webhooks[webhook_id]["name"]
    del _webhooks[webhook_id]

    logger.info(f"Webhook eliminado: {webhook_name} (ID: {webhook_id})")

    return {"success": True, "message": "Webhook eliminado"}


@router.post("/{webhook_id}/test")
async def test_webhook(
    webhook_id: int,
    request: WebhookTestRequest = None,
    session: Session = Depends(get_session)
):
    """
    Envía un evento de prueba a un webhook.

    Args:
        webhook_id: ID del webhook
        request: Payload personalizado (opcional)

    Returns:
        Resultado del envío
    """
    if webhook_id not in _webhooks:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Webhook no encontrado"
        )

    wh = _webhooks[webhook_id]

    payload = request.payload if request and request.payload else {
        "test": True,
        "message": "Este es un evento de prueba de LITPER PRO",
        "timestamp": datetime.utcnow().isoformat()
    }

    result = await webhook_service.deliver(
        url=wh["url"],
        event_type="test.ping",
        payload=payload,
        secret=wh["secret"],
        webhook_id=webhook_id
    )

    # Actualizar último trigger
    wh["last_triggered"] = datetime.utcnow().isoformat()
    if not result.get("success"):
        wh["failure_count"] += 1

    # Registrar entrega
    _deliveries.insert(0, {
        "id": len(_deliveries) + 1,
        "webhook_id": webhook_id,
        "event_type": "test.ping",
        "success": result.get("success", False),
        "status_code": result.get("status_code"),
        "created_at": datetime.utcnow().isoformat(),
        "delivered_at": result.get("delivered_at")
    })

    # Mantener solo últimas 100 entregas
    if len(_deliveries) > 100:
        _deliveries.pop()

    return {
        "success": result.get("success", False),
        "status_code": result.get("status_code"),
        "response_preview": result.get("response_body", "")[:200] if result.get("response_body") else None,
        "error": result.get("error")
    }


@router.get("/{webhook_id}/deliveries")
async def get_webhook_deliveries(
    webhook_id: int,
    limit: int = Query(default=50, le=100),
    session: Session = Depends(get_session)
):
    """
    Obtiene historial de entregas de un webhook.

    Args:
        webhook_id: ID del webhook
        limit: Máximo de entregas a retornar

    Returns:
        Lista de entregas
    """
    if webhook_id not in _webhooks:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Webhook no encontrado"
        )

    webhook_deliveries = [
        d for d in _deliveries
        if d.get("webhook_id") == webhook_id
    ][:limit]

    return {
        "total": len(webhook_deliveries),
        "deliveries": webhook_deliveries
    }


@router.post("/dispatch/{event_type}")
async def dispatch_event(
    event_type: str,
    payload: dict,
    session: Session = Depends(get_session)
):
    """
    Despacha un evento a todos los webhooks suscritos.

    Args:
        event_type: Tipo de evento
        payload: Datos del evento

    Returns:
        Resumen de resultados
    """
    if event_type not in webhook_service.AVAILABLE_EVENTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Evento no válido: {event_type}"
        )

    # Filtrar webhooks suscritos a este evento
    subscribed_webhooks = [
        wh for wh in _webhooks.values()
        if wh["is_active"] and event_type in wh["events"]
    ]

    if not subscribed_webhooks:
        return {
            "success": True,
            "message": "No hay webhooks suscritos a este evento",
            "dispatched": 0
        }

    result = await webhook_service.dispatch(
        event_type=event_type,
        payload=payload,
        webhooks=subscribed_webhooks
    )

    # Actualizar estados de webhooks
    for r in result.get("results", []):
        wh_id = r.get("webhook_id")
        if wh_id and wh_id in _webhooks:
            _webhooks[wh_id]["last_triggered"] = datetime.utcnow().isoformat()
            if not r.get("success"):
                _webhooks[wh_id]["failure_count"] += 1

    return {
        "success": True,
        "message": f"Evento despachado a {result['success']}/{result['total']} webhooks",
        "details": result
    }


@router.post("/{webhook_id}/regenerate-secret")
async def regenerate_webhook_secret(
    webhook_id: int,
    session: Session = Depends(get_session)
):
    """
    Regenera el secret de un webhook.

    Args:
        webhook_id: ID del webhook

    Returns:
        Nuevo secret
    """
    if webhook_id not in _webhooks:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Webhook no encontrado"
        )

    new_secret = secrets.token_hex(32)
    _webhooks[webhook_id]["secret"] = new_secret

    logger.info(f"Secret regenerado para webhook ID: {webhook_id}")

    return {
        "success": True,
        "message": "Secret regenerado exitosamente",
        "secret": new_secret  # Solo se muestra una vez
    }


@router.get("/status")
async def get_webhook_service_status():
    """
    Verifica el estado del servicio de webhooks.

    Returns:
        Estado del servicio
    """
    return {
        "available": webhook_service.is_available(),
        "total_webhooks": len(_webhooks),
        "active_webhooks": sum(1 for wh in _webhooks.values() if wh["is_active"]),
        "recent_deliveries": len(_deliveries),
        "available_events": len(webhook_service.AVAILABLE_EVENTS),
        "timestamp": datetime.utcnow().isoformat()
    }
