'use client';

import React, { useState } from 'react';
import {
  Puzzle,
  Webhook,
  Globe,
  Link,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  Plus,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Key,
  Shield,
  Zap,
  Database,
  Cloud,
  Code,
  FileJson,
  ArrowRight,
  Copy,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';

// ============================================
// ENTERPRISE INTEGRATIONS MODULE
// Centro unificado de integraciones
// ============================================

type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'pending';
type IntegrationCategory = 'payment' | 'crm' | 'accounting' | 'communication' | 'storage' | 'analytics';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  icon: string;
  lastSync?: Date;
  apiKey?: string;
  webhookUrl?: string;
  config?: Record<string, any>;
  docsUrl?: string;
}

const mockIntegrations: Integration[] = [
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Procesamiento de pagos en línea',
    category: 'payment',
    status: 'connected',
    icon: '💳',
    lastSync: new Date(Date.now() - 300000),
    apiKey: 'sk_live_••••••••••••••••',
    webhookUrl: 'https://api.litper.com/webhooks/stripe',
    docsUrl: 'https://stripe.com/docs',
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Pagos globales y transferencias',
    category: 'payment',
    status: 'disconnected',
    icon: '💰',
    docsUrl: 'https://developer.paypal.com',
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'CRM y automatización de marketing',
    category: 'crm',
    status: 'connected',
    icon: '🎯',
    lastSync: new Date(Date.now() - 1800000),
    apiKey: 'pat-na1-••••••••••••••••',
    docsUrl: 'https://developers.hubspot.com',
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'CRM empresarial líder',
    category: 'crm',
    status: 'pending',
    icon: '☁️',
    docsUrl: 'https://developer.salesforce.com',
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Contabilidad y facturación',
    category: 'accounting',
    status: 'connected',
    icon: '📊',
    lastSync: new Date(Date.now() - 3600000),
    docsUrl: 'https://developer.intuit.com',
  },
  {
    id: 'xero',
    name: 'Xero',
    description: 'Contabilidad en la nube',
    category: 'accounting',
    status: 'disconnected',
    icon: '📈',
    docsUrl: 'https://developer.xero.com',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Notificaciones y alertas',
    category: 'communication',
    status: 'connected',
    icon: '💬',
    lastSync: new Date(Date.now() - 60000),
    webhookUrl: 'https://hooks.slack.com/services/T00/B00/XXX',
    docsUrl: 'https://api.slack.com',
  },
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'SMS y comunicaciones',
    category: 'communication',
    status: 'error',
    icon: '📱',
    docsUrl: 'https://www.twilio.com/docs',
  },
  {
    id: 'aws-s3',
    name: 'AWS S3',
    description: 'Almacenamiento de archivos',
    category: 'storage',
    status: 'connected',
    icon: '🗄️',
    lastSync: new Date(Date.now() - 120000),
    docsUrl: 'https://docs.aws.amazon.com/s3',
  },
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    description: 'Análisis de tráfico web',
    category: 'analytics',
    status: 'connected',
    icon: '📉',
    lastSync: new Date(Date.now() - 7200000),
    docsUrl: 'https://developers.google.com/analytics',
  },
];

const categoryConfig: Record<IntegrationCategory, { label: string; icon: React.ElementType; color: string }> = {
  payment: { label: 'Pagos', icon: Zap, color: 'emerald' },
  crm: { label: 'CRM', icon: Database, color: 'violet' },
  accounting: { label: 'Contabilidad', icon: FileJson, color: 'blue' },
  communication: { label: 'Comunicación', icon: Globe, color: 'cyan' },
  storage: { label: 'Almacenamiento', icon: Cloud, color: 'amber' },
  analytics: { label: 'Analytics', icon: Code, color: 'pink' },
};

const statusConfig: Record<IntegrationStatus, { label: string; color: string; icon: React.ElementType }> = {
  connected: { label: 'Conectado', color: 'emerald', icon: CheckCircle },
  disconnected: { label: 'Desconectado', color: 'gray', icon: XCircle },
  error: { label: 'Error', color: 'red', icon: AlertTriangle },
  pending: { label: 'Pendiente', color: 'amber', icon: Clock },
};

