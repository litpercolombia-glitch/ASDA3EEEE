/**
 * AdminV2 - Chat-first Admin Panel
 *
 * Exports all components for the new admin panel
 */

// Main component
export { AdminPanelV2 } from './AdminPanelV2';
export { default } from './AdminPanelV2';

// Chat components
export { ChatInterface } from './chat/ChatInterface';

// Skills
export { SkillsRegistry } from './skills/SkillsRegistry';
export * from './skills/types';

// Hooks
export { useChat } from './hooks/useChat';

// Individual skills - Logistics
export { TrackShipmentSkill } from './skills/logistics/TrackShipment.skill';
export { GenerateReportSkill } from './skills/logistics/GenerateReport.skill';
export { BulkStatusUpdateSkill } from './skills/logistics/BulkStatusUpdate.skill';
export { AnalyzeCarrierSkill } from './skills/logistics/AnalyzeCarrier.skill';
export { CreateTicketSkill } from './skills/logistics/CreateTicket.skill';

// Individual skills - Finance
export { FinancialReportSkill } from './skills/finance/FinancialReport.skill';

// Individual skills - Analytics
export { DashboardMetricsSkill } from './skills/analytics/DashboardMetrics.skill';

// Individual skills - Automation
export { ScheduleTaskSkill } from './skills/automation/ScheduleTask.skill';

// Individual skills - Communication
export { SendWhatsAppSkill } from './skills/communication/SendWhatsApp.skill';
