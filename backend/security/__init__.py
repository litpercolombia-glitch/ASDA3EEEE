"""
Sistema de Seguridad Enterprise para Litper
============================================

Este paquete contiene los componentes de seguridad:
- Autenticación (JWT + API Keys)
- Autorización (RBAC)
- Encriptación de datos sensibles
- Auditoría de accesos

Uso:
    from security.authentication import get_current_user, require_permission, Permission
    from security.encryption import EncryptionService
    from security.audit import AuditService, AuditAction
"""

from .authentication import (
    Role,
    Permission,
    ROLE_PERMISSIONS,
    TokenData,
    User,
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
    require_permission,
    require_country,
    generate_api_key,
    validate_api_key,
    APIKey,
)

from .encryption import (
    EncryptionService,
    PII_FIELDS,
    init_encryption,
)

from .audit import (
    AuditAction,
    AuditLog,
    AuditService,
    audit_action,
)

__all__ = [
    # Authentication
    "Role",
    "Permission",
    "ROLE_PERMISSIONS",
    "TokenData",
    "User",
    "verify_password",
    "get_password_hash",
    "create_access_token",
    "create_refresh_token",
    "decode_token",
    "get_current_user",
    "require_permission",
    "require_country",
    "generate_api_key",
    "validate_api_key",
    "APIKey",
    # Encryption
    "EncryptionService",
    "PII_FIELDS",
    "init_encryption",
    # Audit
    "AuditAction",
    "AuditLog",
    "AuditService",
    "audit_action",
]
