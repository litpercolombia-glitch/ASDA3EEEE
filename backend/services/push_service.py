"""
Servicio de Push Notifications para el sistema Litper Pro.
Maneja el envío de notificaciones push a los usuarios suscritos.
"""

import os
import json
import hashlib
import hmac
from datetime import datetime
from typing import Dict, List, Optional, Any
from loguru import logger

# Intentar importar pywebpush (opcional)
try:
    from pywebpush import webpush, WebPushException
    WEBPUSH_AVAILABLE = True
except ImportError:
    WEBPUSH_AVAILABLE = False
    logger.warning("pywebpush no instalado. Push notifications deshabilitadas.")


class PushNotificationService:
    """Servicio para gestionar y enviar push notifications"""

    # Delays para reintentos (en segundos)
    RETRY_DELAYS = [60, 300, 1800, 7200]  # 1min, 5min, 30min, 2hrs

    def __init__(self):
        self.vapid_private_key = os.getenv('VAPID_PRIVATE_KEY', '')
        self.vapid_public_key = os.getenv('VAPID_PUBLIC_KEY', '')
        self.vapid_claims = {
            "sub": os.getenv('VAPID_CONTACT', 'mailto:soporte@litper.com')
        }

    def is_available(self) -> bool:
        """Verifica si el servicio está disponible"""
        return WEBPUSH_AVAILABLE and bool(self.vapid_private_key) and bool(self.vapid_public_key)

    def get_public_key(self) -> Optional[str]:
        """Retorna la VAPID public key"""
        return self.vapid_public_key if self.vapid_public_key else None

    async def send_notification(
        self,
        subscription_info: Dict[str, Any],
        payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Envía una push notification a un suscriptor.

        Args:
            subscription_info: Información de la suscripción (endpoint, keys)
            payload: Datos a enviar en la notificación

        Returns:
            Dict con resultado de la operación
        """
        if not self.is_available():
            return {"success": False, "error": "Push service not available"}

        try:
            webpush(
                subscription_info=subscription_info,
                data=json.dumps(payload, ensure_ascii=False),
                vapid_private_key=self.vapid_private_key,
                vapid_claims=self.vapid_claims,
                timeout=30
            )
            logger.debug(f"Push notification enviada a: {subscription_info.get('endpoint', '')[:50]}...")
            return {"success": True}

        except WebPushException as e:
            error_code = e.response.status_code if e.response else None

            if error_code == 410:
                # Suscripción expirada
                logger.info("Suscripción push expirada")
                return {"success": False, "error": "expired", "status_code": 410}

            elif error_code == 404:
                # Suscripción no encontrada
                logger.info("Suscripción push no encontrada")
                return {"success": False, "error": "not_found", "status_code": 404}

            else:
                logger.error(f"Error enviando push: {e}")
                return {"success": False, "error": str(e), "status_code": error_code}

        except Exception as e:
            logger.error(f"Error inesperado enviando push: {e}")
            return {"success": False, "error": str(e)}

    async def broadcast_notification(
        self,
        subscriptions: List[Dict[str, Any]],
        payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Envía una notificación a múltiples suscriptores.

        Args:
            subscriptions: Lista de suscripciones
            payload: Datos a enviar

        Returns:
            Dict con resumen de resultados
        """
        results = {
            "total": len(subscriptions),
            "success": 0,
            "failed": 0,
            "expired": []
        }

        for sub in subscriptions:
            subscription_info = {
                "endpoint": sub.get("endpoint"),
                "keys": {
                    "p256dh": sub.get("p256dh_key"),
                    "auth": sub.get("auth_key")
                }
            }

            result = await self.send_notification(subscription_info, payload)

            if result.get("success"):
                results["success"] += 1
            else:
                results["failed"] += 1
                if result.get("error") == "expired":
                    results["expired"].append(sub.get("endpoint"))

        logger.info(
            f"Broadcast completado: {results['success']}/{results['total']} exitosos"
        )
        return results

    def create_notification_payload(
        self,
        title: str,
        body: str,
        icon: str = "/icons/icon-192x192.png",
        badge: str = "/icons/icon-72x72.png",
        url: str = "/",
        tag: str = "litper-notification",
        data: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Crea un payload estándar para notificaciones.

        Args:
            title: Título de la notificación
            body: Cuerpo del mensaje
            icon: URL del icono
            badge: URL del badge
            url: URL a abrir al hacer clic
            tag: Tag para agrupar notificaciones
            data: Datos adicionales

        Returns:
            Dict con el payload formateado
        """
        return {
            "title": title,
            "body": body,
            "icon": icon,
            "badge": badge,
            "url": url,
            "tag": tag,
            "timestamp": datetime.utcnow().isoformat(),
            "data": data or {}
        }

    # === Notificaciones específicas del negocio ===

    async def notify_shipment_status_change(
        self,
        subscriptions: List[Dict],
        guia: str,
        nuevo_estado: str,
        destinatario: Optional[str] = None
    ) -> Dict[str, Any]:
        """Notifica cambio de estado de un envío"""

        status_messages = {
            "delivered": "Entregado exitosamente",
            "ENTREGADO": "Entregado exitosamente",
            "in_transit": "En camino",
            "EN TRANSITO": "En camino",
            "issue": "Tiene una novedad",
            "NOVEDAD": "Tiene una novedad",
            "in_office": "Disponible en oficina",
            "EN OFICINA": "Disponible en oficina",
            "returned": "Devuelto al remitente",
            "DEVUELTO": "Devuelto al remitente",
        }

        message = status_messages.get(nuevo_estado, nuevo_estado)

        payload = self.create_notification_payload(
            title=f"Actualización Guía {guia[:12]}...",
            body=f"{message}{f' - {destinatario}' if destinatario else ''}",
            url=f"/?tab=seguimiento&guia={guia}",
            tag=f"shipment-{guia}",
            data={"guia": guia, "estado": nuevo_estado}
        )

        return await self.broadcast_notification(subscriptions, payload)

    async def notify_critical_alert(
        self,
        subscriptions: List[Dict],
        mensaje: str,
        cantidad: int,
        tipo: str = "critico"
    ) -> Dict[str, Any]:
        """Notifica alertas críticas del sistema"""

        payload = self.create_notification_payload(
            title=f"Alerta {tipo.capitalize()} - LITPER PRO",
            body=f"{cantidad} guías requieren atención: {mensaje}",
            url="/?tab=alertas",
            tag="critical-alert",
            data={"tipo": tipo, "cantidad": cantidad}
        )

        return await self.broadcast_notification(subscriptions, payload)

    async def notify_daily_summary(
        self,
        subscriptions: List[Dict],
        entregadas: int,
        pendientes: int,
        novedades: int
    ) -> Dict[str, Any]:
        """Envía resumen diario de operaciones"""

        payload = self.create_notification_payload(
            title="Resumen del Día - LITPER PRO",
            body=f"✅ {entregadas} entregadas | ⏳ {pendientes} pendientes | ⚠️ {novedades} novedades",
            url="/?tab=dashboard",
            tag="daily-summary",
            data={
                "entregadas": entregadas,
                "pendientes": pendientes,
                "novedades": novedades
            }
        )

        return await self.broadcast_notification(subscriptions, payload)


# Instancia singleton
push_service = PushNotificationService()
