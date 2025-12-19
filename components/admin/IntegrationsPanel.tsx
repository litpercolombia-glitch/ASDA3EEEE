// components/admin/IntegrationsPanel.tsx
// Panel de configuración de integraciones de IA y datos

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Key,
  Check,
  X,
  RefreshCw,
  Zap,
  Database,
  Bot,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { integrationManager } from '../../services/integrations/IntegrationManager';
import {
  AIProviderConfig,
  DataConnectionConfig,
  AIFunctionAssignment,
  AIProviderType,
  AIFunction,
} from '../../types/integrations';

export const IntegrationsPanel: React.FC = () => {
  const [aiProviders, setAiProviders] = useState<AIProviderConfig[]>([]);
  const [dataConnections, setDataConnections] = useState<DataConnectionConfig[]>([]);
  const [functionAssignments, setFunctionAssignments] = useState<AIFunctionAssignment[]>([]);
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<{ id: string; key: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = () => {
    setAiProviders(integrationManager.getAIProviders());
    setDataConnections(integrationManager.getDataConnections());
    setFunctionAssignments(integrationManager.getFunctionAssignments());
  };

  const handleSaveApiKey = async (providerId: AIProviderType) => {
    if (!editingKey || editingKey.id !== providerId) return;

    setTestingProvider(providerId);
    const connected = await integrationManager.setAPIKey(providerId, editingKey.key);
    setTestingProvider(null);
    setEditingKey(null);
    loadConfig();

    if (connected) {
      alert(`✅ ${providerId} conectado correctamente!`);
    } else {
      alert(`❌ No se pudo conectar con ${providerId}. Verifica la API key.`);
    }
  };

  const handleTestConnection = async (providerId: AIProviderType) => {
    setTestingProvider(providerId);
    await integrationManager.testProvider(providerId);
    setTestingProvider(null);
    loadConfig();
  };

  const handleToggleProvider = async (providerId: AIProviderType) => {
    const provider = aiProviders.find((p) => p.id === providerId);
    if (!provider) return;

    await integrationManager.toggleProvider(providerId, !provider.enabled);
    loadConfig();
  };

  const handleFunctionAssignment = (func: AIFunction, providerId: AIProviderType) => {
    integrationManager.setFunctionProvider(func, providerId);
    loadConfig();
  };

  const toggleShowApiKey = (id: string) => {
    setShowApiKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getStatusColor = (isConnected: boolean, enabled: boolean) => {
    if (!enabled) return 'bg-gray-100 text-gray-500';
    if (isConnected) return 'bg-emerald-100 text-emerald-700';
    return 'bg-red-100 text-red-700';
  };

  const getStatusIcon = (isConnected: boolean, enabled: boolean) => {
    if (!enabled) return <X className="w-4 h-4" />;
    if (isConnected) return <CheckCircle className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              Integraciones
            </h2>
            <p className="text-sm text-slate-500">
              Configura proveedores de IA y conexiones de datos
            </p>
          </div>
        </div>
        <button
          onClick={loadConfig}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* Proveedores de IA */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-navy-700 bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-slate-800 dark:text-white">
              Proveedores de IA
            </h3>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Conecta diferentes modelos de IA para distintas funciones
          </p>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-navy-700">
          {aiProviders.map((provider) => (
            <div key={provider.id} className="p-4">
              {/* Provider Header */}
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() =>
                  setExpandedProvider(
                    expandedProvider === provider.id ? null : provider.id
                  )
                }
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{provider.icon}</span>
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-white">
                      {provider.name}
                    </h4>
                    <p className="text-sm text-slate-500">{provider.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      provider.isConnected,
                      provider.enabled
                    )}`}
                  >
                    {getStatusIcon(provider.isConnected, provider.enabled)}
                    {!provider.enabled
                      ? 'Deshabilitado'
                      : provider.isConnected
                      ? 'Conectado'
                      : 'Desconectado'}
                  </span>
                  {expandedProvider === provider.id ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Provider Details */}
              {expandedProvider === provider.id && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-navy-800 space-y-4">
                  {/* API Key */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      <Key className="w-4 h-4 inline mr-1" />
                      API Key
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showApiKeys[provider.id] ? 'text' : 'password'}
                          value={
                            editingKey?.id === provider.id
                              ? editingKey.key
                              : provider.apiKey || ''
                          }
                          onChange={(e) =>
                            setEditingKey({ id: provider.id, key: e.target.value })
                          }
                          placeholder="Ingresa tu API key..."
                          className="w-full px-4 py-2 pr-10 border border-slate-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-800 text-slate-800 dark:text-white"
                        />
                        <button
                          onClick={() => toggleShowApiKey(provider.id)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showApiKeys[provider.id] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <button
                        onClick={() => handleSaveApiKey(provider.id)}
                        disabled={testingProvider === provider.id}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                      >
                        {testingProvider === provider.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        Guardar
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTestConnection(provider.id)}
                      disabled={testingProvider === provider.id || !provider.apiKey}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                      {testingProvider === provider.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4" />
                      )}
                      Probar conexión
                    </button>
                    <button
                      onClick={() => handleToggleProvider(provider.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        provider.enabled
                          ? 'bg-red-100 hover:bg-red-200 text-red-700'
                          : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'
                      }`}
                    >
                      {provider.enabled ? 'Deshabilitar' : 'Habilitar'}
                    </button>
                  </div>

                  {/* Model info */}
                  {provider.model && (
                    <p className="text-sm text-slate-500">
                      Modelo: <span className="font-mono">{provider.model}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Conexiones de Datos */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-navy-700 bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800 dark:text-white">
              Conexiones de Datos
            </h3>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Fuentes de datos conectadas al sistema
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
          {dataConnections.map((conn) => (
            <div
              key={conn.id}
              className={`p-4 rounded-xl border-2 ${
                conn.isConnected
                  ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'border-slate-200 bg-slate-50 dark:bg-navy-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{conn.icon}</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    conn.isConnected
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {conn.isConnected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
              <h4 className="font-semibold text-slate-800 dark:text-white">
                {conn.name}
              </h4>
              <p className="text-sm text-slate-500">{conn.description}</p>
              {conn.dataPercentage && (
                <p className="text-xs text-emerald-600 mt-2">
                  📊 {conn.dataPercentage}% de los datos
                </p>
              )}
              {conn.lastSync && (
                <p className="text-xs text-slate-400 mt-1">
                  Última sync: {new Date(conn.lastSync).toLocaleTimeString()}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Asignación de Funciones */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-navy-700 bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 dark:text-white">
              Asignación de IA por Función
            </h3>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Elige qué proveedor de IA usar para cada función
          </p>
        </div>

        <div className="p-4 space-y-3">
          {functionAssignments.map((assignment) => (
            <div
              key={assignment.function}
              className="flex items-center justify-between p-3 bg-slate-50 dark:bg-navy-800 rounded-lg"
            >
              <div>
                <h4 className="font-medium text-slate-800 dark:text-white">
                  {assignment.label}
                </h4>
                <p className="text-sm text-slate-500">{assignment.description}</p>
              </div>
              <select
                value={assignment.assignedProvider}
                onChange={(e) =>
                  handleFunctionAssignment(
                    assignment.function,
                    e.target.value as AIProviderType
                  )
                }
                className="px-3 py-2 border border-slate-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-900 text-slate-800 dark:text-white"
              >
                {aiProviders.map((provider) => (
                  <option
                    key={provider.id}
                    value={provider.id}
                    disabled={!provider.enabled || !provider.isConnected}
                  >
                    {provider.icon} {provider.name}
                    {!provider.isConnected && ' (desconectado)'}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IntegrationsPanel;
