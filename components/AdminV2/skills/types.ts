/**
 * AdminV2 - Skills Type Definitions
 *
 * Sistema de skills para el chat administrativo
 */

import { LucideIcon } from 'lucide-react';

// ============================================
// SKILL CATEGORIES
// ============================================

export type SkillCategory =
  | 'logistics'
  | 'finance'
  | 'analytics'
  | 'automation'
  | 'communication';

export const SKILL_CATEGORIES: Record<SkillCategory, { label: string; color: string }> = {
  logistics: { label: 'Logistica', color: '#F97316' },
  finance: { label: 'Finanzas', color: '#10B981' },
  analytics: { label: 'Analitica', color: '#6366F1' },
  automation: { label: 'Automatizacion', color: '#8B5CF6' },
  communication: { label: 'Comunicacion', color: '#3B82F6' },
};

// ============================================
// SKILL PARAMETERS
// ============================================

export interface SkillParam {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'select' | 'file';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

// ============================================
// SKILL CONTEXT
// ============================================

export interface SkillContext {
  userId: string;
  projectId?: string;
  conversationId: string;
  filters?: Record<string, any>;
  previousResults?: any[];
}

// ============================================
// SKILL RESULT
// ============================================

export interface SkillResult {
  success: boolean;
  message: string;
  data?: any;
  artifact?: {
    type: ArtifactType;
    title: string;
    content: any;
  };
  suggestedActions?: SuggestedAction[];
  error?: {
    code: string;
    details: string;
  };
}

export interface SuggestedAction {
  label: string;
  skillId: string;
  params?: Record<string, any>;
  icon?: LucideIcon;
}

// ============================================
// SKILL DEFINITION
// ============================================

export type UserRole = 'admin' | 'operator' | 'viewer';

export interface Skill {
  // Identity
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  icon: LucideIcon;
  version: string;

  // Parameters
  requiredParams: SkillParam[];
  optionalParams?: SkillParam[];

  // Permissions
  roles: UserRole[];

  // Execution
  execute: (params: Record<string, any>, context: SkillContext) => Promise<SkillResult>;

  // NLP matching
  keywords: string[];
  examples: string[];

  // Optional UI customization
  form?: React.FC<SkillFormProps>;
  artifactType?: ArtifactType;

  // Metadata
  isEnabled?: boolean;
  isFavorite?: boolean;
  usageCount?: number;
}

export interface SkillFormProps {
  params: SkillParam[];
  values: Record<string, any>;
  onChange: (name: string, value: any) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

// ============================================
// ARTIFACTS
// ============================================

export type ArtifactType =
  | 'table'
  | 'chart'
  | 'form'
  | 'pdf'
  | 'code'
  | 'image'
  | 'markdown'
  | 'json';

export interface Artifact {
  id: string;
  type: ArtifactType;
  title: string;
  content: any;
  createdAt: Date;
  messageId: string;
  exportable?: boolean;
  editable?: boolean;
}

// Table artifact content
export interface TableArtifactContent {
  columns: {
    key: string;
    label: string;
    sortable?: boolean;
    width?: string;
  }[];
  rows: Record<string, any>[];
  summary?: Record<string, any>;
}

// Chart artifact content
export interface ChartArtifactContent {
  type: 'bar' | 'line' | 'pie' | 'area';
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      color?: string;
    }[];
  };
  options?: Record<string, any>;
}

// ============================================
// MESSAGES
// ============================================

export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageStatus = 'pending' | 'processing' | 'complete' | 'error';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  status: MessageStatus;

  // Skill execution
  skillId?: string;
  skillParams?: Record<string, any>;

  // Artifact
  artifact?: Artifact;

  // Suggested actions
  suggestedActions?: SuggestedAction[];

  // Error info
  error?: {
    code: string;
    message: string;
  };
}

// ============================================
// CONVERSATION
// ============================================

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  projectId?: string;
}

// ============================================
// PROJECT
// ============================================

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;

  // Persistent context
  context: {
    filters?: Record<string, any>;
    selectedCarriers?: string[];
    dateRange?: {
      start: Date;
      end: Date;
    };
    customData?: Record<string, any>;
  };

  // History
  conversations: Conversation[];
  artifacts: Artifact[];

  // Settings
  enabledSkills?: string[];
  autoSave?: boolean;
}

// ============================================
// USER CONFIG
// ============================================

export interface UserSkillConfig {
  userId: string;
  enabledSkills: string[];
  favoriteSkills: string[];
  customParams: Record<string, Record<string, any>>;
  theme?: 'dark' | 'light';
}

// ============================================
// AUDIT LOG
// ============================================

export interface AuditEntry {
  id: string;
  timestamp: Date;
  userId: string;
  skillId: string;
  params: Record<string, any>;
  result: 'success' | 'error';
  duration: number;
  ipAddress?: string;
}
