"""
Sistema de logging estructurado para Litper
============================================

Logging JSON estructurado compatible con:
- Loki
- Elasticsearch
- CloudWatch
- Cualquier sistema que procese JSON

Uso:
    from observability.logger import LitperLogger

    logger = LitperLogger("orders_service")
    logger.info("Pedido creado", order_id="123", customer="Juan")
    logger.order_created(order_id="123", customer="Juan", value=150000)
"""

import logging
import json
import sys
from datetime import datetime
from typing import Any, Dict, Optional
import traceback
from contextvars import ContextVar
import os

# Context variables para tracking de requests
request_id_var: ContextVar[str] = ContextVar('request_id', default='')
user_id_var: ContextVar[str] = ContextVar('user_id', default='')
country_var: ContextVar[str] = ContextVar('country', default='')


class LitperJSONFormatter(logging.Formatter):
    """
    Formatter que produce logs en JSON estructurado.
    Compatible con Loki, Elasticsearch, CloudWatch.
    """

    def __init__(self, service_name: str = "litper-api", environment: str = None, version: str = "1.0.0"):
        super().__init__()
        self.service_name = service_name
        self.environment = environment or os.getenv("ENVIRONMENT", "development")
        self.version = version

    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            # Campos estándar
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),

            # Contexto de request
            "request_id": request_id_var.get(),
            "user_id": user_id_var.get(),
            "country": country_var.get(),

            # Ubicación del código
            "file": record.filename,
            "function": record.funcName,
            "line": record.lineno,

            # Servicio
            "service": self.service_name,
            "environment": self.environment,
            "version": self.version,
        }

        # Agregar campos extra si existen
        if hasattr(record, 'extra_fields'):
            log_data.update(record.extra_fields)

        # Agregar exception si existe
        if record.exc_info:
            log_data["exception"] = {
                "type": record.exc_info[0].__name__ if record.exc_info[0] else "Unknown",
                "message": str(record.exc_info[1]) if record.exc_info[1] else "",
                "stacktrace": traceback.format_exception(*record.exc_info) if all(record.exc_info) else []
            }

        return json.dumps(log_data, default=str, ensure_ascii=False)


