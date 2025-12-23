/**
 * Brain Dashboard Service
 * ========================
 * Servicio para conectar el Dashboard React con el backend del Cerebro IA.
 *
 * Conecta con:
 * - /api/brain/* - Cerebro IA (Gemini, Claude, OpenAI)
 * - /api/chatea-pro/* - Integracion Chatea Pro/Dropi/N8N
 *
 * USO:
 *   import { brainDashboardService } from '@/services/brainDashboardService';
 *
 *   // Obtener estado del cerebro
 *   const status = await brainDashboardService.getBrainStatus();
 *
 *   // Analizar con IA
 *   const analysis = await brainDashboardService.analyze("Pedido retrasado...");
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ============================================================================
// TIPOS
// ============================================================================

export interface BrainStatus {
  status: string;
  providers: {
    gemini: { available: boolean; model: string; cost: string };
    claude: { available: boolean; model: string; cost: string };
    openai: { available: boolean; model: string; cost: string };
  };
  default_provider: string;
  active_providers: number;
}

export interface WebhookEvent {
  id: string;
  event: string;
  data: Record<string, any>;
  source: string;
  timestamp: string;
  processed: boolean;
}

export interface AnalyticsSummary {
  total_events: number;
  events_by_type: Record<string, number>;
  critical_events_count: number;
  recent_critical: WebhookEvent[];
}

export interface AIAnalysis {
  success: boolean;
  analysis?: string;
  error?: string;
  timestamp: string;
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  order_id?: string;
  timestamp: string;
}

// ============================================================================
// SERVICIO
// ============================================================================

class BrainDashboardService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE;
  }

  // --------------------------------------------------------------------------
  // CEREBRO IA
  // --------------------------------------------------------------------------

  /**
   * Obtiene el estado del cerebro y proveedores disponibles.
   */
  async getBrainStatus(): Promise<BrainStatus> {
    const response = await fetch(`${this.baseUrl}/api/brain/status`);
    if (!response.ok) throw new Error('Error obteniendo estado del cerebro');
    return response.json();
  }

  /**
   * Realiza una pregunta al cerebro.
   */
  async think(question: string, provider?: 'gemini' | 'claude' | 'openai'): Promise<AIAnalysis> {
    const url = new URL(`${this.baseUrl}/api/brain/think`);
    if (provider) url.searchParams.set('provider', provider);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, role: 'brain' })
    });

    return response.json();
  }

  /**
   * Solicita una decision al cerebro.
   */
  async decide(situation: string, options?: string[], urgency: string = 'normal'): Promise<AIAnalysis> {
    const response = await fetch(`${this.baseUrl}/api/brain/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ situation, options, urgency })
    });

    return response.json();
  }

  /**
   * Genera un mensaje para el cliente.
   */
  async generateMessage(
    customerName: string,
    situation: string,
    tone: 'formal' | 'friendly' | 'urgent' = 'friendly'
  ): Promise<{ success: boolean; data: { message: string } }> {
    const response = await fetch(`${this.baseUrl}/api/brain/generate-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: customerName,
        situation,
        tone,
        channel: 'whatsapp'
      })
    });

    return response.json();
  }

  /**
   * Compara respuestas de todos los proveedores.
   */
  async compareProviders(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/brain/compare`);
    return response.json();
  }

  // --------------------------------------------------------------------------
  // CHATEA PRO / WEBHOOKS
  // --------------------------------------------------------------------------

  /**
   * Obtiene el estado de la integracion con Chatea Pro.
   */
  async getChateaProStatus(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/chatea-pro/status`);
    return response.json();
  }

  /**
   * Obtiene historial de eventos recibidos.
   */
  async getEventHistory(limit: number = 50): Promise<{ events: WebhookEvent[] }> {
    const response = await fetch(`${this.baseUrl}/api/chatea-pro/history?limit=${limit}`);
    return response.json();
  }

  /**
   * Obtiene resumen de analytics.
   */
  async getAnalyticsSummary(): Promise<{ summary: AnalyticsSummary }> {
    const response = await fetch(`${this.baseUrl}/api/chatea-pro/analytics/summary`);
    return response.json();
  }

  /**
   * Obtiene insights generados por IA.
   */
  async getAIInsights(): Promise<{ insights: string }> {
    const response = await fetch(`${this.baseUrl}/api/chatea-pro/analytics/ai-insights`);
    return response.json();
  }

  /**
   * Envia un mensaje de WhatsApp via Chatea Pro.
   */
  async sendWhatsAppMessage(phone: string, message: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/chatea-pro/send-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message })
    });

    return response.json();
  }

  /**
   * Envia una alerta a N8N.
   */
  async sendAlert(title: string, message: string, severity: string = 'warning', orderId?: string): Promise<any> {
    const url = new URL(`${this.baseUrl}/api/chatea-pro/send-alert`);
    url.searchParams.set('title', title);
    url.searchParams.set('message', message);
    url.searchParams.set('severity', severity);
    if (orderId) url.searchParams.set('order_id', orderId);

    const response = await fetch(url.toString(), { method: 'POST' });
    return response.json();
  }

  /**
   * Analiza una situacion con IA.
   */
  async analyze(context: string, includeRecommendation: boolean = true): Promise<AIAnalysis> {
    const response = await fetch(`${this.baseUrl}/api/chatea-pro/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context,
        include_recommendation: includeRecommendation
      })
    });

    return response.json();
  }

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------

  /**
   * Verifica si el backend esta disponible.
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Exportar instancia singleton
export const brainDashboardService = new BrainDashboardService();
export default brainDashboardService;
