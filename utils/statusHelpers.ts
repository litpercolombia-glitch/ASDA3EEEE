import { Shipment, ShipmentStatus, ShipmentEvent } from '../types';

// Normalized status types
export type NormalizedStatus =
  | 'ENTREGADO'
  | 'EN_REPARTO'
  | 'EN_TRANSITO'
  | 'EN_OFICINA'
  | 'NOVEDAD'
  | 'PENDIENTE'
  | 'DESCONOCIDO';

/**
 * Parses a date string in multiple formats to a Date object
 * Supports: ISO, DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, "YYYY-MM-DD HH:mm"
 * CRITICAL: This function is used to determine event ordering
 */
export const parseDate = (dateStr: string | Date | undefined): Date => {
  if (!dateStr) return new Date(0);

  // If already a Date object
  if (dateStr instanceof Date) {
    return isNaN(dateStr.getTime()) ? new Date(0) : dateStr;
  }

  const str = String(dateStr).trim();

  // Try ISO format first (most common from APIs)
  const isoDate = new Date(str);
  if (!isNaN(isoDate.getTime())) return isoDate;

  // Try DD/MM/YYYY or DD-MM-YYYY format (common in Colombia)
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(.*)$/);
  if (dmyMatch) {
    const [, day, month, year, timePart] = dmyMatch;
    let hours = 0,
      minutes = 0;

    // Check if there's a time component
    const timeMatch = timePart.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      hours = parseInt(timeMatch[1], 10);
      minutes = parseInt(timeMatch[2], 10);
    }

    return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), hours, minutes);
  }

  // Try YYYY-MM-DD format
  const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})(.*)$/);
  if (ymdMatch) {
    const [, year, month, day, timePart] = ymdMatch;
    let hours = 0,
      minutes = 0;

    const timeMatch = timePart.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      hours = parseInt(timeMatch[1], 10);
      minutes = parseInt(timeMatch[2], 10);
    }

    return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), hours, minutes);
  }

  // Fallback to epoch (beginning of time)
  return new Date(0);
};

// Status configuration for UI
export const STATUS_CONFIG: Record<
  NormalizedStatus,
  {
    label: string;
    icon: string;
    color: string;
    bgColor: string;
    borderColor: string;
    semaforoColor: string;
    priority: number;
  }
> = {
  ENTREGADO: {
    label: 'Entregado',
    icon: '✅',
    color: 'green',
    bgColor: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    borderColor: 'border-green-500',
    semaforoColor: '🟢',
    priority: 5,
  },
  EN_REPARTO: {
    label: 'En Reparto',
    icon: '🚚',
    color: 'blue',
    bgColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    borderColor: 'border-blue-500',
    semaforoColor: '🟡',
    priority: 3,
  },
  EN_TRANSITO: {
    label: 'En Tránsito',
    icon: '📦',
    color: 'indigo',
    bgColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    borderColor: 'border-indigo-500',
    semaforoColor: '🟡',
    priority: 3,
  },
  EN_OFICINA: {
    label: 'En Oficina',
    icon: '📍',
    color: 'orange',
    bgColor: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    borderColor: 'border-orange-500',
    semaforoColor: '🟠',
    priority: 2,
  },
  NOVEDAD: {
    label: 'Novedad',
    icon: '⚠️',
    color: 'red',
    bgColor: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    borderColor: 'border-red-500',
    semaforoColor: '🔴',
    priority: 1,
  },
  PENDIENTE: {
    label: 'Pendiente',
    icon: '⏳',
    color: 'gray',
    bgColor: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    borderColor: 'border-gray-500',
    semaforoColor: '⚪',
    priority: 4,
  },
  DESCONOCIDO: {
    label: 'Desconocido',
    icon: '❓',
    color: 'slate',
    bgColor: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400',
    borderColor: 'border-slate-500',
    semaforoColor: '⚪',
    priority: 6,
  },
};

