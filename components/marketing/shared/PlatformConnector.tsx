// components/marketing/shared/PlatformConnector.tsx
// Componente de conexión para plataformas publicitarias

import React, { useState } from 'react';
import {
  Facebook,
  Chrome,
  Music2,
  Check,
  Loader2,
  AlertCircle,
  X,
  RefreshCw,
  ExternalLink,
  Settings,
} from 'lucide-react';
import { oauthManager } from '../../../services/marketing/oauth/OAuthManager';
import { useMarketingStore } from '../../../stores/marketingStore';
import type { AdPlatform, AdAccount } from '../../../types/marketing.types';

// ============================================
// CONFIGURACIÓN DE PLATAFORMAS
// ============================================

const PLATFORM_CONFIG = {
  meta: {
    name: 'Meta Ads',
    description: 'Facebook e Instagram Ads',
    icon: Facebook,
    color: 'bg-blue-600',
    hoverColor: 'hover:bg-blue-700',
    borderColor: 'border-blue-500/50',
    textColor: 'text-blue-400',
    bgLight: 'bg-blue-500/10',
  },
  google: {
    name: 'Google Ads',
    description: 'Search, Display, YouTube y Shopping',
    icon: Chrome,
    color: 'bg-red-500',
    hoverColor: 'hover:bg-red-600',
    borderColor: 'border-red-500/50',
    textColor: 'text-red-400',
    bgLight: 'bg-red-500/10',
  },
  tiktok: {
    name: 'TikTok Ads',
    description: 'TikTok For Business',
    icon: Music2,
    color: 'bg-pink-500',
    hoverColor: 'hover:bg-pink-600',
    borderColor: 'border-pink-500/50',
    textColor: 'text-pink-400',
    bgLight: 'bg-pink-500/10',
  },
};

// ============================================
// TIPOS
// ============================================

interface PlatformConnectorProps {
  platform: AdPlatform;
  showAccountSelector?: boolean;
  compact?: boolean;
}

