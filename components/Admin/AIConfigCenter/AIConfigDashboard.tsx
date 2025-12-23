// components/Admin/AIConfigCenter/AIConfigDashboard.tsx
// Centro de Configuración de IA - Gestión de API keys de proveedores de IA

import React, { useState } from 'react';
import {
  Bot,
  Key,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Zap,
  ArrowUpDown,
  Shield,
  Sparkles,
  Brain,
  Cloud,
  Loader2,
  Copy,
  Check,
  Info,
  ExternalLink,
} from 'lucide-react';
import {
  useAIConfigStore,
  type AIProvider,
  type AIProviderConfig,
} from '../../../services/aiConfigService';

// ============================================
// ICONOS Y COLORES POR PROVEEDOR
// ============================================

const PROVIDER_INFO: Record<AIProvider, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  description: string;
  docsUrl: string;
  keyPrefix: string;
}> = {
  claude: {
    icon: Sparkles,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    description: 'IA conversacional avanzada de Anthropic. Mejor para análisis y respuestas complejas.',
    docsUrl: 'https://console.anthropic.com/',
    keyPrefix: 'sk-ant-',
  },
  gemini: {
    icon: Brain,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    description: 'IA multimodal de Google. Buena para análisis de imágenes y datos.',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    keyPrefix: 'AI',
  },
  openai: {
    icon: Cloud,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    description: 'GPT de OpenAI. Versátil y ampliamente compatible.',
    docsUrl: 'https://platform.openai.com/api-keys',
    keyPrefix: 'sk-',
  },
};

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
      className="p-1.5 hover:bg-white/10 rounded transition-colors"
      title="Copiar"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-400" />
      ) : (
        <Copy className="w-4 h-4 text-slate-400" />
      )}
    </button>
  );
};

