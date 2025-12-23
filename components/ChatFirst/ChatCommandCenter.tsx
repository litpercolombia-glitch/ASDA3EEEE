// components/ChatFirst/ChatCommandCenter.tsx
// Centro de Comando Chat-First - Pantalla principal del producto
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Mic,
  Paperclip,
  Sparkles,
  Bot,
  User,
  Loader2,
  ChevronDown,
  Settings,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Package,
  RefreshCw,
  X,
} from 'lucide-react';
import { Shipment } from '../../types';
import { ContextPanel } from './ContextPanel';
import { SkillsBar, CORE_SKILLS, Skill, SkillId } from './SkillsBar';
import { useProAssistantStore } from '../../stores/proAssistantStore';
import { unifiedAI } from '../../services/unifiedAIService';

// ============================================
// TIPOS
// ============================================

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  actions?: ChatAction[];
  isLoading?: boolean;
}

interface ChatAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  onClick: () => void;
}

interface ChatCommandCenterProps {
  shipments: Shipment[];
  criticalCities?: string[];
  onNavigateToTab?: (tab: string) => void;
  onRefreshData?: () => void;
}

// ============================================
// CONTEXTO DE BRIEFING MATUTINO
// ============================================

const generateMorningBriefing = (shipments: Shipment[], criticalCities: string[]): string => {
  const total = shipments.length;
  if (total === 0) {
    return `Buenos dias! No tienes envios cargados todavia.

Puedo ayudarte a:
- **Cargar guias** desde Excel o texto
- **Conectar con transportadoras** para tracking en tiempo real
- **Configurar alertas** para novedades criticas

Que te gustaria hacer primero?`;
  }

  const delivered = shipments.filter(s => s.status === 'delivered').length;
  const issues = shipments.filter(s => s.status === 'issue' || s.status === 'exception').length;
  const atRisk = shipments.filter(s => {
    if (s.status === 'delivered') return false;
    const days = s.detailedInfo?.daysInTransit || 0;
    return days >= 3;
  }).length;

  const deliveryRate = Math.round((delivered / total) * 100);

  let message = `Buenos dias! Aqui esta tu resumen de hoy:

**${total.toLocaleString()} envios activos** | ${deliveryRate}% entregados`;

  if (atRisk > 0 || issues > 0) {
    message += `

⚠️ **Atencion requerida:**
${atRisk > 0 ? `- ${atRisk} envios en riesgo de retraso` : ''}
${issues > 0 ? `- ${issues} con novedades pendientes` : ''}`;
  }

  if (criticalCities.length > 0) {
    message += `
- ${criticalCities.length} ciudad${criticalCities.length > 1 ? 'es' : ''} critica${criticalCities.length > 1 ? 's' : ''}: ${criticalCities.slice(0, 3).join(', ')}${criticalCities.length > 3 ? '...' : ''}`;
  }

  message += `

Que te gustaria hacer?`;

  return message;
};

// ============================================
// COMPONENTE DE MENSAJE
// ============================================

