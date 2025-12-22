"""
AI Clients Integration Module
Soporta: Claude (Anthropic), Gemini (Google), ChatGPT (OpenAI)
"""

from .client import ClaudeBrainClient, ClaudeConfig, ClaudeModel
from .gemini_client import GeminiBrainClient, GeminiConfig
from .tools import BRAIN_TOOLS, LOGISTICS_AGENT_TOOLS, CUSTOMER_AGENT_TOOLS

__all__ = [
    # Claude
    'ClaudeBrainClient',
    'ClaudeConfig',
    'ClaudeModel',
    # Gemini
    'GeminiBrainClient',
    'GeminiConfig',
    # Tools
    'BRAIN_TOOLS',
    'LOGISTICS_AGENT_TOOLS',
    'CUSTOMER_AGENT_TOOLS'
]
