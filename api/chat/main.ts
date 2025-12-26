// /api/chat/main.ts
// Endpoint para el Chat Principal de Litper Pro AI
// Usa tablas reales: guias, cargas, alertas, ciudades_stats

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import {
  CHAT_CONFIGS,
  getOrCreateThread,
  addMessageToThread,
} from '../../src/core/chats/chatRouter';

import mainSystemPrompt from '../../src/core/chats/prompts/main.system.md?raw';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Obtiene contexto real de Supabase usando el esquema de Litper Pro
 */
async function getRealContext(): Promise<string> {
  if (!supabaseUrl || !supabaseKey) {
    return 'Base de datos no configurada.';
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const contextParts: string[] = [];

  try {
    // 1. Métricas de guías
    const { data: guias } = await supabase
      .from('guias')
      .select('estado, transportadora, ciudad_destino, valor_declarado, tiene_novedad, dias_transito')
      .order('fecha_actualizacion', { ascending: false })
      .limit(200);

    if (guias && guias.length > 0) {
      const byEstado: Record<string, number> = {};
      const byTransportadora: Record<string, number> = {};
      let totalValor = 0;
      let conNovedad = 0;

      guias.forEach(g => {
        byEstado[g.estado] = (byEstado[g.estado] || 0) + 1;
        byTransportadora[g.transportadora] = (byTransportadora[g.transportadora] || 0) + 1;
        totalValor += g.valor_declarado || 0;
        if (g.tiene_novedad) conNovedad++;
      });

      const entregadas = byEstado['Entregado'] || byEstado['ENTREGADO'] || 0;
      const devueltas = byEstado['Devolucion'] || byEstado['DEVOLUCION'] || byEstado['Rechazado'] || 0;
      const total = guias.length;

      contextParts.push(`### Guías (${total} recientes)`);
      contextParts.push(`- ✅ Entregadas: ${entregadas} (${Math.round((entregadas/total)*100)}%)`);
      contextParts.push(`- 🔄 Devueltas: ${devueltas} (${Math.round((devueltas/total)*100)}%)`);
      contextParts.push(`- ⚠️ Con novedad: ${conNovedad}`);
      contextParts.push(`- 💰 Valor total: $${totalValor.toLocaleString('es-CO')} COP`);

      contextParts.push(`\nPor estado:`);
      Object.entries(byEstado)
        .sort((a, b) => b[1] - a[1])
        .forEach(([estado, count]) => {
          contextParts.push(`- ${estado}: ${count}`);
        });

      contextParts.push(`\nPor transportadora:`);
      Object.entries(byTransportadora)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([trans, count]) => {
          contextParts.push(`- ${trans}: ${count}`);
        });
    }

    // 2. Cargas activas
    const { data: cargas } = await supabase
      .from('cargas')
      .select('*')
      .eq('estado', 'activa')
      .order('created_at', { ascending: false })
      .limit(5);

    if (cargas && cargas.length > 0) {
      contextParts.push(`\n### Cargas Activas (${cargas.length})`);
      cargas.forEach(c => {
        contextParts.push(`- ${c.nombre}: ${c.total_guias} guías, ${c.porcentaje_entrega}% entregado`);
      });
    }

    // 3. Alertas no leídas
    const { data: alertas } = await supabase
      .from('alertas')
      .select('tipo, titulo, mensaje')
      .eq('leida', false)
      .order('created_at', { ascending: false })
      .limit(10);

    if (alertas && alertas.length > 0) {
      contextParts.push(`\n### Alertas Sin Leer (${alertas.length})`);
      alertas.forEach(a => {
        const icon = a.tipo === 'error' ? '🔴' : a.tipo === 'warning' ? '🟠' : '🟡';
        contextParts.push(`${icon} ${a.titulo}`);
      });
    }

    // 4. Ciudades problemáticas
    const { data: ciudades } = await supabase
      .from('ciudades_stats')
      .select('ciudad, tasa_entrega, tasa_devolucion, status')
      .or('status.eq.rojo,status.eq.amarillo')
      .order('tasa_devolucion', { ascending: false })
      .limit(5);

    if (ciudades && ciudades.length > 0) {
      contextParts.push(`\n### Ciudades con Problemas`);
      ciudades.forEach(c => {
        const icon = c.status === 'rojo' ? '🔴' : '🟡';
        contextParts.push(`${icon} ${c.ciudad}: ${c.tasa_entrega}% entrega, ${c.tasa_devolucion}% devolución`);
      });
    }

    // 5. Guías con novedad recientes
    const { data: novedades } = await supabase
      .from('guias')
      .select('numero_guia, estado, transportadora, ciudad_destino, tipo_novedad')
      .eq('tiene_novedad', true)
      .order('fecha_actualizacion', { ascending: false })
      .limit(5);

    if (novedades && novedades.length > 0) {
      contextParts.push(`\n### Guías con Novedad Recientes`);
      novedades.forEach(g => {
        contextParts.push(`- ${g.numero_guia}: ${g.tipo_novedad || g.estado} (${g.transportadora}, ${g.ciudad_destino})`);
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

  // Detectar número de guía
  const guidePatterns = [
    /gu[ií]a\s*[#:]?\s*(\w{6,})/i,
    /guide\s*[#:]?\s*(\w{6,})/i,
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

  const { data: guia } = await supabase
    .from('guias')
    .select('*')
    .ilike('numero_guia', `%${guideNumber}%`)
    .single();

  if (!guia) return null;

  return `
### Información de Guía ${guia.numero_guia}
- **Estado**: ${guia.estado} ${guia.estado_detalle ? `(${guia.estado_detalle})` : ''}
- **Transportadora**: ${guia.transportadora}
- **Destino**: ${guia.ciudad_destino}, ${guia.departamento || 'N/A'}
- **Cliente**: ${guia.nombre_cliente || 'N/A'}
- **Teléfono**: ${guia.telefono || 'N/A'}
- **Dirección**: ${guia.direccion || 'N/A'}
- **Valor**: $${guia.valor_declarado?.toLocaleString('es-CO') || 0} COP
- **Días en tránsito**: ${guia.dias_transito}
- **Tiene novedad**: ${guia.tiene_novedad ? `Sí - ${guia.tipo_novedad}` : 'No'}
${guia.descripcion_novedad ? `- **Novedad**: ${guia.descripcion_novedad}` : ''}
- **Creada**: ${new Date(guia.fecha_creacion).toLocaleDateString('es-CO')}
- **Actualizada**: ${new Date(guia.fecha_actualizacion).toLocaleString('es-CO')}
${guia.fecha_entrega ? `- **Entregada**: ${new Date(guia.fecha_entrega).toLocaleString('es-CO')}` : ''}`;
}

/**
 * POST /api/chat/main
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

    // Construir contexto
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
