/**
 * KPI Grid Component
 *
 * Grid de KPIs organizado por categorías para el Dashboard Ejecutivo.
 * Muestra métricas financieras, operacionales, de cliente y riesgo.
 */

import React from 'react';
import { KPICard, CompactKPICard } from './KPICard';
import {
  ExecutiveKPIs,
  KPICardConfig,
  KPIValue,
  KPICardColor,
} from '../../types/executiveDashboard.types';

interface KPIGridProps {
  kpis: ExecutiveKPIs;
  compactMode?: boolean;
  visibleCategories?: string[];
  onKPIClick?: (kpiId: string) => void;
}

// ============================================
// CONFIGURACIÓN DE KPIS
// ============================================

interface KPIDefinition {
  id: string;
  title: string;
  icon: string;
  color: KPICardColor;
  category: string;
  getValue: (kpis: ExecutiveKPIs) => KPIValue;
  invertTrend?: boolean;
  description?: string;
}

const kpiDefinitions: KPIDefinition[] = [
  // Financieros
  {
    id: 'total_revenue',
    title: 'Ingresos Totales',
    icon: '💰',
    color: 'green',
    category: 'financial',
    getValue: (kpis) => kpis.financial.totalRevenue,
  },
  {
    id: 'avg_order_value',
    title: 'Ticket Promedio',
    icon: '🛒',
    color: 'blue',
    category: 'financial',
    getValue: (kpis) => kpis.financial.averageOrderValue,
  },
  {
    id: 'gross_margin',
    title: 'Margen Bruto',
    icon: '📊',
    color: 'purple',
    category: 'financial',
    getValue: (kpis) => kpis.financial.grossMargin,
  },
  {
    id: 'cost_per_delivery',
    title: 'Costo por Entrega',
    icon: '📦',
    color: 'orange',
    category: 'financial',
    getValue: (kpis) => kpis.financial.costPerDelivery,
    invertTrend: true,
  },

  // Operacionales
  {
    id: 'orders_today',
    title: 'Órdenes Hoy',
    icon: '📝',
    color: 'blue',
    category: 'operations',
    getValue: (kpis) => kpis.operations.ordersToday,
  },
  {
    id: 'delivery_rate',
    title: 'Tasa de Entrega',
    icon: '✅',
    color: 'green',
    category: 'operations',
    getValue: (kpis) => kpis.operations.deliveryRate,
  },
  {
    id: 'avg_delivery_time',
    title: 'Tiempo Promedio',
    icon: '⏱️',
    color: 'cyan',
    category: 'operations',
    getValue: (kpis) => kpis.operations.avgDeliveryTime,
    invertTrend: true,
  },
  {
    id: 'in_transit',
    title: 'En Tránsito',
    icon: '🚚',
    color: 'indigo',
    category: 'operations',
    getValue: (kpis) => kpis.operations.shipmentsInTransit,
  },
  {
    id: 'on_time_rate',
    title: 'Entregas a Tiempo',
    icon: '🎯',
    color: 'teal',
    category: 'operations',
    getValue: (kpis) => kpis.operations.onTimeDeliveryRate,
  },
  {
    id: 'with_issues',
    title: 'Con Problemas',
    icon: '⚠️',
    color: 'red',
    category: 'operations',
    getValue: (kpis) => kpis.operations.shipmentsWithIssues,
    invertTrend: true,
  },

  // Cliente
  {
    id: 'nps_score',
    title: 'NPS Logístico',
    icon: '😊',
    color: 'green',
    category: 'customer',
    getValue: (kpis) => kpis.customer.npsScore,
  },
  {
    id: 'csat_score',
    title: 'Satisfacción',
    icon: '⭐',
    color: 'yellow',
    category: 'customer',
    getValue: (kpis) => kpis.customer.csatScore,
  },
  {
    id: 'return_rate',
    title: 'Tasa Devolución',
    icon: '↩️',
    color: 'orange',
    category: 'customer',
    getValue: (kpis) => kpis.customer.returnRate,
    invertTrend: true,
  },
  {
    id: 'open_tickets',
    title: 'Tickets Abiertos',
    icon: '🎫',
    color: 'red',
    category: 'customer',
    getValue: (kpis) => kpis.customer.openTickets,
    invertTrend: true,
  },

  // Riesgo
  {
    id: 'at_risk',
    title: 'Envíos en Riesgo',
    icon: '🚨',
    color: 'red',
    category: 'risk',
    getValue: (kpis) => kpis.risk.shipmentsAtRisk,
    invertTrend: true,
  },
  {
    id: 'anomalies',
    title: 'Anomalías',
    icon: '🔍',
    color: 'purple',
    category: 'risk',
    getValue: (kpis) => kpis.risk.anomaliesDetected,
    invertTrend: true,
  },
  {
    id: 'critical_alerts',
    title: 'Alertas Críticas',
    icon: '⚡',
    color: 'red',
    category: 'risk',
    getValue: (kpis) => kpis.risk.criticalAlerts,
    invertTrend: true,
  },
  {
    id: 'stockout_risk',
    title: 'Riesgo Stockout',
    icon: '📉',
    color: 'orange',
    category: 'risk',
    getValue: (kpis) => kpis.risk.stockoutRisk,
    invertTrend: true,
  },

  // Marketing
  {
    id: 'roas',
    title: 'ROAS',
    icon: '📈',
    color: 'green',
    category: 'marketing',
    getValue: (kpis) => kpis.marketing.roas,
  },
  {
    id: 'cpa',
    title: 'CPA',
    icon: '💵',
    color: 'blue',
    category: 'marketing',
    getValue: (kpis) => kpis.marketing.cpa,
    invertTrend: true,
  },
  {
    id: 'conversion_rate',
    title: 'Conversión',
    icon: '🎯',
    color: 'purple',
    category: 'marketing',
    getValue: (kpis) => kpis.marketing.conversionRate,
  },
  {
    id: 'new_customers',
    title: 'Nuevos Clientes',
    icon: '👥',
    color: 'cyan',
    category: 'marketing',
    getValue: (kpis) => kpis.marketing.newCustomers,
  },

  // Inventario
  {
    id: 'stock_value',
    title: 'Valor en Stock',
    icon: '📦',
    color: 'blue',
    category: 'inventory',
    getValue: (kpis) => kpis.inventory.stockValue,
  },
  {
    id: 'turnover_rate',
    title: 'Rotación',
    icon: '🔄',
    color: 'green',
    category: 'inventory',
    getValue: (kpis) => kpis.inventory.turnoverRate,
  },
  {
    id: 'low_stock',
    title: 'Stock Bajo',
    icon: '⚠️',
    color: 'yellow',
    category: 'inventory',
    getValue: (kpis) => kpis.inventory.lowStockItems,
    invertTrend: true,
  },
  {
    id: 'warehouse_util',
    title: 'Uso Almacén',
    icon: '🏭',
    color: 'indigo',
    category: 'inventory',
    getValue: (kpis) => kpis.inventory.warehouseUtilization,
  },
];

