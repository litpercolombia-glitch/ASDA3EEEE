"""
Sistema de autenticación y autorización para Litper
===================================================

Implementa:
- Autenticación JWT con refresh tokens
- RBAC (Role-Based Access Control)
- API Keys para integraciones
- Rate limiting por usuario

Uso:
    from security.authentication import get_current_user, require_permission, Permission

    @app.get("/orders/{order_id}")
    async def get_order(
        order_id: str,
        current_user: TokenData = Depends(get_current_user)
    ):
        ...

    @app.delete("/orders/{order_id}")
    async def delete_order(
        order_id: str,
        current_user: TokenData = Depends(require_permission(Permission.ORDERS_DELETE))
    ):
        ...
"""

from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
import secrets
from enum import Enum
import os

# ═══════════════════════════════════════════
# CONFIGURACIÓN
# ═══════════════════════════════════════════

# En producción: obtener desde Vault o variable de entorno segura
SECRET_KEY = os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ═══════════════════════════════════════════
# ROLES Y PERMISOS
# ═══════════════════════════════════════════

class Role(str, Enum):
    """Roles disponibles en el sistema."""
    ADMIN = "admin"              # Acceso total
    OPERATOR = "operator"        # Operador de logística
    VIEWER = "viewer"            # Solo lectura
    API_CLIENT = "api_client"    # Cliente de API (integraciones)
    AGENT = "agent"              # Agentes IA


class Permission(str, Enum):
    """Permisos granulares del sistema."""
    # Pedidos
    ORDERS_READ = "orders:read"
    ORDERS_WRITE = "orders:write"
    ORDERS_DELETE = "orders:delete"

    # Guías
    GUIDES_READ = "guides:read"
    GUIDES_WRITE = "guides:write"

    # Novedades
    INCIDENTS_READ = "incidents:read"
    INCIDENTS_WRITE = "incidents:write"
    INCIDENTS_RESOLVE = "incidents:resolve"

    # Agentes
    AGENTS_READ = "agents:read"
    AGENTS_MANAGE = "agents:manage"

    # Sistema
    SYSTEM_ADMIN = "system:admin"
    SYSTEM_CONFIG = "system:config"

    # Analytics
    ANALYTICS_READ = "analytics:read"
    ANALYTICS_EXPORT = "analytics:export"

    # Usuarios
    USERS_READ = "users:read"
    USERS_WRITE = "users:write"

    # Conocimiento
    KNOWLEDGE_READ = "knowledge:read"
    KNOWLEDGE_WRITE = "knowledge:write"

    # ML
    ML_TRAIN = "ml:train"
    ML_PREDICT = "ml:predict"


# Mapeo de roles a permisos
ROLE_PERMISSIONS: Dict[Role, List[Permission]] = {
    Role.ADMIN: list(Permission),  # Todos los permisos

    Role.OPERATOR: [
        Permission.ORDERS_READ,
        Permission.ORDERS_WRITE,
        Permission.GUIDES_READ,
        Permission.GUIDES_WRITE,
        Permission.INCIDENTS_READ,
        Permission.INCIDENTS_WRITE,
        Permission.INCIDENTS_RESOLVE,
        Permission.AGENTS_READ,
        Permission.ANALYTICS_READ,
        Permission.KNOWLEDGE_READ,
        Permission.ML_PREDICT,
    ],

    Role.VIEWER: [
        Permission.ORDERS_READ,
        Permission.GUIDES_READ,
        Permission.INCIDENTS_READ,
        Permission.ANALYTICS_READ,
        Permission.KNOWLEDGE_READ,
    ],

    Role.API_CLIENT: [
        Permission.ORDERS_READ,
        Permission.ORDERS_WRITE,
        Permission.GUIDES_READ,
        Permission.GUIDES_WRITE,
    ],

    Role.AGENT: [
        Permission.ORDERS_READ,
        Permission.ORDERS_WRITE,
        Permission.GUIDES_READ,
        Permission.GUIDES_WRITE,
        Permission.INCIDENTS_READ,
        Permission.INCIDENTS_WRITE,
        Permission.INCIDENTS_RESOLVE,
        Permission.KNOWLEDGE_READ,
        Permission.ML_PREDICT,
    ],
}


# ═══════════════════════════════════════════
# MODELOS
# ═══════════════════════════════════════════

class TokenData(BaseModel):
    """Datos contenidos en el token JWT."""
    user_id: str
    email: Optional[str] = None
    role: Role
    permissions: List[str]
    country: Optional[str] = None  # Para filtrar por país
    exp: datetime


