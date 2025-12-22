// stores/proAssistantStore.ts
// Store Zustand para el Asistente PRO de Litper
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// INTERFACES Y TIPOS
// ============================================

export interface ProMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  action?: {
    type: string;
    label: string;
    data: any;
    status: 'pending' | 'executing' | 'completed' | 'error';
    result?: any;
  };
  suggestions?: string[];
  attachments?: {
    type: 'chart' | 'table' | 'card' | 'list';
    data: any;
  }[];
}

export interface ProKnowledge {
  id: string;
  type: 'document' | 'url' | 'video' | 'text';
  title: string;
  content: string;
  summary: string;
  tags: string[];
  createdAt: Date;
  source: string;
  metadata?: {
    pages?: number;
    words?: number;
    duration?: string;
    insights?: string[];
  };
}

export interface ProTask {
  id: string;
  name: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'error' | 'scheduled';
  progress: number;
  result?: any;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  scheduledFor?: Date;
  icon?: string;
}

export interface ProRecommendation {
  id: string;
  type: 'urgent' | 'insight' | 'alert' | 'tip';
  title: string;
  description: string;
  actions: { label: string; action: string }[];
  createdAt: Date;
  dismissed: boolean;
  data?: any;
}

// Modelos de IA disponibles
export type AIModel = 'claude' | 'gemini' | 'openai';
export type ChatMode = 'litper' | 'chateapro';

export interface AIModelConfig {
  model: AIModel;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

export interface ChateaProConfig {
  webhookUrl: string;
  apiKey: string;
  enabled: boolean;
  autoSync: boolean;
}

export interface ProConfig {
  assistantName: string;
  voice: 'sofia' | 'carlos' | 'lucia';
  language: 'es-CO' | 'es-CL' | 'es-EC';
  // Configuración de IA
  aiModel: AIModel;
  aiSettings: {
    claude: AIModelConfig;
    gemini: AIModelConfig;
    openai: AIModelConfig;
  };
  // Modo de chat activo
  chatMode: ChatMode;
  // Configuración de Chatea Pro
  chateaPro: ChateaProConfig;
  notifications: {
    criticalAlerts: boolean;
    unresolvedNovelties: boolean;
    officeReclaims: boolean;
    newGuides: boolean;
    autoReports: boolean;
  };
  permissions: {
    canExecuteReports: boolean;
    canFilterGuides: boolean;
    canScheduleCalls: boolean;
    canSendWhatsApp: boolean;
    canModifyOrders: boolean;
  };
  appearance: {
    position: 'bottom-right' | 'bottom-left';
    theme: 'dark' | 'light' | 'auto';
  };
}

// ============================================
// ESTADO DEL STORE
// ============================================

interface ProAssistantState {
  // UI State
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isMaximized: boolean;
  setIsMaximized: (maximized: boolean) => void;
  notifications: number;
  setNotifications: (count: number) => void;
  incrementNotifications: () => void;
  clearNotifications: () => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  activeTab: 'chat' | 'metrics' | 'knowledge' | 'tasks' | 'config';
  setActiveTab: (tab: 'chat' | 'metrics' | 'knowledge' | 'tasks' | 'config') => void;

  // Chat State
  messages: ProMessage[];
  addMessage: (message: Omit<ProMessage, 'id' | 'timestamp'>) => void;
  updateMessage: (id: string, updates: Partial<ProMessage>) => void;
  clearMessages: () => void;
  isTyping: boolean;
  setIsTyping: (typing: boolean) => void;

  // Knowledge State
  knowledge: ProKnowledge[];
  addKnowledge: (item: Omit<ProKnowledge, 'id' | 'createdAt'>) => void;
  updateKnowledge: (id: string, updates: Partial<ProKnowledge>) => void;
  removeKnowledge: (id: string) => void;
  searchKnowledge: (query: string) => ProKnowledge[];
  isProcessingKnowledge: boolean;
  setIsProcessingKnowledge: (processing: boolean) => void;

  // Tasks State
  tasks: ProTask[];
  addTask: (task: Omit<ProTask, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<ProTask>) => void;
  removeTask: (id: string) => void;
  clearCompletedTasks: () => void;

