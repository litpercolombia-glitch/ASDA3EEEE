"""
Webhook Handler - Recibe y procesa eventos de Chatea Pro / N8N
==============================================================

Este modulo maneja los eventos que llegan desde:
- Chatea Pro (cambios en pedidos, mensajes de clientes)
- N8N (automatizaciones, triggers programados)
- Dropi (actualizaciones de estado via Chatea Pro)

Cuando llega un evento, el handler:
1. Valida el evento
2. Lo clasifica por tipo
3. Lo envia al Cerebro IA para analisis
4. Ejecuta acciones automaticas si es necesario
5. Guarda en el historial para analytics

USO:
    from integrations import WebhookHandler

    handler = WebhookHandler()

    # Procesar un evento entrante
    result = await handler.process_event(event_data)

    # Obtener historial de eventos
    history = handler.get_event_history(limit=100)
"""

import os
import json
import hashlib
import hmac
from typing import Dict, Any, List, Optional, Callable
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from collections import deque
import asyncio


class EventType(str, Enum):
    """Tipos de eventos que podemos recibir."""
    # Pedidos
    ORDER_CREATED = "order_created"
    ORDER_UPDATED = "order_updated"
    ORDER_CANCELLED = "order_cancelled"
    STATUS_CHANGED = "status_changed"

    # Problemas
    DELAY_DETECTED = "delay_detected"
    ISSUE_REPORTED = "issue_reported"
    DELIVERY_FAILED = "delivery_failed"
    RETURN_INITIATED = "return_initiated"

    # Entregas
    DELIVERY_CONFIRMED = "delivery_confirmed"
    DELIVERY_ATTEMPTED = "delivery_attempted"

    # Clientes
    CUSTOMER_MESSAGE = "customer_message"
    CUSTOMER_INQUIRY = "customer_inquiry"
    CUSTOMER_COMPLAINT = "customer_complaint"

    # Sistema
    HEALTH_CHECK = "health_check"
    SYNC_REQUEST = "sync_request"
    ALERT_TRIGGERED = "alert_triggered"

    # Desconocido
    UNKNOWN = "unknown"


class EventPriority(str, Enum):
    """Prioridad de los eventos."""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class WebhookEvent:
    """Representa un evento recibido via webhook."""
    id: str
    type: EventType
    data: Dict[str, Any]
    source: str  # chatea_pro, n8n, dropi, etc
    priority: EventPriority
    timestamp: datetime
    processed: bool = False
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "type": self.type.value,
            "data": self.data,
            "source": self.source,
            "priority": self.priority.value,
            "timestamp": self.timestamp.isoformat(),
            "processed": self.processed,
            "result": self.result,
            "error": self.error
        }


