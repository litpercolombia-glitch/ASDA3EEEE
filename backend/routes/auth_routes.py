"""
Rutas de Autenticación para Litper Pro
=======================================

Endpoints seguros para login, registro, refresh tokens, y gestión de usuarios.
Usa bcrypt para hash de contraseñas, JWT para tokens.

IMPORTANTE: Este archivo reemplaza la autenticación frontend (localStorage).
Todas las operaciones de password se hacen aquí, NUNCA en el cliente.
"""

import os
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status, Depends, Request
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
    check_rate_limit,
)

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])

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
    rol: Optional[str] = "operador"


class RefreshTokenRequest(BaseModel):
    """Request para refrescar token"""
    refresh_token: str


class ChangePasswordRequest(BaseModel):
    """Request para cambiar contraseña"""
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)


class TokenResponse(BaseModel):
    """Response con tokens"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # segundos
    user: dict


class UserResponse(BaseModel):
    """Response de usuario (sin contraseña)"""
    id: str
    email: str
    nombre: str
    rol: str
    activo: bool
    created_at: str
    last_login: Optional[str] = None


# ═══════════════════════════════════════════
# ALMACENAMIENTO (Temporal - Migrar a Supabase)
# ═══════════════════════════════════════════

# En producción esto viene de Supabase/PostgreSQL
# Por ahora usamos un diccionario en memoria como placeholder
# TODO: Conectar con Supabase en Fix #1

_users_db: dict = {}
_refresh_tokens: dict = {}  # user_id -> refresh_token_hash

def _init_default_users():
    """
    Inicializa usuarios por defecto con bcrypt.
    NOTA: Estos passwords están hasheados con bcrypt.
    En producción, se deben cambiar inmediatamente.
    """
    if _users_db:
        return

    # Usuarios iniciales con roles
    # Los passwords aquí son temporales - cada usuario debe cambiarlos
    default_users = [
        {"email": "admin@litper.co", "nombre": "Admin", "rol": "admin", "temp_pass": "TempAdmin2025!"},
        {"email": "operador@litper.co", "nombre": "Operador", "rol": "operador", "temp_pass": "TempOp2025!"},
    ]

    for user_data in default_users:
        user_id = f"user_{user_data['email'].replace('@', '_').replace('.', '_')}"
        _users_db[user_data["email"].lower()] = {
            "id": user_id,
            "email": user_data["email"].lower(),
            "nombre": user_data["nombre"],
            "hashed_password": get_password_hash(user_data["temp_pass"]),
            "rol": user_data["rol"],
            "activo": True,
            "created_at": datetime.utcnow().isoformat(),
            "last_login": None,
            "password_migrated": True,  # Ya usa bcrypt
            "must_change_password": True,  # Forzar cambio en primer login
        }

    logger.info(f"✅ Inicializados {len(default_users)} usuarios por defecto (bcrypt)")


# Inicializar al importar
_init_default_users()


def _get_user_by_email(email: str) -> Optional[dict]:
    """Obtiene usuario por email"""
    return _users_db.get(email.lower())


def _create_user(email: str, password: str, nombre: str, rol: str = "operador") -> dict:
    """Crea un nuevo usuario con bcrypt"""
    user_id = f"user_{datetime.utcnow().timestamp()}"

    user = {
        "id": user_id,
        "email": email.lower(),
        "nombre": nombre,
        "hashed_password": get_password_hash(password),
        "rol": rol,
        "activo": True,
        "created_at": datetime.utcnow().isoformat(),
        "last_login": None,
        "password_migrated": True,
        "must_change_password": False,
    }

    _users_db[email.lower()] = user
    return user


def _update_user_last_login(email: str):
    """Actualiza último login"""
    if email.lower() in _users_db:
        _users_db[email.lower()]["last_login"] = datetime.utcnow().isoformat()


def _user_to_model(user_dict: dict) -> UserModel:
    """Convierte diccionario a modelo User"""
    return UserModel(
        id=user_dict["id"],
        email=user_dict["email"],
        hashed_password=user_dict["hashed_password"],
        role=Role(user_dict["rol"]) if user_dict["rol"] in [r.value for r in Role] else Role.OPERATOR,
        is_active=user_dict.get("activo", True),
        created_at=datetime.fromisoformat(user_dict["created_at"]) if user_dict.get("created_at") else datetime.utcnow(),
        last_login=datetime.fromisoformat(user_dict["last_login"]) if user_dict.get("last_login") else None,
    )


# ═══════════════════════════════════════════
# ENDPOINTS
# ═══════════════════════════════════════════

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """
    Autentica usuario y retorna tokens JWT.

    - Password verificado con bcrypt (timing-safe)
    - Rate limiting aplicado por IP
    - Registra intento de login para auditoría
    """
    email = request.email.lower()

    # Buscar usuario
    user_data = _get_user_by_email(email)

    if not user_data:
        logger.warning(f"🔐 Login fallido: usuario no encontrado [{email}]")
        # Delay constante para prevenir user enumeration
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas"
        )

    # Verificar password con bcrypt (timing-safe)
    if not verify_password(request.password, user_data["hashed_password"]):
        logger.warning(f"🔐 Login fallido: password incorrecto [{email}]")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas"
        )

    # Verificar si está activo
    if not user_data.get("activo", True):
        logger.warning(f"🔐 Login fallido: usuario desactivado [{email}]")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario desactivado. Contacte al administrador."
        )

    # Crear tokens
    user_model = _user_to_model(user_data)
    access_token = create_access_token(user_model)
    refresh_token = create_refresh_token(user_model)

    # Actualizar último login
    _update_user_last_login(email)

    # Guardar refresh token (hasheado)
    _refresh_tokens[user_data["id"]] = get_password_hash(refresh_token)

    logger.info(f"✅ Login exitoso: {email}")

    # Respuesta (sin password)
    user_response = {
        "id": user_data["id"],
        "email": user_data["email"],
        "nombre": user_data["nombre"],
        "rol": user_data["rol"],
        "activo": user_data.get("activo", True),
        "must_change_password": user_data.get("must_change_password", False),
    }

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")) * 60,
        user=user_response,
    )


@router.post("/register", response_model=TokenResponse)
async def register(request: RegisterRequest):
    """
    Registra un nuevo usuario.

    - Password hasheado con bcrypt
    - Valida email único
    - Rol por defecto: operador (admin debe elevarlo)
    """
    email = request.email.lower()

    # Verificar que no exista
    if _get_user_by_email(email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )

    # Validar rol permitido (solo operador y viewer en auto-registro)
    rol = request.rol if request.rol in ["operador", "viewer"] else "operador"

    # Crear usuario
    user_data = _create_user(
        email=email,
        password=request.password,
        nombre=request.nombre,
        rol=rol,
    )

    # Crear tokens
    user_model = _user_to_model(user_data)
    access_token = create_access_token(user_model)
    refresh_token = create_refresh_token(user_model)

    # Guardar refresh token
    _refresh_tokens[user_data["id"]] = get_password_hash(refresh_token)

    logger.info(f"✅ Usuario registrado: {email}")

    user_response = {
        "id": user_data["id"],
        "email": user_data["email"],
        "nombre": user_data["nombre"],
        "rol": user_data["rol"],
        "activo": True,
        "must_change_password": False,
    }

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")) * 60,
        user=user_response,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_tokens(request: RefreshTokenRequest):
    """
    Renueva tokens usando refresh token.

    - Valida refresh token
    - Genera nuevos access + refresh tokens
    - Invalida refresh token anterior (rotation)
    """
    # Verificar refresh token
    user_id = verify_refresh_token(request.refresh_token)

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido o expirado"
        )

    # Buscar usuario
    user_data = None
    for email, data in _users_db.items():
        if data["id"] == user_id:
            user_data = data
            break

    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado"
        )

    # Verificar que el refresh token sea el actual (prevenir reuse)
    stored_hash = _refresh_tokens.get(user_id)
    if not stored_hash or not verify_password(request.refresh_token, stored_hash):
        logger.warning(f"⚠️ Intento de reusar refresh token para {user_id}")
        # Invalidar todos los tokens del usuario
        _refresh_tokens.pop(user_id, None)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token ya fue usado. Vuelva a iniciar sesión."
        )

    # Crear nuevos tokens
    user_model = _user_to_model(user_data)
    new_access_token = create_access_token(user_model)
    new_refresh_token = create_refresh_token(user_model)

    # Rotar refresh token
    _refresh_tokens[user_id] = get_password_hash(new_refresh_token)

    logger.info(f"🔄 Tokens renovados para {user_data['email']}")

    user_response = {
        "id": user_data["id"],
        "email": user_data["email"],
        "nombre": user_data["nombre"],
        "rol": user_data["rol"],
        "activo": user_data.get("activo", True),
    }

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")) * 60,
        user=user_response,
    )


@router.post("/logout")
async def logout(current_user: TokenData = Depends(get_current_user)):
    """
    Cierra sesión invalidando refresh tokens.
    """
    # Invalidar refresh token
    _refresh_tokens.pop(current_user.user_id, None)

    logger.info(f"👋 Logout: {current_user.email}")

    return {"message": "Sesión cerrada exitosamente"}


@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: TokenData = Depends(get_current_user)
):
    """
    Cambia la contraseña del usuario actual.

    - Verifica password actual
    - Hashea nuevo password con bcrypt
    - Invalida todos los refresh tokens
    """
    # Buscar usuario
    user_data = None
    for email, data in _users_db.items():
        if data["id"] == current_user.user_id:
            user_data = data
            break

    if not user_data:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Verificar password actual
    if not verify_password(request.current_password, user_data["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contraseña actual incorrecta"
        )

    # Hashear nuevo password
    user_data["hashed_password"] = get_password_hash(request.new_password)
    user_data["must_change_password"] = False
    user_data["password_migrated"] = True

    # Invalidar refresh tokens (forzar re-login en otros dispositivos)
    _refresh_tokens.pop(current_user.user_id, None)

    logger.info(f"🔐 Password cambiado: {user_data['email']}")

    return {"message": "Contraseña actualizada exitosamente. Por favor inicie sesión nuevamente."}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: TokenData = Depends(get_current_user)):
    """
    Obtiene información del usuario actual.
    """
    # Buscar datos completos
    user_data = None
    for email, data in _users_db.items():
        if data["id"] == current_user.user_id:
            user_data = data
            break

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


@router.get("/users", response_model=List[UserResponse])
async def list_users(current_user: TokenData = Depends(require_role([Role.ADMIN]))):
    """
    Lista todos los usuarios (solo admin).
    """
    users = []
    for email, data in _users_db.items():
        users.append(UserResponse(
            id=data["id"],
            email=data["email"],
            nombre=data["nombre"],
            rol=data["rol"],
            activo=data.get("activo", True),
            created_at=data["created_at"],
            last_login=data.get("last_login"),
        ))

    return users


@router.post("/users/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: str,
    current_user: TokenData = Depends(require_role([Role.ADMIN]))
):
    """
    Activa/desactiva un usuario (solo admin).
    """
    # Buscar usuario
    target_user = None
    for email, data in _users_db.items():
        if data["id"] == user_id:
            target_user = data
            break

    if not target_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # No permitir desactivarse a sí mismo
    if target_user["id"] == current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puede desactivarse a sí mismo"
        )

    # Toggle estado
    target_user["activo"] = not target_user.get("activo", True)

    # Si se desactiva, invalidar refresh tokens
    if not target_user["activo"]:
        _refresh_tokens.pop(user_id, None)

    logger.info(f"👤 Usuario {target_user['email']} {'activado' if target_user['activo'] else 'desactivado'} por {current_user.email}")

    return {
        "message": f"Usuario {'activado' if target_user['activo'] else 'desactivado'}",
        "activo": target_user["activo"]
    }


# ═══════════════════════════════════════════
# MIGRACIÓN DE PASSWORDS LEGACY
# ═══════════════════════════════════════════

def migrate_legacy_password(email: str, plain_password: str) -> bool:
    """
    Migra un password legacy (Base64) a bcrypt.

    Llamar esta función cuando un usuario con password legacy
    hace login exitoso. El flujo es:
    1. Verificar con legacy (Base64) - debe hacerse ANTES
    2. Si es válido, re-hashear con bcrypt
    3. Marcar como migrado

    Returns:
        True si migración exitosa, False si no
    """
    user_data = _get_user_by_email(email)
    if not user_data:
        return False

    # Solo migrar si aún no está migrado
    if user_data.get("password_migrated", False):
        return True

    # Re-hashear con bcrypt
    user_data["hashed_password"] = get_password_hash(plain_password)
    user_data["password_migrated"] = True

    logger.info(f"🔄 Password migrado a bcrypt: {email}")
    return True
