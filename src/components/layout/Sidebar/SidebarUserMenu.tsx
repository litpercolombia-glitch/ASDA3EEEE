/**
 * SidebarUserMenu - LITPER PRO
 *
 * Menú de usuario con perfil, tema y logout
 * Inspirado en Linear, Notion y Slack
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  User,
  Settings,
  LogOut,
  Moon,
  Sun,
  Monitor,
  ChevronRight,
  Bell,
  HelpCircle,
  Keyboard,
  CreditCard,
  Users,
  Shield,
  Check,
} from 'lucide-react';
import { useSidebarStore } from '../../../../stores/sidebarStore';
import { StatusIndicator } from './SidebarBadge';
import { SidebarTooltip } from './SidebarTooltip';

interface SidebarUserMenuProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role?: string;
    status?: 'online' | 'away' | 'busy' | 'offline';
  };
  isCollapsed?: boolean;
  onLogout?: () => void;
  onOpenSettings?: () => void;
  onOpenProfile?: () => void;
  className?: string;
}

export const SidebarUserMenu: React.FC<SidebarUserMenuProps> = ({
  user = {
    name: 'Usuario LITPER',
    email: 'usuario@litper.com',
    role: 'Administrador',
    status: 'online',
  },
  isCollapsed = false,
  onLogout,
  onOpenSettings,
  onOpenProfile,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showThemeSubmenu, setShowThemeSubmenu] = useState(false);
  const { theme, setTheme } = useSidebarStore();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  // Calculate menu position
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.top - 8, // Position above the button
        left: isCollapsed ? rect.right + 8 : rect.left,
      });
    }
  }, [isOpen, isCollapsed]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setShowThemeSubmenu(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const themeOptions = [
    { value: 'light', label: 'Claro', icon: Sun },
    { value: 'dark', label: 'Oscuro', icon: Moon },
    { value: 'system', label: 'Sistema', icon: Monitor },
  ] as const;

  // Avatar component
  const Avatar = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
    const sizeClasses = {
      sm: 'w-7 h-7 text-xs',
      md: 'w-9 h-9 text-sm',
      lg: 'w-12 h-12 text-base',
    };

    return (
      <div className={`relative ${sizeClasses[size]}`}>
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-full h-full rounded-lg object-cover"
          />
        ) : (
          <div
            className="
              w-full h-full rounded-lg
              bg-gradient-to-br from-blue-600 to-indigo-600
              flex items-center justify-center
              font-semibold text-white
            "
          >
            {getInitials(user.name)}
          </div>
        )}
        {user.status && (
          <StatusIndicator
            status={user.status}
            className="absolute -bottom-0.5 -right-0.5"
          />
        )}
      </div>
    );
  };

  // Collapsed mode
  if (isCollapsed) {
    return (
      <>
        <SidebarTooltip content={user.name} side="right">
          <button
            ref={buttonRef}
            onClick={() => setIsOpen(!isOpen)}
            className={`
              flex items-center justify-center
              w-full h-14 px-3
              hover:bg-white/5
              transition-colors duration-200
              ${className}
            `}
          >
            <Avatar size="sm" />
          </button>
        </SidebarTooltip>

        {isOpen && <UserMenuDropdown />}
      </>
    );
  }

  // Menu dropdown content
  const UserMenuDropdown = () => (
    createPortal(
      <div
        ref={menuRef}
        className="
          fixed z-[100]
          w-64 py-2
          bg-slate-800 border border-slate-700
          rounded-xl shadow-2xl
          animate-in fade-in slide-in-from-bottom-2 duration-150
        "
        style={{
          top: menuPosition.top - 300, // Position above
          left: menuPosition.left,
        }}
      >
        {/* User info header */}
        <div className="px-3 pb-3 mb-2 border-b border-slate-700">
          <div className="flex items-center gap-3 p-2">
            <Avatar size="lg" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
              {user.role && (
                <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium bg-blue-500/20 text-blue-400 rounded-full">
                  {user.role}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Menu items */}
        <MenuItem icon={User} label="Mi perfil" onClick={onOpenProfile} />
        <MenuItem icon={Bell} label="Notificaciones" badge="3" />
        <MenuItem icon={Settings} label="Configuración" onClick={onOpenSettings} />

        <div className="my-2 h-px bg-slate-700" />

        {/* Theme submenu */}
        <div className="relative">
          <button
            onClick={() => setShowThemeSubmenu(!showThemeSubmenu)}
            className="
              w-full flex items-center gap-3 px-4 py-2
              text-sm text-slate-300 hover:text-white hover:bg-white/5
              transition-colors duration-200
            "
          >
            {theme === 'dark' ? (
              <Moon className="w-4 h-4 text-slate-500" />
            ) : theme === 'light' ? (
              <Sun className="w-4 h-4 text-slate-500" />
            ) : (
              <Monitor className="w-4 h-4 text-slate-500" />
            )}
            <span className="flex-1 text-left">Tema</span>
            <span className="text-xs text-slate-500 capitalize">{theme}</span>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>

          {showThemeSubmenu && (
            <div
              className="
                absolute left-full top-0 ml-2
                w-40 py-1
                bg-slate-800 border border-slate-700
                rounded-lg shadow-xl
              "
            >
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setTheme(option.value);
                    setShowThemeSubmenu(false);
                  }}
                  className="
                    w-full flex items-center gap-3 px-3 py-2
                    text-sm text-slate-300 hover:text-white hover:bg-white/5
                    transition-colors duration-200
                  "
                >
                  <option.icon className="w-4 h-4 text-slate-500" />
                  <span className="flex-1 text-left">{option.label}</span>
                  {theme === option.value && (
                    <Check className="w-4 h-4 text-blue-400" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <MenuItem icon={Keyboard} label="Atajos de teclado" shortcut="?" />

        <div className="my-2 h-px bg-slate-700" />

        <MenuItem icon={Users} label="Equipo" />
        <MenuItem icon={CreditCard} label="Facturación" />
        <MenuItem icon={Shield} label="Seguridad" />
        <MenuItem icon={HelpCircle} label="Ayuda y soporte" />

        <div className="my-2 h-px bg-slate-700" />

        <MenuItem
          icon={LogOut}
          label="Cerrar sesión"
          onClick={() => {
            setIsOpen(false);
            onLogout?.();
          }}
          variant="danger"
        />
      </div>,
      document.body
    )
  );

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          group flex items-center gap-3
          w-full h-14 px-3
          border-t border-slate-800
          hover:bg-white/5
          transition-colors duration-200
          ${className}
        `}
      >
        <Avatar />
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium text-white truncate group-hover:text-white">
            {user.name}
          </p>
          <p className="text-[11px] text-slate-500 truncate">
            {user.role || user.email}
          </p>
        </div>
        <svg
          className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>

      {isOpen && <UserMenuDropdown />}
    </>
  );
};

// Menu item component
interface MenuItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  shortcut?: string;
  badge?: string;
  variant?: 'default' | 'danger';
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon: Icon,
  label,
  onClick,
  shortcut,
  badge,
  variant = 'default',
}) => (
  <button
    onClick={onClick}
    className={`
      w-full flex items-center gap-3 px-4 py-2
      text-sm transition-colors duration-200
      ${
        variant === 'danger'
          ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
          : 'text-slate-300 hover:text-white hover:bg-white/5'
      }
    `}
  >
    <Icon className={`w-4 h-4 ${variant === 'danger' ? 'text-red-500' : 'text-slate-500'}`} />
    <span className="flex-1 text-left">{label}</span>
    {shortcut && (
      <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-700 rounded text-slate-400">
        {shortcut}
      </kbd>
    )}
    {badge && (
      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-500 text-white rounded-full">
        {badge}
      </span>
    )}
  </button>
);

export default SidebarUserMenu;
