// services/statusParserService.ts
// Servicio para extraer el estatus real del último movimiento de las guías

import { EstadoNormalizado } from '../types/carga.types';

// ==================== MAPEO DE DESCRIPCIONES A ESTADOS ====================

const MAPEO_INTER_RAPIDISIMO: Record<string, EstadoNormalizado> = {
  'envío fue entregado': 'Entregado',
  'envio fue entregado': 'Entregado',
  'tú envío fue entregado': 'Entregado',
  'tu envio fue entregado': 'Entregado',
  'entregado': 'Entregado',
  'no logramos hacer la entrega': 'Intento Fallido',
  'no se logro la entrega': 'Intento Fallido',
  'intento de entrega fallido': 'Intento Fallido',
  'en centro logístico destino': 'En Destino',
  'en centro logistico destino': 'En Destino',
  'viajando a tu destino': 'En Tránsito',
  'en centro logístico de tránsito': 'En Tránsito',
  'en centro logistico de transito': 'En Tránsito',
  'recibimos tú envío': 'Recibido',
  'recibimos tu envio': 'Recibido',
  'en reparto': 'En Reparto',
  'en ruta de entrega': 'En Reparto',
  'devuelto': 'Devuelto',
  'devolución': 'Devuelto',
  'en punto de recogida': 'En Oficina',
  'disponible para retiro': 'En Oficina',
  'novedad': 'Novedad',
  'problema con la dirección': 'Novedad',
  'dirección incorrecta': 'Novedad',
};

const MAPEO_COORDINADORA: Record<string, EstadoNormalizado> = {
  'entrega exitosa': 'Entregado',
  'entregado': 'Entregado',
  'paquete entregado': 'Entregado',
  'en reparto': 'En Reparto',
  'salió a reparto': 'En Reparto',
  'salio a reparto': 'En Reparto',
  'en terminal destino': 'En Destino',
  'llegó a terminal destino': 'En Destino',
  'llego a terminal destino': 'En Destino',
  'en tránsito': 'En Tránsito',
  'en transito': 'En Tránsito',
  'en terminal origen': 'Recibido',
  'recibido en terminal': 'Recibido',
  'guía generada': 'Creado',
  'guia generada': 'Creado',
  'en punto droop': 'En Oficina',
  'disponible en punto': 'En Oficina',
  'intento de entrega': 'Intento Fallido',
  'no entregado': 'Intento Fallido',
  'devuelto': 'Devuelto',
  'en devolución': 'Devuelto',
  'novedad': 'Novedad',
  'problema': 'Novedad',
};

const MAPEO_ENVIA: Record<string, EstadoNormalizado> = {
  'entregado': 'Entregado',
  'entrega exitosa': 'Entregado',
  'paquete entregado': 'Entregado',
  'en camino': 'En Tránsito',
  'en tránsito': 'En Tránsito',
  'en transito': 'En Tránsito',
  'en reparto': 'En Reparto',
  'en ruta': 'En Reparto',
  'llegó a destino': 'En Destino',
  'llego a destino': 'En Destino',
  'recibido': 'Recibido',
  'admitido': 'Recibido',
  'en oficina': 'En Oficina',
  'disponible para retiro': 'En Oficina',
  'intento fallido': 'Intento Fallido',
  'no entregado': 'Intento Fallido',
  'devuelto': 'Devuelto',
  'novedad': 'Novedad',
};

const MAPEO_TCC: Record<string, EstadoNormalizado> = {
  'entregado': 'Entregado',
  'entrega realizada': 'Entregado',
  'en tránsito': 'En Tránsito',
  'en transito': 'En Tránsito',
  'en distribución': 'En Reparto',
  'en distribucion': 'En Reparto',
  'en bodega destino': 'En Destino',
  'recepcionado': 'Recibido',
  'en agencia': 'En Oficina',
  'intento de entrega': 'Intento Fallido',
  'devuelto': 'Devuelto',
  'novedad': 'Novedad',
};

