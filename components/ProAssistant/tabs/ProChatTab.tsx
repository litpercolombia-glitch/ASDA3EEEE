// components/ProAssistant/tabs/ProChatTab.tsx
// Tab de Chat inteligente con selector de modelo IA y 2 modos de chat
import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  Sparkles,
  Loader2,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Bot,
  Database,
  Webhook,
  Zap,
  Brain,
  Settings2,
  RefreshCw,
} from 'lucide-react';
import { useProAssistantStore, ProMessage, AIModel, ChatMode } from '../../../stores/proAssistantStore';
import { unifiedAI } from '../../../services/unifiedAIService';
import { guideHistoryService } from '../../../services/guideHistoryService';

// ============================================
// ICONOS DE MODELOS DE IA
// ============================================
const AIModelIcon: React.FC<{ model: AIModel; className?: string }> = ({ model, className = 'w-4 h-4' }) => {
  switch (model) {
    case 'claude':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
      );
    case 'gemini':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      );
    case 'openai':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.516 2.9 5.985 5.985 0 0 0 4.469 1.93 6.046 6.046 0 0 0 5.752-4.23 5.985 5.985 0 0 0 3.998-2.9 6.043 6.043 0 0 0-.689-6.967z"/>
        </svg>
      );
  }
};

// ============================================
// SELECTOR DE MODELO DE IA
// ============================================
const AIModelSelector: React.FC = () => {
  const { config, setAIModel } = useProAssistantStore();
  const [isOpen, setIsOpen] = useState(false);

  const models: { id: AIModel; name: string; description: string; color: string }[] = [
    { id: 'claude', name: 'Claude', description: 'Razonamiento avanzado', color: 'amber' },
    { id: 'gemini', name: 'Gemini', description: 'Vision + Busqueda', color: 'blue' },
    { id: 'openai', name: 'GPT-4', description: 'Uso general', color: 'emerald' },
  ];

  const currentModel = models.find(m => m.id === config.aiModel) || models[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg
          bg-slate-800 hover:bg-slate-700 border border-slate-700
          transition-all duration-200
          ${isOpen ? 'border-amber-500/50' : ''}
        `}
      >
        <div className={`w-5 h-5 rounded-full bg-${currentModel.color}-500/20 flex items-center justify-center`}>
          <AIModelIcon model={config.aiModel} className={`w-3 h-3 text-${currentModel.color}-400`} />
        </div>
        <span className="text-xs font-medium text-white">{currentModel.name}</span>
        <ChevronRight className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-slate-700">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold px-2">Modelo de IA</p>
          </div>
          <div className="p-1">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  setAIModel(model.id);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-all duration-200
                  ${config.aiModel === model.id
                    ? `bg-${model.color}-500/20 border border-${model.color}-500/30`
                    : 'hover:bg-slate-700/50 border border-transparent'
                  }
                `}
              >
                <div className={`w-8 h-8 rounded-lg bg-${model.color}-500/20 flex items-center justify-center`}>
                  <AIModelIcon model={model.id} className={`w-4 h-4 text-${model.color}-400`} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-white">{model.name}</p>
                  <p className="text-[10px] text-slate-500">{model.description}</p>
                </div>
                {config.aiModel === model.id && (
                  <CheckCircle className={`w-4 h-4 text-${model.color}-400`} />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// SELECTOR DE MODO DE CHAT
// ============================================
const ChatModeSelector: React.FC = () => {
  const { config, setChatMode } = useProAssistantStore();

  const modes: { id: ChatMode; name: string; icon: React.ReactNode; color: string }[] = [
    { id: 'litper', name: 'Litper Data', icon: <Database className="w-4 h-4" />, color: 'purple' },
    { id: 'chateapro', name: 'Chatea Pro', icon: <Webhook className="w-4 h-4" />, color: 'cyan' },
  ];

  return (
    <div className="flex bg-slate-800/50 rounded-xl p-1 border border-slate-700/50">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => setChatMode(mode.id)}
          className={`
            flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg
            transition-all duration-200 text-xs font-medium
            ${config.chatMode === mode.id
              ? `bg-${mode.color}-500/20 text-${mode.color}-400 border border-${mode.color}-500/30`
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50 border border-transparent'
            }
          `}
        >
          {mode.icon}
          <span className="hidden sm:inline">{mode.name}</span>
        </button>
      ))}
    </div>
  );
};

