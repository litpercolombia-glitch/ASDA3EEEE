export enum ShipmentStatus {
  PENDING = 'Pendiente',
  IN_TRANSIT = 'En Reparto',
  IN_OFFICE = 'En Oficina',
  DELIVERED = 'Entregado',
  ISSUE = 'Novedad',
}

export enum CarrierName {
  INTER_RAPIDISIMO = 'Inter Rapidísimo',
  ENVIA = 'Envía',
  COORDINADORA = 'Coordinadora',
  TCC = 'TCC',
  VELOCES = 'Veloces',
  UNKNOWN = 'Desconocido',
}

export enum ShipmentRiskLevel {
  URGENT = 'URGENTE', // Red
  ATTENTION = 'ATENCIÓN', // Amber/Orange
  WATCH = 'SEGUIMIENTO', // Yellow
  NORMAL = 'NORMAL', // Green
}

export interface ShipmentRisk {
  level: ShipmentRiskLevel;
  reason: string;
  action: string;
  timeLabel?: string;
}

export interface AITrackingResult {
  statusSummary: string;
  timeElapsed: string;
  recommendation: string;
  lastUpdate: string;
}

export interface ShipmentEvent {
  date: string;
  location: string;
  description: string;
  isRecent: boolean;
}

export interface DetailedShipmentInfo {
  origin: string;
  destination: string;
  daysInTransit: number;
  rawStatus: string;
  events: ShipmentEvent[];
  hasErrors: boolean;
  errorDetails?: string[];
  estimatedDelivery?: string;
  declaredValue?: number; // New field for money
}

export interface Shipment {
  id: string; // The guide number
  batchId?: string; // New: Batch ID for grouping loads
  batchDate?: string; // New: Date of batch load
  source?: 'DETAILED' | 'SUMMARY'; // New: Origin of data
  phone?: string;
  carrier: CarrierName;
  status: ShipmentStatus;
  checkStatus: boolean; // True if "checked" (grayed out)
  evidenceImage?: string; // Base64
  dateKey: string; // ISO Date string for grouping
  notes?: string;
  aiAnalysis?: string; // Result from Gemini Vision (Image)
  smartTracking?: AITrackingResult; // Result from Gemini Search (Tracking)
  detailedInfo?: DetailedShipmentInfo; // For the advanced report mode
  riskAnalysis?: ShipmentRisk; // Calculated risk
}

export interface GeminiChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface ReportStats {
  total: number;
  delivered: number;
  inTransit: number;
  issues: number;
  avgDays: number;
  criticalPoints: string[];
  totalValuePotential: number; // New stat
  projectedLoss: number; // New stat (Shipping cost loss)
  topCitiesIssues: { city: string; count: number; percentage: number }[]; // Updated stat
  statusBreakdown: Record<string, number>; // New: Detailed counts per status
  untrackedCount: number; // New: Guides from summary only
}

// ============================================
// PREDICTIVE SYSTEM TYPES
// ============================================

export interface DeliveryData {
  ciudad: string;
  transportadora: string;
  devoluciones: number;
  entregas: number;
  total: number;
}

export interface TimeData {
  ciudad: string;
  transportadora: string;
  dias: number;
}

export interface CarrierPerformance {
  carrier: string;
  deliveryRate: number;
  returnRate: number;
  avgTime: number;
  avgTimeValue: number;
  total: number;
  deliveries: number;
  returns: number;
}

export interface CityData {
  [carrier: string]: CarrierPerformance;
}

export interface HistoricalData {
  [city: string]: CarrierPerformance[];
}

export type RiskLevel = 'BAJO' | 'MEDIO' | 'ALTO' | 'CRÍTICO' | 'DESCONOCIDO';

export interface RiskFactors {
  tasaExito: number;
  tiempoPromedio: number;
  volumenDatos: number;
  confiabilidad: 'Alta' | 'Media' | 'Baja';
}

export interface RiskAnalysis {
  risk: RiskLevel;
  score: number;
  factors: RiskFactors;
  recommendations: string[];
}

export interface Alert {
  type: 'WARNING' | 'CRITICAL' | 'INFO';
  message: string;
  action: string;
  ciudad?: string;
  transportadora?: string;
  timestamp: string;
}

export interface KPIMetrics {
  successRate: number;
  avgCost: number;
  avgDeliveryTime: number;
  totalLoss: number;
  changeFromPrevious: {
    successRate: number;
    avgCost: number;
    avgDeliveryTime: number;
    totalLoss: number;
  };
}

export interface ProblematicZone {
  ciudad: string;
  returnRate: number;
  totalShipments: number;
  totalReturns: number;
  worstCarrier: string;
  trend: 'improving' | 'worsening' | 'stable';
}

export type ProductType = 'Frágil' | 'Electrónico' | 'Ropa' | 'Alimentos' | 'Documentos' | 'Otro';

// ============================================
// ERROR TRACKING TYPES
// ============================================

export type TrackingErrorType =
  | 'CARRIER_NOT_DETECTED'
  | 'INVALID_GUIDE_FORMAT'
  | 'PHONE_NOT_FOUND'
  | 'DUPLICATE_GUIDE'
  | 'TRACKING_API_ERROR'
  | 'PARSE_ERROR'
  | 'STATUS_UNKNOWN'
  | 'DATA_INCOMPLETE';

export interface ErrorTrackingEntry {
  id: string; // Unique ID for the error entry
  guideNumber: string;
  phone?: string;
  errorType: TrackingErrorType;
  errorReason: string;
  rawData?: string; // Original data that caused the error
  timestamp: string;
  batchId: string;
  attemptedCarrier?: CarrierName;
  resolved: boolean;
  resolutionNote?: string;
}

// ============================================
// LOAD BATCH TYPES (HISTORIAL DE CARGAS)
// ============================================

export interface LoadBatch {
  id: string;
  date: string;
  timestamp: string;
  totalGuides: number;
  successfulGuides: number;
  failedGuides: number;
  shipments: Shipment[];
  errors: ErrorTrackingEntry[];
  stats: {
    byStatus: Record<ShipmentStatus, number>;
    byCarrier: Record<CarrierName, number>;
    byRisk: Record<ShipmentRiskLevel, number>;
  };
}

// ============================================
// CLASSIFICATION TYPES
// ============================================

export interface ClassificationCategory {
  id: string;
  label: string;
  color: string;
  bgColor: string;
  count: number;
  guides: Shipment[];
  icon?: string;
}

export interface ClassificationSummary {
  byStatus: ClassificationCategory[];
  byCarrier: ClassificationCategory[];
  byRisk: ClassificationCategory[];
  total: number;
  timestamp: string;
}

// ============================================
// AI PATTERN ANALYSIS TYPES
// ============================================

export interface DelayPattern {
  type: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  affectedGuides: Shipment[];
  daysWithoutMovement: number;
  commonFactors: string[];
  recommendation: string;
}

export interface AILogisticsAnalysis {
  patterns: DelayPattern[];
  urgentReview: Shipment[];
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    strategic: string[];
  };
  riskSummary: {
    totalAtRisk: number;
    criticalCount: number;
    estimatedLoss: number;
    mainCauses: string[];
  };
  colombianContext: {
    regionalIssues: string[];
    carrierAlerts: string[];
    seasonalFactors: string[];
    marketInsights: string[];
  };
  generatedAt: string;
}