// Status mapping for normalization
const STATUS_MAP: Record<string, NormalizedStatus> = {
  // Entregado
  ENTREGADO: 'ENTREGADO',
  DELIVERED: 'ENTREGADO',
  'ENTREGA EXITOSA': 'ENTREGADO',
  RECOGIDO: 'ENTREGADO',
  ENTREGADA: 'ENTREGADO',

  // En reparto
  'EN REPARTO': 'EN_REPARTO',
  REPARTO: 'EN_REPARTO',
  'OUT FOR DELIVERY': 'EN_REPARTO',
  'MENSAJERO ASIGNADO': 'EN_REPARTO',
  'ASIGNADO A MENSAJERO': 'EN_REPARTO',
  'EN DISTRIBUCION': 'EN_REPARTO',
  'PROGRAMADO PARA ENTREGA': 'EN_REPARTO',

  // En oficina
  'EN OFICINA': 'EN_OFICINA',
  'DISPONIBLE EN OFICINA': 'EN_OFICINA',
  'RECLAMAR EN OFICINA': 'EN_OFICINA',
  BODEGA: 'EN_OFICINA',
  RETENCION: 'EN_OFICINA',
  RETENCIÓN: 'EN_OFICINA',
  ALMACENADO: 'EN_OFICINA',
  'DISPONIBLE PARA RETIRO': 'EN_OFICINA',

  // En tránsito
  'EN TRANSITO': 'EN_TRANSITO',
  'EN CAMINO': 'EN_TRANSITO',
  'IN TRANSIT': 'EN_TRANSITO',
  DESPACHADO: 'EN_TRANSITO',
  VIAJANDO: 'EN_TRANSITO',
  'EN RUTA': 'EN_TRANSITO',
  'CENTRO LOGISTICO': 'EN_TRANSITO',
  'EN CENTRO LOGÍSTICO': 'EN_TRANSITO',
  'RECIBIDO EN CENTRO': 'EN_TRANSITO',

  // Novedades
  NOVEDAD: 'NOVEDAD',
  DEVOLUCION: 'NOVEDAD',
  DEVOLUCIÓN: 'NOVEDAD',
  RECHAZADO: 'NOVEDAD',
  'NO ENTREGADO': 'NOVEDAD',
  'DIRECCION ERRADA': 'NOVEDAD',
  'DIRECCIÓN ERRÓNEA': 'NOVEDAD',
  'NO SE ENCONTRO': 'NOVEDAD',
  CERRADO: 'NOVEDAD',
  FALLIDO: 'NOVEDAD',
  RETORNO: 'NOVEDAD',
  'NO CONTESTA': 'NOVEDAD',
  'NO RECIBE': 'NOVEDAD',

  // Pendiente
  PENDIENTE: 'PENDIENTE',
  CREADO: 'PENDIENTE',
  RECIBIDO: 'PENDIENTE',
  REGISTRADO: 'PENDIENTE',
};

/**
 * Normalizes a raw status string to a NormalizedStatus
 */
export const normalizeStatus = (rawStatus: string): NormalizedStatus => {
  const status = rawStatus.toUpperCase().trim();

  // Try exact match first
  if (STATUS_MAP[status]) {
    return STATUS_MAP[status];
  }

  // Try partial match
  for (const [key, value] of Object.entries(STATUS_MAP)) {
    if (status.includes(key)) {
      return value;
    }
  }

  // Additional heuristics
  if (status.includes('ENTREG')) return 'ENTREGADO';
  if (status.includes('OFICINA')) return 'EN_OFICINA';
  if (
    status.includes('NOVEDAD') ||
    status.includes('FALL') ||
    status.includes('RECHAZ') ||
    status.includes('DEVOL')
  )
    return 'NOVEDAD';
  if (
    status.includes('TRANSIT') ||
    status.includes('CAMINO') ||
    status.includes('VIAJA') ||
    status.includes('RUTA')
  )
    return 'EN_TRANSITO';
  if (status.includes('REPARTO') || status.includes('MENSAJERO') || status.includes('DISTRIBU'))
    return 'EN_REPARTO';

  return 'DESCONOCIDO';
};

/**
 * Gets the actual status of a shipment based on the most recent event
 * CRITICAL RULE: The status is ALWAYS the LAST event with the MOST RECENT date
 *
 * This function sorts events by date (descending) and returns the normalized
 * status from the most recent event's description.
 */
