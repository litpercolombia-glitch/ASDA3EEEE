"""
Cliente OpenAI/ChatGPT para el Cerebro Autónomo de Litper Pro.
Implementación usando la API de OpenAI.
"""

import os
import json
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from enum import Enum
import aiohttp


class OpenAIModel(Enum):
    """Modelos disponibles de OpenAI."""
    GPT4 = "gpt-4"
    GPT4_TURBO = "gpt-4-turbo-preview"
    GPT35_TURBO = "gpt-3.5-turbo"
    GPT4O = "gpt-4o"
    GPT4O_MINI = "gpt-4o-mini"


@dataclass
class OpenAIConfig:
    """Configuración del cliente OpenAI."""
    api_key: str = None
    model: str = "gpt-4o-mini"
    max_tokens: int = 4096
    temperature: float = 0.7

    def __post_init__(self):
        if self.api_key is None:
            self.api_key = os.getenv("OPENAI_API_KEY", "")
        if not self.model:
            self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")


# System prompts para diferentes roles
OPENAI_SYSTEM_PROMPTS = {
    'brain': """Eres el cerebro central de Litper Pro, un sistema de logística en Colombia.
Tu función es analizar situaciones, tomar decisiones inteligentes y coordinar operaciones.

Capacidades:
- Análisis de envíos y rutas
- Gestión de incidencias
- Comunicación con clientes
- Optimización de operaciones

Responde siempre en español colombiano, de forma concisa y profesional.""",

    'decision': """Eres un sistema experto en toma de decisiones para logística.
Analiza la situación presentada y proporciona:
1. Decisión recomendada
2. Justificación breve
3. Acciones a ejecutar

Prioriza: satisfacción del cliente, eficiencia operativa, reducción de costos.""",

    'customer': """Eres un asistente de atención al cliente para Litper Pro.
- Sé amable y empático
- Usa español colombiano natural
- Ofrece soluciones concretas
- Mantén mensajes cortos (ideal para WhatsApp)""",

    'analytics': """Eres un analista de datos experto en logística.
Analiza métricas, identifica patrones y genera insights accionables.
Presenta datos de forma clara y con recomendaciones específicas."""
}


class OpenAIBrainClient:
    """Cliente OpenAI para el cerebro autónomo."""

    BASE_URL = "https://api.openai.com/v1/chat/completions"

    def __init__(self, config: OpenAIConfig = None):
        self.config = config or OpenAIConfig()
        self._session: Optional[aiohttp.ClientSession] = None

    async def _get_session(self) -> aiohttp.ClientSession:
        """Obtiene o crea una sesión HTTP."""
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession()
        return self._session

    async def close(self):
        """Cierra la sesión HTTP."""
        if self._session and not self._session.closed:
            await self._session.close()

    async def _call_api(
        self,
        messages: List[Dict[str, str]],
        model: str = None,
        max_tokens: int = None,
        temperature: float = None
    ) -> Dict[str, Any]:
        """Llama a la API de OpenAI."""
        session = await self._get_session()

        headers = {
            "Authorization": f"Bearer {self.config.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": model or self.config.model,
            "messages": messages,
            "max_tokens": max_tokens or self.config.max_tokens,
            "temperature": temperature if temperature is not None else self.config.temperature
        }

        try:
            async with session.post(self.BASE_URL, headers=headers, json=payload) as response:
                if response.status == 200:
                    data = await response.json()
                    return {
                        "success": True,
                        "response": data["choices"][0]["message"]["content"],
                        "model": data["model"],
                        "usage": data.get("usage", {})
                    }
                else:
                    error_data = await response.text()
                    return {
                        "success": False,
                        "error": f"OpenAI API error ({response.status}): {error_data}"
                    }
        except Exception as e:
            return {
                "success": False,
                "error": f"OpenAI error: {str(e)}"
            }

    async def think(
        self,
        context: str,
        role: str = 'brain',
        model: str = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Procesa un pensamiento o análisis.

        Args:
            context: Contexto o pregunta a analizar
            role: Rol del cerebro (brain, decision, customer, analytics)
            model: Modelo a usar (opcional)

        Returns:
            Respuesta del cerebro
        """
        system_prompt = OPENAI_SYSTEM_PROMPTS.get(role, OPENAI_SYSTEM_PROMPTS['brain'])

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": context}
        ]

        return await self._call_api(messages, model=model, **kwargs)

    async def decide(
        self,
        situation: str,
        options: List[str] = None,
        urgency: str = "normal",
        context: Dict[str, Any] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Toma una decisión basada en la situación.

        Args:
            situation: Descripción de la situación
            options: Opciones disponibles
            urgency: Nivel de urgencia (low, normal, high, critical)
            context: Contexto adicional

        Returns:
            Decisión tomada
        """
        prompt = f"""SITUACIÓN: {situation}

URGENCIA: {urgency}

"""
        if options:
            prompt += "OPCIONES DISPONIBLES:\n"
            for i, opt in enumerate(options, 1):
                prompt += f"{i}. {opt}\n"
            prompt += "\n"

        if context:
            prompt += f"CONTEXTO ADICIONAL: {json.dumps(context, ensure_ascii=False)}\n\n"

        prompt += """Proporciona tu decisión en el siguiente formato:
DECISIÓN: [tu decisión]
JUSTIFICACIÓN: [por qué]
ACCIONES: [lista de acciones a tomar]"""

        response = await self.think(prompt, role='decision', **kwargs)

        if response.get('success'):
            response['decision'] = response.get('response', '')

        return response

    async def generate_message(
        self,
        customer_name: str,
        situation: str,
        tone: str = "friendly",
        channel: str = "whatsapp",
        **kwargs
    ) -> str:
        """
        Genera un mensaje para el cliente.

        Args:
            customer_name: Nombre del cliente
            situation: Situación a comunicar
            tone: Tono del mensaje (friendly, formal, urgent)
            channel: Canal de comunicación (whatsapp, email, sms)

        Returns:
            Mensaje generado
        """
        prompt = f"""Genera un mensaje para:
- Cliente: {customer_name}
- Situación: {situation}
- Tono: {tone}
- Canal: {channel}

El mensaje debe ser corto, claro y en español colombiano natural.
Solo responde con el mensaje, sin explicaciones adicionales."""

        response = await self.think(prompt, role='customer', **kwargs)

        if response.get('success'):
            return response.get('response', '')
        return f"Hola {customer_name}, {situation}"

    async def analyze(
        self,
        data: Dict[str, Any],
        analysis_type: str = "general",
        **kwargs
    ) -> Dict[str, Any]:
        """
        Analiza datos y genera insights.

        Args:
            data: Datos a analizar
            analysis_type: Tipo de análisis

        Returns:
            Análisis con insights
        """
        prompt = f"""Analiza los siguientes datos de logística:

TIPO DE ANÁLISIS: {analysis_type}

DATOS:
{json.dumps(data, ensure_ascii=False, indent=2)}

Proporciona:
1. Resumen ejecutivo
2. Insights principales
3. Recomendaciones"""

        return await self.think(prompt, role='analytics', **kwargs)

    async def health_check(self) -> Dict[str, Any]:
        """Verifica el estado del cliente."""
        if not self.config.api_key:
            return {
                "status": "error",
                "error": "OPENAI_API_KEY no configurada"
            }

        try:
            response = await self.think(
                "Responde solo 'OK' si funcionas correctamente.",
                max_tokens=10
            )

            if response.get('success'):
                return {
                    "status": "healthy",
                    "model": self.config.model,
                    "provider": "openai"
                }
            else:
                return {
                    "status": "error",
                    "error": response.get('error')
                }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }
