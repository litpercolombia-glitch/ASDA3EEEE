// ============================================
// LITPER - GUIDE LINKING SERVICE
// Sistema de Enlace y Trazabilidad de Guías
// ============================================

import { v4 as uuidv4 } from 'uuid';
import { Shipment, CarrierName, ShipmentStatus } from '../types';
import {
  LinkedGuide,
  GuideHistoryEvent,
  NoveltyRecord,
  RiskScore,
  RiskScoreBreakdown,
  IntelligenceAlert,
  AlertSeverity,
  AlertCategory,
  AlertThresholds,
  DEFAULT_ALERT_THRESHOLDS,
  INTELLIGENCE_STORAGE_KEYS,
  COORDINADORA_STATUS_MAP,
  INTERRAPIDISIMO_STATUS_MAP,
  ENVIA_STATUS_MAP,
  GuideFilters,
  SavedView,
  DEFAULT_SAVED_VIEWS,
} from '../types/intelligenceModule';

// ============================================
// STORAGE MANAGEMENT
// ============================================

const getFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;
    return JSON.parse(stored) as T;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to storage (${key}):`, error);
  }
};

// ============================================
// LINKED GUIDES MANAGEMENT
// ============================================

/**
 * Load all linked guides from storage
 */
export const loadLinkedGuides = (): Map<string, LinkedGuide> => {
  const stored = getFromStorage<LinkedGuide[]>(INTELLIGENCE_STORAGE_KEYS.LINKED_GUIDES, []);
  const map = new Map<string, LinkedGuide>();
  stored.forEach(guide => {
    const key = `${guide.guia}_${guide.transportadora}`;
    map.set(key, guide);
  });
  return map;
};

/**
 * Save linked guides to storage
 */
export const saveLinkedGuides = (guides: Map<string, LinkedGuide>): void => {
  const array = Array.from(guides.values());
  saveToStorage(INTELLIGENCE_STORAGE_KEYS.LINKED_GUIDES, array);
};

/**
 * Create a unique key for a guide
 */
export const createGuideKey = (guia: string, transportadora: CarrierName): string => {
  return `${guia}_${transportadora}`;
};

/**
 * Link a shipment to the intelligence system, creating or updating its history
 */
export const linkGuide = (
  shipment: Shipment,
  existingGuides: Map<string, LinkedGuide>
): LinkedGuide => {
  const key = createGuideKey(shipment.id, shipment.carrier);
  const existing = existingGuides.get(key);
  const now = new Date().toISOString();

  // Create new history event from current state
  const newEvent: GuideHistoryEvent = {
    timestamp: now,
    status: shipment.status,
    carrierStatus: shipment.detailedInfo?.rawStatus || shipment.status,
    location: shipment.detailedInfo?.events?.[0]?.location,
    description: shipment.detailedInfo?.events?.[0]?.description || shipment.status,
    daysInStatus: 0,
    source: 'AUTO',
  };

  if (existing) {
    // Check if state has changed
    const lastEvent = existing.historial[0];
    const stateChanged = lastEvent?.status !== newEvent.status ||
                        lastEvent?.carrierStatus !== newEvent.carrierStatus;

    if (stateChanged) {
      // Calculate days in previous state
      if (lastEvent) {
        const lastTime = new Date(lastEvent.timestamp).getTime();
        const nowTime = new Date(now).getTime();
        lastEvent.daysInStatus = Math.floor((nowTime - lastTime) / (1000 * 60 * 60 * 24));
      }

      // Add new event at the beginning of history
      existing.historial.unshift(newEvent);
    }

    // Update guide with latest info
    const updated: LinkedGuide = {
      ...existing,
      estadoActual: shipment.status,
      fechaUltimaActualizacion: now,
      telefono: shipment.phone || existing.telefono,
      ciudadDestino: shipment.detailedInfo?.destination || existing.ciudadDestino,
      ciudadOrigen: shipment.detailedInfo?.origin || existing.ciudadOrigen,
      valorRecaudo: shipment.detailedInfo?.declaredValue || existing.valorRecaudo,
      tiempoTotalTransito: calculateTransitTime(existing.historial),
      scoreRiesgo: calculateRiskScore(existing, shipment).score,
    };

    // Check for delivery attempts
    if (isDeliveryAttempt(newEvent)) {
      updated.intentosEntrega += 1;
    }

    existingGuides.set(key, updated);
    return updated;
  }

  // Create new linked guide
  const newLinkedGuide: LinkedGuide = {
    guia: shipment.id,
    transportadora: shipment.carrier,
    historial: [newEvent],
    novedadesRegistradas: [],
    intentosEntrega: 0,
    tiempoTotalTransito: '0d 0h',
    scoreRiesgo: 0,
    estadoActual: shipment.status,
    fechaCreacion: now,
    fechaUltimaActualizacion: now,
    telefono: shipment.phone,
    ciudadDestino: shipment.detailedInfo?.destination,
    ciudadOrigen: shipment.detailedInfo?.origin,
    valorRecaudo: shipment.detailedInfo?.declaredValue,
    vertical: 'Other',
  };

  newLinkedGuide.scoreRiesgo = calculateRiskScore(newLinkedGuide, shipment).score;
  existingGuides.set(key, newLinkedGuide);

  return newLinkedGuide;
};

/**
 * Link multiple shipments (batch operation)
 */
export const linkGuides = (
  shipments: Shipment[],
  existingGuides?: Map<string, LinkedGuide>
): Map<string, LinkedGuide> => {
  const guides = existingGuides || loadLinkedGuides();

  shipments.forEach(shipment => {
    linkGuide(shipment, guides);
  });

  saveLinkedGuides(guides);
  return guides;
};

/**
 * Merge daily reports with existing linked guides
 */
export const mergeReports = (
  newShipments: Shipment[],
  existingGuides?: Map<string, LinkedGuide>
): { linkedGuides: Map<string, LinkedGuide>; newCount: number; updatedCount: number } => {
  const guides = existingGuides || loadLinkedGuides();
  let newCount = 0;
  let updatedCount = 0;

  newShipments.forEach(shipment => {
    const key = createGuideKey(shipment.id, shipment.carrier);
    const existed = guides.has(key);

    linkGuide(shipment, guides);

    if (existed) {
      updatedCount++;
    } else {
      newCount++;
    }
  });

  saveLinkedGuides(guides);
  return { linkedGuides: guides, newCount, updatedCount };
};

// ============================================
// RISK SCORING ENGINE
// ============================================

/**
 * Calculate risk score for a guide
 */
export const calculateRiskScore = (
  guide: LinkedGuide,
  shipment?: Shipment
): RiskScore => {
  const breakdown: RiskScoreBreakdown = {
    diasSinMovimiento: 0,
    intentosFallidos: 0,
    novedadAbierta: 0,
    ciudadProblematica: 0,
    transportadoraProblematica: 0,
    valorAltoRecaudo: 0,
    horasCriticas: 0,
    total: 0,
  };

  // Days without movement (+20 per day after threshold)
  const lastEvent = guide.historial[0];
  if (lastEvent) {
    const daysSinceUpdate = Math.floor(
      (Date.now() - new Date(lastEvent.timestamp).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceUpdate >= 1) {
      breakdown.diasSinMovimiento = Math.min(daysSinceUpdate * 20, 60); // Cap at 60
    }
  }

  // Failed delivery attempts (+30 per attempt)
  breakdown.intentosFallidos = Math.min(guide.intentosEntrega * 30, 90); // Cap at 90

  // Open novelty (+25)
  const openNovelties = guide.novedadesRegistradas.filter(n =>
    n.estado === 'PENDIENTE' || n.estado === 'EN_GESTION'
  );
  if (openNovelties.length > 0) {
    breakdown.novedadAbierta = 25;
  }

  // Problematic city (+15)
  const problematicCities = [
    'USME', 'BOSA', 'SOACHA', 'SUBA', 'CIUDAD BOLIVAR',
    'BUENAVENTURA', 'TUMACO', 'QUIBDO', 'ARAUCA'
  ];
  if (guide.ciudadDestino &&
      problematicCities.some(c => guide.ciudadDestino?.toUpperCase().includes(c))) {
    breakdown.ciudadProblematica = 15;
  }

  // Problematic carrier (based on status)
  const status = shipment?.detailedInfo?.rawStatus?.toUpperCase() || '';
  if (status.includes('SINIESTRO') || status.includes('INVESTIGACION') || status.includes('PERDIDO')) {
    breakdown.transportadoraProblematica = 10;
  }

  // High collection value (+5 if > 500k)
  if (guide.valorRecaudo && guide.valorRecaudo > 500000) {
    breakdown.valorAltoRecaudo = 5;
  }

  // Critical hours (Friday afternoon)
  const now = new Date();
  const isFriday = now.getDay() === 5;
  const isAfternoon = now.getHours() >= 14;
  if (isFriday && isAfternoon && guide.estadoActual !== ShipmentStatus.DELIVERED) {
    breakdown.horasCriticas = 10;
  }

  // Calculate total
  breakdown.total =
    breakdown.diasSinMovimiento +
    breakdown.intentosFallidos +
    breakdown.novedadAbierta +
    breakdown.ciudadProblematica +
    breakdown.transportadoraProblematica +
    breakdown.valorAltoRecaudo +
    breakdown.horasCriticas;

  // Determine risk level
  let level: 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  if (breakdown.total >= 80) {
    level = 'CRITICO';
  } else if (breakdown.total >= 60) {
    level = 'ALTO';
  } else if (breakdown.total >= 40) {
    level = 'MEDIO';
  } else {
    level = 'BAJO';
  }

  return {
    score: Math.min(breakdown.total, 100),
    level,
    breakdown,
    lastCalculated: new Date().toISOString(),
  };
};

/**
 * Recalculate risk scores for all guides
 */
export const recalculateAllRiskScores = (
  guides: Map<string, LinkedGuide>
): Map<string, LinkedGuide> => {
  guides.forEach((guide, key) => {
    const riskScore = calculateRiskScore(guide);
    guide.scoreRiesgo = riskScore.score;
    guides.set(key, guide);
  });

  saveLinkedGuides(guides);
  return guides;
};

// ============================================
// ALERT ENGINE
// ============================================

/**
 * Generate alerts for a guide based on thresholds
 */
export const generateAlertsForGuide = (
  guide: LinkedGuide,
  thresholds: AlertThresholds = DEFAULT_ALERT_THRESHOLDS
): IntelligenceAlert[] => {
  const alerts: IntelligenceAlert[] = [];
  const now = new Date().toISOString();

  // Calculate days since last update
  const lastEvent = guide.historial[0];
  const daysSinceUpdate = lastEvent
    ? Math.floor((Date.now() - new Date(lastEvent.timestamp).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Check for no movement
  if (daysSinceUpdate >= thresholds.diasSinMovimientoAlerta) {
    alerts.push({
      id: uuidv4(),
      guia: guide.guia,
      severity: daysSinceUpdate >= 5 ? 'CRITICAL' : 'WARNING',
      category: 'SIN_MOVIMIENTO',
      title: 'Sin movimiento',
      description: `La guía lleva ${daysSinceUpdate} días sin actualización`,
      suggestedAction: 'Verificar estado real con transportadora',
      createdAt: now,
      isResolved: false,
      scoreImpact: daysSinceUpdate * 20,
    });
  }

  // Check for pending pickup (GUIA_GENERADA > 48h)
  if (guide.estadoActual === ShipmentStatus.PENDING) {
    const createdTime = new Date(guide.fechaCreacion).getTime();
    const hoursSinceCreated = (Date.now() - createdTime) / (1000 * 60 * 60);

    if (hoursSinceCreated >= 48) {
      alerts.push({
        id: uuidv4(),
        guia: guide.guia,
        severity: 'CRITICAL',
        category: 'RECOLECCION_PENDIENTE',
        title: 'Recolección pendiente',
        description: `La guía fue generada hace más de ${Math.floor(hoursSinceCreated)}h sin recolección`,
        suggestedAction: 'Verificar pickup con transportadora',
        createdAt: now,
        isResolved: false,
        scoreImpact: 30,
      });
    }
  }

  // Check for unresolved novelties
  const openNovelties = guide.novedadesRegistradas.filter(n =>
    n.estado === 'PENDIENTE' || n.estado === 'EN_GESTION'
  );

  openNovelties.forEach(novelty => {
    const novedadTime = new Date(novelty.fechaRegistro).getTime();
    const hoursSinceNovedad = (Date.now() - novedadTime) / (1000 * 60 * 60);

    if (hoursSinceNovedad >= thresholds.horasNovedadSinResolver) {
      alerts.push({
        id: uuidv4(),
        guia: guide.guia,
        severity: 'CRITICAL',
        category: 'NOVEDAD_SIN_RESOLVER',
        title: 'Novedad sin resolver',
        description: `Novedad "${novelty.tipo}" sin resolver hace ${Math.floor(hoursSinceNovedad)}h`,
        suggestedAction: 'Contactar cliente para resolver novedad',
        createdAt: now,
        isResolved: false,
        scoreImpact: 25,
      });
    }
  });

  // Check for failed delivery attempts
  if (guide.intentosEntrega >= 2) {
    alerts.push({
      id: uuidv4(),
      guia: guide.guia,
      severity: guide.intentosEntrega >= thresholds.intentosMaximosAntesDevolucion ? 'CRITICAL' : 'WARNING',
      category: 'INTENTOS_FALLIDOS',
      title: 'Múltiples intentos fallidos',
      description: `${guide.intentosEntrega} intentos de entrega fallidos`,
      suggestedAction: guide.intentosEntrega >= 3
        ? 'Gestión urgente - próximo a devolución'
        : 'Contactar cliente para coordinar entrega',
      createdAt: now,
      isResolved: false,
      scoreImpact: guide.intentosEntrega * 30,
    });
  }

  // Check for red zone (uncovered area)
  const redZones = ['FINCA', 'VEREDA', 'CORREGIMIENTO', 'ZONA RURAL'];
  const destination = guide.ciudadDestino?.toUpperCase() || '';
  const status = guide.historial[0]?.carrierStatus?.toUpperCase() || '';

  if (redZones.some(z => destination.includes(z) || status.includes(z)) ||
      status.includes('NO SE CUBRE') || status.includes('ZONA ROJA')) {
    alerts.push({
      id: uuidv4(),
      guia: guide.guia,
      severity: 'CRITICAL',
      category: 'ZONA_ROJA',
      title: 'Zona no cubierta',
      description: 'Destino en zona roja o no cubierta por la transportadora',
      suggestedAction: 'Ofrecer alternativa al cliente (punto de recogida más cercano)',
      createdAt: now,
      isResolved: false,
      scoreImpact: 25,
    });
  }

  // Check for Punto Droop
  if (status.includes('PUNTO DROOP') || status.includes('RECLAME EN OFICINA') ||
      status.includes('DISPONIBLE PARA RETIRO')) {
    alerts.push({
      id: uuidv4(),
      guia: guide.guia,
      severity: 'CRITICAL',
      category: 'PUNTO_DROOP',
      title: 'Paquete en oficina',
      description: 'El paquete está disponible para retiro en oficina de la transportadora',
      suggestedAction: 'Notificar al cliente la dirección y horario de la oficina',
      createdAt: now,
      isResolved: false,
      scoreImpact: 20,
    });
  }

  return alerts;
};

/**
 * Generate alerts for all guides
 */
export const generateAllAlerts = (
  guides: Map<string, LinkedGuide>,
  thresholds?: AlertThresholds
): IntelligenceAlert[] => {
  const allAlerts: IntelligenceAlert[] = [];
  const th = thresholds || DEFAULT_ALERT_THRESHOLDS;

  guides.forEach(guide => {
    if (guide.estadoActual !== ShipmentStatus.DELIVERED) {
      const guideAlerts = generateAlertsForGuide(guide, th);
      allAlerts.push(...guideAlerts);
    }
  });

  // Sort by severity
  const severityOrder: Record<AlertSeverity, number> = {
    'CRITICAL': 0,
    'WARNING': 1,
    'INFO': 2,
  };

  allAlerts.sort((a, b) =>
    severityOrder[a.severity] - severityOrder[b.severity] ||
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  saveToStorage(INTELLIGENCE_STORAGE_KEYS.ALERTS, allAlerts);
  return allAlerts;
};

/**
 * Get critical alerts (severity = CRITICAL)
 */
export const getCriticalAlerts = (
  guides?: Map<string, LinkedGuide>
): IntelligenceAlert[] => {
  const g = guides || loadLinkedGuides();
  const allAlerts = generateAllAlerts(g);
  return allAlerts.filter(a => a.severity === 'CRITICAL');
};

/**
 * Get warning alerts (severity = WARNING)
 */
export const getWarningAlerts = (
  guides?: Map<string, LinkedGuide>
): IntelligenceAlert[] => {
  const g = guides || loadLinkedGuides();
  const allAlerts = generateAllAlerts(g);
  return allAlerts.filter(a => a.severity === 'WARNING');
};

// ============================================
// NOVELTY MANAGEMENT
// ============================================

/**
 * Register a novelty for a guide
 */
export const registerNovelty = (
  guideKey: string,
  noveltyType: string,
  description: string,
  guides?: Map<string, LinkedGuide>
): LinkedGuide | null => {
  const g = guides || loadLinkedGuides();
  const guide = g.get(guideKey);

  if (!guide) return null;

  const novelty: NoveltyRecord = {
    id: uuidv4(),
    tipo: noveltyType,
    descripcion: description,
    fechaRegistro: new Date().toISOString(),
    estado: 'PENDIENTE',
  };

  guide.novedadesRegistradas.unshift(novelty);
  guide.scoreRiesgo = calculateRiskScore(guide).score;
  guide.fechaUltimaActualizacion = new Date().toISOString();

  g.set(guideKey, guide);
  saveLinkedGuides(g);

  return guide;
};

/**
 * Resolve a novelty
 */
export const resolveNovelty = (
  guideKey: string,
  noveltyId: string,
  solution: string,
  agente?: string,
  guides?: Map<string, LinkedGuide>
): LinkedGuide | null => {
  const g = guides || loadLinkedGuides();
  const guide = g.get(guideKey);

  if (!guide) return null;

  const novelty = guide.novedadesRegistradas.find(n => n.id === noveltyId);
  if (novelty) {
    novelty.estado = 'RESUELTA';
    novelty.fechaResolucion = new Date().toISOString();
    novelty.solucionAplicada = solution;
    novelty.agente = agente;
  }

  guide.scoreRiesgo = calculateRiskScore(guide).score;
  guide.fechaUltimaActualizacion = new Date().toISOString();

  g.set(guideKey, guide);
  saveLinkedGuides(g);

  return guide;
};

// ============================================
// FILTER SYSTEM
// ============================================

/**
 * Filter guides based on criteria
 */
export const filterGuides = (
  guides: Map<string, LinkedGuide>,
  filters: GuideFilters
): LinkedGuide[] => {
  let results = Array.from(guides.values());

  // Filter by estados
  if (filters.estados && filters.estados.length > 0) {
    results = results.filter(g => filters.estados.includes(g.estadoActual));
  }

  // Filter by transportadoras
  if (filters.transportadoras && filters.transportadoras.length > 0) {
    results = results.filter(g => filters.transportadoras.includes(g.transportadora));
  }

  // Filter by date range
  if (filters.fechaInicio) {
    const startDate = new Date(filters.fechaInicio).getTime();
    results = results.filter(g => new Date(g.fechaCreacion).getTime() >= startDate);
  }

  if (filters.fechaFin) {
    const endDate = new Date(filters.fechaFin).getTime();
    results = results.filter(g => new Date(g.fechaCreacion).getTime() <= endDate);
  }

  // Filter by ciudad destino
  if (filters.ciudadDestino) {
    const dest = filters.ciudadDestino.toUpperCase();
    results = results.filter(g => g.ciudadDestino?.toUpperCase().includes(dest));
  }

  // Filter by ciudad origen
  if (filters.ciudadOrigen) {
    const orig = filters.ciudadOrigen.toUpperCase();
    results = results.filter(g => g.ciudadOrigen?.toUpperCase().includes(orig));
  }

  // Filter by novelty presence
  if (filters.tieneNovedad !== undefined) {
    results = results.filter(g => {
      const hasOpenNovelty = g.novedadesRegistradas.some(
        n => n.estado === 'PENDIENTE' || n.estado === 'EN_GESTION'
      );
      return filters.tieneNovedad ? hasOpenNovelty : !hasOpenNovelty;
    });
  }

  // Filter by guide number
  if (filters.numeroGuia) {
    results = results.filter(g => g.guia.includes(filters.numeroGuia!));
  }

  // Filter by days without movement
  if (filters.diasSinMovimiento) {
    results = results.filter(g => {
      const lastEvent = g.historial[0];
      if (!lastEvent) return false;
      const daysSince = Math.floor(
        (Date.now() - new Date(lastEvent.timestamp).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSince >= filters.diasSinMovimiento!.min &&
             daysSince <= filters.diasSinMovimiento!.max;
    });
  }

  // Filter by risk score
  if (filters.scoreRiesgo) {
    results = results.filter(g =>
      g.scoreRiesgo >= filters.scoreRiesgo!.min &&
      g.scoreRiesgo <= filters.scoreRiesgo!.max
    );
  }

  // Filter by delivery attempts
  if (filters.intentosEntrega && filters.intentosEntrega.length > 0) {
    results = results.filter(g => filters.intentosEntrega!.includes(g.intentosEntrega));
  }

  // Filter by collection value range
  if (filters.rangoRecaudo) {
    results = results.filter(g => {
      const value = g.valorRecaudo || 0;
      return value >= filters.rangoRecaudo!.min && value <= filters.rangoRecaudo!.max;
    });
  }

  // Quick filters
  if (filters.soloUrgentes) {
    results = results.filter(g => g.scoreRiesgo >= 80);
  }

  if (filters.soloPuntoDropo) {
    results = results.filter(g => {
      const status = g.historial[0]?.carrierStatus?.toUpperCase() || '';
      return status.includes('PUNTO DROOP') || status.includes('RECLAME EN OFICINA');
    });
  }

  if (filters.soloRiesgoDevolucion) {
    results = results.filter(g => g.intentosEntrega >= 2);
  }

  // Sort by risk score (highest first)
  results.sort((a, b) => b.scoreRiesgo - a.scoreRiesgo);

  return results;
};

// ============================================
// SAVED VIEWS MANAGEMENT
// ============================================

/**
 * Load saved views
 */
export const loadSavedViews = (): SavedView[] => {
  const custom = getFromStorage<SavedView[]>(INTELLIGENCE_STORAGE_KEYS.SAVED_VIEWS, []);
  return [...DEFAULT_SAVED_VIEWS, ...custom];
};

/**
 * Save a custom view
 */
export const saveCustomView = (view: Omit<SavedView, 'id' | 'createdAt' | 'isSystem'>): SavedView => {
  const newView: SavedView = {
    ...view,
    id: uuidv4(),
    isSystem: false,
    createdAt: new Date().toISOString(),
  };

  const existing = getFromStorage<SavedView[]>(INTELLIGENCE_STORAGE_KEYS.SAVED_VIEWS, []);
  existing.push(newView);
  saveToStorage(INTELLIGENCE_STORAGE_KEYS.SAVED_VIEWS, existing);

  return newView;
};

/**
 * Delete a custom view
 */
export const deleteCustomView = (viewId: string): boolean => {
  const existing = getFromStorage<SavedView[]>(INTELLIGENCE_STORAGE_KEYS.SAVED_VIEWS, []);
  const filtered = existing.filter(v => v.id !== viewId);

  if (filtered.length !== existing.length) {
    saveToStorage(INTELLIGENCE_STORAGE_KEYS.SAVED_VIEWS, filtered);
    return true;
  }

  return false;
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calculate transit time from history
 */
const calculateTransitTime = (history: GuideHistoryEvent[]): string => {
  if (history.length < 1) return '0d 0h';

  const first = history[history.length - 1];
  const last = history[0];

  const start = new Date(first.timestamp).getTime();
  const end = new Date(last.timestamp).getTime();
  const diff = end - start;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return `${days}d ${hours}h`;
};

/**
 * Check if an event represents a delivery attempt
 */
const isDeliveryAttempt = (event: GuideHistoryEvent): boolean => {
  const status = (event.carrierStatus || '').toUpperCase();
  const keywords = [
    'INTENTO DE ENTREGA',
    'NO SE LOGRA',
    'NO CONTESTA',
    'NO CANCELA',
    'RECHAZADO',
    'NO RECIBE',
    'DIRECCION',
    'NO CONOCEN',
    'CERRADO',
    'FALLIDO',
  ];

  return keywords.some(k => status.includes(k));
};

/**
 * Get carrier status information
 */
export const getCarrierStatusInfo = (
  carrier: CarrierName,
  status: string
): { meaning: string; expectedDays: number; alertAfterDays: number } | null => {
  const normalizedStatus = status.toUpperCase().replace(/\s+/g, '_');

  switch (carrier) {
    case CarrierName.COORDINADORA: {
      const info = Object.values(COORDINADORA_STATUS_MAP).find(
        s => s.carrierStatus.toUpperCase().replace(/\s+/g, '_').includes(normalizedStatus) ||
             s.dropiStatus.toUpperCase().replace(/\s+/g, '_').includes(normalizedStatus)
      );
      return info ? {
        meaning: info.meaning,
        expectedDays: info.expectedDays,
        alertAfterDays: info.alertAfterDays,
      } : null;
    }

    case CarrierName.INTER_RAPIDISIMO: {
      const info = Object.values(INTERRAPIDISIMO_STATUS_MAP).find(
        s => s.carrierStatus.toUpperCase().replace(/\s+/g, '_').includes(normalizedStatus) ||
             s.dropiStatus.toUpperCase().replace(/\s+/g, '_').includes(normalizedStatus)
      );
      return info ? {
        meaning: info.meaning,
        expectedDays: info.expectedDays,
        alertAfterDays: info.alertAfterDays,
      } : null;
    }

    case CarrierName.ENVIA: {
      const info = Object.values(ENVIA_STATUS_MAP).find(
        s => s.carrierStatus.toUpperCase().replace(/\s+/g, '_').includes(normalizedStatus) ||
             s.dropiStatus.toUpperCase().replace(/\s+/g, '_').includes(normalizedStatus)
      );
      return info ? {
        meaning: info.meaning,
        expectedDays: info.expectedDays,
        alertAfterDays: info.alertAfterDays,
      } : null;
    }

    default:
      return null;
  }
};

/**
 * Get guides at risk (score >= threshold)
 */
export const getGuidesAtRisk = (
  guides?: Map<string, LinkedGuide>,
  threshold: number = 70
): LinkedGuide[] => {
  const g = guides || loadLinkedGuides();
  return Array.from(g.values())
    .filter(guide =>
      guide.scoreRiesgo >= threshold &&
      guide.estadoActual !== ShipmentStatus.DELIVERED
    )
    .sort((a, b) => b.scoreRiesgo - a.scoreRiesgo);
};

/**
 * Get guides without movement for X days
 */
export const getGuidesWithoutMovement = (
  guides?: Map<string, LinkedGuide>,
  minDays: number = 3
): LinkedGuide[] => {
  const g = guides || loadLinkedGuides();
  return Array.from(g.values())
    .filter(guide => {
      if (guide.estadoActual === ShipmentStatus.DELIVERED) return false;

      const lastEvent = guide.historial[0];
      if (!lastEvent) return true;

      const daysSince = Math.floor(
        (Date.now() - new Date(lastEvent.timestamp).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSince >= minDays;
    })
    .sort((a, b) => {
      const daysA = a.historial[0]
        ? Math.floor((Date.now() - new Date(a.historial[0].timestamp).getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      const daysB = b.historial[0]
        ? Math.floor((Date.now() - new Date(b.historial[0].timestamp).getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      return daysB - daysA;
    });
};

/**
 * Get statistics summary
 */
export const getGuidesSummary = (guides?: Map<string, LinkedGuide>): {
  total: number;
  atRisk: number;
  pendingNovelties: number;
  delivered: number;
  inTransit: number;
  averageScore: number;
  criticalAlerts: number;
} => {
  const g = guides || loadLinkedGuides();
  const all = Array.from(g.values());

  const atRisk = all.filter(guide => guide.scoreRiesgo >= 70).length;
  const pendingNovelties = all.filter(guide =>
    guide.novedadesRegistradas.some(n => n.estado === 'PENDIENTE' || n.estado === 'EN_GESTION')
  ).length;
  const delivered = all.filter(guide => guide.estadoActual === ShipmentStatus.DELIVERED).length;
  const inTransit = all.filter(guide =>
    guide.estadoActual === ShipmentStatus.IN_TRANSIT ||
    guide.estadoActual === ShipmentStatus.PENDING
  ).length;

  const totalScore = all.reduce((sum, g) => sum + g.scoreRiesgo, 0);
  const averageScore = all.length > 0 ? Math.round(totalScore / all.length) : 0;

  const criticalAlerts = getCriticalAlerts(g).length;

  return {
    total: all.length,
    atRisk,
    pendingNovelties,
    delivered,
    inTransit,
    averageScore,
    criticalAlerts,
  };
};
