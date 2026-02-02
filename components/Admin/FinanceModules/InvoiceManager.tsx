// ============================================
// LITPER PRO - INVOICE MANAGER
// Sistema de facturación completa
// ============================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Edit2,
  Trash2,
  Eye,
  X,
  Save,
  Send,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building2,
  User,
  Calendar,
  DollarSign,
  Percent,
  FileDown,
  Printer,
  Copy,
  Check,
} from 'lucide-react';
import jsPDF from 'jspdf';

// ============================================
// TIPOS E INTERFACES
// ============================================

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  iva: number; // Porcentaje de IVA
  subtotal: number;
  ivaAmount: number;
  total: number;
}

interface Invoice {
  id: string;
  number: string; // LITPER-2024-0001
  date: string;
  dueDate: string;
  status: 'borrador' | 'enviada' | 'pagada' | 'vencida';
  client: {
    nit: string;
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  totalIva: number;
  total: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// CONSTANTES
// ============================================

const STORAGE_KEY = 'litper_invoices';
const COUNTER_KEY = 'litper_invoice_counter';

const STATUS_CONFIG = {
  borrador: { label: 'Borrador', color: 'slate', icon: Edit2 },
  enviada: { label: 'Enviada', color: 'blue', icon: Send },
  pagada: { label: 'Pagada', color: 'emerald', icon: CheckCircle },
  vencida: { label: 'Vencida', color: 'red', icon: AlertTriangle },
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const InvoiceManager: React.FC = () => {
  // Estados
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [copied, setCopied] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    client: { nit: '', name: '', address: '', phone: '', email: '' },
    items: [] as InvoiceItem[],
    notes: '',
    dueDate: '',
  });

  // Cargar datos de localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Actualizar estados de facturas vencidas
      const updated = parsed.map((inv: Invoice) => {
        if (inv.status === 'enviada' && new Date(inv.dueDate) < new Date()) {
          return { ...inv, status: 'vencida' };
        }
        return inv;
      });
      setInvoices(updated);
    }
  }, []);

  // Guardar en localStorage
  useEffect(() => {
    if (invoices.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
    }
  }, [invoices]);

  // Generar número de factura
  const generateInvoiceNumber = (): string => {
    const counter = parseInt(localStorage.getItem(COUNTER_KEY) || '0') + 1;
    localStorage.setItem(COUNTER_KEY, counter.toString());
    const year = new Date().getFullYear();
    return `LITPER-${year}-${counter.toString().padStart(4, '0')}`;
  };

  // Calcular totales de item
  const calculateItemTotals = (item: Partial<InvoiceItem>): InvoiceItem => {
    const quantity = item.quantity || 0;
    const unitPrice = item.unitPrice || 0;
    const iva = item.iva || 19;
    const subtotal = quantity * unitPrice;
    const ivaAmount = subtotal * (iva / 100);
    const total = subtotal + ivaAmount;

    return {
      id: item.id || Date.now().toString(),
      description: item.description || '',
      quantity,
      unitPrice,
      iva,
      subtotal,
      ivaAmount,
      total,
    };
  };

  // Agregar item
  const addItem = () => {
    const newItem = calculateItemTotals({
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      iva: 19,
    });
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  // Actualizar item
  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === id
          ? calculateItemTotals({ ...item, [field]: value })
          : item
      ),
    }));
  };

  // Eliminar item
  const removeItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id),
    }));
  };

  // Calcular totales de factura
  const invoiceTotals = useMemo(() => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.subtotal, 0);
    const totalIva = formData.items.reduce((sum, item) => sum + item.ivaAmount, 0);
    const total = subtotal + totalIva;
    return { subtotal, totalIva, total };
  }, [formData.items]);

  // Guardar factura
  const saveInvoice = (status: Invoice['status'] = 'borrador') => {
    const now = new Date().toISOString();
    const invoice: Invoice = {
      id: editingInvoice?.id || Date.now().toString(),
      number: editingInvoice?.number || generateInvoiceNumber(),
      date: editingInvoice?.date || now.split('T')[0],
      dueDate: formData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status,
      client: formData.client,
      items: formData.items,
      subtotal: invoiceTotals.subtotal,
      totalIva: invoiceTotals.totalIva,
      total: invoiceTotals.total,
      notes: formData.notes,
      createdAt: editingInvoice?.createdAt || now,
      updatedAt: now,
    };

    if (editingInvoice) {
      setInvoices(prev => prev.map(inv => inv.id === invoice.id ? invoice : inv));
    } else {
      setInvoices(prev => [invoice, ...prev]);
    }

    resetForm();
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      client: { nit: '', name: '', address: '', phone: '', email: '' },
      items: [],
      notes: '',
      dueDate: '',
    });
    setEditingInvoice(null);
    setShowForm(false);
  };

  // Editar factura
  const editInvoice = (invoice: Invoice) => {
    setFormData({
      client: invoice.client,
      items: invoice.items,
      notes: invoice.notes,
      dueDate: invoice.dueDate,
    });
    setEditingInvoice(invoice);
    setShowForm(true);
  };

  // Eliminar factura
  const deleteInvoice = (id: string) => {
    if (confirm('¿Eliminar esta factura?')) {
      setInvoices(prev => prev.filter(inv => inv.id !== id));
    }
  };

  // Cambiar estado
  const changeStatus = (id: string, status: Invoice['status']) => {
    setInvoices(prev =>
      prev.map(inv =>
        inv.id === id ? { ...inv, status, updatedAt: new Date().toISOString() } : inv
      )
    );
  };

  // Generar PDF
  const generatePDF = (invoice: Invoice) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(249, 115, 22);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('LITPER PRO', 20, 25);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Facturación', 20, 32);

    // Invoice number
    doc.setFontSize(12);
    doc.text(`Factura: ${invoice.number}`, pageWidth - 70, 25);
    doc.text(`Fecha: ${invoice.date}`, pageWidth - 70, 32);

    // Client info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURAR A:', 20, 55);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`NIT: ${invoice.client.nit}`, 20, 63);
    doc.text(`${invoice.client.name}`, 20, 70);
    doc.text(`${invoice.client.address}`, 20, 77);
    doc.text(`Tel: ${invoice.client.phone}`, 20, 84);
    doc.text(`Email: ${invoice.client.email}`, 20, 91);

    // Status
    const statusConfig = STATUS_CONFIG[invoice.status];
    doc.setFillColor(
      invoice.status === 'pagada' ? 16 : invoice.status === 'vencida' ? 239 : 59,
      invoice.status === 'pagada' ? 185 : invoice.status === 'vencida' ? 68 : 130,
      invoice.status === 'pagada' ? 129 : invoice.status === 'vencida' ? 68 : 246
    );
    doc.roundedRect(pageWidth - 60, 50, 40, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(statusConfig.label.toUpperCase(), pageWidth - 55, 57);

    // Items table header
    doc.setTextColor(0, 0, 0);
    doc.setFillColor(243, 244, 246);
    doc.rect(20, 100, pageWidth - 40, 10, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Descripción', 25, 107);
    doc.text('Cant.', 100, 107);
    doc.text('P. Unit.', 120, 107);
    doc.text('IVA', 145, 107);
    doc.text('Total', 170, 107);

    // Items
    doc.setFont('helvetica', 'normal');
    let yPos = 117;
    invoice.items.forEach((item) => {
      doc.text(item.description.substring(0, 30), 25, yPos);
      doc.text(item.quantity.toString(), 100, yPos);
      doc.text(`$${item.unitPrice.toLocaleString()}`, 120, yPos);
      doc.text(`${item.iva}%`, 145, yPos);
      doc.text(`$${item.total.toLocaleString()}`, 170, yPos);
      yPos += 8;
    });

    // Totals
    yPos += 10;
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 10;

    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', 140, yPos);
    doc.text(`$${invoice.subtotal.toLocaleString()}`, 170, yPos);

    yPos += 8;
    doc.text('IVA:', 140, yPos);
    doc.text(`$${invoice.totalIva.toLocaleString()}`, 170, yPos);

    yPos += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL:', 140, yPos);
    doc.text(`$${invoice.total.toLocaleString()}`, 170, yPos);

    // Notes
    if (invoice.notes) {
      yPos += 20;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Notas:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(invoice.notes, 20, yPos + 7);
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Generado por LITPER PRO - Sistema de Gestión Empresarial', pageWidth / 2, 280, { align: 'center' });
    doc.text(`Vencimiento: ${invoice.dueDate}`, pageWidth / 2, 287, { align: 'center' });

    doc.save(`Factura_${invoice.number}.pdf`);
  };

  // Filtrar facturas
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchesSearch =
        inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.client.nit.includes(searchTerm);
      const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, filterStatus]);

  // Formatear moneda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Copiar número de factura
  const copyInvoiceNumber = (number: string) => {
    navigator.clipboard.writeText(number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-blue-500" />
            Facturación
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            {invoices.length} facturas registradas
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/30"
        >
          <Plus className="w-5 h-5" />
          Nueva Factura
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por número, cliente o NIT..."
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">Todos los estados</option>
            <option value="borrador">Borrador</option>
            <option value="enviada">Enviada</option>
            <option value="pagada">Pagada</option>
            <option value="vencida">Vencida</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
          const count = invoices.filter(inv => inv.status === status).length;
          const total = invoices
            .filter(inv => inv.status === status)
            .reduce((sum, inv) => sum + inv.total, 0);
          const Icon = config.icon;
          return (
            <div
              key={status}
              className={`p-4 bg-${config.color}-50 dark:bg-${config.color}-900/20 rounded-xl border border-${config.color}-200 dark:border-${config.color}-800`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 text-${config.color}-500`} />
                <span className={`text-2xl font-bold text-${config.color}-600 dark:text-${config.color}-400`}>
                  {count}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{config.label}</p>
              <p className="text-xs text-slate-500">{formatCurrency(total)}</p>
            </div>
          );
        })}
      </div>

      {/* Invoices List */}
      {filteredInvoices.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 dark:bg-navy-800 rounded-2xl">
          <FileText className="w-16 h-16 mx-auto text-slate-300 dark:text-navy-600 mb-4" />
          <p className="text-lg font-medium text-slate-500 mb-2">No hay facturas</p>
          <p className="text-sm text-slate-400">Crea tu primera factura para comenzar</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-slate-200 dark:border-navy-700">
                <th className="text-left py-4 px-4 text-xs font-bold uppercase text-slate-500">Factura</th>
                <th className="text-left py-4 px-4 text-xs font-bold uppercase text-slate-500">Cliente</th>
                <th className="text-left py-4 px-4 text-xs font-bold uppercase text-slate-500">Fecha</th>
                <th className="text-left py-4 px-4 text-xs font-bold uppercase text-slate-500">Vencimiento</th>
                <th className="text-right py-4 px-4 text-xs font-bold uppercase text-slate-500">Total</th>
                <th className="text-center py-4 px-4 text-xs font-bold uppercase text-slate-500">Estado</th>
                <th className="text-right py-4 px-4 text-xs font-bold uppercase text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => {
                const statusConfig = STATUS_CONFIG[invoice.status];
                const StatusIcon = statusConfig.icon;
                return (
                  <tr
                    key={invoice.id}
                    className="border-b border-slate-100 dark:border-navy-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <button
                        onClick={() => copyInvoiceNumber(invoice.number)}
                        className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-mono font-bold hover:underline"
                      >
                        {invoice.number}
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-slate-700 dark:text-white">{invoice.client.name}</p>
                        <p className="text-xs text-slate-500">NIT: {invoice.client.nit}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-400">{invoice.date}</td>
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-400">{invoice.dueDate}</td>
                    <td className="py-4 px-4 text-right font-bold text-slate-800 dark:text-white">
                      {formatCurrency(invoice.total)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-${statusConfig.color}-100 text-${statusConfig.color}-700 dark:bg-${statusConfig.color}-900/30 dark:text-${statusConfig.color}-400`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingInvoice(invoice)}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-navy-700 rounded-lg text-slate-500 hover:text-blue-500 transition-colors"
                          title="Ver"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => editInvoice(invoice)}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-navy-700 rounded-lg text-slate-500 hover:text-amber-500 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => generatePDF(invoice)}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-navy-700 rounded-lg text-slate-500 hover:text-emerald-500 transition-colors"
                          title="Descargar PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteInvoice(invoice.id)}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-navy-700 rounded-lg text-slate-500 hover:text-red-500 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-navy-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8" />
                  <div>
                    <h3 className="text-xl font-bold">
                      {editingInvoice ? 'Editar Factura' : 'Nueva Factura'}
                    </h3>
                    <p className="text-blue-100 text-sm">
                      {editingInvoice ? editingInvoice.number : 'Se generará número automático'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
              {/* Client Info */}
              <div className="bg-slate-50 dark:bg-navy-800 rounded-2xl p-4">
                <h4 className="font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-500" />
                  Datos del Cliente
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                      NIT / Cédula *
                    </label>
                    <input
                      type="text"
                      value={formData.client.nit}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        client: { ...prev.client, nit: e.target.value }
                      }))}
                      placeholder="900.123.456-7"
                      className="w-full px-4 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Nombre / Razón Social *
                    </label>
                    <input
                      type="text"
                      value={formData.client.name}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        client: { ...prev.client, name: e.target.value }
                      }))}
                      placeholder="Empresa S.A.S."
                      className="w-full px-4 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={formData.client.address}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        client: { ...prev.client, address: e.target.value }
                      }))}
                      placeholder="Cra 1 # 2-3, Bogotá"
                      className="w-full px-4 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={formData.client.phone}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        client: { ...prev.client, phone: e.target.value }
                      }))}
                      placeholder="310 123 4567"
                      className="w-full px-4 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.client.email}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        client: { ...prev.client, email: e.target.value }
                      }))}
                      placeholder="cliente@empresa.com"
                      className="w-full px-4 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Due Date */}
              <div className="flex items-center gap-4">
                <Calendar className="w-5 h-5 text-slate-400" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Fecha de Vencimiento
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-4 py-2 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-slate-700 dark:text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-500" />
                    Items de la Factura
                  </h4>
                  <button
                    onClick={addItem}
                    className="flex items-center gap-1 px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar Item
                  </button>
                </div>

                {formData.items.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 dark:bg-navy-800 rounded-xl border-2 border-dashed border-slate-200 dark:border-navy-700">
                    <p className="text-slate-500">No hay items. Agrega al menos uno.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.items.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-4 bg-slate-50 dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700"
                      >
                        <div className="flex items-start gap-4">
                          <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {idx + 1}
                          </span>
                          <div className="flex-1 grid md:grid-cols-5 gap-3">
                            <div className="md:col-span-2">
                              <label className="block text-xs text-slate-500 mb-1">Descripción</label>
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                placeholder="Producto o servicio"
                                className="w-full px-3 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">Cantidad</label>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                min="1"
                                className="w-full px-3 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">Precio Unit.</label>
                              <input
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                min="0"
                                className="w-full px-3 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">IVA %</label>
                              <select
                                value={item.iva}
                                onChange={(e) => updateItem(item.id, 'iva', parseInt(e.target.value))}
                                className="w-full px-3 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                              >
                                <option value="0">0%</option>
                                <option value="5">5%</option>
                                <option value="19">19%</option>
                              </select>
                            </div>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-navy-700 flex justify-end gap-6 text-sm">
                          <span className="text-slate-500">Subtotal: <b className="text-slate-700 dark:text-white">{formatCurrency(item.subtotal)}</b></span>
                          <span className="text-slate-500">IVA: <b className="text-slate-700 dark:text-white">{formatCurrency(item.ivaAmount)}</b></span>
                          <span className="text-slate-500">Total: <b className="text-emerald-600">{formatCurrency(item.total)}</b></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Totals */}
              {formData.items.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                  <div className="space-y-3">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Subtotal:</span>
                      <span className="font-bold text-slate-800 dark:text-white">{formatCurrency(invoiceTotals.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>IVA Total:</span>
                      <span className="font-bold text-slate-800 dark:text-white">{formatCurrency(invoiceTotals.totalIva)}</span>
                    </div>
                    <div className="flex justify-between text-xl pt-3 border-t border-blue-200 dark:border-blue-700">
                      <span className="font-bold text-slate-800 dark:text-white">TOTAL:</span>
                      <span className="font-black text-blue-600">{formatCurrency(invoiceTotals.total)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Notas / Observaciones
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Condiciones de pago, observaciones..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-50 dark:bg-navy-800 border-t border-slate-200 dark:border-navy-700 flex justify-end gap-3">
              <button
                onClick={resetForm}
                className="px-6 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-700 rounded-xl font-medium transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => saveInvoice('borrador')}
                disabled={formData.items.length === 0 || !formData.client.nit || !formData.client.name}
                className="flex items-center gap-2 px-6 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                Guardar Borrador
              </button>
              <button
                onClick={() => saveInvoice('enviada')}
                disabled={formData.items.length === 0 || !formData.client.nit || !formData.client.name}
                className="flex items-center gap-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
              >
                <Send className="w-4 h-4" />
                Guardar y Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Invoice Modal */}
      {viewingInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-navy-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">{viewingInvoice.number}</h3>
                  <p className="text-blue-100 text-sm">{viewingInvoice.client.name}</p>
                </div>
                <button
                  onClick={() => setViewingInvoice(null)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
              {/* Status & Dates */}
              <div className="flex flex-wrap gap-4">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold bg-${STATUS_CONFIG[viewingInvoice.status].color}-100 text-${STATUS_CONFIG[viewingInvoice.status].color}-700`}>
                  {STATUS_CONFIG[viewingInvoice.status].label}
                </span>
                <span className="text-sm text-slate-500">
                  Fecha: <b>{viewingInvoice.date}</b>
                </span>
                <span className="text-sm text-slate-500">
                  Vence: <b>{viewingInvoice.dueDate}</b>
                </span>
              </div>

              {/* Client Info */}
              <div className="p-4 bg-slate-50 dark:bg-navy-800 rounded-xl">
                <h4 className="font-bold text-slate-700 dark:text-white mb-2">Cliente</h4>
                <p className="text-slate-600 dark:text-slate-400">NIT: {viewingInvoice.client.nit}</p>
                <p className="text-slate-600 dark:text-slate-400">{viewingInvoice.client.name}</p>
                <p className="text-slate-600 dark:text-slate-400">{viewingInvoice.client.address}</p>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-bold text-slate-700 dark:text-white mb-3">Items</h4>
                <div className="space-y-2">
                  {viewingInvoice.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between p-3 bg-slate-50 dark:bg-navy-800 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-700 dark:text-white">{item.description}</p>
                        <p className="text-xs text-slate-500">
                          {item.quantity} x {formatCurrency(item.unitPrice)} + {item.iva}% IVA
                        </p>
                      </div>
                      <p className="font-bold text-emerald-600">{formatCurrency(item.total)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl space-y-2">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(viewingInvoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>IVA:</span>
                  <span>{formatCurrency(viewingInvoice.totalIva)}</span>
                </div>
                <div className="flex justify-between text-xl pt-2 border-t border-blue-200 dark:border-blue-700">
                  <span className="font-bold">TOTAL:</span>
                  <span className="font-black text-blue-600">{formatCurrency(viewingInvoice.total)}</span>
                </div>
              </div>

              {viewingInvoice.notes && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                  <h4 className="font-bold text-slate-700 dark:text-white mb-2">Notas</h4>
                  <p className="text-slate-600 dark:text-slate-400">{viewingInvoice.notes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-50 dark:bg-navy-800 border-t border-slate-200 dark:border-navy-700 flex flex-wrap justify-between gap-3">
              <div className="flex gap-2">
                {viewingInvoice.status === 'enviada' && (
                  <button
                    onClick={() => {
                      changeStatus(viewingInvoice.id, 'pagada');
                      setViewingInvoice({ ...viewingInvoice, status: 'pagada' });
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-all"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Marcar Pagada
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => generatePDF(viewingInvoice)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all"
                >
                  <Download className="w-4 h-4" />
                  Descargar PDF
                </button>
                <button
                  onClick={() => setViewingInvoice(null)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-700 rounded-xl font-medium transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceManager;
