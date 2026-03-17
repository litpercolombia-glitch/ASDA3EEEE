// services/slaService.ts
// SLA Monitoring - tracks carrier delivery performance against commitments

import { Shipment, CarrierName } from '../types';

// ============================================
// SLA DEFINITIONS PER CARRIER (business days)
// ============================================
export const CARRIER_SLA: Record<string, { standardDays: number; expressDays: number; name: string }> = {
  'COORDINADORA': { standardDays: 3, expressDays: 1, name: 'Coordinadora' },
  'SERVIENTREGA': { standardDays: 3, expressDays: 1, name: 'Servientrega' },
  'ENVIA': { standardDays: 4, expressDays: 2, name: 'Envía' },
  'INTER_RAPIDISIMO': { standardDays: 3, expressDays: 1, name: 'Inter Rapidísimo' },
  'TCC': { standardDays: 5, expressDays: 2, name: 'TCC' },
};

// ============================================
// TYPES
// ============================================
export interface SLAStatus {
  carrier: string;
  carrierName: string;
  totalShipments: number;
  onTime: number;
  atRisk: number;  // within 1 day of SLA breach
  breached: number;
  complianceRate: number; // percentage 0-100
  avgDeliveryDays: number;
  slaTarget: number;
}

export interface ShipmentSLAInfo {
  shipmentId: string;
  trackingNumber: string;
  carrier: string;
  daysInTransit: number;
  slaTarget: number;
  status: 'on_track' | 'at_risk' | 'breached';
  daysRemaining: number;
}

// ============================================
// INTERNAL HELPERS
// ============================================

/**
 * Normalize carrier name from Shipment's CarrierName enum to a CARRIER_SLA key.
 * The enum values are display names like 'Coordinadora', 'Envía', etc.
 */
function normalizeCarrierKey(carrier: CarrierName | string): string {
  const carrierStr = String(carrier).toUpperCase().trim();

  // Direct key match
  if (CARRIER_SLA[carrierStr]) return carrierStr;

  // Map known display names to keys
  const displayToKey: Record<string, string> = {
    'COORDINADORA': 'COORDINADORA',
    'SERVIENTREGA': 'SERVIENTREGA',
    'ENVÍA': 'ENVIA',
    'ENVIA': 'ENVIA',
    'INTER RAPIDÍSIMO': 'INTER_RAPIDISIMO',
    'INTER RAPIDISIMO': 'INTER_RAPIDISIMO',
    'INTERRAPIDISIMO': 'INTER_RAPIDISIMO',
    'TCC': 'TCC',
  };

  // Try normalized match
  const normalized = carrierStr
    .replace(/[áàâä]/gi, 'A')
    .replace(/[éèêë]/gi, 'E')
    .replace(/[íìîï]/gi, 'I')
    .replace(/[óòôö]/gi, 'O')
    .replace(/[úùûü]/gi, 'U')
    .replace(/\s+/g, ' ')
    .trim();

  for (const [key, value] of Object.entries(displayToKey)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }

  return carrierStr;
}

/**
 * Get the SLA target days for a carrier.
 * Defaults to standard shipping. Falls back to 4 days if carrier unknown.
 */
function getSLATarget(carrier: CarrierName | string): number {
  const key = normalizeCarrierKey(carrier);
  const sla = CARRIER_SLA[key];
  return sla ? sla.standardDays : 4; // Default 4 days for unknown carriers
}

/**
 * Get days in transit for a shipment.
 * Uses detailedInfo.daysInTransit if available, otherwise calculates from dateKey.
 */