interface MessageBubbleProps {
  message: ChatMessage;
  onActionClick?: (action: ChatAction) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onActionClick }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="px-4 py-2 bg-white/5 rounded-full text-xs text-slate-400">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`
        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
        ${isUser
          ? 'bg-gradient-to-br from-accent-500 to-accent-600'
          : 'bg-gradient-to-br from-purple-500 to-violet-600'
        }
      `}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        <div className={`
          inline-block px-4 py-3 rounded-2xl
          ${isUser
            ? 'bg-gradient-to-br from-accent-500 to-accent-600 text-white rounded-tr-sm'
            : 'bg-white/10 text-slate-200 rounded-tl-sm border border-white/10'
          }
        `}>
          {message.isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Pensando...</span>
            </div>
          ) : (
            <div className="text-sm whitespace-pre-wrap leading-relaxed">
              {message.content.split('\n').map((line, i) => {
                // Simple markdown-like parsing
                if (line.startsWith('**') && line.endsWith('**')) {
                  return <p key={i} className="font-bold">{line.slice(2, -2)}</p>;
                }
                if (line.startsWith('- ')) {
                  return <p key={i} className="flex items-start gap-2"><span>•</span>{line.slice(2)}</p>;
                }
                if (line.includes('**')) {
                  const parts = line.split('**');
                  return (
                    <p key={i}>
                      {parts.map((part, j) => (
                        j % 2 === 1 ? <strong key={j}>{part}</strong> : <span key={j}>{part}</span>
                      ))}
                    </p>
                  );
                }
                return line ? <p key={i}>{line}</p> : <br key={i} />;
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        {message.actions && message.actions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.actions.map((action) => (
              <button
                key={action.id}
                onClick={() => onActionClick?.(action)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                  ${action.type === 'primary'
                    ? 'bg-accent-500 hover:bg-accent-600 text-white'
                    : action.type === 'danger'
                      ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300'
                      : 'bg-white/10 hover:bg-white/20 text-slate-300'
                  }
                `}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <p className={`text-[10px] text-slate-500 mt-1 ${isUser ? 'text-right' : ''}`}>
          {message.timestamp.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const ChatCommandCenter: React.FC<ChatCommandCenterProps> = ({
  shipments,
  criticalCities = [],
  onNavigateToTab,
  onRefreshData,
}) => {
  const { config, setIsProcessing, isProcessing } = useProAssistantStore();

  // Estados
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [activeSkill, setActiveSkill] = useState<SkillId | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll a nuevos mensajes
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Inicializar con briefing matutino
  useEffect(() => {
    if (!isInitialized) {
      const briefing = generateMorningBriefing(shipments, criticalCities);
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: briefing,
          timestamp: new Date(),
          actions: shipments.length > 0 ? [
            {
              id: 'ver-riesgo',
              label: 'Ver envios en riesgo',
              type: 'primary',
              onClick: () => handleQuickAction('Muestrame los envios en riesgo'),
            },
            {
              id: 'reporte',
              label: 'Generar reporte',
              type: 'secondary',
              onClick: () => handleQuickAction('Genera el reporte del dia'),
            },
          ] : [
            {
              id: 'cargar',
              label: 'Cargar guias',
              type: 'primary',
              onClick: () => handleQuickAction('Quiero cargar guias desde Excel'),
            },
          ],
        },
      ]);
      setIsInitialized(true);
    }
  }, [isInitialized, shipments, criticalCities]);

  // Escuchar clicks en ejemplos de skills
  useEffect(() => {
    const handleSkillExample = (e: CustomEvent) => {
      setInputValue(e.detail);
      inputRef.current?.focus();
    };

    window.addEventListener('skill-example-click', handleSkillExample as EventListener);
    return () => {
      window.removeEventListener('skill-example-click', handleSkillExample as EventListener);
    };
  }, []);

  // Manejar envio de mensaje
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    // Mensaje de loading
    const loadingId = `loading-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: loadingId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    }]);

    try {
      // Preparar contexto
      const context = {
        shipments: shipments.slice(0, 50), // Limitar para performance
        totalShipments: shipments.length,
        criticalCities,
        activeSkill,
      };

      // Llamar a IA
      const response = await unifiedAI.chat(
        userMessage.content,
        'chat',
        shipments
      );

      // Reemplazar mensaje de loading con respuesta
      setMessages(prev => prev.map(m =>
        m.id === loadingId
          ? {
              ...m,
              id: `assistant-${Date.now()}`,
              content: response.content || 'Lo siento, hubo un problema procesando tu mensaje.',
              isLoading: false,
              actions: response.suggestedActions?.map((action: any, i: number) => ({
                id: `action-${i}`,
                label: action.label,
                type: 'secondary' as const,
                onClick: () => handleQuickAction(action.prompt || action.label),
              })),
            }
          : m
      ));
    } catch (error) {
      console.error('Error en chat:', error);
      setMessages(prev => prev.map(m =>
        m.id === loadingId
          ? {
              ...m,
              id: `error-${Date.now()}`,
              content: 'Lo siento, hubo un error. Por favor intenta de nuevo.',
              isLoading: false,
            }
          : m
      ));
    } finally {
      setIsProcessing(false);
    }
  };

  // Manejar accion rapida (pregunta predefinida)
  const handleQuickAction = (prompt: string) => {
    setInputValue(prompt);
    setTimeout(() => handleSendMessage(), 100);
  };

  // Manejar click en skill
  const handleSkillClick = (skill: Skill) => {
    setActiveSkill(activeSkill === skill.id ? null : skill.id);

    // Agregar mensaje del sistema indicando modo activo
    if (activeSkill !== skill.id) {
      setMessages(prev => [...prev, {
        id: `system-${Date.now()}`,
        role: 'system',
        content: `Modo ${skill.label} activado`,
        timestamp: new Date(),
      }]);
    }
  };

  // Manejar tecla Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header branding */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative bg-gradient-to-br from-purple-500 to-violet-600 p-3 rounded-xl shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-navy-950" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">LITPER PRO</h1>
              <p className="text-xs text-slate-400">Centro de Comando IA</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefreshData}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={() => onNavigateToTab?.('admin')}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Context Panel - KPIs en vivo */}
        <ContextPanel
          shipments={shipments}
          criticalCities={criticalCities}
          onCityClick={(city) => handleQuickAction(`Muestrame los envios de ${city}`)}
        />

        {/* Chat Area */}
        <div className="bg-gradient-to-b from-navy-900/80 to-navy-900/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          {/* Messages */}
          <div className="h-[400px] overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onActionClick={(action) => action.onClick?.()}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-white/10 p-4">
            <div className="flex items-center gap-3">
              <button
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={activeSkill
                    ? `Pregunta sobre ${CORE_SKILLS.find(s => s.id === activeSkill)?.label.toLowerCase()}...`
                    : "Escribe un comando o pregunta..."
                  }
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-accent-500 focus:bg-white/10 transition-all"
                  disabled={isProcessing}
                />
                {activeSkill && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-0.5 bg-accent-500/20 rounded text-xs text-accent-300">
                    {CORE_SKILLS.find(s => s.id === activeSkill)?.label}
                    <button onClick={() => setActiveSkill(null)}>
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <button
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <Mic className="w-5 h-5" />
              </button>

              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isProcessing}
                className={`
                  p-3 rounded-xl transition-all
                  ${inputValue.trim() && !isProcessing
                    ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white hover:shadow-lg hover:shadow-accent-500/30'
                    : 'bg-white/5 text-slate-500 cursor-not-allowed'
                  }
                `}
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Quick suggestions */}
            {messages.length <= 2 && shipments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  'Cual es el resumen de hoy?',
                  'Que envios necesitan atencion?',
                  'Genera un reporte rapido',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInputValue(suggestion)}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Skills Bar */}
        <SkillsBar
          onSkillClick={handleSkillClick}
          activeSkill={activeSkill}
          showExamples={true}
        />
      </div>
    </div>
  );
};

export default ChatCommandCenter;
