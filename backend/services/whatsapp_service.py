"""
LITPER - Servicio de Integración WhatsApp Business API
Soporte para Meta Official API, Twilio y Chatea Pro
"""

import os
import httpx
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field
from enum import Enum
from loguru import logger


class WhatsAppProvider(str, Enum):
    """Proveedores de WhatsApp soportados"""
    META_OFFICIAL = "META_OFFICIAL"
    TWILIO = "TWILIO"
    CHATEA_PRO = "CHATEA_PRO"


class MessageStatus(str, Enum):
    """Estados de mensaje"""
    PENDING = "PENDING"
    SENT = "SENT"
    DELIVERED = "DELIVERED"
    READ = "READ"
    FAILED = "FAILED"


class MessageType(str, Enum):
    """Tipos de mensaje"""
    TEXT = "TEXT"
    TEMPLATE = "TEMPLATE"
    INTERACTIVE = "INTERACTIVE"
    MEDIA = "MEDIA"


@dataclass
class WhatsAppMessage:
    """Mensaje de WhatsApp"""
    id: str = ""
    phone: str = ""
    content: str = ""
    message_type: MessageType = MessageType.TEXT
    template_name: str = ""
    template_params: Dict = field(default_factory=dict)
    status: MessageStatus = MessageStatus.PENDING
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    error_message: str = ""


@dataclass
class SendResult:
    """Resultado de envío"""
    success: bool
    message_id: str = ""
    phone: str = ""
    error_message: str = ""
    provider: WhatsAppProvider = WhatsAppProvider.META_OFFICIAL


# Templates predefinidos para logística
MESSAGE_TEMPLATES = {
    'DELIVERY_ATTEMPT_FAILED': {
        'name': 'delivery_attempt_failed',
        'text': """Hola {nombre}!

No pudimos entregarte tu pedido con guia {guia}.

Motivo: {motivo}

Por favor responde con una de estas opciones:
1. Estaré disponible mañana
2. Cambiar dirección de entrega
3. Recoger en punto cercano
4. Hablar con un asesor

Tu pedido está seguro con nosotros.""",
        'buttons': ['Mañana', 'Cambiar dir.', 'Punto cercano', 'Asesor']
    },

    'OUT_FOR_DELIVERY': {
        'name': 'out_for_delivery',
        'text': """Hola {nombre}!

Tu pedido {guia} ya salió a reparto!

Llegará hoy entre {hora_inicio} y {hora_fin}.

El repartidor te contactará antes de llegar.

Tracking: {link_tracking}""",
    },

    'DELIVERY_CONFIRMED': {
        'name': 'delivery_confirmed',
        'text': """Excelente {nombre}!

Tu pedido {guia} fue entregado exitosamente.

Gracias por tu compra!

Califica tu experiencia: {link_rating}""",
    },

    'RESCUE_CONTACT': {
        'name': 'rescue_contact',
        'text': """Hola {nombre}!

Hemos intentado entregarte el pedido {guia} sin éxito.

Queremos asegurarnos de que lo recibas. Por favor confirma:
- Tu dirección actual
- Horario en que estarás disponible
- Número de contacto alternativo

Responde este mensaje y un asesor te ayudará.""",
    },

    'DELAY_NOTIFICATION': {
        'name': 'delay_notification',
        'text': """Hola {nombre},

Te informamos que tu pedido {guia} tiene un pequeño retraso.

Nueva fecha estimada: {nueva_fecha}
Motivo: {motivo}

Disculpa las molestias. Estamos trabajando para entregártelo lo antes posible.

Seguimiento: {link_tracking}""",
    },

    'PICKUP_REMINDER': {
        'name': 'pickup_reminder',
        'text': """Hola {nombre}!

Tu pedido {guia} está listo para recoger en:

{direccion_punto}

Horario: {horario}

Tienes hasta el {fecha_limite} para recogerlo.

Presenta tu cédula al momento de recoger.""",
    },
}


class BaseWhatsAppProvider(ABC):
    """Proveedor base de WhatsApp"""

    @abstractmethod
    async def send_message(
        self,
        phone: str,
        message: str,
        template_name: Optional[str] = None,
        template_params: Optional[Dict] = None
    ) -> SendResult:
        pass

    @abstractmethod
    async def send_template(
        self,
        phone: str,
        template_name: str,
        params: Dict
    ) -> SendResult:
        pass

    def format_phone(self, phone: str) -> str:
        """Formatea número de teléfono a formato internacional"""
        # Limpiar caracteres no numéricos
        clean = ''.join(filter(str.isdigit, phone))

        # Si empieza con 57, ya está en formato Colombia
        if clean.startswith('57'):
            return clean

        # Si tiene 10 dígitos, agregar código de Colombia
        if len(clean) == 10:
            return f'57{clean}'

        # Si tiene 7 dígitos (fijo), agregar indicativo
        if len(clean) == 7:
            return f'571{clean}'  # Bogotá por defecto

        return clean


