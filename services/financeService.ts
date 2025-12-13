// services/financeService.ts
// Centro Financiero Completo - Nivel Amazon
// Gestión de ingresos, gastos, P&L e histórico financiero

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// TIPOS E INTERFACES
// ============================================

export type ExpenseCategory =
  | 'advertising_facebook'
  | 'advertising_instagram'
  | 'advertising_tiktok'
  | 'advertising_google'
  | 'advertising_influencers'
  | 'advertising_other'
  | 'fixed_dropi'
  | 'fixed_tools'
  | 'fixed_internet'
  | 'fixed_employees'
  | 'fixed_software'
  | 'fixed_accounting'
  | 'fixed_office'
  | 'fixed_other'
  | 'variable_shipping'
  | 'variable_packaging'
  | 'variable_returns'
  | 'variable_other';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  isRecurring: boolean;
  platform?: string; // Para gastos publicitarios
  campaign?: string; // Para gastos publicitarios
  notes?: string;
  createdAt: string;
}

export interface Income {
  id: string;
  source: 'dropi' | 'manual' | 'other';
  description: string;
  grossSales: number; // Ventas brutas
  netSales: number; // Ventas netas (después de devoluciones)
  productCost: number; // Costo de productos
  shippingCost: number; // Costo de fletes
  returnsCost: number; // Costo de devoluciones
  commissions: number; // Comisiones
  profit: number; // Ganancia
  ordersCount: number; // Cantidad de pedidos
  deliveredCount: number; // Entregados
  returnedCount: number; // Devueltos
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  fileName?: string; // Nombre del archivo cargado
  createdAt: string;
}

export interface MonthlyFinancial {
  month: string; // YYYY-MM
  year: number;
  monthNumber: number;

  // Ingresos
  grossSales: number;
  netSales: number;
  totalIncome: number;

  // Costos de venta
  productCost: number;
  shippingCost: number;
  returnsCost: number;
  commissions: number;
  totalCostOfSales: number;

  // Utilidad bruta
  grossProfit: number;
  grossMargin: number;

  // Gastos operativos
  advertisingExpenses: number;
  fixedExpenses: number;
  variableExpenses: number;
  totalOperatingExpenses: number;

  // Utilidad neta
  netProfit: number;
  netMargin: number;

  // KPIs
  roas: number; // Return on Ad Spend
  cpa: number; // Cost per Acquisition
  aov: number; // Average Order Value
  deliveryRate: number;
  returnRate: number;

  // Métricas de volumen
  totalOrders: number;
  deliveredOrders: number;
  returnedOrders: number;

  // Metadata
  lastUpdated: string;
}

export interface FinancialGoal {
  id: string;
  type: 'monthly_sales' | 'monthly_profit' | 'margin' | 'roas' | 'orders';
  target: number;
  current: number;
  month: string;
  year: number;
  createdAt: string;
}

export interface ExpenseTemplate {
  id: string;
  name: string;
  expenses: Omit<Expense, 'id' | 'date' | 'month' | 'createdAt'>[];
}

// ============================================
// CONSTANTES
// ============================================

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, { label: string; group: string; icon: string }> = {
  // Publicidad
  advertising_facebook: { label: 'Facebook Ads', group: 'Publicidad', icon: '📘' },
  advertising_instagram: { label: 'Instagram Ads', group: 'Publicidad', icon: '📸' },
  advertising_tiktok: { label: 'TikTok Ads', group: 'Publicidad', icon: '🎵' },
  advertising_google: { label: 'Google Ads', group: 'Publicidad', icon: '🔍' },
  advertising_influencers: { label: 'Influencers', group: 'Publicidad', icon: '⭐' },
  advertising_other: { label: 'Otra Publicidad', group: 'Publicidad', icon: '📢' },
  // Fijos
  fixed_dropi: { label: 'Dropi (Membresía)', group: 'Gastos Fijos', icon: '📦' },
  fixed_tools: { label: 'Herramientas', group: 'Gastos Fijos', icon: '🔧' },
  fixed_internet: { label: 'Internet/Teléfono', group: 'Gastos Fijos', icon: '📶' },
  fixed_employees: { label: 'Empleados/VA', group: 'Gastos Fijos', icon: '👥' },
  fixed_software: { label: 'Software/Apps', group: 'Gastos Fijos', icon: '💻' },
  fixed_accounting: { label: 'Contabilidad', group: 'Gastos Fijos', icon: '📊' },
  fixed_office: { label: 'Oficina/Local', group: 'Gastos Fijos', icon: '🏢' },
  fixed_other: { label: 'Otros Fijos', group: 'Gastos Fijos', icon: '📋' },
  // Variables
  variable_shipping: { label: 'Envíos Extra', group: 'Gastos Variables', icon: '🚚' },
  variable_packaging: { label: 'Empaque', group: 'Gastos Variables', icon: '📦' },
  variable_returns: { label: 'Devoluciones Extra', group: 'Gastos Variables', icon: '↩️' },
  variable_other: { label: 'Otros Variables', group: 'Gastos Variables', icon: '📝' },
};

