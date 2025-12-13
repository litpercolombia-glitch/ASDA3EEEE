// services/notificationsService.ts
// Sistema de Notificaciones para LITPER PRO

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// TIPOS
// ============================================

export type NotificationType = 'venta' | 'pedido' | 'alerta' | 'sistema' | 'marketing' | 'soporte';
export type NotificationPriority = 'baja' | 'normal' | 'alta' | 'urgente';
export type NotificationChannel = 'push' | 'email' | 'whatsapp' | 'sms' | 'app';

export interface Notification {
  id: string;
  tipo: NotificationType;
  titulo: string;
  mensaje: string;
  prioridad: NotificationPriority;
  icono: string;
  color: string;
  link?: string;
  data?: Record<string, any>;
  isRead: boolean;
  isDismissed: boolean;
  createdAt: string;
}

export interface AlertRule {
  id: string;
  nombre: string;
  descripcion: string;
  condiciones: AlertCondition[];
  operador: 'AND' | 'OR';
  canales: NotificationChannel[];
  mensaje: string;
  prioridad: NotificationPriority;
  isActive: boolean;
  evaluarCada: number; // minutos
  horarioPermitido: { inicio: string; fin: string };
  ultimaEvaluacion?: string;
  vecesActivada: number;
  createdAt: string;
}

export interface AlertCondition {
  metrica: string;
  operador: 'mayor' | 'menor' | 'igual' | 'entre' | 'cambio';
  valor: number;
  valor2?: number;
}

export interface NotificationPreferences {
  canales: Record<NotificationChannel, boolean>;
  tipos: Record<NotificationType, boolean>;
  horarioSilencio: { inicio: string; fin: string; activo: boolean };
  resumenDiario: boolean;
  horaResumen: string;
}

// ============================================
// DATOS POR DEFECTO
// ============================================

const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    id: 'rule-roas',
    nombre: 'ROAS Bajo',
    descripcion: 'Alerta cuando el ROAS cae por debajo del objetivo',
    condiciones: [{ metrica: 'roas', operador: 'menor', valor: 2.5 }],
    operador: 'AND',
    canales: ['push', 'email'],
    mensaje: '⚠️ ROAS en {{plataforma}} cayó a {{valor}}. Revisar campañas.',
    prioridad: 'alta',
    isActive: true,
    evaluarCada: 60,
    horarioPermitido: { inicio: '08:00', fin: '22:00' },
    vecesActivada: 5,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rule-devolucion',
    nombre: 'Alta Tasa de Devolución',
    descripcion: 'Alerta si la tasa de devolución supera el umbral',
    condiciones: [{ metrica: 'tasa_devolucion', operador: 'mayor', valor: 10 }],
    operador: 'AND',
    canales: ['push', 'whatsapp'],
    mensaje: '🔴 Tasa de devolución al {{valor}}%. Revisar productos/zonas.',
    prioridad: 'urgente',
    isActive: true,
    evaluarCada: 120,
    horarioPermitido: { inicio: '00:00', fin: '23:59' },
    vecesActivada: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rule-venta-grande',
    nombre: 'Venta Grande',
    descripcion: 'Notifica ventas mayores a cierto monto',
    condiciones: [{ metrica: 'monto_venta', operador: 'mayor', valor: 200000 }],
    operador: 'AND',
    canales: ['push'],
    mensaje: '🎉 ¡Venta de ${{valor}}! Cliente: {{cliente}}',
    prioridad: 'normal',
    isActive: true,
    evaluarCada: 5,
    horarioPermitido: { inicio: '00:00', fin: '23:59' },
    vecesActivada: 45,
    createdAt: new Date().toISOString(),
  },
];

