"""
Encriptación de datos sensibles para Litper
============================================

Implementa:
- Encriptación simétrica (Fernet/AES)
- Hashing para búsquedas
- Enmascaramiento de PII
- Gestión segura de keys

Uso:
    from security.encryption import EncryptionService, init_encryption

    # Inicializar al arrancar la app
    init_encryption(os.getenv("MASTER_ENCRYPTION_KEY"))

    # Usar servicio
    encrypted = encryption_service.encrypt("datos sensibles")
    decrypted = encryption_service.decrypt(encrypted)
"""

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
import base64
import os
from typing import Optional, Dict, List, Any
import hashlib
import re

# ═══════════════════════════════════════════
# CONFIGURACIÓN DE ENCRIPTACIÓN
# ═══════════════════════════════════════════

class EncryptionService:
    """
    Servicio de encriptación para datos sensibles.

    Usa Fernet (AES-128-CBC) con key derivada usando PBKDF2.
    """

    def __init__(self, master_key: str, salt: bytes = None):
        """
        Inicializar servicio con master key.

        Args:
            master_key: Clave maestra (obtener de Vault/env var)
            salt: Salt para derivación (único por ambiente)
        """
        # Usar salt único por ambiente
        if salt is None:
            salt = os.getenv("ENCRYPTION_SALT", "litper_encryption_salt_v1").encode()

        # Derivar key usando PBKDF2
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
            backend=default_backend()
        )
        key = base64.urlsafe_b64encode(kdf.derive(master_key.encode()))
        self.fernet = Fernet(key)

    def encrypt(self, data: str) -> str:
        """
        Encriptar string.

        Args:
            data: Texto plano a encriptar

        Returns:
            Texto encriptado (base64)
        """
        if not data:
            return data
        return self.fernet.encrypt(data.encode()).decode()

    def decrypt(self, encrypted_data: str) -> str:
        """
        Desencriptar string.

        Args:
            encrypted_data: Texto encriptado

        Returns:
            Texto plano original
        """
        if not encrypted_data:
            return encrypted_data
        try:
            return self.fernet.decrypt(encrypted_data.encode()).decode()
        except Exception:
            # Si falla, retornar como está (puede no estar encriptado)
            return encrypted_data

    def encrypt_pii(self, data: Dict[str, Any], fields: List[str]) -> Dict[str, Any]:
        """
        Encriptar campos PII específicos en un diccionario.

        Args:
            data: Diccionario con datos
            fields: Lista de campos a encriptar

        Returns:
            Diccionario con campos encriptados

        Ejemplo:
            encrypted = service.encrypt_pii(
                {"name": "Juan", "phone": "3123456789", "order_id": "123"},
                ["name", "phone"]
            )
        """
        result = data.copy()
        for field in fields:
            if field in result and result[field]:
                result[field] = self.encrypt(str(result[field]))
        return result

    def decrypt_pii(self, data: Dict[str, Any], fields: List[str]) -> Dict[str, Any]:
        """
        Desencriptar campos PII específicos.

        Args:
            data: Diccionario con datos encriptados
            fields: Lista de campos a desencriptar

        Returns:
            Diccionario con campos desencriptados
        """
        result = data.copy()
        for field in fields:
            if field in result and result[field]:
                try:
                    result[field] = self.decrypt(result[field])
                except Exception:
                    pass  # Campo no estaba encriptado
        return result

    @staticmethod
    def hash_for_search(data: str, truncate: int = 16) -> str:
        """
        Hash determinístico para búsquedas.

        Permite buscar en datos encriptados sin desencriptar todo.

        Args:
            data: Dato a hashear
            truncate: Longitud del hash resultante

        Returns:
            Hash truncado

        Ejemplo:
            hash = EncryptionService.hash_for_search("3123456789")
            # Guardar hash junto con dato encriptado
            # Buscar por hash sin desencriptar
        """
        if not data:
            return ""
        full_hash = hashlib.sha256(data.lower().encode()).hexdigest()
        return full_hash[:truncate]

    @staticmethod
    def mask_pii(data: str, visible_chars: int = 4) -> str:
        """
        Enmascarar PII para logs/display.

        Args:
            data: Dato a enmascarar
            visible_chars: Caracteres visibles al inicio y final

        Returns:
            Dato enmascarado

        Ejemplos:
            "3123456789" -> "312*****89"
            "juan@email.com" -> "jua*****om"
            "Juan Pérez" -> "Jua*****ez"
        """
        if not data or len(data) <= visible_chars * 2:
            return "*" * len(data) if data else ""

        return data[:visible_chars] + "*" * (len(data) - visible_chars * 2) + data[-visible_chars:]

    @staticmethod
    def mask_email(email: str) -> str:
        """
        Enmascarar email específicamente.

        Args:
            email: Email a enmascarar

        Returns:
            Email enmascarado

        Ejemplo:
            "juan.perez@litper.co" -> "j***z@l***r.co"
        """
        if not email or "@" not in email:
            return EncryptionService.mask_pii(email)

        local, domain = email.split("@", 1)
        domain_parts = domain.split(".")

        masked_local = local[0] + "***" + local[-1] if len(local) > 1 else "***"
        masked_domain = domain_parts[0][0] + "***" + domain_parts[0][-1] if len(domain_parts[0]) > 1 else "***"

        return f"{masked_local}@{masked_domain}.{'.'.join(domain_parts[1:])}"

    @staticmethod
    def mask_phone(phone: str) -> str:
        """
        Enmascarar número de teléfono.

        Args:
            phone: Teléfono a enmascarar

        Returns:
            Teléfono enmascarado

        Ejemplo:
            "3123456789" -> "312***789"
            "+573123456789" -> "+5731***789"
        """
        if not phone:
            return ""

        # Limpiar caracteres no numéricos excepto +
        cleaned = re.sub(r'[^\d+]', '', phone)

        if len(cleaned) <= 6:
            return "***"

        # Mostrar código de país y primeros/últimos dígitos
        if cleaned.startswith("+"):
            return cleaned[:5] + "***" + cleaned[-3:]
        else:
            return cleaned[:3] + "***" + cleaned[-3:]

    @staticmethod
    def mask_address(address: str) -> str:
        """
        Enmascarar dirección.

        Args:
            address: Dirección a enmascarar

        Returns:
            Dirección enmascarada (solo muestra ciudad)

        Ejemplo:
            "Calle 45 #23-15, Bogotá" -> "*****, Bogotá"
        """
        if not address:
            return ""

        # Intentar extraer ciudad (después de la última coma)
        parts = address.split(",")
        if len(parts) > 1:
            city = parts[-1].strip()
            return f"*****, {city}"

        return "*****"


