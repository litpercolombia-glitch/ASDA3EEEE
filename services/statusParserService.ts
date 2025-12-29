// services/statusParserService.ts
// Servicio para extraer el estatus real del último movimiento de las guías
// MIGRADO: Usa StatusNormalizer como fuente única de verdad

import { EstadoNormalizado } from '../types/carga.types';
import { StatusNormalizer, detectCarrier } from './StatusNormalizer';
import {
  CanonicalStatus,
  CanonicalStatusLabels,
  ExceptionReason,
  ExceptionReasonLabels,
  NormalizedStatus,
  CarrierCode,
} from '../types/canonical.types';

// ==================== MAPEO CANÓNICO A ESTADO NORMALIZADO LEGACY ====================
// Este mapeo mantiene compatibilidad con el tipo EstadoNormalizado existente

const CANONICAL_TO_LEGACY: Record<CanonicalStatus, EstadoNormalizado> = {
  [CanonicalStatus.CREATED]: 'Creado',
  [CanonicalStatus.PROCESSING]: 'Recibido',
  [CanonicalStatus.SHIPPED]: 'En Tránsito',
  [CanonicalStatus.IN_TRANSIT]: 'En Tránsito',
  [CanonicalStatus.OUT_FOR_DELIVERY]: 'En Reparto',
  [CanonicalStatus.IN_OFFICE]: 'En Oficina',
  [CanonicalStatus.DELIVERED]: 'Entregado',
  [CanonicalStatus.ISSUE]: 'Novedad',
  [CanonicalStatus.RETURNED]: 'Devuelto',
  [CanonicalStatus.CANCELLED]: 'Devuelto', // No hay 'Cancelado' en legacy
};

// Mapeo especial para razones de novedad que son "Intento Fallido"
const ISSUE_REASON_TO_LEGACY: Partial<Record<ExceptionReason, EstadoNormalizado>> = {
  [ExceptionReason.DELIVERY_ATTEMPT_FAILED]: 'Intento Fallido',
  [ExceptionReason.RECIPIENT_UNAVAILABLE]: 'Intento Fallido',
};

// ==================== FUNCIÓN PRINCIPAL ====================

/**
 * Convierte un NormalizedStatus canónico a EstadoNormalizado legacy
 */
function canonicalToLegacy(normalized: NormalizedStatus): EstadoNormalizado {
  // Caso especial: si es ISSUE, verificar si es un intento fallido
  if (normalized.status === CanonicalStatus.ISSUE) {
    const legacyFromReason = ISSUE_REASON_TO_LEGACY[normalized.reason];
    if (legacyFromReason) {
      return legacyFromReason;
    }
  }

  return CANONICAL_TO_LEGACY[normalized.status] || 'Desconocido';
}

/**
 * Extrae el estado normalizado del último movimiento de una guía
 * MIGRADO: Usa StatusNormalizer como fuente única de verdad
 *
 * @param textoReporte - El texto completo del reporte de la guía
 * @param transportadora - La transportadora (opcional, se detecta automáticamente)
 * @returns El estado normalizado y la descripción original
 */
export function extraerEstadoReal(
  textoReporte: string,
  transportadora?: string
): { estadoNormalizado: EstadoNormalizado; descripcionOriginal: string; canonical?: NormalizedStatus } {
  const lineas = textoReporte.split('\n').map(l => l.trim()).filter(l => l);

  // Detectar transportadora si no se proporciona
  const carrierDetectado = transportadora || detectarTransportadora(textoReporte);
  const carrierCode = detectCarrier(carrierDetectado);

  // Buscar el primer movimiento (el más reciente)
  // Los movimientos tienen formato: YYYY-MM-DD HH:MM UBICACION DESCRIPCION
  const regexMovimiento = /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s+(.+)$/;

  let primerMovimiento = '';

  for (const linea of lineas) {
    if (regexMovimiento.test(linea)) {
      // Extraer la descripción (después de la ubicación)
      const match = linea.match(regexMovimiento);
      if (match) {
        // La línea es: fecha hora ubicacion descripcion
        // Necesitamos extraer la descripción que está después de la ubicación
        const partes = linea.split(/\s+/);
        // partes[0] = fecha, partes[1] = hora, partes[2+] = ubicación + descripción
        // La descripción suele estar después del código de país (COL)
        const indexCOL = partes.findIndex(p => p === 'COL');
        if (indexCOL >= 0 && indexCOL < partes.length - 1) {
          primerMovimiento = partes.slice(indexCOL + 1).join(' ');
        } else {
          // Fallback: tomar todo después de la hora
          primerMovimiento = partes.slice(2).join(' ');
        }
        break;
      }
    }
  }

  if (!primerMovimiento) {
    // Si no encontramos el formato esperado, buscar en "Estatus del paquete"
    for (const linea of lineas) {
      if (linea.toLowerCase().includes('estatus del paquete:') ||
          linea.toLowerCase().includes('estado:')) {
        const partes = linea.split(':');
        if (partes.length > 1) {
          primerMovimiento = partes.slice(1).join(':').trim();
          // Limpiar el texto (quitar días entre paréntesis)
          primerMovimiento = primerMovimiento.replace(/\s*\(\d+\s*días?\)/i, '').trim();
          break;
        }
      }
    }
  }

  // Usar StatusNormalizer como fuente única de verdad
  const canonical = StatusNormalizer.normalize(primerMovimiento || 'Desconocido', carrierCode);
  const estadoNormalizado = canonicalToLegacy(canonical);

  return {
    estadoNormalizado,
    descripcionOriginal: primerMovimiento || 'Sin información',
    canonical, // Incluir datos canónicos para uso futuro
  };
}

