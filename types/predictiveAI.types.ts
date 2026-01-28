/**
 * Predictive AI Types
 *
 * Sistema de Inteligencia Artificial Predictiva para LITPER PRO.
 * Incluye forecasting, detección de anomalías, y optimización.
 */

// ============================================
// PREDICCIÓN DE DEMANDA
// ============================================

export interface DemandForecast {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  warehouseId?: string;

  // Período de predicción
  period: ForecastPeriod;
  startDate: Date;
  endDate: Date;

  // Predicciones
  predictions: DailyPrediction[];

  // Métricas de precisión
  accuracy: ForecastAccuracy;

  // Factores considerados
  factors: ForecastFactor[];

  // Recomendaciones
  recommendations: ForecastRecommendation[];

  // Metadatos
  modelVersion: string;
  generatedAt: Date;
  confidence: number; // 0-1
}

export type ForecastPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly';

export interface DailyPrediction {
  date: Date;
  predictedDemand: number;
  lowerBound: number;  // Intervalo de confianza inferior
  upperBound: number;  // Intervalo de confianza superior
  confidence: number;

  // Factores del día
  isHoliday: boolean;
  isPromotion: boolean;
  seasonalIndex: number;
  trendComponent: number;
}

export interface ForecastAccuracy {
  mape: number;        // Mean Absolute Percentage Error
  mae: number;         // Mean Absolute Error
  rmse: number;        // Root Mean Square Error
  r2: number;          // R-squared
  bias: number;        // Sesgo sistemático
}

export interface ForecastFactor {
  name: string;
  type: 'seasonal' | 'trend' | 'event' | 'promotion' | 'external' | 'competitor';
  impact: number;      // -1 a 1
  confidence: number;
  description: string;
}

export interface ForecastRecommendation {
  type: 'restock' | 'reduce_stock' | 'promotion' | 'price_adjustment' | 'alert';
  priority: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  suggestedAction: string;
  expectedImpact: {
    metric: string;
    currentValue: number;
    projectedValue: number;
    improvement: number;
  };
  deadline?: Date;
}

// ============================================
// PREDICCIÓN DE TIEMPOS DE ENTREGA
// ============================================

export interface DeliveryTimePrediction {
  shipmentId?: string;

  // Origen y destino
  origin: {
    city: string;
    cityCode: string;
    warehouseId?: string;
  };
  destination: {
    city: string;
    cityCode: string;
    zone?: string;
  };

  // Carrier
  carrierId: string;
  carrierName: string;
  serviceType: string;

  // Predicción
  predictedDays: number;
  predictedHours: number;
  estimatedDeliveryDate: Date;

  // Intervalos de confianza
  optimisticDelivery: Date;    // P10
  mostLikelyDelivery: Date;    // P50
  pessimisticDelivery: Date;   // P90

  // Riesgos identificados
  risks: DeliveryRisk[];

  // Factores
  factors: DeliveryFactor[];

  confidence: number;
}

export interface DeliveryRisk {
  type: 'weather' | 'holiday' | 'capacity' | 'route' | 'customs' | 'carrier_performance';
  severity: 'low' | 'medium' | 'high';
  probability: number;
  description: string;
  mitigation?: string;
  impactDays: number;
}

export interface DeliveryFactor {
  name: string;
  value: number | string;
  impact: 'positive' | 'neutral' | 'negative';
  weight: number;
}

// ============================================
// DETECCIÓN DE ANOMALÍAS
// ============================================

export interface AnomalyDetection {
  id: string;
  detectedAt: Date;

  // Tipo de anomalía
  type: AnomalyType;
  category: AnomalyCategory;

  // Entidad afectada
  entityType: 'product' | 'order' | 'shipment' | 'customer' | 'carrier' | 'warehouse';
  entityId: string;
  entityName: string;

  // Detalles
  metric: string;
  expectedValue: number;
  actualValue: number;
  deviation: number;          // Desviaciones estándar
  deviationPercent: number;

  // Severidad
  severity: 'info' | 'warning' | 'critical';
  score: number;              // 0-100

  // Contexto
  historicalAverage: number;
  historicalStdDev: number;
  recentTrend: 'increasing' | 'stable' | 'decreasing';

  // Posibles causas
  possibleCauses: AnomalyCause[];

