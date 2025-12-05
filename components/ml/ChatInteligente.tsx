/**
 * ChatInteligente.tsx
 * Componente de chat conversacional con IA para consultas de logística.
 * Usa Claude API a través del backend para responder preguntas.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  MessageSquare,
  RefreshCw,
  Lightbulb,
  Package,
  TrendingUp,
  MapPin,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import { getChatResponseWithFallback, type ChatResponse } from '@/lib/api-config';

// Tipos para los mensajes
interface Mensaje {
  id: string;
  tipo: 'usuario' | 'ia' | 'sistema';
  texto: string;
  timestamp: Date;
  datos?: Record<string, unknown>;
  sugerencias?: string[];
}

// Preguntas sugeridas iniciales
const PREGUNTAS_SUGERIDAS = [
  {
    texto: '¿Cuántas guías tengo en total?',
    icon: Package,
    color: 'blue',
  },
  {
    texto: '¿Qué transportadora tiene mejor rendimiento?',
    icon: TrendingUp,
    color: 'green',
  },
  {
    texto: '¿Cuántas guías llegaron tarde esta semana?',
    icon: AlertTriangle,
    color: 'orange',
  },
  {
    texto: 'Dame estadísticas de Bogotá',
    icon: MapPin,
    color: 'purple',
  },
  {
    texto: 'Compara Interrapidisimo vs Coordinadora',
    icon: BarChart3,
    color: 'indigo',
  },
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
  // Estado del chat
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      id: generarId(),
      tipo: 'ia',
      texto:
        '¡Hola! Soy tu asistente de logística con IA. Puedo ayudarte a analizar datos de envíos, transportadoras, ciudades y más. ¿En qué puedo ayudarte hoy?',
      timestamp: new Date(),
      sugerencias: PREGUNTAS_SUGERIDAS.map((p) => p.texto),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll automático al último mensaje
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [mensajes, scrollToBottom]);

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

      try {
        // Llamar a la API (con fallback a modo demo)
        const { data: respuesta, isDemo } = await getChatResponseWithFallback(texto);

        // Agregar respuesta de la IA
        const mensajeIA: Mensaje = {
          id: generarId(),
          tipo: 'ia',
          texto: isDemo
            ? `${respuesta.respuesta}\n\n---\n_Respuesta en modo demostración_`
            : respuesta.respuesta,
          timestamp: new Date(),
          datos: respuesta.datos_consultados,
          sugerencias: respuesta.sugerencias,
        };

        setMensajes((prev) => [...prev, mensajeIA]);
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
        // Focus en el input
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

  return (
    <div className="w-full h-[600px] max-w-4xl mx-auto flex flex-col bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header del chat */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Asistente de Logística
              <Sparkles className="w-4 h-4 text-yellow-300" />
            </h2>
            <p className="text-indigo-200 text-sm">
              Powered by Claude AI
            </p>
          </div>
          <div className="ml-auto">
            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium
              ${loading ? 'bg-yellow-400/20 text-yellow-200' : 'bg-green-400/20 text-green-200'}`}>
              <span className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
              {loading ? 'Pensando...' : 'En línea'}
            </span>
          </div>
        </div>
      </div>

      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {mensajes.map((mensaje) => (
          <MensajeItem
            key={mensaje.id}
            mensaje={mensaje}
            onSugerenciaClick={handleSugerenciaClick}
          />
        ))}

        {/* Indicador de escritura */}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Preguntas sugeridas iniciales */}
      {mensajes.length === 1 && !loading && (
        <div className="px-4 py-3 bg-white border-t">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-gray-600">
              Preguntas sugeridas
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PREGUNTAS_SUGERIDAS.map((pregunta, idx) => {
              const Icon = pregunta.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSugerenciaClick(pregunta.texto)}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                    border border-gray-200 bg-white hover:bg-gray-50
                    transition-all duration-200 hover:shadow-sm`}
                >
                  <Icon className={`w-4 h-4 text-${pregunta.color}-500`} />
                  <span className="text-gray-700">{pregunta.texto}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Input de mensaje */}
      <div className="px-4 py-3 bg-white border-t flex-shrink-0">
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu pregunta aquí..."
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200
              focus:ring-2 focus:ring-indigo-500 focus:border-transparent
              transition-all duration-200"
            disabled={loading}
          />
          <button
            onClick={() => handleEnviarMensaje()}
            disabled={loading || !inputText.trim()}
            className={`p-3 rounded-xl transition-all duration-200
              ${
                loading || !inputText.trim()
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
              }`}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
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
}

function MensajeItem({ mensaje, onSugerenciaClick }: MensajeItemProps) {
  const esUsuario = mensaje.tipo === 'usuario';
  const esSistema = mensaje.tipo === 'sistema';

  if (esSistema) {
    return (
      <div className="flex justify-center">
        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm border border-red-100">
          {mensaje.texto}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-3 ${esUsuario ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
          ${esUsuario ? 'bg-blue-100' : 'bg-indigo-100'}`}
      >
        {esUsuario ? (
          <User className="w-5 h-5 text-blue-600" />
        ) : (
          <Bot className="w-5 h-5 text-indigo-600" />
        )}
      </div>

      {/* Contenido del mensaje */}
      <div
        className={`max-w-[75%] ${
          esUsuario
            ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none'
            : 'bg-white border rounded-2xl rounded-tl-none shadow-sm'
        } px-4 py-3`}
      >
        {/* Texto del mensaje */}
        <div className={`text-sm whitespace-pre-wrap ${esUsuario ? '' : 'text-gray-800'}`}>
          {mensaje.texto}
        </div>

        {/* Timestamp */}
        <div
          className={`text-xs mt-2 ${esUsuario ? 'text-blue-200' : 'text-gray-400'}`}
        >
          {formatearHora(mensaje.timestamp)}
        </div>

        {/* Sugerencias de seguimiento */}
        {!esUsuario && mensaje.sugerencias && mensaje.sugerencias.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
              <RefreshCw className="w-3 h-3" />
              Preguntas relacionadas
            </div>
            <div className="flex flex-wrap gap-2">
              {mensaje.sugerencias.slice(0, 3).map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => onSugerenciaClick(sug)}
                  className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-600
                    hover:bg-indigo-100 transition-colors duration-200"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatInteligente;
