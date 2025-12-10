// ============================================
// PATTERN DETECTION ALGORITHMS
// Identifies problematic patterns in logistics data
// ============================================

import { Shipment, ShipmentStatus, CarrierName } from '../types';
import {
  PatronDetectado,
  PatronTipo,
  PatronImpacto,
  GuiaRetrasada,
  AlertLevel,
  CiudadSemaforo,
  SemaforoExcelData,
  AnalisisPrediccion,
} from '../types/logistics';

/**
 * Calculate days since a date
 */
export function calcularDiasDesde(fecha: Date | string): number {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
  const hoy = new Date();
  const diffTime = hoy.getTime() - date.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get the last event date from a shipment
 */
export function getUltimaFechaEvento(guia: Shipment): Date | null {
  const events = guia.detailedInfo?.events || [];
  if (events.length === 0) return null;

  // Sort by date descending
  const sortedEvents = [...events].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  });

  return new Date(sortedEvents[0].date);
}

/**
 * Calculate days without movement for a shipment
 */
export function calcularDiasSinMovimiento(guia: Shipment): number {
  const ultimaFecha = getUltimaFechaEvento(guia);
  if (!ultimaFecha) return 0;
  return calcularDiasDesde(ultimaFecha);
}

/**
 * Classify alert level based on days without movement
 */
export function clasificarAlerta(diasSinMovimiento: number): AlertLevel {
  if (diasSinMovimiento >= 5) return 'CRITICO';
  if (diasSinMovimiento >= 3) return 'ALTO';
  if (diasSinMovimiento >= 2) return 'MEDIO';
  return 'BAJO';
}

/**
 * Get AI recommendation based on alert level
 */
export function getRecomendacionPorAlerta(nivel: AlertLevel, guia: Shipment): string {
  const status = guia.status;

  switch (nivel) {
    case 'CRITICO':
      if (status === ShipmentStatus.IN_OFFICE) {
        return 'URGENTE: Contactar cliente para coordinar retiro o re-entrega. Considerar devolución si no responde en 24h.';
      }
      return 'Contactar transportadora URGENTE. Posible pérdida de paquete. Escalar caso.';

    case 'ALTO':
      if (status === ShipmentStatus.IN_OFFICE) {
        return 'Llamar al cliente para verificar disponibilidad de retiro. Enviar recordatorio por WhatsApp.';
      }
      return 'Llamar al cliente y verificar dirección. Escalar con transportadora.';

    case 'MEDIO':
      return 'Monitorear de cerca. Enviar WhatsApp al cliente informando estado.';

    default:
      return 'Dentro de tiempo normal. Continuar monitoreo estándar.';
  }
}

/**
 * Detect delayed shipments
 */
export function detectarGuiasRetrasadas(guias: Shipment[]): GuiaRetrasada[] {
  const retrasadas: GuiaRetrasada[] = [];
  const hoy = new Date();

  guias.forEach((guia) => {
    // Skip delivered shipments
    if (guia.status === ShipmentStatus.DELIVERED) return;

    const diasSinMovimiento = calcularDiasSinMovimiento(guia);
    const ultimaFecha = getUltimaFechaEvento(guia);

    if (diasSinMovimiento >= 2 && ultimaFecha) {
      const events = guia.detailedInfo?.events || [];
      const ultimoEstado =
        events.length > 0
          ? events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
              .description
          : guia.status;

      const nivelAlerta = clasificarAlerta(diasSinMovimiento);
      const recomendacionIA = getRecomendacionPorAlerta(nivelAlerta, guia);

      retrasadas.push({
        guia,
        diasSinMovimiento,
        ultimoEstado,
        ultimaFecha,
        nivelAlerta,
        recomendacionIA,
      });
    }
  });

  // Sort by days without movement (descending)
  return retrasadas.sort((a, b) => b.diasSinMovimiento - a.diasSinMovimiento);
}

/**
 * Group items by a key
 */
function groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return array.reduce(
    (acc, item) => {
      const key = keyFn(item);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {} as Record<string, T[]>
  );
}

/**
 * Main pattern detection function
 */
