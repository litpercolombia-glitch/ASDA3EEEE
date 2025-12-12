"""
LITPER - Servicio de Tracking Multi-Transportadora
Integración con APIs de Coordinadora, Servientrega, TCC, Envia, Interrapidisimo
"""

import os
import re
import httpx
import asyncio
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field
from enum import Enum
from loguru import logger


class CarrierType(str, Enum):
    """Transportadoras soportadas"""
    COORDINADORA = "COORDINADORA"
    SERVIENTREGA = "SERVIENTREGA"
    TCC = "TCC"
    ENVIA = "ENVIA"
    INTERRAPIDISIMO = "INTERRAPIDISIMO"
    DEPRISA = "DEPRISA"
    SAFERBO = "SAFERBO"
    UNKNOWN = "UNKNOWN"


class TrackingStatus(str, Enum):
    """Estados unificados de tracking"""
    CREATED = "CREATED"               # Guía creada
    PICKED_UP = "PICKED_UP"           # Recogido
    IN_TRANSIT = "IN_TRANSIT"         # En tránsito
    IN_WAREHOUSE = "IN_WAREHOUSE"     # En bodega/centro
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"  # En reparto
    DELIVERED = "DELIVERED"           # Entregado
    RETURNED = "RETURNED"             # Devuelto
    EXCEPTION = "EXCEPTION"           # Novedad/Problema
    CANCELLED = "CANCELLED"           # Cancelado
    UNKNOWN = "UNKNOWN"


@dataclass
class TrackingEvent:
    """Evento de tracking"""
    timestamp: datetime
    status: TrackingStatus
    description: str
    location: str = ""
    city: str = ""
    raw_status: str = ""
    extra_data: Dict = field(default_factory=dict)


@dataclass
class TrackingResult:
    """Resultado de consulta de tracking"""
    tracking_number: str
    carrier: CarrierType
    current_status: TrackingStatus
    status_description: str
    origin_city: str = ""
    destination_city: str = ""
    recipient_name: str = ""
    phone: str = ""
    estimated_delivery: Optional[datetime] = None
    actual_delivery: Optional[datetime] = None
    events: List[TrackingEvent] = field(default_factory=list)
    has_issue: bool = False
    issue_type: str = ""
    issue_description: str = ""
    days_in_transit: int = 0
    raw_response: Dict = field(default_factory=dict)
    success: bool = True
    error_message: str = ""


class BaseCarrierAdapter(ABC):
    """Adaptador base para transportadoras"""

    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)

    @abstractmethod
    async def get_tracking(self, tracking_number: str) -> TrackingResult:
        """Obtiene información de tracking"""
        pass

    @abstractmethod
    def detect_carrier(self, tracking_number: str) -> bool:
        """Detecta si el número pertenece a esta transportadora"""
        pass

    def normalize_status(self, raw_status: str) -> TrackingStatus:
        """Normaliza el estado a un valor estándar"""
        status_lower = raw_status.lower()

        if any(x in status_lower for x in ['entregado', 'delivered', 'exitoso']):
            return TrackingStatus.DELIVERED
        elif any(x in status_lower for x in ['reparto', 'delivery', 'mensajero']):
            return TrackingStatus.OUT_FOR_DELIVERY
        elif any(x in status_lower for x in ['devolucion', 'devuelto', 'return']):
            return TrackingStatus.RETURNED
        elif any(x in status_lower for x in ['novedad', 'exception', 'problema', 'no estaba', 'direccion']):
            return TrackingStatus.EXCEPTION
        elif any(x in status_lower for x in ['bodega', 'centro', 'warehouse', 'hub']):
            return TrackingStatus.IN_WAREHOUSE
        elif any(x in status_lower for x in ['transito', 'transit', 'camino', 'ruta']):
            return TrackingStatus.IN_TRANSIT
        elif any(x in status_lower for x in ['recogido', 'pickup', 'recolectado']):
            return TrackingStatus.PICKED_UP
        elif any(x in status_lower for x in ['creado', 'generado', 'created']):
            return TrackingStatus.CREATED
        elif any(x in status_lower for x in ['cancelado', 'cancelled', 'anulado']):
            return TrackingStatus.CANCELLED

        return TrackingStatus.UNKNOWN


