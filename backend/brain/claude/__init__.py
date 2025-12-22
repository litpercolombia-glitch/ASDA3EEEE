"""
AI Clients Integration Module
Soporta: Claude (Anthropic), Gemini (Google), ChatGPT (OpenAI)
"""

from .client import ClaudeBrainClient, ClaudeConfig, ClaudeModel
from .gemini_client import GeminiBrainClient, GeminiConfig
from .openai_client import OpenAIBrainClient, OpenAIConfig, OpenAIModel
from .tools import BRAIN_TOOLS, LOGISTICS_AGENT_TOOLS, CUSTOMER_AGENT_TOOLS

__all__ = [
    # Claude (Anthropic)
    'ClaudeBrainClient',
    'ClaudeConfig',
    'ClaudeModel',
    # Gemini (Google)
    'GeminiBrainClient',
    'GeminiConfig',
    # OpenAI (ChatGPT)
    'OpenAIBrainClient',
    'OpenAIConfig',
    'OpenAIModel',
    # Tools
    'BRAIN_TOOLS',
    'LOGISTICS_AGENT_TOOLS',
    'CUSTOMER_AGENT_TOOLS'
]