class WebhookHandler:
    """
    Manejador central de webhooks.

    Recibe eventos de Chatea Pro, N8N y otros servicios,
    los procesa y ejecuta acciones automaticas.
    """

    def __init__(self):
        self.secret = os.getenv("N8N_WEBHOOK_SECRET", "litper_webhook_secret_2024")
        self._event_history: deque = deque(maxlen=1000)  # Ultimos 1000 eventos
        self._handlers: Dict[EventType, List[Callable]] = {}
        self._stats = {
            "total_received": 0,
            "total_processed": 0,
            "total_errors": 0,
            "by_type": {},
            "by_source": {}
        }

        # Registrar handlers por defecto
        self._register_default_handlers()

    def _register_default_handlers(self):
        """Registra handlers por defecto para cada tipo de evento."""
        # Los handlers se registran aqui pero se ejecutan con el cerebro IA
        pass

    def register_handler(
        self,
        event_type: EventType,
        handler: Callable
    ):
        """
        Registra un handler para un tipo de evento.

        Args:
            event_type: Tipo de evento
            handler: Funcion async que procesa el evento
        """
        if event_type not in self._handlers:
            self._handlers[event_type] = []
        self._handlers[event_type].append(handler)

    def verify_signature(
        self,
        payload: bytes,
        signature: str
    ) -> bool:
        """
        Verifica la firma del webhook para seguridad.

        Args:
            payload: Body del request en bytes
            signature: Firma enviada en el header
        """
        if not self.secret:
            return True  # Sin secret, aceptar todo (dev mode)

        expected = hmac.new(
            self.secret.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(f"sha256={expected}", signature)

    def _classify_event(self, raw_data: Dict[str, Any]) -> EventType:
        """Clasifica el tipo de evento basado en los datos."""
        event_type = raw_data.get("event", raw_data.get("type", ""))

        # Mapeo de strings a EventType
        type_mapping = {
            "order_created": EventType.ORDER_CREATED,
            "order_updated": EventType.ORDER_UPDATED,
            "order_cancelled": EventType.ORDER_CANCELLED,
            "status_changed": EventType.STATUS_CHANGED,
            "delay_detected": EventType.DELAY_DETECTED,
            "issue_reported": EventType.ISSUE_REPORTED,
            "delivery_failed": EventType.DELIVERY_FAILED,
            "return_initiated": EventType.RETURN_INITIATED,
            "delivery_confirmed": EventType.DELIVERY_CONFIRMED,
            "delivery_attempted": EventType.DELIVERY_ATTEMPTED,
            "customer_message": EventType.CUSTOMER_MESSAGE,
            "customer_inquiry": EventType.CUSTOMER_INQUIRY,
            "customer_complaint": EventType.CUSTOMER_COMPLAINT,
            "health_check": EventType.HEALTH_CHECK,
            "sync_request": EventType.SYNC_REQUEST,
            "alert_triggered": EventType.ALERT_TRIGGERED,
        }

        return type_mapping.get(event_type.lower(), EventType.UNKNOWN)

    def _determine_priority(
        self,
        event_type: EventType,
        data: Dict[str, Any]
    ) -> EventPriority:
        """Determina la prioridad del evento."""
        # Eventos criticos
        if event_type in [
            EventType.DELIVERY_FAILED,
            EventType.CUSTOMER_COMPLAINT,
            EventType.RETURN_INITIATED
        ]:
            return EventPriority.CRITICAL

        # Eventos de alta prioridad
        if event_type in [
            EventType.DELAY_DETECTED,
            EventType.ISSUE_REPORTED,
            EventType.CUSTOMER_INQUIRY
        ]:
            return EventPriority.HIGH

        # Prioridad explicita en los datos
        if "priority" in data:
            priority_map = {
                "low": EventPriority.LOW,
                "normal": EventPriority.NORMAL,
                "high": EventPriority.HIGH,
                "critical": EventPriority.CRITICAL
            }
            return priority_map.get(data["priority"], EventPriority.NORMAL)

        # Revisar dias de retraso
        if data.get("days_delayed", 0) >= 5:
            return EventPriority.HIGH
        elif data.get("days_delayed", 0) >= 3:
            return EventPriority.NORMAL

        return EventPriority.NORMAL

    def _generate_event_id(self) -> str:
        """Genera un ID unico para el evento."""
        import uuid
        return f"evt_{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:8]}"

    async def process_event(
        self,
        raw_data: Dict[str, Any],
        source: str = "webhook"
    ) -> WebhookEvent:
        """
        Procesa un evento entrante.

        Args:
            raw_data: Datos del evento
            source: Fuente del evento (chatea_pro, n8n, etc)

        Returns:
            WebhookEvent procesado
        """
        self._stats["total_received"] += 1

        # Clasificar evento
        event_type = self._classify_event(raw_data)
        data = raw_data.get("data", raw_data)
        priority = self._determine_priority(event_type, data)

        # Crear objeto evento
        event = WebhookEvent(
            id=self._generate_event_id(),
            type=event_type,
            data=data,
            source=source,
            priority=priority,
            timestamp=datetime.now()
        )

        # Actualizar stats
        self._stats["by_type"][event_type.value] = \
            self._stats["by_type"].get(event_type.value, 0) + 1
        self._stats["by_source"][source] = \
            self._stats["by_source"].get(source, 0) + 1

        try:
            # Ejecutar handlers registrados
            handlers = self._handlers.get(event_type, [])
            results = []

            for handler in handlers:
                try:
                    result = await handler(event)
                    results.append(result)
                except Exception as e:
                    results.append({"error": str(e)})

            event.processed = True
            event.result = {
                "handlers_executed": len(handlers),
                "results": results
            }
            self._stats["total_processed"] += 1

        except Exception as e:
            event.error = str(e)
            self._stats["total_errors"] += 1

        # Guardar en historial
        self._event_history.append(event)

        return event

    def get_event_history(
        self,
        limit: int = 100,
        event_type: EventType = None,
        source: str = None
    ) -> List[Dict[str, Any]]:
        """
        Obtiene el historial de eventos.

        Args:
            limit: Maximo de eventos a retornar
            event_type: Filtrar por tipo
            source: Filtrar por fuente
        """
        events = list(self._event_history)

        if event_type:
            events = [e for e in events if e.type == event_type]

        if source:
            events = [e for e in events if e.source == source]

        # Ordenar por timestamp descendente
        events.sort(key=lambda x: x.timestamp, reverse=True)

        return [e.to_dict() for e in events[:limit]]

    def get_stats(self) -> Dict[str, Any]:
        """Obtiene estadisticas del handler."""
        return {
            **self._stats,
            "history_size": len(self._event_history),
            "registered_handlers": {
                k.value: len(v) for k, v in self._handlers.items()
            }
        }

    def get_pending_alerts(self) -> List[Dict[str, Any]]:
        """Obtiene eventos de alta prioridad no procesados."""
        return [
            e.to_dict() for e in self._event_history
            if e.priority in [EventPriority.HIGH, EventPriority.CRITICAL]
            and not e.processed
        ]

    def get_recent_issues(self, hours: int = 24) -> List[Dict[str, Any]]:
        """Obtiene problemas reportados en las ultimas N horas."""
        from datetime import timedelta

        cutoff = datetime.now() - timedelta(hours=hours)
        issue_types = [
            EventType.DELAY_DETECTED,
            EventType.ISSUE_REPORTED,
            EventType.DELIVERY_FAILED,
            EventType.CUSTOMER_COMPLAINT
        ]

        return [
            e.to_dict() for e in self._event_history
            if e.type in issue_types and e.timestamp >= cutoff
        ]


# Instancia global del handler
_webhook_handler: Optional[WebhookHandler] = None


def get_webhook_handler() -> WebhookHandler:
    """Obtiene la instancia global del webhook handler."""
    global _webhook_handler
    if _webhook_handler is None:
        _webhook_handler = WebhookHandler()
    return _webhook_handler
