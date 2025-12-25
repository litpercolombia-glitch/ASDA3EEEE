// /api/chat/chatea.ts
// Endpoint para chat de control de Chatea Pro (WhatsApp)

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import {
  CHAT_CONFIGS,
  getOrCreateThread,
  addMessageToThread,
  prepareMessagesForLLM,
} from '../../src/core/chats/chatRouter';

// Importar prompt de Chatea
import chateaSystemPrompt from '../../src/core/chats/prompts/chatea.system.md?raw';

/**
 * POST /api/chat/chatea
 * Chat para control de Chatea Pro (WhatsApp)
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

    // 2. Verificar API key (soporta ambos formatos)
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('[Chat Chatea] Missing ANTHROPIC_API_KEY');
      return res.status(500).json({
        ok: false,
        error: 'AI service not configured',
      });
    }

    // 3. Verificar API key de Chatea (para acciones reales)
    const chateaApiKey = process.env.CHATEA_API_KEY || process.env.VITE_CHATEAPRO_API_KEY;
    const chateaConfigured = !!chateaApiKey;

    // 4. Obtener o crear thread
    const actualThreadId = threadId ?? `chatea_${Date.now()}`;

    // Crear thread manualmente ya que 'chatea' no está en CHAT_CONFIGS
    const thread = {
      id: actualThreadId,
      type: 'chatea' as const,
      messages: [] as Array<{ role: 'user' | 'assistant' | 'system'; content: string; timestamp?: string }>,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 5. Agregar mensaje del usuario
    thread.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    });

    // 6. Generar contexto
    const fullContext = `
Fecha/Hora: ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}
Thread ID: ${actualThreadId}
Chatea API configurada: ${chateaConfigured ? 'Sí' : 'No (modo simulación)'}
${context ? `\nContexto adicional:\n${JSON.stringify(context, null, 2)}` : ''}
    `.trim();

    // 7. Preparar mensajes para Claude
    const systemContent = chateaSystemPrompt + `\n\n## Contexto Actual\n${fullContext}`;

    // 8. Llamar a Claude
    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022', // Rápido para operaciones
      max_tokens: 1024,
      temperature: 0.3,
      system: systemContent,
      messages: thread.messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
    });

    // 9. Extraer respuesta
    const assistantMessage = response.content
      .filter(block => block.type === 'text')
      .map(block => (block as { type: 'text'; text: string }).text)
      .join('\n');

    // 10. Responder
    return res.status(200).json({
      ok: true,
      threadId: actualThreadId,
      message: assistantMessage,
      chateaConfigured,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    });

  } catch (error) {
    console.error('[Chat Chatea] Error:', error);

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
  maxDuration: 30,
};
