// ============================================
// LITPER PRO - IA COPILOT
// Asistente inteligente de logística con IA
// ============================================

import React, { useState, useRef, useEffect } from 'react';
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
} from 'lucide-react';

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
// RESPUESTAS MOCK (En producción conectar a API IA)
// ============================================

const generateMockResponse = (userMessage: string): { content: string; insights?: Insight[] } => {
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes('resumen') || lowerMessage.includes('hoy')) {
    return {
      content: `📊 **Resumen del día (${new Date().toLocaleDateString('es-CO')})**

Hasta el momento llevas:
- **187 guías** procesadas (+12% vs ayer)
- **142 entregas** exitosas (75.9% tasa)
- **$4.2M** en ventas brutas
- **8 novedades** pendientes

**Lo destacado:**
- Bogotá lidera con 45 entregas exitosas
- Coordinadora tiene la mejor tasa (82%)
- Hay 3 guías con más de 5 días en tránsito

**Recomendación:** Revisar las 8 novedades pendientes antes de las 2pm para mejorar la tasa de cierre del día.`,
      insights: [
        { type: 'success', title: 'Ventas arriba', description: '+12% comparado con ayer', action: 'Ver detalle' },
        { type: 'warning', title: '8 novedades', description: 'Requieren atención hoy', action: 'Gestionar' },
      ],
    };
  }

  if (lowerMessage.includes('ciudad') && lowerMessage.includes('problema')) {
    return {
      content: `🚨 **Ciudades con problemas de entrega**

**Críticas (menos de 60% entrega):**
1. **Quibdó** - 45% tasa | 11 guías | Causa: Zona de difícil acceso
2. **Buenaventura** - 52% tasa | 8 guías | Causa: Problemas de seguridad
3. **Tumaco** - 55% tasa | 5 guías | Causa: Falta de cobertura

**En observación (60-70% entrega):**
- Apartadó (62%)
- Turbo (65%)
- Lorica (68%)

**Recomendación inmediata:** Pausar envíos COD a Quibdó y Buenaventura hasta mejorar las condiciones. Usar prepago obligatorio.`,
      insights: [
        { type: 'danger', title: 'Quibdó crítico', description: '45% tasa de entrega', action: 'Pausar envíos' },
        { type: 'warning', title: 'Buenaventura', description: '52% tasa de entrega', action: 'Revisar' },
      ],
    };
  }

  if (lowerMessage.includes('transportadora') || lowerMessage.includes('mejor')) {
    return {
      content: `🏆 **Ranking de Transportadoras (Último mes)**

| Transportadora | Tasa Entrega | Tiempo Prom. | Guías |
|----------------|--------------|--------------|-------|
| 🥇 Coordinadora | 82% | 2.3 días | 1,245 |
| 🥈 Servientrega | 78% | 2.8 días | 987 |
| 🥉 Interrapidísimo | 75% | 3.1 días | 756 |
| TCC | 72% | 3.4 días | 432 |
| Envía | 68% | 4.2 días | 298 |

**Insight:** Coordinadora es la mejor opción general, pero para ciudades pequeñas Interrapidísimo tiene mejor cobertura.

**Recomendación:** Usar Coordinadora para ciudades principales y Servientrega como backup.`,
      insights: [
        { type: 'success', title: 'Coordinadora #1', description: '82% tasa de entrega', action: 'Ver detalles' },
        { type: 'info', title: 'Tip', description: 'Interrapidísimo mejor en zonas rurales' },
      ],
    };
  }

  if (lowerMessage.includes('predicción') || lowerMessage.includes('ventas') || lowerMessage.includes('próxima')) {
    return {
      content: `🔮 **Predicción de Ventas - Próxima Semana**

Basado en el análisis de las últimas 8 semanas:

| Día | Predicción | Confianza |
|-----|------------|-----------|
| Lunes | $5.2M | Alta (89%) |
| Martes | $4.8M | Alta (87%) |
| Miércoles | $4.5M | Media (78%) |
| Jueves | $5.1M | Alta (85%) |
| Viernes | $6.2M | Alta (92%) |
| Sábado | $3.8M | Media (75%) |
| Domingo | $2.1M | Alta (88%) |

**Total estimado: $31.7M** (±$3.2M)

**Factores considerados:**
- Tendencia histórica (+15% MoM)
- Temporada navideña (+20% esperado)
- Día de pago (jueves/viernes)

**Recomendación:** Aumentar inventario un 20% para el viernes.`,
      insights: [
        { type: 'success', title: 'Viernes fuerte', description: '$6.2M proyectado', action: 'Preparar inventario' },
        { type: 'info', title: 'Tendencia positiva', description: '+15% crecimiento mensual' },
      ],
    };
  }

  // Respuesta genérica
  return {
    content: `Entiendo tu consulta sobre "${userMessage}".

Basándome en los datos actuales de Litper:

- **Total guías hoy:** 187
- **Tasa de entrega:** 75.9%
- **Ventas del día:** $4.2M

¿Hay algo más específico que te gustaría saber? Puedo analizar:
- Rendimiento por ciudad
- Métricas de transportadoras
- Proyecciones de ventas
- Análisis de novedades`,
    insights: [
      { type: 'info', title: 'Tip', description: 'Prueba preguntas más específicas para mejores insights' },
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

¿En qué puedo ayudarte hoy?`,
      timestamp: new Date(),
      suggestions: SUGGESTED_QUESTIONS.slice(0, 3),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

    // Simular delay de IA
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    const response = generateMockResponse(content);

    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      insights: response.insights,
      suggestions: SUGGESTED_QUESTIONS.slice(Math.floor(Math.random() * 3), Math.floor(Math.random() * 3) + 2),
    };

    setMessages(prev => prev.filter(m => !m.isLoading).concat(assistantMessage));
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