// ============================================
// COMPONENTE DE BURBUJA DE MENSAJE
// ============================================
const MessageBubble: React.FC<{ message: ProMessage; chatMode: ChatMode }> = ({ message, chatMode }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  const modeColors = chatMode === 'litper'
    ? { gradient: 'from-purple-500 to-violet-500', bg: 'purple' }
    : { gradient: 'from-cyan-500 to-blue-500', bg: 'cyan' };

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className="px-3 py-1 bg-slate-800/50 rounded-full text-xs text-slate-400">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[85%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Avatar */}
        {!isUser && (
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${modeColors.gradient} flex items-center justify-center`}>
              {chatMode === 'litper' ? (
                <Database className="w-3 h-3 text-white" />
              ) : (
                <Webhook className="w-3 h-3 text-white" />
              )}
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {chatMode === 'litper' ? 'Litper' : 'Chatea Pro'}
            </span>
          </div>
        )}

        {/* Mensaje */}
        <div
          className={`
            rounded-2xl px-4 py-3
            ${
              isUser
                ? `bg-gradient-to-br ${modeColors.gradient} text-white rounded-tr-sm`
                : 'bg-slate-800 text-slate-200 rounded-tl-sm'
            }
          `}
        >
          {/* Contenido con formato basico */}
          <div className="text-sm whitespace-pre-wrap">
            {message.content.split('\n').map((line, i) => {
              // Negritas
              if (line.includes('**')) {
                const parts = line.split(/\*\*(.*?)\*\*/g);
                return (
                  <p key={i} className="mb-1">
                    {parts.map((part, j) =>
                      j % 2 === 1 ? (
                        <strong key={j} className="font-bold">
                          {part}
                        </strong>
                      ) : (
                        part
                      )
                    )}
                  </p>
                );
              }
              // Listas
              if (line.startsWith('- ')) {
                return (
                  <p key={i} className="mb-1 flex items-start gap-2">
                    <span className={`text-${modeColors.bg}-400`}>•</span>
                    {line.substring(2)}
                  </p>
                );
              }
              return (
                <p key={i} className="mb-1">
                  {line}
                </p>
              );
            })}
          </div>

          {/* Accion ejecutada */}
          {message.action && (
            <div className="mt-3 p-3 bg-slate-900/50 rounded-xl border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300">{message.action.label}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    message.action.status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : message.action.status === 'error'
                        ? 'bg-red-500/20 text-red-400'
                        : message.action.status === 'executing'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-slate-500/20 text-slate-400'
                  }`}
                >
                  {message.action.status === 'completed' && (
                    <CheckCircle className="w-3 h-3 inline mr-1" />
                  )}
                  {message.action.status === 'error' && (
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                  )}
                  {message.action.status === 'executing' && (
                    <Loader2 className="w-3 h-3 inline mr-1 animate-spin" />
                  )}
                  {message.action.status}
                </span>
              </div>
              {message.action.result && (
                <div className="text-xs text-slate-400">
                  {JSON.stringify(message.action.result, null, 2).substring(0, 200)}...
                </div>
              )}
            </div>
          )}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.attachments.map((att, i) => (
                <div key={i} className="p-3 bg-slate-900/50 rounded-xl border border-slate-700/50">
                  {att.type === 'card' && (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-white">{att.data.title}</p>
                        <p className="text-xs text-slate-400">{att.data.subtitle}</p>
                      </div>
                      <span className={`text-2xl font-bold text-${modeColors.bg}-400`}>{att.data.value}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className={`text-[10px] text-slate-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {new Date(message.timestamp).toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
};

// ============================================
// SUGERENCIAS RAPIDAS
// ============================================
const QuickSuggestions: React.FC<{
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  chatMode: ChatMode;
}> = ({ suggestions, onSelect, chatMode }) => {
  if (!suggestions || suggestions.length === 0) return null;

  const modeColor = chatMode === 'litper' ? 'purple' : 'cyan';

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {suggestions.map((suggestion, i) => (
        <button
          key={i}
          onClick={() => onSelect(suggestion)}
          className={`px-3 py-1.5 bg-slate-800 hover:bg-slate-700
            text-slate-300 text-xs rounded-full
            border border-slate-700 hover:border-${modeColor}-500/50
            transition-all duration-200
            flex items-center gap-1`}
        >
          <ChevronRight className={`w-3 h-3 text-${modeColor}-400`} />
          {suggestion}
        </button>
      ))}
    </div>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
const ProChatTab: React.FC = () => {
  const {
    config,
    litperMessages,
    chateaProMessages,
    addLitperMessage,
    addChateaProMessage,
    isTyping,
    setIsTyping,
    setIsProcessing,
    shipmentsContext,
  } = useProAssistantStore();

  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Obtener mensajes segun el modo
  const messages = config.chatMode === 'litper' ? litperMessages : chateaProMessages;
  const addMessage = config.chatMode === 'litper' ? addLitperMessage : addChateaProMessage;

  // Auto-scroll al final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, [config.chatMode]);

  // Llamar a la IA usando el servicio unificado con contexto del cerebro
  const callAI = async (question: string): Promise<string> => {
    // Configurar el proveedor según la selección del usuario
    unifiedAI.setProvider(config.aiModel);

    try {
      // Usar el servicio unificado que incluye:
      // - Contexto del cerebro (CentralBrain)
      // - Historial de guías (GuideHistoryService)
      // - Memoria semántica (MemoryManager)
      // - Fallback automático entre modelos
      const response = await unifiedAI.chat(question, shipmentsContext, {
        provider: config.aiModel,
        temperature: config.aiSettings[config.aiModel].temperature,
      });

      // Si hubo fallback, notificar al usuario
      if (response.fallbackUsed) {
        console.log(`🔄 Se usó fallback: ${response.provider}`);
      }

      return response.text;
    } catch (error: any) {
      throw new Error(error.message || 'Error al procesar con IA');
    }
  };

  // Procesar mensaje del usuario - LITPER (datos de la app)
  const processLitperMessage = async (text: string) => {
    const lowerText = text.toLowerCase();

    setAiError(null);

    // Agregar mensaje del usuario
    addLitperMessage({
      role: 'user',
      content: text,
    });

    setIsTyping(true);
    setIsProcessing(true);

    try {
      // Intentar usar IA real
      let response = '';
      let suggestions: string[] = [];

      // Para consultas específicas, usar respuestas optimizadas + IA
      if (lowerText.includes('novedad') || lowerText.includes('novedades')) {
        const novedadesGuias = shipmentsContext.filter(
          (s) => (s.novelty && s.novelty !== 'Sin novedad') || (s.novedad && s.novedad !== 'Sin novedad')
        );

        if (novedadesGuias.length > 0) {
          // Usar IA para analizar
          response = await callAI(`Analiza estas ${novedadesGuias.length} guías con novedad y dame un resumen ejecutivo con recomendaciones: ${text}`);
          suggestions = ['Filtrar por ciudad', 'Programar llamadas', 'Exportar a Excel'];
        } else {
          response = 'No hay guías con novedad activa en este momento. ¿Quieres que analice otro aspecto de tus envíos?';
          suggestions = ['Ver todas las guías', 'Reporte general', 'Cargar datos'];
        }
      } else if (lowerText.includes('reporte') || lowerText.includes('resumen')) {
        const total = shipmentsContext.length;
        if (total > 0) {
          response = await callAI(`Genera un reporte ejecutivo de estos ${total} envíos. Incluye estadísticas, riesgos y recomendaciones.`);
          suggestions = ['Ver novedades', 'Análisis por transportadora', 'Exportar Excel'];
        } else {
          response = 'No hay guías cargadas. Para generar un reporte, primero carga los datos de tus envíos.';
          suggestions = ['Cargar datos', 'Ayuda'];
        }
      } else if (lowerText.includes('analisis') || lowerText.includes('análisis') || lowerText.includes('patron')) {
        if (shipmentsContext.length > 0) {
          response = await callAI(text);
          suggestions = ['Ver guías críticas', 'Recomendaciones', 'Exportar análisis'];
        } else {
          response = 'Necesito datos de guías para hacer un análisis. ¿Puedes cargar los envíos primero?';
          suggestions = ['Cargar datos', 'Ayuda'];
        }
      } else {
        // Consulta general - usar IA directamente
        response = await callAI(text);
        suggestions = ['Ver novedades', 'Generar reporte', 'Análisis detallado'];
      }

      addLitperMessage({
        role: 'assistant',
        content: response,
        suggestions,
      });
    } catch (error: any) {
      setAiError(error.message);

      // Respuesta de fallback
      addLitperMessage({
        role: 'assistant',
        content: `Lo siento, hubo un problema al procesar tu consulta.\n\n**Error:** ${error.message}\n\nMientras tanto, puedo ayudarte con:\n- Ver estadísticas de tus ${shipmentsContext.length} guías\n- Filtrar por estado o transportadora\n- Exportar datos`,
        suggestions: ['Ver estadísticas', 'Reintentar', 'Ayuda'],
      });
    }

    setIsTyping(false);
    setIsProcessing(false);
  };

  // Procesar mensaje - CHATEA PRO (webhooks/API)
  const processChateaProMessage = async (text: string) => {
    const lowerText = text.toLowerCase();

    setAiError(null);

    addChateaProMessage({
      role: 'user',
      content: text,
    });

    setIsTyping(true);
    setIsProcessing(true);

    await new Promise((r) => setTimeout(r, 800));

    let response = '';
    let suggestions: string[] = [];

    if (lowerText.includes('webhook') || lowerText.includes('configurar')) {
      response = `**Configuración de Webhooks**\n\nPara configurar un webhook necesitas:\n\n1. **URL del endpoint** - Donde recibirás los eventos\n2. **Secret key** - Para verificar las firmas\n3. **Eventos** - Qué notificaciones quieres recibir\n\n${config.chateaPro.webhookUrl ? `**Tu webhook actual:** ${config.chateaPro.webhookUrl}` : '**No tienes webhook configurado.** Ve a Config para agregarlo.'}\n\n¿Qué quieres configurar?`;
      suggestions = ['Agregar webhook', 'Ver eventos disponibles', 'Probar conexión'];
    } else if (lowerText.includes('api') || lowerText.includes('estado')) {
      const isConnected = config.chateaPro.enabled && config.chateaPro.apiKey;
      response = `**Estado de la API**\n\n- **Conexión:** ${isConnected ? '✅ Activa' : '❌ No configurada'}\n- **Webhook URL:** ${config.chateaPro.webhookUrl || 'No configurado'}\n- **Auto-sync:** ${config.chateaPro.autoSync ? 'Activado' : 'Desactivado'}\n\n${!isConnected ? 'Configura tu API Key en la pestaña de Config para activar la integración.' : '¿Qué acción quieres realizar?'}`;
      suggestions = isConnected
        ? ['Enviar mensaje', 'Ver logs', 'Sincronizar ahora']
        : ['Configurar API', 'Ver documentación'];
    } else if (lowerText.includes('probar') || lowerText.includes('test')) {
      response = `**Prueba de Conexión**\n\n⏳ Verificando conexión con Chatea Pro...\n\n${config.chateaPro.apiKey ? '✅ API Key configurada\n' : '❌ API Key no configurada\n'}${config.chateaPro.webhookUrl ? '✅ Webhook configurado\n' : '❌ Webhook no configurado\n'}\n\n${config.chateaPro.apiKey && config.chateaPro.webhookUrl ? '✅ Sistema listo para enviar y recibir mensajes.' : '⚠️ Completa la configuración para activar la integración.'}`;
      suggestions = ['Enviar test', 'Ver logs', 'Configurar'];
    } else {
      response = `Entiendo que quieres: "${text}"\n\nCon **Chatea Pro** puedo ayudarte con:\n\n- **Webhooks** - Recibir eventos en tiempo real\n- **API** - Enviar mensajes y automatizar\n- **Sincronización** - Mantener datos actualizados\n\n¿Qué necesitas hacer?`;
      suggestions = ['Configurar webhook', 'Estado API', 'Enviar mensaje'];
    }

    addChateaProMessage({
      role: 'assistant',
      content: response,
      suggestions,
    });

    setIsTyping(false);
    setIsProcessing(false);
  };

  // Procesar mensaje según modo
  const processUserMessage = async (text: string) => {
    if (config.chatMode === 'litper') {
      await processLitperMessage(text);
    } else {
      await processChateaProMessage(text);
    }
  };

  // Enviar mensaje
  const handleSend = () => {
    if (!inputValue.trim()) return;
    processUserMessage(inputValue.trim());
    setInputValue('');
  };

  // Enter para enviar
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Obtener ultima sugerencia
  const lastMessage = messages[messages.length - 1];
  const suggestions = lastMessage?.role === 'assistant' ? lastMessage.suggestions : [];

  const modeColor = config.chatMode === 'litper' ? 'purple' : 'cyan';

  return (
    <div className="flex flex-col h-full">
      {/* ============================================ */}
      {/* HEADER CON CONTROLES */}
      {/* ============================================ */}
      <div className="p-3 border-b border-slate-700/50 space-y-3">
        {/* Selector de modo de chat */}
        <ChatModeSelector />

        {/* Selector de modelo IA + info */}
        <div className="flex items-center justify-between">
          <AIModelSelector />

          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <Brain className="w-3 h-3" />
            <span>{shipmentsContext.length} guías en contexto</span>
          </div>
        </div>

        {/* Error de IA */}
        {aiError && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-xs text-red-400 flex-1">{aiError}</span>
            <button
              onClick={() => setAiError(null)}
              className="text-red-400 hover:text-red-300"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* AREA DE MENSAJES */}
      {/* ============================================ */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} chatMode={config.chatMode} />
        ))}

        {/* Indicador de escritura */}
        {isTyping && (
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${config.chatMode === 'litper' ? 'from-purple-500 to-violet-500' : 'from-cyan-500 to-blue-500'} flex items-center justify-center`}>
              {config.chatMode === 'litper' ? (
                <Database className="w-3 h-3 text-white" />
              ) : (
                <Webhook className="w-3 h-3 text-white" />
              )}
            </div>
            <div className="bg-slate-800 rounded-2xl px-4 py-3 rounded-tl-sm">
              <div className="flex items-center gap-2">
                <Loader2 className={`w-4 h-4 text-${modeColor}-400 animate-spin`} />
                <span className="text-xs text-slate-400">
                  {config.chatMode === 'litper' ? 'Analizando con ' : 'Procesando con '}
                  <span className="text-white font-medium">{config.aiModel === 'claude' ? 'Claude' : config.aiModel === 'gemini' ? 'Gemini' : 'GPT-4'}</span>
                  ...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ============================================ */}
      {/* SUGERENCIAS RAPIDAS */}
      {/* ============================================ */}
      {suggestions && suggestions.length > 0 && !isTyping && (
        <div className="px-4 pb-2">
          <QuickSuggestions
            suggestions={suggestions}
            onSelect={(s) => processUserMessage(s)}
            chatMode={config.chatMode}
          />
        </div>
      )}

      {/* ============================================ */}
      {/* INPUT DE MENSAJE */}
      {/* ============================================ */}
      <div className="p-4 border-t border-slate-700/50 bg-slate-900/50">
        <div className="flex items-center gap-2">
          {/* Boton de voz */}
          <button
            onClick={() => setIsListening(!isListening)}
            className={`p-3 rounded-xl transition-all ${
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
            title="Entrada por voz"
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* Input de texto */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={config.chatMode === 'litper'
                ? "Pregunta sobre tus guías y envíos..."
                : "Configura webhooks y API..."
              }
              disabled={isTyping}
              className={`w-full px-4 py-3 bg-slate-800 border border-slate-700
                rounded-xl text-white placeholder-slate-500
                focus:outline-none focus:border-${modeColor}-500/50 focus:ring-1 focus:ring-${modeColor}-500/30
                disabled:opacity-50 disabled:cursor-not-allowed
                text-sm`}
            />
          </div>

          {/* Boton de enviar */}
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            className={`p-3 rounded-xl transition-all ${
              inputValue.trim() && !isTyping
                ? `bg-gradient-to-br ${config.chatMode === 'litper' ? 'from-purple-500 to-violet-500 shadow-purple-500/30' : 'from-cyan-500 to-blue-500 shadow-cyan-500/30'} text-white hover:opacity-90 shadow-lg`
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
            title="Enviar mensaje"
          >
            {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProChatTab;
