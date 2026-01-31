// ============================================
// ASISTENTE IA SIDEBAR - ESTILO SHOPIFY
// Barra lateral fija con IA que puede ejecutar acciones
// ============================================

import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  X,
  Send,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Package,
  Search,
  Filter,
  Download,
  Eye,
  Bell,
  Settings,
  TrendingUp,
  Users,
  MessageSquare,
  Zap,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  Loader2,
  Mic,
  MicOff,
  Copy,
  ThumbsUp,
  ThumbsDown,
  MoreVertical,
  Minimize2,
  Maximize2,
  FileSpreadsheet,
  BarChart3,
  MapPin,
  Truck,
  Calendar,
  DollarSign,
  PieChart,
  Activity,
} from 'lucide-react';

// Tipos de comandos que la IA puede ejecutar
export type AICommand =
  | { type: 'navigate'; target: string }
  | { type: 'filter'; field: string; value: string }
  | { type: 'search'; query: string }
  | { type: 'export'; format: 'excel' | 'pdf' | 'json' }
  | { type: 'view_change'; mode: 'table' | 'cards' | 'list' | 'compact' }
  | { type: 'show_stats'; metric: string }
  | { type: 'create_alert'; config: any }
  | { type: 'send_message'; template: string; target: string }
  | { type: 'refresh_data' }
  | { type: 'open_modal'; modal: string; data?: any }
  | { type: 'custom'; action: string; params?: any };

// Mensaje en el chat
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  actions?: AIAction[];
  isLoading?: boolean;
  feedback?: 'positive' | 'negative';
}

// Acción sugerida por la IA
interface AIAction {
  id: string;
  label: string;
  icon: React.ElementType;
  command: AICommand;
  variant?: 'primary' | 'secondary' | 'danger';
}

// Props del componente
interface AISidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onCommand?: (command: AICommand) => void;
  shipments?: any[];
  currentSection?: string;
}

// Sugerencias rápidas
const QUICK_SUGGESTIONS = [
  { icon: Package, label: 'Ver pedidos de hoy', query: 'Muéstrame los pedidos de hoy' },
  { icon: AlertTriangle, label: 'Envíos con problemas', query: '¿Cuántos envíos tienen problemas?' },
  { icon: TrendingUp, label: 'Estadísticas', query: 'Dame un resumen de estadísticas' },
  { icon: Download, label: 'Exportar datos', query: 'Exporta los datos a Excel' },
  { icon: Filter, label: 'Filtrar por ciudad', query: 'Filtra por ciudad Bogotá' },
  { icon: Eye, label: 'Cambiar vista', query: 'Cambia a vista de tarjetas' },
];

