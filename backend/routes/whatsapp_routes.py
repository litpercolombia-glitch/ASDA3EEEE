"""
LITPER - Rutas de API para WhatsApp
"""

from typing import List, Optional, Dict
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from loguru import logger

from services.whatsapp_service import whatsapp_service, WhatsAppProvider


router = APIRouter(prefix="/whatsapp", tags=["WhatsApp"])


# ==================== MODELOS ====================

class SendMessageRequest(BaseModel):
    """Request para enviar mensaje simple"""
    phone: str = Field(..., min_length=7)
    message: str = Field(..., min_length=1, max_length=4096)


class SendTemplateRequest(BaseModel):
    """Request para enviar template"""
    phone: str = Field(..., min_length=7)
    template_name: str
    params: Dict[str, str] = {}


class BulkSendRequest(BaseModel):
    """Request para envío masivo"""
    contacts: List[Dict[str, str]]
    template_name: str


class DeliveryNotificationRequest(BaseModel):
    """Request para notificación de entrega"""
    phone: str
    nombre: str
    guia: str
    hora_inicio: str = "2:00 PM"
    hora_fin: str = "6:00 PM"


class RescueNotificationRequest(BaseModel):
    """Request para notificación de rescate"""
    phone: str
    nombre: str
    guia: str
    motivo: str = ""


# ==================== ENDPOINTS ====================

@router.post("/send")
async def send_message(request: SendMessageRequest):
    """
    Envía un mensaje de texto simple por WhatsApp

    - **phone**: Número de teléfono (con o sin código de país)
    - **message**: Contenido del mensaje
    """
    try:
        result = await whatsapp_service.send_message(
            phone=request.phone,
            message=request.message
        )

        if not result.success:
            raise HTTPException(status_code=400, detail=result.error_message)

        return {
            "success": True,
            "message_id": result.message_id,
            "phone": result.phone,
            "provider": result.provider.value
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error enviando WhatsApp: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/send-template")
async def send_template(request: SendTemplateRequest):
    """
    Envía un mensaje usando un template predefinido

    - **phone**: Número de teléfono
    - **template_name**: Nombre del template
    - **params**: Parámetros para el template
    """
    try:
        result = await whatsapp_service.send_template(
            phone=request.phone,
            template_name=request.template_name,
            params=request.params
        )

        if not result.success:
            raise HTTPException(status_code=400, detail=result.error_message)

        return {
            "success": True,
            "message_id": result.message_id,
            "phone": result.phone,
            "template": request.template_name
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error enviando template: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/send-bulk")
async def send_bulk(request: BulkSendRequest):
    """
    Envía mensajes masivos usando un template

    - **contacts**: Lista de contactos con sus datos
    - **template_name**: Template a usar
    """
    try:
        results = await whatsapp_service.send_bulk_messages(
            contacts=request.contacts,
            template_name=request.template_name
        )

        sent = sum(1 for r in results if r.success)
        failed = len(results) - sent

        return {
            "total": len(results),
            "sent": sent,
            "failed": failed,
            "results": [
                {
                    "phone": r.phone,
                    "success": r.success,
                    "message_id": r.message_id,
                    "error": r.error_message
                }
                for r in results
            ]
        }

    except Exception as e:
        logger.error(f"Error en envío masivo: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/notify/out-for-delivery")
async def notify_out_for_delivery(request: DeliveryNotificationRequest):
    """
    Envía notificación de "En reparto"

    - **phone**: Teléfono del cliente
    - **nombre**: Nombre del cliente
    - **guia**: Número de guía
    - **hora_inicio**: Hora estimada de inicio
    - **hora_fin**: Hora estimada de fin
    """
    try:
        result = await whatsapp_service.send_out_for_delivery(
            phone=request.phone,
            nombre=request.nombre,
            guia=request.guia,
            hora_inicio=request.hora_inicio,
            hora_fin=request.hora_fin
        )

        if not result.success:
            raise HTTPException(status_code=400, detail=result.error_message)

        return {"success": True, "message_id": result.message_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en notificación: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/notify/delivery-failed")
async def notify_delivery_failed(request: RescueNotificationRequest):
    """
    Envía notificación de intento fallido de entrega

    - **phone**: Teléfono del cliente
    - **nombre**: Nombre del cliente
    - **guia**: Número de guía
    - **motivo**: Motivo del fallo
    """
    try:
        result = await whatsapp_service.send_delivery_failed(
            phone=request.phone,
            nombre=request.nombre,
            guia=request.guia,
            motivo=request.motivo or "No se encontró al destinatario"
        )

        if not result.success:
            raise HTTPException(status_code=400, detail=result.error_message)

        return {"success": True, "message_id": result.message_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en notificación: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/notify/rescue")
async def notify_rescue(request: RescueNotificationRequest):
    """
    Envía mensaje de rescate de guía

    - **phone**: Teléfono del cliente
    - **nombre**: Nombre del cliente
    - **guia**: Número de guía
    """
    try:
        result = await whatsapp_service.send_rescue_contact(
            phone=request.phone,
            nombre=request.nombre,
            guia=request.guia
        )

        if not result.success:
            raise HTTPException(status_code=400, detail=result.error_message)

        return {"success": True, "message_id": result.message_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en rescate: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/generate-url")
async def generate_whatsapp_url(
    phone: str = Query(..., description="Número de teléfono"),
    message: str = Query(..., description="Mensaje a enviar")
):
    """
    Genera URL de WhatsApp Web para envío manual

    Útil para abrir WhatsApp directamente en el navegador o app.
    """
    url = whatsapp_service.generate_whatsapp_url(phone, message)

    return {
        "phone": phone,
        "url": url
    }


@router.get("/templates")
async def list_templates():
    """
    Lista los templates de mensaje disponibles
    """
    templates = whatsapp_service.get_templates()

    return {
        "templates": [
            {
                "name": name,
                "preview": info["preview"],
                "has_buttons": info["has_buttons"]
            }
            for name, info in templates.items()
        ]
    }


@router.get("/stats")
async def get_whatsapp_stats():
    """
    Obtiene estadísticas del servicio de WhatsApp
    """
    return whatsapp_service.get_stats()


@router.get("/providers")
async def list_providers():
    """
    Lista los proveedores de WhatsApp disponibles
    """
    return {
        "active_provider": whatsapp_service.active_provider.value,
        "available_providers": [
            {
                "id": p.value,
                "name": p.value.replace("_", " ").title()
            }
            for p in WhatsAppProvider
        ]
    }
