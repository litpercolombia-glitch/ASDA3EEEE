"""
Chatea Pro Routes - Integracion con Chatea Pro, Dropi y N8N
==========================================================

Endpoints especificos para:
- Recibir eventos de Chatea Pro (via N8N)
- Enviar mensajes via WhatsApp
- Obtener datos de Dropi
- Analytics con IA

COMO CONFIGURAR EN N8N:
1. En tu workflow de N8N, agrega un nodo "HTTP Request"
2. URL: https://tu-servidor.com/api/chatea-pro/webhook
3. Method: POST
4. Body: JSON con el evento

EJEMPLO DE PAYLOAD:
{
    "event": "order_status_changed",
    "data": {
        "order_id": "ORD-12345",
        "status": "en_transito",
        "carrier": "Coordinadora"
    }
}
"""

from fastapi import APIRouter, HTTPException, Request, BackgroundTasks, Query, Header
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from datetime import datetime
import os
import sys
import hmac
import hashlib

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from loguru import logger

router = APIRouter(prefix="/api/chatea-pro", tags=["Chatea Pro - Integracion Dropi/N8N"])

# Secret para verificar webhooks (debe estar en variables de entorno)
WEBHOOK_SECRET = os.getenv("CHATEA_WEBHOOK_SECRET", "")
SKIP_SIGNATURE_VERIFICATION = os.getenv("SKIP_WEBHOOK_SIGNATURE", "false").lower() == "true"


def verify_webhook_signature(payload: bytes, signature: str, secret: str) -> bool:
    """
    Verifica la firma HMAC-SHA256 del webhook.

    Args:
        payload: Body del request en bytes
        signature: Firma recibida (formato: sha256=abc123...)
        secret: Secret compartido

    Returns:
        True si la firma es válida
    """
    if not secret:
        logger.warning("⚠️ WEBHOOK_SECRET no configurado - verificación deshabilitada")
        return True  # Si no hay secret configurado, permitir (pero con warning)

    if not signature:
        logger.warning("⚠️ Webhook recibido sin firma")
        return False

    # Extraer hash de la firma
    if signature.startswith("sha256="):
        provided_hash = signature[7:]
    else:
        provided_hash = signature

    # Calcular hash esperado
    expected_hash = hmac.new(
        secret.encode('utf-8'),
        payload,
        hashlib.sha256
    ).hexdigest()

    # Comparación segura contra timing attacks
    is_valid = hmac.compare_digest(provided_hash.lower(), expected_hash.lower())

    if not is_valid:
        logger.warning(f"⚠️ Webhook signature mismatch: provided={provided_hash[:20]}... expected={expected_hash[:20]}...")

    return is_valid

# Instancias globales (lazy loading)
_chatea_client = None
_brain_client = None
_event_history = []  # Historial de eventos en memoria


def get_chatea_client():
    global _chatea_client
    if _chatea_client is None:
        from integrations.chatea_pro import ChateaProClient
        _chatea_client = ChateaProClient()
    return _chatea_client


def get_brain():
    global _brain_client
    if _brain_client is None:
        from brain.claude.gemini_client import GeminiBrainClient, GeminiConfig
        _brain_client = GeminiBrainClient(GeminiConfig())
    return _brain_client


# =============================================================================
# SCHEMAS
# =============================================================================

class ChateaProEvent(BaseModel):
    """Evento recibido de Chatea Pro / N8N."""
    event: str = Field(..., description="Tipo de evento")
    data: Dict[str, Any] = Field(..., description="Datos del evento")
    timestamp: Optional[str] = None
    source: str = "chatea_pro"

    class Config:
        json_schema_extra = {
            "example": {
                "event": "order_status_changed",
                "data": {
                    "order_id": "ORD-12345",
                    "customer_name": "Maria Garcia",
                    "customer_phone": "+573001234567",
                    "status": "en_transito",
                    "carrier": "Coordinadora",
                    "guide": "123456789",
                    "city": "Bogota"
                }
            }
        }


