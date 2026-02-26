"""
LITPER PRO - Message Delivery Metrics API Routes
Endpoints para métricas de entrega de mensajes (sent/delivered/read rates)
"""

from typing import Optional, List, Dict
from datetime import datetime, timedelta
from enum import Enum

from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel, Field
from loguru import logger


router = APIRouter(prefix="/message-metrics", tags=["Message Delivery Metrics"])


# ==================== ENUMS ====================

class MessageChannel(str, Enum):
    WHATSAPP = "whatsapp"
    SMS = "sms"
    EMAIL = "email"
    PUSH = "push"
    IN_APP = "in_app"


class MessageStatus(str, Enum):
    PENDING = "PENDING"
    SENT = "SENT"
    DELIVERED = "DELIVERED"
    READ = "READ"
    FAILED = "FAILED"


class TimeRange(str, Enum):
    LAST_24H = "24h"
    LAST_7D = "7d"
    LAST_30D = "30d"
    LAST_90D = "90d"


# ==================== MODELS ====================

class MessageRecord(BaseModel):
    """Registro de un mensaje enviado"""
    id: str
    channel: MessageChannel
    recipient: str
    status: MessageStatus
    template_id: Optional[str] = None
    template_name: Optional[str] = None
    batch_id: Optional[str] = None
    created_at: datetime
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    failed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    metadata: Optional[Dict] = None


class TrackMessageRequest(BaseModel):
    """Request para registrar un nuevo mensaje"""
    channel: MessageChannel
    recipient: str = Field(..., min_length=5)
    template_id: Optional[str] = None
    template_name: Optional[str] = None
    batch_id: Optional[str] = None
    metadata: Optional[Dict] = None


class UpdateStatusRequest(BaseModel):
    """Request para actualizar estado de un mensaje"""
    status: MessageStatus
    error_message: Optional[str] = None


class DeliveryMetrics(BaseModel):
    """Métricas de entrega de mensajes"""
    total_messages: int = 0
    sent: int = 0
    delivered: int = 0
    read: int = 0
    failed: int = 0
    pending: int = 0
    sent_rate: float = 0.0
    delivery_rate: float = 0.0
    read_rate: float = 0.0
    failure_rate: float = 0.0
    avg_delivery_time_ms: float = 0.0
    avg_read_time_ms: float = 0.0


class FunnelStage(BaseModel):
    """Etapa del funnel de entrega"""
    stage: str
    count: int
    rate: float
    dropoff: float


class FailureReason(BaseModel):
    """Razón de fallo con estadísticas"""
    reason: str
    count: int
    percentage: float


# ==================== IN-MEMORY STORE ====================
# In production, this would be stored in PostgreSQL

_message_store: List[MessageRecord] = []
_counter = 0


def _generate_id() -> str:
    global _counter
    _counter += 1
    return f"msg_{datetime.now().strftime('%Y%m%d%H%M%S')}_{_counter}"


def _get_date_range(time_range: TimeRange) -> tuple[datetime, datetime]:
    """Calcula el rango de fechas basado en el período"""
    end = datetime.now()
    if time_range == TimeRange.LAST_24H:
        start = end - timedelta(hours=24)
    elif time_range == TimeRange.LAST_7D:
        start = end - timedelta(days=7)
    elif time_range == TimeRange.LAST_30D:
        start = end - timedelta(days=30)
    elif time_range == TimeRange.LAST_90D:
        start = end - timedelta(days=90)
    else:
        start = end - timedelta(days=30)
    return start, end


def _filter_records(
    time_range: TimeRange,
    channel: Optional[MessageChannel] = None
) -> List[MessageRecord]:
    """Filtra registros por rango de tiempo y canal"""
    start, end = _get_date_range(time_range)
    return [
        r for r in _message_store
        if start <= r.created_at <= end
        and (channel is None or r.channel == channel)
    ]


