// components/floating/SmartAssistant.tsx
// Asistente Flotante Inteligente - Portal al Cerebro Central

import React, { useState, useEffect } from 'react';
import {
  Bot,
  X,
  MessageCircle,
  Zap,
  Settings,
  Bell,
  TrendingUp,
  Package,
  AlertTriangle,
  ChevronRight,
  Brain,
  Sparkles,
} from 'lucide-react';
import { UniversalChat } from '../chat/UniversalChat';
import { SkillsHub } from '../skills/SkillsHub';
import { IntegrationsPanel } from '../admin/IntegrationsPanel';
import { skillsEngine } from '../../services/skills/SkillsEngine';
import { integrationManager } from '../../services/integrations/IntegrationManager';

type TabType = 'chat' | 'skills' | 'alerts' | 'config';

interface SmartAssistantProps {
  shipments?: unknown[];
}

export const SmartAssistant: React.FC<SmartAssistantProps> = ({ shipments = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [alertCount, setAlertCount] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  useEffect(() => {
    // Inicializar servicios
    integrationManager.initialize();

    // Calcular alertas
    const calculateAlerts = () => {
      // Contar guías con problemas
      const issues = (shipments as any[]).filter(
        (s) => s.status === 'issue' || s.status === 'in_office'
      ).length;
      setAlertCount(issues);
    };

    calculateAlerts();
  }, [shipments]);

  const quickActions = [
    {
      icon: <TrendingUp className="w-4 h-4" />,
      label: 'Ventas hoy',
      color: 'emerald',
      action: () => {
        setActiveTab('chat');
        setIsOpen(true);
      },
    },
    {
      icon: <Package className="w-4 h-4" />,
      label: 'Pendientes',
      color: 'blue',
      action: () => {
        setActiveTab('chat');
        setIsOpen(true);
      },
    },
    {
      icon: <AlertTriangle className="w-4 h-4" />,
      label: 'Alertas',
      color: 'amber',
      badge: alertCount,
      action: () => {
        setActiveTab('alerts');
        setIsOpen(true);
      },
    },
    {
      icon: <Zap className="w-4 h-4" />,
      label: 'Skills',
      color: 'purple',
      badge: skillsEngine.getActiveSkills().length,
      action: () => {
        setActiveTab('skills');
        setIsOpen(true);
      },
    },
  ];

  const tabs = [
    { id: 'chat' as TabType, icon: <MessageCircle className="w-4 h-4" />, label: 'Chat' },
    { id: 'skills' as TabType, icon: <Zap className="w-4 h-4" />, label: 'Skills' },
    { id: 'alerts' as TabType, icon: <Bell className="w-4 h-4" />, label: 'Alertas', badge: alertCount },
    { id: 'config' as TabType, icon: <Settings className="w-4 h-4" />, label: 'Config' },
  ];

  const handleClose = () => {
    setIsOpen(false);
    setShowQuickActions(false);
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Quick Actions (hover menu) */}
        {showQuickActions && !isOpen && (
          <div className="absolute bottom-full right-0 mb-3 flex flex-col gap-2 animate-fade-in">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={action.action}
                className={`flex items-center gap-2 px-4 py-2 bg-white dark:bg-navy-900 rounded-xl shadow-lg border border-slate-200 dark:border-navy-700 hover:scale-105 transition-transform`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className={`text-${action.color}-500`}>{action.icon}</span>
                <span className="text-sm font-medium text-slate-700 dark:text-white">
                  {action.label}
                </span>
                {action.badge !== undefined && action.badge > 0 && (
                  <span className={`px-1.5 py-0.5 bg-${action.color}-100 text-${action.color}-700 text-xs font-bold rounded-full`}>
                    {action.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Main Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          onMouseEnter={() => setShowQuickActions(true)}
          onMouseLeave={() => setShowQuickActions(false)}
          className={`relative group flex items-center justify-center w-16 h-16 rounded-full shadow-xl transition-all duration-300 ${
            isOpen
              ? 'bg-slate-800 rotate-0'
              : 'bg-gradient-to-br from-purple-600 to-indigo-600 hover:scale-110'
          }`}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <>
              <Brain className="w-7 h-7 text-white" />
              {/* Pulse animation when there are alerts */}
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-xs font-bold items-center justify-center">
                    {alertCount > 9 ? '9+' : alertCount}
                  </span>
                </span>
              )}
              {/* Sparkle effect */}
              <Sparkles className="absolute -top-2 -left-2 w-4 h-4 text-yellow-400 animate-pulse" />
            </>
          )}
        </button>

        {/* Tooltip */}
        {!isOpen && isHovered && (
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg whitespace-nowrap">
            Asistente Litper Pro
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45" />
          </div>
        )}
      </div>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[500px] max-h-[80vh] animate-slide-up">
          <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-navy-700 overflow-hidden flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Litper Pro AI</h3>
                  <p className="text-xs text-white/70">
                    Centro de Control Inteligente
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-navy-700">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-navy-800'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
              {activeTab === 'chat' && (
                <UniversalChat compact onClose={handleClose} />
              )}

              {activeTab === 'skills' && (
                <div className="p-4 h-[500px] overflow-auto">
                  <SkillsHub />
                </div>
              )}

              {activeTab === 'alerts' && (
                <div className="p-4">
                  <AlertsPanel shipments={shipments as any[]} />
                </div>
              )}

              {activeTab === 'config' && (
                <div className="h-[500px] overflow-auto">
                  <IntegrationsPanel />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={handleClose}
        />
      )}

      {/* Styles */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
};

// Alerts Panel Component
const AlertsPanel: React.FC<{ shipments: any[] }> = ({ shipments }) => {
  const alertsData = [
    {
      type: 'critical',
      icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
      title: 'Guías con novedad',
      count: shipments.filter((s) => s.status === 'issue').length,
      color: 'red',
    },
    {
      type: 'warning',
      icon: <Package className="w-5 h-5 text-amber-500" />,
      title: 'En oficina (+48h)',
      count: shipments.filter((s) => s.status === 'in_office').length,
      color: 'amber',
    },
    {
      type: 'info',
      icon: <TrendingUp className="w-5 h-5 text-blue-500" />,
      title: 'Sin movimiento (+3d)',
      count: shipments.filter((s) => s.status === 'in_transit').length,
      color: 'blue',
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-slate-800 dark:text-white">
        Alertas Activas
      </h3>

      {alertsData.map((alert, i) => (
        <div
          key={i}
          className={`p-4 rounded-xl border-l-4 bg-${alert.color}-50 dark:bg-${alert.color}-900/20 border-${alert.color}-500`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {alert.icon}
              <div>
                <h4 className="font-medium text-slate-800 dark:text-white">
                  {alert.title}
                </h4>
                <p className={`text-${alert.color}-600 font-bold text-lg`}>
                  {alert.count} guías
                </p>
              </div>
            </div>
            <button className="p-2 hover:bg-white/50 rounded-lg">
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
      ))}

      {alertsData.every((a) => a.count === 0) && (
        <div className="text-center py-8 text-slate-500">
          <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>No hay alertas activas</p>
          <p className="text-sm">¡Todo está bajo control!</p>
        </div>
      )}
    </div>
  );
};

export default SmartAssistant;
