// services/integrations/IntegrationManager.ts
// Gestor central de todas las integraciones de IA y datos

import { ChateaProvider } from './providers/ChateaProvider';
import { ClaudeProvider } from './providers/ClaudeProvider';
import { BaseAIProvider } from './providers/BaseAIProvider';
import {
  AIProviderType,
  AIProviderConfig,
  AIFunction,
  DataConnectionConfig,
  AIFunctionAssignment,
  AIMessage,
  AIResponse,
  DEFAULT_AI_PROVIDERS,
  DEFAULT_DATA_CONNECTIONS,
  DEFAULT_FUNCTION_ASSIGNMENTS,
} from '../../types/integrations';

const STORAGE_KEY = 'litper_integrations';

class IntegrationManagerService {
  private providers: Map<AIProviderType, BaseAIProvider> = new Map();
  private aiConfigs: AIProviderConfig[] = [];
  private dataConnections: DataConnectionConfig[] = [];
  private functionAssignments: AIFunctionAssignment[] = [];
  private defaultProvider: AIProviderType = 'chatea';
  private initialized: boolean = false;

  constructor() {
    this.loadFromStorage();
  }

  // ==================== INICIALIZACIÓN ====================

  /**
   * Cargar configuración desde localStorage
   */
  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        this.aiConfigs = data.aiProviders || DEFAULT_AI_PROVIDERS;
        this.dataConnections = data.dataConnections || DEFAULT_DATA_CONNECTIONS;
        this.functionAssignments = data.functionAssignments || DEFAULT_FUNCTION_ASSIGNMENTS;
        this.defaultProvider = data.defaultProvider || 'chatea';
      } else {
        this.aiConfigs = [...DEFAULT_AI_PROVIDERS];
        this.dataConnections = [...DEFAULT_DATA_CONNECTIONS];
        this.functionAssignments = [...DEFAULT_FUNCTION_ASSIGNMENTS];
      }
    } catch (error) {
      console.error('[IntegrationManager] Error cargando configuración:', error);
      this.aiConfigs = [...DEFAULT_AI_PROVIDERS];
      this.dataConnections = [...DEFAULT_DATA_CONNECTIONS];
      this.functionAssignments = [...DEFAULT_FUNCTION_ASSIGNMENTS];
    }
  }

  /**
   * Guardar configuración en localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        aiProviders: this.aiConfigs,
        dataConnections: this.dataConnections,
        functionAssignments: this.functionAssignments,
        defaultProvider: this.defaultProvider,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('[IntegrationManager] Error guardando configuración:', error);
    }
  }

  /**
   * Inicializar todos los proveedores configurados
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('🔌 [IntegrationManager] Inicializando integraciones...');

    for (const config of this.aiConfigs) {
      if (config.enabled && config.apiKey) {
        await this.initializeProvider(config);
      }
    }

    this.initialized = true;
    console.log('🔌 [IntegrationManager] Integraciones inicializadas');
  }

  /**
   * Inicializar un proveedor específico
   */
  private async initializeProvider(config: AIProviderConfig): Promise<void> {
    try {
      let provider: BaseAIProvider;

      switch (config.id) {
        case 'chatea':
          provider = new ChateaProvider({
            apiKey: config.apiKey,
            baseUrl: config.baseUrl,
          });
          break;

        case 'claude':
          provider = new ClaudeProvider({
            apiKey: config.apiKey,
            baseUrl: config.baseUrl,
            model: config.model,
          });
          break;

        // Agregar más proveedores aquí...
        default:
          console.warn(`[IntegrationManager] Proveedor ${config.id} no soportado`);
          return;
      }

      // Probar conexión
      const connected = await provider.testConnection();
      config.isConnected = connected;
      config.lastCheck = new Date();

      if (connected) {
        this.providers.set(config.id, provider);
        console.log(`✅ [IntegrationManager] ${config.name} conectado`);
      } else {
        console.warn(`⚠️ [IntegrationManager] ${config.name} no se pudo conectar`);
      }

      this.saveToStorage();
    } catch (error) {
      console.error(`❌ [IntegrationManager] Error inicializando ${config.id}:`, error);
      config.isConnected = false;
      this.saveToStorage();
    }
  }

  // ==================== CONFIGURACIÓN DE PROVEEDORES ====================

  /**
   * Obtener todos los proveedores configurados
   */
  getAIProviders(): AIProviderConfig[] {
    return [...this.aiConfigs];
  }

  /**
   * Obtener un proveedor específico
   */
  getAIProvider(id: AIProviderType): AIProviderConfig | undefined {
    return this.aiConfigs.find((p) => p.id === id);
  }

  /**
   * Configurar API key de un proveedor
   */
  async setAPIKey(providerId: AIProviderType, apiKey: string): Promise<boolean> {
    const config = this.aiConfigs.find((p) => p.id === providerId);
    if (!config) return false;

    config.apiKey = apiKey;
    config.enabled = true;

    // Reinicializar el proveedor
    await this.initializeProvider(config);

    this.saveToStorage();
    return config.isConnected;
  }

  /**
   * Habilitar/deshabilitar un proveedor
   */
  async toggleProvider(providerId: AIProviderType, enabled: boolean): Promise<void> {
    const config = this.aiConfigs.find((p) => p.id === providerId);
    if (!config) return;

    config.enabled = enabled;

    if (enabled && config.apiKey) {
      await this.initializeProvider(config);
    } else {
      this.providers.delete(providerId);
      config.isConnected = false;
    }

    this.saveToStorage();
  }

  /**
   * Probar conexión de un proveedor
   */
  async testProvider(providerId: AIProviderType): Promise<boolean> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      const config = this.aiConfigs.find((p) => p.id === providerId);
      if (config && config.apiKey) {
        await this.initializeProvider(config);
        return config.isConnected;
      }
      return false;
    }

    const connected = await provider.testConnection();
    const config = this.aiConfigs.find((p) => p.id === providerId);
    if (config) {
      config.isConnected = connected;
      config.lastCheck = new Date();
      this.saveToStorage();
    }

    return connected;
  }

  // ==================== CONEXIONES DE DATOS ====================

  /**
   * Obtener todas las conexiones de datos
   */
  getDataConnections(): DataConnectionConfig[] {
    return [...this.dataConnections];
  }

  /**
   * Configurar conexión de datos
   */
  async setDataConnection(id: string, config: Partial<DataConnectionConfig>): Promise<boolean> {
    const conn = this.dataConnections.find((c) => c.id === id);
    if (!conn) return false;

    Object.assign(conn, config);
    this.saveToStorage();

    // Probar conexión si hay API key
    if (conn.apiKey) {
      // Aquí iría la lógica de probar la conexión
      conn.isConnected = true;
      conn.lastSync = new Date();
      this.saveToStorage();
    }

    return true;
  }

  // ==================== ASIGNACIÓN DE FUNCIONES ====================

  /**
   * Obtener asignaciones de funciones
   */
  getFunctionAssignments(): AIFunctionAssignment[] {
    return [...this.functionAssignments];
  }

  /**
   * Asignar proveedor a una función
   */
  setFunctionProvider(func: AIFunction, providerId: AIProviderType): void {
    const assignment = this.functionAssignments.find((a) => a.function === func);
    if (assignment) {
      assignment.assignedProvider = providerId;
      this.saveToStorage();
    }
  }

  /**
   * Obtener proveedor asignado a una función
   */
  getProviderForFunction(func: AIFunction): AIProviderType {
    const assignment = this.functionAssignments.find((a) => a.function === func);
    return assignment?.assignedProvider || this.defaultProvider;
  }

  // ==================== CHAT Y COMANDOS ====================

  /**
   * Enviar mensaje al chat (usa el proveedor de chat_principal)
   */
  async chat(messages: AIMessage[], func: AIFunction = 'chat_principal'): Promise<AIResponse> {
    const providerId = this.getProviderForFunction(func);
    const provider = this.providers.get(providerId);

    if (!provider) {
      // Intentar con fallback o proveedor disponible
      const availableProvider = this.getFirstAvailableProvider();
      if (!availableProvider) {
        return {
          content: '❌ No hay proveedores de IA configurados. Ve a Configuración > Integraciones para agregar uno.',
          provider: 'chatea',
          latency: 0,
          timestamp: new Date(),
        };
      }
      return availableProvider.chat({ messages });
    }

    return provider.chat({ messages });
  }

  /**
   * Procesar comando en lenguaje natural
   */
  async processCommand(
    command: string,
    context?: Record<string, unknown>
  ): Promise<{
    intent: 'query' | 'action' | 'config' | 'skill' | 'unknown';
    action?: string;
    params?: Record<string, unknown>;
    response: string;
    confidence: number;
    provider: AIProviderType;
  }> {
    // Primero intentar con Chatea (optimizado para comandos)
    const chateaProvider = this.providers.get('chatea') as ChateaProvider;
    if (chateaProvider) {
      const result = await chateaProvider.processCommand(command, context);
      return { ...result, provider: 'chatea' };
    }

    // Si no hay Chatea, usar Claude
    const claudeProvider = this.providers.get('claude') as ClaudeProvider;
    if (claudeProvider) {
      const result = await claudeProvider.processCommand(command, context);
      return { ...result, provider: 'claude' };
    }

    // Sin proveedores
    return {
      intent: 'unknown',
      response: '❌ No hay proveedores de IA configurados.',
      confidence: 0,
      provider: 'chatea',
    };
  }

  /**
   * Analizar datos (usa el proveedor de analisis_datos)
   */
  async analyzeData(data: unknown, prompt: string): Promise<string> {
    const providerId = this.getProviderForFunction('analisis_datos');
    const provider = this.providers.get(providerId);

    if (!provider) {
      return '❌ No hay proveedor de análisis configurado.';
    }

    return provider.analyzeData(data, prompt);
  }

  // ==================== UTILIDADES ====================

  /**
   * Obtener primer proveedor disponible
   */
  private getFirstAvailableProvider(): BaseAIProvider | null {
    for (const [, provider] of this.providers) {
      return provider;
    }
    return null;
  }

  /**
   * Obtener proveedor de Chatea
   */
  getChateaProvider(): ChateaProvider | null {
    return (this.providers.get('chatea') as ChateaProvider) || null;
  }

  /**
   * Obtener proveedor de Claude
   */
  getClaudeProvider(): ClaudeProvider | null {
    return (this.providers.get('claude') as ClaudeProvider) || null;
  }

  /**
   * Verificar si hay al menos un proveedor configurado
   */
  hasAnyProvider(): boolean {
    return this.providers.size > 0;
  }

  /**
   * Obtener estado de todas las integraciones
   */
  getStatus(): {
    aiProviders: { total: number; connected: number };
    dataConnections: { total: number; connected: number };
    ready: boolean;
  } {
    const aiConnected = this.aiConfigs.filter((p) => p.isConnected).length;
    const dataConnected = this.dataConnections.filter((c) => c.isConnected).length;

    return {
      aiProviders: {
        total: this.aiConfigs.length,
        connected: aiConnected,
      },
      dataConnections: {
        total: this.dataConnections.length,
        connected: dataConnected,
      },
      ready: aiConnected > 0,
    };
  }

  /**
   * Resetear toda la configuración
   */
  reset(): void {
    this.providers.clear();
    this.aiConfigs = [...DEFAULT_AI_PROVIDERS];
    this.dataConnections = [...DEFAULT_DATA_CONNECTIONS];
    this.functionAssignments = [...DEFAULT_FUNCTION_ASSIGNMENTS];
    this.defaultProvider = 'chatea';
    this.initialized = false;
    localStorage.removeItem(STORAGE_KEY);
  }
}

// Singleton
export const integrationManager = new IntegrationManagerService();
export default integrationManager;
