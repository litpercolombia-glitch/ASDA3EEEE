// types/marketing.types.ts
// Sistema de Tracking de Marketing Digital - Colombia, Ecuador, Chile

// ============================================
// PLATAFORMAS Y CONEXIONES
// ============================================

export type AdPlatform = 'meta' | 'google' | 'tiktok';

export interface PlatformConnection {
  id: string;
  platform: AdPlatform;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  connectedAt: Date;
  lastSyncAt?: Date;
  status: 'active' | 'expired' | 'revoked' | 'error';
}

export interface AdAccount {
  id: string;
  externalId: string;
  platform: AdPlatform;
  name: string;
  currency: string;
  timezone?: string;
  status: 'active' | 'disabled' | 'pending';
  isSelected: boolean;
  spendLimit?: number;
  currentSpend?: number;
  lastSync?: Date;
}

// ============================================
// CAMPAÑAS, CONJUNTOS Y ANUNCIOS
// ============================================

export type CampaignStatus = 'active' | 'paused' | 'deleted' | 'pending' | 'archived';
export type CampaignObjective =
  | 'conversions'
  | 'traffic'
  | 'engagement'
  | 'reach'
  | 'video_views'
  | 'lead_generation'
  | 'app_installs'
  | 'messages'
  | 'sales';

export interface Campaign {
  id: string;
  externalId: string;
  accountId: string;
  platform: AdPlatform;
  name: string;
  status: CampaignStatus;
  objective?: CampaignObjective;
  budgetType: 'daily' | 'lifetime';
  budgetAmount: number;
  currency: string;
  startDate?: Date;
  endDate?: Date;

  // Métricas
  metrics: CampaignMetrics;

  // Tracking
  hasUTM: boolean;
  utmStatus: 'complete' | 'partial' | 'missing';

  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignMetrics {
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;           // Click Through Rate
  cpc: number;           // Cost Per Click
  cpm: number;           // Cost Per Mille
  spend: number;
  conversions: number;
  cpa: number;           // Cost Per Acquisition
  revenue: number;
  roas: number;          // Return On Ad Spend
  frequency?: number;
}

export interface AdSet {
  id: string;
  externalId: string;
  campaignId: string;
  platform: AdPlatform;
  name: string;
  status: CampaignStatus;
  budgetAmount?: number;
  targeting?: TargetingConfig;
  placements?: string[];
  metrics: CampaignMetrics;
  lastSyncAt?: Date;
}

export interface TargetingConfig {
  ageMin?: number;
  ageMax?: number;
  genders?: ('male' | 'female' | 'all')[];
  locations?: string[];
  interests?: string[];
  behaviors?: string[];
  customAudiences?: string[];
}

export interface Ad {
  id: string;
  externalId: string;
  adSetId: string;
  campaignId: string;
  platform: AdPlatform;
  name: string;
  status: CampaignStatus;
  format: 'image' | 'video' | 'carousel' | 'collection' | 'stories';
  previewUrl?: string;
  thumbnailUrl?: string;
  metrics: CampaignMetrics;
  lastSyncAt?: Date;
}

// ============================================
// UTMs Y ATRIBUCIÓN
// ============================================

export interface UTMCapture {
  id: string;
  sessionId: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  landingPage?: string;
  referrer?: string;
  userAgent?: string;
  ipAddress?: string;
  countryCode?: string;
  capturedAt: Date;
}

export interface UTMStats {
  utm: string;
  value: string;
  sales: number;
  revenue: number;
  spend: number;
  profit: number;
  roas: number;
  cpa: number;
  conversionRate: number;
}

// ============================================
// VENTAS Y TRANSACCIONES
// ============================================

export type SaleStatus = 'pending' | 'approved' | 'refunded' | 'chargeback' | 'cancelled';
export type PaymentMethod =
  | 'pse'
  | 'credit_card'
  | 'debit_card'
  | 'efecty'
  | 'baloto'
  | 'nequi'
  | 'daviplata'
  | 'bank_transfer'
  | 'payphone'      // Ecuador
  | 'webpay'        // Chile
  | 'khipu'         // Chile
  | 'mercadopago'
  | 'paypal'
  | 'other';

export type SalePlatform =
  | 'hotmart'
  | 'kiwify'
  | 'eduzz'
  | 'monetizze'
  | 'shopify'
  | 'woocommerce'
  | 'tiendanube'
  | 'vtex'
  | 'mercadolibre'
  | 'manual';

export interface Sale {
  id: string;
  externalId?: string;
  platform: SalePlatform;

  // Producto
  productId?: string;
  productName: string;

  // Valores
  amount: number;
  currency: string;
  status: SaleStatus;
  paymentMethod: PaymentMethod;

  // Cliente
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  customerCountry?: string;

  // Atribución UTM
  utmCaptureId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;

  // Atribución Ads
  adAccountId?: string;
  campaignId?: string;
  adSetId?: string;
  adId?: string;

