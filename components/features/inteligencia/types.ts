/**
 * TIPOS DEL MODULO DE INTELIGENCIA
 */

import { Shipment } from '../../../types';

// ============================================
// METRICAS
// ============================================

export interface IntelligenceMetrics {
  totalShipments: number;
  deliveredCount: number;
  inTransitCount: number;
  issueCount: number;
  deliveryRate: number;
  avgDeliveryTime: number;
  criticalCount: number;
}

// ============================================
// PREDICCIONES
// ============================================

export interface DeliveryPrediction {
  shipmentId: string;
  estimatedDate: Date;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
  factors: string[];
}

export interface PredictionSummary {
  onTimeDeliveries: number;
  atRiskDeliveries: number;
  lateDeliveries: number;
  avgConfidence: number;
}

// ============================================
// PATRONES
// ============================================

export interface DetectedPattern {
  id: string;
  type: 'delay' | 'carrier' | 'route' | 'seasonal';
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  frequency: number;
  affectedShipments: number;
  recommendation?: string;
}

// ============================================
// RETRASOS
// ============================================

export interface DelayAnalysis {
  shipment: Shipment;
  delayDays: number;
  delayReason: string;
  carrierResponsibility: number; // 0-100%
  estimatedCost: number;
  suggestedAction: string;
}

export interface DelayReport {
  totalDelays: number;
  avgDelayDays: number;
  topReasons: { reason: string; count: number }[];
  carrierPerformance: { carrier: string; delayRate: number }[];
}

// ============================================
// SESIONES
// ============================================

export interface SessionData {
  id: string;
  date: Date;
  totalGuides: number;
  deliveredGuides: number;
  metrics: IntelligenceMetrics;
}

export interface SessionComparison {
  current: SessionData;
  previous: SessionData;
  changes: {
    deliveryRate: number; // Diferencia en %
    avgTime: number; // Diferencia en horas
    issues: number; // Diferencia en cantidad
  };
}

// ============================================
// FILTROS
// ============================================

export interface IntelligenceFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  carriers: string[];
  status: string[];
  cities: string[];
  riskLevel: ('low' | 'medium' | 'high')[];
}

// ============================================
// ESTADO
// ============================================

export interface IntelligenceState {
  isLoading: boolean;
  error: string | null;
  metrics: IntelligenceMetrics | null;
  predictions: DeliveryPrediction[];
  patterns: DetectedPattern[];
  delays: DelayAnalysis[];
  filters: IntelligenceFilters;
}
