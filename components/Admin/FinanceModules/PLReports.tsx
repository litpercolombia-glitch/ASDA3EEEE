// ============================================
// LITPER PRO - P&L REPORTS
// Estado de Pérdidas y Ganancias
// ============================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus,
  PieChart,
  BarChart3,
  FileSpreadsheet,
  RefreshCw,
  Info,
  Target,
  AlertTriangle,
} from 'lucide-react';
import * as XLSX from 'xlsx';

// ============================================
// TIPOS
// ============================================

interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  margin: number;
}

interface PLSummary {
  revenue: number;
  cost: number;
  grossProfit: number;
  operatingExpenses: {
    publicidad: number;
    nomina: number;
    servicios: number;
    logistica: number;
    otros: number;
    total: number;
  };
  operatingProfit: number;
  taxes: number;
  netProfit: number;
  margin: number;
}

// ============================================
// CONSTANTES
// ============================================

const INVOICES_KEY = 'litper_invoices';
const EXPENSES_KEY = 'litper_expenses';
const PAYROLL_KEY = 'litper_payroll';
const TAX_KEY = 'litper_tax_records';

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const PLReports: React.FC = () => {
  // Estados
  const [selectedPeriod, setSelectedPeriod] = useState(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );
  const [comparisonMode, setComparisonMode] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [payroll, setPayroll] = useState<any[]>([]);
  const [taxRecords, setTaxRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar datos
  useEffect(() => {
    setIsLoading(true);
    try {
      const savedInvoices = localStorage.getItem(INVOICES_KEY);
      const savedExpenses = localStorage.getItem(EXPENSES_KEY);
      const savedPayroll = localStorage.getItem(PAYROLL_KEY);
      const savedTax = localStorage.getItem(TAX_KEY);

      if (savedInvoices) setInvoices(JSON.parse(savedInvoices));
      if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
      if (savedPayroll) setPayroll(JSON.parse(savedPayroll));
      if (savedTax) setTaxRecords(JSON.parse(savedTax));
    } catch (err) {
      console.error('Error loading data:', err);
    }
    setIsLoading(false);
  }, []);

  // Formatear moneda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Calcular P&L del período
  const calculatePL = (period: string): PLSummary => {
    const [year, month] = period.split('-').map(Number);

    // Ingresos (facturas pagadas del período)
    const periodInvoices = invoices.filter(inv => {
      const invDate = new Date(inv.date);
      return invDate.getFullYear() === year &&
             invDate.getMonth() + 1 === month &&
             inv.status === 'pagada';
    });
    const revenue = periodInvoices.reduce((sum, inv) => sum + (inv.subtotal || 0), 0);

    // Gastos por categoría
    const periodExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate.getFullYear() === year && expDate.getMonth() + 1 === month;
    });

    const expensesByCategory = {
      publicidad: periodExpenses.filter(e => e.category === 'publicidad').reduce((s, e) => s + e.amount, 0),
      nomina: 0,
      servicios: periodExpenses.filter(e => e.category === 'servicios').reduce((s, e) => s + e.amount, 0),
      logistica: periodExpenses.filter(e => e.category === 'logistica').reduce((s, e) => s + e.amount, 0),
      otros: periodExpenses.filter(e => e.category === 'otros').reduce((s, e) => s + e.amount, 0),
      total: 0,
    };

    // Nómina del período
    const periodPayroll = payroll.filter(p => p.period === period);
    expensesByCategory.nomina = periodPayroll.reduce((sum, p) => sum + (p.netPay || 0), 0);

    // También agregar gastos categorizados como nómina
    expensesByCategory.nomina += periodExpenses.filter(e => e.category === 'nomina').reduce((s, e) => s + e.amount, 0);

    expensesByCategory.total = Object.values(expensesByCategory).reduce((a, b) => a + b, 0) - expensesByCategory.total;

    // Costo de ventas (aproximado como 30% de los ingresos si no hay datos específicos)
    const cost = revenue * 0.30;

    const grossProfit = revenue - cost;
    const operatingProfit = grossProfit - expensesByCategory.total;

    // Impuestos del período
    const periodTax = taxRecords.filter(t => t.period === period);
    const taxes = periodTax.reduce((sum, t) => sum + (t.taxAmount || 0), 0);

    const netProfit = operatingProfit - taxes;
    const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    return {
      revenue,
      cost,
      grossProfit,
      operatingExpenses: expensesByCategory,
      operatingProfit,
      taxes,
      netProfit,
      margin,
    };
  };

  // P&L actual
  const currentPL = useMemo(() => calculatePL(selectedPeriod), [selectedPeriod, invoices, expenses, payroll, taxRecords]);

  // P&L mes anterior para comparación
  const previousPeriod = useMemo(() => {
    const [year, month] = selectedPeriod.split('-').map(Number);
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    return `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
  }, [selectedPeriod]);

  const previousPL = useMemo(() => calculatePL(previousPeriod), [previousPeriod, invoices, expenses, payroll, taxRecords]);

  // Variación porcentual
  const variation = (current: number, previous: number): { value: number; type: 'up' | 'down' | 'neutral' } => {
    if (previous === 0) return { value: 0, type: 'neutral' };
    const pct = ((current - previous) / Math.abs(previous)) * 100;
    return {
      value: Math.abs(pct),
      type: pct > 0 ? 'up' : pct < 0 ? 'down' : 'neutral',
    };
  };

  // Datos para gráfico mensual (últimos 6 meses)
  const monthlyData = useMemo((): MonthlyData[] => {
    const data: MonthlyData[] = [];
    const [year, month] = selectedPeriod.split('-').map(Number);

    for (let i = 5; i >= 0; i--) {
      let m = month - i;
      let y = year;
      if (m <= 0) {
        m += 12;
        y -= 1;
      }
      const period = `${y}-${String(m).padStart(2, '0')}`;
      const pl = calculatePL(period);
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      data.push({
        month: months[m - 1],
        revenue: pl.revenue,
        expenses: pl.operatingExpenses.total + pl.cost,
        profit: pl.netProfit,
        margin: pl.margin,
      });
    }

    return data;
  }, [selectedPeriod, invoices, expenses, payroll, taxRecords]);

  // Exportar a Excel
  const exportToExcel = () => {
    const plData = [
      ['ESTADO DE PÉRDIDAS Y GANANCIAS'],
      ['LITPER PRO'],
      [`Período: ${selectedPeriod}`],
      [''],
      ['CONCEPTO', 'VALOR'],
      [''],
      ['INGRESOS'],
      ['Ventas Netas', currentPL.revenue],
      [''],
      ['COSTO DE VENTAS'],
      ['Costo de Productos/Servicios', currentPL.cost],
      [''],
      ['UTILIDAD BRUTA', currentPL.grossProfit],
      [''],
      ['GASTOS OPERACIONALES'],
      ['Publicidad y Marketing', currentPL.operatingExpenses.publicidad],
      ['Nómina y Personal', currentPL.operatingExpenses.nomina],
      ['Servicios', currentPL.operatingExpenses.servicios],
      ['Logística y Envíos', currentPL.operatingExpenses.logistica],
      ['Otros Gastos', currentPL.operatingExpenses.otros],
      ['Total Gastos Operacionales', currentPL.operatingExpenses.total],
      [''],
      ['UTILIDAD OPERACIONAL', currentPL.operatingProfit],
      [''],
      ['IMPUESTOS', currentPL.taxes],
      [''],
      ['UTILIDAD NETA', currentPL.netProfit],
      [''],
      ['MARGEN DE UTILIDAD', `${currentPL.margin.toFixed(2)}%`],
    ];

    const ws = XLSX.utils.aoa_to_sheet(plData);

    // Ajustar anchos de columna
    ws['!cols'] = [{ wch: 30 }, { wch: 20 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'P&L');

    // Agregar hoja de datos mensuales
    const monthlySheet = XLSX.utils.json_to_sheet(monthlyData.map(d => ({
      Mes: d.month,
      Ingresos: d.revenue,
      Gastos: d.expenses,
      Utilidad: d.profit,
      'Margen %': `${d.margin.toFixed(2)}%`,
    })));
    XLSX.utils.book_append_sheet(wb, monthlySheet, 'Histórico');

    XLSX.writeFile(wb, `PL_LITPER_${selectedPeriod}.xlsx`);
  };

  // Renderizar variación
  const renderVariation = (current: number, previous: number, inverted = false) => {
    const v = variation(current, previous);
    const isPositive = inverted ? v.type === 'down' : v.type === 'up';
    const isNegative = inverted ? v.type === 'up' : v.type === 'down';

    if (v.type === 'neutral') {
      return <span className="text-xs text-slate-400 flex items-center gap-1"><Minus className="w-3 h-3" /> 0%</span>;
    }

    return (
      <span className={`text-xs flex items-center gap-1 ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
        {v.type === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
        {v.value.toFixed(1)}%
      </span>
    );
  };

  // Max value for bar chart scaling
  const maxValue = useMemo(() => {
    return Math.max(...monthlyData.map(d => Math.max(d.revenue, d.expenses)));
  }, [monthlyData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-emerald-500" />
            Estado de Pérdidas y Ganancias
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Análisis financiero detallado con comparativos
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-400" />
            <input
              type="month"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <button
            onClick={() => setComparisonMode(!comparisonMode)}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              comparisonMode
                ? 'bg-emerald-500 text-white'
                : 'bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            Comparar
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-all"
          >
            <Download className="w-5 h-5" />
            Exportar Excel
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl text-white">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-white/70" />
            {comparisonMode && renderVariation(currentPL.revenue, previousPL.revenue)}
          </div>
          <p className="text-2xl font-black">{formatCurrency(currentPL.revenue)}</p>
          <p className="text-emerald-100 text-sm">Ingresos</p>
        </div>

        <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl text-white">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-5 h-5 text-white/70" />
            {comparisonMode && renderVariation(currentPL.grossProfit, previousPL.grossProfit)}
          </div>
          <p className="text-2xl font-black">{formatCurrency(currentPL.grossProfit)}</p>
          <p className="text-blue-100 text-sm">Utilidad Bruta</p>
        </div>

        <div className={`p-4 rounded-2xl text-white ${
          currentPL.netProfit >= 0
            ? 'bg-gradient-to-br from-green-500 to-emerald-500'
            : 'bg-gradient-to-br from-red-500 to-pink-500'
        }`}>
          <div className="flex items-center justify-between mb-2">
            {currentPL.netProfit >= 0 ? (
              <TrendingUp className="w-5 h-5 text-white/70" />
            ) : (
              <TrendingDown className="w-5 h-5 text-white/70" />
            )}
            {comparisonMode && renderVariation(currentPL.netProfit, previousPL.netProfit)}
          </div>
          <p className="text-2xl font-black">{formatCurrency(currentPL.netProfit)}</p>
          <p className="text-white/80 text-sm">Utilidad Neta</p>
        </div>

        <div className={`p-4 rounded-2xl text-white ${
          currentPL.margin >= 20
            ? 'bg-gradient-to-br from-purple-500 to-violet-500'
            : currentPL.margin >= 10
            ? 'bg-gradient-to-br from-amber-500 to-orange-500'
            : 'bg-gradient-to-br from-red-500 to-rose-500'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <PieChart className="w-5 h-5 text-white/70" />
            {comparisonMode && renderVariation(currentPL.margin, previousPL.margin)}
          </div>
          <p className="text-2xl font-black">{currentPL.margin.toFixed(1)}%</p>
          <p className="text-white/80 text-sm">Margen Neto</p>
        </div>
      </div>

      {/* P&L Detail */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Estado de Resultados */}
        <div className="bg-white dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-navy-700 overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-navy-900 border-b border-slate-200 dark:border-navy-700">
            <h3 className="font-bold text-slate-700 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
              Estado de Resultados - {selectedPeriod}
            </h3>
          </div>

          <div className="p-4 space-y-4">
            {/* Ingresos */}
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-navy-700">
                <span className="font-bold text-slate-700 dark:text-white">INGRESOS</span>
                <span className="font-bold text-emerald-600">{formatCurrency(currentPL.revenue)}</span>
              </div>
              <div className="flex justify-between items-center pl-4 text-sm">
                <span className="text-slate-500">Ventas Netas</span>
                <span className="text-slate-700 dark:text-slate-300">{formatCurrency(currentPL.revenue)}</span>
              </div>
            </div>

            {/* Costo de Ventas */}
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-navy-700">
                <span className="font-bold text-slate-700 dark:text-white">COSTO DE VENTAS</span>
                <span className="font-bold text-red-600">-{formatCurrency(currentPL.cost)}</span>
              </div>
            </div>

            {/* Utilidad Bruta */}
            <div className="flex justify-between items-center py-2 bg-blue-50 dark:bg-blue-900/20 px-3 rounded-lg">
              <span className="font-bold text-slate-700 dark:text-white">UTILIDAD BRUTA</span>
              <span className="font-bold text-blue-600">{formatCurrency(currentPL.grossProfit)}</span>
            </div>

            {/* Gastos Operacionales */}
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-navy-700">
                <span className="font-bold text-slate-700 dark:text-white">GASTOS OPERACIONALES</span>
                <span className="font-bold text-red-600">-{formatCurrency(currentPL.operatingExpenses.total)}</span>
              </div>
              {[
                { label: 'Publicidad y Marketing', value: currentPL.operatingExpenses.publicidad },
                { label: 'Nómina y Personal', value: currentPL.operatingExpenses.nomina },
                { label: 'Servicios', value: currentPL.operatingExpenses.servicios },
                { label: 'Logística', value: currentPL.operatingExpenses.logistica },
                { label: 'Otros', value: currentPL.operatingExpenses.otros },
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center pl-4 text-sm">
                  <span className="text-slate-500">{item.label}</span>
                  <span className="text-slate-700 dark:text-slate-300">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>

            {/* Utilidad Operacional */}
            <div className="flex justify-between items-center py-2 bg-amber-50 dark:bg-amber-900/20 px-3 rounded-lg">
              <span className="font-bold text-slate-700 dark:text-white">UTILIDAD OPERACIONAL</span>
              <span className={`font-bold ${currentPL.operatingProfit >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                {formatCurrency(currentPL.operatingProfit)}
              </span>
            </div>

            {/* Impuestos */}
            <div className="flex justify-between items-center pl-4 text-sm">
              <span className="text-slate-500">Impuestos</span>
              <span className="text-red-500">-{formatCurrency(currentPL.taxes)}</span>
            </div>

            {/* Utilidad Neta */}
            <div className={`flex justify-between items-center py-3 px-4 rounded-lg ${
              currentPL.netProfit >= 0
                ? 'bg-emerald-100 dark:bg-emerald-900/30'
                : 'bg-red-100 dark:bg-red-900/30'
            }`}>
              <span className="font-black text-slate-800 dark:text-white">UTILIDAD NETA</span>
              <span className={`font-black text-xl ${
                currentPL.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {formatCurrency(currentPL.netProfit)}
              </span>
            </div>
          </div>
        </div>

        {/* Gráfico */}
        <div className="bg-white dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-navy-700 overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-navy-900 border-b border-slate-200 dark:border-navy-700">
            <h3 className="font-bold text-slate-700 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-500" />
              Ingresos vs Gastos (Últimos 6 meses)
            </h3>
          </div>

          <div className="p-4">
            {/* Chart Legend */}
            <div className="flex justify-center gap-6 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                <span className="text-sm text-slate-500">Ingresos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-400" />
                <span className="text-sm text-slate-500">Gastos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span className="text-sm text-slate-500">Utilidad</span>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="flex items-end justify-around gap-2 h-48">
              {monthlyData.map((data, idx) => {
                const revenueHeight = maxValue > 0 ? (data.revenue / maxValue) * 100 : 0;
                const expenseHeight = maxValue > 0 ? (data.expenses / maxValue) * 100 : 0;
                return (
                  <div key={idx} className="flex flex-col items-center gap-1 flex-1">
                    <div className="flex items-end gap-1 h-40">
                      <div
                        className="w-4 bg-emerald-500 rounded-t transition-all"
                        style={{ height: `${revenueHeight}%` }}
                        title={`Ingresos: ${formatCurrency(data.revenue)}`}
                      />
                      <div
                        className="w-4 bg-red-400 rounded-t transition-all"
                        style={{ height: `${expenseHeight}%` }}
                        title={`Gastos: ${formatCurrency(data.expenses)}`}
                      />
                    </div>
                    <span className="text-xs text-slate-500">{data.month}</span>
                    <span className={`text-xs font-bold ${data.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {data.margin.toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Monthly Summary Table */}
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-navy-700">
                    <th className="text-left py-2 text-xs text-slate-500">Mes</th>
                    <th className="text-right py-2 text-xs text-slate-500">Ingresos</th>
                    <th className="text-right py-2 text-xs text-slate-500">Gastos</th>
                    <th className="text-right py-2 text-xs text-slate-500">Utilidad</th>
                    <th className="text-right py-2 text-xs text-slate-500">Margen</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((data, idx) => (
                    <tr key={idx} className="border-b border-slate-100 dark:border-navy-700">
                      <td className="py-2 font-medium text-slate-700 dark:text-white">{data.month}</td>
                      <td className="py-2 text-right text-emerald-600">{formatCurrency(data.revenue)}</td>
                      <td className="py-2 text-right text-red-500">{formatCurrency(data.expenses)}</td>
                      <td className={`py-2 text-right font-bold ${data.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatCurrency(data.profit)}
                      </td>
                      <td className={`py-2 text-right ${data.margin >= 10 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {data.margin.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Comparativo */}
      {comparisonMode && (
        <div className="bg-white dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-navy-700 p-6">
          <h3 className="font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Comparativo: {selectedPeriod} vs {previousPeriod}
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-200 dark:border-navy-700">
                  <th className="text-left py-3 text-sm font-bold text-slate-500">Concepto</th>
                  <th className="text-right py-3 text-sm font-bold text-slate-500">{previousPeriod}</th>
                  <th className="text-right py-3 text-sm font-bold text-slate-500">{selectedPeriod}</th>
                  <th className="text-right py-3 text-sm font-bold text-slate-500">Variación</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Ingresos', current: currentPL.revenue, previous: previousPL.revenue },
                  { label: 'Costo de Ventas', current: currentPL.cost, previous: previousPL.cost, inverted: true },
                  { label: 'Utilidad Bruta', current: currentPL.grossProfit, previous: previousPL.grossProfit },
                  { label: 'Gastos Operacionales', current: currentPL.operatingExpenses.total, previous: previousPL.operatingExpenses.total, inverted: true },
                  { label: 'Utilidad Operacional', current: currentPL.operatingProfit, previous: previousPL.operatingProfit },
                  { label: 'Impuestos', current: currentPL.taxes, previous: previousPL.taxes, inverted: true },
                  { label: 'Utilidad Neta', current: currentPL.netProfit, previous: previousPL.netProfit },
                ].map((row, idx) => {
                  const v = variation(row.current, row.previous);
                  return (
                    <tr key={idx} className="border-b border-slate-100 dark:border-navy-700">
                      <td className="py-3 font-medium text-slate-700 dark:text-white">{row.label}</td>
                      <td className="py-3 text-right text-slate-500">{formatCurrency(row.previous)}</td>
                      <td className="py-3 text-right font-bold text-slate-700 dark:text-white">{formatCurrency(row.current)}</td>
                      <td className="py-3 text-right">
                        {renderVariation(row.current, row.previous, row.inverted)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info */}
      {invoices.length === 0 && expenses.length === 0 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-700 dark:text-white mb-1">Sin datos para mostrar</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                El reporte P&L se genera automáticamente con los datos de Facturación, Gastos y Nómina.
                Agrega datos en esos módulos para ver el análisis financiero.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PLReports;
