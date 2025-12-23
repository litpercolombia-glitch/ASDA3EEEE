// ============================================
// LITPER PRO - ADMIN LAYOUT
// Layout unificado con sidebar profesional
// ============================================

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  DollarSign,
  Users,
  Bell,
  Settings,
  Shield,
  Brain,
  BarChart3,
  Truck,
  MessageSquare,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Search,
  Moon,
  Sun,
  Zap,
  Target,
  Activity,
  FileText,
  Plug,
  Globe,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  Clock,
  Command,
  Bot,
} from 'lucide-react';
import { getCurrentUser, logout, isAuthenticated } from '../../services/authService';

// ============================================
// TIPOS
// ============================================

export type AdminSection =
  | 'command-center'
  | 'dashboard'
  | 'cargas'
  | 'guias'
  | 'semaforo'
  | 'finanzas'
  | 'reportes'
  | 'analytics'
  | 'crm'
  | 'marketing'
  | 'soporte'
  | 'ia-copilot'
  | 'ia-config'
  | 'integraciones'
  | 'usuarios'
  | 'seguridad'
  | 'configuracion';

interface NavItem {
  id: AdminSection;
  label: string;
  icon: React.ElementType;
  badge?: number;
  color?: string;
  isNew?: boolean;
  isPro?: boolean;
}

interface AdminLayoutProps {
  children: React.ReactNode;
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
}

// ============================================
// CONFIGURACIÓN DE NAVEGACIÓN
// ============================================