def _calculate_metrics(records: List[MessageRecord]) -> DeliveryMetrics:
    """Calcula métricas de entrega a partir de registros"""
    total = len(records)
    if total == 0:
        return DeliveryMetrics()

    sent = sum(1 for r in records if r.sent_at is not None)
    delivered = sum(1 for r in records if r.delivered_at is not None)
    read = sum(1 for r in records if r.read_at is not None)
    failed = sum(1 for r in records if r.status == MessageStatus.FAILED)
    pending = sum(1 for r in records if r.status == MessageStatus.PENDING)

    # Tiempos promedio
    delivery_times = [
        (r.delivered_at - r.sent_at).total_seconds() * 1000
        for r in records
        if r.sent_at and r.delivered_at
    ]
    avg_delivery = sum(delivery_times) / len(delivery_times) if delivery_times else 0

    read_times = [
        (r.read_at - r.delivered_at).total_seconds() * 1000
        for r in records
        if r.delivered_at and r.read_at
    ]
    avg_read = sum(read_times) / len(read_times) if read_times else 0

    return DeliveryMetrics(
        total_messages=total,
        sent=sent,
        delivered=delivered,
        read=read,
        failed=failed,
        pending=pending,
        sent_rate=round((sent / total) * 100, 1) if total > 0 else 0,
        delivery_rate=round((delivered / sent) * 100, 1) if sent > 0 else 0,
        read_rate=round((read / delivered) * 100, 1) if delivered > 0 else 0,
        failure_rate=round((failed / total) * 100, 1) if total > 0 else 0,
        avg_delivery_time_ms=round(avg_delivery, 1),
        avg_read_time_ms=round(avg_read, 1),
    )


# ==================== ENDPOINTS ====================

@router.post("/track", response_model=MessageRecord)
async def track_message(request: TrackMessageRequest):
    """
    Registra un nuevo mensaje para tracking de métricas.

    - **channel**: Canal de envío (whatsapp, sms, email, push, in_app)
    - **recipient**: Destinatario del mensaje
    - **template_id**: ID de la plantilla utilizada (opcional)
    - **template_name**: Nombre de la plantilla (opcional)
    - **batch_id**: ID del lote de envío (opcional)
    """
    try:
        record = MessageRecord(
            id=_generate_id(),
            channel=request.channel,
            recipient=request.recipient,
            status=MessageStatus.PENDING,
            template_id=request.template_id,
            template_name=request.template_name,
            batch_id=request.batch_id,
            created_at=datetime.now(),
            metadata=request.metadata,
        )
        _message_store.append(record)
        logger.info(f"Message tracked: {record.id} via {record.channel.value}")
        return record

    except Exception as e:
        logger.error(f"Error tracking message: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/track/{message_id}", response_model=MessageRecord)
async def update_message_status(message_id: str, request: UpdateStatusRequest):
    """
    Actualiza el estado de un mensaje registrado.

    - **message_id**: ID del mensaje
    - **status**: Nuevo estado (SENT, DELIVERED, READ, FAILED)
    """
    record = next((r for r in _message_store if r.id == message_id), None)
    if not record:
        raise HTTPException(status_code=404, detail=f"Message {message_id} not found")

    now = datetime.now()
    record.status = request.status

    if request.status == MessageStatus.SENT:
        record.sent_at = now
    elif request.status == MessageStatus.DELIVERED:
        record.delivered_at = now
        if not record.sent_at:
            record.sent_at = now
    elif request.status == MessageStatus.READ:
        record.read_at = now
        if not record.delivered_at:
            record.delivered_at = now
        if not record.sent_at:
            record.sent_at = now
    elif request.status == MessageStatus.FAILED:
        record.failed_at = now
        record.error_message = request.error_message

    logger.info(f"Message {message_id} updated to {request.status.value}")
    return record


@router.get("/overview", response_model=DeliveryMetrics)
async def get_metrics_overview(
    time_range: TimeRange = Query(TimeRange.LAST_30D, description="Período de tiempo"),
    channel: Optional[MessageChannel] = Query(None, description="Filtrar por canal"),
):
    """
    Obtiene las métricas generales de entrega de mensajes.

    Retorna tasas de envío, entrega, lectura y fallo para el período seleccionado.
    """
    records = _filter_records(time_range, channel)
    return _calculate_metrics(records)


@router.get("/by-channel")
async def get_metrics_by_channel(
    time_range: TimeRange = Query(TimeRange.LAST_30D, description="Período de tiempo"),
):
    """
    Obtiene métricas desglosadas por canal de mensajería.

    Compara rendimiento entre WhatsApp, SMS, Email, Push e In-App.
    """
    channels = [MessageChannel.WHATSAPP, MessageChannel.SMS, MessageChannel.EMAIL,
                MessageChannel.PUSH, MessageChannel.IN_APP]

    results = []
    for ch in channels:
        records = _filter_records(time_range, ch)
        if records:
            metrics = _calculate_metrics(records)
            results.append({
                "channel": ch.value,
                **metrics.model_dump(),
            })

    return {"channels": results}


