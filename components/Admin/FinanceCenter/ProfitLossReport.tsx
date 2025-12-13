// components/admin/FinanceCenter/ProfitLossReport.tsx
// Estado de Pérdidas y Ganancias Profesional

import React, { useMemo } from 'react';
import {
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Printer,
  Share2,
  Calendar,
  BarChart3,
  PieChart,
} from 'lucide-react';
import {
  useFinanceStore,
  formatCurrency,
  formatPercentage,
  getMonthName,
  getPreviousMonth,
  type MonthlyFinancial,
} from '../../../services/financeService';

// ============================================
// COMPONENTE DE LÍNEA DE P&L
// ============================================
interface PLLineProps {
  label: string;
  amount: number;
  previousAmount?: number;
  isTotal?: boolean;
  isSubtotal?: boolean;
  isPositive?: boolean;
  isNegative?: boolean;
  indent?: number;
  percentage?: number;
  showPercentage?: boolean;
}

const PLLine: React.FC<PLLineProps> = ({
  label,
  amount,
  previousAmount,
  isTotal,
  isSubtotal,
  isPositive,
  isNegative,
  indent = 0,
  percentage,
  showPercentage = true,
}) => {
  const change = previousAmount !== undefined ? amount - previousAmount : 0;
  const changePercent =
    previousAmount && previousAmount !== 0 ? ((amount - previousAmount) / previousAmount) * 100 : 0;

  return (
    <div
      className={`
        flex items-center justify-between py-2 px-4
        ${isTotal ? 'bg-slate-100 dark:bg-navy-700 font-bold' : ''}
        ${isSubtotal ? 'font-semibold border-t border-slate-200 dark:border-navy-600' : ''}
        ${indent > 0 ? `pl-${4 + indent * 4}` : ''}
      `}
      style={{ paddingLeft: indent > 0 ? `${16 + indent * 16}px` : undefined }}
    >
      <span
        className={`
          ${isTotal ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}
          ${isNegative && !isTotal ? 'text-slate-600 dark:text-slate-400' : ''}
        `}
      >
        {isNegative && !isTotal && '(-) '}
        {label}
      </span>

      <div className="flex items-center gap-4">
        {showPercentage && percentage !== undefined && (
          <span className="text-sm text-slate-500 dark:text-slate-400 w-16 text-right">
            {formatPercentage(percentage)}
          </span>
        )}

        {previousAmount !== undefined && change !== 0 && (
          <span
            className={`flex items-center gap-1 text-xs ${
              change > 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {change > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {Math.abs(changePercent).toFixed(1)}%
          </span>
        )}

        <span
          className={`
            font-mono w-32 text-right
            ${isTotal ? 'text-lg' : ''}
            ${isPositive ? 'text-green-600 dark:text-green-400' : ''}
            ${isNegative && amount !== 0 ? 'text-red-600 dark:text-red-400' : ''}
            ${!isPositive && !isNegative ? 'text-slate-800 dark:text-white' : ''}
          `}
        >
          {formatCurrency(amount)}
        </span>
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE DE KPI
// ============================================
interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color: string;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  color,
}) => (
  <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
        <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
        {subtitle && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>
        )}
      </div>
      <div className={`p-2 rounded-lg ${color.replace('text-', 'bg-').replace('600', '100')} dark:bg-opacity-20`}>
        {icon}
      </div>
    </div>
    {trend && trendValue && (
      <div className="flex items-center gap-1 mt-2">
        {trend === 'up' && <ArrowUp className="w-3 h-3 text-green-500" />}
        {trend === 'down' && <ArrowDown className="w-3 h-3 text-red-500" />}
        {trend === 'neutral' && <Minus className="w-3 h-3 text-slate-400" />}
        <span
          className={`text-xs ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-slate-500'
          }`}
        >
          {trendValue} vs mes anterior
        </span>
      </div>
    )}
  </div>
);

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const ProfitLossReport: React.FC = () => {
  const { selectedMonth, setSelectedMonth, getMonthlyReport, getYearlyReport } = useFinanceStore();

  const currentData = getMonthlyReport(selectedMonth);
  const previousMonth = getPreviousMonth(selectedMonth);
  const previousData = getMonthlyReport(previousMonth);

  // Calcular tendencias
  const getTrend = (current: number, previous: number | undefined): 'up' | 'down' | 'neutral' => {
    if (!previous) return 'neutral';
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'neutral';
  };

  const getTrendValue = (current: number, previous: number | undefined): string => {
    if (!previous || previous === 0) return 'N/A';
    const change = ((current - previous) / previous) * 100;
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  // Exportar a PDF (simula impresión)
  const handlePrint = () => {
    window.print();
  };

  // Exportar datos
  const handleExport = () => {
    if (!currentData) return;

    const csvContent = `
Estado de Pérdidas y Ganancias
${getMonthName(selectedMonth)} ${currentData.year}

INGRESOS
Ventas Brutas,${currentData.grossSales}
(-) Devoluciones,${currentData.returnsCost}
Ventas Netas,${currentData.netSales}

COSTO DE VENTAS
Costo de Productos,${currentData.productCost}
Costo de Fletes,${currentData.shippingCost}
Costo de Devoluciones,${currentData.returnsCost}
Comisiones,${currentData.commissions}
Total Costo de Ventas,${currentData.totalCostOfSales}

UTILIDAD BRUTA,${currentData.grossProfit}
Margen Bruto,${currentData.grossMargin}%

GASTOS OPERATIVOS
Publicidad,${currentData.advertisingExpenses}
Gastos Fijos,${currentData.fixedExpenses}
Gastos Variables,${currentData.variableExpenses}
Total Gastos Operativos,${currentData.totalOperatingExpenses}

UTILIDAD NETA,${currentData.netProfit}
Margen Neto,${currentData.netMargin}%

KPIs
ROAS,${currentData.roas}
CPA,${currentData.cpa}
AOV,${currentData.aov}
Tasa de Entrega,${currentData.deliveryRate}%
Tasa de Devolución,${currentData.returnRate}%
    `.trim();

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PYG_${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!currentData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-500" />
            Estado de Pérdidas y Ganancias
          </h2>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-slate-800 dark:text-white"
          />
        </div>

        <div className="bg-white dark:bg-navy-800 rounded-xl p-12 border border-slate-200 dark:border-navy-700 text-center">
          <FileText className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
            No hay datos para este mes
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            Carga ingresos y gastos para generar el P&L
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-500" />
            Estado de Pérdidas y Ganancias
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {getMonthName(selectedMonth)} {currentData.year}
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
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-navy-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-navy-600 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 print:grid-cols-5">
        <KPICard
          title="Ventas Netas"
          value={formatCurrency(currentData.netSales)}
          icon={<DollarSign className="w-5 h-5 text-green-600" />}
          color="text-green-600"
          trend={getTrend(currentData.netSales, previousData?.netSales)}
          trendValue={getTrendValue(currentData.netSales, previousData?.netSales)}
        />
        <KPICard
          title="Utilidad Neta"
          value={formatCurrency(currentData.netProfit)}
          subtitle={`${formatPercentage(currentData.netMargin)} margen`}
          icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
          color={currentData.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}
          trend={getTrend(currentData.netProfit, previousData?.netProfit)}
          trendValue={getTrendValue(currentData.netProfit, previousData?.netProfit)}
        />
        <KPICard
          title="ROAS"
          value={`${currentData.roas.toFixed(1)}x`}
          subtitle={`$${currentData.cpa.toLocaleString()} CPA`}
          icon={<Target className="w-5 h-5 text-purple-600" />}
          color="text-purple-600"
          trend={getTrend(currentData.roas, previousData?.roas)}
          trendValue={getTrendValue(currentData.roas, previousData?.roas)}
        />
        <KPICard
          title="Tasa Entrega"
          value={formatPercentage(currentData.deliveryRate)}
          subtitle={`${currentData.deliveredOrders}/${currentData.totalOrders} pedidos`}
          icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
          color="text-emerald-600"
          trend={getTrend(currentData.deliveryRate, previousData?.deliveryRate)}
          trendValue={getTrendValue(currentData.deliveryRate, previousData?.deliveryRate)}
        />
        <KPICard
          title="Ticket Promedio"
          value={formatCurrency(currentData.aov)}
          icon={<BarChart3 className="w-5 h-5 text-amber-600" />}
          color="text-amber-600"
          trend={getTrend(currentData.aov, previousData?.aov)}
          trendValue={getTrendValue(currentData.aov, previousData?.aov)}
        />
      </div>

      {/* P&L Principal */}
      <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 overflow-hidden print:shadow-none">
        {/* Header del reporte */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white print:bg-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">LITPER PRO</h3>
              <p className="opacity-90">Estado de Pérdidas y Ganancias</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">{getMonthName(selectedMonth)} {currentData.year}</p>
              <p className="text-sm opacity-90">Período: {selectedMonth}-01 al {selectedMonth}-31</p>
            </div>
          </div>
        </div>

        {/* Contenido del P&L */}
        <div className="divide-y divide-slate-200 dark:divide-navy-700">
          {/* INGRESOS */}
          <div className="bg-green-50 dark:bg-green-900/10 p-2">
            <span className="text-sm font-bold text-green-800 dark:text-green-400 px-4">
              INGRESOS
            </span>
          </div>
          <PLLine
            label="Ventas Brutas"
            amount={currentData.grossSales}
            previousAmount={previousData?.grossSales}
            percentage={100}
          />
          <PLLine
            label="Devoluciones"
            amount={currentData.returnsCost}
            previousAmount={previousData?.returnsCost}
            isNegative
            percentage={
              currentData.grossSales > 0
                ? (currentData.returnsCost / currentData.grossSales) * 100
                : 0
            }
          />
          <PLLine
            label="Ventas Netas"
            amount={currentData.netSales}
            previousAmount={previousData?.netSales}
            isSubtotal
            percentage={
              currentData.grossSales > 0
                ? (currentData.netSales / currentData.grossSales) * 100
                : 0
            }
          />

          {/* COSTO DE VENTAS */}
          <div className="bg-orange-50 dark:bg-orange-900/10 p-2">
            <span className="text-sm font-bold text-orange-800 dark:text-orange-400 px-4">
              COSTO DE VENTAS
            </span>
          </div>
          <PLLine
            label="Costo de Productos"
            amount={currentData.productCost}
            previousAmount={previousData?.productCost}
            isNegative
            indent={1}
            percentage={
              currentData.netSales > 0
                ? (currentData.productCost / currentData.netSales) * 100
                : 0
            }
          />
          <PLLine
            label="Costo de Fletes"
            amount={currentData.shippingCost}
            previousAmount={previousData?.shippingCost}
            isNegative
            indent={1}
            percentage={
              currentData.netSales > 0
                ? (currentData.shippingCost / currentData.netSales) * 100
                : 0
            }
          />
          <PLLine
            label="Comisiones"
            amount={currentData.commissions}
            previousAmount={previousData?.commissions}
            isNegative
            indent={1}
            percentage={
              currentData.netSales > 0
                ? (currentData.commissions / currentData.netSales) * 100
                : 0
            }
          />
          <PLLine
            label="Total Costo de Ventas"
            amount={currentData.totalCostOfSales}
            previousAmount={previousData?.totalCostOfSales}
            isSubtotal
            isNegative
            percentage={
              currentData.netSales > 0
                ? (currentData.totalCostOfSales / currentData.netSales) * 100
                : 0
            }
          />

          {/* UTILIDAD BRUTA */}
          <PLLine
            label="UTILIDAD BRUTA"
            amount={currentData.grossProfit}
            previousAmount={previousData?.grossProfit}
            isTotal
            isPositive={currentData.grossProfit >= 0}
            isNegative={currentData.grossProfit < 0}
            percentage={currentData.grossMargin}
          />

          {/* GASTOS OPERATIVOS */}
          <div className="bg-red-50 dark:bg-red-900/10 p-2">
            <span className="text-sm font-bold text-red-800 dark:text-red-400 px-4">
              GASTOS OPERATIVOS
            </span>
          </div>
          <PLLine
            label="Publicidad y Marketing"
            amount={currentData.advertisingExpenses}
            previousAmount={previousData?.advertisingExpenses}
            isNegative
            indent={1}
            percentage={
              currentData.netSales > 0
                ? (currentData.advertisingExpenses / currentData.netSales) * 100
                : 0
            }
          />
          <PLLine
            label="Gastos Fijos"
            amount={currentData.fixedExpenses}
            previousAmount={previousData?.fixedExpenses}
            isNegative
            indent={1}
            percentage={
              currentData.netSales > 0
                ? (currentData.fixedExpenses / currentData.netSales) * 100
                : 0
            }
          />
          <PLLine
            label="Gastos Variables"
            amount={currentData.variableExpenses}
            previousAmount={previousData?.variableExpenses}
            isNegative
            indent={1}
            percentage={
              currentData.netSales > 0
                ? (currentData.variableExpenses / currentData.netSales) * 100
                : 0
            }
          />
          <PLLine
            label="Total Gastos Operativos"
            amount={currentData.totalOperatingExpenses}
            previousAmount={previousData?.totalOperatingExpenses}
            isSubtotal
            isNegative
            percentage={
              currentData.netSales > 0
                ? (currentData.totalOperatingExpenses / currentData.netSales) * 100
                : 0
            }
          />

          {/* UTILIDAD NETA */}
          <div
            className={`p-4 ${
              currentData.netProfit >= 0
                ? 'bg-green-100 dark:bg-green-900/20'
                : 'bg-red-100 dark:bg-red-900/20'
            }`}
          >
            <PLLine
              label="UTILIDAD NETA"
              amount={currentData.netProfit}
              previousAmount={previousData?.netProfit}
              isTotal
              isPositive={currentData.netProfit >= 0}
              isNegative={currentData.netProfit < 0}
              percentage={currentData.netMargin}
            />
          </div>
        </div>
      </div>

      {/* Alertas y Recomendaciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
        {/* Alertas */}
        <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Alertas
          </h3>
          <div className="space-y-2">
            {currentData.netMargin < 10 && (
              <div className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  Margen neto bajo ({formatPercentage(currentData.netMargin)}). Revisar costos o precios.
                </p>
              </div>
            )}
            {currentData.returnRate > 20 && (
              <div className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-300">
                  Tasa de devolución alta ({formatPercentage(currentData.returnRate)}). Investigar causas.
                </p>
              </div>
            )}
            {currentData.roas < 3 && currentData.advertisingExpenses > 0 && (
              <div className="flex items-start gap-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5" />
                <p className="text-sm text-orange-800 dark:text-orange-300">
                  ROAS bajo ({currentData.roas.toFixed(1)}x). Optimizar campañas publicitarias.
                </p>
              </div>
            )}
            {currentData.netMargin >= 10 && currentData.returnRate <= 20 && currentData.roas >= 3 && (
              <div className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <p className="text-sm text-green-800 dark:text-green-300">
                  Todos los indicadores están en rango saludable.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Resumen Ejecutivo */}
        <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Resumen Ejecutivo
          </h3>
          <div className="space-y-3 text-sm">
            <p className="text-slate-600 dark:text-slate-300">
              En {getMonthName(selectedMonth)}, se procesaron{' '}
              <strong>{currentData.totalOrders.toLocaleString()}</strong> pedidos con una tasa de
              entrega del <strong>{formatPercentage(currentData.deliveryRate)}</strong>.
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              Las ventas netas alcanzaron{' '}
              <strong>{formatCurrency(currentData.netSales)}</strong> con una utilidad neta de{' '}
              <strong
                className={currentData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}
              >
                {formatCurrency(currentData.netProfit)}
              </strong>{' '}
              ({formatPercentage(currentData.netMargin)} de margen).
            </p>
            {currentData.advertisingExpenses > 0 && (
              <p className="text-slate-600 dark:text-slate-300">
                La inversión publicitaria de{' '}
                <strong>{formatCurrency(currentData.advertisingExpenses)}</strong> generó un ROAS
                de <strong>{currentData.roas.toFixed(1)}x</strong> con un CPA de{' '}
                <strong>{formatCurrency(currentData.cpa)}</strong>.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitLossReport;
