/**
 * StatusNormalizer Service
 *
 * Single source of truth for normalizing carrier-specific statuses
 * to canonical statuses. Replaces the 6 fragmented mapping systems.
 *
 * Returns: { status, reason, rawStatus, timestamp }
 */

import {
  CanonicalStatus,
  ExceptionReason,
  NormalizedStatus,
  CarrierCode,
  StatusMapping,
  DataSource,
} from '../types/canonical.types';

/**
 * Real carrier status mappings based on actual API responses
 * from Colombian carriers: Coordinadora, Interrapidísimo, Envía, TCC, Servientrega
 */
const CARRIER_MAPPINGS: Record<CarrierCode, StatusMapping[]> = {
  /**
   * COORDINADORA - Real status codes from their API
   * Reference: Coordinadora Mercantil tracking API
   */
  COORDINADORA: [
    // Created / Processing
    { pattern: /^ADMITIDO$/i, status: CanonicalStatus.CREATED, reason: ExceptionReason.NONE },
    { pattern: /^RECOGIDO$/i, status: CanonicalStatus.PROCESSING, reason: ExceptionReason.NONE },
    { pattern: /^EN\s*ALISTAMIENTO$/i, status: CanonicalStatus.PROCESSING, reason: ExceptionReason.NONE },
    { pattern: /^RECOLECTADO$/i, status: CanonicalStatus.PROCESSING, reason: ExceptionReason.NONE },

    // Shipped / In Transit
    { pattern: /^DESPACHADO$/i, status: CanonicalStatus.SHIPPED, reason: ExceptionReason.NONE },
    { pattern: /^EN\s*TRANSITO$/i, status: CanonicalStatus.IN_TRANSIT, reason: ExceptionReason.NONE },
    { pattern: /^EN\s*TR[AÁ]NSITO$/i, status: CanonicalStatus.IN_TRANSIT, reason: ExceptionReason.NONE },
    { pattern: /^LLEGADA\s*A\s*CENTRO$/i, status: CanonicalStatus.IN_TRANSIT, reason: ExceptionReason.NONE },
    { pattern: /^SALIDA\s*DE\s*CENTRO$/i, status: CanonicalStatus.IN_TRANSIT, reason: ExceptionReason.NONE },
    { pattern: /^EN\s*BODEGA$/i, status: CanonicalStatus.IN_TRANSIT, reason: ExceptionReason.NONE },
    { pattern: /^TRANSBORDO$/i, status: CanonicalStatus.IN_TRANSIT, reason: ExceptionReason.NONE },

    // Out for Delivery
    { pattern: /^EN\s*REPARTO$/i, status: CanonicalStatus.OUT_FOR_DELIVERY, reason: ExceptionReason.NONE },
    { pattern: /^EN\s*RUTA$/i, status: CanonicalStatus.OUT_FOR_DELIVERY, reason: ExceptionReason.NONE },
    { pattern: /^ASIGNADO\s*A\s*MENSAJERO$/i, status: CanonicalStatus.OUT_FOR_DELIVERY, reason: ExceptionReason.NONE },
    { pattern: /^EN\s*DISTRIBUCI[OÓ]N$/i, status: CanonicalStatus.OUT_FOR_DELIVERY, reason: ExceptionReason.NONE },

    // In Office
    { pattern: /^EN\s*OFICINA$/i, status: CanonicalStatus.IN_OFFICE, reason: ExceptionReason.NONE },
    { pattern: /^DISPONIBLE\s*EN\s*PUNTO$/i, status: CanonicalStatus.IN_OFFICE, reason: ExceptionReason.NONE },
    { pattern: /^LISTO\s*PARA\s*RECOGER$/i, status: CanonicalStatus.IN_OFFICE, reason: ExceptionReason.NONE },

    // Delivered
    { pattern: /^ENTREGADO$/i, status: CanonicalStatus.DELIVERED, reason: ExceptionReason.NONE },
    { pattern: /^ENTREGA\s*EXITOSA$/i, status: CanonicalStatus.DELIVERED, reason: ExceptionReason.NONE },
    { pattern: /^CUMPLIDO$/i, status: CanonicalStatus.DELIVERED, reason: ExceptionReason.NONE },

    // Issues - Address
    { pattern: /^DIRECCI[OÓ]N\s*INCORRECTA$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.BAD_ADDRESS },
    { pattern: /^DIRECCI[OÓ]N\s*NO\s*EXISTE$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.BAD_ADDRESS },
    { pattern: /^NO\s*UBICADO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.BAD_ADDRESS },
    { pattern: /^DIRECCI[OÓ]N\s*ERRADA$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.BAD_ADDRESS },
    { pattern: /^PREDIO\s*NO\s*EXISTE$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.BAD_ADDRESS },

    // Issues - Recipient
    { pattern: /^DESTINATARIO\s*AUSENTE$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.RECIPIENT_UNAVAILABLE },
    { pattern: /^NO\s*HAY\s*QUIEN\s*RECIBA$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.RECIPIENT_UNAVAILABLE },
    { pattern: /^CERRADO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.RECIPIENT_UNAVAILABLE },
    { pattern: /^CLIENTE\s*NO\s*ENCONTRADO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.RECIPIENT_UNAVAILABLE },
    { pattern: /^PERSONA\s*AUSENTE$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.RECIPIENT_UNAVAILABLE },

    // Issues - Rejected
    { pattern: /^RECHAZADO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.REJECTED },
    { pattern: /^REHUSADO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.REJECTED },
    { pattern: /^NO\s*ACEPTADO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.REJECTED },
    { pattern: /^DEVOLUCI[OÓ]N\s*SOLICITADA$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.REJECTED },

    // Issues - Phone
    { pattern: /^TEL[EÉ]FONO\s*INCORRECTO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.BAD_PHONE },
    { pattern: /^NO\s*CONTESTA$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.BAD_PHONE },
    { pattern: /^TELEFONO\s*ERRADO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.BAD_PHONE },
    { pattern: /^APAGADO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.BAD_PHONE },
    { pattern: /^FUERA\s*DE\s*SERVICIO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.BAD_PHONE },

    // Issues - COD/Payment
    { pattern: /^SIN\s*DINERO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.COD_ISSUE },
    { pattern: /^FALTA\s*PAGO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.COD_ISSUE },
    { pattern: /^PAGO\s*INCOMPLETO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.COD_ISSUE },

    // Issues - Damaged/Lost
    { pattern: /^DA[NÑ]ADO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.DAMAGED },
    { pattern: /^AVER[IÍ]A$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.DAMAGED },
    { pattern: /^SINIESTRO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.LOST },
    { pattern: /^PERDIDO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.LOST },
    { pattern: /^EXTRAVIADO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.LOST },

    // Issues - Rescheduled
    { pattern: /^REPROGRAMADO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.RESCHEDULED },
    { pattern: /^APLAZADO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.RESCHEDULED },
    { pattern: /^PENDIENTE\s*NUEVO\s*INTENTO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.DELIVERY_ATTEMPT_FAILED },

    // Issues - Security/Weather
    { pattern: /^ZONA\s*DE\s*RIESGO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.SECURITY },
    { pattern: /^ORDEN\s*P[UÚ]BLICO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.SECURITY },
    { pattern: /^DIFICIL\s*ACCESO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.REMOTE_AREA },
    { pattern: /^ZONA\s*RURAL$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.REMOTE_AREA },
    { pattern: /^CLIMA$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.WEATHER },

    // Issues - Generic
    { pattern: /^NOVEDAD$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.OTHER },
    { pattern: /^CON\s*NOVEDAD$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.OTHER },
    { pattern: /^PROBLEMA$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.OTHER },

    // Returned
    { pattern: /^DEVUELTO$/i, status: CanonicalStatus.RETURNED, reason: ExceptionReason.NONE },
    { pattern: /^DEVOLUCI[OÓ]N$/i, status: CanonicalStatus.RETURNED, reason: ExceptionReason.NONE },
    { pattern: /^EN\s*DEVOLUCI[OÓ]N$/i, status: CanonicalStatus.RETURNED, reason: ExceptionReason.NONE },
    { pattern: /^RETORNADO$/i, status: CanonicalStatus.RETURNED, reason: ExceptionReason.NONE },

    // Cancelled
    { pattern: /^CANCELADO$/i, status: CanonicalStatus.CANCELLED, reason: ExceptionReason.NONE },
    { pattern: /^ANULADO$/i, status: CanonicalStatus.CANCELLED, reason: ExceptionReason.NONE },
  ],

  /**
   * INTERRAPIDISIMO (INTER) - Real status codes
   * Reference: Inter tracking API
   */
  INTERRAPIDISIMO: [
    // Created / Processing
    { pattern: /^RECIBIDO$/i, status: CanonicalStatus.CREATED, reason: ExceptionReason.NONE },
    { pattern: /^INGRESADO$/i, status: CanonicalStatus.CREATED, reason: ExceptionReason.NONE },
    { pattern: /^ADMISION$/i, status: CanonicalStatus.PROCESSING, reason: ExceptionReason.NONE },
    { pattern: /^EN\s*PROCESO$/i, status: CanonicalStatus.PROCESSING, reason: ExceptionReason.NONE },

    // Shipped / In Transit
    { pattern: /^DESPACHO$/i, status: CanonicalStatus.SHIPPED, reason: ExceptionReason.NONE },
    { pattern: /^DESPACHADO$/i, status: CanonicalStatus.SHIPPED, reason: ExceptionReason.NONE },
    { pattern: /^MOVILIZACION$/i, status: CanonicalStatus.IN_TRANSIT, reason: ExceptionReason.NONE },
    { pattern: /^EN\s*CAMINO$/i, status: CanonicalStatus.IN_TRANSIT, reason: ExceptionReason.NONE },
    { pattern: /^LLEGADA$/i, status: CanonicalStatus.IN_TRANSIT, reason: ExceptionReason.NONE },
    { pattern: /^ARRIBO$/i, status: CanonicalStatus.IN_TRANSIT, reason: ExceptionReason.NONE },
    { pattern: /^EN\s*CENTRO$/i, status: CanonicalStatus.IN_TRANSIT, reason: ExceptionReason.NONE },

    // Out for Delivery
    { pattern: /^DISTRIBUCION$/i, status: CanonicalStatus.OUT_FOR_DELIVERY, reason: ExceptionReason.NONE },
    { pattern: /^EN\s*DISTRIBUCION$/i, status: CanonicalStatus.OUT_FOR_DELIVERY, reason: ExceptionReason.NONE },
    { pattern: /^ASIGNADO$/i, status: CanonicalStatus.OUT_FOR_DELIVERY, reason: ExceptionReason.NONE },
    { pattern: /^EN\s*VEHICULO$/i, status: CanonicalStatus.OUT_FOR_DELIVERY, reason: ExceptionReason.NONE },

    // In Office
    { pattern: /^EN\s*PUNTO$/i, status: CanonicalStatus.IN_OFFICE, reason: ExceptionReason.NONE },
    { pattern: /^DISPONIBLE$/i, status: CanonicalStatus.IN_OFFICE, reason: ExceptionReason.NONE },

    // Delivered
    { pattern: /^ENTREGADO$/i, status: CanonicalStatus.DELIVERED, reason: ExceptionReason.NONE },
    { pattern: /^ENTREGA$/i, status: CanonicalStatus.DELIVERED, reason: ExceptionReason.NONE },
    { pattern: /^CUMPLIDO$/i, status: CanonicalStatus.DELIVERED, reason: ExceptionReason.NONE },

    // Issues - Address
    { pattern: /^DIRECCION\s*ERRADA$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.BAD_ADDRESS },
    { pattern: /^BARRIO\s*NO\s*EXISTE$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.BAD_ADDRESS },
    { pattern: /^MUNICIPIO\s*ERRADO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.BAD_ADDRESS },

    // Issues - Recipient
    { pattern: /^AUSENTE$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.RECIPIENT_UNAVAILABLE },
    { pattern: /^NO\s*RECIBEN$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.RECIPIENT_UNAVAILABLE },
    { pattern: /^LOCAL\s*CERRADO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.RECIPIENT_UNAVAILABLE },

    // Issues - Rejected
    { pattern: /^REHUSADO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.REJECTED },
    { pattern: /^RECHAZA$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.REJECTED },

    // Issues - Phone
    { pattern: /^TELEFONO\s*ERRADO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.BAD_PHONE },
    { pattern: /^SIN\s*TELEFONO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.BAD_PHONE },

    // Issues - COD
    { pattern: /^NO\s*TIENE\s*DINERO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.COD_ISSUE },
    { pattern: /^FALTA\s*RECAUDO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.COD_ISSUE },

    // Issues - Other
    { pattern: /^NOVEDAD$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.OTHER },
    { pattern: /^PENDIENTE$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.OTHER },
    { pattern: /^INTENTO\s*FALLIDO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.DELIVERY_ATTEMPT_FAILED },

    // Returned
    { pattern: /^DEVOLUCION$/i, status: CanonicalStatus.RETURNED, reason: ExceptionReason.NONE },
    { pattern: /^RETORNO$/i, status: CanonicalStatus.RETURNED, reason: ExceptionReason.NONE },

    // Cancelled
    { pattern: /^CANCELADO$/i, status: CanonicalStatus.CANCELLED, reason: ExceptionReason.NONE },
    { pattern: /^ANULADO$/i, status: CanonicalStatus.CANCELLED, reason: ExceptionReason.NONE },
  ],

  /**
   * ENVÍA - Real status codes
   * Reference: Envía Colombia tracking API
   */
  ENVIA: [
    // Created / Processing
    { pattern: /^GENERADO$/i, status: CanonicalStatus.CREATED, reason: ExceptionReason.NONE },
    { pattern: /^RECOGIDO$/i, status: CanonicalStatus.PROCESSING, reason: ExceptionReason.NONE },
    { pattern: /^RECOLECCION$/i, status: CanonicalStatus.PROCESSING, reason: ExceptionReason.NONE },
    { pattern: /^ALISTAMIENTO$/i, status: CanonicalStatus.PROCESSING, reason: ExceptionReason.NONE },

    // Shipped / In Transit
    { pattern: /^CARGUE$/i, status: CanonicalStatus.SHIPPED, reason: ExceptionReason.NONE },
    { pattern: /^EN\s*LINEA$/i, status: CanonicalStatus.IN_TRANSIT, reason: ExceptionReason.NONE },
    { pattern: /^DESCARGUE$/i, status: CanonicalStatus.IN_TRANSIT, reason: ExceptionReason.NONE },
    { pattern: /^TRANSITO$/i, status: CanonicalStatus.IN_TRANSIT, reason: ExceptionReason.NONE },
    { pattern: /^EN\s*AGENCIA$/i, status: CanonicalStatus.IN_TRANSIT, reason: ExceptionReason.NONE },

    // Out for Delivery
    { pattern: /^ULTIMO\s*KM$/i, status: CanonicalStatus.OUT_FOR_DELIVERY, reason: ExceptionReason.NONE },
    { pattern: /^EN\s*ENTREGA$/i, status: CanonicalStatus.OUT_FOR_DELIVERY, reason: ExceptionReason.NONE },
    { pattern: /^RUTA$/i, status: CanonicalStatus.OUT_FOR_DELIVERY, reason: ExceptionReason.NONE },

    // In Office
    { pattern: /^EN\s*CENTRO\s*ENVIA$/i, status: CanonicalStatus.IN_OFFICE, reason: ExceptionReason.NONE },
    { pattern: /^DISPONIBLE\s*RECOGIDA$/i, status: CanonicalStatus.IN_OFFICE, reason: ExceptionReason.NONE },

    // Delivered
    { pattern: /^ENTREGADO$/i, status: CanonicalStatus.DELIVERED, reason: ExceptionReason.NONE },
    { pattern: /^ENTREGA\s*EXITOSA$/i, status: CanonicalStatus.DELIVERED, reason: ExceptionReason.NONE },

    // Issues
    { pattern: /^DIRECCION\s*ERRADA$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.BAD_ADDRESS },
    { pattern: /^DESTINATARIO\s*AUSENTE$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.RECIPIENT_UNAVAILABLE },
    { pattern: /^RECHAZADO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.REJECTED },
    { pattern: /^TELEFONO\s*ERRADO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.BAD_PHONE },
    { pattern: /^SIN\s*DINERO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.COD_ISSUE },
    { pattern: /^NOVEDAD$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.OTHER },
    { pattern: /^REPROGRAMAR$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.RESCHEDULED },
    { pattern: /^INTENTO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.DELIVERY_ATTEMPT_FAILED },

    // Returned
    { pattern: /^DEVOLUCION$/i, status: CanonicalStatus.RETURNED, reason: ExceptionReason.NONE },
    { pattern: /^RETORNO$/i, status: CanonicalStatus.RETURNED, reason: ExceptionReason.NONE },

    // Cancelled
    { pattern: /^CANCELADO$/i, status: CanonicalStatus.CANCELLED, reason: ExceptionReason.NONE },
  ],

  /**
   * TCC - Real status codes
   * Reference: TCC Colombia tracking API
   */
  TCC: [
    // Created / Processing
    { pattern: /^DOCUMENTO\s*RADICADO$/i, status: CanonicalStatus.CREATED, reason: ExceptionReason.NONE },
    { pattern: /^RECEPCION$/i, status: CanonicalStatus.PROCESSING, reason: ExceptionReason.NONE },
    { pattern: /^RECIBIDO\s*EN\s*ORIGEN$/i, status: CanonicalStatus.PROCESSING, reason: ExceptionReason.NONE },

    // Shipped / In Transit
    { pattern: /^CARGADO$/i, status: CanonicalStatus.SHIPPED, reason: ExceptionReason.NONE },
    { pattern: /^EN\s*TRANSPORTE$/i, status: CanonicalStatus.IN_TRANSIT, reason: ExceptionReason.NONE },
    { pattern: /^LLEGADA\s*A\s*DESTINO$/i, status: CanonicalStatus.IN_TRANSIT, reason: ExceptionReason.NONE },
    { pattern: /^EN\s*TERMINAL$/i, status: CanonicalStatus.IN_TRANSIT, reason: ExceptionReason.NONE },
    { pattern: /^DESCARGADO$/i, status: CanonicalStatus.IN_TRANSIT, reason: ExceptionReason.NONE },

    // Out for Delivery
    { pattern: /^EN\s*REPARTO$/i, status: CanonicalStatus.OUT_FOR_DELIVERY, reason: ExceptionReason.NONE },
    { pattern: /^SALIDA\s*REPARTO$/i, status: CanonicalStatus.OUT_FOR_DELIVERY, reason: ExceptionReason.NONE },

    // In Office
    { pattern: /^EN\s*AGENCIA$/i, status: CanonicalStatus.IN_OFFICE, reason: ExceptionReason.NONE },
    { pattern: /^DISPONIBLE\s*RETIRO$/i, status: CanonicalStatus.IN_OFFICE, reason: ExceptionReason.NONE },

    // Delivered
    { pattern: /^ENTREGADO$/i, status: CanonicalStatus.DELIVERED, reason: ExceptionReason.NONE },
    { pattern: /^ENTREGA\s*EFECTIVA$/i, status: CanonicalStatus.DELIVERED, reason: ExceptionReason.NONE },

    // Issues
    { pattern: /^DIRECCION\s*INCORRECTA$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.BAD_ADDRESS },
    { pattern: /^DESTINATARIO\s*NO\s*ENCONTRADO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.RECIPIENT_UNAVAILABLE },
    { pattern: /^RECHAZADO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.REJECTED },
    { pattern: /^TELEFONO\s*INCORRECTO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.BAD_PHONE },
    { pattern: /^NO\s*TIENE\s*DINERO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.COD_ISSUE },
    { pattern: /^NOVEDAD$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.OTHER },
    { pattern: /^REPROGRAMADO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.RESCHEDULED },
    { pattern: /^ZONA\s*DIFICIL$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.REMOTE_AREA },

    // Returned
    { pattern: /^DEVOLUCION$/i, status: CanonicalStatus.RETURNED, reason: ExceptionReason.NONE },
    { pattern: /^EN\s*DEVOLUCION$/i, status: CanonicalStatus.RETURNED, reason: ExceptionReason.NONE },

    // Cancelled
    { pattern: /^CANCELADO$/i, status: CanonicalStatus.CANCELLED, reason: ExceptionReason.NONE },
    { pattern: /^ANULADO$/i, status: CanonicalStatus.CANCELLED, reason: ExceptionReason.NONE },
  ],

  /**
   * SERVIENTREGA - Real status codes
   * Reference: Servientrega tracking API
   */
  SERVIENTREGA: [
    // Created / Processing
    { pattern: /^IMPRESO$/i, status: CanonicalStatus.CREATED, reason: ExceptionReason.NONE },
    { pattern: /^ADMITIDO$/i, status: CanonicalStatus.PROCESSING, reason: ExceptionReason.NONE },
    { pattern: /^RECOLECTADO$/i, status: CanonicalStatus.PROCESSING, reason: ExceptionReason.NONE },

    // Shipped / In Transit
    { pattern: /^DESPACHADO$/i, status: CanonicalStatus.SHIPPED, reason: ExceptionReason.NONE },
    { pattern: /^EN\s*RUTA$/i, status: CanonicalStatus.IN_TRANSIT, reason: ExceptionReason.NONE },
    { pattern: /^EN\s*PLATAFORMA$/i, status: CanonicalStatus.IN_TRANSIT, reason: ExceptionReason.NONE },
    { pattern: /^EN\s*CENTRO\s*DE\s*DISTRIBUCION$/i, status: CanonicalStatus.IN_TRANSIT, reason: ExceptionReason.NONE },

    // Out for Delivery
    { pattern: /^EN\s*DISTRIBUCION$/i, status: CanonicalStatus.OUT_FOR_DELIVERY, reason: ExceptionReason.NONE },
    { pattern: /^ASIGNADO\s*MENSAJERO$/i, status: CanonicalStatus.OUT_FOR_DELIVERY, reason: ExceptionReason.NONE },

    // In Office
    { pattern: /^DISPONIBLE\s*EN\s*PUNTO$/i, status: CanonicalStatus.IN_OFFICE, reason: ExceptionReason.NONE },
    { pattern: /^EN\s*CENTRO\s*SERVIENTREGA$/i, status: CanonicalStatus.IN_OFFICE, reason: ExceptionReason.NONE },

    // Delivered
    { pattern: /^ENTREGADO$/i, status: CanonicalStatus.DELIVERED, reason: ExceptionReason.NONE },
    { pattern: /^ENTREGA\s*EFECTIVA$/i, status: CanonicalStatus.DELIVERED, reason: ExceptionReason.NONE },

    // Issues
    { pattern: /^DIRECCION\s*ERRADA$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.BAD_ADDRESS },
    { pattern: /^CLIENTE\s*AUSENTE$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.RECIPIENT_UNAVAILABLE },
    { pattern: /^RECHAZADO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.REJECTED },
    { pattern: /^TELEFONO\s*ERRADO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.BAD_PHONE },
    { pattern: /^SIN\s*DINERO$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.COD_ISSUE },
    { pattern: /^NOVEDAD$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.OTHER },
    { pattern: /^REPROGRAMAR$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.RESCHEDULED },

    // Returned
    { pattern: /^DEVOLUCION$/i, status: CanonicalStatus.RETURNED, reason: ExceptionReason.NONE },
    { pattern: /^RETORNO$/i, status: CanonicalStatus.RETURNED, reason: ExceptionReason.NONE },

    // Cancelled
    { pattern: /^CANCELADO$/i, status: CanonicalStatus.CANCELLED, reason: ExceptionReason.NONE },
  ],

  /**
   * UNKNOWN carrier - fallback mappings
   */
  UNKNOWN: [
    { pattern: /^CREADO?$/i, status: CanonicalStatus.CREATED, reason: ExceptionReason.NONE },
    { pattern: /^PROCESANDO$/i, status: CanonicalStatus.PROCESSING, reason: ExceptionReason.NONE },
    { pattern: /^DESPACHADO$/i, status: CanonicalStatus.SHIPPED, reason: ExceptionReason.NONE },
    { pattern: /^TRANSITO$/i, status: CanonicalStatus.IN_TRANSIT, reason: ExceptionReason.NONE },
    { pattern: /^REPARTO$/i, status: CanonicalStatus.OUT_FOR_DELIVERY, reason: ExceptionReason.NONE },
    { pattern: /^OFICINA$/i, status: CanonicalStatus.IN_OFFICE, reason: ExceptionReason.NONE },
    { pattern: /^ENTREGADO$/i, status: CanonicalStatus.DELIVERED, reason: ExceptionReason.NONE },
    { pattern: /^NOVEDAD$/i, status: CanonicalStatus.ISSUE, reason: ExceptionReason.OTHER },
    { pattern: /^DEVUELTO$/i, status: CanonicalStatus.RETURNED, reason: ExceptionReason.NONE },
    { pattern: /^CANCELADO$/i, status: CanonicalStatus.CANCELLED, reason: ExceptionReason.NONE },
  ],
};

