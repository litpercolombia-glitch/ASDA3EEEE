// /api/chat/ops.ts
// Endpoint para chat operativo interno

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import {
  CHAT_CONFIGS,
  getOrCreateThread,
  addMessageToThread,
  prepareMessagesForLLM,
  generateChatContext,
} from '../../src/core/chats/chatRouter';

/**
 * POST /api/chat/ops
 * Chat operativo para el equipo interno
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      ok: false,
      error: 'Method not allowed',
    });
  }

  try {
    // 1. Validar payload
    const { message, threadId, context } = req.body as {
      message: string;
      threadId?: string;
      context?: Record<string, unknown>;
    };

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        ok: false,
        error: 'Missing message field',
      });
    }

    // 2. Verificar API key (soporta ambos formatos: con y sin VITE_)
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('[Chat OPS] Missing ANTHROPIC_API_KEY');
      return res.status(500).json({
        ok: false,
        error: 'AI service not configured',
      });
    }

    // 3. Obtener o crear thread
    const actualThreadId = threadId ?? `ops_${Date.now()}`;
    const thread = getOrCreateThread(actualThreadId, 'ops');

    // 4. Agregar mensaje del usuario
    addMessageToThread(actualThreadId, {
      role: 'user',
      content: message,
      metadata: context,
    });

    // 5. Generar contexto adicional
    const chatContext = await generateChatContext('ops', actualThreadId);
    const fullContext = context
      ? `${chatContext}\n\nContexto de sesión:\n${JSON.stringify(context, null, 2)}`
      : chatContext;

    // 6. Preparar mensajes para Claude
    const messages = prepareMessagesForLLM(thread, fullContext);
    const config = CHAT_CONFIGS.ops;

    // 7. Llamar a Claude
    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: config.model,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      system: messages.find(m => m.role === 'system')?.content ?? '',
      messages: messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
    });

    // 8. Extraer respuesta
    const assistantMessage = response.content
      .filter(block => block.type === 'text')
      .map(block => (block as { type: 'text'; text: string }).text)
      .join('\n');

    // 9. Guardar respuesta en thread
    addMessageToThread(actualThreadId, {
      role: 'assistant',
      content: assistantMessage,
    });

    // 10. Responder
    return res.status(200).json({
      ok: true,
      threadId: actualThreadId,
      message: assistantMessage,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    });

  } catch (error) {
    console.error('[Chat OPS] Error:', error);

    // Detectar errores específicos de Anthropic
    if (error instanceof Anthropic.APIError) {
      return res.status(error.status ?? 500).json({
        ok: false,
        error: 'AI service error',
        message: error.message,
      });
    }

    return res.status(500).json({
      ok: false,
      error: 'Internal error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Configuración de Vercel
 */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100kb',
    },
  },
  // Aumentar timeout para respuestas de LLM
  maxDuration: 30,
};
