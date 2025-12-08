# Observabilidad y Monitoreo - Litper

## Visión General

El sistema de observabilidad de Litper proporciona visibilidad completa sobre el rendimiento, errores y comportamiento del sistema a través de tres pilares: métricas, logs y traces.

## Stack de Observabilidad

```
┌─────────────────────────────────────────────────────────────┐
│                     DASHBOARDS                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    GRAFANA                            │   │
│  │  • Dashboards de negocio                             │   │
│  │  • Dashboards técnicos                               │   │
│  │  • Alertas visuales                                  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   PROMETHEUS    │  │      LOKI       │  │     JAEGER      │
│    (Métricas)   │  │     (Logs)      │  │    (Traces)     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                   APLICACIONES                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │   API    │  │  Agents  │  │ Workers  │  │ Services │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Métricas (Prometheus)

### Métricas de Negocio

```python
# Pedidos
litper_orders_total{country, source, status}
litper_orders_amount_total{country}

# Guías
litper_guides_total{country, carrier, status}
litper_guides_delivery_time_hours

# Novedades
litper_incidents_total{type, resolution}
litper_incidents_active

# Agentes IA
litper_agents_active
litper_agent_tasks_total{agent_type, status}
litper_agent_task_duration_seconds
```

### Métricas Técnicas

```python
# API
litper_api_requests_total{method, endpoint, status_code}
litper_api_latency_seconds{method, endpoint}
litper_api_active_connections

# Claude API
litper_claude_api_calls_total{model, status}
litper_claude_api_tokens_total{model, type}
litper_claude_api_latency_seconds{model}

# Base de datos
litper_db_connections_active
litper_db_query_duration_seconds
litper_db_errors_total

# Redis
litper_cache_hits_total
litper_cache_misses_total
litper_queue_size{queue_name}
```

### Decoradores de Métricas

```python
from backend.observability import track_time, track_counter

@track_time(api_latency)
@track_counter(api_requests, labels=['POST', '/orders', '201'])
async def create_order(order: OrderCreate):
    # ...
```

## Logs Estructurados

### Formato JSON

```json
{
    "timestamp": "2024-01-15T10:30:00.123Z",
    "level": "INFO",
    "message": "Pedido creado exitosamente",
    "service": "litper-api",
    "request_id": "req-12345",
    "user_id": "user-abc",
    "country": "CO",
    "extra": {
        "order_id": "ord-xyz",
        "amount": 150000
    }
}
```

### Logger de Negocio

```python
from backend.observability import get_logger

logger = get_logger("orders")

# Métodos especializados
logger.order_created(order_id="ord-123", amount=150000)
logger.guide_delivered(guide_id="guid-456", carrier="coordinadora")
logger.incident_detected(incident_type="not_home", guide_id="guid-789")
logger.agent_action(agent="tracking", action="status_update", result="success")
```

### Niveles de Log

| Nivel | Uso |
|-------|-----|
| DEBUG | Desarrollo, detalles técnicos |
| INFO | Operaciones normales |
| WARNING | Situaciones anormales pero manejables |
| ERROR | Errores que requieren atención |
| CRITICAL | Fallos críticos del sistema |

## Alertas

### Niveles de Severidad

| Severidad | Tiempo Respuesta | Canal |
|-----------|------------------|-------|
| Critical (P1) | 5 minutos | WhatsApp + Email + Slack |
| High (P2) | 30 minutos | WhatsApp + Email |
| Medium (P3) | 4 horas | Email + Slack |
| Low (P4) | 24 horas | Slack |

### Alertas Críticas

- `LitperAPIDown`: API no responde
- `DatabaseDown`: PostgreSQL caído
- `HighErrorRate`: Tasa de errores > 10%
- `ClaudeAPIErrors`: Claude fallando > 20%
- `NoActiveAgents`: Sin agentes activos
- `RedisDown`: Redis no disponible

### Alertas de Negocio

- `OrderVolumeDrop`: Volumen de pedidos cayó 50%
- `CarrierHighIncidents`: Transportadora con >15% novedades
- `LowDeliveryRate`: Tasa de entrega < 90%
- `HighClaudeCosts`: Alto consumo de tokens

## Dashboards Grafana

### Dashboard Principal

1. **Panel de Estado**: Servicios up/down
2. **Métricas de Negocio**: Pedidos, entregas, ingresos
3. **Rendimiento API**: Latencia, errores, throughput
4. **Agentes IA**: Actividad, rendimiento, costos

### Dashboard de Operaciones

1. **Estado de Transportadoras**: Rendimiento por carrier
2. **Novedades**: Tipos, tendencias, resolución
3. **Cola de Tareas**: Tamaño, procesamiento, errores

### Dashboard de IA

1. **Uso de Claude**: Tokens, costos, latencia
2. **Rendimiento de Agentes**: Éxito, tiempo, errores
3. **Modelos ML**: Accuracy, predicciones, drift

## Configuración

### Prometheus (prometheus.yml)

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'litper-api'
    static_configs:
      - targets: ['api:8000']

  - job_name: 'litper-agents'
    static_configs:
      - targets: ['agent-orchestrator:8001']
```

### Alertmanager (alertmanager.yml)

```yaml
route:
  group_by: ['alertname', 'severity']
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: 'critical-alerts'
      repeat_interval: 5m

receivers:
  - name: 'critical-alerts'
    email_configs:
      - to: 'tech@litper.co'
    webhook_configs:
      - url: 'http://notification-service:8006/internal/alerts/whatsapp'
```

## Archivos de Implementación

- `backend/observability/metrics.py`: Definición de métricas
- `backend/observability/logger.py`: Logger estructurado
- `infrastructure/prometheus/prometheus.yml`: Configuración Prometheus
- `infrastructure/prometheus/litper_alerts.yml`: Reglas de alertas
- `infrastructure/alertmanager/alertmanager.yml`: Configuración Alertmanager
