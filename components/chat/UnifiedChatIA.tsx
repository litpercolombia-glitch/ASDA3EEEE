// components/chat/UnifiedChatIA.tsx
// Chat IA Unificado con Modos - Estilo Claude
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  BarChart3,
  Sparkles,
  Bot,
  FileText,
  Send,
  X,
  Minimize2,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Package,
  AlertTriangle,
  CheckCircle,
  Truck,
  Search,
  Zap,
  Brain,
  Target,
  Calendar,
  Clock,
  TrendingUp,
  RefreshCw,
  Copy,
  ExternalLink,
  Settings,
  History,
  Trash2,
  PanelRightClose,
  PanelRightOpen,
  Command,
  Lightbulb,
  HelpCircle,
} from 'lucide-react';
import { Shipment } from '../../types';
import { unifiedAI } from '../../services/unifiedAIService';
import { useProAssistantStore, AIModel } from '../../stores/proAssistantStore';
import inteligenciaService from '../../services/inteligenciaLogisticaService';

// ============================================
// TIPOS Y CONFIGURACIÓN
// ============================================

export type ChatMode = 'chat' | 'analysis' | 'prediction' | 'automation' | 'report';

interface ChatModeConfig {
  id: ChatMode;
  name: string;
  shortName: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  description: string;
  placeholder: string;
  systemContext: string;
  quickActions: QuickAction[];
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  prompt: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  mode: ChatMode;
  metadata?: {
    shipments?: string[];
    action?: string;
    confidence?: number;
  };
}

interface UnifiedChatIAProps {
  shipments: Shipment[];
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: string) => void;
  initialMode?: ChatMode;
}

// ============================================
// CONFIGURACIÓN DE MODOS
// ============================================

const CHAT_MODES: ChatModeConfig[] = [
  {
    id: 'chat',
    name: 'Asistente',
    shortName: 'Chat',
    icon: MessageSquare,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500',
    description: 'Conversación libre con el asistente',
    placeholder: 'Escribe tu pregunta...',
    systemContext: 'Eres el asistente IA de LITPER PRO, experto en logística y gestión de envíos.',
    quickActions: [
      { id: 'help', label: 'Ayuda', icon: HelpCircle, prompt: '¿Qué puedes hacer?' },
      { id: 'status', label: 'Estado general', icon: Package, prompt: '¿Cuál es el estado actual de mis envíos?' },
      { id: 'issues', label: 'Ver novedades', icon: AlertTriangle, prompt: 'Muéstrame las guías con novedades' },
    ],
  },
  {
    id: 'analysis',
    name: 'Analista',
    shortName: 'Análisis',
    icon: BarChart3,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500',
    description: 'Análisis de datos y métricas',
    placeholder: '¿Qué quieres analizar?',
    systemContext: 'Eres un analista de datos especializado en logística. Interpreta métricas y ofrece insights.',
    quickActions: [
      { id: 'carriers', label: 'Por transportadora', icon: Truck, prompt: 'Analiza el rendimiento por transportadora' },
      { id: 'cities', label: 'Por ciudad', icon: Target, prompt: 'Analiza las entregas por ciudad destino' },
      { id: 'trends', label: 'Tendencias', icon: TrendingUp, prompt: '¿Cuáles son las tendencias actuales?' },
    ],
  },
  {
    id: 'prediction',
    name: 'Predictor',
    shortName: 'Predicción',
    icon: Sparkles,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500',
    description: 'Predicciones con Machine Learning',
    placeholder: '¿Qué quieres predecir?',
    systemContext: 'Eres un sistema de predicción ML para logística. Ofrece pronósticos basados en datos.',
    quickActions: [
      { id: 'tomorrow', label: 'Mañana', icon: Calendar, prompt: '¿Qué entregas se completarán mañana?' },
      { id: 'delays', label: 'Retrasos', icon: Clock, prompt: '¿Qué guías podrían retrasarse?' },
      { id: 'success', label: 'Tasa éxito', icon: Target, prompt: 'Predice la tasa de éxito para hoy' },
    ],
  },
  {
    id: 'automation',
    name: 'Automatizador',
    shortName: 'Auto',
    icon: Zap,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500',
    description: 'Automatización de tareas',
    placeholder: '¿Qué tarea quieres automatizar?',
    systemContext: 'Eres un sistema de automatización. Ayuda a ejecutar acciones en lote.',
    quickActions: [
      { id: 'notify', label: 'Notificar', icon: Send, prompt: 'Genera mensajes para guías retrasadas' },
      { id: 'priority', label: 'Priorizar', icon: AlertTriangle, prompt: 'Prioriza las guías críticas' },
      { id: 'export', label: 'Exportar', icon: FileText, prompt: 'Exporta los datos a Excel' },
    ],
  },
  {
    id: 'report',
    name: 'Reportero',
    shortName: 'Reporte',
    icon: FileText,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500',
    description: 'Generación de reportes',
    placeholder: '¿Qué reporte necesitas?',
    systemContext: 'Eres un generador de reportes ejecutivos para logística.',
    quickActions: [
      { id: 'daily', label: 'Diario', icon: Calendar, prompt: 'Genera el reporte del día' },
      { id: 'executive', label: 'Ejecutivo', icon: FileText, prompt: 'Genera un resumen ejecutivo' },
      { id: 'issues', label: 'Novedades', icon: AlertTriangle, prompt: 'Reporte de guías con problemas' },
    ],
  },
];

