// components/admin/FinanceCenter/ExpensesManager.tsx
// Gestor de Gastos - Publicidad y Gastos Fijos

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Copy,
  FileText,
  Megaphone,
  Building,
  TrendingDown,
  DollarSign,
  Calendar,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Bookmark,
  Download,
} from 'lucide-react';
import {
  useFinanceStore,
  formatCurrency,
  getMonthName,
  getPreviousMonth,
  EXPENSE_CATEGORIES,
  type Expense,
  type ExpenseCategory,
} from '../../../services/financeService';

// ============================================
// COMPONENTE DE FORMULARIO DE GASTO
// ============================================
interface ExpenseFormProps {
  expense?: Expense;
  onSave: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  month: string;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ expense, onSave, onCancel, month }) => {
  const [formData, setFormData] = useState({
    category: expense?.category || ('advertising_facebook' as ExpenseCategory),
    description: expense?.description || '',
    amount: expense?.amount || 0,
    isRecurring: expense?.isRecurring || false,
    platform: expense?.platform || '',
    campaign: expense?.campaign || '',
    notes: expense?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      date: `${month}-01`,
      month,
    });
  };

  const groupedCategories = useMemo(() => {
    const groups: Record<string, { key: ExpenseCategory; label: string; icon: string }[]> = {};
    Object.entries(EXPENSE_CATEGORIES).forEach(([key, value]) => {
      if (!groups[value.group]) groups[value.group] = [];
      groups[value.group].push({ key: key as ExpenseCategory, ...value });
    });
    return groups;
  }, []);

  const isAdvertising = formData.category.startsWith('advertising_');

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Categoría */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Categoría
        </label>
        <select
          value={formData.category}
          onChange={(e) =>
            setFormData({ ...formData, category: e.target.value as ExpenseCategory })
          }
          className="w-full px-3 py-2 border border-slate-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-slate-800 dark:text-white"
        >
          {Object.entries(groupedCategories).map(([group, categories]) => (
            <optgroup key={group} label={group}>
              {categories.map((cat) => (
                <option key={cat.key} value={cat.key}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Descripción
        </label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-slate-800 dark:text-white"
          placeholder={isAdvertising ? 'Ej: Campaña Black Friday' : 'Ej: Pago mensual'}
        />
      </div>

      {/* Monto */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Monto (COP)
        </label>
        <input
          type="number"
          value={formData.amount || ''}
          onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
          className="w-full px-3 py-2 border border-slate-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-slate-800 dark:text-white"
          placeholder="0"
          required
        />
      </div>

      {/* Campos adicionales para publicidad */}
      {isAdvertising && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Campaña (opcional)
            </label>
            <input
              type="text"
              value={formData.campaign}
              onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-slate-800 dark:text-white"
              placeholder="Nombre de campaña"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Notas (opcional)
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-slate-800 dark:text-white"
              placeholder="Notas adicionales"
            />
          </div>
        </div>
      )}

      {/* Recurrente */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.isRecurring}
          onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
          className="w-4 h-4 text-blue-500 rounded border-slate-300 dark:border-navy-600"
        />
        <span className="text-sm text-slate-700 dark:text-slate-300">
          Gasto recurrente (se puede copiar al siguiente mes)
        </span>
      </label>

      {/* Botones */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-slate-300 dark:border-navy-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          {expense ? 'Actualizar' : 'Agregar'}
        </button>
      </div>
    </form>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const ExpensesManager: React.FC = () => {
  const {
    expenses,
    expenseTemplates,
    selectedMonth,
    setSelectedMonth,
    addExpense,
    updateExpense,
    deleteExpense,
    copyExpensesFromMonth,
    saveExpenseTemplate,
    applyExpenseTemplate,
    deleteExpenseTemplate,
    getAdvertisingMetrics,
  } = useFinanceStore();

  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Publicidad: true,
    'Gastos Fijos': true,
    'Gastos Variables': false,
  });
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');

  // Filtrar gastos del mes
  const monthExpenses = expenses.filter((e) => e.month === selectedMonth);

  // Agrupar por categoría
  const groupedExpenses = useMemo(() => {
    const groups: Record<string, Expense[]> = {
      Publicidad: [],
      'Gastos Fijos': [],
      'Gastos Variables': [],
    };

    monthExpenses.forEach((expense) => {
      const group = EXPENSE_CATEGORIES[expense.category]?.group || 'Otros';
      if (!groups[group]) groups[group] = [];
      groups[group].push(expense);
    });

    return groups;
  }, [monthExpenses]);

  // Totales por grupo
  const groupTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    Object.entries(groupedExpenses).forEach(([group, expenses]) => {
      totals[group] = expenses.reduce((sum, e) => sum + e.amount, 0);
    });
    return totals;
  }, [groupedExpenses]);

  const totalExpenses = Object.values(groupTotals).reduce((a, b) => a + b, 0);

  // Métricas de publicidad
  const advertisingMetrics = getAdvertisingMetrics(selectedMonth);

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const handleSaveExpense = (data: Omit<Expense, 'id' | 'createdAt'>) => {
    if (editingExpense) {
      updateExpense(editingExpense.id, data);
    } else {
      addExpense(data);
    }
    setShowForm(false);
    setEditingExpense(null);
  };

  const handleCopyFromPrevious = () => {
    const prevMonth = getPreviousMonth(selectedMonth);
    copyExpensesFromMonth(prevMonth, selectedMonth);
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;
    const fixedExpenses = monthExpenses.filter(
      (e) => e.category.startsWith('fixed_') || e.isRecurring
    );
    saveExpenseTemplate(templateName, fixedExpenses);
    setShowTemplateModal(false);
    setTemplateName('');
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-red-500" />
            Gastos - {getMonthName(selectedMonth)} {selectedMonth.split('-')[0]}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Registra gastos publicitarios y fijos del negocio
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-slate-800 dark:text-white"
          />
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Agregar Gasto
          </button>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleCopyFromPrevious}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-navy-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-navy-600 transition-colors"
        >
          <Copy className="w-4 h-4" />
          Copiar del mes anterior
        </button>

        <button
          onClick={() => setShowTemplateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-navy-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-navy-600 transition-colors"
        >
          <Bookmark className="w-4 h-4" />
          Guardar como plantilla
        </button>

        {expenseTemplates.length > 0 && (
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
              <FileText className="w-4 h-4" />
              Aplicar plantilla
              <ChevronDown className="w-4 h-4" />
            </button>
            <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-navy-800 rounded-lg shadow-lg border border-slate-200 dark:border-navy-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              {expenseTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => applyExpenseTemplate(template.id, selectedMonth)}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-700 first:rounded-t-lg last:rounded-b-lg"
                >
                  {template.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Resumen de gastos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
            <TrendingDown className="w-4 h-4" />
            Total Gastos
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(totalExpenses)}
          </p>
        </div>

        <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
            <Megaphone className="w-4 h-4" />
            Publicidad
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {formatCurrency(groupTotals['Publicidad'] || 0)}
          </p>
        </div>

        <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
            <Building className="w-4 h-4" />
            Gastos Fijos
          </div>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {formatCurrency(groupTotals['Gastos Fijos'] || 0)}
          </p>
        </div>

        <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
            <DollarSign className="w-4 h-4" />
            ROAS
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {advertisingMetrics.roas.toFixed(1)}x
          </p>
        </div>
      </div>

      {/* Desglose de publicidad por plataforma */}
      {Object.keys(advertisingMetrics.byPlatform).length > 0 && (
        <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-purple-500" />
            Inversión Publicitaria por Plataforma
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(advertisingMetrics.byPlatform).map(([platform, amount]) => (
              <div key={platform} className="text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">{platform}</p>
                <p className="text-lg font-semibold text-slate-800 dark:text-white">
                  {formatCurrency(amount)}
                </p>
                <p className="text-xs text-slate-400">
                  {((amount / advertisingMetrics.total) * 100).toFixed(0)}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de gastos por grupo */}
      <div className="space-y-4">
        {Object.entries(groupedExpenses).map(([group, expenses]) => (
          <div
            key={group}
            className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 overflow-hidden"
          >
            <button
              onClick={() => toggleGroup(group)}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-navy-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {expandedGroups[group] ? (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                )}
                <span className="font-semibold text-slate-800 dark:text-white">
                  {group}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  ({expenses.length} gastos)
                </span>
              </div>
              <span className="font-semibold text-red-600 dark:text-red-400">
                {formatCurrency(groupTotals[group] || 0)}
              </span>
            </button>

            {expandedGroups[group] && expenses.length > 0 && (
              <div className="border-t border-slate-200 dark:border-navy-700 divide-y divide-slate-100 dark:divide-navy-700">
                {expenses.map((expense) => {
                  const categoryInfo = EXPENSE_CATEGORIES[expense.category];
                  return (
                    <div
                      key={expense.id}
                      className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-navy-700/30"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{categoryInfo?.icon || '📋'}</span>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white">
                            {expense.description || categoryInfo?.label}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {categoryInfo?.label}
                            {expense.campaign && ` • ${expense.campaign}`}
                            {expense.isRecurring && (
                              <span className="ml-2 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
                                Recurrente
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-slate-800 dark:text-white">
                          {formatCurrency(expense.amount)}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingExpense(expense);
                              setShowForm(true);
                            }}
                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteExpense(expense.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {expandedGroups[group] && expenses.length === 0 && (
              <div className="p-6 text-center text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-navy-700">
                No hay gastos en esta categoría
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal de formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-navy-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-navy-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                {editingExpense ? 'Editar Gasto' : 'Agregar Gasto'}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingExpense(null);
                }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-navy-700 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6">
              <ExpenseForm
                expense={editingExpense || undefined}
                onSave={handleSaveExpense}
                onCancel={() => {
                  setShowForm(false);
                  setEditingExpense(null);
                }}
                month={selectedMonth}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de plantilla */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-navy-800 rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200 dark:border-navy-700">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                Guardar como Plantilla
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Guarda los gastos fijos y recurrentes para reutilizarlos
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nombre de la plantilla
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-slate-800 dark:text-white"
                  placeholder="Ej: Gastos fijos mensuales"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-navy-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-navy-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveTemplate}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesManager;