/**
 * Mapea una descripción a un estado normalizado basado en la transportadora
 * MIGRADO: Usa StatusNormalizer como fuente única de verdad
 */
function mapearDescripcionAEstado(
  descripcion: string,
  transportadora: string
): EstadoNormalizado {
  const carrierCode = detectCarrier(transportadora);
  const normalized = StatusNormalizer.normalize(descripcion, carrierCode);
  return canonicalToLegacy(normalized);
}

/**
 * Detecta la transportadora a partir del texto del reporte
 */
function detectarTransportadora(texto: string): string {
  const textoLower = texto.toLowerCase();

  if (textoLower.includes('inter rapidisimo') || textoLower.includes('inter rapidísimo') || textoLower.includes('interrapidisimo')) {
    return 'Inter Rapidísimo';
  }
  if (textoLower.includes('coordinadora')) {
    return 'Coordinadora';
  }
  if (textoLower.includes('envia') || textoLower.includes('envía')) {
    return 'Envía';
  }
  if (textoLower.includes('tcc')) {
    return 'TCC';
  }
  if (textoLower.includes('servientrega')) {
    return 'Servientrega';
  }

  return 'Desconocida';
}

/**
 * Parsea un bloque de texto de reporte de una guía individual
 * Extrae: número de guía, transportadora, estado real, historial de eventos
 */
export function parsearBloqueGuia(bloque: string): {
  numeroGuia: string;
  transportadora: string;
  estadoReportado: string;
  estadoReal: EstadoNormalizado;
  descripcionUltimoMovimiento: string;
  diasTransito: number;
  historial: Array<{ fecha: string; hora: string; ubicacion: string; descripcion: string }>;
} {
  const lineas = bloque.split('\n').map(l => l.trim()).filter(l => l);

  let numeroGuia = '';
  let transportadora = '';
  let estadoReportado = '';
  let diasTransito = 0;
  const historial: Array<{ fecha: string; hora: string; ubicacion: string; descripcion: string }> = [];

  for (const linea of lineas) {
    // Extraer número de guía
    if (linea.toLowerCase().startsWith('número:') || linea.toLowerCase().startsWith('numero:')) {
      numeroGuia = linea.split(':')[1]?.trim() || '';
    }

    // Extraer estatus reportado
    if (linea.toLowerCase().includes('estatus del paquete:') || linea.toLowerCase().includes('estado:')) {
      const partes = linea.split(':');
      if (partes.length > 1) {
        estadoReportado = partes.slice(1).join(':').trim();
        // Extraer días si están entre paréntesis
        const matchDias = estadoReportado.match(/\((\d+)\s*días?\)/i);
        if (matchDias) {
          diasTransito = parseInt(matchDias[1], 10);
        }
        estadoReportado = estadoReportado.replace(/\s*\(\d+\s*días?\)/i, '').trim();
      }
    }

    // Detectar transportadora por nombre en el texto
    if (linea.toLowerCase().includes('inter rapid') || linea.toLowerCase().includes('interrapid')) {
      transportadora = 'Inter Rapidísimo';
    } else if (linea.toLowerCase().includes('coordinadora')) {
      transportadora = 'Coordinadora';
    } else if (linea.toLowerCase().includes('envi')) {
      transportadora = 'Envía';
    } else if (linea.toLowerCase().includes('tcc')) {
      transportadora = 'TCC';
    } else if (linea.toLowerCase().includes('servientrega')) {
      transportadora = 'Servientrega';
    }

    // Parsear eventos del historial
    // Formato esperado: YYYY-MM-DD HH:MM UBICACION DESCRIPCION
    const regexEvento = /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s+(.+)$/;
    const match = linea.match(regexEvento);
    if (match) {
      const [, fecha, hora, resto] = match;
      // Separar ubicación y descripción
      // La ubicación suele terminar con "COL" (código de país)
      const partes = resto.split(/\s+/);
      const indexCOL = partes.findIndex(p => p === 'COL');

      let ubicacion = '';
      let descripcion = '';

      if (indexCOL >= 0) {
        ubicacion = partes.slice(0, indexCOL + 1).join(' ');
        descripcion = partes.slice(indexCOL + 1).join(' ');
      } else {
        // Si no hay COL, asumir que los primeros 2-3 tokens son ubicación
        ubicacion = partes.slice(0, 3).join(' ');
        descripcion = partes.slice(3).join(' ');
      }

      historial.push({ fecha, hora, ubicacion, descripcion });
    }
  }

  // Extraer estado real del primer evento (más reciente)
  const { estadoNormalizado, descripcionOriginal } = historial.length > 0
    ? {
        estadoNormalizado: mapearDescripcionAEstado(historial[0].descripcion, transportadora),
        descripcionOriginal: historial[0].descripcion,
      }
    : extraerEstadoReal(bloque, transportadora);

  return {
    numeroGuia,
    transportadora: transportadora || 'Desconocida',
    estadoReportado,
    estadoReal: estadoNormalizado,
    descripcionUltimoMovimiento: descripcionOriginal,
    diasTransito,
    historial,
  };
}

/**
 * Parsea múltiples guías de un texto de reporte completo
 */
export function parsearReporteCompleto(texto: string): ReturnType<typeof parsearBloqueGuia>[] {
  // Dividir por "Número:" para separar cada guía
  const bloques = texto.split(/(?=Número:\s*\d)/i).filter(b => b.trim());

  return bloques.map(bloque => parsearBloqueGuia(bloque));
}

export default {
  extraerEstadoReal,
  parsearBloqueGuia,
  parsearReporteCompleto,
  detectarTransportadora,
};