class LitperLogger:
    """
    Logger personalizado para Litper con contexto enriquecido.

    Proporciona métodos específicos para eventos de negocio
    además de los métodos estándar de logging.
    """

    def __init__(self, name: str, service_name: str = "litper-api"):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.DEBUG)
        self.service_name = service_name

        # Evitar duplicar handlers si ya existen
        if not self.logger.handlers:
            # Handler para stdout (será capturado por container)
            handler = logging.StreamHandler(sys.stdout)
            handler.setFormatter(LitperJSONFormatter(service_name=service_name))
            self.logger.addHandler(handler)

    def _log(self, level: int, message: str, **kwargs):
        """Log con campos extra."""
        # Crear un LogRecord manualmente para agregar campos extra
        record = self.logger.makeRecord(
            self.logger.name,
            level,
            "",  # pathname
            0,   # lineno
            message,
            (),  # args
            None # exc_info
        )
        record.extra_fields = kwargs
        self.logger.handle(record)

    # ═══════════════════════════════════════════
    # MÉTODOS ESTÁNDAR
    # ═══════════════════════════════════════════

    def debug(self, message: str, **kwargs):
        """Log nivel DEBUG."""
        self._log(logging.DEBUG, message, **kwargs)

    def info(self, message: str, **kwargs):
        """Log nivel INFO."""
        self._log(logging.INFO, message, **kwargs)

    def warning(self, message: str, **kwargs):
        """Log nivel WARNING."""
        self._log(logging.WARNING, message, **kwargs)

    def error(self, message: str, **kwargs):
        """Log nivel ERROR."""
        self._log(logging.ERROR, message, **kwargs)

    def critical(self, message: str, **kwargs):
        """Log nivel CRITICAL."""
        self._log(logging.CRITICAL, message, **kwargs)

    def exception(self, message: str, exc_info=True, **kwargs):
        """Log de excepción con stacktrace."""
        self.logger.exception(message, exc_info=exc_info, extra={'extra_fields': kwargs})

    # ═══════════════════════════════════════════
    # MÉTODOS ESPECÍFICOS DE LITPER - PEDIDOS
    # ═══════════════════════════════════════════

    def order_created(self, order_id: str, customer: str, value: float, **kwargs):
        """Log específico para creación de pedido."""
        self.info(
            f"Pedido creado: {order_id}",
            event_type="order_created",
            order_id=order_id,
            customer=customer,
            value=value,
            **kwargs
        )

    def order_updated(self, order_id: str, status: str, **kwargs):
        """Log específico para actualización de pedido."""
        self.info(
            f"Pedido actualizado: {order_id} -> {status}",
            event_type="order_updated",
            order_id=order_id,
            status=status,
            **kwargs
        )

    def order_cancelled(self, order_id: str, reason: str, **kwargs):
        """Log específico para cancelación de pedido."""
        self.warning(
            f"Pedido cancelado: {order_id}",
            event_type="order_cancelled",
            order_id=order_id,
            reason=reason,
            **kwargs
        )

    # ═══════════════════════════════════════════
    # MÉTODOS ESPECÍFICOS DE LITPER - GUÍAS
    # ═══════════════════════════════════════════

    def guide_created(self, guide_number: str, carrier: str, **kwargs):
        """Log específico para creación de guía."""
        self.info(
            f"Guía creada: {guide_number}",
            event_type="guide_created",
            guide_number=guide_number,
            carrier=carrier,
            **kwargs
        )

    def guide_tracking_updated(self, guide_number: str, status: str, location: str = None, **kwargs):
        """Log específico para actualización de tracking."""
        self.info(
            f"Tracking actualizado: {guide_number} -> {status}",
            event_type="guide_tracking_updated",
            guide_number=guide_number,
            status=status,
            location=location,
            **kwargs
        )

    def guide_delivered(self, guide_number: str, delivery_time_hours: float = None, **kwargs):
        """Log específico para entrega de guía."""
        self.info(
            f"Guía entregada: {guide_number}",
            event_type="guide_delivered",
            guide_number=guide_number,
            delivery_time_hours=delivery_time_hours,
            **kwargs
        )

    # ═══════════════════════════════════════════
    # MÉTODOS ESPECÍFICOS DE LITPER - NOVEDADES
    # ═══════════════════════════════════════════

    def incident_detected(self, guide_number: str, incident_type: str, **kwargs):
        """Log específico para detección de novedad."""
        self.warning(
            f"Novedad detectada en guía {guide_number}: {incident_type}",
            event_type="incident_detected",
            guide_number=guide_number,
            incident_type=incident_type,
            **kwargs
        )

    def incident_resolved(self, guide_number: str, resolution: str, duration_seconds: float, **kwargs):
        """Log específico para resolución de novedad."""
        self.info(
            f"Novedad resuelta en guía {guide_number}",
            event_type="incident_resolved",
            guide_number=guide_number,
            resolution=resolution,
            duration_seconds=duration_seconds,
            **kwargs
        )

    def incident_escalated(self, guide_number: str, reason: str, escalation_level: int, **kwargs):
        """Log específico para escalamiento de novedad."""
        self.warning(
            f"Novedad escalada: {guide_number} (nivel {escalation_level})",
            event_type="incident_escalated",
            guide_number=guide_number,
            reason=reason,
            escalation_level=escalation_level,
            **kwargs
        )

    # ═══════════════════════════════════════════
    # MÉTODOS ESPECÍFICOS DE LITPER - AGENTES IA
    # ═══════════════════════════════════════════

    def agent_task_started(self, agent_id: str, task_type: str, **kwargs):
        """Log para inicio de tarea de agente."""
        self.info(
            f"Agente {agent_id} iniciando tarea: {task_type}",
            event_type="agent_task_started",
            agent_id=agent_id,
            task_type=task_type,
            **kwargs
        )

    def agent_task_completed(self, agent_id: str, task_type: str, duration_ms: float, **kwargs):
        """Log para finalización de tarea de agente."""
        self.info(
            f"Agente {agent_id} completó tarea: {task_type}",
            event_type="agent_task_completed",
            agent_id=agent_id,
            task_type=task_type,
            duration_ms=duration_ms,
            **kwargs
        )

    def agent_task_failed(self, agent_id: str, task_type: str, error: str, **kwargs):
        """Log para fallo de tarea de agente."""
        self.error(
            f"Agente {agent_id} falló en tarea: {task_type}",
            event_type="agent_task_failed",
            agent_id=agent_id,
            task_type=task_type,
            error=error,
            **kwargs
        )

    def agent_learning(self, agent_id: str, learning_type: str, insight: str, **kwargs):
        """Log para aprendizaje de agente."""
        self.info(
            f"Agente {agent_id} aprendió: {learning_type}",
            event_type="agent_learning",
            agent_id=agent_id,
            learning_type=learning_type,
            insight=insight,
            **kwargs
        )

    # ═══════════════════════════════════════════
    # MÉTODOS ESPECÍFICOS DE LITPER - COMUNICACIÓN
    # ═══════════════════════════════════════════

    def chat_message(self, chat_id: str, direction: str, message_type: str, **kwargs):
        """Log para mensajes de chat."""
        self.info(
            f"Chat {chat_id}: {direction} message ({message_type})",
            event_type="chat_message",
            chat_id=chat_id,
            direction=direction,
            message_type=message_type,
            **kwargs
        )

    def call_started(self, call_id: str, phone_number: str, call_type: str, **kwargs):
        """Log para inicio de llamada."""
        self.info(
            f"Llamada iniciada: {call_id}",
            event_type="call_started",
            call_id=call_id,
            phone_number=self._mask_phone(phone_number),
            call_type=call_type,
            **kwargs
        )

    def call_completed(self, call_id: str, outcome: str, duration_seconds: float, **kwargs):
        """Log para llamadas completadas."""
        self.info(
            f"Llamada {call_id} completada: {outcome}",
            event_type="call_completed",
            call_id=call_id,
            outcome=outcome,
            duration_seconds=duration_seconds,
            **kwargs
        )

    def whatsapp_sent(self, phone: str, template: str, **kwargs):
        """Log para WhatsApp enviado."""
        self.info(
            f"WhatsApp enviado: {template}",
            event_type="whatsapp_sent",
            phone=self._mask_phone(phone),
            template=template,
            **kwargs
        )

    # ═══════════════════════════════════════════
    # MÉTODOS ESPECÍFICOS DE LITPER - APIs EXTERNAS
    # ═══════════════════════════════════════════

    def external_api_call(self, service: str, endpoint: str, status_code: int, duration_ms: float, **kwargs):
        """Log para llamadas a APIs externas."""
        level = logging.INFO if status_code < 400 else logging.ERROR
        self._log(
            level,
            f"API call to {service}: {endpoint} -> {status_code}",
            event_type="external_api_call",
            service=service,
            endpoint=endpoint,
            status_code=status_code,
            duration_ms=duration_ms,
            **kwargs
        )

    def claude_api_call(self, model: str, input_tokens: int, output_tokens: int, duration_ms: float, **kwargs):
        """Log para llamadas a Claude API."""
        self.info(
            f"Claude API call: {model}",
            event_type="claude_api_call",
            model=model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            duration_ms=duration_ms,
            cost_usd=self._calculate_claude_cost(model, input_tokens, output_tokens),
            **kwargs
        )

    # ═══════════════════════════════════════════
    # MÉTODOS ESPECÍFICOS DE LITPER - ML
    # ═══════════════════════════════════════════

    def ml_prediction(self, model: str, prediction: str, confidence: float, duration_ms: float, **kwargs):
        """Log para predicción ML."""
        self.info(
            f"ML Prediction: {model} -> {prediction}",
            event_type="ml_prediction",
            model=model,
            prediction=prediction,
            confidence=confidence,
            duration_ms=duration_ms,
            **kwargs
        )

    def ml_training_started(self, model: str, samples: int, **kwargs):
        """Log para inicio de entrenamiento ML."""
        self.info(
            f"ML Training started: {model}",
            event_type="ml_training_started",
            model=model,
            samples=samples,
            **kwargs
        )

    def ml_training_completed(self, model: str, accuracy: float, duration_seconds: float, **kwargs):
        """Log para entrenamiento ML completado."""
        self.info(
            f"ML Training completed: {model} (accuracy: {accuracy:.2%})",
            event_type="ml_training_completed",
            model=model,
            accuracy=accuracy,
            duration_seconds=duration_seconds,
            **kwargs
        )

    # ═══════════════════════════════════════════
    # UTILIDADES PRIVADAS
    # ═══════════════════════════════════════════

    def _mask_phone(self, phone: str) -> str:
        """Enmascarar número de teléfono para logs."""
        if not phone or len(phone) < 8:
            return "***"
        return phone[:3] + "*" * (len(phone) - 5) + phone[-2:]

    def _calculate_claude_cost(self, model: str, input_tokens: int, output_tokens: int) -> float:
        """Calcular costo estimado de llamada a Claude."""
        # Precios aproximados por 1M tokens
        prices = {
            "claude-sonnet-4-20250514": {"input": 3.0, "output": 15.0},
            "claude-3-opus": {"input": 15.0, "output": 75.0},
            "claude-3-haiku": {"input": 0.25, "output": 1.25},
        }

        model_prices = prices.get(model, prices["claude-sonnet-4-20250514"])
        cost = (input_tokens * model_prices["input"] / 1_000_000) + \
               (output_tokens * model_prices["output"] / 1_000_000)
        return round(cost, 6)


