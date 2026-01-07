// components/marketing/MarketingView.tsx
// Vista principal de Marketing con todas las pestañas

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Target,
  BarChart3,
  RefreshCw,
  Eye,
  EyeOff,
  Facebook,
  Chrome,
  Music2,
  Check,
  Loader2,
  AlertCircle,
  X,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useLayoutStore } from '../../stores/layoutStore';
import { useMarketingStore } from '../../stores/marketingStore';
import { oauthManager } from '../../services/marketing/OAuthManager';
import type { AdPlatform, DashboardMetrics, SalesByPaymentMethod } from '../../types/marketing.types';

// ============================================
// DATOS DEMO
// ============================================

const DEMO_METRICS: DashboardMetrics = {
  revenue: 45890000,
  adSpend: 12500000,
  profit: 30190000,
  profitMargin: 65.8,
  roas: 3.67,
  roi: 241.5,
  cpa: 45000,
  totalSales: 243,
  pendingSales: 12,
  approvedSales: 218,
  refundedSales: 8,
  approvalRate: 89.7,
  revenueChange: 12.5,
  spendChange: -5.2,
  roasChange: 18.3,
  salesChange: 15.8,
};

const DEMO_PAYMENT_METHODS: SalesByPaymentMethod[] = [
  { method: 'Tarjeta Crédito', count: 98, amount: 18560000, percentage: 40.4 },
  { method: 'PSE', count: 67, amount: 12680000, percentage: 27.6 },
  { method: 'Nequi', count: 45, amount: 8520000, percentage: 18.6 },
  { method: 'Efecty', count: 23, amount: 4350000, percentage: 9.5 },
  { method: 'Transferencia', count: 10, amount: 1780000, percentage: 3.9 },
];

// ============================================
// COMPONENTES
// ============================================

interface KPICardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ElementType;
  color: string;
  hideValue?: boolean;
}

function KPICard({ title, value, change, icon: Icon, color, hideValue }: KPICardProps) {
  const isPositive = change !== undefined && change >= 0;
  return (
    <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-gray-600 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-white mb-1">{hideValue ? '****' : value}</p>
      <p className="text-sm text-gray-400">{title}</p>
    </div>
  );
}

function PlatformConnector({ platform, name, icon: Icon, color }: { platform: AdPlatform; name: string; icon: React.ElementType; color: string }) {
  const [status, setStatus] = React.useState<'idle' | 'connecting' | 'error'>('idle');
  const [error, setError] = React.useState<string | null>(null);
  const { connections, connectPlatform, disconnectPlatform, addAccounts } = useMarketingStore();
  const isConnected = connections[platform].isConnected;

  const handleConnect = async () => {
    try {
      setStatus('connecting');
      setError(null);
      const result = await oauthManager.connect(platform);
      connectPlatform(platform, result.accessToken);
      addAccounts(result.adAccounts);
      setStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      setStatus('error');
    }
  };

  return (
    <div className={`p-4 rounded-xl border ${isConnected ? 'border-green-500/50 bg-green-500/5' : 'border-gray-700 bg-gray-800/50'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-white">{name}</p>
            <p className="text-xs text-gray-400">{isConnected ? 'Conectado' : 'No conectado'}</p>
          </div>
        </div>
        {isConnected ? (
          <button onClick={() => disconnectPlatform(platform)} className="px-3 py-1.5 text-red-400 border border-red-400/50 rounded-lg text-sm hover:bg-red-400/10">
            Desconectar
          </button>
        ) : (
          <button onClick={handleConnect} disabled={status === 'connecting'} className={`px-4 py-2 text-white rounded-lg ${color} hover:opacity-90 disabled:opacity-50`}>
            {status === 'connecting' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Conectar'}
          </button>
        )}
      </div>
      {error && (
        <div className="mt-3 p-2 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}

// ============================================
// VISTAS POR TAB
// ============================================

function DashboardView() {
  const [hideValues, setHideValues] = React.useState(false);
  const metrics = DEMO_METRICS;

  const formatCurrency = (value: number) => value >= 1000000 ? `$${(value / 1000000).toFixed(1)}M` : `$${value.toLocaleString('es-CO')}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Dashboard de Marketing</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setHideValues(!hideValues)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
            {hideValues ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <RefreshCw className="w-4 h-4" /> Actualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Ingresos" value={formatCurrency(metrics.revenue)} change={metrics.revenueChange} icon={DollarSign} color="bg-green-500" hideValue={hideValues} />
        <KPICard title="Gasto Ads" value={formatCurrency(metrics.adSpend)} change={metrics.spendChange} icon={Target} color="bg-blue-500" hideValue={hideValues} />
        <KPICard title="ROAS" value={`${metrics.roas.toFixed(2)}x`} change={metrics.roasChange} icon={TrendingUp} color="bg-purple-500" hideValue={hideValues} />
        <KPICard title="Ganancia" value={formatCurrency(metrics.profit)} icon={BarChart3} color="bg-emerald-600" hideValue={hideValues} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-400" /> Ventas por Método de Pago
          </h3>
          <div className="space-y-3">
            {DEMO_PAYMENT_METHODS.map((item) => (
              <div key={item.method} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">{item.method}</span>
                  <span className="text-white">{hideValues ? '****' : `$${(item.amount / 1000000).toFixed(1)}M`} ({item.percentage}%)</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${item.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sales Status */}
        <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-green-400" /> Estado de Ventas
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Pendientes', value: metrics.pendingSales, color: 'bg-yellow-500' },
              { label: 'Aprobadas', value: metrics.approvedSales, color: 'bg-green-500' },
              { label: 'Reembolsadas', value: metrics.refundedSales, color: 'bg-orange-500' },
              { label: 'Total', value: metrics.totalSales, color: 'bg-blue-500' },
            ].map((item) => (
              <div key={item.label} className="p-3 bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-sm text-gray-400">{item.label}</span>
                </div>
                <p className="text-xl font-bold text-white">{hideValues ? '**' : item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function IntegrationsView() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Conexiones de Plataformas</h2>
      <div className="space-y-4">
        <PlatformConnector platform="meta" name="Meta Ads" icon={Facebook} color="bg-blue-600" />
        <PlatformConnector platform="google" name="Google Ads" icon={Chrome} color="bg-red-500" />
        <PlatformConnector platform="tiktok" name="TikTok Ads" icon={Music2} color="bg-pink-500" />
      </div>
    </div>
  );
}

function PlaceholderView({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="p-4 bg-gray-700/50 rounded-full mb-4">
        <Target className="w-12 h-12 text-gray-500" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400">Próximamente</p>
    </div>
  );
}

// ============================================
// MARKETING VIEW PRINCIPAL
// ============================================

export function MarketingView() {
  const { activeMarketingTab } = useLayoutStore();

  const renderContent = () => {
    switch (activeMarketingTab) {
      case 'dashboard': return <DashboardView />;
      case 'integraciones': return <IntegrationsView />;
      case 'meta': return <PlaceholderView title="Meta Ads (Facebook/Instagram)" />;
      case 'google': return <PlaceholderView title="Google Ads" />;
      case 'tiktok': return <PlaceholderView title="TikTok Ads" />;
      case 'utm': return <PlaceholderView title="Sistema de UTMs" />;
      case 'reglas': return <PlaceholderView title="Reglas de Automatización" />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="p-6">
      {renderContent()}
    </div>
  );
}

export default MarketingView;