class SendMessageRequest(BaseModel):
    """Request para enviar mensaje WhatsApp."""
    phone: str = Field(..., description="Numero con codigo pais (+573001234567)")
    message: str = Field(..., description="Mensaje a enviar")
    template: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "phone": "+573001234567",
                "message": "Hola Maria! Tu pedido #12345 ya esta en camino."
            }
        }


class AnalyzeRequest(BaseModel):
    """Request para analizar con IA."""
    context: str = Field(..., description="Contexto a analizar")
    include_recommendation: bool = True

    class Config:
        json_schema_extra = {
            "example": {
                "context": "Pedido ORD-12345 lleva 5 dias en transito a Pasto. Cliente ha llamado 2 veces.",
                "include_recommendation": True
            }
        }


# =============================================================================
# WEBHOOK ENDPOINTS - Recibir eventos de N8N
# =============================================================================

@router.post("/webhook")
async def receive_chatea_pro_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_webhook_signature: Optional[str] = Header(None, alias="X-Webhook-Signature"),
    x_chatea_signature: Optional[str] = Header(None, alias="X-Chatea-Signature"),
):
    """
    ENDPOINT PRINCIPAL - Recibe eventos de Chatea Pro via N8N.

    Configura este URL en N8N:
    https://tu-servidor.com/api/chatea-pro/webhook

    SEGURIDAD:
    - El webhook debe incluir header X-Webhook-Signature o X-Chatea-Signature
    - Firma: sha256=HMAC(payload, CHATEA_WEBHOOK_SECRET)

    Eventos soportados:
    - order_created: Nuevo pedido creado
    - order_status_changed: Cambio de estado
    - delay_detected: Retraso detectado
    - customer_message: Mensaje del cliente
    - delivery_confirmed: Entrega confirmada
    - issue_reported: Novedad reportada
    """
    # Obtener body raw para verificación de firma
    body = await request.body()

    # Verificar firma (si está configurado el secret)
    signature = x_webhook_signature or x_chatea_signature
    if WEBHOOK_SECRET and not SKIP_SIGNATURE_VERIFICATION:
        if not verify_webhook_signature(body, signature or "", WEBHOOK_SECRET):
            logger.warning(f"⚠️ Webhook rechazado: firma inválida desde {request.client.host}")
            raise HTTPException(
                status_code=401,
                detail="Invalid webhook signature"
            )
        logger.info("✅ Webhook signature verified")

    # Parsear el evento
    import json
    try:
        event_data = json.loads(body)
        event = ChateaProEvent(**event_data)
    except Exception as e:
        logger.error(f"❌ Error parsing webhook body: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid event format: {str(e)}")

    # Guardar en historial
    event_record = {
        "id": f"evt_{datetime.now().strftime('%Y%m%d%H%M%S')}_{len(_event_history)}",
        "event": event.event,
        "data": event.data,
        "source": event.source,
        "timestamp": event.timestamp or datetime.now().isoformat(),
        "processed": True,
        "signature_verified": bool(signature and WEBHOOK_SECRET)
    }
    _event_history.insert(0, event_record)

    # Mantener solo ultimos 500 eventos
    if len(_event_history) > 500:
        _event_history.pop()

    # Determinar prioridad y analizar si es critico
    priority = determine_priority(event.event, event.data)
    brain_analysis = None

    if priority in ["high", "critical"]:
        brain_analysis = await analyze_with_brain(event)

    return {
        "success": True,
        "event_id": event_record["id"],
        "event_type": event.event,
        "priority": priority,
        "brain_analysis": brain_analysis,
        "message": f"Evento '{event.event}' procesado correctamente"
    }


