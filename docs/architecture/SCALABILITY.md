# Escalabilidad y Alta Disponibilidad - Litper

## Visión General

La arquitectura de Litper está diseñada para escalar horizontalmente y mantener alta disponibilidad (99.9% uptime).

## Arquitectura de Kubernetes

```
┌─────────────────────────────────────────────────────────────────────┐
│                        KUBERNETES CLUSTER                            │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                      INGRESS CONTROLLER                          ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           ││
│  │  │ /api/*       │  │ /agents/*    │  │ /webhooks/*  │           ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘           ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                │                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                        SERVICES                                   ││
│  │                                                                   ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              ││
│  │  │ litper-api  │  │ agent-orch  │  │ workers     │              ││
│  │  │ replicas: 3 │  │ replicas: 2 │  │ replicas: 5 │              ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘              ││
│  │                                                                   ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              ││
│  │  │ chat-svc    │  │ tracking    │  │ analytics   │              ││
│  │  │ replicas: 2 │  │ replicas: 2 │  │ replicas: 1 │              ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘              ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    HORIZONTAL POD AUTOSCALER                      ││
│  │  CPU Target: 70%  │  Memory Target: 80%  │  Scale: 3-50 pods    ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

## Configuración de Deployments

### API Principal

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: litper-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: litper-api
  template:
    spec:
      containers:
      - name: api
        image: litper/api:latest
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Auto-Scaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: litper-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: litper-api
  minReplicas: 3
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
    scaleUp:
      stabilizationWindowSeconds: 60
```

## Cola de Tareas Distribuida

### Prioridades

| Prioridad | Uso | Timeout |
|-----------|-----|---------|
| CRITICAL | Alertas, errores críticos | 30s |
| HIGH | Notificaciones WhatsApp, webhooks | 60s |
| NORMAL | Actualizaciones de tracking | 300s |
| LOW | Reportes, analytics | 600s |

### Implementación

```python
from backend.workers import TaskQueue, TaskPriority

queue = TaskQueue(redis_url="redis://redis:6379")

# Encolar tarea
await queue.enqueue(
    task_type="send_whatsapp",
    payload={"phone": "573001234567", "message": "..."},
    priority=TaskPriority.HIGH
)

# Worker
worker = TaskWorker(
    queue=queue,
    handlers={
        "send_whatsapp": handle_whatsapp,
        "update_tracking": handle_tracking,
        "process_order": handle_order,
    },
    concurrency=10
)
await worker.start()
```

### Distribución de Workers

```
┌──────────────────────────────────────────────────────────────┐
│                    REDIS CLUSTER                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ critical │  │  high    │  │  normal  │  │   low    │     │
│  │  queue   │  │  queue   │  │  queue   │  │  queue   │     │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘     │
└───────┼─────────────┼─────────────┼─────────────┼────────────┘
        │             │             │             │
        ▼             ▼             ▼             ▼
┌──────────────────────────────────────────────────────────────┐
│                     WORKER PODS                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ Worker 1 │  │ Worker 2 │  │ Worker 3 │  │ Worker 4 │     │
│  │ (all)    │  │ (all)    │  │ (low pri)│  │ (low pri)│     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
└──────────────────────────────────────────────────────────────┘
```

## Alta Disponibilidad

### Base de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                   PostgreSQL HA                              │
│                                                              │
│  ┌─────────────┐         ┌─────────────┐                    │
│  │  PRIMARY    │────────▶│  REPLICA 1  │                    │
│  │  (R/W)      │         │  (R/O)      │                    │
│  └─────────────┘         └─────────────┘                    │
│         │                                                    │
│         │                ┌─────────────┐                    │
│         └───────────────▶│  REPLICA 2  │                    │
│                          │  (R/O)      │                    │
│                          └─────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

### Redis Cluster

```
┌─────────────────────────────────────────────────────────────┐
│                     Redis Sentinel                           │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  MASTER     │  │  SLAVE 1    │  │  SLAVE 2    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Sentinel 1  │  │ Sentinel 2  │  │ Sentinel 3  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Resiliencia

### Circuit Breaker

```python
from circuitbreaker import circuit

@circuit(failure_threshold=5, recovery_timeout=30)
async def call_carrier_api(carrier: str, data: dict):
    # Si falla 5 veces consecutivas, el circuito se abre
    # Después de 30 segundos, permite un intento de prueba
    pass
```

### Retry con Backoff

```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10)
)
async def send_notification(message: dict):
    # Reintentos: 2s, 4s, 8s
    pass
```

### Timeouts

| Servicio | Timeout |
|----------|---------|
| API Requests | 30s |
| Claude API | 120s |
| Transportadoras | 60s |
| WhatsApp API | 30s |
| Database Queries | 10s |

## Métricas de Escalabilidad

### Capacidad Actual

| Métrica | Valor |
|---------|-------|
| Requests/segundo | 1,000 |
| Órdenes/hora | 10,000 |
| Mensajes WhatsApp/minuto | 500 |
| Agentes IA concurrentes | 20 |

### Objetivos de Escalabilidad

| Fase | Requests/s | Órdenes/día |
|------|------------|-------------|
| Inicial | 100 | 5,000 |
| 6 meses | 500 | 25,000 |
| 12 meses | 2,000 | 100,000 |

## Pod Disruption Budget

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: litper-api-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: litper-api
```

## Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: litper-api-network-policy
spec:
  podSelector:
    matchLabels:
      app: litper-api
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: ingress-nginx
    ports:
    - protocol: TCP
      port: 8000
```

## Archivos de Implementación

- `infrastructure/kubernetes/deployment.yaml`: Deployments y HPA
- `backend/workers/task_queue.py`: Cola de tareas distribuida
