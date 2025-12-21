// components/enterprise/index.ts
// Exportaciones centralizadas de componentes Enterprise

// Admin Panel
export { AdminEnterprisePanel } from './AdminEnterprisePanel';

// Finance Dashboard
export { FinanceDashboard } from './FinanceDashboard';

// AI Business Chat
export { AIBusinessChat, AIBusinessChatButton } from './AIBusinessChat';

// Re-export types for convenience
export type { Usuario, Rol, PermisosGranulares } from '../../types/permissions';
export type { Ingreso, Gasto, EstadoResultados } from '../../types/finance';