function getDaysInTransit(shipment: Shipment): number {
  // Use detailed info if available
  if (shipment.detailedInfo?.daysInTransit !== undefined && shipment.detailedInfo.daysInTransit >= 0) {
    return shipment.detailedInfo.daysInTransit;
  }

  // Calculate from dateKey (ISO date string)
  if (shipment.dateKey) {
    const created = new Date(shipment.dateKey);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  return 0;
}

/**
 * Check if a shipment is still active (not delivered).
 */
function isActiveShipment(shipment: Shipment): boolean {
  const status = String(shipment.status).toUpperCase();
  return !status.includes('ENTREGADO') && !status.includes('DELIVERED');
}

/**
 * Determine SLA status for a single shipment.
 */
function classifyShipmentSLA(
  daysInTransit: number,
  slaTarget: number
): 'on_track' | 'at_risk' | 'breached' {
  if (daysInTransit > slaTarget) return 'breached';
  if (daysInTransit >= slaTarget - 1) return 'at_risk';
  return 'on_track';
}

/**
 * Get the display name for a carrier key.
 */
function getCarrierDisplayName(carrierKey: string): string {
  const sla = CARRIER_SLA[carrierKey];
  return sla ? sla.name : carrierKey;
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Calculate SLA status for all carriers.
 * Returns an array of SLAStatus objects, one per carrier found in the shipments.
 */
export function calculateSLADashboard(shipments: Shipment[]): SLAStatus[] {
  // Group shipments by normalized carrier key
  const carrierGroups = new Map<string, Shipment[]>();

  shipments.forEach((shipment) => {
    const key = normalizeCarrierKey(shipment.carrier);
    if (!carrierGroups.has(key)) {
      carrierGroups.set(key, []);
    }
    carrierGroups.get(key)!.push(shipment);
  });

  const results: SLAStatus[] = [];

  carrierGroups.forEach((carrierShipments, carrierKey) => {
    const slaTarget = getSLATarget(carrierKey);
    let onTime = 0;
    let atRisk = 0;
    let breached = 0;
    let totalDays = 0;
    let deliveredCount = 0;

    carrierShipments.forEach((shipment) => {
      const days = getDaysInTransit(shipment);
      totalDays += days;

      if (!isActiveShipment(shipment)) {
        // Delivered shipment: check if it was delivered within SLA
        deliveredCount++;
        if (days <= slaTarget) {
          onTime++;
        } else {
          breached++;
        }
      } else {
        // Active shipment: classify current status
        const classification = classifyShipmentSLA(days, slaTarget);
        switch (classification) {
          case 'on_track':
            onTime++;
            break;
          case 'at_risk':
            atRisk++;
            break;
          case 'breached':
            breached++;
            break;
        }
      }
    });

    const total = carrierShipments.length;
    const complianceRate = total > 0 ? Math.round((onTime / total) * 10000) / 100 : 100;
    const avgDeliveryDays = total > 0 ? Math.round((totalDays / total) * 10) / 10 : 0;

    results.push({
      carrier: carrierKey,
      carrierName: getCarrierDisplayName(carrierKey),
      totalShipments: total,
      onTime,
      atRisk,
      breached,
      complianceRate,
      avgDeliveryDays,
      slaTarget,
    });
  });

  // Sort by compliance rate ascending (worst first)
  results.sort((a, b) => a.complianceRate - b.complianceRate);

  return results;
}

/**
 * Get SLA info for individual shipments that are at risk or breached.
 * Only returns active (non-delivered) shipments.
 */
export function getShipmentsAtRisk(shipments: Shipment[]): ShipmentSLAInfo[] {
  const atRiskShipments: ShipmentSLAInfo[] = [];

  shipments.forEach((shipment) => {
    // Only consider active shipments
    if (!isActiveShipment(shipment)) return;

    const carrierKey = normalizeCarrierKey(shipment.carrier);
    const slaTarget = getSLATarget(carrierKey);
    const daysInTransit = getDaysInTransit(shipment);
    const classification = classifyShipmentSLA(daysInTransit, slaTarget);

    if (classification === 'at_risk' || classification === 'breached') {
      atRiskShipments.push({
        shipmentId: shipment.id,
        trackingNumber: shipment.id,
        carrier: carrierKey,
        daysInTransit,
        slaTarget,
        status: classification,
        daysRemaining: slaTarget - daysInTransit,
      });
    }
  });

  // Sort: breached first, then by most days over SLA
  atRiskShipments.sort((a, b) => {
    if (a.status === 'breached' && b.status !== 'breached') return -1;
    if (a.status !== 'breached' && b.status === 'breached') return 1;
    return a.daysRemaining - b.daysRemaining; // Most negative (worst) first
  });

  return atRiskShipments;
}

/**
 * Get overall SLA compliance percentage across all carriers.
 * Returns a value between 0 and 100.
 */
export function getOverallCompliance(shipments: Shipment[]): number {
  if (shipments.length === 0) return 100;

  let compliant = 0;

  shipments.forEach((shipment) => {
    const slaTarget = getSLATarget(shipment.carrier);
    const daysInTransit = getDaysInTransit(shipment);

    if (!isActiveShipment(shipment)) {
      // Delivered: compliant if delivered within SLA
      if (daysInTransit <= slaTarget) {
        compliant++;
      }
    } else {
      // Active: compliant if not yet breached
      if (daysInTransit <= slaTarget) {
        compliant++;
      }
    }
  });

  return Math.round((compliant / shipments.length) * 10000) / 100;
}