class MetaOfficialProvider(BaseWhatsAppProvider):
    """Proveedor oficial de Meta (Facebook)"""

    API_URL = "https://graph.facebook.com/v18.0"

    def __init__(self):
        self.access_token = os.getenv('META_WHATSAPP_TOKEN', '')
        self.phone_number_id = os.getenv('META_PHONE_NUMBER_ID', '')
        self.client = httpx.AsyncClient(timeout=30.0)

    async def send_message(
        self,
        phone: str,
        message: str,
        template_name: Optional[str] = None,
        template_params: Optional[Dict] = None
    ) -> SendResult:
        try:
            if not self.access_token:
                return self._simulate_send(phone, message)

            formatted_phone = self.format_phone(phone)

            payload = {
                "messaging_product": "whatsapp",
                "to": formatted_phone,
                "type": "text",
                "text": {"body": message}
            }

            response = await self.client.post(
                f"{self.API_URL}/{self.phone_number_id}/messages",
                json=payload,
                headers={
                    "Authorization": f"Bearer {self.access_token}",
                    "Content-Type": "application/json"
                }
            )

            if response.status_code == 200:
                data = response.json()
                return SendResult(
                    success=True,
                    message_id=data.get('messages', [{}])[0].get('id', ''),
                    phone=formatted_phone,
                    provider=WhatsAppProvider.META_OFFICIAL
                )
            else:
                return SendResult(
                    success=False,
                    phone=formatted_phone,
                    error_message=f"HTTP {response.status_code}: {response.text}",
                    provider=WhatsAppProvider.META_OFFICIAL
                )

        except Exception as e:
            logger.error(f"Error Meta WhatsApp: {e}")
            return SendResult(
                success=False,
                phone=phone,
                error_message=str(e),
                provider=WhatsAppProvider.META_OFFICIAL
            )

    async def send_template(
        self,
        phone: str,
        template_name: str,
        params: Dict
    ) -> SendResult:
        try:
            if not self.access_token:
                template = MESSAGE_TEMPLATES.get(template_name, {})
                text = template.get('text', '').format(**params)
                return self._simulate_send(phone, text)

            formatted_phone = self.format_phone(phone)

            # Construir componentes del template
            components = []
            if params:
                body_params = [{"type": "text", "text": str(v)} for v in params.values()]
                components.append({
                    "type": "body",
                    "parameters": body_params
                })

            payload = {
                "messaging_product": "whatsapp",
                "to": formatted_phone,
                "type": "template",
                "template": {
                    "name": template_name.lower(),
                    "language": {"code": "es"},
                    "components": components
                }
            }

            response = await self.client.post(
                f"{self.API_URL}/{self.phone_number_id}/messages",
                json=payload,
                headers={
                    "Authorization": f"Bearer {self.access_token}",
                    "Content-Type": "application/json"
                }
            )

            if response.status_code == 200:
                data = response.json()
                return SendResult(
                    success=True,
                    message_id=data.get('messages', [{}])[0].get('id', ''),
                    phone=formatted_phone,
                    provider=WhatsAppProvider.META_OFFICIAL
                )
            else:
                return SendResult(
                    success=False,
                    phone=formatted_phone,
                    error_message=response.text,
                    provider=WhatsAppProvider.META_OFFICIAL
                )

        except Exception as e:
            logger.error(f"Error sending template: {e}")
            return SendResult(
                success=False,
                phone=phone,
                error_message=str(e),
                provider=WhatsAppProvider.META_OFFICIAL
            )

    def _simulate_send(self, phone: str, message: str) -> SendResult:
        """Simula envío cuando no hay credenciales"""
        import uuid
        logger.info(f"[SIMULADO] WhatsApp a {phone}: {message[:50]}...")
        return SendResult(
            success=True,
            message_id=f"sim_{uuid.uuid4().hex[:12]}",
            phone=self.format_phone(phone),
            provider=WhatsAppProvider.META_OFFICIAL
        )


