// components/admin/FinanceCenter/FinanceDashboard.tsx
// Dashboard Financiero Principal - Centro de Control del Negocio

import React, { useState } from 'react';
import {
  LayoutDashboard,
  DollarSign,
  TrendingDown,
  FileText,
  Calendar,
  Target,
  ArrowRight,
  Upload,
  PlusCircle,
  Wallet,
  PieChart,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
} from 'lucide-react';
import {
  useFinanceStore,
  formatCurrency,
  formatPercentage,
  getMonthName,
  MONTHS_ES,
} from '../../../services/financeService';
import { IncomeManager } from './IncomeManager';
import { ExpensesManager } from './ExpensesManager';
import { ProfitLossReport } from './ProfitLossReport';
import { FinancialHistory } from './FinancialHistory';

// ============================================
// TIPOS
// ============================================
type FinanceTab = 'overview' | 'income' | 'expenses' | 'pnl' | 'history';

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const FinanceDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FinanceTab>('overview');

  const {
    selectedMonth,
    selectedYear,
    getMonthlyReport,
    getYearlyReport,
    incomes,
    expenses,
  } = useFinanceStore();

  const currentData = getMonthlyReport(selectedMonth);
  const yearlyData = getYearlyReport(selectedYear);

  // Calcular totales anuales
  const yearlyTotals = yearlyData.reduce(
    (acc, m) => ({
      sales: acc.sales + m.grossSales,
      profit: acc.profit + m.netProfit,
      orders: acc.orders + m.totalOrders,
    }),
    { sales: 0, profit: 0, orders: 0 }
  );

  // Tabs de navegación
  const tabs = [
    { id: 'overview' as FinanceTab, label: 'Resumen', icon: LayoutDashboard },
    { id: 'income' as FinanceTab, label: 'Ingresos', icon: DollarSign },
    { id: 'expenses' as FinanceTab, label: 'Gastos', icon: TrendingDown },
    { id: 'pnl' as FinanceTab, label: 'P&L', icon: FileText },
    { id: 'history' as FinanceTab, label: 'Histórico', icon: Calendar },
  ];

  // ============================================
  // OVERVIEW TAB
  // ============================================
  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Centro Financiero</h2>
            <p className="opacity-90 mt-1">
              {getMonthName(selectedMonth)} {selectedMonth.split('-')[0]} - Control total de tu negocio
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-75">Utilidad del mes</p>
            <p className="text-3xl font-bold">
              {currentData ? formatCurrency(currentData.netProfit) : '$0'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setActiveTab('income')}
          className="flex items-center gap-3 p-4 bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 hover:border-green-300 dark:hover:border-green-700 hover:shadow-md transition-all group"
        >
          <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
            <Upload className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-slate-800 dark:text-white">Cargar Dropi</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Importar ventas</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className="flex items-center gap-3 p-4 bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 hover:border-red-300 dark:hover:border-red-700 hover:shadow-md transition-all group"
        >
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
            <PlusCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-slate-800 dark:text-white">Agregar Gasto</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Publicidad o fijos</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('pnl')}
          className="flex items-center gap-3 p-4 bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all group"
        >
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-slate-800 dark:text-white">Ver P&L</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Estado financiero</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className="flex items-center gap-3 p-4 bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md transition-all group"
        >
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
            <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-slate-800 dark:text-white">Histórico</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Progreso anual</p>
          </div>
        </button>
      </div>

      {/* KPIs del Mes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">Ventas del Mes</span>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">
            {currentData ? formatCurrency(currentData.grossSales) : '$0'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {currentData?.totalOrders || 0} pedidos
          </p>
        </div>

        <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">Gastos del Mes</span>
            <TrendingDown className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {currentData
              ? formatCurrency(currentData.totalOperatingExpenses + currentData.totalCostOfSales)
              : '$0'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Publicidad: {currentData ? formatCurrency(currentData.advertisingExpenses) : '$0'}
          </p>
        </div>

        <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">Margen Neto</span>
            <PieChart className="w-5 h-5 text-blue-500" />
          </div>
          <p
            className={`text-2xl font-bold ${
              currentData && currentData.netMargin >= 10
                ? 'text-green-600 dark:text-green-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {currentData ? formatPercentage(currentData.netMargin) : '0%'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Objetivo: 15%
          </p>
        </div>

        <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">ROAS</span>
            <Target className="w-5 h-5 text-purple-500" />
          </div>
          <p
            className={`text-2xl font-bold ${
              currentData && currentData.roas >= 3
                ? 'text-green-600 dark:text-green-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {currentData ? `${currentData.roas.toFixed(1)}x` : '0x'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            CPA: {currentData ? formatCurrency(currentData.cpa) : '$0'}
          </p>
        </div>
      </div>

      {/* Resumen Anual */}
      <div className="bg-white dark:bg-navy-800 rounded-xl p-6 border border-slate-200 dark:border-navy-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            Resumen Anual {selectedYear}
          </h3>
          <button
            onClick={() => setActiveTab('history')}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            Ver detalle <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Ventas Totales</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">
              {formatCurrency(yearlyTotals.sales)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Utilidad Total</p>
            <p
              className={`text-2xl font-bold ${
                yearlyTotals.profit >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {formatCurrency(yearlyTotals.profit)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Pedidos Totales</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">
              {yearlyTotals.orders.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Mini gráfico de los últimos 6 meses */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-navy-700">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
            Utilidad últimos 6 meses
          </p>
          <div className="flex items-end gap-2 h-20">
            {yearlyData.slice(-6).map((month, index) => {
              const maxProfit = Math.max(
                ...yearlyData.slice(-6).map((m) => Math.abs(m.netProfit)),
                1
              );
              const height = (Math.abs(month.netProfit) / maxProfit) * 100;
              const isPositive = month.netProfit >= 0;

              return (
                <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t transition-all ${
                      isPositive
                        ? 'bg-green-500 dark:bg-green-400'
                        : 'bg-red-500 dark:bg-red-400'
                    }`}
                    style={{ height: `${Math.max(height, 5)}%` }}
                  />
                  <span className="text-xs text-slate-400">
                    {MONTHS_ES[month.monthNumber - 1].slice(0, 3)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Alertas y Estado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Estado del Mes */}
        <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Estado del Mes
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">Ingresos registrados</span>
              <span
                className={`flex items-center gap-1 text-sm ${
                  incomes.filter((i) => i.month === selectedMonth).length > 0
                    ? 'text-green-600'
                    : 'text-amber-600'
                }`}
              >
                {incomes.filter((i) => i.month === selectedMonth).length > 0 ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
                {incomes.filter((i) => i.month === selectedMonth).length} registros
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">Gastos registrados</span>
              <span
                className={`flex items-center gap-1 text-sm ${
                  expenses.filter((e) => e.month === selectedMonth).length > 0
                    ? 'text-green-600'
                    : 'text-amber-600'
                }`}
              >
                {expenses.filter((e) => e.month === selectedMonth).length > 0 ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
                {expenses.filter((e) => e.month === selectedMonth).length} registros
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">P&L generado</span>
              <span
                className={`flex items-center gap-1 text-sm ${
                  currentData ? 'text-green-600' : 'text-slate-400'
                }`}
              >
                {currentData ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
                {currentData ? 'Listo' : 'Pendiente'}
              </span>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800">
          <h3 className="font-semibold text-indigo-800 dark:text-indigo-300 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Tip del Día
          </h3>
          <p className="text-sm text-indigo-700 dark:text-indigo-300">
            {!currentData
              ? 'Carga tu archivo de Dropi para comenzar a ver tu P&L automáticamente.'
              : currentData.roas < 3
              ? 'Tu ROAS está por debajo de 3x. Considera optimizar tus campañas publicitarias.'
              : currentData.returnRate > 20
              ? 'Tu tasa de devolución es alta. Revisa la calidad de productos o tiempos de entrega.'
              : 'Tus métricas están saludables. Considera aumentar la inversión publicitaria para escalar.'}
          </p>
        </div>
      </div>
    </div>
  );

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-900">
      {/* Header con Tabs */}
      <div className="bg-white dark:bg-navy-800 border-b border-slate-200 dark:border-navy-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1 py-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all
                    ${
                      activeTab === tab.id
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-700'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'income' && <IncomeManager />}
        {activeTab === 'expenses' && <ExpensesManager />}
        {activeTab === 'pnl' && <ProfitLossReport />}
        {activeTab === 'history' && <FinancialHistory />}
      </div>
    </div>
  );
};

export default FinanceDashboard;
