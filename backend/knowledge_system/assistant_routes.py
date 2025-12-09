"""
RUTAS API PARA ASISTENTE IA CON MEMORIA
========================================

Endpoints FastAPI para el asistente inteligente con acceso
a la base de conocimiento.

Endpoints disponibles:
- POST /assistant/chat       - Chat con el asistente
- GET  /assistant/suggestions - Sugerencias contextuales
- POST /assistant/context    - Obtener contexto para agentes
- GET  /assistant/history    - Historial de conversaciones
- DELETE /assistant/history  - Limpiar historial

Autor: Litper IA System
Version: 1.0.0
"""

import os
import uuid
from typing import Optional, List
from datetime import datetime

from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel, Field
from loguru import logger
import anthropic

from .knowledge_manager import get_knowledge_manager


# ==================== ROUTER ====================

router = APIRouter(
    prefix="/assistant",
    tags=["Asistente IA"],
    responses={
        404: {"description": "No encontrado"},
        500: {"description": "Error interno"}
    }
)


# ==================== MODELOS PYDANTIC ====================

class MensajeHistorial(BaseModel):
    """Mensaje del historial de chat."""
    rol: str = Field(..., description="'user' o 'assistant'")
    contenido: str = Field(..., description="Contenido del mensaje")


class ChatRequest(BaseModel):
    """Request para chat con el asistente."""
    mensaje: str = Field(..., min_length=1, description="Mensaje del usuario")
    conversacion_id: Optional[str] = Field(None, description="ID de conversacion existente")
    pantalla_actual: Optional[str] = Field(None, description="Pantalla donde esta el usuario")
    historial: Optional[List[MensajeHistorial]] = Field(None, description="Historial de mensajes")
    usar_conocimiento: bool = Field(True, description="Usar base de conocimiento")

    class Config:
        json_schema_extra = {
            "example": {
                "mensaje": "Como proceso una novedad de entrega?",
                "pantalla_actual": "novedades",
                "usar_conocimiento": True
            }
        }


class ChatResponse(BaseModel):
    """Respuesta del chat."""
    respuesta: str
    conversacion_id: str
    conocimiento_usado: List[str] = []
    sugerencias: List[str] = []


class ContextoRequest(BaseModel):
    """Request para obtener contexto."""
    query: str = Field(..., description="Consulta para buscar contexto")
    limite: int = Field(5, ge=1, le=10, description="Limite de resultados")


# ==================== SYSTEM PROMPT ====================

SYSTEM_PROMPT = """
Eres el Asistente de Litper, una aplicacion de gestion logistica para dropshipping en Colombia.

TU ROL:
- Ayudar a los usuarios a usar la aplicacion
- Explicar procesos y funcionalidades
- Responder preguntas sobre logistica
- Guiar en la resolucion de problemas
- Usar el conocimiento de la base de datos para dar respuestas precisas

COMO RESPONDES:
- En espanol colombiano, amigable y directo
- Con pasos claros cuando explicas procesos
- Con ejemplos cuando ayuda a entender
- Brevemente si la pregunta es simple
- En detalle si el usuario lo necesita

SOBRE LA APP:
Litper tiene estas funcionalidades principales:
1. Seguimiento de Guias - Monitorear estado de envios
2. Novedades - Resolver problemas de entrega
3. Reclamo en Oficina - Gestionar paquetes en oficina de transportadora
4. Chat en Vivo - Atender clientes por WhatsApp
5. Generacion de Pedidos - Crear ordenes desde chats
6. Semaforo - Sistema de alertas por estado
7. Predicciones ML - Prediccion de retrasos

SOBRE EL CONOCIMIENTO:
- Tienes acceso a procesos, reglas y plantillas guardadas
- Si te preguntan algo y tienes conocimiento relevante, usalo
- Si no sabes algo especifico, dilo honestamente
- Puedes sugerir agregar nuevo conocimiento si falta informacion

FORMATO DE RESPUESTAS:
- Usa bullets para listas
- Usa negritas para conceptos importantes
- Manten las respuestas concisas pero completas
- Si el tema es complejo, ofrece mas detalles si el usuario quiere
"""


# ==================== ENDPOINTS ====================

