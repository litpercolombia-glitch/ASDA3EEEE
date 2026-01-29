/**
 * Inventory Dashboard
 * ===================
 *
 * Dashboard principal de inventario con:
 * - Stats cards
 * - Alertas activas
 * - Tabla de productos/stock
 * - Acciones rápidas
 */

import React, { useEffect, useState } from 'react';
import {
  Package,
  Warehouse,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  BarChart3,
  Box,
  ArrowUpDown,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useInventoryStore, useInventoryAlerts } from '../../stores/inventoryStore';
import { Product, InventoryItem, InventoryAlert } from '../../types/inventory.types';
import { confirm, confirmDelete } from '../ui/ConfirmDialog';

// ============================================
// STATS CARD
// ============================================

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  color: 'blue' | 'green' | 'amber' | 'red' | 'purple';
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, subtitle, icon, trend, color }) => {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    red: 'bg-red-500/10 text-red-600 dark:text-red-400',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{trend.value}% vs ayer</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// ============================================
// ALERT CARD
// ============================================

interface AlertCardProps {
  alert: InventoryAlert;
  onAcknowledge: () => void;
  onResolve: () => void;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, onAcknowledge, onResolve }) => {
  const severityColors = {
    low: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
    medium: 'border-amber-500 bg-amber-50 dark:bg-amber-900/20',
    high: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20',
    critical: 'border-red-500 bg-red-50 dark:bg-red-900/20',
  };

  return (
    <div className={`p-4 rounded-lg border-l-4 ${severityColors[alert.severity]}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle className={`w-5 h-5 mt-0.5 ${
            alert.severity === 'critical' ? 'text-red-500' :
            alert.severity === 'high' ? 'text-orange-500' :
            alert.severity === 'medium' ? 'text-amber-500' : 'text-blue-500'
          }`} />
          <div>
            <p className="font-medium text-slate-900 dark:text-white">{alert.message}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Stock actual: {alert.currentValue} | Mínimo: {alert.thresholdValue}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {alert.status === 'active' && (
            <button
              onClick={onAcknowledge}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              title="Marcar como vista"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onResolve}
            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
            title="Resolver"
          >
            <CheckCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// INVENTORY TABLE
// ============================================

interface InventoryTableProps {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onAdjust: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
}

const InventoryTable: React.FC<InventoryTableProps> = ({ items, onEdit, onAdjust, onDelete }) => {
  const statusColors = {
    in_stock: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    low_stock: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    out_of_stock: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    overstock: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  };

  const statusLabels = {
    in_stock: 'En Stock',
    low_stock: 'Stock Bajo',
    out_of_stock: 'Agotado',
    overstock: 'Sobrestock',
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <Box className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
        <p className="text-slate-500 dark:text-slate-400">No hay productos en inventario</p>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
          Agrega productos para comenzar a gestionar tu inventario
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Producto
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              SKU
            </th>
            <th className="text-center py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Disponible
            </th>
            <th className="text-center py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Reservado
            </th>
            <th className="text-center py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total
            </th>
            <th className="text-right py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Valor
            </th>
            <th className="text-center py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Estado
            </th>
            <th className="text-right py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
          {items.map((item) => (
            <tr
              key={item.id}
              className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                    {item.product?.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-8 h-8 object-cover rounded"
                      />
                    ) : (
                      <Package className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {item.product?.name || 'Producto sin nombre'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {item.product?.category || 'Sin categoría'}
                    </p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4">
                <code className="text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                  {item.product?.sku || '-'}
                </code>
              </td>
              <td className="py-3 px-4 text-center">
                <span className="font-semibold text-slate-900 dark:text-white">
                  {item.quantityAvailable}
                </span>
              </td>
              <td className="py-3 px-4 text-center">
                <span className="text-slate-500 dark:text-slate-400">
                  {item.quantityReserved}
                </span>
              </td>
              <td className="py-3 px-4 text-center">
                <span className="text-slate-700 dark:text-slate-300">
                  {item.quantityOnHand}
                </span>
              </td>
              <td className="py-3 px-4 text-right">
                <span className="font-medium text-slate-900 dark:text-white">
                  ${item.totalValue.toLocaleString()}
                </span>
              </td>
              <td className="py-3 px-4 text-center">
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[item.status]}`}>
                  {statusLabels[item.status]}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onAdjust(item)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    title="Ajustar stock"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEdit(item)}
                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(item)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const InventoryDashboard: React.FC = () => {
  const {
    products,
    inventory,
    warehouses,
    stats,
    selectedWarehouseId,
    filters,
    isLoading,
    pagination,
    initialize,
    loadInventory,
    selectWarehouse,
    setFilters,
    deleteProduct,
  } = useInventoryStore();

  const { alerts, acknowledge, resolve } = useInventoryAlerts();

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Inicializar al montar
  useEffect(() => {
    initialize();
  }, []);

  // Buscar con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ search: searchQuery });
      loadInventory();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleEdit = (item: InventoryItem) => {
    // TODO: Abrir modal de edición
    console.log('Edit:', item);
  };

  const handleAdjust = (item: InventoryItem) => {
    // TODO: Abrir modal de ajuste
    console.log('Adjust:', item);
  };

  const handleDelete = async (item: InventoryItem) => {
    const confirmed = await confirmDelete(item.product?.name || 'este producto');
    if (confirmed && item.productId) {
      deleteProduct(item.productId);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Inventario
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Gestiona tu stock, productos y alertas
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Selector de almacén */}
          <select
            value={selectedWarehouseId || ''}
            onChange={(e) => selectWarehouse(e.target.value || null)}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Todos los almacenes</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => loadInventory()}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Refrescar"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
            Agregar Producto
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Valor Total"
          value={formatCurrency(stats?.totalValue || 0)}
          subtitle={`${stats?.totalProducts || 0} productos`}
          icon={<BarChart3 className="w-5 h-5" />}
          color="purple"
        />
        <StatsCard
          title="Unidades"
          value={(stats?.totalUnits || 0).toLocaleString()}
          subtitle="En todos los almacenes"
          icon={<Box className="w-5 h-5" />}
          color="blue"
        />
        <StatsCard
          title="Stock Bajo"
          value={stats?.lowStockCount || 0}
          subtitle="Requieren atención"
          icon={<TrendingDown className="w-5 h-5" />}
          color="amber"
        />
        <StatsCard
          title="Agotados"
          value={stats?.outOfStockCount || 0}
          subtitle="Sin stock"
          icon={<XCircle className="w-5 h-5" />}
          color="red"
        />
        <StatsCard
          title="Movimientos Hoy"
          value={stats?.recentMovements || 0}
          subtitle="Entradas y salidas"
          icon={<ArrowUpDown className="w-5 h-5" />}
          color="green"
        />
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="font-semibold text-slate-900 dark:text-white">
                Alertas Activas ({alerts.length})
              </h2>
            </div>
          </div>
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onAcknowledge={() => acknowledge(alert.id)}
                onResolve={() => resolve(alert.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, SKU o código de barras..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors ${
              showFilters
                ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-500 text-amber-700 dark:text-amber-400'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>

          <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <Upload className="w-4 h-4" />
            Importar
          </button>

          <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <InventoryTable
          items={inventory}
          onEdit={handleEdit}
          onAdjust={handleAdjust}
          onDelete={handleDelete}
        />

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Mostrando {(pagination.page - 1) * pagination.limit + 1} a{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
            </p>
            <div className="flex gap-2">
              <button
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-700 rounded hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-700 rounded hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryDashboard;