// ============================================
// CATEGORÍAS
// ============================================

interface CategoryConfig {
  id: string;
  title: string;
  icon: string;
  description: string;
}

const categories: CategoryConfig[] = [
  { id: 'financial', title: 'Financiero', icon: '💰', description: 'Métricas de ingresos y costos' },
  { id: 'operations', title: 'Operaciones', icon: '📦', description: 'Envíos y entregas' },
  { id: 'customer', title: 'Cliente', icon: '👥', description: 'Satisfacción y soporte' },
  { id: 'risk', title: 'Riesgo', icon: '⚠️', description: 'Alertas y anomalías' },
  { id: 'marketing', title: 'Marketing', icon: '📈', description: 'Adquisición y conversión' },
  { id: 'inventory', title: 'Inventario', icon: '🏭', description: 'Stock y almacén' },
];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const KPIGrid: React.FC<KPIGridProps> = ({
  kpis,
  compactMode = false,
  visibleCategories = ['financial', 'operations', 'customer', 'risk'],
  onKPIClick,
}) => {
  const filteredCategories = categories.filter((cat) =>
    visibleCategories.includes(cat.id)
  );

  if (compactMode) {
    return <CompactKPIGrid kpis={kpis} visibleCategories={visibleCategories} />;
  }

  return (
    <div className="space-y-6">
      {filteredCategories.map((category) => {
        const categoryKPIs = kpiDefinitions.filter(
          (kpi) => kpi.category === category.id
        );

        return (
          <div key={category.id}>
            {/* Category Header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{category.icon}</span>
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                {category.title}
              </h3>
              <span className="text-xs text-gray-500">
                {category.description}
              </span>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3">
              {categoryKPIs.map((kpiDef) => {
                const config: KPICardConfig = {
                  id: kpiDef.id,
                  title: kpiDef.title,
                  icon: kpiDef.icon,
                  color: kpiDef.color,
                  category: kpiDef.category as any,
                  size: 'medium',
                  showTrend: true,
                  showTarget: kpiDef.getValue(kpis).target !== undefined,
                  showSparkline: false,
                  invertTrend: kpiDef.invertTrend,
                };

                return (
                  <KPICard
                    key={kpiDef.id}
                    config={config}
                    value={kpiDef.getValue(kpis)}
                    onClick={onKPIClick ? () => onKPIClick(kpiDef.id) : undefined}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================
// GRID COMPACTO
// ============================================

interface CompactKPIGridProps {
  kpis: ExecutiveKPIs;
  visibleCategories: string[];
}

const CompactKPIGrid: React.FC<CompactKPIGridProps> = ({ kpis, visibleCategories }) => {
  // Seleccionar solo los KPIs más importantes para el modo compacto
  const importantKPIs = [
    'total_revenue',
    'orders_today',
    'delivery_rate',
    'in_transit',
    'nps_score',
    'at_risk',
    'open_tickets',
    'critical_alerts',
  ];

  const filteredKPIs = kpiDefinitions.filter(
    (kpi) =>
      importantKPIs.includes(kpi.id) && visibleCategories.includes(kpi.category)
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
      {filteredKPIs.map((kpiDef) => {
        const value = kpiDef.getValue(kpis);
        const formattedValue =
          value.format === 'currency'
            ? value.current >= 1000000
              ? `$${(value.current / 1000000).toFixed(1)}M`
              : `$${(value.current / 1000).toFixed(0)}K`
            : value.format === 'percent'
            ? `${(value.current * 100).toFixed(1)}%`
            : value.current.toLocaleString();

        return (
          <CompactKPICard
            key={kpiDef.id}
            title={kpiDef.title}
            value={formattedValue}
            change={value.changePercent}
            trend={value.trend}
            icon={kpiDef.icon}
            color={kpiDef.color}
          />
        );
      })}
    </div>
  );
};

// ============================================
// HIGHLIGHT CARDS (Top 4 KPIs)
// ============================================

interface HighlightKPIGridProps {
  kpis: ExecutiveKPIs;
}

export const HighlightKPIGrid: React.FC<HighlightKPIGridProps> = ({ kpis }) => {
  const highlights = [
    {
      id: 'revenue',
      title: 'Ingresos',
      icon: '💰',
      color: 'green' as const,
      value: kpis.financial.totalRevenue,
    },
    {
      id: 'orders',
      title: 'Órdenes Hoy',
      icon: '📝',
      color: 'blue' as const,
      value: kpis.operations.ordersToday,
    },
    {
      id: 'delivery',
      title: 'Tasa Entrega',
      icon: '✅',
      color: 'cyan' as const,
      value: kpis.operations.deliveryRate,
    },
    {
      id: 'nps',
      title: 'NPS',
      icon: '😊',
      color: 'purple' as const,
      value: kpis.customer.npsScore,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {highlights.map((h) => (
        <KPICard
          key={h.id}
          config={{
            id: h.id,
            title: h.title,
            icon: h.icon,
            color: h.color,
            category: 'financial',
            size: 'large',
            showTrend: true,
            showTarget: h.value.target !== undefined,
            showSparkline: false,
          }}
          value={h.value}
        />
      ))}
    </div>
  );
};

// ============================================
// SINGLE ROW KPIS
// ============================================

interface SingleRowKPIsProps {
  kpis: ExecutiveKPIs;
}

export const SingleRowKPIs: React.FC<SingleRowKPIsProps> = ({ kpis }) => {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  };

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

  const items = [
    {
      label: 'Ingresos',
      value: formatCurrency(kpis.financial.totalRevenue.current),
      change: kpis.financial.totalRevenue.changePercent,
      trend: kpis.financial.totalRevenue.trend,
      icon: '💰',
    },
    {
      label: 'Órdenes',
      value: kpis.operations.totalOrders.current.toLocaleString(),
      change: kpis.operations.totalOrders.changePercent,
      trend: kpis.operations.totalOrders.trend,
      icon: '📦',
    },
    {
      label: 'Entrega',
      value: formatPercent(kpis.operations.deliveryRate.current),
      change: kpis.operations.deliveryRate.changePercent,
      trend: kpis.operations.deliveryRate.trend,
      icon: '✅',
    },
    {
      label: 'En Tránsito',
      value: kpis.operations.shipmentsInTransit.current.toLocaleString(),
      change: kpis.operations.shipmentsInTransit.changePercent,
      trend: kpis.operations.shipmentsInTransit.trend,
      icon: '🚚',
    },
    {
      label: 'NPS',
      value: kpis.customer.npsScore.current.toString(),
      change: kpis.customer.npsScore.changePercent,
      trend: kpis.customer.npsScore.trend,
      icon: '😊',
    },
    {
      label: 'Alertas',
      value: kpis.risk.criticalAlerts.current.toString(),
      change: kpis.risk.criticalAlerts.changePercent,
      trend: kpis.risk.criticalAlerts.trend,
      icon: '⚠️',
      invertTrend: true,
    },
  ];

  return (
    <div className="flex items-center gap-6 overflow-x-auto pb-2">
      {items.map((item) => {
        const isPositive = item.invertTrend
          ? item.trend === 'down'
          : item.trend === 'up';
        const trendColor = isPositive
          ? 'text-emerald-400'
          : item.trend === 'stable'
          ? 'text-gray-400'
          : 'text-red-400';

        return (
          <div
            key={item.label}
            className="flex items-center gap-3 bg-slate-800/50 rounded-lg px-4 py-2 min-w-fit"
          >
            <span className="text-xl">{item.icon}</span>
            <div>
              <p className="text-xs text-gray-400">{item.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-white">{item.value}</span>
                <span className={`text-xs font-medium ${trendColor}`}>
                  {item.change >= 0 ? '+' : ''}
                  {item.change.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KPIGrid;