  // Acciones recomendadas
  recommendations: string[];

  // Estado
  status: 'new' | 'investigating' | 'resolved' | 'false_positive';
  resolvedAt?: Date;
  resolution?: string;
}

export type AnomalyType =
  | 'spike'           // Aumento repentino
  | 'drop'            // Caída repentina
  | 'trend_change'    // Cambio de tendencia
  | 'pattern_break'   // Ruptura de patrón
  | 'outlier'         // Valor atípico
  | 'seasonality_shift'; // Cambio estacional

export type AnomalyCategory =
  | 'demand'          // Anomalía en demanda
  | 'inventory'       // Anomalía en inventario
  | 'pricing'         // Anomalía en precios
  | 'performance'     // Anomalía en rendimiento
  | 'cost'            // Anomalía en costos
  | 'fraud';          // Posible fraude

export interface AnomalyCause {
  cause: string;
  probability: number;
  evidence: string[];
}

// ============================================
// ANÁLISIS DE COMPORTAMIENTO DEL CLIENTE
// ============================================

export interface CustomerBehaviorAnalysis {
  customerId: string;
  analysisDate: Date;

  // Segmentación
  segment: CustomerSegment;
  rfmScore: RFMScore;

  // Valor del cliente
  customerValue: {
    lifetimeValue: number;
    predictedNextYearValue: number;
    averageOrderValue: number;
    orderFrequency: number;  // Órdenes por mes
  };

  // Predicciones
  predictions: {
    churnProbability: number;
    nextPurchaseDate: Date | null;
    nextPurchaseValue: number | null;
    upsellProbability: number;
    crossSellProducts: ProductRecommendation[];
  };

  // Patrones de comportamiento
  patterns: BehaviorPattern[];

  // Preferencias inferidas
  preferences: InferredPreferences;

  // Engagement
  engagementScore: number;
  engagementTrend: 'improving' | 'stable' | 'declining';
}

export type CustomerSegment =
  | 'champions'       // Mejores clientes
  | 'loyal'           // Clientes leales
  | 'potential'       // Alto potencial
  | 'new'             // Nuevos clientes
  | 'promising'       // Prometedores
  | 'need_attention'  // Necesitan atención
  | 'about_to_sleep'  // A punto de dormir
  | 'at_risk'         // En riesgo
  | 'hibernating'     // Hibernando
  | 'lost';           // Perdidos

export interface RFMScore {
  recency: number;      // 1-5
  frequency: number;    // 1-5
  monetary: number;     // 1-5
  totalScore: number;   // Combinado
}

export interface BehaviorPattern {
  pattern: string;
  frequency: number;
  lastOccurrence: Date;
  confidence: number;
}

export interface InferredPreferences {
  preferredCategories: string[];
  preferredBrands: string[];
  priceRange: { min: number; max: number };
  preferredPaymentMethods: string[];
  preferredDeliveryOptions: string[];
  bestContactTime: string;
  preferredChannel: 'email' | 'sms' | 'whatsapp' | 'push';
}

export interface ProductRecommendation {
  productId: string;
  productName: string;
  score: number;
  reason: string;
  expectedConversionRate: number;
}

// ============================================
// OPTIMIZACIÓN DE PRECIOS
// ============================================

export interface PriceOptimization {
  productId: string;
  productSku: string;
  productName: string;

  // Precio actual
  currentPrice: number;
  currentMargin: number;
  currentDemand: number;

  // Precio óptimo recomendado
  optimalPrice: number;
  optimalMargin: number;
  projectedDemand: number;

  // Elasticidad
  priceElasticity: number;
  elasticityCategory: 'inelastic' | 'unit_elastic' | 'elastic' | 'highly_elastic';

  // Análisis competitivo
  competitorPrices: {
    competitor: string;
    price: number;
    lastUpdated: Date;
  }[];
  marketPosition: 'below_market' | 'at_market' | 'above_market';

  // Escenarios
  scenarios: PriceScenario[];

  // Restricciones consideradas
  constraints: PriceConstraint[];

  // Confianza
  confidence: number;
  dataQuality: 'low' | 'medium' | 'high';
}

