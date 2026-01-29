// components/ChatFirst/ChatCommandCenter.tsx
// Centro de Comando Chat-First - Pantalla principal del producto
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Mic,
  MicOff,
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
  Brain,
  Cloud,
  Image as ImageIcon,
  Globe,
  Trash2,
  FileText,
} from 'lucide-react';
import { analyzeEvidenceImage, transcribeAudio } from '../../services/geminiService';
import { Shipment } from '../../types';
import { ContextPanel } from './ContextPanel';
import { SkillsBar, CORE_SKILLS, Skill, SkillId } from './SkillsBar';
import {
  SeguimientoSkillView,
  AlertasSkillView,
  ReportesSkillView,
  PrediccionesSkillView,
  AutomatizacionesSkillView,
} from './SkillViews';
import { useProAssistantStore } from '../../stores/proAssistantStore';
import { unifiedAI, CHAT_MODES, type ChatMode } from '../../services/unifiedAIService';
import { contextIntelligenceService } from '../../services/contextIntelligenceService';
import { ProactiveInsights } from './ProactiveInsights';
import { useAIConfigStore, type AIProvider } from '../../services/aiConfigService';
import { Zap } from 'lucide-react';

// ============================================
// CONFIGURACIÓN DE MODELOS
// ============================================
const AI_MODELS = [
  { id: 'claude' as AIProvider, name: 'Claude', icon: Sparkles, color: 'text-purple-400' },
  { id: 'gemini' as AIProvider, name: 'Gemini', icon: Brain, color: 'text-blue-400' },
  { id: 'openai' as AIProvider, name: 'GPT-4', icon: Cloud, color: 'text-emerald-400' },
];

// ============================================
// CONFIGURACIÓN DE MODOS
// ============================================
const CHAT_MODE_OPTIONS = [
  { id: 'fast' as ChatMode, name: 'Rápido', icon: Zap, color: 'text-yellow-400', description: 'Respuestas concisas' },
  { id: 'reasoning' as ChatMode, name: 'Razonamiento', icon: Brain, color: 'text-pink-400', description: 'Análisis profundo' },
];

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
  image?: string; // Base64 image
  imageUrl?: string; // Generated image URL
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
// CONTEXTO DE BRIEFING MATUTINO (Usando servicio de inteligencia)
// ============================================

