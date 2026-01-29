"""
SISTEMA DE AUTENTICACION SEGURO
===============================

Implementa autenticacion con:
- Hash de contraseñas con bcrypt
- Tokens JWT
- Sesiones con expiracion

Autor: Litper IA System
Version: 1.0.0
"""

import os
import hashlib
import hmac
import base64
import json
from datetime import datetime, timedelta
from typing import Optional, Tuple
from loguru import logger

# ==================== CONFIGURACION ====================

SECRET_KEY = os.getenv("JWT_SECRET_KEY", os.getenv("ADMIN_PASSWORD", "cambiar-en-produccion"))
TOKEN_EXPIRY_HOURS = int(os.getenv("TOKEN_EXPIRY_HOURS", "8"))
ALGORITHM = "HS256"


# ==================== FUNCIONES DE HASH ====================

def hash_password(password: str) -> str:
    """
    Genera un hash seguro de la contraseña.
    Usa PBKDF2 con SHA256.
    """
    salt = os.urandom(32)
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt,
        100000  # 100,000 iteraciones
    )
    # Formato: salt:key (ambos en base64)
    return base64.b64encode(salt).decode() + ':' + base64.b64encode(key).decode()


def verify_password(password: str, stored_hash: str) -> bool:
    """
    Verifica una contraseña contra su hash.
    """
    try:
        # Si es contraseña en texto plano (compatibilidad)
        if ':' not in stored_hash:
            return password == stored_hash

        # Separar salt y key
        salt_b64, key_b64 = stored_hash.split(':')
        salt = base64.b64decode(salt_b64)
        stored_key = base64.b64decode(key_b64)

        # Calcular hash con la misma salt
        new_key = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt,
            100000
        )

        # Comparacion segura (tiempo constante)
        return hmac.compare_digest(new_key, stored_key)

    except Exception as e:
        logger.error(f"Error verificando contraseña: {e}")
        return False


# ==================== FUNCIONES JWT ====================

def create_token(user_id: str, role: str = "admin") -> str:
    """
    Crea un token JWT.
    """
    # Header
    header = {
        "alg": ALGORITHM,
        "typ": "JWT"
    }

    # Payload
    now = datetime.utcnow()
    payload = {
        "sub": user_id,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=TOKEN_EXPIRY_HOURS)).timestamp())
    }

    # Encodificar
    header_b64 = base64.urlsafe_b64encode(
        json.dumps(header).encode()
    ).decode().rstrip('=')

    payload_b64 = base64.urlsafe_b64encode(
        json.dumps(payload).encode()
    ).decode().rstrip('=')

    # Firma
    message = f"{header_b64}.{payload_b64}"
    signature = hmac.new(
        SECRET_KEY.encode(),
        message.encode(),
        hashlib.sha256
    ).digest()
    signature_b64 = base64.urlsafe_b64encode(signature).decode().rstrip('=')

    return f"{header_b64}.{payload_b64}.{signature_b64}"


def verify_token(token: str) -> Tuple[bool, Optional[dict]]:
    """
    Verifica un token JWT.
    Retorna (valido, payload) o (False, None).
    """
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return False, None

        header_b64, payload_b64, signature_b64 = parts

        # Verificar firma
        message = f"{header_b64}.{payload_b64}"
        expected_signature = hmac.new(
            SECRET_KEY.encode(),
            message.encode(),
            hashlib.sha256
        ).digest()

        # Padding para base64
        signature_b64_padded = signature_b64 + '=' * (4 - len(signature_b64) % 4)
        actual_signature = base64.urlsafe_b64decode(signature_b64_padded)

        if not hmac.compare_digest(expected_signature, actual_signature):
            return False, None

        # Decodificar payload
        payload_b64_padded = payload_b64 + '=' * (4 - len(payload_b64) % 4)
        payload = json.loads(base64.urlsafe_b64decode(payload_b64_padded))

        # Verificar expiracion
        if payload.get('exp', 0) < datetime.utcnow().timestamp():
            return False, None

        return True, payload

    except Exception as e:
        logger.error(f"Error verificando token: {e}")
        return False, None


def decode_token(token: str) -> Optional[dict]:
    """
    Decodifica un token sin verificar (para debug).
    """
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None

        payload_b64 = parts[1]
        payload_b64_padded = payload_b64 + '=' * (4 - len(payload_b64) % 4)
        return json.loads(base64.urlsafe_b64decode(payload_b64_padded))

    except Exception:
        return None


