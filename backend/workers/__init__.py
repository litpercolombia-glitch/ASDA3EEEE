"""
Sistema de Workers y Colas para Litper
======================================

Este paquete contiene:
- TaskQueue: Sistema de colas distribuidas con Redis
- TaskWorker: Workers para procesar tareas
- Tareas predefinidas para Litper

Uso:
    from workers.task_queue import TaskQueue, TaskWorker, TaskPriority

    # Encolar tarea
    task_id = await queue.enqueue(
        task_type="process_order",
        payload={"order_id": "123"},
        priority=TaskPriority.HIGH
    )

    # Iniciar worker
    worker = TaskWorker(queue, worker_id="worker-1")
    await worker.start()
"""

from .task_queue import (
    TaskPriority,
    TaskStatus,
    Task,
    TaskQueue,
    TaskWorker,
)

__all__ = [
    "TaskPriority",
    "TaskStatus",
    "Task",
    "TaskQueue",
    "TaskWorker",
]
