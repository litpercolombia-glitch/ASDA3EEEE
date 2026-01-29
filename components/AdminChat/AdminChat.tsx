// ============================================
// ADMIN CHAT - Componente Principal
// ============================================
// Chat con Skills tipo Claude Code para Litper Pro

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Mic,
  Sparkles,
  X,
  Trash2,
  Menu,
  ChevronLeft,
  Settings,
  Bell,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { useChat } from './hooks/useChat';
import { SKILLS, SKILL_LIST, SKILL_CATEGORIES } from './skills';
import { ResultRenderer } from './renderers';
import { Message } from './types';

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const AdminChat: React.FC = () => {
  const [input, setInput] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    isProcessing,
    sendMessage,
    executeAction,
    clearChat,
    getSuggestions,
    messagesEndRef
  } = useChat();

  const suggestions = getSuggestions(input);

  // Manejar envío
  const handleSend = () => {
    if (!input.trim() || isProcessing) return;
    sendMessage(input);
    setInput('');
    setShowSuggestions(false);
  };

  // Manejar teclas
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Click en skill de la sidebar
  const handleSkillClick = (skillName: string) => {
    setInput(`/${skillName} `);
    inputRef.current?.focus();
  };

  // Seleccionar sugerencia
  const handleSelectSuggestion = (suggestion: string) => {
    setInput(suggestion + ' ');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className="flex h-screen bg-slate-900 text-white">
      {/* Sidebar */}
      <Sidebar
        show={showSidebar}
        onToggle={() => setShowSidebar(!showSidebar)}
        onSkillClick={handleSkillClick}
        onClearChat={clearChat}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header
          onToggleSidebar={() => setShowSidebar(!showSidebar)}
          showSidebar={showSidebar}
        />

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onAction={executeAction}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Skills Bar */}
        <SkillsBar onSkillClick={handleSkillClick} />

        {/* Input Area */}
        <div className="p-4 border-t border-slate-700">
          <div className="relative">
            {/* Sugerencias */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute bottom-full mb-2 left-0 right-0 bg-slate-800 rounded-lg border border-slate-700 shadow-lg overflow-hidden">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className="w-full px-4 py-2 text-left hover:bg-slate-700 transition flex items-center gap-2"
                  >
                    <span className="text-orange-400">{suggestion}</span>
                    <span className="text-slate-500 text-sm">
                      {SKILLS[suggestion.slice(1)]?.description || ''}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="flex items-center gap-2 bg-slate-800 rounded-xl p-2 border border-slate-700 focus-within:border-orange-500/50 transition">
              <button className="p-2 hover:bg-slate-700 rounded-lg transition text-slate-400 hover:text-white">
                <Paperclip className="w-5 h-5" />
              </button>

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setShowSuggestions(e.target.value.startsWith('/'));
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowSuggestions(input.startsWith('/'))}
                placeholder="Escribe un mensaje o usa /comando..."
                className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none"
                disabled={isProcessing}
              />

              <button className="p-2 hover:bg-slate-700 rounded-lg transition text-slate-400 hover:text-white">
                <Mic className="w-5 h-5" />
              </button>

              <button
                onClick={handleSend}
                disabled={!input.trim() || isProcessing}
                className="p-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition"
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// SIDEBAR
// ============================================

