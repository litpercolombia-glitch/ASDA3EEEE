// components/Admin/MCPCenter/MCPDashboard.tsx
// Centro de Conexiones MCP - Integraciones con plataformas externas

import React, { useState } from 'react';
import {
  Plug,
  Plus,
  RefreshCw,
  Settings,
  Trash2,
  Check,
  X,
  AlertCircle,
  Clock,
  Zap,
  ExternalLink,
  ChevronRight,
  Play,
  Pause,
  Link2,
  Unlink,
  Activity,
  Download,
  Upload,
  Search,
} from 'lucide-react';
import {
  useMCPStore,
  PROVIDERS,
  CATEGORY_LABELS,
  type Connection,
  type ConnectionProvider,
  type ProviderInfo,
} from '../../../services/mcpConnectionsService';

// ============================================
// COMPONENTES AUXILIARES
// ============================================

const StatusBadge: React.FC<{ status: Connection['status'] }> = ({ status }) => {
  const styles: Record<string, string> = {
    connected: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    disconnected: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    expired: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  };

  const labels: Record<string, string> = {
    connected: 'Conectado',
    disconnected: 'Desconectado',
    error: 'Error',
    pending: 'Pendiente',
    expired: 'Expirado',
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

const CategoryBadge: React.FC<{ category: string }> = ({ category }) => {
  const colors: Record<string, string> = {
    advertising: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    ecommerce: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    accounting: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    productivity: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    communication: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    automation: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[category]}`}>
      {CATEGORY_LABELS[category]}
    </span>
  );
};

// ============================================
// CARD DE PROVEEDOR
// ============================================

const ProviderCard: React.FC<{
  provider: ProviderInfo;
  connection?: Connection;
  onConnect: () => void;
  onDisconnect: () => void;
  onSync: () => void;
  onConfigure: () => void;
  isSyncing: boolean;
}> = ({ provider, connection, onConnect, onDisconnect, onSync, onConfigure, isSyncing }) => {
  const isConnected = connection?.status === 'connected';

  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        isConnected
          ? 'bg-white dark:bg-navy-800 border-green-200 dark:border-green-800'
          : 'bg-white dark:bg-navy-800 border-slate-200 dark:border-navy-700 hover:border-blue-300 dark:hover:border-blue-700'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{provider.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-slate-800 dark:text-white">{provider.name}</h4>
              {provider.isPopular && (
                <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded text-xs">
                  Popular
                </span>
              )}
            </div>
            <CategoryBadge category={provider.category} />
          </div>
        </div>
        {connection && <StatusBadge status={connection.status} />}
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{provider.description}</p>

      {/* Features */}
      <div className="flex flex-wrap gap-1 mb-4">
        {provider.features.slice(0, 3).map((feature, i) => (
          <span
            key={i}
            className="px-2 py-0.5 bg-slate-100 dark:bg-navy-700 rounded text-xs text-slate-600 dark:text-slate-300"
          >
            {feature}
          </span>
        ))}
        {provider.features.length > 3 && (
          <span className="px-2 py-0.5 text-xs text-slate-400">
            +{provider.features.length - 3} más
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {isConnected ? (
          <>
            <button
              onClick={onSync}
              disabled={isSyncing}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
            </button>
            <button
              onClick={onConfigure}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onDisconnect}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <Unlink className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            onClick={onConnect}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Link2 className="w-4 h-4" />
            Conectar
          </button>
        )}
      </div>

      {/* Last sync info */}
      {connection?.lastSync && (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-navy-700">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Última sync: {new Date(connection.lastSync).toLocaleString()}
            </span>
            <span
              className={`flex items-center gap-1 ${
                connection.syncEnabled ? 'text-green-500' : 'text-slate-400'
              }`}
            >
              {connection.syncEnabled ? (
                <>
                  <Zap className="w-3 h-3" /> Auto
                </>
              ) : (
                <>
                  <Pause className="w-3 h-3" /> Manual
                </>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// MODAL DE CONEXIÓN
// ============================================

const ConnectModal: React.FC<{
  provider: ProviderInfo;
  onClose: () => void;
  onConnect: (config: Record<string, any>) => void;
}> = ({ provider, onClose, onConnect }) => {
  const [config, setConfig] = useState<Record<string, any>>({});

  const handleConnect = () => {
    onConnect(config);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-navy-800 rounded-2xl w-full max-w-md">
        <div className="p-6 border-b border-slate-200 dark:border-navy-700">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{provider.icon}</span>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                Conectar {provider.name}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {provider.authType === 'oauth' ? 'Autorización OAuth' : 'Configuración API Key'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {provider.authType === 'oauth' ? (
            <div className="text-center py-4">
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Serás redirigido a {provider.name} para autorizar el acceso.
              </p>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Asegúrate de tener acceso a la cuenta de {provider.name} que deseas conectar.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  API Key
                </label>
                <input
                  type="password"
                  value={config.apiKey || ''}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-slate-800 dark:text-white"
                  placeholder="Ingresa tu API Key"
                />
              </div>

              {provider.id === 'dropi' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    ID de Tienda
                  </label>
                  <input
                    type="text"
                    value={config.storeId || ''}
                    onChange={(e) => setConfig({ ...config, storeId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-slate-800 dark:text-white"
                    placeholder="Tu ID de tienda en Dropi"
                  />
                </div>
              )}

              {provider.id === 'alegra' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email de Cuenta
                  </label>
                  <input
                    type="email"
                    value={config.email || ''}
                    onChange={(e) => setConfig({ ...config, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-slate-800 dark:text-white"
                    placeholder="tu@email.com"
                  />
                </div>
              )}
            </>
          )}

          {provider.docsUrl && (
            <a
              href={provider.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              Ver documentación
            </a>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 dark:border-navy-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-300 dark:border-navy-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-navy-700"
          >
            Cancelar
          </button>
          <button
            onClick={handleConnect}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            {provider.authType === 'oauth' ? 'Continuar con OAuth' : 'Conectar'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const MCPDashboard: React.FC = () => {
  const {
    connections,
    addConnection,
    updateConnection,
    deleteConnection,
    disconnectProvider,
    syncConnection,
    connectOAuth,
  } = useMCPStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [connectingProvider, setConnectingProvider] = useState<ProviderInfo | null>(null);
  const [syncingConnections, setSyncingConnections] = useState<Set<string>>(new Set());

  const categories = ['all', 'advertising', 'ecommerce', 'accounting', 'productivity', 'communication', 'automation'];

  // Filtrar proveedores
  const filteredProviders = PROVIDERS.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Obtener conexión por proveedor
  const getConnection = (providerId: ConnectionProvider) =>
    connections.find((c) => c.provider === providerId);

  const handleConnect = async (provider: ProviderInfo, config: Record<string, any>) => {
    if (provider.authType === 'oauth') {
      const authUrl = await connectOAuth(provider.id);
      // En producción, redirigiríamos al usuario
      // window.location.href = authUrl;

      // Para demo, simulamos conexión exitosa
      const connection = addConnection(provider.id, config);
      updateConnection(connection.id, {
        status: 'connected',
        credentials: { accessToken: 'demo_token' },
      });
    } else {
      const connection = addConnection(provider.id, config);
      // Simular validación de API key
      setTimeout(() => {
        updateConnection(connection.id, { status: 'connected' });
      }, 1000);
    }
    setConnectingProvider(null);
  };

  const handleSync = async (connectionId: string) => {
    setSyncingConnections((prev) => new Set(prev).add(connectionId));
    try {
      await syncConnection(connectionId);
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setSyncingConnections((prev) => {
        const next = new Set(prev);
        next.delete(connectionId);
        return next;
      });
    }
  };

  const connectedCount = connections.filter((c) => c.status === 'connected').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-900 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
            <Plug className="w-6 h-6 text-white" />
          </div>
          Conexiones MCP
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Conecta tu negocio con plataformas externas • {connectedCount} conexiones activas
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
            <Link2 className="w-4 h-4" />
            Conectadas
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{connectedCount}</p>
        </div>
        <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
            <Activity className="w-4 h-4" />
            Disponibles
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{PROVIDERS.length}</p>
        </div>
        <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
            <Download className="w-4 h-4" />
            Syncs Hoy
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">12</p>
        </div>
        <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
            <Upload className="w-4 h-4" />
            Datos Importados
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">2.5k</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar integraciones..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-slate-800 dark:text-white"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-700'
              }`}
            >
              {cat === 'all' ? 'Todas' : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProviders.map((provider) => {
          const connection = getConnection(provider.id);
          return (
            <ProviderCard
              key={provider.id}
              provider={provider}
              connection={connection}
              onConnect={() => setConnectingProvider(provider)}
              onDisconnect={() => connection && disconnectProvider(connection.id)}
              onSync={() => connection && handleSync(connection.id)}
              onConfigure={() => {}}
              isSyncing={connection ? syncingConnections.has(connection.id) : false}
            />
          );
        })}
      </div>

      {filteredProviders.length === 0 && (
        <div className="text-center py-12">
          <Plug className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-slate-500 dark:text-slate-400">
            No se encontraron integraciones
          </p>
        </div>
      )}

      {/* Connect Modal */}
      {connectingProvider && (
        <ConnectModal
          provider={connectingProvider}
          onClose={() => setConnectingProvider(null)}
          onConnect={(config) => handleConnect(connectingProvider, config)}
        />
      )}
    </div>
  );
};

export default MCPDashboard;
