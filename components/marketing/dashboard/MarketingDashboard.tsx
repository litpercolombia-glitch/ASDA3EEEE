// components/marketing/dashboard/MarketingDashboard.tsx
// Dashboard principal de Marketing con KPIs

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Target,
  BarChart3,
  PieChart,
  RefreshCw,
  Eye,
  EyeOff,
  Calendar,
  Filter,
  Download,
  MessageCircle,
  CreditCard,
  Percent,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useMarketingStore, useMarketingMetrics } from '../../../stores/marketingStore';
import { PlatformConnectionStatus } from '../shared/PlatformConnector';
import type { DashboardMetrics, SalesByPaymentMethod } from '../../../types/marketing.types';

// ============================================
// DATOS DE EJEMPLO (mientras no hay conexión real)
// ============================================

const DEMO_METRICS: DashboardMetrics = {
  revenue: 45890000,      // COP
  adSpend: 12500000,
  otherExpenses: 3200000,
  profit: 30190000,
  profitMargin: 65.8,
  roas: 3.67,
  roi: 241.5,
  cpa: 45000,
  arpu: 189000,
  totalSales: 243,
  pendingSales: 12,
  approvedSales: 218,
  refundedSales: 8,
  chargebackSales: 5,
  approvalRate: 89.7,
  totalConversations: 892,
  costPerConversation: 14013,
  conversationToSaleRate: 27.2,
  revenueChange: 12.5,
  spendChange: -5.2,
  roasChange: 18.3,
  salesChange: 15.8,
};

const DEMO_PAYMENT_METHODS: SalesByPaymentMethod[] = [
  { method: 'credit_card', count: 98, amount: 18560000, percentage: 40.4 },
  { method: 'pse', count: 67, amount: 12680000, percentage: 27.6 },
  { method: 'nequi', count: 45, amount: 8520000, percentage: 18.6 },
  { method: 'efecty', count: 23, amount: 4350000, percentage: 9.5 },
  { method: 'bank_transfer', count: 10, amount: 1780000, percentage: 3.9 },
];

// ============================================
// COMPONENTES HELPER
// ============================================

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  color: string;
  prefix?: string;
  suffix?: string;
  isHighlighted?: boolean;
  hideValue?: boolean;
}

function KPICard({
  title,
  value,
  change,
  icon: Icon,
  color,
  prefix = '',
  suffix = '',
  isHighlighted = false,
  hideValue = false,
}: KPICardProps) {
  const isPositive = change !== undefined && change >= 0;
  const displayValue = hideValue ? '****' : `${prefix}${typeof value === 'number' ? value.toLocaleString('es-CO') : value}${suffix}`;

  return (
    <div
      className={`p-4 rounded-xl border transition-all hover:scale-[1.02] ${
        isHighlighted
          ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/50'
          : 'bg-gray-800/50 border-gray-700'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {change !== undefined && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-white mb-1">{displayValue}</p>
      <p className="text-sm text-gray-400">{title}</p>
    </div>
  );
}

function PaymentMethodChart({ data, hideValues }: { data: SalesByPaymentMethod[]; hideValues: boolean }) {
  const colors: Record<string, string> = {
    credit_card: 'bg-blue-500',
    pse: 'bg-green-500',
    nequi: 'bg-purple-500',
    efecty: 'bg-yellow-500',
    bank_transfer: 'bg-cyan-500',
    daviplata: 'bg-red-500',
    other: 'bg-gray-500',
  };

  const labels: Record<string, string> = {
    credit_card: 'Tarjeta de Crédito',
    pse: 'PSE',
    nequi: 'Nequi',
    efecty: 'Efecty',
    bank_transfer: 'Transferencia',
    daviplata: 'Daviplata',
    other: 'Otros',
  };

  return (
    <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-blue-400" />
        Ventas por Método de Pago
      </h3>

      {/* Gráfico de barras horizontales */}
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.method} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">{labels[item.method] || item.method}</span>
              <span className="text-white font-medium">
                {hideValues ? '****' : `$${(item.amount / 1000000).toFixed(1)}M`} ({item.percentage}%)
              </span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${colors[item.method] || 'bg-gray-500'} rounded-full transition-all`}
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-700">
        {data.map((item) => (
          <div key={item.method} className="flex items-center gap-2 text-xs text-gray-400">
            <div className={`w-3 h-3 rounded-full ${colors[item.method] || 'bg-gray-500'}`} />
            {item.count} ventas
          </div>
        ))}
      </div>
    </div>
  );
}

