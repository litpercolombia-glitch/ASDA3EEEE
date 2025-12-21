// components/enterprise/AIBusinessChat.tsx
// Chat IA con Business Intelligence - LITPER PRO Enterprise
// Con soporte multi-proveedor (Claude, GPT-4, Gemini, Chatea)

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Send, Trash2, Bot, User, Sparkles, TrendingUp,
  DollarSign, Package, FileText, BarChart3, Zap, X, Maximize2, Minimize2,
  Settings, Key, Check, AlertCircle, RefreshCw, Lock
} from 'lucide-react';
import { aiBusinessChat, ChatMessage, BusinessSkill } from '../../services/aiBusinessChat';
import { aiProviderService, AIProvider } from '../../services/aiProviderService';
import { permissionService } from '../../services/permissionService';

// ==================== TIPOS ====================

type ChatView = 'chat' | 'config' | 'pin';

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
  const [currentView, setCurrentView] = useState<ChatView>('chat');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const skills = aiBusinessChat.getSkills();
  const ejemplos = aiBusinessChat.getEjemplos();
  const usuario = permissionService.getUsuarioActual();
  const providerActual = aiProviderService.getProviderActual();

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

  const handleOpenConfig = () => {
    if (isAuthenticated) {
      setCurrentView('config');
    } else {
      setCurrentView('pin');
      setPinInput('');
      setPinError('');
    }
  };

  const handlePinSubmit = () => {
    if (aiProviderService.verificarPin(pinInput)) {
      setIsAuthenticated(true);
      setCurrentView('config');
      setPinError('');
    } else {
      setPinError('PIN incorrecto');
      setPinInput('');
    }
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
        {providerActual && (
          <span className="absolute -top-1 -right-1 text-lg">{providerActual.icono}</span>
        )}
      </button>
    );
  }

  const containerClass = isFloating
    ? 'fixed bottom-4 right-4 w-[420px] h-[650px] bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 flex flex-col z-50'
    : 'h-full bg-gray-900 rounded-xl flex flex-col';

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="relative p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
            <Bot className="w-6 h-6 text-white" />
            {providerActual && (
              <span className="absolute -top-1 -right-1 text-sm">{providerActual.icono}</span>
            )}
          </div>
          <div>
            <h3 className="font-bold text-white">Asistente IA</h3>
            <p className="text-xs text-gray-400">
              {providerActual ? providerActual.nombre : 'Business Intelligence'}
            </p>
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
          <button
            onClick={handleOpenConfig}
            className={`p-2 rounded-lg transition-colors ${currentView === 'config' ? 'bg-purple-600' : 'hover:bg-gray-700'}`}
            title="Configuración"
          >
            <Settings className="w-5 h-5 text-white" />
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

      {/* PIN View */}
      {currentView === 'pin' && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-xs space-y-4 text-center">
            <div className="p-4 bg-purple-600/20 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
              <Lock className="w-10 h-10 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Configuración Protegida</h3>
            <p className="text-gray-400 text-sm">Ingresa el PIN de administrador para acceder</p>

            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handlePinSubmit()}
              placeholder="PIN"
              maxLength={6}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-center text-2xl tracking-widest focus:ring-2 focus:ring-purple-500 focus:outline-none text-white"
              autoFocus
            />

            {pinError && (
              <p className="text-red-400 text-sm flex items-center justify-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {pinError}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setCurrentView('chat')}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handlePinSubmit}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white"
              >
                Acceder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Config View */}
      {currentView === 'config' && (
        <ConfigPanel onBack={() => setCurrentView('chat')} />
      )}

      {/* Chat View */}
      {currentView === 'chat' && (
        <>
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
                <p className="text-gray-400 text-sm mb-2">
                  Soy tu asistente de negocio con IA.
                </p>
                {providerActual && (
                  <p className="text-xs text-purple-400 mb-6">
                    {providerActual.icono} Conectado a {providerActual.nombre}
                  </p>
                )}
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
        </>
      )}
    </div>
  );
};

// ==================== CONFIG PANEL ====================

