/**
 * Executive Dashboard Types
 *
 * Tipos para el Dashboard Ejecutivo de LITPER PRO.
 * Proporciona visibilidad en tiempo real de KPIs críticos del negocio.
 */

// ============================================
// KPIs EJECUTIVOS
// ============================================

export interface ExecutiveKPIs {
  // Timestamp de última actualización
  lastUpdated: Date;
  period: DashboardPeriod;

  // KPIs Financieros
  financial: FinancialKPIs;

  // KPIs Operacionales
  operations: OperationsKPIs;

  // KPIs de Cliente
  customer: CustomerKPIs;

  // KPIs de Riesgo
  risk: RiskKPIs;

  // KPIs de Marketing
  marketing: MarketingKPIs;

  // KPIs de Inventario
  inventory: InventoryKPIs;
}

export interface FinancialKPIs {
  totalRevenue: KPIValue;
  averageOrderValue: KPIValue;
  grossMargin: KPIValue;
  netProfit: KPIValue;
  costPerDelivery: KPIValue;
  revenuePerOrder: KPIValue;
}

export interface OperationsKPIs {
  totalOrders: KPIValue;
  ordersToday: KPIValue;
  deliveryRate: KPIValue;
  avgDeliveryTime: KPIValue;
  shipmentsInTransit: KPIValue;
  shipmentsDelivered: KPIValue;
  shipmentsPending: KPIValue;
  shipmentsWithIssues: KPIValue;
  onTimeDeliveryRate: KPIValue;
  pickPackTime: KPIValue;
}

export interface CustomerKPIs {
  npsScore: KPIValue;
  csatScore: KPIValue;
  returnRate: KPIValue;
  openTickets: KPIValue;
  avgResolutionTime: KPIValue;
  repeatCustomerRate: KPIValue;
  customerLifetimeValue: KPIValue;
}

export interface RiskKPIs {
  shipmentsAtRisk: KPIValue;
  anomaliesDetected: KPIValue;
  criticalAlerts: KPIValue;
  avgRiskScore: KPIValue;
  stockoutRisk: KPIValue;
  carrierIssues: KPIValue;
}

export interface MarketingKPIs {
  roas: KPIValue;
  cpa: KPIValue;
  conversionRate: KPIValue;
  adSpend: KPIValue;
  newCustomers: KPIValue;
  ctr: KPIValue;
}

export interface InventoryKPIs {
  totalSKUs: KPIValue;
  stockValue: KPIValue;
  turnoverRate: KPIValue;
  lowStockItems: KPIValue;
  outOfStockItems: KPIValue;
  warehouseUtilization: KPIValue;
}

// ============================================
// VALOR DE KPI CON COMPARACIÓN
// ============================================

export interface KPIValue {
  current: number;
  previous: number;
  change: number;          // Diferencia absoluta
  changePercent: number;   // Cambio porcentual
  trend: TrendDirection;
  target?: number;
  targetStatus?: TargetStatus;
  unit: KPIUnit;
  format: KPIFormat;
}

export type TrendDirection = 'up' | 'down' | 'stable';
export type TargetStatus = 'above' | 'on_track' | 'below' | 'critical';
export type KPIUnit = 'currency' | 'percent' | 'number' | 'days' | 'hours' | 'score';
export type KPIFormat = 'integer' | 'decimal' | 'currency' | 'percent' | 'duration';

// ============================================
// PERÍODOS Y FILTROS
// ============================================

export interface DashboardPeriod {
  type: PeriodType;
  start: Date;
  end: Date;
  comparisonStart: Date;
  comparisonEnd: Date;
  label: string;
}

export type PeriodType =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'this_year'
  | 'custom';

export interface DashboardFilters {
  period: PeriodType;
  customRange?: { start: Date; end: Date };
  carriers?: string[];
  cities?: string[];
  warehouses?: string[];
  channels?: string[];
}

// ============================================
// DATOS DE TENDENCIA
// ============================================

export interface TrendData {
  period: string;
  label: string;
  data: TrendDataPoint[];
}

export interface TrendDataPoint {
  date: string;
  timestamp: number;
  value: number;
  previousValue?: number;
  label?: string;
}

export interface RevenueTrendData extends TrendData {
  data: (TrendDataPoint & {
    orders: number;
    avgOrderValue: number;
  })[];
  totals: {
    revenue: number;
    orders: number;
    avgOrderValue: number;
  };
}

