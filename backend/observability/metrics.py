"""
Métricas personalizadas para Litper usando Prometheus
=====================================================

Este módulo define todas las métricas de negocio y técnicas
para monitoreo con Prometheus y visualización en Grafana.
"""

from prometheus_client import Counter, Histogram, Gauge, Info
import time
from functools import wraps
from typing import Dict, Any, Callable

# ═══════════════════════════════════════════
# MÉTRICAS DE NEGOCIO
# ═══════════════════════════════════════════

# Pedidos
orders_total = Counter(
    'litper_orders_total',
    'Total de pedidos procesados',
    ['country', 'source', 'status']
)

orders_value = Counter(
    'litper_orders_value_cop_total',
    'Valor total de pedidos en COP',
    ['country']
)

# Guías
guides_total = Counter(
    'litper_guides_total',
    'Total de guías creadas',
    ['country', 'carrier', 'status']
)

guides_active = Gauge(
    'litper_guides_active',
    'Guías activas siendo monitoreadas',
    ['country', 'carrier']
)

# Novedades
incidents_total = Counter(
    'litper_incidents_total',
    'Total de novedades',
    ['country', 'type', 'resolution']
)

incidents_active = Gauge(
    'litper_incidents_active',
    'Novedades activas sin resolver',
    ['country', 'priority']
)

incidents_resolution_time = Histogram(
    'litper_incidents_resolution_seconds',
    'Tiempo de resolución de novedades',
    ['country', 'type'],
    buckets=[300, 900, 1800, 3600, 7200, 14400, 28800, 86400]
)

# ═══════════════════════════════════════════
# MÉTRICAS DE AGENTES IA
# ═══════════════════════════════════════════

agents_active = Gauge(
    'litper_agents_active',
    'Agentes IA activos',
    ['district', 'country']
)

agents_tasks_total = Counter(
    'litper_agent_tasks_total',
    'Tareas ejecutadas por agentes',
    ['agent_type', 'status']
)

agents_task_duration = Histogram(
    'litper_agent_task_duration_seconds',
    'Duración de tareas de agentes',
    ['agent_type'],
    buckets=[0.1, 0.5, 1, 2, 5, 10, 30, 60, 120]
)

claude_api_calls = Counter(
    'litper_claude_api_calls_total',
    'Llamadas a Claude API',
    ['model', 'status']
)

claude_api_tokens = Counter(
    'litper_claude_api_tokens_total',
    'Tokens consumidos de Claude API',
    ['model', 'type']  # type: input/output
)

claude_api_latency = Histogram(
    'litper_claude_api_latency_seconds',
    'Latencia de Claude API',
    ['model'],
    buckets=[0.5, 1, 2, 3, 5, 10, 20, 30]
)

# ═══════════════════════════════════════════
# MÉTRICAS DE COMUNICACIÓN
# ═══════════════════════════════════════════

chats_active = Gauge(
    'litper_chats_active',
    'Conversaciones de chat activas',
    ['country', 'channel']
)

chats_total = Counter(
    'litper_chats_total',
    'Total de conversaciones',
    ['country', 'channel', 'resolution']
)

chat_response_time = Histogram(
    'litper_chat_response_seconds',
    'Tiempo de respuesta en chat',
    ['country'],
    buckets=[1, 3, 5, 10, 30, 60, 120]
)

calls_total = Counter(
    'litper_calls_total',
    'Total de llamadas realizadas',
    ['country', 'type', 'outcome']
)

calls_duration = Histogram(
    'litper_calls_duration_seconds',
    'Duración de llamadas',
    ['country', 'type'],
    buckets=[30, 60, 120, 180, 300, 600]
)

whatsapp_messages = Counter(
    'litper_whatsapp_messages_total',
    'Mensajes de WhatsApp',
    ['country', 'direction', 'type']
)

# ═══════════════════════════════════════════
# MÉTRICAS DE INFRAESTRUCTURA
# ═══════════════════════════════════════════

api_requests = Counter(
    'litper_api_requests_total',
    'Total de requests a la API',
    ['method', 'endpoint', 'status_code']
)

api_latency = Histogram(
    'litper_api_latency_seconds',
    'Latencia de la API',
    ['method', 'endpoint'],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
)

db_queries = Counter(
    'litper_db_queries_total',
    'Queries a la base de datos',
    ['operation', 'table']
)

db_query_duration = Histogram(
    'litper_db_query_duration_seconds',
    'Duración de queries',
    ['operation'],
    buckets=[0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5]
)

cache_hits = Counter(
    'litper_cache_total',
    'Cache hits/misses',
    ['operation', 'result']  # result: hit/miss
)