const ConfigPanel: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [providerActual, setProviderActual] = useState<string>('');
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');

  useEffect(() => {
    loadConfig();
    const unsubscribe = aiProviderService.subscribe(loadConfig);
    return unsubscribe;
  }, []);

  const loadConfig = () => {
    const config = aiProviderService.getConfig();
    setProviders(config.providers);
    setProviderActual(config.providerActual);
  };

  const handleSelectProvider = (providerId: string) => {
    aiProviderService.setProviderActual(providerId);
    setProviderActual(providerId);
  };

  const handleToggleProvider = (providerId: string, activo: boolean) => {
    aiProviderService.toggleProvider(providerId, activo);
    loadConfig();
  };

  const handleTestProvider = async (providerId: string) => {
    setTestingProvider(providerId);
    const result = await aiProviderService.testProvider(providerId);
    setTestResults(prev => ({ ...prev, [providerId]: result }));
    setTestingProvider(null);
  };

  const handleEditKey = (providerId: string, currentKey: string) => {
    setEditingKey(providerId);
    setApiKeyInput(currentKey);
  };

  const handleSaveKey = (providerId: string) => {
    if (apiKeyInput.trim()) {
      aiProviderService.actualizarApiKey(providerId, apiKeyInput.trim());
      loadConfig();
    }
    setEditingKey(null);
    setApiKeyInput('');
  };

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Configuración IA
        </h3>
        <button
          onClick={onBack}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white"
        >
          Volver al Chat
        </button>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-800 rounded-xl p-4">
          <h4 className="font-medium text-white mb-3">Proveedores de IA</h4>
          <div className="space-y-3">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className={`p-3 rounded-lg border-2 transition-all ${
                  providerActual === provider.id
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-gray-700 bg-gray-700/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{provider.icono}</span>
                    <div>
                      <p className="font-medium text-white">{provider.nombre}</p>
                      <p className="text-xs text-gray-400">{provider.modelo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {testResults[provider.id] && (
                      <span className={`text-xs ${testResults[provider.id].success ? 'text-green-400' : 'text-red-400'}`}>
                        {testResults[provider.id].success ? '✓ OK' : '✗ Error'}
                      </span>
                    )}
                    <button
                      onClick={() => handleTestProvider(provider.id)}
                      disabled={testingProvider === provider.id || !provider.apiKey}
                      className="p-1.5 bg-gray-600 hover:bg-gray-500 rounded-lg disabled:opacity-50"
                      title="Probar conexión"
                    >
                      <RefreshCw className={`w-4 h-4 text-white ${testingProvider === provider.id ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleToggleProvider(provider.id, !provider.activo)}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        provider.activo
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {provider.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </div>
                </div>

                {/* API Key Input */}
                <div className="mt-3">
                  {editingKey === provider.id ? (
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder="Ingresa tu API Key..."
                        className="flex-1 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveKey(provider.id)}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-xs text-white"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => { setEditingKey(null); setApiKeyInput(''); }}
                        className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 rounded-lg text-xs text-white"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Key className="w-3 h-3 text-gray-400" />
                        {provider.apiKey ? (
                          <span className="text-xs text-gray-400">
                            API Key: ****{provider.apiKey.slice(-8)}
                          </span>
                        ) : (
                          <span className="text-xs text-yellow-400">
                            Sin API Key configurada
                          </span>
                        )}
                        <button
                          onClick={() => handleEditKey(provider.id, provider.apiKey)}
                          className="px-2 py-0.5 bg-gray-600 hover:bg-gray-500 rounded text-xs text-white"
                        >
                          {provider.apiKey ? 'Cambiar' : 'Configurar'}
                        </button>
                      </div>
                      {provider.apiKey && provider.activo && (
                        providerActual === provider.id ? (
                          <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Predeterminado
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSelectProvider(provider.id)}
                            className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded-full"
                          >
                            Usar este
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <h4 className="font-medium text-blue-400 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Información
          </h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Configura tu API Key para cada proveedor</li>
            <li>• Claude es el modelo predeterminado y recomendado</li>
            <li>• Las API Keys se guardan localmente en tu navegador</li>
            <li>• El PIN de configuración es el mismo que en Admin</li>
          </ul>
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
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.content.split('\n').map((line, index) => {
            if (line.startsWith('**') && line.endsWith('**')) {
              return (
                <p key={index} className="font-bold mt-2 first:mt-0">
                  {line.replace(/\*\*/g, '')}
                </p>
              );
            }
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

        {message.skillUsed && (
          <div className="mt-2 pt-2 border-t border-gray-700">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Skill: {message.skillUsed}
            </span>
          </div>
        )}

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
  const providerActual = aiProviderService.getProviderActual();

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
          {providerActual && (
            <span className="absolute -top-1 -right-1 text-lg">{providerActual.icono}</span>
          )}
          <span className="absolute -top-12 right-0 px-3 py-1 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {providerActual ? `IA: ${providerActual.nombre}` : 'Asistente IA'}
          </span>
        </button>
      )}
    </>
  );
};

export default AIBusinessChat;
