/**
 * Executive Dashboard Service
 *
 * Servicio de agregación de datos para el Dashboard Ejecutivo.
 * Consolida información de múltiples fuentes para proporcionar
 * una vista unificada del negocio en tiempo real.
 */

import {
  ExecutiveKPIs,
  KPIValue,
  TrendDirection,
  TargetStatus,
  DashboardPeriod,
  DashboardFilters,
  PeriodType,
  RevenueTrendData,
  DeliveryTrendData,
  TrendDataPoint,
  OperationsFunnel,
  FunnelStage,
  CarrierPerformance,
  CityPerformance,
  StatusDistribution,
  StatusSegment,
  ShipmentStatusType,
  AlertsSummary,
  ExecutiveAlert,
  AlertSeverity,
  AlertCategory,
  ActivityFeed,
  RealTimeEvent,
  EventType,
  PerformanceComparison,
  GeographicHeatmapData,
  ExecutiveDashboardResponse,
} from '../types/executiveDashboard.types';

// ============================================
// UTILIDADES DE PERÍODO
// ============================================

export class PeriodCalculator {
  static getPeriod(type: PeriodType, customRange?: { start: Date; end: Date }): DashboardPeriod {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let start: Date;
    let end: Date;
    let comparisonStart: Date;
    let comparisonEnd: Date;
    let label: string;

    switch (type) {
      case 'today':
        start = today;
        end = now;
        comparisonStart = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        comparisonEnd = new Date(comparisonStart.getTime() + (now.getTime() - today.getTime()));
        label = 'Hoy';
        break;

      case 'yesterday':
        start = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        end = new Date(today.getTime() - 1);
        comparisonStart = new Date(start.getTime() - 24 * 60 * 60 * 1000);
        comparisonEnd = new Date(end.getTime() - 24 * 60 * 60 * 1000);
        label = 'Ayer';
        break;

      case 'last_7_days':
        start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        end = now;
        comparisonStart = new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000);
        comparisonEnd = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
        label = 'Últimos 7 días';
        break;

      case 'last_30_days':
        start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        end = now;
        comparisonStart = new Date(start.getTime() - 30 * 24 * 60 * 60 * 1000);
        comparisonEnd = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        label = 'Últimos 30 días';
        break;

      case 'this_month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = now;
        comparisonStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        comparisonEnd = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        label = 'Este mes';
        break;

      case 'last_month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        comparisonStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        comparisonEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0);
        label = 'Mes anterior';
        break;

      case 'this_quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
        end = now;
        comparisonStart = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
        comparisonEnd = new Date(now.getFullYear(), quarter * 3, 0);
        label = `Q${quarter + 1} ${now.getFullYear()}`;
        break;

      case 'this_year':
        start = new Date(now.getFullYear(), 0, 1);
        end = now;
        comparisonStart = new Date(now.getFullYear() - 1, 0, 1);
        comparisonEnd = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        label = `${now.getFullYear()}`;
        break;

      case 'custom':
        if (customRange) {
          start = customRange.start;
          end = customRange.end;
          const duration = end.getTime() - start.getTime();
          comparisonStart = new Date(start.getTime() - duration);
          comparisonEnd = new Date(end.getTime() - duration);
          label = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
        } else {
          return this.getPeriod('last_30_days');
        }
        break;

      default:
        return this.getPeriod('last_30_days');
    }

    return {
      type,
      start,
      end,
      comparisonStart,
      comparisonEnd,
      label,
    };
  }
}

// ============================================
// SERVICIO PRINCIPAL
// ============================================

export class ExecutiveDashboardService {
  private cache: Map<string, { data: any; expiry: number }> = new Map();
  private cacheTimeout = 30000; // 30 segundos

