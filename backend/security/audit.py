"""
Sistema de auditoría para Litper
================================

Implementa:
- Logging de accesos y acciones
- Detección de anomalías
- Compliance con regulaciones (Ley 1581 Colombia)
- Historial de cambios

Uso:
    from security.audit import AuditService, AuditAction, audit_action

    # Decorador automático
    @audit_action(AuditAction.CUSTOMER_VIEW, resource_type="customer")
    async def get_customer(request: Request, customer_id: str):
        ...

    # Manual
    await audit_service.log(
        action=AuditAction.ORDER_CREATE,
        user_id=user.id,
        ...
    )
"""

from datetime import datetime, timedelta
from typing import Optional, Any, Dict, List
from pydantic import BaseModel
from enum import Enum
import json
from functools import wraps

# ═══════════════════════════════════════════
# TIPOS DE ACCIONES AUDITABLES
# ═══════════════════════════════════════════

class AuditAction(str, Enum):
    """Acciones que se auditan en el sistema."""

    # Autenticación
    LOGIN_SUCCESS = "auth.login.success"
    LOGIN_FAILED = "auth.login.failed"
    LOGOUT = "auth.logout"
    TOKEN_REFRESH = "auth.token.refresh"
    PASSWORD_CHANGE = "auth.password.change"
    PASSWORD_RESET = "auth.password.reset"
    MFA_ENABLED = "auth.mfa.enabled"
    MFA_DISABLED = "auth.mfa.disabled"

    # Datos de clientes
    CUSTOMER_VIEW = "customer.view"
    CUSTOMER_CREATE = "customer.create"
    CUSTOMER_UPDATE = "customer.update"
    CUSTOMER_DELETE = "customer.delete"
    CUSTOMER_EXPORT = "customer.export"
    CUSTOMER_SEARCH = "customer.search"

    # Pedidos
    ORDER_VIEW = "order.view"
    ORDER_CREATE = "order.create"
    ORDER_UPDATE = "order.update"
    ORDER_CANCEL = "order.cancel"
    ORDER_EXPORT = "order.export"

    # Guías
    GUIDE_VIEW = "guide.view"
    GUIDE_CREATE = "guide.create"
    GUIDE_UPDATE = "guide.update"
    GUIDE_TRACKING = "guide.tracking"

    # Novedades
    INCIDENT_VIEW = "incident.view"
    INCIDENT_CREATE = "incident.create"
    INCIDENT_RESOLVE = "incident.resolve"
    INCIDENT_ESCALATE = "incident.escalate"

    # Agentes IA
    AGENT_TASK_START = "agent.task.start"
    AGENT_TASK_COMPLETE = "agent.task.complete"
    AGENT_TASK_FAIL = "agent.task.fail"
    AGENT_CONFIG_CHANGE = "agent.config.change"

    # Sistema
    CONFIG_VIEW = "system.config.view"
    CONFIG_CHANGE = "system.config.change"
    USER_CREATE = "system.user.create"
    USER_UPDATE = "system.user.update"
    USER_DELETE = "system.user.delete"
    PERMISSION_CHANGE = "system.permission.change"

    # API
    API_KEY_CREATE = "api.key.create"
    API_KEY_REVOKE = "api.key.revoke"
    API_KEY_USE = "api.key.use"

    # Conocimiento
    KNOWLEDGE_VIEW = "knowledge.view"
    KNOWLEDGE_CREATE = "knowledge.create"
    KNOWLEDGE_DELETE = "knowledge.delete"
    KNOWLEDGE_EXPORT = "knowledge.export"

    # ML
    ML_TRAIN = "ml.train"
    ML_PREDICT = "ml.predict"
    ML_MODEL_DEPLOY = "ml.model.deploy"


# ═══════════════════════════════════════════
# MODELOS
# ═══════════════════════════════════════════

class AuditLog(BaseModel):
    """Registro de auditoría."""
    id: str
    timestamp: datetime
    action: AuditAction
    user_id: str
    user_email: Optional[str] = None
    user_role: str
    ip_address: str
    user_agent: str
    resource_type: Optional[str] = None  # customer, order, guide, etc.
    resource_id: Optional[str] = None
    country: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    success: bool
    error_message: Optional[str] = None
    duration_ms: Optional[float] = None


class AuditSummary(BaseModel):
    """Resumen de auditoría para reportes."""
    period_start: datetime
    period_end: datetime
    total_events: int
    events_by_action: Dict[str, int]
    events_by_user: Dict[str, int]
    failed_events: int
    anomalies_detected: int


# ═══════════════════════════════════════════
# SERVICIO DE AUDITORÍA
# ═══════════════════════════════════════════

