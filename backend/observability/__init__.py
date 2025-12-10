"""
Sistema de Observabilidad para Litper
=====================================

Este paquete contiene los componentes para monitoreo y observabilidad:
- Métricas (Prometheus)
- Logging estructurado
- Alertas

Uso:
    from observability.metrics import track_time, orders_total
    from observability.logger import LitperLogger
"""

from .metrics import (
    orders_total,
    orders_value,
    guides_total,
    guides_active,
    incidents_total,
    incidents_active,
    incidents_resolution_time,
    agents_active,
    agents_tasks_total,
    agents_task_duration,
    claude_api_calls,
    claude_api_tokens,
    claude_api_latency,
    chats_active,
    chats_total,
    chat_response_time,
    calls_total,
    calls_duration,
    whatsapp_messages,
    api_requests,
    api_latency,
    db_queries,
    db_query_duration,
    cache_hits,
    external_api_calls,
    external_api_latency,
    track_time,
    track_counter,
)

from .logger import LitperLogger, LitperJSONFormatter, request_id_var, user_id_var, country_var

__all__ = [
    # Métricas
    "orders_total",
    "orders_value",
    "guides_total",
    "guides_active",
    "incidents_total",
    "incidents_active",
    "incidents_resolution_time",
    "agents_active",
    "agents_tasks_total",
    "agents_task_duration",
    "claude_api_calls",
    "claude_api_tokens",
    "claude_api_latency",
    "chats_active",
    "chats_total",
    "chat_response_time",
    "calls_total",
    "calls_duration",
    "whatsapp_messages",
    "api_requests",
    "api_latency",
    "db_queries",
    "db_query_duration",
    "cache_hits",
    "external_api_calls",
    "external_api_latency",
    "track_time",
    "track_counter",
    # Logger
    "LitperLogger",
    "LitperJSONFormatter",
    "request_id_var",
    "user_id_var",
    "country_var",
]
