// components/ProAssistant/tabs/ProChatTab.tsx
// Tab de Chat inteligente con ejecucion de tareas
import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  Sparkles,
  Package,
  Phone,
  FileText,
  Loader2,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Truck,
  Clock,
  ChevronRight,
  Download,
  MessageSquare,
  BarChart3,
} from 'lucide-react';
import { useProAssistantStore, ProMessage } from '../../../stores/proAssistantStore';

// ============================================
// COMPONENTE DE BURBUJA DE MENSAJE
// ============================================
const MessageBubble: React.FC<{ message: ProMessage }> = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

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
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs text-slate-400 font-medium">PRO</span>
          </div>
        )}

        {/* Mensaje */}
        <div
          className={`
            rounded-2xl px-4 py-3
            ${
              isUser
                ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-tr-sm'
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
                    <span className="text-amber-400">•</span>
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
                      <span className="text-2xl font-bold text-amber-400">{att.data.value}</span>
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
}> = ({ suggestions, onSelect }) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {suggestions.map((suggestion, i) => (
        <button
          key={i}
          onClick={() => onSelect(suggestion)}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700
            text-slate-300 text-xs rounded-full
            border border-slate-700 hover:border-amber-500/50
            transition-all duration-200
            flex items-center gap-1"
        >
          <ChevronRight className="w-3 h-3 text-amber-400" />
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
    messages,
    addMessage,
    isTyping,
    setIsTyping,
    setIsProcessing,
    shipmentsContext,
    addTask,
    updateTask,
  } = useProAssistantStore();

  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll al final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Procesar mensaje del usuario
  const processUserMessage = async (text: string) => {
    const lowerText = text.toLowerCase();

    // Agregar mensaje del usuario
    addMessage({
      role: 'user',
      content: text,
    });

    setIsTyping(true);
    setIsProcessing(true);

    // Simular delay de procesamiento
    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1000));

    // ============================================
    // LOGICA DE INTENCIONES Y RESPUESTAS
    // ============================================

    // NOVEDADES
    if (lowerText.includes('novedad') || lowerText.includes('novedades')) {
      const novedadesGuias = shipmentsContext.filter(
        (s) => s.novelty && s.novelty !== 'Sin novedad'
      );

      const novedadesPorTipo: Record<string, number> = {};
      novedadesGuias.forEach((g) => {
        const tipo = g.novelty || 'Sin clasificar';
        novedadesPorTipo[tipo] = (novedadesPorTipo[tipo] || 0) + 1;
      });

      let response = `Encontre **${novedadesGuias.length}** guias con novedad activa:\n\n`;

      Object.entries(novedadesPorTipo)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([tipo, count]) => {
          response += `- **${tipo}**: ${count} guias\n`;
        });

      if (novedadesGuias.length > 0) {
        response += `\n¿Que accion quieres tomar con estas guias?`;
      }

      addMessage({
        role: 'assistant',
        content: response,
        suggestions:
          novedadesGuias.length > 0
            ? ['Filtrar por ciudad', 'Programar llamadas', 'Exportar a Excel']
            : ['Cargar datos', 'Ver todas las guias'],
        attachments:
          novedadesGuias.length > 0
            ? [
                {
                  type: 'card',
                  data: {
                    title: 'Total Novedades',
                    subtitle: 'Guias con incidencias',
                    value: novedadesGuias.length,
                  },
                },
              ]
            : undefined,
      });
    }

    // RECLAMO EN OFICINA
    else if (lowerText.includes('reclamo') || lowerText.includes('oficina')) {
      const reclamoGuias = shipmentsContext.filter(
        (s) =>
          s.novelty?.toLowerCase().includes('reclamo') ||
          s.status?.toLowerCase().includes('reclamo')
      );

      let response = `Tengo **${reclamoGuias.length}** guias en Reclamo en Oficina.\n\n`;

      if (reclamoGuias.length > 0) {
        response += `Estas guias tienen alta probabilidad de devolucion si no se gestionan pronto.\n\n`;
        response += `**Recomendacion:** Programar llamadas automaticas a estos clientes.`;
      } else {
        response += `No hay guias en este estado actualmente.`;
      }

      addMessage({
        role: 'assistant',
        content: response,
        suggestions:
          reclamoGuias.length > 0
            ? ['Programar llamadas', 'Ver lista completa', 'Enviar WhatsApp']
            : ['Ver otras novedades', 'Cargar datos'],
      });
    }

    // REPORTE
    else if (
      lowerText.includes('reporte') ||
      lowerText.includes('informe') ||
      lowerText.includes('resumen')
    ) {
      const total = shipmentsContext.length;
      const entregados = shipmentsContext.filter(
        (s) =>
          s.status?.toLowerCase().includes('entreg') ||
          s.status?.toLowerCase().includes('delivered')
      ).length;
      const enTransito = shipmentsContext.filter(
        (s) =>
          s.status?.toLowerCase().includes('transit') || s.status?.toLowerCase().includes('ruta')
      ).length;
      const conNovedad = shipmentsContext.filter(
        (s) => s.novelty && s.novelty !== 'Sin novedad'
      ).length;

      const tasaEntrega = total > 0 ? Math.round((entregados / total) * 100) : 0;

      let response = `**REPORTE DEL DIA**\n\n`;
      response += `- **Total guias**: ${total}\n`;
      response += `- **Entregados**: ${entregados} (${tasaEntrega}%)\n`;
      response += `- **En transito**: ${enTransito}\n`;
      response += `- **Con novedad**: ${conNovedad}\n\n`;

      if (tasaEntrega < 70) {
        response += `La tasa de entrega esta por debajo del objetivo (70%). Revisa las novedades.`;
      } else if (tasaEntrega >= 90) {
        response += `Excelente! La tasa de entrega esta por encima del 90%.`;
      } else {
        response += `La tasa de entrega esta en un nivel aceptable.`;
      }

      addMessage({
        role: 'assistant',
        content: response,
        suggestions: ['Ver novedades', 'Exportar Excel', 'Analisis por transportadora'],
        action: {
          type: 'generate_report',
          label: 'Reporte Generado',
          data: { total, entregados, enTransito, conNovedad },
          status: 'completed',
        },
      });
    }

    // TRANSPORTADORA
    else if (
      lowerText.includes('transportadora') ||
      lowerText.includes('inter') ||
      lowerText.includes('coordinadora') ||
      lowerText.includes('envia') ||
      lowerText.includes('tcc')
    ) {
      const porTransportadora: Record<string, number> = {};
      shipmentsContext.forEach((s) => {
        const carrier = s.carrier || 'Sin asignar';
        porTransportadora[carrier] = (porTransportadora[carrier] || 0) + 1;
      });

      let response = `**DESGLOSE POR TRANSPORTADORA**\n\n`;

      Object.entries(porTransportadora)
        .sort((a, b) => b[1] - a[1])
        .forEach(([carrier, count]) => {
          const pct =
            shipmentsContext.length > 0 ? Math.round((count / shipmentsContext.length) * 100) : 0;
          response += `- **${carrier}**: ${count} guias (${pct}%)\n`;
        });

      addMessage({
        role: 'assistant',
        content: response,
        suggestions: ['Ver novedades por transportadora', 'Comparar tiempos de entrega'],
      });
    }

    // LLAMADAS
    else if (
      lowerText.includes('llamar') ||
      lowerText.includes('llamada') ||
      lowerText.includes('contactar')
    ) {
      addMessage({
        role: 'assistant',
        content: `Puedo programar llamadas automaticas a los clientes.\n\n¿A que grupo de guias quieres llamar?`,
        suggestions: ['Guias en Reclamo Oficina', 'Guias con Novedad', 'Guias +5 dias sin entrega'],
      });
    }

    // AYUDA / SALUDO
    else if (
      lowerText.includes('hola') ||
      lowerText.includes('ayuda') ||
      lowerText.includes('help')
    ) {
      addMessage({
        role: 'assistant',
        content: `Hola! Soy tu asistente PRO de Litper.\n\nPuedo ayudarte con:\n\n- **Logistica** - Ver guias, novedades, estados\n- **Reportes** - Generar analisis y metricas\n- **Acciones** - Programar llamadas, enviar mensajes\n- **Conocimiento** - Consultar base de datos\n- **Ejecutar** - Tareas automaticas en la app\n\n¿Que necesitas?`,
        suggestions: ['Ver guias con novedad', 'Reporte del dia', 'Guias en Reclamo Oficina'],
      });
    }

    // EXPORTAR
    else if (
      lowerText.includes('exportar') ||
      lowerText.includes('excel') ||
      lowerText.includes('descargar')
    ) {
      addMessage({
        role: 'assistant',
        content: `Puedo exportar los datos a Excel.\n\n¿Que datos quieres exportar?`,
        suggestions: ['Todas las guias', 'Solo novedades', 'Por transportadora'],
      });
    }

    // RESPUESTA POR DEFECTO
    else {
      addMessage({
        role: 'assistant',
        content: `Entiendo tu consulta sobre "${text}".\n\nActualmente tengo **${shipmentsContext.length}** guias cargadas en el sistema.\n\n¿Que informacion especifica necesitas?`,
        suggestions: ['Ver novedades', 'Generar reporte', 'Analisis por ciudad'],
      });
    }

    setIsTyping(false);
    setIsProcessing(false);
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

  return (
    <div className="flex flex-col h-full">
      {/* ============================================ */}
      {/* AREA DE MENSAJES */}
      {/* ============================================ */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Indicador de escritura */}
        {isTyping && (
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <div className="bg-slate-800 rounded-2xl px-4 py-3 rounded-tl-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce delay-200" />
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
          <QuickSuggestions suggestions={suggestions} onSelect={(s) => processUserMessage(s)} />
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
              placeholder="Escribe tu mensaje..."
              disabled={isTyping}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700
                rounded-xl text-white placeholder-slate-500
                focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30
                disabled:opacity-50 disabled:cursor-not-allowed
                text-sm"
            />
          </div>

          {/* Boton de enviar */}
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            className={`p-3 rounded-xl transition-all ${
              inputValue.trim() && !isTyping
                ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-orange-500/30'
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
