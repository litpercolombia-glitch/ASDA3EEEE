// /src/core/inbox/handlers/index.ts
// Exportaciones de handlers

export { handleOrderUpsert } from './orderUpsert';
export { handleStatusUpdate } from './statusUpdate';
export { handleOrderCancelled } from './orderCancelled';
export { handleShippingDelivered } from './shippingDelivered';
export { handleShippingFailed } from './shippingFailed';
export {
  calculateRiskScore,
  detectRiskFactors,
  getRiskRecommendation,
  shouldFlagForReview,
} from './riskEngine';
