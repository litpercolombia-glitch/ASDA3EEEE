// services/aiScoringService.ts
// Sistema de Scoring IA y Predicción de Riesgo para Guías Logísticas
// Fase 2: Aprendizaje Automático y Mejora Continua

import { Shipment, ShipmentStatus, CarrierName } from '../types';

// =====================================
// TIPOS E INTERFACES
// =====================================

export interface GuiaScore {
  guiaId: string;
  scoreTotal: number; // 0-100 (100 = mayor riesgo)
  nivelRiesgo: 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAJO';
  probabilidadDevolucion: number; // 0-100%
  probabilidadEntrega: number; // 0-100%
  factoresRiesgo: FactorRiesgo[];
  recomendacionPrioritaria: string;
  accionesRecomendadas: AccionRecomendada[];
  tiempoEstimadoResolucion: string;
  impactoEconomico: 'ALTO' | 'MEDIO' | 'BAJO';
}

export interface FactorRiesgo {
  nombre: string;
  peso: number; // Contribución al score (0-30)
  descripcion: string;
  mitigable: boolean;
}

export interface AccionRecomendada {
  id: string;
  accion: string;
  prioridad: 1 | 2 | 3; // 1 = máxima
  impactoEsperado: string;
  tiempoEjecucion: string;
}

export interface PatronAprendido {
  id: string;
  tipo: 'TRANSPORTADORA' | 'CIUDAD' | 'HORA' | 'DIA_SEMANA' | 'TEMPORADA';
  valor: string;
  tasaExitoHistorica: number;
  muestras: number;
  ultimaActualizacion: Date;
}

export interface PrediccionDiaria {
  fecha: string;
  entregasEsperadas: number;
  novedadesEsperadas: number;
  guiasCriticas: string[];
  horasPico: string[];
  recomendacionGeneral: string;
  confianza: number; // 0-100%
}

// =====================================
// CONSTANTES Y PESOS
// =====================================

// Pesos para cálculo de score (suma = 100)
const PESOS_SCORE = {
  diasSinMovimiento: 25,
  tipoNovedad: 20,
  historicoCiudad: 15,
  historicoTransportadora: 15,
  horaDelDia: 10,
  diaSemana: 10,
  temporada: 5,
};

// Ciudades con alto riesgo histórico (datos de ejemplo)
const CIUDADES_RIESGO_ALTO = [
  'TUMACO', 'BUENAVENTURA', 'QUIBDÓ', 'MITÚ', 'LETICIA',
  'PUERTO CARREÑO', 'SAN JOSÉ DEL GUAVIARE', 'MOCOA'
];

const CIUDADES_RIESGO_MEDIO = [
  'CÚCUTA', 'ARAUCA', 'FLORENCIA', 'YOPAL', 'RIOHACHA',
  'VALLEDUPAR', 'SINCELEJO', 'MONTERÍA'
];

// Novedades por gravedad
const NOVEDADES_CRITICAS = [
  'DEVUELTO', 'RECHAZADO', 'DESCONOCE', 'NO EXISTE DIRECCIÓN',
  'ZONA DE DIFÍCIL ACCESO', 'CLIENTE FALLECIDO'
];

const NOVEDADES_RECUPERABLES = [
  'NO ESTABA', 'NO CANCELA', 'CERRADO', 'DIRECCIÓN INCOMPLETA',
  'REPROGRAMAR', 'AUSENTE'
];

// =====================================
// FUNCIONES DE CÁLCULO DE SCORE
// =====================================

/**
 * Calcula el score de riesgo para una guía
 */