export interface DeliveryTrendData extends TrendData {
  data: (TrendDataPoint & {
    delivered: number;
    failed: number;
    inTransit: number;
    deliveryRate: number;
  })[];
}

// ============================================
// EMBUDO DE OPERACIONES
// ============================================

export interface OperationsFunnel {
  stages: FunnelStage[];
  totalOrders: number;
  overallConversion: number;
}

export interface FunnelStage {
  id: string;
  name: string;
  count: number;
  percentage: number;
  conversionFromPrevious: number;
  avgTimeInStage: number; // minutos
  color: string;
}

// ============================================
// PERFORMANCE POR CARRIER
// ============================================

export interface CarrierPerformance {
  carrierId: string;
  carrierName: string;
  carrierLogo?: string;
  metrics: {
    totalShipments: number;
    delivered: number;
    inTransit: number;
    failed: number;
    returned: number;
    deliveryRate: number;
    avgDeliveryDays: number;
    onTimeRate: number;
    costPerShipment: number;
  };
  trend: TrendDirection;
  ranking: number;
  issues: CarrierIssue[];
}

export interface CarrierIssue {
  type: 'delay' | 'damage' | 'lost' | 'return' | 'other';
  count: number;
  trend: TrendDirection;
}

// ============================================
// PERFORMANCE POR CIUDAD
// ============================================

export interface CityPerformance {
  cityCode: string;
  cityName: string;
  departmentCode: string;
  departmentName: string;
  metrics: {
    totalShipments: number;
    deliveryRate: number;
    avgDeliveryDays: number;
    revenue: number;
    orders: number;
    returnRate: number;
  };
  coordinates?: {
    lat: number;
    lng: number;
  };
  performanceLevel: 'excellent' | 'good' | 'average' | 'poor' | 'critical';
}

export interface GeographicHeatmapData {
  regions: CityPerformance[];
  summary: {
    topPerforming: CityPerformance[];
    bottomPerforming: CityPerformance[];
    avgDeliveryRate: number;
  };
}

// ============================================
// DISTRIBUCIÓN DE ESTADOS
// ============================================

export interface StatusDistribution {
  total: number;
  statuses: StatusSegment[];
}

export interface StatusSegment {
  status: ShipmentStatusType;
  count: number;
  percentage: number;
  change: number;
  color: string;
  icon: string;
}

export type ShipmentStatusType =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'returned'
  | 'cancelled';

// ============================================
// ALERTAS EJECUTIVAS
// ============================================

export interface ExecutiveAlert {
  id: string;
  timestamp: Date;
  type: AlertType;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  description: string;
  metric?: string;
  currentValue?: number;
  threshold?: number;
  affectedEntities?: {
    type: string;
    id: string;
    name: string;
  }[];
  actionRequired: boolean;
  suggestedAction?: string;
  status: 'new' | 'acknowledged' | 'resolved' | 'dismissed';
  resolvedAt?: Date;
}

export type AlertType =
  | 'threshold_breach'
  | 'anomaly'
  | 'trend_change'
  | 'sla_risk'
  | 'capacity'
  | 'system'
  | 'carrier'
  | 'inventory';

export type AlertSeverity = 'info' | 'warning' | 'critical' | 'emergency';

export type AlertCategory =
  | 'operations'
  | 'financial'
  | 'customer'
  | 'inventory'
  | 'carrier'
  | 'system';

export interface AlertsSummary {
  total: number;
  bySeverity: Record<AlertSeverity, number>;
  byCategory: Record<AlertCategory, number>;
  alerts: ExecutiveAlert[];
  acknowledgedCount: number;
  pendingActionCount: number;
}

// ============================================
// FEED DE ACTIVIDAD EN TIEMPO REAL
// ============================================

export interface RealTimeEvent {
  id: string;
  timestamp: Date;
  type: EventType;
  severity: EventSeverity;
  icon: string;
  title: string;
  description: string;
  metadata: Record<string, any>;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
}

export type EventType =
  | 'order_created'
  | 'order_shipped'
  | 'delivery_completed'
  | 'delivery_failed'
  | 'return_initiated'
  | 'alert_triggered'
  | 'milestone_reached'
  | 'anomaly_detected'
  | 'sla_breach'
  | 'inventory_low'
  | 'payment_received'
  | 'customer_feedback';

