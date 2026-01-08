// components/layout/AppLayout.tsx
// Layout principal con sidebar - Versión con notificaciones inteligentes

import React, { useState, useEffect, useMemo } from 'react';
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
  const { profile, getGreeting, getInitials } = useUserProfileStore();

  const stats = [
    { label: 'Guías activas', value: shipmentsCount, color: 'text-emerald-400', icon: Package },
    { label: 'Entregadas hoy', value: Math.floor(shipmentsCount * 0.4), color: 'text-blue-400', icon: CheckCircle },
    { label: 'En tránsito', value: Math.floor(shipmentsCount * 0.35), color: 'text-amber-400', icon: Clock },
    { label: 'Críticas', value: Math.floor(shipmentsCount * 0.05), color: 'text-red-400', icon: AlertTriangle },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStatIndex((prev) => (prev + 1) % stats.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [stats.length]);

  const currentStat = stats[currentStatIndex];
  const Icon = currentStat.icon;
  const selectedColor = AVATAR_COLORS.find(c => c.id === profile?.avatarColor) || AVATAR_COLORS[0];

  return (
    <div className="hidden lg:flex items-center gap-4">
      {/* User Greeting */}
      {profile?.nombre && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20 animate-fade-in">
          <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${selectedColor.bg} flex items-center justify-center`}>
            <span className="text-[10px] font-bold text-white">{getInitials()}</span>
          </div>
          <span className="text-sm text-amber-400 font-medium">{getGreeting()}</span>
          <Crown className="w-4 h-4 text-amber-500" />
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-xl border border-gray-700/50 animate-fade-in">
        <Icon className={`w-4 h-4 ${currentStat.color}`} />
        <span className="text-xs text-gray-400">{currentStat.label}:</span>
        <span className={`text-sm font-bold ${currentStat.color}`}>{currentStat.value}</span>
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
      <div className="absolute right-0 top-full mt-2 w-96 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-slide-down">
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
                  className={`p-4 border-b border-gray-800 hover:bg-gray-800/50 transition-colors cursor-pointer ${
                    !notif.read ? 'bg-gray-800/30' : ''
                  }`}
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
      <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-slide-down">
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
              className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-gray-800/70 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                <item.icon className="w-5 h-5 text-gray-400 group-hover:text-amber-400 transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{item.label}</p>
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
// TOP BAR
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
  const { profile, getInitials } = useUserProfileStore();
  const selectedColor = AVATAR_COLORS.find(c => c.id === profile?.avatarColor) || AVATAR_COLORS[0];

  const countryFlags: Record<string, string> = {
    'Colombia': '🇨🇴',
    'Ecuador': '🇪🇨',
    'Chile': '🇨🇱',
  };

  const unreadCount = getUnreadCount(notifications);
  const hasCritical = notifications.some(n => n.priority === 'critical');

  return (
    <header className="h-14 bg-gray-900/95 border-b border-gray-800 flex items-center justify-between px-4 sticky top-0 z-40 backdrop-blur-sm">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar guías, clientes, campañas... (Ctrl+K)"
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
          />
        </div>
      </div>

      {/* Center - Animated Stats */}
      <div className="flex-1 flex justify-center">
        <AnimatedStats shipmentsCount={shipmentsCount} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Load Data Button */}
        <button
          onClick={onLoadData}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-sm transition-all ${
            showLoadData
              ? 'bg-amber-600 text-white'
              : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/20'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Cargar Guías</span>
        </button>

        {/* Session Controls */}
        <div className="hidden md:flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-xl p-1">
          <button
            onClick={onExportSession}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="Guardar Sesión"
          >
            <Save className="w-4 h-4" />
          </button>
          <label className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg cursor-pointer transition-colors" title="Cargar Sesión">
            <Download className="w-4 h-4" />
            <input type="file" accept=".json" onChange={onImportSession} className="hidden" />
          </label>
          {shipmentsCount > 0 && (
            <button
              onClick={onExportExcel}
              className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-gray-700 rounded-lg transition-colors"
              title="Descargar Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Country Selector */}
        <button
          onClick={onCountryChange}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-700 hover:border-gray-600 transition-all"
        >
          <span className="text-lg">{countryFlags[selectedCountry] || '🌎'}</span>
          <span className="text-sm text-white hidden sm:inline">{selectedCountry?.slice(0, 2).toUpperCase() || 'CO'}</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2 rounded-xl transition-colors ${
              hasCritical
                ? 'text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white rounded-full ${
                hasCritical ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
              }`}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          <NotificationsPanel
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
            notifications={notifications}
            onMarkRead={onMarkNotificationRead}
          />
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onDarkModeToggle}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
          title={darkMode ? 'Modo claro' : 'Modo oscuro'}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* User Avatar & Settings */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-800 transition-colors"
            title="Configuración"
          >
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${selectedColor.bg} flex items-center justify-center shadow-lg`}>
              <span className="text-xs font-bold text-white">{getInitials()}</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
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

      {/* CSS para animaciones */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .animate-slide-down {
          animation: slide-down 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

export default AppLayout;
