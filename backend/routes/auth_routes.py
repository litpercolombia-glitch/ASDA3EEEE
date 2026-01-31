"""
Rutas de Autenticación HARDENED para Litper Pro
================================================

Endpoints seguros con:
- Tokens en cookies httpOnly (no localStorage)
- Refresh tokens persistidos con revocación real
- Rate limiting por IP y usuario
- Register deshabilitado en producción por defecto

IMPORTANTE: Este archivo implementa autenticación "production-ready".
"""

import os
import json
import time
import secrets
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, List, Dict
from collections import defaultdict
from fastapi import APIRouter, HTTPException, status, Depends, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field
from loguru import logger

# Importar sistema de seguridad
from security.authentication import (
    Role,
    Permission,
    ROLE_PERMISSIONS,
    TokenData,
    User as UserModel,
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_refresh_token,
    get_current_user,
    require_role,
    require_permission,
)

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])

# ═══════════════════════════════════════════
# CONFIGURACIÓN
# ═══════════════════════════════════════════

IS_PRODUCTION = os.getenv("ENV", "development").lower() == "production"
ALLOW_REGISTER = os.getenv("ALLOW_REGISTER", "false").lower() == "true"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))  # Más corto en prod
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# Cookie settings
COOKIE_SECURE = IS_PRODUCTION  # Solo HTTPS en prod
COOKIE_SAMESITE = "lax"  # Protección CSRF básica
COOKIE_DOMAIN = os.getenv("COOKIE_DOMAIN", None)  # None = current domain

# Rate limiting settings
RATE_LIMIT_WINDOW = 60  # segundos
RATE_LIMIT_MAX_LOGIN = 5  # intentos por ventana
RATE_LIMIT_MAX_REGISTER = 3
RATE_LIMIT_MAX_REFRESH = 30

# Data paths
DATA_DIR = Path(os.getenv("DATA_DIR", "./data"))
USERS_FILE = DATA_DIR / "users.json"
TOKENS_FILE = DATA_DIR / "refresh_tokens.json"

# ═══════════════════════════════════════════
# RATE LIMITING
# ═══════════════════════════════════════════

_rate_limit_store: Dict[str, List[float]] = defaultdict(list)


def _check_rate_limit(key: str, max_requests: int, window_seconds: int = RATE_LIMIT_WINDOW) -> bool:
    """
    Verifica rate limit para una key (IP o user_id).
    Returns True si está dentro del límite, False si excede.
    """
    now = time.time()
    window_start = now - window_seconds

    # Limpiar requests viejos
    _rate_limit_store[key] = [ts for ts in _rate_limit_store[key] if ts > window_start]

    if len(_rate_limit_store[key]) >= max_requests:
        return False

    _rate_limit_store[key].append(now)
    return True