export function EnterpriseIntegrationsModule() {
  const [integrations, setIntegrations] = useState<Integration[]>(mockIntegrations);
  const [selectedCategory, setSelectedCategory] = useState<IntegrationCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredIntegrations = integrations.filter(int => {
    if (selectedCategory !== 'all' && int.category !== selectedCategory) return false;
    if (searchQuery && !int.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: integrations.length,
    connected: integrations.filter(i => i.status === 'connected').length,
    errors: integrations.filter(i => i.status === 'error').length,
  };

  const formatLastSync = (date?: Date): string => {
    if (!date) return 'Nunca';
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${Math.floor(hours / 24)}d`;
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleConnection = (id: string) => {
    setIntegrations(prev => prev.map(int => {
      if (int.id === id) {
        return {
          ...int,
          status: int.status === 'connected' ? 'disconnected' : 'connected',
          lastSync: int.status === 'disconnected' ? new Date() : int.lastSync,
        };
      }
      return int;
    }));
  };

  const refreshIntegration = (id: string) => {
    setIntegrations(prev => prev.map(int => {
      if (int.id === id) {
        return { ...int, lastSync: new Date() };
      }
      return int;
    }));
  };

  return (
    <div className="h-full flex flex-col bg-black/20 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500/20 rounded-lg">
              <Puzzle className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Integraciones</h2>
              <p className="text-xs text-gray-400">{stats.connected} de {stats.total} conectadas</p>
            </div>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm transition-colors">
            <Plus className="w-4 h-4" />
            Nueva Integración
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-gray-500">Total integraciones</p>
          </div>
          <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
            <p className="text-2xl font-bold text-emerald-400">{stats.connected}</p>
            <p className="text-xs text-gray-500">Activas</p>
          </div>
          <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
            <p className="text-2xl font-bold text-red-400">{stats.errors}</p>
            <p className="text-xs text-gray-500">Con errores</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar integración..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
            />
          </div>

          <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                selectedCategory === 'all' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Todas
            </button>
            {Object.entries(categoryConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key as IntegrationCategory)}
                className={`px-3 py-1 rounded text-xs transition-colors ${
                  selectedCategory === key ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {config.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-4">
          {filteredIntegrations.map(integration => {
            const status = statusConfig[integration.status];
            const StatusIcon = status.icon;
            const category = categoryConfig[integration.category];
            const isExpanded = selectedIntegration === integration.id;

            return (
              <div
                key={integration.id}
                className={`bg-white/5 rounded-xl border transition-all ${
                  isExpanded ? 'border-violet-500/30' : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{integration.icon}</span>
                      <div>
                        <h3 className="text-white font-medium">{integration.name}</h3>
                        <p className="text-xs text-gray-500">{integration.description}</p>
                      </div>
                    </div>

                    <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs bg-${status.color}-500/10 text-${status.color}-400`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      Última sync: {formatLastSync(integration.lastSync)}
                    </div>

                    <div className="flex items-center gap-2">
                      {integration.status === 'connected' && (
                        <button
                          onClick={() => refreshIntegration(integration.id)}
                          className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                          title="Sincronizar"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedIntegration(isExpanded ? null : integration.id)}
                        className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Config */}
                {isExpanded && (
                  <div className="p-4 border-t border-white/10 bg-black/30 space-y-4">
                    {integration.apiKey && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">API Key</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-3 py-2 bg-black/50 rounded text-sm text-gray-400 font-mono">
                            {showApiKey[integration.id] ? 'sk_live_1234567890abcdef' : integration.apiKey}
                          </code>
                          <button
                            onClick={() => setShowApiKey(prev => ({ ...prev, [integration.id]: !prev[integration.id] }))}
                            className="p-2 hover:bg-white/10 rounded text-gray-400"
                          >
                            {showApiKey[integration.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => copyToClipboard('sk_live_1234567890abcdef', `api-${integration.id}`)}
                            className="p-2 hover:bg-white/10 rounded text-gray-400"
                          >
                            {copiedId === `api-${integration.id}` ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {integration.webhookUrl && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Webhook URL</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-3 py-2 bg-black/50 rounded text-sm text-gray-400 font-mono truncate">
                            {integration.webhookUrl}
                          </code>
                          <button
                            onClick={() => copyToClipboard(integration.webhookUrl!, `wh-${integration.id}`)}
                            className="p-2 hover:bg-white/10 rounded text-gray-400"
                          >
                            {copiedId === `wh-${integration.id}` ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between pt-2">
                      {integration.docsUrl && (
                        <a
                          href={integration.docsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Documentación
                        </a>
                      )}

                      <button
                        onClick={() => toggleConnection(integration.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          integration.status === 'connected'
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                        }`}
                      >
                        {integration.status === 'connected' ? 'Desconectar' : 'Conectar'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredIntegrations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Puzzle className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm">No se encontraron integraciones</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default EnterpriseIntegrationsModule;