const MAPEO_SERVIENTREGA: Record<string, EstadoNormalizado> = {
  'entregado': 'Entregado',
  'entrega exitosa': 'Entregado',
  'en tránsito': 'En Tránsito',
  'en transito': 'En Tránsito',
  'en reparto': 'En Reparto',
  'en centro de distribución': 'En Destino',
  'en centro de distribucion': 'En Destino',
  'admitido': 'Recibido',
  'recibido': 'Recibido',
  'en punto de entrega': 'En Oficina',
  'intento fallido': 'Intento Fallido',
  'devuelto': 'Devuelto',
  'novedad': 'Novedad',
};

// ==================== FUNCIÓN PRINCIPAL ====================

/**
 * Extrae el estado normalizado del último movimiento de una guía
 * @param textoReporte - El texto completo del reporte de la guía
 * @param transportadora - La transportadora (opcional, se detecta automáticamente)
 * @returns El estado normalizado y la descripción original
 */
export function extraerEstadoReal(
  textoReporte: string,
  transportadora?: string
): { estadoNormalizado: EstadoNormalizado; descripcionOriginal: string } {
  const lineas = textoReporte.split('\n').map(l => l.trim()).filter(l => l);

  // Detectar transportadora si no se proporciona
  const carrierDetectado = transportadora || detectarTransportadora(textoReporte);

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

  // Normalizar el estado
  const estadoNormalizado = mapearDescripcionAEstado(primerMovimiento, carrierDetectado);

  return {
    estadoNormalizado,
    descripcionOriginal: primerMovimiento || 'Sin información',
  };
}

/**
 * Mapea una descripción a un estado normalizado basado en la transportadora
 */
function mapearDescripcionAEstado(
  descripcion: string,
  transportadora: string
): EstadoNormalizado {
  const descLower = descripcion.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const carrierLower = transportadora.toLowerCase();

  let mapeo: Record<string, EstadoNormalizado> = {};

  if (carrierLower.includes('inter') || carrierLower.includes('rapidisimo')) {
    mapeo = MAPEO_INTER_RAPIDISIMO;
  } else if (carrierLower.includes('coordinadora')) {
    mapeo = MAPEO_COORDINADORA;
  } else if (carrierLower.includes('envia') || carrierLower.includes('envía')) {
    mapeo = MAPEO_ENVIA;
  } else if (carrierLower.includes('tcc')) {
    mapeo = MAPEO_TCC;
  } else if (carrierLower.includes('servientrega')) {
    mapeo = MAPEO_SERVIENTREGA;
  } else {
    // Usar todos los mapeos combinados
    mapeo = {
      ...MAPEO_INTER_RAPIDISIMO,
      ...MAPEO_COORDINADORA,
      ...MAPEO_ENVIA,
      ...MAPEO_TCC,
      ...MAPEO_SERVIENTREGA,
    };
  }

  // Buscar coincidencia
  for (const [patron, estado] of Object.entries(mapeo)) {
    if (descLower.includes(patron.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) {
      return estado;
    }
  }

  // Si no hay coincidencia, intentar detectar por palabras clave genéricas
  if (descLower.includes('entregad')) return 'Entregado';
  if (descLower.includes('transito') || descLower.includes('viajando')) return 'En Tránsito';
  if (descLower.includes('reparto') || descLower.includes('ruta')) return 'En Reparto';
  if (descLower.includes('destino') || descLower.includes('llegó') || descLower.includes('llego')) return 'En Destino';
  if (descLower.includes('oficina') || descLower.includes('retiro') || descLower.includes('punto')) return 'En Oficina';
  if (descLower.includes('fallido') || descLower.includes('no logr') || descLower.includes('intento')) return 'Intento Fallido';
  if (descLower.includes('devuel') || descLower.includes('retorno')) return 'Devuelto';
  if (descLower.includes('recib') || descLower.includes('admiti')) return 'Recibido';
  if (descLower.includes('novedad') || descLower.includes('problema')) return 'Novedad';
  if (descLower.includes('cread') || descLower.includes('generad')) return 'Creado';

  return 'Desconocido';
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