const SAMPLE_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    tipo: 'venta',
    titulo: '¡Nueva venta!',
    mensaje: 'María García compró por $162,000',
    prioridad: 'normal',
    icono: 'ShoppingCart',
    color: '#10B981',
    isRead: false,
    isDismissed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'notif-2',
    tipo: 'alerta',
    titulo: 'ROAS bajo en Facebook',
    mensaje: 'ROAS cayó a 2.1. Revisar campañas activas.',
    prioridad: 'alta',
    icono: 'AlertTriangle',
    color: '#F59E0B',
    isRead: false,
    isDismissed: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'notif-3',
    tipo: 'pedido',
    titulo: 'Pedido entregado',
    mensaje: 'Pedido LIT-2024-0001 entregado exitosamente',
    prioridad: 'baja',
    icono: 'CheckCircle',
    color: '#22C55E',
    isRead: true,
    isDismissed: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

const DEFAULT_PREFERENCES: NotificationPreferences = {
  canales: { push: true, email: true, whatsapp: true, sms: false, app: true },
  tipos: { venta: true, pedido: true, alerta: true, sistema: true, marketing: true, soporte: true },
  horarioSilencio: { inicio: '22:00', fin: '08:00', activo: true },
  resumenDiario: true,
  horaResumen: '09:00',
};

// ============================================
// STORE
// ============================================

interface NotificationsState {
  notifications: Notification[];
  alertRules: AlertRule[];
  preferences: NotificationPreferences;

  // Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead' | 'isDismissed'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismiss: (id: string) => void;
  clearAll: () => void;

  // Alert Rules
  addAlertRule: (rule: Omit<AlertRule, 'id' | 'createdAt' | 'vecesActivada'>) => void;
  updateAlertRule: (id: string, updates: Partial<AlertRule>) => void;
  deleteAlertRule: (id: string) => void;
  toggleAlertRule: (id: string) => void;

  // Preferences
  updatePreferences: (updates: Partial<NotificationPreferences>) => void;

  // Queries
  getUnread: () => Notification[];
  getByType: (type: NotificationType) => Notification[];
  getActiveRules: () => AlertRule[];
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      notifications: SAMPLE_NOTIFICATIONS,
      alertRules: DEFAULT_ALERT_RULES,
      preferences: DEFAULT_PREFERENCES,

      addNotification: (notification) => {
        const newNotification: Notification = { ...notification, id: generateId(), createdAt: new Date().toISOString(), isRead: false, isDismissed: false };
        set((state) => ({ notifications: [newNotification, ...state.notifications].slice(0, 100) })); // Máximo 100
      },

      markAsRead: (id) => {
        set((state) => ({ notifications: state.notifications.map((n) => n.id === id ? { ...n, isRead: true } : n) }));
      },

      markAllAsRead: () => {
        set((state) => ({ notifications: state.notifications.map((n) => ({ ...n, isRead: true })) }));
      },

      dismiss: (id) => {
        set((state) => ({ notifications: state.notifications.map((n) => n.id === id ? { ...n, isDismissed: true } : n) }));
      },

      clearAll: () => {
        set({ notifications: [] });
      },

      addAlertRule: (rule) => {
        const newRule: AlertRule = { ...rule, id: generateId(), createdAt: new Date().toISOString(), vecesActivada: 0 };
        set((state) => ({ alertRules: [...state.alertRules, newRule] }));
      },

      updateAlertRule: (id, updates) => {
        set((state) => ({ alertRules: state.alertRules.map((r) => r.id === id ? { ...r, ...updates } : r) }));
      },

      deleteAlertRule: (id) => {
        set((state) => ({ alertRules: state.alertRules.filter((r) => r.id !== id) }));
      },

      toggleAlertRule: (id) => {
        set((state) => ({ alertRules: state.alertRules.map((r) => r.id === id ? { ...r, isActive: !r.isActive } : r) }));
      },

      updatePreferences: (updates) => {
        set((state) => ({ preferences: { ...state.preferences, ...updates } }));
      },

      getUnread: () => get().notifications.filter((n) => !n.isRead && !n.isDismissed),
      getByType: (type) => get().notifications.filter((n) => n.tipo === type),
      getActiveRules: () => get().alertRules.filter((r) => r.isActive),
    }),
    { name: 'litper-notifications-store' }
  )
);

export function useNotifications() {
  const store = useNotificationsStore();
  const unread = store.getUnread();
  const activeRules = store.getActiveRules();
  return { ...store, unread, unreadCount: unread.length, activeRules };
}

export default useNotificationsStore;
