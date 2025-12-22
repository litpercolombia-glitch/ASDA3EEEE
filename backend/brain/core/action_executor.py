"""
Ejecutor de acciones del cerebro autónomo.
Ejecuta las acciones decididas por Claude a través de las tools.
"""

from typing import Dict, Any, Callable, Optional
from datetime import datetime
import asyncio
import logging
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class ActionResult:
    """Resultado de una acción ejecutada"""
    tool: str
    success: bool
    result: Any
    error: Optional[str] = None
    execution_time_ms: float = 0
    timestamp: datetime = field(default_factory=datetime.now)


class ActionExecutor:
    """
    Ejecuta acciones del cerebro autónomo.
    Cada tool tiene su handler correspondiente.
    """

    def __init__(self):
        """Inicializa el ejecutor con handlers por defecto."""
        self.handlers: Dict[str, Callable] = {}
        self.pending_actions: asyncio.Queue = asyncio.Queue()
        self.action_history: list = []
        self.max_history = 1000

        # Estadísticas
        self.stats = {
            'total_executed': 0,
            'successful': 0,
            'failed': 0,
            'avg_execution_time_ms': 0
        }

        # Registrar handlers por defecto
        self._register_default_handlers()

        logger.info("⚡ Ejecutor de acciones inicializado")

    def _register_default_handlers(self):
        """Registra handlers por defecto para las tools."""

        # WhatsApp
        @self.register("send_whatsapp")
        async def send_whatsapp(params: Dict) -> Dict:
            """Envía mensaje de WhatsApp."""
            phone = params.get('phone')
            message = params.get('message')
            template = params.get('template', 'custom')

            logger.info(f"📱 WhatsApp a {phone}: {message[:50]}...")

            # Aquí iría la integración real con WhatsApp API
            # Por ahora simulamos
            return {
                'sent': True,
                'phone': phone,
                'message_preview': message[:100],
                'template': template,
                'timestamp': datetime.now().isoformat()
            }

        # Actualizar estado de envío
        @self.register("update_shipment_status")
        async def update_shipment_status(params: Dict) -> Dict:
            """Actualiza estado de envío en DB."""
            guide = params.get('guide_number')
            status = params.get('new_status')
            notes = params.get('notes', '')

            logger.info(f"📦 Actualizando guía {guide} a {status}")

            # Aquí iría la actualización real en DB
            return {
                'updated': True,
                'guide': guide,
                'new_status': status,
                'notes': notes,
                'timestamp': datetime.now().isoformat()
            }

        # Crear alerta
        @self.register("create_alert")
        async def create_alert(params: Dict) -> Dict:
            """Crea una alerta en el sistema."""
            alert_type = params.get('type')
            title = params.get('title')
            priority = params.get('priority', 3)

            logger.info(f"🚨 Alerta creada: [{alert_type}] {title} (P{priority})")

            return {
                'created': True,
                'alert_id': f"alert_{datetime.now().strftime('%Y%m%d%H%M%S')}",
                'type': alert_type,
                'title': title,
                'priority': priority,
                'timestamp': datetime.now().isoformat()
            }

        # Programar acción
        @self.register("schedule_action")
        async def schedule_action(params: Dict) -> Dict:
            """Programa una acción futura."""
            action_type = params.get('action_type')
            execute_at = params.get('execute_at')

            logger.info(f"⏰ Acción programada: {action_type} para {execute_at}")

            return {
                'scheduled': True,
                'action_id': f"sched_{datetime.now().strftime('%Y%m%d%H%M%S')}",
                'action_type': action_type,
                'execute_at': execute_at,
                'timestamp': datetime.now().isoformat()
            }

        # Consultar base de datos
        @self.register("query_database")
        async def query_database(params: Dict) -> Dict:
            """Consulta la base de datos."""
            query_type = params.get('query_type')
            filters = params.get('filters', {})
            limit = params.get('limit', 10)

            logger.info(f"🔍 Consulta DB: {query_type} con filtros {filters}")

            # Aquí iría la consulta real
            return {
                'query_type': query_type,
                'filters': filters,
                'results': [],  # Resultados de la consulta
                'count': 0,
                'timestamp': datetime.now().isoformat()
            }

        # Trigger ML
        @self.register("trigger_ml_prediction")
        async def trigger_ml_prediction(params: Dict) -> Dict:
            """Ejecuta predicción ML."""
            model = params.get('model')
            input_data = params.get('input_data', {})

            logger.info(f"🤖 Predicción ML: modelo {model}")

            # Aquí iría la llamada real al modelo ML
            return {
                'model': model,
                'prediction': None,  # Resultado de la predicción
                'confidence': 0.0,
                'timestamp': datetime.now().isoformat()
            }

        # Escalar a humano
        @self.register("escalate_to_human")
        async def escalate_to_human(params: Dict) -> Dict:
            """Escala caso a operador humano."""
            reason = params.get('reason')
            priority = params.get('priority')

            logger.info(f"👤 Escalación a humano: {reason} (prioridad: {priority})")

            return {
                'escalated': True,
                'ticket_id': f"ticket_{datetime.now().strftime('%Y%m%d%H%M%S')}",
                'reason': reason,
                'priority': priority,
                'assigned_to': None,  # Se asignaría automáticamente
                'timestamp': datetime.now().isoformat()
            }

        # Generar reporte
        @self.register("generate_report")
        async def generate_report(params: Dict) -> Dict:
            """Genera un reporte automático."""
            report_type = params.get('report_type')
            format_type = params.get('format', 'json')

            logger.info(f"📊 Generando reporte: {report_type} ({format_type})")

            return {
                'generated': True,
                'report_id': f"report_{datetime.now().strftime('%Y%m%d%H%M%S')}",
                'report_type': report_type,
                'format': format_type,
                'url': None,  # URL del reporte generado
                'timestamp': datetime.now().isoformat()
            }

        # Actualizar perfil de cliente
        @self.register("update_customer_profile")
        async def update_customer_profile(params: Dict) -> Dict:
            """Actualiza perfil de cliente."""
            customer_id = params.get('customer_id')
            updates = params.get('updates', {})

            logger.info(f"👤 Actualizando cliente {customer_id}")

            return {
                'updated': True,
                'customer_id': customer_id,
                'fields_updated': list(updates.keys()),
                'timestamp': datetime.now().isoformat()
            }

        # Registrar aprendizaje
        @self.register("log_learning")
        async def log_learning(params: Dict) -> Dict:
            """Registra un aprendizaje."""
            category = params.get('category')
            description = params.get('description')

            logger.info(f"🎓 Aprendizaje registrado: [{category}] {description[:50]}...")

            return {
                'logged': True,
                'learning_id': f"learn_{datetime.now().strftime('%Y%m%d%H%M%S')}",
                'category': category,
                'timestamp': datetime.now().isoformat()
            }

        # Optimizar ruta
        @self.register("optimize_route")
        async def optimize_route(params: Dict) -> Dict:
            """Optimiza ruta de entrega."""
            origin = params.get('origin')
            destinations = params.get('destinations', [])

            logger.info(f"🗺️ Optimizando ruta: {origin} -> {len(destinations)} destinos")

            return {
                'optimized': True,
                'origin': origin,
                'optimized_route': destinations,  # Aquí iría la ruta optimizada
                'total_distance_km': 0,
                'estimated_time_hours': 0,
                'timestamp': datetime.now().isoformat()
            }

        # Seleccionar transportadora
        @self.register("select_carrier")
        async def select_carrier(params: Dict) -> Dict:
            """Selecciona mejor transportadora."""
            destination = params.get('destination_city')
            priority = params.get('priority', 'standard')

            logger.info(f"🚚 Seleccionando carrier para {destination} ({priority})")

            return {
                'selected': True,
                'carrier': 'Coordinadora',  # Carrier seleccionado
                'destination': destination,
                'estimated_days': 3,
                'cost': 0,
                'reasoning': 'Mejor historial para esta ruta',
                'timestamp': datetime.now().isoformat()
            }

        # Predecir tiempo de entrega
        @self.register("predict_delivery_time")
        async def predict_delivery_time(params: Dict) -> Dict:
            """Predice tiempo de entrega."""
            carrier = params.get('carrier')
            destination = params.get('destination')

            logger.info(f"⏱️ Prediciendo entrega: {carrier} -> {destination}")

            return {
                'predicted': True,
                'carrier': carrier,
                'destination': destination,
                'estimated_days': 3,
                'confidence': 85,
                'timestamp': datetime.now().isoformat()
            }

    def register(self, tool_name: str):
        """
        Decorador para registrar un handler de tool.

        Usage:
            @executor.register("my_tool")
            async def my_handler(params: Dict) -> Dict:
                ...
        """
        def decorator(func: Callable):
            self.handlers[tool_name] = func
            logger.debug(f"Handler registrado: {tool_name}")
            return func
        return decorator

    async def execute(self,
                      tool_name: str,
                      params: Dict[str, Any]) -> ActionResult:
        """
        Ejecuta una acción.

        Args:
            tool_name: Nombre de la tool a ejecutar
            params: Parámetros para la tool

        Returns:
            Resultado de la acción
        """
        start_time = datetime.now()
        self.stats['total_executed'] += 1

        # Verificar que existe el handler
        if tool_name not in self.handlers:
            logger.warning(f"⚠️ Handler no encontrado: {tool_name}")
            result = ActionResult(
                tool=tool_name,
                success=False,
                result=None,
                error=f"Handler not found: {tool_name}"
            )
            self.stats['failed'] += 1
            return result

        try:
            # Ejecutar handler
            handler = self.handlers[tool_name]
            handler_result = await handler(params)

            execution_time = (datetime.now() - start_time).total_seconds() * 1000

            result = ActionResult(
                tool=tool_name,
                success=True,
                result=handler_result,
                execution_time_ms=execution_time
            )

            self.stats['successful'] += 1
            self._update_avg_time(execution_time)

            logger.info(f"✅ Acción {tool_name} ejecutada en {execution_time:.2f}ms")

        except Exception as e:
            execution_time = (datetime.now() - start_time).total_seconds() * 1000

            result = ActionResult(
                tool=tool_name,
                success=False,
                result=None,
                error=str(e),
                execution_time_ms=execution_time
            )

            self.stats['failed'] += 1
            logger.error(f"❌ Error en acción {tool_name}: {e}")

        # Guardar en historial
        self._add_to_history(result)

        return result

    async def execute_batch(self,
                            actions: list[tuple[str, Dict]]) -> list[ActionResult]:
        """
        Ejecuta múltiples acciones en paralelo.

        Args:
            actions: Lista de (tool_name, params)

        Returns:
            Lista de resultados
        """
        tasks = [
            self.execute(tool_name, params)
            for tool_name, params in actions
        ]
        return await asyncio.gather(*tasks)

    def _update_avg_time(self, new_time: float):
        """Actualiza tiempo promedio de ejecución."""
        total = self.stats['successful'] + self.stats['failed']
        if total > 0:
            self.stats['avg_execution_time_ms'] = (
                (self.stats['avg_execution_time_ms'] * (total - 1) + new_time) / total
            )

    def _add_to_history(self, result: ActionResult):
        """Agrega resultado al historial."""
        self.action_history.append(result)
        if len(self.action_history) > self.max_history:
            self.action_history.pop(0)

    def get_stats(self) -> Dict:
        """Retorna estadísticas del ejecutor."""
        return {
            **self.stats,
            'success_rate': (
                self.stats['successful'] / self.stats['total_executed'] * 100
                if self.stats['total_executed'] > 0 else 0
            ),
            'registered_handlers': list(self.handlers.keys()),
            'history_size': len(self.action_history)
        }

    def get_recent_actions(self, limit: int = 10) -> list[Dict]:
        """Retorna acciones recientes."""
        return [
            {
                'tool': a.tool,
                'success': a.success,
                'execution_time_ms': a.execution_time_ms,
                'timestamp': a.timestamp.isoformat(),
                'error': a.error
            }
            for a in self.action_history[-limit:]
        ]
