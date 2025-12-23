"""
Cliente Chatea Pro - Conexion con el chatbot IA y Dropi
=====================================================

Chatea Pro es tu chatbot de WhatsApp con IA que esta conectado a Dropi.
Dropi contiene toda la informacion de pedidos, tracking, estados, etc.

Este cliente te permite:
1. Obtener informacion de pedidos desde Dropi via Chatea Pro
2. Enviar mensajes automaticos a clientes
3. Recibir eventos cuando hay cambios en pedidos
4. Consultar el estado de envios en tiempo real

USO:
    from integrations import ChateaProClient

    client = ChateaProClient()

    # Obtener info de un pedido
    pedido = await client.get_order("ORD-12345")

    # Enviar mensaje a cliente
    await client.send_message("+573001234567", "Tu pedido esta en camino!")

    # Enviar evento al webhook
    await client.trigger_webhook({"evento": "alerta", "data": {...}})
"""

import os
import json
import aiohttp
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class OrderStatus(str, Enum):
    """Estados posibles de un pedido en Dropi."""
    PENDIENTE = "pendiente"
    CONFIRMADO = "confirmado"
    EN_PREPARACION = "en_preparacion"
    DESPACHADO = "despachado"
    EN_TRANSITO = "en_transito"
    EN_REPARTO = "en_reparto"
    ENTREGADO = "entregado"
    DEVOLUCION = "devolucion"
    CANCELADO = "cancelado"
    NOVEDAD = "novedad"


class EventType(str, Enum):
    """Tipos de eventos que puede enviar/recibir."""
    ORDER_CREATED = "order_created"
    ORDER_UPDATED = "order_updated"
    STATUS_CHANGED = "status_changed"
    DELAY_DETECTED = "delay_detected"
    DELIVERY_CONFIRMED = "delivery_confirmed"
    ISSUE_REPORTED = "issue_reported"
    CUSTOMER_MESSAGE = "customer_message"
    ALERT_TRIGGERED = "alert_triggered"


@dataclass
class ChateaProConfig:
    """Configuracion del cliente Chatea Pro."""
    api_key: str = None
    webhook_url: str = None
    base_url: str = "https://chateapro.app/api"
    timeout: int = 30

    def __post_init__(self):
        if self.api_key is None:
            self.api_key = os.getenv("CHATEA_PRO_API_KEY", "")
        if self.webhook_url is None:
            self.webhook_url = os.getenv("CHATEA_PRO_WEBHOOK_URL", "")
        if not self.base_url:
            self.base_url = os.getenv("CHATEA_PRO_BASE_URL", "https://chateapro.app/api")


@dataclass
class Order:
    """Modelo de un pedido de Dropi."""
    id: str
    numero: str
    cliente_nombre: str
    cliente_telefono: str
    cliente_email: Optional[str] = None
    direccion: str = ""
    ciudad: str = ""
    departamento: str = ""
    estado: OrderStatus = OrderStatus.PENDIENTE
    transportadora: str = ""
    guia: str = ""
    fecha_creacion: str = ""
    fecha_actualizacion: str = ""
    total: float = 0.0
    productos: List[Dict] = field(default_factory=list)
    notas: str = ""
    dias_en_transito: int = 0
    tiene_novedad: bool = False
    novedad_descripcion: str = ""


