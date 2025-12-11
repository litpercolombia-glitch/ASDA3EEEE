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

export interface ProConfig {
  assistantName: string;
  voice: 'sofia' | 'carlos' | 'lucia';
  language: 'es-CO' | 'es-CL' | 'es-EC';
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
// MULTI-CONVERSACIÓN (Sistema de Pestañas)
// ============================================

export interface Conversation {
  id: string;
  title: string;
  messages: ProMessage[];
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
}

// ============================================
// INTERFACES ADICIONALES PARA MÉTRICAS
// ============================================

export interface ProMetrics {
  tasaDevolucion: number;
  tasaMeta: number;
  guiasEnRiesgo: number;
  guiasRescatadas: number;
  dineroSalvado: number;
  potencialRescate: number;
  lastUpdated: Date;
}

export interface ProActiveNotification {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  count?: number;
  timestamp: Date;
  dismissed: boolean;
  actionLabel?: string;
  actionType?: string;
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
  activeTab: 'chat' | 'rescue' | 'knowledge' | 'tasks' | 'config';
  setActiveTab: (tab: 'chat' | 'rescue' | 'knowledge' | 'tasks' | 'config') => void;

  // Multi-Conversación State (Máximo 5 pestañas)
  conversations: Conversation[];
  activeConversationId: string;
  setActiveConversationId: (id: string) => void;
  createConversation: (title?: string) => string;
  closeConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  pinConversation: (id: string) => void;
  getActiveConversation: () => Conversation | undefined;

  // Metrics State
  metrics: ProMetrics;
  updateMetrics: (metrics: Partial<ProMetrics>) => void;
  calculateMetricsFromShipments: () => void;

  // Proactive Notifications
  proactiveNotifications: ProActiveNotification[];
  addProactiveNotification: (notification: Omit<ProActiveNotification, 'id' | 'timestamp' | 'dismissed'>) => void;
  dismissProactiveNotification: (id: string) => void;
  clearProactiveNotifications: () => void;
  generateProactiveAlerts: () => void;

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

  // Context
  shipmentsContext: any[];
  setShipmentsContext: (shipments: any[]) => void;

  // Quick Actions
  executeQuickAction: (actionId: string) => Promise<void>;
}

// ============================================
// CREAR STORE
// ============================================

const generateId = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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

      // ========== Multi-Conversación ==========
      conversations: [
        {
          id: 'default',
          title: 'Chat Principal',
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
              suggestions: [
                'Ver guias con novedad',
                'Reporte del dia',
                'Guias en Reclamo Oficina',
              ],
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
          isPinned: true,
        },
      ],
      activeConversationId: 'default',

      setActiveConversationId: (id) => set({ activeConversationId: id }),

      createConversation: (title) => {
        const { conversations } = get();
        if (conversations.length >= 5) {
          // Cerrar la conversación más antigua no fijada
          const unpinned = conversations.filter(c => !c.isPinned);
          if (unpinned.length > 0) {
            const oldest = unpinned.reduce((a, b) =>
              new Date(a.updatedAt) < new Date(b.updatedAt) ? a : b
            );
            get().closeConversation(oldest.id);
          }
        }

        const id = generateId();
        const newConversation: Conversation = {
          id,
          title: title || `Chat ${conversations.length + 1}`,
          messages: [
            {
              id: generateId(),
              role: 'assistant' as const,
              content: `Nueva conversación iniciada. ¿En qué te ayudo?`,
              timestamp: new Date(),
              suggestions: ['Ver críticos', 'Reporte del día', 'Recomendación IA'],
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
          isPinned: false,
        };

        set((state) => ({
          conversations: [...state.conversations, newConversation],
          activeConversationId: id,
        }));

        return id;
      },

      closeConversation: (id) => {
        const { conversations, activeConversationId } = get();
        if (conversations.length <= 1) return; // No cerrar la última

        const filtered = conversations.filter(c => c.id !== id);
        const newActiveId = id === activeConversationId
          ? filtered[filtered.length - 1].id
          : activeConversationId;

        set({
          conversations: filtered,
          activeConversationId: newActiveId,
        });
      },

      renameConversation: (id, title) => set((state) => ({
        conversations: state.conversations.map(c =>
          c.id === id ? { ...c, title, updatedAt: new Date() } : c
        ),
      })),

      pinConversation: (id) => set((state) => ({
        conversations: state.conversations.map(c =>
          c.id === id ? { ...c, isPinned: !c.isPinned, updatedAt: new Date() } : c
        ),
      })),

      getActiveConversation: () => {
        const { conversations, activeConversationId } = get();
        return conversations.find(c => c.id === activeConversationId);
      },

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
          suggestions: [
            'Ver guias con novedad',
            'Reporte del dia',
            'Guias en Reclamo Oficina',
          ],
        },
      ],

