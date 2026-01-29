"""
Rate Limiter Middleware
========================

Protege las APIs contra ataques de fuerza bruta y DDoS.
Implementa sliding window rate limiting con Redis.
"""

import time
from typing import Optional, Dict, Callable
from functools import wraps
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from loguru import logger

# Almacenamiento en memoria (usar Redis en producción)
_rate_limit_store: Dict[str, list] = {}


class RateLimiter:
    """
    Rate limiter con sliding window algorithm.
    """

    def __init__(
        self,
        requests_per_minute: int = 60,
        requests_per_hour: int = 1000,
        burst_limit: int = 10,
    ):
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        self.burst_limit = burst_limit

    def _get_client_id(self, request: Request) -> str:
        """Obtiene identificador único del cliente."""
        # Usar IP + User-Agent para identificar
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "")[:50]
        return f"{client_ip}_{hash(user_agent) % 10000}"

    def _clean_old_requests(self, client_id: str, window_seconds: int) -> list:
        """Limpia requests antiguos fuera de la ventana."""
        now = time.time()
        if client_id not in _rate_limit_store:
            _rate_limit_store[client_id] = []

        # Filtrar solo requests dentro de la ventana
        _rate_limit_store[client_id] = [
            ts for ts in _rate_limit_store[client_id]
            if now - ts < window_seconds
        ]
        return _rate_limit_store[client_id]

    def check_rate_limit(self, request: Request) -> Optional[Dict]:
        """
        Verifica si el cliente excedió el rate limit.
        Retorna None si está OK, o dict con info del error.
        """
        client_id = self._get_client_id(request)
        now = time.time()

        # Verificar límite por minuto (60 segundos)
        requests_minute = self._clean_old_requests(client_id, 60)
        if len(requests_minute) >= self.requests_per_minute:
            retry_after = 60 - (now - min(requests_minute))
            return {
                "error": "Rate limit exceeded",
                "message": f"Demasiadas solicitudes. Intenta en {int(retry_after)} segundos.",
                "retry_after": int(retry_after),
                "limit": self.requests_per_minute,
                "window": "minute",
            }

        # Verificar burst (últimos 10 segundos)
        requests_burst = [ts for ts in requests_minute if now - ts < 10]
        if len(requests_burst) >= self.burst_limit:
            return {
                "error": "Burst limit exceeded",
                "message": "Demasiadas solicitudes rápidas. Espera unos segundos.",
                "retry_after": 10,
                "limit": self.burst_limit,
                "window": "burst",
            }

        # Verificar límite por hora (3600 segundos)
        requests_hour = self._clean_old_requests(f"{client_id}_hour", 3600)
        if len(requests_hour) >= self.requests_per_hour:
            retry_after = 3600 - (now - min(requests_hour))
            return {
                "error": "Hourly rate limit exceeded",
                "message": f"Límite por hora excedido. Intenta en {int(retry_after / 60)} minutos.",
                "retry_after": int(retry_after),
                "limit": self.requests_per_hour,
                "window": "hour",
            }

        # Registrar este request
        _rate_limit_store[client_id].append(now)
        _rate_limit_store.setdefault(f"{client_id}_hour", []).append(now)

        return None

    def get_remaining(self, request: Request) -> Dict:
        """Obtiene requests restantes para el cliente."""
        client_id = self._get_client_id(request)
        requests_minute = self._clean_old_requests(client_id, 60)
        requests_hour = self._clean_old_requests(f"{client_id}_hour", 3600)

        return {
            "remaining_minute": max(0, self.requests_per_minute - len(requests_minute)),
            "remaining_hour": max(0, self.requests_per_hour - len(requests_hour)),
            "limit_minute": self.requests_per_minute,
            "limit_hour": self.requests_per_hour,
        }


# Instancia global
rate_limiter = RateLimiter(
    requests_per_minute=60,
    requests_per_hour=1000,
    burst_limit=15,
)

# Rate limiter más estricto para autenticación
auth_rate_limiter = RateLimiter(
    requests_per_minute=10,
    requests_per_hour=50,
    burst_limit=3,
)


async def rate_limit_middleware(request: Request, call_next):
    """
    Middleware de FastAPI para rate limiting global.
    """
    # Rutas excluidas del rate limiting
    excluded_paths = ["/health", "/docs", "/openapi.json", "/favicon.ico"]
    if request.url.path in excluded_paths:
        return await call_next(request)

    # Usar rate limiter estricto para auth
    if "/auth" in request.url.path:
        limiter = auth_rate_limiter
    else:
        limiter = rate_limiter

    # Verificar rate limit
    error = limiter.check_rate_limit(request)
    if error:
        logger.warning(
            f"Rate limit exceeded: {request.client.host} - {request.url.path}"
        )
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content=error,
            headers={
                "Retry-After": str(error["retry_after"]),
                "X-RateLimit-Limit": str(error["limit"]),
            },
        )

    # Agregar headers de rate limit a la respuesta
    response = await call_next(request)
    remaining = limiter.get_remaining(request)
    response.headers["X-RateLimit-Remaining"] = str(remaining["remaining_minute"])
    response.headers["X-RateLimit-Limit"] = str(remaining["limit_minute"])

    return response


def rate_limit(
    requests_per_minute: int = 30,
    burst_limit: int = 5,
):
    """
    Decorador para aplicar rate limiting a endpoints específicos.

    @rate_limit(requests_per_minute=10, burst_limit=2)
    async def sensitive_endpoint():
        ...
    """
    limiter = RateLimiter(
        requests_per_minute=requests_per_minute,
        burst_limit=burst_limit,
    )

    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(request: Request, *args, **kwargs):
            error = limiter.check_rate_limit(request)
            if error:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=error["message"],
                    headers={"Retry-After": str(error["retry_after"])},
                )
            return await func(request, *args, **kwargs)

        return wrapper

    return decorator