# ═══════════════════════════════════════════
# SINGLETON PARA USO GLOBAL
# ═══════════════════════════════════════════

_logger_instances: Dict[str, LitperLogger] = {}


def get_logger(name: str, service_name: str = "litper-api") -> LitperLogger:
    """
    Obtener instancia de logger (singleton por nombre).

    Uso:
        from observability.logger import get_logger
        logger = get_logger("orders_service")
    """
    if name not in _logger_instances:
        _logger_instances[name] = LitperLogger(name, service_name)
    return _logger_instances[name]


# ═══════════════════════════════════════════
# CONFIGURACIÓN DE CONTEXTO PARA REQUESTS
# ═══════════════════════════════════════════

def set_request_context(request_id: str = None, user_id: str = None, country: str = None):
    """
    Establecer contexto de request para logging.

    Uso en middleware FastAPI:
        @app.middleware("http")
        async def add_request_context(request: Request, call_next):
            set_request_context(
                request_id=request.headers.get("X-Request-ID", str(uuid.uuid4())),
                user_id=request.state.user_id if hasattr(request.state, 'user_id') else None,
                country=request.headers.get("X-Country", "CO")
            )
            response = await call_next(request)
            return response
    """
    if request_id:
        request_id_var.set(request_id)
    if user_id:
        user_id_var.set(user_id)
    if country:
        country_var.set(country)


def clear_request_context():
    """Limpiar contexto de request."""
    request_id_var.set('')
    user_id_var.set('')
    country_var.set('')