export const getActualStatus = (guia: Shipment): NormalizedStatus => {
  // 1. Get all events from the shipment
  const eventos = guia.detailedInfo?.events || [];

  if (eventos.length === 0) {
    // Fall back to the shipment's stored status
    return normalizeStatus(guia.status);
  }

  // 2. Sort by date DESCENDING (most recent FIRST)
  // Using parseDate to handle multiple date formats correctly
  const eventosOrdenados = [...eventos].sort((a, b) => {
    const fechaA = parseDate(a.date);
    const fechaB = parseDate(b.date);
    return fechaB.getTime() - fechaA.getTime();
  });

  // 3. The FIRST event after sorting (most recent) is the ACTUAL status
  const ultimoEvento = eventosOrdenados[0];

  // 4. Get status from event description first
  const rawStatus = ultimoEvento.estado || ultimoEvento.status || ultimoEvento.description || '';
  const statusFromEvent = normalizeStatus(rawStatus);

  // If we got a meaningful status from the event, use it
  if (statusFromEvent !== 'DESCONOCIDO') {
    return statusFromEvent;
  }

  // Try the event's description field specifically
  if (ultimoEvento.description) {
    const statusFromDescription = normalizeStatus(ultimoEvento.description);
    if (statusFromDescription !== 'DESCONOCIDO') {
      return statusFromDescription;
    }
  }

  // Otherwise, fall back to the rawStatus or stored status
  if (guia.detailedInfo?.rawStatus) {
    return normalizeStatus(guia.detailedInfo.rawStatus);
  }

  return normalizeStatus(guia.status);
};

/**
 * Converts NormalizedStatus to ShipmentStatus enum
 */
export const normalizedToShipmentStatus = (normalized: NormalizedStatus): ShipmentStatus => {
  switch (normalized) {
    case 'ENTREGADO':
      return ShipmentStatus.DELIVERED;
    case 'EN_REPARTO':
      return ShipmentStatus.IN_TRANSIT;
    case 'EN_TRANSITO':
      return ShipmentStatus.IN_TRANSIT;
    case 'EN_OFICINA':
      return ShipmentStatus.IN_OFFICE;
    case 'NOVEDAD':
      return ShipmentStatus.ISSUE;
    case 'PENDIENTE':
      return ShipmentStatus.PENDING;
    default:
      return ShipmentStatus.PENDING;
  }
};

/**
 * Gets the semaphore color category for a shipment
 */
export type SemaforoColor = 'green' | 'yellow' | 'orange' | 'red';

export const getSemaforoColor = (guia: Shipment): SemaforoColor => {
  const status = getActualStatus(guia);

  switch (status) {
    case 'ENTREGADO':
      return 'green';
    case 'EN_REPARTO':
    case 'EN_TRANSITO':
    case 'PENDIENTE':
      return 'yellow';
    case 'EN_OFICINA':
      return 'orange';
    case 'NOVEDAD':
      return 'red';
    default:
      return 'yellow';
  }
};

/**
 * Groups shipments by their semaphore color
 */
export const groupBySemaforo = (shipments: Shipment[]): Record<SemaforoColor, Shipment[]> => {
  return shipments.reduce(
    (acc, shipment) => {
      const color = getSemaforoColor(shipment);
      if (!acc[color]) acc[color] = [];
      acc[color].push(shipment);
      return acc;
    },
    { green: [], yellow: [], orange: [], red: [] } as Record<SemaforoColor, Shipment[]>
  );
};

/**
 * Calculates hours since the last event update
 * Uses parseDate for robust date handling
 */
export const getHoursSinceUpdate = (guia: Shipment): number => {
  const eventos = guia.detailedInfo?.events || [];
  if (eventos.length === 0) return 0;

  // Sort by date descending to get the most recent event
  const eventosOrdenados = [...eventos].sort((a, b) => {
    const fechaA = parseDate(a.date);
    const fechaB = parseDate(b.date);
    return fechaB.getTime() - fechaA.getTime();
  });

  const lastDate = parseDate(eventosOrdenados[0].date);
  const now = new Date();

  // If date is at epoch (invalid), return 0
  if (lastDate.getTime() === 0) return 0;

  return Math.abs(now.getTime() - lastDate.getTime()) / 36e5;
};

/**
 * Calculates days in current status
 */
export const getDaysInCurrentStatus = (guia: Shipment): number => {
  const hours = getHoursSinceUpdate(guia);
  return Math.floor(hours / 24);
};
