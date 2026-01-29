/**
 * InvoiceDashboard
 *
 * Dashboard principal de facturación electrónica.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Send,
  Eye,
  Edit2,
  Trash2,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  FileDown,
  Printer,
  Mail,
  RefreshCw,
  Loader2,
  Calendar,
  Building2,
  Receipt,
  TrendingUp,
  CreditCard,
} from 'lucide-react';
import { invoiceService } from '@/services/invoiceService';
import type { Invoice, InvoiceStatus, InvoiceType, InvoiceFilters } from '@/types/invoice.types';

const STATUS_CONFIG: Record<InvoiceStatus, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  draft: { label: 'Borrador', color: 'text-slate-600', bgColor: 'bg-slate-100 dark:bg-slate-700' },
  pending: { label: 'Pendiente DIAN', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  sent: { label: 'Enviada', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  accepted: { label: 'Aceptada', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  rejected: { label: 'Rechazada', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  cancelled: { label: 'Anulada', color: 'text-slate-400', bgColor: 'bg-slate-200 dark:bg-slate-600' },
  paid: { label: 'Pagada', color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30' },
  partially_paid: { label: 'Pago Parcial', color: 'text-cyan-600', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30' },
  overdue: { label: 'Vencida', color: 'text-rose-600', bgColor: 'bg-rose-100 dark:bg-rose-900/30' },
};

const TYPE_LABELS: Record<InvoiceType, string> = {
  invoice: 'Factura',
  credit_note: 'Nota Crédito',
  debit_note: 'Nota Débito',
  export_invoice: 'Factura Exportación',
};

const PAGE_SIZE = 10;

interface InvoiceDashboardProps {
  onCreateInvoice?: () => void;
  onEditInvoice?: (invoice: Invoice) => void;
  onViewInvoice?: (invoice: Invoice) => void;
}

export const InvoiceDashboard: React.FC<InvoiceDashboardProps> = ({
  onCreateInvoice,
  onEditInvoice,
  onViewInvoice,
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<InvoiceType | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<string | null>(null);

  // Cargar facturas
  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = () => {
    setIsLoading(true);
    const filters: InvoiceFilters = {};

    if (search) filters.search = search;
    if (statusFilter !== 'all') filters.status = [statusFilter];
    if (typeFilter !== 'all') filters.type = [typeFilter];
    if (dateFrom) filters.dateFrom = new Date(dateFrom);
    if (dateTo) filters.dateTo = new Date(dateTo);

    const data = invoiceService.getAll(filters);
    setInvoices(data);
    setIsLoading(false);
  };

  // Estadísticas
  const stats = useMemo(() => {
    return invoiceService.getStats();
  }, [invoices]);

  // Paginación
  const totalPages = Math.ceil(invoices.length / PAGE_SIZE);
  const paginatedInvoices = invoices.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Formatear moneda
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Formatear fecha
  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Enviar a DIAN
  const handleSendToDIAN = async (invoice: Invoice) => {
    setIsSending(invoice.id);
    try {
      const result = await invoiceService.sendToDIAN(invoice.id);
      if (result.success) {
        loadInvoices();
      } else {
        alert(`Error: ${result.statusDescription}`);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al enviar');
    } finally {
      setIsSending(null);
    }
  };

  // Eliminar factura
  const handleDelete = (invoice: Invoice) => {
    if (confirm('¿Estás seguro de eliminar esta factura?')) {
      try {
        invoiceService.delete(invoice.id);
        loadInvoices();
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Error al eliminar');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl">
            <Receipt className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Facturación Electrónica
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Gestiona tus facturas y documentos electrónicos
            </p>
          </div>
        </div>
        <button
          onClick={onCreateInvoice}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva Factura
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400">Total Facturas</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
          <p className="text-sm text-slate-500">{formatCurrency(stats.totalAmount)}</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400">Pagadas</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.paid.count}</p>
          <p className="text-sm text-green-600">{formatCurrency(stats.paid.amount)}</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400">Pendientes</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{stats.pending.count}</p>
          <p className="text-sm text-amber-600">{formatCurrency(stats.pending.amount)}</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400">Vencidas</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.overdue.count}</p>
          <p className="text-sm text-red-600">{formatCurrency(stats.overdue.amount)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              onKeyDown={(e) => e.key === 'Enter' && loadInvoices()}
              placeholder="Buscar por número, cliente, NIT..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setPage(1);
              loadInvoices();
            }}
            className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los estados</option>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as any);
              setPage(1);
              loadInvoices();
            }}
            className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los tipos</option>
            {Object.entries(TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          {/* More Filters */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors ${
              showFilters
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Filter className="w-5 h-5" />
            Filtros
          </button>

          <button
            onClick={loadInvoices}
            className="p-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Desde</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Hasta</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
              />
            </div>
            <div className="col-span-2 flex items-end gap-2">
              <button
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                  setSearch('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                  loadInvoices();
                }}
                className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                Limpiar filtros
              </button>
              <button
                onClick={loadInvoices}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Aplicar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">No hay facturas</p>
            <button
              onClick={onCreateInvoice}
              className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Crear primera factura
            </button>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                    Número
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                    Vencimiento
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                    Total
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {paginatedInvoices.map((invoice) => {
                  const statusConfig = STATUS_CONFIG[invoice.status];

                  return (
                    <tr
                      key={invoice.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900 dark:text-white">
                            {invoice.fullNumber}
                          </span>
                          {invoice.cufe && (
                            <span className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                              DIAN
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500">
                          {TYPE_LABELS[invoice.type]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900 dark:text-white">
                          {invoice.buyer.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {invoice.buyer.documentType} {invoice.buyer.documentNumber}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                        {formatDate(invoice.issueDate)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={
                          new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid'
                            ? 'text-red-600 font-medium'
                            : 'text-slate-600 dark:text-slate-400'
                        }>
                          {formatDate(invoice.dueDate)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {formatCurrency(invoice.total)}
                        </p>
                        {invoice.amountDue > 0 && invoice.amountDue !== invoice.total && (
                          <p className="text-xs text-red-600">
                            Pendiente: {formatCurrency(invoice.amountDue)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${statusConfig.color} ${statusConfig.bgColor}`}>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onViewInvoice?.(invoice)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Ver"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {invoice.status === 'draft' && (
                            <>
                              <button
                                onClick={() => onEditInvoice?.(invoice)}
                                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleSendToDIAN(invoice)}
                                disabled={isSending === invoice.id}
                                className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
                                title="Enviar a DIAN"
                              >
                                {isSending === invoice.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDelete(invoice)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {invoice.cufe && (
                            <button
                              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                              title="Descargar PDF"
                            >
                              <FileDown className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Mostrando {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, invoices.length)} de {invoices.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default InvoiceDashboard;