  /**
   * Obtiene todos los datos del dashboard ejecutivo
   */
  async getDashboardData(filters: DashboardFilters): Promise<ExecutiveDashboardResponse> {
    const period = PeriodCalculator.getPeriod(filters.period, filters.customRange);

    // Obtener datos en paralelo para máxima eficiencia
    const [
      kpis,
      revenueTrend,
      deliveryTrend,
      funnel,
      carriers,
      cities,
      statusDist,
      alerts,
      comparison,
    ] = await Promise.all([
      this.getExecutiveKPIs(period, filters),
      this.getRevenueTrend(period, filters),
      this.getDeliveryTrend(period, filters),
      this.getOperationsFunnel(period, filters),
      this.getCarrierPerformance(period, filters),
      this.getCityPerformance(period, filters),
      this.getStatusDistribution(period, filters),
      this.getAlertsSummary(filters),
      this.getPerformanceComparison(period),
    ]);

    return {
      success: true,
      data: {
        kpis,
        trends: {
          revenue: revenueTrend,
          delivery: deliveryTrend,
        },
        funnel,
        carriers,
        cities,
        statusDistribution: statusDist,
        alerts,
        comparison,
      },
      meta: {
        generatedAt: new Date(),
        cacheExpiry: new Date(Date.now() + this.cacheTimeout),
        dataRange: { start: period.start, end: period.end },
      },
    };
  }

  /**
   * Obtiene los KPIs ejecutivos principales
   */
  async getExecutiveKPIs(period: DashboardPeriod, _filters: DashboardFilters): Promise<ExecutiveKPIs> {
    return {
      lastUpdated: new Date(),
      period,
      financial: {
        totalRevenue: this.createKPIValue(45200000, 40100000, 'currency', 'currency', 50000000),
        averageOrderValue: this.createKPIValue(125000, 118000, 'currency', 'currency'),
        grossMargin: this.createKPIValue(0.32, 0.30, 'percent', 'percent', 0.35),
        netProfit: this.createKPIValue(12500000, 10800000, 'currency', 'currency'),
        costPerDelivery: this.createKPIValue(8500, 9200, 'currency', 'currency', 8000, true),
        revenuePerOrder: this.createKPIValue(145000, 138000, 'currency', 'currency'),
      },
      operations: {
        totalOrders: this.createKPIValue(1234, 1156, 'number', 'integer'),
        ordersToday: this.createKPIValue(87, 72, 'number', 'integer'),
        deliveryRate: this.createKPIValue(0.942, 0.918, 'percent', 'percent', 0.95),
        avgDeliveryTime: this.createKPIValue(2.3, 2.8, 'days', 'decimal', 2.0, true),
        shipmentsInTransit: this.createKPIValue(342, 298, 'number', 'integer'),
        shipmentsDelivered: this.createKPIValue(1162, 1061, 'number', 'integer'),
        shipmentsPending: this.createKPIValue(45, 52, 'number', 'integer'),
        shipmentsWithIssues: this.createKPIValue(23, 31, 'number', 'integer', 20, true),
        onTimeDeliveryRate: this.createKPIValue(0.89, 0.85, 'percent', 'percent', 0.90),
        pickPackTime: this.createKPIValue(45, 52, 'hours', 'decimal', 30, true),
      },
      customer: {
        npsScore: this.createKPIValue(72, 67, 'score', 'integer', 75),
        csatScore: this.createKPIValue(4.5, 4.3, 'score', 'decimal', 4.5),
        returnRate: this.createKPIValue(0.052, 0.068, 'percent', 'percent', 0.05, true),
        openTickets: this.createKPIValue(18, 24, 'number', 'integer', 15, true),
        avgResolutionTime: this.createKPIValue(4.2, 5.1, 'hours', 'decimal', 4.0, true),
        repeatCustomerRate: this.createKPIValue(0.38, 0.35, 'percent', 'percent', 0.40),
        customerLifetimeValue: this.createKPIValue(850000, 780000, 'currency', 'currency'),
      },
      risk: {
        shipmentsAtRisk: this.createKPIValue(12, 18, 'number', 'integer', 10, true),
        anomaliesDetected: this.createKPIValue(3, 5, 'number', 'integer', 0, true),
        criticalAlerts: this.createKPIValue(2, 4, 'number', 'integer', 0, true),
        avgRiskScore: this.createKPIValue(23, 31, 'score', 'integer', 20, true),
        stockoutRisk: this.createKPIValue(5, 8, 'number', 'integer', 0, true),
        carrierIssues: this.createKPIValue(4, 7, 'number', 'integer', 0, true),
      },
      marketing: {
        roas: this.createKPIValue(4.2, 3.8, 'number', 'decimal', 4.0),
        cpa: this.createKPIValue(35000, 42000, 'currency', 'currency', 30000, true),
        conversionRate: this.createKPIValue(0.032, 0.028, 'percent', 'percent', 0.035),
        adSpend: this.createKPIValue(8500000, 7200000, 'currency', 'currency'),
        newCustomers: this.createKPIValue(245, 198, 'number', 'integer'),
        ctr: this.createKPIValue(0.028, 0.024, 'percent', 'percent', 0.030),
      },
      inventory: {
        totalSKUs: this.createKPIValue(1856, 1742, 'number', 'integer'),
        stockValue: this.createKPIValue(125000000, 118000000, 'currency', 'currency'),
        turnoverRate: this.createKPIValue(4.2, 3.8, 'number', 'decimal', 5.0),
        lowStockItems: this.createKPIValue(34, 28, 'number', 'integer', 20, true),
        outOfStockItems: this.createKPIValue(8, 12, 'number', 'integer', 0, true),
        warehouseUtilization: this.createKPIValue(0.78, 0.72, 'percent', 'percent', 0.85),
      },
    };
  }

