// services/integrations/index.ts
// Exportaciones del módulo de integraciones

export { integrationManager } from './IntegrationManager';
export { unifiedDataService } from './UnifiedDataService';

// Providers
export { BaseAIProvider } from './providers/BaseAIProvider';
export { ChateaProvider } from './providers/ChateaProvider';
export { ClaudeProvider } from './providers/ClaudeProvider';

// Types
export type {
  AIProviderType,
  AIProviderConfig,
  AIProviderStatus,
  DataConnectionType,
  DataConnectionConfig,
  AIFunction,
  AIFunctionAssignment,
  IntegrationsConfig,
  AIMessage,
  AIResponse,
  ChateaConfig,
  ChateaCustomer,
  ChateaOrder,
  ChateaProduct,
  ChateaChat,
  ChateaChatMessage,
  ChateaCampaign,
  ChateaSegment,
  ChateaTemplate,
  ChateaAnalytics,
  Customer360,
  ShipmentReference,
  AlertReference,
} from '../../types/integrations';
