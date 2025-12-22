"""
Sistema de memoria del cerebro autónomo.
Implementa memoria a corto y largo plazo para contexto y aprendizaje.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, field
import json
import asyncio
import logging
from collections import deque
import hashlib

logger = logging.getLogger(__name__)


@dataclass
class MemoryEntry:
    """Representa una entrada en la memoria"""
    id: str
    type: str  # event, decision, learning, action
    content: Dict[str, Any]
    timestamp: datetime = field(default_factory=datetime.now)
    importance: float = 0.5  # 0-1, mayor = más importante
    access_count: int = 0
    last_accessed: datetime = field(default_factory=datetime.now)
    tags: List[str] = field(default_factory=list)
    embedding: Optional[List[float]] = None  # Para búsqueda semántica


class BrainMemory:
    """
    Sistema de memoria dual del cerebro.

    Short-term: Memoria rápida y volátil (últimas horas)
    Long-term: Memoria persistente para patrones y aprendizajes
    """

    def __init__(self,
                 short_term_size: int = 1000,
                 short_term_ttl_hours: int = 24,
                 long_term_size: int = 10000):
        """
        Inicializa el sistema de memoria.

        Args:
            short_term_size: Tamaño máximo de memoria a corto plazo
            short_term_ttl_hours: Tiempo de vida en memoria corta
            long_term_size: Tamaño máximo de memoria a largo plazo
        """
        # Memoria a corto plazo (eventos recientes)
        self.short_term: deque = deque(maxlen=short_term_size)
        self.short_term_ttl = timedelta(hours=short_term_ttl_hours)

        # Memoria a largo plazo (patrones y aprendizajes)
        self.long_term: Dict[str, MemoryEntry] = {}
        self.long_term_size = long_term_size

        # Índices para búsqueda rápida
        self.type_index: Dict[str, List[str]] = {}
        self.tag_index: Dict[str, List[str]] = {}

        # Estadísticas
        self.stats = {
            'total_stored': 0,
            'total_retrieved': 0,
            'cache_hits': 0,
            'cache_misses': 0
        }

        # Cache de búsquedas recientes
        self.search_cache: Dict[str, List[MemoryEntry]] = {}
        self.cache_ttl = timedelta(minutes=5)
        self.cache_timestamps: Dict[str, datetime] = {}

        logger.info("💾 Sistema de memoria inicializado")

    async def store_event(self,
                          event: Any,
                          decision: Dict,
                          results: List[Dict]) -> str:
        """
        Almacena un evento procesado en memoria.

        Args:
            event: Evento original
            decision: Decisión tomada
            results: Resultados de las acciones

        Returns:
            ID de la entrada en memoria
        """
        # Calcular importancia basada en prioridad y resultados
        importance = self._calculate_importance(event, decision, results)

        entry = MemoryEntry(
            id=self._generate_id(event),
            type='event',
            content={
                'event_type': event.type if hasattr(event, 'type') else 'unknown',
                'event_data': event.data if hasattr(event, 'data') else event,
                'decision': decision,
                'results': results,
                'success': all(r.get('success', True) for r in results)
            },
            importance=importance,
            tags=self._extract_tags(event, decision)
        )

        # Guardar en short-term
        self.short_term.append(entry)

        # Si es importante, guardar en long-term
        if importance > 0.7:
            await self._store_long_term(entry)

        self.stats['total_stored'] += 1

        return entry.id

    async def store_learning(self, learning: Dict) -> str:
        """
        Almacena un aprendizaje en memoria a largo plazo.

        Args:
            learning: Contenido del aprendizaje

        Returns:
            ID de la entrada
        """
        entry = MemoryEntry(
            id=self._generate_id(learning),
            type='learning',
            content=learning,
            importance=0.9,  # Aprendizajes son siempre importantes
            tags=['learning', learning.get('category', 'general')]
        )

        await self._store_long_term(entry)

        logger.info(f"💾 Aprendizaje almacenado: {entry.id}")
        return entry.id

    async def find_similar(self,
                           query: Dict,
                           limit: int = 5) -> List[Dict]:
        """
        Busca eventos similares en memoria.

        Args:
            query: Datos para buscar similares
            limit: Número máximo de resultados

        Returns:
            Lista de eventos similares
        """
        cache_key = self._cache_key(query)

        # Verificar cache
        if cache_key in self.search_cache:
            if datetime.now() - self.cache_timestamps.get(cache_key, datetime.min) < self.cache_ttl:
                self.stats['cache_hits'] += 1
                return [e.content for e in self.search_cache[cache_key][:limit]]

        self.stats['cache_misses'] += 1
        self.stats['total_retrieved'] += 1

        # Buscar en short-term primero (más reciente)
        similar = []

        # Extraer características clave de la query
        query_features = self._extract_features(query)

        # Buscar en short-term
        for entry in reversed(list(self.short_term)):
            if entry.type == 'event':
                entry_features = self._extract_features(entry.content.get('event_data', {}))
                similarity = self._calculate_similarity(query_features, entry_features)
                if similarity > 0.5:
                    similar.append((similarity, entry))
                    entry.access_count += 1
                    entry.last_accessed = datetime.now()

        # Buscar en long-term
        for entry in self.long_term.values():
            if entry.type == 'event':
                entry_features = self._extract_features(entry.content.get('event_data', {}))
                similarity = self._calculate_similarity(query_features, entry_features)
                if similarity > 0.5:
                    similar.append((similarity, entry))
                    entry.access_count += 1
                    entry.last_accessed = datetime.now()

        # Ordenar por similitud y tomar los mejores
        similar.sort(key=lambda x: x[0], reverse=True)
        results = [entry for _, entry in similar[:limit]]

        # Guardar en cache
        self.search_cache[cache_key] = results
        self.cache_timestamps[cache_key] = datetime.now()

        return [e.content for e in results]

    async def get_learnings(self,
                            category: str = None,
                            limit: int = 10) -> List[Dict]:
        """
        Obtiene aprendizajes almacenados.

        Args:
            category: Categoría de aprendizajes (opcional)
            limit: Número máximo

        Returns:
            Lista de aprendizajes
        """
        self.stats['total_retrieved'] += 1

        learnings = []

        for entry in self.long_term.values():
            if entry.type == 'learning':
                if category is None or category in entry.tags:
                    learnings.append(entry)

        # Ordenar por importancia y recencia
        learnings.sort(
            key=lambda x: (x.importance, x.timestamp),
            reverse=True
        )

        return [e.content for e in learnings[:limit]]

    async def get_context(self,
                          event_type: str = None,
                          hours_back: int = 24) -> Dict:
        """
        Obtiene contexto relevante de las últimas horas.

        Args:
            event_type: Filtrar por tipo de evento
            hours_back: Horas hacia atrás

        Returns:
            Contexto compilado
        """
        cutoff = datetime.now() - timedelta(hours=hours_back)

        recent_events = []
        event_counts = {}
        success_rate = {'success': 0, 'total': 0}

        for entry in self.short_term:
            if entry.timestamp >= cutoff:
                if event_type is None or entry.content.get('event_type') == event_type:
                    recent_events.append(entry.content)

                    # Contar por tipo
                    et = entry.content.get('event_type', 'unknown')
                    event_counts[et] = event_counts.get(et, 0) + 1

                    # Calcular tasa de éxito
                    if entry.content.get('success'):
                        success_rate['success'] += 1
                    success_rate['total'] += 1

        return {
            'recent_events': recent_events[-10:],  # Últimos 10
            'event_counts': event_counts,
            'success_rate': (
                success_rate['success'] / success_rate['total'] * 100
                if success_rate['total'] > 0 else 100
            ),
            'period_hours': hours_back,
            'total_events': len(recent_events)
        }

    async def cleanup(self):
        """Limpia entradas expiradas y optimiza memoria."""
        now = datetime.now()
        removed = 0

        # Limpiar short-term expirado
        while self.short_term and (now - self.short_term[0].timestamp) > self.short_term_ttl:
            self.short_term.popleft()
            removed += 1

        # Limpiar long-term si excede tamaño
        if len(self.long_term) > self.long_term_size:
            # Ordenar por importancia * recencia
            entries = sorted(
                self.long_term.items(),
                key=lambda x: x[1].importance * (1 / max(1, (now - x[1].last_accessed).days + 1))
            )
            # Remover los menos importantes
            for entry_id, _ in entries[:len(entries) - self.long_term_size]:
                del self.long_term[entry_id]
                removed += 1

        # Limpiar cache expirado
        expired_keys = [
            k for k, ts in self.cache_timestamps.items()
            if now - ts > self.cache_ttl
        ]
        for key in expired_keys:
            del self.search_cache[key]
            del self.cache_timestamps[key]

        if removed > 0:
            logger.info(f"💾 Limpieza de memoria: {removed} entradas removidas")

        return removed

    # =========================================================================
    # MÉTODOS PRIVADOS
    # =========================================================================

    async def _store_long_term(self, entry: MemoryEntry):
        """Almacena en memoria a largo plazo."""
        self.long_term[entry.id] = entry

        # Actualizar índices
        if entry.type not in self.type_index:
            self.type_index[entry.type] = []
        self.type_index[entry.type].append(entry.id)

        for tag in entry.tags:
            if tag not in self.tag_index:
                self.tag_index[tag] = []
            self.tag_index[tag].append(entry.id)

    def _calculate_importance(self,
                              event: Any,
                              decision: Dict,
                              results: List[Dict]) -> float:
        """Calcula la importancia de un evento."""
        importance = 0.5  # Base

        # Prioridad del evento
        priority_map = {'critical': 0.3, 'high': 0.2, 'normal': 0.1, 'low': 0}
        priority = event.priority if hasattr(event, 'priority') else 'normal'
        importance += priority_map.get(priority, 0)

        # Confianza de la decisión
        confidence = decision.get('confidence', 50) / 100
        importance += confidence * 0.1

        # Éxito de las acciones
        if results and all(r.get('success', True) for r in results):
            importance += 0.1

        return min(1.0, importance)

    def _extract_tags(self, event: Any, decision: Dict) -> List[str]:
        """Extrae tags de un evento y decisión."""
        tags = []

        # Tipo de evento
        if hasattr(event, 'type'):
            tags.append(event.type)

        # Datos del evento
        data = event.data if hasattr(event, 'data') else {}
        if 'city' in data:
            tags.append(f"city:{data['city']}")
        if 'carrier' in data:
            tags.append(f"carrier:{data['carrier']}")

        # Decisión
        if 'decision' in decision:
            tags.append(f"decision:{decision['decision'][:50]}")

        return tags

    def _extract_features(self, data: Dict) -> Dict:
        """Extrae características para comparación."""
        features = {}

        # Características comunes
        for key in ['city', 'carrier', 'type', 'event_type', 'status', 'priority']:
            if key in data:
                features[key] = data[key]

        return features

    def _calculate_similarity(self, features1: Dict, features2: Dict) -> float:
        """Calcula similitud entre dos conjuntos de características."""
        if not features1 or not features2:
            return 0.0

        matches = 0
        total = len(set(features1.keys()) | set(features2.keys()))

        for key in features1:
            if key in features2 and features1[key] == features2[key]:
                matches += 1

        return matches / total if total > 0 else 0.0

    def _generate_id(self, data: Any) -> str:
        """Genera un ID único para una entrada."""
        content = json.dumps(data, sort_keys=True, default=str)
        timestamp = datetime.now().isoformat()
        return hashlib.md5(f"{content}{timestamp}".encode()).hexdigest()[:16]

    def _cache_key(self, query: Dict) -> str:
        """Genera clave de cache para una query."""
        return hashlib.md5(
            json.dumps(query, sort_keys=True, default=str).encode()
        ).hexdigest()[:8]

    def get_stats(self) -> Dict:
        """Retorna estadísticas de memoria."""
        return {
            **self.stats,
            'short_term_size': len(self.short_term),
            'long_term_size': len(self.long_term),
            'cache_size': len(self.search_cache),
            'cache_hit_rate': (
                self.stats['cache_hits'] /
                (self.stats['cache_hits'] + self.stats['cache_misses']) * 100
                if (self.stats['cache_hits'] + self.stats['cache_misses']) > 0 else 0
            )
        }