class User(BaseModel):
    """Modelo de usuario."""
    id: str
    email: EmailStr
    hashed_password: str
    role: Role
    country: Optional[str] = None
    is_active: bool = True
    mfa_enabled: bool = False
    mfa_secret: Optional[str] = None
    created_at: datetime = datetime.utcnow()
    last_login: Optional[datetime] = None


class UserCreate(BaseModel):
    """Modelo para crear usuario."""
    email: EmailStr
    password: str
    role: Role
    country: Optional[str] = None


class APIKey(BaseModel):
    """Modelo de API Key."""
    id: str
    key_hash: str
    key_prefix: str  # Primeros 8 caracteres para búsqueda
    name: str
    client_id: str
    permissions: List[str]
    rate_limit: int  # requests por minuto
    is_active: bool = True
    created_at: datetime
    last_used: Optional[datetime] = None
    expires_at: Optional[datetime] = None


# ═══════════════════════════════════════════
# FUNCIONES DE SEGURIDAD
# ═══════════════════════════════════════════

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verificar contraseña contra hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hashear contraseña usando bcrypt."""
    return pwd_context.hash(password)


def create_access_token(user: User, additional_claims: Dict[str, Any] = None) -> str:
    """
    Crear token de acceso JWT.

    Args:
        user: Usuario autenticado
        additional_claims: Claims adicionales opcionales

    Returns:
        Token JWT codificado
    """
    permissions = [p.value for p in ROLE_PERMISSIONS[user.role]]

    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {
        "sub": user.id,
        "email": user.email,
        "role": user.role.value,
        "permissions": permissions,
        "country": user.country,
        "exp": expire,
        "type": "access",
        "iat": datetime.utcnow(),
    }

    if additional_claims:
        to_encode.update(additional_claims)

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(user: User) -> str:
    """
    Crear token de refresh.

    Args:
        user: Usuario autenticado

    Returns:
        Token de refresh JWT
    """
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode = {
        "sub": user.id,
        "exp": expire,
        "type": "refresh",
        "iat": datetime.utcnow(),
    }

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[TokenData]:
    """
    Decodificar y validar token JWT.

    Args:
        token: Token JWT

    Returns:
        TokenData si válido, None si inválido
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        # Verificar tipo de token
        if payload.get("type") not in ["access", "refresh"]:
            return None

        return TokenData(
            user_id=payload.get("sub"),
            email=payload.get("email"),
            role=Role(payload.get("role")),
            permissions=payload.get("permissions", []),
            country=payload.get("country"),
            exp=datetime.fromtimestamp(payload.get("exp"))
        )
    except JWTError:
        return None