export const calcularScoreGuia = (
  shipment: Shipment,
  patronesAprendidos?: PatronAprendido[]
): GuiaScore => {
  let scoreTotal = 0;
  const factoresRiesgo: FactorRiesgo[] = [];

  // 1. DÍAS SIN MOVIMIENTO (25 pts max)
  const diasSinMov = shipment.detailedInfo?.daysInTransit || 0;
  let scoreDias = 0;
  if (diasSinMov >= 7) scoreDias = 25;
  else if (diasSinMov >= 5) scoreDias = 20;
  else if (diasSinMov >= 3) scoreDias = 15;
  else if (diasSinMov >= 2) scoreDias = 10;
  else if (diasSinMov >= 1) scoreDias = 5;

  if (scoreDias > 0) {
    factoresRiesgo.push({
      nombre: 'Días sin movimiento',
      peso: scoreDias,
      descripcion: `${diasSinMov} días sin actualización`,
      mitigable: true
    });
    scoreTotal += scoreDias;
  }

  // 2. TIPO DE NOVEDAD (20 pts max)
  const estadoRaw = shipment.detailedInfo?.rawStatus?.toUpperCase() || '';
  let scoreNovedad = 0;

  if (NOVEDADES_CRITICAS.some(n => estadoRaw.includes(n))) {
    scoreNovedad = 20;
    factoresRiesgo.push({
      nombre: 'Novedad crítica',
      peso: 20,
      descripcion: 'Novedad con baja probabilidad de recuperación',
      mitigable: false
    });
  } else if (NOVEDADES_RECUPERABLES.some(n => estadoRaw.includes(n))) {
    scoreNovedad = 12;
    factoresRiesgo.push({
      nombre: 'Novedad recuperable',
      peso: 12,
      descripcion: 'Novedad que puede resolverse con gestión',
      mitigable: true
    });
  } else if (shipment.status === ShipmentStatus.ISSUE) {
    scoreNovedad = 8;
    factoresRiesgo.push({
      nombre: 'Estado de novedad',
      peso: 8,
      descripcion: 'Guía marcada con novedad',
      mitigable: true
    });
  } else if (shipment.status === ShipmentStatus.IN_OFFICE) {
    scoreNovedad = 15;
    factoresRiesgo.push({
      nombre: 'En oficina sin recoger',
      peso: 15,
      descripcion: 'Alto riesgo de devolución si no se recoge',
      mitigable: true
    });
  }
  scoreTotal += scoreNovedad;

  // 3. HISTÓRICO CIUDAD (15 pts max)
  const ciudad = shipment.detailedInfo?.destination?.toUpperCase() || '';
  let scoreCiudad = 0;

  if (CIUDADES_RIESGO_ALTO.some(c => ciudad.includes(c))) {
    scoreCiudad = 15;
    factoresRiesgo.push({
      nombre: 'Ciudad de alto riesgo',
      peso: 15,
      descripcion: `${ciudad} tiene historial de entregas difíciles`,
      mitigable: false
    });
  } else if (CIUDADES_RIESGO_MEDIO.some(c => ciudad.includes(c))) {
    scoreCiudad = 8;
    factoresRiesgo.push({
      nombre: 'Ciudad de riesgo medio',
      peso: 8,
      descripcion: `${ciudad} requiere atención adicional`,
      mitigable: true
    });
  }
  scoreTotal += scoreCiudad;

  // 4. HISTÓRICO TRANSPORTADORA (15 pts max)
  const carrier = shipment.carrier;
  const patronTransportadora = patronesAprendidos?.find(
    p => p.tipo === 'TRANSPORTADORA' && p.valor === carrier
  );

  let scoreTransportadora = 0;
  if (patronTransportadora) {
    if (patronTransportadora.tasaExitoHistorica < 70) {
      scoreTransportadora = 15;
    } else if (patronTransportadora.tasaExitoHistorica < 85) {
      scoreTransportadora = 8;
    }
  }
  scoreTotal += scoreTransportadora;

  // 5. HORA DEL DÍA (10 pts max)
  const hora = new Date().getHours();
  let scoreHora = 0;
  // Entregas después de las 6pm tienen menor probabilidad
  if (hora >= 18 || hora < 8) {
    scoreHora = 5;
  }
  scoreTotal += scoreHora;

  // 6. DÍA DE LA SEMANA (10 pts max)
  const diaSemana = new Date().getDay();
  let scoreDia = 0;
  // Viernes y sábado = más riesgo de no entrega por fin de semana
  if (diaSemana === 5) scoreDia = 5;
  if (diaSemana === 6) scoreDia = 8;
  if (diaSemana === 0) scoreDia = 10; // Domingo = riesgo alto
  scoreTotal += scoreDia;

  // 7. TEMPORADA (5 pts max)
  const mes = new Date().getMonth();
  let scoreTemporada = 0;
  // Diciembre = alta demanda, más retrasos
  if (mes === 11 || mes === 0) scoreTemporada = 5;
  scoreTotal += scoreTemporada;

  // Calcular nivel de riesgo
  let nivelRiesgo: GuiaScore['nivelRiesgo'];
  if (scoreTotal >= 60) nivelRiesgo = 'CRITICO';
  else if (scoreTotal >= 40) nivelRiesgo = 'ALTO';
  else if (scoreTotal >= 20) nivelRiesgo = 'MEDIO';
  else nivelRiesgo = 'BAJO';

  // Calcular probabilidades
  const probabilidadDevolucion = Math.min(95, scoreTotal + 10);
  const probabilidadEntrega = Math.max(5, 100 - probabilidadDevolucion);

  // Generar recomendaciones
  const accionesRecomendadas = generarAccionesRecomendadas(shipment, factoresRiesgo);
  const recomendacionPrioritaria = accionesRecomendadas[0]?.accion || 'Monitorear estado';

  return {
    guiaId: shipment.id,
    scoreTotal,
    nivelRiesgo,
    probabilidadDevolucion,
    probabilidadEntrega,
    factoresRiesgo,
    recomendacionPrioritaria,
    accionesRecomendadas,
    tiempoEstimadoResolucion: estimarTiempoResolucion(nivelRiesgo),
    impactoEconomico: scoreTotal >= 50 ? 'ALTO' : scoreTotal >= 25 ? 'MEDIO' : 'BAJO'
  };
};

