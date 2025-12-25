// /api/chat/strategy.ts
// Endpoint para chat estratégico/analítico

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
 * POST /api/chat/strategy
 * Chat estratégico para análisis y decisiones
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
    const { message, threadId, context, includeMetrics } = req.body as {
      message: string;
      threadId?: string;
      context?: Record<string, unknown>;
      includeMetrics?: boolean;
    };

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        ok: false,
        error: 'Missing message field',
      });
    }

    // 2. Verificar API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('[Chat Strategy] Missing ANTHROPIC_API_KEY');
      return res.status(500).json({
        ok: false,
        error: 'AI service not configured',
      });
    }

    // 3. Obtener o crear thread
    const actualThreadId = threadId ?? `strategy_${Date.now()}`;
    const thread = getOrCreateThread(actualThreadId, 'strategy');

    // 4. Agregar mensaje del usuario
    addMessageToThread(actualThreadId, {
      role: 'user',
      content: message,
      metadata: context,
    });

    // 5. Generar contexto adicional (más rico para strategy)
    let chatContext = await generateChatContext('strategy', actualThreadId);

    // Incluir métricas si se solicitan
    if (includeMetrics) {
      const metrics = await fetchCurrentMetrics();
      chatContext += `\n\n## Métricas Actuales\n${metrics}`;
    }

    const fullContext = context
      ? `${chatContext}\n\nContexto de sesión:\n${JSON.stringify(context, null, 2)}`
      : chatContext;

    // 6. Preparar mensajes para Claude
    const messages = prepareMessagesForLLM(thread, fullContext);
    const config = CHAT_CONFIGS.strategy;

    // 7. Llamar a Claude (modelo más potente para estrategia)
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
      model: config.model,
    });

  } catch (error) {
    console.error('[Chat Strategy] Error:', error);

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
 * Obtiene métricas actuales para contexto
 * TODO: Implementar con datos reales de Supabase
 */
async function fetchCurrentMetrics(): Promise<string> {
  // TODO: Conectar con base de datos real

  // Por ahora, retornar placeholder
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  return `
Período: ${monthStart.toLocaleDateString('es-CO')} - ${now.toLocaleDateString('es-CO')}
- Total órdenes procesadas: [pendiente conexión DB]
- Tasa de entrega: [pendiente]
- Tiempo promedio: [pendiente]
- Top ciudades: [pendiente]
- Top transportadoras: [pendiente]

Nota: Métricas en tiempo real pendientes de configuración de base de datos.
  `.trim();
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
  // Mayor timeout para análisis complejos
  maxDuration: 60,
};
