// components/layout/Sidebar.tsx
// Sidebar profesional estilo ChatGPT

import React from 'react';
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
} from 'lucide-react';
import { useLayoutStore, MainSection, MarketingTab } from '../../stores/layoutStore';

// ============================================
// TIPOS
// ============================================

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  isCollapsed?: boolean;
  badge?: number;
  onClick?: () => void;
  children?: React.ReactNode;
  isNew?: boolean;
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
}: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
        transition-all duration-200 group relative
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
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-green-500 text-white rounded">
              NEW
            </span>
          )}
        </>
      )}

      {/* Tooltip when collapsed */}
      {isCollapsed && (
        <div className="
          absolute left-full ml-2 px-2 py-1
          bg-gray-800 text-white text-sm rounded-lg
          opacity-0 group-hover:opacity-100 pointer-events-none
          transition-opacity whitespace-nowrap z-50
          shadow-xl
        ">
          {label}
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
// COMPONENTE PRINCIPAL SIDEBAR
// ============================================

export function Sidebar() {
  const {
    sidebarCollapsed,
    sidebarHovered,
    activeSection,
    activeMarketingTab,
    toggleSidebar,
    setHovered,
    setActiveSection,
    setMarketingTab,
    toggleChatAssistant,
  } = useLayoutStore();

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

  return (
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
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">LITPER</h1>
                <p className="text-[10px] text-gray-500 -mt-1">PRO</p>
              </div>
            </div>
            <button
              onClick={toggleSidebar}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            onClick={toggleSidebar}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
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
          onClick={toggleChatAssistant}
        />
        <SidebarItem
          icon={HelpCircle}
          label="Ayuda"
          isCollapsed={!isExpanded}
        />

        {/* User */}
        {isExpanded && (
          <div className="flex items-center gap-3 px-3 py-2 mt-2 bg-gray-800/50 rounded-xl">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Marketing Admin</p>
              <p className="text-xs text-gray-500 truncate">admin@marketing.com</p>
            </div>
            <button className="p-1 text-gray-400 hover:text-red-400 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
