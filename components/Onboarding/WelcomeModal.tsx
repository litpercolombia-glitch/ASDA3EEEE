'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  Search,
  Bell,
  BarChart3,
  Upload,
  Calendar,
  Clock,
  Sun,
  Moon,
  Sunrise,
  Sparkles,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { useOnboardingStore } from '../../stores/onboardingStore';

// ============================================
// WELCOME MODAL - Modal de bienvenida post-login
// Con saludo personalizado, resumen y quick actions
// ============================================

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QuickAction {
  icon: React.ElementType;
  label: string;
  description: string;
  onClick: () => void;
  color: string;
  badge?: string;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  const {
    user,
    pendingShipments,
    newAlerts,
    pendingGuides,
    hideWelcomeForever,
    setHideWelcomeForever,
    setShowWelcome,
  } = useOnboardingStore();

  const [dontShowAgain, setDontShowAgain] = useState(hideWelcomeForever);
  const [isClosing, setIsClosing] = useState(false);

  // Get time-based greeting
  const getGreeting = (): { text: string; icon: React.ElementType } => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return { text: 'Buenos días', icon: Sunrise };
    } else if (hour >= 12 && hour < 18) {
      return { text: 'Buenas tardes', icon: Sun };
    } else {
      return { text: 'Buenas noches', icon: Moon };
    }
  };

  // Format current date
  const formatDate = (): string => {
    return new Date().toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format current time
  const formatTime = (): string => {
    return new Date().toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  // Quick actions
  const quickActions: QuickAction[] = [
    {
      icon: Upload,
      label: 'Cargar guías',
      description: 'Importa tus envíos',
      onClick: () => handleClose(),
      color: 'from-violet-500 to-indigo-500',
      badge: pendingGuides > 0 ? `${pendingGuides} pendientes` : undefined,
    },
    {
      icon: Search,
      label: 'Ver tracking',
      description: 'Estado de envíos',
      onClick: () => handleClose(),
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Bell,
      label: 'Revisar alertas',
      description: 'Notificaciones nuevas',
      onClick: () => handleClose(),
      color: 'from-amber-500 to-orange-500',
      badge: newAlerts > 0 ? `${newAlerts} nuevas` : undefined,
    },
    {
      icon: BarChart3,
      label: 'Ver métricas',
      description: 'Dashboard analítico',
      onClick: () => handleClose(),
      color: 'from-emerald-500 to-teal-500',
    },
  ];

  // Handle close with animation
  const handleClose = () => {
    if (dontShowAgain) {
      setHideWelcomeForever(true);
    }
    setIsClosing(true);
    setTimeout(() => {
      setShowWelcome(false);
      onClose();
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`
        fixed inset-0 z-[90] flex items-center justify-center p-4
        bg-black/60 backdrop-blur-sm
        transition-opacity duration-300
        ${isClosing ? 'opacity-0' : 'opacity-100 animate-[fadeIn_0.3s_ease-out]'}
      `}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        className={`
          w-full max-w-lg
          bg-slate-900 border border-slate-700/50
          rounded-3xl shadow-2xl shadow-violet-500/10
          overflow-hidden
          transition-all duration-300
          ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100 animate-[scaleIn_0.3s_ease-out]'}
        `}
      >
        {/* Header */}
        <div className="relative p-6 pb-4 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border-b border-slate-700/50">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Greeting */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl shadow-lg shadow-violet-500/30">
              <GreetingIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                {greeting.text}, {user?.name?.split(' ')[0] || 'Usuario'}! 👋
              </h2>
              <p className="text-slate-400 text-sm">{user?.company || 'LITPER'}</p>
            </div>
          </div>

          {/* Date and time */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <Calendar className="w-4 h-4 text-violet-400" />
              <span className="capitalize">{formatDate()}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="w-4 h-4" />
              <span>{formatTime()}</span>
            </div>
          </div>
        </div>

        {/* Summary stats */}
        <div className="p-6 border-b border-slate-700/50">
          <h3 className="text-sm font-medium text-slate-400 mb-3">Resumen de tu operación</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-4 h-4 text-violet-400" />
                <span className="text-slate-500 text-xs">Pendientes</span>
              </div>
              <p className="text-xl font-bold text-white">{pendingShipments}</p>
              <p className="text-xs text-slate-500">envíos</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-1">
                <Bell className="w-4 h-4 text-amber-400" />
                <span className="text-slate-500 text-xs">Alertas</span>
              </div>
              <p className="text-xl font-bold text-white">{newAlerts}</p>
              <p className="text-xs text-slate-500">nuevas</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-500 text-xs">Entregas</span>
              </div>
              <p className="text-xl font-bold text-white">94%</p>
              <p className="text-xs text-slate-500">a tiempo</p>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="p-6">
          <h3 className="text-sm font-medium text-slate-400 mb-3">Acciones rápidas</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className="relative group p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-violet-500/30 rounded-xl transition-all duration-200 text-left"
              >
                {action.badge && (
                  <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-violet-500 text-white text-xs font-medium rounded-full">
                    {action.badge}
                  </span>
                )}
                <div className={`w-10 h-10 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-white font-medium text-sm">{action.label}</p>
                <p className="text-slate-500 text-xs">{action.description}</p>
                <ArrowRight className="absolute bottom-4 right-4 w-4 h-4 text-slate-600 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div
                onClick={() => setDontShowAgain(!dontShowAgain)}
                className={`
                  w-5 h-5 rounded border-2 flex items-center justify-center
                  transition-all duration-200
                  ${dontShowAgain
                    ? 'bg-violet-500 border-violet-500'
                    : 'border-slate-600 group-hover:border-slate-500'
                  }
                `}
              >
                {dontShowAgain && <CheckCircle className="w-3 h-3 text-white" />}
              </div>
              <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                No mostrar de nuevo
              </span>
            </label>

            <button
              onClick={handleClose}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium rounded-xl transition-all hover:scale-105"
            >
              <span>Comenzar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Keyframes */}
      <style jsx global>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default WelcomeModal;
