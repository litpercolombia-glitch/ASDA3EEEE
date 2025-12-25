// /api/chat/main.ts
// Endpoint para el Chat Principal de Litper Pro AI
// Combina capacidades operativas y estratégicas

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import {
  CHAT_CONFIGS,
  getOrCreateThread,
  addMessageToThread,
  prepareMessagesForLLM,
} from '../../src/core/chats/chatRouter';

// Importar prompt principal directamente (por si chatRouter tiene problemas con imports)
import mainSystemPrompt from '../../src/core/chats/prompts/main.system.md?raw';

/**
 * POST /api/chat/main
 * Chat Principal de Litper Pro - Operaciones + Estrategia
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
      context?: {
        shipments?: Array<{
          id: string;
          guide: string;
          status: string;
          carrier: string;
          city: string;
          risk?: number;
        }>;
        alerts?: Array<{
          type: string;
          message: string;
          priority: string;
        }>;
        metrics?: {
          totalOrders?: number;
          deliveredRate?: number;
          returnRate?: number;
          avgDeliveryTime?: number;
        };
        [key: string]: unknown;
      };
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
      console.error('[Chat Main] Missing ANTHROPIC_API_KEY');
      return res.status(500).json({
        ok: false,
        error: 'AI service not configured',
      });
    }

    // 3. Obtener o crear thread
    const actualThreadId = threadId ?? `main_${Date.now()}`;
    const thread = getOrCreateThread(actualThreadId, 'main');

    // 4. Agregar mensaje del usuario
    addMessageToThread(actualThreadId, {
      role: 'user',
      content: message,
    });

    // 5. Generar contexto dinámico con datos de shipments
    const contextParts: string[] = [];
    contextParts.push(`Fecha/Hora: ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`);
    contextParts.push(`Thread ID: ${actualThreadId}`);

    if (context?.shipments && context.shipments.length > 0) {
      contextParts.push('\n### Envíos Activos');
      contextParts.push(`Total: ${context.shipments.length}`);

      // Resumen por estado
      const byStatus: Record<string, number> = {};
      const byCarrier: Record<string, number> = {};
      let highRiskCount = 0;

      context.shipments.forEach(s => {
        byStatus[s.status] = (byStatus[s.status] || 0) + 1;
        byCarrier[s.carrier] = (byCarrier[s.carrier] || 0) + 1;
        if (s.risk && s.risk >= 60) highRiskCount++;
      });

      contextParts.push('\nPor estado:');
      Object.entries(byStatus).forEach(([status, count]) => {
        contextParts.push(`- ${status}: ${count}`);
      });

      contextParts.push('\nPor transportadora:');
      Object.entries(byCarrier).forEach(([carrier, count]) => {
        contextParts.push(`- ${carrier}: ${count}`);
      });

      if (highRiskCount > 0) {
        contextParts.push(`\n⚠️ Envíos alto riesgo: ${highRiskCount}`);
      }
    }

    if (context?.alerts && context.alerts.length > 0) {
      contextParts.push('\n### Alertas Activas');
      context.alerts.forEach(alert => {
        contextParts.push(`- [${alert.priority}] ${alert.type}: ${alert.message}`);
      });
    }

    if (context?.metrics) {
      contextParts.push('\n### Métricas Actuales');
      if (context.metrics.totalOrders) {
        contextParts.push(`- Total órdenes: ${context.metrics.totalOrders}`);
      }
      if (context.metrics.deliveredRate) {
        contextParts.push(`- Tasa entrega: ${context.metrics.deliveredRate}%`);
      }
      if (context.metrics.returnRate) {
        contextParts.push(`- Tasa devolución: ${context.metrics.returnRate}%`);
      }
      if (context.metrics.avgDeliveryTime) {
        contextParts.push(`- Tiempo promedio: ${context.metrics.avgDeliveryTime} días`);
      }
    }

    const fullContext = contextParts.join('\n');

    // 6. Preparar mensajes para Claude
    const config = CHAT_CONFIGS.main;
    const systemContent = mainSystemPrompt + `\n\n## Contexto Actual\n${fullContext}`;

    // 7. Llamar a Claude
    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: config.model,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      system: systemContent,
      messages: thread.messages
        .filter(m => m.role !== 'system')
        .slice(-config.contextWindow)
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
    console.error('[Chat Main] Error:', error);

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
  maxDuration: 60, // Más tiempo para análisis complejos
};