export type EventSeverity = 'info' | 'success' | 'warning' | 'error';

export interface ActivityFeed {
  events: RealTimeEvent[];
  hasMore: boolean;
  lastEventId?: string;
  stats: {
    totalToday: number;
    byType: Record<EventType, number>;
  };
}

// ============================================
// COMPARACIONES DE RENDIMIENTO
// ============================================

export interface PerformanceComparison {
  currentPeriod: PeriodSummary;
  previousPeriod: PeriodSummary;
  changes: PerformanceChanges;
  highlights: PerformanceHighlight[];
}

export interface PeriodSummary {
  label: string;
  startDate: Date;
  endDate: Date;
  revenue: number;
  orders: number;
  deliveries: number;
  deliveryRate: number;
  avgDeliveryTime: number;
  customerSatisfaction: number;
}

export interface PerformanceChanges {
  revenue: { value: number; percent: number; trend: TrendDirection };
  orders: { value: number; percent: number; trend: TrendDirection };
  deliveryRate: { value: number; percent: number; trend: TrendDirection };
  avgDeliveryTime: { value: number; percent: number; trend: TrendDirection };
}

export interface PerformanceHighlight {
  type: 'positive' | 'negative' | 'neutral';
  category: string;
  message: string;
  value: number;
  change: number;
  icon: string;
}

// ============================================
// ESTADO DEL DASHBOARD
// ============================================

export interface ExecutiveDashboardState {
  // Datos
  kpis: ExecutiveKPIs | null;
  revenueTrend: RevenueTrendData | null;
  deliveryTrend: DeliveryTrendData | null;
  operationsFunnel: OperationsFunnel | null;
  carrierPerformance: CarrierPerformance[];
  cityPerformance: CityPerformance[];
  statusDistribution: StatusDistribution | null;
  alertsSummary: AlertsSummary | null;
  activityFeed: ActivityFeed | null;
  comparison: PerformanceComparison | null;

  // UI State
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastRefresh: Date | null;

  // Filtros
  filters: DashboardFilters;

  // Configuración
  autoRefresh: boolean;
  refreshInterval: number; // segundos
  compactMode: boolean;
  visibleSections: string[];
}

// ============================================
// CONFIGURACIÓN DE KPI CARDS
// ============================================

export interface KPICardConfig {
  id: string;
  title: string;
  description?: string;
  category: 'financial' | 'operations' | 'customer' | 'risk' | 'marketing' | 'inventory';
  icon: string;
  color: KPICardColor;
  size: 'small' | 'medium' | 'large';
  showTrend: boolean;
  showTarget: boolean;
  showSparkline: boolean;
  invertTrend?: boolean; // Para métricas donde "down" es bueno (ej: tiempo de entrega)
}

export type KPICardColor =
  | 'blue'
  | 'green'
  | 'yellow'
  | 'red'
  | 'purple'
  | 'indigo'
  | 'pink'
  | 'cyan'
  | 'orange'
  | 'teal';

// ============================================
// WIDGETS Y LAYOUT
// ============================================

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  config: Record<string, any>;
  position: { x: number; y: number };
  size: { width: number; height: number };
  visible: boolean;
}

export type WidgetType =
  | 'kpi_card'
  | 'kpi_grid'
  | 'line_chart'
  | 'bar_chart'
  | 'donut_chart'
  | 'funnel'
  | 'table'
  | 'heatmap'
  | 'alerts'
  | 'activity_feed'
  | 'comparison';

export interface DashboardLayout {
  id: string;
  name: string;
  widgets: DashboardWidget[];
  isDefault: boolean;
  createdBy: string;
  createdAt: Date;
}

// ============================================
// RESPUESTAS DE API
// ============================================

export interface ExecutiveDashboardResponse {
  success: boolean;
  data: {
    kpis: ExecutiveKPIs;
    trends: {
      revenue: RevenueTrendData;
      delivery: DeliveryTrendData;
    };
    funnel: OperationsFunnel;
    carriers: CarrierPerformance[];
    cities: CityPerformance[];
    statusDistribution: StatusDistribution;
    alerts: AlertsSummary;
    comparison: PerformanceComparison;
  };
  meta: {
    generatedAt: Date;
    cacheExpiry: Date;
    dataRange: { start: Date; end: Date };
  };
}
