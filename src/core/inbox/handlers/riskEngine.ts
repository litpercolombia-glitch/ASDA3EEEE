// /src/core/inbox/handlers/riskEngine.ts
// Motor de cálculo de riesgo para órdenes

import type { InboxEvent } from '../types';

/**
 * Ciudades con historial de alto riesgo
 * TODO: Mover a configuración o tabla dinámica
 */
const HIGH_RISK_CITIES: Record<string, number> = {
  // Colombia - Ciudades con mayor índice de rechazos/devoluciones
  'SOACHA': 25,
  'BOSA': 20,
  'KENNEDY': 18,
  'CIUDAD BOLIVAR': 22,
  'USME': 20,
  'SAN CRISTOBAL': 18,
  'RAFAEL URIBE': 17,
  'TUNJUELITO': 16,
  'FONTIBON': 12,
  'ENGATIVA': 10,
  // Ciudades fuera de área metropolitana
  'TUMACO': 30,
  'QUIBDO': 28,
  'BUENAVENTURA': 25,
  'FLORENCIA': 22,
  'MOCOA': 25,
  'PUERTO ASIS': 28,
  'LETICIA': 30,
  'MITU': 35,
  'INIRIDA': 35,
};

/**
 * Transportadoras y su factor de riesgo base
 */
const CARRIER_RISK_FACTOR: Record<string, number> = {
  'SERVIENTREGA': 5,
  'ENVIA': 8,
  'INTERRAPIDISIMO': 10,
  'COORDINADORA': 6,
  'TCC': 7,
  'DEPRISA': 9,
  '472': 12,
  'SAFERBO': 15,
};

/**
 * Estados que indican riesgo
 */
const RISKY_STATUSES: Record<string, number> = {
  'NOVEDAD': 15,
  'RETENIDO': 20,
  'EN_GESTION': 10,
  'INTENTO_FALLIDO': 25,
  'DIRECCION_ERRADA': 30,
  'CLIENTE_NO_RECIBE': 35,
  'ZONA_DIFICIL': 25,
};

/**
 * Calcula el score de riesgo de una orden (0-100)
 */
export function calculateRiskScore(event: InboxEvent): number {
  let score = 0;
  const { data } = event;

  // 1. Riesgo por ciudad
  if (data.city) {
    const cityUpper = data.city.toUpperCase().trim();
    score += HIGH_RISK_CITIES[cityUpper] ?? 0;

    // Ciudades desconocidas tienen riesgo moderado
    if (!Object.keys(HIGH_RISK_CITIES).some(c => cityUpper.includes(c))) {
      // Si no está en lista conocida, agregar pequeño riesgo
      score += 5;
    }
  }

  // 2. Riesgo por transportadora
  if (data.shippingCompany) {
    const carrierUpper = data.shippingCompany.toUpperCase();
    for (const [carrier, risk] of Object.entries(CARRIER_RISK_FACTOR)) {
      if (carrierUpper.includes(carrier)) {
        score += risk;
        break;
      }
    }
  }

  // 3. Riesgo por estado actual
  if (data.status) {
    const statusUpper = data.status.toUpperCase().replace(/[_\s-]/g, '_');
    score += RISKY_STATUSES[statusUpper] ?? 0;
  }

  // 4. Riesgo por monto (COD alto = más riesgo de rechazo)
  if (data.total) {
    if (data.total > 500000) score += 15; // > 500K COP
    else if (data.total > 300000) score += 10;
    else if (data.total > 150000) score += 5;
  }

  // 5. Riesgo por tipo de tarifa
  if (data.rateType) {
    const rateUpper = data.rateType.toUpperCase();
    if (rateUpper.includes('CONTRAENTREGA') || rateUpper.includes('COD')) {
      score += 10; // COD tiene más riesgo
    }
  }

  // 6. Riesgo por datos incompletos
  if (!data.customer.phone) score += 15;
  if (!data.customer.address) score += 10;
  if (!data.customer.name) score += 5;

  // 7. Riesgo por zona rural o especial
  if (data.state) {
    const stateUpper = data.state.toUpperCase();
    const ruralStates = ['AMAZONAS', 'VAUPES', 'GUAINIA', 'VICHADA', 'GUAVIARE'];
    if (ruralStates.some(s => stateUpper.includes(s))) {
      score += 20;
    }
  }

  // Normalizar a 0-100
  return Math.min(100, Math.max(0, score));
}

/**
 * Detecta factores de riesgo específicos
 */
export function detectRiskFactors(event: InboxEvent): string[] {
  const factors: string[] = [];
  const { data } = event;

  // Ciudad de alto riesgo
  if (data.city) {
    const cityUpper = data.city.toUpperCase().trim();
    if (HIGH_RISK_CITIES[cityUpper]) {
      factors.push(`high_risk_city:${data.city}`);
    }
  }

  // Sin teléfono
  if (!data.customer.phone) {
    factors.push('missing_phone');
  }

  // Sin dirección completa
  if (!data.customer.address || data.customer.address.length < 10) {
    factors.push('incomplete_address');
  }

  // COD alto
  if (data.total && data.total > 300000) {
    factors.push('high_cod_value');
  }

  // Estado problemático
  if (data.status) {
    const statusUpper = data.status.toUpperCase();
    if (RISKY_STATUSES[statusUpper]) {
      factors.push(`risky_status:${data.status}`);
    }
  }

  // Transportadora con historial
  if (data.shippingCompany) {
    const carrierUpper = data.shippingCompany.toUpperCase();
    const riskyCarrier = Object.keys(CARRIER_RISK_FACTOR).find(
      c => carrierUpper.includes(c) && CARRIER_RISK_FACTOR[c] >= 10
    );
    if (riskyCarrier) {
      factors.push(`carrier_risk:${data.shippingCompany}`);
    }
  }

  // Zona rural
  if (data.state) {
    const stateUpper = data.state.toUpperCase();
    const ruralStates = ['AMAZONAS', 'VAUPES', 'GUAINIA', 'VICHADA', 'GUAVIARE'];
    if (ruralStates.some(s => stateUpper.includes(s))) {
      factors.push('rural_zone');
    }
  }

  // Sin guía asignada después de cierto tiempo
  if (!data.shippingGuide && data.status !== 'PENDIENTE') {
    factors.push('no_tracking_guide');
  }

  return factors;
}

/**
 * Obtiene recomendación basada en el riesgo
 */
export function getRiskRecommendation(score: number, factors: string[]): string {
  if (score >= 80) {
    return 'ALTO_RIESGO: Considerar llamada de confirmación antes de envío';
  }
  if (score >= 60) {
    return 'RIESGO_MODERADO: Monitorear de cerca, preparar plan B de entrega';
  }
  if (score >= 40) {
    return 'RIESGO_BAJO: Seguimiento estándar con alertas automáticas';
  }
  return 'RIESGO_MINIMO: Proceso normal de entrega';
}

/**
 * Calcula si una orden debería ser flaggeada para revisión manual
 */
export function shouldFlagForReview(score: number, factors: string[]): boolean {
  // Flag automático si score >= 70
  if (score >= 70) return true;

  // Flag si tiene múltiples factores de riesgo
  if (factors.length >= 3) return true;

  // Flag si tiene factores críticos específicos
  const criticalFactors = ['missing_phone', 'incomplete_address', 'high_cod_value'];
  const hasCritical = factors.some(f => criticalFactors.includes(f));
  if (hasCritical && score >= 50) return true;

  return false;
}