def verify_refresh_token(token: str) -> Optional[str]:
    """
    Verificar token de refresh y retornar user_id.

    Args:
        token: Token de refresh

    Returns:
        user_id si válido, None si inválido
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        if payload.get("type") != "refresh":
            return None

        return payload.get("sub")
    except JWTError:
        return None


# ═══════════════════════════════════════════
# DEPENDENCIAS FASTAPI
# ═══════════════════════════════════════════

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> TokenData:
    """
    Obtener usuario actual desde token JWT.

    Uso:
        @app.get("/protected")
        async def protected_route(current_user: TokenData = Depends(get_current_user)):
            ...
    """
    token = credentials.credentials
    token_data = decode_token(token)

    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return token_data


def require_permission(permission: Permission):
    """
    Factory para crear dependencia que requiere permiso específico.

    Uso:
        @app.delete("/orders/{order_id}")
        async def delete_order(
            current_user: TokenData = Depends(require_permission(Permission.ORDERS_DELETE))
        ):
            ...
    """
    async def permission_checker(
        current_user: TokenData = Depends(get_current_user)
    ) -> TokenData:
        if permission.value not in current_user.permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permiso requerido: {permission.value}"
            )
        return current_user

    return permission_checker


def require_country(allowed_countries: List[str]):
    """
    Factory para crear dependencia que restringe por país.

    Uso:
        @app.get("/orders/co")
        async def get_colombia_orders(
            current_user: TokenData = Depends(require_country(["CO"]))
        ):
            ...
    """
    async def country_checker(
        current_user: TokenData = Depends(get_current_user)
    ) -> TokenData:
        if current_user.country and current_user.country not in allowed_countries:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso no permitido para país: {current_user.country}"
            )
        return current_user

    return country_checker


def require_role(roles: List[Role]):
    """
    Factory para crear dependencia que requiere rol específico.

    Uso:
        @app.post("/admin/users")
        async def create_user(
            current_user: TokenData = Depends(require_role([Role.ADMIN]))
        ):
            ...
    """
    async def role_checker(
        current_user: TokenData = Depends(get_current_user)
    ) -> TokenData:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Rol requerido: {[r.value for r in roles]}"
            )
        return current_user

    return role_checker


# ═══════════════════════════════════════════
# API KEYS PARA INTEGRACIONES
# ═══════════════════════════════════════════

def generate_api_key() -> tuple[str, str, str]:
    """
    Generar nueva API key.

    Returns:
        Tupla de (key_completa, key_hash, key_prefix)
    """
    key = f"ltpr_{secrets.token_urlsafe(32)}"
    key_hash = pwd_context.hash(key)
    key_prefix = key[:12]  # Para búsqueda indexada
    return key, key_hash, key_prefix


async def validate_api_key(api_key: str, db) -> Optional[APIKey]:
    """
    Validar API key.

    Args:
        api_key: Key a validar
        db: Conexión a base de datos

    Returns:
        APIKey si válida, None si inválida
    """
    if not api_key.startswith("ltpr_"):
        return None

    # Buscar por prefijo (primeros 12 caracteres para indexar)
    prefix = api_key[:12]

    # Buscar candidatos en DB
    candidates = await db.api_keys.find({"key_prefix": prefix, "is_active": True}).to_list(10)

    for candidate in candidates:
        if pwd_context.verify(api_key, candidate["key_hash"]):
            # Verificar expiración
            if candidate.get("expires_at") and candidate["expires_at"] < datetime.utcnow():
                return None

            # Actualizar last_used
            await db.api_keys.update_one(
                {"id": candidate["id"]},
                {"$set": {"last_used": datetime.utcnow()}}
            )
            return APIKey(**candidate)

    return None


async def get_api_key_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> TokenData:
    """
    Dependencia para autenticar via API key o JWT.

    Soporta ambos métodos de autenticación.
    """
    token = credentials.credentials

    # Intentar como JWT primero
    token_data = decode_token(token)
    if token_data:
        return token_data

    # Intentar como API key
    if token.startswith("ltpr_"):
        db = request.app.state.db
        api_key = await validate_api_key(token, db)

        if api_key:
            return TokenData(
                user_id=api_key.client_id,
                email=None,
                role=Role.API_CLIENT,
                permissions=api_key.permissions,
                country=None,
                exp=api_key.expires_at or datetime.utcnow() + timedelta(days=365)
            )

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )


# ═══════════════════════════════════════════
# MIDDLEWARE DE RATE LIMITING
# ═══════════════════════════════════════════

from collections import defaultdict
import time

# Rate limit storage (en producción usar Redis)
rate_limit_storage: Dict[str, List[float]] = defaultdict(list)


def check_rate_limit(user_id: str, limit: int = 100, window_seconds: int = 60) -> bool:
    """
    Verificar rate limit para usuario.

    Args:
        user_id: ID del usuario
        limit: Número máximo de requests
        window_seconds: Ventana de tiempo en segundos

    Returns:
        True si permitido, False si excede límite
    """
    now = time.time()
    window_start = now - window_seconds

    # Limpiar requests viejos
    rate_limit_storage[user_id] = [
        ts for ts in rate_limit_storage[user_id] if ts > window_start
    ]

    # Verificar límite
    if len(rate_limit_storage[user_id]) >= limit:
        return False

    # Agregar request actual
    rate_limit_storage[user_id].append(now)
    return True


async def rate_limit_dependency(
    request: Request,
    current_user: TokenData = Depends(get_current_user)
) -> TokenData:
    """
    Dependencia que aplica rate limiting.

    Uso:
        @app.post("/api/heavy-operation")
        async def heavy_operation(
            current_user: TokenData = Depends(rate_limit_dependency)
        ):
            ...
    """
    # Límites por rol
    limits = {
        Role.ADMIN: 1000,
        Role.OPERATOR: 500,
        Role.VIEWER: 200,
        Role.API_CLIENT: 100,
        Role.AGENT: 1000,
    }

    limit = limits.get(current_user.role, 100)

    if not check_rate_limit(current_user.user_id, limit=limit):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Límite de requests excedido. Intenta más tarde."
        )

    return current_user
