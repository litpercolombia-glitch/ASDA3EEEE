"""
LITPER - WebSocket para Actualizaciones en Tiempo Real
"""

import asyncio
import json
from typing import Set, Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from loguru import logger


router = APIRouter(tags=["WebSocket"])


class ConnectionManager:
    """
    Gestor de conexiones WebSocket
    Maneja múltiples clientes y canales de suscripción
    """

    def __init__(self):
        # Conexiones activas: {websocket: set(channels)}
        self.active_connections: Dict[WebSocket, Set[str]] = {}
        # Canales: {channel_name: set(websockets)}
        self.channels: Dict[str, Set[WebSocket]] = {
            "tracking": set(),      # Actualizaciones de tracking
            "rescue": set(),        # Sistema de rescate
            "alerts": set(),        # Alertas del sistema
            "dashboard": set(),     # Dashboard en tiempo real
            "all": set(),           # Todos los eventos
        }
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, channels: Set[str] = None):
        """Acepta nueva conexión WebSocket"""
        await websocket.accept()

        async with self._lock:
            self.active_connections[websocket] = channels or {"all"}

            # Suscribir a canales
            for channel in (channels or {"all"}):
                if channel in self.channels:
                    self.channels[channel].add(websocket)
                else:
                    self.channels[channel] = {websocket}

        logger.info(f"WebSocket conectado. Total: {len(self.active_connections)}")

        # Enviar mensaje de bienvenida
        await self.send_personal(websocket, {
            "type": "connected",
            "message": "Conectado a LITPER Real-Time",
            "channels": list(channels or {"all"}),
            "timestamp": datetime.now().isoformat()
        })

    async def disconnect(self, websocket: WebSocket):
        """Desconecta un WebSocket"""
        async with self._lock:
            if websocket in self.active_connections:
                channels = self.active_connections.pop(websocket)

                # Remover de canales
                for channel in channels:
                    if channel in self.channels:
                        self.channels[channel].discard(websocket)

        logger.info(f"WebSocket desconectado. Total: {len(self.active_connections)}")

    async def send_personal(self, websocket: WebSocket, data: Dict[str, Any]):
        """Envía mensaje a un WebSocket específico"""
        try:
            await websocket.send_json(data)
        except Exception as e:
            logger.error(f"Error enviando mensaje personal: {e}")
            await self.disconnect(websocket)

    async def broadcast(self, channel: str, data: Dict[str, Any]):
        """
        Envía mensaje a todos los suscriptores de un canal

        Args:
            channel: Canal de destino
            data: Datos a enviar
        """
        # Agregar metadata
        data["channel"] = channel
        data["timestamp"] = datetime.now().isoformat()

        # Obtener suscriptores del canal + "all"
        subscribers = set()
        if channel in self.channels:
            subscribers.update(self.channels[channel])
        if "all" in self.channels:
            subscribers.update(self.channels["all"])

        # Enviar a todos
        disconnected = []
        for websocket in subscribers:
            try:
                await websocket.send_json(data)
            except Exception as e:
                logger.error(f"Error en broadcast: {e}")
                disconnected.append(websocket)

        # Limpiar conexiones rotas
        for ws in disconnected:
            await self.disconnect(ws)

    async def broadcast_all(self, data: Dict[str, Any]):
        """Envía mensaje a todas las conexiones"""
        await self.broadcast("all", data)

    def get_stats(self) -> Dict:
        """Obtiene estadísticas de conexiones"""
        return {
            "total_connections": len(self.active_connections),
            "channels": {
                name: len(subs)
                for name, subs in self.channels.items()
            }
        }


# Instancia global del manager
manager = ConnectionManager()


