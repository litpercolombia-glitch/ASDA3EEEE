// components/chat/UniversalChat.tsx
// Chat Universal con Skills - Centro de Control Conversacional

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Bot,
  User,
  Loader2,
  Zap,
  Package,
  ShoppingCart,
  MessageCircle,
  AlertTriangle,
  TrendingUp,
  Settings,
  ChevronDown,
  Check,
  X,
  Phone,
  ExternalLink,
  Copy,
  RefreshCw,
} from 'lucide-react';
import { integrationManager } from '../../services/integrations/IntegrationManager';
import { skillsEngine, Skill, SkillExecution } from '../../services/skills/SkillsEngine';
import { unifiedDataService } from '../../services/integrations/UnifiedDataService';
import { AIProviderType, AIMessage } from '../../types/integrations';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  provider?: AIProviderType;
  type?: 'text' | 'action' | 'data' | 'skill' | 'error';
  data?: unknown;
  actions?: ChatAction[];
  skillExecution?: SkillExecution;
}

interface ChatAction {
  label: string;
  icon?: React.ReactNode;
  action: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

interface UniversalChatProps {
  onClose?: () => void;
  initialMessage?: string;
  compact?: boolean;
}

// Comandos rápidos
const QUICK_COMMANDS = [
  { icon: <TrendingUp className="w-4 h-4" />, label: 'Ventas hoy', command: '¿Cuántas ventas hay hoy?' },
  { icon: <Package className="w-4 h-4" />, label: 'Pedidos pendientes', command: 'Muéstrame pedidos pendientes' },
  { icon: <AlertTriangle className="w-4 h-4" />, label: 'En oficina', command: '¿Cuántos pedidos están en oficina?' },
  { icon: <MessageCircle className="w-4 h-4" />, label: 'Recordatorios', command: 'Envía recordatorios automáticos' },
];

export const UniversalChat: React.FC<UniversalChatProps> = ({
  onClose,
  initialMessage,
  compact = false,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AIProviderType>('chatea');
  const [showProviderSelect, setShowProviderSelect] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mensaje inicial
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: `¡Hola! 👋 Soy tu asistente de Litper Pro.

Puedo ayudarte a:
• 📊 Ver ventas y estadísticas
• 📦 Gestionar pedidos y guías
• 💬 Enviar mensajes a clientes
• ⚡ Ejecutar skills automáticos
• 🔍 Analizar patrones y tendencias

¿Qué necesitas hoy?`,
      timestamp: new Date(),
      type: 'text',
    };
    setMessages([welcomeMessage]);

    // Cargar configuración
    integrationManager.initialize();

    // Si hay mensaje inicial, procesarlo
    if (initialMessage) {
      setTimeout(() => {
        setInput(initialMessage);
        handleSend(initialMessage);
      }, 500);
    }
  }, []);

  const handleSend = useCallback(async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    // Agregar mensaje del usuario
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
      type: 'text',
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Primero buscar si hay un skill que coincida
      const matchingSkill = skillsEngine.findSkillByCommand(text);

      if (matchingSkill) {
        // Mostrar mensaje de preparación
        const prepMessage: ChatMessage = {
          id: `prep_${Date.now()}`,
          role: 'assistant',
          content: `⚡ Preparando skill: **${matchingSkill.name}**...`,
          timestamp: new Date(),
          type: 'skill',
          actions: [
            {
              label: 'Ejecutar',
              icon: <Zap className="w-4 h-4" />,
              action: () => executeSkill(matchingSkill),
              variant: 'primary',
            },
            {
              label: 'Cancelar',
              icon: <X className="w-4 h-4" />,
              action: () => {},
              variant: 'secondary',
            },
          ],
        };
        setMessages((prev) => [...prev, prepMessage]);
        setIsLoading(false);
        return;
      }

      // Procesar con IA
      const result = await integrationManager.processCommand(text, {
        timestamp: new Date(),
        provider: selectedProvider,
      });

      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
        provider: result.provider,
        type: result.intent === 'action' ? 'action' : 'text',
      };

      // Agregar acciones según el intent
      if (result.intent === 'action' && result.action) {
        assistantMessage.actions = getActionsForIntent(result.action, result.params);
      }

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        timestamp: new Date(),
        type: 'error',
      };
      setMessages((prev) => [...prev, errorMessage]);
    }

    setIsLoading(false);
  }, [input, isLoading, selectedProvider]);

  const executeSkill = async (skill: Skill) => {
    setIsLoading(true);

    try {
      const execution = await skillsEngine.executeSkill(skill.id);

      const resultMessage: ChatMessage = {
        id: `skill_result_${Date.now()}`,
        role: 'assistant',
        content: execution.status === 'success'
          ? `✅ **${skill.name}** ejecutado correctamente!\n\n${execution.result || ''}`
          : `❌ Error ejecutando **${skill.name}**: ${execution.error}`,
        timestamp: new Date(),
        type: 'skill',
        skillExecution: execution,
      };

      setMessages((prev) => [...prev, resultMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        timestamp: new Date(),
        type: 'error',
      };
      setMessages((prev) => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  const getActionsForIntent = (action: string, params?: Record<string, unknown>): ChatAction[] => {
    switch (action) {
      case 'confirm_order':
        return [
          {
            label: 'Confirmar',
            icon: <Check className="w-4 h-4" />,
            action: async () => {
              const orderId = params?.orderId as string;
              if (orderId) {
                const result = await unifiedDataService.confirmOrderAndCreateShipment(orderId, 'coordinadora');
                addSystemMessage(result.success
                  ? `✅ Pedido #${orderId} confirmado! Guía: ${result.trackingNumber}`
                  : `❌ Error: ${result.error}`
                );
              }
            },
            variant: 'primary',
          },
          {
            label: 'Cancelar',
            icon: <X className="w-4 h-4" />,
            action: () => addSystemMessage('Acción cancelada'),
            variant: 'secondary',
          },
        ];

      case 'send_reminder':
        return [
          {
            label: 'Enviar a todos',
            icon: <Send className="w-4 h-4" />,
            action: () => {
              executeSkill(skillsEngine.getSkill('recordatorios_automaticos')!);
            },
            variant: 'primary',
          },
          {
            label: 'Personalizar',
            icon: <Settings className="w-4 h-4" />,
            action: () => addSystemMessage('Abriendo configuración de recordatorios...'),
            variant: 'secondary',
          },
        ];

      default:
        return [];
    }
  };

  const addSystemMessage = (content: string) => {
    const message: ChatMessage = {
      id: `system_${Date.now()}`,
      role: 'assistant',
      content,
      timestamp: new Date(),
      type: 'text',
    };
    setMessages((prev) => [...prev, message]);
  };

  const handleQuickCommand = (command: string) => {
    setInput(command);
    handleSend(command);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const providers = integrationManager.getAIProviders().filter((p) => p.isConnected);

  return (
    <div className={`flex flex-col bg-white dark:bg-navy-900 rounded-2xl shadow-xl ${compact ? 'h-[500px]' : 'h-[700px]'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-navy-700 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white">
              Asistente Litper
            </h3>
            <p className="text-xs text-slate-500">
              {skillsEngine.getActiveSkills().length} skills activos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Provider Selector */}
          <div className="relative">
            <button
              onClick={() => setShowProviderSelect(!showProviderSelect)}
              className="flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-navy-800 rounded-lg text-xs font-medium"
            >
              {providers.find((p) => p.id === selectedProvider)?.icon || '🤖'}
              <ChevronDown className="w-3 h-3" />
            </button>

            {showProviderSelect && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-navy-800 rounded-lg shadow-lg border border-slate-200 dark:border-navy-700 py-1 z-10 min-w-[150px]">
                {providers.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => {
                      setSelectedProvider(provider.id);
                      setShowProviderSelect(false);
                    }}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-navy-700 ${
                      selectedProvider === provider.id ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                    }`}
                  >
                    <span>{provider.icon}</span>
                    <span>{provider.name}</span>
                    {selectedProvider === provider.id && (
                      <Check className="w-4 h-4 ml-auto text-purple-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-200 dark:hover:bg-navy-700 rounded-lg"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : message.type === 'error'
                  ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  : 'bg-slate-100 dark:bg-navy-800'
              }`}
            >
              {/* Message Content */}
              <div className={`text-sm whitespace-pre-wrap ${
                message.role === 'user' ? 'text-white' : 'text-slate-800 dark:text-white'
              }`}>
                {message.content.split('\n').map((line, i) => (
                  <p key={i} className={i > 0 ? 'mt-2' : ''}>
                    {line.startsWith('**') && line.endsWith('**') ? (
                      <strong>{line.slice(2, -2)}</strong>
                    ) : (
                      line
                    )}
                  </p>
                ))}
              </div>

              {/* Actions */}
              {message.actions && message.actions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {message.actions.map((action, i) => (
                    <button
                      key={i}
                      onClick={action.action}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        action.variant === 'primary'
                          ? 'bg-purple-600 hover:bg-purple-700 text-white'
                          : action.variant === 'danger'
                          ? 'bg-red-100 hover:bg-red-200 text-red-700'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {action.icon}
                      {action.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Provider Badge */}
              {message.provider && message.role === 'assistant' && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200/50 dark:border-navy-700">
                  <span className="text-xs text-slate-400">
                    {providers.find((p) => p.id === message.provider)?.icon}{' '}
                    {providers.find((p) => p.id === message.provider)?.name}
                  </span>
                  <button
                    onClick={() => copyToClipboard(message.content)}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-navy-700 rounded"
                  >
                    <Copy className="w-3 h-3 text-slate-400" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 dark:bg-navy-800 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                <span className="text-sm text-slate-500">Pensando...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Commands */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-2">
            {QUICK_COMMANDS.map((cmd, i) => (
              <button
                key={i}
                onClick={() => handleQuickCommand(cmd.command)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 rounded-full text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
              >
                {cmd.icon}
                {cmd.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-slate-200 dark:border-navy-700">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              // CORREGIDO: Agregar preventDefault
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Escribe un comando o pregunta..."
            className="flex-1 px-4 py-3 bg-slate-100 dark:bg-navy-800 border-0 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
          >
            {isLoading ? (
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

export default UniversalChat;