/**
 * Detect carrier from tracking number or carrier name
 */
export function detectCarrier(input: string): CarrierCode {
  const normalized = input.toUpperCase().trim();

  // Check carrier names
  if (/COORDINADORA/.test(normalized)) return 'COORDINADORA';
  if (/INTER|INTERRAPIDISIMO/.test(normalized)) return 'INTERRAPIDISIMO';
  if (/ENVIA/.test(normalized)) return 'ENVIA';
  if (/TCC/.test(normalized)) return 'TCC';
  if (/SERVIENTREGA/.test(normalized)) return 'SERVIENTREGA';

  // Check tracking number patterns
  // Coordinadora: typically starts with numbers, 9-12 digits
  if (/^\d{9,12}$/.test(normalized)) return 'COORDINADORA';

  // Inter: often has specific prefixes
  if (/^[A-Z]{2,3}\d{8,10}$/.test(normalized)) return 'INTERRAPIDISIMO';

  // TCC: typically alphanumeric with specific format
  if (/^[A-Z0-9]{10,15}$/.test(normalized)) return 'TCC';

  return 'UNKNOWN';
}

/**
 * Main normalizer class
 */
export class StatusNormalizer {
  /**
   * Normalize a carrier status to canonical status
   *
   * PR#1 Spec: normalizeShipment(input) returns:
   * - canonicalStatus (status)
   * - exceptionReason? (reason)
   * - rawStatus (texto original)
   * - source (dropi / carrier / excel / manual)
   * - lastEventAt (timestamp evento)
   *
   * @param rawStatus - The raw status string from the carrier
   * @param carrier - The carrier code (or tracking number/carrier name for auto-detection)
   * @param options - Optional: source and lastEventAt
   * @returns NormalizedStatus with status, reason, rawStatus, source, lastEventAt
   */
  static normalize(
    rawStatus: string,
    carrier: CarrierCode | string,
    options?: {
      source?: DataSource;
      lastEventAt?: Date | string;
    }
  ): NormalizedStatus {
    const source = options?.source || 'carrier';
    const lastEventAt = this.parseTimestamp(options?.lastEventAt);

    // Detect carrier if not a valid CarrierCode
    const carrierCode = this.isCarrierCode(carrier) ? carrier : detectCarrier(carrier);

    // Get mappings for this carrier
    const mappings = CARRIER_MAPPINGS[carrierCode];

    // Normalize the raw status for matching
    const normalizedRaw = this.normalizeRawStatus(rawStatus);

    // Find matching status
    for (const mapping of mappings) {
      const pattern = mapping.pattern;
      const matches =
        pattern instanceof RegExp
          ? pattern.test(normalizedRaw)
          : normalizedRaw.includes(pattern.toUpperCase());

      if (matches) {
        return {
          status: mapping.status,
          reason: mapping.reason || ExceptionReason.NONE,
          rawStatus,
          source,
          lastEventAt,
        };
      }
    }

    // Try UNKNOWN carrier mappings as fallback
    if (carrierCode !== 'UNKNOWN') {
      for (const mapping of CARRIER_MAPPINGS.UNKNOWN) {
        const pattern = mapping.pattern;
        const matches =
          pattern instanceof RegExp
            ? pattern.test(normalizedRaw)
            : normalizedRaw.includes(pattern.toUpperCase());

        if (matches) {
          return {
            status: mapping.status,
            reason: mapping.reason || ExceptionReason.NONE,
            rawStatus,
            source,
            lastEventAt,
          };
        }
      }
    }

    // Default to ISSUE with OTHER reason if no match found
    return {
      status: CanonicalStatus.ISSUE,
      reason: ExceptionReason.OTHER,
      rawStatus,
      source,
      lastEventAt,
    };
  }