export function detectarPatrones(
  guias: Shipment[],
  datosHistoricos?: SemaforoExcelData
): PatronDetectado[] {
  const patrones: PatronDetectado[] = [];

  // 1. PATTERN: Shipments without movement (48h+)
  const sinMovimiento48h = guias.filter((g) => {
    const dias = calcularDiasSinMovimiento(g);
    return dias >= 2 && g.status !== ShipmentStatus.DELIVERED;
  });

  if (sinMovimiento48h.length > 0) {
    patrones.push({
      id: 'sin-movimiento-48h',
      tipo: 'RETRASO',
      titulo: `${sinMovimiento48h.length} guías sin movimiento (+48h)`,
      descripcion: 'Guías que llevan más de 2 días sin actualización de estado',
      datosApoyo: {
        cantidad: sinMovimiento48h.length,
        porcentaje: (sinMovimiento48h.length / guias.length) * 100,
        guiasEjemplo: sinMovimiento48h.slice(0, 3).map((g) => g.id),
      },
      impacto: sinMovimiento48h.length > 5 ? 'CRITICO' : 'ALTO',
      recomendacion:
        'Contactar proactivamente antes de que cumplan 72h. Guías sin movimiento > 48h tienen 60% probabilidad de devolución.',
      accionable: true,
      guiasAfectadas: sinMovimiento48h,
    });
  }

  // 2. PATTERN: Problem zone (multiple issues in same city)
  const guiasConNovedad = guias.filter((g) => g.status === ShipmentStatus.ISSUE);
  const porCiudad = groupBy(guiasConNovedad, (g) => g.detailedInfo?.destination || 'DESCONOCIDO');

  Object.entries(porCiudad).forEach(([ciudad, guiasNovedad]) => {
    if (guiasNovedad.length >= 3) {
      patrones.push({
        id: `zona-problema-${ciudad.toLowerCase().replace(/\s/g, '-')}`,
        tipo: 'ZONA',
        titulo: `${ciudad}: ${guiasNovedad.length} novedades recurrentes`,
        descripcion: `Alto índice de problemas en envíos a ${ciudad}`,
        datosApoyo: {
          cantidad: guiasNovedad.length,
          porcentaje: guias.length > 0 ? (guiasNovedad.length / guias.length) * 100 : 0,
          guiasEjemplo: guiasNovedad.slice(0, 3).map((g) => g.id),
        },
        impacto: 'ALTO',
        recomendacion: `Verificar direcciones antes de enviar a ${ciudad}. Considerar prepago para esta zona.`,
        accionable: true,
        guiasAfectadas: guiasNovedad,
      });
    }
  });

  // 3. PATTERN: Low performance carrier
  const porTransportadora = groupBy(guias, (g) => g.carrier);

  Object.entries(porTransportadora).forEach(([trans, guiasTrans]) => {
    const entregadas = guiasTrans.filter((g) => g.status === ShipmentStatus.DELIVERED).length;
    const tasa = guiasTrans.length > 0 ? (entregadas / guiasTrans.length) * 100 : 0;

    if (tasa < 70 && guiasTrans.length >= 5) {
      patrones.push({
        id: `trans-bajo-${trans.toLowerCase().replace(/\s/g, '-')}`,
        tipo: 'TRANSPORTADORA',
        titulo: `${trans}: ${tasa.toFixed(0)}% efectividad`,
        descripcion: `Rendimiento por debajo del esperado (mínimo 70%)`,
        datosApoyo: {
          cantidad: guiasTrans.length,
          porcentaje: tasa,
          guiasEjemplo: guiasTrans
            .filter((g) => g.status !== ShipmentStatus.DELIVERED)
            .slice(0, 3)
            .map((g) => g.id),
        },
        impacto: tasa < 50 ? 'CRITICO' : 'MEDIO',
        recomendacion: `Evaluar alternativas a ${trans} para las rutas problemáticas. Considerar cambio de transportadora.`,
        accionable: true,
        guiasAfectadas: guiasTrans.filter((g) => g.status !== ShipmentStatus.DELIVERED),
      });
    }
  });

  // 4. PATTERN: Old shipments (7+ days without delivery)
  const guiasAntiguas = guias.filter((g) => {
    if (g.status === ShipmentStatus.DELIVERED) return false;
    const diasEnTransito = g.detailedInfo?.daysInTransit || 0;
    return diasEnTransito > 7;
  });

  if (guiasAntiguas.length > 0) {
    patrones.push({
      id: 'guias-antiguas',
      tipo: 'TIEMPO',
      titulo: `${guiasAntiguas.length} guías con +7 días sin entregar`,
      descripcion: 'Envíos que superan el tiempo máximo esperado',
      datosApoyo: {
        cantidad: guiasAntiguas.length,
        porcentaje: guias.length > 0 ? (guiasAntiguas.length / guias.length) * 100 : 0,
        guiasEjemplo: guiasAntiguas.slice(0, 3).map((g) => g.id),
      },
      impacto: 'CRITICO',
      recomendacion:
        'Escalar con transportadora. Iniciar proceso de reclamación. Alta probabilidad de pérdida.',
      accionable: true,
      guiasAfectadas: guiasAntiguas,
    });
  }

  // 5. PATTERN: Shipments in office too long
  const enOficina = guias.filter((g) => g.status === ShipmentStatus.IN_OFFICE);
  const enOficinaMuchoTiempo = enOficina.filter((g) => calcularDiasSinMovimiento(g) >= 3);

  if (enOficinaMuchoTiempo.length > 0) {
    patrones.push({
      id: 'en-oficina-mucho-tiempo',
      tipo: 'DEVOLUCION',
      titulo: `${enOficinaMuchoTiempo.length} guías en oficina +3 días`,
      descripcion: 'Guías esperando retiro que pueden convertirse en devolución',
      datosApoyo: {
        cantidad: enOficinaMuchoTiempo.length,
        porcentaje: guias.length > 0 ? (enOficinaMuchoTiempo.length / guias.length) * 100 : 0,
        guiasEjemplo: enOficinaMuchoTiempo.slice(0, 3).map((g) => g.id),
      },
      impacto: 'ALTO',
      recomendacion:
        'Contactar clientes urgentemente. Las guías en oficina > 5 días serán devueltas automáticamente.',
      accionable: true,
      guiasAfectadas: enOficinaMuchoTiempo,
    });
  }

  // Sort by impact priority
  const prioridad: Record<PatronImpacto, number> = { CRITICO: 0, ALTO: 1, MEDIO: 2, BAJO: 3 };
  return patrones.sort((a, b) => prioridad[a.impacto] - prioridad[b.impacto]);
}

