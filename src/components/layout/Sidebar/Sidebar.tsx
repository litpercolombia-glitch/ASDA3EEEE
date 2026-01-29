/**
 * Sidebar - LITPER PRO
 *
 * Componente principal del sidebar profesional
 * Inspirado en Linear, Notion, Slack y Raycast
 */

import React, { useEffect } from 'react';
import {
  Home,
  MessageSquare,
  LayoutDashboard,
  Package,
  Truck,
  Route,
  Warehouse,
  Building2,
  FileText,
  DollarSign,
  BarChart3,
  Users,
  ShoppingCart,
  Megaphone,
  Settings,
  UserCog,
  Puzzle,
  Palette,
  X,
} from 'lucide-react';

import { useSidebarStore } from '../../../../stores/sidebarStore';
import { SidebarHeader } from './SidebarHeader';
import { SidebarSearch } from './SidebarSearch';
import { SidebarSection, SidebarDivider } from './SidebarSection';
import { SidebarItem } from './SidebarItem';
import { SidebarFavorites } from './SidebarFavorites';
import { SidebarUserMenu } from './SidebarUserMenu';
import { CommandPalette } from './CommandPalette';

// Width constants
const SIDEBAR_EXPANDED_WIDTH = 280;
const SIDEBAR_COLLAPSED_WIDTH = 72;

