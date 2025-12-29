/**
 * ChatInterfaceV2 - Interfaz de chat profesional nivel Claude
 * Con IA integrada, persistencia, y UX premium
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Trash2,
  RotateCcw,
  History,
  Settings,
  Sparkles,
  PanelRightOpen,
  PanelRightClose,
} from 'lucide-react';
import { colors, radius, shadows, transitions } from '../../../styles/theme';
import { Message, SuggestedAction, Artifact } from '../skills/types';
import SkillsRegistry from '../skills/SkillsRegistry';
import { aiService } from '../../../services/skillsV2/AIService';
import { chatPersistence, ChatMessage } from '../../../services/skillsV2/ChatPersistence';

// Components
import { MessageBubble } from './MessageBubble';
import { InputArea } from './InputArea';
import { QuickActions, QuickActionsHorizontal } from './QuickActions';
import { TypingIndicator, ThinkingIndicator } from './TypingIndicator';
import { AssistantAvatar } from '../UI/Avatar';
import { Button } from '../UI/Button';
import { SkeletonMessage } from '../UI/Skeleton';

// ============================================
// TYPES
// ============================================

interface ChatInterfaceV2Props {
  userId?: string;
  projectId?: string;
  onOpenSkillsStore?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenHistory?: () => void;
}

// ============================================
// WELCOME MESSAGE
// ============================================

const createWelcomeMessage = (): Message => ({
  id: 'welcome-' + Date.now(),
  role: 'assistant',
  content: `¡Hola! Soy tu asistente de LitperPro. Puedo ayudarte con:

• **Rastrear envios** - "Rastrea la guia WDG123456"
• **Generar reportes** - "Genera el reporte de hoy"
• **Analizar ciudades** - "Cuales ciudades tienen problemas?"
• **Ver finanzas** - "Cual es mi ganancia del mes?"
• **Y mucho mas...**

Escribe tu pregunta o selecciona una accion rapida abajo.`,
  timestamp: new Date(),
  status: 'sent',
  suggestedActions: [
    { skillId: 'track-shipment', label: 'Rastrear guia' },
    { skillId: 'generate-report', label: 'Reporte del dia' },
    { skillId: 'dashboard-metrics', label: 'Ver dashboard' },
  ],
});

// ============================================
// MAIN COMPONENT
// ============================================

export const ChatInterfaceV2: React.FC<ChatInterfaceV2Props> = ({
  userId = 'default',
  projectId,
  onOpenSkillsStore,
  onOpenCommandPalette,
  onOpenHistory,
}) => {
  // State
  const [messages, setMessages] = useState<Message[]>([createWelcomeMessage()]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(true);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize
  useEffect(() => {
    chatPersistence.setUserId(userId);
    initConversation();
  }, [userId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Hide quick actions after first user message
  useEffect(() => {
    const userMessages = messages.filter((m) => m.role === 'user');
    if (userMessages.length > 0) {
      setShowQuickActions(false);
    }
  }, [messages]);

  // Initialize conversation
  const initConversation = async () => {
    const existingId = chatPersistence.getCurrentConversationId();

    if (existingId) {
      const conversation = await chatPersistence.getConversation(existingId);
      if (conversation && conversation.messages.length > 0) {
        setMessages([
          createWelcomeMessage(),
          ...conversation.messages.map((m) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })),
        ]);
        setConversationId(existingId);
        return;
      }
    }

    const newConversation = await chatPersistence.createConversation();
    setConversationId(newConversation.id);
  };

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    setError(null);
    setIsLoading(true);

    // Create user message
    const userMessage: Message = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      status: 'sent',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Save user message
    if (conversationId) {
      await chatPersistence.saveMessage(conversationId, userMessage as ChatMessage);
    }

    try {
      // Show thinking indicator
      setIsThinking(true);

      // Try to match skill first
      const intentResult = await aiService.analyzeIntent(content);

      let response: Message;

      if (intentResult.skillId && intentResult.confidence > 0.5) {
        // Execute skill
        const skill = SkillsRegistry.get(intentResult.skillId);

        if (skill) {
          // Extract params from message
          const params = SkillsRegistry.extractParams(content, skill);
          const mergedParams = { ...intentResult.params, ...params };

          try {
            const result = await skill.execute(mergedParams);

            response = {
              id: 'assistant-' + Date.now(),
              role: 'assistant',
              content: result.message || 'Operacion completada.',
              timestamp: new Date(),
              status: result.success ? 'sent' : 'error',
              skillId: skill.id,
              skillParams: mergedParams,
              artifact: result.artifact,
              suggestedActions: result.suggestedActions,
              error: result.error,
            };
          } catch (skillError: any) {
            response = {
              id: 'assistant-' + Date.now(),
              role: 'assistant',
              content: `Error al ejecutar ${skill.name}: ${skillError.message}`,
              timestamp: new Date(),
              status: 'error',
              error: skillError.message,
            };
          }
        } else {
          // Skill not found, use AI
          response = await generateAIResponse(content);
        }
      } else {
        // No skill match, use AI for natural response
        response = await generateAIResponse(content);
      }

      setIsThinking(false);
      setMessages((prev) => [...prev, response]);

      // Save assistant message
      if (conversationId) {
        await chatPersistence.saveMessage(conversationId, response as ChatMessage);
      }
    } catch (err: any) {
      setIsThinking(false);
      const errorMessage: Message = {
        id: 'error-' + Date.now(),
        role: 'assistant',
        content: 'Lo siento, ocurrio un error al procesar tu mensaje. Por favor intenta de nuevo.',
        timestamp: new Date(),
        status: 'error',
        error: err.message,
      };
      setMessages((prev) => [...prev, errorMessage]);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, isLoading]);

  // Generate AI response
  const generateAIResponse = async (userMessage: string): Promise<Message> => {
    const recentMessages = messages.slice(-10).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const aiResponse = await aiService.chat([
      ...recentMessages,
      { role: 'user', content: userMessage },
    ]);

    return {
      id: 'assistant-' + Date.now(),
      role: 'assistant',
      content: aiResponse.content,
      timestamp: new Date(),
      status: 'sent',
    };
  };

  // Handle action click
  const handleActionClick = async (action: SuggestedAction) => {
    if (action.params) {
      // Execute directly with params
      const skill = SkillsRegistry.get(action.skillId);
      if (skill) {
        await sendMessage(`${action.label}`);
      }
    } else {
      // Open skill in input
      const skill = SkillsRegistry.get(action.skillId);
      if (skill?.examples?.[0]) {
        setInput(skill.examples[0]);
        inputRef.current?.focus();
      }
    }
  };

  // Handle quick action
  const handleQuickAction = (example: string) => {
    setInput(example);
    sendMessage(example);
  };

  // Clear conversation
  const handleClearConversation = async () => {
    if (conversationId) {
      await chatPersistence.deleteConversation(conversationId);
    }
    const newConvo = await chatPersistence.createConversation();
    setConversationId(newConvo.id);
    setMessages([createWelcomeMessage()]);
    setShowQuickActions(true);
    setError(null);
  };

  // Retry last message
  const handleRetry = async () => {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMessage) {
      // Remove last assistant message if it was an error
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'assistant' && lastMsg.status === 'error') {
        setMessages((prev) => prev.slice(0, -1));
      }
      await sendMessage(lastUserMessage.content);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: colors.bg.primary,
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1rem',
    borderBottom: `1px solid ${colors.border.light}`,
    backgroundColor: colors.bg.secondary,
  };

  const headerLeftStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  };

  const titleStyles: React.CSSProperties = {
    fontSize: '1rem',
    fontWeight: 600,
    color: colors.text.primary,
  };

  const subtitleStyles: React.CSSProperties = {
    fontSize: '0.75rem',
    color: colors.text.tertiary,
  };

  const headerActionsStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  };

  const actionButtonStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.5rem',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: radius.lg,
    color: colors.text.tertiary,
    cursor: 'pointer',
    transition: `all ${transitions.fast}`,
  };

  const messagesContainerStyles: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem',
  };

  const emptyStateStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    textAlign: 'center',
  };

  return (
    <div style={containerStyles}>
      {/* Header */}
      <div style={headerStyles}>
        <div style={headerLeftStyles}>
          <AssistantAvatar size="sm" />
          <div>
            <h2 style={titleStyles}>Asistente Litper</h2>
            <p style={subtitleStyles}>
              {SkillsRegistry.count} skills disponibles
              {aiService.isAvailable() && ' • IA activa'}
            </p>
          </div>
        </div>

        <div style={headerActionsStyles}>
          {onOpenHistory && (
            <button
              onClick={onOpenHistory}
              style={actionButtonStyles}
              title="Historial"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.bg.hover;
                e.currentTarget.style.color = colors.text.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.text.tertiary;
              }}
            >
              <History size={18} />
            </button>
          )}

          {onOpenSkillsStore && (
            <button
              onClick={onOpenSkillsStore}
              style={actionButtonStyles}
              title="Skills Store"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.bg.hover;
                e.currentTarget.style.color = colors.brand.secondary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.text.tertiary;
              }}
            >
              <Sparkles size={18} />
            </button>
          )}

          <button
            onClick={handleClearConversation}
            style={actionButtonStyles}
            title="Nueva conversacion"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.bg.hover;
              e.currentTarget.style.color = colors.text.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = colors.text.tertiary;
            }}
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={messagesContainerStyles}>
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onActionClick={handleActionClick}
            onRetry={message.status === 'error' ? handleRetry : undefined}
          />
        ))}

        {/* Thinking indicator */}
        {isThinking && <ThinkingIndicator text="Analizando..." />}

        {/* Loading indicator */}
        {isLoading && !isThinking && <TypingIndicator />}

        {/* Quick Actions */}
        {showQuickActions && !isLoading && (
          <QuickActions onActionClick={handleQuickAction} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <InputArea
        value={input}
        onChange={setInput}
        onSend={() => sendMessage(input)}
        onCommandPalette={onOpenCommandPalette}
        isLoading={isLoading}
        placeholder="Escribe un mensaje o usa / para skills..."
      />
    </div>
  );
};

export default ChatInterfaceV2;