type ConnectionStatus = 'idle' | 'connecting' | 'success' | 'error';

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function PlatformConnector({
  platform,
  showAccountSelector = true,
  compact = false,
}: PlatformConnectorProps) {
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [showAccounts, setShowAccounts] = useState(false);

  const {
    connections,
    accounts,
    connectPlatform,
    disconnectPlatform,
    addAccounts,
    toggleAccountSelection,
    selectedAccountIds,
  } = useMarketingStore();

  const config = PLATFORM_CONFIG[platform];
  const Icon = config.icon;
  const isConnected = connections[platform].isConnected;
  const isConfigured = oauthManager.isConfigured(platform);
  const platformAccounts = accounts.filter((a) => a.platform === platform);

  // ==================== HANDLERS ====================

  const handleConnect = async () => {
    if (!isConfigured) {
      setError(`Configura las credenciales de ${config.name} en las variables de entorno`);
      setStatus('error');
      return;
    }

    try {
      setStatus('connecting');
      setError(null);

      const result = await oauthManager.connect(platform);

      // Guardar token y cuentas
      connectPlatform(platform, result.accessToken, result.refreshToken);
      addAccounts(result.adAccounts);

      setStatus('success');
      setShowAccounts(true);

      // Reset status después de 3 segundos
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error de conexión';
      setError(message);
      setStatus('error');
    }
  };

  const handleDisconnect = () => {
    disconnectPlatform(platform);
    setStatus('idle');
    setError(null);
    setShowAccounts(false);
  };

  const handleRefresh = async () => {
    // TODO: Implementar refresh de datos
    setStatus('connecting');
    setTimeout(() => setStatus('idle'), 1500);
  };

  // ==================== RENDER COMPACTO ====================

  if (compact) {
    return (
      <div
        className={`flex items-center justify-between p-3 rounded-lg border ${
          isConnected ? config.borderColor : 'border-gray-700'
        } ${isConnected ? config.bgLight : 'bg-gray-800/50'}`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${config.color}`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">{config.name}</p>
            <p className="text-xs text-gray-400">
              {isConnected ? `${platformAccounts.length} cuenta(s)` : 'No conectado'}
            </p>
          </div>
        </div>

        {isConnected ? (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-green-400 text-xs">
              <Check className="w-3 h-3" />
              Conectado
            </span>
            <button
              onClick={handleDisconnect}
              className="p-1 text-gray-400 hover:text-red-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            disabled={status === 'connecting'}
            className={`px-3 py-1.5 text-sm text-white rounded-lg ${config.color} ${config.hoverColor} disabled:opacity-50`}
          >
            {status === 'connecting' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Conectar'
            )}
          </button>
        )}
      </div>
    );
  }

  // ==================== RENDER COMPLETO ====================

  return (
    <div
      className={`p-6 rounded-xl border transition-all ${
        isConnected ? config.borderColor : 'border-gray-700'
      } ${isConnected ? config.bgLight : 'bg-gray-800/50'}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${config.color}`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{config.name}</h3>
            <p className="text-sm text-gray-400">{config.description}</p>
          </div>
        </div>

        {/* Estado y Acciones */}
        <div className="flex items-center gap-3">
          {isConnected ? (
            <>
              <span className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-sm">
                <Check className="w-4 h-4" />
                Conectado
              </span>
              <button
                onClick={handleRefresh}
                disabled={status === 'connecting'}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                title="Actualizar datos"
              >
                <RefreshCw className={`w-5 h-5 ${status === 'connecting' ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 text-red-400 border border-red-400/50 rounded-lg hover:bg-red-400/10 transition-colors"
              >
                Desconectar
              </button>
            </>
          ) : (
            <button
              onClick={handleConnect}
              disabled={status === 'connecting'}
              className={`flex items-center gap-2 px-6 py-3 text-white rounded-lg ${config.color} ${config.hoverColor} disabled:opacity-50 transition-colors`}
            >
              {status === 'connecting' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Icon className="w-5 h-5" />
                  Conectar con {config.name.split(' ')[0]}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto p-1 hover:bg-red-500/20 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* No configurado */}
      {!isConfigured && !error && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/50 rounded-lg flex items-center gap-2 text-yellow-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">
            Configura las credenciales de {config.name} para habilitar la conexión
          </span>
          <a
            href="#"
            className="ml-auto flex items-center gap-1 text-sm hover:underline"
          >
            Ver documentación
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}

      {/* Cuentas Conectadas */}
      {isConnected && showAccountSelector && platformAccounts.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowAccounts(!showAccounts)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-3"
          >
            <Settings className="w-4 h-4" />
            {platformAccounts.length} cuenta(s) publicitaria(s)
            <span className={`transform transition-transform ${showAccounts ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {showAccounts && (
            <div className="space-y-2 pl-6">
              {platformAccounts.map((account) => (
                <label
                  key={account.id}
                  className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedAccountIds.includes(account.id)}
                    onChange={() => toggleAccountSelection(account.id)}
                    className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{account.name}</p>
                    <p className="text-xs text-gray-400">
                      ID: {account.externalId} • {account.currency}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-xs rounded ${
                      account.status === 'active'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-600 text-gray-400'
                    }`}
                  >
                    {account.status === 'active' ? 'Activa' : account.status}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Success Message */}
      {status === 'success' && (
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/50 rounded-lg flex items-center gap-2 text-green-400">
          <Check className="w-5 h-5" />
          <span className="text-sm">Conexión exitosa. Selecciona las cuentas que deseas trackear.</span>
        </div>
      )}
    </div>
  );
}

// ============================================
// COMPONENTE DE LISTA
// ============================================

export function PlatformConnectorList() {
  return (
    <div className="space-y-4">
      <PlatformConnector platform="meta" />
      <PlatformConnector platform="google" />
      <PlatformConnector platform="tiktok" />
    </div>
  );
}

// ============================================
// COMPONENTE COMPACTO DE ESTADO
// ============================================

export function PlatformConnectionStatus() {
  const { connections } = useMarketingStore();

  const platforms: AdPlatform[] = ['meta', 'google', 'tiktok'];
  const connectedCount = platforms.filter((p) => connections[p].isConnected).length;

  return (
    <div className="flex items-center gap-2">
      {platforms.map((platform) => {
        const config = PLATFORM_CONFIG[platform];
        const Icon = config.icon;
        const isConnected = connections[platform].isConnected;

        return (
          <div
            key={platform}
            className={`p-2 rounded-lg ${
              isConnected ? config.color : 'bg-gray-700'
            } transition-colors`}
            title={`${config.name}: ${isConnected ? 'Conectado' : 'No conectado'}`}
          >
            <Icon className={`w-4 h-4 ${isConnected ? 'text-white' : 'text-gray-500'}`} />
          </div>
        );
      })}
      <span className="text-sm text-gray-400 ml-2">
        {connectedCount}/{platforms.length} conectadas
      </span>
    </div>
  );
}

export default PlatformConnector;