const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Principal',
    items: [
      { id: 'command-center', label: 'Command Center', icon: Command, color: 'from-purple-500 to-pink-500', isNew: true },
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'from-blue-500 to-cyan-500' },
      { id: 'cargas', label: 'Cargas', icon: Package, color: 'from-orange-500 to-amber-500', badge: 3 },
      { id: 'guias', label: 'Guías', icon: FileText, color: 'from-emerald-500 to-teal-500' },
    ],
  },
  {
    title: 'Logística',
    items: [
      { id: 'semaforo', label: 'Semáforo 2.0', icon: Truck, color: 'from-green-500 to-emerald-500', isNew: true },
      { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'from-indigo-500 to-purple-500' },
    ],
  },
  {
    title: 'Finanzas',
    items: [
      { id: 'finanzas', label: 'Centro Financiero', icon: DollarSign, color: 'from-green-500 to-emerald-500' },
      { id: 'reportes', label: 'Reportes', icon: TrendingUp, color: 'from-cyan-500 to-blue-500' },
    ],
  },
  {
    title: 'Clientes',
    items: [
      { id: 'crm', label: 'CRM', icon: Users, color: 'from-rose-500 to-pink-500' },
      { id: 'marketing', label: 'Marketing', icon: Target, color: 'from-yellow-500 to-orange-500' },
      { id: 'soporte', label: 'Soporte', icon: MessageSquare, color: 'from-sky-500 to-blue-500', badge: 5 },
    ],
  },
  {
    title: 'Inteligencia',
    items: [
      { id: 'ia-copilot', label: 'IA Co-pilot', icon: Brain, color: 'from-violet-500 to-purple-500', isPro: true },
      { id: 'ia-config', label: 'Config IA', icon: Bot, color: 'from-purple-500 to-pink-500', isNew: true },
      { id: 'integraciones', label: 'Integraciones', icon: Plug, color: 'from-slate-500 to-gray-500' },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { id: 'usuarios', label: 'Usuarios', icon: Users, color: 'from-blue-500 to-indigo-500' },
      { id: 'seguridad', label: 'Seguridad', icon: Shield, color: 'from-red-500 to-rose-500' },
      { id: 'configuracion', label: 'Configuración', icon: Settings, color: 'from-gray-500 to-slate-500' },
    ],
  },
];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activeSection,
  onSectionChange,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const user = getCurrentUser();

  // Mock notifications
  const notifications = [
    { id: 1, type: 'alert', message: 'Tasa de entrega en Cali bajó al 65%', time: '5 min', icon: AlertTriangle },
    { id: 2, type: 'success', message: 'Carga #127 completada exitosamente', time: '15 min', icon: CheckCircle },
    { id: 3, type: 'info', message: '3 nuevos tickets de soporte', time: '1 hora', icon: MessageSquare },
  ];

  // Toggle dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const getActiveItem = () => {
    for (const section of NAV_SECTIONS) {
      const item = section.items.find(i => i.id === activeSection);
      if (item) return item;
    }
    return NAV_SECTIONS[0].items[0];
  };

  const activeItem = getActiveItem();

  return (
    <div className={`min-h-screen bg-slate-100 dark:bg-navy-950 flex ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-navy-900 border-r border-slate-200 dark:border-navy-700 transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-72'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-navy-700">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black text-slate-800 dark:text-white">
                  LITPER <span className="text-orange-500">PRO</span>
                </h1>
                <p className="text-[10px] text-slate-400 -mt-1">Enterprise Suite</p>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-10 h-10 mx-auto bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              {!sidebarCollapsed && (
                <h3 className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-navy-400">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSectionChange(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all group ${
                        isActive
                          ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'
                      }`}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <div className={`${sidebarCollapsed ? 'mx-auto' : ''}`}>
                        <Icon className={`w-5 h-5 ${isActive ? '' : 'group-hover:scale-110 transition-transform'}`} />
                      </div>
                      {!sidebarCollapsed && (
                        <>
                          <span className="flex-1 text-left text-sm">{item.label}</span>
                          {item.badge && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              isActive ? 'bg-white/20' : 'bg-red-500 text-white'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                          {item.isNew && (
                            <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded">
                              NEW
                            </span>
                          )}
                          {item.isPro && (
                            <span className="px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold rounded">
                              PRO
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-slate-200 dark:border-navy-700">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-navy-800">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                {user?.nombre?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-slate-700 dark:text-white truncate">
                  {user?.nombre || 'Usuario'}
                </p>
                <p className="text-xs text-slate-400 truncate">{user?.email || ''}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-slate-200 dark:hover:bg-navy-700 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full p-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-slate-400 hover:text-red-500 transition-colors flex justify-center"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Collapse button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-600 rounded-full flex items-center justify-center shadow-lg hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors hidden lg:flex"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-slate-400" />
          )}
        </button>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <main
        className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'
        }`}
      >
        {/* Top header */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-navy-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-navy-700 flex items-center justify-between px-4 lg:px-6">
          {/* Left side */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg lg:hidden"
            >
              <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>

            {/* Breadcrumb / Section title */}
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gradient-to-r ${activeItem.color}`}>
                {React.createElement(activeItem.icon, { className: 'w-5 h-5 text-white' })}
              </div>
              <div>
                <h2 className="font-bold text-slate-800 dark:text-white">
                  {activeItem.label}
                </h2>
                <p className="text-xs text-slate-400">
                  {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-navy-800 rounded-xl">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-40 bg-transparent text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none"
              />
              <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-200 dark:bg-navy-700 rounded text-[10px] font-medium text-slate-500">
                ⌘K
              </kbd>
            </div>

            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg transition-colors"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-amber-500" />
              ) : (
                <Moon className="w-5 h-5 text-slate-600" />
              )}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {/* Notifications dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-navy-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-navy-700 overflow-hidden">
                  <div className="p-4 border-b border-slate-200 dark:border-navy-700">
                    <h3 className="font-bold text-slate-800 dark:text-white">Notificaciones</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="p-4 border-b border-slate-100 dark:border-navy-700 hover:bg-slate-50 dark:hover:bg-navy-700 cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            notif.type === 'alert' ? 'bg-red-100 dark:bg-red-900/30' :
                            notif.type === 'success' ? 'bg-green-100 dark:bg-green-900/30' :
                            'bg-blue-100 dark:bg-blue-900/30'
                          }`}>
                            <notif.icon className={`w-4 h-4 ${
                              notif.type === 'alert' ? 'text-red-500' :
                              notif.type === 'success' ? 'text-green-500' :
                              'text-blue-500'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-slate-700 dark:text-slate-200">{notif.message}</p>
                            <p className="text-xs text-slate-400 mt-1">{notif.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-navy-700/50">
                    <button className="w-full text-center text-sm text-blue-600 dark:text-blue-400 font-medium">
                      Ver todas las notificaciones
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Help */}
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg transition-colors hidden md:flex">
              <HelpCircle className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>

      {/* Quick action button (floating) */}
      <button
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-orange-500/30 hover:scale-110 transition-transform z-40"
        title="IA Co-pilot"
        onClick={() => onSectionChange('ia-copilot')}
      >
        <Brain className="w-6 h-6" />
      </button>
    </div>
  );
};

export default AdminLayout;
