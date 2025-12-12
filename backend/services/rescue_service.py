"""
LITPER - Sistema de Rescate de Guías
Gestión automatizada de guías con novedades para maximizar entregas
"""

import os
import asyncio
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field
from enum import Enum
from loguru import logger

from .tracking_service import TrackingService, TrackingStatus, tracking_service
from .whatsapp_service import WhatsAppService, whatsapp_service


class RescuePriority(str, Enum):
    """Prioridades de rescate"""
    CRITICAL = "CRITICAL"   # > 5 días sin movimiento
    HIGH = "HIGH"           # 3-5 días sin movimiento
    MEDIUM = "MEDIUM"       # 1-3 días con novedad
    LOW = "LOW"             # Novedad reciente


class NoveltyType(str, Enum):
    """Tipos de novedad"""
    NO_ESTABA = "NO_ESTABA"
    DIRECCION_ERRADA = "DIRECCION_ERRADA"
    TELEFONO_ERRADO = "TELEFONO_ERRADO"
    RECHAZADO = "RECHAZADO"
    ZONA_DIFICIL = "ZONA_DIFICIL"
    PAGO_CONTRAENTREGA = "PAGO_CONTRAENTREGA"
    CERRADO = "CERRADO"
    DANO_MERCANCIA = "DANO_MERCANCIA"
    OTRO = "OTRO"


class RescueStatus(str, Enum):
    """Estados de rescate"""
    PENDING = "PENDING"               # Pendiente de acción
    WHATSAPP_SENT = "WHATSAPP_SENT"   # WhatsApp enviado
    CALL_PENDING = "CALL_PENDING"     # Pendiente de llamada
    CALL_COMPLETED = "CALL_COMPLETED" # Llamada realizada
    RESCHEDULED = "RESCHEDULED"       # Re-agendado
    RECOVERED = "RECOVERED"           # Recuperado exitosamente
    LOST = "LOST"                     # Perdido (devuelto)
    CANCELLED = "CANCELLED"           # Cancelado


@dataclass
class RescueItem:
    """Item en la cola de rescate"""
    id: str
    tracking_number: str
    carrier: str
    customer_name: str
    customer_phone: str
    destination_city: str
    address: str = ""
    novelty_type: NoveltyType = NoveltyType.OTRO
    novelty_description: str = ""
    days_without_movement: int = 0
    priority: RescuePriority = RescuePriority.MEDIUM
    status: RescueStatus = RescueStatus.PENDING
    recovery_probability: float = 0.5
    attempts: int = 0
    max_attempts: int = 3
    last_contact_at: Optional[datetime] = None
    next_action_at: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.now)
    notes: List[str] = field(default_factory=list)
    whatsapp_sent: bool = False
    call_made: bool = False


@dataclass
class RescueStats:
    """Estadísticas del sistema de rescate"""
    total_in_queue: int = 0
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0
    recovered_today: int = 0
    recovered_week: int = 0
    lost_today: int = 0
    recovery_rate: float = 0.0
    avg_recovery_time_hours: float = 0.0


# Probabilidades de recuperación por tipo de novedad
RECOVERY_RATES = {
    NoveltyType.NO_ESTABA: 0.80,
    NoveltyType.DIRECCION_ERRADA: 0.90,
    NoveltyType.TELEFONO_ERRADO: 0.70,
    NoveltyType.RECHAZADO: 0.30,
    NoveltyType.ZONA_DIFICIL: 0.60,
    NoveltyType.PAGO_CONTRAENTREGA: 0.75,
    NoveltyType.CERRADO: 0.85,
    NoveltyType.DANO_MERCANCIA: 0.20,
    NoveltyType.OTRO: 0.50,
}

