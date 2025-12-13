// components/notifications/NotificationCenter.tsx
// Centro de Notificaciones estilo Amazon - Sistema completo de alertas
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Package,
  Truck,
  Clock,
  Settings,
  Filter,
  Search,
  MoreVertical,
  ExternalLink,
  Volume2,
  VolumeX,
  RefreshCw,
  Archive,
  Star,
  StarOff,
  ChevronRight,
  Calendar,
  MapPin,
  Phone,
} from 'lucide-react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// TYPES
// ============================================
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'delivery' | 'transit' | 'urgent';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  starred: boolean;
  archived: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: {
    guideNumber?: string;
    carrier?: string;
    city?: string;
    phone?: string;
    [key: string]: any;
  };
  category: 'system' | 'shipment' | 'alert' | 'update' | 'promotion';
}

// ============================================
// NOTIFICATION STORE
// ============================================
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  soundEnabled: boolean;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'starred' | 'archived'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  toggleStarred: (id: string) => void;
  archiveNotification: (id: string) => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  toggleSound: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      soundEnabled: true,

      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          read: false,
          starred: false,
          archived: false,
        };

        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 100), // Keep max 100
          unreadCount: state.unreadCount + 1,
        }));

        // Play sound if enabled
        if (get().soundEnabled && typeof window !== 'undefined') {
          playNotificationSound();
        }

        // Show browser notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/logo192.png',
            tag: newNotification.id,
          });
        }
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - (state.notifications.find(n => n.id === id && !n.read) ? 1 : 0)),
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      toggleStarred: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, starred: !n.starred } : n
          ),
        }));
      },

      archiveNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, archived: true, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - (state.notifications.find(n => n.id === id && !n.read) ? 1 : 0)),
        }));
      },

      deleteNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
          unreadCount: Math.max(0, state.unreadCount - (state.notifications.find(n => n.id === id && !n.read) ? 1 : 0)),
        }));
      },

      clearAll: () => {
        set({ notifications: [], unreadCount: 0 });
      },

      toggleSound: () => {
        set((state) => ({ soundEnabled: !state.soundEnabled }));
      },
    }),
    {
      name: 'litper-notifications',
      partialize: (state) => ({
        notifications: state.notifications.slice(0, 50),
        soundEnabled: state.soundEnabled,
      }),
    }
  )
);

// Sound effect
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    console.log('Audio not available');
  }
};

