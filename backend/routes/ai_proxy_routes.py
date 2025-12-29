"""
AI Proxy Routes - Endpoints seguros para el frontend
Elimina la necesidad de exponer API keys en el cliente
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from datetime import datetime
import os
import base64

from dotenv import load_dotenv
load_dotenv('.env.backend')

router = APIRouter(prefix="/api/ai", tags=["AI Proxy - Seguro"])


# =============================================================================
# CONFIGURACIÓN
# =============================================================================

def get_anthropic_client():
    """Obtiene cliente de Anthropic si está disponible."""
    api_key = os.getenv("ANTHROPIC_API_KEY") or os.getenv("CLAUDE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Anthropic API key no configurada en el servidor")

    try:
        from anthropic import Anthropic
        return Anthropic(api_key=api_key)
    except ImportError:
        raise HTTPException(status_code=500, detail="anthropic package no instalado")


def get_google_client():
    """Obtiene cliente de Google Gemini si está disponible."""
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Google API key no configurada en el servidor")

    try:
        from google import genai
        return genai.Client(api_key=api_key)
    except ImportError:
        raise HTTPException(status_code=500, detail="google-genai package no instalado")


# =============================================================================
# SCHEMAS
# =============================================================================

class ChatMessage(BaseModel):
    role: str = Field(..., description="user o assistant")
    content: str = Field(..., description="Contenido del mensaje")


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    system: Optional[str] = Field(None, description="System prompt")
    model: Optional[str] = Field(None, description="Modelo a usar")
    max_tokens: int = Field(2048, description="Máximo de tokens en respuesta")
    temperature: float = Field(0.7, description="Temperatura de generación")
    provider: Optional[str] = Field(None, description="gemini, claude, openai")


class VisionRequest(BaseModel):
    image_base64: str = Field(..., description="Imagen en base64")
    prompt: str = Field(..., description="Prompt para analizar la imagen")
    model: Optional[str] = Field(None, description="Modelo a usar")


class TextAnalysisRequest(BaseModel):
    text: str = Field(..., description="Texto a analizar")
    analysis_type: str = Field("general", description="Tipo: general, sentiment, logistics, predict")
    context: Optional[Dict[str, Any]] = Field(None, description="Contexto adicional")


class ChatResponse(BaseModel):
    success: bool
    content: str
    provider: str
    model: str
    usage: Optional[Dict[str, int]] = None
    timestamp: str


# =============================================================================
# ENDPOINTS DE CHAT
# =============================================================================

@router.post("/chat", response_model=ChatResponse)
async def chat_completion(request: ChatRequest):
    """
    Endpoint de chat seguro - No expone API keys al frontend.
    Soporta Claude y Gemini.
    """
    start_time = datetime.now()
    provider = request.provider or os.getenv("DEFAULT_AI_PROVIDER", "claude")

    try:
        if provider == "claude":
            return await _chat_claude(request)
        elif provider == "gemini":
            return await _chat_gemini(request)
        else:
            # Fallback a Claude
            return await _chat_claude(request)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en chat: {str(e)}")


async def _chat_claude(request: ChatRequest) -> ChatResponse:
    """Chat usando Claude."""
    client = get_anthropic_client()
    model = request.model or os.getenv("CLAUDE_MODEL", "claude-sonnet-4-20250514")

    messages = [{"role": m.role, "content": m.content} for m in request.messages]

    response = client.messages.create(
        model=model,
        max_tokens=request.max_tokens,
        system=request.system or "Eres un asistente de logística experto en español colombiano.",
        messages=messages
    )

    return ChatResponse(
        success=True,
        content=response.content[0].text,
        provider="claude",
        model=model,
        usage={
            "input_tokens": response.usage.input_tokens,
            "output_tokens": response.usage.output_tokens
        },
        timestamp=datetime.now().isoformat()
    )


async def _chat_gemini(request: ChatRequest) -> ChatResponse:
    """Chat usando Gemini."""
    client = get_google_client()
    model = request.model or os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    # Construir prompt con historial
    prompt_parts = []
    if request.system:
        prompt_parts.append(f"Sistema: {request.system}\n\n")

    for msg in request.messages:
        prefix = "Usuario: " if msg.role == "user" else "Asistente: "
        prompt_parts.append(f"{prefix}{msg.content}\n")

    prompt = "".join(prompt_parts)

    response = client.models.generate_content(
        model=model,
        contents=prompt
    )

    return ChatResponse(
        success=True,
        content=response.text,
        provider="gemini",
        model=model,
        usage=None,
        timestamp=datetime.now().isoformat()
    )


# =============================================================================
# ENDPOINTS DE VISIÓN
# =============================================================================

@router.post("/vision/analyze")
async def analyze_image(request: VisionRequest):
    """
    Analiza una imagen con IA.
    Útil para evidencias de entrega, documentos, etc.
    """
    try:
        # Usar Claude para visión (mejor calidad)
        client = get_anthropic_client()
        model = request.model or "claude-sonnet-4-20250514"

        # Detectar tipo de imagen
        if request.image_base64.startswith("data:"):
            # Extraer media type y data
            parts = request.image_base64.split(",")
            media_type = parts[0].split(":")[1].split(";")[0]
            image_data = parts[1]
        else:
            media_type = "image/jpeg"
            image_data = request.image_base64

        response = client.messages.create(
            model=model,
            max_tokens=2048,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": image_data
                        }
                    },
                    {
                        "type": "text",
                        "text": request.prompt
                    }
                ]
            }]
        )

        return {
            "success": True,
            "analysis": response.content[0].text,
            "provider": "claude",
            "model": model,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analizando imagen: {str(e)}")


@router.post("/vision/ocr")
async def extract_text_from_image(file: UploadFile = File(...)):
    """
    Extrae texto de una imagen (OCR).
    """
    try:
        contents = await file.read()
        image_base64 = base64.b64encode(contents).decode()

        request = VisionRequest(
            image_base64=image_base64,
            prompt="Extrae todo el texto visible en esta imagen. Devuelve solo el texto extraído, sin explicaciones adicionales."
        )

        return await analyze_image(request)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en OCR: {str(e)}")


# =============================================================================
# ENDPOINTS DE ANÁLISIS
# =============================================================================

@router.post("/analyze/text")
async def analyze_text(request: TextAnalysisRequest):
    """
    Analiza texto con diferentes tipos de análisis.
    """
    try:
        client = get_anthropic_client()

        prompts = {
            "general": f"Analiza el siguiente texto y proporciona insights relevantes:\n\n{request.text}",
            "sentiment": f"Analiza el sentimiento del siguiente texto. Clasifica como: positivo, negativo, neutral. Explica brevemente.\n\n{request.text}",
            "logistics": f"Analiza el siguiente texto desde una perspectiva logística. Identifica: estados de envío, problemas potenciales, acciones recomendadas.\n\n{request.text}",
            "predict": f"Basándote en el siguiente historial/contexto, predice el próximo estado o resultado más probable:\n\n{request.text}"
        }

        prompt = prompts.get(request.analysis_type, prompts["general"])

        if request.context:
            prompt += f"\n\nContexto adicional: {request.context}"

        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}]
        )

        return {
            "success": True,
            "analysis": response.content[0].text,
            "analysis_type": request.analysis_type,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en análisis: {str(e)}")


@router.post("/analyze/shipment")
async def analyze_shipment_status(
    tracking_number: str,
    status: str,
    days_in_transit: int = 0,
    city: str = None,
    carrier: str = None
):
    """
    Analiza el estado de un envío y genera recomendaciones.
    """
    try:
        client = get_anthropic_client()

        prompt = f"""Analiza este envío y proporciona:
