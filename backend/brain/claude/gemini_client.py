"""
Cliente de Google Gemini para el Cerebro Autónomo.
Alternativa gratuita a Claude para pruebas y tareas simples.
"""

import os
import json
import asyncio
import aiohttp
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


@dataclass
class GeminiConfig:
    """Configuración del cliente Gemini"""
    api_key: str = None
    model: str = "gemini-2.0-flash"
    max_tokens: int = 4096
    temperature: float = 0.7

    def __post_init__(self):
        if self.api_key is None:
            self.api_key = os.getenv("GOOGLE_API_KEY", "")


class GeminiBrainClient:
    """
    Cliente de Gemini para el cerebro autónomo.
    Usa la API REST de Google Generative AI.
    """

    BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

    def __init__(self, config: GeminiConfig = None):
        self.config = config or GeminiConfig()

        if not self.config.api_key:
            raise ValueError("GOOGLE_API_KEY no configurada")

        # Métricas
        self.metrics = {
            'total_requests': 0,
            'successful_requests': 0,
            'failed_requests': 0,
            'last_request': None
        }

        # System prompts
        self.system_prompts = {
            'brain': self._get_brain_prompt(),
            'decision': self._get_decision_prompt(),
            'learning': self._get_learning_prompt(),
            'agent': self._get_agent_prompt()
        }

    def _get_brain_prompt(self) -> str:
        return """Eres el CEREBRO CENTRAL de Litper Pro, un sistema de logística autónomo para Colombia.

Tu rol es:
1. PROCESAR eventos de logística en tiempo real
2. TOMAR DECISIONES autónomas sobre envíos, retrasos y novedades
3. APRENDER de cada interacción para mejorar
4. OPTIMIZAR entregas y satisfacción del cliente

Contexto:
- Transportadoras: Coordinadora, Servientrega, TCC, Envía, Inter Rapidísimo
- Ciudades: Bogotá, Medellín, Cali, Barranquilla, Cartagena, Pasto
- Umbral retraso: Bogotá 4 días, Medellín 5 días, otras 6-7 días

Responde SIEMPRE en español colombiano profesional.
Incluye nivel de confianza (0-100%) en tus decisiones."""

    def _get_decision_prompt(self) -> str:
        return """Eres el MOTOR DE DECISIONES de Litper Pro.

Analiza situaciones y toma decisiones óptimas.

Responde en formato JSON:
{
    "decision": "acción a tomar",
    "confidence": 0-100,
    "reasoning": "explicación",
    "actions": ["acción1", "acción2"],
    "priority": "low|medium|high|critical"
}"""

    def _get_learning_prompt(self) -> str:
        return """Eres el SISTEMA DE APRENDIZAJE de Litper Pro.

Analiza resultados y genera insights para mejorar.

Responde en JSON:
{
    "patterns_found": [...],
    "lessons_learned": [...],
    "recommended_changes": [...],
    "confidence": 0-100
}"""

    def _get_agent_prompt(self) -> str:
        return """Eres un AGENTE ESPECIALIZADO de Litper Pro.

Ejecutas tareas específicas de forma autónoma.

Responde en JSON:
{
    "action_taken": "descripción",
    "result": "success|failure|partial",
    "details": {...},
    "next_steps": [...]
}"""

    async def think(self,
                    context: str,
                    role: str = 'brain',
                    **kwargs) -> Dict[str, Any]:
        """
        Método principal de pensamiento usando Gemini.
        """
        system_prompt = self.system_prompts.get(role, self.system_prompts['brain'])

        full_prompt = f"{system_prompt}\n\n---\n\n{context}"

        self.metrics['total_requests'] += 1
        self.metrics['last_request'] = datetime.now().isoformat()

        try:
            response = await self._call_gemini(full_prompt)
            self.metrics['successful_requests'] += 1
            return self._parse_response(response)

        except Exception as e:
            self.metrics['failed_requests'] += 1
            logger.error(f"Gemini error: {e}")
            return {"error": str(e), "success": False}

    async def _call_gemini(self, prompt: str) -> str:
        """Llama a la API de Gemini."""
        url = f"{self.BASE_URL}/{self.config.model}:generateContent?key={self.config.api_key}"

        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "temperature": self.config.temperature,
                "maxOutputTokens": self.config.max_tokens,
            }
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"Gemini API error: {response.status} - {error_text}")

                data = await response.json()

                # Extraer texto de la respuesta
                try:
                    return data['candidates'][0]['content']['parts'][0]['text']
                except (KeyError, IndexError) as e:
                    raise Exception(f"Error parsing Gemini response: {e}")

    async def decide(self,
                     situation: str,
                     options: List[str] = None,
                     constraints: Dict = None,
                     urgency: str = "normal") -> Dict[str, Any]:
        """Toma una decisión sobre una situación."""
        context = f"""
SITUACIÓN: {situation}

{"OPCIONES: " + json.dumps(options, ensure_ascii=False) if options else ""}
{"RESTRICCIONES: " + json.dumps(constraints, ensure_ascii=False) if constraints else ""}
URGENCIA: {urgency}

Analiza y decide la mejor acción. Responde en JSON.
"""
        return await self.think(context, role='decision')

    async def generate_message(self,
                               customer_name: str,
                               situation: str,
                               tone: str = "friendly",
                               channel: str = "whatsapp") -> str:
        """Genera mensaje personalizado para cliente."""
        context = f"""
Genera un mensaje de {channel} para {customer_name}.
Situación: {situation}
Tono: {tone}
Idioma: Español colombiano

{"Máximo 3 párrafos cortos." if channel == "whatsapp" else ""}

Responde SOLO con el mensaje, sin explicaciones.
"""
        response = await self.think(context, role='agent')
        return response.get('response', str(response))

    async def analyze_shipments(self, shipments: List[Dict]) -> List[Dict]:
        """Analiza múltiples envíos."""
        context = f"""
Analiza estos envíos y predice problemas:

{json.dumps(shipments, ensure_ascii=False, indent=2)}

Responde con un array JSON:
[{{"guia": "...", "riesgo": 0-100, "problemas": [...], "recomendaciones": [...]}}]
"""
        response = await self.think(context, role='brain')

        if isinstance(response, list):
            return response
        return [response]

    def _parse_response(self, text: str) -> Dict[str, Any]:
        """Parsea la respuesta de Gemini."""
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

    async def health_check(self) -> Dict[str, Any]:
        """Verifica conexión con Gemini."""
        try:
            response = await self._call_gemini("Responde solo: OK")
            return {
                "status": "healthy",
                "provider": "gemini",
                "model": self.config.model
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "provider": "gemini",
                "error": str(e)
            }

    def get_metrics(self) -> Dict[str, Any]:
        """Retorna métricas de uso."""
        return {
            **self.metrics,
            'provider': 'gemini',
            'model': self.config.model,
            'success_rate': (
                self.metrics['successful_requests'] / self.metrics['total_requests'] * 100
                if self.metrics['total_requests'] > 0 else 0
            )
        }
