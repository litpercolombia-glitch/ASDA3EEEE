// components/floating/SmartAssistant.tsx
// Asistente Flotante Inteligente - Portal al Cerebro Central
// Con modo expandido/fijado y redimensionable

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Maximize2,
  Minimize2,
  GripVertical,
  PanelRightOpen,
  PanelRightClose,
  RefreshCw,
} from 'lucide-react';
import { UniversalChat } from '../chat/UniversalChat';
import { SkillsHub } from '../skills/SkillsHub';
import { IntegrationsPanel } from '../admin/IntegrationsPanel';
import { skillsEngine } from '../../services/skills/SkillsEngine';
import { integrationManager } from '../../services/integrations/IntegrationManager';
import { Shipment } from '../../types';

type TabType = 'chat' | 'skills' | 'alerts' | 'config';
type ViewMode = 'floating' | 'docked' | 'fullscreen';

interface SmartAssistantProps {
  shipments?: Shipment[];
}

const MIN_WIDTH = 400;
const MAX_WIDTH = 900;
const DEFAULT_DOCKED_WIDTH = 550;

export const SmartAssistant: React.FC<SmartAssistantProps> = ({ shipments = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [alertCount, setAlertCount] = useState(0);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('floating');
  const [dockedWidth, setDockedWidth] = useState(DEFAULT_DOCKED_WIDTH);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    // Inicializar servicios
    integrationManager.initialize();

    // Calcular alertas
    const calculateAlerts = () => {
      const issues = (shipments as Shipment[]).filter(
        (s) => s.status === 'issue' || s.status === 'in_office'
      ).length;
      setAlertCount(issues);
    };

    calculateAlerts();
  }, [shipments]);

  // Manejo de redimensionamiento
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setDockedWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  const quickActions = [
    { icon: <TrendingUp className="w-4 h-4" />, label: 'Ventas hoy', color: 'emerald', action: () => { setActiveTab('chat'); setIsOpen(true); } },
    { icon: <Package className="w-4 h-4" />, label: 'Pendientes', color: 'blue', action: () => { setActiveTab('chat'); setIsOpen(true); } },
    { icon: <AlertTriangle className="w-4 h-4" />, label: 'Alertas', color: 'amber', badge: alertCount, action: () => { setActiveTab('alerts'); setIsOpen(true); } },
    { icon: <Zap className="w-4 h-4" />, label: 'Skills', color: 'purple', badge: skillsEngine.getActiveSkills().length, action: () => { setActiveTab('skills'); setIsOpen(true); } },
  ];

  const tabs = [
    { id: 'chat' as TabType, icon: <MessageCircle className="w-4 h-4" />, label: 'Chat' },
    { id: 'skills' as TabType, icon: <Zap className="w-4 h-4" />, label: 'Skills' },
    { id: 'alerts' as TabType, icon: <Bell className="w-4 h-4" />, label: 'Alertas', badge: alertCount },
    { id: 'config' as TabType, icon: <Settings className="w-4 h-4" />, label: 'Config' },
  ];

  const handleClose = () => {
    if (viewMode === 'docked' || viewMode === 'fullscreen') {
      setViewMode('floating');
    }
    setIsOpen(false);
    setShowQuickActions(false);
  };

  const toggleDocked = () => {
    if (viewMode === 'docked') {
      setViewMode('floating');
    } else {
      setViewMode('docked');
      setIsOpen(true);
    }
  };

  const toggleFullscreen = () => {
    if (viewMode === 'fullscreen') {
      setViewMode('floating');
    } else {
      setViewMode('fullscreen');
      setIsOpen(true);
    }
  };

  // Panel Content
  const renderContent = () => (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">Litper Pro AI</h3>
            <p className="text-xs text-white/70">Centro de Control Inteligente</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Toggle Docked */}
          <button
            onClick={toggleDocked}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title={viewMode === 'docked' ? 'Modo flotante' : 'Fijar a la derecha'}
          >
            {viewMode === 'docked' ? (
              <PanelRightClose className="w-4 h-4 text-white" />
            ) : (
              <PanelRightOpen className="w-4 h-4 text-white" />
            )}
          </button>
          {/* Toggle Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title={viewMode === 'fullscreen' ? 'Minimizar' : 'Pantalla completa'}
          >
            {viewMode === 'fullscreen' ? (
              <Minimize2 className="w-4 h-4 text-white" />
            ) : (
              <Maximize2 className="w-4 h-4 text-white" />
            )}
          </button>
          {/* Close */}
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-navy-700 shrink-0 bg-white dark:bg-navy-900">
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
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden bg-white dark:bg-navy-900">
        {activeTab === 'chat' && (
          <div className="h-full">
            <UniversalChat compact={viewMode === 'floating'} onClose={handleClose} />
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="p-4 h-full overflow-auto">
            <SkillsHub />
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="p-4 h-full overflow-auto">
            <AlertsPanel shipments={shipments as Shipment[]} />
          </div>
        )}

        {activeTab === 'config' && (
          <div className="h-full overflow-auto">
            <IntegrationsPanel />
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Floating Button - Solo visible cuando no está en modo docked/fullscreen */}
      {(viewMode === 'floating' || !isOpen) && (
        <div className="fixed bottom-6 right-6 z-50">
          {/* Quick Actions */}
          {showQuickActions && !isOpen && (
            <div className="absolute bottom-full right-0 mb-3 flex flex-col gap-2 animate-fade-in">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={action.action}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-navy-900 rounded-xl shadow-lg border border-slate-200 dark:border-navy-700 hover:scale-105 transition-transform"
                >
                  <span className="text-purple-500">{action.icon}</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-white">
                    {action.label}
                  </span>
                  {action.badge !== undefined && action.badge > 0 && (
                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
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
                {alertCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-xs font-bold items-center justify-center">
                      {alertCount > 9 ? '9+' : alertCount}
                    </span>
                  </span>
                )}
                <Sparkles className="absolute -top-2 -left-2 w-4 h-4 text-yellow-400 animate-pulse" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Floating Panel */}
      {isOpen && viewMode === 'floating' && (
        <>
          <div className="fixed bottom-24 right-6 z-50 w-[500px] animate-slide-up">
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-navy-700 overflow-hidden flex flex-col h-[650px]">
              {renderContent()}
            </div>
          </div>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={handleClose} />
        </>
      )}

      {/* Docked Panel - Fijado a la derecha con resize */}
      {isOpen && viewMode === 'docked' && (
        <div
          className="fixed top-0 right-0 h-full z-50 flex shadow-2xl transition-all"
          style={{ width: dockedWidth }}
        >
          {/* Resize Handle */}
          <div
            onMouseDown={handleMouseDown}
            className={`w-3 h-full cursor-ew-resize flex items-center justify-center transition-colors ${
              isResizing ? 'bg-purple-500' : 'bg-slate-200 dark:bg-navy-700 hover:bg-purple-400'
            }`}
          >
            <GripVertical className={`w-4 h-4 ${isResizing ? 'text-white' : 'text-slate-400'}`} />
          </div>

          {/* Panel Content */}
          <div className="flex-1 bg-white dark:bg-navy-900 border-l border-slate-200 dark:border-navy-700 flex flex-col overflow-hidden">
            {renderContent()}
          </div>
        </div>
      )}

      {/* Fullscreen Panel */}
      {isOpen && viewMode === 'fullscreen' && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-navy-900 flex flex-col">
          {renderContent()}
        </div>
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
const AlertsPanel: React.FC<{ shipments: Shipment[] }> = ({ shipments }) => {
  const issueShipments = shipments.filter((s) => s.status === 'issue');
  const officeShipments = shipments.filter((s) => s.status === 'in_office');
  const transitShipments = shipments.filter((s) => s.status === 'in_transit');

  const alertsData = [
    {
      type: 'critical',
      icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
      title: 'Guias con novedad',
      count: issueShipments.length,
      color: 'red',
      items: issueShipments.slice(0, 5),
    },
    {
      type: 'warning',
      icon: <Package className="w-5 h-5 text-amber-500" />,
      title: 'En oficina',
      count: officeShipments.length,
      color: 'amber',
      items: officeShipments.slice(0, 5),
    },
    {
      type: 'info',
      icon: <TrendingUp className="w-5 h-5 text-blue-500" />,
      title: 'En transito',
      count: transitShipments.length,
      color: 'blue',
      items: transitShipments.slice(0, 5),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800 dark:text-white">
          Alertas Activas
        </h3>
        <button className="p-2 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg">
          <RefreshCw className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {alertsData.map((alert, i) => (
        <div
          key={i}
          className={`p-4 rounded-xl border-l-4 ${
            alert.color === 'red'
              ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
              : alert.color === 'amber'
              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500'
              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              {alert.icon}
              <div>
                <h4 className="font-medium text-slate-800 dark:text-white">
                  {alert.title}
                </h4>
                <p className={`font-bold text-lg ${
                  alert.color === 'red' ? 'text-red-600' :
                  alert.color === 'amber' ? 'text-amber-600' : 'text-blue-600'
                }`}>
                  {alert.count} guias
                </p>
              </div>
            </div>
            <button className="p-2 hover:bg-white/50 rounded-lg">
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Lista de guias */}
          {alert.items.length > 0 && (
            <div className="mt-3 space-y-1">
              {alert.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-sm bg-white/50 dark:bg-navy-800/50 rounded-lg px-3 py-2"
                >
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {item.trackingNumber}
                  </span>
                  <span className="text-slate-500 text-xs truncate max-w-[150px]">
                    {item.recipientName || item.carrier}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {alertsData.every((a) => a.count === 0) && (
        <div className="text-center py-8 text-slate-500">
          <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>No hay alertas activas</p>
          <p className="text-sm">Todo esta bajo control!</p>
        </div>
      )}
    </div>
  );
};

export default SmartAssistant;