const generateMorningBriefing = (shipments: Shipment[]): { message: string; actions: ChatAction[]; briefingData: ReturnType<typeof contextIntelligenceService.generateDailyBriefing> } => {
  const briefing = contextIntelligenceService.generateDailyBriefing(shipments);
  const message = contextIntelligenceService.formatBriefingAsMessage(briefing);

  // Las acciones serán mapeadas en el componente con handlers reales
  const actions: ChatAction[] = [];

  if (briefing.keyMetrics.total === 0) {
    actions.push({
      id: 'cargar',
      label: 'Cargar guias',
      type: 'primary',
      onClick: () => {}, // Se reemplazará en el componente
    });
  } else {
    if (briefing.criticalAlerts.length > 0) {
      const firstAlert = briefing.criticalAlerts[0];
      actions.push({
        id: 'alert-action',
        label: firstAlert.action?.label || 'Ver alertas',
        type: 'primary',
        onClick: () => {}, // Se reemplazará en el componente
      });
    }

    if (briefing.recommendations.length > 0) {
      const firstRec = briefing.recommendations[0];
      actions.push({
        id: 'rec-action',
        label: firstRec.action?.label || 'Ver sugerencias',
        type: 'secondary',
        onClick: () => {}, // Se reemplazará en el componente
      });
    }

    // Siempre agregar opcion de reporte
    actions.push({
      id: 'reporte',
      label: 'Generar reporte',
      type: 'secondary',
      onClick: () => {}, // Se reemplazará en el componente
    });
  }

  return { message, actions, briefingData: briefing };
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
              {/* Mostrar imagen adjunta del usuario */}
              {message.image && (
                <div className="mb-2">
                  <img
                    src={message.image}
                    alt="Imagen adjunta"
                    className="max-w-[200px] max-h-[200px] rounded-lg object-cover"
                  />
                </div>
              )}
              {/* Mostrar imagen generada por IA */}
              {message.imageUrl && (
                <div className="mb-2">
                  <img
                    src={message.imageUrl}
                    alt="Imagen generada"
                    className="max-w-full rounded-lg"
                  />
                </div>
              )}
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
  const { primaryProvider, providers } = useAIConfigStore();

  // Estados
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [activeSkill, setActiveSkill] = useState<SkillId | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIProvider>(primaryProvider);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [selectedMode, setSelectedMode] = useState<ChatMode>('fast');
  const [showModeSelector, setShowModeSelector] = useState(false);

  // Estados multimodales
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const modelSelectorRef = useRef<HTMLDivElement>(null);
  const modeSelectorRef = useRef<HTMLDivElement>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Timeout para grabación de audio (30 segundos)
  const RECORDING_TIMEOUT_MS = 30000;
  const prevMessagesLengthRef = useRef(0);

  // Auto-scroll solo cuando se agregan nuevos mensajes (no al escribir)
  const scrollToBottom = useCallback((force = false) => {
    if (!chatContainerRef.current) return;

    const container = chatContainerRef.current;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

    // Solo hacer scroll si estamos cerca del fondo o es forzado
    // Usamos scrollTop en vez de scrollIntoView para evitar mover toda la página
    if (isNearBottom || force) {
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  // Solo hacer scroll cuando realmente se agregan mensajes nuevos
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      scrollToBottom(true);
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length, scrollToBottom]);

  // Inicializar con briefing matutino inteligente
  useEffect(() => {
    if (!isInitialized) {
      const { message, actions, briefingData } = generateMorningBriefing(shipments);

      // Mapear acciones con handlers REALES y funcionales
      const mappedActions = actions.map(action => {
        let handler: () => void = () => {};

        switch (action.id) {
          case 'cargar':
            // Abrir selector de archivos o tab de automatizaciones
            handler = () => {
              setActiveSkill('automatizaciones');
              handleQuickAction('Quiero cargar guias desde Excel');
            };
            break;

          case 'alert-action':
            // Activar skill de alertas y mostrar críticos
            handler = () => {
              setActiveSkill('alertas');
              if (briefingData.criticalAlerts[0]?.action?.query) {
                handleQuickAction(briefingData.criticalAlerts[0].action.query);
              } else {
                handleQuickAction('Muestrame los envios criticos');
              }
            };
            break;

          case 'rec-action':
            // Activar skill de seguimiento y mostrar recomendaciones
            handler = () => {
              setActiveSkill('seguimiento');
              if (briefingData.recommendations[0]?.action?.query) {
                handleQuickAction(briefingData.recommendations[0].action.query);
              } else {
                handleQuickAction('Dame recomendaciones para hoy');
              }
            };
            break;

          case 'reporte':
            // Activar skill de reportes y generar
            handler = () => {
              setActiveSkill('reportes');
              handleQuickAction('Genera el reporte del dia');
            };
            break;

          default:
            handler = () => handleQuickAction(action.label);
        }

        return {
          ...action,
          onClick: handler,
        };
      });

      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: message,
          timestamp: new Date(),
          actions: mappedActions,
        },
      ]);
      setIsInitialized(true);
    }
  }, [isInitialized, shipments]);

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

  // Prevenir scroll automático de la página cuando el input está activo
  useEffect(() => {
    let scrollLocked = false;
    let lastScrollY = 0;

    const preventAutoScroll = () => {
      // Si el input está enfocado, prevenir que la página haga scroll
      if (document.activeElement === inputRef.current && scrollLocked) {
        window.scrollTo({ top: lastScrollY, behavior: 'instant' });
      }
    };

    const handleFocusIn = (e: FocusEvent) => {
      if (e.target === inputRef.current) {
        lastScrollY = window.scrollY;
        scrollLocked = true;
        // Escuchar intentos de scroll
        window.addEventListener('scroll', preventAutoScroll, { passive: false });
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      if (e.target === inputRef.current) {
        scrollLocked = false;
        window.removeEventListener('scroll', preventAutoScroll);
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      window.removeEventListener('scroll', preventAutoScroll);
    };
  }, []);

  // Cerrar dropdowns con click fuera y Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelSelectorRef.current && !modelSelectorRef.current.contains(event.target as Node)) {
        setShowModelSelector(false);
      }
      if (modeSelectorRef.current && !modeSelectorRef.current.contains(event.target as Node)) {
        setShowModeSelector(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowModelSelector(false);
        setShowModeSelector(false);
      }
    };

    if (showModelSelector || showModeSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showModelSelector, showModeSelector]);

  // Cleanup del timeout de grabación al desmontar
  useEffect(() => {
    return () => {
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
    };
  }, []);

  // Manejar envio de mensaje
  const handleSendMessage = async () => {
    if ((!inputValue.trim() && !attachedImage) || isProcessing) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim() || (attachedImage ? 'Analiza esta imagen' : ''),
      timestamp: new Date(),
      image: attachedImage || undefined,
    };

    const currentImage = attachedImage;
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setAttachedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
      let responseText = '';

      // Si hay imagen adjunta, analizarla primero
      if (currentImage) {
        try {
          const imageAnalysis = await analyzeEvidenceImage(currentImage);
          responseText = `**Análisis de imagen:**\n${imageAnalysis}\n\n`;
        } catch (imageError) {
          console.error('Error analizando imagen:', imageError);
          responseText = '*No se pudo analizar la imagen.*\n\n';
        }
      }

      // Llamar a IA con el modelo y modo seleccionados
      const response = await unifiedAI.chat(
        userMessage.content + (responseText ? `\n\nContexto de imagen: ${responseText}` : ''),
        shipments.slice(0, 50), // Limitar para performance
        {
          provider: selectedModel,
          mode: selectedMode,
          includeHistory: true,
        }
      );

      responseText += response.text;

      // Generar acciones sugeridas basadas en el contenido
      const suggestedActions: ChatAction[] = [];
      if (response.text.toLowerCase().includes('reporte')) {
        suggestedActions.push({
          id: 'gen-report',
          label: 'Generar reporte',
          type: 'secondary',
          onClick: () => handleQuickAction('Genera el reporte del dia'),
        });
      }
      if (response.text.toLowerCase().includes('critico') || response.text.toLowerCase().includes('riesgo')) {
        suggestedActions.push({
          id: 'view-critical',
          label: 'Ver criticos',
          type: 'primary',
          onClick: () => handleQuickAction('Muestrame los envios criticos'),
        });
      }

      // Reemplazar mensaje de loading con respuesta
      setMessages(prev => prev.map(m =>
        m.id === loadingId
          ? {
              ...m,
              id: `assistant-${Date.now()}`,
              content: responseText || 'Lo siento, hubo un problema procesando tu mensaje.',
              isLoading: false,
              actions: suggestedActions.length > 0 ? suggestedActions : undefined,
              imageUrl: response.image, // Imagen generada por IA
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

  // ============================================
  // FUNCIONES MULTIMODALES
  // ============================================

  // Manejar selección de imagen
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remover imagen adjunta
  const handleRemoveImage = () => {
    setAttachedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Iniciar grabación de audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];

          // Agregar mensaje de sistema indicando transcripción
          setMessages(prev => [...prev, {
            id: `system-${Date.now()}`,
            role: 'system',
            content: 'Transcribiendo audio...',
            timestamp: new Date(),
          }]);

          try {
            const transcription = await transcribeAudio(base64Audio);
            if (transcription) {
              setInputValue(transcription);
              // Remover mensaje de transcripción
              setMessages(prev => prev.filter(m => !m.content.includes('Transcribiendo')));
            }
          } catch (error) {
            console.error('Error transcribiendo audio:', error);
          }
        };
        reader.readAsDataURL(audioBlob);

        // Detener tracks del stream
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);

      // Timeout de 30 segundos para evitar que la grabación se cuelgue
      recordingTimeoutRef.current = setTimeout(() => {
        console.warn('Recording timeout after 30 seconds');
        if (recorder.state !== 'inactive') {
          recorder.stop();
          setIsRecording(false);
          setMediaRecorder(null);
        }
      }, RECORDING_TIMEOUT_MS);
    } catch (error) {
      console.error('Error accediendo al micrófono:', error);
      alert('No se pudo acceder al micrófono. Por favor verifica los permisos.');
    }
  };

  // Detener grabación de audio
  const stopRecording = () => {
    // Limpiar timeout
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  // Toggle de grabación
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Prevenir scroll de página cuando se hace focus en el input
  const handleInputFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    // Guardar la posición actual del scroll
    const currentScrollY = window.scrollY;

    // Usar requestAnimationFrame para restaurar después del focus
    requestAnimationFrame(() => {
      window.scrollTo({ top: currentScrollY, behavior: 'instant' });
    });
  }, []);

  // Calcular métricas
  const metrics = React.useMemo(() => {
    const total = shipments.length;
    const delivered = shipments.filter(s => s.status === 'delivered' || s.status === 'DELIVERED').length;
    const inTransit = shipments.filter(s => s.status === 'in_transit' || s.status === 'IN_TRANSIT').length;
    const pending = shipments.filter(s => s.status === 'pending' || s.status === 'PENDING').length;
    const issues = shipments.filter(s => s.status === 'exception' || s.status === 'EXCEPTION' || s.status === 'returned' || s.status === 'RETURNED').length;
    const deliveryRate = total > 0 ? Math.round((delivered / total) * 100) : 0;
    return { total, delivered, inTransit, pending, issues, deliveryRate };
  }, [shipments]);

  return (
    <div className="min-h-[600px] space-y-4">
      {/* Skills Bar - Siempre visible */}
      <SkillsBar
        onSkillClick={handleSkillClick}
        activeSkill={activeSkill}
        showExamples={true}
      />

      {/* Layout principal: KPIs + Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Panel izquierdo: KPIs y métricas */}
        <div className="lg:col-span-1 space-y-4">
          {/* Métricas rápidas */}
          <div className="bg-gradient-to-br from-navy-900/90 to-navy-950/90 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Resumen</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-400">Total</span>
                </div>
                <span className="text-lg font-bold text-white">{metrics.total}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-xl">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-emerald-400">Entregados</span>
                </div>
                <span className="text-lg font-bold text-emerald-400">{metrics.delivered}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-xl">
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-blue-400">En tránsito</span>
                </div>
                <span className="text-lg font-bold text-blue-400">{metrics.inTransit}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-xl">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-amber-400">Pendientes</span>
                </div>
                <span className="text-lg font-bold text-amber-400">{metrics.pending}</span>
              </div>

              {metrics.issues > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-xl">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-red-400">Incidencias</span>
                  </div>
                  <span className="text-lg font-bold text-red-400">{metrics.issues}</span>
                </div>
              )}
            </div>

            {/* Tasa de entrega */}
            <div className="mt-4 p-3 bg-gradient-to-r from-purple-500/20 to-violet-500/20 rounded-xl border border-purple-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-purple-300">Tasa de entrega</span>
                <span className="text-lg font-bold text-purple-400">{metrics.deliveryRate}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-violet-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${metrics.deliveryRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="bg-gradient-to-br from-navy-900/90 to-navy-950/90 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
            <h3 className="text-sm font-bold text-white mb-3">Acciones rápidas</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleQuickAction('Dame el resumen del día')}
                className="w-full flex items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl text-left transition-colors"
              >
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <FileText className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-xs text-slate-300">Resumen del día</span>
              </button>
              <button
                onClick={() => handleQuickAction('¿Qué envíos están en riesgo?')}
                className="w-full flex items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl text-left transition-colors"
              >
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-xs text-slate-300">Envíos en riesgo</span>
              </button>
              <button
                onClick={() => handleQuickAction('Genera un reporte para hoy')}
                className="w-full flex items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl text-left transition-colors"
              >
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Brain className="w-4 h-4 text-purple-400" />
                </div>
                <span className="text-xs text-slate-300">Generar reporte</span>
              </button>
            </div>
          </div>
        </div>

        {/* Panel derecho: Chat + Skill Panel */}
        <div className="lg:col-span-3">
          <div className={`grid gap-4 ${activeSkill ? 'lg:grid-cols-2' : ''}`}>
          {/* Skill Panel - Shows when a skill is active */}
          {activeSkill && (
            <div className="bg-gradient-to-b from-navy-900/80 to-navy-900/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden order-2 lg:order-1">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  {(() => {
                    const skill = CORE_SKILLS.find(s => s.id === activeSkill);
                    if (!skill) return null;
                    const Icon = skill.icon;
                    return (
                      <>
                        <Icon className={`w-5 h-5 ${skill.color}`} />
                        <span className="font-medium text-white">{skill.label}</span>
                      </>
                    );
                  })()}
                </div>
                <button
                  onClick={() => setActiveSkill(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 max-h-[500px] overflow-y-auto">
                {activeSkill === 'seguimiento' && (
                  <SeguimientoSkillView
                    shipments={shipments}
                    onShipmentClick={(s) => handleQuickAction(`Dame detalles de la guia ${s.trackingNumber || s.id}`)}
                    onChatQuery={handleQuickAction}
                  />
                )}
                {activeSkill === 'alertas' && (
                  <AlertasSkillView
                    shipments={shipments}
                    onCityClick={(city) => handleQuickAction(`Analiza la situacion de ${city}`)}
                    onChatQuery={handleQuickAction}
                  />
                )}
                {activeSkill === 'reportes' && (
                  <ReportesSkillView
                    shipments={shipments}
                    onGenerateReport={(type) => handleQuickAction(`Genera reporte de tipo ${type}`)}
                    onChatQuery={handleQuickAction}
                  />
                )}
                {activeSkill === 'predicciones' && (
                  <PrediccionesSkillView
                    shipments={shipments}
                    onShipmentClick={(s) => handleQuickAction(`Prediccion detallada para guia ${s.trackingNumber || s.id}`)}
                    onChatQuery={handleQuickAction}
                  />
                )}
                {activeSkill === 'automatizaciones' && (
                  <AutomatizacionesSkillView
                    shipments={shipments}
                    onChatQuery={handleQuickAction}
                  />
                )}
              </div>
            </div>
          )}

          {/* Chat Area - usa flex para distribuir espacio */}
          <div className={`flex-1 flex flex-col bg-gradient-to-b from-navy-900/80 to-navy-900/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden ${activeSkill ? 'order-1 lg:order-2' : ''}`}>
            {/* Messages - flex-1 para ocupar todo el espacio disponible */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
              style={{ overscrollBehavior: 'contain' }}
            >
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onActionClick={(action) => action.onClick?.()}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area - altura fija, no se encoge */}
            <div className="flex-shrink-0 border-t border-white/10 p-3">
              {/* Preview de imagen adjunta */}
              {attachedImage && (
                <div className="mb-3 relative inline-block">
                  <img src={attachedImage} alt="Preview" className="max-h-20 rounded-lg border border-white/20" />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Indicador de grabación */}
              {isRecording && (
                <div className="mb-2 flex items-center gap-2 text-red-400 text-xs">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span>Grabando... Click en 🎤 para detener</span>
                </div>
              )}

              {/* Barra de input principal */}
              <div className="flex items-center gap-2">
                {/* Input file oculto */}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />

                {/* Botones de herramientas compactos */}
                <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
                  {/* Selector de modelo */}
                  <div className="relative" ref={modelSelectorRef}>
                    <button
                      onClick={() => { setShowModelSelector(!showModelSelector); setShowModeSelector(false); }}
                      className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-white/10 rounded-lg text-xs transition-colors"
                      title="Modelo IA"
                    >
                      {(() => {
                        const model = AI_MODELS.find(m => m.id === selectedModel);
                        if (!model) return null;
                        const Icon = model.icon;
                        return <Icon className={`w-4 h-4 ${model.color}`} />;
                      })()}
                      <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${showModelSelector ? 'rotate-180' : ''}`} />
                    </button>

                    {showModelSelector && (
                      <div className="absolute bottom-full left-0 mb-2 w-44 bg-navy-800 border border-white/20 rounded-xl shadow-xl overflow-hidden z-50">
                        <div className="p-2 border-b border-white/10">
                          <span className="text-[10px] text-slate-400 font-medium uppercase">Modelo IA</span>
                        </div>
                        {AI_MODELS.map((model) => {
                          const Icon = model.icon;
                          const isSelected = selectedModel === model.id;
                          const isConfigured = providers[model.id]?.isConfigured;
                          return (
                            <button
                              key={model.id}
                              onClick={() => { if (isConfigured) { setSelectedModel(model.id); setShowModelSelector(false); } }}
                              disabled={!isConfigured}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${isSelected ? 'bg-accent-500/20' : 'hover:bg-white/5'} ${!isConfigured ? 'opacity-40 cursor-not-allowed' : ''}`}
                            >
                              <Icon className={`w-4 h-4 ${model.color}`} />
                              <span className={`text-sm ${isSelected ? 'text-white' : 'text-slate-300'}`}>{model.name}</span>
                              {isSelected && <CheckCircle className="w-3 h-3 text-accent-400 ml-auto" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Selector de modo */}
                  <div className="relative" ref={modeSelectorRef}>
                    <button
                      onClick={() => { setShowModeSelector(!showModeSelector); setShowModelSelector(false); }}
                      className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-white/10 rounded-lg text-xs transition-colors"
                      title="Modo de respuesta"
                    >
                      {(() => {
                        const mode = CHAT_MODE_OPTIONS.find(m => m.id === selectedMode);
                        if (!mode) return null;
                        const Icon = mode.icon;
                        return <Icon className={`w-4 h-4 ${mode.color}`} />;
                      })()}
                    </button>

                    {showModeSelector && (
                      <div className="absolute bottom-full left-0 mb-2 w-48 bg-navy-800 border border-white/20 rounded-xl shadow-xl overflow-hidden z-50">
                        <div className="p-2 border-b border-white/10">
                          <span className="text-[10px] text-slate-400 font-medium uppercase">Modo</span>
                        </div>
                        {CHAT_MODE_OPTIONS.map((mode) => {
                          const Icon = mode.icon;
                          const isSelected = selectedMode === mode.id;
                          return (
                            <button
                              key={mode.id}
                              onClick={() => { setSelectedMode(mode.id); setShowModeSelector(false); }}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${isSelected ? 'bg-accent-500/20' : 'hover:bg-white/5'}`}
                            >
                              <Icon className={`w-4 h-4 ${mode.color}`} />
                              <div className="flex-1">
                                <span className={`text-sm ${isSelected ? 'text-white' : 'text-slate-300'}`}>{mode.name}</span>
                                <span className="block text-[10px] text-slate-500">{mode.description}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="w-px h-4 bg-white/10" />

                  {/* Adjuntar imagen */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-1.5 rounded-lg transition-colors ${attachedImage ? 'text-accent-400 bg-accent-500/20' : 'text-slate-500 hover:text-white hover:bg-white/10'}`}
                    title="Adjuntar imagen"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  {/* Micrófono */}
                  <button
                    onClick={toggleRecording}
                    className={`p-1.5 rounded-lg transition-colors ${isRecording ? 'text-red-400 bg-red-500/20 animate-pulse' : 'text-slate-500 hover:text-white hover:bg-white/10'}`}
                    title={isRecording ? 'Detener' : 'Grabar voz'}
                  >
                    {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                </div>

                {/* Input de texto */}
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={handleInputFocus}
                    placeholder={activeSkill ? `Pregunta sobre ${CORE_SKILLS.find(s => s.id === activeSkill)?.label.toLowerCase()}...` : "Escribe tu mensaje..."}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
                    disabled={isProcessing}
                  />
                  {activeSkill && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 rounded text-[10px] text-purple-300">
                      {CORE_SKILLS.find(s => s.id === activeSkill)?.label}
                      <button onClick={() => setActiveSkill(null)}><X className="w-3 h-3" /></button>
                    </div>
                  )}
                </div>

                {/* Botón enviar */}
                <button
                  onClick={handleSendMessage}
                  disabled={(!inputValue.trim() && !attachedImage) || isProcessing}
                  className={`p-3 rounded-xl transition-all ${(inputValue.trim() || attachedImage) && !isProcessing ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white hover:shadow-lg hover:shadow-purple-500/30' : 'bg-white/5 text-slate-500 cursor-not-allowed'}`}
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>

              {/* Sugerencias rápidas - solo al inicio */}
              {messages.length <= 2 && !activeSkill && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {(shipments.length > 0
                    ? ['📊 Resumen del día', '⚠️ Envíos críticos', '📝 Generar reporte']
                    : ['📤 ¿Cómo cargo guías?', '🔍 ¿Qué puedes hacer?', '💡 Ayuda']
                  ).map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setInputValue(suggestion.replace(/^[^\s]+\s/, ''))}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatCommandCenter;