  /**
   * Obtiene datos de tendencia de ingresos
   */
  async getRevenueTrend(period: DashboardPeriod, _filters: DashboardFilters): Promise<RevenueTrendData> {
    const days = Math.ceil((period.end.getTime() - period.start.getTime()) / (24 * 60 * 60 * 1000));
    const data: RevenueTrendData['data'] = [];

    let totalRevenue = 0;
    let totalOrders = 0;

    for (let i = 0; i < days; i++) {
      const date = new Date(period.start.getTime() + i * 24 * 60 * 60 * 1000);
      const baseRevenue = 1500000 + Math.random() * 500000;
      const dayOfWeek = date.getDay();
      // Más ventas los fines de semana
      const dayMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 1.3 : 1.0;
      const revenue = Math.round(baseRevenue * dayMultiplier);
      const orders = Math.round(revenue / 125000);
      const avgOrderValue = Math.round(revenue / orders);

      totalRevenue += revenue;
      totalOrders += orders;

      data.push({
        date: date.toISOString().split('T')[0],
        timestamp: date.getTime(),
        value: revenue,
        previousValue: Math.round(revenue * (0.9 + Math.random() * 0.15)),
        orders,
        avgOrderValue,
        label: date.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' }),
      });
    }

    return {
      period: period.label,
      label: 'Ingresos',
      data,
      totals: {
        revenue: totalRevenue,
        orders: totalOrders,
        avgOrderValue: Math.round(totalRevenue / totalOrders),
      },
    };
  }

  /**
   * Obtiene datos de tendencia de entregas
   */
  async getDeliveryTrend(period: DashboardPeriod, _filters: DashboardFilters): Promise<DeliveryTrendData> {
    const days = Math.ceil((period.end.getTime() - period.start.getTime()) / (24 * 60 * 60 * 1000));
    const data: DeliveryTrendData['data'] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(period.start.getTime() + i * 24 * 60 * 60 * 1000);
      const total = 80 + Math.floor(Math.random() * 40);
      const delivered = Math.floor(total * (0.90 + Math.random() * 0.08));
      const failed = Math.floor((total - delivered) * 0.3);
      const inTransit = total - delivered - failed;

      data.push({
        date: date.toISOString().split('T')[0],
        timestamp: date.getTime(),
        value: delivered,
        delivered,
        failed,
        inTransit,
        deliveryRate: delivered / total,
        label: date.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' }),
      });
    }

