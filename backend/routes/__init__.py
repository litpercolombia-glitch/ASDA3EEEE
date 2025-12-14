# backend/routes/__init__.py
"""
Rutas de API para LITPER Backend
"""

from .tracking_routes import router as tracking_router
from .rescue_routes import router as rescue_router
from .whatsapp_routes import router as whatsapp_router
from .websocket_routes import router as websocket_router

__all__ = [
    'tracking_router',
    'rescue_router',
    'whatsapp_router',
    'websocket_router',
]
