// components/layout/AppLayout.tsx
// Layout principal con sidebar - Versión funcional completa

import React, { useState, useEffect } from 'react';
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
  Crown,
} from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useLayoutStore } from '../../stores/layoutStore';
import { Country } from '../../types/country';

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
  notificationCount?: number;
  onNotificationsClick: () => void;
  onExportSession: () => void;
  onImportSession: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportExcel: () => void;
  shipmentsCount: number;
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
  onLogout: () => void;
  onOpenChat: () => void;
  onOpenHelp: () => void;
  userName?: string;
  userEmail?: string;
}

// ============================================
// DATOS DE NOTIFICACIONES DEMO
// ============================================

const demoNotifications = [
  { id: 1, type: 'success', title: 'Guías sincronizadas', message: '15 guías actualizadas correctamente', time: 'Hace 5 min', icon: CheckCircle },
  { id: 2, type: 'warning', title: 'Entregas retrasadas', message: '3 guías con retraso en Bogotá', time: 'Hace 15 min', icon: AlertTriangle },
  { id: 3, type: 'info', title: 'Nueva actualización', message: 'Marketing Dashboard disponible', time: 'Hace 1 hora', icon: Zap },
  { id: 4, type: 'info', title: 'Estadísticas listas', message: 'Reporte semanal generado', time: 'Hace 2 horas', icon: TrendingUp },
];

// ============================================
// STATS ANIMADOS
// ============================================

function AnimatedStats({ shipmentsCount }: { shipmentsCount: number }) {
  const [currentStatIndex, setCurrentStatIndex] = useState(0);

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

  return (
    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-xl border border-gray-700/50 animate-fade-in">
      <Icon className={`w-4 h-4 ${currentStat.color}`} />
      <span className="text-xs text-gray-400">{currentStat.label}:</span>
      <span className={`text-sm font-bold ${currentStat.color}`}>{currentStat.value}</span>
    </div>
  );
}

// ============================================
// PANEL DE NOTIFICACIONES
// ============================================

function NotificationsPanel({ isOpen, onClose, count }: { isOpen: boolean; onClose: () => void; count: number }) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-slide-down">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white">Notificaciones</h3>
            {count > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">{count}</span>
            )}
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {demoNotifications.map((notif) => {
            const Icon = notif.icon;
            return (
              <div key={notif.id} className="p-4 border-b border-gray-800 hover:bg-gray-800/50 transition-colors cursor-pointer">
                <div className="flex gap-3">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    notif.type === 'success' ? 'bg-emerald-500/20' :
                    notif.type === 'warning' ? 'bg-amber-500/20' :
                    'bg-blue-500/20'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      notif.type === 'success' ? 'text-emerald-400' :
                      notif.type === 'warning' ? 'text-amber-400' :
                      'text-blue-400'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{notif.title}</p>
                    <p className="text-xs text-gray-400 truncate">{notif.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t border-gray-700">
          <button className="w-full py-2 text-sm text-amber-400 hover:text-amber-300 font-medium">
            Ver todas las notificaciones
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
  notificationCount = 0,
  onNotificationsClick,
  onExportSession,
  onImportSession,
  onExportExcel,
  shipmentsCount,
}: TopBarProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  const countryFlags: Record<string, string> = {
    'Colombia': '🇨🇴',
    'Ecuador': '🇪🇨',
    'Chile': '🇨🇱',
  };

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
            className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full animate-pulse">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </button>
          <NotificationsPanel
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
            count={notificationCount}
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
  notificationCount,
  onNotificationsClick,
  onExportSession,
  onImportSession,
  onExportExcel,
  shipmentsCount,
  onLogout,
  onOpenChat,
  onOpenHelp,
  userName,
  userEmail,
}: AppLayoutProps) {
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
          notificationCount={notificationCount}
          onNotificationsClick={onNotificationsClick}
          onExportSession={onExportSession}
          onImportSession={onImportSession}
          onExportExcel={onExportExcel}
          shipmentsCount={shipmentsCount}
        />

        {/* Content Area */}
        <main className={`flex-1 overflow-auto ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
          {children}
        </main>
      </div>

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