  // Recommendations State
  recommendations: ProRecommendation[];
  addRecommendation: (rec: Omit<ProRecommendation, 'id' | 'createdAt' | 'dismissed'>) => void;
  dismissRecommendation: (id: string) => void;
  clearRecommendations: () => void;

  // Config State
  config: ProConfig;
  updateConfig: (updates: Partial<ProConfig>) => void;
  updateNotificationSettings: (updates: Partial<ProConfig['notifications']>) => void;
  updatePermissions: (updates: Partial<ProConfig['permissions']>) => void;

  // AI Model Selection
  setAIModel: (model: AIModel) => void;
  updateAISettings: (model: AIModel, settings: Partial<AIModelConfig>) => void;

  // Chat Mode
  setChatMode: (mode: ChatMode) => void;

  // Chatea Pro
  updateChateaProConfig: (config: Partial<ChateaProConfig>) => void;

  // Mensajes por modo de chat
  litperMessages: ProMessage[];
  chateaProMessages: ProMessage[];
  addLitperMessage: (message: Omit<ProMessage, 'id' | 'timestamp'>) => void;
  addChateaProMessage: (message: Omit<ProMessage, 'id' | 'timestamp'>) => void;
  clearLitperMessages: () => void;
  clearChateaProMessages: () => void;

  // Context
  shipmentsContext: any[];
  setShipmentsContext: (shipments: any[]) => void;

