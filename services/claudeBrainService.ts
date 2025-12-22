/**
 * Claude Brain Service - Servicio frontend para el cerebro autónomo
 * Permite interactuar con el cerebro desde la UI de React
 */

import Anthropic from '@anthropic-ai/sdk';
import { API_CONFIG } from '../config/constants';

// =============================================================================
// TYPES
// =============================================================================

export interface BrainResponse {
  decision: string;
  confidence: number;
  reasoning: string;
  actions: string[];
  priority?: 'low' | 'medium' | 'high' | 'critical';
  alternatives?: string[];
  risks?: string[];
}

export interface ShipmentAnalysis {
  guia: string;
  riesgo: number;
  problemas_potenciales: string[];
  recomendaciones: string[];
  prioridad: 'low' | 'medium' | 'high' | 'critical';
}

export interface BrainStatus {
  state: string;
  metrics: {
    events_processed: number;
    decisions_made: number;
    actions_executed: number;
    avg_decision_time_ms: number;
    uptime_hours: number;
  };
  queue_size: number;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// =============================================================================
// CLAUDE BRAIN SERVICE
// =============================================================================

class ClaudeBrainService {
  private client: Anthropic;
  private conversationHistory: ChatMessage[] = [];
  private isInitialized: boolean = false;

  constructor() {
    try {
      this.client = new Anthropic({
        apiKey: API_CONFIG.CLAUDE_API_KEY,
        dangerouslyAllowBrowser: true,
      });
      this.isInitialized = true;
    } catch (error) {
      console.error('Error inicializando Claude Brain:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Verifica si el servicio está disponible
   */
  isAvailable(): boolean {
    return this.isInitialized && !!API_CONFIG.CLAUDE_API_KEY;
  }

  /**
   * System prompt del cerebro autónomo
   */
  private getBrainSystemPrompt(): string {
    return `Eres el Cerebro Autónomo de Litper Pro, un sistema de logística para Colombia.

CAPACIDADES:
- Analizar envíos y predecir problemas
- Tomar decisiones sobre retrasos y novedades
- Generar mensajes personalizados para clientes
- Recomendar acciones para el equipo de operaciones

CONTEXTO DE NEGOCIO:
- Transportadoras: Coordinadora, Servientrega, TCC, Envía, Inter Rapidísimo
- Ciudades principales: Bogotá, Medellín, Cali, Barranquilla, Cartagena
- Umbral de retraso: Bogotá 4 días, Medellín 5 días, otras ciudades 6-7 días

FORMATO DE RESPUESTA (JSON):
{
  "decision": "acción recomendada",
  "confidence": 0-100,
  "reasoning": "explicación",
  "actions": ["acción1", "acción2"],
  "priority": "low|medium|high|critical"
}

Responde SIEMPRE en español colombiano profesional.`;
  }

  /**
   * Consulta al cerebro autónomo
   */
  async askBrain(
    question: string,
    context?: Record<string, unknown>
  ): Promise<BrainResponse> {
    if (!this.isAvailable()) {
      throw new Error('Claude Brain no está disponible');
    }

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: this.getBrainSystemPrompt(),
        messages: [
          ...this.conversationHistory,
          {
            role: 'user',
            content: context
              ? `Contexto: ${JSON.stringify(context)}\n\nPregunta: ${question}`
              : question,
          },
        ],
      });

      const text =
        response.content[0].type === 'text' ? response.content[0].text : '';

      // Guardar en historial
      this.conversationHistory.push(
        { role: 'user', content: question },
        { role: 'assistant', content: text }
      );

      // Limitar historial
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }

      // Parsear respuesta
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch {
        // Si no es JSON, crear estructura
      }

      return {
        decision: text,
        confidence: 80,
        reasoning: 'Respuesta directa del cerebro',
        actions: [],
      };
    } catch (error) {
      console.error('Error en askBrain:', error);
      throw error;
    }
  }