@router.post("/webhook/batch")
async def receive_batch_events(events: List[ChateaProEvent]):
    """
    Recibe multiples eventos en una sola llamada.
    Util para sincronizacion masiva.
    """
    results = []

    for event in events:
        event_record = {
            "id": f"evt_{datetime.now().strftime('%Y%m%d%H%M%S')}_{len(_event_history)}",
            "event": event.event,
            "data": event.data,
            "timestamp": datetime.now().isoformat()
        }
        _event_history.insert(0, event_record)
        results.append({"event_id": event_record["id"], "event": event.event})

    return {
        "success": True,
        "processed": len(results),
        "events": results
    }


# =============================================================================
# SEND ENDPOINTS - Enviar datos a Chatea Pro
# =============================================================================

@router.post("/send-message")
async def send_whatsapp_message(request: SendMessageRequest):
    """
    Envia un mensaje de WhatsApp via Chatea Pro.

    El mensaje se enviara a traves del chatbot de Chatea Pro
    conectado a WhatsApp Business.

    Ejemplo:
        POST /api/chatea-pro/send-message
        {
            "phone": "+573001234567",
            "message": "Hola! Tu pedido esta en camino."
        }
    """
    chatea = get_chatea_client()

    result = await chatea.send_message(
        phone=request.phone,
        message=request.message,
        template=request.template
    )

    return {
        "success": result.get("success", False),
        "phone": request.phone,
        "message_sent": request.message[:100] + "..." if len(request.message) > 100 else request.message,
        "result": result
    }


@router.post("/send-alert")
async def send_alert_to_chatea(
    title: str = Query(...),
    message: str = Query(...),
    severity: str = Query("warning"),
    order_id: Optional[str] = Query(None)
):
    """
    Envia una alerta a Chatea Pro / N8N.

    La alerta se enviara al webhook configurado en .env.backend
    y puede ser procesada por N8N para notificaciones.
    """
    chatea = get_chatea_client()

    result = await chatea.send_alert(
        title=title,
        message=message,
        order_id=order_id,
        severity=severity
    )

    return {
        "success": result.get("success", False),
        "alert": {
            "title": title,
            "severity": severity,
            "order_id": order_id
        },
        "result": result
    }


@router.post("/trigger-event")
async def trigger_event_to_n8n(event: ChateaProEvent):
    """
    Envia un evento personalizado a N8N via Chatea Pro webhook.

    Util para:
    - Triggear automatizaciones en N8N
    - Enviar datos a otros sistemas
    - Notificaciones personalizadas
    """
    chatea = get_chatea_client()

    result = await chatea.trigger_webhook(
        event_type=event.event,
        data=event.data,
        priority="normal"
    )

    return {
        "success": result.get("success", False),
        "event": event.event,
        "result": result
    }


# =============================================================================
# ANALYTICS ENDPOINTS - Analisis con IA
# =============================================================================

