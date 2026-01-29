// components/layout/HeaderPro.tsx
// Header simplificado estilo Linear/Stripe - Solo 5 elementos

import React, { useState } from 'react';
import {
  Search,
  Plus,
  Bell,
  User,
  ChevronDown,
  LogOut,
  Settings,
  Crown,
} from 'lucide-react';

// ============================================
// TIPOS
// ============================================

interface HeaderProProps {
  onOpenCommandPalette: () => void;
  onNewGuide: () => void;
  onLogout: () => void;
  userName?: string;
  userEmail?: string;
  notifications?: number;
}

// ============================================
// NOTIFICATION BELL
// ============================================

function NotificationBell({ count = 0 }: { count?: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#FF6B35] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-[#1a1a1f] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <h3 className="text-sm font-semibold text-white">Notificaciones</h3>
            </div>
            <div className="p-4 text-center text-white/40 text-sm">
              No hay notificaciones nuevas
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// USER MENU
// ============================================

function UserMenu({ userName, userEmail, onLogout }: {
  userName?: string;
  userEmail?: string;
  onLogout: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 hover:bg-white/5 rounded-lg transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-[#FF6B35] to-orange-600 rounded-lg flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <ChevronDown className="w-4 h-4 text-white/40" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-64 bg-[#1a1a1f] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <p className="text-sm font-medium text-white">{userName || 'Usuario'}</p>
              <p className="text-xs text-white/40">{userEmail || 'user@litper.co'}</p>
            </div>
            <div className="p-2">
              <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                <Settings className="w-4 h-4" />
                Configuración
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// LOGO
// ============================================

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-9 h-9 bg-gradient-to-br from-[#FF6B35] to-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-[#FF6B35]/20">
        <span className="text-base font-black text-white tracking-tighter">LP</span>
        <Crown className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 text-yellow-400" />
      </div>
      <div className="hidden sm:block">
        <h1 className="text-lg font-bold text-white tracking-tight">LITPER</h1>
        <p className="text-[9px] text-white/30 font-medium tracking-widest -mt-0.5">PRO</p>
      </div>
    </div>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function HeaderPro({
  onOpenCommandPalette,
  onNewGuide,
  onLogout,
  userName,
  userEmail,
  notifications = 0,
}: HeaderProProps) {
  return (
    <header className="h-14 bg-[#0a0a0f] border-b border-white/5 flex items-center justify-between px-4 sticky top-0 z-30">
      {/* Left: Logo */}
      <Logo />

      {/* Center: Search (Command Palette Trigger) */}
      <button
        onClick={onOpenCommandPalette}
        className="flex items-center gap-3 w-96 max-w-[50%] px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors group"
      >
        <Search className="w-4 h-4 text-white/30 group-hover:text-white/50" />
        <span className="flex-1 text-left text-sm text-white/30 group-hover:text-white/50">
          Buscar guía, cliente o comando...
        </span>
        <kbd className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-white/30 font-mono">
          ⌘K
        </kbd>
      </button>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* New Guide Button */}
        <button
          onClick={onNewGuide}
          className="flex items-center gap-2 px-4 py-2 bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-[#FF6B35]/20"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nueva Guía</span>
        </button>

        {/* Notification Bell */}
        <NotificationBell count={notifications} />

        {/* User Menu */}
        <UserMenu userName={userName} userEmail={userEmail} onLogout={onLogout} />
      </div>
    </header>
  );
}

export default HeaderPro;
