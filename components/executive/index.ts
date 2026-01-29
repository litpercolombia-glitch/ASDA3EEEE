/**
 * Executive Dashboard Components Index
 *
 * Exporta todos los componentes del Dashboard Ejecutivo.
 */

// Main Dashboard
export { ExecutiveDashboard, default } from './ExecutiveDashboard';

// KPI Components
export { KPICard, CompactKPICard, LargeKPICard } from './KPICard';
export { KPIGrid, HighlightKPIGrid, SingleRowKPIs } from './KPIGrid';

// Chart Components
export {
  RevenueTrendChart,
  DeliveryTrendChart,
  OperationsFunnelChart,
  StatusDonutChart,
  SparklineChart,
  ComparisonBarChart,
} from './Charts';

// Table Components
export {
  CarrierPerformanceTable,
  CityPerformanceTable,
  CompactCarrierList,
} from './PerformanceTable';

// Alert Components
export {
  AlertsPanel,
  CompactAlertsWidget,
  AlertBanner,
} from './AlertsPanel';

// Activity Feed Components
export {
  ActivityFeedComponent,
  CompactActivityWidget,
  LiveTicker,
} from './ActivityFeed';
