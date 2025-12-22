/**
 * ChatInteligente.tsx
 * Componente de chat conversacional con IA para consultas de logística.
 * Usa Claude API a través del backend con modo offline inteligente.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  RefreshCw,
  Lightbulb,
  Package,
  TrendingUp,
  MapPin,
  AlertTriangle,
  BarChart3,
  Truck,
  Clock,
  DollarSign,
  Target,
  Download,
  Copy,
  Check,
  Wifi,
  WifiOff,
  Brain,
  Zap,
  HelpCircle,
} from 'lucide-react';
import { mlApi, type ChatResponse } from '@/lib/api-config';
import { safeMarkdown } from '@/utils/sanitize';

// Tipos para los mensajes
interface Mensaje {
  id: string;
  tipo: 'usuario' | 'ia' | 'sistema';
  texto: string;
  timestamp: Date;
  datos?: Record<string, unknown>;
  sugerencias?: string[];
  confianza?: number;
  fuentes?: string[];
  tiempoRespuesta?: number;
}

// Categorías de preguntas sugeridas - Ampliado con búsqueda de guías
const CATEGORIAS_PREGUNTAS = [
  {
    categoria: 'Búsqueda de Guías',
    icon: Package,
    color: 'emerald',
    preguntas: [
      '¿Cuáles guías están pendientes?',
      'Dame la lista de guías retrasadas',
      'Muéstrame las guías en tránsito',
      '¿Cuáles guías tienen novedad?',
    ],
  },
  {
    categoria: 'Estados de Guías',
    icon: Clock,
    color: 'cyan',
    preguntas: [
      '¿Qué guías están en "En oficina"?',
      'Lista de guías entregadas hoy',
      '¿Cuáles guías están programadas para mañana?',
      'Guías que llevan más de 3 días',
    ],
  },
  {
    categoria: 'Estadísticas',
    icon: BarChart3,
    color: 'blue',
    preguntas: [
      '¿Cuántas guías tengo en total?',
      '¿Cuál es la tasa de entrega del mes?',
      'Dame el resumen de entregas de hoy',
    ],
  },
  {
    categoria: 'Transportadoras',
    icon: Truck,
    color: 'green',
    preguntas: [
      '¿Qué transportadora tiene mejor rendimiento?',
      'Compara Coordinadora vs Servientrega',
      '¿Cuál transportadora es más económica?',
    ],
  },
  {
    categoria: 'Retrasos',
    icon: AlertTriangle,
    color: 'orange',
    preguntas: [
      '¿Cuántas guías llegaron tarde esta semana?',
      '¿Qué ciudades tienen más retrasos?',
      'Predicción de retrasos para mañana',
    ],
  },
  {
    categoria: 'Ciudades',
    icon: MapPin,
    color: 'purple',
    preguntas: [
      'Dame estadísticas de Bogotá',
      '¿Cuáles son las top 5 ciudades?',
      'Tiempo promedio de entrega a Medellín',
    ],
  },
  {
    categoria: 'Sistema ML',
    icon: Brain,
    color: 'indigo',
    preguntas: [
      '¿Cómo están los modelos de ML?',
      '¿Cuántas predicciones se han hecho hoy?',
      '¿Cuál es la precisión del sistema?',
    ],
  },
];

// Preguntas rápidas para mostrar al inicio - Incluye búsqueda de guías
const PREGUNTAS_RAPIDAS = [
  { texto: 'Guías pendientes', icon: Package, color: 'emerald' },
  { texto: 'Guías con novedad', icon: AlertTriangle, color: 'orange' },
  { texto: 'Estadísticas de hoy', icon: BarChart3, color: 'blue' },
  { texto: 'Mejor transportadora', icon: TrendingUp, color: 'green' },
  { texto: 'Guías retrasadas', icon: Clock, color: 'red' },
  { texto: 'Estado del sistema', icon: Brain, color: 'indigo' },
];

/**
 * Genera un ID único para los mensajes
 */
function generarId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Formatea la hora para mostrar en el mensaje
 */
