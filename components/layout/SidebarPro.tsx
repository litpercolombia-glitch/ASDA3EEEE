// components/layout/SidebarPro.tsx
// Sidebar minimalista estilo Linear - 7 items sin submenús

import React from 'react';
import {
  Home,
  Package,
  MapPin,
  Users,
  BarChart3,
  Sparkles,
  Settings,
  Crown,
} from 'lucide-react';

// ============================================
// TIPOS
// ============================================

export type SidebarSection =
  | 'inicio'
  | 'envios'
  | 'tracking'
  | 'clientes'
  | 'reportes'
  | 'ia-assistant'
  | 'configuracion';

interface SidebarProProps {
  activeSection: SidebarSection;
  onSectionChange: (section: SidebarSection) => void;
  pendingCount?: number;
}

interface NavItem {
  id: SidebarSection;
  icon: React.ElementType;
  label: string;
  badge?: number | string;
}

// ============================================
// CONFIGURACIÓN DE NAVEGACIÓN
// ============================================

const NAV_ITEMS: NavItem[] = [
  { id: 'inicio', icon: Home, label: 'Inicio' },
  { id: 'envios', icon: Package, label: 'Envíos' },
  { id: 'tracking', icon: MapPin, label: 'Tracking' },
  { id: 'clientes', icon: Users, label: 'Clientes' },
  { id: 'reportes', icon: BarChart3, label: 'Reportes' },
  { id: 'ia-assistant', icon: Sparkles, label: 'IA Assistant', badge: '✨' },
];

// ============================================
// NAV ITEM COMPONENT
// ============================================

function NavItemButton({
  icon: Icon,
  label,
  isActive,
  badge,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  badge?: number | string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
        transition-all duration-200 group relative
        ${isActive
          ? 'bg-[#FF6B35]/10 text-[#FF6B35]'
          : 'text-white/50 hover:text-white hover:bg-white/5'
        }
      `}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#FF6B35] rounded-r" />
      )}

      <Icon className={`w-5 h-5 ${isActive ? 'text-[#FF6B35]' : 'text-white/40 group-hover:text-white/70'}`} />
      <span className="flex-1 text-left">{label}</span>

      {badge && (
        <span className={`
          px-1.5 py-0.5 text-[10px] font-medium rounded
          ${typeof badge === 'number'
            ? 'bg-[#FF6B35]/20 text-[#FF6B35]'
            : 'text-amber-400'
          }
        `}>
          {badge}
        </span>
      )}
    </button>
  );
}

// ============================================
// LOGO COMPONENT
// ============================================

function SidebarLogo() {
  return (
    <div className="flex items-center gap-3 px-3 py-4">
      <div className="relative w-10 h-10 bg-gradient-to-br from-[#FF6B35] to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-[#FF6B35]/20">
        <span className="text-lg font-black text-white tracking-tighter">LP</span>
        <Crown className="absolute -top-1.5 -right-1.5 w-4 h-4 text-yellow-400 drop-shadow" />
      </div>
      <div>
        <h1 className="text-lg font-bold text-white tracking-tight">LITPER</h1>
        <p className="text-[9px] text-white/30 font-semibold tracking-[0.2em] -mt-0.5">PRO ENTERPRISE</p>
      </div>
    </div>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function SidebarPro({
  activeSection,
  onSectionChange,
  pendingCount = 0,
}: SidebarProProps) {
  // Agregar badge de pendientes al item de envíos
  const navItems = NAV_ITEMS.map(item =>
    item.id === 'envios' && pendingCount > 0
      ? { ...item, badge: pendingCount }
      : item
  );

  return (
    <aside className="w-56 h-full bg-[#0a0a0f] border-r border-white/5 flex flex-col">
      {/* Logo */}
      <div className="border-b border-white/5">
        <SidebarLogo />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <NavItemButton
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={activeSection === item.id}
            badge={item.badge}
            onClick={() => onSectionChange(item.id)}
          />
        ))}
      </nav>

      {/* Config at bottom (separated) */}
      <div className="p-3 border-t border-white/5">
        <NavItemButton
          icon={Settings}
          label="Configuración"
          isActive={activeSection === 'configuracion'}
          onClick={() => onSectionChange('configuracion')}
        />
      </div>
    </aside>
  );
}

export default SidebarPro;