/**
 * Classify city for semaforo
 * THRESHOLDS (as specified):
 * - VERDE: ≥75% éxito - Excelente rendimiento
 * - AMARILLO: 65-74% éxito - Buen rendimiento
 * - NARANJA: 50-64% éxito - Alerta
 * - ROJO: <50% éxito - Crítico
 */
export function clasificarCiudadSemaforo(
  ciudad: string,
  transportadora: string,
  entregas: number,
  devoluciones: number,
  total: number,
  tiempoPromedio: number
): CiudadSemaforo {
  const tasaExito = total > 0 ? (entregas / total) * 100 : 0;
  const tasaDevolucion = total > 0 ? (devoluciones / total) * 100 : 0;

  let semaforo: CiudadSemaforo['semaforo'];
  let recomendacionIA: string;

  // New thresholds as specified
  if (tasaExito >= 75) {
    semaforo = 'VERDE';
    recomendacionIA = 'Excelente rendimiento. Mantener operación actual.';
  } else if (tasaExito >= 65) {
    semaforo = 'AMARILLO';
    recomendacionIA = 'Buen rendimiento. Monitorear para identificar mejoras.';
  } else if (tasaExito >= 50) {
    semaforo = 'NARANJA';
    recomendacionIA = 'Alerta. Confirmar datos del cliente antes de enviar.';
  } else {
    semaforo = 'ROJO';
    recomendacionIA = 'Crítico. Exigir PREPAGO obligatorio o cambiar transportadora.';
  }

  // Adjust recommendation based on delivery time
  if (tiempoPromedio > 7) {
    recomendacionIA += ` Tiempo promedio alto (${tiempoPromedio.toFixed(1)} días).`;
  }

  return {
    ciudad,
    transportadora,
    entregas,
    devoluciones,
    total,
    tasaExito,
    tasaDevolucion,
    tiempoPromedio,
    semaforo,
    recomendacionIA,
  };
}

/**
 * Process Excel data to generate semaforo classifications
 */
