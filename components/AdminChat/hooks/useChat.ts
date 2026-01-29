// ============================================
// HOOK useChat - Lógica principal del chat
// ============================================

import { useState, useCallback, useRef, useEffect } from 'react';
import { Message, SkillResult, ChatState } from '../types';
import { parseCommand, executeSkill, findSkill, SKILLS } from '../skills';

const API_BASE = 'http://localhost:8000';

// Mensajes iniciales
const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: '¡Hola! 👋 Soy tu asistente de **Litper Pro**.\n\nPuedo ayudarte con reportes, guías, finanzas y más. Escribe `/ayuda` para ver los comandos disponibles o simplemente pregúntame lo que necesites.',
  timestamp: new Date()
};

export function useChat() {
  const [state, setState] = useState<ChatState>({
    messages: [WELCOME_MESSAGE],
    isProcessing: false
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  // API helper
  const api = {
    get: async (url: string, params?: Record<string, any>) => {
      const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
      const response = await fetch(`${API_BASE}${url}${queryString}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    },
    post: async (url: string, data?: any) => {
      const response = await fetch(`${API_BASE}${url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    }
  };

  // Enviar mensaje
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || state.isProcessing) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    // Agregar mensaje del usuario
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isProcessing: true
    }));

    // Mensaje de "pensando"
    const thinkingId = `thinking-${Date.now()}`;
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, {
        id: thinkingId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isLoading: true
      }]
    }));

    try {
      let result: SkillResult;
      const parsed = parseCommand(content);

      if (parsed.isSkill && parsed.skillName) {
        // Ejecutar skill
        const skill = findSkill(parsed.skillName);

        result = await executeSkill(
          parsed.skillName,
          { ...parsed.params, rawArgs: parsed.rawArgs },
          { api, previousMessages: state.messages }
        );

        result.metadata = {
          ...result.metadata,
          skillUsed: parsed.skillName,
          skillIcon: skill?.icon
        };
      } else {
        // Enviar a Claude para respuesta conversacional
        try {
          const aiResponse = await api.post('/chat/preguntar', {
            pregunta: content,
            usar_contexto: true
          });

          result = {
            type: 'text',
            content: aiResponse.respuesta || aiResponse.mensaje || 'No pude procesar tu pregunta.',
            data: aiResponse.sugerencias ? { sugerencias: aiResponse.sugerencias } : undefined
          };
        } catch (error) {
          // Si falla el chat, intentar con el brain
          try {
            const brainResponse = await api.post('/api/brain/think', {
              pregunta: content
            });

            result = {
              type: 'text',
              content: brainResponse.respuesta || brainResponse.pensamiento || 'Lo siento, no pude procesar tu mensaje.'
            };
          } catch {
            result = {
              type: 'text',
              content: 'No pude conectar con el servidor. ¿Está ejecutándose en localhost:8000?\n\nPuedes usar comandos como `/ayuda`, `/dashboard`, `/guias` que funcionan localmente.'
            };
          }
        }
      }

      // Crear mensaje de respuesta
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.content || '',
        timestamp: new Date(),
        data: result.data,
        actions: result.actions,
        skillUsed: result.metadata?.skillUsed
      };

      // Reemplazar mensaje de "pensando" con respuesta
      setState(prev => ({
        ...prev,
        messages: prev.messages.filter(m => m.id !== thinkingId).concat(assistantMessage),
        isProcessing: false
      }));

    } catch (error: any) {
      // Error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `❌ Error: ${error.message || 'Ocurrió un error inesperado'}`,
        timestamp: new Date(),
        error: true
      };

      setState(prev => ({
        ...prev,
        messages: prev.messages.filter(m => m.id !== thinkingId).concat(errorMessage),
        isProcessing: false
      }));
    }
  }, [state.isProcessing, state.messages]);

  // Ejecutar acción de botón
  const executeAction = useCallback(async (action: string, params?: Record<string, any>) => {
    switch (action) {
      case 'execute_skill':
        if (params?.skill) {
          const command = `/${params.skill}${params.args ? ' ' + params.args : ''}`;
          await sendMessage(command);
        }
        break;

      case 'exportar':
        await sendMessage(`/exportar ${params?.formato || 'excel'} ${params?.tipo || ''}`);
        break;

      case 'enviar':
        await sendMessage(`/enviar ${params?.tipo || 'whatsapp'} ${params?.destino || ''}`);
        break;

      case 'download':
        if (params?.url) {
          window.open(params.url, '_blank');
        }
        break;

      case 'tracking':
        if (params?.guia) {
          await sendMessage(`/tracking ${params.guia}`);
        }
        break;

      default:
        console.log('Acción no implementada:', action, params);
        // Agregar mensaje informativo
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, {
            id: `info-${Date.now()}`,
            role: 'assistant',
            content: `ℹ️ Acción "${action}" en desarrollo.`,
            timestamp: new Date()
          }]
        }));
    }
  }, [sendMessage]);

  // Limpiar chat
  const clearChat = useCallback(() => {
    setState({
      messages: [WELCOME_MESSAGE],
      isProcessing: false
    });
  }, []);

  // Obtener sugerencias de comandos
  const getSuggestions = useCallback((input: string): string[] => {
    if (!input.startsWith('/')) return [];

    const partial = input.slice(1).toLowerCase();
    const suggestions: string[] = [];

    for (const skill of Object.values(SKILLS)) {
      if (skill.name.startsWith(partial)) {
        suggestions.push(`/${skill.name}`);
      }
      for (const alias of skill.aliases || []) {
        if (alias.startsWith(partial)) {
          suggestions.push(`/${alias}`);
        }
      }
    }

    return suggestions.slice(0, 5);
  }, []);

  return {
    messages: state.messages,
    isProcessing: state.isProcessing,
    sendMessage,
    executeAction,
    clearChat,
    getSuggestions,
    messagesEndRef
  };
}
