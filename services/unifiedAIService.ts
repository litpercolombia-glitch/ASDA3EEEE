// services/unifiedAIService.ts
// Servicio Unificado de IA con Fallback Automático
// Soporta Claude, Gemini y OpenAI con cambio automático si uno falla

import { askAssistant as claudeAskAssistant } from './claudeService';
import { askAssistant as geminiAskAssistant } from './geminiService';
import { useAIConfigStore } from './aiConfigService';

// ============================================
// TIPOS DE MODO DE CHAT
// ============================================
export type ChatMode = 'fast' | 'reasoning';

export interface ChatModeConfig {
  id: ChatMode;
  name: string;
  description: string;
  icon: string;
  systemPromptAddition: string;
  temperature: number;
  maxTokens: number;
}

export const CHAT_MODES: Record<ChatMode, ChatModeConfig> = {
  fast: {
    id: 'fast',
    name: 'Rápido',
    description: 'Respuestas concisas y directas',
    icon: '⚡',
    systemPromptAddition: `
MODO RÁPIDO - Responde de forma:
- Concisa (máximo 2-3 oraciones)
- Directa al punto
- Sin explicaciones extensas
- Solo lo esencial`,
    temperature: 0.5,
    maxTokens: 500,
  },
  reasoning: {
    id: 'reasoning',
    name: 'Razonamiento',
    description: 'Análisis profundo paso a paso',
    icon: '🧠',
    systemPromptAddition: `
MODO RAZONAMIENTO - Responde de forma:
- Analítica y detallada
- Paso a paso cuando sea necesario
- Con justificación de tus conclusiones
- Considerando múltiples perspectivas
- Incluyendo pros y contras si aplica

Estructura tu respuesta:
1. **Análisis**: Evalúa la situación
2. **Razonamiento**: Explica tu proceso de pensamiento
3. **Conclusión**: Da tu recomendación final
4. **Siguientes pasos**: Acciones sugeridas`,
    temperature: 0.7,
    maxTokens: 2048,
  },
};

