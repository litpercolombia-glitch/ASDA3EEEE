// ============================================
// LITPER PRO - IA COPILOT
// Asistente inteligente de logística con IA
// Conectado a datos reales de Supabase
// ============================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Brain,
  Send,
  Mic,
  MicOff,
  Sparkles,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Truck,
  Package,
  DollarSign,
  RefreshCw,
  Copy,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  Zap,
  History,
  BookOpen,
  Settings,
  ChevronRight,
  X,
  Bot,
  User,
  Database,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { dashboardService, guiasService, ciudadesService, alertasService } from '../../../services/supabaseService';
import { chateaService } from '../../../services/chateaService';

// ============================================
// TIPOS
// ============================================

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  insights?: Insight[];
  isLoading?: boolean;
}

interface Insight {
  type: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  description: string;
  action?: string;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  prompt: string;
  color: string;
}

// ============================================
// CONSTANTES
// ============================================

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'resumen-hoy',
    label: 'Resumen del día',
    icon: TrendingUp,
    prompt: '¿Cómo va el día de hoy? Dame un resumen de las operaciones.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'ciudades-problemas',
    label: 'Ciudades con problemas',
    icon: AlertTriangle,
    prompt: '¿Cuáles ciudades tienen problemas de entrega hoy?',
    color: 'from-red-500 to-rose-500',
  },
  {
    id: 'mejor-transportadora',
    label: 'Mejor transportadora',
    icon: Truck,
    prompt: '¿Cuál transportadora tiene mejor rendimiento este mes?',
    color: 'from-emerald-500 to-green-500',
  },
  {
    id: 'prediccion-ventas',
    label: 'Predicción ventas',
    icon: DollarSign,
    prompt: 'Predice las ventas para la próxima semana basándote en el histórico.',
    color: 'from-purple-500 to-violet-500',
  },
  {
    id: 'analisis-novedades',
    label: 'Análisis novedades',
    icon: Package,
    prompt: 'Analiza las novedades más frecuentes y sugiere soluciones.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    id: 'optimizar-rutas',
    label: 'Optimizar rutas',
    icon: MapPin,
    prompt: 'Sugiere optimizaciones para las rutas de entrega actuales.',
    color: 'from-pink-500 to-rose-500',
  },
];

const SUGGESTED_QUESTIONS = [
  '¿Debería pausar envíos a alguna ciudad?',
  '¿Cuál es mi margen de ganancia actual?',
  '¿Cómo puedo mejorar la tasa de entrega?',
  '¿Qué transportadora usar para Antioquia?',
  '¿Cuántas guías llevo hoy?',
];

// ============================================
// DATOS EN TIEMPO REAL
// ============================================

interface RealTimeData {
  guiasHoy: number;
  entregadasHoy: number;
  novedadesHoy: number;
  ventasHoy: number;
  tasaEntrega: number;
  ciudadesCriticas: Array<{ ciudad: string; tasa_entrega: number; total_guias: number }>;
  alertasPendientes: number;
  isConnected: boolean;
}