# ==================== CLASE ADMINISTRADOR ====================

class AuthManager:
    """
    Gestor de autenticacion centralizado.
    """

    def __init__(self):
        self.sessions = {}
        self.failed_attempts = {}
        self.max_attempts = 5
        self.lockout_minutes = 15

    def login(self, password: str, ip_address: str = "unknown") -> Tuple[bool, Optional[str], str]:
        """
        Intenta login.
        Retorna (exito, token, mensaje).
        """
        # Verificar lockout
        if ip_address in self.failed_attempts:
            attempts, lockout_until = self.failed_attempts[ip_address]
            if lockout_until and datetime.now() < lockout_until:
                minutes_left = int((lockout_until - datetime.now()).total_seconds() / 60)
                return False, None, f"Cuenta bloqueada. Intente en {minutes_left} minutos."

        # Obtener password del env
        stored_password = os.getenv("ADMIN_PASSWORD")
        if not stored_password:
            logger.error("ADMIN_PASSWORD no configurada")
            return False, None, "Error de configuracion del servidor"

        # Verificar password
        if not verify_password(password, stored_password):
            # Registrar intento fallido
            attempts = self.failed_attempts.get(ip_address, (0, None))[0] + 1
            lockout = None
            if attempts >= self.max_attempts:
                lockout = datetime.now() + timedelta(minutes=self.lockout_minutes)
                logger.warning(f"IP {ip_address} bloqueada por {self.lockout_minutes} min")

            self.failed_attempts[ip_address] = (attempts, lockout)

            remaining = self.max_attempts - attempts
            if remaining > 0:
                return False, None, f"Contraseña incorrecta. {remaining} intentos restantes."
            else:
                return False, None, f"Demasiados intentos. Bloqueado por {self.lockout_minutes} minutos."

        # Login exitoso
        if ip_address in self.failed_attempts:
            del self.failed_attempts[ip_address]

        # Generar token
        token = create_token("admin", "admin")

        # Guardar sesion
        self.sessions[token] = {
            "created": datetime.now(),
            "ip": ip_address,
            "last_activity": datetime.now()
        }

        logger.info(f"Login exitoso desde {ip_address}")
        return True, token, "Login exitoso"

    def verify(self, token: str) -> Tuple[bool, Optional[dict]]:
        """
        Verifica un token y sesion.
        """
        # Verificar JWT
        valid, payload = verify_token(token)
        if not valid:
            return False, None

        # Verificar sesion activa
        if token not in self.sessions:
            return False, None

        # Actualizar ultima actividad
        self.sessions[token]["last_activity"] = datetime.now()

        return True, payload

    def logout(self, token: str) -> bool:
        """
        Cierra sesion.
        """
        if token in self.sessions:
            del self.sessions[token]
            return True
        return False

    def cleanup_sessions(self):
        """
        Limpia sesiones expiradas.
        """
        now = datetime.now()
        expired = []

        for token, session in self.sessions.items():
            # Sesiones inactivas por mas de 8 horas
            if (now - session["last_activity"]).total_seconds() > TOKEN_EXPIRY_HOURS * 3600:
                expired.append(token)

        for token in expired:
            del self.sessions[token]

        if expired:
            logger.info(f"Limpiadas {len(expired)} sesiones expiradas")


# ==================== INSTANCIA GLOBAL ====================

auth_manager = AuthManager()


# ==================== TESTS ====================

if __name__ == "__main__":
    # Test hash
    pw = "mi_password_123"
    hashed = hash_password(pw)
    print(f"Hash: {hashed}")
    print(f"Verificar correcto: {verify_password(pw, hashed)}")
    print(f"Verificar incorrecto: {verify_password('wrong', hashed)}")

    # Test JWT
    token = create_token("admin", "admin")
    print(f"\nToken: {token}")
    valid, payload = verify_token(token)
    print(f"Valido: {valid}")
    print(f"Payload: {payload}")

    # Test AuthManager
    print("\n--- AuthManager ---")
    os.environ["ADMIN_PASSWORD"] = "test123"
    success, token, msg = auth_manager.login("test123", "127.0.0.1")
    print(f"Login: {success}, {msg}")
    if token:
        valid, payload = auth_manager.verify(token)
        print(f"Verify: {valid}, {payload}")