interface SidebarProps {
  className?: string;
  onNavigate?: (path: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  className = '',
  onNavigate,
}) => {
  const {
    isCollapsed,
    isMobileOpen,
    setMobileOpen,
    activeItemId,
    setActiveItem,
    notifications,
  } = useSidebarStore();

  // Get notification count for an item
  const getItemBadge = (itemId: string) => {
    const notification = notifications.find((n) => n.itemId === itemId);
    if (!notification) return undefined;
    return {
      count: notification.count,
      variant: notification.type,
      pulse: notification.pulse,
    };
  };

  // Handle navigation
  const handleNavigate = (itemId: string, path: string) => {
    setActiveItem(itemId);
    onNavigate?.(path);
    // Close mobile sidebar after navigation
    if (isMobileOpen) {
      setMobileOpen(false);
    }
  };

  // Close mobile sidebar on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        setMobileOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isMobileOpen, setMobileOpen]);

  // Sidebar content
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <SidebarHeader isCollapsed={isCollapsed} />

      {/* Search */}
      <SidebarSearch isCollapsed={isCollapsed} />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 scrollbar-thin">
        {/* Favorites */}
        <SidebarFavorites isCollapsed={isCollapsed} />

        {isCollapsed ? <SidebarDivider /> : null}

        {/* Principal Section */}
        <SidebarSection
          id="principal"
          title="Principal"
          isCollapsed={isCollapsed}
        >
          <SidebarItem
            id="home"
            label="Inicio"
            icon={<Home className="w-5 h-5" />}
            path="/"
            isActive={activeItemId === 'home'}
            isCollapsed={isCollapsed}
            onClick={() => handleNavigate('home', '/')}
            shortcut="H"
          />
          <SidebarItem
            id="chat"
            label="Chat IA"
            icon={<MessageSquare className="w-5 h-5" />}
            path="/chat"
            isActive={activeItemId === 'chat'}
            isCollapsed={isCollapsed}
            onClick={() => handleNavigate('chat', '/chat')}
            badge={getItemBadge('chat')}
            shortcut="C"
          />
          <SidebarItem
            id="dashboard"
            label="Dashboard"
            icon={<LayoutDashboard className="w-5 h-5" />}
            path="/dashboard"
            isActive={activeItemId === 'dashboard'}
            isCollapsed={isCollapsed}
            onClick={() => handleNavigate('dashboard', '/dashboard')}
            shortcut="D"
          />
          <SidebarItem
            id="pedidos"
            label="Pedidos"
            icon={<Package className="w-5 h-5" />}
            path="/pedidos"
            isActive={activeItemId === 'pedidos'}
            isCollapsed={isCollapsed}
            onClick={() => handleNavigate('pedidos', '/pedidos')}
            badge={getItemBadge('pedidos')}
            shortcut="P"
          />
        </SidebarSection>

        {/* Logística Section */}
        <SidebarSection
          id="logistica"
          title="Logística"
          isCollapsed={isCollapsed}
        >
          <SidebarItem
            id="tracking"
            label="Tracking"
            icon={<Truck className="w-5 h-5" />}
            path="/tracking"
            isActive={activeItemId === 'tracking'}
            isCollapsed={isCollapsed}
            onClick={() => handleNavigate('tracking', '/tracking')}
          />
          <SidebarItem
            id="rutas"
            label="Rutas"
            icon={<Route className="w-5 h-5" />}
            path="/rutas"
            isActive={activeItemId === 'rutas'}
            isCollapsed={isCollapsed}
            onClick={() => handleNavigate('rutas', '/rutas')}
          />
          <SidebarItem
            id="almacenes"
            label="Almacenes"
            icon={<Warehouse className="w-5 h-5" />}
            path="/almacenes"
            isActive={activeItemId === 'almacenes'}
            isCollapsed={isCollapsed}
            onClick={() => handleNavigate('almacenes', '/almacenes')}
          />
          <SidebarItem
            id="transportadoras"
            label="Transportadoras"
            icon={<Building2 className="w-5 h-5" />}
            path="/transportadoras"
            isActive={activeItemId === 'transportadoras'}
            isCollapsed={isCollapsed}
            onClick={() => handleNavigate('transportadoras', '/transportadoras')}
          />
        </SidebarSection>

        {/* Finanzas Section */}
        <SidebarSection
          id="finanzas"
          title="Finanzas"
          isCollapsed={isCollapsed}
        >
          <SidebarItem
            id="facturacion"
            label="Facturación"
            icon={<FileText className="w-5 h-5" />}
            path="/facturacion"
            isActive={activeItemId === 'facturacion'}
            isCollapsed={isCollapsed}
            onClick={() => handleNavigate('facturacion', '/facturacion')}
          />
          <SidebarItem
            id="cobros"
            label="Cobros"
            icon={<DollarSign className="w-5 h-5" />}
            path="/cobros"
            isActive={activeItemId === 'cobros'}
            isCollapsed={isCollapsed}
            onClick={() => handleNavigate('cobros', '/cobros')}
          />
          <SidebarItem
            id="reportes"
            label="Reportes"
            icon={<BarChart3 className="w-5 h-5" />}
            path="/reportes"
            isActive={activeItemId === 'reportes'}
            isCollapsed={isCollapsed}
            onClick={() => handleNavigate('reportes', '/reportes')}
          />
        </SidebarSection>

        {/* CRM Section */}
        <SidebarSection
          id="crm"
          title="CRM"
          isCollapsed={isCollapsed}
        >
          <SidebarItem
            id="clientes"
            label="Clientes"
            icon={<Users className="w-5 h-5" />}
            path="/clientes"
            isActive={activeItemId === 'clientes'}
            isCollapsed={isCollapsed}
            onClick={() => handleNavigate('clientes', '/clientes')}
          />
          <SidebarItem
            id="productos"
            label="Productos"
            icon={<ShoppingCart className="w-5 h-5" />}
            path="/productos"
            isActive={activeItemId === 'productos'}
            isCollapsed={isCollapsed}
            onClick={() => handleNavigate('productos', '/productos')}
          />
          <SidebarItem
            id="campanas"
            label="Campañas"
            icon={<Megaphone className="w-5 h-5" />}
            path="/campanas"
            isActive={activeItemId === 'campanas'}
            isCollapsed={isCollapsed}
            onClick={() => handleNavigate('campanas', '/campanas')}
          />
        </SidebarSection>

        {/* Configuración Section */}
        <SidebarSection
          id="configuracion"
          title="Configuración"
          isCollapsed={isCollapsed}
        >
          <SidebarItem
            id="usuarios"
            label="Usuarios"
            icon={<UserCog className="w-5 h-5" />}
            path="/usuarios"
            isActive={activeItemId === 'usuarios'}
            isCollapsed={isCollapsed}
            onClick={() => handleNavigate('usuarios', '/usuarios')}
          />
          <SidebarItem
            id="integraciones"
            label="Integraciones"
            icon={<Puzzle className="w-5 h-5" />}
            path="/integraciones"
            isActive={activeItemId === 'integraciones'}
            isCollapsed={isCollapsed}
            onClick={() => handleNavigate('integraciones', '/integraciones')}
          />
          <SidebarItem
            id="personalizar"
            label="Personalizar"
            icon={<Palette className="w-5 h-5" />}
            path="/personalizar"
            isActive={activeItemId === 'personalizar'}
            isCollapsed={isCollapsed}
            onClick={() => handleNavigate('personalizar', '/personalizar')}
          />
        </SidebarSection>
      </nav>

      {/* User Menu */}
      <SidebarUserMenu isCollapsed={isCollapsed} />
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden lg:flex flex-col
          h-screen fixed left-0 top-0
          bg-slate-900 border-r border-slate-800
          transition-all duration-300 ease-out
          z-40
          group
          ${className}
        `}
        style={{
          width: isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH,
        }}
      >
        <SidebarContent />
      </aside>

      {/* Tablet Sidebar (collapsed by default) */}
      <aside
        className={`
          hidden md:flex lg:hidden flex-col
          h-screen fixed left-0 top-0
          bg-slate-900 border-r border-slate-800
          transition-all duration-300 ease-out
          z-40
          ${className}
        `}
        style={{
          width: SIDEBAR_COLLAPSED_WIDTH,
        }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar (drawer) */}
      <>
        {/* Backdrop */}
        {isMobileOpen && (
          <div
            className="
              md:hidden fixed inset-0 z-40
              bg-black/60 backdrop-blur-sm
              animate-in fade-in duration-200
            "
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Drawer */}
        <aside
          className={`
            md:hidden fixed left-0 top-0 h-screen
            bg-slate-900 border-r border-slate-800
            z-50
            transition-transform duration-300 ease-out
            ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
          style={{ width: SIDEBAR_EXPANDED_WIDTH }}
        >
          {/* Close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="
              absolute top-4 right-4 z-10
              p-2 rounded-lg
              text-slate-400 hover:text-white
              hover:bg-white/10
              transition-colors duration-200
            "
          >
            <X className="w-5 h-5" />
          </button>

          <SidebarContent />
        </aside>
      </>

      {/* Spacer for main content */}
      <div
        className="hidden lg:block flex-shrink-0 transition-all duration-300"
        style={{
          width: isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH,
        }}
      />
      <div
        className="hidden md:block lg:hidden flex-shrink-0"
        style={{ width: SIDEBAR_COLLAPSED_WIDTH }}
      />

      {/* Command Palette */}
      <CommandPalette />

      {/* Global Styles */}
      <style>{`
        /* Custom scrollbar */
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        /* Animation utilities */
        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
};

// Mobile menu button for header
interface MobileMenuButtonProps {
  className?: string;
}

export const MobileMenuButton: React.FC<MobileMenuButtonProps> = ({
  className = '',
}) => {
  const { toggleMobileOpen } = useSidebarStore();

  return (
    <button
      onClick={toggleMobileOpen}
      className={`
        md:hidden p-2 rounded-lg
        text-slate-400 hover:text-white
        hover:bg-white/10
        transition-colors duration-200
        ${className}
      `}
      aria-label="Abrir menú"
    >
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    </button>
  );
};

export default Sidebar;