  /**
   * Batch normalize multiple statuses
   */
  static normalizeBatch(
    items: Array<{
      rawStatus: string;
      carrier: CarrierCode | string;
      source?: DataSource;
      lastEventAt?: Date | string;
    }>
  ): NormalizedStatus[] {
    return items.map((item) =>
      this.normalize(item.rawStatus, item.carrier, {
        source: item.source,
        lastEventAt: item.lastEventAt,
      })
    );
  }

  /**
   * Check if a status indicates delivery success
   */
  static isDelivered(status: CanonicalStatus): boolean {
    return status === CanonicalStatus.DELIVERED;
  }

  /**
   * Check if a status indicates an issue
   */
  static hasIssue(status: CanonicalStatus): boolean {
    return status === CanonicalStatus.ISSUE;
  }

  /**
   * Check if a status indicates the shipment is in progress
   */
  static isInProgress(status: CanonicalStatus): boolean {
    return [
      CanonicalStatus.CREATED,
      CanonicalStatus.PROCESSING,
      CanonicalStatus.SHIPPED,
      CanonicalStatus.IN_TRANSIT,
      CanonicalStatus.OUT_FOR_DELIVERY,
      CanonicalStatus.IN_OFFICE,
    ].includes(status);
  }

  /**
   * Check if a status is terminal (no more updates expected)
   */
  static isTerminal(status: CanonicalStatus): boolean {
    return [
      CanonicalStatus.DELIVERED,
      CanonicalStatus.RETURNED,
      CanonicalStatus.CANCELLED,
    ].includes(status);
  }

  /**
   * Get all mappings for a carrier (useful for debugging)
   */
  static getMappings(carrier: CarrierCode): StatusMapping[] {
    return CARRIER_MAPPINGS[carrier] || [];
  }

  /**
   * Get all supported carriers
   */
  static getSupportedCarriers(): CarrierCode[] {
    return Object.keys(CARRIER_MAPPINGS) as CarrierCode[];
  }

  // Private helpers

  private static isCarrierCode(value: string): value is CarrierCode {
    return ['COORDINADORA', 'INTERRAPIDISIMO', 'ENVIA', 'TCC', 'SERVIENTREGA', 'UNKNOWN'].includes(
      value.toUpperCase()
    );
  }

  private static normalizeRawStatus(status: string): string {
    return status
      .toUpperCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents for matching
      .replace(/\s+/g, ' '); // Normalize spaces
  }

  private static parseTimestamp(timestamp?: Date | string): Date {
    if (!timestamp) return new Date();
    if (timestamp instanceof Date) return timestamp;
    return new Date(timestamp);
  }
}

// Default export for convenience
export default StatusNormalizer;
