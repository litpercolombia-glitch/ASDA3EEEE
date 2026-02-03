'use client';

import React, { useState, useEffect } from 'react';
import {
  Webhook,
  Plus,
  Play,
  Pause,
  RefreshCw,
  Trash2,
  Edit,
  Copy,
  Check,
  X,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Code,
  Search,
  Filter,
  Settings,
  Send,
  History,
  Zap,
  Globe,
  Lock,
  Eye,
  EyeOff,
  FileText,
  Download,
  RotateCcw,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';

// ============================================
// WEBHOOKS CENTER - ESTILO STRIPE
// Gestión de webhooks con logs, retry, templates
// ============================================

type WebhookStatus = 'active' | 'paused' | 'failing' | 'disabled';
type EventStatus = 'success' | 'failed' | 'pending' | 'retrying';

interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  secret: string;
  status: WebhookStatus;
  events: string[];
  createdAt: Date;
  lastTriggered?: Date;
  successRate: number;
  totalDeliveries: number;
  failedDeliveries: number;
  headers?: Record<string, string>;
  retryPolicy: {
    maxRetries: number;
    retryDelay: number; // seconds
  };
}

interface WebhookEvent {
  id: string;
  webhookId: string;
  eventType: string;
  status: EventStatus;
  statusCode?: number;
  timestamp: Date;
  requestPayload: any;
  responseBody?: string;
  duration?: number; // ms
  attempts: number;
  maxAttempts: number;
  nextRetry?: Date;
  error?: string;
}

interface WebhookTemplate {
  id: string;
  name: string;
  description: string;
  events: string[];
  samplePayload: any;
  icon: string;
}

// Event types disponibles
const eventTypes = [
  { category: 'Facturas', events: ['invoice.created', 'invoice.paid', 'invoice.overdue', 'invoice.cancelled'] },
  { category: 'Pagos', events: ['payment.received', 'payment.failed', 'payment.refunded'] },
  { category: 'Clientes', events: ['customer.created', 'customer.updated', 'customer.deleted'] },
  { category: 'Gastos', events: ['expense.created', 'expense.approved', 'expense.rejected'] },
  { category: 'Nómina', events: ['payroll.processed', 'payroll.approved', 'payroll.paid'] },
  { category: 'Sistema', events: ['system.alert', 'system.backup', 'user.login', 'user.logout'] },
];

// Templates predefinidos
const webhookTemplates: WebhookTemplate[] = [
  {
    id: 'slack',
    name: 'Slack Notifications',
    description: 'Envía notificaciones a un canal de Slack',
    events: ['invoice.paid', 'payment.received', 'system.alert'],
    samplePayload: { text: '{{event.description}}', channel: '#notifications' },
    icon: '💬',
  },
  {
    id: 'zapier',
    name: 'Zapier Integration',
    description: 'Conecta con más de 5000 apps vía Zapier',
    events: ['invoice.created', 'customer.created', 'expense.created'],
    samplePayload: { event: '{{event.type}}', data: '{{event.data}}' },
    icon: '⚡',
  },
  {
    id: 'custom-api',
    name: 'Custom API',
    description: 'Envía eventos a tu API personalizada',
    events: [],
    samplePayload: { event_type: '{{event.type}}', timestamp: '{{event.timestamp}}', payload: '{{event.data}}' },
    icon: '🔧',
  },
  {
    id: 'email-service',
    name: 'Email Service',
    description: 'Integración con servicios de email (SendGrid, Mailgun)',
    events: ['invoice.created', 'invoice.overdue', 'payment.received'],
    samplePayload: { to: '{{customer.email}}', template: '{{event.type}}', data: '{{event.data}}' },
    icon: '📧',
  },
  {
    id: 'accounting',
    name: 'Accounting Software',
    description: 'Sincroniza con software contable (QuickBooks, Xero)',
    events: ['invoice.paid', 'expense.approved', 'payroll.processed'],
    samplePayload: { transaction: '{{event.data}}', source: 'litper' },
    icon: '📊',
  },
];

