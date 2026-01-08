// components/layout/Sidebar.tsx
// Sidebar profesional estilo ChatGPT - Con sub-menús desplegables

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
  ChevronDown,
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
  X,
  Crown,
  Activity,
  Clock,
  Truck,
  MapPin,
  History,
  Route,
  LineChart,
  FileText,
  Lightbulb,
  Target,
  Users,
  DollarSign,
  Cog,
  Key,
  Shield,
  Layers,
  LayoutDashboard,
  Bot,
  MessageSquare,
} from 'lucide-react';
import {
  useLayoutStore,
  MainSection,
  MarketingTab,
  InicioTab,
  OperacionesTab,
  InteligenciaTab,
  CerebroIATab,
  NegocioTab,
  ConfigTab,
} from '../../stores/layoutStore';

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

interface SubMenuItem {
  id: string;
  icon: React.ElementType;
  label: string;
}

interface MenuItem {
  id: MainSection;
  icon: React.ElementType;
  label: string;
  badge?: number;
  isNew?: boolean;
  subItems?: SubMenuItem[];
}

// ============================================
// DEFINICIÓN DE SUB-MENÚS
// ============================================

const SUB_MENUS: Record<MainSection, SubMenuItem[]> = {
  'inicio': [
    { id: 'resumen', icon: LayoutDashboard, label: 'Resumen' },
    { id: 'actividad', icon: Activity, label: 'Actividad' },
    { id: 'estadisticas', icon: BarChart3, label: 'Estadísticas' },
  ],
  'operaciones': [
    { id: 'envios', icon: Truck, label: 'Envíos' },
    { id: 'tracking', icon: MapPin, label: 'Tracking' },
    { id: 'historial', icon: History, label: 'Historial' },
    { id: 'rutas', icon: Route, label: 'Rutas' },
  ],
  'inteligencia': [
    { id: 'analisis', icon: LineChart, label: 'Análisis' },
    { id: 'reportes', icon: FileText, label: 'Reportes' },
    { id: 'predicciones', icon: Target, label: 'Predicciones' },
    { id: 'insights', icon: Lightbulb, label: 'Insights' },
  ],
  'cerebro-ia': [
    { id: 'asistente', icon: Bot, label: 'Asistente IA' },
    { id: 'configuracion-ia', icon: Cog, label: 'Config. IA' },
    { id: 'historial-chat', icon: MessageSquare, label: 'Historial' },
  ],
  'negocio': [
    { id: 'metricas', icon: BarChart3, label: 'Métricas' },
    { id: 'clientes', icon: Users, label: 'Clientes' },
    { id: 'ventas', icon: DollarSign, label: 'Ventas' },
    { id: 'rendimiento', icon: TrendingUp, label: 'Rendimiento' },
  ],
  'config': [
    { id: 'general', icon: Cog, label: 'General' },
    { id: 'api-keys', icon: Key, label: 'API Keys' },
    { id: 'integraciones', icon: Layers, label: 'Integraciones' },
    { id: 'usuarios', icon: Users, label: 'Usuarios' },
    { id: 'admin', icon: Shield, label: 'Seguridad' },
  ],
  'marketing': [
    { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
    { id: 'meta', icon: Facebook, label: 'Meta Ads' },
    { id: 'google', icon: Chrome, label: 'Google Ads' },
    { id: 'tiktok', icon: Music2, label: 'TikTok Ads' },
    { id: 'utm', icon: Link2, label: 'UTMs' },
    { id: 'integraciones', icon: Webhook, label: 'Integraciones' },
    { id: 'reglas', icon: Zap, label: 'Reglas' },
  ],
};

// ============================================
// COMPONENTE SIDEBAR EXPANDIBLE ITEM
// ============================================

interface ExpandableSidebarItemProps {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  isExpanded: boolean;
  isCollapsed: boolean;
  hasSubItems: boolean;
  isNew?: boolean;
  onClick: () => void;
  onToggleExpand: () => void;
  subItems?: SubMenuItem[];
  activeSubItem?: string;
  onSubItemClick?: (id: string) => void;
}

function ExpandableSidebarItem({
  icon: Icon,
  label,
  isActive,
  isExpanded,
  isCollapsed,
  hasSubItems,
  isNew,
  onClick,
  onToggleExpand,
  subItems = [],
  activeSubItem,
  onSubItemClick,
}: ExpandableSidebarItemProps) {
  const handleClick = () => {
    onClick();
    if (hasSubItems && !isExpanded) {
      onToggleExpand();
    }
  };

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand();
  };

  return (
    <div className="space-y-1">
      <button
        onClick={handleClick}
        className={`
          w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
          transition-all duration-200 group relative
          ${isActive
            ? 'bg-gradient-to-r from-amber-600 to-orange-500 text-white shadow-lg shadow-orange-500/25'
            : 'text-gray-400 hover:text-white hover:bg-gray-800/80'
          }
        `}
        title={isCollapsed ? label : undefined}
      >
        <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />

        {!isCollapsed && (
          <>
            <span className="flex-1 text-left text-sm font-medium truncate">{label}</span>

            {isNew && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded">
                NEW
              </span>
            )}

            {hasSubItems && (
              <button
                onClick={handleChevronClick}
                className={`p-0.5 rounded transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              >
                <ChevronDown className="w-4 h-4" />
              </button>
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

      {/* Sub-menú desplegable */}
      {!isCollapsed && isExpanded && hasSubItems && subItems.length > 0 && (
        <div className="ml-4 space-y-0.5 border-l-2 border-amber-500/30 pl-2 animate-slide-down">
          {subItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSubItemClick?.(item.id)}
              className={`
                w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                transition-all duration-150
                ${activeSubItem === item.id
                  ? 'bg-amber-500/20 text-amber-400 font-medium'
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
    </div>
  );
}

// ============================================
// COMPONENTE SIDEBAR SECTION
// ============================================

interface SidebarSectionProps {
  title?: string;
  isCollapsed?: boolean;
  children: React.ReactNode;
}

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-md w-full border border-gray-700 shadow-2xl animate-fade-in-scale">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-amber-400" />
              Centro de Ayuda
            </h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-800/50 rounded-xl p-4">
            <h3 className="font-medium text-white mb-2">Documentacion</h3>
            <p className="text-sm text-gray-400 mb-3">Aprende a usar todas las funciones de LITPER PRO</p>
            <button className="text-amber-400 text-sm hover:text-amber-300 flex items-center gap-1">
              Ver documentacion <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-4">
            <h3 className="font-medium text-white mb-2">Soporte</h3>
            <p className="text-sm text-gray-400 mb-3">Necesitas ayuda? Contactanos</p>
            <div className="space-y-2">
              <a href="mailto:litpercolombia@gmail.com" className="text-amber-400 text-sm hover:text-amber-300 flex items-center gap-2">
                <Mail className="w-4 h-4" /> litpercolombia@gmail.com
              </a>
              <a href="https://wa.me/573144754115" target="_blank" rel="noopener noreferrer" className="text-green-400 text-sm hover:text-green-300 flex items-center gap-2">
                <Phone className="w-4 h-4" /> +57 314 475 4115
              </a>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-600/20 to-orange-600/20 rounded-xl p-4 border border-amber-500/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-red-600 rounded-xl flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white">LITPER OFICIAL</h3>
                <p className="text-sm text-gray-400">Calidad en cada detalle</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// LOGO LP CON CORONA
// ============================================

function LitperLogo({ isCollapsed }: { isCollapsed: boolean }) {
  return (
    <div className="flex items-center gap-3">
      {/* Logo con corona */}
      <div className="relative">
        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 via-yellow-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30 relative overflow-hidden">
          {/* Corona pequena arriba */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2">
            <Crown className="w-4 h-4 text-yellow-300 drop-shadow-lg" />
          </div>
          {/* LP */}
          <span className="text-white font-black text-lg tracking-tighter mt-1">LP</span>
        </div>
        {/* Brillo */}
        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-300 rounded-full animate-pulse" />
      </div>

      {!isCollapsed && (
        <div>
          <h1 className="text-lg font-black text-white tracking-tight">LITPER</h1>
          <p className="text-[9px] text-amber-400 font-bold -mt-1 tracking-widest">OFICIAL</p>
        </div>
      )}
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
    activeInicioTab,
    activeOperacionesTab,
    activeInteligenciaTab,
    activeCerebroIATab,
    activeNegocioTab,
    activeConfigTab,
    expandedSections,
    toggleSidebar,
    setHovered,
    setActiveSection,
    setMarketingTab,
    setInicioTab,
    setOperacionesTab,
    setInteligenciaTab,
    setCerebroIATab,
    setNegocioTab,
    setConfigTab,
    toggleSectionExpanded,
  } = useLayoutStore();

  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const isExpanded = !sidebarCollapsed || sidebarHovered;

  // Menu principal
  const mainMenuItems: MenuItem[] = [
    { id: 'inicio', icon: Home, label: 'Inicio', subItems: SUB_MENUS['inicio'] },
    { id: 'operaciones', icon: Package, label: 'Operaciones', subItems: SUB_MENUS['operaciones'] },
    { id: 'inteligencia', icon: Sparkles, label: 'Inteligencia', subItems: SUB_MENUS['inteligencia'] },
    { id: 'cerebro-ia', icon: Brain, label: 'Cerebro IA', isNew: true, subItems: SUB_MENUS['cerebro-ia'] },
    { id: 'negocio', icon: Briefcase, label: 'Negocio', subItems: SUB_MENUS['negocio'] },
    { id: 'config', icon: Shield, label: 'Modo Admin', subItems: SUB_MENUS['config'] },
  ];

  // Obtener el sub-item activo segun la seccion
  const getActiveSubItem = (section: MainSection): string | undefined => {
    switch (section) {
      case 'inicio': return activeInicioTab;
      case 'operaciones': return activeOperacionesTab;
      case 'inteligencia': return activeInteligenciaTab;
      case 'cerebro-ia': return activeCerebroIATab;
      case 'negocio': return activeNegocioTab;
      case 'config': return activeConfigTab;
      case 'marketing': return activeMarketingTab;
      default: return undefined;
    }
  };

  // Handler para sub-items
  const handleSubItemClick = (section: MainSection, subItemId: string) => {
    switch (section) {
      case 'inicio': setInicioTab(subItemId as InicioTab); break;
      case 'operaciones': setOperacionesTab(subItemId as OperacionesTab); break;
      case 'inteligencia': setInteligenciaTab(subItemId as InteligenciaTab); break;
      case 'cerebro-ia': setCerebroIATab(subItemId as CerebroIATab); break;
      case 'negocio': setNegocioTab(subItemId as NegocioTab); break;
      case 'config': setConfigTab(subItemId as ConfigTab); break;
      case 'marketing': setMarketingTab(subItemId as MarketingTab); break;
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

  return (
    <>
      <aside
        className={`
          flex flex-col h-full bg-gray-900 border-r border-gray-800
          transition-all duration-300 ease-in-out relative
          ${isExpanded ? 'w-64' : 'w-16'}
        `}
        onMouseEnter={() => sidebarCollapsed && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Header */}
        <div className={`
          flex items-center h-16 px-3 border-b border-gray-800
          ${isExpanded ? 'justify-between' : 'justify-center'}
        `}>
          {isExpanded ? (
            <>
              <LitperLogo isCollapsed={false} />
              <button
                onClick={toggleSidebar}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
                title="Colapsar sidebar"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button
              onClick={toggleSidebar}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
              title="Expandir sidebar"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {/* Main Menu */}
          {mainMenuItems.map((item) => (
            <ExpandableSidebarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={activeSection === item.id}
              isExpanded={expandedSections.includes(item.id)}
              isCollapsed={!isExpanded}
              hasSubItems={!!item.subItems && item.subItems.length > 0}
              isNew={item.isNew}
              onClick={() => setActiveSection(item.id)}
              onToggleExpand={() => toggleSectionExpanded(item.id)}
              subItems={item.subItems}
              activeSubItem={getActiveSubItem(item.id)}
              onSubItemClick={(subId) => handleSubItemClick(item.id, subId)}
            />
          ))}

          {/* Marketing Section */}
          <SidebarSection title="Marketing" isCollapsed={!isExpanded}>
            <ExpandableSidebarItem
              icon={TrendingUp}
              label="Marketing"
              isActive={activeSection === 'marketing'}
              isExpanded={expandedSections.includes('marketing')}
              isCollapsed={!isExpanded}
              hasSubItems={true}
              isNew
              onClick={() => setActiveSection('marketing')}
              onToggleExpand={() => toggleSectionExpanded('marketing')}
              subItems={SUB_MENUS['marketing']}
              activeSubItem={activeMarketingTab}
              onSubItemClick={(subId) => setMarketingTab(subId as MarketingTab)}
            />
          </SidebarSection>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-800 p-2 space-y-1">
          <button
            onClick={onOpenChat}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/80 transition-all duration-200"
            title={!isExpanded ? 'Chat IA' : undefined}
          >
            <MessageCircle className="w-5 h-5" />
            {isExpanded && <span className="text-sm font-medium">Chat IA</span>}
          </button>

          <button
            onClick={() => setShowHelpModal(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/80 transition-all duration-200"
            title={!isExpanded ? 'Ayuda' : undefined}
          >
            <HelpCircle className="w-5 h-5" />
            {isExpanded && <span className="text-sm font-medium">Ayuda</span>}
          </button>

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
                title="Cerrar sesion"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Collapsed user logout */}
          {!isExpanded && (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
              title="Cerrar sesion"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>

      {/* Help Modal */}
      <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />

      {/* Logout Confirmation */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl max-w-sm w-full border border-gray-700 shadow-2xl p-6 animate-fade-in-scale">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Cerrar sesion?</h3>
              <p className="text-gray-400 text-sm mb-6">Se perderan los datos no guardados</p>
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
                  Cerrar sesion
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