// ============================================
// NOTIFICATION ITEM COMPONENT
// ============================================
const NotificationItem: React.FC<{
  notification: Notification;
  onMarkRead: () => void;
  onToggleStar: () => void;
  onArchive: () => void;
  onDelete: () => void;
}> = ({ notification, onMarkRead, onToggleStar, onArchive, onDelete }) => {
  const [showActions, setShowActions] = useState(false);

  const typeConfig = {
    info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    success: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    error: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
    delivery: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    transit: { icon: Truck, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    urgent: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
  };

  const config = typeConfig[notification.type];
  const Icon = config.icon;

  const timeAgo = useMemo(() => {
    const now = new Date();
    const diff = now.getTime() - new Date(notification.timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  }, [notification.timestamp]);

  return (
    <div
      className={`relative group p-4 border-b border-slate-100 dark:border-navy-800 transition-all hover:bg-slate-50 dark:hover:bg-navy-800/50 ${
        !notification.read ? 'bg-accent-50/50 dark:bg-accent-900/10' : ''
      }`}
      onClick={onMarkRead}
    >
      {/* Unread indicator */}
      {!notification.read && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-accent-500 rounded-full" />
      )}

      <div className="flex items-start gap-3 pl-4">
        {/* Icon */}
        <div className={`p-2 rounded-xl ${config.bg} flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className={`font-semibold text-sm ${!notification.read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                {notification.starred && <Star className="w-3 h-3 inline mr-1 text-yellow-500 fill-yellow-500" />}
                {notification.title}
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                {notification.message}
              </p>
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
              {timeAgo}
            </span>
          </div>

          {/* Metadata */}
          {notification.metadata && (
            <div className="flex flex-wrap gap-2 mt-2">
              {notification.metadata.guideNumber && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-navy-700 rounded text-xs text-slate-600 dark:text-slate-300">
                  <Package className="w-3 h-3" />
                  {notification.metadata.guideNumber}
                </span>
              )}
              {notification.metadata.carrier && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-navy-700 rounded text-xs text-slate-600 dark:text-slate-300">
                  <Truck className="w-3 h-3" />
                  {notification.metadata.carrier}
                </span>
              )}
              {notification.metadata.city && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-navy-700 rounded text-xs text-slate-600 dark:text-slate-300">
                  <MapPin className="w-3 h-3" />
                  {notification.metadata.city}
                </span>
              )}
            </div>
          )}

          {/* Action button */}
          {notification.actionUrl && (
            <button className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent-600 hover:text-accent-700 dark:text-accent-400">
              {notification.actionLabel || 'Ver detalles'}
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Quick actions */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-navy-700 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showActions && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-navy-800 rounded-xl shadow-lg border border-slate-200 dark:border-navy-700 py-1 z-10">
              <button
                onClick={(e) => { e.stopPropagation(); onToggleStar(); setShowActions(false); }}
                className="w-full px-3 py-2 text-left text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-700 flex items-center gap-2"
              >
                {notification.starred ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                {notification.starred ? 'Quitar estrella' : 'Destacar'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onArchive(); setShowActions(false); }}
                className="w-full px-3 py-2 text-left text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-700 flex items-center gap-2"
              >
                <Archive className="w-4 h-4" />
                Archivar
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); setShowActions(false); }}
                className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// NOTIFICATION CENTER COMPONENT
// ============================================
export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'starred' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    notifications,
    unreadCount,
    soundEnabled,
    markAsRead,
    markAllAsRead,
    toggleStarred,
    archiveNotification,
    deleteNotification,
    clearAll,
    toggleSound,
  } = useNotificationStore();

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    let result = notifications;

    switch (filter) {
      case 'unread':
        result = result.filter((n) => !n.read && !n.archived);
        break;
      case 'starred':
        result = result.filter((n) => n.starred && !n.archived);
        break;
      case 'archived':
        result = result.filter((n) => n.archived);
        break;
      default:
        result = result.filter((n) => !n.archived);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.message.toLowerCase().includes(query) ||
          n.metadata?.guideNumber?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [notifications, filter, searchQuery]);

  return (
    <>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white transition-all"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center text-xs font-bold bg-red-500 text-white rounded-full px-1 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="fixed right-4 top-20 w-full max-w-md bg-white dark:bg-navy-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-navy-700 z-50 overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="bg-gradient-to-r from-navy-800 to-navy-700 dark:from-navy-950 dark:to-navy-900 text-white p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-xl">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">Notificaciones</h2>
                    <p className="text-xs text-slate-300">
                      {unreadCount} sin leer
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleSound}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title={soundEnabled ? 'Silenciar' : 'Activar sonido'}
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar notificaciones..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:border-accent-400"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-1 p-2 bg-slate-50 dark:bg-navy-950 border-b border-slate-200 dark:border-navy-800">
              {[
                { id: 'all', label: 'Todas' },
                { id: 'unread', label: 'Sin leer' },
                { id: 'starred', label: 'Destacadas' },
                { id: 'archived', label: 'Archivadas' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id as typeof filter)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    filter === f.id
                      ? 'bg-accent-500 text-white'
                      : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-navy-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}

              <div className="flex-1" />

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-3 py-1.5 text-xs font-medium text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-900/20 rounded-lg flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" />
                  Marcar todo leído
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="max-h-[400px] overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-navy-800 rounded-full flex items-center justify-center mb-4">
                    <Bell className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="font-medium text-slate-600 dark:text-slate-300 mb-1">
                    No hay notificaciones
                  </h3>
                  <p className="text-sm text-slate-400">
                    {filter === 'unread'
                      ? 'Has leído todas las notificaciones'
                      : filter === 'starred'
                      ? 'No tienes notificaciones destacadas'
                      : filter === 'archived'
                      ? 'No hay notificaciones archivadas'
                      : 'Las notificaciones aparecerán aquí'}
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={() => markAsRead(notification.id)}
                    onToggleStar={() => toggleStarred(notification.id)}
                    onArchive={() => archiveNotification(notification.id)}
                    onDelete={() => deleteNotification(notification.id)}
                  />
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-950">
                <button
                  onClick={clearAll}
                  className="w-full py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Limpiar todas
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};

// ============================================
// NOTIFICATION HOOK - Para añadir notificaciones fácilmente
// ============================================
export const useNotifications = () => {
  const { addNotification } = useNotificationStore();

  const notify = useCallback(
    (
      type: NotificationType,
      title: string,
      message: string,
      options?: {
        category?: Notification['category'];
        actionUrl?: string;
        actionLabel?: string;
        metadata?: Notification['metadata'];
      }
    ) => {
      addNotification({
        type,
        title,
        message,
        category: options?.category || 'system',
        actionUrl: options?.actionUrl,
        actionLabel: options?.actionLabel,
        metadata: options?.metadata,
      });
    },
    [addNotification]
  );

  return {
    notify,
    notifySuccess: (title: string, message: string, options?: any) =>
      notify('success', title, message, options),
    notifyError: (title: string, message: string, options?: any) =>
      notify('error', title, message, options),
    notifyWarning: (title: string, message: string, options?: any) =>
      notify('warning', title, message, options),
    notifyInfo: (title: string, message: string, options?: any) =>
      notify('info', title, message, options),
    notifyDelivery: (guideNumber: string, message: string, options?: any) =>
      notify('delivery', `Guía ${guideNumber} Entregada`, message, {
        ...options,
        category: 'shipment',
        metadata: { ...options?.metadata, guideNumber },
      }),
    notifyTransit: (guideNumber: string, message: string, options?: any) =>
      notify('transit', `Actualización de Guía ${guideNumber}`, message, {
        ...options,
        category: 'shipment',
        metadata: { ...options?.metadata, guideNumber },
      }),
    notifyUrgent: (title: string, message: string, options?: any) =>
      notify('urgent', title, message, { ...options, category: 'alert' }),
  };
};

export default NotificationCenter;