@router.get("/by-template")
async def get_metrics_by_template(
    time_range: TimeRange = Query(TimeRange.LAST_30D, description="Período de tiempo"),
):
    """
    Obtiene métricas desglosadas por plantilla de mensaje.

    Permite identificar qué plantillas tienen mejor rendimiento de entrega/lectura.
    """
    records = _filter_records(time_range)

    template_groups: Dict[str, List[MessageRecord]] = {}
    for r in records:
        key = r.template_id or "sin_plantilla"
        if key not in template_groups:
            template_groups[key] = []
        template_groups[key].append(r)

    results = []
    for template_id, group_records in template_groups.items():
        metrics = _calculate_metrics(group_records)
        results.append({
            "template_id": template_id,
            "template_name": group_records[0].template_name or template_id,
            **metrics.model_dump(),
        })

    results.sort(key=lambda x: x["total_messages"], reverse=True)
    return {"templates": results}


@router.get("/funnel", response_model=List[FunnelStage])
async def get_delivery_funnel(
    time_range: TimeRange = Query(TimeRange.LAST_30D, description="Período de tiempo"),
):
    """
    Obtiene el funnel de entrega de mensajes.

    Muestra la conversión en cada etapa: Creados -> Enviados -> Entregados -> Leídos
    """
    records = _filter_records(time_range)
    total = len(records)

    if total == 0:
        return [
            FunnelStage(stage="Creados", count=0, rate=0, dropoff=0),
            FunnelStage(stage="Enviados", count=0, rate=0, dropoff=0),
            FunnelStage(stage="Entregados", count=0, rate=0, dropoff=0),
            FunnelStage(stage="Leídos", count=0, rate=0, dropoff=0),
        ]

    sent = sum(1 for r in records if r.sent_at)
    delivered = sum(1 for r in records if r.delivered_at)
    read = sum(1 for r in records if r.read_at)

    return [
        FunnelStage(
            stage="Creados",
            count=total,
            rate=100,
            dropoff=0,
        ),
        FunnelStage(
            stage="Enviados",
            count=sent,
            rate=round((sent / total) * 100, 1),
            dropoff=round(((total - sent) / total) * 100, 1),
        ),
        FunnelStage(
            stage="Entregados",
            count=delivered,
            rate=round((delivered / total) * 100, 1),
            dropoff=round(((sent - delivered) / sent) * 100, 1) if sent > 0 else 0,
        ),
        FunnelStage(
            stage="Leídos",
            count=read,
            rate=round((read / total) * 100, 1),
            dropoff=round(((delivered - read) / delivered) * 100, 1) if delivered > 0 else 0,
        ),
    ]


@router.get("/time-series")
async def get_time_series(
    time_range: TimeRange = Query(TimeRange.LAST_30D, description="Período de tiempo"),
    channel: Optional[MessageChannel] = Query(None, description="Filtrar por canal"),
):
    """
    Obtiene datos de serie temporal para graficado.

    Retorna conteos de enviados, entregados, leídos y fallidos agrupados por período.
    """
    records = _filter_records(time_range, channel)
    start, end = _get_date_range(time_range)

    duration = end - start
    duration_days = duration.total_seconds() / 86400

    # Determine bucket size
    if duration_days <= 1:
        bucket_delta = timedelta(hours=1)
        date_format = "%H:%M"
    elif duration_days <= 7:
        bucket_delta = timedelta(days=1)
        date_format = "%a %d"
    else:
        bucket_delta = timedelta(days=1)
        date_format = "%d %b"

    points = []
    current = start

    while current <= end:
        bucket_end = current + bucket_delta
        bucket_records = [
            r for r in records
            if current <= r.created_at < bucket_end
        ]

        points.append({
            "timestamp": current.strftime(date_format),
            "sent": sum(1 for r in bucket_records if r.sent_at),
            "delivered": sum(1 for r in bucket_records if r.delivered_at),
            "read": sum(1 for r in bucket_records if r.read_at),
            "failed": sum(1 for r in bucket_records if r.status == MessageStatus.FAILED),
        })

        current = bucket_end

    return {"time_series": points}


@router.get("/failure-reasons", response_model=List[FailureReason])
async def get_failure_reasons(
    time_range: TimeRange = Query(TimeRange.LAST_30D, description="Período de tiempo"),
    limit: int = Query(5, ge=1, le=20, description="Número máximo de razones"),
):
    """
    Obtiene las principales razones de fallo en envío de mensajes.

    Útil para identificar y corregir problemas recurrentes.
    """
    records = _filter_records(time_range)
    failed = [r for r in records if r.status == MessageStatus.FAILED]

    if not failed:
        return []

    reason_counts: Dict[str, int] = {}
    for r in failed:
        reason = r.error_message or "Error desconocido"
        reason_counts[reason] = reason_counts.get(reason, 0) + 1

    total_failed = len(failed)
    results = [
        FailureReason(
            reason=reason,
            count=count,
            percentage=round((count / total_failed) * 100, 1),
        )
        for reason, count in reason_counts.items()
    ]

    results.sort(key=lambda x: x.count, reverse=True)
    return results[:limit]


