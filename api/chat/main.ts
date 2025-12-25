// /api/chat/main.ts
// Endpoint para el Chat Principal de Litper Pro AI
// Combina capacidades operativas y estratégicas + datos reales de Supabase

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import {
  CHAT_CONFIGS,
  getOrCreateThread,
  addMessageToThread,
} from '../../src/core/chats/chatRouter';

// Importar prompt principal
import mainSystemPrompt from '../../src/core/chats/prompts/main.system.md?raw';

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Obtiene contexto real de Supabase
 */
async function getRealContext(): Promise<string> {
  if (!supabaseUrl || !supabaseKey) {
    return 'Base de datos no configurada.';
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const contextParts: string[] = [];

  try {
    // 1. Métricas de órdenes
    const { data: orders } = await supabase
      .from('orders')
      .select('status, risk_score, payment_method, total_amount, shipping_city');

    if (orders && orders.length > 0) {
      const ordersByStatus: Record<string, number> = {};
      let totalGMV = 0;
      let highRiskOrders = 0;

      orders.forEach(o => {
        ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
        totalGMV += o.total_amount || 0;
        if (o.risk_score >= 60) highRiskOrders++;
      });

      contextParts.push(`### Órdenes (${orders.length} total)`);
      Object.entries(ordersByStatus).forEach(([status, count]) => {
        contextParts.push(`- ${status}: ${count}`);
      });
      contextParts.push(`- GMV Total: $${totalGMV.toLocaleString('es-CO')} COP`);
      if (highRiskOrders > 0) {
        contextParts.push(`- ⚠️ Alto riesgo: ${highRiskOrders}`);
      }
    }

    // 2. Métricas de shipments
    const { data: shipments } = await supabase
      .from('shipments')
      .select('status, carrier, risk_score, city, guide_number')
      .order('updated_at', { ascending: false })
      .limit(100);

    if (shipments && shipments.length > 0) {
      const byStatus: Record<string, number> = {};
      const byCarrier: Record<string, number> = {};
      let highRisk = 0;

      shipments.forEach(s => {
        byStatus[s.status] = (byStatus[s.status] || 0) + 1;
        byCarrier[s.carrier] = (byCarrier[s.carrier] || 0) + 1;
        if (s.risk_score >= 60) highRisk++;
      });

      const delivered = byStatus['delivered'] || 0;
      const returned = byStatus['returned'] || 0;
      const issues = byStatus['issue'] || 0;
      const total = shipments.length;

      contextParts.push(`\n### Envíos (${total} recientes)`);
      contextParts.push(`- ✅ Entregados: ${delivered} (${Math.round((delivered/total)*100)}%)`);
      contextParts.push(`- 🔄 Devoluciones: ${returned} (${Math.round((returned/total)*100)}%)`);
      contextParts.push(`- ⚠️ Con novedad: ${issues}`);

      if (highRisk > 0) {
        contextParts.push(`- 🚨 Alto riesgo: ${highRisk}`);
      }

      contextParts.push(`\nPor transportadora:`);
      Object.entries(byCarrier)
        .sort((a, b) => b[1] - a[1])
        .forEach(([carrier, count]) => {
          contextParts.push(`- ${carrier}: ${count}`);
        });
    }

    // 3. Alertas activas
    const { data: alerts } = await supabase
      .from('alerts')
      .select('type, priority, message')
      .eq('resolved', false)
      .order('created_at', { ascending: false })
      .limit(10);

    if (alerts && alerts.length > 0) {
      contextParts.push(`\n### Alertas Activas (${alerts.length})`);
      alerts.forEach(a => {
        const icon = a.priority === 'critical' ? '🔴' : a.priority === 'high' ? '🟠' : '🟡';
        contextParts.push(`${icon} [${a.type}] ${a.message?.substring(0, 80) || 'Sin mensaje'}`);
      });
    }

    // 4. Últimos shipments con problemas
    const { data: problemShipments } = await supabase
      .from('shipments')
      .select('guide_number, status, carrier, city')
      .in('status', ['issue', 'returned', 'lost'])
      .order('updated_at', { ascending: false })
      .limit(5);

    if (problemShipments && problemShipments.length > 0) {
      contextParts.push(`\n### Envíos Problemáticos Recientes`);
      problemShipments.forEach(s => {
        contextParts.push(`- Guía ${s.guide_number}: ${s.status} (${s.carrier}, ${s.city})`);
      });
    }

    return contextParts.join('\n');
  } catch (error) {
    console.error('[Context] Error fetching data:', error);
    return 'Error obteniendo datos de la base de datos.';
  }
}

/**
 * Busca guía específica si el mensaje lo menciona
 */
async function searchGuide(message: string): Promise<string | null> {
  if (!supabaseUrl || !supabaseKey) return null;

  // Detectar número de guía en el mensaje
  const guidePatterns = [
    /gu[ií]a\s*[#:]?\s*(\d{6,})/i,
    /guide\s*[#:]?\s*(\d{6,})/i,
    /(\d{10,})/,
  ];

  let guideNumber: string | null = null;
  for (const pattern of guidePatterns) {
    const match = message.match(pattern);
    if (match) {
      guideNumber = match[1];
      break;
    }
  }

  if (!guideNumber) return null;

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: shipment } = await supabase
    .from('shipments')
    .select(`
      *,
      orders (
        external_id,
        customer_name,
        customer_phone,
        shipping_address,
        total_amount,
        payment_method
      )
    `)
    .ilike('guide_number', `%${guideNumber}%`)
    .single();

  if (!shipment) return null;

  const order = shipment.orders as any;

  return `
### Información de Guía ${shipment.guide_number}
- **Estado**: ${shipment.status} ${shipment.status_detail ? `(${shipment.status_detail})` : ''}
- **Transportadora**: ${shipment.carrier}
- **Ciudad**: ${shipment.city}, ${shipment.department}
- **Riesgo**: ${shipment.risk_score}/100
- **Creada**: ${new Date(shipment.created_at).toLocaleDateString('es-CO')}
- **Actualizada**: ${new Date(shipment.updated_at).toLocaleString('es-CO')}
${shipment.delivered_at ? `- **Entregada**: ${new Date(shipment.delivered_at).toLocaleString('es-CO')}` : ''}
${order ? `
**Orden Asociada**:
- ID: ${order.external_id}
- Cliente: ${order.customer_name || 'N/A'}
- Teléfono: ${order.customer_phone || 'N/A'}
- Dirección: ${order.shipping_address || 'N/A'}
- Total: $${order.total_amount?.toLocaleString('es-CO') || 0} COP
- Pago: ${order.payment_method === 'cod' ? 'Contra entrega' : 'Prepago'}
` : ''}`;
}

/**
 * POST /api/chat/main
 * Chat Principal de Litper Pro - Operaciones + Estrategia
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { message, threadId } = req.body as {
      message: string;
      threadId?: string;
    };

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ ok: false, error: 'Missing message field' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ ok: false, error: 'AI service not configured' });
    }

    const actualThreadId = threadId ?? `main_${Date.now()}`;
    const thread = getOrCreateThread(actualThreadId, 'main');

    addMessageToThread(actualThreadId, { role: 'user', content: message });

    // Obtener contexto real de Supabase
    const [realContext, guideInfo] = await Promise.all([
      getRealContext(),
      searchGuide(message),
    ]);

    // Construir contexto completo
    const contextParts: string[] = [];
    contextParts.push(`Fecha/Hora: ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`);

    if (guideInfo) {
      contextParts.push(guideInfo);
    }

    contextParts.push('\n## Datos del Sistema');
    contextParts.push(realContext);

    const fullContext = contextParts.join('\n');
    const config = CHAT_CONFIGS.main;
    const systemContent = mainSystemPrompt + `\n\n## Contexto Actual\n${fullContext}`;

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

    const assistantMessage = response.content
      .filter(block => block.type === 'text')
      .map(block => (block as { type: 'text'; text: string }).text)
      .join('\n');

    addMessageToThread(actualThreadId, { role: 'assistant', content: assistantMessage });

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

export const config = {
  api: { bodyParser: { sizeLimit: '100kb' } },
  maxDuration: 60,
};