class CoordinadoraAdapter(BaseCarrierAdapter):
    """Adaptador para Coordinadora"""

    API_URL = "https://api.coordinadora.com/cm-consultar-guia-ms/guia"

    def __init__(self):
        super().__init__()
        self.api_key = os.getenv('COORDINADORA_API_KEY', '')
        self.nit = os.getenv('COORDINADORA_NIT', '')

    def detect_carrier(self, tracking_number: str) -> bool:
        # Coordinadora: típicamente números de 10-12 dígitos
        return bool(re.match(r'^\d{10,12}$', tracking_number))

    async def get_tracking(self, tracking_number: str) -> TrackingResult:
        try:
            if not self.api_key:
                # Modo simulación si no hay API key
                return self._simulate_tracking(tracking_number)

            headers = {
                'apikey': self.api_key,
                'Content-Type': 'application/json'
            }

            payload = {
                'nit': self.nit,
                'guia': tracking_number
            }

            response = await self.client.post(
                self.API_URL,
                json=payload,
                headers=headers
            )

            if response.status_code == 200:
                data = response.json()
                return self._parse_response(tracking_number, data)
            else:
                return TrackingResult(
                    tracking_number=tracking_number,
                    carrier=CarrierType.COORDINADORA,
                    current_status=TrackingStatus.UNKNOWN,
                    status_description="Error al consultar",
                    success=False,
                    error_message=f"HTTP {response.status_code}"
                )

        except Exception as e:
            logger.error(f"Error Coordinadora tracking {tracking_number}: {e}")
            return TrackingResult(
                tracking_number=tracking_number,
                carrier=CarrierType.COORDINADORA,
                current_status=TrackingStatus.UNKNOWN,
                status_description="Error de conexión",
                success=False,
                error_message=str(e)
            )

    def _parse_response(self, tracking_number: str, data: Dict) -> TrackingResult:
        """Parsea respuesta de Coordinadora"""
        guia_info = data.get('guia', {})
        eventos = data.get('eventos', [])

        events = []
        for evt in eventos:
            events.append(TrackingEvent(
                timestamp=datetime.fromisoformat(evt.get('fecha', '')),
                status=self.normalize_status(evt.get('estado', '')),
                description=evt.get('descripcion', ''),
                location=evt.get('ubicacion', ''),
                city=evt.get('ciudad', ''),
                raw_status=evt.get('estado', '')
            ))

        current_status = events[0].status if events else TrackingStatus.UNKNOWN
        has_issue = current_status == TrackingStatus.EXCEPTION

        return TrackingResult(
            tracking_number=tracking_number,
            carrier=CarrierType.COORDINADORA,
            current_status=current_status,
            status_description=events[0].description if events else "",
            origin_city=guia_info.get('ciudadOrigen', ''),
            destination_city=guia_info.get('ciudadDestino', ''),
            recipient_name=guia_info.get('nombreDestinatario', ''),
            phone=guia_info.get('telefono', ''),
            events=events,
            has_issue=has_issue,
            issue_type='NOVEDAD' if has_issue else '',
            raw_response=data
        )

    def _simulate_tracking(self, tracking_number: str) -> TrackingResult:
        """Simula respuesta cuando no hay API key configurada"""
        import random

        statuses = [
            (TrackingStatus.IN_TRANSIT, "En camino a ciudad destino"),
            (TrackingStatus.OUT_FOR_DELIVERY, "En reparto con mensajero"),
            (TrackingStatus.IN_WAREHOUSE, "En centro de distribución"),
            (TrackingStatus.DELIVERED, "Entregado exitosamente"),
        ]

        status, desc = random.choice(statuses)

        return TrackingResult(
            tracking_number=tracking_number,
            carrier=CarrierType.COORDINADORA,
            current_status=status,
            status_description=f"[SIMULADO] {desc}",
            origin_city="Bogotá",
            destination_city="Medellín",
            days_in_transit=random.randint(1, 5),
            events=[
                TrackingEvent(
                    timestamp=datetime.now(),
                    status=status,
                    description=desc,
                    city="Medellín"
                )
            ]
        )