@router.get("/summary")
async def get_full_summary(
    time_range: TimeRange = Query(TimeRange.LAST_30D, description="Período de tiempo"),
):
    """
    Obtiene un resumen completo de métricas de entrega de mensajes.

    Incluye métricas generales, por canal, funnel, serie temporal,
    razones de fallo y comparación con el período anterior.
    """
    records = _filter_records(time_range)
    current_metrics = _calculate_metrics(records)

    # Previous period comparison
    start, end = _get_date_range(time_range)
    period_duration = end - start
    prev_start = start - period_duration
    prev_records = [
        r for r in _message_store
        if prev_start <= r.created_at < start
    ]
    previous_metrics = _calculate_metrics(prev_records)

    # Channel breakdown
    channels_data = []
    for ch in MessageChannel:
        ch_records = [r for r in records if r.channel == ch]
        if ch_records:
            channels_data.append({
                "channel": ch.value,
                **_calculate_metrics(ch_records).model_dump(),
            })

    return {
        "overall": current_metrics.model_dump(),
        "by_channel": channels_data,
        "period_comparison": {
            "current": current_metrics.model_dump(),
            "previous": previous_metrics.model_dump(),
            "changes": {
                "sent_rate": round(current_metrics.sent_rate - previous_metrics.sent_rate, 1),
                "delivery_rate": round(current_metrics.delivery_rate - previous_metrics.delivery_rate, 1),
                "read_rate": round(current_metrics.read_rate - previous_metrics.read_rate, 1),
                "failure_rate": round(current_metrics.failure_rate - previous_metrics.failure_rate, 1),
            },
        },
    }


@router.post("/seed-demo")
async def seed_demo_data(count: int = Query(200, ge=10, le=2000)):
    """
    Genera datos de demostración para métricas de mensajes.

    Útil para testing y demostración del dashboard.
    """
    import random

    channels = list(MessageChannel)
    templates = [
        ("reclamo_oficina", "Reclamo en Oficina"),
        ("no_estaba", "No Estaba - Reagendar"),
        ("confirmar_entrega", "Confirmar Entrega"),
        ("agradecimiento", "Agradecimiento"),
        ("direccion_errada", "Dirección Errada"),
    ]
    errors = [
        "Número no válido",
        "Sin conexión a WhatsApp",
        "Límite de envío alcanzado",
        "Número bloqueado",
        "Timeout de conexión",
    ]

    now = datetime.now()
    thirty_days = timedelta(days=30)

    for _ in range(count):
        channel = random.choice(channels)
        template_id, template_name = random.choice(templates)
        created_at = now - timedelta(seconds=random.random() * thirty_days.total_seconds())

        record = MessageRecord(
            id=_generate_id(),
            channel=channel,
            recipient=f"+5730{random.randint(10000000, 99999999)}",
            status=MessageStatus.PENDING,
            template_id=template_id,
            template_name=template_name,
            created_at=created_at,
        )

        # Simulate status progression
        rand = random.random()
        if rand < 0.08:
            record.status = MessageStatus.FAILED
            record.failed_at = created_at + timedelta(seconds=random.random() * 5)
            record.error_message = random.choice(errors)
        elif rand < 0.12:
            record.status = MessageStatus.PENDING
        else:
            record.sent_at = created_at + timedelta(seconds=random.random() * 3)
            if rand < 0.20:
                record.status = MessageStatus.SENT
            else:
                record.delivered_at = record.sent_at + timedelta(seconds=random.random() * 60)
                if rand < 0.45:
                    record.status = MessageStatus.DELIVERED
                else:
                    record.read_at = record.delivered_at + timedelta(seconds=random.random() * 3600)
                    record.status = MessageStatus.READ

        _message_store.append(record)

    logger.info(f"Seeded {count} demo message records")
    return {
        "success": True,
        "records_created": count,
        "total_records": len(_message_store),
    }


@router.delete("/clear")
async def clear_data():
    """
    Elimina todos los datos de métricas de mensajes.
    """
    global _message_store
    count = len(_message_store)
    _message_store = []
    logger.info(f"Cleared {count} message records")
    return {"success": True, "records_cleared": count}