export const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// ============================================
// STORE PRINCIPAL
// ============================================

interface FinanceState {
  // Datos
  incomes: Income[];
  expenses: Expense[];
  monthlyData: MonthlyFinancial[];
  goals: FinancialGoal[];
  expenseTemplates: ExpenseTemplate[];

  // UI State
  selectedMonth: string;
  selectedYear: number;
  isLoading: boolean;

  // Actions - Ingresos
  addIncome: (income: Omit<Income, 'id' | 'createdAt'>) => void;
  updateIncome: (id: string, income: Partial<Income>) => void;
  deleteIncome: (id: string) => void;
  importDropiData: (data: any[], fileName: string) => Income;

  // Actions - Gastos
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  addBulkExpenses: (expenses: Omit<Expense, 'id' | 'createdAt'>[]) => void;
  copyExpensesFromMonth: (fromMonth: string, toMonth: string) => void;

  // Actions - Templates
  saveExpenseTemplate: (name: string, expenses: Expense[]) => void;
  applyExpenseTemplate: (templateId: string, month: string) => void;
  deleteExpenseTemplate: (id: string) => void;

  // Actions - Metas
  setGoal: (goal: Omit<FinancialGoal, 'id' | 'createdAt' | 'current'>) => void;
  updateGoalProgress: () => void;

  // Actions - Cálculos
  calculateMonthlyData: (month: string) => MonthlyFinancial;
  recalculateAllMonths: () => void;

  // Actions - Navegación
  setSelectedMonth: (month: string) => void;
  setSelectedYear: (year: number) => void;

  // Getters
  getMonthlyReport: (month: string) => MonthlyFinancial | null;
  getYearlyReport: (year: number) => MonthlyFinancial[];
  getExpensesByCategory: (month: string) => Record<string, number>;
  getAdvertisingMetrics: (month: string) => { total: number; byPlatform: Record<string, number>; roas: number };
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const getCurrentMonth = () => new Date().toISOString().slice(0, 7);
const getCurrentYear = () => new Date().getFullYear();

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      // Initial State
      incomes: [],
      expenses: [],
      monthlyData: [],
      goals: [],
      expenseTemplates: [],
      selectedMonth: getCurrentMonth(),
      selectedYear: getCurrentYear(),
      isLoading: false,

      // ============================================
      // INGRESOS
      // ============================================