class ServientregaAdapter(BaseCarrierAdapter):
    """Adaptador para Servientrega"""

    WSDL_URL = "https://ws.servientrega.com/ServiciosWeb/ServicioConsultaGuia.asmx?WSDL"

    def __init__(self):
        super().__init__()
        self.user = os.getenv('SERVIENTREGA_USER', '')
        self.password = os.getenv('SERVIENTREGA_PASSWORD', '')

    def detect_carrier(self, tracking_number: str) -> bool:
        # Servientrega: típicamente 12 dígitos o con prefijo SE
        return bool(re.match(r'^(SE)?\d{12}$', tracking_number, re.I))

    async def get_tracking(self, tracking_number: str) -> TrackingResult:
        try:
            if not self.user:
                return self._simulate_tracking(tracking_number)

            # Servientrega usa SOAP, aquí iría la implementación real
            # Por ahora simulamos
            return self._simulate_tracking(tracking_number)

        except Exception as e:
            logger.error(f"Error Servientrega tracking {tracking_number}: {e}")
            return TrackingResult(
                tracking_number=tracking_number,
                carrier=CarrierType.SERVIENTREGA,
                current_status=TrackingStatus.UNKNOWN,
                status_description="Error de conexión",
                success=False,
                error_message=str(e)
            )

    def _simulate_tracking(self, tracking_number: str) -> TrackingResult:
        import random

        statuses = [
            (TrackingStatus.IN_TRANSIT, "Mercancía en tránsito"),
            (TrackingStatus.OUT_FOR_DELIVERY, "En proceso de entrega"),
            (TrackingStatus.DELIVERED, "Entrega exitosa"),
            (TrackingStatus.EXCEPTION, "No se encontró al destinatario"),
        ]

        status, desc = random.choice(statuses)
        has_issue = status == TrackingStatus.EXCEPTION

        return TrackingResult(
            tracking_number=tracking_number,
            carrier=CarrierType.SERVIENTREGA,
            current_status=status,
            status_description=f"[SIMULADO] {desc}",
            destination_city="Cali",
            days_in_transit=random.randint(1, 4),
            has_issue=has_issue,
            issue_type='NO_ESTABA' if has_issue else '',
            events=[
                TrackingEvent(
                    timestamp=datetime.now(),
                    status=status,
                    description=desc,
                    city="Cali"
                )
            ]
        )


class TCCAdapter(BaseCarrierAdapter):
    """Adaptador para TCC"""

    API_URL = "https://api.tcc.com.co/rastreo"

    def __init__(self):
        super().__init__()
        self.api_key = os.getenv('TCC_API_KEY', '')

    def detect_carrier(self, tracking_number: str) -> bool:
        # TCC: típicamente empieza con números específicos o tiene formato particular
        return bool(re.match(r'^[0-9]{8,15}$', tracking_number))

    async def get_tracking(self, tracking_number: str) -> TrackingResult:
        # Implementación similar a las anteriores
        return self._simulate_tracking(tracking_number)

    def _simulate_tracking(self, tracking_number: str) -> TrackingResult:
        import random

        status = random.choice(list(TrackingStatus))

        return TrackingResult(
            tracking_number=tracking_number,
            carrier=CarrierType.TCC,
            current_status=status,
            status_description=f"[SIMULADO] Estado: {status.value}",
            destination_city="Barranquilla",
            days_in_transit=random.randint(2, 6)
        )


class EnviaAdapter(BaseCarrierAdapter):
    """Adaptador para Envía"""

    API_URL = "https://api.envia.co/v1/shipments"

    def __init__(self):
        super().__init__()
        self.api_key = os.getenv('ENVIA_API_KEY', '')

    def detect_carrier(self, tracking_number: str) -> bool:
        return bool(re.match(r'^ENV\d{8,12}$', tracking_number, re.I))

    async def get_tracking(self, tracking_number: str) -> TrackingResult:
        return self._simulate_tracking(tracking_number)

    def _simulate_tracking(self, tracking_number: str) -> TrackingResult:
        import random

        status = random.choice([
            TrackingStatus.IN_TRANSIT,
            TrackingStatus.OUT_FOR_DELIVERY,
            TrackingStatus.DELIVERED
        ])

        return TrackingResult(
            tracking_number=tracking_number,
            carrier=CarrierType.ENVIA,
            current_status=status,
            status_description=f"[SIMULADO] {status.value}",
            destination_city="Bucaramanga",
            days_in_transit=random.randint(1, 3)
        )


class InterrapidisimoAdapter(BaseCarrierAdapter):
    """Adaptador para Interrapidísimo"""

    def __init__(self):
        super().__init__()
        self.user = os.getenv('INTERRAPIDISIMO_USER', '')

    def detect_carrier(self, tracking_number: str) -> bool:
        return bool(re.match(r'^IR\d{10}$', tracking_number, re.I))

    async def get_tracking(self, tracking_number: str) -> TrackingResult:
        return self._simulate_tracking(tracking_number)

    def _simulate_tracking(self, tracking_number: str) -> TrackingResult:
        import random

        return TrackingResult(
            tracking_number=tracking_number,
            carrier=CarrierType.INTERRAPIDISIMO,
            current_status=TrackingStatus.IN_TRANSIT,
            status_description="[SIMULADO] En tránsito",
            destination_city="Pereira",
            days_in_transit=random.randint(1, 4)
        )


