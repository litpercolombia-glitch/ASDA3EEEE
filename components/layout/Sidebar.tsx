// components/layout/Sidebar.tsx
// Flat navigation sidebar — Stripe/Vercel pattern

import React, { useState } from 'react';
import {
  Home,
  Package,
  Brain,
  TrendingUp,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
  Crown,
  Cpu,
  Radio,
} from 'lucide-react';
import { useLayoutStore, MainSection } from '../../stores/layoutStore';

// --- Types ---

interface SidebarProps {
  user: { nombre: string; email: string; rol: string } | null;
  onLogout: () => void;
}

interface NavItem {
  id: MainSection;
  icon: React.ElementType;
  label: string;
  isNew?: boolean;
}

// --- Menu Items ---

const menuItems: NavItem[] = [
  { id: 'inicio', icon: Home, label: 'Dashboard' },
  { id: 'operaciones', icon: Package, label: 'Operaciones' },
  { id: 'inteligencia', icon: Sparkles, label: 'Inteligencia' },
  { id: 'cerebro-ia', icon: Brain, label: 'Cerebro IA', isNew: true },
  { id: 'negocio', icon: Briefcase, label: 'Negocio' },
  { id: 'marketing', icon: TrendingUp, label: 'Marketing', isNew: true },
  { id: 'enterprise', icon: Crown, label: 'Enterprise', isNew: true },
];

// --- SidebarItem ---

function SidebarItem({
  item,
  isActive,
  isCollapsed,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      title={isCollapsed ? item.label : undefined}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
        transition-all duration-300 ease-out group relative cc-nav-item
        ${isActive
          ? 'active bg-cyan-500/10 border-l-2 border-cyan-400'
          : 'border-l-2 border-transparent hover:bg-white/[0.03]'}
      `}
    >
      <div className={`relative flex-shrink-0 ${isActive ? 'cc-icon-glow' : ''}`}>
        <Icon className={`w-5 h-5 transition-colors duration-300 ${
          isActive ? 'text-cyan-400' : 'text-gray-400 group-hover:text-cyan-300'
        }`} />
      </div>

      {!isCollapsed && (
        <>
          <span className={`flex-1 text-left text-sm font-medium truncate transition-colors duration-300 ${
            isActive ? 'text-cyan-300' : 'text-gray-300 group-hover:text-white'
          }`}>
            {item.label}
          </span>
          {item.isNew && (
            <span className="cc-badge-new px-1.5 py-0.5 text-[10px] font-bold rounded">NEW</span>
          )}
        </>
      )}

      {isCollapsed && (
        <div className="absolute left-full ml-3 px-3 py-2 cc-glass-elevated rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 text-cyan-300 text-sm font-medium border border-cyan-500/30">
          <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-cyan-500/20 rotate-45 border-l border-b border-cyan-500/30" />
          {item.label}
          {item.isNew && (
            <span className="ml-2 cc-badge-new px-1 py-0.5 text-[9px] rounded">NEW</span>
          )}
        </div>
      )}
    </button>
  );
}

// --- LitperLogo ---

function LitperLogo({ isCollapsed }: { isCollapsed: boolean }) {
  return (
    <div className="flex items-center gap-3 group">
      <div className="cc-logo relative">
        <div className="cc-logo-glow rounded-xl" />
        <div className="relative w-11 h-11 bg-gradient-to-br from-cyan-400 via-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/40 group-hover:shadow-cyan-500/60 transition-all transform group-hover:scale-105 border border-cyan-300/30 flex items-center justify-center overflow-visible">
          <div className="absolute inset-0.5 bg-gradient-to-br from-white/20 to-transparent rounded-lg" />
          <div className="absolute inset-0 opacity-30 cc-hex-pattern rounded-lg" />
          <div className="relative flex items-center justify-center">
            <span className="text-xl font-black text-white drop-shadow-lg tracking-tighter" style={{ textShadow: '0 0 10px rgba(0,245,255,0.5)' }}>L</span>
            <span className="text-sm font-black text-cyan-100 -ml-0.5 drop-shadow" style={{ textShadow: '0 0 8px rgba(0,245,255,0.3)' }}>P</span>
          </div>
          <Cpu className="absolute -top-2 -right-2 w-4 h-4 text-cyan-300 drop-shadow-lg" />
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

// --- LogoutModal ---

function LogoutModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="cc-glass-elevated rounded-2xl max-w-sm w-full p-6 modal-enter relative text-center">
        <div className="relative mx-auto w-16 h-16 mb-4">
          <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
          <div className="relative w-full h-full bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30">
            <LogOut className="w-7 h-7 text-white" />
          </div>
        </div>
        <h3 className="text-lg font-bold text-white mb-1">Cerrar Sesion</h3>
        <p className="text-gray-400 text-sm mb-6">Se perderan los datos de sesion no guardados</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 cc-btn text-white rounded-xl font-medium transition-all duration-300"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-red-500/30 hover:translate-y-[-2px]"
          >
            Desconectar
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Main Sidebar Component ---

export function Sidebar({ user, onLogout }: SidebarProps) {
  const { sidebarCollapsed, activeSection, toggleSidebar, setActiveSection, closeMobileMenu } =
    useLayoutStore();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const isCollapsed = sidebarCollapsed;

  const handleItemClick = (id: MainSection) => {
    setActiveSection(id);
    closeMobileMenu();
  };

  const initials = user?.nombre
    ? user.nombre.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : 'OP';

  return (
    <>
      <aside
        className={`
          flex flex-col h-full cc-sidebar relative
          transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
          ${isCollapsed ? 'w-16' : 'w-64'} shadow-2xl shadow-black/50
        `}
      >
        <div className="absolute inset-0 cc-hex-pattern opacity-50 pointer-events-none" />

        {/* Header */}
        <div className={`relative z-10 flex items-center h-16 px-3 border-b border-cyan-500/20 ${
          isCollapsed ? 'justify-center' : 'justify-between'
        }`}>
          {isCollapsed ? (
            <button
              onClick={toggleSidebar}
              className="p-2 text-gray-400 hover:text-cyan-400 cc-btn rounded-lg transition-all duration-300"
              title="Expandir panel"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
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
          )}
        </div>

        {/* Navigation */}
        <nav className="relative z-10 flex-1 overflow-y-auto py-3 px-2 space-y-1 cc-scrollbar">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              isActive={activeSection === item.id}
              isCollapsed={isCollapsed}
              onClick={() => handleItemClick(item.id)}
            />
          ))}
        </nav>

        {/* Footer — User card */}
        <div className="relative z-10 border-t border-cyan-500/20 p-2">
          {isCollapsed ? (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center justify-center px-3 py-2.5 rounded-xl cc-btn text-gray-400 hover:text-red-400 hover:border-red-500/30 transition-all duration-300"
              title="Cerrar sesion"
            >
              <LogOut className="w-5 h-5" />
            </button>
          ) : (
            <div className="cc-card p-2.5 flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-white">{initials}</span>
              </div>
              <span className="flex-1 text-sm font-medium text-white truncate">
                {user?.nombre || 'Operador'}
              </span>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-300 border border-transparent hover:border-red-500/30"
                title="Cerrar sesion"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {showLogoutConfirm && (
        <LogoutModal
          onConfirm={() => { setShowLogoutConfirm(false); onLogout(); }}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </>
  );
}

export default Sidebar;
