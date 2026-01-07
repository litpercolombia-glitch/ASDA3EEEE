// types/marketing.types.ts
// Sistema de Tracking de Marketing Digital

export type AdPlatform = 'meta' | 'google' | 'tiktok';

export interface AdAccount {
  id: string;
  externalId: string;
  platform: AdPlatform;
  name: string;
  currency: string;
  status: 'active' | 'disabled' | 'pending';
  isSelected: boolean;
}

export interface Campaign {
  id: string;
  externalId: string;
  accountId: string;
  platform: AdPlatform;
  name: string;
  status: 'active' | 'paused' | 'deleted';
  budgetType: 'daily' | 'lifetime';
  budgetAmount: number;
  metrics: CampaignMetrics;
}

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
  roas: number;
  cpa: number;
  ctr: number;
  cpc: number;
}

export interface DashboardMetrics {
  revenue: number;
  adSpend: number;
  profit: number;
  profitMargin: number;
  roas: number;
  roi: number;
  cpa: number;
  totalSales: number;
  pendingSales: number;
  approvedSales: number;
  refundedSales: number;
  approvalRate: number;
  revenueChange: number;
  spendChange: number;
  roasChange: number;
  salesChange: number;
}

export interface SalesByPaymentMethod {
  method: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface OAuthResult {
  platform: AdPlatform;
  accessToken: string;
  refreshToken?: string;
  adAccounts: AdAccount[];
}