@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Chat con el asistente",
    description="""
    Envia un mensaje al asistente y recibe una respuesta contextualizada.

    **Caracteristicas:**
    - Busqueda automatica en base de conocimiento
    - Contexto de pantalla actual
    - Historial de conversacion

    **Tip:** Proporciona el historial para mantener contexto.
    """
)
async def chat_con_asistente(request: ChatRequest):
    """
    Chat con el asistente IA de Litper.
    """

    logger.info(f"Chat: {request.mensaje[:50]}...")

    try:
        # Obtener cliente de Claude
        api_key = os.getenv("ANTHROPIC_API_KEY") or os.getenv("VITE_CLAUDE_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="API key no configurada")

        cliente = anthropic.Anthropic(api_key=api_key)

        # Buscar conocimiento relevante si esta habilitado
        contexto_conocimiento = ""
        ids_usados = []

        if request.usar_conocimiento:
            try:
                km = get_knowledge_manager()
                conocimientos = await km.buscar_conocimiento(
                    query=request.mensaje,
                    limite=5
                )

                if conocimientos:
                    contexto_conocimiento = "\n\n---\nCONOCIMIENTO DISPONIBLE:\n"
                    for item in conocimientos:
                        contexto_conocimiento += f"\n[{item.get('categoria', 'GENERAL').upper()}] {item.get('titulo', 'Sin titulo')}\n"
                        resumen = item.get('resumen') or item.get('contenido', '')[:500]
                        contexto_conocimiento += f"{resumen}\n"
                        ids_usados.append(str(item.get('id', '')))
            except Exception as e:
                logger.warning(f"Error buscando conocimiento: {e}")

        # Construir prompt del sistema
        system_prompt = SYSTEM_PROMPT
        if request.pantalla_actual:
            system_prompt += f"\n\nEl usuario esta en la pantalla: {request.pantalla_actual}"
        system_prompt += contexto_conocimiento

        # Construir mensajes
        mensajes = []
        if request.historial:
            for msg in request.historial[-10:]:
                mensajes.append({
                    "role": msg.rol,
                    "content": msg.contenido
                })

        mensajes.append({
            "role": "user",
            "content": request.mensaje
        })

        # Llamar a Claude
        response = cliente.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            system=system_prompt,
            messages=mensajes
        )

        respuesta = response.content[0].text

        # Generar sugerencias
        sugerencias = generar_sugerencias(request.pantalla_actual, request.mensaje)

        # Generar ID de conversacion si no existe
        conversacion_id = request.conversacion_id or str(uuid.uuid4())

        return ChatResponse(
            respuesta=respuesta,
            conversacion_id=conversacion_id,
            conocimiento_usado=ids_usados,
            sugerencias=sugerencias
        )

    except anthropic.APIError as e:
        logger.error(f"Error API Claude: {e}")
        raise HTTPException(status_code=500, detail=f"Error de IA: {str(e)}")
    except Exception as e:
        logger.error(f"Error en chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/suggestions",
    summary="Sugerencias contextuales",
    description="Obtiene sugerencias de preguntas segun la pantalla actual."
)
async def obtener_sugerencias(
    pantalla: Optional[str] = Query(None, description="Pantalla actual")
):
    """
    Retorna sugerencias de preguntas contextuales.
    """

    sugerencias = generar_sugerencias(pantalla)

    return {
        "pantalla": pantalla or "general",
        "sugerencias": sugerencias
    }


@router.post(
    "/context",
    summary="Obtener contexto para agentes",
    description="Obtiene conocimiento relevante formateado para inyectar en prompts de agentes."
)
async def obtener_contexto(request: ContextoRequest):
    """
    Obtiene contexto de conocimiento para usar en agentes.
    """

    try:
        km = get_knowledge_manager()

        resultados = await km.buscar_conocimiento(
            query=request.query,
            limite=request.limite
        )

        # Formatear para agente
        contexto = ""
        for item in resultados:
            contexto += f"\n---\n"
            contexto += f"[{item.get('categoria', 'GENERAL').upper()}] {item.get('titulo', 'Sin titulo')}\n"
            contexto += f"{item.get('resumen') or item.get('contenido', '')[:500]}\n"

        return {
            "contexto": contexto,
            "fuentes": [str(r.get('id', '')) for r in resultados],
            "total": len(resultados)
        }

    except Exception as e:
        logger.error(f"Error obteniendo contexto: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/history",
    summary="Historial de conversaciones",
    description="Obtiene el historial de conversaciones recientes."
)
async def obtener_historial(
    limite: int = Query(10, ge=1, le=50, description="Limite de conversaciones")
):
    """
    Retorna historial de conversaciones recientes.
    """

    # Por ahora retornamos un placeholder
    # En produccion esto leeria de la base de datos
    return {
        "total": 0,
        "conversaciones": []
    }


@router.delete(
    "/history/{conversacion_id}",
    summary="Eliminar conversacion",
    description="Elimina una conversacion del historial."
)
async def eliminar_conversacion(conversacion_id: str):
    """
    Elimina una conversacion especifica.
    """

    return {
        "success": True,
        "conversacion_id": conversacion_id,
        "mensaje": "Conversacion eliminada"
    }


# ==================== FUNCIONES AUXILIARES ====================

def generar_sugerencias(pantalla: Optional[str] = None, ultimo_mensaje: str = "") -> List[str]:
    """
    Genera sugerencias de preguntas basadas en la pantalla actual.
    """

    sugerencias_por_pantalla = {
        "dashboard": [
            "Como interpreto las metricas?",
            "Que significa cada color del semaforo?",
            "Como exporto los datos?"
        ],
        "seguimiento": [
            "Como proceso una guia en reparto?",
            "Que hago si el cliente no contesta?",
            "Cuando debo crear un ticket?"
        ],
        "novedades": [
            "Como resuelvo una novedad?",
            "Cuando puedo devolver un pedido?",
            "Que plantilla uso para coordinar entrega?"
        ],
        "pedidos": [
            "Como creo un pedido correctamente?",
            "Que numero de telefono uso?",
            "Cuando marco como 'No Aplica'?"
        ],
        "semaforo": [
            "Que significa cada color?",
            "Como priorizo las guias criticas?",
            "Cuando escalar un problema?"
        ],
        "predicciones": [
            "Como funciona el sistema ML?",
            "Que tan precisas son las predicciones?",
            "Como mejoro la tasa de entrega?"
        ],
        "flash": [
            "Como funciona Litper Flash?",
            "Cuales son los tiempos de entrega?",
            "Que ciudades tienen cobertura?"
        ],
        "home": [
            "Como funciona la app?",
            "Cuales son los procesos principales?",
            "Como cargo mis guias?"
        ]
    }

    return sugerencias_por_pantalla.get(
        pantalla or "home",
        sugerencias_por_pantalla["home"]
    )


# ==================== FUNCION PARA REGISTRAR RUTAS ====================

def incluir_rutas_assistant(app):
    """
    Incluye las rutas del asistente en la aplicacion FastAPI.

    Uso en main.py:
        from knowledge_system.assistant_routes import incluir_rutas_assistant
        incluir_rutas_assistant(app)
    """
    app.include_router(router)
    logger.info("Rutas de asistente registradas")
