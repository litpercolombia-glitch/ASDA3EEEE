"""
Sistema de colas distribuidas para Litper
=========================================

Implementa:
- Colas con prioridad (crítica, alta, normal, baja)
- Tareas con retry automático
- Workers escalables
- Dead letter queues

Uso:
    queue = TaskQueue("redis://localhost:6379/0")

    # Registrar handlers
    queue.register_handler("process_order", process_order_task)

    # Encolar
    task_id = await queue.enqueue("process_order", {"order_id": "123"})

    # Iniciar worker
    worker = TaskWorker(queue, "worker-1", concurrency=10)
    await worker.start()
"""

import asyncio
from typing import Callable, Dict, Any, Optional, List
from datetime import datetime, timedelta
import json
from pydantic import BaseModel
from enum import Enum
import uuid
import redis.asyncio as redis


# ═══════════════════════════════════════════
# TIPOS Y MODELOS
# ═══════════════════════════════════════════

class TaskPriority(int, Enum):
    """Prioridad de tarea."""
    CRITICAL = 0  # Procesar inmediatamente
    HIGH = 1      # Procesar en < 1 minuto
    NORMAL = 2    # Procesar en < 5 minutos
    LOW = 3       # Procesar cuando haya capacidad


class TaskStatus(str, Enum):
    """Estado de tarea."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    RETRYING = "retrying"
    DEAD = "dead"  # Falló todos los reintentos


class Task(BaseModel):
    """Modelo de tarea."""
    id: str
    type: str
    payload: Dict[str, Any]
    priority: TaskPriority = TaskPriority.NORMAL
    status: TaskStatus = TaskStatus.PENDING
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    retries: int = 0
    max_retries: int = 3
    error_message: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    country: Optional[str] = None
    worker_id: Optional[str] = None

    class Config:
        use_enum_values = True


# ═══════════════════════════════════════════
# COLA DE TAREAS
# ═══════════════════════════════════════════

class TaskQueue:
    """
    Cola de tareas distribuida con Redis.

    Soporta:
    - Múltiples prioridades
    - Tareas programadas (delayed)
    - Retry automático con backoff
    - Dead letter queue
    """

    def __init__(self, redis_url: str):
        """
        Inicializar cola.

        Args:
            redis_url: URL de conexión a Redis
        """
        self.redis = redis.from_url(redis_url, decode_responses=True)
        self.handlers: Dict[str, Callable] = {}

        # Nombres de colas por prioridad
        self.queue_names = {
            TaskPriority.CRITICAL: "tasks:critical",
            TaskPriority.HIGH: "tasks:high",
            TaskPriority.NORMAL: "tasks:normal",
            TaskPriority.LOW: "tasks:low",
        }

        # Dead letter queue
        self.dlq_name = "tasks:dead_letter"

    def register_handler(self, task_type: str, handler: Callable):
        """
        Registrar handler para tipo de tarea.

        Args:
            task_type: Tipo de tarea
            handler: Función async que procesa la tarea
        """
        self.handlers[task_type] = handler

    async def enqueue(
        self,
        task_type: str,
        payload: Dict[str, Any],
        priority: TaskPriority = TaskPriority.NORMAL,
        country: str = None,
        delay_seconds: int = 0,
        max_retries: int = 3
    ) -> str:
        """
        Encolar nueva tarea.

        Args:
            task_type: Tipo de tarea
            payload: Datos de la tarea
            priority: Prioridad
            country: País (para routing)
            delay_seconds: Segundos de delay
            max_retries: Máximo de reintentos

        Returns:
            ID de la tarea creada
        """
        task = Task(
            id=f"task_{uuid.uuid4().hex[:16]}",
            type=task_type,
            payload=payload,
            priority=priority,
            created_at=datetime.utcnow(),
            country=country,
            max_retries=max_retries
        )

        task_data = task.json()

        if delay_seconds > 0:
            # Tarea con delay (scheduled)
            execute_at = datetime.utcnow() + timedelta(seconds=delay_seconds)
            await self.redis.zadd(
                "tasks:scheduled",
                {task_data: execute_at.timestamp()}
            )
        else:
            # Tarea inmediata
            queue_name = self.queue_names[priority]
            await self.redis.lpush(queue_name, task_data)

        # Guardar metadata
        await self.redis.hset(f"task:{task.id}", mapping={
            "data": task_data,
            "status": TaskStatus.PENDING.value
        })

        # TTL de 7 días para metadata
        await self.redis.expire(f"task:{task.id}", 604800)

        return task.id

    async def enqueue_batch(
        self,
        tasks: List[Dict[str, Any]],
        priority: TaskPriority = TaskPriority.NORMAL
    ) -> List[str]:
        """
        Encolar múltiples tareas de una vez.

        Args:
            tasks: Lista de tareas [{type, payload, ...}]
            priority: Prioridad por defecto

        Returns:
            Lista de IDs de tareas creadas
        """
        task_ids = []
        pipe = self.redis.pipeline()

        for task_data in tasks:
            task = Task(
                id=f"task_{uuid.uuid4().hex[:16]}",
                type=task_data["type"],
                payload=task_data.get("payload", {}),
                priority=task_data.get("priority", priority),
                created_at=datetime.utcnow(),
                country=task_data.get("country"),
                max_retries=task_data.get("max_retries", 3)
            )

            task_json = task.json()
            queue_name = self.queue_names[task.priority]

            pipe.lpush(queue_name, task_json)
            pipe.hset(f"task:{task.id}", mapping={
                "data": task_json,
                "status": TaskStatus.PENDING.value
            })
            pipe.expire(f"task:{task.id}", 604800)

            task_ids.append(task.id)

        await pipe.execute()
        return task_ids

    async def dequeue(self, timeout: int = 5) -> Optional[Task]:
        """
        Obtener siguiente tarea (respetando prioridad).

        Args:
            timeout: Timeout en segundos para esperar

        Returns:
            Task si hay disponible, None si no
        """
        # Procesar tareas scheduled primero
        await self._process_scheduled_tasks()

        # Intentar obtener de cada cola en orden de prioridad
        for priority in TaskPriority:
            queue_name = self.queue_names[priority]

            result = await self.redis.brpop(queue_name, timeout=1)

            if result:
                _, task_data = result
                task = Task.parse_raw(task_data)

                # Marcar como procesando
                task.status = TaskStatus.PROCESSING
                task.started_at = datetime.utcnow()

                await self.redis.hset(f"task:{task.id}", mapping={
                    "data": task.json(),
                    "status": TaskStatus.PROCESSING.value
                })

                return task

        return None

    async def _process_scheduled_tasks(self):
        """Mover tareas scheduled que ya deben ejecutarse."""
        now = datetime.utcnow().timestamp()

        # Obtener tareas cuyo tiempo ya pasó
        tasks = await self.redis.zrangebyscore(
            "tasks:scheduled",
            "-inf",
            now,
            start=0,
            num=100
        )

        for task_data in tasks:
            task = Task.parse_raw(task_data)
            queue_name = self.queue_names[task.priority]

            # Mover a cola normal
            await self.redis.lpush(queue_name, task_data)
            await self.redis.zrem("tasks:scheduled", task_data)

    async def complete(self, task: Task, result: Dict[str, Any] = None):
        """
        Marcar tarea como completada.

        Args:
            task: Tarea completada
            result: Resultado opcional
        """
        task.status = TaskStatus.COMPLETED
        task.completed_at = datetime.utcnow()
        task.result = result

        await self.redis.hset(f"task:{task.id}", mapping={
            "data": task.json(),
            "status": TaskStatus.COMPLETED.value
        })

        # Expirar después de 24 horas
        await self.redis.expire(f"task:{task.id}", 86400)

    async def fail(self, task: Task, error: str):
        """
        Marcar tarea como fallida (con reintento si aplica).

        Args:
            task: Tarea fallida
            error: Mensaje de error
        """
        task.retries += 1
        task.error_message = error

        if task.retries < task.max_retries:
            # Reintentar con backoff exponencial
            delay = 2 ** task.retries * 10  # 20s, 40s, 80s, ...
            task.status = TaskStatus.RETRYING

            # Re-encolar con delay
            task.started_at = None
            task_data = task.json()

            execute_at = datetime.utcnow() + timedelta(seconds=delay)
            await self.redis.zadd(
                "tasks:scheduled",
                {task_data: execute_at.timestamp()}
            )

            await self.redis.hset(f"task:{task.id}", mapping={
                "data": task_data,
                "status": TaskStatus.RETRYING.value
            })
        else:
            # Mover a dead letter queue
            task.status = TaskStatus.DEAD
            task.completed_at = datetime.utcnow()

            await self.redis.lpush(self.dlq_name, task.json())

            await self.redis.hset(f"task:{task.id}", mapping={
                "data": task.json(),
                "status": TaskStatus.DEAD.value
            })

    async def get_status(self, task_id: str) -> Optional[Task]:
        """
        Obtener estado de tarea.

        Args:
            task_id: ID de la tarea

        Returns:
            Task si existe, None si no
        """
        data = await self.redis.hget(f"task:{task_id}", "data")
        if data:
            return Task.parse_raw(data)
        return None

    async def get_queue_stats(self) -> Dict[str, Any]:
        """
        Obtener estadísticas de colas.

        Returns:
            Diccionario con estadísticas
        """
        stats = {
            "queues": {},
            "scheduled": await self.redis.zcard("tasks:scheduled"),
            "dead_letter": await self.redis.llen(self.dlq_name)
        }

        for priority, queue_name in self.queue_names.items():
            stats["queues"][priority.name] = await self.redis.llen(queue_name)

        stats["total_pending"] = sum(stats["queues"].values())

        return stats

    async def get_dead_letter_tasks(self, limit: int = 100) -> List[Task]:
        """
        Obtener tareas en dead letter queue.

        Args:
            limit: Límite de tareas

        Returns:
            Lista de tareas muertas
        """
        tasks_data = await self.redis.lrange(self.dlq_name, 0, limit - 1)
        return [Task.parse_raw(data) for data in tasks_data]

    async def retry_dead_letter_task(self, task_id: str) -> bool:
        """
        Reintentar tarea de dead letter queue.

        Args:
            task_id: ID de la tarea

        Returns:
            True si se re-encoló, False si no se encontró
        """
        # Buscar en DLQ
        tasks_data = await self.redis.lrange(self.dlq_name, 0, -1)

        for task_data in tasks_data:
            task = Task.parse_raw(task_data)
            if task.id == task_id:
                # Remover de DLQ
                await self.redis.lrem(self.dlq_name, 1, task_data)

                # Re-encolar
                task.status = TaskStatus.PENDING
                task.retries = 0
                task.error_message = None
                task.started_at = None
                task.completed_at = None

                await self.redis.lpush(
                    self.queue_names[task.priority],
                    task.json()
                )

                return True

        return False


# ═══════════════════════════════════════════
# WORKER
# ═══════════════════════════════════════════

class TaskWorker:
    """
    Worker que procesa tareas de la cola.

    Soporta concurrencia configurable y shutdown graceful.
    """

    def __init__(
        self,
        queue: TaskQueue,
        worker_id: str,
        concurrency: int = 10
    ):
        """
        Inicializar worker.

        Args:
            queue: Cola de tareas
            worker_id: ID único del worker
            concurrency: Número de tareas simultáneas
        """
        self.queue = queue
        self.worker_id = worker_id
        self.concurrency = concurrency
        self.running = False
        self.current_tasks = 0
        self._tasks: List[asyncio.Task] = []

    async def start(self):
        """Iniciar worker."""
        self.running = True

        print(f"🚀 Worker {self.worker_id} iniciado (concurrency={self.concurrency})")

        while self.running:
            if self.current_tasks < self.concurrency:
                task = await self.queue.dequeue(timeout=5)

                if task:
                    task.worker_id = self.worker_id
                    asyncio_task = asyncio.create_task(self._process_task(task))
                    self._tasks.append(asyncio_task)
            else:
                await asyncio.sleep(0.1)

            # Limpiar tareas completadas
            self._tasks = [t for t in self._tasks if not t.done()]

    async def stop(self, graceful: bool = True):
        """
        Detener worker.

        Args:
            graceful: Si True, espera tareas en progreso
        """
        print(f"⏹️ Deteniendo worker {self.worker_id}...")
        self.running = False

        if graceful:
            # Esperar tareas en progreso
            max_wait = 60  # segundos
            waited = 0

            while self.current_tasks > 0 and waited < max_wait:
                await asyncio.sleep(1)
                waited += 1
                print(f"  Esperando {self.current_tasks} tareas...")

            if self.current_tasks > 0:
                print(f"  ⚠️ {self.current_tasks} tareas no completadas")

        print(f"✅ Worker {self.worker_id} detenido")

    async def _process_task(self, task: Task):
        """
        Procesar una tarea.

        Args:
            task: Tarea a procesar
        """
        self.current_tasks += 1
        start_time = datetime.utcnow()

        try:
            handler = self.queue.handlers.get(task.type)

            if not handler:
                raise ValueError(f"No hay handler para tarea tipo: {task.type}")

            # Ejecutar handler
            result = await handler(task.payload)

            # Marcar completada
            await self.queue.complete(task, result)

            duration = (datetime.utcnow() - start_time).total_seconds()
            print(f"✅ Task {task.id} completada ({duration:.2f}s)")

        except Exception as e:
            duration = (datetime.utcnow() - start_time).total_seconds()
            print(f"❌ Task {task.id} falló ({duration:.2f}s): {str(e)}")
            await self.queue.fail(task, str(e))

        finally:
            self.current_tasks -= 1


# ═══════════════════════════════════════════
# DEFINICIÓN DE TAREAS LITPER
# ═══════════════════════════════════════════

async def process_order_task(payload: dict) -> dict:
    """
    Procesar nuevo pedido.

    Args:
        payload: {order_id, customer_id, ...}

    Returns:
        Resultado del procesamiento
    """
    order_id = payload.get("order_id")
    # TODO: Implementar lógica de procesamiento
    return {"order_id": order_id, "status": "processed"}


async def send_notification_task(payload: dict) -> dict:
    """
    Enviar notificación a cliente.

    Args:
        payload: {channel, recipient, template, data}

    Returns:
        Resultado del envío
    """
    # TODO: Implementar lógica de notificación
    return {"sent": True}


async def track_guide_task(payload: dict) -> dict:
    """
    Actualizar tracking de guía.

    Args:
        payload: {guide_number, carrier}

    Returns:
        Resultado de tracking
    """
    # TODO: Implementar lógica de tracking
    return {"updated": True}


async def resolve_incident_task(payload: dict) -> dict:
    """
    Resolver novedad con agente IA.

    Args:
        payload: {incident_id, guide_number, incident_type}

    Returns:
        Resultado de resolución
    """
    # TODO: Implementar lógica de resolución
    return {"resolved": True}


async def make_call_task(payload: dict) -> dict:
    """
    Realizar llamada con voz IA.

    Args:
        payload: {phone, script, context}

    Returns:
        Resultado de la llamada
    """
    # TODO: Implementar lógica de llamadas
    return {"call_completed": True}


async def train_model_task(payload: dict) -> dict:
    """
    Entrenar modelo ML.

    Args:
        payload: {model_type, parameters}

    Returns:
        Métricas del entrenamiento
    """
    # TODO: Implementar lógica de entrenamiento
    return {"trained": True, "accuracy": 0.95}


# ═══════════════════════════════════════════
# FACTORY PARA SETUP
# ═══════════════════════════════════════════

async def setup_task_queue(redis_url: str) -> TaskQueue:
    """
    Configurar cola de tareas con handlers registrados.

    Args:
        redis_url: URL de Redis

    Returns:
        TaskQueue configurada
    """
    queue = TaskQueue(redis_url)

    # Registrar handlers
    queue.register_handler("process_order", process_order_task)
    queue.register_handler("send_notification", send_notification_task)
    queue.register_handler("track_guide", track_guide_task)
    queue.register_handler("resolve_incident", resolve_incident_task)
    queue.register_handler("make_call", make_call_task)
    queue.register_handler("train_model", train_model_task)

    return queue