class ChateaProClient:
    """
    Cliente para interactuar con Chatea Pro y Dropi.

    Chatea Pro es el intermediario entre tu sistema y Dropi.
    Toda la informacion de pedidos viene de Dropi a traves de Chatea Pro.
    """

    def __init__(self, config: ChateaProConfig = None):
        self.config = config or ChateaProConfig()
        self._session: Optional[aiohttp.ClientSession] = None
        self._cache: Dict[str, Any] = {}
        self._cache_ttl = 300  # 5 minutos

    async def _get_session(self) -> aiohttp.ClientSession:
        """Obtiene o crea sesion HTTP."""
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=self.config.timeout)
            )
        return self._session

    async def close(self):
        """Cierra la sesion HTTP."""
        if self._session and not self._session.closed:
            await self._session.close()

    def _get_headers(self) -> Dict[str, str]:
        """Headers para las peticiones."""
        return {
            "Authorization": f"Bearer {self.config.api_key}",
            "Content-Type": "application/json",
            "X-Source": "litper-pro-brain"
        }

    # =========================================================================
    # WEBHOOKS - Enviar eventos a Chatea Pro / N8N
    # =========================================================================

    async def trigger_webhook(
        self,
        event_type: str,
        data: Dict[str, Any],
        priority: str = "normal"
    ) -> Dict[str, Any]:
        """
        Envia un evento al webhook de Chatea Pro (conectado a N8N).

        Args:
            event_type: Tipo de evento (order_created, delay_detected, etc)
            data: Datos del evento
            priority: Prioridad (low, normal, high, critical)

        Returns:
            Respuesta del webhook

        Ejemplo:
            await client.trigger_webhook(
                "delay_detected",
                {"order_id": "123", "days": 5, "city": "Pasto"},
                priority="high"
            )
        """
        session = await self._get_session()

        payload = {
            "event": event_type,
            "data": data,
            "priority": priority,
            "timestamp": datetime.now().isoformat(),
            "source": "litper-pro-brain"
        }

        try:
            async with session.post(
                self.config.webhook_url,
                json=payload,
                headers=self._get_headers()
            ) as response:
                if response.status == 200:
                    return {
                        "success": True,
                        "status": response.status,
                        "message": "Webhook triggered successfully"
                    }
                else:
                    text = await response.text()
                    return {
                        "success": False,
                        "status": response.status,
                        "error": text
                    }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    async def send_alert(
        self,
        title: str,
        message: str,
        order_id: str = None,
        severity: str = "warning"
    ) -> Dict[str, Any]:
        """
        Envia una alerta a traves del webhook.

        Args:
            title: Titulo de la alerta
            message: Mensaje de la alerta
            order_id: ID del pedido relacionado (opcional)
            severity: info, warning, error, critical
        """
        return await self.trigger_webhook(
            "alert_triggered",
            {
                "title": title,
                "message": message,
                "order_id": order_id,
                "severity": severity
            },
            priority="high" if severity in ["error", "critical"] else "normal"
        )

    # =========================================================================
    # MENSAJES - Enviar mensajes a clientes via Chatea Pro
    # =========================================================================

    async def send_message(
        self,
        phone: str,
        message: str,
        template: str = None
    ) -> Dict[str, Any]:
        """
        Envia un mensaje de WhatsApp a un cliente via Chatea Pro.

        Args:
            phone: Numero de telefono (+573001234567)
            message: Mensaje a enviar
            template: Plantilla opcional

        Ejemplo:
            await client.send_message(
                "+573001234567",
                "Hola Maria! Tu pedido #123 esta en camino."
            )
        """
        return await self.trigger_webhook(
            "send_message",
            {
                "phone": phone,
                "message": message,
                "template": template,
                "channel": "whatsapp"
            }
        )

    async def send_order_update(
        self,
        order: Order,
        status_message: str
    ) -> Dict[str, Any]:
        """
        Envia actualizacion de estado al cliente.

        Args:
            order: Objeto Order con los datos del pedido
            status_message: Mensaje personalizado del estado
        """
        message = f"Hola {order.cliente_nombre}! {status_message}"

        return await self.send_message(
            order.cliente_telefono,
            message
        )

    # =========================================================================
    # CONSULTAS - Obtener datos de Dropi via Chatea Pro
    # =========================================================================

    async def get_order(self, order_id: str) -> Optional[Order]:
        """
        Obtiene informacion de un pedido desde Dropi.

        Args:
            order_id: ID o numero del pedido

        Returns:
            Objeto Order con la informacion
        """
        # Por ahora simulamos la respuesta ya que necesitamos
        # conocer el endpoint exacto de Chatea Pro
        # En produccion, esto haria una llamada real al API

        return await self.trigger_webhook(
            "get_order",
            {"order_id": order_id}
        )

    async def get_orders_by_status(
        self,
        status: OrderStatus,
        limit: int = 50
    ) -> List[Dict]:
        """
        Obtiene pedidos filtrados por estado.

        Args:
            status: Estado a filtrar
            limit: Maximo de resultados
        """
        return await self.trigger_webhook(
            "get_orders",
            {
                "filter": {"status": status.value},
                "limit": limit
            }
        )

    async def get_delayed_orders(self, min_days: int = 3) -> List[Dict]:
        """
        Obtiene pedidos con retraso.

        Args:
            min_days: Minimo de dias de retraso
        """
        return await self.trigger_webhook(
            "get_delayed_orders",
            {"min_days": min_days}
        )

    async def get_orders_with_issues(self) -> List[Dict]:
        """Obtiene pedidos con novedades activas."""
        return await self.trigger_webhook(
            "get_orders_with_issues",
            {}
        )

    # =========================================================================
    # ANALYTICS - Datos para el dashboard
    # =========================================================================

    async def get_dashboard_stats(self) -> Dict[str, Any]:
        """
        Obtiene estadisticas para el dashboard.

        Returns:
            {
                "total_orders": 150,
                "pending": 20,
                "in_transit": 80,
                "delivered": 45,
                "with_issues": 5,
                "delayed": 12,
                "today_orders": 15,
                "today_delivered": 8
            }
        """
        return await self.trigger_webhook(
            "get_dashboard_stats",
            {"date": datetime.now().strftime("%Y-%m-%d")}
        )

    async def get_carrier_stats(self) -> Dict[str, Any]:
        """
        Obtiene estadisticas por transportadora.

        Returns:
            {
                "Coordinadora": {"total": 50, "on_time": 45, "delayed": 5},
                "Servientrega": {"total": 40, "on_time": 35, "delayed": 5},
                ...
            }
        """
        return await self.trigger_webhook(
            "get_carrier_stats",
            {}
        )

    async def get_city_stats(self) -> Dict[str, Any]:
        """
        Obtiene estadisticas por ciudad.

        Returns:
            {
                "Bogota": {"total": 80, "avg_days": 2.5},
                "Medellin": {"total": 40, "avg_days": 3.0},
                ...
            }
        """
        return await self.trigger_webhook(
            "get_city_stats",
            {}
        )

    # =========================================================================
    # ACCIONES AUTOMATICAS
    # =========================================================================

    async def escalate_order(
        self,
        order_id: str,
        reason: str,
        priority: str = "high"
    ) -> Dict[str, Any]:
        """
        Escala un pedido para atencion prioritaria.
        """
        return await self.trigger_webhook(
            "escalate_order",
            {
                "order_id": order_id,
                "reason": reason,
                "escalated_at": datetime.now().isoformat()
            },
            priority=priority
        )

    async def request_carrier_update(
        self,
        order_id: str,
        carrier: str,
        guide: str
    ) -> Dict[str, Any]:
        """
        Solicita actualizacion de estado a la transportadora.
        """
        return await self.trigger_webhook(
            "request_carrier_update",
            {
                "order_id": order_id,
                "carrier": carrier,
                "guide": guide
            }
        )

    # =========================================================================
    # HEALTH CHECK
    # =========================================================================

    async def health_check(self) -> Dict[str, Any]:
        """Verifica conexion con Chatea Pro."""
        if not self.config.api_key:
            return {
                "status": "error",
                "error": "CHATEA_PRO_API_KEY not configured"
            }

        if not self.config.webhook_url:
            return {
                "status": "error",
                "error": "CHATEA_PRO_WEBHOOK_URL not configured"
            }

        # Intentar ping al webhook
        result = await self.trigger_webhook("health_check", {"ping": True})

        return {
            "status": "healthy" if result.get("success") else "degraded",
            "webhook_url": self.config.webhook_url[:50] + "...",
            "api_key_configured": bool(self.config.api_key),
            "timestamp": datetime.now().isoformat()
        }
