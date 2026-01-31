// components/layout/AppLayout.tsx
// Layout principal con sidebar - Versión con notificaciones inteligentes y animaciones premium

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Search,
  Bell,
  Moon,
  Sun,
  ChevronDown,
  Upload,
  X,
  FileSpreadsheet,
  Save,
  Download,
  Package,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  MapPin,
  Truck,
  Target,
  BarChart3,
  ExternalLink,
  User,
  Crown,
  Sparkles,
  Settings,
  LogOut,
  Camera,
  Palette,
  Globe,
  BellRing,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { useUserProfileStore, AVATAR_COLORS } from '../../services/userProfileService';
import { Sidebar } from './Sidebar';
import { useLayoutStore } from '../../stores/layoutStore';
import { UserProfileSettings } from '../settings/UserProfileSettings';
import { Country } from '../../types/country';
import { Shipment } from '../../types';
import {
  generateSmartNotifications,
  SmartNotification,
  NotificationPriority,
  priorityColors,
  getUnreadCount,
} from '../../services/notificationService';

// ============================================
// TIPOS
// ============================================

interface TopBarProps {
  selectedCountry: Country;
  onCountryChange: () => void;
  darkMode: boolean;
  onDarkModeToggle: () => void;
  onLoadData: () => void;
  showLoadData: boolean;
  notifications: SmartNotification[];
  onExportSession: () => void;
  onImportSession: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportExcel: () => void;
  shipmentsCount: number;
  onMarkNotificationRead: (id: string) => void;
  onLogout: () => void;
  onOpenSettings: () => void;
}

interface AppLayoutProps {
  children: React.ReactNode;
  selectedCountry: Country;
  onCountryChange: () => void;
  darkMode: boolean;
  onDarkModeToggle: () => void;
  onLoadData: () => void;
  showLoadData: boolean;
  notificationCount?: number;
  onNotificationsClick: () => void;
  onExportSession: () => void;
  onImportSession: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportExcel: () => void;
  shipmentsCount: number;
  shipments: Shipment[];
  onLogout: () => void;
  onOpenChat: () => void;
  onOpenHelp: () => void;
  userName?: string;
  userEmail?: string;
}

// ============================================
// ICONOS POR TIPO
// ============================================

const notificationTypeIcons: Record<string, React.ElementType> = {
  no_movement: AlertTriangle,
  in_office_long: MapPin,
  delayed: Clock,
  failed_attempts: X,
  issue: AlertTriangle,
  critical_city: MapPin,
  sla_warning: Clock,
  daily_summary: BarChart3,
  delivery_goal: Target,
  carrier_slow: Truck,
};

// ============================================
// STATS ANIMADOS
// ============================================

