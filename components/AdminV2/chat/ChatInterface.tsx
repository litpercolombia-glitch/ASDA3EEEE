/**
 * ChatInterface - Main chat component
 *
 * Provides the primary interface for interacting with skills via natural language
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Loader2,
  RefreshCw,
  Trash2,
  Package,
  FileText,
  TrendingUp,
  Zap,
  MessageSquare,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
} from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { Message, Artifact, SuggestedAction } from '../skills/types';
import SkillsRegistry from '../skills/SkillsRegistry';

// ============================================
// STYLES
// ============================================

const COLORS = {
  primary: '#F97316',
  secondary: '#6366F1',
  background: '#0F172A',
  surface: '#1E293B',
  surfaceLight: '#334155',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
};

// ============================================
// SUB-COMPONENTS
// ============================================

interface MessageBubbleProps {
  message: Message;
  onActionClick: (action: SuggestedAction) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onActionClick }) => {
  const isUser = message.role === 'user';
  const isError = message.status === 'error';
  const isPending = message.status === 'pending';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-orange-500 text-white'
            : isError
              ? 'bg-red-500/20 border border-red-500/50 text-red-200'
              : 'bg-slate-700 text-slate-100'
        }`}
        style={{
          backgroundColor: isUser
            ? COLORS.primary
            : isError
              ? 'rgba(239, 68, 68, 0.2)'
              : COLORS.surfaceLight,
        }}
      >
        {/* Loading indicator */}
        {isPending && (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Procesando...</span>
          </div>
        )}

        {/* Message content */}
        {!isPending && (
          <div className="whitespace-pre-wrap">{message.content}</div>
        )}

        {/* Skill badge */}
        {message.skillId && (
          <div
            className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs"
            style={{ backgroundColor: 'rgba(99, 102, 241, 0.3)' }}
          >
            <Zap className="w-3 h-3" />
            {message.skillId}
          </div>
        )}

        {/* Artifact preview */}
        {message.artifact && (
          <div
            className="mt-3 p-3 rounded-lg border"
            style={{
              backgroundColor: COLORS.surface,
              borderColor: COLORS.surfaceLight,
            }}
          >
            <ArtifactPreview artifact={message.artifact} />
          </div>
        )}

        {/* Suggested actions */}
        {message.suggestedActions && message.suggestedActions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.suggestedActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => onActionClick(action)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors hover:bg-slate-600"
                style={{ backgroundColor: COLORS.surfaceLight }}
              >
                <ChevronRight className="w-3 h-3" />
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div
          className="mt-2 text-xs opacity-60"
          style={{ color: isUser ? 'white' : COLORS.textMuted }}
        >
          {message.timestamp.toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
};

interface ArtifactPreviewProps {
  artifact: Artifact;
}

const ArtifactPreview: React.FC<ArtifactPreviewProps> = ({ artifact }) => {
  if (artifact.type === 'table' && artifact.content) {
    const { columns, rows } = artifact.content;

    return (
      <div>
        <div className="flex items-center gap-2 mb-2 text-sm font-medium">
          <FileText className="w-4 h-4" style={{ color: COLORS.primary }} />
          {artifact.title}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${COLORS.surfaceLight}` }}>
                {columns?.map((col: any, idx: number) => (
                  <th
                    key={idx}
                    className="text-left py-1 px-2 font-medium"
                    style={{ color: COLORS.textMuted }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows?.slice(0, 5).map((row: any, idx: number) => (
                <tr
                  key={idx}
                  style={{ borderBottom: `1px solid ${COLORS.surface}` }}
                >
                  {columns?.map((col: any, colIdx: number) => (
                    <td key={colIdx} className="py-1 px-2">
                      {row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {rows?.length > 5 && (
            <div
              className="text-xs mt-2 text-center"
              style={{ color: COLORS.textMuted }}
            >
              ... y {rows.length - 5} filas mas
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="text-sm" style={{ color: COLORS.textMuted }}>
      Artifact: {artifact.type}
    </div>
  );
};

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  example: string;
  onClick: (example: string) => void;
}

const QuickAction: React.FC<QuickActionProps> = ({ icon, label, example, onClick }) => (
  <button
    onClick={() => onClick(example)}
    className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-slate-600/50 text-left w-full"
    style={{ backgroundColor: COLORS.surfaceLight }}
  >
    <div
      className="p-2 rounded-lg"
      style={{ backgroundColor: COLORS.primary + '20' }}
    >
      {icon}
    </div>
    <div>
      <div className="font-medium text-sm">{label}</div>
      <div className="text-xs" style={{ color: COLORS.textMuted }}>
        {example}
      </div>
    </div>
  </button>
);

// ============================================
// MAIN COMPONENT
// ============================================

interface ChatInterfaceProps {
  projectId?: string;
  userId?: string;
  onClose?: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  projectId,
  userId,
  onClose,
}) => {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    executeSkill,
  } = useChat({ projectId, userId });

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle send
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const message = input;
    setInput('');
    await sendMessage(message);
  };

  // Handle suggested action click
  const handleActionClick = async (action: SuggestedAction) => {
    if (action.params) {
      const result = await executeSkill(action.skillId, action.params);
      if (result) {
        // Add response message
        await sendMessage(
          `${action.label}: ${action.params.guideNumber || JSON.stringify(action.params)}`
        );
      }
    } else {
      // Prompt for params
      const skill = SkillsRegistry.get(action.skillId);
      if (skill) {
        setInput(`${skill.examples[0] || skill.name} `);
        inputRef.current?.focus();
      }
    }
  };

  // Handle quick action
  const handleQuickAction = (example: string) => {
    setInput(example);
    inputRef.current?.focus();
  };

  // Quick actions for empty state
  const quickActions = [
    {
      icon: <Package className="w-5 h-5" style={{ color: COLORS.primary }} />,
      label: 'Rastrear Envio',
      example: 'Rastrear guia 123456',
    },
    {
      icon: <FileText className="w-5 h-5" style={{ color: COLORS.success }} />,
      label: 'Generar Reporte',
      example: 'Generar reporte de entregas de hoy',
    },
    {
      icon: <TrendingUp className="w-5 h-5" style={{ color: COLORS.secondary }} />,
      label: 'Analizar Datos',
      example: 'Analizar rendimiento de transportadoras',
    },
  ];

  const showQuickActions = messages.length <= 1;

  return (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: COLORS.background }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: COLORS.surfaceLight }}
      >
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: COLORS.primary + '20' }}
          >
            <MessageSquare className="w-5 h-5" style={{ color: COLORS.primary }} />
          </div>
          <div>
            <h2 className="font-semibold text-white">Asistente Litper</h2>
            <p className="text-xs" style={{ color: COLORS.textMuted }}>
              {SkillsRegistry.count} skills disponibles
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearMessages}
            className="p-2 rounded-lg transition-colors hover:bg-slate-700"
            title="Limpiar conversacion"
          >
            <Trash2 className="w-4 h-4" style={{ color: COLORS.textMuted }} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors hover:bg-slate-700"
              title="Cerrar"
            >
              <X className="w-4 h-4" style={{ color: COLORS.textMuted }} />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map(message => (
          <MessageBubble
            key={message.id}
            message={message}
            onActionClick={handleActionClick}
          />
        ))}

        {/* Quick actions for empty state */}
        {showQuickActions && (
          <div className="mt-4">
            <p className="text-sm mb-3" style={{ color: COLORS.textMuted }}>
              Prueba con alguna de estas acciones:
            </p>
            <div className="grid gap-2">
              {quickActions.map((action, idx) => (
                <QuickAction
                  key={idx}
                  {...action}
                  onClick={handleQuickAction}
                />
              ))}
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div
            className="flex items-center gap-2 p-3 rounded-lg mb-4"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
          >
            <AlertCircle className="w-5 h-5" style={{ color: COLORS.error }} />
            <span className="text-sm" style={{ color: COLORS.error }}>
              {error}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="p-4 border-t"
        style={{ borderColor: COLORS.surfaceLight }}
      >
        <div
          className="flex items-center gap-2 p-2 rounded-xl"
          style={{ backgroundColor: COLORS.surface }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Escribe un mensaje... (ej: rastrear guia 123456)"
            className="flex-1 bg-transparent px-2 py-2 outline-none text-white placeholder:text-slate-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-lg transition-colors disabled:opacity-50"
            style={{
              backgroundColor: input.trim() ? COLORS.primary : COLORS.surfaceLight,
            }}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Send className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
        <p
          className="text-xs mt-2 text-center"
          style={{ color: COLORS.textMuted }}
        >
          Presiona Enter para enviar
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;