# ==================== ENDPOINTS ====================

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    Endpoint principal de WebSocket

    Soporta suscripción a canales mediante query params:
    ws://host/ws?channels=tracking,rescue,alerts

    Canales disponibles:
    - tracking: Actualizaciones de estado de guías
    - rescue: Eventos del sistema de rescate
    - alerts: Alertas del sistema
    - dashboard: Métricas en tiempo real
    - all: Todos los eventos
    """
    # Obtener canales de query params
    channels_param = websocket.query_params.get("channels", "all")
    channels = set(channels_param.split(","))

    await manager.connect(websocket, channels)

    try:
        while True:
            # Esperar mensajes del cliente
            data = await websocket.receive_json()

            # Procesar comando del cliente
            command = data.get("command")

            if command == "subscribe":
                # Suscribirse a canal adicional
                channel = data.get("channel")
                if channel:
                    manager.active_connections[websocket].add(channel)
                    if channel not in manager.channels:
                        manager.channels[channel] = set()
                    manager.channels[channel].add(websocket)
                    await manager.send_personal(websocket, {
                        "type": "subscribed",
                        "channel": channel
                    })

            elif command == "unsubscribe":
                # Desuscribirse de canal
                channel = data.get("channel")
                if channel and channel in manager.active_connections[websocket]:
                    manager.active_connections[websocket].discard(channel)
                    manager.channels[channel].discard(websocket)
                    await manager.send_personal(websocket, {
                        "type": "unsubscribed",
                        "channel": channel
                    })

            elif command == "ping":
                # Responder ping
                await manager.send_personal(websocket, {
                    "type": "pong",
                    "timestamp": datetime.now().isoformat()
                })

            elif command == "get_stats":
                # Enviar estadísticas
                await manager.send_personal(websocket, {
                    "type": "stats",
                    "data": manager.get_stats()
                })

    except WebSocketDisconnect:
        await manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"Error en WebSocket: {e}")
        await manager.disconnect(websocket)


@router.websocket("/ws/tracking/{tracking_number}")
async def tracking_websocket(websocket: WebSocket, tracking_number: str):
    """
    WebSocket dedicado para tracking de una guía específica

    Envía actualizaciones cada vez que cambia el estado de la guía.
    """
    channel = f"tracking:{tracking_number}"

    await manager.connect(websocket, {channel})

    try:
        while True:
            data = await websocket.receive_json()

            if data.get("command") == "ping":
                await manager.send_personal(websocket, {"type": "pong"})

    except WebSocketDisconnect:
        await manager.disconnect(websocket)


# ==================== FUNCIONES DE BROADCAST ====================

async def notify_tracking_update(
    tracking_number: str,
    status: str,
    description: str,
    carrier: str = "",
    extra_data: Dict = None
):
    """
    Notifica actualización de tracking

    Llamar desde otros servicios cuando hay cambios de estado.
    """
    await manager.broadcast("tracking", {
        "type": "tracking_update",
        "tracking_number": tracking_number,
        "status": status,
        "description": description,
        "carrier": carrier,
        "data": extra_data or {}
    })

    # También notificar al canal específico de esa guía
    specific_channel = f"tracking:{tracking_number}"
    if specific_channel in manager.channels:
        await manager.broadcast(specific_channel, {
            "type": "tracking_update",
            "tracking_number": tracking_number,
            "status": status,
            "description": description,
            "carrier": carrier,
            "data": extra_data or {}
        })


async def notify_rescue_event(
    event_type: str,
    tracking_number: str,
    priority: str = "",
    data: Dict = None
):
    """
    Notifica evento del sistema de rescate

    event_type: added, whatsapp_sent, call_completed, recovered, lost
    """
    await manager.broadcast("rescue", {
        "type": "rescue_event",
        "event": event_type,
        "tracking_number": tracking_number,
        "priority": priority,
        "data": data or {}
    })


async def notify_alert(
    alert_type: str,
    severity: str,
    title: str,
    description: str = "",
    data: Dict = None
):
    """
    Notifica alerta del sistema
    """
    await manager.broadcast("alerts", {
        "type": "system_alert",
        "alert_type": alert_type,
        "severity": severity,
        "title": title,
        "description": description,
        "data": data or {}
    })


async def notify_dashboard_update(metrics: Dict):
    """
    Notifica actualización de métricas del dashboard
    """
    await manager.broadcast("dashboard", {
        "type": "dashboard_update",
        "metrics": metrics
    })


# ==================== HTTP ENDPOINTS PARA BROADCAST ====================

@router.post("/ws/broadcast/tracking")
async def broadcast_tracking(
    tracking_number: str,
    status: str,
    description: str,
    carrier: str = ""
):
    """
    Endpoint HTTP para enviar actualizaciones de tracking via WebSocket
    """
    await notify_tracking_update(tracking_number, status, description, carrier)
    return {"success": True, "message": "Broadcast enviado"}


@router.post("/ws/broadcast/alert")
async def broadcast_alert(
    alert_type: str,
    severity: str,
    title: str,
    description: str = ""
):
    """
    Endpoint HTTP para enviar alertas via WebSocket
    """
    await notify_alert(alert_type, severity, title, description)
    return {"success": True, "message": "Alerta enviada"}


@router.get("/ws/stats")
async def get_websocket_stats():
    """
    Obtiene estadísticas de conexiones WebSocket
    """
    return manager.get_stats()