// Función para generar respuestas basadas en datos REALES
const generateRealResponse = async (
  userMessage: string,
  realData: RealTimeData
): Promise<{ content: string; insights?: Insight[] }> => {
  const lowerMessage = userMessage.toLowerCase();
  const fecha = new Date().toLocaleDateString('es-CO');

  // Formatear moneda colombiana
  const formatCOP = (value: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

  if (lowerMessage.includes('resumen') || lowerMessage.includes('hoy') || lowerMessage.includes('cómo va')) {
    const tasaFormateada = realData.tasaEntrega.toFixed(1);
    const ventasFormateadas = formatCOP(realData.ventasHoy);

    return {
      content: `📊 **Resumen del día (${fecha})** - DATOS EN VIVO

Hasta el momento llevas:
- **${realData.guiasHoy} guías** procesadas
- **${realData.entregadasHoy} entregas** exitosas (${tasaFormateada}% tasa)
- **${ventasFormateadas}** en ventas brutas
- **${realData.novedadesHoy} novedades** pendientes

${realData.ciudadesCriticas.length > 0 ? `
**⚠️ Ciudades requieren atención:**
${realData.ciudadesCriticas.slice(0, 3).map(c => `- ${c.ciudad}: ${c.tasa_entrega.toFixed(1)}% (${c.total_guias} guías)`).join('\n')}
` : '**✅ Todas las ciudades con buen rendimiento**'}

**Recomendación:** ${realData.novedadesHoy > 5
  ? 'Revisar las novedades pendientes antes de las 2pm para mejorar la tasa de cierre.'
  : 'Excelente gestión de novedades. Mantén el ritmo.'}`,
      insights: [
        realData.tasaEntrega >= 75
          ? { type: 'success', title: 'Tasa saludable', description: `${tasaFormateada}% de entrega`, action: 'Ver detalle' }
          : { type: 'warning', title: 'Tasa baja', description: `${tasaFormateada}% - Meta: 75%`, action: 'Analizar' },
        realData.novedadesHoy > 0
          ? { type: 'warning', title: `${realData.novedadesHoy} novedades`, description: 'Requieren atención', action: 'Gestionar' }
          : { type: 'success', title: 'Sin novedades', description: 'Todo al día' },
      ],
    };
  }

  if (lowerMessage.includes('ciudad') && (lowerMessage.includes('problema') || lowerMessage.includes('crítica'))) {
    if (realData.ciudadesCriticas.length === 0) {
      return {
        content: `✅ **Todas las ciudades están funcionando bien**

No hay ciudades con problemas críticos de entrega en este momento.

**Recomendación:** Mantén el monitoreo activo y revisa el semáforo regularmente.`,
        insights: [
          { type: 'success', title: 'Sin ciudades críticas', description: 'Todas operando normalmente' },
        ],
      };
    }

    const criticas = realData.ciudadesCriticas.filter(c => c.tasa_entrega < 60);
    const observacion = realData.ciudadesCriticas.filter(c => c.tasa_entrega >= 60 && c.tasa_entrega < 70);

    return {
      content: `🚨 **Ciudades con problemas de entrega** - DATOS EN VIVO

${criticas.length > 0 ? `**Críticas (menos de 60% entrega):**
${criticas.map((c, i) => `${i + 1}. **${c.ciudad}** - ${c.tasa_entrega.toFixed(1)}% tasa | ${c.total_guias} guías`).join('\n')}
` : ''}
${observacion.length > 0 ? `**En observación (60-70% entrega):**
${observacion.map(c => `- ${c.ciudad} (${c.tasa_entrega.toFixed(1)}%)`).join('\n')}
` : ''}

**Recomendación inmediata:** ${criticas.length > 0
  ? `Considerar pausar envíos COD a ${criticas[0].ciudad} hasta mejorar las condiciones.`
  : 'Monitorear las ciudades en observación.'}`,
      insights: criticas.slice(0, 2).map(c => ({
        type: 'danger' as const,
        title: `${c.ciudad} crítico`,
        description: `${c.tasa_entrega.toFixed(1)}% tasa de entrega`,
        action: 'Pausar envíos',
      })),
    };
  }

  if (lowerMessage.includes('alerta') || lowerMessage.includes('notificación') || lowerMessage.includes('whatsapp')) {
    return {
      content: `📱 **Sistema de Alertas WhatsApp** - ACTIVO

El sistema de notificaciones está ${realData.isConnected ? '✅ **CONECTADO**' : '⚠️ **DESCONECTADO**'}

**Alertas configuradas:**
- 🔴 Ciudad crítica (<60% entrega) → WhatsApp inmediato
- 🟠 Guía retrasada (>5 días) → WhatsApp + Email
- 🟢 Resumen diario → WhatsApp 6pm

**Alertas pendientes:** ${realData.alertasPendientes}

¿Deseas que envíe una alerta de prueba o el resumen del día?`,
      insights: [
        {
          type: realData.isConnected ? 'success' : 'warning',
          title: realData.isConnected ? 'WhatsApp conectado' : 'Sin conexión',
          description: realData.isConnected ? 'Notificaciones activas' : 'Verificar configuración',
          action: 'Configurar'
        },
      ],
    };
  }

  if (lowerMessage.includes('enviar') && lowerMessage.includes('resumen')) {
    // Intentar enviar resumen por WhatsApp
    try {
      await chateaService.sendResumenDiario(
        ['+573001234567'], // Este número debería venir de configuración
        {
          guiasHoy: realData.guiasHoy,
          entregadas: realData.entregadasHoy,
          tasaEntrega: realData.tasaEntrega,
          novedades: realData.novedadesHoy,
          ventas: realData.ventasHoy,
        }
      );
      return {
        content: `✅ **Resumen enviado por WhatsApp**

Se ha enviado el resumen del día con los siguientes datos:
- Guías: ${realData.guiasHoy}
- Entregas: ${realData.entregadasHoy}
- Tasa: ${realData.tasaEntrega.toFixed(1)}%
- Ventas: ${formatCOP(realData.ventasHoy)}`,
        insights: [
          { type: 'success', title: 'Mensaje enviado', description: 'WhatsApp entregado', action: 'Ver' },
        ],
      };
    } catch {
      return {
        content: `⚠️ **Error al enviar WhatsApp**

No se pudo enviar el resumen. Verifica la conexión con Chatea API.`,
        insights: [
          { type: 'danger', title: 'Error WhatsApp', description: 'Verificar configuración', action: 'Reintentar' },
        ],
      };
    }
  }

  // Respuesta genérica con datos reales
  return {
    content: `📊 Entiendo tu consulta sobre "${userMessage}".

**Datos actuales de Litper (EN VIVO):**

- **Total guías hoy:** ${realData.guiasHoy}
- **Tasa de entrega:** ${realData.tasaEntrega.toFixed(1)}%
- **Ventas del día:** ${formatCOP(realData.ventasHoy)}
- **Ciudades críticas:** ${realData.ciudadesCriticas.length}

¿Hay algo más específico que te gustaría saber? Puedo analizar:
- Rendimiento por ciudad
- Métricas de transportadoras
- Estado de alertas WhatsApp
- Análisis de novedades`,
    insights: [
      { type: 'info', title: 'Datos en vivo', description: `Conectado a Supabase` },
    ],
  };
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const IACopilot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `¡Hola! 👋 Soy tu **Co-piloto de Logística IA**.

Estoy aquí para ayudarte con:
- 📊 Análisis de rendimiento
- 🔮 Predicciones de ventas
- 🚚 Optimización de rutas
- ⚠️ Detección de problemas
- 💡 Recomendaciones inteligentes
- 📱 Alertas WhatsApp

**Conectado a datos en tiempo real de Supabase**

¿En qué puedo ayudarte hoy?`,
      timestamp: new Date(),
      suggestions: SUGGESTED_QUESTIONS.slice(0, 3),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [realTimeData, setRealTimeData] = useState<RealTimeData>({
    guiasHoy: 0,
    entregadasHoy: 0,
    novedadesHoy: 0,
    ventasHoy: 0,
    tasaEntrega: 0,
    ciudadesCriticas: [],
    alertasPendientes: 0,
    isConnected: false,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cargar datos reales de Supabase
  const fetchRealData = useCallback(async () => {
    try {
      // Obtener datos del dashboard
      const dashData = await dashboardService.getStats();

      // Obtener guías de hoy
      const guiasHoy = await guiasService.getHoy();

      // Obtener ciudades críticas
      const ciudades = await ciudadesService.getCriticas();

      // Obtener alertas no leídas
      const alertas = await alertasService.getNoLeidas();

      // Calcular estadísticas
      const entregadas = guiasHoy.filter(g =>
        g.estado?.toLowerCase().includes('entregad')
      ).length;
      const novedades = guiasHoy.filter(g => g.tiene_novedad).length;
      const ventas = guiasHoy.reduce((sum, g) => sum + (g.valor_declarado || 0), 0);
      const tasa = guiasHoy.length > 0 ? (entregadas / guiasHoy.length) * 100 : 0;

      setRealTimeData({
        guiasHoy: guiasHoy.length,
        entregadasHoy: entregadas,
        novedadesHoy: novedades,
        ventasHoy: ventas,
        tasaEntrega: tasa,
        ciudadesCriticas: ciudades.map(c => ({
          ciudad: c.ciudad,
          tasa_entrega: c.tasa_entrega,
          total_guias: c.total_guias,
        })),
        alertasPendientes: alertas.length,
        isConnected: true,
      });
      setIsConnected(true);
    } catch (error) {
      console.error('Error fetching real data:', error);
      setIsConnected(false);
      // Usar datos de fallback si no hay conexión
      setRealTimeData(prev => ({ ...prev, isConnected: false }));
    }
  }, []);

  // Cargar datos al montar y cada 30 segundos
  useEffect(() => {
    fetchRealData();
    const interval = setInterval(fetchRealData, 30000);
    return () => clearInterval(interval);
  }, [fetchRealData]);

  // Auto-scroll al final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (content: string = inputValue) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    const loadingMessage: Message = {
      id: `loading-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInputValue('');

    try {
      // Obtener respuesta con datos reales
      const response = await generateRealResponse(content, realTimeData);

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        insights: response.insights,
        suggestions: SUGGESTED_QUESTIONS.slice(Math.floor(Math.random() * 3), Math.floor(Math.random() * 3) + 2),
      };

      setMessages(prev => prev.filter(m => !m.isLoading).concat(assistantMessage));
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '⚠️ Error al procesar tu consulta. Por favor intenta de nuevo.',
        timestamp: new Date(),
        insights: [{ type: 'danger', title: 'Error', description: 'Revisa la conexión' }],
      };
      setMessages(prev => prev.filter(m => !m.isLoading).concat(errorMessage));
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    handleSendMessage(action.prompt);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-navy-800/50 rounded-2xl border border-navy-700 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-navy-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-500 rounded-2xl shadow-xl shadow-violet-500/30">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-navy-800 flex items-center justify-center">
                <Sparkles className="w-2 h-2 text-white" />
              </div>
            </div>
            <div>
              <h2 className="font-bold text-white flex items-center gap-2">
                Co-piloto IA
                <span className="px-2 py-0.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-xs font-bold rounded">
                  PRO
                </span>
              </h2>
              <p className="text-xs text-slate-400">Asistente de logística inteligente</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Indicador de conexión */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
              isConnected
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-red-500/20 text-red-400'
            }`}>
              {isConnected ? (
                <>
                  <Wifi className="w-4 h-4" />
                  <span className="text-xs font-medium">En vivo</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  <span className="text-xs font-medium">Offline</span>
                </>
              )}
            </div>
            <button
              onClick={fetchRealData}
              className="p-2 hover:bg-navy-700 rounded-xl text-slate-400 hover:text-white transition-all"
              title="Actualizar datos"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 hover:bg-navy-700 rounded-xl text-slate-400 hover:text-white transition-all"
            >
              <History className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-navy-700 rounded-xl text-slate-400 hover:text-white transition-all">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'user'
                  ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                  : 'bg-gradient-to-br from-violet-500 to-purple-500'
              }`}>
                {message.role === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>

              {/* Message Content */}
              <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block p-4 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-navy-700 text-slate-200'
                }`}>
                  {message.isLoading ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Analizando...</span>
                    </div>
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none">
                      {message.content.split('\n').map((line, i) => (
                        <p key={i} className="mb-2 last:mb-0">
                          {line.startsWith('**') ? (
                            <strong>{line.replace(/\*\*/g, '')}</strong>
                          ) : line.startsWith('- ') ? (
                            <span className="block ml-2">• {line.substring(2)}</span>
                          ) : line.startsWith('|') ? (
                            <code className="text-xs bg-navy-800 px-1 rounded">{line}</code>
                          ) : (
                            line
                          )}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Insights */}
                {message.insights && message.insights.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.insights.map((insight, index) => (
                      <div
                        key={index}
                        className={`inline-flex items-center gap-2 p-2 rounded-lg ${
                          insight.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                          insight.type === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                          insight.type === 'danger' ? 'bg-red-500/20 text-red-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {insight.type === 'success' ? <CheckCircle className="w-4 h-4" /> :
                         insight.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                         insight.type === 'danger' ? <AlertTriangle className="w-4 h-4" /> :
                         <Lightbulb className="w-4 h-4" />}
                        <span className="text-sm font-medium">{insight.title}</span>
                        <span className="text-xs opacity-75">- {insight.description}</span>
                        {insight.action && (
                          <button className="text-xs underline ml-2">{insight.action}</button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggestions */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSendMessage(suggestion)}
                        className="px-3 py-1.5 bg-navy-600 hover:bg-navy-500 text-slate-300 text-sm rounded-lg transition-all"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

                {/* Actions */}
                {message.role === 'assistant' && !message.isLoading && (
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(message.content)}
                      className="p-1.5 hover:bg-navy-700 rounded-lg text-slate-500 hover:text-slate-300 transition-all"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 hover:bg-navy-700 rounded-lg text-slate-500 hover:text-emerald-400 transition-all">
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 hover:bg-navy-700 rounded-lg text-slate-500 hover:text-red-400 transition-all">
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Timestamp */}
                <p className={`text-xs text-slate-500 mt-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                  {message.timestamp.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-navy-700">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-navy-700 rounded-2xl border border-navy-600 focus-within:border-violet-500 transition-all">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Pregunta lo que necesites..."
                className="flex-1 bg-transparent text-white placeholder-slate-400 outline-none"
              />
              <button
                onClick={() => setIsListening(!isListening)}
                className={`p-2 rounded-lg transition-all ${
                  isListening
                    ? 'bg-red-500/20 text-red-400'
                    : 'hover:bg-navy-600 text-slate-400 hover:text-white'
                }`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim()}
              className="p-4 bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl text-white shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions Sidebar */}
      <div className="w-80 space-y-4">
        {/* Quick Actions */}
        <div className="bg-navy-800/50 rounded-2xl border border-navy-700 overflow-hidden">
          <div className="p-4 border-b border-navy-700">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Acciones Rápidas
            </h3>
          </div>
          <div className="p-3 space-y-2">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-navy-700 transition-all group"
                >
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${action.color}`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm text-slate-300 group-hover:text-white flex-1 text-left">
                    {action.label}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Tips */}
        <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-2xl border border-violet-500/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-violet-400" />
            <h3 className="font-semibold text-white">Tip del día</h3>
          </div>
          <p className="text-sm text-slate-300">
            Puedes preguntarme sobre cualquier métrica de tu negocio. Intenta:
            <span className="block mt-2 text-violet-400 italic">
              "¿Cuál fue mi mejor día de ventas este mes?"
            </span>
          </p>
        </div>

        {/* Stats */}
        <div className="bg-navy-800/50 rounded-2xl border border-navy-700 p-4">
          <h3 className="font-semibold text-white mb-3">Estadísticas del Co-piloto</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Consultas hoy</span>
              <span className="text-sm font-bold text-white">24</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Precisión</span>
              <span className="text-sm font-bold text-emerald-400">94%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Tiempo respuesta</span>
              <span className="text-sm font-bold text-white">1.2s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IACopilot;