@router.post("/analyze")
async def analyze_with_ai(request: AnalyzeRequest):
    """
    Analiza una situacion con el cerebro IA.

    Envias un contexto y recibes:
    - Analisis de la situacion
    - Nivel de urgencia
    - Recomendaciones
    - Mensaje sugerido para el cliente
    """
    brain = get_brain()

    prompt = f"""
    Analiza esta situacion de logistica en Colombia:

    {request.context}

    Proporciona:
    1. Resumen de la situacion (2-3 lineas)
    2. Nivel de urgencia (1-10)
    3. Acciones recomendadas (lista)
    """

    if request.include_recommendation:
        prompt += "\n4. Mensaje sugerido para enviar al cliente por WhatsApp (corto, amigable)"

    try:
        response = await brain.think(context=prompt, role='decision')

        return {
            "success": True,
            "analysis": response.get("response", ""),
            "model_used": "gemini",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@router.get("/analytics/summary")
async def get_analytics_summary():
    """
    Obtiene resumen de analytics basado en eventos recibidos.

    Muestra:
    - Total de eventos
    - Eventos por tipo
    - Eventos criticos recientes
    - Tendencias
    """
    # Contar eventos por tipo
    events_by_type = {}
    critical_events = []

    for event in _event_history[:200]:
        event_type = event.get("event", "unknown")
        events_by_type[event_type] = events_by_type.get(event_type, 0) + 1

        # Identificar eventos criticos
        if event_type in ["delay_detected", "issue_reported", "delivery_failed"]:
            critical_events.append(event)

    return {
        "success": True,
        "summary": {
            "total_events": len(_event_history),
            "events_by_type": events_by_type,
            "critical_events_count": len(critical_events),
            "recent_critical": critical_events[:10]
        },
        "timestamp": datetime.now().isoformat()
    }


@router.get("/analytics/ai-insights")
async def get_ai_insights():
    """
    Genera insights con IA basados en los eventos recientes.

    El cerebro analiza los patrones y genera:
    - Tendencias identificadas
    - Problemas recurrentes
    - Recomendaciones de mejora
    """
    if len(_event_history) < 5:
        return {
            "success": True,
            "message": "No hay suficientes eventos para generar insights",
            "min_events_required": 5
        }

    brain = get_brain()

    # Preparar resumen de eventos para el analisis
    events_summary = []
    for event in _event_history[:50]:
        events_summary.append(f"- {event.get('event')}: {event.get('data', {})}")

    prompt = f"""
    Analiza estos eventos de logistica de los ultimos dias:

    {chr(10).join(events_summary[:30])}

    Genera:
    1. Principales tendencias observadas
    2. Problemas recurrentes identificados
    3. Transportadoras/ciudades con mas incidencias
    4. 3 recomendaciones concretas para mejorar
    """

    try:
        response = await brain.think(context=prompt, role='analytics')

        return {
            "success": True,
            "insights": response.get("response", ""),
            "events_analyzed": min(len(_event_history), 50),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


# =============================================================================
# HISTORY & STATUS ENDPOINTS
# =============================================================================

@router.get("/history")
async def get_event_history(
    limit: int = Query(50, ge=1, le=200),
    event_type: Optional[str] = Query(None)
):
    """
    Obtiene historial de eventos recibidos.
    """
    events = _event_history

    if event_type:
        events = [e for e in events if e.get("event") == event_type]

    return {
        "success": True,
        "total": len(events),
        "events": events[:limit]
    }


@router.get("/status")
async def get_integration_status():
    """
    Verifica el estado de la integracion con Chatea Pro.
    """
    chatea = get_chatea_client()
    health = await chatea.health_check()

    return {
        "status": "active",
        "chatea_pro": health,
        "events_in_history": len(_event_history),
        "webhook_url": os.getenv("CHATEA_PRO_WEBHOOK_URL", "")[:50] + "...",
        "api_key_configured": bool(os.getenv("CHATEA_PRO_API_KEY")),
        "timestamp": datetime.now().isoformat()
    }


@router.get("/health")
async def health_check():
    """Health check simple."""
    return {
        "status": "healthy",
        "service": "chatea-pro-integration",
        "timestamp": datetime.now().isoformat()
    }


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def determine_priority(event_type: str, data: Dict[str, Any]) -> str:
    """Determina la prioridad de un evento."""
    critical_events = ["delivery_failed", "customer_complaint", "return_initiated"]
    high_events = ["delay_detected", "issue_reported", "customer_inquiry"]

    if event_type in critical_events:
        return "critical"
    if event_type in high_events:
        return "high"
    if data.get("days_delayed", 0) >= 5:
        return "high"
    if data.get("days_delayed", 0) >= 3:
        return "normal"

    return "normal"


async def analyze_with_brain(event: ChateaProEvent) -> Dict[str, Any]:
    """Analiza un evento con el cerebro IA."""
    brain = get_brain()

    context = f"""
    Evento critico de logistica:
    Tipo: {event.event}
    Datos: {event.data}

    Analiza brevemente y sugiere accion inmediata.
    """

    try:
        response = await brain.think(context=context, role='decision')
        return {
            "analyzed": True,
            "recommendation": response.get("response", "")[:500]
        }
    except:
        return {"analyzed": False}