// Respuestas predefinidas de la IA basadas en patrones
const AI_RESPONSES: { pattern: RegExp; response: (match: string[], context: any) => { text: string; actions: AIAction[] } }[] = [
  {
    pattern: /pedidos?\s*(de\s+)?hoy/i,
    response: (_, ctx) => ({
      text: `Encontré ${ctx.todayCount || 0} pedidos de hoy. ¿Quieres ver los detalles o filtrar por estado?`,
      actions: [
        { id: '1', label: 'Ver todos', icon: Eye, command: { type: 'filter', field: 'date', value: 'today' } },
        { id: '2', label: 'Solo pendientes', icon: Clock, command: { type: 'filter', field: 'status', value: 'pending' } },
      ],
    }),
  },
  {
    pattern: /exporta?r?\s*(a\s+)?(excel|datos)/i,
    response: () => ({
      text: 'Puedo exportar los datos en varios formatos. ¿Cuál prefieres?',
      actions: [
        { id: '1', label: 'Excel (.xlsx)', icon: FileSpreadsheet, command: { type: 'export', format: 'excel' }, variant: 'primary' },
        { id: '2', label: 'PDF', icon: FileSpreadsheet, command: { type: 'export', format: 'pdf' } },
        { id: '3', label: 'JSON', icon: FileSpreadsheet, command: { type: 'export', format: 'json' } },
      ],
    }),
  },
  {
    pattern: /estadísticas|resumen|stats/i,
    response: (_, ctx) => ({
      text: `📊 **Resumen de tu operación:**\n\n• Total envíos: ${ctx.total || 0}\n• Entregados: ${ctx.delivered || 0} (${ctx.deliveryRate || 0}%)\n• En tránsito: ${ctx.inTransit || 0}\n• Con problemas: ${ctx.issues || 0}\n\n¿Necesitas más detalles?`,
      actions: [
        { id: '1', label: 'Ver gráficos', icon: BarChart3, command: { type: 'navigate', target: 'analisis' } },
        { id: '2', label: 'Descargar reporte', icon: Download, command: { type: 'export', format: 'excel' } },
      ],
    }),
  },
  {
    pattern: /filtra?r?\s*(por\s+)?ciudad\s+(\w+)/i,
    response: (match) => ({
      text: `Filtrando envíos por ciudad: **${match[2]}**`,
      actions: [
        { id: '1', label: `Ver ${match[2]}`, icon: MapPin, command: { type: 'filter', field: 'ciudad', value: match[2] }, variant: 'primary' },
        { id: '2', label: 'Quitar filtro', icon: X, command: { type: 'filter', field: 'ciudad', value: '' } },
      ],
    }),
  },
  {
    pattern: /cambia?r?\s*(a\s+)?vista\s*(de\s+)?(tarjetas|cards|tabla|table|lista|list|compacta|compact)/i,
    response: (match) => {
      const viewMap: Record<string, 'cards' | 'table' | 'list' | 'compact'> = {
        tarjetas: 'cards', cards: 'cards',
        tabla: 'table', table: 'table',
        lista: 'list', list: 'list',
        compacta: 'compact', compact: 'compact',
      };
      const mode = viewMap[match[3].toLowerCase()] || 'table';
      return {
        text: `Cambiando a vista de ${match[3]}...`,
        actions: [
          { id: '1', label: 'Aplicar', icon: CheckCircle, command: { type: 'view_change', mode }, variant: 'primary' },
        ],
      };
    },
  },
  {
    pattern: /problemas?|novedades?|devoluciones?|excepciones?/i,
    response: (_, ctx) => ({
      text: `⚠️ Hay ${ctx.issues || 0} envíos con problemas:\n\n• Devoluciones: ${ctx.returns || 0}\n• Novedades: ${ctx.exceptions || 0}\n\n¿Quieres ver el detalle?`,
      actions: [
        { id: '1', label: 'Ver problemas', icon: AlertTriangle, command: { type: 'filter', field: 'status', value: 'problems' }, variant: 'danger' },
        { id: '2', label: 'Crear alerta', icon: Bell, command: { type: 'create_alert', config: { type: 'problems' } } },
      ],
    }),
  },
  {
    pattern: /navega?r?\s*(a\s+)?(crm|pedidos|marketing|soporte|negocio|admin|config)/i,
    response: (match) => ({
      text: `Navegando a ${match[2]}...`,
      actions: [
        { id: '1', label: `Ir a ${match[2]}`, icon: ArrowRight, command: { type: 'navigate', target: match[2].toLowerCase() }, variant: 'primary' },
      ],
    }),
  },
  {
    pattern: /busca?r?\s+(.+)/i,
    response: (match) => ({
      text: `Buscando "${match[1]}"...`,
      actions: [
        { id: '1', label: 'Ver resultados', icon: Search, command: { type: 'search', query: match[1] }, variant: 'primary' },
      ],
    }),
  },
  {
    pattern: /actualiza?r?\s*(datos)?/i,
    response: () => ({
      text: 'Actualizando datos...',
      actions: [
        { id: '1', label: 'Refrescar', icon: RefreshCw, command: { type: 'refresh_data' }, variant: 'primary' },
      ],
    }),
  },
];

// Función para procesar el mensaje del usuario
function processUserMessage(message: string, context: any): { text: string; actions: AIAction[] } {
  for (const response of AI_RESPONSES) {
    const match = message.match(response.pattern);
    if (match) {
      return response.response(match, context);
    }
  }

  // Respuesta por defecto
  return {
    text: `Entiendo que quieres "${message}". Aquí tienes algunas opciones:`,
    actions: [
      { id: '1', label: 'Ver seguimiento', icon: Package, command: { type: 'navigate', target: 'seguimiento' } },
      { id: '2', label: 'Ver estadísticas', icon: BarChart3, command: { type: 'navigate', target: 'analisis' } },
      { id: '3', label: 'Exportar', icon: Download, command: { type: 'export', format: 'excel' } },
    ],
  };
}