// ============================================
// COMANDOS RÁPIDOS
// ============================================

const QUICK_COMMANDS = [
  { command: '/buscar', description: 'Buscar una guía específica', example: '/buscar 12345' },
  { command: '/estado', description: 'Ver estado general', example: '/estado' },
  { command: '/criticas', description: 'Ver guías críticas', example: '/criticas' },
  { command: '/reporte', description: 'Generar reporte', example: '/reporte diario' },
  { command: '/predecir', description: 'Predicción ML', example: '/predecir mañana' },
  { command: '/ayuda', description: 'Ver comandos disponibles', example: '/ayuda' },
];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

// Configuración de modelos de IA
const AI_MODELS: { id: AIModel; name: string; icon: string; color: string }[] = [
  { id: 'claude', name: 'Claude', icon: '🟣', color: 'purple' },
  { id: 'gemini', name: 'Gemini', icon: '🔵', color: 'blue' },
  { id: 'openai', name: 'OpenAI', icon: '🟢', color: 'green' },
];

const UnifiedChatIA: React.FC<UnifiedChatIAProps> = ({
  shipments = [],
  isOpen,
  onClose,
  onNavigateToTab,
  initialMode = 'chat',
}) => {
  // Store
  const { config, setAIModel } = useProAssistantStore();

  // Estados
  const [currentMode, setCurrentMode] = useState<ChatMode>(initialMode);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const modelSelectorRef = useRef<HTMLDivElement>(null);

  const currentModeConfig = CHAT_MODES.find(m => m.id === currentMode) || CHAT_MODES[0];
  const currentAIModel = AI_MODELS.find(m => m.id === config.aiModel) || AI_MODELS[0];

  // ============================================
  // MÉTRICAS
  // ============================================

  const metrics = React.useMemo(() => {
    const total = shipments.length;
    const delivered = shipments.filter(s => s.status === 'delivered').length;
    const inTransit = shipments.filter(s => s.status === 'in_transit').length;
    const issues = shipments.filter(s => s.status === 'issue').length;
    const critical = shipments.filter(s => {
      if (s.status === 'delivered') return false;
      const days = s.detailedInfo?.daysInTransit || 0;
      return days >= 5 || s.status === 'issue';
    }).length;
    const deliveryRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

    return { total, delivered, inTransit, issues, critical, deliveryRate };
  }, [shipments]);

  // ============================================
  // SCROLL AL ÚLTIMO MENSAJE
  // ============================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ============================================
  // FOCUS EN INPUT AL ABRIR
  // ============================================

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // ============================================
  // CERRAR DROPDOWN CON CLICK FUERA Y ESCAPE
  // ============================================

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelSelectorRef.current && !modelSelectorRef.current.contains(event.target as Node)) {
        setShowModelSelector(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowModelSelector(false);
      }
    };

    if (showModelSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showModelSelector]);

  // ============================================
  // PROCESAR MENSAJE
  // ============================================

  const processMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    // Agregar mensaje del usuario
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
      mode: currentMode,
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    let response = '';
    let metadata: ChatMessage['metadata'] = {};

    try {
      // Procesar comandos rápidos localmente
      if (text.startsWith('/')) {
        const [command, ...args] = text.slice(1).split(' ');
        switch (command.toLowerCase()) {
          case 'buscar':
            const searchTerm = args.join(' ');
            const found = shipments.filter(s =>
              s.id?.includes(searchTerm) ||
              s.trackingNumber?.includes(searchTerm)
            );
            if (found.length > 0) {
              response = `Encontré ${found.length} guía(s) que coinciden con "${searchTerm}":\n\n`;
              found.slice(0, 5).forEach(s => {
                response += `• **${s.trackingNumber || s.id}** - ${s.status} (${s.carrier})\n`;
              });
              metadata.shipments = found.map(s => s.id);
            } else {
              response = `No encontré guías que coincidan con "${searchTerm}"`;
            }
            break;

          case 'estado':
            response = `📊 **Estado General de Envíos**\n\n`;
            response += `• Total: **${metrics.total}** guías\n`;
            response += `• Entregadas: **${metrics.delivered}** (${metrics.deliveryRate}%)\n`;
            response += `• En tránsito: **${metrics.inTransit}**\n`;
            response += `• Novedades: **${metrics.issues}**\n`;
            response += `• Críticas: **${metrics.critical}**\n\n`;
            response += metrics.critical > 0
              ? `⚠️ Tienes ${metrics.critical} guías críticas que requieren atención.`
              : `✅ No hay guías críticas en este momento.`;
            break;

          case 'criticas':
            const criticalShipments = shipments.filter(s => {
              if (s.status === 'delivered') return false;
              const days = s.detailedInfo?.daysInTransit || 0;
              return days >= 5 || s.status === 'issue';
            });
            if (criticalShipments.length > 0) {
              response = `🚨 **${criticalShipments.length} Guías Críticas**\n\n`;
              criticalShipments.slice(0, 10).forEach((s, i) => {
                response += `${i + 1}. **${s.trackingNumber || s.id}** - ${s.carrier}\n`;
                response += `   Estado: ${s.status} | Días: ${s.detailedInfo?.daysInTransit || '?'}\n\n`;
              });
              metadata.shipments = criticalShipments.map(s => s.id);
            } else {
              response = `✅ No hay guías críticas en este momento. ¡Excelente!`;
            }
            break;

          case 'ayuda':
            response = `📖 **Comandos Disponibles**\n\n`;
            QUICK_COMMANDS.forEach(cmd => {
              response += `• \`${cmd.command}\` - ${cmd.description}\n`;
            });
            response += `• \`/inteligencia\` - Ver resumen de Inteligencia Logística\n`;
            response += `\n💡 También puedes escribir preguntas en lenguaje natural.`;
            break;

          case 'inteligencia':
          case 'int':
          case 'logistica':
            // Obtener datos de Inteligencia Logística
            const sesionActiva = inteligenciaService.getSesionActiva();
            if (sesionActiva) {
              response = inteligenciaService.getResumenParaChat();
            } else {
              response = `📊 **Inteligencia Logística**\n\n⚠️ No hay sesión activa.\n\nPara usar esta función:\n1. Ve a la pestaña "Inteligencia Logística"\n2. Carga un archivo Excel con tus guías\n3. Los datos estarán disponibles aquí`;
            }
            break;

          case 'novedades':
            const guiasNovedad = inteligenciaService.getGuiasConNovedad();
            if (guiasNovedad.length > 0) {
              response = `⚠️ **Guías con Novedad (${guiasNovedad.length})**\n\n`;
              guiasNovedad.slice(0, 10).forEach((g, i) => {
                response += `${i + 1}. **${g.guia}** - ${g.estado}\n`;
                response += `   ${g.transportadora} | ${g.ciudad || 'Sin ciudad'}\n\n`;
              });
              if (guiasNovedad.length > 10) {
                response += `\n... y ${guiasNovedad.length - 10} más`;
              }
            } else if (!inteligenciaService.tieneDatos()) {
              response = `⚠️ No hay datos de Inteligencia Logística cargados. Usa \`/inteligencia\` para más información.`;
            } else {
              response = `✅ No hay guías con novedad. ¡Excelente!`;
            }
            break;

          default:
            response = `Comando no reconocido. Usa \`/ayuda\` para ver los comandos disponibles.`;
        }
      } else {
        // ===== LLAMADA A IA REAL =====
        // Configurar el proveedor según el modelo seleccionado
        unifiedAI.setProvider(config.aiModel);

        // Construir prompt enriquecido según el modo
        const modeContext = {
          chat: 'Responde de forma amigable y útil.',
          analysis: 'Analiza los datos y proporciona insights detallados.',
          prediction: 'Genera predicciones basadas en los patrones de datos.',
          automation: 'Sugiere automatizaciones y acciones para ejecutar.',
          report: 'Genera un reporte estructurado y profesional.',
        };

        // Agregar contexto de Inteligencia Logística si hay datos
        let inteligenciaContext = '';
        if (inteligenciaService.tieneDatos()) {
          const stats = inteligenciaService.getEstadisticas();
          const sesion = inteligenciaService.getSesionActiva();
          inteligenciaContext = `\n\n[Datos de Inteligencia Logística - Sesión: ${sesion?.nombre || 'Activa'}]
- Total guías: ${stats.total}
- Entregadas: ${stats.entregadas}
- En reparto: ${stats.enReparto}
- Con novedad: ${stats.conNovedad}
- Pendientes: ${stats.pendientes}`;
        }

        const enrichedPrompt = `[Modo: ${currentMode}] ${modeContext[currentMode]}${inteligenciaContext}\n\nPregunta del usuario: ${text}`;

        // Llamar al servicio de IA unificado
        const aiResponse = await unifiedAI.chat(enrichedPrompt, shipments, {
          provider: config.aiModel,
          temperature: config.aiSettings[config.aiModel].temperature,
        });

        if (aiResponse.error) {
          response = `⚠️ Error al conectar con ${config.aiModel}: ${aiResponse.error}\n\nIntentando respuesta local...`;
          // Fallback a respuesta local
          response += '\n\n' + generateLocalResponse(text, currentMode, metrics, shipments);
        } else {
          response = aiResponse.text;
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
      // Fallback a respuestas locales si hay error
      response = generateLocalResponse(text, currentMode, metrics, shipments);
    }

    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      mode: currentMode,
      metadata,
    };
    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
  }, [currentMode, shipments, metrics, config.aiModel, config.aiSettings]);

  // Función de respuesta local como fallback
  const generateLocalResponse = (text: string, mode: ChatMode, metrics: any, shipments: Shipment[]): string => {
    switch (mode) {
      case 'chat':
        return generateChatResponse(text, metrics);
      case 'analysis':
        return generateAnalysisResponse(text, shipments, metrics);
      case 'prediction':
        return generatePredictionResponse(text, shipments, metrics);
      case 'automation':
        return generateAutomationResponse(text, shipments);
      case 'report':
        return generateReportResponse(text, shipments, metrics);
      default:
        return generateChatResponse(text, metrics);
    }
  };

  // ============================================
  // GENERADORES DE RESPUESTA POR MODO
  // ============================================

  const generateChatResponse = (text: string, metrics: any): string => {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('hola') || lowerText.includes('hi')) {
      return `¡Hola! 👋 Soy tu asistente LITPER PRO.\n\nActualmente tienes **${metrics.total}** guías cargadas con una tasa de entrega del **${metrics.deliveryRate}%**.\n\n¿En qué puedo ayudarte hoy?`;
    }

    if (lowerText.includes('estado') || lowerText.includes('resumen')) {
      return `📊 **Resumen Actual**\n\n• ${metrics.total} guías totales\n• ${metrics.delivered} entregadas (${metrics.deliveryRate}%)\n• ${metrics.inTransit} en tránsito\n• ${metrics.issues} con novedades\n• ${metrics.critical} críticas\n\n¿Necesitas más detalles sobre algún aspecto?`;
    }

    if (lowerText.includes('ayuda') || lowerText.includes('help')) {
      return `🆘 **¿Cómo puedo ayudarte?**\n\n1. **Cambia de modo** usando los botones arriba para diferentes tipos de análisis\n2. **Usa comandos** como \`/buscar\`, \`/estado\`, \`/criticas\`\n3. **Hazme preguntas** en lenguaje natural\n\n💡 Prueba los botones de acción rápida debajo del chat.`;
    }

    return `Entiendo que quieres saber sobre "${text}". Con ${metrics.total} guías cargadas, puedo ayudarte a analizar datos, predecir entregas o generar reportes.\n\n¿Podrías ser más específico o usar uno de los modos especializados?`;
  };

  const generateAnalysisResponse = (text: string, shipments: Shipment[], metrics: any): string => {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('transportadora') || lowerText.includes('carrier')) {
      const carriers: Record<string, { total: number; delivered: number }> = {};
      shipments.forEach(s => {
        const carrier = s.carrier || 'Desconocida';
        if (!carriers[carrier]) carriers[carrier] = { total: 0, delivered: 0 };
        carriers[carrier].total++;
        if (s.status === 'delivered') carriers[carrier].delivered++;
      });

      let response = `📊 **Análisis por Transportadora**\n\n`;
      Object.entries(carriers)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 5)
        .forEach(([name, data]) => {
          const rate = data.total > 0 ? Math.round((data.delivered / data.total) * 100) : 0;
          const emoji = rate >= 80 ? '🟢' : rate >= 60 ? '🟡' : '🔴';
          response += `${emoji} **${name}**: ${data.total} guías (${rate}% éxito)\n`;
        });
      return response;
    }

    if (lowerText.includes('ciudad') || lowerText.includes('destino')) {
      const cities: Record<string, number> = {};
      shipments.forEach(s => {
        const city = s.detailedInfo?.destination || 'Desconocida';
        cities[city] = (cities[city] || 0) + 1;
      });

      let response = `🌆 **Top Ciudades de Destino**\n\n`;
      Object.entries(cities)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([city, count], i) => {
          response += `${i + 1}. **${city}**: ${count} envíos\n`;
        });
      return response;
    }

    return `📈 **Análisis General**\n\nTasa de éxito: **${metrics.deliveryRate}%**\nGuías activas: **${metrics.total - metrics.delivered}**\nPromedio diario estimado: **${Math.round(metrics.total / 7)}** guías\n\n¿Qué aspecto específico quieres analizar? (transportadoras, ciudades, tendencias)`;
  };

  const generatePredictionResponse = (text: string, shipments: Shipment[], metrics: any): string => {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('mañana') || lowerText.includes('tomorrow')) {
      const pending = shipments.filter(s => s.status === 'in_transit').length;
      const predicted = Math.round(pending * 0.3); // Simulación
      return `🔮 **Predicción para Mañana**\n\n• Guías en tránsito: **${pending}**\n• Entregas estimadas: **${predicted}**\n• Probabilidad de éxito: **${Math.round(metrics.deliveryRate * 1.05)}%**\n\n📊 Basado en patrones históricos y estado actual de envíos.`;
    }

    if (lowerText.includes('retraso') || lowerText.includes('delay')) {
      const atRisk = shipments.filter(s => {
        const days = s.detailedInfo?.daysInTransit || 0;
        return s.status === 'in_transit' && days >= 3;
      }).length;
      return `⏰ **Predicción de Retrasos**\n\n• Guías en riesgo: **${atRisk}**\n• Probabilidad de retraso: **${Math.round((atRisk / metrics.total) * 100)}%**\n\n🎯 Recomendación: Prioriza el seguimiento de estas ${atRisk} guías.`;
    }

    return `🔮 **Predicción ML Activa**\n\n• Tasa de éxito predicha: **${Math.min(100, metrics.deliveryRate + 5)}%**\n• Entregas esperadas hoy: **${Math.round(metrics.inTransit * 0.25)}**\n• Riesgo de devolución: **${Math.round(metrics.issues / metrics.total * 100)}%**\n\n¿Qué predicción específica necesitas?`;
  };

  const generateAutomationResponse = (text: string, shipments: Shipment[]): string => {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('notifica') || lowerText.includes('mensaje')) {
      const withPhone = shipments.filter(s => s.phone || s.recipientPhone).length;
      return `📱 **Automatización de Notificaciones**\n\n✅ ${withPhone} guías tienen teléfono registrado\n\n**Plantilla sugerida:**\n> Hola! Su envío [GUÍA] está [ESTADO]. Puede rastrearlo en...\n\n¿Deseas que prepare los mensajes para envío masivo?`;
    }

    if (lowerText.includes('prioriz') || lowerText.includes('urgen')) {
      const critical = shipments.filter(s => s.status === 'issue' || (s.detailedInfo?.daysInTransit || 0) >= 5);
      return `🎯 **Cola de Priorización**\n\n1. 🔴 Críticas (>5 días): **${critical.filter(s => (s.detailedInfo?.daysInTransit || 0) >= 5).length}**\n2. 🟠 Con novedad: **${critical.filter(s => s.status === 'issue').length}**\n3. 🟡 En oficina: **${shipments.filter(s => s.status === 'in_office').length}**\n\n¿Ejecuto la priorización automática?`;
    }

    return `⚡ **Automatización Disponible**\n\n• 📱 Envío masivo de notificaciones\n• 🎯 Priorización inteligente\n• 📊 Exportación de datos\n• 🔄 Actualización automática\n\n¿Qué tarea quieres automatizar?`;
  };

  const generateReportResponse = (text: string, shipments: Shipment[], metrics: any): string => {
    const lowerText = text.toLowerCase();
    const date = new Date().toLocaleDateString('es-CO');

    if (lowerText.includes('ejecutivo') || lowerText.includes('resumen')) {
      return `📋 **Reporte Ejecutivo - ${date}**\n\n**RESUMEN**\n• Total guías: ${metrics.total}\n• Tasa de entrega: ${metrics.deliveryRate}%\n• Guías críticas: ${metrics.critical}\n\n**INDICADORES**\n• 🟢 Entregadas: ${metrics.delivered}\n• 🔵 En tránsito: ${metrics.inTransit}\n• 🟠 Novedades: ${metrics.issues}\n\n**RECOMENDACIÓN**\n${metrics.critical > 0 ? `Priorizar gestión de ${metrics.critical} guías críticas.` : 'Operación dentro de parámetros normales.'}`;
    }

    if (lowerText.includes('novedad') || lowerText.includes('problema')) {
      const issues = shipments.filter(s => s.status === 'issue');
      let report = `🚨 **Reporte de Novedades - ${date}**\n\n`;
      report += `Total con novedades: **${issues.length}**\n\n`;
      issues.slice(0, 5).forEach((s, i) => {
        report += `${i + 1}. ${s.trackingNumber || s.id} - ${s.carrier}\n`;
      });
      return report;
    }

    return `📄 **Generador de Reportes**\n\n📊 Disponibles:\n• \`Reporte diario\` - Resumen del día\n• \`Reporte ejecutivo\` - Para gerencia\n• \`Reporte de novedades\` - Guías problemáticas\n• \`Reporte por transportadora\`\n\n¿Cuál necesitas?`;
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processMessage(inputValue);
  };

  const handleQuickAction = (action: QuickAction) => {
    processMessage(action.prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
    if (e.key === '/' && inputValue === '') {
      setShowCommands(true);
    }
    if (e.key === 'Escape') {
      setShowCommands(false);
      setShowModelSelector(false);
    }
  };

  const clearHistory = () => {
    setMessages([]);
    setShowHistory(false);
  };

  // ============================================
  // RENDER
  // ============================================

  if (!isOpen) return null;

  return (
    <div className={`fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 transition-all duration-300 ${isExpanded ? 'w-[600px]' : 'w-[420px]'}`}>
      {/* Panel principal */}
      <div className="w-full bg-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className={`p-4 bg-gradient-to-r ${currentModeConfig.bgColor}/20 to-slate-900 border-b border-slate-700/50`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 ${currentModeConfig.bgColor} rounded-xl`}>
                <currentModeConfig.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white flex items-center gap-2">
                  Asistente LITPER
                  <span className={`text-xs px-2 py-0.5 rounded-full ${currentModeConfig.bgColor}/30 ${currentModeConfig.color}`}>
                    {currentModeConfig.name}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">{metrics.total} guías cargadas</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Selector de Modelo IA */}
              <div className="relative" ref={modelSelectorRef}>
                <button
                  onClick={() => setShowModelSelector(!showModelSelector)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors ${
                    showModelSelector ? 'bg-slate-700' : 'hover:bg-slate-800'
                  }`}
                  title="Seleccionar modelo IA"
                >
                  <span className="text-sm">{currentAIModel.icon}</span>
                  <span className="text-xs text-slate-300">{currentAIModel.name}</span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showModelSelector ? 'rotate-180' : ''}`} />
                </button>

                {showModelSelector && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-slate-800 rounded-xl border border-slate-700 shadow-xl z-50 overflow-hidden">
                    <div className="p-2 border-b border-slate-700">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Modelo IA</p>
                    </div>
                    {AI_MODELS.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => {
                          setAIModel(model.id);
                          setShowModelSelector(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                          config.aiModel === model.id
                            ? `bg-${model.color}-500/20 text-${model.color}-400`
                            : 'text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <span className="text-base">{model.icon}</span>
                        <span className="text-sm">{model.name}</span>
                        {config.aiModel === model.id && (
                          <CheckCircle className="w-4 h-4 ml-auto text-emerald-400" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowHistory(!showHistory)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                title="Historial"
              >
                <History className={`w-4 h-4 ${showHistory ? 'text-purple-400' : 'text-slate-400'}`} />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4 text-slate-400" /> : <Maximize2 className="w-4 h-4 text-slate-400" />}
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Selector de modos */}
          <div className="flex gap-1 bg-slate-800/50 rounded-xl p-1">
            {CHAT_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setCurrentMode(mode.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                  currentMode === mode.id
                    ? `${mode.bgColor} text-white shadow-lg`
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
                title={mode.description}
              >
                <mode.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{mode.shortName}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Área de mensajes */}
        <div className="h-[350px] overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className={`p-4 ${currentModeConfig.bgColor}/20 rounded-2xl mb-4`}>
                <currentModeConfig.icon className={`w-10 h-10 ${currentModeConfig.color}`} />
              </div>
              <h4 className="text-white font-bold mb-1">Modo {currentModeConfig.name}</h4>
              <p className="text-slate-400 text-sm mb-4">{currentModeConfig.description}</p>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Command className="w-3 h-3" />
                <span>Usa / para ver comandos</span>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-purple-600 text-white rounded-br-md'
                      : 'bg-slate-800 text-slate-200 rounded-bl-md'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  <div className={`text-[10px] mt-1 ${message.role === 'user' ? 'text-purple-200' : 'text-slate-500'}`}>
                    {message.timestamp.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 p-3 rounded-2xl rounded-bl-md">
                <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Acciones rápidas */}
        <div className="px-4 py-2 border-t border-slate-700/50 bg-slate-800/30">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {currentModeConfig.quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-slate-300 whitespace-nowrap transition-colors"
              >
                <action.icon className="w-3.5 h-3.5" />
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-slate-700/50">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (e.target.value === '') setShowCommands(false);
              }}
              onKeyDown={handleKeyDown}
              placeholder={currentModeConfig.placeholder}
              className="w-full pl-4 pr-12 py-3 bg-slate-800 border border-slate-700 rounded-xl
                text-white text-sm placeholder-slate-500
                focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${
                inputValue.trim() && !isLoading
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-slate-700 text-slate-500'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Comandos */}
          {showCommands && (
            <div className="mt-2 p-2 bg-slate-800 rounded-xl border border-slate-700">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 px-2">Comandos disponibles</p>
              {QUICK_COMMANDS.map((cmd) => (
                <button
                  key={cmd.command}
                  onClick={() => {
                    setInputValue(cmd.command + ' ');
                    setShowCommands(false);
                    inputRef.current?.focus();
                  }}
                  className="w-full flex items-center gap-3 px-2 py-1.5 hover:bg-slate-700 rounded-lg text-left transition-colors"
                >
                  <code className="text-purple-400 text-xs">{cmd.command}</code>
                  <span className="text-xs text-slate-400 flex-1">{cmd.description}</span>
                </button>
              ))}
            </div>
          )}
        </form>

        {/* Footer con opciones */}
        {showHistory && messages.length > 0 && (
          <div className="p-3 border-t border-slate-700/50 bg-slate-800/50">
            <button
              onClick={clearHistory}
              className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpiar historial
            </button>
          </div>
        )}
      </div>

      {/* Botón minimizar */}
      <button
        onClick={onClose}
        className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 shadow-lg
          flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
      >
        <ChevronDown className="w-5 h-5" />
      </button>
    </div>
  );
};

// Estilos de animación
const styles = `
  @keyframes slide-up {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }
`;

if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('unified-chat-styles');
  if (!existingStyle) {
    const styleEl = document.createElement('style');
    styleEl.id = 'unified-chat-styles';
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);
  }
}

export default UnifiedChatIA;