      addMessage: (message) => set((state) => {
        const newMessage = {
          ...message,
          id: generateId(),
          timestamp: new Date(),
        };

        // Añadir al array global de mensajes
        const updatedMessages = [...state.messages, newMessage];

        // Añadir a la conversación activa
        const updatedConversations = state.conversations.map(c =>
          c.id === state.activeConversationId
            ? {
                ...c,
                messages: [...c.messages, newMessage],
                updatedAt: new Date(),
                title: c.title === 'Chat Principal' || c.messages.length <= 1
                  ? (message.role === 'user' && message.content.length < 30
                    ? message.content
                    : c.title)
                  : c.title,
              }
            : c
        );

        return {
          messages: updatedMessages,
          conversations: updatedConversations,
        };
      }),

      updateMessage: (id, updates) => set((state) => ({
        messages: state.messages.map((m) =>
          m.id === id ? { ...m, ...updates } : m
        ),
      })),

      clearMessages: () => set({
        messages: [
          {
            id: 'welcome',
            role: 'assistant' as const,
            content: `Hola! Soy tu asistente PRO de Litper. ¿En qué te ayudo?`,
            timestamp: new Date(),
            suggestions: [
              'Ver guias con novedad',
              'Reporte del dia',
              'Guias en Reclamo Oficina',
            ],
          },
        ],
      }),

      isTyping: false,
      setIsTyping: (typing) => set({ isTyping: typing }),

      // ========== Knowledge State ==========
      knowledge: [],

      addKnowledge: (item) => set((state) => ({
        knowledge: [
          {
            ...item,
            id: generateId(),
            createdAt: new Date(),
          },
          ...state.knowledge,
        ],
      })),

      updateKnowledge: (id, updates) => set((state) => ({
        knowledge: state.knowledge.map((k) =>
          k.id === id ? { ...k, ...updates } : k
        ),
      })),