/**
 * Genera acciones recomendadas basadas en factores de riesgo
 */
const generarAccionesRecomendadas = (
  shipment: Shipment,
  factores: FactorRiesgo[]
): AccionRecomendada[] => {
  const acciones: AccionRecomendada[] = [];

  // Si tiene teléfono, siempre recomendar contacto
  if (shipment.phone) {
    const estadoRaw = shipment.detailedInfo?.rawStatus?.toUpperCase() || '';

    if (estadoRaw.includes('NO ESTABA') || estadoRaw.includes('AUSENTE')) {
      acciones.push({
        id: 'llamar-reagendar',
        accion: 'Llamar al cliente para reagendar entrega',
        prioridad: 1,
        impactoEsperado: 'Recuperación del 80% de casos',
        tiempoEjecucion: '2-3 minutos'
      });
    }

    if (estadoRaw.includes('OFICINA') || estadoRaw.includes('RECLAM')) {
      acciones.push({
        id: 'llamar-retiro',
        accion: 'Llamar para coordinar retiro en oficina',
        prioridad: 1,
        impactoEsperado: 'Evitar devolución automática',
        tiempoEjecucion: '2-3 minutos'
      });
    }

    if (estadoRaw.includes('DIRECCIÓN') || estadoRaw.includes('NO EXISTE')) {
      acciones.push({
        id: 'confirmar-direccion',
        accion: 'Confirmar/corregir dirección con cliente',
        prioridad: 1,
        impactoEsperado: 'Corrección en 90% de casos',
        tiempoEjecucion: '3-5 minutos'
      });
    }

    // Enviar WhatsApp como alternativa
    acciones.push({
      id: 'whatsapp',
      accion: 'Enviar mensaje WhatsApp informativo',
      prioridad: 2,
      impactoEsperado: 'Preparar al cliente para entrega',
      tiempoEjecucion: '1 minuto'
    });
  }

  // Si no tiene teléfono
  if (!shipment.phone) {
    acciones.push({
      id: 'contactar-transportadora',
      accion: 'Contactar transportadora para más información',
      prioridad: 1,
      impactoEsperado: 'Obtener datos de contacto o estado actualizado',
      tiempoEjecucion: '5-10 minutos'
    });
  }

  // Siempre agregar monitoreo
  acciones.push({
    id: 'monitorear',
    accion: 'Agregar a lista de monitoreo prioritario',
    prioridad: 3,
    impactoEsperado: 'Seguimiento proactivo',
    tiempoEjecucion: 'Automático'
  });

  return acciones.sort((a, b) => a.prioridad - b.prioridad);
};

/**
 * Estima tiempo de resolución basado en nivel de riesgo
 */
const estimarTiempoResolucion = (nivel: GuiaScore['nivelRiesgo']): string => {
  switch (nivel) {
    case 'CRITICO': return '24-48 horas (acción inmediata)';
    case 'ALTO': return '2-3 días';
    case 'MEDIO': return '3-5 días';
    case 'BAJO': return '5-7 días (curso normal)';
  }
};

