// components/layout/Sidebar.tsx
// COMMAND CENTER - Sidebar Futurista con diseño sci-fi

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
  Building2,
  ShieldCheck,
  BarChart2,
  Workflow,
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
  Radio,
  Satellite,
  Cpu,
  Hexagon,
  CircuitBoard,
  Wifi,
  Upload,
  Scissors,
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
  EnterpriseTab,
  HerramientasTab,
} from '../../stores/layoutStore';

// ============================================
// TIPOS
// ============================================

interface SidebarProps {
  onLogout: () => void;
  onOpenChat: () => void;
  onOpenHelp: () => void;
  onUploadReport?: () => void;
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
  color?: string;
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
  'enterprise': [
    { id: 'command-center', icon: LayoutDashboard, label: 'Command Center' },
    { id: 'empresas', icon: Building2, label: 'Multi-Empresa' },
    { id: 'analytics', icon: BarChart2, label: 'Analytics Global' },
    { id: 'compliance', icon: ShieldCheck, label: 'Compliance' },
    { id: 'security', icon: Shield, label: 'Security SOC' },
    { id: 'users', icon: Users, label: 'Usuarios' },
    { id: 'automation', icon: Workflow, label: 'Automatizacion' },
  ],
  'herramientas': [
    { id: 'video-trimmer', icon: Scissors, label: 'Recortar Video' },
  ],
};

// ============================================
// COMPONENTE SIDEBAR EXPANDIBLE ITEM - FUTURISTA
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
  accentColor?: string;
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
          transition-all duration-300 ease-out group relative
          cc-nav-item
          ${isActive ? 'active' : ''}
        `}
        title={isCollapsed ? label : undefined}
      >
        {/* Icono con efecto neón */}
        <div className={`relative flex-shrink-0 ${isActive ? 'cc-icon-glow' : ''}`}>
          <Icon className={`w-5 h-5 cc-icon transition-colors duration-300 ${
            isActive
              ? 'text-cyan-400'
              : 'text-gray-400 group-hover:text-cyan-300'
          }`} />
        </div>

        {!isCollapsed && (
          <>
            <span className={`flex-1 text-left text-sm font-medium truncate transition-colors duration-300 ${
              isActive ? 'text-cyan-300' : 'text-gray-300 group-hover:text-white'
            }`}>
              {label}
            </span>

            {isNew && (
              <span className="cc-badge-new px-1.5 py-0.5 text-[10px] font-bold rounded">
                NEW
              </span>
            )}

            {hasSubItems && (
              <button
                onClick={handleChevronClick}
                className={`p-0.5 rounded transition-all duration-300 ${
                  isExpanded ? 'rotate-180 text-cyan-400' : 'text-gray-500'
                }`}
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            )}
          </>
        )}

        {/* Tooltip when collapsed */}
        {isCollapsed && (
          <div className="
            absolute left-full ml-3 px-3 py-2
            cc-glass-elevated rounded-lg
            opacity-0 group-hover:opacity-100 pointer-events-none
            transition-all duration-200 whitespace-nowrap z-50
            text-cyan-300 text-sm font-medium
            border border-cyan-500/30
          ">
            <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-cyan-500/20 rotate-45 border-l border-b border-cyan-500/30" />
            {label}
            {isNew && <span className="ml-2 cc-badge-new px-1 py-0.5 text-[9px] rounded">NEW</span>}
          </div>
        )}
      </button>

      {/* Sub-menú desplegable con estilo futurista */}
      {!isCollapsed && isExpanded && hasSubItems && subItems.length > 0 && (
        <div className="ml-4 space-y-0.5 pl-3 border-l border-cyan-500/20 relative overflow-hidden">
          {/* Línea de energía animada */}
          <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/50 via-amber-500/30 to-cyan-500/50" />

          {subItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => onSubItemClick?.(item.id)}
              className={`
                w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                transition-all duration-200 group/sub relative
                ${activeSubItem === item.id
                  ? 'bg-cyan-500/10 text-cyan-400 font-medium border border-cyan-500/30'
                  : 'text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/5'
                }
              `}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Indicador de punto activo */}
              <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                activeSubItem === item.id
                  ? 'bg-cyan-400 shadow-[0_0_8px_rgba(0,245,255,0.8)]'
                  : 'bg-gray-600 group-hover/sub:bg-cyan-500/50'
              }`} />

              <item.icon className={`w-4 h-4 transition-all duration-200 ${
                activeSubItem === item.id
                  ? 'text-cyan-400'
                  : 'text-gray-500 group-hover/sub:text-cyan-400'
              }`} />

              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// COMPONENTE SIDEBAR SECTION - FUTURISTA
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
        <div className="px-3 py-2 flex items-center gap-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
          <p className="text-[10px] font-bold text-cyan-500/70 uppercase tracking-[0.2em]">
            {title}
          </p>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
        </div>
      )}
      {title && isCollapsed && <div className="cc-divider" />}
      {children}
    </div>
  );
}