1. Nivel de riesgo (bajo/medio/alto/crítico)
2. Posibles problemas detectados
3. Acciones recomendadas
4. Tiempo estimado de resolución

Datos del envío:
- Número de guía: {tracking_number}
- Estado actual: {status}
- Días en tránsito: {days_in_transit}
- Ciudad destino: {city or 'No especificada'}
- Transportadora: {carrier or 'No especificada'}

Responde en formato JSON con las claves: risk_level, issues, recommendations, estimated_resolution_days"""

        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}]
        )

        return {
            "success": True,
            "analysis": response.content[0].text,
            "tracking_number": tracking_number,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analizando envío: {str(e)}")


# =============================================================================
# ENDPOINT DE STATUS
# =============================================================================

@router.get("/status")
async def get_ai_status():
    """
    Verifica qué proveedores de IA están disponibles en el servidor.
    """
    status = {
        "claude": {
            "available": bool(os.getenv("ANTHROPIC_API_KEY") or os.getenv("CLAUDE_API_KEY")),
            "model": os.getenv("CLAUDE_MODEL", "claude-sonnet-4-20250514")
        },
        "gemini": {
            "available": bool(os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")),
            "model": os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        },
        "openai": {
            "available": bool(os.getenv("OPENAI_API_KEY")),
            "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        },
        "chatea": {
            "available": bool(os.getenv("CHATEA_API_KEY")),
            "webhook_configured": bool(os.getenv("CHATEA_WEBHOOK_URL"))
        }
    }

    default_provider = os.getenv("DEFAULT_AI_PROVIDER", "claude")

    return {
        "status": "ready" if any(p["available"] for p in status.values()) else "no_keys",
        "providers": status,
        "default_provider": default_provider,
        "timestamp": datetime.now().isoformat()
    }


# =============================================================================
# MESSAGING PROXY - WhatsApp via Chatea (API keys seguras)
# =============================================================================

class SendWhatsAppRequest(BaseModel):
    """Request para enviar mensaje WhatsApp."""
    phone: str = Field(..., description="Número con código de país (+573001234567)")
    message: str = Field(..., description="Mensaje a enviar")
    template: Optional[str] = Field(None, description="Nombre del template (opcional)")
    template_params: Optional[List[str]] = Field(None, description="Parámetros del template")


class SendWhatsAppResponse(BaseModel):
    """Respuesta de envío WhatsApp."""
    success: bool
    message_id: Optional[str] = None
    error: Optional[str] = None
    timestamp: str


def get_chatea_config():
    """Obtiene configuración de Chatea desde variables de entorno."""
    api_key = os.getenv("CHATEA_API_KEY")
    webhook_url = os.getenv("CHATEA_WEBHOOK_URL")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="CHATEA_API_KEY no configurada en el servidor"
        )

    return {
        "api_key": api_key,
        "webhook_url": webhook_url,
        "base_url": os.getenv("CHATEA_BASE_URL", "https://chateapro.app/api")
    }


@router.post("/messaging/whatsapp", response_model=SendWhatsAppResponse)
async def send_whatsapp_message(request: SendWhatsAppRequest):
    """
    Envía mensaje de WhatsApp via Chatea.
    La API key está segura en el servidor, NO en el frontend.

    Headers requeridos del frontend:
    - Authorization: Bearer <token_usuario>

    El frontend NO necesita la API key de Chatea.
    """
    try:
        config = get_chatea_config()

        # Intentar usar httpx si está disponible
        try:
            import httpx

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{config['base_url']}/send-message",
                    headers={
                        "Authorization": f"Bearer {config['api_key']}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "phone": request.phone,
                        "message": request.message,
                        "template": request.template,
                        "template_params": request.template_params
                    }
                )

                if response.status_code == 200:
                    data = response.json()
                    return SendWhatsAppResponse(
                        success=True,
                        message_id=data.get("message_id"),
                        timestamp=datetime.now().isoformat()
                    )
                else:
                    return SendWhatsAppResponse(
                        success=False,
                        error=f"Chatea API error: {response.status_code}",
                        timestamp=datetime.now().isoformat()
                    )

        except ImportError:
            # Fallback si httpx no está disponible
            import urllib.request
            import json

            req = urllib.request.Request(
                f"{config['base_url']}/send-message",
                data=json.dumps({
                    "phone": request.phone,
                    "message": request.message
                }).encode(),
                headers={
                    "Authorization": f"Bearer {config['api_key']}",
                    "Content-Type": "application/json"
                }
            )

            with urllib.request.urlopen(req, timeout=30) as response:
                data = json.loads(response.read())
                return SendWhatsAppResponse(
                    success=True,
                    message_id=data.get("message_id"),
                    timestamp=datetime.now().isoformat()
                )

    except HTTPException:
        raise
    except Exception as e:
        return SendWhatsAppResponse(
            success=False,
            error=str(e),
            timestamp=datetime.now().isoformat()
        )


@router.post("/messaging/whatsapp/bulk")
async def send_bulk_whatsapp(messages: List[SendWhatsAppRequest]):
    """
    Envía múltiples mensajes de WhatsApp.
    Útil para notificaciones masivas.
    """
    results = []
    for msg in messages:
        try:
            result = await send_whatsapp_message(msg)
            results.append({
                "phone": msg.phone,
                "success": result.success,
                "message_id": result.message_id,
                "error": result.error
            })
        except Exception as e:
            results.append({
                "phone": msg.phone,
                "success": False,
                "error": str(e)
            })

    return {
        "total": len(messages),
        "successful": sum(1 for r in results if r["success"]),
        "failed": sum(1 for r in results if not r["success"]),
        "results": results,
        "timestamp": datetime.now().isoformat()
    }
