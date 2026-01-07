// services/marketing/index.ts
// Exports del módulo de Marketing

// OAuth
export { oauthManager, sendOAuthSuccess, sendOAuthError } from './oauth/OAuthManager';

// Re-export types
export type {
  AdPlatform,
  AdAccount,
  Campaign,
  AdSet,
  Ad,
  Sale,
  DashboardMetrics,
  MarketingFilters,
  AutomationRule,
  OAuthResult,
} from '../../types/marketing.types';
