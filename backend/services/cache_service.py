"""
Servicio de Cache para el backend de Litper Pro.
Proporciona caching en memoria con TTL para optimizar queries frecuentes.
"""

import json
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Callable, TypeVar
from functools import wraps
from loguru import logger

T = TypeVar('T')


class CacheService:
    """
    Servicio de cache en memoria con TTL.
    En producción, se puede reemplazar por Redis.
    """

    def __init__(self, default_ttl: int = 300):
        """
        Inicializa el servicio de cache.

        Args:
            default_ttl: TTL por defecto en segundos (5 minutos)
        """
        self._cache: Dict[str, tuple] = {}  # key -> (value, expiry)
        self.default_ttl = default_ttl
        self.hits = 0
        self.misses = 0

    def _generate_key(self, prefix: str, *args, **kwargs) -> str:
        """
        Genera una key única basada en los argumentos.

        Args:
            prefix: Prefijo para la key
            *args: Argumentos posicionales
            **kwargs: Argumentos con nombre

        Returns:
            Key única para el cache
        """
        # Serializar argumentos de forma determinista
        key_data = {
            'args': [str(a) for a in args],
            'kwargs': {k: str(v) for k, v in sorted(kwargs.items())}
        }
        data_str = json.dumps(key_data, sort_keys=True)
        hash_val = hashlib.md5(data_str.encode()).hexdigest()[:16]
        return f"{prefix}:{hash_val}"

    def get(self, key: str) -> Optional[Any]:
        """
        Obtiene un valor del cache.

        Args:
            key: Clave a buscar

        Returns:
            Valor almacenado o None si no existe o expiró
        """
        if key in self._cache:
            value, expiry = self._cache[key]
            if expiry > datetime.now():
                self.hits += 1
                return value
            else:
                # Expirado, eliminar
                del self._cache[key]
                self.misses += 1
        else:
            self.misses += 1
        return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """
        Almacena un valor en el cache.

        Args:
            key: Clave para almacenar
            value: Valor a almacenar
            ttl: Tiempo de vida en segundos (usa default si no se especifica)
        """
        ttl_seconds = ttl if ttl is not None else self.default_ttl
        expiry = datetime.now() + timedelta(seconds=ttl_seconds)
        self._cache[key] = (value, expiry)

    def delete(self, key: str) -> bool:
        """
        Elimina una entrada del cache.

        Args:
            key: Clave a eliminar

        Returns:
            True si se eliminó, False si no existía
        """
        if key in self._cache:
            del self._cache[key]
            return True
        return False

    def clear(self) -> int:
        """
        Limpia todo el cache.

        Returns:
            Número de entradas eliminadas
        """
        count = len(self._cache)
        self._cache.clear()
        self.hits = 0
        self.misses = 0
        logger.info(f"Cache limpiado: {count} entradas eliminadas")
        return count

    def clear_prefix(self, prefix: str) -> int:
        """
        Elimina todas las entradas con un prefijo específico.

        Args:
            prefix: Prefijo de las claves a eliminar

        Returns:
            Número de entradas eliminadas
        """
        keys_to_delete = [k for k in self._cache.keys() if k.startswith(prefix)]
        for key in keys_to_delete:
            del self._cache[key]
        logger.debug(f"Cache prefix '{prefix}' limpiado: {len(keys_to_delete)} entradas")
        return len(keys_to_delete)

    def cleanup_expired(self) -> int:
        """
        Elimina entradas expiradas del cache.

        Returns:
            Número de entradas eliminadas
        """
        now = datetime.now()
        expired_keys = [
            k for k, (_, expiry) in self._cache.items()
            if expiry <= now
        ]
        for key in expired_keys:
            del self._cache[key]
        return len(expired_keys)

    def get_stats(self) -> Dict[str, Any]:
        """
        Obtiene estadísticas del cache.

        Returns:
            Dict con estadísticas
        """
        total_requests = self.hits + self.misses
        hit_rate = (self.hits / total_requests * 100) if total_requests > 0 else 0

        return {
            "total_entries": len(self._cache),
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": round(hit_rate, 2),
            "memory_estimate_kb": self._estimate_memory() / 1024
        }

    def _estimate_memory(self) -> int:
        """Estima el uso de memoria del cache en bytes"""
        total = 0
        for key, (value, _) in self._cache.items():
            total += len(key.encode())
            try:
                total += len(json.dumps(value).encode())
            except (TypeError, ValueError):
                total += 100  # Estimación para objetos no serializables
        return total


# ==================== DECORADOR DE CACHE ====================

def cached(prefix: str, ttl: int = 300):
    """
    Decorador para cachear resultados de funciones.

    Args:
        prefix: Prefijo para las keys del cache
        ttl: Tiempo de vida en segundos

    Usage:
        @cached(prefix="dashboard", ttl=60)
        async def get_dashboard_data():
            ...
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        async def async_wrapper(*args, **kwargs) -> T:
            cache_key = cache_service._generate_key(prefix, *args, **kwargs)

            # Intentar obtener del cache
            cached_result = cache_service.get(cache_key)
            if cached_result is not None:
                logger.debug(f"Cache HIT: {cache_key}")
                return cached_result

            # Ejecutar función y cachear resultado
            logger.debug(f"Cache MISS: {cache_key}")
            result = await func(*args, **kwargs)
            cache_service.set(cache_key, result, ttl)
            return result

        @wraps(func)
        def sync_wrapper(*args, **kwargs) -> T:
            cache_key = cache_service._generate_key(prefix, *args, **kwargs)

            cached_result = cache_service.get(cache_key)
            if cached_result is not None:
                logger.debug(f"Cache HIT: {cache_key}")
                return cached_result

            logger.debug(f"Cache MISS: {cache_key}")
            result = func(*args, **kwargs)
            cache_service.set(cache_key, result, ttl)
            return result

        # Detectar si la función es async
        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper

    return decorator


def invalidate_cache(prefix: str):
    """
    Decorador para invalidar cache después de ejecutar una función.

    Args:
        prefix: Prefijo del cache a invalidar

    Usage:
        @invalidate_cache(prefix="dashboard")
        async def update_data():
            ...
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        async def async_wrapper(*args, **kwargs) -> T:
            result = await func(*args, **kwargs)
            cache_service.clear_prefix(prefix)
            logger.debug(f"Cache invalidado: {prefix}")
            return result

        @wraps(func)
        def sync_wrapper(*args, **kwargs) -> T:
            result = func(*args, **kwargs)
            cache_service.clear_prefix(prefix)
            logger.debug(f"Cache invalidado: {prefix}")
            return result

        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper

    return decorator


# ==================== INSTANCIA SINGLETON ====================

cache_service = CacheService(default_ttl=300)


# ==================== FUNCIONES DE UTILIDAD ====================

def get_or_set(
    key: str,
    factory: Callable[[], T],
    ttl: Optional[int] = None
) -> T:
    """
    Obtiene un valor del cache o lo genera y almacena.

    Args:
        key: Clave del cache
        factory: Función para generar el valor si no existe
        ttl: Tiempo de vida en segundos

    Returns:
        Valor del cache o generado
    """
    value = cache_service.get(key)
    if value is not None:
        return value

    value = factory()
    cache_service.set(key, value, ttl)
    return value


async def get_or_set_async(
    key: str,
    factory: Callable[[], Any],
    ttl: Optional[int] = None
) -> Any:
    """
    Versión async de get_or_set.
    """
    value = cache_service.get(key)
    if value is not None:
        return value

    value = await factory()
    cache_service.set(key, value, ttl)
    return value
