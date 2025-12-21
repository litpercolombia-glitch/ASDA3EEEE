// services/aiProviderService.ts
// Servicio de Proveedores de IA - LITPER PRO Enterprise
// Conecta con Claude, GPT-4, Gemini y Chatea Pro

// ==================== CONFIGURACIÓN DE APIs ====================

export interface AIProvider {
  id: string;
  nombre: string;
  icono: string;
  modelo: string;
  apiKey: string;
  endpoint: string;
  activo: boolean;
  esDefault: boolean;
}

export interface AIConfig {
  providers: AIProvider[];
  providerActual: string;
  pinAdmin: string;
  temperaturaDefault: number;
  maxTokens: number;
}

export interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionResponse {
  content: string;
  provider: string;
  tokens?: number;
  error?: string;
}

// ==================== PROVEEDORES DEFAULT ====================
// Las API keys deben ser configuradas por el usuario en el panel de configuración
// Por seguridad, no se incluyen keys por defecto

const PROVIDERS_DEFAULT: AIProvider[] = [
  {
    id: 'claude',
    nombre: 'Claude (Anthropic)',
    icono: '🟣',
    modelo: 'claude-3-5-sonnet-20241022',
    apiKey: '', // Configurar en panel de configuración
    endpoint: 'https://api.anthropic.com/v1/messages',
    activo: true,
    esDefault: true,
  },
  {
    id: 'openai',
    nombre: 'GPT-4 (OpenAI)',
    icono: '🟢',
    modelo: 'gpt-4-turbo-preview',
    apiKey: '', // Configurar en panel de configuración
    endpoint: 'https://api.openai.com/v1/chat/completions',
    activo: false,
    esDefault: false,
  },
  {
    id: 'gemini',
    nombre: 'Gemini (Google)',
    icono: '🔵',
    modelo: 'gemini-pro',
    apiKey: '', // Configurar en panel de configuración
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    activo: false,
    esDefault: false,
  },
  {
    id: 'chatea',
    nombre: 'Chatea Pro',
    icono: '🟡',
    modelo: 'chatea-pro',
    apiKey: '', // Configurar en panel de configuración
    endpoint: 'https://api.chatea.pro/v1/chat',
    activo: false,
    esDefault: false,
  },
];

const CONFIG_DEFAULT: AIConfig = {
  providers: PROVIDERS_DEFAULT,
  providerActual: 'claude',
  pinAdmin: '1234', // PIN por defecto, mismo que admin
  temperaturaDefault: 0.7,
  maxTokens: 2048,
};

// ==================== AI PROVIDER SERVICE ====================

