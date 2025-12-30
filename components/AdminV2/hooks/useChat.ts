/**
 * useChat Hook
 *
 * Manages chat state and skill execution
 */

import { useState, useCallback, useRef } from 'react';
import { Message, Conversation, SkillContext, SkillResult } from '../skills/types';
import SkillsRegistry from '../skills/SkillsRegistry';

// ============================================
// TYPES
// ============================================

interface UseChatOptions {
  projectId?: string;
  userId?: string;
  onSkillExecuted?: (skillId: string, result: SkillResult) => void;
}

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  conversation: Conversation | null;

  // Actions
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  retryLastMessage: () => Promise<void>;

  // Skill helpers
  executeSkill: (skillId: string, params: Record<string, any>) => Promise<SkillResult | null>;
  suggestedSkills: string[];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function createMessage(
  role: Message['role'],
  content: string,
  status: Message['status'] = 'complete'
): Message {
  return {
    id: generateId(),
    role,
    content,
    timestamp: new Date(),
    status,
  };
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const { projectId, userId = 'default', onSkillExecuted } = options;

  const [messages, setMessages] = useState<Message[]>([
    createMessage(
      'assistant',
      'Hola! Soy tu asistente de logistica. Puedo ayudarte a rastrear envios, generar reportes, analizar datos y mas. Como puedo ayudarte hoy?'
    ),
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([
    'track-shipment',
    'generate-report',
    'analyze-carrier',
  ]);

  const lastUserMessageRef = useRef<string>('');

  // Build skill context
  const buildContext = useCallback((): SkillContext => {
    return {
      userId,
      projectId,
      conversationId: generateId(),
      previousResults: messages
        .filter(m => m.artifact)
        .map(m => m.artifact?.content)
        .slice(-5),
    };
  }, [userId, projectId, messages]);

  // Execute a skill directly
  const executeSkill = useCallback(
    async (skillId: string, params: Record<string, any>): Promise<SkillResult | null> => {
      const skill = SkillsRegistry.get(skillId);
      if (!skill) {
        setError(`Skill not found: ${skillId}`);
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const context = buildContext();
        const result = await skill.execute(params, context);

        onSkillExecuted?.(skillId, result);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error ejecutando skill';
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [buildContext, onSkillExecuted]
  );

  // Process user message and match to skill
  const processMessage = useCallback(
    async (userMessage: string): Promise<Message> => {
      // Try to match intent to skill
      const match = SkillsRegistry.matchIntent(userMessage);

      if (match && match.confidence >= 0.3) {
        const { skill } = match;

        // Extract parameters from message
        const params = SkillsRegistry.extractParams(userMessage, skill);

        // Check if we have all required params
        const missingParams = skill.requiredParams.filter(p => !(p.name in params));

        if (missingParams.length > 0) {
          // Ask for missing parameters
          const paramNames = missingParams.map(p => p.label).join(', ');
          return createMessage(
            'assistant',
            `Para ${skill.name.toLowerCase()}, necesito que me proporciones: ${paramNames}. Por favor, incluye esta informacion en tu mensaje.`
          );
        }

        // Execute skill
        const context = buildContext();
        const result = await skill.execute(params, context);

        // Build response message
        const responseMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: result.message,
          timestamp: new Date(),
          status: result.success ? 'complete' : 'error',
          skillId: skill.id,
          skillParams: params,
        };

        // Add artifact if present
        if (result.artifact) {
          responseMessage.artifact = {
            id: generateId(),
            type: result.artifact.type,
            title: result.artifact.title,
            content: result.artifact.content,
            createdAt: new Date(),
            messageId: responseMessage.id,
          };
        }

        // Add suggested actions
        if (result.suggestedActions) {
          responseMessage.suggestedActions = result.suggestedActions;
        }

        // Update suggested skills based on result
        if (result.suggestedActions) {
          setSuggestedSkills(result.suggestedActions.map(a => a.skillId).slice(0, 3));
        }

        onSkillExecuted?.(skill.id, result);

        return responseMessage;
      }

      // No skill matched - provide general response
      const availableSkills = SkillsRegistry.getAll()
        .slice(0, 5)
        .map(s => `- ${s.name}: ${s.description}`)
        .join('\n');

      return createMessage(
        'assistant',
        `No estoy seguro de como ayudarte con eso. Aqui hay algunas cosas que puedo hacer:\n\n${availableSkills}\n\nPrueba diciendo algo como "Rastrear guia 123456" o "Generar reporte de hoy".`
      );
    },
    [buildContext, onSkillExecuted]
  );

  // Send a message
  const sendMessage = useCallback(
    async (content: string): Promise<void> => {
      if (!content.trim() || isLoading) return;

      lastUserMessageRef.current = content;
      setError(null);

      // Add user message
      const userMessage = createMessage('user', content);
      setMessages(prev => [...prev, userMessage]);

      // Add loading message
      const loadingMessage = createMessage('assistant', 'Procesando...', 'pending');
      setMessages(prev => [...prev, loadingMessage]);
      setIsLoading(true);

      try {
        // Process and get response
        const responseMessage = await processMessage(content);

        // Replace loading message with response
        setMessages(prev => prev.slice(0, -1).concat(responseMessage));
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error procesando mensaje';
        setError(errorMsg);

        // Replace loading message with error
        setMessages(prev =>
          prev.slice(0, -1).concat(
            createMessage('assistant', `Lo siento, ocurrio un error: ${errorMsg}`, 'error')
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, processMessage]
  );

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([
      createMessage(
        'assistant',
        'Conversacion reiniciada. Como puedo ayudarte?'
      ),
    ]);
    setError(null);
    setSuggestedSkills(['track-shipment', 'generate-report', 'analyze-carrier']);
  }, []);

  // Retry last message
  const retryLastMessage = useCallback(async () => {
    if (lastUserMessageRef.current) {
      // Remove last two messages (user + error response)
      setMessages(prev => prev.slice(0, -2));
      await sendMessage(lastUserMessageRef.current);
    }
  }, [sendMessage]);

  // Build conversation object
  const conversation: Conversation = {
    id: generateId(),
    title: messages.length > 1 ? messages[1].content.slice(0, 50) + '...' : 'Nueva conversacion',
    messages,
    createdAt: messages[0]?.timestamp || new Date(),
    updatedAt: messages[messages.length - 1]?.timestamp || new Date(),
    projectId,
  };

  return {
    messages,
    isLoading,
    error,
    conversation,
    sendMessage,
    clearMessages,
    retryLastMessage,
    executeSkill,
    suggestedSkills,
  };
}

export default useChat;
