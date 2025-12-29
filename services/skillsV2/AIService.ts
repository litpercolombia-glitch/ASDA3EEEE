/**
 * AIService - Servicio unificado de IA
 * Integra Claude y Gemini para respuestas inteligentes
 */

import Anthropic from '@anthropic-ai/sdk';

// ============================================
// TYPES
// ============================================

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  model: string;
  tokens?: {
    input: number;
    output: number;
  };
  skillSuggestion?: {
    skillId: string;
    confidence: number;
    params: Record<string, any>;
  };
}

export interface AIConfig {
  model?: 'claude' | 'gemini' | 'auto';
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

// ============================================
// CONFIGURATION
// ============================================

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// ============================================
// SYSTEM PROMPT
// ============================================

const DEFAULT_SYSTEM_PROMPT = `Eres el Asistente de LitperPro, un sistema inteligente de gestion logistica para Colombia.

Tu rol es:
1. Ayudar a los usuarios a gestionar sus envios y guias
2. Analizar datos de logistica y finanzas
3. Detectar problemas y ofrecer soluciones
4. Ejecutar skills especializados cuando sea necesario

SKILLS DISPONIBLES:
- track-shipment: Rastrear guias por numero
- bulk-status-update: Actualizar estados masivamente
- generate-report: Generar reportes de entregas
- analyze-carrier: Analizar rendimiento de transportadoras
- city-analysis: Estadisticas por ciudad
- financial-report: Reportes financieros
- dashboard-metrics: Metricas del dashboard
- schedule-task: Programar tareas automaticas
- send-whatsapp: Enviar notificaciones WhatsApp

Cuando el usuario pida algo que puede resolverse con un skill, sugierelo.

FORMATO DE RESPUESTA:
- Se breve y directo
- Usa bullet points para listas
- Incluye numeros y datos cuando sea relevante
- Si detectas un skill aplicable, mencionalo

CONTEXTO:
- Moneda: Pesos colombianos (COP)
- Timezone: America/Bogota
- Transportadoras comunes: Servientrega, Coordinadora, Interrapidisimo, TCC, Envia
- Estados de guias: En transito, Entregado, Con novedad, Devuelto`;

// ============================================
// CLAUDE SERVICE
// ============================================

class ClaudeService {
  private client: Anthropic | null = null;

  private getClient(): Anthropic | null {
    if (!ANTHROPIC_API_KEY) {
      console.warn('[AIService] Claude API key not configured');
      return null;
    }

    if (!this.client) {
      this.client = new Anthropic({
        apiKey: ANTHROPIC_API_KEY,
        dangerouslyAllowBrowser: true,
      });
    }

    return this.client;
  }

  async chat(
    messages: AIMessage[],
    config: AIConfig = {}
  ): Promise<AIResponse | null> {
    const client = this.getClient();
    if (!client) return null;

    try {
      const response = await client.messages.create({
        model: 'claude-3-haiku-20240307', // Using Haiku for speed
        max_tokens: config.maxTokens || 1024,
        system: config.systemPrompt || DEFAULT_SYSTEM_PROMPT,
        messages: messages.map((m) => ({
          role: m.role === 'system' ? 'user' : m.role,
          content: m.content,
        })),
      });

      const textContent = response.content.find((c) => c.type === 'text');

      return {
        content: textContent?.text || '',
        model: 'claude-3-haiku',
        tokens: {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens,
        },
      };
    } catch (error) {
      console.error('[AIService] Claude error:', error);
      return null;
    }
  }

  async analyzeIntent(
    userMessage: string
  ): Promise<{ skillId: string; confidence: number; params: Record<string, any> } | null> {
    const client = this.getClient();
    if (!client) return null;

    const intentPrompt = `Analiza el siguiente mensaje del usuario y determina si corresponde a alguno de estos skills:

SKILLS:
- track-shipment: Rastrear guias (keywords: rastrear, tracking, guia, donde esta)
- generate-report: Generar reportes (keywords: reporte, informe, resumen)
- analyze-carrier: Analizar transportadoras (keywords: transportadora, carrier, rendimiento)
- city-analysis: Analizar ciudades (keywords: ciudad, ciudades, regional)
- financial-report: Reporte financiero (keywords: ganancia, dinero, cobrar, finanzas)
- dashboard-metrics: Metricas dashboard (keywords: dashboard, metricas, estado general)
- problems-detection: Detectar problemas (keywords: problemas, novedades, alertas)

MENSAJE: "${userMessage}"

Responde SOLO en este formato JSON:
{"skillId": "nombre-del-skill-o-null", "confidence": 0.0-1.0, "params": {}}

Si no hay match claro, responde: {"skillId": null, "confidence": 0, "params": {}}`;

    try {
      const response = await client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 256,
        messages: [{ role: 'user', content: intentPrompt }],
      });

      const textContent = response.content.find((c) => c.type === 'text');
      if (!textContent) return null;

      // Extract JSON from response
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const result = JSON.parse(jsonMatch[0]);

      if (result.skillId && result.confidence > 0.5) {
        return result;
      }

      return null;
    } catch (error) {
      console.error('[AIService] Intent analysis error:', error);
      return null;
    }
  }
}

// ============================================
// GEMINI SERVICE (Fallback)
// ============================================

