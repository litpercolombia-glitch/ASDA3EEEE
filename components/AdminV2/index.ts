/**
 * AdminV2 - Chat-first Admin Panel (PRO VERSION)
 *
 * Interfaz de administracion profesional con:
 * - Chat nivel Claude.ai
 * - Skills Store visual
 * - Command Palette (Ctrl+K)
 * - Persistencia en Supabase
 * - Integracion con IA
 */

// ============================================
// MAIN COMPONENTS
// ============================================

export { AdminPanelV2Pro } from './AdminPanelV2Pro';
export { AdminPanelV2 } from './AdminPanelV2';
export { default } from './AdminPanelV2Pro'; // Pro as default

// ============================================
// LAYOUT COMPONENTS
// ============================================

export { Sidebar } from './Layout/Sidebar';
export { CommandPalette } from './Layout/CommandPalette';

// ============================================
// CHAT COMPONENTS
// ============================================

export { ChatInterfaceV2 } from './Chat/ChatInterfaceV2';
export { ChatInterface } from './chat/ChatInterface';
export { MessageBubble } from './Chat/MessageBubble';
export { InputArea } from './Chat/InputArea';
export { QuickActions, QuickActionsHorizontal } from './Chat/QuickActions';
export { TypingIndicator, ThinkingIndicator } from './Chat/TypingIndicator';

// ============================================
// SKILLS COMPONENTS
// ============================================

export { SkillsStore } from './Skills/SkillsStore';

// ============================================
// ARTIFACT VIEWERS
// ============================================

export { TableArtifact } from './Artifacts/TableArtifact';
export type { TableArtifactProps, TableColumn } from './Artifacts/TableArtifact';

export { ChartArtifact } from './Artifacts/ChartArtifact';
export type { ChartArtifactProps, ChartType, ChartDataPoint, ChartSeries } from './Artifacts/ChartArtifact';

export { DashboardArtifact } from './Artifacts/DashboardArtifact';
export type { DashboardArtifactProps, KPIMetric } from './Artifacts/DashboardArtifact';

// ============================================
// UI COMPONENTS
// ============================================

export { Button } from './UI/Button';
export type { ButtonProps } from './UI/Button';

export { Input } from './UI/Input';
export type { InputProps } from './UI/Input';

export { Card, CardHeader, CardContent, CardFooter } from './UI/Card';
export type { CardProps, CardHeaderProps, CardContentProps, CardFooterProps } from './UI/Card';

export { Badge, SkillBadge } from './UI/Badge';
export type { BadgeProps, SkillBadgeProps } from './UI/Badge';

export { Tooltip } from './UI/Tooltip';
export type { TooltipProps } from './UI/Tooltip';

export { Avatar, AssistantAvatar } from './UI/Avatar';
export type { AvatarProps } from './UI/Avatar';

export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonMessage,
  SkeletonCard,
  SkeletonTable,
} from './UI/Skeleton';

// ============================================
// SKILLS REGISTRY & TYPES
// ============================================

export { SkillsRegistry } from './skills/SkillsRegistry';
export * from './skills/types';

// ============================================
// HOOKS
// ============================================

export { useChat } from './hooks/useChat';

// ============================================
// INDIVIDUAL SKILLS - LOGISTICS
// ============================================

export { TrackShipmentSkill } from './skills/logistics/TrackShipment.skill';
export { GenerateReportSkill } from './skills/logistics/GenerateReport.skill';
export { BulkStatusUpdateSkill } from './skills/logistics/BulkStatusUpdate.skill';
export { AnalyzeCarrierSkill } from './skills/logistics/AnalyzeCarrier.skill';
export { CreateTicketSkill } from './skills/logistics/CreateTicket.skill';
// New skills
export { default as CityAnalysisSkill } from './skills/logistics/CityAnalysis.skill';
export { default as ProblemsDetectionSkill } from './skills/logistics/ProblemsDetection.skill';

// ============================================
// INDIVIDUAL SKILLS - FINANCE
// ============================================

export { FinancialReportSkill } from './skills/finance/FinancialReport.skill';
export { default as ProfitAnalysisSkill } from './skills/finance/ProfitAnalysis.skill';

// ============================================
// INDIVIDUAL SKILLS - ANALYTICS
// ============================================

export { DashboardMetricsSkill } from './skills/analytics/DashboardMetrics.skill';
export { default as TrendAnalysisSkill } from './skills/analytics/TrendAnalysis.skill';

// ============================================
// INDIVIDUAL SKILLS - AUTOMATION
// ============================================

export { ScheduleTaskSkill } from './skills/automation/ScheduleTask.skill';

// ============================================
// INDIVIDUAL SKILLS - COMMUNICATION
// ============================================

export { SendWhatsAppSkill } from './skills/communication/SendWhatsApp.skill';
