// services/aiConfigService.ts
// Servicio de Configuración de IA - Gestiona API keys de proveedores de IA
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// TIPOS
// ============================================

export type AIProvider = 'claude' | 'gemini' | 'openai';

export interface AIProviderConfig {
  provider: AIProvider;
  name: string;
  apiKey: string;
  isConfigured: boolean;
  isEnabled: boolean;
  lastTested: Date | null;
  lastTestResult: 'success' | 'error' | null;
  lastTestMessage: string | null;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface AIConfigState {
  providers: Record<AIProvider, AIProviderConfig>;
  primaryProvider: AIProvider;
  fallbackEnabled: boolean;
  fallbackOrder: AIProvider[];

  // Actions
  setApiKey: (provider: AIProvider, apiKey: string) => void;
  setEnabled: (provider: AIProvider, enabled: boolean) => void;
  setPrimaryProvider: (provider: AIProvider) => void;
  setFallbackEnabled: (enabled: boolean) => void;
  setFallbackOrder: (order: AIProvider[]) => void;
  updateProviderConfig: (provider: AIProvider, config: Partial<AIProviderConfig>) => void;
  testConnection: (provider: AIProvider) => Promise<{ success: boolean; message: string }>;
  getActiveApiKey: (provider: AIProvider) => string;
  isProviderConfigured: (provider: AIProvider) => boolean;
}

// ============================================
// CONFIGURACIÓN POR DEFECTO
// ============================================

const DEFAULT_PROVIDERS: Record<AIProvider, AIProviderConfig> = {
  claude: {
    provider: 'claude',
    name: 'Claude (Anthropic)',
    apiKey: '',
    isConfigured: false,
    isEnabled: true,
    lastTested: null,
    lastTestResult: null,
    lastTestMessage: null,
    model: 'claude-sonnet-4-20250514',
    maxTokens: 4096,
    temperature: 0.7,
  },
  gemini: {
    provider: 'gemini',
    name: 'Gemini (Google)',
    apiKey: '',
    isConfigured: false,
    isEnabled: false,
    lastTested: null,
    lastTestResult: null,
    lastTestMessage: null,
    model: 'gemini-1.5-flash',
    maxTokens: 4096,
    temperature: 0.8,
  },
  openai: {
    provider: 'openai',
    name: 'GPT (OpenAI)',
    apiKey: '',
    isConfigured: false,
    isEnabled: false,
    lastTested: null,
    lastTestResult: null,
    lastTestMessage: null,
    model: 'gpt-4o-mini',
    maxTokens: 4096,
    temperature: 0.7,
  },
};

// ============================================
// FUNCIONES DE TEST DE CONEXIÓN
// ============================================

async function testClaudeConnection(apiKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 50,
        messages: [{ role: 'user', content: 'Responde solo "OK" para verificar conexion.' }],
      }),
    });

    if (response.ok) {
      return { success: true, message: 'Conexión exitosa con Claude API' };
    } else {
      const error = await response.json();
      return { success: false, message: error.error?.message || `Error ${response.status}` };
    }
  } catch (error: any) {
    return { success: false, message: error.message || 'Error de conexión' };
  }
}

async function testGeminiConnection(apiKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Responde solo "OK"' }] }],
        }),
      }
    );

    if (response.ok) {
      return { success: true, message: 'Conexión exitosa con Gemini API' };
    } else {
      const error = await response.json();
      return { success: false, message: error.error?.message || `Error ${response.status}` };
    }
  } catch (error: any) {
    return { success: false, message: error.message || 'Error de conexión' };
  }
}

async function testOpenAIConnection(apiKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 50,
        messages: [{ role: 'user', content: 'Responde solo "OK"' }],
      }),
    });

    if (response.ok) {
      return { success: true, message: 'Conexión exitosa con OpenAI API' };
    } else {
      const error = await response.json();
      return { success: false, message: error.error?.message || `Error ${response.status}` };
    }
  } catch (error: any) {
    return { success: false, message: error.message || 'Error de conexión' };
  }
}

