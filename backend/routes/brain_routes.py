"""
Brain Routes - Endpoints para interactuar con el cerebro autónomo
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from datetime import datetime
import os
import asyncio

# Importar el cerebro
from brain import ClaudeAutonomousBrain
from brain.claude.client import ClaudeBrainClient, ClaudeConfig, ClaudeModel

router = APIRouter(prefix="/api/brain", tags=["Brain - Cerebro Autónomo"])

# Instancia global del cerebro (se inicializa lazy)
_brain_instance: Optional[ClaudeAutonomousBrain] = None
_brain_client: Optional[ClaudeBrainClient] = None


def get_brain() -> ClaudeAutonomousBrain:
    """Obtiene o crea la instancia del cerebro."""
    global _brain_instance
    if _brain_instance is None:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=500,
                detail="ANTHROPIC_API_KEY no configurada"
            )
        _brain_instance = ClaudeAutonomousBrain(api_key=api_key)
    return _brain_instance


def get_brain_client() -> ClaudeBrainClient:
    """Obtiene o crea el cliente de Claude."""
    global _brain_client
    if _brain_client is None:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=500,
                detail="ANTHROPIC_API_KEY no configurada"
            )
        _brain_client = ClaudeBrainClient(ClaudeConfig(api_key=api_key))
    return _brain_client


# =============================================================================
# SCHEMAS
# =============================================================================

class AskRequest(BaseModel):
    """Request para preguntar al cerebro"""
    question: str = Field(..., description="Pregunta en lenguaje natural")
    context: Optional[Dict[str, Any]] = Field(None, description="Contexto adicional")

    class Config:
        json_schema_extra = {
            "example": {
                "question": "¿Cuáles son los envíos más críticos hoy?",
                "context": {"date": "2024-01-15"}
            }
        }


class DecisionRequest(BaseModel):
    """Request para tomar una decisión"""
    situation: str = Field(..., description="Descripción de la situación")
    options: Optional[List[str]] = Field(None, description="Opciones disponibles")
    constraints: Optional[Dict[str, Any]] = Field(None, description="Restricciones")
    urgency: str = Field("normal", description="Nivel de urgencia: low, normal, high, critical")

    class Config:
        json_schema_extra = {
            "example": {
                "situation": "Envío 12345 lleva 5 días sin movimiento en Pasto",
                "options": ["Contactar cliente", "Escalar a carrier", "Esperar"],
                "urgency": "high"
            }
        }


class EventRequest(BaseModel):
    """Request para enviar un evento al cerebro"""
    event_type: str = Field(..., description="Tipo de evento")
    data: Dict[str, Any] = Field(..., description="Datos del evento")
    priority: str = Field("normal", description="Prioridad: low, normal, high, critical")

    class Config:
        json_schema_extra = {
            "example": {
                "event_type": "delay_detected",
                "data": {
                    "guide_number": "12345678901",
                    "days_delayed": 3,
                    "city": "Pasto",
                    "carrier": "Coordinadora",
                    "customer_phone": "+573001234567"
                },
                "priority": "high"
            }
        }


class AnalyzeShipmentRequest(BaseModel):
    """Request para analizar un envío"""
    guide_number: str
    carrier: Optional[str] = None
    city: Optional[str] = None
    days_in_transit: Optional[int] = None
    status: Optional[str] = None
    has_issue: Optional[bool] = False
    customer_name: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "guide_number": "12345678901",
                "carrier": "Coordinadora",
                "city": "Pasto",
                "days_in_transit": 5,
                "status": "en_transito",
                "has_issue": False,
                "customer_name": "María García"
            }
        }


class GenerateMessageRequest(BaseModel):
    """Request para generar mensaje personalizado"""
    customer_name: str
    situation: str
    tone: str = Field("friendly", description="Tono: formal, friendly, urgent")

    class Config:
        json_schema_extra = {
            "example": {
                "customer_name": "María García",
                "situation": "Su pedido #12345 tiene un retraso de 2 días por condiciones climáticas",
                "tone": "friendly"
            }
        }


class BrainResponse(BaseModel):
    """Respuesta del cerebro"""
    success: bool
    data: Dict[str, Any]
    timestamp: str
    processing_time_ms: Optional[float] = None


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.get("/health")
async def brain_health():
    """
    Verifica el estado del cerebro y la conexión a Claude.
    """
    try:
        client = get_brain_client()
        health = await client.health_check()

        return {
            "status": "healthy" if health["status"] == "healthy" else "degraded",
            "claude_api": health["status"],
            "brain_initialized": _brain_instance is not None,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }


@router.post("/ask", response_model=BrainResponse)
async def ask_brain(request: AskRequest):
    """
    Pregunta algo al cerebro en lenguaje natural.

    Ejemplos de preguntas:
    - "¿Cuáles son los envíos más críticos hoy?"
    - "¿Qué transportadora tiene mejor rendimiento a Cali?"
    - "¿Cómo puedo mejorar las entregas a tiempo?"
    """
    start_time = datetime.now()

    try:
        brain = get_brain()
        response = await brain.ask(request.question, request.context)

        processing_time = (datetime.now() - start_time).total_seconds() * 1000

        return BrainResponse(
            success=True,
            data={
                "answer": response,
                "question": request.question,
                "context_provided": request.context is not None
            },
            timestamp=datetime.now().isoformat(),
            processing_time_ms=round(processing_time, 2)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/decide", response_model=BrainResponse)
async def make_decision(request: DecisionRequest):
    """
    Solicita al cerebro que tome una decisión sobre una situación.

    El cerebro analizará la situación, evaluará opciones y retornará
    una decisión con nivel de confianza y razonamiento.
    """
    start_time = datetime.now()

    try:
        client = get_brain_client()
        decision = await client.decide(
            situation=request.situation,
            options=request.options,
            constraints=request.constraints,
            urgency=request.urgency
        )

        processing_time = (datetime.now() - start_time).total_seconds() * 1000

        return BrainResponse(
            success=True,
            data={
                "decision": decision,
                "situation": request.situation,
                "urgency": request.urgency
            },
            timestamp=datetime.now().isoformat(),
            processing_time_ms=round(processing_time, 2)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/event", response_model=BrainResponse)
async def submit_event(request: EventRequest, background_tasks: BackgroundTasks):
    """
    Envía un evento al cerebro para procesamiento.

    Tipos de eventos soportados:
    - delay_detected: Retraso detectado en un envío
    - issue_reported: Novedad reportada
    - delivery_confirmed: Entrega confirmada
    - customer_inquiry: Consulta de cliente
    - carrier_update: Actualización de transportadora
    """
    try:
        brain = get_brain()
        event_id = await brain.submit_event(
            event_type=request.event_type,
            data=request.data,
            priority=request.priority
        )

        return BrainResponse(
            success=True,
            data={
                "event_id": event_id,
                "event_type": request.event_type,
                "priority": request.priority,
                "status": "queued",
                "message": "Evento agregado a la cola de procesamiento"
            },
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-shipment", response_model=BrainResponse)
async def analyze_shipment(request: AnalyzeShipmentRequest):
    """
    Analiza un envío específico y genera recomendaciones.

    Retorna:
    - Nivel de riesgo (0-100)
    - Problemas potenciales
    - Acciones recomendadas
    - Mensaje sugerido para el cliente
    """
    start_time = datetime.now()

    try:
        client = get_brain_client()

        # Construir contexto del envío
        shipment_context = {
            "guide": request.guide_number,
            "carrier": request.carrier,
            "destination_city": request.city,
            "days_in_transit": request.days_in_transit,
            "current_status": request.status,
            "has_issue": request.has_issue,
            "customer": request.customer_name
        }

        # Pedir análisis al cerebro
        analysis = await client.decide(
            situation=f"Analiza este envío y determina su riesgo: {shipment_context}",
            urgency="normal"
        )

        processing_time = (datetime.now() - start_time).total_seconds() * 1000

        return BrainResponse(
            success=True,
            data={
                "shipment": shipment_context,
                "analysis": analysis,
            },
            timestamp=datetime.now().isoformat(),
            processing_time_ms=round(processing_time, 2)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-message", response_model=BrainResponse)
async def generate_customer_message(request: GenerateMessageRequest):
    """
    Genera un mensaje personalizado para enviar al cliente.

    Tonos disponibles:
    - formal: Para comunicaciones oficiales
    - friendly: Amigable y cercano (por defecto)
    - urgent: Para situaciones que requieren atención inmediata
    """
    start_time = datetime.now()

    try:
        client = get_brain_client()
        message = await client.generate_message(
            customer_name=request.customer_name,
            situation=request.situation,
            tone=request.tone,
            channel="whatsapp"
        )

        processing_time = (datetime.now() - start_time).total_seconds() * 1000

        return BrainResponse(
            success=True,
            data={
                "message": message,
                "customer": request.customer_name,
                "tone": request.tone,
                "channel": "whatsapp"
            },
            timestamp=datetime.now().isoformat(),
            processing_time_ms=round(processing_time, 2)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_brain_status():
    """
    Obtiene el estado actual del cerebro incluyendo métricas.
    """
    try:
        brain = get_brain()
        status = brain.get_status()

        return {
            "success": True,
            "data": status,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        # Si el cerebro no está inicializado
        return {
            "success": True,
            "data": {
                "state": "not_initialized",
                "message": "El cerebro no ha sido inicializado. Envía un request para activarlo."
            },
            "timestamp": datetime.now().isoformat()
        }


@router.get("/metrics")
async def get_brain_metrics():
    """
    Obtiene métricas detalladas del cerebro y el cliente de Claude.
    """
    try:
        brain = get_brain()
        client = get_brain_client()

        brain_status = brain.get_status()
        claude_metrics = client.get_metrics()
        memory_stats = brain.memory.get_stats()
        action_stats = brain.action_executor.get_stats()

        return {
            "success": True,
            "data": {
                "brain": brain_status,
                "claude": claude_metrics,
                "memory": memory_stats,
                "actions": action_stats
            },
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/learn")
async def trigger_learning():
    """
    Fuerza un ciclo de aprendizaje del cerebro.

    El cerebro analizará las experiencias recientes e identificará
    patrones para mejorar sus decisiones futuras.
    """
    try:
        brain = get_brain()
        result = await brain._learn_from_buffer()

        return {
            "success": True,
            "data": {
                "learning_triggered": True,
                "insights": result if result else "No hay suficientes experiencias para aprender"
            },
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/start")
async def start_brain(background_tasks: BackgroundTasks):
    """
    Inicia el loop autónomo del cerebro en background.

    Una vez iniciado, el cerebro procesará eventos de forma autónoma.
    """
    try:
        brain = get_brain()

        # Iniciar en background
        background_tasks.add_task(brain.start)

        return {
            "success": True,
            "data": {
                "message": "Cerebro autónomo iniciando en background",
                "status": "starting"
            },
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stop")
async def stop_brain():
    """
    Detiene el loop autónomo del cerebro.
    """
    try:
        brain = get_brain()
        await brain.stop()

        return {
            "success": True,
            "data": {
                "message": "Cerebro autónomo detenido",
                "status": "stopped"
            },
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# ENDPOINT DE PRUEBA RÁPIDA
# =============================================================================

@router.get("/test")
async def test_brain():
    """
    Endpoint de prueba rápida para verificar que el cerebro funciona.

    Envía una pregunta simple y retorna la respuesta.
    """
    try:
        client = get_brain_client()

        # Pregunta simple de prueba
        response = await client.think(
            context="¿Cuál es la capital de Colombia? Responde en una línea.",
            role='brain',
            model=ClaudeModel.HAIKU  # Usar Haiku para prueba rápida
        )

        return {
            "success": True,
            "test": "passed",
            "response": response,
            "model_used": "claude-3-5-haiku",
            "message": "🧠 El cerebro está funcionando correctamente!",
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        return {
            "success": False,
            "test": "failed",
            "error": str(e),
            "message": "❌ Error al conectar con el cerebro",
            "timestamp": datetime.now().isoformat()
        }
