// ============================================
// LITPER PRO - EXPENSE MANAGER
// Sistema de gestión de gastos
// ============================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Download,
  Edit2,
  Trash2,
  Eye,
  X,
  Save,
  Image,
  Upload,
  Calendar,
  Building2,
  Truck,
  Megaphone,
  Users,
  Wrench,
  MoreHorizontal,
  PieChart,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import * as XLSX from 'xlsx';

// ============================================
// TIPOS E INTERFACES
// ============================================

interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  provider: string;
  receipt?: string; // Base64 de imagen
  notes: string;
  createdAt: string;
}

type ExpenseCategory = 'publicidad' | 'nomina' | 'servicios' | 'logistica' | 'otros';

interface CategoryConfig {
  id: ExpenseCategory;
  label: string;
  icon: React.ElementType;
  color: string;
}

// ============================================
// CONSTANTES
// ============================================

const STORAGE_KEY = 'litper_expenses';

const CATEGORIES: CategoryConfig[] = [
  { id: 'publicidad', label: 'Publicidad', icon: Megaphone, color: 'purple' },
  { id: 'nomina', label: 'Nómina', icon: Users, color: 'blue' },
  { id: 'servicios', label: 'Servicios', icon: Wrench, color: 'amber' },
  { id: 'logistica', label: 'Logística', icon: Truck, color: 'emerald' },
  { id: 'otros', label: 'Otros', icon: MoreHorizontal, color: 'slate' },
];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const ExpenseManager: React.FC = () => {
  // Estados
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<'week' | 'month' | 'year' | 'all'>('month');
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [showImporter, setShowImporter] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importMapping, setImportMapping] = useState<Record<string, string>>({});

  // Form states
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    category: 'otros' as ExpenseCategory,
    provider: '',
    receipt: '',
    notes: '',
  });

  // Cargar datos de localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setExpenses(JSON.parse(saved));
    }
  }, []);

  // Guardar en localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }, [expenses]);

  // Formatear moneda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Filtrar gastos por período
  const filterByPeriod = (expense: Expense): boolean => {
    const expenseDate = new Date(expense.date);
    const now = new Date();

    switch (filterPeriod) {
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return expenseDate >= weekAgo;
      case 'month':
        return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
      case 'year':
        return expenseDate.getFullYear() === now.getFullYear();
      default:
        return true;
    }
  };

  // Filtrar gastos
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const matchesSearch =
        exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.provider.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || exp.category === filterCategory;
      const matchesPeriod = filterByPeriod(exp);
      return matchesSearch && matchesCategory && matchesPeriod;
    });
  }, [expenses, searchTerm, filterCategory, filterPeriod]);

  // Estadísticas por categoría
  const categoryStats = useMemo(() => {
    const stats: Record<string, { count: number; total: number }> = {};
    CATEGORIES.forEach(cat => {
      const catExpenses = filteredExpenses.filter(e => e.category === cat.id);
      stats[cat.id] = {
        count: catExpenses.length,
        total: catExpenses.reduce((sum, e) => sum + e.amount, 0),
      };
    });
    return stats;
  }, [filteredExpenses]);

  // Total general
  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  // Guardar gasto
  const saveExpense = () => {
    const now = new Date().toISOString();
    const expense: Expense = {
      id: editingExpense?.id || Date.now().toString(),
      date: formData.date,
      description: formData.description,
      amount: formData.amount,
      category: formData.category,
      provider: formData.provider,
      receipt: formData.receipt,
      notes: formData.notes,
      createdAt: editingExpense?.createdAt || now,
    };

    if (editingExpense) {
      setExpenses(prev => prev.map(e => e.id === expense.id ? expense : e));
    } else {
      setExpenses(prev => [expense, ...prev]);
    }

    resetForm();
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: 0,
      category: 'otros',
      provider: '',
      receipt: '',
      notes: '',
    });
    setEditingExpense(null);
    setShowForm(false);
  };

  // Editar gasto
  const editExpense = (expense: Expense) => {
    setFormData({
      date: expense.date,
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      provider: expense.provider,
      receipt: expense.receipt || '',
      notes: expense.notes,
    });
    setEditingExpense(expense);
    setShowForm(true);
  };

  // Eliminar gasto
  const deleteExpense = (id: string) => {
    if (confirm('¿Eliminar este gasto?')) {
      setExpenses(prev => prev.filter(e => e.id !== id));
    }
  };

  // Manejar imagen de comprobante
  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({ ...prev, receipt: event.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // Importar Excel/CSV
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length > 0) {
          setImportPreview(jsonData.slice(0, 10));
          // Detectar columnas
          const columns = Object.keys(jsonData[0] as object);
          const mapping: Record<string, string> = {};
          columns.forEach(col => {
            const lower = col.toLowerCase();
            if (lower.includes('fecha') || lower.includes('date')) mapping[col] = 'date';
            else if (lower.includes('desc') || lower.includes('concepto')) mapping[col] = 'description';
            else if (lower.includes('monto') || lower.includes('valor') || lower.includes('amount')) mapping[col] = 'amount';
            else if (lower.includes('categ')) mapping[col] = 'category';
            else if (lower.includes('prov') || lower.includes('empresa')) mapping[col] = 'provider';
            else mapping[col] = '';
          });
          setImportMapping(mapping);
          setShowImporter(true);
        }
      } catch (err) {
        console.error('Error importing file:', err);
        alert('Error al importar archivo');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // Ejecutar importación
  const executeImport = () => {
    const newExpenses: Expense[] = importPreview.map((row: any) => {
      const expense: Expense = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: 0,
        category: 'otros',
        provider: '',
        notes: 'Importado desde Excel',
        createdAt: new Date().toISOString(),
      };

      Object.entries(importMapping).forEach(([col, field]) => {
        if (field && row[col] !== undefined) {
          if (field === 'amount') {
            expense.amount = parseFloat(row[col]) || 0;
          } else if (field === 'category') {
            const val = row[col]?.toString().toLowerCase() || '';
            if (val.includes('public') || val.includes('market')) expense.category = 'publicidad';
            else if (val.includes('nomin') || val.includes('salari')) expense.category = 'nomina';
            else if (val.includes('servic')) expense.category = 'servicios';
            else if (val.includes('logis') || val.includes('envio') || val.includes('transp')) expense.category = 'logistica';
            else expense.category = 'otros';
          } else if (field === 'date') {
            try {
              const dateVal = row[col];
              if (typeof dateVal === 'number') {
                // Excel date serial
                const excelDate = new Date((dateVal - 25569) * 86400 * 1000);
                expense.date = excelDate.toISOString().split('T')[0];
              } else {
                expense.date = new Date(dateVal).toISOString().split('T')[0];
              }
            } catch {
              expense.date = new Date().toISOString().split('T')[0];
            }
          } else {
            (expense as any)[field] = row[col]?.toString() || '';
          }
        }
      });

      return expense;
    });

    setExpenses(prev => [...newExpenses, ...prev]);
    setShowImporter(false);
    setImportPreview([]);
    setImportMapping({});
  };

  // Exportar a Excel
  const exportToExcel = () => {
    const exportData = filteredExpenses.map(exp => ({
      Fecha: exp.date,
      Descripción: exp.description,
      Monto: exp.amount,
      Categoría: CATEGORIES.find(c => c.id === exp.category)?.label || exp.category,
      Proveedor: exp.provider,
      Notas: exp.notes,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Gastos');
    XLSX.writeFile(wb, `Gastos_LITPER_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Obtener configuración de categoría
  const getCategoryConfig = (categoryId: ExpenseCategory): CategoryConfig => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[4];
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Receipt className="w-7 h-7 text-red-500" />
            Gestión de Gastos
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            {filteredExpenses.length} gastos | Total: {formatCurrency(totalExpenses)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <label className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-medium transition-all cursor-pointer">
            <Upload className="w-5 h-5" />
            Importar Excel
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-all"
          >
            <Download className="w-5 h-5" />
            Exportar
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-red-500/30"
          >
            <Plus className="w-5 h-5" />
            Nuevo Gasto
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por descripción o proveedor..."
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-red-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-400" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-3 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-red-500 outline-none"
          >
            <option value="all">Todas las categorías</option>
            {CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-slate-400" />
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value as any)}
            className="px-4 py-3 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-red-500 outline-none"
          >
            <option value="week">Esta semana</option>
            <option value="month">Este mes</option>
            <option value="year">Este año</option>
            <option value="all">Todo el tiempo</option>
          </select>
        </div>
      </div>

      {/* Category Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {CATEGORIES.map(cat => {
          const stats = categoryStats[cat.id];
          const Icon = cat.icon;
          const percentage = totalExpenses > 0 ? (stats.total / totalExpenses * 100).toFixed(1) : '0';
          return (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(filterCategory === cat.id ? 'all' : cat.id)}
              className={`p-4 rounded-xl border transition-all ${
                filterCategory === cat.id
                  ? `bg-${cat.color}-100 dark:bg-${cat.color}-900/30 border-${cat.color}-400`
                  : 'bg-white dark:bg-navy-800 border-slate-200 dark:border-navy-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 text-${cat.color}-500`} />
                <span className={`text-lg font-bold text-${cat.color}-600 dark:text-${cat.color}-400`}>
                  {stats.count}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{cat.label}</p>
              <p className="text-xs text-slate-500">{formatCurrency(stats.total)}</p>
              <div className="mt-2 h-1 bg-slate-200 dark:bg-navy-700 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-${cat.color}-500 rounded-full transition-all`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">{percentage}% del total</p>
            </button>
          );
        })}
      </div>

      {/* Expenses List */}
      {filteredExpenses.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 dark:bg-navy-800 rounded-2xl">
          <Receipt className="w-16 h-16 mx-auto text-slate-300 dark:text-navy-600 mb-4" />
          <p className="text-lg font-medium text-slate-500 mb-2">No hay gastos registrados</p>
          <p className="text-sm text-slate-400">Registra tu primer gasto o importa desde Excel</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-slate-200 dark:border-navy-700">
                <th className="text-left py-4 px-4 text-xs font-bold uppercase text-slate-500">Fecha</th>
                <th className="text-left py-4 px-4 text-xs font-bold uppercase text-slate-500">Descripción</th>
                <th className="text-left py-4 px-4 text-xs font-bold uppercase text-slate-500">Categoría</th>
                <th className="text-left py-4 px-4 text-xs font-bold uppercase text-slate-500">Proveedor</th>
                <th className="text-right py-4 px-4 text-xs font-bold uppercase text-slate-500">Monto</th>
                <th className="text-center py-4 px-4 text-xs font-bold uppercase text-slate-500">Comprobante</th>
                <th className="text-right py-4 px-4 text-xs font-bold uppercase text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense) => {
                const catConfig = getCategoryConfig(expense.category);
                const CatIcon = catConfig.icon;
                return (
                  <tr
                    key={expense.id}
                    className="border-b border-slate-100 dark:border-navy-700 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                  >
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-400">{expense.date}</td>
                    <td className="py-4 px-4">
                      <p className="font-medium text-slate-700 dark:text-white">{expense.description}</p>
                      {expense.notes && (
                        <p className="text-xs text-slate-500 truncate max-w-xs">{expense.notes}</p>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-${catConfig.color}-100 text-${catConfig.color}-700 dark:bg-${catConfig.color}-900/30 dark:text-${catConfig.color}-400`}>
                        <CatIcon className="w-3 h-3" />
                        {catConfig.label}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-400">
                      {expense.provider || '-'}
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-red-600">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {expense.receipt ? (
                        <button
                          onClick={() => setViewingExpense(expense)}
                          className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"
                          title="Ver comprobante"
                        >
                          <Image className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingExpense(expense)}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-navy-700 rounded-lg text-slate-500 hover:text-blue-500 transition-colors"
                          title="Ver"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => editExpense(expense)}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-navy-700 rounded-lg text-slate-500 hover:text-amber-500 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteExpense(expense.id)}
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
          <div className="bg-white dark:bg-navy-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-red-500 to-pink-500 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Receipt className="w-8 h-8" />
                  <h3 className="text-xl font-bold">
                    {editingExpense ? 'Editar Gasto' : 'Nuevo Gasto'}
                  </h3>
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
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-4 py-3 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Descripción *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Ej: Pago publicidad Facebook"
                  className="w-full px-4 py-3 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Monto *
                </label>
                <input
                  type="number"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-3 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Categoría *
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {CATEGORIES.map(cat => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                          formData.category === cat.id
                            ? `border-${cat.color}-500 bg-${cat.color}-50 dark:bg-${cat.color}-900/30`
                            : 'border-slate-200 dark:border-navy-700 hover:border-slate-300'
                        }`}
                      >
                        <Icon className={`w-5 h-5 text-${cat.color}-500`} />
                        <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">
                          {cat.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Provider */}
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Proveedor
                </label>
                <input
                  type="text"
                  value={formData.provider}
                  onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value }))}
                  placeholder="Nombre del proveedor o empresa"
                  className="w-full px-4 py-3 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              {/* Receipt */}
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Comprobante (imagen)
                </label>
                {formData.receipt ? (
                  <div className="relative">
                    <img
                      src={formData.receipt}
                      alt="Comprobante"
                      className="w-full h-40 object-cover rounded-xl border border-slate-200 dark:border-navy-700"
                    />
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, receipt: '' }))}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="block p-8 border-2 border-dashed border-slate-300 dark:border-navy-600 rounded-xl text-center cursor-pointer hover:border-red-500 transition-colors">
                    <Image className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                    <p className="text-sm text-slate-500">Clic para subir comprobante</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleReceiptUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Notas
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Observaciones adicionales..."
                  rows={2}
                  className="w-full px-4 py-3 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl focus:ring-2 focus:ring-red-500 outline-none resize-none"
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
                onClick={saveExpense}
                disabled={!formData.description || !formData.amount}
                className="flex items-center gap-2 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/30"
              >
                <Save className="w-4 h-4" />
                Guardar Gasto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Expense Modal */}
      {viewingExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-navy-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-red-500 to-pink-500 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Detalle del Gasto</h3>
                  <p className="text-red-100 text-sm">{viewingExpense.date}</p>
                </div>
                <button
                  onClick={() => setViewingExpense(null)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="text-center">
                <p className="text-3xl font-black text-red-600">{formatCurrency(viewingExpense.amount)}</p>
                <p className="text-lg text-slate-700 dark:text-white font-medium mt-2">{viewingExpense.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-navy-800 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Categoría</p>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const cat = getCategoryConfig(viewingExpense.category);
                      const Icon = cat.icon;
                      return (
                        <>
                          <Icon className={`w-4 h-4 text-${cat.color}-500`} />
                          <span className="font-medium text-slate-700 dark:text-white">{cat.label}</span>
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-navy-800 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Proveedor</p>
                  <p className="font-medium text-slate-700 dark:text-white">
                    {viewingExpense.provider || 'No especificado'}
                  </p>
                </div>
              </div>

              {viewingExpense.notes && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Notas</p>
                  <p className="text-slate-700 dark:text-slate-300">{viewingExpense.notes}</p>
                </div>
              )}

              {viewingExpense.receipt && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Comprobante</p>
                  <img
                    src={viewingExpense.receipt}
                    alt="Comprobante"
                    className="w-full rounded-xl border border-slate-200 dark:border-navy-700"
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-50 dark:bg-navy-800 border-t border-slate-200 dark:border-navy-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  editExpense(viewingExpense);
                  setViewingExpense(null);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-all"
              >
                <Edit2 className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={() => setViewingExpense(null)}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-700 rounded-xl font-medium transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImporter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-navy-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-8 h-8" />
                  <div>
                    <h3 className="text-xl font-bold">Importar desde Excel</h3>
                    <p className="text-cyan-100 text-sm">{importPreview.length} registros encontrados</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowImporter(false);
                    setImportPreview([]);
                    setImportMapping({});
                  }}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Column Mapping */}
              <div>
                <h4 className="font-bold text-slate-700 dark:text-white mb-4">Mapeo de Columnas</h4>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.keys(importMapping).map(col => (
                    <div key={col} className="p-3 bg-slate-50 dark:bg-navy-800 rounded-xl">
                      <p className="text-xs text-slate-500 mb-1 truncate">{col}</p>
                      <select
                        value={importMapping[col]}
                        onChange={(e) => setImportMapping(prev => ({ ...prev, [col]: e.target.value }))}
                        className="w-full px-3 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                      >
                        <option value="">-- Ignorar --</option>
                        <option value="date">Fecha</option>
                        <option value="description">Descripción</option>
                        <option value="amount">Monto</option>
                        <option value="category">Categoría</option>
                        <option value="provider">Proveedor</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div>
                <h4 className="font-bold text-slate-700 dark:text-white mb-4">Vista Previa (primeros 10)</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-navy-700">
                        {Object.keys(importPreview[0] || {}).map(col => (
                          <th key={col} className="text-left py-2 px-3 text-xs font-bold text-slate-500">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.map((row, idx) => (
                        <tr key={idx} className="border-b border-slate-100 dark:border-navy-700">
                          {Object.values(row).map((val: any, i) => (
                            <td key={i} className="py-2 px-3 text-slate-600 dark:text-slate-400 truncate max-w-[150px]">
                              {val?.toString() || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-50 dark:bg-navy-800 border-t border-slate-200 dark:border-navy-700 flex justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Revisa el mapeo antes de importar
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowImporter(false);
                    setImportPreview([]);
                    setImportMapping({});
                  }}
                  className="px-6 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-700 rounded-xl font-medium transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={executeImport}
                  className="flex items-center gap-2 px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-cyan-500/30"
                >
                  <CheckCircle className="w-4 h-4" />
                  Importar {importPreview.length} Gastos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseManager;