  // Quick Actions
  executeQuickAction: (actionId: string) => Promise<void>;
}

// ============================================
// CREAR STORE
// ============================================

const generateId = () =>
  crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useProAssistantStore = create<ProAssistantState>()(
  persist(
    (set, get) => ({
      // ========== UI State ==========
      isOpen: false,
      setIsOpen: (open) => set({ isOpen: open }),

      isMaximized: false,
      setIsMaximized: (maximized) => set({ isMaximized: maximized }),

      notifications: 0,
      setNotifications: (count) => set({ notifications: count }),
      incrementNotifications: () => set((state) => ({ notifications: state.notifications + 1 })),
      clearNotifications: () => set({ notifications: 0 }),

      isProcessing: false,
      setIsProcessing: (processing) => set({ isProcessing: processing }),

      activeTab: 'chat',
      setActiveTab: (tab) => set({ activeTab: tab }),

      // ========== Chat State ==========
      messages: [
        {
          id: 'welcome',
          role: 'assistant' as const,
          content: `Hola! Soy tu asistente PRO de Litper.

Puedo ayudarte con:
- **Logistica** - Ver guias, novedades, estados
- **Reportes** - Generar analisis y metricas
- **Acciones** - Programar llamadas, enviar mensajes
- **Conocimiento** - Consultar base de datos
- **Ejecutar** - Tareas automaticas en la app

¿En qué te ayudo?`,
          timestamp: new Date(),
          suggestions: ['Ver guias con novedad', 'Reporte del dia', 'Guias en Reclamo Oficina'],
        },
      ],

      addMessage: (message) =>
        set((state) => ({
          messages: [
            ...state.messages,
            {
              ...message,
              id: generateId(),
              timestamp: new Date(),
            },
          ],
        })),

      updateMessage: (id, updates) =>
        set((state) => ({
          messages: state.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        })),

      clearMessages: () =>
        set({
          messages: [
            {
              id: 'welcome',
              role: 'assistant' as const,
              content: `Hola! Soy tu asistente PRO de Litper. ¿En qué te ayudo?`,
              timestamp: new Date(),
              suggestions: ['Ver guias con novedad', 'Reporte del dia', 'Guias en Reclamo Oficina'],
            },
          ],
        }),

      isTyping: false,
      setIsTyping: (typing) => set({ isTyping: typing }),

      // ========== Knowledge State ==========
      knowledge: [],

      addKnowledge: (item) =>
        set((state) => ({
          knowledge: [
            {
              ...item,
              id: generateId(),
              createdAt: new Date(),
            },
            ...state.knowledge,
          ],
        })),

      updateKnowledge: (id, updates) =>
        set((state) => ({
          knowledge: state.knowledge.map((k) => (k.id === id ? { ...k, ...updates } : k)),
        })),

      removeKnowledge: (id) =>
        set((state) => ({
          knowledge: state.knowledge.filter((k) => k.id !== id),
        })),

      searchKnowledge: (query) => {
        const { knowledge } = get();
        const lowerQuery = query.toLowerCase();
        return knowledge.filter(
          (k) =>
            k.title.toLowerCase().includes(lowerQuery) ||
            k.content.toLowerCase().includes(lowerQuery) ||
            k.summary.toLowerCase().includes(lowerQuery) ||
            k.tags.some((t) => t.toLowerCase().includes(lowerQuery))
        );
      },

      isProcessingKnowledge: false,
      setIsProcessingKnowledge: (processing) => set({ isProcessingKnowledge: processing }),

      // ========== Tasks State ==========
      tasks: [],

      addTask: (task) =>
        set((state) => ({
          tasks: [
            {
              ...task,
              id: generateId(),
              createdAt: new Date(),
            },
            ...state.tasks,
          ],
        })),

      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),

      removeTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),

      clearCompletedTasks: () =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.status !== 'completed'),
        })),

      // ========== Recommendations State ==========
      recommendations: [],

      addRecommendation: (rec) =>
        set((state) => ({
          recommendations: [
            {
              ...rec,
              id: generateId(),
              createdAt: new Date(),
              dismissed: false,
            },
            ...state.recommendations,
          ],
        })),

      dismissRecommendation: (id) =>
        set((state) => ({
          recommendations: state.recommendations.map((r) =>
            r.id === id ? { ...r, dismissed: true } : r
          ),
        })),

      clearRecommendations: () => set({ recommendations: [] }),

      // ========== Config State ==========
      config: {
        assistantName: 'Litper PRO',
        voice: 'sofia',
        language: 'es-CO',
        // Configuración de IA
        aiModel: 'claude' as AIModel,
        aiSettings: {
          claude: {
            model: 'claude' as AIModel,
            temperature: 0.7,
            maxTokens: 4096,
            systemPrompt: 'Eres un experto en logística de última milla en Colombia. Ayudas con guías, envíos, novedades y análisis.',
          },
          gemini: {
            model: 'gemini' as AIModel,
            temperature: 0.8,
            maxTokens: 4096,
            systemPrompt: 'Eres un asistente de logística con capacidades de visión e imágenes.',
          },
          openai: {
            model: 'openai' as AIModel,
            temperature: 0.7,
            maxTokens: 4096,
            systemPrompt: 'Eres un asistente de logística profesional para el mercado colombiano.',
          },
        },
        chatMode: 'litper' as ChatMode,
        chateaPro: {
          webhookUrl: '',
          apiKey: '',
          enabled: false,
          autoSync: false,
        },
        notifications: {
          criticalAlerts: true,
          unresolvedNovelties: true,
          officeReclaims: true,
          newGuides: false,
          autoReports: true,
        },
        permissions: {
          canExecuteReports: true,
          canFilterGuides: true,
          canScheduleCalls: true,
          canSendWhatsApp: false,
          canModifyOrders: false,
        },
        appearance: {
          position: 'bottom-right',
          theme: 'dark',
        },
      },

      updateConfig: (updates) =>
        set((state) => ({
          config: { ...state.config, ...updates },
        })),

      updateNotificationSettings: (updates) =>
        set((state) => ({
          config: {
            ...state.config,
            notifications: { ...state.config.notifications, ...updates },
          },
        })),

      updatePermissions: (updates) =>
        set((state) => ({
          config: {
            ...state.config,
            permissions: { ...state.config.permissions, ...updates },
          },
        })),

      // ========== AI Model Selection ==========
      setAIModel: (model) =>
        set((state) => ({
          config: { ...state.config, aiModel: model },
        })),

      updateAISettings: (model, settings) =>
        set((state) => ({
          config: {
            ...state.config,
            aiSettings: {
              ...state.config.aiSettings,
              [model]: { ...state.config.aiSettings[model], ...settings },
            },
          },
        })),

      // ========== Chat Mode ==========
      setChatMode: (mode) =>
        set((state) => ({
          config: { ...state.config, chatMode: mode },
        })),

      // ========== Chatea Pro Config ==========
      updateChateaProConfig: (updates) =>
        set((state) => ({
          config: {
            ...state.config,
            chateaPro: { ...state.config.chateaPro, ...updates },
          },
        })),

      // ========== Mensajes Litper (App Data) ==========
      litperMessages: [
        {
          id: 'litper-welcome',
          role: 'assistant' as const,
          content: `Hola! Soy tu asistente de **Litper Data**.

Tengo acceso a toda la información de la app:
- **Guías** - Estados, novedades, seguimiento
- **Cargas** - Historial de cargas e importaciones
- **Estadísticas** - Métricas y reportes
- **Análisis** - Predicciones y patrones

¿Qué información necesitas?`,
          timestamp: new Date(),
          suggestions: ['Ver guías con novedad', 'Reporte del día', 'Análisis por transportadora'],
        },
      ],

      addLitperMessage: (message) =>
        set((state) => ({
          litperMessages: [
            ...state.litperMessages,
            {
              ...message,
              id: generateId(),
              timestamp: new Date(),
            },
          ],
        })),

      clearLitperMessages: () =>
        set({
          litperMessages: [
            {
              id: 'litper-welcome',
              role: 'assistant' as const,
              content: `Hola! Soy tu asistente de **Litper Data**. ¿Qué información necesitas?`,
              timestamp: new Date(),
              suggestions: ['Ver guías con novedad', 'Reporte del día', 'Análisis por transportadora'],
            },
          ],
        }),

      // ========== Mensajes Chatea Pro (Webhooks/API) ==========
      chateaProMessages: [
        {
          id: 'chateapro-welcome',
          role: 'assistant' as const,
          content: `Hola! Soy tu asistente de **Chatea Pro**.

Puedo ayudarte con:
- **Webhooks** - Configurar y probar endpoints
- **API** - Gestionar integraciones
- **Automatizaciones** - Flujos automáticos
- **Mensajería** - WhatsApp, SMS, notificaciones

Configura tu API Key en la pestaña de Config para empezar.`,
          timestamp: new Date(),
          suggestions: ['Configurar webhook', 'Ver estado API', 'Probar conexión'],
        },
      ],

      addChateaProMessage: (message) =>
        set((state) => ({
          chateaProMessages: [
            ...state.chateaProMessages,
            {
              ...message,
              id: generateId(),
              timestamp: new Date(),
            },
          ],
        })),

      clearChateaProMessages: () =>
        set({
          chateaProMessages: [
            {
              id: 'chateapro-welcome',
              role: 'assistant' as const,
              content: `Hola! Soy tu asistente de **Chatea Pro**. ¿Qué necesitas configurar?`,
              timestamp: new Date(),
              suggestions: ['Configurar webhook', 'Ver estado API', 'Probar conexión'],
            },
          ],
        }),

      // ========== Context ==========
      shipmentsContext: [],
      setShipmentsContext: (shipments) => set({ shipmentsContext: shipments }),

      // ========== Quick Actions ==========
      executeQuickAction: async (actionId) => {
        const { addTask, updateTask, addMessage } = get();

        const taskId = generateId();

        // Crear tarea
        addTask({
          name: actionId,
          status: 'running',
          progress: 0,
        });

        // Simular ejecucion
        for (let i = 0; i <= 100; i += 10) {
          await new Promise((r) => setTimeout(r, 200));
          updateTask(taskId, { progress: i });
        }

        updateTask(taskId, {
          status: 'completed',
          progress: 100,
          completedAt: new Date(),
        });

        addMessage({
          role: 'assistant',
          content: `Tarea "${actionId}" completada exitosamente.`,
        });
      },
    }),
    {
      name: 'litper-pro-assistant-v3',
      partialize: (state) => ({
        messages: state.messages.slice(-100),
        litperMessages: state.litperMessages.slice(-100),
        chateaProMessages: state.chateaProMessages.slice(-100),
        knowledge: state.knowledge,
        tasks: state.tasks.filter((t) => t.status !== 'completed').slice(0, 50),
        config: state.config,
      }),
    }
  )
);

export default useProAssistantStore;
