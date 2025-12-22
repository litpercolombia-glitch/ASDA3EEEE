// services/unifiedAIService.ts
// Servicio Unificado de IA con Fallback Automático
// Soporta Claude, Gemini y OpenAI con cambio automático si uno falla

import { askAssistant as claudeAskAssistant, analyzeDelayPatterns } from './claudeService';
import { askAssistant as geminiAskAssistant } from './geminiService';
import { guideHistoryService } from './guideHistoryService';
import { centralBrain } from './brain/core/CentralBrain';
import { memoryManager } from './brain/core/MemoryManager';
import { contextManager } from './brain/core/ContextManager';

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
  guideHistory: string;
  brainSummary: string;
  operationalContext: string;
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
    systemPrompt: `Eres un EXPERTO EN LOGÍSTICA DE ÚLTIMA MILLA EN COLOMBIA con 15+ años de experiencia.
Trabajas para Litper Pro, una plataforma de gestión logística premium.

Tu conocimiento incluye:
- Todas las transportadoras colombianas (Inter Rapidísimo, Envía, Coordinadora, TCC, Servientrega)
- Zonas de difícil acceso del país
- Tiempos realistas de entrega por ciudad y región
- Patrones de problemas comunes (novedades, devoluciones)
- Mejores prácticas de atención al cliente

Siempre respondes en ESPAÑOL COLOMBIANO de forma profesional, clara y accionable.
Cuando hay datos de guías, los analizas y das recomendaciones específicas.
Si no tienes suficiente información, pides los datos que necesitas.`,
  },
  gemini: {
    provider: 'gemini',
    temperature: 0.8,
    maxTokens: 4096,
    systemPrompt: `Eres un asistente de logística de Litper Pro con capacidades de visión e imágenes.
Especializado en análisis de capturas de seguimiento y evidencias de entrega.
Respondes en español de forma clara y útil.`,
  },
  openai: {
    provider: 'openai',
    temperature: 0.7,
    maxTokens: 4096,
    systemPrompt: `Eres un asistente profesional de logística para el mercado colombiano.
Ayudas con seguimiento de envíos, análisis de datos y comunicación con clientes.
Respondes de forma profesional en español.`,
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

  // ==================== CONFIGURACIÓN ====================

  /**
   * Establecer proveedor de IA
   */
  setProvider(provider: AIProvider): void {
    this.currentProvider = provider;
    console.log(`🤖 [UnifiedAI] Proveedor cambiado a: ${provider}`);
  }

  /**
   * Obtener proveedor actual
   */
  getProvider(): AIProvider {
    return this.currentProvider;
  }

  /**
   * Actualizar configuración de un proveedor
   */
  updateConfig(provider: AIProvider, config: Partial<AIConfig>): void {
    this.configs[provider] = { ...this.configs[provider], ...config };
  }

  /**
   * Obtener estado de proveedores
   */
  getProvidersStatus(): Record<AIProvider, { available: boolean; lastError?: string }> {
    return { ...this.providerStatus };
  }

  // ==================== CONSTRUCCIÓN DE CONTEXTO ====================

  /**
   * Construir contexto completo para la IA
   */
  buildContext(shipments: any[]): ConversationContext {
    // Sincronizar guías con el servicio de historial
    if (shipments.length > 0) {
      guideHistoryService.syncFromShipments(shipments);
    }

    // Obtener contexto del historial de guías
    const guideHistory = guideHistoryService.getAIContext();

    // Obtener resumen del cerebro
    const brainSummary = this.getBrainSummary();

    // Obtener contexto operacional
    const operationalContext = this.getOperationalContext();

    return {
      shipments,
      guideHistory,
      brainSummary,
      operationalContext,
      recentQueries: this.recentQueries.slice(-5),
    };
  }

  private getBrainSummary(): string {
    const summary = centralBrain.getSummary();
    return `
ESTADO DEL SISTEMA:
- Salud: ${summary.health}
- Envíos registrados: ${summary.shipments}
- Entregados: ${summary.delivered}
- Con problemas: ${summary.issues}
- Retrasados: ${summary.delayed}
- Entradas en memoria: ${summary.memoryEntries}
`.trim();
  }

  private getOperationalContext(): string {
    const ctx = contextManager.getContext();
    return `
CONTEXTO OPERACIONAL:
- Usuario: ${ctx.user?.role || 'operador'}
- Tab activo: ${ctx.session?.activeTab || 'seguimiento'}
- Guías seleccionadas: ${ctx.session?.selectedShipments?.length || 0}
- Score de performance: ${ctx.operational?.performanceScore || 0}%
`.trim();
  }

  // ==================== CHAT PRINCIPAL ====================

  /**
   * Enviar mensaje a la IA con contexto completo
   */
  async chat(
    message: string,
    shipments: any[] = [],
    options?: {
      provider?: AIProvider;
      temperature?: number;
      includeHistory?: boolean;
    }
  ): Promise<AIResponse> {
    const startTime = Date.now();
    const provider = options?.provider || this.currentProvider;

    // Agregar a queries recientes
    this.recentQueries.push(message);
    if (this.recentQueries.length > 10) {
      this.recentQueries.shift();
    }

    // Construir contexto
    const context = this.buildContext(shipments);

    // Construir prompt enriquecido
    const enrichedPrompt = this.buildEnrichedPrompt(message, context);

    // Intentar con el proveedor seleccionado
    let response = await this.callProvider(provider, enrichedPrompt, context);

    // Si falla, intentar fallback
    if (response.error && !response.fallbackUsed) {
      console.log(`🤖 [UnifiedAI] ${provider} falló, intentando fallback...`);
      response = await this.tryFallback(provider, enrichedPrompt, context);
    }

    // Guardar en memoria para aprendizaje
    this.saveInteraction(message, response);

    return {
      ...response,
      processingTime: Date.now() - startTime,
    };
  }

  private buildEnrichedPrompt(message: string, context: ConversationContext): string {
    const parts: string[] = [];

    // Agregar contexto de guías si hay
    if (context.guideHistory) {
      parts.push('=== DATOS DE GUÍAS ACTUALES ===');
      parts.push(context.guideHistory);
      parts.push('');
    }

    // Agregar contexto del cerebro
    if (context.brainSummary) {
      parts.push('=== ESTADO DEL SISTEMA ===');
      parts.push(context.brainSummary);
      parts.push('');
    }

    // Agregar contexto operacional
    if (context.operationalContext) {
      parts.push('=== CONTEXTO OPERACIONAL ===');
      parts.push(context.operationalContext);
      parts.push('');
    }

    // Queries recientes para contexto de conversación
    if (context.recentQueries.length > 0) {
      parts.push('=== PREGUNTAS RECIENTES ===');
      parts.push(context.recentQueries.join('\n'));
      parts.push('');
    }

    // Mensaje del usuario
    parts.push('=== PREGUNTA DEL USUARIO ===');
    parts.push(message);

    // Instrucciones finales
    parts.push('');
    parts.push('=== INSTRUCCIONES ===');
    parts.push('- Analiza los datos proporcionados');
    parts.push('- Da una respuesta específica y accionable');
    parts.push('- Si mencionan guías específicas, busca en los datos');
    parts.push('- Incluye números y estadísticas cuando sea relevante');
    parts.push('- Si necesitas más información, pregunta');

    return parts.join('\n');
  }

  // ==================== LLAMADAS A PROVEEDORES ====================

  private async callProvider(
    provider: AIProvider,
    prompt: string,
    context: ConversationContext
  ): Promise<AIResponse> {
    try {
      let text: string;

      switch (provider) {
        case 'claude':
          text = await claudeAskAssistant(prompt, this.formatContextForClaude(context));
          break;

        case 'gemini':
          const geminiResponse = await geminiAskAssistant(prompt, context.shipments);
          text = geminiResponse.text;
          break;

        case 'openai':
          // OpenAI no está implementado directamente, usar Claude como proxy
          text = await claudeAskAssistant(`[Modo OpenAI] ${prompt}`, this.formatContextForClaude(context));
          break;

        default:
          throw new Error(`Proveedor no soportado: ${provider}`);
      }

      this.providerStatus[provider] = { available: true };

      return {
        text,
        provider,
        confidence: this.calculateConfidence(text),
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
    context: ConversationContext
  ): Promise<AIResponse> {
    // Obtener proveedores disponibles en orden de fallback
    const availableProviders = FALLBACK_ORDER.filter(
      p => p !== failedProvider && this.providerStatus[p].available
    );

    for (const provider of availableProviders) {
      console.log(`🤖 [UnifiedAI] Intentando fallback con: ${provider}`);

      const response = await this.callProvider(provider, prompt, context);

      if (!response.error) {
        return {
          ...response,
          fallbackUsed: true,
        };
      }
    }

    // Todos fallaron - respuesta de emergencia
    return {
      text: this.getEmergencyResponse(context),
      provider: 'claude',
      confidence: 0.3,
      processingTime: 0,
      fallbackUsed: true,
      error: 'Todos los proveedores de IA no están disponibles',
    };
  }

  private getEmergencyResponse(context: ConversationContext): string {
    const stats = guideHistoryService.getStats();

    return `Lo siento, estoy teniendo dificultades técnicas para procesar tu consulta.

**Mientras tanto, aquí tienes un resumen de tus datos:**

- Total de guías: ${stats.total}
- Tasa de entrega: ${stats.tasaEntrega.toFixed(1)}%
- Guías con novedad: ${stats.porEstado.novedad}
- En tránsito: ${stats.porEstado.en_transito}
- En reparto: ${stats.porEstado.en_reparto}

**Acciones sugeridas:**
1. Revisa las guías con novedad en la pestaña de Seguimiento
2. Prioriza las guías con más días en tránsito
3. Contacta a las transportadoras para guías críticas

¿Puedo ayudarte con algo específico mientras se restaura la conexión completa?`;
  }

  private formatContextForClaude(context: ConversationContext): string {
    const shipmentSummary = context.shipments.length > 0
      ? context.shipments.slice(0, 30).map(s =>
          `- Guía: ${s.id || s.guia}, Estado: ${s.status || s.estado}, Transportadora: ${s.carrier || s.transportadora}, Novedad: ${s.novelty || s.novedad || 'Sin novedad'}`
        ).join('\n')
      : 'No hay guías cargadas';

    return `
${context.guideHistory}

DETALLE DE GUÍAS:
${shipmentSummary}

${context.brainSummary}
${context.operationalContext}
`.trim();
  }

  private calculateConfidence(text: string): number {
    // Heurística simple para estimar confianza
    let confidence = 0.7;

    // Más largo = más detallado = más confianza
    if (text.length > 500) confidence += 0.1;
    if (text.length > 1000) confidence += 0.1;

    // Contiene números específicos = más confianza
    if (/\d+/.test(text)) confidence += 0.05;

    // Contiene listas o estructura = más confianza
    if (text.includes('-') || text.includes('•') || text.includes('1.')) confidence += 0.05;

    return Math.min(1, confidence);
  }

  private saveInteraction(query: string, response: AIResponse): void {
    memoryManager.remember('ai_interactions', {
      query,
      response: response.text.substring(0, 500),
      provider: response.provider,
      confidence: response.confidence,
      timestamp: new Date(),
    }, {
      type: 'SHORT_TERM',
      importance: 50,
    });
  }

  // ==================== FUNCIONES ESPECIALIZADAS ====================

  /**
   * Análisis de patrones de retraso (usa Claude específicamente)
   */
  async analyzeDelays(shipments: any[]): Promise<any> {
    try {
      return await analyzeDelayPatterns(shipments);
    } catch (error) {
      console.error('🤖 [UnifiedAI] Error en análisis de patrones:', error);
      return {
        patterns: [],
        urgentReview: [],
        recommendations: {
          immediate: ['Revisar guías con más de 5 días en tránsito'],
          shortTerm: ['Contactar clientes afectados'],
          strategic: ['Evaluar transportadoras'],
        },
        riskSummary: {
          totalAtRisk: 0,
          criticalCount: 0,
          estimatedLoss: 0,
          mainCauses: ['Análisis no disponible'],
        },
        colombianContext: {
          regionalIssues: [],
          carrierAlerts: [],
          seasonalFactors: [],
          marketInsights: [],
        },
      };
    }
  }

  /**
   * Generar mensaje para cliente
   */
  async generateCustomerMessage(
    guia: string,
    situation: string,
    tone: 'formal' | 'friendly' | 'urgent' = 'friendly'
  ): Promise<string> {
    const history = guideHistoryService.getHistory(guia);

    const prompt = `Genera un mensaje de WhatsApp para un cliente sobre su pedido.

DATOS DEL ENVÍO:
- Guía: ${guia}
- Estado: ${history?.currentStatusRaw || 'En proceso'}
- Transportadora: ${history?.transportadora || 'No especificada'}
- Días en tránsito: ${history?.metrics.diasEnTransito || 0}
- Situación: ${situation}

TONO: ${tone === 'formal' ? 'Profesional y formal' : tone === 'urgent' ? 'Urgente pero respetuoso' : 'Cercano y amigable'}

REQUISITOS:
- Máximo 3 líneas
- Sin saludos ni despedidas formales
- Incluir número de guía
- Listo para enviar por WhatsApp
- En español colombiano`;

    const response = await this.chat(prompt, []);
    return response.text;
  }

  /**
   * Obtener recomendaciones para guía específica
   */
  async getGuideRecommendations(guia: string): Promise<string[]> {
    const history = guideHistoryService.getHistory(guia);

    if (!history) {
      return ['Guía no encontrada en el sistema'];
    }

    const prompt = `Analiza esta guía y dame 3-5 recomendaciones accionables:

GUÍA: ${guia}
ESTADO: ${history.currentStatusRaw}
TRANSPORTADORA: ${history.transportadora}
CIUDAD DESTINO: ${history.ciudadDestino}
DÍAS EN TRÁNSITO: ${history.metrics.diasEnTransito}
NOVEDAD: ${history.metrics.novedadActual || 'Ninguna'}
NIVEL DE RIESGO: ${history.riskLevel}

TIMELINE:
${history.timeline.slice(-5).map(e => `- ${e.timestamp}: ${e.description}`).join('\n')}

Dame recomendaciones específicas y accionables, numeradas.`;

    const response = await this.chat(prompt, []);

    // Extraer recomendaciones numeradas
    const lines = response.text.split('\n').filter(l => /^\d+\./.test(l.trim()));
    return lines.length > 0 ? lines : [response.text];
  }
}

// Singleton
export const unifiedAI = new UnifiedAIService();
export default unifiedAI;