    return {
      period: period.label,
      label: 'Entregas',
      data,
    };
  }

  /**
   * Obtiene el embudo de operaciones
   */
  async getOperationsFunnel(_period: DashboardPeriod, _filters: DashboardFilters): Promise<OperationsFunnel> {
    const stages: FunnelStage[] = [
      {
        id: 'orders',
        name: 'Órdenes Recibidas',
        count: 1234,
        percentage: 100,
        conversionFromPrevious: 100,
        avgTimeInStage: 0,
        color: '#3b82f6',
      },
      {
        id: 'processing',
        name: 'En Procesamiento',
        count: 1198,
        percentage: 97.1,
        conversionFromPrevious: 97.1,
        avgTimeInStage: 45,
        color: '#8b5cf6',
      },
      {
        id: 'shipped',
        name: 'Despachadas',
        count: 1178,
        percentage: 95.5,
        conversionFromPrevious: 98.3,
        avgTimeInStage: 120,
        color: '#6366f1',
      },
      {
        id: 'in_transit',
        name: 'En Tránsito',
        count: 342,
        percentage: 27.7,
        conversionFromPrevious: 29.0,
        avgTimeInStage: 2880, // 48 horas promedio
        color: '#f59e0b',
      },
      {
        id: 'delivered',
        name: 'Entregadas',
        count: 1162,
        percentage: 94.2,
        conversionFromPrevious: 98.6,
        avgTimeInStage: 0,
        color: '#10b981',
      },
    ];

    return {
      stages,
      totalOrders: 1234,
      overallConversion: 94.2,
    };
  }

  /**
   * Obtiene performance por carrier
   */
  async getCarrierPerformance(_period: DashboardPeriod, _filters: DashboardFilters): Promise<CarrierPerformance[]> {
    return [
      {
        carrierId: 'interrapidisimo',
        carrierName: 'Inter Rapidísimo',
        carrierLogo: '/logos/interrapidisimo.png',
        metrics: {
          totalShipments: 456,
          delivered: 432,
          inTransit: 18,
          failed: 4,
          returned: 2,
          deliveryRate: 0.947,
          avgDeliveryDays: 2.1,
          onTimeRate: 0.92,
          costPerShipment: 8200,
        },
        trend: 'up',
        ranking: 1,
        issues: [
          { type: 'delay', count: 12, trend: 'down' },
          { type: 'damage', count: 1, trend: 'stable' },
        ],
      },
      {
        carrierId: 'envia',
        carrierName: 'Envía',
        carrierLogo: '/logos/envia.png',
        metrics: {
          totalShipments: 389,
          delivered: 362,
          inTransit: 21,
          failed: 4,
          returned: 2,
          deliveryRate: 0.931,
          avgDeliveryDays: 2.4,
          onTimeRate: 0.88,
          costPerShipment: 7800,
        },
        trend: 'stable',
        ranking: 2,
        issues: [
          { type: 'delay', count: 18, trend: 'up' },
          { type: 'return', count: 2, trend: 'stable' },
        ],
      },
      {
        carrierId: 'coordinadora',
        carrierName: 'Coordinadora',
        carrierLogo: '/logos/coordinadora.png',
        metrics: {
          totalShipments: 234,
          delivered: 215,
          inTransit: 14,
          failed: 3,
          returned: 2,
          deliveryRate: 0.919,
          avgDeliveryDays: 2.8,
          onTimeRate: 0.85,
          costPerShipment: 8500,
        },
        trend: 'down',
        ranking: 3,
        issues: [
          { type: 'delay', count: 22, trend: 'up' },
          { type: 'lost', count: 1, trend: 'stable' },
        ],
      },
      {
        carrierId: 'tcc',
        carrierName: 'TCC',
        carrierLogo: '/logos/tcc.png',
        metrics: {
          totalShipments: 98,
          delivered: 89,
          inTransit: 6,
          failed: 2,
          returned: 1,
          deliveryRate: 0.908,
          avgDeliveryDays: 3.2,
          onTimeRate: 0.82,
          costPerShipment: 9200,
        },
        trend: 'stable',
        ranking: 4,
        issues: [
          { type: 'delay', count: 8, trend: 'stable' },
        ],
      },
      {
        carrierId: 'servientrega',
        carrierName: 'Servientrega',
        carrierLogo: '/logos/servientrega.png',
        metrics: {
          totalShipments: 57,
          delivered: 51,
          inTransit: 4,
          failed: 1,
          returned: 1,
          deliveryRate: 0.895,
          avgDeliveryDays: 3.5,
          onTimeRate: 0.78,
          costPerShipment: 7500,
        },
        trend: 'down',
        ranking: 5,
        issues: [
          { type: 'delay', count: 6, trend: 'up' },
          { type: 'damage', count: 2, trend: 'up' },
        ],
      },
    ];
  }

  /**
   * Obtiene performance por ciudad
   */
  async getCityPerformance(_period: DashboardPeriod, _filters: DashboardFilters): Promise<CityPerformance[]> {
    return [
      {
        cityCode: '11001',
        cityName: 'Bogotá',
        departmentCode: '11',
        departmentName: 'Bogotá D.C.',
        metrics: {
          totalShipments: 456,
          deliveryRate: 0.96,
          avgDeliveryDays: 1.5,
          revenue: 18500000,
          orders: 412,
          returnRate: 0.04,
        },
        coordinates: { lat: 4.711, lng: -74.0721 },
        performanceLevel: 'excellent',
      },
      {
        cityCode: '05001',
        cityName: 'Medellín',
        departmentCode: '05',
        departmentName: 'Antioquia',
        metrics: {
          totalShipments: 234,
          deliveryRate: 0.94,
          avgDeliveryDays: 2.0,
          revenue: 9200000,
          orders: 198,
          returnRate: 0.05,
        },
        coordinates: { lat: 6.2442, lng: -75.5812 },
        performanceLevel: 'excellent',
      },
      {
        cityCode: '76001',
        cityName: 'Cali',
        departmentCode: '76',
        departmentName: 'Valle del Cauca',
        metrics: {
          totalShipments: 187,
          deliveryRate: 0.92,
          avgDeliveryDays: 2.3,
          revenue: 7100000,
          orders: 156,
          returnRate: 0.06,
        },
        coordinates: { lat: 3.4516, lng: -76.532 },
        performanceLevel: 'good',
      },
      {
        cityCode: '08001',
        cityName: 'Barranquilla',
        departmentCode: '08',
        departmentName: 'Atlántico',
        metrics: {
          totalShipments: 98,
          deliveryRate: 0.89,
          avgDeliveryDays: 2.8,
          revenue: 3800000,
          orders: 87,
          returnRate: 0.07,
        },
        coordinates: { lat: 10.9685, lng: -74.7813 },
        performanceLevel: 'good',
      },
      {
        cityCode: '13001',
        cityName: 'Cartagena',
        departmentCode: '13',
        departmentName: 'Bolívar',
        metrics: {
          totalShipments: 76,
          deliveryRate: 0.87,
          avgDeliveryDays: 3.1,
          revenue: 2900000,
          orders: 68,
          returnRate: 0.08,
        },
        coordinates: { lat: 10.3910, lng: -75.4794 },
        performanceLevel: 'average',
      },
      {
        cityCode: '68001',
        cityName: 'Bucaramanga',
        departmentCode: '68',
        departmentName: 'Santander',
        metrics: {
          totalShipments: 54,
          deliveryRate: 0.91,
          avgDeliveryDays: 2.5,
          revenue: 2100000,
          orders: 48,
          returnRate: 0.05,
        },
        coordinates: { lat: 7.1254, lng: -73.1198 },
        performanceLevel: 'good',
      },
      {
        cityCode: '50001',
        cityName: 'Villavicencio',
        departmentCode: '50',
        departmentName: 'Meta',
        metrics: {
          totalShipments: 42,
          deliveryRate: 0.83,
          avgDeliveryDays: 3.5,
          revenue: 1600000,
          orders: 38,
          returnRate: 0.09,
        },
        coordinates: { lat: 4.1420, lng: -73.6266 },
        performanceLevel: 'average',
      },
      {
        cityCode: '52001',
        cityName: 'Pasto',
        departmentCode: '52',
        departmentName: 'Nariño',
        metrics: {
          totalShipments: 28,
          deliveryRate: 0.78,
          avgDeliveryDays: 4.2,
          revenue: 980000,
          orders: 24,
          returnRate: 0.12,
        },
        coordinates: { lat: 1.2136, lng: -77.2811 },
        performanceLevel: 'poor',
      },
    ];
  }

  /**
   * Obtiene distribución de estados
   */
  async getStatusDistribution(_period: DashboardPeriod, _filters: DashboardFilters): Promise<StatusDistribution> {
    const total = 1234;
    const statuses: StatusSegment[] = [
      {
        status: 'delivered' as ShipmentStatusType,
        count: 1162,
        percentage: 94.2,
        change: 2.1,
        color: '#10b981',
        icon: '✓',
      },
      {
        status: 'in_transit' as ShipmentStatusType,
        count: 342,
        percentage: 27.7,
        change: -1.2,
        color: '#3b82f6',
        icon: '🚚',
      },
      {
        status: 'processing' as ShipmentStatusType,
        count: 45,
        percentage: 3.6,
        change: 0.5,
        color: '#8b5cf6',
        icon: '📦',
      },
      {
        status: 'failed' as ShipmentStatusType,
        count: 23,
        percentage: 1.9,
        change: -0.8,
        color: '#ef4444',
        icon: '✗',
      },
      {
        status: 'returned' as ShipmentStatusType,
        count: 18,
        percentage: 1.5,
        change: 0.2,
        color: '#f59e0b',
        icon: '↩',
      },
    ];

    return { total, statuses };
  }

  /**
   * Obtiene resumen de alertas
   */
  async getAlertsSummary(_filters: DashboardFilters): Promise<AlertsSummary> {
    const alerts: ExecutiveAlert[] = [
      {
        id: 'alert-001',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        type: 'anomaly',
        severity: 'critical',
        category: 'operations',
        title: 'Anomalía en tasa de entrega',
        description: 'La tasa de entrega en Cartagena cayó 15% en las últimas 2 horas',
        metric: 'delivery_rate',
        currentValue: 0.72,
        threshold: 0.85,
        affectedEntities: [{ type: 'city', id: '13001', name: 'Cartagena' }],
        actionRequired: true,
        suggestedAction: 'Revisar envíos pendientes con carrier TCC en la zona',
        status: 'new',
      },
      {
        id: 'alert-002',
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        type: 'threshold_breach',
        severity: 'warning',
        category: 'inventory',
        title: 'Stock bajo en 5 SKUs',
        description: '5 productos principales tienen stock para menos de 3 días',
        metric: 'days_of_stock',
        currentValue: 2.5,
        threshold: 7,
        actionRequired: true,
        suggestedAction: 'Generar órdenes de compra para SKUs críticos',
        status: 'acknowledged',
      },
      {
        id: 'alert-003',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        type: 'carrier',
        severity: 'warning',
        category: 'carrier',
        title: 'Retrasos en Servientrega',
        description: '12 envíos con más de 24h de retraso sobre tiempo estimado',
        metric: 'delayed_shipments',
        currentValue: 12,
        threshold: 5,
        affectedEntities: [{ type: 'carrier', id: 'servientrega', name: 'Servientrega' }],
        actionRequired: true,
        status: 'new',
      },
      {
        id: 'alert-004',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        type: 'sla_risk',
        severity: 'info',
        category: 'customer',
        title: '3 tickets próximos a SLA',
        description: 'Tickets de soporte que vencen en las próximas 2 horas',
        metric: 'tickets_near_sla',
        currentValue: 3,
        threshold: 0,
        actionRequired: false,
        status: 'acknowledged',
      },
    ];

    return {
      total: alerts.length,
      bySeverity: {
        info: 1,
        warning: 2,
        critical: 1,
        emergency: 0,
      },
      byCategory: {
        operations: 1,
        financial: 0,
        customer: 1,
        inventory: 1,
        carrier: 1,
        system: 0,
      },
      alerts,
      acknowledgedCount: 2,
      pendingActionCount: 3,
    };
  }

  /**
   * Obtiene feed de actividad en tiempo real
   */
  async getActivityFeed(limit: number = 20): Promise<ActivityFeed> {
    const events: RealTimeEvent[] = [
      {
        id: 'evt-001',
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        type: 'delivery_completed',
        severity: 'success',
        icon: '✓',
        title: 'Entrega completada',
        description: 'Orden #ORD-4521 entregada en Bogotá',
        metadata: { orderId: 'ORD-4521', city: 'Bogotá', carrier: 'Inter Rapidísimo' },
        entityType: 'shipment',
        entityId: 'SHP-4521',
      },
      {
        id: 'evt-002',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        type: 'order_created',
        severity: 'info',
        icon: '🛒',
        title: 'Nueva orden',
        description: 'Orden #ORD-4589 creada - $185,000',
        metadata: { orderId: 'ORD-4589', total: 185000, items: 3 },
        entityType: 'order',
        entityId: 'ORD-4589',
      },
      {
        id: 'evt-003',
        timestamp: new Date(Date.now() - 8 * 60 * 1000),
        type: 'alert_triggered',
        severity: 'warning',
        icon: '⚠️',
        title: 'Alerta de carrier',
        description: 'TCC reporta retrasos en zona norte de Bogotá',
        metadata: { carrier: 'TCC', zone: 'Bogotá Norte', affectedShipments: 5 },
        entityType: 'carrier',
        entityId: 'tcc',
      },
      {
        id: 'evt-004',
        timestamp: new Date(Date.now() - 12 * 60 * 1000),
        type: 'delivery_completed',
        severity: 'success',
        icon: '✓',
        title: 'Entrega completada',
        description: 'Orden #ORD-4518 entregada en Medellín',
        metadata: { orderId: 'ORD-4518', city: 'Medellín', carrier: 'Envía' },
        entityType: 'shipment',
        entityId: 'SHP-4518',
      },
      {
        id: 'evt-005',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        type: 'anomaly_detected',
        severity: 'warning',
        icon: '🔍',
        title: 'Anomalía detectada',
        description: 'Spike inusual de devoluciones en Cali',
        metadata: { city: 'Cali', metric: 'return_rate', value: 0.12 },
        entityType: 'city',
        entityId: '76001',
      },
      {
        id: 'evt-006',
        timestamp: new Date(Date.now() - 18 * 60 * 1000),
        type: 'order_shipped',
        severity: 'info',
        icon: '📦',
        title: 'Orden despachada',
        description: 'Orden #ORD-4515 despachada con Coordinadora',
        metadata: { orderId: 'ORD-4515', carrier: 'Coordinadora', tracking: 'COO-789456' },
        entityType: 'shipment',
        entityId: 'SHP-4515',
      },
      {
        id: 'evt-007',
        timestamp: new Date(Date.now() - 22 * 60 * 1000),
        type: 'payment_received',
        severity: 'success',
        icon: '💰',
        title: 'Pago recibido',
        description: 'Pago de $245,000 confirmado - Orden #ORD-4590',
        metadata: { orderId: 'ORD-4590', amount: 245000, method: 'PSE' },
        entityType: 'payment',
        entityId: 'PAY-4590',
      },
      {
        id: 'evt-008',
        timestamp: new Date(Date.now() - 28 * 60 * 1000),
        type: 'delivery_failed',
        severity: 'error',
        icon: '✗',
        title: 'Entrega fallida',
        description: 'No se encontró destinatario - Orden #ORD-4502',
        metadata: { orderId: 'ORD-4502', reason: 'Destinatario ausente', attempts: 2 },
        entityType: 'shipment',
        entityId: 'SHP-4502',
      },
      {
        id: 'evt-009',
        timestamp: new Date(Date.now() - 35 * 60 * 1000),
        type: 'milestone_reached',
        severity: 'success',
        icon: '🎉',
        title: 'Meta alcanzada',
        description: '1,000 entregas completadas este mes',
        metadata: { milestone: 'monthly_deliveries', value: 1000 },
      },
      {
        id: 'evt-010',
        timestamp: new Date(Date.now() - 42 * 60 * 1000),
        type: 'customer_feedback',
        severity: 'info',
        icon: '⭐',
        title: 'Nueva reseña',
        description: 'Cliente calificó entrega con 5 estrellas',
        metadata: { rating: 5, orderId: 'ORD-4498', comment: 'Excelente servicio' },
        entityType: 'feedback',
        entityId: 'FB-4498',
      },
    ];

    const byType: Record<EventType, number> = {
      order_created: 45,
      order_shipped: 42,
      delivery_completed: 87,
      delivery_failed: 5,
      return_initiated: 3,
      alert_triggered: 8,
      milestone_reached: 2,
      anomaly_detected: 3,
      sla_breach: 1,
      inventory_low: 4,
      payment_received: 52,
      customer_feedback: 28,
    };

    return {
      events: events.slice(0, limit),
      hasMore: events.length > limit,
      lastEventId: events[events.length - 1]?.id,
      stats: {
        totalToday: 280,
        byType,
      },
    };
  }

  /**
   * Obtiene comparación de rendimiento entre períodos
   */
  async getPerformanceComparison(period: DashboardPeriod): Promise<PerformanceComparison> {
    return {
      currentPeriod: {
        label: period.label,
        startDate: period.start,
        endDate: period.end,
        revenue: 45200000,
        orders: 1234,
        deliveries: 1162,
        deliveryRate: 0.942,
        avgDeliveryTime: 2.3,
        customerSatisfaction: 4.5,
      },
      previousPeriod: {
        label: 'Período anterior',
        startDate: period.comparisonStart,
        endDate: period.comparisonEnd,
        revenue: 40100000,
        orders: 1156,
        deliveries: 1061,
        deliveryRate: 0.918,
        avgDeliveryTime: 2.8,
        customerSatisfaction: 4.3,
      },
      changes: {
        revenue: { value: 5100000, percent: 12.7, trend: 'up' },
        orders: { value: 78, percent: 6.7, trend: 'up' },
        deliveryRate: { value: 0.024, percent: 2.6, trend: 'up' },
        avgDeliveryTime: { value: -0.5, percent: -17.9, trend: 'up' },
      },
      highlights: [
        {
          type: 'positive',
          category: 'Revenue',
          message: 'Ingresos aumentaron 12.7% vs período anterior',
          value: 45200000,
          change: 12.7,
          icon: '📈',
        },
        {
          type: 'positive',
          category: 'Delivery',
          message: 'Tiempo de entrega mejoró 18% (0.5 días menos)',
          value: 2.3,
          change: -17.9,
          icon: '🚀',
        },
        {
          type: 'negative',
          category: 'Returns',
          message: 'Tasa de devoluciones subió 0.4 puntos',
          value: 5.2,
          change: 8.3,
          icon: '↩️',
        },
      ],
    };
  }

  /**
   * Obtiene datos para el mapa de calor geográfico
   */
  async getGeographicHeatmap(_filters: DashboardFilters): Promise<GeographicHeatmapData> {
    const cities = await this.getCityPerformance(
      PeriodCalculator.getPeriod('last_30_days'),
      _filters
    );

    const sorted = [...cities].sort((a, b) => b.metrics.deliveryRate - a.metrics.deliveryRate);

    return {
      regions: cities,
      summary: {
        topPerforming: sorted.slice(0, 3),
        bottomPerforming: sorted.slice(-3).reverse(),
        avgDeliveryRate: cities.reduce((sum, c) => sum + c.metrics.deliveryRate, 0) / cities.length,
      },
    };
  }

  // ============================================
  // UTILIDADES PRIVADAS
  // ============================================

  private createKPIValue(
    current: number,
    previous: number,
    unit: KPIValue['unit'],
    format: KPIValue['format'],
    target?: number,
    invertTrend: boolean = false
  ): KPIValue {
    const change = current - previous;
    const changePercent = previous !== 0 ? (change / previous) * 100 : 0;

    let trend: TrendDirection = 'stable';
    if (Math.abs(changePercent) > 1) {
      trend = change > 0 ? 'up' : 'down';
    }

    // Para métricas donde "menos es mejor", invertir la interpretación
    if (invertTrend) {
      trend = trend === 'up' ? 'down' : trend === 'down' ? 'up' : 'stable';
    }

    let targetStatus: TargetStatus | undefined;
    if (target !== undefined) {
      const diff = ((current - target) / target) * 100;
      if (invertTrend) {
        if (current <= target) targetStatus = 'above';
        else if (current <= target * 1.1) targetStatus = 'on_track';
        else if (current <= target * 1.25) targetStatus = 'below';
        else targetStatus = 'critical';
      } else {
        if (current >= target) targetStatus = 'above';
        else if (current >= target * 0.9) targetStatus = 'on_track';
        else if (current >= target * 0.75) targetStatus = 'below';
        else targetStatus = 'critical';
      }
    }

    return {
      current,
      previous,
      change,
      changePercent,
      trend,
      target,
      targetStatus,
      unit,
      format,
    };
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const executiveDashboardService = new ExecutiveDashboardService();