// =====================================
// FUNCIONES DE PREDICCIÓN
// =====================================

/**
 * Genera predicción para el día
 */
export const generarPrediccionDiaria = (
  shipments: Shipment[],
  patronesAprendidos?: PatronAprendido[]
): PrediccionDiaria => {
  const hoy = new Date();
  const diaSemana = hoy.getDay();
  const hora = hoy.getHours();

  // Filtrar guías activas (no entregadas, no devueltas)
  const guiasActivas = shipments.filter(s =>
    s.status !== ShipmentStatus.DELIVERED &&
    !s.detailedInfo?.rawStatus?.toUpperCase().includes('DEVUELTO')
  );

  // Calcular scores para todas las guías
  const scores = guiasActivas.map(s => calcularScoreGuia(s, patronesAprendidos));

  // Identificar críticas
  const guiasCriticas = scores
    .filter(s => s.nivelRiesgo === 'CRITICO' || s.nivelRiesgo === 'ALTO')
    .map(s => s.guiaId);

  // Estimar entregas basadas en histórico
  const enTransito = shipments.filter(s => s.status === ShipmentStatus.IN_TRANSIT).length;
  const tasaEntregaDiaria = diaSemana === 0 ? 0.1 : diaSemana === 6 ? 0.4 : 0.65;
  const entregasEsperadas = Math.round(enTransito * tasaEntregaDiaria);

  // Estimar novedades
  const tasaNovedadDiaria = 0.08; // 8% promedio
  const novedadesEsperadas = Math.round(guiasActivas.length * tasaNovedadDiaria);

  // Horas pico de entrega
  const horasPico = diaSemana === 0
    ? []
    : diaSemana === 6
    ? ['9:00-12:00']
    : ['10:00-12:00', '14:00-17:00'];

  // Generar recomendación
  let recomendacionGeneral = '';
  if (guiasCriticas.length > 10) {
    recomendacionGeneral = `⚠️ ALERTA: ${guiasCriticas.length} guías críticas requieren atención inmediata. Prioriza llamadas a clientes con "Reclamo en Oficina".`;
  } else if (guiasCriticas.length > 5) {
    recomendacionGeneral = `📞 ${guiasCriticas.length} guías necesitan gestión hoy. Enfócate en novedades "No estaba" para maximizar recuperación.`;
  } else if (hora < 12) {
    recomendacionGeneral = '☀️ Buen día para gestión proactiva. Envía WhatsApp de confirmación a guías en reparto.';
  } else if (hora < 18) {
    recomendacionGeneral = '📊 Revisa el progreso de entregas del día y prepara seguimiento para mañana.';
  } else {
    recomendacionGeneral = '🌙 Programa gestiones para mañana temprano. Las guías críticas detectadas ya están priorizadas.';
  }

  // Calcular confianza basada en datos disponibles
  const confianza = Math.min(95, 60 + (shipments.length / 100) * 10 + (patronesAprendidos?.length || 0) * 2);

  return {
    fecha: hoy.toISOString().split('T')[0],
    entregasEsperadas,
    novedadesEsperadas,
    guiasCriticas,
    horasPico,
    recomendacionGeneral,
    confianza: Math.round(confianza)
  };
};

// =====================================
// SISTEMA DE APRENDIZAJE
// =====================================

const STORAGE_KEY_PATRONES = 'litper_patrones_aprendidos';
const STORAGE_KEY_ACCIONES = 'litper_acciones_usuario';

/**
 * Carga patrones aprendidos del localStorage
 */