      addIncome: (income) => {
        const newIncome: Income = {
          ...income,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          incomes: [...state.incomes, newIncome],
        }));
        get().calculateMonthlyData(income.month);
      },

      updateIncome: (id, updates) => {
        set((state) => ({
          incomes: state.incomes.map((i) =>
            i.id === id ? { ...i, ...updates } : i
          ),
        }));
        const income = get().incomes.find((i) => i.id === id);
        if (income) get().calculateMonthlyData(income.month);
      },

      deleteIncome: (id) => {
        const income = get().incomes.find((i) => i.id === id);
        set((state) => ({
          incomes: state.incomes.filter((i) => i.id !== id),
        }));
        if (income) get().calculateMonthlyData(income.month);
      },

      importDropiData: (data, fileName) => {
        // Procesar datos de Dropi
        let grossSales = 0;
        let productCost = 0;
        let shippingCost = 0;
        let returnsCost = 0;
        let commissions = 0;
        let profit = 0;
        let ordersCount = data.length;
        let deliveredCount = 0;
        let returnedCount = 0;

        data.forEach((row: any) => {
          // Detectar columnas comunes de Dropi
          const valorFacturado = parseFloat(row['VALOR FACTURADO'] || row['Valor Facturado'] || row['valor_facturado'] || 0);
          const ganancia = parseFloat(row['GANANCIA'] || row['Ganancia'] || row['ganancia'] || row['Utilidad'] || 0);
          const flete = parseFloat(row['PRECIO FLETE'] || row['Precio Flete'] || row['precio_flete'] || row['Costo Flete'] || 0);
          const devolucion = parseFloat(row['COSTO DEVOLUCION'] || row['Costo Devolución'] || row['costo_devolucion'] || 0);
          const comision = parseFloat(row['COMISION'] || row['Comisión'] || row['comision'] || 0);
          const estado = (row['ESTADO GUIA'] || row['Estado Guía'] || row['estado_guia'] || row['Estado'] || '').toString().toUpperCase();

          grossSales += valorFacturado;
          profit += ganancia;
          shippingCost += flete;
          returnsCost += devolucion;
          commissions += comision;

          // Calcular costo del producto (Valor Facturado - Ganancia - Flete)
          const costoProducto = valorFacturado - ganancia - flete;
          productCost += Math.max(0, costoProducto);

          // Contar estados
          if (estado.includes('ENTREGAD') || estado.includes('DELIVERED')) {
            deliveredCount++;
          } else if (estado.includes('DEVOLU') || estado.includes('RETURN')) {
            returnedCount++;
          }
        });

        const netSales = grossSales - returnsCost;
        const today = new Date();
        const month = today.toISOString().slice(0, 7);

        const income: Income = {
          id: generateId(),
          source: 'dropi',
          description: `Importación Dropi - ${fileName}`,
          grossSales,
          netSales,
          productCost,
          shippingCost,
          returnsCost,
          commissions,
          profit,
          ordersCount,
          deliveredCount,
          returnedCount,
          date: today.toISOString().slice(0, 10),
          month,
          fileName,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          incomes: [...state.incomes, income],
        }));

        get().calculateMonthlyData(month);
        return income;
      },

      // ============================================
      // GASTOS
      // ============================================

      addExpense: (expense) => {
        const newExpense: Expense = {
          ...expense,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          expenses: [...state.expenses, newExpense],
        }));
        get().calculateMonthlyData(expense.month);
      },

      updateExpense: (id, updates) => {
        set((state) => ({
          expenses: state.expenses.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        }));
        const expense = get().expenses.find((e) => e.id === id);
        if (expense) get().calculateMonthlyData(expense.month);
      },

      deleteExpense: (id) => {
        const expense = get().expenses.find((e) => e.id === id);
        set((state) => ({
          expenses: state.expenses.filter((e) => e.id !== id),
        }));
        if (expense) get().calculateMonthlyData(expense.month);
      },

      addBulkExpenses: (expenses) => {
        const newExpenses = expenses.map((e) => ({
          ...e,
          id: generateId(),
          createdAt: new Date().toISOString(),
        }));
        set((state) => ({
          expenses: [...state.expenses, ...newExpenses],
        }));
        // Recalcular meses afectados
        const months = [...new Set(expenses.map((e) => e.month))];
        months.forEach((m) => get().calculateMonthlyData(m));
      },

      copyExpensesFromMonth: (fromMonth, toMonth) => {
        const { expenses } = get();
        const expensesToCopy = expenses.filter(
          (e) => e.month === fromMonth && (e.isRecurring || e.category.startsWith('fixed_'))
        );

        const newExpenses = expensesToCopy.map((e) => ({
          ...e,
          id: generateId(),
          date: `${toMonth}-01`,
          month: toMonth,
          createdAt: new Date().toISOString(),
        }));

        set((state) => ({
          expenses: [...state.expenses, ...newExpenses],
        }));
        get().calculateMonthlyData(toMonth);
      },

      // ============================================
      // TEMPLATES
      // ============================================

      saveExpenseTemplate: (name, expenses) => {
        const template: ExpenseTemplate = {
          id: generateId(),
          name,
          expenses: expenses.map((e) => ({
            category: e.category,
            description: e.description,
            amount: e.amount,
            isRecurring: e.isRecurring,
            platform: e.platform,
            campaign: e.campaign,
            notes: e.notes,
          })),
        };
        set((state) => ({
          expenseTemplates: [...state.expenseTemplates, template],
        }));
      },

      applyExpenseTemplate: (templateId, month) => {
        const template = get().expenseTemplates.find((t) => t.id === templateId);
        if (!template) return;

        const newExpenses = template.expenses.map((e) => ({
          ...e,
          id: generateId(),
          date: `${month}-01`,
          month,
          createdAt: new Date().toISOString(),
        }));

        set((state) => ({
          expenses: [...state.expenses, ...newExpenses as Expense[]],
        }));
        get().calculateMonthlyData(month);
      },

      deleteExpenseTemplate: (id) => {
        set((state) => ({
          expenseTemplates: state.expenseTemplates.filter((t) => t.id !== id),
        }));
      },

      // ============================================
      // METAS
      // ============================================

      setGoal: (goal) => {
        const newGoal: FinancialGoal = {
          ...goal,
          id: generateId(),
          current: 0,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          goals: [...state.goals.filter(
            (g) => !(g.type === goal.type && g.month === goal.month)
          ), newGoal],
        }));
        get().updateGoalProgress();
      },

      updateGoalProgress: () => {
        const { goals, monthlyData } = get();
        const updatedGoals = goals.map((goal) => {
          const monthData = monthlyData.find((m) => m.month === goal.month);
          if (!monthData) return goal;

          let current = 0;
          switch (goal.type) {
            case 'monthly_sales':
              current = monthData.grossSales;
              break;
            case 'monthly_profit':
              current = monthData.netProfit;
              break;
            case 'margin':
              current = monthData.netMargin;
              break;
            case 'roas':
              current = monthData.roas;
              break;
            case 'orders':
              current = monthData.totalOrders;
              break;
          }
          return { ...goal, current };
        });

        set({ goals: updatedGoals });
      },

      // ============================================
      // CÁLCULOS
      // ============================================

      calculateMonthlyData: (month) => {
        const { incomes, expenses, monthlyData } = get();

        // Filtrar datos del mes
        const monthIncomes = incomes.filter((i) => i.month === month);
        const monthExpenses = expenses.filter((e) => e.month === month);

        // Calcular ingresos
        const grossSales = monthIncomes.reduce((sum, i) => sum + i.grossSales, 0);
        const netSales = monthIncomes.reduce((sum, i) => sum + i.netSales, 0);
        const productCost = monthIncomes.reduce((sum, i) => sum + i.productCost, 0);
        const shippingCost = monthIncomes.reduce((sum, i) => sum + i.shippingCost, 0);
        const returnsCost = monthIncomes.reduce((sum, i) => sum + i.returnsCost, 0);
        const commissions = monthIncomes.reduce((sum, i) => sum + i.commissions, 0);

        // Calcular gastos por categoría
        const advertisingExpenses = monthExpenses
          .filter((e) => e.category.startsWith('advertising_'))
          .reduce((sum, e) => sum + e.amount, 0);

        const fixedExpenses = monthExpenses
          .filter((e) => e.category.startsWith('fixed_'))
          .reduce((sum, e) => sum + e.amount, 0);

        const variableExpenses = monthExpenses
          .filter((e) => e.category.startsWith('variable_'))
          .reduce((sum, e) => sum + e.amount, 0);

        // Cálculos de P&L
        const totalCostOfSales = productCost + shippingCost + returnsCost + commissions;
        const grossProfit = netSales - totalCostOfSales;
        const grossMargin = netSales > 0 ? (grossProfit / netSales) * 100 : 0;

        const totalOperatingExpenses = advertisingExpenses + fixedExpenses + variableExpenses;
        const netProfit = grossProfit - totalOperatingExpenses;
        const netMargin = netSales > 0 ? (netProfit / netSales) * 100 : 0;

        // Métricas de volumen
        const totalOrders = monthIncomes.reduce((sum, i) => sum + i.ordersCount, 0);
        const deliveredOrders = monthIncomes.reduce((sum, i) => sum + i.deliveredCount, 0);
        const returnedOrders = monthIncomes.reduce((sum, i) => sum + i.returnedCount, 0);

        // KPIs
        const roas = advertisingExpenses > 0 ? grossSales / advertisingExpenses : 0;
        const cpa = totalOrders > 0 ? advertisingExpenses / totalOrders : 0;
        const aov = totalOrders > 0 ? grossSales / totalOrders : 0;
        const deliveryRate = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;
        const returnRate = totalOrders > 0 ? (returnedOrders / totalOrders) * 100 : 0;

        const [year, monthNum] = month.split('-').map(Number);

        const monthlyFinancial: MonthlyFinancial = {
          month,
          year,
          monthNumber: monthNum,
          grossSales,
          netSales,
          totalIncome: netSales,
          productCost,
          shippingCost,
          returnsCost,
          commissions,
          totalCostOfSales,
          grossProfit,
          grossMargin,
          advertisingExpenses,
          fixedExpenses,
          variableExpenses,
          totalOperatingExpenses,
          netProfit,
          netMargin,
          roas,
          cpa,
          aov,
          deliveryRate,
          returnRate,
          totalOrders,
          deliveredOrders,
          returnedOrders,
          lastUpdated: new Date().toISOString(),
        };

        // Actualizar o agregar
        set((state) => ({
          monthlyData: [
            ...state.monthlyData.filter((m) => m.month !== month),
            monthlyFinancial,
          ].sort((a, b) => a.month.localeCompare(b.month)),
        }));

        get().updateGoalProgress();
        return monthlyFinancial;
      },

      recalculateAllMonths: () => {
        const { incomes, expenses } = get();
        const months = new Set([
          ...incomes.map((i) => i.month),
          ...expenses.map((e) => e.month),
        ]);
        months.forEach((m) => get().calculateMonthlyData(m));
      },

      // ============================================
      // NAVEGACIÓN
      // ============================================

      setSelectedMonth: (month) => set({ selectedMonth: month }),
      setSelectedYear: (year) => set({ selectedYear: year }),

      // ============================================
      // GETTERS
      // ============================================

      getMonthlyReport: (month) => {
        return get().monthlyData.find((m) => m.month === month) || null;
      },

      getYearlyReport: (year) => {
        return get().monthlyData
          .filter((m) => m.year === year)
          .sort((a, b) => a.monthNumber - b.monthNumber);
      },

      getExpensesByCategory: (month) => {
        const { expenses } = get();
        const monthExpenses = expenses.filter((e) => e.month === month);

        return monthExpenses.reduce((acc, e) => {
          const group = EXPENSE_CATEGORIES[e.category]?.group || 'Otros';
          acc[group] = (acc[group] || 0) + e.amount;
          return acc;
        }, {} as Record<string, number>);
      },

      getAdvertisingMetrics: (month) => {
        const { expenses, monthlyData } = get();
        const monthExpenses = expenses.filter(
          (e) => e.month === month && e.category.startsWith('advertising_')
        );

        const byPlatform = monthExpenses.reduce((acc, e) => {
          const platform = EXPENSE_CATEGORIES[e.category]?.label || 'Otro';
          acc[platform] = (acc[platform] || 0) + e.amount;
          return acc;
        }, {} as Record<string, number>);

        const total = Object.values(byPlatform).reduce((a, b) => a + b, 0);
        const monthData = monthlyData.find((m) => m.month === month);
        const roas = total > 0 && monthData ? monthData.grossSales / total : 0;

        return { total, byPlatform, roas };
      },
    }),
    {
      name: 'litper-finance-store',
      version: 1,
    }
  )
);

