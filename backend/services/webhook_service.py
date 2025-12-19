"""
Servicio de Webhooks para el sistema Litper Pro.
Permite integraciones externas mediante eventos HTTP.
"""

import os
import json
import hmac
import hashlib
import asyncio
from datetime import datetime
from typing import Dict, List, Optional, Any
from loguru import logger

# Intentar importar httpx (opcional)
try:
    import httpx
    HTTPX_AVAILABLE = True
except ImportError:
    HTTPX_AVAILABLE = False
    logger.warning("httpx no instalado. Webhooks deshabilitados.")


class WebhookService:
    """Servicio para gestionar y despachar webhooks"""

    # Delays para reintentos
    RETRY_DELAYS = [60, 300, 1800, 7200]  # 1min, 5min, 30min, 2hrs
    MAX_FAILURES = 10  # Máximo de fallos antes de desactivar

    # Eventos disponibles
    AVAILABLE_EVENTS = {
        "shipment.created": "Nueva guía creada en el sistema",
        "shipment.status_changed": "Cambio de estado de una guía",
        "shipment.delivered": "Guía entregada exitosamente",
        "shipment.delayed": "Guía marcada como retrasada",
        "shipment.returned": "Guía devuelta al remitente",
        "shipment.exception": "Novedad registrada en una guía",
        "alert.created": "Nueva alerta del sistema",
        "alert.resolved": "Alerta resuelta",
        "alert.critical": "Alerta crítica generada",
        "report.generated": "Reporte generado",
        "ml.training_complete": "Modelo ML entrenado",
        "ml.prediction_made": "Predicción ML realizada",
        "file.uploaded": "Archivo Excel cargado",
        "file.processed": "Archivo procesado exitosamente",
        "test.ping": "Evento de prueba",
    }

    def __init__(self):
        self.timeout = float(os.getenv('WEBHOOK_TIMEOUT', '30'))
        self.user_agent = "LitperPro-Webhook/1.0"

    def is_available(self) -> bool:
        """Verifica si el servicio está disponible"""
        return HTTPX_AVAILABLE

    def generate_signature(self, payload: str, secret: str) -> str:
        """
        Genera firma HMAC-SHA256 del payload.

        Args:
            payload: String JSON del payload
            secret: Secret key del webhook

        Returns:
            Firma hexadecimal
        """
        return hmac.new(
            secret.encode('utf-8'),
            payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

    def verify_signature(self, payload: str, signature: str, secret: str) -> bool:
        """
        Verifica la firma de un payload entrante.

        Args:
            payload: String JSON del payload
            signature: Firma recibida
            secret: Secret key esperado

        Returns:
            True si la firma es válida
        """
        expected = self.generate_signature(payload, secret)
        return hmac.compare_digest(expected, signature)

    async def deliver(
        self,
        url: str,
        event_type: str,
        payload: Dict[str, Any],
        secret: str,
        webhook_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Entrega un webhook a una URL específica.

        Args:
            url: URL destino del webhook
            event_type: Tipo de evento
            payload: Datos del evento
            secret: Secret para firmar el payload
            webhook_id: ID del webhook (opcional)

        Returns:
            Dict con resultado de la entrega
        """
        if not self.is_available():
            return {
                "success": False,
                "error": "httpx not available",
                "webhook_id": webhook_id
            }

        # Construir payload completo
        full_payload = {
            "event": event_type,
            "timestamp": datetime.utcnow().isoformat(),
            "webhook_id": webhook_id,
            "data": payload
        }

        payload_str = json.dumps(full_payload, sort_keys=True, ensure_ascii=False)
        signature = self.generate_signature(payload_str, secret)

        headers = {
            "Content-Type": "application/json",
            "X-Webhook-Signature": f"sha256={signature}",
            "X-Webhook-Event": event_type,
            "X-Webhook-Timestamp": datetime.utcnow().isoformat(),
            "User-Agent": self.user_agent
        }

        result = {
            "webhook_id": webhook_id,
            "event_type": event_type,
            "url": url,
            "success": False,
            "status_code": None,
            "response_body": None,
            "error": None,
            "delivered_at": None
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    url,
                    content=payload_str,
                    headers=headers
                )

                result["status_code"] = response.status_code
                result["response_body"] = response.text[:1000]  # Limitar respuesta
                result["success"] = 200 <= response.status_code < 300
                result["delivered_at"] = datetime.utcnow().isoformat()

                if result["success"]:
                    logger.debug(f"Webhook entregado: {event_type} -> {url[:50]}...")
                else:
                    logger.warning(
                        f"Webhook fallido ({response.status_code}): {event_type} -> {url[:50]}..."
                    )

        except httpx.TimeoutException:
            result["error"] = "timeout"
            logger.warning(f"Webhook timeout: {event_type} -> {url[:50]}...")

        except httpx.RequestError as e:
            result["error"] = str(e)
            logger.error(f"Webhook error: {event_type} -> {url[:50]}... - {e}")

        except Exception as e:
            result["error"] = str(e)
            logger.error(f"Webhook error inesperado: {e}")

        return result

    async def dispatch(
        self,
        event_type: str,
        payload: Dict[str, Any],
        webhooks: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Despacha un evento a todos los webhooks suscritos.

        Args:
            event_type: Tipo de evento
            payload: Datos del evento
            webhooks: Lista de webhooks a notificar

        Returns:
            Dict con resumen de resultados
        """
        if not webhooks:
            return {"total": 0, "success": 0, "failed": 0, "results": []}

        results = {
            "total": len(webhooks),
            "success": 0,
            "failed": 0,
            "results": []
        }

        # Ejecutar entregas en paralelo
        tasks = [
            self.deliver(
                url=wh.get("url"),
                event_type=event_type,
                payload=payload,
                secret=wh.get("secret", ""),
                webhook_id=wh.get("id")
            )
            for wh in webhooks
            if wh.get("is_active", True) and event_type in wh.get("events", [])
        ]

        if tasks:
            delivery_results = await asyncio.gather(*tasks, return_exceptions=True)

            for result in delivery_results:
                if isinstance(result, Exception):
                    results["failed"] += 1
                    results["results"].append({
                        "success": False,
                        "error": str(result)
                    })
                elif result.get("success"):
                    results["success"] += 1
                    results["results"].append(result)
                else:
                    results["failed"] += 1
                    results["results"].append(result)

        logger.info(
            f"Dispatch completado [{event_type}]: "
            f"{results['success']}/{results['total']} exitosos"
        )

        return results

    def get_available_events(self) -> Dict[str, str]:
        """Retorna los eventos disponibles para webhooks"""
        return self.AVAILABLE_EVENTS.copy()

    # === Helpers para eventos específicos ===

    def create_shipment_payload(
        self,
        guia: str,
        estado: str,
        transportadora: Optional[str] = None,
        destinatario: Optional[str] = None,
        ciudad: Optional[str] = None,
        extra: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Crea payload para eventos de envío"""
        payload = {
            "guia": guia,
            "estado": estado,
            "transportadora": transportadora,
            "destinatario": destinatario,
            "ciudad": ciudad,
            "timestamp": datetime.utcnow().isoformat()
        }
        if extra:
            payload.update(extra)
        return payload

    def create_alert_payload(
        self,
        tipo: str,
        mensaje: str,
        severidad: str,
        cantidad: int = 1,
        guias: Optional[List[str]] = None,
        extra: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Crea payload para eventos de alerta"""
        payload = {
            "tipo": tipo,
            "mensaje": mensaje,
            "severidad": severidad,
            "cantidad": cantidad,
            "guias": guias or [],
            "timestamp": datetime.utcnow().isoformat()
        }
        if extra:
            payload.update(extra)
        return payload


# Instancia singleton
webhook_service = WebhookService()