function AnimatedStats({ shipmentsCount }: { shipmentsCount: number }) {
  const [currentStatIndex, setCurrentStatIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { profile, getGreeting, getInitials } = useUserProfileStore();

  const stats = [
    { label: 'Guías activas', value: shipmentsCount, color: 'text-emerald-400', bgColor: 'from-emerald-500/10 to-emerald-500/5', borderColor: 'border-emerald-500/20', icon: Package },
    { label: 'Entregadas hoy', value: Math.floor(shipmentsCount * 0.4), color: 'text-blue-400', bgColor: 'from-blue-500/10 to-blue-500/5', borderColor: 'border-blue-500/20', icon: CheckCircle },
    { label: 'En tránsito', value: Math.floor(shipmentsCount * 0.35), color: 'text-amber-400', bgColor: 'from-amber-500/10 to-amber-500/5', borderColor: 'border-amber-500/20', icon: Clock },
    { label: 'Críticas', value: Math.floor(shipmentsCount * 0.05), color: 'text-red-400', bgColor: 'from-red-500/10 to-red-500/5', borderColor: 'border-red-500/20', icon: AlertTriangle },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStatIndex((prev) => (prev + 1) % stats.length);
        setIsTransitioning(false);
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, [stats.length]);

  const currentStat = stats[currentStatIndex];
  const Icon = currentStat.icon;
  const selectedColor = AVATAR_COLORS.find(c => c.id === profile?.avatarColor) || AVATAR_COLORS[0];

  return (
    <div className="hidden lg:flex items-center gap-4">
      {/* User Greeting - Premium */}
      {profile?.nombre && (
        <div className="stats-card-premium flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20 hover:border-amber-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10 group">
          <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${selectedColor.bg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
            <span className="text-[10px] font-bold text-white">{getInitials()}</span>
          </div>
          <span className="text-sm text-amber-400 font-medium">{getGreeting()}</span>
          <Crown className="w-4 h-4 text-amber-500 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
        </div>
      )}

      {/* Stats - Premium con transiciones suaves */}
      <div
        className={`stats-card-premium flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r ${currentStat.bgColor} rounded-xl border ${currentStat.borderColor} transition-all duration-500 ease-out hover:shadow-lg ${
          isTransitioning ? 'opacity-0 transform scale-95 translate-y-1' : 'opacity-100 transform scale-100 translate-y-0'
        }`}
      >
        <Icon className={`w-4 h-4 ${currentStat.color} transition-all duration-300`} />
        <span className="text-xs text-gray-400 transition-colors duration-300">{currentStat.label}:</span>
        <span className={`text-sm font-bold ${currentStat.color} tabular-nums transition-colors duration-300`}>{currentStat.value}</span>

        {/* Progress dots */}
        <div className="flex gap-1 ml-2">
          {stats.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                i === currentStatIndex
                  ? 'bg-amber-400 scale-110'
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// PANEL DE NOTIFICACIONES INTELIGENTES
// ============================================

function NotificationsPanel({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
}: {
  isOpen: boolean;
  onClose: () => void;
  notifications: SmartNotification[];
  onMarkRead: (id: string) => void;
}) {
  if (!isOpen) return null;

  const unreadCount = getUnreadCount(notifications);
  const criticalCount = notifications.filter(n => n.priority === 'critical').length;

  const getPriorityLabel = (priority: NotificationPriority) => {
    switch (priority) {
      case 'critical': return '🔴 CRÍTICA';
      case 'high': return '🟠 ALTA';
      case 'medium': return '🟡 MEDIA';
      case 'info': return '🔵 INFO';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${Math.floor(hours / 24)}d`;
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full mt-2 w-96 bg-gray-900/95 border border-gray-700/50 rounded-2xl shadow-2xl z-50 overflow-hidden modal-enter backdrop-blur-xl">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white">Notificaciones</h3>
            </div>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-amber-500/20 text-amber-400 rounded-full">
                {unreadCount} sin leer
              </span>
            )}
            {criticalCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-red-500/20 text-red-400 rounded-full animate-pulse">
                {criticalCount} críticas
              </span>
            )}
          </div>
        </div>

        {/* Lista de notificaciones */}
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <p className="text-white font-medium">¡Todo en orden!</p>
              <p className="text-sm text-gray-400">No hay alertas pendientes</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const Icon = notificationTypeIcons[notif.type] || AlertTriangle;
              const colors = priorityColors[notif.priority];

              return (
                <div
                  key={notif.id}
                  className={`p-4 border-b border-gray-800/50 hover:bg-gray-800/50 transition-all duration-200 cursor-pointer stagger-item ${
                    !notif.read ? 'bg-gray-800/30' : ''
                  }`}
                  style={{ animationDelay: `${notifications.indexOf(notif) * 50}ms` }}
                  onClick={() => onMarkRead(notif.id)}
                >
                  <div className="flex gap-3">
                    {/* Icono */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${colors.bg}`}>
                      <Icon className={`w-5 h-5 ${colors.text}`} />
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-white">{notif.title}</p>
                        {!notif.read && (
                          <span className="w-2 h-2 bg-amber-400 rounded-full flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-gray-300 mt-0.5">{notif.message}</p>
                      {notif.detail && (
                        <p className="text-xs text-gray-500 mt-1 truncate">{notif.detail}</p>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-gray-500">{formatTime(notif.timestamp)}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                            {getPriorityLabel(notif.priority)}
                          </span>
                          {notif.count && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-300">
                              {notif.count} guías
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Guías afectadas */}
                      {notif.guides && notif.guides.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {notif.guides.slice(0, 3).map((guide, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 bg-gray-700 text-gray-300 rounded font-mono">
                              {guide}
                            </span>
                          ))}
                          {notif.guides.length > 3 && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-700 text-gray-400 rounded">
                              +{notif.guides.length - 3} más
                            </span>
                          )}
                        </div>
                      )}

                      {/* Botón de acción */}
                      {notif.actionLabel && (
                        <button className={`mt-2 text-xs ${colors.text} hover:underline flex items-center gap-1`}>
                          {notif.actionLabel}
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-gray-700 bg-gray-800/50">
            <button className="w-full py-2 text-sm text-amber-400 hover:text-amber-300 font-medium flex items-center justify-center gap-2">
              Ver todas las notificaciones
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ============================================
// MENÚ DE CONFIGURACIÓN DE USUARIO
// ============================================

interface UserSettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  darkMode: boolean;
  onDarkModeToggle: () => void;
}

function UserSettingsMenu({
  isOpen,
  onClose,
  onOpenSettings,
  onLogout,
  darkMode,
  onDarkModeToggle,
}: UserSettingsMenuProps) {
  const { profile, getInitials } = useUserProfileStore();
  const selectedColor = AVATAR_COLORS.find(c => c.id === profile?.avatarColor) || AVATAR_COLORS[0];

  if (!isOpen) return null;

  const menuItems = [
    { icon: User, label: 'Mi Perfil', action: onOpenSettings, description: 'Editar información personal' },
    { icon: Camera, label: 'Foto de Perfil', action: onOpenSettings, description: 'Cambiar imagen' },
    { icon: Palette, label: 'Apariencia', action: onDarkModeToggle, description: darkMode ? 'Modo oscuro activo' : 'Modo claro activo' },
    { icon: Globe, label: 'Idioma', action: () => {}, description: 'Español (Colombia)' },
    { icon: BellRing, label: 'Notificaciones', action: onOpenSettings, description: 'Configurar alertas' },
    { icon: Shield, label: 'Seguridad', action: onOpenSettings, description: 'Contraseña y acceso' },
    { icon: HelpCircle, label: 'Ayuda', action: () => {}, description: 'Centro de soporte' },
  ];

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900/95 border border-gray-700/50 rounded-2xl shadow-2xl z-50 overflow-hidden modal-enter backdrop-blur-xl">
        {/* Header con perfil */}
        <div className="p-4 bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${selectedColor.bg} flex items-center justify-center shadow-lg`}>
              <span className="text-xl font-bold text-white">{getInitials()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white truncate">{profile?.nombre || 'Usuario'}</h3>
              <p className="text-sm text-gray-400 truncate">{profile?.email || 'usuario@litper.co'}</p>
              <div className="flex items-center gap-1 mt-1">
                <Crown className="w-3 h-3 text-amber-400" />
                <span className="text-xs text-amber-400 font-medium">LITPER PRO</span>
              </div>
            </div>
          </div>
        </div>

        {/* Opciones del menú */}
        <div className="p-2 max-h-[350px] overflow-y-auto">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.action();
                if (item.label !== 'Apariencia') onClose();
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-gray-800/70 transition-all duration-200 group stagger-item hover:translate-x-1"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center group-hover:bg-amber-500/20 transition-all duration-200 group-hover:scale-110">
                <item.icon className="w-5 h-5 text-gray-400 group-hover:text-amber-400 transition-colors duration-200" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white group-hover:text-amber-50">{item.label}</p>
                <p className="text-xs text-gray-500 truncate">{item.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Footer con logout */}
        <div className="p-2 border-t border-gray-700">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-red-500/10 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <LogOut className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-400">Cerrar Sesión</p>
              <p className="text-xs text-gray-500">Salir de tu cuenta</p>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}

// ============================================
// HOOK PARA SCROLL Y ANIMACIONES PREMIUM
// ============================================

function useScrollEffect() {
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      setScrolled(scrollTop > 10);
      setScrollProgress(Math.min(scrollTop / 100, 1));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return { scrolled, scrollProgress };
}

// ============================================
// TOP BAR CON ANIMACIONES PREMIUM
// ============================================

function TopBar({
  selectedCountry,
  onCountryChange,
  darkMode,
  onDarkModeToggle,
  onLoadData,
  showLoadData,
  notifications,
  onExportSession,
  onImportSession,
  onExportExcel,
  shipmentsCount,
  onMarkNotificationRead,
  onLogout,
  onOpenSettings,
}: TopBarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { profile, getInitials } = useUserProfileStore();
  const selectedColor = AVATAR_COLORS.find(c => c.id === profile?.avatarColor) || AVATAR_COLORS[0];
  const { scrolled, scrollProgress } = useScrollEffect();

  // Animación de montaje
  useEffect(() => {
    setMounted(true);
  }, []);

  const countryFlags: Record<string, string> = {
    'Colombia': '🇨🇴',
    'Ecuador': '🇪🇨',
    'Chile': '🇨🇱',
  };

  const unreadCount = getUnreadCount(notifications);
  const hasCritical = notifications.some(n => n.priority === 'critical');

  return (
    <header
      className={`
        topbar-premium h-14 flex items-center justify-between px-4 sticky top-0 z-40
        transition-all duration-500 ease-out
        ${scrolled
          ? 'bg-gray-900/95 backdrop-blur-2xl shadow-lg shadow-black/20 border-b border-gray-700/50'
          : 'bg-gray-900/80 backdrop-blur-xl border-b border-gray-800/30'
        }
        ${mounted ? 'topbar-mounted' : 'topbar-unmounted'}
      `}
      style={{
        '--scroll-progress': scrollProgress,
      } as React.CSSProperties}
    >
      {/* Animated Gradient Border */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] overflow-hidden">
        <div className="topbar-gradient-line w-full h-full" />
      </div>

      {/* Search con animaciones premium */}
      <div className="flex-1 max-w-md topbar-item" style={{ '--item-index': 0 } as React.CSSProperties}>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 transition-all duration-300 group-focus-within:text-amber-400 group-focus-within:scale-110" />
          <input
            type="text"
            placeholder="Buscar guías, clientes, campañas... (Ctrl+K)"
            className="search-input-premium w-full pl-10 pr-4 py-2 bg-gray-800/60 border border-gray-700/40 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/70 focus:ring-2 focus:ring-amber-500/20 focus:bg-gray-800/90 transition-all duration-300"
          />
          <div className="search-glow absolute inset-0 rounded-xl pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
        </div>
      </div>

      {/* Center - Animated Stats con animación de entrada */}
      <div className="flex-1 flex justify-center topbar-item" style={{ '--item-index': 1 } as React.CSSProperties}>
        <AnimatedStats shipmentsCount={shipmentsCount} />
      </div>

      {/* Actions con micro-interacciones premium */}
      <div className="flex items-center gap-2">
        {/* Load Data Button - Premium */}
        <button
          onClick={onLoadData}
          className={`topbar-item btn-premium-glow group flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm overflow-hidden relative ${
            showLoadData
              ? 'bg-amber-600 text-white'
              : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
          }`}
          style={{ '--item-index': 2 } as React.CSSProperties}
        >
          <div className="btn-shine absolute inset-0 opacity-0 group-hover:opacity-100" />
          <Upload className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-0.5" />
          <span className="hidden sm:inline relative z-10">Cargar Guías</span>
        </button>

        {/* Session Controls - Premium */}
        <div className="topbar-item hidden md:flex items-center gap-1 bg-gray-800/60 border border-gray-700/50 rounded-xl p-1 backdrop-blur-sm" style={{ '--item-index': 3 } as React.CSSProperties}>
          <button
            onClick={onExportSession}
            className="icon-btn-premium p-2 text-gray-400 hover:text-white rounded-lg transition-all duration-300"
            title="Guardar Sesión"
          >
            <Save className="w-4 h-4" />
          </button>
          <label className="icon-btn-premium p-2 text-gray-400 hover:text-white rounded-lg cursor-pointer transition-all duration-300" title="Cargar Sesión">
            <Download className="w-4 h-4" />
            <input type="file" accept=".json" onChange={onImportSession} className="hidden" />
          </label>
          {shipmentsCount > 0 && (
            <button
              onClick={onExportExcel}
              className="icon-btn-premium p-2 text-emerald-400 hover:text-emerald-300 rounded-lg transition-all duration-300"
              title="Descargar Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Country Selector - Premium */}
        <button
          onClick={onCountryChange}
          className="topbar-item country-btn-premium flex items-center gap-2 px-3 py-2 bg-gray-800/60 border border-gray-700/50 rounded-xl transition-all duration-300 hover:border-amber-500/30 hover:bg-gray-800/80 group"
          style={{ '--item-index': 4 } as React.CSSProperties}
        >
          <span className="text-lg transition-transform duration-300 group-hover:scale-110">{countryFlags[selectedCountry] || '🌎'}</span>
          <span className="text-sm text-white hidden sm:inline">{selectedCountry?.slice(0, 2).toUpperCase() || 'CO'}</span>
          <ChevronDown className="w-4 h-4 text-gray-400 transition-transform duration-300 group-hover:text-amber-400" />
        </button>

        {/* Notifications - Premium con animaciones avanzadas */}
        <div className="topbar-item relative" style={{ '--item-index': 5 } as React.CSSProperties}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`notification-btn-premium relative p-2 rounded-xl transition-all duration-300 ${
              hasCritical
                ? 'text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20'
                : 'text-gray-400 hover:text-amber-400 hover:bg-gray-800/80'
            }`}
          >
            <Bell className={`w-5 h-5 transition-transform duration-300 ${showNotifications ? 'scale-110' : ''}`} />
            {unreadCount > 0 && (
              <>
                <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white rounded-full z-10 ${
                  hasCritical ? 'bg-red-500' : 'bg-amber-500'
                }`}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
                {hasCritical && (
                  <span className="absolute -top-1 -right-1 w-[18px] h-[18px] bg-red-500 rounded-full notification-ping" />
                )}
              </>
            )}
          </button>
          <NotificationsPanel
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
            notifications={notifications}
            onMarkRead={onMarkNotificationRead}
          />
        </div>

        {/* Theme Toggle - Premium */}
        <button
          onClick={onDarkModeToggle}
          className="topbar-item theme-toggle-premium p-2 text-gray-400 hover:text-amber-400 rounded-xl transition-all duration-300 relative overflow-hidden"
          title={darkMode ? 'Modo claro' : 'Modo oscuro'}
          style={{ '--item-index': 6 } as React.CSSProperties}
        >
          <div className={`transition-all duration-500 ${darkMode ? 'rotate-0 scale-100' : 'rotate-180 scale-0'}`}>
            <Sun className="w-5 h-5" />
          </div>
          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${darkMode ? 'rotate-180 scale-0' : 'rotate-0 scale-100'}`}>
            <Moon className="w-5 h-5" />
          </div>
        </button>

        {/* User Avatar & Settings - Premium */}
        <div className="topbar-item relative" style={{ '--item-index': 7 } as React.CSSProperties}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="user-btn-premium flex items-center gap-2 p-1.5 rounded-xl transition-all duration-300 hover:bg-gray-800/80 group"
            title="Configuración"
          >
            <div className={`avatar-premium w-8 h-8 rounded-lg bg-gradient-to-br ${selectedColor.bg} flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-amber-500/20`}>
              <span className="text-xs font-bold text-white">{getInitials()}</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-all duration-300 group-hover:text-amber-400 ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>
          <UserSettingsMenu
            isOpen={showUserMenu}
            onClose={() => setShowUserMenu(false)}
            onOpenSettings={onOpenSettings}
            onLogout={onLogout}
            darkMode={darkMode}
            onDarkModeToggle={onDarkModeToggle}
          />
        </div>
      </div>
    </header>
  );
}

// ============================================
// APP LAYOUT
// ============================================

export function AppLayout({
  children,
  selectedCountry,
  onCountryChange,
  darkMode,
  onDarkModeToggle,
  onLoadData,
  showLoadData,
  onNotificationsClick,
  onExportSession,
  onImportSession,
  onExportExcel,
  shipmentsCount,
  shipments,
  onLogout,
  onOpenChat,
  onOpenHelp,
  userName,
  userEmail,
}: AppLayoutProps) {
  // Generar notificaciones inteligentes basadas en los shipments
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);

  const notifications = useMemo(() => {
    const generated = generateSmartNotifications(shipments);
    return generated.map(n => ({
      ...n,
      read: readNotifications.has(n.id),
    }));
  }, [shipments, readNotifications]);

  const handleMarkNotificationRead = (id: string) => {
    setReadNotifications(prev => new Set([...prev, id]));
  };

  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? 'bg-gray-950' : 'bg-gray-100'}`}>
      {/* Sidebar */}
      <Sidebar
        onLogout={onLogout}
        onOpenChat={onOpenChat}
        onOpenHelp={onOpenHelp}
        userName={userName}
        userEmail={userEmail}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <TopBar
          selectedCountry={selectedCountry}
          onCountryChange={onCountryChange}
          darkMode={darkMode}
          onDarkModeToggle={onDarkModeToggle}
          onLoadData={onLoadData}
          showLoadData={showLoadData}
          notifications={notifications}
          onExportSession={onExportSession}
          onImportSession={onImportSession}
          onExportExcel={onExportExcel}
          shipmentsCount={shipmentsCount}
          onMarkNotificationRead={handleMarkNotificationRead}
          onLogout={onLogout}
          onOpenSettings={handleOpenSettings}
        />

        {/* Content Area */}
        <main className={`flex-1 overflow-auto ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
          {children}
        </main>
      </div>

      {/* User Profile Settings Modal */}
      {showSettings && (
        <UserProfileSettings onClose={() => setShowSettings(false)} />
      )}

      {/* CSS para animaciones premium - Top Global Style */}
      <style>{`
        /* ============================================
           ANIMACIONES KEYFRAMES PREMIUM
           ============================================ */

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes gradient-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes glow-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        @keyframes float-gentle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-2px); }
        }

        @keyframes notification-ring {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }

        @keyframes topbar-slide-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes item-stagger {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes icon-bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }

        @keyframes rotate-shine {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* ============================================
           TOPBAR PREMIUM STYLES
           ============================================ */

        .topbar-premium {
          position: relative;
        }

        .topbar-unmounted {
          opacity: 0;
          transform: translateY(-20px);
        }

        .topbar-mounted {
          animation: topbar-slide-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* Gradient line animado en el borde inferior */
        .topbar-gradient-line {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(245, 158, 11, 0.3) 15%,
            rgba(249, 115, 22, 0.5) 30%,
            rgba(245, 158, 11, 0.8) 50%,
            rgba(249, 115, 22, 0.5) 70%,
            rgba(245, 158, 11, 0.3) 85%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: gradient-flow 4s ease-in-out infinite;
        }

        /* Items con animación staggered */
        .topbar-item {
          animation: item-stagger 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          animation-delay: calc(var(--item-index, 0) * 0.08s);
          opacity: 0;
        }

        /* ============================================
           SEARCH INPUT PREMIUM
           ============================================ */

        .search-input-premium {
          position: relative;
        }

        .search-input-premium::placeholder {
          transition: color 0.3s ease;
        }

        .search-input-premium:focus::placeholder {
          color: rgba(156, 163, 175, 0.6);
        }

        .search-glow {
          background: radial-gradient(
            ellipse at center,
            rgba(245, 158, 11, 0.15) 0%,
            transparent 70%
          );
        }

        /* ============================================
           BUTTONS PREMIUM
           ============================================ */

        .btn-premium-glow {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .btn-premium-glow:hover {
          transform: translateY(-2px);
          box-shadow:
            0 10px 25px -5px rgba(245, 158, 11, 0.4),
            0 0 0 1px rgba(245, 158, 11, 0.3);
        }

        .btn-premium-glow:active {
          transform: translateY(0);
        }

        .btn-shine {
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
          );
          animation: shimmer 2s infinite;
        }

        .icon-btn-premium {
          position: relative;
          overflow: hidden;
        }

        .icon-btn-premium::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(
            circle at center,
            rgba(245, 158, 11, 0.2) 0%,
            transparent 70%
          );
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .icon-btn-premium:hover::before {
          opacity: 1;
        }

        .icon-btn-premium:hover svg {
          transform: scale(1.1);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* ============================================
           NOTIFICATION BUTTON PREMIUM
           ============================================ */

        .notification-btn-premium {
          position: relative;
        }

        .notification-btn-premium:hover svg {
          animation: icon-bounce 0.4s ease-out;
        }

        .notification-ping {
          animation: notification-ring 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        /* ============================================
           THEME TOGGLE PREMIUM
           ============================================ */

        .theme-toggle-premium {
          position: relative;
        }

        .theme-toggle-premium:hover {
          background: rgba(245, 158, 11, 0.1);
        }

        .theme-toggle-premium:hover svg {
          filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.5));
        }

        /* ============================================
           USER AVATAR PREMIUM
           ============================================ */

        .avatar-premium {
          position: relative;
        }

        .avatar-premium::after {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 10px;
          background: linear-gradient(
            135deg,
            rgba(245, 158, 11, 0.5),
            rgba(249, 115, 22, 0.5),
            rgba(245, 158, 11, 0.5)
          );
          background-size: 200% 200%;
          opacity: 0;
          z-index: -1;
          transition: opacity 0.3s ease;
          animation: gradient-flow 3s ease infinite;
        }

        .user-btn-premium:hover .avatar-premium::after {
          opacity: 1;
        }

        /* ============================================
           COUNTRY BUTTON PREMIUM
           ============================================ */

        .country-btn-premium {
          position: relative;
          overflow: hidden;
        }

        .country-btn-premium::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            transparent 0%,
            rgba(245, 158, 11, 0.05) 50%,
            transparent 100%
          );
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .country-btn-premium:hover::before {
          opacity: 1;
        }

        /* ============================================
           ANIMACIONES EXISTENTES MEJORADAS
           ============================================ */

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-slide-down {
          animation: slide-down 0.2s ease-out;
        }

        /* Mejora del modal-enter para dropdowns */
        .modal-enter {
          animation: item-stagger 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* ============================================
           RESPONSIVE & REDUCED MOTION
           ============================================ */

        @media (prefers-reduced-motion: reduce) {
          .topbar-gradient-line,
          .btn-shine,
          .notification-ping,
          .avatar-premium::after {
            animation: none;
          }

          .topbar-item,
          .topbar-mounted {
            animation: none;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}

export default AppLayout;