class GeminiService {
  private apiKey: string;

  constructor() {
    this.apiKey = GEMINI_API_KEY;
  }

  async chat(
    messages: AIMessage[],
    config: AIConfig = {}
  ): Promise<AIResponse | null> {
    if (!this.apiKey) {
      console.warn('[AIService] Gemini API key not configured');
      return null;
    }

    try {
      // Format messages for Gemini
      const formattedMessages = messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      // Add system prompt as first user message if provided
      if (config.systemPrompt) {
        formattedMessages.unshift({
          role: 'user',
          parts: [{ text: `Instrucciones del sistema: ${config.systemPrompt}` }],
        });
        formattedMessages.splice(1, 0, {
          role: 'model',
          parts: [{ text: 'Entendido. Seguire esas instrucciones.' }],
        });
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: formattedMessages,
            generationConfig: {
              maxOutputTokens: config.maxTokens || 1024,
              temperature: config.temperature || 0.7,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      return {
        content,
        model: 'gemini-1.5-flash',
      };
    } catch (error) {
      console.error('[AIService] Gemini error:', error);
      return null;
    }
  }
}

// ============================================
// UNIFIED AI SERVICE
// ============================================

class UnifiedAIService {
  private claude: ClaudeService;
  private gemini: GeminiService;

  constructor() {
    this.claude = new ClaudeService();
    this.gemini = new GeminiService();
  }

  /**
   * Send a message and get AI response
   */
  async chat(
    messages: AIMessage[],
    config: AIConfig = {}
  ): Promise<AIResponse> {
    const model = config.model || 'auto';

    // Try Claude first (preferred)
    if (model === 'claude' || model === 'auto') {
      const claudeResponse = await this.claude.chat(messages, config);
      if (claudeResponse) return claudeResponse;
    }

    // Fall back to Gemini
    if (model === 'gemini' || model === 'auto') {
      const geminiResponse = await this.gemini.chat(messages, config);
      if (geminiResponse) return geminiResponse;
    }

    // Ultimate fallback
    return {
      content: 'Lo siento, no puedo procesar tu solicitud en este momento. Por favor intenta usar uno de los skills disponibles o reformula tu pregunta.',
      model: 'fallback',
    };
  }

  /**
   * Analyze user intent and suggest skills
   */
  async analyzeIntent(userMessage: string): Promise<{
    skillId: string | null;
    confidence: number;
    params: Record<string, any>;
  }> {
    const result = await this.claude.analyzeIntent(userMessage);

    if (result) {
      return result;
    }

    // Simple regex-based fallback
    return this.simpleIntentMatch(userMessage);
  }

  /**
   * Simple regex-based intent matching
   */
  private simpleIntentMatch(message: string): {
    skillId: string | null;
    confidence: number;
    params: Record<string, any>;
  } {
    const lowerMessage = message.toLowerCase();

    // Track shipment patterns
    if (/rastr|track|guia|donde.*esta|estado.*de/i.test(lowerMessage)) {
      const guiaMatch = message.match(/([A-Z]{2,4}\d{6,}|\d{10,})/i);
      return {
        skillId: 'track-shipment',
        confidence: 0.8,
        params: guiaMatch ? { guideNumber: guiaMatch[1] } : {},
      };
    }

    // Report patterns
    if (/reporte|informe|resumen|genera/i.test(lowerMessage)) {
      return {
        skillId: 'generate-report',
        confidence: 0.7,
        params: {},
      };
    }

    // City analysis patterns
    if (/ciudad|ciudades|region|zona/i.test(lowerMessage)) {
      return {
        skillId: 'city-analysis',
        confidence: 0.7,
        params: {},
      };
    }

    // Carrier analysis patterns
    if (/transportadora|carrier|envio/i.test(lowerMessage)) {
      return {
        skillId: 'analyze-carrier',
        confidence: 0.7,
        params: {},
      };
    }

    // Financial patterns
    if (/ganancia|dinero|cobrar|financ|pago/i.test(lowerMessage)) {
      return {
        skillId: 'financial-report',
        confidence: 0.7,
        params: {},
      };
    }

    // Dashboard patterns
    if (/dashboard|metrica|estado.*general|como.*va/i.test(lowerMessage)) {
      return {
        skillId: 'dashboard-metrics',
        confidence: 0.7,
        params: {},
      };
    }

    // Problems patterns
    if (/problema|novedad|alerta|error|falla/i.test(lowerMessage)) {
      return {
        skillId: 'problems-detection',
        confidence: 0.7,
        params: {},
      };
    }

    // No match
    return {
      skillId: null,
      confidence: 0,
      params: {},
    };
  }

  /**
   * Generate a natural language response when no skill matches
   */
  async generateResponse(
    userMessage: string,
    context?: {
      recentMessages?: AIMessage[];
      userData?: Record<string, any>;
    }
  ): Promise<string> {
    const messages: AIMessage[] = context?.recentMessages || [];
    messages.push({ role: 'user', content: userMessage });

    const response = await this.chat(messages, {
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      maxTokens: 512,
    });

    return response.content;
  }

  /**
   * Check if AI services are available
   */
  isAvailable(): boolean {
    return !!(ANTHROPIC_API_KEY || GEMINI_API_KEY);
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const aiService = new UnifiedAIService();

export default aiService;
