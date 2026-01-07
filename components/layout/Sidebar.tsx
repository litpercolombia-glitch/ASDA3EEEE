// components/layout/Sidebar.tsx
// Sidebar profesional estilo ChatGPT - Versión funcional

import React, { useState } from 'react';
import {
  Home,
  Package,
  Brain,
  TrendingUp,
  Briefcase,
  Settings,
  MessageCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Bell,
  BarChart3,
  Facebook,
  Chrome,
  Music2,
  Link2,
  Webhook,
  Zap,
  LogOut,
  User,
  Sparkles,
  ExternalLink,
  Mail,
  Phone,
} from 'lucide-react';
import { useLayoutStore, MainSection, MarketingTab } from '../../stores/layoutStore';

// ============================================
// TIPOS
// ============================================

interface SidebarProps {
  onLogout: () => void;
  onOpenChat: () => void;
  onOpenHelp: () => void;
  userName?: string;
  userEmail?: string;
}

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  isCollapsed?: boolean;
  badge?: number;
  onClick?: () => void;
  isNew?: boolean;
  disabled?: boolean;
}

interface SidebarSectionProps {
  title?: string;
  isCollapsed?: boolean;
  children: React.ReactNode;
}

// ============================================
// COMPONENTE SIDEBAR ITEM
// ============================================