// ============================================
// MODAL DE AYUDA - FUTURISTA
// ============================================

function HelpModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in cc-hex-pattern">
      <div className="cc-glass-elevated rounded-2xl max-w-md w-full shadow-2xl modal-enter relative cc-corner-tl cc-corner-br">
        {/* Header */}
        <div className="p-6 border-b border-cyan-500/20">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-cyan-400 to-amber-400 bg-clip-text text-transparent">
                Centro de Comando
              </span>
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-cyan-400 cc-btn rounded-lg transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="cc-card p-4 hover:border-cyan-500/40 transition-all duration-300">
            <div className="flex items-center gap-3 mb-2">
              <CircuitBoard className="w-5 h-5 text-cyan-400" />
              <h3 className="font-semibold text-white">Documentación</h3>
            </div>
            <p className="text-sm text-gray-400 mb-3">Aprende a usar todas las funciones del Command Center</p>
            <button className="text-cyan-400 text-sm hover:text-cyan-300 flex items-center gap-1 group">
              Ver documentación <ExternalLink className="w-3 h-3 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          <div className="cc-card p-4 hover:border-cyan-500/40 transition-all duration-300">
            <div className="flex items-center gap-3 mb-2">
              <Satellite className="w-5 h-5 text-amber-400" />
              <h3 className="font-semibold text-white">Soporte Técnico</h3>
            </div>
            <p className="text-sm text-gray-400 mb-3">Conexión directa con el equipo de soporte</p>
            <div className="space-y-2">
              <a href="mailto:litpercolombia@gmail.com" className="text-cyan-400 text-sm hover:text-cyan-300 flex items-center gap-2 transition-transform hover:translate-x-1">
                <Mail className="w-4 h-4" /> litpercolombia@gmail.com
              </a>
              <a href="https://wa.me/573144754115" target="_blank" rel="noopener noreferrer" className="text-green-400 text-sm hover:text-green-300 flex items-center gap-2 transition-transform hover:translate-x-1">
                <Phone className="w-4 h-4" /> +57 314 475 4115
              </a>
            </div>
          </div>

          <div className="cc-card p-4 cc-hologram border-amber-500/30 hover:border-amber-500/50 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="cc-logo w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center relative">
                <div className="cc-logo-glow rounded-xl" />
                <Crown className="w-6 h-6 text-white relative z-10" />
              </div>
              <div>
                <h3 className="font-bold text-white flex items-center gap-2">
                  LITPER COMMAND
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </h3>
                <p className="text-sm text-gray-400">Sistema Empresarial v2.0</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// LOGO LP - COMMAND CENTER STYLE
// ============================================