export const cargarPatronesAprendidos = (): PatronAprendido[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY_PATRONES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

/**
 * Guarda un nuevo patrón aprendido
 */
export const guardarPatron = (patron: PatronAprendido): void => {
  const patrones = cargarPatronesAprendidos();
  const idx = patrones.findIndex(p => p.id === patron.id);

  if (idx >= 0) {
    patrones[idx] = patron;
  } else {
    patrones.push(patron);
  }

  localStorage.setItem(STORAGE_KEY_PATRONES, JSON.stringify(patrones));
};

/**
 * Registra una acción del usuario para aprendizaje
 */
export const registrarAccionUsuario = (
  accion: string,
  guiaId: string,
  resultado: 'EXITO' | 'FALLO' | 'PENDIENTE'
): void => {
  try {
    const data = localStorage.getItem(STORAGE_KEY_ACCIONES);
    const acciones = data ? JSON.parse(data) : [];

    acciones.push({
      accion,
      guiaId,
      resultado,
      timestamp: new Date().toISOString(),
      hora: new Date().getHours(),
      diaSemana: new Date().getDay()
    });

    // Mantener solo últimas 1000 acciones
    if (acciones.length > 1000) {
      acciones.splice(0, acciones.length - 1000);
    }

    localStorage.setItem(STORAGE_KEY_ACCIONES, JSON.stringify(acciones));
  } catch (e) {
    console.error('Error registrando acción:', e);
  }
};

/**
 * Aprende de los datos históricos de shipments
 */
export const aprenderDeHistorico = (shipments: Shipment[]): PatronAprendido[] => {
  const patrones: PatronAprendido[] = [];

  // Aprender por transportadora
  const porTransportadora: Record<string, { total: number; exitos: number }> = {};
  shipments.forEach(s => {
    const carrier = s.carrier || 'DESCONOCIDO';
    if (!porTransportadora[carrier]) {
      porTransportadora[carrier] = { total: 0, exitos: 0 };
    }
    porTransportadora[carrier].total++;
    if (s.status === ShipmentStatus.DELIVERED) {
      porTransportadora[carrier].exitos++;
    }
  });

  Object.entries(porTransportadora).forEach(([carrier, data]) => {
    if (data.total >= 10) { // Solo si hay suficientes muestras
      patrones.push({
        id: `TRANSPORTADORA_${carrier}`,
        tipo: 'TRANSPORTADORA',
        valor: carrier,
        tasaExitoHistorica: Math.round((data.exitos / data.total) * 100),
        muestras: data.total,
        ultimaActualizacion: new Date()
      });
    }
  });

  // Aprender por ciudad
  const porCiudad: Record<string, { total: number; exitos: number }> = {};
  shipments.forEach(s => {
    const ciudad = s.detailedInfo?.destination || 'DESCONOCIDA';
    if (!porCiudad[ciudad]) {
      porCiudad[ciudad] = { total: 0, exitos: 0 };
    }
    porCiudad[ciudad].total++;
    if (s.status === ShipmentStatus.DELIVERED) {
      porCiudad[ciudad].exitos++;
    }
  });

  Object.entries(porCiudad).forEach(([ciudad, data]) => {
    if (data.total >= 5) {
      patrones.push({
        id: `CIUDAD_${ciudad}`,
        tipo: 'CIUDAD',
        valor: ciudad,
        tasaExitoHistorica: Math.round((data.exitos / data.total) * 100),
        muestras: data.total,
        ultimaActualizacion: new Date()
      });
    }
  });

  // Guardar patrones aprendidos
  patrones.forEach(guardarPatron);

  return patrones;
};

// =====================================
// FUNCIONES DE PRIORIZACIÓN
// =====================================

/**
 * Ordena guías por prioridad de gestión
 */
export const priorizarGuias = (
  shipments: Shipment[],
  patronesAprendidos?: PatronAprendido[]
): Array<Shipment & { score: GuiaScore }> => {
  const guiasConScore = shipments
    .filter(s => s.status !== ShipmentStatus.DELIVERED)
    .map(s => ({
      ...s,
      score: calcularScoreGuia(s, patronesAprendidos)
    }))
    .sort((a, b) => b.score.scoreTotal - a.score.scoreTotal);

  return guiasConScore;
};

/**
 * Obtiene las guías que necesitan acción inmediata
 */
export const obtenerGuiasUrgentes = (
  shipments: Shipment[],
  limite: number = 10
): Array<Shipment & { score: GuiaScore }> => {
  const patrones = cargarPatronesAprendidos();
  const priorizadas = priorizarGuias(shipments, patrones);

  return priorizadas
    .filter(g => g.score.nivelRiesgo === 'CRITICO' || g.score.nivelRiesgo === 'ALTO')
    .slice(0, limite);
};

export default {
  calcularScoreGuia,
  generarPrediccionDiaria,
  cargarPatronesAprendidos,
  guardarPatron,
  registrarAccionUsuario,
  aprenderDeHistorico,
  priorizarGuias,
  obtenerGuiasUrgentes
};
