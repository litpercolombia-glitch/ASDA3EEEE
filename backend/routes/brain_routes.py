"""
Brain Routes - Endpoints para interactuar con el cerebro autónomo
Soporta: Gemini (gratis), Claude (premium), ChatGPT (backup)
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from datetime import datetime
from enum import Enum
import os

# Cargar variables de entorno
from dotenv import load_dotenv
load_dotenv('.env.backend')

# Importar clientes de IA
from brain.claude.gemini_client import GeminiBrainClient, GeminiConfig
from brain.claude.openai_client import OpenAIBrainClient, OpenAIConfig
from brain.claude.client import ClaudeBrainClient, ClaudeConfig

router = APIRouter(prefix="/api/brain", tags=["Brain - Cerebro Autonomo"])


# =============================================================================
# CONFIGURACION MULTI-PROVEEDOR
# =============================================================================

class AIProvider(str, Enum):
    GEMINI = "gemini"
    CLAUDE = "claude"
    OPENAI = "openai"


# Cache de clientes
_clients: Dict[str, Any] = {}


def get_available_providers() -> Dict[str, bool]:
    """Retorna los proveedores disponibles segun las API keys configuradas."""
    return {
        "gemini": bool(os.getenv("GOOGLE_API_KEY")),
        "claude": bool(os.getenv("ANTHROPIC_API_KEY")),
        "openai": bool(os.getenv("OPENAI_API_KEY"))
    }


def get_default_provider() -> str:
    """Obtiene el proveedor por defecto o el primero disponible."""
    default = os.getenv("DEFAULT_AI_PROVIDER", "gemini")
    available = get_available_providers()

    # Si el default esta disponible, usarlo
    if available.get(default):
        return default

    # Buscar el primero disponible (orden: gemini, claude, openai)
    for provider in ["gemini", "claude", "openai"]:
        if available.get(provider):
            return provider

    return None


def get_client(provider: str = None):
    """Obtiene o crea el cliente de IA para el proveedor especificado."""
    global _clients

    if provider is None:
        provider = get_default_provider()

    if provider is None:
        raise HTTPException(
            status_code=500,
            detail="No hay ninguna API key configurada. Agrega GOOGLE_API_KEY, ANTHROPIC_API_KEY o OPENAI_API_KEY en .env.backend"
        )

    # Usar cliente en cache si existe
    if provider in _clients:
        return _clients[provider], provider

    # Crear nuevo cliente
    if provider == "gemini":
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="GOOGLE_API_KEY no configurada")
        _clients[provider] = GeminiBrainClient(GeminiConfig(api_key=api_key))

    elif provider == "claude":
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY no configurada")
        _clients[provider] = ClaudeBrainClient(ClaudeConfig(api_key=api_key))

    elif provider == "openai":
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="OPENAI_API_KEY no configurada")
        _clients[provider] = OpenAIBrainClient(OpenAIConfig(api_key=api_key))

    else:
        raise HTTPException(status_code=400, detail=f"Proveedor '{provider}' no soportado")

    return _clients[provider], provider


# =============================================================================
# SCHEMAS
# =============================================================================

class ThinkRequest(BaseModel):
    """Request para pensar/analizar"""
    question: str = Field(..., description="Pregunta o contexto a analizar")
    role: str = Field("brain", description="Rol: brain, decision, customer, analytics")

    class Config:
        json_schema_extra = {
            "example": {
                "question": "Cuales son las mejores practicas para entregas a tiempo?",
                "role": "brain"
            }
        }


class DecisionRequest(BaseModel):
    """Request para tomar una decision"""
    situation: str = Field(..., description="Descripcion de la situacion")
    options: Optional[List[str]] = Field(None, description="Opciones disponibles")
    urgency: str = Field("normal", description="Nivel de urgencia: low, normal, high, critical")
    context: Optional[Dict[str, Any]] = Field(None, description="Contexto adicional")

    class Config:
        json_schema_extra = {
            "example": {
                "situation": "Envio 12345 lleva 5 dias sin movimiento en Pasto",
                "options": ["Contactar cliente", "Escalar a carrier", "Esperar"],
                "urgency": "high"
            }
        }


class MessageRequest(BaseModel):
    """Request para generar mensaje"""
    customer_name: str = Field(..., description="Nombre del cliente")
    situation: str = Field(..., description="Situacion a comunicar")
    tone: str = Field("friendly", description="Tono: formal, friendly, urgent")
    channel: str = Field("whatsapp", description="Canal: whatsapp, email, sms")

    class Config:
        json_schema_extra = {
            "example": {
                "customer_name": "Maria Garcia",
                "situation": "Tu pedido #12345 esta en camino y llegara manana",
                "tone": "friendly",
                "channel": "whatsapp"
            }
        }


class ShipmentRequest(BaseModel):
    """Request para analizar envio"""
    guide_number: str
    carrier: Optional[str] = None
    city: Optional[str] = None
    days_in_transit: Optional[int] = None
    status: Optional[str] = None
    customer_name: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "guide_number": "12345678901",
                "carrier": "Coordinadora",
                "city": "Pasto",
                "days_in_transit": 5,
                "status": "en_transito",
                "customer_name": "Maria Garcia"
            }
        }


class BrainResponse(BaseModel):
    """Respuesta del cerebro"""
    success: bool
    provider: str
    data: Dict[str, Any]
    timestamp: str
    processing_time_ms: Optional[float] = None


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.get("/status")
async def get_status():
    """
    Estado del cerebro y proveedores disponibles.
    """
    available = get_available_providers()
    default = get_default_provider()

    return {
        "status": "active" if default else "no_api_keys",
        "providers": {
            "gemini": {
                "available": available["gemini"],
                "model": os.getenv("GEMINI_MODEL", "gemini-2.0-flash"),
                "cost": "GRATIS"
            },
            "claude": {
                "available": available["claude"],
                "model": "claude-3-5-sonnet",
                "cost": "$3/MTok"
            },
            "openai": {
                "available": available["openai"],
                "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                "cost": "$0.15/MTok"
            }
        },
        "default_provider": default,
        "active_providers": sum(available.values()),
        "timestamp": datetime.now().isoformat()
    }


@router.get("/health")
async def health_check(provider: Optional[str] = Query(None, description="Proveedor a verificar")):
    """
    Verifica la conexion con el proveedor de IA.
    """
    try:
        client, used_provider = get_client(provider)
        health = await client.health_check()

        return {
            "status": health.get("status", "unknown"),
            "provider": used_provider,
            "model": health.get("model"),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }


@router.post("/think", response_model=BrainResponse)
async def think(
    request: ThinkRequest,
    provider: Optional[str] = Query(None, description="Proveedor: gemini, claude, openai")
):
    """
    Procesa un pensamiento o pregunta con el cerebro.
    """
    start_time = datetime.now()

    try:
        client, used_provider = get_client(provider)
        response = await client.think(
            context=request.question,
            role=request.role
        )

        processing_time = (datetime.now() - start_time).total_seconds() * 1000

        return BrainResponse(
            success=response.get("success", False),
            provider=used_provider,
            data={
                "response": response.get("response", ""),
                "question": request.question,
                "role": request.role,
                "usage": response.get("usage", {})
            },
            timestamp=datetime.now().isoformat(),
            processing_time_ms=round(processing_time, 2)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/decide", response_model=BrainResponse)
async def decide(
    request: DecisionRequest,
    provider: Optional[str] = Query(None, description="Proveedor: gemini, claude, openai")
):
    """
    Solicita al cerebro que tome una decision.
    """
    start_time = datetime.now()

    try:
        client, used_provider = get_client(provider)
        response = await client.decide(
            situation=request.situation,
            options=request.options,
            urgency=request.urgency,
            context=request.context
        )

        processing_time = (datetime.now() - start_time).total_seconds() * 1000

        return BrainResponse(
            success=response.get("success", False),
            provider=used_provider,
            data={
                "decision": response.get("decision", response.get("response", "")),
                "situation": request.situation,
                "urgency": request.urgency,
                "usage": response.get("usage", {})
            },
            timestamp=datetime.now().isoformat(),
            processing_time_ms=round(processing_time, 2)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-message", response_model=BrainResponse)
async def generate_message(
    request: MessageRequest,
    provider: Optional[str] = Query(None, description="Proveedor: gemini, claude, openai")
):
    """
    Genera un mensaje personalizado para el cliente.
    """
    start_time = datetime.now()

    try:
        client, used_provider = get_client(provider)
        message = await client.generate_message(
            customer_name=request.customer_name,
            situation=request.situation,
            tone=request.tone,
            channel=request.channel
        )

        processing_time = (datetime.now() - start_time).total_seconds() * 1000

        return BrainResponse(
            success=True,
            provider=used_provider,
            data={
                "message": message,
                "customer": request.customer_name,
                "tone": request.tone,
                "channel": request.channel
            },
            timestamp=datetime.now().isoformat(),
            processing_time_ms=round(processing_time, 2)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-shipment", response_model=BrainResponse)
async def analyze_shipment(
    request: ShipmentRequest,
    provider: Optional[str] = Query(None, description="Proveedor: gemini, claude, openai")
):
    """
    Analiza un envio y genera recomendaciones.
    """
    start_time = datetime.now()

    try:
        client, used_provider = get_client(provider)

        # Construir contexto
        shipment_info = f"""
        Guia: {request.guide_number}
        Transportadora: {request.carrier or 'No especificada'}
        Ciudad destino: {request.city or 'No especificada'}
        Dias en transito: {request.days_in_transit or 'N/A'}
        Estado: {request.status or 'Desconocido'}
        Cliente: {request.customer_name or 'No especificado'}
        """

        response = await client.decide(
            situation=f"Analiza este envio y determina: 1) Nivel de riesgo (bajo/medio/alto), 2) Posibles problemas, 3) Acciones recomendadas.\n\n{shipment_info}",
            urgency="normal"
        )

        processing_time = (datetime.now() - start_time).total_seconds() * 1000

        return BrainResponse(
            success=response.get("success", False),
            provider=used_provider,
            data={
                "shipment": {
                    "guide": request.guide_number,
                    "carrier": request.carrier,
                    "city": request.city,
                    "days_in_transit": request.days_in_transit
                },
                "analysis": response.get("decision", response.get("response", ""))
            },
            timestamp=datetime.now().isoformat(),
            processing_time_ms=round(processing_time, 2)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/test")
async def test_brain(provider: Optional[str] = Query(None, description="Proveedor a probar")):
    """
    Test rapido del cerebro - pregunta simple.
    """
    start_time = datetime.now()

    try:
        client, used_provider = get_client(provider)

        response = await client.think(
            context="Cual es la capital de Colombia? Responde solo el nombre de la ciudad.",
            role='brain'
        )

        processing_time = (datetime.now() - start_time).total_seconds() * 1000

        return {
            "success": response.get("success", False),
            "provider": used_provider,
            "test": "passed" if response.get("success") else "failed",
            "response": response.get("response", ""),
            "processing_time_ms": round(processing_time, 2),
            "message": f"Cerebro {used_provider.upper()} funcionando correctamente!" if response.get("success") else "Error en el test",
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        return {
            "success": False,
            "test": "failed",
            "error": str(e),
            "message": "Error al conectar con el cerebro",
            "timestamp": datetime.now().isoformat()
        }


@router.get("/compare")
async def compare_providers():
    """
    Compara las respuestas de todos los proveedores disponibles.
    Util para evaluar cual funciona mejor.
    """
    available = get_available_providers()
    results = {}
    test_question = "En una frase corta, que es logistica?"

    for provider_name, is_available in available.items():
        if not is_available:
            results[provider_name] = {"available": False}
            continue

        try:
            start_time = datetime.now()
            client, _ = get_client(provider_name)
            response = await client.think(context=test_question, role='brain')
            processing_time = (datetime.now() - start_time).total_seconds() * 1000

            results[provider_name] = {
                "available": True,
                "success": response.get("success", False),
                "response": response.get("response", "")[:200],
                "processing_time_ms": round(processing_time, 2)
            }
        except Exception as e:
            results[provider_name] = {
                "available": True,
                "success": False,
                "error": str(e)
            }

    return {
        "question": test_question,
        "results": results,
        "timestamp": datetime.now().isoformat()
    }