export interface PriceScenario {
  name: string;
  price: number;
  projectedDemand: number;
  projectedRevenue: number;
  projectedProfit: number;
  marketShareImpact: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface PriceConstraint {
  type: 'min_margin' | 'max_price' | 'min_price' | 'competitor_based' | 'brand_positioning';
  value: number;
  active: boolean;
}

// ============================================
// PREDICCIÓN DE RIESGOS SUPPLY CHAIN
// ============================================

export interface SupplyChainRisk {
  id: string;
  detectedAt: Date;

  // Tipo de riesgo
  riskType: SupplyChainRiskType;
  category: 'supplier' | 'logistics' | 'demand' | 'inventory' | 'external';

  // Entidad afectada
  affectedEntities: {
    type: string;
    id: string;
    name: string;
  }[];

  // Evaluación
  probability: number;        // 0-1
  impact: 'low' | 'medium' | 'high' | 'critical';
  impactValue: number;        // Valor monetario del impacto
  riskScore: number;          // probability * impact

  // Horizonte temporal
  timeHorizon: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  expectedOccurrence?: Date;

  // Descripción
  title: string;
  description: string;

  // Indicadores
  leadIndicators: RiskIndicator[];

  // Mitigación
  mitigationStrategies: MitigationStrategy[];

  // Estado
  status: 'identified' | 'monitoring' | 'mitigating' | 'resolved';
}

export type SupplyChainRiskType =
  | 'stockout'                // Riesgo de desabastecimiento
  | 'overstock'               // Riesgo de sobrestock
  | 'supplier_delay'          // Retraso de proveedor
  | 'supplier_failure'        // Fallo de proveedor
  | 'logistics_disruption'    // Interrupción logística
  | 'demand_volatility'       // Volatilidad de demanda
  | 'quality_issue'           // Problema de calidad
  | 'cost_increase'           // Aumento de costos
  | 'capacity_constraint'     // Restricción de capacidad
  | 'regulatory_change'       // Cambio regulatorio
  | 'natural_disaster'        // Desastre natural
  | 'geopolitical';           // Riesgo geopolítico

export interface RiskIndicator {
  name: string;
  currentValue: number;
  threshold: number;
  trend: 'improving' | 'stable' | 'worsening';
  weight: number;
}

export interface MitigationStrategy {
  strategy: string;
  description: string;
  cost: number;
  effectivenessScore: number;
  implementationTime: string;
  priority: 'low' | 'medium' | 'high';
}

// ============================================
// CONFIGURACIÓN DEL MODELO
// ============================================

export interface AIModelConfig {
  id: string;
  name: string;
  type: 'demand_forecast' | 'delivery_prediction' | 'anomaly_detection' |
        'customer_behavior' | 'price_optimization' | 'risk_prediction';

  // Parámetros del modelo
  parameters: Record<string, number | string | boolean>;

  // Features utilizados
  features: ModelFeature[];

  // Entrenamiento
  lastTrainingDate: Date;
  trainingDataRange: {
    start: Date;
    end: Date;
  };
  trainingRecords: number;

  // Rendimiento
  performance: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    auc?: number;
  };

  // Estado
  status: 'training' | 'active' | 'deprecated' | 'failed';
  version: string;
}

export interface ModelFeature {
  name: string;
  type: 'numeric' | 'categorical' | 'temporal' | 'text';
  importance: number;
  description: string;
}

// ============================================
// DASHBOARD DE IA
// ============================================

export interface AIDashboard {
  // Resumen de predicciones activas
  activePredictions: {
    demandForecasts: number;
    deliveryPredictions: number;
    riskAlerts: number;
    anomalies: number;
  };

  // Precisión de modelos
  modelAccuracy: {
    demandForecast: number;
    deliveryPrediction: number;
    customerChurn: number;
    priceOptimization: number;
  };

  // Alertas críticas
  criticalAlerts: (AnomalyDetection | SupplyChainRisk)[];

  // Recomendaciones principales
  topRecommendations: ForecastRecommendation[];

  // Valor generado
  valueGenerated: {
    costSavings: number;
    revenueIncrease: number;
    stockoutsPrevented: number;
    deliveryAccuracyImprovement: number;
  };

  // Tendencias
  trends: {
    demandTrend: 'up' | 'stable' | 'down';
    riskTrend: 'improving' | 'stable' | 'worsening';
    accuracyTrend: 'improving' | 'stable' | 'declining';
  };
}