function SidebarItem({
  icon: Icon,
  label,
  isActive = false,
  isCollapsed = false,
  badge,
  onClick,
  isNew = false,
  disabled = false,
}: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
        transition-all duration-200 group relative
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${isActive
          ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25'
          : 'text-gray-400 hover:text-white hover:bg-gray-800/80'
        }
      `}
      title={isCollapsed ? label : undefined}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />

      {!isCollapsed && (
        <>
          <span className="flex-1 text-left text-sm font-medium truncate">{label}</span>

          {badge !== undefined && badge > 0 && (
            <span className={`
              px-2 py-0.5 text-xs font-bold rounded-full
              ${isActive ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}
            `}>
              {badge > 99 ? '99+' : badge}
            </span>
          )}

          {isNew && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded">
              NEW
            </span>
          )}
        </>
      )}

      {/* Tooltip when collapsed */}
      {isCollapsed && (
        <div className="
          absolute left-full ml-2 px-3 py-1.5
          bg-gray-800 text-white text-sm rounded-lg
          opacity-0 group-hover:opacity-100 pointer-events-none
          transition-opacity whitespace-nowrap z-50
          shadow-xl border border-gray-700
        ">
          {label}
          {isNew && <span className="ml-2 text-green-400 text-xs">NEW</span>}
        </div>
      )}
    </button>
  );
}

// ============================================
// COMPONENTE SIDEBAR SECTION
// ============================================

function SidebarSection({ title, isCollapsed, children }: SidebarSectionProps) {
  return (
    <div className="space-y-1">
      {title && !isCollapsed && (
        <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {title}
        </p>
      )}
      {title && isCollapsed && <div className="h-px bg-gray-700/50 my-2 mx-2" />}
      {children}
    </div>
  );
}

// ============================================
// MODAL DE AYUDA
// ============================================

function HelpModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-md w-full border border-gray-700 shadow-2xl">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-blue-400" />
              Centro de Ayuda
            </h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-800/50 rounded-xl p-4">
            <h3 className="font-medium text-white mb-2">📚 Documentación</h3>
            <p className="text-sm text-gray-400 mb-3">Aprende a usar todas las funciones de LITPER PRO</p>
            <button className="text-blue-400 text-sm hover:text-blue-300 flex items-center gap-1">
              Ver documentación <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-4">
            <h3 className="font-medium text-white mb-2">💬 Soporte</h3>
            <p className="text-sm text-gray-400 mb-3">¿Necesitas ayuda? Contáctanos</p>
            <div className="space-y-2">
              <a href="mailto:soporte@litper.co" className="text-blue-400 text-sm hover:text-blue-300 flex items-center gap-2">
                <Mail className="w-4 h-4" /> soporte@litper.co
              </a>
              <a href="https://wa.me/573001234567" className="text-green-400 text-sm hover:text-green-300 flex items-center gap-2">
                <Phone className="w-4 h-4" /> WhatsApp
              </a>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-4 border border-blue-500/30">
            <h3 className="font-medium text-white mb-2">🚀 LITPER PRO v5.0</h3>
            <p className="text-sm text-gray-400">Plataforma Enterprise de Logística con IA</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// COMPONENTE PRINCIPAL SIDEBAR
// ============================================

export function Sidebar({ onLogout, onOpenChat, onOpenHelp, userName, userEmail }: SidebarProps) {
  const {
    sidebarCollapsed,
    sidebarHovered,
    activeSection,
    activeMarketingTab,
    toggleSidebar,
    setHovered,
    setActiveSection,
    setMarketingTab,
  } = useLayoutStore();

  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const isExpanded = !sidebarCollapsed || sidebarHovered;
  const [marketingExpanded, setMarketingExpanded] = React.useState(activeSection === 'marketing');

  // Menú principal
  const mainMenuItems: { id: MainSection; icon: React.ElementType; label: string; badge?: number; isNew?: boolean }[] = [
    { id: 'inicio', icon: Home, label: 'Inicio' },
    { id: 'operaciones', icon: Package, label: 'Operaciones' },
    { id: 'inteligencia', icon: Sparkles, label: 'Inteligencia' },
    { id: 'cerebro-ia', icon: Brain, label: 'Cerebro IA', isNew: true },
    { id: 'negocio', icon: Briefcase, label: 'Negocio' },
    { id: 'config', icon: Settings, label: 'Configuración' },
  ];

  // Submenú de Marketing
  const marketingSubItems: { id: MarketingTab; icon: React.ElementType; label: string }[] = [
    { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
    { id: 'meta', icon: Facebook, label: 'Meta Ads' },
    { id: 'google', icon: Chrome, label: 'Google Ads' },
    { id: 'tiktok', icon: Music2, label: 'TikTok Ads' },
    { id: 'utm', icon: Link2, label: 'UTMs' },
    { id: 'integraciones', icon: Webhook, label: 'Integraciones' },
    { id: 'reglas', icon: Zap, label: 'Reglas' },
  ];

  const handleMarketingClick = () => {
    if (activeSection !== 'marketing') {
      setActiveSection('marketing');
      setMarketingExpanded(true);
    } else {
      setMarketingExpanded(!marketingExpanded);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

  const handleHelpClick = () => {
    setShowHelpModal(true);
    onOpenHelp();
  };

  return (
    <>
      <aside
        className={`
          flex flex-col h-full bg-gray-900 border-r border-gray-800
          transition-all duration-300 ease-in-out
          ${isExpanded ? 'w-64' : 'w-16'}
        `}
        onMouseEnter={() => sidebarCollapsed && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Header */}
        <div className={`
          flex items-center h-16 px-4 border-b border-gray-800
          ${isExpanded ? 'justify-between' : 'justify-center'}
        `}>
          {isExpanded ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white tracking-tight">LITPER</h1>
                  <p className="text-[10px] text-amber-400 font-semibold -mt-1">PRO</p>
                </div>
              </div>
              <button
                onClick={toggleSidebar}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                title="Colapsar sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={toggleSidebar}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              title="Expandir sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
          {/* Main Menu */}
          <SidebarSection isCollapsed={!isExpanded}>
            {mainMenuItems.map((item) => (
              <SidebarItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                isActive={activeSection === item.id}
                isCollapsed={!isExpanded}
                badge={item.badge}
                isNew={item.isNew}
                onClick={() => setActiveSection(item.id)}
              />
            ))}
          </SidebarSection>

          {/* Marketing Section */}
          <SidebarSection title="Marketing" isCollapsed={!isExpanded}>
            <SidebarItem
              icon={TrendingUp}
              label="Marketing"
              isActive={activeSection === 'marketing'}
              isCollapsed={!isExpanded}
              isNew
              onClick={handleMarketingClick}
            />

            {/* Marketing Submenu */}
            {isExpanded && activeSection === 'marketing' && marketingExpanded && (
              <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-700 pl-2">
                {marketingSubItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setMarketingTab(item.id)}
                    className={`
                      w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                      transition-colors
                      ${activeMarketingTab === item.id
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                      }
                    `}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </SidebarSection>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-800 p-2 space-y-1">
          <SidebarItem
            icon={MessageCircle}
            label="Chat IA"
            isCollapsed={!isExpanded}
            onClick={onOpenChat}
          />
          <SidebarItem
            icon={HelpCircle}
            label="Ayuda"
            isCollapsed={!isExpanded}
            onClick={handleHelpClick}
          />

          {/* User */}
          {isExpanded && (
            <div className="flex items-center gap-3 px-3 py-2 mt-2 bg-gray-800/50 rounded-xl">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{userName || 'Usuario'}</p>
                <p className="text-xs text-gray-500 truncate">{userEmail || 'user@litper.co'}</p>
              </div>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Collapsed user logout */}
          {!isExpanded && (
            <SidebarItem
              icon={LogOut}
              label="Cerrar sesión"
              isCollapsed={!isExpanded}
              onClick={() => setShowLogoutConfirm(true)}
            />
          )}
        </div>
      </aside>

      {/* Help Modal */}
      <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />

      {/* Logout Confirmation */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl max-w-sm w-full border border-gray-700 shadow-2xl p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">¿Cerrar sesión?</h3>
              <p className="text-gray-400 text-sm mb-6">Se perderán los datos no guardados</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
