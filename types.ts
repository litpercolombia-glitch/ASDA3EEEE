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
