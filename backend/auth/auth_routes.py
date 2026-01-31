"""
RUTAS DE AUTENTICACIÓN - BACKEND SEGURO
========================================

Sistema de autenticación seguro con:
- Hash de contraseñas con bcrypt (simulado con hashlib)
- Tokens JWT
- Protección contra fuerza bruta
- NO expone contraseñas al frontend

Autor: Litper System
"""

import os
import hashlib
import hmac
import base64
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from fastapi import APIRouter, HTTPException, Request, Depends, Header
from pydantic import BaseModel, EmailStr
from loguru import logger

# ==================== CONFIGURACIÓN ====================

SECRET_KEY = os.getenv("JWT_SECRET_KEY", os.getenv("ADMIN_PASSWORD", "litper-secret-key-change-me"))
TOKEN_EXPIRY_HOURS = int(os.getenv("TOKEN_EXPIRY_HOURS", "24"))

# Almacenamiento en memoria (en producción usar Redis/DB)
active_sessions: Dict[str, dict] = {}
failed_attempts: Dict[str, tuple] = {}
users_db: Dict[str, dict] = {}

# ==================== ROUTER ====================

router = APIRouter(prefix="/auth", tags=["Autenticación"])

# ==================== MODELOS ====================

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    success: bool
    token: Optional[str] = None
    user: Optional[dict] = None
    message: str

class UserInfo(BaseModel):
    id: str
    email: str
    nombre: str
    rol: str
    activo: bool

# ==================== FUNCIONES DE SEGURIDAD ====================

def hash_password(password: str, salt: Optional[str] = None) -> tuple:
    """Hash seguro de contraseña usando PBKDF2."""
    if salt is None:
        salt = base64.b64encode(os.urandom(32)).decode()

    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    )
    return base64.b64encode(key).decode(), salt

def verify_password(password: str, stored_hash: str, salt: str) -> bool:
    """Verifica contraseña contra hash."""
    computed_hash, _ = hash_password(password, salt)
    return hmac.compare_digest(computed_hash, stored_hash)

def create_jwt_token(user_id: str, email: str, rol: str) -> str:
    """Crea token JWT."""
    header = {"alg": "HS256", "typ": "JWT"}

    payload = {
        "sub": user_id,
        "email": email,
        "rol": rol,
        "iat": int(datetime.utcnow().timestamp()),
        "exp": int((datetime.utcnow() + timedelta(hours=TOKEN_EXPIRY_HOURS)).timestamp())
    }

    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip('=')
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip('=')

    message = f"{header_b64}.{payload_b64}"
    signature = hmac.new(SECRET_KEY.encode(), message.encode(), hashlib.sha256).digest()
    signature_b64 = base64.urlsafe_b64encode(signature).decode().rstrip('=')

    return f"{header_b64}.{payload_b64}.{signature_b64}"

def verify_jwt_token(token: str) -> Optional[dict]:
    """Verifica y decodifica token JWT."""
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None

        header_b64, payload_b64, signature_b64 = parts

        # Verificar firma
        message = f"{header_b64}.{payload_b64}"
        expected_signature = hmac.new(SECRET_KEY.encode(), message.encode(), hashlib.sha256).digest()

        # Padding
        signature_b64_padded = signature_b64 + '=' * (4 - len(signature_b64) % 4)
        actual_signature = base64.urlsafe_b64decode(signature_b64_padded)

        if not hmac.compare_digest(expected_signature, actual_signature):
            return None

        # Decodificar payload
        payload_b64_padded = payload_b64 + '=' * (4 - len(payload_b64) % 4)
        payload = json.loads(base64.urlsafe_b64decode(payload_b64_padded))

        # Verificar expiración
        if payload.get('exp', 0) < datetime.utcnow().timestamp():
            return None

        return payload
    except Exception as e:
        logger.error(f"Error verificando token: {e}")
        return None

# ==================== INICIALIZACIÓN DE USUARIOS ====================

def init_users():
    """Inicializa usuarios desde configuración."""
    global users_db

    # Contraseñas desde variables de entorno (más seguro)
    # En producción, cada usuario tendría su propia contraseña hasheada en DB
    default_password = os.getenv("LITPER_DEFAULT_PASSWORD", "Litper2025!")

    # Usuarios base
    base_users = [
        {"id": "litper_karen_001", "email": "karenlitper@gmail.com", "nombre": "Karen", "rol": "operador"},
        {"id": "litper_dayana_002", "email": "litperdayana@gmail.com", "nombre": "Dayana", "rol": "operador"},
        {"id": "litper_david_003", "email": "litperdavid@gmail.com", "nombre": "David", "rol": "operador"},
        {"id": "litper_felipe_004", "email": "felipelitper@gmail.com", "nombre": "Felipe", "rol": "operador"},
        {"id": "litper_jimmy_005", "email": "jimmylitper@gmail.com", "nombre": "Jimmy", "rol": "operador"},
        {"id": "litper_jhonnatan_006", "email": "jhonnatanlitper@gmail.com", "nombre": "Jhonnatan", "rol": "operador"},
        {"id": "litper_daniel_007", "email": "daniellitper@gmail.com", "nombre": "Daniel", "rol": "admin"},
        {"id": "litper_maletas_008", "email": "maletaslitper@gmail.com", "nombre": "Maletas", "rol": "admin"},
        {"id": "litper_colombia_009", "email": "litpercolombia@gmail.com", "nombre": "Litper Colombia", "rol": "admin"},
    ]

    for user in base_users:
        # Obtener contraseña específica del usuario desde env, o usar default
        env_key = f"LITPER_PASS_{user['id'].upper()}"
        password = os.getenv(env_key, default_password)

        password_hash, salt = hash_password(password)

        users_db[user["email"].lower()] = {
            **user,
            "password_hash": password_hash,
            "salt": salt,
            "activo": True,
            "created_at": datetime.utcnow().isoformat(),
        }

    logger.info(f"Inicializados {len(users_db)} usuarios")