// ============================================
// HOOKS AUXILIARES
// ============================================

export function useFinance() {
  const store = useFinanceStore();

  const currentMonthData = store.getMonthlyReport(store.selectedMonth);
  const yearlyData = store.getYearlyReport(store.selectedYear);
  const advertisingMetrics = store.getAdvertisingMetrics(store.selectedMonth);
  const expensesByCategory = store.getExpensesByCategory(store.selectedMonth);

  return {
    ...store,
    currentMonthData,
    yearlyData,
    advertisingMetrics,
    expensesByCategory,
  };
}

export function useFinancialKPIs(month: string) {
  const store = useFinanceStore();
  const data = store.getMonthlyReport(month);

  if (!data) {
    return {
      grossSales: 0,
      netProfit: 0,
      margin: 0,
      roas: 0,
      deliveryRate: 0,
      totalOrders: 0,
    };
  }

  return {
    grossSales: data.grossSales,
    netProfit: data.netProfit,
    margin: data.netMargin,
    roas: data.roas,
    deliveryRate: data.deliveryRate,
    totalOrders: data.totalOrders,
  };
}

// ============================================
// UTILIDADES
// ============================================

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function getMonthName(month: string): string {
  const [, monthNum] = month.split('-').map(Number);
  return MONTHS_ES[monthNum - 1] || '';
}

export function getPreviousMonth(month: string): string {
  const [year, monthNum] = month.split('-').map(Number);
  if (monthNum === 1) {
    return `${year - 1}-12`;
  }
  return `${year}-${String(monthNum - 1).padStart(2, '0')}`;
}

export function getNextMonth(month: string): string {
  const [year, monthNum] = month.split('-').map(Number);
  if (monthNum === 12) {
    return `${year + 1}-01`;
  }
  return `${year}-${String(monthNum + 1).padStart(2, '0')}`;
}

export default useFinanceStore;
