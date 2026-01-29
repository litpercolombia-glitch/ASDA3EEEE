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

// Las API keys se cargan desde localStorage (guardadas por el usuario en el panel de configuración)
// o desde variables de entorno como fallback

// ============================================
// API KEYS - Se cargan desde localStorage o env
// Las keys se configuran en el panel de configuración
// ============================================
const LITPER_DEFAULT_KEYS = {
  claude: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
  gemini: import.meta.env.VITE_GEMINI_API_KEY || '',
  openai: import.meta.env.VITE_OPENAI_API_KEY || '',
  chateaPro: import.meta.env.VITE_CHATEA_PRO_KEY || '',
};

const DEFAULT_PROVIDERS: Record<AIProvider, AIProviderConfig> = {
  claude: {
    provider: 'claude',
    name: 'Claude (Anthropic)',
    apiKey: LITPER_DEFAULT_KEYS.claude,
    isConfigured: !!LITPER_DEFAULT_KEYS.claude,
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
    apiKey: LITPER_DEFAULT_KEYS.gemini,
    isConfigured: !!LITPER_DEFAULT_KEYS.gemini,
    isEnabled: true,
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
    apiKey: LITPER_DEFAULT_KEYS.openai,
    isConfigured: !!LITPER_DEFAULT_KEYS.openai,
    isEnabled: true,
    lastTested: null,
    lastTestResult: null,
    lastTestMessage: null,
    model: 'gpt-4o-mini',
    maxTokens: 4096,
    temperature: 0.7,
  },
};

// Exportar API key de Chatea Pro
export const CHATEA_PRO_API_KEY = LITPER_DEFAULT_KEYS.chateaPro;

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
    // Usar gemini-1.5-flash que es el modelo actual estable
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
      name: 'litper-ai-config-v2',
      version: 2,
      partialize: (state) => ({
        providers: state.providers,
        primaryProvider: state.primaryProvider,
        fallbackEnabled: state.fallbackEnabled,
        fallbackOrder: state.fallbackOrder,
      }),
      // Migración para preservar datos existentes
      migrate: (persistedState: any, version: number) => {
        if (version === 0 || version === 1) {
          // Migrar de versión antigua - preservar las API keys
          console.log('[AI Config] Migrando configuración de versión', version);
          return persistedState;
        }
        return persistedState;
      },
      // Merge estratégico: preferir valores persistidos sobre defaults
      merge: (persistedState: any, currentState: any) => {
        if (!persistedState) return currentState;

        // Merge providers preservando API keys guardadas
        const mergedProviders = { ...currentState.providers };
        if (persistedState.providers) {
          Object.keys(persistedState.providers).forEach((key) => {
            if (persistedState.providers[key]?.apiKey) {
              mergedProviders[key] = {
                ...currentState.providers[key],
                ...persistedState.providers[key],
              };
            }
          });
        }

        return {
          ...currentState,
          ...persistedState,
          providers: mergedProviders,
        };
      },
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

// ============================================
// INICIALIZACIÓN AUTOMÁTICA DESDE ENV
// ============================================

/**
 * Inicializa las API keys desde variables de entorno si no están configuradas
 * Llamar esta función al iniciar la app
 */
export const initializeAIConfigFromEnv = (): void => {
  const store = useAIConfigStore.getState();

  // Claude
  const claudeEnvKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (claudeEnvKey && !store.providers.claude.apiKey) {
    store.setApiKey('claude', claudeEnvKey);
  }

  // Gemini
  const geminiEnvKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (geminiEnvKey && !store.providers.gemini.apiKey) {
    store.setApiKey('gemini', geminiEnvKey);
  }

  // OpenAI
  const openaiEnvKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (openaiEnvKey && !store.providers.openai.apiKey) {
    store.setApiKey('openai', openaiEnvKey);
  }

  console.log('[AI Config] Initialized from environment variables');
};

// Migrar datos del localStorage antiguo al nuevo
const migrateOldLocalStorage = () => {
  try {
    // Intentar cargar del storage antiguo
    const oldKey = 'litper-ai-config';
    const oldData = localStorage.getItem(oldKey);
    const newKey = 'litper-ai-config-v2';
    const newData = localStorage.getItem(newKey);

    if (oldData && !newData) {
      console.log('[AI Config] Migrando datos del localStorage antiguo...');
      const parsed = JSON.parse(oldData);
      if (parsed.state?.providers) {
        // Copiar al nuevo formato
        localStorage.setItem(newKey, JSON.stringify({
          state: parsed.state,
          version: 2,
        }));
        console.log('[AI Config] ✅ Migración completada');
      }
    }
  } catch (e) {
    console.warn('[AI Config] Error en migración:', e);
  }
};

// Auto-inicializar cuando se importa el módulo
if (typeof window !== 'undefined') {
  // Primero migrar datos antiguos
  migrateOldLocalStorage();

  // Ejecutar después de que el store se hidrate desde localStorage
  setTimeout(() => {
    initializeAIConfigFromEnv();

    // Log para debugging
    const state = useAIConfigStore.getState();
    const configuredProviders = Object.entries(state.providers)
      .filter(([_, config]) => config.apiKey)
      .map(([name]) => name);
    if (configuredProviders.length > 0) {
      console.log('[AI Config] ✅ Proveedores configurados:', configuredProviders.join(', '));
    } else {
      console.log('[AI Config] ⚠️ No hay API keys configuradas. Configurar en Modo Admin > API Keys');
    }
  }, 100);
}

export default useAIConfigStore;
