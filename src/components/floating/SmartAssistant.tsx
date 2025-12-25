// components/floating/SmartAssistant.tsx
// Asistente Flotante Inteligente - Portal al Cerebro Central
// Con separación OPS (operativo) y STRATEGY (estratégico)

import React, { useState, useEffect, useCallback } from 'react';
import {
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
  Wrench,
  BarChart3,
  Send,
  Loader2,
} from 'lucide-react';
import { UniversalChat } from '../chat/UniversalChat';
import { SkillsHub } from '../skills/SkillsHub';
import { IntegrationsPanel } from '../admin/IntegrationsPanel';
import { skillsEngine } from '../../services/skills/SkillsEngine';
import { integrationManager } from '../../services/integrations/IntegrationManager';

type TabType = 'ops' | 'strategy' | 'skills' | 'alerts' | 'config';

interface SmartAssistantProps {
  shipments?: unknown[];
}

export const SmartAssistant: React.FC<SmartAssistantProps> = ({ shipments = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('ops');
  const [alertCount, setAlertCount] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Estado para chats OPS y Strategy
  const [opsMessages, setOpsMessages] = useState<ChatMessage[]>([]);
  const [strategyMessages, setStrategyMessages] = useState<ChatMessage[]>([]);
  const [opsInput, setOpsInput] = useState('');
  const [strategyInput, setStrategyInput] = useState('');
  const [opsLoading, setOpsLoading] = useState(false);
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [opsThreadId, setOpsThreadId] = useState<string | null>(null);
  const [strategyThreadId, setStrategyThreadId] = useState<string | null>(null);

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

  // Enviar mensaje al chat OPS
  const sendOpsMessage = useCallback(async () => {
    if (!opsInput.trim() || opsLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: opsInput,
      timestamp: new Date().toISOString(),
    };

    setOpsMessages(prev => [...prev, userMessage]);
    setOpsInput('');
    setOpsLoading(true);

    try {
      const response = await fetch('/api/chat/ops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: opsInput,
          threadId: opsThreadId,
          context: { alertCount, shipmentsCount: shipments.length },
        }),
      });

      const data = await response.json();

      if (data.ok) {
        setOpsThreadId(data.threadId);
        setOpsMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message,
          timestamp: new Date().toISOString(),
        }]);
      } else {
        setOpsMessages(prev => [...prev, {
          role: 'assistant',
          content: `Error: ${data.error || 'No se pudo procesar'}`,
          timestamp: new Date().toISOString(),
        }]);
      }
    } catch (error) {
      setOpsMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error de conexión. Verifica tu conexión a internet.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setOpsLoading(false);
    }
  }, [opsInput, opsLoading, opsThreadId, alertCount, shipments.length]);

  // Enviar mensaje al chat Strategy
  const sendStrategyMessage = useCallback(async () => {
    if (!strategyInput.trim() || strategyLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: strategyInput,
      timestamp: new Date().toISOString(),
    };

    setStrategyMessages(prev => [...prev, userMessage]);
    setStrategyInput('');
    setStrategyLoading(true);

    try {
      const response = await fetch('/api/chat/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: strategyInput,
          threadId: strategyThreadId,
          includeMetrics: true,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        setStrategyThreadId(data.threadId);
        setStrategyMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message,
          timestamp: new Date().toISOString(),
        }]);
      } else {
        setStrategyMessages(prev => [...prev, {
          role: 'assistant',
          content: `Error: ${data.error || 'No se pudo procesar'}`,
          timestamp: new Date().toISOString(),
        }]);
      }
    } catch (error) {
      setStrategyMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error de conexión. Verifica tu conexión a internet.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setStrategyLoading(false);
    }
  }, [strategyInput, strategyLoading, strategyThreadId]);

  const quickActions = [
    {
      icon: <TrendingUp className="w-4 h-4" />,
      label: 'Ventas hoy',
      color: 'emerald',
      action: () => {
        setActiveTab('strategy');
        setIsOpen(true);
      },
    },
    {
      icon: <Package className="w-4 h-4" />,
      label: 'Operaciones',
      color: 'blue',
      action: () => {
        setActiveTab('ops');
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
    { id: 'ops' as TabType, icon: <Wrench className="w-4 h-4" />, label: 'OPS' },
    { id: 'strategy' as TabType, icon: <BarChart3 className="w-4 h-4" />, label: 'Strategy' },
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
              {activeTab === 'ops' && (
                <ChatPanel
                  title="Chat Operativo"
                  subtitle="Guías, estados, novedades, acciones inmediatas"
                  messages={opsMessages}
                  input={opsInput}
                  setInput={setOpsInput}
                  onSend={sendOpsMessage}
                  loading={opsLoading}
                  placeholder="Ej: ¿Estado de la guía 123456?"
                  accentColor="blue"
                />
              )}

              {activeTab === 'strategy' && (
                <ChatPanel
                  title="Chat Estratégico"
                  subtitle="Reportes, KPIs, decisiones, análisis"
                  messages={strategyMessages}
                  input={strategyInput}
                  setInput={setStrategyInput}
                  onSend={sendStrategyMessage}
                  loading={strategyLoading}
                  placeholder="Ej: ¿Cómo estamos este mes?"
                  accentColor="purple"
                />
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

// Interface para mensajes del chat
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// Chat Panel Component - Reutilizable para OPS y Strategy
interface ChatPanelProps {
  title: string;
  subtitle: string;
  messages: ChatMessage[];
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  loading: boolean;
  placeholder: string;
  accentColor: 'blue' | 'purple';
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  title,
  subtitle,
  messages,
  input,
  setInput,
  onSend,
  loading,
  placeholder,
  accentColor,
}) => {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const colorClasses = {
    blue: {
      badge: 'bg-blue-100 text-blue-700',
      button: 'bg-blue-600 hover:bg-blue-700',
      userBubble: 'bg-blue-600 text-white',
    },
    purple: {
      badge: 'bg-purple-100 text-purple-700',
      button: 'bg-purple-600 hover:bg-purple-700',
      userBubble: 'bg-purple-600 text-white',
    },
  };

  const colors = colorClasses[accentColor];

  return (
    <div className="flex flex-col h-[500px]">
      {/* Header del chat */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-navy-700">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors.badge}`}>
            {title}
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Brain className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">{title}</p>
            <p className="text-sm mt-1">{placeholder}</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-4 py-2 rounded-2xl ${
                msg.role === 'user'
                  ? colors.userBubble
                  : 'bg-slate-100 dark:bg-navy-800 text-slate-800 dark:text-white'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <p className={`text-xs mt-1 ${
                msg.role === 'user' ? 'text-white/70' : 'text-slate-400'
              }`}>
                {new Date(msg.timestamp).toLocaleTimeString('es-CO', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 dark:bg-navy-800 px-4 py-3 rounded-2xl">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                <span className="text-sm text-slate-500">Pensando...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-200 dark:border-navy-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
          />
          <button
            onClick={onSend}
            disabled={loading || !input.trim()}
            className={`px-4 py-2 ${colors.button} text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartAssistant;