function formatearHora(fecha: Date): string {
  return fecha.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Componente principal del Chat Inteligente
 */
export function ChatInteligente() {
  // Estado del chat - Mensaje de bienvenida mejorado
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      id: generarId(),
      tipo: 'ia',
      texto:
        '👋 ¡Hola! Soy el Asistente IA de LITPER PRO.\n\n' +
        '🔍 **Búsqueda de guías**: Pregúntame por guías pendientes, retrasadas, en tránsito o con novedad.\n' +
        '📊 **Estadísticas**: Puedo darte reportes de entregas, transportadoras y ciudades.\n' +
        '🎯 **Predicciones**: Te ayudo a predecir retrasos y optimizar rutas.\n\n' +
        'Ejemplo: "Dame la lista de guías pendientes" o "¿Cuáles guías llevan más de 3 días?"',
      timestamp: new Date(),
      sugerencias: PREGUNTAS_RAPIDAS.map((p) => p.texto),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [showCategorias, setShowCategorias] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Verificar estado del backend
  useEffect(() => {
    const checkOnline = async () => {
      const health = await mlApi.healthCheck();
      setIsOnline(health.status !== 'offline');
    };
    checkOnline();
  }, []);

  // Scroll automático al último mensaje
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [mensajes, scrollToBottom]);

  // Copiar mensaje al portapapeles
  const handleCopiar = useCallback((id: string, texto: string) => {
    navigator.clipboard.writeText(texto);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  // Handler para enviar mensaje
  const handleEnviarMensaje = useCallback(
    async (textoOriginal?: string) => {
      const texto = textoOriginal || inputText.trim();

      if (!texto || loading) return;

      // Agregar mensaje del usuario
      const mensajeUsuario: Mensaje = {
        id: generarId(),
        tipo: 'usuario',
        texto,
        timestamp: new Date(),
      };

      setMensajes((prev) => [...prev, mensajeUsuario]);
      setInputText('');
      setLoading(true);
      setShowCategorias(false);

      const startTime = Date.now();

      try {
        // Llamar a la API
        const respuesta = await mlApi.chatPreguntar(texto, true);

        // Agregar respuesta de la IA
        const mensajeIA: Mensaje = {
          id: generarId(),
          tipo: 'ia',
          texto: respuesta.respuesta,
          timestamp: new Date(),
          datos: respuesta.datos_consultados,
          sugerencias: respuesta.sugerencias,
          confianza: respuesta.confianza_respuesta,
          fuentes: respuesta.fuentes,
          tiempoRespuesta: Date.now() - startTime,
        };

        setMensajes((prev) => [...prev, mensajeIA]);
        setIsOnline(mlApi.isOnline());
      } catch (error) {
        // Mensaje de error
        const mensajeError: Mensaje = {
          id: generarId(),
          tipo: 'sistema',
          texto:
            error instanceof Error
              ? `Error: ${error.message}`
              : 'Ocurrió un error al procesar tu consulta. Por favor intenta de nuevo.',
          timestamp: new Date(),
        };

        setMensajes((prev) => [...prev, mensajeError]);
      } finally {
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [inputText, loading]
  );

  // Handler para tecla Enter
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleEnviarMensaje();
      }
    },
    [handleEnviarMensaje]
  );

  // Handler para click en sugerencia
  const handleSugerenciaClick = useCallback(
    (sugerencia: string) => {
      handleEnviarMensaje(sugerencia);
    },
    [handleEnviarMensaje]
  );

  // Limpiar chat
  const handleLimpiarChat = useCallback(() => {
    setMensajes([
      {
        id: generarId(),
        tipo: 'ia',
        texto: '¡Chat reiniciado! ¿En qué puedo ayudarte con tu logística?',
        timestamp: new Date(),
        sugerencias: PREGUNTAS_RAPIDAS.map((p) => p.texto),
      },
    ]);
  }, []);

  return (
    <div className="w-full h-[700px] max-w-4xl mx-auto flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header del chat */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Asistente de Logística IA
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </h2>
            <p className="text-indigo-200 text-sm">Powered by Machine Learning</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Indicador de estado */}
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
              ${isOnline ? 'bg-green-400/20 text-green-200' : 'bg-yellow-400/20 text-yellow-200'}`}
            >
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? 'Conectado' : 'Offline'}
            </span>
            {/* Estado de procesamiento */}
            {loading && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-purple-400/20 text-purple-200">
                <Zap className="w-3 h-3 animate-pulse" />
                Pensando...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
        {mensajes.map((mensaje) => (
          <MensajeItem
            key={mensaje.id}
            mensaje={mensaje}
            onSugerenciaClick={handleSugerenciaClick}
            onCopiar={handleCopiar}
            isCopied={copiedId === mensaje.id}
          />
        ))}

        {/* Indicador de escritura */}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Bot className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-none px-5 py-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span
                    className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
                <span className="text-sm text-gray-500 ml-2">Analizando datos...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Preguntas sugeridas iniciales */}
      {mensajes.length === 1 && !loading && (
        <div className="px-4 py-4 bg-white border-t">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-semibold text-gray-700">Preguntas Rápidas</span>
            </div>
            <button
              onClick={() => setShowCategorias(!showCategorias)}
              className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <HelpCircle className="w-3 h-3" />
              {showCategorias ? 'Ocultar categorías' : 'Ver más categorías'}
            </button>
          </div>

          {/* Preguntas rápidas */}
          <div className="flex flex-wrap gap-2 mb-3">
            {PREGUNTAS_RAPIDAS.map((pregunta, idx) => {
              const Icon = pregunta.icon;
              const colorClasses: Record<string, string> = {
                blue: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
                green: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
                orange: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
                indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
              };
              return (
                <button
                  key={idx}
                  onClick={() => handleSugerenciaClick(pregunta.texto)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm
                    border transition-all duration-200 ${colorClasses[pregunta.color]}`}
                >
                  <Icon className="w-4 h-4" />
                  {pregunta.texto}
                </button>
              );
            })}
          </div>

          {/* Categorías expandibles */}
          {showCategorias && (
            <div className="space-y-3 pt-3 border-t">
              {CATEGORIAS_PREGUNTAS.map((cat, idx) => {
                const Icon = cat.icon;
                const colorClasses: Record<string, { bg: string; text: string }> = {
                  blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
                  green: { bg: 'bg-green-100', text: 'text-green-600' },
                  orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
                  purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
                  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
                };
                const colors = colorClasses[cat.color] || colorClasses.blue;
                return (
                  <div key={idx}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-1.5 rounded-lg ${colors.bg}`}>
                        <Icon className={`w-4 h-4 ${colors.text}`} />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{cat.categoria}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 ml-8">
                      {cat.preguntas.map((preg, pidx) => (
                        <button
                          key={pidx}
                          onClick={() => handleSugerenciaClick(preg)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600
                            hover:bg-gray-200 transition-colors"
                        >
                          {preg}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Input de mensaje */}
      <div className="px-4 py-4 bg-white border-t flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu pregunta aquí..."
              className="w-full px-5 py-3.5 pr-12 rounded-xl border-2 border-gray-200
                focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500
                transition-all duration-200 text-gray-800"
              disabled={loading}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              {inputText.length}/500
            </span>
          </div>
          <button
            onClick={() => handleEnviarMensaje()}
            disabled={loading || !inputText.trim()}
            className={`p-3.5 rounded-xl transition-all duration-200
              ${
                loading || !inputText.trim()
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 active:scale-95 shadow-lg'
              }`}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
          <button
            onClick={handleLimpiarChat}
            className="p-3.5 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
            title="Limpiar chat"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Componente para renderizar un mensaje individual
 */
interface MensajeItemProps {
  mensaje: Mensaje;
  onSugerenciaClick: (sugerencia: string) => void;
  onCopiar: (id: string, texto: string) => void;
  isCopied: boolean;
}

function MensajeItem({ mensaje, onSugerenciaClick, onCopiar, isCopied }: MensajeItemProps) {
  const esUsuario = mensaje.tipo === 'usuario';
  const esSistema = mensaje.tipo === 'sistema';

  if (esSistema) {
    return (
      <div className="flex justify-center">
        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm border border-red-100 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {mensaje.texto}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-3 ${esUsuario ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm
          ${
            esUsuario
              ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
              : 'bg-gradient-to-br from-indigo-100 to-purple-100'
          }`}
      >
        {esUsuario ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-indigo-600" />
        )}
      </div>

      {/* Contenido del mensaje */}
      <div className={`max-w-[80%] ${esUsuario ? 'items-end' : 'items-start'}`}>
        <div
          className={`${
            esUsuario
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-none'
              : 'bg-white border border-gray-100 rounded-2xl rounded-tl-none shadow-sm'
          } px-5 py-4`}
        >
          {/* Texto del mensaje con formato markdown básico - SANITIZADO contra XSS */}
          <div
            className={`text-sm whitespace-pre-wrap leading-relaxed ${esUsuario ? '' : 'text-gray-800'}`}
          >
            {mensaje.texto.split('\n').map((linea, i) => {
              // Usar safeMarkdown para sanitizar y formatear de forma segura
              if (linea.includes('**') || linea.includes('*') || linea.includes('`')) {
                return (
                  <p
                    key={i}
                    dangerouslySetInnerHTML={{
                      __html: safeMarkdown(linea),
                    }}
                  />
                );
              }
              return <p key={i}>{linea}</p>;
            })}
          </div>

          {/* Timestamp y acciones */}
          <div
            className={`flex items-center justify-between mt-3 pt-2 border-t
            ${esUsuario ? 'border-white/20' : 'border-gray-100'}`}
          >
            <span className={`text-xs ${esUsuario ? 'text-blue-200' : 'text-gray-400'}`}>
              {formatearHora(mensaje.timestamp)}
            </span>

            {!esUsuario && (
              <div className="flex items-center gap-2">
                {mensaje.confianza && (
                  <span className="text-xs text-indigo-500 flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    {Math.round(mensaje.confianza * 100)}% confianza
                  </span>
                )}
                <button
                  onClick={() => onCopiar(mensaje.id, mensaje.texto)}
                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                  title="Copiar respuesta"
                >
                  {isCopied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Fuentes */}
        {!esUsuario && mensaje.fuentes && mensaje.fuentes.length > 0 && (
          <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
            <span>Fuentes:</span>
            {mensaje.fuentes.map((fuente, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-gray-100 rounded-full">
                {fuente}
              </span>
            ))}
          </div>
        )}

        {/* Sugerencias de seguimiento */}
        {!esUsuario && mensaje.sugerencias && mensaje.sugerencias.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
              <Lightbulb className="w-3 h-3" />
              Continúa preguntando
            </div>
            <div className="flex flex-wrap gap-2">
              {mensaje.sugerencias.slice(0, 3).map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => onSugerenciaClick(sug)}
                  className="text-xs px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-600
                    hover:bg-indigo-100 transition-colors border border-indigo-100"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tiempo de respuesta */}
        {!esUsuario && mensaje.tiempoRespuesta && (
          <div className="mt-1 text-xs text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Respondido en {mensaje.tiempoRespuesta}ms
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatInteligente;