# Scripts de llamada por tipo de novedad
CALL_SCRIPTS = {
    NoveltyType.NO_ESTABA: """
Hola, buenos días/tardes. Le llamo de [EMPRESA] respecto a su pedido con guía {guia}.

Intentamos entregárselo pero no lo encontramos en la dirección. ¿Cuándo podría estar disponible para recibirlo?

[Si responde horario]: Perfecto, reprogramaremos la entrega para {horario}. ¿La dirección {direccion} es correcta?

[Si solicita cambio]: Entendido, ¿cuál sería la nueva dirección?

Muchas gracias por su tiempo. Que tenga un excelente día.
""",

    NoveltyType.DIRECCION_ERRADA: """
Hola, buenos días/tardes. Le llamo de [EMPRESA] respecto a su pedido con guía {guia}.

El repartidor no pudo ubicar la dirección registrada. ¿Podría confirmarme la dirección completa con referencias?

[Tomar nota]: Perfecto, la dirección correcta es: {nueva_direccion}

¿Hay algún punto de referencia adicional que nos ayude a ubicarlo?

Excelente, reprogramaremos la entrega. Muchas gracias.
""",

    NoveltyType.PAGO_CONTRAENTREGA: """
Hola, buenos días/tardes. Le llamo de [EMPRESA] respecto a su pedido con guía {guia}.

Vemos que el pedido tiene pago contraentrega por ${valor}. ¿Tiene disponibilidad para recibirlo?

[Si tiene el dinero]: Perfecto, ¿cuándo le programamos la entrega?

[Si no tiene]: Entiendo. ¿En qué fecha tendría disponibilidad del dinero?

Quedamos atentos. Que tenga un buen día.
""",

    NoveltyType.RECHAZADO: """
Hola, buenos días/tardes. Le llamo de [EMPRESA] respecto a su pedido con guía {guia}.

Vemos que el pedido fue rechazado al momento de la entrega. ¿Hubo algún inconveniente?

[Escuchar motivo]: Entiendo. ¿Hay algo que podamos hacer para resolverlo?

[Si acepta]: Excelente, reprogramamos la entrega.
[Si no acepta]: Entendido, procederemos con la devolución.

Gracias por su tiempo.
""",
}


