import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, Lightbulb, RefreshCw } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  knowledgeUsed?: string[];
}

interface ChatTabProps {
  shipmentsContext?: any[];
}

// API URL del backend
const API_BASE = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000';

export const ChatTab: React.FC<ChatTabProps> = ({ shipmentsContext = [] }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hola! Soy el asistente de Litper. Puedo ayudarte con:\n\n- Como usar la app\n- Procesos de logistica\n- Resolver tus dudas\n- Ejecutar acciones\n\nQue necesitas?',
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([
    'Como funciona el semaforo?',
    'Como proceso una novedad?',
    'Cuales son los procesos principales?',
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getCurrentScreen = (): string => {
    // Detectar pantalla actual basado en URL o estado
    const path = window.location.pathname;
    if (path.includes('seguimiento')) return 'seguimiento';
    if (path.includes('novedades')) return 'novedades';
    if (path.includes('semaforo')) return 'semaforo';
    if (path.includes('pedidos')) return 'pedidos';
    return 'home';
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Preparar historial para la API
      const historial = messages.slice(-10).map((m) => ({
        rol: m.role === 'user' ? 'user' : 'assistant',
        contenido: m.content,
      }));

      const response = await fetch(`${API_BASE}/api/assistant/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mensaje: input,
          conversacion_id: conversationId,
          pantalla_actual: getCurrentScreen(),
          historial,
          usar_conocimiento: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Error en la respuesta');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.respuesta,
        timestamp: new Date(),
        knowledgeUsed: data.conocimiento_usado,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setConversationId(data.conversacion_id);

      // Actualizar sugerencias si hay
      if (data.sugerencias && data.sugerencias.length > 0) {
        setSuggestions(data.sugerencias);
      }
    } catch (error) {
      console.error('Error:', error);

      // Fallback a respuesta local si el backend no esta disponible
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Disculpa, hubo un problema conectando con el servidor. Por favor intenta de nuevo.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Chat reiniciado. En que puedo ayudarte?',
        timestamp: new Date(),
      },
    ]);
    setConversationId(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex gap-2 max-w-[85%] ${
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gradient-to-br from-purple-500 to-blue-600 text-white'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              {/* Message bubble */}
              <div
                className={`rounded-2xl p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-slate-100 dark:bg-navy-800 text-slate-800 dark:text-slate-200 rounded-bl-md'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                {/* Knowledge indicator */}
                {message.knowledgeUsed && message.knowledgeUsed.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-200 dark:border-navy-600">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <BookIcon className="w-3 h-3" />
                      Basado en {message.knowledgeUsed.length} fuentes
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-slate-100 dark:bg-navy-800 rounded-2xl rounded-bl-md p-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="text-sm text-slate-500">Pensando...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && messages.length < 3 && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 mb-2 text-xs text-slate-500 dark:text-slate-400">
            <Lightbulb className="w-3 h-3" />
            <span>Sugerencias:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-3 py-1.5 text-xs bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-600 dark:text-slate-300 rounded-full transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900">
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearChat}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg transition-colors"
            title="Reiniciar chat"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <div className="flex-1 flex items-center gap-2 bg-slate-100 dark:bg-navy-800 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu pregunta..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`p-2 rounded-lg transition-all ${
                input.trim() && !isLoading
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mini icon component
const BookIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

export default ChatTab;
