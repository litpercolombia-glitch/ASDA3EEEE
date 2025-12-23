// ============================================
// LITPER PRO - ADMIN COMPONENTS
// Exportaciones del Panel de Administración
// ============================================

// Panels principales
export { AdminPanel } from './AdminPanel';
export { AdminPanelPro } from './AdminPanelPro';
export { AdminPanelUltimate } from './AdminPanelUltimate';

// Layout
export { AdminLayout } from './AdminLayout';
export type { AdminSection } from './AdminLayout';

// Command Center
export { CommandCenter } from './CommandCenter';

// Analytics
export { AnalyticsDashboard } from './AnalyticsDashboard';

// Semáforo Inteligente
export { SemaforoInteligente } from './SemaforoInteligente';

// IA Copilot
export { IACopilot } from './IACopilot';

// Reports Studio
export { ReportsStudio } from './ReportsStudio';

// Rules Engine
export { RulesEngine } from './RulesEngine';

// Finance Center
export { FinanceDashboard } from './FinanceCenter';
export { IncomeManager } from './FinanceCenter';
export { ExpensesManager } from './FinanceCenter';
export { ProfitLossReport } from './FinanceCenter';
export { FinancialHistory } from './FinanceCenter';

// Security Center
export { SecurityDashboard } from './SecurityCenter';

// CRM Center
export { CRMDashboard } from './CRMCenter';

// Default export - El panel más reciente
export { AdminPanelUltimate as default } from './AdminPanelUltimate';