interface SidebarProps {
  show: boolean;
  onToggle: () => void;
  onSkillClick: (skillName: string) => void;
  onClearChat: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ show, onToggle, onSkillClick, onClearChat }) => {
  if (!show) return null;

  const skillsByCategory: Record<string, typeof SKILL_LIST> = {};
  SKILL_LIST.forEach(skill => {
    if (!skillsByCategory[skill.category]) {
      skillsByCategory[skill.category] = [];
    }
    skillsByCategory[skill.category].push(skill);
  });

  const categoryLabels: Record<string, string> = {
    reportes: '📊 Reportes',
    operaciones: '📦 Operaciones',
    finanzas: '💰 Finanzas',
    clientes: '👥 Clientes',
    configuracion: '⚙️ Configuración',
    ayuda: '❓ Ayuda'
  };

  return (
    <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-orange-500" />
          <span className="font-bold text-lg">Litper Admin</span>
        </div>
        <button
          onClick={onToggle}
          className="p-1 hover:bg-slate-700 rounded transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Skills */}
      <div className="flex-1 overflow-y-auto p-2">
        {Object.entries(skillsByCategory).map(([category, skills]) => (
          <div key={category} className="mb-4">
            <h3 className="text-xs font-medium text-slate-500 uppercase px-2 mb-1">
              {categoryLabels[category] || category}
            </h3>
            <div className="space-y-0.5">
              {skills.map(skill => (
                <button
                  key={skill.name}
                  onClick={() => onSkillClick(skill.name)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-700 transition text-left group"
                >
                  <span className="text-lg">{skill.icon}</span>
                  <span className="text-sm text-slate-300 group-hover:text-white">
                    /{skill.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="p-2 border-t border-slate-700">
        <button
          onClick={onClearChat}
          className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-700 transition text-slate-400 hover:text-white"
        >
          <Trash2 className="w-4 h-4" />
          <span className="text-sm">Limpiar chat</span>
        </button>
      </div>
    </div>
  );
};

// ============================================
// HEADER
// ============================================

interface HeaderProps {
  onToggleSidebar: () => void;
  showSidebar: boolean;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, showSidebar }) => {
  return (
    <header className="h-14 border-b border-slate-700 flex items-center justify-between px-4 bg-slate-800/50">
      <div className="flex items-center gap-3">
        {!showSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-slate-700 rounded-lg transition"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="font-semibold">Chat Administrativo</h1>
          <p className="text-xs text-slate-500">
            {Object.keys(SKILLS).length} skills disponibles
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 hover:bg-slate-700 rounded-lg transition text-slate-400 hover:text-white">
          <Bell className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-slate-700 rounded-lg transition text-slate-400 hover:text-white">
          <Settings className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-slate-700 rounded-lg transition text-slate-400 hover:text-white">
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

// ============================================
// SKILLS BAR
// ============================================

interface SkillsBarProps {
  onSkillClick: (skillName: string) => void;
}

const SkillsBar: React.FC<SkillsBarProps> = ({ onSkillClick }) => {
  const quickSkills = ['dashboard', 'reporte', 'guias', 'finanzas', 'alertas', 'ayuda'];

  return (
    <div className="px-4 py-2 border-t border-slate-700 overflow-x-auto bg-slate-800/30">
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 whitespace-nowrap">Quick:</span>
        {quickSkills.map(skillName => {
          const skill = SKILLS[skillName];
          if (!skill) return null;

          return (
            <button
              key={skillName}
              onClick={() => onSkillClick(skillName)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded-full text-sm text-slate-300 hover:text-white transition whitespace-nowrap"
            >
              <span>{skill.icon}</span>
              <span>/{skillName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// MESSAGE BUBBLE
// ============================================

interface MessageBubbleProps {
  message: Message;
  onAction: (action: string, params?: Record<string, any>) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onAction }) => {
  const isUser = message.role === 'user';

  // Loading state
  if (message.isLoading) {
    return (
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3">
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Pensando...</span>
          </div>
        </div>
      </div>
    );
  }

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-orange-500/20 border border-orange-500/30 rounded-2xl rounded-tr-sm px-4 py-3">
          <p className="text-white">{message.content}</p>
          <span className="text-xs text-slate-500 mt-1 block">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-4 h-4 text-white" />
      </div>

      <div className="flex-1 max-w-[85%] space-y-2">
        {/* Texto del mensaje */}
        {message.content && !message.data && (
          <div className={`bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 ${message.error ? 'border border-red-500/30' : ''}`}>
            <div className="text-slate-200 whitespace-pre-wrap">{message.content}</div>
          </div>
        )}

        {/* Datos estructurados */}
        {message.data && (
          <ResultRenderer
            result={{
              type: message.data.cards ? 'report' :
                    message.data.headers ? 'table' :
                    message.data.categories ? 'list' :
                    message.data.type ? message.data.type :
                    'card',
              content: message.content,
              data: message.data,
              actions: message.actions
            }}
            onAction={onAction}
          />
        )}

        {/* Acciones sin datos */}
        {!message.data && message.actions && message.actions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.actions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => onAction(action.action, action.params)}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-xs text-slate-500 block">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {message.skillUsed && (
            <span className="ml-2 text-orange-400">/{message.skillUsed}</span>
          )}
        </span>
      </div>
    </div>
  );
};

// Export default
export default AdminChat;