class TwilioProvider(BaseWhatsAppProvider):
    """Proveedor Twilio"""

    API_URL = "https://api.twilio.com/2010-04-01"

    def __init__(self):
        self.account_sid = os.getenv('TWILIO_ACCOUNT_SID', '')
        self.auth_token = os.getenv('TWILIO_AUTH_TOKEN', '')
        self.from_number = os.getenv('TWILIO_WHATSAPP_NUMBER', '')
        self.client = httpx.AsyncClient(timeout=30.0)

    async def send_message(
        self,
        phone: str,
        message: str,
        template_name: Optional[str] = None,
        template_params: Optional[Dict] = None
    ) -> SendResult:
        try:
            if not self.account_sid:
                return self._simulate_send(phone, message)

            formatted_phone = self.format_phone(phone)

            response = await self.client.post(
                f"{self.API_URL}/Accounts/{self.account_sid}/Messages.json",
                data={
                    "From": f"whatsapp:{self.from_number}",
                    "To": f"whatsapp:+{formatted_phone}",
                    "Body": message
                },
                auth=(self.account_sid, self.auth_token)
            )

            if response.status_code in [200, 201]:
                data = response.json()
                return SendResult(
                    success=True,
                    message_id=data.get('sid', ''),
                    phone=formatted_phone,
                    provider=WhatsAppProvider.TWILIO
                )
            else:
                return SendResult(
                    success=False,
                    phone=formatted_phone,
                    error_message=response.text,
                    provider=WhatsAppProvider.TWILIO
                )

        except Exception as e:
            logger.error(f"Error Twilio: {e}")
            return SendResult(
                success=False,
                phone=phone,
                error_message=str(e),
                provider=WhatsAppProvider.TWILIO
            )

    async def send_template(
        self,
        phone: str,
        template_name: str,
        params: Dict
    ) -> SendResult:
        # Twilio usa content templates diferente
        template = MESSAGE_TEMPLATES.get(template_name, {})
        text = template.get('text', '').format(**params)
        return await self.send_message(phone, text)

    def _simulate_send(self, phone: str, message: str) -> SendResult:
        import uuid
        logger.info(f"[SIMULADO] Twilio WhatsApp a {phone}")
        return SendResult(
            success=True,
            message_id=f"SM{uuid.uuid4().hex[:32]}",
            phone=self.format_phone(phone),
            provider=WhatsAppProvider.TWILIO
        )