external_api_calls = Counter(
    'litper_external_api_calls_total',
    'Llamadas a APIs externas',
    ['service', 'status']  # service: dropi, coordinadora, etc.
)

external_api_latency = Histogram(
    'litper_external_api_latency_seconds',
    'Latencia de APIs externas',
    ['service'],
    buckets=[0.1, 0.5, 1, 2, 5, 10, 30]
)

# ═══════════════════════════════════════════
# MÉTRICAS DE ML
# ═══════════════════════════════════════════

ml_predictions_total = Counter(
    'litper_ml_predictions_total',
    'Total de predicciones ML',
    ['model', 'outcome']
)

ml_prediction_latency = Histogram(
    'litper_ml_prediction_latency_seconds',
    'Latencia de predicciones ML',
    ['model'],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1]
)

ml_model_accuracy = Gauge(
    'litper_ml_model_accuracy',
    'Accuracy del modelo ML',
    ['model']
)

# ═══════════════════════════════════════════
# DECORADORES PARA INSTRUMENTACIÓN
# ═══════════════════════════════════════════

def track_time(metric: Histogram, labels: Dict[str, str] = None):
    """
    Decorador para medir tiempo de ejecución.

    Uso:
        @track_time(api_latency, {'method': 'POST', 'endpoint': '/orders'})
        async def create_order():
            ...
    """
    def decorator(func: Callable):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            start = time.time()
            try:
                result = await func(*args, **kwargs)
                return result
            finally:
                duration = time.time() - start
                if labels:
                    metric.labels(**labels).observe(duration)
                else:
                    metric.observe(duration)

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            start = time.time()
            try:
                result = func(*args, **kwargs)
                return result
            finally:
                duration = time.time() - start
                if labels:
                    metric.labels(**labels).observe(duration)
                else:
                    metric.observe(duration)

        # Detectar si es async o sync
        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper

    return decorator


def track_counter(metric: Counter, labels: Dict[str, str]):
    """
    Decorador para incrementar contador con status success/error.

    Uso:
        @track_counter(orders_total, {'country': 'CO', 'source': 'whatsapp'})
        async def create_order():
            ...
    """
    def decorator(func: Callable):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            try:
                result = await func(*args, **kwargs)
                metric.labels(**{**labels, 'status': 'success'}).inc()
                return result
            except Exception as e:
                metric.labels(**{**labels, 'status': 'error'}).inc()
                raise

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            try:
                result = func(*args, **kwargs)
                metric.labels(**{**labels, 'status': 'success'}).inc()
                return result
            except Exception as e:
                metric.labels(**{**labels, 'status': 'error'}).inc()
                raise

        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper

    return decorator


# ═══════════════════════════════════════════
# FUNCIONES HELPER
# ═══════════════════════════════════════════

def record_order(country: str, source: str, status: str, value: float = 0):
    """Registrar métricas de pedido."""
    orders_total.labels(country=country, source=source, status=status).inc()
    if value > 0:
        orders_value.labels(country=country).inc(value)


def record_guide(country: str, carrier: str, status: str):
    """Registrar métricas de guía."""
    guides_total.labels(country=country, carrier=carrier, status=status).inc()


def record_incident(country: str, incident_type: str, resolution: str, resolution_time_seconds: float = None):
    """Registrar métricas de novedad."""
    incidents_total.labels(country=country, type=incident_type, resolution=resolution).inc()
    if resolution_time_seconds:
        incidents_resolution_time.labels(country=country, type=incident_type).observe(resolution_time_seconds)


def record_claude_call(model: str, status: str, input_tokens: int = 0, output_tokens: int = 0, latency_seconds: float = None):
    """Registrar llamada a Claude API."""
    claude_api_calls.labels(model=model, status=status).inc()
    if input_tokens > 0:
        claude_api_tokens.labels(model=model, type='input').inc(input_tokens)
    if output_tokens > 0:
        claude_api_tokens.labels(model=model, type='output').inc(output_tokens)
    if latency_seconds:
        claude_api_latency.labels(model=model).observe(latency_seconds)


def record_external_api(service: str, status: str, latency_seconds: float = None):
    """Registrar llamada a API externa."""
    external_api_calls.labels(service=service, status=status).inc()
    if latency_seconds:
        external_api_latency.labels(service=service).observe(latency_seconds)


def update_active_guides(country: str, carrier: str, count: int):
    """Actualizar contador de guías activas."""
    guides_active.labels(country=country, carrier=carrier).set(count)


def update_active_agents(district: str, country: str, count: int):
    """Actualizar contador de agentes activos."""
    agents_active.labels(district=district, country=country).set(count)


def update_active_incidents(country: str, priority: str, count: int):
    """Actualizar contador de novedades activas."""
    incidents_active.labels(country=country, priority=priority).set(count)