function LitperLogo({ isCollapsed }: { isCollapsed: boolean }) {
  return (
    <div className="flex items-center gap-3 group">
      {/* Logo con efectos sci-fi */}
      <div className="cc-logo relative">
        {/* Glow effect */}
        <div className="cc-logo-glow rounded-xl" />

        {/* Main logo container */}
        <div className="relative w-11 h-11 bg-gradient-to-br from-cyan-400 via-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/40 group-hover:shadow-cyan-500/60 transition-all transform group-hover:scale-105 border border-cyan-300/30 flex items-center justify-center overflow-visible">
          {/* Inner glow ring */}
          <div className="absolute inset-0.5 bg-gradient-to-br from-white/20 to-transparent rounded-lg" />

          {/* Hexagonal pattern */}
          <div className="absolute inset-0 opacity-30 cc-hex-pattern rounded-lg" />

          {/* Logo letters */}
          <div className="relative flex items-center justify-center">
            <span className="text-xl font-black text-white drop-shadow-lg tracking-tighter" style={{ textShadow: '0 0 10px rgba(0,245,255,0.5)' }}>L</span>
            <span className="text-sm font-black text-cyan-100 -ml-0.5 drop-shadow" style={{ textShadow: '0 0 8px rgba(0,245,255,0.3)' }}>P</span>
          </div>

          {/* Circuit accent */}
          <Cpu className="absolute -top-2 -right-2 w-4 h-4 text-cyan-300 drop-shadow-lg" />

          {/* Status indicator */}
          <div className="absolute -bottom-1 -right-1 cc-status-online" />
        </div>
      </div>

      {!isCollapsed && (
        <div>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-1">
            <span className="text-white">LIT</span>
            <span className="bg-gradient-to-r from-cyan-400 via-cyan-300 to-amber-400 bg-clip-text text-transparent">PER</span>
          </h1>
          <p className="text-[9px] text-cyan-500/70 font-bold tracking-[0.2em] uppercase -mt-0.5 flex items-center gap-1">
            <Radio className="w-2.5 h-2.5 animate-pulse" />
            COMMAND CENTER
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================
// STATUS BAR COMPONENT
// ============================================

function StatusBar({ isCollapsed }: { isCollapsed: boolean }) {
  if (isCollapsed) return null;

  return (
    <div className="px-3 py-2 mx-2 rounded-lg bg-black/30 border border-cyan-500/10">
      <div className="flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-1.5">
          <div className="cc-status-online w-2 h-2" />
          <span className="text-cyan-400 font-mono uppercase">Sistema Online</span>
        </div>
        <div className="flex items-center gap-1">
          <Wifi className="w-3 h-3 text-green-400" />
          <span className="text-gray-500 font-mono">99.9%</span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// COMPONENTE PRINCIPAL SIDEBAR - COMMAND CENTER
// ============================================

export function Sidebar({ onLogout, onOpenChat, onOpenHelp, onUploadReport, userName, userEmail }: SidebarProps) {
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
    activeEnterpriseTab,
    activeHerramientasTab,
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
    setEnterpriseTab,
    setHerramientasTab,
    toggleSectionExpanded,
  } = useLayoutStore();

  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const isExpanded = !sidebarCollapsed || sidebarHovered;

  // Menu principal con colores de acento
  // NOTA: Modo Admin (config) ha sido migrado a Enterprise Global
  const mainMenuItems: MenuItem[] = [
    { id: 'inicio', icon: Home, label: 'Centro de Control', subItems: SUB_MENUS['inicio'] },
    { id: 'operaciones', icon: Package, label: 'Operaciones', subItems: SUB_MENUS['operaciones'] },
    { id: 'inteligencia', icon: Sparkles, label: 'Inteligencia', subItems: SUB_MENUS['inteligencia'] },
    { id: 'cerebro-ia', icon: Brain, label: 'Cerebro IA', isNew: true, subItems: SUB_MENUS['cerebro-ia'] },
    { id: 'negocio', icon: Briefcase, label: 'Centro Negocio', subItems: SUB_MENUS['negocio'] },
    { id: 'herramientas', icon: Scissors, label: 'Herramientas', isNew: true, subItems: SUB_MENUS['herramientas'] },
    { id: 'enterprise', icon: Crown, label: 'Enterprise Global', isNew: true, subItems: SUB_MENUS['enterprise'] },
  ];

  // Obtener el sub-item activo según la sección
  const getActiveSubItem = (section: MainSection): string | undefined => {
    switch (section) {
      case 'inicio': return activeInicioTab;
      case 'operaciones': return activeOperacionesTab;
      case 'inteligencia': return activeInteligenciaTab;
      case 'cerebro-ia': return activeCerebroIATab;
      case 'negocio': return activeNegocioTab;
      case 'config': return activeConfigTab;
      case 'marketing': return activeMarketingTab;
      case 'enterprise': return activeEnterpriseTab;
      case 'herramientas': return activeHerramientasTab;
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
      case 'enterprise': setEnterpriseTab(subItemId as EnterpriseTab); break;
      case 'herramientas': setHerramientasTab(subItemId as HerramientasTab); break;
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
          flex flex-col h-full cc-sidebar relative
          transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
          ${isExpanded ? 'w-64' : 'w-16'}
          shadow-2xl shadow-black/50
        `}
        onMouseEnter={() => sidebarCollapsed && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Patrón hexagonal de fondo */}
        <div className="absolute inset-0 cc-hex-pattern opacity-50 pointer-events-none" />

        {/* Header */}
        <div className={`
          relative z-10 flex items-center h-16 px-3 border-b border-cyan-500/20
          ${isExpanded ? 'justify-between' : 'justify-center'}
        `}>
          {isExpanded ? (
            <>
              <LitperLogo isCollapsed={false} />
              <button
                onClick={toggleSidebar}
                className="p-1.5 text-gray-400 hover:text-cyan-400 cc-btn rounded-lg transition-all duration-300"
                title="Colapsar panel"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button
              onClick={toggleSidebar}
              className="p-2 text-gray-400 hover:text-cyan-400 cc-btn rounded-lg transition-all duration-300"
              title="Expandir panel"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Status Bar */}
        <div className="relative z-10 py-2">
          <StatusBar isCollapsed={!isExpanded} />
        </div>

        {/* Navigation */}
        <nav className="relative z-10 flex-1 overflow-y-auto py-2 px-2 space-y-1 cc-scrollbar">
          {/* Main Menu */}
          <SidebarSection isCollapsed={!isExpanded}>
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
          </SidebarSection>

          {/* Marketing Section */}
          <SidebarSection title="Marketing Hub" isCollapsed={!isExpanded}>
            <ExpandableSidebarItem
              icon={TrendingUp}
              label="Marketing Central"
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
        <div className="relative z-10 border-t border-cyan-500/20 p-2 space-y-1">
          {/* Upload Report Button */}
          {onUploadReport && (
            <button
              onClick={onUploadReport}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 mb-2 rounded-xl bg-gradient-to-r from-indigo-600/80 to-purple-600/80 hover:from-indigo-500 hover:to-purple-500 text-white transition-all duration-300 border border-indigo-500/30 shadow-lg shadow-indigo-500/20 ${
                !isExpanded ? 'justify-center' : ''
              }`}
              title="Subir Reporte"
            >
              <Upload className="w-5 h-5" />
              {isExpanded && <span className="text-sm font-bold">Subir Reporte</span>}
            </button>
          )}

          {/* Quick Actions */}
          <div className="flex gap-1 mb-2">
            <button
              onClick={onOpenChat}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl cc-btn transition-all duration-300 ${
                !isExpanded ? 'justify-center' : ''
              }`}
              title="Chat IA"
            >
              <Bot className="w-5 h-5 text-cyan-400" />
              {isExpanded && <span className="text-sm font-medium text-gray-300">Chat IA</span>}
            </button>

            <button
              onClick={() => setShowHelpModal(true)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl cc-btn transition-all duration-300 ${
                !isExpanded ? 'justify-center' : ''
              }`}
              title="Ayuda"
            >
              <HelpCircle className="w-5 h-5 text-amber-400" />
              {isExpanded && <span className="text-sm font-medium text-gray-300">Ayuda</span>}
            </button>
          </div>

          {/* User Card */}
          {isExpanded && (
            <div className="cc-card p-3 cc-data-stream">
              <div className="flex items-center gap-3 relative z-10">
                <div className="cc-avatar">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg relative z-10">
                    <User className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{userName || 'Operador'}</p>
                  <p className="text-xs text-cyan-500/70 truncate font-mono">{userEmail || 'operator@litper.co'}</p>
                </div>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-300 border border-transparent hover:border-red-500/30"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Collapsed user logout */}
          {!isExpanded && (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center justify-center px-3 py-2.5 rounded-xl cc-btn text-gray-400 hover:text-red-400 hover:border-red-500/30 transition-all duration-300"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>

      {/* Help Modal */}
      <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />

      {/* Logout Confirmation - Futuristic */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in cc-hex-pattern">
          <div className="cc-glass-elevated rounded-2xl max-w-sm w-full p-6 modal-enter cc-corner-tl cc-corner-br relative">
            <div className="text-center">
              <div className="relative mx-auto w-20 h-20 mb-4">
                <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
                <div className="relative w-full h-full bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30">
                  <LogOut className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Desconexión del Sistema</h3>
              <p className="text-gray-400 text-sm mb-6">Se perderán los datos de sesión no guardados</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-3 cc-btn text-white rounded-xl font-medium transition-all duration-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-red-500/30 hover:translate-y-[-2px]"
                >
                  Desconectar
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