// ============================================
// FUNCIÓN PARA LLAMAR A OPENAI
// ============================================
async function openaiAskAssistant(prompt: string, mode: ChatMode = 'fast'): Promise<string> {
  const config = useAIConfigStore.getState().providers.openai;
  const apiKey = config.apiKey;
  const modeConfig = CHAT_MODES[mode];

  if (!apiKey) {
    console.warn('OpenAI API Key no configurada');
    return '';
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.model || 'gpt-4o-mini',
        max_tokens: modeConfig.maxTokens,
        temperature: modeConfig.temperature,
        messages: [
          {
            role: 'system',
            content: `Eres un EXPERTO EN LOGÍSTICA DE ÚLTIMA MILLA EN COLOMBIA.
Trabajas para Litper Pro, una plataforma de gestión logística premium.
Siempre respondes en ESPAÑOL COLOMBIANO de forma profesional.
${modeConfig.systemPromptAddition}`
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error en OpenAI:', error);
      return '';
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('Error llamando a OpenAI:', error);
    return '';
  }
}

// ============================================
// TIPOS E INTERFACES
// ============================================

export type AIProvider = 'claude' | 'gemini' | 'openai';

export interface AIConfig {
  provider: AIProvider;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

export interface AIResponse {
  text: string;
  provider: AIProvider;
  confidence: number;
  processingTime: number;
  fallbackUsed: boolean;
  error?: string;
  metadata?: {
    tokensUsed?: number;
    model?: string;
  };
}

export interface ConversationContext {
  shipments: any[];
  recentQueries: string[];
}

// ============================================
// CONFIGURACIÓN POR DEFECTO
// ============================================

const DEFAULT_CONFIGS: Record<AIProvider, AIConfig> = {
  claude: {
    provider: 'claude',
    temperature: 0.7,
    maxTokens: 4096,
    systemPrompt: `Eres un EXPERTO EN LOGÍSTICA DE ÚLTIMA MILLA EN COLOMBIA.`,
  },
  gemini: {
    provider: 'gemini',
    temperature: 0.8,
    maxTokens: 4096,
    systemPrompt: `Eres un asistente de logística de Litper Pro.`,
  },
  openai: {
    provider: 'openai',
    temperature: 0.7,
    maxTokens: 4096,
    systemPrompt: `Eres un asistente profesional de logística.`,
  },
};

// Orden de fallback
const FALLBACK_ORDER: AIProvider[] = ['claude', 'gemini', 'openai'];

// ============================================
// SERVICIO UNIFICADO DE IA
// ============================================

class UnifiedAIService {
  private configs: Record<AIProvider, AIConfig> = { ...DEFAULT_CONFIGS };
  private currentProvider: AIProvider = 'claude';
  private recentQueries: string[] = [];
  private providerStatus: Record<AIProvider, { available: boolean; lastError?: string }> = {
    claude: { available: true },
    gemini: { available: true },
    openai: { available: true },
  };

  constructor() {
    console.log('🤖 [UnifiedAI] Servicio inicializado');
  }

  setProvider(provider: AIProvider): void {
    this.currentProvider = provider;
    console.log(`🤖 [UnifiedAI] Proveedor cambiado a: ${provider}`);
  }

  getProvider(): AIProvider {
    return this.currentProvider;
  }

  getProvidersStatus(): Record<AIProvider, { available: boolean; lastError?: string }> {
    return { ...this.providerStatus };
  }

  // ==================== CHAT PRINCIPAL ====================

  private currentMode: ChatMode = 'fast';

  setMode(mode: ChatMode): void {
    this.currentMode = mode;
    console.log(`🤖 [UnifiedAI] Modo cambiado a: ${mode}`);
  }

  getMode(): ChatMode {
    return this.currentMode;
  }

  getModeConfig(): ChatModeConfig {
    return CHAT_MODES[this.currentMode];
  }

  async chat(
    message: string,
    shipments: any[] = [],
    options?: {
      provider?: AIProvider;
      mode?: ChatMode;
      temperature?: number;
      includeHistory?: boolean;
    }
  ): Promise<AIResponse> {
    const startTime = Date.now();
    const provider = options?.provider || this.currentProvider;
    const mode = options?.mode || this.currentMode;

    // Agregar a queries recientes
    this.recentQueries.push(message);
    if (this.recentQueries.length > 10) {
      this.recentQueries.shift();
    }

    // Construir prompt con el modo seleccionado
    const enrichedPrompt = this.buildSimplePrompt(message, shipments, mode);

    // Intentar con el proveedor seleccionado
    let response = await this.callProvider(provider, enrichedPrompt, shipments, mode);

    // Si falla, intentar fallback
    if (response.error && !response.fallbackUsed) {
      console.log(`🤖 [UnifiedAI] ${provider} falló, intentando fallback...`);
      response = await this.tryFallback(provider, enrichedPrompt, shipments, mode);
    }

    return {
      ...response,
      processingTime: Date.now() - startTime,
    };
  }

  private buildSimplePrompt(message: string, shipments: any[], mode: ChatMode): string {
    const modeConfig = CHAT_MODES[mode];
    const parts: string[] = [];

    // Contexto de envíos si hay
    if (shipments && shipments.length > 0) {
      const summary = shipments.slice(0, 20).map(s =>
        `- Guía: ${s.id || s.guia}, Estado: ${s.status || s.estado}, Transportadora: ${s.carrier || s.transportadora}`
      ).join('\n');

      parts.push('=== CONTEXTO DE GUÍAS ===');
      parts.push(`Total: ${shipments.length} envíos`);
      parts.push(summary);
      parts.push('');
    }

    // Mensaje del usuario
    parts.push('=== PREGUNTA DEL USUARIO ===');
    parts.push(message);
    parts.push('');

    // Instrucciones según el modo
    parts.push(modeConfig.systemPromptAddition);

    return parts.join('\n');
  }

  // ==================== LLAMADAS A PROVEEDORES ====================

  private async callProvider(
    provider: AIProvider,
    prompt: string,
    shipments: any[],
    mode: ChatMode = 'fast'
  ): Promise<AIResponse> {
    try {
      let text: string = '';

      switch (provider) {
        case 'claude':
          text = await claudeAskAssistant(prompt);
          break;

        case 'gemini':
          try {
            const geminiResponse = await geminiAskAssistant(prompt, shipments);
            text = geminiResponse.text;
          } catch (e) {
            console.error('Error en Gemini:', e);
            text = '';
          }
          break;

        case 'openai':
          text = await openaiAskAssistant(prompt, mode);
          break;

        default:
          text = '';
      }

      // Verificar si la respuesta está vacía
      if (!text || text.trim() === '') {
        console.warn(`🤖 [UnifiedAI] ${provider} retornó respuesta vacía`);
        this.providerStatus[provider] = {
          available: false,
          lastError: 'Respuesta vacía - posiblemente API key no configurada',
        };
        return {
          text: '',
          provider,
          confidence: 0,
          processingTime: 0,
          fallbackUsed: false,
          error: 'API key no configurada o respuesta vacía',
        };
      }

      this.providerStatus[provider] = { available: true };

      return {
        text,
        provider,
        confidence: 0.8,
        processingTime: 0,
        fallbackUsed: false,
      };
    } catch (error: any) {
      console.error(`🤖 [UnifiedAI] Error con ${provider}:`, error.message);

      this.providerStatus[provider] = {
        available: false,
        lastError: error.message,
      };

      return {
        text: '',
        provider,
        confidence: 0,
        processingTime: 0,
        fallbackUsed: false,
        error: error.message,
      };
    }
  }

  private async tryFallback(
    failedProvider: AIProvider,
    prompt: string,
    shipments: any[],
    mode: ChatMode = 'fast'
  ): Promise<AIResponse> {
    const availableProviders = FALLBACK_ORDER.filter(p => p !== failedProvider);

    for (const provider of availableProviders) {
      console.log(`🤖 [UnifiedAI] Intentando fallback con: ${provider}`);
      const response = await this.callProvider(provider, prompt, shipments, mode);

      if (!response.error && response.text) {
        return {
          ...response,
          fallbackUsed: true,
        };
      }
    }

    // Todos fallaron - respuesta de emergencia
    return {
      text: this.getEmergencyResponse(),
      provider: 'claude',
      confidence: 0.3,
      processingTime: 0,
      fallbackUsed: true,
      error: 'Todos los proveedores de IA no están disponibles',
    };
  }

  private getEmergencyResponse(): string {
    return `**Asistente no disponible temporalmente**

Para usar el chat de IA, necesitas configurar al menos una API key:

1. Ve a **Config** > **Conexiones IA**
2. Agrega tu API key de:
   - **Claude**: https://console.anthropic.com/
   - **Gemini**: https://aistudio.google.com/
   - **OpenAI**: https://platform.openai.com/

O configura las variables de entorno:
- \`VITE_ANTHROPIC_API_KEY\`
- \`VITE_GEMINI_API_KEY\`
- \`VITE_OPENAI_API_KEY\`

Mientras tanto, puedes usar las otras funciones de la plataforma.`;
  }

  // ==================== FUNCIONES AUXILIARES ====================

  async analyzeDelays(shipments: any[]): Promise<any> {
    return {
      patterns: [],
      urgentReview: [],
      recommendations: {
        immediate: ['Revisar guías con más de 5 días en tránsito'],
        shortTerm: ['Contactar clientes afectados'],
        strategic: ['Evaluar transportadoras'],
      },
    };
  }

  async generateCustomerMessage(
    guia: string,
    situation: string,
    tone: 'formal' | 'friendly' | 'urgent' = 'friendly'
  ): Promise<string> {
    const prompt = `Genera un mensaje corto de WhatsApp para un cliente sobre su pedido.
Guía: ${guia}
Situación: ${situation}
Tono: ${tone === 'formal' ? 'Profesional' : tone === 'urgent' ? 'Urgente' : 'Amigable'}
Máximo 3 líneas, sin saludos formales.`;

    const response = await this.chat(prompt, []);
    return response.text;
  }

  async getGuideRecommendations(guia: string): Promise<string[]> {
    return ['Verificar estado en la transportadora', 'Contactar al cliente'];
  }
}

// Singleton
export const unifiedAI = new UnifiedAIService();
export default unifiedAI;
