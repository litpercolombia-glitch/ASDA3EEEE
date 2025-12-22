"""
Integrations Module - Conexiones con servicios externos
- Chatea Pro (Chatbot IA + Dropi)
- N8N (Automatizaciones)
- Webhooks
"""

from .chatea_pro import ChateaProClient, ChateaProConfig
from .webhook_handler import WebhookHandler, WebhookEvent

__all__ = [
    'ChateaProClient',
    'ChateaProConfig',
    'WebhookHandler',
    'WebhookEvent'
]