      removeKnowledge: (id) => set((state) => ({
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

      addTask: (task) => set((state) => ({
        tasks: [
          {
            ...task,
            id: generateId(),
            createdAt: new Date(),
          },
          ...state.tasks,
        ],
      })),

      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id ? { ...t, ...updates } : t
        ),
      })),

      removeTask: (id) => set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
      })),

      clearCompletedTasks: () => set((state) => ({
        tasks: state.tasks.filter((t) => t.status !== 'completed'),
      })),

      // ========== Recommendations State ==========
      recommendations: [],

      addRecommendation: (rec) => set((state) => ({
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

      dismissRecommendation: (id) => set((state) => ({
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

      updateConfig: (updates) => set((state) => ({
        config: { ...state.config, ...updates },
      })),

      updateNotificationSettings: (updates) => set((state) => ({
        config: {
          ...state.config,
          notifications: { ...state.config.notifications, ...updates },
        },
      })),

      updatePermissions: (updates) => set((state) => ({
        config: {
          ...state.config,
          permissions: { ...state.config.permissions, ...updates },
        },
      })),

      // ========== Context ==========
      shipmentsContext: [],
      setShipmentsContext: (shipments) => {
        set({ shipmentsContext: shipments });
        // Recalcular métricas cuando cambian los shipments
        get().calculateMetricsFromShipments();
        get().generateProactiveAlerts();
      },

      // ========== Metrics ==========
      metrics: {
        tasaDevolucion: 0,
        tasaMeta: 8,
        guiasEnRiesgo: 0,
        guiasRescatadas: 0,
        dineroSalvado: 0,
        potencialRescate: 0,
        lastUpdated: new Date(),
      },

      updateMetrics: (updates) => set((state) => ({
        metrics: { ...state.metrics, ...updates, lastUpdated: new Date() },
      })),

      calculateMetricsFromShipments: () => {
        const { shipmentsContext } = get();
        if (shipmentsContext.length === 0) {
          set((state) => ({
            metrics: {
              ...state.metrics,
              tasaDevolucion: 0,
              guiasEnRiesgo: 0,
              potencialRescate: 0,
              lastUpdated: new Date(),
            },
          }));
          return;
        }

        // Calcular métricas basadas en los shipments
        const total = shipmentsContext.length;
        const entregados = shipmentsContext.filter((s: any) =>
          s.status?.toLowerCase().includes('entreg') ||
          s.status?.toLowerCase().includes('delivered')
        ).length;

        const conNovedad = shipmentsContext.filter((s: any) =>
          s.status?.toLowerCase().includes('novedad') ||
          s.status?.toLowerCase().includes('issue') ||
          s.status?.toLowerCase().includes('oficina') ||
          s.detailedInfo?.rawStatus?.toLowerCase().includes('reclam')
        ).length;

        const tasaDevolucion = total > 0 ? ((total - entregados) / total) * 100 : 0;
        const potencialRescate = conNovedad * 0.75; // 75% de recuperación estimada

        set((state) => ({
          metrics: {
            ...state.metrics,
            tasaDevolucion,
            guiasEnRiesgo: conNovedad,
            potencialRescate,
            lastUpdated: new Date(),
          },
        }));
      },

      // ========== Proactive Notifications ==========
      proactiveNotifications: [],

      addProactiveNotification: (notification) => {
        const id = generateId();
        set((state) => ({
          proactiveNotifications: [
            {
              ...notification,
              id,
              timestamp: new Date(),
              dismissed: false,
            },
            ...state.proactiveNotifications,
          ].slice(0, 20), // Mantener máximo 20 notificaciones
        }));
        // Incrementar contador de notificaciones
        get().incrementNotifications();
      },

      dismissProactiveNotification: (id) => set((state) => ({
        proactiveNotifications: state.proactiveNotifications.map((n) =>
          n.id === id ? { ...n, dismissed: true } : n
        ),
      })),

      clearProactiveNotifications: () => set({ proactiveNotifications: [] }),

      generateProactiveAlerts: () => {
        const { shipmentsContext, proactiveNotifications, addProactiveNotification } = get();
        if (shipmentsContext.length === 0) return;

        // Evitar duplicados - solo generar si no hay alertas recientes
        const recentAlerts = proactiveNotifications.filter(
          (n) => !n.dismissed && (new Date().getTime() - new Date(n.timestamp).getTime()) < 300000 // 5 minutos
        );
        if (recentAlerts.length >= 3) return;

        // Contar guías en Reclamo en Oficina
        const reclamoOficina = shipmentsContext.filter((s: any) =>
          s.status?.toLowerCase().includes('oficina') ||
          s.detailedInfo?.rawStatus?.toLowerCase().includes('reclam')
        );
        if (reclamoOficina.length > 0 && !recentAlerts.some((a) => a.type === 'critical' && a.title.includes('Reclamo'))) {
          addProactiveNotification({
            type: 'critical',
            title: `${reclamoOficina.length} guías en Reclamo en Oficina`,
            message: 'Requieren gestión urgente antes de devolución',
            count: reclamoOficina.length,
            actionLabel: 'Gestionar ahora',
            actionType: 'filter-reclamo',
          });
        }

        // Contar guías sin movimiento +5 días
        const sinMovimiento = shipmentsContext.filter((s: any) => {
          const days = s.detailedInfo?.daysInTransit || 0;
          return days >= 5 && !s.status?.toLowerCase().includes('entreg');
        });
        if (sinMovimiento.length > 0 && !recentAlerts.some((a) => a.type === 'warning' && a.title.includes('movimiento'))) {
          addProactiveNotification({
            type: 'warning',
            title: `${sinMovimiento.length} guías sin movimiento +5 días`,
            message: 'Alta probabilidad de devolución',
            count: sinMovimiento.length,
            actionLabel: 'Ver lista',
            actionType: 'filter-sin-movimiento',
          });
        }

        // Calcular tasa actual
        const total = shipmentsContext.length;
        const entregados = shipmentsContext.filter((s: any) =>
          s.status?.toLowerCase().includes('entreg')
        ).length;
        const tasaActual = total > 0 ? ((total - entregados) / total) * 100 : 0;

        if (tasaActual > 12 && !recentAlerts.some((a) => a.title.includes('Tasa'))) {
          addProactiveNotification({
            type: 'warning',
            title: `Tu tasa de devolución va en ${tasaActual.toFixed(1)}%`,
            message: 'Meta: 8%. Revisa las guías críticas.',
            actionLabel: 'Ver recomendaciones',
            actionType: 'ai-recommendations',
          });
        } else if (tasaActual <= 8 && !recentAlerts.some((a) => a.type === 'success')) {
          addProactiveNotification({
            type: 'success',
            title: `¡Vas muy bien! Tasa actual: ${tasaActual.toFixed(1)}%`,
            message: 'Estás cumpliendo la meta del 8%',
          });
        }
      },

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
        knowledge: state.knowledge,
        tasks: state.tasks.filter((t) => t.status !== 'completed').slice(0, 50),
        config: state.config,
        // Multi-conversación: guardar últimas 5 conversaciones con últimos 50 mensajes cada una
        conversations: state.conversations.slice(0, 5).map(c => ({
          ...c,
          messages: c.messages.slice(-50),
        })),
        activeConversationId: state.activeConversationId,
      }),
    }
  )
);

export default useProAssistantStore;
