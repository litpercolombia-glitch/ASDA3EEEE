// ============================================
// TIPOS E INTERFACES - ADMIN CHAT
// ============================================

// Mensaje en el chat
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  data?: any;
  actions?: ActionButton[];
  error?: boolean;
  skillUsed?: string;
  isLoading?: boolean;
}

// Botón de acción en mensajes
export interface ActionButton {
  label: string;
  action: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  params?: Record<string, any>;
}

// Resultado de un skill
export interface SkillResult {
  type: 'text' | 'table' | 'chart' | 'card' | 'alert' | 'report' | 'list';
  title?: string;
  content?: string;
  data?: any;
  actions?: ActionButton[];
  error?: boolean;
  metadata?: Record<string, any>;
}

// Contexto para ejecutar skills
export interface SkillContext {
  params: Record<string, any>;
  rawInput: string;
  user?: {
    id: string;
    name: string;
    role: string;
  };
  api: {
    get: (url: string, params?: Record<string, any>) => Promise<any>;
    post: (url: string, data?: any) => Promise<any>;
  };
  previousMessages?: Message[];
}

// Definición de un skill
export interface Skill {
  name: string;
  aliases?: string[];
  icon: string;
  description: string;
  category: SkillCategory;
  subcommands?: Record<string, string>;
  parameters?: SkillParameter[];
  examples: string[];
  execute: (ctx: SkillContext) => Promise<SkillResult>;
}

// Parámetro de skill
export interface SkillParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'select';
  description?: string;
  required?: boolean;
  default?: any;
  options?: string[];
}

// Categorías de skills
export type SkillCategory =
  | 'reportes'
  | 'operaciones'
  | 'finanzas'
  | 'clientes'
  | 'configuracion'
  | 'ayuda';

// Comando parseado
export interface ParsedCommand {
  isSkill: boolean;
  skillName?: string;
  subcommand?: string;
  params: Record<string, any>;
  rawArgs: string;
}

// Estado del chat
export interface ChatState {
  messages: Message[];
  isProcessing: boolean;
  currentSkill?: string;
  error?: string;
}

// Datos para renderizadores
export interface TableData {
  headers: string[];
  rows: any[][];
  footer?: string[];
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }[];
}

export interface CardData {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon?: string;
  color?: string;
}

export interface AlertData {
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  actions?: ActionButton[];
}

// Props para componentes
export interface ChatWindowProps {
  messages: Message[];
  isProcessing: boolean;
  onAction: (action: string, params?: Record<string, any>) => void;
}

export interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onVoice?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export interface SkillsBarProps {
  skills: Skill[];
  onSkillClick: (skillName: string) => void;
  recentSkills?: string[];
}

export interface MessageBubbleProps {
  message: Message;
  onAction: (action: string, params?: Record<string, any>) => void;
}
