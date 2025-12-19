"""
Rutas para Push Notifications del sistema Litper Pro.
"""

import os
import secrets
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from loguru import logger

# Importar dependencias del proyecto
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_session
from services.push_service import push_service

router = APIRouter(prefix="/api/push", tags=["Push Notifications"])


# ==================== MODELOS PYDANTIC ====================

class PushSubscriptionKeys(BaseModel):
    """Keys de la suscripción push"""
    p256dh: str
    auth: str


class PushSubscriptionCreate(BaseModel):
    """Modelo para crear suscripción push"""
    endpoint: str
    keys: PushSubscriptionKeys
    device_type: Optional[str] = "web"


class PushSubscriptionResponse(BaseModel):
    """Respuesta de suscripción"""
    success: bool
    message: str


class TestNotificationRequest(BaseModel):
    """Request para notificación de prueba"""
    title: Optional[str] = "Prueba LITPER PRO"
    body: Optional[str] = "Esta es una notificación de prueba"


# ==================== ALMACENAMIENTO EN MEMORIA ====================
# En producción, usar base de datos (ver models.py para modelo PushSubscription)

_subscriptions: dict = {}  # endpoint -> subscription_data


# ==================== ENDPOINTS ====================

@router.get("/vapid-key")
async def get_vapid_public_key():
    """
    Obtiene la VAPID public key para suscribirse a push.

    Returns:
        VAPID public key o error si no está configurada
    """
    public_key = push_service.get_public_key()

    if not public_key:
        # Generar key de ejemplo si no existe (solo para desarrollo)
        logger.warning("VAPID_PUBLIC_KEY no configurada, usando placeholder")
        return {
            "vapid_public_key": os.getenv(
                'VAPID_PUBLIC_KEY',
                'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
            ),
            "warning": "Using development key"
        }

    return {"vapid_public_key": public_key}


@router.post("/subscribe", response_model=PushSubscriptionResponse)
async def subscribe_to_push(
    subscription: PushSubscriptionCreate,
    session: Session = Depends(get_session)
):
    """
    Registra una nueva suscripción push.

    Args:
        subscription: Datos de la suscripción

    Returns:
        Confirmación de registro
    """
    try:
        # Almacenar suscripción
        _subscriptions[subscription.endpoint] = {
            "endpoint": subscription.endpoint,
            "p256dh_key": subscription.keys.p256dh,
            "auth_key": subscription.keys.auth,
            "device_type": subscription.device_type,
            "created_at": datetime.utcnow().isoformat(),
            "is_active": True
        }

        logger.info(f"Nueva suscripción push registrada: {subscription.endpoint[:50]}...")

        return PushSubscriptionResponse(
            success=True,
            message="Suscripción registrada exitosamente"
        )

    except Exception as e:
        logger.error(f"Error registrando suscripción: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error registrando suscripción: {str(e)}"
        )


@router.delete("/unsubscribe")
async def unsubscribe_from_push(
    endpoint: str,
    session: Session = Depends(get_session)
):
    """
    Elimina una suscripción push.

    Args:
        endpoint: Endpoint de la suscripción a eliminar

    Returns:
        Confirmación de eliminación
    """
    if endpoint in _subscriptions:
        del _subscriptions[endpoint]
        logger.info(f"Suscripción push eliminada: {endpoint[:50]}...")

    return {"success": True, "message": "Suscripción eliminada"}


@router.get("/subscriptions")
async def list_subscriptions():
    """
    Lista todas las suscripciones activas (solo para admin).

    Returns:
        Lista de suscripciones
    """
    return {
        "total": len(_subscriptions),
        "subscriptions": [
            {
                "endpoint": sub["endpoint"][:50] + "...",
                "device_type": sub.get("device_type", "web"),
                "created_at": sub.get("created_at"),
                "is_active": sub.get("is_active", True)
            }
            for sub in _subscriptions.values()
        ]
    }


@router.post("/test")
async def send_test_notification(
    request: TestNotificationRequest = None
):
    """
    Envía una notificación de prueba a todos los suscriptores.

    Args:
        request: Título y cuerpo opcionales

    Returns:
        Resultado del envío
    """
    if not _subscriptions:
        return {
            "success": False,
            "message": "No hay suscriptores registrados"
        }

    title = request.title if request else "Prueba LITPER PRO"
    body = request.body if request else "Esta es una notificación de prueba"

    payload = push_service.create_notification_payload(
        title=title,
        body=body,
        tag="test-notification"
    )

    subscriptions_list = list(_subscriptions.values())
    result = await push_service.broadcast_notification(subscriptions_list, payload)

    # Limpiar suscripciones expiradas
    for expired_endpoint in result.get("expired", []):
        if expired_endpoint in _subscriptions:
            del _subscriptions[expired_endpoint]

    return {
        "success": result["success"] > 0,
        "message": f"Enviado a {result['success']}/{result['total']} suscriptores",
        "details": result
    }


@router.post("/notify/shipment")
async def notify_shipment_change(
    guia: str,
    estado: str,
    destinatario: Optional[str] = None
):
    """
    Notifica cambio de estado de un envío a todos los suscriptores.

    Args:
        guia: Número de guía
        estado: Nuevo estado
        destinatario: Nombre del destinatario (opcional)

    Returns:
        Resultado del envío
    """
    if not _subscriptions:
        return {"success": False, "message": "No hay suscriptores"}

    subscriptions_list = list(_subscriptions.values())
    result = await push_service.notify_shipment_status_change(
        subscriptions=subscriptions_list,
        guia=guia,
        nuevo_estado=estado,
        destinatario=destinatario
    )

    return {
        "success": result["success"] > 0,
        "message": f"Notificado a {result['success']}/{result['total']} suscriptores"
    }


@router.post("/notify/alert")
async def notify_critical_alert(
    mensaje: str,
    cantidad: int = 1,
    tipo: str = "critico"
):
    """
    Envía alerta crítica a todos los suscriptores.

    Args:
        mensaje: Mensaje de la alerta
        cantidad: Cantidad de guías afectadas
        tipo: Tipo de alerta

    Returns:
        Resultado del envío
    """
    if not _subscriptions:
        return {"success": False, "message": "No hay suscriptores"}

    subscriptions_list = list(_subscriptions.values())
    result = await push_service.notify_critical_alert(
        subscriptions=subscriptions_list,
        mensaje=mensaje,
        cantidad=cantidad,
        tipo=tipo
    )

    return {
        "success": result["success"] > 0,
        "message": f"Alerta enviada a {result['success']}/{result['total']} suscriptores"
    }


@router.get("/status")
async def get_push_service_status():
    """
    Verifica el estado del servicio de push.

    Returns:
        Estado del servicio
    """
    return {
        "available": push_service.is_available(),
        "vapid_configured": bool(push_service.get_public_key()),
        "active_subscriptions": len(_subscriptions),
        "timestamp": datetime.utcnow().isoformat()
    }
