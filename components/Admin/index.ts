// ============================================
// LITPER PRO - ADMIN COMPONENTS
// Exportaciones del Panel de Administración
// ============================================

// ============================================
// NUEVO: AdminChat con Skills (RECOMENDADO)
// ============================================
// Sistema de chat con skills tipo Claude Code
// Reemplaza los paneles anteriores con una interfaz unificada
export { AdminChat } from '../AdminChat';

// ============================================
// LEGACY: Paneles anteriores (deprecados)
// ============================================
// Se mantienen por compatibilidad pero usar AdminChat para nuevos desarrollos
/** @deprecated Usar AdminChat en su lugar */
export { AdminPanel } from './AdminPanel';
/** @deprecated Usar AdminChat en su lugar */
export { AdminPanelPro } from './AdminPanelPro';
/** @deprecated Usar AdminChat en su lugar */
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

// Default export - AdminChat es el nuevo sistema recomendado
export { AdminChat as default } from '../AdminChat';