# ═══════════════════════════════════════════
# CAMPOS PII POR MODELO
# ═══════════════════════════════════════════

PII_FIELDS = {
    "customer": ["name", "phone", "email", "address", "document_id"],
    "order": ["customer_name", "customer_phone", "customer_email", "shipping_address"],
    "guide": ["recipient_name", "recipient_phone", "recipient_address"],
    "chat": ["customer_phone", "customer_name"],
    "call": ["phone_number", "customer_name"],
    "user": ["email", "phone"],
}


# ═══════════════════════════════════════════
# INSTANCIA GLOBAL
# ═══════════════════════════════════════════

encryption_service: Optional[EncryptionService] = None


def init_encryption(master_key: str):
    """
    Inicializar servicio de encriptación.

    Llamar al arrancar la aplicación.

    Args:
        master_key: Clave maestra (obtener de Vault/env var)
    """
    global encryption_service
    encryption_service = EncryptionService(master_key)


def get_encryption_service() -> EncryptionService:
    """
    Obtener instancia del servicio de encriptación.

    Returns:
        EncryptionService inicializado

    Raises:
        RuntimeError si no está inicializado
    """
    if encryption_service is None:
        raise RuntimeError("Encryption service not initialized. Call init_encryption() first.")
    return encryption_service


# ═══════════════════════════════════════════
# HELPERS PARA SQLALCHEMY
# ═══════════════════════════════════════════

class EncryptedString:
    """
    Descriptor para campos encriptados en modelos SQLAlchemy.

    Uso:
        class Customer(Base):
            _phone_encrypted = Column(String)
            phone = EncryptedString('_phone_encrypted')
    """

    def __init__(self, encrypted_field: str):
        self.encrypted_field = encrypted_field

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        encrypted_value = getattr(obj, self.encrypted_field)
        if encrypted_value:
            return get_encryption_service().decrypt(encrypted_value)
        return None

    def __set__(self, obj, value):
        if value:
            encrypted_value = get_encryption_service().encrypt(str(value))
            setattr(obj, self.encrypted_field, encrypted_value)
        else:
            setattr(obj, self.encrypted_field, None)


class HashedSearchField:
    """
    Descriptor para campos con hash de búsqueda.

    Uso:
        class Customer(Base):
            _phone_hash = Column(String, index=True)
            phone_hash = HashedSearchField('_phone_hash')
    """

    def __init__(self, hash_field: str):
        self.hash_field = hash_field

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        return getattr(obj, self.hash_field)

    def __set__(self, obj, value):
        if value:
            hash_value = EncryptionService.hash_for_search(str(value))
            setattr(obj, self.hash_field, hash_value)
        else:
            setattr(obj, self.hash_field, None)


# ═══════════════════════════════════════════
# UTILIDAD PARA BÚSQUEDAS
# ═══════════════════════════════════════════

async def search_by_encrypted_field(
    db,
    table_name: str,
    field_hash_column: str,
    search_value: str,
    additional_filters: Dict[str, Any] = None
) -> List[Dict]:
    """
    Buscar en campo encriptado usando hash.

    Args:
        db: Conexión a base de datos
        table_name: Nombre de la tabla
        field_hash_column: Columna con el hash
        search_value: Valor a buscar
        additional_filters: Filtros adicionales

    Returns:
        Lista de registros encontrados
    """
    search_hash = EncryptionService.hash_for_search(search_value)

    query = f"SELECT * FROM {table_name} WHERE {field_hash_column} = :hash"
    params = {"hash": search_hash}

    if additional_filters:
        for key, value in additional_filters.items():
            query += f" AND {key} = :{key}"
            params[key] = value

    result = await db.fetch_all(query, params)
    return [dict(row) for row in result]