export function procesarExcelParaSemaforo(data: SemaforoExcelData): CiudadSemaforo[] {
  const ciudades: CiudadSemaforo[] = [];

  // Create a map of delivery times by city-carrier
  const tiemposMap = new Map<string, number>();
  data.tiempoPromedio.forEach((row) => {
    const key = `${row.ciudad.toUpperCase()}-${row.transportadora.toUpperCase()}`;
    tiemposMap.set(key, row.dias);
  });

  // Process each delivery rate row
  data.tasaEntregas.forEach((row) => {
    const key = `${row.ciudad.toUpperCase()}-${row.transportadora.toUpperCase()}`;
    const tiempoPromedio = tiemposMap.get(key) || 0;

    const clasificacion = clasificarCiudadSemaforo(
      row.ciudad,
      row.transportadora,
      row.entregas,
      row.devoluciones,
      row.total,
      tiempoPromedio
    );

    ciudades.push(clasificacion);
  });

  // Sort by success rate (ascending, so critical ones first)
  return ciudades.sort((a, b) => a.tasaExito - b.tasaExito);
}

/**
 * Generate prediction analysis for a city-carrier combination
 */
export function generarPrediccion(
  ciudad: string,
  transportadora: string,
  guiasActivas: Shipment[],
  datosHistoricos?: CiudadSemaforo
): AnalisisPrediccion {
  // Filter relevant shipments
  const guiasCiudad = guiasActivas.filter((g) => {
    const dest = g.detailedInfo?.destination?.toUpperCase() || '';
    const trans = g.carrier;
    return dest.includes(ciudad.toUpperCase()) && trans === transportadora;
  });

  // Calculate current metrics
  const retrasadas = guiasCiudad.filter((g) => calcularDiasSinMovimiento(g) >= 2);
  const promedioRetraso =
    retrasadas.length > 0
      ? retrasadas.reduce((sum, g) => sum + calcularDiasSinMovimiento(g), 0) / retrasadas.length
      : 0;

  // Calculate trend
  let tendencia: AnalisisPrediccion['tendencia'] = 'ESTABLE';
  let variacion = 0;

  if (datosHistoricos && guiasCiudad.length >= 5) {
    const entregadas = guiasCiudad.filter((g) => g.status === ShipmentStatus.DELIVERED).length;
    const tasaActual = (entregadas / guiasCiudad.length) * 100;
    variacion = tasaActual - datosHistoricos.tasaExito;

    if (variacion > 5) tendencia = 'MEJORANDO';
    else if (variacion < -5) tendencia = 'EMPEORANDO';
  }

  // Generate prediction
  const tasaBase = datosHistoricos?.tasaExito || 75;
  const ajustePorRetrasos = retrasadas.length > 0 ? -10 : 0;
  const ajustePorTendencia = tendencia === 'MEJORANDO' ? 5 : tendencia === 'EMPEORANDO' ? -5 : 0;

  const probabilidadExito = Math.min(
    100,
    Math.max(0, tasaBase + ajustePorRetrasos + ajustePorTendencia)
  );

  // Generate recommendations
  const recomendaciones: string[] = [];

  if (probabilidadExito < 50) {
    recomendaciones.push('Solicitar prepago obligatorio para esta ruta');
  }
  if (retrasadas.length > 0) {
    recomendaciones.push(`${retrasadas.length} guías requieren seguimiento urgente`);
  }
  if (tendencia === 'EMPEORANDO') {
    recomendaciones.push('Tendencia negativa. Considerar cambiar transportadora');
  }
  if (datosHistoricos && datosHistoricos.tiempoPromedio > 5) {
    recomendaciones.push('Informar al cliente sobre tiempo extendido de entrega');
  }

  return {
    ciudad,
    transportadora,
    guiasActivas: guiasCiudad.length,
    guiasRetrasadas: retrasadas.length,
    promedioRetrasoActual: promedioRetraso,
    tasaExitoHistorica: datosHistoricos?.tasaExito || 0,
    tiempoPromedioHistorico: datosHistoricos?.tiempoPromedio || 0,
    tendencia,
    variacionVsHistorico: variacion,
    probabilidadExito,
    riesgoDevolucion: 100 - probabilidadExito,
    tiempoEstimado: datosHistoricos?.tiempoPromedio || 5,
    recomendaciones,
  };
}
