// components/enterprise/AIBusinessChat.tsx
// Chat IA con Business Intelligence - LITPER PRO Enterprise

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Send, Trash2, Bot, User, Sparkles, TrendingUp,
  DollarSign, Package, FileText, BarChart3, Zap, X, Maximize2, Minimize2
} from 'lucide-react';
import { aiBusinessChat, ChatMessage, BusinessSkill } from '../../services/aiBusinessChat';
import { permissionService } from '../../services/permissionService';

// ==================== COMPONENTE PRINCIPAL ====================

interface AIBusinessChatProps {
  isFloating?: boolean;
  onClose?: () => void;
}

export const AIBusinessChat: React.FC<AIBusinessChatProps> = ({ isFloating = false, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSkills, setShowSkills] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!isFloating);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const skills = aiBusinessChat.getSkills();
  const ejemplos = aiBusinessChat.getEjemplos();
  const usuario = permissionService.getUsuarioActual();

  useEffect(() => {
    setMessages(aiBusinessChat.getConversacion());
    const unsubscribe = aiBusinessChat.subscribe(setMessages);
    return unsubscribe;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const mensaje = input;
    setInput('');
    setIsLoading(true);

    try {
      await aiBusinessChat.enviarMensaje(mensaje);
    } catch (error) {
      console.error('Error enviando mensaje:', error);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    if (confirm('¿Limpiar toda la conversación?')) {
      aiBusinessChat.limpiarConversacion();
    }
  };

  const handleEjemplo = (ejemplo: string) => {
    setInput(ejemplo);
    inputRef.current?.focus();
  };

  const skillCategories = [
    { id: 'finanzas', label: 'Finanzas', icon: DollarSign, color: 'text-green-400' },
    { id: 'logistica', label: 'Logística', icon: Package, color: 'text-blue-400' },
    { id: 'reportes', label: 'Reportes', icon: FileText, color: 'text-purple-400' },
    { id: 'analisis', label: 'Análisis', icon: BarChart3, color: 'text-amber-400' },
    { id: 'acciones', label: 'Acciones', icon: Zap, color: 'text-pink-400' },
  ];

  if (isFloating && !isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-4 right-4 p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full shadow-lg hover:scale-105 transition-transform z-50"
      >
        <Bot className="w-8 h-8 text-white" />
      </button>
    );
  }

  const containerClass = isFloating
    ? 'fixed bottom-4 right-4 w-96 h-[600px] bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 flex flex-col z-50'
    : 'h-full bg-gray-900 rounded-xl flex flex-col';

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">Asistente IA</h3>
            <p className="text-xs text-gray-400">Business Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSkills(!showSkills)}
            className={`p-2 rounded-lg transition-colors ${showSkills ? 'bg-purple-600' : 'hover:bg-gray-700'}`}
            title="Ver skills"
          >
            <Sparkles className="w-5 h-5 text-white" />
          </button>
          <button onClick={handleClear} className="p-2 hover:bg-gray-700 rounded-lg" title="Limpiar chat">
            <Trash2 className="w-5 h-5 text-gray-400" />
          </button>
          {isFloating && (
            <>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 hover:bg-gray-700 rounded-lg"
                title="Minimizar"
              >
                <Minimize2 className="w-5 h-5 text-gray-400" />
              </button>
              {onClose && (
                <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg" title="Cerrar">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Skills Panel */}
      {showSkills && (
        <div className="p-4 border-b border-gray-700 bg-gray-800/50">
          <p className="text-sm text-gray-400 mb-3">Skills disponibles:</p>
          <div className="flex flex-wrap gap-2">
            {skillCategories.map((cat) => {
              const categorySkills = skills.filter((s) => s.categoria === cat.id);
              return (
                <div key={cat.id} className="relative group">
                  <button
                    className={`flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm ${cat.color}`}
                  >
                    <cat.icon className="w-4 h-4" />
                    {cat.label}
                    <span className="ml-1 text-xs text-gray-400">({categorySkills.length})</span>
                  </button>
                  {/* Tooltip con skills */}
                  <div className="absolute bottom-full left-0 mb-2 p-2 bg-gray-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-48">
                    {categorySkills.map((skill) => (
                      <div key={skill.id} className="flex items-center gap-2 py-1 text-sm">
                        <span>{skill.icono}</span>
                        <span>{skill.nombre}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <Bot className="w-16 h-16 mx-auto text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              ¡Hola {usuario?.nombre || 'Usuario'}!
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              Soy tu asistente de negocio. Puedo ayudarte con finanzas, logística y más.
            </p>
            <div className="space-y-2">
              <p className="text-xs text-gray-500 uppercase">Prueba preguntar:</p>
              {ejemplos.slice(0, 4).map((ejemplo, index) => (
                <button
                  key={index}
                  onClick={() => handleEjemplo(ejemplo)}
                  className="block w-full text-left px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
                >
                  "{ejemplo}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}

        {isLoading && (
          <div className="flex items-center gap-3 text-gray-400">
            <div className="p-2 bg-purple-600/20 rounded-lg">
              <Bot className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex items-center gap-1">
              <span className="animate-bounce">●</span>
              <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>●</span>
              <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>●</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Pregunta sobre tu negocio..."
            className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none text-white placeholder-gray-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== MESSAGE BUBBLE ====================

const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`p-2 rounded-lg ${
          isUser ? 'bg-blue-600/20' : 'bg-purple-600/20'
        }`}
      >
        {isUser ? (
          <User className="w-5 h-5 text-blue-400" />
        ) : (
          <Bot className="w-5 h-5 text-purple-400" />
        )}
      </div>
      <div
        className={`max-w-[80%] p-3 rounded-2xl ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-gray-800 text-white rounded-bl-sm'
        }`}
      >
        {/* Renderizar contenido con formato */}
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.content.split('\n').map((line, index) => {
            // Detectar títulos en negrita
            if (line.startsWith('**') && line.endsWith('**')) {
              return (
                <p key={index} className="font-bold mt-2 first:mt-0">
                  {line.replace(/\*\*/g, '')}
                </p>
              );
            }
            // Detectar líneas con negrita parcial
            if (line.includes('**')) {
              return (
                <p key={index}>
                  {line.split('**').map((part, i) =>
                    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                  )}
                </p>
              );
            }
            return <p key={index}>{line}</p>;
          })}
        </div>

        {/* Skill usado */}
        {message.skillUsed && (
          <div className="mt-2 pt-2 border-t border-gray-700">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Skill: {message.skillUsed}
            </span>
          </div>
        )}

        {/* Acciones */}
        {message.actions && message.actions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.actions.map((action) => (
              <button
                key={action.id}
                onClick={action.action}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <p className="text-xs text-gray-500 mt-2">
          {new Date(message.timestamp).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};

// ==================== FLOATING CHAT BUTTON ====================

export const AIBusinessChatButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {isOpen ? (
        <AIBusinessChat isFloating onClose={() => setIsOpen(false)} />
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full shadow-lg hover:scale-105 transition-transform z-50 group"
        >
          <Bot className="w-8 h-8 text-white" />
          <span className="absolute -top-10 right-0 px-3 py-1 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Asistente IA
          </span>
        </button>
      )}
    </>
  );
};

export default AIBusinessChat;