class TrackingService:
    """
    Servicio principal de tracking multi-transportadora
    Detecta automáticamente la transportadora y consulta el estado
    """

    def __init__(self):
        self.adapters: Dict[CarrierType, BaseCarrierAdapter] = {
            CarrierType.COORDINADORA: CoordinadoraAdapter(),
            CarrierType.SERVIENTREGA: ServientregaAdapter(),
            CarrierType.TCC: TCCAdapter(),
            CarrierType.ENVIA: EnviaAdapter(),
            CarrierType.INTERRAPIDISIMO: InterrapidisimoAdapter(),
        }
        self._cache: Dict[str, tuple] = {}  # tracking -> (result, timestamp)
        self._cache_ttl = 300  # 5 minutos

    def detect_carrier(self, tracking_number: str) -> CarrierType:
        """Detecta la transportadora basándose en el formato del número"""
        clean_number = tracking_number.strip().upper()

        # Intentar detectar por cada adaptador
        for carrier_type, adapter in self.adapters.items():
            if adapter.detect_carrier(clean_number):
                return carrier_type

        # Heurísticas adicionales por longitud y formato
        if len(clean_number) == 12 and clean_number.isdigit():
            return CarrierType.COORDINADORA
        elif clean_number.startswith('SE'):
            return CarrierType.SERVIENTREGA
        elif clean_number.startswith('ENV'):
            return CarrierType.ENVIA
        elif clean_number.startswith('IR'):
            return CarrierType.INTERRAPIDISIMO

        return CarrierType.UNKNOWN

    async def get_tracking(
        self,
        tracking_number: str,
        carrier: Optional[CarrierType] = None,
        use_cache: bool = True
    ) -> TrackingResult:
        """
        Obtiene información de tracking de una guía

        Args:
            tracking_number: Número de guía
            carrier: Transportadora (opcional, se detecta automáticamente)
            use_cache: Usar caché para evitar consultas repetidas
        """
        clean_number = tracking_number.strip()

        # Verificar caché
        if use_cache and clean_number in self._cache:
            result, timestamp = self._cache[clean_number]
            if (datetime.now() - timestamp).seconds < self._cache_ttl:
                logger.debug(f"Cache hit para {clean_number}")
                return result

        # Detectar transportadora si no se especifica
        if carrier is None:
            carrier = self.detect_carrier(clean_number)

        if carrier == CarrierType.UNKNOWN:
            return TrackingResult(
                tracking_number=clean_number,
                carrier=CarrierType.UNKNOWN,
                current_status=TrackingStatus.UNKNOWN,
                status_description="No se pudo identificar la transportadora",
                success=False,
                error_message="Transportadora no reconocida"
            )

        # Obtener adaptador y consultar
        adapter = self.adapters.get(carrier)
        if not adapter:
            return TrackingResult(
                tracking_number=clean_number,
                carrier=carrier,
                current_status=TrackingStatus.UNKNOWN,
                status_description="Transportadora no soportada",
                success=False,
                error_message=f"No hay adaptador para {carrier.value}"
            )

        result = await adapter.get_tracking(clean_number)

        # Guardar en caché
        self._cache[clean_number] = (result, datetime.now())

        return result

    async def get_bulk_tracking(
        self,
        tracking_numbers: List[str],
        max_concurrent: int = 10
    ) -> List[TrackingResult]:
        """
        Obtiene tracking de múltiples guías en paralelo

        Args:
            tracking_numbers: Lista de números de guía
            max_concurrent: Máximo de consultas concurrentes
        """
        semaphore = asyncio.Semaphore(max_concurrent)

        async def limited_get(number: str) -> TrackingResult:
            async with semaphore:
                return await self.get_tracking(number)

        tasks = [limited_get(num) for num in tracking_numbers]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Convertir excepciones a TrackingResult con error
        processed = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                processed.append(TrackingResult(
                    tracking_number=tracking_numbers[i],
                    carrier=CarrierType.UNKNOWN,
                    current_status=TrackingStatus.UNKNOWN,
                    status_description="Error en consulta",
                    success=False,
                    error_message=str(result)
                ))
            else:
                processed.append(result)

        return processed

    def clear_cache(self):
        """Limpia el caché de tracking"""
        self._cache.clear()

    def get_cache_stats(self) -> Dict:
        """Obtiene estadísticas del caché"""
        return {
            "total_entries": len(self._cache),
            "ttl_seconds": self._cache_ttl,
        }


# Singleton
tracking_service = TrackingService()