const StatusBadge: React.FC<{ status: 'success' | 'error' | null; message?: string | null }> = ({
  status,
  message,
}) => {
  if (!status) {
    return (
      <span className="flex items-center gap-1 text-xs text-slate-500">
        <AlertCircle className="w-3 h-3" />
        No probado
      </span>
    );
  }

  if (status === 'success') {
    return (
      <span className="flex items-center gap-1 text-xs text-green-400" title={message || ''}>
        <CheckCircle className="w-3 h-3" />
        Conectado
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 text-xs text-red-400" title={message || ''}>
      <XCircle className="w-3 h-3" />
      Error
    </span>
  );
};

// ============================================
// CARD DE PROVEEDOR
// ============================================

interface ProviderCardProps {
  config: AIProviderConfig;
  isPrimary: boolean;
  onSetPrimary: () => void;
}

const ProviderCard: React.FC<ProviderCardProps> = ({ config, isPrimary, onSetPrimary }) => {
  const { setApiKey, setEnabled, testConnection, updateProviderConfig } = useAIConfigStore();
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localKey, setLocalKey] = useState(config.apiKey);

  const providerInfo = PROVIDER_INFO[config.provider];
  const Icon = providerInfo.icon;

  const handleSaveKey = () => {
    setApiKey(config.provider, localKey);
  };

  const handleTest = async () => {
    if (!config.apiKey && !localKey) return;

    // Guardar primero si hay cambios
    if (localKey !== config.apiKey) {
      setApiKey(config.provider, localKey);
    }

    setIsTesting(true);
    await testConnection(config.provider);
    setIsTesting(false);
  };

  const maskApiKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 12) return '••••••••••••';
    return key.substring(0, 8) + '••••••••••••' + key.substring(key.length - 4);
  };

  return (
    <div
      className={`
        relative p-6 rounded-2xl border transition-all
        ${config.isEnabled
          ? 'bg-white/5 border-white/20'
          : 'bg-white/[0.02] border-white/10 opacity-60'
        }
        ${isPrimary ? 'ring-2 ring-accent-500/50' : ''}
      `}
    >
      {/* Primary Badge */}
      {isPrimary && (
        <div className="absolute -top-2 right-4 px-2 py-0.5 bg-accent-500 text-white text-xs font-medium rounded-full">
          Principal
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${providerInfo.bgColor}`}>
            <Icon className={`w-6 h-6 ${providerInfo.color}`} />
          </div>
          <div>
            <h3 className="font-semibold text-white">{config.name}</h3>
            <p className="text-xs text-slate-400">{config.model}</p>
          </div>
        </div>

        {/* Enable/Disable Toggle */}
        <button
          onClick={() => setEnabled(config.provider, !config.isEnabled)}
          className={`
            relative w-12 h-6 rounded-full transition-colors
            ${config.isEnabled ? 'bg-accent-500' : 'bg-slate-600'}
          `}
        >
          <div
            className={`
              absolute top-1 w-4 h-4 bg-white rounded-full transition-transform
              ${config.isEnabled ? 'translate-x-7' : 'translate-x-1'}
            `}
          />
        </button>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-400 mb-4">{providerInfo.description}</p>

      {/* API Key Input */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-300">
          API Key
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={localKey}
              onChange={(e) => setLocalKey(e.target.value)}
              placeholder={`${providerInfo.keyPrefix}...`}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-accent-500 focus:bg-white/10 transition-all pr-20 font-mono text-sm"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                onClick={() => setShowKey(!showKey)}
                className="p-1.5 hover:bg-white/10 rounded transition-colors"
              >
                {showKey ? (
                  <EyeOff className="w-4 h-4 text-slate-400" />
                ) : (
                  <Eye className="w-4 h-4 text-slate-400" />
                )}
              </button>
              {localKey && <CopyButton text={localKey} />}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSaveKey}
            disabled={localKey === config.apiKey}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
              ${localKey !== config.apiKey
                ? 'bg-accent-500 hover:bg-accent-600 text-white'
                : 'bg-white/5 text-slate-500 cursor-not-allowed'
              }
            `}
          >
            <Key className="w-4 h-4" />
            Guardar
          </button>

          <button
            onClick={handleTest}
            disabled={isTesting || (!config.apiKey && !localKey)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
              ${!isTesting && (config.apiKey || localKey)
                ? 'bg-white/10 hover:bg-white/20 text-white'
                : 'bg-white/5 text-slate-500 cursor-not-allowed'
              }
            `}
          >
            {isTesting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Probando...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Probar conexión
              </>
            )}
          </button>

          {!isPrimary && config.isConfigured && (
            <button
              onClick={onSetPrimary}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium text-slate-300 transition-colors flex items-center gap-2"
            >
              <ArrowUpDown className="w-4 h-4" />
              Hacer principal
            </button>
          )}

          <a
            href={providerInfo.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium text-slate-300 transition-colors flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Obtener API Key
          </a>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <StatusBadge status={config.lastTestResult} message={config.lastTestMessage} />
          {config.lastTested && (
            <span className="text-xs text-slate-500">
              Última prueba: {new Date(config.lastTested).toLocaleString('es-CO')}
            </span>
          )}
        </div>

        {/* Advanced Settings */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <Settings className="w-4 h-4" />
          Configuración avanzada
          {showAdvanced ? '▲' : '▼'}
        </button>

        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Modelo
              </label>
              <input
                type="text"
                value={config.model}
                onChange={(e) => updateProviderConfig(config.provider, { model: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-accent-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Max Tokens
                </label>
                <input
                  type="number"
                  value={config.maxTokens}
                  onChange={(e) => updateProviderConfig(config.provider, { maxTokens: parseInt(e.target.value) || 4096 })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-accent-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Temperatura ({config.temperature})
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.temperature}
                  onChange={(e) => updateProviderConfig(config.provider, { temperature: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const AIConfigDashboard: React.FC = () => {
  const {
    providers,
    primaryProvider,
    fallbackEnabled,
    setPrimaryProvider,
    setFallbackEnabled,
  } = useAIConfigStore();

  const configuredCount = Object.values(providers).filter(p => p.isConfigured).length;
  const enabledCount = Object.values(providers).filter(p => p.isEnabled && p.isConfigured).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Configuración de IA</h1>
            <p className="text-slate-400">Gestiona las API keys de los proveedores de IA</p>
          </div>
        </div>

        {/* Status Summary */}
        <div className="flex items-center gap-4">
          <div className="text-center px-4">
            <p className="text-2xl font-bold text-white">{configuredCount}/3</p>
            <p className="text-xs text-slate-400">Configurados</p>
          </div>
          <div className="text-center px-4 border-l border-white/10">
            <p className="text-2xl font-bold text-green-400">{enabledCount}</p>
            <p className="text-xs text-slate-400">Activos</p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-blue-300">
            <strong>¿Cómo funciona?</strong> Configura al menos un proveedor de IA para activar el chat inteligente.
            El proveedor principal se usa primero, y si falla, el sistema intenta con los proveedores de respaldo.
          </p>
        </div>
      </div>

      {/* Global Settings */}
      <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-slate-400" />
            <div>
              <p className="font-medium text-white">Sistema de Fallback</p>
              <p className="text-sm text-slate-400">
                Si el proveedor principal falla, usar automáticamente el siguiente disponible
              </p>
            </div>
          </div>
          <button
            onClick={() => setFallbackEnabled(!fallbackEnabled)}
            className={`
              relative w-12 h-6 rounded-full transition-colors
              ${fallbackEnabled ? 'bg-accent-500' : 'bg-slate-600'}
            `}
          >
            <div
              className={`
                absolute top-1 w-4 h-4 bg-white rounded-full transition-transform
                ${fallbackEnabled ? 'translate-x-7' : 'translate-x-1'}
              `}
            />
          </button>
        </div>
      </div>

      {/* Provider Cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        {(['claude', 'gemini', 'openai'] as AIProvider[]).map((provider) => (
          <ProviderCard
            key={provider}
            config={providers[provider]}
            isPrimary={provider === primaryProvider}
            onSetPrimary={() => setPrimaryProvider(provider)}
          />
        ))}
      </div>

      {/* Instructions */}
      <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
        <h3 className="text-lg font-semibold text-white mb-4">📋 Instrucciones</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <h4 className="font-medium text-purple-400">Claude (Anthropic)</h4>
            <ol className="text-sm text-slate-400 space-y-1 list-decimal list-inside">
              <li>Ve a console.anthropic.com</li>
              <li>Crea una cuenta o inicia sesión</li>
              <li>Ve a "API Keys"</li>
              <li>Crea una nueva key y cópiala aquí</li>
            </ol>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-blue-400">Gemini (Google)</h4>
            <ol className="text-sm text-slate-400 space-y-1 list-decimal list-inside">
              <li>Ve a aistudio.google.com</li>
              <li>Inicia sesión con Google</li>
              <li>Haz clic en "Get API Key"</li>
              <li>Crea un proyecto y obtén la key</li>
            </ol>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-emerald-400">GPT (OpenAI)</h4>
            <ol className="text-sm text-slate-400 space-y-1 list-decimal list-inside">
              <li>Ve a platform.openai.com</li>
              <li>Crea una cuenta o inicia sesión</li>
              <li>Ve a "API Keys"</li>
              <li>Crea una nueva key y cópiala aquí</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIConfigDashboard;