function SalesStatusWidget({ metrics, hideValues }: { metrics: DashboardMetrics; hideValues: boolean }) {
  const statuses = [
    { label: 'Pendientes', value: metrics.pendingSales, color: 'bg-yellow-500' },
    { label: 'Aprobadas', value: metrics.approvedSales, color: 'bg-green-500' },
    { label: 'Reembolsadas', value: metrics.refundedSales, color: 'bg-orange-500' },
    { label: 'Contracargos', value: metrics.chargebackSales, color: 'bg-red-500' },
  ];

  return (
    <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <ShoppingCart className="w-5 h-5 text-green-400" />
        Estado de Ventas
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {statuses.map((status) => (
          <div key={status.label} className="p-3 bg-gray-700/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${status.color}`} />
              <span className="text-sm text-gray-400">{status.label}</span>
            </div>
            <p className="text-xl font-bold text-white">
              {hideValues ? '**' : status.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Tasa de Aprobación</span>
          <span className={`text-lg font-bold ${metrics.approvalRate >= 85 ? 'text-green-400' : 'text-yellow-400'}`}>
            {hideValues ? '**' : `${metrics.approvalRate}%`}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function MarketingDashboard() {
  const [hideValues, setHideValues] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { filters, setDateRange, lastSyncAt } = useMarketingStore();
  const { metrics: storedMetrics } = useMarketingMetrics();

  // Usar métricas demo si no hay datos reales
  const metrics = storedMetrics || DEMO_METRICS;
  const paymentMethods = DEMO_PAYMENT_METHODS;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // TODO: Implementar refresh real
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${value.toLocaleString('es-CO')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard de Marketing</h2>
          <p className="text-gray-400">
            Últimos 7 días • Actualizado {lastSyncAt ? new Date(lastSyncAt).toLocaleTimeString() : 'nunca'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <PlatformConnectionStatus />

          <button
            onClick={() => setHideValues(!hideValues)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title={hideValues ? 'Mostrar valores' : 'Ocultar valores'}
          >
            {hideValues ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Filtros rápidos */}
      <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl border border-gray-700">
        <Calendar className="w-5 h-5 text-gray-400" />
        <select
          className="bg-transparent text-white text-sm focus:outline-none cursor-pointer"
          value={filters.dateRange.preset || 'last_7_days'}
          onChange={(e) => {
            const preset = e.target.value;
            const now = new Date();
            let start = new Date();

            switch (preset) {
              case 'today':
                start = new Date(now.setHours(0, 0, 0, 0));
                break;
              case 'yesterday':
                start = new Date(now.setDate(now.getDate() - 1));
                start.setHours(0, 0, 0, 0);
                break;
              case 'last_7_days':
                start = new Date(now.setDate(now.getDate() - 7));
                break;
              case 'this_month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
              case 'last_month':
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                break;
            }

            setDateRange(start, new Date(), preset);
          }}
        >
          <option value="today">Hoy</option>
          <option value="yesterday">Ayer</option>
          <option value="last_7_days">Últimos 7 días</option>
          <option value="this_month">Este mes</option>
          <option value="last_month">Mes pasado</option>
          <option value="custom">Personalizado</option>
        </select>

        <div className="w-px h-6 bg-gray-700" />

        <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
          <Filter className="w-4 h-4" />
          Más filtros
        </button>

        <div className="flex-1" />

        <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
          <Download className="w-4 h-4" />
          Exportar
        </button>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <KPICard
          title="Ingresos Netos"
          value={formatCurrency(metrics.revenue)}
          change={metrics.revenueChange}
          icon={DollarSign}
          color="bg-green-500"
          hideValue={hideValues}
        />
        <KPICard
          title="Gasto en Ads"
          value={formatCurrency(metrics.adSpend)}
          change={metrics.spendChange}
          icon={Target}
          color="bg-blue-500"
          hideValue={hideValues}
        />
        <KPICard
          title="ROAS"
          value={metrics.roas.toFixed(2)}
          change={metrics.roasChange}
          icon={TrendingUp}
          color="bg-purple-500"
          suffix="x"
          isHighlighted={metrics.roas >= 3}
          hideValue={hideValues}
        />
        <KPICard
          title="Ganancia"
          value={formatCurrency(metrics.profit)}
          icon={BarChart3}
          color={metrics.profit >= 0 ? 'bg-green-600' : 'bg-red-600'}
          hideValue={hideValues}
        />
        <KPICard
          title="Ventas"
          value={metrics.totalSales}
          change={metrics.salesChange}
          icon={ShoppingCart}
          color="bg-orange-500"
          hideValue={hideValues}
        />
      </div>

      {/* Segunda fila de KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="CPA"
          value={formatCurrency(metrics.cpa)}
          icon={Target}
          color="bg-cyan-500"
          hideValue={hideValues}
        />
        <KPICard
          title="ROI"
          value={`${metrics.roi.toFixed(1)}%`}
          icon={Percent}
          color="bg-indigo-500"
          hideValue={hideValues}
        />
        <KPICard
          title="Margen"
          value={`${metrics.profitMargin.toFixed(1)}%`}
          icon={PieChart}
          color="bg-pink-500"
          hideValue={hideValues}
        />
        <KPICard
          title="ARPU"
          value={formatCurrency(metrics.arpu)}
          icon={Users}
          color="bg-teal-500"
          hideValue={hideValues}
        />
      </div>

      {/* Widgets */}
      <div className="grid md:grid-cols-2 gap-6">
        <PaymentMethodChart data={paymentMethods} hideValues={hideValues} />
        <SalesStatusWidget metrics={metrics} hideValues={hideValues} />
      </div>

      {/* Métricas de conversación */}
      <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-green-400" />
          Métricas de WhatsApp
        </h3>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-700/50 rounded-lg">
            <p className="text-3xl font-bold text-white">
              {hideValues ? '***' : metrics.totalConversations.toLocaleString()}
            </p>
            <p className="text-sm text-gray-400">Conversaciones</p>
          </div>
          <div className="text-center p-4 bg-gray-700/50 rounded-lg">
            <p className="text-3xl font-bold text-white">
              {hideValues ? '***' : formatCurrency(metrics.costPerConversation)}
            </p>
            <p className="text-sm text-gray-400">Costo por Conversación</p>
          </div>
          <div className="text-center p-4 bg-gray-700/50 rounded-lg">
            <p className="text-3xl font-bold text-green-400">
              {hideValues ? '***' : `${metrics.conversationToSaleRate}%`}
            </p>
            <p className="text-sm text-gray-400">Conversión a Venta</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MarketingDashboard;
