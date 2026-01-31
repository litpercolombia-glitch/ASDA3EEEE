// components/chat/LitperAITab.tsx
// Tab de Litper AI - Chat con datos locales de la app

import React, { useState, useEffect, useRef } from 'react';
import {
  Brain,
  Send,
  Sparkles,
  Package,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  Loader2,
  Zap,
  BarChart3,
  Users,
  Truck,
  MapPin,
  RefreshCw,
  Copy,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { Shipment } from '../../types';
import { integrationManager } from '../../services/integrations/IntegrationManager';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: {
    type: 'metrics' | 'shipments' | 'chart' | 'action';
    payload: unknown;
  };
  isLoading?: boolean;
}

interface LitperAITabProps {
  shipments?: Shipment[];
  compact?: boolean;
}

export const LitperAITab: React.FC<LitperAITabProps> = ({
  shipments = [],
  compact = false,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Mensaje de bienvenida
    if (messages.length === 0) {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: `Hola! Soy **Litper AI**, tu asistente inteligente para gestionar envíos.\n\nTengo acceso a **${shipments.length} guías** en el sistema. Puedo ayudarte con:\n\n- Consultar estados de guías\n- Ver métricas y estadísticas\n- Identificar problemas\n- Analizar tendencias\n\n¿Qué necesitas saber?`,
          timestamp: new Date(),
        },
      ]);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Calcular métricas en tiempo real
  const metrics = {
    total: shipments.length,
    delivered: shipments.filter((s) => s.status === 'delivered').length,
    inTransit: shipments.filter((s) => s.status === 'in_transit').length,
    issues: shipments.filter((s) => s.status === 'issue').length,
    inOffice: shipments.filter((s) => s.status === 'in_office').length,
    pending: shipments.filter((s) => s.status === 'pending').length,
    deliveryRate:
      shipments.length > 0
        ? Math.round(
            (shipments.filter((s) => s.status === 'delivered').length /
              shipments.length) *
              100
          )
        : 0,
  };

  // Procesar comando del usuario
  const processUserInput = async (input: string): Promise<string> => {
    const lowerInput = input.toLowerCase();

    // Comandos de métricas
    if (
      lowerInput.includes('métricas') ||
      lowerInput.includes('resumen') ||
      lowerInput.includes('estadísticas') ||
      lowerInput.includes('dashboard')
    ) {
      return `📊 **Métricas Actuales**\n\n` +
        `- **Total guías:** ${metrics.total}\n` +
        `- **Entregadas:** ${metrics.delivered} (${metrics.deliveryRate}%)\n` +
        `- **En tránsito:** ${metrics.inTransit}\n` +
        `- **Con novedad:** ${metrics.issues}\n` +
        `- **En oficina:** ${metrics.inOffice}\n` +
        `- **Pendientes:** ${metrics.pending}\n\n` +
        `Tasa de entrega: **${metrics.deliveryRate}%**`;
    }

    // Guías con problemas
    if (
      lowerInput.includes('problemas') ||
      lowerInput.includes('novedades') ||
      lowerInput.includes('issues') ||
      lowerInput.includes('novedad')
    ) {
      const issueShipments = shipments.filter((s) => s.status === 'issue').slice(0, 5);
      if (issueShipments.length === 0) {
        return `No hay guías con novedad actualmente. Todo está en orden.`;
      }
      const list = issueShipments
        .map((s) => `- **${s.trackingNumber}** - ${s.recipientName || 'Sin nombre'} (${s.carrier})`)
        .join('\n');
      return `⚠️ **Guías con Novedad (${metrics.issues} total)**\n\n${list}\n\n${metrics.issues > 5 ? `Y ${metrics.issues - 5} más...` : ''}`;
    }

    // Guías en oficina
    if (lowerInput.includes('oficina') || lowerInput.includes('office')) {
      const officeShipments = shipments.filter((s) => s.status === 'in_office').slice(0, 5);
      if (officeShipments.length === 0) {
        return `No hay guías en oficina actualmente.`;
      }
      const list = officeShipments
        .map((s) => `- **${s.trackingNumber}** - ${s.recipientCity || 'Sin ciudad'}`)
        .join('\n');
      return `📦 **Guías en Oficina (${metrics.inOffice} total)**\n\n${list}\n\n${metrics.inOffice > 5 ? `Y ${metrics.inOffice - 5} más...` : ''}`;
    }

    // Guías entregadas
    if (lowerInput.includes('entregad') || lowerInput.includes('delivered')) {
      return `✅ **Guías Entregadas**\n\n` +
        `Total: **${metrics.delivered}** de ${metrics.total}\n` +
        `Tasa de entrega: **${metrics.deliveryRate}%**\n\n` +
        `${metrics.deliveryRate >= 90 ? 'Excelente rendimiento!' : metrics.deliveryRate >= 70 ? 'Buen rendimiento, hay margen de mejora.' : 'Atención: la tasa de entrega está baja.'}`;
    }

    // Buscar guía específica
    const trackingMatch = input.match(/\b(\d{9,20})\b/);
    if (trackingMatch) {
      const tracking = trackingMatch[1];
      const shipment = shipments.find((s) => s.trackingNumber.includes(tracking));
      if (shipment) {
        const statusEmoji = {
          delivered: '✅',
          in_transit: '🚚',
          issue: '⚠️',
          in_office: '📦',
          pending: '⏳',
          returned: '↩️',
        };
        return `📋 **Guía ${shipment.trackingNumber}**\n\n` +
          `- **Estado:** ${statusEmoji[shipment.status] || '📦'} ${shipment.status}\n` +
          `- **Transportadora:** ${shipment.carrier}\n` +
          `- **Destinatario:** ${shipment.recipientName || 'No registrado'}\n` +
          `- **Ciudad:** ${shipment.recipientCity || 'No registrada'}\n` +
          `- **Teléfono:** ${shipment.recipientPhone || 'No registrado'}\n` +
          `- **Última actualización:** ${shipment.lastUpdate ? new Date(shipment.lastUpdate).toLocaleString() : 'Sin datos'}`;
      } else {
        return `No encontré la guía **${tracking}** en el sistema. Verifica el número o cárgala primero.`;
      }
    }

    // Transportadoras
    if (lowerInput.includes('transportadora') || lowerInput.includes('carrier')) {
      const carrierStats: Record<string, number> = {};
      shipments.forEach((s) => {
        carrierStats[s.carrier] = (carrierStats[s.carrier] || 0) + 1;
      });
      const sorted = Object.entries(carrierStats).sort((a, b) => b[1] - a[1]);
      const list = sorted
        .slice(0, 5)
        .map(([carrier, count]) => `- **${carrier}:** ${count} guías`)
        .join('\n');
      return `🚚 **Guías por Transportadora**\n\n${list}`;
    }

    // Ciudades
    if (lowerInput.includes('ciudad') || lowerInput.includes('destino')) {
      const cityStats: Record<string, number> = {};
      shipments.forEach((s) => {
        const city = s.recipientCity || 'Sin ciudad';
        cityStats[city] = (cityStats[city] || 0) + 1;
      });
      const sorted = Object.entries(cityStats).sort((a, b) => b[1] - a[1]);
      const list = sorted
        .slice(0, 5)
        .map(([city, count]) => `- **${city}:** ${count} guías`)
        .join('\n');
      return `📍 **Top Ciudades Destino**\n\n${list}`;
    }

    // Pendientes
    if (lowerInput.includes('pendiente') || lowerInput.includes('pending')) {
      return `⏳ **Guías Pendientes:** ${metrics.pending}\n\n` +
        `Estas guías aún no han sido procesadas por la transportadora.`;
    }

    // En tránsito
    if (lowerInput.includes('tránsito') || lowerInput.includes('transit') || lowerInput.includes('camino')) {
      return `🚚 **Guías en Tránsito:** ${metrics.inTransit}\n\n` +
        `Estas guías están en camino hacia su destino.`;
    }

    // Usar IA para respuestas más complejas
    try {
      const result = await integrationManager.processCommand(input, {
        shipments: metrics,
        timestamp: new Date().toISOString(),
      });
      if (result.response) {
        return result.response;
      }
    } catch (error) {
      console.error('Error processing with AI:', error);
    }

    // Respuesta por defecto
    return `Entiendo que quieres saber sobre "**${input}**".\n\n` +
      `Puedo ayudarte con:\n` +
      `- "métricas" - Ver resumen general\n` +
      `- "novedades" - Guías con problemas\n` +
      `- "oficina" - Guías en oficina\n` +
      `- "entregadas" - Tasa de entrega\n` +
      `- "[número de guía]" - Buscar guía específica\n` +
      `- "transportadoras" - Estadísticas por carrier\n` +
      `- "ciudades" - Top destinos`;
  };

  // CORREGIDO: Ahora acepta mensaje opcional para auto-envío de acciones rápidas
  const handleSend = async (messageOverride?: string) => {
    const messageToSend = messageOverride || inputValue;
    if (!messageToSend.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    // Agregar mensaje de carga
    const loadingId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      {
        id: loadingId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isLoading: true,
      },
    ]);

    try {
      const response = await processUserInput(messageToSend);

      // Reemplazar mensaje de carga con respuesta
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingId
            ? { ...msg, content: response, isLoading: false }
            : msg
        )
      );
    } catch (error) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingId
            ? { ...msg, content: 'Error procesando tu solicitud. Intenta de nuevo.', isLoading: false }
            : msg
        )
      );
    }

    setIsProcessing(false);
  };

  const quickActions = [
    { icon: <BarChart3 className="w-4 h-4" />, label: 'Métricas', query: 'métricas' },
    { icon: <AlertTriangle className="w-4 h-4" />, label: 'Novedades', query: 'novedades' },
    { icon: <Package className="w-4 h-4" />, label: 'Oficina', query: 'oficina' },
    { icon: <Truck className="w-4 h-4" />, label: 'Tránsito', query: 'en tránsito' },
  ];

  // CORREGIDO: Enviar el mensaje directamente en lugar de depender del estado
  const handleQuickAction = (query: string) => {
    setInputValue(query);
    // Pasar el query directamente para evitar problemas de closure
    handleSend(query);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-navy-700 bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              Litper AI
              <Sparkles className="w-4 h-4 text-yellow-500" />
            </h3>
            <p className="text-xs text-slate-500">
              {metrics.total} guías cargadas
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-purple-600">{metrics.deliveryRate}%</p>
            <p className="text-xs text-slate-500">Entrega</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {!compact && messages.length <= 1 && (
        <div className="p-4 border-b border-slate-200 dark:border-navy-700">
          <p className="text-xs text-slate-500 mb-2">Acciones rápidas:</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <button
                key={action.query}
                onClick={() => handleQuickAction(action.query)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-navy-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg text-sm transition-colors"
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white rounded-2xl rounded-br-md px-4 py-3'
                  : 'bg-white dark:bg-navy-800 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-slate-100 dark:border-navy-700'
              }`}
            >
              {msg.isLoading ? (
                <div className="flex items-center gap-2 text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Analizando...</span>
                </div>
              ) : (
                <>
                  <div
                    className={`text-sm whitespace-pre-wrap ${
                      msg.role === 'assistant' ? 'text-slate-700 dark:text-slate-200' : ''
                    }`}
                    dangerouslySetInnerHTML={{
                      __html: msg.content
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n/g, '<br />'),
                    }}
                  />
                  {msg.role === 'assistant' && !msg.isLoading && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-navy-700">
                      <button className="p-1 hover:bg-slate-100 dark:hover:bg-navy-700 rounded text-slate-400 hover:text-slate-600">
                        <Copy className="w-3 h-3" />
                      </button>
                      <button className="p-1 hover:bg-slate-100 dark:hover:bg-navy-700 rounded text-slate-400 hover:text-emerald-500">
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button className="p-1 hover:bg-slate-100 dark:hover:bg-navy-700 rounded text-slate-400 hover:text-red-500">
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              // CORREGIDO: Agregar preventDefault y verificar !shiftKey
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Pregunta sobre tus envíos..."
            disabled={isProcessing}
            className="flex-1 px-4 py-3 bg-slate-100 dark:bg-navy-800 rounded-xl text-sm disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isProcessing}
            className="p-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 rounded-xl text-white disabled:opacity-50 transition-all"
          >
            {isProcessing ? (
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

export default LitperAITab;
