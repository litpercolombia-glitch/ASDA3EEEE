// components/marketing/index.ts
// Exports del módulo de Marketing

// Componentes principales
export { MarketingTab, MarketingModule, MarketingDashboard } from './MarketingTab';
export { PlatformConnector, PlatformConnectorList, PlatformConnectionStatus } from './shared/PlatformConnector';

// Re-export del store
export { useMarketingStore, useMarketingConnection, useMarketingMetrics } from '../../stores/marketingStore';

// Re-export de tipos
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
} from '../../types/marketing.types';
