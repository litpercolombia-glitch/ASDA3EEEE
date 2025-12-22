"""
Motor del cerebro autónomo usando Claude como núcleo de razonamiento.
Este es el componente central que procesa eventos, toma decisiones y aprende.
"""

from ..claude.client import ClaudeBrainClient, ClaudeConfig, ClaudeModel
from ..claude.tools import BRAIN_TOOLS, get_tools_by_category
from .memory_system import BrainMemory
from .action_executor import ActionExecutor
from typing import Dict, Any, List, Optional, Callable
import asyncio
import json
from datetime import datetime, timedelta
import logging
import os
from dataclasses import dataclass, field
from enum import Enum

logger = logging.getLogger(__name__)


class BrainState(Enum):
    """Estados del cerebro"""
    INITIALIZING = "initializing"
    RUNNING = "running"
    PAUSED = "paused"
    LEARNING = "learning"
    ERROR = "error"
    STOPPED = "stopped"


@dataclass
class BrainEvent:
    """Representa un evento que el cerebro debe procesar"""
    id: str
    type: str
    data: Dict[str, Any]
    timestamp: datetime = field(default_factory=datetime.now)
    priority: str = "normal"  # low, normal, high, critical
    source: str = "system"
    processed: bool = False
    result: Optional[Dict] = None


@dataclass
class BrainMetrics:
    """Métricas del cerebro"""
    events_processed: int = 0
    decisions_made: int = 0
    actions_executed: int = 0
    learning_cycles: int = 0
    errors: int = 0
    avg_decision_time_ms: float = 0
    last_activity: Optional[datetime] = None
    uptime_seconds: int = 0


