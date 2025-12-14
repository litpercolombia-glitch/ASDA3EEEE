// ============================================
// LITPER PRO - UI COMPONENTS
// ============================================

export { LoadingSpinner } from './LoadingSpinner';
export { Input } from './Input';
export { DateFilter } from './DateFilter';
export { ErrorBoundary } from './ErrorBoundary';
export { Toast, ToastContainer } from './Toast';
export { Button } from './Button';
export { Modal } from './Modal';
export { SessionManager } from './SessionManager';
export { DocumentAnalysisPanel } from './DocumentAnalysisPanel';
export { LoadHistoryPanel, LoadHistoryButton, saveLoadEntry, getLoadEntries, deleteLoadEntry, toggleFavorite } from './LoadHistoryPanel';

// Skeleton Loading Components
export {
  Skeleton,
  CardSkeleton,
  StatsCardSkeleton,
  TableRowSkeleton,
  TableSkeleton,
  DashboardSkeleton,
  ListItemSkeleton,
  GuideCardSkeleton,
  NotificationSkeleton,
  ChartSkeleton,
  ProfileSkeleton,
  LoadingOverlay,
  InlineLoader,
  PulseDots,
} from './Skeleton';

// ============================================
// NUEVOS COMPONENTES - SISTEMA PRO
// ============================================

// Sistema de Fuentes de Datos
export { DataSourceSelector, GuiaTimeline, DiscrepanciesPanel } from './DataSourceSelector';

// Configurador de Excel (Protegido con contraseña)
export { ExcelConfigurator } from './ExcelConfigurator';

// Personalizador de Vista
export {
  QuickViewSelector,
  DensitySelector,
  ColumnSelector,
  ColorSchemeSelector,
  PresetSelector,
  ViewCustomizerPanel,
} from './ViewCustomizer';

// Asistente IA Sidebar (Estilo Shopify)
export { AISidebar } from './AISidebar';
export type { AICommand } from './AISidebar';