  /**
   * Streaming de respuestas para UI en tiempo real
   */
  async *streamResponse(question: string): AsyncGenerator<string> {
    if (!this.isAvailable()) {
      throw new Error('Claude Brain no está disponible');
    }

    const stream = await this.client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: this.getBrainSystemPrompt(),
      messages: [{ role: 'user', content: question }],
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield event.delta.text;
      }
    }
  }

  /**
   * Analiza un envío con el cerebro
   */
  async analyzeShipment(
    shipmentData: Record<string, unknown>
  ): Promise<BrainResponse> {
    return this.askBrain(
      '¿Cuál es el estado y riesgo de este envío? ¿Qué acciones recomiendas?',
      { shipment: shipmentData }
    );
  }

  /**
   * Predice problemas potenciales en múltiples envíos
   */
  async predictIssues(
    shipments: Record<string, unknown>[]
  ): Promise<ShipmentAnalysis[]> {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: `Eres un experto en logística colombiana.
Analiza estos envíos y predice cuáles tendrán problemas.
Responde SOLO con un array JSON: [{guia, riesgo: 0-100, problemas_potenciales: [], recomendaciones: [], prioridad: "low"|"medium"|"high"|"critical"}]`,
        messages: [
          {
            role: 'user',
            content: JSON.stringify(shipments),
          },
        ],
      });

      const text =
        response.content[0].type === 'text' ? response.content[0].text : '[]';

      try {
        const arrayMatch = text.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          return JSON.parse(arrayMatch[0]);
        }
      } catch {
        console.error('Error parsing predictions');
      }

      return [];
    } catch (error) {
      console.error('Error en predictIssues:', error);
      return [];
    }
  }

  /**
   * Genera mensaje personalizado para cliente
   */
  async generateCustomerMessage(
    customerName: string,
    situation: string,
    tone: 'formal' | 'friendly' | 'urgent' = 'friendly'
  ): Promise<string> {
    if (!this.isAvailable()) {
      return '';
    }

    try {
      const response = await this.client.messages.create({
        model: 'claude-3-5-haiku-20241022', // Haiku para rapidez
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: `Genera un mensaje de WhatsApp para ${customerName}.
Situación: ${situation}
Tono: ${tone}
Idioma: Español colombiano
Máximo 3 párrafos cortos.
NO incluyas saludos formales extensos, sé directo y amigable.`,
          },
        ],
      });

      return response.content[0].type === 'text'
        ? response.content[0].text
        : '';
    } catch (error) {
      console.error('Error generando mensaje:', error);
      return '';
    }
  }

  /**
   * Analiza una imagen de evidencia
   */
  async analyzeEvidenceImage(
    imageBase64: string,
    prompt: string = 'Analiza esta imagen de evidencia de entrega. Describe el estado del paquete y si hay daños visibles.'
  ): Promise<string> {
    if (!this.isAvailable()) {
      return '';
    }

    try {
      // Extraer datos base64
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64Data,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      });

      return response.content[0].type === 'text'
        ? response.content[0].text
        : '';
    } catch (error) {
      console.error('Error analizando imagen:', error);
      return '';
    }
  }

  /**
   * Obtiene recomendaciones para un problema específico
   */
  async getRecommendations(
    problem: string,
    context?: Record<string, unknown>
  ): Promise<string[]> {
    const response = await this.askBrain(
      `¿Qué recomiendas para este problema? ${problem}`,
      context
    );
    return response.actions || [];
  }

  /**
   * Clasifica la urgencia de un caso
   */
  async classifyUrgency(
    caseData: Record<string, unknown>
  ): Promise<'low' | 'medium' | 'high' | 'critical'> {
    const response = await this.askBrain(
      '¿Cuál es la urgencia de este caso?',
      caseData
    );
    return response.priority || 'medium';
  }

  /**
   * Genera resumen diario
   */
  async generateDailySummary(
    data: Record<string, unknown>
  ): Promise<string> {
    if (!this.isAvailable()) {
      return '';
    }

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: `Genera un resumen ejecutivo del día basado en estos datos:
${JSON.stringify(data, null, 2)}

Incluye:
1. Métricas principales
2. Problemas detectados
3. Acciones tomadas
4. Recomendaciones para mañana

Formato: Texto estructurado para un reporte.`,
          },
        ],
      });

      return response.content[0].type === 'text'
        ? response.content[0].text
        : '';
    } catch (error) {
      console.error('Error generando resumen:', error);
      return '';
    }
  }

  /**
   * Limpia el historial de conversación
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Obtiene el historial de conversación
   */
  getHistory(): ChatMessage[] {
    return [...this.conversationHistory];
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const claudeBrain = new ClaudeBrainService();
export default claudeBrain;

// =============================================================================
// HOOKS HELPER
// =============================================================================

/**
 * Hook helper para usar el cerebro en componentes
 * Usage: const { ask, isLoading } = useClaudeBrain();
 */
export function createBrainHelpers() {
  let isLoading = false;

  return {
    async ask(question: string, context?: Record<string, unknown>) {
      isLoading = true;
      try {
        return await claudeBrain.askBrain(question, context);
      } finally {
        isLoading = false;
      }
    },
    isLoading: () => isLoading,
    isAvailable: () => claudeBrain.isAvailable(),
  };
}