class ClaudeAutonomousBrain:
    """
    Cerebro autónomo que usa Claude para TODAS las decisiones.
    Procesa eventos, toma decisiones, ejecuta acciones y aprende.
    """

    def __init__(self,
                 api_key: str = None,
                 config: ClaudeConfig = None,
                 auto_learn: bool = True,
                 learning_threshold: int = 10):
        """
        Inicializa el cerebro autónomo.

        Args:
            api_key: API key de Anthropic (o usa ANTHROPIC_API_KEY)
            config: Configuración personalizada
            auto_learn: Si debe aprender automáticamente
            learning_threshold: Eventos antes de trigger aprendizaje
        """
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        self.config = config or ClaudeConfig(api_key=self.api_key)
        self.claude = ClaudeBrainClient(self.config)
        self.memory = BrainMemory()
        self.action_executor = ActionExecutor()

        # Configuración
        self.auto_learn = auto_learn
        self.learning_threshold = learning_threshold

        # Estado interno
        self.state = BrainState.INITIALIZING
        self.learning_buffer: List[Dict] = []
        self.event_queue: asyncio.Queue = asyncio.Queue()
        self.metrics = BrainMetrics()
        self.start_time = datetime.now()

        # Event handlers personalizados
        self.event_handlers: Dict[str, List[Callable]] = {}

        # Configuración de auto-mejora
        self.self_improve_interval = timedelta(hours=6)
        self.last_self_improve = datetime.now()

        logger.info("🧠 Cerebro autónomo inicializado")

    async def start(self):
        """Inicia el cerebro autónomo."""
        self.state = BrainState.RUNNING
        logger.info("🧠 Cerebro autónomo iniciado")

        # Verificar conexión a Claude
        health = await self.claude.health_check()
        if health["status"] != "healthy":
            logger.error(f"Claude API no disponible: {health}")
            self.state = BrainState.ERROR
            return

        # Iniciar loop principal
        await self.autonomous_loop()

    async def stop(self):
        """Detiene el cerebro autónomo."""
        self.state = BrainState.STOPPED
        logger.info("🧠 Cerebro autónomo detenido")

    async def pause(self):
        """Pausa el procesamiento de eventos."""
        self.state = BrainState.PAUSED
        logger.info("🧠 Cerebro autónomo pausado")

    async def resume(self):
        """Reanuda el procesamiento de eventos."""
        self.state = BrainState.RUNNING
        logger.info("🧠 Cerebro autónomo reanudado")

    async def process_event(self, event: BrainEvent) -> Dict[str, Any]:
        """
        Procesa un evento y genera acciones autónomas usando Claude.

        Args:
            event: Evento a procesar

        Returns:
            Resultado del procesamiento incluyendo decisiones y acciones
        """
        start_time = datetime.now()
        self.metrics.events_processed += 1
        self.metrics.last_activity = start_time

        try:
            # 1. Enriquecer evento con contexto
            context = await self._build_context(event)

            # 2. Claude piensa y decide
            decision = await self.claude.think(
                context=f"""
EVENTO RECIBIDO:
Tipo: {event.type}
Prioridad: {event.priority}
Datos: {json.dumps(event.data, ensure_ascii=False, indent=2)}

CONTEXTO HISTÓRICO:
{json.dumps(context, ensure_ascii=False, indent=2)}

Analiza el evento y decide qué acciones tomar.
Si necesitas ejecutar una acción, usa las herramientas disponibles.
Responde en formato JSON con tu decisión y razonamiento.
""",
                role='brain',
                model=ClaudeModel.OPUS if event.priority == "critical" else ClaudeModel.SONNET,
                tools=BRAIN_TOOLS
            )

            self.metrics.decisions_made += 1

            # 3. Ejecutar acciones decididas por Claude
            actions_results = []
            if 'tool' in decision:
                result = await self.action_executor.execute(
                    tool_name=decision['tool'],
                    params=decision.get('input', {})
                )
                actions_results.append(result)
                self.metrics.actions_executed += 1

            # 4. Guardar para aprendizaje
            learning_entry = {
                'event': {
                    'id': event.id,
                    'type': event.type,
                    'data': event.data,
                    'priority': event.priority
                },
                'decision': decision,
                'results': actions_results,
                'timestamp': datetime.now().isoformat(),
                'processing_time_ms': (datetime.now() - start_time).total_seconds() * 1000
            }
            self.learning_buffer.append(learning_entry)

            # 5. Guardar en memoria
            await self.memory.store_event(event, decision, actions_results)

            # 6. Trigger aprendizaje si hay suficientes ejemplos
            if self.auto_learn and len(self.learning_buffer) >= self.learning_threshold:
                asyncio.create_task(self._learn_from_buffer())

            # 7. Notificar handlers
            await self._notify_handlers(event.type, event, decision)

            # Actualizar métricas
            processing_time = (datetime.now() - start_time).total_seconds() * 1000
            self.metrics.avg_decision_time_ms = (
                (self.metrics.avg_decision_time_ms * (self.metrics.events_processed - 1) + processing_time)
                / self.metrics.events_processed
            )

            # Marcar evento como procesado
            event.processed = True
            event.result = decision

            return {
                'event_id': event.id,
                'decision': decision,
                'actions_taken': actions_results,
                'processed_at': datetime.now().isoformat(),
                'processing_time_ms': processing_time,
                'success': True
            }

        except Exception as e:
            self.metrics.errors += 1
            logger.error(f"Error procesando evento {event.id}: {e}")
            return {
                'event_id': event.id,
                'error': str(e),
                'success': False
            }

    async def _build_context(self, event: BrainEvent) -> Dict:
        """Construye contexto relevante para el evento."""
        # Buscar eventos similares pasados
        similar_events = await self.memory.find_similar(event.data, limit=5)

        # Obtener métricas actuales del sistema
        current_metrics = await self._get_current_metrics()

        # Obtener aprendizajes relevantes
        relevant_learnings = await self.memory.get_learnings(
            category=event.type,
            limit=3
        )

        return {
            'similar_past_events': similar_events,
            'current_metrics': current_metrics,
            'relevant_learnings': relevant_learnings,
            'brain_state': self.state.value,
            'timestamp': datetime.now().isoformat()
        }

    async def _get_current_metrics(self) -> Dict:
        """Obtiene métricas actuales del sistema."""
        return {
            'events_processed_today': self.metrics.events_processed,
            'decisions_made': self.metrics.decisions_made,
            'actions_executed': self.metrics.actions_executed,
            'avg_decision_time_ms': round(self.metrics.avg_decision_time_ms, 2),
            'error_rate': (
                self.metrics.errors / self.metrics.events_processed * 100
                if self.metrics.events_processed > 0 else 0
            ),
            'uptime_hours': (datetime.now() - self.start_time).total_seconds() / 3600
        }

    async def _learn_from_buffer(self):
        """Aprende de las experiencias acumuladas."""
        if not self.learning_buffer:
            return

        self.state = BrainState.LEARNING
        logger.info(f"🎓 Iniciando ciclo de aprendizaje con {len(self.learning_buffer)} experiencias")

        try:
            # Claude analiza el batch de experiencias
            learning_result = await self.claude.think(
                context=f"""
Analiza estas {len(self.learning_buffer)} experiencias recientes del sistema:

{json.dumps(self.learning_buffer, ensure_ascii=False, indent=2)}

Identifica:
1. PATRONES DE ÉXITO: ¿Qué decisiones funcionaron bien y por qué?
2. PATRONES DE FRACASO: ¿Qué decisiones no funcionaron y por qué?
3. CORRELACIONES: ¿Qué factores predicen buenos o malos resultados?
4. RECOMENDACIONES: ¿Cómo debería ajustar mis decisiones futuras?
5. ANOMALÍAS: ¿Hay casos inusuales que requieran atención?

Responde en formato JSON estructurado.
""",
                role='learning',
                model=ClaudeModel.SONNET
            )

            # Guardar aprendizajes
            await self.memory.store_learning(learning_result)

            self.metrics.learning_cycles += 1
            logger.info(f"🎓 Ciclo de aprendizaje completado. Insights: {learning_result.get('patterns_found', [])}")

            # Limpiar buffer
            self.learning_buffer = []

        except Exception as e:
            logger.error(f"Error en ciclo de aprendizaje: {e}")

        finally:
            self.state = BrainState.RUNNING

    async def autonomous_loop(self):
        """
        Loop principal del cerebro - procesa eventos continuamente.
        """
        logger.info("🧠 Loop autónomo iniciado...")

        while self.state in [BrainState.RUNNING, BrainState.LEARNING, BrainState.PAUSED]:
            try:
                # Si está pausado, esperar
                if self.state == BrainState.PAUSED:
                    await asyncio.sleep(1)
                    continue

                # Procesar eventos de la cola con timeout
                try:
                    event = await asyncio.wait_for(
                        self.event_queue.get(),
                        timeout=1.0
                    )
                    await self.process_event(event)
                except asyncio.TimeoutError:
                    pass  # No hay eventos, continuar

                # Verificar si es tiempo de auto-mejora
                if datetime.now() - self.last_self_improve > self.self_improve_interval:
                    await self._self_improve()
                    self.last_self_improve = datetime.now()

                # Actualizar uptime
                self.metrics.uptime_seconds = int(
                    (datetime.now() - self.start_time).total_seconds()
                )

            except Exception as e:
                logger.error(f"❌ Error en loop autónomo: {e}")
                self.metrics.errors += 1
                await asyncio.sleep(5)

        logger.info("🧠 Loop autónomo detenido")

    async def _self_improve(self):
        """El cerebro se auto-mejora usando Claude Opus."""
        logger.info("🔄 Iniciando auto-mejora...")

        try:
            # Obtener resumen de rendimiento
            performance = await self._get_current_metrics()
            recent_learnings = await self.memory.get_learnings(limit=10)

            improvement = await self.claude.think(
                context=f"""
ANÁLISIS DE AUTO-MEJORA DEL CEREBRO AUTÓNOMO

MÉTRICAS DE RENDIMIENTO:
{json.dumps(performance, ensure_ascii=False, indent=2)}

APRENDIZAJES RECIENTES:
{json.dumps(recent_learnings, ensure_ascii=False, indent=2)}

Analiza tu propio rendimiento y genera:
1. FORTALEZAS: ¿Qué estás haciendo bien?
2. DEBILIDADES: ¿Dónde puedes mejorar?
3. OPORTUNIDADES: ¿Qué optimizaciones propones?
4. PLAN DE MEJORA: Acciones concretas para mejorar

Sé autocrítico y específico.
""",
                role='learning',
                model=ClaudeModel.OPUS
            )

            # Guardar plan de mejora
            await self.memory.store_learning({
                'type': 'self_improvement',
                'analysis': improvement,
                'timestamp': datetime.now().isoformat()
            })

            logger.info(f"🔄 Auto-mejora completada: {improvement.get('plan_de_mejora', 'N/A')}")

        except Exception as e:
            logger.error(f"Error en auto-mejora: {e}")

    # =========================================================================
    # API PÚBLICA
    # =========================================================================

    async def submit_event(self,
                           event_type: str,
                           data: Dict[str, Any],
                           priority: str = "normal",
                           source: str = "api") -> str:
        """
        Envía un evento al cerebro para procesar.

        Args:
            event_type: Tipo de evento (delay_detected, new_order, etc.)
            data: Datos del evento
            priority: low, normal, high, critical
            source: Origen del evento

        Returns:
            ID del evento
        """
        event = BrainEvent(
            id=f"evt_{datetime.now().strftime('%Y%m%d%H%M%S%f')}",
            type=event_type,
            data=data,
            priority=priority,
            source=source
        )

        await self.event_queue.put(event)
        logger.info(f"📥 Evento {event.id} ({event_type}) agregado a la cola")

        return event.id

    async def ask(self,
                  question: str,
                  context: Dict = None) -> str:
        """
        Interfaz directa para preguntar a Claude.

        Args:
            question: Pregunta en lenguaje natural
            context: Contexto adicional

        Returns:
            Respuesta del cerebro
        """
        full_context = f"""
PREGUNTA DEL USUARIO: {question}

{"CONTEXTO ADICIONAL: " + json.dumps(context, ensure_ascii=False) if context else ""}

ESTADO ACTUAL DEL SISTEMA:
{json.dumps(await self._get_current_metrics(), ensure_ascii=False)}

Responde de forma clara, concisa y profesional en español colombiano.
"""
        response = await self.claude.think(full_context, role='brain')
        return response.get('response', str(response))

    def register_handler(self, event_type: str, handler: Callable):
        """
        Registra un handler para un tipo de evento.

        Args:
            event_type: Tipo de evento (o '*' para todos)
            handler: Función async a llamar
        """
        if event_type not in self.event_handlers:
            self.event_handlers[event_type] = []
        self.event_handlers[event_type].append(handler)

    async def _notify_handlers(self,
                               event_type: str,
                               event: BrainEvent,
                               decision: Dict):
        """Notifica a los handlers registrados."""
        handlers = self.event_handlers.get(event_type, [])
        handlers += self.event_handlers.get('*', [])

        for handler in handlers:
            try:
                await handler(event, decision)
            except Exception as e:
                logger.error(f"Error en handler: {e}")

    def get_status(self) -> Dict[str, Any]:
        """Retorna el estado actual del cerebro."""
        return {
            'state': self.state.value,
            'metrics': {
                'events_processed': self.metrics.events_processed,
                'decisions_made': self.metrics.decisions_made,
                'actions_executed': self.metrics.actions_executed,
                'learning_cycles': self.metrics.learning_cycles,
                'errors': self.metrics.errors,
                'avg_decision_time_ms': round(self.metrics.avg_decision_time_ms, 2),
                'uptime_hours': round((datetime.now() - self.start_time).total_seconds() / 3600, 2)
            },
            'queue_size': self.event_queue.qsize(),
            'learning_buffer_size': len(self.learning_buffer),
            'claude_metrics': self.claude.get_metrics()
        }


# =============================================================================
# FACTORY FUNCTION
# =============================================================================

def create_brain(api_key: str = None, **kwargs) -> ClaudeAutonomousBrain:
    """
    Crea una instancia del cerebro autónomo.

    Args:
        api_key: API key de Anthropic
        **kwargs: Argumentos adicionales para ClaudeAutonomousBrain

    Returns:
        Instancia del cerebro
    """
    return ClaudeAutonomousBrain(api_key=api_key, **kwargs)
