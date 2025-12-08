# Seguridad Enterprise - Litper

## Visión General

El sistema de seguridad de Litper implementa múltiples capas de protección siguiendo el principio de defensa en profundidad.

## Capas de Seguridad

```
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE ENTRADA                           │
│  CloudFlare WAF │ Rate Limiting │ DDoS Protection           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   AUTENTICACIÓN                              │
│  JWT Tokens │ API Keys │ OAuth 2.0                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   AUTORIZACIÓN                               │
│  RBAC (Roles) │ Permisos │ Contexto País                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   ENCRIPTACIÓN                               │
│  TLS 1.3 │ AES-256 (datos) │ bcrypt (passwords)            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    AUDITORÍA                                 │
│  Logs │ Detección Anomalías │ Alertas                       │
└─────────────────────────────────────────────────────────────┘
```

## Autenticación

### JWT Tokens

```python
from backend.security import create_access_token, create_refresh_token

# Crear tokens
access_token = create_access_token(
    data={
        "sub": user.id,
        "role": user.role,
        "country": user.country_code
    },
    expires_delta=timedelta(minutes=30)
)

refresh_token = create_refresh_token(user_id=user.id)
```

### Configuración JWT

| Parámetro | Valor |
|-----------|-------|
| Algoritmo | HS256 |
| Access Token TTL | 30 minutos |
| Refresh Token TTL | 7 días |
| Issuer | litper.co |

### API Keys

```python
from backend.security import generate_api_key, validate_api_key

# Generar API Key
api_key = generate_api_key(
    name="Dropi Integration",
    permissions=["orders:read", "guides:read"],
    rate_limit=1000  # requests/hour
)

# Validar API Key
is_valid, key_data = await validate_api_key(api_key_header)
```

## Autorización (RBAC)

### Roles

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| ADMIN | Administrador | Todos |
| OPERATOR | Operador | Crear, leer, actualizar |
| VIEWER | Solo lectura | Leer |
| API_CLIENT | Integración externa | Limitados |
| AGENT | Agente IA | Específicos de agente |

### Permisos

```python
class Permission(str, Enum):
    ORDERS_READ = "orders:read"
    ORDERS_WRITE = "orders:write"
    GUIDES_READ = "guides:read"
    GUIDES_WRITE = "guides:write"
    INCIDENTS_READ = "incidents:read"
    INCIDENTS_WRITE = "incidents:write"
    AGENTS_MANAGE = "agents:manage"
    USERS_MANAGE = "users:manage"
    ANALYTICS_READ = "analytics:read"
    SETTINGS_MANAGE = "settings:manage"
```

### Uso en Endpoints

```python
from backend.security import require_permission, require_country, Permission

@router.get("/orders")
async def list_orders(
    current_user: User = Depends(require_permission(Permission.ORDERS_READ)),
    country: str = Depends(require_country)
):
    # Solo usuarios con permiso orders:read pueden acceder
    # Filtrado automático por país del usuario
    pass
```

## Encriptación

### Datos en Reposo

```python
from backend.security import EncryptionService

encryption = EncryptionService(master_key=settings.ENCRYPTION_KEY)

# Encriptar PII
encrypted = encryption.encrypt_pii(customer_data, model_type="customer")

# Desencriptar
decrypted = encryption.decrypt_pii(encrypted, model_type="customer")
```

### Campos PII por Modelo

| Modelo | Campos Encriptados |
|--------|-------------------|
| Customer | phone, email, address, document_number |
| Order | customer_name, customer_phone, delivery_address |
| Guide | recipient_name, recipient_phone, recipient_address |
| User | email, phone |

### Enmascaramiento

```python
# Para logs y displays
masked = encryption.mask_pii({
    "phone": "3001234567",
    "email": "juan@email.com"
}, model_type="customer")

# Resultado:
# {"phone": "300***4567", "email": "j***@email.com"}
```

## Auditoría

### Acciones Auditadas

```python
class AuditAction(str, Enum):
    # Autenticación
    LOGIN_SUCCESS = "auth.login.success"
    LOGIN_FAILED = "auth.login.failed"
    LOGOUT = "auth.logout"
    TOKEN_REFRESH = "auth.token.refresh"

    # Datos
    ORDER_CREATE = "order.create"
    ORDER_UPDATE = "order.update"
    GUIDE_CREATE = "guide.create"
    INCIDENT_CREATE = "incident.create"

    # Administración
    USER_CREATE = "user.create"
    PERMISSION_CHANGE = "permission.change"
    SETTINGS_UPDATE = "settings.update"
```

### Decorador de Auditoría

```python
from backend.security import audit_action, AuditAction

@router.post("/orders")
@audit_action(AuditAction.ORDER_CREATE)
async def create_order(order: OrderCreate, current_user: User):
    # Automáticamente registra:
    # - Usuario que ejecutó
    # - Timestamp
    # - Datos del request
    # - Resultado
    pass
```

### Detección de Anomalías

El sistema detecta automáticamente:
- Múltiples intentos de login fallidos
- Acceso desde ubicaciones inusuales
- Patrones de uso anormales
- Acceso a datos fuera del país asignado

## Headers de Seguridad

```python
# Middleware de seguridad
SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": "default-src 'self'"
}
```

## Rate Limiting

| Endpoint | Límite |
|----------|--------|
| /auth/login | 5/minuto |
| /api/* | 100/minuto |
| /api/orders (POST) | 50/minuto |
| Webhooks | 500/minuto |

## Checklist de Seguridad

- [x] HTTPS obligatorio (TLS 1.3)
- [x] JWT con refresh tokens
- [x] API Keys con permisos granulares
- [x] RBAC implementado
- [x] Encriptación de PII
- [x] Auditoría completa
- [x] Rate limiting
- [x] Headers de seguridad
- [x] Detección de anomalías
- [x] Rotación de secrets

## Archivos de Implementación

- `backend/security/authentication.py`: JWT, API Keys, RBAC
- `backend/security/encryption.py`: Encriptación de datos
- `backend/security/audit.py`: Sistema de auditoría