class AuditService:
    """
    Servicio de auditoría.

    Registra todas las acciones importantes del sistema
    para compliance y seguridad.
    """

    def __init__(self, db, logger):
        """
        Inicializar servicio.

        Args:
            db: Conexión a base de datos
            logger: Logger para registro adicional
        """
        self.db = db
        self.logger = logger

        # Acciones consideradas sensibles
        self.sensitive_actions = [
            AuditAction.LOGIN_FAILED,
            AuditAction.CUSTOMER_EXPORT,
            AuditAction.CUSTOMER_DELETE,
            AuditAction.CONFIG_CHANGE,
            AuditAction.PERMISSION_CHANGE,
            AuditAction.API_KEY_CREATE,
            AuditAction.API_KEY_REVOKE,
            AuditAction.USER_DELETE,
            AuditAction.KNOWLEDGE_DELETE,
            AuditAction.KNOWLEDGE_EXPORT,
        ]

    async def log(
        self,
        action: AuditAction,
        user_id: str,
        user_email: str,
        user_role: str,
        ip_address: str,
        user_agent: str,
        resource_type: str = None,
        resource_id: str = None,
        country: str = None,
        details: Dict[str, Any] = None,
        success: bool = True,
        error_message: str = None,
        duration_ms: float = None
    ) -> AuditLog:
        """
        Registrar evento de auditoría.

        Args:
            action: Tipo de acción
            user_id: ID del usuario que realizó la acción
            user_email: Email del usuario
            user_role: Rol del usuario
            ip_address: IP de origen
            user_agent: User agent del cliente
            resource_type: Tipo de recurso afectado
            resource_id: ID del recurso afectado
            country: País del contexto
            details: Detalles adicionales
            success: Si la acción fue exitosa
            error_message: Mensaje de error si falló
            duration_ms: Duración de la operación en ms

        Returns:
            AuditLog creado
        """
        import uuid

        audit_log = AuditLog(
            id=f"audit_{uuid.uuid4().hex[:16]}",
            timestamp=datetime.utcnow(),
            action=action,
            user_id=user_id,
            user_email=user_email,
            user_role=user_role,
            ip_address=ip_address,
            user_agent=user_agent,
            resource_type=resource_type,
            resource_id=resource_id,
            country=country,
            details=details,
            success=success,
            error_message=error_message,
            duration_ms=duration_ms
        )

        # Guardar en DB
        try:
            await self.db.audit_logs.insert_one(audit_log.dict())
        except Exception as e:
            self.logger.error(f"Error guardando audit log: {e}")

        # Log estructurado
        log_method = self.logger.info if success else self.logger.warning
        log_method(
            f"AUDIT: {action.value}",
            event_type="audit",
            audit_id=audit_log.id,
            action=action.value,
            user_id=user_id,
            resource_type=resource_type,
            resource_id=resource_id,
            success=success
        )

        # Alertar si es acción sensible fallida
        if not success and action in self.sensitive_actions:
            await self._alert_security_team(audit_log)

        # Detectar anomalías en tiempo real
        await self._check_realtime_anomalies(audit_log)

        return audit_log

    async def _alert_security_team(self, audit_log: AuditLog):
        """
        Alertar equipo de seguridad por evento sospechoso.

        Args:
            audit_log: Log del evento
        """
        self.logger.critical(
            f"SECURITY ALERT: {audit_log.action.value}",
            event_type="security_alert",
            audit_id=audit_log.id,
            user_id=audit_log.user_id,
            ip_address=audit_log.ip_address,
            error_message=audit_log.error_message
        )

        # TODO: Enviar notificación a equipo de seguridad
        # await notification_service.send_security_alert(audit_log)

    async def _check_realtime_anomalies(self, audit_log: AuditLog):
        """
        Verificar anomalías en tiempo real.

        Args:
            audit_log: Log del evento actual
        """
        # Múltiples login fallidos
        if audit_log.action == AuditAction.LOGIN_FAILED:
            await self._check_brute_force(audit_log)

        # Exportaciones masivas
        if audit_log.action in [AuditAction.CUSTOMER_EXPORT, AuditAction.KNOWLEDGE_EXPORT]:
            await self._check_mass_export(audit_log)

        # Acceso desde IP inusual
        await self._check_unusual_ip(audit_log)

    async def _check_brute_force(self, audit_log: AuditLog):
        """Detectar posible ataque de fuerza bruta."""
        one_hour_ago = datetime.utcnow() - timedelta(hours=1)

        count = await self.db.audit_logs.count_documents({
            "action": AuditAction.LOGIN_FAILED.value,
            "ip_address": audit_log.ip_address,
            "timestamp": {"$gte": one_hour_ago}
        })

        if count >= 5:
            self.logger.critical(
                f"BRUTE FORCE DETECTED: {count} failed logins from {audit_log.ip_address}",
                event_type="brute_force_detected",
                ip_address=audit_log.ip_address,
                count=count
            )

    async def _check_mass_export(self, audit_log: AuditLog):
        """Detectar exportaciones masivas sospechosas."""
        one_day_ago = datetime.utcnow() - timedelta(days=1)

        count = await self.db.audit_logs.count_documents({
            "action": {"$in": [AuditAction.CUSTOMER_EXPORT.value, AuditAction.KNOWLEDGE_EXPORT.value]},
            "user_id": audit_log.user_id,
            "timestamp": {"$gte": one_day_ago}
        })

        if count >= 10:
            self.logger.critical(
                f"MASS EXPORT DETECTED: {count} exports by user {audit_log.user_id}",
                event_type="mass_export_detected",
                user_id=audit_log.user_id,
                count=count
            )

    async def _check_unusual_ip(self, audit_log: AuditLog):
        """Detectar acceso desde IP inusual."""
        # Obtener IPs frecuentes del usuario
        seven_days_ago = datetime.utcnow() - timedelta(days=7)

        pipeline = [
            {
                "$match": {
                    "user_id": audit_log.user_id,
                    "success": True,
                    "timestamp": {"$gte": seven_days_ago}
                }
            },
            {
                "$group": {
                    "_id": "$ip_address",
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]

        frequent_ips = await self.db.audit_logs.aggregate(pipeline).to_list(10)
        frequent_ip_list = [ip["_id"] for ip in frequent_ips]

        # Si hay historial y la IP actual no está en las frecuentes
        if frequent_ip_list and audit_log.ip_address not in frequent_ip_list:
            self.logger.warning(
                f"UNUSUAL IP: {audit_log.ip_address} for user {audit_log.user_id}",
                event_type="unusual_ip_detected",
                user_id=audit_log.user_id,
                ip_address=audit_log.ip_address,
                frequent_ips=frequent_ip_list[:3]
            )

    # ═══════════════════════════════════════════
    # CONSULTAS DE AUDITORÍA
    # ═══════════════════════════════════════════

    async def get_user_activity(
        self,
        user_id: str,
        start_date: datetime,
        end_date: datetime,
        limit: int = 1000
    ) -> List[AuditLog]:
        """
        Obtener actividad de un usuario.

        Args:
            user_id: ID del usuario
            start_date: Fecha inicio
            end_date: Fecha fin
            limit: Límite de resultados

        Returns:
            Lista de eventos de auditoría
        """
        cursor = self.db.audit_logs.find({
            "user_id": user_id,
            "timestamp": {"$gte": start_date, "$lte": end_date}
        }).sort("timestamp", -1).limit(limit)

        return [AuditLog(**doc) async for doc in cursor]

    async def get_resource_history(
        self,
        resource_type: str,
        resource_id: str,
        limit: int = 100
    ) -> List[AuditLog]:
        """
        Obtener historial de cambios de un recurso.

        Args:
            resource_type: Tipo de recurso
            resource_id: ID del recurso
            limit: Límite de resultados

        Returns:
            Lista de eventos de auditoría
        """
        cursor = self.db.audit_logs.find({
            "resource_type": resource_type,
            "resource_id": resource_id
        }).sort("timestamp", -1).limit(limit)

        return [AuditLog(**doc) async for doc in cursor]

    async def get_failed_actions(
        self,
        hours: int = 24,
        action_filter: List[AuditAction] = None
    ) -> List[AuditLog]:
        """
        Obtener acciones fallidas recientes.

        Args:
            hours: Horas hacia atrás
            action_filter: Filtrar por tipos de acción

        Returns:
            Lista de eventos fallidos
        """
        query = {
            "success": False,
            "timestamp": {"$gte": datetime.utcnow() - timedelta(hours=hours)}
        }

        if action_filter:
            query["action"] = {"$in": [a.value for a in action_filter]}

        cursor = self.db.audit_logs.find(query).sort("timestamp", -1)

        return [AuditLog(**doc) async for doc in cursor]

    async def detect_anomalies(self) -> List[Dict[str, Any]]:
        """
        Detectar patrones anómalos en los logs.

        Returns:
            Lista de anomalías detectadas
        """
        anomalies = []
        one_hour_ago = datetime.utcnow() - timedelta(hours=1)
        one_day_ago = datetime.utcnow() - timedelta(days=1)

        # Múltiples login fallidos por IP
        pipeline = [
            {
                "$match": {
                    "action": AuditAction.LOGIN_FAILED.value,
                    "timestamp": {"$gte": one_hour_ago}
                }
            },
            {
                "$group": {
                    "_id": "$ip_address",
                    "count": {"$sum": 1}
                }
            },
            {"$match": {"count": {"$gte": 5}}}
        ]

        failed_logins = await self.db.audit_logs.aggregate(pipeline).to_list(100)

        for item in failed_logins:
            anomalies.append({
                "type": "multiple_failed_logins",
                "ip_address": item["_id"],
                "count": item["count"],
                "severity": "high",
                "detected_at": datetime.utcnow()
            })

        # Exportaciones masivas de datos
        pipeline = [
            {
                "$match": {
                    "action": {"$in": [AuditAction.CUSTOMER_EXPORT.value, AuditAction.KNOWLEDGE_EXPORT.value]},
                    "timestamp": {"$gte": one_day_ago}
                }
            },
            {
                "$group": {
                    "_id": "$user_id",
                    "count": {"$sum": 1}
                }
            },
            {"$match": {"count": {"$gte": 10}}}
        ]

        mass_exports = await self.db.audit_logs.aggregate(pipeline).to_list(100)

        for item in mass_exports:
            anomalies.append({
                "type": "mass_data_export",
                "user_id": item["_id"],
                "count": item["count"],
                "severity": "critical",
                "detected_at": datetime.utcnow()
            })

        # Accesos fuera de horario (opcional, ajustar según necesidad)
        # ...

        return anomalies

    async def generate_summary(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> AuditSummary:
        """
        Generar resumen de auditoría para un período.

        Args:
            start_date: Fecha inicio
            end_date: Fecha fin

        Returns:
            Resumen de auditoría
        """
        base_query = {"timestamp": {"$gte": start_date, "$lte": end_date}}

        # Total de eventos
        total_events = await self.db.audit_logs.count_documents(base_query)

        # Eventos por acción
        pipeline = [
            {"$match": base_query},
            {"$group": {"_id": "$action", "count": {"$sum": 1}}}
        ]
        by_action = {doc["_id"]: doc["count"] async for doc in self.db.audit_logs.aggregate(pipeline)}

        # Eventos por usuario
        pipeline = [
            {"$match": base_query},
            {"$group": {"_id": "$user_id", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 20}
        ]
        by_user = {doc["_id"]: doc["count"] async for doc in self.db.audit_logs.aggregate(pipeline)}

        # Eventos fallidos
        failed_events = await self.db.audit_logs.count_documents({
            **base_query,
            "success": False
        })

        # Anomalías
        anomalies = await self.detect_anomalies()

        return AuditSummary(
            period_start=start_date,
            period_end=end_date,
            total_events=total_events,
            events_by_action=by_action,
            events_by_user=by_user,
            failed_events=failed_events,
            anomalies_detected=len(anomalies)
        )


# ═══════════════════════════════════════════
# DECORADOR DE AUDITORÍA
# ═══════════════════════════════════════════

def audit_action(action: AuditAction, resource_type: str = None):
    """
    Decorador para auditar automáticamente endpoints.

    Uso:
        @router.get("/customers/{customer_id}")
        @audit_action(AuditAction.CUSTOMER_VIEW, resource_type="customer")
        async def get_customer(request: Request, customer_id: str):
            ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            from fastapi import Request
            import time

            # Buscar request en args o kwargs
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            if not request:
                request = kwargs.get('request')

            if not request:
                # Sin request, ejecutar sin auditar
                return await func(*args, **kwargs)

            audit_service = getattr(request.app.state, 'audit_service', None)
            current_user = getattr(request.state, 'user', None)

            if not audit_service or not current_user:
                return await func(*args, **kwargs)

            # Extraer resource_id de kwargs
            resource_id = (
                kwargs.get('id') or
                kwargs.get('order_id') or
                kwargs.get('guide_id') or
                kwargs.get('customer_id') or
                kwargs.get('resource_id')
            )

            start_time = time.time()

            try:
                result = await func(*args, **kwargs)

                await audit_service.log(
                    action=action,
                    user_id=current_user.user_id,
                    user_email=current_user.email,
                    user_role=current_user.role.value,
                    ip_address=request.client.host if request.client else "unknown",
                    user_agent=request.headers.get("user-agent", ""),
                    resource_type=resource_type,
                    resource_id=str(resource_id) if resource_id else None,
                    country=current_user.country,
                    success=True,
                    duration_ms=(time.time() - start_time) * 1000
                )

                return result

            except Exception as e:
                await audit_service.log(
                    action=action,
                    user_id=current_user.user_id,
                    user_email=current_user.email,
                    user_role=current_user.role.value,
                    ip_address=request.client.host if request.client else "unknown",
                    user_agent=request.headers.get("user-agent", ""),
                    resource_type=resource_type,
                    resource_id=str(resource_id) if resource_id else None,
                    country=current_user.country,
                    success=False,
                    error_message=str(e),
                    duration_ms=(time.time() - start_time) * 1000
                )
                raise

        return wrapper
    return decorator
