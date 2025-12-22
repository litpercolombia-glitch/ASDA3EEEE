/**
 * Secure AI Service - Comunicación segura con IA via Backend
 *
 * Este servicio reemplaza las llamadas directas a APIs de IA (Claude, Gemini, OpenAI)
 * y las enruta a través del backend, eliminando la exposición de API keys en el frontend.
 *
 * SEGURIDAD: Las API keys NUNCA salen del servidor backend.
 */

// Configuración del backend
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
const API_BASE = `${BACKEND_URL}/api/ai`;

// Tipos
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  system?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  provider?: 'claude' | 'gemini' | 'openai';
}

export interface ChatResponse {
  success: boolean;
  content: string;
  provider: string;
  model: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
  timestamp: string;
}

export interface VisionAnalysisResult {
  success: boolean;
  analysis: string;
  provider: string;
  model: string;
  timestamp: string;
}

export interface AIProviderStatus {
  available: boolean;
  model: string;
}

export interface AIStatus {
  status: 'ready' | 'no_keys';
  providers: {
    claude: AIProviderStatus;
    gemini: AIProviderStatus;
    openai: AIProviderStatus;
  };
  default_provider: string;
  timestamp: string;
}

// Errores personalizados
export class SecureAIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'SecureAIError';
  }
}

// Helper para hacer requests
async function secureRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new SecureAIError(
        errorData.detail || `Error ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof SecureAIError) {
      throw error;
    }
    throw new SecureAIError(
      `Error de conexión con el servidor: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      0,
      error
    );
  }
}

/**
 * Servicio de IA Seguro
 * Todas las llamadas pasan por el backend - sin API keys en el frontend
 */
export const secureAI = {
  /**
   * Verifica el estado de los proveedores de IA en el servidor
   */
  async getStatus(): Promise<AIStatus> {
    return secureRequest<AIStatus>('/status');
  },

  /**
   * Envía un mensaje de chat y obtiene respuesta
   * @param messages - Historial de mensajes
   * @param options - Opciones de configuración
   */
  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatResponse> {
    return secureRequest<ChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages,
        system: options.system,
        model: options.model,
        max_tokens: options.maxTokens || 2048,
        temperature: options.temperature || 0.7,
        provider: options.provider,
      }),
    });
  },

  /**
   * Envía un mensaje simple y obtiene respuesta (sin historial)
   * @param message - Mensaje del usuario
   * @param options - Opciones de configuración
   */
  async sendMessage(message: string, options: ChatOptions = {}): Promise<string> {
    const response = await this.chat([{ role: 'user', content: message }], options);
    return response.content;
  },

  /**
   * Analiza una imagen usando visión de IA
   * @param imageBase64 - Imagen en formato base64
   * @param prompt - Prompt para el análisis
   */
  async analyzeImage(imageBase64: string, prompt: string): Promise<VisionAnalysisResult> {
    return secureRequest<VisionAnalysisResult>('/vision/analyze', {
      method: 'POST',
      body: JSON.stringify({
        image_base64: imageBase64,
        prompt,
      }),
    });
  },

  /**
   * Extrae texto de una imagen (OCR)
   * @param file - Archivo de imagen
   */
  async extractTextFromImage(file: File): Promise<VisionAnalysisResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/vision/ocr`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new SecureAIError(
        errorData.detail || 'Error en OCR',
        response.status
      );
    }

    return response.json();
  },

  /**
   * Analiza texto con diferentes tipos de análisis
   * @param text - Texto a analizar
   * @param analysisType - Tipo de análisis
   * @param context - Contexto adicional opcional
   */
  async analyzeText(
    text: string,
    analysisType: 'general' | 'sentiment' | 'logistics' | 'predict' = 'general',
    context?: Record<string, unknown>
  ): Promise<{ success: boolean; analysis: string; analysis_type: string; timestamp: string }> {
    return secureRequest('/analyze/text', {
      method: 'POST',
      body: JSON.stringify({
        text,
        analysis_type: analysisType,
        context,
      }),
    });
  },

  /**
   * Analiza el estado de un envío
   */
  async analyzeShipment(params: {
    trackingNumber: string;
    status: string;
    daysInTransit?: number;
    city?: string;
    carrier?: string;
  }): Promise<{ success: boolean; analysis: string; tracking_number: string; timestamp: string }> {
    const queryParams = new URLSearchParams({
      tracking_number: params.trackingNumber,
      status: params.status,
      ...(params.daysInTransit && { days_in_transit: params.daysInTransit.toString() }),
      ...(params.city && { city: params.city }),
      ...(params.carrier && { carrier: params.carrier }),
    });

    return secureRequest(`/analyze/shipment?${queryParams}`, {
      method: 'POST',
    });
  },
};

/**
 * Hook para usar el servicio de IA seguro con estado de carga
 * Ejemplo de uso:
 *
 * const { sendMessage, loading, error } = useSecureAI();
 * const response = await sendMessage("Hola");
 */
export function createSecureAIHook() {
  let loading = false;
  let error: string | null = null;

  return {
    get loading() {
      return loading;
    },
    get error() {
      return error;
    },

    async sendMessage(message: string, options?: ChatOptions): Promise<string | null> {
      loading = true;
      error = null;

      try {
        const result = await secureAI.sendMessage(message, options);
        return result;
      } catch (e) {
        error = e instanceof Error ? e.message : 'Error desconocido';
        return null;
      } finally {
        loading = false;
      }
    },

    async analyzeImage(imageBase64: string, prompt: string): Promise<string | null> {
      loading = true;
      error = null;

      try {
        const result = await secureAI.analyzeImage(imageBase64, prompt);
        return result.analysis;
      } catch (e) {
        error = e instanceof Error ? e.message : 'Error desconocido';
        return null;
      } finally {
        loading = false;
      }
    },
  };
}

// Export por defecto
export default secureAI;
