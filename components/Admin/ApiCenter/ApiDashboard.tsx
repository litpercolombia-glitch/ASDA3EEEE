// components/Admin/ApiCenter/ApiDashboard.tsx
// Centro de API - Gestión de API Keys, Webhooks y Documentación

import React, { useState } from 'react';
import {
  Key,
  Webhook,
  FileText,
  Plus,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Play,
  AlertCircle,
  CheckCircle,
  Code,
  Terminal,
  Activity,
  Shield,
  Clock,
  Zap,
  ChevronDown,
  ChevronRight,
  Settings,
} from 'lucide-react';
import {
  useApiStore,
  API_ENDPOINTS,
  PERMISSION_LABELS,
  WEBHOOK_EVENT_LABELS,
  type ApiKey,
  type Webhook as WebhookType,
  type ApiPermission,
  type WebhookEvent,
  type ApiEndpoint,
} from '../../../services/publicApiService';

// ============================================
// COMPONENTES AUXILIARES
// ============================================

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 hover:bg-slate-100 dark:hover:bg-navy-700 rounded transition-colors"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <Copy className="w-4 h-4 text-slate-400" />
      )}
    </button>
  );
};

const MethodBadge: React.FC<{ method: string }> = ({ method }) => {
  const colors: Record<string, string> = {
    GET: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    POST: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    PUT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-bold ${colors[method] || 'bg-slate-100'}`}>
      {method}
    </span>
  );
};

// ============================================
// TAB: API KEYS
// ============================================

const ApiKeysTab: React.FC = () => {
  const { apiKeys, createApiKey, revokeApiKey, rotateApiKey } = useApiStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyType, setNewKeyType] = useState<'live' | 'test'>('test');
  const [newKeyPermissions, setNewKeyPermissions] = useState<ApiPermission[]>([
    'guides:read',
    'finance:read',
  ]);

  const handleCreateKey = () => {
    if (!newKeyName.trim()) return;
    createApiKey(newKeyName, newKeyType, newKeyPermissions);
    setShowCreateForm(false);
    setNewKeyName('');
    setNewKeyPermissions(['guides:read', 'finance:read']);
  };

  const togglePermission = (perm: ApiPermission) => {
    setNewKeyPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const maskKey = (key: string) => {
    return key.slice(0, 12) + '••••••••••••••••••••';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">API Keys</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gestiona las claves de acceso a tu API
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva API Key
        </button>
      </div>

      {/* Crear nueva key */}
      {showCreateForm && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-4">
            Crear Nueva API Key
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-slate-800 dark:text-white"
                placeholder="Ej: Integración Shopify"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tipo
              </label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={newKeyType === 'test'}
                    onChange={() => setNewKeyType('test')}
                    className="text-blue-500"
                  />
                  <span className="text-sm">Test (desarrollo)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={newKeyType === 'live'}
                    onChange={() => setNewKeyType('live')}
                    className="text-blue-500"
                  />
                  <span className="text-sm">Live (producción)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Permisos
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(PERMISSION_LABELS).map(([perm, label]) => (
                  <label key={perm} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newKeyPermissions.includes(perm as ApiPermission)}
                      onChange={() => togglePermission(perm as ApiPermission)}
                      className="text-blue-500 rounded"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-slate-300 dark:border-navy-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-navy-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateKey}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Crear API Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de keys */}
      <div className="space-y-3">
        {apiKeys.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <Key className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No tienes API Keys creadas</p>
          </div>
        ) : (
          apiKeys.map((key) => (
            <div
              key={key.id}
              className={`p-4 rounded-xl border ${
                key.isActive
                  ? 'bg-white dark:bg-navy-800 border-slate-200 dark:border-navy-700'
                  : 'bg-slate-100 dark:bg-navy-900 border-slate-200 dark:border-navy-800 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-800 dark:text-white">{key.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        key.type === 'live'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}
                    >
                      {key.type === 'live' ? 'Producción' : 'Test'}
                    </span>
                    {!key.isActive && (
                      <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">
                        Revocada
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-sm font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-navy-700 px-2 py-1 rounded">
                      {showSecrets[key.id] ? key.key : maskKey(key.key)}
                    </code>
                    <button
                      onClick={() =>
                        setShowSecrets((prev) => ({ ...prev, [key.id]: !prev[key.id] }))
                      }
                      className="p-1 hover:bg-slate-100 dark:hover:bg-navy-700 rounded"
                    >
                      {showSecrets[key.id] ? (
                        <EyeOff className="w-4 h-4 text-slate-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                    <CopyButton text={key.key} />
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span>{key.usageCount.toLocaleString()} requests</span>
                    <span>•</span>
                    <span>{key.rateLimit} req/min</span>
                    {key.lastUsed && (
                      <>
                        <span>•</span>
                        <span>Último uso: {new Date(key.lastUsed).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>

                {key.isActive && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => rotateApiKey(key.id)}
                      className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                      title="Rotar key"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => revokeApiKey(key.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      title="Revocar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ============================================
// TAB: WEBHOOKS
// ============================================

const WebhooksTab: React.FC = () => {
  const { webhooks, createWebhook, updateWebhook, deleteWebhook, testWebhook } = useApiStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookEvents, setNewWebhookEvents] = useState<WebhookEvent[]>([]);
  const [testing, setTesting] = useState<string | null>(null);

  const handleCreateWebhook = () => {
    if (!newWebhookUrl.trim() || newWebhookEvents.length === 0) return;
    createWebhook(newWebhookUrl, newWebhookEvents);
    setShowCreateForm(false);
    setNewWebhookUrl('');
    setNewWebhookEvents([]);
  };

  const handleTest = async (id: string) => {
    setTesting(id);
    await testWebhook(id);
    setTesting(null);
  };

  const toggleEvent = (event: WebhookEvent) => {
    setNewWebhookEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Webhooks</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Recibe notificaciones en tiempo real de eventos
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Webhook
        </button>
      </div>

      {/* Crear webhook */}
      {showCreateForm && (
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
          <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-4">
            Crear Nuevo Webhook
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                URL del Endpoint
              </label>
              <input
                type="url"
                value={newWebhookUrl}
                onChange={(e) => setNewWebhookUrl(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-slate-800 dark:text-white"
                placeholder="https://tu-app.com/webhooks/litper"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Eventos
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(WEBHOOK_EVENT_LABELS).map(([event, label]) => (
                  <label key={event} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newWebhookEvents.includes(event as WebhookEvent)}
                      onChange={() => toggleEvent(event as WebhookEvent)}
                      className="text-purple-500 rounded"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-slate-300 dark:border-navy-600 text-slate-700 dark:text-slate-300 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateWebhook}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
              >
                Crear Webhook
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de webhooks */}
      <div className="space-y-3">
        {webhooks.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <Webhook className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No tienes webhooks configurados</p>
          </div>
        ) : (
          webhooks.map((webhook) => (
            <div
              key={webhook.id}
              className="p-4 bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-sm font-mono text-slate-600 dark:text-slate-300">
                      {webhook.url}
                    </code>
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        webhook.isActive
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {webhook.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {webhook.events.map((event) => (
                      <span
                        key={event}
                        className="px-2 py-0.5 bg-slate-100 dark:bg-navy-700 rounded text-xs"
                      >
                        {WEBHOOK_EVENT_LABELS[event]}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    {webhook.lastTriggered && (
                      <span>Último envío: {new Date(webhook.lastTriggered).toLocaleString()}</span>
                    )}
                    {webhook.failureCount > 0 && (
                      <span className="text-red-500">{webhook.failureCount} fallos</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleTest(webhook.id)}
                    disabled={testing === webhook.id}
                    className="p-2 text-slate-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg disabled:opacity-50"
                    title="Probar webhook"
                  >
                    {testing === webhook.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => deleteWebhook(webhook.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ============================================
// TAB: DOCUMENTACIÓN
// ============================================

const DocumentationTab: React.FC = () => {
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'guides', 'finance', 'reports', 'webhooks'];
  const categoryLabels: Record<string, string> = {
    all: 'Todos',
    guides: 'Guías',
    finance: 'Finanzas',
    reports: 'Reportes',
    webhooks: 'Webhooks',
  };

  const filteredEndpoints =
    selectedCategory === 'all'
      ? API_ENDPOINTS
      : API_ENDPOINTS.filter((e) => e.path.includes(`/${selectedCategory}`));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
          Documentación API
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Referencia completa de endpoints disponibles
        </p>
      </div>

      {/* Base URL */}
      <div className="bg-slate-100 dark:bg-navy-700 rounded-lg p-4">
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Base URL</p>
        <code className="text-slate-800 dark:text-white font-mono">
          https://api.litper.co/v1
        </code>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-blue-500 text-white'
                : 'bg-slate-100 dark:bg-navy-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-600'
            }`}
          >
            {categoryLabels[cat]}
          </button>
        ))}
      </div>

      {/* Endpoints */}
      <div className="space-y-3">
        {filteredEndpoints.map((endpoint, index) => {
          const key = `${endpoint.method}-${endpoint.path}`;
          const isExpanded = expandedEndpoint === key;

          return (
            <div
              key={index}
              className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 overflow-hidden"
            >
              <button
                onClick={() => setExpandedEndpoint(isExpanded ? null : key)}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-navy-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MethodBadge method={endpoint.method} />
                  <code className="font-mono text-slate-700 dark:text-slate-300">
                    {endpoint.path}
                  </code>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {endpoint.description}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="p-4 border-t border-slate-200 dark:border-navy-700 space-y-4">
                  {/* Parámetros */}
                  {endpoint.parameters && endpoint.parameters.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Parámetros
                      </h5>
                      <div className="bg-slate-50 dark:bg-navy-700/50 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-navy-600">
                              <th className="px-3 py-2 text-left text-slate-600 dark:text-slate-400">
                                Nombre
                              </th>
                              <th className="px-3 py-2 text-left text-slate-600 dark:text-slate-400">
                                Ubicación
                              </th>
                              <th className="px-3 py-2 text-left text-slate-600 dark:text-slate-400">
                                Tipo
                              </th>
                              <th className="px-3 py-2 text-left text-slate-600 dark:text-slate-400">
                                Descripción
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {endpoint.parameters.map((param, i) => (
                              <tr key={i} className="border-b border-slate-200 dark:border-navy-600 last:border-0">
                                <td className="px-3 py-2 font-mono text-slate-800 dark:text-white">
                                  {param.name}
                                  {param.required && (
                                    <span className="text-red-500 ml-1">*</span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                                  {param.in}
                                </td>
                                <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                                  {param.type}
                                </td>
                                <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                                  {param.description}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Ejemplo */}
                  {endpoint.example && (
                    <div>
                      <h5 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Ejemplo de Respuesta
                      </h5>
                      <pre className="bg-slate-900 text-green-400 rounded-lg p-4 overflow-x-auto text-sm">
                        {JSON.stringify(endpoint.example.response, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

type ApiTab = 'keys' | 'webhooks' | 'docs';

export const ApiDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ApiTab>('keys');
  const { apiKeys, webhooks } = useApiStore();

  const tabs = [
    { id: 'keys' as ApiTab, label: 'API Keys', icon: Key, count: apiKeys.filter((k) => k.isActive).length },
    { id: 'webhooks' as ApiTab, label: 'Webhooks', icon: Webhook, count: webhooks.length },
    { id: 'docs' as ApiTab, label: 'Documentación', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-900 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl">
            <Terminal className="w-6 h-6 text-white" />
          </div>
          API Pública LITPER
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Conecta tu app con sistemas externos mediante nuestra API REST
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id ? 'bg-white/20' : 'bg-slate-200 dark:bg-navy-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-navy-700 p-6">
        {activeTab === 'keys' && <ApiKeysTab />}
        {activeTab === 'webhooks' && <WebhooksTab />}
        {activeTab === 'docs' && <DocumentationTab />}
      </div>
    </div>
  );
};

export default ApiDashboard;
