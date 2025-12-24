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

const generateMorningBriefing = (shipments: Shipment[]): { message: string; actions: ChatAction[] } => {
  const briefing = contextIntelligenceService.generateDailyBriefing(shipments);
  const message = contextIntelligenceService.formatBriefingAsMessage(briefing);

  // Generar acciones basadas en el contexto
  const actions: ChatAction[] = [];

  if (briefing.keyMetrics.total === 0) {
    actions.push({
      id: 'cargar',
      label: 'Cargar guias',
      type: 'primary',
      onClick: () => {},
    });
  } else {
    if (briefing.criticalAlerts.length > 0) {
      const firstAlert = briefing.criticalAlerts[0];
      actions.push({
        id: 'alert-action',
        label: firstAlert.action?.label || 'Ver alertas',
        type: 'primary',
        onClick: () => {},
      });
    }

    if (briefing.recommendations.length > 0) {
      const firstRec = briefing.recommendations[0];
      actions.push({
        id: 'rec-action',
        label: firstRec.action?.label || 'Ver sugerencias',
        type: 'secondary',
        onClick: () => {},
      });
    }

    // Siempre agregar opcion de reporte
    actions.push({
      id: 'reporte',
      label: 'Generar reporte',
      type: 'secondary',
      onClick: () => {},
    });
  }

  return { message, actions };
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

  // Auto-scroll a nuevos mensajes
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Inicializar con briefing matutino inteligente
  useEffect(() => {
    if (!isInitialized) {
      const { message, actions } = generateMorningBriefing(shipments);
      const briefingData = contextIntelligenceService.generateDailyBriefing(shipments);

      // Mapear acciones con handlers reales
      const mappedActions = actions.map(action => {
        let query = '';
        if (action.id === 'cargar') query = 'Quiero cargar guias desde Excel';
        else if (action.id === 'alert-action' && briefingData.criticalAlerts[0]?.action) {
          query = briefingData.criticalAlerts[0].action.query;
        }
        else if (action.id === 'rec-action' && briefingData.recommendations[0]?.action) {
          query = briefingData.recommendations[0].action.query;
        }
        else if (action.id === 'reporte') query = 'Genera el reporte del dia';

        return {
          ...action,
          onClick: () => handleQuickAction(query),
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
    } catch (error) {
      console.error('Error accediendo al micrófono:', error);
      alert('No se pudo acceder al micrófono. Por favor verifica los permisos.');
    }
  };

  // Detener grabación de audio
  const stopRecording = () => {
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

        {/* Proactive Insights - Alertas y sugerencias inteligentes */}
        {shipments.length > 0 && !activeSkill && (
          <ProactiveInsights
            shipments={shipments}
            onInsightAction={handleQuickAction}
            maxVisible={2}
          />
        )}

        {/* Main Content Area - Split when skill is active */}
        <div className={`grid gap-6 ${activeSkill ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
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

          {/* Chat Area */}
          <div className={`bg-gradient-to-b from-navy-900/80 to-navy-900/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden ${activeSkill ? 'order-1 lg:order-2' : ''}`}>
            {/* Messages */}
            <div className={`${activeSkill ? 'h-[350px]' : 'h-[400px]'} overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent`}>
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
              {/* Image Preview */}
              {attachedImage && (
                <div className="mb-3 relative inline-block">
                  <img
                    src={attachedImage}
                    alt="Preview"
                    className="max-h-24 rounded-lg border border-white/20"
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Recording Indicator */}
              {isRecording && (
                <div className="mb-3 flex items-center gap-2 text-red-400 text-sm">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span>Grabando audio... Haz clic en el micrófono para detener</span>
                </div>
              )}

              <div className="flex items-center gap-3">
                {/* Model Selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowModelSelector(!showModelSelector)}
                    className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm transition-colors"
                  >
                    {(() => {
                      const model = AI_MODELS.find(m => m.id === selectedModel);
                      if (!model) return null;
                      const Icon = model.icon;
                      return (
                        <>
                          <Icon className={`w-4 h-4 ${model.color}`} />
                          <span className="text-white hidden sm:inline">{model.name}</span>
                          <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showModelSelector ? 'rotate-180' : ''}`} />
                        </>
                      );
                    })()}
                  </button>

                  {/* Dropdown */}
                  {showModelSelector && (
                    <div className="absolute bottom-full left-0 mb-2 w-48 bg-navy-800 border border-white/20 rounded-xl shadow-xl overflow-hidden z-50">
                      <div className="p-2 border-b border-white/10">
                        <span className="text-xs text-slate-400 font-medium">Seleccionar Modelo</span>
                      </div>
                      {AI_MODELS.map((model) => {
                        const Icon = model.icon;
                        const isSelected = selectedModel === model.id;
                        const isConfigured = providers[model.id]?.isConfigured;
                        return (
                          <button
                            key={model.id}
                            onClick={() => {
                              if (isConfigured) {
                                setSelectedModel(model.id);
                                setShowModelSelector(false);
                              }
                            }}
                            disabled={!isConfigured}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                              isSelected ? 'bg-accent-500/20' : 'hover:bg-white/5'
                            } ${!isConfigured ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <Icon className={`w-5 h-5 ${model.color}`} />
                            <div className="flex-1">
                              <span className={`text-sm ${isSelected ? 'text-white font-medium' : 'text-slate-300'}`}>
                                {model.name}
                              </span>
                              {!isConfigured && (
                                <span className="block text-xs text-slate-500">Sin configurar</span>
                              )}
                            </div>
                            {isSelected && (
                              <CheckCircle className="w-4 h-4 text-accent-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Mode Selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowModeSelector(!showModeSelector)}
                    className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm transition-colors"
                  >
                    {(() => {
                      const mode = CHAT_MODE_OPTIONS.find(m => m.id === selectedMode);
                      if (!mode) return null;
                      const Icon = mode.icon;
                      return (
                        <>
                          <Icon className={`w-4 h-4 ${mode.color}`} />
                          <span className="text-white hidden sm:inline">{mode.name}</span>
                          <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showModeSelector ? 'rotate-180' : ''}`} />
                        </>
                      );
                    })()}
                  </button>

                  {/* Mode Dropdown */}
                  {showModeSelector && (
                    <div className="absolute bottom-full left-0 mb-2 w-56 bg-navy-800 border border-white/20 rounded-xl shadow-xl overflow-hidden z-50">
                      <div className="p-2 border-b border-white/10">
                        <span className="text-xs text-slate-400 font-medium">Modo de Respuesta</span>
                      </div>
                      {CHAT_MODE_OPTIONS.map((mode) => {
                        const Icon = mode.icon;
                        const isSelected = selectedMode === mode.id;
                        return (
                          <button
                            key={mode.id}
                            onClick={() => {
                              setSelectedMode(mode.id);
                              setShowModeSelector(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                              isSelected ? 'bg-accent-500/20' : 'hover:bg-white/5'
                            }`}
                          >
                            <Icon className={`w-5 h-5 ${mode.color}`} />
                            <div className="flex-1">
                              <span className={`text-sm ${isSelected ? 'text-white font-medium' : 'text-slate-300'}`}>
                                {mode.name}
                              </span>
                              <span className="block text-xs text-slate-500">{mode.description}</span>
                            </div>
                            {isSelected && (
                              <CheckCircle className="w-4 h-4 text-accent-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* File Input Hidden */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />

                {/* Attach Image Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-2 rounded-lg transition-colors ${
                    attachedImage
                      ? 'text-accent-400 bg-accent-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                  title="Adjuntar imagen"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                {/* Web Search Toggle */}
                <button
                  onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                  className={`p-2 rounded-lg transition-colors ${
                    webSearchEnabled
                      ? 'text-blue-400 bg-blue-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                  title={webSearchEnabled ? 'Búsqueda web activa' : 'Activar búsqueda web'}
                >
                  <Globe className="w-5 h-5" />
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

                {/* Mic Button */}
                <button
                  onClick={toggleRecording}
                  className={`p-2 rounded-lg transition-colors ${
                    isRecording
                      ? 'text-red-400 bg-red-500/20 animate-pulse'
                      : 'text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                  title={isRecording ? 'Detener grabación' : 'Grabar audio'}
                >
                  {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <button
                  onClick={handleSendMessage}
                  disabled={(!inputValue.trim() && !attachedImage) || isProcessing}
                  className={`
                    p-3 rounded-xl transition-all
                    ${(inputValue.trim() || attachedImage) && !isProcessing
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
              {messages.length <= 2 && shipments.length > 0 && !activeSkill && (
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
        </div>

        {/* Skills Bar */}
        <SkillsBar
          onSkillClick={handleSkillClick}
          activeSkill={activeSkill}
          showExamples={!activeSkill}
        />
      </div>
    </div>
  );
};

export default ChatCommandCenter;