  soldAt: Date;
  createdAt: Date;
}

// ============================================
// WEBHOOKS
// ============================================

export interface WebhookEndpoint {
  id: string;
  name: string;
  platform: SalePlatform;
  url: string;
  secretKey: string;
  isActive: boolean;
  lastReceivedAt?: Date;
  successCount: number;
  errorCount: number;
  createdAt: Date;
}

export interface WebhookLog {
  id: string;
  endpointId: string;
  payload: Record<string, unknown>;
  headers: Record<string, string>;
  status: 'success' | 'error' | 'ignored';
  errorMessage?: string;
  processedAt: Date;
}

// ============================================
// REGLAS DE AUTOMATIZACIÓN
// ============================================

export type RuleMetric =
  | 'spend'
  | 'cpa'
  | 'roas'
  | 'ctr'
  | 'cpc'
  | 'conversions'
  | 'impressions'
  | 'frequency';

export type RuleOperator =
  | 'greater_than'
  | 'less_than'
  | 'equal'
  | 'between'
  | 'not_equal';

export type RuleAction =
  | 'pause'
  | 'activate'
  | 'notify_email'
  | 'notify_whatsapp'
  | 'adjust_budget';

export interface RuleCondition {
  metric: RuleMetric;
  operator: RuleOperator;
  value: number;
  value2?: number; // Para "between"
}

export interface AutomationRule {
  id: string;
  name: string;
  platform: AdPlatform;
  appliesTo: 'campaigns' | 'adsets' | 'ads';
  targetIds?: string[]; // IDs específicos o vacío para todos

  conditions: RuleCondition[];
  conditionLogic: 'and' | 'or';

  actions: {
    type: RuleAction;
    value?: number | string;
  }[];

  frequency: 'hourly' | 'every_3h' | 'every_6h' | 'every_12h' | 'daily';
  analysisWindow: 'today' | 'yesterday' | 'last_3_days' | 'last_7_days' | 'this_month';

  isActive: boolean;
  lastRunAt?: Date;
  nextRunAt?: Date;
  executionCount: number;

  createdAt: Date;
}

export interface RuleExecution {
  id: string;
  ruleId: string;
  triggeredBy: string; // Campaña/AdSet/Ad que lo disparó
  conditionsMet: RuleCondition[];
  actionsTaken: string[];
  status: 'success' | 'partial' | 'error';
  errorMessage?: string;
  executedAt: Date;
}

// ============================================
// GASTOS Y COSTOS
// ============================================

export type ExpenseCategory =
  | 'ads'           // Publicidad (automático)
  | 'tools'         // Herramientas y software
  | 'team'          // Freelancers y equipo
  | 'infrastructure'// Infraestructura
  | 'logistics'     // Logística y envíos
  | 'commissions'   // Comisiones
  | 'other';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: string;
  expenseType: 'one_time' | 'recurring_monthly' | 'recurring_weekly';
  expenseDate: Date;
  createdAt: Date;
}

export interface ProductCost {
  id: string;
  productId?: string;
  productName: string;
  salePrice: number;
  cost: number;
  marginPercent: number;
  currency: string;
}

export interface Tax {
  id: string;
  countryCode: 'CO' | 'CL' | 'EC';
  name: string;
  percentage: number;
  isActive: boolean;
}

export interface PaymentFee {
  id: string;
  paymentMethod: PaymentMethod;
  feeType: 'percentage' | 'fixed';
  feeValue: number;
  countryCode?: string;
}

// ============================================
// PÍXELES
// ============================================

export type PixelEvent =
  | 'PageView'
  | 'ViewContent'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'Purchase'
  | 'Lead'
  | 'CompleteRegistration';

export interface Pixel {
  id: string;
  name: string;
  platform: AdPlatform;
  pixelId: string;
  events: PixelEvent[];
  isActive: boolean;
  lastEventAt?: Date;
  createdAt: Date;
}

// ============================================
// DASHBOARD Y MÉTRICAS AGREGADAS
// ============================================

export interface DashboardMetrics {
  // Ingresos y Gastos
  revenue: number;
  adSpend: number;
  otherExpenses: number;
  profit: number;
  profitMargin: number;

  // Métricas de Rendimiento
  roas: number;
  roi: number;
  cpa: number;
  arpu: number; // Average Revenue Per User

  // Ventas
  totalSales: number;
  pendingSales: number;
  approvedSales: number;
  refundedSales: number;
  chargebackSales: number;
  approvalRate: number;

  // Conversaciones (WhatsApp)
  totalConversations: number;
  costPerConversation: number;
  conversationToSaleRate: number;

  // Comparación con período anterior
  revenueChange: number;
  spendChange: number;
  roasChange: number;
  salesChange: number;
}

export interface SalesByPaymentMethod {
  method: PaymentMethod;
  count: number;
  amount: number;
  percentage: number;
}

export interface SalesByPlatform {
  platform: SalePlatform;
  count: number;
  amount: number;
  percentage: number;
}

// ============================================
// FILTROS Y CONFIGURACIÓN
// ============================================

export interface MarketingFilters {
  dateRange: {
    start: Date;
    end: Date;
    preset?: 'today' | 'yesterday' | 'last_7_days' | 'this_month' | 'last_month' | 'custom';
  };
  platforms: AdPlatform[];
  accounts: string[];
  trafficSource?: 'organic' | 'paid' | 'direct' | 'referral';
  products?: string[];
}

export interface MarketingConfig {
  currency: 'COP' | 'USD' | 'CLP';
  timezone: string;
  calculateInterests: boolean;
  hideValues: boolean;
  theme: 'light' | 'dark' | 'system';
}

// ============================================
// OAUTH
// ============================================

export interface OAuthConfig {
  platform: AdPlatform;
  clientId: string;
  redirectUri: string;
  scopes: string[];
}

export interface OAuthResult {
  platform: AdPlatform;
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  adAccounts: AdAccount[];
}

export interface OAuthError {
  platform: AdPlatform;
  code: string;
  message: string;
}
