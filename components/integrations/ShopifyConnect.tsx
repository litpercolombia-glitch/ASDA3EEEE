/**
 * ShopifyConnect
 *
 * Componente para conectar, configurar y sincronizar con Shopify.
 */

import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Link2,
  Unlink,
  RefreshCw,
  Check,
  AlertCircle,
  Loader2,
  Settings,
  Package,
  ShoppingCart,
  Users,
  Boxes,
  ChevronRight,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { shopifyConnection, shopifySync } from '@/services/shopifyService';
import type { ShopifyConnection, ShopifySyncStatus, ShopifyShop } from '@/types/shopify.types';

interface ShopifyConnectProps {
  onConnectionChange?: (connected: boolean) => void;
}

type Tab = 'connection' | 'sync' | 'settings';

export const ShopifyConnect: React.FC<ShopifyConnectProps> = ({ onConnectionChange }) => {
  const [activeTab, setActiveTab] = useState<Tab>('connection');
  const [connection, setConnection] = useState<ShopifyConnection | null>(null);
  const [shop, setShop] = useState<ShopifyShop | null>(null);
  const [syncStatus, setSyncStatus] = useState<ShopifySyncStatus | null>(null);

  // Formulario de conexión
  const [shopDomain, setShopDomain] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState('');

  // Sincronización
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{
    type: string;
    progress: number;
  } | null>(null);

  // Cargar conexión existente
  useEffect(() => {
    const existingConnection = shopifyConnection.getConnection();
    if (existingConnection) {
      setConnection(existingConnection);
      setSyncStatus(shopifySync.getSyncStatus());
      loadShopInfo();
    }
  }, []);

  // Cargar info de la tienda
  const loadShopInfo = async () => {
    try {
      const shopInfo = await shopifyConnection.getService().getShop();
      setShop(shopInfo);
    } catch (error) {
      console.error('Error loading shop info:', error);
    }
  };

  // Conectar
  const handleConnect = async () => {
    if (!shopDomain || !accessToken) {
      setConnectionError('Completa todos los campos');
      return;
    }

    setIsConnecting(true);
    setConnectionError('');

    try {
      // Normalizar dominio
      let domain = shopDomain.trim().toLowerCase();
      if (!domain.includes('.myshopify.com')) {
        domain = `${domain}.myshopify.com`;
      }
      domain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

      const result = await shopifyConnection.testConnection(domain, accessToken);

      if (result.success && result.shop) {
        const newConnection = shopifyConnection.saveConnection({
          shopDomain: domain,
          accessToken,
          apiVersion: '2024-01',
          scopes: ['read_products', 'read_orders', 'read_inventory', 'read_customers', 'write_fulfillments'],
          isActive: true,
          lastSyncAt: null,
        });

        setConnection(newConnection);
        setShop(result.shop);
        setShopDomain('');
        setAccessToken('');
        onConnectionChange?.(true);
      } else {
        setConnectionError(result.error || 'Error al conectar con Shopify');
      }
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Error de conexión');
    } finally {
      setIsConnecting(false);
    }
  };

  // Desconectar
  const handleDisconnect = () => {
    shopifyConnection.removeConnection();
    setConnection(null);
    setShop(null);
    setSyncStatus(null);
    onConnectionChange?.(false);
  };

  // Sincronizar
  const handleSync = async (type: 'products' | 'orders' | 'inventory' | 'all') => {
    setIsSyncing(true);
    setSyncProgress({ type, progress: 0 });

    try {
      if (type === 'all' || type === 'products') {
        setSyncProgress({ type: 'products', progress: 0 });
        await shopifySync.syncProducts((p) => setSyncProgress({ type: 'products', progress: p }));
      }

      if (type === 'all' || type === 'orders') {
        setSyncProgress({ type: 'orders', progress: 0 });
        await shopifySync.syncOrders(undefined, (p) => setSyncProgress({ type: 'orders', progress: p }));
      }

      if (type === 'all' || type === 'inventory') {
        setSyncProgress({ type: 'inventory', progress: 0 });
        await shopifySync.syncInventory((p) => setSyncProgress({ type: 'inventory', progress: p }));
      }

      setSyncStatus(shopifySync.getSyncStatus());
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  };

  // Formatear fecha
  const formatDate = (date: Date | string | null): string => {
    if (!date) return 'Nunca';
    const d = new Date(date);
    return d.toLocaleString('es-CO', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
            <ShoppingBag className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Integración Shopify
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {connection ? `Conectado a ${shop?.name || connection.shopDomain}` : 'No conectado'}
            </p>
          </div>
          {connection && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 text-sm text-green-600 bg-green-100 dark:bg-green-900/30 rounded-full">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Activo
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      {connection && (
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          {[
            { id: 'connection', label: 'Conexión', icon: Link2 },
            { id: 'sync', label: 'Sincronización', icon: RefreshCw },
            { id: 'settings', label: 'Configuración', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-green-600 border-b-2 border-green-500 bg-green-50/50 dark:bg-green-900/10'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {!connection ? (
          // Formulario de conexión
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Conectar con Shopify
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                Sincroniza productos, órdenes e inventario automáticamente
              </p>
            </div>

            <div className="space-y-4">
              {/* Dominio */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Dominio de la tienda
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={shopDomain}
                    onChange={(e) => setShopDomain(e.target.value)}
                    placeholder="mitienda.myshopify.com"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Puedes ingresar solo el nombre: "mitienda" o el dominio completo
                </p>
              </div>

              {/* Token */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Access Token
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="shpat_xxxxxxxxxxxxxxxx"
                    className="w-full px-4 py-3 pr-12 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Genera un token en Shopify Admin → Configuración → Apps → Desarrollar apps
                </p>
              </div>

              {/* Error */}
              {connectionError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{connectionError}</span>
                  </div>
                </div>
              )}

              {/* Botón conectar */}
              <button
                onClick={handleConnect}
                disabled={isConnecting || !shopDomain || !accessToken}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 text-white bg-green-600 hover:bg-green-700 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <Link2 className="w-5 h-5" />
                    Conectar Tienda
                  </>
                )}
              </button>
            </div>

            {/* Ayuda */}
            <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
              <h4 className="font-medium text-slate-900 dark:text-white mb-2">
                ¿Cómo obtener el Access Token?
              </h4>
              <ol className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 text-xs flex items-center justify-center font-medium">1</span>
                  <span>Ve a tu Shopify Admin → Configuración → Apps</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 text-xs flex items-center justify-center font-medium">2</span>
                  <span>Haz clic en "Desarrollar apps" y crea una nueva app</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 text-xs flex items-center justify-center font-medium">3</span>
                  <span>Configura los permisos necesarios (productos, órdenes, inventario)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 text-xs flex items-center justify-center font-medium">4</span>
                  <span>Instala la app y copia el Admin API access token</span>
                </li>
              </ol>
            </div>
          </div>
        ) : activeTab === 'connection' ? (
          // Info de conexión
          <div className="space-y-6">
            {/* Info de la tienda */}
            {shop && (
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {shop.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {shop.myshopifyDomain}
                    </p>
                  </div>
                  <a
                    href={`https://${shop.myshopifyDomain}/admin`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
                  >
                    Abrir Admin
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Plan</p>
                    <p className="font-medium text-slate-900 dark:text-white">{shop.planDisplayName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">País</p>
                    <p className="font-medium text-slate-900 dark:text-white">{shop.country}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Moneda</p>
                    <p className="font-medium text-slate-900 dark:text-white">{shop.currency}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Zona horaria</p>
                    <p className="font-medium text-slate-900 dark:text-white">{shop.timezone}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Permisos */}
            <div>
              <h4 className="font-medium text-slate-900 dark:text-white mb-3">Permisos activos</h4>
              <div className="flex flex-wrap gap-2">
                {connection.scopes.map(scope => (
                  <span
                    key={scope}
                    className="px-3 py-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded-full"
                  >
                    {scope}
                  </span>
                ))}
              </div>
            </div>

            {/* Desconectar */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={handleDisconnect}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Unlink className="w-4 h-4" />
                Desconectar tienda
              </button>
            </div>
          </div>
        ) : activeTab === 'sync' ? (
          // Sincronización
          <div className="space-y-6">
            {/* Progreso actual */}
            {isSyncing && syncProgress && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <span className="font-medium text-blue-900 dark:text-blue-100">
                    Sincronizando {syncProgress.type}...
                  </span>
                </div>
                <div className="w-full h-2 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${syncProgress.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Opciones de sincronización */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  id: 'products',
                  label: 'Productos',
                  icon: Package,
                  color: 'blue',
                  stats: syncStatus?.products,
                },
                {
                  id: 'orders',
                  label: 'Órdenes',
                  icon: ShoppingCart,
                  color: 'green',
                  stats: syncStatus?.orders,
                },
                {
                  id: 'inventory',
                  label: 'Inventario',
                  icon: Boxes,
                  color: 'amber',
                  stats: syncStatus?.inventory,
                },
                {
                  id: 'customers',
                  label: 'Clientes',
                  icon: Users,
                  color: 'purple',
                  stats: syncStatus?.customers,
                },
              ].map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg bg-${item.color}-100 dark:bg-${item.color}-900/30`}>
                      <item.icon className={`w-5 h-5 text-${item.color}-600`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900 dark:text-white">
                        {item.label}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(item.stats?.lastSyncAt || null)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                    <div>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {item.stats?.total || 0}
                      </p>
                      <p className="text-xs text-slate-500">Total</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-green-600">
                        {item.stats?.synced || 0}
                      </p>
                      <p className="text-xs text-slate-500">Sincronizados</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-red-600">
                        {item.stats?.failed || 0}
                      </p>
                      <p className="text-xs text-slate-500">Fallidos</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSync(item.id as any)}
                    disabled={isSyncing}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing && syncProgress?.type === item.id ? 'animate-spin' : ''}`} />
                    Sincronizar
                  </button>
                </div>
              ))}
            </div>

            {/* Sincronizar todo */}
            <button
              onClick={() => handleSync('all')}
              disabled={isSyncing}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 text-white bg-green-600 hover:bg-green-700 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Sincronizar Todo
                </>
              )}
            </button>
          </div>
        ) : (
          // Configuración
          <div className="space-y-6">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-900 dark:text-amber-100">
                    Configuración avanzada
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    La configuración avanzada de webhooks y sincronización automática estará disponible próximamente.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-slate-900 dark:text-white">
                Webhooks (Próximamente)
              </h4>
              <div className="space-y-2">
                {[
                  'Nuevas órdenes',
                  'Actualización de productos',
                  'Cambios de inventario',
                  'Fulfillment completado',
                ].map((webhook) => (
                  <div
                    key={webhook}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg opacity-50"
                  >
                    <span className="text-sm text-slate-700 dark:text-slate-300">{webhook}</span>
                    <div className="w-10 h-5 bg-slate-300 dark:bg-slate-600 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopifyConnect;