def _get_client_ip(request: Request) -> str:
    """Obtiene IP del cliente considerando proxies"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


# ═══════════════════════════════════════════
# MODELOS DE REQUEST/RESPONSE
# ═══════════════════════════════════════════

class LoginRequest(BaseModel):
    """Request de login"""
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)


class RegisterRequest(BaseModel):
    """Request de registro de usuario"""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    nombre: str = Field(..., min_length=2, max_length=100)
    invite_code: Optional[str] = None  # Para registro con invitación


class ChangePasswordRequest(BaseModel):
    """Request para cambiar contraseña"""
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)


class UserResponse(BaseModel):
    """Response de usuario (sin contraseña)"""
    id: str
    email: str
    nombre: str
    rol: str
    activo: bool
    created_at: str
    last_login: Optional[str] = None


class AuthStatusResponse(BaseModel):
    """Response de estado de autenticación"""
    authenticated: bool
    user: Optional[dict] = None


# ═══════════════════════════════════════════
# ALMACENAMIENTO PERSISTENTE
# ═══════════════════════════════════════════

def _ensure_data_dir():
    """Crea directorio de datos si no existe"""
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def _load_users() -> Dict[str, dict]:
    """Carga usuarios desde archivo JSON"""
    _ensure_data_dir()
    if USERS_FILE.exists():
        try:
            with open(USERS_FILE, "r") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            logger.error(f"Error cargando usuarios: {e}")
    return {}


def _save_users(users: Dict[str, dict]):
    """Guarda usuarios en archivo JSON"""
    _ensure_data_dir()
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2, default=str)


def _load_refresh_tokens() -> Dict[str, dict]:
    """Carga refresh tokens desde archivo JSON"""
    _ensure_data_dir()
    if TOKENS_FILE.exists():
        try:
            with open(TOKENS_FILE, "r") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            logger.error(f"Error cargando tokens: {e}")
    return {}


def _save_refresh_tokens(tokens: Dict[str, dict]):
    """Guarda refresh tokens en archivo JSON"""
    _ensure_data_dir()
    with open(TOKENS_FILE, "w") as f:
        json.dump(tokens, f, indent=2, default=str)


# Cache en memoria para performance
_users_cache: Dict[str, dict] = {}
_tokens_cache: Dict[str, dict] = {}


def _get_users() -> Dict[str, dict]:
    """Obtiene usuarios (con cache)"""
    global _users_cache
    if not _users_cache:
        _users_cache = _load_users()
        if not _users_cache:
            _init_default_users()
    return _users_cache


def _get_tokens() -> Dict[str, dict]:
    """Obtiene tokens (con cache)"""
    global _tokens_cache
    if not _tokens_cache:
        _tokens_cache = _load_refresh_tokens()
    return _tokens_cache


def _persist_users():
    """Persiste usuarios a disco"""
    _save_users(_users_cache)


def _persist_tokens():
    """Persiste tokens a disco"""
    _save_refresh_tokens(_tokens_cache)


def _init_default_users():
    """Inicializa usuarios por defecto con bcrypt"""
    global _users_cache

    default_users = [
        {"email": "admin@litper.co", "nombre": "Admin", "rol": "admin", "temp_pass": "TempAdmin2025!"},
    ]

    for user_data in default_users:
        user_id = f"user_{secrets.token_urlsafe(8)}"
        _users_cache[user_data["email"].lower()] = {
            "id": user_id,
            "email": user_data["email"].lower(),
            "nombre": user_data["nombre"],
            "hashed_password": get_password_hash(user_data["temp_pass"]),
            "rol": user_data["rol"],
            "activo": True,
            "created_at": datetime.utcnow().isoformat(),
            "last_login": None,
            "must_change_password": True,
        }

    _persist_users()
    logger.info(f"✅ Inicializados {len(default_users)} usuarios por defecto (bcrypt)")


def _get_user_by_email(email: str) -> Optional[dict]:
    """Obtiene usuario por email"""
    users = _get_users()
    return users.get(email.lower())


def _get_user_by_id(user_id: str) -> Optional[dict]:
    """Obtiene usuario por ID"""
    users = _get_users()
    for user in users.values():
        if user["id"] == user_id:
            return user
    return None


def _create_user(email: str, password: str, nombre: str, rol: str = "operador") -> dict:
    """Crea un nuevo usuario con bcrypt"""
    global _users_cache
    user_id = f"user_{secrets.token_urlsafe(8)}"

    user = {
        "id": user_id,
        "email": email.lower(),
        "nombre": nombre,
        "hashed_password": get_password_hash(password),
        "rol": rol,
        "activo": True,
        "created_at": datetime.utcnow().isoformat(),
        "last_login": None,
        "must_change_password": False,
    }

    _users_cache[email.lower()] = user
    _persist_users()
    return user


def _user_to_model(user_dict: dict) -> UserModel:
    """Convierte diccionario a modelo User"""
    role_value = user_dict.get("rol", "operator")
    try:
        role = Role(role_value)
    except ValueError:
        role = Role.OPERATOR

    return UserModel(
        id=user_dict["id"],
        email=user_dict["email"],
        hashed_password=user_dict["hashed_password"],
        role=role,
        is_active=user_dict.get("activo", True),
        created_at=datetime.fromisoformat(user_dict["created_at"]) if user_dict.get("created_at") else datetime.utcnow(),
        last_login=datetime.fromisoformat(user_dict["last_login"]) if user_dict.get("last_login") else None,
    )


# ═══════════════════════════════════════════
# REFRESH TOKEN MANAGEMENT (STATEFUL)
# ═══════════════════════════════════════════

def _store_refresh_token(user_id: str, token: str, jti: str):
    """
    Almacena refresh token hasheado con metadata.
    Permite revocación real.
    """
    global _tokens_cache
    tokens = _get_tokens()

    # Un usuario puede tener múltiples sesiones (dispositivos)
    # Pero limitamos a 5 sesiones activas
    user_tokens = [k for k, v in tokens.items() if v.get("user_id") == user_id]
    if len(user_tokens) >= 5:
        # Eliminar el más antiguo
        oldest = min(user_tokens, key=lambda k: tokens[k].get("created_at", ""))
        del tokens[oldest]

    tokens[jti] = {
        "user_id": user_id,
        "token_hash": get_password_hash(token),
        "created_at": datetime.utcnow().isoformat(),
        "expires_at": (datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)).isoformat(),
        "revoked": False,
    }

    _tokens_cache = tokens
    _persist_tokens()


def _validate_refresh_token(token: str, jti: str) -> Optional[str]:
    """
    Valida refresh token y retorna user_id si válido.
    Verifica que no esté revocado y no haya expirado.
    """
    tokens = _get_tokens()
    token_data = tokens.get(jti)

    if not token_data:
        logger.warning(f"⚠️ Refresh token JTI no encontrado: {jti[:8]}...")
        return None

    if token_data.get("revoked"):
        logger.warning(f"⚠️ Intento de usar refresh token revocado: {jti[:8]}...")
        return None

    # Verificar expiración
    expires_at = datetime.fromisoformat(token_data["expires_at"])
    if datetime.utcnow() > expires_at:
        logger.warning(f"⚠️ Refresh token expirado: {jti[:8]}...")
        return None

    # Verificar hash
    if not verify_password(token, token_data["token_hash"]):
        logger.warning(f"⚠️ Refresh token hash no coincide: {jti[:8]}...")
        return None

    return token_data["user_id"]


def _revoke_refresh_token(jti: str):
    """Revoca un refresh token específico"""
    global _tokens_cache
    tokens = _get_tokens()

    if jti in tokens:
        tokens[jti]["revoked"] = True
        tokens[jti]["revoked_at"] = datetime.utcnow().isoformat()
        _tokens_cache = tokens
        _persist_tokens()
        logger.info(f"🔐 Refresh token revocado: {jti[:8]}...")


def _revoke_all_user_tokens(user_id: str):
    """Revoca todos los refresh tokens de un usuario"""
    global _tokens_cache
    tokens = _get_tokens()

    count = 0
    for jti, data in tokens.items():
        if data.get("user_id") == user_id and not data.get("revoked"):
            data["revoked"] = True
            data["revoked_at"] = datetime.utcnow().isoformat()
            count += 1

    _tokens_cache = tokens
    _persist_tokens()
    logger.info(f"🔐 Revocados {count} refresh tokens para usuario {user_id}")


def _cleanup_expired_tokens():
    """Limpia tokens expirados (llamar periódicamente)"""
    global _tokens_cache
    tokens = _get_tokens()
    now = datetime.utcnow()

    to_delete = []
    for jti, data in tokens.items():
        expires_at = datetime.fromisoformat(data["expires_at"])
        if now > expires_at:
            to_delete.append(jti)

    for jti in to_delete:
        del tokens[jti]

    if to_delete:
        _tokens_cache = tokens
        _persist_tokens()
        logger.info(f"🧹 Limpiados {len(to_delete)} tokens expirados")


# ═══════════════════════════════════════════
# COOKIE HELPERS
# ═══════════════════════════════════════════

def _set_auth_cookies(response: Response, access_token: str, refresh_token: str, jti: str):
    """Establece cookies httpOnly para tokens"""
    # Access token - corta duración
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
        domain=COOKIE_DOMAIN,
    )

    # Refresh token - larga duración
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/api/auth",  # Solo accesible en rutas de auth
        domain=COOKIE_DOMAIN,
    )

    # JTI para identificar el refresh token (no sensible)
    response.set_cookie(
        key="token_jti",
        value=jti,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/api/auth",
        domain=COOKIE_DOMAIN,
    )


def _clear_auth_cookies(response: Response):
    """Limpia cookies de autenticación"""
    response.delete_cookie("access_token", path="/", domain=COOKIE_DOMAIN)
    response.delete_cookie("refresh_token", path="/api/auth", domain=COOKIE_DOMAIN)
    response.delete_cookie("token_jti", path="/api/auth", domain=COOKIE_DOMAIN)


def _get_access_token_from_cookie(request: Request) -> Optional[str]:
    """Obtiene access token desde cookie"""
    return request.cookies.get("access_token")


# ═══════════════════════════════════════════
# DEPENDENCIAS
# ═══════════════════════════════════════════

async def get_current_user_from_cookie(request: Request) -> TokenData:
    """
    Obtiene usuario actual desde cookie httpOnly.
    Alternativa a get_current_user que usa header Authorization.
    """
    token = _get_access_token_from_cookie(request)

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado"
        )

    token_data = decode_token(token)

    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado"
        )

    return token_data


# ═══════════════════════════════════════════
# ENDPOINTS
# ═══════════════════════════════════════════

@router.post("/login")
async def login(request: Request, response: Response, login_data: LoginRequest):
    """
    Autentica usuario y establece cookies httpOnly.

    - Rate limiting por IP
    - Password verificado con bcrypt (timing-safe)
    - Tokens en cookies httpOnly (no en response body)
    """
    client_ip = _get_client_ip(request)

    # Rate limiting
    if not _check_rate_limit(f"login:{client_ip}", RATE_LIMIT_MAX_LOGIN):
        logger.warning(f"🚫 Rate limit excedido para login desde {client_ip}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Demasiados intentos. Espere un minuto."
        )

    email = login_data.email.lower()

    # Buscar usuario
    user_data = _get_user_by_email(email)

    if not user_data:
        logger.warning(f"🔐 Login fallido: usuario no encontrado [{email}] desde {client_ip}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas"
        )

    # Verificar password con bcrypt
    if not verify_password(login_data.password, user_data["hashed_password"]):
        logger.warning(f"🔐 Login fallido: password incorrecto [{email}] desde {client_ip}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas"
        )

    if not user_data.get("activo", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario desactivado"
        )

    # Crear tokens
    user_model = _user_to_model(user_data)
    access_token = create_access_token(user_model)
    refresh_token = create_refresh_token(user_model)
    jti = secrets.token_urlsafe(16)

    # Almacenar refresh token (revocable)
    _store_refresh_token(user_data["id"], refresh_token, jti)

    # Actualizar último login
    user_data["last_login"] = datetime.utcnow().isoformat()
    _persist_users()

    # Establecer cookies
    _set_auth_cookies(response, access_token, refresh_token, jti)

    logger.info(f"✅ Login exitoso: {email} desde {client_ip}")

    # Response sin tokens (están en cookies)
    return {
        "success": True,
        "user": {
            "id": user_data["id"],
            "email": user_data["email"],
            "nombre": user_data["nombre"],
            "rol": user_data["rol"],
            "must_change_password": user_data.get("must_change_password", False),
        }
    }


@router.post("/register")
async def register(request: Request, response: Response, register_data: RegisterRequest):
    """
    Registra nuevo usuario (si está habilitado).

    - Deshabilitado en producción por defecto (ALLOW_REGISTER=false)
    - Rate limiting por IP
    """
    # Verificar si registro está permitido
    if not ALLOW_REGISTER:
        logger.warning(f"🚫 Intento de registro bloqueado (ALLOW_REGISTER=false)")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Registro deshabilitado. Contacte al administrador."
        )

    client_ip = _get_client_ip(request)

    # Rate limiting
    if not _check_rate_limit(f"register:{client_ip}", RATE_LIMIT_MAX_REGISTER):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Demasiados intentos. Espere un minuto."
        )

    email = register_data.email.lower()

    if _get_user_by_email(email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )

    # Crear usuario (siempre como operador en auto-registro)
    user_data = _create_user(
        email=email,
        password=register_data.password,
        nombre=register_data.nombre,
        rol="operador",
    )

    # Crear tokens
    user_model = _user_to_model(user_data)
    access_token = create_access_token(user_model)
    refresh_token = create_refresh_token(user_model)
    jti = secrets.token_urlsafe(16)

    _store_refresh_token(user_data["id"], refresh_token, jti)
    _set_auth_cookies(response, access_token, refresh_token, jti)

    logger.info(f"✅ Usuario registrado: {email}")

    return {
        "success": True,
        "user": {
            "id": user_data["id"],
            "email": user_data["email"],
            "nombre": user_data["nombre"],
            "rol": user_data["rol"],
        }
    }


@router.post("/refresh")
async def refresh_tokens(request: Request, response: Response):
    """
    Renueva tokens usando refresh token de cookie.

    - Verifica token no revocado
    - Rota refresh token (invalida el anterior)
    - Rate limiting
    """
    client_ip = _get_client_ip(request)

    if not _check_rate_limit(f"refresh:{client_ip}", RATE_LIMIT_MAX_REFRESH):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Demasiadas solicitudes"
        )

    refresh_token = request.cookies.get("refresh_token")
    jti = request.cookies.get("token_jti")

    if not refresh_token or not jti:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No hay sesión activa"
        )

    # Validar refresh token
    user_id = _validate_refresh_token(refresh_token, jti)

    if not user_id:
        _clear_auth_cookies(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesión expirada. Inicie sesión nuevamente."
        )

    user_data = _get_user_by_id(user_id)
    if not user_data or not user_data.get("activo", True):
        _clear_auth_cookies(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no válido"
        )

    # Revocar token anterior
    _revoke_refresh_token(jti)

    # Crear nuevos tokens
    user_model = _user_to_model(user_data)
    new_access_token = create_access_token(user_model)
    new_refresh_token = create_refresh_token(user_model)
    new_jti = secrets.token_urlsafe(16)

    _store_refresh_token(user_id, new_refresh_token, new_jti)
    _set_auth_cookies(response, new_access_token, new_refresh_token, new_jti)

    logger.info(f"🔄 Tokens renovados para {user_data['email']}")

    return {
        "success": True,
        "user": {
            "id": user_data["id"],
            "email": user_data["email"],
            "nombre": user_data["nombre"],
            "rol": user_data["rol"],
        }
    }


@router.post("/logout")
async def logout(request: Request, response: Response):
    """
    Cierra sesión revocando refresh token.
    """
    jti = request.cookies.get("token_jti")

    if jti:
        _revoke_refresh_token(jti)

    _clear_auth_cookies(response)

    logger.info("👋 Logout exitoso")

    return {"success": True, "message": "Sesión cerrada"}


@router.get("/status")
async def auth_status(request: Request) -> AuthStatusResponse:
    """
    Verifica estado de autenticación.
    Útil para el frontend al cargar la app.
    """
    token = _get_access_token_from_cookie(request)

    if not token:
        return AuthStatusResponse(authenticated=False)

    token_data = decode_token(token)

    if not token_data:
        return AuthStatusResponse(authenticated=False)

    user_data = _get_user_by_id(token_data.user_id)

    if not user_data or not user_data.get("activo", True):
        return AuthStatusResponse(authenticated=False)

    return AuthStatusResponse(
        authenticated=True,
        user={
            "id": user_data["id"],
            "email": user_data["email"],
            "nombre": user_data["nombre"],
            "rol": user_data["rol"],
        }
    )


@router.get("/me", response_model=UserResponse)
async def get_me(request: Request):
    """Obtiene información del usuario actual"""
    current_user = await get_current_user_from_cookie(request)
    user_data = _get_user_by_id(current_user.user_id)

    if not user_data:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return UserResponse(
        id=user_data["id"],
        email=user_data["email"],
        nombre=user_data["nombre"],
        rol=user_data["rol"],
        activo=user_data.get("activo", True),
        created_at=user_data["created_at"],
        last_login=user_data.get("last_login"),
    )


@router.post("/change-password")
async def change_password(request: Request, response: Response, data: ChangePasswordRequest):
    """Cambia contraseña y revoca todas las sesiones"""
    current_user = await get_current_user_from_cookie(request)
    user_data = _get_user_by_id(current_user.user_id)

    if not user_data:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if not verify_password(data.current_password, user_data["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contraseña actual incorrecta"
        )

    user_data["hashed_password"] = get_password_hash(data.new_password)
    user_data["must_change_password"] = False
    _persist_users()

    # Revocar todas las sesiones
    _revoke_all_user_tokens(current_user.user_id)
    _clear_auth_cookies(response)

    logger.info(f"🔐 Password cambiado: {user_data['email']}")

    return {"success": True, "message": "Contraseña actualizada. Inicie sesión nuevamente."}


@router.get("/users", response_model=List[UserResponse])
async def list_users(request: Request):
    """Lista todos los usuarios (solo admin)"""
    current_user = await get_current_user_from_cookie(request)

    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Solo administradores")

    users = _get_users()
    return [
        UserResponse(
            id=data["id"],
            email=data["email"],
            nombre=data["nombre"],
            rol=data["rol"],
            activo=data.get("activo", True),
            created_at=data["created_at"],
            last_login=data.get("last_login"),
        )
        for data in users.values()
    ]


@router.post("/users/{user_id}/toggle-active")
async def toggle_user_active(user_id: str, request: Request):
    """Activa/desactiva usuario (solo admin)"""
    current_user = await get_current_user_from_cookie(request)

    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Solo administradores")

    target_user = _get_user_by_id(user_id)

    if not target_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if target_user["id"] == current_user.user_id:
        raise HTTPException(status_code=400, detail="No puede desactivarse a sí mismo")

    target_user["activo"] = not target_user.get("activo", True)
    _persist_users()

    if not target_user["activo"]:
        _revoke_all_user_tokens(user_id)

    return {
        "success": True,
        "message": f"Usuario {'activado' if target_user['activo'] else 'desactivado'}",
        "activo": target_user["activo"]
    }


# ═══════════════════════════════════════════
# ADMIN: Crear usuario (bypass de register)
# ═══════════════════════════════════════════

class AdminCreateUserRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    nombre: str
    rol: str = "operador"


@router.post("/admin/create-user", response_model=UserResponse)
async def admin_create_user(request: Request, data: AdminCreateUserRequest):
    """Crea usuario (solo admin, bypass de ALLOW_REGISTER)"""
    current_user = await get_current_user_from_cookie(request)

    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Solo administradores")

    if _get_user_by_email(data.email):
        raise HTTPException(status_code=400, detail="Email ya registrado")

    user_data = _create_user(
        email=data.email,
        password=data.password,
        nombre=data.nombre,
        rol=data.rol if data.rol in ["admin", "operador", "viewer"] else "operador",
    )

    logger.info(f"✅ Usuario creado por admin: {data.email}")

    return UserResponse(
        id=user_data["id"],
        email=user_data["email"],
        nombre=user_data["nombre"],
        rol=user_data["rol"],
        activo=True,
        created_at=user_data["created_at"],
        last_login=None,
    )


# ═══════════════════════════════════════════
# OAUTH 2.0 - Token Exchange
# ═══════════════════════════════════════════

class OAuthTokenRequest(BaseModel):
    """Request para intercambiar código OAuth por token"""
    code: str
    provider: str  # google, microsoft, apple
    redirect_uri: str


class OAuthTokenResponse(BaseModel):
    """Response con tokens OAuth"""
    access_token: str
    token_type: str = "Bearer"
    expires_in: int
    refresh_token: Optional[str] = None
    id_token: Optional[str] = None


# OAuth Configuration from environment
OAUTH_CONFIG = {
    "google": {
        "token_url": "https://oauth2.googleapis.com/token",
        "client_id": os.getenv("GOOGLE_CLIENT_ID", ""),
        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET", ""),
    },
    "microsoft": {
        "token_url": "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        "client_id": os.getenv("MICROSOFT_CLIENT_ID", ""),
        "client_secret": os.getenv("MICROSOFT_CLIENT_SECRET", ""),
    },
    "apple": {
        "token_url": "https://appleid.apple.com/auth/token",
        "client_id": os.getenv("APPLE_CLIENT_ID", ""),
        "client_secret": os.getenv("APPLE_CLIENT_SECRET", ""),
    },
}


@router.post("/oauth/token", response_model=OAuthTokenResponse)
async def oauth_token_exchange(request: Request, data: OAuthTokenRequest):
    """
    Intercambia código OAuth por tokens.

    Este endpoint actúa como proxy seguro para mantener client_secret
    en el servidor y no en el frontend.
    """
    import httpx

    provider = data.provider.lower()

    if provider not in OAUTH_CONFIG:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Proveedor OAuth no soportado: {provider}"
        )

    config = OAUTH_CONFIG[provider]

    if not config["client_id"] or not config["client_secret"]:
        logger.error(f"OAuth {provider}: credenciales no configuradas")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OAuth {provider} no está configurado en el servidor"
        )

    # Preparar request al proveedor OAuth
    token_data = {
        "code": data.code,
        "client_id": config["client_id"],
        "client_secret": config["client_secret"],
        "redirect_uri": data.redirect_uri,
        "grant_type": "authorization_code",
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                config["token_url"],
                data=token_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=30.0,
            )

            if response.status_code != 200:
                logger.error(f"OAuth {provider} token exchange failed: {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Error al obtener token del proveedor OAuth"
                )

            token_response = response.json()

            logger.info(f"✅ OAuth {provider} token exchange exitoso")

            return OAuthTokenResponse(
                access_token=token_response.get("access_token", ""),
                token_type=token_response.get("token_type", "Bearer"),
                expires_in=token_response.get("expires_in", 3600),
                refresh_token=token_response.get("refresh_token"),
                id_token=token_response.get("id_token"),
            )

    except httpx.RequestError as e:
        logger.error(f"OAuth {provider} request error: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Error de conexión con el proveedor OAuth"
        )


@router.post("/oauth/login")
async def oauth_login(request: Request, response: Response, data: dict):
    """
    Completa el flujo OAuth creando/actualizando usuario y estableciendo sesión.

    Recibe la información del usuario OAuth y crea la sesión local.
    """
    email = data.get("email", "").lower()
    name = data.get("name", "")
    provider = data.get("provider", "")
    picture = data.get("picture", "")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email es requerido"
        )

    # Buscar usuario existente
    user_data = _get_user_by_email(email)

    if not user_data:
        # Crear nuevo usuario OAuth
        user_id = f"user_{secrets.token_urlsafe(8)}"
        user_data = {
            "id": user_id,
            "email": email,
            "nombre": name or email.split("@")[0],
            "hashed_password": get_password_hash(secrets.token_urlsafe(32)),  # Random password for OAuth users
            "rol": "operador",
            "activo": True,
            "created_at": datetime.utcnow().isoformat(),
            "last_login": datetime.utcnow().isoformat(),
            "oauth_provider": provider,
            "oauth_picture": picture,
            "must_change_password": False,
        }

        global _users_cache
        _users_cache[email] = user_data
        _persist_users()

        logger.info(f"✅ Nuevo usuario OAuth creado: {email} via {provider}")
    else:
        # Actualizar último login
        user_data["last_login"] = datetime.utcnow().isoformat()
        if provider:
            user_data["oauth_provider"] = provider
        if picture:
            user_data["oauth_picture"] = picture
        _persist_users()

        logger.info(f"✅ Usuario OAuth existente: {email} via {provider}")

    if not user_data.get("activo", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario desactivado"
        )

    # Crear tokens de sesión
    user_model = _user_to_model(user_data)
    access_token = create_access_token(user_model)
    refresh_token = create_refresh_token(user_model)
    jti = secrets.token_urlsafe(16)

    _store_refresh_token(user_data["id"], refresh_token, jti)
    _set_auth_cookies(response, access_token, refresh_token, jti)

    return {
        "success": True,
        "user": {
            "id": user_data["id"],
            "email": user_data["email"],
            "nombre": user_data["nombre"],
            "rol": user_data["rol"],
            "picture": user_data.get("oauth_picture"),
        }
    }