// Mock data
const generateMockWebhooks = (): WebhookEndpoint[] => [
  {
    id: 'wh_1',
    name: 'Slack Notifications',
    url: 'https://hooks.slack.com/services/T00000/B00000/XXXXXXXX',
    secret: 'whsec_1234567890abcdef',
    status: 'active',
    events: ['invoice.paid', 'payment.received'],
    createdAt: new Date('2025-01-15'),
    lastTriggered: new Date(Date.now() - 3600000),
    successRate: 98.5,
    totalDeliveries: 156,
    failedDeliveries: 2,
    retryPolicy: { maxRetries: 3, retryDelay: 60 },
  },
  {
    id: 'wh_2',
    name: 'Zapier - New Invoices',
    url: 'https://hooks.zapier.com/hooks/catch/123456/abcdef/',
    secret: 'whsec_abcdef123456',
    status: 'active',
    events: ['invoice.created', 'invoice.overdue'],
    createdAt: new Date('2025-01-20'),
    lastTriggered: new Date(Date.now() - 7200000),
    successRate: 100,
    totalDeliveries: 89,
    failedDeliveries: 0,
    retryPolicy: { maxRetries: 5, retryDelay: 120 },
  },
  {
    id: 'wh_3',
    name: 'ERP Integration',
    url: 'https://api.empresa.com/webhooks/litper',
    secret: 'whsec_enterprise2025',
    status: 'failing',
    events: ['expense.approved', 'payroll.processed'],
    createdAt: new Date('2025-01-10'),
    lastTriggered: new Date(Date.now() - 300000),
    successRate: 45.2,
    totalDeliveries: 42,
    failedDeliveries: 23,
    retryPolicy: { maxRetries: 3, retryDelay: 30 },
  },
];

