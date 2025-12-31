/**
 * AI Brain Dashboard - Panel Completo del Cerebro Autonomo
 * =========================================================
 *
 * Dashboard completo que integra:
 * - Estado del cerebro (Gemini, Claude, OpenAI)
 * - Monitor de webhooks Chatea Pro / N8N
 * - Analytics con IA
 * - Chat con el cerebro
 * - Envio de mensajes WhatsApp
 *
 * UBICACION: components/brain/AIBrainDashboard.tsx
 *
 * USO:
 *   import { AIBrainDashboard } from '@/components/brain/AIBrainDashboard';
 *   <AIBrainDashboard />
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Brain, Zap, MessageCircle, Bell, Activity, RefreshCw,
  Send, AlertTriangle, CheckCircle, XCircle, Clock,
  TrendingUp, Users, Package, Wifi, WifiOff, Sparkles,
  ChevronRight, BarChart3, Settings, Bot, Loader2,
  Phone, MessageSquare, Eye, Filter, Target
} from 'lucide-react';

// ============================================================================
// CONFIGURACION
// ============================================================================

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ============================================================================
// TIPOS
// ============================================================================

interface BrainStatus {
  status: string;
  providers: {
    gemini: { available: boolean; model: string; cost: string };
    claude: { available: boolean; model: string; cost: string };
    openai: { available: boolean; model: string; cost: string };
  };
  default_provider: string;
  active_providers: number;
}

interface WebhookEvent {
  id: string;
  event: string;
  data: Record<string, any>;
  source: string;
  timestamp: string;
  processed: boolean;
}

interface AnalyticsSummary {
  total_events: number;
  events_by_type: Record<string, number>;
  critical_events_count: number;
  recent_critical: WebhookEvent[];
}

type TabType = 'overview' | 'events' | 'analytics' | 'chat' | 'whatsapp';

// ============================================================================
// API HELPERS
// ============================================================================

const api = {
  async getBrainStatus(): Promise<BrainStatus | null> {
    try {
      const res = await fetch(`${API_BASE}/api/brain/status`);
      return res.ok ? res.json() : null;
    } catch { return null; }
  },

  async getChateaStatus(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/chatea-pro/status`);
      return res.ok ? res.json() : null;
    } catch { return null; }
  },

  async getEvents(limit = 30): Promise<WebhookEvent[]> {
    try {
      const res = await fetch(`${API_BASE}/api/chatea-pro/history?limit=${limit}`);
      const data = await res.json();
      return data.events || [];
    } catch { return []; }
  },

  async getAnalytics(): Promise<AnalyticsSummary | null> {
    try {
      const res = await fetch(`${API_BASE}/api/chatea-pro/analytics/summary`);
      const data = await res.json();
      return data.summary || null;
    } catch { return null; }
  },

  async think(question: string): Promise<string> {
    try {
      const res = await fetch(`${API_BASE}/api/brain/think`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, role: 'brain' })
      });
      const data = await res.json();
      return data.data?.response || 'Sin respuesta';
    } catch { return 'Error al procesar'; }
  },

  async analyze(context: string): Promise<string> {
    try {
      const res = await fetch(`${API_BASE}/api/chatea-pro/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, include_recommendation: true })
      });
      const data = await res.json();
      return data.analysis || 'Sin analisis';
    } catch { return 'Error al analizar'; }
  },

  async getInsights(): Promise<string> {
    try {
      const res = await fetch(`${API_BASE}/api/chatea-pro/analytics/ai-insights`);
      const data = await res.json();
      return data.insights || 'No hay suficientes datos';
    } catch { return 'Error obteniendo insights'; }
  },

  async sendWhatsApp(phone: string, message: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/api/chatea-pro/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message })
      });
      const data = await res.json();
      return data.success;
    } catch { return false; }
  },

  async generateMessage(name: string, situation: string): Promise<string> {
    try {
      const res = await fetch(`${API_BASE}/api/brain/generate-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name,
          situation,
          tone: 'friendly',
          channel: 'whatsapp'
        })
      });
      const data = await res.json();
      return data.data?.message || 'Error generando mensaje';
    } catch { return 'Error'; }
  }
};

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

const StatusBadge: React.FC<{ active: boolean; label: string }> = ({ active, label }) => (
  <div className="flex items-center gap-2">
    <div className={`w-2.5 h-2.5 rounded-full ${active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
    <span className="text-white text-sm">{label}</span>
  </div>
);

const StatCard: React.FC<{ icon: any; label: string; value: string | number; color: string }> = ({
  icon: Icon, label, value, color
}) => (
  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
    <div className="flex items-center justify-between mb-2">
      <span className="text-white/60 text-sm">{label}</span>
      <Icon className={`w-5 h-5 ${color}`} />
    </div>
    <p className="text-2xl font-bold text-white">{value}</p>
  </div>
);

const EventRow: React.FC<{ event: WebhookEvent }> = ({ event }) => {
  const getColor = (type: string) => {
    if (type.includes('delay') || type.includes('fail')) return 'bg-red-500';
    if (type.includes('delivery') || type.includes('confirm')) return 'bg-green-500';
    if (type.includes('message') || type.includes('customer')) return 'bg-blue-500';
    return 'bg-yellow-500';
  };

  return (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${getColor(event.event)}`} />
        <div>
          <p className="text-white text-sm font-medium">{event.event}</p>
          <p className="text-white/40 text-xs">{event.source}</p>
        </div>
      </div>
      <span className="text-white/40 text-xs">
        {new Date(event.timestamp).toLocaleTimeString()}
      </span>
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const AIBrainDashboard: React.FC = () => {
  // Estado
  const [brainStatus, setBrainStatus] = useState<BrainStatus | null>(null);
  const [chateaStatus, setChateaStatus] = useState<any>(null);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Tab activo
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Chat
  const [chatInput, setChatInput] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // WhatsApp
  const [waPhone, setWaPhone] = useState('');
  const [waMessage, setWaMessage] = useState('');
  const [waSending, setWaSending] = useState(false);
  const [waResult, setWaResult] = useState<string | null>(null);

  // Analytics
  const [insights, setInsights] = useState('');
  const [insightsLoading, setInsightsLoading] = useState(false);

  // Cargar datos
  const loadData = useCallback(async () => {
    setLoading(true);
    const [brain, chatea, evts, stats] = await Promise.all([
      api.getBrainStatus(),
      api.getChateaStatus(),
      api.getEvents(30),
      api.getAnalytics()
    ]);
    setBrainStatus(brain);
    setChateaStatus(chatea);
    setEvents(evts);
    setAnalytics(stats);
    setLastUpdate(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Handlers
  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatLoading(true);
    const response = await api.think(chatInput);
    setChatResponse(response);
    setChatLoading(false);
  };

  const handleSendWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waPhone.trim() || !waMessage.trim()) return;
    setWaSending(true);
    const success = await api.sendWhatsApp(waPhone, waMessage);
    setWaResult(success ? 'Mensaje enviado!' : 'Error al enviar');
    setWaSending(false);
    setTimeout(() => setWaResult(null), 3000);
  };

  const handleGenerateMessage = async () => {
    const name = prompt('Nombre del cliente:');
    const situation = prompt('Situacion (ej: pedido retrasado):');
    if (name && situation) {
      const msg = await api.generateMessage(name, situation);
      setWaMessage(msg);
    }
  };

  const handleGetInsights = async () => {
    setInsightsLoading(true);
    const result = await api.getInsights();
    setInsights(result);
    setInsightsLoading(false);
  };

  // Tabs config
  const tabs = [
    { id: 'overview', label: 'General', icon: Activity },
    { id: 'events', label: 'Eventos', icon: Bell },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'chat', label: 'Chat IA', icon: MessageCircle },
    { id: 'whatsapp', label: 'WhatsApp', icon: Phone },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-4 md:p-6">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Cerebro Autonomo IA</h1>
              <p className="text-white/50 text-sm">Litper Pro - Dashboard Inteligente</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lastUpdate && (
              <span className="text-white/40 text-xs hidden md:block">
                {lastUpdate.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm">{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* TAB: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Brain}
              label="Estado Cerebro"
              value={brainStatus?.status === 'active' ? 'Activo' : 'Cargando'}
              color="text-purple-400"
            />
            <StatCard
              icon={Zap}
              label="Proveedores IA"
              value={brainStatus?.active_providers || 0}
              color="text-yellow-400"
            />
            <StatCard
              icon={Bell}
              label="Eventos Hoy"
              value={analytics?.total_events || 0}
              color="text-blue-400"
            />
            <StatCard
              icon={AlertTriangle}
              label="Criticos"
              value={analytics?.critical_events_count || 0}
              color="text-red-400"
            />
          </div>

          {/* Providers */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple-400" />
              Proveedores de IA Configurados
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {brainStatus?.providers && Object.entries(brainStatus.providers).map(([name, p]) => (
                <div
                  key={name}
                  className={`p-4 rounded-lg border transition-all ${
                    p.available
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-white/5 border-white/10 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium capitalize">{name}</span>
                    {p.available ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-white/30" />
                    )}
                  </div>
                  <p className="text-white/60 text-sm">{p.model}</p>
                  <p className={`text-sm mt-1 font-medium ${
                    p.cost === 'GRATIS' ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {p.cost}
                  </p>
                  {name === brainStatus.default_provider && (
                    <span className="inline-block mt-2 px-2 py-0.5 bg-purple-500 text-white text-xs rounded">
                      Por defecto
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Events */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-400" />
              Eventos Recientes
            </h3>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {events.length > 0 ? (
                events.slice(0, 8).map((evt, i) => <EventRow key={evt.id || i} event={evt} />)
              ) : (
                <p className="text-white/40 text-center py-8">No hay eventos recientes</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: Events */}
      {activeTab === 'events' && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <h3 className="text-white font-semibold mb-4">Historial Completo de Eventos</h3>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto">
            {events.map((evt, i) => (
              <div key={evt.id || i} className="p-4 bg-white/5 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-white font-medium">{evt.event}</span>
                  <span className="text-white/40 text-xs">{new Date(evt.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-white/50 text-sm">Fuente: {evt.source}</p>
                <details className="mt-2">
                  <summary className="text-purple-400 text-sm cursor-pointer">Ver datos</summary>
                  <pre className="mt-2 text-xs text-white/40 bg-black/30 p-2 rounded overflow-x-auto">
                    {JSON.stringify(evt.data, null, 2)}
                  </pre>
                </details>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Events by Type */}
          {analytics?.events_by_type && Object.keys(analytics.events_by_type).length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(analytics.events_by_type).map(([type, count]) => (
                <div key={type} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <p className="text-white/60 text-xs mb-1 truncate">{type}</p>
                  <p className="text-2xl font-bold text-white">{count}</p>
                </div>
              ))}
            </div>
          )}

          {/* AI Insights */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Insights con IA
              </h3>
              <button
                onClick={handleGetInsights}
                disabled={insightsLoading}
                className="px-4 py-2 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 disabled:opacity-50 flex items-center gap-2"
              >
                {insightsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generar
              </button>
            </div>
            {insights ? (
              <div className="bg-black/30 rounded-lg p-4">
                <pre className="text-white/80 text-sm whitespace-pre-wrap">{insights}</pre>
              </div>
            ) : (
              <p className="text-white/40 text-center py-8">
                Haz clic en "Generar" para obtener insights basados en los eventos
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB: Chat */}
      {activeTab === 'chat' && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-purple-400" />
            Chat con el Cerebro IA
          </h3>

          {chatResponse && (
            <div className="mb-4 p-4 bg-purple-500/20 border border-purple-500/30 rounded-lg">
              <p className="text-white/50 text-xs mb-2">Respuesta:</p>
              <p className="text-white whitespace-pre-wrap">{chatResponse}</p>
            </div>
          )}

          <form onSubmit={handleChat} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Pregunta algo al cerebro..."
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={chatLoading}
              className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
            >
              {chatLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              'Cual es el estado de los envios?',
              'Analiza los retrasos recientes',
              'Que transportadora tiene mas problemas?'
            ].map((s, i) => (
              <button
                key={i}
                onClick={() => setChatInput(s)}
                className="px-3 py-1.5 bg-white/10 text-white/70 text-sm rounded-full hover:bg-white/20"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TAB: WhatsApp */}
      {activeTab === 'whatsapp' && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-green-400" />
            Enviar WhatsApp via Chatea Pro
          </h3>

          {waResult && (
            <div className={`mb-4 p-3 rounded-lg ${
              waResult.includes('enviado') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {waResult}
            </div>
          )}

          <form onSubmit={handleSendWhatsApp} className="space-y-4">
            <div>
              <label className="text-white/60 text-sm mb-1 block">Telefono (con codigo pais)</label>
              <input
                type="text"
                value={waPhone}
                onChange={(e) => setWaPhone(e.target.value)}
                placeholder="+573001234567"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label className="text-white/60 text-sm mb-1 block">Mensaje</label>
              <textarea
                value={waMessage}
                onChange={(e) => setWaMessage(e.target.value)}
                placeholder="Escribe el mensaje..."
                rows={4}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-green-500 resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleGenerateMessage}
                className="px-4 py-2 bg-purple-500/50 text-white rounded-lg hover:bg-purple-500"
              >
                <Sparkles className="w-4 h-4 inline mr-2" />
                Generar con IA
              </button>

              <button
                type="submit"
                disabled={waSending}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {waSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Enviar WhatsApp
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AIBrainDashboard;