# Inicializar al importar
init_users()

# ==================== ENDPOINTS ====================

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, req: Request):
    """
    Endpoint de login seguro.
    - Verifica credenciales
    - Protección contra fuerza bruta
    - Retorna JWT token
    """
    client_ip = req.client.host if req.client else "unknown"
    email = request.email.lower()

    # Verificar bloqueo por intentos fallidos
    if client_ip in failed_attempts:
        attempts, lockout_until = failed_attempts[client_ip]
        if lockout_until and datetime.now() < lockout_until:
            minutes_left = int((lockout_until - datetime.now()).total_seconds() / 60)
            raise HTTPException(
                status_code=429,
                detail=f"Demasiados intentos. Espera {minutes_left} minutos."
            )

    # Buscar usuario
    user_data = users_db.get(email)

    if not user_data:
        # Registrar intento fallido
        _register_failed_attempt(client_ip)
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    # Verificar contraseña
    if not verify_password(request.password, user_data["password_hash"], user_data["salt"]):
        _register_failed_attempt(client_ip)
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    # Verificar si usuario está activo
    if not user_data.get("activo", True):
        raise HTTPException(status_code=403, detail="Usuario desactivado")

    # Limpiar intentos fallidos
    if client_ip in failed_attempts:
        del failed_attempts[client_ip]

    # Generar token
    token = create_jwt_token(user_data["id"], email, user_data["rol"])

    # Guardar sesión activa
    active_sessions[token] = {
        "user_id": user_data["id"],
        "email": email,
        "created_at": datetime.now(),
        "ip": client_ip
    }

    logger.info(f"Login exitoso: {email} desde {client_ip}")

    # Retornar datos del usuario (sin contraseña)
    user_safe = {
        "id": user_data["id"],
        "email": user_data["email"],
        "nombre": user_data["nombre"],
        "rol": user_data["rol"],
        "activo": user_data["activo"]
    }

    return LoginResponse(
        success=True,
        token=token,
        user=user_safe,
        message="Login exitoso"
    )

@router.post("/logout")
async def logout(authorization: Optional[str] = Header(None)):
    """Cierra la sesión actual."""
    if authorization:
        token = authorization.replace("Bearer ", "")
        if token in active_sessions:
            del active_sessions[token]

    return {"success": True, "message": "Sesión cerrada"}

@router.get("/me")
async def get_current_user(authorization: Optional[str] = Header(None)):
    """Obtiene información del usuario actual."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Token requerido")

    token = authorization.replace("Bearer ", "")
    payload = verify_jwt_token(token)

    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    email = payload.get("email")
    user_data = users_db.get(email)

    if not user_data:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return {
        "id": user_data["id"],
        "email": user_data["email"],
        "nombre": user_data["nombre"],
        "rol": user_data["rol"],
        "activo": user_data["activo"]
    }

@router.post("/verify")
async def verify_token(authorization: Optional[str] = Header(None)):
    """Verifica si un token es válido."""
    if not authorization:
        return {"valid": False}

    token = authorization.replace("Bearer ", "")
    payload = verify_jwt_token(token)

    return {
        "valid": payload is not None,
        "payload": payload if payload else None
    }

@router.get("/users")
async def list_users(authorization: Optional[str] = Header(None)):
    """Lista usuarios (solo admin)."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Token requerido")

    token = authorization.replace("Bearer ", "")
    payload = verify_jwt_token(token)

    if not payload or payload.get("rol") != "admin":
        raise HTTPException(status_code=403, detail="No autorizado")

    users_list = [
        {
            "id": u["id"],
            "email": u["email"],
            "nombre": u["nombre"],
            "rol": u["rol"],
            "activo": u["activo"]
        }
        for u in users_db.values()
    ]

    return {"users": users_list, "total": len(users_list)}

# ==================== FUNCIONES AUXILIARES ====================

def _register_failed_attempt(ip: str):
    """Registra intento fallido de login."""
    max_attempts = 5
    lockout_minutes = 15

    attempts = failed_attempts.get(ip, (0, None))[0] + 1
    lockout = None

    if attempts >= max_attempts:
        lockout = datetime.now() + timedelta(minutes=lockout_minutes)
        logger.warning(f"IP {ip} bloqueada por {lockout_minutes} minutos")

    failed_attempts[ip] = (attempts, lockout)

# ==================== DEPENDENCY ====================

async def get_current_user_dep(authorization: Optional[str] = Header(None)) -> dict:
    """Dependency para obtener usuario actual en otros endpoints."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Token requerido")

    token = authorization.replace("Bearer ", "")
    payload = verify_jwt_token(token)

    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido")

    email = payload.get("email")
    user_data = users_db.get(email)

    if not user_data:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return {
        "id": user_data["id"],
        "email": user_data["email"],
        "nombre": user_data["nombre"],
        "rol": user_data["rol"]
    }