const generateMockEvents = (): WebhookEvent[] => {
  const webhooks = ['wh_1', 'wh_2', 'wh_3'];
  const types = ['invoice.paid', 'payment.received', 'invoice.created', 'expense.approved'];
  const statuses: EventStatus[] = ['success', 'failed', 'pending', 'retrying'];

  return Array.from({ length: 20 }, (_, i) => ({
    id: `evt_${i + 1}`,
    webhookId: webhooks[Math.floor(Math.random() * webhooks.length)],
    eventType: types[Math.floor(Math.random() * types.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    statusCode: Math.random() > 0.3 ? 200 : [400, 500, 502, 503][Math.floor(Math.random() * 4)],
    timestamp: new Date(Date.now() - Math.random() * 86400000 * 3),
    requestPayload: { event: types[Math.floor(Math.random() * types.length)], data: { id: `inv_${i}`, amount: Math.floor(Math.random() * 5000000) } },
    responseBody: Math.random() > 0.3 ? '{"success": true}' : '{"error": "Connection timeout"}',
    duration: Math.floor(Math.random() * 2000) + 100,
    attempts: Math.floor(Math.random() * 3) + 1,
    maxAttempts: 3,
    error: Math.random() > 0.7 ? 'Connection refused' : undefined,
  }));
};

const statusColors: Record<WebhookStatus, { bg: string; text: string; dot: string }> = {
  active: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  paused: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
  failing: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
  disabled: { bg: 'bg-gray-500/10', text: 'text-gray-400', dot: 'bg-gray-500' },
};

const eventStatusColors: Record<EventStatus, { bg: string; text: string; icon: React.ElementType }> = {
  success: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: CheckCircle },
  failed: { bg: 'bg-red-500/10', text: 'text-red-400', icon: XCircle },
  pending: { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: Clock },
  retrying: { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: RotateCcw },
};

export function WebhooksCenter() {
  const [activeTab, setActiveTab] = useState<'endpoints' | 'logs' | 'templates'>('endpoints');
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [selectedWebhook, setSelectedWebhook] = useState<string | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state for new webhook
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: [] as string[],
    template: '',
  });

  useEffect(() => {
    const stored = localStorage.getItem('litper_webhooks');
    if (stored) {
      const parsed = JSON.parse(stored);
      setWebhooks(parsed.map((w: any) => ({ ...w, createdAt: new Date(w.createdAt), lastTriggered: w.lastTriggered ? new Date(w.lastTriggered) : undefined })));
    } else {
      const mockWebhooks = generateMockWebhooks();
      setWebhooks(mockWebhooks);
      localStorage.setItem('litper_webhooks', JSON.stringify(mockWebhooks));
    }

    setEvents(generateMockEvents());
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleWebhookStatus = (id: string) => {
    setWebhooks(prev => prev.map(w => {
      if (w.id === id) {
        const newStatus = w.status === 'active' ? 'paused' : 'active';
        return { ...w, status: newStatus };
      }
      return w;
    }));
  };

  const deleteWebhook = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este webhook?')) {
      setWebhooks(prev => prev.filter(w => w.id !== id));
    }
  };

  const retryEvent = (eventId: string) => {
    setEvents(prev => prev.map(e => {
      if (e.id === eventId) {
        return { ...e, status: 'retrying', attempts: e.attempts + 1 };
      }
      return e;
    }));

    // Simulate retry
    setTimeout(() => {
      setEvents(prev => prev.map(e => {
        if (e.id === eventId) {
          return { ...e, status: Math.random() > 0.3 ? 'success' : 'failed', statusCode: Math.random() > 0.3 ? 200 : 500 };
        }
        return e;
      }));
    }, 2000);
  };

  const createWebhook = () => {
    if (!newWebhook.name || !newWebhook.url) return;

    const webhook: WebhookEndpoint = {
      id: `wh_${Date.now()}`,
      name: newWebhook.name,
      url: newWebhook.url,
      secret: `whsec_${Math.random().toString(36).substring(2, 18)}`,
      status: 'active',
      events: newWebhook.events,
      createdAt: new Date(),
      successRate: 100,
      totalDeliveries: 0,
      failedDeliveries: 0,
      retryPolicy: { maxRetries: 3, retryDelay: 60 },
    };

    setWebhooks(prev => [...prev, webhook]);
    setNewWebhook({ name: '', url: '', events: [], template: '' });
    setIsCreating(false);
  };

  const applyTemplate = (templateId: string) => {
    const template = webhookTemplates.find(t => t.id === templateId);
    if (template) {
      setNewWebhook(prev => ({
        ...prev,
        events: template.events,
        template: templateId,
      }));
    }
  };

  const filteredEvents = selectedWebhook
    ? events.filter(e => e.webhookId === selectedWebhook)
    : events;

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="h-full flex flex-col bg-black/20 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500/20 rounded-lg">
              <Webhook className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Webhooks Center</h2>
              <p className="text-xs text-gray-400">{webhooks.length} endpoints configurados</p>
            </div>
          </div>

          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo Webhook
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
          {[
            { id: 'endpoints', label: 'Endpoints', icon: Globe },
            { id: 'logs', label: 'Event Logs', icon: History },
            { id: 'templates', label: 'Templates', icon: FileText },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Endpoints Tab */}
        {activeTab === 'endpoints' && (
          <div className="space-y-4">
            {webhooks.map(webhook => {
              const statusStyle = statusColors[webhook.status];

              return (
                <div
                  key={webhook.id}
                  className="bg-white/5 rounded-lg border border-white/10 overflow-hidden hover:border-white/20 transition-colors"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-white font-medium">{webhook.name}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs ${statusStyle.bg} ${statusStyle.text} capitalize`}>
                            {webhook.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-400 font-mono">
                          <Globe className="w-4 h-4" />
                          <span className="truncate max-w-md">{webhook.url}</span>
                          <button
                            onClick={() => copyToClipboard(webhook.url, `url-${webhook.id}`)}
                            className="p-1 hover:bg-white/10 rounded"
                          >
                            {copiedId === `url-${webhook.id}` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          <Lock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-500 font-mono">
                            {showSecret[webhook.id] ? webhook.secret : '••••••••••••••••'}
                          </span>
                          <button
                            onClick={() => setShowSecret(prev => ({ ...prev, [webhook.id]: !prev[webhook.id] }))}
                            className="p-1 hover:bg-white/10 rounded"
                          >
                            {showSecret[webhook.id] ? (
                              <EyeOff className="w-3 h-3 text-gray-500" />
                            ) : (
                              <Eye className="w-3 h-3 text-gray-500" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleWebhookStatus(webhook.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            webhook.status === 'active'
                              ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                          }`}
                          title={webhook.status === 'active' ? 'Pausar' : 'Activar'}
                        >
                          {webhook.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => deleteWebhook(webhook.id)}
                          className="p-2 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Events subscribed */}
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-xs text-gray-500 mb-2">Eventos suscritos:</p>
                      <div className="flex flex-wrap gap-1">
                        {webhook.events.map(event => (
                          <span key={event} className="px-2 py-0.5 bg-white/5 text-gray-400 rounded text-xs font-mono">
                            {event}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-white/10">
                      <div>
                        <p className="text-xs text-gray-500">Entregas</p>
                        <p className="text-lg font-semibold text-white">{webhook.totalDeliveries}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Tasa de éxito</p>
                        <p className={`text-lg font-semibold ${webhook.successRate >= 90 ? 'text-emerald-400' : webhook.successRate >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
                          {webhook.successRate}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Fallidas</p>
                        <p className="text-lg font-semibold text-red-400">{webhook.failedDeliveries}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Último evento</p>
                        <p className="text-sm text-gray-400">
                          {webhook.lastTriggered
                            ? new Date(webhook.lastTriggered).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
                            : 'Nunca'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {webhooks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Webhook className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-sm">No hay webhooks configurados</p>
                <button
                  onClick={() => setIsCreating(true)}
                  className="mt-4 text-violet-400 hover:text-violet-300 text-sm"
                >
                  Crear primer webhook
                </button>
              </div>
            )}
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar eventos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
                />
              </div>

              <select
                value={selectedWebhook || ''}
                onChange={(e) => setSelectedWebhook(e.target.value || null)}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none"
              >
                <option value="">Todos los webhooks</option>
                {webhooks.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            {/* Events list */}
            <div className="space-y-2">
              {filteredEvents.map(event => {
                const statusStyle = eventStatusColors[event.status];
                const StatusIcon = statusStyle.icon;
                const isExpanded = expandedEvent === event.id;

                return (
                  <div
                    key={event.id}
                    className="bg-white/5 rounded-lg border border-white/10 overflow-hidden"
                  >
                    <div
                      className="p-3 cursor-pointer hover:bg-white/5 transition-colors"
                      onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded ${statusStyle.bg}`}>
                            <StatusIcon className={`w-4 h-4 ${statusStyle.text}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono text-white">{event.eventType}</span>
                              <span className={`px-1.5 py-0.5 rounded text-xs ${statusStyle.bg} ${statusStyle.text}`}>
                                {event.statusCode || event.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              {webhooks.find(w => w.id === event.webhookId)?.name || 'Unknown'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {event.duration && (
                            <span className="text-xs text-gray-500">{formatDuration(event.duration)}</span>
                          )}
                          <span className="text-xs text-gray-500">
                            {event.timestamp.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="p-4 border-t border-white/10 bg-black/30 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Intentos</p>
                            <p className="text-sm text-white">{event.attempts} / {event.maxAttempts}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Estado</p>
                            <p className={`text-sm ${statusStyle.text}`}>{event.status}</p>
                          </div>
                        </div>

                        {event.error && (
                          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-xs text-red-400 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4" />
                              {event.error}
                            </p>
                          </div>
                        )}

                        <div>
                          <p className="text-xs text-gray-500 mb-2">Request Payload</p>
                          <pre className="p-3 bg-black/50 rounded-lg text-xs text-gray-400 font-mono overflow-x-auto">
                            {JSON.stringify(event.requestPayload, null, 2)}
                          </pre>
                        </div>

                        {event.responseBody && (
                          <div>
                            <p className="text-xs text-gray-500 mb-2">Response</p>
                            <pre className="p-3 bg-black/50 rounded-lg text-xs text-gray-400 font-mono overflow-x-auto">
                              {event.responseBody}
                            </pre>
                          </div>
                        )}

                        {event.status === 'failed' && event.attempts < event.maxAttempts && (
                          <button
                            onClick={(e) => { e.stopPropagation(); retryEvent(event.id); }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Reintentar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="grid grid-cols-2 gap-4">
            {webhookTemplates.map(template => (
              <div
                key={template.id}
                className="bg-white/5 rounded-lg border border-white/10 p-4 hover:border-violet-500/30 transition-colors cursor-pointer"
                onClick={() => {
                  applyTemplate(template.id);
                  setIsCreating(true);
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{template.icon}</span>
                  <div>
                    <h3 className="text-white font-medium">{template.name}</h3>
                    <p className="text-xs text-gray-500">{template.description}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-gray-500">Eventos incluidos:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.events.length > 0 ? (
                      template.events.map(event => (
                        <span key={event} className="px-2 py-0.5 bg-white/5 text-gray-400 rounded text-xs font-mono">
                          {event}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500">Personalizable</span>
                    )}
                  </div>
                </div>

                <button className="mt-4 w-full py-2 bg-violet-600/20 text-violet-400 rounded-lg text-sm hover:bg-violet-600/30 transition-colors">
                  Usar template
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Webhook Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-gray-900 rounded-xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Nuevo Webhook</h3>
                <button
                  onClick={() => { setIsCreating(false); setNewWebhook({ name: '', url: '', events: [], template: '' }); }}
                  className="p-1 hover:bg-white/10 rounded"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nombre</label>
                <input
                  type="text"
                  value={newWebhook.name}
                  onChange={(e) => setNewWebhook(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Mi webhook"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">URL del endpoint</label>
                <input
                  type="url"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://api.tuservicio.com/webhook"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Eventos a suscribir</label>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {eventTypes.map(category => (
                    <div key={category.category}>
                      <p className="text-xs text-gray-500 mb-1">{category.category}</p>
                      <div className="flex flex-wrap gap-1">
                        {category.events.map(event => (
                          <button
                            key={event}
                            onClick={() => {
                              setNewWebhook(prev => ({
                                ...prev,
                                events: prev.events.includes(event)
                                  ? prev.events.filter(e => e !== event)
                                  : [...prev.events, event],
                              }));
                            }}
                            className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                              newWebhook.events.includes(event)
                                ? 'bg-violet-500/30 text-violet-300 border border-violet-500/30'
                                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                            }`}
                          >
                            {event}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-white/10 flex justify-end gap-3">
              <button
                onClick={() => { setIsCreating(false); setNewWebhook({ name: '', url: '', events: [], template: '' }); }}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={createWebhook}
                disabled={!newWebhook.name || !newWebhook.url}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Crear Webhook
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WebhooksCenter;