// ============================================
// STORE DE CONFIGURACIÓN
// ============================================

export const useAIConfigStore = create<AIConfigState>()(
  persist(
    (set, get) => ({
      providers: { ...DEFAULT_PROVIDERS },
      primaryProvider: 'claude',
      fallbackEnabled: true,
      fallbackOrder: ['claude', 'gemini', 'openai'],

      setApiKey: (provider, apiKey) => {
        set((state) => ({
          providers: {
            ...state.providers,
            [provider]: {
              ...state.providers[provider],
              apiKey,
              isConfigured: apiKey.trim().length > 0,
              lastTested: null,
              lastTestResult: null,
              lastTestMessage: null,
            },
          },
        }));
      },

      setEnabled: (provider, enabled) => {
        set((state) => ({
          providers: {
            ...state.providers,
            [provider]: {
              ...state.providers[provider],
              isEnabled: enabled,
            },
          },
        }));
      },

      setPrimaryProvider: (provider) => {
        set({ primaryProvider: provider });
      },

      setFallbackEnabled: (enabled) => {
        set({ fallbackEnabled: enabled });
      },

      setFallbackOrder: (order) => {
        set({ fallbackOrder: order });
      },

      updateProviderConfig: (provider, config) => {
        set((state) => ({
          providers: {
            ...state.providers,
            [provider]: {
              ...state.providers[provider],
              ...config,
            },
          },
        }));
      },

      testConnection: async (provider) => {
        const config = get().providers[provider];

        if (!config.apiKey) {
          return { success: false, message: 'API Key no configurada' };
        }

        let result: { success: boolean; message: string };

        switch (provider) {
          case 'claude':
            result = await testClaudeConnection(config.apiKey);
            break;
          case 'gemini':
            result = await testGeminiConnection(config.apiKey);
            break;
          case 'openai':
            result = await testOpenAIConnection(config.apiKey);
            break;
          default:
            result = { success: false, message: 'Proveedor no soportado' };
        }

        set((state) => ({
          providers: {
            ...state.providers,
            [provider]: {
              ...state.providers[provider],
              lastTested: new Date(),
              lastTestResult: result.success ? 'success' : 'error',
              lastTestMessage: result.message,
            },
          },
        }));

        return result;
      },

      getActiveApiKey: (provider) => {
        const state = get();
        const config = state.providers[provider];

        // Primero intentar con la key almacenada
        if (config.apiKey) {
          return config.apiKey;
        }

        // Fallback a variables de entorno
        switch (provider) {
          case 'claude':
            return import.meta.env.VITE_ANTHROPIC_API_KEY || '';
          case 'gemini':
            return import.meta.env.VITE_GEMINI_API_KEY || '';
          case 'openai':
            return import.meta.env.VITE_OPENAI_API_KEY || '';
          default:
            return '';
        }
      },

      isProviderConfigured: (provider) => {
        const state = get();
        const config = state.providers[provider];

        // Verificar si hay key almacenada o en env
        if (config.apiKey) return true;

        switch (provider) {
          case 'claude':
            return !!import.meta.env.VITE_ANTHROPIC_API_KEY;
          case 'gemini':
            return !!import.meta.env.VITE_GEMINI_API_KEY;
          case 'openai':
            return !!import.meta.env.VITE_OPENAI_API_KEY;
          default:
            return false;
        }
      },
    }),
    {
      name: 'litper-ai-config',
      partialize: (state) => ({
        providers: state.providers,
        primaryProvider: state.primaryProvider,
        fallbackEnabled: state.fallbackEnabled,
        fallbackOrder: state.fallbackOrder,
      }),
    }
  )
);

// ============================================
// HELPER PARA OBTENER API KEY ACTIVA
// ============================================

export const getActiveAIApiKey = (provider: AIProvider): string => {
  return useAIConfigStore.getState().getActiveApiKey(provider);
};

export const isAIProviderConfigured = (provider: AIProvider): boolean => {
  return useAIConfigStore.getState().isProviderConfigured(provider);
};

export default useAIConfigStore;