class RescueService:
    """
    Servicio de Sistema de Rescate
    Gestiona la cola de guías con novedades y automatiza el proceso de recuperación
    """

    def __init__(
        self,
        tracking_service: TrackingService = None,
        whatsapp_service: WhatsAppService = None
    ):
        self.tracking = tracking_service or tracking_service
        self.whatsapp = whatsapp_service or whatsapp_service
        self.queue: Dict[str, RescueItem] = {}
        self.history: List[RescueItem] = []
        self._running = False

    def add_to_queue(
        self,
        tracking_number: str,
        carrier: str,
        customer_name: str,
        customer_phone: str,
        destination_city: str,
        address: str = "",
        novelty_type: str = "OTRO",
        novelty_description: str = "",
        days_without_movement: int = 0
    ) -> RescueItem:
        """
        Añade una guía a la cola de rescate

        Args:
            tracking_number: Número de guía
            carrier: Transportadora
            customer_name: Nombre del cliente
            customer_phone: Teléfono del cliente
            destination_city: Ciudad destino
            address: Dirección
            novelty_type: Tipo de novedad
            novelty_description: Descripción de la novedad
            days_without_movement: Días sin movimiento
        """
        # Determinar tipo de novedad
        try:
            nov_type = NoveltyType[novelty_type.upper().replace(' ', '_')]
        except KeyError:
            nov_type = self._detect_novelty_type(novelty_description)

        # Calcular prioridad
        priority = self._calculate_priority(days_without_movement, nov_type)

        # Calcular probabilidad de recuperación
        recovery_prob = self._calculate_recovery_probability(
            nov_type, days_without_movement, 0
        )

        item = RescueItem(
            id=f"RSC-{tracking_number}-{datetime.now().strftime('%H%M%S')}",
            tracking_number=tracking_number,
            carrier=carrier,
            customer_name=customer_name,
            customer_phone=customer_phone,
            destination_city=destination_city,
            address=address,
            novelty_type=nov_type,
            novelty_description=novelty_description,
            days_without_movement=days_without_movement,
            priority=priority,
            recovery_probability=recovery_prob,
            next_action_at=datetime.now() + timedelta(hours=1)
        )

        self.queue[tracking_number] = item
        logger.info(f"Guía {tracking_number} añadida a rescate - Prioridad: {priority.value}")

        return item

    def add_bulk_to_queue(self, guides: List[Dict]) -> List[RescueItem]:
        """Añade múltiples guías a la cola"""
        items = []
        for guide in guides:
            item = self.add_to_queue(**guide)
            items.append(item)
        return items

    def _detect_novelty_type(self, description: str) -> NoveltyType:
        """Detecta el tipo de novedad basándose en la descripción"""
        desc_lower = description.lower()

        if any(x in desc_lower for x in ['no estaba', 'ausente', 'no encontr']):
            return NoveltyType.NO_ESTABA
        elif any(x in desc_lower for x in ['direccion', 'dirección', 'ubicar']):
            return NoveltyType.DIRECCION_ERRADA
        elif any(x in desc_lower for x in ['telefono', 'teléfono', 'contactar']):
            return NoveltyType.TELEFONO_ERRADO
        elif any(x in desc_lower for x in ['rechaz', 'no recibe', 'no acepta']):
            return NoveltyType.RECHAZADO
        elif any(x in desc_lower for x in ['zona', 'dificil', 'acceso']):
            return NoveltyType.ZONA_DIFICIL
        elif any(x in desc_lower for x in ['pago', 'contraentrega', 'efectivo']):
            return NoveltyType.PAGO_CONTRAENTREGA
        elif any(x in desc_lower for x in ['cerrado', 'horario']):
            return NoveltyType.CERRADO
        elif any(x in desc_lower for x in ['dañ', 'roto', 'avería']):
            return NoveltyType.DANO_MERCANCIA

        return NoveltyType.OTRO

    def _calculate_priority(
        self,
        days_without_movement: int,
        novelty_type: NoveltyType
    ) -> RescuePriority:
        """Calcula la prioridad de rescate"""
        if days_without_movement > 5:
            return RescuePriority.CRITICAL
        elif days_without_movement > 3:
            return RescuePriority.HIGH
        elif days_without_movement > 1:
            return RescuePriority.MEDIUM
        else:
            return RescuePriority.LOW

    def _calculate_recovery_probability(
        self,
        novelty_type: NoveltyType,
        days_without_movement: int,
        attempts: int
    ) -> float:
        """Calcula la probabilidad de recuperación"""
        base_rate = RECOVERY_RATES.get(novelty_type, 0.5)

        # Reducir por días sin movimiento (5% por día después del 3ro)
        if days_without_movement > 3:
            base_rate *= (1 - 0.05 * (days_without_movement - 3))

        # Reducir por intentos previos (10% por intento)
        base_rate *= (1 - 0.10 * attempts)

        return max(0.05, min(0.95, base_rate))

    def get_queue(
        self,
        priority: Optional[RescuePriority] = None,
        status: Optional[RescueStatus] = None,
        limit: int = 100
    ) -> List[RescueItem]:
        """
        Obtiene la cola de rescate filtrada

        Args:
            priority: Filtrar por prioridad
            status: Filtrar por estado
            limit: Límite de resultados
        """
        items = list(self.queue.values())

        if priority:
            items = [i for i in items if i.priority == priority]

        if status:
            items = [i for i in items if i.status == status]

        # Ordenar por prioridad y probabilidad
        priority_order = {
            RescuePriority.CRITICAL: 0,
            RescuePriority.HIGH: 1,
            RescuePriority.MEDIUM: 2,
            RescuePriority.LOW: 3
        }

        items.sort(key=lambda x: (
            priority_order.get(x.priority, 99),
            -x.recovery_probability,
            -x.days_without_movement
        ))

        return items[:limit]

    def get_item(self, tracking_number: str) -> Optional[RescueItem]:
        """Obtiene un item específico de la cola"""
        return self.queue.get(tracking_number)

    async def send_whatsapp(self, tracking_number: str) -> Dict:
        """Envía WhatsApp de rescate a una guía"""
        item = self.queue.get(tracking_number)
        if not item:
            return {"success": False, "error": "Guía no encontrada en cola"}

        if not item.customer_phone:
            return {"success": False, "error": "Sin teléfono de contacto"}

        result = await self.whatsapp.send_rescue_contact(
            phone=item.customer_phone,
            nombre=item.customer_name,
            guia=item.tracking_number
        )

        if result.success:
            item.whatsapp_sent = True
            item.status = RescueStatus.WHATSAPP_SENT
            item.last_contact_at = datetime.now()
            item.attempts += 1
            item.notes.append(f"WhatsApp enviado: {datetime.now().isoformat()}")

        return {
            "success": result.success,
            "message_id": result.message_id,
            "error": result.error_message
        }

    async def send_bulk_whatsapp(
        self,
        priority: Optional[RescuePriority] = None
    ) -> Dict:
        """Envía WhatsApp masivo a guías en cola"""
        items = self.get_queue(priority=priority, status=RescueStatus.PENDING)

        results = {"sent": 0, "failed": 0, "errors": []}

        for item in items:
            if item.customer_phone:
                result = await self.send_whatsapp(item.tracking_number)
                if result.get("success"):
                    results["sent"] += 1
                else:
                    results["failed"] += 1
                    results["errors"].append({
                        "guia": item.tracking_number,
                        "error": result.get("error")
                    })

                # Pequeña pausa
                await asyncio.sleep(0.2)

        return results

    def get_call_script(self, tracking_number: str) -> Dict:
        """Obtiene el script de llamada para una guía"""
        item = self.queue.get(tracking_number)
        if not item:
            return {"error": "Guía no encontrada"}

        template = CALL_SCRIPTS.get(
            item.novelty_type,
            CALL_SCRIPTS.get(NoveltyType.NO_ESTABA)
        )

        script = template.format(
            guia=item.tracking_number,
            direccion=item.address,
            nombre=item.customer_name,
            nueva_direccion="[PREGUNTAR]",
            horario="[PREGUNTAR]",
            valor="[VERIFICAR]"
        )

        return {
            "tracking_number": item.tracking_number,
            "customer_name": item.customer_name,
            "phone": item.customer_phone,
            "novelty_type": item.novelty_type.value,
            "script": script,
            "tips": self._get_call_tips(item.novelty_type)
        }

    def _get_call_tips(self, novelty_type: NoveltyType) -> List[str]:
        """Obtiene tips para la llamada según el tipo de novedad"""
        tips = {
            NoveltyType.NO_ESTABA: [
                "Preguntar horario disponible específico",
                "Confirmar si hay alguien más que pueda recibir",
                "Ofrecer punto de entrega alternativo"
            ],
            NoveltyType.DIRECCION_ERRADA: [
                "Tomar dirección completa con referencias",
                "Pedir punto de referencia cercano",
                "Confirmar barrio y comuna"
            ],
            NoveltyType.RECHAZADO: [
                "Escuchar atentamente el motivo",
                "No presionar si el cliente insiste",
                "Ofrecer cambio o devolución si aplica"
            ],
            NoveltyType.PAGO_CONTRAENTREGA: [
                "Confirmar el valor exacto",
                "Preguntar fecha de disponibilidad del dinero",
                "Informar que puede ser en efectivo"
            ]
        }
        return tips.get(novelty_type, ["Escuchar al cliente", "Tomar nota de la solución"])

    def mark_call_completed(
        self,
        tracking_number: str,
        result: str,
        notes: str = ""
    ) -> Dict:
        """Marca una llamada como completada"""
        item = self.queue.get(tracking_number)
        if not item:
            return {"success": False, "error": "Guía no encontrada"}

        item.call_made = True
        item.status = RescueStatus.CALL_COMPLETED
        item.last_contact_at = datetime.now()
        item.attempts += 1
        item.notes.append(f"Llamada: {result} - {notes} ({datetime.now().isoformat()})")

        # Actualizar probabilidad
        item.recovery_probability = self._calculate_recovery_probability(
            item.novelty_type,
            item.days_without_movement,
            item.attempts
        )

        return {"success": True, "item": item}

    def mark_recovered(self, tracking_number: str, notes: str = "") -> Dict:
        """Marca una guía como recuperada"""
        item = self.queue.get(tracking_number)
        if not item:
            return {"success": False, "error": "Guía no encontrada"}

        item.status = RescueStatus.RECOVERED
        item.notes.append(f"RECUPERADA: {notes} ({datetime.now().isoformat()})")

        # Mover a historial
        self.history.append(item)
        del self.queue[tracking_number]

        return {"success": True, "message": "Guía marcada como recuperada"}

    def mark_lost(self, tracking_number: str, reason: str = "") -> Dict:
        """Marca una guía como perdida"""
        item = self.queue.get(tracking_number)
        if not item:
            return {"success": False, "error": "Guía no encontrada"}

        item.status = RescueStatus.LOST
        item.notes.append(f"PERDIDA: {reason} ({datetime.now().isoformat()})")

        self.history.append(item)
        del self.queue[tracking_number]

        return {"success": True, "message": "Guía marcada como perdida"}

    def reschedule(
        self,
        tracking_number: str,
        next_action_at: datetime,
        notes: str = ""
    ) -> Dict:
        """Reagenda una acción de rescate"""
        item = self.queue.get(tracking_number)
        if not item:
            return {"success": False, "error": "Guía no encontrada"}

        item.status = RescueStatus.RESCHEDULED
        item.next_action_at = next_action_at
        item.notes.append(f"Reagendado para {next_action_at}: {notes}")

        return {"success": True, "next_action": next_action_at.isoformat()}

    def get_stats(self) -> RescueStats:
        """Obtiene estadísticas del sistema de rescate"""
        items = list(self.queue.values())

        today = datetime.now().date()
        week_ago = today - timedelta(days=7)

        recovered_today = sum(
            1 for h in self.history
            if h.status == RescueStatus.RECOVERED
            and h.created_at.date() == today
        )

        recovered_week = sum(
            1 for h in self.history
            if h.status == RescueStatus.RECOVERED
            and h.created_at.date() >= week_ago
        )

        lost_today = sum(
            1 for h in self.history
            if h.status == RescueStatus.LOST
            and h.created_at.date() == today
        )

        total_history = len(self.history)
        total_recovered = sum(
            1 for h in self.history
            if h.status == RescueStatus.RECOVERED
        )

        return RescueStats(
            total_in_queue=len(items),
            critical=sum(1 for i in items if i.priority == RescuePriority.CRITICAL),
            high=sum(1 for i in items if i.priority == RescuePriority.HIGH),
            medium=sum(1 for i in items if i.priority == RescuePriority.MEDIUM),
            low=sum(1 for i in items if i.priority == RescuePriority.LOW),
            recovered_today=recovered_today,
            recovered_week=recovered_week,
            lost_today=lost_today,
            recovery_rate=round(total_recovered / total_history * 100, 1) if total_history > 0 else 0
        )

    def export_queue_csv(self) -> str:
        """Exporta la cola a formato CSV"""
        import csv
        import io

        output = io.StringIO()
        writer = csv.writer(output)

        # Header
        writer.writerow([
            'Guia', 'Transportadora', 'Cliente', 'Telefono', 'Ciudad',
            'Tipo Novedad', 'Descripcion', 'Dias Sin Mov', 'Prioridad',
            'Probabilidad', 'Estado', 'Intentos'
        ])

        for item in self.queue.values():
            writer.writerow([
                item.tracking_number,
                item.carrier,
                item.customer_name,
                item.customer_phone,
                item.destination_city,
                item.novelty_type.value,
                item.novelty_description,
                item.days_without_movement,
                item.priority.value,
                f"{item.recovery_probability:.0%}",
                item.status.value,
                item.attempts
            ])

        return output.getvalue()


# Singleton
rescue_service = RescueService()
