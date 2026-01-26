/**
 * MovementHistory
 *
 * Historial de movimientos de inventario con filtros y exportación.
 */

import React, { useState, useMemo } from 'react';
import {
  History,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  ArrowRightLeft,
  Package,
  X,
  Download,
  Filter,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import type { InventoryMovement, MovementType, Product } from '@/types/inventory.types';

interface MovementHistoryProps {
  movements: InventoryMovement[];
  products: Map<string, Product>;
  onClose?: () => void;
  isModal?: boolean;
}

const MOVEMENT_CONFIG: Record<MovementType, {
  label: string;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
}> = {
  purchase: {
    label: 'Compra',
    icon: <ArrowUpCircle className="w-4 h-4" />,
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-600',
  },
  sale: {
    label: 'Venta',
    icon: <ArrowDownCircle className="w-4 h-4" />,
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-600',
  },
  return: {
    label: 'Devolución',
    icon: <RotateCcw className="w-4 h-4" />,
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    textColor: 'text-purple-600',
  },
  adjustment: {
    label: 'Ajuste',
    icon: <RefreshCw className="w-4 h-4" />,
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-600',
  },
  transfer_in: {
    label: 'Transferencia +',
    icon: <ArrowRightLeft className="w-4 h-4" />,
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    textColor: 'text-cyan-600',
  },
  transfer_out: {
    label: 'Transferencia -',
    icon: <ArrowRightLeft className="w-4 h-4" />,
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    textColor: 'text-orange-600',
  },
  damaged: {
    label: 'Dañado',
    icon: <Trash2 className="w-4 h-4" />,
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-600',
  },
  expired: {
    label: 'Vencido',
    icon: <AlertTriangle className="w-4 h-4" />,
    bgColor: 'bg-rose-100 dark:bg-rose-900/30',
    textColor: 'text-rose-600',
  },
};

const PAGE_SIZE = 20;

export const MovementHistory: React.FC<MovementHistoryProps> = ({
  movements,
  products,
  onClose,
  isModal = false,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<MovementType | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Filtrar movimientos
  const filteredMovements = useMemo(() => {
    let result = [...movements];

    // Filtro por búsqueda
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(m => {
        const product = products.get(m.productId);
        return (
          product?.name.toLowerCase().includes(searchLower) ||
          product?.sku.toLowerCase().includes(searchLower) ||
          m.reference?.toLowerCase().includes(searchLower) ||
          m.reason?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Filtro por tipo
    if (typeFilter !== 'all') {
      result = result.filter(m => m.type === typeFilter);
    }

    // Filtro por fecha
    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter(m => new Date(m.createdAt) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59);
      result = result.filter(m => new Date(m.createdAt) <= to);
    }

    // Ordenar por fecha descendente
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return result;
  }, [movements, products, search, typeFilter, dateFrom, dateTo]);

  // Paginación
  const totalPages = Math.ceil(filteredMovements.length / PAGE_SIZE);
  const paginatedMovements = filteredMovements.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Estadísticas
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayMovements = filteredMovements.filter(m => new Date(m.createdAt) >= today);
    const totalIn = filteredMovements.filter(m => m.quantity > 0).reduce((sum, m) => sum + m.quantity, 0);
    const totalOut = Math.abs(filteredMovements.filter(m => m.quantity < 0).reduce((sum, m) => sum + m.quantity, 0));

    return {
      total: filteredMovements.length,
      today: todayMovements.length,
      totalIn,
      totalOut,
    };
  }, [filteredMovements]);

  // Exportar a CSV
  const exportToCSV = () => {
    const headers = ['Fecha', 'Hora', 'Tipo', 'Producto', 'SKU', 'Cantidad', 'Stock Anterior', 'Stock Nuevo', 'Razón', 'Referencia', 'Usuario'];

    const rows = filteredMovements.map(m => {
      const product = products.get(m.productId);
      const date = new Date(m.createdAt);
      return [
        date.toLocaleDateString('es-CO'),
        date.toLocaleTimeString('es-CO'),
        MOVEMENT_CONFIG[m.type]?.label || m.type,
        product?.name || 'Desconocido',
        product?.sku || '',
        m.quantity.toString(),
        m.previousQuantity.toString(),
        m.newQuantity.toString(),
        m.reason || '',
        m.reference || '',
        m.userId || '',
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `movimientos_inventario_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Formatear fecha
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return `Hoy ${d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (d.toDateString() === yesterday.toDateString()) {
      return `Ayer ${d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return d.toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const content = (
    <div className={isModal ? 'flex flex-col h-full' : ''}>
      {/* Header */}
      <div className={`${isModal ? 'px-6 py-4 border-b border-slate-200 dark:border-slate-700' : 'mb-6'} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
            <History className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Historial de Movimientos
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {stats.total} movimientos • {stats.today} hoy
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
          {isModal && onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Stats rápidas */}
      <div className={`${isModal ? 'px-6 py-4' : 'mb-4'} grid grid-cols-4 gap-3`}>
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
        </div>
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
          <p className="text-2xl font-bold text-green-600">+{stats.totalIn}</p>
          <p className="text-xs text-green-600 dark:text-green-400">Entradas</p>
        </div>
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-center">
          <p className="text-2xl font-bold text-red-600">-{stats.totalOut}</p>
          <p className="text-xs text-red-600 dark:text-red-400">Salidas</p>
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.today}</p>
          <p className="text-xs text-blue-600 dark:text-blue-400">Hoy</p>
        </div>
      </div>

      {/* Filtros */}
      <div className={`${isModal ? 'px-6 pb-4' : 'mb-4'}`}>
        <div className="flex items-center gap-3">
          {/* Búsqueda */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por producto, SKU, referencia..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Botón filtros */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
              showFilters || typeFilter !== 'all' || dateFrom || dateTo
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>
        </div>

        {/* Panel de filtros expandido */}
        {showFilters && (
          <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Tipo */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Tipo de movimiento
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as MovementType | 'all')}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos</option>
                  {Object.entries(MOVEMENT_CONFIG).map(([type, config]) => (
                    <option key={type} value={type}>{config.label}</option>
                  ))}
                </select>
              </div>

              {/* Fecha desde */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Desde
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Fecha hasta */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Hasta
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Limpiar filtros */}
            {(typeFilter !== 'all' || dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setTypeFilter('all');
                  setDateFrom('');
                  setDateTo('');
                }}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lista de movimientos */}
      <div className={`${isModal ? 'flex-1 overflow-y-auto px-6' : ''}`}>
        {paginatedMovements.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">
              No se encontraron movimientos
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {paginatedMovements.map(movement => {
              const product = products.get(movement.productId);
              const config = MOVEMENT_CONFIG[movement.type];
              const isPositive = movement.quantity > 0;

              return (
                <div
                  key={movement.id}
                  className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 transition-colors"
                >
                  {/* Icono tipo */}
                  <div className={`p-2 rounded-lg ${config?.bgColor} ${config?.textColor}`}>
                    {config?.icon || <Package className="w-4 h-4" />}
                  </div>

                  {/* Info producto */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900 dark:text-white truncate">
                        {product?.name || 'Producto desconocido'}
                      </p>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {product?.sku}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${config?.bgColor} ${config?.textColor}`}>
                        {config?.label}
                      </span>
                      {movement.reason && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {movement.reason}
                        </span>
                      )}
                      {movement.reference && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          Ref: {movement.reference}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cantidad */}
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      isPositive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isPositive ? '+' : ''}{movement.quantity}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {movement.previousQuantity} → {movement.newQuantity}
                    </p>
                  </div>

                  {/* Fecha */}
                  <div className="text-right text-sm text-slate-500 dark:text-slate-400 w-24">
                    {formatDate(movement.createdAt)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className={`${isModal ? 'px-6 py-4 border-t border-slate-200 dark:border-slate-700' : 'mt-4'} flex items-center justify-between`}>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Mostrando {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, filteredMovements.length)} de {filteredMovements.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <span className="text-sm text-slate-600 dark:text-slate-300">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] overflow-hidden flex flex-col">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default MovementHistory;