class WhatsAppService:
    """
    Servicio principal de WhatsApp
    Gestiona múltiples proveedores y templates
    """

    def __init__(self):
        self.providers: Dict[WhatsAppProvider, BaseWhatsAppProvider] = {
            WhatsAppProvider.META_OFFICIAL: MetaOfficialProvider(),
            WhatsAppProvider.TWILIO: TwilioProvider(),
        }

        # Determinar proveedor activo
        self.active_provider = self._detect_active_provider()
        self.message_history: List[WhatsAppMessage] = []
        self.templates = MESSAGE_TEMPLATES

    def _detect_active_provider(self) -> WhatsAppProvider:
        """Detecta qué proveedor tiene credenciales configuradas"""
        if os.getenv('META_WHATSAPP_TOKEN'):
            return WhatsAppProvider.META_OFFICIAL
        elif os.getenv('TWILIO_ACCOUNT_SID'):
            return WhatsAppProvider.TWILIO
        else:
            # Default a Meta (simulado)
            return WhatsAppProvider.META_OFFICIAL

    async def send_message(
        self,
        phone: str,
        message: str,
        provider: Optional[WhatsAppProvider] = None
    ) -> SendResult:
        """
        Envía un mensaje de texto simple

        Args:
            phone: Número de teléfono
            message: Contenido del mensaje
            provider: Proveedor a usar (opcional)
        """
        provider = provider or self.active_provider
        provider_instance = self.providers.get(provider)

        if not provider_instance:
            return SendResult(
                success=False,
                phone=phone,
                error_message=f"Proveedor {provider} no disponible"
            )

        result = await provider_instance.send_message(phone, message)

        # Registrar en historial
        self._log_message(phone, message, MessageType.TEXT, result)

        return result

    async def send_template(
        self,
        phone: str,
        template_name: str,
        params: Dict,
        provider: Optional[WhatsAppProvider] = None
    ) -> SendResult:
        """
        Envía un mensaje usando template predefinido

        Args:
            phone: Número de teléfono
            template_name: Nombre del template
            params: Parámetros para el template
            provider: Proveedor a usar (opcional)
        """
        if template_name not in self.templates:
            return SendResult(
                success=False,
                phone=phone,
                error_message=f"Template '{template_name}' no encontrado"
            )

        provider = provider or self.active_provider
        provider_instance = self.providers.get(provider)

        if not provider_instance:
            return SendResult(
                success=False,
                phone=phone,
                error_message=f"Proveedor {provider} no disponible"
            )

        result = await provider_instance.send_template(phone, template_name, params)

        # Registrar
        template = self.templates[template_name]
        text = template.get('text', '').format(**params)
        self._log_message(phone, text, MessageType.TEMPLATE, result)

        return result

    async def send_delivery_failed(
        self,
        phone: str,
        nombre: str,
        guia: str,
        motivo: str
    ) -> SendResult:
        """Envía notificación de intento de entrega fallido"""
        return await self.send_template(
            phone=phone,
            template_name='DELIVERY_ATTEMPT_FAILED',
            params={
                'nombre': nombre,
                'guia': guia,
                'motivo': motivo
            }
        )

    async def send_out_for_delivery(
        self,
        phone: str,
        nombre: str,
        guia: str,
        hora_inicio: str = "2:00 PM",
        hora_fin: str = "6:00 PM",
        link_tracking: str = ""
    ) -> SendResult:
        """Envía notificación de en reparto"""
        return await self.send_template(
            phone=phone,
            template_name='OUT_FOR_DELIVERY',
            params={
                'nombre': nombre,
                'guia': guia,
                'hora_inicio': hora_inicio,
                'hora_fin': hora_fin,
                'link_tracking': link_tracking or f"https://litper.co/track/{guia}"
            }
        )

    async def send_rescue_contact(
        self,
        phone: str,
        nombre: str,
        guia: str
    ) -> SendResult:
        """Envía mensaje de rescate de guía"""
        return await self.send_template(
            phone=phone,
            template_name='RESCUE_CONTACT',
            params={
                'nombre': nombre,
                'guia': guia
            }
        )

    async def send_bulk_messages(
        self,
        contacts: List[Dict[str, Any]],
        template_name: str
    ) -> List[SendResult]:
        """
        Envía mensajes masivos

        Args:
            contacts: Lista de {phone, nombre, guia, ...params}
            template_name: Template a usar
        """
        results = []

        for contact in contacts:
            phone = contact.pop('phone', contact.pop('telefono', ''))
            if not phone:
                continue

            result = await self.send_template(
                phone=phone,
                template_name=template_name,
                params=contact
            )
            results.append(result)

            # Pequeña pausa para evitar rate limiting
            import asyncio
            await asyncio.sleep(0.1)

        return results

    def _log_message(
        self,
        phone: str,
        content: str,
        msg_type: MessageType,
        result: SendResult
    ):
        """Registra mensaje en historial"""
        msg = WhatsAppMessage(
            id=result.message_id,
            phone=phone,
            content=content,
            message_type=msg_type,
            status=MessageStatus.SENT if result.success else MessageStatus.FAILED,
            sent_at=datetime.now() if result.success else None,
            error_message=result.error_message
        )
        self.message_history.append(msg)

        # Mantener últimos 1000 mensajes
        if len(self.message_history) > 1000:
            self.message_history = self.message_history[-1000:]

    def get_templates(self) -> Dict:
        """Retorna templates disponibles"""
        return {
            name: {
                'name': name,
                'preview': template.get('text', '')[:100] + '...',
                'has_buttons': 'buttons' in template
            }
            for name, template in self.templates.items()
        }

    def get_stats(self) -> Dict:
        """Retorna estadísticas del servicio"""
        total = len(self.message_history)
        sent = sum(1 for m in self.message_history if m.status == MessageStatus.SENT)
        failed = sum(1 for m in self.message_history if m.status == MessageStatus.FAILED)

        return {
            "active_provider": self.active_provider.value,
            "total_messages": total,
            "sent": sent,
            "failed": failed,
            "success_rate": round(sent / total * 100, 1) if total > 0 else 0
        }

    def generate_whatsapp_url(self, phone: str, message: str) -> str:
        """Genera URL de WhatsApp Web para envío manual"""
        import urllib.parse

        clean_phone = ''.join(filter(str.isdigit, phone))
        if not clean_phone.startswith('57'):
            clean_phone = f'57{clean_phone}'

        encoded_msg = urllib.parse.quote(message)
        return f"https://wa.me/{clean_phone}?text={encoded_msg}"


# Singleton
whatsapp_service = WhatsAppService()