class AIProviderService {
  private config: AIConfig;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.config = this.loadConfig();
  }

  // ==================== CONFIGURACIÓN ====================

  private loadConfig(): AIConfig {
    try {
      const saved = localStorage.getItem('litper_ai_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge con defaults para asegurar todos los campos
        return {
          ...CONFIG_DEFAULT,
          ...parsed,
          providers: parsed.providers || PROVIDERS_DEFAULT,
        };
      }
    } catch (error) {
      console.error('[AIProvider] Error cargando config:', error);
    }
    return { ...CONFIG_DEFAULT };
  }

  private saveConfig(): void {
    localStorage.setItem('litper_ai_config', JSON.stringify(this.config));
    this.notifyListeners();
  }

  getConfig(): AIConfig {
    return { ...this.config };
  }

  getProviders(): AIProvider[] {
    return [...this.config.providers];
  }

  getProviderActual(): AIProvider | null {
    return this.config.providers.find(p => p.id === this.config.providerActual) || null;
  }

  // ==================== AUTENTICACIÓN ====================

  verificarPin(pin: string): boolean {
    return pin === this.config.pinAdmin;
  }

  cambiarPin(pinActual: string, pinNuevo: string): boolean {
    if (this.verificarPin(pinActual)) {
      this.config.pinAdmin = pinNuevo;
      this.saveConfig();
      return true;
    }
    return false;
  }

  // ==================== GESTIÓN DE PROVEEDORES ====================

  setProviderActual(providerId: string): void {
    const provider = this.config.providers.find(p => p.id === providerId);
    if (provider && provider.activo) {
      this.config.providerActual = providerId;
      this.saveConfig();
    }
  }

  toggleProvider(providerId: string, activo: boolean): void {
    const provider = this.config.providers.find(p => p.id === providerId);
    if (provider) {
      provider.activo = activo;
      // Si desactivamos el provider actual, cambiar a otro
      if (!activo && this.config.providerActual === providerId) {
        const otroActivo = this.config.providers.find(p => p.activo);
        if (otroActivo) {
          this.config.providerActual = otroActivo.id;
        }
      }
      this.saveConfig();
    }
  }

  actualizarApiKey(providerId: string, apiKey: string): void {
    const provider = this.config.providers.find(p => p.id === providerId);
    if (provider) {
      provider.apiKey = apiKey;
      this.saveConfig();
    }
  }

  // ==================== CHAT COMPLETION ====================

  async chat(messages: ChatCompletionMessage[], providerId?: string): Promise<ChatCompletionResponse> {
    const provider = providerId
      ? this.config.providers.find(p => p.id === providerId)
      : this.getProviderActual();

    if (!provider || !provider.activo) {
      return {
        content: '❌ No hay proveedor de IA activo configurado.',
        provider: 'none',
        error: 'No active provider',
      };
    }

    try {
      switch (provider.id) {
        case 'claude':
          return await this.chatClaude(messages, provider);
        case 'openai':
          return await this.chatOpenAI(messages, provider);
        case 'gemini':
          return await this.chatGemini(messages, provider);
        case 'chatea':
          return await this.chatChatea(messages, provider);
        default:
          return await this.chatOpenAI(messages, provider); // Default OpenAI compatible
      }
    } catch (error: any) {
      console.error(`[AIProvider] Error con ${provider.nombre}:`, error);
      return {
        content: `❌ Error al conectar con ${provider.nombre}: ${error.message}`,
        provider: provider.id,
        error: error.message,
      };
    }
  }

  // ==================== IMPLEMENTACIONES POR PROVEEDOR ====================

  private async chatClaude(messages: ChatCompletionMessage[], provider: AIProvider): Promise<ChatCompletionResponse> {
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const userMessages = messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role,
      content: m.content,
    }));

    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': provider.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: provider.modelo,
        max_tokens: this.config.maxTokens,
        system: systemMessage || 'Eres el asistente de negocio de LITPER PRO, una empresa de logística y e-commerce en Colombia. Responde de manera concisa, profesional y útil.',
        messages: userMessages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.content?.[0]?.text || 'Sin respuesta',
      provider: provider.id,
      tokens: data.usage?.output_tokens,
    };
  }

  private async chatOpenAI(messages: ChatCompletionMessage[], provider: AIProvider): Promise<ChatCompletionResponse> {
    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: provider.modelo,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperaturaDefault,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content || 'Sin respuesta',
      provider: provider.id,
      tokens: data.usage?.completion_tokens,
    };
  }

  private async chatGemini(messages: ChatCompletionMessage[], provider: AIProvider): Promise<ChatCompletionResponse> {
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
    const systemContext = messages.find(m => m.role === 'system')?.content || '';

    const fullPrompt = systemContext
      ? `${systemContext}\n\nUsuario: ${lastUserMessage}`
      : lastUserMessage;

    const url = `${provider.endpoint}?key=${provider.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: fullPrompt }]
        }],
        generationConfig: {
          temperature: this.config.temperaturaDefault,
          maxOutputTokens: this.config.maxTokens,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin respuesta',
      provider: provider.id,
    };
  }

  private async chatChatea(messages: ChatCompletionMessage[], provider: AIProvider): Promise<ChatCompletionResponse> {
    // Chatea Pro usa formato similar a OpenAI
    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        max_tokens: this.config.maxTokens,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content || data.response || 'Sin respuesta',
      provider: provider.id,
    };
  }

  // ==================== TEST DE CONEXIÓN ====================

  async testProvider(providerId: string): Promise<{ success: boolean; message: string; latency?: number }> {
    const start = Date.now();

    try {
      const response = await this.chat([
        { role: 'user', content: 'Responde solo con: OK' }
      ], providerId);

      if (response.error) {
        return { success: false, message: response.error };
      }

      const latency = Date.now() - start;
      return {
        success: true,
        message: `Conectado correctamente (${latency}ms)`,
        latency
      };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  // ==================== SUBSCRIPCIONES ====================

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  // ==================== RESET ====================

  reset(): void {
    this.config = { ...CONFIG_DEFAULT };
    this.saveConfig();
  }
}

// Singleton
export const aiProviderService = new AIProviderService();
export default aiProviderService;
