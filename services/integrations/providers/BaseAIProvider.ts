// services/integrations/providers/BaseAIProvider.ts
// Clase base para todos los proveedores de IA

import { AIProviderType, AIMessage, AIResponse } from '../../../types/integrations';

export interface AIProviderOptions {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ChatCompletionRequest {
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export abstract class BaseAIProvider {
  protected apiKey: string;
  protected baseUrl: string;
  protected model: string;
  protected maxTokens: number;
  protected temperature: number;

  abstract readonly providerId: AIProviderType;
  abstract readonly providerName: string;

  constructor(options: AIProviderOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl || '';
    this.model = options.model || '';
    this.maxTokens = options.maxTokens || 2048;
    this.temperature = options.temperature || 0.7;
  }

  /**
   * Verificar conexión con el proveedor
   */
  abstract testConnection(): Promise<boolean>;

  /**
   * Enviar mensaje y obtener respuesta
   */
  abstract chat(request: ChatCompletionRequest): Promise<AIResponse>;

  /**
   * Procesar comando en lenguaje natural
   */
  abstract processCommand(command: string, context?: Record<string, unknown>): Promise<{
    intent: 'query' | 'action' | 'config' | 'skill' | 'unknown';
    action?: string;
    params?: Record<string, unknown>;
    response: string;
    confidence: number;
  }>;

  /**
   * Analizar datos
   */
  abstract analyzeData(data: unknown, prompt: string): Promise<string>;

  /**
   * Generar texto
   */
  async generateText(prompt: string, options?: Partial<ChatCompletionRequest>): Promise<string> {
    const response = await this.chat({
      messages: [{ role: 'user', content: prompt, timestamp: new Date() }],
      ...options,
    });
    return response.content;
  }

  /**
   * Headers comunes para requests
   */
  protected getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };
  }

  /**
   * Manejar errores de API
   */
  protected handleError(error: unknown): never {
    if (error instanceof Error) {
      throw new Error(`[${this.providerName}] ${error.message}`);
    }
    throw new Error(`[${this.providerName}] Error desconocido`);
  }
}

export default BaseAIProvider;