// ============================================
// COMPONENTE PRINCIPAL: AISidebar
// ============================================
export const AISidebar: React.FC<AISidebarProps> = ({
  isOpen,
  onToggle,
  onCommand,
  shipments = [],
  currentSection,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Contexto para las respuestas
  const context = {
    total: shipments.length,
    delivered: shipments.filter((s: any) => s.status === 'DELIVERED' || s.status === 'ENTREGADO').length,
    inTransit: shipments.filter((s: any) => s.status === 'IN_TRANSIT' || s.status === 'EN TRANSITO').length,
    pending: shipments.filter((s: any) => s.status === 'PENDING' || s.status === 'PENDIENTE').length,
    issues: shipments.filter((s: any) => ['DEVOLUCION', 'NOVEDAD', 'EXCEPTION', 'RETURNED'].includes(s.status)).length,
    returns: shipments.filter((s: any) => s.status === 'DEVOLUCION' || s.status === 'RETURNED').length,
    exceptions: shipments.filter((s: any) => s.status === 'NOVEDAD' || s.status === 'EXCEPTION').length,
    deliveryRate: shipments.length > 0
      ? Math.round((shipments.filter((s: any) => s.status === 'DELIVERED' || s.status === 'ENTREGADO').length / shipments.length) * 100)
      : 0,
    todayCount: shipments.filter((s: any) => {
      const today = new Date().toDateString();
      return new Date(s.date || s.fecha).toDateString() === today;
    }).length,
  };

  // Mensaje inicial
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `¡Hola! 👋 Soy tu asistente LITPER. Puedo ayudarte a:\n\n• Filtrar y buscar envíos\n• Exportar datos\n• Cambiar vistas\n• Navegar por la app\n• Crear alertas\n\n¿En qué te puedo ayudar?`,
          timestamp: new Date(),
          actions: [],
        },
      ]);
    }
  }, []);

  // Scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Enfocar input cuando se abre
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simular respuesta de IA
    setTimeout(() => {
      const response = processUserMessage(inputValue, context);

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.text,
        timestamp: new Date(),
        actions: response.actions,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 800);
  };

  const handleQuickSuggestion = (query: string) => {
    setInputValue(query);
    setTimeout(() => handleSendMessage(), 100);
  };

  const handleAction = (command: AICommand) => {
    onCommand?.(command);

    // Agregar mensaje de confirmación
    const confirmMessage: ChatMessage = {
      id: `system-${Date.now()}`,
      role: 'system',
      content: `✅ Acción ejecutada: ${command.type}`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, confirmMessage]);
  };

  const handleFeedback = (messageId: string, feedback: 'positive' | 'negative') => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, feedback } : m))
    );
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-all group"
      >
        <Bot className="w-7 h-7" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full animate-pulse" />
        <div className="absolute right-full mr-3 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Asistente IA
        </div>
      </button>
    );
  }

  return (
    <div
      className={`fixed right-0 top-0 bottom-0 z-50 flex flex-col bg-white dark:bg-navy-900 shadow-2xl transition-all duration-300 ${
        isMinimized ? 'w-16' : 'w-96'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        {!isMinimized && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold">Asistente LITPER</h3>
              <p className="text-xs text-indigo-100">Siempre listo para ayudar</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onToggle}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 ${
                    message.role === 'user'
                      ? 'bg-indigo-500 text-white rounded-br-none'
                      : message.role === 'system'
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-sm'
                      : 'bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-200 rounded-bl-none'
                  }`}
                >
                  {/* Contenido del mensaje */}
                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>

                  {/* Acciones */}
                  {message.actions && message.actions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.actions.map((action) => (
                        <button
                          key={action.id}
                          onClick={() => handleAction(action.command)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            action.variant === 'primary'
                              ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                              : action.variant === 'danger'
                              ? 'bg-red-500 text-white hover:bg-red-600'
                              : 'bg-white dark:bg-navy-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-600 border border-slate-200 dark:border-navy-600'
                          }`}
                        >
                          <action.icon className="w-3.5 h-3.5" />
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Feedback */}
                  {message.role === 'assistant' && !message.feedback && (
                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-navy-700 flex items-center gap-2">
                      <span className="text-xs text-slate-400">¿Te ayudó?</span>
                      <button
                        onClick={() => handleFeedback(message.id, 'positive')}
                        className="p-1 text-slate-400 hover:text-emerald-500 transition-colors"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleFeedback(message.id, 'negative')}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {message.feedback && (
                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-navy-700">
                      <span className="text-xs text-slate-400">
                        {message.feedback === 'positive' ? '👍 ¡Gracias!' : '🙏 Mejoraré'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Indicador de escritura */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-navy-800 rounded-2xl rounded-bl-none p-4">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Sugerencias rápidas */}
          {messages.length <= 2 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-slate-400 mb-2">Prueba preguntar:</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_SUGGESTIONS.slice(0, 4).map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickSuggestion(suggestion.query)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 rounded-full text-xs hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <suggestion.icon className="w-3.5 h-3.5" />
                    {suggestion.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-slate-200 dark:border-navy-700">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Escribe un mensaje..."
                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-navy-800 border-0 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="p-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-300 text-white rounded-xl transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Vista minimizada */}
      {isMinimized && (
        <div className="flex-1 flex flex-col items-center py-4 gap-3">
          {QUICK_SUGGESTIONS.slice(0, 5).map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => {
                setIsMinimized(false);
                setTimeout(() => handleQuickSuggestion(suggestion.query), 100);
              }}
              className="p-3 bg-slate-100 dark:bg-navy-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/20 text-slate-500 hover:text-indigo-600 rounded-xl transition-colors"
              title={suggestion.label}
            >
              <suggestion.icon className="w-5 h-5" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AISidebar;
