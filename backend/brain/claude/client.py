"""
Cliente unificado de Claude API para el cerebro autónomo de Litper Pro.
Usa claude-sonnet-4-20250514 como modelo principal.
"""

import anthropic
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from enum import Enum
import json
import asyncio
import os
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class ClaudeModel(Enum):
    """Modelos disponibles de Claude"""
    SONNET = "claude-sonnet-4-20250514"       # Principal - Razonamiento
    HAIKU = "claude-3-5-haiku-20241022"        # Rápido - Tareas simples
    OPUS = "claude-opus-4-20250514"            # Máximo - Decisiones críticas


@dataclass
class ClaudeConfig:
    """Configuración del cliente Claude"""
    api_key: str = field(default_factory=lambda: os.getenv("ANTHROPIC_API_KEY", ""))
    default_model: ClaudeModel = ClaudeModel.SONNET
    max_tokens: int = 4096
    temperature: float = 0.7
    timeout: int = 60


class ClaudeBrainClient:
    """
    Cliente central de Claude para el cerebro autónomo.
    Maneja todas las interacciones con la API de Anthropic.
    """

    def __init__(self, config: ClaudeConfig = None):
        self.config = config or ClaudeConfig()

        if not self.config.api_key:
            raise ValueError("ANTHROPIC_API_KEY no configurada. Configura la variable de entorno.")

        self.client = anthropic.Anthropic(api_key=self.config.api_key)
        self.async_client = anthropic.AsyncAnthropic(api_key=self.config.api_key)

        # Métricas de uso
        self.metrics = {
            'total_requests': 0,
            'total_tokens': 0,
            'successful_requests': 0,
            'failed_requests': 0,
            'last_request': None
        }

        # System prompts por rol
        self.system_prompts = {
            'brain': self._get_brain_system_prompt(),
            'decision': self._get_decision_system_prompt(),
            'learning': self._get_learning_system_prompt(),
            'agent': self._get_agent_system_prompt(),
            'analysis': self._get_analysis_system_prompt()
        }

    def _get_brain_system_prompt(self) -> str:
        return """Eres el CEREBRO CENTRAL de Litper Pro, un sistema de logística autónomo para Colombia.

Tu rol es:
1. PROCESAR eventos de logística en tiempo real
2. TOMAR DECISIONES autónomas sobre envíos, retrasos y novedades
3. APRENDER de cada interacción para mejorar continuamente
4. COORDINAR múltiples agentes especializados
5. OPTIMIZAR entregas y satisfacción del cliente

Contexto de negocio:
- Transportadoras: Coordinadora, Servientrega, TCC, Envía, Inter Rapidísimo, Veloces
- Ciudades principales: Bogotá, Medellín, Cali, Barranquilla, Cartagena, Bucaramanga, Pasto
- Métricas clave: Tiempo de entrega, tasa de novedades, satisfacción cliente
- Umbrales de riesgo: Bogotá 4 días, Medellín 5 días, Otras ciudades 6-7 días

Responde SIEMPRE en español colombiano profesional.
Tus decisiones deben ser CONCRETAS y ACCIONABLES.
Incluye SIEMPRE el nivel de confianza de tu decisión (0-100%)."""

    def _get_decision_system_prompt(self) -> str:
        return """Eres el MOTOR DE DECISIONES de Litper Pro.

Tu trabajo es analizar situaciones y tomar decisiones óptimas.

Para cada decisión debes:
1. Analizar el contexto completo
2. Evaluar opciones disponibles
3. Calcular probabilidades de éxito
4. Recomendar la mejor acción
5. Explicar tu razonamiento

Formato de respuesta OBLIGATORIO (JSON):
{
    "decision": "acción a tomar",
    "confidence": 0-100,
    "reasoning": "explicación",
    "alternatives": ["opción2", "opción3"],
    "risks": ["riesgo1", "riesgo2"],
    "expected_outcome": "resultado esperado",
    "priority": "low|medium|high|critical"
}"""

    def _get_learning_system_prompt(self) -> str:
        return """Eres el SISTEMA DE APRENDIZAJE de Litper Pro.

Tu rol es:
1. Analizar resultados de acciones pasadas
2. Identificar patrones de éxito y fracaso
3. Generar insights para mejorar el sistema
4. Proponer ajustes a estrategias
5. Detectar anomalías y tendencias

Formato de respuesta (JSON):
{
    "patterns_found": [...],
    "lessons_learned": [...],
    "recommended_changes": [...],
    "anomalies_detected": [...],
    "confidence": 0-100
}"""

    def _get_agent_system_prompt(self) -> str:
        return """Eres un AGENTE ESPECIALIZADO de Litper Pro.

Ejecutas tareas específicas de forma autónoma.
Reportas resultados y solicitas ayuda cuando es necesario.

Formato de respuesta (JSON):
{
    "action_taken": "descripción",
    "result": "success|failure|partial",
    "details": {...},
    "needs_escalation": true/false,
    "next_steps": [...]
}"""

    def _get_analysis_system_prompt(self) -> str:
        return """Eres el ANALISTA DE DATOS de Litper Pro.

Analizas información logística para extraer insights.
Generas reportes y predicciones basadas en datos.

Formato de respuesta (JSON):
{
    "summary": "resumen ejecutivo",
    "key_metrics": {...},
    "insights": [...],
    "recommendations": [...],
    "visualizations": [...]
}"""

    async def think(self,
                    context: str,
                    role: str = 'brain',
                    model: ClaudeModel = None,
                    tools: List[Dict] = None) -> Dict[str, Any]:
        """
        Método principal de pensamiento del cerebro.
        Usa Claude para razonar sobre un contexto.
        """
        model = model or self.config.default_model
        system_prompt = self.system_prompts.get(role, self.system_prompts['brain'])

        messages = [{"role": "user", "content": context}]

        self.metrics['total_requests'] += 1
        self.metrics['last_request'] = datetime.now().isoformat()

        try:
            if tools:
                # Usar tool_use para acciones estructuradas
                response = await self.async_client.messages.create(
                    model=model.value,
                    max_tokens=self.config.max_tokens,
                    system=system_prompt,
                    messages=messages,
                    tools=tools
                )
            else:
                response = await self.async_client.messages.create(
                    model=model.value,
                    max_tokens=self.config.max_tokens,
                    system=system_prompt,
                    messages=messages
                )

            self.metrics['successful_requests'] += 1
            self.metrics['total_tokens'] += response.usage.input_tokens + response.usage.output_tokens

            return self._parse_response(response)

        except anthropic.APIError as e:
            self.metrics['failed_requests'] += 1
            logger.error(f"Claude API Error: {e}")
            return {"error": str(e), "success": False}
        except Exception as e:
            self.metrics['failed_requests'] += 1
            logger.error(f"Unexpected error: {e}")
            return {"error": str(e), "success": False}

    async def decide(self,
                     situation: str,
                     options: List[str] = None,
                     constraints: Dict = None,
                     urgency: str = "normal") -> Dict[str, Any]:
        """
        Toma una decisión autónoma sobre una situación.

        Args:
            situation: Descripción de la situación
            options: Lista de opciones disponibles
            constraints: Restricciones a considerar
            urgency: low, normal, high, critical
        """
        context = f"""
SITUACIÓN: {situation}

{"OPCIONES DISPONIBLES: " + json.dumps(options, ensure_ascii=False) if options else ""}
{"RESTRICCIONES: " + json.dumps(constraints, ensure_ascii=False) if constraints else ""}
URGENCIA: {urgency}

Analiza y decide la mejor acción a tomar. Responde en formato JSON.
"""
        # Usar modelo más potente para decisiones críticas
        model = ClaudeModel.OPUS if urgency == "critical" else ClaudeModel.SONNET
        return await self.think(context, role='decision', model=model)

    async def learn(self,
                    action: str,
                    outcome: str,
                    context: Dict = None,
                    success: bool = None) -> Dict[str, Any]:
        """
        Aprende de una acción y su resultado.
        """
        learning_context = f"""
ACCIÓN TOMADA: {action}
RESULTADO: {outcome}
{"ÉXITO: " + str(success) if success is not None else ""}
CONTEXTO: {json.dumps(context, ensure_ascii=False) if context else 'N/A'}

Analiza qué funcionó, qué no, y qué se puede mejorar.
Responde en formato JSON.
"""
        return await self.think(learning_context, role='learning', model=ClaudeModel.HAIKU)

    async def analyze_image(self,
                            image_base64: str,
                            analysis_prompt: str,
                            media_type: str = "image/jpeg") -> Dict[str, Any]:
        """
        Analiza una imagen con Claude Vision.
        Útil para evidencias de entrega, daños, etc.
        """
        try:
            response = await self.async_client.messages.create(
                model=ClaudeModel.SONNET.value,
                max_tokens=1024,
                messages=[{
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": media_type,
                                "data": image_base64
                            }
                        },
                        {
                            "type": "text",
                            "text": analysis_prompt
                        }
                    ]
                }]
            )
            self.metrics['successful_requests'] += 1
            return self._parse_response(response)
        except Exception as e:
            self.metrics['failed_requests'] += 1
            logger.error(f"Vision error: {e}")
            return {"error": str(e), "success": False}

    async def batch_process(self,
                            items: List[Dict],
                            processor_prompt: str,
                            concurrency: int = 5) -> List[Dict]:
        """
        Procesa múltiples items en paralelo con Claude.
        """
        semaphore = asyncio.Semaphore(concurrency)

        async def process_one(item: Dict) -> Dict:
            async with semaphore:
                context = f"{processor_prompt}\n\nITEM: {json.dumps(item, ensure_ascii=False)}"
                result = await self.think(context, role='agent', model=ClaudeModel.HAIKU)
                return {"input": item, "output": result}

        results = await asyncio.gather(*[process_one(item) for item in items])
        return results

    async def generate_message(self,
                               customer_name: str,
                               situation: str,
                               tone: str = "friendly",
                               channel: str = "whatsapp") -> str:
        """
        Genera un mensaje personalizado para el cliente.

        Args:
            customer_name: Nombre del cliente
            situation: Descripción de la situación
            tone: formal, friendly, urgent
            channel: whatsapp, email, sms
        """
        context = f"""
Genera un mensaje de {channel} para {customer_name}.
Situación: {situation}
Tono: {tone}
Idioma: Español colombiano

{"Máximo 3 párrafos cortos para WhatsApp." if channel == "whatsapp" else ""}
{"Incluye saludo formal y despedida." if channel == "email" else ""}
{"Máximo 160 caracteres." if channel == "sms" else ""}
"""
        response = await self.think(context, role='agent', model=ClaudeModel.HAIKU)
        return response.get('response', str(response))

    async def analyze_shipments(self, shipments: List[Dict]) -> List[Dict]:
        """
        Analiza múltiples envíos y predice problemas.
        """
        context = f"""
Analiza estos envíos y predice cuáles tendrán problemas.

ENVÍOS:
{json.dumps(shipments, ensure_ascii=False, indent=2)}

Para cada envío, proporciona:
- riesgo: 0-100
- problemas_potenciales: lista
- recomendaciones: lista
- prioridad: low|medium|high|critical

Responde en formato JSON como array.
"""
        response = await self.think(context, role='analysis', model=ClaudeModel.SONNET)

        # Intentar extraer array de la respuesta
        if isinstance(response, dict):
            if 'response' in response and isinstance(response['response'], str):
                try:
                    return json.loads(response['response'])
                except:
                    pass
        return response if isinstance(response, list) else [response]

    def _parse_response(self, response) -> Dict[str, Any]:
        """Parsea la respuesta de Claude."""
        content = response.content[0]

        if content.type == 'text':
            text = content.text
            # Intentar parsear como JSON
            try:
                # Buscar JSON en la respuesta
                if '{' in text and '}' in text:
                    start = text.index('{')
                    end = text.rindex('}') + 1
                    parsed = json.loads(text[start:end])
                    parsed['success'] = True
                    return parsed
                elif '[' in text and ']' in text:
                    start = text.index('[')
                    end = text.rindex(']') + 1
                    return json.loads(text[start:end])
            except json.JSONDecodeError:
                pass
            return {"response": text, "success": True}

        elif content.type == 'tool_use':
            return {
                "tool": content.name,
                "input": content.input,
                "tool_use_id": content.id,
                "success": True
            }

        return {"response": str(content), "success": True}

    def get_metrics(self) -> Dict[str, Any]:
        """Retorna métricas de uso del cliente."""
        return {
            **self.metrics,
            'success_rate': (
                self.metrics['successful_requests'] / self.metrics['total_requests'] * 100
                if self.metrics['total_requests'] > 0 else 0
            )
        }

    async def health_check(self) -> Dict[str, Any]:
        """Verifica que la conexión a Claude está funcionando."""
        try:
            response = await self.async_client.messages.create(
                model=ClaudeModel.HAIKU.value,
                max_tokens=10,
                messages=[{"role": "user", "content": "ping"}]
            )
            return {
                "status": "healthy",
                "model": ClaudeModel.HAIKU.value,
                "response_time_ms": None  # Could add timing
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e)
            }
